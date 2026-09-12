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
        <div className="rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl lg:col-span-1 overflow-hidden">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 border-b-2 border-slate-200 dark:border-slate-800 px-4 py-3">
            <div className="flex items-center gap-2">
              <Search size={16} className="text-slate-500 dark:text-slate-400" />
              <input 
                value={q} 
                onChange={(e) => setQ(e.target.value)} 
                placeholder="Search item…" 
                className="w-full bg-transparent border-0 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:ring-0 focus:outline-none" 
              />
            </div>
          </div>
          <div className="max-h-[520px] overflow-y-auto">
            {filteredItems.map((i) => (
              <button
                key={i.id}
                onClick={() => setSelected(i.id)}
                className={`block w-full border-b border-slate-100 dark:border-slate-800 px-4 py-3 text-left text-sm transition-all duration-150 last:border-0 ${
                  selected === i.id 
                    ? "bg-university-50 dark:bg-university-950/40 border-l-4 border-l-university-600 dark:border-l-university-400 font-bold text-university-900 dark:text-university-200" 
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 font-medium"
                }`}
              >
                <p className="mb-1">{i.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{i.code} · {i.qtyOnHand} {i.unit} on hand</p>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl lg:col-span-2 overflow-hidden">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 border-b-2 border-slate-200 dark:border-slate-800 px-6 py-4">
            {card ? (
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{card.item.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{card.item.code}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-extrabold text-university-700 dark:text-university-400">{card.item.qtyOnHand}</p>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{card.item.unit} on Hand</p>
                </div>
              </div>
            ) : (
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Stock Card Details</h3>
            )}
          </div>
          
          <div className="p-6">
            {loading && <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">Loading…</p>}
            {!loading && card ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b-2 border-slate-200 dark:border-slate-800 text-xs uppercase text-slate-600 dark:text-slate-400 font-bold">
                      <th className="pb-3 pr-4">Date</th>
                      <th className="pb-3 pr-4">Type</th>
                      <th className="pb-3 pr-4">Reference</th>
                      <th className="pb-3 text-right pr-4">Qty</th>
                      <th className="pb-3 text-right pr-4">Cost Impact</th>
                      <th className="pb-3 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {card.entries.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-12 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <div className="rounded-2xl bg-slate-100 dark:bg-slate-800 p-4">
                              <Search size={32} className="text-slate-400 dark:text-slate-500" />
                            </div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No transactions recorded yet.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                    {card.entries.map((t) => (
                      <tr key={t.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-150 last:border-0">
                        <td className="py-3 pr-4 text-slate-600 dark:text-slate-300 font-medium">{new Date(t.createdAt).toLocaleDateString()}</td>
                        <td className="py-3 pr-4">
                          <Badge tone={Number(t.qty) > 0 ? "green" : "amber"}>{t.type}</Badge>
                        </td>
                        <td className="py-3 pr-4 text-slate-600 dark:text-slate-300 font-medium">{t.reference}</td>
                        <td className={`py-3 text-right font-bold pr-4 ${Number(t.qty) < 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                          {Number(t.qty) > 0 ? `+${t.qty}` : t.qty}
                        </td>
                        <td className="py-3 pr-4 text-right text-slate-600 dark:text-slate-300 font-medium">
                          {t.costAmount !== null ? `ETB ${Number(t.costAmount).toLocaleString()}` : "—"}
                        </td>
                        <td className="py-3 text-right font-bold text-slate-900 dark:text-white">{t.balance}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              !loading && (
                <div className="py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="rounded-2xl bg-slate-100 dark:bg-slate-800 p-4">
                      <Search size={32} className="text-slate-400 dark:text-slate-500" />
                    </div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Select an item to view its stock card.</p>
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
