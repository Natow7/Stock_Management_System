import React, { useState, useRef, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./SidebarNew.jsx";
import Topbar from "./TopbarNew.jsx";
import ToastHost from "../ui/ToastHost.jsx";

export default function AppLayout() {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    return saved === "true";
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const SIDEBAR_WIDTH = 280;
  const COLLAPSED_WIDTH = 64;

  // Toggle collapse
  const toggleCollapse = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    localStorage.setItem("sidebarCollapsed", newCollapsed.toString());
  };

  return (
    <div className="app-shell flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Desktop Sidebar */}
      <aside
        className="hidden lg:flex flex-col bg-slate-100 dark:bg-slate-800 border-r border-slate-300 dark:border-slate-700 transition-all duration-300"
        style={{
          width: isCollapsed ? COLLAPSED_WIDTH : SIDEBAR_WIDTH,
        }}
      >
        <Sidebar 
          isCollapsed={isCollapsed}
          onToggleCollapse={toggleCollapse}
        />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 lg:hidden animate-fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-[280px] bg-slate-100 dark:bg-slate-800 lg:hidden shadow-2xl animate-slide-in">
            <Sidebar 
              isCollapsed={false}
              onToggleCollapse={() => {}}
              onNavigate={() => setMobileMenuOpen(false)}
            />
          </aside>
        </>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar 
          onMenuClick={() => setMobileMenuOpen(true)}
          sidebarCollapsed={isCollapsed}
        />
        
        <main className="flex-1 overflow-y-auto overflow-x-auto px-4 py-6 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950">
          <Outlet />
        </main>
      </div>

      <ToastHost />
    </div>
  );
}
