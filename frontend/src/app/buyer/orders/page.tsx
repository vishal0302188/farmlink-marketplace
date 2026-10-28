"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { fetchBuyerOrders, cancelBuyerOrder } from "@/lib/api";
import { ApiOrder, OrderStatusType } from "@/types";

export default function BuyerOrdersPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [actionMessage, setActionMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    const filter = selectedStatus === "all" ? undefined : selectedStatus;
    const res = await fetchBuyerOrders(filter);
    if (res.orders) {
      setOrders(res.orders);
    }
    setIsLoading(false);
  }, [selectedStatus]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/buyer/orders");
      return;
    }
    if (user) {
      if (user.role === "farmer") {
        router.push("/farmer/dashboard");
        return;
      }
      loadOrders();
    }
  }, [user, authLoading, loadOrders, router]);

  const handleCancelOrder = async (orderId: number) => {
    if (!confirm(`Are you sure you want to cancel Order #${orderId}? Reserved inventory will be returned to the farmer.`)) {
      return;
    }

    const res = await cancelBuyerOrder(orderId, "Cancelled by buyer");
    if (res.success) {
      setActionMessage({ text: `Order #${orderId} was cancelled successfully. Stock has been restored.`, type: "success" });
      loadOrders();
    } else {
      setActionMessage({ text: res.error || "Failed to cancel order.", type: "error" });
    }
  };

  const getStatusBadge = (status: OrderStatusType) => {
    switch (status) {
      case "pending":
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-200">Pending Review</span>;
      case "confirmed":
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-900 border border-blue-200">Accepted by Farmer</span>;
      case "ready":
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-900 border border-purple-200">Packed & Ready</span>;
      case "dispatched":
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-100 text-cyan-900 border border-cyan-200">In Transit</span>;
      case "delivered":
      case "completed":
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-200">Fulfilled</span>;
      case "cancelled":
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-200">Cancelled</span>;
      case "rejected":
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-900 border border-red-200">Rejected by Farmer</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-ivory-200 text-forest-800">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-ivory-50 text-forest-950">
      <Navbar />

      <main className="flex-1 py-12">
        <Container size="xl">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-forest-600 font-semibold">
                Buyer Operations
              </span>
              <h1 className="text-3xl sm:text-4xl font-serif font-bold text-forest-950 mt-1">
                My Farm Orders
              </h1>
              <p className="text-sm text-forest-700/80 mt-1 max-w-xl">
                Track real-time harvest fulfillment, delivery logistics, and historical agricultural procurements.
              </p>
            </div>

            <Link href="/marketplace">
              <Button variant="primary">
                Browse Marketplace &rarr;
              </Button>
            </Link>
          </div>

          {/* Action Message Banner */}
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

          {/* Status Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 text-xs font-semibold">
            {["all", "pending", "confirmed", "ready", "completed", "cancelled"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setSelectedStatus(st)}
                className={`px-3.5 py-1.5 rounded-lg capitalize whitespace-nowrap transition-colors ${
                  selectedStatus === st
                    ? "bg-forest-800 text-ivory-50 shadow-subtle"
                    : "bg-white text-forest-700 border border-ivory-200 hover:bg-ivory-100"
                }`}
              >
                {st === "all" ? "All Orders" : st}
              </button>
            ))}
          </div>

          {/* Orders List */}
          {isLoading ? (
            <div className="bg-white border border-ivory-200 rounded-2xl p-12 text-center">
              <div className="w-10 h-10 rounded-full bg-forest-100/50 mx-auto mb-3 animate-pulse" />
              <p className="text-xs font-mono text-forest-600">Retrieving authoritative order ledgers...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white border border-ivory-200 rounded-2xl p-12 text-center max-w-lg mx-auto shadow-card">
              <div className="w-12 h-12 rounded-full bg-forest-50 text-forest-700 flex items-center justify-center mx-auto mb-3 border border-forest-200">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-serif font-bold text-forest-950 mb-1">
                No Orders Found
              </h3>
              <p className="text-xs text-forest-700/80 mb-5">
                {selectedStatus === "all"
                  ? "You haven't submitted any orders yet."
                  : `You have no orders currently in '${selectedStatus}' status.`}
              </p>
              <Link href="/marketplace">
                <Button variant="primary" size="sm">Explore Catalog</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const canCancel = order.status === "pending" || order.status === "confirmed";

                return (
                  <div
                    key={order.id}
                    className="bg-white border border-ivory-200 rounded-xl p-6 shadow-subtle hover:border-forest-200 transition-all space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-ivory-100">
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-forest-950 text-base">
                            Order #{order.id}
                          </span>
                          {getStatusBadge(order.status)}
                        </div>
                        <span className="text-xs text-forest-500 font-mono block mt-1">
                          Placed on {new Date(order.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="text-xs text-forest-600 block">Total Amount</span>
                        <span className="text-xl font-serif font-bold text-forest-950">
                          ₹{Number(order.total_amount).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Items Summary */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {order.items.map((item) => (
                        <div key={item.id} className="p-3 bg-ivory-50 rounded-lg border border-ivory-200 text-xs">
                          <span className="font-semibold text-forest-950 block truncate">
                            {item.product?.name || `Product #${item.product_id}`}
                          </span>
                          <span className="text-forest-600 font-mono">
                            {item.quantity} {item.product?.unit || "units"} &times; ₹{Number(item.unit_price_at_purchase).toFixed(2)}
                          </span>
                          <span className="text-forest-950 font-mono font-bold block mt-0.5">
                            ₹{Number(item.subtotal).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Footer Details & Action buttons */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-forest-600">
                      <div className="flex flex-wrap items-center gap-3">
                        <span>Fulfillment: <strong className="text-forest-900 capitalize">{order.fulfillment_method.replace(/_/g, " ")}</strong></span>
                        <span>&bull;</span>
                        <span>Payment: <strong className="text-forest-900 capitalize">{order.payment_method?.replace(/_/g, " ") || "COD"}</strong></span>
                      </div>

                      <div className="flex items-center gap-2.5">
                        {canCancel && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-700 border-red-300 hover:bg-red-50 hover:text-red-800"
                            onClick={() => handleCancelOrder(order.id)}
                          >
                            Cancel Order
                          </Button>
                        )}
                        <Link href={`/buyer/orders/${order.id}`}>
                          <Button variant="secondary" size="sm">
                            View Order Details &rarr;
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Container>
      </main>

      <Footer />
    </div>
  );
}
