import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, CheckCircle2, XCircle } from "lucide-react";
import { useApp } from "../../context/AppContext.jsx";
import api from "../../lib/api.js";
import {
  PageHeader,
  Button,
  Field,
  inputCls,
} from "../../components/ui/PageHeader.jsx";
import DataTable from "../../components/ui/DataTable.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Badge from "../../components/ui/Badge.jsx";

export default function Returns() {
  const {
    returns,
    issueVouchers,
    items,
    addReturn,
    evaluateReturn,
    decideReturn,
    currentUser,
  } = useApp();
  const [searchParams] = useSearchParams();
  const view = searchParams.get("view");
  const [open, setOpen] = useState(false);
  const [evalTarget, setEvalTarget] = useState(null);
  const [decideTarget, setDecideTarget] = useState(null);
  const [receiptTarget, setReceiptTarget] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);
  const issuedVouchers = issueVouchers.filter(
    (voucher) => voucher.status === "Issued",
  );
  const [form, setForm] = useState({
    itemId: "",
    sourceIssueVoucherId: "",
    qty: 1,
    reason: "",
  });
  
  // Decision modal state
  const [decisionForm, setDecisionForm] = useState({
    decision: "Approved",
    remarks: "",
    password: "",
  });
  
  // Receipt confirmation modal state
  const [receiptForm, setReceiptForm] = useState({
    receivedQty: "",
    condition: "",
    remarks: "",
    password: "",
  });

  const isTEC = ["Technical Evaluation Committee"].includes(currentUser?.role);
  const canRequest = ["Department Head", "Requesting Staff"].includes(
    currentUser?.role,
  );
  const canApproveDepartment = currentUser?.role === "Department Head";
  const canDecide = ["Property Administration Officer", "Store Head"].includes(
    currentUser?.role,
  );
  const isStockClerk = currentUser?.role === "Stock Clerk";

  useEffect(() => {
    if (view === "submit" && canRequest) setOpen(true);
  }, [view, canRequest]);

  const visibleReturns =
    view === "staff-approvals"
      ? returns.filter(
          (entry) =>
            entry.status === "Pending Department Approval" &&
            (!currentUser?.department ||
              entry.department?.toLowerCase() ===
                currentUser.department.toLowerCase()),
        )
      : returns;

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    const { ok } = await addReturn({ ...form, qty: Number(form.qty) });
    setSaving(false);
    if (ok) {
      setForm({ itemId: "", sourceIssueVoucherId: "", qty: 1, reason: "" });
      setOpen(false);
    }
  }

  async function submitEvaluation(condition) {
    const { ok } = await evaluateReturn(evalTarget.id, condition, remarks);
    if (ok) {
      setEvalTarget(null);
      setRemarks("");
    }
  }
  
  async function submitDecision() {
    if (!decisionForm.password) {
      alert("Please enter your password to confirm");
      return;
    }
    
    console.log("Submitting decision:", {
      id: decideTarget.id,
      decision: decisionForm.decision,
      password: "***hidden***"
    });
    
    setSaving(true);
    try {
      // Use the API client which handles authentication properly
      const result = await api.returns.decide(
        decideTarget.id,
        decisionForm.decision,
        decisionForm.password
      );
      
      console.log("Decision result:", result);
      
      // Success
      alert(`Return ${decisionForm.decision.toLowerCase()} successfully!`);
      setDecideTarget(null);
      setDecisionForm({
        decision: "Approved",
        remarks: "",
        password: "",
      });
      
      // Refresh data
      window.location.reload();
    } catch (error) {
      console.error("Decision error:", error);
      if (error.status === 409) {
        // Conflict - someone else already decided
        alert(error.message + "\n\nPage will refresh to show current status.");
        window.location.reload();
      } else if (error.status === 400) {
        alert("Error: " + (error.message || "Invalid request. Check your password."));
      } else if (error.status === 401) {
        alert("Authentication error. Please logout and login again.");
      } else {
        alert("Error: " + (error.message || "Failed to submit decision"));
      }
    } finally {
      setSaving(false);
    }
  }
  
  async function submitReceipt() {
    if (!receiptForm.receivedQty || receiptForm.receivedQty <= 0) {
      alert("Please enter received quantity");
      return;
    }
    if (!receiptForm.condition) {
      alert("Please select physical condition");
      return;
    }
    if (!receiptForm.password) {
      alert("Please enter your password to confirm");
      return;
    }
    
    console.log("Submitting receipt:", {
      id: receiptTarget.id,
      receivedQty: receiptForm.receivedQty,
      condition: receiptForm.condition,
    });
    
    setSaving(true);
    try {
      const result = await api.returns.confirmReceipt(
        receiptTarget.id,
        parseFloat(receiptForm.receivedQty),
        receiptForm.condition,
        receiptForm.remarks,
        receiptForm.password
      );
      
      console.log("Receipt result:", result);
      
      // Success
      alert("Material receipt confirmed! Inventory has been updated.");
      setReceiptTarget(null);
      setReceiptForm({
        receivedQty: "",
        condition: "",
        remarks: "",
        password: "",
      });
      
      // Refresh data
      window.location.reload();
    } catch (error) {
      console.error("Receipt error:", error);
      if (error.status === 400) {
        alert("Error: " + (error.message || "Invalid input. Check quantity and condition."));
      } else if (error.status === 401) {
        alert("Authentication error. Please logout and login again.");
      } else {
        alert("Error: " + (error.message || "Failed to confirm receipt"));
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Material Return (Store Return Note — SRN)"
        description="Materials returned to store are technically evaluated before being reinstated to stock or referred for disposal."
        action={
          canRequest && (
            <Button onClick={() => setOpen(true)}>
              <Plus size={16} /> New Return Request
            </Button>
          )
        }
      />

      <DataTable
        searchKeys={["refNo", "returnedByName", "reason"]}
        columns={[
          { key: "refNo", header: "SRN No." },
          {
            key: "itemName",
            header: "Material",
            render: (r) => r.itemName || "—",
          },
          { key: "qty", header: "Qty" },
          {
            key: "returnedByName",
            header: "Returned By",
            render: (r) => r.returnedByName || "—",
          },
          { key: "reason", header: "Reason" },
          {
            key: "condition",
            header: "Condition",
            render: (r) => r.condition || "—",
          },
          {
            key: "status",
            header: "Status",
            render: (r) => <Badge>{r.status}</Badge>,
          },
          {
            key: "actions",
            header: "Action",
            render: (r) => (
              <div className="flex gap-2">
                {r.status === "Pending Technical Evaluation" && isTEC && (
                  <button
                    onClick={() => setEvalTarget(r)}
                    className="text-xs font-medium text-navy-700 hover:underline"
                  >
                    Record Evaluation
                  </button>
                )}
                {r.status === "Pending Department Approval" &&
                  canApproveDepartment && (
                    <>
                      <button
                        onClick={() => decideReturn(r.id, "Approved")}
                        className="text-xs font-medium text-emerald-700 hover:underline"
                      >
                        Department Approve
                      </button>
                      <button
                        onClick={() => decideReturn(r.id, "Rejected")}
                        className="text-xs font-medium text-rose-600 hover:underline"
                      >
                        Reject
                      </button>
                    </>
                  )}
                {r.status === "Evaluated" && canDecide && (
                  <>
                    <button
                      onClick={() => {
                        setDecideTarget(r);
                        setDecisionForm({ ...decisionForm, decision: "Approved" });
                      }}
                      className="text-xs font-medium text-emerald-700 hover:underline"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        setDecideTarget(r);
                        setDecisionForm({ ...decisionForm, decision: "Rejected" });
                      }}
                      className="text-xs font-medium text-rose-600 hover:underline"
                    >
                      Reject
                    </button>
                  </>
                )}
                {r.status === "Pending Physical Receipt" && isStockClerk && (
                  <button
                    onClick={() => {
                      setReceiptTarget(r);
                      setReceiptForm({
                        receivedQty: r.qty, // Pre-fill with expected quantity
                        condition: "",
                        remarks: "",
                        password: "",
                      });
                    }}
                    className="text-xs font-medium text-blue-700 hover:underline"
                  >
                    Confirm Receipt
                  </button>
                )}
              </div>
            ),
          },
        ]}
        rows={visibleReturns}
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Create Material Return Request"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button form="ret-form" type="submit" disabled={saving}>
              {saving ? "Submitting…" : "Submit Return"}
            </Button>
          </>
        }
      >
        <form id="ret-form" onSubmit={submit}>
          <Field label="Material">
            <select
              required
              className={inputCls}
              value={form.itemId}
              onChange={(e) => setForm({ ...form, itemId: e.target.value })}
            >
              <option value="">Select a material…</option>
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Source Model 22 Issue Voucher">
            <select
              required
              className={inputCls}
              value={form.sourceIssueVoucherId}
              onChange={(e) => {
                const voucher = issuedVouchers.find(
                  (entry) => entry.id === e.target.value,
                );
                setForm({
                  ...form,
                  sourceIssueVoucherId: e.target.value,
                  itemId: voucher?.itemId || "",
                });
              }}
            >
              <option value="">Select the finalized issue voucher…</option>
              {issuedVouchers.map((voucher) => (
                <option key={voucher.id} value={voucher.id}>
                  {voucher.refNo} — {voucher.itemName} — issued qty{" "}
                  {voucher.qty}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Quantity">
              <input
                type="number"
                min="1"
                required
                className={inputCls}
                value={form.qty}
                onChange={(e) => setForm({ ...form, qty: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Reason for Return">
            <textarea
              rows={3}
              required
              className={inputCls}
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
            />
          </Field>
        </form>
      </Modal>

      <Modal
        open={!!evalTarget}
        onClose={() => setEvalTarget(null)}
        title={`Technical Evaluation — ${evalTarget?.refNo || ""}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEvalTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => submitEvaluation("Damaged")}
              disabled={!remarks || !remarks.trim()}
            >
              <XCircle size={14} /> Mark as Damaged
            </Button>
            <Button 
              onClick={() => submitEvaluation("Serviceable")}
              disabled={!remarks || !remarks.trim()}
            >
              <CheckCircle2 size={14} /> Approve as Serviceable
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
              Material Details
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs text-blue-800 dark:text-blue-200">
              <div><span className="font-semibold">Item:</span> {evalTarget?.itemName}</div>
              <div><span className="font-semibold">Qty:</span> {evalTarget?.qty}</div>
              <div className="col-span-2"><span className="font-semibold">Return Reason:</span> {evalTarget?.reason}</div>
            </div>
          </div>

          <Field label="Physical Condition Assessment *" required>
            <select 
              className={inputCls}
              value={(remarks || '').split('|')[0] || ''}
              onChange={(e) => {
                const parts = (remarks || '').split('|');
                setRemarks(`${e.target.value}|${parts[1] || ''}|${parts[2] || ''}`);
              }}
              required
            >
              <option value="">Select condition...</option>
              <option value="Like New">✓ Like New - Unused, original packaging</option>
              <option value="Excellent">✓ Excellent - Minimal use, no defects</option>
              <option value="Good">✓ Good - Functional, minor wear</option>
              <option value="Fair">⚠ Fair - Functional, visible wear</option>
              <option value="Poor">✗ Poor - Damaged but repairable</option>
              <option value="Non-Functional">✗ Non-Functional - Cannot be repaired</option>
            </select>
          </Field>

          <Field label="Functional Status *" required>
            <select 
              className={inputCls}
              value={(remarks || '').split('|')[1] || ''}
              onChange={(e) => {
                const parts = (remarks || '').split('|');
                setRemarks(`${parts[0] || ''}|${e.target.value}|${parts[2] || ''}`);
              }}
              required
            >
              <option value="">Select functional status...</option>
              <option value="Fully Functional">✓ Fully Functional</option>
              <option value="Partially Functional">⚠ Partially Functional</option>
              <option value="Not Functional">✗ Not Functional</option>
              <option value="Not Tested">— Not Tested</option>
            </select>
          </Field>

          <Field label="Committee Recommendation *" required>
            <select 
              className={inputCls}
              value={(remarks || '').split('|')[2] || ''}
              onChange={(e) => {
                const parts = (remarks || '').split('|');
                setRemarks(`${parts[0] || ''}|${parts[1] || ''}|${e.target.value}`);
              }}
              required
            >
              <option value="">Select recommendation...</option>
              <option value="Return to Stock">✓ Return to Stock (Serviceable)</option>
              <option value="Repair & Return">🔧 Repair Required - Then Return to Stock</option>
              <option value="Refer for Disposal">🗑 Refer for Disposal (Unserviceable)</option>
              <option value="Quarantine">⚠ Quarantine - Further Inspection Needed</option>
            </select>
          </Field>

          <Field label="Detailed Inspection Notes">
            <textarea
              rows={3}
              className={inputCls}
              placeholder="Describe visible damage, defects, missing parts, or any other relevant observations..."
              value={(remarks || '').split('|')[3] || ''}
              onChange={(e) => {
                const parts = (remarks || '').split('|');
                setRemarks(`${parts[0] || ''}|${parts[1] || ''}|${parts[2] || ''}|${e.target.value}`);
              }}
            />
            <p className="text-xs text-slate-500 mt-1">
              Optional: Provide additional details about the material's condition
            </p>
          </Field>

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <p className="text-xs text-amber-800 dark:text-amber-200">
              <strong>Note:</strong> Your evaluation determines whether this material will be returned to stock or referred for disposal. 
              Ensure all required fields are completed before submitting.
            </p>
          </div>
        </div>
      </Modal>

      {/* Decision Modal with Digital Signature (PAO/Store Head) */}
      <Modal
        open={!!decideTarget}
        onClose={() => {
          setDecideTarget(null);
          setDecisionForm({
            decision: "Approved",
            remarks: "",
            password: "",
          });
        }}
        title={`Final Decision — ${decideTarget?.refNo || ""}`}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setDecideTarget(null);
                setDecisionForm({
                  decision: "Approved",
                  remarks: "",
                  password: "",
                });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={submitDecision}
              disabled={saving || !decisionForm.password}
              variant={decisionForm.decision === "Rejected" ? "danger" : "default"}
            >
              {saving ? "Submitting..." : `Submit ${decisionForm.decision}`}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Material Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
              Return Details
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs text-blue-800 dark:text-blue-200">
              <div><span className="font-semibold">Item:</span> {decideTarget?.itemName}</div>
              <div><span className="font-semibold">Qty:</span> {decideTarget?.qty}</div>
              <div><span className="font-semibold">Condition:</span> {decideTarget?.condition || "—"}</div>
              <div className="col-span-2"><span className="font-semibold">Reason:</span> {decideTarget?.reason}</div>
            </div>
          </div>

          {/* Decision */}
          <Field label="Decision *" required>
            <select
              className={inputCls}
              value={decisionForm.decision}
              onChange={(e) => setDecisionForm({ ...decisionForm, decision: e.target.value })}
              required
            >
              <option value="Approved">✓ Approve</option>
              <option value="Rejected">✗ Reject</option>
            </select>
          </Field>

          {/* Remarks */}
          <Field label="Decision Remarks">
            <textarea
              rows={3}
              className={inputCls}
              placeholder="Optional: Add any comments about your decision..."
              value={decisionForm.remarks}
              onChange={(e) => setDecisionForm({ ...decisionForm, remarks: e.target.value })}
            />
          </Field>

          {/* Password Confirmation */}
          <Field label="Confirm with Your Password *" required>
            <input
              type="password"
              className={inputCls}
              placeholder="Enter your password to confirm"
              value={decisionForm.password}
              onChange={(e) => setDecisionForm({ ...decisionForm, password: e.target.value })}
              required
            />
            <p className="text-xs text-slate-500 mt-1">
              Password confirmation required for approval
            </p>
          </Field>

          {/* Warning */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <p className="text-xs text-amber-800 dark:text-amber-200">
              <strong>⚠️ Important:</strong> Both PAO and Store Head can make the final decision. 
              First to submit wins. If someone else decides first, you'll receive a conflict error.
            </p>
          </div>
        </div>
      </Modal>

      {/* Stock Clerk Receipt Confirmation Modal */}
      <Modal
        open={!!receiptTarget}
        onClose={() => {
          setReceiptTarget(null);
          setReceiptForm({
            receivedQty: "",
            condition: "",
            remarks: "",
            password: "",
          });
        }}
        title={`Confirm Physical Receipt — ${receiptTarget?.refNo || ""}`}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setReceiptTarget(null);
                setReceiptForm({
                  receivedQty: "",
                  condition: "",
                  remarks: "",
                  password: "",
                });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={submitReceipt}
              disabled={saving || !receiptForm.receivedQty || !receiptForm.condition || !receiptForm.password}
            >
              {saving ? "Processing..." : "Confirm Receipt & Restock"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Material Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
              Material Being Received
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs text-blue-800 dark:text-blue-200">
              <div><span className="font-semibold">Item:</span> {receiptTarget?.itemName}</div>
              <div><span className="font-semibold">Expected Qty:</span> {receiptTarget?.qty}</div>
              <div><span className="font-semibold">TEC Evaluation:</span> {receiptTarget?.condition || "—"}</div>
              <div className="col-span-2"><span className="font-semibold">Return Reason:</span> {receiptTarget?.reason}</div>
            </div>
          </div>

          {/* Received Quantity */}
          <Field label="Actual Received Quantity *" required>
            <input
              type="number"
              min="0"
              step="0.01"
              className={inputCls}
              placeholder={`Expected: ${receiptTarget?.qty || "0"}`}
              value={receiptForm.receivedQty}
              onChange={(e) => setReceiptForm({ ...receiptForm, receivedQty: e.target.value })}
              required
            />
            <p className="text-xs text-slate-500 mt-1">
              Verify physical count matches expected quantity
            </p>
          </Field>

          {/* Physical Condition on Receipt */}
          <Field label="Physical Condition (Upon Receipt) *" required>
            <select
              className={inputCls}
              value={receiptForm.condition}
              onChange={(e) => setReceiptForm({ ...receiptForm, condition: e.target.value })}
              required
            >
              <option value="">Select condition...</option>
              <option value="As Expected">✓ As Expected - Matches TEC evaluation</option>
              <option value="Better Than Expected">✓ Better Than Expected</option>
              <option value="Worse Than Expected">⚠ Worse Than Expected</option>
              <option value="Damaged During Return">✗ Damaged During Return Process</option>
            </select>
          </Field>

          {/* Receipt Remarks */}
          <Field label="Receipt Notes">
            <textarea
              rows={3}
              className={inputCls}
              placeholder="Any discrepancies, damage notes, or special observations..."
              value={receiptForm.remarks}
              onChange={(e) => setReceiptForm({ ...receiptForm, remarks: e.target.value })}
            />
            <p className="text-xs text-slate-500 mt-1">
              Document any issues found during physical verification
            </p>
          </Field>

          {/* Password Confirmation */}
          <Field label="Confirm with Your Password *" required>
            <input
              type="password"
              className={inputCls}
              placeholder="Enter your password to confirm receipt"
              value={receiptForm.password}
              onChange={(e) => setReceiptForm({ ...receiptForm, password: e.target.value })}
              required
            />
            <p className="text-xs text-slate-500 mt-1">
              Confirming receipt will update inventory immediately
            </p>
          </Field>

          {/* Important Notice */}
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3">
            <p className="text-xs text-emerald-800 dark:text-emerald-200">
              <strong>✓ Action:</strong> Upon confirmation, this material will be immediately added back to inventory 
              and the bin card will be updated with a restocking transaction.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
