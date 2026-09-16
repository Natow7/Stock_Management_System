import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Warehouse,
  Tags,
  MapPin,
  PackageCheck,
  ClipboardList,
  ArrowLeftRight,
  Boxes,
  CreditCard,
  Undo2,
  Recycle,
  BarChart3,
  Shield,
  ShieldCheck,
  Users,
  Truck,
  Package,
  Scale,
  Settings,
  Activity,
  CheckSquare,
  FileCheck2,
  FileCheck,
  UserCheck,
  DollarSign,
  ShieldAlert,
  GanttChartSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useApp } from "../../context/AppContext.jsx";

// 1. System Administrator Navigation
const ADMIN_NAV = [
  {
    section: "Overview",
    description: "Central monitoring and system status",
    items: [
      { to: "/", label: "System Dashboard", icon: LayoutDashboard, end: true, description: "Real-time system health and usage metrics" },
    ],
  },
  {
    section: "Accounts & Access",
    description: "User management and role assignments",
    items: [{ to: "/users", label: "User Accounts & Roles", icon: Users, description: "Manage users, permissions, and access control" }],
  },
  {
    section: "System Configuration",
    description: "Core system setup and preferences",
    items: [
      { to: "/stores", label: "Stores Configuration", icon: Warehouse, description: "Configure campus stores and locations" },
      { to: "/system-settings", label: "System Settings", icon: Settings, description: "System-wide configurations and preferences" },
    ],
  },
  {
    section: "Technical Integrity",
    description: "Security, audit trails, and system health",
    items: [
      { to: "/audit-log", label: "Full Audit Log", icon: ShieldCheck, description: "Complete system activity and change history" },
      {
        to: "/system-health",
        label: "System Health & Backups",
        icon: Activity,
        description: "Monitor uptime, performance, and backup status"
      },
    ],
  },
  {
    section: "Delegated Procurement",
    description: "Supplier and vendor management",
    items: [{ to: "/suppliers", label: "Suppliers Management", icon: Truck, description: "Manage approved suppliers and vendors" }],
  },
];

// 2. Property Administration Officer (PAO) Navigation
const PAO_NAV = [
  {
    section: "Overview",
    description: "Executive control and oversight",
    items: [
      {
        to: "/",
        label: "Executive Dashboard",
        icon: LayoutDashboard,
        end: true,
        description: "High-level university property and stock overview"
      },
    ],
  },
  {
    section: "Approvals & Workflows",
    description: "Critical approvals and workflow oversight",
    items: [
      { to: "/requisitions", label: "Store Requisitions", icon: ClipboardList, description: "Review and approve store requisition requests" },
      {
        to: "/issue-vouchers",
        label: "Issue Vouchers (Model 20/22)",
        icon: CheckSquare,
        description: "Approve and track material issue vouchers"
      },
      { to: "/returns", label: "Material Returns (SRN)", icon: Undo2, description: "Oversee store return notes and justifications" },
      {
        to: "/transfers",
        label: "Inter-Store Transfers",
        icon: ArrowLeftRight,
        description: "Authorize transfers between campus stores"
      },
      { to: "/disposal", label: "Disposal Review & Forwarding", icon: Recycle, description: "Review disposal requests and forward to committee" },
    ],
  },
  {
    section: "Stock & Assets",
    description: "Comprehensive inventory and asset records",
    items: [
      { to: "/stock-cards", label: "Stock Cards (FIFO)", icon: Boxes, description: "FIFO stock ledgers and valuation records" },
      { to: "/bin-cards", label: "Bin Cards (All Stores)", icon: Package, description: "Physical bin location tracking across stores" },
      {
        to: "/fixed-assets",
        label: "Fixed Assets & User Cards",
        icon: CreditCard,
        description: "University fixed asset register and custody cards"
      },
      { to: "/items", label: "Item Master Catalog", icon: Tags, description: "Complete catalog of all stock items" },
      { to: "/stores", label: "Campus Store Units", icon: Warehouse, description: "All campus store locations and capacity" },
      { to: "/locations", label: "Item Locations & Bins", icon: MapPin, description: "Warehouse bins and storage positions" },
      {
        to: "/goods-receipt",
        label: "Goods Receipts & GRN",
        icon: PackageCheck,
        description: "Goods receipt notes and delivery records"
      },
      { to: "/suppliers", label: "Suppliers & Donors", icon: Truck, description: "Approved supplier and donor registry" },
    ],
  },
  {
    section: "Control & Governance",
    description: "Compliance, reporting, and stock verification",
    items: [
      {
        to: "/stock-control",
        label: "Stock Takes & Reconciliation",
        icon: Scale,
        description: "Physical counts and variance reconciliation"
      },
      { to: "/reports", label: "Reports & Analytics Export", icon: BarChart3, description: "Generate financial and operational reports" },
      { to: "/audit-log", label: "Governance Audit Trail", icon: ShieldCheck, description: "Complete system audit and compliance log" },
    ],
  },
];

// 3. Store Head Navigation (Central Store / College or Department Store / Cafeteria Store / ICT Store)
const STORE_HEAD_NAV = [
  {
    section: "Overview",
    description: "Daily store operations and performance",
    items: [
      {
        to: "/",
        label: "Store Operations Dashboard",
        icon: LayoutDashboard,
        end: true,
        description: "Real-time view of store inventory and pending tasks"
      },
    ],
  },
  {
    section: "Receiving & Issuing",
    description: "Record deliveries and fulfill requisitions",
    items: [
      {
        to: "/goods-receipt",
        label: "Goods Receipts & GRN",
        icon: PackageCheck,
        description: "All receipts with tabs: Verifications, All Receipts, History"
      },
      {
        to: "/requisitions",
        label: "Approved Requisitions",
        icon: ClipboardList,
        description: "Process approved material requests from departments"
      },
      {
        to: "/issue-vouchers",
        label: "Issue Vouchers (Model 20/22)",
        icon: CheckSquare,
        description: "Create and manage issue vouchers for material distribution"
      },
      {
        to: "/returns",
        label: "Material Returns (SRN)",
        icon: Undo2,
        description: "Review and approve returned materials for restocking"
      },
    ],
  },
  {
    section: "Store Management",
    description: "Organize and track inventory movements",
    items: [
      {
        to: "/locations",
        label: "Item Locations (Bins/Shelves)",
        icon: MapPin,
        description: "Manage warehouse bins and storage positions"
      },
      { to: "/bin-cards", label: "Bin Cards & Bin Transfers", icon: Package, description: "Track bin-level inventory and internal transfers" },
      {
        to: "/transfers",
        label: "Inter-Store Transfers",
        icon: ArrowLeftRight,
        description: "Initiate and receive transfers between stores"
      },
      { to: "/disposal", label: "Flag Items for Disposal", icon: Recycle, description: "Identify damaged or obsolete items for disposal" },
    ],
  },
  {
    section: "Inventory Records",
    description: "Stock ledgers and physical verification",
    items: [
      { to: "/stock-cards", label: "Store Stock Cards", icon: Boxes, description: "FIFO stock ledger for your store" },
      { to: "/items", label: "Item Master Catalog", icon: Tags, description: "Browse all available items and specifications" },
      { to: "/stock-control", label: "Physical Counts & Takes", icon: Scale, description: "Conduct and record physical stock counts" },
    ],
  },
];

// 4. Store Clerk / Storekeeper Navigation
const STOCK_CLERK_NAV = [
  {
    section: "Overview",
    description: "Daily storekeeper tasks and workflow",
    items: [
      {
        to: "/",
        label: "Storekeeper Dashboard",
        icon: LayoutDashboard,
        end: true,
        description: "Your assigned tasks and store activity"
      },
    ],
  },
  {
    section: "GRN Management",
    description: "Unified GRN processing workflow",
    items: [
      {
        to: "/goods-receipt",
        label: "Goods Receipts & GRN",
        icon: PackageCheck,
        description: "All receipts with tabs: Assigned Tasks, All Receipts, History"
      },
    ],
  },
  {
    section: "Assisting Operations",
    description: "Support store operations and inventory",
    items: [
      { 
        to: "/returns", 
        label: "Material Returns (Receipt)", 
        icon: Undo2, 
        description: "Confirm physical receipt of returned materials" 
      },
      { to: "/locations", label: "Item Locations (Bins)", icon: MapPin, description: "View and update item storage positions" },
      { to: "/bin-cards", label: "Bin Cards & Transfers", icon: Package, description: "Manage bin inventory and transfers" },
      { to: "/stock-control", label: "Physical Stock Counts", icon: Scale, description: "Conduct physical inventory counts" },
    ],
  },
  {
    section: "Store Reference Records",
    description: "Read-only access to store documents",
    items: [
      {
        to: "/requisitions",
        label: "Store Requisitions (View)",
        icon: ClipboardList,
        description: "View requisition history and status"
      },
      {
        to: "/issue-vouchers",
        label: "Issue Vouchers (View)",
        icon: CheckSquare,
        description: "View issue voucher records"
      },
      { to: "/stock-cards", label: "Store Stock Cards", icon: Boxes, description: "View stock card ledger" },
      { to: "/items", label: "Item Master Catalog", icon: Tags, description: "Browse item specifications" },
    ],
  },
];

// 5. Technical Evaluation Committee (TEC) Navigation
const TEC_NAV = [
  {
    section: "Overview",
    items: [
      {
        to: "/",
        label: "Technical Evaluation Dashboard",
        icon: LayoutDashboard,
        end: true,
      },
    ],
  },
  {
    section: "Technical Inspections",
    items: [
      {
        to: "/goods-receipt",
        label: "Receipts Inspection (GRN)",
        icon: PackageCheck,
      },
      { to: "/returns", label: "Returns Evaluation (SRN)", icon: Undo2 },
      { to: "/disposal", label: "Disposal Justifications", icon: Recycle },
    ],
  },
  {
    section: "Technical Specs & Audit",
    items: [
      { to: "/items", label: "Item Specifications", icon: Tags },
      { to: "/audit-log", label: "Inspection Audit Trail", icon: ShieldCheck },
    ],
  },
];

// 6. Property Registration Officer (PRO) Navigation
const PRO_NAV = [
  {
    section: "Overview",
    description: "Property registration and asset tracking",
    items: [
      { to: "/", label: "PRO Dashboard", icon: LayoutDashboard, end: true, description: "Asset registration workflow and pending tasks" },
    ],
  },
  {
    section: "GRN Management",
    description: "Unified GRN approvals and receipt processing",
    items: [
      {
        to: "/goods-receipt",
        label: "Goods Receipts & GRN",
        icon: PackageCheck,
        description: "All receipts with tabs: Pending Approvals, All Receipts, History"
      },
    ],
  },
  {
    section: "Official Documentation",
    description: "University asset registry and records",
    items: [
      { to: "/fixed-assets", label: "Fixed Asset Register", icon: CreditCard, description: "Official fixed asset register and valuations" },
    ],
  },
  {
    section: "Custodian Management",
    description: "Asset custody and user assignments",
    items: [
      {
        to: "/fixed-assets",
        label: "User-Cards & Custody Assignments",
        icon: UserCheck,
        description: "Track asset custodians and user responsibility cards"
      },
    ],
  },
  {
    section: "Supporting Records",
    description: "Reference data for asset registration",
    items: [
      { to: "/items", label: "Item Master Catalog", icon: Tags, description: "Master catalog of all items and specifications" },
      { to: "/suppliers", label: "Suppliers & GRN Sources", icon: Truck, description: "Supplier records and GRN source tracking" },
    ],
  },
  {
    section: "Audit & Compliance",
    description: "Asset tracking and compliance verification",
    items: [
      { to: "/audit-log", label: "Fixed Asset Audit Trail", icon: ShieldCheck, description: "Complete audit history of asset registrations" },
    ],
  },
];

// 7. Department / Unit Head Navigation
const DEPT_HEAD_NAV = [
  {
    section: "Overview",
    items: [
      {
        to: "/",
        label: "Department Dashboard",
        icon: LayoutDashboard,
        end: true,
      },
    ],
  },
  {
    section: "Requisitions",
    items: [
      {
        to: "/requisitions",
        label: "Submit Store Requisition",
        icon: ClipboardList,
      },
      {
        to: "/requisitions?view=staff-approvals",
        label: "Approve Staff Requisitions",
        icon: CheckSquare,
      },
      {
        to: "/returns?view=staff-approvals",
        label: "Approve Staff Returns",
        icon: Undo2,
      },
    ],
  },
  {
    section: "Returns & Transfers",
    items: [
      {
        to: "/returns",
        label: "Submit Material Return (SRN)",
        icon: Undo2,
      },
      {
        to: "/transfers",
        label: "Initiate Material Transfer",
        icon: ArrowLeftRight,
      },
    ],
  },
  {
    section: "Property Records",
    items: [
      {
        to: "/fixed-assets",
        label: "Unit Fixed Assets & User-Cards",
        icon: CreditCard,
      },
      { to: "/stock-cards", label: "Stock Overview (Read-Only)", icon: Boxes },
      { to: "/items", label: "Item Master Catalog", icon: Tags },
    ],
  },
];

// 8. Accountant / Finance Officer Navigation
const ACCOUNTANT_NAV = [
  {
    section: "Overview",
    items: [
      { to: "/", label: "Finance Dashboard", icon: LayoutDashboard, end: true },
    ],
  },
  {
    section: "Financial Reporting",
    items: [
      { to: "/reports", label: "Inventory Valuation (FIFO)", icon: DollarSign },
      {
        to: "/reports?type=fixed-asset-register",
        label: "Fixed Asset Register",
        icon: CreditCard,
      },
      {
        to: "/reports?type=stock-take-reconciliation",
        label: "Stock Take Reconciliation",
        icon: Scale,
      },
      {
        to: "/reports?type=disposal-summary",
        label: "Disposal Financial Summary",
        icon: Recycle,
      },
    ],
  },
  {
    section: "Write-Off & Disposal",
    items: [{ to: "/disposal", label: "Disposal Write-Offs", icon: Recycle }],
  },
  {
    section: "Supporting Records",
    items: [
      { to: "/stock-cards", label: "Stock Cards (FIFO Ledger)", icon: Boxes },
      {
        to: "/fixed-assets",
        label: "Fixed Assets & User-Cards",
        icon: CreditCard,
      },
      { to: "/items", label: "Item Master Catalog", icon: Tags },
    ],
  },
];

// 9. Disposal Committee Navigation
const DISPOSAL_COMMITTEE_NAV = [
  {
    section: "Overview",
    items: [
      {
        to: "/",
        label: "Disposal Committee Dashboard",
        icon: LayoutDashboard,
        end: true,
      },
    ],
  },
  {
    section: "Disposal Decisions",
    items: [
      {
        to: "/disposal?view=pending",
        label: "Pending Disposal Requests",
        icon: Recycle,
      },
      {
        to: "/disposal?view=history",
        label: "Disposal History & Resolutions",
        icon: GanttChartSquare,
      },
    ],
  },
  {
    section: "Supporting Documentation",
    items: [
      { to: "/items", label: "Item Specifications", icon: Tags },
      { to: "/fixed-assets", label: "Fixed Asset Register", icon: CreditCard },
      { to: "/audit-log", label: "Inspection Audit Trail", icon: ShieldCheck },
    ],
  },
];

// 10. Campus Security Officer Navigation
const SECURITY_NAV = [
  {
    section: "Overview",
    items: [
      {
        to: "/",
        label: "Security Dashboard",
        icon: LayoutDashboard,
        end: true,
      },
    ],
  },
  {
    section: "Gate Clearance",
    items: [
      {
        to: "/gate-clearance-requests",
        label: "Gate Clearance Requests",
        icon: Shield,
      },
      {
        to: "/gate-clearance-log",
        label: "Gate Clearance Log",
        icon: ShieldAlert,
      },
    ],
  },
  {
    section: "Supporting Records",
    items: [
      { to: "/stores", label: "Stores & Location Reference", icon: Warehouse },
    ],
  },
];

// 11. Gate Security Guard Navigation
const GATE_GUARD_NAV = [
  {
    section: "Overview",
    items: [
      {
        to: "/",
        label: "Gate Security Dashboard",
        icon: LayoutDashboard,
        end: true,
      },
    ],
  },
  {
    section: "Gate Operations",
    items: [
      {
        to: "/gate-clearance-requests",
        label: "Approved Clearances",
        icon: Shield,
      },
      {
        to: "/gate-clearance-log",
        label: "Exit Log",
        icon: ShieldAlert,
      },
    ],
  },
];

// Default operational navigation for other roles
const DEFAULT_OPERATIONAL_NAV = [
  {
    section: "Overview",
    items: [{ to: "/", label: "Dashboard", icon: LayoutDashboard, end: true }],
  },
  {
    section: "Setup",
    items: [
      { to: "/stores", label: "Stores", icon: Warehouse },
      { to: "/categories", label: "Item Categories", icon: Tags },
      { to: "/locations", label: "Item Locations", icon: MapPin },
      { to: "/items", label: "Item Master", icon: Package },
      { to: "/suppliers", label: "Suppliers", icon: Truck },
    ],
  },
  {
    section: "Receiving",
    items: [
      {
        to: "/goods-receipt",
        label: "Goods Receipt & GRN",
        icon: PackageCheck,
      },
    ],
  },
  {
    section: "Stock Records",
    items: [
      { to: "/stock-cards", label: "Stock Cards", icon: Boxes },
      { to: "/bin-cards", label: "Bin Cards", icon: Boxes },
    ],
  },
  {
    section: "Issuing",
    items: [
      { to: "/requisitions", label: "Store Requisitions", icon: ClipboardList },
      {
        to: "/issue-vouchers",
        label: "Issue Vouchers (SIV/ISIV)",
        icon: ClipboardList,
      },
    ],
  },
  {
    section: "Property",
    items: [
      { to: "/fixed-assets", label: "Fixed Assets", icon: CreditCard },
      { to: "/returns", label: "Material Returns", icon: Undo2 },
      {
        to: "/transfers",
        label: "Inter-Store Transfers",
        icon: ArrowLeftRight,
      },
      { to: "/disposal", label: "Disposal Workflow", icon: Recycle },
    ],
  },
  {
    section: "Stock Control",
    items: [
      {
        to: "/stock-control",
        label: "Monitoring, Takes & Valuation",
        icon: Scale,
      },
    ],
  },
  {
    section: "Insights & Governance",
    items: [
      { to: "/reports", label: "Reports & Analytics", icon: BarChart3 },
      { to: "/audit-log", label: "Audit Log", icon: ShieldCheck },
    ],
  },
];

// Tooltip component for collapsed sidebar and item descriptions
function Tooltip({ children, content, isCollapsed }) {
  const [show, setShow] = useState(false);

  if (!isCollapsed && !content) return children;

  return (
    <div
      className="relative"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && content && (
        <div className="absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 max-w-xs rounded-lg bg-slate-800 px-3 py-2 text-xs text-white shadow-xl dark:bg-slate-700 border border-slate-700 dark:border-slate-600">
          <div className="font-medium">{content}</div>
          <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-800 dark:border-r-slate-700"></div>
        </div>
      )}
    </div>
  );
}

export default function SidebarNew({
  isCollapsed = false,
  onToggleCollapse,
  onNavigate,
}) {
  const { currentUser } = useApp();
  const location = useLocation();

  // State for collapsed sections
  const [collapsedSections, setCollapsedSections] = useState(() => {
    const saved = localStorage.getItem("sidebar-collapsed-sections");
    return saved ? JSON.parse(saved) : {};
  });

  // Save to localStorage whenever collapsedSections changes
  useEffect(() => {
    localStorage.setItem(
      "sidebar-collapsed-sections",
      JSON.stringify(collapsedSections)
    );
  }, [collapsedSections]);

  const toggleSection = (sectionName) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionName]: !prev[sectionName],
    }));
  };

  // Determine navigation based on role
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

  let navigation = DEFAULT_OPERATIONAL_NAV;
  let directorateLabel = "Property Administration";

  if (isAdmin) {
    navigation = ADMIN_NAV;
    directorateLabel = "ICT Directorate";
  } else if (isPAO) {
    navigation = PAO_NAV;
    directorateLabel = "Procurement & Property Directorate";
  } else if (isStoreHead) {
    navigation = STORE_HEAD_NAV;
    directorateLabel = "Store Operations & Management";
  } else if (isStockClerk) {
    navigation = STOCK_CLERK_NAV;
    directorateLabel = "Storekeeper & Stock Operations";
  } else if (isTEC) {
    navigation = TEC_NAV;
    directorateLabel = "Technical Evaluation Panel";
  } else if (isPRO) {
    navigation = PRO_NAV;
    directorateLabel = "Property Records & Asset Registry";
  } else if (isDeptHead) {
    navigation = DEPT_HEAD_NAV;
    directorateLabel = "Department & Unit Operations";
  } else if (isAccountant) {
    navigation = ACCOUNTANT_NAV;
    directorateLabel = "Finance & Valuation Office";
  } else if (isDisposalCommittee) {
    navigation = DISPOSAL_COMMITTEE_NAV;
    directorateLabel = "Disposal Authorization Board";
  } else if (isSecurity) {
    navigation = SECURITY_NAV;
    directorateLabel = "Campus Security Office";
  } else if (isGateGuard) {
    navigation = GATE_GUARD_NAV;
    directorateLabel = "Campus Gate Security Post";
  }

  return (
    <aside
      className={`flex flex-col border-r-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-200 h-full shadow-xl ${
        isCollapsed ? "w-16" : "w-[280px]"
      }`}
    >
      {/* Header */}
      <div className="relative flex h-16 items-center justify-center border-b-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4">
        {!isCollapsed ? (
          <div className="flex items-center justify-between w-full gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-university-600 to-university-700 text-white shadow-md flex-shrink-0">
                <Warehouse size={22} strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold font-heading text-slate-900 dark:text-white">
                  Stock Mgmt System
                </p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {directorateLabel}
                </p>
              </div>
            </div>
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="group relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-university-600 to-university-700 dark:from-university-700 dark:to-university-800 text-white transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-university-500/50 dark:hover:shadow-university-600/50 active:scale-95 cursor-pointer border border-university-400/30 dark:border-university-500/30 flex-shrink-0 z-10"
                aria-label="Collapse sidebar"
                title="Collapse sidebar"
              >
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-university-400 to-university-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                <div className="relative z-10 transition-transform duration-300 group-hover:rotate-180">
                  <ChevronLeft size={20} strokeWidth={2.5} className="drop-shadow-sm" />
                </div>
                <div className="absolute inset-0 rounded-xl border-2 border-blue-400 dark:border-blue-300 opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"></div>
              </button>
            )}
          </div>
        ) : (
          <div className="relative group">
            {/* Logo with hover effect */}
            <Tooltip content="Stock Management System" isCollapsed={isCollapsed}>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-university-600 to-university-700 text-white shadow-md transition-all duration-300 group-hover:scale-105">
                <Warehouse size={24} strokeWidth={2} />
              </div>
            </Tooltip>
            
            {/* Floating expand button - appears on hover */}
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="absolute -right-3 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-university-600 to-university-700 dark:from-university-700 dark:to-university-800 text-white transition-all duration-300 hover:scale-125 hover:shadow-lg hover:shadow-university-500/50 dark:hover:shadow-university-600/50 active:scale-95 cursor-pointer border-2 border-white dark:border-slate-800 shadow-lg z-20 opacity-90 hover:opacity-100"
                aria-label="Expand sidebar"
                title="Expand sidebar (Click)"
              >
                <ChevronRight size={16} strokeWidth={3} className="drop-shadow-sm" />
              </button>
            )}
            
            {/* Subtle indicator hint */}
            <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-blue-500 dark:bg-blue-400 animate-ping opacity-75 pointer-events-none"></div>
            <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-blue-500 dark:bg-blue-400 opacity-90 pointer-events-none"></div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav
        className={`flex-1 overflow-y-auto overflow-x-hidden bg-slate-50 dark:bg-slate-950 ${isCollapsed ? "px-2 py-4" : "px-3 py-4"}`}
      >
        {navigation.map((section) => {
          const isSectionCollapsed = collapsedSections[section.section];

          return (
            <div key={section.section} className="mb-4">
              {!isCollapsed ? (
                <>
                  <button
                    onClick={() => toggleSection(section.section)}
                    className="mb-2 flex w-full flex-col items-start px-2 py-1 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg overflow-hidden"
                  >
                    <div className="flex w-full items-center justify-between gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300 truncate">
                        {section.section}
                      </span>
                      <ChevronDown
                        size={14}
                        className={`text-slate-500 dark:text-slate-400 transition-transform duration-200 flex-shrink-0 ${
                          isSectionCollapsed ? "-rotate-90" : ""
                        }`}
                      />
                    </div>
                    {section.description && (
                      <span className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400 leading-tight line-clamp-2">
                        {section.description}
                      </span>
                    )}
                  </button>

                  <div
                    className={`space-y-1 overflow-hidden transition-all duration-200 ${
                      isSectionCollapsed ? "max-h-0" : "max-h-[1000px]"
                    }`}
                  >
                    {section.items.map((item) => (
                      <Tooltip
                        key={`${item.to}-${item.label}`}
                        content={item.description || item.label}
                        isCollapsed={false}
                      >
                        <NavLink
                          to={item.to}
                          end={item.end}
                          onClick={onNavigate}
                          className={({ isActive }) => {
                            const itemUrl = new URL(
                              item.to,
                              window.location.origin
                            );
                            const queryActive = itemUrl.search
                              ? location.pathname === itemUrl.pathname &&
                                location.search === itemUrl.search
                              : isActive && !location.search;
                            return `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200 cursor-pointer group ${
                              queryActive
                                ? "bg-gradient-to-r from-university-600 to-university-700 text-white font-semibold shadow-md"
                                : "text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                            }`;
                          }}
                        >
                          <item.icon size={18} className="shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="truncate">{item.label}</div>
                            {item.badge && (
                              <span className="ml-2 inline-block rounded-full bg-blue-100 dark:bg-blue-900 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300">
                                {item.badge}
                              </span>
                            )}
                          </div>
                        </NavLink>
                      </Tooltip>
                    ))}
                  </div>
                </>
              ) : (
                // Collapsed sidebar - show only icons with tooltips
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <Tooltip
                      key={`${item.to}-${item.label}`}
                      content={item.label}
                      isCollapsed={isCollapsed}
                    >
                      <NavLink
                        to={item.to}
                        end={item.end}
                        onClick={onNavigate}
                        className={({ isActive }) => {
                          const itemUrl = new URL(
                            item.to,
                            window.location.origin
                          );
                          const queryActive = itemUrl.search
                            ? location.pathname === itemUrl.pathname &&
                              location.search === itemUrl.search
                            : isActive && !location.search;
                          return `flex h-11 w-full items-center justify-center rounded-lg transition-colors duration-200 cursor-pointer ${
                            queryActive
                              ? "bg-gradient-to-r from-university-600 to-university-700 text-white shadow-md"
                              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                          }`;
                        }}
                      >
                        <item.icon size={20} />
                      </NavLink>
                    </Tooltip>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

    </aside>
  );
}
