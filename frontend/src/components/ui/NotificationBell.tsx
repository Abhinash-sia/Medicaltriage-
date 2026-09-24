'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, Check, CheckCheck, RefreshCw, AlertCircle, Info, ArrowUpRight } from 'lucide-react';
import { Button } from './button';
import { Badge } from './badge';

interface NotificationItem {
  id: string;
  type: string;
  channel: string;
  title: string;
  body: string;
  status: 'PENDING' | 'SENT' | 'FAILED' | 'READ';
  readAt?: string | null;
  createdAt: string;
}

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const getApiUrl = () => process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';
  const getAuthHeader = (): Record<string, string> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch(`${getApiUrl()}/notifications/unread-count`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setUnreadCount(json.data.unreadCount || 0);
        }
      }
    } catch {
      // Best-effort polling
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${getApiUrl()}/notifications?limit=15`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setNotifications(json.data);
          if (typeof json.unreadCount === 'number') {
            setUnreadCount(json.unreadCount);
          }
        }
      } else {
        setError('Unable to load notifications');
      }
    } catch {
      setError('Network connection error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // 30s polling
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const res = await fetch(`${getApiUrl()}/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, status: 'READ' } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch {
      // Ignore
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/notifications/read-all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, status: 'READ' })));
        setUnreadCount(0);
      }
    } catch {
      // Ignore
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const d = new Date(dateString);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diffSec < 60) return 'just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="relative inline-block" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        aria-label={`Notifications (${unreadCount} unread)`}
        aria-expanded={isOpen}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[1.125rem] h-4.5 px-1 text-[10px] font-bold text-white bg-red-600 rounded-full ring-2 ring-white dark:ring-slate-900">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Notification Center"
          className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden flex flex-col max-h-[32rem]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-slate-800 dark:text-slate-100">
                Notifications
              </span>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  {unreadCount} unread
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleMarkAllAsRead}
                  className="text-xs h-7 px-2 text-slate-600 dark:text-slate-300 hover:text-blue-600"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5 mr-1" />
                  Mark all read
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={fetchNotifications}
                className="h-7 w-7 p-0 text-slate-500"
                aria-label="Refresh notifications"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* List Content */}
          <div className="overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading && notifications.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-400" />
                Loading operational notifications...
              </div>
            ) : error ? (
              <div className="p-6 text-center text-sm text-red-500 flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                <Info className="w-6 h-6 mx-auto mb-2 text-slate-400 opacity-60" />
                No notifications to display
              </div>
            ) : (
              notifications.map((n) => {
                const isUnread = n.status !== 'READ';
                return (
                  <div
                    key={n.id}
                    className={`p-3.5 transition-colors flex gap-3 ${
                      isUnread
                        ? 'bg-blue-50/40 dark:bg-blue-950/20'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="pt-0.5">
                      {n.type.includes('ESCALATED') || n.type.includes('OVERDUE') ? (
                        <div className="w-2 h-2 mt-1.5 rounded-full bg-red-500 ring-4 ring-red-100 dark:ring-red-950" />
                      ) : n.type.includes('DUE_SOON') ? (
                        <div className="w-2 h-2 mt-1.5 rounded-full bg-amber-500 ring-4 ring-amber-100 dark:ring-amber-950" />
                      ) : isUnread ? (
                        <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500 ring-4 ring-blue-100 dark:ring-blue-950" />
                      ) : (
                        <div className="w-2 h-2 mt-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1 mb-0.5">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {n.title}
                        </p>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap">
                          {formatTimeAgo(n.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {n.body}
                      </p>
                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100 dark:border-slate-800/50">
                        <span className="text-[10px] uppercase tracking-wider font-mono text-slate-400">
                          {n.type.replace(/_/g, ' ')}
                        </span>
                        {isUnread && (
                          <button
                            type="button"
                            onClick={() => handleMarkAsRead(n.id)}
                            className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1"
                          >
                            <Check className="w-3 h-3" />
                            Mark read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
