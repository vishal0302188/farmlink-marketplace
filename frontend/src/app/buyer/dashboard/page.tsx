"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { ProduceCard } from "@/components/marketplace/ProduceCard";
import {
  fetchBuyerOrders,
  fetchNotifications,
  markAllNotificationsRead,
  fetchProductsFromBackend,
} from "@/lib/api";
import { ApiOrder, NotificationItem, ProduceItem, OrderStatusType, BuyerCategory } from "@/types";

export default function BuyerDashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { totalItems, totalAmount } = useCart();

  // Search input state
  const [searchQuery, setSearchQuery] = useState("");

  // Data states
  const [recentOrders, setRecentOrders] = useState<ApiOrder[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState<number>(0);
  const [suggestedProducts, setSuggestedProducts] = useState<ProduceItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Authentication & Cross-Role Protection
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login?redirect=/buyer/dashboard");
      } else if (user.role === "farmer") {
        router.push("/farmer/dashboard");
      } else if (user.role === "admin") {
        router.push("/admin");
      }
    }
  }, [user, authLoading, router]);

  const loadDashboardData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const [ordersRes, notifsRes, prodsRes] = await Promise.all([
        fetchBuyerOrders(),
        fetchNotifications({ page_size: 5 }),
        fetchProductsFromBackend({ limit: 4 }),
      ]);

      if (ordersRes.orders) {
        setRecentOrders(ordersRes.orders.slice(0, 5));
      }
      if (notifsRes.data) {
        setNotifications(notifsRes.data.items);
        setUnreadNotificationCount(notifsRes.data.unread_count);
      }
      if (prodsRes.items) {
        setSuggestedProducts(prodsRes.items.slice(0, 4));
      }
    } catch (err) {
      console.error("Failed to load buyer dashboard data:", err);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (user && user.role === "buyer") {
      loadDashboardData();
    }
  }, [user, loadDashboardData]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/marketplace?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/marketplace");
    }
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    setUnreadNotificationCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const getStatusBadge = (status: OrderStatusType) => {
    switch (status) {
      case "pending":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-200">Pending Review</span>;
      case "confirmed":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-900 border border-blue-200">Confirmed by Farm</span>;
      case "ready":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-900 border border-indigo-200">Harvest Packed</span>;
      case "dispatched":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-900 border border-purple-200">In Transit</span>;
      case "delivered":
      case "completed":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-200">Delivered</span>;
      case "cancelled":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200">Cancelled</span>;
      case "rejected":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">Declined by Farm</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-ivory-200 text-forest-800">{status}</span>;
    }
  };

  const activeOrdersCount = recentOrders.filter(
    (o) => o.status === "pending" || o.status === "confirmed" || o.status === "ready" || o.status === "dispatched"
  ).length;

  const categories = [
    { id: "vegetables", label: "Vegetables" },
    { id: "fruits", label: "Fruits" },
    { id: "grains_pulses", label: "Grains & Pulses" },
    { id: "dairy", label: "Dairy & Eggs" },
    { id: "pulses", label: "Pulses" },
    { id: "specialty", label: "Specialty / Other" },
  ];

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="min-h-screen flex flex-col bg-ivory-50 text-forest-950">
        <Navbar />
        <main className="flex-1 py-20 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-forest-800 border-t-transparent rounded-full animate-spin" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-ivory-50 text-forest-950">
      <Navbar />

      <main className="flex-1 py-10">
        <Container size="xl" className="space-y-8">
          {/* Welcome & Account Header */}
          <div className="bg-white border border-ivory-200 rounded-2xl p-6 sm:p-8 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-100 text-forest-900 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-forest-600" />
                Buyer Procurement Portal
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-forest-950">
                Welcome back, {user?.fullName || "Procurement Manager"}!
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-xs text-forest-700/80 font-mono">
                <span className="capitalize px-2.5 py-0.5 rounded bg-ivory-100 text-forest-900 font-semibold border border-ivory-300">
                  {user?.buyerType ? `${user.buyerType} Category` : "Household Buyer"}
                </span>
                <span>&bull;</span>
                <span>{user?.email}</span>
                {user?.location && (
                  <>
                    <span>&bull;</span>
                    <span>{user.location}</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link href="/cart">
                <Button variant="outline" size="sm" className="relative flex items-center gap-2">
                  <svg className="w-4 h-4 text-forest-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <span>Cart</span>
                  {totalItems > 0 && (
                    <span className="w-5 h-5 rounded-full bg-forest-800 text-ivory-50 text-[10px] font-bold flex items-center justify-center">
                      {totalItems}
                    </span>
                  )}
                </Button>
              </Link>

              <Link href="/buyer/orders">
                <Button variant="secondary" size="sm">
                  Order History
                </Button>
              </Link>

              <Link href="/marketplace">
                <Button variant="primary" size="sm">
                  Explore Marketplace &rarr;
                </Button>
              </Link>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/cart"
              className="bg-white border border-ivory-200 rounded-xl p-5 shadow-subtle hover:border-forest-300 transition-colors flex items-center justify-between"
            >
              <div>
                <span className="text-xs font-mono uppercase text-forest-600 block">Procurement Cart</span>
                <span className="text-2xl font-bold font-serif text-forest-950 mt-1 block">
                  {totalItems} {totalItems === 1 ? "Lot" : "Lots"}
                </span>
                <span className="text-xs text-forest-700/80">₹{totalAmount.toFixed(2)} value</span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-forest-50 text-forest-800 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
            </Link>

            <Link
              href="/buyer/orders"
              className="bg-white border border-ivory-200 rounded-xl p-5 shadow-subtle hover:border-forest-300 transition-colors flex items-center justify-between"
            >
              <div>
                <span className="text-xs font-mono uppercase text-forest-600 block">Active Orders</span>
                <span className="text-2xl font-bold font-serif text-forest-950 mt-1 block">
                  {activeOrdersCount}
                </span>
                <span className="text-xs text-forest-700/80">In farm prep or transit</span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-800 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </Link>

            <Link
              href="/buyer/orders"
              className="bg-white border border-ivory-200 rounded-xl p-5 shadow-subtle hover:border-forest-300 transition-colors flex items-center justify-between"
            >
              <div>
                <span className="text-xs font-mono uppercase text-forest-600 block">Completed Orders</span>
                <span className="text-2xl font-bold font-serif text-forest-950 mt-1 block">
                  {recentOrders.filter((o) => o.status === "completed" || o.status === "delivered").length}
                </span>
                <span className="text-xs text-forest-700/80">Delivered successfully</span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </Link>

            <Link
              href="/notifications"
              className="bg-white border border-ivory-200 rounded-xl p-5 shadow-subtle hover:border-forest-300 transition-colors flex items-center justify-between"
            >
              <div>
                <span className="text-xs font-mono uppercase text-forest-600 block">Notifications</span>
                <span className="text-2xl font-bold font-serif text-forest-950 mt-1 block">
                  {unreadNotificationCount}
                </span>
                <span className="text-xs text-forest-700/80">Unread updates</span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
            </Link>
          </div>

          {/* Product Discovery, Search & Category Navigation */}
          <div className="bg-white border border-ivory-200 rounded-2xl p-6 sm:p-8 shadow-subtle space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-serif font-bold text-forest-950">
                  Product Discovery & Harvest Search
                </h2>
                <p className="text-xs sm:text-sm text-forest-700/80 mt-1">
                  Locate verified regional crops, check available farm stock, and place direct purchase orders.
                </p>
              </div>
            </div>

            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="max-w-2xl">
              <div className="relative flex items-center">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-forest-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search produce name, variety, farm or region..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-28 py-3 rounded-xl border border-ivory-300 bg-ivory-50/50 text-forest-950 placeholder:text-forest-400 text-sm shadow-subtle focus:border-forest-700 focus:ring-1 focus:ring-forest-700 transition-all"
                />
                <button
                  type="submit"
                  className="absolute right-2 px-4 py-1.5 rounded-lg bg-forest-800 text-ivory-50 text-xs font-medium hover:bg-forest-900 transition-colors"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Category Quick Links */}
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-forest-600 block mb-2.5">
                Explore Categories:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {categories.map((c) => (
                  <Link
                    key={c.id}
                    href={`/marketplace?category=${c.id}`}
                    className="px-3.5 py-1.5 rounded-lg border border-ivory-300 bg-white text-xs font-semibold text-forest-900 hover:border-forest-700 hover:bg-forest-50 transition-colors"
                  >
                    {c.label}
                  </Link>
                ))}
                <Link
                  href="/marketplace"
                  className="px-3.5 py-1.5 rounded-lg border border-forest-800 bg-forest-800 text-white text-xs font-semibold hover:bg-forest-900 transition-colors"
                >
                  All Produce &rarr;
                </Link>
              </div>
            </div>

            {/* Featured Seasonal Produce Items */}
            {suggestedProducts.length > 0 && (
              <div className="pt-4 border-t border-ivory-200 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-serif font-bold text-forest-950">
                    Recommended Harvests Ready for Dispatch
                  </span>
                  <Link href="/marketplace" className="text-xs font-semibold text-forest-800 hover:underline">
                    View Catalog &rarr;
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {suggestedProducts.map((p) => (
                    <ProduceCard
                      key={p.id}
                      item={p}
                      buyerCategory={(user?.buyerType as BuyerCategory) || "household"}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Two-Column Section: Recent Orders & Notifications / Account Profile */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column (8 cols): Recent Orders & Statuses */}
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white border border-ivory-200 rounded-2xl p-6 sm:p-8 shadow-subtle space-y-5">
                <div className="flex items-center justify-between border-b border-ivory-200 pb-4">
                  <div>
                    <h2 className="text-xl font-serif font-bold text-forest-950">
                      Recent Orders & Statuses
                    </h2>
                    <p className="text-xs sm:text-sm text-forest-700/80 mt-0.5">
                      Track harvest packaging, dispatch timing, and delivery status.
                    </p>
                  </div>
                  <Link href="/buyer/orders">
                    <Button variant="outline" size="sm">
                      View All Orders &rarr;
                    </Button>
                  </Link>
                </div>

                {isLoadingData ? (
                  <div className="space-y-3 py-6 animate-pulse">
                    <div className="h-16 bg-ivory-100 rounded-xl" />
                    <div className="h-16 bg-ivory-100 rounded-xl" />
                  </div>
                ) : recentOrders.length > 0 ? (
                  <div className="space-y-4">
                    {recentOrders.map((order) => (
                      <div
                        key={order.id}
                        className="p-4 rounded-xl border border-ivory-200 bg-ivory-50/40 hover:bg-ivory-100/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-forest-950">
                              Order #{order.id}
                            </span>
                            {getStatusBadge(order.status)}
                          </div>
                          <p className="text-xs text-forest-700/80">
                            Placed on {new Date(order.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })} &middot; {order.items?.length || 1} lot(s)
                          </p>
                          <p className="text-xs font-semibold text-forest-900">
                            Total: ₹{Number(order.total_amount).toFixed(2)}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <Link href={`/buyer/orders/${order.id}`}>
                            <Button variant="secondary" size="sm" className="text-xs">
                              View Details &rarr;
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center space-y-3 bg-ivory-50/50 rounded-xl border border-dashed border-ivory-300">
                    <div className="w-12 h-12 rounded-full bg-forest-50 text-forest-700 flex items-center justify-center mx-auto">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                    <h3 className="font-serif font-bold text-base text-forest-950">No Orders Placed Yet</h3>
                    <p className="text-xs text-forest-700/80 max-w-sm mx-auto">
                      Explore our regional catalog and order directly from local farmers with complete origin verification.
                    </p>
                    <Link href="/marketplace">
                      <Button variant="primary" size="sm">
                        Start Shopping
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column (4 cols): Notifications & Account Info */}
            <div className="lg:col-span-4 space-y-6">
              {/* Notifications Widget */}
              <div className="bg-white border border-ivory-200 rounded-2xl p-6 shadow-subtle space-y-4">
                <div className="flex items-center justify-between border-b border-ivory-200 pb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif font-bold text-base text-forest-950">
                      Notifications
                    </h3>
                    {unreadNotificationCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-terracotta-100 text-terracotta-800 text-[10px] font-bold font-mono">
                        {unreadNotificationCount} unread
                      </span>
                    )}
                  </div>
                  {unreadNotificationCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      className="text-[11px] text-forest-700 hover:text-forest-950 underline font-medium"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                {notifications.length > 0 ? (
                  <div className="space-y-3">
                    {notifications.map((n) => (
                      <Link
                        key={n.id}
                        href={n.order_id ? `/buyer/orders/${n.order_id}` : "/notifications"}
                        className={`block p-3 rounded-xl border text-xs transition-colors ${
                          n.is_read
                            ? "border-ivory-200 bg-white hover:bg-ivory-50 text-forest-700"
                            : "border-forest-300 bg-forest-50/50 hover:bg-forest-50 text-forest-950 font-medium"
                        }`}
                      >
                        <div className="font-semibold text-forest-950 mb-0.5 flex items-center justify-between">
                          <span>{n.title}</span>
                          {!n.is_read && <span className="w-2 h-2 rounded-full bg-terracotta-600" />}
                        </div>
                        <p className="text-forest-700/80 leading-relaxed text-[11px]">{n.message}</p>
                      </Link>
                    ))}

                    <div className="pt-2 text-center border-t border-ivory-100">
                      <Link href="/notifications" className="text-xs font-semibold text-forest-800 hover:underline">
                        View all notifications &rarr;
                      </Link>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-forest-600 text-center py-4">
                    No new notifications.
                  </p>
                )}
              </div>

              {/* Account Information Card */}
              <div className="bg-white border border-ivory-200 rounded-2xl p-6 shadow-subtle space-y-4">
                <h3 className="font-serif font-bold text-base text-forest-950 border-b border-ivory-200 pb-3">
                  Account Profile
                </h3>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-forest-500 font-mono uppercase block text-[10px]">Full Name</span>
                    <span className="font-semibold text-forest-950">{user?.fullName || "Not provided"}</span>
                  </div>

                  <div>
                    <span className="text-forest-500 font-mono uppercase block text-[10px]">Email Address</span>
                    <span className="font-semibold text-forest-950">{user?.email}</span>
                  </div>

                  <div>
                    <span className="text-forest-500 font-mono uppercase block text-[10px]">Buyer Classification</span>
                    <span className="font-semibold capitalize text-forest-950">
                      {user?.buyerType || "Household"}
                    </span>
                  </div>

                  {user?.organizationName && (
                    <div>
                      <span className="text-forest-500 font-mono uppercase block text-[10px]">Organization</span>
                      <span className="font-semibold text-forest-950">{user.organizationName}</span>
                    </div>
                  )}

                  {user?.district && (
                    <div>
                      <span className="text-forest-500 font-mono uppercase block text-[10px]">District / Region</span>
                      <span className="font-semibold text-forest-950">
                        {user.district}{user?.state ? `, ${user.state}` : ""}
                      </span>
                    </div>
                  )}

                  {user?.location && (
                    <div>
                      <span className="text-forest-500 font-mono uppercase block text-[10px]">Delivery Coordinates</span>
                      <span className="font-semibold text-forest-950">{user.location}</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-ivory-200">
                  <div className="p-3 bg-ivory-100/70 rounded-xl border border-ivory-300 text-[11px] text-forest-700 leading-relaxed">
                    <span className="font-semibold text-forest-950 block mb-0.5">Commercial Sourcing?</span>
                    Restaurants, grocers, and institutions can stage multi-pallet weekly orders via our commercial procurement desk.
                    <Link href="/for-businesses" className="block text-forest-800 font-semibold underline mt-1">
                      Learn about commercial trade &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}
