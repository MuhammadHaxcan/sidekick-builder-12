import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Loader2, ArrowLeft, History, Printer, Mail } from "lucide-react";
import {
  useRateRequest,
  useLead,
  useCreateRateRequest,
  useUpdateRateRequest,
  useSendRateRequestEmail,
} from "@/hooks/useSales";
import { useAllCustomerCategoryTypes } from "@/hooks/useSettings";
import { useAllCreditors } from "@/hooks/useCustomers";
import { LockedLeadSections } from "@/components/leads/LockedLeadSections";
import { SalesActivityLog } from "@/components/sales/SalesActivityLog";
import { SalesActivityLogModal } from "@/components/sales/SalesActivityLogModal";
import { SendEmailModal } from "@/components/common/SendEmailModal";
import { useAuth } from "@/contexts/AuthContext";
import { rateRequestApi } from "@/services/api/sales";
import { useSalespersonLookup } from "@/hooks/useSalespersons";

const READONLY_INPUT = "bg-muted cursor-not-allowed";

export default function RateRequestForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const rateRequestId = id ? parseInt(id) : null;
  const isEditing = !!rateRequestId;

  // Resolve which lead to fetch:
  //   new  → ?leadId=X query param
  //   view/edit → rateRequest.leadId after the rate request loads
  const queryLeadId = searchParams.get("leadId");

  const { data: rateRequest, isLoading: isRateRequestLoading, refetch: refetchRateRequest } = useRateRequest(rateRequestId || 0);

  const leadId = isEditing
    ? rateRequest?.leadId ?? 0
    : queryLeadId
      ? parseInt(queryLeadId)
      : 0;

  const { data: lead, isLoading: isLeadLoading } = useLead(leadId);

  // Vendor / category lookups for the Rate Request Details card
  const { data: categoryTypesData } = useAllCustomerCategoryTypes();
  const { data: vendorsData } = useAllCreditors();
  const categoryTypes = useMemo(() => Array.isArray(categoryTypesData) ? categoryTypesData : [], [categoryTypesData]);
  const vendors = useMemo(() => Array.isArray(vendorsData) ? vendorsData : [], [vendorsData]);
  const {
    data: salespersons = [],
    isLoading: isLoadingSalespersons,
    isError: isSalespersonsError,
  } = useSalespersonLookup();

  const hasLeadContext = leadId > 0;

  // -------------------------------------------------------------------------
  // Editable Rate Request Details state
  // -------------------------------------------------------------------------
  const [vendorTypeId, setVendorTypeId] = useState<string>("");
  const [vendorId, setVendorId] = useState<string>("");
  const [vendorEmail, setVendorEmail] = useState<string>("");
  const [internalNotes, setInternalNotes] = useState<string>("");
  const [salesperson, setSalesperson] = useState<string>("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);

  const { user } = useAuth();
  const sendEmailMutation = useSendRateRequestEmail();

  const handleAddNote = async (note: string) => {
    if (!rateRequestId) return;
    try {
      const response = await rateRequestApi.addNote(rateRequestId, note);
      if (response.error) throw new Error(response.error);
      await refetchRateRequest();
      toast.success("Note added");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add note");
    }
  };

  // Edit mode: hydrate state once both rateRequest and the categoryTypes
  // lookup are loaded (rateRequest stores vendorType as its display name; the
  // dropdown is keyed by id, so we have to translate).
  useEffect(() => {
    if (rateRequest && categoryTypes.length > 0) {
      const matchedCategory = categoryTypes.find((c) => c.name === rateRequest.vendorType);
      setVendorTypeId(matchedCategory?.id.toString() ?? "");
      setVendorId(rateRequest.vendorId?.toString() ?? "");
      setVendorEmail(rateRequest.vendorEmail ?? "");
      setInternalNotes(rateRequest.internalNotes ?? "");
    }
  }, [rateRequest, categoryTypes]);

  useEffect(() => {
    if (isEditing && rateRequest) {
      setSalesperson(rateRequest.salesperson ?? "");
    }
  }, [isEditing, rateRequest]);

  useEffect(() => {
    if (!isEditing && lead?.salesperson) {
      setSalesperson((current) => current || lead.salesperson || "");
    }
  }, [isEditing, lead]);

  // Same client-side narrowing used by SendRateRequestModal: filter vendors
  // by the selected category id, fall back to all when no type is picked.
  const filteredVendors = useMemo(() => {
    if (!vendorTypeId) return vendors;
    const targetId = parseInt(vendorTypeId);
    return vendors.filter((c) => c.categories?.some((cat) => cat.id === targetId));
  }, [vendors, vendorTypeId]);

  // Resolve the human-readable vendor type name (sent in the create/update payload).
  const vendorTypeName = useMemo(
    () => categoryTypes.find((c) => c.id.toString() === vendorTypeId)?.name ?? "",
    [categoryTypes, vendorTypeId],
  );

  // Auto-populate the email when the user picks a different vendor.
  // (Done here rather than in a useEffect so we don't clobber the persisted
  // email during initial hydration on edit mode.)
  const handleVendorChange = (value: string) => {
    setVendorId(value);
    const selectedVendor = vendors.find((c) => c.id === parseInt(value));
    if (selectedVendor) {
      setVendorEmail(selectedVendor.email || "");
    }
  };

  // -------------------------------------------------------------------------
  // Save / Send actions
  // -------------------------------------------------------------------------
  const createMutation = useCreateRateRequest();
  const updateMutation = useUpdateRateRequest();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async () => {
    if (!vendorTypeId) {
      toast.error("Please select a vendor type");
      return;
    }
    if (!vendorId) {
      toast.error("Please select a vendor");
      return;
    }

    const selectedVendor = vendors.find((c) => c.id === parseInt(vendorId));
    const vendorIdNum = parseInt(vendorId);

    try {
      if (isEditing && rateRequestId) {
        await updateMutation.mutateAsync({
          id: rateRequestId,
          data: {
            leadId: rateRequest?.leadId,
            vendorId: vendorIdNum,
            vendorName: selectedVendor?.name || "",
            vendorType: vendorTypeName,
            vendorEmail,
            salesperson: salesperson || undefined,
            internalNotes,
          },
        });
      } else {
        if (!leadId) {
          toast.error("No source lead — cannot create a rate request without one.");
          return;
        }
        await createMutation.mutateAsync({
          leadId,
          vendorId: vendorIdNum,
          vendorName: selectedVendor?.name || "",
          vendorType: vendorTypeName,
          vendorEmail,
          salesperson: salesperson || undefined,
          internalNotes: internalNotes || undefined,
        });
      }
      navigate("/sales/rate-requests");
    } catch {
      // toast handled by the mutation hook's onError
    }
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate("/sales/rate-requests")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3 flex-1">
            <h1 className="text-2xl font-semibold text-foreground">
              {isEditing ? `Edit Rate Request${rateRequest?.rateRequestNo ? ` ${rateRequest.rateRequestNo}` : ""}` : "Add Rate Request"}
            </h1>
            {lead?.leadNo && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                Lead: {lead.leadNo}
              </span>
            )}
          </div>
          {isEditing && rateRequestId && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="border-lime-600 text-lime-700 hover:bg-lime-50"
                onClick={() => window.open(`/sales/rate-requests/${rateRequestId}/print`, "_blank")}
              >
                <Printer className="h-4 w-4 mr-2" />
                View PDF
              </Button>
              <Button
                variant="outline"
                className="border-blue-600 text-blue-700 hover:bg-blue-50"
                onClick={() => setEmailModalOpen(true)}
              >
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </Button>
              <Button variant="outline" onClick={() => setHistoryOpen(true)}>
                <History className="h-4 w-4 mr-2" />
                History
              </Button>
            </div>
          )}
        </div>

        {isEditing && isRateRequestLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading rate request data...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* === Locked lead sections === */}
            {!hasLeadContext ? (
              <Card>
                <CardContent className="py-10 text-center space-y-3">
                  {isEditing ? (
                    <p className="text-sm text-muted-foreground">
                      This rate request has no source lead linked, so lead context cannot be displayed.
                    </p>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Rate requests must be created from a lead. Open a lead, then click <strong>Send Rate Request</strong>.
                      </p>
                      <Button onClick={() => navigate("/sales/leads")} className="btn-success">
                        Go to Leads
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            ) : isLeadLoading ? (
              <Card>
                <CardContent className="py-12 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">Loading lead context...</span>
                </CardContent>
              </Card>
            ) : !lead ? (
              <Card>
                <CardContent className="py-6 text-center text-sm text-muted-foreground">
                  Could not load lead details.
                </CardContent>
              </Card>
            ) : (
              <LockedLeadSections lead={lead} />
            )}

            {/* === Rate Request Details (the only editable card) === */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-primary">Rate Request Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Rate Code</Label>
                    <Input
                      value={rateRequest?.rateRequestNo || "Auto-generated"}
                      readOnly
                      className={READONLY_INPUT}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Vendor Type <span className="text-red-500">*</span>
                    </Label>
                    <SearchableSelect
                      options={categoryTypes.map((type) => ({
                        value: type.id.toString(),
                        label: type.name,
                      }))}
                      value={vendorTypeId}
                      onValueChange={(value) => {
                        setVendorTypeId(value);
                        // Reset downstream selections so a stale vendor doesn't
                        // hide behind the new type filter.
                        setVendorId("");
                        setVendorEmail("");
                      }}
                      placeholder="Select vendor type"
                      searchPlaceholder="Search..."
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
                      onValueChange={handleVendorChange}
                      placeholder="Select vendor"
                      searchPlaceholder="Search..."
                      emptyMessage={
                        vendorTypeId
                          ? "No creditors tagged with this vendor type — clear Vendor Type to see all"
                          : "No creditors found"
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Vendor Email</Label>
                    <Input
                      value={vendorEmail}
                      onChange={(e) => setVendorEmail(e.target.value)}
                      placeholder="vendor@email.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Salesperson</Label>
                    <SearchableSelect
                      options={salespersons.map((item) => ({
                        value: item.fullName,
                        label: `${item.fullName} (${item.employeeCode})`,
                      }))}
                      value={salesperson}
                      onValueChange={setSalesperson}
                      placeholder="Select salesperson"
                      searchPlaceholder="Search salespersons..."
                      emptyMessage={isLoadingSalespersons ? "Loading..." : isSalespersonsError ? "Unable to load salespersons" : "No salespersons found"}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-primary">Internal Sales Notes</CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing && rateRequestId ? (
                  <SalesActivityLog
                    entries={rateRequest?.activityLog ?? []}
                    onAdd={handleAddNote}
                  />
                ) : (
                  <Textarea
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    placeholder="Private notes for the internal sales team"
                    rows={4}
                  />
                )}
              </CardContent>
            </Card>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-2 pb-6">
              <Button variant="outline" onClick={() => navigate("/sales/rate-requests")}>
                Cancel
              </Button>
              <Button
                className="btn-success"
                onClick={handleSubmit}
                disabled={
                  isSaving ||
                  !vendorTypeId ||
                  !vendorId ||
                  (!isEditing && !leadId)
                }
              >
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isEditing ? "Save" : "Send"}
              </Button>
            </div>
          </div>
        )}
      </div>
      {isEditing && rateRequestId && (
        <SalesActivityLogModal
          open={historyOpen}
          onOpenChange={setHistoryOpen}
          title={`Rate Request History${rateRequest?.rateRequestNo ? ` — ${rateRequest.rateRequestNo}` : ""}`}
          entries={rateRequest?.activityLog ?? []}
          onAdd={handleAddNote}
        />
      )}
      {isEditing && rateRequestId && (
        <SendEmailModal
          open={emailModalOpen}
          onOpenChange={setEmailModalOpen}
          recipientEmail={vendorEmail}
          recipientLabel="Vendor"
          subject={`Rate Request ${rateRequest?.rateRequestNo ?? ""}`}
          currentUserEmail={user?.email ?? ""}
          onSend={async (req) => {
            await sendEmailMutation.mutateAsync({ id: rateRequestId, data: req });
            setEmailModalOpen(false);
            refetchRateRequest();
          }}
          isSending={sendEmailMutation.isPending}
          title={`Send Rate Request ${rateRequest?.rateRequestNo ?? ""}`}
        />
      )}
    </MainLayout>
  );
}
