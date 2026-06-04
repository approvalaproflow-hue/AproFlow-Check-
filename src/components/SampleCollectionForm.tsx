import React, { useState, useRef, useEffect } from "react";
import { 
  Compass, Plus, Clock, CheckCircle2, Trash2, Send, Save, ArrowLeft, 
  MapPin, Calendar, HelpCircle, Briefcase, UserCheck, ShieldCheck, Download, RefreshCw,
  File, XCircle, Upload, Search, Check
} from "lucide-react";
import { InteractiveAmount } from "./InteractiveAmount";

interface LocalConveyanceRow {
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
        className="w-full text-left px-3 py-2 rounded-lg bg-white border border-slate-350 text-slate-800 hover:bg-slate-50 focus:outline-none font-semibold text-xs transition flex items-center justify-between"
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
            className="bg-white border border-slate-350 rounded-xl shadow-2xl z-50 text-left p-2 space-y-2 animate-fade-in max-h-60 flex flex-col"
          >
            <div className="relative">
              <input
                type="text"
                placeholder="Search employee..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-2 pr-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-950 focus:border-slate-950 font-medium font-sans"
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

interface SampleCollectionFormProps {
  currentUser: any;
  requestsList: any[];
  numberingSettings: any;
  editingRequestId: string | null;
  setEditingRequestId: (id: string | null) => void;
  setCurrentPage: (page: any) => void;
  fetchRequests: () => void;
  fetchAuditLogs: () => void;
  departmentHeads: any[];
  administrators: any[];
  superAdministrators: any[];
  employeesList: any[];
  apiHeaders: any;
  numberToWords: (n: number) => string;
  getDeduplicatedRequests: (list: any[]) => any[];

  // Form Value states
  scVoucherNo: string;
  setScVoucherNo: (v: string) => void;
  scFileNo: string;
  setScFileNo: (v: string) => void;
  scKindOfExpense: string;
  setScKindOfExpense: (v: string) => void;
  scIncurredBy: string;
  setScIncurredBy: (v: string) => void;
  scRows: LocalConveyanceRow[];
  setScRows: (rows: LocalConveyanceRow[]) => void;
  isScEditing: boolean;
  setIsScEditing: (b: boolean) => void;
  resetSampleCollectionForm: () => void;
  saveSampleCollectionForm: (isDraft: boolean) => Promise<void>;

  // Selection states used for assigning Approvers
  selectedHeadId: string;
  setSelectedHeadId: (id: string) => void;
  selectedAdminId: string;
  setSelectedAdminId: (id: string) => void;
  selectedSuperAdminId: string;
  setSelectedSuperAdminId: (id: string) => void;

  // Helpers
  getNextDocumentNoPreview: (cat: string) => string;

  scAttachments: string[];
  setScAttachments: (lst: string[]) => void;
  newScAttachmentName: string;
  setNewScAttachmentName: (v: string) => void;
  isScDragging: boolean;
  setIsScDragging: (b: boolean) => void;
  processScFiles: (files: FileList) => Promise<void>;
  addScAttachment: () => void;
}

export const SampleCollectionForm: React.FC<SampleCollectionFormProps> = ({
  currentUser,
  requestsList,
  numberingSettings,
  editingRequestId,
  setEditingRequestId,
  setCurrentPage,
  fetchRequests,
  fetchAuditLogs,
  departmentHeads,
  administrators,
  superAdministrators,
  employeesList,
  apiHeaders,
  numberToWords,
  getDeduplicatedRequests,

  scVoucherNo,
  setScVoucherNo,
  scFileNo,
  setScFileNo,
  scKindOfExpense,
  setScKindOfExpense,
  scIncurredBy,
  setScIncurredBy,
  scRows,
  setScRows,
  isScEditing,
  setIsScEditing,
  resetSampleCollectionForm,
  saveSampleCollectionForm,

  selectedHeadId,
  setSelectedHeadId,
  selectedAdminId,
  setSelectedAdminId,
  selectedSuperAdminId,
  setSelectedSuperAdminId,
  getNextDocumentNoPreview,

  scAttachments,
  setScAttachments,
  newScAttachmentName,
  setNewScAttachmentName,
  isScDragging,
  setIsScDragging,
  processScFiles,
  addScAttachment
}) => {
  const [localError, setLocalError] = useState("");
  const [localSuccess, setLocalSuccess] = useState("");
  const [savingLoading, setSavingLoading] = useState(false);
  const [approverSearchQuery, setApproverSearchQuery] = useState("");

  const totalAmount = scRows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  const handleAddRowLocal = () => {
    const nextSrNo = scRows.length + 1;
    const todayStr = new Date().toLocaleDateString("en-GB");
    setScRows([
      ...scRows,
      { id: `sc-row-${Date.now()}`, serialNo: nextSrNo, date: todayStr, from: "", to: "N/A", purpose: "", amount: 0 }
    ]);
  };

  const handleUpdateRowLocal = (index: number, keyOrUpdates: keyof LocalConveyanceRow | Partial<LocalConveyanceRow>, val?: any) => {
    setScRows((prev) => {
      const updated = [...prev];
      if (updated[index]) {
        if (typeof keyOrUpdates === "string") {
          updated[index] = { ...updated[index], [keyOrUpdates]: val };
        } else {
          updated[index] = { ...updated[index], ...keyOrUpdates };
        }
      }
      return updated;
    });
  };

  const handleRemoveRowLocal = (index: number) => {
    if (scRows.length === 1) return;
    const filtered = scRows.filter((_, idx) => idx !== index).map((row, idx) => ({
      ...row,
      serialNo: idx + 1
    }));
    setScRows(filtered);
  };

  const executeSave = async (isDraft: boolean) => {
    setLocalError("");
    setLocalSuccess("");
    setSavingLoading(true);
    try {
      await saveSampleCollectionForm(isDraft);
    } catch (e: any) {
      setLocalError(e.message || "Failed to submit sample collection form.");
    } finally {
      setSavingLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in" id="sample-collection-page">
      {!isScEditing && !editingRequestId ? (
        /* CENTRALIZED RECORD LIST VIEW */
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-cyan-950 via-slate-900 to-cyan-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 rounded text-[10px] font-bold uppercase tracking-widest font-mono border border-cyan-500/30 flex items-center gap-1">
                  <Compass className="h-3 w-3" />
                  <span>Dynamic Travelling Logs</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Segment Seq Code: SC-{currentUser?.enterpriseCode || "2026"}</span>
              </div>
              <h2 className="text-xl font-black text-cyan-50">Sample Collection Portal</h2>
              <p className="text-slate-300 text-xs">
                Issue, audit, and authorize lab sample collection traveling claims with SC sequential document series.
              </p>
            </div>
            
            <div>
              <button
                onClick={() => {
                  resetSampleCollectionForm();
                  setIsScEditing(true);
                }}
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center space-x-1.5 cursor-pointer shadow-md transition"
              >
                <Plus className="h-4 w-4 stroke-[2.5px]" />
                <span>File Sample Collection Claim</span>
              </button>
            </div>
          </div>

          {/* Stat summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Total Submissions</span>
                <strong className="block text-xl font-black text-slate-800 mt-1">
                  {requestsList.filter(r => r.category === "Sample Collection" && (currentUser.role !== "employee" || r.userId === currentUser.id)).length}
                </strong>
              </div>
              <div className="bg-cyan-50 p-2.5 rounded-lg border border-cyan-100">
                <Compass className="h-5 w-5 text-cyan-650" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Pending Authorization</span>
                <strong className="block text-xl font-black text-slate-800 mt-1">
                  {requestsList.filter(r => r.category === "Sample Collection" && r.status === "Pending" && (currentUser.role !== "employee" || r.userId === currentUser.id)).length}
                </strong>
              </div>
              <div className="bg-cyan-50 p-2.5 rounded-lg border border-cyan-100">
                <Clock className="h-5 w-5 text-cyan-650 animate-pulse" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Released Claims</span>
                <strong className="block text-xl font-black text-slate-800 mt-1">
                  ₹ {getDeduplicatedRequests(requestsList)
                    .filter(r => r.category === "Sample Collection" && r.status === "Approved" && (currentUser.role !== "employee" || r.userId === currentUser.id))
                    .reduce((sum, r) => sum + r.totalBudget, 0).toFixed(2)}
                </strong>
              </div>
              <div className="bg-cyan-50 p-2.5 rounded-lg border border-cyan-100">
                <CheckCircle2 className="h-5 w-5 text-cyan-650" />
              </div>
            </div>
          </div>

          {/* Main Records List */}
          <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden mb-6">
            <div className="px-5 py-4 border-b border-gray-100 bg-slate-50 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-850 text-xs uppercase tracking-wide">Sample Collection Ledger</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Continuous sequence record of sample collection vouchers.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse font-sans text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-[#111827] uppercase tracking-wide font-mono text-left">
                    <th className="p-3 font-semibold">Voucher No</th>
                    <th className="p-3 font-semibold">Filer / Claimant</th>
                    <th className="p-3 font-semibold">Purpose</th>
                    <th className="p-3 font-semibold">Incurred By</th>
                    <th className="p-3 font-semibold text-right">Total Amount</th>
                    <th className="p-3 font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(() => {
                    const list = requestsList.filter(r => r.category === "Sample Collection" && (currentUser.role !== "employee" || r.userId === currentUser.id));
                    if (list.length === 0) {
                      return (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                            No Sample Collection claims found. Click button above to file a claim.
                          </td>
                        </tr>
                      );
                    }
                    return list.map(r => (
                      <tr key={r.id} className="hover:bg-cyan-50/20 transition-colors">
                        <td className="p-3 font-mono font-extrabold text-slate-800">
                          {r.documentNumber || r.localConveyanceDetails?.voucherNo || "Draft/" + r.id.substring(0, 7)}
                        </td>
                        <td className="p-3 text-slate-700">
                          <div>
                            <p className="font-bold">{r.employeeName}</p>
                            <p className="text-[10px] text-slate-400">{r.submissionDate}</p>
                          </div>
                        </td>
                        <td className="p-3 font-medium text-slate-800">
                          {r.localConveyanceDetails?.kindOfExpense || r.projectName}
                        </td>
                        <td className="p-3 text-slate-700">
                          {r.localConveyanceDetails?.incurredBy || "N/A"}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-slate-900">
                          ₹ {(r.localConveyanceDetails?.amount || r.totalBudget || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.status === "Approved" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                            r.status === "Rejected" ? "bg-rose-50 text-rose-700 border border-rose-100" :
                            r.status === "Draft" ? "bg-slate-100 text-slate-600 border border-slate-200" :
                            "bg-amber-50 text-amber-700 border border-amber-100"
                          }`}>
                            {r.status}
                          </span>
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
        /* EDIT OR NEW SHEETS CLAIM EDITOR VIEW */
        <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden p-6 space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  setEditingRequestId(null);
                  setIsScEditing(false);
                  resetSampleCollectionForm();
                }}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                  {editingRequestId ? "Modify Sample Collection Claim" : "New Sample Collection Traveling Bill"}
                </h3>
                <p className="text-[10px] text-slate-400 font-mono">Sequential Serial Record No: {scVoucherNo || getNextDocumentNoPreview("Sample Collection")}</p>
              </div>
            </div>

            <div className="bg-cyan-50 border border-cyan-155 text-cyan-900 px-3 py-1 rounded-xl text-xs font-mono font-bold">
              {scVoucherNo || getNextDocumentNoPreview("Sample Collection")}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">
                Kind of Expense / Purpose
              </label>
              <input
                type="text"
                placeholder="e.g. Daily Blood sample pickups / Clinical tests travel"
                className="w-full text-xs p-2.5 bg-slate-50 border border-gray-250 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500 font-medium"
                value={scKindOfExpense}
                onChange={(e) => setScKindOfExpense(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">
                Incurred By (Claimant Name)
              </label>
              <input
                type="text"
                placeholder="Traveler name"
                className="w-full text-xs p-2.5 bg-slate-50 border border-gray-250 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                value={scIncurredBy}
                onChange={(e) => setScIncurredBy(e.target.value)}
              />
            </div>
          </div>

          {/* DYNAMIC TIME DISTANCE SHEET LOGS */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase text-slate-800 font-mono tracking-widest">2. Sample collection expense sheet</h3>
              <span className="text-[10px] bg-sky-100 border border-sky-200 font-bold px-2.5 py-0.5 rounded-full text-sky-900 uppercase font-mono">Reimbursement Voyage Logs</span>
            </div>

            <div className="bg-white p-6 md:p-10 rounded-3xl border border-slate-300 shadow-xl font-sans relative" id="paper-allowance-sheet-sc">
              <div className="border border-slate-300 p-5 rounded-2xl space-y-4">
                
                {/* Header for Page 2 */}
                <div className="bg-slate-100 text-center py-2 border border-slate-400">
                  <h3 className="font-sans text-md font-extrabold text-slate-905 tracking-widest uppercase mb-0.5">
                    SAMPLE COLLECTION EXPENSE SHEET
                  </h3>
                  <p className="text-[9px] uppercase font-mono font-bold tracking-wider text-slate-500">{currentUser?.enterpriseName || "PROFLOW ENTERPRISE"}</p>
                </div>

                <div className="flex flex-col md:flex-row md:items-baseline py-2 px-1 border-b border-slate-200 space-y-1.5 md:space-y-0 md:space-x-3 text-xs">
                  <span className="font-extrabold uppercase font-mono text-slate-500 w-16 shrink-0">NAME :</span>
                  <span className="flex-1 bg-transparent py-1 font-bold italic text-slate-900 border-b border-slate-200">
                    {scIncurredBy.trim() || "[Type the claimant name in section above]"}
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
                        <th className="border border-slate-400 py-1.5 px-3 uppercase text-left">Description (Collection of 30 bottles of water)</th>
                        <th className="border border-slate-400 py-1.5 px-2 uppercase w-24">Approved by</th>
                        <th className="border border-slate-400 py-1.5 px-2 uppercase w-24">Signature</th>
                        <th className="border border-slate-400 py-1.5 px-2 uppercase w-24">Amount</th>
                        <th className="border border-slate-400 py-1.5 w-8"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {scRows.map((row, index) => (
                        <tr key={row.id} className="hover:bg-amber-50/15 transition-colors">
                          <td className="border border-slate-400 text-center py-2 font-mono text-slate-600 font-bold">
                            {row.serialNo}
                          </td>
                          
                          {/* Date */}
                          <td className="border border-slate-400 px-1 py-1">
                            <input 
                              type="text"
                              value={row.date}
                              onChange={(e) => handleUpdateRowLocal(index, "date", e.target.value)}
                              placeholder="e.g. 13/05/26"
                              className="w-full bg-transparent focus:outline-none text-center font-mono placeholder-slate-400 font-semibold text-slate-900"
                            />
                          </td>

                          {/* From */}
                          <td className="border border-slate-400 px-1.5 py-1">
                            <input 
                              type="text"
                              value={row.from}
                              onChange={(e) => handleUpdateRowLocal(index, "from", e.target.value)}
                              placeholder="e.g. office"
                              className="w-full bg-transparent focus:outline-none placeholder-slate-400 font-medium italic text-slate-900"
                            />
                          </td>

                          {/* Description (Merged To and Purpose) */}
                          <td className="border border-slate-400 px-2 py-1">
                            <input 
                              type="text"
                              value={row.purpose}
                              onChange={(e) => {
                                handleUpdateRowLocal(index, { purpose: e.target.value, to: "N/A" });
                              }}
                              placeholder="e.g. Collection of 30 bottles of water"
                              className="w-full bg-transparent focus:outline-none placeholder-slate-400 text-slate-900"
                            />
                          </td>

                          {/* Approved By: Dropdown selector */}
                          <ApprovedByCell 
                            value={row.approvedBy || ""}
                            onChange={(val) => handleUpdateRowLocal(index, "approvedBy", val)}
                            employees={employeesList}
                          />

                          {/* Signature: Completely blank as requested */}
                          <td className="border border-slate-400 px-1 py-1 text-center font-sans text-[11px] bg-slate-50/20">
                            {/* Blank signature cell */}
                          </td>

                          {/* Amount */}
                          <td className="border border-slate-400 px-1 py-1">
                            <input 
                              type="number"
                              placeholder="0"
                              value={row.amount === 0 ? "" : row.amount}
                              onChange={(e) => {
                                const numVal = Number(e.target.value) || 0;
                                handleUpdateRowLocal(index, "amount", numVal);
                              }}
                              className="w-full bg-transparent text-right font-mono font-black pr-1 focus:outline-none text-[#111827]"
                            />
                          </td>

                          {/* Remove row */}
                          <td className="border border-slate-400 text-center py-1 bg-slate-50">
                            <button 
                              type="button"
                              onClick={() => handleRemoveRowLocal(index)}
                              disabled={scRows.length === 1}
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
                        <td colSpan={4} className="border border-slate-400 text-center font-mono py-2 uppercase tracking-wide text-slate-700">
                          TOTAL
                        </td>
                        <td className="border border-slate-400 bg-slate-100"></td>
                        <td className="border border-slate-400 bg-slate-100"></td>
                        <td className="border border-slate-400 text-right pr-2 px-1 font-mono font-black text-slate-900 text-xs py-2 bg-amber-50">
                          ₹ {totalAmount.toFixed(2)}
                        </td>
                        <td className="border border-slate-400 bg-slate-100"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Mobile card view representation */}
                <div className="block md:hidden space-y-4">
                  {scRows.map((row, index) => (
                    <div key={row.id} className="bg-slate-50 p-4 rounded-xl border border-slate-300 shadow-sm space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className="text-xs font-bold text-slate-700">Activity #{row.serialNo}</span>
                        <button 
                          type="button"
                          onClick={() => handleRemoveRowLocal(index)}
                          disabled={scRows.length === 1}
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
                            onChange={(e) => handleUpdateRowLocal(index, "date", e.target.value)}
                            placeholder="e.g. 13/05/26"
                            className="w-full bg-white border border-slate-200 p-2 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-900 font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">From</label>
                          <input 
                            type="text"
                            value={row.from}
                            onChange={(e) => handleUpdateRowLocal(index, "from", e.target.value)}
                            placeholder="e.g. office"
                            className="w-full bg-white border border-slate-200 p-2 rounded-lg font-medium focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Description (Collection details)</label>
                          <input 
                            type="text"
                            value={row.purpose}
                            onChange={(e) => {
                              handleUpdateRowLocal(index, { purpose: e.target.value, to: "N/A" });
                            }}
                            placeholder="e.g. Collection of 30 bottles of water"
                            className="w-full bg-white border border-slate-200 p-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-900 font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Approved By</label>
                          <MobileApprovedBySelect 
                            value={row.approvedBy || ""}
                            onChange={(val) => handleUpdateRowLocal(index, "approvedBy", val)}
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
                              handleUpdateRowLocal(index, "amount", numVal);
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
                    onClick={handleAddRowLocal}
                    className="text-xs font-bold text-slate-800 hover:text-slate-950 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer shadow-sm"
                  >
                    <Plus className="h-3.5 w-3.5 stroke-[2.5px]" />
                    <span>Add Voyage Line Item</span>
                  </button>
                  
                  <div className="text-right">
                    <span className="text-[9px] uppercase font-bold text-amber-900/60 font-mono tracking-wider block">Sum Total:</span>
                    <span className="font-mono font-black text-xs text-amber-955 bg-amber-50 border border-amber-100 px-3 py-1 rounded-md inline-block">
                      ₹ {totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>

              </div>
            </div>
          </div>

          <div className="p-3 bg-cyan-50/50 rounded-xl border border-cyan-150">
            <p className="text-[10px] uppercase font-bold text-cyan-650 font-mono">Amount words equivalent:</p>
            <p className="text-xs text-slate-700 font-bold capitalize italic">{numberToWords(totalAmount)} Only</p>
          </div>

          {/* PROOF & SUPPORTING DOCUMENTATION ATTACHMENTS FOR SAMPLE COLLECTION */}
          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest font-mono">1.5. Proof & Sample Documentation</h4>
                <p className="text-[11px] text-slate-500 mt-1">Upload images, chain-of-custody papers, sample collection logs, bills, or PDFs as proof.</p>
              </div>
              <span className="text-[9px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">Secure ISO Storage</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {scAttachments.map((f, idx) => {
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
                        setScAttachments(scAttachments.filter((_, i) => i !== idx));
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
              id="drop-target-area-sc"
              className={`border-2 border-dashed rounded-xl p-5 text-center flex flex-col items-center justify-center cursor-pointer transition ${
                isScDragging 
                  ? "border-emerald-500 bg-emerald-50/20 text-emerald-800 scale-[1.01]" 
                  : "border-slate-200 hover:border-slate-350 bg-slate-50/50 hover:bg-slate-50 text-slate-650"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsScDragging(true);
              }}
              onDragLeave={() => setIsScDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsScDragging(false);
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  processScFiles(e.dataTransfer.files);
                }
              }}
              onClick={() => {
                const fileInput = document.getElementById("sc-attachment-file-input");
                if (fileInput) (fileInput as HTMLInputElement).click();
              }}
            >
              <input 
                type="file"
                id="sc-attachment-file-input"
                className="hidden"
                multiple
                accept="image/png, image/jpeg, image/jpg, image/webp, image/heic, image/heif, application/pdf"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    processScFiles(e.target.files);
                  }
                }}
              />
              <Upload className="h-6 w-6 text-slate-400 mb-2 animate-bounce" />
              <p className="text-xs font-bold text-slate-700">
                Drop files here or <span className="text-emerald-700 underline decoration-2">select files</span>
              </p>
              <p className="text-[10px] text-slate-450 font-mono mt-1">Supports PDF, PNG, JPEG, WEBP, HEIC (Max 15MB)</p>
            </div>

            {/* Optional Link / Name Input */}
            <div className="flex items-center space-x-2 pt-1">
              <input
                type="text"
                placeholder="Or type quote URL/doc name (e.g. COC_Paper.pdf)..."
                value={newScAttachmentName}
                onChange={(e) => setNewScAttachmentName(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-mono w-full focus:ring-1 focus:ring-slate-900 focus:border-slate-950"
                onClick={(e) => e.stopPropagation()}
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  addScAttachment();
                }}
                className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 shadow-sm cursor-pointer"
              >
                Add Link
              </button>
            </div>
          </div>

          {/* SIGNING VERIFICATION MATRIX */}
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-150 shadow-md max-w-3xl mx-auto space-y-4">
            <div>
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest font-mono">3. Routing & Authorization Hierarchy</h4>
              <p className="text-[11px] text-slate-500 mt-1">Select the regulatory administrator or supervisor who will authenticate and sign off this Sample Collection ledger.</p>
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

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-150">
            <button
              onClick={() => executeSave(true)}
              disabled={savingLoading}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-2.5 px-4 rounded-xl flex items-center space-x-1.5 cursor-pointer border border-slate-200 transition"
            >
              <Save className="h-4 w-4" />
              <span>Save Draft Ledger</span>
            </button>

            <button
              onClick={() => executeSave(false)}
              disabled={savingLoading}
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-extrabold py-2.5 px-5 rounded-xl flex items-center space-x-1.5 cursor-pointer shadow-md transition"
            >
              {savingLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Validating data...</span>
                </>
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
  );
};
