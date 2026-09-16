import React, { useState } from "react";
import { Plus, CheckCircle2, XCircle, FileText, Trash2, Package, AlertCircle } from "lucide-react";
import { useApp } from "../../context/AppContext.jsx";
import {
  PageHeader,
  Button,
  Field,
  inputCls,
} from "../../components/ui/PageHeader.jsx";
import DataTable from "../../components/ui/DataTable.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Badge from "../../components/ui/Badge.jsx";

export default function GoodsReceiptEnhanced() {
  const {
    goodsReceipts,
    items,
    suppliers,
    stores,
    addGoodsReceipt,
    evaluateGoodsReceipt,
    generateGRN,
    currentUser,
  } = useApp();

  const [open, setOpen] = useState(false);
  const [evalTarget, setEvalTarget] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [itemDecisions, setItemDecisions] = useState([]); // For multi-item evaluation
  const [saving, setSaving] = useState(false);
  
  // Receipt type selection
  const [receiptType, setReceiptType] = useState("Single Item");
  
  // Single item form (backward compatible)
  const [singleItemForm, setSingleItemForm] = useState({
    supplierId: "",
    storeId: "",
    itemId: "",
    qty: 1,
    poReference: "",
    expiryDate: "",
  });

  // Multi-item form
  const [multiItemForm, setMultiItemForm] = useState({
    supplierId: "",
    storeId: "",
    poReference: "",
    deliveryDate: new Date().toISOString().split('T')[0],
    deliveryNoteNumber: "",
    deliveryRemarks: "",
    items: [],
  });

  // Current item being added to multi-item receipt
  const [currentItem, setCurrentItem] = useState({
    itemId: "",
    qty: 1,
    unitCost: "",
    expiryDate: "",
  });

  const [grnTarget, setGrnTarget] = useState(null);
  const [grnForm, setGrnForm] = useState({
    unitCost: 0,
    bin: "RECEIVING",
  });
  const [grnSaving, setGrnSaving] = useState(false);

  const isTEC = ["Technical Evaluation Committee", "Administrator"].includes(
    currentUser?.role,
  );
  const canFinalize = ["Property Registration Officer"].includes(
    currentUser?.role,
  );
  const canRecord = [
    "Store Head",
    "Stock Clerk",
    "Property Administration Officer",
    "Administrator",
  ].includes(currentUser?.role);

  // Add item to multi-item receipt
  function addItemToReceipt() {
    if (!currentItem.itemId || !currentItem.qty) {
      alert("Please select an item and enter quantity");
      return;
    }

    const item = items.find(i => i.id === currentItem.itemId);
    if (!item) return;

    const newItem = {
      ...currentItem,
      itemName: item.name,
      itemCode: item.code,
      unit: item.unit,
      qty: Number(currentItem.qty),
      unitCost: currentItem.unitCost ? Number(currentItem.unitCost) : null,
    };

    setMultiItemForm({
      ...multiItemForm,
      items: [...multiItemForm.items, newItem],
    });

    // Reset current item
    setCurrentItem({
      itemId: "",
      qty: 1,
      unitCost: "",
      expiryDate: "",
    });
  }

  // Remove item from multi-item receipt
  function removeItemFromReceipt(index) {
    setMultiItemForm({
      ...multiItemForm,
      items: multiItemForm.items.filter((_, i) => i !== index),
    });
  }

  // Calculate totals for multi-item receipt
  function calculateTotals() {
    const totalItems = multiItemForm.items.length;
    const totalQty = multiItemForm.items.reduce((sum, item) => sum + item.qty, 0);
    const totalValue = multiItemForm.items.reduce(
      (sum, item) => sum + (item.qty * (item.unitCost || 0)),
      0
    );
    return { totalItems, totalQty, totalValue };
  }

  async function submitSingleItem(e) {
    e.preventDefault();
    setSaving(true);
    const { ok } = await addGoodsReceipt({
      ...singleItemForm,
      qty: Number(singleItemForm.qty),
      receiptType: "Single Item",
    });
    setSaving(false);
    if (ok) {
      setSingleItemForm({
        supplierId: "",
        storeId: "",
        itemId: "",
        qty: 1,
        poReference: "",
        expiryDate: "",
      });
      setOpen(false);
    }
  }

  async function submitMultiItem(e) {
    e.preventDefault();
    
    if (multiItemForm.items.length === 0) {
      alert("Please add at least one item to the receipt");
      return;
    }

    setSaving(true);
    const { ok } = await addGoodsReceipt({
      ...multiItemForm,
      receiptType: "Multi Item",
    });
    setSaving(false);
    if (ok) {
      setMultiItemForm({
        supplierId: "",
        storeId: "",
        poReference: "",
        deliveryDate: new Date().toISOString().split('T')[0],
        deliveryNoteNumber: "",
        deliveryRemarks: "",
        items: [],
      });
      setOpen(false);
    }
  }

  async function submitEvaluation(decision) {
    if (evalTarget.receiptType === "Multi Item" && evalTarget.items) {
      // Multi-item evaluation: send per-item decisions
      const { ok } = await evaluateGoodsReceipt(evalTarget.id, null, null, itemDecisions);
      if (ok) {
        setEvalTarget(null);
        setItemDecisions([]);
      }
    } else {
      // Single-item evaluation: send overall decision
      const { ok } = await evaluateGoodsReceipt(evalTarget.id, decision, remarks);
      if (ok) {
        setEvalTarget(null);
        setRemarks("");
      }
    }
  }

  function openGrnModal(receipt) {
    const item = items.find((i) => i.id === receipt.itemId);
    setGrnTarget(receipt);
    setGrnForm({
      unitCost: item?.defaultUnitCost ? Number(item.defaultUnitCost) : 0,
      bin: "RECEIVING",
    });
  }

  async function submitGrn(e) {
    e.preventDefault();
    if (!grnTarget) return;
    setGrnSaving(true);
    const { ok } = await generateGRN(
      grnTarget.id,
      Number(grnForm.unitCost),
      grnForm.bin,
    );
    setGrnSaving(false);
    if (ok) {
      setGrnTarget(null);
    }
  }

  function openReceiptModal() {
    setReceiptType("Single Item");
    setOpen(true);
  }

  const totals = receiptType === "Multi Item" ? calculateTotals() : null;

  return (
    <div>
      <PageHeader
        title="Goods Receipt, Technical Evaluation & GRN"
        description="Record incoming materials (single item or batch delivery), route to Technical Evaluation Committee, then generate official Goods Receiving Note (Model 19)."
        action={
          canRecord && (
            <Button onClick={openReceiptModal}>
              <Plus size={16} /> Record Goods Receipt
            </Button>
          )
        }
      />

      <DataTable
        searchKeys={["refNo", "poReference", "supplierName"]}
        columns={[
          { key: "refNo", header: "Receipt Ref." },
          {
            key: "receiptType",
            header: "Type",
            render: (r) => (
              <div className="flex items-center gap-1">
                <Package size={14} className="text-slate-400" />
                <span className="text-xs">
                  {r.receiptType || "Single Item"}
                </span>
              </div>
            ),
          },
          {
            key: "supplierName",
            header: "Supplier",
            render: (r) => r.supplierName || "—",
          },
          {
            key: "itemsDisplay",
            header: "Material(s)",
            render: (r) => {
              if (r.receiptType === "Multi Item" && r.totalItems > 0) {
                return (
                  <div className="text-xs">
                    <div className="font-medium text-slate-800">
                      {r.totalItems} items
                    </div>
                    <div className="text-slate-500">
                      {r.approvedItems || 0} approved, {r.rejectedItems || 0} rejected
                    </div>
                  </div>
                );
              }
              return r.itemName || "—";
            },
          },
          {
            key: "qty",
            header: "Qty",
            render: (r) => {
              if (r.receiptType === "Multi Item") {
                return <span className="text-xs text-slate-500">—</span>;
              }
              return r.qty;
            },
          },
          {
            key: "storeName",
            header: "Store",
            render: (r) => r.storeName || "—",
          },
          { 
            key: "poReference", 
            header: "PO / Ref.",
            render: (r) => r.poReference || <span className="text-xs italic text-slate-400">No PO</span>
          },
          {
            key: "deliveryDate",
            header: "Delivery Date",
            render: (r) => r.deliveryDate ? new Date(r.deliveryDate).toLocaleDateString() : "—",
          },
          {
            key: "status",
            header: "Status",
            render: (r) => <Badge>{r.status}</Badge>,
          },
          {
            key: "grnNumber",
            header: "GRN No.",
            render: (r) => r.grnNumber || "—",
          },
          {
            key: "actions",
            header: "Action",
            render: (r) => (
              <div className="flex gap-2">
                {r.status === "Awaiting Evaluation" && isTEC && (
                  <button
                    onClick={() => setEvalTarget(r)}
                    className="text-xs font-medium text-navy-700 hover:underline"
                  >
                    Evaluate
                  </button>
                )}
                {r.status === "Approved" && canFinalize && (
                  <button
                    onClick={() => openGrnModal(r)}
                    className="flex items-center gap-1 text-xs font-medium text-emerald-700 hover:underline"
                  >
                    <FileText size={12} /> Generate GRN
                  </button>
                )}
                {(r.status === "GRN Generated" || r.status === "Rejected") && (
                  <span className="text-xs text-slate-300">—</span>
                )}
              </div>
            ),
          },
        ]}
        rows={goodsReceipts}
      />

      {/* Create Goods Receipt Modal */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Record Goods Receipt"
        width={receiptType === "Multi Item" ? "max-w-4xl" : "max-w-lg"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              form={receiptType === "Single Item" ? "single-item-form" : "multi-item-form"}
              type="submit"
              disabled={saving}
            >
              {saving ? "Submitting…" : "Submit for TEC Evaluation"}
            </Button>
          </>
        }
      >
        {/* Receipt Type Selector */}
        <div className="mb-4 flex gap-3 border-b-2 border-slate-300 dark:border-slate-700 pb-4">
          <button
            type="button"
            onClick={() => setReceiptType("Single Item")}
            className={`flex-1 px-5 py-3 text-sm font-bold rounded-lg transition-all border-2 ${
              receiptType === "Single Item"
                ? "!bg-navy-700 !text-white !border-navy-700 shadow-lg"
                : "bg-white text-slate-700 border-slate-300 hover:border-navy-400 shadow"
            }`}
            style={receiptType === "Single Item" ? { backgroundColor: '#1e3a8a', color: '#ffffff', borderColor: '#1e3a8a' } : {}}
          >
            Single Item
          </button>
          <button
            type="button"
            onClick={() => setReceiptType("Multi Item")}
            className={`flex-1 px-5 py-3 text-sm font-bold rounded-lg transition-all border-2 ${
              receiptType === "Multi Item"
                ? "!bg-navy-700 !text-white !border-navy-700 shadow-lg"
                : "bg-white text-slate-700 border-slate-300 hover:border-navy-400 shadow"
            }`}
            style={receiptType === "Multi Item" ? { backgroundColor: '#1e3a8a', color: '#ffffff', borderColor: '#1e3a8a' } : {}}
          >
            Multi-Item Delivery
          </button>
          <button
            type="button"
            onClick={() => setReceiptType("Donation")}
            className={`flex-1 px-5 py-3 text-sm font-bold rounded-lg transition-all border-2 ${
              receiptType === "Donation"
                ? "!bg-emerald-700 !text-white !border-emerald-700 shadow-lg"
                : "bg-white text-slate-700 border-slate-300 hover:border-emerald-400 shadow"
            }`}
            style={receiptType === "Donation" ? { backgroundColor: '#047857', color: '#ffffff', borderColor: '#047857' } : {}}
          >
            Donation
          </button>
        </div>

        {/* Single Item Form */}
        {receiptType === "Single Item" && (
          <form id="single-item-form" onSubmit={submitSingleItem}>
            <Field label="Supplier">
              <select
                required
                className={inputCls}
                value={singleItemForm.supplierId}
                onChange={(e) => setSingleItemForm({ ...singleItemForm, supplierId: e.target.value })}
              >
                <option value="">Select supplier…</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Receiving Store">
              <select
                required
                className={inputCls}
                value={singleItemForm.storeId}
                onChange={(e) => setSingleItemForm({ ...singleItemForm, storeId: e.target.value })}
              >
                <option value="">Select store…</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </Field>
            <Field label="Material Received">
              <select
                required
                className={inputCls}
                value={singleItemForm.itemId}
                onChange={(e) => setSingleItemForm({ ...singleItemForm, itemId: e.target.value })}
              >
                <option value="">Select material…</option>
                {items.map((i) => (
                  <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Quantity">
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  required
                  className={inputCls}
                  value={singleItemForm.qty}
                  onChange={(e) => setSingleItemForm({ ...singleItemForm, qty: e.target.value })}
                />
              </Field>
              <Field label="Purchase Order Ref.">
                <input
                  required
                  className={inputCls}
                  value={singleItemForm.poReference}
                  onChange={(e) => setSingleItemForm({ ...singleItemForm, poReference: e.target.value })}
                  placeholder="PO-2026-00xx"
                />
              </Field>
            </div>
            <Field label="Expiry Date (optional)">
              <input
                type="date"
                className={inputCls}
                value={singleItemForm.expiryDate}
                onChange={(e) => setSingleItemForm({ ...singleItemForm, expiryDate: e.target.value })}
              />
            </Field>
          </form>
        )}

        {/* Multi-Item Form */}
        {(receiptType === "Multi Item" || receiptType === "Donation") && (
          <form id="multi-item-form" onSubmit={submitMultiItem}>
            <div className="grid grid-cols-2 gap-3">
              <Field label={receiptType === "Donation" ? "Donor" : "Supplier"}>
                <select
                  required
                  className={inputCls}
                  value={multiItemForm.supplierId}
                  onChange={(e) => setMultiItemForm({ ...multiItemForm, supplierId: e.target.value })}
                >
                  <option value="">Select {receiptType === "Donation" ? "donor" : "supplier"}…</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Receiving Store">
                <select
                  required
                  className={inputCls}
                  value={multiItemForm.storeId}
                  onChange={(e) => setMultiItemForm({ ...multiItemForm, storeId: e.target.value })}
                >
                  <option value="">Select store…</option>
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Field label={receiptType === "Donation" ? "Donation Ref." : "Purchase Order"}>
                <input
                  required={receiptType !== "Donation"}
                  className={inputCls}
                  value={multiItemForm.poReference}
                  onChange={(e) => setMultiItemForm({ ...multiItemForm, poReference: e.target.value })}
                  placeholder={receiptType === "Donation" ? "DON-2026-xx" : "PO-2026-00xx"}
                />
              </Field>
              <Field label="Delivery Date">
                <input
                  type="date"
                  required
                  className={inputCls}
                  value={multiItemForm.deliveryDate}
                  onChange={(e) => setMultiItemForm({ ...multiItemForm, deliveryDate: e.target.value })}
                />
              </Field>
              <Field label="Delivery Note #">
                <input
                  className={inputCls}
                  value={multiItemForm.deliveryNoteNumber}
                  onChange={(e) => setMultiItemForm({ ...multiItemForm, deliveryNoteNumber: e.target.value })}
                  placeholder="DN-xxxx"
                />
              </Field>
            </div>

            <Field label="Delivery Remarks (optional)">
              <textarea
                rows={2}
                className={inputCls}
                value={multiItemForm.deliveryRemarks}
                onChange={(e) => setMultiItemForm({ ...multiItemForm, deliveryRemarks: e.target.value })}
                placeholder="Overall delivery notes, condition, etc."
              />
            </Field>

            {/* Add Items Section */}
            <div className="mt-4 p-4 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50">
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Add Items to Receipt</h4>
              <div className="grid grid-cols-5 gap-2">
                <div className="col-span-2">
                  <select
                    className={`${inputCls} text-sm`}
                    value={currentItem.itemId}
                    onChange={(e) => setCurrentItem({ ...currentItem, itemId: e.target.value })}
                  >
                    <option value="">Select material…</option>
                    {items.map((i) => (
                      <option key={i.id} value={i.id}>{i.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    className={`${inputCls} text-sm`}
                    placeholder="Qty"
                    value={currentItem.qty}
                    onChange={(e) => setCurrentItem({ ...currentItem, qty: e.target.value })}
                  />
                </div>
                <div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={`${inputCls} text-sm`}
                    placeholder="Unit Cost (optional)"
                    value={currentItem.unitCost}
                    onChange={(e) => setCurrentItem({ ...currentItem, unitCost: e.target.value })}
                  />
                </div>
                <div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={addItemToReceipt}
                    className="w-full"
                  >
                    <Plus size={14} /> Add
                  </Button>
                </div>
              </div>
            </div>

            {/* Items List */}
            {multiItemForm.items.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-slate-700 mb-2">
                  Items in Receipt ({multiItemForm.items.length})
                </h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-slate-600">#</th>
                        <th className="px-3 py-2 text-left font-medium text-slate-600">Material</th>
                        <th className="px-3 py-2 text-right font-medium text-slate-600">Qty</th>
                        <th className="px-3 py-2 text-right font-medium text-slate-600">Unit Cost</th>
                        <th className="px-3 py-2 text-right font-medium text-slate-600">Total</th>
                        <th className="px-3 py-2 text-center font-medium text-slate-600">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {multiItemForm.items.map((item, index) => (
                        <tr key={index} className="border-t border-slate-200">
                          <td className="px-3 py-2 text-slate-600">{index + 1}</td>
                          <td className="px-3 py-2">
                            <div className="font-medium text-slate-800">{item.itemName}</div>
                            <div className="text-xs text-slate-500">{item.itemCode}</div>
                          </td>
                          <td className="px-3 py-2 text-right text-slate-700">
                            {item.qty} {item.unit}
                          </td>
                          <td className="px-3 py-2 text-right text-slate-700">
                            {item.unitCost ? `${item.unitCost.toFixed(2)} ETB` : "—"}
                          </td>
                          <td className="px-3 py-2 text-right font-medium text-slate-800">
                            {item.unitCost ? `${(item.qty * item.unitCost).toFixed(2)} ETB` : "—"}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeItemFromReceipt(index)}
                              className="text-rose-600 hover:text-rose-800"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    {totals && totals.totalValue > 0 && (
                      <tfoot className="bg-slate-50 border-t-2 border-slate-300">
                        <tr>
                          <td colSpan="2" className="px-3 py-2 font-semibold text-slate-700">Total</td>
                          <td className="px-3 py-2 text-right font-semibold text-slate-800">{totals.totalQty}</td>
                          <td className="px-3 py-2"></td>
                          <td className="px-3 py-2 text-right font-bold text-slate-900">
                            {totals.totalValue.toFixed(2)} ETB
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            )}
          </form>
        )}

        <p className="mt-3 text-xs text-slate-400">
          {receiptType === "Donation" 
            ? "Donation receipts don't require a Purchase Order. The TEC will be notified for inspection."
            : "The Technical Evaluation Committee will be notified automatically for physical inspection."}
        </p>
      </Modal>

      {/* Technical Evaluation Modal - Enhanced for Multi-Item */}
      <Modal
        open={!!evalTarget}
        onClose={() => { setEvalTarget(null); setRemarks(""); setItemDecisions([]); }}
        title={`Evaluate Receipt — ${evalTarget?.refNo || ""}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => { setEvalTarget(null); setRemarks(""); setItemDecisions([]); }}>
              Cancel
            </Button>
            {evalTarget?.receiptType === "Multi Item" ? (
              <Button 
                onClick={() => submitEvaluation()} 
                disabled={!itemDecisions.length || itemDecisions.some(d => !d.decision)}
              >
                <CheckCircle2 size={14} /> Submit Evaluations
              </Button>
            ) : (
              <>
                <Button
                  variant="danger"
                  onClick={() => submitEvaluation("Rejected")}
                >
                  <XCircle size={14} /> Reject
                </Button>
                <Button onClick={() => submitEvaluation("Approved")}>
                  <CheckCircle2 size={14} /> Approve
                </Button>
              </>
            )}
          </>
        }
      >
        {evalTarget && (
          <div>
            {(evalTarget.receiptType === "Multi Item" && evalTarget.items && evalTarget.items.length > 0) ? (
              // Multi-item evaluation: per-item table
              <div>
                <div className="mb-4">
                  <p className="text-sm font-semibold text-slate-800 mb-1">
                    Multi-Item Delivery Evaluation
                  </p>
                  <p className="text-xs text-slate-600">
                    PO: {evalTarget.poReference} • Delivery Note: {evalTarget.deliveryNoteNumber || "N/A"}
                  </p>
                  <p className="text-xs text-slate-600">
                    Delivery Date: {evalTarget.deliveryDate || "N/A"}
                  </p>
                </div>

                <div className="overflow-x-auto mb-4">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-bold text-slate-700">Item</th>
                        <th className="px-3 py-2 text-right text-xs font-bold text-slate-700">Qty</th>
                        <th className="px-3 py-2 text-left text-xs font-bold text-slate-700">Decision</th>
                        <th className="px-3 py-2 text-left text-xs font-bold text-slate-700">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {evalTarget.items?.map((item, idx) => {
                        const decision = itemDecisions.find(d => d.itemId === item.itemId);
                        return (
                          <tr key={item.itemId || idx}>
                            <td className="px-3 py-2 text-slate-800">{item.itemName}</td>
                            <td className="px-3 py-2 text-right text-slate-700">{item.qty}</td>
                            <td className="px-3 py-2">
                              <select
                                className="w-full rounded border-slate-300 text-xs py-1 px-2"
                                value={decision?.decision || ""}
                                onChange={(e) => {
                                  const newDecisions = itemDecisions.filter(d => d.itemId !== item.itemId);
                                  if (e.target.value) {
                                    newDecisions.push({
                                      itemId: item.itemId,
                                      decision: e.target.value,
                                      remarks: decision?.remarks || ""
                                    });
                                  }
                                  setItemDecisions(newDecisions);
                                }}
                              >
                                <option value="">— Select —</option>
                                <option value="Approved">✓ Approved</option>
                                <option value="Rejected">✗ Rejected</option>
                              </select>
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                className="w-full rounded border-slate-300 text-xs py-1 px-2"
                                placeholder="Optional remarks..."
                                value={decision?.remarks || ""}
                                onChange={(e) => {
                                  const newDecisions = itemDecisions.filter(d => d.itemId !== item.itemId);
                                  const existingDecision = itemDecisions.find(d => d.itemId === item.itemId);
                                  if (existingDecision || e.target.value) {
                                    newDecisions.push({
                                      itemId: item.itemId,
                                      decision: existingDecision?.decision || "",
                                      remarks: e.target.value
                                    });
                                  }
                                  setItemDecisions(newDecisions);
                                }}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {itemDecisions.length > 0 && (
                  <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs">
                    <p className="font-semibold text-blue-900 mb-1">Summary</p>
                    <p className="text-blue-700">
                      {itemDecisions.filter(d => d.decision === "Approved").length} Approved • 
                      {itemDecisions.filter(d => d.decision === "Rejected").length} Rejected • 
                      {itemDecisions.filter(d => !d.decision).length} Pending
                    </p>
                  </div>
                )}
              </div>
            ) : (
              // Single-item evaluation: improved professional UI
              <div className="space-y-4">
                {/* Receipt Details Card */}
                <div className="rounded-lg border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-slate-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-blue-600 p-2">
                      <Package className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-slate-900 mb-2">
                        Material Information
                      </h3>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div>
                          <p className="text-xs text-slate-500">Item</p>
                          <p className="font-semibold text-slate-800">
                            {evalTarget.itemName}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Quantity</p>
                          <p className="font-semibold text-slate-800">
                            {evalTarget.qty}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">PO / Reference</p>
                          <p className="font-medium text-slate-800">
                            {evalTarget.poReference || <span className="italic text-slate-400">N/A</span>}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Supplier</p>
                          <p className="font-medium text-slate-800">
                            {evalTarget.supplierName || "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Evaluation Instructions */}
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-amber-900 mb-1">
                        Technical Evaluation Guidelines
                      </p>
                      <p className="text-xs text-amber-700">
                        Verify that delivered materials match specifications, quality standards, and purchase order requirements.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Inspection Remarks */}
                <Field label="Inspection Remarks & Findings">
                  <textarea
                    rows={4}
                    className={inputCls}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Document your inspection findings, including:&#10;• Specification compliance&#10;• Quality assessment&#10;• Packaging condition&#10;• Any defects or discrepancies"
                  />
                </Field>

                {/* Decision Prompt */}
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                  <p className="text-xs font-semibold text-slate-700 mb-1">
                    Make your evaluation decision:
                  </p>
                  <p className="text-xs text-slate-600">
                    <span className="font-medium text-emerald-700">Approve</span> if materials meet all requirements, or{" "}
                    <span className="font-medium text-rose-700">Reject</span> if there are quality issues or specification mismatches.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Generate GRN Modal - Same as before */}
      <Modal
        open={!!grnTarget}
        onClose={() => setGrnTarget(null)}
        title={`Generate Goods Receiving Note (Model 19) — ${grnTarget?.refNo || ""}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setGrnTarget(null)}>
              Cancel
            </Button>
            <Button form="grn-form" type="submit" disabled={grnSaving}>
              {grnSaving ? "Generating GRN…" : "Confirm & Issue Model 19"}
            </Button>
          </>
        }
      >
        {grnTarget && (
          <form id="grn-form" onSubmit={submitGrn}>
            <div className="mb-3 rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600 space-y-1">
              <p><strong>Receipt Ref:</strong> {grnTarget.refNo}</p>
              <p><strong>Material:</strong> {grnTarget.qty}x {grnTarget.itemName}</p>
              <p><strong>Receiving Store:</strong> {grnTarget.storeName}</p>
              <p><strong>Supplier:</strong> {grnTarget.supplierName}</p>
            </div>
            <Field label="Unit Cost (ETB)">
              <input
                type="number"
                min="0"
                step="0.01"
                required
                className={inputCls}
                value={grnForm.unitCost}
                onChange={(e) => setGrnForm({ ...grnForm, unitCost: e.target.value })}
              />
            </Field>
            <Field label="Assigned Store Bin / Shelf Location">
              <input
                required
                className={inputCls}
                value={grnForm.bin}
                onChange={(e) => setGrnForm({ ...grnForm, bin: e.target.value })}
                placeholder="e.g. RECEIVING, BIN-A1, SHELF-02"
              />
            </Field>
            <p className="mt-2 text-xs text-slate-400">
              Generating the GRN finalizes the receipt, creates a FIFO cost lot,
              increments Quantity on Hand, and updates the store's bin card.
            </p>
          </form>
        )}
      </Modal>
    </div>
  );
}
