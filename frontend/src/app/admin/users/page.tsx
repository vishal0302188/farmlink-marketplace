"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AdminUserItem } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { fetchAdminUsers, updateAdminUserStatus } from "@/lib/api";

export default function AdminUsersPage() {
  const { user: currentAdmin } = useAuth();

  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Filters
  const [roleFilter, setRoleFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Confirmation Modal for Suspend/Reactivate
  const [pendingActionUser, setPendingActionUser] = useState<AdminUserItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const params: {
      role?: string;
      search?: string;
    } = {};

    if (roleFilter !== "all") params.role = roleFilter;
    if (searchQuery.trim()) params.search = searchQuery.trim();

    const { users: data, error: err } = await fetchAdminUsers(params);
    if (err) {
      setError(err);
    } else {
      setUsers(data);
    }
    setIsLoading(false);
  }, [roleFilter, searchQuery]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleToggleStatus = (targetUser: AdminUserItem) => {
    if (String(targetUser.id) === String(currentAdmin?.id)) {
      setActionMessage({
        text: "Safety Guard: You cannot deactivate your own administrative account.",
        type: "error",
      });
      return;
    }
    setPendingActionUser(targetUser);
  };

  const handleConfirmToggleStatus = async () => {
    if (!pendingActionUser) return;

    setIsSubmitting(true);
    const newStatus = !pendingActionUser.is_active;
    const { success, user: updated, error: err } = await updateAdminUserStatus(pendingActionUser.id, {
      is_active: newStatus,
      notes: newStatus ? "Reactivated by admin" : "Suspended by admin governance",
    });
    setIsSubmitting(false);

    if (success && updated) {
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setActionMessage({
        text: `Account for ${pendingActionUser.full_name} (${pendingActionUser.email}) has been ${newStatus ? "reactivated" : "suspended"}.`,
        type: "success",
      });
      setPendingActionUser(null);
    } else {
      setActionMessage({
        text: err || "Failed to update user account status.",
        type: "error",
      });
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

  const roleOptions = [
    { id: "all", label: "All Users" },
    { id: "farmer", label: "Farmers / Producers" },
    { id: "buyer", label: "Buyers" },
    { id: "admin", label: "Administrators" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-forest-950 font-serif">User Directory & Account Governance</h2>
        <p className="text-xs text-forest-700 mt-1">
          Monitor account statuses, verify producer registrations, manage platform access, and safeguard system integrity.
        </p>
      </div>

      {actionMessage && (
        <div
          className={`p-4 rounded-xl text-xs font-medium border flex items-center justify-between ${
            actionMessage.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-200"
              : "bg-rose-50 text-rose-900 border-rose-200"
          }`}
        >
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage(null)} className="font-bold underline ml-3">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-ivory-200 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Role Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {roleOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setRoleFilter(opt.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                roleFilter === opt.id
                  ? "bg-forest-800 text-ivory-50 shadow-subtle"
                  : "bg-ivory-100 text-forest-800 hover:bg-ivory-200 border border-ivory-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search by name, email, or organization..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3.5 py-2 text-xs rounded-lg border border-ivory-300 bg-ivory-50/50 text-forest-950 focus:outline-none focus:ring-1 focus:ring-forest-600"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2.5 text-xs text-forest-400 hover:text-forest-700"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={loadUsers} className="font-semibold underline">Retry</button>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-ivory-200 shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-ivory-100/70 border-b border-ivory-200 text-forest-700 font-mono uppercase text-[10px]">
                <th className="py-3 px-4 font-semibold">User Profile</th>
                <th className="py-3 px-4 font-semibold">Role & Classification</th>
                <th className="py-3 px-4 font-semibold">Location</th>
                <th className="py-3 px-4 font-semibold">Activity Volume</th>
                <th className="py-3 px-4 font-semibold">Account State</th>
                <th className="py-3 px-4 font-semibold">Registration</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ivory-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-forest-600">
                    <div className="w-8 h-8 border-2 border-forest-200 border-t-forest-800 rounded-full animate-spin mx-auto mb-2" />
                    Loading user accounts...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-forest-600">
                    No users found matching the selected criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isCurrentAdmin = String(u.id) === String(currentAdmin?.id);

                  return (
                    <tr key={u.id} className="hover:bg-ivory-50/70 transition-colors">
                      {/* User Profile */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-forest-800 text-ivory-50 font-serif font-bold text-xs flex items-center justify-center flex-shrink-0">
                            {u.full_name ? u.full_name.charAt(0).toUpperCase() : "U"}
                          </div>
                          <div>
                            <div className="font-semibold text-forest-950 flex items-center gap-1.5">
                              {u.full_name}
                              {isCurrentAdmin && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-ivory-200 text-forest-700 font-bold">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-forest-600">{u.email}</div>
                            {u.organization_name && (
                              <div className="text-[10px] text-terracotta-700 font-medium">{u.organization_name}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Role & Classification */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1">
                          <div>{getRoleBadge(u.role)}</div>
                          {u.buyer_type && (
                            <span className="text-[10px] text-forest-600 font-mono capitalize">
                              Type: {u.buyer_type}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-3 px-4 text-forest-800">
                        {u.district && u.state ? (
                          <div>
                            <div className="font-medium">{u.district}</div>
                            <div className="text-[10px] text-forest-600">{u.state}</div>
                          </div>
                        ) : (
                          u.location || <span className="text-forest-400 font-mono">—</span>
                        )}
                      </td>

                      {/* Activity Volume */}
                      <td className="py-3 px-4 font-mono text-[11px]">
                        {u.role === "farmer" && (
                          <div className="text-forest-900">
                            <span className="font-bold">{u.product_count}</span> products listed
                          </div>
                        )}
                        {u.role === "buyer" && (
                          <div className="text-forest-900">
                            <span className="font-bold">{u.buyer_order_count}</span> orders placed
                          </div>
                        )}
                        {u.role === "admin" && (
                          <span className="text-forest-500 italic">System Administrator</span>
                        )}
                      </td>

                      {/* Account State */}
                      <td className="py-3 px-4">
                        {u.is_active ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-medium text-emerald-800 bg-emerald-50 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-medium text-rose-800 bg-rose-50 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" /> Suspended
                          </span>
                        )}
                      </td>

                      {/* Registration Date */}
                      <td className="py-3 px-4 font-mono text-[11px] text-forest-600 whitespace-nowrap">
                        {new Date(u.created_at).toLocaleDateString("en-IN", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {isCurrentAdmin ? (
                          <span
                            className="text-[11px] text-forest-400 font-medium italic cursor-not-allowed"
                            title="Self-lockout guard: You cannot suspend your own account."
                          >
                            Cannot Suspend Self
                          </span>
                        ) : (
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className={`px-3 py-1 rounded text-xs font-semibold transition-colors shadow-subtle ${
                              u.is_active
                                ? "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                                : "bg-emerald-700 text-ivory-50 hover:bg-emerald-800"
                            }`}
                          >
                            {u.is_active ? "Suspend" : "Reactivate"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {pendingActionUser && (
        <div className="fixed inset-0 z-50 bg-forest-950/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-ivory-200 space-y-4">
            <div>
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${
                  pendingActionUser.is_active ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="font-serif font-bold text-lg text-forest-950">
                {pendingActionUser.is_active ? "Suspend User Account" : "Reactivate User Account"}
              </h3>
              <p className="text-xs text-forest-600 mt-1 leading-relaxed">
                {pendingActionUser.is_active ? (
                  <>
                    Are you sure you want to suspend <span className="font-semibold text-forest-950">{pendingActionUser.full_name}</span> ({pendingActionUser.email})?
                    They will immediately lose access to sign in, create listings, or place orders until reactivated.
                  </>
                ) : (
                  <>
                    Reactivate <span className="font-semibold text-forest-950">{pendingActionUser.full_name}</span> ({pendingActionUser.email})?
                    Their account access and existing listings will be restored.
                  </>
                )}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-ivory-200">
              <button
                type="button"
                onClick={() => setPendingActionUser(null)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-forest-700 hover:bg-ivory-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmToggleStatus}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold text-ivory-50 transition-colors shadow-subtle ${
                  pendingActionUser.is_active
                    ? "bg-rose-700 hover:bg-rose-800"
                    : "bg-emerald-700 hover:bg-emerald-800"
                } disabled:opacity-50`}
              >
                {isSubmitting ? "Updating..." : pendingActionUser.is_active ? "Confirm Suspension" : "Confirm Reactivation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
