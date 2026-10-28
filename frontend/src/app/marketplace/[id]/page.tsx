"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { SAMPLE_PRODUCE } from "@/lib/constants";
import { fetchProductByIdFromBackend } from "@/lib/api";
import { ProduceItem } from "@/types";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ImageFallback } from "@/components/ui/ImageFallback";
import { ProduceCard } from "@/components/marketplace/ProduceCard";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export default function ProductDetailPage({ params }: ProductPageProps) {
  const resolvedParams = use(params);
  const productId = resolvedParams.id;

  const [product, setProduct] = useState<ProduceItem | null>(() => {
    return SAMPLE_PRODUCE.find((p) => p.id === productId) || null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(!product);

  useEffect(() => {
    let isMounted = true;
    fetchProductByIdFromBackend(productId)
      .then((res) => {
        if (!isMounted) return;
        if (res.item) {
          setProduct(res.item);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [productId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-ivory-50 text-forest-950">
        <Navbar />
        <main className="flex-1 py-20 flex items-center justify-center">
          <Container size="md">
            <div className="bg-white border border-ivory-200 rounded-2xl p-12 text-center shadow-card animate-pulse">
              <div className="w-12 h-12 rounded-full bg-forest-100/50 mx-auto mb-4" />
              <div className="h-6 bg-forest-100/40 rounded w-48 mx-auto mb-3" />
              <div className="h-4 bg-forest-100/30 rounded w-64 mx-auto" />
            </div>
          </Container>
        </main>
        <Footer />
      </div>
    );
  }

  // Fallback for unknown product identifiers
  if (!product) {
    return (
      <div className="min-h-screen flex flex-col bg-ivory-50 text-forest-950">
        <Navbar />
        <main className="flex-1 py-20 flex items-center justify-center">
          <Container size="md">
            <div className="bg-white border border-ivory-200 rounded-2xl p-10 text-center shadow-card">
              <div className="w-16 h-16 rounded-full bg-ivory-100 text-forest-700 flex items-center justify-center mx-auto mb-4 border border-ivory-300">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h1 className="text-2xl font-serif font-bold text-forest-950 mb-2">
                Produce Listing Not Found
              </h1>
              <p className="text-sm text-forest-700/80 max-w-md mx-auto mb-6 leading-relaxed">
                The produce identifier <code className="bg-ivory-100 px-2 py-0.5 rounded text-forest-900 font-mono text-xs font-semibold">{productId}</code> is either unlisted or no longer active in our current regional harvest directory.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link href="/marketplace">
                  <Button variant="primary">Browse Active Marketplace</Button>
                </Link>
                <Link href="/">
                  <Button variant="secondary">Return to Homepage</Button>
                </Link>
              </div>
            </div>
          </Container>
        </main>
        <Footer />
      </div>
    );
  }

  return <ProductDetailContent product={product} />;
}

function ProductDetailContent({ product }: { product: ProduceItem }) {
  const { addToCart } = useCart();
  const { user } = useAuth();
  // Gallery photo selection
  const allImages = [product.imageUrl, ...(product.additionalImages || [])];
  const [activeImage, setActiveImage] = useState<string>(product.imageUrl);

  // Quantity selector
  const [quantity, setQuantity] = useState<number>(product.minOrderQuantity || 1);
  const [orderConfirmation, setOrderConfirmation] = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);

  const handleDecrement = () => {
    setQuantity((prev) => Math.max(product.minOrderQuantity, prev - 1));
  };

  const handleIncrement = () => {
    setQuantity((prev) => Math.min(product.availableQuantity, prev + 1));
  };

  const handleQuantityInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
      if (val > product.availableQuantity) {
        setQuantity(product.availableQuantity);
      } else if (val < product.minOrderQuantity) {
        setQuantity(product.minOrderQuantity);
      } else {
        setQuantity(val);
      }
    }
  };

  const handleAddToCart = () => {
    setOrderError(null);
    const res = addToCart(product, quantity);
    if (res.success) {
      setOrderConfirmation(`Added ${quantity} ${product.unit} of ${product.title} to your cart.`);
    } else {
      setOrderError(res.message || "Failed to add to cart.");
    }
  };

  // Related products from sample data
  const relatedProducts = SAMPLE_PRODUCE.filter(
    (p) => p.id !== product.id && (p.category === product.category || p.farmLocation === product.farmLocation)
  ).slice(0, 3);

  const subtotal = (quantity * product.pricePerUnit).toFixed(2);

  return (
    <div className="min-h-screen flex flex-col bg-ivory-50 text-forest-950">
      <Navbar />

      <main className="flex-1 py-10">
        <Container size="xl">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs text-forest-600">
            <Link href="/" className="hover:text-forest-900 transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link href="/marketplace" className="hover:text-forest-900 transition-colors">
              Marketplace
            </Link>
            <span>/</span>
            <span className="capitalize">{product.category.replace("_", " & ")}</span>
            <span>/</span>
            <span className="text-forest-950 font-medium truncate max-w-[200px] sm:max-w-none">
              {product.title}
            </span>
          </nav>

          {/* Product Header / Hero Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Left: Photographs & Gallery (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="relative h-[400px] sm:h-[480px] w-full rounded-2xl overflow-hidden border border-ivory-200 bg-white shadow-card">
                <ImageFallback
                  src={activeImage}
                  alt={product.title}
                  fill
                  priority
                  fallbackCategory={product.category}
                  className="object-cover"
                />
                <div className="absolute top-4 left-4 flex flex-wrap gap-2 z-10">
                  {product.isOrganic && (
                    <Badge variant="forest" size="md" dot>
                      Certified Organic
                    </Badge>
                  )}
                  {product.grade && (
                    <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-forest-950/80 text-ivory-50 backdrop-blur-xs">
                      {product.grade}
                    </span>
                  )}
                </div>
              </div>

              {/* Thumbnail Selector */}
              {allImages.length > 1 && (
                <div className="flex items-center gap-3 overflow-x-auto pb-2">
                  {allImages.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImage(img)}
                      className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                        activeImage === img
                          ? "border-forest-800 ring-2 ring-forest-800/30 scale-102"
                          : "border-ivory-300 opacity-70 hover:opacity-100"
                      }`}
                    >
                      <ImageFallback
                        src={img}
                        alt={`${product.title} perspective ${idx + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Produce Details & Order Panel (5 cols) */}
            <div className="lg:col-span-5 bg-white border border-ivory-200 rounded-2xl p-6 sm:p-8 shadow-card space-y-6">
              <div>
                {/* Farmer / Origin Tag */}
                <div className="flex items-center gap-2 text-xs text-forest-700 mb-2">
                  <span className="font-semibold text-forest-900">{product.farmerName}</span>
                  <span>&bull;</span>
                  <span>{product.farmLocation}</span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-serif font-bold text-forest-950 tracking-tight leading-tight">
                  {product.title}
                </h1>

                <p className="text-xs sm:text-sm text-forest-700/80 mt-3 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Price & Unit Details */}
              <div className="py-4 border-y border-ivory-200 space-y-2">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-3xl font-serif font-bold text-forest-950">
                      ₹{product.pricePerUnit.toFixed(2)}
                    </span>
                    <span className="text-sm font-medium text-forest-600 ml-1">
                      per {product.unit}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-medium text-forest-800 bg-forest-50 px-2.5 py-1 rounded-md border border-forest-200">
                      {product.availableQuantity} {product.unit} available
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-forest-600 pt-1">
                  <span>Minimum order: {product.minOrderQuantity} {product.unit}</span>
                  <span>Harvest date: {product.harvestDate}</span>
                </div>
              </div>

              {/* Role-Based Actions & Purchasing Controls */}
              {user?.role === "farmer" ? (
                /* Farmer Market Research Panel */
                <div className="p-5 rounded-xl bg-forest-50 border border-forest-200 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-forest-600 animate-pulse" />
                    <span className="text-xs font-mono uppercase font-bold text-forest-900 tracking-wider">
                      Farmer Market Research Mode
                    </span>
                  </div>
                  <p className="text-xs text-forest-700/85 leading-relaxed">
                    You are viewing this listing with a Farmer account ({user.email}). All pricing, min. order volume, and specifications are displayed for competitive market analysis. Purchasing produce requires an active Buyer account.
                  </p>
                  <div className="flex flex-wrap items-center gap-2.5 pt-1">
                    <Link href="/farmer/dashboard" className="flex-1">
                      <Button variant="primary" size="sm" className="w-full text-xs">
                        Farmer Dashboard
                      </Button>
                    </Link>
                    <Link href="/marketplace" className="flex-1">
                      <Button variant="outline" size="sm" className="w-full text-xs">
                        Browse More Listings
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : user?.role === "admin" ? (
                /* Admin Audit Mode */
                <div className="p-5 rounded-xl bg-ivory-100 border border-ivory-300 space-y-3">
                  <div className="text-xs font-mono uppercase font-bold text-terracotta-800 tracking-wider">
                    Administrative Audit Mode
                  </div>
                  <p className="text-xs text-forest-700/85 leading-relaxed">
                    Administrator preview mode. Buyer purchasing operations are not granted to administrative accounts.
                  </p>
                  <Link href="/admin/products" className="block">
                    <Button variant="outline" size="sm" className="w-full text-xs">
                      Inspect Product in Admin Portal &rarr;
                    </Button>
                  </Link>
                </div>
              ) : !user ? (
                /* Guest Sign-In Notice */
                <div className="p-5 rounded-xl bg-forest-50 border border-forest-200 space-y-3">
                  <div className="text-xs font-mono uppercase font-bold text-forest-900">
                    Buyer Authentication Required
                  </div>
                  <p className="text-xs text-forest-700/85 leading-relaxed">
                    Sign in or register with a Buyer account to purchase this harvest lot directly from {product.farmerName}.
                  </p>
                  <div className="flex items-center gap-2.5 pt-1">
                    <Link href={`/login?redirect=/marketplace/${product.id}`} className="flex-1">
                      <Button variant="primary" size="sm" className="w-full text-xs">
                        Sign In as Buyer
                      </Button>
                    </Link>
                    <Link href="/register?role=buyer" className="flex-1">
                      <Button variant="outline" size="sm" className="w-full text-xs">
                        Register
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                /* Buyer Purchasing Experience */
                <>
                  {/* Interactive Quantity Selector */}
                  <div className="space-y-3">
                    <label htmlFor="quantity-input" className="block text-xs font-mono uppercase tracking-wider text-forest-700 font-semibold">
                      Order Quantity ({product.unit})
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center border border-ivory-300 rounded-lg overflow-hidden bg-ivory-50">
                        <button
                          type="button"
                          onClick={handleDecrement}
                          disabled={quantity <= product.minOrderQuantity}
                          className="w-10 h-10 flex items-center justify-center text-forest-800 hover:bg-ivory-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          aria-label="Decrease quantity"
                        >
                          &minus;
                        </button>
                        <input
                          id="quantity-input"
                          type="number"
                          min={product.minOrderQuantity}
                          max={product.availableQuantity}
                          value={quantity}
                          onChange={handleQuantityInput}
                          className="w-16 h-10 text-center font-mono font-semibold text-sm bg-white border-x border-ivory-300 text-forest-950 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleIncrement}
                          disabled={quantity >= product.availableQuantity}
                          className="w-10 h-10 flex items-center justify-center text-forest-800 hover:bg-ivory-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          aria-label="Increase quantity"
                        >
                          &#43;
                        </button>
                      </div>

                      <div className="flex-1 text-right">
                        <span className="text-xs text-forest-600 block">Calculated Subtotal</span>
                        <span className="text-lg font-bold text-forest-950 font-serif">
                          ₹{subtotal}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Order Actions */}
                  <div className="space-y-3 pt-2">
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full text-base font-semibold"
                      onClick={handleAddToCart}
                    >
                      Add to Cart &bull; ₹{subtotal}
                    </Button>

                    <p className="text-[11px] text-forest-600/70 text-center leading-normal">
                      Minimum order volume and fresh inventory verified directly at harvest source.
                    </p>
                  </div>
                </>
              )}

              {/* Error Toast */}
              {orderError && (
                <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-900 flex items-start gap-2.5">
                  <svg className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{orderError}</span>
                </div>
              )}

              {/* Confirmation Toast Note */}
              {orderConfirmation && (
                <div className="p-4 rounded-xl bg-forest-50 border border-forest-200 text-xs text-forest-900 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-forest-700 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-semibold">{orderConfirmation}</span>
                  </div>
                  <div className="flex items-center gap-3 pt-1">
                    <Link href="/cart">
                      <Button variant="primary" size="sm">
                        View Cart & Checkout &rarr;
                      </Button>
                    </Link>
                    <Link href="/marketplace">
                      <Button variant="outline" size="sm">
                        Keep Browsing
                      </Button>
                    </Link>
                  </div>
                </div>
              )}

              {/* Available Fulfilment Methods */}
              {product.fulfilmentMethods && product.fulfilmentMethods.length > 0 && (
                <div className="pt-4 border-t border-ivory-200 space-y-2">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-forest-700 font-semibold">
                    Fulfilment & Dispatch Methods
                  </h4>
                  <ul className="space-y-1.5 text-xs text-forest-800">
                    {product.fulfilmentMethods.map((method, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <svg className="w-3.5 h-3.5 text-forest-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{method}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Section: Farmer Background & Storage Advice */}
          <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Farmer Information */}
            <div className="bg-white border border-ivory-200 rounded-xl p-6 shadow-subtle space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-forest-100 text-forest-800 flex items-center justify-center font-bold text-sm">
                  {product.farmerName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-forest-950">
                    {product.farmerName}
                  </h3>
                  <span className="text-xs text-forest-600">{product.farmLocation}</span>
                </div>
              </div>
              <p className="text-xs text-forest-700/80 leading-relaxed">
                {product.farmerBio ||
                  "Verified agricultural grower practicing direct soil stewardship and sustainable field management. All harvests are packed at source with temperature buffering."}
              </p>
              <div className="pt-2 text-[11px] text-forest-600 font-mono">
                Verified Producer ID: {product.farmerId} &bull; FarmLink Direct Protocol
              </div>
            </div>

            {/* Storage & Freshness Handling */}
            <div className="bg-white border border-ivory-200 rounded-xl p-6 shadow-subtle space-y-3">
              <h3 className="font-serif font-bold text-base text-forest-950 flex items-center gap-2">
                <svg className="w-4 h-4 text-forest-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Storage & Freshness Guidance</span>
              </h3>
              <p className="text-xs text-forest-700/80 leading-relaxed">
                {product.storageAdvice ||
                  "Store in a clean, ventilated container at recommended crop temperature. Consume or process within standard freshness window following receipt."}
              </p>
              <div className="text-[11px] text-forest-600 font-mono">
                Harvest Date: {product.harvestDate} &bull; Listed on Platform: {product.listingDate}
              </div>
            </div>
          </div>

          {/* Section: Related Regional Produce */}
          {relatedProducts.length > 0 && (
            <div className="mt-16 pt-12 border-t border-ivory-200 space-y-6">
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-xs font-mono uppercase text-forest-600 font-semibold tracking-wider">
                    Regional Catalog
                  </span>
                  <h2 className="text-2xl font-serif font-bold text-forest-950 mt-1">
                    Related Produce from Verified Growers
                  </h2>
                </div>
                <Link href="/marketplace" className="text-xs font-semibold text-forest-800 hover:text-forest-950 underline">
                  View Full Marketplace &rarr;
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedProducts.map((item) => (
                  <ProduceCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}
        </Container>
      </main>

      <Footer />
    </div>
  );
}
