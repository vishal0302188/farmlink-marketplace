"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { submitCartCheckout, CheckoutPayload } from "@/lib/api";

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { items, totalAmount, clearCart } = useCart();

  // Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  
  // Fulfillment & Logistics Preference
  const [fulfillmentType, setFulfillmentType] = useState<"pickup" | "delivery">("delivery");
  const [fulfillmentMethod, setFulfillmentMethod] = useState("direct_local_delivery");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryCity, setDeliveryCity] = useState("");
  const [deliveryState, setDeliveryState] = useState("");
  const [deliveryPincode, setDeliveryPincode] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  
  // Payment Simulation
  const [paymentMethod, setPaymentMethod] = useState("cash_on_delivery");
  
  // Status states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Route Protection & Role Checks
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace("/login?redirect=/checkout");
      } else if (user.role === "farmer") {
        router.replace("/farmer/dashboard?notice=purchasing_requires_buyer");
      } else if (user.role === "admin") {
        router.replace("/admin");
      }
    }
  }, [user, authLoading, router]);

  // Autofill from user profile if authenticated as buyer
  useEffect(() => {
    if (user && user.role === "buyer") {
      setFullName(user.fullName || "");
      setEmail(user.email || "");
      if (user.location) setDeliveryAddress(user.location);
      if (user.district) setDeliveryCity(user.district);
      if (user.state) setDeliveryState(user.state);
      if (user.pincode) setDeliveryPincode(user.pincode);
    }
  }, [user]);

  // Adjust payment method when fulfillmentType changes
  useEffect(() => {
    if (fulfillmentType === "pickup") {
      setPaymentMethod("cash_on_pickup");
      setFulfillmentMethod("farm_gate_pickup");
    } else {
      setPaymentMethod("cash_on_delivery");
      setFulfillmentMethod("temperature_controlled_freight");
    }
  }, [fulfillmentType]);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!user) {
      setErrorMessage("Please sign in or create an account to finalize your direct farm order.");
      return;
    }

    if (user.role === "farmer") {
      setErrorMessage("You are signed in with a Farmer account. Orders must be submitted by a Buyer account. Please switch accounts or register as a buyer.");
      return;
    }

    if (items.length === 0) {
      setErrorMessage("Your cart is empty. Please add produce lots before proceeding to checkout.");
      return;
    }

    if (fulfillmentType === "delivery") {
      if (!deliveryAddress.trim() || !deliveryCity.trim() || !deliveryState.trim() || !deliveryPincode.trim()) {
        setErrorMessage("Please complete all required delivery destination fields.");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const payload: CheckoutPayload = {
        items: items.map((i) => ({
          product_id: Number(i.product.id),
          quantity: i.quantity,
        })),
        fulfillment_method: fulfillmentMethod,
        payment_method: paymentMethod,
        delivery_address: fulfillmentType === "delivery" ? deliveryAddress : "Farm-gate pickup designated by buyer",
        delivery_city: deliveryCity,
        delivery_state: deliveryState,
        delivery_pincode: deliveryPincode,
        notes: orderNotes.trim() ? `${orderNotes.trim()} [Recipient: ${fullName}, Phone: ${phone}]` : `[Recipient: ${fullName}, Phone: ${phone}]`,
      };

      const result = await submitCartCheckout(payload);

      if (result.error || !result.data) {
        throw new Error(result.error || "Failed to process checkout.");
      }

      // Clear local cart
      clearCart();

      // Redirect to orders overview with first order or list
      if (result.data.length === 1) {
        router.push(`/buyer/orders/${result.data[0].id}?success=true`);
      } else {
        router.push(`/buyer/orders?placed=${result.totalOrders || result.data.length}`);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
      setIsSubmitting(false);
    }
  };

  if (authLoading || !user || user.role !== "buyer") {
    return (
      <div className="min-h-screen flex flex-col bg-ivory-50 text-forest-950">
        <Navbar />
        <main className="flex-1 py-20 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-4 border-forest-800 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <div className="text-sm font-medium text-forest-800">
              {user?.role === "farmer"
                ? "Redirecting to Farmer Dashboard — purchasing produce requires an active Buyer account."
                : user?.role === "admin"
                ? "Redirecting to Admin Portal — administrative accounts cannot place buyer orders."
                : "Redirecting to login..."}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-ivory-50 text-forest-950">
      <Navbar />

      <main className="flex-1 py-12">
        <Container size="xl">
          {/* Header */}
          <div className="mb-8">
            <Link href="/cart" className="text-xs font-semibold text-forest-700 hover:text-forest-950 flex items-center gap-1 mb-2">
              &larr; Return to Cart
            </Link>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-forest-950">
              Procurement Checkout
            </h1>
            <p className="text-sm text-forest-700/80 mt-1 max-w-2xl leading-relaxed">
              Confirm receiving coordinates and logistics preference for direct farm shipment.
            </p>
          </div>

          {!user && (
            <div className="mb-8 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="font-semibold block text-sm">Account Required for Order Placement</span>
                <span className="text-xs text-amber-800">
                  Please sign in or register as a buyer to associate order tracking and farm-gate dispatch notifications with your profile.
                </span>
              </div>
              <div className="flex items-center gap-2.5 flex-shrink-0">
                <Link href="/login?redirect=/checkout">
                  <Button variant="primary" size="sm">Sign In</Button>
                </Link>
                <Link href="/register?redirect=/checkout">
                  <Button variant="secondary" size="sm">Register</Button>
                </Link>
              </div>
            </div>
          )}

          {items.length === 0 ? (
            <div className="bg-white border border-ivory-200 rounded-2xl p-10 text-center shadow-card max-w-lg mx-auto">
              <h2 className="text-xl font-serif font-bold text-forest-950 mb-2">Cart is Empty</h2>
              <p className="text-xs text-forest-700/80 mb-5">There are no items in your cart to checkout.</p>
              <Link href="/marketplace">
                <Button variant="primary">Browse Marketplace</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Checkout Details Form (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                {/* 1. Buyer Information */}
                <div className="bg-white border border-ivory-200 rounded-xl p-6 shadow-subtle space-y-4">
                  <h2 className="text-lg font-serif font-bold text-forest-950 border-b border-ivory-200 pb-2.5 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-forest-100 text-forest-900 text-xs font-bold flex items-center justify-center font-mono">
                      1
                    </span>
                    <span>Recipient & Contact Details</span>
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Full Name / Purchasing Contact"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      placeholder="e.g. Ramesh Patel"
                    />
                    <Input
                      label="Email Address (Order Confirmations)"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="buyer@example.com"
                    />
                    <div className="sm:col-span-2">
                      <Input
                        label="Phone Number (Logistics & Farm Coordination)"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Fulfillment Preference */}
                <div className="bg-white border border-ivory-200 rounded-xl p-6 shadow-subtle space-y-4">
                  <h2 className="text-lg font-serif font-bold text-forest-950 border-b border-ivory-200 pb-2.5 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-forest-100 text-forest-900 text-xs font-bold flex items-center justify-center font-mono">
                      2
                    </span>
                    <span>Fulfillment & Dispatch Preference</span>
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFulfillmentType("delivery")}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        fulfillmentType === "delivery"
                          ? "border-forest-700 bg-forest-50/50 ring-1 ring-forest-700"
                          : "border-ivory-300 hover:border-ivory-400 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm text-forest-950">Freight / Delivery</span>
                        <span className="text-[10px] font-mono uppercase bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                          Standard
                        </span>
                      </div>
                      <p className="text-xs text-forest-600 leading-normal">
                        Temperature-monitored direct regional transport delivered to your address.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFulfillmentType("pickup")}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        fulfillmentType === "pickup"
                          ? "border-forest-700 bg-forest-50/50 ring-1 ring-forest-700"
                          : "border-ivory-300 hover:border-ivory-400 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm text-forest-950">Farm-Gate Pickup</span>
                        <span className="text-[10px] font-mono uppercase bg-forest-100 text-forest-800 font-bold px-2 py-0.5 rounded">
                          Self Pickup
                        </span>
                      </div>
                      <p className="text-xs text-forest-600 leading-normal">
                        Collect harvested batches directly from the grower&apos;s packing facility.
                      </p>
                    </button>
                  </div>

                  {fulfillmentType === "delivery" && (
                    <div className="space-y-4 pt-2 border-t border-ivory-100">
                      <Input
                        label="Street Delivery Address"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        required
                        placeholder="Plot No., Street, Landmark"
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <Input
                          label="City / District"
                          value={deliveryCity}
                          onChange={(e) => setDeliveryCity(e.target.value)}
                          required
                          placeholder="Bengaluru"
                        />
                        <Input
                          label="State"
                          value={deliveryState}
                          onChange={(e) => setDeliveryState(e.target.value)}
                          required
                          placeholder="Karnataka"
                        />
                        <Input
                          label="PIN Code"
                          value={deliveryPincode}
                          onChange={(e) => setDeliveryPincode(e.target.value)}
                          required
                          placeholder="560038"
                        />
                      </div>
                    </div>
                  )}

                  {/* Order Notes */}
                  <div className="pt-2">
                    <label className="block text-xs font-mono uppercase tracking-wider text-forest-700 font-semibold mb-1.5">
                      Special Handling or Logistics Notes (Optional)
                    </label>
                    <textarea
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      rows={2}
                      className="w-full text-xs rounded-lg border border-ivory-300 p-3 text-forest-950 bg-white focus:outline-none focus:ring-1 focus:ring-forest-600"
                      placeholder="e.g. Unloading bay access timing, crate return policy preference, etc."
                    />
                  </div>
                </div>

                {/* 3. Payment Method Simulation */}
                <div className="bg-white border border-ivory-200 rounded-xl p-6 shadow-subtle space-y-4">
                  <h2 className="text-lg font-serif font-bold text-forest-950 border-b border-ivory-200 pb-2.5 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-forest-100 text-forest-900 text-xs font-bold flex items-center justify-center font-mono">
                      3
                    </span>
                    <span>Payment Method</span>
                  </h2>

                  <div className="p-4 rounded-xl bg-ivory-100/70 border border-ivory-300 space-y-2">
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        id="simulated-payment"
                        checked={true}
                        readOnly
                        className="text-forest-800 focus:ring-forest-600 h-4 w-4"
                      />
                      <label htmlFor="simulated-payment" className="font-semibold text-sm text-forest-950">
                        {fulfillmentType === "pickup" ? "Cash on Farm-Gate Pickup" : "Cash on Delivery / Direct Bank Remittance"}
                      </label>
                    </div>
                    <p className="text-xs text-forest-700/80 pl-7 leading-relaxed">
                      FarmLink operates direct commercial settlement. No real card numbers or CVVs are collected on this platform. Payment is settled directly upon physical delivery and harvest inspection.
                    </p>
                  </div>
                </div>

                {/* Error Banner */}
                {errorMessage && (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 flex items-start gap-3">
                    <svg className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{errorMessage}</span>
                  </div>
                )}
              </div>

              {/* Order Summary & Submission (5 cols) */}
              <div className="lg:col-span-5">
                <div className="bg-white border border-ivory-200 rounded-xl p-6 shadow-subtle space-y-5 sticky top-28">
                  <h2 className="text-lg font-serif font-bold text-forest-950 border-b border-ivory-200 pb-3">
                    Order Items ({items.length})
                  </h2>

                  <div className="divide-y divide-ivory-100 max-h-72 overflow-y-auto space-y-3 pr-1">
                    {items.map(({ product, quantity }) => (
                      <div key={product.id} className="pt-3 first:pt-0 flex items-center justify-between gap-3 text-xs">
                        <div className="min-w-0 flex-1">
                          <span className="font-semibold text-forest-950 block truncate">{product.title}</span>
                          <span className="text-forest-600">
                            {quantity} {product.unit} &times; ₹{product.pricePerUnit.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-forest-500 block truncate">Grower: {product.farmerName}</span>
                        </div>
                        <div className="font-mono font-bold text-forest-950 text-right">
                          ₹{(quantity * product.pricePerUnit).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-ivory-200 space-y-2.5 text-xs text-forest-700">
                    <div className="flex justify-between">
                      <span>Harvest Lots Subtotal</span>
                      <span className="font-mono font-semibold text-forest-950">₹{totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fulfillment & Handling</span>
                      <span className="font-mono text-emerald-700 font-semibold">
                        {fulfillmentType === "pickup" ? "₹0.00 (Farm Pickup)" : "Direct Farm Logistics"}
                      </span>
                    </div>

                    <div className="pt-3 border-t border-ivory-200 flex items-baseline justify-between">
                      <span className="font-bold text-base text-forest-950">Total Payable</span>
                      <div className="text-right">
                        <span className="text-2xl font-serif font-bold text-forest-950 block">
                          ₹{totalAmount.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-forest-600 font-mono">INR</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full text-base font-semibold"
                    disabled={isSubmitting || items.length === 0}
                  >
                    {isSubmitting ? "Transacting with Farm Registry..." : `Confirm & Place Order • ₹${totalAmount.toFixed(2)}`}
                  </Button>

                  <p className="text-[11px] text-forest-600/80 text-center leading-normal">
                    By submitting, your order is recorded in the agricultural ledger. Reserved inventory is locked immediately with the farm.
                  </p>
                </div>
              </div>
            </form>
          )}
        </Container>
      </main>

      <Footer />
    </div>
  );
}
