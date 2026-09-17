import React, { useState, useMemo } from "react";
import { PackageCheck } from "lucide-react";
import { useApp } from "../../context/AppContext.jsx";
import { PageHeader, Button } from "../../components/ui/PageHeader.jsx";
import DataTable from "../../components/ui/DataTable.jsx";
import DelegationStatusBadge from "../../components/delegation/DelegationStatusBadge.jsx";
import GRNExecutionModal from "../../components/delegation/GRNExecutionModal.jsx";

export default function AssignedGRNTasks() {
  const { goodsReceipts, items, itemLocations, executeGRN } = useApp();
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Filter receipts with PRO Approved status
  const assignedTasks = useMemo(() => {
    return goodsReceipts
      .filter((r) => r.status === "PRO Approved")
      .map((receipt) => {
        // Handle both single-item and multi-item receipts
        const isMultiItem = receipt.totalItems > 0 && receipt.items && receipt.items.length > 0;
        
        let itemName, unit, qty;
        
        if (isMultiItem) {
          // Multi-item receipt: show summary
          const approvedItems = receipt.items.filter(i => i.tecDecision === "Approved" && i.proApproved);
          itemName = approvedItems.length > 0 
            ? `${approvedItems.length} items approved` 
            : `${receipt.items.length} items`;
          qty = approvedItems.reduce((sum, i) => sum + (i.qty || 0), 0);
          unit = "";
        } else {
          // Single-item receipt (backward compatibility)
          const item = items.find((i) => i.id === receipt.itemId);
          itemName = receipt.itemName || item?.name || "Unknown";
          unit = item?.unit || "";
          qty = receipt.qty || 0;
        }
        
        return {
          ...receipt,
          itemName,
          unit,
          qty,
          isMultiItem,
        };
      })
      .sort((a, b) => new Date(b.proApprovedAt) - new Date(a.proApprovedAt));
  }, [goodsReceipts, items]);

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
      key: "grnNumber",
      header: "GRN Number",
      render: (row) => (
        <span className="font-mono text-indigo-600 dark:text-indigo-400 font-medium">
          {row.grnNumber || "N/A"}
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
      key: "unitCost",
      header: "Unit Cost",
      render: (row) => <span>${row.unitCost || "N/A"}</span>,
    },
    {
      key: "proApprovedAt",
      header: "PRO Approved",
      render: (row) => (
        <div className="text-sm">
          {row.proApprovedByName && (
            <div className="text-slate-600 dark:text-slate-400">
              by {row.proApprovedByName}
            </div>
          )}
          {row.proApprovedAt && (
            <div className="text-slate-500 dark:text-slate-500">
              {new Date(row.proApprovedAt).toLocaleDateString()}
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
          Execute GRN
        </Button>
      ),
    },
  ];

  const handleExecutionSuccess = () => {
    setSelectedReceipt(null);
  };

  return (
    <div>
      <PageHeader
        title="Assigned GRN Tasks"
        icon={PackageCheck}
        description="Execute GRN generation for PRO-approved receipts"
      />

      {assignedTasks.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
          <PackageCheck className="w-12 h-12 mx-auto text-slate-400 mb-3" />
          <p className="text-slate-600 dark:text-slate-400">
            No GRN tasks assigned to you
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
            PRO-approved receipts will appear here for your execution
          </p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          rows={assignedTasks}
          searchKeys={["refNo", "grnNumber", "itemName", "poReference"]}
        />
      )}

      {selectedReceipt && (
        <GRNExecutionModal
          receipt={selectedReceipt}
          itemLocations={itemLocations}
          onSuccess={handleExecutionSuccess}
          onClose={() => setSelectedReceipt(null)}
          executeGRN={executeGRN}
        />
      )}
    </div>
  );
}
