import React, { useState, useEffect } from "react";
import { CreditCard, User } from "../types.ts";
import { Plus, Trash2, Eye, HelpCircle, Check, Search, AlertCircle, RefreshCw } from "lucide-react";
import { customFetch } from "../utils/customFetch";

const fetch = customFetch;

interface CreditCardMasterProps {
  apiHeaders: any;
  auditLogs: any[];
  setAuditLogs: React.Dispatch<React.SetStateAction<any[]>>;
  currentUser: User;
}

export const CreditCardMaster: React.FC<CreditCardMasterProps> = ({
  apiHeaders,
  currentUser
}) => {
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [cardName, setCardName] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState<"Active" | "Inactive">("Active");
  const [editingCardId, setEditingCardId] = useState<string | null>(null);

  // Filter
  const [searchQuery, setSearchQuery] = useState("");

  const fetchCards = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch("/api/credit-cards", { headers: apiHeaders });
      const data = await resp.json();
      if (resp.ok && data.success) {
        setCards(data.creditCards || []);
      } else {
        setError(data.error || "Failed to load corporate credit cards.");
      }
    } catch (err) {
      setError("Failed to communicate with API server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!cardName.trim() || !cardholderName.trim()) {
      setError("Card Name and Cardholder Name are mandatory.");
      return;
    }

    setLoading(true);
    try {
      const url = editingCardId ? `/api/credit-cards/${editingCardId}` : "/api/credit-cards";
      const method = editingCardId ? "PUT" : "POST";
      const bodyPayload = {
        cardName,
        cardholderName,
        department,
        status
      };

      const resp = await fetch(url, {
        method,
        headers: {
          ...apiHeaders,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(bodyPayload)
      });

      const data = await resp.json();
      if (resp.ok && data.success) {
        setSuccess(editingCardId ? "Corporate credit card updated successfully." : "Corporate credit card registered successfully.");
        // Clear form
        setCardName("");
        setCardholderName("");
        setDepartment("");
        setStatus("Active");
        setEditingCardId(null);
        fetchCards();
      } else {
        setError(data.error || "Failed to save credit card details.");
      }
    } catch (err) {
      setError("Network error. Failed to save credit card.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (card: CreditCard) => {
    setEditingCardId(card.id);
    setCardName(card.cardName);
    setCardholderName(card.cardholderName || "");
    setDepartment(card.department || "");
    setStatus(card.status || "Active");
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this credit card? This action is irreversible.")) {
      return;
    }
    setError(null);
    setSuccess(null);
    try {
      const resp = await fetch(`/api/credit-cards/${id}`, {
        method: "DELETE",
        headers: apiHeaders
      });
      const data = await resp.json();
      if (resp.ok && data.success) {
        setSuccess("Credit card removed successfully.");
        fetchCards();
      } else {
        setError(data.error || "Failed to delete credit card.");
      }
    } catch (err) {
      setError("Network communication error.");
    }
  };

  const cancelEdit = () => {
    setEditingCardId(null);
    setCardName("");
    setCardholderName("");
    setDepartment("");
    setStatus("Active");
  };

  const filteredCards = cards.filter(card => {
    const term = searchQuery.toLowerCase();
    return (
      card.cardName.toLowerCase().includes(term) ||
      (card.cardholderName && card.cardholderName.toLowerCase().includes(term)) ||
      (card.department && card.department.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6" id="credit-card-master-board">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            Company Corporate Credit Cards Master
          </h2>
          <p className="text-xs text-slate-400">
            Register and manage corporate or office credit cards for tracking straight-to-company transactions.
          </p>
        </div>
        <button
          onClick={fetchCards}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 text-xs font-semibold self-start"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl flex items-center space-x-2 text-xs text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center space-x-2 text-xs text-emerald-300">
          <Check className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Registration Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5" id="cc-add-card-form">
          <h3 className="text-sm font-semibold text-slate-200 mb-4 pb-2 border-b border-slate-800">
            {editingCardId ? "Modify Registered Card" : "Register Corporate Card"}
          </h3>
          <form onSubmit={handleCreateOrUpdate} className="space-y-4">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Card Name / Bank <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                placeholder="e.g. ICICI Corporate Visa"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Cardholder Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={cardholderName}
                onChange={(e) => setCardholderName(e.target.value)}
                placeholder="e.g. Rajesh Kumar"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Department / Unit (Optional)
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Marketing"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Card Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "Active" | "Inactive")}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Active">Active / Ready</option>
                <option value="Inactive">Inactive / Expired</option>
              </select>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 text-xs py-2.5 px-4 rounded-xl font-semibold text-center bg-indigo-600 hover:bg-indigo-500 text-white transition disabled:opacity-50"
              >
                {editingCardId ? "Save Modifications" : "Register Card"}
              </button>
              {editingCardId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-3 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-950 text-xs text-slate-400 font-semibold"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Card Master List */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5" id="cc-registered-cards-list">
          <div className="flex items-center justify-between mb-4 gap-4">
            <h3 className="text-sm font-semibold text-slate-200">
              Registered Corporate Cards ({filteredCards.length})
            </h3>
            <div className="relative w-48">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search cards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-10 text-xs text-slate-500">
              Fetching registered corporate cards...
            </div>
          ) : filteredCards.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl text-xs text-slate-500">
              No registered corporate credit cards found match query.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                    <th className="py-2 pb-3 px-2">Card Name / Bank</th>
                    <th className="py-2 pb-3 px-2">Cardholder</th>
                    <th className="py-2 pb-3 px-2">Dept</th>
                    <th className="py-2 pb-3 px-2 text-center">Status</th>
                    <th className="py-2 pb-3 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-xs text-slate-300">
                  {filteredCards.map((card) => (
                    <tr key={card.id}>
                      <td className="py-3 px-2 font-medium text-slate-200">
                        {card.cardName}
                      </td>
                      <td className="py-3 px-2">{card.cardholderName}</td>
                      <td className="py-3 px-2 text-slate-400">{card.department || "-"}</td>
                      <td className="py-3 px-2 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${card.status === "Active" ? "bg-emerald-900/40 text-emerald-300" : "bg-red-900/40 text-red-300"}`}>
                          {card.status}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEdit(card)}
                            className="p-1 rounded text-indigo-400 hover:text-white hover:bg-slate-800 text-xs font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(card.id)}
                            className="p-1 rounded text-red-400 hover:text-white hover:bg-slate-800 text-xs font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
