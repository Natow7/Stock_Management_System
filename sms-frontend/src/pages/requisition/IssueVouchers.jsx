import React, { useState } from "react";
import { PackageCheck, Pencil, ShieldAlert, Shield, AlertCircle, CheckCircle, Clock, Printer, XCircle } from "lucide-react";
import { useApp } from "../../context/AppContext.jsx";
import { Link } from "react-router-dom";
import { printModel20 } from "../../utils/printModel20.js";
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

export default function IssueVouchers() {
  const {
    issueVouchers,
    finalizeVoucher,
    recordGateClearance,
    amendVoucher,
    approveVoucher,
    currentUser,
  } = useApp();
  const canFinalize = currentUser?.role === "Store Head";
  const canAmend = currentUser?.role === "Store Head"; // Store Head amends before approval
  const isStoreHead = currentUser?.role === "Store Head";
  const isDepartmentHead = currentUser?.role === "Department Head";
  const canApprove = [
    "Property Administration Officer",
    "Department Head",
  ].includes(currentUser?.role);
  const canClearGate = currentUser?.role === "Campus Security Officer";

  const [amendTarget, setAmendTarget] = useState(null);
  const [qty, setQty] = useState(1);
  const [requiresGateClearance, setRequiresGateClearance] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [approvalDecision, setApprovalDecision] = useState(null);
  const [approvalRemarks, setApprovalRemarks] = useState("");
  const [confirmationPassword, setConfirmationPassword] = useState("");

  function openAmend(voucher) {
    console.log('Opening amend for voucher:', voucher); // Debug log
    setAmendTarget(voucher);
    setQty(voucher.qty);
    // Handle both snake_case and camelCase
    const gateFlag = voucher.requires_gate_clearance ?? voucher.requiresGateClearance ?? false;
    console.log('Gate clearance flag:', gateFlag); // Debug log
    setRequiresGateClearance(gateFlag);
  }

  function openReview(voucher, decision) {
    setReviewTarget(voucher);
    setApprovalDecision(decision);
    setApprovalRemarks("");
    setConfirmationPassword("");
  }

  async function submitApproval(e) {
    e.preventDefault();
    setSaving(true);
    const { ok } = await approveVoucher(
      reviewTarget.id, 
      approvalDecision, 
      approvalRemarks,
      confirmationPassword
    );
    setSaving(false);
    if (ok) {
      setReviewTarget(null);
      setApprovalDecision(null);
      setApprovalRemarks("");
      setConfirmationPassword("");
    }
  }

  async function submitAmend(e) {
    e.preventDefault();
    setSaving(true);
    const { ok } = await amendVoucher(amendTarget.id, {
      qty: Number(qty),
      requires_gate_clearance: requiresGateClearance
    });
    setSaving(false);
    if (ok) setAmendTarget(null);
  }

  // Backend handles role-based filtering
  // Filter out fully returned vouchers from normal view (keep in audit logs only)
  const visibleVouchers = issueVouchers.filter(v => v.status !== 'Closed - Fully Returned');

  return (
    <div>
      <PageHeader
        title="Store / Inter-Store Issue Vouchers (SIV / ISIV)"
        description={
          isDepartmentHead 
            ? "View and print vouchers for materials ready to collect from the store."
            : "Preliminary vouchers (Model 20) can be amended and approved, then finalized into the official issue voucher (Model 22), which deducts stock automatically."
        }
      />

      <DataTable
        searchKeys={["refNo", "requisitionRef"]}
        columns={[
          { key: "refNo", header: "Voucher No." },
          {
            key: "requisitionRef",
            header: "Requisition Ref.",
            render: (r) => r.requisitionRef || "—",
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
          { key: "model", header: "Form" },
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
            key: "gateClearance",
            header: "Gate Clearance",
            render: (r) => {
              // Check if gate clearance is required for this voucher
              const requiresClearance = r.requiresGateClearance || r.requires_gate_clearance;
              
              if (!requiresClearance) {
                // Materials staying on campus - show for ALL statuses
                return (
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-xs font-semibold">On Campus</span>
                  </div>
                );
              }

              // Gate clearance IS required - show approval status
              if (r.gate_clearance_approved || r.gateClearanceApproved) {
                return (
                  <div className="flex items-center gap-1.5 text-emerald-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-xs font-semibold">Clearance Approved</span>
                  </div>
                );
              }

              if (r.clearance_request_status === "Pending" || r.clearanceRequestStatus === "Pending") {
                return (
                  <div className="flex items-center gap-1.5 text-amber-600">
                    <Clock className="h-4 w-4" />
                    <span className="text-xs font-semibold">Clearance Pending</span>
                  </div>
                );
              }

              if (r.clearance_request_status === "Rejected" || r.clearanceRequestStatus === "Rejected") {
                return (
                  <div className="flex items-center gap-1.5 text-rose-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-xs font-semibold">Clearance Rejected</span>
                  </div>
                );
              }

              // Gate clearance required but not requested yet
              return (
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Shield className="h-4 w-4" />
                  <span className="text-xs">Clearance Needed</span>
                </div>
              );
            },
          },
          {
            key: "actions",
            header: "Action",
            render: (r) =>
              r.status === "Preliminary" ||
              r.status === "Approved" ||
              r.status === "Issued" ? (
                <div className="flex gap-2 flex-wrap">
                  {/* Print Model 20 button - Always available for Preliminary/Approved */}
                  {(r.status === "Preliminary" || r.status === "Approved") && (
                    <button
                      onClick={() => printModel20(r)}
                      className="flex items-center gap-1 text-xs font-medium text-blue-700 hover:underline"
                      title="Print/Download Model 20 Form"
                    >
                      <Printer size={12} /> Print Model 20
                    </button>
                  )}
                  
                  {/* Amend button - ONLY for Preliminary vouchers (before PAO approval) */}
                  {r.status === "Preliminary" && canAmend && (
                    <button
                      onClick={() => openAmend(r)}
                      className="flex items-center gap-1 text-xs font-medium text-navy-700 hover:underline"
                    >
                      <Pencil size={12} /> Amend
                    </button>
                  )}
                  
                  {/* Gate Clearance status - AUTOMATIC (read-only for Store Head) */}
                  {r.status === "Preliminary" && (r.requiresGateClearance || r.requires_gate_clearance) && isStoreHead && (
                    <div className="text-xs">
                      {(r.gateClearanceApproved || r.gate_clearance_approved) ? (
                        <div className="flex items-center gap-1 text-emerald-600 font-semibold">
                          <CheckCircle size={12} /> Security Approved
                        </div>
                      ) : (r.clearanceRequestStatus === "Rejected" || r.clearance_request_status === "Rejected") ? (
                        <div className="flex items-center gap-1 text-rose-600 font-semibold">
                          <XCircle size={12} /> Security Rejected
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-amber-600">
                          <Clock size={12} /> Awaiting Security
                        </div>
                      )}
                    </div>
                  )}
                  
                  {r.status === "Preliminary" && canApprove && (
                    <>
                      {/* Check if gate clearance is blocking PAO approval */}
                      {r.requiresGateClearance && !r.gateClearanceApproved ? (
                        <div className="flex items-center gap-2 text-xs">
                          <div className="flex items-center gap-1 text-amber-600 font-semibold">
                            <Shield size={14} /> Needs Security Approval First
                          </div>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => openReview(r, "Approved")}
                            className="text-xs font-medium text-emerald-700 hover:underline"
                          >
                            Approve Model 20
                          </button>
                          <button
                            onClick={() => openReview(r, "Rejected")}
                            className="text-xs font-medium text-rose-600 hover:underline"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </>
                  )}
                  {r.status === "Approved" && canFinalize && (
                    <button
                      onClick={() => finalizeVoucher(r.id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                      title="Finalize voucher as Model 22 (Final Issue)"
                    >
                      <PackageCheck size={14} /> Finalize Model 22
                    </button>
                  )}
                  {r.status === "Issued" && (
                    <>
                      <button
                        onClick={() => printModel22(r)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                        title="Print/Download Model 22 Form (Final Issue)"
                      >
                        <Printer size={12} /> Print Model 22
                      </button>
                      
                      {/* Show collection details for Department Heads */}
                      {isDepartmentHead && (
                        <div className="text-xs text-slate-600 dark:text-slate-400 ml-2">
                          <div className="font-semibold text-emerald-600">✓ Ready for Collection</div>
                          {r.storeName && <div>From: {r.storeName}</div>}
                        </div>
                      )}
                    </>
                  )}
                  {r.status === "Issued" &&
                    canClearGate &&
                    (r.gateClearance ? (
                      <span className="text-xs font-medium text-emerald-700">
                        Cleared
                      </span>
                    ) : (
                      <button
                        onClick={() => recordGateClearance(r.id)}
                        className="flex items-center gap-1 text-xs font-medium text-navy-700 hover:underline"
                      >
                        <ShieldAlert size={12} /> Record Gate Clearance
                      </button>
                    ))}
                </div>
              ) : (
                <span className="text-xs text-slate-300">—</span>
              ),
          },
        ]}
        rows={visibleVouchers}
      />

      <Modal
        open={!!amendTarget}
        onClose={() => setAmendTarget(null)}
        title={`Amend Voucher — ${amendTarget?.refNo || ""}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setAmendTarget(null)}>
              Cancel
            </Button>
            <Button form="amend-form" type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save Amendment"}
            </Button>
          </>
        }
      >
        <form id="amend-form" onSubmit={submitAmend}>
          {/* Show Original Requisition Details */}
          {amendTarget && (
            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100 mb-2">
                📋 Original Requisition Details
              </h4>
              <div className="space-y-1 text-sm">
                <div><span className="font-medium">Ref:</span> {amendTarget.requisition_ref || amendTarget.requisitionRef || '—'}</div>
                <div><span className="font-medium">Requested by:</span> {amendTarget.requested_by_name || amendTarget.requestedByName || '—'} {amendTarget.requested_by_email && `(${amendTarget.requested_by_email})`}</div>
                <div><span className="font-medium">Department:</span> {amendTarget.requisition_department || amendTarget.requisitionDepartment || '—'}</div>
                <div><span className="font-medium">Item:</span> {amendTarget.item_name || amendTarget.itemName || '—'}</div>
                <div><span className="font-medium">Quantity:</span> {amendTarget.qty || '—'}</div>
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-3">
                💡 Contact the requester to confirm delivery destination before deciding on gate clearance
              </p>
            </div>
          )}
          
          <Field label={amendTarget?.status === "Approved" ? "Quantity (Read-only)" : "Amended Quantity"}>
            <input
              type="number"
              min="1"
              required
              className={inputCls}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              readOnly={amendTarget?.status === "Approved"}
              disabled={amendTarget?.status === "Approved"}
            />
            {amendTarget?.status === "Approved" && (
              <p className="text-xs text-amber-600 mt-1">
                ⚠️ Quantity cannot be changed after PAO approval. Only gate clearance flag can be updated.
              </p>
            )}
          </Field>
          
          <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={requiresGateClearance}
                onChange={(e) => setRequiresGateClearance(e.target.checked)}
                className="mt-1 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-amber-600" />
                  <span className="font-semibold text-foreground">Materials Leaving Campus</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Check this if materials will exit campus gates. Security Officer pre-approval will be required before finalization.
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                  ℹ️ Most materials stay on campus and don't need gate clearance. Only check if materials are going to off-campus locations.
                </p>
              </div>
            </label>
          </div>
          
          <p className="text-xs text-slate-400 mt-4">
            Only a Preliminary Model 20 voucher can be amended, before approval.
          </p>
        </form>
      </Modal>

      {/* Review and Approval Modal */}
      <Modal
        open={!!reviewTarget}
        onClose={() => setReviewTarget(null)}
        title={`${approvalDecision === "Approved" ? "Approve" : "Reject"} Voucher — ${reviewTarget?.ref_no || reviewTarget?.refNo}`}
        actions={
          <>
            <Button variant="secondary" onClick={() => setReviewTarget(null)}>
              Cancel
            </Button>
            <Button 
              form="approval-form" 
              type="submit" 
              disabled={saving}
              variant={approvalDecision === "Approved" ? "primary" : "danger"}
            >
              {saving ? "Processing…" : `Confirm ${approvalDecision === "Approved" ? "Approval" : "Rejection"}`}
            </Button>
          </>
        }
      >
        <form id="approval-form" onSubmit={submitApproval}>
          {/* Show Voucher Details for Review */}
          {reviewTarget && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100 mb-3">
                  📋 Voucher Details - Please Review Before {approvalDecision === "Approved" ? "Approving" : "Rejecting"}
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">Voucher Ref:</span>
                    <p className="font-semibold">{reviewTarget.ref_no || reviewTarget.refNo}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Requisition:</span>
                    <p className="font-semibold">{reviewTarget.requisition_ref || reviewTarget.requisitionRef}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Item:</span>
                    <p className="font-semibold">{reviewTarget.item_name || reviewTarget.itemName}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Quantity:</span>
                    <p className="font-semibold">{reviewTarget.qty}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Store:</span>
                    <p className="font-semibold">{reviewTarget.store_name || reviewTarget.storeName}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Requested by:</span>
                    <p className="font-semibold">{reviewTarget.requested_by_name || reviewTarget.requestedByName || '—'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Department:</span>
                    <p className="font-semibold">{reviewTarget.requisition_department || reviewTarget.requisitionDepartment || '—'}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium text-muted-foreground">Gate Clearance Status:</span>
                    <div className="mt-1">
                      {(reviewTarget.requires_gate_clearance || reviewTarget.requiresGateClearance) ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-amber-600" />
                            <span className="font-semibold text-amber-600">Materials Leaving Campus</span>
                          </div>
                          {reviewTarget.gateClearanceApproved || reviewTarget.gate_clearance_approved ? (
                            <div className="flex items-center gap-2 p-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded">
                              <CheckCircle className="h-5 w-5 text-emerald-600" />
                              <div>
                                <div className="font-semibold text-emerald-700">Security Clearance: APPROVED</div>
                                {reviewTarget.clearanceCollectorName && (
                                  <div className="text-xs text-emerald-600">
                                    Collector: {reviewTarget.clearanceCollectorName}
                                    {reviewTarget.clearancePickupDate && ` • Pickup: ${new Date(reviewTarget.clearancePickupDate).toLocaleDateString()}`}
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : reviewTarget.clearanceRequestStatus === "Pending" ? (
                            <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded">
                              <Clock className="h-5 w-5 text-amber-600" />
                              <div>
                                <div className="font-semibold text-amber-700">Security Clearance: PENDING</div>
                                <div className="text-xs text-amber-600">Awaiting Security Officer review</div>
                              </div>
                            </div>
                          ) : reviewTarget.clearanceRequestStatus === "Rejected" ? (
                            <div className="flex items-center gap-2 p-2 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded">
                              <XCircle className="h-5 w-5 text-rose-600" />
                              <div>
                                <div className="font-semibold text-rose-700">Security Clearance: REJECTED</div>
                                <div className="text-xs text-rose-600">New request needed</div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800 rounded">
                              <AlertCircle className="h-5 w-5 text-slate-600" />
                              <div>
                                <div className="font-semibold text-slate-700">Security Clearance: NOT REQUESTED</div>
                                <div className="text-xs text-slate-600">Store Head must request clearance first</div>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800 rounded">
                          <CheckCircle className="h-5 w-5 text-slate-600" />
                          <span className="font-semibold text-slate-700">Materials staying on campus - No clearance required</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-3">
                  ⚠️ <strong>Note:</strong> Please review all details including gate clearance status before {approvalDecision === "Approved" ? "approving" : "rejecting"}.
                  {(reviewTarget.requires_gate_clearance || reviewTarget.requiresGateClearance) && !reviewTarget.gateClearanceApproved && (
                    <span className="block mt-1 text-amber-600 font-semibold">
                      ⚠️ Materials are leaving campus but security clearance is not approved yet. Consider this in your decision.
                    </span>
                  )}
                </p>
              </div>

              <Field label="Remarks (Optional)">
                <textarea
                  className={inputCls}
                  rows={3}
                  value={approvalRemarks}
                  onChange={(e) => setApprovalRemarks(e.target.value)}
                  placeholder="Add any comments or notes..."
                />
              </Field>

              <Field label="Confirmation Password" required>
                <input
                  type="password"
                  required
                  className={inputCls}
                  value={confirmationPassword}
                  onChange={(e) => setConfirmationPassword(e.target.value)}
                  placeholder="Enter your password to confirm"
                />
              </Field>

              <p className="text-xs text-slate-500">
                🔒 Enter your password to confirm this {approvalDecision === "Approved" ? "approval" : "rejection"} decision.
              </p>
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}
