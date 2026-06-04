import { useState } from "react";
import { 
  TrendingUp, 
  IndianRupee, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle 
} from "lucide-react";
import { InteractiveAmount } from "./InteractiveAmount";

interface AnalyticsProps {
  analyticsData: {
    summary: {
      totalRequests: number;
      pendingApprovals: number;
      approvedCount: number;
      draftCount: number;
      revisionCount: number;
      approvedExpenseTotal: number;
      pendingExpenseTotal: number;
    };
    departmentWise: Array<{ name: string; amount: number }>;
    employeeExpenses: Array<{ name: string; code: string; total: number }>;
    monthlySpending: Array<{ month: string; total: number }>;
    categories: Array<{ name: string; value: number }>;
  };
}

export function AdminAnalytics({ analyticsData }: AnalyticsProps) {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [hoveredSlice, setHoveredSlice] = useState<number | null>(null);

  const { summary, departmentWise, employeeExpenses, monthlySpending, categories } = analyticsData;

  // Formatting for currency (INR)
  const formatINR = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  // Helper maximums for scaling SVG charts
  const maxDeptAmount = departmentWise.length > 0 
    ? Math.max(...departmentWise.map(d => d.amount), 1000) 
    : 1000;

  const maxMonthTotal = monthlySpending.length > 0 
    ? Math.max(...monthlySpending.map(m => m.total), 1000) 
    : 1000;

  // Donut chart calculations
  const totalCategorySpend = categories.reduce((sum, c) => sum + c.value, 0) || 1;
  let cumulativePercent = 0;

  return (
    <div id="analytics-panel" className="space-y-6">
      
      {/* 1. Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Approved Expenses */}
        <div id="card-approved-total" className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <IndianRupee className="h-6 w-6" id="icon-rupee" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium tracking-tight">TOTAL DISBURSED (₹)</p>
            <InteractiveAmount amount={summary.approvedExpenseTotal} className="text-xl font-bold text-gray-900 mt-0.5 block" />
            <p className="text-xs text-emerald-600 font-medium flex items-center mt-1">
              <span className="bg-emerald-100 px-1.5 py-0.5 rounded mr-1">✓ Verified</span>
              Approved Claims
            </p>
          </div>
        </div>

        {/* Pending Approvals Expense */}
        <div id="card-pending-total" className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Clock className="h-6 w-6" id="icon-clock" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium tracking-tight">IN QUEUE TO APPROVE</p>
            <InteractiveAmount amount={summary.pendingExpenseTotal} className="text-xl font-bold text-gray-900 mt-0.5 block" />
            <p className="text-xs text-blue-600 font-medium flex items-center mt-1">
              <span className="bg-blue-100 px-1.5 py-0.5 rounded mr-1">{summary.pendingApprovals} Forms</span>
              Awaiting Super Admin
            </p>
          </div>
        </div>

        {/* Request Success Rate */}
        <div id="card-success-rate" className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <FileText className="h-6 w-6" id="icon-filetext" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium tracking-tight">TOTAL DIGITAL FORMS</p>
            <h3 className="text-xl font-bold text-gray-900 mt-0.5">{summary.totalRequests} Filed</h3>
            <p className="text-xs text-indigo-600 font-medium flex items-center mt-1">
              <span className="bg-indigo-100 px-1.5 py-0.5 rounded mr-1">{summary.approvedCount} Approved</span>
              {summary.revisionCount} Under Revision
            </p>
          </div>
        </div>

        {/* Audit status metrics */}
        <div id="card-completion-rate" className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <TrendingUp className="h-6 w-6" id="icon-trend" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium tracking-tight font-sans">APPROVAL SUCCESS</p>
            <h3 className="text-xl font-bold text-gray-900 mt-0.5">
              {summary.totalRequests > 0 
                ? `${Math.round(((summary.approvedCount) / (summary.totalRequests - summary.draftCount || 1)) * 100)}%`
                : "100%"
              }
            </h3>
            <p className="text-xs text-purple-600 font-medium flex items-center mt-1">
              <span className="bg-purple-100 px-1.5 py-0.5 rounded mr-1">Audit Trail</span>
              Active logs monitored
            </p>
          </div>
        </div>

      </div>

      {/* 2. Interactive SVG Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Chart A: Department Spending (Bar Chart) */}
        <div id="block-chart-dept" className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm col-span-2">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="text-sm font-bold text-gray-800">Approved Cost by Department</h4>
              <p className="text-xs text-gray-400">Total verified INR payments grouped by business divisions</p>
            </div>
            <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full uppercase tracking-wider font-semibold">Live Feed</span>
          </div>

          {departmentWise.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-xs text-gray-400">
              No approved claims to display chart data.
            </div>
          ) : (
            <div className="relative">
              {/* SVG Stacked Bar Grid */}
              <svg className="w-full h-56" viewBox="0 0 500 220" preserveAspectRatio="none">
                {/* Horizontal reference lines */}
                <line x1="40" y1="30" x2="480" y2="30" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="40" y1="80" x2="480" y2="80" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="40" y1="130" x2="480" y2="130" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="40" y1="180" x2="480" y2="180" stroke="#e2e8f0" strokeWidth="1" />

                {/* Y-Axis scale label markers */}
                <text x="35" y="34" className="text-[9px] fill-gray-400 font-mono" textAnchor="end">{formatINR(maxDeptAmount)}</text>
                <text x="35" y="109" className="text-[9px] fill-gray-400 font-mono" textAnchor="end">{formatINR(maxDeptAmount / 2)}</text>
                <text x="35" y="184" className="text-[9px] fill-gray-400 font-mono" textAnchor="end">₹0</text>

                {/* Draw Columns */}
                {departmentWise.map((dept, idx) => {
                  const barCount = departmentWise.length;
                  const colWidth = 40;
                  const spacing = (440 - (colWidth * barCount)) / (barCount + 1);
                  const barX = 40 + spacing + (idx * (colWidth + spacing));
                  
                  // Height ratio scaling
                  const heightRatio = dept.amount / maxDeptAmount;
                  const barHeight = Math.max(heightRatio * 150, 6); // visual floor
                  const barY = 180 - barHeight;

                  const isHovered = hoveredBar === idx;

                  return (
                    <g key={idx} onMouseEnter={() => setHoveredBar(idx)} onMouseLeave={() => setHoveredBar(null)}>
                      {/* Bar Fill */}
                      <rect
                        x={barX}
                        y={barY}
                        width={colWidth}
                        height={barHeight}
                        rx="4"
                        fill={isHovered ? "#2563eb" : "#3b82f6"}
                        className="transition-all duration-300 cursor-pointer"
                      />
                      {/* Interactive shine cap */}
                      <rect
                        x={barX}
                        y={barY}
                        width={colWidth}
                        height="4"
                        rx="1"
                        fill="#93c5fd"
                        opacity={isHovered ? "0.9" : "0.5"}
                      />
                      {/* Text value on top of bar on hover */}
                      {isHovered && (
                        <g>
                          <rect x={barX - 15} y={barY - 22} width={colWidth + 30} height={16} rx="4" fill="#1e293b" />
                          <text x={barX + colWidth / 2} y={barY - 11} className="text-[8px] font-sans font-bold fill-white" textAnchor="middle">
                            {formatINR(dept.amount)}
                          </text>
                        </g>
                      )}
                      
                      {/* X Axis Labels */}
                      <text x={barX + colWidth / 2} y="196" className="text-[9px] fill-gray-500 font-medium" textAnchor="middle">
                        {dept.name.length > 9 ? `${dept.name.substr(0, 8)}.` : dept.name}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          )}
        </div>

        {/* Chart B: Spending Category Allocation (Donut Chart) */}
        <div id="block-chart-ratio" className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <h4 className="text-sm font-bold text-gray-800 mb-0.5">Expense Types Proportion</h4>
          <p className="text-xs text-gray-400 mb-4">Ratio allocation of claims types</p>

          {totalCategorySpend <= 1 ? (
            <div className="h-48 flex items-center justify-center text-xs text-gray-400">
              No category allocations to display.
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 relative">
              {/* Inline dynamic Donut SVG */}
              <svg className="w-36 h-36" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#f1f5f9" strokeWidth="8" />
                {categories.map((cat, idx) => {
                  const percentage = cat.value / totalCategorySpend;
                  const strokeLength = percentage * 2 * Math.PI * 38;
                  const offset = (1 - cumulativePercent) * 2 * Math.PI * 38;
                  cumulativePercent += percentage;

                  // Dynamic slice colors
                  const colors = ["#2563eb", "#10b981", "#f59e0b"];
                  const strokeColor = colors[idx % colors.length];
                  const isHovered = hoveredSlice === idx;

                  return (
                    <circle
                      key={idx}
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke={strokeColor}
                      strokeWidth={isHovered ? "11" : "8"}
                      strokeDasharray={`${strokeLength} 240`}
                      strokeDashoffset={offset}
                      transform="rotate(-90 50 50)"
                      className="transition-all duration-300 cursor-pointer"
                      onMouseEnter={() => setHoveredSlice(idx)}
                      onMouseLeave={() => setHoveredSlice(null)}
                    />
                  );
                })}
                {/* Centered Total Label */}
                <g>
                  <text x="50" y="47" className="text-[8px] font-sans fill-gray-400 font-medium" textAnchor="middle">
                    APPROVED
                  </text>
                  <text x="50" y="58" className="text-[9px] font-bold fill-gray-800 font-sans" textAnchor="middle">
                    {formatINR(totalCategorySpend)}
                  </text>
                </g>
              </svg>

              {/* Tooltip or status labels under donut */}
              <div className="mt-4 flex flex-wrap justify-between w-full text-[10px] text-gray-600 gap-1 px-2">
                {categories.map((cat, idx) => {
                  const colors = ["bg-blue-600", "bg-emerald-500", "bg-amber-500"];
                  const pct = Math.round((cat.value / totalCategorySpend) * 100);
                  return (
                    <div 
                      key={idx} 
                      className={`flex items-center space-x-1.5 px-1 rounded transition-colors ${hoveredSlice === idx ? "bg-slate-50 font-bold" : ""}`}
                    >
                      <span className={`h-2.5 w-2.5 rounded-full ${colors[idx % colors.length]}`} />
                      <span className="truncate max-w-[65px]">{cat.name.split(" ")[0]}</span>
                      <span className="text-gray-400">({pct}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* 3. Monthly Spend Line Graph & Top Spenders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Monthly Expense Trend */}
        <div id="block-monthly-spend" className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm col-span-2">
          <h4 className="text-sm font-bold text-gray-800 mb-1">Monthly Reimbursement Flow</h4>
          <p className="text-xs text-gray-400 mb-4">Historical disbursement timeline to monitor trends</p>

          {monthlySpending.length === 0 ? (
            <div className="h-44 flex items-center justify-center text-xs text-gray-400">
              No historical trend logs discovered in the system yet.
            </div>
          ) : (
            <div>
              <svg className="w-full h-44" viewBox="0 0 500 160" preserveAspectRatio="none">
                {/* Horizontal reference lines */}
                <line x1="40" y1="20" x2="480" y2="20" stroke="#f8fafc" strokeWidth="1" />
                <line x1="40" y1="70" x2="480" y2="70" stroke="#f8fafc" strokeWidth="1" />
                <line x1="40" y1="120" x2="480" y2="120" stroke="#e2e8f0" strokeWidth="1" />

                {/* Monthly Points Line */}
                {(() => {
                  const maxIdx = monthlySpending.length - 1;
                  const points = monthlySpending.map((m, idx) => {
                    const x = 40 + (maxIdx > 0 ? (idx / maxIdx) * 410 : 205);
                    const y = 120 - (maxMonthTotal > 0 ? (m.total / maxMonthTotal) * 90 : 0);
                    return { x, y, label: m.month, total: m.total };
                  });

                  // Generate SVG Path
                  let pathD = "";
                  let fillPathD = "";
                  
                  if (points.length > 0) {
                    pathD = `M ${points[0].x} ${points[0].y}`;
                    fillPathD = `M ${points[0].x} 120 L ${points[0].x} ${points[0].y}`;
                    
                    for (let i = 1; i < points.length; i++) {
                      pathD += ` L ${points[i].x} ${points[i].y}`;
                      fillPathD += ` L ${points[i].x} ${points[i].y}`;
                    }
                    
                    fillPathD += ` L ${points[points.length - 1].x} 120 Z`;
                  }

                  return (
                    <g>
                      {/* Area Under Curve Fill */}
                      {points.length > 0 && (
                        <path d={fillPathD} fill="url(#blue-gradient)" opacity="0.15" />
                      )}
                      
                      {/* Gradient Definitions */}
                      <defs>
                        <linearGradient id="blue-gradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                        </linearGradient>
                      </defs>

                      {/* Line */}
                      {points.length > 0 && (
                        <path d={pathD} fill="none" stroke="#2563eb" strokeWidth="2.5" />
                      )}

                      {/* Nodes */}
                      {points.map((p, pIdx) => (
                        <g key={pIdx}>
                          <circle cx={p.x} cy={p.y} r="4" fill="#ffffff" stroke="#2563eb" strokeWidth="2" className="cursor-pointer" />
                          {/* Tooltip on Top */}
                          <text x={p.x} y={p.y - 8} className="text-[8px] font-sans font-bold fill-indigo-900" textAnchor="middle">
                            {formatINR(p.total)}
                          </text>
                          {/* X text labels */}
                          <text x={p.x} y="136" className="text-[8px] fill-gray-500 font-bold" textAnchor="middle">
                            {p.label}
                          </text>
                        </g>
                      ))}
                    </g>
                  );
                })()}
              </svg>
            </div>
          )}
        </div>

        {/* Top Claims Spenders */}
        <div id="block-spenders" className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-gray-800 mb-0.5">Top Claim Submissions</h4>
            <p className="text-xs text-gray-400 mb-4">Max cumulative validated expenses by workers</p>

            <div className="space-y-3.5">
              {employeeExpenses.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No approved employee expenditures recorded.</p>
              ) : (
                employeeExpenses.map((emp, eIdx) => {
                  const maxSpenderTotal = employeeExpenses[0]?.total || 1000;
                  const barPercent = Math.max((emp.total / maxSpenderTotal) * 100, 5);

                  // Unique colors for visual hierarchy
                  const barColors = ["bg-blue-600", "bg-indigo-500", "bg-purple-500", "bg-slate-400"];
                  const activeColor = barColors[Math.min(eIdx, barColors.length - 1)];

                  return (
                    <div id={`spender-item-${eIdx}`} key={eIdx} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-gray-800 truncate select-all">{emp.name}</span>
                        <span className="font-mono text-gray-400 font-medium">{emp.code}</span>
                      </div>
                      
                      {/* Metric bar */}
                      <div className="relative w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`absolute top-0 left-0 h-full rounded-full ${activeColor}`} 
                          style={{ width: `${barPercent}%` }} 
                        />
                      </div>

                      <div className="flex justify-end">
                        <InteractiveAmount amount={emp.total} className="text-[10px] font-bold text-gray-700" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-50 flex items-center space-x-1 justify-center text-[10px] text-gray-400">
            <CheckCircle className="h-3 w-3 text-emerald-500" />
            <span>Values verify against current audit ledger db</span>
          </div>
        </div>

      </div>

    </div>
  );
}
