import React, { useState, useMemo } from "react";
import { FileCheck } from "lucide-react";
import { useApp } from "../../context/AppContext.jsx";
import { PageHeader, Button } from "../../components/ui/PageHeader.jsx";
import DataTable from "../../components/ui/DataTable.jsx";
import DelegationStatusBadge from "../../components/delegation/DelegationStatusBadge.jsx";
import ProApprovalModal from "../../components/delegation/ProApprovalModal.jsx";

export default function PendingGRNApprovals() {
  const { goodsReceipts, items, suppliers, approveForGRN } = useApp();
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Filter receipts awaiting PRO approval
  const pendingReceipts = useMemo(() => {
    return goodsReceipts
      .filter((r) => r.status === "Awaiting PRO Approval")
      .map((receipt) => {
        // Handle both single-item and multi-item receipts
        const isMultiItem = receipt.totalItems > 0 && receipt.items && receipt.items.length > 0;
        
        let itemName, unit, defaultUnitCost, qty;
        
        if (isMultiItem) {
          // Multi-item receipt: show summary
          const approvedItems = receipt.items.filter(i => i.tecDecision === "Approved");
          itemName = approvedItems.length > 0 
            ? `${approvedItems.length} items approved` 
            : `${receipt.items.length} items`;
          qty = approvedItems.reduce((sum, i) => sum + (i.qty || 0), 0);
          unit = "";
          defaultUnitCost = 0;
        } else {
          // Single-item receipt (backward compatibility)
          const item = items.find((i) => i.id === receipt.itemId);
          itemName = receipt.itemName || item?.name || "Unknown";
          unit = item?.unit || "";
          defaultUnitCost = item?.defaultUnitCost || 0;
          qty = receipt.qty || 0;
        }
        
        const supplier = suppliers.find((s) => s.id === receipt.supplierId);
        
        return {
          ...receipt,
          itemName,
          unit,
          qty,
          defaultUnitCost,
          supplierName: receipt.supplierName || supplier?.name || "Unknown",
          isMultiItem,
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [goodsReceipts, items, suppliers]);

  const columns = [
    {
      key: "refNo",
      header: "Receipt #",
      render: (row) => (
        <span className="font-medium text-slate-900 dark:text-slate-100">
          {row.refNo}
        </span>
      ),
    },
    {
      key: "itemName",
      header: "Item",
      render: (row) => (
        <div>
          <div className="font-medium">{row.itemName}</div>
          <div className="text-sm text-slate-500">{row.poReference}</div>
        </div>
      ),
    },
    {
      key: "qty",
      header: "Quantity",
      render: (row) => (
        <span>
          {row.qty} {row.unit}
        </span>
      ),
    },
    {
      key: "supplierName",
      header: "Supplier",
    },
    {
      key: "tecEvaluatedAt",
      header: "TEC Evaluation",
      render: (row) => (
        <div className="text-sm">
          {row.tecEvaluatedByName && (
            <div className="text-slate-600 dark:text-slate-400">
              by {row.tecEvaluatedByName}
            </div>
          )}
          {row.tecEvaluatedAt && (
            <div className="text-slate-500 dark:text-slate-500">
              {new Date(row.tecEvaluatedAt).toLocaleDateString()}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <DelegationStatusBadge status={row.status} />,
    },
    {
      key: "id",
      header: "",
      render: (row) => (
        <Button size="sm" onClick={() => setSelectedReceipt(row)}>
          Approve for GRN
        </Button>
      ),
    },
  ];

  const handleApprovalSuccess = () => {
    setSelectedReceipt(null);
  };

  return (
    <div>
      <PageHeader
        title="Pending GRN Approvals"
        icon={FileCheck}
        description="Review TEC-approved receipts and approve for GRN generation"
      />

      {pendingReceipts.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
          <FileCheck className="w-12 h-12 mx-auto text-slate-400 mb-3" />
          <p className="text-slate-600 dark:text-slate-400">
            No receipts awaiting your approval
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
            Receipts approved by TEC will appear here for your review
          </p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          rows={pendingReceipts}
          searchKeys={["refNo", "itemName", "supplierName", "poReference"]}
        />
      )}

      {selectedReceipt && (
        <ProApprovalModal
          receipt={selectedReceipt}
          onSuccess={handleApprovalSuccess}
          onClose={() => setSelectedReceipt(null)}
          approveForGRN={approveForGRN}
        />
      )}
    </div>
  );
}
