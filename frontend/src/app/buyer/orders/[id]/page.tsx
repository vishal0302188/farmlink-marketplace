"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { fetchBuyerOrderDetail, cancelBuyerOrder } from "@/lib/api";
import { ApiOrder, OrderStatusType } from "@/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function BuyerOrderDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.id;
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const loadOrderDetail = useCallback(async () => {
    setIsLoading(true);
    const res = await fetchBuyerOrderDetail(orderId);
    if (res.order) {
      setOrder(res.order);
    } else {
      setActionMessage({ text: res.error || "Order not found or unauthorized.", type: "error" });
    }
    setIsLoading(false);
  }, [orderId]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirect=/buyer/orders/${orderId}`);
      return;
    }
    if (user) {
      if (user.role === "farmer") {
        router.push("/farmer/dashboard");
        return;
      }
      loadOrderDetail();
    }
  }, [user, authLoading, orderId, loadOrderDetail, router]);

  const handleCancelOrder = async () => {
    if (!order) return;
    if (!confirm(`Are you sure you want to cancel Order #${order.id}? All reserved inventory will be returned to the farmer.`)) {
      return;
    }

    setIsCancelling(true);
    const res = await cancelBuyerOrder(order.id, "Buyer requested cancellation");
    setIsCancelling(false);

    if (res.success && res.order) {
      setOrder(res.order);
      setActionMessage({ text: "Order was cancelled successfully and reserved inventory was restored.", type: "success" });
    } else {
      setActionMessage({ text: res.error || "Failed to cancel order.", type: "error" });
    }
  };

  const getStatusBadge = (status: OrderStatusType) => {
    switch (status) {
      case "pending":
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-200">Pending Review</span>;
      case "confirmed":
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-900 border border-blue-200">Accepted by Farmer</span>;
      case "ready":
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-900 border border-purple-200">Packed & Ready</span>;
      case "dispatched":
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-cyan-100 text-cyan-900 border border-cyan-200">In Transit</span>;
      case "delivered":
      case "completed":
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-200">Fulfilled</span>;
      case "cancelled":
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-200">Cancelled</span>;
      case "rejected":
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-900 border border-red-200">Rejected by Farmer</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-ivory-200 text-forest-800">{status}</span>;
    }
  };

  const canCancel = order?.status === "pending" || order?.status === "confirmed";

  return (
    <div className="min-h-screen flex flex-col bg-ivory-50 text-forest-950">
      <Navbar />

      <main className="flex-1 py-12">
        <Container size="lg">
          {/* Back Navigation */}
          <div className="mb-6">
            <Link
              href="/buyer/orders"
              className="text-xs font-semibold text-forest-700 hover:text-forest-950 inline-flex items-center gap-1.5"
            >
              &larr; Return to All Orders
            </Link>
          </div>

          {actionMessage && (
            <div
              className={`mb-6 p-4 rounded-xl text-xs flex items-center justify-between ${
                actionMessage.type === "success"
                  ? "bg-emerald-50 border border-emerald-200 text-emerald-900"
                  : "bg-red-50 border border-red-200 text-red-900"
              }`}
            >
              <span>{actionMessage.text}</span>
              <button
                type="button"
                onClick={() => setActionMessage(null)}
                className="font-bold ml-4 text-sm"
              >
                &times;
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="bg-white border border-ivory-200 rounded-2xl p-12 text-center shadow-card animate-pulse">
              <div className="w-12 h-12 rounded-full bg-forest-100/50 mx-auto mb-3" />
              <p className="text-xs font-mono text-forest-600">Loading order verification #{orderId}...</p>
            </div>
          ) : !order ? (
            <div className="bg-white border border-ivory-200 rounded-2xl p-12 text-center shadow-card">
              <h2 className="text-xl font-serif font-bold text-forest-950 mb-2">Order Not Found</h2>
              <p className="text-xs text-forest-700/80 mb-6">
                Unable to locate order #{orderId}. It may belong to another user or does not exist.
              </p>
              <Link href="/buyer/orders">
                <Button variant="primary" size="sm">Back to My Orders</Button>
              </Link>
            </div>
          ) : (
            <div className="bg-white border border-ivory-200 rounded-2xl shadow-card overflow-hidden">
              {/* Order Header Banner */}
              <div className="p-6 sm:p-8 bg-forest-950 text-ivory-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight">
                      Order #{order.id}
                    </h1>
                    {getStatusBadge(order.status)}
                  </div>
                  <p className="text-xs text-ivory-300 font-mono mt-1">
                    Placed on {new Date(order.created_at).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-xs text-ivory-300 block">Total Transaction</span>
                  <span className="text-3xl font-serif font-bold text-ivory-50">
                    ₹{Number(order.total_amount).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Order Progress Tracker */}
              <div className="p-6 border-b border-ivory-200 bg-ivory-50/50">
                <h3 className="text-xs font-mono uppercase tracking-wider text-forest-700 font-semibold mb-4">
                  Fulfillment Status Pipeline
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  {/* Step 1: Placed */}
                  <div className={`p-3 rounded-lg border ${
                    order.status !== "rejected" && order.status !== "cancelled"
                      ? "border-emerald-300 bg-emerald-50/60 text-emerald-950"
                      : "border-ivory-200 bg-white text-forest-500"
                  }`}>
                    <span className="font-bold block">1. Placed</span>
                    <span className="text-[11px] text-forest-600">Stock reserved</span>
                  </div>

                  {/* Step 2: Accepted */}
                  <div className={`p-3 rounded-lg border ${
                    ["confirmed", "ready", "dispatched", "completed", "delivered"].includes(order.status)
                      ? "border-emerald-300 bg-emerald-50/60 text-emerald-950"
                      : "border-ivory-200 bg-white text-forest-500"
                  }`}>
                    <span className="font-bold block">2. Accepted</span>
                    <span className="text-[11px] text-forest-600">Farmer preparing</span>
                  </div>

                  {/* Step 3: Ready / Packed */}
                  <div className={`p-3 rounded-lg border ${
                    ["ready", "dispatched", "completed", "delivered"].includes(order.status)
                      ? "border-emerald-300 bg-emerald-50/60 text-emerald-950"
                      : "border-ivory-200 bg-white text-forest-500"
                  }`}>
                    <span className="font-bold block">3. Ready</span>
                    <span className="text-[11px] text-forest-600">Packed at source</span>
                  </div>

                  {/* Step 4: Completed */}
                  <div className={`p-3 rounded-lg border ${
                    ["completed", "delivered"].includes(order.status)
                      ? "border-emerald-300 bg-emerald-50/60 text-emerald-950"
                      : "border-ivory-200 bg-white text-forest-500"
                  }`}>
                    <span className="font-bold block">4. Fulfilled</span>
                    <span className="text-[11px] text-forest-600">Received & settled</span>
                  </div>
                </div>

                {order.status === "cancelled" && (
                  <div className="mt-3 p-3 bg-gray-100 border border-gray-200 rounded-lg text-xs text-gray-800">
                    <strong>Notice:</strong> This order was cancelled. Reserved produce stock was restored to the farmer catalog.
                  </div>
                )}

                {order.status === "rejected" && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-900">
                    <strong>Notice:</strong> The grower was unable to accept this order batch. Reserved produce stock was returned.
                  </div>
                )}
              </div>

              {/* Items Table */}
              <div className="p-6 sm:p-8 space-y-6">
                <div>
                  <h3 className="text-sm font-serif font-bold text-forest-950 mb-3">
                    Purchased Produce Lots
                  </h3>
                  <div className="border border-ivory-200 rounded-xl overflow-hidden divide-y divide-ivory-200">
                    {order.items.map((item) => (
                      <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold text-forest-950 text-sm block">
                            {item.product?.name || `Product #${item.product_id}`}
                          </span>
                          <span className="text-forest-600 font-mono">
                            Category: {item.product?.category?.replace(/_/g, " ") || "Produce"}
                          </span>
                        </div>

                        <div className="flex items-center gap-6 text-right">
                          <div>
                            <span className="text-forest-500 block">Unit Price</span>
                            <span className="font-mono text-forest-900">₹{Number(item.unit_price_at_purchase).toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-forest-500 block">Quantity</span>
                            <span className="font-mono font-semibold text-forest-950">{item.quantity} {item.product?.unit || "units"}</span>
                          </div>
                          <div className="min-w-[80px]">
                            <span className="text-forest-500 block">Subtotal</span>
                            <span className="font-mono font-bold text-forest-950 text-sm">₹{Number(item.subtotal).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Logistics & Delivery Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                  <div className="p-4 rounded-xl bg-ivory-50 border border-ivory-200 space-y-2 text-xs">
                    <span className="font-mono uppercase text-forest-700 font-bold block">Logistics & Receiving</span>
                    <div>
                      <span className="text-forest-600 block">Fulfillment Method</span>
                      <strong className="text-forest-950 capitalize">{order.fulfillment_method.replace(/_/g, " ")}</strong>
                    </div>
                    {order.delivery_address && (
                      <div className="pt-1">
                        <span className="text-forest-600 block">Destination Address</span>
                        <span className="text-forest-900 font-medium">
                          {order.delivery_address}
                          {order.delivery_city ? `, ${order.delivery_city}` : ""}
                          {order.delivery_state ? `, ${order.delivery_state}` : ""}
                          {order.delivery_pincode ? ` - ${order.delivery_pincode}` : ""}
                        </span>
                      </div>
                    )}
                    {order.notes && (
                      <div className="pt-1">
                        <span className="text-forest-600 block">Order Notes</span>
                        <span className="text-forest-800">{order.notes}</span>
                      </div>
                    )}
                  </div>

                  <div className="p-4 rounded-xl bg-ivory-50 border border-ivory-200 space-y-2 text-xs">
                    <span className="font-mono uppercase text-forest-700 font-bold block">Financial Summary</span>
                    <div>
                      <span className="text-forest-600 block">Payment Method</span>
                      <strong className="text-forest-950 capitalize">{order.payment_method?.replace(/_/g, " ") || "Cash on Delivery"}</strong>
                    </div>
                    <div className="pt-1 flex justify-between border-t border-ivory-200">
                      <span className="text-forest-600">Total Produce Volume</span>
                      <span className="font-mono font-semibold text-forest-900">{order.items.reduce((s, i) => s + Number(i.quantity), 0)} units</span>
                    </div>
                    <div className="pt-1 flex justify-between">
                      <span className="font-bold text-forest-950">Grand Total</span>
                      <span className="font-mono font-bold text-forest-950 text-base">₹{Number(order.total_amount).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Cancellation & Action Controls */}
                <div className="pt-4 border-t border-ivory-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs text-forest-600">
                    {canCancel ? (
                      <span>Orders may be cancelled while in <strong>Pending</strong> or <strong>Confirmed</strong> status.</span>
                    ) : (
                      <span>Order status is finalized and cannot be modified online.</span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    {canCancel && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isCancelling}
                        onClick={handleCancelOrder}
                        className="text-red-700 border-red-300 hover:bg-red-50 hover:text-red-800 w-full sm:w-auto"
                      >
                        {isCancelling ? "Cancelling..." : "Cancel Order"}
                      </Button>
                    )}
                    <Link href="/buyer/orders" className="w-full sm:w-auto">
                      <Button variant="secondary" size="sm" className="w-full sm:w-auto">
                        Back to My Orders
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Container>
      </main>

      <Footer />
    </div>
  );
}
