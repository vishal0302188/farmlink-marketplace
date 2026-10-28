"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AdminDashboardMetrics, ApiOrder, User } from "@/types";
import { fetchAdminOverview } from "@/lib/api";

export default function AdminOverviewPage() {
  const [metrics, setMetrics] = useState<AdminDashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    const { metrics: data, error: err } = await fetchAdminOverview();
    if (err || !data) {
      setError(err || "Failed to retrieve administrative metrics.");
    } else {
      setMetrics(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-amber-100 text-amber-800 border border-amber-300">Pending</span>;
      case "confirmed":
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-blue-100 text-blue-800 border border-blue-300">Confirmed</span>;
      case "ready":
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-indigo-100 text-indigo-800 border border-indigo-300">Ready</span>;
      case "dispatched":
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-purple-100 text-purple-800 border border-purple-300">Dispatched</span>;
      case "delivered":
      case "completed":
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">Completed</span>;
      case "cancelled":
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-zinc-100 text-zinc-700 border border-zinc-300">Cancelled</span>;
      case "rejected":
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-rose-100 text-rose-800 border border-rose-300">Rejected</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-ivory-200 text-forest-800">{status}</span>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-terracotta-100 text-terracotta-800 border border-terracotta-300">Admin</span>;
      case "farmer":
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-forest-100 text-forest-800 border border-forest-300">Farmer</span>;
      case "buyer":
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-blue-50 text-blue-800 border border-blue-200">Buyer</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-ivory-200 text-forest-700">{role}</span>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Overview Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-forest-950 font-serif">Marketplace Governance & Metrics</h2>
          <p className="text-xs text-forest-700 mt-1">
            Real-time telemetry and operational status across agricultural producers, buyers, and order pipelines.
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={isLoading}
          className="self-start sm:self-auto px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-ivory-100 hover:bg-ivory-200 text-forest-800 border border-ivory-300 transition-colors flex items-center gap-1.5 shadow-subtle disabled:opacity-50"
        >
          <svg className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {isLoading ? "Refreshing..." : "Refresh Metrics"}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-rose-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
          <button onClick={loadData} className="text-xs underline font-semibold hover:text-rose-950">Retry</button>
        </div>
      )}

      {/* Pending Moderation Alert Callout */}
      {metrics && metrics.pending_moderation_products > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-subtle">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-200/70 text-amber-800 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-950">Produce Listings Awaiting Compliance Review</h4>
              <p className="text-xs text-amber-800 mt-0.5">
                There {metrics.pending_moderation_products === 1 ? "is 1 listing" : `are ${metrics.pending_moderation_products} listings`} pending verification before publication to the marketplace.
              </p>
            </div>
          </div>
          <Link
            href="/admin/products?status=pending"
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-700 hover:bg-amber-800 text-ivory-50 transition-colors whitespace-nowrap self-start sm:self-auto shadow-subtle"
          >
            Review Listings &rarr;
          </Link>
        </div>
      )}

      {/* Primary KPI Grid (6 metrics) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Farmers */}
        <div className="bg-white p-4 rounded-xl border border-ivory-200 shadow-subtle">
          <div className="text-[11px] font-mono uppercase tracking-wider text-forest-700 font-semibold">Farmers</div>
          <div className="text-2xl font-bold text-forest-950 font-serif mt-1">
            {isLoading ? "—" : metrics?.total_farmers ?? 0}
          </div>
          <div className="text-[11px] text-forest-600 mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-forest-600" /> Registered producers
          </div>
        </div>

        {/* Total Buyers */}
        <div className="bg-white p-4 rounded-xl border border-ivory-200 shadow-subtle">
          <div className="text-[11px] font-mono uppercase tracking-wider text-forest-700 font-semibold">Buyers</div>
          <div className="text-2xl font-bold text-forest-950 font-serif mt-1">
            {isLoading ? "—" : metrics?.total_buyers ?? 0}
          </div>
          <div className="text-[11px] text-forest-600 mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> B2B & Household
          </div>
        </div>

        {/* Active Products */}
        <div className="bg-white p-4 rounded-xl border border-ivory-200 shadow-subtle">
          <div className="text-[11px] font-mono uppercase tracking-wider text-forest-700 font-semibold">Active Listings</div>
          <div className="text-2xl font-bold text-forest-950 font-serif mt-1">
            {isLoading ? "—" : metrics?.active_products ?? 0}
          </div>
          <div className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" /> Live on catalog
          </div>
        </div>

        {/* Pending Moderation */}
        <div className={`p-4 rounded-xl border shadow-subtle ${
          (metrics?.pending_moderation_products ?? 0) > 0
            ? "bg-amber-50/70 border-amber-200"
            : "bg-white border-ivory-200"
        }`}>
          <div className="text-[11px] font-mono uppercase tracking-wider text-amber-900 font-semibold">Pending Review</div>
          <div className="text-2xl font-bold text-amber-950 font-serif mt-1">
            {isLoading ? "—" : metrics?.pending_moderation_products ?? 0}
          </div>
          <div className="text-[11px] text-amber-800 mt-1 flex items-center gap-1 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" /> Moderation queue
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white p-4 rounded-xl border border-ivory-200 shadow-subtle">
          <div className="text-[11px] font-mono uppercase tracking-wider text-forest-700 font-semibold">Total Orders</div>
          <div className="text-2xl font-bold text-forest-950 font-serif mt-1">
            {isLoading ? "—" : metrics?.total_orders ?? 0}
          </div>
          <div className="text-[11px] text-forest-600 mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-forest-400" /> Cumulative volume
          </div>
        </div>

        {/* Completed Orders */}
        <div className="bg-white p-4 rounded-xl border border-ivory-200 shadow-subtle">
          <div className="text-[11px] font-mono uppercase tracking-wider text-forest-700 font-semibold">Fulfilled</div>
          <div className="text-2xl font-bold text-forest-950 font-serif mt-1">
            {isLoading ? "—" : metrics?.completed_orders ?? 0}
          </div>
          <div className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" /> Delivered / Closed
          </div>
        </div>
      </div>

      {/* Two-Column Operational Tables: Recent Orders & Recent Users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders Card */}
        <div className="bg-white rounded-xl border border-ivory-200 shadow-subtle overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-5 border-b border-ivory-200 flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-base text-forest-950">Recent Platform Orders</h3>
                <p className="text-xs text-forest-600">Latest transactions placed across all producers</p>
              </div>
              <Link
                href="/admin/orders"
                className="text-xs font-semibold text-terracotta-700 hover:text-terracotta-900 transition-colors"
              >
                View All &rarr;
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-ivory-100/60 border-b border-ivory-200 text-forest-700 font-mono uppercase text-[10px]">
                    <th className="py-2.5 px-4 font-semibold">Order</th>
                    <th className="py-2.5 px-4 font-semibold">Buyer</th>
                    <th className="py-2.5 px-4 font-semibold">Amount</th>
                    <th className="py-2.5 px-4 font-semibold">Status</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ivory-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-forest-600">Loading order activity...</td>
                    </tr>
                  ) : !metrics?.recent_orders || metrics.recent_orders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-forest-600">No transactions recorded yet.</td>
                    </tr>
                  ) : (
                    metrics.recent_orders.slice(0, 7).map((ord: ApiOrder) => (
                      <tr key={ord.id} className="hover:bg-ivory-50/80 transition-colors">
                        <td className="py-2.5 px-4 font-mono font-semibold text-forest-950">#{ord.id}</td>
                        <td className="py-2.5 px-4">
                          <div className="font-medium text-forest-900">{ord.buyer?.fullName || `Buyer #${ord.buyer_id}`}</div>
                          <div className="text-[10px] text-forest-600 truncate max-w-[120px]">{ord.buyer?.email}</div>
                        </td>
                        <td className="py-2.5 px-4 font-mono font-bold text-forest-950">₹{Number(ord.total_amount).toLocaleString("en-IN")}</td>
                        <td className="py-2.5 px-4">{getStatusBadge(ord.status)}</td>
                        <td className="py-2.5 px-4 text-right font-mono text-[11px] text-forest-600">
                          {new Date(ord.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-3 bg-ivory-50 border-t border-ivory-200 text-center">
            <Link href="/admin/orders" className="text-xs font-semibold text-forest-800 hover:text-forest-950">
              Manage and reconcile orders in Order Oversight &rarr;
            </Link>
          </div>
        </div>

        {/* Recent Registrations Card */}
        <div className="bg-white rounded-xl border border-ivory-200 shadow-subtle overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-5 border-b border-ivory-200 flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-base text-forest-950">Recent Registrations</h3>
                <p className="text-xs text-forest-600">Newly onboarded farmers, businesses, and accounts</p>
              </div>
              <Link
                href="/admin/users"
                className="text-xs font-semibold text-terracotta-700 hover:text-terracotta-900 transition-colors"
              >
                View All &rarr;
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-ivory-100/60 border-b border-ivory-200 text-forest-700 font-mono uppercase text-[10px]">
                    <th className="py-2.5 px-4 font-semibold">User</th>
                    <th className="py-2.5 px-4 font-semibold">Role</th>
                    <th className="py-2.5 px-4 font-semibold">Location</th>
                    <th className="py-2.5 px-4 font-semibold">Status</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ivory-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-forest-600">Loading user registrations...</td>
                    </tr>
                  ) : !metrics?.recent_users || metrics.recent_users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-forest-600">No users found in database.</td>
                    </tr>
                  ) : (
                    metrics.recent_users.slice(0, 7).map((u: User) => (
                      <tr key={u.id} className="hover:bg-ivory-50/80 transition-colors">
                        <td className="py-2.5 px-4">
                          <div className="font-medium text-forest-950">{u.fullName}</div>
                          <div className="text-[10px] text-forest-600 truncate max-w-[130px]">{u.email}</div>
                        </td>
                        <td className="py-2.5 px-4">{getRoleBadge(u.role)}</td>
                        <td className="py-2.5 px-4 text-forest-700 truncate max-w-[100px]">
                          {u.district && u.state ? `${u.district}, ${u.state}` : u.location || "—"}
                        </td>
                        <td className="py-2.5 px-4">
                          {u.isActive ? (
                            <span className="text-[10px] font-mono font-medium text-emerald-700">Active</span>
                          ) : (
                            <span className="text-[10px] font-mono font-medium text-rose-700">Suspended</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-[11px] text-forest-600">
                          {u.created_at || u.createdAt ? new Date(u.created_at || u.createdAt!).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-3 bg-ivory-50 border-t border-ivory-200 text-center">
            <Link href="/admin/users" className="text-xs font-semibold text-forest-800 hover:text-forest-950">
              Audit accounts and permissions in User Management &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
