import React from "react";

export default function TemplateMetricCard({
  label,
  value,
  sub,
  badge,
  badgeTone = "neutral",
  icon: Icon,
  className = "",
}) {
  const toneStyles = {
    green: "text-emerald-700 dark:text-emerald-400 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/30 border-emerald-200 dark:border-emerald-800/50",
    emerald: "text-emerald-700 dark:text-emerald-400 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/30 border-emerald-200 dark:border-emerald-800/50",
    red: "text-rose-700 dark:text-rose-400 bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-950/30 dark:to-rose-900/30 border-rose-200 dark:border-rose-800/50",
    rose: "text-rose-700 dark:text-rose-400 bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-950/30 dark:to-rose-900/30 border-rose-200 dark:border-rose-800/50",
    amber: "text-amber-700 dark:text-amber-400 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/30 border-amber-200 dark:border-amber-800/50",
    orange: "text-orange-700 dark:text-orange-400 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/30 border-orange-200 dark:border-orange-800/50",
    blue: "text-blue-700 dark:text-blue-400 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 border-blue-200 dark:border-blue-800/50",
    purple: "text-purple-700 dark:text-purple-400 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 border-purple-200 dark:border-purple-800/50",
    teal: "text-teal-700 dark:text-teal-400 bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-950/30 dark:to-teal-900/30 border-teal-200 dark:border-teal-800/50",
    neutral: "text-slate-600 dark:text-slate-400 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950/30 dark:to-slate-900/30 border-slate-200 dark:border-slate-800/50",
  };

  const iconBgStyles = {
    green: "bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/40 dark:to-emerald-800/40 text-emerald-700 dark:text-emerald-400",
    emerald: "bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/40 dark:to-emerald-800/40 text-emerald-700 dark:text-emerald-400",
    red: "bg-gradient-to-br from-rose-100 to-rose-200 dark:from-rose-900/40 dark:to-rose-800/40 text-rose-700 dark:text-rose-400",
    rose: "bg-gradient-to-br from-rose-100 to-rose-200 dark:from-rose-900/40 dark:to-rose-800/40 text-rose-700 dark:text-rose-400",
    amber: "bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/40 dark:to-amber-800/40 text-amber-700 dark:text-amber-400",
    orange: "bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/40 dark:to-orange-800/40 text-orange-700 dark:text-orange-400",
    blue: "bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40 text-blue-700 dark:text-blue-400",
    purple: "bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/40 dark:to-purple-800/40 text-purple-700 dark:text-purple-400",
    teal: "bg-gradient-to-br from-teal-100 to-teal-200 dark:from-teal-900/40 dark:to-teal-800/40 text-teal-700 dark:text-teal-400",
    neutral: "bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800/40 dark:to-slate-700/40 text-slate-600 dark:text-slate-400",
  };

  return (
    <div
      className={`group relative flex flex-col justify-between rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:border-university-300 dark:hover:border-university-700 ${className}`}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-slate-50/50 to-transparent dark:from-slate-800/30 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <div className="relative">
        <div className="flex items-center justify-between gap-2 mb-3">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">{label}</p>
          {Icon && (
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl shadow-md ${iconBgStyles[badgeTone] || iconBgStyles.neutral}`}>
              <Icon size={18} strokeWidth={2.5} />
            </div>
          )}
        </div>

        <div className="flex items-baseline justify-between gap-2 mb-3">
          <h3 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl font-heading">
            {value}
          </h3>
        </div>

        {(badge || sub) && (
          <div className="flex items-center gap-1.5">
            {badge ? (
              <span
                className={`inline-flex items-center rounded-lg border-2 px-2.5 py-1 text-xs font-bold shadow-sm ${
                  toneStyles[badgeTone] || toneStyles.neutral
                }`}
              >
                {badge}
              </span>
            ) : (
              <p
                className={`text-xs font-semibold ${
                  toneStyles[badgeTone] || toneStyles.neutral
                }`}
              >
                {sub}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
