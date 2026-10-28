"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { BackendProduct } from "@/lib/api";
import { fetchAdminProducts, moderateAdminProduct } from "@/lib/api";

function AdminProductsContent() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") || "all";

  const [products, setProducts] = useState<BackendProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Moderation Reject Modal State
  const [rejectingProduct, setRejectingProduct] = useState<BackendProduct | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmittingRejection, setIsSubmittingRejection] = useState(false);

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const params: {
      status?: string;
      category?: string;
      search?: string;
    } = {};

    if (statusFilter !== "all") params.status = statusFilter;
    if (categoryFilter !== "all") params.category = categoryFilter;
    if (searchQuery.trim()) params.search = searchQuery.trim();

    const { products: data, error: err } = await fetchAdminProducts(params);
    if (err) {
      setError(err);
    } else {
      setProducts(data);
    }
    setIsLoading(false);
  }, [statusFilter, categoryFilter, searchQuery]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleApprove = async (product: BackendProduct) => {
    setActionMessage(null);
    const { success, product: updated, error: err } = await moderateAdminProduct(product.id, {
      listing_status: "active",
      is_active: true,
      moderation_reason: "Verified and approved by marketplace administration.",
    });

    if (success && updated) {
      setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setActionMessage({
        text: `Listing "${product.name}" has been approved and published to the live marketplace.`,
        type: "success",
      });
    } else {
      setActionMessage({
        text: err || "Failed to approve listing.",
        type: "error",
      });
    }
  };

  const handleOpenRejectModal = (product: BackendProduct) => {
    setRejectingProduct(product);
    setRejectionReason(product.moderation_reason || "");
  };

  const handleConfirmReject = async () => {
    if (!rejectingProduct) return;
    if (!rejectionReason.trim()) {
      alert("Please provide an explicit moderation reason explaining why this produce listing was rejected.");
      return;
    }

    setIsSubmittingRejection(true);
    const { success, product: updated, error: err } = await moderateAdminProduct(rejectingProduct.id, {
      listing_status: "rejected",
      is_active: false,
      moderation_reason: rejectionReason.trim(),
    });
    setIsSubmittingRejection(false);

    if (success && updated) {
      setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setActionMessage({
        text: `Listing "${rejectingProduct.name}" was rejected. Producer will be notified with your feedback.`,
        type: "success",
      });
      setRejectingProduct(null);
      setRejectionReason("");
    } else {
      setActionMessage({
        text: err || "Failed to reject listing.",
        type: "error",
      });
    }
  };

  const handleToggleActive = async (product: BackendProduct) => {
    setActionMessage(null);
    const newActive = !product.is_active;
    const { success, product: updated, error: err } = await moderateAdminProduct(product.id, {
      listing_status: newActive ? "active" : "archived",
      is_active: newActive,
      moderation_reason: newActive ? "Reactivated by admin" : "Deactivated from catalog by admin",
    });

    if (success && updated) {
      setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setActionMessage({
        text: `Listing "${product.name}" is now ${newActive ? "active on the marketplace" : "hidden / deactivated"}.`,
        type: "success",
      });
    } else {
      setActionMessage({
        text: err || "Failed to change active status.",
        type: "error",
      });
    }
  };

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (!isActive && status === "active") {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-zinc-100 text-zinc-700 border border-zinc-300">
          Deactivated
        </span>
      );
    }

    switch (status) {
      case "active":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
            Active
          </span>
        );
      case "pending":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-amber-100 text-amber-800 border border-amber-300">
            Pending Review
          </span>
        );
      case "rejected":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-rose-100 text-rose-800 border border-rose-300">
            Rejected
          </span>
        );
      case "archived":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-zinc-100 text-zinc-600 border border-zinc-300">
            Archived
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-ivory-200 text-forest-700">
            {status}
          </span>
        );
    }
  };

  const statusOptions = [
    { id: "all", label: "All Statuses" },
    { id: "pending", label: "Pending Review" },
    { id: "active", label: "Active" },
    { id: "rejected", label: "Rejected" },
    { id: "archived", label: "Archived" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-forest-950 font-serif">Product Moderation & Catalog Governance</h2>
        <p className="text-xs text-forest-700 mt-1">
          Review agricultural produce submissions, verify compliance, approve high-quality lots, and manage catalog status.
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
      <div className="bg-white p-4 rounded-xl border border-ivory-200 shadow-subtle space-y-4">
        {/* Status Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-semibold text-forest-700 mr-2 whitespace-nowrap">Filter Status:</span>
          {statusOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setStatusFilter(opt.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                statusFilter === opt.id
                  ? "bg-forest-800 text-ivory-50 shadow-subtle"
                  : "bg-ivory-100 text-forest-800 hover:bg-ivory-200 border border-ivory-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Search and Category Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 relative">
            <input
              type="text"
              placeholder="Search by produce name, origin, or description..."
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

          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-lg border border-ivory-300 bg-ivory-50/50 text-forest-950 focus:outline-none focus:ring-1 focus:ring-forest-600"
            >
              <option value="all">All Categories</option>
              <option value="vegetables">Vegetables</option>
              <option value="fruits">Fruits</option>
              <option value="grains_pulses">Grains & Pulses</option>
              <option value="dairy_eggs">Dairy & Eggs</option>
              <option value="herbs_spices">Herbs & Spices</option>
              <option value="specialty">Specialty Produce</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={loadProducts} className="font-semibold underline">Retry</button>
        </div>
      )}

      {/* Catalog Moderation Table */}
      <div className="bg-white rounded-xl border border-ivory-200 shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-ivory-100/70 border-b border-ivory-200 text-forest-700 font-mono uppercase text-[10px]">
                <th className="py-3 px-4 font-semibold">Produce Item</th>
                <th className="py-3 px-4 font-semibold">Producer</th>
                <th className="py-3 px-4 font-semibold">Pricing & Stock</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Moderation Log</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ivory-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-forest-600">
                    <div className="w-8 h-8 border-2 border-forest-200 border-t-forest-800 rounded-full animate-spin mx-auto mb-2" />
                    Loading catalog listings...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-forest-600">
                    No produce items found matching the selected filters.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-ivory-50/70 transition-colors">
                    {/* Item */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-ivory-100 border border-ivory-200 overflow-hidden flex-shrink-0 relative">
                          {p.image_url ? (
                            <Image
                              src={p.image_url}
                              alt={p.name}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-forest-400 font-serif font-bold text-base">
                              {p.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-forest-950 flex items-center gap-1.5">
                            {p.name}
                            {p.is_organic && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold">
                                Organic
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-forest-600 capitalize">{p.category.replace("_", " & ")}</div>
                        </div>
                      </div>
                    </td>

                    {/* Producer */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-forest-900">{p.farmer?.organization_name || p.farmer?.full_name || "Independent Farmer"}</div>
                      <div className="text-[10px] text-forest-600">{p.growing_location || "Regional Farm"}</div>
                    </td>

                    {/* Pricing & Stock */}
                    <td className="py-3 px-4 font-mono">
                      <div className="font-bold text-forest-950">₹{p.price} / {p.unit}</div>
                      <div className="text-[11px] text-forest-600">
                        Stock: {p.available_quantity} {p.unit} (Min: {p.minimum_order_quantity})
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      {getStatusBadge(p.listing_status, p.is_active)}
                    </td>

                    {/* Moderation Log */}
                    <td className="py-3 px-4 max-w-[200px]">
                      {p.moderation_reason ? (
                        <p className="text-[11px] text-forest-700 italic truncate" title={p.moderation_reason}>
                          &ldquo;{p.moderation_reason}&rdquo;
                        </p>
                      ) : (
                        <span className="text-[10px] text-forest-400 font-mono">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {p.listing_status !== "active" && (
                          <button
                            onClick={() => handleApprove(p)}
                            className="px-2.5 py-1 rounded text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-ivory-50 transition-colors shadow-subtle"
                          >
                            Approve
                          </button>
                        )}

                        {p.listing_status !== "rejected" && (
                          <button
                            onClick={() => handleOpenRejectModal(p)}
                            className="px-2.5 py-1 rounded text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors"
                          >
                            Reject
                          </button>
                        )}

                        <button
                          onClick={() => handleToggleActive(p)}
                          className="px-2.5 py-1 rounded text-xs font-medium text-forest-700 hover:text-forest-950 hover:bg-ivory-200 border border-ivory-300 transition-colors"
                        >
                          {p.is_active ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Modal */}
      {rejectingProduct && (
        <div className="fixed inset-0 z-50 bg-forest-950/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-ivory-200 space-y-4">
            <div>
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mb-3">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="font-serif font-bold text-lg text-forest-950">Reject Produce Listing</h3>
              <p className="text-xs text-forest-600 mt-1">
                You are rejecting <span className="font-semibold text-forest-900">&ldquo;{rejectingProduct.name}&rdquo;</span>.
                Please provide an explicit rationale for the producer.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-forest-800 mb-1">
                Reason for Moderation Rejection <span className="text-rose-600">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., Incomplete pesticide compliance report, incorrect unit grading, or missing crop origin verification."
                className="w-full text-xs p-3 rounded-lg border border-ivory-300 focus:outline-none focus:ring-1 focus:ring-rose-500 bg-ivory-50/50"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-ivory-200">
              <button
                type="button"
                onClick={() => setRejectingProduct(null)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-forest-700 hover:bg-ivory-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingRejection || !rejectionReason.trim()}
                onClick={handleConfirmReject}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-rose-700 hover:bg-rose-800 text-ivory-50 transition-colors shadow-subtle disabled:opacity-50"
              >
                {isSubmittingRejection ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminProductsPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-xs text-forest-600">Loading catalog moderation...</div>}>
      <AdminProductsContent />
    </Suspense>
  );
}
