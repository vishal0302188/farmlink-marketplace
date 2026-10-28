"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ApiOrder, OrderStatusType } from "@/types";
import { fetchAdminOrders, updateAdminOrderStatus } from "@/lib/api";

function AdminOrdersContent() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") || "all";

  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [searchQuery, setSearchQuery] = useState("");

  // Expandable row state for inspecting line items and address details
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);

  // Status Transition Action Modal
  const [selectedOrderForAction, setSelectedOrderForAction] = useState<ApiOrder | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatusType>("confirmed");
  const [adminNotes, setAdminNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const params: {
      status?: string;
      search?: string;
    } = {};

    if (statusFilter !== "all") params.status = statusFilter;
    if (searchQuery.trim()) params.search = searchQuery.trim();

    const { orders: data, error: err } = await fetchAdminOrders(params);
    if (err) {
      setError(err);
    } else {
      setOrders(data);
    }
    setIsLoading(false);
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleOpenActionModal = (order: ApiOrder, defaultNextStatus?: OrderStatusType) => {
    setSelectedOrderForAction(order);
    setNewStatus(defaultNextStatus || order.status);
    setAdminNotes("");
  };

  const handleConfirmStatusUpdate = async () => {
    if (!selectedOrderForAction) return;

    setIsSubmitting(true);
    const { success, order: updated, error: err } = await updateAdminOrderStatus(selectedOrderForAction.id, {
      status: newStatus,
      notes: adminNotes.trim() || undefined,
    });
    setIsSubmitting(false);

    if (success && updated) {
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      setActionMessage({
        text: `Order #${selectedOrderForAction.id} has been transitioned to status: ${newStatus.toUpperCase()}.${
          newStatus === "cancelled" || newStatus === "rejected"
            ? " Inventory has been safely restored to the producer."
            : ""
        }`,
        type: "success",
      });
      setSelectedOrderForAction(null);
    } else {
      setActionMessage({
        text: err || "Failed to update order status.",
        type: "error",
      });
    }
  };

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

  const statusOptions = [
    { id: "all", label: "All Orders" },
    { id: "pending", label: "Pending" },
    { id: "confirmed", label: "Confirmed" },
    { id: "ready", label: "Ready" },
    { id: "dispatched", label: "Dispatched" },
    { id: "delivered", label: "Delivered" },
    { id: "completed", label: "Completed" },
    { id: "cancelled", label: "Cancelled" },
    { id: "rejected", label: "Rejected" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-forest-950 font-serif">Order Oversight & Transaction Lifecycle</h2>
        <p className="text-xs text-forest-700 mt-1">
          Monitor marketplace settlements, inspect fulfilment stages, and safely transition orders with automated inventory protection.
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
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
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

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search by Order ID, Buyer, or Farmer..."
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
          <button onClick={loadOrders} className="font-semibold underline">Retry</button>
        </div>
      )}

      {/* Orders Master Table */}
      <div className="bg-white rounded-xl border border-ivory-200 shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-ivory-100/70 border-b border-ivory-200 text-forest-700 font-mono uppercase text-[10px]">
                <th className="py-3 px-4 font-semibold">Order</th>
                <th className="py-3 px-4 font-semibold">Buyer Details</th>
                <th className="py-3 px-4 font-semibold">Farmer / Origin</th>
                <th className="py-3 px-4 font-semibold">Items</th>
                <th className="py-3 px-4 font-semibold">Total Amount</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Lifecycle Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ivory-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-forest-600">
                    <div className="w-8 h-8 border-2 border-forest-200 border-t-forest-800 rounded-full animate-spin mx-auto mb-2" />
                    Loading orders oversight...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-forest-600">
                    No orders found matching the selected filter.
                  </td>
                </tr>
              ) : (
                orders.map((ord) => {
                  const isExpanded = expandedOrderId === ord.id;

                  return (
                    <React.Fragment key={ord.id}>
                      <tr className={`hover:bg-ivory-50/70 transition-colors ${isExpanded ? "bg-ivory-50/90" : ""}`}>
                        {/* Order ID & Date */}
                        <td className="py-3 px-4">
                          <button
                            onClick={() => setExpandedOrderId(isExpanded ? null : ord.id)}
                            className="text-left font-mono font-bold text-forest-950 hover:text-forest-700 flex items-center gap-1.5"
                          >
                            <span>#{ord.id}</span>
                            <svg className={`w-3 h-3 text-forest-500 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          <div className="text-[10px] text-forest-600 font-mono">
                            {new Date(ord.created_at).toLocaleDateString("en-IN", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </div>
                        </td>

                        {/* Buyer */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-forest-950">{ord.buyer?.fullName || `Buyer #${ord.buyer_id}`}</div>
                          <div className="text-[10px] text-forest-600">{ord.buyer?.email}</div>
                          {ord.delivery_city && (
                            <div className="text-[10px] text-forest-500 font-mono">
                              Ship: {ord.delivery_city}, {ord.delivery_state}
                            </div>
                          )}
                        </td>

                        {/* Farmer */}
                        <td className="py-3 px-4">
                          <div className="font-medium text-forest-900">{ord.farmer?.organizationName || ord.farmer?.fullName || `Farmer #${ord.farmer_id}`}</div>
                          <div className="text-[10px] text-forest-600">{ord.farmer?.location || "Regional Farm"}</div>
                        </td>

                        {/* Items Count */}
                        <td className="py-3 px-4 font-mono">
                          <span className="font-semibold text-forest-900">{ord.items?.length || 0}</span> items
                          <div className="text-[10px] text-forest-500 truncate max-w-[140px]">
                            {ord.items?.map((it) => it.product?.name).filter(Boolean).join(", ") || "—"}
                          </div>
                        </td>

                        {/* Total Amount */}
                        <td className="py-3 px-4 font-mono font-bold text-forest-950 text-sm">
                          ₹{Number(ord.total_amount).toLocaleString("en-IN")}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          {getStatusBadge(ord.status)}
                        </td>

                        {/* Lifecycle Actions */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setExpandedOrderId(isExpanded ? null : ord.id)}
                              className="px-2.5 py-1 rounded text-xs font-medium text-forest-700 hover:text-forest-950 hover:bg-ivory-200 border border-ivory-300 transition-colors"
                            >
                              {isExpanded ? "Collapse" : "Inspect"}
                            </button>

                            <button
                              onClick={() => handleOpenActionModal(ord)}
                              className="px-2.5 py-1 rounded text-xs font-semibold bg-forest-800 text-ivory-50 hover:bg-forest-900 transition-colors shadow-subtle"
                            >
                              Transition &rarr;
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Inspection Row */}
                      {isExpanded && (
                        <tr className="bg-ivory-50/90 border-b border-ivory-200">
                          <td colSpan={7} className="p-4">
                            <div className="bg-white rounded-xl border border-ivory-200 p-4 space-y-4 shadow-subtle">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-ivory-200 pb-3">
                                <div>
                                  <h4 className="font-serif font-bold text-sm text-forest-950">
                                    Order #{ord.id} Manifest Breakdown
                                  </h4>
                                  <p className="text-xs text-forest-600">
                                    Fulfillment Method: <span className="font-semibold text-forest-800">{ord.fulfillment_method}</span>
                                    {ord.payment_method ? ` | Payment: ${ord.payment_method}` : ""}
                                  </p>
                                </div>
                                <div className="text-xs font-mono font-bold text-forest-950">
                                  Settlement Total: ₹{Number(ord.total_amount).toLocaleString("en-IN")}
                                </div>
                              </div>

                              {/* Delivery & Notes Grid */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                <div className="p-3 bg-ivory-50/70 rounded-lg border border-ivory-200">
                                  <span className="font-semibold text-forest-900 block mb-1">Destination Address:</span>
                                  <p className="text-forest-700 leading-relaxed">
                                    {ord.delivery_address || "No street address specified"}
                                    {ord.delivery_city ? `, ${ord.delivery_city}` : ""}
                                    {ord.delivery_state ? `, ${ord.delivery_state}` : ""}
                                    {ord.delivery_pincode ? ` - ${ord.delivery_pincode}` : ""}
                                  </p>
                                </div>

                                <div className="p-3 bg-ivory-50/70 rounded-lg border border-ivory-200">
                                  <span className="font-semibold text-forest-900 block mb-1">Special Notes / Moderation:</span>
                                  <p className="text-forest-700 italic">
                                    {ord.notes ? `"${ord.notes}"` : "No special instructions provided."}
                                  </p>
                                </div>
                              </div>

                              {/* Items Table */}
                              <div className="border border-ivory-200 rounded-lg overflow-hidden">
                                <table className="w-full text-left text-xs">
                                  <thead className="bg-ivory-100/80 border-b border-ivory-200 text-forest-700 font-mono uppercase text-[10px]">
                                    <tr>
                                      <th className="py-2 px-3">Item</th>
                                      <th className="py-2 px-3 font-mono">Quantity</th>
                                      <th className="py-2 px-3 font-mono">Price at Purchase</th>
                                      <th className="py-2 px-3 font-mono text-right">Subtotal</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-ivory-100">
                                    {ord.items?.map((item) => (
                                      <tr key={item.id}>
                                        <td className="py-2 px-3 font-medium text-forest-950">
                                          {item.product?.name || `Product #${item.product_id}`}
                                        </td>
                                        <td className="py-2 px-3 font-mono text-forest-800">
                                          {item.quantity} {item.product?.unit || "units"}
                                        </td>
                                        <td className="py-2 px-3 font-mono text-forest-800">
                                          ₹{item.unit_price_at_purchase}
                                        </td>
                                        <td className="py-2 px-3 font-mono font-bold text-forest-950 text-right">
                                          ₹{item.subtotal}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transition Modal */}
      {selectedOrderForAction && (
        <div className="fixed inset-0 z-50 bg-forest-950/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-ivory-200 space-y-4">
            <div>
              <h3 className="font-serif font-bold text-lg text-forest-950">
                Update Order #{selectedOrderForAction.id} Status
              </h3>
              <p className="text-xs text-forest-600 mt-1">
                Current Status: <span className="font-semibold uppercase">{selectedOrderForAction.status}</span>.
                Select the next operational stage or perform an administrative intervention.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-forest-800 mb-1">Target Order Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as OrderStatusType)}
                className="w-full text-xs p-2.5 rounded-lg border border-ivory-300 bg-ivory-50/50 text-forest-950 focus:outline-none focus:ring-1 focus:ring-forest-600"
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="ready">Ready for Dispatch / Pickup</option>
                <option value="dispatched">Dispatched in Transit</option>
                <option value="delivered">Delivered to Buyer</option>
                <option value="completed">Completed / Finalized</option>
                <option value="cancelled">Cancelled (Restores Farmer Stock)</option>
                <option value="rejected">Rejected (Restores Farmer Stock)</option>
              </select>
            </div>

            {(newStatus === "cancelled" || newStatus === "rejected") && (
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-xs">
                <span className="font-bold block mb-0.5">Automated Inventory Protection:</span>
                Transitioning this order to <span className="font-semibold uppercase">{newStatus}</span> will automatically increment the farmer&apos;s available stock for all line items in this order.
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-forest-800 mb-1">Administrative Notes (Optional)</label>
              <textarea
                rows={2}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Reason for change, logistics tracking ref, or administrative resolution notes..."
                className="w-full text-xs p-2.5 rounded-lg border border-ivory-300 bg-ivory-50/50 text-forest-950 focus:outline-none focus:ring-1 focus:ring-forest-600"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-ivory-200">
              <button
                type="button"
                onClick={() => setSelectedOrderForAction(null)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-forest-700 hover:bg-ivory-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmStatusUpdate}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-forest-800 hover:bg-forest-900 text-ivory-50 transition-colors shadow-subtle disabled:opacity-50"
              >
                {isSubmitting ? "Updating..." : "Confirm Status Update"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-xs text-forest-600">Loading orders oversight...</div>}>
      <AdminOrdersContent />
    </Suspense>
  );
}
