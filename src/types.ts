export type UserRole = "superadmin" | "admin" | "employee" | "head";
export type UserStatus = "active" | "inactive";
export type RequestStatus = "Draft" | "Pending" | "Approved" | "Rejected" | "Queried" | "Partially Approved";
export type NotificationType = "info" | "success" | "warning";

export interface ApprovalHistoryEntry {
  approverName: string;
  designation: string;
  requestedAmount: number;
  approvedAmount: number;
  difference: number;
  reason: string;
  timestamp: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  employeeCode: string; // Used as username/login code
  doj: string;
  department: string;
  role: UserRole;
  status: UserStatus;
  enterpriseCode: string;
  enterpriseName?: string;
  password?: string;
  googleUser?: boolean;
  canApproveRequests?: boolean;
  canViewCreditCardExpenses?: boolean;
}

export interface RequestItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxPercent: number;
  total: number;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  role: string;
  text: string;
  timestamp: string;
}

export interface RequestTotals {
  grandTotal: number;
  cgst: number;
  sgst: number;
  adjustments: number;
  netTotal: number;
}

export interface ConveyanceItem {
  id: string;
  type: string;
  cost: number;
}

export interface TravelItineraryRow {
  id: string;
  day: string;
  date: string;
  from: string;
  departureTime: string;
  to: string;
  arrivalTime: string;
  lodgingDesc: string;
  lodgingCost: number;
  foodDesc: string;
  foodCost: number;
  conveyanceType: string;
  conveyanceCost: number;
  conveyances?: ConveyanceItem[];
  rowTotal: number;
}

export interface TravelDetails {
  itinerary?: TravelItineraryRow[];
  advanceAmount?: number;
  advanceDate?: string;
  balanceReturnedHO?: number;
  balancePaidToTraveler?: number;
  trainNoName?: string;
  millNameAddress?: string;
  departureDate?: string;
  arrivalDate?: string;
  travelFrom?: string;
  travelTo?: string;
  hotelName?: string;
  hotelDetails?: string;
  notes?: string;
}

export interface RequestForm {
  id: string;
  userId: string;
  employeeName: string;
  projectName: string;
  submissionDate: string;
  items: RequestItem[];
  totalBudget: number;
  category: string;
  status: RequestStatus;
  lastUpdated: string;
  totals: RequestTotals;
  attachments: string[];
  comments: Comment[];
  approvalDetails: {
    approvedBy?: string;
    approvalDate?: string;
    adminRemarks?: string;
  };
  enterpriseCode: string;
  travelDetails?: TravelDetails;
  cashVoucherDetails?: CashVoucherDetails;
  travelExpensesDetails?: TravelExpensesDetails;
  localConveyanceDetails?: LocalConveyanceDetails;
  creditCardDetails?: CreditCardDetails;
  assignedHeadId?: string;
  assignedHeadName?: string;
  assignedAdminId?: string;
  assignedAdminName?: string;
  assignedSuperAdminId?: string;
  assignedSuperAdminName?: string;
  stage?: "head-approval" | "admin-approval" | "superadmin-approval";
  headApprovalStatus?: "Pending" | "Approved" | "Rejected" | "Queried";
  headRemarks?: string;
  headApprovedBy?: string;
  headApprovalDate?: string;
  adminApprovalStatus?: "Pending" | "Approved" | "Rejected" | "Queried";
  adminRemarks?: string;
  adminApprovedBy?: string;
  adminApprovalDate?: string;
  superAdminApprovalStatus?: "Pending" | "Approved" | "Rejected" | "Queried";
  superAdminRemarks?: string;
  superAdminApprovedBy?: string;
  superAdminApprovalDate?: string;
  documentNumber?: string;
  documentType?: "CV" | "EV" | "PV" | "JV" | "CCE";
  finalizedBy?: string;
  linkedDocumentId?: string;
  linkedDocumentNumber?: string;
  linkedDocumentType?: string;
  linkedCommissionId?: string;
  linkedCommissionNumber?: string;
  serialNumber?: number;
  prefix?: string;
  cancellationStatus?: "Active" | "Cancelled";
  cancelledBy?: string;
  cancelledDate?: string;
  cancelledReason?: string;
  approvedAmount?: number;
  reductionReason?: string;
  enterpriseName?: string;
  approvalHistory?: ApprovalHistoryEntry[];
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  timestamp: string;
  details: string;
  enterpriseCode: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: NotificationType;
  enterpriseCode: string;
}

export interface CashVoucherDetails {
  voucherNo?: string;
  debitTo?: string; // Dr.
  fileNo?: string;
  expenseDetails?: string; // Being the amount paid for...
  incurredBy?: string; // incurred by Mr.
  amountInWords?: string; // Rupees ... only
  checkedBy?: string;
  authorisedBy?: string;
  receivedPaymentBy?: string;
  // Bill Details for Proof
  billDate?: string;
  billParticulars?: string;
  billRate?: string;
  billAmount?: number;
  billFileContent?: string; // base64 or placeholder URL for uploaded bill/receipt image
  billFileName?: string;
}

export interface TravelExpenseRow {
  id: string;
  serialNo: number;
  date: string;
  particular: string;
  amount: number;
}

export interface TravelExpensesDetails {
  voucherNo?: string;
  name?: string;
  dateDesc?: string;
  details?: string;
  rows?: TravelExpenseRow[];
  totalAmount?: number;
  createdByName?: string;
  billFileContent?: string;
  billFileName?: string;
}

export interface Commission {
  id: string; // e.g., COM-0001
  employeeId: string;
  employeeName: string;
  department: string;
  totalAmount: number;
  purpose: string;
  dateMonth: string;
  notes: string;
  status: "Pending" | "Partially Paid" | "Paid" | "Cancelled";
  enterpriseCode: string;
  createdAt: string;
  createdBy: string;
}

export interface LocalConveyanceRow {
  id: string;
  serialNo: number;
  date: string;
  from: string;
  to: string;
  purpose: string;
  amount: number;
  approvedBy?: string;
  signature?: string;
}

export interface LocalConveyanceDetails {
  voucherNo?: string;
  expenseHead?: string;
  fileNo?: string;
  kindOfExpense?: string;
  incurredBy?: string;
  amount?: number;
  amountInWords?: string;
  rows?: LocalConveyanceRow[];
  createdByName?: string;
  approvedByName?: string;
}

export interface CreditCard {
  id: string;
  cardName: string;
  cardholderName: string;
  last4Digits: string;
  department?: string;
  status: "Active" | "Inactive";
  enterpriseCode: string;
  createdAt?: string;
}

export interface CreditCardDetails {
  voucherNo?: string;
  expenseType: "General" | "OTA";
  expenseDate: string;
  expenseHead: string;
  description: string;
  amount: number;
  creditCardId: string;
  creditCardName: string;
  cardholderName: string;
  last4Digits: string;
  linkedOtaId?: string;
  linkedOtaNo?: string;
  remarks?: string;
}

