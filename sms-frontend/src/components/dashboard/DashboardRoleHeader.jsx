import React from "react";
import { User } from "lucide-react";

export default function DashboardRoleHeader({
  title = "Dashboard",
  subtitle = "Overview of system activities",
  user,
  roleTitle,
  department,
  actions,
}) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end border-b-2 border-slate-200 dark:border-slate-800 pb-6">
      <div className="flex-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl mb-2 font-heading bg-gradient-to-r from-university-700 to-university-900 dark:from-university-400 dark:to-university-600 bg-clip-text text-transparent">
          {title}
        </h1>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{subtitle}</p>
      </div>

      {actions && (
        <div className="flex items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  );
}
