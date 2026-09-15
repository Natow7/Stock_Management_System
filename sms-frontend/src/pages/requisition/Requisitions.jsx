import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Plus, ArrowRightCircle, CheckCircle, Shield, PackageCheck, Printer } from "lucide-react";
import { useApp } from "../../context/AppContext.jsx";
import { printModel22 } from "../../utils/printModel22.js";
import {
  PageHeader,
  Button,
  Field,
  inputCls,
} from "../../components/ui/PageHeader.jsx";
import DataTable from "../../components/ui/DataTable.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Badge from "../../components/ui/Badge.jsx";
import { ActionButton, ActionLink } from "../../components/ui/ActionButton.jsx";

export default function Requisitions() {
  const {
    requisitions,
    items,
    stores,
    issueVouchers,
    addRequisition,
    decideRequisition,
    createPreliminaryVoucher,
    currentUser,
  } = useApp();
  const [searchParams] = useSearchParams();
  const view = searchParams.get("view");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    department: currentUser?.department || "",
    storeId: "",
    itemId: "",
    qty: 1,
    requiresGateClearance: false,
    gc_collector_name: "",
    gc_collector_id_number: "",
    gc_collector_phone: "",
    gc_vehicle_registration: "",
    gc_scheduled_pickup_date: "",
    gc_scheduled_pickup_time: "",
    gc_pickup_justification: "",
  });
  
  // Create SIV modal state
  const [createSIVModal, setCreateSIVModal] = useState(false);
  const [selectedRequisition, setSelectedRequisition] = useState(null);
  const [requiresGateClearance, setRequiresGateClearance] = useState(false);
  
  // Review/Approval modal state
  const [reviewModal, setReviewModal] = useState(false);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewDecision, setReviewDecision] = useState(null);
  const [reviewRemarks, setReviewRemarks] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (currentUser?.department && !form.department) {
      setForm((previous) => ({
        ...previous,
        department: currentUser.department,
      }));
    }
  }, [currentUser?.department, form.department]);

  const canApproveDepartment = currentUser?.role === "Department Head";
  const canApprovePao = currentUser?.role === "Property Administration Officer";
  const canRequest = ["Department Head", "Requesting Staff"].includes(
    currentUser?.role,
  );
  const canIssuePrelim = ["Store Head"].includes(currentUser?.role);

  useEffect(() => {
    if (view === "submit" && canRequest) setOpen(true);
  }, [view, canRequest]);

  const visibleRequisitions =
    view === "staff-approvals"
      ? requisitions.filter(
          (requisition) =>
            ["Pending Department Approval", "Pending Approval"].includes(
              requisition.status,
            ) &&
            (!currentUser?.department ||
              requisition.department?.toLowerCase() ===
                currentUser.department.toLowerCase()),
        )
      : requisitions.filter(r => r.status !== 'Closed - Fully Returned'); // Hide fully returned items

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    const { ok } = await addRequisition({ ...form, qty: Number(form.qty) });
    setSaving(false);
    if (ok) {
      setForm({
        department: currentUser?.department || "",
        storeId: "",
        itemId: "",
        qty: 1,
        requiresGateClearance: false,
        gc_collector_name: "",
        gc_collector_id_number: "",
        gc_collector_phone: "",
        gc_vehicle_registration: "",
        gc_scheduled_pickup_date: "",
        gc_scheduled_pickup_time: "",
        gc_pickup_justification: "",
      });
      setOpen(false);
    }
  }

  function openCreateSIVModal(requisition) {
    setSelectedRequisition(requisition);
    setRequiresGateClearance(false); // Default to false
    setCreateSIVModal(true);
  }
  
  function openReviewModal(requisition, decision) {
    setReviewTarget(requisition);
    setReviewDecision(decision);
    setReviewRemarks("");
    setConfirmPassword("");
    setReviewModal(true);
  }
  
  function handlePrintVoucher(requisition) {
    // Find the voucher for this requisition
    const voucher = issueVouchers.find(v => v.requisitionRef === requisition.refNo);
    if (voucher) {
      printModel22(voucher);
    } else {
      alert("Voucher not found. Please refresh the page and try again.");
    }
  }
  
  function closeReviewModal() {
    setReviewModal(false);
    setReviewTarget(null);
    setReviewDecision(null);
    setReviewRemarks("");
    setConfirmPassword("");
  }
  
  async function submitReview(e) {
    e.preventDefault();
    if (!reviewTarget || !reviewDecision) return;
    
    setSaving(true);
    // For PAO, password confirmation is required
    if (canApprovePao && !confirmPassword) {
      alert("Password confirmation is required");
      setSaving(false);
      return;
    }
    
    const { ok } = canApprovePao 
      ? await decideRequisition(reviewTarget.id, reviewDecision, confirmPassword)
      : await decideRequisition(reviewTarget.id, reviewDecision);
      
    setSaving(false);
    if (ok) {
      closeReviewModal();
    }
  }

  async function submitCreateSIV(e) {
    e.preventDefault();
    if (!selectedRequisition) return;
    
    // Use gate clearance from requisition if it has it, otherwise use checkbox state
    const needsGateClearance = selectedRequisition.requires_gate_clearance || requiresGateClearance;
    
    setSaving(true);
    const { ok } = await createPreliminaryVoucher(selectedRequisition.id, needsGateClearance);
    setSaving(false);
    if (ok) {
      setCreateSIVModal(false);
      setSelectedRequisition(null);
      setRequiresGateClearance(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Store Requisition (SR)"
        description="Submit and approve requests for materials from a department, routed for approval before issuing."
        action={
          canRequest && (
            <Button onClick={() => setOpen(true)}>
              <Plus size={16} /> New Requisition
            </Button>
          )
        }
      />

      <DataTable
        searchKeys={["refNo", "department", "requestedByName"]}
        columns={[
          { key: "refNo", header: "Ref. No." },
          { key: "department", header: "Department" },
          {
            key: "requestedByName",
            header: "Requested By",
            render: (r) => r.requestedByName || "—",
          },
          {
            key: "itemName",
            header: "Material",
            render: (r) => r.itemName || "—",
          },
          {
            key: "storeName",
            header: "Store",
            render: (r) => r.storeName || "—",
          },
          { key: "qty", header: "Qty" },
          {
            key: "returnTracking",
            header: "Returns",
            render: (r) => {
              if (!r.hasReturns && !r.has_returns) {
                return <span className="text-xs text-slate-400">—</span>;
              }
              const original = r.qty;
              const returned = r.returnedQty || r.returned_qty || 0;
              const net = r.netQty || r.net_qty || r.qty;
              
              // Full return vs partial return
              if (returned >= original) {
                return (
                  <div className="text-xs">
                    <div className="text-rose-600 font-bold">FULL RETURN</div>
                    <div className="text-slate-500">All {original} returned</div>
                  </div>
                );
              }
              
              return (
                <div className="text-xs">
                  <div className="text-slate-700 font-medium">
                    Orig: {original} → Net: {net}
                  </div>
                  <div className="text-rose-600">(-{returned} returned)</div>
                </div>
              );
            },
          },
          {
            key: "createdAt",
            header: "Date",
            render: (r) => new Date(r.createdAt).toLocaleDateString(),
          },
          {
            key: "status",
            header: "Status",
            render: (r) => (
              <div className="flex flex-col gap-1">
                <Badge>{r.status}</Badge>
                {(r.hasReturns || r.has_returns) && (
                  <span className="text-xs text-rose-600 font-medium">
                    Has Returns
                  </span>
                )}
              </div>
            ),
          },
          {
            key: "actions",
            header: "Action",
            render: (r) => (
              <div className="flex gap-2">
                {(r.status === "Pending Department Approval" ||
                  (r.status === "Pending Approval" && canApproveDepartment)) &&
                  canApproveDepartment && (
                    <>
                      <ActionButton
                        variant="success"
                        onClick={() => openReviewModal(r, "Approved")}
                      >
                        Approve
                      </ActionButton>
                      <ActionButton
                        variant="danger"
                        onClick={() => openReviewModal(r, "Rejected")}
                      >
                        Reject
                      </ActionButton>
                    </>
                  )}
                {r.status === "Pending PAO Approval" && canApprovePao && (
                  <>
                    <ActionButton
                      variant="success"
                      onClick={() => openReviewModal(r, "Approved")}
                    >
                      Approve
                    </ActionButton>
                    <ActionButton
                      variant="danger"
                      onClick={() => openReviewModal(r, "Rejected")}
                    >
                      Reject
                    </ActionButton>
                  </>
                )}
                {r.status === "Approved" && canIssuePrelim && !r.voucherCreated && (
                  <ActionButton
                    variant="primary"
                    onClick={() => openCreateSIVModal(r)}
                  >
                    <ArrowRightCircle size={12} /> Create SIV
                  </ActionButton>
                )}
                {r.status === "Approved" && r.voucherCreated && (
                  <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                    <CheckCircle size={14} /> SIV Created: {r.voucherRefNo}
                  </span>
                )}
                {r.status === "Issued" && (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <PackageCheck size={14} /> Ready for Collection
                    </span>
                    <div className="flex flex-col gap-0.5 text-xs text-slate-600 dark:text-slate-400">
                      {r.voucherRefNo && <span>Voucher: {r.voucherRefNo}</span>}
                      {r.storeName && <span>From: {r.storeName}</span>}
                    </div>
                    {/* Print button only for Department Heads (they don't have Issue Vouchers section) */}
                    {currentUser?.role === "Department Head" && (
                      <button
                        onClick={() => handlePrintVoucher(r)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                      >
                        <Printer size={13} strokeWidth={2.5} /> Print Voucher
                      </button>
                    )}
                  </div>
                )}
                {!((r.status === "Pending Department Approval" && canApproveDepartment) ||
                   (r.status === "Pending PAO Approval" && canApprovePao) ||
                   (r.status === "Approved" && canIssuePrelim)) && (
                  <span className="text-xs text-slate-400">—</span>
                )}
              </div>
            ),
          },
        ]}
        rows={visibleRequisitions}
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New Store Requisition"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button form="req-form" type="submit" disabled={saving}>
              {saving ? "Submitting…" : "Submit Requisition"}
            </Button>
          </>
        }
      >
        <form id="req-form" onSubmit={submit}>
          <Field label="Requesting Department">
            <input
              required
              className={inputCls}
              value={form.department}
              readOnly={
                currentUser?.role === "Department Head" ||
                currentUser?.role === "Requesting Staff"
              }
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              placeholder="e.g. Finance Department"
            />
          </Field>
          <Field label="Issuing Store">
            <select
              required
              className={inputCls}
              value={form.storeId}
              onChange={(e) => setForm({ ...form, storeId: e.target.value })}
            >
              <option value="">Select a store…</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
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
                  {i.name} ({i.qtyOnHand} {i.unit} available)
                </option>
              ))}
            </select>
          </Field>
          <Field label="Quantity Requested">
            <input
              type="number"
              min="1"
              required
              className={inputCls}
              value={form.qty}
              onChange={(e) => setForm({ ...form, qty: e.target.value })}
            />
          </Field>

          {/* Gate Clearance Section */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg mb-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.requiresGateClearance}
                  onChange={(e) => setForm({ ...form, requiresGateClearance: e.target.checked })}
                  className="mt-1 h-4 w-4 rounded border-gray-300"
                />
                <div>
                  <div className="font-semibold text-sm flex items-center gap-2">
                    <Shield size={16} className="text-amber-600" />
                    Materials will leave campus grounds
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Check this if materials need to be taken off campus. You must provide collector details below.
                  </p>
                </div>
              </label>
            </div>

            {form.requiresGateClearance && (
              <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-3">
                  Gate Clearance Details
                </h4>
                
                <Field label="Collector Name" required>
                  <input
                    required={form.requiresGateClearance}
                    className={inputCls}
                    value={form.gc_collector_name}
                    onChange={(e) => setForm({ ...form, gc_collector_name: e.target.value })}
                    placeholder="Full name of person collecting materials"
                  />
                </Field>

                <Field label="Collector ID Number" required>
                  <input
                    required={form.requiresGateClearance}
                    className={inputCls}
                    value={form.gc_collector_id_number}
                    onChange={(e) => setForm({ ...form, gc_collector_id_number: e.target.value })}
                    placeholder="National ID or employee ID"
                  />
                </Field>

                <Field label="Collector Phone Number" required>
                  <input
                    type="tel"
                    required={form.requiresGateClearance}
                    className={inputCls}
                    value={form.gc_collector_phone}
                    onChange={(e) => setForm({ ...form, gc_collector_phone: e.target.value })}
                    placeholder="+251..."
                  />
                </Field>

                <Field label="Vehicle Registration (Optional)">
                  <input
                    className={inputCls}
                    value={form.gc_vehicle_registration}
                    onChange={(e) => setForm({ ...form, gc_vehicle_registration: e.target.value })}
                    placeholder="Vehicle plate number (if applicable)"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave blank if materials will be collected on foot
                  </p>
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Scheduled Pickup Date" required>
                    <input
                      type="date"
                      required={form.requiresGateClearance}
                      className={inputCls}
                      value={form.gc_scheduled_pickup_date}
                      onChange={(e) => setForm({ ...form, gc_scheduled_pickup_date: e.target.value })}
                    />
                  </Field>

                  <Field label="Scheduled Pickup Time" required>
                    <input
                      type="time"
                      required={form.requiresGateClearance}
                      className={inputCls}
                      value={form.gc_scheduled_pickup_time}
                      onChange={(e) => setForm({ ...form, gc_scheduled_pickup_time: e.target.value })}
                    />
                  </Field>
                </div>

                <Field label="Justification / Purpose" required>
                  <textarea
                    required={form.requiresGateClearance}
                    className={inputCls}
                    value={form.gc_pickup_justification}
                    onChange={(e) => setForm({ ...form, gc_pickup_justification: e.target.value })}
                    placeholder="Explain why materials need to leave campus"
                    rows={3}
                  />
                </Field>
              </div>
            )}
          </div>
        </form>
      </Modal>
      
      {/* Create SIV Modal */}
      <Modal
        open={createSIVModal}
        onClose={() => setCreateSIVModal(false)}
        title={`Create Preliminary Voucher (Model 20) — ${selectedRequisition?.refNo}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateSIVModal(false)}>
              Cancel
            </Button>
            <Button
              form="create-siv-form"
              type="submit"
              disabled={saving}
            >
              {saving ? "Creating…" : "Create SIV"}
            </Button>
          </>
        }
      >
        <form id="create-siv-form" onSubmit={submitCreateSIV}>
          {selectedRequisition && (
            <div className="space-y-4">
              {/* Requisition Details */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100 mb-3">
                  📋 Requisition Details
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">Ref No:</span>
                    <p className="font-semibold">{selectedRequisition.refNo}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Department:</span>
                    <p className="font-semibold">{selectedRequisition.department}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Material:</span>
                    <p className="font-semibold">{selectedRequisition.itemName}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Quantity:</span>
                    <p className="font-semibold">{selectedRequisition.qty} {selectedRequisition.itemUnit || 'units'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Store:</span>
                    <p className="font-semibold">{selectedRequisition.storeName}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Requested By:</span>
                    <p className="font-semibold">{selectedRequisition.requestedByName || '—'}</p>
                  </div>
                </div>
              </div>

              {/* Gate Clearance Details from Requisition */}
              {selectedRequisition.requires_gate_clearance && (
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield size={18} className="text-amber-600" />
                    <h4 className="font-semibold text-sm text-amber-900 dark:text-amber-100">
                      Gate Clearance Required
                    </h4>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-medium text-muted-foreground">Collector Name:</span>
                      <p className="font-semibold">{selectedRequisition.gc_collector_name || '—'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Collector ID:</span>
                      <p className="font-semibold">{selectedRequisition.gc_collector_id_number || '—'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Phone:</span>
                      <p className="font-semibold">{selectedRequisition.gc_collector_phone || '—'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Vehicle:</span>
                      <p className="font-semibold">{selectedRequisition.gc_vehicle_registration || 'On foot'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Pickup Date:</span>
                      <p className="font-semibold">
                        {selectedRequisition.gc_scheduled_pickup_date 
                          ? new Date(selectedRequisition.gc_scheduled_pickup_date).toLocaleDateString()
                          : '—'}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Pickup Time:</span>
                      <p className="font-semibold">{selectedRequisition.gc_scheduled_pickup_time || '—'}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium text-muted-foreground">Justification:</span>
                      <p className="font-semibold">{selectedRequisition.gc_pickup_justification || '—'}</p>
                    </div>
                  </div>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-3">
                    ℹ️ Gate clearance request will be automatically created with these details. Campus Security Officer approval is required before PAO can approve.
                  </p>
                </div>
              )}

              {/* Gate Clearance Option (for requisitions that don't have it) */}
              {!selectedRequisition.requires_gate_clearance && (
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={requiresGateClearance}
                      onChange={(e) => setRequiresGateClearance(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-gray-300"
                    />
                    <div>
                      <div className="font-semibold text-sm flex items-center gap-2">
                        <Shield size={16} className="text-amber-600" />
                        Materials will leave campus grounds
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Check this if materials need to be taken off campus. Security Officer pre-approval will be required.
                      </p>
                      {requiresGateClearance && (
                        <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">
                          ⚠️ Note: Collector details were not provided in the requisition. Default placeholder values will be used.
                        </p>
                      )}
                    </div>
                  </label>
                </div>
              )}

              <p className="text-sm text-muted-foreground">
                This will create a <strong>Preliminary Voucher (Model 20)</strong> which must be reviewed and approved by PAO before materials can be issued.
              </p>
            </div>
          )}
        </form>
      </Modal>
      
      {/* Review/Approval Modal */}
      <Modal
        open={reviewModal}
        onClose={closeReviewModal}
        title={`${reviewDecision === "Approved" ? "Approve" : "Reject"} Requisition — ${reviewTarget?.refNo}`}
        footer={
          <>
            <Button variant="secondary" onClick={closeReviewModal}>
              Cancel
            </Button>
            <Button
              form="review-form"
              type="submit"
              disabled={saving}
              variant={reviewDecision === "Approved" ? "primary" : "danger"}
            >
              {saving ? "Processing…" : `Confirm ${reviewDecision}`}
            </Button>
          </>
        }
      >
        <form id="review-form" onSubmit={submitReview}>
          {reviewTarget && (
            <div className="space-y-4">
              {/* Requisition Details */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100 mb-3">
                  📋 Requisition Details - Please Review
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">Ref No:</span>
                    <p className="font-semibold">{reviewTarget.refNo}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Department:</span>
                    <p className="font-semibold">{reviewTarget.department}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Material:</span>
                    <p className="font-semibold">{reviewTarget.itemName}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Quantity:</span>
                    <p className="font-semibold">{reviewTarget.qty} {reviewTarget.itemUnit || 'units'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Store:</span>
                    <p className="font-semibold">{reviewTarget.storeName}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Requested By:</span>
                    <p className="font-semibold">{reviewTarget.requestedByName || '—'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Date:</span>
                    <p className="font-semibold">{new Date(reviewTarget.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Status:</span>
                    <Badge>{reviewTarget.status}</Badge>
                  </div>
                </div>
              </div>

              {/* Remarks */}
              <Field label="Remarks (Optional)">
                <textarea
                  className={inputCls}
                  rows={3}
                  value={reviewRemarks}
                  onChange={(e) => setReviewRemarks(e.target.value)}
                  placeholder="Add any comments or notes about this decision..."
                />
              </Field>

              {/* Password Confirmation for PAO */}
              {canApprovePao && (
                <Field label="Confirm Password *" required>
                  <input
                    type="password"
                    className={inputCls}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Enter your password to confirm"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    🔒 Password confirmation required for PAO approval
                  </p>
                </Field>
              )}
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}
