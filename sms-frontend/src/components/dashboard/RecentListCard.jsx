import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Clock, AlertCircle } from "lucide-react";

export default function RecentListCard({
  title = "Recent Activities",
  items = [],
  viewAllLink = "/audit-log",
  viewAllText = "View All",
  emptyText = "No recent records.",
  className = "",
}) {
  return (
    <div
      className={`flex flex-col justify-between rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl hover:shadow-2xl transition-all duration-300 ${className}`}
    >
      <div>
        <div className="mb-4 flex items-center justify-between border-b-2 border-slate-200 dark:border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
            {items.length} items
          </span>
        </div>

        {items.length === 0 ? (
          <div className="py-8 text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <AlertCircle size={20} className="text-slate-400 dark:text-slate-500" />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{emptyText}</p>
          </div>
        ) : (
          <div className="space-y-1">
            {items.slice(0, 5).map((item, idx) => {
              const ItemIcon = item.icon || Clock;
              const toneStyles = {
                green: "bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-slate-600",
                emerald: "bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-slate-600",
                red: "bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-950/30 dark:to-rose-900/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-slate-600",
                rose: "bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-950/30 dark:to-rose-900/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-slate-600",
                amber: "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-slate-600",
                blue: "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-slate-600",
                purple: "bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-slate-600",
                teal: "bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-950/30 dark:to-teal-900/30 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-slate-600",
                neutral: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
              };
              
              return (
                <div
                  key={item.id || idx}
                  className="group flex items-center justify-between py-3 px-3 text-xs transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl border-2 border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-md"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1 mr-3">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-sm transition-transform duration-200 group-hover:scale-110 ${
                        item.iconBg || "bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      <ItemIcon size={16} strokeWidth={2.5} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-900 dark:text-white truncate leading-tight text-sm">
                        {item.title}
                      </p>
                      {item.subtitle && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 truncate mt-1">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    {item.time && (
                      <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {item.time}
                      </span>
                    )}
                    {item.badge && (
                      <span
                        className={`rounded-lg border-2 px-2.5 py-1 text-[11px] font-bold shadow-sm ${
                          toneStyles[item.badgeTone] || toneStyles.neutral
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                    {item.action && (
                      <div>{item.action}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {viewAllLink && (
        <div className="mt-5 flex justify-end border-t-2 border-slate-200 dark:border-slate-800 pt-4">
          <Link
            to={viewAllLink}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-university-600 to-university-700 hover:from-university-700 hover:to-university-800 dark:from-university-700 dark:to-university-800 dark:hover:from-university-800 dark:hover:to-university-900 px-4 py-2 text-xs font-bold text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5"
          >
            <span>{viewAllText}</span>
            <ArrowRight size={13} strokeWidth={2.5} />
          </Link>
        </div>
      )}
    </div>
  );
}
