import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { Loader2 } from "lucide-react";

// Lazy load page components for code splitting
const Login = lazy(() => import("./pages/Login"));
const Unauthorized = lazy(() => import("./pages/Unauthorized"));
const Dashboard = lazy(() => import("./pages/Dashboard"));

// System Admin pages
const SystemLogin = lazy(() => import("./pages/system/SystemLogin"));
const OfficesList = lazy(() => import("./pages/system/OfficesList"));
const SystemAdminsList = lazy(() => import("./pages/system/SystemAdminsList"));
const AuditLogsList = lazy(() => import("./pages/system/AuditLogsList"));
const Companies = lazy(() => import("./pages/Companies"));
const ResetPasswordRequests = lazy(() => import("./pages/system/ResetPasswordRequests"));
const Shipments = lazy(() => import("./pages/Shipments"));
const ShipmentDetail = lazy(() => import("./pages/ShipmentDetail"));
const AddShipment = lazy(() => import("./pages/AddShipment"));
const BillOfLadingViewer = lazy(() => import("./pages/BillOfLadingViewer"));
const ShipmentReportPrintView = lazy(() => import("./pages/ShipmentReportPrintView"));
const ContainerReportPrintView = lazy(() => import("./pages/ContainerReportPrintView"));
const MasterCustomers = lazy(() => import("./pages/MasterCustomers"));
const CustomerDetail = lazy(() => import("./pages/CustomerDetail"));
const NeutralDetail = lazy(() => import("./pages/NeutralDetail"));
const AllUsers = lazy(() => import("./pages/AllUsers"));
const PermissionRoles = lazy(() => import("./pages/PermissionRoles"));
const Settings = lazy(() => import("./pages/Settings"));
const Banks = lazy(() => import("./pages/Banks"));
const Leads = lazy(() => import("./pages/Leads"));
const LeadForm = lazy(() => import("./pages/LeadForm"));
const RateRequests = lazy(() => import("./pages/RateRequests"));
const RateRequestForm = lazy(() => import("./pages/RateRequestForm"));
const RateRequestPrintView = lazy(() => import("./pages/RateRequestPrintView"));
const Quotations = lazy(() => import("./pages/Quotations"));
const QuotationForm = lazy(() => import("./pages/QuotationForm"));
const QuotationView = lazy(() => import("./pages/QuotationView"));
const QuotationPrintView = lazy(() => import("./pages/QuotationPrintView"));
const DailyExpenses = lazy(() => import("./pages/DailyExpenses"));
const ExpensePrintView = lazy(() => import("./pages/ExpensePrintView"));
const Invoices = lazy(() => import("./pages/Invoices"));
const InvoiceView = lazy(() => import("./pages/InvoiceView"));
const InvoiceEdit = lazy(() => import("./pages/InvoiceEdit"));
const InvoicePrintView = lazy(() => import("./pages/InvoicePrintView"));
const PurchaseInvoices = lazy(() => import("./pages/PurchaseInvoices"));
const PurchaseInvoiceView = lazy(() => import("./pages/PurchaseInvoiceView"));
const PurchaseInvoiceEdit = lazy(() => import("./pages/PurchaseInvoiceEdit"));
const PurchaseInvoicePrintView = lazy(() => import("./pages/PurchaseInvoicePrintView"));
const StatementPrintView = lazy(() => import("./pages/StatementPrintView"));
const CustomerAccountReceivablePrintView = lazy(() => import("./pages/CustomerAccountReceivablePrintView"));
const ReceiptVouchers = lazy(() => import("./pages/ReceiptVouchers"));
const ReceiptView = lazy(() => import("./pages/ReceiptView"));
const ReceiptPrintView = lazy(() => import("./pages/ReceiptPrintView"));
const PaymentVouchers = lazy(() => import("./pages/PaymentVouchers"));
const PaymentView = lazy(() => import("./pages/PaymentView"));
const PaymentVoucherPrintView = lazy(() => import("./pages/PaymentVoucherPrintView"));
const CostSheet = lazy(() => import("./pages/CostSheet"));
const CostSheetDetail = lazy(() => import("./pages/CostSheetDetail"));
const CostSheetPrintView = lazy(() => import("./pages/CostSheetPrintView"));
const CostSheetDetailPrintView = lazy(() => import("./pages/CostSheetDetailPrintView"));
const VatReport = lazy(() => import("./pages/VatReport"));
const VatReportPrintView = lazy(() => import("./pages/VatReportPrintView"));
const AccountReceivable = lazy(() => import("./pages/AccountReceivable"));
const AccountReceivablePrintView = lazy(() => import("./pages/AccountReceivablePrintView"));
const AccountPayable = lazy(() => import("./pages/AccountPayable"));
const AccountPayablePrintView = lazy(() => import("./pages/AccountPayablePrintView"));
const CreditNotes = lazy(() => import("./pages/CreditNotes"));
const CreditNoteView = lazy(() => import("./pages/CreditNoteView"));
const CreditNoteEdit = lazy(() => import("./pages/CreditNoteEdit"));
const CreditNotePrintView = lazy(() => import("./pages/CreditNotePrintView"));
const ChangePassword = lazy(() => import("./pages/ChangePassword"));
const Profile = lazy(() => import("./pages/Profile"));
const PostDatedCheques = lazy(() => import("./pages/PostDatedCheques"));
const GeneralDocuments = lazy(() => import("./pages/GeneralDocuments"));
const NotFound = lazy(() => import("./pages/NotFound"));

// HR pages
const HrEmployees = lazy(() => import("./pages/hr/HrEmployees"));
const HrEmployeeDetail = lazy(() => import("./pages/hr/HrEmployeeDetail"));
const HrSalaryComponents = lazy(() => import("./pages/hr/HrSalaryComponents"));
const HrPayroll = lazy(() => import("./pages/hr/HrPayroll"));
const HrPayrollGenerate = lazy(() => import("./pages/hr/HrPayrollGenerate"));
const HrPayslip = lazy(() => import("./pages/hr/HrPayslip"));
const HrAdvances = lazy(() => import("./pages/hr/HrAdvances"));
const HrAttendance = lazy(() => import("./pages/hr/HrAttendance"));
const HrAttendanceSummary = lazy(() => import("./pages/hr/HrAttendanceSummary"));
const AttendancePrintView = lazy(() => import("./pages/hr/AttendancePrintView"));
const PayslipPrintView = lazy(() => import("./pages/hr/PayslipPrintView"));
const HrAttendancePolicy = lazy(() => import("./pages/hr/HrAttendancePolicy"));

// Loading fallback component
const PageLoader = () => (
  <div className="flex h-screen items-center justify-center bg-background">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

// Wrapper that conditionally applies AuthProvider only for non-system routes
const ConditionalAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const isSystemRoute = location.pathname.startsWith('/system');

  // System admin routes don't need office AuthProvider
  if (isSystemRoute) {
    return <>{children}</>;
  }

  // Office routes need AuthProvider
  return <AuthProvider>{children}</AuthProvider>;
};

// Route wrappers with explicit location-based keys for deterministic remount behavior.
const AddShipmentRoute = () => {
  const location = useLocation();
  return <AddShipment key={location.pathname} />;
};

const ShipmentDetailRoute = () => {
  const location = useLocation();
  return <ShipmentDetail key={location.pathname} />;
};

const AppRoutes = () => (
  <ConditionalAuthProvider>
    <Routes>
      {/* System Admin routes - no office auth needed */}
      <Route path="/system/login" element={<SystemLogin />} />
      <Route path="/system/offices" element={<OfficesList />} />
      <Route path="/system/admins" element={<SystemAdminsList />} />
      <Route path="/system/audit-logs" element={<AuditLogsList />} />
      <Route path="/system/reset-password" element={<ResetPasswordRequests />} />

      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Protected office routes */}
      <Route path="/change-password" element={
        <ProtectedRoute>
          <ChangePassword />
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      } />
      <Route path="/" element={
        <ProtectedRoute permission="dash_view">
          <Dashboard />
        </ProtectedRoute>
      } />
      {/* /exceptions route removed — client not billed for Exception Dashboard. Restore to re-enable. */}
      <Route path="/companies" element={
        <ProtectedRoute permission="company_view">
          <Companies />
        </ProtectedRoute>
      } />
      <Route path="/shipments" element={
        <ProtectedRoute permission="ship_view">
          <Shipments />
        </ProtectedRoute>
      } />
      <Route path="/shipments/add" element={
        <ProtectedRoute permission="ship_add">
          <AddShipmentRoute />
        </ProtectedRoute>
      } />
      <Route path="/shipments/:id/edit" element={
        <ProtectedRoute permission="ship_view">
          <ShipmentDetailRoute />
        </ProtectedRoute>
      } />
      <Route path="/shipments/:shipmentId/reports/:reportType" element={
        <ProtectedRoute permission="ship_view">
          <ShipmentReportPrintView />
        </ProtectedRoute>
      } />
      <Route path="/shipments/reports/by-container/:reportType/:containerNumber" element={
        <ProtectedRoute permission="ship_view">
          <ContainerReportPrintView />
        </ProtectedRoute>
      } />
      <Route path="/shipments/bill-of-lading" element={
        <ProtectedRoute permission="bl_view">
          <BillOfLadingViewer />
        </ProtectedRoute>
      } />
      <Route path="/master-customers" element={
        <ProtectedRoute permission="cust_view">
          <MasterCustomers />
        </ProtectedRoute>
      } />
      <Route path="/master-customers/:id/edit" element={
        <ProtectedRoute permission="cust_view">
          <CustomerDetail />
        </ProtectedRoute>
      } />
      <Route path="/master-customers/:id/neutral/edit" element={
        <ProtectedRoute permission="cust_view">
          <NeutralDetail />
        </ProtectedRoute>
      } />
      <Route path="/master-customers/:id/statement/print" element={
        <ProtectedRoute permission="cust_view">
          <StatementPrintView />
        </ProtectedRoute>
      } />
      <Route path="/master-customers/:id/account-receivables/print" element={
        <ProtectedRoute permission="accrec_view">
          <CustomerAccountReceivablePrintView />
        </ProtectedRoute>
      } />
      <Route path="/sales/leads" element={
        <ProtectedRoute permission="leads_view">
          <Leads />
        </ProtectedRoute>
      } />
      <Route path="/sales/leads/new" element={
        <ProtectedRoute permission="leads_add">
          <LeadForm />
        </ProtectedRoute>
      } />
      <Route path="/sales/leads/:id/edit" element={
        <ProtectedRoute permission="leads_edit">
          <LeadForm />
        </ProtectedRoute>
      } />
      <Route path="/sales/rate-requests" element={
        <ProtectedRoute permission="ratereq_view">
          <RateRequests />
        </ProtectedRoute>
      } />
      <Route path="/sales/rate-requests/new" element={
        <ProtectedRoute permission="ratereq_add">
          <RateRequestForm />
        </ProtectedRoute>
      } />
      <Route path="/sales/rate-requests/:id/edit" element={
        <ProtectedRoute permission="ratereq_edit">
          <RateRequestForm />
        </ProtectedRoute>
      } />
      <Route path="/sales/rate-requests/:id/view" element={
        <ProtectedRoute permission="ratereq_view">
          <RateRequestPrintView />
        </ProtectedRoute>
      } />
      <Route path="/sales/rate-requests/:id/print" element={
        <ProtectedRoute permission="ratereq_view">
          <RateRequestPrintView />
        </ProtectedRoute>
      } />
      <Route path="/sales/quotations" element={
        <ProtectedRoute permission="quot_view">
          <Quotations />
        </ProtectedRoute>
      } />
      <Route path="/sales/quotations/new" element={
        <ProtectedRoute permission="quot_add">
          <QuotationForm />
        </ProtectedRoute>
      } />
      <Route path="/sales/quotations/:id/edit" element={
        <ProtectedRoute permission="quot_edit">
          <QuotationForm />
        </ProtectedRoute>
      } />
      <Route path="/sales/quotations/:id/view-details" element={
        <ProtectedRoute permission="quot_view">
          <QuotationForm />
        </ProtectedRoute>
      } />
      <Route path="/sales/quotations/:id/view" element={
        <ProtectedRoute permission="quot_view">
          <QuotationPrintView />
        </ProtectedRoute>
      } />
      <Route path="/accounts" element={
        <ProtectedRoute permission="invoice_view">
          <Invoices />
        </ProtectedRoute>
      } />
      <Route path="/accounts/invoices" element={
        <ProtectedRoute permission="invoice_view">
          <Invoices />
        </ProtectedRoute>
      } />
      <Route path="/accounts/invoices/:id" element={
        <ProtectedRoute permission="invoice_view">
          <InvoiceView />
        </ProtectedRoute>
      } />
      <Route path="/accounts/invoices/:id/edit" element={
        <ProtectedRoute permission="invoice_edit">
          <InvoiceEdit />
        </ProtectedRoute>
      } />
      <Route path="/accounts/invoices/:id/print" element={
        <ProtectedRoute permission="invoice_view">
          <InvoicePrintView />
        </ProtectedRoute>
      } />
      <Route path="/accounts/purchase-invoices" element={
        <ProtectedRoute permission="purchase_view">
          <PurchaseInvoices />
        </ProtectedRoute>
      } />
      <Route path="/accounts/purchase-invoices/:id" element={
        <ProtectedRoute permission="purchase_view">
          <PurchaseInvoiceView />
        </ProtectedRoute>
      } />
      <Route path="/accounts/purchase-invoices/:id/edit" element={
        <ProtectedRoute permission="purchase_edit">
          <PurchaseInvoiceEdit />
        </ProtectedRoute>
      } />
      <Route path="/accounts/purchase-invoices/:id/print" element={
        <ProtectedRoute permission="purchase_view">
          <PurchaseInvoicePrintView />
        </ProtectedRoute>
      } />
      <Route path="/accounts/daily-expenses" element={
        <ProtectedRoute permission="expense_view">
          <DailyExpenses />
        </ProtectedRoute>
      } />
      <Route path="/accounts/expenses/print" element={
        <ProtectedRoute permission="expense_view">
          <ExpensePrintView />
        </ProtectedRoute>
      } />
      <Route path="/accounts/receipt-vouchers" element={
        <ProtectedRoute permission="receipt_view">
          <ReceiptVouchers />
        </ProtectedRoute>
      } />
      <Route path="/accounts/receipt-vouchers/:id" element={
        <ProtectedRoute permission="receipt_view">
          <ReceiptView />
        </ProtectedRoute>
      } />
      <Route path="/accounts/receipt-vouchers/:id/print" element={
        <ProtectedRoute permission="receipt_view">
          <ReceiptPrintView />
        </ProtectedRoute>
      } />
      <Route path="/accounts/payment-vouchers" element={
        <ProtectedRoute permission="paymentvoucher_view">
          <PaymentVouchers />
        </ProtectedRoute>
      } />
      <Route path="/accounts/payment-vouchers/:id" element={
        <ProtectedRoute permission="paymentvoucher_view">
          <PaymentView />
        </ProtectedRoute>
      } />
      <Route path="/accounts/payment-vouchers/:id/print" element={
        <ProtectedRoute permission="paymentvoucher_view">
          <PaymentVoucherPrintView />
        </ProtectedRoute>
      } />
      <Route path="/accounts/cost-sheet" element={
        <ProtectedRoute permission="ship_view">
          <CostSheet />
        </ProtectedRoute>
      } />
      <Route path="/accounts/cost-sheet/print" element={
        <ProtectedRoute permission="ship_view">
          <CostSheetPrintView />
        </ProtectedRoute>
      } />
      <Route path="/accounts/cost-sheet/:id" element={
        <ProtectedRoute permission="ship_view">
          <CostSheetDetail />
        </ProtectedRoute>
      } />
      <Route path="/accounts/cost-sheet/:shipmentId/print" element={
        <ProtectedRoute permission="ship_view">
          <CostSheetDetailPrintView />
        </ProtectedRoute>
      } />
      <Route path="/accounts/vat-report" element={
        <ProtectedRoute permission="invoice_view">
          <VatReport />
        </ProtectedRoute>
      } />
      <Route path="/accounts/vat-report/print" element={
        <ProtectedRoute permission="invoice_view">
          <VatReportPrintView />
        </ProtectedRoute>
      } />
      <Route path="/accounts/account-receivable" element={
        <ProtectedRoute permission="accrec_view">
          <AccountReceivable />
        </ProtectedRoute>
      } />
      <Route path="/accounts/account-receivable/print" element={
        <ProtectedRoute permission="accrec_view">
          <AccountReceivablePrintView />
        </ProtectedRoute>
      } />
      <Route path="/accounts/account-payable" element={
        <ProtectedRoute permission="accpay_view">
          <AccountPayable />
        </ProtectedRoute>
      } />
      <Route path="/accounts/account-payable/print" element={
        <ProtectedRoute permission="accpay_view">
          <AccountPayablePrintView />
        </ProtectedRoute>
      } />
      <Route path="/accounts/post-dated-cheques" element={
        <ProtectedRoute permission="pdc_view">
          <PostDatedCheques />
        </ProtectedRoute>
      } />
      <Route path="/accounts/credit-notes" element={
        <ProtectedRoute permission="creditnote_view">
          <CreditNotes />
        </ProtectedRoute>
      } />
      <Route path="/accounts/credit-notes/:id" element={
        <ProtectedRoute permission="creditnote_view">
          <CreditNoteView />
        </ProtectedRoute>
      } />
      <Route path="/accounts/credit-notes/:id/edit" element={
        <ProtectedRoute permission="creditnote_edit">
          <CreditNoteEdit />
        </ProtectedRoute>
      } />
      <Route path="/accounts/credit-notes/:id/print" element={
        <ProtectedRoute permission="creditnote_view">
          <CreditNotePrintView />
        </ProtectedRoute>
      } />
      <Route path="/users" element={
        <ProtectedRoute permission="user_view">
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/users/all" element={
        <ProtectedRoute permission="user_view">
          <AllUsers />
        </ProtectedRoute>
      } />
      <Route path="/users/roles" element={
        <ProtectedRoute permission="role_view">
          <PermissionRoles />
        </ProtectedRoute>
      } />
      <Route path="/banks" element={
        <ProtectedRoute permission="banks_view">
          <Banks />
        </ProtectedRoute>
      } />
      <Route path="/general-document" element={
        <ProtectedRoute>
          <GeneralDocuments />
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      } />
            {/* HR routes */}
            <Route path="/hr/employees" element={
                <ProtectedRoute permission="hr_emp_view"><HrEmployees /></ProtectedRoute>
            } />
            <Route path="/hr/employees/:id" element={
                <ProtectedRoute permission="hr_emp_view"><HrEmployeeDetail /></ProtectedRoute>
            } />
            <Route path="/hr/salary-components" element={
                <ProtectedRoute permission="hr_salary_view"><HrSalaryComponents /></ProtectedRoute>
            } />
            <Route path="/hr/payroll" element={
                <ProtectedRoute permission="hr_payroll_view"><HrPayroll /></ProtectedRoute>
            } />
            <Route path="/hr/payroll/generate" element={
                <ProtectedRoute permission="hr_payroll_add"><HrPayrollGenerate /></ProtectedRoute>
            } />
            <Route path="/hr/payslip/:id" element={
                <ProtectedRoute permission="hr_payroll_view"><HrPayslip /></ProtectedRoute>
            } />
            <Route path="/hr/payslip/:id/print" element={
                <ProtectedRoute permission="hr_payroll_view"><PayslipPrintView /></ProtectedRoute>
            } />
            <Route path="/hr/advances" element={
                <ProtectedRoute permission="hr_advance_view"><HrAdvances /></ProtectedRoute>
            } />
            <Route path="/hr/attendance" element={
                <ProtectedRoute permission="hr_attend_view"><HrAttendance /></ProtectedRoute>
            } />
            <Route path="/hr/attendance-summary" element={
                <ProtectedRoute permission="hr_attend_view"><HrAttendanceSummary /></ProtectedRoute>
            } />
            <Route path="/hr/attendance-policy" element={
                <ProtectedRoute permission="hr_attend_policy"><HrAttendancePolicy /></ProtectedRoute>
            } />
            <Route path="/hr/attendance/print" element={
                <ProtectedRoute permission="hr_attend_view"><AttendancePrintView /></ProtectedRoute>
            } />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </ConditionalAuthProvider>
);

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <AppRoutes />
      </Suspense>
    </BrowserRouter>
  </TooltipProvider>
);

export default App;
