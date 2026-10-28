"use client";

import React, { useState } from "react";
import Link from "next/link";
import { SAMPLE_PRODUCE } from "@/lib/constants";
import { BuyerCategory } from "@/types";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ProduceCard } from "@/components/marketplace/ProduceCard";

export default function ForBusinessesPage() {
  const [activeCategory, setActiveCategory] = useState<BuyerCategory>("restaurant");
  const [inquirySubmitted, setInquirySubmitted] = useState<boolean>(false);
  const [businessName, setBusinessName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [volumeEstimate, setVolumeEstimate] = useState("");

  // Filter high-volume produce for bulk discovery
  const bulkProduce = SAMPLE_PRODUCE.filter((p) => p.availableQuantity >= 500);

  const categoriesConfig: {
    id: BuyerCategory;
    title: string;
    description: string;
    typicalOrder: string;
    logistics: string;
  }[] = [
    {
      id: "household",
      title: "Households & Co-ops",
      description: "Direct doorstep batches of heirloom vegetables and seasonal fruits without supermarket markups.",
      typicalOrder: "5 kg – 25 kg per weekly box",
      logistics: "Local courier & neighborhood drop points",
    },
    {
      id: "restaurant",
      title: "Restaurants & Commercial Kitchens",
      description: "Direct relationship with growers for specific brix, ripeness, and morning-cut fresh herbs.",
      typicalOrder: "20 kg – 150 kg per delivery (2x weekly)",
      logistics: "Temperature-buffered delivery to kitchen dock",
    },
    {
      id: "retailer",
      title: "Organic & Specialty Grocers",
      description: "Case-packed produce with verified regional farm provenance and harvest date stamping.",
      typicalOrder: "100 kg – 500 kg recurring orders",
      logistics: "Scheduled regional hub consolidated freight",
    },
    {
      id: "wholesaler",
      title: "Regional Produce Wholesalers",
      description: "Direct multi-pallet procurement at source farm gate with standardized palletizing.",
      typicalOrder: "1 ton – 10 tons per batch",
      logistics: "Refrigerated cross-dock freight dispatch",
    },
    {
      id: "company",
      title: "Food Processing Companies",
      description: "Contracted multi-ton crop supply for natural juicing, milling, canning, or extract manufacturing.",
      typicalOrder: "5 tons – 50 tons seasonal contracts",
      logistics: "Direct farm-to-plant bulk trailer dispatch",
    },
    {
      id: "institution",
      title: "Institutional Buyers & Healthcare",
      description: "Large-scale procurement for universities, hospitals, and municipal food programs.",
      typicalOrder: "500 kg – 5 tons scheduled cycle menus",
      logistics: "Central receiving facility dock deliveries",
    },
  ];

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName || !contactName || !email) return;
    setInquirySubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-ivory-50 text-forest-950">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-ivory-100 to-ivory-50 border-b border-ivory-200 py-16 lg:py-20">
          <Container size="xl">
            <div className="max-w-3xl space-y-4">
              <span className="text-xs font-mono uppercase text-forest-700 bg-forest-100 px-3 py-1 rounded-full font-semibold">
                Commercial & Institutional Procurement
              </span>
              <h1 className="text-3xl sm:text-5xl font-serif font-bold text-forest-950 tracking-tight leading-tight">
                Direct Agricultural Sourcing for Businesses & Institutions
              </h1>
              <p className="text-base text-forest-800/80 leading-relaxed">
                Whether you operate an artisan restaurant, manage regional supermarket procurement,
                or coordinate multi-ton processing contracts, FarmLink connects you directly to the producer
                with transparent batch pricing and verifiable harvest records.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link href="#bulk-discovery">
                  <Button variant="primary">Discover High-Volume Lots</Button>
                </Link>
                <Link href="#commercial-inquiry">
                  <Button variant="secondary">Submit Commercial Inquiry</Button>
                </Link>
              </div>
            </div>
          </Container>
        </section>

        {/* Section 1: Buyer Categories Grid */}
        <section className="py-16 bg-white border-b border-ivory-200">
          <Container size="xl">
            <div className="max-w-2xl mb-10">
              <span className="text-xs font-mono uppercase text-forest-600 font-semibold tracking-wider">
                Tailored Procurement Architecture
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-forest-950 mt-1">
                Built for Every Scale of Agricultural Buyer
              </h2>
              <p className="text-sm text-forest-700/80 mt-2">
                Select your buyer category to review typical fulfillment logistics and lot parameters.
              </p>
            </div>

            {/* Category Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categoriesConfig.map((cat) => (
                <div
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`p-6 rounded-xl border transition-all cursor-pointer ${
                    activeCategory === cat.id
                      ? "border-forest-800 bg-forest-50/50 ring-1 ring-forest-800 shadow-subtle"
                      : "border-ivory-200 bg-white hover:border-forest-300 hover:shadow-subtle"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-serif font-bold text-lg text-forest-950">
                      {cat.title}
                    </h3>
                    {activeCategory === cat.id && (
                      <span className="text-xs font-mono text-forest-800 font-bold bg-forest-100 px-2 py-0.5 rounded">
                        Selected
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-forest-700/80 leading-relaxed mb-4">
                    {cat.description}
                  </p>
                  <div className="space-y-1.5 text-[11px] font-mono border-t border-ivory-200 pt-3 text-forest-800">
                    <div>
                      <span className="text-forest-500 uppercase">Volume: </span>
                      {cat.typicalOrder}
                    </div>
                    <div>
                      <span className="text-forest-500 uppercase">Routing: </span>
                      {cat.logistics}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* Section 2: Bulk Lot Discovery */}
        <section id="bulk-discovery" className="py-16 bg-ivory-50 border-b border-ivory-200">
          <Container size="xl">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
              <div>
                <span className="text-xs font-mono uppercase text-forest-600 font-semibold tracking-wider">
                  Bulk Order Discovery
                </span>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-forest-950 mt-1">
                  High-Volume Harvest Lots Available Now
                </h2>
                <p className="text-sm text-forest-700/80 mt-2 max-w-xl">
                  These verified batches have large standing inventory (&gt;500 units) suited for commercial kitchens, regional retail grocers, and institutional meal programs.
                </p>
              </div>
              <Link href="/marketplace">
                <Button variant="outline" size="sm">
                  View Full Marketplace &rarr;
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {bulkProduce.map((item) => (
                <ProduceCard
                  key={item.id}
                  item={item}
                  userRole="buyer"
                  buyerCategory={activeCategory}
                />
              ))}
            </div>
          </Container>
        </section>

        {/* Section 3: Commercial Inquiry Form */}
        <section id="commercial-inquiry" className="py-20 bg-white">
          <Container size="md">
            <div className="bg-ivory-50 border border-ivory-200 rounded-2xl p-8 sm:p-10 shadow-card">
              <div className="text-center max-w-lg mx-auto mb-8">
                <span className="text-xs font-mono uppercase text-forest-600 font-semibold tracking-wider">
                  Direct Producer Routing
                </span>
                <h2 className="text-2xl font-serif font-bold text-forest-950 mt-1">
                  Commercial Procurement Inquiry
                </h2>
                <p className="text-xs sm:text-sm text-forest-700/80 mt-2 leading-relaxed">
                  Submit your required harvest crops and expected volume. We route your request directly to the farm managers with verified availability.
                </p>
              </div>

              {inquirySubmitted ? (
                <div className="text-center py-8 space-y-4">
                  <div className="w-12 h-12 bg-forest-100 text-forest-800 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-serif font-bold text-forest-950">Inquiry Staged Successfully</h3>
                  <p className="text-xs text-forest-700 max-w-md mx-auto leading-relaxed">
                    Thank you, <span className="font-semibold text-forest-900">{contactName}</span> from{" "}
                    <span className="font-semibold text-forest-900">{businessName}</span>. Your procurement specification for the{" "}
                    <span className="font-semibold capitalize text-forest-900">{activeCategory}</span> profile has been recorded.
                  </p>
                  <Button variant="secondary" size="sm" onClick={() => setInquirySubmitted(false)}>
                    Submit Another Inquiry
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleInquirySubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Business / Organization Name"
                      placeholder="e.g. Sunchild Organic Market"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      required
                    />
                    <Input
                      label="Procurement Contact Name"
                      placeholder="e.g. Marcus Chen"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      type="email"
                      label="Business Email"
                      placeholder="procurement@organization.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <Select
                      label="Buyer Category Classification"
                      value={activeCategory}
                      onChange={(e) => setActiveCategory(e.target.value as BuyerCategory)}
                      options={[
                        { value: "household", label: "Household / Buying Club" },
                        { value: "restaurant", label: "Restaurant & Culinary Kitchen" },
                        { value: "retailer", label: "Retail Grocer & Specialty Market" },
                        { value: "wholesaler", label: "Regional Wholesaler / Distributor" },
                        { value: "company", label: "Food Processing Company" },
                        { value: "institution", label: "Educational / Healthcare Institution" },
                      ]}
                    />
                  </div>

                  <Input
                    label="Estimated Weekly / Monthly Order Volume"
                    placeholder="e.g. 500 kg weekly San Marzano Tomatoes + 200 kg Romaine"
                    value={volumeEstimate}
                    onChange={(e) => setVolumeEstimate(e.target.value)}
                    helperText="Helps producers verify standing inventory and pack schedules."
                  />

                  <div className="pt-2">
                    <Button type="submit" variant="primary" size="lg" className="w-full">
                      Transmit Commercial Inquiry
                    </Button>
                    <p className="text-[11px] text-forest-600/70 text-center mt-2">
                      Zero automated markups. Direct contact with grower dispatch.
                    </p>
                  </div>
                </form>
              )}
            </div>
          </Container>
        </section>
      </main>

      <Footer />
    </div>
  );
}
