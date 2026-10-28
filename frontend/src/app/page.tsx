"use client";

import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";

export default function Home() {
  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      window.history.pushState(null, "", `/#${sectionId}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-ivory-50 text-forest-950 scroll-smooth">
      {/* Public Navigation */}
      <Navbar />

      <main className="flex-1">
        {/* =========================================================================
            1. HERO SECTION: Connecting Farmers Directly with Buyers (Equal Representation)
           ========================================================================= */}
        <section className="relative overflow-hidden border-b border-ivory-200 bg-gradient-to-b from-ivory-100/80 via-ivory-50 to-ivory-50 pt-16 pb-20 lg:pt-24 lg:pb-28">
          <Container size="xl">
            <div className="text-center max-w-4xl mx-auto space-y-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-forest-100 border border-forest-200 text-forest-900 text-xs font-semibold tracking-wide shadow-subtle">
                <span className="w-2 h-2 rounded-full bg-forest-700 animate-pulse" />
                <span>The Direct Agricultural Marketplace &middot; Built Equally for Farmers and Buyers</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-forest-950 tracking-tight leading-[1.14]">
                Connecting Regional Farmers Directly with Fresh Produce Buyers
              </h1>

              {/* Mission Subtitle */}
              <p className="text-lg sm:text-xl text-forest-800/85 max-w-3xl mx-auto leading-relaxed">
                FarmLink eliminates brokers and intermediaries, giving agricultural producers sovereign pricing and complete market access, while providing households and commercial kitchens with traceable, harvest-fresh produce straight from verified fields.
              </p>

              {/* Primary Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-4 pt-3">
                <Link href="/register">
                  <Button variant="primary" size="lg" className="text-base font-semibold shadow-card px-8 py-3.5">
                    Get Started
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="secondary" size="lg" className="text-base font-medium px-8 py-3.5">
                    Sign In
                  </Button>
                </Link>
              </div>

              {/* Quick Anchor Links */}
              <div className="pt-2 flex items-center justify-center gap-6 text-xs text-forest-700/80 font-medium">
                <a
                  href="#how-it-works"
                  onClick={(e) => scrollToSection(e, "how-it-works")}
                  className="hover:text-forest-950 underline underline-offset-4 decoration-forest-300 transition-colors"
                >
                  Explore How It Works &darr;
                </a>
                <span>&bull;</span>
                <a
                  href="#for-farmers"
                  onClick={(e) => scrollToSection(e, "for-farmers")}
                  className="hover:text-forest-950 underline underline-offset-4 decoration-forest-300 transition-colors"
                >
                  Benefits for Farmers &darr;
                </a>
                <span>&bull;</span>
                <a
                  href="#for-buyers"
                  onClick={(e) => scrollToSection(e, "for-buyers")}
                  className="hover:text-forest-950 underline underline-offset-4 decoration-forest-300 transition-colors"
                >
                  Benefits for Buyers &darr;
                </a>
              </div>
            </div>

            {/* Equal Side-by-Side Dual Hero Pillars */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-16 max-w-5xl mx-auto">
              {/* Farmer Side Preview Card */}
              <div className="bg-white border border-ivory-300 rounded-2xl p-8 shadow-card flex flex-col justify-between space-y-6 relative overflow-hidden group hover:border-earth-400 transition-all">
                <div className="absolute top-0 right-0 w-28 h-28 bg-earth-50 rounded-bl-full -z-0 pointer-events-none transition-transform group-hover:scale-110" />
                <div className="space-y-4 relative z-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-earth-100 text-earth-900 text-xs font-semibold uppercase tracking-wider font-mono">
                    For Agricultural Growers
                  </div>
                  <h2 className="text-2xl font-serif font-bold text-forest-950">
                    Grow Your Produce Business on Your Terms
                  </h2>
                  <p className="text-sm text-forest-700/85 leading-relaxed">
                    Set your own harvest unit prices, showcase your agronomic practices, manage live crop inventory, and accept verified orders directly from households and businesses.
                  </p>
                  <ul className="space-y-2.5 text-xs text-forest-800 pt-1">
                    <li className="flex items-center gap-2.5">
                      <span className="w-4 h-4 rounded-full bg-earth-600 text-white flex items-center justify-center text-[10px] font-bold">✓</span>
                      <span>100% price sovereignty with zero broker commissions</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="w-4 h-4 rounded-full bg-earth-600 text-white flex items-center justify-center text-[10px] font-bold">✓</span>
                      <span>Reach verified families, restaurants, and retail grocers</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="w-4 h-4 rounded-full bg-earth-600 text-white flex items-center justify-center text-[10px] font-bold">✓</span>
                      <span>Real-time harvest inventory and order fulfillment controls</span>
                    </li>
                  </ul>
                </div>
                <div className="pt-2 relative z-10">
                  <a
                    href="#for-farmers"
                    onClick={(e) => scrollToSection(e, "for-farmers")}
                    className="inline-flex items-center text-xs font-semibold text-earth-800 hover:text-earth-950 transition-colors"
                  >
                    Learn more about Farmer tools &rarr;
                  </a>
                </div>
              </div>

              {/* Buyer Side Preview Card */}
              <div className="bg-white border border-ivory-300 rounded-2xl p-8 shadow-card flex flex-col justify-between space-y-6 relative overflow-hidden group hover:border-forest-400 transition-all">
                <div className="absolute top-0 right-0 w-28 h-28 bg-forest-50 rounded-bl-full -z-0 pointer-events-none transition-transform group-hover:scale-110" />
                <div className="space-y-4 relative z-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-100 text-forest-900 text-xs font-semibold uppercase tracking-wider font-mono">
                    For Fresh Produce Buyers
                  </div>
                  <h2 className="text-2xl font-serif font-bold text-forest-950">
                    Source Peak Freshness Direct from the Field
                  </h2>
                  <p className="text-sm text-forest-700/85 leading-relaxed">
                    Discover seasonal produce harvested on demand, connect with verified regional growers, enjoy wholesale price transparency, and track delivery from harvest to doorstep.
                  </p>
                  <ul className="space-y-2.5 text-xs text-forest-800 pt-1">
                    <li className="flex items-center gap-2.5">
                      <span className="w-4 h-4 rounded-full bg-forest-700 text-white flex items-center justify-center text-[10px] font-bold">✓</span>
                      <span>Verified farm origins, harvest batch dates, and growing methods</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="w-4 h-4 rounded-full bg-forest-700 text-white flex items-center justify-center text-[10px] font-bold">✓</span>
                      <span>Direct-from-grower pricing without intermediary markups</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="w-4 h-4 rounded-full bg-forest-700 text-white flex items-center justify-center text-[10px] font-bold">✓</span>
                      <span>End-to-end order status tracking and multi-farmer checkout</span>
                    </li>
                  </ul>
                </div>
                <div className="pt-2 relative z-10">
                  <a
                    href="#for-buyers"
                    onClick={(e) => scrollToSection(e, "for-buyers")}
                    className="inline-flex items-center text-xs font-semibold text-forest-800 hover:text-forest-950 transition-colors"
                  >
                    Learn more about Buyer features &rarr;
                  </a>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* =========================================================================
            2. HOW IT WORKS SECTION (Simple 4-Step Collaborative Workflow)
           ========================================================================= */}
        <section id="how-it-works" className="py-20 lg:py-28 bg-white border-b border-ivory-200">
          <Container size="xl">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
              <span className="text-xs font-mono uppercase text-forest-600 font-semibold tracking-wider">
                Direct Trade Protocol
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-forest-950">
                How FarmLink Works
              </h2>
              <p className="text-base text-forest-700/85 leading-relaxed">
                A simple, transparent 4-step direct cycle connecting regional agricultural growers with conscious buyers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Step 1 */}
              <div className="bg-ivory-50 border border-ivory-200 rounded-xl p-7 shadow-subtle flex flex-col justify-between space-y-4 hover:shadow-card transition-shadow">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-forest-800 text-ivory-50 flex items-center justify-center font-bold text-lg font-mono">
                    01
                  </div>
                  <span className="text-[11px] font-mono uppercase text-earth-700 font-semibold tracking-wider block">
                    Farmers
                  </span>
                  <h3 className="text-lg font-serif font-bold text-forest-950">
                    List Harvests
                  </h3>
                  <p className="text-xs sm:text-sm text-forest-700/80 leading-relaxed">
                    Farmers post their available seasonal crops, harvest dates, growing practices, and sovereign unit prices directly in their dashboard.
                  </p>
                </div>
                <div className="pt-2 text-[11px] text-forest-600 font-medium">
                  &bull; Complete pricing & quantity control
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-ivory-50 border border-ivory-200 rounded-xl p-7 shadow-subtle flex flex-col justify-between space-y-4 hover:shadow-card transition-shadow">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-forest-800 text-ivory-50 flex items-center justify-center font-bold text-lg font-mono">
                    02
                  </div>
                  <span className="text-[11px] font-mono uppercase text-forest-700 font-semibold tracking-wider block">
                    Buyers
                  </span>
                  <h3 className="text-lg font-serif font-bold text-forest-950">
                    Discover & Connect
                  </h3>
                  <p className="text-xs sm:text-sm text-forest-700/80 leading-relaxed">
                    Buyers explore farm listings, view producer profiles and harvest locations, and connect directly with the growers cultivating their food.
                  </p>
                </div>
                <div className="pt-2 text-[11px] text-forest-600 font-medium">
                  &bull; 100% origin transparency
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-ivory-50 border border-ivory-200 rounded-xl p-7 shadow-subtle flex flex-col justify-between space-y-4 hover:shadow-card transition-shadow">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-forest-800 text-ivory-50 flex items-center justify-center font-bold text-lg font-mono">
                    03
                  </div>
                  <span className="text-[11px] font-mono uppercase text-earth-700 font-semibold tracking-wider block">
                    Direct Marketplace
                  </span>
                  <h3 className="text-lg font-serif font-bold text-forest-950">
                    Place Orders
                  </h3>
                  <p className="text-xs sm:text-sm text-forest-700/80 leading-relaxed">
                    Buyers select produce at direct farmgate prices. Transparent orders are created with clear fulfillment and delivery specifications.
                  </p>
                </div>
                <div className="pt-2 text-[11px] text-forest-600 font-medium">
                  &bull; Zero middleman commissions
                </div>
              </div>

              {/* Step 4 */}
              <div className="bg-ivory-50 border border-ivory-200 rounded-xl p-7 shadow-subtle flex flex-col justify-between space-y-4 hover:shadow-card transition-shadow">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-forest-800 text-ivory-50 flex items-center justify-center font-bold text-lg font-mono">
                    04
                  </div>
                  <span className="text-[11px] font-mono uppercase text-forest-700 font-semibold tracking-wider block">
                    Both Sides
                  </span>
                  <h3 className="text-lg font-serif font-bold text-forest-950">
                    Track & Fulfill
                  </h3>
                  <p className="text-xs sm:text-sm text-forest-700/80 leading-relaxed">
                    Farmers pack crops fresh from the soil. Both buyers and farmers track real-time order status from preparation to completed delivery.
                  </p>
                </div>
                <div className="pt-2 text-[11px] text-forest-600 font-medium">
                  &bull; Real-time status notifications
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* =========================================================================
            3. FOR FARMERS SECTION (Selling, Reaching Buyers, Inventory, Tracking)
           ========================================================================= */}
        <section id="for-farmers" className="py-20 lg:py-28 bg-ivory-100/60 border-b border-ivory-200">
          <Container size="xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left Column: Farmers Benefits Detailed */}
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-earth-100 border border-earth-300 text-earth-900 text-xs font-semibold">
                  <span>For Farmers & Agricultural Producers</span>
                </div>

                <h2 className="text-3xl sm:text-4xl font-serif font-bold text-forest-950 leading-tight">
                  Sell Directly, Manage Your Inventory, and Control Your Orders
                </h2>

                <p className="text-base text-forest-800/85 leading-relaxed">
                  FarmLink empowers agricultural growers with sovereign economic control. By removing speculative brokers, farmers retain full asking rates, access broad customer demand, and streamline harvest operations.
                </p>

                {/* 4 Core Pillars for Farmers */}
                <div className="space-y-5 pt-2">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-earth-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-forest-950">
                        Selling Produce at Fair Sovereign Prices
                      </h3>
                      <p className="text-xs sm:text-sm text-forest-700/85 mt-1 leading-relaxed">
                        Set your own unit asking rates based on your cultivation costs and harvest quality. FarmLink never takes arbitrary broker discounts or claws back agreed farm payments.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-earth-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-forest-950">
                        Reaching Diverse High-Value Buyers
                      </h3>
                      <p className="text-xs sm:text-sm text-forest-700/85 mt-1 leading-relaxed">
                        Gain direct exposure to conscious households, chef-driven restaurants, organic retailers, produce wholesalers, and institutional kitchens seeking reliable regional growers.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-earth-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                      3
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-forest-950">
                        Managing Live Inventory Seamlessly
                      </h3>
                      <p className="text-xs sm:text-sm text-forest-700/85 mt-1 leading-relaxed">
                        Add crops in minutes, update stock levels, configure unit lot sizes (kg, crate, quintal, metric ton), and schedule seasonal batch releases through your dedicated Farmer Dashboard.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-earth-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                      4
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-forest-950">
                        Tracking Orders and Harvest Fulfillment
                      </h3>
                      <p className="text-xs sm:text-sm text-forest-700/85 mt-1 leading-relaxed">
                        Receive instant order notifications, review delivery requirements, update order status (Confirmed, Ready, Dispatched, Completed), and coordinate pickups without friction.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex flex-wrap items-center gap-4">
                  <Link href="/register?role=farmer">
                    <Button variant="primary" size="md" className="bg-earth-700 hover:bg-earth-800 border-earth-700 font-semibold shadow-subtle">
                      Register as a Farmer
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button variant="secondary" size="md">
                      Sign In to Farmer Dashboard
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Right Column: Visual Farmer Feature Card */}
              <div className="lg:col-span-5">
                <div className="bg-white border border-ivory-300 rounded-2xl p-7 shadow-elevated space-y-6">
                  <div className="flex items-center justify-between border-b border-ivory-200 pb-4">
                    <div>
                      <span className="text-[11px] font-mono text-earth-700 uppercase font-semibold">Producer Command Center</span>
                      <h3 className="font-serif font-bold text-lg text-forest-950">Farmer Dashboard Features</h3>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-forest-100 text-forest-900 text-xs font-semibold">
                      Verified Grower
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-ivory-50 border border-ivory-200 space-y-1.5">
                      <div className="text-xs font-bold text-forest-950">Harvest Inventory Controls</div>
                      <p className="text-xs text-forest-700/80">
                        Full CRUD controls for standing crops, lot sizes, organic certifications, and availability toggle.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-ivory-50 border border-ivory-200 space-y-1.5">
                      <div className="text-xs font-bold text-forest-950">Direct Purchase Order Stream</div>
                      <p className="text-xs text-forest-700/80">
                        Review customer destination, requested quantities, and delivery notes with one-click status transitions.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-ivory-50 border border-ivory-200 space-y-1.5">
                      <div className="text-xs font-bold text-forest-950">Zero Clawback Guarantees</div>
                      <p className="text-xs text-forest-700/80">
                        All sales lock in the producer unit rate established prior to dispatch.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-earth-50 border border-earth-200 text-center">
                    <div className="text-sm font-bold text-earth-900">Protected Agricultural Trade</div>
                    <div className="text-xs text-earth-700/80 mt-0.5">
                      Producers authenticate through the secure Farmer Portal.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* =========================================================================
            4. FOR BUYERS SECTION (Discovering Fresh Produce, Connecting, Purchasing, Tracking)
           ========================================================================= */}
        <section id="for-buyers" className="py-20 lg:py-28 bg-white border-b border-ivory-200">
          <Container size="xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left Column: Visual Buyer Feature Card */}
              <div className="lg:col-span-5 order-2 lg:order-1">
                <div className="bg-ivory-50 border border-ivory-300 rounded-2xl p-7 shadow-elevated space-y-6">
                  <div className="flex items-center justify-between border-b border-ivory-200 pb-4">
                    <div>
                      <span className="text-[11px] font-mono text-forest-700 uppercase font-semibold">Procurement Portal</span>
                      <h3 className="font-serif font-bold text-lg text-forest-950">Buyer Dashboard Features</h3>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-forest-100 text-forest-900 text-xs font-semibold">
                      Direct Sourcing
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-white border border-ivory-200 space-y-1.5">
                      <div className="text-xs font-bold text-forest-950">Personalized Product Discovery</div>
                      <p className="text-xs text-forest-700/80">
                        Curated search by crop category, growing district, harvest date, and certified organic methods.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-white border border-ivory-200 space-y-1.5">
                      <div className="text-xs font-bold text-forest-950">Multi-Farmer Procurement Cart</div>
                      <p className="text-xs text-forest-700/80">
                        Combine harvests from multiple regional producers into a single streamlined checkout.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-white border border-ivory-200 space-y-1.5">
                      <div className="text-xs font-bold text-forest-950">Real-Time Order Tracking & History</div>
                      <p className="text-xs text-forest-700/80">
                        Track progress from farm packing through temperature-controlled freight or farmgate pickup.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-forest-50 border border-forest-200 text-center">
                    <div className="text-sm font-bold text-forest-950">Tailored for Every Buyer</div>
                    <div className="text-xs text-forest-700/80 mt-0.5">
                      Households, Restaurants, Grocers, Wholesalers & Institutions.
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Buyer Benefits Detailed */}
              <div className="lg:col-span-7 space-y-6 order-1 lg:order-2">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-forest-100 border border-forest-300 text-forest-900 text-xs font-semibold">
                  <span>For Households & Commercial Buyers</span>
                </div>

                <h2 className="text-3xl sm:text-4xl font-serif font-bold text-forest-950 leading-tight">
                  Discover Fresh Produce, Connect with Farmers, and Track Orders
                </h2>

                <p className="text-base text-forest-800/85 leading-relaxed">
                  Whether you are ordering seasonal fruits for your family kitchen or procuring weekly bulk produce for restaurants, grocers, or campuses, FarmLink ensures genuine harvest-day quality at direct farm prices.
                </p>

                {/* 4 Core Pillars for Buyers */}
                <div className="space-y-5 pt-2">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-forest-800 text-white flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-forest-950">
                        Discovering Peak Harvest Produce
                      </h3>
                      <p className="text-xs sm:text-sm text-forest-700/85 mt-1 leading-relaxed">
                        Access seasonal vegetables, fruits, heirloom grains, and specialty spices harvested at true agronomic maturity—avoiding artificial ripening and lengthy warehouse storage.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-forest-800 text-white flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-forest-950">
                        Connecting Directly with Verified Farmers
                      </h3>
                      <p className="text-xs sm:text-sm text-forest-700/85 mt-1 leading-relaxed">
                        Know exactly where your food comes from. Every product listing links directly to the farm origin, growing district, harvest date, and sustainable agronomic practices.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-forest-800 text-white flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                      3
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-forest-950">
                        Simple, Transparent Purchasing
                      </h3>
                      <p className="text-xs sm:text-sm text-forest-700/85 mt-1 leading-relaxed">
                        Purchase directly at published grower rates without broker surcharges. Enjoy flexible minimum order quantities suitable for both home tables and commercial operations.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-forest-800 text-white flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                      4
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-forest-950">
                        Comprehensive Order Tracking
                      </h3>
                      <p className="text-xs sm:text-sm text-forest-700/85 mt-1 leading-relaxed">
                        Monitor order lifecycle stages (Pending, Confirmed, Ready, Dispatched, Completed) in real time with automated notification alerts in your personalized Buyer Dashboard.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex flex-wrap items-center gap-4">
                  <Link href="/register?role=buyer">
                    <Button variant="primary" size="md" className="font-semibold shadow-subtle">
                      Register as a Buyer
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button variant="secondary" size="md">
                      Sign In to Buyer Dashboard
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* =========================================================================
            5. BALANCED EQUAL CTA SECTION (Equal Partnership)
           ========================================================================= */}
        <section className="py-20 lg:py-24 bg-forest-950 text-ivory-50">
          <Container size="xl">
            <div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
              <span className="text-xs font-mono uppercase tracking-widest text-forest-300 font-semibold">
                Direct Agricultural Community
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white">
                Join the Direct FarmLink Marketplace
              </h2>
              <p className="text-sm sm:text-base text-ivory-200/85 leading-relaxed">
                Whether you produce high-quality harvests or purchase fresh produce for your kitchen, business, or family, FarmLink provides the direct infrastructure you need.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Farmer Onboarding Card */}
              <div className="bg-forest-900/80 border border-forest-800 rounded-2xl p-8 space-y-5 text-center flex flex-col justify-between shadow-card">
                <div className="space-y-3">
                  <span className="text-xs font-mono uppercase text-earth-300 font-semibold tracking-wider">
                    For Producers
                  </span>
                  <h3 className="text-2xl font-serif font-bold text-white">
                    Start Selling as a Farmer
                  </h3>
                  <p className="text-xs sm:text-sm text-ivory-200/80 leading-relaxed">
                    Set your asking prices, list standing crops, and reach hundreds of verified household and commercial buyers directly.
                  </p>
                </div>
                <div className="pt-2">
                  <Link href="/register?role=farmer">
                    <Button variant="secondary" size="lg" className="w-full bg-white text-forest-950 hover:bg-ivory-100 font-semibold">
                      Register as a Farmer
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Buyer Onboarding Card */}
              <div className="bg-forest-900/80 border border-forest-800 rounded-2xl p-8 space-y-5 text-center flex flex-col justify-between shadow-card">
                <div className="space-y-3">
                  <span className="text-xs font-mono uppercase text-forest-300 font-semibold tracking-wider">
                    For Purchasers
                  </span>
                  <h3 className="text-2xl font-serif font-bold text-white">
                    Start Sourcing as a Buyer
                  </h3>
                  <p className="text-xs sm:text-sm text-ivory-200/80 leading-relaxed">
                    Access peak-fresh harvest items, connect directly with regional growers, and manage orders with full batch traceability.
                  </p>
                </div>
                <div className="pt-2">
                  <Link href="/register?role=buyer">
                    <Button variant="accent" size="lg" className="w-full font-semibold">
                      Register as a Buyer
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </Container>
        </section>
      </main>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}
