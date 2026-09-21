import React, { useEffect, useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { useApp } from "../../context/AppContext.jsx";
import api from "../../lib/api.js";
import { PageHeader, Button, Field, inputCls } from "../../components/ui/PageHeader.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Badge from "../../components/ui/Badge.jsx";

export default function BinCards() {
  const { binCards, items, stores, transferBetweenBins, showToast, currentUser } = useApp();
  const [selected, setSelected] = useState("");
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ storeId: "", itemId: "", fromBin: "", toBin: "", qty: 1 });

  const canTransfer = ["Store Head", "Stock Clerk", "Administrator"].includes(currentUser?.role);

  useEffect(() => {
    if (binCards.length > 0 && !selected) setSelected(binCards[0].id);
  }, [binCards, selected]);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    api.binCards
      .entries(selected)
      .then(setEntries)
      .catch((err) => showToast(err.message, "warn"))
      .finally(() => setLoading(false));
  }, [selected]); // eslint-disable-line react-hooks/exhaustive-deps

  const card = binCards.find((b) => b.id === selected);
  const balance = entries.length > 0 ? entries[0].balance : 0;

  async function submitTransfer(e) {
    e.preventDefault();
    setSaving(true);
    const { ok } = await transferBetweenBins({ ...form, qty: Number(form.qty) });
    setSaving(false);
    if (ok) {
      setForm({ storeId: "", itemId: "", fromBin: "", toBin: "", qty: 1 });
      setOpen(false);
      if (selected) api.binCards.entries(selected).then(setEntries).catch(() => {});
    }
  }

  return (
    <div>
      <PageHeader
        title="Bin Cards"
        description="A bin card is generated automatically for each active storage bin, capturing every inbound/outbound movement and location balance."
        action={
          canTransfer && (
            <Button onClick={() => setOpen(true)}>
              <ArrowLeftRight size={16} /> Transfer Between Bins
            </Button>
          )
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm lg:col-span-1 overflow-hidden">
          <div className="bg-blue-50/50 dark:bg-slate-800 px-5 py-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 tracking-wide">Select Bin Location</h3>
          </div>
          <div className="max-h-[560px] overflow-y-auto">
            {binCards.length === 0 && (
              <div className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 mb-3">
                  <ArrowLeftRight size={28} className="text-slate-400 dark:text-slate-500" />
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">No bin cards available</p>
              </div>
            )}
            {binCards.map((b) => (
              <button
                key={b.id}
                onClick={() => setSelected(b.id)}
                className={`group relative block w-full border-b border-slate-100 dark:border-slate-800 px-5 py-4 text-left transition-all duration-200 last:border-0 ${
                  selected === b.id 
                    ? "bg-slate-50/70 dark:bg-slate-800/30" 
                    : "hover:bg-slate-50/50 dark:hover:bg-slate-800/20"
                }`}
              >
                {selected === b.id && (
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-university-600 dark:bg-university-500"></div>
                )}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold mb-1.5 truncate ${
                      selected === b.id 
                        ? "text-slate-900 dark:text-white" 
                        : "text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white"
                    }`}>
                      {b.bin}
                    </p>
                    <p className={`text-xs font-medium mb-1 truncate ${
                      selected === b.id 
                        ? "text-slate-700 dark:text-slate-300" 
                        : "text-slate-600 dark:text-slate-400"
                    }`}>
                      {b.storeName}
                    </p>
                    <p className={`text-xs truncate ${
                      selected === b.id 
                        ? "text-slate-600 dark:text-slate-400" 
                        : "text-slate-500 dark:text-slate-500"
                    }`}>
                      {b.itemName}
                    </p>
                  </div>
                  {selected === b.id && (
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
          <div className="bg-blue-50/50 dark:bg-slate-800 px-6 py-5 border-b border-slate-200 dark:border-slate-700">
            {card ? (
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1 truncate">Bin {card.bin}</h3>
                  <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                    <span className="font-semibold truncate">{card.storeName}</span>
                    <span className="text-slate-400 dark:text-slate-600">•</span>
                    <span className="truncate">{card.itemName}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="inline-flex flex-col items-end bg-white dark:bg-slate-800/50 rounded-xl px-4 py-2.5 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <p className="text-3xl font-extrabold text-university-700 dark:text-university-400 leading-none mb-1">{balance}</p>
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Current Balance</p>
                  </div>
                </div>
              </div>
            ) : (
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Bin Card Details</h3>
            )}
          </div>
          
          <div className="p-6 bg-slate-50/50 dark:bg-slate-900/50">
            {loading && (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-university-100 dark:bg-university-900/30 mb-3 animate-pulse">
                  <ArrowLeftRight size={28} className="text-university-600 dark:text-university-400" />
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
                        <th className="py-3.5 px-4 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Direction</th>
                        <th className="py-3.5 px-4 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Reference</th>
                        <th className="py-3.5 px-4 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-right">Qty</th>
                        <th className="py-3.5 px-4 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-16 text-center">
                            <div className="flex flex-col items-center gap-3">
                              <div className="rounded-2xl bg-slate-100 dark:bg-slate-800 p-5">
                                <ArrowLeftRight size={36} className="text-slate-400 dark:text-slate-500" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">No movements recorded</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Transactions will appear here when items are moved</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                      {entries.map((t, index) => (
                        <tr key={t.id} className={`border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-150 ${index === entries.length - 1 ? 'border-0' : ''}`}>
                          <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-semibold">{new Date(t.createdAt).toLocaleDateString()}</td>
                          <td className="py-3.5 px-4">
                            <Badge tone={t.direction === "Inbound" ? "green" : "amber"}>{t.direction}</Badge>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-medium">{t.reference}</td>
                          <td className={`py-3.5 px-4 text-right font-bold tabular-nums ${Number(t.qty) < 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                            {Number(t.qty) > 0 ? `+${t.qty}` : t.qty}
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
                      <ArrowLeftRight size={36} className="text-slate-400 dark:text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Select a bin to view its card</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Choose a bin from the list to see transaction history</p>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Transfer Stock Between Bins"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button form="bin-transfer-form" type="submit" disabled={saving}>{saving ? "Transferring…" : "Transfer"}</Button>
          </>
        }
      >
        <form id="bin-transfer-form" onSubmit={submitTransfer}>
          <Field label="Store">
            <select required className={inputCls} value={form.storeId} onChange={(e) => setForm({ ...form, storeId: e.target.value })}>
              <option value="">Select a store…</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Material">
            <select required className={inputCls} value={form.itemId} onChange={(e) => setForm({ ...form, itemId: e.target.value })}>
              <option value="">Select a material…</option>
              {items.map((i) => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="From Bin">
              <input required className={inputCls} value={form.fromBin} onChange={(e) => setForm({ ...form, fromBin: e.target.value })} placeholder="e.g. BIN-A1" />
            </Field>
            <Field label="To Bin">
              <input required className={inputCls} value={form.toBin} onChange={(e) => setForm({ ...form, toBin: e.target.value })} placeholder="e.g. BIN-A2" />
            </Field>
          </div>
          <Field label="Quantity">
            <input type="number" min="1" required className={inputCls} value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} />
          </Field>
        </form>
      </Modal>
    </div>
  );
}
