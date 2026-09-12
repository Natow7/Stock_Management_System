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
        <div className="rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl lg:col-span-1 overflow-hidden">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 border-b-2 border-slate-200 dark:border-slate-800 px-4 py-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Stored Drinking Water (Carton)</h3>
          </div>
          <div className="max-h-[520px] overflow-y-auto">
            {binCards.length === 0 && <p className="p-6 text-sm text-slate-500 dark:text-slate-400 text-center">No bin cards yet.</p>}
            {binCards.map((b) => (
              <button
                key={b.id}
                onClick={() => setSelected(b.id)}
                className={`block w-full border-b border-slate-100 dark:border-slate-800 px-4 py-3 text-left text-sm transition-all duration-150 last:border-0 ${
                  selected === b.id 
                    ? "bg-university-50 dark:bg-university-950/40 border-l-4 border-l-university-600 dark:border-l-university-400 font-bold text-university-900 dark:text-university-200" 
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 font-medium"
                }`}
              >
                <p className="mb-1">{b.bin} · {b.storeName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{b.itemName}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl lg:col-span-2 overflow-hidden">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 border-b-2 border-slate-200 dark:border-slate-800 px-6 py-4">
            {card ? (
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Bin {card.bin}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{card.storeName} · {card.itemName}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-extrabold text-university-700 dark:text-university-400">{balance}</p>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Current Balance</p>
                </div>
              </div>
            ) : (
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Bin Card Details</h3>
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
                      <th className="pb-3 pr-4">Direction</th>
                      <th className="pb-3 pr-4">Reference</th>
                      <th className="pb-3 text-right pr-4">Qty</th>
                      <th className="pb-3 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-12 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <div className="rounded-2xl bg-slate-100 dark:bg-slate-800 p-4">
                              <ArrowLeftRight size={32} className="text-slate-400 dark:text-slate-500" />
                            </div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No movements recorded yet.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                    {entries.map((t) => (
                      <tr key={t.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-150 last:border-0">
                        <td className="py-3 pr-4 text-slate-600 dark:text-slate-300 font-medium">{new Date(t.createdAt).toLocaleDateString()}</td>
                        <td className="py-3 pr-4">
                          <Badge tone={t.direction === "Inbound" ? "green" : "amber"}>{t.direction}</Badge>
                        </td>
                        <td className="py-3 pr-4 text-slate-600 dark:text-slate-300 font-medium">{t.reference}</td>
                        <td className={`py-3 text-right font-bold pr-4 ${Number(t.qty) < 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                          {Number(t.qty) > 0 ? `+${t.qty}` : t.qty}
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
                      <ArrowLeftRight size={32} className="text-slate-400 dark:text-slate-500" />
                    </div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Select a bin to view its card.</p>
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
