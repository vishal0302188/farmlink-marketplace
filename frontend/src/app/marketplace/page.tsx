"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { SAMPLE_PRODUCE } from "@/lib/constants";
import { fetchProductsFromBackend } from "@/lib/api";
import { ProduceItem, ProduceCategory, BuyerCategory } from "@/types";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { ProduceCard } from "@/components/marketplace/ProduceCard";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";

function MarketplaceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get initial search query from URL if present
  const initialQuery = searchParams.get("search") || "";

  // Data fetching state
  const [items, setItems] = useState<ProduceItem[]>(SAMPLE_PRODUCE);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dataSource, setDataSource] = useState<"api" | "fallback">("fallback");

  // Fetch produce from FastAPI backend on mount
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    fetchProductsFromBackend()
      .then((res) => {
        if (!isMounted) return;
        setItems(res.items);
        setDataSource(res.source);
      })
      .catch((err) => {
        console.warn("FastAPI fetch error, falling back to local dataset:", err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // State for search and filters
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<ProduceCategory | "all">("all");
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [organicOnly, setOrganicOnly] = useState<boolean>(false);
  const [inStockOnly, setInStockOnly] = useState<boolean>(true);
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc" | "date-desc" | "quantity-desc">("featured");
  const [showMobileFilters, setShowMobileFilters] = useState<boolean>(false);

  const { user } = useAuth();
  const buyerCategory = (user?.buyerType as BuyerCategory) || "household";
  const [cartNotification, setCartNotification] = useState<string | null>(null);

  // Derive unique locations from loaded dataset
  const locations = useMemo(() => {
    const locSet = new Set<string>();
    items.forEach((p) => locSet.add(p.farmLocation));
    return Array.from(locSet).sort();
  }, [items]);

  // Filter and sort items genuinely against loaded items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // 1. Text Search across title, description, farmerName, and location
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        const matchesFarmer = item.farmerName.toLowerCase().includes(q);
        const matchesLoc = item.farmLocation.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesFarmer && !matchesLoc) {
          return false;
        }
      }

      // 2. Category Filter
      if (selectedCategory !== "all" && item.category !== selectedCategory) {
        return false;
      }

      // 3. Location Filter
      if (selectedLocation !== "all" && item.farmLocation !== selectedLocation) {
        return false;
      }

      // 4. Minimum Price Filter
      if (minPrice !== "") {
        const minVal = parseFloat(minPrice);
        if (!isNaN(minVal) && item.pricePerUnit < minVal) {
          return false;
        }
      }

      // 5. Maximum Price Filter
      if (maxPrice !== "") {
        const maxVal = parseFloat(maxPrice);
        if (!isNaN(maxVal) && item.pricePerUnit > maxVal) {
          return false;
        }
      }

      // 6. Organic Only Filter
      if (organicOnly && !item.isOrganic) {
        return false;
      }

      // 7. In Stock Filter (available quantity > 0)
      if (inStockOnly && item.availableQuantity <= 0) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === "price-asc") return a.pricePerUnit - b.pricePerUnit;
      if (sortBy === "price-desc") return b.pricePerUnit - a.pricePerUnit;
      if (sortBy === "date-desc") {
        return new Date(b.listingDate).getTime() - new Date(a.listingDate).getTime();
      }
      if (sortBy === "quantity-desc") return b.availableQuantity - a.availableQuantity;
      return 0; // "featured" maintains canonical ordering
    });
  }, [items, searchQuery, selectedCategory, selectedLocation, minPrice, maxPrice, organicOnly, inStockOnly, sortBy]);

  // Check if any filter is active
  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    selectedCategory !== "all" ||
    selectedLocation !== "all" ||
    minPrice !== "" ||
    maxPrice !== "" ||
    organicOnly ||
    !inStockOnly;

  // Clear all filters handler
  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedLocation("all");
    setMinPrice("");
    setMaxPrice("");
    setOrganicOnly(false);
    setInStockOnly(true);
    setSortBy("featured");
    router.replace("/marketplace");
  };

  const { totalItems, addToCart } = useCart();
  const handleAddToCart = (item: ProduceItem) => {
    const res = addToCart(item, item.minOrderQuantity || 1);
    if (res.success) {
      setCartNotification(
        user
          ? `Added ${item.title} to your cart.`
          : `Added ${item.title} to cart. Sign in during checkout to finalize.`
      );
    } else {
      setCartNotification(res.message || `Could not add ${item.title} to cart.`);
    }
    setTimeout(() => {
      setCartNotification(null);
    }, 4000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-ivory-50 text-forest-950">
      {/* Navigation */}
      <Navbar />

      {/* Temporary Staged Order Toast */}
      {cartNotification && (
        <div className="fixed bottom-6 right-6 z-50 bg-forest-900 text-ivory-50 px-4 py-3 rounded-xl shadow-elevated border border-forest-700 flex items-center gap-3 text-sm animate-fade-in">
          <svg className="w-5 h-5 text-forest-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          <span>{cartNotification}</span>
        </div>
      )}

      {/* Marketplace Header */}
      <div className="bg-white border-b border-ivory-200 py-10">
        <Container size="xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-100 text-forest-800 text-xs font-semibold mb-2">
                <span>Direct Harvest Catalog</span>
                <span className="text-forest-400">&bull;</span>
                <span>{filteredItems.length} Produce Batches Available</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-serif font-bold text-forest-950 tracking-tight">
                Fresh Agricultural Marketplace
              </h1>
              <p className="text-sm text-forest-700/80 mt-2 max-w-2xl leading-relaxed">
                Source directly from regional farmers. Filter by harvest crop, verified location, pricing, and bulk lot availability.
              </p>
            </div>

            {/* Quick Stats or Cart Indicator (Buyers Only) */}
            {user?.role === "buyer" && totalItems > 0 && (
              <Link
                href="/cart"
                className="flex items-center gap-2 bg-ivory-100 hover:bg-ivory-200 border border-ivory-300 rounded-lg px-4 py-2 self-start md:self-auto transition-colors shadow-subtle"
              >
                <span className="text-xs text-forest-700 font-medium">Cart:</span>
                <span className="text-xs font-mono font-bold bg-forest-800 text-white px-2 py-0.5 rounded">
                  {totalItems} item{totalItems > 1 ? "s" : ""}
                </span>
              </Link>
            )}
          </div>

          {/* Farmer Market Research Mode Banner */}
          {user?.role === "farmer" && (
            <div className="mt-6 p-4 rounded-xl bg-forest-50 border border-forest-200 text-xs text-forest-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-subtle">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-forest-600 flex-shrink-0" />
                <span>
                  <strong>Market Research & Price Comparison Mode:</strong> You are browsing regional harvests and current farmgate rates for pricing analysis. Purchasing produce requires a Buyer account.
                </span>
              </div>
              <Link href="/farmer/dashboard" className="flex-shrink-0 text-xs font-semibold text-forest-800 hover:text-forest-950 underline underline-offset-2">
                Manage Your Harvests &rarr;
              </Link>
            </div>
          )}

          {/* Search Bar */}
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-forest-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search produce name, description, farmer, or region (e.g. San Marzano, Honeycrisp, Willamette)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-10 py-3 rounded-lg border border-ivory-300 bg-ivory-50 text-forest-950 placeholder:text-forest-400 text-sm focus:border-forest-700 focus:bg-white focus:ring-1 focus:ring-forest-700 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-forest-400 hover:text-forest-700"
                  aria-label="Clear search input"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Mobile Filter Toggle Button */}
            <button
              type="button"
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="sm:hidden w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-ivory-100 border border-ivory-300 text-sm font-medium text-forest-800"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span>{showMobileFilters ? "Hide Filters" : "Filters & Sorting"}</span>
              {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-forest-700" />}
            </button>
          </div>
        </Container>
      </div>

      {/* Main Body: Sidebar Filters + Produce Grid */}
      <main className="flex-1 py-10">
        <Container size="xl">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
            {/* Desktop Filters Sidebar */}
            <aside
              className={`
                lg:col-span-1 bg-white border border-ivory-200 rounded-xl p-6 shadow-subtle space-y-6
                ${showMobileFilters ? "block" : "hidden lg:block"}
              `}
            >
              <div className="flex items-center justify-between pb-4 border-b border-ivory-200">
                <h2 className="text-base font-semibold text-forest-950 font-sans">
                  Filter Produce
                </h2>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="text-xs font-semibold text-earth-600 hover:text-earth-700 underline focus:outline-none"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* 1. Category Filter */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-forest-700 mb-3 font-semibold">
                  Crop Category
                </label>
                <div className="space-y-1.5 text-sm">
                  {[
                    { id: "all", label: "All Categories" },
                    { id: "vegetables", label: "Vegetables" },
                    { id: "fruits", label: "Fruits & Orchards" },
                    { id: "grains_pulses", label: "Grains & Pulses" },
                    { id: "dairy_eggs", label: "Dairy & Eggs" },
                    { id: "herbs_spices", label: "Herbs & Botanicals" },
                    { id: "specialty", label: "Specialty & Estate" },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id as ProduceCategory | "all")}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                        selectedCategory === cat.id
                          ? "bg-forest-800 text-white font-semibold"
                          : "text-forest-800 hover:bg-ivory-100"
                      }`}
                    >
                      <span>{cat.label}</span>
                      {selectedCategory === cat.id && (
                        <span className="text-[10px]">&bull;</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Price Range Filter */}
              <div className="pt-4 border-t border-ivory-200">
                <label className="block text-xs font-mono uppercase tracking-wider text-forest-700 mb-2 font-semibold">
                  Price per Unit ($)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[11px] text-forest-600 block mb-1">Min ($)</span>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      placeholder="0.00"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="w-full text-xs p-2 rounded-md border border-ivory-300 bg-white text-forest-950 focus:border-forest-700 focus:ring-1 focus:ring-forest-700"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-forest-600 block mb-1">Max ($)</span>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      placeholder="25.00"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="w-full text-xs p-2 rounded-md border border-ivory-300 bg-white text-forest-950 focus:border-forest-700 focus:ring-1 focus:ring-forest-700"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Location Filter */}
              <div className="pt-4 border-t border-ivory-200">
                <label htmlFor="location-select" className="block text-xs font-mono uppercase tracking-wider text-forest-700 mb-2 font-semibold">
                  Growing Region
                </label>
                <select
                  id="location-select"
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-ivory-300 bg-white text-forest-950 focus:border-forest-700 focus:ring-1 focus:ring-forest-700"
                >
                  <option value="all">All Regional Origins</option>
                  {locations.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Availability & Organic Certification */}
              <div className="pt-4 border-t border-ivory-200 space-y-3">
                <label className="block text-xs font-mono uppercase tracking-wider text-forest-700 font-semibold">
                  Certifications & Supply
                </label>
                
                <label className="flex items-center gap-2.5 text-xs text-forest-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={organicOnly}
                    onChange={(e) => setOrganicOnly(e.target.checked)}
                    className="w-4 h-4 rounded text-forest-800 border-ivory-300 focus:ring-forest-700"
                  />
                  <span>Certified Organic Only</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-forest-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    className="w-4 h-4 rounded text-forest-800 border-ivory-300 focus:ring-forest-700"
                  />
                  <span>Available Batches Only (&gt;0)</span>
                </label>
              </div>

              {/* Reset action in sidebar */}
              {hasActiveFilters && (
                <div className="pt-4 border-t border-ivory-200">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={clearAllFilters}
                  >
                    Reset All Filters
                  </Button>
                </div>
              )}
            </aside>

            {/* Produce Listings Section */}
            <div className="lg:col-span-3 space-y-6">
              {/* Top Controls: Active filter tags & Sorting dropdown */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-ivory-200 shadow-subtle">
                <div className="flex flex-wrap items-center gap-2.5 text-xs text-forest-700">
                  <div>
                    Showing <span className="font-bold text-forest-950">{filteredItems.length}</span> of{" "}
                    <span className="font-bold text-forest-950">{items.length}</span> produce items
                  </div>
                  {dataSource === "api" ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-forest-50 text-forest-800 border border-forest-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-forest-600 animate-pulse" />
                      PostgreSQL Live API
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-ivory-100 text-forest-700 border border-ivory-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-earth-500" />
                      Sample Dataset
                    </span>
                  )}
                </div>

                {/* Sort Dropdown */}
                <div className="flex items-center gap-2">
                  <label htmlFor="sort-by" className="text-xs font-medium text-forest-700 whitespace-nowrap">
                    Sort by:
                  </label>
                  <select
                    id="sort-by"
                    value={sortBy}
                    onChange={(e) =>
                      setSortBy(
                        e.target.value as
                          | "featured"
                          | "price-asc"
                          | "price-desc"
                          | "date-desc"
                          | "quantity-desc"
                      )
                    }
                    className="text-xs py-1.5 px-3 rounded-lg border border-ivory-300 bg-ivory-50 text-forest-900 font-medium focus:border-forest-700 focus:ring-1 focus:ring-forest-700"
                  >
                    <option value="featured">Featured Freshness</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="date-desc">Newest Harvest / Listed</option>
                    <option value="quantity-desc">Available Volume (High to Low)</option>
                  </select>
                </div>
              </div>

              {/* Active Filter Pills Bar */}
              {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-forest-600 font-mono text-[11px] uppercase">Active Filters:</span>
                  {searchQuery && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-ivory-200 text-forest-900 border border-ivory-300">
                      Query: &ldquo;{searchQuery}&rdquo;
                      <button type="button" onClick={() => setSearchQuery("")} className="hover:text-red-700">
                        &times;
                      </button>
                    </span>
                  )}
                  {selectedCategory !== "all" && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-ivory-200 text-forest-900 border border-ivory-300 capitalize">
                      Category: {selectedCategory.replace("_", " & ")}
                      <button type="button" onClick={() => setSelectedCategory("all")} className="hover:text-red-700">
                        &times;
                      </button>
                    </span>
                  )}
                  {selectedLocation !== "all" && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-ivory-200 text-forest-900 border border-ivory-300">
                      Region: {selectedLocation}
                      <button type="button" onClick={() => setSelectedLocation("all")} className="hover:text-red-700">
                        &times;
                      </button>
                    </span>
                  )}
                  {(minPrice || maxPrice) && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-ivory-200 text-forest-900 border border-ivory-300">
                      Price: ${minPrice || "0"} &ndash; ${maxPrice || "Any"}
                      <button type="button" onClick={() => { setMinPrice(""); setMaxPrice(""); }} className="hover:text-red-700">
                        &times;
                      </button>
                    </span>
                  )}
                  {organicOnly && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-forest-100 text-forest-800 border border-forest-200">
                      Organic Only
                      <button type="button" onClick={() => setOrganicOnly(false)} className="hover:text-red-700">
                        &times;
                      </button>
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="text-xs text-earth-600 hover:text-earth-700 font-semibold underline ml-1"
                  >
                    Clear All
                  </button>
                </div>
              )}

              {/* Grid of Results OR Loading Skeletons OR Empty State */}
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-xl border border-ivory-200 p-4 shadow-subtle animate-pulse space-y-3"
                    >
                      <div className="w-full h-48 bg-ivory-200/70 rounded-lg" />
                      <div className="h-4 bg-ivory-200/70 rounded w-3/4" />
                      <div className="h-3 bg-ivory-200/50 rounded w-1/2" />
                      <div className="h-8 bg-ivory-200/60 rounded mt-4" />
                    </div>
                  ))}
                </div>
              ) : filteredItems.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredItems.map((item) => (
                    <ProduceCard
                      key={item.id}
                      item={item}
                      userRole={user?.role}
                      buyerCategory={buyerCategory}
                      onAddToCart={handleAddToCart}
                    />
                  ))}
                </div>
              ) : (
                /* Empty Results State */
                <div className="bg-white rounded-xl border border-ivory-200 p-12 text-center max-w-xl mx-auto shadow-subtle my-8">
                  <div className="w-14 h-14 rounded-full bg-ivory-100 text-forest-700 flex items-center justify-center mx-auto mb-4 border border-ivory-300">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-serif font-bold text-forest-950 mb-2">
                    No Agricultural Produce Found
                  </h3>
                  <p className="text-sm text-forest-700/80 mb-6 leading-relaxed">
                    We could not find any produce matching your current search and filter combination.
                    Try broadening your price range, choosing all growing regions, or removing keyword filters.
                  </p>
                  <Button variant="primary" onClick={clearAllFilters}>
                    Reset All Filters & View All Harvests
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ivory-50 flex items-center justify-center text-forest-800">Loading marketplace...</div>}>
      <MarketplaceContent />
    </Suspense>
  );
}
