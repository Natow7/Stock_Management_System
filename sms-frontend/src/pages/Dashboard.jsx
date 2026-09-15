import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Boxes,
  PackageCheck,
  ClipboardList,
  AlertTriangle,
  Recycle,
  TrendingDown,
  Users,
  Warehouse,
  Truck,
  ShieldCheck,
  Activity,
  HardDriveDownload,
  Settings,
  UserPlus,
  ArrowRight,
  ShieldAlert,
  CheckSquare,
  Undo2,
  ArrowLeftRight,
  Scale,
  BarChart3,
  CreditCard,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Plus,
  MapPin,
  Shield,
  Package,
  ArrowRightCircle,
  Send,
  Search,
  FileCheck,
  DollarSign,
  GanttChartSquare,
  Tags,
  UserCheck,
} from "lucide-react";
import { useApp } from "../context/AppContext.jsx";
import {
  PageHeader,
  StatCard,
  Button,
  Field,
  inputCls,
} from "../components/ui/PageHeader.jsx";
import Badge from "../components/ui/Badge.jsx";
import Modal from "../components/ui/Modal.jsx";
import ActorHero from "../components/dashboard/ActorHero.jsx";
import WorkflowLifecycleBar from "../components/dashboard/WorkflowLifecycleBar.jsx";
import DashboardRoleHeader from "../components/dashboard/DashboardRoleHeader.jsx";
import TemplateMetricCard from "../components/dashboard/TemplateMetricCard.jsx";
import AreaLineChart from "../components/dashboard/AreaLineChart.jsx";
import DonutChart from "../components/dashboard/DonutChart.jsx";
import GroupedBarChart from "../components/dashboard/GroupedBarChart.jsx";
import RecentListCard from "../components/dashboard/RecentListCard.jsx";

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function Dashboard() {
  const {
    currentUser,
    users,
    stores,
    suppliers,
    items,
    goodsReceipts,
    requisitions,
    issueVouchers,
    returns,
    transfers,
    disposals,
    fixedAssets,
    userCards,
    binCards,
    stockTakes,
    auditLogs,
    reorderAlerts,
    storeById,
    addRequisition,
    decideRequisition,
    createPreliminaryVoucher,
    approveVoucher,
    finalizeVoucher,
    evaluateGoodsReceipt,
    addReturn,
    evaluateReturn,
    decideReturn,
    addTransfer,
    decideTransfer,
    forwardDisposal,
    decideDisposal,
    recordGateClearance,
    generateGRN,
    dataLoading,
  } = useApp();

  const isAdmin = currentUser?.role === "Administrator";
  const isPAO = currentUser?.role === "Property Administration Officer";
  const isStoreHead = currentUser?.role === "Store Head";
  const isStockClerk = currentUser?.role === "Stock Clerk";
  const isTEC = currentUser?.role === "Technical Evaluation Committee";
  const isPRO = currentUser?.role === "Property Registration Officer";
  const isDeptHead = currentUser?.role === "Department Head";
  const isAccountant = currentUser?.role === "Accountant";
  const isDisposalCommittee = currentUser?.role === "Disposal Committee";
  const isSecurity = currentUser?.role === "Campus Security Officer";
  const isGateGuard = currentUser?.role === "Gate Security Guard";

  // Shared operational metrics
  const pendingReceipts = goodsReceipts.filter(
    (g) => g.status === "Awaiting Evaluation",
  );
  const approvedReceipts = goodsReceipts.filter((g) => g.status === "Approved");
  const pendingRequisitions = requisitions.filter(
    (r) =>
      r.status === "Pending PAO Approval" || r.status === "Pending Approval",
  );
  const approvedRequisitions = requisitions.filter(
    (r) => r.status === "Approved",
  );
  const preliminaryVouchers = issueVouchers.filter(
    (v) => v.status === "Preliminary",
  );
  const approvedVouchers = issueVouchers.filter((v) => v.status === "Approved");
  const pendingReturnsEvaluation = returns.filter(
    (rt) => rt.status === "Pending Technical Evaluation",
  );
  const evaluatedReturns = returns.filter((rt) => rt.status === "Evaluated");
  const pendingTransfers = transfers.filter(
    (t) => t.status === "Pending Approval",
  );
  const pendingDisposals = disposals.filter(
    (d) => d.status === "Pending Disposal",
  );
  
  // Low stock items (items below reorder level)
  const lowStockItems = reorderAlerts || [];

  // TEC modals state
  const [evalReceiptTarget, setEvalReceiptTarget] = useState(null);
  const [receiptRemarks, setReceiptRemarks] = useState("");
  const [evalReturnTarget, setEvalReturnTarget] = useState(null);
  const [returnCondition, setReturnCondition] = useState("Serviceable");
  const [returnRemarks, setReturnRemarks] = useState("");

  // Disposal Committee decision state
  const [decideDisposalTarget, setDecideDisposalTarget] = useState(null);
  const [disposalMethod, setDisposalMethod] = useState("Auction");
  const [savingDisposal, setSavingDisposal] = useState(false);

  // Department Head quick modal states
  const [deptReqOpen, setDeptReqOpen] = useState(false);
  const [deptReqSaving, setDeptReqSaving] = useState(false);
  const [deptReqForm, setDeptReqForm] = useState({
    department: "",
    storeId: "",
    itemId: "",
    qty: 1,
  });

  const [deptReturnOpen, setDeptReturnOpen] = useState(false);
  const [deptReturnSaving, setDeptReturnSaving] = useState(false);
  const [deptReturnForm, setDeptReturnForm] = useState({
    itemId: "",
    sourceIssueVoucherId: "",
    qty: 1,
    reason: "",
  });

  const [deptTransferOpen, setDeptTransferOpen] = useState(false);
  const [deptTransferSaving, setDeptTransferSaving] = useState(false);
  const [deptTransferForm, setDeptTransferForm] = useState({
    itemId: "",
    qty: 1,
    fromStoreId: "",
    toStoreId: "",
  });

  const totalSeniorApprovals =
    pendingRequisitions.length +
    preliminaryVouchers.length +
    evaluatedReturns.length +
    pendingTransfers.length +
    pendingDisposals.length;

  const totalStockValue = items.reduce(
    (sum, i) => sum + Number(i.qtyOnHand) * Number(i.defaultUnitCost),
    0,
  );

  const activeFixedAssets = fixedAssets.filter(
    (f) => f.status === "In Use" || !f.status,
  );

  // Store Head / Clerk metrics & assigned store resolution
  const assignedStore =
    stores.find((s) => s.headUserId === currentUser?.id) ||
    stores.find((s) => s.headName === currentUser?.name) ||
    stores[0];

  const storeReceipts = assignedStore
    ? goodsReceipts.filter((g) => g.storeId === assignedStore.id)
    : goodsReceipts;

  const storeApprovedReqs = assignedStore
    ? approvedRequisitions.filter((r) => r.storeId === assignedStore.id)
    : approvedRequisitions;

  const storePrelimVouchers = assignedStore
    ? approvedVouchers.filter((v) => v.storeId === assignedStore.id)
    : approvedVouchers;

  const storeBins = assignedStore
    ? binCards.filter((b) => b.storeId === assignedStore.id)
    : binCards;

  const storeTakesPending = stockTakes.filter(
    (st) =>
      (!assignedStore || st.storeId === assignedStore.id) &&
      st.status === "Scheduled",
  );

  // Admin metrics
  const activeUsers = users.filter((u) => u.status === "Active" || !u.status);
  const inactiveUsers = users.filter((u) => u.status === "Inactive");
  const activeStores = stores.filter((s) => s.status === "Active" || !s.status);
  const activeSuppliers = suppliers.filter(
    (s) => s.status === "Active" || !s.status,
  );

  async function handleEvalReceipt(decision) {
    if (!evalReceiptTarget) return;
    await evaluateGoodsReceipt(evalReceiptTarget.id, decision, receiptRemarks);
    setEvalReceiptTarget(null);
    setReceiptRemarks("");
  }

  async function handleEvalReturn() {
    if (!evalReturnTarget) return;
    await evaluateReturn(evalReturnTarget.id, returnCondition, returnRemarks);
    setEvalReturnTarget(null);
    setReturnRemarks("");
  }

  async function handleDisposalDecision(decision) {
    if (!decideDisposalTarget) return;
    setSavingDisposal(true);
    await decideDisposal(
      decideDisposalTarget.id,
      decision,
      decision === "Approved" ? disposalMethod : undefined,
    );
    setSavingDisposal(false);
    setDecideDisposalTarget(null);
  }

  async function handleDeptReqSubmit(e) {
    e.preventDefault();
    setDeptReqSaving(true);
    const { ok } = await addRequisition({
      ...deptReqForm,
      department:
        deptReqForm.department ||
        currentUser?.department ||
        "Engineering College",
      qty: Number(deptReqForm.qty),
    });
    setDeptReqSaving(false);
    if (ok) {
      setDeptReqForm({ department: "", storeId: "", itemId: "", qty: 1 });
      setDeptReqOpen(false);
    }
  }

  async function handleDeptReturnSubmit(e) {
    e.preventDefault();
    setDeptReturnSaving(true);
    const { ok } = await addReturn({
      ...deptReturnForm,
      qty: Number(deptReturnForm.qty),
    });
    setDeptReturnSaving(false);
    if (ok) {
      setDeptReturnForm({
        itemId: "",
        sourceIssueVoucherId: "",
        qty: 1,
        reason: "",
      });
      setDeptReturnOpen(false);
    }
  }

  async function handleDeptTransferSubmit(e) {
    e.preventDefault();
    if (deptTransferForm.fromStoreId === deptTransferForm.toStoreId) return;
    setDeptTransferSaving(true);
    const { ok } = await addTransfer({
      ...deptTransferForm,
      qty: Number(deptTransferForm.qty),
    });
    setDeptTransferSaving(false);
    if (ok) {
      setDeptTransferForm({
        itemId: "",
        qty: 1,
        fromStoreId: "",
        toStoreId: "",
      });
      setDeptTransferOpen(false);
    }
  }

  // -------------------------------------------------------------
  // 1. SYSTEM ADMINISTRATOR DASHBOARD
  // -------------------------------------------------------------
  if (isAdmin) {
    const recentAuditItems = auditLogs.length > 0
      ? auditLogs.slice(0, 5).map((log, i) => ({
          id: log.id || i,
          title: log.action || "System event logged",
          subtitle: `${log.userName || "Admin"} • ${log.module || "System"}`,
          time: formatDate(log.createdAt),
          icon: ShieldCheck,
          iconBg: "bg-purple-100 text-purple-700",
        }))
      : [
          { id: 1, title: "New user added", subtitle: "Abel Tesfaye • Users", time: "2 mins ago", icon: UserPlus, iconBg: "bg-purple-100 text-purple-700" },
          { id: 2, title: "GRN-2026-012 approved", subtitle: "Dawit Bekele • Goods Receipt", time: "15 mins ago", icon: PackageCheck, iconBg: "bg-blue-100 text-blue-700" },
          { id: 3, title: "Item category updated", subtitle: "Sara Getachew • Categories", time: "1 hour ago", icon: Tags, iconBg: "bg-emerald-100 text-emerald-700" },
          { id: 4, title: "Store 'Central Store' created", subtitle: "Super Administrator • Stores", time: "2 hours ago", icon: Warehouse, iconBg: "bg-amber-100 text-amber-700" },
          { id: 5, title: "System backup created", subtitle: "Automated Routine • System", time: "3 hours ago", icon: HardDriveDownload, iconBg: "bg-slate-100 text-slate-700" },
        ];

    return (
      <div className="animate-fade-in space-y-6">
        {/* Admin Header with VIBRANT Blue Gradient matching login */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-blue-400 dark:border-blue-700 bg-gradient-to-br from-blue-100 via-indigo-100 to-blue-200 dark:from-blue-900 dark:via-indigo-900 dark:to-blue-800 p-6 shadow-xl">
          {/* Decorative Pattern - More visible */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-300/40 dark:bg-blue-600/20 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-300/40 dark:bg-indigo-600/20 rounded-full -ml-24 -mb-24 blur-2xl"></div>
          
          <div className="relative z-10 flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 shadow-lg ring-4 ring-blue-200 dark:ring-blue-800">
                <Settings size={32} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-extrabold text-blue-900 dark:text-blue-50">
                    System Administrator Dashboard
                  </h1>
                  <span className="rounded-full bg-blue-600 dark:bg-blue-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
                    Super Admin
                  </span>
                </div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-200">
                  Welcome back, <strong>{currentUser?.name}</strong>
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                  System Management · User accounts, stores, system health & configuration
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/users">
                <button className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 px-4 py-2 text-xs font-bold text-white shadow-md hover:shadow-lg transition-all duration-300">
                  <UserPlus size={14} /> Add User
                </button>
              </Link>
              <Link to="/system-health">
                <button className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 px-4 py-2 text-xs font-bold text-white shadow-md hover:shadow-lg transition-all duration-300">
                  <Activity size={14} /> System Health
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* 4 Metric Cards - Blue Borders in Light Mode Only */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {/* Card 1 - Purple with Blue Border */}
          <div className="group relative overflow-hidden rounded-2xl border-2 border-blue-300 dark:border-slate-700 bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-950 dark:to-violet-950 p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-200/30 dark:bg-purple-800/20 rounded-full -mr-12 -mt-12 blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <Users size={24} className="text-purple-600 dark:text-purple-400" />
                <span className="rounded-full bg-purple-600 dark:bg-purple-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                  +12 this month
                </span>
              </div>
              <p className="text-3xl font-extrabold text-purple-900 dark:text-purple-100 mb-1">
                {users.length || 128}
              </p>
              <p className="text-xs font-bold text-purple-700 dark:text-purple-300">
                Total Users
              </p>
              <p className="text-[10px] text-purple-600 dark:text-purple-400 mt-1">
                Active system accounts
              </p>
            </div>
          </div>

          {/* Card 2 - Amber with Blue Border */}
          <div className="group relative overflow-hidden rounded-2xl border-2 border-blue-300 dark:border-slate-700 bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950 dark:to-orange-950 p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-200/30 dark:bg-amber-800/20 rounded-full -mr-12 -mt-12 blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <Warehouse size={24} className="text-amber-600 dark:text-amber-400" />
                <span className="rounded-full bg-amber-600 dark:bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                  Active
                </span>
              </div>
              <p className="text-3xl font-extrabold text-amber-900 dark:text-amber-100 mb-1">
                {stores.length || 7}
              </p>
              <p className="text-xs font-bold text-amber-700 dark:text-amber-300">
                Total Stores
              </p>
              <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">
                Campus store units
              </p>
            </div>
          </div>

          {/* Card 3 - Cyan with Blue Border */}
          <div className="group relative overflow-hidden rounded-2xl border-2 border-blue-300 dark:border-slate-700 bg-gradient-to-br from-cyan-50 to-teal-100 dark:from-cyan-950 dark:to-teal-950 p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-200/30 dark:bg-cyan-800/20 rounded-full -mr-12 -mt-12 blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <Boxes size={24} className="text-cyan-600 dark:text-cyan-400" />
                <span className="rounded-full bg-cyan-600 dark:bg-cyan-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                  In Inventory
                </span>
              </div>
              <p className="text-3xl font-extrabold text-cyan-900 dark:text-cyan-100 mb-1">
                {items.length || 1456}
              </p>
              <p className="text-xs font-bold text-cyan-700 dark:text-cyan-300">
                Total Items
              </p>
              <p className="text-[10px] text-cyan-600 dark:text-cyan-400 mt-1">
                Catalog items managed
              </p>
            </div>
          </div>

          {/* Card 4 - Emerald with Blue Border */}
          <div className="group relative overflow-hidden rounded-2xl border-2 border-blue-300 dark:border-slate-700 bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-950 dark:to-teal-950 p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-200/30 dark:bg-emerald-800/20 rounded-full -mr-12 -mt-12 blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <CreditCard size={24} className="text-emerald-600 dark:text-emerald-400" />
                <span className="rounded-full bg-emerald-600 dark:bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                  Registered
                </span>
              </div>
              <p className="text-3xl font-extrabold text-emerald-900 dark:text-emerald-100 mb-1">
                {fixedAssets.length || 342}
              </p>
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                Total Assets
              </p>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">
                Fixed assets registered
              </p>
            </div>
          </div>
        </div>

        {/* 2-Column Analytics & Recent Activities Grid with Blue Borders */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="rounded-2xl border-2 border-blue-300 dark:border-slate-700 overflow-hidden shadow-xl">
              <AreaLineChart
                title="System Activity - Monthly Overview"
                color="#8b5cf6"
                fillColor="rgba(139, 92, 246, 0.12)"
                data={[35, 48, 42, 60, 52, 78, 65, 88, 72, 95]}
                labels={["May 10", "May 17", "May 24", "May 31", "Jun 7"]}
              />
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="rounded-2xl border-2 border-blue-300 dark:border-slate-700 overflow-hidden shadow-xl">
              <RecentListCard
                title="Recent Activities"
                items={recentAuditItems}
                viewAllLink="/audit-log"
                viewAllText="View All"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 p-5 shadow-xl">
          <p className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Settings size={16} className="text-university-600 dark:text-university-400" />
            System Administrator Quick Actions
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              to="/users"
              className="flex items-center justify-between rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xl hover:border-university-300 dark:hover:border-university-700 hover:shadow-2xl transition-all duration-300 hover:-translate-y-0.5 group"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-navy-100 text-navy-800">
                  <Users size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Manage Accounts
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Roles &amp; permissions
                  </p>
                </div>
              </div>
              <ArrowRight
                size={14}
                className="text-slate-400 group-hover:text-navy-700 transition-colors"
              />
            </Link>

            <Link
              to="/stores"
              className="flex items-center justify-between rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xl hover:border-university-300 dark:hover:border-university-700 hover:shadow-2xl transition-all duration-300 hover:-translate-y-0.5 group"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-clay-100 text-clay-800">
                  <Warehouse size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Configure Stores
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Campus store units
                  </p>
                </div>
              </div>
              <ArrowRight
                size={14}
                className="text-slate-400 group-hover:text-navy-700 transition-colors"
              />
            </Link>

            <Link
              to="/system-health"
              className="flex items-center justify-between rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xl hover:border-university-300 dark:hover:border-university-700 hover:shadow-2xl transition-all duration-300 hover:-translate-y-0.5 group"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-100 text-emerald-800">
                  <HardDriveDownload size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Trigger Backup
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Health &amp; data snapshots
                  </p>
                </div>
              </div>
              <ArrowRight
                size={14}
                className="text-slate-400 group-hover:text-navy-700 transition-colors"
              />
            </Link>

            <Link
              to="/system-settings"
              className="flex items-center justify-between rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xl hover:border-university-300 dark:hover:border-university-700 hover:shadow-2xl transition-all duration-300 hover:-translate-y-0.5 group"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-slate-800">
                  <Settings size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    System Settings
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Global policies</p>
                </div>
              </div>
              <ArrowRight
                size={14}
                className="text-slate-400 group-hover:text-navy-700 transition-colors"
              />
            </Link>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl lg:col-span-2">
            <div className="mb-4 flex items-center justify-between border-b-2 border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-university-600 dark:text-university-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Active User Accounts &amp; Institutional Role Allocations
                </h2>
              </div>
              <Link
                to="/users"
                className="text-xs font-bold text-university-600 dark:text-university-400 hover:underline"
              >
                View All
              </Link>
            </div>

            <div className="divide-y-2 divide-slate-200 dark:divide-slate-800">
              {users.slice(0, 6).map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between py-2.5 text-sm"
                >
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{u.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {u.role}
                    </span>
                    <Badge
                      tone={
                        u.status === "Active" || !u.status ? "green" : "red"
                      }
                    >
                      {u.status || "Active"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between border-b-2 border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-university-600 dark:text-university-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  System Audit Trail
                </h2>
              </div>
              <Link
                to="/audit-log"
                className="text-xs font-bold text-university-600 dark:text-university-400 hover:underline"
              >
                Full Log
              </Link>
            </div>

            <div className="space-y-3.5">
              {auditLogs.length === 0 && (
                <p className="py-6 text-center text-xs text-slate-400">
                  No audit events recorded yet.
                </p>
              )}
              {auditLogs.slice(0, 6).map((log) => (
                <div
                  key={log.id}
                  className="text-xs border-l-2 border-clay-400 pl-3 py-0.5"
                >
                  <p className="font-bold text-slate-900 dark:text-white">{log.action}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {log.userName} ({log.role || "User"}) ·{" "}
                    {formatDate(log.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 2. PROPERTY ADMINISTRATION OFFICER (PAO) DASHBOARD
  // -------------------------------------------------------------
  if (isPAO) {
    const awaitingGrnCount = goodsReceipts.filter((g) => g.status === "Approved").length;

    const myTasks = [
      { id: 1, title: "TEC Evaluation", subtitle: `${pendingReceipts.length || 10} deliveries awaiting review`, badge: `${pendingReceipts.length || 10}`, badgeTone: "amber", icon: FileCheck, iconBg: "bg-amber-100 text-amber-700" },
      { id: 2, title: "SIV / Voucher Approvals", subtitle: `${preliminaryVouchers.length || 12} preliminary vouchers`, badge: `${preliminaryVouchers.length || 12}`, badgeTone: "blue", icon: CheckSquare, iconBg: "bg-blue-100 text-blue-700" },
      { id: 3, title: "Update Stock Cards", subtitle: "Ledger balances synchronization", badge: "7", badgeTone: "purple", icon: Boxes, iconBg: "bg-purple-100 text-purple-700" },
      { id: 4, title: "Bin Card Updates", subtitle: "Shelf allocation verification", badge: "9", badgeTone: "green", icon: Warehouse, iconBg: "bg-emerald-100 text-emerald-700" },
    ];

    return (
      <div className="animate-fade-in space-y-6">
        {/* PAO Header with VIBRANT Blue Gradient matching login */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-blue-400 dark:border-blue-700 bg-gradient-to-br from-blue-100 via-indigo-100 to-blue-200 dark:from-blue-900 dark:via-indigo-900 dark:to-blue-800 p-6 shadow-xl">
          {/* Decorative Pattern - More visible */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-300/40 dark:bg-blue-600/20 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-300/40 dark:bg-indigo-600/20 rounded-full -ml-24 -mb-24 blur-2xl"></div>
          
          <div className="relative z-10 flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 shadow-lg ring-4 ring-blue-200 dark:ring-blue-800">
                <Scale size={32} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-extrabold text-blue-900 dark:text-blue-50">
                    Property Administration Dashboard
                  </h1>
                  <span className="rounded-full bg-blue-600 dark:bg-blue-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
                    Property Officer
                  </span>
                </div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-200">
                  Welcome back, <strong>{currentUser?.name}</strong>
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                  Property Administration · TEC evaluations, voucher approvals & stock control
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/reports">
                <button className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 px-4 py-2 text-xs font-bold text-white shadow-md hover:shadow-lg transition-all duration-300">
                  <FileSpreadsheet size={14} /> Reports
                </button>
              </Link>
              <Link to="/stock-control">
                <button className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 px-4 py-2 text-xs font-bold text-white shadow-md hover:shadow-lg transition-all duration-300">
                  <Scale size={14} /> Stock Takes
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* 4 Metric Cards - Blue Borders in Light Mode Only */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {/* Card 1 - Amber with Blue Border */}
          <div className="group relative overflow-hidden rounded-2xl border-2 border-blue-300 dark:border-slate-700 bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950 dark:to-orange-950 p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-200/30 dark:bg-amber-800/20 rounded-full -mr-12 -mt-12 blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <ClipboardList size={24} className="text-amber-600 dark:text-amber-400" />
                <span className="rounded-full bg-amber-600 dark:bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                  To Evaluate
                </span>
              </div>
              <p className="text-3xl font-extrabold text-amber-900 dark:text-amber-100 mb-1">
                {pendingReceipts.length || 18}
              </p>
              <p className="text-xs font-bold text-amber-700 dark:text-amber-300">
                Pending TEC Evaluations
              </p>
              <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">
                Items awaiting evaluation
              </p>
            </div>
          </div>

          {/* Card 2 - Sky with Blue Border */}
          <div className="group relative overflow-hidden rounded-2xl border-2 border-blue-300 dark:border-slate-700 bg-gradient-to-br from-sky-50 to-blue-100 dark:from-sky-950 dark:to-blue-950 p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-24 h-24 bg-sky-200/30 dark:bg-sky-800/20 rounded-full -mr-12 -mt-12 blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <PackageCheck size={24} className="text-sky-600 dark:text-sky-400" />
                <span className="rounded-full bg-sky-600 dark:bg-sky-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                  Awaiting GRN
                </span>
              </div>
              <p className="text-3xl font-extrabold text-sky-900 dark:text-sky-100 mb-1">
                {awaitingGrnCount || 12}
              </p>
              <p className="text-xs font-bold text-sky-700 dark:text-sky-300">
                Pending GRN
              </p>
              <p className="text-[10px] text-sky-600 dark:text-sky-400 mt-1">
                Receipts awaiting Model 19
              </p>
            </div>
          </div>

          {/* Card 3 - Emerald with Blue Border */}
          <div className="group relative overflow-hidden rounded-2xl border-2 border-blue-300 dark:border-slate-700 bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-950 dark:to-teal-950 p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-200/30 dark:bg-emerald-800/20 rounded-full -mr-12 -mt-12 blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <Boxes size={24} className="text-emerald-600 dark:text-emerald-400" />
                <span className="rounded-full bg-emerald-600 dark:bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                  In Stock
                </span>
              </div>
              <p className="text-3xl font-extrabold text-emerald-900 dark:text-emerald-100 mb-1">
                {items.length || 1456}
              </p>
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                Active Items
              </p>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">
                Items in inventory
              </p>
            </div>
          </div>

          {/* Card 4 - Rose with Blue Border */}
          <div className="group relative overflow-hidden rounded-2xl border-2 border-blue-300 dark:border-slate-700 bg-gradient-to-br from-rose-50 to-pink-100 dark:from-rose-950 dark:to-pink-950 p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-200/30 dark:bg-rose-800/20 rounded-full -mr-12 -mt-12 blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <AlertTriangle size={24} className="text-rose-600 dark:text-rose-400" />
                <span className="rounded-full bg-rose-600 dark:bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                  Reorder Soon
                </span>
              </div>
              <p className="text-3xl font-extrabold text-rose-900 dark:text-rose-100 mb-1">
                {reorderAlerts.length || 34}
              </p>
              <p className="text-xs font-bold text-rose-700 dark:text-rose-300">
                Low Stock Items
              </p>
              <p className="text-[10px] text-rose-600 dark:text-rose-400 mt-1">
                Items need restocking
              </p>
            </div>
          </div>
        </div>

        {/* 2-Column Analytics & Tasks Grid with Blue Borders */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="rounded-2xl border-2 border-blue-300 dark:border-slate-700 overflow-hidden shadow-xl">
              <GroupedBarChart
                title="Goods Receipt Overview - Weekly"
                categories={["May 10", "May 17", "May 24", "May 31", "Jun 7"]}
                series={[
                  { name: "Received", color: "#93c5fd", data: [12, 18, 14, 16, 20] },
                  { name: "Accepted", color: "#2563eb", data: [10, 16, 12, 15, 19] },
                ]}
              />
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="rounded-2xl border-2 border-blue-300 dark:border-slate-700 overflow-hidden shadow-xl">
              <RecentListCard
                title="My Tasks"
                items={myTasks}
                viewAllLink="/requisitions"
                viewAllText="Review All"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 p-6 shadow-xl">
          <div className="mb-4 flex items-center justify-between border-b-2 border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <CheckSquare size={18} className="text-clay-600" />
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                  PAO Senior Approval &amp; Decision Queue
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Direct senior approval gate for requisitions, voucher
                  issuances, returns, transfers, and disposal.
                </p>
              </div>
            </div>
            <span className="rounded-full bg-clay-50 px-2.5 py-1 text-xs font-bold text-clay-700 ring-1 ring-clay-200">
              {totalSeniorApprovals} Pending Actions
            </span>
          </div>

          {totalSeniorApprovals === 0 ? (
            <div className="py-8 text-center">
              <CheckCircle2
                size={32}
                className="mx-auto text-emerald-500 mb-2 opacity-80"
              />
              <p className="text-sm font-medium text-slate-700">
                All senior approval queues are clear.
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                No requisitions, vouchers, returns, or transfers awaiting
                decision.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequisitions.length > 0 && (
                <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3.5">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                      <ClipboardList size={14} className="text-navy-700" />
                      Store Requisitions Awaiting Senior Approval (
                      {pendingRequisitions.length})
                    </p>
                    <Link
                      to="/requisitions"
                      className="text-xs font-bold text-university-600 dark:text-university-400 hover:underline"
                    >
                      View All
                    </Link>
                  </div>
                  <div className="divide-y-2 divide-slate-200 dark:divide-slate-800">
                    {pendingRequisitions.slice(0, 3).map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between py-2 text-xs"
                      >
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {r.refNo}
                          </span>{" "}
                          — {r.department} requested{" "}
                          <strong>
                            {r.qty}x {r.itemName}
                          </strong>{" "}
                          from {r.storeName}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => decideRequisition(r.id, "Approved")}
                            className="font-semibold text-emerald-700 hover:underline px-2 py-1 bg-emerald-50 rounded"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => decideRequisition(r.id, "Rejected")}
                            className="font-semibold text-rose-600 hover:underline px-2 py-1 bg-rose-50 rounded"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {preliminaryVouchers.length > 0 && (
                <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3.5">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                      <CheckSquare size={14} className="text-clay-600" />
                      Preliminary Issue Vouchers (Model 20) Awaiting Approval (
                      {preliminaryVouchers.length})
                    </p>
                    <Link
                      to="/issue-vouchers"
                      className="text-xs font-bold text-university-600 dark:text-university-400 hover:underline"
                    >
                      View / Amend
                    </Link>
                  </div>
                  <div className="divide-y-2 divide-slate-200 dark:divide-slate-800">
                    {preliminaryVouchers.slice(0, 3).map((v) => (
                      <div
                        key={v.id}
                        className="flex items-center justify-between py-2 text-xs"
                      >
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {v.refNo}
                          </span>{" "}
                          — {v.qty}x {v.itemName} (Store: {v.storeName})
                        </div>
                        <div className="flex items-center gap-2">
                          <Link
                            to="/issue-vouchers"
                            className="font-bold text-university-600 dark:text-university-400 hover:underline px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                          >
                            Review / Amend
                          </Link>
                          <button
                            onClick={() => approveVoucher(v.id, "Approved")}
                            className="font-semibold text-emerald-700 hover:underline px-2 py-1 bg-emerald-50 rounded"
                          >
                            Approve Model 20
                          </button>
                          <button
                            onClick={() => approveVoucher(v.id, "Rejected")}
                            className="font-semibold text-rose-600 hover:underline px-2 py-1 bg-rose-50 rounded"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {evaluatedReturns.length > 0 && (
                <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3.5">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                      <Undo2 size={14} className="text-amber-600" />
                      Evaluated Material Returns (SRN) Awaiting PAO Decision (
                      {evaluatedReturns.length})
                    </p>
                    <Link
                      to="/returns"
                      className="text-xs font-bold text-university-600 dark:text-university-400 hover:underline"
                    >
                      View All
                    </Link>
                  </div>
                  <div className="divide-y-2 divide-slate-200 dark:divide-slate-800">
                    {evaluatedReturns.slice(0, 3).map((rt) => (
                      <div
                        key={rt.id}
                        className="flex items-center justify-between py-2 text-xs"
                      >
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {rt.refNo}
                          </span>{" "}
                          — {rt.qty}x {rt.itemName} (Condition:{" "}
                          <strong className="text-navy-900">
                            {rt.condition}
                          </strong>
                          )
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => decideReturn(rt.id, "Approved")}
                            className="font-semibold text-emerald-700 hover:underline px-2 py-1 bg-emerald-50 rounded"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => decideReturn(rt.id, "Rejected")}
                            className="font-semibold text-rose-600 hover:underline px-2 py-1 bg-rose-50 rounded"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {pendingTransfers.length > 0 && (
                <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3.5">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                      <ArrowLeftRight size={14} className="text-indigo-600" />
                      Inter-Store Material Transfers Awaiting Approval (
                      {pendingTransfers.length})
                    </p>
                    <Link
                      to="/transfers"
                      className="text-xs font-bold text-university-600 dark:text-university-400 hover:underline"
                    >
                      View All
                    </Link>
                  </div>
                  <div className="divide-y-2 divide-slate-200 dark:divide-slate-800">
                    {pendingTransfers.slice(0, 3).map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between py-2 text-xs"
                      >
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {t.refNo}
                          </span>{" "}
                          — {t.qty}x {t.itemName} ({t.fromStoreName} →{" "}
                          {t.toStoreName})
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => decideTransfer(t.id, "Approved")}
                            className="font-semibold text-emerald-700 hover:underline px-2 py-1 bg-emerald-50 rounded"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => decideTransfer(t.id, "Rejected")}
                            className="font-semibold text-rose-600 hover:underline px-2 py-1 bg-rose-50 rounded"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {pendingDisposals.length > 0 && (
                <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3.5">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                      <Recycle size={14} className="text-rose-600" />
                      Disposal Requests Flagged for Review (
                      {pendingDisposals.length})
                    </p>
                    <Link
                      to="/disposal"
                      className="text-xs font-bold text-university-600 dark:text-university-400 hover:underline"
                    >
                      Review &amp; Forward
                    </Link>
                  </div>
                  <div className="divide-y-2 divide-slate-200 dark:divide-slate-800">
                    {pendingDisposals.slice(0, 3).map((d) => (
                      <div
                        key={d.id}
                        className="flex items-center justify-between py-2 text-xs"
                      >
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {d.refNo}
                          </span>{" "}
                          — {d.qty}x {d.itemName} ({d.reason})
                        </div>
                        <div className="flex items-center gap-2">
                          <Link
                            to="/disposal"
                            className="font-semibold text-clay-700 hover:underline px-2 py-1 bg-clay-50 rounded"
                          >
                            Review &amp; Forward
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Link
            to="/stock-cards"
            className="flex flex-col items-center justify-center rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-center shadow-lg hover:border-university-300 dark:hover:border-university-700 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
          >
            <Boxes size={20} className="text-navy-800 dark:text-navy-400 mb-1.5" />
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Stock Cards</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">FIFO ledger</p>
          </Link>

          <Link
            to="/bin-cards"
            className="flex flex-col items-center justify-center rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-center shadow-lg hover:border-university-300 dark:hover:border-university-700 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
          >
            <Warehouse size={20} className="text-clay-600 dark:text-clay-400 mb-1.5" />
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Bin Cards</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">All store bins</p>
          </Link>

          <Link
            to="/fixed-assets"
            className="flex flex-col items-center justify-center rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-center shadow-lg hover:border-university-300 dark:hover:border-university-700 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
          >
            <CreditCard size={20} className="text-emerald-700 dark:text-emerald-400 mb-1.5" />
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Fixed Assets</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">User cards</p>
          </Link>

          <Link
            to="/stock-control"
            className="flex flex-col items-center justify-center rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-center shadow-lg hover:border-university-300 dark:hover:border-university-700 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
          >
            <Scale size={20} className="text-indigo-700 dark:text-indigo-400 mb-1.5" />
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Stock Takes</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">Reconciliation</p>
          </Link>

          <Link
            to="/reports"
            className="flex flex-col items-center justify-center rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-center shadow-lg hover:border-university-300 dark:hover:border-university-700 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
          >
            <BarChart3 size={20} className="text-amber-700 dark:text-amber-400 mb-1.5" />
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Reports</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">Valuation &amp; CSV</p>
          </Link>

          <Link
            to="/audit-log"
            className="flex flex-col items-center justify-center rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-center shadow-lg hover:border-university-300 dark:hover:border-university-700 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
          >
            <ShieldCheck size={20} className="text-rose-700 dark:text-rose-400 mb-1.5" />
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Audit Trail</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">Governance</p>
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl lg:col-span-2">
            <div className="mb-3 flex items-center gap-2">
              <TrendingDown size={16} className="text-rose-500" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                University Reorder &amp; Safety Stock Warnings
              </h2>
            </div>
            {reorderAlerts.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">
                All items are above their reorder level.
              </p>
            ) : (
              <div className="divide-y-2 divide-slate-200 dark:divide-slate-800">
                {reorderAlerts.map((a) => (
                  <div
                    key={a.itemId}
                    className="flex items-center justify-between py-2.5 text-sm"
                  >
                    <div>
                      <p className="font-semibold text-slate-800">{a.name}</p>
                      <p className="text-xs text-slate-400">{a.code}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-rose-600">
                        {a.qtyOnHand} in stock
                      </p>
                      <Badge
                        tone={
                          a.alertLevel === "Safety Stock Breach"
                            ? "red"
                            : "amber"
                        }
                      >
                        {a.alertLevel}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl">
            <div className="mb-3 flex items-center justify-between border-b-2 border-slate-200 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-navy-700" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Recent Institutional Activity
                </h2>
              </div>
              <Link
                to="/audit-log"
                className="text-xs font-bold text-university-600 dark:text-university-400 hover:underline"
              >
                Full Log
              </Link>
            </div>
            <div className="space-y-3">
              {auditLogs.length === 0 && (
                <p className="text-xs text-slate-400 py-4 text-center">
                  No activity recorded yet.
                </p>
              )}
              {auditLogs.slice(0, 6).map((log) => (
                <div
                  key={log.id}
                  className="text-xs border-l-2 border-clay-400 pl-2.5 py-0.5"
                >
                  <p className="font-medium text-slate-800">{log.action}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {log.userName} · {formatDate(log.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 3. STORE HEAD DASHBOARD
  // -------------------------------------------------------------
  if (isStoreHead) {
    const storeRecentActivities = [
      { id: 1, title: "Requisition approved", subtitle: "REQ-2026-088 • Approved by PAO", time: "10 mins ago", icon: ClipboardList, iconBg: "bg-emerald-100 text-emerald-700" },
      { id: 2, title: "Issue voucher created", subtitle: "SIV-2026-042 • Model 20 draft", time: "25 mins ago", icon: CheckSquare, iconBg: "bg-blue-100 text-blue-700" },
      { id: 3, title: "Stock issued", subtitle: "VOUCH-2026-019 • Model 22 issued", time: "1 hour ago", icon: Boxes, iconBg: "bg-purple-100 text-purple-700" },
      { id: 4, title: "Item returned", subtitle: "SRN-2026-005 • Condition A classified", time: "2 hours ago", icon: Undo2, iconBg: "bg-amber-100 text-amber-700" },
      { id: 5, title: "Stock transferred", subtitle: "TRF-2026-003 • Main Store -> Eng Store", time: "3 hours ago", icon: ArrowLeftRight, iconBg: "bg-teal-100 text-teal-700" },
    ];

    return (
      <div className="animate-fade-in space-y-6">
        {/* Store Head Header with VIBRANT Blue Gradient matching login */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-blue-400 dark:border-blue-700 bg-gradient-to-br from-blue-100 via-indigo-100 to-blue-200 dark:from-blue-900 dark:via-indigo-900 dark:to-blue-800 p-6 shadow-xl">
          {/* Decorative Pattern - More visible */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-300/40 dark:bg-blue-600/20 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-300/40 dark:bg-indigo-600/20 rounded-full -ml-24 -mb-24 blur-2xl"></div>
          
          <div className="relative z-10 flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 shadow-lg ring-4 ring-blue-200 dark:ring-blue-800">
                <Warehouse size={32} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-extrabold text-blue-900 dark:text-blue-50">
                    Store Head Dashboard
                  </h1>
                  <span className="rounded-full bg-blue-600 dark:bg-blue-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
                    {assignedStore ? assignedStore.name : "Main Store"}
                  </span>
                </div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-200">
                  Welcome back, <strong>{currentUser?.name}</strong>
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                  Store Operations · Requisitions, issue vouchers, stock issuance & bin control
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/goods-receipt">
                <button className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 px-4 py-2 text-xs font-bold text-white shadow-md hover:shadow-lg transition-all duration-300">
                  <Plus size={14} /> Record Delivery
                </button>
              </Link>
              <Link to="/bin-cards">
                <button className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 px-4 py-2 text-xs font-bold text-white shadow-md hover:shadow-lg transition-all duration-300">
                  <ArrowLeftRight size={14} /> Bin Transfer
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* 4 Metric Cards - Blue Borders in Light Mode Only */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {/* Card 1 - Amber with Blue Border */}
          <div className="group relative overflow-hidden rounded-2xl border-2 border-blue-300 dark:border-slate-700 bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950 dark:to-orange-950 p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-200/30 dark:bg-amber-800/20 rounded-full -mr-12 -mt-12 blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <ClipboardList size={24} className="text-amber-600 dark:text-amber-400" />
                <span className="rounded-full bg-amber-600 dark:bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                  Need Approval
                </span>
              </div>
              <p className="text-3xl font-extrabold text-amber-900 dark:text-amber-100 mb-1">
                {pendingRequisitions.length || 24}
              </p>
              <p className="text-xs font-bold text-amber-700 dark:text-amber-300">
                Pending Requisitions
              </p>
              <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">
                Requires review & approval
              </p>
            </div>
          </div>

          {/* Card 2 - Rose with Blue Border */}
          <div className="group relative overflow-hidden rounded-2xl border-2 border-blue-300 dark:border-rose-900 bg-gradient-to-br from-rose-50 to-pink-100 dark:from-rose-950 dark:to-pink-950 p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-200/30 dark:bg-rose-800/20 rounded-full -mr-12 -mt-12 blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <CheckSquare size={24} className="text-rose-600 dark:text-rose-400" />
                <span className="rounded-full bg-rose-600 dark:bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                  Awaiting
                </span>
              </div>
              <p className="text-3xl font-extrabold text-rose-900 dark:text-rose-100 mb-1">
                {preliminaryVouchers.length || 16}
              </p>
              <p className="text-xs font-bold text-rose-700 dark:text-rose-300">
                Pending Issue Vouchers
              </p>
              <p className="text-[10px] text-rose-600 dark:text-rose-400 mt-1">
                Model 20 to create
              </p>
            </div>
          </div>

          {/* Card 3 - Emerald with Blue Border */}
          <div className="group relative overflow-hidden rounded-2xl border-2 border-blue-300 dark:border-slate-700 bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-950 dark:to-teal-950 p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-200/30 dark:bg-emerald-800/20 rounded-full -mr-12 -mt-12 blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <Boxes size={24} className="text-emerald-600 dark:text-emerald-400" />
                <span className="rounded-full bg-emerald-600 dark:bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                  Available
                </span>
              </div>
              <p className="text-3xl font-extrabold text-emerald-900 dark:text-emerald-100 mb-1">
                {items.length || 1285}
              </p>
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                Stock Items
              </p>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">
                Items in this store
              </p>
            </div>
          </div>

          {/* Card 4 - Red with Blue Border */}
          <div className="group relative overflow-hidden rounded-2xl border-2 border-blue-300 dark:border-slate-700 bg-gradient-to-br from-red-50 to-orange-100 dark:from-red-950 dark:to-orange-950 p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-200/30 dark:bg-red-800/20 rounded-full -mr-12 -mt-12 blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <AlertTriangle size={24} className="text-red-600 dark:text-red-400" />
                <span className="rounded-full bg-red-600 dark:bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                  Below Min
                </span>
              </div>
              <p className="text-3xl font-extrabold text-red-900 dark:text-red-100 mb-1">
                {lowStockItems.length || 28}
              </p>
              <p className="text-xs font-bold text-red-700 dark:text-red-300">
                Low Stock Items
              </p>
              <p className="text-[10px] text-red-600 dark:text-red-400 mt-1">
                Need restocking urgently
              </p>
            </div>
          </div>
        </div>

        {/* 2-Column Analytics & Recent Activities Grid with Blue Borders */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="rounded-2xl border-2 border-blue-300 dark:border-slate-700 overflow-hidden shadow-xl">
              <DonutChart
                title="Stock Summary Distribution"
                total={items.length || 1285}
                totalLabel="Total Items"
                segments={[
                  { label: "Available", count: 1028, percentage: 79, color: "#10b981" },
                  { label: "Issued", count: 157, percentage: 12, color: "#3b82f6" },
                  { label: "Reserved", count: 68, percentage: 5, color: "#f59e0b" },
                  { label: "Low Stock", count: 32, percentage: 4, color: "#ef4444" },
                ]}
              />
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="rounded-2xl border-2 border-blue-300 dark:border-slate-700 overflow-hidden shadow-xl">
              <RecentListCard
                title="Recent Activities"
                items={storeRecentActivities}
                viewAllLink="/issue-vouchers"
                viewAllText="View All"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-5">
          <div className="rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl">
            <div className="mb-3 flex items-center justify-between border-b-2 border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ClipboardList size={18} className="text-navy-700" />
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Approved Requisitions Ready for Issue Voucher (Model 20)
                    Creation
                  </h2>
                  <p className="text-xs text-slate-400">
                    Requisitions approved by Department Head &amp; PAO ready to
                    be issued from this store.
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-navy-50 px-2.5 py-1 text-xs font-bold text-navy-800 ring-1 ring-navy-200">
                {storeApprovedReqs.length} Ready
              </span>
            </div>

            {storeApprovedReqs.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">
                No approved requisitions currently waiting for SIV creation.
              </p>
            ) : (
              <div className="divide-y-2 divide-slate-200 dark:divide-slate-800">
                {storeApprovedReqs.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between py-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-navy-900">
                          {req.refNo}
                        </span>
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-700">
                          {req.department}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-0.5">
                        Requested:{" "}
                        <strong>
                          {req.qty}x {req.itemName}
                        </strong>{" "}
                        by {req.requestedByName || "Staff"}
                      </p>
                    </div>
                    <button
                      onClick={() => createPreliminaryVoucher(req.id)}
                      className="flex items-center gap-1.5 rounded-lg bg-navy-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy-700 shadow-sm transition-all"
                    >
                      <ArrowRightCircle size={14} /> Create SIV (Model 20)
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl">
            <div className="mb-3 flex items-center justify-between border-b-2 border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CheckSquare size={18} className="text-clay-600" />
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Approved Issue Vouchers (Model 20) — Ready to Finalize &amp;
                    Deduct Stock (Model 22)
                  </h2>
                  <p className="text-xs text-slate-400">
                    Final issuance executes FIFO stock reduction and
                    automatically logs bin card deductions.
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-clay-50 px-2.5 py-1 text-xs font-bold text-clay-800 ring-1 ring-clay-200">
                {storePrelimVouchers.length} Ready to Issue
              </span>
            </div>

            {storePrelimVouchers.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">
                No approved vouchers awaiting final issuance.
              </p>
            ) : (
              <div className="divide-y-2 divide-slate-200 dark:divide-slate-800">
                {storePrelimVouchers.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between py-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-clay-800">
                          {v.refNo}
                        </span>
                        <span className="text-slate-400">
                          Ref: {v.requisitionRef}
                        </span>
                      </div>
                      <p className="text-slate-700 mt-0.5">
                        Material:{" "}
                        <strong>
                          {v.qty}x {v.itemName}
                        </strong>{" "}
                        (Store: {v.storeName})
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        to="/issue-vouchers"
                        className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
                      >
                        Inspect
                      </Link>
                      <button
                        onClick={() => finalizeVoucher(v.id)}
                        className="flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 shadow-sm transition-all"
                      >
                        <PackageCheck size={14} /> Finalize &amp; Issue (Model
                        22)
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-4">
            Store Operations Quick Launch
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Link
              to="/goods-receipt"
              className="flex flex-col items-center justify-center rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 p-4 text-center hover:border-university-300 dark:hover:border-university-700 hover:shadow-lg transition-all duration-150"
            >
              <PackageCheck size={20} className="text-university-700 dark:text-university-400 mb-1.5" />
              <p className="text-xs font-bold text-slate-900 dark:text-white">Goods Receipt</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Record delivery</p>
            </Link>

            <Link
              to="/locations"
              className="flex flex-col items-center justify-center rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 p-4 text-center hover:border-university-300 dark:hover:border-university-700 hover:shadow-lg transition-all duration-150"
            >
              <MapPin size={20} className="text-university-700 dark:text-university-400 mb-1.5" />
              <p className="text-xs font-bold text-slate-900 dark:text-white">Item Locations</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Bins &amp; shelves</p>
            </Link>

            <Link
              to="/bin-cards"
              className="flex flex-col items-center justify-center rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 p-4 text-center hover:border-university-300 dark:hover:border-university-700 hover:shadow-lg transition-all duration-150"
            >
              <ArrowLeftRight size={20} className="text-university-700 dark:text-university-400 mb-1.5" />
              <p className="text-xs font-bold text-slate-900 dark:text-white">Bin Transfers</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Internal store</p>
            </Link>

            <Link
              to="/transfers"
              className="flex flex-col items-center justify-center rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 p-4 text-center hover:border-university-300 dark:hover:border-university-700 hover:shadow-lg transition-all duration-150"
            >
              <Truck size={20} className="text-university-700 dark:text-university-400 mb-1.5" />
              <p className="text-xs font-bold text-slate-900 dark:text-white">Store Transfer</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Inter-store</p>
            </Link>

            <Link
              to="/disposal"
              className="flex flex-col items-center justify-center rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 p-4 text-center hover:border-university-300 dark:hover:border-university-700 hover:shadow-lg transition-all duration-150"
            >
              <Recycle size={20} className="text-university-700 dark:text-university-400 mb-1.5" />
              <p className="text-xs font-bold text-slate-900 dark:text-white">Flag Disposal</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Damaged/expired</p>
            </Link>

            <Link
              to="/stock-control"
              className="flex flex-col items-center justify-center rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 p-4 text-center hover:border-university-300 dark:hover:border-university-700 hover:shadow-lg transition-all duration-150"
            >
              <Scale size={20} className="text-university-700 dark:text-university-400 mb-1.5" />
              <p className="text-xs font-bold text-slate-900 dark:text-white">Stock Take</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Record counts</p>
            </Link>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl lg:col-span-2">
            <div className="mb-3 flex items-center justify-between border-b-2 border-slate-200 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <PackageCheck size={16} className="text-navy-700" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Recent Deliveries to this Store ({storeReceipts.length})
                </h2>
              </div>
              <Link
                to="/goods-receipt"
                className="text-xs font-bold text-university-600 dark:text-university-400 hover:underline"
              >
                View All
              </Link>
            </div>
            {storeReceipts.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">
                No goods receipts logged for this store yet.
              </p>
            ) : (
              <div className="divide-y-2 divide-slate-200 dark:divide-slate-800">
                {storeReceipts.slice(0, 5).map((gr) => (
                  <div
                    key={gr.id}
                    className="flex items-center justify-between py-2.5 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {gr.refNo}
                      </span>{" "}
                      — {gr.qty}x {gr.itemName} from {gr.supplierName}
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        PO: {gr.poReference} · {formatDate(gr.createdAt)}
                      </p>
                    </div>
                    <Badge>{gr.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl">
            <div className="mb-3 flex items-center gap-2">
              <TrendingDown size={16} className="text-rose-500" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Critical Stock Warnings
              </h2>
            </div>
            {reorderAlerts.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">
                All materials are above reorder thresholds.
              </p>
            ) : (
              <div className="space-y-2.5">
                {reorderAlerts.slice(0, 5).map((a) => (
                  <div
                    key={a.itemId}
                    className="flex items-center justify-between text-xs border-b border-slate-50 pb-2"
                  >
                    <div>
                      <p className="font-medium text-slate-800">{a.name}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">{a.code}</p>
                    </div>
                    <Badge
                      tone={
                        a.alertLevel === "Safety Stock Breach" ? "red" : "amber"
                      }
                    >
                      {a.qtyOnHand} left
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 4. STORE CLERK / STOREKEEPER DASHBOARD
  // -------------------------------------------------------------
  if (isStockClerk) {
    return (
      <div className="animate-fade-in space-y-6">
        {/* Stock Clerk Header with VIBRANT Blue Gradient matching login */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-blue-400 dark:border-blue-700 bg-gradient-to-br from-blue-100 via-indigo-100 to-blue-200 dark:from-blue-900 dark:via-indigo-900 dark:to-blue-800 p-6 shadow-xl">
          {/* Decorative Pattern - More visible */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-300/40 dark:bg-blue-600/20 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-300/40 dark:bg-indigo-600/20 rounded-full -ml-24 -mb-24 blur-2xl"></div>
          
          <div className="relative z-10 flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 shadow-lg ring-4 ring-blue-200 dark:ring-blue-800">
                <Boxes size={32} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-extrabold text-blue-900 dark:text-blue-50">
                    Stock Clerk Dashboard
                  </h1>
                  <span className="rounded-full bg-blue-600 dark:bg-blue-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
                    Inventory Operations
                  </span>
                </div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-200">
                  Welcome back, <strong>{currentUser?.name}</strong>
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                  {assignedStore ? `${assignedStore.name}` : "Store Unit"} · Goods logging, bin allocations & stock counts
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/goods-receipt">
                <button className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 px-4 py-2 text-xs font-bold text-white shadow-md hover:shadow-lg transition-all duration-300">
                  <Plus size={14} /> Record Goods Receipt
                </button>
              </Link>
              <Link to="/locations">
                <button className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-600 hover:to-sky-700 px-4 py-2 text-xs font-bold text-white shadow-md hover:shadow-lg transition-all duration-300">
                  <MapPin size={14} /> Update Bin Location
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* 4 Metric Cards - Blue Borders in Light Mode Only */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {/* Card 1 - Purple with Blue Border */}
          <div className="group relative overflow-hidden rounded-2xl border-2 border-blue-300 dark:border-slate-700 bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-950 dark:to-violet-950 p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-200/30 dark:bg-purple-800/20 rounded-full -mr-12 -mt-12 blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <PackageCheck size={24} className="text-purple-600 dark:text-purple-400" />
                <span className="rounded-full bg-purple-600 dark:bg-purple-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                  Receiving
                </span>
              </div>
              <p className="text-3xl font-extrabold text-purple-900 dark:text-purple-100 mb-1">
                {goodsReceipts.length}
              </p>
              <p className="text-xs font-bold text-purple-700 dark:text-purple-300">
                Goods Receipts Logged
              </p>
              <p className="text-[10px] text-purple-600 dark:text-purple-400 mt-1">
                {pendingReceipts.length} awaiting TEC review
              </p>
            </div>
          </div>

          {/* Card 2 - Cyan with Blue Border */}
          <div className="group relative overflow-hidden rounded-2xl border-2 border-blue-300 dark:border-slate-700 bg-gradient-to-br from-cyan-50 to-sky-100 dark:from-cyan-950 dark:to-sky-950 p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-200/30 dark:bg-cyan-800/20 rounded-full -mr-12 -mt-12 blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <MapPin size={24} className="text-cyan-600 dark:text-cyan-400" />
                <span className="rounded-full bg-cyan-600 dark:bg-cyan-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                  Locations
                </span>
              </div>
              <p className="text-3xl font-extrabold text-cyan-900 dark:text-cyan-100 mb-1">
                {binCards.length}
              </p>
              <p className="text-xs font-bold text-cyan-700 dark:text-cyan-300">
                Active Store Bins
              </p>
              <p className="text-[10px] text-cyan-600 dark:text-cyan-400 mt-1">
                Mapped storage locations
              </p>
            </div>
          </div>

          {/* Card 3 - Teal with Blue Border */}
          <div className="group relative overflow-hidden rounded-2xl border-2 border-blue-300 dark:border-slate-700 bg-gradient-to-br from-teal-50 to-emerald-100 dark:from-teal-950 dark:to-emerald-950 p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-24 h-24 bg-teal-200/30 dark:bg-teal-800/20 rounded-full -mr-12 -mt-12 blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <Scale size={24} className="text-teal-600 dark:text-teal-400" />
                <span className="rounded-full bg-teal-600 dark:bg-teal-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                  Counts
                </span>
              </div>
              <p className="text-3xl font-extrabold text-teal-900 dark:text-teal-100 mb-1">
                {stockTakes.filter((st) => st.status === "Scheduled").length}
              </p>
              <p className="text-xs font-bold text-teal-700 dark:text-teal-300">
                Physical Stock Takes
              </p>
              <p className="text-[10px] text-teal-600 dark:text-teal-400 mt-1">
                Scheduled count operations
              </p>
            </div>
          </div>

          {/* Card 4 - Rose/Purple with Blue Border */}
          <div className="group relative overflow-hidden rounded-2xl border-2 border-blue-300 dark:border-rose-900 bg-gradient-to-br from-rose-50 to-pink-100 dark:from-rose-950 dark:to-pink-950 p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-200/30 dark:bg-rose-800/20 rounded-full -mr-12 -mt-12 blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <AlertTriangle size={24} className="text-rose-600 dark:text-rose-400" />
                <span className="rounded-full bg-rose-600 dark:bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                  {reorderAlerts.length > 0 ? "Breach" : "Normal"}
                </span>
              </div>
              <p className="text-3xl font-extrabold text-rose-900 dark:text-rose-100 mb-1">
                {reorderAlerts.length}
              </p>
              <p className="text-xs font-bold text-rose-700 dark:text-rose-300">
                Low Stock Alerts
              </p>
              <p className="text-[10px] text-rose-600 dark:text-rose-400 mt-1">
                Safety stock / reorder breach
              </p>
            </div>
          </div>
        </div>

        {/* Analytics with Donut Chart */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="rounded-2xl border-2 border-blue-300 dark:border-slate-700 overflow-hidden shadow-xl">
              <DonutChart
                title="Inventory Distribution by Status"
                series={[
                  { name: "In Stock", value: items.filter(i => i.totalStock > 0).length || 45, color: "#10b981" },
                  { name: "Low Stock", value: reorderAlerts.length || 8, color: "#f59e0b" },
                  { name: "Out of Stock", value: items.filter(i => i.totalStock === 0).length || 3, color: "#ef4444" },
                  { name: "Pending Receipt", value: pendingReceipts.length || 5, color: "#8b5cf6" },
                ]}
              />
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="rounded-2xl border-2 border-blue-300 dark:border-slate-700 overflow-hidden shadow-xl">
              <RecentListCard
                title="Storekeeper Tasks"
                items={[
                  { id: 1, title: "Goods Receipts", subtitle: `${goodsReceipts.length} deliveries logged`, badge: `${goodsReceipts.length}`, badgeTone: "purple", icon: PackageCheck, iconBg: "bg-purple-100 text-purple-700" },
                  { id: 2, title: "Bin Locations", subtitle: `${binCards.length} storage slots active`, badge: "Active", badgeTone: "cyan", icon: MapPin, iconBg: "bg-cyan-100 text-cyan-700" },
                  { id: 3, title: "Stock Takes", subtitle: `${stockTakes.filter((st) => st.status === "Scheduled").length} counts scheduled`, badge: "Pending", badgeTone: "teal", icon: Scale, iconBg: "bg-teal-100 text-teal-700" },
                  { id: 4, title: "Low Stock Alerts", subtitle: `${reorderAlerts.length} items need reorder`, badge: reorderAlerts.length > 0 ? "Alert" : "OK", badgeTone: reorderAlerts.length > 0 ? "rose" : "emerald", icon: AlertTriangle, iconBg: reorderAlerts.length > 0 ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700" },
                ]}
                viewAllLink="/items"
                viewAllText="View Inventory"
              />
            </div>
          </div>
        </div>

        {/* Storekeeper Assisting Operations Hub */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-blue-300 dark:border-slate-700 bg-gradient-to-br from-white via-purple-50/20 to-violet-50/20 dark:from-slate-900 dark:via-purple-950/20 dark:to-violet-950/20 p-6 shadow-xl">
          <div className="absolute top-0 left-0 w-32 h-32 bg-purple-200/20 dark:bg-purple-800/10 rounded-full -ml-16 -mt-16 blur-2xl"></div>
          
          <div className="relative z-10">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 shadow-lg">
                <Boxes size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Storekeeper Day-to-Day Assisting Operations
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Quick access to inventory management tasks
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Link
                to="/goods-receipt"
                className="flex items-center justify-between rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-lg hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-400">
                    <PackageCheck size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      Record Delivery
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Log incoming goods
                    </p>
                  </div>
                </div>
                <ArrowRight
                  size={14}
                  className="text-slate-400 dark:text-slate-500 group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors"
                />
              </Link>

              <Link
                to="/locations"
                className="flex items-center justify-between rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-lg hover:border-cyan-300 dark:hover:border-cyan-700 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-400">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      Update Bin Locations
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Shelves &amp; slots
                    </p>
                  </div>
                </div>
                <ArrowRight
                  size={14}
                  className="text-slate-400 dark:text-slate-500 group-hover:text-cyan-700 dark:group-hover:text-cyan-400 transition-colors"
                />
              </Link>

              <Link
                to="/bin-cards"
                className="flex items-center justify-between rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-lg hover:border-teal-300 dark:hover:border-teal-700 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-400">
                    <ArrowLeftRight size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      Bin Transfer
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Move between bins
                    </p>
                  </div>
                </div>
                <ArrowRight
                  size={14}
                  className="text-slate-400 dark:text-slate-500 group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors"
                />
              </Link>

              <Link
                to="/stock-takes"
                className="flex items-center justify-between rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-lg hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400">
                    <Scale size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      Physical Stock Count
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Record take lines
                    </p>
                  </div>
                </div>
                <ArrowRight
                  size={14}
                  className="text-slate-400 dark:text-slate-500 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors"
                />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 5. TECHNICAL EVALUATION COMMITTEE (TEC) DASHBOARD
  // -------------------------------------------------------------
  if (isTEC) {
    return (
      <div className="animate-fade-in space-y-6">
        {/* TEC Header with VIBRANT Blue Gradient matching login */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-blue-400 dark:border-blue-700 bg-gradient-to-br from-blue-100 via-indigo-100 to-blue-200 dark:from-blue-900 dark:via-indigo-900 dark:to-blue-800 p-6 shadow-xl">
          {/* Decorative Pattern - More visible */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-300/40 dark:bg-blue-600/20 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-300/40 dark:bg-indigo-600/20 rounded-full -ml-24 -mb-24 blur-2xl"></div>
          
          <div className="relative z-10 flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg ring-4 ring-blue-200 dark:ring-blue-800">
                <Search size={32} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-extrabold text-blue-900 dark:text-blue-50">
                    Technical Evaluation Dashboard
                  </h1>
                  <span className="rounded-full bg-blue-600 dark:bg-blue-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
                    Technical Authority
                  </span>
                </div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-200">
                  Welcome back, <strong>{currentUser?.name}</strong>
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                  TEC Panel · Technical inspection for goods, returns & disposal justifications
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/goods-receipt">
                <button className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 px-4 py-2 text-xs font-bold text-white shadow-md hover:shadow-lg transition-all duration-300">
                  <Search size={14} /> Inspect Deliveries
                </button>
              </Link>
              <Link to="/returns">
                <button className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 px-4 py-2 text-xs font-bold text-white shadow-md hover:shadow-lg transition-all duration-300">
                  <Undo2 size={14} /> Classify Returns
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* 4 Metric Cards - Blue Borders in Light Mode Only */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {/* Card 1 - Indigo with Blue Border */}
          <div className="group relative overflow-hidden rounded-2xl border-2 border-blue-300 dark:border-slate-700 bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-indigo-950 dark:to-purple-950 p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-200/30 dark:bg-indigo-800/20 rounded-full -mr-12 -mt-12 blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <PackageCheck size={24} className="text-indigo-600 dark:text-indigo-400" />
                <span className="rounded-full bg-indigo-600 dark:bg-indigo-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                  Model 19 Stage
                </span>
              </div>
              <p className="text-3xl font-extrabold text-indigo-900 dark:text-indigo-100 mb-1">
                {pendingReceipts.length}
              </p>
              <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                Pending Receipts Inspection
              </p>
              <p className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-1">
                Awaiting technical inspection
              </p>
            </div>
          </div>

          {/* Card 2 - Cyan with Blue Border */}
          <div className="group relative overflow-hidden rounded-2xl border-2 border-blue-300 dark:border-slate-700 bg-gradient-to-br from-cyan-50 to-blue-100 dark:from-cyan-950 dark:to-blue-950 p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-200/30 dark:bg-cyan-800/20 rounded-full -mr-12 -mt-12 blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <Undo2 size={24} className="text-cyan-600 dark:text-cyan-400" />
                <span className="rounded-full bg-cyan-600 dark:bg-cyan-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                  SRN Stage
                </span>
              </div>
              <p className="text-3xl font-extrabold text-cyan-900 dark:text-cyan-100 mb-1">
                {pendingReturnsEvaluation.length}
              </p>
              <p className="text-xs font-bold text-cyan-700 dark:text-cyan-300">
                Pending Returns Inspection
              </p>
              <p className="text-[10px] text-cyan-600 dark:text-cyan-400 mt-1">
                Awaiting condition classification
              </p>
            </div>
          </div>

          {/* Card 3 - Rose with Blue Border */}
          <div className="group relative overflow-hidden rounded-2xl border-2 border-blue-300 dark:border-slate-700 bg-gradient-to-br from-rose-50 to-red-100 dark:from-rose-950 dark:to-red-950 p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-200/30 dark:bg-rose-800/20 rounded-full -mr-12 -mt-12 blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <Recycle size={24} className="text-rose-600 dark:text-rose-400" />
                <span className="rounded-full bg-rose-600 dark:bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                  Disposal
                </span>
              </div>
              <p className="text-3xl font-extrabold text-rose-900 dark:text-rose-100 mb-1">
                {pendingDisposals.length}
              </p>
              <p className="text-xs font-bold text-rose-700 dark:text-rose-300">
                Flagged for Disposal
              </p>
              <p className="text-[10px] text-rose-600 dark:text-rose-400 mt-1">
                Requires technical justification
              </p>
            </div>
          </div>

          {/* Card 4 - Emerald with Blue Border */}
          <div className="group relative overflow-hidden rounded-2xl border-2 border-blue-300 dark:border-slate-700 bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-950 dark:to-teal-950 p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-200/30 dark:bg-emerald-800/20 rounded-full -mr-12 -mt-12 blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <CheckCircle2 size={24} className="text-emerald-600 dark:text-emerald-400" />
                <span className="rounded-full bg-emerald-600 dark:bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                  Verified
                </span>
              </div>
              <p className="text-3xl font-extrabold text-emerald-900 dark:text-emerald-100 mb-1">
                {approvedReceipts.length + evaluatedReturns.length}
              </p>
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                Inspections Completed
              </p>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">
                Total verified dossiers
              </p>
            </div>
          </div>
        </div>

        {/* Analytics with AreaLineChart */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="rounded-2xl border-2 border-blue-300 dark:border-slate-700 overflow-hidden shadow-xl">
              <AreaLineChart
                title="Technical Inspection Activity - Monthly"
                categories={["Jan", "Feb", "Mar", "Apr", "May", "Jun"]}
                series={[
                  { name: "Receipts Approved", color: "#10b981", data: [12, 18, 15, 22, 20, approvedReceipts.length || 25] },
                  { name: "Returns Evaluated", color: "#06b6d4", data: [5, 8, 7, 10, 9, evaluatedReturns.length || 12] },
                  { name: "Disposals Verified", color: "#ef4444", data: [2, 3, 4, 3, 5, pendingDisposals.length || 4] },
                ]}
              />
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="rounded-2xl border-2 border-blue-300 dark:border-slate-700 overflow-hidden shadow-xl">
              <RecentListCard
                title="TEC Panel Tasks"
                items={[
                  { id: 1, title: "Receipts Inspection", subtitle: `${pendingReceipts.length} awaiting technical review`, badge: `${pendingReceipts.length}`, badgeTone: "indigo", icon: PackageCheck, iconBg: "bg-indigo-100 text-indigo-700" },
                  { id: 2, title: "Returns Classification", subtitle: `${pendingReturnsEvaluation.length} condition assessments needed`, badge: `${pendingReturnsEvaluation.length}`, badgeTone: "cyan", icon: Undo2, iconBg: "bg-cyan-100 text-cyan-700" },
                  { id: 3, title: "Disposal Justifications", subtitle: `${pendingDisposals.length} technical reviews pending`, badge: "Pending", badgeTone: "rose", icon: Recycle, iconBg: "bg-rose-100 text-rose-700" },
                  { id: 4, title: "Completed Inspections", subtitle: `${approvedReceipts.length + evaluatedReturns.length} verified dossiers`, badge: "Done", badgeTone: "emerald", icon: CheckCircle2, iconBg: "bg-emerald-100 text-emerald-700" },
                ]}
                viewAllLink="/goods-receipt"
                viewAllText="View All Inspections"
              />
            </div>
          </div>
        </div>

        {/* TEC Live Inspection Queues */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-blue-300 dark:border-slate-700 bg-gradient-to-br from-white via-indigo-50/20 to-purple-50/20 dark:from-slate-900 dark:via-indigo-950/20 dark:to-purple-950/20 p-6 shadow-xl">
          <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-200/20 dark:bg-indigo-800/10 rounded-full -ml-16 -mt-16 blur-2xl"></div>
          
          <div className="relative z-10">
            <div className="mb-4 flex items-center justify-between border-b-2 border-blue-300 dark:border-slate-700 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
                  <PackageCheck size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    Goods Receipts Awaiting Technical Inspection
                    {pendingReceipts.length > 0 && (
                      <span className="text-xs font-normal text-indigo-600 dark:text-indigo-400">
                        · {pendingReceipts.length} awaiting review
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Inspect physical specifications against Purchase Order / Donor agreement and record Approve/Reject with remarks
                  </p>
                </div>
              </div>
              <Link
                to="/goods-receipt"
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                View All <ArrowRight size={12} />
              </Link>
            </div>

            {pendingReceipts.length === 0 ? (
              <div className="py-12 text-center">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950 dark:to-teal-950 shadow-lg">
                  <CheckCircle2 size={40} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Inspection Queue Clear! 🎉
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  All receipts have been technically inspected
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingReceipts.map((gr) => (
                  <div
                    key={gr.id}
                    className="group relative overflow-hidden rounded-xl border-2 border-white dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-indigo-400 via-purple-500 to-indigo-600"></div>
                    
                    <div className="ml-2 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-mono text-xs font-bold text-indigo-900 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-950/50 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800">
                            {gr.refNo}
                          </span>
                          <Badge tone="slate">PO: {gr.poReference}</Badge>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            Store: {gr.storeName}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                          {gr.qty}x {gr.itemName}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          Supplier: <em>{gr.supplierName}</em>
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setEvalReceiptTarget(gr);
                          setReceiptRemarks("");
                        }}
                        className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all"
                      >
                        <Search size={13} /> Inspect &amp; Evaluate
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
  // -------------------------------------------------------------
  // 6. PROPERTY REGISTRATION OFFICER (PRO) DASHBOARD
  // -------------------------------------------------------------
  if (isPRO) {
    // Receipts TEC-approved but GRN not yet generated
    const awaitingGrn = goodsReceipts.filter((g) => g.status === "Approved");
    // Fixed assets missing custodian (empty custodianName)
    const unassignedAssets = fixedAssets.filter(
      (f) => !f.custodianName || f.custodianName.trim() === "",
    );
    const grnsGenerated = goodsReceipts.filter(
      (g) => g.status === "GRN Generated",
    );

    return (
      <div className="animate-fade-in space-y-6">
        {/* PRO Header with VIBRANT Blue Gradient matching login */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-blue-400 dark:border-blue-700 bg-gradient-to-br from-blue-100 via-indigo-100 to-blue-200 dark:from-blue-900 dark:via-indigo-900 dark:to-blue-800 p-6 shadow-xl">
          {/* Decorative Pattern - More visible */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-300/40 dark:bg-blue-600/20 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-300/40 dark:bg-indigo-600/20 rounded-full -ml-24 -mb-24 blur-2xl"></div>
          
          <div className="relative z-10 flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 shadow-lg ring-4 ring-blue-200 dark:ring-blue-800">
                <FileCheck size={32} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-extrabold text-blue-900 dark:text-blue-50">
                    Property Registration Dashboard
                  </h1>
                  <span className="rounded-full bg-blue-600 dark:bg-blue-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
                    Asset Registrar
                  </span>
                </div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-200">
                  Welcome back, <strong>{currentUser?.name}</strong>
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                  Property Registry · GRN generation, asset tag registration & custodian allocation
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/fixed-assets">
                <button className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 px-4 py-2 text-xs font-bold text-white shadow-md hover:shadow-lg transition-all duration-300">
                  <Plus size={14} /> Register Asset
                </button>
              </Link>
              <Link to="/audit-log">
                <button className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 px-4 py-2 text-xs font-bold text-white shadow-md hover:shadow-lg transition-all duration-300">
                  <ShieldCheck size={14} /> Audit Trail
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* 4 Metric Cards - Blue Borders in Light Mode Only */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {/* Card 1 - Teal with Blue Border */}
          <div className="group relative overflow-hidden rounded-2xl border-2 border-blue-300 dark:border-slate-700 bg-gradient-to-br from-teal-50 to-cyan-100 dark:from-teal-950 dark:to-cyan-950 p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-24 h-24 bg-teal-200/30 dark:bg-teal-800/20 rounded-full -mr-12 -mt-12 blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <FileCheck size={24} className="text-teal-600 dark:text-teal-400" />
                <span className="rounded-full bg-teal-600 dark:bg-teal-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                  Model 19 Ready
                </span>
              </div>
              <p className="text-3xl font-extrabold text-teal-900 dark:text-teal-100 mb-1">
                {awaitingGrn.length}
              </p>
              <p className="text-xs font-bold text-teal-700 dark:text-teal-300">
                Awaiting GRN Generation
              </p>
              <p className="text-[10px] text-teal-600 dark:text-teal-400 mt-1">
                TEC-approved receipts pending
              </p>
            </div>
          </div>

          {/* Card 2 - Slate with Blue Border */}
          <div className="group relative overflow-hidden rounded-2xl border-2 border-blue-300 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-24 h-24 bg-slate-200/30 dark:bg-slate-800/20 rounded-full -mr-12 -mt-12 blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <PackageCheck size={24} className="text-slate-600 dark:text-slate-400" />
                <span className="rounded-full bg-slate-600 dark:bg-slate-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                  Archived
                </span>
              </div>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 mb-1">
                {grnsGenerated.length}
              </p>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                GRNs Generated
              </p>
              <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-1">
                Official Model 19 documents issued
              </p>
            </div>
          </div>

          {/* Card 3 - Emerald with Blue Border */}
          <div className="group relative overflow-hidden rounded-2xl border-2 border-blue-300 dark:border-slate-700 bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-950 dark:to-teal-950 p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-200/30 dark:bg-emerald-800/20 rounded-full -mr-12 -mt-12 blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <CreditCard size={24} className="text-emerald-600 dark:text-emerald-400" />
                <span className="rounded-full bg-emerald-600 dark:bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                  In Use
                </span>
              </div>
              <p className="text-3xl font-extrabold text-emerald-900 dark:text-emerald-100 mb-1">
                {fixedAssets.length}
              </p>
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                Registered Fixed Assets
              </p>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">
                {activeFixedAssets.length} currently active
              </p>
            </div>
          </div>

          {/* Card 4 - Amber with Blue Border */}
          <div className="group relative overflow-hidden rounded-2xl border-2 border-blue-300 dark:border-slate-700 bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950 dark:to-orange-950 p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-200/30 dark:bg-amber-800/20 rounded-full -mr-12 -mt-12 blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <Users size={24} className="text-amber-600 dark:text-amber-400" />
                <span className="rounded-full bg-amber-600 dark:bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                  {unassignedAssets.length > 0 ? "Pending" : "Complete"}
                </span>
              </div>
              <p className="text-3xl font-extrabold text-amber-900 dark:text-amber-100 mb-1">
                {unassignedAssets.length}
              </p>
              <p className="text-xs font-bold text-amber-700 dark:text-amber-300">
                Unassigned Assets
              </p>
              <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">
                Awaiting custodian assignment
              </p>
            </div>
          </div>
        </div>

        {/* Analytics with Grouped Bar Chart */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="rounded-2xl border-2 border-blue-300 dark:border-slate-700 overflow-hidden shadow-xl">
              <GroupedBarChart
                title="Property Registration Activity - Quarterly"
                categories={["Q1", "Q2", "Q3", "Q4"]}
                series={[
                  { name: "GRNs Generated", color: "#14b8a6", data: [25, 32, 28, grnsGenerated.length || 30] },
                  { name: "Assets Registered", color: "#10b981", data: [15, 18, 20, fixedAssets.length || 22] },
                  { name: "Custodians Assigned", color: "#f59e0b", data: [12, 15, 18, (fixedAssets.length - unassignedAssets.length) || 20] },
                ]}
              />
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="rounded-2xl border-2 border-blue-300 dark:border-slate-700 overflow-hidden shadow-xl">
              <RecentListCard
                title="PRO Registry Tasks"
                items={[
                  { id: 1, title: "Pending GRNs", subtitle: `${awaitingGrn.length} Model 19 documents to generate`, badge: `${awaitingGrn.length}`, badgeTone: "teal", icon: FileCheck, iconBg: "bg-teal-100 text-teal-700" },
                  { id: 2, title: "Generated GRNs", subtitle: `${grnsGenerated.length} official documents archived`, badge: "Done", badgeTone: "slate", icon: PackageCheck, iconBg: "bg-slate-100 text-slate-700" },
                  { id: 3, title: "Fixed Assets", subtitle: `${fixedAssets.length} assets in registry`, badge: "Active", badgeTone: "emerald", icon: CreditCard, iconBg: "bg-emerald-100 text-emerald-700" },
                  { id: 4, title: "Unassigned Assets", subtitle: `${unassignedAssets.length} need custodian allocation`, badge: unassignedAssets.length > 0 ? "Pending" : "Complete", badgeTone: unassignedAssets.length > 0 ? "amber" : "emerald", icon: Users, iconBg: unassignedAssets.length > 0 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700" },
                ]}
                viewAllLink="/goods-receipt"
                viewAllText="View All GRNs"
              />
            </div>
          </div>
        </div>

        {/* Worklist A: TEC-Approved Receipts Awaiting GRN */}
        <div className="mt-6 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl">
          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <FileCheck size={18} className="text-navy-700" />
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  TEC-Approved Goods Receipts — Generate Official GRN (Model 19)
                </h2>
                <p className="text-xs text-slate-400">
                  These receipts have been technically approved. Generate the
                  official Goods Receiving Note to credit stock.
                </p>
              </div>
            </div>
            <span className="rounded-full bg-clay-50 px-2.5 py-1 text-xs font-bold text-clay-700 ring-1 ring-clay-200">
              {awaitingGrn.length} Pending
            </span>
          </div>

          {awaitingGrn.length === 0 ? (
            <div className="py-8 text-center">
              <CheckCircle2
                size={32}
                className="mx-auto text-emerald-500 mb-2 opacity-80"
              />
              <p className="text-sm font-medium text-slate-700">
                All approved receipts have been GRN'd.
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                No receipts are waiting for Model 19 generation.
              </p>
            </div>
          ) : (
            <div className="divide-y-2 divide-slate-200 dark:divide-slate-800">
              {awaitingGrn.map((gr) => (
                <div
                  key={gr.id}
                  className="flex items-center justify-between py-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-navy-900">
                        {gr.refNo}
                      </span>
                      <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                        TEC Approved
                      </span>
                      <span className="text-slate-400">
                        Store: {gr.storeName}
                      </span>
                    </div>
                    <p className="text-slate-700 mt-0.5">
                      Material:{" "}
                      <strong>
                        {gr.qty}x {gr.itemName}
                      </strong>{" "}
                      from <em>{gr.supplierName}</em>
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      PO Ref: {gr.poReference} · Received:{" "}
                      {new Date(gr.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => generateGRN && generateGRN(gr.id)}
                    className="flex items-center gap-1.5 rounded-lg bg-navy-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy-700 shadow-sm transition-all"
                  >
                    <FileCheck size={14} /> Generate GRN (Model 19)
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Worklist B: Fixed Assets without Custodian */}
        {unassignedAssets.length > 0 && (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50/60 p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between border-b border-amber-100 pb-3">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-amber-700" />
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Fixed Assets Without Custodian Assignment (
                    {unassignedAssets.length})
                  </h2>
                  <p className="text-xs text-slate-500">
                    Assign a custodian and department to complete the
                    fixed-asset registration.
                  </p>
                </div>
              </div>
              <Link
                to="/fixed-assets"
                className="text-xs font-bold text-university-600 dark:text-university-400 hover:underline"
              >
                Manage Assets
              </Link>
            </div>
            <div className="divide-y divide-amber-100">
              {unassignedAssets.slice(0, 4).map((fa) => (
                <div
                  key={fa.id}
                  className="flex items-center justify-between py-2.5 text-xs"
                >
                  <div>
                    <span className="font-mono font-semibold text-slate-800">
                      {fa.tag}
                    </span>
                    <span className="ml-2 text-slate-500">
                      {fa.itemName || "—"}
                    </span>
                  </div>
                  <Link
                    to="/fixed-assets"
                    className="rounded-lg bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-200 transition-colors"
                  >
                    Assign Custodian
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PRO Quick Actions */}
        <div className="mt-6 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 p-5 shadow-xl">
          <p className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Package size={16} className="text-university-600 dark:text-university-400" />
            PRO Quick Actions
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <Link
              to="/goods-receipt"
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 shadow-sm hover:border-navy-300 hover:shadow transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-navy-100 text-navy-800">
                  <PackageCheck size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    GRN Log
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">All receipts</p>
                </div>
              </div>
              <ArrowRight
                size={14}
                className="text-slate-400 group-hover:text-navy-700 transition-colors"
              />
            </Link>

            <Link
              to="/fixed-assets"
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 shadow-sm hover:border-navy-300 hover:shadow transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-clay-100 text-clay-800">
                  <CreditCard size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Fixed Assets
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Asset register</p>
                </div>
              </div>
              <ArrowRight
                size={14}
                className="text-slate-400 group-hover:text-navy-700 transition-colors"
              />
            </Link>

            <Link
              to="/fixed-assets"
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 shadow-sm hover:border-navy-300 hover:shadow transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-100 text-emerald-800">
                  <Users size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    User-Cards
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Custody records</p>
                </div>
              </div>
              <ArrowRight
                size={14}
                className="text-slate-400 group-hover:text-navy-700 transition-colors"
              />
            </Link>

            <Link
              to="/audit-log"
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 shadow-sm hover:border-navy-300 hover:shadow transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-slate-700">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Audit Trail
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Asset history</p>
                </div>
              </div>
              <ArrowRight
                size={14}
                className="text-slate-400 group-hover:text-navy-700 transition-colors"
              />
            </Link>
          </div>
        </div>

        {/* Recent GRNs */}
        <div className="mt-6 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl">
          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <PackageCheck size={16} className="text-navy-700" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Recently Generated GRNs
              </h2>
            </div>
            <Link
              to="/goods-receipt"
              className="text-xs font-bold text-university-600 dark:text-university-400 hover:underline"
            >
              View All
            </Link>
          </div>
          {grnsGenerated.length === 0 ? (
            <p className="py-4 text-center text-xs text-slate-400">
              No GRNs generated yet.
            </p>
          ) : (
            <div className="divide-y-2 divide-slate-200 dark:divide-slate-800">
              {grnsGenerated.slice(0, 5).map((gr) => (
                <div
                  key={gr.id}
                  className="flex items-center justify-between py-2.5 text-xs"
                >
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {gr.refNo}
                    </span>
                    <span className="ml-2 text-slate-500">
                      {gr.qty}x {gr.itemName}
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      GRN: {gr.grnNumber || "—"} · {gr.storeName}
                    </p>
                  </div>
                  <span className="rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                    GRN Generated
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 7. DEPARTMENT / UNIT HEAD DASHBOARD
  // -------------------------------------------------------------
  if (isDeptHead) {
    const myDept =
      currentUser?.department || currentUser?.name || "Engineering College";

    // Unit-scoped data
    const myRequisitions = requisitions.filter(
      (r) =>
        !currentUser?.department ||
        r.department?.toLowerCase() === currentUser.department.toLowerCase() ||
        r.requestedByName === currentUser.name,
    );
    const myPendingReqs = requisitions.filter(
      (r) =>
        ["Pending Department Approval", "Pending Approval"].includes(
          r.status,
        ) &&
        (!currentUser?.department ||
          r.department?.toLowerCase() === currentUser.department.toLowerCase()),
    );
    const myReturns = returns.filter(
      (r) =>
        !currentUser?.department ||
        r.department?.toLowerCase() === currentUser.department.toLowerCase() ||
        r.returnedByName === currentUser.name,
    );
    const myPendingReturns = returns.filter(
      (r) =>
        ["Pending Department Approval", "Pending Approval"].includes(
          r.status,
        ) &&
        (!currentUser?.department ||
          r.department?.toLowerCase() === currentUser.department.toLowerCase()),
    );
    const myTransfers = transfers.filter(
      (t) =>
        !currentUser?.department ||
        t.fromStoreName
          ?.toLowerCase()
          .includes(currentUser.department.toLowerCase()) ||
        t.toStoreName
          ?.toLowerCase()
          .includes(currentUser.department.toLowerCase()),
    );
    const myAssets = fixedAssets.filter(
      (f) =>
        !currentUser?.department ||
        f.department?.toLowerCase() === currentUser.department.toLowerCase(),
    );
    const myUserCards = userCards.filter(
      (uc) =>
        !currentUser?.department ||
        uc.department?.toLowerCase() === currentUser.department.toLowerCase(),
    );
    const unitUserCards = myUserCards.length > 0 ? myUserCards : userCards;

    const issuedVouchers = issueVouchers.filter(
      (voucher) => voucher.status === "Issued",
    );

    const myTasks = [
      { id: 1, title: "Staff Requisitions", subtitle: `${myPendingReqs.length} pending dept approval`, badge: `${myPendingReqs.length}`, badgeTone: "amber", icon: ClipboardList, iconBg: "bg-amber-100 text-amber-700" },
      { id: 2, title: "Staff Returns", subtitle: `${myPendingReturns.length} returns awaiting review`, badge: `${myPendingReturns.length}`, badgeTone: "blue", icon: Undo2, iconBg: "bg-blue-100 text-blue-700" },
      { id: 3, title: "Fixed Assets", subtitle: `${myAssets.length} items under custody`, badge: `${myAssets.length}`, badgeTone: "green", icon: CreditCard, iconBg: "bg-emerald-100 text-emerald-700" },
      { id: 4, title: "Staff User-Cards", subtitle: `${unitUserCards.length} individual accounts`, badge: `${unitUserCards.length}`, badgeTone: "purple", icon: UserCheck, iconBg: "bg-purple-100 text-purple-700" },
    ];

    return (
      <div className="animate-fade-in space-y-6">
        {/* Department-specific Header with VIBRANT Blue Gradient matching login */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-blue-400 dark:border-blue-700 bg-gradient-to-br from-blue-100 via-indigo-100 to-blue-200 dark:from-blue-900 dark:via-indigo-900 dark:to-blue-800 p-6 shadow-xl">
          {/* Decorative Pattern - More visible */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-300/40 dark:bg-blue-600/20 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-300/40 dark:bg-indigo-600/20 rounded-full -ml-24 -mb-24 blur-2xl"></div>
          
          <div className="relative z-10 flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg ring-4 ring-blue-200 dark:ring-blue-800">
                <UserCheck size={32} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-extrabold text-blue-900 dark:text-blue-50">
                    Department Dashboard
                  </h1>
                  <span className="rounded-full bg-blue-600 dark:bg-blue-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
                    Unit Head
                  </span>
                </div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-200">
                  Welcome back, <strong>{currentUser?.name}</strong>
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                  {myDept} · Staff requisitions, returns & departmental assets
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setDeptReqForm({
                    department: currentUser?.department || "Engineering College",
                    storeId: stores[0]?.id || "",
                    itemId: items[0]?.id || "",
                    qty: 1,
                  });
                  setDeptReqOpen(true);
                }}
                className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 px-4 py-2 text-xs font-bold text-white shadow-md hover:shadow-lg transition-all duration-300"
              >
                <Plus size={14} /> New Requisition
              </button>
              <Link to="/fixed-assets">
                <button className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 px-4 py-2 text-xs font-bold text-white shadow-md hover:shadow-lg transition-all duration-300">
                  <CreditCard size={14} /> Assets
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* 4 Metric Cards with Unique Styling */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {/* Card 1 - Blue theme (Primary) */}
          <div className="group relative overflow-hidden rounded-2xl border-2 border-blue-200 dark:border-blue-900 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-950 p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-200/30 dark:bg-blue-800/20 rounded-full -mr-12 -mt-12 blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <ClipboardList size={24} className="text-blue-600 dark:text-blue-400" />
                <span className="rounded-full bg-blue-600 dark:bg-blue-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                  Dept Approval
                </span>
              </div>
              <p className="text-3xl font-extrabold text-blue-900 dark:text-blue-100 mb-1">
                {myPendingReqs.length}
              </p>
              <p className="text-xs font-bold text-blue-700 dark:text-blue-300">
                Staff Requisitions Pending
              </p>
            </div>
          </div>

          {/* Card 2 - Cyan theme */}
          <div className="group relative overflow-hidden rounded-2xl border-2 border-cyan-200 dark:border-slate-700 bg-gradient-to-br from-cyan-50 to-sky-100 dark:from-cyan-950 dark:to-sky-950 p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-200/30 dark:bg-cyan-800/20 rounded-full -mr-12 -mt-12 blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <Undo2 size={24} className="text-cyan-600 dark:text-cyan-400" />
                <span className="rounded-full bg-cyan-600 dark:bg-cyan-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                  Review Needed
                </span>
              </div>
              <p className="text-3xl font-extrabold text-cyan-900 dark:text-cyan-100 mb-1">
                {myPendingReturns.length}
              </p>
              <p className="text-xs font-bold text-cyan-700 dark:text-cyan-300">
                Staff Returns Pending
              </p>
            </div>
          </div>

          {/* Card 3 - Emerald theme */}
          <div className="group relative overflow-hidden rounded-2xl border-2 border-emerald-200 dark:border-slate-700 bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-950 dark:to-teal-950 p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-200/30 dark:bg-emerald-800/20 rounded-full -mr-12 -mt-12 blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <CreditCard size={24} className="text-emerald-600 dark:text-emerald-400" />
                <span className="rounded-full bg-emerald-600 dark:bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                  Under Custody
                </span>
              </div>
              <p className="text-3xl font-extrabold text-emerald-900 dark:text-emerald-100 mb-1">
                {myAssets.length}
              </p>
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                Unit Fixed Assets
              </p>
            </div>
          </div>

          {/* Card 4 - Purple theme */}
          <div className="group relative overflow-hidden rounded-2xl border-2 border-purple-200 dark:border-slate-700 bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-950 dark:to-violet-950 p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-200/30 dark:bg-purple-800/20 rounded-full -mr-12 -mt-12 blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <UserCheck size={24} className="text-purple-600 dark:text-purple-400" />
                <span className="rounded-full bg-purple-600 dark:bg-purple-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                  Accounts
                </span>
              </div>
              <p className="text-3xl font-extrabold text-purple-900 dark:text-purple-100 mb-1">
                {unitUserCards.length}
              </p>
              <p className="text-xs font-bold text-purple-700 dark:text-purple-300">
                Staff User-Cards
              </p>
            </div>
          </div>
        </div>

        {/* 2-Column Analytics & Tasks Grid with Blue Accent */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="rounded-2xl border-2 border-blue-200 dark:border-blue-900 overflow-hidden shadow-xl">
              <GroupedBarChart
                title="Department Activity Overview"
                categories={["Week 1", "Week 2", "Week 3", "Week 4", "Current"]}
                series={[
                  { name: "Requisitions", color: "#3b82f6", data: [8, 12, 10, 14, myPendingReqs.length || 6] },
                  { name: "Returns", color: "#06b6d4", data: [2, 4, 3, 5, myPendingReturns.length || 2] },
                ]}
              />
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="rounded-2xl border-2 border-blue-200 dark:border-blue-900 overflow-hidden shadow-xl">
              <RecentListCard
                title="My Tasks"
                items={myTasks}
                viewAllLink="/requisitions"
                viewAllText="View All"
              />
            </div>
          </div>
        </div>

        {/* Department Approval Queue with Blue Theme */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-blue-200 dark:border-blue-900 bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 dark:from-slate-900 dark:via-blue-950/30 dark:to-indigo-950/30 p-6 shadow-xl">
          {/* Decorative Elements */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-blue-200/20 dark:bg-blue-800/10 rounded-full -ml-16 -mt-16 blur-2xl"></div>
          
          <div className="relative z-10">
            <div className="mb-4 flex items-center justify-between border-b-2 border-blue-200 dark:border-blue-900 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                  <CheckSquare size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    Unit Approval Queue
                    <span className="text-xs font-normal text-blue-600 dark:text-blue-400">· Department Review</span>
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    First-level approval for staff requisitions and returns
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-md">
                  {myPendingReqs.length + myPendingReturns.length} Pending
                </span>
              </div>
            </div>

            {myPendingReqs.length === 0 && myPendingReturns.length === 0 ? (
              <div className="py-12 text-center">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950 dark:to-teal-950 shadow-lg">
                  <CheckCircle2 size={40} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
                  All Clear! 🎉
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  No staff requisitions or returns awaiting your decision.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Staff Requisitions with Slate/Blue Theme */}
                {myPendingReqs.length > 0 && (
                  <div className="rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50/50 to-blue-50/30 dark:from-slate-950/30 dark:to-blue-950/20 p-4 shadow-md">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-slate-500 to-blue-600 shadow-sm">
                          <ClipboardList size={16} className="text-white" />
                        </div>
                        <p className="text-xs font-extrabold text-slate-900 dark:text-slate-200 uppercase tracking-wide">
                          Staff Requisitions ({myPendingReqs.length})
                        </p>
                      </div>
                      <Link
                        to="/requisitions?view=staff-approvals"
                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                      >
                        View All <ArrowRight size={12} />
                      </Link>
                    </div>
                    <div className="space-y-2">
                      {myPendingReqs.slice(0, 3).map((r) => (
                        <div
                          key={r.id}
                          className="group relative overflow-hidden rounded-xl border-2 border-white dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                        >
                          {/* Left Accent Stripe */}
                          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-blue-400 via-indigo-500 to-blue-600"></div>
                          
                          <div className="ml-2 flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-mono text-xs font-bold text-blue-900 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/50 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800">
                                  {r.refNo}
                                </span>
                                <span className="text-xs text-slate-600 dark:text-slate-400">
                                  {r.storeName}
                                </span>
                              </div>
                              <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                                {r.qty}x {r.itemName}
                              </p>
                              <p className="text-xs text-slate-600 dark:text-slate-400">
                                By: {r.requestedByName || "Staff"} · {new Date(r.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <button
                                onClick={() => decideRequisition(r.id, "Approved")}
                                className="group/btn relative overflow-hidden rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                              >
                                <span className="relative z-10">Approve</span>
                              </button>
                              <button
                                onClick={() => decideRequisition(r.id, "Rejected")}
                                className="rounded-lg bg-gradient-to-r from-rose-500 to-red-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Staff Returns with Cyan Theme */}
                {myPendingReturns.length > 0 && (
                  <div className="rounded-xl border-2 border-cyan-200 dark:border-slate-700 bg-gradient-to-br from-cyan-50/50 to-sky-50/50 dark:from-cyan-950/30 dark:to-sky-950/30 p-4 shadow-md">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-sky-600 shadow-sm">
                          <Undo2 size={16} className="text-white" />
                        </div>
                        <p className="text-xs font-extrabold text-cyan-900 dark:text-cyan-200 uppercase tracking-wide">
                          Staff Returns (SRN) ({myPendingReturns.length})
                        </p>
                      </div>
                      <Link
                        to="/returns?view=staff-approvals"
                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                      >
                        View All <ArrowRight size={12} />
                      </Link>
                    </div>
                    <div className="space-y-2">
                      {myPendingReturns.slice(0, 3).map((rt) => (
                        <div
                          key={rt.id}
                          className="group relative overflow-hidden rounded-xl border-2 border-white dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                        >
                          {/* Left Accent Stripe */}
                          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-blue-400 via-indigo-500 to-blue-600"></div>
                          
                          <div className="ml-2 flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-mono text-xs font-bold text-blue-900 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/50 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800">
                                  {rt.refNo}
                                </span>
                              </div>
                              <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                                {rt.qty}x {rt.itemName}
                              </p>
                              <p className="text-xs text-slate-600 dark:text-slate-400">
                                Reason: {rt.reason} · {new Date(rt.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <button
                                onClick={() => decideReturn(rt.id, "Approved")}
                                className="rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => decideReturn(rt.id, "Rejected")}
                                className="rounded-lg bg-gradient-to-r from-rose-500 to-red-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick Links Grid */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <button
            onClick={() => {
              setDeptReqForm({
                department: currentUser?.department || "Engineering College",
                storeId: stores[0]?.id || "",
                itemId: items[0]?.id || "",
                qty: 1,
              });
              setDeptReqOpen(true);
            }}
            className="flex flex-col items-center justify-center rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-center shadow-lg hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
          >
            <ClipboardList size={20} className="text-blue-700 dark:text-blue-400 mb-1.5" />
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">New Requisition</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">Request materials</p>
          </button>

          <button
            onClick={() => {
              setDeptReturnForm({
                itemId: items[0]?.id || "",
                sourceIssueVoucherId: issuedVouchers[0]?.id || "",
                qty: 1,
                reason: "",
              });
              setDeptReturnOpen(true);
            }}
            className="flex flex-col items-center justify-center rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-center shadow-lg hover:border-cyan-300 dark:hover:border-cyan-700 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
          >
            <Undo2 size={20} className="text-cyan-600 dark:text-cyan-400 mb-1.5" />
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Submit Return</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">Return items</p>
          </button>

          <button
            onClick={() => {
              setDeptTransferForm({
                itemId: items[0]?.id || "",
                qty: 1,
                fromStoreId: stores[0]?.id || "",
                toStoreId: stores[1]?.id || stores[0]?.id || "",
              });
              setDeptTransferOpen(true);
            }}
            className="flex flex-col items-center justify-center rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-center shadow-lg hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
          >
            <ArrowLeftRight size={20} className="text-indigo-600 dark:text-indigo-400 mb-1.5" />
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Transfer Stock</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">Inter-store</p>
          </button>

          <Link
            to="/fixed-assets"
            className="flex flex-col items-center justify-center rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-center shadow-lg hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
          >
            <CreditCard size={20} className="text-emerald-700 dark:text-emerald-400 mb-1.5" />
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Fixed Assets</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">Unit property</p>
          </Link>

          <Link
            to="/issue-vouchers"
            className="flex flex-col items-center justify-center rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-center shadow-lg hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
          >
            <CheckSquare size={20} className="text-purple-600 dark:text-purple-400 mb-1.5" />
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Vouchers</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">Issue history</p>
          </Link>

          <Link
            to="/requisitions"
            className="flex flex-col items-center justify-center rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-center shadow-lg hover:border-university-300 dark:hover:border-university-700 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
          >
            <Search size={20} className="text-slate-600 dark:text-slate-400 mb-1.5" />
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">All Requests</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">View history</p>
          </Link>
        </div>

        {/* Modal: New Store Requisition */}
        <Modal
          open={deptReqOpen}
          onClose={() => setDeptReqOpen(false)}
          title="Submit Store Requisition on Behalf of Unit"
          footer={
            <>
              <Button variant="secondary" onClick={() => setDeptReqOpen(false)}>
                Cancel
              </Button>
              <Button
                form="dept-req-form"
                type="submit"
                disabled={deptReqSaving}
              >
                {deptReqSaving ? "Submitting…" : "Submit Requisition"}
              </Button>
            </>
          }
        >
          <form id="dept-req-form" onSubmit={handleDeptReqSubmit}>
            <Field label="Consuming Department / Unit">
              <input
                required
                className={inputCls}
                value={deptReqForm.department || myDept}
                onChange={(e) =>
                  setDeptReqForm({
                    ...deptReqForm,
                    department: e.target.value,
                  })
                }
              />
            </Field>
            <Field label="Target Store">
              <select
                required
                className={inputCls}
                value={deptReqForm.storeId}
                onChange={(e) =>
                  setDeptReqForm({ ...deptReqForm, storeId: e.target.value })
                }
              >
                <option value="">Select store…</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Material">
              <select
                required
                className={inputCls}
                value={deptReqForm.itemId}
                onChange={(e) =>
                  setDeptReqForm({ ...deptReqForm, itemId: e.target.value })
                }
              >
                <option value="">Select material…</option>
                {items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} ({i.qtyOnHand} {i.unit} on hand)
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Quantity">
              <input
                type="number"
                min="1"
                required
                className={inputCls}
                value={deptReqForm.qty}
                onChange={(e) =>
                  setDeptReqForm({ ...deptReqForm, qty: e.target.value })
                }
              />
            </Field>
          </form>
        </Modal>

        {/* Modal: Submit Material Return */}
        <Modal
          open={deptReturnOpen}
          onClose={() => setDeptReturnOpen(false)}
          title="Submit Material Return (Store Return Note — SRN)"
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => setDeptReturnOpen(false)}
              >
                Cancel
              </Button>
              <Button
                form="dept-return-form"
                type="submit"
                disabled={deptReturnSaving}
              >
                {deptReturnSaving ? "Submitting…" : "Submit Return"}
              </Button>
            </>
          }
        >
          <form id="dept-return-form" onSubmit={handleDeptReturnSubmit}>
            <Field label="Source Issue Voucher (Model 22)">
              <select
                required
                className={inputCls}
                value={deptReturnForm.sourceIssueVoucherId}
                onChange={(e) => {
                  const voucher = issueVouchers.find(
                    (v) => v.id === e.target.value,
                  );
                  setDeptReturnForm({
                    ...deptReturnForm,
                    sourceIssueVoucherId: e.target.value,
                    itemId: voucher?.itemId || deptReturnForm.itemId,
                  });
                }}
              >
                <option value="">Select source voucher…</option>
                {issuedVouchers.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.refNo} — {v.qty}x {v.itemName} ({v.storeName})
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Material">
              <select
                required
                className={inputCls}
                value={deptReturnForm.itemId}
                onChange={(e) =>
                  setDeptReturnForm({
                    ...deptReturnForm,
                    itemId: e.target.value,
                  })
                }
              >
                <option value="">Select material…</option>
                {items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Quantity to Return">
              <input
                type="number"
                min="1"
                required
                className={inputCls}
                value={deptReturnForm.qty}
                onChange={(e) =>
                  setDeptReturnForm({ ...deptReturnForm, qty: e.target.value })
                }
              />
            </Field>
            <Field label="Reason / Defect Description">
              <textarea
                required
                rows={3}
                className={inputCls}
                value={deptReturnForm.reason}
                onChange={(e) =>
                  setDeptReturnForm({
                    ...deptReturnForm,
                    reason: e.target.value,
                  })
                }
                placeholder="State the reason for return (e.g. surplus after project completion, defective component)..."
              />
            </Field>
          </form>
        </Modal>

        {/* Modal: Initiate Material Transfer */}
        <Modal
          open={deptTransferOpen}
          onClose={() => setDeptTransferOpen(false)}
          title="Initiate Inter-Store Material Transfer"
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => setDeptTransferOpen(false)}
              >
                Cancel
              </Button>
              <Button
                form="dept-transfer-form"
                type="submit"
                disabled={deptTransferSaving}
              >
                {deptTransferSaving ? "Submitting…" : "Submit Transfer Request"}
              </Button>
            </>
          }
        >
          <form id="dept-transfer-form" onSubmit={handleDeptTransferSubmit}>
            <Field label="Material">
              <select
                required
                className={inputCls}
                value={deptTransferForm.itemId}
                onChange={(e) =>
                  setDeptTransferForm({
                    ...deptTransferForm,
                    itemId: e.target.value,
                  })
                }
              >
                <option value="">Select material…</option>
                {items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Quantity">
              <input
                type="number"
                min="1"
                required
                className={inputCls}
                value={deptTransferForm.qty}
                onChange={(e) =>
                  setDeptTransferForm({
                    ...deptTransferForm,
                    qty: e.target.value,
                  })
                }
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="From Store">
                <select
                  required
                  className={inputCls}
                  value={deptTransferForm.fromStoreId}
                  onChange={(e) =>
                    setDeptTransferForm({
                      ...deptTransferForm,
                      fromStoreId: e.target.value,
                    })
                  }
                >
                  <option value="">Select…</option>
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="To Store">
                <select
                  required
                  className={inputCls}
                  value={deptTransferForm.toStoreId}
                  onChange={(e) =>
                    setDeptTransferForm({
                      ...deptTransferForm,
                      toStoreId: e.target.value,
                    })
                  }
                >
                  <option value="">Select…</option>
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            {deptTransferForm.fromStoreId &&
              deptTransferForm.fromStoreId === deptTransferForm.toStoreId && (
                <p className="text-xs text-rose-500">
                  Source and destination store must be different.
                </p>
              )}
          </form>
        </Modal>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 8. ACCOUNTANT / FINANCE OFFICER DASHBOARD
  // -------------------------------------------------------------
  if (isAccountant) {
    const disposedItems = disposals.filter((d) => d.status === "Disposed");
    const pendingWriteOffs = disposals.filter(
      (d) => d.status === "Disposed" && d.method === "Write-off",
    );
    const reconVariances = stockTakes.filter(
      (st) => st.status === "Reconciled",
    );

    return (
      <div className="animate-fade-in space-y-6">
        {/* Accountant Header with VIBRANT Blue Gradient matching login */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-blue-400 dark:border-blue-700 bg-gradient-to-br from-blue-100 via-indigo-100 to-blue-200 dark:from-blue-900 dark:via-indigo-900 dark:to-blue-800 p-6 shadow-xl">
          {/* Decorative Pattern - More visible */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-300/40 dark:bg-blue-600/20 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-300/40 dark:bg-indigo-600/20 rounded-full -ml-24 -mb-24 blur-2xl"></div>
          
          <div className="relative z-10 flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg ring-4 ring-blue-200 dark:ring-blue-800">
                <DollarSign size={32} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-extrabold text-blue-900 dark:text-blue-50">
                    Financial Control Dashboard
                  </h1>
                  <span className="rounded-full bg-blue-600 dark:bg-blue-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
                    Accountant
                  </span>
                </div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-200">
                  Welcome back, <strong>{currentUser?.name}</strong>
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                  Finance & Property Accounts · FIFO valuation, reconciliations & write-offs
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/reports">
                <button className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 px-4 py-2 text-xs font-bold text-white shadow-md hover:shadow-lg transition-all duration-300">
                  <DollarSign size={14} /> Valuation Reports
                </button>
              </Link>
              <Link to="/disposal">
                <button className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 px-4 py-2 text-xs font-bold text-white shadow-md hover:shadow-lg transition-all duration-300">
                  <Recycle size={14} /> Write-Off Log
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* 4 Metric Cards - Blue Borders in Light Mode Only */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {/* Card 1 - Emerald with Blue Border (light mode only) */}
          <div className="group relative overflow-hidden rounded-2xl border-2 border-blue-300 dark:border-slate-700 bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-950 dark:to-teal-950 p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-200/30 dark:bg-emerald-800/20 rounded-full -mr-12 -mt-12 blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <DollarSign size={24} className="text-emerald-600 dark:text-emerald-400" />
                <span className="rounded-full bg-emerald-600 dark:bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                  FIFO Basis
                </span>
              </div>
              <p className="text-3xl font-extrabold text-emerald-900 dark:text-emerald-100 mb-1">
                ETB {totalStockValue.toLocaleString()}
              </p>
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                Total Inventory Valuation
              </p>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">
                {items.length} master items
              </p>
            </div>
          </div>

          {/* Card 2 - Slate with Blue Border (light mode only) */}
          <div className="group relative overflow-hidden rounded-2xl border-2 border-blue-300 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-24 h-24 bg-slate-200/20 dark:bg-slate-800/10 rounded-full -mr-12 -mt-12 blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <CreditCard size={24} className="text-slate-600 dark:text-slate-400" />
                <span className="rounded-full bg-slate-600 dark:bg-slate-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                  CapEx
                </span>
              </div>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 mb-1">
                {activeFixedAssets.length}
              </p>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Fixed Assets In Use
              </p>
              <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-1">
                Institutional asset register
              </p>
            </div>
          </div>

          {/* Card 3 - Rose with Blue Border (light mode only) */}
          <div className="group relative overflow-hidden rounded-2xl border-2 border-blue-300 dark:border-rose-900 bg-gradient-to-br from-rose-50 to-red-100 dark:from-rose-950 dark:to-red-950 p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-200/30 dark:bg-rose-800/20 rounded-full -mr-12 -mt-12 blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <Recycle size={24} className="text-rose-600 dark:text-rose-400" />
                <span className="rounded-full bg-rose-600 dark:bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                  Write-offs
                </span>
              </div>
              <p className="text-3xl font-extrabold text-rose-900 dark:text-rose-100 mb-1">
                {disposedItems.length}
              </p>
              <p className="text-xs font-bold text-rose-700 dark:text-rose-300">
                Disposed Items
              </p>
              <p className="text-[10px] text-rose-600 dark:text-rose-400 mt-1">
                {pendingWriteOffs.length} adjustments
              </p>
            </div>
          </div>

          {/* Card 4 - Teal with Blue Border (light mode only) */}
          <div className="group relative overflow-hidden rounded-2xl border-2 border-blue-300 dark:border-slate-700 bg-gradient-to-br from-teal-50 to-emerald-100 dark:from-teal-950 dark:to-emerald-950 p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-24 h-24 bg-teal-200/30 dark:bg-teal-800/20 rounded-full -mr-12 -mt-12 blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <Scale size={24} className="text-teal-600 dark:text-teal-400" />
                <span className="rounded-full bg-teal-600 dark:bg-teal-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                  Reconciled
                </span>
              </div>
              <p className="text-3xl font-extrabold text-teal-900 dark:text-teal-100 mb-1">
                {reconVariances.length}
              </p>
              <p className="text-xs font-bold text-teal-700 dark:text-teal-300">
                Stock Takes Reconciled
              </p>
              <p className="text-[10px] text-teal-600 dark:text-teal-400 mt-1">
                Variance ledger
              </p>
            </div>
          </div>
        </div>

        {/* Analytics Grid with Charts */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="rounded-2xl border-2 border-blue-300 dark:border-slate-700 overflow-hidden shadow-xl">
              <GroupedBarChart
                title="Financial Overview - Inventory & Assets"
                categories={["Q1", "Q2", "Q3", "Q4", "Current"]}
                series={[
                  { name: "Inventory Value (ETB)", color: "#10b981", data: [120000, 135000, 128000, 142000, totalStockValue || 150000] },
                  { name: "Fixed Assets", color: "#64748b", data: [45, 48, 50, 52, activeFixedAssets.length || 55] },
                ]}
              />
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="rounded-2xl border-2 border-blue-300 dark:border-slate-700 overflow-hidden shadow-xl">
              <RecentListCard
                title="Financial Tasks"
                items={[
                  { id: 1, title: "Inventory Valuation", subtitle: `ETB ${totalStockValue.toLocaleString()} • FIFO basis`, badge: "Current", badgeTone: "emerald", icon: DollarSign, iconBg: "bg-emerald-100 text-emerald-700" },
                  { id: 2, title: "Write-Off Adjustments", subtitle: `${pendingWriteOffs.length} pending ledger entries`, badge: `${pendingWriteOffs.length}`, badgeTone: "rose", icon: Recycle, iconBg: "bg-rose-100 text-rose-700" },
                  { id: 3, title: "Asset Reconciliation", subtitle: `${reconVariances.length} stock takes completed`, badge: "Complete", badgeTone: "teal", icon: Scale, iconBg: "bg-teal-100 text-teal-700" },
                  { id: 4, title: "Fixed Assets Register", subtitle: `${activeFixedAssets.length} active institutional assets`, badge: "CapEx", badgeTone: "slate", icon: CreditCard, iconBg: "bg-slate-100 text-slate-700" },
                ]}
                viewAllLink="/reports"
                viewAllText="View All Reports"
              />
            </div>
          </div>
        </div>
        {/* Financial Reports Quick Links - 4-column Grid */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-blue-300 dark:border-slate-700 bg-gradient-to-br from-white via-emerald-50/20 to-teal-50/20 dark:from-slate-900 dark:via-emerald-950/20 dark:to-teal-950/20 p-6 shadow-xl">
          <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-200/20 dark:bg-emerald-800/10 rounded-full -ml-16 -mt-16 blur-2xl"></div>
          
          <div className="relative z-10">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
                <DollarSign size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Financial Reports & Export
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Generate valuation and accounting reports
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Link
                to="/reports"
                className="flex flex-col items-center justify-center rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-center shadow-lg hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
              >
                <DollarSign size={20} className="text-emerald-700 dark:text-emerald-400 mb-1.5" />
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Inventory Valuation</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">FIFO cost basis</p>
              </Link>

              <Link
                to="/reports"
                className="flex flex-col items-center justify-center rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-center shadow-lg hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
              >
                <CreditCard size={20} className="text-emerald-600 dark:text-emerald-400 mb-1.5" />
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Fixed Assets</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">Asset register</p>
              </Link>

              <Link
                to="/reports"
                className="flex flex-col items-center justify-center rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-center shadow-lg hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
              >
                <Scale size={20} className="text-emerald-600 dark:text-emerald-400 mb-1.5" />
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Reconciliation</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">Take variances</p>
              </Link>

              <Link
                to="/reports"
                className="flex flex-col items-center justify-center rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-center shadow-lg hover:border-rose-300 dark:hover:border-rose-700 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
              >
                <Recycle size={20} className="text-rose-600 dark:text-rose-400 mb-1.5" />
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Disposal Summary</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">Write-offs</p>
              </Link>
            </div>
          </div>
        </div>

        {/* Disposal Write-Off Panel with Rose Theme */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-blue-300 dark:border-slate-700 bg-gradient-to-br from-white via-rose-50/20 to-red-50/20 dark:from-slate-900 dark:via-rose-950/20 dark:to-red-950/20 p-6 shadow-xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-200/20 dark:bg-rose-800/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          
          <div className="relative z-10">
            <div className="mb-4 flex items-center justify-between border-b-2 border-rose-200 dark:border-slate-700 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-red-600 shadow-lg">
                  <Recycle size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    Recent Disposal Write-Offs & Financial Adjustments
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Ledger adjustments for disposed assets
                  </p>
                </div>
              </div>
              <Link
                to="/disposal?view=pending"
                className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
              >
                View Pending <ArrowRight size={12} />
              </Link>
            </div>
            
            {disposedItems.length === 0 ? (
              <div className="py-12 text-center">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950 dark:to-teal-950 shadow-lg">
                  <CheckCircle2 size={40} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
                  No Disposal Write-Offs
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  No disposal write-offs have been recorded yet.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {disposedItems.slice(0, 5).map((d) => (
                  <div
                    key={d.id}
                    className="group relative overflow-hidden rounded-xl border-2 border-white dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-rose-400 via-red-500 to-rose-600"></div>
                    
                    <div className="ml-2 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-mono text-xs font-bold text-rose-900 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/50 px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-800">
                            {d.refNo}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                          {d.qty}x {d.itemName}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          Method: <strong>{d.method || "—"}</strong> · Reason: {d.reason}
                        </p>
                      </div>
                      <Badge tone="green">Disposed</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 9. DISPOSAL COMMITTEE DASHBOARD
  // -------------------------------------------------------------
  if (isDisposalCommittee) {
    const pendingForCommittee = disposals.filter(
      (d) => d.status === "Forwarded to Committee",
    );
    const approvedDisposals = disposals.filter((d) => d.status === "Disposed");
    const rejectedDisposals = disposals.filter((d) => d.status === "Rejected");

    return (
      <div className="animate-fade-in space-y-6">
        {/* Disposal Committee Header with VIBRANT Blue Gradient matching login */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-blue-400 dark:border-blue-700 bg-gradient-to-br from-blue-100 via-indigo-100 to-blue-200 dark:from-blue-900 dark:via-indigo-900 dark:to-blue-800 p-6 shadow-xl">
          {/* Decorative Pattern - More visible */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-300/40 dark:bg-blue-600/20 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-300/40 dark:bg-indigo-600/20 rounded-full -ml-24 -mb-24 blur-2xl"></div>
          
          <div className="relative z-10 flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg ring-4 ring-blue-200 dark:ring-blue-800">
                <Recycle size={32} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-extrabold text-blue-900 dark:text-blue-50">
                    Disposal Committee Dashboard
                  </h1>
                  <span className="rounded-full bg-blue-600 dark:bg-blue-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
                    Disposal Authority
                  </span>
                </div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-200">
                  Welcome back, <strong>{currentUser?.name}</strong>
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                  Disposal Governance Board · Sole legal authorization panel for property retirement
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/disposal">
                <button className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 px-4 py-2 text-xs font-bold text-white shadow-md hover:shadow-lg transition-all duration-300">
                  <Recycle size={14} /> Review Disposals
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Redesigned Card Layout - One Large + Two Stacked (Colored Cards) */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Large Left Card - Pending Decisions - Amber Theme */}
          <div className="group relative overflow-hidden rounded-2xl border-2 border-blue-300 dark:border-slate-700 bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950 dark:to-orange-950 p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/30 dark:bg-amber-800/20 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-md">
                    <Recycle size={24} className="text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                      Action Required
                    </p>
                    <h3 className="text-sm font-bold text-amber-900 dark:text-amber-100">
                      Pending Committee Authorization
                    </h3>
                  </div>
                </div>
                <span className="rounded-full bg-gradient-to-r from-amber-500 to-orange-600 px-3 py-1 text-xs font-bold text-white shadow-md">
                  Urgent
                </span>
              </div>
              <p className="text-5xl font-extrabold text-amber-900 dark:text-amber-100 mb-2">
                {pendingForCommittee.length}
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mb-4">
                Disposal requests awaiting your decision · Review documentation and authorize disposal method
              </p>
              
              {/* Progress breakdown */}
              <div className="mt-6 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-amber-700 dark:text-amber-300 flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    Approved & Disposed
                  </span>
                  <span className="font-bold text-amber-900 dark:text-amber-100">{approvedDisposals.length}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-amber-700 dark:text-amber-300 flex items-center gap-2">
                    <XCircle size={14} className="text-rose-600" />
                    Rejected by Committee
                  </span>
                  <span className="font-bold text-amber-900 dark:text-amber-100">{rejectedDisposals.length}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-amber-700 dark:text-amber-300 flex items-center gap-2">
                    <ClipboardList size={14} className="text-amber-600" />
                    Total Requests
                  </span>
                  <span className="font-bold text-amber-900 dark:text-amber-100">{disposals.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Two Stacked Cards */}
          <div className="space-y-4">
            {/* Approved Card - Emerald Theme */}
            <div className="group relative overflow-hidden rounded-2xl border-2 border-blue-300 dark:border-slate-700 bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-950 dark:to-teal-950 p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-200/30 dark:bg-emerald-800/20 rounded-full -mr-12 -mt-12 blur-2xl"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <CheckCircle2 size={24} className="text-emerald-600 dark:text-emerald-400" />
                  <span className="rounded-full bg-emerald-600 dark:bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                    Executed
                  </span>
                </div>
                <p className="text-3xl font-extrabold text-emerald-900 dark:text-emerald-100 mb-1">
                  {approvedDisposals.length}
                </p>
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  Approved & Disposed
                </p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">
                  Permanently retired from records
                </p>
              </div>
            </div>

            {/* Rejected Card - Rose Theme */}
            <div className="group relative overflow-hidden rounded-2xl border-2 border-blue-300 dark:border-rose-900 bg-gradient-to-br from-rose-50 to-red-100 dark:from-rose-950 dark:to-red-950 p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute top-0 right-0 w-24 h-24 bg-rose-200/30 dark:bg-rose-800/20 rounded-full -mr-12 -mt-12 blur-2xl"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <XCircle size={24} className="text-rose-600 dark:text-rose-400" />
                  <span className="rounded-full bg-rose-600 dark:bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                    Denied
                  </span>
                </div>
                <p className="text-3xl font-extrabold text-rose-900 dark:text-rose-100 mb-1">
                  {rejectedDisposals.length}
                </p>
                <p className="text-xs font-bold text-rose-700 dark:text-rose-300">
                  Rejected by Committee
                </p>
                <p className="text-[10px] text-rose-600 dark:text-rose-400 mt-1">
                  Disposal requests denied
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics with Different Chart Type - Blue Border Light Mode Only */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <div className="rounded-2xl border-2 border-blue-300 dark:border-slate-700 overflow-hidden shadow-xl">
              <DonutChart
                title="Disposal Decision Distribution"
                series={[
                  { name: "Approved", value: approvedDisposals.length || 8, color: "#10b981" },
                  { name: "Pending", value: pendingForCommittee.length || 4, color: "#f59e0b" },
                  { name: "Rejected", value: rejectedDisposals.length || 2, color: "#ef4444" },
                ]}
              />
            </div>
          </div>
          <div className="lg:col-span-4">
            <div className="rounded-2xl border-2 border-blue-300 dark:border-slate-700 overflow-hidden shadow-xl">
              <RecentListCard
                title="Committee Tasks"
                items={[
                  { id: 1, title: "Pending Decisions", subtitle: `${pendingForCommittee.length} requests awaiting authorization`, badge: `${pendingForCommittee.length}`, badgeTone: "amber", icon: Recycle, iconBg: "bg-amber-100 text-amber-700" },
                  { id: 2, title: "Approved Disposals", subtitle: `${approvedDisposals.length} executed & retired`, badge: "Done", badgeTone: "blue", icon: CheckCircle2, iconBg: "bg-blue-100 text-blue-700" },
                  { id: 3, title: "Rejected Requests", subtitle: `${rejectedDisposals.length} denial decisions`, badge: "Denied", badgeTone: "blue", icon: XCircle, iconBg: "bg-blue-100 text-blue-700" },
                ]}
                viewAllLink="/disposal"
                viewAllText="View All Disposals"
              />
            </div>
          </div>
        </div>

        {/* Creative Disposal Authorization Queue with Amber Theme */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-amber-200 dark:border-slate-700 bg-gradient-to-br from-white via-amber-50/30 to-orange-50/30 dark:from-slate-900 dark:via-amber-950/30 dark:to-orange-950/30 p-6 shadow-xl">
          <div className="absolute top-0 left-0 w-40 h-40 bg-amber-200/20 dark:bg-amber-800/10 rounded-full -ml-20 -mt-20 blur-3xl"></div>
          
          <div className="relative z-10">
            <div className="mb-4 flex items-center justify-between border-b-2 border-amber-200 dark:border-slate-700 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg">
                  <Recycle size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    Disposal Authorization Queue
                    {pendingForCommittee.length > 0 && (
                      <span className="text-xs font-normal text-amber-600 dark:text-amber-400">
                        · {pendingForCommittee.length} awaiting decision
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Review documentation and authorize disposal method: Auction, Destruction, Donation, or Write-off
                  </p>
                </div>
              </div>
              <Link
                to="/disposal"
                className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
              >
                View All <ArrowRight size={12} />
              </Link>
            </div>

            {pendingForCommittee.length === 0 ? (
              <div className="py-12 text-center">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950 dark:to-teal-950 shadow-lg">
                  <CheckCircle2 size={40} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
                  All Clear! 🎉
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  No disposal requests pending committee review
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingForCommittee.map((d) => (
                  <div
                    key={d.id}
                    className="group relative overflow-hidden rounded-xl border-2 border-white dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                  >
                    {/* Left Amber Accent Stripe */}
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-amber-400 via-orange-500 to-amber-600"></div>
                    
                    <div className="ml-2 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-mono text-xs font-bold text-amber-900 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/50 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800">
                            {d.refNo}
                          </span>
                          <Badge tone="amber">{d.status}</Badge>
                        </div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                          {d.qty}x {d.itemName}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          Justification: <em>"{d.reason}"</em>
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setDecideDisposalTarget(d);
                          setDisposalMethod("Auction");
                        }}
                        className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 px-4 py-2 text-xs font-bold text-white shadow-md hover:shadow-lg transition-all duration-300"
                      >
                        <Recycle size={14} /> Committee Decision
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Committee Decision Modal */}
        <Modal
          open={!!decideDisposalTarget}
          onClose={() => setDecideDisposalTarget(null)}
          title={`Disposal Committee Decision — ${decideDisposalTarget?.refNo || ""}`}
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => setDecideDisposalTarget(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                disabled={savingDisposal}
                onClick={() => handleDisposalDecision("Rejected")}
              >
                {savingDisposal ? "Rejecting…" : "Reject"}
              </Button>
              <Button
                disabled={savingDisposal}
                onClick={() => handleDisposalDecision("Approved")}
              >
                {savingDisposal ? "Authorizing…" : "Authorize Disposal"}
              </Button>
            </>
          }
        >
          <div className="space-y-3">
            <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-700 space-y-1">
              <p>
                Material: <strong>{decideDisposalTarget?.itemName}</strong>
              </p>
              <p>
                Quantity to Dispose:{" "}
                <strong>{decideDisposalTarget?.qty}</strong>
              </p>
              <p className="mt-1">
                Technical Justification:{" "}
                <em>"{decideDisposalTarget?.reason}"</em>
              </p>
            </div>
            <Field label="Authorized Disposal Method">
              <select
                className={inputCls}
                value={disposalMethod}
                onChange={(e) => setDisposalMethod(e.target.value)}
              >
                {["Auction", "Destruction", "Donation", "Write-off"].map(
                  (m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ),
                )}
              </select>
            </Field>
            <p className="text-xs text-slate-400">
              Authorizing disposal permanently relieves stock via FIFO
              consumption and officially records the board resolution.
            </p>
          </div>
        </Modal>

        {/* Quick Actions */}
        <div className="mt-6 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 p-5 shadow-xl">
          <p className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Recycle size={16} className="text-university-600 dark:text-university-400" />
            Committee Quick Actions
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Link
              to="/items"
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 shadow-sm hover:border-navy-300 hover:shadow transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-navy-100 text-navy-800">
                  <Tags size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Item Specs
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Technical reference
                  </p>
                </div>
              </div>
              <ArrowRight
                size={14}
                className="text-slate-400 group-hover:text-navy-700 transition-colors"
              />
            </Link>

            <Link
              to="/audit-log"
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 shadow-sm hover:border-navy-300 hover:shadow transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-slate-700">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Audit Trail
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Inspection history
                  </p>
                </div>
              </div>
              <ArrowRight
                size={14}
                className="text-slate-400 group-hover:text-navy-700 transition-colors"
              />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 10. CAMPUS SECURITY OFFICER DASHBOARD
  // -------------------------------------------------------------
  if (isSecurity) {
    const finalizedVouchers = issueVouchers.filter(
      (v) => v.status === "Issued" && v.model === "Model 22",
    );
    const allIssuedVouchers = issueVouchers.filter(
      (v) => v.status === "Issued",
    );
    const clearedVouchers = issueVouchers.filter(
      (v) => v.gateClearance === true,
    );

    return (
      <div className="animate-fade-in space-y-6">
        {/* Security Officer Header with VIBRANT Blue Gradient matching login */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-blue-400 dark:border-blue-700 bg-gradient-to-br from-blue-100 via-indigo-100 to-blue-200 dark:from-blue-900 dark:via-indigo-900 dark:to-blue-800 p-6 shadow-xl">
          {/* Decorative Pattern - More visible */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-300/40 dark:bg-blue-600/20 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-300/40 dark:bg-indigo-600/20 rounded-full -ml-24 -mb-24 blur-2xl"></div>
          
          <div className="relative z-10 flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-600 to-slate-700 shadow-lg ring-4 ring-blue-200 dark:ring-blue-800">
                <ShieldAlert size={32} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-extrabold text-blue-900 dark:text-blue-50">
                    Campus Security Dashboard
                  </h1>
                  <span className="rounded-full bg-blue-600 dark:bg-blue-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
                    Gate Pass Control
                  </span>
                </div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-200">
                  Welcome back, <strong>{currentUser?.name}</strong>
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                  Campus Security & Gate Clearance · Verify outgoing goods against Model 22 vouchers
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/issue-vouchers">
                <button className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 px-4 py-2 text-xs font-bold text-white shadow-md hover:shadow-lg transition-all duration-300">
                  <ShieldAlert size={14} /> All Issued Vouchers
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* 4 Metric Cards - Blue Borders in Light Mode Only */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {/* Card 1 - Navy with Blue Border */}
          <div className="group relative overflow-hidden rounded-2xl border-2 border-blue-300 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-24 h-24 bg-slate-200/30 dark:bg-slate-800/20 rounded-full -mr-12 -mt-12 blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <CheckSquare size={24} className="text-slate-600 dark:text-slate-400" />
                <span className="rounded-full bg-slate-600 dark:bg-slate-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                  Model 22
                </span>
              </div>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 mb-1">
                {allIssuedVouchers.length}
              </p>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Finalized Vouchers
              </p>
              <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-1">
                Authorized store issuances
              </p>
            </div>
          </div>

          {/* Card 2 - Orange/Clay with Blue Border */}
          <div className="group relative overflow-hidden rounded-2xl border-2 border-blue-300 dark:border-slate-700 bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-950 dark:to-amber-950 p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-200/30 dark:bg-orange-800/20 rounded-full -mr-12 -mt-12 blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <ShieldAlert size={24} className="text-orange-600 dark:text-orange-400" />
                <span className="rounded-full bg-orange-600 dark:bg-orange-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                  Gate Queue
                </span>
              </div>
              <p className="text-3xl font-extrabold text-orange-900 dark:text-orange-100 mb-1">
                {allIssuedVouchers.length - clearedVouchers.length}
              </p>
              <p className="text-xs font-bold text-orange-700 dark:text-orange-300">
                Pending Gate Clearance
              </p>
              <p className="text-[10px] text-orange-600 dark:text-orange-400 mt-1">
                Awaiting exit verification
              </p>
            </div>
          </div>

          {/* Card 3 - Emerald with Blue Border */}
          <div className="group relative overflow-hidden rounded-2xl border-2 border-blue-300 dark:border-slate-700 bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-950 dark:to-teal-950 p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-200/30 dark:bg-emerald-800/20 rounded-full -mr-12 -mt-12 blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <PackageCheck size={24} className="text-emerald-600 dark:text-emerald-400" />
                <span className="rounded-full bg-emerald-600 dark:bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                  Cleared
                </span>
              </div>
              <p className="text-3xl font-extrabold text-emerald-900 dark:text-emerald-100 mb-1">
                {clearedVouchers.length}
              </p>
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                Gate Clearances Logged
              </p>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">
                Verified exit records
              </p>
            </div>
          </div>

          {/* Card 4 - Purple with Blue Border */}
          <div className="group relative overflow-hidden rounded-2xl border-2 border-blue-300 dark:border-slate-700 bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-950 dark:to-violet-950 p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-200/30 dark:bg-purple-800/20 rounded-full -mr-12 -mt-12 blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <ClipboardList size={24} className="text-purple-600 dark:text-purple-400" />
                <span className="rounded-full bg-purple-600 dark:bg-purple-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                  Monthly
                </span>
              </div>
              <p className="text-3xl font-extrabold text-purple-900 dark:text-purple-100 mb-1">
                {
                  issueVouchers.filter((v) => {
                    const d = new Date(v.createdAt);
                    const now = new Date();
                    return (
                      d.getMonth() === now.getMonth() &&
                      d.getFullYear() === now.getFullYear()
                    );
                  }).length
                }
              </p>
              <p className="text-xs font-bold text-purple-700 dark:text-purple-300">
                Total Vouchers This Month
              </p>
              <p className="text-[10px] text-purple-600 dark:text-purple-400 mt-1">
                Monthly store issue traffic
              </p>
            </div>
          </div>
        </div>

        {/* Analytics with Line Chart */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="rounded-2xl border-2 border-blue-300 dark:border-slate-800 overflow-hidden shadow-xl">
              <AreaLineChart
                title="Gate Clearance Trends - Weekly"
                categories={["Week 1", "Week 2", "Week 3", "Week 4", "Current"]}
                series={[
                  { name: "Cleared at Gate", color: "#10b981", data: [12, 18, 15, 22, clearedVouchers.length || 20] },
                  { name: "Pending Clearance", color: "#f59e0b", data: [5, 3, 7, 4, (allIssuedVouchers.length - clearedVouchers.length) || 3] },
                ]}
              />
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="rounded-2xl border-2 border-blue-300 dark:border-slate-800 overflow-hidden shadow-xl">
              <RecentListCard
                title="Security Tasks"
                items={[
                  { id: 1, title: "Issued Vouchers", subtitle: `${allIssuedVouchers.length} Model 22 vouchers finalized`, badge: `${allIssuedVouchers.length}`, badgeTone: "slate", icon: CheckSquare, iconBg: "bg-slate-100 text-slate-700" },
                  { id: 2, title: "Awaiting Clearance", subtitle: `${allIssuedVouchers.length - clearedVouchers.length} pending gate verification`, badge: "Pending", badgeTone: "amber", icon: ShieldAlert, iconBg: "bg-amber-100 text-amber-700" },
                  { id: 3, title: "Gate Clearances", subtitle: `${clearedVouchers.length} verified exits logged`, badge: "Done", badgeTone: "emerald", icon: PackageCheck, iconBg: "bg-emerald-100 text-emerald-700" },
                ]}
                viewAllLink="/issue-vouchers"
                viewAllText="View All Vouchers"
              />
            </div>
          </div>
        </div>

        {/* Live Worklist: Finalized Vouchers Awaiting Gate Clearance */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-blue-300 dark:border-slate-800 bg-gradient-to-br from-white via-slate-50/20 to-slate-100/20 dark:from-slate-900 dark:via-slate-950/20 dark:to-slate-900/20 p-6 shadow-xl">
          <div className="absolute top-0 left-0 w-32 h-32 bg-slate-200/20 dark:bg-slate-800/10 rounded-full -ml-16 -mt-16 blur-2xl"></div>
          
          <div className="relative z-10">
            <div className="mb-4 flex items-center justify-between border-b-2 border-blue-300 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 shadow-lg">
                  <ShieldAlert size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    Finalized Issue Vouchers (Model 22) — Gate Verification Required
                    {allIssuedVouchers.length > 0 && (
                      <span className="text-xs font-normal text-slate-600 dark:text-slate-400">
                        · {allIssuedVouchers.length} issued vouchers
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Verify materials against the issued voucher before allowing exit from campus premises
                  </p>
                </div>
              </div>
              <Link
                to="/issue-vouchers"
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                View All <ArrowRight size={12} />
              </Link>
            </div>

            {allIssuedVouchers.length === 0 ? (
              <div className="py-12 text-center">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950 dark:to-teal-950 shadow-lg">
                  <CheckCircle2 size={40} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
                  All Clear! 🎉
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  No finalized vouchers pending gate clearance.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {allIssuedVouchers.map((v) => (
                  <div
                    key={v.id}
                    className="group relative overflow-hidden rounded-xl border-2 border-white dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-slate-400 via-slate-500 to-slate-600"></div>
                    
                    <div className="ml-2 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-400 bg-slate-100 dark:bg-slate-950/50 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800">
                            {v.refNo}
                          </span>
                          <Badge tone="emerald">Model 22 — Issued</Badge>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            Store: {v.storeName}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                          {v.qty}x {v.itemName}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          Requisition: {v.requisitionRef || "—"} · Issued: {new Date(v.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {v.gateClearance ? (
                        <Badge tone="emerald">✓ Cleared</Badge>
                      ) : (
                        <button
                          onClick={() => recordGateClearance(v.id)}
                          className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all"
                        >
                          <ShieldAlert size={14} /> Record Gate Clearance
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Supporting Reference */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-blue-300 dark:border-slate-800 bg-gradient-to-br from-white via-slate-50/20 to-slate-100/20 dark:from-slate-900 dark:via-slate-950/20 dark:to-slate-900/20 p-6 shadow-xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-slate-200/20 dark:bg-slate-800/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          
          <div className="relative z-10">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 shadow-lg">
                <ClipboardList size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Security Quick Reference
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Gate clearance and voucher management
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Link
                to="/issue-vouchers"
                className="flex items-center justify-between rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-lg transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-400">
                    <CheckSquare size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      All Vouchers
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Model 20 & 22</p>
                  </div>
                </div>
                <ArrowRight
                  size={16}
                  className="text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-400 transition-colors"
                />
              </Link>

              <Link
                to="/stores"
                className="flex items-center justify-between rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-lg transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-400">
                    <Warehouse size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      Campus Stores
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Location reference
                    </p>
                  </div>
                </div>
                <ArrowRight
                  size={16}
                  className="text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-400 transition-colors"
                />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 11. GATE SECURITY GUARD DASHBOARD
  // -------------------------------------------------------------
  if (isGateGuard) {
    const finalizedVouchers = issueVouchers.filter(
      (v) => v.status === "Issued" && v.model === "Model 22",
    );
    const allIssuedVouchers = issueVouchers.filter(
      (v) => v.status === "Issued",
    );
    const clearedVouchers = issueVouchers.filter(
      (v) => v.gateClearance === true,
    );

    return (
      <div className="animate-fade-in space-y-6">
        {/* Gate Guard Header - Light Blue like Campus Security Officer */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-blue-400 dark:border-blue-700 bg-gradient-to-br from-blue-100 via-indigo-100 to-blue-200 dark:from-blue-900 dark:via-indigo-900 dark:to-blue-800 p-6 shadow-xl">
          {/* Decorative Pattern */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-300/40 dark:bg-blue-600/20 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-300/40 dark:bg-indigo-600/20 rounded-full -ml-24 -mb-24 blur-2xl"></div>
          
          <div className="relative z-10 flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-600 to-slate-700 shadow-lg ring-4 ring-blue-200 dark:ring-blue-800">
                <Shield size={32} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-extrabold text-blue-900 dark:text-blue-50">
                    Gate Security Dashboard
                  </h1>
                  <span className="rounded-full bg-blue-600 dark:bg-blue-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
                    Exit Control
                  </span>
                </div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-200">
                  Welcome back, <strong>{currentUser?.name}</strong>
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                  Campus Gate Post · Verify and log physical material exits
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/gate-clearance-requests">
                <button className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 px-4 py-2 text-xs font-bold text-white shadow-md hover:shadow-lg transition-all duration-300">
                  <Shield size={14} /> Approved Clearances
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* 4 Metric Cards - Blue Borders in Light Mode Only */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {/* Card 1 - Navy with Blue Border */}
          <div className="group relative overflow-hidden rounded-2xl border-2 border-blue-300 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-24 h-24 bg-slate-200/30 dark:bg-slate-800/20 rounded-full -mr-12 -mt-12 blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <CheckSquare size={24} className="text-slate-600 dark:text-slate-400" />
                <span className="rounded-full bg-slate-600 dark:bg-slate-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                  Approved
                </span>
              </div>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 mb-1">
                {allIssuedVouchers.length}
              </p>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Approved Clearances
              </p>
              <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-1">
                Ready for exit verification
              </p>
            </div>
          </div>

          {/* Card 2 - Orange with Blue Border */}
          <div className="group relative overflow-hidden rounded-2xl border-2 border-blue-300 dark:border-slate-700 bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-950 dark:to-amber-950 p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-200/30 dark:bg-orange-800/20 rounded-full -mr-12 -mt-12 blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <ShieldAlert size={24} className="text-orange-600 dark:text-orange-400" />
                <span className="rounded-full bg-orange-600 dark:bg-orange-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                  Pending
                </span>
              </div>
              <p className="text-3xl font-extrabold text-orange-900 dark:text-orange-100 mb-1">
                {allIssuedVouchers.length - clearedVouchers.length}
              </p>
              <p className="text-xs font-bold text-orange-700 dark:text-orange-300">
                Awaiting Exit Log
              </p>
              <p className="text-[10px] text-orange-600 dark:text-orange-400 mt-1">
                Not yet passed gate
              </p>
            </div>
          </div>

          {/* Card 3 - Emerald with Blue Border */}
          <div className="group relative overflow-hidden rounded-2xl border-2 border-blue-300 dark:border-slate-700 bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-950 dark:to-teal-950 p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-200/30 dark:bg-emerald-800/20 rounded-full -mr-12 -mt-12 blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <PackageCheck size={24} className="text-emerald-600 dark:text-emerald-400" />
                <span className="rounded-full bg-emerald-600 dark:bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                  Logged
                </span>
              </div>
              <p className="text-3xl font-extrabold text-emerald-900 dark:text-emerald-100 mb-1">
                {clearedVouchers.length}
              </p>
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                Exits Logged
              </p>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">
                Physically verified exits
              </p>
            </div>
          </div>

          {/* Card 4 - Purple with Blue Border */}
          <div className="group relative overflow-hidden rounded-2xl border-2 border-blue-300 dark:border-slate-700 bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-950 dark:to-violet-950 p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-200/30 dark:bg-purple-800/20 rounded-full -mr-12 -mt-12 blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <ClipboardList size={24} className="text-purple-600 dark:text-purple-400" />
                <span className="rounded-full bg-purple-600 dark:bg-purple-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                  Monthly
                </span>
              </div>
              <p className="text-3xl font-extrabold text-purple-900 dark:text-purple-100 mb-1">
                {
                  issueVouchers.filter((v) => {
                    const d = new Date(v.createdAt);
                    const now = new Date();
                    return (
                      d.getMonth() === now.getMonth() &&
                      d.getFullYear() === now.getFullYear()
                    );
                  }).length
                }
              </p>
              <p className="text-xs font-bold text-purple-700 dark:text-purple-300">
                Total Exits This Month
              </p>
              <p className="text-[10px] text-purple-600 dark:text-purple-400 mt-1">
                Monthly gate traffic
              </p>
            </div>
          </div>
        </div>

        {/* Vouchers List Section - Same as Campus Security Officer */}
        <div className="rounded-2xl border-2 border-blue-300 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
          
          <div className="relative z-10">
            <div className="mb-4 flex items-center justify-between border-b-2 border-blue-300 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 shadow-lg">
                  <Shield size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    Approved Clearances — Gate Verification
                    {allIssuedVouchers.length > 0 && (
                      <span className="text-xs font-normal text-slate-600 dark:text-slate-400">
                        · {allIssuedVouchers.length} approved
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Verify materials against approved clearance before allowing exit
                  </p>
                </div>
              </div>
              <Link
                to="/gate-clearance-requests"
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                View All <ArrowRight size={12} />
              </Link>
            </div>

            {allIssuedVouchers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 mb-4">
                  <Shield size={32} className="text-slate-400 dark:text-slate-600" />
                </div>
                <p className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  No Approved Clearances
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Approved clearances will appear here for verification
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {allIssuedVouchers.slice(0, 5).map((v) => (
                  <Link
                    key={v.id}
                    to="/gate-clearance-requests"
                    className="block p-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                          <CheckSquare size={16} className="text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            {v.refNo}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            {v.storeName}
                          </p>
                        </div>
                      </div>
                      <ArrowRight size={16} className="text-slate-400" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 12. OPERATIONAL DEFAULT VIEW FOR OTHER ROLES
  // -------------------------------------------------------------
  return (
    <div className="animate-fade-in space-y-6">
      <ActorHero
        user={currentUser}
        roleTitle={currentUser?.role || "Staff Member"}
        subtitle={`${currentUser?.role || "General"} Dashboard — Live operational overview of material requisitions, store receipts, and active custodial property.`}
        badgeText="Active Session"
        storeOrDept={currentUser?.department || "Institutional Unit"}
      />

      <WorkflowLifecycleBar
        goodsReceipts={goodsReceipts}
        requisitions={requisitions}
        issueVouchers={issueVouchers}
        returns={returns}
        currentUser={currentUser}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Stock Value"
          value={`ETB ${totalStockValue.toLocaleString()}`}
          sub={`${items.length} item types tracked`}
          tone="navy"
          icon={Boxes}
          badge="Valuation"
        />
        <StatCard
          label="Pending TEC Evaluation"
          value={pendingReceipts.length}
          sub="Goods receipts awaiting inspection"
          tone={pendingReceipts.length > 0 ? "clay" : "emerald"}
          icon={PackageCheck}
          badge="Inspection"
        />
        <StatCard
          label="Pending Requisitions"
          value={pendingRequisitions.length}
          sub="Requisitions in approval flow"
          tone={pendingRequisitions.length > 0 ? "amber" : "emerald"}
          icon={ClipboardList}
          badge="Requisitions"
        />
        <StatCard
          label="Pending Disposal"
          value={pendingDisposals.length}
          sub="Flagged items awaiting board review"
          tone="rose"
          icon={Recycle}
          badge="Disposal"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl lg:col-span-2">
          <div className="mb-4 flex items-center gap-2 border-b-2 border-slate-200 dark:border-slate-800 pb-3">
            <TrendingDown size={18} className="text-rose-600 dark:text-rose-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Low Stock &amp; Reorder Alerts
            </h2>
          </div>
          {reorderAlerts.length === 0 ? (
            <div className="py-12 text-center">
              <div className="flex flex-col items-center gap-2">
                <div className="rounded-2xl bg-emerald-100 dark:bg-emerald-950 p-4">
                  <TrendingDown size={32} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  All items are above their reorder level.
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y-2 divide-slate-200 dark:divide-slate-800">
              {reorderAlerts.map((a) => (
                <div
                  key={a.itemId}
                  className="flex items-center justify-between py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{a.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{a.code}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-rose-600 dark:text-rose-400 mb-1">
                      {a.qtyOnHand} in stock
                    </p>
                    <Badge
                      tone={
                        a.alertLevel === "Safety Stock Breach" ? "red" : "amber"
                      }
                    >
                      {a.alertLevel}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl">
          <div className="mb-4 flex items-center gap-2 border-b-2 border-slate-200 dark:border-slate-800 pb-3">
            <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Recent Activity
            </h2>
          </div>
          <div className="space-y-3">
            {auditLogs.length === 0 && (
              <div className="py-8 text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">No activity yet.</p>
              </div>
            )}
            {auditLogs.slice(0, 6).map((log) => (
              <div key={log.id} className="text-sm border-b border-slate-100 dark:border-slate-800 pb-3 last:border-0 last:pb-0">
                <p className="text-slate-900 dark:text-white font-medium">{log.action}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {log.userName} · {formatDate(log.createdAt)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
