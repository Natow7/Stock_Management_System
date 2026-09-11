import React from "react";

/**
 * ActionButton - Consistent action button for tables
 * Always visible in both light and dark modes
 */
export function ActionButton({ 
  children, 
  onClick, 
  variant = "primary",
  size = "sm",
  className = "" 
}) {
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-sm",
    success: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm",
    danger: "bg-rose-600 hover:bg-rose-700 text-white shadow-sm",
    secondary: "bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 shadow-sm",
    ghost: "bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600",
    link: "text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline font-medium",
  };

  const sizes = {
    xs: "px-2 py-0.5 text-xs",
    sm: "px-2.5 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
  };

  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center justify-center gap-1 
        rounded-md font-medium
        transition-all duration-150
        focus-ring
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
    >
      {children}
    </button>
  );
}

/**
 * ActionLink - Text link button for tables
 */
export function ActionLink({ children, onClick, variant = "primary", className = "" }) {
  const variants = {
    primary: "text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300",
    success: "text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300",
    danger: "text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300",
    warning: "text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300",
  };

  return (
    <button
      onClick={onClick}
      className={`
        text-xs font-medium hover:underline
        transition-colors
        ${variants[variant]}
        ${className}
      `}
    >
      {children}
    </button>
  );
}
