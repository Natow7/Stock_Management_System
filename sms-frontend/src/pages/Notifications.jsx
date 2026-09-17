import React, { useState, useEffect } from "react";
import {
  Bell,
  Filter,
  Search,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  Trash2,
  CheckCheck,
  Archive,
  Calendar,
  Tag,
  TrendingUp,
  Clock,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { cn } from "@/lib/utils";
import api from "../lib/api";

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { notifications, markNotificationRead, markAllNotificationsRead, refresh } = useApp();
  const [selectedFilter, setSelectedFilter] = useState('all'); // all, unread, action, priority
  const [selectedModule, setSelectedModule] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [moduleGroups, setModuleGroups] = useState([]);
  const [dateRange, setDateRange] = useState('all'); // all, today, week, month

  // Fetch statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const stats = await api.notifications.statistics();
        setStatistics(stats);
      } catch (error) {
        console.error('Failed to fetch notification statistics:', error);
      }
    };

    const fetchModuleGroups = async () => {
      try {
        const groups = await api.notifications.byModule();
        setModuleGroups(groups);
      } catch (error) {
        console.error('Failed to fetch module groups:', error);
      }
    };

    fetchStats();
    fetchModuleGroups();
  }, [notifications]);

  // Filter notifications
  const filteredNotifications = React.useMemo(() => {
    if (!notifications) return [];

    let filtered = notifications;

    // Filter by read/unread/action
    if (selectedFilter === 'unread') {
      filtered = filtered.filter(n => !n.readAt);
    } else if (selectedFilter === 'action') {
      filtered = filtered.filter(n => n.actionRequired && !n.readAt);
    } else if (selectedFilter === 'read') {
      filtered = filtered.filter(n => n.readAt);
    }

    // Filter by module
    if (selectedModule !== 'all') {
      filtered = filtered.filter(n => n.module === selectedModule);
    }

    // Filter by priority
    if (selectedPriority !== 'all') {
      filtered = filtered.filter(n => n.priority === selectedPriority);
    }

    // Filter by date range
    if (dateRange !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      if (dateRange === 'today') {
        filterDate.setHours(0, 0, 0, 0);
      } else if (dateRange === 'week') {
        filterDate.setDate(now.getDate() - 7);
      } else if (dateRange === 'month') {
        filterDate.setMonth(now.getMonth() - 1);
      }

      filtered = filtered.filter(n => new Date(n.createdAt) >= filterDate);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(n => 
        n.title?.toLowerCase().includes(query) ||
        n.message?.toLowerCase().includes(query) ||
        n.module?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [notifications, selectedFilter, selectedModule, selectedPriority, dateRange, searchQuery]);

  // Notification counts
  const unreadCount = notifications?.filter(n => !n.readAt).length || 0;
  const actionRequiredCount = notifications?.filter(n => n.actionRequired && !n.readAt).length || 0;
  const urgentCount = notifications?.filter(n => n.priority === 'urgent' && !n.readAt).length || 0;

  // Get notification style
  const getNotificationStyle = (notification) => {
    switch (notification.notificationType) {
      case 'success':
        return {
          icon: CheckCircle,
          bgColor: 'bg-green-50 dark:bg-green-900/10',
          borderColor: 'border-l-green-500',
          iconColor: 'text-green-500',
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          bgColor: 'bg-amber-50 dark:bg-amber-900/10',
          borderColor: 'border-l-amber-500',
          iconColor: 'text-amber-500',
        };
      case 'error':
        return {
          icon: AlertCircle,
          bgColor: 'bg-rose-50 dark:bg-rose-900/10',
          borderColor: 'border-l-rose-500',
          iconColor: 'text-rose-500',
        };
      default:
        return {
          icon: Info,
          bgColor: 'bg-blue-50 dark:bg-blue-900/10',
          borderColor: 'border-l-blue-500',
          iconColor: 'text-blue-500',
        };
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    if (!notification.readAt) {
      markNotificationRead(notification.id);
    }
    
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  // Handle select notification
  const handleSelectNotification = (notificationId) => {
    setSelectedNotifications(prev => {
      if (prev.includes(notificationId)) {
        return prev.filter(id => id !== notificationId);
      } else {
        return [...prev, notificationId];
      }
    });
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(filteredNotifications.map(n => n.id));
    }
  };

  // Handle bulk mark as read
  const handleBulkMarkAsRead = async () => {
    if (selectedNotifications.length === 0) return;

    try {
      await api.notifications.markMultipleRead(selectedNotifications);
      setSelectedNotifications([]);
      refresh('notifications');
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedNotifications.length === 0) return;

    if (!window.confirm(`Delete ${selectedNotifications.length} notification(s)?`)) {
      return;
    }

    try {
      await api.notifications.deleteMultiple(selectedNotifications);
      setSelectedNotifications([]);
      refresh('notifications');
    } catch (error) {
      console.error('Failed to delete notifications:', error);
    }
  };

  // Handle delete single notification
  const handleDeleteNotification = async (notificationId, e) => {
    e.stopPropagation();

    try {
      await api.notifications.deleteNotification(notificationId);
      refresh('notifications');
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold font-heading text-slate-900 dark:text-slate-100 flex items-center gap-3">
                <Bell className="h-8 w-8 text-blue-500" />
                Notifications
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Manage your notifications and stay up to date
              </p>
            </div>

            {/* Action Buttons */}
            {selectedNotifications.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {selectedNotifications.length} selected
                </span>
                <button
                  onClick={handleBulkMarkAsRead}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-colors"
                >
                  <CheckCheck className="h-4 w-4" />
                  Mark as Read
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            )}
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Total</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                    {notifications?.length || 0}
                  </p>
                </div>
                <Bell className="h-8 w-8 text-blue-500 opacity-50" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 p-4 rounded-xl border border-amber-200 dark:border-amber-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-300">Unread</p>
                  <p className="text-2xl font-bold text-amber-900 dark:text-amber-100 mt-1">
                    {unreadCount}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-amber-500 opacity-50" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-900/20 dark:to-rose-800/20 p-4 rounded-xl border border-rose-200 dark:border-rose-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-rose-700 dark:text-rose-300">Action Required</p>
                  <p className="text-2xl font-bold text-rose-900 dark:text-rose-100 mt-1">
                    {actionRequiredCount}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-rose-500 opacity-50" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-xl border border-purple-200 dark:border-purple-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Urgent</p>
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-100 mt-1">
                    {urgentCount}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500 opacity-50" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setSelectedFilter('all')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                selectedFilter === 'all'
                  ? "bg-blue-500 text-white shadow-lg"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              )}
            >
              All ({notifications?.length || 0})
            </button>
            <button
              onClick={() => setSelectedFilter('unread')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                selectedFilter === 'unread'
                  ? "bg-amber-500 text-white shadow-lg"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              )}
            >
              Unread ({unreadCount})
            </button>
            <button
              onClick={() => setSelectedFilter('action')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                selectedFilter === 'action'
                  ? "bg-rose-500 text-white shadow-lg"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              )}
            >
              Action Required ({actionRequiredCount})
            </button>
            <button
              onClick={() => setSelectedFilter('read')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                selectedFilter === 'read'
                  ? "bg-green-500 text-white shadow-lg"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              )}
            >
              Read
            </button>

            {/* Advanced Filters Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-sm font-semibold transition-all"
            >
              <Filter className="h-4 w-4" />
              {showFilters ? 'Hide' : 'Show'} Filters
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              {/* Module Filter */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  <Tag className="inline h-4 w-4 mr-1" />
                  Module
                </label>
                <select
                  value={selectedModule}
                  onChange={(e) => setSelectedModule(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                >
                  <option value="all">All Modules</option>
                  {moduleGroups.map(group => (
                    <option key={group.module} value={group.module}>
                      {group.module} ({group.unread_count > 0 ? group.unread_count : group.count})
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority Filter */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  <TrendingUp className="inline h-4 w-4 mr-1" />
                  Priority
                </label>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                >
                  <option value="all">All Priorities</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="normal">Normal</option>
                  <option value="low">Low</option>
                </select>
              </div>

              {/* Date Range Filter */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Date Range
                </label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                </select>
              </div>
            </div>
          )}

          {/* Bulk Actions Bar */}
          {filteredNotifications.length > 0 && (
            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <input
                type="checkbox"
                checked={selectedNotifications.length === filteredNotifications.length}
                onChange={handleSelectAll}
                className="h-4 w-4 rounded border-slate-300 text-blue-500 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Select All
              </span>

              {unreadCount > 0 && (
                <button
                  onClick={() => markAllNotificationsRead()}
                  className="ml-auto text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold"
                >
                  Mark all as read
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {filteredNotifications.length > 0 ? (
          <div className="space-y-2">
            {filteredNotifications.map((notification) => {
              const style = getNotificationStyle(notification);
              const Icon = style.icon;
              const isUnread = !notification.readAt;
              const isSelected = selectedNotifications.includes(notification.id);

              return (
                <div
                  key={notification.id}
                  className={cn(
                    "bg-white dark:bg-slate-900 rounded-xl border-l-4 border border-slate-200 dark:border-slate-800 p-4 transition-all hover:shadow-lg cursor-pointer group",
                    isUnread && style.bgColor,
                    style.borderColor,
                    isSelected && "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-950"
                  )}
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleSelectNotification(notification.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-500 focus:ring-blue-500"
                    />

                    {/* Icon */}
                    <div
                      onClick={() => handleNotificationClick(notification)}
                      className="flex-1 flex items-start gap-4"
                    >
                      <div className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-xl flex-shrink-0",
                        isUnread ? style.bgColor : 'bg-slate-100 dark:bg-slate-800'
                      )}>
                        <Icon className={cn("h-6 w-6", style.iconColor)} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Title */}
                        {notification.title && (
                          <h3 className={cn(
                            "text-base font-semibold text-slate-900 dark:text-slate-100 mb-1",
                            isUnread && "font-bold"
                          )}>
                            {notification.title}
                          </h3>
                        )}

                        {/* Message */}
                        <p className={cn(
                          "text-sm text-slate-700 dark:text-slate-300",
                          !notification.title && isUnread && "font-semibold"
                        )}>
                          {notification.message}
                        </p>

                        {/* Meta Info */}
                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                          {/* Module */}
                          {notification.module && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300">
                              {notification.module}
                            </span>
                          )}

                          {/* Priority */}
                          {notification.priority && notification.priority !== 'normal' && (
                            <span className={cn(
                              "inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold",
                              notification.priority === 'urgent' && "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300",
                              notification.priority === 'high' && "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
                              notification.priority === 'low' && "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                            )}>
                              {notification.priority.toUpperCase()}
                            </span>
                          )}

                          {/* Action Required */}
                          {notification.actionRequired && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold">
                              <AlertCircle className="h-3 w-3" />
                              Action Required
                            </span>
                          )}

                          {/* Timestamp */}
                          <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                            <Clock className="h-3 w-3" />
                            {new Date(notification.createdAt).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isUnread && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markNotificationRead(notification.id);
                            }}
                            className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition-colors"
                            title="Mark as read"
                          >
                            <CheckCircle className="h-5 w-5" />
                          </button>
                        )}
                        <button
                          onClick={(e) => handleDeleteNotification(notification.id, e)}
                          className="p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-600 dark:text-rose-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>

                      {/* Unread Indicator */}
                      {isUnread && (
                        <div className="flex-shrink-0 mt-1">
                          <div className="h-3 w-3 rounded-full bg-blue-500 ring-2 ring-blue-100 dark:ring-blue-900/30"></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-16 text-center">
            <Bell className="h-24 w-24 mx-auto text-slate-300 dark:text-slate-700 mb-4" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              No notifications found
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              {searchQuery
                ? `No notifications match "${searchQuery}"`
                : selectedFilter === 'unread'
                ? "You're all caught up!"
                : selectedFilter === 'action'
                ? "No pending actions"
                : "Try adjusting your filters"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
