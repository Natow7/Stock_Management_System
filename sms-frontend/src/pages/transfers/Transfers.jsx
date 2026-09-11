import React, { useState, useEffect } from "react";
import { Plus, Package, AlertCircle, CheckCircle2, TrendingUp } from "lucide-react";
import { useApp } from "../../context/AppContext.jsx";
import { PageHeader, Button, Field, inputCls } from "../../components/ui/PageHeader.jsx";
import DataTable from "../../components/ui/DataTable.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Badge from "../../components/ui/Badge.jsx";
import api from "../../lib/api.js";

export default function Transfers() {
  const { transfers, items, stores, addTransfer, decideTransfer, currentUser } = useApp();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ itemId: "", qty: 1, fromStoreId: "", toStoreId: "" });
  
  // Smart transfer state
  const [itemAvailability, setItemAvailability] = useState(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState(null);

  const canApprove = ["Property Administration Officer"].includes(currentUser?.role);
  const canRequest = ["Store Head", "Department Head"].includes(currentUser?.role);

  // Fetch availability when item is selected
  useEffect(() => {
    async function fetchAvailability() {
      if (!form.itemId) {
        setItemAvailability(null);
        return;
      }

      setLoadingAvailability(true);
      setAvailabilityError(null);
      
      try {
        const data = await api.items.getAvailability(form.itemId);
        setItemAvailability(data);
        
        // Auto-select first store with stock if not already selected
        if (!form.fromStoreId && data.locations.length > 0) {
          setForm(prev => ({
            ...prev,
            fromStoreId: data.locations[0].storeId
          }));
        }
      } catch (err) {
        console.error("Failed to fetch availability:", err);
        setAvailabilityError(err.message || "Failed to load stock information");
        setItemAvailability(null);
      } finally {
        setLoadingAvailability(false);
      }
    }

    fetchAvailability();
  }, [form.itemId]);

  // Get selected "from" store details
  const selectedFromStore = itemAvailability?.locations.find(
    loc => loc.storeId === form.fromStoreId
  );

  // Validate quantity
  const qtyExceedsAvailable = selectedFromStore && 
    Number(form.qty) > selectedFromStore.availableQty;

  // Get available destination stores (all except source)
  const availableToStores = stores.filter(s => s.id !== form.fromStoreId);

  async function submit(e) {
    e.preventDefault();
    if (form.fromStoreId === form.toStoreId) return;
    if (qtyExceedsAvailable) return;
    
    // Validate all required fields
    if (!form.itemId || !form.fromStoreId || !form.toStoreId || !form.qty) {
      console.error("Missing required fields:", form);
      return;
    }
    
    setSaving(true);
    try {
      console.log("Submitting transfer:", {
        itemId: form.itemId,
        fromStoreId: form.fromStoreId,
        toStoreId: form.toStoreId,
        qty: Number(form.qty)
      });
      
      const { ok } = await addTransfer({ 
        itemId: form.itemId,
        fromStoreId: form.fromStoreId,
        toStoreId: form.toStoreId,
        qty: Number(form.qty) 
      });
      
      if (ok) {
        setForm({ itemId: "", qty: 1, fromStoreId: "", toStoreId: "" });
        setItemAvailability(null);
        setOpen(false);
      }
    } catch (error) {
      console.error("Transfer submission error:", error);
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setForm({ itemId: "", qty: 1, fromStoreId: "", toStoreId: "" });
    setItemAvailability(null);
    setAvailabilityError(null);
    setOpen(false);
  }

  return (
    <div>
      <PageHeader
        title="Inter-Store Material Transfer"
        description="Move materials between stores with PAO approval; approved transfers post a Bin Card movement at both ends."
        action={
          canRequest && (
            <Button onClick={() => setOpen(true)}>
              <Plus size={16} /> New Transfer Request
            </Button>
          )
        }
      />

      <DataTable
        searchKeys={["refNo", "itemName"]}
        columns={[
          { key: "refNo", header: "Ref. No." },
          { key: "itemName", header: "Material", render: (r) => r.itemName || "—" },
          { key: "qty", header: "Qty" },
          { key: "fromStoreName", header: "From", render: (r) => r.fromStoreName || "—" },
          { key: "toStoreName", header: "To", render: (r) => r.toStoreName || "—" },
          { key: "createdAt", header: "Date", render: (r) => new Date(r.createdAt).toLocaleDateString() },
          { key: "status", header: "Status", render: (r) => <Badge>{r.status}</Badge> },
          {
            key: "actions",
            header: "Action",
            render: (r) =>
              r.status === "Pending Approval" && canApprove ? (
                <div className="flex gap-2">
                  <button onClick={() => decideTransfer(r.id, "Approved")} className="text-xs font-medium text-emerald-700 hover:underline">Approve</button>
                  <button onClick={() => decideTransfer(r.id, "Rejected")} className="text-xs font-medium text-rose-600 hover:underline">Reject</button>
                </div>
              ) : (
                <span className="text-xs text-slate-300">—</span>
              ),
          },
        ]}
        rows={transfers}
      />

      <Modal
        open={open}
        onClose={handleReset}
        title="Initiate Material Transfer"
        footer={
          <>
            <Button variant="secondary" onClick={handleReset}>Cancel</Button>
            <Button 
              form="tr-form" 
              type="submit" 
              disabled={saving || loadingAvailability || qtyExceedsAvailable || !itemAvailability?.locations.length}
            >
              {saving ? "Submitting…" : "Submit Request"}
            </Button>
          </>
        }
      >
        <form id="tr-form" onSubmit={submit} className="space-y-4">
          {/* Material Selection */}
          <Field label="Material">
            <select 
              required 
              className={inputCls} 
              value={form.itemId} 
              onChange={(e) => setForm({ ...form, itemId: e.target.value, fromStoreId: "", toStoreId: "" })}
            >
              <option value="">Select a material…</option>
              {items.map((i) => (
                <option key={i.id} value={i.id}>{i.name} ({i.code})</option>
              ))}
            </select>
          </Field>

          {/* Loading State */}
          {loadingAvailability && (
            <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              <span>Checking availability across stores...</span>
            </div>
          )}

          {/* Error State */}
          {availabilityError && (
            <div className="flex items-start gap-2 text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 p-3 rounded-lg">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>{availabilityError}</span>
            </div>
          )}

          {/* No Stock Warning */}
          {itemAvailability && itemAvailability.locations.length === 0 && (
            <div className="flex items-start gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">No stock available</p>
                <p className="text-xs mt-1">This material is not available in any store for transfer.</p>
              </div>
            </div>
          )}

          {/* Availability Summary */}
          {itemAvailability && itemAvailability.locations.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-blue-900 dark:text-blue-100 mb-2">
                <Package size={16} />
                <span className="font-semibold">Available in {itemAvailability.locations.length} store(s)</span>
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Total: <span className="font-bold">{itemAvailability.totalAvailable} {itemAvailability.unit}</span>
              </p>
            </div>
          )}

          {/* From Store - Only show stores with stock */}
          {itemAvailability && itemAvailability.locations.length > 0 && (
            <Field label="From Store (Source)">
              <select 
                required 
                className={inputCls} 
                value={form.fromStoreId} 
                onChange={(e) => setForm({ ...form, fromStoreId: e.target.value, toStoreId: "" })}
              >
                <option value="">Select source store…</option>
                {itemAvailability.locations.map((loc) => (
                  <option key={loc.storeId} value={loc.storeId}>
                    {loc.storeName} — Available: {loc.availableQty} {itemAvailability.unit} (Bin: {loc.bin})
                  </option>
                ))}
              </select>
              {selectedFromStore && (
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  <span className="text-slate-600 dark:text-slate-400">
                    Stock available: <span className="font-bold text-emerald-600">{selectedFromStore.availableQty} {itemAvailability.unit}</span>
                  </span>
                </div>
              )}
            </Field>
          )}

          {/* Quantity */}
          {form.fromStoreId && (
            <Field label="Quantity to Transfer">
              <input 
                type="number" 
                min="1" 
                max={selectedFromStore?.availableQty || 1}
                required 
                className={inputCls} 
                value={form.qty} 
                onChange={(e) => setForm({ ...form, qty: e.target.value })} 
              />
              {qtyExceedsAvailable && (
                <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                  <AlertCircle size={12} />
                  Requested quantity exceeds available stock ({selectedFromStore.availableQty} {itemAvailability.unit})
                </p>
              )}
              {selectedFromStore && !qtyExceedsAvailable && Number(form.qty) > 0 && (
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Remaining after transfer: {selectedFromStore.availableQty - Number(form.qty)} {itemAvailability.unit}
                </p>
              )}
            </Field>
          )}

          {/* To Store - Only show other stores */}
          {form.fromStoreId && (
            <Field label="To Store (Destination)">
              <select 
                required 
                className={inputCls} 
                value={form.toStoreId} 
                onChange={(e) => setForm({ ...form, toStoreId: e.target.value })}
              >
                <option value="">Select destination store…</option>
                {availableToStores.map((s) => {
                  const hasStock = itemAvailability?.locations.find(loc => loc.storeId === s.id);
                  return (
                    <option key={s.id} value={s.id}>
                      {s.name}{hasStock ? ` (Current: ${hasStock.availableQty} ${itemAvailability.unit})` : ' (Empty)'}
                    </option>
                  );
                })}
              </select>
            </Field>
          )}

          {/* Transfer Summary */}
          {form.fromStoreId && form.toStoreId && !qtyExceedsAvailable && Number(form.qty) > 0 && (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-emerald-900 dark:text-emerald-100 mb-1">
                <TrendingUp size={16} />
                <span className="font-semibold">Transfer Summary</span>
              </div>
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                Moving <span className="font-bold">{form.qty} {itemAvailability.unit}</span> from{" "}
                <span className="font-semibold">{itemAvailability.locations.find(l => l.storeId === form.fromStoreId)?.storeName}</span> to{" "}
                <span className="font-semibold">{availableToStores.find(s => s.id === form.toStoreId)?.name}</span>
              </p>
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}
