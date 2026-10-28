"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { NotificationItem } from "@/types";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from "@/lib/api";

export default function NotificationCentrePage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  const [unreadOnly, setUnreadOnly] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/notifications");
    }
  }, [user, authLoading, router]);

  const loadNotifications = useCallback(
    async (pageToLoad = currentPage, filterUnread = unreadOnly) => {
      setIsLoading(true);
      setError(null);
      const { data, error: err } = await fetchNotifications({
        unread_only: filterUnread ? true : undefined,
        page: pageToLoad,
        page_size: 15,
      });

      if (err || !data) {
        setError(err || "Failed to load notifications.");
      } else {
        setNotifications(data.items);
        setUnreadCount(data.unread_count);
        setTotalCount(data.total);
        setCurrentPage(data.page);
        setTotalPages(data.total_pages);
      }
      setIsLoading(false);
    },
    [currentPage, unreadOnly]
  );

  useEffect(() => {
    if (user) {
      loadNotifications(currentPage, unreadOnly);
    }
  }, [user, currentPage, unreadOnly, loadNotifications]);

  const handleMarkAsRead = async (item: NotificationItem) => {
    if (item.is_read) return;
    const { success, notification: updated } = await markNotificationRead(item.id);
    if (success && updated) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, is_read: true, read_at: updated.read_at } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  const handleMarkAllAsRead = async () => {
    const { success, marked_count } = await markAllNotificationsRead();
    if (success) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      setActionNotice(`Marked ${marked_count} notification${marked_count === 1 ? "" : "s"} as read.`);
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  const handleDelete = async (item: NotificationItem) => {
    const { success } = await deleteNotification(item.id);
    if (success) {
      setNotifications((prev) => prev.filter((n) => n.id !== item.id));
      if (!item.is_read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      setTotalCount((prev) => Math.max(0, prev - 1));
    }
  };

  const formatTimestamp = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "order_created":
        return (
          <div className="w-10 h-10 rounded-xl bg-forest-100 text-forest-800 flex items-center justify-center flex-shrink-0 border border-forest-200">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
        );
      case "order_accepted":
      case "order_completed":
      case "product_approved":
        return (
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0 border border-emerald-200">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case "order_ready":
        return (
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0 border border-amber-200">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case "order_cancelled":
      case "order_rejected":
      case "product_rejected":
        return (
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center flex-shrink-0 border border-rose-200">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-xl bg-ivory-200 text-forest-700 flex items-center justify-center flex-shrink-0 border border-ivory-300">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  const getTargetOrderUrl = (orderId: number) => {
    if (user?.role === "farmer") {
      return `/farmer/dashboard`;
    }
    if (user?.role === "admin") {
      return `/admin/orders`;
    }
    return `/buyer/orders/${orderId}`;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-ivory-50 flex flex-col justify-between">
        <Navbar />
        <Container size="xl" className="py-24 text-center">
          <div className="w-12 h-12 border-4 border-forest-200 border-t-forest-800 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-medium text-forest-700">Checking credentials...</p>
        </Container>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory-50 flex flex-col justify-between text-forest-950 font-sans">
      <div>
        <Navbar />

        <main className="py-10">
          <Container size="lg" className="max-w-4xl">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ivory-200 pb-6 mb-8">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl sm:text-3xl font-bold font-serif text-forest-950 tracking-tight">
                    Notification Centre
                  </h1>
                  {unreadCount > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full bg-terracotta-100 text-terracotta-800 text-xs font-mono font-bold border border-terracotta-300">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-forest-700 mt-1">
                  Real-time updates regarding your agricultural orders, fulfillment milestones, and catalog compliance.
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-forest-800 hover:bg-forest-900 text-ivory-50 transition-colors shadow-subtle whitespace-nowrap"
                  >
                    Mark All Read
                  </button>
                )}
                <button
                  onClick={() => loadNotifications(currentPage, unreadOnly)}
                  disabled={isLoading}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-ivory-100 hover:bg-ivory-200 text-forest-800 border border-ivory-300 transition-colors flex items-center gap-1.5"
                  title="Refresh notifications"
                >
                  <svg className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Notification notice */}
            {actionNotice && (
              <div className="mb-6 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between">
                <span>{actionNotice}</span>
                <button onClick={() => setActionNotice(null)} className="font-bold underline ml-2">Dismiss</button>
              </div>
            )}

            {/* Filter pills */}
            <div className="flex items-center gap-2 mb-6">
              <button
                onClick={() => setUnreadOnly(false)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  !unreadOnly
                    ? "bg-forest-800 text-ivory-50 shadow-subtle"
                    : "bg-ivory-100 text-forest-800 hover:bg-ivory-200 border border-ivory-200"
                }`}
              >
                All Notifications ({totalCount})
              </button>
              <button
                onClick={() => setUnreadOnly(true)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  unreadOnly
                    ? "bg-forest-800 text-ivory-50 shadow-subtle"
                    : "bg-ivory-100 text-forest-800 hover:bg-ivory-200 border border-ivory-200"
                }`}
              >
                <span>Unread Only</span>
                {unreadCount > 0 && (
                  <span className={`w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center ${
                    unreadOnly ? "bg-ivory-50 text-forest-900" : "bg-terracotta-600 text-ivory-50"
                  }`}>
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>

            {/* Error banner */}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
                <span>{error}</span>
                <button onClick={() => loadNotifications(currentPage, unreadOnly)} className="font-semibold underline">Retry</button>
              </div>
            )}

            {/* Notifications Feed */}
            {isLoading ? (
              <div className="py-20 text-center">
                <div className="w-8 h-8 border-2 border-forest-200 border-t-forest-800 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs text-forest-700 font-medium">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="bg-white rounded-2xl border border-ivory-200 p-12 text-center shadow-subtle">
                <div className="w-14 h-14 rounded-2xl bg-ivory-100 text-forest-600 flex items-center justify-center mx-auto mb-4 border border-ivory-200">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <h3 className="font-serif font-bold text-base text-forest-950 mb-1">
                  {unreadOnly ? "No unread notifications" : "No notifications yet"}
                </h3>
                <p className="text-xs text-forest-600 max-w-sm mx-auto mb-6">
                  {unreadOnly
                    ? "You are completely caught up! All updates have been acknowledged."
                    : "When orders are placed, accepted, dispatched, or completed, real-time alerts will appear right here."}
                </p>
                <Link
                  href="/marketplace"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-forest-800 text-ivory-50 hover:bg-forest-900 transition-colors shadow-subtle"
                >
                  Explore Marketplace &rarr;
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((item) => {
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleMarkAsRead(item)}
                      className={`p-4 rounded-xl border transition-all ${
                        item.is_read
                          ? "bg-white border-ivory-200 hover:border-ivory-300"
                          : "bg-ivory-100/70 border-terracotta-200/80 shadow-subtle hover:bg-ivory-100"
                      } flex items-start justify-between gap-4 cursor-pointer`}
                    >
                      <div className="flex items-start gap-3.5">
                        {getNotificationIcon(item.type)}
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-forest-950 font-serif">
                              {item.title}
                            </h4>
                            {!item.is_read && (
                              <span className="w-2 h-2 rounded-full bg-terracotta-600 flex-shrink-0" title="Unread" />
                            )}
                          </div>
                          <p className="text-xs text-forest-800 mt-1 leading-relaxed">
                            {item.message}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-[11px] text-forest-600 font-mono">
                            <span>{formatTimestamp(item.created_at)}</span>
                            {item.order_id && (
                              <span className="px-1.5 py-0.2 rounded bg-ivory-200 text-forest-800 font-semibold">
                                Order #{item.order_id}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right actions */}
                      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 flex-shrink-0">
                        {item.order_id && (
                          <Link
                            href={getTargetOrderUrl(item.order_id)}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(item);
                            }}
                            className="px-2.5 py-1 rounded text-xs font-semibold bg-forest-800 text-ivory-50 hover:bg-forest-900 transition-colors whitespace-nowrap shadow-subtle"
                          >
                            View Order &rarr;
                          </Link>
                        )}
                        {!item.is_read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(item);
                            }}
                            className="px-2 py-1 rounded text-xs font-medium text-forest-700 hover:text-forest-950 hover:bg-ivory-200 transition-colors"
                            title="Mark as read"
                          >
                            Mark Read
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(item);
                          }}
                          className="p-1 rounded text-forest-400 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                          title="Remove notification"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-between border-t border-ivory-200 pt-4 text-xs font-mono">
                <button
                  disabled={currentPage <= 1 || isLoading}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-ivory-300 bg-white text-forest-800 hover:bg-ivory-100 disabled:opacity-40 transition-colors"
                >
                  &larr; Previous
                </button>
                <span className="text-forest-600">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  disabled={currentPage >= totalPages || isLoading}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 rounded-lg border border-ivory-300 bg-white text-forest-800 hover:bg-ivory-100 disabled:opacity-40 transition-colors"
                >
                  Next &rarr;
                </button>
              </div>
            )}
          </Container>
        </main>
      </div>

      <Footer />
    </div>
  );
}
