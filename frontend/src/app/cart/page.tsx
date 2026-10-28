"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { ImageFallback } from "@/components/ui/ImageFallback";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

export default function CartPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { items, updateQuantity, removeFromCart, clearCart, totalItems, totalAmount } = useCart();

  useEffect(() => {
    if (!authLoading) {
      if (user?.role === "farmer") {
        router.replace("/farmer/dashboard?notice=purchasing_requires_buyer");
      } else if (user?.role === "admin") {
        router.replace("/admin");
      }
    }
  }, [user, authLoading, router]);

  if (!authLoading && (user?.role === "farmer" || user?.role === "admin")) {
    return (
      <div className="min-h-screen flex flex-col bg-ivory-50 text-forest-950 items-center justify-center p-6 text-center">
        <div className="w-10 h-10 border-4 border-forest-800 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-forest-800">
          Redirecting to dashboard &mdash; purchasing produce requires a Buyer account.
        </p>
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
            <span className="text-xs font-mono uppercase tracking-wider text-forest-600 font-semibold">
              Buyer Procurement Cart
            </span>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-forest-950 mt-1">
              Your Farm Order Selection
            </h1>
            <p className="text-sm text-forest-700/80 mt-2 max-w-2xl leading-relaxed">
              Review selected produce lots directly from regional growers. All quantities comply with farm-gate harvest lots and minimum order specifications.
            </p>
          </div>

          {items.length === 0 ? (
            /* Empty Cart State */
            <div className="bg-white border border-ivory-200 rounded-2xl p-12 text-center shadow-card max-w-xl mx-auto my-8">
              <div className="w-16 h-16 rounded-full bg-forest-50 text-forest-700 flex items-center justify-center mx-auto mb-4 border border-forest-200">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h2 className="text-2xl font-serif font-bold text-forest-950 mb-2">
                Your Procurement Cart is Empty
              </h2>
              <p className="text-sm text-forest-700/80 mb-6 leading-relaxed">
                You haven&apos;t added any produce lots yet. Browse verified regional growers and harvest-fresh catalogs to start your direct order.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link href="/marketplace">
                  <Button variant="primary">Explore Produce Catalog</Button>
                </Link>
                <Link href="/">
                  <Button variant="secondary">Back to Home</Button>
                </Link>
              </div>
            </div>
          ) : (
            /* Cart with Items */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Items List (8 cols) */}
              <div className="lg:col-span-8 space-y-4">
                <div className="bg-white border border-ivory-200 rounded-xl shadow-subtle divide-y divide-ivory-200 overflow-hidden">
                  {items.map(({ product, quantity }) => {
                    const itemSubtotal = quantity * product.pricePerUnit;
                    const isMinOrder = quantity <= (product.minOrderQuantity || 1);
                    const isMaxStock = quantity >= product.availableQuantity;

                    return (
                      <div key={product.id} className="p-5 flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between">
                        {/* Product Info */}
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-ivory-200 bg-ivory-100 flex-shrink-0">
                            <ImageFallback
                              src={product.imageUrl}
                              alt={product.title}
                              fill
                              fallbackCategory={product.category}
                              className="object-cover"
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-forest-50 text-forest-800 border border-forest-200 font-semibold">
                                {product.category.replace("_", " & ")}
                              </span>
                              {product.isOrganic && (
                                <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                  Organic
                                </span>
                              )}
                            </div>

                            <Link href={`/marketplace/${product.id}`} className="block focus:underline mt-1">
                              <h3 className="font-serif font-bold text-forest-950 text-base truncate hover:text-forest-800">
                                {product.title}
                              </h3>
                            </Link>

                            <p className="text-xs text-forest-600 truncate">
                              Farmer: <span className="font-medium text-forest-900">{product.farmerName}</span> &bull; {product.farmLocation}
                            </p>

                            <p className="text-xs text-forest-700/80 mt-0.5 font-mono">
                              ₹{product.pricePerUnit.toFixed(2)} / {product.unit} (Min: {product.minOrderQuantity} {product.unit})
                            </p>
                          </div>
                        </div>

                        {/* Quantity and Controls */}
                        <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-ivory-100">
                          <div className="flex items-center border border-ivory-300 rounded-lg overflow-hidden bg-ivory-50">
                            <button
                              type="button"
                              onClick={() => updateQuantity(String(product.id), quantity - 1)}
                              disabled={isMinOrder}
                              className="w-8 h-8 flex items-center justify-center text-forest-800 hover:bg-ivory-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-bold"
                              aria-label="Decrease quantity"
                            >
                              &minus;
                            </button>
                            <input
                              type="number"
                              min={product.minOrderQuantity}
                              max={product.availableQuantity}
                              value={quantity}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                if (!isNaN(val)) {
                                  updateQuantity(String(product.id), val);
                                }
                              }}
                              className="w-14 h-8 text-center font-mono font-semibold text-xs bg-white border-x border-ivory-300 text-forest-950 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => updateQuantity(String(product.id), quantity + 1)}
                              disabled={isMaxStock}
                              className="w-8 h-8 flex items-center justify-center text-forest-800 hover:bg-ivory-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-bold"
                              aria-label="Increase quantity"
                            >
                              &#43;
                            </button>
                          </div>

                          {/* Subtotal */}
                          <div className="text-right min-w-[90px]">
                            <span className="text-xs text-forest-600 block">Subtotal</span>
                            <span className="font-serif font-bold text-base text-forest-950">
                              ₹{itemSubtotal.toFixed(2)}
                            </span>
                          </div>

                          {/* Delete Item */}
                          <button
                            type="button"
                            onClick={() => removeFromCart(String(product.id))}
                            className="p-1.5 rounded-lg text-forest-400 hover:text-red-700 hover:bg-red-50 transition-colors"
                            aria-label="Remove item"
                            title="Remove item"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Clear Cart / Continue Shopping Buttons */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={clearCart}
                    className="text-xs text-red-600 hover:text-red-800 font-medium underline"
                  >
                    Clear All Cart Items
                  </button>
                  <Link href="/marketplace">
                    <Button variant="ghost" size="sm">
                      &larr; Discover More Produce
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Order Summary Sidebar (4 cols) */}
              <div className="lg:col-span-4">
                <div className="bg-white border border-ivory-200 rounded-xl p-6 shadow-subtle space-y-5 sticky top-28">
                  <h2 className="text-lg font-serif font-bold text-forest-950 border-b border-ivory-200 pb-3">
                    Order Summary
                  </h2>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between text-forest-700">
                      <span>Total Produce Lots</span>
                      <span className="font-mono font-medium">{totalItems} {totalItems === 1 ? "item" : "items"}</span>
                    </div>

                    <div className="flex items-center justify-between text-forest-700">
                      <span>Estimated Subtotal</span>
                      <span className="font-mono font-bold text-forest-950">₹{totalAmount.toFixed(2)}</span>
                    </div>

                    <div className="flex items-center justify-between text-forest-700">
                      <span>Fulfillment & Dispatch</span>
                      <span className="text-xs text-forest-600">Calculated at Checkout</span>
                    </div>

                    <div className="pt-3 border-t border-ivory-200 flex items-baseline justify-between">
                      <span className="font-semibold text-base text-forest-950">Total</span>
                      <div className="text-right">
                        <span className="text-2xl font-serif font-bold text-forest-950 block">
                          ₹{totalAmount.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-forest-600 font-mono">INR (All taxes included)</span>
                      </div>
                    </div>
                  </div>

                  <Link href="/checkout" className="block w-full">
                    <Button variant="primary" size="lg" className="w-full text-base font-semibold">
                      Proceed to Checkout &rarr;
                    </Button>
                  </Link>

                  <div className="p-3.5 bg-ivory-100/70 border border-ivory-300 rounded-lg text-[11px] text-forest-700 leading-relaxed">
                    <span className="font-semibold text-forest-900 block mb-0.5">🌾 Direct Harvest Integrity</span>
                    Orders are routed directly to regional farm producers. Multi-farmer baskets are split automatically so each grower manages harvest timing and packing.
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
