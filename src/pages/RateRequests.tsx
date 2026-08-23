import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PermissionGate } from "@/components/auth/PermissionGate";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Edit, Plus, FileText, Loader2, Check, History, Mail, Printer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useRateRequests, useUpdateRateRequest, useRateRequest, useSendRateRequestEmail } from "@/hooks/useSales";
import { RateRequest } from "@/services/api";
import { rateRequestApi } from "@/services/api/sales";
import { SalesActivityLogModal } from "@/components/sales/SalesActivityLogModal";
import { SendEmailModal } from "@/components/common/SendEmailModal";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function RateRequests() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState("10");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRateRequestId, setSelectedRateRequestId] = useState<number | null>(null);
  const [showReceivedConfirm, setShowReceivedConfirm] = useState(false);
  const [rateRequestToMarkReceived, setRateRequestToMarkReceived] = useState<RateRequest | null>(null);
  const [historyRequestId, setHistoryRequestId] = useState<number | null>(null);
  const [emailRateRequest, setEmailRateRequest] = useState<RateRequest | null>(null);
  const { user } = useAuth();

  const { data: historyDetail, refetch: refetchHistory } = useRateRequest(historyRequestId || 0);

  const handleAddHistoryNote = async (note: string) => {
    if (!historyRequestId) return;
    try {
      const response = await rateRequestApi.addNote(historyRequestId, note);
      if (response.error) throw new Error(response.error);
      await refetchHistory();
      toast.success("Note added");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add note");
    }
  };

  const { data, isLoading, error, refetch } = useRateRequests({
    pageNumber: currentPage,
    pageSize: parseInt(entriesPerPage, 10) || 10,
    searchTerm: appliedSearch || undefined,
  });

  const updateMutation = useUpdateRateRequest();
  const sendEmailMutation = useSendRateRequestEmail();

  const rateRequests = data?.items || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = data?.totalPages || 1;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return <Badge className="bg-yellow-500 text-white">Pending</Badge>;
      case "Sent":
        return <Badge className="bg-blue-500 text-white">Sent</Badge>;
      case "Received":
        return <Badge className="bg-green-500 text-white">Received</Badge>;
      case "Quoted":
        return <Badge className="bg-purple-500 text-white">Quoted</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white">{status}</Badge>;
    }
  };

  const handleConvertToQuotation = (request: RateRequest) => {
    navigate("/sales/quotations/new", { state: { rateRequestId: request.id } });
  };

  const handleConvertSelectedToQuotation = () => {
    if (selectedRateRequestId) {
      navigate("/sales/quotations/new", { state: { rateRequestId: selectedRateRequestId } });
    }
  };

  const selectedRateRequest = selectedRateRequestId
    ? rateRequests.find(r => r.id === selectedRateRequestId)
    : null;

  const handleMarkAsReceived = async () => {
    if (!rateRequestToMarkReceived) return;
    try {
      await updateMutation.mutateAsync({
        id: rateRequestToMarkReceived.id,
        data: { status: 'Received' }
      });
      setSelectedRateRequestId(rateRequestToMarkReceived.id);
      setShowReceivedConfirm(false);
      setRateRequestToMarkReceived(null);
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-foreground">Rate Request</h1>
          <div className="flex gap-2">
            <Button
              onClick={handleConvertSelectedToQuotation}
              disabled={!selectedRateRequestId || selectedRateRequest?.requestStatus !== "Received"}
              className="bg-teal-500 hover:bg-teal-600 text-white disabled:opacity-50"
            >
              <FileText className="h-4 w-4 mr-2" />
              Convert to Quotation
            </Button>
            <PermissionGate permission="ratereq_add">
              <Button
                onClick={() => navigate("/sales/leads")}
                className="btn-success"
                title="Rate requests are created from a lead. Pick a lead first."
              >
                <Plus className="h-4 w-4 mr-2" />
                Send from Lead
              </Button>
            </PermissionGate>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border">
          <div className="p-4 flex justify-between items-center border-b border-border">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Show</span>
              <SearchableSelect
                options={[
                  { value: "10", label: "10" },
                  { value: "25", label: "25" },
                  { value: "50", label: "50" },
                  { value: "100", label: "100" },
                ]}
                value={entriesPerPage}
                onValueChange={(value) => {
                  setEntriesPerPage(value);
                  setCurrentPage(1);
                }}
                placeholder="10"
                searchPlaceholder="Search..."
                triggerClassName="w-[90px]"
              />
              <span className="text-sm text-muted-foreground">entries</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Search:</span>
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { setAppliedSearch(searchTerm); setCurrentPage(1); } }}
                className="w-64"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12 text-destructive">
              Error loading rate requests. Please try again.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-table-header">
                  <TableHead className="text-table-header-foreground w-12">Select</TableHead>
                  <TableHead className="text-table-header-foreground">Rate request No.</TableHead>
                  <TableHead className="text-table-header-foreground">Lead No.</TableHead>
                  <TableHead className="text-table-header-foreground">Date</TableHead>
                  <TableHead className="text-table-header-foreground">Customer Name</TableHead>
                  <TableHead className="text-table-header-foreground">Salesperson</TableHead>
                  <TableHead className="text-table-header-foreground">Freight Mode</TableHead>
                  <TableHead className="text-table-header-foreground">Vendor Type</TableHead>
                  <TableHead className="text-table-header-foreground">Vendor Name</TableHead>
                  <TableHead className="text-table-header-foreground">Vendor Email</TableHead>
                  <TableHead className="text-table-header-foreground">Pickup Country</TableHead>
                  <TableHead className="text-table-header-foreground">Delivery Country</TableHead>
                  <TableHead className="text-table-header-foreground">Status</TableHead>
                  <TableHead className="text-table-header-foreground">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rateRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={14} className="text-center py-8 text-muted-foreground">
                      No rate requests found
                    </TableCell>
                  </TableRow>
                ) : (
                  rateRequests.map((request, index) => (
                    <TableRow
                      key={request.id}
                      className={`border-b border-border hover:bg-table-row-hover transition-colors ${selectedRateRequestId === request.id ? 'bg-primary/10' : index % 2 === 0 ? 'bg-card' : 'bg-secondary/30'}`}
                    >
                      <TableCell>
                        <input
                          type="radio"
                          name="rateRequestSelection"
                          checked={selectedRateRequestId === request.id}
                          onChange={() => setSelectedRateRequestId(request.id)}
                          className="h-4 w-4 text-green-600 cursor-pointer"
                        />
                      </TableCell>
                      <TableCell className="font-medium">{request.rateRequestNo}</TableCell>
                      <TableCell className="text-green-600">{request.leadNo || "-"}</TableCell>
                      <TableCell>{formatDate(request.requestDate)}</TableCell>
                      <TableCell className="text-green-600">{request.fullName || "-"}</TableCell>
                      <TableCell>{request.salesperson || "-"}</TableCell>
                      <TableCell>{request.freightMode || "-"}</TableCell>
                      <TableCell>{request.vendorType || "-"}</TableCell>
                      <TableCell className="text-green-600">{request.vendorName}</TableCell>
                      <TableCell>{request.vendorEmail || "-"}</TableCell>
                      <TableCell className="text-green-600">{request.pickupCountryName || request.polCountry || "-"}</TableCell>
                      <TableCell>{request.deliveryCountryName || request.podCountry || "-"}</TableCell>
                      <TableCell>{getStatusBadge(request.requestStatus)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <PermissionGate permission="ratereq_edit">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 btn-success rounded"
                              onClick={() => navigate(`/sales/rate-requests/${request.id}/edit`)}
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </PermissionGate>
                          <PermissionGate permission="ratereq_view">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 bg-lime-600 hover:bg-lime-700 text-white rounded"
                              onClick={() => window.open(`/sales/rate-requests/${request.id}/print`, "_blank")}
                              title="Print / View PDF"
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                          </PermissionGate>
                          <PermissionGate permission="ratereq_add">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 bg-blue-500 hover:bg-blue-600 text-white rounded"
                              onClick={() => setEmailRateRequest(request)}
                              title="Send Email"
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                          </PermissionGate>
                          {(request.requestStatus === "Pending" || request.requestStatus === "Sent") && (
                            <PermissionGate permission="ratereq_edit">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 bg-purple-500 hover:bg-purple-600 text-white rounded"
                                onClick={() => {
                                  setRateRequestToMarkReceived(request);
                                  setShowReceivedConfirm(true);
                                }}
                                title="Mark as Received"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            </PermissionGate>
                          )}
                          {request.requestStatus === "Received" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 bg-teal-500 hover:bg-teal-600 text-white rounded"
                              onClick={() => handleConvertToQuotation(request)}
                              title="Convert to Quotation"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 bg-slate-500 hover:bg-slate-600 text-white rounded"
                            onClick={() => setHistoryRequestId(request.id)}
                            title="History"
                          >
                            <History className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          <div className="p-4 flex justify-between items-center border-t border-border">
            <span className="text-sm text-muted-foreground">
              Showing {rateRequests.length > 0 ? ((currentPage - 1) * (parseInt(entriesPerPage, 10) || 10)) + 1 : 0} to {Math.min(currentPage * (parseInt(entriesPerPage, 10) || 10), totalCount)} of {totalCount} entries
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
              >
                Previous
              </Button>
              {(() => {
                const getPageNumbers = (cp: number, tp: number): (number | '...')[] => {
                  if (tp <= 7) return Array.from({ length: tp }, (_, i) => i + 1);
                  if (cp <= 4) return [1, 2, 3, 4, 5, '...', tp];
                  if (cp >= tp - 3) return [1, '...', tp-4, tp-3, tp-2, tp-1, tp];
                  return [1, '...', cp-1, cp, cp+1, '...', tp];
                };
                return getPageNumbers(currentPage, totalPages).map((page, idx) =>
                  page === '...'
                    ? <span key={`ellipsis-${idx}`} className="px-2 flex items-center text-muted-foreground">...</span>
                    : (
                      <Button
                        key={page}
                        variant={page === currentPage ? "default" : "outline"}
                        size="sm"
                        className={page === currentPage ? "btn-success" : ""}
                        onClick={() => setCurrentPage(page as number)}
                      >
                        {page}
                      </Button>
                    )
                );
              })()}
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mark as Received Confirmation Modal */}
      <AlertDialog open={showReceivedConfirm} onOpenChange={setShowReceivedConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark Rate Request as Received?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark rate request "{rateRequestToMarkReceived?.rateRequestNo}" as received?
              This will enable the option to convert it to a quotation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updateMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMarkAsReceived}
              disabled={updateMutation.isPending}
              className="bg-purple-500 hover:bg-purple-600 text-white"
            >
              {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Yes, Mark as Received
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SalesActivityLogModal
        open={!!historyRequestId}
        onOpenChange={(open) => !open && setHistoryRequestId(null)}
        title={`Rate Request History${historyDetail?.rateRequestNo ? ` — ${historyDetail.rateRequestNo}` : ""}`}
        entries={historyDetail?.activityLog ?? []}
        onAdd={handleAddHistoryNote}
      />

      {emailRateRequest && (
        <SendEmailModal
          open={!!emailRateRequest}
          onOpenChange={(open) => !open && setEmailRateRequest(null)}
          recipientEmail={emailRateRequest.vendorEmail || ""}
          recipientLabel="Vendor"
          subject={`Rate Request ${emailRateRequest.rateRequestNo}`}
          currentUserEmail={user?.email ?? ""}
          onSend={async (req) => {
            await sendEmailMutation.mutateAsync({ id: emailRateRequest.id, data: req });
            setEmailRateRequest(null);
            refetch();
          }}
          isSending={sendEmailMutation.isPending}
          title={`Send Rate Request ${emailRateRequest.rateRequestNo}`}
        />
      )}
    </MainLayout>
  );
}
