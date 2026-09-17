import React, { useState, useEffect, useRef } from "react";
import {
  Menu,
  Bell,
  Sun,
  Moon,
  User,
  Settings,
  LogOut,
  Search,
  ChevronDown,
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  X,
  Filter,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext.jsx";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getNotificationLink } from "../../utils/notificationLinks.js";

export default function Topbar({ onMenuClick, sidebarCollapsed }) {
  const { currentUser, logout } = useApp();
  const navigate = useNavigate();
  const userMenuRef = useRef(null);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved === "true";
  });
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationFilter, setNotificationFilter] = useState('all'); // all, unread, action
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const [lastNotificationCount, setLastNotificationCount] = useState(0);
  const { notifications, markNotificationRead, markAllNotificationsRead, refresh } = useApp();
  
  // Get notification counts
  const unreadNotifications = notifications?.filter(n => !n.readAt) || [];
  const unreadCount = unreadNotifications.length;
  const actionRequiredNotifications = unreadNotifications.filter(n => n.actionRequired);
  const urgentNotifications = unreadNotifications.filter(n => n.priority === 'urgent');

  // Auto-refresh notifications every 30 seconds
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      if (!document.hidden) {
        refresh('notifications');
      }
    }, 30000); // 30 seconds

    return () => clearInterval(refreshInterval);
  }, [refresh]);

  // Detect new notifications and play alert
  useEffect(() => {
    if (unreadCount > lastNotificationCount && lastNotificationCount > 0) {
      setHasNewNotification(true);
      
      // Play notification sound (optional - can be enabled/disabled in settings)
      // const audio = new Audio('/notification.mp3');
      // audio.play().catch(() => {}); // Catch error if autoplay is blocked
      
      // Clear animation after 3 seconds
      setTimeout(() => setHasNewNotification(false), 3000);
    }
    setLastNotificationCount(unreadCount);
  }, [unreadCount, lastNotificationCount]);

  // Filter notifications based on selected filter
  const filteredNotifications = React.useMemo(() => {
    if (!notifications) return [];
    
    switch (notificationFilter) {
      case 'unread':
        return unreadNotifications;
      case 'action':
        return actionRequiredNotifications;
      default:
        return notifications;
    }
  }, [notifications, notificationFilter, unreadNotifications, actionRequiredNotifications]);

  // Apply dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("darkMode", darkMode.toString());
  }, [darkMode]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [userMenuOpen]);

  // Close dropdown on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        setUserMenuOpen(false);
        setNotificationsOpen(false);
      }
    };
    
    if (userMenuOpen || notificationsOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [userMenuOpen, notificationsOpen]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Get user initials
  const getUserInitials = () => {
    if (!currentUser?.name) return "U";
    const parts = currentUser.name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return currentUser.name[0].toUpperCase();
  };

  // Get role badge color
  const getRoleBadgeColor = () => {
    const role = currentUser?.role?.toLowerCase();
    if (role?.includes("admin")) return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
    if (role?.includes("pao")) return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    if (role?.includes("store")) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
    if (role?.includes("security")) return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
    return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400";
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 sm:px-6 lg:px-8 shadow-sm">
      {/* Mobile Menu Button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden rounded-xl p-2.5 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 shadow-sm"
        aria-label="Open menu"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Search Bar - Enhanced */}
      <div className="hidden sm:flex flex-1 max-w-2xl">
        <div className="relative w-full group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="search"
            placeholder="Search items, requisitions, assets..."
            className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 pl-11 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/10 transition-all duration-200 shadow-sm hover:shadow-md"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex flex-1 items-center justify-end gap-2">
        {/* Dark Mode Toggle - Enhanced */}
        <button
          onClick={toggleDarkMode}
          className="relative rounded-xl p-2.5 text-slate-600 hover:bg-gradient-to-br hover:from-amber-50 hover:to-amber-100 dark:hover:from-blue-900/30 dark:hover:to-blue-800/30 dark:text-slate-400 transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 shadow-sm group"
          aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {darkMode ? (
            <Sun className="h-5 w-5 group-hover:rotate-180 transition-transform duration-500" />
          ) : (
            <Moon className="h-5 w-5 group-hover:-rotate-12 transition-transform duration-300" />
          )}
        </button>

        {/* Notifications - Enhanced */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className={cn(
              "relative rounded-xl p-2.5 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 shadow-sm group",
              hasNewNotification && "animate-bounce"
            )}
            aria-label="Notifications"
          >
            <Bell className={cn(
              "h-5 w-5 group-hover:rotate-12 group-hover:scale-110 transition-transform duration-200",
              hasNewNotification && "text-rose-500"
            )} />
            {unreadCount > 0 && (
              <>
                <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-rose-600 text-xs font-bold text-white shadow-lg ring-2 ring-white dark:ring-slate-900">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
                {hasNewNotification && (
                  <span className="absolute top-1 right-1 h-5 w-5 rounded-full bg-rose-500 animate-ping opacity-75"></span>
                )}
              </>
            )}
            {urgentNotifications.length > 0 && (
              <span className="absolute -top-1 -left-1 flex h-4 w-4 items-center justify-center">
                <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75 animate-ping"></span>
                <AlertCircle className="relative h-4 w-4 text-amber-500 fill-amber-500" />
              </span>
            )}
          </button>

          {/* Notification Dropdown - Enhanced */}
          {notificationsOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setNotificationsOpen(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-[420px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl z-50 animate-fade-in max-h-[600px] flex flex-col">
                {/* Header with Stats */}
                <div className="border-b border-slate-200 dark:border-slate-700 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold font-heading text-lg text-slate-900 dark:text-slate-100">
                      Notifications
                    </h3>
                    <button
                      onClick={() => setNotificationsOpen(false)}
                      className="rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <X className="h-4 w-4 text-slate-500" />
                    </button>
                  </div>

                  {/* Stats Row */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-semibold">
                      <Bell className="h-3.5 w-3.5" />
                      {unreadCount} unread
                    </div>
                    {actionRequiredNotifications.length > 0 && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-xs font-semibold">
                        <AlertCircle className="h-3.5 w-3.5" />
                        {actionRequiredNotifications.length} action
                      </div>
                    )}
                    {urgentNotifications.length > 0 && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        {urgentNotifications.length} urgent
                      </div>
                    )}
                  </div>

                  {/* Filter Tabs */}
                  <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <button
                      onClick={() => setNotificationFilter('all')}
                      className={cn(
                        "flex-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-all",
                        notificationFilter === 'all'
                          ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                      )}
                    >
                      All ({notifications?.length || 0})
                    </button>
                    <button
                      onClick={() => setNotificationFilter('unread')}
                      className={cn(
                        "flex-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-all",
                        notificationFilter === 'unread'
                          ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                      )}
                    >
                      Unread ({unreadCount})
                    </button>
                    <button
                      onClick={() => setNotificationFilter('action')}
                      className={cn(
                        "flex-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-all",
                        notificationFilter === 'action'
                          ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                      )}
                    >
                      Action ({actionRequiredNotifications.length})
                    </button>
                  </div>

                  {/* Mark all as read button */}
                  {unreadCount > 0 && (
                    <button
                      onClick={() => {
                        markAllNotificationsRead();
                      }}
                      className="w-full mt-2 text-xs text-accent hover:text-accent/80 font-semibold text-center py-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                {/* Notification List */}
                <div className="overflow-y-auto flex-1">
                  {filteredNotifications && filteredNotifications.length > 0 ? (
                    filteredNotifications.map((notification) => {
                      const link = notification.actionUrl || getNotificationLink(notification);
                      const isUnread = !notification.readAt;
                      
                      // Get notification icon and color based on type
                      const getNotificationStyle = () => {
                        switch (notification.notificationType) {
                          case 'success':
                            return {
                              icon: CheckCircle,
                              bgColor: 'bg-green-50 dark:bg-green-900/10',
                              iconColor: 'text-green-500',
                              borderColor: 'border-l-green-500',
                            };
                          case 'warning':
                            return {
                              icon: AlertTriangle,
                              bgColor: 'bg-amber-50 dark:bg-amber-900/10',
                              iconColor: 'text-amber-500',
                              borderColor: 'border-l-amber-500',
                            };
                          case 'error':
                            return {
                              icon: AlertCircle,
                              bgColor: 'bg-rose-50 dark:bg-rose-900/10',
                              iconColor: 'text-rose-500',
                              borderColor: 'border-l-rose-500',
                            };
                          default:
                            return {
                              icon: Info,
                              bgColor: 'bg-blue-50 dark:bg-blue-900/10',
                              iconColor: 'text-blue-500',
                              borderColor: 'border-l-blue-500',
                            };
                        }
                      };

                      const style = getNotificationStyle();
                      const Icon = style.icon;

                      return (
                        <div
                          key={notification.id}
                          onClick={() => {
                            if (isUnread) {
                              markNotificationRead(notification.id);
                            }
                            if (link) {
                              navigate(link);
                              setNotificationsOpen(false);
                            }
                          }}
                          className={cn(
                            "p-4 border-b border-l-4 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer group",
                            isUnread && style.bgColor,
                            style.borderColor
                          )}
                        >
                          <div className="flex items-start gap-3">
                            {/* Icon */}
                            <div className={cn(
                              "flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0",
                              isUnread ? style.bgColor : 'bg-slate-100 dark:bg-slate-800'
                            )}>
                              <Icon className={cn("h-5 w-5", style.iconColor)} />
                            </div>

                            <div className="flex-1 min-w-0">
                              {/* Title */}
                              {notification.title && (
                                <p className={cn(
                                  "text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1",
                                  isUnread && "font-bold"
                                )}>
                                  {notification.title}
                                </p>
                              )}
                              
                              {/* Message */}
                              <p className={cn(
                                "text-sm text-slate-700 dark:text-slate-300",
                                !notification.title && isUnread && "font-semibold"
                              )}>
                                {notification.message}
                              </p>

                              {/* Meta info */}
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                {/* Module badge */}
                                {notification.module && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-400">
                                    {notification.module}
                                  </span>
                                )}

                                {/* Priority badge */}
                                {notification.priority && notification.priority !== 'normal' && (
                                  <span className={cn(
                                    "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold",
                                    notification.priority === 'urgent' && "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300",
                                    notification.priority === 'high' && "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
                                    notification.priority === 'low' && "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                                  )}>
                                    {notification.priority.toUpperCase()}
                                  </span>
                                )}

                                {/* Action required badge */}
                                {notification.actionRequired && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold">
                                    <AlertCircle className="h-3 w-3" />
                                    Action Required
                                  </span>
                                )}

                                {/* Timestamp */}
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                  {new Date(notification.createdAt).toLocaleString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                            </div>

                            {/* Unread indicator */}
                            {isUnread && (
                              <div className="flex-shrink-0">
                                <div className="h-2.5 w-2.5 rounded-full bg-blue-500 ring-2 ring-blue-100 dark:ring-blue-900/30"></div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-12 text-center text-slate-500 dark:text-slate-400">
                      <Bell className="h-16 w-16 mx-auto mb-4 opacity-30" />
                      <p className="text-base font-medium mb-1">No notifications</p>
                      <p className="text-sm">
                        {notificationFilter === 'unread' && "You're all caught up!"}
                        {notificationFilter === 'action' && "No pending actions"}
                        {notificationFilter === 'all' && "You'll see notifications here"}
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer - View All */}
                {filteredNotifications && filteredNotifications.length > 0 && (
                  <div className="border-t border-slate-200 dark:border-slate-700 p-2">
                    <button
                      onClick={() => {
                        navigate('/notifications');
                        setNotificationsOpen(false);
                      }}
                      className="w-full py-2 text-sm font-semibold text-accent hover:text-accent/80 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    >
                      View all notifications
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* User Menu - Enhanced */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setUserMenuOpen(!userMenuOpen);
            }}
            className="flex items-center gap-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 px-3 py-2 hover:border-university-300 dark:hover:border-university-600 hover:shadow-lg transition-all duration-200 cursor-pointer group"
          >
            <div className="relative">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-university-600 to-university-700 dark:from-university-700 dark:to-university-800 text-sm font-bold font-heading text-white shadow-md group-hover:scale-110 transition-transform duration-200">
                {getUserInitials()}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-success-500 border-2 border-white dark:border-slate-900 shadow-sm"></div>
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-semibold font-heading text-slate-900 dark:text-slate-100 group-hover:text-university-600 dark:group-hover:text-university-400 transition-colors">
                {currentUser?.name || "User"}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {currentUser?.role || "Role"}
              </p>
            </div>
            <ChevronDown className={cn(
              "h-4 w-4 text-slate-500 transition-all duration-300",
              userMenuOpen && "rotate-180 text-university-500"
            )} />
          </button>

          {/* User Dropdown - Advanced & Professional */}
          {userMenuOpen && (
            <div 
              className="absolute right-0 top-full mt-2 w-72 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl z-50 overflow-hidden"
            >
                {/* Compact Header with Gradient */}
                <div className="relative border-b border-slate-200 dark:border-slate-700 p-3 bg-gradient-to-br from-university-50 to-blue-50 dark:from-university-950/30 dark:to-blue-950/30">
                  {/* Decorative gradient overlay */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-university-400/20 to-blue-400/20 blur-2xl rounded-full"></div>
                  
                  <div className="relative flex items-center gap-3">
                    {/* Compact Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="absolute inset-0 bg-gradient-to-br from-university-500 to-blue-500 rounded-xl blur-sm opacity-40"></div>
                      <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-university-600 to-university-700 dark:from-university-700 dark:to-university-800 text-lg font-bold font-heading text-white shadow-lg ring-2 ring-white dark:ring-slate-900">
                        {getUserInitials()}
                      </div>
                      {/* Verified badge - smaller */}
                      <div className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-500 shadow-md ring-2 ring-white dark:ring-slate-900">
                        <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                        </svg>
                      </div>
                      {/* Online status - smaller */}
                      <div className="absolute top-0 right-0 h-3 w-3 rounded-full bg-success-500 border-2 border-white dark:border-slate-900 shadow-sm">
                        <span className="absolute inset-0 rounded-full bg-success-500 animate-ping opacity-75"></span>
                      </div>
                    </div>
                    
                    {/* Compact User Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold font-heading text-sm text-slate-900 dark:text-slate-100 truncate">
                        {currentUser?.name || "User"}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                        {currentUser?.email || "email@university.edu"}
                      </p>
                      
                      {/* Compact Role Badge */}
                      <span className={cn(
                        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold mt-1",
                        getRoleBadgeColor()
                      )}>
                        <span className="h-1 w-1 rounded-full bg-current"></span>
                        {currentUser?.role || "Role"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Compact Menu Items */}
                <div className="p-1.5">
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      navigate("/profile");
                    }}
                    className="group flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-gradient-to-r hover:from-university-50 hover:to-blue-50 dark:hover:from-university-900/20 dark:hover:to-blue-900/20 transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-university-100 dark:group-hover:bg-university-900/30 transition-colors">
                      <User className="h-4 w-4 group-hover:scale-110 transition-transform" />
                    </div>
                    <span className="flex-1 text-left">My Profile</span>
                    <svg className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      navigate("/system-settings");
                    }}
                    className="group flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                      <Settings className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
                    </div>
                    <span className="flex-1 text-left">Settings</span>
                    <svg className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                {/* Compact Logout Section */}
                <div className="border-t border-slate-200 dark:border-slate-700 p-1.5 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
                  <button
                    onClick={handleLogout}
                    className="group flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-gradient-to-r hover:from-rose-50 hover:to-red-50 dark:hover:from-rose-900/20 dark:hover:to-red-900/20 transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-900/20 group-hover:bg-rose-200 dark:group-hover:bg-rose-900/40 transition-colors">
                      <LogOut className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <span className="flex-1 text-left">Sign Out</span>
                    <svg className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" />
                    </svg>
                  </button>
                </div>
              </div>
          )}
        </div>
      </div>
    </header>
  );
}
