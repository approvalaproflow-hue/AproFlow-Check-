import { TravelEntry } from "../types";
import { Plus, Trash2, IndianRupee } from "lucide-react";

interface ItineraryTableProps {
  entries: TravelEntry[];
  onChange: (entries: TravelEntry[]) => void;
}

export function ItineraryTable({ entries, onChange }: ItineraryTableProps) {
  // Add a new empty row
  const addRow = () => {
    const nextDayNum = entries.length + 1;
    const todayStr = new Date().toISOString().split("T")[0];

    const newRow: TravelEntry = {
      id: "entry-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
      day: String(nextDayNum),
      date: todayStr,
      fromCity: "",
      departureTime: "09:00 AM",
      toCity: "",
      arrivalTime: "05:00 PM",
      lodgingCost: 0,
      lodgingDetails: "Hotel / Site",
      foodType: "Full Boarding",
      foodCost: 0,
      conveyanceType: "Train (Sleeper)",
      expenseAmount: 0,
      remarks: ""
    };

    onChange([...entries, newRow]);
  };

  // Delete an existing row
  const deleteRow = (index: number) => {
    const updated = entries.filter((_, idx) => idx !== index);
    // Recalculate day numbers sequentially
    const reordered = updated.map((entry, idx) => ({
      ...entry,
      day: String(idx + 1)
    }));
    onChange(reordered);
  };

  // Handle cell edit
  const handleCellEdit = (index: number, key: keyof TravelEntry, val: any) => {
    const updated = [...entries];
    // Cast and validate numbers for safety
    if (key === "lodgingCost" || key === "foodCost" || key === "expenseAmount") {
      updated[index] = {
        ...updated[index],
        [key]: Number(val) || 0
      };
    } else {
      updated[index] = {
        ...updated[index],
        [key]: val
      };
    }
    onChange(updated);
  };

  // Calculate Running Totals in UI
  const totalTravel = entries.reduce((s, e) => s + (e.expenseAmount || 0), 0);
  const totalFood = entries.reduce((s, e) => s + (e.foodCost || 0), 0);
  const totalLodging = entries.reduce((s, e) => s + (e.lodgingCost || 0), 0);
  const grandTotal = totalTravel + totalFood + totalLodging;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div id="itinerary-table-section" className="space-y-4">
      <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
        <div>
          <h4 className="text-sm font-bold text-gray-800">Dynamic Travel Itinerary Grid</h4>
          <p className="text-xs text-gray-400">Complete day-wise routes, food budgets, lodging claims, and transport costs</p>
        </div>
        <button
          type="button"
          onClick={addRow}
          className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-sm transition"
          id="btn-add-line"
        >
          <Plus className="h-4 w-4" />
          <span>Add Itinerary Row</span>
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-xs">
          <thead className="bg-[#1e293b] text-white">
            <tr>
              <th className="px-2 py-2.5 text-left font-semibold w-12">Day</th>
              <th className="px-2 py-2.5 text-left font-semibold w-28">Date</th>
              <th className="px-2 py-2.5 text-left font-semibold">From City</th>
              <th className="px-2 py-2.5 text-left font-semibold w-24">Departure</th>
              <th className="px-2 py-2.5 text-left font-semibold">To City</th>
              <th className="px-2 py-2.5 text-left font-semibold w-24">Arrival</th>
              <th className="px-2 py-2.5 text-left font-semibold w-28">Lodging Details</th>
              <th className="px-2 py-2.5 text-left font-semibold w-24">Lodging (₹)</th>
              <th className="px-2 py-2.5 text-left font-semibold w-24">Food Type</th>
              <th className="px-2 py-2.5 text-left font-semibold w-24">Food (₹)</th>
              <th className="px-2 py-2.5 text-left font-semibold w-24">Conveyance</th>
              <th className="px-2 py-2.5 text-left font-semibold w-24">Conveyance (₹)</th>
              <th className="px-2 py-2.5 text-left font-semibold">Remarks</th>
              <th className="px-2 py-2.5 text-center font-semibold w-12">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {entries.length === 0 ? (
              <tr>
                <td colSpan={14} className="px-4 py-8 text-center text-gray-400 italic">
                  No itinerary records added. Click "Add Itinerary Row" above to create travel claims lines.
                </td>
              </tr>
            ) : (
              entries.map((entry, idx) => (
                <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                  
                  {/* Row Day Indicator */}
                  <td className="px-2 py-1.5 font-bold text-center text-gray-500 bg-gray-50">
                    D{entry.day}
                  </td>

                  {/* Date Input */}
                  <td className="px-1 py-1.5">
                    <input
                      type="date"
                      value={entry.date}
                      onChange={(e) => handleCellEdit(idx, "date", e.target.value)}
                      className="w-full px-1.5 py-1 border border-gray-200 rounded focus:border-blue-500 text-[11px]"
                    />
                  </td>

                  {/* From City */}
                  <td className="px-1 py-1.5">
                    <input
                      type="text"
                      placeholder="e.g. Mumbai"
                      value={entry.fromCity}
                      onChange={(e) => handleCellEdit(idx, "fromCity", e.target.value)}
                      className="w-full px-1.5 py-1 border border-gray-200 rounded focus:border-blue-500 text-[11px]"
                    />
                  </td>

                  {/* Departure Time */}
                  <td className="px-1 py-1.5">
                    <input
                      type="text"
                      placeholder="Time (08:00 AM)"
                      value={entry.departureTime}
                      onChange={(e) => handleCellEdit(idx, "departureTime", e.target.value)}
                      className="w-full px-1.5 py-1 border border-gray-200 rounded focus:border-blue-500 text-[11px]"
                    />
                  </td>

                  {/* To City */}
                  <td className="px-1 py-1.5">
                    <input
                      type="text"
                      placeholder="e.g. New Delhi"
                      value={entry.toCity}
                      onChange={(e) => handleCellEdit(idx, "toCity", e.target.value)}
                      className="w-full px-1.5 py-1 border border-gray-200 rounded focus:border-blue-500 text-[11px]"
                    />
                  </td>

                  {/* Arrival Time */}
                  <td className="px-1 py-1.5">
                    <input
                      type="text"
                      placeholder="Time (05:00 PM)"
                      value={entry.arrivalTime}
                      onChange={(e) => handleCellEdit(idx, "arrivalTime", e.target.value)}
                      className="w-full px-1.5 py-1 border border-gray-200 rounded focus:border-blue-500 text-[11px]"
                    />
                  </td>

                  {/* Lodging details */}
                  <td className="px-1 py-1.5">
                    <input
                      type="text"
                      placeholder="Accommodation / Hotel"
                      value={entry.lodgingDetails}
                      onChange={(e) => handleCellEdit(idx, "lodgingDetails", e.target.value)}
                      className="w-full px-1.5 py-1 border border-gray-200 rounded focus:border-blue-500 text-[11px]"
                    />
                  </td>

                  {/* Lodging cost */}
                  <td className="px-1 py-1.5">
                    <input
                      type="number"
                      min="0"
                      placeholder="Cost"
                      value={entry.lodgingCost || ""}
                      onChange={(e) => handleCellEdit(idx, "lodgingCost", e.target.value)}
                      className="w-full px-1.5 py-1 border border-gray-200 rounded focus:border-blue-500 font-semibold text-[11px]"
                    />
                  </td>

                  {/* Food Type */}
                  <td className="px-1 py-1.5">
                    <input
                      type="text"
                      placeholder="Lunch / Lunch & Dinner"
                      value={entry.foodType}
                      onChange={(e) => handleCellEdit(idx, "foodType", e.target.value)}
                      className="w-full px-1.5 py-1 border border-gray-200 rounded focus:border-blue-500 text-[11px]"
                    />
                  </td>

                  {/* Food Cost */}
                  <td className="px-1 py-1.5">
                    <input
                      type="number"
                      min="0"
                      placeholder="Cost"
                      value={entry.foodCost || ""}
                      onChange={(e) => handleCellEdit(idx, "foodCost", e.target.value)}
                      className="w-full px-1.5 py-1 border border-gray-200 rounded focus:border-blue-500 font-semibold text-[11px]"
                    />
                  </td>

                  {/* Conveyance Type */}
                  <td className="px-1 py-1.5">
                    <input
                      type="text"
                      placeholder="Train, Cab, Flight"
                      value={entry.conveyanceType}
                      onChange={(e) => handleCellEdit(idx, "conveyanceType", e.target.value)}
                      className="w-full px-1.5 py-1 border border-gray-200 rounded focus:border-blue-500 text-[11px]"
                    />
                  </td>

                  {/* Conveyance cost / Expense Amount */}
                  <td className="px-1 py-1.5">
                    <input
                      type="number"
                      min="0"
                      placeholder="Amount"
                      value={entry.expenseAmount || ""}
                      onChange={(e) => handleCellEdit(idx, "expenseAmount", e.target.value)}
                      className="w-full px-1.5 py-1 border border-gray-200 rounded focus:border-blue-500 font-semibold text-[11px]"
                    />
                  </td>

                  {/* Travel Remarks */}
                  <td className="px-1 py-1.5">
                    <input
                      type="text"
                      placeholder="Optional details"
                      value={entry.remarks}
                      onChange={(e) => handleCellEdit(idx, "remarks", e.target.value)}
                      className="w-full px-1.5 py-1 border border-gray-200 rounded focus:border-blue-500 text-[11px]"
                    />
                  </td>

                  {/* Delete row handler */}
                  <td className="px-1 py-1.5 text-center">
                    <button
                      type="button"
                      onClick={() => deleteRow(idx)}
                      className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition"
                      title="Remove Row"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>

                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Realtime Live calculation summary panel */}
      {entries.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200 mt-2">
          
          <div className="bg-white p-3 rounded-md border border-slate-150 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Transport Subtotal</span>
            <span className="text-sm font-extrabold text-blue-600 mt-1">{formatCurrency(totalTravel)}</span>
          </div>

          <div className="bg-white p-3 rounded-md border border-slate-150 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Lodging Subtotal</span>
            <span className="text-sm font-extrabold text-teal-600 mt-1">{formatCurrency(totalLodging)}</span>
          </div>

          <div className="bg-white p-3 rounded-md border border-slate-150 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Meals & Incidentals</span>
            <span className="text-sm font-extrabold text-amber-600 mt-1">{formatCurrency(totalFood)}</span>
          </div>

          <div className="bg-[#1e293b] text-white p-3 rounded-md border border-slate-650 flex flex-col justify-between shadow">
            <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">Grand Request Total</span>
            <div className="flex items-center space-x-1 mt-1 justify-between">
              <span className="text-base font-black text-white">{formatCurrency(grandTotal)}</span>
              <span className="bg-emerald-500 text-[9px] text-white px-1.5 py-0.5 rounded font-black">Live</span>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
