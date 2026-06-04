import React, { useState, useEffect, useRef } from "react";
import { 
  Building2, Lock, Mail, Users, FileText, CheckCircle2, XCircle, AlertCircle, 
  HelpCircle, ChevronRight, BarChart3, Plus, Bell, LogOut, ArrowUpRight, 
  Trash2, Send, Download, Layers, ShieldCheck, UserCheck, Calendar, Briefcase, 
  Check, Search, ExternalLink, RefreshCw, Eye, ClipboardList, Info, HelpCircle as QueryIcon,
  Upload, File, Plane, Receipt, Settings, Database, Coins, Compass, Car, Clock, TrendingUp,
  CreditCard, Menu, X, Github
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, Cell, PieChart, Pie
} from "recharts";
import { User, RequestForm, AuditLog, Notification, RequestItem, TravelItineraryRow, TravelExpenseRow, TravelExpensesDetails, CreditCard as CardType } from "./types.ts";
import { CreditCardMaster } from "./components/CreditCardMaster";
import { jsPDF } from "jspdf";
import { finalizeAndSavePDF } from "./components/PrintPDF";
import { processAndValidateFile } from "./utils/fileHelper";
import { InteractiveAmount } from "./components/InteractiveAmount";
import { AdvancedReports } from "./components/AdvancedReports";
import { SampleCollectionForm } from "./components/SampleCollectionForm";
import { AproflowLogo } from "./components/AproflowLogo";
import { AnimatePresence } from "motion/react";
import { SplashLoader } from "./components/SplashLoader";
import { customFetch } from "./utils/customFetch";

const fetch = customFetch;

const DEFAULT_CV_EXPENSE_HEADS = [
  "Audit Expenses (Food, Stationery, Printing, Travel Etc.)",
  "Business Promotion (Diwali Gifting)",
  "Certification/License Charges",
  "Conveyance Charges (Local Conveyance, TA)",
  "General Expenses (Salaries of Staff)",
  "Hotel & Lodging Expenses (Outstation Expenses)",
  "Inspection Related Expenses",
  "Lab accessories (Testing) (Lab related items)",
  "Labour Charges (For seals etc.)",
  "Legal & Professional Fees",
  "Marketing Expenses (Commission)",
  "Medical Expenses",
  "Membership & Subscription",
  "Notary Charges",
  "Postage & Courier Charges(Non GST) (Courier)",
  "Printing & Stationery Exp(Non GST) (ID Card, Printer Re-fill, Stationery)",
  "Rent Charges (Paradeep)",
  "Rent Payable",
  "Repairing & Maintenance Exp. General",
  "Repairing & Maintenance Exp. IT",
  "Sale of Scrap",
  "Sample Collection Charges",
  "Sampling Related Expenses",
  "Staff and Welfare (Picnic related, others, Food )",
  "Stamp Paper and Revenue Stamps",
  "Travelling Expenses (Outstation )"
];

const ApprovedByCell: React.FC<{
  value: string;
  onChange: (val: string) => void;
  employees: any[];
}> = ({ value, onChange, employees }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownCoords, setDropdownCoords] = useState({ top: 0, left: 0, width: 224 });

  const filtered = employees.filter(emp => {
    const s = search.toLowerCase();
    return (emp.name && emp.name.toLowerCase().includes(s)) ||
           (emp.employeeCode && emp.employeeCode.toLowerCase().includes(s)) ||
           (emp.department && emp.department.toLowerCase().includes(s));
  });

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const updateCoords = () => {
        if (!buttonRef.current) return;
        const rect = buttonRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        const openUp = spaceBelow < 240 && spaceAbove > spaceBelow;
        
        let leftPos = rect.left + rect.width / 2 - 112; // 112 is half of w-56
        if (leftPos < 10) leftPos = 10;
        if (leftPos + 224 > window.innerWidth - 10) {
          leftPos = window.innerWidth - 224 - 10;
        }

        setDropdownCoords({
          top: openUp ? rect.top - 245 : rect.bottom + 4,
          left: leftPos,
          width: 224
        });
      };

      updateCoords();
      window.addEventListener("resize", updateCoords);
      window.addEventListener("scroll", updateCoords, true);
      
      return () => {
        window.removeEventListener("resize", updateCoords);
        window.removeEventListener("scroll", updateCoords, true);
      };
    }
  }, [isOpen]);

  return (
    <td className="border border-slate-400 px-1 py-1 text-center font-sans text-[11px] relative select-none">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setSearch("");
        }}
        className="w-full text-center px-2 py-1 rounded bg-slate-50 border border-slate-200 text-slate-800 hover:bg-slate-100 focus:outline-none font-semibold transition flex items-center justify-between"
      >
        <span className="truncate flex-1 text-center font-medium font-sans text-[#111827]">{value || "Select Approver"}</span>
        <span className="text-[8px] text-slate-400 ml-1">▼</span>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div 
            style={{ 
              position: "fixed", 
              top: `${dropdownCoords.top}px`, 
              left: `${dropdownCoords.left}px`, 
              width: `${dropdownCoords.width}px` 
            }}
            className="bg-white border border-slate-300 rounded-xl shadow-2xl z-50 text-left p-2 space-y-2 animate-fade-in max-h-60 flex flex-col"
          >
            <div className="relative">
              <input
                type="text"
                placeholder="Search employee..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-2 pr-2 py-1 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 font-medium font-sans"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className="overflow-y-auto max-h-40 divide-y divide-slate-100 flex-1">
              {filtered.length === 0 ? (
                <div className="text-[10px] text-slate-400 p-3 text-center">No employee found</div>
              ) : (
                filtered.map((emp) => (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => {
                      onChange(emp.name);
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-2 py-2 hover:bg-slate-50 font-sans text-[11px] break-all block transition rounded-md"
                  >
                    <div className="font-bold text-slate-900">{emp.name}</div>
                    <div className="text-[9px] text-slate-400 font-mono">
                      {emp.employeeCode} • {emp.department || "No Department"}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </td>
  );
};

const MobileApprovedBySelect: React.FC<{
  value: string;
  onChange: (val: string) => void;
  employees: any[];
}> = ({ value, onChange, employees }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownCoords, setDropdownCoords] = useState({ top: 0, left: 0, width: 220 });

  const filtered = employees.filter(emp => {
    const s = search.toLowerCase();
    return (emp.name && emp.name.toLowerCase().includes(s)) ||
           (emp.employeeCode && emp.employeeCode.toLowerCase().includes(s)) ||
           (emp.department && emp.department.toLowerCase().includes(s));
  });

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const updateCoords = () => {
        if (!buttonRef.current) return;
        const rect = buttonRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        const openUp = spaceBelow < 240 && spaceAbove > spaceBelow;
        
        setDropdownCoords({
          top: openUp ? rect.top - 245 : rect.bottom + 4,
          left: rect.left,
          width: rect.width
        });
      };

      updateCoords();
      window.addEventListener("resize", updateCoords);
      window.addEventListener("scroll", updateCoords, true);
      
      return () => {
        window.removeEventListener("resize", updateCoords);
        window.removeEventListener("scroll", updateCoords, true);
      };
    }
  }, [isOpen]);

  return (
    <div className="relative select-none w-full">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setSearch("");
        }}
        className="w-full text-left px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 focus:outline-none font-semibold text-xs transition flex items-center justify-between"
      >
        <span className="truncate flex-1 font-medium font-sans text-slate-900">{value || "Select Approver"}</span>
        <span className="text-[8px] text-slate-400 ml-1">▼</span>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div 
            style={{ 
              position: "fixed", 
              top: `${dropdownCoords.top}px`, 
              left: `${dropdownCoords.left}px`, 
              width: `${dropdownCoords.width}px` 
            }}
            className="bg-white border border-slate-300 rounded-xl shadow-2xl z-50 text-left p-2 space-y-2 animate-fade-in max-h-60 flex flex-col"
          >
            <div className="relative">
              <input
                type="text"
                placeholder="Search employee..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-2 pr-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 font-medium font-sans"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className="overflow-y-auto max-h-40 divide-y divide-slate-100 flex-1">
              {filtered.length === 0 ? (
                <div className="text-[10px] text-slate-400 p-3 text-center">No employee found</div>
              ) : (
                filtered.map((emp) => (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => {
                      onChange(emp.name);
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-2 py-2 hover:bg-slate-50 font-sans text-[11px] break-all block transition rounded-md"
                  >
                    <div className="font-bold text-slate-900">{emp.name}</div>
                    <div className="text-[9px] text-slate-400 font-mono">
                      {emp.employeeCode} • {emp.department || "No Department"}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const numberToWords = (num: number): string => {
  if (num === 0) return "zero";
  const ones = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
  const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
  
  const helper = (n: number): string => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
    if (n < 1000) return ones[Math.floor(n / 100)] + " hundred" + (n % 100 ? " and " + helper(n % 100) : "");
    return "";
  };
  
  if (num < 1000) return helper(num);
  let words = "";
  if (Math.floor(num / 100000) > 0) {
    words += helper(Math.floor(num / 100000)) + " lakh ";
    num %= 100000;
  }
  if (Math.floor(num / 1000) > 0) {
    words += helper(Math.floor(num / 1000)) + " thousand ";
    num %= 1000;
  }
  if (num > 0) {
    words += helper(num);
  }
  return words.trim();
};

const getCategoryPrefix = (category: string): string => {
  if (!category) return "GEN";
  
  if (category === "Credit Card Expense") return "CCE";
  if (category === "Cash Voucher") return "CV";
  if (category === "Local Conveyance") return "LC";
  if (category === "Sample Collection") return "SC";
  if (category === "Outstation Travel Allowance" || category === "Travel allowance") return "OTA";
  
  // Clean up special characters from the category
  const clean = category.trim().replace(/[^a-zA-Z\s]/g, "");
  if (!clean) return "GEN";
  
  const words = clean.split(/\s+/).filter(w => w.length > 0);
  if (words.length >= 2) {
    return words.slice(0, 3).map(w => w[0].toUpperCase()).join("");
  } else {
    const w = words[0];
    if (w.length >= 2) {
      return w.substring(0, 2).toUpperCase();
    }
    return w.toUpperCase() + "X";
  }
};

export function getDeduplicatedRequests(list: RequestForm[]): RequestForm[] {
  const result: RequestForm[] = [];
  const processed = new Set<string>();

  // Determine priority: we prefer "Cash Voucher" as the final payable expense.
  // We sort so that "Cash Voucher" is processed first.
  const sorted = [...list].sort((a, b) => {
    const aIsCV = a.category === "Cash Voucher";
    const bIsCV = b.category === "Cash Voucher";
    if (aIsCV && !bIsCV) return -1;
    if (!aIsCV && bIsCV) return 1;
    return 0;
  });

  for (const r of sorted) {
    if (processed.has(r.id)) continue;

    const linkedItemIndex = result.findIndex(exist => 
      (r.linkedDocumentId && exist.id === r.linkedDocumentId) || 
      (exist.linkedDocumentId && exist.linkedDocumentId === r.id)
    );

    if (linkedItemIndex !== -1) {
      processed.add(r.id);
    } else {
      result.push(r);
      processed.add(r.id);
    }
  }
  return result;
}

export function App() {
  // Session States
  const [splashComplete, setSplashComplete] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem("aproflow_splash_played") === "true";
    } catch {
      return false;
    }
  });
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [sessionToken, setSessionToken] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [appError, setAppError] = useState("");
  const [appSuccess, setAppSuccess] = useState("");
  const [createdRequestForCV, setCreatedRequestForCV] = useState<RequestForm | null>(null);
  const [linkingSuccessMsg, setLinkingSuccessMsg] = useState("");

  // Navigation / View Tabs
  const [currentPage, setCurrentPage] = useState<"dashboard" | "requests" | "new-request" | "cash-voucher" | "employees" | "audit-logs" | "numbering-settings" | "centralized-records" | "commissions" | "advanced-reports">("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Commission States
  const [commissionsList, setCommissionsList] = useState<any[]>([]);
  const [selectedCommission, setSelectedCommission] = useState<any | null>(null);
  
  // Master Commission creation form states
  const [comEmpName, setComEmpName] = useState("");
  const [comEmpId, setComEmpId] = useState("");
  const [comDept, setComDept] = useState("Sales/Marketing");
  const [comTotalAmount, setComTotalAmount] = useState("");
  const [comPurpose, setComPurpose] = useState("");
  const [comMonth, setComMonth] = useState(new Date().toISOString().substring(0, 7));
  const [comNotes, setComNotes] = useState("");
  const [isCreatingCommission, setIsCreatingCommission] = useState(false);

  // Commission Payout form states
  const [comPayoutAmount, setComPayoutAmount] = useState("");
  const [comPayoutRemark, setComPayoutRemark] = useState("");
  const [isFilingPayout, setIsFilingPayout] = useState(false);

  // Commission List Filters
  const [commSearchQuery, setCommSearchQuery] = useState("");
  const [commStatusFilter, setCommStatusFilter] = useState("All");
  const [commDeptFilter, setCommDeptFilter] = useState("All");

  // Sequential Document Numbering Configuration States
  const [selectedDocType, setSelectedDocType] = useState<"CV" | "LC" | "EV" | "PV" | "JV" >("EV");
  const [numberingSettings, setNumberingSettings] = useState<any>(null);
  
  const [cvPrefix, setCvPrefix] = useState("CV");
  const [cvStarting, setCvStarting] = useState(1);
  const [cvEnabled, setCvEnabled] = useState(true);
  const [cvZeros, setCvZeros] = useState(4);

  const [lcPrefix, setLcPrefix] = useState("LC");
  const [lcStarting, setLcStarting] = useState(1);
  const [lcEnabled, setLcEnabled] = useState(true);
  const [lcZeros, setLcZeros] = useState(4);

  const [scPrefix, setScPrefix] = useState("SC");
  const [scStarting, setScStarting] = useState(1);
  const [scEnabled, setScEnabled] = useState(true);
  const [scZeros, setScZeros] = useState(4);

  const [evPrefix, setEvPrefix] = useState("EV");
  const [evStarting, setEvStarting] = useState(1);
  const [evEnabled, setEvEnabled] = useState(true);
  const [evZeros, setEvZeros] = useState(4);

  const [pvPrefix, setPvPrefix] = useState("PV");
  const [pvStarting, setPvStarting] = useState(1);
  const [pvEnabled, setPvEnabled] = useState(true);
  const [pvZeros, setPvZeros] = useState(4);

  const [jvPrefix, setJvPrefix] = useState("JV");
  const [jvStarting, setJvStarting] = useState(1);
  const [jvEnabled, setJvEnabled] = useState(true);
  const [jvZeros, setJvZeros] = useState(4);

  // Credit Card Expense specific states
  const [ccPrefix, setCcPrefix] = useState("CCE");
  const [ccStarting, setCcStarting] = useState(1);
  const [ccEnabled, setCcEnabled] = useState(true);
  const [ccZeros, setCcZeros] = useState(4);

  const [creditCardsList, setCreditCardsList] = useState<any[]>([]);
  const [ccVoucherNo, setCcVoucherNo] = useState("");
  const [ccCardId, setCcCardId] = useState("");
  const [ccAmount, setCcAmount] = useState("");
  const [ccDescription, setCcDescription] = useState("");
  const [ccExpenseDate, setCcExpenseDate] = useState(new Date().toISOString().split("T")[0]);
  const [ccExpenseHead, setCcExpenseHead] = useState("Travel");
  const [ccExpenseType, setCcExpenseType] = useState<"General" | "OTA">("General");
  const [ccLinkedOtaNo, setCcLinkedOtaNo] = useState("");
  const [ccManualOta, setCcManualOta] = useState(false);
  const [ccRemarks, setCcRemarks] = useState("");
  const [ccAttachments, setCcAttachments] = useState<string[]>([]);
  const [newCcAttachmentName, setNewCcAttachmentName] = useState("");
  
  const [customCvExpenseHeads, setCustomCvExpenseHeads] = useState<any[]>([]);
  const [showAddCustomExpenseHeadModal, setShowAddCustomExpenseHeadModal] = useState(false);
  const [customExpenseHeadName, setCustomExpenseHeadName] = useState("");
  const [customExpenseHeadError, setCustomExpenseHeadError] = useState("");
  
  const [ccTransactions, setCcTransactions] = useState<any[]>([
    { id: "cc-tx-1", cardId: "", description: "", amount: "" }
  ]);

  const handleAddCcTxRow = () => {
    setCcTransactions([
      ...ccTransactions,
      { id: "cc-tx-" + Date.now(), cardId: "", description: "", amount: "" }
    ]);
  };

  const handleUpdateCcTx = (index: number, key: string, val: any) => {
    const updated = [...ccTransactions];
    updated[index] = { ...updated[index], [key]: val };
    setCcTransactions(updated);
  };

  const handleRemoveCcTxRow = (index: number) => {
    if (ccTransactions.length === 1) return;
    setCcTransactions(ccTransactions.filter((_, idx) => idx !== index));
  };

  const [showAddCcForm, setShowAddCcForm] = useState(false);
  const [quickCardName, setQuickCardName] = useState("");
  const [quickCardholderName, setQuickCardholderName] = useState("");
  const [ccAddError, setCcAddError] = useState("");
  const [ccAddSuccess, setCcAddSuccess] = useState("");

  // Authentication Fields (Sign-In)
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Authentication Fields (Employee signup)
  const [regEmail, setRegEmail] = useState("");
  const [regName, setRegName] = useState("");
  const [regEmployeeCode, setRegEmployeeCode] = useState("");
  const [regDoj, setRegDoj] = useState(new Date().toISOString().split("T")[0]);
  const [regDepartment, setRegDepartment] = useState("IT");
  const [additionalDepartments, setAdditionalDepartments] = useState<string[]>([]);
  const [customDepartment, setCustomDepartment] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regEnterpriseCodeStr, setRegEnterpriseCodeStr] = useState("");
  const [verifiedEnterpriseCode, setVerifiedEnterpriseCode] = useState("");
  const [isEnterpriseVerified, setIsEnterpriseVerified] = useState(false);
  const [verifyingEnterprise, setVerifyingEnterprise] = useState(false);
  const [enterpriseVerifyError, setEnterpriseVerifyError] = useState("");
  const [verifiedEnterpriseName, setVerifiedEnterpriseName] = useState("");
  const [enterpriseCustomDepartments, setEnterpriseCustomDepartments] = useState<string[]>([]);

  // States for Admin/Employee Registration Tab Manager
  const [authTab, setAuthTab] = useState<"login" | "employee_register" | "admin_register">("login");
  const [adminRegEnterpriseName, setAdminRegEnterpriseName] = useState("");
  const [adminRegEmail, setAdminRegEmail] = useState("");
  const [adminRegName, setAdminRegName] = useState("");
  const [adminRegUsername, setAdminRegUsername] = useState("");
  const [adminRegPassword, setAdminRegPassword] = useState("");

  // Dashboard Metrics & Charts States
  const [dashboardMetrics, setDashboardMetrics] = useState<any>(null);
  const [requestsList, setRequestsList] = useState<RequestForm[]>([]);
  // Centralized records filter states
  const [centralSearch, setCentralSearch] = useState("");
  const [centralStatus, setCentralStatus] = useState("All");
  const [centralEmployee, setCentralEmployee] = useState("All");
  const [centralDepartment, setCentralDepartment] = useState("All");
  const [centralDocType, setCentralDocType] = useState("All");
  const [centralStage, setCentralStage] = useState("All");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [employeesList, setEmployeesList] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isNotifPopoverOpen, setIsNotifPopoverOpen] = useState(false);
  const [savedPdfs, setSavedPdfs] = useState<any[]>([]);

  // Selected Request detail slideover state
  const [activeRequestDetails, setActiveRequestDetails] = useState<RequestForm | null>(null);
  const [newCommentText, setNewCommentText] = useState("");
  const [adminDecisionRemark, setAdminDecisionRemark] = useState("");
  const [approvedAmountInput, setApprovedAmountInput] = useState<string>("");
  const [reductionReasonInput, setReductionReasonInput] = useState<string>("");

  useEffect(() => {
    if (activeRequestDetails) {
      setApprovedAmountInput(
        activeRequestDetails.approvedAmount !== undefined
          ? String(activeRequestDetails.approvedAmount)
          : String(activeRequestDetails.totalBudget)
      );
      setReductionReasonInput(activeRequestDetails.reductionReason || "");
      setAdminDecisionRemark("");
    } else {
      setApprovedAmountInput("");
      setReductionReasonInput("");
      setAdminDecisionRemark("");
    }
  }, [activeRequestDetails]);

  const [escalateTo, setEscalateTo] = useState<"admin" | "superadmin" | "">("");
  const [selectedNextApproverId, setSelectedNextApproverId] = useState<string>("");
  const [selectedAdminId, setSelectedAdminId] = useState<string>("");
  const [selectedSuperAdminId, setSelectedSuperAdminId] = useState<string>("");
  const [administrators, setAdministrators] = useState<User[]>([]);
  const [superAdministrators, setSuperAdministrators] = useState<User[]>([]);
  const [approverSearchQuery, setApproverSearchQuery] = useState("");
  const [reviewSearchQuery, setReviewSearchQuery] = useState("");

  // Create/Edit Request Form states
  const [editingRequestId, setEditingRequestId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("");
  const [category, setCategory] = useState("Equipment");
  const [customCategory, setCustomCategory] = useState("");
  const [additionalCategories, setAdditionalCategories] = useState<string[]>([]);
  const [selectedHeadId, setSelectedHeadId] = useState<string>("");
  const [departmentHeads, setDepartmentHeads] = useState<User[]>([]);
  const [regRole, setRegRole] = useState<"employee" | "head" | "admin" >("employee");

  // Travel Specific States
  const [departureDate, setDepartureDate] = useState("");
  const [arrivalDate, setArrivalDate] = useState("");
  const [travelFrom, setTravelFrom] = useState("");
  const [travelTo, setTravelTo] = useState("");
  const [hotelName, setHotelName] = useState("");
  const [hotelDetails, setHotelDetails] = useState("");
  const [travelNotes, setTravelNotes] = useState("");

  // Rich Travel Itinerary & Expense States
  const [trainNoName, setTrainNoName] = useState("");
  const [millNameAddress, setMillNameAddress] = useState("");
  const [advanceAmount, setAdvanceAmount] = useState<number>(0);
  const [advanceDate, setAdvanceDate] = useState("");
  const [balanceReturnedHO, setBalanceReturnedHO] = useState<number>(0);
  const [balancePaidToTraveler, setBalancePaidToTraveler] = useState<number>(0);
  const [travelItinerary, setTravelItinerary] = useState<TravelItineraryRow[]>([
    {
      id: "leg-1",
      day: "1",
      date: new Date().toISOString().split("T")[0],
      from: "",
      departureTime: "",
      to: "",
      arrivalTime: "",
      lodgingDesc: "",
      lodgingCost: 0,
      foodDesc: "",
      foodCost: 0,
      conveyanceType: "",
      conveyanceCost: 0,
      rowTotal: 0
    }
  ]);
  
  // Cash Voucher Specific States
  const [cvStep, setCvStep] = useState<1 | 2>(1); // 1 = format, 2 = upload proof
  const [cvVoucherNo, setCvVoucherNo] = useState("");
  const [cvDebitTo, setCvDebitTo] = useState("");
  const [cvFileNo, setCvFileNo] = useState("");
  const [cvExpenseDetails, setCvExpenseDetails] = useState("");
  const [cvIncurredBy, setCvIncurredBy] = useState("");
  const [cvAmount, setCvAmount] = useState<number | "">("");
  const [cvAmountInWords, setCvAmountInWords] = useState("");
  const [cvCheckedBy, setCvCheckedBy] = useState("");
  const [cvAuthorisedBy, setCvAuthorisedBy] = useState("");
  const [cvReceivedPaymentBy, setCvReceivedPaymentBy] = useState("");
  
  // Page 2: Proof
  const [cvBillDate, setCvBillDate] = useState("");
  const [cvBillParticulars, setCvBillParticulars] = useState("");
  const [cvBillRate, setCvBillRate] = useState("");
  const [cvBillAmount, setCvBillAmount] = useState<number | "">("");
  const [cvBillFileContent, setCvBillFileContent] = useState<string>(""); // base64 representation or mockup
  const [cvBillFileName, setCvBillFileName] = useState("");

  // Travel Expenses Specific States
  const [teStep, setTeStep] = useState<1 | 2>(1); // 1 = format, 2 = upload proof
  const [teVoucherNo, setTeVoucherNo] = useState("");
  const [teFilerName, setTeFilerName] = useState("");
  const [teDateDesc, setTeDateDesc] = useState("");
  const [teDetails, setTeDetails] = useState("");
  const [teRows, setTeRows] = useState<TravelExpenseRow[]>([
    { id: "row-1", serialNo: 1, date: "", particular: "", amount: 0 }
  ]);
  const [teBillFileContent, setTeBillFileContent] = useState<string>("");
  const [teBillFileName, setTeBillFileName] = useState("");

  // Local Conveyance Specific States
  const [lcVoucherNo, setLcVoucherNo] = useState("");
  const [lcFileNo, setLcFileNo] = useState("");
  const [lcKindOfExpense, setLcKindOfExpense] = useState("");
  const [lcIncurredBy, setLcIncurredBy] = useState("");
  const [lcRows, setLcRows] = useState<LocalConveyanceRow[]>([
    { id: "lc-row-1", serialNo: 1, date: new Date().toLocaleDateString("en-GB"), from: "", to: "", purpose: "", amount: 0 }
  ]);
  const [isLcEditing, setIsLcEditing] = useState(false);

  // Sample Collection Specific States
  const [scVoucherNo, setScVoucherNo] = useState("");
  const [scFileNo, setScFileNo] = useState("");
  const [scKindOfExpense, setScKindOfExpense] = useState("");
  const [scIncurredBy, setScIncurredBy] = useState("");
  const [scRows, setScRows] = useState<LocalConveyanceRow[]>([
    { id: "sc-row-1", serialNo: 1, date: new Date().toLocaleDateString("en-GB"), from: "", to: "", purpose: "", amount: 0 }
  ]);
  const [isScEditing, setIsScEditing] = useState(false);

  // Local Conveyance and Sample Collection Attachments States
  const [lcAttachments, setLcAttachments] = useState<string[]>([]);
  const [scAttachments, setScAttachments] = useState<string[]>([]);
  const [newLcAttachmentName, setNewLcAttachmentName] = useState("");
  const [newScAttachmentName, setNewScAttachmentName] = useState("");
  const [isLcDragging, setIsLcDragging] = useState(false);
  const [isScDragging, setIsScDragging] = useState(false);

  const processLcFiles = async (files: FileList) => {
    setAppError("");
    setAppSuccess("⏳ Processing and optimizing attached local conveyance proof... Please wait.");
    try {
      const list = Array.from(files);
      const processedResults: string[] = [];
      for (const file of list) {
        const res = await processAndValidateFile(file);
        processedResults.push(`${res.name}|${res.content}`);
      }
      setLcAttachments((prev) => [...prev, ...processedResults]);
      setAppSuccess(`Successfully processed and attached ${list.length} proof document(s) for local conveyance.`);
      setTimeout(() => setAppSuccess(""), 4500);
    } catch (err: any) {
      console.error("Local conveyance file processing error:", err);
      setAppError(err.message || "Failed to process attached proof.");
      setAppSuccess("");
    }
  };

  const processScFiles = async (files: FileList) => {
    setAppError("");
    setAppSuccess("⏳ Processing and optimizing attached sample collection proof... Please wait.");
    try {
      const list = Array.from(files);
      const processedResults: string[] = [];
      for (const file of list) {
        const res = await processAndValidateFile(file);
        processedResults.push(`${res.name}|${res.content}`);
      }
      setScAttachments((prev) => [...prev, ...processedResults]);
      setAppSuccess(`Successfully processed and attached ${list.length} proof document(s) for sample collection.`);
      setTimeout(() => setAppSuccess(""), 4500);
    } catch (err: any) {
      console.error("Sample collection file processing error:", err);
      setAppError(err.message || "Failed to process attached proof.");
      setAppSuccess("");
    }
  };

  const addLcAttachment = () => {
    if (!newLcAttachmentName.trim()) return;
    setLcAttachments([...lcAttachments, newLcAttachmentName.trim()]);
    setNewLcAttachmentName("");
  };

  const addScAttachment = () => {
    if (!newScAttachmentName.trim()) return;
    setScAttachments([...scAttachments, newScAttachmentName.trim()]);
    setNewScAttachmentName("");
  };

  const processCcFiles = async (files: FileList) => {
    setAppError("");
    setAppSuccess("⏳ Processing and optimizing attached credit card billing statement... Please wait.");
    try {
      const list = Array.from(files);
      const processedResults: string[] = [];
      for (const file of list) {
        const res = await processAndValidateFile(file);
        processedResults.push(`${res.name}|${res.content}`);
      }
      setCcAttachments((prev) => [...prev, ...processedResults]);
      setAppSuccess(`Successfully processed and attached ${list.length} proof receipt(s) for credit card expenses.`);
      setTimeout(() => setAppSuccess(""), 4500);
    } catch (err: any) {
      console.error("Credit card file processing error:", err);
      setAppError(err.message || "Failed to process attached proof.");
      setAppSuccess("");
    }
  };

  const addCcAttachment = () => {
    if (!newCcAttachmentName.trim()) return;
    setCcAttachments([...ccAttachments, newCcAttachmentName.trim()]);
    setNewCcAttachmentName("");
  };

  const getNextDocumentNoPreview = (category: string) => {
    const prefix = getCategoryPrefix(category);
    let starting = 1;
    let zeros = 4;
    let currentCounter = 0;
    
    if (prefix === "CV") {
      starting = cvStarting;
      zeros = cvZeros;
      currentCounter = numberingSettings?.counters?.CV || 0;
    } else if (prefix === "LC") {
      starting = lcStarting;
      zeros = lcZeros;
      currentCounter = numberingSettings?.counters?.LC || 0;
    } else if (prefix === "SC") {
      starting = scStarting;
      zeros = scZeros;
      currentCounter = numberingSettings?.counters?.SC || 0;
    } else if (prefix === "EV") {
      starting = evStarting;
      zeros = evZeros;
      currentCounter = numberingSettings?.counters?.EV || 0;
    } else if (prefix === "PV") {
      starting = pvStarting;
      zeros = pvZeros;
      currentCounter = numberingSettings?.counters?.PV || 0;
    } else if (prefix === "JV") {
      starting = jvStarting;
      zeros = jvZeros;
      currentCounter = numberingSettings?.counters?.JV || 0;
    } else if (prefix === "CCE") {
      starting = ccStarting;
      zeros = ccZeros;
      currentCounter = numberingSettings?.counters?.CCE || 0;
    } else {
      currentCounter = numberingSettings?.counters?.[prefix] || 0;
    }

    let nextSerial = Math.max(starting, currentCounter + 1);
    
    const companyCode = currentUser?.enterpriseCode || "2026";
    const localMatches = requestsList
      .filter((r) => (r.enterpriseCode || "2026") === companyCode && r.prefix === prefix)
      .map((r) => Number(r.serialNumber) || 0);
    if (localMatches.length > 0) {
      const maxExisting = Math.max(...localMatches);
      nextSerial = Math.max(nextSerial, maxExisting + 1);
    }

    const serialStr = String(nextSerial).padStart(zeros, "0");
    return `${prefix}-${serialStr}`;
  };

  useEffect(() => {
    if (currentPage === "cash-voucher" && numberingSettings) {
      setCvVoucherNo(getNextDocumentNoPreview("Cash Voucher"));
    }
    if (currentPage === "travel-expenses" && numberingSettings) {
      setTeVoucherNo(getNextDocumentNoPreview("Travel Expenses"));
    }
    if (currentPage === "local-conveyance" && numberingSettings) {
      setLcVoucherNo(getNextDocumentNoPreview("Local Conveyance"));
    }
    if (currentPage === "sample-collection" && numberingSettings) {
      setScVoucherNo(getNextDocumentNoPreview("Sample Collection"));
    }
    if (currentPage === "credit-card-expense" && numberingSettings) {
      setCcVoucherNo(getNextDocumentNoPreview("Credit Card Expense"));
    }
  }, [currentPage, requestsList, numberingSettings]);

  const resetTravelExpensesForm = () => {
    setTeStep(1);
    setTeVoucherNo(getNextDocumentNoPreview("Travel Expenses"));
    setTeFilerName(currentUser?.name || "");
    const todayStr = new Date().toLocaleDateString("en-GB");
    setTeDateDesc(todayStr);
    setTeDetails("");
    setTeRows([
      { id: "row-1", serialNo: 1, date: todayStr, particular: "", amount: 0 }
    ]);
    setTeBillFileContent("");
    setTeBillFileName("");
  };

  const resetCashVoucherForm = () => {
    setCvStep(1);
    setCvVoucherNo(getNextDocumentNoPreview("Cash Voucher"));
    setCvFileNo(new Date().toLocaleDateString("en-GB")); // formatted as e.g. 26/05/26
    setCvDebitTo("");
    setCvExpenseDetails("");
    setCvIncurredBy(currentUser?.name || "");
    setCvAmount("");
    setCvAmountInWords("");
    setCvCheckedBy("");
    setCvAuthorisedBy("");
    setCvReceivedPaymentBy("");
    setCvBillDate(new Date().toISOString().split("T")[0]);
    setCvBillParticulars("");
    setCvBillRate("");
    setCvBillAmount("");
    setCvBillFileContent("");
    setCvBillFileName("");
    setSelectedHeadId("");
    setSelectedAdminId("");
    setSelectedSuperAdminId("");
  };

  const resetLocalConveyanceForm = () => {
    setLcVoucherNo(getNextDocumentNoPreview("Local Conveyance"));
    setLcFileNo(new Date().toLocaleDateString("en-GB"));
    setLcKindOfExpense("");
    setLcIncurredBy(currentUser?.name || "");
    setLcRows([
      { id: "lc-row-1", serialNo: 1, date: new Date().toLocaleDateString("en-GB"), from: "", to: "", purpose: "", amount: 0 }
    ]);
    setLcAttachments([]);
    setNewLcAttachmentName("");
    setSelectedHeadId("");
    setSelectedAdminId("");
    setSelectedSuperAdminId("");
  };

  const resetSampleCollectionForm = () => {
    setScVoucherNo(getNextDocumentNoPreview("Sample Collection"));
    setScFileNo(new Date().toLocaleDateString("en-GB"));
    setScKindOfExpense("");
    setScIncurredBy(currentUser?.name || "");
    setScRows([
      { id: "sc-row-1", serialNo: 1, date: new Date().toLocaleDateString("en-GB"), from: "", to: "", purpose: "", amount: 0 }
    ]);
    setScAttachments([]);
    setNewScAttachmentName("");
    setSelectedHeadId("");
    setSelectedAdminId("");
    setSelectedSuperAdminId("");
  };

  const resetCreditCardExpenseForm = () => {
    setCcCardId("");
    setCcAmount("");
    setCcDescription("");
    setCcExpenseDate(new Date().toISOString().split("T")[0]);
    setCcExpenseHead("Travel");
    setCcExpenseType("General");
    setCcLinkedOtaNo("");
    setCcManualOta(false);
    setCcRemarks("");
    setCcAttachments([]);
    setNewCcAttachmentName("");
    setCcVoucherNo(getNextDocumentNoPreview("Credit Card Expense"));
    setSelectedHeadId("");
    setSelectedAdminId("");
    setSelectedSuperAdminId("");
    setShowAddCcForm(false);
    setQuickCardName("");
    setQuickCardholderName("");
    setCcTransactions([
      { id: "cc-tx-1", cardId: "", description: "", amount: "" }
    ]);
  };

  // Derived / Computed values
  const defaultDepartments = [
    "IT",
    "Administration",
    "HR",
    "Marketing",
    "Inspectors",
    "Chemist",
    "Office Assistants",
    "Business Head",
    "laboratory"
  ];

  // Dynamically extract other departments from existing employees list
  const existingEmployeeDepartments = employeesList
    .map((emp) => emp.department)
    .filter((dept): dept is string => typeof dept === "string" && dept !== "" && !defaultDepartments.includes(dept) && dept !== "Others");

  // Keep deduplicated list of all departments
  const allDepartments = Array.from(new Set([
    ...defaultDepartments,
    ...existingEmployeeDepartments,
    ...additionalDepartments
  ]));

  const defaultCategories = [
    "IT Infrastructure",
    "Equipment",
    "Marketing",
    "Sales Pitch",
    "Outstation Travel Allowance",
    "Petty Cash replenishment",
    "Credit Card Expense"
  ];

  // Dynamically extract other categories from existing requests
  const existingFormCategories = requestsList
    .map((r) => r.category)
    .filter((cat) => cat && !defaultCategories.includes(cat) && cat !== "Others");

  // Keep deduplicated list of all categories
  const allCategories = Array.from(new Set([
    ...defaultCategories,
    ...existingFormCategories,
    ...additionalCategories
  ]));

  const isTravel = category.toLowerCase().includes("travel") || (category === "Others" && customCategory.toLowerCase().includes("travel"));

  const resetTravelForm = () => {
    setDepartureDate("");
    setArrivalDate("");
    setTravelFrom("");
    setTravelTo("");
    setHotelName("");
    setHotelDetails("");
    setTravelNotes("");
    setTrainNoName("");
    setMillNameAddress("");
    setAdvanceAmount(0);
    setAdvanceDate("");
    setBalanceReturnedHO(0);
    setBalancePaidToTraveler(0);
    setTravelItinerary([
      {
        id: "leg-" + Math.random().toString(36).substring(2, 9),
        day: "1",
        date: new Date().toISOString().split("T")[0],
        from: "",
        departureTime: "",
        to: "",
        arrivalTime: "",
        lodgingDesc: "",
        lodgingCost: 0,
        foodDesc: "",
        foodCost: 0,
        conveyanceType: "",
        conveyanceCost: 0,
        rowTotal: 0
      }
    ]);
  };

  const updateItineraryRow = (id: string, field: keyof TravelItineraryRow, value: any) => {
    setTravelItinerary(prev => prev.map(row => {
      if (row.id !== id) return row;
      const updated = { ...row, [field]: value };
      const lodging = Number(updated.lodgingCost) || 0;
      const food = Number(updated.foodCost) || 0;
      const conveyance = Number(updated.conveyanceCost) || 0;
      updated.rowTotal = lodging + food + conveyance;
      return updated;
    }));
  };

  const addConveyanceItem = (rowId: string) => {
    setTravelItinerary(prev => prev.map(row => {
      if (row.id !== rowId) return row;
      const currentConveyances = row.conveyances && row.conveyances.length > 0
        ? row.conveyances
        : [{ id: "c-initial-" + Math.random().toString(36).substring(2, 9), type: row.conveyanceType || "", cost: Number(row.conveyanceCost) || 0 }];
      
      const newItem = {
        id: "c-new-" + Math.random().toString(36).substring(2, 9),
        type: "",
        cost: 0
      };
      
      const updatedConveyances = [...currentConveyances, newItem];
      const totalCost = updatedConveyances.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);
      const combinedTypes = updatedConveyances.map(c => c.type || "Transport").filter(Boolean).join(" + ");
      
      const lodging = Number(row.lodgingCost) || 0;
      const food = Number(row.foodCost) || 0;
      
      return {
        ...row,
        conveyances: updatedConveyances,
        conveyanceCost: totalCost,
        conveyanceType: combinedTypes,
        rowTotal: lodging + food + totalCost
      };
    }));
  };

  const updateConveyanceItem = (rowId: string, itemId: string, field: 'type' | 'cost', value: any) => {
    setTravelItinerary(prev => prev.map(row => {
      if (row.id !== rowId) return row;
      const currentConveyances = row.conveyances && row.conveyances.length > 0
        ? row.conveyances
        : [{ id: "c-initial-" + Math.random().toString(36).substring(2, 9), type: row.conveyanceType || "", cost: Number(row.conveyanceCost) || 0 }];
      
      const updatedConveyances = currentConveyances.map(item => {
        if (item.id !== itemId) return item;
        return { ...item, [field]: field === 'cost' ? (Number(value) || 0) : value };
      });

      const totalCost = updatedConveyances.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);
      const combinedTypes = updatedConveyances.map(c => c.type || "Transport").filter(Boolean).join(" + ");
      
      const lodging = Number(row.lodgingCost) || 0;
      const food = Number(row.foodCost) || 0;

      return {
        ...row,
        conveyances: updatedConveyances,
        conveyanceCost: totalCost,
        conveyanceType: combinedTypes,
        rowTotal: lodging + food + totalCost
      };
    }));
  };

  const removeConveyanceItem = (rowId: string, itemId: string) => {
    setTravelItinerary(prev => prev.map(row => {
      if (row.id !== rowId) return row;
      const currentConveyances = row.conveyances && row.conveyances.length > 0
        ? row.conveyances
        : [{ id: "c-initial-" + Math.random().toString(36).substring(2, 9), type: row.conveyanceType || "", cost: Number(row.conveyanceCost) || 0 }];
      
      if (currentConveyances.length <= 1) {
        // If only 1 remains, let's keep it but empty it out
        const updatedConveyances = [{ id: "c-initial-" + Math.random().toString(36).substring(2, 9), type: "", cost: 0 }];
        const lodging = Number(row.lodgingCost) || 0;
        const food = Number(row.foodCost) || 0;
        return {
          ...row,
          conveyances: updatedConveyances,
          conveyanceCost: 0,
          conveyanceType: "",
          rowTotal: lodging + food
        };
      }

      const updatedConveyances = currentConveyances.filter(item => item.id !== itemId);
      const totalCost = updatedConveyances.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);
      const combinedTypes = updatedConveyances.map(c => c.type || "Transport").filter(Boolean).join(" + ");
      
      const lodging = Number(row.lodgingCost) || 0;
      const food = Number(row.foodCost) || 0;

      return {
        ...row,
        conveyances: updatedConveyances,
        conveyanceCost: totalCost,
        conveyanceType: combinedTypes,
        rowTotal: lodging + food + totalCost
      };
    }));
  };

  const addItineraryRow = () => {
    const nextDay = travelItinerary.length + 1;
    const newRow: TravelItineraryRow = {
      id: "leg-" + Math.random().toString(36).substring(2, 9),
      day: String(nextDay),
      date: new Date().toISOString().split("T")[0],
      from: "",
      departureTime: "",
      to: "",
      arrivalTime: "",
      lodgingDesc: "",
      lodgingCost: 0,
      foodDesc: "",
      foodCost: 0,
      conveyanceType: "",
      conveyanceCost: 0,
      rowTotal: 0
    };
    setTravelItinerary(prev => [...prev, newRow]);
  };

  const deleteItineraryRow = (id: string) => {
    if (travelItinerary.length <= 1) {
      alert("At least one travel itinerary record is required.");
      return;
    }
    setTravelItinerary(prev => prev.filter(row => row.id !== id));
  };

  const [requestItems, setRequestItems] = useState<RequestItem[]>([]);
  const [formAttachments, setFormAttachments] = useState<string[]>([]);
  const [newAttachmentName, setNewAttachmentName] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  // Helper to read and process attached files into Base64 data URLs
  const processFiles = async (files: FileList) => {
    setAppError("");
    setAppSuccess("⏳ Processing and optimizing attached documents/images... Please wait.");
    
    try {
      const list = Array.from(files);
      const processedResults: string[] = [];
      
      for (const file of list) {
        const res = await processAndValidateFile(file);
        processedResults.push(`${res.name}|${res.content}`);
      }
      
      setFormAttachments((prev) => [...prev, ...processedResults]);
      setAppSuccess(`Successfully processed and attached ${list.length} file(s).`);
      setTimeout(() => setAppSuccess(""), 4500);
    } catch (err: any) {
      console.error("File processing error:", err);
      setAppError(err.message || "Failed to process attached files.");
      setAppSuccess("");
    }
  };

  // Item Creator input row states
  const [itemDesc, setItemDesc] = useState("");
  const [itemQty, setItemQty] = useState(1);
  const [itemPrice, setItemPrice] = useState(0);
  const [itemTax, setItemTax] = useState(18);

  // Initialization: Hydrate session
  useEffect(() => {
    const savedUser = localStorage.getItem("apruv_user");
    const savedToken = localStorage.getItem("apruv_token");
    if (savedUser && savedToken) {
      try {
        setCurrentUser(JSON.parse(savedUser));
        setSessionToken(savedToken);
      } catch (e) {
        localStorage.removeItem("apruv_user");
        localStorage.removeItem("apruv_token");
      }
    }
  }, []);

  // Fetch contextual platform data based on current page / tab triggering
  useEffect(() => {
    if (currentUser && sessionToken) {
      fetchDashboardMetrics();
      fetchRequests();
      fetchNotifications();
      fetchDepartmentHeads();
      fetchAdministrators();
      fetchSuperAdministrators();
      fetchNumberingSettings();
      fetchCommissions();
      fetchCreditCards();
      fetchCustomCvExpenseHeads();
      fetchSavedPdfs();
      
      if (currentUser.role === "admin" || currentUser.role === "superadmin") {
        fetchEmployees();
        fetchAuditLogs();
      }
    }
  }, [currentUser, sessionToken, currentPage]);

  // Periodic background polling loop (every 6 seconds) to keep the client UI in sync
  // with server database changes in multi-tab or shared-vs-dev environment sessions
  useEffect(() => {
    if (!currentUser || !sessionToken) return;

    const interval = setInterval(() => {
      fetchDashboardMetrics();
      fetchRequests();
      fetchNotifications();
      fetchCommissions();
      fetchCreditCards();
      fetchCustomCvExpenseHeads();
      fetchSavedPdfs();
      
      if (currentUser.role === "admin" || currentUser.role === "superadmin") {
        fetchEmployees();
        fetchAuditLogs();
      }
    }, 6000);

    return () => clearInterval(interval);
  }, [currentUser, sessionToken]);

  useEffect(() => {
    if (activeRequestDetails && currentUser) {
      if (currentUser.role === "head") {
        setEscalateTo("admin");
      } else if (currentUser.role === "admin") {
        setEscalateTo("superadmin");
      } else {
        setEscalateTo("");
      }
    }
  }, [activeRequestDetails, currentUser]);

  const apiHeaders = {
    "Content-Type": "application/json",
    "Authorization": sessionToken
  };

  // FETCH DISPATCHERS
  const fetchDashboardMetrics = async () => {
    try {
      const resp = await fetch("/api/dashboard/metrics", { headers: apiHeaders });
      if (resp.ok) {
        const data = await resp.json();
        setDashboardMetrics(data);
      }
    } catch (e) {
      console.error("Failed to load metrics", e);
    }
  };

  const fetchRequests = async () => {
    try {
      const resp = await fetch("/api/requests", { headers: apiHeaders });
      if (resp.ok) {
        const data = await resp.json();
        setRequestsList(data);
        // Sync active slideover if open
        if (activeRequestDetails) {
          const fresh = data.find((r: RequestForm) => r.id === activeRequestDetails.id);
          if (fresh) setActiveRequestDetails(fresh);
        }
      }
    } catch (e) {
      console.error("Failed to load requests", e);
    }
  };

  const fetchCommissions = async () => {
    try {
      const resp = await fetch("/api/commissions", { headers: apiHeaders });
      if (resp.ok) {
        const data = await resp.json();
        setCommissionsList(data.commissions || []);
        if (selectedCommission) {
          const fresh = data.commissions.find((c: any) => c.id === selectedCommission.id);
          if (fresh) setSelectedCommission(fresh);
        }
      }
    } catch (e) {
      console.error("Failed to fetch commissions", e);
    }
  };

  const saveMasterCommission = async (e: React.FormEvent) => {
    e.preventDefault();
    setAppError("");
    setAppSuccess("");

    let empId = comEmpId;
    let empName = comEmpName;
    let dept = comDept;

    if (currentUser.role !== "admin" && currentUser.role !== "superadmin") {
      empId = currentUser.id;
      empName = currentUser.name;
      dept = currentUser.department || "Sales/Marketing";
    }

    if (!empName.trim()) {
      setAppError("Please provide an Employee Name.");
      return;
    }
    if (!comTotalAmount || Number(comTotalAmount) <= 0) {
      setAppError("Please provide a valid positive commission amount.");
      return;
    }
    if (!comPurpose.trim()) {
      setAppError("Please specify a reason/purpose.");
      return;
    }

    setLoading(true);
    try {
      const resp = await fetch("/api/commissions", {
        method: "POST",
        headers: apiHeaders,
        body: JSON.stringify({
          employeeId: empId || "emp-custom",
          employeeName: empName.trim(),
          department: dept,
          totalAmount: Number(comTotalAmount),
          purpose: comPurpose.trim(),
          dateMonth: comMonth,
          notes: comNotes.trim()
        })
      });
      const data = await resp.json();
      if (resp.ok) {
        setAppSuccess(`Master Commission ${data.commission.id} successfully created for ${data.commission.employeeName}.`);
        setIsCreatingCommission(false);
        setComEmpName("");
        setComEmpId("");
        setComDept("Sales/Marketing");
        setComTotalAmount("");
        setComPurpose("");
        setComNotes("");
        fetchCommissions();
        fetchDashboardMetrics();
        fetchAuditLogs();
      } else {
        setAppError(data.error || "Failed to create master commission.");
      }
    } catch (err) {
      setAppError("Failed to communicate with corporate registry server.");
    } finally {
      setLoading(false);
    }
  };

  const saveCommissionPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setAppError("");
    setAppSuccess("");
    if (!selectedCommission) return;

    if (currentUser.role !== "admin" && currentUser.role !== "superadmin") {
      setAppError("Access denied: only Corporate Admins and Super Admins may generate payout vouchers.");
      return;
    }

    const amt = Number(comPayoutAmount);
    if (!amt || amt <= 0) {
      setAppError("Payout amount must be a positive number.");
      return;
    }

    setLoading(true);
    try {
      const resp = await fetch(`/api/commissions/${selectedCommission.id}/payout`, {
        method: "POST",
        headers: apiHeaders,
        body: JSON.stringify({
          payoutAmount: amt,
          remark: comPayoutRemark.trim()
        })
      });
      const data = await resp.json();
      if (resp.ok) {
        setAppSuccess(`Auto-filled payout Cash Voucher ${data.request.documentNumber || data.request.id} initialized for approval.`);
        setIsFilingPayout(false);
        setComPayoutAmount("");
        setComPayoutRemark("");
        fetchCommissions();
        fetchRequests();
        fetchDashboardMetrics();
        fetchAuditLogs();
      } else {
        setAppError(data.error || "Failed to create commission payout.");
      }
    } catch (err) {
      setAppError("Failed to dispatch automated payout request to server.");
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const resp = await fetch("/api/notifications", { headers: apiHeaders });
      if (resp.ok) {
        const data = await resp.json();
        setNotifications(data);
      }
    } catch (e) {
      console.error("Failed to load notifications", e);
    }
  };

  const fetchNumberingSettings = async () => {
    try {
      const resp = await fetch("/api/numbering-settings", { headers: apiHeaders });
      if (resp.ok) {
        const data = await resp.json();
        const conf = data.config;
        if (conf && conf.settings) {
          setNumberingSettings(conf);
          
          if (conf.settings.CV) {
            setCvPrefix(conf.settings.CV.prefix || "CV");
            setCvStarting(conf.settings.CV.startingValue || 1);
            setCvEnabled(conf.settings.CV.enabled !== false);
            setCvZeros(conf.settings.CV.leadingZeros || 4);
          }
          if (conf.settings.LC) {
            setLcPrefix(conf.settings.LC.prefix || "LC");
            setLcStarting(conf.settings.LC.startingValue || 1);
            setLcEnabled(conf.settings.LC.enabled !== false);
            setLcZeros(conf.settings.LC.leadingZeros || 4);
          }
          if (conf.settings.EV) {
            setEvPrefix(conf.settings.EV.prefix || "EV");
            setEvStarting(conf.settings.EV.startingValue || 1);
            setEvEnabled(conf.settings.EV.enabled !== false);
            setEvZeros(conf.settings.EV.leadingZeros || 4);
          }
          if (conf.settings.PV) {
            setPvPrefix(conf.settings.PV.prefix || "PV");
            setPvStarting(conf.settings.PV.startingValue || 1);
            setPvEnabled(conf.settings.PV.enabled !== false);
            setPvZeros(conf.settings.PV.leadingZeros || 4);
          }
          if (conf.settings.JV) {
            setJvPrefix(conf.settings.JV.prefix || "JV");
            setJvStarting(conf.settings.JV.startingValue || 1);
            setJvEnabled(conf.settings.JV.enabled !== false);
            setJvZeros(conf.settings.JV.leadingZeros || 4);
          }
          if (conf.settings.CCE) {
            setCcPrefix(conf.settings.CCE.prefix || "CCE");
            setCcStarting(conf.settings.CCE.startingValue || 1);
            setCcEnabled(conf.settings.CCE.enabled !== false);
            setCcZeros(conf.settings.CCE.leadingZeros || 4);
          }
        }
      }
    } catch (e) {
      console.error("Failed to load numbering settings", e);
    }
  };

  const updateNumberingSettings = async () => {
    setLoading(true);
    setAppError("");
    setAppSuccess("");
    try {
      const payload = {
        settings: {
          CV: { prefix: cvPrefix, startingValue: cvStarting, enabled: cvEnabled, leadingZeros: cvZeros },
          LC: { prefix: lcPrefix, startingValue: lcStarting, enabled: lcEnabled, leadingZeros: lcZeros },
          EV: { prefix: evPrefix, startingValue: evStarting, enabled: evEnabled, leadingZeros: evZeros },
          PV: { prefix: pvPrefix, startingValue: pvStarting, enabled: pvEnabled, leadingZeros: pvZeros },
          JV: { prefix: jvPrefix, startingValue: jvStarting, enabled: jvEnabled, leadingZeros: jvZeros },
          CCE: { prefix: ccPrefix, startingValue: ccStarting, enabled: ccEnabled, leadingZeros: ccZeros }
        }
      };

      const resp = await fetch("/api/numbering-settings", {
        method: "POST",
        headers: apiHeaders,
        body: JSON.stringify(payload)
      });
      const data = await resp.json();
      if (resp.ok) {
        setAppSuccess("Document naming and prefixes updated successfully for your enterprise!");
        setNumberingSettings(data.config);
      } else {
        setAppError(data.error || "Failed to update numbering prefixes.");
      }
    } catch (e) {
      setAppError("Failed to communicate with settings server.");
    } finally {
      setLoading(false);
    }
  };

  const cancelRequestForm = async (requestId: string, reason: string) => {
    setLoading(true);
    setAppError("");
    setAppSuccess("");
    try {
      const resp = await fetch(`/api/requests/${requestId}/cancel`, {
        method: "POST",
        headers: apiHeaders,
        body: JSON.stringify({ reason })
      });
      const data = await resp.json();
      if (resp.ok) {
        setAppSuccess("Document cancelled successfully.");
        fetchRequests();
        fetchDashboardMetrics();
        fetchAuditLogs();
      } else {
        setAppError(data.error || "Failed to cancel document.");
      }
    } catch (e) {
      setAppError("Connection failed while trying to cancel.");
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartmentHeads = async () => {
    try {
      const resp = await fetch("/api/department-heads", { headers: apiHeaders });
      if (resp.ok) {
        const data = await resp.json();
        setDepartmentHeads(data);
      }
    } catch (e) {
      console.error("Failed to load department heads list", e);
    }
  };

  const fetchAdministrators = async () => {
    try {
      const resp = await fetch("/api/administrators", { headers: apiHeaders });
      if (resp.ok) {
        const data = await resp.json();
        setAdministrators(data);
      }
    } catch (e) {
      console.error("Failed to load administrators list", e);
    }
  };

  const fetchSuperAdministrators = async () => {
    try {
      const resp = await fetch("/api/super-administrators", { headers: apiHeaders });
      if (resp.ok) {
        const data = await resp.json();
        setSuperAdministrators(data);
      }
    } catch (e) {
      console.error("Failed to load super administrators list", e);
    }
  };

  const renderRequestStatusBadge = (r: RequestForm) => {
    if (r.status === "Approved") {
      return (
        <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-emerald-55 text-emerald-800 border border-emerald-250">
          Approved
        </span>
      );
    }
    if (r.status === "Rejected") {
      return (
        <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-red-55 text-red-800 border border-red-250">
          Rejected
        </span>
      );
    }
    if (r.status === "Queried") {
      return (
        <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-blue-55 text-blue-800 border border-blue-250">
          Queried
        </span>
      );
    }
    if (r.status === "Draft") {
      return (
        <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-slate-100 text-slate-700 border border-slate-205">
          Draft
        </span>
      );
    }
    
    // Status is Pending - check approval stages
    if (r.stage === "head-approval") {
      return (
        <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-amber-50 text-amber-800 border border-amber-250" title={`Awaiting Head approval from ${r.assignedHeadName || 'Department Head'}`}>
          Pending Head ({r.assignedHeadName || 'Unassigned'})
        </span>
      );
    }
    if (r.stage === "admin-approval") {
      return (
        <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-indigo-50 text-indigo-800 border border-indigo-250" title="Passed Head review; now awaiting administrator review">
          Pending Admin
        </span>
      );
    }
    if (r.stage === "superadmin-approval") {
      return (
        <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-amber-100 text-amber-900 border border-amber-300 font-extrabold animate-pulse" title="Passed Admin review; awaiting Super Admin final ruling">
          Pending Super Admin 👑
        </span>
      );
    }

    return (
      <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-amber-50 text-amber-800 border border-amber-250" title="Awaiting general review">
        Pending Review
      </span>
    );
  };

  const fetchEmployees = async () => {
    try {
      const resp = await fetch("/api/employees", { headers: apiHeaders });
      if (resp.ok) {
        const data = await resp.json();
        setEmployeesList(data);
      }
    } catch (e) {
      console.error("Failed to load employees list", e);
    }
  };

  const fetchCreditCards = async () => {
    try {
      const resp = await fetch("/api/credit-cards", { headers: apiHeaders });
      if (resp.ok) {
        const data = await resp.json();
        if (data.success) {
          setCreditCardsList(data.creditCards || []);
        }
      }
    } catch (e) {
      console.error("Failed to load credit cards list", e);
    }
  };

  const fetchCustomCvExpenseHeads = async () => {
    try {
      const resp = await fetch("/api/custom-expense-heads", { headers: apiHeaders });
      if (resp.ok) {
        const data = await resp.json();
        if (data.success) {
          setCustomCvExpenseHeads(data.customExpenseHeads || []);
        }
      }
    } catch (e) {
      console.error("Failed to load custom cash voucher expense heads", e);
    }
  };

  const fetchSavedPdfs = async () => {
    try {
      const resp = await fetch("/api/saved-pdfs", { headers: apiHeaders });
      if (resp.ok) {
        const data = await resp.json();
        setSavedPdfs(data || []);
      }
    } catch (e) {
      console.error("Failed to load saved PDFs list", e);
    }
  };

  const handleAddCustomExpenseHead = async () => {
    setCustomExpenseHeadError("");
    if (!customExpenseHeadName.trim()) {
      setCustomExpenseHeadError("Please specify an expense head name.");
      return;
    }

    try {
      const resp = await fetch("/api/custom-expense-heads", {
        method: "POST",
        headers: {
          ...apiHeaders,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name: customExpenseHeadName.trim() })
      });
      const data = await resp.json();
      if (resp.ok && data.success) {
        await fetchCustomCvExpenseHeads();
        setCvDebitTo(data.customExpenseHead.name);
        setCustomExpenseHeadName("");
        setShowAddCustomExpenseHeadModal(false);
      } else {
        setCustomExpenseHeadError(data.error || "Failed to save customized classification.");
      }
    } catch (e: any) {
      setCustomExpenseHeadError(e?.message || "Failed to establish database carrier connection.");
    }
  };

  const handleQuickAddCard = async () => {
    setCcAddError("");
    setCcAddSuccess("");
    if (!quickCardName.trim()) {
      setCcAddError("Please fill in the Card Name / Bank.");
      return;
    }
    if (!quickCardholderName.trim()) {
      setCcAddError("Please fill in the Cardholder Name.");
      return;
    }

    try {
      const resp = await fetch("/api/credit-cards", {
        method: "POST",
        headers: {
          ...apiHeaders,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          cardName: quickCardName.trim(),
          cardholderName: quickCardholderName.trim(),
          status: "Active"
        })
      });
      const data = await resp.json();
      if (resp.ok && data.success) {
        setCcAddSuccess("Corporate card registered successfully!");
        setQuickCardName("");
        setQuickCardholderName("");
        await fetchCreditCards();
        if (data.creditCard && data.creditCard.id) {
          setCcCardId(data.creditCard.id);
        }
        setTimeout(() => {
          setShowAddCcForm(false);
          setCcAddSuccess("");
        }, 1500);
      } else {
        setCcAddError(data.error || "Failed to register new corporate card.");
      }
    } catch (err) {
      console.error(err);
      setCcAddError("Failed to communicate with service to register card.");
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const resp = await fetch("/api/audit-logs", { headers: apiHeaders });
      if (resp.ok) {
        const data = await resp.json();
        setAuditLogs(data);
      }
    } catch (e) {
      console.error("Failed to load audit logs", e);
    }
  };

  // --- GITHUB OAUTH WEB EVENT LISTENERS & ACTION HANDLERS ---
  useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      // Validate origin to match development preview/domain or localhost
      const origin = event.origin;
      if (!origin.endsWith(".run.app") && !origin.includes("localhost") && !origin.includes("127.0.0.1")) {
        return;
      }

      if (event.data?.type === "OAUTH_AUTH_SUCCESS") {
        const { user, token } = event.data;
        if (user && token) {
          localStorage.setItem("apruv_user", JSON.stringify(user));
          localStorage.setItem("apruv_token", token);
          setCurrentUser(user);
          setSessionToken(token);
          setAppSuccess(`Signed in securely with GitHub! Connected to Enterprise Workspace: ${user.enterpriseCode}`);
          setAppError("");
          setLoginEmail("");
          setLoginPassword("");
          setCurrentPage("dashboard");
        }
      } else if (event.data?.type === "OAUTH_AUTH_FAILURE") {
        setAppError(event.data.error || "GitHub authentication failed.");
        setAppSuccess("");
      }
    };

    window.addEventListener("message", handleOAuthMessage);
    return () => {
      window.removeEventListener("message", handleOAuthMessage);
    };
  }, []);

  const handleConnectGitHub = async (stateParam: string) => {
    setLoading(true);
    setAppError("");
    setAppSuccess("");

    try {
      const resp = await fetch(`/api/auth/github/url?state=${encodeURIComponent(stateParam)}`);
      const data = await resp.json();
      if (!resp.ok) {
        setAppError(data.error || "Failed to retrieve GitHub authentication server credentials.");
        setLoading(false);
        return;
      }

      const { url } = data;
      const width = 600;
      const height = 705;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const authWindow = window.open(
        url,
        "github_oauth_popup",
        `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes,status=yes`
      );

      if (!authWindow) {
        setAppError("Popup was blocked by your browser. Please allow popups for this site to log in with GitHub.");
      }
    } catch (err) {
      setAppError("Platform connection offline. Failed to connect to secure GitHub gateway.");
    } finally {
      setLoading(false);
    }
  };

  // AUTH ACTIONS
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAppError("");
    setAppSuccess("");

    if (!loginEmail || !loginPassword) {
      setAppError("Email/username and password credentials are required");
      setLoading(false);
      return;
    }

    try {
      const resp = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });

      const data = await resp.json();
      if (!resp.ok) {
        setAppError(data.error || "Login credentials unauthorized");
        return;
      }

      localStorage.setItem("apruv_user", JSON.stringify(data.user));
      localStorage.setItem("apruv_token", data.token);
      setCurrentUser(data.user);
      setSessionToken(data.token);
      setAppSuccess(`Signed in successfully! Group: ${data.user.enterpriseCode}`);
      setLoginEmail("");
      setLoginPassword("");
      setCurrentPage("dashboard");
    } catch (err) {
      setAppError("Platform connection offline. Failed to authenticate.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEnterpriseCode = async (codeStr: string) => {
    const trimmed = codeStr.trim();
    if (trimmed.length !== 4) {
      setEnterpriseVerifyError("Enterprise code must be exactly 4 digits.");
      setIsEnterpriseVerified(false);
      return;
    }
    setVerifyingEnterprise(true);
    setEnterpriseVerifyError("");
    try {
      const resp = await fetch(`/api/auth/verify-enterprise?code=${trimmed}`);
      const data = await resp.json();
      if (!resp.ok) {
        setEnterpriseVerifyError(data.error || "The enterprise code is invalid or currently inactive.");
        setIsEnterpriseVerified(false);
      } else {
        setIsEnterpriseVerified(true);
        setVerifiedEnterpriseCode(trimmed);
        setVerifiedEnterpriseName(data.enterpriseName || "");
        setEnterpriseCustomDepartments(data.departments || []);
        setRegDepartment("IT");
      }
    } catch (err) {
      setEnterpriseVerifyError("Database offline. Unable to verify Enterprise Code.");
      setIsEnterpriseVerified(false);
    } finally {
      setVerifyingEnterprise(false);
    }
  };

  const handleEmployeeRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAppError("");
    setAppSuccess("");

    const resolvedEnterpriseCode = currentUser ? currentUser.enterpriseCode : verifiedEnterpriseCode;

    if (!currentUser && !isEnterpriseVerified) {
      setAppError("Please verify your 4-digit Enterprise Code before registering.");
      setLoading(false);
      return;
    }

    if (!regEmail || !regName || !regEmployeeCode || !regPassword || !resolvedEnterpriseCode) {
      setAppError("Please complete all employee onboarding field items");
      setLoading(false);
      return;
    }

    const finalDepartment = regDepartment === "Others" ? (customDepartment.trim() || "Others") : regDepartment;
    if (regDepartment === "Others" && customDepartment.trim()) {
      const trimmed = customDepartment.trim();
      if (!allDepartments.includes(trimmed)) {
        setAdditionalDepartments((prev) => [...prev, trimmed]);
      }
    }

    try {
      const headersObj: Record<string, string> = { "Content-Type": "application/json" };
      if (sessionToken) {
        headersObj["Authorization"] = sessionToken;
      }

       const resp = await fetch("/api/auth/signup", {
        method: "POST",
        headers: headersObj,
        body: JSON.stringify({
          email: regEmail,
          name: regName,
          employeeCode: regEmployeeCode,
          doj: regDoj,
          department: finalDepartment,
          password: regPassword,
          enterpriseCode: resolvedEnterpriseCode,
          role: regRole
        })
      });

      const data = await resp.json();
      if (!resp.ok) {
        setAppError(data.error || "Failed completion of worker register setup");
        return;
      }

      if (currentUser) {
        setAppSuccess(`Worker ${regName} (${regEmployeeCode}) has been successfully onboarded!`);
        fetchEmployees();
        fetchDepartmentHeads();
        fetchAdministrators();
        fetchSuperAdministrators();
      } else {
        setAppSuccess("Onboarding complete! You can now sign in using your employee credentials.");
        setLoginEmail(regEmployeeCode);
        setLoginPassword(regPassword);
        setAuthTab("login");
      }
      
      // Reset signup fields
      setRegEmail("");
      setRegName("");
      setRegEmployeeCode("");
      setRegPassword("");
      setRegRole("employee");
      setRegDepartment("IT");
      setCustomDepartment("");
      setRegEnterpriseCodeStr("");
      setVerifiedEnterpriseCode("");
      setIsEnterpriseVerified(false);
      setEnterpriseVerifyError("");
      setVerifiedEnterpriseName("");
      setEnterpriseCustomDepartments([]);
    } catch (err) {
      setAppError("Failed to dispatch onboarding submission to database");
    } finally {
      setLoading(false);
    }
  };

  const handleAdminRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAppError("");
    setAppSuccess("");

    if (!adminRegEnterpriseName || !adminRegEmail || !adminRegName || !adminRegUsername || !adminRegPassword) {
      setAppError("All fields are required to register an Administrator account, including the Enterprise / Company Name");
      setLoading(false);
      return;
    }

    try {
      const resp = await fetch("/api/auth/register-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enterpriseName: adminRegEnterpriseName,
          email: adminRegEmail,
          name: adminRegName,
          username: adminRegUsername,
          password: adminRegPassword
        })
      });

      const resData = await resp.json();
      if (!resp.ok) {
        setAppError(resData.error || "Failed to register new Administrator");
        return;
      }

      // Automatically log them in on successful register!
      localStorage.setItem("apruv_user", JSON.stringify(resData.user));
      localStorage.setItem("apruv_token", resData.token);
      setCurrentUser(resData.user);
      setSessionToken(resData.token);
      setAppSuccess(`Administrator account created! Workspace enterprise code: ${resData.user.enterpriseCode}`);
      
      // Clean up fields
      setAdminRegEnterpriseName("");
      setAdminRegEmail("");
      setAdminRegName("");
      setAdminRegUsername("");
      setAdminRegPassword("");
      setAuthTab("login");
      
      setCurrentPage("dashboard");
    } catch (err) {
      setAppError("Server connect error. Failed to dispatch admin registration.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("apruv_user");
    localStorage.removeItem("apruv_token");
    setCurrentUser(null);
    setSessionToken("");
    setAppSuccess("You have safely signed out of Corporate Workspace.");
    setActiveRequestDetails(null);
  };

  const triggerQuickLogin = (email: string, pass: string) => {
    setLoginEmail(email);
    setLoginPassword(pass);
  };

  // GENERATE PROFICIENT PDF REPORT RECORD WITH SPEND DETAILS & COMPLIANCE STATUS
  const downloadApprovalPDF = async (incomingRequest: RequestForm, asDocOnly: boolean = false): Promise<any> => {
    let r = { ...incomingRequest };
    if (r.status === "Partially Approved" && r.approvedAmount !== undefined) {
      r.totalBudget = r.approvedAmount;
      if (r.cashVoucherDetails) {
        r.cashVoucherDetails = {
          ...r.cashVoucherDetails,
          billAmount: r.approvedAmount,
          amount: r.approvedAmount
        };
      }
      if (r.localConveyanceDetails) {
        r.localConveyanceDetails = {
          ...r.localConveyanceDetails,
          amount: r.approvedAmount
        };
      }
      if (r.travelExpensesDetails) {
        r.travelExpensesDetails = {
          ...r.travelExpensesDetails,
          totalAmount: r.approvedAmount
        };
      }
      if (r.creditCardDetails) {
        r.creditCardDetails = {
          ...r.creditCardDetails,
          amount: r.approvedAmount
        };
      }
      if (r.totals) {
        r.totals = {
          ...r.totals,
          grandTotal: r.approvedAmount,
          netTotal: r.approvedAmount
        };
      }
    }
    const doc = new jsPDF("p", "mm", "a4");

    const enterpriseNameVal = (r.enterpriseName || currentUser?.enterpriseName || "PROFLOW ENTERPRISE").toUpperCase();

    // Unified Header for Approval documents
    const drawApprovalHeader = (d: typeof doc, y: number, docTitle: string, docSub: string) => {
      // Background Accent bar
      d.setFillColor(15, 23, 42); // slate-900 / Deep blackish blue
      d.rect(15, y, 180, 20, "F");

      // Text Header
      d.setTextColor(255, 255, 255);
      d.setFont("Helvetica", "bold");
      d.setFontSize(11);
      d.text(`APROFLOW APPROVALS - ${enterpriseNameVal}`, 21, y + 8);

      d.setFont("Helvetica", "normal");
      d.setFontSize(7.5);
      d.setTextColor(203, 213, 225); // slate-300
      d.text(`${docTitle.toUpperCase()} • ${docSub.toUpperCase()}`, 21, y + 14);

      // Status Badge inside header
      const statusColors: { [key: string]: [number, number, number] } = {
        Approved: [22, 163, 74], // green
        "Partially Approved": [217, 119, 6], // amber
        Rejected: [220, 38, 38], // red
        Pending: [37, 99, 235], // blue
        "Revision Requested": [217, 119, 6],
        Draft: [100, 116, 139]
      };
      const bColor = statusColors[r.status] || [100, 116, 139];
      d.setFillColor(bColor[0], bColor[1], bColor[2]);
      d.rect(210 - 15 - 38, y + 4.5, 33, 11, "F");

      d.setTextColor(255, 255, 255);
      d.setFont("Helvetica", "bold");
      d.setFontSize(8);
      d.text(r.status.toUpperCase(), 210 - 15 - 21.5, y + 12, { align: "center" });
    };

    // Unified Header for Cash Voucher documents
    const drawCashVoucherHeader = (d: typeof doc, y: number, subHeader: string) => {
      d.setFont("Helvetica", "bold");
      d.setFontSize(14);
      d.text("APROFLOW", 15, y);

      d.setFont("Helvetica", "bold");
      d.setFontSize(10.5);
      d.setTextColor(51, 65, 85); // slate-700
      d.text(enterpriseNameVal, 15, y + 5.5);

      d.setFont("Helvetica", "normal");
      d.setFontSize(7.5);
      d.setTextColor(148, 163, 184); // slate-400
      d.text(`${subHeader.toUpperCase()} • Issued: ${new Date().toLocaleString()}`, 15, y + 10.5);
    };

    // Page Break helper
    const checkPageBreak = (d: typeof doc, yVal: number, needed: number, docTitle: string, docSub: string): number => {
      if (yVal + needed > 265) {
        d.addPage();
        drawApprovalHeader(d, 15, docTitle, docSub);
        return 42; // Starts after header space
      }
      return yVal;
    };

    const checkCashVoucherPageBreak = (d: typeof doc, yVal: number, needed: number, subHeader: string): number => {
      if (yVal + needed > 265) {
        d.addPage();
        drawCashVoucherHeader(d, 15, subHeader);
        return 38;
      }
      return yVal;
    };

    // Unified Amount Summary Box
    const drawAmountSummaryTable = (d: typeof doc, y: number, docTitle: string, docSub: string): number => {
      const requested = r.totalBudget || 0;
      const approved = incomingRequest.approvedAmount !== undefined ? incomingRequest.approvedAmount : (r.approvedAmount !== undefined ? r.approvedAmount : requested);
      const reduction = Math.max(0, requested - approved);

      const heightNeeded = reduction > 0 && incomingRequest.reductionReason ? 42 : 32;
      const startY = checkPageBreak(d, y, heightNeeded, docTitle, docSub);

      // Draw Box
      d.setFillColor(248, 250, 252); // slate-50
      d.setDrawColor(203, 213, 225); // slate-300
      d.setLineWidth(0.4);
      d.rect(15, startY, 180, 24, "FD");

      const cw = 45; // 4 columns, 45mm each
      
      // Vertical separators
      d.setDrawColor(226, 232, 240);
      d.line(15 + cw, startY, 15 + cw, startY + 24);
      d.line(15 + (cw * 2), startY, 15 + (cw * 2), startY + 24);
      d.line(15 + (cw * 3), startY, 15 + (cw * 3), startY + 24);

      // Col 1: Requested
      d.setTextColor(100, 116, 139);
      d.setFont("Helvetica", "bold");
      d.setFontSize(7.5);
      d.text("REQUESTED BUDGET", 15 + 4, startY + 7);
      d.setTextColor(15, 23, 42);
      d.setFont("Helvetica", "bold");
      d.setFontSize(10.5);
      d.text(`₹ ${requested.toLocaleString("en-IN")}`, 15 + 4, startY + 17);

      // Col 2: Approved
      d.setTextColor(100, 116, 139);
      d.setFont("Helvetica", "bold");
      d.setFontSize(7.5);
      d.text("APPROVED BUDGET", 15 + cw + 4, startY + 7);
      d.setTextColor(22, 163, 74);
      d.setFont("Helvetica", "bold");
      d.setFontSize(10.5);
      d.text(`₹ ${approved.toLocaleString("en-IN")}`, 15 + cw + 4, startY + 17);

      // Col 3: Reduction
      d.setTextColor(100, 116, 139);
      d.setFont("Helvetica", "bold");
      d.setFontSize(7.5);
      d.text("REDUCTION AMOUNT", 15 + (cw * 2) + 4, startY + 7);
      d.setTextColor(reduction > 0 ? 220 : 100, reduction > 0 ? 38 : 116, reduction > 0 ? 38 : 139);
      d.setFont("Helvetica", "bold");
      d.setFontSize(10.5);
      d.text(`₹ ${reduction.toLocaleString("en-IN")}`, 15 + (cw * 2) + 4, startY + 17);

      // Col 4: Final Payable
      d.setTextColor(79, 70, 229);
      d.setFont("Helvetica", "bold");
      d.setFontSize(7.5);
      d.text("FINAL PAYABLE SUM", 15 + (cw * 3) + 4, startY + 7);
      d.setTextColor(79, 70, 229);
      d.setFont("Helvetica", "bold");
      d.setFontSize(11);
      d.text(`₹ ${approved.toLocaleString("en-IN")}`, 15 + (cw * 3) + 4, startY + 17);

      let nextY = startY + 24;
      
      const reductionReasonText = incomingRequest.reductionReason || r.reductionReason;
      if (reduction > 0 && reductionReasonText) {
        d.setFillColor(254, 242, 242); // red-50
        d.setDrawColor(252, 165, 165); // red-300
        d.rect(15, nextY, 180, 10, "FD");
        
        d.setFont("Helvetica", "bold");
        d.setFontSize(8);
        d.setTextColor(220, 38, 38);
        d.text("Reduction Reason:", 18, nextY + 6.5);
        d.setFont("Helvetica", "normal");
        d.setTextColor(127, 29, 29);
        d.text(d.splitTextToSize(reductionReasonText, 135), 48, nextY + 6.5);
        
        nextY += 10;
      }

      return nextY + 6;
    };

    // Unified Approval Summary Box
    const drawApprovalSummaryBox = (d: typeof doc, y: number, docTitle: string, docSub: string): number => {
      const approversList: Array<{ name: string; role: string; date: string; status: string }> = [];
      
      if (r.approvalHistory && r.approvalHistory.length > 0) {
        r.approvalHistory.forEach(h => {
          approversList.push({
            name: h.approverName || "N/A",
            role: h.approverRole || "Approved",
            date: h.timestamp ? new Date(h.timestamp).toLocaleString("en-IN") : "N/A",
            status: h.status || "Approved"
          });
        });
      } else {
        if (r.headApprovalStatus === "Approved" || r.headApprovedBy) {
          approversList.push({
            name: r.headApprovedBy || r.assignedHeadName || "Department Head",
            role: "Department Head Approval",
            date: r.headApprovalDate ? new Date(r.headApprovalDate).toLocaleString("en-IN") : "N/A",
            status: r.headApprovalStatus || "Approved"
          });
        }
        if (r.adminApprovalStatus === "Approved" || r.adminApprovedBy) {
          approversList.push({
            name: r.adminApprovedBy || r.assignedAdminName || "Financial Administrator",
            role: "Financial Review Approval",
            date: r.adminApprovalDate ? new Date(r.adminApprovalDate).toLocaleString("en-IN") : "N/A",
            status: r.adminApprovalStatus || "Approved"
          });
        }
        if (r.superAdminApprovalStatus === "Approved" || r.superAdminApprovedBy) {
          approversList.push({
            name: r.superAdminApprovedBy || r.assignedSuperAdminName || "Super Administrator",
            role: "Super Admin Final Sign-off",
            date: r.superAdminApprovalDate ? new Date(r.superAdminApprovalDate).toLocaleString("en-IN") : "N/A",
            status: r.superAdminApprovalStatus || "Approved"
          });
        }
        if (approversList.length === 0 && (r.status === "Approved" || r.status === "Partially Approved")) {
          approversList.push({
            name: r.approvalDetails?.approvedBy || r.finalizedBy || "Super Admin",
            role: "Authorized Management Signee",
            date: r.approvalDetails?.approvalDate ? new Date(r.approvalDetails.approvalDate).toLocaleString("en-IN") : "N/A",
            status: r.status
          });
        }
      }

      if (approversList.length === 0) {
        return y;
      }

      const boxHeight = 11 + (approversList.length * 15);
      const startY = checkPageBreak(d, y, boxHeight + 10, docTitle, docSub);

      // Outer Standalone Box
      d.setFillColor(248, 250, 252); // slate-50
      d.setDrawColor(15, 23, 42); // slate-900 / dark professional border
      d.setLineWidth(0.65);
      d.rect(15, startY, 180, boxHeight, "FD");

      // Left blue highlight stripe
      d.setFillColor(37, 99, 235);
      d.rect(15, startY, 4, boxHeight, "F");

      // Header label
      d.setTextColor(15, 23, 42);
      d.setFont("Helvetica", "bold");
      d.setFontSize(9.5);
      d.text("OFFICIAL REGISTERED APPROVAL VERIFICATION DETAILS", 24, startY + 6.5);

      let itemY = startY + 15;
      approversList.forEach((app, idx) => {
        if (idx > 0) {
          d.setDrawColor(226, 232, 240);
          d.setLineWidth(0.3);
          d.line(24, itemY - 6.5, 190, itemY - 6.5);
        }

        let markerColor = [100, 116, 139];
        if (app.status === "Approved" || app.status === "Partially Approved") markerColor = [22, 163, 74];
        else if (app.status === "Rejected") markerColor = [220, 38, 38];
        else if (app.status === "Queried") markerColor = [217, 119, 6];

        d.setFillColor(markerColor[0], markerColor[1], markerColor[2]);
        d.circle(26, itemY - 1, 1.5, "F");

        // Filer Info with larger size
        d.setTextColor(15, 23, 42);
        d.setFont("Helvetica", "bold");
        d.setFontSize(9.5);
        d.text(app.name, 32, itemY);

        d.setFont("Helvetica", "normal");
        d.setFontSize(8);
        d.setTextColor(71, 85, 105);
        d.text(`Designation: ${app.role}`, 32, itemY + 4);

        // Status right align
        d.setFont("Helvetica", "bold");
        d.setTextColor(markerColor[0], markerColor[1], markerColor[2]);
        d.setFontSize(9);
        d.text(app.status.toUpperCase(), 190, itemY, { align: "right" });

        d.setFont("Helvetica", "normal");
        d.setFontSize(8);
        d.setTextColor(100, 116, 139);
        d.text(`Timestamp: ${app.date}`, 190, itemY + 4, { align: "right" });

        itemY += 15;
      });

      return startY + boxHeight + 6;
    };

    // Post-Process layout for borders and footers
    const applyPageBordersAndFooter = (d: typeof doc) => {
      const totalPages = d.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        d.setPage(i);
        
        // Consistent page margins borders / frames
        d.setDrawColor(241, 245, 249);
        d.setLineWidth(0.5);
        d.rect(10, 10, 190, 277);

        // Footer standard notes
        d.setDrawColor(226, 232, 240);
        d.setLineWidth(0.4);
        d.line(15, 281, 195, 281);

        d.setFont("Helvetica", "normal");
        d.setFontSize(7);
        d.setTextColor(148, 163, 184);
        d.text(`Audit Trail Proof ID: ${r.id.substring(0, 12).toUpperCase()} • Verified Dynamic Document`, 15, 285);
        
        // Right side: Page numbering
        d.setFont("Helvetica", "normal");
        d.setFontSize(7.5);
        d.text(`Page ${i} of ${totalPages}`, 195, 285, { align: "right" });
      }
    };

    if (r.category === "Credit Card Expense" || r.category === "Credit Card Expenses" || r.creditCardDetails) {
      const getRowData = (row: any) => {
        return {
          day: row.day || "",
          date: row.date || "",
          from: row.from || row.fromCity || "-",
          to: row.to || row.toCity || "-",
          lodgingCost: Number(row.lodgingCost || 0),
          foodCost: Number(row.foodCost || 0),
          conveyanceCost: Number(row.conveyanceCost || row.expenseAmount || 0),
          total: Number(row.rowTotal || (Number(row.lodgingCost || 0) + Number(row.foodCost || 0) + Number(row.expenseAmount || row.conveyanceCost || 0)))
        };
      };

      const drawLine = (d: typeof doc, y: number, color = 220) => {
        d.setDrawColor(color, color, color);
        d.setLineWidth(0.4);
        d.line(15, y, 195, y);
      };

      const drawHeaderBanner = (d: typeof doc, y: number, mainTitle: string, subTitle: string) => {
        d.setFillColor(49, 46, 129); // slate/indigo bg
        d.rect(15, y, 180, 22, "F");

        d.setTextColor(255, 255, 255);
        d.setFont("Helvetica", "bold");
        d.setFontSize(12);
        d.text(mainTitle, 21, y + 9);
        
        d.setFont("Helvetica", "normal");
        d.setFontSize(7.5);
        d.text(subTitle, 21, y + 15);
      };

      // PAGE 1: CREDIT CARD EXPENSE
      let curY = 15;
      drawApprovalHeader(doc, curY, "Credit Card Statement", "Official Credit Card Expense (CCE) Voucher & Filing Certification");

      curY += 28;

      // Report Code
      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(11);
      const docCode = r.documentNumber || r.creditCardDetails?.voucherNo || `CCE-${r.id.substring(0, 6).toUpperCase()}`;
      doc.text(`VOUCHER NO: ${docCode}`, 15, curY);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8.5);
      doc.text(`Type: Credit Card Transaction | Series Tag: CCE`, 15, curY + 4.5);

      const expDateStr = r.creditCardDetails?.expenseDate || new Date(r.createdAt || r.lastUpdated).toLocaleDateString("en-GB");
      doc.text(`Transaction Date: ${expDateStr}`, 210 - 15, curY, { align: "right" });
      doc.text(`Filing Date: ${new Date(r.submissionDate || r.createdAt || r.lastUpdated).toLocaleDateString("en-GB")}`, 210 - 15, curY + 4.5, { align: "right" });

      curY += 9;
      drawLine(doc, curY);
      curY += 8;

      // Profile grid
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9.5);
      doc.text("FILER & PROJECT MANAGEMENT PROFILE", 15, curY);
      curY += 5;

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);

      // Row 1
      doc.setFont("Helvetica", "bold"); doc.text("Employee Name:", 15, curY);
      doc.setFont("Helvetica", "normal"); doc.text(r.employeeName || "N/A", 45, curY);
      doc.setFont("Helvetica", "bold"); doc.text("Project Title:", 105, curY);
      doc.setFont("Helvetica", "normal"); doc.text(r.projectName || "N/A", 135, curY);
      curY += 6;

      // Row 2
      doc.setFont("Helvetica", "bold"); doc.text("Employee Code:", 15, curY);
      doc.setFont("Helvetica", "normal"); doc.text(r.employeeCode || "N/A", 45, curY);
      doc.setFont("Helvetica", "bold"); doc.text("Mission Location:", 105, curY);
      doc.setFont("Helvetica", "normal"); doc.text(r.assignedLocation || "N/A", 135, curY);
      curY += 6;

      // Row 3
      doc.setFont("Helvetica", "bold"); doc.text("Department/Unit:", 15, curY);
      doc.setFont("Helvetica", "normal"); doc.text(r.department || "N/A", 45, curY);
      doc.setFont("Helvetica", "bold"); doc.text("Mission Purpose:", 105, curY);
      doc.setFont("Helvetica", "normal"); 
      const wrappedPurpose = doc.splitTextToSize(r.purpose || "N/A", 55);
      doc.text(wrappedPurpose, 135, curY);

      curY += Math.max(wrappedPurpose.length * 4, 8);
      drawLine(doc, curY);
      curY += 8;

      // Card Information & Charge Details Block
      doc.setTextColor(15, 23, 42);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9.5);
      doc.text("CORPORATE CREDIT CARD CHARGE INFO", 15, curY);
      curY += 5;

      const txs = r.creditCardDetails?.transactions || [];
      if (txs.length > 0) {
        doc.setFillColor(15, 23, 42);
        doc.rect(15, curY, 180, 7, "F");

        doc.setFont("Helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(255, 255, 255);
        doc.text("Card / Cardholder", 18, curY + 4.8);
        doc.text("Description / Particulars", 68, curY + 4.8);
        doc.text("Amount (INR)", 192, curY + 4.8, { align: "right" });

        curY += 7;
        doc.setFont("Helvetica", "normal");
        doc.setTextColor(60, 60, 60);

        txs.forEach((tx: any, idx: number) => {
          if (idx % 2 === 1) {
            doc.setFillColor(248, 250, 252);
            doc.rect(15, curY, 180, 8.5, "F");
          }
          doc.setDrawColor(226, 232, 240);
          doc.rect(15, curY, 180, 8.5);

          doc.setFont("Helvetica", "bold");
          doc.setFontSize(7.5);
          doc.setTextColor(15, 23, 42);
          doc.text(`${tx.cardName || "Card"} (${tx.cardholderName || "N/A"})`, 18, curY + 5.5);

          doc.setFont("Helvetica", "normal");
          doc.setFontSize(7.5);
          const wrappedTxDesc = tx.description || "No description logged.";
          doc.text(wrappedTxDesc.substring(0, 65), 68, curY + 5.5);

          doc.setFont("Helvetica", "bold");
          doc.text(`Rs. ${Number(tx.amount || 0).toLocaleString("en-IN")}.00`, 192, curY + 5.5, { align: "right" });

          curY += 8.5;
        });

        // Add a Total Summary Row
        doc.setFillColor(239, 246, 255);
        doc.rect(15, curY, 180, 9, "F");
        doc.setDrawColor(191, 219, 254);
        doc.rect(15, curY, 180, 9);

        doc.setFont("Helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(30, 58, 138);
        doc.text("CONSOLIDATED TOTAL CCE CHARGES:", 18, curY + 6);

        const totalCCE = Number(r.creditCardDetails?.amount || 0);
        doc.text(`INR ${totalCCE.toLocaleString("en-IN")}.00`, 192, curY + 6, { align: "right" });

        curY += 16;
      } else {
        doc.setFillColor(248, 250, 252); // slate-50
        doc.rect(15, curY, 180, 38, "F");
        doc.setDrawColor(226, 232, 240);
        doc.rect(15, curY, 180, 38);

        let cardY = curY + 6;
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(71, 85, 105);

        // Card details parameters
        doc.text("Registered Cardholder:", 20, cardY);
        doc.setFont("Helvetica", "normal"); doc.setTextColor(15, 23, 42);
        doc.text(r.creditCardDetails?.cardholderName || "N/A", 58, cardY);

        doc.setFont("Helvetica", "bold"); doc.setTextColor(71, 85, 105);
        doc.text("Card / Bank Brand:", 108, cardY);
        doc.setFont("Helvetica", "normal"); doc.setTextColor(15, 23, 42);
        doc.text(r.creditCardDetails?.creditCardName || r.creditCardDetails?.cardName || "N/A", 143, cardY);

        cardY += 6;

        doc.setFont("Helvetica", "bold"); doc.setTextColor(71, 85, 105);
        doc.text("Expense Head/Type:", 20, cardY);
        doc.setFont("Helvetica", "normal"); doc.setTextColor(15, 23, 42);
        doc.text(r.creditCardDetails?.expenseHead || "General Spending", 58, cardY);

        doc.setFont("Helvetica", "bold"); doc.setTextColor(71, 85, 105);
        doc.text("Charge Settlement:", 108, cardY);
        doc.setFont("Helvetica", "normal"); doc.setTextColor(15, 23, 42);
        doc.text(r.creditCardDetails?.expenseType === "OTA" ? "Linked to Outstation Travel" : "General Administration", 143, cardY);

        cardY += 8;
        doc.setFillColor(239, 246, 255); // blue-50
        doc.rect(20, cardY, 170, 14, "F");
        doc.setDrawColor(191, 219, 254);
        doc.rect(20, cardY, 170, 14);

        doc.setFont("Helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(30, 58, 138);
        doc.text(`TOTAL CHARGE AMOUNT: INR ${Number(r.creditCardDetails?.amount || 0).toLocaleString("en-IN")}.00`, 24, cardY + 9);

        curY += 45;
      }
      drawLine(doc, curY);
      curY += 7;

      curY = drawAmountSummaryTable(doc, curY, "Credit Card Expenses", "Filing details");
      curY = drawApprovalSummaryBox(doc, curY, "Credit Card Expenses", "Filing details");

      // Digital signoffs
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text("TRANSACTION WORKFLOW AUDIT HISTORIC SIGNATURES", 15, curY);
      curY += 6;

      const getSignColor = (status: string) => {
        if (status === "Approved") return [4, 120, 87];
        if (status === "Rejected") return [220, 38, 38];
        return [100, 116, 139];
      };

      // Filer row
      doc.setFont("Helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(15, 23, 42);
      doc.text("FILER / CREATOR:", 15, curY);
      doc.setFont("Helvetica", "normal"); doc.setTextColor(71, 85, 105);
      doc.text(`${r.employeeName || "Staff Filer"} (Registered Profile)`, 65, curY);
      doc.text("Filing Signature Verified Digitally", 145, curY);
      curY += 5;

      // Head Row
      doc.setFont("Helvetica", "bold"); doc.setTextColor(15, 23, 42);
      doc.text("DEPARTMENT HEAD APPROVAL:", 15, curY);
      doc.setFont("Helvetica", "normal"); doc.setTextColor(71, 85, 105);
      const headNameStr = r.assignedHeadName || "Dept Head Not Assigned";
      doc.text(`${headNameStr}`, 65, curY);
      const headCol = getSignColor(r.headApprovalStatus || "Pending");
      doc.setFont("Helvetica", "bold"); doc.setTextColor(headCol[0], headCol[1], headCol[2]);
      doc.text(`STATUS: ${r.headApprovalStatus || "Awaiting Verification"}`, 145, curY);
      curY += 5;

      // Admin Row
      doc.setFont("Helvetica", "bold"); doc.setTextColor(15, 23, 42);
      doc.text("COMPANY ADMIN APPROVAL:", 15, curY);
      doc.setFont("Helvetica", "normal"); doc.setTextColor(71, 85, 105);
      const adminNameStr = r.assignedAdminName || "Admin Not Assigned";
      doc.text(`${adminNameStr}`, 65, curY);
      const adminCol = getSignColor(r.adminApprovalStatus || "Pending");
      doc.setFont("Helvetica", "bold"); doc.setTextColor(adminCol[0], adminCol[1], adminCol[2]);
      doc.text(`STATUS: ${r.adminApprovalStatus || "Awaiting Verification"}`, 145, curY);
      curY += 5;

      // Super Admin Row
      doc.setFont("Helvetica", "bold"); doc.setTextColor(15, 23, 42);
      doc.text("SUPER ADMIN CONTROLLER:", 15, curY);
      doc.setFont("Helvetica", "normal"); doc.setTextColor(71, 85, 105);
      const superAdminNameStr = r.assignedSuperAdminName || "Super Admin Not Assigned";
      doc.text(`${superAdminNameStr}`, 65, curY);
      const superCol = getSignColor(r.superAdminApprovalStatus || "Pending");
      doc.setFont("Helvetica", "bold"); doc.setTextColor(superCol[0], superCol[1], superCol[2]);
      doc.text(`STATUS: ${r.superAdminApprovalStatus || "Awaiting Final Settlement"}`, 145, curY);

      // Footnote
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text("Official electronic compliance transaction statement. Page 1 of 3", 15, 285);

      // PAGE 2: LINKED OTA
      doc.addPage();
      curY = 15;
      
      const otaNo = r.creditCardDetails?.linkedOtaNo || "";
      const linkedOtaReq = requestsList.find((x: any) => {
        if (!otaNo) return false;
        return (
          (x.documentNumber && x.documentNumber.toUpperCase() === otaNo.toUpperCase()) ||
          x.id === otaNo
        );
      });

      drawApprovalHeader(doc, curY, "Linked OTA Record", "Integrated Corporate Audit Trails & Dynamic Itinerary Days Details");
      curY += 28;

      if (!linkedOtaReq) {
        doc.setTextColor(15, 23, 42);
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(11);
        doc.text("OUTSTATION TRAVEL SPECIFICATION STATEMENT", 15, curY);
        curY += 8;

        doc.setFillColor(254, 243, 199);
        doc.rect(15, curY, 180, 24, "F");
        doc.setDrawColor(251, 191, 36);
        doc.rect(15, curY, 180, 24);

        doc.setTextColor(146, 64, 14);
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(8.5);
        doc.text("CORRESPONDING TRAVEL REFERENCE RECORD NOT LOCATED IN PLATFORM DATABASE", 20, curY + 7);
        
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(120, 53, 4);
        const refMessage = otaNo 
          ? `This credit card receipt references document code [${otaNo}] which was manually keyed or belongs to external sources.`
          : "This expenditure was filed as general administrative spending and carries no associated outstation travel proposal.";
        doc.text(refMessage, 20, curY + 13);
        doc.text("Consolidated sum statement compiled on Page 3 summarizes overall transaction charges.", 20, curY + 18);

        curY += 34;

        doc.setFillColor(248, 250, 252);
        doc.rect(15, curY, 180, 100, "F");
        doc.setDrawColor(226, 232, 240);
        doc.rect(15, curY, 180, 100);

        doc.setTextColor(148, 163, 184);
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(11);
        doc.text("AUDIT NOTICE: MANUAL TICKET / BILL ATTACHMENT ONLY", 105, curY + 45, { align: "center" });
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(8.5);
        doc.text(`Linked Outstation Travel Sequence ID: ${otaNo || "None Referenced (General)"}`, 105, curY + 52, { align: "center" });
        doc.text("Consolidated audit totals computed on Page 3 will reflect this amount.", 105, curY + 58, { align: "center" });

      } else {
        doc.setTextColor(15, 23, 42);
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(11);
        doc.text(`LINKED AUDIT DOCUMENT SERIAL NO: ${linkedOtaReq.documentNumber || "OTA-SYSTEM"}`, 15, curY);

        doc.setFont("Helvetica", "normal");
        doc.setFontSize(8.5);
        doc.text(`Original Event / Category: ${linkedOtaReq.category || "Outstation Travel Allowance"}`, 15, curY + 4.5);
        
        const otaSubDate = linkedOtaReq.submissionDate ? new Date(linkedOtaReq.submissionDate).toLocaleDateString("en-GB") : "N/A";
        doc.text(`Travel Proposal Submitted: ${otaSubDate}`, 210 - 15, curY, { align: "right" });
        doc.text(`Workflow Project ID: ${linkedOtaReq.id.substring(0, 8).toUpperCase()}`, 210 - 15, curY + 4.5, { align: "right" });

        curY += 9;
        drawLine(doc, curY);
        curY += 8;

        doc.setFont("Helvetica", "bold");
        doc.setFontSize(9.5);
        doc.setTextColor(15, 23, 42);
        doc.text("TRAVEL RESERVATION & TRANSIT CONFIGURATIONS", 15, curY);
        curY += 5;

        doc.setFillColor(240, 253, 250);
        doc.rect(15, curY, 180, 36, "F");
        doc.setDrawColor(186, 230, 218);
        doc.rect(15, curY, 180, 36);

        doc.setFont("Helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(13, 148, 136);

        doc.text("Voyage Sector Routing:", 20, curY + 7);
        doc.setFont("Helvetica", "normal"); doc.setTextColor(15, 23, 42);
        const fromCity = linkedOtaReq.travelDetails?.travelFrom || "N/A";
        const toCity = linkedOtaReq.travelDetails?.travelTo || "N/A";
        doc.text(`${fromCity} ➔ ${toCity}`, 58, curY + 7);

        doc.setFont("Helvetica", "bold"); doc.setTextColor(13, 148, 136);
        doc.text("Transit Type/Train Name:", 110, curY + 7);
        doc.setFont("Helvetica", "normal"); doc.setTextColor(15, 23, 42);
        doc.text(linkedOtaReq.travelDetails?.trainNoName || "Standard Transport Mode", 148, curY + 7);

        doc.setFont("Helvetica", "bold"); doc.setTextColor(13, 148, 136);
        doc.text("Departure Timestamp:", 20, curY + 13);
        doc.setFont("Helvetica", "normal"); doc.setTextColor(15, 23, 42);
        const depDate = linkedOtaReq.travelDetails?.departureDate ? new Date(linkedOtaReq.travelDetails.departureDate).toLocaleDateString("en-GB") : "N/A";
        doc.text(depDate, 58, curY + 13);

        doc.setFont("Helvetica", "bold"); doc.setTextColor(13, 148, 136);
        doc.text("Arrival Timestamp:", 110, curY + 13);
        doc.setFont("Helvetica", "normal"); doc.setTextColor(15, 23, 42);
        const arrDate = linkedOtaReq.travelDetails?.arrivalDate ? new Date(linkedOtaReq.travelDetails.arrivalDate).toLocaleDateString("en-GB") : "N/A";
        doc.text(arrDate, 148, curY + 13);

        doc.setFont("Helvetica", "bold"); doc.setTextColor(13, 148, 136);
        doc.text("Assigned Mill / Branch:", 20, curY + 19);
        doc.setFont("Helvetica", "normal"); doc.setTextColor(15, 23, 42);
        doc.text(linkedOtaReq.travelDetails?.millNameAddress || "Client Workspace site", 58, curY + 19);

        doc.setFont("Helvetica", "bold"); doc.setTextColor(13, 148, 136);
        doc.text("Assigned Hotel Venue:", 110, curY + 19);
        doc.setFont("Helvetica", "normal"); doc.setTextColor(15, 23, 42);
        doc.text(linkedOtaReq.travelDetails?.hotelName || "Standard Lodging Place", 148, curY + 19);

        doc.setFont("Helvetica", "bold"); doc.setTextColor(13, 148, 136);
        doc.text("Proposal Notes/Purpose:", 20, curY + 25);
        doc.setFont("Helvetica", "normal"); doc.setTextColor(15, 23, 42);
        const pNotes = linkedOtaReq.travelDetails?.notes || linkedOtaReq.purpose || "Business Site visits";
        doc.text(pNotes.substring(0, 36) + (pNotes.length > 36 ? "..." : ""), 58, curY + 25);

        doc.setFont("Helvetica", "bold"); doc.setTextColor(13, 148, 136);
        doc.text("Budget Advance Granted:", 110, curY + 25);
        doc.setFont("Helvetica", "normal"); doc.setTextColor(15, 23, 42);
        const otaAdv = Number(linkedOtaReq.travelDetails?.advanceAmount || 0);
        doc.text(`INR ${otaAdv.toLocaleString()}`, 148, curY + 25);

        curY += 42;

        doc.setFont("Helvetica", "bold");
        doc.setFontSize(9.5);
        doc.setTextColor(15, 23, 42);
        doc.text("VOYAGE ITINERARY DAILY RECORD OF COMMITTED LOGS", 15, curY);
        curY += 5;

        const headers = ["Day/Date", "Routings", "Lodging (Rs.)", "Food (Rs.)", "Transport Type", "Total (Rs.)"];
        const colWidths = [24, 34, 26, 26, 44, 26];

        doc.setFillColor(15, 23, 42);
        doc.rect(15, curY, 180, 8, "F");

        doc.setFont("Helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(255, 255, 255);
        
        let headerX = 15;
        headers.forEach((h, idx) => {
          doc.text(h, headerX + 2, curY + 5.5);
          headerX += colWidths[idx];
        });

        curY += 8;

        const rows = linkedOtaReq.travelDetails?.itinerary || linkedOtaReq.travelEntries || [];
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(60, 60, 60);

        if (!rows || rows.length === 0) {
          doc.rect(15, curY, 180, 10);
          doc.text("No specific days logs detail mapped directly in document payload.", 15 + 6, curY + 6.5);
          curY += 10;
        } else {
          const visibleRows = rows.slice(0, 11);
          visibleRows.forEach((rObj: any, rIdx: number) => {
            const rd = getRowData(rObj);
            const rawConveyance = rObj.conveyanceType || rObj.remarks || "Transit";

            if (rIdx % 2 === 1) {
              doc.setFillColor(248, 250, 252);
              doc.rect(15, curY, 180, 8.5, "F");
            }
            doc.setDrawColor(230, 230, 230);
            doc.rect(15, curY, 180, 8.5);

            let rowX = 15;
            doc.setFont("Helvetica", "bold");
            doc.text(`D${rd.day || rIdx + 1} / ${(rd.date || "").substring(5)}`, rowX + 2, curY + 5.5);
            rowX += colWidths[0];

            doc.setFont("Helvetica", "normal");
            const wrappedSector = `${rd.from} ➔ ${rd.to}`;
            doc.text(wrappedSector.substring(0, 18), rowX + 2, curY + 5.5);
            rowX += colWidths[1];

            doc.text(`Rs. ${rd.lodgingCost.toLocaleString()}`, rowX + 2, curY + 5.5);
            rowX += colWidths[2];

            doc.text(`Rs. ${rd.foodCost.toLocaleString()}`, rowX + 2, curY + 5.5);
            rowX += colWidths[3];

            doc.text(rawConveyance.substring(0, 18), rowX + 2, curY + 5.5);
            rowX += colWidths[4];

            doc.setFont("Helvetica", "bold");
            doc.text(`Rs. ${rd.total.toLocaleString()}`, rowX + 2, curY + 5.5);

            curY += 8.5;
          });
        }
      }

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text("Official electronic compliance transaction statement. Page 2 of 3", 15, 285);

      // PAGE 3: SUMMARY TOTAL
      doc.addPage();
      curY = 15;

      drawHeaderBanner(doc, curY, "INTEGRATED SYSTEM AUDIT & RECONCILIATION SUMMARY", "Consolidated Spending Metrics across Corporate Credit Card & Travel Allowance accounts");
      curY += 30;

      doc.setTextColor(15, 23, 42);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(11);
      doc.text("1. SEPARATE COMPONENT FINANCIAL SUMMARY", 15, curY);
      curY += 6;

      const cceAmount = Number(r.creditCardDetails?.amount || 0);

      let otaLodgingTotal = 0;
      let otaFoodTotal = 0;
      let otaConveyanceTotal = 0;
      let otaGrandTotal = 0;
      let otaAdv = 0;

      if (linkedOtaReq) {
        otaAdv = Number(linkedOtaReq.travelDetails?.advanceAmount || 0);
        const rows = linkedOtaReq.travelDetails?.itinerary || linkedOtaReq.travelEntries || [];
        if (rows && rows.length > 0) {
          rows.forEach((row: any) => {
            const rd = getRowData(row);
            otaLodgingTotal += rd.lodgingCost;
            otaFoodTotal += rd.foodCost;
            otaConveyanceTotal += rd.conveyanceCost;
            otaGrandTotal += rd.total;
          });
        } else {
          otaGrandTotal = Number(linkedOtaReq.totals?.grandTotal || linkedOtaReq.totalBudget || 0);
          otaLodgingTotal = Number(linkedOtaReq.totals?.lodgingTotal || 0);
          otaFoodTotal = Number(linkedOtaReq.totals?.foodTotal || 0);
          otaConveyanceTotal = Number(linkedOtaReq.totals?.travelTotal || 0);
        }
      }

      doc.setFillColor(248, 250, 252);
      doc.rect(15, curY, 86, 68, "F");
      doc.setDrawColor(226, 232, 240);
      doc.rect(15, curY, 86, 68);

      let compY = curY + 6;
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(49, 46, 129);
      doc.text("A. CREDIT CARD FIELD LOG (CCE)", 20, compY);

      compY += 7;
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(`Card Brand: ${r.creditCardDetails?.creditCardName || "N/A"}`, 20, compY);
      compY += 5.5;
      doc.text(`Cardholder: ${r.creditCardDetails?.cardholderName || "N/A"}`, 20, compY);
      compY += 5.5;
      doc.text(`Settlement Head: ${r.creditCardDetails?.expenseHead || "N/A"}`, 20, compY);
      compY += 5.5;
      doc.text(`Reference Voucher: ${r.creditCardDetails?.voucherNo || "N/A"}`, 20, compY);
      compY += 5.5;
      doc.text(`Filing Status: ${r.status}`, 20, compY);

      compY += 10;
      doc.setDrawColor(199, 210, 254);
      doc.line(20, compY - 4, 95, compY - 4);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(49, 46, 129);
      doc.text("CCE STATEMENT TOTAL:", 20, compY);
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(`INR ${cceAmount.toLocaleString()}`, 20, compY + 5.5);

      doc.setFillColor(248, 250, 252);
      doc.rect(109, curY, 86, 68, "F");
      doc.setDrawColor(226, 232, 240);
      doc.rect(109, curY, 86, 68);

      let compY2 = curY + 6;
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(13, 148, 136);
      doc.text("B. OUTSTATION TRAVEL PROPOSAL (OTA)", 114, compY2);

      compY2 += 7;
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(`Document Reference: ${linkedOtaReq?.documentNumber || otaNo || "N/A"}`, 114, compY2);
      compY2 += 5.5;
      doc.text(`Advance Budget Paid: INR ${otaAdv.toLocaleString()}`, 114, compY2);
      compY2 += 5.5;
      doc.text(`Lodging Total Allocation: INR ${otaLodgingTotal.toLocaleString()}`, 114, compY2);
      compY2 += 5.5;
      doc.text(`Meals & Food Total: INR ${otaFoodTotal.toLocaleString()}`, 114, compY2);
      compY2 += 5.5;
      doc.text(`Local Conveyance Total: INR ${otaConveyanceTotal.toLocaleString()}`, 114, compY2);

      compY2 += 10;
      doc.setDrawColor(153, 222, 212);
      doc.line(114, compY2 - 4, 189, compY2 - 4);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(13, 148, 136);
      doc.text("OTA SYSTEM BUDGET TOTAL:", 114, compY2);
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(`INR ${otaGrandTotal.toLocaleString()}`, 114, compY2 + 5.5);

      curY += 76;

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text("2. INTEGRATED ENTERPRISE FINANCIAL SUMMARY RECONCILIATION", 15, curY);
      curY += 6;

      const grandCombinedTotal = cceAmount + otaGrandTotal;

      doc.setFillColor(240, 246, 255);
      doc.rect(15, curY, 180, 52, "F");
      doc.setDrawColor(191, 219, 254);
      doc.rect(15, curY, 180, 52);

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(30, 58, 138);
      doc.text("AUDITED CONSOLIDATED LEDGER REPORT", 21, curY + 8);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);

      let textY = curY + 16;
      doc.text(`- RECONCILED CCE TRANSACTION RECORD AMOUNT : INR ${cceAmount.toLocaleString().padStart(12)}`, 21, textY);
      textY += 6;
      doc.text(`- RECONCILED OTA TRAVEL TRAVELER BILL SETTLE  : INR ${otaGrandTotal.toLocaleString().padStart(12)}`, 21, textY);
      textY += 6;
      
      doc.setDrawColor(147, 197, 253);
      doc.line(21, textY, 189, textY);
      textY += 7;

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(11);
      doc.text("CONSOLIDATED SYSTEM EXPENDITURE TOTAL (A + B):", 21, textY);
      
      doc.setFontSize(14);
      doc.setTextColor(30, 58, 138);
      doc.text(`INR ${grandCombinedTotal.toLocaleString()}.00`, 21, textY + 6.5);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text("* Computed securely via inter-modular ledger tracking under system standards.", 21, textY + 13);

      curY += 62;

      drawLine(doc, curY);
      curY += 8;

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text("SYSTEM AUDIT CERTIFICATION", 15, curY);
      doc.setFont("Helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("[ RECONCILED & LOCKED ]", 15, curY + 6);
      doc.setFont("Helvetica", "normal");
      doc.text(`Auditor Signature Code: SA-${docCode.replace("CCE-", "")}`, 15, curY + 11);
      doc.text(`Certified Stamp: ${new Date().toLocaleDateString("en-GB")}`, 15, curY + 15);

      doc.setFont("Helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text("CHIEF FINANCIAL CONTROLLER", 110, curY);
      doc.setFont("Helvetica", "italic");
      doc.setTextColor(100, 116, 139);
      if (r.status === "Approved") {
        doc.setTextColor(16, 185, 129);
        doc.text("[ CERTIFIED FOR DISBURSAL ]", 110, curY + 6);
      } else {
        doc.text("[ APPROVAL RECORD PENDING ]", 110, curY + 6);
      }
      doc.setFont("Helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      const signeeName = r.superAdminApprovedBy || r.adminApprovedBy || r.assignedSuperAdminName || "Finance Controller";
      doc.text(`Authorized Controller: ${signeeName}`, 110, curY + 11);
      doc.text(`Reconciliation System Seal: VERIFIED-100%`, 110, curY + 15);

      applyPageBordersAndFooter(doc);

      if (asDocOnly) {
        return doc;
      }

      await finalizeAndSavePDF(doc, r, `CCE_Reconciliation_Statement_${r.creditCardDetails?.voucherNo || r.id}.pdf`, undefined, undefined, apiHeaders);
      return;
    }

    if (r.category === "Sample Collection") {
      // ----------------------------------------------------
      // SPECIALIZED PHYSICAL SAMPLE COLLECTION PDF
      // Conditionally shows Page 1 (Cash Voucher) only when created and NOT asDocOnly.
      // Shows Page 2 (Sample Collection Travelling Bill Sheet) always.
      // ----------------------------------------------------
      
      const getFirstApprovalNameLocal = (form: RequestForm) => {
        if (form.headApprovalStatus === "Approved" && form.assignedHeadName) {
          return form.assignedHeadName;
        }
        if (form.adminApprovalStatus === "Approved" && form.assignedAdminName) {
          return form.assignedAdminName;
        }
        if (form.superAdminApprovalStatus === "Approved" && form.assignedSuperAdminName) {
          return form.assignedSuperAdminName;
        }
        if (form.approvalDetails?.headApprovedBy) return form.approvalDetails.headApprovedBy;
        if (form.approvalDetails?.adminApprovedBy) return form.approvalDetails.adminApprovedBy;
        if (form.approvalDetails?.superAdminApprovedBy) return form.approvalDetails.superAdminApprovedBy;
        return "Awaiting Approval";
      };

      const firstApprovedName = getFirstApprovalNameLocal(r);
      const creatorNameVal = r.localConveyanceDetails?.createdByName || r.employeeName || "Creator";
      
      // Determine if a linked Cash Voucher was created
      const linkedCV = requestsList.find(
        (x: any) => x.category === "Cash Voucher" && x.linkedDocumentId === r.id
      );
      const hasLinkedCV = !!linkedCV;
      const cvNumber = linkedCV?.documentNumber || "";
      const voucherDocCode = r.documentNumber || r.localConveyanceDetails?.voucherNo || `SC-${r.id.substring(0, 6)}`;

      let curY = 15;

      // RENDER PAGE 1: CASH VOUCHER (Only if created and NOT being generated as a sub-document of a Cash Voucher)
      if (hasLinkedCV && !asDocOnly) {
        drawCashVoucherHeader(doc, curY, "Official Sample Collection Cash Voucher");
        
        curY += 12;
        
        // Outer border mockup card
        doc.setFillColor(253, 252, 251); // cream background
        doc.setDrawColor(217, 119, 6); // amber-300
        doc.setLineWidth(0.4);
        doc.rect(15, curY, 180, 160, "FD");
        
        // Top elegant accent stripe
        doc.setFillColor(180, 83, 9); // amber-700 / gold color
        doc.rect(15, curY, 180, 2.5, "F");
        
        // Voucher No & Enterprise specs
        curY += 10;
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(220, 38, 38); // red bold No.
        doc.text(`No. ${cvNumber}`, 22, curY);
        
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(12.5);
        doc.setTextColor(15, 23, 42);
        doc.text(enterpriseNameVal, 105, curY, { align: "center" });

        doc.setFont("Helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text(`Corporate Segment isolation: ${r.enterpriseCode || "Default"}`, 105, curY + 4, { align: "center" });
        
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139);
        doc.text(`Date: ${r.localConveyanceDetails?.fileNo || "N/A"}`, 188, curY, { align: "right" });

        doc.setFont("Helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.text(`Type: SAMPLE COLLECTION VOUCHER`, 188, curY + 4, { align: "right" });
        
        // Dotted divider line
        curY += 5;
        doc.setLineDashPattern([1.5, 1.5], 0);
        doc.setDrawColor(150, 150, 150);
        doc.line(15, curY, 195, curY);
        doc.setLineDashPattern([], 0); // reset line style
        
        // Centered CASH VOUCHER title
        curY += 8;
        doc.setFont("Courier", "bold");
        doc.setFontSize(13);
        doc.setTextColor(51, 65, 85);
        doc.text("CASH VOUCHER", 105, curY, { align: "center" });
        
        doc.setDrawColor(51, 65, 85);
        doc.setLineWidth(0.3);
        doc.line(82, curY + 1.5, 128, curY + 1.5);
        doc.line(82, curY + 2.3, 128, curY + 2.3);
        
        // Expense Head Row
        curY += 12;
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        doc.text("Expense Head:", 22, curY);
        
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(180, 83, 9); // golden amber-700
        doc.text("Sample Collection", 62, curY);
        
        doc.setDrawColor(226, 232, 240);
        doc.line(62, curY + 1.5, 188, curY + 1.5);
        
        // Particulars / Expenses Description
        curY += 8;
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139);
        doc.text("KIND OF EXPENSE / PARTICULARS:", 22, curY);
        
        curY += 3;
        doc.setFillColor(254, 251, 240); // soft gold tint
        doc.setDrawColor(245, 230, 190);
        doc.rect(22, curY, 166, 32, "FD");
        
        doc.setFont("Helvetica", "oblique");
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        const expenseText = r.localConveyanceDetails?.kindOfExpense || "Being reimbursement claim for sample collection voyages.";
        const lines = doc.splitTextToSize(expenseText, 158);
        doc.text(lines, 26, curY + 6);
        
        curY += 32; // base of particulars box
        
        // Incurred By mr. / ms. Row
        curY += 10;
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        doc.text("Incurred By mr. / ms.:", 22, curY);
        
        doc.setFont("Helvetica", "oblique");
        doc.setFontSize(10.5);
        const incurredValText = `${r.localConveyanceDetails?.incurredBy || "N/A"} (Staff ID: ${r.userId || "N/A"})`;
        doc.text(String(incurredValText), 65, curY);
        
        doc.setDrawColor(226, 232, 240);
        doc.line(65, curY + 1.5, 188, curY + 1.5);
        
        // Amount in figures and words box
        curY += 8;
        // figures rect
        doc.setFillColor(254, 243, 199); // amber-100
        doc.setDrawColor(245, 158, 11); // amber-500
        doc.rect(22, curY, 60, 14, "FD");
        
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(180, 83, 9);
        doc.text("Rs.", 26, curY + 9.5);
        
        doc.setFont("Courier", "bold");
        doc.setFontSize(11.5);
        doc.text(`${(r.localConveyanceDetails?.amount || r.totalBudget || 0).toLocaleString()} /-`, 36, curY + 9.5);
        
        // words
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text("RUPEES IN WORDS", 90, curY + 3.5);
        
        doc.setFont("Helvetica", "oblique");
        doc.setFontSize(9.5);
        doc.setTextColor(15, 23, 42);
        const wordText = r.localConveyanceDetails?.amountInWords || "N/A";
        const wLines = doc.splitTextToSize(wordText, 94);
        doc.text(wLines, 90, curY + 9);
        
        curY += 14;
        
        // ----------------------------------------------------------------------
        // INTEGRATED SIGNATURES SECTION (CHECKED BY, PREPARED BY, RECEIVED PAYMENT)
        // ----------------------------------------------------------------------
        curY += 10;
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105); // slate-600
        
        // Headers
        doc.text("CHECKED BY", 22, curY);
        doc.text("PREPARED BY /", 82, curY);
        doc.text("RECEIVED PAYMENT", 142, curY);
        doc.text("AUTHORISED BY", 82, curY + 4);
        
        // Spaced Dots Pattern Row above the text
        const dotsY = curY + 12;
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(148, 163, 184); // slate-400
        doc.text(".  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .", 22, dotsY);
        doc.text(".  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .", 82, dotsY);
        doc.text(".  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .", 142, dotsY);
        
        // Placeholder / Dynamic Value Row
        const valY = curY + 18;
        doc.setFont("Courier", "normal");
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184); // slate-400
        
        doc.text("Initials / Name", 22, valY);
        doc.text("Initials / Name", 82, valY);
        doc.text("Initials / Signature", 142, valY);
        
        // Solid Underline Row below the text
        const lineY = valY + 1.5;
        doc.setDrawColor(203, 213, 225); // slate-300
        doc.setLineWidth(0.4);
        doc.line(22, lineY, 68, lineY);
        doc.line(82, lineY, 128, lineY);
        doc.line(142, lineY, 188, lineY);

        // Row of actual signatures overlay if approved/signed
        const signatureY = curY + 11.5;
        doc.setFont("Courier", "boldOblique");
        doc.setFontSize(7.5);
        
        // Col 1: Checked By (Department Head Approval)
        if (r.headApprovalStatus === "Approved") {
          doc.setTextColor(4, 120, 87); // Emerald green for signature
          const checkerName = r.headApprovedBy || r.assignedHeadName || "Dept Head";
          const checkerSignText = checkerName.length > 18 ? checkerName.substring(0, 16) + "..." : checkerName;
          doc.text(`Sign: ${checkerSignText}`, 22, signatureY);
          doc.setFont("Helvetica", "normal");
          doc.setFontSize(5.5);
          doc.setTextColor(100, 116, 139);
          doc.text(`On: ${r.headApprovalDate || "N/A"}`, 22, signatureY + 4.0);
        }
        
        // Col 2: Prepared By / Authorised By
        const preparerName = creatorNameVal;
        const preparerSignText = preparerName.length > 18 ? preparerName.substring(0, 16) + "..." : preparerName;
        let authorisedName = "";
        let authorisedDate = "";
        if (r.adminApprovalStatus === "Approved") {
          authorisedName = r.adminApprovedBy || r.assignedAdminName || "Company Admin";
          authorisedDate = r.adminApprovalDate || "";
        } else if (r.superAdminApprovalStatus === "Approved") {
          authorisedName = r.superAdminApprovedBy || r.assignedSuperAdminName || "Super Admin";
          authorisedDate = r.superAdminApprovalDate || "";
        }
        const authSignText = authorisedName.length > 18 ? authorisedName.substring(0, 16) + "..." : authorisedName;
        
        doc.setFont("Courier", "boldOblique");
        doc.setFontSize(7.5);
        doc.setTextColor(30, 41, 59); // dark slate
        doc.text(`Prep: ${preparerSignText}`, 82, signatureY - 2.5);
        
        if (authorisedName) {
          doc.setTextColor(4, 120, 87); // emerald
          doc.text(`Auth: ${authSignText}`, 82, signatureY + 1.5);
          doc.setFont("Helvetica", "normal");
          doc.setFontSize(5.5);
          doc.setTextColor(100, 116, 139);
          doc.text(`On: ${authorisedDate || "N/A"}`, 82, signatureY + 4.0);
        }
        
        // Col 3: Received Payment
        if (r.status === "Approved" || r.status === "Approved & Paid" || r.status === "Paid" || r.stage === "completed" || r.superAdminApprovalStatus === "Approved") {
          doc.setFont("Courier", "boldOblique");
          doc.setFontSize(7.5);
          doc.setTextColor(59, 130, 246); // Blue
          doc.text(`Paid: EFT/Digital`, 142, signatureY);
          doc.setFont("Helvetica", "normal");
          doc.setFontSize(5.5);
          doc.setTextColor(100, 116, 139);
          const payDate = r.superAdminApprovalDate || r.adminApprovalDate || r.headApprovalDate || r.submissionDate || "N/A";
          doc.text(`Auto-Signed (${payDate})`, 142, signatureY + 4.0);
        }

        // Advance page to the next sheet
        doc.addPage();
      }

      // --- RENDER SAMPLE COLLECTION SHEET (Page 2 if CV exists, otherwise Page 1) ---
      curY = 15;

      const refTextShow = hasLinkedCV ? `${voucherDocCode} • Linked CV No: ${cvNumber}` : voucherDocCode;
      drawApprovalHeader(doc, curY, "Sample Collection Entry Sheet", `Reference No: ${refTextShow}`);
      curY += 28;

      // Modern metadata block (replaces overlapping lines)
      doc.setFillColor(248, 250, 252); // slate-50
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.3);
      doc.rect(15, curY, 180, 22, "FD");

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105); // slate-500
      doc.text("SAMPLE COLLECTION DETAILS & METADATA", 20, curY + 6);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("CLAIMANT NAME:", 20, curY + 12);
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(String(r.localConveyanceDetails?.incurredBy || "N/A"), 50, curY + 12);

      doc.setFont("Helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text("STAFF REF ID:", 20, curY + 17);
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(String(r.userId || "N/A"), 50, curY + 17);

      doc.setFont("Helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text("SUBMISSION DATE:", 115, curY + 12);
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(String(r.submissionDate || "N/A"), 150, curY + 12);

      doc.setFont("Helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text("CLAIM STATUS:", 115, curY + 17);
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(217, 119, 6);
      doc.text(String(r.status).toUpperCase(), 150, curY + 17);

      // Advance past metadata box
      curY += 28;

      // Grid header line
      const colX = [15, 25, 45, 75, 140, 165, 180, 195]; 

      doc.setFillColor(241, 245, 249);
      doc.rect(15, curY, 180, 10, "F");
      doc.setLineWidth(0.3);
      doc.setDrawColor(100, 116, 139);
      doc.line(15, curY, 195, curY);
      doc.line(15, curY + 10, 195, curY + 10);
      for (let i = 0; i < colX.length; i++) {
        doc.line(colX[i], curY, colX[i], curY + 10);
      }

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);
      doc.text("Sl. No", 20, curY + 6.5, { align: "center" });
      doc.text("Date", 35, curY + 6.5, { align: "center" });
      doc.text("From Location", 60, curY + 6.5, { align: "center" });
      doc.text("Description of Collection/Sample", 107.5, curY + 6.5, { align: "center" });
      doc.text("Approved By", 152.5, curY + 6.5, { align: "center" });
      doc.text("Signature", 172.5, curY + 6.5, { align: "center" });
      doc.text("Amount (INR)", 187.5, curY + 6.5, { align: "center" });

      curY += 10;
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);

      const rowsData = r.localConveyanceDetails?.rows || [];
      const rowHeight = 9;

      for (let idx = 0; idx < rowsData.length; idx++) {
        const row = rowsData[idx];
        
        // Background alternating color
        if (idx % 2 === 1) {
          doc.setFillColor(248, 250, 252);
          doc.rect(15, curY, 180, rowHeight, "F");
        }

        // Draw cells text with dynamic X-alignment
        doc.setFont("Helvetica", "bold");
        doc.text(String(row.serialNo), 20, curY + 6, { align: "center" });
        
        doc.setFont("Helvetica", "normal");
        doc.text(String(row.date || ""), 35, curY + 6, { align: "center" });
        doc.text(String(row.from || "").substring(0, 18), 47, curY + 6);
        doc.text(String(row.purpose || "").substring(0, 42), 77, curY + 6);

        // Approved by Column - centered
        const appTextLabel = row.approvedBy ? row.approvedBy.substring(0, 12) : (firstApprovedName === "Awaiting Approval" ? "Awaiting Auth" : firstApprovedName.substring(0, 12));
        doc.setFont("Courier", "boldOblique");
        doc.setFontSize(7);
        doc.setTextColor(30, 41, 59);
        doc.text(appTextLabel, 152.5, curY + 6, { align: "center" });
        
        // Signature column - centered - Blank for printing
        doc.text("", 172.5, curY + 6, { align: "center" });

        doc.setFont("Courier", "bold");
        doc.setFontSize(8);
        doc.text(Number(row.amount || 0).toFixed(2), 193, curY + 6, { align: "right" });

        // Cell boundary horizontal borders & vertical lines
        doc.setLineWidth(0.15);
        doc.setDrawColor(203, 213, 225);
        doc.line(15, curY + rowHeight, 195, curY + rowHeight);

        for (let i = 0; i < colX.length; i++) {
          doc.line(colX[i], curY, colX[i], curY + rowHeight);
        }

        curY += rowHeight;
      }

      // Draw horizontal closure & total
      doc.setLineWidth(0.3);
      doc.setDrawColor(100, 116, 139);
      doc.line(15, curY, 195, curY);

      // Total row background
      doc.setFillColor(241, 245, 249);
      doc.rect(15, curY, 180, 9, "F");
      doc.line(15, curY + 9, 195, curY + 9);

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text("TOTAL RECONCILED SAMPLE COLLECTION DISBURSEMENT", 75, curY + 6, { align: "center" });

      doc.setFont("Courier", "bold");
      doc.setFontSize(9);
      doc.setTextColor(180, 83, 9);
      doc.text(Number(r.localConveyanceDetails?.amount || r.totalBudget).toFixed(2), 193, curY + 6, { align: "right" });

      // Draw final vertical lines for total
      for (let i = 0; i < colX.length; i++) {
        if (i === 1 || i === 2 || i === 3) continue;
        doc.line(colX[i], curY, colX[i], curY + 9);
      }

      curY += 15;

      // Render general policy notice
      doc.setFillColor(254, 254, 255);
      doc.setDrawColor(203, 213, 225);
      doc.rect(15, curY, 180, 20, "FD");

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text("REGULATORY ADVISORY & VALIDATION CHECKLIST:", 19, curY + 6);
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7.5);
      doc.text("1. All sample collection voyages listed must correlate with laboratory test requirements or collection assignments.", 19, curY + 11);
      doc.text("2. The total sum of Page 2 is automatically propagated and reconciled with Page 1 and general corporate ledger database accounts.", 19, curY + 15);

      // Release workflow trace comments
      if (r.comments && r.comments.length > 0) {
        doc.addPage();
        curY = 15;
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text("SAMPLE COLLECTION WORKFLOW COMMENTS TRAIL", 15, curY);
        curY += 8;
        doc.line(15, curY, 195, curY);
        curY += 6;

        r.comments.forEach((c) => {
          doc.setFont("Helvetica", "bold");
          doc.setTextColor(100, 116, 139);
          doc.setFontSize(8);
          doc.text(`${c.userName} (${new Date(c.timestamp).toLocaleTimeString()}):`, 19, curY + 4);
          
          doc.setFont("Helvetica", "normal");
          doc.setTextColor(15, 23, 42);
          doc.setFontSize(8.5);
          doc.text(String(c.text), 19, curY + 8);
          curY += 12;
        });
      }

      curY = drawAmountSummaryTable(doc, curY, "Sample Collection Sheet", "Voucher summary");
      curY = drawApprovalSummaryBox(doc, curY, "Sample Collection Sheet", "Voucher summary");

      applyPageBordersAndFooter(doc);

      if (asDocOnly) {
        return doc;
      }

      await finalizeAndSavePDF(doc, r, `Sample_Collection_${voucherDocCode}.pdf`, undefined, undefined, apiHeaders);
      return;
    }

    if (r.localConveyanceDetails) {
      // ----------------------------------------------------
      // SPECIALIZED PHYSICAL LOCAL CONVEYANCE PDF
      // Conditionally shows Page 1 (Cash Voucher) only when created and NOT asDocOnly.
      // Shows Page 2 (Travelling Allowance ledger sheet) always.
      // ----------------------------------------------------
      
      const getFirstApprovalNameLocal = (form: RequestForm) => {
        if (form.headApprovalStatus === "Approved" && form.assignedHeadName) {
          return form.assignedHeadName;
        }
        if (form.adminApprovalStatus === "Approved" && form.assignedAdminName) {
          return form.assignedAdminName;
        }
        if (form.superAdminApprovalStatus === "Approved" && form.assignedSuperAdminName) {
          return form.assignedSuperAdminName;
        }
        if (form.approvalDetails?.headApprovedBy) return form.approvalDetails.headApprovedBy;
        if (form.approvalDetails?.adminApprovedBy) return form.approvalDetails.adminApprovedBy;
        if (form.approvalDetails?.superAdminApprovedBy) return form.approvalDetails.superAdminApprovedBy;
        return "Awaiting Approval";
      };

      const firstApprovedName = getFirstApprovalNameLocal(r);
      const creatorNameVal = r.localConveyanceDetails.createdByName || r.employeeName || "Creator";
      
      // Determine if a linked Cash Voucher was created
      const linkedCV = requestsList.find(
        (x: any) => x.category === "Cash Voucher" && x.linkedDocumentId === r.id
      );
      const hasLinkedCV = !!linkedCV;
      const cvNumber = linkedCV?.documentNumber || "";
      const voucherDocCode = r.documentNumber || r.localConveyanceDetails.voucherNo || `LC-${r.id.substring(0,6)}`;

      let curY = 15;

      // RENDER PAGE 1: CASH VOUCHER (Only if created and NOT asDocOnly)
      if (hasLinkedCV && !asDocOnly) {
        drawCashVoucherHeader(doc, curY, "Official Local Conveyance Cash Voucher");
        
        curY += 12;
        
        // Outer border mockup card
        doc.setFillColor(253, 252, 251); // cream background
        doc.setDrawColor(217, 119, 6); // amber-300
        doc.setLineWidth(0.4);
        doc.rect(15, curY, 180, 160, "FD");
        
        // Top elegant accent stripe
        doc.setFillColor(180, 83, 9); // amber-700 / gold color
        doc.rect(15, curY, 180, 2.5, "F");
        
        // Voucher No & Enterprise specs
        curY += 10;
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(220, 38, 38); // red bold No.
        doc.text(`No. ${cvNumber}`, 22, curY);
        
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(12.5);
        doc.setTextColor(15, 23, 42);
        doc.text(enterpriseNameVal, 105, curY, { align: "center" });

        doc.setFont("Helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text(`Corporate Segment isolation: ${r.enterpriseCode || "Default"}`, 105, curY + 4, { align: "center" });
        
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139);
        doc.text(`Date: ${r.localConveyanceDetails.fileNo || "N/A"}`, 188, curY, { align: "right" });

        doc.setFont("Helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.text(`Type: LOCAL CONVEYANCE VOUCHER`, 188, curY + 4, { align: "right" });
        
        // Dotted divider line
        curY += 5;
        doc.setLineDashPattern([1.5, 1.5], 0);
        doc.setDrawColor(150, 150, 150);
        doc.line(15, curY, 195, curY);
        doc.setLineDashPattern([], 0); // reset line style
        
        // Centered CASH VOUCHER title
        curY += 8;
        doc.setFont("Courier", "bold");
        doc.setFontSize(13);
        doc.setTextColor(51, 65, 85);
        doc.text("CASH VOUCHER", 105, curY, { align: "center" });
        
        doc.setDrawColor(51, 65, 85);
        doc.setLineWidth(0.3);
        doc.line(82, curY + 1.5, 128, curY + 1.5);
        doc.line(82, curY + 2.3, 128, curY + 2.3);
        
        // Expense Head Row
        curY += 12;
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        doc.text("Expense Head:", 22, curY);
        
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(180, 83, 9); // golden amber-700
        doc.text("Local Conveyance", 62, curY);
        
        doc.setDrawColor(226, 232, 240);
        doc.line(62, curY + 1.5, 188, curY + 1.5);
        
        // Particulars / Expenses Description
        curY += 8;
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139);
        doc.text("KIND OF EXPENSE / PARTICULARS:", 22, curY);
        
        curY += 3;
        doc.setFillColor(254, 251, 240); // soft gold tint
        doc.setDrawColor(245, 230, 190);
        doc.rect(22, curY, 166, 32, "FD");
        
        doc.setFont("Helvetica", "oblique");
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        const expenseText = r.localConveyanceDetails.kindOfExpense || "Being reimbursement claim for local conveyance voyages.";
        const lines = doc.splitTextToSize(expenseText, 158);
        doc.text(lines, 26, curY + 6);
        
        curY += 32; // base of particulars box
        
        // Incurred By mr. / ms. Row
        curY += 10;
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        doc.text("Incurred By mr. / ms.:", 22, curY);
        
        doc.setFont("Helvetica", "oblique");
        doc.setFontSize(10.5);
        const incurredValText = `${r.localConveyanceDetails.incurredBy || "N/A"} (Staff ID: ${r.userId || "N/A"})`;
        doc.text(String(incurredValText), 65, curY);
        
        doc.setDrawColor(226, 232, 240);
        doc.line(65, curY + 1.5, 188, curY + 1.5);
        
        // Amount in figures and words box
        curY += 8;
        // figures rect
        doc.setFillColor(254, 243, 199); // amber-100
        doc.setDrawColor(245, 158, 11); // amber-500
        doc.rect(22, curY, 60, 14, "FD");
        
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(180, 83, 9);
        doc.text("Rs.", 26, curY + 9.5);
        
        doc.setFont("Courier", "bold");
        doc.setFontSize(11.5);
        doc.text(`${(r.localConveyanceDetails.amount || r.totalBudget || 0).toLocaleString()} /-`, 36, curY + 9.5);
        
        // words
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text("RUPEES IN WORDS", 90, curY + 3.5);
        
        doc.setFont("Helvetica", "oblique");
        doc.setFontSize(9.5);
        doc.setTextColor(15, 23, 42);
        const wordText = r.localConveyanceDetails.amountInWords || "N/A";
        const wLines = doc.splitTextToSize(wordText, 94);
        doc.text(wLines, 90, curY + 9);
        
        curY += 14;
        
        // ----------------------------------------------------------------------
        // INTEGRATED SIGNATURES SECTION (CHECKED BY, PREPARED BY, RECEIVED PAYMENT)
        // ----------------------------------------------------------------------
        curY += 10;
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105); // slate-600
        
        // Headers
        doc.text("CHECKED BY", 22, curY);
        doc.text("PREPARED BY /", 82, curY);
        doc.text("RECEIVED PAYMENT", 142, curY);
        doc.text("AUTHORISED BY", 82, curY + 4);
        
        // Spaced Dots Pattern Row above the text
        const dotsY = curY + 12;
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(148, 163, 184); // slate-400
        doc.text(".  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .", 22, dotsY);
        doc.text(".  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .", 82, dotsY);
        doc.text(".  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .", 142, dotsY);
        
        // Placeholder / Dynamic Value Row
        const valY = curY + 18;
        doc.setFont("Courier", "normal");
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184); // slate-400
        
        doc.text("Initials / Name", 22, valY);
        doc.text("Initials / Name", 82, valY);
        doc.text("Initials / Signature", 142, valY);
        
        // Solid Underline Row below the text
        const lineY = valY + 1.5;
        doc.setDrawColor(203, 213, 225); // slate-300
        doc.setLineWidth(0.4);
        doc.line(22, lineY, 68, lineY);
        doc.line(82, lineY, 128, lineY);
        doc.line(142, lineY, 188, lineY);

        // Row of actual signatures overlay if approved/signed
        const signatureY = curY + 11.5;
        doc.setFont("Courier", "boldOblique");
        doc.setFontSize(7.5);
        
        // Col 1: Checked By (Department Head Approval)
        if (r.headApprovalStatus === "Approved") {
          doc.setTextColor(4, 120, 87); // Emerald green for signature
          const checkerName = r.headApprovedBy || r.assignedHeadName || "Dept Head";
          const checkerSignText = checkerName.length > 18 ? checkerName.substring(0, 16) + "..." : checkerName;
          doc.text(`Sign: ${checkerSignText}`, 22, signatureY);
          doc.setFont("Helvetica", "normal");
          doc.setFontSize(5.5);
          doc.setTextColor(100, 116, 139);
          doc.text(`On: ${r.headApprovalDate || "N/A"}`, 22, signatureY + 4.0);
        }
        
        // Col 2: Prepared By / Authorised By
        const preparerName = creatorNameVal;
        const preparerSignText = preparerName.length > 18 ? preparerName.substring(0, 16) + "..." : preparerName;
        let authorisedName = "";
        let authorisedDate = "";
        if (r.adminApprovalStatus === "Approved") {
          authorisedName = r.adminApprovedBy || r.assignedAdminName || "Company Admin";
          authorisedDate = r.adminApprovalDate || "";
        } else if (r.superAdminApprovalStatus === "Approved") {
          authorisedName = r.superAdminApprovedBy || r.assignedSuperAdminName || "Super Admin";
          authorisedDate = r.superAdminApprovalDate || "";
        }
        const authSignText = authorisedName.length > 18 ? authorisedName.substring(0, 16) + "..." : authorisedName;
        
        doc.setFont("Courier", "boldOblique");
        doc.setFontSize(7.5);
        doc.setTextColor(30, 41, 59); // dark slate
        doc.text(`Prep: ${preparerSignText}`, 82, signatureY - 2.5);
        
        if (authorisedName) {
          doc.setTextColor(4, 120, 87); // emerald
          doc.text(`Auth: ${authSignText}`, 82, signatureY + 1.5);
          doc.setFont("Helvetica", "normal");
          doc.setFontSize(5.5);
          doc.setTextColor(100, 116, 139);
          doc.text(`On: ${authorisedDate || "N/A"}`, 82, signatureY + 4.0);
        }
        
        // Col 3: Received Payment
        if (r.status === "Approved" || r.status === "Approved & Paid" || r.status === "Paid" || r.stage === "completed" || r.superAdminApprovalStatus === "Approved") {
          doc.setFont("Courier", "boldOblique");
          doc.setFontSize(7.5);
          doc.setTextColor(59, 130, 246); // Blue
          doc.text(`Paid: EFT/Digital`, 142, signatureY);
          doc.setFont("Helvetica", "normal");
          doc.setFontSize(5.5);
          doc.setTextColor(100, 116, 139);
          const payDate = r.superAdminApprovalDate || r.adminApprovalDate || r.headApprovalDate || r.submissionDate || "N/A";
          doc.text(`Auto-Signed (${payDate})`, 142, signatureY + 4.0);
        }

        // Advance page to the next sheet
        doc.addPage();
      }

      // --- RENDER TRAVELLING ALLOWANCE SHEET (Page 2 if CV exists, otherwise Page 1) ---
      curY = 15;

      const refTextShow = hasLinkedCV ? `${voucherDocCode} • Linked CV No: ${cvNumber}` : voucherDocCode;
      drawApprovalHeader(doc, curY, "Traveling Allowance Entry Sheet", `Reference No: ${refTextShow}`);
      curY += 28;

      // Modern metadata block (replaces overlapping lines)
      doc.setFillColor(248, 250, 252); // slate-50
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.3);
      doc.rect(15, curY, 180, 22, "FD");

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105); // slate-500
      doc.text("CLAIM DETAILS & METADATA", 20, curY + 6);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("CLAIMANT NAME:", 20, curY + 12);
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(String(r.localConveyanceDetails.incurredBy || "N/A"), 50, curY + 12);

      doc.setFont("Helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text("STAFF REF ID:", 20, curY + 17);
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(String(r.userId || "N/A"), 50, curY + 17);

      doc.setFont("Helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text("SUBMISSION DATE:", 115, curY + 12);
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(String(r.submissionDate || "N/A"), 150, curY + 12);

      doc.setFont("Helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text("CLAIM STATUS:", 115, curY + 17);
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(217, 119, 6);
      doc.text(String(r.status).toUpperCase(), 150, curY + 17);

      // Advance past metadata box
      curY += 28;

      // Grid header line
      const colX = [15, 25, 45, 75, 105, 140, 165, 180, 195]; 
      // 15-25: Sl, 25-45: Date, 45-75: From, 75-105: To, 105-140: Purpose, 140-165: Approved, 165-180: Signature, 180-195: Amount

      doc.setFillColor(241, 245, 249);
      doc.rect(15, curY, 180, 10, "F");
      doc.setLineWidth(0.3);
      doc.setDrawColor(100, 116, 139);
      doc.line(15, curY, 195, curY);
      doc.line(15, curY + 10, 195, curY + 10);
      for (let i = 0; i < colX.length; i++) {
        doc.line(colX[i], curY, colX[i], curY + 10);
      }

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);
      doc.text("Sl. No", 20, curY + 6.5, { align: "center" });
      doc.text("Date", 35, curY + 6.5, { align: "center" });
      doc.text("From Location", 60, curY + 6.5, { align: "center" });
      doc.text("To Location", 90, curY + 6.5, { align: "center" });
      doc.text("Purpose of Visit", 122.5, curY + 6.5, { align: "center" });
      doc.text("Approved By", 152.5, curY + 6.5, { align: "center" });
      doc.text("Signature", 172.5, curY + 6.5, { align: "center" });
      doc.text("Amount (INR)", 187.5, curY + 6.5, { align: "center" });

      curY += 10;
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);

      const rowsData = r.localConveyanceDetails.rows || [];
      const rowHeight = 9;

      for (let idx = 0; idx < rowsData.length; idx++) {
        const row = rowsData[idx];
        
        // Background alternating color
        if (idx % 2 === 1) {
          doc.setFillColor(248, 250, 252);
          doc.rect(15, curY, 180, rowHeight, "F");
        }

        // Draw cells text with dynamic X-alignment
        doc.setFont("Helvetica", "bold");
        doc.text(String(row.serialNo), 20, curY + 6, { align: "center" });
        
        doc.setFont("Helvetica", "normal");
        doc.text(String(row.date || ""), 35, curY + 6, { align: "center" });
        doc.text(String(row.from || "").substring(0, 18), 47, curY + 6);
        doc.text(String(row.to || "").substring(0, 18), 77, curY + 6);
        doc.text(String(row.purpose || "").substring(0, 22), 107, curY + 6);

        // Approved by Column - centered
        const appTextLabel = row.approvedBy ? row.approvedBy.substring(0, 12) : (firstApprovedName === "Awaiting Approval" ? "Awaiting Auth" : firstApprovedName.substring(0, 12));
        doc.setFont("Courier", "boldOblique");
        doc.setFontSize(7);
        doc.setTextColor(30, 41, 59);
        doc.text(appTextLabel, 152.5, curY + 6, { align: "center" });
        
        // Signature column - centered - Blank for printing
        doc.text("", 172.5, curY + 6, { align: "center" });

        doc.setFont("Courier", "bold");
        doc.setFontSize(8);
        doc.text(Number(row.amount || 0).toFixed(2), 193, curY + 6, { align: "right" });

        // Cell boundary horizontal borders & vertical lines
        doc.setLineWidth(0.15);
        doc.setDrawColor(203, 213, 225);
        doc.line(15, curY + rowHeight, 195, curY + rowHeight);

        for (let i = 0; i < colX.length; i++) {
          doc.line(colX[i], curY, colX[i], curY + rowHeight);
        }

        curY += rowHeight;
      }

      // Draw horizontal closure & total
      doc.setLineWidth(0.3);
      doc.setDrawColor(100, 116, 139);
      doc.line(15, curY, 195, curY);

      // Total row background
      doc.setFillColor(241, 245, 249);
      doc.rect(15, curY, 180, 9, "F");
      doc.line(15, curY + 9, 195, curY + 9);

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text("TOTAL RECONCILED DISBURSEMENT", 60, curY + 6, { align: "center" });

      doc.setFont("Courier", "bold");
      doc.setFontSize(9);
      doc.setTextColor(180, 83, 9);
      doc.text(Number(r.localConveyanceDetails.amount || r.totalBudget).toFixed(2), 193, curY + 6, { align: "right" });

      // Draw final vertical lines for total
      for (let i = 0; i < colX.length; i++) {
        // skip internal split lines except start, total amount boundary and end
        if (i === 1 || i === 2 || i === 3 || i === 4) continue;
        doc.line(colX[i], curY, colX[i], curY + 9);
      }

      curY += 15;

      // Render general policy notice
      doc.setFillColor(254, 254, 255);
      doc.setDrawColor(203, 213, 225);
      doc.rect(15, curY, 180, 20, "FD");

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text("REGULATORY ADVISORY & VALIDATION CHECKLIST:", 19, curY + 6);
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7.5);
      doc.text("1. All local voyages listed must correlate with authorized customer support tickets or mill site inspections.", 19, curY + 11);
      doc.text("2. The total sum of Page 2 is automatically propagated and reconciled with Page 1 and general corporate ledger database accounts.", 19, curY + 15);

      // Release workflow trace comments on supplementary page or space if comments exist
      if (r.comments && r.comments.length > 0) {
        doc.addPage();
        curY = 15;
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text("LOCAL CONVEYANCE WORKFLOW COMMENTS TRAIL", 15, curY);
        curY += 8;
        doc.line(15, curY, 195, curY);
        curY += 6;

        r.comments.forEach((c) => {
          doc.setFont("Helvetica", "bold");
          doc.setTextColor(100, 116, 139);
          doc.setFontSize(8);
          doc.text(`${c.userName} (${new Date(c.timestamp).toLocaleTimeString()}):`, 19, curY + 4);
          
          doc.setFont("Helvetica", "normal");
          doc.setTextColor(15, 23, 42);
          doc.setFontSize(8.5);
          doc.text(String(c.text), 19, curY + 8);
          curY += 12;
        });
      }

      curY = drawAmountSummaryTable(doc, curY, "Traveling Allowance Sheet", "Voucher summary");
      curY = drawApprovalSummaryBox(doc, curY, "Traveling Allowance Sheet", "Voucher summary");

      applyPageBordersAndFooter(doc);

      if (asDocOnly) {
        return doc;
      }

      await finalizeAndSavePDF(doc, r, `Local_Conveyance_${voucherDocCode}.pdf`, undefined, undefined, apiHeaders);
      return;
    }

    if (r.cashVoucherDetails) {
      // ----------------------------------------------------
      // SPECIALIZED PHYSICAL CASH VOUCHER RECID MODEL OUTPUT
      // Matches the precise mockup paper voucher layout in the application UI
      // ----------------------------------------------------
      let curY = 15;
      
      // Page 1 header title
      drawCashVoucherHeader(doc, curY, "Official Cash Voucher Export Ledger");
      
      curY += 12;
      
      // Outer border mockup card definition
      doc.setFillColor(253, 252, 251); // cream color mockup background #fdfcfb
      doc.setDrawColor(217, 119, 6); // amber-300 border color
      doc.setLineWidth(0.4);
      doc.rect(15, curY, 180, 160, "FD");
      
      // Top elegant accent stripe
      doc.setFillColor(5, 150, 105); // emerald-600
      doc.rect(15, curY, 180, 2.5, "F");
      
      // Voucher No & Enterprise specs
      curY += 10;
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(220, 38, 38); // red bold No.
      const cashVoucherDocCode = r.documentNumber || r.cashVoucherDetails.voucherNo || r.id || "N/A";
      doc.text(`No. ${cashVoucherDocCode}`, 22, curY);
      
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(12.5);
      doc.setTextColor(15, 23, 42);
      doc.text(enterpriseNameVal, 105, curY, { align: "center" });

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Enterprise Code: ${r.enterpriseCode || "Default"}`, 105, curY + 4, { align: "center" });
      
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Date: ${r.cashVoucherDetails.fileNo || "N/A"}`, 188, curY, { align: "right" });

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(`Type: CASH VOUCHER`, 188, curY + 4, { align: "right" });
      
      // Dotted divider line
      curY += 5;
      doc.setLineDashPattern([1.5, 1.5], 0);
      doc.setDrawColor(150, 150, 150);
      doc.line(15, curY, 195, curY);
      doc.setLineDashPattern([], 0); // reset line style
      
      // Centered CASH VOUCHER title
      curY += 8;
      doc.setFont("Courier", "bold");
      doc.setFontSize(13);
      doc.setTextColor(51, 65, 85);
      doc.text("CASH VOUCHER", 105, curY, { align: "center" });
      
      doc.setDrawColor(51, 65, 85);
      doc.setLineWidth(0.3);
      doc.line(82, curY + 1.5, 128, curY + 1.5);
      doc.line(82, curY + 2.3, 128, curY + 2.3);
      
      // Expenses Head Row
      curY += 12;
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text("Expenses Head:", 22, curY);
      
      doc.setFont("Helvetica", "oblique");
      doc.setFontSize(11);
      doc.setTextColor(6, 95, 70); // emerald-800
      doc.text(String(r.cashVoucherDetails.debitTo || "N/A"), 62, curY);
      
      doc.setDrawColor(226, 232, 240);
      doc.line(62, curY + 1.5, 188, curY + 1.5);
      
      // Particulars / Expenses Description
      curY += 8;
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text("PARTICULARS / EXPENSES DESCRIPTION:", 22, curY);
      
      curY += 3;
      doc.setFillColor(254, 251, 240); // very soft yellow tint
      doc.setDrawColor(245, 230, 190);
      doc.rect(22, curY, 166, 32, "FD");
      
      doc.setFont("Helvetica", "oblique");
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      const expenseText = r.cashVoucherDetails.expenseDetails || "No custom expense details logged.";
      const lines = doc.splitTextToSize(expenseText, 158);
      doc.text(lines, 26, curY + 6);
      
      curY += 32; // base of particulars box
      
      // Incurred By mr. / ms. Row
      curY += 10;
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text("Incurred By mr. / ms.:", 22, curY);
      
      doc.setFont("Helvetica", "oblique");
      doc.setFontSize(10.5);
      const creatorCodeText = `${r.cashVoucherDetails.incurredBy || r.employeeName || "N/A"} (Staff ID: ${r.userId || "N/A"})`;
      doc.text(String(creatorCodeText), 62, curY);
      
      doc.setDrawColor(226, 232, 240);
      doc.line(62, curY + 1.5, 188, curY + 1.5);
      
      // Amount in figures and words box
      curY += 8;
      // figures rect
      doc.setFillColor(236, 253, 245); // emerald-50
      doc.setDrawColor(167, 243, 208); // emerald-250
      doc.rect(22, curY, 60, 14, "FD");
      
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(4, 120, 87);
      doc.text("Rs.", 26, curY + 9.5);
      
      doc.setFont("Courier", "bold");
      doc.setFontSize(11.5);
      doc.text(`${(r.cashVoucherDetails.billAmount || r.totalBudget || 0).toLocaleString()} /-`, 36, curY + 9.5);
      
      // words
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("RUPEES IN WORDS", 90, curY + 3.5);
      
      doc.setFont("Helvetica", "oblique");
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      const wordText = r.cashVoucherDetails.amountInWords || "N/A";
      const wLines = doc.splitTextToSize(wordText, 94);
      doc.text(wLines, 90, curY + 9);
      
      curY += 14;
      
      // ----------------------------------------------------------------------
      // INTEGRATED SIGNATURES SECTION (CHECKED BY, PREPARED BY, RECEIVED PAYMENT)
      // ----------------------------------------------------------------------
      curY += 10;
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105); // slate-600
      
      // Headers
      doc.text("CHECKED BY", 22, curY);
      doc.text("PREPARED BY /", 82, curY);
      doc.text("RECEIVED PAYMENT", 142, curY);
      doc.text("AUTHORISED BY", 82, curY + 4);
      
      // Spaced Dots Pattern Row above the text
      const dotsY = curY + 12;
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(".  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .", 22, dotsY);
      doc.text(".  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .", 82, dotsY);
      doc.text(".  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .", 142, dotsY);
      
      // Placeholder / Dynamic Value Row
      const valY = curY + 18;
      doc.setFont("Courier", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139); // slate-550
      
      const customChecked = r.cashVoucherDetails?.checkedBy?.trim();
      const customAuthorised = r.cashVoucherDetails?.authorisedBy?.trim();
      const customReceived = r.cashVoucherDetails?.receivedPaymentBy?.trim();
      
      doc.text(customChecked || "Initials / Name", 22, valY);
      doc.text(customAuthorised || "Initials / Name", 82, valY);
      doc.text(customReceived || "Initials / Signature", 142, valY);
      
      // Solid Underline Row below the text
      const lineY = valY + 1.5;
      doc.setDrawColor(203, 213, 225); // slate-300
      doc.setLineWidth(0.4);
      doc.line(22, lineY, 68, lineY);
      doc.line(82, lineY, 128, lineY);
      doc.line(142, lineY, 188, lineY);

      // Row of actual signatures overlay if approved/signed
      const signatureY = curY + 11.5;
      doc.setFont("Courier", "boldOblique");
      doc.setFontSize(7.5);
      
      // Col 1: Checked By (Department Head Approval)
      if (r.headApprovalStatus === "Approved") {
        doc.setTextColor(4, 120, 87); // Emerald green for signature
        const checkerName = r.headApprovedBy || r.assignedHeadName || "Dept Head";
        const checkerSignText = checkerName.length > 18 ? checkerName.substring(0, 16) + "..." : checkerName;
        doc.text(`Sign: ${checkerSignText}`, 22, signatureY);
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(5.5);
        doc.setTextColor(100, 116, 139);
        doc.text(`On: ${r.headApprovalDate || "N/A"}`, 22, signatureY + 4.0);
      }
      
      // Col 2: Prepared By / Authorised By
      const preparerName = r.cashVoucherDetails?.incurredBy || r.employeeName || "Filer";
      const preparerSignText = preparerName.length > 18 ? preparerName.substring(0, 16) + "..." : preparerName;
      let authorisedName = "";
      let authorisedDate = "";
      if (r.adminApprovalStatus === "Approved") {
        authorisedName = r.adminApprovedBy || r.assignedAdminName || "Company Admin";
        authorisedDate = r.adminApprovalDate || "";
      } else if (r.superAdminApprovalStatus === "Approved") {
        authorisedName = r.superAdminApprovedBy || r.assignedSuperAdminName || "Super Admin";
        authorisedDate = r.superAdminApprovalDate || "";
      }
      const authSignText = authorisedName.length > 18 ? authorisedName.substring(0, 16) + "..." : authorisedName;
      
      doc.setFont("Courier", "boldOblique");
      doc.setFontSize(7.5);
      doc.setTextColor(30, 41, 59); // dark slate
      doc.text(`Prep: ${preparerSignText}`, 82, signatureY - 2.5);
      
      if (authorisedName) {
        doc.setTextColor(4, 120, 87); // emerald
        doc.text(`Auth: ${authSignText}`, 82, signatureY + 1.5);
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(5.5);
        doc.setTextColor(100, 116, 139);
        doc.text(`On: ${authorisedDate || "N/A"}`, 82, signatureY + 4.0);
      }
      
      // Col 3: Received Payment
      if (r.status === "Approved" || r.status === "Approved & Paid" || r.status === "Paid" || r.stage === "completed" || r.superAdminApprovalStatus === "Approved") {
        doc.setFont("Courier", "boldOblique");
        doc.setFontSize(7.5);
        doc.setTextColor(59, 130, 246); // Blue color for receipt validation
        doc.text(`Paid: EFT/Digital`, 142, signatureY);
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(5.5);
        doc.setTextColor(100, 116, 139);
        const payDate = r.superAdminApprovalDate || r.adminApprovalDate || r.headApprovalDate || r.submissionDate || "N/A";
        doc.text(`Auto-Signed (${payDate})`, 142, signatureY + 4.0);
      }
      
      // Move past the receipt card border
      curY = 187 + 12;
      
      // Supporting verified invoice section
      doc.setFillColor(241, 245, 249); // slate-100
      doc.rect(15, curY, 180, 8, "F");
      
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      doc.text("VERIFIED PROOF INVOICE", 19, curY + 5.5);
      
      curY += 8;
      
      if (r.cashVoucherDetails.billParticulars) {
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(226, 232, 240);
        doc.rect(15, curY, 180, 24, "FD");
        
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139);
        doc.text("Bill Date:", 20, curY + 6);
        doc.text("Item / Particulars:", 80, curY + 6);
        doc.text("Rate Structure:", 20, curY + 16);
        doc.text("Certified value:", 120, curY + 16);
        
        doc.setFont("Helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text(String(r.cashVoucherDetails.billDate || "N/A"), 20, curY + 11);
        doc.text(String(r.cashVoucherDetails.billParticulars || "N/A"), 80, curY + 11);
        doc.text(String(r.cashVoucherDetails.billRate || "N/A"), 20, curY + 21);
        
        doc.setTextColor(4, 120, 87);
        doc.setFontSize(10);
        doc.text(`INR ${Number(r.cashVoucherDetails.billAmount || r.totalBudget).toLocaleString()}`, 120, curY + 21);
        
        curY += 24;
      } else {
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(226, 232, 240);
        doc.rect(15, curY, 180, 12, "FD");
        
        doc.setFont("Helvetica", "oblique");
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text("No custom Bill transaction metadata logged. Proof based directly on main voucher figures.", 20, curY + 7.5);
        
        curY += 12;
      }
      
      // Page break check for historic sign-offs or comments
      let hasWorkflow = r.headApprovedBy || r.headApprovalStatus || r.adminApprovedBy || r.adminApprovalStatus || r.superAdminApprovedBy || r.superAdminApprovalStatus;
      if (hasWorkflow || (r.comments && r.comments.length > 0)) {
        doc.addPage();
        curY = 15;
        
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(15, 23, 42);
        doc.text("CASH VOUCHER TRANSACTION WORKFLOW AUDIT", 15, curY);
        
        doc.setFontSize(8.5);
        doc.setFont("Helvetica", "normal");
        doc.setTextColor(100, 116, 139);
        doc.text("Historic Authorization Trail and Compliance Reviews", 15, curY + 5);
        
        curY += 12;
        
        doc.setDrawColor(226, 232, 240);
        doc.line(15, curY, 195, curY);
        curY += 8;
        
        // Render reviews
        if (r.headApprovedBy || r.headApprovalStatus) {
          const isApp = r.headApprovalStatus === "Approved" || r.headApprovalStatus === "Partially Approved";
          const isRej = r.headApprovalStatus === "Rejected";
          const isPart = r.headApprovalStatus === "Partially Approved";
          const bgClr = isApp ? (isPart ? [255, 251, 235] : [240, 253, 244]) : isRej ? [254, 242, 242] : [255, 251, 235];
          const txtClr = isApp ? (isPart ? [180, 83, 9] : [4, 120, 87]) : isRej ? [220, 38, 38] : [180, 83, 9];
          
          doc.setFillColor(...bgClr);
          doc.rect(15, curY, 180, 20, "F");
          doc.setFont("Helvetica", "bold");
          doc.setTextColor(...txtClr);
          doc.setFontSize(8.5);
          doc.text(`DEPARTMENT HEAD REVIEW STATE: ${r.headApprovalStatus?.toUpperCase() || "PENDING"}`, 19, curY + 5.5);
          
          doc.setFont("Helvetica", "normal");
          doc.setTextColor(15, 23, 42);
          doc.text(`Approving Person: ${r.headApprovedBy || r.assignedHeadName || "Assigned Dept Head (Pending Review)"}   |   Designation: Department Head`, 19, curY + 10.5);
          
          const headHist = r.approvalHistory?.find(h => h.designation === "Department Head" || h.designation === "Authorized Approver");
          const financeText = headHist 
            ? `Requested: INR ${headHist.requestedAmount.toLocaleString()}   |   Approved: INR ${headHist.approvedAmount.toLocaleString()}   |   Diff: -INR ${headHist.difference.toLocaleString()}`
            : `Requested: INR ${r.totalBudget.toLocaleString()}   |   Approved: INR ${(r.approvedAmount ?? r.totalBudget).toLocaleString()}`;
          
          const remarksText = headHist && headHist.difference > 0
            ? `Reduction Reason: "${headHist.reason || r.headRemarks || "No remarks"}"`
            : `Remarks: "${r.headRemarks || "No remarks"}"`;
            
          doc.text(`${financeText}   |   ${remarksText}`, 19, curY + 15);
          curY += 26;
        }
        
        if (r.adminApprovedBy || r.adminApprovalStatus || r.assignedAdminId) {
          const isApp = r.adminApprovalStatus === "Approved" || r.adminApprovalStatus === "Partially Approved";
          const isRej = r.adminApprovalStatus === "Rejected";
          const isPart = r.adminApprovalStatus === "Partially Approved";
          const isNotReq = r.stage === "completed" && !r.adminApprovalStatus && (r.headApprovalStatus === "Approved" || r.headApprovalStatus === "Partially Approved" || r.finalizedBy);
          const bgClr = isNotReq ? [248, 250, 252] : isApp ? (isPart ? [255, 251, 235] : [240, 253, 244]) : isRej ? [254, 242, 242] : [255, 251, 235];
          const txtClr = isNotReq ? [100, 116, 139] : isApp ? (isPart ? [180, 83, 9] : [4, 120, 87]) : isRej ? [220, 38, 38] : [180, 83, 9];
          
          doc.setFillColor(...bgClr);
          doc.rect(15, curY, 180, 20, "F");
          doc.setFont("Helvetica", "bold");
          doc.setTextColor(...txtClr);
          doc.setFontSize(8.5);
          
          const lbl = isNotReq ? "ADMINISTRATOR REVIEW STATE: NOT REQUIRED (FINALIZED EARLY)" : `ADMINISTRATOR REVIEW STATE: ${r.adminApprovalStatus?.toUpperCase() || (r.stage === "head-approval" ? "AWAITING PRIOR STEP" : "PENDING")}`;
          doc.text(lbl, 19, curY + 5.5);
          
          doc.setFont("Helvetica", "normal");
          doc.setTextColor(15, 23, 42);
          const pName = isNotReq ? "N/A (Finalized early)" : (r.adminApprovedBy || r.assignedAdminName || "Assigned Administrator (Pending Review)");
          doc.text(`Approving Person: ${pName}   |   Designation: Company Administrator`, 19, curY + 10.5);
          
          const adminHist = r.approvalHistory?.find(h => h.designation === "Administrator");
          const financeText = isNotReq ? "N/A" : (adminHist 
            ? `Requested: INR ${adminHist.requestedAmount.toLocaleString()}   |   Approved: INR ${adminHist.approvedAmount.toLocaleString()}   |   Diff: -INR ${adminHist.difference.toLocaleString()}`
            : `Requested: INR ${r.totalBudget.toLocaleString()}   |   Approved: INR ${(r.approvedAmount ?? r.totalBudget).toLocaleString()}`);
            
          const remarksText = isNotReq ? "No further action" : (adminHist && adminHist.difference > 0
            ? `Reduction Reason: "${adminHist.reason || r.adminRemarks || "No remarks"}"`
            : `Remarks: "${r.adminRemarks || "No remarks"}"`);
            
          doc.text(isNotReq ? `Remarks: "No further escalation required"` : `${financeText}   |   ${remarksText}`, 19, curY + 15);
          curY += 26;
        }
        
        if (r.superAdminApprovedBy || r.superAdminApprovalStatus || r.assignedSuperAdminId) {
          const isApp = r.superAdminApprovalStatus === "Approved" || r.superAdminApprovalStatus === "Partially Approved";
          const isRej = r.superAdminApprovalStatus === "Rejected";
          const isPart = r.superAdminApprovalStatus === "Partially Approved";
          const isNotReq = r.stage === "completed" && !r.superAdminApprovalStatus && (r.headApprovalStatus === "Approved" || r.headApprovalStatus === "Partially Approved" || r.adminApprovalStatus === "Approved" || r.adminApprovalStatus === "Partially Approved" || r.finalizedBy);
          const bgClr = isNotReq ? [248, 250, 252] : isApp ? (isPart ? [255, 251, 235] : [240, 253, 244]) : isRej ? [254, 242, 242] : [255, 251, 235];
          const txtClr = isNotReq ? [100, 116, 139] : isApp ? (isPart ? [180, 83, 9] : [4, 120, 87]) : isRej ? [220, 38, 38] : [180, 83, 9];
          
          doc.setFillColor(...bgClr);
          doc.rect(15, curY, 180, 20, "F");
          doc.setFont("Helvetica", "bold");
          doc.setTextColor(...txtClr);
          doc.setFontSize(8.5);
          
          const lbl = isNotReq ? "SUPER ADMINISTRATOR REVIEW STATE: NOT REQUIRED (FINALIZED EARLY)" : `SUPER ADMINISTRATOR REVIEW STATE: ${r.superAdminApprovalStatus?.toUpperCase() || (r.stage === "superadmin-approval" ? "PENDING" : "AWAITING PRIOR STEP")}`;
          doc.text(lbl, 19, curY + 5.5);
          
          doc.setFont("Helvetica", "normal");
          doc.setTextColor(15, 23, 42);
          const pName = isNotReq ? "N/A (Finalized early)" : (r.superAdminApprovedBy || r.assignedSuperAdminName || "Assigned Super Admin (Pending Review)");
          doc.text(`Approving Person: ${pName}   |   Designation: Super Administrator`, 19, curY + 10.5);
          
          const superAdminHist = r.approvalHistory?.find(h => h.designation === "Super Admin");
          const financeText = isNotReq ? "N/A" : (superAdminHist 
            ? `Requested: INR ${superAdminHist.requestedAmount.toLocaleString()}   |   Approved: INR ${superAdminHist.approvedAmount.toLocaleString()}   |   Diff: -INR ${superAdminHist.difference.toLocaleString()}`
            : `Requested: INR ${r.totalBudget.toLocaleString()}   |   Approved: INR ${(r.approvedAmount ?? r.totalBudget).toLocaleString()}`);
            
          const remarksText = isNotReq ? "No further action" : (superAdminHist && superAdminHist.difference > 0
            ? `Reduction Reason: "${superAdminHist.reason || r.superAdminRemarks || "No remarks"}"`
            : `Remarks: "${r.superAdminRemarks || "No remarks"}"`);
            
          doc.text(isNotReq ? `Remarks: "No further escalation required"` : `${financeText}   |   ${remarksText}`, 19, curY + 15);
          curY += 26;
        }

        if (r.comments && r.comments.length > 0) {
          curY += 4;
          doc.setFont("Helvetica", "bold");
          doc.setFontSize(10.5);
          doc.setTextColor(15, 23, 42);
          doc.text(`ORGANIZATIONAL DISCUSSION LOGS (${r.comments.length})`, 15, curY);
          curY += 6;
          
          r.comments.forEach((c) => {
            doc.setFillColor(248, 250, 252);
            doc.rect(15, curY, 180, 10, "F");
            
            doc.setFont("Helvetica", "bold");
            doc.setTextColor(100, 116, 139);
            doc.setFontSize(8);
            doc.text(`${c.userName} (${new Date(c.timestamp).toLocaleTimeString()}):`, 19, curY + 4);
            
            doc.setFont("Helvetica", "normal");
            doc.setTextColor(15, 23, 42);
            doc.setFontSize(8.5);
            doc.text(String(c.text), 19, curY + 8);
            curY += 12;
          });
        }
      }
      
      curY = drawAmountSummaryTable(doc, curY, "Cash Voucher", "Export ledger");
      curY = drawApprovalSummaryBox(doc, curY, "Cash Voucher", "Export ledger");

      applyPageBordersAndFooter(doc);
      
      if (asDocOnly) {
        return doc;
      }

      const extraPdfDocs: any[] = [];
      const extraAttachments: string[] = [];

      if (r.linkedDocumentId) {
        const originalDoc = requestsList.find((x: any) => x.id === r.linkedDocumentId);
        if (originalDoc) {
          try {
            const origDoc = await downloadApprovalPDF(originalDoc, true);
            if (origDoc) {
              extraPdfDocs.push(origDoc);
            }
            if (originalDoc.attachments && originalDoc.attachments.length > 0) {
              extraAttachments.push(...originalDoc.attachments);
            }
          } catch (e) {
            console.error("Failed to generate and merge linked original document:", e);
          }
        }
      }

      await finalizeAndSavePDF(
        doc,
        r,
        `Cash_Voucher_${r.cashVoucherDetails.voucherNo || r.id}.pdf`,
        extraPdfDocs,
        extraAttachments,
        apiHeaders
      );
      return;
    }

    if (r.travelExpensesDetails) {
      // ----------------------------------------------------
      // SPECIALIZED PHYSICAL TRAVEL EXPENSES LEDGER REPORT
      // Matches the precise mockup paper ledger layout in the application UI & user uploaded image
      // ----------------------------------------------------
      let curY = 15;
      
      // Page 1 header title
      drawCashVoucherHeader(doc, curY, "Official Travelling Expenses Export Ledger");
      
      curY += 12;
      
      // Outer border mockup card definition
      doc.setFillColor(252, 253, 253); // cream/white color mockup background #fcfdfd
      doc.setDrawColor(13, 148, 136); // teal-600 border color
      doc.setLineWidth(0.4);
      doc.rect(15, curY, 180, 165, "FD");
      
      // Top elegant accent stripe
      doc.setFillColor(13, 148, 136); // teal-600
      doc.rect(15, curY, 180, 2.5, "F");
      
      // Voucher No & Enterprise specs
      curY += 10;
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(13, 148, 136); // teal bold No.
      const travelExpensesDocCode = r.documentNumber || r.travelExpensesDetails.voucherNo || r.id || "N/A";
      doc.text(`No. ${travelExpensesDocCode}`, 22, curY);
      
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(12.5);
      doc.setTextColor(15, 23, 42);
      doc.text(enterpriseNameVal, 105, curY, { align: "center" });

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Enterprise Code: ${r.enterpriseCode || "Default"}`, 105, curY + 4, { align: "center" });
      
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Date: ${r.travelExpensesDetails.dateDesc || "N/A"}`, 188, curY, { align: "right" });

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(`Type: TRAVEL EXPENSE`, 188, curY + 4, { align: "right" });
      
      // Dotted divider line
      curY += 5;
      doc.setLineDashPattern([1.5, 1.5], 0);
      doc.setDrawColor(150, 150, 150);
      doc.line(15, curY, 195, curY);
      doc.setLineDashPattern([], 0); // reset line style
      
      // Centered TRAVELLING EXPENSES title inside filled box
      curY += 5;
      doc.setFillColor(226, 232, 240); // grey background
      doc.setDrawColor(150, 150, 150);
      doc.rect(22, curY, 166, 9, "FD");

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text("TRAVELLING EXPENSES", 105, curY + 6.5, { align: "center" });
      
      // Name, Date & Details Rows mimicking the UI setup
      curY += 16;
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(51, 65, 85);
      doc.text("NAME :", 22, curY);
      doc.setFont("Helvetica", "oblique");
      doc.setTextColor(13, 148, 136);
      const travNameEmp = `${r.travelExpensesDetails.name || r.employeeName || "N/A"} (Staff ID: ${r.userId || "N/A"})`;
      doc.text(String(travNameEmp), 44, curY);
      doc.setDrawColor(226, 232, 240);
      doc.line(44, curY + 1.2, 188, curY + 1.2);

      curY += 7;
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(51, 65, 85);
      doc.text("DATE :", 22, curY);
      doc.setFont("Helvetica", "oblique");
      doc.setTextColor(13, 148, 136);
      doc.text(String(r.travelExpensesDetails.dateDesc || "N/A"), 44, curY);
      doc.setDrawColor(226, 232, 240);
      doc.line(44, curY + 1.2, 188, curY + 1.2);

      curY += 7;
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(51, 65, 85);
      doc.text("DETAILS :", 22, curY);
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(String(r.travelExpensesDetails.details || "N/A"), 44, curY);
      doc.setDrawColor(226, 232, 240);
      doc.line(44, curY + 1.2, 188, curY + 1.2);

      // Ledger Table Rendering
      curY += 10;
      doc.setDrawColor(100, 116, 139);
      doc.setFillColor(241, 245, 249); // Header slate-100 row
      doc.rect(22, curY, 166, 7, "FD");

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text("SR.NO.", 25, curY + 5);
      doc.text("DATE", 44, curY + 5);
      doc.text("PARTICULAR", 80, curY + 5);
      doc.text("AMOUNT", 170, curY + 5, { align: "right" });

      let tableY = curY + 7;
      const tRows = r.travelExpensesDetails.rows || [];
      tRows.forEach((row, index) => {
        if (tableY > 165) return; // guard grid height
        
        // vertical grid lines
        doc.setDrawColor(150, 150, 150);
        doc.line(22, tableY, 22, tableY + 8);
        doc.line(40, tableY, 40, tableY + 8);
        doc.line(74, tableY, 74, tableY + 8);
        doc.line(154, tableY, 154, tableY + 8);
        doc.line(188, tableY, 188, tableY + 8);
        doc.line(22, tableY + 8, 188, tableY + 8); // bottom line
        
        doc.setFont("Courier", "bold");
        doc.setFontSize(8);
        doc.text(String(row.serialNo), 31, tableY + 5, { align: "center" });

        doc.setFont("Helvetica", "normal");
        doc.text(String(row.date), 43, tableY + 5);
        
        const partLines = doc.splitTextToSize(row.particular, 76);
        doc.text(partLines[0] || "N/A", 76, tableY + 5);

        doc.setFont("Courier", "bold");
        doc.text(Number(row.amount).toFixed(2), 184, tableY + 5, { align: "right" });

        tableY += 8;
      });

      // Total summation row
      doc.setFillColor(241, 245, 249);
      doc.rect(22, tableY, 166, 8, "FD");
      doc.setDrawColor(150, 150, 150);
      doc.line(22, tableY, 22, tableY + 8);
      doc.line(154, tableY, 154, tableY + 8);
      doc.line(188, tableY, 188, tableY + 8);
      doc.line(22, tableY + 8, 188, tableY + 8);

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text("TOTAL", 88, tableY + 5.5, { align: "center" });

      doc.setFont("Courier", "bold");
      doc.text(`INR ${Number(r.travelExpensesDetails.totalAmount || r.totalBudget).toFixed(2)}`, 184, tableY + 5.5, { align: "right" });

      // Signatures row
      curY = 175;
      doc.setDrawColor(226, 232, 240);
      doc.line(22, curY, 188, curY);
      
      curY += 4;
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text("CREATED BY", 22, curY);
      doc.text("DEPT HEAD", 63, curY);
      doc.text("ADMIN", 104, curY);
      doc.text("SUPER ADMIN", 145, curY);
      
      curY += 5.5;
      
      // Column 1: Created By
      doc.setFont("Courier", "boldOblique");
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59); // deep dark blue-grey for signature
      const createdByVal = r.travelExpensesDetails.createdByName || r.travelExpensesDetails.name || r.employeeName || "N/A";
      const createdSignText = createdByVal.length > 18 ? createdByVal.substring(0, 16) + "..." : createdByVal;
      doc.text(`Digital Sign: ${createdSignText}`, 22, curY);
      
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text("Designation: Filer", 22, curY + 3.0);
      doc.text(`Date: ${r.submissionDate || "N/A"}`, 22, curY + 5.5);
      
      // Column 2: Dept Head
      if (r.headApprovalStatus === "Approved") {
        doc.setFont("Courier", "boldOblique");
        doc.setFontSize(8);
        doc.setTextColor(4, 120, 87); // Green for approved signature
        const headVal = r.headApprovedBy || r.assignedHeadName || "Dept Head";
        const headSignText = headVal.length > 18 ? headVal.substring(0, 16) + "..." : headVal;
        doc.text(`Digital Sign: ${headSignText}`, 63, curY);
        
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        doc.text("Designation: Dept Head", 63, curY + 3.0);
        doc.text(`Status: Approved Digitally`, 63, curY + 5.5);
        if (r.headApprovalDate) {
          doc.text(`Date: ${r.headApprovalDate}`, 63, curY + 8.0);
        }
      } else if (r.headApprovalStatus === "Rejected") {
        doc.setFont("Courier", "boldOblique");
        doc.setFontSize(8);
        doc.setTextColor(220, 38, 38); // Red
        const headVal = r.headApprovedBy || r.assignedHeadName || "Dept Head";
        const headSignText = headVal.length > 18 ? headVal.substring(0, 16) + "..." : headVal;
        doc.text(`Rejected: ${headSignText}`, 63, curY);
        
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(6.5);
        doc.setTextColor(220, 38, 38);
        doc.text("Designation: Dept Head", 63, curY + 3.0);
        doc.text(`Status: Rejected`, 63, curY + 5.5);
      } else {
        doc.setFont("Helvetica", "oblique");
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        const headVal = r.assignedHeadName || "Dept Head";
        doc.text(headVal ? `[${headVal}]` : "[Not Assigned]", 63, curY);
        
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(6.5);
        doc.setTextColor(148, 163, 184);
        doc.text("Designation: Dept Head", 63, curY + 3.0);
        doc.text(`Status: ${r.headApprovalStatus || "Awaiting Approval"}`, 63, curY + 5.5);
      }
      
      // Column 3: Admin
      if (r.adminApprovalStatus === "Approved") {
        doc.setFont("Courier", "boldOblique");
        doc.setFontSize(8);
        doc.setTextColor(4, 120, 87); // Green info
        const adminVal = r.adminApprovedBy || r.assignedAdminName || "Company Admin";
        const adminSignText = adminVal.length > 18 ? adminVal.substring(0, 16) + "..." : adminVal;
        doc.text(`Digital Sign: ${adminSignText}`, 104, curY);
        
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        doc.text("Designation: Company Admin", 104, curY + 3.0);
        doc.text(`Status: Approved Digitally`, 104, curY + 5.5);
        if (r.adminApprovalDate) {
          doc.text(`Date: ${r.adminApprovalDate}`, 104, curY + 8.0);
        }
      } else if (r.adminApprovalStatus === "Rejected") {
        doc.setFont("Courier", "boldOblique");
        doc.setFontSize(8);
        doc.setTextColor(220, 38, 38); // Red
        const adminVal = r.adminApprovedBy || r.assignedAdminName || "Company Admin";
        const adminSignText = adminVal.length > 18 ? adminVal.substring(0, 16) + "..." : adminVal;
        doc.text(`Rejected: ${adminSignText}`, 104, curY);
        
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(6.5);
        doc.setTextColor(220, 38, 38);
        doc.text("Designation: Company Admin", 104, curY + 3.0);
        doc.text(`Status: Rejected`, 104, curY + 5.5);
      } else {
        doc.setFont("Helvetica", "oblique");
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        const adminVal = r.assignedAdminName || "Company Admin";
        doc.text(adminVal ? `[${adminVal}]` : "[Not Assigned]", 104, curY);
        
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(6.5);
        doc.setTextColor(148, 163, 184);
        doc.text("Designation: Company Admin", 104, curY + 3.0);
        doc.text(`Status: ${r.adminApprovalStatus || "Awaiting Approval"}`, 104, curY + 5.5);
      }

      // Column 4: Super Admin
      if (r.superAdminApprovalStatus === "Approved") {
        doc.setFont("Courier", "boldOblique");
        doc.setFontSize(8);
        doc.setTextColor(4, 120, 87); // Green for approved signature
        const superAdminVal = r.superAdminApprovedBy || r.assignedSuperAdminName || "Super Admin";
        const superSignText = superAdminVal.length > 18 ? superAdminVal.substring(0, 16) + "..." : superAdminVal;
        doc.text(`Digital Sign: ${superSignText}`, 145, curY);
        
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        doc.text("Designation: Super Admin", 145, curY + 3.0);
        doc.text(`Status: Approved Digitally`, 145, curY + 5.5);
        if (r.superAdminApprovalDate) {
          doc.text(`Date: ${r.superAdminApprovalDate}`, 145, curY + 8.0);
        }
      } else if (r.superAdminApprovalStatus === "Rejected") {
        doc.setFont("Courier", "boldOblique");
        doc.setFontSize(8);
        doc.setTextColor(220, 38, 38); // Red
        const superAdminVal = r.superAdminApprovedBy || r.assignedSuperAdminName || "Super Admin";
        const superSignText = superAdminVal.length > 18 ? superAdminVal.substring(0, 16) + "..." : superAdminVal;
        doc.text(`Rejected: ${superSignText}`, 145, curY);
        
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(6.5);
        doc.setTextColor(220, 38, 38);
        doc.text("Designation: Super Admin", 145, curY + 3.0);
        doc.text(`Status: Rejected`, 145, curY + 5.5);
      } else {
        doc.setFont("Helvetica", "oblique");
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        const superAdminVal = r.assignedSuperAdminName || "Super Admin";
        doc.text(superAdminVal ? `[${superAdminVal}]` : "[Not Assigned]", 145, curY);
        
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(6.5);
        doc.setTextColor(148, 163, 184);
        doc.text("Designation: Super Admin", 145, curY + 3.0);
        doc.text(`Status: ${r.superAdminApprovalStatus || "Awaiting Approval"}`, 145, curY + 5.5);
      }

      curY = drawAmountSummaryTable(doc, curY, "Traveling Expenses Sheet", "Ledger summary");
      curY = drawApprovalSummaryBox(doc, curY, "Traveling Expenses Sheet", "Ledger summary");

      applyPageBordersAndFooter(doc);
      
      if (asDocOnly) {
        return doc;
      }

      await finalizeAndSavePDF(doc, r, `Traveling_Expenses_${r.travelExpensesDetails.voucherNo || r.id}.pdf`, undefined, undefined, apiHeaders);
      return;
    }

    let currentY = 20;

    const checkGeneralPageBreak = (heightNeeded: number) => {
      if (currentY + heightNeeded > 275) {
        doc.addPage();
        currentY = 20;
        return true;
      }
      return false;
    };

    // Document Header
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text("APROFLOW CORPORATE SPEND ARCHIVE", 14, currentY);
    currentY += 7;

    doc.setFontSize(10);
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`Official Compliance Ledger Record • Generated: ${new Date().toLocaleString()}`, 14, currentY);
    currentY += 5;

    // Line separator
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.5);
    doc.line(14, currentY, 196, currentY);
    currentY += 6;

    // 1. Meta Details Box
    doc.setFillColor(248, 250, 252); // slate-50
    doc.rect(14, currentY, 182, 60, "F");

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("TRANSACTION WORKFLOW METADATA", 18, currentY + 7);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105); // slate-600
    
    const displayEnterpriseName = (r.enterpriseName || currentUser?.enterpriseName || "PROFLOW ENTERPRISE").toUpperCase();
    
    doc.text("Enterprise Name:", 18, currentY + 14);
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(displayEnterpriseName, 58, currentY + 14);

    doc.setFont("Helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text("Document Serial No:", 18, currentY + 20);
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(220, 38, 38); // High-visibility red
    doc.text(String(r.documentNumber || r.id || "N/A"), 58, currentY + 20);

    doc.setFont("Helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text("Document Type:", 18, currentY + 26);
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(String(r.category || "General Claim"), 58, currentY + 26);

    doc.setFont("Helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text("Enterprise Code:", 18, currentY + 32);
    doc.setFont("Helvetica", "bold");
    doc.text(String(r.enterpriseCode || currentUser?.enterpriseCode || "Default"), 58, currentY + 32);

    doc.setFont("Helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text("Filer Personnel Staff:", 18, currentY + 38);
    doc.setFont("Helvetica", "bold");
    doc.text(`${r.employeeName || "System Staff"} (ID: ${r.userId || "N/A"})`, 58, currentY + 38);

    doc.setFont("Helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text("Project / Workspace:", 18, currentY + 44);
    doc.setFont("Helvetica", "bold");
    doc.text(String(r.projectName), 58, currentY + 44);

    doc.setFont("Helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text("Reference UUID:", 18, currentY + 50);
    doc.setFont("Helvetica", "bold");
    doc.text(String(r.id), 58, currentY + 50);

    // 2. Status Badge (High Contrast Right Pane)
    const isApproved = r.status === "Approved";
    const isRejected = r.status === "Rejected";
    const isQueried = r.status === "Queried";

    let statusColor = [217, 119, 6]; // amber-600
    let textRGB = [255, 255, 255];
    if (isApproved) statusColor = [5, 150, 105]; // emerald-600
    if (isRejected) statusColor = [220, 38, 38]; // red-600
    if (isQueried) statusColor = [37, 99, 235]; // blue-650

    doc.setFillColor(...statusColor);
    doc.rect(130, currentY + 8, 60, 26, "F");

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...textRGB);
    doc.text("COMPLIANCE STATE", 134, currentY + 14);

    doc.setFontSize(13);
    doc.text(r.status.toUpperCase(), 134, currentY + 22);

    doc.setFontSize(8);
    doc.setFont("Helvetica", "normal");
    doc.text(`Timeline: ${new Date(r.submissionDate).toLocaleDateString()}`, 134, currentY + 28);

    currentY += 68;

    // Travel details optional box
    if (r.travelDetails) {
      checkGeneralPageBreak(38);
      doc.setFillColor(240, 253, 250); // emerald-50 alternate background
      doc.rect(14, currentY, 182, 34, "F");

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(4, 120, 87); // emerald-700
      doc.text("TRAVEL JOURNEY & ACCOMMODATION SPECS", 18, currentY + 6);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42); // slate-900

      // Column 1
      const trainInfo = r.travelDetails.trainNoName ? `Train No/Name: ${r.travelDetails.trainNoName}` : `Departure: ${r.travelDetails.departureDate ? new Date(r.travelDetails.departureDate).toLocaleString() : "N/A"}`;
      const destMill = r.travelDetails.millNameAddress ? `Assign Mill: ${r.travelDetails.millNameAddress.substring(0, 42)}${r.travelDetails.millNameAddress.length > 42 ? "..." : ""}` : `Arrival: ${r.travelDetails.arrivalDate ? new Date(r.travelDetails.arrivalDate).toLocaleString() : "N/A"}`;
      const routeText = r.travelDetails.itinerary && r.travelDetails.itinerary.length > 0 
        ? `Voyage: ${r.travelDetails.itinerary.length} day(s) itinerary logged` 
        : `Voyage Route: ${r.travelDetails.travelFrom || "N/A"} -> ${r.travelDetails.travelTo || "N/A"}`;
      
      doc.text(trainInfo, 18, currentY + 13);
      doc.text(destMill, 18, currentY + 19);
      doc.text(routeText, 18, currentY + 25);

      // Column 2
      const advText = r.travelDetails.advanceAmount !== undefined ? `Adv Taken: INR ${Number(r.travelDetails.advanceAmount).toLocaleString()}` : `Hotel / Lodging: ${r.travelDetails.hotelName || "N/A"}`;
      const settledText = r.travelDetails.balanceReturnedHO !== undefined || r.travelDetails.balancePaidToTraveler !== undefined 
        ? `Settled: Returned INR ${Number(r.travelDetails.balanceReturnedHO || 0).toLocaleString()} / Paid INR ${Number(r.travelDetails.balancePaidToTraveler || 0).toLocaleString()}` 
        : `Hotel Booking details: ${r.travelDetails.hotelDetails || "N/A"}`;
      
      doc.text(advText, 110, currentY + 13);
      doc.text(settledText, 110, currentY + 19);
      
      const remarksText = r.travelDetails.notes ? `Remarks: ${r.travelDetails.notes}` : "";
      const travelNotesTruncated = remarksText.substring(0, 80) + (remarksText.length > 80 ? "..." : "");
      doc.text(travelNotesTruncated, 110, currentY + 25);

      currentY += 39;
    }

    // 3. Line Items Table Header
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("ITEMIZED PURCHASE LOGS", 14, currentY);
    currentY += 5;

    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(14, currentY, 182, 8, "F");

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text("Description & Price Details", 18, currentY + 5.5);
    doc.text("Quantity", 115, currentY + 5.5);
    doc.text("GST Tax (%)", 135, currentY + 5.5);
    doc.text("Line Total (INR)", 160, currentY + 5.5);

    currentY += 8;

    // 4. Line Items Grid
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);

    r.items.forEach((item, idx) => {
      checkGeneralPageBreak(12);
      
      const rowBG = idx % 2 === 0 ? [248, 250, 252] : [255, 255, 255];
      doc.setFillColor(...rowBG);
      doc.rect(14, currentY, 182, 11, "F");

      doc.setFont("Helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(String(item.description), 18, currentY + 5);

      doc.setFont("Helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text(`Unit Base: INR ${item.unitPrice.toLocaleString()}`, 18, currentY + 9);

      doc.setTextColor(15, 23, 42);
      doc.text(String(item.quantity), 116, currentY + 6);
      doc.text(`${item.taxPercent || 0}%`, 136, currentY + 6);

      const computedLinePrice = item.total || (item.quantity * item.unitPrice * (1 + (item.taxPercent || 0) / 100));
      doc.setFont("Helvetica", "bold");
      doc.text(`INR ${computedLinePrice.toLocaleString()}`, 160, currentY + 6);

      currentY += 11;
    });

    // Inclusive total block
    checkGeneralPageBreak(10);
    doc.setFillColor(241, 245, 249); // slate-100
    doc.rect(14, currentY, 182, 9, "F");
    doc.setFont("Helvetica", "bold");
    doc.text("TOTAL AGGREGATE SPEND INCL. TAXES:", 18, currentY + 6);
    doc.setFontSize(10);
    doc.text(`INR ${r.totalBudget.toLocaleString()}`, 160, currentY + 6);
    doc.setFontSize(8);

    currentY += 15;

    // 5. Embedded attachments list summary
    if (r.attachments && r.attachments.length > 0) {
      checkGeneralPageBreak(15 + r.attachments.length * 5);
      doc.setFont("Helvetica", "bold");
      doc.text("ATTACHED BILLS OR ESTIMATIONS", 14, currentY);
      currentY += 5;

      r.attachments.forEach((attach) => {
        const hasPipe = attach.includes('|');
        const name = hasPipe ? attach.split('|')[0] : attach;
        
        doc.setFillColor(240, 253, 244); // light green
        doc.rect(14, currentY, 182, 6, "F");
        doc.setFont("Helvetica", "normal");
        doc.setTextColor(4, 120, 87);
        doc.text(`[FILE] ${name}`, 18, currentY + 4.5);
        currentY += 6.5;
      });
      currentY += 4;
    }

    // 6. Review Panel Logs
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("TRANSACTION WORKFLOW AUDIT HISTORIC SIGN-OFFS", 14, currentY);
    currentY += 5;

    let hasLog = false;

    // A. Department Head Sign-off
    if (r.headApprovedBy || r.headApprovalStatus) {
      hasLog = true;
      checkGeneralPageBreak(25);
      const isApp = r.headApprovalStatus === "Approved" || r.headApprovalStatus === "Partially Approved";
      const isRej = r.headApprovalStatus === "Rejected";
      const isPart = r.headApprovalStatus === "Partially Approved";
      const bgClr = isApp ? (isPart ? [255, 251, 235] : [240, 253, 244]) : isRej ? [254, 242, 242] : [255, 251, 235];
      const txtClr = isApp ? (isPart ? [180, 83, 9] : [4, 120, 87]) : isRej ? [220, 38, 38] : [180, 83, 9];
      
      doc.setFillColor(...bgClr);
      doc.rect(14, currentY, 182, 20, "F");
      
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(...txtClr);
      doc.setFontSize(8);
      doc.text(`DEPARTMENT HEAD REVIEW STATE: ${r.headApprovalStatus?.toUpperCase() || "PENDING"}`, 18, currentY + 5);
      
      doc.setFont("Helvetica", "normal");
      doc.setTextColor(15, 23, 42);
      doc.text(`Approving Person: ${r.headApprovedBy || r.assignedHeadName || "Assigned Dept Head (Pending Review)"}   |   Designation: Department Head`, 18, currentY + 9);
      
      const headHist = r.approvalHistory?.find(h => h.designation === "Department Head" || h.designation === "Authorized Approver");
      const financeText = headHist 
        ? `Requested: INR ${headHist.requestedAmount.toLocaleString()}   |   Approved: INR ${headHist.approvedAmount.toLocaleString()}   |   Diff: -INR ${headHist.difference.toLocaleString()}`
        : `Requested: INR ${r.totalBudget.toLocaleString()}   |   Approved: INR ${(r.approvedAmount ?? r.totalBudget).toLocaleString()}`;
      
      const remarksText = headHist && headHist.difference > 0
        ? `Reduction Reason: "${headHist.reason || r.headRemarks || "No remarks"}"`
        : `Remarks: "${r.headRemarks || "No remarks"}"`;
        
      doc.text(`${financeText}   |   ${remarksText}`, 18, currentY + 13);
      currentY += 24;
    }

    // B. Company Admin Sign-off
    if (r.adminApprovedBy || r.adminApprovalStatus || r.assignedAdminId) {
      hasLog = true;
      checkGeneralPageBreak(25);
      const isApp = r.adminApprovalStatus === "Approved" || r.adminApprovalStatus === "Partially Approved";
      const isRej = r.adminApprovalStatus === "Rejected";
      const isPart = r.adminApprovalStatus === "Partially Approved";
      const isNotReq = r.stage === "completed" && !r.adminApprovalStatus && (r.headApprovalStatus === "Approved" || r.headApprovalStatus === "Partially Approved" || r.finalizedBy);
      const bgClr = isNotReq ? [248, 250, 252] : isApp ? (isPart ? [255, 251, 235] : [240, 253, 244]) : isRej ? [254, 242, 242] : [255, 251, 235];
      const txtClr = isNotReq ? [100, 116, 139] : isApp ? (isPart ? [180, 83, 9] : [4, 120, 87]) : isRej ? [220, 38, 38] : [180, 83, 9];
      
      doc.setFillColor(...bgClr);
      doc.rect(14, currentY, 182, 20, "F");
      
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(...txtClr);
      doc.setFontSize(8);
      
      const lbl = isNotReq ? "ADMINISTRATOR REVIEW STATE: NOT REQUIRED (FINALIZED EARLY)" : `ADMINISTRATOR REVIEW STATE: ${r.adminApprovalStatus?.toUpperCase() || (r.stage === "head-approval" ? "AWAITING PRIOR STEP" : "PENDING")}`;
      doc.text(lbl, 18, currentY + 5);
      
      doc.setFont("Helvetica", "normal");
      doc.setTextColor(15, 23, 42);
      const pName = isNotReq ? "N/A (Finalized early)" : (r.adminApprovedBy || r.assignedAdminName || "Assigned Administrator (Pending Review)");
      doc.text(`Approving Person: ${pName}   |   Designation: Company Administrator`, 18, currentY + 9);
      
      const adminHist = r.approvalHistory?.find(h => h.designation === "Administrator");
      const financeText = isNotReq ? "N/A" : (adminHist 
        ? `Requested: INR ${adminHist.requestedAmount.toLocaleString()}   |   Approved: INR ${adminHist.approvedAmount.toLocaleString()}   |   Diff: -INR ${adminHist.difference.toLocaleString()}`
        : `Requested: INR ${r.totalBudget.toLocaleString()}   |   Approved: INR ${(r.approvedAmount ?? r.totalBudget).toLocaleString()}`);
        
      const remarksText = isNotReq ? "No further action" : (adminHist && adminHist.difference > 0
        ? `Reduction Reason: "${adminHist.reason || r.adminRemarks || "No remarks"}"`
        : `Remarks: "${r.adminRemarks || "No remarks"}"`);
        
      doc.text(isNotReq ? `Remarks: "No further escalation required"` : `${financeText}   |   ${remarksText}`, 18, currentY + 13);
      currentY += 24;
    }

    // C. Super Admin Sign-off
    if (r.superAdminApprovedBy || r.superAdminApprovalStatus || r.assignedSuperAdminId) {
      hasLog = true;
      checkGeneralPageBreak(25);
      const isApp = r.superAdminApprovalStatus === "Approved" || r.superAdminApprovalStatus === "Partially Approved";
      const isRej = r.superAdminApprovalStatus === "Rejected";
      const isPart = r.superAdminApprovalStatus === "Partially Approved";
      const isNotReq = r.stage === "completed" && !r.superAdminApprovalStatus && (r.headApprovalStatus === "Approved" || r.headApprovalStatus === "Partially Approved" || r.adminApprovalStatus === "Approved" || r.adminApprovalStatus === "Partially Approved" || r.finalizedBy);
      const bgClr = isNotReq ? [248, 250, 252] : isApp ? (isPart ? [255, 251, 235] : [240, 253, 244]) : isRej ? [254, 242, 242] : [255, 251, 235];
      const txtClr = isNotReq ? [100, 116, 139] : isApp ? (isPart ? [180, 83, 9] : [4, 120, 87]) : isRej ? [220, 38, 38] : [180, 83, 9];
      
      doc.setFillColor(...bgClr);
      doc.rect(14, currentY, 182, 20, "F");
      
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(...txtClr);
      doc.setFontSize(8);
      
      const lbl = isNotReq ? "SUPER ADMINISTRATOR REVIEW STATE: NOT REQUIRED (FINALIZED EARLY)" : `SUPER ADMINISTRATOR REVIEW STATE: ${r.superAdminApprovalStatus?.toUpperCase() || (r.stage === "superadmin-approval" ? "PENDING" : "AWAITING PRIOR STEP")}`;
      doc.text(lbl, 18, currentY + 5);
      
      doc.setFont("Helvetica", "normal");
      doc.setTextColor(15, 23, 42);
      const pName = isNotReq ? "N/A (Finalized early)" : (r.superAdminApprovedBy || r.assignedSuperAdminName || "Assigned Super Admin (Pending Review)");
      doc.text(`Approving Person: ${pName}   |   Designation: Super Administrator`, 18, currentY + 9);
      
      const superAdminHist = r.approvalHistory?.find(h => h.designation === "Super Admin");
      const financeText = isNotReq ? "N/A" : (superAdminHist 
        ? `Requested: INR ${superAdminHist.requestedAmount.toLocaleString()}   |   Approved: INR ${superAdminHist.approvedAmount.toLocaleString()}   |   Diff: -INR ${superAdminHist.difference.toLocaleString()}`
        : `Requested: INR ${r.totalBudget.toLocaleString()}   |   Approved: INR ${(r.approvedAmount ?? r.totalBudget).toLocaleString()}`);
        
      const remarksText = isNotReq ? "No further action" : (superAdminHist && superAdminHist.difference > 0
        ? `Reduction Reason: "${superAdminHist.reason || r.superAdminRemarks || "No remarks"}"`
        : `Remarks: "${r.superAdminRemarks || "No remarks"}"`);
        
      doc.text(isNotReq ? `Remarks: "No further escalation required"` : `${financeText}   |   ${remarksText}`, 18, currentY + 13);
      currentY += 24;
    }

    if (!hasLog) {
      checkGeneralPageBreak(18);
      doc.setFillColor(255, 251, 235); // light amber
      doc.rect(14, currentY, 182, 10, "F");
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(180, 83, 9);
      doc.setFontSize(8);
      doc.text("No active reviewer actions logged. Form is in Draft state.", 18, currentY + 6);
      currentY += 14;
    }

    // 7. Thread comments (if any)
    if (r.comments && r.comments.length > 0) {
      checkGeneralPageBreak(15 + Math.min(r.comments.length * 12, 100));
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(`TRANSACTION COMMENTS REMARKS DISCUSSION LOGS (${r.comments.length})`, 14, currentY);
      currentY += 5;

      r.comments.forEach((c) => {
        checkGeneralPageBreak(12);
        doc.setFillColor(248, 250, 252);
        doc.rect(14, currentY, 182, 10, "F");
        
        doc.setFont("Helvetica", "bold");
        doc.setTextColor(71, 85, 105);
        doc.text(`${c.userName} (${new Date(c.timestamp).toLocaleTimeString()}):`, 18, currentY + 4);
        
        doc.setFont("Helvetica", "normal");
        doc.setTextColor(15, 23, 42);
        doc.text(String(c.text), 18, currentY + 8);
        currentY += 12;
      });
      currentY += 5;
    }

    // Signatures block
    checkGeneralPageBreak(30);
    currentY += 8;

    doc.setDrawColor(226, 232, 240);
    doc.line(14, currentY, 196, currentY);
    
    currentY += 4;
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text("CREATED BY", 14, currentY);
    doc.text("DEPT HEAD", 57, currentY);
    doc.text("ADMIN", 101, currentY);
    doc.text("SUPER ADMIN", 145, currentY);
    
    currentY += 5.5;
    
    // Column 1: Created By
    doc.setFont("Courier", "boldOblique");
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    const createdByVal = r.employeeName || "N/A";
    const createdSignText = createdByVal.length > 18 ? createdByVal.substring(0, 16) + "..." : createdByVal;
    doc.text(`Digital Sign: ${createdSignText}`, 14, currentY);
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text("Designation: Filer", 14, currentY + 3.0);
    doc.text(`Date: ${r.submissionDate || "N/A"}`, 14, currentY + 5.5);
    
    // Column 2: Dept Head
    if (r.headApprovalStatus === "Approved") {
      doc.setFont("Courier", "boldOblique");
      doc.setFontSize(8);
      doc.setTextColor(4, 120, 87);
      const headVal = r.headApprovedBy || r.assignedHeadName || "Dept Head";
      const headSignText = headVal.length > 18 ? headVal.substring(0, 16) + "..." : headVal;
      doc.text(`Digital Sign: ${headSignText}`, 57, currentY);
      
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text("Designation: Dept Head", 57, currentY + 3.0);
      doc.text(`Status: Approved Digitally`, 57, currentY + 5.5);
      if (r.headApprovalDate) {
        doc.text(`Date: ${r.headApprovalDate}`, 57, currentY + 8.0);
      }
    } else if (r.headApprovalStatus === "Rejected") {
      doc.setFont("Courier", "boldOblique");
      doc.setFontSize(8);
      doc.setTextColor(220, 38, 38);
      const headVal = r.headApprovedBy || r.assignedHeadName || "Dept Head";
      const headSignText = headVal.length > 18 ? headVal.substring(0, 16) + "..." : headVal;
      doc.text(`Rejected: ${headSignText}`, 57, currentY);
      
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(220, 38, 38);
      doc.text("Designation: Dept Head", 57, currentY + 3.0);
      doc.text(`Status: Rejected`, 57, currentY + 5.5);
    } else {
      doc.setFont("Helvetica", "oblique");
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      const headVal = r.assignedHeadName || "Dept Head";
      doc.text(headVal ? `[${headVal}]` : "[Not Assigned]", 57, currentY);
      
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text("Designation: Dept Head", 57, currentY + 3.0);
      doc.text(`Status: ${r.headApprovalStatus || "Awaiting Approval"}`, 57, currentY + 5.5);
    }
    
    // Column 3: Admin
    if (r.adminApprovalStatus === "Approved") {
      doc.setFont("Courier", "boldOblique");
      doc.setFontSize(8);
      doc.setTextColor(4, 120, 87);
      const adminVal = r.adminApprovedBy || r.assignedAdminName || "Company Admin";
      const adminSignText = adminVal.length > 18 ? adminVal.substring(0, 16) + "..." : adminVal;
      doc.text(`Digital Sign: ${adminSignText}`, 101, currentY);
      
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text("Designation: Company Admin", 101, currentY + 3.0);
      doc.text(`Status: Approved Digitally`, 101, currentY + 5.5);
      if (r.adminApprovalDate) {
        doc.text(`Date: ${r.adminApprovalDate}`, 101, currentY + 8.0);
      }
    } else if (r.adminApprovalStatus === "Rejected") {
      doc.setFont("Courier", "boldOblique");
      doc.setFontSize(8);
      doc.setTextColor(220, 38, 38);
      const adminVal = r.adminApprovedBy || r.assignedAdminName || "Company Admin";
      const adminSignText = adminVal.length > 18 ? adminVal.substring(0, 16) + "..." : adminVal;
      doc.text(`Rejected: ${adminSignText}`, 101, currentY);
      
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(220, 38, 38);
      doc.text("Designation: Company Admin", 101, currentY + 3.0);
      doc.text(`Status: Rejected`, 101, currentY + 5.5);
    } else {
      doc.setFont("Helvetica", "oblique");
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      const adminVal = r.assignedAdminName || "Company Admin";
      doc.text(adminVal ? `[${adminVal}]` : "[Not Assigned]", 101, currentY);
      
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text("Designation: Company Admin", 101, currentY + 3.0);
      doc.text(`Status: ${r.adminApprovalStatus || "Awaiting Approval"}`, 101, currentY + 5.5);
    }

    // Column 4: Super Admin
    if (r.superAdminApprovalStatus === "Approved") {
      doc.setFont("Courier", "boldOblique");
      doc.setFontSize(8);
      doc.setTextColor(4, 120, 87);
      const superAdminVal = r.superAdminApprovedBy || r.assignedSuperAdminName || "Super Admin";
      const superSignText = superAdminVal.length > 18 ? superAdminVal.substring(0, 16) + "..." : superAdminVal;
      doc.text(`Digital Sign: ${superSignText}`, 145, currentY);
      
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text("Designation: Super Admin", 145, currentY + 3.0);
      doc.text(`Status: Approved Digitally`, 145, currentY + 5.5);
      if (r.superAdminApprovalDate) {
        doc.text(`Date: ${r.superAdminApprovalDate}`, 145, currentY + 8.0);
      }
    } else if (r.superAdminApprovalStatus === "Rejected") {
      doc.setFont("Courier", "boldOblique");
      doc.setFontSize(8);
      doc.setTextColor(220, 38, 38);
      const superAdminVal = r.superAdminApprovedBy || r.assignedSuperAdminName || "Super Admin";
      const superSignText = superAdminVal.length > 18 ? superAdminVal.substring(0, 16) + "..." : superAdminVal;
      doc.text(`Rejected: ${superSignText}`, 145, currentY);
      
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(220, 38, 38);
      doc.text("Designation: Super Admin", 145, currentY + 3.0);
      doc.text(`Status: Rejected`, 145, currentY + 5.5);
    } else {
      doc.setFont("Helvetica", "oblique");
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      const superAdminVal = r.assignedSuperAdminName || "Super Admin";
      doc.text(superAdminVal ? `[${superAdminVal}]` : "[Not Assigned]", 145, currentY);
      
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text("Designation: Super Admin", 145, currentY + 3.0);
      doc.text(`Status: ${r.superAdminApprovalStatus || "Awaiting Approval"}`, 145, currentY + 5.5);
    }
    
    currentY += 16;

    currentY = drawAmountSummaryTable(doc, currentY, r.category || "General", "Audit trail Ledger");
    currentY = drawApprovalSummaryBox(doc, currentY, r.category || "General", "Audit trail Ledger");

    applyPageBordersAndFooter(doc);

    if (asDocOnly) {
      return doc;
    }

    await finalizeAndSavePDF(doc, r, `Approval_Doc_${r.id}.pdf`, undefined, undefined, apiHeaders);
  };

  // NOTIFICATION ACTIONS
  const markNotifRead = async (id: string) => {
    try {
      const resp = await fetch(`/api/notifications/${id}/read`, {
        method: "POST",
        headers: apiHeaders
      });
      if (resp.ok) {
        fetchNotifications();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // EMPLOYEE LIST MANAGEMENT
  const toggleEmployeeStatus = async (empId: string, currentStatus: string) => {
    const targetStatus = currentStatus === "active" ? "inactive" : "active";
    try {
      const resp = await fetch(`/api/employees/${empId}/status`, {
        method: "POST",
        headers: apiHeaders,
        body: JSON.stringify({ status: targetStatus })
      });
      const data = await resp.json();
      if (!resp.ok) {
        alert(data.error || "Failed to edit account status");
        return;
      }
      fetchEmployees();
      fetchAuditLogs();
      setAppSuccess(`Employee state modified to ${targetStatus}`);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleApprovalAuthority = async (empId: string, currentAuthority: boolean | undefined) => {
    const targetAuthority = !currentAuthority;
    try {
      const resp = await fetch(`/api/employees/${empId}/toggle-approval-authority`, {
        method: "POST",
        headers: apiHeaders,
        body: JSON.stringify({ canApproveRequests: targetAuthority })
      });
      const data = await resp.json();
      if (!resp.ok) {
        alert(data.error || "Failed to edit approval authority");
        return;
      }
      fetchEmployees();
      fetchAuditLogs();
      fetchDepartmentHeads(); // reload so the updated employee list with canApproveRequests refreshes in dropdowns
      setAppSuccess(`Employee approval authority is now ${targetAuthority ? 'Enabled' : 'Disabled'}`);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleCreditCardExpensesViewer = async (empId: string, currentViewerStatus: boolean | undefined) => {
    const targetViewer = !currentViewerStatus;
    try {
      const resp = await fetch(`/api/employees/${empId}/toggle-cc-viewer`, {
        method: "POST",
        headers: apiHeaders,
        body: JSON.stringify({ canViewCreditCardExpenses: targetViewer })
      });
      const data = await resp.json();
      if (!resp.ok) {
        alert(data.error || "Failed to edit credit card expenses view flag");
        return;
      }
      fetchEmployees();
      fetchAuditLogs();
      setAppSuccess(`Employee corporate credit card view authorization is now ${targetViewer ? 'Enabled' : 'Disabled'}`);
    } catch (e) {
      console.error(e);
    }
  };

  // PURCHASE REQUEST CREATOR ROW MODIFIER
  const addItemRow = () => {
    if (!itemDesc.trim()) {
      alert("Specify item record description");
      return;
    }
    const qty = Number(itemQty) || 1;
    const price = Number(itemPrice) || 0;
    const tax = Number(itemTax) || 0;
    const rowNet = qty * price;
    const rowTax = rowNet * (tax / 100);
    const rowTotal = rowNet + rowTax;

    const newItem: RequestItem = {
      id: "item-" + Date.now(),
      description: itemDesc.trim(),
      quantity: qty,
      unitPrice: price,
      taxPercent: tax,
      total: rowTotal
    };

    setRequestItems([...requestItems, newItem]);
    setItemDesc("");
    setItemQty(1);
    setItemPrice(0);
  };

  const removeItemRow = (id: string) => {
    setRequestItems(requestItems.filter(item => item.id !== id));
  };

  const addAttachment = () => {
    if (!newAttachmentName.trim()) return;
    setFormAttachments([...formAttachments, newAttachmentName.trim()]);
    setNewAttachmentName("");
  };

  // DISPATCH REQUEST CREATION / MODIFICATION
  const saveRequestForm = async (isDraft: boolean) => {
    setAppError("");
    setAppSuccess("");

    if (!projectName.trim()) {
      setAppError("Purchase reference project name is required");
      return;
    }

    const finalCategory = category === "Others" ? (customCategory.trim() || "Others") : category;
    if (category === "Others" && customCategory.trim()) {
      const trimmed = customCategory.trim();
      if (!allCategories.includes(trimmed)) {
        setAdditionalCategories((prev) => [...prev, trimmed]);
      }
    }
    const isTravel = finalCategory.toLowerCase().includes("travel") || finalCategory === "Outstation Travel Allowance";

    if (!isTravel && requestItems.length === 0) {
      setAppError("A minimum of 1 line item is required to log purchase approval request");
      return;
    }

    setLoading(true);

    try {
      const method = editingRequestId ? "PUT" : "POST";
      const endpoint = editingRequestId ? `/api/requests/${editingRequestId}` : "/api/requests";

      // Map travel itinerary dynamic expenses to the standard items database so reporting succeeds
      let finalItems = [...requestItems];
      if (isTravel) {
        finalItems = [];
        travelItinerary.forEach((row, i) => {
          const dayPrefix = `Day ${row.day || (i + 1)} (${row.date || "N/A"}) Voyage: ${row.from || "Unspecified"} ➔ ${row.to || "Unspecified"}`;
          if (row.lodgingCost > 0) {
            finalItems.push({
              id: `tr-lodg-${row.id}`,
              description: `${dayPrefix} - Lodging Expense: ${row.lodgingDesc || "Lodging Cab"}`,
              quantity: 1,
              unitPrice: Number(row.lodgingCost),
              taxPercent: 0,
              total: Number(row.lodgingCost)
            });
          }
          if (row.foodCost > 0) {
            finalItems.push({
              id: `tr-food-${row.id}`,
              description: `${dayPrefix} - Food Meal: ${row.foodDesc || "Daily meal costs"}`,
              quantity: 1,
              unitPrice: Number(row.foodCost),
              taxPercent: 0,
              total: Number(row.foodCost)
            });
          }
          if (row.conveyanceCost > 0) {
            if (row.conveyances && row.conveyances.length > 0) {
              row.conveyances.forEach((cItem, cIdx) => {
                if (cItem.cost > 0) {
                  finalItems.push({
                    id: `tr-conv-${row.id}-${cItem.id || cIdx}`,
                    description: `${dayPrefix} - Conveyance: ${cItem.type || "Transport mode"}`,
                    quantity: 1,
                    unitPrice: Number(cItem.cost),
                    taxPercent: 0,
                    total: Number(cItem.cost)
                  });
                }
              });
            } else {
              finalItems.push({
                id: `tr-conv-${row.id}`,
                description: `${dayPrefix} - Conveyance: ${row.conveyanceType || "Transport fee"}`,
                quantity: 1,
                unitPrice: Number(row.conveyanceCost),
                taxPercent: 0,
                total: Number(row.conveyanceCost)
              });
            }
          }
        });

        if (finalItems.length === 0) {
          finalItems.push({
            id: `tr-base-${Date.now()}`,
            description: `Outstation Travel Allowance base itinerary logged for: ${projectName}`,
            quantity: 1,
            unitPrice: 0,
            taxPercent: 0,
            total: 0
          });
        }
      }

      const travelDetailsPayload = isTravel ? {
        departureDate,
        arrivalDate,
        travelFrom,
        travelTo,
        hotelName,
        hotelDetails,
        notes: travelNotes,
        trainNoName,
        millNameAddress,
        advanceAmount: Number(advanceAmount) || 0,
        advanceDate,
        balanceReturnedHO: Number(balanceReturnedHO) || 0,
        balancePaidToTraveler: Number(balancePaidToTraveler) || 0,
        itinerary: travelItinerary
      } : undefined;

      const payload = {
        projectName: projectName.trim(),
        category: finalCategory,
        items: finalItems,
        attachments: formAttachments,
        isDraft,
        travelDetails: travelDetailsPayload,
        assignedHeadId: selectedHeadId,
        assignedAdminId: selectedAdminId,
        assignedSuperAdminId: selectedSuperAdminId,
        documentType: selectedDocType
      };

      const resp = await fetch(endpoint, {
        method,
        headers: apiHeaders,
        body: JSON.stringify(payload)
      });

      const resData = await resp.json();
      if (!resp.ok) {
        setAppError(resData.error || "Failed to commit record updates");
        return;
      }

      setAppSuccess(isDraft 
        ? "Purchase request form saved securely in Drafts list."
        : "Purchase request successfully dispatched to Administrators."
      );

      if (!editingRequestId && !isDraft && resData.request && resData.request.category !== "Cash Voucher") {
        setCreatedRequestForCV(resData.request);
      }

      // Clean creator states
      setEditingRequestId(null);
      setProjectName("");
      setCategory("Equipment");
      setCustomCategory("");
      setSelectedHeadId("");
      setSelectedAdminId("");
      setSelectedSuperAdminId("");
      resetTravelForm();
      setRequestItems([]);
      setFormAttachments([]);

      setCurrentPage("requests");
    } catch (e) {
      setAppError("Failed communication with backend corporate database server.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLinkedCashVoucher = async (original: RequestForm) => {
    setLoading(true);
    setAppError("");
    setAppSuccess("");
    setLinkingSuccessMsg("");
    try {
      const resp = await fetch(`/api/requests/${original.id}/create-linked-cv`, {
        method: "POST",
        headers: apiHeaders
      });
      const data = await resp.json();
      if (!resp.ok) {
        setAppError(data.error || "Failed to automatically generate linked Cash Voucher.");
        return;
      }
      setAppSuccess(`Success! Cash Voucher ${data.request.documentNumber || data.request.id} automatically generated and linked to ${original.documentNumber || original.id}.`);
      setLinkingSuccessMsg(`Generated ${data.request.documentNumber || data.request.id} for ${original.documentNumber || original.id}`);
      setCreatedRequestForCV(null);
      fetchRequests();
      fetchDashboardMetrics();
      fetchAuditLogs();
      setCurrentPage("requests");
    } catch (e) {
      setAppError("Failed to communicate with corporate database server.");
    } finally {
      setLoading(false);
    }
  };

  const saveCashVoucherForm = async () => {
    setAppError("");
    setAppSuccess("");

    if (!cvDebitTo.trim()) {
      setAppError("Expenses Head is required for Cash Voucher format.");
      return;
    }
    const valAmt = Number(cvAmount);
    if (!valAmt || valAmt <= 0) {
      setAppError("Please specify a valid Cash Voucher Amount greater than zero.");
      return;
    }
    if (!cvExpenseDetails.trim()) {
      setAppError("Please specify 'kind of expenses' description for the Cash Voucher.");
      return;
    }

    setLoading(true);

    try {
      const endpoint = "/api/requests";
      const method = "POST";

      const finalItems = [{
        id: "cv-item-" + Date.now(),
        description: `Cash Voucher Expense Head: ${cvDebitTo.trim()} (${cvExpenseDetails.trim()})`,
        quantity: 1,
        unitPrice: valAmt,
        taxPercent: 0,
        total: valAmt
      }];

      const supportingBillDetail = cvBillParticulars.trim() ? {
        billDate: cvBillDate,
        billParticulars: cvBillParticulars,
        billRate: cvBillRate,
        billAmount: Number(cvBillAmount) || valAmt,
        billFileName: cvBillFileName || "proof_receipt.jpg",
        billFileContent: cvBillFileContent || "MOCK_ATTACHMENT_CONTENT"
      } : {};

      const payload = {
        projectName: `Cash Voucher: ${cvDebitTo.trim()}`,
        category: "Cash Voucher",
        documentType: "CV",
        items: finalItems,
        attachments: cvBillFileContent ? [cvBillFileName || "proof_receipt.jpg"] : [],
        isDraft: false,
        assignedHeadId: selectedHeadId || undefined,
        assignedAdminId: selectedAdminId || undefined,
        assignedSuperAdminId: selectedSuperAdminId || undefined,
        cashVoucherDetails: {
          voucherNo: cvVoucherNo,
          debitTo: cvDebitTo.trim(),
          fileNo: cvFileNo,
          expenseDetails: cvExpenseDetails.trim(),
          incurredBy: cvIncurredBy.trim(),
          amountInWords: cvAmountInWords.trim() || undefined,
          checkedBy: cvCheckedBy.trim() || undefined,
          authorisedBy: cvAuthorisedBy.trim() || undefined,
          receivedPaymentBy: cvReceivedPaymentBy.trim() || undefined,
          ...supportingBillDetail
        }
      };

      const resp = await fetch(endpoint, {
        method,
        headers: apiHeaders,
        body: JSON.stringify(payload)
      });

      const resData = await resp.json();
      if (!resp.ok) {
        setAppError(resData.error || "Failed to submit cash voucher.");
        return;
      }

      setAppSuccess("Cash Voucher successfully filed and dispatched for authorization.");
      resetCashVoucherForm();
      setEditingRequestId(null);
      fetchRequests();
      fetchAuditLogs();
      setCurrentPage("requests");
    } catch (e) {
      setAppError("Failed to communicate with corporate database server.");
    } finally {
      setLoading(false);
    }
  };

  const saveCreditCardExpenseForm = async () => {
    setAppError("");
    setAppSuccess("");

    if (!ccTransactions || ccTransactions.length === 0) {
      setAppError("Please add at least one credit card transaction.");
      return;
    }

    const processedTxs: any[] = [];
    let err = "";
    ccTransactions.forEach((tx, idx) => {
      if (err) return;
      if (!tx.cardId) {
        err = `Please select a Corporate Card for Transaction Row #${idx + 1}.`;
        return;
      }
      if (!tx.description || !tx.description.trim()) {
        err = `Please specify the description for Transaction Row #${idx + 1}.`;
        return;
      }
      const amt = Number(tx.amount);
      if (!amt || amt <= 0) {
        err = `Please specify a valid amount greater than zero for Transaction Row #${idx + 1}.`;
        return;
      }
      const selectedCard = creditCardsList.find(c => c.id === tx.cardId);
      if (!selectedCard) {
        err = `Selected Credit Card in Row #${idx + 1} cannot be verified in the Master registry.`;
        return;
      }
      processedTxs.push({
        id: tx.id || `cc-tx-row-${idx}-${Date.now()}`,
        cardId: tx.cardId,
        cardName: selectedCard.cardName,
        cardholderName: selectedCard.cardholderName,
        description: tx.description.trim(),
        amount: amt
      });
    });

    if (err) {
      setAppError(err);
      return;
    }

    const totalCCEAmount = processedTxs.reduce((sum, tx) => sum + tx.amount, 0);
    const primaryCardholder = processedTxs[0].cardholderName || "Corporate card";
    const descSummary = processedTxs[0].description;
    const titleSummary = processedTxs.length > 1 
      ? `Grouped Credit Card charges (${processedTxs.length} cards) - ₹${totalCCEAmount.toLocaleString("en-IN")}`
      : `Credit Card charge: ${primaryCardholder} - ${descSummary.substring(0, 30)}`;

    setLoading(true);

    try {
      const isEdit = !!editingRequestId;
      const endpoint = isEdit ? `/api/requests/${editingRequestId}` : "/api/requests";
      const method = isEdit ? "PUT" : "POST";

      const finalItems = processedTxs.map((tx, idx) => ({
        id: `cc-item-${idx}-${Date.now()}`,
        description: `[${tx.cardName}] ${tx.description}`,
        quantity: 1,
        unitPrice: tx.amount,
        taxPercent: 0,
        total: tx.amount
      }));

      const payload = {
        projectName: titleSummary,
        category: "Credit Card Expense",
        documentType: "CCE",
        items: finalItems,
        attachments: ccAttachments,
        isDraft: false,
        assignedHeadId: selectedHeadId || undefined,
        assignedAdminId: selectedAdminId || undefined,
        assignedSuperAdminId: selectedSuperAdminId || undefined,
        creditCardDetails: {
          voucherNo: ccVoucherNo,
          cardId: processedTxs[0].cardId,
          cardName: processedTxs[0].cardName,
          cardholderName: processedTxs[0].cardholderName,
          last4Digits: "",
          amount: totalCCEAmount,
          description: processedTxs.length === 1 ? processedTxs[0].description : `${processedTxs.length} Transactions Grouped`,
          expenseDate: ccExpenseDate,
          expenseHead: ccExpenseHead,
          expenseType: ccExpenseType,
          linkedOtaNo: ccExpenseType === "OTA" ? ccLinkedOtaNo : undefined,
          remarks: ccRemarks.trim() || undefined,
          attachments: ccAttachments,
          transactions: processedTxs
        }
      };

      const resp = await fetch(endpoint, {
        method,
        headers: apiHeaders,
        body: JSON.stringify(payload)
      });

      const resData = await resp.json();
      if (!resp.ok) {
        setAppError(resData.error || "Failed to submit credit card expense.");
        return;
      }

      setAppSuccess("Credit Card Expense record successfully filed and dispatched for authorization.");
      resetCreditCardExpenseForm();
      setEditingRequestId(null);
      fetchRequests();
      fetchAuditLogs();
      setCurrentPage("requests");
    } catch (e) {
      setAppError("Failed to communicate with corporate database server.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddLcRow = () => {
    const nextSrNo = lcRows.length + 1;
    const todayStr = new Date().toLocaleDateString("en-GB");
    setLcRows([
      ...lcRows,
      { id: `lc-row-${Date.now()}`, serialNo: nextSrNo, date: todayStr, from: "", to: "", purpose: "", amount: 0 }
    ]);
  };

  const handleUpdateLcRow = (index: number, key: keyof LocalConveyanceRow, val: any) => {
    const updated = [...lcRows];
    updated[index] = { ...updated[index], [key]: val };
    setLcRows(updated);
  };

  const handleRemoveLcRow = (index: number) => {
    if (lcRows.length === 1) return;
    const filtered = lcRows.filter((_, idx) => idx !== index).map((row, idx) => ({
      ...row,
      serialNo: idx + 1
    }));
    setLcRows(filtered);
  };

  const handleAddScRow = () => {
    const nextSrNo = scRows.length + 1;
    const todayStr = new Date().toLocaleDateString("en-GB");
    setScRows([
      ...scRows,
      { id: `sc-row-${Date.now()}`, serialNo: nextSrNo, date: todayStr, from: "", to: "", purpose: "", amount: 0 }
    ]);
  };

  const handleUpdateScRow = (index: number, key: keyof LocalConveyanceRow, val: any) => {
    const updated = [...scRows];
    updated[index] = { ...updated[index], [key]: val };
    setScRows(updated);
  };

  const handleRemoveScRow = (index: number) => {
    if (scRows.length === 1) return;
    const filtered = scRows.filter((_, idx) => idx !== index).map((row, idx) => ({
      ...row,
      serialNo: idx + 1
    }));
    setScRows(filtered);
  };

  const saveSampleCollectionForm = async (isDraftParam: boolean = false) => {
    setAppError("");
    setAppSuccess("");

    if (!isDraftParam) {
      if (!scKindOfExpense.trim()) {
        setAppError("Kind of Expense is required for Sample Collection Voucher.");
        return;
      }
      if (!scIncurredBy.trim()) {
        setAppError("Incurred By is required for Sample Collection Voucher.");
        return;
      }

      const totalAmt = scRows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
      if (totalAmt <= 0) {
        setAppError("Please add at least one travel entry with a valid amount.");
        return;
      }

      const invalidRow = scRows.find(r => !r.date.trim() || !r.from.trim() || !r.purpose.trim() || Number(r.amount) <= 0);
      if (invalidRow) {
        setAppError("Please fill in valid Date, From, Description and Amount for all rows of the Sample Collection Form.");
        return;
      }
    } else {
      if (!scIncurredBy.trim() && !scKindOfExpense.trim() && scRows.length === 0) {
        setAppError("Please enter claimant name or purpose of conveyance to save as a draft.");
        return;
      }
    }

    const totalAmt = scRows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

    setLoading(true);

    try {
      const isEdit = !!editingRequestId;
      const method = isEdit ? "PUT" : "POST";
      const endpoint = isEdit ? `/api/requests/${editingRequestId}` : "/api/requests";

      const finalItems = [{
        id: "sc-item-" + Date.now(),
        description: `Sample Collection - ${(scKindOfExpense.trim() || "Draft details")} for ${(scIncurredBy.trim() || "Draft claimant")}`,
        quantity: 1,
        unitPrice: totalAmt,
        taxPercent: 0,
        total: totalAmt
      }];

      const payload = {
        projectName: `Sample Collection for ${(scIncurredBy.trim() || "Draft claimant")}`,
        category: "Sample Collection",
        documentType: "CV",
        items: finalItems,
        attachments: scAttachments,
        isDraft: isDraftParam,
        assignedHeadId: selectedHeadId || undefined,
        assignedAdminId: selectedAdminId || undefined,
        assignedSuperAdminId: selectedSuperAdminId || undefined,
        localConveyanceDetails: {
          voucherNo: scVoucherNo,
          expenseHead: "Sample Collection",
          fileNo: scFileNo || new Date().toLocaleDateString("en-GB"),
          kindOfExpense: scKindOfExpense.trim(),
          incurredBy: scIncurredBy.trim(),
          amount: totalAmt,
          amountInWords: numberToWords(totalAmt) + " Only",
          rows: scRows,
          createdByName: currentUser?.name || ""
        }
      };

      const resp = await fetch(endpoint, {
        method,
        headers: apiHeaders,
        body: JSON.stringify(payload)
      });

      const resData = await resp.json();
      if (!resp.ok) {
        setAppError(resData.error || "Failed to submit sample collection form.");
        return;
      }

      setAppSuccess(isDraftParam 
        ? "Sample Collection Claim saved securely in Drafts list."
        : isEdit ? "Sample Collection Claim successfully modified." : "Sample Collection successfully filed."
      );

      if (!isEdit && !isDraftParam && resData.request) {
        setCreatedRequestForCV(resData.request);
      }

      resetSampleCollectionForm();
      setEditingRequestId(null);
      setIsScEditing(false);
      fetchRequests();
      fetchAuditLogs();
      setCurrentPage("requests");
    } catch (e) {
      setAppError("Failed to communicate with corporate database server.");
    } finally {
      setLoading(false);
    }
  };

  const saveLocalConveyanceForm = async (isDraftParam: boolean = false) => {
    setAppError("");
    setAppSuccess("");

    if (!isDraftParam) {
      if (!lcKindOfExpense.trim()) {
        setAppError("Kind of Expense is required for Local Conveyance Voucher.");
        return;
      }
      if (!lcIncurredBy.trim()) {
        setAppError("Incurred By is required for Local Conveyance Voucher.");
        return;
      }

      const totalAmt = lcRows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
      if (totalAmt <= 0) {
        setAppError("Please add at least one travel entry with a valid amount.");
        return;
      }

      const invalidRow = lcRows.find(r => !r.date.trim() || !r.from.trim() || !r.to.trim() || !r.purpose.trim() || Number(r.amount) <= 0);
      if (invalidRow) {
        setAppError("Please fill in valid Date, From, To, Purpose and Amount for all travel rows of the Local Conveyance Form.");
        return;
      }
    } else {
      if (!lcIncurredBy.trim() && !lcKindOfExpense.trim() && lcRows.length === 0) {
        setAppError("Please enter claimant name or purpose of conveyance to save as a draft.");
        return;
      }
    }

    const totalAmt = lcRows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

    setLoading(true);

    try {
      const isEdit = !!editingRequestId;
      const method = isEdit ? "PUT" : "POST";
      const endpoint = isEdit ? `/api/requests/${editingRequestId}` : "/api/requests";

      const finalItems = [{
        id: "lc-item-" + Date.now(),
        description: `Local Conveyance - ${(lcKindOfExpense.trim() || "Draft details")} for ${(lcIncurredBy.trim() || "Draft claimant")}`,
        quantity: 1,
        unitPrice: totalAmt,
        taxPercent: 0,
        total: totalAmt
      }];

      const payload = {
        projectName: `Local Conveyance for ${(lcIncurredBy.trim() || "Draft claimant")}`,
        category: "Local Conveyance",
        documentType: "CV",
        items: finalItems,
        attachments: lcAttachments,
        isDraft: isDraftParam,
        assignedHeadId: selectedHeadId || undefined,
        assignedAdminId: selectedAdminId || undefined,
        assignedSuperAdminId: selectedSuperAdminId || undefined,
        localConveyanceDetails: {
          voucherNo: lcVoucherNo,
          expenseHead: "Local Conveyance",
          fileNo: lcFileNo || new Date().toLocaleDateString("en-GB"),
          kindOfExpense: lcKindOfExpense.trim(),
          incurredBy: lcIncurredBy.trim(),
          amount: totalAmt,
          amountInWords: numberToWords(totalAmt) + " Only",
          rows: lcRows,
          createdByName: currentUser?.name || ""
        }
      };

      const resp = await fetch(endpoint, {
        method,
        headers: apiHeaders,
        body: JSON.stringify(payload)
      });

      const resData = await resp.json();
      if (!resp.ok) {
        setAppError(resData.error || "Failed to submit local conveyance form.");
        return;
      }

      setAppSuccess(isDraftParam 
        ? "Local Conveyance Claim saved securely in Drafts list."
        : isEdit ? "Local Conveyance Claim successfully modified." : "Local Conveyance successfully filed."
      );

      if (!isEdit && !isDraftParam && resData.request) {
        setCreatedRequestForCV(resData.request);
      }

      resetLocalConveyanceForm();
      setEditingRequestId(null);
      setIsLcEditing(false);
      fetchRequests();
      fetchAuditLogs();
      setCurrentPage("requests");
    } catch (e) {
      setAppError("Failed to communicate with corporate database server.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTeRow = () => {
    const nextSrNo = teRows.length + 1;
    const todayStr = new Date().toLocaleDateString("en-GB");
    setTeRows([
      ...teRows,
      { id: `row-${Date.now()}`, serialNo: nextSrNo, date: todayStr, particular: "", amount: 0 }
    ]);
  };

  const handleUpdateTeRow = (index: number, key: keyof TravelExpenseRow, val: any) => {
    const updated = [...teRows];
    updated[index] = { ...updated[index], [key]: val };
    setTeRows(updated);
  };

  const handleRemoveTeRow = (index: number) => {
    if (teRows.length === 1) return;
    const filtered = teRows.filter((_, idx) => idx !== index).map((row, idx) => ({
      ...row,
      serialNo: idx + 1
    }));
    setTeRows(filtered);
  };

  const saveTravelExpensesForm = async () => {
    setAppError("");
    setAppSuccess("");

    if (!teFilerName.trim()) {
      setAppError("Name of Filer is required for Traveling Expenses.");
      return;
    }
    if (!teDetails.trim()) {
      setAppError("Journey details description is required for Traveling Expenses.");
      return;
    }
    
    const invalidRow = teRows.find(r => !r.date.trim() || !r.particular.trim() || Number(r.amount) <= 0);
    if (invalidRow) {
      setAppError("Please fill in valid Date, Particular, and Amount for all traveling expense rows.");
      return;
    }

    setLoading(true);

    try {
      const endpoint = "/api/requests";
      const method = "POST";

      const totalAmountSum = teRows.reduce((acc, r) => acc + (Number(r.amount) || 0), 0);

      const finalItems = teRows.map((r, idx) => ({
        id: `te-item-${idx}-${Date.now()}`,
        description: `Date: ${r.date} | Particular: ${r.particular}`,
        quantity: 1,
        unitPrice: Number(r.amount) || 0,
        taxPercent: 0,
        total: Number(r.amount) || 0
      }));

      const payload = {
        projectName: `Travelling Expenses: ${teFilerName.trim()} (${teDetails.trim().substring(0, 40)}...)`,
        category: "Travel Expenses",
        documentType: "TE",
        items: finalItems,
        attachments: teBillFileContent ? [teBillFileName || "travel_receipt.jpg"] : [],
        isDraft: false,
        assignedHeadId: selectedHeadId || undefined,
        assignedAdminId: selectedAdminId || undefined,
        assignedSuperAdminId: selectedSuperAdminId || undefined,
        travelExpensesDetails: {
          voucherNo: teVoucherNo,
          name: teFilerName.trim(),
          dateDesc: teDateDesc.trim(),
          details: teDetails.trim(),
          rows: teRows,
          totalAmount: totalAmountSum,
          createdByName: currentUser?.name || teFilerName.trim(),
          billFileName: teBillFileName || undefined,
          billFileContent: teBillFileContent || undefined
        }
      };

      const resp = await fetch(endpoint, {
        method,
        headers: apiHeaders,
        body: JSON.stringify(payload)
      });

      const resData = await resp.json();
      if (!resp.ok) {
        setAppError(resData.error || "Failed to submit travelling expenses.");
        return;
      }

      setAppSuccess("Travelling Expenses form successfully filed and dispatched for authorization.");
      if (resData.request) {
        setCreatedRequestForCV(resData.request);
      }
      resetTravelExpensesForm();
      setEditingRequestId(null);
      fetchRequests();
      fetchAuditLogs();
      setCurrentPage("requests");
    } catch (e) {
      setAppError("Failed to communicate with corporate database server.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditTrigger = (r: RequestForm) => {
    setEditingRequestId(r.id);
    setProjectName(r.projectName);

    if (r.category === "Cash Voucher") {
      setCvVoucherNo(r.cashVoucherDetails?.voucherNo || "");
      setCvFileNo(r.cashVoucherDetails?.fileNo || "");
      setCvDebitTo(r.cashVoucherDetails?.debitTo || "");
      setCvExpenseDetails(r.cashVoucherDetails?.expenseDetails || "");
      setCvIncurredBy(r.cashVoucherDetails?.incurredBy || "");
      setCvAmount(String(r.cashVoucherDetails?.amount || r.totalBudget || ""));
      setCvAmountInWords(r.cashVoucherDetails?.amountInWords || "");
      setSelectedHeadId(r.assignedHeadId || "");
      setSelectedAdminId(r.assignedAdminId || "");
      setSelectedSuperAdminId(r.assignedSuperAdminId || "");
      setCurrentPage("cash-voucher");
      setActiveRequestDetails(null);
      return;
    }

    if (r.category === "Local Conveyance") {
      setLcVoucherNo(r.localConveyanceDetails?.voucherNo || "");
      setLcFileNo(r.localConveyanceDetails?.fileNo || "");
      setLcKindOfExpense(r.localConveyanceDetails?.kindOfExpense || "");
      setLcIncurredBy(r.localConveyanceDetails?.incurredBy || "");
      if (r.localConveyanceDetails?.rows && r.localConveyanceDetails.rows.length > 0) {
        setLcRows([...r.localConveyanceDetails.rows]);
      } else {
        setLcRows([
          { id: "lc-row-1", serialNo: 1, date: new Date().toLocaleDateString("en-GB"), from: "", to: "", purpose: "", amount: 0 }
        ]);
      }
      setLcAttachments(r.attachments || []);
      setNewLcAttachmentName("");
      setSelectedHeadId(r.assignedHeadId || "");
      setSelectedAdminId(r.assignedAdminId || "");
      setSelectedSuperAdminId(r.assignedSuperAdminId || "");
      setCurrentPage("local-conveyance");
      setActiveRequestDetails(null);
      return;
    }

    if (r.category === "Sample Collection") {
      setScVoucherNo(r.localConveyanceDetails?.voucherNo || "");
      setScFileNo(r.localConveyanceDetails?.fileNo || "");
      setScKindOfExpense(r.localConveyanceDetails?.kindOfExpense || "");
      setScIncurredBy(r.localConveyanceDetails?.incurredBy || "");
      if (r.localConveyanceDetails?.rows && r.localConveyanceDetails.rows.length > 0) {
        setScRows([...r.localConveyanceDetails.rows]);
      } else {
        setScRows([
          { id: "sc-row-1", serialNo: 1, date: new Date().toLocaleDateString("en-GB"), from: "", to: "", purpose: "", amount: 0 }
        ]);
      }
      setScAttachments(r.attachments || []);
      setNewScAttachmentName("");
      setSelectedHeadId(r.assignedHeadId || "");
      setSelectedAdminId(r.assignedAdminId || "");
      setSelectedSuperAdminId(r.assignedSuperAdminId || "");
      setCurrentPage("sample-collection");
      setActiveRequestDetails(null);
      return;
    }

    if (r.category === "Credit Card Expense") {
      setCcVoucherNo(r.creditCardDetails?.voucherNo || "");
      setCcCardId(r.creditCardDetails?.cardId || r.creditCardDetails?.creditCardId || "");
      setCcAmount(String(r.creditCardDetails?.amount || ""));
      setCcDescription(r.creditCardDetails?.description || "");
      setCcExpenseDate(r.creditCardDetails?.expenseDate || new Date().toISOString().split("T")[0]);
      setCcExpenseHead(r.creditCardDetails?.expenseHead || "Travel");
      setCcExpenseType(r.creditCardDetails?.expenseType || "General");
      setCcLinkedOtaNo(r.creditCardDetails?.linkedOtaNo || "");
      setCcManualOta(!!r.creditCardDetails?.linkedOtaNo);
      setCcRemarks(r.creditCardDetails?.remarks || "");
      setCcAttachments(r.attachments || []);
      
      if (r.creditCardDetails?.transactions && r.creditCardDetails.transactions.length > 0) {
        setCcTransactions([...r.creditCardDetails.transactions]);
      } else {
        setCcTransactions([
          {
            id: "cc-tx-1",
            cardId: r.creditCardDetails?.cardId || r.creditCardDetails?.creditCardId || "",
            description: r.creditCardDetails?.description || "",
            amount: r.creditCardDetails?.amount || ""
          }
        ]);
      }
      
      setSelectedHeadId(r.assignedHeadId || "");
      setSelectedAdminId(r.assignedAdminId || "");
      setSelectedSuperAdminId(r.assignedSuperAdminId || "");
      setCurrentPage("credit-card-expense");
      setActiveRequestDetails(null);
      return;
    }
    
    if (allCategories.includes(r.category)) {
      setCategory(r.category);
      setCustomCategory("");
    } else {
      setCategory("Others");
      setCustomCategory(r.category);
    }

    if (r.travelDetails) {
      setDepartureDate(r.travelDetails.departureDate || "");
      setArrivalDate(r.travelDetails.arrivalDate || "");
      setTravelFrom(r.travelDetails.travelFrom || "");
      setTravelTo(r.travelDetails.travelTo || "");
      setHotelName(r.travelDetails.hotelName || "");
      setHotelDetails(r.travelDetails.hotelDetails || "");
      setTravelNotes(r.travelDetails.notes || "");
      setTrainNoName(r.travelDetails.trainNoName || "");
      setMillNameAddress(r.travelDetails.millNameAddress || "");
      setAdvanceAmount(r.travelDetails.advanceAmount || 0);
      setAdvanceDate(r.travelDetails.advanceDate || "");
      setBalanceReturnedHO(r.travelDetails.balanceReturnedHO || 0);
      setBalancePaidToTraveler(r.travelDetails.balancePaidToTraveler || 0);
      if (r.travelDetails.itinerary && r.travelDetails.itinerary.length > 0) {
        setTravelItinerary([...r.travelDetails.itinerary]);
      } else {
        setTravelItinerary([
          {
            id: "leg-" + Math.random().toString(36).substring(2, 9),
            day: "1",
            date: new Date().toISOString().split("T")[0],
            from: "",
            departureTime: "",
            to: "",
            arrivalTime: "",
            lodgingDesc: "",
            lodgingCost: 0,
            foodDesc: "",
            foodCost: 0,
            conveyanceType: "",
            conveyanceCost: 0,
            rowTotal: 0
          }
        ]);
      }
    } else {
      resetTravelForm();
    }

    setSelectedHeadId(r.assignedHeadId || "");
    setSelectedAdminId(r.assignedAdminId || "");
    setSelectedSuperAdminId(r.assignedSuperAdminId || "");
    setRequestItems([...r.items]);
    setFormAttachments([...r.attachments]);
    setCurrentPage("new-request");
    setActiveRequestDetails(null);
  };

  // ADMIN ACTION DECISION (APPROVE / REJECT / QUERY / FINALIZE)
  const submitAdminReview = async (decision: "Approve" | "Reject" | "Query" | "Finalize") => {
    if (!activeRequestDetails) return;

    if (decision === "Approve" && escalateTo && !selectedNextApproverId) {
      alert(`Please select the specific ${escalateTo === "admin" ? "Administrator" : "Super Admin"} to route the escalated request to.`);
      return;
    }

    let amt: number | undefined = undefined;
    if (decision === "Approve" || decision === "Finalize") {
      amt = Number(approvedAmountInput);
      if (isNaN(amt) || amt < 0) {
        alert("Please specify a valid Approved Amount (must be greater than or equal to 0).");
        return;
      }
      if (amt > activeRequestDetails.totalBudget) {
        alert(`Approved Amount (₹${amt.toLocaleString()}) cannot exceed the requested amount (₹${activeRequestDetails.totalBudget.toLocaleString()}).`);
        return;
      }
      if (amt < activeRequestDetails.totalBudget && !reductionReasonInput.trim()) {
        alert("Reason for Reduction is mandatory when approving a lower amount.");
        return;
      }
    }

    setLoading(true);

    try {
      const resp = await fetch(`/api/requests/${activeRequestDetails.id}/review`, {
        method: "POST",
        headers: apiHeaders,
        body: JSON.stringify({
          decision,
          adminRemark: adminDecisionRemark.trim(),
          escalateTo: decision === "Finalize" ? undefined : escalateTo,
          escalateToId: decision === "Finalize" ? undefined : selectedNextApproverId,
          approvedAmount: amt,
          reductionReason: reductionReasonInput.trim()
        })
      });

      const data = await resp.json();
      if (!resp.ok) {
        alert(data.error || "Admin operation failed");
        return;
      }

      setAdminDecisionRemark("");
      setSelectedNextApproverId("");
      setAppSuccess(`Request successfully reviewed: ${decision}`);
      fetchRequests();
      fetchDashboardMetrics();
      if (currentUser && (currentUser.role === "admin" || currentUser.role === "superadmin")) {
        fetchAuditLogs();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // SEND COMMENT THREAD DISPATCH
  const dispatchNewComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRequestDetails || !newCommentText.trim()) return;

    try {
      const resp = await fetch(`/api/requests/${activeRequestDetails.id}/comments`, {
        method: "POST",
        headers: apiHeaders,
        body: JSON.stringify({ text: newCommentText })
      });
      
      const data = await resp.json();
      if (resp.ok) {
        setNewCommentText("");
        fetchRequests();
      } else {
        alert(data.error || "Failed to submit comment");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // CALCULATE INCOMING ITEMS TOTAL SUM FOR LIVE VISUALS
  const computeTotalsPreview = () => {
    let net = 0;
    let taxes = 0;
    requestItems.forEach(item => {
      const rowNet = item.quantity * item.unitPrice;
      const rowTax = rowNet * (item.taxPercent / 100);
      net += rowNet;
      taxes += rowTax;
    });
    return {
      net,
      tax: taxes,
      grand: net + taxes
    };
  };

  const currentPreview = computeTotalsPreview();

  // Pie chart helper color palettes
  const PIE_COLORS = ["#0284c7", "#f59e0b", "#ec4899", "#8b5cf6", "#10b981", "#3b82f6"];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans" id="apruv-root-workspace">
      
      {/* Splash Startup Intro Sequence */}
      <AnimatePresence>
        {!splashComplete && (
          <SplashLoader onComplete={() => setSplashComplete(true)} />
        )}
      </AnimatePresence>
      
      {/* Alert Messaging System Banner */}
      {(appError || appSuccess) && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm w-full space-y-2">
          {appError && (
            <div className="bg-red-900 text-white p-4 rounded-xl shadow-2xl border border-red-850 flex items-start space-x-3 text-xs font-semibold animate-fade-in">
              <AlertCircle className="h-5 w-5 text-red-300 shrink-0" />
              <div className="flex-1">
                <p>{appError}</p>
                <button onClick={() => setAppError("")} className="mt-1 text-red-200 underline block cursor-pointer">Dismiss</button>
              </div>
            </div>
          )}
          {appSuccess && (
            <div className="bg-slate-900 text-white p-4 rounded-xl shadow-2xl border border-emerald-500/30 flex items-start space-x-3 text-xs font-semibold animate-fade-in">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
              <div className="flex-1">
                <p>{appSuccess}</p>
                <button onClick={() => setAppSuccess("")} className="mt-1 text-slate-300 underline block cursor-pointer">Dismiss</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Custom Expense Head Creational Modal Dialog */}
      {showAddCustomExpenseHeadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in" id="add-custom-expense-head-modal-backdrop">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">➕</span>
                <span className="font-extrabold text-[#111827] text-sm uppercase tracking-wider font-mono">Create Custom Expense Head</span>
              </div>
              <button 
                type="button" 
                onClick={() => {
                  setShowAddCustomExpenseHeadModal(false);
                  setCustomExpenseHeadName("");
                  setCustomExpenseHeadError("");
                  // Clean up the dropdown state if they close without saving
                  setCvDebitTo("");
                }}
                className="text-slate-450 hover:text-slate-700 font-bold px-2 py-1 rounded-lg text-lg hover:bg-slate-50 transition cursor-pointer"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Define a new custom classification. This item will be saved **permanently** in the corporate master cloud registry and visible to all workers filing Cash Vouchers in this enterprise block.
            </p>

            <div className="space-y-1.5 font-sans">
              <label className="block text-[10px] font-bold text-slate-500 uppercase">Expense Classification Name *</label>
              <input
                type="text"
                maxLength={100}
                placeholder="e.g. CSR Activities / Project Audit Charges / Site Lease"
                value={customExpenseHeadName}
                onChange={(e) => setCustomExpenseHeadName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-250 rounded-xl font-bold focus:ring-1 focus:ring-indigo-500 text-xs bg-slate-50 focus:bg-white text-slate-800"
                autoFocus
              />
              {customExpenseHeadError && (
                <p className="text-[10px] text-red-650 font-bold animate-pulse">⚠️ {customExpenseHeadError}</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowAddCustomExpenseHeadModal(false);
                  setCustomExpenseHeadName("");
                  setCustomExpenseHeadError("");
                  // Clean up the dropdown state if they close without saving
                  setCvDebitTo("");
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddCustomExpenseHead}
                className="px-4 py-2 bg-gradient-to-r from-indigo-950 to-slate-900 hover:opacity-90 text-white rounded-xl text-xs font-extrabold shadow-md transition cursor-pointer"
              >
                Save permanently (+ custom)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BEFORE AUTHENTICATION SYSTEM LANDING PAGE */}
      {!currentUser ? (
        <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full p-4 md:p-8 justify-center min-h-screen" id="gatekeeper-authentication-page">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Branding Column / Info Panel */}
            <div className="lg:col-span-5 space-y-6">
              <div className="flex flex-col space-y-1">
                <AproflowLogo size="lg" theme="light" />
                <p className="text-[10px] text-gray-550 uppercase font-mono tracking-widest pl-2">Multi-Company Spend Manager</p>
              </div>

              <div className="space-y-4">
                <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight leading-none">
                  Corporate spending, isolated.
                </h2>
                <p className="text-sm text-slate-650 leading-relaxed">
                  APROFLOW is a unified platform enabling companies to run independent purchase and petty cash requests with strict 4-digit enterprise code boundaries. Secure authentication, automated GST computation, audit logs, and interactive query threads are built in.
                </p>
              </div>
            </div>

            {/* Authentication Form Block (Right Column) */}
            <div className="lg:col-span-7 bg-white rounded-2xl shadow-xl border border-slate-150 overflow-hidden">
              
              {/* Card Title Tabs */}
              <div className="bg-slate-50 border-b border-gray-150 flex text-center">
                
                <button
                  type="button"
                  onClick={() => setAuthTab("login")}
                  className={`flex-1 py-4 font-sans font-extrabold text-[10px] md:text-xs tracking-tight transition uppercase ${authTab === "login" ? 'bg-white border-b-2 border-slate-900 text-slate-950' : 'text-gray-400 hover:text-gray-600 hover:bg-slate-100/50'}`}
                >
                  Authorized Sign-In
                </button>

                <button
                  type="button"
                  onClick={() => setAuthTab("employee_register")}
                  className={`flex-1 py-4 font-sans font-extrabold text-[10px] md:text-xs tracking-tight transition uppercase ${authTab === "employee_register" ? 'bg-white border-b-2 border-slate-900 text-slate-950' : 'text-gray-400 hover:text-gray-600 hover:bg-slate-100/50'}`}
                >
                  New Employee Register
                </button>
                
                <button
                  type="button"
                  onClick={() => setAuthTab("admin_register")}
                  className={`flex-1 py-4 font-sans font-extrabold text-[10px] md:text-xs tracking-tight transition uppercase ${authTab === "admin_register" ? 'bg-white border-b-2 border-slate-900 text-slate-950' : 'text-gray-400 hover:text-gray-650 hover:bg-slate-100/50'}`}
                >
                  Register New Enterprise
                </button>

              </div>

              {/* Form Areas */}
              <div className="p-6 md:p-8">
                
                {authTab === "login" && (
                  // Sign in Form
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-slate-900 tracking-tight">Authorized Login</h3>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-mono font-bold px-2 py-0.5 rounded-full uppercase">Isolated Node secure</span>
                      </div>
                      
                      <form onSubmit={handleLoginSubmit} className="space-y-4" id="form-login-payload">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Email / Employee Username</label>
                            <div className="relative">
                              <input
                                type="text"
                                placeholder="name@gmail.com, EMP-010, or mb2026"
                                value={loginEmail}
                                onChange={(e) => setLoginEmail(e.target.value)}
                                className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-slate-900 focus:border-slate-950"
                                required
                              />
                              <Mail className="absolute left-2.5 top-3 h-4 w-4 text-slate-400" />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Access Password</label>
                            <div className="relative">
                              <input
                                type="password"
                                placeholder="••••••••"
                                value={loginPassword}
                                onChange={(e) => setLoginPassword(e.target.value)}
                                className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-slate-900 focus:border-slate-950"
                                required
                              />
                              <Lock className="absolute left-2.5 top-3 h-4 w-4 text-slate-400" />
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end pt-1">
                          <button
                            type="submit"
                            className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-2.5 rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center space-x-1.5 cursor-pointer"
                          >
                            <span>Secure Entry</span>
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </form>


                    </div>
                  </div>
                )}

                {authTab === "employee_register" && (
                  // Register new employee (Worker signup)
                  <div className="space-y-4">
                    <div className="bg-emerald-50/70 text-emerald-990 p-3.5 rounded-xl text-xs font-semibold leading-relaxed border border-emerald-100 flex items-start space-x-2">
                      <UserCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Registering as a Corporate Employee:</p>
                        <p className="font-normal mt-0.5 text-slate-650">Please provide your employee credentials and enter the 4-digit Enterprise Code supplied by your company administrator to isolate your requests under the proper enterprise silo.</p>
                      </div>
                    </div>

                    {/* Step 1: Enterprise Code Input & Verification */}
                    <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">4-Digit Enterprise Code</label>
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            maxLength={4}
                            placeholder="e.g. 2026"
                            value={regEnterpriseCodeStr}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, "");
                              setRegEnterpriseCodeStr(val);
                              if (val.length === 4) {
                                handleVerifyEnterpriseCode(val);
                              } else {
                                setIsEnterpriseVerified(false);
                                setEnterpriseVerifyError("");
                              }
                            }}
                            className={`flex-1 px-3 py-2 border ${isEnterpriseVerified ? 'border-emerald-300 bg-emerald-50/30' : 'border-slate-200'} rounded-xl text-xs font-bold text-slate-900 tracking-wider focus:outline-none focus:ring-1 focus:ring-slate-950`}
                          />
                          <button
                            type="button"
                            onClick={() => handleVerifyEnterpriseCode(regEnterpriseCodeStr)}
                            disabled={verifyingEnterprise || regEnterpriseCodeStr.length !== 4}
                            className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold transition shrink-0"
                          >
                            {verifyingEnterprise ? "Verifying..." : "Verify"}
                          </button>
                        </div>
                      </div>

                      {enterpriseVerifyError && (
                        <p className="text-[10px] font-bold text-rose-600 animate-fade-in">
                          ⚠️ {enterpriseVerifyError}
                        </p>
                      )}

                      {isEnterpriseVerified && (
                        <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg text-emerald-900 text-[11px] font-bold flex items-center justify-between">
                          <span>✓ Verified: {verifiedEnterpriseName}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setIsEnterpriseVerified(false);
                              setRegEnterpriseCodeStr("");
                              setVerifiedEnterpriseCode("");
                              setEnterpriseCustomDepartments([]);
                            }}
                            className="text-[9px] underline hover:text-emerald-700 font-extrabold uppercase shrink-0 text-slate-500"
                          >
                            Change Code
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Step 2: Employee registration fields (only available once verified!) */}
                    {isEnterpriseVerified ? (
                      <form onSubmit={handleEmployeeRegisterSubmit} className="space-y-4 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Full Name</label>
                            <input
                              type="text"
                              placeholder="e.g. John Doe"
                              value={regName}
                              onChange={(e) => setRegName(e.target.value)}
                              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-slate-900 focus:border-slate-950"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Email Address</label>
                            <input
                              type="email"
                              placeholder="john.doe@company.com"
                              value={regEmail}
                              onChange={(e) => setRegEmail(e.target.value)}
                              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-slate-900 focus:border-slate-950"
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Username (Employee Code)</label>
                            <input
                              type="text"
                              placeholder="e.g. EMP-101"
                              value={regEmployeeCode}
                              onChange={(e) => setRegEmployeeCode(e.target.value.replace(/\s+/g, ""))}
                              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-slate-900 focus:border-slate-950 font-mono text-slate-800"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Create Access Password</label>
                            <input
                              type="password"
                              placeholder="••••••••"
                              value={regPassword}
                              onChange={(e) => setRegPassword(e.target.value)}
                              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-slate-900 focus:border-slate-950"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Assigned Department</label>
                            <select
                              value={regDepartment}
                              onChange={(e) => setRegDepartment(e.target.value)}
                              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-white focus:ring-1 focus:ring-slate-900 focus:border-slate-950"
                            >
                              {Array.from(new Set([
                                "IT",
                                "Administration",
                                "HR",
                                "Marketing",
                                "Inspectors",
                                "Chemist",
                                "Office Assistants",
                                "Business Head",
                                "laboratory",
                                ...enterpriseCustomDepartments
                              ])).map((deptOpt) => (
                                <option key={deptOpt} value={deptOpt}>
                                  {deptOpt}
                                </option>
                              ))}
                              <option value="Others">Others (Type custom...)</option>
                            </select>

                            {regDepartment === "Others" && (
                              <div className="mt-2 space-y-1 animate-fade-in">
                                <label className="block text-[10px] font-bold text-amber-800 uppercase">Custom Department Name *</label>
                                <input
                                  type="text"
                                  placeholder="e.g. Quality Assurance, Logistics"
                                  value={customDepartment}
                                  onChange={(e) => setCustomDepartment(e.target.value)}
                                  onBlur={(e) => {
                                    const trimmed = e.target.value.trim();
                                    if (trimmed) {
                                      if (!enterpriseCustomDepartments.includes(trimmed)) {
                                        setEnterpriseCustomDepartments((prev) => [...prev, trimmed]);
                                      }
                                      setRegDepartment(trimmed);
                                      setCustomDepartment("");
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      const trimmed = customDepartment.trim();
                                      if (trimmed) {
                                        if (!enterpriseCustomDepartments.includes(trimmed)) {
                                          setEnterpriseCustomDepartments((prev) => [...prev, trimmed]);
                                        }
                                        setRegDepartment(trimmed);
                                        setCustomDepartment("");
                                      }
                                    }
                                  }}
                                  className="w-full px-3 py-1.5 border border-amber-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-amber-500 focus:border-amber-600 bg-white cursor-pointer"
                                  required
                                />
                                <p className="text-[9px] text-amber-700/80 leading-normal">
                                  💡 Tip: Press <strong className="font-bold">Enter</strong> or click away to append to the department select lists.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl text-xs shadow-md transition cursor-pointer"
                        >
                          Register Employee Profile
                        </button>


                      </form>
                    ) : (
                      <div className="p-6 text-center text-slate-400 text-xs font-medium bg-slate-50/50 border border-dashed border-slate-200 rounded-xl">
                        🔒 Verification Required: Enter a valid active company's 4-digit Enterprise Code above to proceed with Employee registration.
                      </div>
                    )}
                  </div>
                )}

                {authTab === "admin_register" && (
                  // Register new administrator (Company Creator)
                  <div className="space-y-4">
                    <div className="bg-blue-50 text-blue-900 p-3 rounded-xl text-xs font-semibold leading-relaxed border border-blue-100 flex items-start space-x-2">
                      <Building2 className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Registering as an Enterprise Company Administrator:</p>
                        <p className="font-normal mt-0.5 text-slate-650">Creating an Admin workspace dynamically generates a random, permanent 4-digit code. Share this code with employees so they can onboard under your company record isolation boundaries safely.</p>
                      </div>
                    </div>

                    <form onSubmit={handleAdminRegisterSubmit} className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-800 uppercase mb-1">
                          Enterprise / Company Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. ABC Industries Pvt Ltd"
                          value={adminRegEnterpriseName}
                          onChange={(e) => setAdminRegEnterpriseName(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-slate-900 focus:border-slate-950"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Company Administrator Full Name</label>
                        <input
                          type="text"
                          placeholder="e.g. MB Executive Admin"
                          value={adminRegName}
                          onChange={(e) => setAdminRegName(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-slate-900 focus:border-slate-950"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Corporate Email Address</label>
                        <input
                          type="email"
                          placeholder="admin2026@gmail.com"
                          value={adminRegEmail}
                          onChange={(e) => setAdminRegEmail(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-slate-900 focus:border-slate-950"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Define Login Username</label>
                          <input
                            type="text"
                            placeholder="admin2026"
                            value={adminRegUsername}
                            onChange={(e) => setAdminRegUsername(e.target.value.replace(/\s+/g, ""))}
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-slate-900 focus:border-slate-950"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Access Password</label>
                          <input
                            type="password"
                            placeholder="AdminSecured101#"
                            value={adminRegPassword}
                            onChange={(e) => setAdminRegPassword(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-slate-900 focus:border-slate-950"
                            required
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-slate-950 hover:bg-slate-900 text-white font-bold py-3 rounded-xl text-xs shadow-md transition cursor-pointer"
                      >
                        Create Administration Workspace & Generate Company Code
                      </button>


                    </form>
                  </div>
                )}

              </div>
            </div>

          </div>

          {/* Core Footer Info */}
          <footer className="mt-12 py-6 border-t border-slate-200 text-center text-xs text-sans text-gray-400">
            <p>APROFLOW Purchase Approvals Workspace Platform. Complies with Audit Isolation Guidelines.</p>
          </footer>
        </div>
      ) : (
        /* AFTER AUTHENTICATION SYSTEM CONTAINER */
        <div className="flex-1 flex flex-col md:flex-row" id="authorized-apruv-shell">
          
          {/* Mobile Sidebar backdrop */}
          {mobileMenuOpen && (
            <div 
              className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
          )}
          
          {/* Left Vertical Sidebar / Mobile Drawer */}
          <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800 transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static md:w-64 transition-transform duration-300 ease-in-out shrink-0 overflow-y-auto`}>
            
            {/* Sidebar Branding Header */}
            <div className="p-5 border-b border-slate-800 flex items-start justify-between">
              <div className="flex flex-col space-y-1">
                <AproflowLogo size="sm" theme="dark" />
                <p className="text-[9px] uppercase tracking-wider text-amber-500 font-bold mt-2 font-mono pl-1">Company Account Code: {currentUser.enterpriseCode}</p>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition -mt-1 -mr-1"
                aria-label="Close sidebar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 pt-0">
              {/* Active Admin / Employee badge layout */}
              <div className="mt-4 p-3 bg-slate-950 rounded-xl border border-slate-800">
                <p className="text-[10px] uppercase font-bold text-slate-400">Connected Profile</p>
                <p className="text-xs font-semibold text-white mt-0.5 truncate">{currentUser.name}</p>
                <div className="flex items-center space-x-1.5 mt-1.5">
                  <span className={`px-2 py-0.5 text-[9px] uppercase font-extrabold rounded-md border ${
                    currentUser.role === "superadmin" ? "bg-yellow-500/10 text-yellow-300 border-yellow-500/30 font-extrabold" :
                    currentUser.role === "admin" ? "bg-amber-500/10 text-amber-300 border-amber-500/30" : 
                    currentUser.role === "head" ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/30" :
                    "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                  }`}>
                    {currentUser.role === "superadmin" ? "Super Admin" :
                     currentUser.role === "admin" ? "Admin" : 
                     currentUser.role === "head" ? "Dept Head" : 
                     "Staff Worker"}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">{currentUser.employeeCode}</span>
                </div>
              </div>
            </div>

            {/* Sidebar Routing Links */}
            <nav 
              onClick={() => setMobileMenuOpen(false)}
              className="flex-grow p-4 pt-0 space-y-1"
            >
              
              <button
                onClick={() => setCurrentPage("dashboard")}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${currentPage === "dashboard" ? "bg-slate-800 text-white shadow-inner" : "text-slate-400 hover:text-white hover:bg-slate-800/50"}`}
              >
                <BarChart3 className="h-4 w-4 text-slate-400" />
                <span>Dashboard Hub</span>
              </button>

              <button
                onClick={() => setCurrentPage("requests")}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${currentPage === "requests" ? "bg-slate-800 text-white shadow-inner" : "text-slate-400 hover:text-white hover:bg-slate-800/50"}`}
              >
                <div className="flex items-center space-x-3">
                  <FileText className="h-4 w-4 text-slate-400" />
                  <span>Approvals ({requestsList.length})</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setEditingRequestId(null);
                  setProjectName("");
                  setCategory("Equipment");
                  setCustomCategory("");
                  resetTravelForm();
                  setRequestItems([]);
                  setFormAttachments([]);
                  setCurrentPage("new-request");
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${currentPage === "new-request" ? "bg-slate-800 text-white shadow-inner" : "text-slate-400 hover:text-white hover:bg-slate-800/50"}`}
              >
                <Plus className="h-4 w-4 text-amber-400" />
                <span className="font-bold text-amber-400">File New Form</span>
              </button>

              <button
                onClick={() => {
                  setEditingRequestId(null);
                  resetCashVoucherForm();
                  setCurrentPage("cash-voucher");
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${currentPage === "cash-voucher" ? "bg-slate-800 text-white shadow-inner" : "text-slate-400 hover:text-white hover:bg-slate-800/50"}`}
              >
                <span className="text-sm font-extrabold text-amber-400 w-4 text-center shrink-0">+</span>
                <span className="font-bold text-amber-400">Cash Voucher</span>
              </button>

              <button
                onClick={() => {
                  setEditingRequestId(null);
                  resetTravelExpensesForm();
                  setCurrentPage("travel-expenses");
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${currentPage === "travel-expenses" ? "bg-slate-800 text-white shadow-inner" : "text-slate-400 hover:text-white hover:bg-slate-800/50"}`}
              >
                <span className="text-sm font-extrabold text-amber-400 w-4 text-center shrink-0">+</span>
                <span className="font-bold text-amber-400">Travel Expenses</span>
              </button>

              <button
                onClick={() => {
                  fetchCommissions();
                  setCurrentPage("commissions");
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${currentPage === "commissions" ? "bg-slate-800 text-white shadow-inner" : "text-slate-400 hover:text-white hover:bg-slate-800/50"}`}
              >
                <span className="text-sm font-extrabold text-amber-400 w-4 text-center shrink-0">+</span>
                <span className="font-bold text-amber-400">Management Commission</span>
              </button>

              <button
                onClick={() => {
                  setEditingRequestId(null);
                  resetLocalConveyanceForm();
                  setCurrentPage("local-conveyance");
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${currentPage === "local-conveyance" ? "bg-slate-800 text-white shadow-inner" : "text-slate-400 hover:text-white hover:bg-slate-800/50"}`}
              >
                <span className="text-sm font-extrabold text-amber-400 w-4 text-center shrink-0">+</span>
                <span className="font-bold text-amber-400">Local Conveyance</span>
              </button>

              <button
                onClick={() => {
                  setEditingRequestId(null);
                  resetSampleCollectionForm();
                  setCurrentPage("sample-collection");
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${currentPage === "sample-collection" ? "bg-slate-800 text-white shadow-inner" : "text-slate-400 hover:text-white hover:bg-slate-800/50"}`}
              >
                <span className="text-sm font-extrabold text-amber-400 w-4 text-center shrink-0">+</span>
                <span className="font-bold text-amber-400">Sample Collection</span>
              </button>

              <button
                onClick={() => {
                  setEditingRequestId(null);
                  resetCreditCardExpenseForm();
                  setCurrentPage("credit-card-expense");
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${currentPage === "credit-card-expense" ? "bg-slate-800 text-white shadow-inner" : "text-slate-400 hover:text-white hover:bg-slate-800/50"}`}
              >
                <span className="text-sm font-extrabold text-amber-500 w-4 text-center shrink-0">💳</span>
                <span className="font-bold text-amber-500">Credit Card Expense</span>
              </button>

              {/* Administrative Specific routes */}
              {(currentUser.role === "admin" || currentUser.role === "superadmin") && (
                <>
                  <div className="pt-4 pb-1 px-3">
                    <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Company Controls</span>
                  </div>

                  <button
                    onClick={() => setCurrentPage("employees")}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${currentPage === "employees" ? "bg-slate-800 text-white shadow-inner" : "text-slate-400 hover:text-white hover:bg-slate-800/50"}`}
                  >
                    <Users className="h-4 w-4 text-slate-400" />
                    <span>Onboarded Staff ({employeesList.length})</span>
                  </button>

                  <button
                    onClick={() => setCurrentPage("corporate-credit-cards")}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${currentPage === "corporate-credit-cards" ? "bg-slate-800 text-white shadow-inner" : "text-slate-400 hover:text-white hover:bg-slate-800/50"}`}
                  >
                    <CreditCard className="h-4 w-4 text-indigo-400 animate-pulse" />
                    <span className="font-bold text-slate-200">Corporate Credit Cards Master</span>
                  </button>

                  <button
                    onClick={() => setCurrentPage("centralized-records")}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${currentPage === "centralized-records" ? "bg-purple-950 text-white border border-purple-800/50 shadow-inner" : "text-slate-400 hover:text-white hover:bg-slate-800/50"}`}
                  >
                    <Database className="h-4 w-4 text-purple-400" />
                    <span className="font-bold text-purple-400">Centralized Records Hub</span>
                  </button>

                  <button
                    onClick={() => setCurrentPage("advanced-reports")}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${currentPage === "advanced-reports" ? "bg-gradient-to-r from-indigo-950 to-slate-900 text-white border border-indigo-900/50 shadow-md font-bold" : "text-slate-400 hover:text-white hover:bg-slate-800/50"}`}
                  >
                    <TrendingUp className="h-4 w-4 text-amber-500 animate-pulse" />
                    <span className="text-slate-200">Advanced Reports & BI</span>
                    <span className="bg-amber-500/10 text-amber-300 font-mono text-[8px] px-1 rounded uppercase font-black">Admins</span>
                  </button>

                  <button
                    onClick={() => setCurrentPage("audit-logs")}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${currentPage === "audit-logs" ? "bg-slate-800 text-white shadow-inner" : "text-slate-400 hover:text-white hover:bg-slate-800/50"}`}
                  >
                    <ClipboardList className="h-4 w-4 text-slate-400" />
                    <span>Corporate Audit Trail</span>
                  </button>

                  <button
                    onClick={() => {
                      fetchNumberingSettings();
                      setCurrentPage("numbering-settings");
                    }}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${currentPage === "numbering-settings" ? "bg-slate-800 text-white shadow-inner" : "text-slate-400 hover:text-white hover:bg-slate-800/50"}`}
                  >
                    <Settings className="h-4 w-4 text-slate-400" />
                    <span>Numbering Settings</span>
                  </button>
                </>
              )}

            </nav>

            {/* Logout Sidebar Footing */}
            <div 
              onClick={() => setMobileMenuOpen(false)}
              className="p-4 border-t border-slate-800 space-y-2"
            >
              <div className="bg-slate-950 p-2.5 rounded-xl text-[10px] text-slate-400 border border-slate-850">
                <span className="font-bold block text-slate-300">Invite Employees:</span>
                <span className="block mt-0.5 leading-normal">Workers can trigger sign up with company code: <strong className="text-amber-300 font-mono text-xs">{currentUser.enterpriseCode}</strong></span>
              </div>
              
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out Securely</span>
              </button>
            </div>

          </aside>

          {/* Right Main Platform Area */}
          <main className="flex-1 flex flex-col min-w-0 bg-slate-50">
            
            {/* Top Workspace Header Bar */}
            <header className="bg-white border-b border-gray-150 h-16 flex items-center justify-between px-4 sm:px-6 shrink-0 shadow-sm">
              
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                {/* Mobile menu toggle */}
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(true)}
                  className="md:hidden p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-150 transition shrink-0"
                  aria-label="Open application menu"
                >
                  <Menu className="h-5 w-5" />
                </button>

                <span className="font-sans font-extrabold text-[#111827] text-sm md:text-md tracking-tight uppercase truncate">
                  {currentPage === "dashboard" && "Dashboard Analytics"}
                  {currentPage === "requests" && "Purchase & Petty Cash Request list"}
                  {currentPage === "new-request" && (editingRequestId ? "Edit Purchase Request" : "File Expenditure Form")}
                  {currentPage === "cash-voucher" && "File Cash Voucher Receipt"}
                  {currentPage === "travel-expenses" && "File Travelling Expenses Form"}
                  {currentPage === "local-conveyance" && (editingRequestId ? "Edit Local Conveyance" : "Local Conveyance Claim form")}
                  {currentPage === "sample-collection" && (editingRequestId ? "Edit Sample Collection" : "Sample Collection Form")}
                  {currentPage === "employees" && "Corporate Workforce Roster"}
                  {currentPage === "commissions" && "Marketing Expense Hub"}
                  {currentPage === "audit-logs" && "Regulatory Incident Audit"}
                  {currentPage === "advanced-reports" && "Advanced Reports & BI Dashboard"}
                  {currentPage === "corporate-credit-cards" && "Corporate Credit Cards Setup"}
                  {currentPage === "credit-card-expense" && "Credit Card Expense Filing"}
                </span>
                <div className="hidden sm:flex items-center space-x-1.5 py-1 px-2.5 bg-blue-50 text-blue-900 rounded-lg text-xs font-bold border border-blue-100 shrink-0">
                  <Layers className="h-3.5 w-3.5 text-blue-500" />
                  <span>Segment: Company {currentUser.enterpriseCode}</span>
                </div>
              </div>

              {/* Top header navigation buttons */}
              <div className="flex items-center space-x-4">
                
                {/* Platform Notifications alerts */}
                <div className="relative">
                  <button 
                    onClick={() => setIsNotifPopoverOpen(!isNotifPopoverOpen)}
                    className="relative bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-full transition cursor-pointer"
                    aria-label="Notification bell"
                  >
                    <Bell className="h-4.5 w-4.5" />
                    {notifications.filter(n => !n.read).length > 0 && (
                      <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
                    )}
                  </button>

                  {/* Notifications Alert Dropdown */}
                  {isNotifPopoverOpen && (
                    <div className="absolute right-0 mt-2.5 w-80 bg-white rounded-xl shadow-2xl border border-gray-150 z-50 overflow-hidden text-xs animate-fade-in">
                      <div className="p-3 bg-slate-50 border-b border-gray-150 flex items-center justify-between">
                        <span className="font-extrabold text-slate-800">Company Alerts</span>
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-bold text-[9px]">
                          {notifications.filter(n => !n.read).length} Unread
                        </span>
                      </div>

                      <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-gray-400">No active system alerts.</div>
                        ) : (
                          notifications.map(n => (
                            <div 
                              key={n.id} 
                              onClick={() => {
                                markNotifRead(n.id);
                                setCurrentPage("requests");
                                setIsNotifPopoverOpen(false);
                              }}
                              className={`p-3 hover:bg-slate-50 cursor-pointer transition flex items-start space-x-2.5 ${!n.read ? "bg-blue-50/40" : ""}`}
                            >
                              <div className="mt-0.5">
                                {n.type === "success" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                                {n.type === "warning" && <XCircle className="h-4 w-4 text-red-500" />}
                                {n.type === "info" && <Info className="h-4 w-4 text-blue-500" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-slate-800 truncate">{n.title}</p>
                                <p className="text-slate-500 mt-0.5 leading-normal">{n.message}</p>
                                <p className="text-[9px] text-gray-450 mt-1">{new Date(n.timestamp).toLocaleTimeString()}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Account detail profile avatar */}
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 rounded-full bg-slate-900 border border-slate-700 text-white flex items-center justify-center font-bold text-xs">
                    {currentUser.name.split(" ").map(n => n[0]).join("")}
                  </div>
                </div>

              </div>
            </header>

            {/* Sub-Page Content Routing Switch */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6" id="dashboard-content-frame">
              
              {/* PAGE 1: DASHBOARD HUB */}
              {currentPage === "dashboard" && (
                <div className="space-y-6 animate-fade-in" id="dashboard-hub-page">
                  
                  {/* METRIC BOXES ROW */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    
                    <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block">Requests In Hand</span>
                        <span className="text-3xl font-extrabold text-slate-850 mt-1 block">
                          {dashboardMetrics?.metrics?.totalRequestsCount || 0}
                        </span>
                        <span className="text-[10px] text-slate-500 block mt-1.5 font-sans">Across isolated workspace</span>
                      </div>
                      <div className="bg-slate-100 text-slate-700 p-3 rounded-2xl">
                        <FileText className="h-6 w-6" />
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block">Approved Cash Out</span>
                        <InteractiveAmount 
                          amount={dashboardMetrics?.metrics?.approvedValue || 0} 
                          className="text-3xl font-extrabold text-emerald-700 mt-1 block border-b-0 hover:text-emerald-900" 
                        />
                        <span className="text-[10px] text-emerald-600 font-bold block mt-1.5">Authorized & Certified</span>
                      </div>
                      <div className="bg-emerald-50 text-emerald-700 p-3 rounded-2xl">
                        <CheckCircle2 className="h-6 w-6" />
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block">Pending Authorizations</span>
                        <InteractiveAmount 
                          amount={dashboardMetrics?.metrics?.pendingValue || 0} 
                          className="text-3xl font-extrabold text-amber-700 mt-1 block border-b-0 hover:text-amber-900" 
                        />
                        <span className="text-[10px] text-amber-600 block mt-1.5 font-bold">Awaiting executive reviews</span>
                      </div>
                      <div className="bg-amber-50 text-amber-700 p-3 rounded-2xl">
                        <RefreshCw className="h-6 w-6" />
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block">Queried / Clarifications</span>
                        <InteractiveAmount 
                          amount={dashboardMetrics?.metrics?.queriedValue || 0} 
                          className="text-3xl font-extrabold text-blue-700 mt-1 block border-b-0 hover:text-blue-900" 
                        />
                        <span className="text-[10px] text-blue-605 block mt-1.5 font-bold">Forms flagged with review queries</span>
                      </div>
                      <div className="bg-blue-50 text-blue-700 p-3 rounded-2xl">
                        <QueryIcon className="h-6 w-6" />
                      </div>
                    </div>

                  </div>

                  {/* VISUAL ANALYTIC GRAPHICS RECHARTS */}
                  {dashboardMetrics && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      
                      {/* Trend area chart layout */}
                      <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-xs text-slate-800 uppercase tracking-widest font-mono">Monthly Spend Distribution (Approved vs Pending)</span>
                          <span className="text-[10px] text-gray-500">Workspace Code: {currentUser.enterpriseCode}</span>
                        </div>
                        <div className="h-72">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={dashboardMetrics.trendChart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                              <defs>
                                <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                              <Tooltip formatter={(value) => `₹${value?.toLocaleString()}`} />
                              <Legend verticalAlign="top" height={36} iconType="circle" />
                              <Area type="monotone" dataKey="Approved" stroke="#10b981" fillOpacity={1} fill="url(#colorApproved)" strokeWidth={2.5} name="Approved" />
                              <Area type="monotone" dataKey="Pending" stroke="#f59e0b" fillOpacity={1} fill="url(#colorPending)" strokeWidth={2.5} name="Pending Approval" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Spend category allocation pie layout */}
                      <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex flex-col justify-between">
                        <div>
                          <span className="font-extrabold text-xs text-slate-800 uppercase tracking-widest font-mono block">Budget Allocation Specs</span>
                          <span className="text-[10px] text-gray-550 block mt-1">Allocation by categories</span>
                        </div>

                        <div className="h-48 my-2 relative flex items-center justify-center">
                          {dashboardMetrics.categoryChart?.length === 0 ? (
                            <div className="text-gray-400 text-center text-xs">No active records filed yet.</div>
                          ) : (
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={dashboardMetrics.categoryChart}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={50}
                                  outerRadius={75}
                                  paddingAngle={3}
                                  dataKey="value"
                                >
                                  {dashboardMetrics.categoryChart.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip formatter={(value) => `₹${value?.toLocaleString()}`} />
                              </PieChart>
                            </ResponsiveContainer>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          {dashboardMetrics.categoryChart?.map((entry: any, index: number) => (
                            <div key={entry.name} className="flex items-center justify-between text-xs font-semibold text-slate-700">
                              <div className="flex items-center space-x-1.5">
                                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}></span>
                                <span className="truncate max-w-[120px]">{entry.name}</span>
                              </div>
                              <span className="font-mono text-slate-800">₹{entry.value.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  )}

                  {/* QUICK ALERTS / AUDIT LOG SUMMARY PANELS IN DASHBOARD AREA */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Recent audit activity summaries */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <span className="font-extrabold text-xs text-slate-800 uppercase tracking-widest font-mono">Recent Operations Trace</span>
                        <div className="flex items-center space-x-1 text-slate-400">
                          <ShieldCheck className="h-4 w-4" />
                          <span className="text-[10px]">Secure audit logs</span>
                        </div>
                      </div>

                      <div className="space-y-3.5 divide-y divide-slate-50">
                        {requestsList.slice(0, 4).map(r => (
                          <div key={r.id} className="pt-3 first:pt-0 flex items-start justify-between text-xs">
                            <div className="space-y-1">
                              <p className="font-bold text-slate-800">{r.projectName}</p>
                              <p className="text-slate-500 font-semibold">{r.employeeName} ({r.category})</p>
                              <div className="flex items-center space-x-2 text-[10px] text-gray-400 font-mono">
                                <span>ID: {r.id}</span>
                                <span>•</span>
                                <span>Updated: {new Date(r.lastUpdated).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="font-extrabold font-mono text-slate-850 block">₹{r.totalBudget.toLocaleString("en-IN")}</span>
                              <div className="mt-1">
                                {renderRequestStatusBadge(r)}
                              </div>
                            </div>
                          </div>
                        ))}
                        {requestsList.length === 0 && (
                          <div className="p-4 text-center text-gray-400">No active company requests.</div>
                        )}
                      </div>
                    </div>

                    {/* Quick welcome panel and company handbook notes */}
                    <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between">
                      <div className="space-y-2">
                        <span className="p-1 px-2 text-[9px] uppercase font-mono tracking-widest bg-amber-400 text-slate-950 font-extrabold rounded-lg inline-block">Enterprise Sandbox</span>
                        <h3 className="text-xl font-bold tracking-tight">Governance & spend safety constraints active</h3>
                        <p className="text-xs text-slate-300 leading-normal">
                          All financial transactions require a complete audit trail. The company code is set permanently as <strong>{currentUser.enterpriseCode}</strong>. Requests categorized under equipment above ₹50,000 necessitate second level review. Make sure quotes are pre-attached prior to submitting form records.
                        </p>
                      </div>

                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between text-xs font-semibold">
                        <div>
                          <p className="text-slate-400">Your Company Key Code:</p>
                          <p className="text-amber-300 font-mono font-extrabold text-sm tracking-widest mt-0.5">{currentUser.enterpriseCode}</p>
                        </div>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(currentUser.enterpriseCode);
                            alert("Corporate key copied to clipboard!");
                          }} 
                          className="bg-slate-850 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-755 text-white text-[11px] font-bold cursor-pointer"
                        >
                          Copy Invite Key
                        </button>
                      </div>
                    </div>

                  </div>

                </div>
              )}

              {/* PAGE 2: REQUESTS LIST */}
              {currentPage === "requests" && (
                <div className="space-y-6 animate-fade-in" id="requests-list-page">

                  {createdRequestForCV && (
                    <div className="bg-gradient-to-r from-teal-50 to-indigo-50 border-2 border-indigo-200 rounded-2xl p-5 shadow-sm space-y-3 relative animate-fade-in text-slate-800">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl mt-0.5 shadow-sm">
                            <Plus className="h-5 w-5" />
                          </div>
                          <div className="space-y-1">
                            <h4 className="font-extrabold text-sm text-slate-900">
                              ⚡ Auto-Create Linked Cash Voucher?
                            </h4>
                            <p className="text-xs text-slate-600 max-w-xl">
                              You just created <strong>{createdRequestForCV.documentNumber || `PR-${createdRequestForCV.id.substring(0, 5)}`}</strong> ("{createdRequestForCV.projectName}"). 
                              Would you like to instantly generate and submit a linked <strong>Cash Voucher</strong> using this information? Absolutely no extra typing required!
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCreatedRequestForCV(null)}
                          className="p-1.5 hover:bg-slate-200 rounded-full transition cursor-pointer text-slate-400 hover:text-slate-600"
                        >
                          <XCircle className="h-5 w-5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-3 pl-11">
                        <button
                          type="button"
                          onClick={() => handleCreateLinkedCashVoucher(createdRequestForCV)}
                          disabled={loading}
                          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-350 text-white font-extrabold text-xs py-2 px-4 rounded-xl cursor-pointer shadow transition flex items-center gap-1.5"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Yes, Create Cash Voucher for this</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setCreatedRequestForCV(null)}
                          className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs py-2 px-3.5 rounded-xl cursor-pointer transition"
                        >
                          Maybe Later
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* SEARCH / FILTERS STRIP */}
                  <div className="bg-white p-4 rounded-2xl border border-gray-150 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="font-extrabold text-xs text-slate-800 uppercase tracking-widest font-mono">
                      Expenditure submissions
                    </div>

                    <div className="flex items-center space-x-3 w-full md:w-auto">
                      <button 
                        onClick={() => {
                          setEditingRequestId(null);
                          setProjectName("");
                          setCategory("Equipment");
                          setCustomCategory("");
                          resetTravelForm();
                          setRequestItems([]);
                          setFormAttachments([]);
                          setCurrentPage("new-request");
                        }}
                        className="bg-slate-1000 hover:bg-slate-800 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center space-x-1.5 cursor-pointer shadow-md"
                      >
                        <Plus className="h-4 w-4" />
                        <span>File Expenditure Form</span>
                      </button>
                    </div>
                  </div>

                  {/* FORM TABLE / CARD VIEW RENDERER */}
                  <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden">
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        
                        <thead>
                          <tr className="bg-slate-50 text-gray-500 uppercase font-bold text-[10px] tracking-wider border-b border-gray-150">
                            <th className="p-4">Reference ID</th>
                            <th className="p-4">Project / Intent</th>
                            <th className="p-4">Filer Info</th>
                            <th className="p-4">Category</th>
                            <th className="p-4">Sub-total budget</th>
                            <th className="p-4">Form state</th>
                            <th className="p-4">Discussion</th>
                            <th className="p-4 text-right">Review/Modify</th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                          {requestsList.map((r: RequestForm) => (
                            <tr key={r.id} className="hover:bg-slate-50/50 transition">
                              <td className="p-4">
                                <span className="block font-mono text-slate-500 text-[10px]">Ref: {r.id}</span>
                                {r.documentNumber ? (
                                  <span className="inline-block mt-1 bg-indigo-50 text-indigo-750 font-mono text-xs font-black px-2 py-0.5 rounded-lg border border-indigo-200">
                                    {r.documentNumber}
                                  </span>
                                ) : (
                                  <span className="inline-block mt-1 bg-slate-100 text-slate-500 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded">
                                    Assign on Submit
                                  </span>
                                )}
                              </td>
                              <td className="p-4">
                                <p className="font-bold text-slate-900">{r.projectName}</p>
                                <p className="text-gray-450 text-[10px] uppercase font-mono mt-0.5">Filed: {r.submissionDate}</p>
                              </td>
                              <td className="p-4 text-slate-600">
                                <p className="font-bold">{r.employeeName}</p>
                                <p className="text-[10px]">Worker ID: {r.userId}</p>
                              </td>
                              <td className="p-4 text-slate-800">
                                <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-lg border border-slate-200">
                                  {r.category}
                                </span>
                              </td>
                              <td className="p-4 font-mono text-slate-900 font-extrabold">
                                <InteractiveAmount amount={r.totalBudget} />
                              </td>
                              <td className="p-4">
                                {renderRequestStatusBadge(r)}
                              </td>
                              <td className="p-4 text-gray-400 font-sans">
                                {r.comments.length} updates
                              </td>
                              <td className="p-4 text-right">
                                <div className="flex items-center justify-end space-x-1.5">
                                  
                                  <button
                                    type="button"
                                    onClick={() => setActiveRequestDetails(r)}
                                    className="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-lg font-bold transition flex items-center space-x-1 cursor-pointer"
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                    <span>Review panel</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      downloadApprovalPDF(r);
                                    }}
                                    className="p-1 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg font-extrabold transition flex items-center space-x-1 cursor-pointer"
                                    title="Download audit ledger PDF"
                                  >
                                    <Download className="h-3.5 w-3.5" />
                                    <span>Get PDF</span>
                                  </button>

                                  {/* Allowing modifications only if Draft or employee-queried */}
                                  {(r.status === "Draft" || (r.status === "Queried" && currentUser.role === "employee")) && (
                                    <button
                                      onClick={() => handleEditTrigger(r)}
                                      className="p-1 px-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg font-bold transition cursor-pointer"
                                    >
                                      <span>Edit</span>
                                    </button>
                                  )}

                                </div>
                              </td>
                            </tr>
                          ))}
                          {requestsList.length === 0 && (
                            <tr>
                              <td colSpan={8} className="p-8 text-center text-gray-400 leading-normal font-sans">
                                No active company request forms filed yet in segment {currentUser.enterpriseCode}. Filing new expenditure forms will seed records and establish audit timelines here.
                              </td>
                            </tr>
                          )}
                        </tbody>

                      </table>
                    </div>

                  </div>

                </div>
              )}

              {/* PAGE 3: NEW / EDIT REQUEST FORM */}
              {currentPage === "new-request" && (
                <div className="space-y-6 max-w-4xl mx-auto animate-fade-in" id="new-request-creator-page">
                  
                  <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-4">
                    <h3 className="text-lg font-extrabold text-slate-800 tracking-tight border-b border-slate-100 pb-3 uppercase">
                      {editingRequestId ? `Modifying Form Record ${editingRequestId}` : "File New Corporate Expenditure Form"}
                    </h3>

                    {/* Metadata attributes */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Company project reference *</label>
                        <input
                          type="text"
                          placeholder="e.g. Q2 AWS Server Infrastructure"
                          value={projectName}
                          onChange={(e) => setProjectName(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-slate-900 focus:border-slate-950"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Category segregation</label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-white focus:ring-1 focus:ring-slate-900 focus:border-slate-950"
                        >
                          {allCategories.map((catOpt) => (
                            <option key={catOpt} value={catOpt}>
                              {catOpt}
                            </option>
                          ))}
                          <option value="Others">Others (Type custom...)</option>
                        </select>
                      </div>
                    </div>

                     {/* Automatic Category-based Running Document Number Prefix indicator */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-450 tracking-wider block font-mono">Running Document Series Prefix</span>
                        <strong className="text-sm font-mono text-slate-800 mt-1 display-flex items-center gap-2">
                          Category Series: <span className="text-slate-950 bg-slate-200 border border-slate-300 px-2 py-0.5 rounded text-xs font-mono font-extrabold">{getCategoryPrefix(category === "Others" ? (customCategory || "Others") : category)}</span>
                        </strong>
                      </div>
                      <div className="md:text-right">
                        <span className="text-[9px] uppercase font-bold text-slate-450 tracking-wider block font-mono">Series Continuation Pattern</span>
                        <strong className="text-xs font-mono text-slate-600 mt-0.5 block">
                          Next Serial on Submit: <span className="text-slate-950 bg-slate-200 border border-slate-300 px-1.5 py-0.5 rounded font-bold font-mono">{getNextDocumentNoPreview(category === "Others" ? (customCategory || "Others") : category)}</span>
                        </strong>
                      </div>
                    </div>

                    <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-4">
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block font-mono">Single Target Authorization Routing Target</span>
                      
                      <div className="space-y-3">
                        <div className="relative">
                          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Type to search approvers by name, role (e.g. Head, Admin) or department..."
                            value={approverSearchQuery}
                            onChange={(e) => setApproverSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-850 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
                          />
                        </div>

                        <div className="max-h-60 overflow-y-auto space-y-2 pr-1 border border-slate-100 rounded-xl p-2 bg-white">
                          {(() => {
                            const list = [
                              ...departmentHeads.map(u => ({ ...u, displayRole: u.role === "employee" ? "Authorized Approver" : "Department Head", roleLabel: "head" as const })),
                              ...administrators.map(u => ({ ...u, displayRole: "Administrator", roleLabel: "admin" as const })),
                              ...superAdministrators.map(u => ({ ...u, displayRole: "Super Administrator", roleLabel: "superadmin" as const }))
                            ];
                            const q = approverSearchQuery.toLowerCase();
                            const filtered = list.filter(appr => 
                              appr.name.toLowerCase().includes(q) ||
                              appr.displayRole.toLowerCase().includes(q) ||
                              (appr.department && appr.department.toLowerCase().includes(q))
                            );

                            if (filtered.length === 0) {
                              return <div className="text-center py-4 text-xs text-slate-400">No active company authority matching query.</div>;
                            }

                            return filtered.map((appr) => {
                              const isSelected = 
                                (appr.roleLabel === "head" && selectedHeadId === appr.id) ||
                                (appr.roleLabel === "admin" && selectedAdminId === appr.id) ||
                                (appr.roleLabel === "superadmin" && selectedSuperAdminId === appr.id);

                              return (
                                <button
                                  key={appr.id}
                                  type="button"
                                  onClick={() => {
                                    if (appr.roleLabel === "head") {
                                      setSelectedHeadId(appr.id);
                                      setSelectedAdminId("");
                                      setSelectedSuperAdminId("");
                                    } else if (appr.roleLabel === "admin") {
                                      setSelectedHeadId("");
                                      setSelectedAdminId(appr.id);
                                      setSelectedSuperAdminId("");
                                    } else if (appr.roleLabel === "superadmin") {
                                      setSelectedHeadId("");
                                      setSelectedAdminId("");
                                      setSelectedSuperAdminId(appr.id);
                                    }
                                  }}
                                  className={`w-full text-left p-3 rounded-lg flex items-center justify-between text-xs transition border ${
                                    isSelected 
                                      ? "bg-slate-900 border-slate-900 text-white shadow-sm font-semibold" 
                                      : "bg-slate-50/50 border-slate-200 text-slate-700 hover:bg-slate-100"
                                  }`}
                                >
                                  <div>
                                    <div className="font-bold flex items-center gap-1.5 flex-wrap">
                                      <span>{appr.name}</span>
                                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-extrabold uppercase ${
                                        isSelected ? "bg-white/20 text-white border border-white/30" : "bg-slate-200 text-slate-800"
                                      }`}>
                                        {appr.displayRole}
                                      </span>
                                    </div>
                                    <div className={`text-[10px] ${isSelected ? "text-slate-300" : "text-slate-400"} mt-0.5`}>
                                      Employee Code: <span className="font-mono">{appr.employeeCode}</span>
                                      {appr.department && ` | Department: ${appr.department}`}
                                    </div>
                                  </div>
                                  {isSelected ? (
                                    <Check className="h-4 w-4 text-emerald-450 stroke-[3px]" />
                                  ) : (
                                    <div className="h-4 w-4 rounded-full border border-slate-300 bg-white" />
                                  )}
                                </button>
                              );
                            });
                          })()}
                        </div>

                        <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-1 font-sans">
                          <span className="text-amber-600 font-extrabold font-mono">ℹ</span>
                          <span>Bypasses redundant steps and notifies the selected person immediately.</span>
                        </div>
                      </div>
                    </div>

                    {/* Custom Category Input Option */}
                    {category === "Others" && (
                      <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-250 animate-fade-in">
                        <label className="block text-[10px] font-bold text-amber-800 uppercase mb-1">Custom Category Name *</label>
                        <input
                          type="text"
                          placeholder="e.g. Office Entertainment, Medical Wellness"
                          value={customCategory}
                          onChange={(e) => setCustomCategory(e.target.value)}
                          onBlur={(e) => {
                            const trimmed = e.target.value.trim();
                            if (trimmed) {
                              if (!allCategories.includes(trimmed)) {
                                setAdditionalCategories((prev) => [...prev, trimmed]);
                              }
                              setCategory(trimmed);
                              setCustomCategory("");
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const trimmed = customCategory.trim();
                              if (trimmed) {
                                if (!allCategories.includes(trimmed)) {
                                  setAdditionalCategories((prev) => [...prev, trimmed]);
                                }
                                setCategory(trimmed);
                                setCustomCategory("");
                              }
                            }
                          }}
                          className="w-full px-3 py-2 border border-amber-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-amber-500 focus:border-amber-600 bg-white"
                          required
                        />
                        <p className="text-[10px] text-amber-700/80 font-medium mt-1">
                          💡 Tip: Press <strong className="font-bold">Enter</strong> or click outside the box to immediately select and add this custom category to the main dropdown list.
                        </p>
                      </div>
                    )}

                    {/* TRAVEL ADVISORY EXPANSION MODULE */}
                    {isTravel && (
                      <div className="bg-emerald-50/70 border border-emerald-200 p-6 rounded-2xl space-y-6 animate-fade-in shadow-sm">
                        
                        {/* Header metadata */}
                        <div className="flex items-center space-x-2 border-b border-emerald-150 pb-3">
                          <Plane className="h-5 w-5 text-emerald-800" />
                          <span className="font-extrabold text-xs text-emerald-950 uppercase tracking-wider font-mono">Travel Itinerary & Allowance Expense Entry Sheet (Manual Ledger style)</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Train No./Name</label>
                            <input
                              type="text"
                              value={trainNoName}
                              onChange={(e) => setTrainNoName(e.target.value)}
                              placeholder="e.g. 20842 / VANDE BHARAT EXP, RAJDHANI EXPRESS"
                              className="w-full px-3 py-2 border border-slate-250 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-emerald-600 focus:border-emerald-700 bg-white"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Assign to Mill Name and Address (Destination Branch office)</label>
                            <input
                              type="text"
                              value={millNameAddress}
                              onChange={(e) => setMillNameAddress(e.target.value)}
                              placeholder="e.g. NELLIMARLA JUTE MILLS, VISAKHAPATNAM BRANCH"
                              className="w-full px-3 py-2 border border-slate-250 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-emerald-600 focus:border-emerald-700 bg-white"
                            />
                          </div>
                        </div>

                        {/* Interactive spreadsheet table */}
                        <div className="overflow-x-auto border border-emerald-150 rounded-xl bg-white shadow-inner">
                          <table className="w-full text-left text-[11px] border-collapse min-w-[1000px]">
                            <thead>
                              <tr className="bg-emerald-100/80 uppercase font-bold text-[9px] tracking-wider text-emerald-900 border-b border-emerald-200">
                                <th className="p-2.5 border-r border-emerald-200 text-center w-[55px]">Day No</th>
                                <th className="p-2.5 border-r border-emerald-200 w-[120px]">Date</th>
                                <th className="p-2.5 border-r border-emerald-200 w-[130px]">From</th>
                                <th className="p-2.5 border-r border-emerald-200 w-[100px]">Dep. (Time)</th>
                                <th className="p-2.5 border-r border-emerald-200 w-[130px]">To</th>
                                <th className="p-2.5 border-r border-emerald-200 w-[100px]">Arr. (Time)</th>
                                <th className="p-2.5 border-r border-emerald-200 min-w-[160px]">Lodging (If Any) <br/><span className="text-[8px] font-normal lowercase">(Type Description & Cost)</span></th>
                                <th className="p-2.5 border-r border-emerald-200 min-w-[160px]">Food <br/><span className="text-[8px] font-normal lowercase">(Type Description & Cost)</span></th>
                                <th className="p-2.5 border-r border-emerald-200 min-w-[160px]">Type of Conveyance <br/><span className="text-[8px] font-normal lowercase">(Type & Cost)</span></th>
                                <th className="p-2.5 border-r border-emerald-200 text-right w-[100px]">Total (₹)</th>
                                <th className="p-2.5 text-center w-[45px]">Trash</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-emerald-100 font-semibold text-slate-700">
                              {travelItinerary.map((row, idx) => (
                                <tr key={row.id} className="hover:bg-emerald-50/30">
                                  {/* Day */}
                                  <td className="p-2 border-r border-emerald-100 text-center text-xs font-bold font-mono text-emerald-950">
                                    <input 
                                      type="text" 
                                      value={row.day} 
                                      onChange={(e) => updateItineraryRow(row.id, "day", e.target.value)}
                                      className="w-full text-center bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded p-1 font-mono font-bold text-xs"
                                      placeholder={String(idx + 1)}
                                    />
                                  </td>

                                  {/* Date */}
                                  <td className="p-2 border-r border-emerald-100">
                                    <input 
                                      type="date" 
                                      value={row.date} 
                                      onChange={(e) => updateItineraryRow(row.id, "date", e.target.value)}
                                      className="w-full bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded p-1 font-mono text-xs"
                                    />
                                  </td>

                                  {/* From */}
                                  <td className="p-2 border-r border-emerald-100">
                                    <input 
                                      type="text" 
                                      value={row.from} 
                                      onChange={(e) => updateItineraryRow(row.id, "from", e.target.value)}
                                      placeholder="e.g. HOME / HQ"
                                      className="w-full bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded p-1 text-xs"
                                    />
                                  </td>

                                  {/* Departure Time */}
                                  <td className="p-2 border-r border-emerald-100">
                                    <input 
                                      type="text" 
                                      value={row.departureTime} 
                                      onChange={(e) => updateItineraryRow(row.id, "departureTime", e.target.value)}
                                      placeholder="11:30 am"
                                      className="w-full bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded p-1 font-mono text-center text-xs"
                                    />
                                  </td>

                                  {/* To */}
                                  <td className="p-2 border-r border-emerald-100">
                                    <input 
                                      type="text" 
                                      value={row.to} 
                                      onChange={(e) => updateItineraryRow(row.id, "to", e.target.value)}
                                      placeholder="e.g. VIZIANAGARAM"
                                      className="w-full bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded p-1 text-xs"
                                    />
                                  </td>

                                  {/* Arrival Time */}
                                  <td className="p-2 border-r border-emerald-100">
                                    <input 
                                      type="text" 
                                      value={row.arrivalTime} 
                                      onChange={(e) => updateItineraryRow(row.id, "arrivalTime", e.target.value)}
                                      placeholder="3:50 pm"
                                      className="w-full bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded p-1 font-mono text-center text-xs"
                                    />
                                  </td>

                                  {/* Lodging description and cost */}
                                  <td className="p-2 border-r border-emerald-100">
                                    <div className="flex flex-col space-y-1">
                                      <input 
                                        type="text" 
                                        placeholder="e.g. STAY IN MILL" 
                                        value={row.lodgingDesc} 
                                        onChange={(e) => updateItineraryRow(row.id, "lodgingDesc", e.target.value)}
                                        className="w-full bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded p-0.5 text-[11px]"
                                      />
                                      <div className="flex items-center space-x-1 border-t border-dashed border-emerald-150 pt-1">
                                        <span className="text-gray-400">₹</span>
                                        <input 
                                          type="number" 
                                          placeholder="Cost" 
                                          value={row.lodgingCost || ""} 
                                          onChange={(e) => updateItineraryRow(row.id, "lodgingCost", e.target.value)}
                                          className="w-full bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded p-0.5 font-mono text-right text-xs"
                                        />
                                      </div>
                                    </div>
                                  </td>

                                  {/* Food description and cost */}
                                  <td className="p-2 border-r border-emerald-100">
                                    <div className="flex flex-col space-y-1">
                                      <input 
                                        type="text" 
                                        placeholder="e.g. DINNER 150" 
                                        value={row.foodDesc} 
                                        onChange={(e) => updateItineraryRow(row.id, "foodDesc", e.target.value)}
                                        className="w-full bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded p-0.5 text-[11px]"
                                      />
                                      <div className="flex items-center space-x-1 border-t border-dashed border-emerald-150 pt-1">
                                        <span className="text-gray-400">₹</span>
                                        <input 
                                          type="number" 
                                          placeholder="Cost" 
                                          value={row.foodCost || ""} 
                                          onChange={(e) => updateItineraryRow(row.id, "foodCost", e.target.value)}
                                          className="w-full bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded p-0.5 font-mono text-right text-xs"
                                        />
                                      </div>
                                    </div>
                                  </td>

                                  {/* Conveyance type and cost */}
                                  <td className="p-2 border-r border-emerald-100 min-w-[200px]">
                                    <div className="flex flex-col space-y-2">
                                      {(row.conveyances && row.conveyances.length > 0
                                        ? row.conveyances
                                        : [{ id: "c-initial", type: row.conveyanceType || "", cost: Number(row.conveyanceCost) || 0 }]
                                      ).map((cItem, cIdx) => (
                                        <div key={cItem.id || cIdx} className="bg-emerald-50/50 hover:bg-emerald-100/40 p-2 rounded-lg border border-emerald-100/50 space-y-1 group relative transition-all">
                                          <div className="flex items-center justify-between gap-1">
                                            <input 
                                              type="text" 
                                              placeholder="Transport Mode (e.g. Train, Auto)" 
                                              value={cItem.type} 
                                              onChange={(e) => updateConveyanceItem(row.id, cItem.id || "c-initial", "type", e.target.value)}
                                              className="w-full bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded p-0.5 text-[10px] font-bold text-slate-800 placeholder-slate-400"
                                            />
                                            {((row.conveyances && row.conveyances.length > 1) || (!row.conveyances && false)) && (
                                              <button
                                                type="button"
                                                onClick={() => removeConveyanceItem(row.id, cItem.id || "c-initial")}
                                                className="text-red-400 hover:text-red-700 hover:bg-red-50 p-0.5 rounded transition cursor-pointer"
                                                title="Remove transport mode"
                                              >
                                                <Trash2 className="h-3.5 w-3.5" />
                                              </button>
                                            )}
                                          </div>
                                          <div className="flex items-center space-x-1 border-t border-dashed border-emerald-150 pt-1">
                                            <span className="text-gray-400 text-[9px]">₹</span>
                                            <input 
                                              type="number" 
                                              placeholder="Cost" 
                                              value={cItem.cost || ""} 
                                              onChange={(e) => updateConveyanceItem(row.id, cItem.id || "c-initial", "cost", e.target.value)}
                                              className="w-full bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded p-0.5 font-mono text-right text-xs font-semibold text-slate-800"
                                            />
                                          </div>
                                        </div>
                                      ))}
                                      
                                      <button
                                        type="button"
                                        onClick={() => addConveyanceItem(row.id)}
                                        className="w-full py-1 hover:py-1.5 px-2 border-dashed border border-emerald-300 hover:border-emerald-500 rounded-lg text-[9px] font-extrabold text-emerald-800 hover:text-emerald-950 flex items-center justify-center space-x-1 hover:bg-emerald-50 bg-transparent transition cursor-pointer"
                                      >
                                        <Plus className="h-3.5 w-3.5" />
                                        <span>Add Transport Mode</span>
                                      </button>
                                    </div>
                                  </td>

                                  {/* Row Total */}
                                  <td className="p-2 border-r border-emerald-100 text-right font-bold font-mono text-emerald-950 text-xs">
                                    ₹{(row.rowTotal || 0).toLocaleString("en-IN")}
                                  </td>

                                  {/* Delete button */}
                                  <td className="p-2 text-center text-xs">
                                    <button 
                                      type="button"
                                      onClick={() => deleteItineraryRow(row.id)} 
                                      className="text-red-500 hover:text-red-750 p-1 cursor-pointer hover:bg-red-50 rounded"
                                      title="Delete voyage row"
                                    >
                                      <Trash2 className="h-4 w-4 mx-auto" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Button and computed total allowance metrics box */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-emerald-150 shadow-inner">
                          <button
                            type="button"
                            onClick={addItineraryRow}
                            className="bg-emerald-600 hover:bg-emerald-700 border border-emerald-700 text-white rounded-xl text-xs font-bold py-2 px-4 flex items-center space-x-1.5 cursor-pointer shadow-sm transition"
                          >
                            <Plus className="h-4 w-4" />
                            <span>Add Voyage Leg (Day/Segment)</span>
                          </button>
                          
                          <div className="text-right space-y-1">
                            <span className="text-[10px] text-gray-500 block font-bold uppercase tracking-wider font-mono">Total Travel Expense (Manual Sum)</span>
                            <span className="text-lg font-black text-slate-900 font-mono bg-amber-500/10 px-4 py-1.5 rounded-lg border border-amber-250 block">
                              ₹{travelItinerary.reduce((total, r) => total + (r.rowTotal || 0), 0).toLocaleString("en-IN")}
                            </span>
                          </div>
                        </div>

                        {/* Financial summary: Advance & Settlement */}
                        <div className="bg-white p-5 rounded-xl border border-emerald-150 space-y-4">
                          <span className="font-extrabold text-[10px] uppercase text-emerald-900 tracking-wider font-mono block border-b border-dashed border-emerald-150 pb-1.5">Corporate Settlements & Advances Records</span>
                          
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-semibold">
                            <div>
                              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Advance Taken/Returned (₹)</label>
                              <input
                                type="number"
                                value={advanceAmount || ""}
                                onChange={(e) => setAdvanceAmount(Number(e.target.value) || 0)}
                                placeholder="0"
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-emerald-600 bg-white text-right font-mono text-emerald-900 font-bold"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Advance Date</label>
                              <input
                                type="date"
                                value={advanceDate}
                                onChange={(e) => setAdvanceDate(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-emerald-600 bg-white font-mono"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Balanced returned to HO (₹)</label>
                              <input
                                type="number"
                                value={balanceReturnedHO || ""}
                                onChange={(e) => setBalanceReturnedHO(Number(e.target.value) || 0)}
                                placeholder="0"
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-emerald-600 bg-white text-right font-mono text-teal-800"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Balanced paid to Traveler (₹)</label>
                              <input
                                type="number"
                                value={balancePaidToTraveler || ""}
                                onChange={(e) => setBalancePaidToTraveler(Number(e.target.value) || 0)}
                                placeholder="0"
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-emerald-600 bg-white text-right font-mono text-indigo-805"
                              />
                            </div>
                          </div>
                        </div>

                      </div>
                    )}

                    {/* ITEMIZER MODULE (ADD / REMOVE ITEMS LIST) */}
                    {!isTravel && (
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4" id="expenditure-itemizer">
                        <span className="font-extrabold text-xs text-slate-800 uppercase tracking-widest font-mono block">Line Item Specifications *</span>
                        
                        {/* Active items table */}
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-white uppercase font-bold text-[9px] tracking-wider text-slate-500 border border-slate-205">
                              <th className="p-2 border-r border-slate-205">Description record</th>
                              <th className="p-2 border-r border-slate-205 text-center">Qty</th>
                              <th className="p-2 border-r border-slate-205 text-right">Unit Net (₹)</th>
                              <th className="p-2 border-r border-slate-205 text-center">GST Tax %</th>
                              <th className="p-2 text-right">Row Total (₹)</th>
                              <th className="p-2 text-center text-red-500">Trash</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 font-semibold text-slate-700 bg-white border border-slate-205">
                            {requestItems.map((item, idx) => (
                              <tr key={item.id} className="hover:bg-slate-50/50">
                                <td className="p-2 border-r border-slate-205">{item.description}</td>
                                <td className="p-2 border-r border-slate-205 text-center font-mono">{item.quantity}</td>
                                <td className="p-2 border-r border-slate-205 text-right font-mono">₹{item.unitPrice.toLocaleString("en-IN")}</td>
                                <td className="p-2 border-r border-slate-205 text-center font-mono">{item.taxPercent}%</td>
                                <td className="p-2 text-right font-mono text-slate-900">₹{(item.total || item.quantity * item.unitPrice * (1 + item.taxPercent/100)).toLocaleString("en-IN")}</td>
                                <td className="p-2 text-center">
                                  <button 
                                    onClick={() => removeItemRow(item.id)} 
                                    className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                                    title="Delete item"
                                  >
                                    <Trash2 className="h-4 w-4 mx-auto" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                            {requestItems.length === 0 && (
                              <tr>
                                <td colSpan={6} className="p-4 text-center text-gray-400">Specify line items below to verify financial aggregates.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>

                        {/* Row adder inputs */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-white p-3 rounded-xl border border-slate-200">
                          <div className="md:col-span-5">
                            <label className="block text-[9px] font-bold text-gray-500 uppercase mb-0.5">Item specification text</label>
                            <input
                              type="text"
                              placeholder="e.g. AWS r5b.4xlarge EC2 Compute Instances"
                              value={itemDesc}
                              onChange={(e) => setItemDesc(e.target.value)}
                              className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-[9px] font-bold text-gray-500 uppercase mb-0.5">Quantity</label>
                            <input
                              type="number"
                              min={1}
                              value={itemQty}
                              onChange={(e) => setItemQty(Math.max(1, Number(e.target.value)))}
                              className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-mono text-center"
                            />
                          </div>

                          <div className="md:col-span-3">
                            <label className="block text-[9px] font-bold text-gray-500 uppercase mb-0.5">Unit Net Price (₹)</label>
                            <input
                              type="number"
                              placeholder="Unit cost in rupees"
                              value={itemPrice}
                              onChange={(e) => setItemPrice(Math.max(0, Number(e.target.value)))}
                              className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-mono text-right"
                            />
                          </div>

                          <div className="md:col-span-1">
                            <label className="block text-[9px] font-bold text-gray-500 uppercase mb-0.5">GST %</label>
                            <select
                              value={itemTax}
                              onChange={(e) => setItemTax(Number(e.target.value))}
                              className="w-full px-1.5 py-1.5 border border-slate-200 rounded-lg text-xs font-mono bg-white"
                            >
                              <option value={0}>0%</option>
                              <option value={5}>5%</option>
                              <option value={12}>12%</option>
                              <option value={18}>18%</option>
                              <option value={28}>28%</option>
                            </select>
                          </div>

                          <button
                            type="button"
                            onClick={addItemRow}
                            className="md:col-span-1 bg-slate-900 border border-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold py-1 px-2.5 flex items-center justify-center cursor-pointer"
                          >
                            Add Row
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ATTACHMENT LIST MODULE */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-slate-800 uppercase tracking-widest font-mono">Receipt quotes & documents</span>
                        <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">Secure ISO Storage</span>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {formAttachments.map((f, idx) => {
                          const hasPipe = f.includes('|');
                          const name = hasPipe ? f.split('|')[0] : f;
                          const dataUrl = hasPipe ? f.split('|').slice(1).join('|') : null;

                          return (
                            <div key={idx} className="flex items-center space-x-2 bg-slate-100 text-slate-850 p-1.5 px-3 rounded-lg border border-slate-200 font-mono text-[10px] shadow-sm animate-fade-in hover:bg-slate-150">
                              <File className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                              {dataUrl ? (
                                <a 
                                  href={dataUrl} 
                                  download={name}
                                  className="truncate max-w-[180px] hover:text-[#047857] hover:underline font-bold transition"
                                  onClick={(e) => e.stopPropagation()}
                                  title="Click to preview/download"
                                >
                                  {name}
                                </a>
                              ) : (
                                <span className="truncate max-w-[180px]">{name}</span>
                              )}
                              <button 
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFormAttachments(formAttachments.filter((_, i) => i !== idx));
                                }}
                                className="text-red-500 hover:text-red-700 transition" 
                                title="Delete attachment"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      {/* Interactive Drag & Drop Box */}
                      <div 
                        id="drop-target-area"
                        className={`border-2 border-dashed rounded-xl p-5 text-center flex flex-col items-center justify-center cursor-pointer transition ${
                          isDragging 
                            ? "border-emerald-500 bg-emerald-50/20 text-emerald-800 scale-[1.01]" 
                            : "border-slate-200 hover:border-slate-350 bg-slate-50/50 hover:bg-slate-50 text-slate-650"
                        }`}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDragging(true);
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDragging(false);
                          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                            processFiles(e.dataTransfer.files);
                          }
                        }}
                        onClick={() => {
                          const fileInput = document.getElementById("attachment-file-input");
                          if (fileInput) (fileInput as HTMLInputElement).click();
                        }}
                      >
                        <input 
                          type="file"
                          id="attachment-file-input"
                          className="hidden"
                          multiple
                          accept="image/png, image/jpeg, image/jpg, image/webp, image/heic, image/heif, application/pdf"
                          onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              processFiles(e.target.files);
                            }
                          }}
                        />
                        <Upload className="h-6 w-6 text-slate-400 mb-2 animate-bounce" />
                        <p className="text-xs font-bold text-slate-700">
                          Drop a file here or <span className="text-emerald-700 underline decoration-2">select a file</span>
                        </p>
                        <p className="text-[10px] text-slate-450 font-mono mt-1">Supports PDF, PNG, JPEG, WEBP, HEIC (Max 15MB - mobile optimized)</p>
                      </div>

                      {/* Optional Name Link entry */}
                      <div className="flex items-center space-x-2 pt-1">
                        <input
                          type="text"
                          placeholder="Or type quote URL/doc name (e.g. Quotation.pdf)..."
                          value={newAttachmentName}
                          onChange={(e) => setNewAttachmentName(e.target.value)}
                          className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-mono w-full focus:ring-1 focus:ring-slate-900 focus:border-slate-950"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            addAttachment();
                          }}
                          className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 shadow-sm cursor-pointer"
                        >
                          Add Link
                        </button>
                      </div>
                    </div>

                    {/* FINANCIAL SUMMARIES SPECS ACCORD */}
                    <div className="border-t border-slate-100 pt-4 flex flex-col md:flex-row md:justify-between items-start md:items-center gap-4">
                      
                      {/* Left: display aggregate */}
                      <div className="space-y-1 font-semibold text-slate-700 text-xs">
                        <p>Subtotal value net of tax: <strong className="font-mono text-slate-900 font-normal">₹{currentPreview.net.toLocaleString("en-IN")}</strong></p>
                        <p>Computed tax aggregates (CGST + SGST): <strong className="font-mono text-slate-900 font-normal">₹{currentPreview.tax.toLocaleString("en-IN")}</strong></p>
                        <p className="text-sm font-bold">Total Budget request inclusive of taxes: <span className="font-mono text-slate-1000 font-extrabold font-bold uppercase">₹{currentPreview.grand.toLocaleString("en-IN")}</span></p>
                      </div>

                      {/* Right: Submits decision keys */}
                      <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
                        
                        <button
                          type="button"
                          onClick={() => saveRequestForm(true)}
                          className="bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-800 font-bold py-2 px-5 rounded-xl text-xs transition cursor-pointer"
                        >
                          Save Draft Locally
                        </button>

                        <button
                          type="button"
                          onClick={() => saveRequestForm(false)}
                          className="bg-slate-950 hover:bg-slate-900 border border-slate-950 text-white font-bold py-2 px-6 rounded-xl text-xs transition shadow cursor-pointer"
                        >
                          Submit Approval
                        </button>

                      </div>

                    </div>

                  </div>

                </div>
              )}

              {/* PAGE: CASH VOUCHER FORM CREATOR */}
              {currentPage === "cash-voucher" && (
                <div className="space-y-6 max-w-4xl mx-auto animate-fade-in" id="cash-voucher-creator-page">
                  
                  {/* Automatic Category-based Running Document Number Prefix indicator for Cash Vouchers */}
                  <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 flex flex-col md:flex-row md:items-center md:justify-between gap-2 max-w-3xl mx-auto">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider block font-mono">Continuous Document Number Sequence</span>
                      <strong className="text-xs font-mono text-slate-800 mt-1 block">
                        Category Series: <span className="text-emerald-950 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded text-xs font-mono font-extrabold">CV (Cash Voucher)</span>
                      </strong>
                    </div>
                    <div className="md:text-right">
                      <span className="text-[9px] uppercase font-bold text-emerald-800 tracking-wider block font-mono font-semibold">Automatic Dynamic Next Serial</span>
                      <strong className="text-xs font-mono text-emerald-900 mt-0.5 block">
                        {cvVoucherNo || getNextDocumentNoPreview("Cash Voucher")} (Continuous enterprise-wise numbering lock)
                      </strong>
                    </div>
                  </div>

                  {/* Step indicators */}
                  <div className="flex items-center justify-center space-x-4 mb-4">
                    <button 
                      onClick={() => setCvStep(1)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${cvStep === 1 ? 'bg-emerald-850 text-white shadow' : 'bg-white text-slate-600 border border-slate-200'}`}
                    >
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/25 text-[10px]">1</span>
                      <span>Page 1: Cash Voucher Format</span>
                    </button>
                    <div className="w-12 h-[2px] bg-slate-200"></div>
                    <button 
                      onClick={() => {
                        if (!cvDebitTo.trim() || !cvAmount || !cvExpenseDetails.trim()) {
                          alert("Please fill in Expenses Head, Amount, and Kind of Expenses on Page 1 first.");
                          return;
                        }
                        setCvStep(2);
                      }}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${cvStep === 2 ? 'bg-emerald-850 text-white shadow' : 'bg-white text-slate-600 border border-slate-200'}`}
                    >
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/25 text-[10px]">2</span>
                      <span>Page 2: Bill Upload & Proof</span>
                    </button>
                  </div>

                  {cvStep === 1 ? (
                    // Page 1: Cash Voucher Format design
                    <div className="bg-[#fcfbf9] p-8 md:p-12 rounded-3xl border border-amber-300 shadow-md max-w-3xl mx-auto space-y-6 relative overflow-hidden" style={{ backgroundImage: "radial-gradient(#e5e7eb 1px, transparent 1px)", backgroundSize: "24px 24px" }}>
                      
                      {/* Decorative elements to give "paper" feel */}
                      <div className="absolute top-0 left-0 right-0 h-2 bg-emerald-700"></div>
                      
                      {/* Top serial, logo, date row */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between border-b-2 border-slate-900 pb-4">
                        <div className="flex items-center space-x-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                          <span className="font-mono text-[10px] font-bold text-slate-500 uppercase">No.</span>
                          <span className="text-red-700 font-mono text-xs font-black bg-white px-2.5 py-0.5 border border-red-200 rounded">
                            {cvVoucherNo || getNextDocumentNoPreview("Cash Voucher")}
                          </span>
                          <span className="text-[9px] text-emerald-650 font-bold font-mono">✓ Continuous Auto-Lock</span>
                        </div>
                        
                        <div className="text-center my-2 md:my-0">
                          <h2 className="text-xl md:text-2xl font-serif font-black tracking-tight text-slate-800 uppercase">
                            {currentUser?.enterpriseName || "PROFLOW ENTERPRISE"}
                          </h2>
                          <div className="inline-block mt-1 font-mono text-xs tracking-widest font-extrabold uppercase border-b-2 border-double border-slate-800 px-4 text-slate-705 bg-amber-50">
                            CASH VOUCHER
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] uppercase font-mono font-bold text-slate-500">Date</span>
                          <input 
                            type="text" 
                            placeholder="DD / MM / YY"
                            value={cvFileNo}
                            onChange={(e) => setCvFileNo(e.target.value)}
                            className="bg-transparent text-right border-b border-dashed border-slate-800 font-mono text-xs font-bold w-28 focus:outline-none focus:border-emerald-650 focus:ring-0"
                          />
                        </div>
                      </div>

                      {/* Expenses Head Row */}
                      <div className="flex flex-col md:flex-row md:items-baseline space-y-2 md:space-y-0 md:space-x-4 pt-4">
                        <label className="font-serif text-lg font-black text-slate-900 shrink-0">Expenses Head:</label>
                        <div className="flex-1 flex gap-2 items-center">
                          <select 
                            value={cvDebitTo}
                            onChange={(e) => {
                              if (e.target.value === "__ADD_CUSTOM__") {
                                setShowAddCustomExpenseHeadModal(true);
                              } else {
                                setCvDebitTo(e.target.value);
                              }
                            }}
                            className="flex-1 bg-transparent border-b border-slate-350 text-sm font-serif italic text-emerald-950 focus:outline-none focus:border-slate-900 py-1 cursor-pointer bg-emerald-50/10 mr-1"
                            required
                          >
                            <option value="">-- Choose Expense Head --</option>
                            
                            {/* Standard options */}
                            <optgroup label="Standard Expense Heads" className="not-italic font-sans font-semibold text-slate-700 bg-white">
                              {DEFAULT_CV_EXPENSE_HEADS.map((opt) => (
                                <option key={opt} value={opt} className="not-italic font-sans text-slate-900">
                                  {opt}
                                </option>
                              ))}
                            </optgroup>

                            {/* Custom enterprise options */}
                            {customCvExpenseHeads && customCvExpenseHeads.length > 0 && (
                              <optgroup label="Custom Enterprise Heads" className="not-italic font-sans font-semibold text-slate-700 bg-white">
                                {customCvExpenseHeads.map((head: any) => (
                                  <option key={head.id} value={head.name} className="not-italic font-sans text-slate-900">
                                    {head.name}
                                  </option>
                                ))}
                              </optgroup>
                            )}

                            {/* Custom trigger option */}
                            <optgroup label="Actions" className="not-italic font-sans font-bold text-indigo-700 bg-slate-50">
                              <option value="__ADD_CUSTOM__" className="not-italic font-sans font-bold text-indigo-700">
                                ➕ Add Custom Expense Head (+ custom)
                              </option>
                            </optgroup>
                          </select>
                        </div>
                      </div>

                      {/* Kind of Expenses Rows */}
                      <div className="space-y-2">
                        <div className="flex items-baseline space-x-2">
                          <label className="text-xs uppercase font-serif font-black text-slate-650 shrink-0">kind of expenses:</label>
                          <span className="text-[10px] text-slate-400 font-mono">(explain purpose, quantities, details)</span>
                        </div>
                        <div className="relative">
                          <textarea 
                            rows={3}
                            placeholder="Being the amount paid for..."
                            value={cvExpenseDetails}
                            onChange={(e) => setCvExpenseDetails(e.target.value)}
                            className="w-full bg-transparent border-0 border-b border-dashed border-slate-300 focus:border-slate-800 focus:ring-0 text-xs font-serif leading-8 italic text-slate-900 resize-none py-1 focus:outline-none"
                            style={{ lineHeight: "2rem" }}
                            required
                          />
                        </div>
                      </div>

                      {/* Incurred By Row */}
                      <div className="flex flex-col md:flex-row md:items-baseline space-y-2 md:space-y-0 md:space-x-4">
                        <label className="text-xs uppercase font-serif font-black text-slate-650 shrink-0">Incurred By Mr. / Ms.:</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Aklu Rajak"
                          value={cvIncurredBy}
                          onChange={(e) => setCvIncurredBy(e.target.value)}
                          className="flex-1 bg-transparent border-b border-slate-350 text-xs font-serif italic text-slate-800 focus:outline-none focus:border-slate-900 py-1"
                          required
                        />
                      </div>

                      {/* Amount grids */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-200">
                        {/* Numerical field */}
                        <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 flex items-center col-span-1">
                          <span className="font-serif text-xl font-extrabold text-emerald-850 mr-3 animate-pulse">Rs.</span>
                          <input 
                            type="number" 
                            placeholder="Enter amount (e.g., 280)"
                            value={cvAmount}
                            onChange={(e) => {
                              const v = e.target.value === "" ? "" : Number(e.target.value);
                              setCvAmount(v);
                              if (typeof v === "number" && v > 0) {
                                const w = numberToWords(v);
                                setCvAmountInWords(w ? w.charAt(0).toUpperCase() + w.slice(1) + " only" : "");
                              } else {
                                setCvAmountInWords("");
                              }
                            }}
                            className="bg-transparent text-lg font-mono font-black text-emerald-950 w-full focus:outline-none border-b-2 border-dashed border-slate-400 focus:border-emerald-700 py-1"
                            required
                          />
                        </div>

                        {/* Text amount field */}
                        <div className="flex flex-col justify-end space-y-1">
                          <label className="text-[10px] uppercase font-mono font-bold text-slate-400">Rupees (In words)</label>
                          <textarea 
                            rows={2}
                            placeholder="e.g. Two hundred eighty only"
                            value={cvAmountInWords}
                            onChange={(e) => setCvAmountInWords(e.target.value)}
                            className="w-full bg-transparent border-b border-dashed border-slate-350 focus:border-slate-800 text-xs font-serif italic text-slate-800 resize-none py-1 focus:outline-none focus:ring-0 leading-relaxed font-semibold"
                          />
                        </div>
                      </div>

                      {/* Checked by / Authorised by row */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8 border-t-2 border-double border-slate-400 text-[10px] font-sans font-bold text-slate-500">
                        <div className="space-y-2">
                          <label className="block uppercase tracking-wider">Checked by</label>
                          <input 
                            type="text" 
                            placeholder="Initials / Name" 
                            value={cvCheckedBy}
                            onChange={(e) => setCvCheckedBy(e.target.value)}
                            className="w-full bg-transparent border-b border-slate-300 text-xs font-mono font-medium focus:outline-none focus:border-slate-900 py-1"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block uppercase tracking-wider">Prepared By / Authorised By</label>
                          <input 
                            type="text" 
                            placeholder="Initials / Name" 
                            value={cvAuthorisedBy}
                            onChange={(e) => setCvAuthorisedBy(e.target.value)}
                            className="w-full bg-transparent border-b border-slate-300 text-xs font-mono font-medium focus:outline-none focus:border-slate-900 py-1"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block uppercase tracking-wider">Received Payment</label>
                          <input 
                            type="text" 
                            placeholder="Initials / Signature" 
                            value={cvReceivedPaymentBy}
                            onChange={(e) => setCvReceivedPaymentBy(e.target.value)}
                            className="w-full bg-transparent border-b border-slate-300 text-xs font-mono font-medium focus:outline-none focus:border-slate-900 py-1"
                          />
                        </div>
                      </div>

                      {/* Approval routing target with searchable list */}
                      <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 mt-6 space-y-4 font-sans text-left">
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block font-mono">Routing of Cash Voucher for approval</span>
                        
                        <div className="space-y-3">
                          <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <input
                              type="text"
                              placeholder="Type to search approvers by name, role, or department..."
                              value={approverSearchQuery}
                              onChange={(e) => setApproverSearchQuery(e.target.value)}
                              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-850 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 animate-none"
                            />
                          </div>

                          <div className="max-h-52 overflow-y-auto space-y-2 pr-1 border border-slate-200 rounded-xl p-2 bg-white">
                            {(() => {
                              const list = [
                                ...departmentHeads.map(u => ({ ...u, displayRole: u.role === "employee" ? "Authorized Approver" : "Department Head", roleLabel: "head" as const })),
                                ...administrators.map(u => ({ ...u, displayRole: "Administrator", roleLabel: "admin" as const })),
                                ...superAdministrators.map(u => ({ ...u, displayRole: "Super Administrator", roleLabel: "superadmin" as const }))
                              ];
                              const q = approverSearchQuery.toLowerCase();
                              const filtered = list.filter(appr => 
                                appr.name.toLowerCase().includes(q) ||
                                appr.displayRole.toLowerCase().includes(q) ||
                                (appr.department && appr.department.toLowerCase().includes(q))
                              );

                              if (filtered.length === 0) {
                                return <div className="text-center py-4 text-xs text-slate-400">No active company authority matching query.</div>;
                              }

                              return filtered.map((appr) => {
                                const isSelected = 
                                  (appr.roleLabel === "head" && selectedHeadId === appr.id) ||
                                  (appr.roleLabel === "admin" && selectedAdminId === appr.id) ||
                                  (appr.roleLabel === "superadmin" && selectedSuperAdminId === appr.id);

                                return (
                                  <button
                                    key={appr.id}
                                    type="button"
                                    onClick={() => {
                                      if (appr.roleLabel === "head") {
                                        setSelectedHeadId(appr.id);
                                        setSelectedAdminId("");
                                        setSelectedSuperAdminId("");
                                      } else if (appr.roleLabel === "admin") {
                                        setSelectedHeadId("");
                                        setSelectedAdminId(appr.id);
                                        setSelectedSuperAdminId("");
                                      } else if (appr.roleLabel === "superadmin") {
                                        setSelectedHeadId("");
                                        setSelectedAdminId("");
                                        setSelectedSuperAdminId(appr.id);
                                      }
                                    }}
                                    className={`w-full text-left p-3 rounded-lg flex items-center justify-between text-xs transition border ${
                                      isSelected 
                                        ? "bg-slate-900 border-slate-900 text-white shadow-sm font-semibold" 
                                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                                    }`}
                                  >
                                    <div>
                                      <div className="font-bold flex items-center gap-1.5 flex-wrap">
                                        <span>{appr.name}</span>
                                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-extrabold uppercase ${
                                          isSelected ? "bg-white/20 text-white border border-white/30" : "bg-slate-200 text-slate-800"
                                        }`}>
                                          {appr.displayRole}
                                        </span>
                                      </div>
                                      <div className={`text-[10px] ${isSelected ? "text-slate-300" : "text-slate-400"} mt-0.5`}>
                                        Code: <span className="font-mono">{appr.employeeCode}</span>
                                        {appr.department && ` | Department: ${appr.department}`}
                                      </div>
                                    </div>
                                    {isSelected ? (
                                      <Check className="h-4 w-4 text-emerald-450 stroke-[3px]" />
                                    ) : (
                                      <div className="h-4 w-4 rounded-full border border-slate-300 bg-white" />
                                    )}
                                  </button>
                                );
                              });
                            })()}
                          </div>

                          <div className="flex items-center justify-between pt-2">
                            <span className="text-[10px] text-slate-400 font-sans italic flex items-center gap-1">
                              <span className="text-amber-500 font-bold font-mono">ℹ</span>
                              Allows direct or phased approvals cleanly
                            </span>
                            
                            <button
                              type="button"
                              onClick={() => {
                                if (!cvDebitTo.trim() || !cvAmount || !cvExpenseDetails.trim()) {
                                  alert("Please fill in Expenses Head, Amount, and Kind of Expenses on Page 1 first.");
                                  return;
                                }
                                setCvStep(2);
                              }}
                              className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-2 px-4 rounded-xl flex items-center space-x-1.5 transition whitespace-nowrap shadow-sm"
                            >
                              <span>Next Page: Proof & Bill</span>
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                    </div>
                  ) : (
                    // Page 2: Upload Proof design
                    <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-150 shadow-md max-w-3xl mx-auto space-y-6">
                      <div className="space-y-1 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest font-mono">Page 2: Supporting Document/Bill Proof</h4>
                        <p className="text-[11px] text-slate-500">Provide receipts, invoices, or manual quotations corresponding to the Rs. {cvAmount}/- amount claimed.</p>
                      </div>

                      {/* Simulated drag & drop area */}
                      <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center bg-slate-50 hover:bg-slate-50/50 transition relative">
                        <input 
                          type="file" 
                          id="proof-file-upload" 
                          accept="image/png, image/jpeg, image/jpg, image/webp, image/heic, image/heif, application/pdf"
                          className="absolute inset-0 opacity-0 cursor-pointer" 
                          onChange={async (e) => {
                            if (e.target.files && e.target.files[0]) {
                              const file = e.target.files[0];
                              setAppError("");
                              setAppSuccess("⏳ Processing, converting and compressing your Cash Voucher proof... Please wait.");
                              try {
                                const result = await processAndValidateFile(file);
                                setCvBillFileName(result.name);
                                setCvBillFileContent(result.content);
                                setAppSuccess(`Successfully processed and attached cash voucher proof: ${result.name}`);
                                setTimeout(() => setAppSuccess(""), 4500);
                              } catch (err: any) {
                                console.error("Cash Voucher upload failure:", err);
                                setAppError(err.message || "Failed to process the uploaded proof document.");
                                setAppSuccess("");
                              }
                            }
                          }}
                        />
                        <div className="space-y-2">
                          <Upload className="h-8 w-8 text-slate-400 mx-auto animate-pulse" />
                          <p className="text-xs font-bold text-slate-700">Drag and drop receipts or click to select files</p>
                          <p className="text-[10px] text-slate-500">Supports PDF, PNG, JPG, JPEG, WEBP, HEIC (Max 15MB - mobile optimized)</p>
                        </div>
                      </div>

                      {/* If file uploaded, show preview / information */}
                      {cvBillFileName && (
                        <div className="p-4 bg-emerald-50/70 border border-emerald-150 rounded-xl flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="p-2.5 bg-emerald-600 text-white rounded-lg">
                              <File className="h-5 w-5" />
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-xs font-bold text-slate-850 truncate max-w-[200px]">{cvBillFileName}</p>
                              <span className="text-[10px] text-emerald-800 font-mono font-medium">Uploaded Securely</span>
                            </div>
                          </div>
                          <button 
                            type="button"
                            onClick={() => {
                              setCvBillFileName("");
                              setCvBillFileContent("");
                            }}
                            className="text-red-500 hover:text-red-700 text-xs font-bold font-mono uppercase tracking-wider"
                          >
                            Remove
                          </button>
                        </div>
                      )}

                      {/* Supplementary bill Details to match page 2 screenshot */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-4">
                        <span className="text-[10px] font-extrabold uppercase text-slate-500 font-mono tracking-wider block">Confirm Bill Particulars (Yacoob Mullick & Son Style)</span>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-semibold">
                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Bill Date</label>
                            <input 
                              type="date"
                              value={cvBillDate}
                              onChange={(e) => setCvBillDate(e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Particulars / items</label>
                            <input 
                              type="text"
                              placeholder="e.g. 200 pcs envelope"
                              value={cvBillParticulars}
                              onChange={(e) => setCvBillParticulars(e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Rate / Cost</label>
                            <input 
                              type="text"
                              placeholder="e.g., 280"
                              value={cvBillRate}
                              onChange={(e) => {
                                setCvBillRate(e.target.value);
                                const numericVal = Number(e.target.value) || 0;
                                setCvBillAmount(numericVal);
                              }}
                              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                            />
                          </div>
                        </div>

                        {/* Bill Amount Validation matches */}
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100 text-xs">
                          <span className="text-slate-650 font-bold">Voucher Claim vs Bill Verification Status:</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-[11px] font-mono text-slate-700 bg-slate-150 px-2 py-0.5 rounded">Claim: Rs. {cvAmount}</span>
                            <span className="text-slate-400">➔</span>
                            <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-bold">Bill: Rs. {cvBillAmount || cvAmount}</span>
                            {Number(cvAmount) === Number(cvBillAmount || cvAmount) ? (
                              <span className="text-[10px] px-2 py-0.5 bg-emerald-600 text-white rounded font-bold uppercase shrink-0">✓ Matches</span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 bg-amber-500 text-white rounded font-bold uppercase shrink-0">Mismatch</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Quick layout reference of page 2 */}
                      <div className="bg-slate-100/60 p-4 rounded-xl border border-dashed border-slate-200 flex items-center space-x-3 text-xs leading-normal">
                        <div className="p-2 bg-slate-200 rounded-full shrink-0">
                          <HelpCircle className="h-4 w-4 text-slate-700" />
                        </div>
                        <p className="text-slate-600 font-medium">💡 Quick Help: The proof serves as audit protection. The system stores both files alongside authorization logs to guarantee regulatory compliance with enterprise auditing norms.</p>
                      </div>

                      {/* Action Triggers */}
                      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <button 
                          type="button"
                          onClick={() => setCvStep(1)}
                          className="px-5 py-2.5 bg-slate-100 hover:bg-slate-201 text-slate-700 font-extrabold text-xs rounded-xl transition"
                        >
                          Back to Page 1
                        </button>
                        <button 
                          type="button"
                          onClick={saveCashVoucherForm}
                          disabled={loading}
                          className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl transition shadow flex items-center space-x-2 cursor-pointer"
                        >
                          {loading ? (
                            <span>Submitting Cash Voucher...</span>
                          ) : (
                            <>
                              <Send className="h-4 w-4" />
                              <span>Submit Cash Voucher for Authorization</span>
                            </>
                          )}
                        </button>
                      </div>

                    </div>
                  )}

                </div>
              )}

              {/* PAGE: TRAVEL EXPENSES FORM CREATOR */}
              {currentPage === "travel-expenses" && (
                <div className="space-y-6 max-w-4xl mx-auto animate-fade-in" id="travel-expenses-creator-page">
                  
                  {/* Automatic Category-based Running Document Number Prefix indicator for Travel Expenses */}
                  <div className="bg-teal-50/50 p-4 rounded-2xl border border-teal-100 flex flex-col md:flex-row md:items-center md:justify-between gap-2 max-w-3xl mx-auto">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-teal-850 tracking-wider block font-mono">Continuous Document Number Sequence</span>
                      <strong className="text-xs font-mono text-slate-800 mt-1 block">
                        Category Series: <span className="text-teal-950 bg-teal-100 border border-teal-200 px-2 py-0.5 rounded text-xs font-mono font-extrabold">TE (Travel Expenses)</span>
                      </strong>
                    </div>
                    <div className="md:text-right">
                      <span className="text-[9px] uppercase font-bold text-teal-850 tracking-wider block font-mono font-semibold">Automatic Dynamic Next Serial</span>
                      <strong className="text-xs font-mono text-teal-900 mt-0.5 block">
                        {teVoucherNo || getNextDocumentNoPreview("Travel Expenses")} (Continuous enterprise-wise numbering lock)
                      </strong>
                    </div>
                  </div>

                  {/* Step indicators */}
                  <div className="flex items-center justify-center space-x-4 mb-4">
                    <button 
                      onClick={() => setTeStep(1)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${teStep === 1 ? 'bg-teal-950 text-white shadow' : 'bg-white text-slate-600 border border-slate-200'}`}
                    >
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-teal-500/25 text-[10px]">1</span>
                      <span>Page 1: Travelling Expenses Layout</span>
                    </button>
                    <div className="w-12 h-[2px] bg-slate-200"></div>
                    <button 
                      onClick={() => {
                        if (!teFilerName.trim() || !teDetails.trim()) {
                          alert("Please fill in Name and Purpose details on Page 1 first.");
                          return;
                        }
                        setTeStep(2);
                      }}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${teStep === 2 ? 'bg-teal-950 text-white shadow' : 'bg-white text-slate-600 border border-slate-200'}`}
                    >
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-teal-500/25 text-[10px]">2</span>
                      <span>Page 2: Bill Upload & Proof</span>
                    </button>
                  </div>

                  {teStep === 1 ? (
                    /* Page 1: Paper layout rendering */
                    <div className="space-y-6">
                      
                      <div className="bg-white p-6 md:p-10 rounded-3xl border border-slate-300 shadow-lg max-w-3xl mx-auto font-sans relative" id="paper-travel-expenses">
                        
                        {/* Elegant outer frame / border structure matching corporate printed forms */}
                        <div className="border border-slate-300 p-4 rounded-xl space-y-4">
                          
                          {/* Top grey header row */}
                          <div className="bg-[#e2e8f0]/80 border border-slate-400 py-2.5 px-4 text-center">
                            <h3 className="font-sans text-lg font-extrabold text-slate-900 tracking-widest uppercase">
                              TRAVELLING EXPENSES
                            </h3>
                          </div>

                          {/* Meta grid rows */}
                          <div className="border-t border-b border-slate-300 divide-y divide-slate-300">
                            
                            {/* Name Row */}
                            <div className="flex flex-col md:flex-row md:items-baseline py-2.5 px-1.5 space-y-1.5 md:space-y-0 md:space-x-3">
                              <span className="text-xs uppercase font-bold text-slate-600 font-mono w-20 shrink-0">NAME :</span>
                              <input 
                                type="text"
                                placeholder="Enter travelers' names, e.g. SUDIPTO NEOGI & SOURAV DAS"
                                value={teFilerName}
                                onChange={(e) => setTeFilerName(e.target.value)}
                                className="flex-1 bg-transparent text-sm italic font-medium text-slate-900 focus:outline-none border-b border-slate-200 focus:border-slate-800 pb-0.5"
                              />
                            </div>

                            {/* Date Row */}
                            <div className="flex flex-col md:flex-row md:items-baseline py-2.5 px-1.5 space-y-1.5 md:space-y-0 md:space-x-3">
                              <span className="text-xs uppercase font-bold text-slate-600 font-mono w-20 shrink-0">DATE :</span>
                              <input 
                                type="text"
                                placeholder="Enter date description, e.g. 06-05-2026 & 11-05-2026"
                                value={teDateDesc}
                                onChange={(e) => setTeDateDesc(e.target.value)}
                                className="flex-1 bg-transparent text-sm italic font-medium text-slate-900 focus:outline-none border-b border-slate-200 focus:border-slate-800 pb-0.5"
                              />
                            </div>

                            {/* Details Row */}
                            <div className="flex flex-col md:flex-row md:items-baseline py-2.5 px-1.5 space-y-1.5 md:space-y-0 md:space-x-3">
                              <span className="text-xs uppercase font-bold text-slate-600 font-mono w-20 shrink-0">DETAILS :</span>
                              <input 
                                type="text"
                                placeholder="Enter purpose of visit, e.g. TRAVELLING EXPENSES FOR VISITING COAL INDIA LIMITED"
                                value={teDetails}
                                onChange={(e) => setTeDetails(e.target.value)}
                                className="flex-1 bg-transparent text-sm italic font-medium text-slate-1000 focus:outline-none border-b border-slate-200 focus:border-slate-800 pb-0.5 font-semibold"
                              />
                            </div>

                          </div>

                          {/* Travelling ledger table */}
                          {/* Desktop table view */}
                          <div className="hidden md:block overflow-x-auto pt-4">
                            <table className="w-full border-collapse border border-slate-400 font-sans text-xs">
                              <thead>
                                <tr className="bg-[#f1f5f9] text-center font-bold text-slate-800">
                                  <th className="border border-slate-400 py-2 w-12 uppercase">SR.NO.</th>
                                  <th className="border border-slate-400 py-2 w-32 uppercase">DATE</th>
                                  <th className="border border-slate-400 py-2 uppercase">PARTICULAR</th>
                                  <th className="border border-slate-400 py-2 w-28 uppercase">AMOUNT</th>
                                  <th className="border border-slate-400 py-2 w-10 uppercase"></th>
                                </tr>
                              </thead>
                              <tbody>
                                {teRows.map((row, index) => (
                                  <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="border border-slate-400 text-center py-2.5 font-mono text-slate-600 font-bold">
                                      {row.serialNo}
                                    </td>
                                    <td className="border border-slate-400 px-1 py-1 text-center">
                                      <input 
                                        type="text"
                                        placeholder="06-05-2026"
                                        value={row.date}
                                        onChange={(e) => handleUpdateTeRow(index, "date", e.target.value)}
                                        className="w-full bg-transparent text-center focus:outline-none text-xs font-mono"
                                      />
                                    </td>
                                    <td className="border border-slate-400 px-2 py-1">
                                      <textarea 
                                        rows={1}
                                        placeholder="Journey particulars, e.g. HOME TO METRO BY BYKE"
                                        value={row.particular}
                                        onChange={(e) => handleUpdateTeRow(index, "particular", e.target.value)}
                                        className="w-full bg-transparent focus:outline-none text-xs resize-none"
                                      />
                                    </td>
                                    <td className="border border-slate-400 px-1 py-1 text-right">
                                      <input 
                                        type="number"
                                        placeholder="0.00"
                                        value={row.amount === 0 ? "" : row.amount}
                                        onChange={(e) => {
                                          const numVal = Number(e.target.value) || 0;
                                          handleUpdateTeRow(index, "amount", numVal);
                                        }}
                                        className="w-full bg-transparent text-right focus:outline-none text-xs font-mono pr-1 font-bold"
                                      />
                                    </td>
                                    <td className="border border-slate-400 text-center py-1">
                                      <button 
                                        type="button"
                                        onClick={() => handleRemoveTeRow(index)}
                                        disabled={teRows.length === 1}
                                        className="text-red-400 hover:text-red-700 disabled:opacity-30 cursor-pointer"
                                        title="Delete row"
                                      >
                                        <Trash2 className="h-3.5 w-3.5 mx-auto" />
                                      </button>
                                    </td>
                                  </tr>
                                ))}

                                {/* Total footer row resembling screenshot exactly with e.g. grey total banner */}
                                <tr className="bg-[#f1f5f9] border border-slate-400">
                                  <td colSpan={3} className="border border-slate-400 text-center font-bold py-2 uppercase font-mono tracking-wider">
                                    TOTAL
                                  </td>
                                  <td className="border border-slate-400 text-right py-2 font-mono font-black text-slate-1000 text-xs px-2">
                                    ₹ {teRows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0).toFixed(2)}
                                  </td>
                                  <td className="border border-slate-400 bg-[#f1f5f9]"></td>
                                </tr>
                              </tbody>
                            </table>
                          </div>

                          {/* Mobile card view representation */}
                          <div className="block md:hidden space-y-4 pt-4">
                            {teRows.map((row, index) => (
                              <div key={row.id} className="bg-slate-50 p-4 rounded-xl border border-slate-350 shadow-xs space-y-3">
                                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                  <span className="text-xs font-bold text-slate-700">Ledger Entry #{row.serialNo}</span>
                                  <button 
                                    type="button"
                                    onClick={() => handleRemoveTeRow(index)}
                                    disabled={teRows.length === 1}
                                    className="text-red-500 hover:text-red-700 disabled:opacity-35 text-xs flex items-center font-semibold"
                                  >
                                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                                    <span>Remove</span>
                                  </button>
                                </div>
                                <div className="grid grid-cols-1 gap-2.5 text-xs">
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Date</label>
                                    <input 
                                      type="text"
                                      placeholder="e.g. 06-05-2026"
                                      value={row.date}
                                      onChange={(e) => handleUpdateTeRow(index, "date", e.target.value)}
                                      className="w-full bg-white border border-slate-200 p-2.5 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-900 font-semibold"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Particular (Journey details)</label>
                                    <textarea 
                                      rows={2}
                                      placeholder="Journey particulars, e.g. HOME TO METRO BY BIKE"
                                      value={row.particular}
                                      onChange={(e) => handleUpdateTeRow(index, "particular", e.target.value)}
                                      className="w-full bg-white border border-slate-200 p-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-900 font-medium"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Amount (₹)</label>
                                    <input 
                                      type="number"
                                      placeholder="e.g. 150"
                                      value={row.amount === 0 ? "" : row.amount}
                                      onChange={(e) => {
                                        const numVal = Number(e.target.value) || 0;
                                        handleUpdateTeRow(index, "amount", numVal);
                                      }}
                                      className="w-full bg-white border border-slate-200 p-2.5 rounded-lg font-mono font-bold focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-900"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}

                            {/* Consolidated Mobile total banner */}
                            <div className="p-3.5 bg-slate-100 border border-slate-300 rounded-xl flex items-center justify-between font-bold text-xs">
                              <span className="uppercase text-slate-600 font-mono">Consolidated Total:</span>
                              <span className="font-mono text-slate-900 text-sm">₹ {teRows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0).toFixed(2)}</span>
                            </div>
                          </div>

                          <div className="pt-2 flex justify-start">
                            <button
                              type="button"
                              onClick={handleAddTeRow}
                              className="text-xs font-bold text-teal-850 hover:text-teal-950 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer shadow-sm"
                            >
                              <Plus className="h-3.5 w-3.5 stroke-[2.5px]" />
                              <span>Add Travelling Ledger Entry</span>
                            </button>
                          </div>

                        </div>
                      </div>

                      {/* Select Approver Section copy from cash voucher */}
                      <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-150 shadow-md max-w-3xl mx-auto space-y-4">
                        <div>
                          <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest font-mono">Routing & Authorization Hierarchy</h4>
                          <p className="text-[11px] text-slate-500 mt-1">Select the regulatory administrator or supervisor who will authenticate and sign off this Travelling Expenses Claim.</p>
                        </div>

                        <div className="space-y-3">
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Search className="h-4 w-4 text-slate-400" />
                            </div>
                            <input 
                              type="text" 
                              placeholder="Type name, company code or department to search authorities..."
                              value={approverSearchQuery}
                              onChange={(e) => setApproverSearchQuery(e.target.value)}
                              className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                            />
                          </div>

                          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {(() => {
                              const list = [
                                ...departmentHeads.map(u => ({ ...u, displayRole: u.role === "employee" ? "Authorized Approver" : "Department Head", roleLabel: "head" as const })),
                                ...administrators.map(u => ({ ...u, displayRole: "Administrator", roleLabel: "admin" as const })),
                                ...superAdministrators.map(u => ({ ...u, displayRole: "Super Administrator", roleLabel: "superadmin" as const }))
                              ];
                              const q = approverSearchQuery.toLowerCase();
                              const filtered = list.filter(
                                (appr) =>
                                  appr.name.toLowerCase().includes(q) ||
                                  appr.displayRole.toLowerCase().includes(q) ||
                                  (appr.department && appr.department.toLowerCase().includes(q))
                              );

                              if (filtered.length === 0) {
                                return <div className="text-center py-4 text-xs text-slate-400">No active company authority matching query.</div>;
                              }

                              return filtered.map((appr) => {
                                const isSelected = 
                                  (appr.roleLabel === "head" && selectedHeadId === appr.id) ||
                                  (appr.roleLabel === "admin" && selectedAdminId === appr.id) ||
                                  (appr.roleLabel === "superadmin" && selectedSuperAdminId === appr.id);

                                return (
                                  <button
                                    key={appr.id}
                                    type="button"
                                    onClick={() => {
                                      if (appr.roleLabel === "head") {
                                        setSelectedHeadId(appr.id);
                                        setSelectedAdminId("");
                                        setSelectedSuperAdminId("");
                                      } else if (appr.roleLabel === "admin") {
                                        setSelectedHeadId("");
                                        setSelectedAdminId(appr.id);
                                        setSelectedSuperAdminId("");
                                      } else if (appr.roleLabel === "superadmin") {
                                        setSelectedHeadId("");
                                        setSelectedAdminId("");
                                        setSelectedSuperAdminId(appr.id);
                                      }
                                    }}
                                    className={`w-full text-left p-3 rounded-lg flex items-center justify-between text-xs transition border ${
                                      isSelected 
                                        ? "bg-slate-900 border-slate-900 text-white shadow-sm font-semibold" 
                                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                                    }`}
                                  >
                                    <div>
                                      <div className="font-bold flex items-center gap-1.5 flex-wrap">
                                        <span>{appr.name}</span>
                                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-extrabold uppercase ${
                                          isSelected ? "bg-white/20 text-white border border-white/30" : "bg-slate-200 text-slate-800"
                                        }`}>
                                          {appr.displayRole}
                                        </span>
                                      </div>
                                      <div className={`text-[10px] ${isSelected ? "text-slate-300" : "text-slate-400"} mt-0.5`}>
                                        Code: <span className="font-mono">{appr.employeeCode}</span>
                                        {appr.department && ` | Department: ${appr.department}`}
                                      </div>
                                    </div>
                                    {isSelected ? (
                                      <Check className="h-4 w-4 text-emerald-450 stroke-[3px]" />
                                    ) : (
                                      <div className="h-4 w-4 rounded-full border border-slate-300 bg-white" />
                                    )}
                                  </button>
                                );
                              });
                            })()}
                          </div>

                          <div className="flex items-center justify-between pt-2">
                            <span className="text-[10px] text-slate-400 font-sans italic flex items-center gap-1">
                              <span className="text-amber-500 font-bold font-mono">ℹ</span>
                              Allows direct or phased approvals cleanly
                            </span>
                            
                            <button
                              type="button"
                              onClick={() => {
                                if (!teFilerName.trim() || !teDetails.trim()) {
                                  alert("Please fill in Name and Purpose details on Page 1 first.");
                                  return;
                                }
                                setTeStep(2);
                              }}
                              className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-2 px-4 rounded-xl flex items-center space-x-1.5 transition whitespace-nowrap shadow-sm cursor-pointer"
                            >
                              <span>Next Page: Proof & Bill</span>
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                    </div>
                  ) : (
                    /* Page 2: Upload Travel Receipts Proof */
                    <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-150 shadow-md max-w-3xl mx-auto space-y-6">
                      <div className="space-y-1 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest font-mono">Page 2: Supporting Document/Bill Proof</h4>
                        <p className="text-[11px] text-slate-500">Provide voyage receipts, bus tickets, metro tokens, yellow taxi receipts corresponding to the claims filled.</p>
                      </div>

                      {/* Simulated drag & drop area */}
                      <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center bg-slate-50 hover:bg-slate-50/50 transition relative">
                        <input 
                          type="file" 
                          id="travel-proof-file-upload" 
                          accept="image/png, image/jpeg, image/jpg, image/webp, image/heic, image/heif, application/pdf"
                          className="absolute inset-0 opacity-0 cursor-pointer" 
                          onChange={async (e) => {
                            if (e.target.files && e.target.files[0]) {
                              const file = e.target.files[0];
                              setAppError("");
                              setAppSuccess("⏳ Processing and optimizing travel expense proof file... Please wait.");
                              try {
                                const result = await processAndValidateFile(file);
                                setTeBillFileName(result.name);
                                setTeBillFileContent(result.content);
                                setAppSuccess(`Successfully processed and attached travel proof: ${result.name}`);
                                setTimeout(() => setAppSuccess(""), 4500);
                              } catch (err: any) {
                                console.error("Travel proof upload failure:", err);
                                setAppError(err.message || "Failed to process the uploaded travel proof document.");
                                setAppSuccess("");
                              }
                            }
                          }}
                        />
                        <div className="space-y-2">
                          <Upload className="h-8 w-8 text-slate-400 mx-auto animate-pulse" />
                          <p className="text-xs font-bold text-slate-700">Drag and drop receipts or click to select files (optional)</p>
                          <p className="text-[10px] text-slate-500">Supports PDF, PNG, JPG, JPEG, WEBP, HEIC (Max 15MB - mobile optimized)</p>
                        </div>
                      </div>

                      {/* If file uploaded, show preview / information */}
                      {teBillFileName && (
                        <div className="p-4 bg-emerald-50/70 border border-emerald-150 rounded-xl flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="p-2.5 bg-emerald-650 text-white rounded-lg">
                              <File className="h-5 w-5" />
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-xs font-bold text-slate-850 truncate max-w-[200px]">{teBillFileName}</p>
                              <span className="text-[10px] text-emerald-800 font-mono font-medium">Uploaded Securely</span>
                            </div>
                          </div>
                          <button 
                            type="button"
                            onClick={() => {
                              setTeBillFileName("");
                              setTeBillFileContent("");
                            }}
                            className="text-red-500 hover:text-red-700 text-xs font-bold font-mono uppercase tracking-wider"
                          >
                            Remove
                          </button>
                        </div>
                      )}

                      <div className="bg-slate-100/60 p-4 rounded-xl border border-dashed border-slate-200 flex items-center space-x-3 text-xs leading-normal">
                        <div className="p-2 bg-slate-200 rounded-full shrink-0">
                          <HelpCircle className="h-4 w-4 text-slate-700" />
                        </div>
                        <p className="text-slate-600 font-medium">💡 Quick Help: The proof serves as audit protection. The system stores both files alongside authorization logs to guarantee regulatory compliance with enterprise auditing norms.</p>
                      </div>

                      {/* Action Triggers */}
                      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <button 
                          type="button"
                          onClick={() => setTeStep(1)}
                          className="px-5 py-2.5 bg-slate-100 hover:bg-slate-201 text-slate-700 font-extrabold text-xs rounded-xl transition cursor-pointer"
                        >
                          Back to Page 1
                        </button>
                        <button 
                          type="button"
                          onClick={saveTravelExpensesForm}
                          disabled={loading}
                          className="px-6 py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-extrabold text-xs rounded-xl transition shadow flex items-center space-x-2 cursor-pointer"
                        >
                          {loading ? (
                            <span>Submitting claim...</span>
                          ) : (
                            <>
                              <Send className="h-4 w-4" />
                              <span>Submit Travelling Expenses claim</span>
                            </>
                          )}
                        </button>
                      </div>

                    </div>
                  )}

                </div>
              )}

              {/* PAGE: LOCAL CONVEYANCE HUB & CREATOR */}
              {currentPage === "local-conveyance" && (
                <div className="space-y-6 max-w-5xl mx-auto animate-fade-in" id="local-conveyance-page">
                  {!isLcEditing && !editingRequestId ? (
                    /* CENTRALIZED RECORD LIST VIEW */
                    <div className="space-y-6">
                      <div className="bg-gradient-to-r from-amber-900 via-slate-900 to-amber-950 text-white rounded-2xl p-6 shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded text-[10px] font-bold uppercase tracking-widest font-mono border border-amber-500/30 flex items-center gap-1">
                              <Compass className="h-3 w-3" />
                              <span>Dynamic Traveling Allowance</span>
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">Segment Seq Code: LC-{currentUser?.enterpriseCode || "2026"}</span>
                          </div>
                          <h2 className="text-xl font-black">Local Conveyance Allowance Hub</h2>
                          <p className="text-slate-300 text-xs">
                            Issue, track, and manage local conveyance claims with auto-integrated Cash Vouchers, live distance sum check-ins, and automated signing matrices.
                          </p>
                        </div>
                        
                        <div>
                          <button
                            onClick={() => {
                              resetLocalConveyanceForm();
                              setIsLcEditing(true);
                            }}
                            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center space-x-1.5 cursor-pointer shadow-md transition"
                          >
                            <Plus className="h-4 w-4 stroke-[2.5px]" />
                            <span>File Local Conveyance Claim</span>
                          </button>
                        </div>
                      </div>

                      {/* Stat summary cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Total Submissions</span>
                            <strong className="block text-xl font-black text-slate-800 mt-1">
                              {requestsList.filter(r => r.category === "Local Conveyance" && (currentUser.role !== "employee" || r.userId === currentUser.id)).length}
                            </strong>
                          </div>
                          <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-100">
                            <Compass className="h-5 w-5 text-amber-650" />
                          </div>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Pending Authorization</span>
                            <strong className="block text-xl font-black text-slate-800 mt-1">
                              {requestsList.filter(r => r.category === "Local Conveyance" && r.status === "Pending" && (currentUser.role !== "employee" || r.userId === currentUser.id)).length}
                            </strong>
                          </div>
                          <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-100">
                            <Clock className="h-5 w-5 text-amber-650 animate-pulse" />
                          </div>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Released Claims</span>
                            <strong className="block text-xl font-black text-slate-800 mt-1">
                              ₹ {getDeduplicatedRequests(requestsList)
                                .filter(r => r.category === "Local Conveyance" && r.status === "Approved" && (currentUser.role !== "employee" || r.userId === currentUser.id))
                                .reduce((sum, r) => sum + r.totalBudget, 0).toFixed(2)}
                            </strong>
                          </div>
                          <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-100">
                            <CheckCircle2 className="h-5 w-5 text-amber-650" />
                          </div>
                        </div>
                      </div>

                      {/* Main Records List */}
                      <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden mb-6">
                        <div className="px-5 py-4 border-b border-gray-100 bg-slate-50 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                          <div>
                            <h3 className="font-bold text-slate-850 text-xs uppercase tracking-wide">Conveyance Claims Ledger</h3>
                            <p className="text-[10px] text-slate-500 mt-0.5">Continuous sequence record of local conveyance vouchers submitted in this segment.</p>
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse font-sans text-xs">
                            <thead>
                              <tr className="bg-slate-100 border-b border-slate-200 text-[#111827] uppercase tracking-wide font-mono text-left">
                                <th className="p-3 font-semibold">Voucher No</th>
                                <th className="p-3 font-semibold">Filer / Claimant</th>
                                <th className="p-3 font-semibold">Incurred By</th>
                                <th className="p-3 font-semibold">Expense Particulars</th>
                                <th className="p-3 font-semibold text-right">Total Amount</th>
                                <th className="p-3 font-semibold text-center">Status</th>
                                <th className="p-3 font-semibold text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {(() => {
                                const list = requestsList.filter(r => r.category === "Local Conveyance" && (currentUser.role !== "employee" || r.userId === currentUser.id));
                                if (list.length === 0) {
                                  return (
                                    <tr>
                                      <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                                        No Local Conveyance claims found in database. Click button above to file a claim.
                                      </td>
                                    </tr>
                                  );
                                }
                                return list.map(r => (
                                  <tr key={r.id} className="hover:bg-amber-50/20 transition-colors">
                                    <td className="p-3 font-mono font-extrabold text-slate-800">
                                      {r.documentNumber || r.localConveyanceDetails?.voucherNo || "Draft/" + r.id.substring(0, 7)}
                                    </td>
                                    <td className="p-3 text-slate-700">
                                      <div>
                                        <p className="font-bold">{r.employeeName}</p>
                                        <p className="text-[10px] text-slate-400 tracking-tight">{r.submissionDate}</p>
                                      </div>
                                    </td>
                                    <td className="p-3 font-medium text-slate-800">
                                      {r.localConveyanceDetails?.incurredBy || "N/A"}
                                    </td>
                                    <td className="p-3 text-slate-650 max-w-xs truncate">
                                      {r.localConveyanceDetails?.kindOfExpense || r.projectName}
                                    </td>
                                    <td className="p-3 text-right font-mono font-black text-slate-850">
                                      ₹ {r.totalBudget.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="p-3 text-center">
                                      {renderRequestStatusBadge(r)}
                                    </td>
                                    <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                                      <button
                                        onClick={() => {
                                          setActiveRequestDetails(r);
                                        }}
                                        className="p-1 px-2 border border-slate-200 hover:border-slate-450 hover:bg-slate-50 rounded-lg text-[10px] font-bold text-slate-705 hover:text-slate-900 transition inline-flex items-center gap-1 cursor-pointer"
                                        title="View active workflow"
                                      >
                                        <Eye className="h-3 w-3" />
                                        <span>Workflow</span>
                                      </button>

                                      <button
                                        onClick={() => downloadApprovalPDF(r)}
                                        className="p-1 px-2 border border-amber-250 hover:bg-amber-50 rounded-lg text-[10px] font-bold text-amber-900 transition inline-flex items-center gap-1 cursor-pointer"
                                        title="Print dynamic 2-page allowance sheet"
                                      >
                                        <Download className="h-3 w-3" />
                                        <span>PDF</span>
                                      </button>

                                      {(r.status === "Draft" || r.status === "Queried") && (
                                        <button
                                          onClick={() => {
                                            handleEditTrigger(r);
                                          }}
                                          className="p-1 px-2 border border-blue-200 hover:bg-blue-50 hover:border-blue-300 rounded-lg text-[10px] font-bold text-blue-800 transition inline-flex items-center gap-1 cursor-pointer"
                                          title="Modify entries and submit"
                                        >
                                          <Settings className="h-3 w-3" />
                                          <span>Edit</span>
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                ));
                              })()}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* LOCAL CONVEYANCE FORM BUILDER (EDIT/CREATION) */
                    <div className="space-y-8 max-w-4xl mx-auto shadow-sm pb-12">
                      <div className="bg-amber-50 rounded-2xl border border-amber-100 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase font-mono text-amber-850 tracking-wider">Interactive Local Conveyance Sheet</span>
                          <span className="block mt-1 text-xs text-slate-700">
                            Provide the general claim details below, then enter your daily travel logs inside the entries sheet.
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] font-bold uppercase text-amber-800 tracking-widest font-mono">Series Key: LC (Conveyance Sequence)</span>
                          <span className="block font-mono text-xs font-black text-[#1d120a] bg-amber-200 border border-amber-300 px-3 py-1 mt-1 rounded text-center">
                            {lcVoucherNo || getNextDocumentNoPreview("Local Conveyance")}
                          </span>
                        </div>
                      </div>

                      {/* General Claim Particulars Card */}
                      <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-md space-y-4">
                        <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
                          <Compass className="h-4 w-4 text-slate-800" />
                          <span className="font-extrabold text-[10px] text-slate-800 uppercase tracking-widest font-mono">1. Local Conveyance Particulars</span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Claimant / Incurred By <span className="text-red-500">*</span></label>
                            <input
                              type="text"
                              value={lcIncurredBy}
                              onChange={(e) => setLcIncurredBy(e.target.value)}
                              placeholder="e.g. SAMRAT GUHA & AKLU RAJAK"
                              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-slate-900 focus:border-slate-950"
                            />
                            <p className="text-[9px] text-slate-400 mt-1 font-medium">Type the names of employees who incurred these travel expenses.</p>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Filing Reference / File No</label>
                            <input
                              type="text"
                              value={lcFileNo}
                              onChange={(e) => setLcFileNo(e.target.value)}
                              placeholder="e.g. 13/05/2026 or EXP-LC-01"
                              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-slate-900 focus:border-slate-950"
                            />
                            <p className="text-[9px] text-slate-400 mt-1 font-medium">Company ledger reference sequence number or filing date.</p>
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Kind of Expense / Claim Purpose <span className="text-red-500">*</span></label>
                            <textarea
                              rows={2}
                              value={lcKindOfExpense}
                              onChange={(e) => setLcKindOfExpense(e.target.value)}
                              placeholder="Describe the overall scope of voyages (e.g. 'Being the reimbursement claim for local conveyance to customer client factories in mid-May.')"
                              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-slate-900 focus:border-slate-950"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Side by side layout of pages */}
                      <div className="grid grid-cols-1 gap-8">

                        {/* PAGE 2: TRAVELLING ALLOWANCE TABLE */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xs font-black uppercase text-slate-800 font-mono tracking-widest">2. Traveling Allowance Sheet</h3>
                            <span className="text-[10px] bg-sky-100 border border-sky-200 font-bold px-2.5 py-0.5 rounded-full text-sky-900 uppercase font-mono">Reimbursement Voyage Logs</span>
                          </div>

                          <div className="bg-white p-6 md:p-10 rounded-3xl border border-slate-300 shadow-xl font-sans relative" id="paper-allowance-sheet-lc">
                            <div className="border border-slate-300 p-5 rounded-2xl space-y-4">
                              
                              {/* Header for Page 2 */}
                              <div className="bg-slate-100 text-center py-2 border border-slate-400">
                                <h3 className="font-sans text-md font-extrabold text-slate-905 tracking-widest uppercase mb-0.5">
                                  TRAVELLING ALLOWANCE
                                </h3>
                                <p className="text-[9px] uppercase font-mono font-bold tracking-wider text-slate-500">{currentUser?.enterpriseName || "PROFLOW ENTERPRISE"}</p>
                              </div>

                              <div className="flex flex-col md:flex-row md:items-baseline py-2 px-1 border-b border-slate-200 space-y-1.5 md:space-y-0 md:space-x-3 text-xs">
                                <span className="font-extrabold uppercase font-mono text-slate-500 w-16 shrink-0">NAME :</span>
                                <span className="flex-1 bg-transparent py-1 font-bold italic text-slate-900 border-b border-slate-200">
                                  {lcIncurredBy.trim() || "[Type the claimant name in section 1 above]"}
                                </span>
                              </div>

                              {/* Ledger table */}
                              {/* Desktop table view */}
                              <div className="hidden md:block overflow-x-auto">
                                <table className="w-full border-collapse border border-slate-400 font-sans text-[11px]">
                                  <thead>
                                    <tr className="bg-slate-100 text-center font-mono font-bold text-slate-800">
                                      <th className="border border-slate-400 py-1.5 px-1 w-10 uppercase">Sl. No</th>
                                      <th className="border border-slate-400 py-1.5 px-1 w-24 uppercase">Date</th>
                                      <th className="border border-slate-400 py-1.5 px-2 uppercase">From</th>
                                      <th className="border border-slate-400 py-1.5 px-2 uppercase">To</th>
                                      <th className="border border-slate-400 py-1.5 px-3 uppercase">Purpose of voyage</th>
                                      <th className="border border-slate-400 py-1.5 px-2 uppercase w-24">Approved by</th>
                                      <th className="border border-slate-400 py-1.5 px-2 uppercase w-24">Signature</th>
                                      <th className="border border-slate-400 py-1.5 px-2 uppercase w-24">Amount</th>
                                      <th className="border border-slate-400 py-1.5 w-8"></th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {lcRows.map((row, index) => (
                                      <tr key={row.id} className="hover:bg-amber-50/15 transition-colors">
                                        <td className="border border-slate-400 text-center py-2 font-mono text-slate-600 font-bold">
                                          {row.serialNo}
                                        </td>
                                        
                                        {/* Date */}
                                        <td className="border border-slate-400 px-1 py-1">
                                          <input 
                                            type="text"
                                            value={row.date}
                                            onChange={(e) => handleUpdateLcRow(index, "date", e.target.value)}
                                            placeholder="e.g. 13/05/26"
                                            className="w-full bg-transparent focus:outline-none text-center font-mono placeholder-slate-400 font-semibold text-slate-900"
                                          />
                                        </td>

                                        {/* From */}
                                        <td className="border border-slate-400 px-1.5 py-1">
                                          <input 
                                            type="text"
                                            value={row.from}
                                            onChange={(e) => handleUpdateLcRow(index, "from", e.target.value)}
                                            placeholder="e.g. office"
                                            className="w-full bg-transparent focus:outline-none placeholder-slate-400 font-medium italic text-slate-900"
                                          />
                                        </td>

                                        {/* To */}
                                        <td className="border border-slate-405 px-1.5 py-1">
                                          <input 
                                            type="text"
                                            value={row.to}
                                            onChange={(e) => handleUpdateLcRow(index, "to", e.target.value)}
                                            placeholder="e.g. chandni-chok"
                                            className="w-full bg-transparent focus:outline-none placeholder-slate-400 font-medium italic text-slate-900"
                                          />
                                        </td>

                                        {/* Purpose */}
                                        <td className="border border-slate-400 px-2 py-1">
                                          <input 
                                            type="text"
                                            value={row.purpose}
                                            onChange={(e) => handleUpdateLcRow(index, "purpose", e.target.value)}
                                            placeholder="e.g. laptop repairing"
                                            className="w-full bg-transparent focus:outline-none placeholder-slate-400 text-slate-900"
                                          />
                                        </td>

                                        {/* Approved By: Dropdown selector */}
                                        <ApprovedByCell 
                                          value={row.approvedBy || ""}
                                          onChange={(val) => handleUpdateLcRow(index, "approvedBy", val)}
                                          employees={employeesList}
                                        />

                                        {/* Signature: Automated creator! */}
                                        <td className="border border-slate-400 px-1 py-1 text-center font-sans font-semibold text-[9px] text-slate-500 bg-slate-50/80 truncate max-w-[80px]">
                                          {/* Signature blank */}
                                        </td>

                                        {/* Amount */}
                                        <td className="border border-slate-400 px-1 py-1">
                                          <input 
                                            type="number"
                                            placeholder="0"
                                            value={row.amount === 0 ? "" : row.amount}
                                            onChange={(e) => {
                                              const numVal = Number(e.target.value) || 0;
                                              handleUpdateLcRow(index, "amount", numVal);
                                            }}
                                            className="w-full bg-transparent text-right font-mono font-black pr-1 focus:outline-none text-[#111827]"
                                          />
                                        </td>

                                        {/* Remove row */}
                                        <td className="border border-slate-400 text-center py-1 bg-slate-50">
                                          <button 
                                            type="button"
                                            onClick={() => handleRemoveLcRow(index)}
                                            disabled={lcRows.length === 1}
                                            className="text-red-400 hover:text-red-700 disabled:opacity-20 cursor-pointer"
                                            title="Delete Voyage Item"
                                          >
                                            <Trash2 className="h-3 w-3 mx-auto" />
                                          </button>
                                        </td>
                                      </tr>
                                    ))}

                                    {/* Footer total */}
                                    <tr className="bg-slate-50 border-t border-slate-400 font-bold">
                                      <td colSpan={5} className="border border-slate-400 text-center font-mono py-2 uppercase tracking-wide text-slate-700">
                                        TOTAL
                                      </td>
                                      <td className="border border-slate-400 bg-slate-100"></td>
                                      <td className="border border-slate-400 bg-slate-100"></td>
                                      <td className="border border-slate-400 text-right pr-2 px-1 font-mono font-black text-slate-900 text-xs py-2 bg-amber-50">
                                        ₹ {lcRows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0).toFixed(2)}
                                      </td>
                                      <td className="border border-slate-400 bg-slate-100"></td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>

                              {/* Mobile card view representation */}
                              <div className="block md:hidden space-y-4">
                                {lcRows.map((row, index) => (
                                  <div key={row.id} className="bg-slate-50 p-4 rounded-xl border border-slate-300 shadow-sm space-y-3">
                                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                      <span className="text-xs font-bold text-slate-700">Voyage Activity #{row.serialNo}</span>
                                      <button 
                                        type="button"
                                        onClick={() => handleRemoveLcRow(index)}
                                        disabled={lcRows.length === 1}
                                        className="text-red-500 hover:text-red-700 disabled:opacity-30 text-xs flex items-center font-semibold cursor-pointer"
                                      >
                                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                                        <span>Remove</span>
                                      </button>
                                    </div>
                                    <div className="grid grid-cols-1 gap-2 text-xs">
                                      <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Date</label>
                                        <input 
                                          type="text"
                                          value={row.date}
                                          onChange={(e) => handleUpdateLcRow(index, "date", e.target.value)}
                                          placeholder="e.g. 13/05/26"
                                          className="w-full bg-white border border-slate-200 p-2 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-900 font-semibold"
                                        />
                                      </div>
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">From</label>
                                          <input 
                                            type="text"
                                            value={row.from}
                                            onChange={(e) => handleUpdateLcRow(index, "from", e.target.value)}
                                            placeholder="e.g. office"
                                            className="w-full bg-white border border-slate-200 p-2 rounded-lg font-medium focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-900"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">To</label>
                                          <input 
                                            type="text"
                                            value={row.to}
                                            onChange={(e) => handleUpdateLcRow(index, "to", e.target.value)}
                                            placeholder="e.g. client factory"
                                            className="w-full bg-white border border-slate-200 p-2 rounded-lg font-medium focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-900"
                                          />
                                        </div>
                                      </div>
                                      <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Purpose of Voyage</label>
                                        <input 
                                          type="text"
                                          value={row.purpose}
                                          onChange={(e) => handleUpdateLcRow(index, "purpose", e.target.value)}
                                          placeholder="e.g. meeting client for feedback"
                                          className="w-full bg-white border border-slate-200 p-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-900"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Approved By</label>
                                        <MobileApprovedBySelect 
                                          value={row.approvedBy || ""}
                                          onChange={(val) => handleUpdateLcRow(index, "approvedBy", val)}
                                          employees={employeesList}
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Amount (₹)</label>
                                        <input 
                                          type="number"
                                          placeholder="0"
                                          value={row.amount === 0 ? "" : row.amount}
                                          onChange={(e) => {
                                            const numVal = Number(e.target.value) || 0;
                                            handleUpdateLcRow(index, "amount", numVal);
                                          }}
                                          className="w-full bg-white border border-slate-200 p-2 rounded-lg font-mono font-bold focus:outline-none focus:ring-1 focus:ring-amber-500 text-[#111827]"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              <div className="flex justify-between items-center flex-wrap gap-2 pt-2">
                                <button
                                  type="button"
                                  onClick={handleAddLcRow}
                                  className="text-xs font-bold text-slate-800 hover:text-slate-950 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer shadow-sm"
                                >
                                  <Plus className="h-3.5 w-3.5 stroke-[2.5px]" />
                                  <span>Add Voyage Line Item</span>
                                </button>
                                
                                <div className="text-right">
                                  <span className="text-[9px] uppercase font-bold text-amber-900/60 font-mono tracking-wider block">Sum Total:</span>
                                  <span className="font-mono font-black text-xs text-amber-950 bg-amber-50 border border-amber-100 px-3 py-1 rounded-md inline-block">
                                    ₹ {lcRows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0).toFixed(2)}
                                  </span>
                                </div>
                              </div>

                            </div>
                          </div>
                        </div>

                      </div>

                      {/* ATTACHMENTS SECTION FOR LOCAL CONVEYANCE */}
                      <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-150 shadow-md max-w-3xl mx-auto space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest font-mono">2.5. Proof & Supporting Receipts</h4>
                            <p className="text-[11px] text-slate-500 mt-1">Upload images, bills, PDFs, or photos representing Proof-of-Travel for this Local Conveyance.</p>
                          </div>
                          <span className="text-[9px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">Secure ISO Storage</span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {lcAttachments.map((f, idx) => {
                            const hasPipe = f.includes('|');
                            const name = hasPipe ? f.split('|')[0] : f;
                            const dataUrl = hasPipe ? f.split('|').slice(1).join('|') : null;

                            return (
                              <div key={idx} className="flex items-center space-x-2 bg-slate-100 text-slate-850 p-1.5 px-3 rounded-lg border border-slate-200 font-mono text-[10px] shadow-sm animate-fade-in hover:bg-slate-150">
                                <File className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                                {dataUrl ? (
                                  <a 
                                    href={dataUrl} 
                                    download={name}
                                    className="truncate max-w-[180px] hover:text-[#047857] hover:underline font-bold transition"
                                    onClick={(e) => e.stopPropagation()}
                                    title="Click to preview/download"
                                  >
                                    {name}
                                  </a>
                                ) : (
                                  <span className="truncate max-w-[180px]">{name}</span>
                                )}
                                <button 
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setLcAttachments(lcAttachments.filter((_, i) => i !== idx));
                                  }}
                                  className="text-red-500 hover:text-red-700 transition cursor-pointer" 
                                  title="Delete attachment"
                                >
                                  <XCircle className="h-4 w-4" />
                                </button>
                              </div>
                            );
                          })}
                        </div>

                        {/* Interactive Drag & Drop Box */}
                        <div 
                          id="drop-target-area-lc"
                          className={`border-2 border-dashed rounded-xl p-5 text-center flex flex-col items-center justify-center cursor-pointer transition ${
                            isLcDragging 
                              ? "border-emerald-500 bg-emerald-50/20 text-emerald-800 scale-[1.01]" 
                              : "border-slate-200 hover:border-slate-350 bg-slate-50/50 hover:bg-slate-50 text-slate-650"
                          }`}
                          onDragOver={(e) => {
                            e.preventDefault();
                            setIsLcDragging(true);
                          }}
                          onDragLeave={() => setIsLcDragging(false)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setIsLcDragging(false);
                            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                              processLcFiles(e.dataTransfer.files);
                            }
                          }}
                          onClick={() => {
                            const fileInput = document.getElementById("lc-attachment-file-input");
                            if (fileInput) (fileInput as HTMLInputElement).click();
                          }}
                        >
                          <input 
                            type="file"
                            id="lc-attachment-file-input"
                            className="hidden"
                            multiple
                            accept="image/png, image/jpeg, image/jpg, image/webp, image/heic, image/heif, application/pdf"
                            onChange={(e) => {
                              if (e.target.files && e.target.files.length > 0) {
                                processLcFiles(e.target.files);
                              }
                            }}
                          />
                          <Upload className="h-6 w-6 text-slate-400 mb-2 animate-bounce" />
                          <p className="text-xs font-bold text-slate-700">
                            Drop a file here or <span className="text-emerald-700 underline decoration-2">select a file</span>
                          </p>
                          <p className="text-[10px] text-slate-450 font-mono mt-1">Supports PDF, PNG, JPEG, WEBP, HEIC (Max 15MB)</p>
                        </div>

                        {/* Optional Name Link entry */}
                        <div className="flex items-center space-x-2 pt-1">
                          <input
                            type="text"
                            placeholder="Or type quote URL/doc name (e.g. Conveyance_Slip.png)..."
                            value={newLcAttachmentName}
                            onChange={(e) => setNewLcAttachmentName(e.target.value)}
                            className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-mono w-full focus:ring-1 focus:ring-slate-900 focus:border-slate-950"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              addLcAttachment();
                            }}
                            className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 shadow-sm cursor-pointer"
                          >
                            Add Link
                          </button>
                        </div>
                      </div>

                      {/* Select Approver Section copy from cash voucher */}
                      <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-150 shadow-md max-w-3xl mx-auto space-y-4">
                        <div>
                          <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest font-mono">3. Routing & Authorization Hierarchy</h4>
                          <p className="text-[11px] text-slate-500 mt-1">Select the regulatory administrator or supervisor who will authenticate and sign off this Local Conveyance.</p>
                        </div>

                        <div className="space-y-3">
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Search className="h-4 w-4 text-slate-400" />
                            </div>
                            <input 
                              type="text" 
                              placeholder="Type name, company code or department to search authorities..."
                              value={approverSearchQuery}
                              onChange={(e) => setApproverSearchQuery(e.target.value)}
                              className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                            />
                          </div>

                          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {(() => {
                              const list = [
                                ...departmentHeads.map(u => ({ ...u, displayRole: u.role === "employee" ? "Authorized Approver" : "Department Head", roleLabel: "head" as const })),
                                ...administrators.map(u => ({ ...u, displayRole: "Administrator", roleLabel: "admin" as const })),
                                ...superAdministrators.map(u => ({ ...u, displayRole: "Super Administrator", roleLabel: "superadmin" as const }))
                              ];
                              const q = approverSearchQuery.toLowerCase();
                              const filtered = list.filter(
                                (appr) =>
                                  appr.name.toLowerCase().includes(q) ||
                                  appr.displayRole.toLowerCase().includes(q) ||
                                  (appr.department && appr.department.toLowerCase().includes(q))
                              );

                              if (filtered.length === 0) {
                                  return <div className="text-center py-4 text-xs text-slate-400">No active company authority matching query.</div>;
                              }

                              return filtered.map((appr) => {
                                const isSelected = 
                                  (appr.roleLabel === "head" && selectedHeadId === appr.id) ||
                                  (appr.roleLabel === "admin" && selectedAdminId === appr.id) ||
                                  (appr.roleLabel === "superadmin" && selectedSuperAdminId === appr.id);

                                return (
                                  <button
                                    key={appr.id}
                                    type="button"
                                    onClick={() => {
                                      if (appr.roleLabel === "head") {
                                        setSelectedHeadId(appr.id);
                                        setSelectedAdminId("");
                                        setSelectedSuperAdminId("");
                                      } else if (appr.roleLabel === "admin") {
                                        setSelectedHeadId("");
                                        setSelectedAdminId(appr.id);
                                        setSelectedSuperAdminId("");
                                      } else if (appr.roleLabel === "superadmin") {
                                        setSelectedHeadId("");
                                        setSelectedAdminId("");
                                        setSelectedSuperAdminId(appr.id);
                                      }
                                    }}
                                    className={`w-full text-left p-2.5 rounded-lg flex items-center justify-between text-xs transition border ${
                                      isSelected 
                                        ? "bg-slate-900 border-slate-900 text-white shadow-sm font-semibold" 
                                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                                    }`}
                                  >
                                    <div>
                                      <div className="font-bold flex items-center gap-1.5 flex-wrap">
                                        <span>{appr.name}</span>
                                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-200/60 text-slate-600'}`}>
                                          {appr.displayRole}
                                        </span>
                                      </div>
                                      <p className={`text-[10px] ${isSelected ? 'text-slate-300' : 'text-slate-400'} mt-0.5`}>
                                        Department Code: {appr.department || "General Ledger Controls"}
                                      </p>
                                    </div>
                                    {isSelected && <Check className="h-4 w-4 text-emerald-400 font-bold" />}
                                  </button>
                                );
                              });
                            })()}
                          </div>
                        </div>
                      </div>

                      {/* Error / Success logs */}
                      {appError && (
                        <div className="max-w-3xl mx-auto p-3 text-xs bg-red-50 text-red-700 rounded-xl border border-red-100 font-bold animate-pulse">
                          ⚠️ {appError}
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex items-center justify-end space-x-3 max-w-3xl mx-auto pt-4 border-t border-slate-200">
                        <button
                          type="button"
                          onClick={() => {
                            setIsLcEditing(false);
                            setEditingRequestId(null);
                            resetLocalConveyanceForm();
                          }}
                          className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs rounded-xl shadow-sm transition cursor-pointer"
                        >
                          Cancel
                        </button>
                        
                        <button 
                          type="button"
                          onClick={() => saveLocalConveyanceForm(true)}
                          disabled={loading}
                          className="px-5 py-2.5 bg-slate-100 hover:bg-slate-205 text-slate-800 border border-slate-200 font-bold text-xs rounded-xl transition cursor-pointer"
                        >
                          Save as Draft
                        </button>

                        <button 
                          type="button"
                          onClick={() => saveLocalConveyanceForm(false)}
                          disabled={loading}
                          className="px-6 py-2.5 bg-amber-950 hover:bg-slate-900 text-amber-400 font-extrabold text-xs rounded-xl transition shadow flex items-center space-x-2 cursor-pointer border border-amber-900"
                        >
                          {loading ? (
                            <span>Filing claim...</span>
                          ) : (
                            <>
                              <Send className="h-4 w-4" />
                              <span>{editingRequestId ? "Save Modified Claim" : "File Claim"}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* PAGE 3.5: SAMPLE COLLECTION TRAVEL BILL SHEET INSTRUCTION */}
              {currentPage === "sample-collection" && (
                <SampleCollectionForm
                  currentUser={currentUser}
                  requestsList={requestsList}
                  numberingSettings={numberingSettings}
                  editingRequestId={editingRequestId}
                  setEditingRequestId={setEditingRequestId}
                  setCurrentPage={setCurrentPage}
                  fetchRequests={fetchRequests}
                  fetchAuditLogs={fetchAuditLogs}
                  departmentHeads={departmentHeads}
                  administrators={administrators}
                  superAdministrators={superAdministrators}
                  employeesList={employeesList}
                  apiHeaders={apiHeaders}
                  numberToWords={numberToWords}
                  getDeduplicatedRequests={getDeduplicatedRequests}

                  scVoucherNo={scVoucherNo}
                  setScVoucherNo={setScVoucherNo}
                  scFileNo={scFileNo}
                  setScFileNo={setScFileNo}
                  scKindOfExpense={scKindOfExpense}
                  setScKindOfExpense={setScKindOfExpense}
                  scIncurredBy={scIncurredBy}
                  setScIncurredBy={setScIncurredBy}
                  scRows={scRows}
                  setScRows={setScRows}
                  isScEditing={isScEditing}
                  setIsScEditing={setIsScEditing}
                  resetSampleCollectionForm={resetSampleCollectionForm}
                  saveSampleCollectionForm={saveSampleCollectionForm}

                  selectedHeadId={selectedHeadId}
                  setSelectedHeadId={setSelectedHeadId}
                  selectedAdminId={selectedAdminId}
                  setSelectedAdminId={setSelectedAdminId}
                  selectedSuperAdminId={selectedSuperAdminId}
                  setSelectedSuperAdminId={setSelectedSuperAdminId}
                  getNextDocumentNoPreview={getNextDocumentNoPreview}

                  scAttachments={scAttachments}
                  setScAttachments={setScAttachments}
                  newScAttachmentName={newScAttachmentName}
                  setNewScAttachmentName={setNewScAttachmentName}
                  isScDragging={isScDragging}
                  setIsScDragging={setIsScDragging}
                  processScFiles={processScFiles}
                  addScAttachment={addScAttachment}
                />
              )}

              {/* PAGE 4: EMPLOYEE WORKFORCE MANAGEMENT */}
              {currentPage === "employees" && (
                <div className="space-y-6 max-w-5xl mx-auto animate-fade-in" id="employees-manager-page">
                  
                  {/* ONBOARD NEW EMPLOYEE CARD FORM */}
                  <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-4">
                    <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                      <Users className="h-4 w-4 text-slate-800" />
                      <span className="font-extrabold text-xs text-slate-800 uppercase tracking-widest font-mono">Onboard New Employee Account</span>
                    </div>

                    <form onSubmit={handleEmployeeRegisterSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Corporate Email Address</label>
                        <input
                          type="email"
                          placeholder="employee@company.com"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-slate-900 focus:border-slate-950"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Full Name</label>
                        <input
                          type="text"
                          placeholder="John Doe"
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-slate-900 focus:border-slate-950"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Employee Code (Username)</label>
                        <input
                          type="text"
                          placeholder="EMP-500"
                          value={regEmployeeCode}
                          onChange={(e) => setRegEmployeeCode(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-slate-900 focus:border-slate-950"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Assigned Department</label>
                        <select
                          value={regDepartment}
                          onChange={(e) => setRegDepartment(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-white focus:ring-1 focus:ring-slate-900 focus:border-slate-950"
                        >
                          {allDepartments.map((deptOpt) => (
                            <option key={deptOpt} value={deptOpt}>
                              {deptOpt}
                            </option>
                          ))}
                          <option value="Others">Others (Type custom...)</option>
                        </select>

                        {regDepartment === "Others" && (
                          <div className="mt-2 space-y-1 animate-fade-in">
                            <label className="block text-[10px] font-bold text-amber-800 uppercase">Custom Department Name *</label>
                            <input
                              type="text"
                              placeholder="e.g. Quality Assurance, Logistics"
                              value={customDepartment}
                              onChange={(e) => setCustomDepartment(e.target.value)}
                              onBlur={(e) => {
                                const trimmed = e.target.value.trim();
                                if (trimmed) {
                                  if (!allDepartments.includes(trimmed)) {
                                    setAdditionalDepartments((prev) => [...prev, trimmed]);
                                  }
                                  setRegDepartment(trimmed);
                                  setCustomDepartment("");
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  const trimmed = customDepartment.trim();
                                  if (trimmed) {
                                    if (!allDepartments.includes(trimmed)) {
                                      setAdditionalDepartments((prev) => [...prev, trimmed]);
                                    }
                                    setRegDepartment(trimmed);
                                    setCustomDepartment("");
                                  }
                                }
                              }}
                              className="w-full px-3 py-1.5 border border-amber-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-amber-500 focus:border-amber-600 bg-white"
                              required
                            />
                            <p className="text-[9px] text-amber-700/80 leading-normal">
                              💡 Tip: Press <strong className="font-bold">Enter</strong> or click away to append to the department select lists.
                            </p>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Corporate Role Designation</label>
                        <select
                          value={regRole}
                          onChange={(e) => setRegRole(e.target.value as "employee" | "head" | "admin")}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-white focus:ring-1 focus:ring-slate-900 focus:border-slate-950"
                        >
                          <option value="employee">Regular Employee</option>
                          <option value="head">Department Head</option>
                          <option value="admin">Administrator</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Access Password</label>
                        <input
                          type="password"
                          placeholder="Define credentials password"
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-slate-900 focus:border-slate-950"
                          required
                        />
                      </div>

                      <div className="flex items-end">
                        <button
                          type="submit"
                          className="w-full bg-slate-950 hover:bg-slate-900 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition cursor-pointer"
                        >
                          Onboard Staff Member
                        </button>
                      </div>
                    </form>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <span className="font-extrabold text-xs text-slate-800 uppercase tracking-widest font-mono">Onboarded Workforce Roster</span>
                      <span className="text-[10px] text-gray-500 bg-slate-100 p-1 px-2.5 rounded-lg border border-slate-200">Segment Code: {currentUser.enterpriseCode}</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse font-sans">
                        <thead>
                          <tr className="bg-slate-50 uppercase font-bold text-[9px] tracking-wider text-slate-500 border-b border-gray-150">
                            <th className="p-3">Staff Filer Name</th>
                            <th className="p-3">Employee Code</th>
                            <th className="p-3">Email Address</th>
                            <th className="p-3">Designation Role</th>
                            <th className="p-3">Joined Date</th>
                            <th className="p-3">Department</th>
                            <th className="p-3">Approval Authority</th>
                            <th className="p-3">CC Expenses Viewer</th>
                            <th className="p-3">Active status</th>
                            <th className="p-3 text-right">Toggle active/inactive status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                          {employeesList.map((emp) => (
                            <tr key={emp.id} className="hover:bg-slate-50/50">
                              <td className="p-3 font-bold text-slate-900">{emp.name}</td>
                              <td className="p-3 font-mono font-bold text-slate-650">{emp.employeeCode}</td>
                              <td className="p-3 text-slate-600">{emp.email}</td>
                              <td className="p-3">
                                <span className={`inline-block px-1.5 py-0.5 rounded-md text-[9px] uppercase font-mono font-extrabold ${
                                  emp.role === "head" 
                                    ? "bg-indigo-50 text-indigo-750 border border-indigo-200" 
                                    : emp.role === "admin"
                                    ? "bg-amber-50 text-amber-750 border border-amber-200"
                                    : "bg-slate-100 text-slate-750 border border-slate-200"
                                }`}>
                                  {emp.role === "head" ? "Dept Head" : emp.role === "admin" ? "Admin" : "Employee"}
                                </span>
                              </td>
                              <td className="p-3 font-mono">{emp.doj}</td>
                              <td className="p-3">{emp.department}</td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <span className={`inline-block px-1.5 py-0.5 rounded-md text-[9px] uppercase font-mono font-extrabold ${
                                    emp.role === "employee"
                                      ? emp.canApproveRequests
                                        ? "bg-purple-100 text-purple-800 border border-purple-250"
                                        : "bg-slate-100 text-slate-400 border border-slate-200 font-normal"
                                      : "bg-teal-50 text-teal-850 border border-teal-200"
                                  }`}>
                                    {emp.role === "employee" 
                                      ? (emp.canApproveRequests ? "Enabled" : "Disabled") 
                                      : "Always Enabled"
                                    }
                                  </span>
                                  {emp.role === "employee" && (currentUser.role === "admin" || currentUser.role === "superadmin") && (
                                    <button
                                      onClick={() => toggleApprovalAuthority(emp.id, emp.canApproveRequests)}
                                      className="text-[9px] cursor-pointer text-slate-650 hover:text-slate-950 font-bold border border-slate-300 rounded px-1.5 py-0.5 bg-slate-50 hover:bg-slate-100 font-sans"
                                    >
                                      Toggle
                                    </button>
                                  )}
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <span className={`inline-block px-1.5 py-0.5 rounded-md text-[9px] uppercase font-mono font-extrabold ${
                                    emp.role === "admin" || emp.role === "superadmin"
                                      ? "bg-indigo-50 text-indigo-850 border border-indigo-200"
                                      : emp.canViewCreditCardExpenses
                                      ? "bg-indigo-100 text-indigo-800 border border-indigo-250"
                                      : "bg-slate-100 text-slate-400 border border-slate-200 font-normal"
                                  }`}>
                                    {emp.role === "admin" || emp.role === "superadmin"
                                      ? "Always Enabled"
                                      : (emp.canViewCreditCardExpenses ? "Enabled" : "Disabled")
                                    }
                                  </span>
                                  {emp.role !== "admin" && emp.role !== "superadmin" && (currentUser.role === "admin" || currentUser.role === "superadmin") && (
                                    <button
                                      onClick={() => toggleCreditCardExpensesViewer(emp.id, emp.canViewCreditCardExpenses)}
                                      className="text-[9px] cursor-pointer text-slate-650 hover:text-slate-950 font-bold border border-slate-300 rounded px-1.5 py-0.5 bg-slate-50 hover:bg-slate-100 font-sans"
                                    >
                                      Toggle
                                    </button>
                                  )}
                                </div>
                              </td>
                              <td className="p-3">
                                <span className={`inline-block px-1.5 py-0.5 rounded-md text-[9px] uppercase font-mono font-bold ${emp.status === "active" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
                                  {emp.status}
                                </span>
                              </td>
                              <td className="p-3 text-right">
                                <button
                                  onClick={() => toggleEmployeeStatus(emp.id, emp.status)}
                                  className={`p-1 px-2.5 rounded-lg text-[10px] font-extrabold uppercase border cursor-pointer ${emp.status === "active" ? "bg-red-50 hover:bg-red-100 text-red-850 border-red-200" : "bg-emerald-50 hover:bg-emerald-100 text-emerald-850 border-emerald-250"}`}
                                >
                                  {emp.status === "active" ? "Disable credentials" : "Enable credentials"}
                                </button>
                              </td>
                            </tr>
                          ))}
                          {employeesList.length === 0 && (
                            <tr>
                              <td colSpan={9} className="p-6 text-center text-gray-405 leading-normal">
                                No employees onboarded under corporate workspace code {currentUser.enterpriseCode}. Invite staff to list and manage profiles.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}

              {/* PAGE 5: AUDIT LOGS INCIDENTS */}
              {currentPage === "audit-logs" && (
                <div className="space-y-6 max-w-5xl mx-auto animate-fade-in" id="audit-logs-page">
                  
                  <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <span className="font-extrabold text-xs text-slate-800 uppercase tracking-widest font-mono">System Audit timeline logs</span>
                      <span className="text-[10px] text-gray-500 font-mono">Governance Compliance: isolated</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse font-sans">
                        <thead>
                          <tr className="bg-slate-50 uppercase font-bold text-[9px] tracking-wider text-slate-500 border-b border-gray-150">
                            <th className="p-3">Incident ID</th>
                            <th className="p-3">Timestamp ISO</th>
                            <th className="p-3">User</th>
                            <th className="p-3 font-mono">Operation</th>
                            <th className="p-3">Action Description</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-semibold text-slate-650">
                          {auditLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-slate-50/50">
                              <td className="p-3 font-mono font-bold text-slate-600">{log.id}</td>
                              <td className="p-3 font-mono text-[10px] text-gray-450">{new Date(log.timestamp).toLocaleString()}</td>
                              <td className="p-3 text-slate-800 font-bold">{log.userName} (ID: {log.userId})</td>
                              <td className="p-3">
                                <span className="bg-slate-100 text-slate-800 font-mono text-[10px] font-extrabold p-1 px-2.5 rounded-lg border border-slate-200">
                                  {log.action}
                                </span>
                              </td>
                              <td className="p-3 text-xs font-semibold text-slate-800">{log.details}</td>
                            </tr>
                          ))}
                          {auditLogs.length === 0 && (
                            <tr>
                              <td colSpan={5} className="p-6 text-center text-gray-400">Compliance records clean. No active incidents.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}

              {/* PAGE 6: DOCUMENT NUMBERING CONFIGURATOR (ADMIN SPECIFIC) */}
              {currentPage === "numbering-settings" && currentUser && (
                <div className="space-y-6 max-w-5xl mx-auto animate-fade-in text-slate-800" id="numbering-settings-page">
                  <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="space-y-1 z-10">
                      <span className="font-extrabold text-[10px] uppercase text-amber-400 tracking-wider font-mono">Enterprise Controls</span>
                      <h2 className="text-xl font-black">Sequential Document Numbering Configurator</h2>
                      <p className="text-slate-300 text-xs">Define independent custom format prefix counters & sequence starting value. Changes apply only to future documents.</p>
                    </div>
                    <div className="bg-slate-800 hover:bg-slate-700 px-4 py-3 rounded-xl border border-slate-705 font-mono text-center z-10 self-start md:self-auto">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Enterprise Code</span>
                      <strong className="text-amber-300 text-md tracking-wider leading-none">{currentUser.enterpriseCode}</strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* CV Config Card */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b pb-2">
                          <div className="flex items-center space-x-2">
                            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg font-bold text-xs uppercase font-mono">CV</span>
                            <span className="font-extrabold text-sm text-slate-850">Cash Voucher Sequential</span>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={cvEnabled}
                              onChange={(e) => setCvEnabled(e.target.checked)}
                            />
                            <div className="w-9 h-5 bg-gray-250 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-350 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-emerald-500"></div>
                          </label>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <label className="block text-slate-500 font-semibold mb-1">Prefix Code (Max 5 chars)</label>
                            <input
                              type="text"
                              maxLength={5}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold uppercase focus:outline-none focus:border-slate-400 text-slate-800"
                              value={cvPrefix}
                              onChange={(e) => setCvPrefix(e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))}
                              disabled={!cvEnabled}
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 font-semibold mb-1">Starting Number</label>
                            <input
                              type="number"
                              min={1}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold focus:outline-none focus:border-slate-400 text-slate-800"
                              value={cvStarting}
                              onChange={(e) => setCvStarting(Math.max(1, Number(e.target.value) || 1))}
                              disabled={!cvEnabled}
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-slate-500 font-semibold mb-1">Leading Zeros Padding Size</label>
                            <select
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold focus:outline-none text-slate-800"
                              value={cvZeros}
                              onChange={(e) => setCvZeros(Number(e.target.value))}
                              disabled={!cvEnabled}
                            >
                              <option value={2}>2 Zeros Padding (e.g. {cvPrefix || "CV"}-01)</option>
                              <option value={3}>3 Zeros Padding (e.g. {cvPrefix || "CV"}-001)</option>
                              <option value={4}>4 Zeros Padding (e.g. {cvPrefix || "CV"}-0001)</option>
                              <option value={5}>5 Zeros Padding (e.g. {cvPrefix || "CV"}-00001)</option>
                              <option value={6}>6 Zeros Padding (e.g. {cvPrefix || "CV"}-000001)</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {cvEnabled && (
                        <div className="bg-slate-50 p-3 rounded-xl border border-dashed mt-4 text-[11px] text-slate-500">
                          <span>Next expected preview number generation format: </span>
                          <strong className="block text-slate-800 font-mono text-center mt-1 text-xs">
                            {cvPrefix || "CV"}-{String(numberingSettings?.counters?.CV ? Math.max(cvStarting, numberingSettings.counters.CV + 1) : cvStarting).padStart(cvZeros, "0")}
                          </strong>
                        </div>
                      )}
                    </div>

                    {/* LC Config Card */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b pb-2">
                          <div className="flex items-center space-x-2">
                            <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg font-bold text-xs uppercase font-mono">LC</span>
                            <span className="font-extrabold text-sm text-slate-850">Local Conveyance Sequential</span>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={lcEnabled}
                              onChange={(e) => setLcEnabled(e.target.checked)}
                            />
                            <div className="w-9 h-5 bg-gray-250 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-350 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-amber-550"></div>
                          </label>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <label className="block text-slate-500 font-semibold mb-1">Prefix Code (Max 5 chars)</label>
                            <input
                              type="text"
                              maxLength={5}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold uppercase focus:outline-none focus:border-slate-400 text-slate-800"
                              value={lcPrefix}
                              onChange={(e) => setLcPrefix(e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))}
                              disabled={!lcEnabled}
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 font-semibold mb-1">Starting Number</label>
                            <input
                              type="number"
                              min={1}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold focus:outline-none focus:border-slate-400 text-slate-800"
                              value={lcStarting}
                              onChange={(e) => setLcStarting(Math.max(1, Number(e.target.value) || 1))}
                              disabled={!lcEnabled}
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-slate-500 font-semibold mb-1">Leading Zeros Padding Size</label>
                            <select
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold focus:outline-none text-slate-800"
                              value={lcZeros}
                              onChange={(e) => setLcZeros(Number(e.target.value))}
                              disabled={!lcEnabled}
                            >
                              <option value={2}>2 Zeros Padding (e.g. {lcPrefix || "LC"}-01)</option>
                              <option value={3}>3 Zeros Padding (e.g. {lcPrefix || "LC"}-001)</option>
                              <option value={4}>4 Zeros Padding (e.g. {lcPrefix || "LC"}-0001)</option>
                              <option value={5}>5 Zeros Padding (e.g. {lcPrefix || "LC"}-00001)</option>
                              <option value={6}>6 Zeros Padding (e.g. {lcPrefix || "LC"}-000001)</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {lcEnabled && (
                        <div className="bg-slate-50 p-3 rounded-xl border border-dashed mt-4 text-[11px] text-slate-500">
                          <span>Next expected preview number generation format: </span>
                          <strong className="block text-slate-800 font-mono text-center mt-1 text-xs">
                            {lcPrefix || "LC"}-{String(numberingSettings?.counters?.LC ? Math.max(lcStarting, numberingSettings.counters.LC + 1) : lcStarting).padStart(lcZeros, "0")}
                          </strong>
                        </div>
                      )}
                    </div>

                    {/* EV Config Card */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b pb-2">
                          <div className="flex items-center space-x-2">
                            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg font-bold text-xs uppercase font-mono">EV</span>
                            <span className="font-extrabold text-sm text-slate-850">Expense Voucher Sequential</span>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={evEnabled}
                              onChange={(e) => setEvEnabled(e.target.checked)}
                            />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-350 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-blue-500"></div>
                          </label>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <label className="block text-slate-500 font-semibold mb-1">Prefix Code (Max 5 chars)</label>
                            <input
                              type="text"
                              maxLength={5}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold uppercase focus:outline-none focus:border-slate-400 text-slate-800"
                              value={evPrefix}
                              onChange={(e) => setEvPrefix(e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))}
                              disabled={!evEnabled}
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 font-semibold mb-1">Starting Number</label>
                            <input
                              type="number"
                              min={1}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold focus:outline-none focus:border-slate-400 text-slate-800"
                              value={evStarting}
                              onChange={(e) => setEvStarting(Math.max(1, Number(e.target.value) || 1))}
                              disabled={!evEnabled}
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-slate-500 font-semibold mb-1">Leading Zeros Padding Size</label>
                            <select
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold focus:outline-none text-slate-800"
                              value={evZeros}
                              onChange={(e) => setEvZeros(Number(e.target.value))}
                              disabled={!evEnabled}
                            >
                              <option value={2}>2 Zeros Padding (e.g. {evPrefix || "EV"}-01)</option>
                              <option value={3}>3 Zeros Padding (e.g. {evPrefix || "EV"}-001)</option>
                              <option value={4}>4 Zeros Padding (e.g. {evPrefix || "EV"}-0001)</option>
                              <option value={5}>5 Zeros Padding (e.g. {evPrefix || "EV"}-00001)</option>
                              <option value={6}>6 Zeros Padding (e.g. {evPrefix || "EV"}-000001)</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {evEnabled && (
                        <div className="bg-slate-50 p-3 rounded-xl border border-dashed mt-4 text-[11px] text-slate-500">
                          <span>Next expected preview number generation format: </span>
                          <strong className="block text-slate-800 font-mono text-center mt-1 text-xs">
                            {evPrefix || "EV"}-{String(numberingSettings?.counters?.EV ? Math.max(evStarting, numberingSettings.counters.EV + 1) : evStarting).padStart(evZeros, "0")}
                          </strong>
                        </div>
                      )}
                    </div>

                    {/* PV Config Card */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b pb-2">
                          <div className="flex items-center space-x-2">
                            <span className="p-1.5 bg-purple-50 text-purple-600 rounded-lg font-bold text-xs uppercase font-mono">PV</span>
                            <span className="font-extrabold text-sm text-slate-850">Purchase Voucher Sequential</span>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={pvEnabled}
                              onChange={(e) => setPvEnabled(e.target.checked)}
                            />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-350 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-purple-500"></div>
                          </label>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <label className="block text-slate-500 font-semibold mb-1">Prefix Code (Max 5 chars)</label>
                            <input
                              type="text"
                              maxLength={5}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold uppercase focus:outline-none focus:border-slate-400 text-slate-800"
                              value={pvPrefix}
                              onChange={(e) => setPvPrefix(e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))}
                              disabled={!pvEnabled}
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 font-semibold mb-1">Starting Number</label>
                            <input
                              type="number"
                              min={1}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold focus:outline-none focus:border-slate-400 text-slate-800"
                              value={pvStarting}
                              onChange={(e) => setPvStarting(Math.max(1, Number(e.target.value) || 1))}
                              disabled={!pvEnabled}
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-slate-500 font-semibold mb-1">Leading Zeros Padding Size</label>
                            <select
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold focus:outline-none text-slate-800"
                              value={pvZeros}
                              onChange={(e) => setPvZeros(Number(e.target.value))}
                              disabled={!pvEnabled}
                            >
                              <option value={2}>2 Zeros Padding (e.g. {pvPrefix || "PV"}-01)</option>
                              <option value={3}>3 Zeros Padding (e.g. {pvPrefix || "PV"}-001)</option>
                              <option value={4}>4 Zeros Padding (e.g. {pvPrefix || "PV"}-0001)</option>
                              <option value={5}>5 Zeros Padding (e.g. {pvPrefix || "PV"}-00001)</option>
                              <option value={6}>6 Zeros Padding (e.g. {pvPrefix || "PV"}-000001)</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {pvEnabled && (
                        <div className="bg-slate-50 p-3 rounded-xl border border-dashed mt-4 text-[11px] text-slate-500">
                          <span>Next expected preview number generation format: </span>
                          <strong className="block text-slate-800 font-mono text-center mt-1 text-xs">
                            {pvPrefix || "PV"}-{String(numberingSettings?.counters?.PV ? Math.max(pvStarting, numberingSettings.counters.PV + 1) : pvStarting).padStart(pvZeros, "0")}
                          </strong>
                        </div>
                      )}
                    </div>

                    {/* JV Config Card */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b pb-2">
                          <div className="flex items-center space-x-2">
                            <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg font-bold text-xs uppercase font-mono">JV</span>
                            <span className="font-extrabold text-sm text-slate-850">Journal Voucher Sequential</span>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={jvEnabled}
                              onChange={(e) => setJvEnabled(e.target.checked)}
                            />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-350 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-amber-500"></div>
                          </label>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <label className="block text-slate-500 font-semibold mb-1">Prefix Code (Max 5 chars)</label>
                            <input
                              type="text"
                              maxLength={5}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold uppercase focus:outline-none focus:border-slate-400 text-slate-800"
                              value={jvPrefix}
                              onChange={(e) => setJvPrefix(e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))}
                              disabled={!jvEnabled}
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 font-semibold mb-1">Starting Number</label>
                            <input
                              type="number"
                              min={1}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold focus:outline-none focus:border-slate-400 text-slate-800"
                              value={jvStarting}
                              onChange={(e) => setJvStarting(Math.max(1, Number(e.target.value) || 1))}
                              disabled={!jvEnabled}
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-slate-500 font-semibold mb-1">Leading Zeros Padding Size</label>
                            <select
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold focus:outline-none text-slate-800"
                              value={jvZeros}
                              onChange={(e) => setJvZeros(Number(e.target.value))}
                              disabled={!jvEnabled}
                            >
                              <option value={2}>2 Zeros Padding (e.g. {jvPrefix || "JV"}-01)</option>
                              <option value={3}>3 Zeros Padding (e.g. {jvPrefix || "JV"}-001)</option>
                              <option value={4}>4 Zeros Padding (e.g. {jvPrefix || "JV"}-0001)</option>
                              <option value={5}>5 Zeros Padding (e.g. {jvPrefix || "JV"}-00001)</option>
                              <option value={6}>6 Zeros Padding (e.g. {jvPrefix || "JV"}-000001)</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {jvEnabled && (
                        <div className="bg-slate-50 p-3 rounded-xl border border-dashed mt-4 text-[11px] text-slate-500">
                          <span>Next expected preview number generation format: </span>
                          <strong className="block text-slate-800 font-mono text-center mt-1 text-xs">
                            {jvPrefix || "JV"}-{String(numberingSettings?.counters?.JV ? Math.max(jvStarting, numberingSettings.counters.JV + 1) : jvStarting).padStart(jvZeros, "0")}
                          </strong>
                        </div>
                      )}
                    </div>

                    {/* CCE Config Card */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b pb-2">
                          <div className="flex items-center space-x-2">
                            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg font-bold text-xs uppercase font-mono">CCE</span>
                            <span className="font-extrabold text-sm text-slate-850">Credit Card Expense Sequential</span>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={ccEnabled}
                              onChange={(e) => setCcEnabled(e.target.checked)}
                            />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-350 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-indigo-500"></div>
                          </label>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <label className="block text-slate-500 font-semibold mb-1">Prefix Code (Max 5 chars)</label>
                            <input
                              type="text"
                              maxLength={5}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold uppercase focus:outline-none focus:border-slate-400 text-slate-800"
                              value={ccPrefix}
                              onChange={(e) => setCcPrefix(e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))}
                              disabled={!ccEnabled}
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 font-semibold mb-1">Starting Number</label>
                            <input
                              type="number"
                              min={1}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold focus:outline-none focus:border-slate-400 text-slate-800"
                              value={ccStarting}
                              onChange={(e) => setCcStarting(Math.max(1, Number(e.target.value) || 1))}
                              disabled={!ccEnabled}
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-slate-500 font-semibold mb-1">Leading Zeros Padding Size</label>
                            <select
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold focus:outline-none text-slate-800"
                              value={ccZeros}
                              onChange={(e) => setCcZeros(Number(e.target.value))}
                              disabled={!ccEnabled}
                            >
                              <option value={2}>2 Zeros Padding (e.g. {ccPrefix || "CCE"}-01)</option>
                              <option value={3}>3 Zeros Padding (e.g. {ccPrefix || "CCE"}-001)</option>
                              <option value={4}>4 Zeros Padding (e.g. {ccPrefix || "CCE"}-0001)</option>
                              <option value={5}>5 Zeros Padding (e.g. {ccPrefix || "CCE"}-00001)</option>
                              <option value={6}>6 Zeros Padding (e.g. {ccPrefix || "CCE"}-000001)</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {ccEnabled && (
                        <div className="bg-slate-50 p-3 rounded-xl border border-dashed mt-4 text-[11px] text-slate-500">
                          <span>Next expected preview number generation format: </span>
                          <strong className="block text-slate-800 font-mono text-center mt-1 text-xs">
                            {ccPrefix || "CCE"}-{String(numberingSettings?.counters?.CCE ? Math.max(ccStarting, numberingSettings.counters.CCE + 1) : ccStarting).padStart(ccZeros, "0")}
                          </strong>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-150 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <span className="text-[11px] text-slate-500 font-medium font-sans">Click update settings to save prefix rules to Firestore. Only authorized admins can change these metrics & counters.</span>
                    <button
                      type="button"
                      onClick={updateNumberingSettings}
                      className="bg-slate-900 text-white font-bold tracking-tight text-xs py-2.5 px-6 rounded-xl hover:bg-slate-800 cursor-pointer shadow transition w-full sm:w-auto"
                    >
                      Save Settings Configuration
                    </button>
                  </div>

                  {/* Disaster Recovery & Resiliency Card */}
                  <div className="bg-white rounded-2xl border border-slate-150 p-6 shadow-sm space-y-6">
                    <div className="border-b pb-4">
                      <h3 className="text-sm font-extrabold text-slate-850 flex items-center gap-2">
                        <span className="p-1 px-2 bg-slate-150 text-slate-700 text-[10px] rounded uppercase font-mono font-bold">Resiliency</span>
                        Database Backup & Disaster Recovery Center
                      </h3>
                      <p className="text-slate-500 text-[11px] mt-1">
                        Secure lifetime data preservation. Download the complete system database (users, requests/forms, local conveyance expenses, approvals, logs, and commissions) as an offline backup file, or upload any previous snapshot to instantly restore system records cleanly using a retentive safe-merge architecture.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Export Section */}
                      <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold text-slate-800">Export Raw System Snapshot</h4>
                          <p className="text-[11px] text-slate-500">
                            Generates a complete, structured JSON archive containing active configurations, vouchers, and compliance logs. Save this file offline for permanent, lifelong auditing or migration logs.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const response = await fetch("/api/database/backup-export", { headers: apiHeaders });
                              if (!response.ok) throw new Error("Could not download backup file.");
                              const data = await response.json();
                              const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                              const url = URL.createObjectURL(blob);
                              const link = document.createElement("a");
                              link.href = url;
                              link.download = `apruv_enterprise_${currentUser.enterpriseCode}_backup_${Date.now()}.json`;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              setAppSuccess("Database backup file downloaded successfully!");
                              setTimeout(() => setAppSuccess(""), 4000);
                            } catch (err: any) {
                              setAppError(err.message || "Failed to download backup snapshot");
                              setTimeout(() => setAppError(""), 4000);
                            }
                          }}
                          className="w-full bg-slate-900 border border-slate-800 text-white hover:bg-slate-800 text-xs font-bold py-2 px-4 rounded-xl cursor-pointer transition flex items-center justify-center gap-2 mt-2"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download Complete offline Backup (.json)
                        </button>
                      </div>

                      {/* Import/Restore Section */}
                      <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold text-slate-800">Import & Restore Database</h4>
                          <p className="text-[11px] text-slate-500">
                            Perform a secure Disaster Recovery restore. Upload your previously downloaded backup JSON file to safely merge elements back into both local memory and Cloud Firestore.
                          </p>
                        </div>

                        <div className="space-y-3">
                          <input
                            type="file"
                            accept=".json"
                            id="backup-upload-input"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onload = async (event) => {
                                try {
                                  const text = event.target?.result as string;
                                  const parsed = JSON.parse(text);
                                  if (!parsed.data || typeof parsed.data !== "object") {
                                    throw new Error("Invalid backup format. Missing core dataset dictionary.");
                                  }
                                  
                                  const c = parsed.dataCount || { requests: 0, commissions: 0, users: 0 };
                                  if (confirm(`Are you sure you want to merge and import this backup snapshot?\n\nContains:\n- ${c.requests || 0} Purchase Forms/Vouchers\n- ${c.commissions || 0} Commissions\n- ${c.users || 0} Users/Employees\n\nExisting records will remain intact (safe-merge). Proceed?`)) {
                                    const res = await fetch("/api/database/restore-import", {
                                      method: "POST",
                                      headers: { ...apiHeaders, "Content-Type": "application/json" },
                                      body: JSON.stringify({ importData: parsed })
                                    });
                                    const result = await res.json();
                                    if (!res.ok) throw new Error(result.error || "Failed to restore backup.");
                                    
                                    setAppSuccess(result.message || "Database backup restored/merged successfully!");
                                    setTimeout(() => setAppSuccess(""), 5000);
                                    
                                    // Refresh states
                                    if (typeof fetchRequests === "function") fetchRequests();
                                    if (typeof fetchEmployees === "function") fetchEmployees();
                                    if (typeof fetchCommissions === "function") fetchCommissions();
                                    if (typeof fetchAuditLogs === "function") fetchAuditLogs();
                                    if (typeof fetchNotifications === "function") fetchNotifications();
                                    if (typeof fetchDashboardMetrics === "function") fetchDashboardMetrics();
                                  }
                                } catch (err: any) {
                                  setAppError("Restoration Failed: " + (err.message || "Invalid JSON backup file structural shape"));
                                  setTimeout(() => setAppError(""), 5050);
                                }
                              };
                              reader.readAsText(file);
                              e.target.value = "";
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => document.getElementById("backup-upload-input")?.click()}
                            className="w-full bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl cursor-pointer transition flex items-center justify-center gap-2 border border-slate-700"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            Upload/Restore JSON Backup Snapshot
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PAGE 6.5: CORPORATE CREDIT CARDS MASTER (ADMIN SPECIFIC) */}
              {currentPage === "corporate-credit-cards" && (currentUser.role === "admin" || currentUser.role === "superadmin") && (
                <div className="bg-slate-950 text-white rounded-3xl p-6 shadow-xl border border-slate-900 max-w-7xl mx-auto animate-fade-in" id="corporate-credit-cards-master-page">
                  <CreditCardMaster
                    apiHeaders={apiHeaders}
                    auditLogs={auditLogs}
                    setAuditLogs={setAuditLogs}
                    currentUser={currentUser}
                  />
                </div>
              )}

              {/* PAGE 6.5: CORPORATE CREDIT CARDS MASTER (ADMIN SPECIFIC) */}
              {currentPage === "corporate-credit-cards" && (currentUser.role === "admin" || currentUser.role === "superadmin") && (
                <div className="bg-slate-950 text-white rounded-3xl p-6 shadow-xl border border-slate-900 max-w-7xl mx-auto animate-fade-in" id="corporate-credit-cards-master-page">
                  <CreditCardMaster
                    apiHeaders={apiHeaders}
                    auditLogs={auditLogs}
                    setAuditLogs={setAuditLogs}
                    currentUser={currentUser}
                  />
                </div>
              )}

              {/* PAGE 6.7: CREDIT CARD EXPENSE SUBPAGE (FILING + AUTHORIZED VIEWING SUB-LEDGER) */}
              {currentPage === "credit-card-expense" && (() => {
                const creditCardRequests = requestsList.filter((r) => r.category === "Credit Card Expense");
                return (
                  <div className="space-y-6 max-w-5xl mx-auto animate-fade-in text-slate-800" id="credit-card-expense-page">
                  
                  {/* Sequence continuation indicator banner */}
                  <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center space-x-3">
                      <span className="p-2 bg-indigo-100 text-indigo-700 rounded-xl font-bold font-mono text-xs">
                        CCE
                      </span>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-indigo-800 tracking-wider block font-mono">Credit Card Expense Series</span>
                        <strong className="text-xs font-semibold text-slate-700 mt-0.5 block">
                          Next expected sequential document number:
                        </strong>
                      </div>
                    </div>
                    <div className="bg-white border border-indigo-200 p-2.5 px-4 rounded-xl text-center md:text-right font-mono">
                      <span className="text-[9px] text-indigo-600 font-bold block uppercase tracking-tight">Enterprise Auto-Sequence Code</span>
                      <strong className="text-indigo-900 text-base font-extrabold tracking-wider">
                        {ccVoucherNo || getNextDocumentNoPreview("Credit Card Expense")}
                      </strong>
                    </div>
                  </div>

                  {/* Form Container Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Main Filing claim form */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-150 p-6 shadow-sm space-y-4" id="cc-expense-filing-form">
                      <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                        <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">
                          File Corporate Credit Card Charge
                        </h3>
                        <span className="text-[9px] uppercase font-mono font-bold bg-slate-100 p-1 px-2 rounded border">
                          Filing Form CCE
                        </span>
                      </div>

                      <div className="space-y-4 text-xs font-semibold">
                        
                         {/* Select Corporate Credit Card */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase">
                              Select Corporate Credit Card *
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                setShowAddCcForm(!showAddCcForm);
                                setCcAddError("");
                                setCcAddSuccess("");
                              }}
                              className="text-[10px] font-extrabold text-indigo-600 hover:text-indigo-800 cursor-pointer flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 rounded-lg px-2 py-1 border border-indigo-150 transition"
                            >
                              {showAddCcForm ? "Cancel Add Card" : "+ Add Card"}
                            </button>
                          </div>

                          {showAddCcForm && (
                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-3 space-y-3 animate-fade-in" id="cc-quick-add-form-container">
                              <span className="font-extrabold text-[10px] uppercase text-indigo-900 tracking-wider font-mono block">Quickly Register Corporate Card</span>
                              
                              {ccAddError && (
                                <div className="p-2.5 bg-red-50 text-red-700 text-[11px] rounded-lg border border-red-200 font-semibold">
                                  ⚠️ {ccAddError}
                                </div>
                              )}
                              
                              {ccAddSuccess && (
                                <div className="p-2.5 bg-emerald-50 text-emerald-700 text-[11px] rounded-lg border border-emerald-200 font-semibold">
                                  ✓ {ccAddSuccess}
                                </div>
                              )}

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Cardholder Name *</label>
                                  <input
                                    type="text"
                                    placeholder="e.g. Rajesh Kumar"
                                    value={quickCardholderName}
                                    onChange={(e) => setQuickCardholderName(e.target.value)}
                                    className="w-full bg-white border border-slate-250 rounded-xl p-2.5 font-semibold text-slate-800 focus:ring-1 focus:ring-slate-900 focus:border-indigo-500 text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Card Name *</label>
                                  <input
                                    type="text"
                                    placeholder="e.g. ICICI Corporate Visa"
                                    value={quickCardName}
                                    onChange={(e) => setQuickCardName(e.target.value)}
                                    className="w-full bg-white border border-slate-250 rounded-xl p-2.5 font-semibold text-slate-800 focus:ring-1 focus:ring-slate-900 focus:border-indigo-500 text-xs"
                                  />
                                </div>
                              </div>
                              <div className="flex justify-end gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={handleQuickAddCard}
                                  className="bg-indigo-600 hover:bg-slate-900 text-white font-extrabold text-[10px] px-3.5 py-1.5 rounded-lg transition shadow-sm cursor-pointer"
                                >
                                  Save Corporate Card
                                </button>
                              </div>
                            </div>
                          )}

                          {/* repeating table structure for multiple credit card transactions */}
                          <div className="border border-indigo-150 rounded-2xl overflow-hidden bg-slate-50/40 p-4 space-y-4" id="grouped-cce-transactions-card">
                            <div className="flex items-center justify-between border-b pb-2 border-slate-200">
                              <div>
                                <span className="font-extrabold text-[10px] text-indigo-950 uppercase font-mono block tracking-wide">Itemised Corporate Transactions *</span>
                                <span className="text-[10px] text-slate-500 font-medium leading-tight">Create multiple card transactions grouped under this single CCE voucher.</span>
                              </div>
                              <button
                                type="button"
                                onClick={handleAddCcTxRow}
                                className="text-[10px] font-black uppercase text-white bg-indigo-650 hover:bg-slate-900 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                              >
                                <span>➕</span>
                                <span>Add Transaction</span>
                              </button>
                            </div>

                            <div className="space-y-3">
                              {ccTransactions.map((tx, idx) => (
                                <div 
                                  key={tx.id || idx} 
                                  className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative space-y-3 animate-fade-in group hover:border-indigo-200 transition"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-extrabold text-indigo-900 font-mono">Row #{idx + 1}</span>
                                    {ccTransactions.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveCcTxRow(idx)}
                                        className="text-red-600 hover:text-red-800 text-[10px] font-bold px-2 py-1 hover:bg-red-50 rounded transition cursor-pointer"
                                      >
                                        Delete Row
                                      </button>
                                    )}
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                                    {/* Card Detail Select */}
                                    <div className="md:col-span-4">
                                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Card Detail *</label>
                                      <select
                                        value={tx.cardId}
                                        onChange={(e) => handleUpdateCcTx(idx, "cardId", e.target.value)}
                                        className="w-full p-2 border border-slate-250 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-indigo-500 bg-white"
                                      >
                                        <option value="">-- Card Dropdown --</option>
                                        {creditCardsList
                                          .filter(c => c.status === "Active")
                                          .map((card) => (
                                            <option key={card.id} value={card.id}>
                                              {card.cardName} &bull; {card.cardholderName}
                                            </option>
                                          ))}
                                      </select>
                                    </div>

                                    {/* Description Particulars */}
                                    <div className="md:col-span-5">
                                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Description *</label>
                                      <input
                                        type="text"
                                        placeholder="e.g. Flight ticket, Server invoice..."
                                        value={tx.description}
                                        onChange={(e) => handleUpdateCcTx(idx, "description", e.target.value)}
                                        className="w-full p-2 border border-slate-250 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-indigo-500 bg-white"
                                      />
                                    </div>

                                    {/* Charge Amount (INR) */}
                                    <div className="md:col-span-3">
                                      <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Amount * (₹)</label>
                                      <input
                                        type="number"
                                        placeholder="0.00"
                                        min={0.01}
                                        step="any"
                                        value={tx.amount}
                                        onChange={(e) => handleUpdateCcTx(idx, "amount", e.target.value)}
                                        className="w-full p-2 border border-slate-250 rounded-lg text-xs font-mono font-extrabold text-[#111827] focus:ring-1 focus:ring-indigo-500 bg-white"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Calculated aggregate total CCE amount indicator */}
                            <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl flex items-center justify-between">
                              <span className="text-[10px] uppercase font-bold text-indigo-900 tracking-wider font-mono">Consolidated Grouped CCE Total:</span>
                              <strong className="text-sm font-mono font-extrabold text-[#111827]">
                                ₹ {ccTransactions.reduce((acc, current) => acc + Number(current.amount || 0), 0).toLocaleString("en-IN")}.00
                              </strong>
                            </div>
                          </div>

                          {/* Transaction General Date */}
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                              Filing Statement / Transaction Date *
                            </label>
                            <input
                              type="date"
                              value={ccExpenseDate}
                              onChange={(e) => setCcExpenseDate(e.target.value)}
                              className="w-full px-3 py-2.5 border border-slate-205 rounded-xl text-slate-800 font-bold focus:ring-1 focus:ring-slate-900 focus:border-slate-950 bg-white text-xs"
                            />
                          </div>
                        </div>

                        {/* Expense Head & Scheme classification */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                              Expense Head / Category Classification
                            </label>
                            <select
                              value={ccExpenseHead}
                              onChange={(e) => setCcExpenseHead(e.target.value)}
                              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-850 focus:ring-1 focus:ring-slate-900 focus:border-slate-950"
                            >
                              <option value="IT Infrastructure & Hosting">IT Infrastructure & Hosting</option>
                              <option value="SaaS & Softwares">SaaS & Softwares</option>
                              <option value="Sales & Marketing Outlay">Sales & Marketing Outlay</option>
                              <option value="Travel fare / Conveyance ticket">Travel fare / Conveyance ticket</option>
                              <option value="Client Lodging & Hotel Expense">Client Lodging & Hotel Expense</option>
                              <option value="Office Equipment & Stationery">Office Equipment & Stationery</option>
                              <option value="Others / Special Contingency">Others / Special Contingency</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                              Expense Type
                            </label>
                            <select
                              value={ccExpenseType}
                              onChange={(e) => setCcExpenseType(e.target.value as "Standard" | "OTA")}
                              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-850 focus:ring-1 focus:ring-slate-900 focus:border-slate-950 font-bold"
                            >
                              <option value="Standard">Standard Corporate Charge</option>
                              <option value="OTA">Linked Outstation Travel (OTA)</option>
                            </select>
                          </div>
                        </div>

                        {/* Conditional linked OTA Number */}
                        {ccExpenseType === "OTA" && (() => {
                          const travelRequestsList = requestsList.filter((r) => {
                            const cat = (r.category || "").toLowerCase();
                            const docNum = (r.documentNumber || "").toUpperCase();
                            return cat.includes("travel") || cat.includes("ota") || docNum.startsWith("OTA") || docNum.startsWith("TE");
                          });
                          return (
                            <div className="animate-fade-in bg-slate-50 p-3.5 rounded-xl border space-y-3">
                              <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                                  Select Travel / OTA Request (From Website) *
                                </label>
                                {travelRequestsList.length > 0 ? (
                                  <select
                                    value={ccManualOta ? "" : ccLinkedOtaNo}
                                    onChange={(e) => {
                                      setCcLinkedOtaNo(e.target.value);
                                      setCcManualOta(false);
                                    }}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-slate-900 focus:border-slate-950 bg-white text-slate-800"
                                  >
                                    <option value="">-- Choose active request on the platform --</option>
                                    {travelRequestsList.map((tr) => (
                                      <option key={tr.id} value={tr.documentNumber || tr.id}>
                                        {tr.documentNumber || "Unnumbered Request"} &bull; {tr.employeeName} &bull; {tr.projectName} (INR {Number(tr.totalBudget).toLocaleString()})
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <div className="text-[11px] text-amber-700 bg-amber-50 p-2 border border-amber-200 rounded-lg font-medium">
                                    No travel/OTA records discovered in the system.
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center space-x-2 pt-1">
                                <input
                                  type="checkbox"
                                  id="cc-manual-ota-check"
                                  checked={ccManualOta}
                                  onChange={(e) => {
                                    setCcManualOta(e.target.checked);
                                    if (!e.target.checked) {
                                      setCcLinkedOtaNo("");
                                    }
                                  }}
                                  className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer h-3.5 w-3.5"
                                />
                                <label htmlFor="cc-manual-ota-check" className="text-[10px] text-slate-500 font-bold select-none cursor-pointer">
                                  Enter Travel Document Code manually (Fallback)
                                </label>
                              </div>

                              {(ccManualOta || travelRequestsList.length === 0) && (
                                <div className="space-y-1 animate-fade-in">
                                  <label className="block text-[9px] font-bold text-slate-500 uppercase">
                                    Manual Travel Document/Ticket ID
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="e.g. OTA-0021"
                                    value={ccManualOta ? ccLinkedOtaNo : ""}
                                    onChange={(e) => {
                                      setCcLinkedOtaNo(e.target.value.toUpperCase());
                                      setCcManualOta(true);
                                    }}
                                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono focus:ring-1 focus:ring-slate-900 focus:border-slate-950 bg-white text-slate-800"
                                  />
                                </div>
                              )}

                              <span className="text-[10px] text-slate-450 block mt-1">
                                Associates this credit card transaction directly to travel audit trails.
                              </span>
                            </div>
                          );
                        })()}

                        {/* File Upload Attachment Area */}
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                            Attach Digital Charge Proofs / Invoices / Statements *
                          </label>
                          
                          <div 
                            className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center cursor-pointer hover:bg-slate-50 hover:border-slate-400 transition"
                            onClick={() => document.getElementById("cc-drag-file-uploader")?.click()}
                          >
                            <input 
                              type="file" 
                              id="cc-drag-file-uploader" 
                              multiple 
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files) processCcFiles(e.target.files);
                              }}
                            />
                            <span className="text-xl block mb-1">📥</span>
                            <span className="text-xs font-bold block text-slate-800">Drag transaction receipt images here, or browse local files</span>
                            <span className="text-[9px] text-slate-400 block mt-0.5">High fidelity optimized base64 formatting automatic payload compression matches regulations</span>
                          </div>

                          {/* Render ccAttachments state list */}
                          {ccAttachments.length > 0 && (
                            <div className="mt-3 space-y-2">
                              <span className="text-[10px] uppercase font-bold text-slate-600 font-mono tracking-wider block">Attached files:</span>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {ccAttachments.map((attCode, attIdx) => {
                                  const parts = attCode.split("|");
                                  const fName = parts[0] || `Attachment #${attIdx + 1}`;
                                  return (
                                    <div key={attIdx} className="flex items-center justify-between p-2 bg-indigo-50 border border-indigo-150 rounded-xl">
                                      <span className="text-[10px] font-mono truncate max-w-xs font-bold text-indigo-900">{fName}</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setCcAttachments(ccAttachments.filter((_, i) => i !== attIdx));
                                        }}
                                        className="text-[9px] px-1.5 py-0.5 bg-white text-red-650 hover:bg-red-50 hover:text-red-800 border rounded cursor-pointer font-bold"
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Remarks */}
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                            Internal Auditors Remarks (Optional)
                          </label>
                          <input
                            type="text"
                            placeholder="Add memo or other information details..."
                            value={ccRemarks}
                            onChange={(e) => setCcRemarks(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 font-semibold"
                          />
                        </div>

                        {/* Authorization destination selectors */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block font-mono">Authorization routing destination</span>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Department Head Approval</label>
                              <select
                                className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-none"
                                value={selectedHeadId}
                                onChange={(e) => setSelectedHeadId(e.target.value)}
                              >
                                <option value="">-- Choose Head --</option>
                                {departmentHeads.map((h) => (
                                  <option key={h.id} value={h.id}>{h.name} ({h.department || "No Dept"})</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Admin Audit</label>
                              <select
                                className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-none"
                                value={selectedAdminId}
                                onChange={(e) => setSelectedAdminId(e.target.value)}
                              >
                                <option value="">-- Choose Admin --</option>
                                {administrators.map((a) => (
                                  <option key={a.id} value={a.id}>{a.name}</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Super Admin Final lock</label>
                              <select
                                className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-none"
                                value={selectedSuperAdminId}
                                onChange={(e) => setSelectedSuperAdminId(e.target.value)}
                              >
                                <option value="">-- Choose Super Admin --</option>
                                {superAdministrators.map((s) => (
                                  <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={saveCreditCardExpenseForm}
                            disabled={loading}
                            className="w-full font-black text-xs py-3 px-6 rounded-xl text-center bg-indigo-650 tracking-tight hover:bg-slate-900 text-indigo-150 transition disabled:opacity-50 cursor-pointer shadow-md inline-flex items-center justify-center gap-2"
                          >
                            <span>💳</span>
                            <span>{loading ? "Filing Claim..." : "Dispatch Corporate Credit Card Expense Claim"}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Right side helper info column */}
                    <div className="space-y-6">
                      <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 space-y-3">
                        <span className="font-extrabold text-[10px] uppercase text-indigo-400 tracking-wider font-mono">CC Security Policy</span>
                        <h4 className="text-sm font-extrabold">Corporate Ledger Policy</h4>
                        <p className="text-slate-350 text-[11px] leading-relaxed">
                          Employees holding office credit card authorization are required to log charges within 48 hours of transaction occurrence. Supporting tax invoices must show line-item detail and total segment matching.
                        </p>
                        <span className="block text-[9px] text-slate-500 italic mt-1 bg-slate-950 p-2 rounded border border-slate-850">
                          Subject to dynamic auditing regulations & enterprise isolating code boundaries.
                        </span>
                      </div>

                      {/* Authorized Viewers: List all credit card expenses for tracking segment */}
                      {(currentUser.role === "admin" || currentUser.role === "superadmin" || currentUser.canViewCreditCardExpenses === true) ? (
                        <div className="bg-indigo-950 text-white rounded-2xl p-5 border border-indigo-900 space-y-4 shadow-md">
                          <div className="border-b border-indigo-900 pb-2 flex items-center justify-between">
                            <span className="font-extrabold text-[10px] uppercase text-indigo-300 tracking-wider font-mono">
                              CCE Sub-Ledger
                            </span>
                            <span className="bg-indigo-900 text-indigo-200 text-[8px] font-bold px-1.5 rounded uppercase">
                              Secured
                            </span>
                          </div>
                          
                          <div className="space-y-1">
                            <h4 className="text-xs font-black text-slate-100">Company Credit Card Charges</h4>
                            <p className="text-[10px] text-indigo-200">
                              You have corporate clearance to track and audit all credit card expenses registered under segment code: {currentUser.enterpriseCode}.
                            </p>
                          </div>

                          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                            {creditCardRequests.length === 0 ? (
                              <div className="text-center py-6 text-[10px] text-indigo-300 italic border border-dashed border-indigo-900 rounded-xl">
                                No credit card transactions filed.
                              </div>
                            ) : (
                              creditCardRequests.map((req) => {
                                const expD = req.creditCardDetails;
                                return (
                                  <div key={req.id} className="bg-indigo-900/45 hover:bg-indigo-900/70 p-3 rounded-xl border border-indigo-900 text-[11px] flex flex-col justify-between gap-1 transition">
                                    <div className="flex items-center justify-between">
                                      <span className="font-mono font-bold text-indigo-300">{expD?.voucherNo || req.documentNumber || "Draft No"}</span>
                                      <span className={`inline-block text-[8px] font-bold uppercase rounded px-1 ${
                                        req.status === "Approved" ? "bg-emerald-900/80 text-emerald-300" :
                                        req.status === "Partially Approved" ? "bg-amber-900/80 text-amber-305 border border-amber-500/20" :
                                        req.status === "Pending" ? "bg-amber-900/80 text-amber-300" :
                                        "bg-slate-800 text-slate-400"
                                      }`}>
                                        {req.status === "Partially Approved" ? "Part Approved" : req.status}
                                      </span>
                                    </div>
                                    <div className="text-slate-205 font-bold">{req.projectName}</div>
                                    <div className="text-slate-300 text-[10px] font-light italic mt-0.5">{expD?.description || "No memo statement specified"}</div>
                                    <div className="flex items-center justify-between mt-1 text-[10px] pt-1.5 border-t border-indigo-900/30">
                                      <span className="font-mono text-indigo-200">Date: {expD?.expenseDate || req.createdAt?.substring(0, 10)}</span>
                                      <strong className="text-slate-100 mt-0.5 text-xs font-mono">INR {Number(req.status === "Partially Approved" && req.approvedAmount !== undefined ? req.approvedAmount : (expD?.amount || req.totalBudget)).toLocaleString()}</strong>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white border rounded-2xl p-5 space-y-2">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase font-mono">Viewing Restrict Policy</span>
                          <h4 className="text-xs font-black text-slate-800">Clearance Status: Employee Limited</h4>
                          <p className="text-[10px] text-slate-500 leading-normal">
                            Standard workforce profiles can only review self-filed credit card claims. Sub-ledger transparency is restricted to authorized officers or cardholders flagged explicitly by workspace admins.
                          </p>
                        </div>
                      )}

                    </div>

                  </div>

                </div>
              );
            })()}

              {/* PAGE 7: CENTRALIZED MANAGEMENT RECORDS LEDGER */}
              {currentPage === "centralized-records" && (currentUser.role === "admin" || currentUser.role === "superadmin") && (
                <div className="space-y-6 max-w-7xl mx-auto animate-fade-in text-slate-800" id="centralized-records-page">
                  {/* Ledger Banner */}
                  <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-purple-500/20 text-purple-350 rounded text-[10px] font-bold uppercase tracking-widest font-mono border border-purple-500/30">
                          Centralized View
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">Isolated segment: {currentUser.enterpriseCode}</span>
                      </div>
                      <h2 className="text-xl font-black">Enterprise Centralized Records Hub</h2>
                      <p className="text-slate-300 text-xs text-slate-305">
                        Unified ledger containing every voucher, expense travel itinerary, and purchase record. Complete regulatory transparency and audit oversight.
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={async () => {
                          await fetchRequests();
                          setAppSuccess("Ledger entries synchronized successfully.");
                          setTimeout(() => setAppSuccess(""), 3000);
                        }}
                        className="bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold text-xs py-2.5 px-4 rounded-xl cursor-pointer transition flex items-center gap-1.5"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span>Sync Ledger</span>
                      </button>
                    </div>
                  </div>

                  {/* Dynamic Metrics Panel */}
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-sm">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">Total Ledger Documents</span>
                      <strong className="block text-2xl font-black text-slate-800 mt-1">{requestsList.length}</strong>
                      <span className="text-[10px] text-slate-500">Enterprise records catalog</span>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-sm">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">Completed & Fully Approved</span>
                      <strong className="block text-2xl font-black text-emerald-600 mt-1">
                        {requestsList.filter(r => r.status === "Approved" && !r.cancellationStatus).length}
                      </strong>
                      <span className="text-[10px] text-slate-500">Fully sanctioned spending</span>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-sm">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">Finalized Early Without Escalation</span>
                      <strong className="block text-2xl font-black text-purple-600 mt-1">
                        {
                          requestsList.filter(
                            (r) =>
                              r.status === "Approved" &&
                              !r.cancellationStatus &&
                              (r.finalizedBy || (r.headApprovalStatus === "Approved" && r.stage === "completed" && !r.adminApprovedBy))
                          ).length
                        }
                      </strong>
                      <span className="text-[10px] text-slate-500">Bypassed higher hierarchy levels</span>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-sm">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">Pending Decisions</span>
                      <strong className="block text-2xl font-black text-amber-500 mt-1">
                        {requestsList.filter(r => r.status === "Pending" && !r.cancellationStatus).length}
                      </strong>
                      <span className="text-[10px] text-slate-500">Active approval routes</span>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-sm col-span-2 lg:col-span-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">Voided / Cancelled Records</span>
                      <strong className="block text-2xl font-black text-red-600 mt-1">
                        {requestsList.filter(r => !!r.cancellationStatus).length}
                      </strong>
                      <span className="text-[10px] text-slate-500">Deleted sequence numbers</span>
                    </div>
                  </div>

                  {/* Search and Advanced Filter Tools */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="font-extrabold text-[10px] uppercase tracking-wider text-slate-700 font-mono">
                        Ledger Custom Filters
                      </span>
                      <button
                        onClick={() => {
                          setCentralSearch("");
                          setCentralStatus("All");
                          setCentralEmployee("All");
                          setCentralDepartment("All");
                          setCentralDocType("All");
                          setCentralStage("All");
                        }}
                        className="text-[10px] text-indigo-600 hover:text-indigo-500 font-bold"
                      >
                        Reset All Filters
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
                      {/* Search records */}
                      <div className="col-span-1 md:col-span-3 lg:col-span-2 relative">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                          Keyword Search
                        </label>
                        <div className="relative">
                          <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-450" />
                          <input
                            type="text"
                            placeholder="Search document no, project, creator..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9 pr-3 text-xs font-semibold focus:outline-none focus:border-slate-350 text-slate-850"
                            value={centralSearch}
                            onChange={(e) => setCentralSearch(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Filter by Status */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                          Document Status
                        </label>
                        <select
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-semibold focus:outline-none text-slate-850"
                          value={centralStatus}
                          onChange={(e) => setCentralStatus(e.target.value)}
                        >
                          <option value="All">All Statuses</option>
                          <option value="Pending">Pending Review</option>
                          <option value="Approved">Approved</option>
                          <option value="Rejected">Rejected</option>
                          <option value="Queried">Queried</option>
                          <option value="Cancelled">Cancelled / Void Code</option>
                        </select>
                      </div>

                      {/* Filter by Employee */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                          Initiating Employee
                        </label>
                        <select
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-semibold focus:outline-none text-slate-850"
                          value={centralEmployee}
                          onChange={(e) => setCentralEmployee(e.target.value)}
                        >
                          <option value="All">All Submitters</option>
                          {Array.from(new Set(requestsList.map((r) => r.employeeName).filter(Boolean))).map((emp) => (
                            <option key={emp} value={emp}>
                              {emp}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Filter by Department */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                          Department Division
                        </label>
                        <select
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-semibold focus:outline-none text-slate-850"
                          value={centralDepartment}
                          onChange={(e) => setCentralDepartment(e.target.value)}
                        >
                          <option value="All">All Departments</option>
                          {Array.from(
                            new Set([
                              "Engineering",
                              "Sales",
                              "Accounting",
                              "Operations",
                              "Human Resources",
                              "Administration",
                              "General",
                              ...employeesList.map((e) => e.department).filter(Boolean),
                              ...requestsList.map((r) => {
                                const m = employeesList.find((e) => e.id === r.userId);
                                return m?.department;
                              }).filter(Boolean)
                            ])
                          ).map((dept) => (
                            <option key={dept} value={dept}>
                              {dept}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Filter by Document Type */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                          Document Type
                        </label>
                        <select
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-semibold focus:outline-none text-slate-850"
                          value={centralDocType}
                          onChange={(e) => setCentralDocType(e.target.value)}
                        >
                          <option value="All">All Form Types</option>
                          <option value="CV">Cash Voucher (CV)</option>
                          <option value="EV">Expense Voucher (EV)</option>
                          <option value="PV">Purchase Voucher (PV)</option>
                          <option value="JV">Travel Expenses (JV)</option>
                        </select>
                      </div>

                      {/* Filter by Approval Stage */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                          Active Approval Stage
                        </label>
                        <select
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-semibold focus:outline-none text-slate-850"
                          value={centralStage}
                          onChange={(e) => setCentralStage(e.target.value)}
                        >
                          <option value="All">All Stages</option>
                          <option value="head-approval">Stage 1: Head Review</option>
                          <option value="admin-approval">Stage 2: Admin Review</option>
                          <option value="superadmin-approval">Stage 3: Super Admin Review</option>
                          <option value="completed">Completed / Finalized</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Ledger Data Table list */}
                  <div className="bg-white rounded-2xl border border-slate-150 shadow-sm overflow-hidden">
                    <div className="p-4 bg-slate-50 border-b border-slate-150 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <span className="font-extrabold text-[10px] uppercase font-mono tracking-wider block text-slate-600">
                          Regulatory Records Entries Ledger
                        </span>
                        <p className="text-[10px] text-slate-505">
                          Showing{" "}
                          <strong className="text-slate-700">
                            {
                              requestsList.filter((r) => {
                                const query = centralSearch.toLowerCase();
                                const matchesSearch =
                                  !query ||
                                  r.id.toLowerCase().includes(query) ||
                                  (r.projectName && r.projectName.toLowerCase().includes(query)) ||
                                  (r.documentNumber && r.documentNumber.toLowerCase().includes(query)) ||
                                  (r.employeeName && r.employeeName.toLowerCase().includes(query)) ||
                                  (r.category && r.category.toLowerCase().includes(query));

                                let matchesStatus = true;
                                if (centralStatus !== "All") {
                                  if (centralStatus === "Cancelled") {
                                    matchesStatus = !!r.cancellationStatus;
                                  } else {
                                    matchesStatus = r.status === centralStatus && !r.cancellationStatus;
                                  }
                                }

                                const matchesEmployee =
                                  centralEmployee === "All" || r.employeeName === centralEmployee;

                                const matchedEmp = employeesList.find((e) => e.id === r.userId || e.name === r.employeeName);
                                const creatorDept = matchedEmp?.department || r.category || "General";
                                const matchesDepartment = centralDepartment === "All" || creatorDept === centralDepartment;

                                const docType =
                                  r.documentType ||
                                  (r.cashVoucherDetails ? "CV" : r.travelExpensesDetails ? "JV" : "EV");
                                const matchesDocType = centralDocType === "All" || docType === centralDocType;

                                const matchesStage =
                                  centralStage === "All" ||
                                  r.stage === centralStage ||
                                  (centralStage === "completed" && r.stage === "completed");

                                return (
                                  matchesSearch &&
                                  matchesStatus &&
                                  matchesEmployee &&
                                  matchesDepartment &&
                                  matchesDocType &&
                                  matchesStage
                                );
                              }).length
                            }
                          </strong>{" "}
                          filtered entries of {requestsList.length} total.
                        </p>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 uppercase font-mono border-b border-slate-150 text-[9px] tracking-wider text-slate-500">
                            <th className="p-3.5 pl-5">Document Code</th>
                            <th className="p-3.5">Submitter & Department</th>
                            <th className="p-3.5">Project Details / Date</th>
                            <th className="p-3.5 font-mono text-right">Sanction Amount</th>
                            <th className="p-3.5 text-center">Status</th>
                            <th className="p-3.5 text-center">Active Stage</th>
                            <th className="p-3.5">Approval Flow History</th>
                            <th className="p-3.5">Terminated By</th>
                            <th className="p-3.5 text-right pr-5">Oversight Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {requestsList
                            .filter((r) => {
                              const query = centralSearch.toLowerCase();
                              const matchesSearch =
                                !query ||
                                r.id.toLowerCase().includes(query) ||
                                (r.projectName && r.projectName.toLowerCase().includes(query)) ||
                                (r.documentNumber && r.documentNumber.toLowerCase().includes(query)) ||
                                (r.employeeName && r.employeeName.toLowerCase().includes(query)) ||
                                (r.category && r.category.toLowerCase().includes(query));

                              let matchesStatus = true;
                              if (centralStatus !== "All") {
                                if (centralStatus === "Cancelled") {
                                  matchesStatus = !!r.cancellationStatus;
                                } else {
                                  matchesStatus = r.status === centralStatus && !r.cancellationStatus;
                                }
                              }

                              const matchesEmployee =
                                centralEmployee === "All" || r.employeeName === centralEmployee;

                              const matchedEmp = employeesList.find((e) => e.id === r.userId || e.name === r.employeeName);
                              const creatorDept = matchedEmp?.department || r.category || "General";
                              const matchesDepartment = centralDepartment === "All" || creatorDept === centralDepartment;

                              const docType =
                                r.documentType ||
                                (r.cashVoucherDetails ? "CV" : r.travelExpensesDetails ? "JV" : "EV");
                              const matchesDocType = centralDocType === "All" || docType === centralDocType;

                              const matchesStage =
                                centralStage === "All" ||
                                r.stage === centralStage ||
                                (centralStage === "completed" && r.stage === "completed");

                              return (
                                matchesSearch &&
                                matchesStatus &&
                                matchesEmployee &&
                                matchesDepartment &&
                                matchesDocType &&
                                matchesStage
                              );
                            })
                            .map((r) => {
                              const docType =
                                r.documentType ||
                                (r.cashVoucherDetails ? "CV" : r.travelExpensesDetails ? "JV" : "EV");
                              const mEmp = employeesList.find((e) => e.id === r.userId || e.name === r.employeeName);
                              const creatorDept = mEmp?.department || r.category || "General";
                              const submissionDate = r.submissionDate || "N/A";
                              const isCompleted = r.stage === "completed" || r.status === "Approved";
                              const isFinalizedEarly =
                                r.status === "Approved" &&
                                (r.finalizedBy || (r.headApprovalStatus === "Approved" && r.stage === "completed" && !r.adminApprovedBy));

                              return (
                                <tr key={r.id} className="hover:bg-slate-50/70 transition text-slate-805 text-[11px]">
                                  {/* Document Code */}
                                  <td className="p-3.5 pl-5 font-mono">
                                    <div className="flex items-center gap-1.5">
                                      <span
                                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase font-mono ${
                                          docType === "CV"
                                            ? "bg-emerald-50 text-emerald-700 border border-emerald-150"
                                            : docType === "JV"
                                            ? "bg-teal-50 text-teal-700 border border-teal-150"
                                            : docType === "PV"
                                            ? "bg-indigo-50 text-indigo-700 border border-indigo-150"
                                            : "bg-blue-50 text-blue-700 border border-slate-150"
                                        }`}
                                      >
                                        {docType}
                                      </span>
                                      <strong className="text-slate-900 tracking-tight">
                                        {r.documentNumber || `PROV-${r.id.substring(0, 5)}`}
                                      </strong>
                                    </div>
                                    <div className="text-[9px] text-slate-400 mt-0.5 font-mono">ID: {r.id.substring(0, 8)}</div>
                                  </td>

                                  {/* Creator Profile */}
                                  <td className="p-3.5">
                                    <div className="font-bold text-slate-900">{r.employeeName}</div>
                                    <div className="text-[10px] text-slate-450 mt-0.5 flex items-center gap-1">
                                      <Building2 className="h-3 w-3 text-slate-400" />
                                      <span>{creatorDept}</span>
                                    </div>
                                  </td>

                                  {/* Project details */}
                                  <td className="p-3.5">
                                    <div className="font-semibold text-slate-800 truncate max-w-[180px]">
                                      {r.projectName}
                                    </div>
                                    <div className="text-[9px] text-slate-400 mt-0.5 font-mono">{submissionDate}</div>
                                  </td>

                                  {/* Grand net amount */}
                                  <td className="p-3.5 font-mono text-right font-extrabold text-slate-900 text-xs text-nowrap">
                                    <InteractiveAmount amount={r.status === "Partially Approved" && r.approvedAmount !== undefined ? r.approvedAmount : (r.totals?.netTotal || r.totalBudget || r.cashVoucherDetails?.billAmount || r.travelExpensesDetails?.totalAmount || r.totalBudget || 0)} />
                                  </td>

                                  {/* Status indicators */}
                                  <td className="p-3.5 text-center">
                                    {r.cancellationStatus ? (
                                      <span className="inline-flex items-center gap-1.5 py-1 px-2.5 bg-red-155 text-red-800 rounded-full font-bold text-[9px] uppercase font-mono tracking-wider border border-red-200">
                                        <XCircle className="h-3 w-3 text-red-600" />
                                        <span>Void</span>
                                      </span>
                                    ) : r.status === "Approved" ? (
                                      <span className={`inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full font-bold text-[9px] uppercase font-mono tracking-wider border ${
                                        isFinalizedEarly 
                                          ? "bg-purple-100 text-purple-850 border-purple-200" 
                                          : "bg-emerald-100 text-emerald-850 border-emerald-200"
                                      }`}>
                                        <Check className="h-3 w-3" />
                                        <span>{isFinalizedEarly ? "Finalized" : "Approved"}</span>
                                      </span>
                                    ) : r.status === "Partially Approved" ? (
                                      <span className="inline-flex items-center gap-1.5 py-1 px-2.5 bg-amber-50 text-amber-800 rounded-full font-bold text-[9px] uppercase font-mono tracking-wider border border-amber-200">
                                        <CheckCircle2 className="h-3 w-3 text-amber-600" />
                                        <span>Part Approved</span>
                                      </span>
                                    ) : r.status === "Pending" ? (
                                      <span className="inline-flex items-center gap-1.5 py-1 px-2.5 bg-amber-50 text-amber-805 rounded-full font-bold text-[9px] uppercase font-mono tracking-wider border border-amber-200">
                                        <RefreshCw className="h-3 w-3 animate-spin text-amber-500" />
                                        <span>Pending</span>
                                      </span>
                                    ) : r.status === "Rejected" ? (
                                      <span className="inline-flex items-center gap-1.5 py-1 px-2.5 bg-rose-50 text-red-700 rounded-full font-bold text-[9px] uppercase font-mono tracking-wider border border-rose-200">
                                        <XCircle className="h-3 w-3 text-red-505" />
                                        <span>Rejected</span>
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1.5 py-1 px-2.5 bg-blue-50 text-blue-700 rounded-full font-bold text-[9px] uppercase font-mono tracking-wider border border-blue-200">
                                        <Info className="h-3 w-3" />
                                        <span>{r.status}</span>
                                      </span>
                                    )}
                                  </td>

                                  {/* Active stage routing */}
                                  <td className="p-3.5 text-center font-mono text-[9px] font-bold">
                                    {r.cancellationStatus ? (
                                      <span className="text-slate-400">N/A</span>
                                    ) : isCompleted ? (
                                      <span className="text-emerald-700 font-extrabold uppercase">Completed ⚡</span>
                                    ) : r.stage === "head-approval" ? (
                                      <span className="text-indigo-600 bg-indigo-50 py-0.5 px-2 rounded-md">Head Review</span>
                                    ) : r.stage === "admin-approval" ? (
                                      <span className="text-blue-600 bg-blue-50 py-0.5 px-2 rounded-md">Admin Review</span>
                                    ) : r.stage === "superadmin-approval" ? (
                                      <span className="text-purple-600 bg-purple-50 py-0.5 px-2 rounded-md">Super Admin</span>
                                    ) : (
                                      <span className="text-slate-500 uppercase">{r.stage || "Draft"}</span>
                                    )}
                                  </td>

                                  {/* Approver chain representation */}
                                  <td className="p-3.5 text-nowrap">
                                    <div className="flex items-center gap-1 text-[10px] font-semibold">
                                      {/* Stage 1 Head */}
                                      <span
                                        title={r.headApprovedBy ? `Approved by ${r.headApprovedBy}` : "Dept Head Status"}
                                        className={`px-1 rounded-md text-[9px] font-black ${
                                          r.headApprovalStatus === "Approved"
                                            ? "bg-emerald-100 text-emerald-800"
                                            : r.headApprovalStatus === "Rejected"
                                            ? "bg-red-100 text-red-800"
                                            : "bg-slate-100 text-slate-400"
                                        }`}
                                      >
                                        H: {r.headApprovalStatus || "Awaiting"}
                                      </span>
                                      <span className="text-slate-300">→</span>

                                      {/* Stage 2 Admin */}
                                      <span
                                        title={r.adminApprovedBy ? `Approved by ${r.adminApprovedBy}` : "Admin Status"}
                                        className={`px-1 rounded-md text-[9px] font-black ${
                                          r.adminApprovalStatus === "Approved"
                                            ? "bg-emerald-100 text-emerald-800"
                                            : r.adminApprovalStatus === "Rejected"
                                            ? "bg-red-100 text-red-800"
                                            : r.stage === "completed" && !r.adminApprovedBy
                                            ? "bg-purple-50 text-purple-400 font-normal line-through"
                                            : "bg-slate-100 text-slate-400"
                                        }`}
                                      >
                                        A: {r.stage === "completed" && !r.adminApprovedBy ? "Skipped" : (r.adminApprovalStatus || "Awaiting")}
                                      </span>
                                      <span className="text-slate-300">→</span>

                                      {/* Stage 3 Super Admin */}
                                      <span
                                        title={r.superAdminApprovedBy ? `Approved by ${r.superAdminApprovedBy}` : "Super Admin Status"}
                                        className={`px-1 rounded-md text-[9px] font-black ${
                                          r.superAdminApprovalStatus === "Approved"
                                            ? "bg-emerald-100 text-emerald-800"
                                            : r.superAdminApprovalStatus === "Rejected"
                                            ? "bg-red-100 text-red-800"
                                            : r.stage === "completed" && !r.superAdminApprovedBy
                                            ? "bg-purple-50 text-purple-400 font-normal line-through"
                                            : "bg-slate-100 text-slate-400"
                                        }`}
                                      >
                                        SA: {r.stage === "completed" && !r.superAdminApprovedBy ? "Skipped" : (r.superAdminApprovalStatus || "Awaiting")}
                                      </span>
                                    </div>
                                  </td>

                                  {/* Terminated By info */}
                                  <td className="p-3.5 font-sans">
                                    {isFinalizedEarly ? (
                                      <div className="space-y-0.5">
                                        <span className="text-[9px] text-purple-800 bg-purple-150 font-bold px-1.5 py-0.2 rounded-sm inline-block">
                                          ⚡ Finalized Early
                                        </span>
                                        <div className="font-mono text-[9px] text-slate-600 font-bold truncate max-w-[120px]" title={r.finalizedBy || r.headApprovedBy}>
                                          {r.finalizedBy || r.headApprovedBy || "Dept Head Authority"}
                                        </div>
                                      </div>
                                    ) : r.status === "Approved" ? (
                                      <div className="space-y-0.5">
                                        <span className="text-[9px] text-emerald-800 bg-emerald-150 font-bold px-1.5 py-0.2 rounded-sm inline-block">
                                          Standard Routing
                                        </span>
                                        <div className="font-mono text-[9px] text-slate-600 font-bold truncate max-w-[120px]">
                                          {r.superAdminApprovedBy || r.adminApprovedBy || "Super Admin"}
                                        </div>
                                      </div>
                                    ) : (
                                      <span className="text-slate-400 italic">Unfinished...</span>
                                    )}
                                  </td>

                                  {/* Oversight Actions */}
                                  <td className="p-3.5 text-right pr-5">
                                    <div className="flex items-center justify-end gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => setActiveRequestDetails(r)}
                                        className="p-1 px-2.5 text-indigo-700 bg-indigo-50 border border-indigo-150 rounded-lg hover:bg-indigo-100 cursor-pointer text-[10px] font-bold flex items-center gap-1 transition text-nowrap"
                                      >
                                        <Eye className="h-3 w-3" />
                                        <span>Inspect</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => downloadApprovalPDF(r)}
                                        className="p-1 px-2.5 text-emerald-700 bg-emerald-50 border border-emerald-150 rounded-lg hover:bg-emerald-100 cursor-pointer text-[10px] font-bold flex items-center gap-1 transition text-nowrap"
                                      >
                                        <Download className="h-3 w-3" />
                                        <span>PDF</span>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                      {requestsList.length === 0 && (
                        <div className="p-10 text-center text-slate-400">
                          <Database className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                          <p className="font-extrabold text-sm text-slate-500">Corporate database ledger empty</p>
                          <p className="text-xs">Once request vouchers are initialized, they instantly populate here.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* PAGE 7.2: ADVANCED ENTERPRISE REPORTS & ANALYTICS DASHBOARD */}
              {currentPage === "advanced-reports" && (currentUser.role === "admin" || currentUser.role === "superadmin") && (
                <AdvancedReports
                  requestsList={requestsList}
                  commissionsList={commissionsList}
                  auditLogs={auditLogs}
                  employeesList={employeesList}
                  currentUser={currentUser}
                  downloadApprovalPDF={downloadApprovalPDF}
                />
              )}

              {/* PAGE 7.5: COMMISSION MANAGEMENT PORTAL */}
              {currentPage === "commissions" && (
                <div className="space-y-6 max-w-7xl mx-auto animate-fade-in text-slate-800 font-sans" id="commission-management-page">
                  
                  {/* Ledger Header banner */}
                  <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded text-[10px] font-bold uppercase tracking-widest font-mono border border-indigo-500/30 flex items-center gap-1">
                          <Coins className="h-3 w-3" />
                          <span>Corporate General Ledger</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">Segment ID: {currentUser?.enterpriseCode || "2026"}</span>
                      </div>
                      <h2 className="text-xl font-black">Corporate Marketing Expense Management Hub</h2>
                      <p className="text-slate-300 text-xs">
                        Audit, allocate, and manage high-value employee marketing expense plans with unified sequential cash voucher layouts and continuous validation checklists.
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={async () => {
                          await fetchCommissions();
                          setAppSuccess("Marketing expense records updated successfully.");
                          setTimeout(() => setAppSuccess(""), 3000);
                        }}
                        className="bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold text-xs py-2.5 px-4 rounded-xl cursor-pointer transition flex items-center gap-1.5"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span>Update Portal</span>
                      </button>
                    </div>
                  </div>

                  {(() => {
                    // Precompute dashboard financials
                    const totalAuthorized = commissionsList.reduce((sum, c) => sum + (c.totalAmount || 0), 0);
                    const totalPaid = commissionsList.reduce((sum, c) => sum + (c.totalPaid || 0), 0);
                    const totalPending = commissionsList.reduce((sum, c) => sum + (c.totalPending || 0), 0);
                    const totalRemaining = commissionsList.reduce((sum, c) => sum + (c.pendingBalance || 0), 0);

                    const totalCommissionsCount = commissionsList.length;
                    const partialsCount = commissionsList.filter(c => c.status === "Partially Paid").length;
                    const paidCount = commissionsList.filter(c => c.status === "Paid").length;
                    const pendingCount = commissionsList.filter(c => c.status === "Pending").length;

                    // Role-based scoping of "real time progress"
                    const isStaff = currentUser.role !== "admin" && currentUser.role !== "superadmin";
                    const activeComm = isStaff ? (selectedCommission || commissionsList[0]) : null;

                    const displayAuthorized = activeComm ? activeComm.totalAmount : totalAuthorized;
                    const displayPaid = activeComm ? (activeComm.totalPaid || 0) : totalPaid;
                    const displayPending = activeComm ? (activeComm.totalPending || 0) : totalPending;
                    const displayRemaining = activeComm ? activeComm.pendingBalance : totalRemaining;

                    // Group by Department for analytical tracking
                    const deptGroup: { [key: string]: { authorized: number; paid: number; pending: number } } = {};
                    commissionsList.forEach((c) => {
                      const dept = c.department || "Sales & Marketing";
                      if (!deptGroup[dept]) {
                        deptGroup[dept] = { authorized: 0, paid: 0, pending: 0 };
                      }
                      deptGroup[dept].authorized += c.totalAmount || 0;
                      deptGroup[dept].paid += c.totalPaid || 0;
                      deptGroup[dept].pending += c.totalPending || 0;
                    });

                    const deptChartData = Object.keys(deptGroup).map(dept => ({
                      department: dept,
                      Authorized: deptGroup[dept].authorized,
                      Paid: deptGroup[dept].paid,
                      Pending: deptGroup[dept].pending,
                      Unpaid: Math.max(0, deptGroup[dept].authorized - deptGroup[dept].paid - deptGroup[dept].pending)
                    }));

                    // Individual commission history chart data for staff
                    const staffChartData = isStaff
                      ? commissionsList.map(c => ({
                          name: c.dateMonth || c.id,
                          Authorized: c.totalAmount || 0,
                          Paid: c.totalPaid || 0,
                          Pending: c.totalPending || 0,
                        }))
                      : [];

                    const chartData = isStaff ? staffChartData : deptChartData;

                    // Group by Employee
                    const employeeGroup: { [key: string]: { name: string; dept: string; auth: number; paid: number; count: number } } = {};
                    commissionsList.forEach((c) => {
                      const key = c.employeeId || c.employeeName;
                      if (!employeeGroup[key]) {
                        employeeGroup[key] = { name: c.employeeName, dept: c.department, auth: 0, paid: 0, count: 0 };
                      }
                      employeeGroup[key].auth += c.totalAmount || 0;
                      employeeGroup[key].paid += c.totalPaid || 0;
                      employeeGroup[key].count += 1;
                    });
                    const employeeRankings = Object.values(employeeGroup).sort((a, b) => b.auth - a.auth);

                    // Recharts Pie Chart status breakdown
                    const statusPieData = [
                      { name: "Approved Paid", value: displayPaid, color: "#10b981" },
                      { name: "In Pipeline (Pending)", value: displayPending, color: "#f59e0b" },
                      { name: "Unpaid Balance", value: Math.max(0, displayRemaining - displayPending), color: "#6366f1" }
                    ].filter(d => d.value > 0);

                    // Filters & list processing
                    const departmentsListUnique = Array.from(new Set(commissionsList.map(c => c.department || "Sales/Marketing")));

                    const filteredCommissions = commissionsList.filter((c) => {
                      const sq = commSearchQuery.toLowerCase();
                      const matchesSearch = 
                        c.employeeName.toLowerCase().includes(sq) ||
                        c.id.toLowerCase().includes(sq) ||
                        (c.purpose || "").toLowerCase().includes(sq) ||
                        (c.department || "").toLowerCase().includes(sq);
                      
                      const matchesStatus = commStatusFilter === "All" || c.status === commStatusFilter;
                      const matchesDept = commDeptFilter === "All" || c.department === commDeptFilter;
                      
                      return matchesSearch && matchesStatus && matchesDept;
                    });

                    // Trigger payout limit checks
                    const hasAnomaliesTotal = commissionsList.some(c => c.warnings && c.warnings.length > 0);

                    return (
                      <>
                        {/* 1. COMMISSION ANALYTICS SYSTEM SCORECARD */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm flex flex-col justify-between">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono block">
                                {isStaff ? "Your Marketing Expense Target" : "Aggregate Authorized"}
                              </span>
                              <strong className="block text-2xl font-black text-indigo-950 mt-1">₹{displayAuthorized.toLocaleString("en-IN")}</strong>
                            </div>
                            <span className="text-[10px] text-slate-500 mt-2 block">
                              {isStaff 
                                ? `Plan: ${activeComm?.id || "N/A"} (${activeComm?.dateMonth || "Active"})` 
                                : `${totalCommissionsCount} master parent entries approved`
                              }
                            </span>
                          </div>

                          <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm flex flex-col justify-between">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono block">
                                {isStaff ? "Your Paid Disbursed" : "Disbursed (Approved CV)"}
                              </span>
                              <strong className="block text-2xl font-black text-emerald-600 mt-1">₹{displayPaid.toLocaleString("en-IN")}</strong>
                            </div>
                            <span className="text-[10px] text-slate-500 mt-2 block flex items-center gap-1">
                              <span className="h-2 w-2 rounded-full bg-emerald-500 block animate-pulse"></span>
                              <span>
                                {isStaff && activeComm
                                  ? `${(((activeComm.totalPaid || 0) / (activeComm.totalAmount || 1)) * 100).toFixed(0)}% goal progress earned` 
                                  : `${paidCount} plan goals completed perfectly`
                                }
                              </span>
                            </span>
                          </div>

                          <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm flex flex-col justify-between">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono block">
                                {isStaff ? "Your Pending Pipeline" : "Pending Pipeline Approval"}
                              </span>
                              <strong className="block text-2xl font-black text-amber-500 mt-1">₹{displayPending.toLocaleString("en-IN")}</strong>
                            </div>
                            <span className="text-[10px] text-slate-500 mt-2 block">
                              {isStaff 
                                ? `${activeComm?.payouts?.filter((p: any) => p.status === "Pending").length || 0} payout vouchers in review` 
                                : `${commissionsList.reduce((sum, c) => sum + (c.payouts?.filter((p: any) => p.status === "Pending").length || 0), 0)} vouchers routing for review`
                              }
                            </span>
                          </div>

                          <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm flex flex-col justify-between">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono block">
                                {isStaff ? "Your Unpaid Balance" : "Pending Commission Balance"}
                              </span>
                              <strong className="block text-2xl font-black text-indigo-600 mt-1">₹{displayRemaining.toLocaleString("en-IN")}</strong>
                            </div>
                            <span className="text-[10px] text-slate-500 mt-2 block">
                              {isStaff 
                                ? `Current Status: ${activeComm?.status || "Pending"}` 
                                : `${partialsCount} plans remain active partially`
                              }
                            </span>
                          </div>
                        </div>

                        {/* 2. ADVANCED INTERACTIVE GRAPHING & ALERTS BOARD */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          
                          {/* Department Allocations Column Chart */}
                          <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm col-span-1 lg:col-span-2 space-y-3">
                            <div className="flex items-center justify-between border-b pb-2">
                              <h3 className="font-extrabold text-xs uppercase font-mono tracking-wider text-slate-800">
                                {isStaff ? "Your Marketing Expense Plans Tracker" : "Department-Wise Marketing Expense Tracking"}
                              </h3>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {isStaff ? "Authorized vs. Paid Records" : "Authorized vs. Paid Analysis"}
                              </span>
                            </div>
                            <div className="h-60 w-full text-xs">
                              {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey={isStaff ? "name" : "department"} stroke="#94a3b8" />
                                    <YAxis stroke="#94a3b8" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                                    <Tooltip formatter={(value: any) => [`₹${Number(value).toLocaleString("en-IN")}`, ""]} labelClassName="font-bold text-slate-800" />
                                    <Legend />
                                    <Bar dataKey="Authorized" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="Paid" fill="#10b981" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="Pending" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                  </BarChart>
                                </ResponsiveContainer>
                              ) : (
                                <div className="h-full flex items-center justify-center text-slate-400 italic">
                                  No marketing expense details found. Create a plan or register records below.
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Status distribution & Active Warnings Panel */}
                          <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm flex flex-col justify-between gap-4">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between border-b pb-2">
                                <h3 className="font-extrabold text-xs uppercase font-mono tracking-wider text-slate-800">
                                  {isStaff ? "Your Progress Ratio" : "System Flow Stats"}
                                </h3>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {isStaff ? "Respective Plan Status" : "Disbursement Ledger"}
                                </span>
                              </div>
                              <div className="h-32 w-full flex items-center justify-center relative">
                                {statusPieData.length > 0 ? (
                                  <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                      <Pie
                                        data={statusPieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={35}
                                        outerRadius={55}
                                        paddingAngle={4}
                                        dataKey="value"
                                      >
                                        {statusPieData.map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                      </Pie>
                                      <Tooltip formatter={(value: any) => `₹${Number(value).toLocaleString("en-IN")}`} />
                                    </PieChart>
                                  </ResponsiveContainer>
                                ) : (
                                  <span className="text-slate-400 italic text-xs">No active disbursement layout</span>
                                )}
                              </div>
                              <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-bold font-mono">
                                <div className="p-1 px-1.5 bg-emerald-50 text-emerald-800 rounded">
                                  <span>Paid</span>
                                  <b className="block mt-0.5 text-slate-900 font-sans">
                                    {((displayPaid / (displayAuthorized || 1)) * 100).toFixed(0)}%
                                  </b>
                                </div>
                                <div className="p-1 px-1.5 bg-amber-50 text-amber-800 rounded">
                                  <span>Pending</span>
                                  <b className="block mt-0.5 text-slate-900 font-sans">
                                    {((displayPending / (displayAuthorized || 1)) * 100).toFixed(0)}%
                                  </b>
                                </div>
                                <div className="p-1 px-1.5 bg-indigo-50 text-indigo-800 rounded">
                                  <span>Unpaid</span>
                                  <b className="block mt-0.5 text-slate-900 font-sans">
                                    {(((displayAuthorized - displayPaid - displayPending) / (displayAuthorized || 1)) * 100).toFixed(0)}%
                                  </b>
                                </div>
                              </div>
                            </div>

                            {/* SPLITTING DETECTION ALERTS (HIGH-FIDELITY WARNING ENGINE) */}
                            <div className={`p-3 rounded-xl border ${hasAnomaliesTotal ? "bg-amber-50 border-amber-200 text-amber-950" : "bg-slate-50 border-slate-150 text-slate-500"} text-xs space-y-1.5`}>
                              <div className="flex items-center gap-1.5 font-bold uppercase font-mono text-[10px]">
                                <AlertCircle className={`h-4 w-4 ${hasAnomaliesTotal ? "text-amber-600 animate-bounce" : "text-slate-400"}`} />
                                <span>Regulatory Splitting Defense Engine</span>
                              </div>
                              {hasAnomaliesTotal ? (
                                <p className="text-[11px] leading-relaxed">
                                  <strong>Suspicious payout models detected!</strong> Review flagged entries in the tracking table highlighting repeated voucher splitting behaviors, same-day filings, or over-allocation requests.
                                </p>
                              ) : (
                                <p className="text-[11px] leading-relaxed text-slate-600">
                                  Perfect alignment. System scanning is active. No suspicious employee payout splitting patterns (repetitive, rapid-frequency, under ₹10k, or over-allocation limits) detected at this moment.
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* 3. COLLAPSIBLE MASTER REGISTRATION CARD */}
                        {true && (
                          <div className="bg-slate-50 p-5 rounded-2xl border border-dashed border-indigo-200 space-y-4">
                            <div className="flex items-center justify-between">
                              <h3 className="font-extrabold text-xs uppercase font-mono text-indigo-900 flex items-center gap-1.5">
                                <Plus className="h-4 w-4 text-indigo-600" />
                                <span>Add Master Parent Marketing Expense Entry</span>
                              </h3>
                              <button
                                type="button"
                                onClick={() => {
                                  if (!isCreatingCommission && currentUser.role !== "admin" && currentUser.role !== "superadmin") {
                                    setComEmpId(currentUser.id);
                                    setComEmpName(currentUser.name);
                                    setComDept(currentUser.department || "Sales/Marketing");
                                  }
                                  setIsCreatingCommission(!isCreatingCommission);
                                }}
                                className="text-[10px] bg-indigo-50 border border-indigo-200 text-indigo-700 px-3 py-1 rounded-lg font-bold hover:bg-indigo-100 transition"
                              >
                                {isCreatingCommission ? "Collapse Marketing Expense Form" : "Create Master Marketing Expense Record"}
                              </button>
                            </div>

                            {isCreatingCommission && (
                              <form onSubmit={saveMasterCommission} className="space-y-4 transition animate-fade-in pt-2 bg-white p-5 rounded-xl border border-slate-150 shadow-sm">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1 font-mono">System Employee</label>
                                    {(currentUser.role === "admin" || currentUser.role === "superadmin") ? (
                                      <select
                                        value={comEmpId}
                                        onChange={(e) => {
                                          const selected = employeesList.find(u => u.id === e.target.value);
                                          if (selected) {
                                            setComEmpId(selected.id);
                                            setComEmpName(selected.name);
                                            setComDept(selected.department);
                                          } else {
                                            setComEmpId(e.target.value);
                                            setComEmpName("");
                                          }
                                        }}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-semibold focus:ring-1 focus:ring-indigo-500 focus:outline-none focus:bg-white"
                                      >
                                        <option value="">-- Choose Staff Member --</option>
                                        {employeesList.map((emp) => (
                                          <option key={emp.id} value={emp.id}>
                                            {emp.name} ({emp.employeeCode}) - {emp.department}
                                          </option>
                                        ))}
                                        <option value="emp-custom">Custom/External Representative...</option>
                                      </select>
                                    ) : (
                                      <div className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-600 font-bold font-mono">
                                        {currentUser.name} ({currentUser.employeeCode || "N/A"})
                                      </div>
                                    )}
                                  </div>

                                  {(currentUser.role === "admin" || currentUser.role === "superadmin") && (comEmpId === "emp-custom" || !comEmpId) && (
                                    <div>
                                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1 font-mono">Custom Employee Name</label>
                                      <input
                                        type="text"
                                        value={comEmpName}
                                        onChange={(e) => setComEmpName(e.target.value)}
                                        placeholder="Type name here in full..."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-semibold focus:ring-1 focus:ring-indigo-500 focus:outline-none focus:bg-white"
                                      />
                                    </div>
                                  )}

                                  <div>
                                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1 font-mono">Department Name</label>
                                    <input
                                      type="text"
                                      value={comDept}
                                      onChange={(e) => setComDept(e.target.value)}
                                      disabled={currentUser?.role !== "admin" && currentUser?.role !== "superadmin"}
                                      placeholder="e.g., Marketing, Sales Head, Inspections"
                                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-semibold focus:ring-1 focus:ring-indigo-500 focus:outline-none focus:bg-white disabled:bg-slate-100 disabled:text-slate-500"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1 font-mono">Total Authorized Plan Amount (₹)</label>
                                    <input
                                      type="number"
                                      value={comTotalAmount}
                                      onChange={(e) => setComTotalAmount(e.target.value)}
                                      placeholder="e.g., 100000"
                                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-bold focus:ring-1 focus:ring-indigo-500 focus:outline-none focus:bg-white"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1 font-mono">Purpose / Initiative Title</label>
                                    <input
                                      type="text"
                                      value={comPurpose}
                                      onChange={(e) => setComPurpose(e.target.value)}
                                      placeholder="e.g., Marketing Q2 Project Incentives"
                                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-semibold focus:ring-1 focus:ring-indigo-500 focus:outline-none focus:bg-white"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1 font-mono">Plan Billing Month / Date</label>
                                    <input
                                      type="month"
                                      value={comMonth}
                                      onChange={(e) => setComMonth(e.target.value)}
                                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-semibold focus:ring-1 focus:ring-indigo-500 focus:outline-none focus:bg-white"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1 font-mono">Performance Benchmarks & Notes</label>
                                  <textarea
                                    value={comNotes}
                                    onChange={(e) => setComNotes(e.target.value)}
                                    rows={2}
                                    placeholder="Enter internal details, audit rules, contract reference, milestones..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-semibold focus:ring-1 focus:ring-indigo-500 focus:outline-none focus:bg-white"
                                  ></textarea>
                                </div>

                                <button
                                  type="submit"
                                  disabled={loading}
                                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-350 text-white font-extrabold text-xs py-3 px-4 rounded-xl cursor-pointer shadow-sm flex items-center justify-center gap-1.5 transition"
                                >
                                  {loading ? (
                                    <span>Authorizing Plan...</span>
                                  ) : (
                                    <>
                                      <CheckCircle2 className="h-4 w-4" />
                                      <span>Authorize Master Parent Plan Entitlement</span>
                                    </>
                                  )}
                                </button>
                              </form>
                            )}
                          </div>
                        )}

                        {/* 4. MASTER LEDGER LISTING AND DETAILS DOUBLE-PANED SPLIT */}
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                          
                          {/* Left Columns Master commissions table list */}
                          <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm col-span-1 lg:col-span-3 space-y-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-3">
                              <div>
                                <h3 className="font-extrabold text-sm text-slate-900">General Marketing Expense Ledger</h3>
                                <p className="text-[11px] text-slate-500">Search and filter active authorized corporate marketing expenses</p>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <div className="relative">
                                  <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-400" />
                                  <input
                                    type="text"
                                    value={commSearchQuery}
                                    onChange={(e) => setCommSearchQuery(e.target.value)}
                                    placeholder="Quick search plans..."
                                    className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-xl w-44 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white font-medium"
                                  />
                                </div>

                                <select
                                  value={commStatusFilter}
                                  onChange={(e) => setCommStatusFilter(e.target.value)}
                                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-[10px] font-bold text-slate-700 focus:outline-none"
                                >
                                  <option value="All">All Flow</option>
                                  <option value="Pending">Unpaid</option>
                                  <option value="Partially Paid">Partials</option>
                                  <option value="Paid">Fully Paid</option>
                                </select>

                                <select
                                  value={commDeptFilter}
                                  onChange={(e) => setCommDeptFilter(e.target.value)}
                                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-[10px] font-bold text-slate-700 focus:outline-none max-w-[124px] truncate"
                                >
                                  <option value="All">All Depts</option>
                                  {departmentsListUnique.map((dept) => (
                                    <option key={dept} value={dept}>
                                      {dept}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs">
                                <thead>
                                  <tr className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono border-b border-gray-150">
                                    <th className="p-3 pl-5">Plan ID</th>
                                    <th className="p-3">Staff Target</th>
                                    <th className="p-3">Authorized / Paid</th>
                                    <th className="p-3">Status</th>
                                    <th className="p-3 text-right pr-5">Oversight</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {filteredCommissions.map((c) => {
                                    const hasWarnings = c.warnings && c.warnings.length > 0;
                                    return (
                                      <tr
                                        key={c.id}
                                        onClick={() => {
                                          setSelectedCommission(c);
                                          setComPayoutAmount(String(c.pendingBalance));
                                        }}
                                        className={`border-b border-gray-100 hover:bg-slate-50/50 cursor-pointer transition ${selectedCommission?.id === c.id ? "bg-indigo-50/70" : ""}`}
                                      >
                                        <td className="p-3.5 pl-5 font-mono text-xs font-bold text-slate-900">
                                          <div className="flex items-center gap-1.5">
                                            <span>{c.id}</span>
                                            {hasWarnings && (
                                              <div className="relative group">
                                                <AlertCircle className="h-4 w-4 text-amber-500 fill-amber-50 animate-pulse cursor-help shrink-0" />
                                                <div className="absolute left-6 top-1/2 -translate-y-1/2 hidden group-hover:block bg-slate-950 text-white p-3 rounded-xl text-[10px] w-64 z-50 shadow-2xl leading-relaxed whitespace-normal rounded-tl-none">
                                                  <span className="font-extrabold text-amber-400 block mb-1 uppercase tracking-widest font-mono text-[9px]">🚨 Splitting Deficit Alert:</span>
                                                  <div className="space-y-1">
                                                    {c.warnings.map((w: string, idx: number) => (
                                                      <p key={idx}>• {w}</p>
                                                    ))}
                                                  </div>
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        </td>
                                        <td className="p-3.5">
                                          <span className="font-bold block text-slate-850">{c.employeeName}</span>
                                          <span className="text-[10px] text-slate-500 font-mono block uppercase">{c.department} • {c.dateMonth}</span>
                                        </td>
                                        <td className="p-3.5">
                                          <div className="space-y-1.5 max-w-[150px] inline-block w-full">
                                            <div className="flex justify-between items-center gap-1.5">
                                              <span className="font-extrabold text-slate-800 text-xs">₹{c.totalAmount.toLocaleString("en-IN")}</span>
                                              <span className="text-[10.5px] text-emerald-600 font-mono font-bold shrink-0">
                                                {(((c.totalPaid || 0) / c.totalAmount) * 100).toFixed(0)}%
                                              </span>
                                            </div>
                                            
                                            {/* Horizontal Multi-status progress gauge */}
                                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex shadow-inner">
                                              <div
                                                style={{ width: `${Math.min(100, (((c.totalPaid || 0) / c.totalAmount) * 100))}%` }}
                                                className="bg-emerald-500 h-full"
                                                title={`Paid: ₹${(c.totalPaid || 0).toLocaleString()}`}
                                              ></div>
                                              <div
                                                style={{ width: `${Math.min(100, (((c.totalPending || 0) / c.totalAmount) * 100))}%` }}
                                                className="bg-amber-400 h-full"
                                                title={`Pending: ₹${(c.totalPending || 0).toLocaleString()}`}
                                              ></div>
                                            </div>
                                            
                                            <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-500 leading-tight">
                                              <span>Paid: ₹{(c.totalPaid || 0).toLocaleString("en-IN")}</span>
                                              {c.totalPending > 0 && (
                                                <span className="text-amber-600 font-semibold ml-1">Pending: ₹{c.totalPending.toLocaleString("en-IN")}</span>
                                              )}
                                            </div>
                                          </div>
                                        </td>
                                        <td className="p-3.5">
                                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono uppercase font-black tracking-wider ${
                                            c.status === "Paid" ? "bg-emerald-100 text-emerald-800 border border-emerald-200" :
                                            c.status === "Partially Paid" ? "bg-amber-100 text-amber-800 border border-amber-200" :
                                            "bg-indigo-100 text-indigo-800 border border-indigo-200"
                                          }`}>
                                            {c.status}
                                          </span>
                                        </td>
                                        <td className="p-3.5 text-right pr-5">
                                          <button
                                            type="button"
                                            className="text-xs text-indigo-600 hover:text-indigo-800 font-bold"
                                            onClick={() => {
                                              setSelectedCommission(c);
                                              setComPayoutAmount(String(c.pendingBalance));
                                            }}
                                          >
                                            Inspect &rarr;
                                          </button>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                  {filteredCommissions.length === 0 && (
                                    <tr>
                                      <td colSpan={5} className="p-10 text-center text-slate-405 font-medium">
                                        No matched marketing expense plan rules found.
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Right Column details expansion pane */}
                          <div className="col-span-1 lg:col-span-2 space-y-6">
                            {selectedCommission ? (
                              <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm space-y-5 animate-fade-in text-slate-800 relative">
                                
                                {/* Detail Header banner */}
                                <div className="border-b pb-4 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] bg-slate-900 text-slate-100 font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded">
                                      {selectedCommission.id}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest font-mono ${
                                      selectedCommission.status === "Paid" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                                      selectedCommission.status === "Partially Paid" ? "bg-amber-50 text-amber-700 border border-amber-100" :
                                      "bg-indigo-50 text-indigo-700 border border-indigo-100"
                                    }`}>
                                      {selectedCommission.status}
                                    </span>
                                  </div>
                                  
                                  <h4 className="font-extrabold text-[#111827] text-md leading-normal">
                                    {selectedCommission.purpose}
                                  </h4>
                                  
                                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-slate-500">
                                    <span>Authorized Target:</span>
                                    <strong className="text-slate-800 font-bold text-slate-850 text-right">{selectedCommission.employeeName}</strong>
                                    
                                    <span>Corporate Unit:</span>
                                    <strong className="text-slate-800 font-mono text-[11px] text-right">{selectedCommission.department || "N/A"}</strong>
                                    
                                    <span>Target Cycle:</span>
                                    <strong className="text-slate-800 font-bold text-right">{selectedCommission.dateMonth}</strong>

                                    <span>Authorized By:</span>
                                    <strong className="text-slate-800 font-bold text-right">{selectedCommission.createdBy || "Super Admin"}</strong>
                                  </div>
                                </div>

                                {/* Dynamic progress indicator */}
                                <div className="space-y-2.5">
                                  <div className="flex justify-between text-xs font-bold font-mono">
                                    <span className="text-slate-400 uppercase text-[10px]">Real-Time Progress Meter</span>
                                    <span className="text-slate-800 font-black">
                                      ₹{(selectedCommission.totalPaid || 0).toLocaleString("en-IN")} / ₹{selectedCommission.totalAmount.toLocaleString("en-IN")}
                                    </span>
                                  </div>
                                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex shadow-inner">
                                    <div
                                      style={{ width: `${Math.min(100, ((selectedCommission.totalPaid || 0) / selectedCommission.totalAmount) * 100)}%` }}
                                      className="bg-emerald-600 h-full transition-all"
                                    ></div>
                                    <div
                                      style={{ width: `${Math.min(100, ((selectedCommission.totalPending || 0) / selectedCommission.totalAmount) * 100)}%` }}
                                      className="bg-amber-400 h-full transition-all"
                                    ></div>
                                  </div>
                                  <div className="flex justify-between text-[10px] font-extrabold font-mono text-slate-450 uppercase tracking-wider">
                                    <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 bg-emerald-600 rounded-full"></span>Disbursed Paid</span>
                                    <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 bg-amber-400 rounded-full"></span>Pending Review</span>
                                    <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 bg-indigo-200 rounded-full"></span>Unpaid Balance</span>
                                  </div>
                                </div>

                                {/* Warning Highlight if any dynamic alert triggers */}
                                {selectedCommission.warnings && selectedCommission.warnings.length > 0 && (
                                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-2 text-amber-950">
                                    <div className="flex items-center gap-1.5 text-amber-900 font-black text-[10px] font-mono uppercase tracking-wider">
                                      <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                                      <span>Security Audit Warnings ({selectedCommission.warnings.length})</span>
                                    </div>
                                    <div className="space-y-1 text-xs">
                                      {selectedCommission.warnings.map((w: string, idx: number) => (
                                        <p key={idx} className="leading-relaxed font-semibold">• {w}</p>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* INTERNAL PERFORMANCE NOTE */}
                                {selectedCommission.notes && (
                                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 text-xs">
                                    <b className="font-bold text-[10px] uppercase font-mono tracking-wider block text-slate-450 mb-1">Entitlement Contract Notes:</b>
                                    <p className="text-slate-600 leading-relaxed font-sans">{selectedCommission.notes}</p>
                                  </div>
                                )}

                                {/* CREATE AUTOMATED PAYOUT VOUCHER CARD */}
                                <div className="bg-gradient-to-r from-indigo-50/50 to-indigo-50 border border-indigo-150 rounded-2xl p-4 space-y-3.5">
                                  <div className="flex items-center justify-between border-b border-indigo-100 pb-1.5">
                                    <h4 className="font-extrabold text-xs uppercase font-mono tracking-wider text-indigo-950 flex items-center gap-1.5">
                                      <Coins className="h-4 w-4 text-indigo-600" />
                                      <span>Initialize Linked Cash Payout</span>
                                    </h4>
                                    <span className="text-[10px] font-extrabold font-mono text-indigo-600">Pending: ₹{selectedCommission.pendingBalance.toLocaleString("en-IN")}</span>
                                  </div>

                                  {(currentUser.role === "admin" || currentUser.role === "superadmin") ? (
                                    selectedCommission.pendingBalance > 0 ? (
                                      <form onSubmit={saveCommissionPayout} className="space-y-3">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                          <div>
                                            <label className="block text-[9px] uppercase font-bold text-indigo-800 font-mono mb-1">Payout Amount (₹)</label>
                                            <input
                                              type="number"
                                              value={comPayoutAmount}
                                              onChange={(e) => setComPayoutAmount(e.target.value)}
                                              placeholder="₹ Payout value"
                                              max={selectedCommission.pendingBalance}
                                              className="w-full bg-white border border-indigo-200 rounded-xl p-2 text-xs text-indigo-950 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-[9px] uppercase font-bold text-indigo-800 font-mono mb-1">Action Type</label>
                                            <div className="flex gap-2.5 pt-1.5">
                                              <button
                                                type="button"
                                                onClick={() => setComPayoutAmount(String(selectedCommission.pendingBalance))}
                                                className="text-[10px] font-extrabold text-indigo-700 bg-white hover:bg-slate-100/50 border border-indigo-150 px-2.5 py-1 rounded-lg shadow-sm"
                                              >
                                                Full/Final
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => setComPayoutAmount(String(Math.floor(selectedCommission.pendingBalance / 2)))}
                                                className="text-[10px] font-extrabold text-indigo-700 bg-white hover:bg-slate-100/50 border border-indigo-150 px-2.5 py-1 rounded-lg"
                                              >
                                                Partial 50%
                                              </button>
                                            </div>
                                          </div>
                                        </div>

                                        <div>
                                          <label className="block text-[9px] uppercase font-bold text-indigo-800 font-mono mb-0.5">Disbursal Memo / Remarks</label>
                                          <input
                                            type="text"
                                            value={comPayoutRemark || ""}
                                            onChange={(e) => setComPayoutRemark(e.target.value)}
                                            placeholder="e.g., Target Milestone 1 payment..."
                                            className="w-full bg-white border border-indigo-200 rounded-xl p-2 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                          />
                                        </div>

                                        <button
                                          type="submit"
                                          disabled={loading}
                                          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-350 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl cursor-pointer transition shadow-md flex items-center justify-center gap-1.5"
                                        >
                                          <Send className="h-3.5 w-3.5" />
                                          <span>Generate Auto-Filled Cash Voucher</span>
                                        </button>
                                      </form>
                                    ) : (
                                      <div className="text-center p-4 bg-white/70 border border-emerald-100 rounded-xl text-emerald-950 text-xs font-semibold">
                                        🎉 Master entitlement plan completely paid under zero deficit balance!
                                      </div>
                                    )
                                  ) : (
                                    <div className="text-center p-4 bg-white/70 border border-slate-150 rounded-xl text-slate-500 text-xs font-medium leading-relaxed">
                                      🔒 Only Corporate Administrators & Super Administrators can generate Cash Voucher payouts for Management Marketing Expenses.
                                    </div>
                                  )}
                                </div>

                                {/* PAYOUT HISTORY LOG & LINKED VOUCHERS */}
                                <div className="space-y-2.5">
                                  <div className="flex items-center justify-between border-b pb-1.5">
                                    <h4 className="font-extrabold text-[10px] uppercase font-mono tracking-wider text-slate-500">
                                      Payout History & Audited Vouchers
                                    </h4>
                                    <span className="text-[10px] font-mono font-bold text-slate-400">
                                      Count: {selectedCommission.payouts?.length || 0} docs
                                    </span>
                                  </div>

                                  <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {selectedCommission.payouts && selectedCommission.payouts.length > 0 ? (
                                      selectedCommission.payouts.map((p: any) => {
                                        return (
                                          <div key={p.id} className="bg-slate-50 border border-slate-150 p-2.5 rounded-xl flex items-center justify-between text-xs transition hover:bg-slate-100/50">
                                            <div className="space-y-0.5 max-w-[200px]">
                                              <span className="font-extrabold text-indigo-905 block font-mono">
                                                {p.documentNumber}
                                              </span>
                                              <span className="text-[10px] text-slate-500 block">
                                                {p.submissionDate} • Amount: <strong>₹{p.amount.toLocaleString("en-IN")}</strong>
                                              </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase shrink-0 ${
                                                p.status === "Approved" ? "bg-emerald-100 text-emerald-800 border border-emerald-200" :
                                                p.status === "Rejected" ? "bg-red-100 text-red-800 border border-red-200" :
                                                p.cancellationStatus === "Cancelled" ? "bg-slate-205 text-slate-600 border border-slate-300" :
                                                "bg-amber-100 text-amber-800 border border-amber-200"
                                              }`}>
                                                {p.status} {p.cancellationStatus === "Cancelled" ? "(Void)" : ""}
                                              </span>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  // Find standard request record inside system core list
                                                  const originalDoc = requestsList.find(
                                                    (r) => r.id === p.id || (r.documentNumber && r.documentNumber === p.documentNumber)
                                                  );
                                                  if (originalDoc) {
                                                    setActiveRequestDetails(originalDoc);
                                                  } else {
                                                    setAppError(`Original voucher ${p.documentNumber} document record not loaded.`);
                                                    setTimeout(() => setAppError(""), 3000);
                                                  }
                                                }}
                                                className="p-1 px-2.5 text-indigo-700 bg-indigo-50 border border-indigo-150 rounded-lg hover:bg-indigo-100 text-[9px] font-bold font-mono transition"
                                              >
                                                INSPECT
                                              </button>
                                            </div>
                                          </div>
                                        );
                                      })
                                    ) : (
                                      <div className="text-center p-6 text-slate-400 italic">No payouts initiated yet.</div>
                                    )}
                                  </div>
                                </div>

                              </div>
                            ) : (
                              <div className="bg-white p-10 rounded-2xl border border-slate-150 shadow-sm text-center text-slate-400 font-semibold space-y-1.5 h-[340px] flex flex-col items-center justify-center">
                                <Coins className="h-10 w-10 text-slate-300 mx-auto" />
                                <strong className="block text-slate-600 text-xs uppercase font-mono tracking-widest mt-2">Active Entitlement Inspector</strong>
                                <p className="text-[11px] font-sans max-w-xs leading-normal">
                                  Select an employee master parent marketing expense record on the left grid panel to inspect detailed dynamic allocations, suspicious split parameters, warnings, and file automated payouts.
                                </p>
                              </div>
                            )}
                          </div>

                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

            </div>

          </main>

          {/* ACTIVE REQUEST DETAIL SLIDE-OVER DRAWER COMPONENT */}
          {activeRequestDetails && (
            <div className="fixed inset-0 overflow-hidden z-50 flex justify-end" id="accord-compliance-slidecover">
              
              {/* Back backdrop dismiss */}
              <div 
                className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm transition-opacity"
                onClick={() => setActiveRequestDetails(null)}
              ></div>

              {/* Drawer panel */}
              <div className="relative w-full max-w-lg bg-white shadow-2xl h-full flex flex-col z-50 border-l border-gray-150">
                
                {/* Drawer Header specs */}
                <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 pt-6">
                  <div>
                    {activeRequestDetails.documentNumber && (
                      <span className="bg-indigo-600 text-indigo-100 font-mono text-[10px] uppercase tracking-widest font-black px-2 py-0.5 rounded mr-2 inline-block shadow-sm">
                        {activeRequestDetails.documentNumber}
                      </span>
                    )}
                    <span className="font-mono text-amber-400 text-xs tracking-wider uppercase font-bold">Reference ID: {activeRequestDetails.id}</span>
                    <h4 className="text-md font-extrabold tracking-tight mt-1 truncate max-w-[320px]">{activeRequestDetails.projectName}</h4>
                  </div>
                  <button 
                    onClick={() => setActiveRequestDetails(null)}
                    className="hover:bg-slate-800 text-slate-400 hover:text-white p-1 rounded-full transition cursor-pointer"
                    aria-label="Dismiss drawer"
                  >
                    <XCircle className="h-5 w-5" />
                  </button>
                </div>

                {/* Content body wrapper scroll */}
                <div className="flex-grow overflow-y-auto p-5 space-y-6">

                  {/* Linked Cash Voucher controls and status representation - Permanent Option */}
                  {(() => {
                    const linkedDoc = requestsList.find(
                      (r: any) => 
                        r.id === activeRequestDetails.linkedDocumentId || 
                        (r.category === "Cash Voucher" && r.linkedDocumentId === activeRequestDetails.id)
                    );
                    const alreadyHasCashVoucher = !!linkedDoc;
                    const linkedDocNo = activeRequestDetails.linkedDocumentNumber || linkedDoc?.documentNumber || "Linked CV";

                    return (
                      <div className="space-y-3">
                        <div className="bg-gradient-to-r from-indigo-50 to-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-slate-800">
                              <Plus className="h-4 w-4 text-indigo-600" />
                              <span className="font-extrabold text-[10px] uppercase font-mono tracking-wider">Settlement & Cash Outflow</span>
                            </div>
                            {alreadyHasCashVoucher && (
                              <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[9px] font-bold font-mono uppercase">CV Connected</span>
                            )}
                          </div>
                          
                          <p className="text-[11px] text-slate-600 leading-normal">
                            Generate an official Cash Voucher mapped directly to this claim data. This option remains permanently active for continuous ledger balancing.
                          </p>
                          
                          {alreadyHasCashVoucher ? (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-900 leading-relaxed space-y-1">
                              <p className="font-extrabold flex items-center gap-1 text-amber-950 font-mono text-[9px] uppercase tracking-wider">
                                ⚠️ Duplicate Prevention Active
                              </p>
                              <p>
                                An active Cash Voucher (<strong>{linkedDocNo}</strong>) already exists for this record.
                                To eliminate double-counting of expenses, further generations are blocked, protecting corporate financial aggregates from duplicate payouts.
                              </p>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleCreateLinkedCashVoucher(activeRequestDetails)}
                              disabled={loading}
                              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-extrabold text-xs py-2 px-3 rounded-xl transition cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                            >
                              {loading ? (
                                <span>Generating...</span>
                              ) : (
                                <>
                                  <Plus className="h-4 w-4" />
                                  <span>Generate Linked Cash Voucher</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>

                        {alreadyHasCashVoucher && (
                          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between text-xs text-emerald-950">
                            <div className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                              <div>
                                <span className="font-extrabold block text-[10px] uppercase font-mono text-emerald-800">Linked Cash Voucher Active</span>
                                <span className="text-[10px] text-emerald-900 font-semibold font-mono">
                                  Linked Doc: <strong>{linkedDocNo}</strong>
                                </span>
                              </div>
                            </div>
                            {linkedDoc && (
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveRequestDetails(linkedDoc);
                                }}
                                className="text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg font-bold font-mono uppercase transition shrink-0 cursor-pointer"
                              >
                                View CV
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {activeRequestDetails.cancellationStatus && (
                    <div className="bg-red-100 border border-red-300 p-4 rounded-xl text-sans shadow-sm animate-pulse">
                      <div className="flex items-center space-x-2 text-red-900 font-extrabold text-xs uppercase font-mono">
                        <AlertCircle className="h-5 w-5 text-red-650" />
                        <span>⚠ DECLARED VOID / CANCELLED</span>
                      </div>
                      <div className="text-[11px] text-red-800 mt-2 space-y-1 bg-white/70 p-2.5 rounded-lg border border-red-200 leading-normal font-medium">
                        <p><strong>Status:</strong> Cancelled & Void (Sequence slot locked)</p>
                        <p><strong>Executed By:</strong> {activeRequestDetails.cancelledBy}</p>
                        <p><strong>Timeline:</strong> {activeRequestDetails.cancelledDate ? new Date(activeRequestDetails.cancelledDate).toLocaleDateString() : "N/A"}</p>
                        <p><strong>Reason:</strong> "{activeRequestDetails.cancelledReason}"</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Real PDF Document Exporter option */}
                  <div className="bg-emerald-50 border border-emerald-250 p-4 rounded-xl flex items-center justify-between shadow-sm animate-fade-in text-sans">
                    <div className="space-y-1">
                      <span className="font-extrabold text-[10px] uppercase text-emerald-800 tracking-wider block font-mono">Ledger Certificate</span>
                      <p className="text-[11px] text-slate-750 font-medium leading-normal">Download certified spends, status records & timelines.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => downloadApprovalPDF(activeRequestDetails)}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs py-2 px-4 rounded-lg flex items-center space-x-1.5 transition shadow-sm cursor-pointer shrink-0"
                      title="Export to PDF"
                    >
                      <Download className="h-4 w-4 shrink-0" />
                      <span>Get PDF</span>
                    </button>
                  </div>

                  {/* Archived Cloud Copies */}
                  {savedPdfs && savedPdfs.filter((p: any) => p.requestId === activeRequestDetails.id).length > 0 && (
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3.5 shadow-xs text-sans animate-fade-in">
                      <div className="space-y-0.5">
                        <span className="font-extrabold text-[10px] uppercase text-indigo-700 tracking-wider block font-mono">Archived Original Cloud PDFs ({savedPdfs.filter((p: any) => p.requestId === activeRequestDetails.id).length})</span>
                        <p className="text-[10px] text-slate-500 font-medium font-sans">This records the exact, immutable copy of the document at the time it was issued / finalized.</p>
                      </div>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {savedPdfs.filter((p: any) => p.requestId === activeRequestDetails.id).map((p: any) => (
                          <div key={p.id} className="flex items-center justify-between bg-white px-3 py-2.5 rounded-lg border border-slate-150 text-[11px] shadow-2xs hover:border-indigo-300 transition">
                            <span className="font-semibold text-slate-700 truncate max-w-[190px] font-mono mr-2" title={p.fileName}>
                              📄 {p.fileName}
                            </span>
                            <div className="flex items-center space-x-2 shrink-0">
                              <span className="text-[9px] text-slate-400 font-medium mr-1">{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : ""}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const link = document.createElement("a");
                                  link.href = p.fileContent;
                                  link.download = p.fileName;
                                  link.click();
                                }}
                                className="bg-indigo-50 hover:bg-slate-100 text-indigo-700 hover:text-indigo-900 border border-indigo-200 hover:border-indigo-350 px-2 py-1 rounded-md font-bold font-mono text-[9.5px] tracking-wide uppercase cursor-pointer"
                              >
                                Download
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Filer info container description summary */}
                  <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 space-y-2 text-xs font-semibold">
                    <span className="font-extrabold text-[10px] uppercase text-slate-600 block">Workflow Submission Specs</span>
                    <p className="text-slate-800">Assigned Corporate Segment code: <strong className="font-mono text-slate-1000 tracking-wider font-bold">{activeRequestDetails.enterpriseCode}</strong></p>
                    <p>Filer personnel: <strong className="text-slate-800 font-bold">{activeRequestDetails.employeeName}</strong> (ID: {activeRequestDetails.userId})</p>
                    <p>Financial segregation: <strong className="text-slate-800 font-bold">{activeRequestDetails.category}</strong></p>
                    <p>Filing completed timeline: <strong className="font-mono text-slate-800">{activeRequestDetails.submissionDate}</strong></p>
                  </div>

                  {/* Cash Voucher format layout inside details drawer */}
                  {activeRequestDetails.cashVoucherDetails && (
                    <div className="space-y-4 animate-fade-in" id="drawer-cash-voucher-subview">
                      <div className="flex items-center space-x-1.5 border-b border-amber-200 pb-1.5">
                        <Receipt className="h-4 w-4 text-emerald-800" />
                        <span className="font-extrabold text-[9px] uppercase tracking-wider text-emerald-950 font-mono font-bold">Certified Cash Voucher Record</span>
                      </div>

                      {/* Cash Voucher Paper Mockup Rendering */}
                      <div className="bg-[#fdfcfb] p-5 rounded-2xl border border-amber-300 shadow-sm text-[11px] space-y-4 relative overflow-hidden" style={{ backgroundImage: "radial-gradient(#f0f0f0 1px, transparent 1px)", backgroundSize: "16px 16px" }}>
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-600"></div>
                        
                        {/* Title details */}
                        <div className="border-b border-dashed border-slate-350 pb-2 flex justify-between items-baseline">
                          <span className="font-mono text-[10px] text-red-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded">No. {activeRequestDetails.cashVoucherDetails.voucherNo}</span>
                          <span className="font-serif font-black text-slate-800 uppercase text-[11px]">{activeRequestDetails.enterpriseName || currentUser?.enterpriseName || "PROFLOW ENTERPRISE"}</span>
                          <span className="font-mono text-[9px] text-slate-500 font-bold">Date: {activeRequestDetails.cashVoucherDetails.fileNo}</span>
                        </div>

                        <div className="font-mono text-center font-black tracking-widest text-[10px] text-slate-700 underline underline-offset-4">CASH VOUCHER</div>

                        {/* Expenses Head Row */}
                        <div className="flex items-baseline space-x-1 border-b border-dashed border-slate-200 pb-1">
                          <span className="font-serif font-bold text-slate-900">Expenses Head:</span>
                          <span className="text-emerald-950 font-serif italic font-bold text-xs">{activeRequestDetails.cashVoucherDetails.debitTo}</span>
                        </div>

                        {/* Expense detail */}
                        <div className="space-y-1">
                          <span className="text-[9px] uppercase font-serif text-slate-500 block">Particulars/Expenses description:</span>
                          <div className="p-2.5 bg-amber-50/50 rounded-lg border border-amber-100 font-serif italic text-slate-800 leading-normal text-[11px]">
                            {activeRequestDetails.cashVoucherDetails.expenseDetails}
                          </div>
                        </div>

                        {/* Incurred By mr. / ms. Row */}
                        <div className="flex items-baseline space-x-1 border-b border-dashed border-slate-200 pb-1">
                          <span className="font-serif font-bold text-slate-900">Incurred By mr. / ms.:</span>
                          <span className="text-slate-800 font-serif italic font-semibold">
                            {activeRequestDetails.cashVoucherDetails.incurredBy || activeRequestDetails.employeeName || "N/A"}
                          </span>
                        </div>

                        {/* Amount */}
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px] font-sans">
                          <div className="bg-emerald-50/50 px-2 py-1 rounded-lg border border-emerald-100 flex items-center">
                            <span className="font-serif font-black text-emerald-800 mr-2">Rs.</span>
                            <span className="font-mono font-black text-emerald-950 text-xs">
                              <InteractiveAmount amount={activeRequestDetails.totalBudget} showCurrency={false} /> /-
                            </span>
                          </div>
                          <div>
                            <span className="text-[8px] uppercase font-mono font-bold text-slate-400 block font-bold">Rupees in words</span>
                            <p className="font-serif italic text-slate-800 leading-tight text-[10px] font-bold">{activeRequestDetails.cashVoucherDetails.amountInWords || "N/A"}</p>
                          </div>
                        </div>

                        {/* Signature outputs */}
                        <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-200 text-[8px] text-slate-550 font-medium">
                          <div className="border-r border-slate-150 pr-1 space-y-1">
                            <span className="block uppercase tracking-wider font-mono text-[7px] text-slate-400 font-bold">Incurred By</span>
                            <span className="font-serif text-slate-900 font-extrabold italic text-[9px] block leading-tight">
                              {activeRequestDetails.cashVoucherDetails.incurredBy || activeRequestDetails.employeeName}
                            </span>
                            <span className="text-[7px] text-slate-400 block">Designation: Filer</span>
                            <span className="text-[7px] text-slate-400 block font-mono">Date: {activeRequestDetails.submissionDate}</span>
                          </div>
                          <div className="border-r border-slate-150 pr-1 space-y-1">
                            <span className="block uppercase tracking-wider font-mono text-[7px] text-slate-400 font-bold">Checked By</span>
                            {activeRequestDetails.headApprovalStatus === "Approved" ? (
                              <>
                                <span className="font-serif text-emerald-850 font-extrabold italic text-[9px] block leading-tight">
                                  {activeRequestDetails.headApprovedBy || activeRequestDetails.assignedHeadName}
                                </span>
                                <span className="text-[7px] text-emerald-700 block font-bold">✓ Approved</span>
                                <span className="text-[7px] text-slate-400 block">
                                  Designation: {activeRequestDetails.headApprovedBy?.toLowerCase().includes("authorized approver") ? "Authorized Approver" : "Dept Head"}
                                </span>
                                {activeRequestDetails.headApprovalDate && (
                                  <span className="text-[7px] text-slate-400 block font-mono">Date: {activeRequestDetails.headApprovalDate}</span>
                                )}
                              </>
                            ) : (
                              <>
                                <span className="font-serif text-slate-400 italic text-[10px] block truncate leading-tight">
                                  {activeRequestDetails.assignedHeadName || "Dept Head"}
                                </span>
                                <span className="text-[7px] text-amber-600 block">⚠ Awaiting Review</span>
                                <span className="text-[7px] text-slate-400 block">
                                  Designation: {departmentHeads.find(h => h.id === activeRequestDetails.assignedHeadId)?.role === "employee" ? "Authorized Approver" : "Dept Head"}
                                </span>
                              </>
                            )}
                          </div>
                          <div className="space-y-1">
                            <span className="block uppercase tracking-wider font-mono text-[7px] text-slate-400 font-bold">Authorized By</span>
                            {activeRequestDetails.superAdminApprovalStatus === "Approved" || activeRequestDetails.adminApprovalStatus === "Approved" ? (
                              <>
                                <span className="font-serif text-emerald-850 font-extrabold italic text-[9px] block leading-tight">
                                  {activeRequestDetails.superAdminApprovedBy || activeRequestDetails.adminApprovedBy || activeRequestDetails.assignedAdminName || "Admin Executive"}
                                </span>
                                <span className="text-[7px] text-emerald-700 block font-bold">✓ Approved</span>
                                <span className="text-[7px] text-slate-400 block leading-none">
                                  Designation: {activeRequestDetails.superAdminApprovedBy ? "Super Admin" : "Company Admin"}
                                </span>
                                {(activeRequestDetails.superAdminApprovalDate || activeRequestDetails.adminApprovalDate) && (
                                  <span className="text-[7px] text-slate-400 block font-mono">Date: {activeRequestDetails.superAdminApprovalDate || activeRequestDetails.adminApprovalDate}</span>
                                )}
                              </>
                            ) : (
                              <>
                                <span className="font-serif text-slate-400 italic text-[10px] block truncate leading-tight">
                                  {activeRequestDetails.assignedAdminName || "Administrator"}
                                </span>
                                <span className="text-[7px] text-amber-600 block">⚠ Awaiting Review</span>
                                <span className="text-[7px] text-slate-400 block">Designation: Admin</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Supporting bill proof section */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-[11px] space-y-3">
                        <div className="flex items-center space-x-1.5 border-b border-slate-200 pb-1">
                          <ClipboardList className="h-3.5 w-3.5 text-slate-700" />
                          <span className="font-black text-slate-700 font-mono tracking-wider uppercase text-[10px]">Verified Proof Invoice</span>
                        </div>

                        {activeRequestDetails.cashVoucherDetails.billParticulars ? (
                          <div className="space-y-2">
                            <div className="grid grid-cols-3 gap-2 text-[10px]">
                              <div>
                                <span className="text-slate-400 font-mono block">Bill Date</span>
                                <strong className="text-slate-800 font-bold">{activeRequestDetails.cashVoucherDetails.billDate}</strong>
                              </div>
                              <div className="col-span-2">
                                <span className="text-slate-400 font-mono block">Item / Particulars</span>
                                <strong className="text-slate-800 font-bold truncate block">{activeRequestDetails.cashVoucherDetails.billParticulars}</strong>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-[10px] bg-white p-2 rounded border border-slate-150">
                              <div>
                                <span className="text-slate-400 font-mono block">Rate Structure</span>
                                <strong className="text-slate-800 font-bold">{activeRequestDetails.cashVoucherDetails.billRate || "N/A"}</strong>
                              </div>
                              <div className="text-right">
                                <span className="text-slate-400 font-mono block">Certified Value</span>
                                <strong className="text-emerald-800 font-black">
                                  <InteractiveAmount amount={Number(activeRequestDetails.cashVoucherDetails.billAmount || activeRequestDetails.totalBudget)} />
                                </strong>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p className="text-slate-500 italic">No custom Bill transaction metadata logged. Proof based directly on main voucher figures.</p>
                        )}

                        {/* Rendering attachment proof display if we have attachments */}
                        {activeRequestDetails.attachments && activeRequestDetails.attachments.length > 0 && (
                          <div className="space-y-1.5 pt-1.5 border-t border-slate-200">
                            <span className="text-[9px] uppercase font-mono font-bold text-slate-500 block">Supporting Attachment File</span>
                            <div className="flex items-center space-x-2.5 p-2 bg-white rounded-lg border border-slate-100 shadow-sm">
                              <div className="p-1 px-1.5 bg-emerald-600 text-white font-black font-mono tracking-widest text-[8px] rounded uppercase">Proof</div>
                              <div className="flex-grow min-w-0">
                                <p className="text-slate-800 font-bold font-mono text-[10px] truncate">{activeRequestDetails.attachments[0]}</p>
                              </div>
                              <div className="shrink-0 flex items-center space-x-1.5">
                                <span className="text-[9px] px-1.5 py-0.5 bg-emerald-50 text-emerald-800 rounded font-bold uppercase font-mono">Secure API Stream</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Travelling Expenses format layout inside details drawer */}
                  {activeRequestDetails.travelExpensesDetails && (
                    <div className="space-y-4 animate-fade-in" id="drawer-travel-expenses-subview">
                      <div className="flex items-center space-x-1.5 border-b border-teal-200 pb-1.5">
                        <Receipt className="h-4 w-4 text-teal-850" />
                        <span className="font-extrabold text-[9px] uppercase tracking-wider text-teal-905 font-mono font-bold">Certified Traveling Expenses Record</span>
                      </div>

                      {/* Travel Expenses Paper Mockup Rendering representing uploaded file */}
                      <div className="bg-[#fcfdfd] p-5 rounded-2xl border border-teal-300 shadow-sm text-[11px] space-y-4 relative overflow-hidden" style={{ backgroundImage: "radial-gradient(#ebebeb 1px, transparent 1px)", backgroundSize: "16px 16px" }}>
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-teal-800"></div>
                        
                        {/* Title details */}
                        <div className="border-b border-dashed border-slate-300 pb-2 flex justify-between items-baseline">
                          <span className="font-mono text-[10px] text-teal-850 font-bold bg-teal-50 border border-teal-100 px-1.5 py-0.5 rounded">No. {activeRequestDetails.travelExpensesDetails.voucherNo}</span>
                          <span className="font-serif font-black text-slate-800 uppercase text-[11px]">{activeRequestDetails.enterpriseName || currentUser?.enterpriseName || "PROFLOW ENTERPRISE"}</span>
                          <span className="font-mono text-[9px] text-slate-500 font-bold">Date: {activeRequestDetails.travelExpensesDetails.dateDesc}</span>
                        </div>

                        <div className="font-mono text-center font-black tracking-widest text-[10px] text-slate-700 underline underline-offset-4">TRAVELLING EXPENSES</div>

                        {/* Name Row */}
                        <div className="flex items-baseline space-x-1 border-b border-dashed border-slate-200 pb-1">
                          <span className="font-serif font-bold text-slate-900 uppercase">Name:</span>
                          <span className="text-teal-950 font-serif italic font-bold text-xs">{activeRequestDetails.travelExpensesDetails.name}</span>
                        </div>

                        {/* Details/Purpose deets */}
                        <div className="space-y-1">
                          <span className="text-[9px] uppercase font-serif text-slate-500 block">Particulars/Journey purpose:</span>
                          <div className="p-2.5 bg-teal-50/30 rounded-lg border border-teal-150 font-serif italic text-slate-800 leading-normal text-[11px] font-semibold">
                            {activeRequestDetails.travelExpensesDetails.details}
                          </div>
                        </div>

                        {/* Ledger Grid */}
                        <div className="overflow-x-auto pt-2">
                          <table className="w-full border-collapse border border-slate-350 text-[10px] font-sans">
                            <thead>
                              <tr className="bg-slate-50 text-center font-bold text-slate-700">
                                <th className="border border-slate-350 py-1 w-10">SR.NO.</th>
                                <th className="border border-slate-350 py-1 w-20">DATE</th>
                                <th className="border border-slate-350 py-1">PARTICULAR</th>
                                <th className="border border-slate-350 py-1 w-20">AMOUNT</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(activeRequestDetails.travelExpensesDetails.rows || []).map((row: any) => (
                                <tr key={row.id || row.serialNo} className="hover:bg-slate-50">
                                  <td className="border border-slate-350 text-center py-1.5 font-mono text-slate-650 font-bold">{row.serialNo}</td>
                                  <td className="border border-slate-350 text-center py-1.5 font-mono text-slate-650">{row.date}</td>
                                  <td className="border border-slate-350 px-2 py-1.5 text-slate-800">{row.particular}</td>
                                  <td className="border border-slate-350 px-2 py-1.5 text-right font-mono font-bold">₹{Number(row.amount).toFixed(2)}</td>
                                </tr>
                              ))}
                              <tr className="bg-slate-100/60 font-bold text-slate-800">
                                <td colSpan={3} className="border border-slate-350 text-center py-1.5 uppercase font-mono tracking-wider">TOTAL</td>
                                <td className="border border-slate-350 px-2 py-1.5 text-right font-mono font-black text-xs text-teal-900 bg-teal-50">
                                  <InteractiveAmount amount={Number(activeRequestDetails.travelExpensesDetails.totalAmount || activeRequestDetails.totalBudget)} />
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {/* Signature Block matching requirements precisely */}
                        <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-200 text-[8px] text-slate-550 font-medium">
                          
                          {/* Created By Block */}
                          <div className="border-r border-slate-150 pr-1 space-y-1">
                            <span className="block uppercase tracking-wider font-mono text-[7px] text-slate-400 font-bold">Created By</span>
                            <span className="font-serif text-slate-900 font-extrabold italic text-[9px] block leading-tight">
                              {activeRequestDetails.travelExpensesDetails.createdByName || activeRequestDetails.travelExpensesDetails.name || activeRequestDetails.employeeName}
                            </span>
                            <span className="text-[7px] text-slate-400 block">Designation: Filer</span>
                            <span className="text-[7px] text-slate-400 block font-mono">Date: {activeRequestDetails.submissionDate}</span>
                          </div>

                          {/* Checked By (Head level approval hierarchy) */}
                          <div className="border-r border-slate-150 pr-1 space-y-1">
                            <span className="block uppercase tracking-wider font-mono text-[7px] text-slate-400 font-bold">Checked By</span>
                            {activeRequestDetails.headApprovalStatus === "Approved" ? (
                              <>
                                <span className="font-serif text-emerald-850 font-extrabold italic text-[9px] block leading-tight">
                                  {activeRequestDetails.headApprovedBy || activeRequestDetails.assignedHeadName || "Company Authority"}
                                </span>
                                <span className="text-[7px] text-slate-400 block">
                                  Designation: {activeRequestDetails.headApprovedBy?.toLowerCase().includes("authorized approver") ? "Authorized Approver" : "Department Head"}
                                </span>
                                {activeRequestDetails.headApprovalDate && (
                                  <span className="text-[7px] text-slate-400 block font-mono">Date: {activeRequestDetails.headApprovalDate}</span>
                                )}
                              </>
                            ) : activeRequestDetails.headApprovalStatus === "Rejected" ? (
                              <>
                                <span className="font-serif text-red-650 font-extrabold line-through text-[9px] block leading-tight">
                                  {activeRequestDetails.headApprovedBy || activeRequestDetails.assignedHeadName}
                                </span>
                                <span className="text-[7px] text-red-500 block">✖ Rejected Review</span>
                              </>
                            ) : (
                              <>
                                <span className="font-serif text-slate-400 italic text-[10px] block truncate leading-tight">
                                  {activeRequestDetails.assignedHeadName || "Department Head"}
                                </span>
                                <span className="text-[7px] text-amber-600 block">⚠ Awaiting Review</span>
                                <span className="text-[7px] text-slate-400 block">
                                  Designation: {departmentHeads.find(h => h.id === activeRequestDetails.assignedHeadId)?.role === "employee" ? "Authorized Approver" : "Dept Head"}
                                </span>
                              </>
                            )}
                          </div>

                          {/* Authorised By (Admin / Super Admin Level) */}
                          <div className="space-y-1">
                            <span className="block uppercase tracking-wider font-mono text-[7px] text-slate-400 font-bold">Authorised By</span>
                            {activeRequestDetails.adminApprovalStatus === "Approved" || activeRequestDetails.superAdminApprovalStatus === "Approved" ? (
                              <>
                                <span className="font-serif text-emerald-850 font-extrabold italic text-[9px] block leading-tight">
                                  {activeRequestDetails.superAdminApprovedBy || activeRequestDetails.adminApprovedBy || activeRequestDetails.assignedAdminName || activeRequestDetails.assignedSuperAdminName || "Corporate Officer"}
                                </span>
                                <span className="text-[7px] text-slate-400 block leading-none">
                                  Designation: {activeRequestDetails.superAdminApprovedBy ? "Super Admin" : "Company Admin"}
                                </span>
                                {(activeRequestDetails.superAdminApprovalDate || activeRequestDetails.adminApprovalDate) && (
                                  <span className="text-[7px] text-slate-400 block font-mono">Date: {activeRequestDetails.superAdminApprovalDate || activeRequestDetails.adminApprovalDate}</span>
                                )}
                              </>
                            ) : activeRequestDetails.adminApprovalStatus === "Rejected" || activeRequestDetails.superAdminApprovalStatus === "Rejected" ? (
                              <>
                                <span className="font-serif text-red-650 font-extrabold line-through text-[9px] block leading-tight">
                                  {activeRequestDetails.superAdminApprovedBy || activeRequestDetails.adminApprovedBy}
                                </span>
                                <span className="text-[7px] text-red-500 block">✖ Rejected</span>
                              </>
                            ) : (
                              <>
                                <span className="font-serif text-slate-400 italic text-[10px] block truncate leading-tight">
                                  {activeRequestDetails.assignedAdminName || activeRequestDetails.assignedSuperAdminName || "Administrator"}
                                </span>
                                <span className="text-[7px] text-amber-600 block">⚠ Awaiting Review</span>
                                <span className="text-[7px] text-slate-400 block">Designation: Admin</span>
                              </>
                            )}
                          </div>

                        </div>
                      </div>

                      {/* Supporting Invoice proof item if file is uploaded */}
                      {activeRequestDetails.travelExpensesDetails.billFileName && (
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-[11px] space-y-2">
                          <div className="flex items-center space-x-1.5 border-b border-slate-200 pb-1">
                            <ClipboardList className="h-3.5 w-3.5 text-slate-700" />
                            <span className="font-black text-slate-700 font-mono tracking-wider uppercase text-[10px]">Verified Proof Invoice</span>
                          </div>
                          <div className="flex items-center space-x-2.5 p-2 bg-white rounded-lg border border-slate-100 shadow-sm">
                            <div className="p-1 px-1.5 bg-emerald-600 text-white font-black font-mono tracking-widest text-[8px] rounded uppercase">Proof</div>
                            <div className="flex-grow min-w-0">
                              <p className="text-slate-800 font-bold font-mono text-[10px] truncate">{activeRequestDetails.travelExpensesDetails.billFileName}</p>
                            </div>
                            <div className="shrink-0 flex items-center space-x-1.5">
                              <span className="text-[9px] px-1.5 py-0.5 bg-teal-50 text-teal-800 rounded font-bold uppercase font-mono">Secure API Stream</span>
                            </div>
                          </div>
                        </div>
                      )}

                    </div>
                  )}

                  {/* Credit Card Expense format layout inside details drawer */}
                  {activeRequestDetails.creditCardDetails && (
                    <div className="space-y-4 animate-fade-in text-xs font-semibold" id="drawer-cce-subview">
                      <div className="flex items-center space-x-1.5 border-b border-indigo-200 pb-1.5">
                        <Receipt className="h-4 w-4 text-indigo-800" />
                        <span className="font-extrabold text-[9px] uppercase tracking-wider text-indigo-950 font-mono font-bold">Credit Card Expense statement</span>
                      </div>

                      {/* Repeating table structure for transactions inside drawer */}
                      <div className="bg-[#fafbfd] p-5 rounded-2xl border border-indigo-300 shadow-sm text-[11px] space-y-4 relative overflow-hidden" style={{ backgroundImage: "radial-gradient(#f0f0f0 1px, transparent 1px)", backgroundSize: "16px 16px" }}>
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-indigo-650"></div>
                        
                        {/* Title details */}
                        <div className="border-b border-dashed border-indigo-250 pb-2 flex justify-between items-baseline">
                          <span className="font-mono text-[10px] text-indigo-700 font-bold bg-indigo-50 px-1.5 py-0.5 rounded">Voucher: {activeRequestDetails.creditCardDetails.voucherNo}</span>
                          <span className="font-serif font-black text-slate-800 uppercase text-[11px]">{activeRequestDetails.enterpriseName || currentUser?.enterpriseName || "PROFLOW ENTERPRISE"}</span>
                          <span className="font-mono text-[9px] text-slate-500 font-bold">Date: {activeRequestDetails.creditCardDetails.expenseDate}</span>
                        </div>

                        <div className="font-mono text-center font-black tracking-widest text-[10px] text-slate-700 underline underline-offset-4">CREDIT CARD RECONCILIATION DETAIL</div>

                        {/* Top-level CCE Details Metadata */}
                        <div className="grid grid-cols-2 gap-2 text-[10px] pb-1 border-b border-indigo-100">
                          <div>
                            <span className="text-slate-400 font-mono block">Expense Head</span>
                            <strong className="text-slate-800 font-bold">{activeRequestDetails.creditCardDetails.expenseHead}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 font-mono block">Expense Type</span>
                            <strong className="text-slate-800 font-bold">
                              {activeRequestDetails.creditCardDetails.expenseType === "OTA" ? `Linked OTA: ${activeRequestDetails.creditCardDetails.linkedOtaNo || "N/A"}` : "General Administration"}
                            </strong>
                          </div>
                        </div>

                        {/* Transactions Table */}
                        <div className="space-y-1.5">
                          <span className="text-[9px] uppercase font-mono font-bold text-indigo-800 block">itemised transaction charges</span>
                          <div className="overflow-x-auto bg-white rounded-xl border border-indigo-150">
                            <table className="w-full text-left text-[10px]">
                              <thead>
                                <tr className="bg-indigo-50 border-b border-indigo-150 font-bold uppercase text-[8px] text-indigo-900">
                                  <th className="p-2 border-r border-indigo-150">Card Detail / Holder</th>
                                  <th className="p-2 border-r border-indigo-150">Description / Spends Particulars</th>
                                  <th className="p-2 text-right">Amount (₹)</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-indigo-100 tracking-tight font-medium text-slate-700 text-[10px]">
                                {activeRequestDetails.creditCardDetails.transactions && activeRequestDetails.creditCardDetails.transactions.length > 0 ? (
                                  activeRequestDetails.creditCardDetails.transactions.map((tx: any, idx: number) => (
                                    <tr key={tx.id || idx}>
                                      <td className="p-2 border-r border-indigo-150">
                                        <div className="font-bold text-slate-800">{tx.cardName || "Corporate Card"}</div>
                                        <div className="text-[9px] text-slate-500 font-bold font-serif italic">{tx.cardholderName || "Staff"}</div>
                                      </td>
                                      <td className="p-2 border-r border-indigo-150 text-slate-800">{tx.description}</td>
                                      <td className="p-2 text-right font-mono font-extrabold text-slate-900 text-[11px]">₹{Number(tx.amount || 0).toLocaleString("en-IN")}.00</td>
                                    </tr>
                                  ))
                                ) : (
                                  /* Fallback display for legacy single-transaction CCE record */
                                  <tr>
                                    <td className="p-2 border-r border-indigo-150">
                                      <div className="font-bold text-slate-800">{activeRequestDetails.creditCardDetails.cardName || "Corporate Card"}</div>
                                      <div className="text-[9px] text-slate-500 font-bold font-serif italic">{activeRequestDetails.creditCardDetails.cardholderName || "N/A"}</div>
                                    </td>
                                    <td className="p-2 border-r border-indigo-150 text-slate-800">{activeRequestDetails.creditCardDetails.description || "N/A"}</td>
                                    <td className="p-2 text-right font-mono font-extrabold text-slate-900 text-[11px]">₹{Number(activeRequestDetails.creditCardDetails.amount || 0).toLocaleString("en-IN")}.00</td>
                                  </tr>
                                )}
                              </tbody>
                              <tfoot>
                                <tr className="bg-indigo-50 font-black border-t border-indigo-150 text-indigo-950">
                                  <td colSpan={2} className="p-2 border-r border-indigo-150 text-right uppercase text-[8px] tracking-wider font-extrabold">statement sum total:</td>
                                  <td className="p-2 text-right font-mono text-indigo-950 font-black text-xs bg-indigo-100">
                                    ₹{Number(activeRequestDetails.creditCardDetails.amount || 0).toLocaleString("en-IN")}.00
                                  </td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </div>

                        {activeRequestDetails.creditCardDetails.remarks && (
                          <div className="space-y-1">
                            <span className="text-[9px] uppercase font-serif text-slate-500 block">Statement Remarks</span>
                            <div className="p-2 bg-indigo-50/50 rounded-lg border border-indigo-100 text-[10px] text-slate-700 italic">
                              "{activeRequestDetails.creditCardDetails.remarks}"
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Travel Accommodation Journey Specs details */}
                  {activeRequestDetails.travelDetails && (
                    <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 space-y-4 text-xs font-semibold animate-fade-in shadow-inner">
                      <div className="flex items-center space-x-1.5 border-b border-emerald-150 pb-1.5">
                        <Plane className="h-4 w-4 text-emerald-800" />
                        <span className="font-extrabold text-[9px] uppercase tracking-wider text-emerald-900 font-mono">Travel Itinerary (Manual Ledger format)</span>
                      </div>
                      
                      {/* Train and assigned branch mill info */}
                      <div className="grid grid-cols-2 gap-2 text-[10px] bg-white p-2.5 rounded-lg border border-emerald-100">
                        <div>
                          <p className="text-slate-500 text-[8px] uppercase font-bold">Train No./Name</p>
                          <p className="text-emerald-950 font-extrabold font-mono">{activeRequestDetails.travelDetails.trainNoName || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-[8px] uppercase font-bold">Mill Name & Address</p>
                          <p className="text-slate-800 font-bold truncate" title={activeRequestDetails.travelDetails.millNameAddress}>{activeRequestDetails.travelDetails.millNameAddress || "N/A"}</p>
                        </div>
                      </div>

                      {/* Itinerary daily records table */}
                      {activeRequestDetails.travelDetails.itinerary && activeRequestDetails.travelDetails.itinerary.length > 0 && (
                        <div className="overflow-x-auto bg-white rounded-lg border border-emerald-100 shadow-sm">
                          <table className="w-full text-left text-[10px] min-w-[500px]">
                            <thead>
                              <tr className="bg-emerald-100/60 uppercase text-[8px] font-bold text-emerald-900 border-b border-emerald-100">
                                <th className="p-1.5 text-center">Day</th>
                                <th className="p-1.5">Date</th>
                                <th className="p-1.5">Route (From ➔ To)</th>
                                <th className="p-1.5">Lodging (₹)</th>
                                <th className="p-1.5">Food (₹)</th>
                                <th className="p-1.5">Conveyance (₹)</th>
                                <th className="p-1.5 text-right">Total (₹)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-emerald-50 text-[10px]">
                              {activeRequestDetails.travelDetails.itinerary.map((row: any, i: number) => (
                                <tr key={row.id || i} className="hover:bg-emerald-50/20">
                                  <td className="p-1.5 text-center font-mono font-bold text-emerald-950">{row.day || (i + 1)}</td>
                                  <td className="p-1.5 font-mono text-slate-500">{row.date || "N/A"}</td>
                                  <td className="p-1.5">
                                    <div className="leading-tight font-semibold">
                                      {row.from || "HQ"} <span className="text-emerald-500 font-mono">➔</span> {row.to}
                                    </div>
                                    <span className="text-[8px] text-gray-400 font-normal">Dep: {row.departureTime || "N/A"} • Arr: {row.arrivalTime || "N/A"}</span>
                                  </td>
                                  <td className="p-1.5 font-mono font-bold text-slate-600">
                                    {row.lodgingCost > 0 ? (
                                      <div>
                                        ₹{Number(row.lodgingCost).toLocaleString()}
                                        <div className="text-[7px] text-gray-400 font-normal truncate max-w-[80px]">{row.lodgingDesc}</div>
                                      </div>
                                    ) : "—"}
                                  </td>
                                  <td className="p-1.5 font-mono font-semibold text-slate-600">
                                    {row.foodCost > 0 ? (
                                      <div>
                                        ₹{Number(row.foodCost).toLocaleString()}
                                        <div className="text-[7px] text-gray-400 font-normal truncate max-w-[80px]">{row.foodDesc}</div>
                                      </div>
                                    ) : "—"}
                                  </td>
                                  <td className="p-1.5 font-mono text-slate-600">
                                    {row.conveyanceCost > 0 ? (
                                      <div className="space-y-1">
                                        <div className="font-bold text-emerald-900 text-[10px]">₹{Number(row.conveyanceCost).toLocaleString()}</div>
                                        {row.conveyances && row.conveyances.length > 0 ? (
                                          <div className="divide-y divide-emerald-100/50 bg-emerald-50/40 rounded p-1 text-[8px] leading-tight text-slate-600">
                                            {row.conveyances.map((c: any, ci: number) => (
                                              <div key={c.id || ci} className="py-0.5 flex justify-between gap-1.5">
                                                <span className="font-medium truncate max-w-[110px] text-[8px]">{c.type || "Transport"}</span>
                                                <span className="font-mono text-gray-500">₹{Number(c.cost || 0).toLocaleString()}</span>
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <div className="text-[7px] text-gray-400 font-normal truncate max-w-[110px]">{row.conveyanceType}</div>
                                        )}
                                      </div>
                                    ) : "—"}
                                  </td>
                                  <td className="p-1.5 text-right font-mono font-bold text-emerald-950">₹{(row.rowTotal || 0).toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Advance taken and balance settlement summary info */}
                      <div className="bg-emerald-100/30 p-2.5 rounded-lg border border-emerald-100/50 space-y-1 text-[10px]">
                        <p className="text-emerald-900 border-b border-dashed border-emerald-100 pb-1.5 uppercase font-mono tracking-wide font-extrabold text-[8px]">Advances & settlements status</p>
                        <div className="grid grid-cols-2 gap-y-1.5 gap-x-3.5 pt-1">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Advance Taken:</span>
                            <span className="font-mono font-bold text-slate-800">₹{Number(activeRequestDetails.travelDetails.advanceAmount || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Advance Date:</span>
                            <span className="font-mono text-slate-700">{activeRequestDetails.travelDetails.advanceDate || "N/A"}</span>
                          </div>
                          <div className="flex justify-between border-t border-dashed border-emerald-100/75 pt-1">
                            <span className="text-teal-750">Returned to HO:</span>
                            <span className="font-mono font-black text-teal-800 animate-pulse">₹{Number(activeRequestDetails.travelDetails.balanceReturnedHO || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between border-t border-dashed border-emerald-100/75 pt-1">
                            <span className="text-indigo-700">Paid to Traveler:</span>
                            <span className="font-mono font-black text-indigo-900 animate-pulse">₹{Number(activeRequestDetails.travelDetails.balancePaidToTraveler || 0).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                    </div>
                  )}

                  {/* Operational Timeline Progress Status Checklist */}
                  <div className="space-y-3">
                    <span className="font-extrabold text-[10px] uppercase text-gray-500 tracking-wider font-mono block">Authorization Milestone Timeline</span>
                    <div className="relative pl-6 gap-3.5 flex flex-col text-xs">
                      <div className="absolute left-[7px] top-1.5 bottom-1.5 w-0.5 bg-slate-200"></div>
                      
                      <div className="relative">
                        <span className="absolute left-[-23px] top-0 h-4.5 w-4.5 rounded-full bg-emerald-500 border-4 border-white"></span>
                        <p className="font-bold text-slate-900 leading-tight">Form Created & Dispatched</p>
                        <p className="text-gray-400 text-[10px] font-mono mt-0.5">{new Date(activeRequestDetails.submissionDate).toLocaleDateString()}</p>
                      </div>

                      {activeRequestDetails.assignedHeadId && (
                        <div className="relative">
                          <span className={`absolute left-[-23px] top-0 h-4.5 w-4.5 rounded-full border-4 border-white ${
                            activeRequestDetails.headApprovalStatus === "Approved" ? "bg-emerald-505 bg-emerald-500" :
                            activeRequestDetails.headApprovalStatus === "Rejected" ? "bg-red-500" :
                            activeRequestDetails.headApprovalStatus === "Queried" ? "bg-blue-500" :
                            "bg-amber-500 animate-pulse"
                          }`}></span>
                          <p className="font-bold text-slate-900 leading-tight">Department Head Preliminary Review</p>
                          <p className="text-slate-500 font-semibold mt-0.5">Reviewer Head: {activeRequestDetails.assignedHeadName}</p>
                          <p className="text-[10px] text-gray-500">Status: {activeRequestDetails.headApprovalStatus || "Pending"}</p>
                          {activeRequestDetails.headApprovedBy && (
                            <p className="text-[10px] text-gray-550 leading-tight mt-1 bg-indigo-50/50 p-2 rounded-lg border border-indigo-150">
                              <strong>Decision by:</strong> {activeRequestDetails.headApprovedBy} • <strong>Date:</strong> {activeRequestDetails.headApprovalDate}<br />
                              <strong>Remarks:</strong> "{activeRequestDetails.headRemarks}"
                            </p>
                          )}
                        </div>
                      )}

                      <div className="relative">
                        <span className={`absolute left-[-23px] top-0 h-4.5 w-4.5 rounded-full border-4 border-white ${
                          activeRequestDetails.status === "Approved" ? "bg-emerald-550 bg-emerald-500" :
                          activeRequestDetails.status === "Rejected" ? "bg-red-500" :
                          activeRequestDetails.status === "Queried" ? "bg-blue-500" :
                          activeRequestDetails.assignedHeadId && activeRequestDetails.headApprovalStatus !== "Approved"
                            ? "bg-gray-300"
                            : "bg-amber-500 animate-pulse"
                        }`}></span>
                        <p className="font-bold text-slate-950 leading-tight">Executive Fiduciary Governance Review (Final)</p>
                        <p className="text-slate-500 font-semibold mt-0.5">Status Resolved: {activeRequestDetails.status}</p>
                        {activeRequestDetails.approvalDetails?.approvedBy && (
                          <p className="text-[10px] text-gray-550 leading-tight mt-1 bg-slate-50 p-2 rounded-lg border border-slate-150">
                            <strong>Reviewer:</strong> {activeRequestDetails.approvalDetails.approvedBy} • <strong>Date:</strong> {activeRequestDetails.approvalDetails.approvalDate}<br />
                            <strong>Remarks:</strong> "{activeRequestDetails.approvalDetails.adminRemarks}"
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ITEMISED LINE RECORDS BREAKDOWNS IN RUPEES ₹ */}
                  <div className="space-y-3">
                    <span className="font-extrabold text-[10px] uppercase text-gray-500 tracking-wider font-mono block">Line Item Billing details</span>
                    <div className="border border-slate-205 rounded-xl overflow-hidden font-sans text-xs">
                      
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-205 py-1 px-2.5 font-bold uppercase text-[9px] text-[#111827]">
                            <th className="p-2 border-r border-slate-205">Item / description</th>
                            <th className="p-2 border-r border-slate-205 text-center">Qty</th>
                            <th className="p-2 text-right">Sum (₹)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-150 font-semibold text-slate-700 bg-white">
                          {activeRequestDetails.items.map(item => (
                            <tr key={item.id}>
                              <td className="p-22 p-2 border-r border-slate-205 font-bold text-slate-800">
                                {item.description}
                                <span className="block text-[9px] text-gray-400 mt-0.5">Unit unit price: ₹{item.unitPrice.toLocaleString()} • Tax: {item.taxPercent}%</span>
                              </td>
                              <td className="p-2 border-r border-slate-205 text-center font-mono">{item.quantity}</td>
                              <td className="p-2 text-right font-mono text-slate-900">₹{item.total?.toLocaleString() || (item.quantity * item.unitPrice * (1 + item.taxPercent/100)).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-slate-50 border-t border-slate-205 py-2 font-extrabold text-slate-900">
                            <td colSpan={2} className="p-2 text-right uppercase text-[9px] font-bold text-slate-500">Requested total aggregates (tax inclusive):</td>
                            <td className="p-2 text-right font-mono text-slate-800 text-xs font-bold bg-slate-50">₹{activeRequestDetails.totalBudget.toLocaleString()}</td>
                          </tr>
                          {activeRequestDetails.approvedAmount !== undefined && (
                            <>
                              <tr className="bg-emerald-500/10 border-t border-slate-205 py-2 font-extrabold text-emerald-950">
                                <td colSpan={2} className="p-2 text-right uppercase text-[9px] font-bold text-emerald-800">Conclusive Approved Amount:</td>
                                <td className="p-2 text-right font-mono text-emerald-700 text-sm font-black bg-emerald-500/15">₹{activeRequestDetails.approvedAmount.toLocaleString()}</td>
                              </tr>
                              <tr className="bg-amber-500/10 border-t border-slate-205 py-2 font-extrabold text-amber-955">
                                <td colSpan={2} className="p-2 text-right uppercase text-[9px] font-bold text-amber-800">Reduction Deduction Variance:</td>
                                <td className="p-2 text-right font-mono text-amber-600 text-xs font-bold bg-amber-500/15">-₹{(activeRequestDetails.totalBudget - activeRequestDetails.approvedAmount).toLocaleString()}</td>
                              </tr>
                            </>
                          )}
                        </tfoot>
                      </table>

                    </div>
                  </div>

                  {/* DOCUMENTATION ATTACHMENTS SPEC LIST */}
                  <div className="space-y-2">
                    <span className="font-extrabold text-[10px] uppercase text-gray-500 tracking-wider font-mono block">Quotes & Invoice Attachments</span>
                    {activeRequestDetails.attachments.length === 0 ? (
                      <p className="text-gray-400 text-xs italic font-semibold">No invoice or specification attachments provided.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {activeRequestDetails.attachments.map((f, idx) => {
                          const hasPipe = f.includes('|');
                          const name = hasPipe ? f.split('|')[0] : f;
                          const dataUrl = hasPipe 
                            ? f.split('|').slice(1).join('|') 
                            : `data:text/plain;charset=utf-8,${encodeURIComponent(`This is the content sample for preseeded attachment: ${f}`)}`;
                          
                          return (
                            <a 
                              key={idx} 
                              href={dataUrl}
                              download={name}
                              className="bg-emerald-50 hover:bg-emerald-100 p-2.5 px-3.5 rounded-xl border border-emerald-200 flex items-center justify-between font-sans text-xs text-emerald-900 transition shadow-sm cursor-pointer group hover:border-emerald-400"
                              title={`Download / view ${name}`}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-center space-x-2 truncate">
                                <File className="h-4 w-4 text-emerald-600 shrink-0" />
                                <span className="font-bold truncate max-w-[200px] text-slate-800">{name}</span>
                              </div>
                              <span className="text-[10px] bg-white text-emerald-800 font-mono font-bold px-1.5 py-0.5 rounded border border-emerald-200 flex items-center space-x-1 group-hover:bg-emerald-200">
                                <Download className="h-3 w-3 text-emerald-600 shrink-0" />
                                <span>GET</span>
                              </span>
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* FORMAL APPROVAL TRACK & AUDIT DECISIONS */}
                  <div className="space-y-3 pt-4 border-t border-slate-200">
                    <span className="font-extrabold text-[10px] uppercase text-gray-500 tracking-wider font-mono block">Approval Track & Audit History</span>
                    {(!activeRequestDetails.approvalHistory || activeRequestDetails.approvalHistory.length === 0) ? (
                      <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-500 font-semibold space-y-1">
                        <p>No sequential approval transactions have been saved yet.</p>
                        <p className="text-[10px] text-slate-400 font-normal">History will list all department head, administrator, and super admin events.</p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {activeRequestDetails.approvalHistory.map((item, idx) => {
                          const isRed = item.difference > 0;
                          return (
                            <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-xs flex items-start gap-2.5">
                              <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                              <div className="flex-1 space-y-1 text-xs">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="font-extrabold text-slate-800 flex items-center gap-1.5 flex-wrap font-sans">
                                      <span>{item.approverName}</span>
                                      <span className="bg-slate-205 text-slate-700 text-[9px] px-1.5 py-0.5 rounded-md font-mono font-bold leading-none">{item.designation}</span>
                                    </h4>
                                    <span className="text-[9px] text-slate-400 font-mono block mt-0.5">{new Date(item.timestamp).toLocaleString()}</span>
                                  </div>
                                  <div className="text-right font-mono shrink-0">
                                    <span className="text-emerald-700 font-black block">₹{item.approvedAmount.toLocaleString()}</span>
                                    {isRed && (
                                      <span className="text-[9px] text-amber-600 block font-bold">-₹{item.difference.toLocaleString()} Variance</span>
                                    )}
                                  </div>
                                </div>
                                {isRed && item.reason && (
                                  <div className="bg-amber-500/10 border border-amber-500/20 px-2 py-1.5 rounded-lg text-slate-600 text-[11px] leading-relaxed mt-1">
                                    <strong className="text-amber-800 font-bold font-mono">Reduction Reason: </strong>"{item.reason}"
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* ACTIVE DISCUSSION POST AND COMMENTS HISTORY */}
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <span className="font-extrabold text-[10px] uppercase text-gray-500 tracking-wider font-mono block">Review Comments & query discussion ({activeRequestDetails.comments.length})</span>
                    
                    <div className="space-y-2 max-h-56 overflow-y-auto shrink-0 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                      {activeRequestDetails.comments.map(c => (
                        <div key={c.id} className="bg-white p-2.5 rounded-lg shadow-sm border border-slate-150 space-y-1 font-sans">
                          <div className="flex items-center justify-between text-[10px] font-bold">
                            <span className="text-[#111827]">{c.userName} ({c.role === 'admin' ? 'Review Admin' : 'Worker Filer'})</span>
                            <span className="text-gray-450 font-mono font-normal">{new Date(c.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <p className="text-slate-700 font-semibold leading-normal">{c.text}</p>
                        </div>
                      ))}
                      {activeRequestDetails.comments.length === 0 && (
                        <p className="text-gray-450 text-center py-4">No comments or query responses logged on this transaction thread.</p>
                      )}
                    </div>

                    <form onSubmit={dispatchNewComment} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Type clarification message or comments..."
                        value={newCommentText}
                        onChange={(e) => setNewCommentText(e.target.value)}
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs"
                        required
                      />
                      <button
                        type="submit"
                        className="bg-slate-950 hover:bg-slate-900 border border-slate-950 text-white p-2.5 rounded-xl cursor-pointer"
                        title="Send comment"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </form>
                  </div>

                  {/* EXECUTIVE REGULATORY GOVERNANCE ACTIONS (ADMIN/HEAD CONTROLS) */}
                  {(() => {
                    const isCommissionLinked = !!activeRequestDetails.linkedCommissionId;
                    const isUserAuthorized = isCommissionLinked
                      ? (currentUser.role === "admin" || currentUser.role === "superadmin")
                      : (currentUser.role === "superadmin" ||
                         (currentUser.role === "admin" && (activeRequestDetails.stage === "admin-approval" || !activeRequestDetails.assignedHeadId)) ||
                         ((currentUser.role === "head" || currentUser.canApproveRequests) && activeRequestDetails.assignedHeadId === currentUser.id && activeRequestDetails.stage === "head-approval"));
                    
                    return isUserAuthorized && activeRequestDetails.status === "Pending" && !activeRequestDetails.cancellationStatus && (
                      <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-white space-y-4 pt-5">
                      <span className="font-extrabold text-[10px] uppercase text-amber-400 tracking-wider block font-mono">
                        {currentUser.role === "superadmin" ? "Super Admin Authority Finals" : (currentUser.role === "head" || currentUser.canApproveRequests) ? "Approval Authority Preliminary Controls" : "Executive Audit Decisiveness Controls"}
                      </span>

                      {/* PARTIAL APPROVAL PLATFORM CONTROLS */}
                      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-3 text-slate-200">
                        <span className="font-extrabold text-[9px] uppercase text-emerald-400 tracking-wider block font-mono">
                          Partial Approval Calculations (All Vouchers)
                        </span>

                        {activeRequestDetails.approvedAmount !== undefined && activeRequestDetails.approvedAmount < activeRequestDetails.totalBudget && (
                          <div className="bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-lg text-xs space-y-1 text-amber-300">
                            <p className="font-extrabold uppercase text-[9px] tracking-wider font-mono flex items-center gap-1.5">
                              <span>⚠️</span> Previous Tier Partial Approval Detected
                            </p>
                            <p className="font-sans text-[11px] leading-tight text-slate-300">
                              This claim (Requested Amount: <strong className="font-mono text-white">₹{activeRequestDetails.totalBudget.toLocaleString()}</strong>) was previously approved at a reduced amount of <strong className="font-mono text-amber-400">₹{activeRequestDetails.approvedAmount.toLocaleString()}</strong> (Reduction Difference: <strong className="font-mono text-amber-400">₹{(activeRequestDetails.totalBudget - activeRequestDetails.approvedAmount).toLocaleString()}</strong>).
                            </p>
                            {activeRequestDetails.reductionReason && (
                              <p className="font-sans text-[10px] text-slate-400 italic leading-snug">
                                Reason: "{activeRequestDetails.reductionReason}"
                              </p>
                            )}
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[8px] font-bold text-slate-400 uppercase mb-0.5 font-mono">
                              Requested Amount
                            </label>
                            <div className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 font-mono text-slate-300 text-xs flex justify-between items-center select-none">
                              <span>₹</span>
                              <span className="font-bold">{activeRequestDetails.totalBudget.toLocaleString()}</span>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[8px] font-bold text-emerald-400 uppercase mb-0.5 font-mono">
                              Approved Amount (Editable)
                            </label>
                            <div className="relative">
                              <span className="absolute left-2.5 top-1.5 text-emerald-400 text-xs font-bold leading-none">₹</span>
                              <input
                                type="number"
                                value={approvedAmountInput}
                                onChange={(e) => setApprovedAmountInput(e.target.value)}
                                className="w-full bg-slate-900 border border-emerald-500/30 font-bold focus:border-emerald-500 text-emerald-300 rounded-lg pl-5 pr-2 py-1 text-xs font-mono focus:outline-none"
                                placeholder={String(activeRequestDetails.totalBudget)}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Calculated fields */}
                        {(() => {
                          const budget = activeRequestDetails.totalBudget;
                          const approved = Number(approvedAmountInput) || 0;
                          const difference = budget - approved;
                          const hasReduction = approved < budget && approved >= 0;

                          return (
                            <div className="space-y-2">
                              <div className="flex justify-between items-center bg-slate-900/50 p-2 rounded-lg border border-slate-850">
                                <span className="text-[9px] font-bold text-slate-400 uppercase font-mono">
                                  Reduction Difference:
                                </span>
                                <span className={`font-mono text-xs font-black ${difference > 0 ? "text-amber-400" : "text-slate-400"}`}>
                                  ₹{difference.toLocaleString()} {difference > 0 && budget > 0 ? `(${((difference / budget) * 105).toFixed(0) === '100' ? '100' : Math.round((difference / budget) * 100)}% reduced)` : ""}
                                </span>
                              </div>

                              {hasReduction && (
                                <div className="space-y-1">
                                  <label className="block text-[8px] font-bold text-amber-400 uppercase font-mono">
                                    Reason for Reduction (Mandatory) *
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="e.g., Meal expense exceeds company policy limit."
                                    value={reductionReasonInput}
                                    onChange={(e) => setReductionReasonInput(e.target.value)}
                                    className="w-full bg-slate-900 border border-amber-500/40 focus:border-amber-400 text-slate-100 rounded-lg px-2.5 py-1.5 text-xs font-sans placeholder-slate-600 focus:outline-none"
                                    required
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                      
                      <div>
                        <label className="block text-[9px] font-bold text-slate-300 uppercase mb-1">
                          {currentUser.role === "superadmin" ? "Super Admin Conclusive Grounds" : (currentUser.role === "head" || currentUser.canApproveRequests) ? "Approval Authority Remarks" : "Administrative Remarks / Decision grounds"}
                        </label>
                        <textarea
                          placeholder="State reasoning, constraints, or query criteria for this decision..."
                          rows={2}
                          value={adminDecisionRemark}
                          onChange={(e) => setAdminDecisionRemark(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl text-xs p-2 text-white"
                        ></textarea>
                      </div>

                      {/* Workflow Routing Options for approval escalation */}
                      {(currentUser.role === "head" || currentUser.canApproveRequests || currentUser.role === "admin") && (
                        <div className="space-y-4">
                          <span className="font-extrabold text-[10px] uppercase text-slate-350 tracking-wider block font-mono">
                            Subsequent Approval Routing (Optional Escalate)
                          </span>
                          
                          <div className="space-y-2">
                            <div className="relative">
                              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-550" />
                              <input
                                type="text"
                                placeholder="Type to search administrators / super admins to route..."
                                value={reviewSearchQuery}
                                onChange={(e) => setReviewSearchQuery(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl text-xs pl-8 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-800"
                              />
                            </div>

                            <div className="max-h-48 overflow-y-auto space-y-1.5 p-1.5 border border-slate-800 rounded-xl bg-slate-950/40">
                              {/* Option A: Direct finalization choice (this is selected when escalateTo is "") */}
                              <button
                                type="button"
                                onClick={() => {
                                  setEscalateTo("");
                                  setSelectedNextApproverId("");
                                }}
                                className={`w-full text-left p-2.5 rounded-lg flex items-center justify-between text-xs transition ${
                                  escalateTo === ""
                                    ? "bg-slate-800 text-white font-bold"
                                    : "text-slate-400 hover:bg-slate-900/50"
                                }`}
                              >
                                <div>
                                  <div className="font-bold text-emerald-400">✓ Approve & Finalize Directly</div>
                                  <div className="text-[10px] text-slate-400 mt-0.5">Concludes the transaction structure immediately without further routing.</div>
                                </div>
                              </button>

                              {(() => {
                                // Construct review selection choices
                                let list: any[] = [];
                                if (currentUser.role === "head" || currentUser.canApproveRequests) {
                                  list = [
                                    ...administrators.map(u => ({ ...u, displayRole: "Administrator", roleLabel: "admin" as const })),
                                    ...superAdministrators.map(u => ({ ...u, displayRole: "Super Administrator", roleLabel: "superadmin" as const }))
                                  ];
                                } else if (currentUser.role === "admin") {
                                  list = [
                                    // Super admins on top!
                                    ...superAdministrators.map(u => ({ ...u, displayRole: "Super Administrator", roleLabel: "superadmin" as const })),
                                    ...administrators.map(u => ({ ...u, displayRole: "Administrator", roleLabel: "admin" as const }))
                                  ];
                                }

                                const q = reviewSearchQuery.toLowerCase();
                                const filtered = list.filter(u =>
                                  u.id !== currentUser.id && (
                                    u.name.toLowerCase().includes(q) ||
                                    u.displayRole.toLowerCase().includes(q) ||
                                    (u.department && u.department.toLowerCase().includes(q))
                                  )
                                );

                                if (filtered.length === 0) {
                                  return (
                                    <div className="text-center py-2 text-[10px] text-slate-500">
                                      No authorities match query.
                                    </div>
                                  );
                                }

                                return filtered.map((u) => {
                                  const isSelected = escalateTo === u.roleLabel && selectedNextApproverId === u.id;
                                  return (
                                    <button
                                      key={u.id}
                                      type="button"
                                      onClick={() => {
                                        setEscalateTo(u.roleLabel);
                                        setSelectedNextApproverId(u.id);
                                      }}
                                      className={`w-full text-left p-2.5 rounded-lg flex items-center justify-between text-xs transition border ${
                                        isSelected
                                          ? "bg-slate-800 border-slate-700 text-white font-bold"
                                          : "bg-transparent border-transparent text-slate-300 hover:bg-slate-900"
                                      }`}
                                    >
                                      <div>
                                        <div className="font-bold flex items-center gap-1.5 flex-wrap">
                                          <span>{u.name}</span>
                                          <span className="text-[8px] px-1.5 bg-slate-800 text-slate-300 border border-slate-700 rounded font-mono font-extrabold uppercase">
                                            {u.displayRole}
                                          </span>
                                        </div>
                                        <div className="text-[10px] text-slate-400 mt-0.5">
                                          Code: <span className="font-mono">{u.employeeCode}</span> {u.department ? `| Dept: ${u.department}` : ""}
                                        </div>
                                      </div>
                                      {isSelected ? (
                                        <Check className="h-4 w-4 text-emerald-400 stroke-[3px]" />
                                      ) : (
                                        <div className="h-3.5 w-3.5 rounded-full border border-slate-700 bg-transparent" />
                                      )}
                                    </button>
                                  );
                                });
                              })()}
                            </div>

                            <span className="text-[10px] text-slate-450 leading-tight block font-sans">
                              {escalateTo ? `Will forward and alert selected ${escalateTo === "admin" ? "Administrator" : "Super Admin"} for additional sign-off.` : "No additional routing: transaction will approve in full."}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2 text-xs font-bold pt-1">
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={() => submitAdminReview("Approve")}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white py-2 px-1 rounded-xl text-[11px] uppercase transition flex items-center justify-center space-x-1 cursor-pointer"
                          >
                            <span>Approve & Route</span>
                          </button>

                          <button
                            onClick={() => submitAdminReview("Query")}
                            className="bg-blue-600 hover:bg-blue-500 text-white py-2 px-1 rounded-xl text-[11px] uppercase transition flex items-center justify-center space-x-1 cursor-pointer"
                          >
                            <span>Query Info</span>
                          </button>

                          <button
                            onClick={() => submitAdminReview("Reject")}
                            className="bg-red-650 hover:bg-red-600 text-white py-1 px-1 rounded-xl text-[11px] uppercase transition flex items-center justify-center space-x-1 cursor-pointer"
                          >
                            <span>Reject Record</span>
                          </button>
                        </div>

                        {(currentUser.role === "head" || currentUser.canApproveRequests || currentUser.role === "admin" || currentUser.role === "superadmin") && (
                          <button
                            onClick={() => submitAdminReview("Finalize")}
                            className="w-full mt-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white py-2.5 px-3 rounded-xl text-[11.5px] uppercase tracking-wider transition flex items-center justify-center space-x-2 cursor-pointer shadow-md border border-purple-500/30"
                          >
                            <span>⚡ Finalize Without Further Approval</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}

                  {/* VOID / CANCEL COMPONENT FOR ADMINS */}
                  {!activeRequestDetails.cancellationStatus && (currentUser.role === "admin" || currentUser.role === "superadmin") && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-3 mt-4">
                      <div className="flex items-center space-x-1.5">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span className="font-extrabold text-[10px] uppercase tracking-wider text-red-800 font-mono">Administrative Void & Cancellation</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-normal font-sans">
                        Cancelling this document will mark its serial number <strong className="font-mono text-xs">{activeRequestDetails.documentNumber || "N/A"}</strong> as void. It cannot be approved or processed further.
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          id="cancel-reason-input"
                          placeholder="Provide custom cancellation reason..."
                          className="flex-1 px-3 py-1.5 border border-red-300 rounded-lg text-xs bg-white text-slate-850 focus:ring-1 focus:ring-red-500 focus:outline-none"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const input = e.currentTarget;
                              if (input.value.trim()) {
                                cancelRequestForm(activeRequestDetails.id, input.value.trim());
                                input.value = "";
                              }
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.getElementById("cancel-reason-input") as HTMLInputElement;
                            if (input && input.value.trim()) {
                              cancelRequestForm(activeRequestDetails.id, input.value.trim());
                              input.value = "";
                            }
                          }}
                          className="bg-red-600 hover:bg-red-750 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg font-sans transition cursor-pointer"
                        >
                          Void Form
                        </button>
                      </div>
                    </div>
                  )}

                </div>

                {/* Footing detail */}
                <div className="p-4 bg-slate-100 border-t border-gray-150 flex items-center justify-between text-[9px] text-slate-400">
                  <div className="flex items-center space-x-1 leading-none">
                    <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
                    <span>Compliance Certified ISO-Spend</span>
                  </div>
                  <span className="font-mono">Reference: {activeRequestDetails.id}</span>
                </div>

              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
