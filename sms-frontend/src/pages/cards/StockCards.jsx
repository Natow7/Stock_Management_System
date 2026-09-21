import React, { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useApp } from "../../context/AppContext.jsx";
import api from "../../lib/api.js";
import { PageHeader } from "../../components/ui/PageHeader.jsx";
import Badge from "../../components/ui/Badge.jsx";

export default function StockCards() {
  const { items, showToast } = useApp();
  const [selected, setSelected] = useState("");
  const [q, setQ] = useState("");
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (items.length > 0 && !selected) setSelected(items[0].id);
  }, [items, selected]);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    api.stockCards
      .get(selected)
      .then(setCard)
      .catch((err) => showToast(err.message, "warn"))
      .finally(() => setLoading(false));
  }, [selected]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredItems = useMemo(
    () => items.filter((i) => i.name.toLowerCase().includes(q.toLowerCase()) || i.code.toLowerCase().includes(q.toLowerCase())),
    [items, q]
  );

  return (
    <div>
      <PageHeader title="Stock Record Cards" description="Auto-maintained running balance and full transaction history per material, with FIFO cost impact." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm lg:col-span-1 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100/80 dark:from-slate-800 dark:to-slate-850 px-5 py-4 border-b border-blue-200/50 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="flex-1 flex items-center gap-2 bg-white dark:bg-slate-800/50 rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-700">
                <Search size={16} className="text-slate-400 dark:text-slate-500 flex-shrink-0" />
                <input 
                  value={q} 
                  onChange={(e) => setQ(e.target.value)} 
                  placeholder="Search materials…" 
                  className="w-full bg-transparent border-0 text-sm font-medium text-slate-700 dark:text-slate-300 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-0 focus:outline-none" 
                />
              </div>
            </div>
          </div>
          <div className="max-h-[560px] overflow-y-auto">
            {filteredItems.length === 0 && (
              <div className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 mb-3">
                  <Search size={28} className="text-slate-400 dark:text-slate-500" />
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                  {q ? "No materials found" : "No materials available"}
                </p>
              </div>
            )}
            {filteredItems.map((i) => (
              <button
                key={i.id}
                onClick={() => setSelected(i.id)}
                className={`group relative block w-full border-b border-slate-100 dark:border-slate-800 px-5 py-4 text-left transition-all duration-200 last:border-0 ${
                  selected === i.id 
                    ? "bg-slate-50/70 dark:bg-slate-800/30" 
                    : "hover:bg-slate-50/50 dark:hover:bg-slate-800/20"
                }`}
              >
                {selected === i.id && (
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-university-600 dark:bg-university-500"></div>
                )}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold mb-1.5 truncate ${
                      selected === i.id 
                        ? "text-slate-900 dark:text-white" 
                        : "text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white"
                    }`}>
                      {i.name}
                    </p>
                    <div className={`flex items-center gap-2 text-xs ${
                      selected === i.id 
                        ? "text-slate-600 dark:text-slate-400" 
                        : "text-slate-500 dark:text-slate-500"
                    }`}>
                      <span className="font-medium">{i.code}</span>
                      <span className="text-slate-400 dark:text-slate-600">•</span>
                      <span className={`font-semibold ${selected === i.id ? "text-slate-700 dark:text-slate-300" : "text-slate-600 dark:text-slate-400"}`}>
                        {i.qtyOnHand} {i.unit}
                      </span>
                    </div>
                  </div>
                  {selected === i.id && (
                    <div className="flex-shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-university-600 dark:bg-university-500"></div>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm lg:col-span-2 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100/80 dark:from-slate-800 dark:to-slate-850 px-6 py-5 border-b border-blue-200/50 dark:border-slate-700">
            {card ? (
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1 truncate">{card.item.name}</h3>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 truncate">{card.item.code}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="inline-flex flex-col items-end bg-white dark:bg-slate-800/50 rounded-xl px-4 py-2.5 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <p className="text-3xl font-extrabold text-university-700 dark:text-university-400 leading-none mb-1">{card.item.qtyOnHand}</p>
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">{card.item.unit} on Hand</p>
                  </div>
                </div>
              </div>
            ) : (
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Stock Card Details</h3>
            )}
          </div>
          
          <div className="p-6 bg-slate-50/50 dark:bg-slate-900/50">
            {loading && (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-university-100 dark:bg-university-900/30 mb-3 animate-pulse">
                  <Search size={28} className="text-university-600 dark:text-university-400" />
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Loading transactions…</p>
              </div>
            )}
            {!loading && card ? (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-800 dark:to-slate-850 border-b border-slate-200 dark:border-slate-700">
                        <th className="py-3.5 px-4 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Date</th>
                        <th className="py-3.5 px-4 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Type</th>
                        <th className="py-3.5 px-4 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Reference</th>
                        <th className="py-3.5 px-4 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-right">Qty</th>
                        <th className="py-3.5 px-4 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-right">Cost Impact</th>
                        <th className="py-3.5 px-4 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {card.entries.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-16 text-center">
                            <div className="flex flex-col items-center gap-3">
                              <div className="rounded-2xl bg-slate-100 dark:bg-slate-800 p-5">
                                <Search size={36} className="text-slate-400 dark:text-slate-500" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">No transactions recorded</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Stock movements will appear here when recorded</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                      {card.entries.map((t, index) => (
                        <tr key={t.id} className={`border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-150 ${index === card.entries.length - 1 ? 'border-0' : ''}`}>
                          <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-semibold">{new Date(t.createdAt).toLocaleDateString()}</td>
                          <td className="py-3.5 px-4">
                            <Badge tone={Number(t.qty) > 0 ? "green" : "amber"}>{t.type}</Badge>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-medium">{t.reference}</td>
                          <td className={`py-3.5 px-4 text-right font-bold tabular-nums ${Number(t.qty) < 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                            {Number(t.qty) > 0 ? `+${t.qty}` : t.qty}
                          </td>
                          <td className="py-3.5 px-4 text-right text-slate-600 dark:text-slate-300 font-medium tabular-nums">
                            {t.costAmount !== null ? `ETB ${Number(t.costAmount).toLocaleString()}` : "—"}
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-white tabular-nums">{t.balance}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              !loading && (
                <div className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="rounded-2xl bg-slate-100 dark:bg-slate-800 p-5">
                      <Search size={36} className="text-slate-400 dark:text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Select a material to view its card</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Choose a material from the list to see transaction history</p>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
