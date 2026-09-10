"use client";

import * as React from "react";
import {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const MotionChevron = motion(ChevronRight);

// ─── Sidebar001 (with resize) ─────────────────────────────────────────────────

export function ResizableSidebar({
  children,
  className,
  defaultWidth = 280,
  minWidth = 200,
  maxWidth = 400,
}) {
  const [width, setWidth] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebar-width');
      return saved ? parseInt(saved) : defaultWidth;
    }
    return defaultWidth;
  });
  const dragging = useRef(false);
  const startX = useRef(0);
  const startW = useRef(0);

  const onPointerDown = useCallback(
    (e) => {
      e.preventDefault();
      dragging.current = true;
      startX.current = e.clientX;
      startW.current = width;
      e.target.setPointerCapture(e.pointerId);
    },
    [width],
  );

  const onPointerMove = useCallback(
    (e) => {
      if (!dragging.current) return;
      const next = Math.min(
        maxWidth,
        Math.max(minWidth, startW.current + e.clientX - startX.current),
      );
      setWidth(next);
      if (typeof window !== 'undefined') {
        localStorage.setItem('sidebar-width', next.toString());
      }
    },
    [minWidth, maxWidth],
  );

  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  return (
    <aside
      className={cn(
        "relative flex flex-col h-full shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800",
        className,
      )}
      style={{ width }}
    >
      {children}

      {/* Resize handle */}
      <div
        className="absolute top-0 right-0 h-full w-1 cursor-col-resize group/handle z-20 hover:bg-blue-500/20 transition-colors"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <div className="absolute right-0 top-0 h-full w-px bg-slate-300 dark:bg-slate-700 group-hover/handle:bg-blue-500 transition-colors" />
      </div>
    </aside>
  );
}

// ─── Sidebar Header ────────────────────────────────────────────────────────────

export function SidebarHeader({
  children,
  className,
}) {
  return (
    <div className={cn("shrink-0 px-4 pt-4 pb-3 border-b border-slate-200 dark:border-slate-800", className)}>
      {children}
    </div>
  );
}

// ─── Sidebar Content ──────────────────────────────────────────────────────────

export function SidebarContent({
  children,
  className,
}) {
  return (
    <div
      className={cn("flex-1 overflow-y-auto py-4", className)}
      data-scroll-viewport
    >
      {children}
    </div>
  );
}

// ─── Sidebar Footer ───────────────────────────────────────────────────────────

export function SidebarFooter({
  children,
  className,
}) {
  return (
    <div
      className={cn(
        "shrink-0 px-4 pb-4 pt-3 border-t border-slate-200 dark:border-slate-800",
        className,
      )}
    >
      {children}
    </div>
  );
}

// ─── Sidebar Section ──────────────────────────────────────────────────────────

export function SidebarSection({
  label,
  children,
  className,
}) {
  return (
    <div className={cn("flex flex-col px-3 mb-6", className)}>
      {label && (
        <div className="px-2 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label}
        </div>
      )}
      <div className="space-y-1">
        {children}
      </div>
    </div>
  );
}

// ─── Sidebar Group ────────────────────────────────────────────────────────────

export function SidebarGroup({
  label,
  children,
  defaultOpen = false,
  icon,
  className,
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const id = useId();

  return (
    <div className={cn("flex flex-col mb-1", className)}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors w-full"
      >
        {icon && <span className="shrink-0 text-slate-500 dark:text-slate-400">{icon}</span>}
        <span className="flex-1 text-left font-medium">{label}</span>
        <MotionChevron
          size={16}
          strokeWidth={2.5}
          className="shrink-0 text-slate-400"
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
            style={{ overflow: "hidden" }}
          >
            <div className="flex flex-col pl-3 pt-1 space-y-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Sidebar Item ─────────────────────────────────────────────────────────────

export const SidebarItem = memo(function SidebarItem({
  href,
  label,
  isActive,
  icon: Icon,
  className,
  onClick,
}) {
  return (
    <a
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all",
        isActive
          ? "bg-blue-600 text-white font-semibold shadow-lg shadow-blue-600/20"
          : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800",
        className,
      )}
    >
      {Icon && (
        <Icon
          size={18}
          className={cn(
            "shrink-0",
            isActive ? "text-white" : "text-slate-500 dark:text-slate-400"
          )}
        />
      )}
      <span className="truncate">{label}</span>
    </a>
  );
});
