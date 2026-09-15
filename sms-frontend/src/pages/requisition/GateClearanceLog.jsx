import React, { useState, useEffect } from "react";
import { Shield, CheckCircle, FileText, Calendar, User } from "lucide-react";
import { useApp } from "../../context/AppContext";
import api from "../../lib/api";
import { PageHeader } from "../../components/ui/PageHeader";
import DataTable from "../../components/ui/DataTable";

// Format date helper
function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString();
}

// Format time helper
function formatTime(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleTimeString();
}

/**
 * Gate Clearance Log
 * 
 * Shows actual physical exits recorded at the gate by Security Officer.
 * This is the SECOND stage after pre-approval:
 * 1. Pre-approval: gate_clearance_requests (approved before leaving store)
 * 2. Physical exit: gate_clearances (logged when passing gate)
 * 
 * Purpose: Audit trail of all materials that physically left campus
 */
export default function GateClearanceLog() {
  const { currentUser, showToast } = useApp();
  const [clearances, setClearances] = useState([]);
  const [loading, setLoading] = useState(false);

  const isSecurityOfficer = currentUser?.role === "Campus Security Officer";

  useEffect(() => {
    loadClearances();
  }, []);

  async function loadClearances() {
    setLoading(true);
    try {
      const response = await api.gateClearance.listClearances();
      console.log("🔵 API Response:", response);
      const data = response?.data?.clearances || [];
      console.log("🔵 Raw clearances data:", data);
      console.log("🔵 First clearance (if any):", data[0]);
      
      // Filter out any null or undefined entries - check for clearedAt (camelCase)
      const validClearances = data.filter(c => c && c.clearedAt);
      console.log("🔵 Loaded clearances:", validClearances.length, "valid entries");
      
      if (data.length > 0 && validClearances.length === 0) {
        console.log("⚠️ Data exists but no valid clearedAt timestamps found!");
        console.log("⚠️ Sample data keys:", Object.keys(data[0]));
      }
      
      setClearances(validClearances);
    } catch (error) {
      console.error("Error loading gate clearances:", error);
      showToast("Failed to load gate clearance log", "warn");
      setClearances([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gate Clearance Log"
        description="Audit trail of materials that physically exited the campus gate. Each entry represents a verified exit."
      />

      {/* Stats Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
              <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">
                {clearances.length}
              </div>
              <div className="text-xs text-muted-foreground">Total Exits Logged</div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">
                {clearances.filter(c => {
                  if (!c || !c.clearedAt) return false;
                  const date = new Date(c.clearedAt);
                  const today = new Date();
                  return date.toDateString() === today.toDateString();
                }).length}
              </div>
              <div className="text-xs text-muted-foreground">Today's Exits</div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">
                {clearances.filter(c => {
                  const date = new Date(c.cleared_at);
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return date >= weekAgo;
                }).length}
              </div>
              <div className="text-xs text-muted-foreground">Last 7 Days</div>
            </div>
          </div>
        </div>
      </div>

      {/* Clearance Log Table */}
      <DataTable
        title="Physical Exit Log"
        description="Materials that passed the campus gate with approved clearance"
        icon={Shield}
        loading={loading}
        columns={[
          {
            key: "clearedAt",
            header: "Exit Date & Time",
            render: (row) => {
              if (!row || !row.clearedAt) return <span className="text-sm text-muted-foreground">N/A</span>;
              return (
                <div>
                  <div className="font-medium text-sm text-foreground">
                    {formatDate(row.clearedAt)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatTime(row.clearedAt)}
                  </div>
                </div>
              );
            },
          },
          {
            key: "voucherRef",
            header: "Voucher (Model 22)",
            render: (row) => (
              <div>
                <div className="font-semibold text-sm text-foreground">
                  {String(row.voucherRef || "—")}
                </div>
                {row?.storeName && (
                  <div className="text-xs text-muted-foreground">
                    {String(row.storeName)}
                  </div>
                )}
              </div>
            ),
          },
          {
            key: "collectorName",
            header: "Collector",
            render: (row) => (
              <div>
                <div className="text-sm text-foreground">{String(row.collectorName || "—")}</div>
                {row?.collectorDepartment && (
                  <div className="text-xs text-muted-foreground">
                    {String(row.collectorDepartment)}
                  </div>
                )}
              </div>
            ),
          },
          {
            key: "clearedByName",
            header: "Verified By",
            render: (row) => (
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-300">
                <User size={12} />
                <span>{row.clearedByName || "Security Officer"}</span>
              </div>
            ),
          },
          {
            key: "notes",
            header: "Notes",
            render: (row) => (
              <div className="text-xs text-muted-foreground max-w-xs truncate">
                {row.notes || "—"}
              </div>
            ),
          },
        ]}
        rows={clearances}
        emptyMessage="No gate exits logged yet. Materials will appear here when they physically leave campus."
      />
    </div>
  );
}
