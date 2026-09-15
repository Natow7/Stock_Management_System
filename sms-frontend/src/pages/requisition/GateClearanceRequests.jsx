import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Shield,
  Clock,
  User,
  Phone,
  Calendar,
  Truck,
  FileText,
  Plus,
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
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
import api from "../../lib/api.js";

export default function GateClearanceRequests() {
  const { currentUser, issueVouchers, showToast } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [clearanceRequests, setClearanceRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  
  // Security Officer modals
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [securityNotes, setSecurityNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  
  // Gate Guard modals
  const [showRecordExitModal, setShowRecordExitModal] = useState(false);
  const [selectedForExit, setSelectedForExit] = useState(null);
  const [exitNotes, setExitNotes] = useState("");
  
  const isStoreHead = currentUser?.role === "Store Head";
  const isSecurityOfficer = currentUser?.role === "Campus Security Officer";
  const isGateGuard = currentUser?.role === "Gate Security Guard";
  
  // Gate Guard can VIEW approved requests and RECORD physical exits
  const canApproveRequests = isSecurityOfficer;
  const canRecordExits = isGateGuard;

  // Form state for new request
  const [formData, setFormData] = useState({
    collector_name: "",
    collector_id_number: "",
    collector_phone: "",
    collector_department: "",
    vehicle_registration: "",
    scheduled_pickup_date: "",
    scheduled_pickup_time: "",
    pickup_justification: "",
  });

  // Load clearance requests
  useEffect(() => {
    loadClearanceRequests();
  }, []);

  // Auto-open modal if voucher ID in URL
  useEffect(() => {
    const voucherId = searchParams.get('voucher');
    if (voucherId && issueVouchers.length > 0) {
      const voucher = issueVouchers.find(v => v.id === voucherId);
      if (voucher) {
        openRequestModal(voucher);
        setSearchParams({});
      }
    }
  }, [searchParams, issueVouchers]);

  async function loadClearanceRequests() {
    setLoading(true);
    try {
      console.log("🔵 Loading clearance requests...");
      const response = await api.gateClearance.list();
      console.log("🔵 API Response:", response);
      const requests = response?.data?.clearanceRequests || response?.data?.clearance_requests || [];
      console.log("🔵 Parsed requests:", requests.length, "items");
      if (requests.length > 0) {
        console.log("🔵 First request sample:", requests[0]);
      }
      setClearanceRequests(requests);
    } catch (error) {
      console.error("❌ Error loading clearance requests:", error);
      showToast("Failed to load clearance requests", "warn");
    } finally {
      setLoading(false);
    }
  }

  // Get vouchers that need clearance
  // NEW WORKFLOW ONLY: Gate clearance during Preliminary stage (BEFORE PAO approval)
  // This ensures Security Officer approves BEFORE PAO can finalize the voucher
  const vouchersNeedingClearance = issueVouchers.filter(
    (v) => {
      // Only Preliminary vouchers can request gate clearance
      // Check both camelCase and snake_case field names for compatibility
      const requiresClearance = v.requiresGateClearance === true || v.requires_gate_clearance === true;
      const alreadyApproved = v.gateClearanceApproved === true || v.gate_clearance_approved === true;
      const requestStatus = v.clearanceRequestStatus || v.clearance_request_status;
      
      return v.status === "Preliminary" && 
             requiresClearance && 
             !alreadyApproved &&
             (!requestStatus || requestStatus === "Rejected" || requestStatus === "Cancelled");
    }
  );

  function openRequestModal(voucher) {
    setSelectedVoucher(voucher);
    setShowRequestModal(true);
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setFormData({
      ...formData,
      scheduled_pickup_date: tomorrow.toISOString().split('T')[0],
      scheduled_pickup_time: "09:00",
    });
  }

  function closeRequestModal() {
    setShowRequestModal(false);
    setSelectedVoucher(null);
    setFormData({
      collector_name: "",
      collector_id_number: "",
      collector_phone: "",
      collector_department: "",
      vehicle_registration: "",
      scheduled_pickup_date: "",
      scheduled_pickup_time: "",
      pickup_justification: "",
    });
  }

  async function submitClearanceRequest(e) {
    e.preventDefault();
    if (!selectedVoucher) return;

    console.log("Submitting gate clearance request...");
    console.log("Selected Voucher:", selectedVoucher);
    console.log("Form Data:", formData);

    setLoading(true);
    try {
      const payload = {
        issue_voucher_id: selectedVoucher.id,
        ...formData,
      };
      console.log("Request Payload:", payload);
      
      const response = await api.gateClearance.create(payload);
      console.log("Response:", response);

      showToast("Gate clearance request submitted successfully");
      closeRequestModal();
      await loadClearanceRequests();
      // Reload vouchers to update status
      window.location.reload();
    } catch (error) {
      console.error("Error submitting clearance request:", error);
      console.error("Error details:", error.response?.data);
      showToast(
        error.message || error.response?.data?.message || "Failed to submit clearance request",
        "warn"
      );
    } finally {
      setLoading(false);
    }
  }

  async function cancelRequest(requestId) {
    if (!window.confirm("Are you sure you want to cancel this clearance request?")) {
      return;
    }

    setLoading(true);
    try {
      await api.gateClearance.cancel(requestId);
      showToast("Clearance request cancelled");
      await loadClearanceRequests();
      window.location.reload();
    } catch (error) {
      console.error("Error cancelling request:", error);
      showToast(error.response?.data?.message || "Failed to cancel request", "warn");
    } finally {
      setLoading(false);
    }
  }

  function getStatusBadge(status) {
    const variants = {
      Pending: "warning",
      Approved: "success",
      Rejected: "danger",
      Cancelled: "secondary",
      Collected: "info",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  }

  function getStatusIcon(status) {
    switch (status) {
      case "Approved":
        return <CheckCircle className="h-5 w-5 text-emerald-600" />;
      case "Rejected":
        return <XCircle className="h-5 w-5 text-rose-600" />;
      case "Pending":
        return <Clock className="h-5 w-5 text-amber-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-slate-600" />;
    }
  }

  // Security Officer: Open approve modal
  function openApproveModal(request) {
    setSelectedRequest(request);
    setSecurityNotes("");
    setShowApproveModal(true);
  }

  // Security Officer: Open reject modal
  function openRejectModal(request) {
    setSelectedRequest(request);
    setRejectionReason("");
    setSecurityNotes("");
    setShowRejectModal(true);
  }

  // Security Officer: Approve request
  async function approveRequest(e) {
    e.preventDefault();
    if (!selectedRequest) return;

    setLoading(true);
    try {
      await api.gateClearance.approve(
        selectedRequest.id,
        securityNotes
      );

      showToast("Gate clearance approved successfully");
      setShowApproveModal(false);
      setSelectedRequest(null);
      setSecurityNotes("");
      await loadClearanceRequests();
    } catch (error) {
      console.error("Error approving request:", error);
      showToast(
        error.response?.data?.message || "Failed to approve clearance request",
        "warn"
      );
    } finally {
      setLoading(false);
    }
  }

  // Security Officer: Reject request
  async function rejectRequest(e) {
    e.preventDefault();
    if (!selectedRequest || !rejectionReason.trim()) {
      showToast("Rejection reason is required", "warn");
      return;
    }

    setLoading(true);
    try {
      await api.gateClearance.reject(
        selectedRequest.id,
        rejectionReason,
        securityNotes
      );

      showToast("Gate clearance rejected");
      setShowRejectModal(false);
      setSelectedRequest(null);
      setRejectionReason("");
      setSecurityNotes("");
      await loadClearanceRequests();
    } catch (error) {
      console.error("Error rejecting request:", error);
      showToast(
        error.response?.data?.message || "Failed to reject clearance request",
        "warn"
      );
    } finally {
      setLoading(false);
    }
  }

  // Gate Guard: Open record exit modal
  function openRecordExitModal(request) {
    console.log("🔵 openRecordExitModal called with:", request);
    setSelectedForExit(request);
    console.log("🔵 Setting selectedForExit to:", request);
    setExitNotes("");
    setShowRecordExitModal(true);
    console.log("🔵 Modal state set to true");
    console.log("🔵 selectedForExit after set:", request); // This won't show the updated state immediately due to React batching
  }

  // Gate Guard: Record physical exit
  async function recordPhysicalExit(e) {
    e.preventDefault();
    if (!selectedForExit) return;

    console.log("🔵 Recording exit for:", selectedForExit);
    console.log("🔵 Issue Voucher ID:", selectedForExit.issueVoucherId);
    console.log("🔵 Exit Notes:", exitNotes);

    setLoading(true);
    try {
      // Record exit on the issue voucher
      const result = await api.issueVouchers.recordGateClearance(
        selectedForExit.issueVoucherId,
        exitNotes
      );
      
      console.log("✅ Exit recorded successfully:", result);

      showToast("Physical exit recorded successfully");
      setShowRecordExitModal(false);
      setSelectedForExit(null);
      setExitNotes("");
      await loadClearanceRequests();
    } catch (error) {
      console.error("❌ Error recording exit:", error);
      console.error("❌ Error details:", error.response?.data);
      showToast(
        error.response?.data?.message || error.message || "Failed to record physical exit",
        "warn"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gate Clearance Requests"
        description={
          isStoreHead
            ? "Request Security Officer pre-approval for materials leaving campus. Clearance must be approved BEFORE PAO can finalize the voucher."
            : isGateGuard
            ? "Record physical exits of materials passing through the gate. Only approved clearances can exit."
            : "Review and approve gate clearance requests during Preliminary stage (BEFORE PAO approval)."
        }
      />

      {/* Store Head: Vouchers Needing Clearance */}
      {isStoreHead && vouchersNeedingClearance.length > 0 && (
        <div className="rounded-xl border-2 border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
              <Shield className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-foreground mb-2">
                Vouchers Requiring Gate Clearance
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Request security clearance for materials leaving campus during Preliminary stage.
                Security Officer approval is REQUIRED before PAO can finalize the voucher.
              </p>
              <div className="space-y-2">
                {vouchersNeedingClearance.map((voucher) => (
                  <div
                    key={voucher.id}
                    className="flex items-center justify-between rounded-lg bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800"
                  >
                    <div className="flex-1">
                      <div className="font-semibold text-foreground">
                        {voucher.refNo}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {voucher.itemName} • Qty: {voucher.qty}
                      </div>
                    </div>
                    <Button
                      onClick={() => openRequestModal(voucher)}
                      size="sm"
                      className="bg-university-600 hover:bg-university-700"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Request Clearance</span>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clearance Requests Table */}
      <div className="rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <h3 className="text-lg font-bold text-foreground mb-4">
          {isStoreHead ? "My Clearance Requests" : "Pending Clearance Requests"}
        </h3>
        
        {clearanceRequests.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="h-16 w-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
            <p className="text-muted-foreground">No clearance requests found</p>
          </div>
        ) : (
          <>
            {console.log("🟢 Rendering table with", clearanceRequests.length, "requests")}
            {console.log("🟢 First request keys:", clearanceRequests[0] ? Object.keys(clearanceRequests[0]) : "none")}
            {console.log("🟢 First request data:", clearanceRequests[0])}
            <DataTable
            searchKeys={["voucherRef", "collectorName", "collectorIdNumber"]}
            columns={[
              {
                key: "status",
                header: "Status",
                render: (row) => (
                  <div className="flex items-center gap-2">
                    {getStatusIcon(row.status)}
                    {getStatusBadge(row.status)}
                  </div>
                ),
              },
              {
                key: "voucherRef",
                header: "Voucher",
                render: (row) => (
                  <div>
                    <div className="font-semibold text-foreground">{row.voucherRef}</div>
                    <div className="text-xs text-muted-foreground">{row.storeName}</div>
                  </div>
                ),
              },
              {
                key: "collectorName",
                header: "Collector",
                render: (row) => (
                  <div>
                    <div className="font-medium text-foreground">{row.collectorName}</div>
                    <div className="text-xs text-muted-foreground">
                      ID: {row.collectorIdNumber}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {row.collectorPhone}
                    </div>
                  </div>
                ),
              },
              {
                key: "scheduledPickupDate",
                header: "Scheduled Pickup",
                render: (row) => (
                  <div>
                    <div className="font-medium text-foreground">
                      {row.scheduledPickupDate 
                        ? new Date(row.scheduledPickupDate).toLocaleDateString()
                        : "—"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {row.scheduledPickupTime?.substring(0, 5) || "—"}
                    </div>
                    {row.hoursUntilPickup !== null && row.hoursUntilPickup < 24 && row.hoursUntilPickup > 0 && (
                      <div className="text-xs font-semibold text-amber-600 mt-1">
                        In {Math.round(row.hoursUntilPickup)} hours
                      </div>
                    )}
                  </div>
                ),
              },
              {
                key: "vehicleRegistration",
                header: "Vehicle",
                render: (row) => row.vehicleRegistration || "—",
              },
              {
                key: "pickupJustification",
                header: "Justification",
                render: (row) => (
                  <div className="max-w-xs truncate text-sm text-muted-foreground">
                    {row.pickupJustification || "—"}
                  </div>
                ),
              },
              {
                key: "createdAt",
                header: "Requested",
                render: (row) => (
                  <div>
                    <div className="text-sm text-muted-foreground">
                      {row.createdAt 
                        ? new Date(row.createdAt).toLocaleDateString()
                        : "—"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      by {row.requestedByName || "—"}
                    </div>
                  </div>
                ),
              },
              {
                key: "actions",
                header: "Actions",
                render: (row) => (
                  <div className="flex flex-col gap-2">
                    {/* Store Head Actions */}
                    {isStoreHead && row.status === "Pending" && (
                      <button
                        onClick={() => cancelRequest(row.id)}
                        className="text-xs font-medium text-rose-600 hover:underline"
                      >
                        Cancel
                      </button>
                    )}
                    
                    {/* Security Officer Actions - Only Campus Security Officer can approve/reject */}
                    {canApproveRequests && row.status === "Pending" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => openApproveModal(row)}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                        >
                          ✓ Approve
                        </button>
                        <button
                          onClick={() => openRejectModal(row)}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors"
                        >
                          ✗ Reject
                        </button>
                      </div>
                    )}
                    
                    {/* Gate Guard Actions - Record physical exit for approved clearances with issued vouchers */}
                    {canRecordExits && row.status === "Approved" && row.voucherStatus === "Issued" && !row.clearedAt && (
                      <button
                        onClick={() => {
                          console.log("🔴 BUTTON CLICKED! Request:", row);
                          openRecordExitModal(row);
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <CheckCircle size={14} />
                        Record Exit
                      </button>
                    )}
                    
                    {/* Exit Recorded */}
                    {row.clearedAt && (
                      <div className="text-xs text-blue-600 font-semibold">
                        <div>✓ Exit Recorded</div>
                        <div className="text-muted-foreground">
                          {new Date(row.clearedAt).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                    
                    {/* Status Display */}
                    {row.status === "Rejected" && (
                      <div className="text-xs text-rose-600">
                        <div className="font-semibold">Rejected</div>
                        <div className="max-w-xs truncate">{row.rejectionReason}</div>
                      </div>
                    )}
                    {row.status === "Approved" && (
                      <div className="text-xs text-emerald-600 font-semibold">
                        <div>Approved</div>
                        <div className="text-muted-foreground">
                          by {row.approvedByName}
                        </div>
                      </div>
                    )}
                  </div>
                ),
              },
            ]}
            rows={clearanceRequests}
          />
          </>
        )}
      </div>

      {/* Request Clearance Modal */}
      {showRequestModal && selectedVoucher && (
        <Modal
          isOpen={showRequestModal}
          onClose={closeRequestModal}
          title="Request Gate Clearance"
          size="large"
        >
          <form onSubmit={submitClearanceRequest} className="space-y-6">
            {/* Voucher Info */}
            <div className="rounded-lg bg-slate-50 dark:bg-slate-900/50 p-4">
              <div className="text-sm font-semibold text-foreground mb-2">
                Voucher Details
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Voucher No:</span>
                  <span className="ml-2 font-semibold text-foreground">
                    {selectedVoucher.refNo}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Material:</span>
                  <span className="ml-2 font-semibold text-foreground">
                    {selectedVoucher.itemName}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Quantity:</span>
                  <span className="ml-2 font-semibold text-foreground">
                    {selectedVoucher.qty}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Store:</span>
                  <span className="ml-2 font-semibold text-foreground">
                    {selectedVoucher.storeName}
                  </span>
                </div>
              </div>
            </div>

            {/* Collector Information */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <User className="h-5 w-5" />
                Collector Information
              </h4>

              <Field label="Collector Name *" required>
                <input
                  type="text"
                  value={formData.collector_name}
                  onChange={(e) =>
                    setFormData({ ...formData, collector_name: e.target.value })
                  }
                  className={inputCls}
                  placeholder="Full name of person collecting materials"
                  required
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="ID Number *" required>
                  <input
                    type="text"
                    value={formData.collector_id_number}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        collector_id_number: e.target.value,
                      })
                    }
                    className={inputCls}
                    placeholder="National ID or Employee ID"
                    required
                  />
                </Field>

                <Field label="Phone Number *" required>
                  <input
                    type="tel"
                    value={formData.collector_phone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        collector_phone: e.target.value,
                      })
                    }
                    className={inputCls}
                    placeholder="+251911234567"
                    required
                  />
                </Field>
              </div>

              <Field label="Department">
                <input
                  type="text"
                  value={formData.collector_department}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      collector_department: e.target.value,
                    })
                  }
                  className={inputCls}
                  placeholder="Department or unit (optional)"
                />
              </Field>

              <Field label="Vehicle Registration" icon={Truck}>
                <input
                  type="text"
                  value={formData.vehicle_registration}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      vehicle_registration: e.target.value,
                    })
                  }
                  className={inputCls}
                  placeholder="Plate number (if using vehicle)"
                />
              </Field>
            </div>

            {/* Pickup Schedule */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Pickup Schedule
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Pickup Date *" required>
                  <input
                    type="date"
                    value={formData.scheduled_pickup_date}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        scheduled_pickup_date: e.target.value,
                      })
                    }
                    className={inputCls}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </Field>

                <Field label="Pickup Time *" required>
                  <input
                    type="time"
                    value={formData.scheduled_pickup_time}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        scheduled_pickup_time: e.target.value,
                      })
                    }
                    className={inputCls}
                    required
                  />
                </Field>
              </div>

              <Field label="Justification" icon={FileText}>
                <textarea
                  value={formData.pickup_justification}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pickup_justification: e.target.value,
                    })
                  }
                  className={inputCls}
                  rows={3}
                  placeholder="Why are these materials leaving the compound? (e.g., delivery to project site, department use, etc.)"
                />
              </Field>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={closeRequestModal}
                disabled={loading}
              >
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-university-600 hover:bg-university-700"
              >
                <Shield className="h-4 w-4" />
                <span>{loading ? "Submitting..." : "Submit Request"}</span>
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Security Officer: Approve Modal */}
      {showApproveModal && selectedRequest && (
        <Modal
          isOpen={showApproveModal}
          onClose={() => setShowApproveModal(false)}
          title="Approve Gate Clearance"
          size="medium"
        >
          <form onSubmit={approveRequest} className="space-y-6">
            {/* Request Summary */}
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border-2 border-emerald-200 dark:border-emerald-900 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground mb-2">
                    Approve Clearance Request
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Voucher:</span>
                      <span className="ml-2 font-semibold text-foreground">
                        {selectedRequest.voucherRef}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Collector:</span>
                      <span className="ml-2 font-semibold text-foreground">
                        {selectedRequest.collectorName}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">ID:</span>
                      <span className="ml-2 font-semibold text-foreground">
                        {selectedRequest.collectorIdNumber}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Phone:</span>
                      <span className="ml-2 font-semibold text-foreground">
                        {selectedRequest.collectorPhone}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Pickup:</span>
                      <span className="ml-2 font-semibold text-foreground">
                        {new Date(selectedRequest.scheduledPickupDate).toLocaleDateString()}{" "}
                        {selectedRequest.scheduledPickupTime?.substring(0, 5)}
                      </span>
                    </div>
                    {selectedRequest.vehicleRegistration && (
                      <div>
                        <span className="text-muted-foreground">Vehicle:</span>
                        <span className="ml-2 font-semibold text-foreground">
                          {selectedRequest.vehicleRegistration}
                        </span>
                      </div>
                    )}
                  </div>
                  {selectedRequest.pickupJustification && (
                    <div className="mt-3 pt-3 border-t border-emerald-200 dark:border-emerald-900">
                      <div className="text-xs text-muted-foreground mb-1">
                        Justification:
                      </div>
                      <div className="text-sm text-foreground">
                        {selectedRequest.pickupJustification}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Security Notes (Optional) */}
            <Field label="Security Notes (Optional)" icon={FileText}>
              <textarea
                value={securityNotes}
                onChange={(e) => setSecurityNotes(e.target.value)}
                className={inputCls}
                rows={3}
                placeholder="Add any notes or instructions for the gate staff..."
              />
            </Field>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowApproveModal(false)}
                disabled={loading}
              >
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <CheckCircle className="h-4 w-4" />
                <span>{loading ? "Approving..." : "Approve Clearance"}</span>
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Security Officer: Reject Modal */}
      {showRejectModal && selectedRequest && (
        <Modal
          isOpen={showRejectModal}
          onClose={() => setShowRejectModal(false)}
          title="Reject Gate Clearance"
          size="medium"
        >
          <form onSubmit={rejectRequest} className="space-y-6">
            {/* Request Summary */}
            <div className="rounded-lg bg-rose-50 dark:bg-rose-950/20 border-2 border-rose-200 dark:border-rose-900 p-4">
              <div className="flex items-start gap-3">
                <XCircle className="h-6 w-6 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground mb-2">
                    Reject Clearance Request
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Voucher:</span>
                      <span className="ml-2 font-semibold text-foreground">
                        {selectedRequest.voucherRef}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Collector:</span>
                      <span className="ml-2 font-semibold text-foreground">
                        {selectedRequest.collectorName}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Rejection Reason (Required) */}
            <Field label="Rejection Reason *" required>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className={inputCls}
                rows={3}
                placeholder="Explain why this clearance request is being rejected..."
                required
              />
              <p className="mt-1 text-xs text-muted-foreground">
                The Store Head will receive this reason and can submit a revised request.
              </p>
            </Field>

            {/* Security Notes (Optional) */}
            <Field label="Additional Security Notes (Optional)" icon={FileText}>
              <textarea
                value={securityNotes}
                onChange={(e) => setSecurityNotes(e.target.value)}
                className={inputCls}
                rows={2}
                placeholder="Internal security notes (optional)..."
              />
            </Field>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowRejectModal(false)}
                disabled={loading}
              >
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-rose-600 hover:bg-rose-700"
              >
                <XCircle className="h-4 w-4" />
                <span>{loading ? "Rejecting..." : "Reject Request"}</span>
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Gate Guard: Record Physical Exit Modal */}
      {(() => {
        console.log("🟣 Modal render check - showRecordExitModal:", showRecordExitModal, "selectedForExit:", selectedForExit);
        return showRecordExitModal && selectedForExit;
      })() && (
        <Modal
          open={showRecordExitModal}
          onClose={() => setShowRecordExitModal(false)}
          title="🚪 Record Physical Exit"
          width="max-w-2xl"
        >
          <form onSubmit={recordPhysicalExit} className="space-y-6">
            {/* Compact Voucher Header */}
            <div className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide opacity-90 mb-1">Issue Voucher</div>
                  <div className="text-2xl font-bold font-mono">{selectedForExit.voucherRef}</div>
                  {selectedForExit.voucherModel && (
                    <div className="text-xs opacity-80 mt-1">{selectedForExit.voucherModel}</div>
                  )}
                </div>
                <div className="h-14 w-14 rounded-full bg-white/20 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8" strokeWidth={2.5} />
                </div>
              </div>
            </div>

            {/* Compact Collector Details */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">Collector Name</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {selectedForExit.collectorName}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">ID Number</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                  {selectedForExit.collectorIdNumber || 'N/A'}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">Phone Number</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                  {selectedForExit.collectorPhone || 'N/A'}
                </div>
              </div>

              {selectedForExit.vehicleRegistration && (
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">Vehicle Reg.</div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white font-mono uppercase">
                    {selectedForExit.vehicleRegistration}
                  </div>
                </div>
              )}
            </div>

            {/* Exit Notes */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                <FileText className="h-4 w-4 text-slate-500" />
                <span>Exit Notes</span>
                <span className="text-xs font-normal text-slate-500">(Optional)</span>
              </label>
              <textarea
                value={exitNotes}
                onChange={(e) => setExitNotes(e.target.value)}
                className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                rows={3}
                placeholder="Record observations: ID verified, materials inspected, vehicle confirmed, etc."
              />
            </div>

            {/* Info Note */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
              <div className="text-blue-600 dark:text-blue-400 mt-0.5 text-lg">⏱️</div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Exit timestamp will be automatically recorded when you confirm.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowRecordExitModal(false)}
                disabled={loading}
                className="px-5"
              >
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-lg"
              >
                <CheckCircle className="h-4 w-4" strokeWidth={2.5} />
                <span>{loading ? "Recording..." : "Confirm Exit"}</span>
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
