import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Printer, Download, ArrowLeft } from "lucide-react";
import { useApp } from "../../context/AppContext.jsx";
import { Button } from "../../components/ui/PageHeader.jsx";

export default function GRNDocument() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { goodsReceipts, items, suppliers, stores, currentUser } = useApp();
  const [receipt, setReceipt] = useState(null);

  // Check authorization
  const canViewGRN = [
    "Property Registration Officer",
    "Store Head",
    "Stock Clerk",
    "Property Administration Officer",
    "Administrator",
  ].includes(currentUser?.role);

  useEffect(() => {
    if (!canViewGRN) {
      navigate("/goods-receipt");
      return;
    }

    const found = goodsReceipts.find((r) => r.id === id);
    if (found) {
      // Enrich with related data
      const item = items.find((i) => i.id === found.itemId);
      const supplier = suppliers.find((s) => s.id === found.supplierId);
      const store = stores.find((st) => st.id === found.storeId);
      
      setReceipt({
        ...found,
        itemName: found.itemName || item?.name,
        itemCode: item?.code,
        itemUnit: item?.unit,
        supplierName: found.supplierName || supplier?.name,
        storeName: found.storeName || store?.name,
        storeCode: store?.code,
      });
    }
  }, [id, goodsReceipts, items, suppliers, stores, canViewGRN, navigate]);

  const handlePrint = () => {
    window.print();
  };

  if (!receipt) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-slate-600 dark:text-slate-400">Loading GRN...</p>
        </div>
      </div>
    );
  }

  if (receipt.status !== "Verified") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            GRN not available. Receipt must be verified first.
          </p>
          <Button onClick={() => navigate("/goods-receipt")}>
            <ArrowLeft size={16} /> Back to Receipts
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Print Actions - Hidden when printing */}
      <div className="print:hidden bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate("/goods-receipt")}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={16} /> Back
          </Button>
          <div className="flex gap-3">
            <Button onClick={handlePrint} className="flex items-center gap-2">
              <Printer size={16} /> Print
            </Button>
          </div>
        </div>
      </div>

      {/* GRN Document - A4 size */}
      <div className="max-w-5xl mx-auto p-8 print:p-0">
        <div className="bg-white shadow-lg print:shadow-none" id="grn-document">
          {/* Page Content - A4 dimensions */}
          <div className="p-12 print:p-16" style={{ minHeight: "297mm" }}>
            {/* Header */}
            <div className="text-center mb-8 pb-6 border-b-2 border-slate-800">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                [UNIVERSITY NAME]
              </h1>
              <p className="text-sm text-slate-600 mb-4">
                Property Administration Department
              </p>
              <h2 className="text-xl font-bold text-slate-900 uppercase tracking-wider">
                Goods Receiving Note (Model 19)
              </h2>
            </div>

            {/* GRN Details */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <div className="mb-4">
                  <p className="text-xs font-semibold text-slate-600 mb-1">GRN NUMBER</p>
                  <p className="text-lg font-bold text-slate-900">{receipt.grnNumber}</p>
                </div>
                <div className="mb-4">
                  <p className="text-xs font-semibold text-slate-600 mb-1">RECEIPT REF.</p>
                  <p className="text-base font-medium text-slate-900">{receipt.refNo}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-1">PO/DONATION REF.</p>
                  <p className="text-base font-medium text-slate-900">{receipt.poReference}</p>
                </div>
              </div>
              <div>
                <div className="mb-4">
                  <p className="text-xs font-semibold text-slate-600 mb-1">DATE GENERATED</p>
                  <p className="text-base font-medium text-slate-900">
                    {receipt.grnGeneratedAt
                      ? new Date(receipt.grnGeneratedAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })
                      : "—"}
                  </p>
                </div>
                <div className="mb-4">
                  <p className="text-xs font-semibold text-slate-600 mb-1">RECEIVING STORE</p>
                  <p className="text-base font-medium text-slate-900">
                    {receipt.storeName} ({receipt.storeCode})
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-1">SUPPLIER</p>
                  <p className="text-base font-medium text-slate-900">{receipt.supplierName}</p>
                </div>
              </div>
            </div>

            {/* Material Details Table */}
            <div className="mb-8">
              <h3 className="text-sm font-bold text-slate-900 mb-3 uppercase">Material Details</h3>
              <table className="w-full border-2 border-slate-800">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-800 px-4 py-2 text-left text-xs font-bold uppercase">
                      Item Code
                    </th>
                    <th className="border border-slate-800 px-4 py-2 text-left text-xs font-bold uppercase">
                      Description
                    </th>
                    <th className="border border-slate-800 px-4 py-2 text-right text-xs font-bold uppercase">
                      Quantity
                    </th>
                    <th className="border border-slate-800 px-4 py-2 text-right text-xs font-bold uppercase">
                      Unit Cost
                    </th>
                    <th className="border border-slate-800 px-4 py-2 text-right text-xs font-bold uppercase">
                      Total Value
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-800 px-4 py-3 text-sm font-medium">
                      {receipt.itemCode || "—"}
                    </td>
                    <td className="border border-slate-800 px-4 py-3 text-sm">
                      {receipt.itemName}
                    </td>
                    <td className="border border-slate-800 px-4 py-3 text-sm text-right font-semibold">
                      {receipt.qty} {receipt.itemUnit}
                    </td>
                    <td className="border border-slate-800 px-4 py-3 text-sm text-right">
                      ${receipt.unitCost ? parseFloat(receipt.unitCost).toFixed(2) : "0.00"}
                    </td>
                    <td className="border border-slate-800 px-4 py-3 text-sm text-right font-semibold">
                      ${receipt.unitCost && receipt.qty
                        ? (parseFloat(receipt.unitCost) * parseFloat(receipt.qty)).toFixed(2)
                        : "0.00"}
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50">
                    <td colSpan="4" className="border border-slate-800 px-4 py-2 text-right text-sm font-bold uppercase">
                      Total Value:
                    </td>
                    <td className="border border-slate-800 px-4 py-2 text-right text-base font-bold">
                      ${receipt.unitCost && receipt.qty
                        ? (parseFloat(receipt.unitCost) * parseFloat(receipt.qty)).toFixed(2)
                        : "0.00"}
                    </td>
                  </tr>
                </tfoot>
              </table>
              {receipt.expiryDate && (
                <p className="text-xs text-slate-600 mt-2">
                  <strong>Expiry Date:</strong> {new Date(receipt.expiryDate).toLocaleDateString()}
                </p>
              )}
            </div>

            {/* Approval Chain */}
            <div className="mb-8">
              <h3 className="text-sm font-bold text-slate-900 mb-3 uppercase">Approval Chain</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="border-2 border-slate-300 p-4 rounded">
                  <p className="text-xs font-semibold text-slate-600 mb-2">
                    TECHNICAL EVALUATION COMMITTEE
                  </p>
                  <p className="text-sm font-medium text-slate-900 mb-1">
                    {receipt.tecEvaluatedByName || "—"}
                  </p>
                  <p className="text-xs text-slate-600">
                    {receipt.tecEvaluatedAt
                      ? new Date(receipt.tecEvaluatedAt).toLocaleDateString()
                      : "—"}
                  </p>
                </div>

                <div className="border-2 border-slate-300 p-4 rounded">
                  <p className="text-xs font-semibold text-slate-600 mb-2">
                    PROPERTY REGISTRATION OFFICER
                  </p>
                  <p className="text-sm font-medium text-slate-900 mb-1">
                    {receipt.proApprovedByName || "—"}
                  </p>
                  <p className="text-xs text-slate-600">
                    {receipt.proApprovedAt
                      ? new Date(receipt.proApprovedAt).toLocaleDateString()
                      : "—"}
                  </p>
                </div>

                <div className="border-2 border-slate-300 p-4 rounded">
                  <p className="text-xs font-semibold text-slate-600 mb-2">
                    GRN GENERATED BY (STOCK CLERK)
                  </p>
                  <p className="text-sm font-medium text-slate-900 mb-1">
                    {receipt.grnGeneratedByName || "—"}
                  </p>
                  <p className="text-xs text-slate-600">
                    {receipt.grnGeneratedAt
                      ? new Date(receipt.grnGeneratedAt).toLocaleDateString()
                      : "—"}
                  </p>
                </div>

                <div className="border-2 border-slate-300 p-4 rounded">
                  <p className="text-xs font-semibold text-slate-600 mb-2">
                    PHYSICAL VERIFICATION (STORE HEAD)
                  </p>
                  <p className="text-sm font-medium text-slate-900 mb-1">
                    {receipt.verifiedByName || "—"}
                  </p>
                  <p className="text-xs text-slate-600">
                    {receipt.verifiedAt
                      ? new Date(receipt.verifiedAt).toLocaleDateString()
                      : "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* Signatures */}
            <div className="mt-12 pt-8 border-t-2 border-slate-300">
              <div className="grid grid-cols-3 gap-8">
                <div>
                  <div className="border-t-2 border-slate-800 pt-2 mb-8"></div>
                  <p className="text-xs font-semibold text-slate-600 uppercase text-center">
                    Received By
                  </p>
                  <p className="text-xs text-slate-500 text-center">(Store Clerk)</p>
                </div>
                <div>
                  <div className="border-t-2 border-slate-800 pt-2 mb-8"></div>
                  <p className="text-xs font-semibold text-slate-600 uppercase text-center">
                    Verified By
                  </p>
                  <p className="text-xs text-slate-500 text-center">(Store Head)</p>
                </div>
                <div>
                  <div className="border-t-2 border-slate-800 pt-2 mb-8"></div>
                  <p className="text-xs font-semibold text-slate-600 uppercase text-center">
                    Approved By
                  </p>
                  <p className="text-xs text-slate-500 text-center">(PRO)</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-4 border-t border-slate-300 text-center">
              <p className="text-xs text-slate-500">
                This is an official document. Alterations or erasures invalidate this GRN.
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
