"use client";

import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";

export default function ForFarmersPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-ivory-50 text-forest-950">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-ivory-100 to-ivory-50 border-b border-ivory-200 py-16 lg:py-24">
          <Container size="xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-7 space-y-6">
                <span className="text-xs font-mono uppercase text-forest-700 bg-forest-100 px-3 py-1 rounded-full font-semibold border border-forest-200">
                  For Agricultural Producers & Growers
                </span>
                <h1 className="text-3xl sm:text-5xl font-serif font-bold text-forest-950 tracking-tight leading-tight">
                  Direct Harvest Sales. Price Sovereignty. Direct Relationships.
                </h1>
                <p className="text-base text-forest-800/80 leading-relaxed max-w-xl">
                  FarmLink empowers regional farmers to list fresh harvests directly for households,
                  commercial kitchens, retailers, and wholesale purchasers with zero predatory middleman cuts.
                </p>

                {/* Role-Aware Hero CTAs */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  {!user ? (
                    <>
                      <Link href="/register?role=farmer">
                        <Button variant="primary" size="lg" className="shadow-subtle">
                          Register as a Farmer
                        </Button>
                      </Link>
                      <Link href="/login">
                        <Button variant="secondary" size="lg">
                          Farmer Sign In
                        </Button>
                      </Link>
                    </>
                  ) : user.role === "farmer" ? (
                    <>
                      <Link href="/farmer/dashboard">
                        <Button variant="primary" size="lg" className="shadow-subtle">
                          Go to Farmer Dashboard &rarr;
                        </Button>
                      </Link>
                      <Link href="/marketplace">
                        <Button variant="secondary" size="lg">
                          View Live Marketplace
                        </Button>
                      </Link>
                    </>
                  ) : user.role === "admin" ? (
                    <>
                      <Link href="/admin">
                        <Button variant="primary" size="lg">
                          Admin Portal &rarr;
                        </Button>
                      </Link>
                      <Link href="/marketplace">
                        <Button variant="secondary" size="lg">
                          Explore Marketplace
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link href="/marketplace">
                        <Button variant="primary" size="lg">
                          Explore Fresh Marketplace
                        </Button>
                      </Link>
                      <Link href="/buyer/dashboard">
                        <Button variant="secondary" size="lg">
                          Your Buyer Dashboard
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>

              {/* Farmer Proof Points Card */}
              <div className="lg:col-span-5 bg-white border border-ivory-200 rounded-2xl p-6 sm:p-8 shadow-card space-y-6">
                <h3 className="font-serif font-bold text-xl text-forest-950">
                  Why Regional Growers Choose FarmLink
                </h3>

                <ul className="space-y-4 text-xs sm:text-sm text-forest-800">
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-forest-100 text-forest-800 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                      ✓
                    </div>
                    <div>
                      <strong className="text-forest-950 block">Set Your Own Unit Prices</strong>
                      You control the listing price per kg, crate, or ton based on your true cost of cultivation.
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-forest-100 text-forest-800 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                      ✓
                    </div>
                    <div>
                      <strong className="text-forest-950 block">Advance Harvest Scheduling</strong>
                      List crop yields weeks ahead of harvest to lock in pre-orders from restaurants and grocers.
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-forest-100 text-forest-800 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                      ✓
                    </div>
                    <div>
                      <strong className="text-forest-950 block">Zero Hidden Intermediary Markups</strong>
                      Direct trade means your produce is never devalued by layered brokers or speculative price cuts.
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-forest-100 text-forest-800 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                      ✓
                    </div>
                    <div>
                      <strong className="text-forest-950 block">Temperature-Buffered Logistics</strong>
                      Seamless access to regional hub dispatch, farm-gate pickup, or commercial cold-chain freight.
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </Container>
        </section>

        {/* Operational Pillars Section */}
        <section className="py-20 bg-white border-b border-ivory-200">
          <Container size="xl">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
              <span className="text-xs font-mono uppercase text-forest-600 font-semibold tracking-wider">
                Farmer Infrastructure
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-forest-950">
                Tools Built Specifically for Agricultural Producers
              </h2>
              <p className="text-base text-forest-700/80 leading-relaxed">
                Everything you need to list harvests, communicate with verified buyers, and fulfill orders smoothly.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-8 rounded-2xl bg-ivory-50 border border-ivory-200 space-y-4 shadow-subtle">
                <div className="w-12 h-12 rounded-xl bg-forest-800 text-white flex items-center justify-center text-lg font-bold font-mono">
                  01
                </div>
                <h3 className="text-xl font-serif font-bold text-forest-950">
                  Inventory & Batch Control
                </h3>
                <p className="text-xs sm:text-sm text-forest-700/80 leading-relaxed">
                  List standing crops, set minimum lot sizes, update available volumes in real time, and adjust pricing whenever market dynamics shift.
                </p>
              </div>

              <div className="p-8 rounded-2xl bg-ivory-50 border border-ivory-200 space-y-4 shadow-subtle">
                <div className="w-12 h-12 rounded-xl bg-forest-800 text-white flex items-center justify-center text-lg font-bold font-mono">
                  02
                </div>
                <h3 className="text-xl font-serif font-bold text-forest-950">
                  Direct Order Pipeline
                </h3>
                <p className="text-xs sm:text-sm text-forest-700/80 leading-relaxed">
                  Review incoming purchase orders, accept or adjust fulfillment dates, and notify buyers automatically as crops are harvested and packed.
                </p>
              </div>

              <div className="p-8 rounded-2xl bg-ivory-50 border border-ivory-200 space-y-4 shadow-subtle">
                <div className="w-12 h-12 rounded-xl bg-forest-800 text-white flex items-center justify-center text-lg font-bold font-mono">
                  03
                </div>
                <h3 className="text-xl font-serif font-bold text-forest-950">
                  Price Protection
                </h3>
                <p className="text-xs sm:text-sm text-forest-700/80 leading-relaxed">
                  Every order locks in the farmgate price at purchase. No post-harvest price renegotiations, arbitrary grading penalties, or deductions.
                </p>
              </div>
            </div>
          </Container>
        </section>

        {/* Onboarding & Next Steps Action Section (Replaces Duplicate Form) */}
        <section id="onboarding" className="py-20 bg-ivory-50">
          <Container size="md">
            <div className="bg-white border border-ivory-300 rounded-3xl p-8 sm:p-12 shadow-card text-center space-y-6">
              {!user ? (
                /* Logged-out visitor */
                <>
                  <div className="w-16 h-16 rounded-2xl bg-forest-100 text-forest-800 flex items-center justify-center mx-auto mb-2">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M12 2a10 10 0 0 1 10 10c0 5.523-4.477 10-10 10S2 17.523 2 12A10 10 0 0 1 12 2Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M12 22V12" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M12 12c2.5-3 6-3 6-3s0 3.5-3 6" />
                    </svg>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-serif font-bold text-forest-950">
                    Ready to Sell on FarmLink?
                  </h2>
                  <p className="text-sm text-forest-700/80 max-w-lg mx-auto leading-relaxed">
                    Farmer registration takes under two minutes. Register your farm name, location, and growing practices to immediately access your producer dashboard and begin publishing harvests.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <Link href="/register?role=farmer">
                      <Button variant="primary" size="lg" className="font-semibold shadow-subtle px-8">
                        Register as a Farmer &rarr;
                      </Button>
                    </Link>
                    <Link href="/login">
                      <Button variant="secondary" size="lg" className="px-6">
                        Existing Farmer Sign In
                      </Button>
                    </Link>
                  </div>
                  <p className="text-xs text-forest-500 font-mono">
                    Direct Registration &bull; Instant Dashboard Setup &bull; Zero Upfront Listing Fees
                  </p>
                </>
              ) : user.role === "farmer" ? (
                /* Authenticated Farmer */
                <>
                  <div className="w-16 h-16 rounded-2xl bg-forest-100 text-forest-800 flex items-center justify-center mx-auto mb-2">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-xs font-mono uppercase text-forest-600 font-semibold tracking-wider">
                    Active Farmer Account
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-serif font-bold text-forest-950">
                    Welcome Back, {user.fullName}
                  </h2>
                  <p className="text-sm text-forest-700/80 max-w-lg mx-auto leading-relaxed">
                    Your farm profile for <strong>{user.organizationName || user.fullName}</strong> is active. You can manage your produce listings, review incoming purchase orders, and edit farm details directly in your dashboard.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <Link href="/farmer/dashboard">
                      <Button variant="primary" size="lg" className="font-semibold shadow-subtle px-8">
                        Go to Farmer Dashboard &rarr;
                      </Button>
                    </Link>
                    <Link href="/marketplace">
                      <Button variant="secondary" size="lg" className="px-6">
                        Explore Marketplace Listings
                      </Button>
                    </Link>
                  </div>
                </>
              ) : user.role === "admin" ? (
                /* Authenticated Admin */
                <>
                  <span className="text-xs font-mono uppercase text-terracotta-700 font-semibold tracking-wider">
                    Administrative Access
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-serif font-bold text-forest-950">
                    Administrator Review Portal
                  </h2>
                  <p className="text-sm text-forest-700/80 max-w-lg mx-auto leading-relaxed">
                    You are signed in as an administrator ({user.email}). Access the admin portal to manage registered farmers, audit product listings, and oversee platform orders.
                  </p>
                  <div className="pt-2">
                    <Link href="/admin">
                      <Button variant="primary" size="lg">
                        Go to Admin Portal &rarr;
                      </Button>
                    </Link>
                  </div>
                </>
              ) : (
                /* Authenticated Buyer */
                <>
                  <span className="text-xs font-mono uppercase text-forest-600 font-semibold tracking-wider">
                    Buyer Account
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-serif font-bold text-forest-950">
                    Signed in as a Buyer ({user.fullName})
                  </h2>
                  <p className="text-sm text-forest-700/80 max-w-lg mx-auto leading-relaxed">
                    Looking to purchase peak-fresh produce directly from regional growers? You can browse the active marketplace or review your orders in your Buyer Dashboard. If you also produce crops and wish to sell, you can create a separate Farmer account.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <Link href="/marketplace">
                      <Button variant="primary" size="lg" className="font-semibold shadow-subtle px-8">
                        Browse Fresh Marketplace &rarr;
                      </Button>
                    </Link>
                    <Link href="/buyer/dashboard">
                      <Button variant="secondary" size="lg" className="px-6">
                        Buyer Dashboard
                      </Button>
                    </Link>
                  </div>
                </>
              )}
            </div>
          </Container>
        </section>
      </main>

      <Footer />
    </div>
  );
}
