import React from "react";

const TONE_MAP = {
  green: "bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/40 dark:to-emerald-900/40 text-emerald-700 dark:text-emerald-400 border-2 border-emerald-200 dark:border-emerald-800 shadow-sm",
  emerald: "bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/40 dark:to-emerald-900/40 text-emerald-700 dark:text-emerald-400 border-2 border-emerald-200 dark:border-emerald-800 shadow-sm",
  amber: "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/40 dark:to-amber-900/40 text-amber-700 dark:text-amber-400 border-2 border-amber-200 dark:border-amber-800 shadow-sm",
  red: "bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-950/40 dark:to-rose-900/40 text-rose-700 dark:text-rose-400 border-2 border-rose-200 dark:border-rose-800 shadow-sm",
  rose: "bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-950/40 dark:to-rose-900/40 text-rose-700 dark:text-rose-400 border-2 border-rose-200 dark:border-rose-800 shadow-sm",
  blue: "bg-gradient-to-br from-sky-50 to-sky-100 dark:from-sky-950/40 dark:to-sky-900/40 text-sky-700 dark:text-sky-400 border-2 border-sky-200 dark:border-sky-800 shadow-sm",
  sky: "bg-gradient-to-br from-sky-50 to-sky-100 dark:from-sky-950/40 dark:to-sky-900/40 text-sky-700 dark:text-sky-400 border-2 border-sky-200 dark:border-sky-800 shadow-sm",
  slate: "bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/40 dark:to-slate-800/40 text-slate-700 dark:text-slate-300 border-2 border-slate-200 dark:border-slate-700 shadow-sm",
  navy: "bg-gradient-to-br from-university-50 to-university-100 dark:from-university-950/40 dark:to-university-900/40 text-university-700 dark:text-university-400 border-2 border-university-200 dark:border-university-800 shadow-sm",
  university: "bg-gradient-to-br from-university-50 to-university-100 dark:from-university-950/40 dark:to-university-900/40 text-university-700 dark:text-university-400 border-2 border-university-200 dark:border-university-800 shadow-sm",
  clay: "bg-gradient-to-br from-clay-50 to-clay-100 dark:from-clay-950/40 dark:to-clay-900/40 text-clay-700 dark:text-clay-400 border-2 border-clay-200 dark:border-clay-800 shadow-sm",
  purple: "bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/40 dark:to-purple-900/40 text-purple-700 dark:text-purple-400 border-2 border-purple-200 dark:border-purple-800 shadow-sm",
  indigo: "bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950/40 dark:to-indigo-900/40 text-indigo-700 dark:text-indigo-400 border-2 border-indigo-200 dark:border-indigo-800 shadow-sm",
};

const STATUS_TONE = {
  "Awaiting Evaluation": "amber",
  "Awaiting PRO Approval": "clay",
  "PRO Approved": "emerald",
  "Awaiting Store Head Verification": "blue",
  Verified: "green",
  Approved: "green",
  "Partially Approved": "amber",
  Rejected: "red",
  "GRN Generated": "blue",
  "Pending Approval": "amber",
  "Pending Department Approval": "amber",
  "Pending PAO Approval": "clay",
  "Pending Technical Evaluation": "amber",
  Evaluated: "blue",
  Issued: "green",
  Preliminary: "amber",
  "Pending Disposal": "amber",
  Disposed: "slate",
  Active: "green",
  Inactive: "slate",
  "In Use": "blue",
  Serviceable: "green",
  Damaged: "red",
  Obsolete: "slate",
};

export default function Badge({ children, tone, size = "md" }) {
  const resolvedTone = tone || STATUS_TONE[children] || "slate";
  
  const sizes = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm",
  };
  
  return (
    <span
      className={`inline-flex items-center rounded-lg font-bold ${sizes[size]} ${TONE_MAP[resolvedTone]}`}
    >
      {children}
    </span>
  );
}
