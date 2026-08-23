import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Loader2 } from "lucide-react";
import { useCustomers } from "@/hooks/useCustomers";
import { useAllCustomerCategoryTypes } from "@/hooks/useSettings";
import {
  useCreateRateRequest,
  useSendRateRequestEmail,
} from "@/hooks/useSales";
import { toast } from "sonner";
import { SendEmailModal } from "@/components/common/SendEmailModal";
import { useAuth } from "@/contexts/AuthContext";
import { rateRequestApi } from "@/services/api/sales";

interface SendRateRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: number;
  onSuccess?: () => void;
}

export function SendRateRequestModal({
  open,
  onOpenChange,
  leadId,
  onSuccess,
}: SendRateRequestModalProps) {
  // vendorTypeId drives the client-side narrowing of the Vendor Name dropdown.
  // vendorTypeName is the human-readable string sent in the createRateRequest payload.
  const [vendorTypeId, setVendorTypeId] = useState<string>("");
  const [vendorId, setVendorId] = useState<string>("");
  const [vendorEmail, setVendorEmail] = useState<string>("");
  const [internalNotes, setInternalNotes] = useState<string>("");
  const [step, setStep] = useState<"form" | "email">("form");
  const [newRateRequestId, setNewRateRequestId] = useState<number | null>(null);
  const [newRateRequestNumber, setNewRateRequestNumber] = useState<string>("");

  const { user } = useAuth();

  // Load customer category types (for Vendor Type dropdown)
  const { data: categoryTypes, isLoading: loadingCategoryTypes } =
    useAllCustomerCategoryTypes();

  // Load ALL Creditors. Vendor Type is metadata for the rate-request payload;
  // it does NOT filter this dropdown. (Filtering by category previously hid
  // most creditors because the legacy customer_type tags don't always align
  // with the Vendor Type lookup categories.)
  const { data: customersData, isLoading: loadingCustomers } = useCustomers({
    pageSize: 1000,
    masterType: "Creditors",
  });

  const createRateRequest = useCreateRateRequest();
  const sendEmail = useSendRateRequestEmail();

  const vendorTypeName = useMemo(
    () =>
      categoryTypes?.find((c) => c.id.toString() === vendorTypeId)?.name ?? "",
    [categoryTypes, vendorTypeId],
  );

  // Client-side narrowing by category ID. Loaded list = all creditors;
  // picking a Vendor Type restricts to creditors whose CustomerCategories
  // contain that category id. Filtering by ID (not name) avoids the
  // string-mismatch failure mode that caused the original empty-dropdown bug.
  const filteredVendors = useMemo(() => {
    const all = customersData?.items ?? [];
    if (!vendorTypeId) return all;
    const targetId = parseInt(vendorTypeId);
    return all.filter((c) => c.categories?.some((cat) => cat.id === targetId));
  }, [customersData?.items, vendorTypeId]);

  // Auto-populate email when vendor is selected
  useEffect(() => {
    if (vendorId && customersData?.items) {
      const selectedVendor = customersData.items.find(
        (c) => c.id === parseInt(vendorId),
      );
      if (selectedVendor) {
        setVendorEmail(selectedVendor.email || "");
      }
    }
  }, [vendorId, customersData?.items]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!open) {
      setVendorTypeId("");
      setVendorId("");
      setVendorEmail("");
      setInternalNotes("");
      setStep("form");
      setNewRateRequestId(null);
      setNewRateRequestNumber("");
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!vendorTypeId) {
      toast.error("Please select a vendor type");
      return;
    }
    if (!vendorId) {
      toast.error("Please select a vendor");
      return;
    }

    const selectedVendor = customersData?.items?.find(
      (c) => c.id === parseInt(vendorId),
    );

    try {
      const result = await createRateRequest.mutateAsync({
        leadId,
        vendorId: parseInt(vendorId),
        vendorName: selectedVendor?.name || "",
        vendorType: vendorTypeName,
        vendorEmail,
        internalNotes: internalNotes || undefined,
      });

      setNewRateRequestId(result);
      const createdRateRequest = await rateRequestApi.getById(result);
      setNewRateRequestNumber(createdRateRequest.data?.rateRequestNo ?? "");
      setStep("email");
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleSkipEmail = () => {
    toast.success("Rate request created successfully");
    onSuccess?.();
    onOpenChange(false);
  };

  const handleEmailOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      onSuccess?.();
    }
    onOpenChange(nextOpen);
  };

  const isLoading = loadingCategoryTypes || loadingCustomers;

  if (step === "email" && newRateRequestId !== null) {
    return (
      <SendEmailModal
        open={open}
        onOpenChange={handleEmailOpenChange}
        recipientEmail={vendorEmail}
        recipientLabel="Vendor"
        subject={`Rate Request${newRateRequestNumber ? ` ${newRateRequestNumber}` : ""}`}
        currentUserEmail={user?.email ?? ""}
        onSend={async (req) => {
          await sendEmail.mutateAsync({ id: newRateRequestId, data: req });
          onOpenChange(false);
          onSuccess?.();
        }}
        isSending={sendEmail.isPending}
        title="Send Rate Request Email"
        onSkip={handleSkipEmail}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-modal-md max-h-[90vh] overflow-hidden p-0 flex flex-col gap-0">
        <DialogHeader className="bg-modal-header text-white p-4 rounded-t-lg">
          <DialogTitle className="text-white text-lg font-semibold">
            Send Rate Request
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0">
          {isLoading ? (
            <div className="flex min-h-64 items-center justify-center p-6">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4 p-6">
              <div className="space-y-2">
                <Label>
                  Vendor Type <span className="text-red-500">*</span>
                </Label>
                <SearchableSelect
                  options={(categoryTypes || []).map((cat) => ({
                    value: cat.id.toString(),
                    label: cat.name,
                  }))}
                  value={vendorTypeId}
                  onValueChange={(value) => {
                    setVendorTypeId(value);
                    setVendorId("");
                    setVendorEmail("");
                  }}
                  placeholder="Select vendor type"
                  searchPlaceholder="Search vendor types..."
                />
              </div>

              <div className="space-y-2">
                <Label>
                  Vendor Name <span className="text-red-500">*</span>
                </Label>
                <SearchableSelect
                  options={filteredVendors.map((vendor) => ({
                    value: vendor.id.toString(),
                    label: vendor.name,
                  }))}
                  value={vendorId}
                  onValueChange={setVendorId}
                  placeholder="Select vendor"
                  searchPlaceholder="Search vendors..."
                  emptyMessage={
                    loadingCustomers
                      ? "Loading..."
                      : vendorTypeId
                        ? "No creditors tagged with this vendor type - clear Vendor Type to see all"
                        : "No creditors found"
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Vendor Email</Label>
                <Input
                  value={vendorEmail}
                  onChange={(e) => setVendorEmail(e.target.value)}
                  placeholder="vendor@email.com"
                />
              </div>

              <div className="space-y-2">
                <Label>Internal Sales Notes</Label>
                <Textarea
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="Private notes for the internal sales team"
                  rows={4}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="shrink-0 gap-2 border-t border-border bg-card px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!vendorTypeId || !vendorId || createRateRequest.isPending}
            className="btn-success"
          >
            {createRateRequest.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Next: Prepare Email"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
