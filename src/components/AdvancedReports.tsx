import { useState, useMemo, useEffect } from "react";
import { 
  Building,
  Calendar,
  CalendarDays,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Compass,
  FileText,
  Coins,
  Receipt,
  Plane,
  TrendingUp,
  Download,
  Users,
  Briefcase,
  Layers,
  ArrowRight,
  ShieldCheck,
  CalendarRange,
  Zap,
  Info,
  TrendingDown,
  PieChart,
  BarChart,
  Check,
  Maximize2,
  Eye,
  History,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { jsPDF } from "jspdf";
import { PDFDocument } from "pdf-lib";
import { RequestForm, User, AuditLog, Commission } from "../types";
import { InteractiveAmount } from "./InteractiveAmount";

interface AdvancedReportsProps {
  requestsList: RequestForm[];
  commissionsList: any[];
  auditLogs: AuditLog[];
  employeesList: User[];
  currentUser: User;
  downloadApprovalPDF?: (r: RequestForm, asDocOnly?: boolean) => Promise<any>;
}

export function AdvancedReports({ 
  requestsList, 
  commissionsList, 
  auditLogs, 
  employeesList,
  currentUser,
  downloadApprovalPDF
}: AdvancedReportsProps) {
  
  // Dashboard & Report Tab States
  const [reportTab, setReportTab] = useState<"daily" | "monthly" | "lifetime" | "mom">("mom");
  const [exportNotification, setExportNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);
  
  // Daily Picker (default to current environment date: 2026-05-29)
  const [selectedDay, setSelectedDay] = useState("2026-05-29");
  
  // Monthly Picker (default to May 2026)
  const [selectedMonth, setSelectedMonth] = useState("2026-05");

  // --- MoM BI Dashboard Specific States & Filters ---
  const [momSearch, setMomSearch] = useState("");
  const [momCategory, setMomCategory] = useState("All");
  const [momEmployee, setMomEmployee] = useState("All");
  const [momDepartment, setMomDepartment] = useState("All");
  const [momApprover, setMomApprover] = useState("All");
  const [momQuarter, setMomQuarter] = useState("All"); // 'All' | 'Q1' | 'Q2' | 'Q3' | 'Q4'
  const [momFY, setMomFY] = useState("All"); // 'All' | 'FY 2025-26' | 'FY 2026-27'
  const [momDateStart, setMomDateStart] = useState("");
  const [momDateEnd, setMomDateEnd] = useState("");
  const [momVoucherNo, setMomVoucherNo] = useState("");

  const [selectedPrevMonth, setSelectedPrevMonth] = useState("");
  const [selectedCurrMonth, setSelectedCurrMonth] = useState("");
  const [momEmployeeSort, setMomEmployeeSort] = useState<"increase" | "decrease" | "total">("total");
  const [trendWindow, setTrendWindow] = useState<"last12" | "last24" | "fy" | "custom">("last12");
  
  // Drill-down slider states
  const [drillDownItem, setDrillDownItem] = useState<{ type: "category" | "employee" | "department"; name: string } | null>(null);
  const [selectedDrillTx, setSelectedDrillTx] = useState<any | null>(null);

  // Advanced Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterDepartment, setFilterDepartment] = useState("All");
  const [filterApprover, setFilterApprover] = useState("All");
  const [dateRangeStart, setDateRangeStart] = useState("");
  const [dateRangeEnd, setDateRangeEnd] = useState("");
  const [reductionReasonQuery, setReductionReasonQuery] = useState("");
  const [minDifferenceQuery, setMinDifferenceQuery] = useState("");

  const handleExportCSV = () => {
    if (finalFilteredRecords.length === 0) {
      setExportNotification({
        message: "No records found to export under the active filter selection.",
        type: "error"
      });
      setTimeout(() => setExportNotification(null), 4000);
      return;
    }

    // Define CSV Headers
    const headers = [
      "ID",
      "Document Number",
      "Serial Sequence No",
      "Filer Worker Name",
      "Filer Worker ID",
      "Expense Category",
      "Expense Head / Debit To",
      "Project Memo",
      "Details / Spends Description",
      "Creation Date",
      "Approver Name",
      "Stage",
      "Amount (INR)",
      "Status",
      "Linked Document No",
      "Linked Type",
      "Record Type"
    ];

    // Helper to escape values and wrap in double quotes
    const escapeCsvValue = (val: any) => {
      if (val === null || val === undefined) return '""';
      let str = String(val);
      // Clean up carriage returns/newlines to prevent breaking the CSV row structure
      str = str.replace(/\r?\n|\r/g, " ; ");
      // Escape actual double quotes inside by doubling them
      str = str.replace(/"/g, '""');
      // Wrap in double quotes with comma-safe styling
      return `"${str}"`;
    };

    // Construct lines
    const csvRows = [];
    csvRows.push(headers.join(","));

    finalFilteredRecords.forEach((r) => {
      const row = [
        escapeCsvValue(r.id),
        escapeCsvValue(r.documentNumber),
        escapeCsvValue(r.serialNo > 0 ? r.serialNo : ""),
        escapeCsvValue(r.employeeName),
        escapeCsvValue(r.userId),
        escapeCsvValue(r.category),
        escapeCsvValue(r.expenseHead),
        escapeCsvValue(r.projectName),
        escapeCsvValue(r.detailsText),
        escapeCsvValue(r.createdAt ? r.createdAt.replace("T", " ").substring(0, 16) : ""),
        escapeCsvValue(r.approverName),
        escapeCsvValue(r.stage),
        escapeCsvValue(r.amount),
        escapeCsvValue(r.status),
        escapeCsvValue(r.linkedNo || ""),
        escapeCsvValue(r.linkedType || ""),
        escapeCsvValue(r.recordType)
      ];
      csvRows.push(row.join(","));
    });

    try {
      const csvContent = "\uFEFF" + csvRows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      
      // Create a descriptive file name with date or time-period filter
      let timeLabel = "lifetime";
      if (reportTab === "daily") {
        timeLabel = `daily_${selectedDay}`;
      } else if (reportTab === "monthly") {
        timeLabel = `monthly_${selectedMonth}`;
      }
      
      const sanitizedName = (currentUser?.enterpriseName || "PROFLOW_ENTERPRISE").replace(/\s+/g, "_");
      link.setAttribute("download", `${sanitizedName}_Report_${timeLabel}_${new Date().toISOString().substring(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportNotification({
        message: `Successfully exported ${finalFilteredRecords.length} records to CSV file.`,
        type: "success"
      });
      setTimeout(() => setExportNotification(null), 4000);
    } catch (e: any) {
      setExportNotification({
        message: `Failed to compile CSV download: ${e?.message || e}`,
        type: "error"
      });
      setTimeout(() => setExportNotification(null), 5000);
    }
  };

  // Clean deduplication algorithm to prevent double counting
  // It handles:
  // 1. Requests linked to other Requests (e.g. Local Conveyance to Cash Voucher)
  // 2. Commissions payouts (represented as Cash Vouchers linked to a Commission ID)
  // 3. Ensuring no document's expense amount gets processed twice.
  // Rule: If a document has a linked child document that exists, we prefer the child (Cash Voucher) 
  // as the final payable expense, and ignore the original document (or vice-versa, avoiding double counting).
  const deduplicatedData = useMemo(() => {
    const result: RequestForm[] = [];
    const processedIds = new Set<string>();

    // Sort to give priority to "Cash Voucher" as the final accounting document
    const sorted = [...requestsList].sort((a, b) => {
      const aIsCV = a.category === "Cash Voucher";
      const bIsCV = b.category === "Cash Voucher";
      if (aIsCV && !bIsCV) return -1;
      if (!aIsCV && bIsCV) return 1;
      return 0;
    });

    for (const r of sorted) {
      if (processedIds.has(r.id)) continue;

      // Check if this document has a bidirectional link with an already processed document
      const alreadyIncludedLink = result.find(exist => 
        (r.linkedDocumentId && exist.id === r.linkedDocumentId) || 
        (exist.linkedDocumentId && exist.linkedDocumentId === r.id) ||
        (r.documentNumber && exist.linkedDocumentNumber === r.documentNumber) ||
        (exist.documentNumber && r.linkedDocumentNumber === exist.documentNumber)
      );

      if (alreadyIncludedLink) {
        processedIds.add(r.id);
      } else {
        result.push(r);
        processedIds.add(r.id);
      }
    }

    return result;
  }, [requestsList]);

  // Combine deduped requests & master commissions securely
  const allEnterpriseRecords = useMemo(() => {
    const records: any[] = [];
    
    // Add all deduped Request forms
    deduplicatedData.forEach(r => {
      records.push({
        id: r.id,
        documentNumber: r.documentNumber || `DOC-${r.id.substring(0, 5)}`,
        serialNo: r.serialNumber || 0,
        projectName: r.projectName,
        employeeName: r.employeeName,
        userId: r.userId,
        createdAt: r.submissionDate,
        amount: r.status === "Partially Approved" && r.approvedAmount !== undefined ? r.approvedAmount : r.totalBudget,
        totalBudget: r.totalBudget,
        approvedAmount: r.approvedAmount,
        reductionReason: r.reductionReason,
        approvalHistory: r.approvalHistory || [],
        category: r.category,
        status: r.status,
        stage: r.stage || "Completed",
        approverName: r.assignedHeadName || r.assignedAdminName || r.assignedSuperAdminName || "Default Approver",
        linkedId: r.linkedDocumentId,
        linkedNo: r.linkedDocumentNumber,
        linkedType: r.linkedDocumentType,
        linkedCommissionId: r.linkedCommissionId,
        expenseHead: r.cashVoucherDetails?.debitTo || r.localConveyanceDetails?.expenseHead || "General Equipment",
        detailsText: r.cashVoucherDetails?.expenseDetails || r.travelExpensesDetails?.details || "Enterprise Claim Form",
        rawRecord: r,
        recordType: "Form"
      });
    });

    // Add Master Commission plans (Only include the remaining/unpaid part or completely separate check)
    // To prevent total double-counting, if a Commission has active Cash Voucher payouts, 
    // we deduct the payout values from the master commission amount to get the "payable balance".
    commissionsList.forEach(c => {
      // Find cash vouchers linked to this commission
      const linkedPayouts = requestsList.filter(r => r.linkedCommissionId === c.id);
      const totalPaidAmount = linkedPayouts.reduce((sum, p) => sum + p.totalBudget, 0);
      const remainingUnpaidAmount = Math.max(c.totalAmount - totalPaidAmount, 0);

      records.push({
        id: c.id,
        documentNumber: c.id,
        serialNo: 0,
        projectName: c.purpose,
        employeeName: c.employeeName,
        userId: c.employeeId,
        createdAt: c.createdAt || new Date().toISOString(),
        amount: c.totalAmount, // Full value
        totalBudget: c.totalAmount,
        approvedAmount: c.status === "Paid" ? c.totalAmount : undefined,
        reductionReason: "",
        approvalHistory: [],
        remainingAmount: remainingUnpaidAmount,
        category: "Marketing Expense",
        status: c.status === "Paid" ? "Approved" : c.status === "Cancelled" ? "Rejected" : "Pending",
        stage: "Corporate Treasury",
        approverName: "Admin & Super Admin Board",
        linkedId: undefined,
        linkedNo: undefined,
        linkedType: undefined,
        linkedCommissionId: undefined,
        expenseHead: "Marketing Expense",
        detailsText: c.notes || `Corporate Marketing Expense outline for ${c.employeeName}`,
        rawRecord: c,
        recordType: "Commission"
      });
    });

    return records;
  }, [deduplicatedData, commissionsList, requestsList]);

  // --- Month-on-Month (MoM) & BI Dashboard Evaluation Systems ---
  
  // Available Months for comparison dropdowns (from active records, chronological order)
  const availableMonths = useMemo(() => {
    const list = new Set<string>();
    allEnterpriseRecords.forEach(r => {
      if (r.createdAt && (r.status === "Approved" || r.status === "Partially Approved")) {
        list.add(r.createdAt.substring(0, 7)); // YYYY-MM
      }
    });

    // Backups default to represent 2026 dates
    if (list.size === 0) {
      list.add("2026-06");
      list.add("2026-05");
      list.add("2026-04");
      list.add("2026-03");
      list.add("2026-02");
    }

    return Array.from(list).sort().reverse();
  }, [allEnterpriseRecords]);

  // Read users selected months, falling back to database extremes for immediate visibility
  const activeCurrMonth = selectedCurrMonth || availableMonths[0] || "2026-06";
  const activePrevMonth = selectedPrevMonth || availableMonths[1] || "2026-05";

  // Check if a record matches all selected MoM and BI filters
  const matchesMoMFilters = (r: any) => {
    if (r.status !== "Approved" && r.status !== "Partially Approved") return false;

    // Search query matches keyword (Submitter Name, Doc ID, project memo, categories or remarks)
    if (momSearch.trim()) {
      const q = momSearch.toLowerCase();
      const txt = (
        (r.employeeName || "") + " " +
        (r.documentNumber || "") + " " +
        (r.projectName || "") + " " +
        (r.category || "") + " " +
        (r.expenseHead || "") + " " +
        (r.detailsText || "")
      ).toLowerCase();
      if (!txt.includes(q)) return false;
    }

    // Voucher Number lookup
    if (momVoucherNo.trim()) {
      const v = momVoucherNo.trim().toLowerCase();
      const customV = r.rawRecord?.cashVoucherDetails?.voucherNo || "";
      if (!r.documentNumber?.toLowerCase().includes(v) && !customV.toLowerCase().includes(v)) {
        return false;
      }
    }

    // Category Selector Filter
    if (momCategory !== "All") {
      if (r.category !== momCategory && r.expenseHead !== momCategory) return false;
    }

    // Employee Filer Selector
    if (momEmployee !== "All") {
      if (r.employeeName !== momEmployee && r.userId !== momEmployee) return false;
    }

    // Department Division Selector
    if (momDepartment !== "All") {
      const emp = employeesList.find(e => e.id === r.userId || e.name === r.employeeName);
      if (!emp || emp.department !== momDepartment) return false;
    }

    // Reviewing Approver Selector
    if (momApprover !== "All") {
      if (r.approverName !== momApprover) return false;
    }

    // Indian Financial FY Quarter Filter (Q1: Apr-Jun, Q2: Jul-Sep, Q3: Oct-Dec, Q4: Jan-Mar)
    if (momQuarter !== "All") {
      if (!r.createdAt) return false;
      const m = parseInt(r.createdAt.substring(5, 7), 10);
      let qStr = "";
      if (m >= 4 && m <= 6) qStr = "Q1";
      else if (m >= 7 && m <= 9) qStr = "Q2";
      else if (m >= 10 && m <= 12) qStr = "Q3";
      else if (m >= 1 && m <= 3) qStr = "Q4";

      if (qStr !== momQuarter) return false;
    }

    // Financial Year Selector (Apr to Mar)
    if (momFY !== "All") {
      if (!r.createdAt) return false;
      const y = parseInt(r.createdAt.substring(0, 4), 10);
      const m = parseInt(r.createdAt.substring(5, 7), 10);
      let fyStr = "";
      if (m >= 4) {
        fyStr = `FY ${y}-${String(y + 1).substring(2)}`;
      } else {
        fyStr = `FY ${y - 1}-${String(y).substring(2)}`;
      }
      if (fyStr !== momFY) return false;
    }

    // Custom Date Range Override Pickers
    if (momDateStart) {
      if (r.createdAt.substring(0, 10) < momDateStart) return false;
    }
    if (momDateEnd) {
      if (r.createdAt.substring(0, 10) > momDateEnd) return false;
    }

    return true;
  };

  // Overall MoM spending metrics computation
  const overallMoM = useMemo(() => {
    const prev = allEnterpriseRecords.filter(r => 
      r.createdAt && r.createdAt.substring(0, 7) === activePrevMonth && matchesMoMFilters(r)
    );
    const curr = allEnterpriseRecords.filter(r => 
      r.createdAt && r.createdAt.substring(0, 7) === activeCurrMonth && matchesMoMFilters(r)
    );

    const prevTotal = prev.reduce((sum, r) => sum + r.amount, 0);
    const currTotal = curr.reduce((sum, r) => sum + r.amount, 0);
    const difference = currTotal - prevTotal;
    const growthPercent = prevTotal > 0 ? (difference / prevTotal) * 100 : (currTotal > 0 ? 100 : 0);

    return {
      prevTotal,
      currTotal,
      difference,
      growthPercent,
      prevCount: prev.length,
      currCount: curr.length
    };
  }, [allEnterpriseRecords, activeCurrMonth, activePrevMonth, momSearch, momCategory, momEmployee, momDepartment, momApprover, momQuarter, momFY, momDateStart, momDateEnd, momVoucherNo]);

  // Category wise MoM spending list
  const categoryMoM = useMemo(() => {
    const cats = new Set<string>();
    
    // Auto-discover unique categories from database records
    allEnterpriseRecords.forEach(r => {
      if (r.category && (r.status === "Approved" || r.status === "Partially Approved")) {
        cats.add(r.category);
      }
    });

    const list = Array.from(cats).map(name => {
      const pRecords = allEnterpriseRecords.filter(r => 
        r.category === name && r.createdAt && r.createdAt.substring(0, 7) === activePrevMonth && matchesMoMFilters(r)
      );
      const cRecords = allEnterpriseRecords.filter(r => 
        r.category === name && r.createdAt && r.createdAt.substring(0, 7) === activeCurrMonth && matchesMoMFilters(r)
      );

      const prevSpend = pRecords.reduce((sum, r) => sum + r.amount, 0);
      const currSpend = cRecords.reduce((sum, r) => sum + r.amount, 0);
      const diff = currSpend - prevSpend;
      const growth = prevSpend > 0 ? (diff / prevSpend) * 100 : (currSpend > 0 ? 100 : 0);

      return {
        name,
        prevSpend,
        currSpend,
        diff,
        growth
      };
    }).filter(x => x.prevSpend > 0 || x.currSpend > 0);

    return list.sort((a, b) => b.currSpend - a.currSpend);
  }, [allEnterpriseRecords, activeCurrMonth, activePrevMonth, momSearch, momCategory, momEmployee, momDepartment, momApprover, momQuarter, momFY, momDateStart, momDateEnd, momVoucherNo]);

  // Employee-wise MoM spending list (with dynamic sorting)
  const employeeMoM = useMemo(() => {
    const emps = new Set<string>();
    allEnterpriseRecords.forEach(r => {
      if (r.employeeName && (r.status === "Approved" || r.status === "Partially Approved")) {
        emps.add(r.employeeName);
      }
    });

    const list = Array.from(emps).map(name => {
      const pRecords = allEnterpriseRecords.filter(r => 
        r.employeeName === name && r.createdAt && r.createdAt.substring(0, 7) === activePrevMonth && matchesMoMFilters(r)
      );
      const cRecords = allEnterpriseRecords.filter(r => 
        r.employeeName === name && r.createdAt && r.createdAt.substring(0, 7) === activeCurrMonth && matchesMoMFilters(r)
      );

      const prevSpend = pRecords.reduce((sum, r) => sum + r.amount, 0);
      const currSpend = cRecords.reduce((sum, r) => sum + r.amount, 0);
      const diff = currSpend - prevSpend;
      const growth = prevSpend > 0 ? (diff / prevSpend) * 100 : (currSpend > 0 ? 100 : 0);

      return {
        name,
        prevSpend,
        currSpend,
        diff,
        growth
      };
    }).filter(x => x.prevSpend > 0 || x.currSpend > 0);

    // Filter sorts
    if (momEmployeeSort === "increase") {
      return [...list].sort((a, b) => b.diff - a.diff);
    } else if (momEmployeeSort === "decrease") {
      return [...list].sort((a, b) => a.diff - b.diff);
    } else {
      return [...list].sort((a, b) => b.currSpend - a.currSpend);
    }
  }, [allEnterpriseRecords, activeCurrMonth, activePrevMonth, momEmployeeSort, momSearch, momCategory, momEmployee, momDepartment, momApprover, momQuarter, momFY, momDateStart, momDateEnd, momVoucherNo]);

  // Department-wise MoM spending list
  const departmentMoM = useMemo(() => {
    const depts = new Set<string>();
    employeesList.forEach(e => {
      if (e.department) depts.add(e.department);
    });
    // Defaults fallback
    depts.add("Sales");
    depts.add("Operations");
    depts.add("Marketing");
    depts.add("Finance");

    const list = Array.from(depts).map(name => {
      const pRecords = allEnterpriseRecords.filter(r => {
        const emp = employeesList.find(e => e.id === r.userId || e.name === r.employeeName);
        const dep = emp?.department || "General Operations";
        return dep === name && r.createdAt && r.createdAt.substring(0, 7) === activePrevMonth && matchesMoMFilters(r);
      });
      const cRecords = allEnterpriseRecords.filter(r => {
        const emp = employeesList.find(e => e.id === r.userId || e.name === r.employeeName);
        const dep = emp?.department || "General Operations";
        return dep === name && r.createdAt && r.createdAt.substring(0, 7) === activeCurrMonth && matchesMoMFilters(r);
      });

      const prevSpend = pRecords.reduce((sum, r) => sum + r.amount, 0);
      const currSpend = cRecords.reduce((sum, r) => sum + r.amount, 0);
      const diff = currSpend - prevSpend;
      const growth = prevSpend > 0 ? (diff / prevSpend) * 100 : (currSpend > 0 ? 100 : 0);

      return {
        name,
        prevSpend,
        currSpend,
        diff,
        growth
      };
    }).filter(x => x.prevSpend > 0 || x.currSpend > 0);

    return list.sort((a, b) => b.currSpend - a.currSpend);
  }, [allEnterpriseRecords, activeCurrMonth, activePrevMonth, employeesList, momSearch, momCategory, momEmployee, momDepartment, momApprover, momQuarter, momFY, momDateStart, momDateEnd, momVoucherNo]);

  // Chronological list of months based on Trend Selector
  const trendWindowMonths = useMemo(() => {
    const currentEnvMonth = "2026-06";
    const [yearStr, monthStr] = currentEnvMonth.split("-").map(Number);

    if (trendWindow === "last12") {
      const list: string[] = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(yearStr, monthStr - 1 - i, 1);
        list.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
      }
      return list;
    }
    if (trendWindow === "last24") {
      const list: string[] = [];
      for (let i = 23; i >= 0; i--) {
        const d = new Date(yearStr, monthStr - 1 - i, 1);
        list.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
      }
      return list;
    }
    if (trendWindow === "fy") {
      // Show April 2026 to March 2027
      const list: string[] = [];
      for (let m = 4; m <= 12; m++) list.push(`2026-${String(m).padStart(2, "0")}`);
      for (let m = 1; m <= 3; m++) list.push(`2027-${String(m).padStart(2, "0")}`);
      return list;
    }

    // Custom Date Range coverage
    const startM = momDateStart ? momDateStart.substring(0, 7) : "2026-01";
    const endM = momDateEnd ? momDateEnd.substring(0, 7) : "2026-06";
    const startY = parseInt(startM.substring(0, 4), 10);
    const startMonth = parseInt(startM.substring(5, 7), 10);
    const endY = parseInt(endM.substring(0, 4), 10);
    const endMonth = parseInt(endM.substring(5, 7), 10);

    const list: string[] = [];
    let currY = startY;
    let currM = startMonth;
    while (currY < endY || (currY === endY && currM <= endMonth)) {
      list.push(`${currY}-${String(currM).padStart(2, "0")}`);
      currM++;
      if (currM > 12) {
        currM = 1;
        currY++;
      }
      if (list.length >= 36) break;
    }
    return list;
  }, [trendWindow, momDateStart, momDateEnd]);

  // Aggregate monthly trends values + categories + departments + employees
  const trendWindowData = useMemo(() => {
    return trendWindowMonths.map(mStr => {
      const records = allEnterpriseRecords.filter(r => 
        r.createdAt && r.createdAt.substring(0, 7) === mStr && matchesMoMFilters(r)
      );

      const total = records.reduce((sum, r) => sum + r.amount, 0);

      const categoriesMap: { [key: string]: number } = {};
      const employeesMap: { [key: string]: number } = {};
      const departmentsMap: { [key: string]: number } = {};

      records.forEach(r => {
        categoriesMap[r.category] = (categoriesMap[r.category] || 0) + r.amount;
        employeesMap[r.employeeName] = (employeesMap[r.employeeName] || 0) + r.amount;

        const emp = employeesList.find(e => e.id === r.userId || e.name === r.employeeName);
        const dept = emp?.department || "General Operations";
        departmentsMap[dept] = (departmentsMap[dept] || 0) + r.amount;
      });

      return {
        month: mStr,
        total,
        categories: categoriesMap,
        employees: employeesMap,
        departments: departmentsMap
      };
    });
  }, [allEnterpriseRecords, trendWindowMonths, momSearch, momCategory, momEmployee, momDepartment, momApprover, momQuarter, momFY, momDateStart, momDateEnd, momVoucherNo, employeesList]);

  // Variance analysis & Smart Fiduciary statement generator (Ground truth based)
  const varianceAnalysis = useMemo(() => {
    const insights: string[] = [];
    const costDrivers: string[] = [];
    let highestIncreaseMonth = "N/A";
    let highestIncreaseVal = -Infinity;
    let highestDecreaseMonth = "N/A";
    let highestDecreaseVal = Infinity;
    const unusualSpikes: { employee: string; category: string; amount: number; ratio: number }[] = [];
    const repeatedPatterns: { employee: string; category: string; amount: number; count: number }[] = [];

    // Find chronological max peaks inside trend data
    for (let i = 1; i < trendWindowData.length; i++) {
      const prev = trendWindowData[i - 1].total;
      const curr = trendWindowData[i].total;
      const d = curr - prev;
      if (d > highestIncreaseVal) {
        highestIncreaseVal = d;
        highestIncreaseMonth = trendWindowData[i].month;
      }
      if (d < highestDecreaseVal) {
        highestDecreaseVal = d;
        highestDecreaseMonth = trendWindowData[i].month;
      }
    }

    // Category growth metrics insights
    categoryMoM.forEach(cat => {
      if (cat.prevSpend > 0 && cat.growth >= 30) {
        insights.push(`"${cat.name} spending increased by ${cat.growth.toFixed(1)}% compared to last month."`);
      } else if (cat.prevSpend === 0 && cat.currSpend > 30000) {
        insights.push(`"${cat.name} equipment and claim lines reached ₹${cat.currSpend.toLocaleString("en-IN")} this month, acting as a new cost center."`);
      }
      if (cat.diff >= 50000) {
        costDrivers.push(`${cat.name} (+₹${cat.diff.toLocaleString("en-IN")})`);
      }
    });

    // Singlet large spikes analyzer
    const approvedAll = allEnterpriseRecords.filter(matchesMoMFilters);
    const categorySums: { [key: string]: { total: number; count: number } } = {};
    approvedAll.forEach(r => {
      if (!categorySums[r.category]) {
        categorySums[r.category] = { total: 0, count: 0 };
      }
      categorySums[r.category].total += r.amount;
      categorySums[r.category].count += 1;
    });

    approvedAll.forEach(r => {
      const cSum = categorySums[r.category];
      if (cSum && cSum.count >= 3) {
        const avg = cSum.total / cSum.count;
        if (r.amount > avg * 2.2 && r.amount >= 25000) {
          unusualSpikes.push({
            employee: r.employeeName,
            category: r.category,
            amount: r.amount,
            ratio: r.amount / avg
          });
        }
      }
    });

    // Repeated identical patterns
    const repeatedMap: { [key: string]: number } = {};
    approvedAll.forEach(r => {
      const k = `${r.employeeName}_${r.category}_${r.amount}`;
      repeatedMap[k] = (repeatedMap[k] || 0) + 1;
    });

    Object.entries(repeatedMap).forEach(([key, count]) => {
      if (count >= 3) {
        const [emp, cat, amt] = key.split("_");
        repeatedPatterns.push({
          employee: emp,
          category: cat,
          amount: parseFloat(amt),
          count
        });
      }
    });

    return {
      insights: insights.slice(0, 4),
      costDrivers: costDrivers.slice(0, 3),
      highestIncreaseMonth,
      highestIncreaseVal: highestIncreaseVal > -Infinity ? highestIncreaseVal : 0,
      highestDecreaseMonth,
      highestDecreaseVal: highestDecreaseVal < Infinity ? highestDecreaseVal : 0,
      unusualSpikes: unusualSpikes.slice(0, 3),
      repeatedPatterns: repeatedPatterns.slice(0, 3)
    };
  }, [allEnterpriseRecords, trendWindowData, categoryMoM, momSearch, momCategory, momEmployee, momDepartment, momApprover, momQuarter, momFY, momDateStart, momDateEnd, momVoucherNo]);

  // Drill-down data compiler for clicked categories, employees, and divisions
  const drillDownDetails = useMemo(() => {
    if (!drillDownItem) return null;
    const { type, name } = drillDownItem;

    const matchingRecords = allEnterpriseRecords.filter(r => {
      if (r.status !== "Approved" && r.status !== "Partially Approved") return false;
      const isWithinActive = (r.createdAt && (r.createdAt.substring(0, 7) === activePrevMonth || r.createdAt.substring(0, 7) === activeCurrMonth));
      if (!isWithinActive) return false;

      if (type === "category") return r.category === name;
      if (type === "employee") return r.employeeName === name;
      if (type === "department") {
        const emp = employeesList.find(e => e.id === r.userId || e.name === r.employeeName);
        const dep = emp?.department || "General Operations";
        return dep === name;
      }
      return false;
    });

    const pRecords = matchingRecords.filter(r => r.createdAt && r.createdAt.substring(0, 7) === activePrevMonth);
    const cRecords = matchingRecords.filter(r => r.createdAt && r.createdAt.substring(0, 7) === activeCurrMonth);

    const prevSum = pRecords.reduce((sum, r) => sum + r.amount, 0);
    const currSum = cRecords.reduce((sum, r) => sum + r.amount, 0);

    return {
      type,
      name,
      records: matchingRecords.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      prevMonthRecords: pRecords,
      currMonthRecords: cRecords,
      prevSum,
      currSum
    };
  }, [allEnterpriseRecords, drillDownItem, activePrevMonth, activeCurrMonth, employeesList]);

  // --- TRIO OF BI EXPORT HANDLERS ---
  
  // CSV Export Handler
  const handleExportMoMCSV = () => {
    try {
      const csvRows = [];
      const enterpriseDisplay = (currentUser?.enterpriseName || "PROFLOW ENTERPRISE").toUpperCase();
      csvRows.push(`${enterpriseDisplay} - MONTH-ON-MONTH BI REPORT`);
      csvRows.push(`Exported at: ${new Date().toISOString()}`);
      csvRows.push(`Comparison Interval: Prev Month [${activePrevMonth}] vs Curr Month [${activeCurrMonth}]`);
      csvRows.push(`Filters: Dept[${momDepartment}] | Cat[${momCategory}] | Emp[${momEmployee}] | Qtr[${momQuarter}] | FY[${momFY}]`);
      csvRows.push("");

      // Table 1 overall
      csvRows.push("OVERALL ENTERPRISE MOVEMENT SUMMARY");
      csvRows.push("Metrice Subject,Previous Spend,Current Spend,Difference Amt,Change %");
      csvRows.push(`Total Approved Outflow,${overallMoM.prevTotal},${overallMoM.currTotal},${overallMoM.difference},${overallMoM.growthPercent.toFixed(1)}%`);
      csvRows.push("");

      // Table 2 category
      csvRows.push("CATEGORY-WISE MONTH-ON-MONTH DISCLOSURES");
      csvRows.push("Expense Category,Prev Month Spend,Curr Month Spend,Variance,Growth %");
      categoryMoM.forEach(cat => {
        csvRows.push(`"${cat.name}",${cat.prevSpend},${cat.currSpend},${cat.diff},${cat.growth.toFixed(1)}%`);
      });
      csvRows.push("");

      // Table 3 Dept
      csvRows.push("DEPARTMENT DIVISION SPLITS");
      csvRows.push("Department,Prev Spend,Curr Spend,Variance,Growth %");
      departmentMoM.forEach(dept => {
        csvRows.push(`"${dept.name}",${dept.prevSpend},${dept.currSpend},${dept.diff},${dept.growth.toFixed(1)}%`);
      });

      // Table 4 Employee
      csvRows.push("");
      csvRows.push("EMPLOYEE STATEMENTS SUMMARY");
      csvRows.push("Worker Claimant,Prev Month Spend,Curr Month Spend,Difference Amount,Growth %");
      employeeMoM.forEach(emp => {
        csvRows.push(`"${emp.name}",${emp.prevSpend},${emp.currSpend},${emp.diff},${emp.growth.toFixed(1)}%`);
      });

      const csvContent = "\uFEFF" + csvRows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const sanitizedName = (currentUser?.enterpriseName || "PROFLOW_ENTERPRISE").replace(/\s+/g, "_");
      link.setAttribute("download", `${sanitizedName}_Enterprise_MoM_Report_${activePrevMonth}_vs_${activeCurrMonth}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportNotification({
        message: "Successfully compiled and exported complete comparative MoM tables to raw CSV file.",
        type: "success"
      });
      setTimeout(() => setExportNotification(null), 4000);
    } catch (err: any) {
      setExportNotification({
        message: `Failed to compile CSV: ${err.message || err}`,
        type: "error"
      });
      setTimeout(() => setExportNotification(null), 5000);
    }
  };

  // MS Excel HTML workbook format exporter preserving color tables
  const handleExportMoMExcel = () => {
    try {
      let html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
          <style>
            table { border-collapse: collapse; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
            th { background-color: #0f172a; color: #ffffff; font-weight: bold; padding: 10px; border: 1px solid #e2e8f0; font-size: 11px; }
            td { padding: 8px; border: 1px solid #cbd5e1; font-size: 11px; }
            .increase { color: #dc2626; font-weight: bold; background-color: #fef2f2; }
            .decrease { color: #16a34a; font-weight: bold; background-color: #f0fdf4; }
            .bold { font-weight: bold; }
            .section-head { font-size: 14px; font-weight: 800; margin-top: 20px; color: #1e3a8a; font-family: sans-serif; }
          </style>
        </head>
        <body>
          <h2>{currentUser?.enterpriseName || "PROFLOW ENTERPRISE"} Treasury Month-on-Month BI Analytics Statement</h2>
          <p>Active Window: <b>${activePrevMonth}</b> vs <b>${activeCurrMonth}</b></p>
          <p>Filters Applied: Dept[${momDepartment}] | Cat[${momCategory}] | Emp[${momEmployee}] | Qtr[${momQuarter}] | FY[${momFY}]</p>

          <br/>
          <div class="section-head">Overall Spending Ratio Summary</div>
          <table>
            <thead>
              <tr>
                <th>Fiduciary Target Outflow</th>
                <th>Prev Month Spend (${activePrevMonth}) Total (INR)</th>
                <th>Curr Month Spend (${activeCurrMonth}) Total (INR)</th>
                <th>Difference (INR)</th>
                <th>Variance %</th>
              </tr>
            </thead>
            <tbody>
              <tr class="bold">
                <td>Consolidated System Total</td>
                <td>INR ${overallMoM.prevTotal.toLocaleString("en-IN")}</td>
                <td>INR ${overallMoM.currTotal.toLocaleString("en-IN")}</td>
                <td class="${overallMoM.difference >= 0 ? "increase" : "decrease"}">${overallMoM.difference >= 0 ? "+" : ""}${overallMoM.difference.toLocaleString("en-IN")}</td>
                <td class="${overallMoM.difference >= 0 ? "increase" : "decrease"}">${overallMoM.difference >= 0 ? "+" : ""}${overallMoM.growthPercent.toFixed(1)}%</td>
              </tr>
            </tbody>
          </table>

          <br/>
          <div class="section-head">Fiduciary Variance Analysis & Insight Flags</div>
          <ul>
            ${varianceAnalysis.costDrivers.length > 0 ? `<li><b>Top Cost Drivers:</b> ${varianceAnalysis.costDrivers.join(", ")}</li>` : ""}
            ${varianceAnalysis.insights.map(i => `<li>${i.replace(/"/g, "")}</li>`).join("")}
            ${varianceAnalysis.unusualSpikes.map(s => `<li>Spike Indicator: Single spend of INR ${s.amount.toLocaleString("en-IN")} by ${s.employee} in ${s.category} (${s.ratio.toFixed(1)}x greater than category average)</li>`).join("")}
            ${varianceAnalysis.repeatedPatterns.map(r => `<li>Repeated Spend Alert: ${r.employee} filed ${r.count} matching requests for INR ${r.amount.toLocaleString("en-IN")} in ${r.category}</li>`).join("")}
          </ul>

          <br/>
          <div class="section-head">Category-wise Spending Allocation Comparison</div>
          <table>
            <thead>
              <tr>
                <th>Expense Head Category</th>
                <th>Prev Spend (INR)</th>
                <th>Curr Spend (INR)</th>
                <th>Difference (INR)</th>
                <th>Growth %</th>
              </tr>
            </thead>
            <tbody>
              ${categoryMoM.map(cat => `
                <tr>
                  <td>${cat.name}</td>
                  <td>${cat.prevSpend}</td>
                  <td>${cat.currSpend}</td>
                  <td class="${cat.diff >= 0 ? "increase" : "decrease"}">${cat.diff >= 0 ? "+" : ""}${cat.diff}</td>
                  <td class="${cat.diff >= 0 ? "increase" : "decrease"}">${cat.diff >= 0 ? "+" : ""}${cat.growth.toFixed(1)}%</td>
                </tr>
              `).join("")}
            </tbody>
          </table>

          <br/>
          <div class="section-head">Division Departmental Exposure Comparison</div>
          <table>
            <thead>
              <tr>
                <th>Department Division</th>
                <th>Prev Spend (INR)</th>
                <th>Curr Spend (INR)</th>
                <th>Difference (INR)</th>
                <th>Growth %</th>
              </tr>
            </thead>
            <tbody>
              ${departmentMoM.map(dept => `
                <tr>
                  <td>${dept.name}</td>
                  <td>${dept.prevSpend}</td>
                  <td>${dept.currSpend}</td>
                  <td class="${dept.diff >= 0 ? "increase" : "decrease"}">${dept.diff >= 0 ? "+" : ""}${dept.diff}</td>
                  <td class="${dept.diff >= 0 ? "increase" : "decrease"}">${dept.diff >= 0 ? "+" : ""}${dept.growth.toFixed(1)}%</td>
                </tr>
              `).join("")}
            </tbody>
          </table>

          <br/>
          <div class="section-head">Workforce Claimants Comparative List</div>
          <table>
            <thead>
              <tr>
                <th>Employee / Claimant Name</th>
                <th>Prev Month Spend (INR)</th>
                <th>Curr Month Spend (INR)</th>
                <th>Difference (INR)</th>
                <th>Growth %</th>
              </tr>
            </thead>
            <tbody>
              ${employeeMoM.map(emp => `
                <tr>
                  <td>${emp.name}</td>
                  <td>${emp.prevSpend}</td>
                  <td>${emp.currSpend}</td>
                  <td class="${emp.diff >= 0 ? "increase" : "decrease"}">${emp.diff >= 0 ? "+" : ""}${emp.diff}</td>
                  <td class="${emp.diff >= 0 ? "increase" : "decrease"}">${emp.diff >= 0 ? "+" : ""}${emp.growth.toFixed(1)}%</td>
                </tr>
              `).join("")}
            </tbody>
          </table>

        </body>
        </html>
      `;

      const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const sanitizedName = (currentUser?.enterpriseName || "PROFLOW_ENTERPRISE").replace(/\s+/g, "_");
      link.setAttribute("download", `${sanitizedName}_MoM_Analytical_Workbook_${activePrevMonth}_vs_${activeCurrMonth}.xls`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportNotification({
        message: "Successfully exported structured multi-section MoM analytical workbook to Microsoft Excel format.",
        type: "success"
      });
      setTimeout(() => setExportNotification(null), 4000);
    } catch (e: any) {
      setExportNotification({
        message: `Failed to compile Excel spreadsheet: ${e?.message || e}`,
        type: "error"
      });
      setTimeout(() => setExportNotification(null), 5000);
    }
  };

  // High-fidelity multi-page PDF generator
  const handleExportMoMPdf = async () => {
    try {
      // Notify user compilation of PDF has started
      setExportNotification({
        message: "Compiling MoM Analytics summary and scanning approved voucher logs...",
        type: "success"
      });

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      // Top Header banner branding block
      const enterpriseDisplay = (currentUser?.enterpriseName || "PROFLOW ENTERPRISE").toUpperCase();
      doc.setFillColor(15, 23, 42); 
      doc.rect(10, 10, 190, 12, "F");
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.text(`APROFLOW APPROVALS - ${enterpriseDisplay}`, 14, 17.5);

      // Metadata summary list (slightly shifted to clear header if needed)
      doc.setFontSize(8.5);
      doc.setTextColor(60, 60, 60);
      doc.setFont("helvetica", "normal");
      doc.text(`Run Date: ${new Date().toLocaleString("en-IN")} // Mode: Fiduciary BI Double-Counting Protected`, 14, 26);
      doc.text(`Target Interval Checked: Previous Month (${activePrevMonth}) vs Current Month (${activeCurrMonth})`, 14, 30);
      doc.text(`Active Filters Applied: Dept[${momDepartment}] | Cat[${momCategory}] | Emp[${momEmployee}] | Qtr[${momQuarter}] | FY[${momFY}]`, 14, 34);

      // Overall Summary Stats Area
      doc.setFillColor(248, 250, 252);
      doc.setStrokeColor(220, 225, 230);
      doc.rect(10, 36, 190, 24, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text("CONSOLIDATED MOVEMENT SUMMARY", 14, 41);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.text(`Spending in Previous Month (${activePrevMonth}):`, 14, 47);
      doc.setFont("helvetica", "bold");
      doc.text(`INR ${overallMoM.prevTotal.toLocaleString("en-IN")} (${overallMoM.prevCount} approved bills)`, 100, 47);

      doc.setFont("helvetica", "normal");
      doc.text(`Spending in Current Month (${activeCurrMonth}):`, 14, 51);
      doc.setFont("helvetica", "bold");
      doc.text(`INR ${overallMoM.currTotal.toLocaleString("en-IN")} (${overallMoM.currCount} approved bills)`, 100, 51);

      doc.setFont("helvetica", "bold");
      doc.text(`Net Outflow Difference Amount:`, 14, 55);
      const isInc = overallMoM.difference >= 0;
      doc.setTextColor(isInc ? 190 : 25, isInc ? 24 : 115, isInc ? 74 : 141);
      doc.text(`${isInc ? "+" : ""}INR ${overallMoM.difference.toLocaleString("en-IN")} (${isInc ? "+" : ""}${overallMoM.growthPercent.toFixed(1)}% growth)`, 100, 55);

      // Variance insights statement generator
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.text("AUTOMATED SYSTEM AUDIT & GENERAL INTEGRITY INSIGHTS", 10, 68);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      let offset = 73;

      if (varianceAnalysis.costDrivers.length > 0) {
        doc.text(`• Top absolute cost drivers of current period: ${varianceAnalysis.costDrivers.join(", ")}`, 12, offset);
        offset += 4.5;
      }

      varianceAnalysis.insights.forEach(isn => {
        doc.text(`• Fiduciary warning: ${isn.replace(/"/g, "")}`, 12, offset);
        offset += 4.5;
      });

      varianceAnalysis.unusualSpikes.forEach(spk => {
        doc.text(`• Unusual Spending spike: Single transaction of INR ${spk.amount.toLocaleString("en-IN")} by ${spk.employee} in ${spk.category} (${spk.ratio.toFixed(1)}x greater than mean)`, 12, offset);
        offset += 4.5;
      });

      varianceAnalysis.repeatedPatterns.forEach(rpt => {
        doc.text(`• Recurring patterns flagged: ${rpt.employee} filed ${rpt.count} identical lines for same value of INR ${rpt.amount.toLocaleString("en-IN")} in ${rpt.category}`, 12, offset);
        offset += 4.5;
      });

      // Category level matrix list
      offset += 4;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.text("EXPENSE CATEGORIES COMPARISON MATRIX", 10, offset);
      offset += 4.5;

      // Header categories table
      doc.setFillColor(241, 245, 249);
      doc.rect(10, offset, 190, 5, "F");
      doc.setFontSize(7.5);
      doc.text("Expense Head Category", 12, offset + 3.5);
      doc.text(`Prev Spend (${activePrevMonth})`, 75, offset + 3.5);
      doc.text(`Curr Spend (${activeCurrMonth})`, 115, offset + 3.5);
      doc.text("Difference Variance", 155, offset + 3.5);
      doc.text("Growth %", 182, offset + 3.5);
      offset += 5;

      doc.setFont("helvetica", "normal");
      categoryMoM.forEach(cat => {
        if (offset > 275) {
          doc.addPage();
          offset = 15;
          // repeated header
          doc.setFillColor(241, 245, 249);
          doc.rect(10, offset, 190, 5, "F");
          doc.setFont("helvetica", "bold");
          doc.text("Expense Head Category", 12, offset + 3.5);
          doc.text("Prev Month Spend", 75, offset + 3.5);
          doc.text("Curr Month Spend", 115, offset + 3.5);
          doc.text("Difference", 155, offset + 3.5);
          doc.text("Growth", 182, offset + 3.5);
          offset += 5;
          doc.setFont("helvetica", "normal");
        }

        doc.text(cat.name, 12, offset + 3.5);
        doc.text(`INR ${cat.prevSpend.toLocaleString("en-IN")}`, 75, offset + 3.5);
        doc.text(`INR ${cat.currSpend.toLocaleString("en-IN")}`, 115, offset + 3.5);

        const inc = cat.diff >= 0;
        doc.setTextColor(inc ? 150 : 0, inc ? 10 : 100, inc ? 10 : 0);
        doc.text(`${inc ? "+" : ""}INR ${cat.diff.toLocaleString("en-IN")}`, 155, offset + 3.5);
        doc.text(`${inc ? "+" : ""}${cat.growth.toFixed(1)}%`, 182, offset + 3.5);
        doc.setTextColor(0, 0, 0);
        offset += 4.5;
      });

      // Employee metrics table
      offset += 5;
      if (offset > 230) {
        doc.addPage();
        offset = 15;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.text("WORKFORCE CLAIM SUBMISSIONS COMPARATIVE RATIOS", 10, offset);
      offset += 4.5;

      doc.setFillColor(241, 245, 249);
      doc.rect(10, offset, 190, 5, "F");
      doc.setFontSize(7.5);
      doc.text("Claimant Name", 12, offset + 3.5);
      doc.text("Prev Month sum", 75, offset + 3.5);
      doc.text("Curr Month sum", 115, offset + 3.5);
      doc.text("Variance Outflow", 155, offset + 3.5);
      offset += 5;

      doc.setFont("helvetica", "normal");
      employeeMoM.slice(0, 15).forEach(emp => { // Top 15 claimants
        if (offset > 275) {
          doc.addPage();
          offset = 15;
        }

        doc.text(emp.name, 12, offset + 3.5);
        doc.text(`INR ${emp.prevSpend.toLocaleString("en-IN")}`, 75, offset + 3.5);
        doc.text(`INR ${emp.currSpend.toLocaleString("en-IN")}`, 115, offset + 3.5);

        const inc = emp.diff >= 0;
        doc.setTextColor(inc ? 150 : 0, inc ? 10 : 100, inc ? 10 : 0);
        doc.text(`${inc ? "+" : ""}INR ${emp.diff.toLocaleString("en-IN")}`, 155, offset + 3.5);
        doc.setTextColor(0, 0, 0);
        offset += 4.5;
      });

      // Generate compiled multi-voucher ledger or direct single statement depending on matching claim logs count
      const matchingClaims = requestsList.filter(r => 
        (r.status === "Approved" || r.status === "Partially Approved") && 
        r.createdAt && 
        (r.createdAt.substring(0, 7) === activePrevMonth || r.createdAt.substring(0, 7) === activeCurrMonth) &&
        matchesMoMFilters(r)
      );

      if (downloadApprovalPDF && matchingClaims.length > 0) {
        const mergedPdf = await PDFDocument.create();
        
        // 1. Add BI Comparison summary report
        const mainBytes = doc.output("arraybuffer");
        const mainPdfDoc = await PDFDocument.load(mainBytes);
        const mainPages = await mergedPdf.copyPages(mainPdfDoc, mainPdfDoc.getPageIndices());
        mainPages.forEach((p) => mergedPdf.addPage(p));
        
        // 2. Add individual voucher structures
        for (const r of matchingClaims) {
          try {
            const reqDoc = await downloadApprovalPDF(r, true);
            if (reqDoc) {
              const reqBytes = reqDoc.output("arraybuffer");
              const reqPdfDoc = await PDFDocument.load(reqBytes);
              const reqPages = await mergedPdf.copyPages(reqPdfDoc, reqPdfDoc.getPageIndices());
              reqPages.forEach((p) => mergedPdf.addPage(p));
            }
          } catch (err) {
            console.error("Compilation PDF merging error for claim code", r.id, err);
          }
        }
        
        const finalPdfBytes = await mergedPdf.save();
        const blob = new Blob([finalPdfBytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        const sanitizedName = (currentUser?.enterpriseName || "PROFLOW_ENTERPRISE").replace(/\s+/g, "_");
        link.setAttribute("download", `${sanitizedName}_Enterprise_MoM_Compilation_${activePrevMonth}_vs_${activeCurrMonth}.pdf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setExportNotification({
          message: `Successfully generated and downloaded compiled audit package containing Month-on-Month comparison and ${matchingClaims.length} approved claims.`,
          type: "success"
        });
      } else {
        const sanitizedName = (currentUser?.enterpriseName || "PROFLOW_ENTERPRISE").replace(/\s+/g, "_");
        doc.save(`${sanitizedName}_Fiduciary_MoM_Report_${activePrevMonth}_vs_${activeCurrMonth}.pdf`);

        setExportNotification({
          message: "Successfully generated and downloaded Month-on-Month comparative PDF summary statement.",
          type: "success"
        });
      }
      setTimeout(() => setExportNotification(null), 5000);
    } catch (e: any) {
      setExportNotification({
        message: `Failed to compile PDF document: ${e.message || e}`,
        type: "error"
      });
      setTimeout(() => setExportNotification(null), 5000);
    }
  };

  // Filter based on selected Time Tab & Picker
  const dateFilteredRecords = useMemo(() => {
    return allEnterpriseRecords.filter(r => {
      const recordDate = r.createdAt ? r.createdAt.substring(0, 10) : "";
      
      if (reportTab === "daily") {
        return recordDate === selectedDay;
      }
      if (reportTab === "monthly") {
        const recordMonth = r.createdAt ? r.createdAt.substring(0, 7) : "";
        return recordMonth === selectedMonth;
      }
      return true; // Lifetime
    });
  }, [allEnterpriseRecords, reportTab, selectedDay, selectedMonth]);

  // Apply Search, Category, Status, Department, and Date Range Filters
  const finalFilteredRecords = useMemo(() => {
    return dateFilteredRecords.filter(r => {
      // 1. Search Query Match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = r.employeeName?.toLowerCase().includes(q);
        const matchesDocNo = r.documentNumber?.toLowerCase().includes(q);
        const matchesSerial = String(r.serialNo).toLowerCase().includes(q);
        const matchesVoucher = r.rawRecord?.cashVoucherDetails?.voucherNo?.toLowerCase().includes(q);
        const matchesFormName = r.projectName?.toLowerCase().includes(q) || r.category?.toLowerCase().includes(q);
        if (!matchesName && !matchesDocNo && !matchesSerial && !matchesVoucher && !matchesFormName) {
          return false;
        }
      }

      // 2. Category Filter
      if (filterCategory !== "All") {
        if (r.category !== filterCategory) return false;
      }

      // 3. Status Filter
      if (filterStatus !== "All") {
        if (filterStatus === "Approved") {
          if (r.status !== "Approved" && r.status !== "Partially Approved") return false;
        } else if (filterStatus === "Fully Approved") {
          if (r.status !== "Approved" || (r.approvedAmount !== undefined && r.approvedAmount < r.totalBudget)) return false;
        } else if (filterStatus === "Partially Approved") {
          if (r.status !== "Partially Approved" && !(r.approvedAmount !== undefined && r.approvedAmount < r.totalBudget)) return false;
        } else {
          if (r.status !== filterStatus) return false;
        }
      }

      // 4. Department Filter
      if (filterDepartment !== "All") {
        const matchingEmployee = employeesList.find(e => e.id === r.userId || e.name === r.employeeName);
        if (matchingEmployee && matchingEmployee.department !== filterDepartment) return false;
      }

      // 5. Approver Filter
      if (filterApprover !== "All") {
        const inHistory = r.approvalHistory?.some(h => h.approverName === filterApprover);
        if (r.approverName !== filterApprover && !inHistory) return false;
      }

      // 6. Custom Date Range Filters (Overrides daily/monthly picker when set)
      if (dateRangeStart) {
        if (r.createdAt.substring(0, 10) < dateRangeStart) return false;
      }
      if (dateRangeEnd) {
        if (r.createdAt.substring(0, 10) > dateRangeEnd) return false;
      }

      // 7. Difference Amount Filter
      if (minDifferenceQuery.trim()) {
        const minAmt = Number(minDifferenceQuery);
        if (!isNaN(minAmt)) {
          const diff = r.totalBudget - (r.approvedAmount !== undefined ? r.approvedAmount : r.totalBudget);
          if (diff < minAmt) return false;
        }
      }

      // 8. Reduction Reason Filter
      if (reductionReasonQuery.trim()) {
        const query = reductionReasonQuery.toLowerCase();
        const reason = (r.reductionReason || "").toLowerCase();
        const histReasonMatch = r.approvalHistory?.some(h => (h.reason || "").toLowerCase().includes(query));
        if (!reason.includes(query) && !histReasonMatch) return false;
      }

      return true;
    });
  }, [dateFilteredRecords, searchQuery, filterCategory, filterStatus, filterDepartment, filterApprover, dateRangeStart, dateRangeEnd, reductionReasonQuery, minDifferenceQuery, employeesList]);

  // Compute stats for current report
  const reportStats = useMemo(() => {
    // Avoid double counting by relying strictly on deduplicated results!
    const approved = finalFilteredRecords.filter(r => r.status === "Approved" || r.status === "Partially Approved");
    const pending = finalFilteredRecords.filter(r => r.status === "Pending");
    const rejected = finalFilteredRecords.filter(r => r.status === "Rejected");
    const queried = finalFilteredRecords.filter(r => r.status === "Queried");

    const partiallyApprovedRecords = finalFilteredRecords.filter(r => r.status === "Partially Approved" || (r.status === "Approved" && r.approvedAmount !== undefined && r.approvedAmount < r.totalBudget));
    const partiallyApprovedCount = partiallyApprovedRecords.length;

    const totalRequestedAmount = finalFilteredRecords.reduce((sum, r) => sum + r.totalBudget, 0);

    const totalApprovedAmount = finalFilteredRecords.reduce((sum, r) => {
      if (r.status === "Approved" || r.status === "Partially Approved") {
        return sum + (r.approvedAmount !== undefined ? r.approvedAmount : r.totalBudget);
      }
      return sum;
    }, 0);

    const totalReducedAmount = finalFilteredRecords.reduce((sum, r) => {
      if (r.status === "Approved" || r.status === "Partially Approved") {
        const diff = r.totalBudget - (r.approvedAmount !== undefined ? r.approvedAmount : r.totalBudget);
        return sum + (diff > 0 ? diff : 0);
      }
      return sum;
    }, 0);

    const pendingTotal = pending.reduce((sum, r) => sum + r.totalBudget, 0);
    const rejectedTotal = rejected.reduce((sum, r) => sum + r.totalBudget, 0);
    const totalTransactions = finalFilteredRecords.length;

    return {
      approvedTotal: totalApprovedAmount,
      pendingTotal,
      rejectedTotal,
      totalTransactions,
      approvedCount: approved.length,
      pendingCount: pending.length,
      rejectedCount: rejected.length,
      queriedCount: queried.length,
      totalRequestedAmount,
      totalApprovedAmount,
      totalReducedAmount,
      partiallyApprovedCount,
      partiallyApprovedRecords
    };
  }, [finalFilteredRecords]);

  // Structured Expense categories breakdowns
  // Repair & Maintenance, Travel Allowance, Equipment, Food Expenses, etc.
  // Structured Expense categories breakdowns with deep nested expense heads
  const expenseBreakdown = useMemo(() => {
    const categoriesMap: { 
      [key: string]: { 
        amount: number; 
        subHeads: { [headName: string]: number } 
      } 
    } = {};
    
    finalFilteredRecords.forEach(r => {
      if (r.status === "Approved" || r.status === "Partially Approved") {
        const cat = r.category || "General Uncategorized";
        const head = r.expenseHead || "General Particulars";

        if (!categoriesMap[cat]) {
          categoriesMap[cat] = { amount: 0, subHeads: {} };
        }
        
        categoriesMap[cat].amount += r.amount;
        categoriesMap[cat].subHeads[head] = (categoriesMap[cat].subHeads[head] || 0) + r.amount;
      }
    });

    return Object.entries(categoriesMap).map(([name, data]) => {
      const subHeadsArray = Object.entries(data.subHeads).map(([headName, amount]) => ({
        headName,
        amount
      })).sort((a, b) => b.amount - a.amount);

      return {
        name,
        amount: data.amount,
        subHeads: subHeadsArray
      };
    }).sort((a, b) => b.amount - a.amount);
  }, [finalFilteredRecords]);

  // Department-wise spending
  const deptSpending = useMemo(() => {
    const deptsMap: { [key: string]: number } = {};
    finalFilteredRecords.forEach(r => {
      if (r.status === "Approved" || r.status === "Partially Approved") {
        const matchingEmployee = employeesList.find(e => e.id === r.userId || e.name === r.employeeName);
        const deptIdx = matchingEmployee?.department || "General Operations";
        deptsMap[deptIdx] = (deptsMap[deptIdx] || 0) + r.amount;
      }
    });
    return Object.entries(deptsMap).map(([department, amount]) => ({ department, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [finalFilteredRecords, employeesList]);

  // Employee-wise spending
  const employeeSpending = useMemo(() => {
    const empMap: { [key: string]: number } = {};
    finalFilteredRecords.forEach(r => {
      if (r.status === "Approved" || r.status === "Partially Approved") {
        const name = r.employeeName || "Unknown Worker";
        empMap[name] = (empMap[name] || 0) + r.amount;
      }
    });
    return Object.entries(empMap).map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10); // Return top 10 spenders
  }, [finalFilteredRecords]);

  // Monthly trends summary data array
  const monthlyTrendsList = useMemo(() => {
    const trendsMap: { [key: string]: number } = {};
    allEnterpriseRecords.forEach(r => {
      if (r.status === "Approved" || r.status === "Partially Approved") {
        const monthStr = r.createdAt ? r.createdAt.substring(0, 7) : "2026-05";
        trendsMap[monthStr] = (trendsMap[monthStr] || 0) + r.amount;
      }
    });
    return Object.entries(trendsMap).map(([month, total]) => ({ month, total }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [allEnterpriseRecords]);

  // Helpers maximums for SVG visual graphs scaling
  const maxCategorySpend = useMemo(() => {
    return expenseBreakdown.length > 0 ? Math.max(...expenseBreakdown.map(c => c.amount), 1000) : 1000;
  }, [expenseBreakdown]);

  const maxDeptSpend = useMemo(() => {
    return deptSpending.length > 0 ? Math.max(...deptSpending.map(d => d.amount), 1000) : 1000;
  }, [deptSpending]);

  const maxTrendSpend = useMemo(() => {
    return monthlyTrendsList.length > 0 ? Math.max(...monthlyTrendsList.map(t => t.total), 1000) : 1000;
  }, [monthlyTrendsList]);

  // Auto-generate Month End status helper (e.g. 30th/31st alert indicator)
  const isMonthEndReportTriggered = useMemo(() => {
    const today = new Date().toISOString().substring(8, 10);
    return today === "30" || today === "31" || today === "28" || today === "29"; 
  }, []);

  // --- MONTH-ON-MONTH BI RENDERING FRAMEWORK ---
  const renderMonthOnMonthDashboard = () => {
    // Unique list of categories in requestsList to feed filter pickers
    const filterCatOptions = Array.from(new Set(requestsList.map(r => r.category).filter(Boolean)));
    // Unique list of employees in employeesList
    const filterEmpOptions = employeesList.map(e => e.name || e.id);
    // Unique list of departments
    const filterDeptOptions = Array.from(new Set(employeesList.map(e => e.department).filter(Boolean)));
    // Unique approvers
    const filterApproverOptions = Array.from(new Set(allEnterpriseRecords.map(r => r.approverName).filter(Boolean)));

    // Max values for trend visual graphs scaling
    const maxTrendTotal = Math.max(...trendWindowData.map(pt => pt.total), 1000);

    // Compute SVG coordinates for Monthly Total Spending Trend (Area Curve)
    const svgWidth = 800;
    const svgHeight = 220;
    const svgPaddingLeft = 60;
    const svgPaddingRight = 40;
    const svgPaddingTop = 30;
    const svgPaddingBottom = 40;

    const chartActiveWidth = svgWidth - svgPaddingLeft - svgPaddingRight;
    const chartActiveHeight = svgHeight - svgPaddingTop - svgPaddingBottom;

    const chartPoints = trendWindowData.map((pt, idx) => {
      const n = trendWindowData.length;
      const x = svgPaddingLeft + (n > 1 ? (idx / (n - 1)) * chartActiveWidth : chartActiveWidth / 2);
      const ratio = pt.total / maxTrendTotal;
      const y = svgHeight - svgPaddingBottom - (ratio * chartActiveHeight);
      return { x, y, pt };
    });

    // Create SVG Path Commands
    let pathD = "";
    let areaD = "";
    if (chartPoints.length > 0) {
      pathD = `M ${chartPoints[0].x} ${chartPoints[0].y}`;
      for (let i = 1; i < chartPoints.length; i++) {
        pathD += ` L ${chartPoints[i].x} ${chartPoints[i].y}`;
      }
      areaD = `${pathD} L ${chartPoints[chartPoints.length - 1].x} ${svgHeight - svgPaddingBottom} L ${chartPoints[0].x} ${svgHeight - svgPaddingBottom} Z`;
    }

    return (
      <div id="mom-bi-analytics-dashboard" className="space-y-6 animate-fade-in relative">
        
        {/* TOP LEVEL CONTROLS PANEL */}
        <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest font-mono flex items-center gap-2">
                <CalendarRange className="h-4 w-4 text-orange-500" />
                <span>Quarterly & Monthly Comparison Matrix</span>
              </h3>
              <p className="text-xs text-slate-400">Select reporting months to evaluate relative budget deviation and growth patterns.</p>
            </div>
            
            {/* Quick Month-to-Month comparison pickers */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="space-y-1">
                <span className="block text-[9px] uppercase font-bold text-slate-450 tracking-wider">Previous Month (A)</span>
                <input
                  type="month"
                  value={activePrevMonth}
                  onChange={(e) => setSelectedPrevMonth(e.target.value)}
                  className="w-40 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-400 cursor-pointer"
                />
              </div>

              <div className="p-2 self-end text-slate-350">
                <ArrowRight className="h-4 w-4" />
              </div>

              <div className="space-y-1">
                <span className="block text-[9px] uppercase font-bold text-slate-455 tracking-wider">Current Month (B)</span>
                <input
                  type="month"
                  value={activeCurrMonth}
                  onChange={(e) => setSelectedCurrMonth(e.target.value)}
                  className="w-40 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-400 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* SECONDARY ADVANCED BI FILTERS PANEL */}
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-3 pt-3 border-t border-slate-100">
            {/* Keyword search bar */}
            <div className="relative">
              <span className="block text-[9px] uppercase font-bold text-slate-450 tracking-wider mb-1">Keywords Search</span>
              <div className="relative">
                <Search className="absolute left-3.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Employee name, memo..."
                  value={momSearch}
                  onChange={(e) => setMomSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-205 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-400"
                />
              </div>
            </div>

            {/* Voucher No search */}
            <div>
              <span className="block text-[9px] uppercase font-bold text-slate-450 tracking-wider mb-1">Voucher / Doc No</span>
              <input
                type="text"
                placeholder="Voucher No (CV-, ot-)..."
                value={momVoucherNo}
                onChange={(e) => setMomVoucherNo(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-205 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-400"
              />
            </div>

            {/* Category selection dropdown */}
            <div>
              <span className="block text-[9px] uppercase font-bold text-slate-450 tracking-wider mb-1">Expense head</span>
              <select
                value={momCategory}
                onChange={(e) => setMomCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-205 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-405 cursor-pointer"
              >
                <option value="All">All Expense Categories</option>
                <option value="Cash Voucher">Cash Voucher Categories Only</option>
                <option value="Corporate Credit Card">Credit Card Expenses Only</option>
                <option value="Local Conveyance">Local Conveyance Only</option>
                <option value="Sample Collection">Sample Collection Only</option>
                <option value="OTA Travel Request">OTA Tickets / Tours Only</option>
                <option value="Marketing Expense">Marketing / Commissions Only</option>
                {filterCatOptions.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Employee claimant filter */}
            <div>
              <span className="block text-[9px] uppercase font-bold text-slate-450 tracking-wider mb-1">Claimant Employee</span>
              <select
                value={momEmployee}
                onChange={(e) => setMomEmployee(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-205 rounded-xl text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="All">All Claimants</option>
                {filterEmpOptions.map(emp => (
                  <option key={emp} value={emp}>{emp}</option>
                ))}
              </select>
            </div>

            {/* Department division filter */}
            <div>
              <span className="block text-[9px] uppercase font-bold text-slate-450 tracking-wider mb-1">Department Division</span>
              <select
                value={momDepartment}
                onChange={(e) => setMomDepartment(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-205 rounded-xl text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="All">All Divisions</option>
                {filterDeptOptions.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {/* Reviewing Approver filter */}
            <div>
              <span className="block text-[9px] uppercase font-bold text-slate-450 tracking-wider mb-1">Authorized Approver</span>
              <select
                value={momApprover}
                onChange={(e) => setMomApprover(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-205 rounded-xl text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="All">All Approvers</option>
                {filterApproverOptions.map(appr => (
                  <option key={appr} value={appr}>{appr}</option>
                ))}
              </select>
            </div>

            {/* Indian Quarter Filter selection */}
            <div>
              <span className="block text-[9px] uppercase font-bold text-slate-450 tracking-wider mb-1">FY Quarter (India)</span>
              <select
                value={momQuarter}
                onChange={(e) => setMomQuarter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-205 rounded-xl text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="All">All Quarters</option>
                <option value="Q1">Quarter 1 (Apr - Jun)</option>
                <option value="Q2">Quarter 2 (Jul - Sep)</option>
                <option value="Q3">Quarter 3 (Oct - Dec)</option>
                <option value="Q4">Quarter 4 (Jan - Mar)</option>
              </select>
            </div>

            {/* Financial Year selector */}
            <div>
              <span className="block text-[9px] uppercase font-bold text-slate-450 tracking-wider mb-1">Financial Year</span>
              <select
                value={momFY}
                onChange={(e) => setMomFY(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-205 rounded-xl text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="All">All Years</option>
                <option value="FY 2025-26">FY 2025-26 (Apr 25 - Mar 26)</option>
                <option value="FY 2026-27">FY 2026-27 (Apr 26 - Mar 27)</option>
              </select>
            </div>

            {/* Date Start picker */}
            <div>
              <span className="block text-[9px] uppercase font-bold text-slate-450 tracking-wider mb-1">Custom Start Date</span>
              <input
                type="date"
                value={momDateStart}
                onChange={(e) => setMomDateStart(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-205 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
              />
            </div>

            {/* Date End picker */}
            <div>
              <span className="block text-[9px] uppercase font-bold text-slate-450 tracking-wider mb-1">Custom End Date</span>
              <div className="flex gap-2 items-center">
                <input
                  type="date"
                  value={momDateEnd}
                  onChange={(e) => setMomDateEnd(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-205 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                />
                
                {/* Reset button inside filter */}
                <button
                  title="Clear All Filters"
                  onClick={() => {
                    setMomSearch("");
                    setMomVoucherNo("");
                    setMomCategory("All");
                    setMomEmployee("All");
                    setMomDepartment("All");
                    setMomApprover("All");
                    setMomQuarter("All");
                    setMomFY("All");
                    setMomDateStart("");
                    setMomDateEnd("");
                  }}
                  className="p-2 border border-slate-200 hover:bg-slate-50 hover:text-rose-500 rounded-xl transition text-slate-450"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* OVERALL COMPARISON CONSOLIDATED KPI CARD ROW */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Month A Total Spent */}
          <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm relative overflow-hidden">
            <div className="absolute right-3 top-3 p-1.5 bg-slate-50 rounded-xl text-slate-400">
              <Calendar className="h-5 w-5" />
            </div>
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">Month A Expense ({activePrevMonth})</span>
              <strong className="block text-2xl font-black text-slate-900">
                <InteractiveAmount amount={overallMoM.prevTotal} />
              </strong>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-505 font-mono">
                <span className="px-2 py-0.5 bg-slate-100 rounded-md border border-slate-200">
                  {overallMoM.prevCount} Approved Bilings
                </span>
                <span>Calculations finalized</span>
              </div>
            </div>
          </div>

          {/* Month B Total Spent */}
          <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm relative overflow-hidden">
            <div className="absolute right-3 top-3 p-1.5 bg-indigo-50 text-indigo-500 rounded-xl">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div className="space-y-1.5 flex flex-col justify-between h-full">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">Month B Expense ({activeCurrMonth})</span>
                <strong className="block text-2xl font-black text-indigo-950">
                  <InteractiveAmount amount={overallMoM.currTotal} />
                </strong>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-650 font-mono mt-1">
                <span className="px-2 py-0.5 bg-indigo-55/10 rounded-md border border-indigo-100">
                  {overallMoM.currCount} Approved Bilings
                </span>
                <span>Active evaluation</span>
              </div>
            </div>
          </div>

          {/* Absolute & relative Difference (Cost deviation indicator) */}
          <div className={`p-5 rounded-2xl border shadow-sm relative overflow-hidden transition-colors ${
            overallMoM.difference >= 0 
              ? "bg-rose-50/50 border-rose-150 text-rose-955" 
              : "bg-emerald-50/50 border-emerald-150 text-emerald-955"
          }`}>
            <div className={`absolute right-3 top-3 p-1.5 rounded-xl ${
              overallMoM.difference >= 0 ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"
            }`}>
              {overallMoM.difference >= 0 ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
            </div>
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">Periodic Outflow Delta</span>
              <strong className={`block text-2xl font-black ${
                overallMoM.difference >= 0 ? "text-rose-600" : "text-emerald-600"
              }`}>
                {overallMoM.difference >= 0 ? "+" : ""}<InteractiveAmount amount={overallMoM.difference} />
              </strong>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                  overallMoM.difference >= 0 ? "bg-rose-100/80 border border-rose-200" : "bg-emerald-100/80 border border-emerald-200"
                }`}>
                  {overallMoM.difference >= 0 ? "+" : ""}{overallMoM.growthPercent.toFixed(1)}% Growth
                </span>
                <span className="text-[10px] text-slate-500 font-bold">
                  {overallMoM.difference >= 0 ? "Potential budget leakage" : "Successful budget contraction"}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* AI SMART FIDUCIARY AUDIT & INSIGHTS CARD */}
        <div className="bg-gradient-to-r from-amber-50 to-amber-50/30 border border-amber-200 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500 text-white rounded-xl">
                <Zap className="h-5 w-5 text-amber-50" />
              </div>
              <div>
                <strong className="block text-slate-800 text-sm font-black uppercase tracking-wider">Automated Audit & Expense Variance Insights</strong>
                <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-widest">Calculated dynamically from approved database registers</span>
              </div>
            </div>

            {/* Badges */}
            <div className="hidden sm:flex gap-2">
              <span className="px-2.5 py-0.5 bg-amber-100 border border-amber-250 text-amber-800 font-bold text-[10px] font-mono rounded-lg">
                FY Spike Sensors: active
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left box: Primary drivers and growth alerts */}
            <div className="bg-white/80 border border-amber-200/50 p-4 rounded-xl space-y-2">
              <span className="block text-[10px] uppercase font-bold text-amber-800 tracking-wider font-mono">Spend Trajectory Indicators</span>
              
              <ul className="space-y-2 text-xs text-slate-705">
                {varianceAnalysis.costDrivers.length > 0 ? (
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">●</span>
                    <p><b>Top period cost drivers:</b> {varianceAnalysis.costDrivers.join(", ")} represent largest budget displacement.</p>
                  </li>
                ) : (
                  <li className="flex items-start gap-2 text-slate-400">
                    <span className="mt-0.5">●</span>
                    <p>No critical segment spikes detected.</p>
                  </li>
                )}

                {varianceAnalysis.insights.map((ins, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">●</span>
                    <p>{ins.replace(/"/g, "")}</p>
                  </li>
                ))}

                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">●</span>
                  <p>Highest Spending acceleration registered in month <b>{varianceAnalysis.highestIncreaseMonth}</b> (+₹{varianceAnalysis.highestIncreaseVal.toLocaleString("en-IN")}), while lowest registered in month <b>{varianceAnalysis.highestDecreaseMonth}</b> (₹{varianceAnalysis.highestDecreaseVal.toLocaleString("en-IN")}).</p>
                </li>
              </ul>
            </div>

            {/* Right box: Integrity Spikes and repeated claims checks */}
            <div className="bg-white/80 border border-amber-200/50 p-4 rounded-xl space-y-3">
              <span className="block text-[10px] uppercase font-bold text-amber-800 tracking-wider font-mono">Claim Integrity Audits</span>

              <div className="space-y-2">
                {varianceAnalysis.unusualSpikes.length > 0 ? (
                  varianceAnalysis.unusualSpikes.map((sk, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-rose-50/50 border border-rose-100 rounded-lg text-xs leading-none">
                      <div className="space-y-1">
                        <span className="font-extrabold text-slate-800 block text-[10.5px]">Spike Alert: {sk.employee} ({sk.category})</span>
                        <span className="text-[9.5px] text-slate-400 block font-bold">Claimed amt exceeds category normal average by <b className="text-rose-600 font-extrabold">{sk.ratio.toFixed(1)}x</b></span>
                      </div>
                      <span className="font-mono text-rose-600 font-black text-xs">₹{sk.amount.toLocaleString("en-IN")}</span>
                    </div>
                  ))
                ) : (
                  <div className="p-3 bg-emerald-50/20 border border-emerald-100 rounded-lg text-[11px] font-bold text-emerald-800 flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    <span>0 extreme single-transaction spend spikes detected.</span>
                  </div>
                )}

                {varianceAnalysis.repeatedPatterns.length > 0 ? (
                  varianceAnalysis.repeatedPatterns.map((pat, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-amber-50/40 border border-amber-100 rounded-lg text-xs leading-none">
                      <div className="space-y-1">
                        <span className="font-extrabold text-slate-800 block text-[10.5px]">Duplicate claim pattern matching: {pat.employee}</span>
                        <span className="text-[9.5px] text-slate-400 block font-bold">Filed <b className="text-amber-700 font-extrabold">{pat.count} times</b> same amount claims for <b>{pat.category}</b></span>
                      </div>
                      <span className="font-mono text-amber-700 font-black text-xs">₹{pat.amount.toLocaleString("en-IN")} ea</span>
                    </div>
                  ))
                ) : (
                  <div className="p-3 bg-emerald-50/20 border border-emerald-100 rounded-lg text-[11px] font-bold text-emerald-800 flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    <span>0 repeating claim patterns matched.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* COMPARATIVE TABLES GRID LAYOUT WITH DRILL DOWN TAPS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Box 1: Category wise MoM */}
          <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">Distribution Series (I)</span>
              <strong className="block text-sm font-black text-indigo-950 uppercase">Category-wise MoM</strong>
              <p className="text-[11px] text-slate-400 leading-tight">Click any category head to open drill-down vouchers list audit.</p>
            </div>

            <div className="overflow-x-auto pt-2">
              <table className="w-full text-left text-xs leading-none">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-450 font-extrabold text-[10px] uppercase tracking-wider">
                    <th className="pb-2.5">Category Head</th>
                    <th className="pb-2.5 text-right">{activePrevMonth}</th>
                    <th className="pb-2.5 text-right">{activeCurrMonth}</th>
                    <th className="pb-2.5 text-right">Variance %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {categoryMoM.map(cat => {
                    const inc = cat.diff >= 0;
                    return (
                      <tr 
                        key={cat.name} 
                        onClick={() => setDrillDownItem({ type: "category", name: cat.name })}
                        className="hover:bg-indigo-50/30 transition-colors cursor-pointer group"
                      >
                        <td className="py-2.5 font-bold text-slate-800 group-hover:text-indigo-650 flex items-center gap-1.5">
                          <Maximize2 className="h-2.5 w-2.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <span>{cat.name}</span>
                        </td>
                        <td className="py-2.5 text-right text-slate-500 font-mono">₹{cat.prevSpend.toLocaleString("en-IN")}</td>
                        <td className="py-2.5 text-right text-slate-900 font-bold font-mono">₹{cat.currSpend.toLocaleString("en-IN")}</td>
                        <td className="py-2.5 text-right font-bold pr-0.5">
                          <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-mono leading-none ${
                            inc ? "bg-rose-50 text-rose-600 border border-rose-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                          }`}>
                            {inc ? "+" : ""}{cat.growth.toFixed(0)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {categoryMoM.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-400 text-xs">No matching transactions in selection.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="bg-slate-50 p-2.5 rounded-xl text-[10px] text-slate-450 leading-tight border border-slate-100 mt-2">
              💡 <b>Double-Counting Protection</b> is currently active. Cash Vouchers with linked travel/credit references are processed only once.
            </div>
          </div>

          {/* Box 2: Division/Department-wise MoM */}
          <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">Distribution Series (II)</span>
              <strong className="block text-sm font-black text-indigo-950 uppercase">Departmental MoM</strong>
              <p className="text-[11px] text-slate-400 leading-tight">Click any division to drill down to its employee spending files.</p>
            </div>

            <div className="overflow-x-auto pt-2">
              <table className="w-full text-left text-xs leading-none">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-450 font-extrabold text-[10px] uppercase tracking-wider">
                    <th className="pb-2.5">Department</th>
                    <th className="pb-2.5 text-right">{activePrevMonth}</th>
                    <th className="pb-2.5 text-right">{activeCurrMonth}</th>
                    <th className="pb-2.5 text-right">Variance %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {departmentMoM.map(dept => {
                    const inc = dept.diff >= 0;
                    return (
                      <tr 
                        key={dept.name} 
                        onClick={() => setDrillDownItem({ type: "department", name: dept.name })}
                        className="hover:bg-indigo-50/30 transition-colors cursor-pointer group"
                      >
                        <td className="py-2.5 font-bold text-slate-800 group-hover:text-indigo-650 flex items-center gap-1.5">
                          <Maximize2 className="h-2.5 w-2.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <span>{dept.name}</span>
                        </td>
                        <td className="py-2.5 text-right text-slate-500 font-mono">₹{dept.prevSpend.toLocaleString("en-IN")}</td>
                        <td className="py-2.5 text-right text-slate-900 font-bold font-mono">₹{dept.currSpend.toLocaleString("en-IN")}</td>
                        <td className="py-2.5 text-right font-bold pr-0.5">
                          <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-mono leading-none ${
                            inc ? "bg-rose-50 text-rose-600 border border-rose-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                          }`}>
                            {inc ? "+" : ""}{dept.growth.toFixed(0)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {departmentMoM.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-400 text-xs">No department data.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="bg-slate-50 p-2.5 rounded-xl text-[10px] text-slate-450 leading-tight border border-slate-100 mt-2">
              💡 Spends are mapped to departments via employees database records.
            </div>
          </div>

          {/* Box 3: Employee leaderboards with Sorterns */}
          <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">Leaderboard Series (III)</span>
              <strong className="block text-sm font-black text-indigo-950 uppercase">Employee Claims MoM</strong>
              
              {/* Sorter tabs */}
              <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 mt-1.5 justify-between">
                <button
                  onClick={() => setMomEmployeeSort("total")}
                  className={`text-[9.5px] font-bold px-2.5 py-1 rounded-md transition ${momEmployeeSort === "total" ? "bg-white text-indigo-950 shadow-sm" : "text-slate-450 hover:text-slate-700"}`}
                >
                  Top claims
                </button>
                <button
                  onClick={() => setMomEmployeeSort("increase")}
                  className={`text-[9.5px] font-bold px-2.5 py-1 rounded-md transition ${momEmployeeSort === "increase" ? "bg-white text-indigo-950 shadow-sm" : "text-slate-455 hover:text-slate-705"}`}
                >
                  Max Spike
                </button>
                <button
                  onClick={() => setMomEmployeeSort("decrease")}
                  className={`text-[9.5px] font-bold px-2.5 py-1 rounded-md transition ${momEmployeeSort === "decrease" ? "bg-white text-indigo-950 shadow-sm" : "text-slate-455 hover:text-slate-705"}`}
                >
                  Max Savings
                </button>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[300px] pt-1">
              <table className="w-full text-left text-xs leading-none">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-450 font-extrabold text-[10px] uppercase tracking-wider">
                    <th className="pb-2">Filer</th>
                    <th className="pb-2 text-right">{activePrevMonth}</th>
                    <th className="pb-2 text-right">{activeCurrMonth}</th>
                    <th className="pb-2 text-right">Variance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150/50">
                  {employeeMoM.slice(0, 15).map(emp => {
                    const inc = emp.diff >= 0;
                    return (
                      <tr 
                        key={emp.name} 
                        onClick={() => setDrillDownItem({ type: "employee", name: emp.name })}
                        className="hover:bg-indigo-50/30 transition-colors cursor-pointer group animate-fade-in"
                      >
                        <td className="py-2 font-bold text-slate-800 group-hover:text-indigo-650 flex items-center gap-1">
                          <Maximize2 className="h-2 w-2 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <span className="truncate max-w-[90px]">{emp.name}</span>
                        </td>
                        <td className="py-2 text-right text-slate-400 font-mono text-[11px]">₹{emp.prevSpend.toLocaleString("en-IN")}</td>
                        <td className="py-2 text-right text-slate-900 font-bold font-mono text-[11px]">₹{emp.currSpend.toLocaleString("en-IN")}</td>
                        <td className={`py-2 text-right font-bold font-mono text-[10.5px] ${inc ? "text-rose-600" : "text-emerald-600"}`}>
                          {inc ? "+" : ""}₹{emp.diff.toLocaleString("en-IN")}
                        </td>
                      </tr>
                    );
                  })}
                  {employeeMoM.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-400 text-xs">No employee records found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="bg-slate-50 p-2.5 rounded-xl text-[10px] text-slate-450 leading-tight border border-slate-100 mt-2">
              Showing top 15 results. Click any employee to inspect vouchers history.
            </div>
          </div>

        </div>

        {/* VISUAL ANALYTICAL BI GRAPHICS BOARDS */}
        <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">Analytical timeline series</span>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <PieChart className="h-4.5 w-4.5 text-indigo-500" />
                <span>Enterprise Expense Multi-Series Trends Visualizer</span>
              </h3>
            </div>

            {/* Time windows selectors */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setTrendWindow("last12")}
                className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition ${trendWindow === "last12" ? "bg-white text-slate-900 shadow-sm font-black" : "text-slate-500 hover:text-slate-800"}`}
              >
                Last 12m
              </button>
              <button
                onClick={() => setTrendWindow("last24")}
                className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition ${trendWindow === "last24" ? "bg-white text-slate-900 shadow-sm font-black" : "text-slate-500 hover:text-slate-800"}`}
              >
                Last 24m
              </button>
              <button
                onClick={() => setTrendWindow("fy")}
                className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition ${trendWindow === "fy" ? "bg-white text-slate-900 shadow-sm font-black" : "text-slate-500 hover:text-slate-800"}`}
              >
                FY View
              </button>
              <button
                onClick={() => setTrendWindow("custom")}
                className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition ${trendWindow === "custom" ? "bg-white text-slate-900 shadow-sm font-black" : "text-slate-500 hover:text-slate-800"}`}
              >
                Custom Range
              </button>
            </div>
          </div>

          {/* Core Monthly trend area curve line chart */}
          <div className="pt-2">
            <span className="block text-[10px] font-extrabold text-slate-450 uppercase tracking-widest font-mono mb-2">Approved Expenses timeline trend (INR)</span>
            
            <div className="w-full overflow-x-auto">
              <div className="min-w-[650px] bg-slate-50 border border-slate-200 rounded-xl p-4">
                <svg viewBox="0 0 800 220" className="w-full h-auto">
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25"/>
                      <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0"/>
                    </linearGradient>
                  </defs>

                  {/* Horizontal grid lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((r, idx) => {
                    const y = svgPaddingTop + (chartActiveHeight * r);
                    const labelVal = maxTrendTotal * (1 - r);
                    return (
                      <g key={idx} className="opacity-40">
                        <line 
                          x1={svgPaddingLeft} 
                          y1={y} 
                          x2={svgWidth - svgPaddingRight} 
                          y2={y} 
                          stroke="#cbd5e1" 
                          strokeDasharray="4 4" 
                          strokeWidth="1"
                        />
                        <text 
                          x={svgPaddingLeft - 8} 
                          y={y + 3} 
                          className="font-mono text-[8px] fill-slate-450 font-bold" 
                          textAnchor="end"
                        >
                          ₹{(labelVal / 1000).toFixed(0)}k
                        </text>
                      </g>
                    );
                  })}

                  {/* Area fill */}
                  {areaD && (
                    <path d={areaD} fill="url(#areaGrad)" />
                  )}

                  {/* Connection Curve path */}
                  {pathD && (
                    <path 
                      d={pathD} 
                      fill="none" 
                      stroke="#4f46e5" 
                      strokeWidth="2.5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                    />
                  )}

                  {/* Nodes & tooltip labels */}
                  {chartPoints.map((pt, idx) => (
                    <g key={idx} className="group cursor-pointer">
                      <circle 
                        cx={pt.x} 
                        cy={pt.y} 
                        r="3.5" 
                        fill="#ffffff" 
                        stroke="#4f46e5" 
                        strokeWidth="2.5" 
                        className="hover:r-5 transition-all"
                      />
                      {/* Month names label under axis */}
                      <text 
                        x={pt.x} 
                        y={svgHeight - svgPaddingBottom + 12} 
                        className="font-mono text-[7.5px] fill-slate-500 font-bold" 
                        textAnchor="middle"
                        transform={`rotate(-25, ${pt.x}, ${svgHeight - svgPaddingBottom + 10})`}
                      >
                        {pt.pt.month}
                      </text>
                      {/* Amount text hovered/interactive */}
                      <text 
                        x={pt.x} 
                        y={pt.y - 8} 
                        className="font-mono text-[8.5px] font-black fill-slate-800 text-center opacity-0 group-hover:opacity-100 transition-opacity"
                        textAnchor="middle"
                      >
                        ₹{(pt.pt.total).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
            </div>
          </div>

          {/* Extra analytical breakout: Top categories bento-style progress bars */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
            {/* Left breakouts: Top segments bar distribution */}
            <div className="space-y-3">
              <span className="block text-[10px] font-extrabold text-slate-455 uppercase tracking-widest font-mono">Distribution shares top categories (Current selection)</span>
              
              <div className="space-y-2">
                {categoryMoM.slice(0, 5).map(cat => {
                  const percent = Math.min((cat.currSpend / (overallMoM.currTotal || 1)) * 100, 100);
                  return (
                    <div key={cat.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-705">
                        <span>{cat.name}</span>
                        <span>₹{cat.currSpend.toLocaleString("en-IN")} ({percent.toFixed(0)}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                {categoryMoM.length === 0 && (
                  <p className="text-center text-slate-400 text-xs py-4">No categories data.</p>
                )}
              </div>
            </div>

            {/* Right breakouts: Division/Department shares */}
            <div className="space-y-3">
              <span className="block text-[10px] font-extrabold text-slate-455 uppercase tracking-widest font-mono">Department limits consumption (%)</span>
              
              <div className="space-y-2">
                {departmentMoM.slice(0, 5).map(dept => {
                  const percent = Math.min((dept.currSpend / (overallMoM.currTotal || 1)) * 100, 100);
                  return (
                    <div key={dept.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-705">
                        <span>{dept.name}</span>
                        <span>₹{dept.currSpend.toLocaleString("en-IN")} ({percent.toFixed(0)}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-orange-500 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                {departmentMoM.length === 0 && (
                  <p className="text-center text-slate-400 text-xs py-4">No departments data.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* REVENUE EXPORTS TRIGGERS COMPARTMENT */}
        <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-850 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-black uppercase tracking-wider font-mono flex items-center gap-2">
              <Download className="h-4 w-4 text-emerald-400" />
              <span>MoM BI Reports & Financial Declaror</span>
            </h4>
            <p className="text-xs text-slate-300">Download high-fidelity formatted summaries conforming to audit criteria with variance insight overlays.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportMoMPdf}
              className="px-4 py-2 bg-slate-800 text-white hover:bg-slate-700 hover:text-emerald-400 border border-slate-700/60 rounded-xl text-xs font-bold transition flex items-center gap-2 active:scale-95"
            >
              <FileText className="h-4 w-4" />
              <span>Compilation PDF</span>
            </button>
            <button
              onClick={handleExportMoMExcel}
              className="px-4 py-2 bg-slate-800 text-white hover:bg-slate-700 hover:text-amber-400 border border-slate-700/60 rounded-xl text-xs font-bold transition flex items-center gap-2 active:scale-95"
            >
              <Receipt className="h-4 w-4" />
              <span>Excel Workbook</span>
            </button>
            <button
              onClick={handleExportMoMCSV}
              className="px-4 py-2 bg-slate-800 text-white hover:bg-slate-700 hover:text-indigo-400 border border-slate-700/60 rounded-xl text-xs font-bold transition flex items-center gap-2 active:scale-95"
            >
              <Coins className="h-4 w-4" />
              <span>Raw Tabular CSV</span>
            </button>
          </div>
        </div>

        {/* INTERACTIVE DRILL-DOWN MODAL CONTAINER OVERLAY */}
        {drillDownItem && drillDownDetails && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden border border-slate-200 shadow-2xl flex flex-col justify-between" id="mom-drilldown-modal">
              
              {/* Modal header boundary */}
              <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-slate-400 font-mono tracking-widest block">Audit Driller Module activated</span>
                  <div className="flex items-center gap-2.5">
                    <strong className="text-base font-black uppercase text-indigo-150">Drill-Down: {drillDownDetails.name}</strong>
                    <span className="px-2 py-0.5 bg-slate-800 rounded-md text-[10px] font-bold text-amber-500 border border-slate-700 font-mono">
                      Type: {drillDownDetails.type}
                    </span>
                  </div>
                </div>
                
                <button 
                  onClick={() => {
                    setDrillDownItem(null);
                    setSelectedDrillTx(null);
                  }}
                  className="p-1.5 hover:bg-slate-800 rounded-xl transition text-slate-400 hover:text-white"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto space-y-5 flex-1 select-none">
                
                {/* Meta Comparatives overview box inside drilldown */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-150 text-slate-800">
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Month A Spent ({activePrevMonth})</span>
                    <strong className="text-lg font-black text-slate-650">₹{drillDownDetails.prevSum.toLocaleString("en-IN")}</strong>
                    <span className="text-[10px] text-slate-400 block font-bold">{drillDownDetails.prevMonthRecords.length} items filed</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Month B Spent ({activeCurrMonth})</span>
                    <strong className="text-lg font-black text-indigo-950">₹{drillDownDetails.currSum.toLocaleString("en-IN")}</strong>
                    <span className="text-[10px] text-slate-400 block font-bold">{drillDownDetails.currMonthRecords.length} items active</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-450 tracking-wider block">Delta Shift Outflow</span>
                    {(() => {
                      const d = drillDownDetails.currSum - drillDownDetails.prevSum;
                      const grw = drillDownDetails.prevSum > 0 ? (d / drillDownDetails.prevSum) * 100 : 0;
                      const big = d >= 0;
                      return (
                        <>
                          <strong className={`text-lg font-extrabold block ${big ? "text-rose-600" : "text-emerald-600"}`}>
                            {big ? "+" : ""}₹{d.toLocaleString("en-IN")}
                          </strong>
                          <span className={`text-[10.5px] font-bold ${big ? "text-rose-600" : "text-emerald-700"}`}>
                            {big ? "+" : ""}{grw.toFixed(1)}% deviation
                          </span>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Subheading list */}
                <div className="space-y-2">
                  <span className="block text-[10.5px] font-black uppercase text-slate-400 tracking-wider font-mono">Consolidated Fiduciary Transactions Ledger</span>
                  <p className="text-[11px] text-slate-405 leading-none">Click any voucher item below to trace its multi-level authorization cycle and timeline.</p>
                  
                  <div className="overflow-x-auto border border-slate-150 rounded-xl">
                    <table className="w-full text-left text-xs leading-none">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-450 font-extrabold text-[10px] uppercase tracking-wider">
                          <th className="p-2.5">Voucher / Doc No</th>
                          <th className="p-2.5">Claimant Filer</th>
                          <th className="p-2.5">Date</th>
                          <th className="p-2.5">Project / Purpose</th>
                          <th className="p-2.5 text-right">Value (INR)</th>
                          <th className="p-2.5 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {drillDownDetails.records.map(tx => (
                          <tr 
                            key={tx.id} 
                            onClick={() => setSelectedDrillTx(tx)}
                            className={`hover:bg-indigo-50/20 cursor-pointer transition-all ${selectedDrillTx?.id === tx.id ? "bg-indigo-55/15 border-l-2 border-indigo-600" : ""}`}
                          >
                            <td className="p-2.5 font-bold font-mono text-indigo-900">{tx.documentNumber}</td>
                            <td className="p-2.5 font-bold text-slate-800">{tx.employeeName}</td>
                            <td className="p-2.5 text-slate-500 font-mono text-[10.5px]">{tx.createdAt?.substring(0, 10)}</td>
                            <td className="p-2.5 text-slate-600 max-w-[150px] truncate">{tx.projectName}</td>
                            <td className="p-2.5 text-right font-bold text-slate-950 font-mono">₹{tx.amount.toLocaleString("en-IN")}</td>
                            <td className="p-2.5 text-center">
                              <span className="px-1.5 py-0.5 rounded text-[8.5px] bg-emerald-50 text-emerald-800 uppercase font-mono font-bold border border-emerald-100">
                                {tx.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* trace section logic triggered inside drill down click table */}
                {selectedDrillTx && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4 animate-fade-in text-slate-800">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-[9.5px] uppercase font-bold text-slate-400 block font-mono">Fiduciary Verification Auditing Trace</span>
                        <strong className="text-xs font-black text-indigo-950 block">Audit Pathway: {selectedDrillTx.documentNumber} (Value: ₹{selectedDrillTx.amount.toLocaleString("en-IN")})</strong>
                      </div>

                      {/* Attachments verify buttons indicator */}
                      <div className="flex gap-2">
                        {selectedDrillTx.rawRecord?.billFileContent || selectedDrillTx.rawRecord?.attachments?.length > 0 ? (
                          <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded text-[9px] font-extrabold uppercase border border-emerald-200 animate-pulse flex items-center gap-1">
                            <span>📎 PDF Document verified</span>
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-slate-100 text-slate-650 rounded text-[9px] font-bold border border-slate-200 uppercase">
                            Standalone claim
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Timeline stepper */}
                    <div className="relative pl-6 space-y-4 pt-1">
                      
                      {/* Stem */}
                      <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-slate-200" />

                      {/* Created */}
                      <div className="relative flex items-start gap-4">
                        <div className="absolute -left-[21px] mt-0.5 h-3 w-3 bg-emerald-400 rounded-full border-2 border-white ring-2 ring-emerald-100" />
                        <div className="leading-none space-y-0.5">
                          <span className="block text-[10px] font-black uppercase text-slate-800">Filer Submitter Initiation</span>
                          <span className="block text-[9.5px] text-slate-450">{selectedDrillTx.employeeName} filed on {selectedDrillTx.createdAt?.replace("T", " ").substring(0, 16)}</span>
                        </div>
                      </div>

                      {/* Stage 1: Head reviews */}
                      <div className="relative flex items-start gap-4">
                        <div className="absolute -left-[21px] mt-0.5 h-3 w-3 bg-emerald-500 rounded-full border-2 border-white ring-2 ring-emerald-100" />
                        <div className="leading-none space-y-0.5">
                          <span className="block text-[10px] font-black uppercase text-slate-800">First level Department Head Sanction</span>
                          <span className="block text-[9.5px] text-slate-450">Review authorized & approved by Division Auditor</span>
                        </div>
                      </div>

                      {/* Stage 2: admin review */}
                      <div className="relative flex items-start gap-4">
                        <div className="absolute -left-[21px] mt-0.5 h-3 w-3 bg-emerald-550 rounded-full border-2 border-white ring-2 ring-emerald-100" />
                        <div className="leading-none space-y-0.5">
                          <span className="block text-[10px] font-black uppercase text-slate-800">Second level administration review</span>
                          <span className="block text-[9.5px] text-slate-450">Passed audit guidelines, cleared in system ledger</span>
                        </div>
                      </div>

                      {/* Stage 3: Super Admin CONCLUSIVE clearance */}
                      <div className="relative flex items-start gap-4">
                        <div className="absolute -left-[21px] mt-0.5 h-3 w-3 bg-indigo-600 rounded-full border-2 border-white ring-2 ring-indigo-150 animate-pulse" />
                        <div className="leading-none space-y-0.5">
                          <span className="block text-[10px] font-black uppercase text-indigo-950">Conclusive Core Super-Admin Signoff</span>
                          <span className="block text-[9.5.px] text-indigo-650 font-bold">{selectedDrillTx.approverName || "Super Admin Override Board"} signed off payment register</span>
                        </div>
                      </div>

                    </div>
                  </div>
                )}

              </div>

              {/* Modal controls Footer */}
              <div className="bg-slate-50 p-4 border-t border-slate-150 flex justify-end">
                <button
                  onClick={() => {
                    setDrillDownItem(null);
                    setSelectedDrillTx(null);
                  }}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
                >
                  Close Driller View
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    );
  };

  return (
    <div id="advanced-reporting-dashboard" className="space-y-6 max-w-7xl mx-auto animate-fade-in text-slate-800">
      
      {exportNotification && (
        <div className={`fixed top-4 right-4 z-50 max-w-sm p-4 rounded-xl border shadow-lg flex items-center gap-3 animate-fade-in transition-all ${
          exportNotification.type === "success" 
            ? "bg-emerald-50 border-emerald-200 text-emerald-950" 
            : "bg-rose-50 border-rose-200 text-rose-955"
        }`}>
          <span className="text-lg">{exportNotification.type === "success" ? "✅" : "⚠️"}</span>
          <div className="text-xs font-semibold">
            <p className="font-extrabold">{exportNotification.type === "success" ? "Export Completed" : "Export Failed"}</p>
            <p className="text-slate-500 font-medium">{exportNotification.message}</p>
          </div>
        </div>
      )}
      
      {/* 1. Page Header banner styled with Indigo gradient */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-xl border border-indigo-900/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-12 -translate-y-12">
          <TrendingUp className="h-96 w-96 text-white" />
        </div>
        
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full text-[9px] font-extrabold uppercase tracking-wider font-mono">
              ★ Enterprise Intelligence
            </span>
            <span className="text-[10px] text-indigo-200 font-mono flex items-center gap-1.5 bg-white/5 py-0.5 px-2.5 rounded-md border border-white/10">
              <ShieldCheck className="h-3 w-3 text-emerald-400" />
              Corporate Audit Mode
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight" id="main-admin-title">Reports & Fiduciary Financial Center</h2>
          <p className="text-slate-300 text-xs max-w-3xl leading-relaxed">
            Consolidated multi-level reporting architecture. Intelligently tracks cross-linked vouchers, 
            local allowance sheets, and management marketing expenses preventing double counting. Active accounting guard blocks duplicate expense values.
          </p>
        </div>

        {/* Top-Right Month-End automated trigger widget */}
        <div className="mt-4 pt-4 border-t border-indigo-900/50 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-indigo-200">
            <Info className="h-4 w-4 text-amber-400 flex-shrink-0" />
            <span>Automated Month-End reporting is fully active. System generates comprehensive 30/31st statements automatically.</span>
          </div>
          {isMonthEndReportTriggered && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-3 py-1 rounded-lg font-mono text-[10px] font-extrabold uppercase animate-pulse flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5" />
              Month End Statement Compiled
            </div>
          )}
        </div>
      </div>

      {/* 2. Top Tier Segment Selectors (Daily, Monthly, Lifetime) */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-150 shadow-sm">
        
        {/* Toggle navigation for Lifetime, Monthly, Daily */}
        <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200/50">
          <button
            onClick={() => setReportTab("daily")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${reportTab === "daily" ? "bg-white text-slate-900 shadow-sm font-black" : "text-slate-500 hover:text-slate-800"}`}
          >
            <CalendarDays className="h-3.5 w-3.5 text-indigo-505" />
            <span>Daily Reports</span>
          </button>
          
          <button
            onClick={() => setReportTab("monthly")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${reportTab === "monthly" ? "bg-white text-slate-900 shadow-sm font-black" : "text-slate-500 hover:text-slate-800"}`}
          >
            <Calendar className="h-3.5 w-3.5 text-indigo-505" />
            <span>Monthly Reports</span>
          </button>
          
          <button
            onClick={() => setReportTab("lifetime")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${reportTab === "lifetime" ? "bg-white text-slate-900 shadow-sm font-black" : "text-slate-500 hover:text-slate-800"}`}
          >
            <Layers className="h-3.5 w-3.5 text-indigo-505" />
            <span>Lifetime Reports</span>
          </button>

          <button
            onClick={() => setReportTab("mom")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${reportTab === "mom" ? "bg-white text-slate-900 shadow-sm font-black" : "text-slate-500 hover:text-slate-800"}`}
          >
            <TrendingUp className="h-3.5 w-3.5 text-orange-500" />
            <span>BI & MoM Comparison</span>
          </button>
        </div>

        {/* Contextual Date/Month selection pickers */}
        <div className="flex items-center gap-3">
          {reportTab === "daily" && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Date Select</span>
              <input
                type="date"
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-400"
              />
            </div>
          )}

          {reportTab === "monthly" && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Month Select</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-400"
              />
            </div>
          )}

          {reportTab === "lifetime" && (
            <div className="flex items-center gap-1 text-slate-400 text-xs font-bold font-mono">
              <CalendarRange className="h-4 w-4 text-indigo-500" />
              <span>Comprehensive Timeline (2026-01-01 to Present)</span>
            </div>
          )}

          {reportTab === "mom" && (
            <div className="flex items-center gap-1.5 text-orange-600 text-xs font-bold font-mono">
              <Zap className="h-4 w-4 text-orange-500 animate-pulse" />
              <span>Interactive BI Comparison</span>
            </div>
          )}
        </div>
      </div>

      {reportTab === "mom" ? (
        renderMonthOnMonthDashboard()
      ) : (
        <>
          {/* 3. Primary Statistics Row (Double-counting protected) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Approved Expenses card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">Total Approved</span>
            <strong className="block text-2xl font-black text-emerald-600">
              <InteractiveAmount amount={reportStats.approvedTotal} />
            </strong>
            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
              {reportStats.approvedCount} Sanctioned Items
            </span>
          </div>
          <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle className="h-6 w-6" />
          </div>
        </div>

        {/* Pending Approvals Expense */}
        <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">Pending Pipeline</span>
            <strong className="block text-2xl font-black text-amber-500">
              <InteractiveAmount amount={reportStats.pendingTotal} />
            </strong>
            <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100">
              {reportStats.pendingCount} In Queue Review
            </span>
          </div>
          <div className="p-3.5 bg-amber-50 text-amber-500 rounded-xl">
            <Clock className="h-6 w-6" />
          </div>
        </div>

        {/* Rejected Totals */}
        <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">Voided / Rejected</span>
            <strong className="block text-2xl font-black text-slate-400">
              <InteractiveAmount amount={reportStats.rejectedTotal} />
            </strong>
            <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100">
              {reportStats.rejectedCount} Void Transactions
            </span>
          </div>
          <div className="p-3.5 bg-rose-50 text-rose-500 rounded-xl">
            <XCircle className="h-6 w-6" />
          </div>
        </div>

        {/* Unique Transactions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">Active Documents</span>
            <strong className="block text-2xl font-black text-indigo-950">
              {reportStats.totalTransactions} Files
            </strong>
            <span className="text-[10px] text-indigo-650 font-bold bg-indigo-55/10 px-2 py-0.5 rounded-lg border border-indigo-100">
              No Double-Counting Shield Active
            </span>
          </div>
          <div className="p-3.5 bg-indigo-50/70 text-indigo-600 rounded-xl">
            <FileText className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* PARTIAL APPROVAL AUDIT ANALYSIS & SAVINGS LEDGER */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* Total Requested Budget Card */}
        <div className="bg-gradient-to-br from-indigo-50 to-white p-5 rounded-2xl border border-indigo-100 shadow-xs flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-indigo-500 tracking-wider font-mono">Original Claim Amount (Requested)</span>
            <strong className="block text-2xl font-black text-indigo-900">
              <InteractiveAmount amount={reportStats.totalRequestedAmount} />
            </strong>
            <span className="text-[10px] text-indigo-700 font-bold bg-indigo-100 px-2 py-0.5 rounded-lg border border-indigo-200">
              Filer Submissions Demand
            </span>
          </div>
          <div className="p-3.5 bg-indigo-100 text-indigo-600 rounded-xl">
            <Coins className="h-4 w-4" />
          </div>
        </div>

        {/* Conclusive Approved Expenditure Card */}
        <div className="bg-gradient-to-br from-emerald-50 to-white p-5 rounded-2xl border border-emerald-100 shadow-xs flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider font-mono">Conclusive Authorized (Approved)</span>
            <strong className="block text-2xl font-black text-emerald-700">
              <InteractiveAmount amount={reportStats.totalApprovedAmount} />
            </strong>
            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-200">
              Actual Outflow Authorized
            </span>
          </div>
          <div className="p-3.5 bg-emerald-100 text-emerald-600 rounded-xl">
            <CheckCircle className="h-4 w-4" />
          </div>
        </div>

        {/* Audit Variance Savings Card */}
        <div className="bg-gradient-to-br from-rose-50 to-white p-5 rounded-2xl border border-rose-100 shadow-xs flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-rose-600 tracking-wider font-mono">Compliance Treasury Reductions (Reduced)</span>
            <strong className="block text-2xl font-black text-[#E11D48]">
              <InteractiveAmount amount={reportStats.totalReducedAmount} />
            </strong>
            <span className="text-[10px] text-rose-700 font-bold bg-rose-100 px-2 py-0.5 rounded-lg border border-rose-200">
              Saved via Auditing & Corrections
            </span>
          </div>
          <div className="p-3.5 bg-rose-100 text-[#E11D48] rounded-xl animate-pulse">
            <TrendingDown className="h-4 w-4" />
          </div>
        </div>

      </div>

      {/* PARTIAL APPROVAL AUDIT REDUCTION ANALYSIS LEDGER */}
      <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <div>
            <h3 className="font-extrabold text-sm uppercase font-mono tracking-wider text-slate-800 flex items-center gap-1.5">
              <span>Fiduciary Treasury Reduction & Reduction Reason Analysis</span>
              <span className="bg-rose-100 text-[#E11D48] text-[9px] px-1.5 py-0.5 rounded font-bold font-mono">
                {reportStats.partiallyApprovedCount} Claims Reduced
              </span>
            </h3>
            <p className="text-[10px] text-slate-450 font-mono">Detailed audit track listing fully approved vs partially approved claims and reasons for corporate budget saving</p>
          </div>
          <span className="px-2 py-0.5 bg-rose-50 border border-rose-100 text-[#E11D48] text-[9px] uppercase font-bold rounded">Regulatory Auditor Track</span>
        </div>

        {reportStats.partiallyApprovedCount === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs font-semibold bg-slate-50 border border-dashed rounded-xl">
            No partially approved or reduced claims detected in the active filtered subset.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-slate-400 font-mono uppercase text-[9px] tracking-wider font-extrabold">
                  <th className="py-2.5 px-3">Doc ID</th>
                  <th className="py-2.5 px-3">Filer Employee</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-right">Requested</th>
                  <th className="py-2.5 px-3 text-right">Approved</th>
                  <th className="py-2.5 px-3 text-right text-[#E11D48]">Difference Saved</th>
                  <th className="py-2.5 px-3">Reduction Reason / Audit Objections</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportStats.partiallyApprovedRecords.map((rec) => {
                  const diff = rec.totalBudget - (rec.approvedAmount !== undefined ? rec.approvedAmount : rec.totalBudget);
                  // Find reduction reason in record or in its history
                  const reason = rec.reductionReason || rec.approvalHistory?.find(h => h.reason)?.reason || "Alternative compliance cap enforced (Tier Review)";
                  return (
                    <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2 px-3 font-mono text-[10px] font-bold text-indigo-900">{rec.documentNumber}</td>
                      <td className="py-2 px-3 font-semibold text-slate-700 font-sans">{rec.employeeName}</td>
                      <td className="py-2 px-3">
                        <span className="bg-slate-100 text-slate-700 text-[10px] px-1.5 py-0.5 rounded font-mono font-bold">{rec.category}</span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-500">₹{rec.totalBudget.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right font-mono font-black text-emerald-700">₹{(rec.approvedAmount ?? rec.totalBudget).toLocaleString()}</td>
                      <td className="py-2 px-3 text-right font-mono font-black text-rose-600 bg-rose-50/50">₹{diff.toLocaleString()}</td>
                      <td className="py-2 px-3 font-sans text-slate-600 italic text-[11px] max-w-[300px] truncate" title={reason}>"{reason}"</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Category and Department visual breakdowns (Beautiful inline custom SVG chart bars) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Category-Wise Expense Head Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <div>
              <h3 className="font-extrabold text-sm uppercase font-mono tracking-wider text-slate-800">
                Category Spending Allocation
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">Approved transaction totals grouped by document categories</p>
            </div>
            <span className="px-2 py-0.5 bg-emerald-55/10 text-emerald-700 text-[9px] uppercase font-bold rounded">Strict Accurate No double-take</span>
          </div>

          <div className="space-y-4">
            {expenseBreakdown.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-8">No approved record categories discovered.</p>
            ) : (
              expenseBreakdown.map((cat, idx) => {
                const ratio = Math.max((cat.amount / maxCategorySpend) * 100, 4);
                return (
                  <div key={idx} className="space-y-2 p-3 bg-slate-50/50 hover:bg-slate-100/30 rounded-xl border border-slate-100 transition shadow-xs">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-extrabold text-indigo-950 uppercase font-mono tracking-wider">{cat.name}</span>
                      <strong className="font-mono text-slate-900">
                        <InteractiveAmount amount={cat.amount} />
                      </strong>
                    </div>
                    {/* Progress Bar Container */}
                    <div className="relative w-full h-2.5 bg-slate-150 rounded-full overflow-hidden">
                      <div 
                        className="absolute left-0 top-0 h-full bg-gradient-to-r from-indigo-600 to-indigo-800 transition-all rounded-full"
                        style={{ width: `${ratio}%` }}
                      />
                    </div>
                    {/* Nested Sub-Heads list itemizer */}
                    {cat.subHeads && cat.subHeads.length > 0 && (
                      <div className="mt-2 pl-3 border-l-2 border-slate-300 text-[10px] space-y-1 bg-white p-2 rounded-lg border border-slate-50">
                        {cat.subHeads.map((sub, sidx) => (
                          <div key={sidx} className="flex justify-between text-slate-600">
                            <span className="font-medium text-slate-500">• {sub.headName}</span>
                            <span className="font-mono font-semibold text-slate-700">₹{sub.amount.toLocaleString("en-IN")}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Division Spending Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <div>
              <h3 className="font-extrabold text-sm uppercase font-mono tracking-wider text-slate-800">
                Department spending ratio
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">Division expenditure profiles calculated and verified</p>
            </div>
            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[9px] uppercase font-bold rounded">Treasury ledger</span>
          </div>

          <div className="space-y-3">
            {deptSpending.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-8">No approved departments recorded on this period.</p>
            ) : (
              deptSpending.map((dept, idx) => {
                const ratio = Math.max((dept.amount / maxDeptSpend) * 100, 4);
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700">{dept.department}</span>
                      <strong className="font-mono text-slate-900">
                        <InteractiveAmount amount={dept.amount} />
                      </strong>
                    </div>
                    <div className="relative w-full h-3 bg-slate-50 border border-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="absolute left-0 top-0 h-full bg-gradient-to-r from-indigo-950 via-indigo-900 to-slate-900 transition-all rounded-full"
                        style={{ width: `${ratio}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* 5. Workforce Leaderbords & Monthly Spend Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Top 10 corporate spenders tracker */}
        <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm space-y-4">
          <div className="border-b pb-2">
            <h3 className="font-extrabold text-sm uppercase font-mono tracking-wider text-slate-800">
              Worker Submission summaries
            </h3>
            <p className="text-[10px] text-slate-400 font-mono">Highest confirmed claimants list</p>
          </div>

          <div className="space-y-4">
            {employeeSpending.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No approved worker statements on database files.</p>
            ) : (
              employeeSpending.map((emp, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs border-b border-dashed border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="h-5 w-5 bg-indigo-50 text-indigo-700 font-black rounded-full flex items-center justify-center font-mono text-[9px]">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-slate-700">{emp.name}</span>
                  </div>
                  <strong className="font-mono text-slate-900">
                    <InteractiveAmount amount={emp.amount} />
                  </strong>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Monthly expense timeline trends */}
        <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm col-span-1 lg:col-span-2 space-y-4">
          <div className="border-b pb-2 flex justify-between items-center">
            <div>
              <h3 className="font-extrabold text-sm uppercase font-mono tracking-wider text-slate-800">
                Monthly Spend timeline trends
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">Consolidated approved totals tracked by monthly segments</p>
            </div>
            <span className="text-[9px] font-mono font-bold text-slate-400">Total System Span</span>
          </div>

          {monthlyTrendsList.length === 0 ? (
            <p className="text-xs text-slate-400 italic text-center py-12">No months cataloged yet.</p>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {monthlyTrendsList.slice(-6).map((trend, idx) => {
                  const ratio = Math.max((trend.total / maxTrendSpend) * 100, 4);
                  return (
                    <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-205/60 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-650">{trend.month}</span>
                        <strong className="font-mono text-indigo-950">
                          <InteractiveAmount amount={trend.total} />
                        </strong>
                      </div>
                      <div className="relative w-full h-2.5 bg-white border border-slate-150 rounded-full overflow-hidden">
                        <div 
                          className="absolute left-0 top-0 h-full bg-gradient-to-r from-emerald-500 to-indigo-600 transition-all rounded-full"
                          style={{ width: `${ratio}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* 6. Advanced Custom Search Tools & Filtering bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm space-y-4">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-3 gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded font-mono text-[9px] uppercase tracking-wider">
              Search Console
            </span>
            <h3 className="font-extrabold text-xs uppercase font-mono tracking-widest text-slate-600">
              Unified Search & Audit Filter Panel
            </h3>
          </div>
          
          <button
            onClick={() => {
              setSearchQuery("");
              setFilterCategory("All");
              setFilterStatus("All");
              setFilterDepartment("All");
              setFilterApprover("All");
              setDateRangeStart("");
              setDateRangeEnd("");
            }}
            className="text-[10px] text-indigo-600 hover:text-indigo-500 font-extrabold hover:underline select-none"
          >
            Clear Filter Preset
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          
          {/* Keyword Search input */}
          <div className="col-span-1 md:col-span-2 relative">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1">
              Keyword Audit Lookup
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search worker, document no, serial no, voucher..."
                className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-205 focus:border-indigo-400 rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold font-sans tracking-wide text-slate-800 transition focus:outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Department Selection Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1">
              Department Grid
            </label>
            <select
              className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-205 rounded-xl py-2.5 px-3 text-xs font-semibold focus:outline-none focus:border-indigo-400 text-slate-800"
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
            >
              <option value="All">All Departments</option>
              {Array.from(new Set(employeesList.map(emp => emp.department).filter(Boolean))).map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {/* Category Filter Selection */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1">
              Category Group
            </label>
            <select
              className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-205 rounded-xl py-2.5 px-3 text-xs font-semibold focus:outline-none focus:border-indigo-400 text-slate-800"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="All">All Document Categories</option>
              {Array.from(new Set(allEnterpriseRecords.map(r => r.category).filter(Boolean))).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs pt-1.5 border-t border-dashed border-slate-100">
          
          {/* Status Selection Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1">
              Approval Status
            </label>
            <select
              className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-205 rounded-xl py-2.5 px-3 text-xs font-semibold focus:outline-none focus:border-indigo-400 text-slate-800"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Approved">All Approved (Fully + Partially)</option>
              <option value="Fully Approved">Fully Approved (No Reductions)</option>
              <option value="Partially Approved">Partially Approved (Reduced Amount)</option>
              <option value="Pending">Pending</option>
              <option value="Rejected">Rejected</option>
              <option value="Queried">Queried</option>
            </select>
          </div>

          {/* Approver Selection Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1">
              Reviewing Approver
            </label>
            <select
              className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-205 rounded-xl py-2.5 px-3 text-xs font-semibold focus:outline-none focus:border-indigo-400 text-slate-800"
              value={filterApprover}
              onChange={(e) => setFilterApprover(e.target.value)}
            >
              <option value="All">All Approvers & Mentors</option>
              {Array.from(new Set([
                ...allEnterpriseRecords.map(r => r.approverName),
                ...allEnterpriseRecords.flatMap(r => r.approvalHistory?.map(h => h.approverName) || [])
              ].filter(Boolean))).map(appr => (
                <option key={appr} value={appr}>{appr}</option>
              ))}
            </select>
          </div>

          {/* Custom Date Range override picker start */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1">
              Date Range From
            </label>
            <input
              type="date"
              className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-205 focus:border-indigo-400 rounded-xl py-2.5 px-3 text-xs font-semibold focus:outline-none text-slate-800"
              value={dateRangeStart}
              onChange={(e) => setDateRangeStart(e.target.value)}
            />
          </div>

          {/* Custom Date Range override picker end */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1">
              Date Range To
            </label>
            <input
              type="date"
              className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-205 focus:border-indigo-400 rounded-xl py-2.5 px-3 text-xs font-semibold focus:outline-none text-slate-800"
              value={dateRangeEnd}
              onChange={(e) => setDateRangeEnd(e.target.value)}
            />
          </div>

        </div>

        {/* 6B. SPECIAL PARTIAL APPROVAL AUDIT FILTER ROW */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-2 border-t border-dashed border-slate-100 mt-2">
          <div>
            <label className="block text-[10px] font-bold text-[#E11D48] uppercase tracking-widest font-mono mb-1">
              Minimum Variance Reduction (₹ Amount)
            </label>
            <input
              type="number"
              placeholder="Filter by claims with deduction greater than or equal to amount (e.g. 500)..."
              className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-[#E11D48]/30 focus:border-[#E11D48] rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none text-slate-850"
              value={minDifferenceQuery}
              onChange={(e) => setMinDifferenceQuery(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#1E3A8A] uppercase tracking-widest font-mono mb-1">
              Reduction Reason Keyphrase Search
            </label>
            <input
              type="text"
              placeholder="Search specific reduction remarks/explanations (e.g. billing, policy deviation)..."
              className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-[#1E3A8A]/30 focus:border-[#1E3A8A] rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none text-slate-850"
              value={reductionReasonQuery}
              onChange={(e) => setReductionReasonQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* 7. Comprehensive enterprise records table ledger */}
      <div className="bg-white rounded-2xl border border-slate-150 shadow-sm overflow-hidden" id="enterprise-reports-table">
        <div className="bg-slate-50 px-5 py-4 border-b border-slate-150 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-0.5">
            <h3 className="font-extrabold text-[11px] uppercase font-mono tracking-wider text-slate-700">
              Consolidated enterprise records ledger list
            </h3>
            <span className="text-[10px] text-slate-450 block leading-tight">
              Filtered subset lists <strong>{finalFilteredRecords.length} records</strong> matching options out of {allEnterpriseRecords.length} total entries.
            </span>
          </div>

          {/* Dynamic real-time Export dataset button */}
          <button
            onClick={handleExportCSV}
            className="text-[10px] font-extrabold text-slate-700 bg-white hover:bg-slate-100/50 border border-slate-200 py-1.5 px-3.5 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto hover:border-slate-300 focus:ring-1 focus:ring-indigo-500"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV Grid</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[900px]">
            <thead className="bg-slate-50/70 border-b border-slate-150 font-mono text-[9px] uppercase font-black text-slate-550 select-none">
              <tr>
                <th className="p-3.5">Doc # / Srl</th>
                <th className="p-3.5">Filer Worker</th>
                <th className="p-3.5">Expense Categorization</th>
                <th className="p-3.5">Project Memo</th>
                <th className="p-3.5">Creation Date</th>
                <th className="p-3.5">Approver State</th>
                <th className="p-3.5 text-right">Raw value</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-center">Linked state</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {finalFilteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400 font-semibold italic">
                    No matching report entries detected in this selection period.
                  </td>
                </tr>
              ) : (
                finalFilteredRecords.map((r, idx) => {
                  const statusColors = {
                    Approved: "bg-emerald-50 text-emerald-700 border-emerald-100",
                    "Partially Approved": "bg-amber-50 text-amber-800 border-amber-200",
                    "Part Approved": "bg-amber-50 text-amber-800 border-amber-200",
                    Pending: "bg-amber-50 text-amber-700 border-amber-100",
                    Rejected: "bg-rose-50 text-rose-700 border-rose-100",
                    Queried: "bg-indigo-50 text-indigo-700 border-indigo-100",
                  };
                  const activeColor = statusColors[r.status as keyof typeof statusColors] || "bg-slate-50 text-slate-600 border-slate-100";

                  return (
                    <tr key={idx} className="hover:bg-slate-50/50 transition">
                      
                      {/* Document # and Serial */}
                      <td className="p-3.5 font-mono text-[10px] font-bold text-slate-900">
                        <span className="block font-black select-all" title={r.id}>{r.documentNumber}</span>
                        {r.serialNo > 0 && (
                          <span className="text-[9px] font-serif tracking-widest text-slate-400">Seq #{r.serialNo}</span>
                        )}
                      </td>

                      {/* Submitter Name */}
                      <td className="p-3.5">
                        <span className="font-bold text-slate-800 block select-all">{r.employeeName}</span>
                        <span className="text-[9px] font-mono text-slate-400 block uppercase">Filer code</span>
                      </td>

                      {/* Category & Expense Head */}
                      <td className="p-3.5">
                        <span className="font-bold text-slate-700 block">{r.category}</span>
                        <span className="text-[9px] text-slate-450 block font-mono italic max-w-[150px] truncate" title={r.expenseHead}>
                          {r.expenseHead}
                        </span>
                      </td>

                      {/* Project Name and Description */}
                      <td className="p-3.5 max-w-[200px]">
                        <span className="font-bold text-slate-700 block truncate">{r.projectName}</span>
                        <span className="text-[9px] text-slate-400 block truncate max-w-[190px]" title={r.detailsText}>
                          {r.detailsText}
                        </span>
                      </td>

                      {/* Submission Date */}
                      <td className="p-3.5 font-mono text-[10px] text-slate-500">
                        {r.createdAt ? r.createdAt.replace("T", " ").substring(0, 16) : "N/A"}
                      </td>

                      {/* Approver Name */}
                      <td className="p-3.5 text-slate-600 font-medium">
                        <span className="block truncate max-w-[140px]" title={r.approverName}>{r.approverName}</span>
                        <span className="text-[9px] font-mono block text-slate-400 uppercase">Stage: {r.stage}</span>
                      </td>

                      {/* Amount and word indicators */}
                      <td className="p-3.5 text-right font-mono font-bold text-slate-900 text-[13px]">
                        ₹{r.amount.toLocaleString("en-IN")}
                      </td>

                      {/* Visual Status badge */}
                      <td className="p-3.5 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full border text-[9px] font-extrabold uppercase font-mono ${activeColor}`}>
                          {r.status === "Partially Approved" ? "Part Approved" : r.status}
                        </span>
                      </td>

                      {/* Linked document audit tags */}
                      <td className="p-3.5">
                        <div className="flex flex-col items-center justify-center gap-1">
                          {r.linkedNo ? (
                            <span className="bg-slate-100 text-slate-650 px-2 py-0.5 rounded text-[8px] font-bold font-mono border border-slate-200 uppercase" title={`Linked to ${r.linkedType}`}>
                              🔗 {r.linkedNo}
                            </span>
                          ) : r.linkedCommissionId ? (
                            <span className="bg-indigo-50 text-indigo-750 px-2 py-0.5 rounded text-[8px] font-bold font-mono border border-indigo-100 uppercase">
                              🛡 Payout
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">Standalone</span>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}

    </div>
  );
}
