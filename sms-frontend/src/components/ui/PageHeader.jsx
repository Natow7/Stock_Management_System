import React from "react";

export function PageHeader({ title, description, action }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action && <div className="flex items-center gap-2 flex-wrap">{action}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  tone = "navy",
  icon: Icon,
  badge,
  onClick,
}) {
  const toneMap = {
    navy: "bg-gradient-to-br from-university-600 to-university-700 dark:from-university-700 dark:to-university-800 text-white border-2 border-university-500/30 dark:border-university-600/30 shadow-xl",
    clay: "bg-gradient-to-br from-clay-600 to-clay-700 dark:from-clay-700 dark:to-clay-800 text-white border-2 border-clay-500/30 dark:border-clay-600/30 shadow-xl",
    emerald: "bg-gradient-to-br from-emerald-600 to-emerald-700 dark:from-emerald-700 dark:to-emerald-800 text-white border-2 border-emerald-500/30 dark:border-emerald-600/30 shadow-xl",
    amber: "bg-gradient-to-br from-amber-600 to-amber-700 dark:from-amber-700 dark:to-amber-800 text-white border-2 border-amber-500/30 dark:border-amber-600/30 shadow-xl",
    indigo: "bg-gradient-to-br from-indigo-600 to-indigo-700 dark:from-indigo-700 dark:to-indigo-800 text-white border-2 border-indigo-500/30 dark:border-indigo-600/30 shadow-xl",
    purple: "bg-gradient-to-br from-purple-600 to-purple-700 dark:from-purple-700 dark:to-purple-800 text-white border-2 border-purple-500/30 dark:border-purple-600/30 shadow-xl",
    rose: "bg-gradient-to-br from-rose-600 to-rose-700 dark:from-rose-700 dark:to-rose-800 text-white border-2 border-rose-500/30 dark:border-rose-600/30 shadow-xl",
    light: "bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-2 border-slate-200 dark:border-slate-800 shadow-xl hover:border-university-300 dark:hover:border-university-700",
  };

  const isLight = tone === "light";

  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${
        onClick ? "cursor-pointer" : ""
      } ${toneMap[tone] || toneMap.navy}`}
    >
      {/* Subtle decorative gradient overlay */}
      <div
        className={`pointer-events-none absolute -right-8 -bottom-8 h-32 w-32 rounded-full opacity-20 blur-2xl ${
          isLight ? "bg-university-600" : "bg-white"
        } group-hover:opacity-30 transition-opacity duration-300`}
      />

      <div className="relative flex items-center justify-between gap-2">
        <p
          className={`text-xs font-bold uppercase tracking-wider ${
            isLight ? "text-slate-600 dark:text-slate-400" : "text-white/90"
          }`}
        >
          {label}
        </p>
        <div className="flex items-center gap-2">
          {badge && (
            <span
              className={`rounded-lg px-2.5 py-1 text-[10px] font-bold shadow-sm ${
                isLight
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  : "bg-white/20 text-white backdrop-blur-sm ring-1 ring-white/20"
              }`}
            >
              {badge}
            </span>
          )}
          {Icon && (
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 ${
                isLight
                  ? "bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 text-slate-600 dark:text-slate-300 shadow-md"
                  : "bg-white/20 text-white backdrop-blur-sm ring-2 ring-white/30 shadow-lg"
              }`}
            >
              <Icon size={18} strokeWidth={2.5} />
            </div>
          )}
        </div>
      </div>

      <div className="relative mt-4">
        <p className="text-3xl sm:text-4xl font-extrabold tracking-tight font-heading">
          {value}
        </p>
        {sub && (
          <p
            className={`mt-2 text-xs font-semibold line-clamp-1 ${
              isLight ? "text-slate-600 dark:text-slate-400" : "text-white/80"
            }`}
          >
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}) {
  const variants = {
    primary:
      "bg-gradient-to-r from-university-600 to-university-700 hover:from-university-700 hover:to-university-800 dark:from-university-700 dark:to-university-800 dark:hover:from-university-800 dark:hover:to-university-900 text-white shadow-lg hover:shadow-xl active:scale-[0.98] border-2 border-university-500/30 dark:border-university-600/30 hover:-translate-y-0.5 transition-all duration-200",
    clay:
      "bg-gradient-to-r from-clay-600 to-clay-700 hover:from-clay-700 hover:to-clay-800 text-white shadow-lg hover:shadow-xl active:scale-[0.98] border-2 border-clay-500/30 hover:-translate-y-0.5 transition-all duration-200",
    emerald:
      "bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 dark:from-emerald-700 dark:to-emerald-800 dark:hover:from-emerald-800 dark:hover:to-emerald-900 text-white shadow-lg hover:shadow-xl active:scale-[0.98] border-2 border-emerald-500/30 dark:border-emerald-600/30 hover:-translate-y-0.5 transition-all duration-200",
    secondary:
      "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-2 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-400 dark:hover:border-slate-500 active:scale-[0.98] shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200",
    danger:
      "bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 dark:from-rose-700 dark:to-rose-800 dark:hover:from-rose-800 dark:hover:to-rose-900 text-white shadow-lg hover:shadow-xl active:scale-[0.98] border-2 border-rose-500/30 dark:border-rose-600/30 hover:-translate-y-0.5 transition-all duration-200",
    ghost:
      "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white active:scale-[0.98] transition-all duration-200",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs font-bold",
    md: "px-5 py-2.5 text-sm font-bold",
    lg: "px-6 py-3 text-base font-bold",
  };

  return (
    <button
      className={`focus-ring inline-flex items-center justify-center gap-2 rounded-xl transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none disabled:hover:translate-y-0 ${variants[variant] || variants.primary} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Field({ label, children, error, hint }) {
  return (
    <label className="mb-4 block">
      <span className="mb-2 block text-sm font-bold text-slate-900 dark:text-white">
        {label}
      </span>
      {children}
      {hint && !error && (
        <span className="mt-1.5 block text-xs text-slate-500 dark:text-slate-400">
          {hint}
        </span>
      )}
      {error && (
        <span className="mt-1.5 block text-xs font-semibold text-rose-600 dark:text-rose-400">
          {error}
        </span>
      )}
    </label>
  );
}

export const inputCls =
  "focus-ring w-full rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all duration-200 focus:bg-white dark:focus:bg-slate-900 focus:border-university-600 dark:focus:border-university-500 focus:ring-2 focus:ring-university-500/20 dark:focus:ring-university-400/20 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:border-slate-400 dark:hover:border-slate-600";

export const selectCls =
  "focus-ring w-full rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm font-medium text-slate-900 dark:text-white transition-all duration-200 focus:border-university-600 dark:focus:border-university-500 focus:ring-2 focus:ring-university-500/20 dark:focus:ring-university-400/20 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:border-slate-400 dark:hover:border-slate-600 appearance-none bg-no-repeat bg-right pr-10";

export const textareaCls =
  "focus-ring w-full rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all duration-200 focus:bg-white dark:focus:bg-slate-900 focus:border-university-600 dark:focus:border-university-500 focus:ring-2 focus:ring-university-500/20 dark:focus:ring-university-400/20 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:border-slate-400 dark:hover:border-slate-600 resize-none";

