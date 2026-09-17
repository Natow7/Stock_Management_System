import React, { useState } from "react";
import Modal from "../ui/Modal.jsx";
import { Button, Field, inputCls } from "../ui/PageHeader.jsx";

export default function ProApprovalModal({ receipt, onSuccess, onClose, approveForGRN }) {
  const [formData, setFormData] = useState({
    approvalNotes: "",
    unitCost: receipt.defaultUnitCost || "",
    grnNumber: `GRN-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    const { ok } = await approveForGRN(receipt.id, {
      approvalNotes: formData.approvalNotes,
      unitCost: parseFloat(formData.unitCost),
      grnNumber: formData.grnNumber,
    });
    
    setSubmitting(false);
    if (ok) {
      onSuccess();
    }
  };

  return (
    <Modal open={true} onClose={onClose} title="Approve Receipt for GRN Generation">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 mb-4">
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Receipt:</span>
              <span className="font-medium">{receipt.refNo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Item:</span>
              <span className="font-medium">{receipt.itemName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Quantity:</span>
              <span className="font-medium">{receipt.qty} {receipt.unit}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Supplier:</span>
              <span className="font-medium">{receipt.supplierName}</span>
            </div>
          </div>
        </div>

        <Field label="GRN Number *" htmlFor="grnNumber">
          <input
            type="text"
            id="grnNumber"
            value={formData.grnNumber}
            onChange={(e) => setFormData({ ...formData, grnNumber: e.target.value })}
            className={inputCls}
            required
          />
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Auto-generated. Modify if needed to match your numbering system.
          </p>
        </Field>

        <Field label="Unit Cost (USD) *" htmlFor="unitCost">
          <input
            type="number"
            step="0.01"
            id="unitCost"
            value={formData.unitCost}
            onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })}
            className={inputCls}
            required
          />
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Default from item master: ${receipt.defaultUnitCost || "N/A"}
          </p>
        </Field>

        <Field label="Approval Notes *" htmlFor="approvalNotes">
          <textarea
            id="approvalNotes"
            value={formData.approvalNotes}
            onChange={(e) => setFormData({ ...formData, approvalNotes: e.target.value })}
            rows="4"
            className={inputCls}
            placeholder="Enter your approval notes (e.g., 'Approved for GRN generation. Standard cost applied.')"
            required
          />
        </Field>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
          <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
            What happens next?
          </h3>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• Stock Clerk will be notified to execute GRN generation</li>
            <li>• Clerk will create FIFO lot, update bin cards, and update stock</li>
            <li>• Store Head will verify physical stock matches GRN</li>
          </ul>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" onClick={onClose} variant="ghost" disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Approving..." : "Approve for GRN"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
