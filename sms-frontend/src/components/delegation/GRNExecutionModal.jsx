import React, { useState } from "react";
import Modal from "../ui/Modal.jsx";
import { Button, Field, inputCls } from "../ui/PageHeader.jsx";

export default function GRNExecutionModal({ receipt, itemLocations, onSuccess, onClose, executeGRN }) {
  const [formData, setFormData] = useState({
    bin: "RECEIVING",
    executionNotes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Get available bins for this item/store combination
  const availableBins = itemLocations
    .filter((loc) => loc.itemId === receipt.itemId && loc.storeId === receipt.storeId)
    .map((loc) => loc.bin);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    const { ok } = await executeGRN(receipt.id, {
      bin: formData.bin,
      executionNotes: formData.executionNotes,
    });
    
    setSubmitting(false);
    if (ok) {
      onSuccess();
    }
  };

  return (
    <Modal open={true} onClose={onClose} title="Execute GRN Generation">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 mb-4">
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Receipt:</span>
              <span className="font-medium">{receipt.refNo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">GRN Number:</span>
              <span className="font-medium text-indigo-600 dark:text-indigo-400">
                {receipt.grnNumber}
              </span>
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
              <span className="text-slate-600 dark:text-slate-400">Unit Cost:</span>
              <span className="font-medium">${receipt.unitCost || "N/A"}</span>
            </div>
          </div>
        </div>

        <Field label="Bin Location *" htmlFor="bin">
          {availableBins.length > 0 ? (
            <select
              id="bin"
              value={formData.bin}
              onChange={(e) => setFormData({ ...formData, bin: e.target.value })}
              className={inputCls}
              required
            >
              <option value="RECEIVING">Receiving Area (Temporary Staging)</option>
              {availableBins.map((bin) => (
                <option key={bin} value={bin}>
                  {bin}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              id="bin"
              value={formData.bin}
              onChange={(e) => setFormData({ ...formData, bin: e.target.value })}
              className={inputCls}
              placeholder="e.g., A-01-05"
              required
            />
          )}
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Physical storage location for this item
          </p>
        </Field>

        <Field label="Execution Notes *" htmlFor="executionNotes">
          <textarea
            id="executionNotes"
            value={formData.executionNotes}
            onChange={(e) => setFormData({ ...formData, executionNotes: e.target.value })}
            rows="3"
            className={inputCls}
            placeholder="e.g., GRN generated successfully. Stock updated."
            required
          />
        </Field>

        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-3">
          <p className="text-xs text-green-700 dark:text-green-300">
            <strong>Action:</strong> Creates FIFO lot, updates bin card & stock, notifies Store Head for verification.
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" onClick={onClose} variant="ghost" disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Executing..." : "Execute GRN"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
