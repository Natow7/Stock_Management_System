import React, { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, FileCheck, List, Clock, ClipboardCheck } from "lucide-react";
import { useApp } from "../../context/AppContext.jsx";
import { PageHeader, Button } from "../../components/ui/PageHeader.jsx";
import DataTable from "../../components/ui/DataTable.jsx";
import Badge from "../../components/ui/Badge.jsx";
import PendingGRNApprovals from "../delegation/PendingGRNApprovals.jsx";
import AssignedGRNTasks from "../delegation/AssignedGRNTasks.jsx";
import PendingVerifications from "../delegation/PendingVerifications.jsx";

// Import the existing GoodsReceipt component's logic
import OriginalGoodsReceipt from "./GoodsReceipt.jsx";

export default function GoodsReceiptUnified() {
  const { currentUser, goodsReceipts } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showRecordModal, setShowRecordModal] = useState(false);
  
  // Get active tab from URL, default based on role
  const isPRO = currentUser?.role === "Property Registration Officer";
  const isStockClerk = currentUser?.role === "Stock Clerk";
  const isStoreHead = currentUser?.role === "Store Head";
  
  // Check if user can record receipts (operational roles only)
  const canRecordReceipt = ["Store Head", "Stock Clerk", "Administrator"].includes(currentUser?.role);
  
  const defaultTab = isPRO ? "pending" : isStockClerk ? "assigned" : isStoreHead ? "verifications" : "all";
  const activeTab = searchParams.get("tab") || defaultTab;
  
  const handleRecordClick = () => {
    setSearchParams({ tab: "all" });
    setShowRecordModal(true);
  };

  // Count pending approvals for PRO badge
  const pendingCount = useMemo(() => {
    if (!goodsReceipts) return 0;
    return goodsReceipts.filter(
      (gr) => gr.status === "Awaiting PRO Approval"
    ).length;
  }, [goodsReceipts]);

  // Count assigned tasks for Stock Clerk badge
  const assignedCount = useMemo(() => {
    if (!goodsReceipts) return 0;
    return goodsReceipts.filter(
      (gr) => gr.status === "PRO Approved"
    ).length;
  }, [goodsReceipts]);

  // Count verifications for Store Head badge
  const verificationsCount = useMemo(() => {
    if (!goodsReceipts) return 0;
    return goodsReceipts.filter(
      (gr) => gr.status === "Awaiting Store Head Verification"
    ).length;
  }, [goodsReceipts]);

  const tabs = [
    {
      id: "pending",
      label: "Pending Approvals",
      icon: FileCheck,
      badge: pendingCount > 0 ? pendingCount : null,
      description: "GRN approvals awaiting your action",
      visible: isPRO,
    },
    {
      id: "assigned",
      label: "Assigned GRN Tasks",
      icon: FileCheck,
      badge: assignedCount > 0 ? assignedCount : null,
      description: "Execute GRN for PRO-approved receipts",
      visible: isStockClerk,
    },
    {
      id: "verifications",
      label: "Pending Verifications",
      icon: ClipboardCheck,
      badge: verificationsCount > 0 ? verificationsCount : null,
      description: "Verify physical stock for completed GRNs",
      visible: isStoreHead,
    },
    {
      id: "all",
      label: "All Receipts",
      icon: List,
      description: "Complete goods receipt management",
      visible: true,
    },
    {
      id: "history",
      label: "History & Search",
      icon: Clock,
      description: "View past receipts and GRNs",
      visible: true,
    },
  ].filter((tab) => tab.visible);

  function setTab(tabId) {
    setSearchParams({ tab: tabId });
  }

  return (
    <div>
      {/* Page Header with Action Button */}
      <div className="flex items-center justify-between mb-6">
        <PageHeader
          title="Goods Receipts & GRN Management"
          description="Manage goods receipts with delegation workflow and complete history"
        />
        {canRecordReceipt && (
          <Button
            onClick={handleRecordClick}
            className="flex items-center gap-2"
          >
            <Plus size={18} />
            Record Goods Receipt
          </Button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-slate-200 dark:border-slate-700">
        <nav className="-mb-px flex space-x-2" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setTab(tab.id)}
                className={`
                  group relative inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-all duration-200
                  ${
                    isActive
                      ? "border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-700 dark:hover:text-slate-300"
                  }
                `}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="ml-1 inline-flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 text-xs font-bold text-blue-600 dark:text-blue-400">
                    {tab.badge}
                  </span>
                )}
                
                {/* Tooltip on hover */}
                {!isActive && (
                  <span className="absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 dark:bg-slate-700 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none z-10">
                    {tab.description}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === "pending" && isPRO && (
          <div>
            <PendingGRNApprovals />
          </div>
        )}

        {activeTab === "assigned" && isStockClerk && (
          <div>
            <AssignedGRNTasks />
          </div>
        )}

        {activeTab === "verifications" && isStoreHead && (
          <div>
            <PendingVerifications />
          </div>
        )}

        {activeTab === "all" && (
          <div>
            <OriginalGoodsReceipt 
              hideRecordButton={true} 
              openModal={showRecordModal}
              onModalClose={() => setShowRecordModal(false)}
            />
          </div>
        )}

        {activeTab === "history" && (
          <div>
            <HistoryTab />
          </div>
        )}
      </div>
    </div>
  );
}

// History & Search Tab Component
function HistoryTab() {
  const { goodsReceipts, items, suppliers } = useApp();

  // Filter only completed GRNs
  const completedReceipts = useMemo(() => {
    if (!goodsReceipts) return [];
    return goodsReceipts.filter(
      (gr) => gr.status === "GRN Generated" || gr.status === "Verified"
    );
  }, [goodsReceipts]);

  return (
    <div>
      <div className="mb-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
          Historical Records
        </h3>
        <p className="text-xs text-blue-700 dark:text-blue-300">
          View all completed goods receipts and generated GRNs. Use the search bar to find specific receipts.
        </p>
      </div>

      <DataTable
        searchKeys={["refNo", "grnNumber", "itemName", "supplierName"]}
        columns={[
          { key: "refNo", header: "Receipt Ref" },
          { 
            key: "grnNumber", 
            header: "GRN Number",
            render: (r) => r.grnNumber || "—"
          },
          { key: "itemName", header: "Material" },
          { 
            key: "supplierName", 
            header: "Supplier",
            render: (r) => r.supplierName || "—"
          },
          { key: "qty", header: "Quantity" },
          {
            key: "createdAt",
            header: "Date Received",
            render: (r) => new Date(r.createdAt).toLocaleDateString(),
          },
          {
            key: "grnGeneratedAt",
            header: "GRN Date",
            render: (r) => r.grnGeneratedAt ? new Date(r.grnGeneratedAt).toLocaleDateString() : "—",
          },
          {
            key: "status",
            header: "Status",
            render: (r) => <Badge>{r.status}</Badge>,
          },
        ]}
        rows={completedReceipts}
        emptyLabel="No completed receipts found in history."
      />

      <div className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
        Showing {completedReceipts.length} completed receipt(s)
      </div>
    </div>
  );
}
