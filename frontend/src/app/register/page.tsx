"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("role") === "farmer" ? "farmer" : "buyer";
  const redirectPath = searchParams.get("redirect") || "";
  const { register } = useAuth();

  // Role & Buyer Category
  const [role, setRole] = useState<"farmer" | "buyer">(initialRole);
  const [buyerType, setBuyerType] = useState<string>("household");

  // Profile inputs
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [orgName, setOrgName] = useState("");
  const [district, setDistrict] = useState("");
  const [state, setState] = useState("");
  const [bio, setBio] = useState("");

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim() || !email.trim() || !password) {
      setErrorMessage("Please complete all required fields (Full Name, Email, Password).");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters in length.");
      return;
    }

    setIsSubmitting(true);
    const result = await register({
      full_name: fullName.trim(),
      email: email.trim().toLowerCase(),
      password,
      role,
      buyer_type: role === "buyer" ? buyerType : undefined,
      phone_number: phone.trim() || undefined,
      organization_name: orgName.trim() || undefined,
      location: district.trim() && state.trim() ? `${district.trim()}, ${state.trim()}` : district.trim() || state.trim() || undefined,
      district: district.trim() || undefined,
      state: state.trim() || undefined,
      bio: bio.trim() || undefined,
    });
    setIsSubmitting(false);

    if (!result.success || !result.user) {
      setErrorMessage(result.error || "Registration could not be completed. Please check your inputs.");
      return;
    }

    // Role-based redirection
    if (redirectPath) {
      router.push(redirectPath);
    } else if (result.user.role === "farmer") {
      router.push("/farmer/dashboard");
    } else {
      router.push("/buyer/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-ivory-50 text-forest-950">
      <Navbar />

      <main className="flex-1 py-14 px-4">
        <Container size="md">
          <div className="bg-white border border-ivory-200 rounded-2xl shadow-card p-8 sm:p-12 max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <span className="inline-block px-3 py-1 rounded-full bg-forest-50 text-forest-800 text-xs font-mono font-medium tracking-wide uppercase mb-3 border border-forest-200/60">
                Direct Onboarding
              </span>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-forest-950">
                Create your FarmLink Account
              </h1>
              <p className="mt-2 text-sm text-forest-700/80 max-w-md mx-auto">
                Connect directly with regional producers and commercial purchasers without unnecessary middlemen.
              </p>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Role Toggle Selector */}
              <div>
                <label className="block text-xs font-mono font-semibold text-forest-900 uppercase tracking-wider mb-2.5">
                  Account Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("farmer")}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      role === "farmer"
                        ? "border-forest-700 bg-forest-50/60 ring-2 ring-forest-600/30"
                        : "border-ivory-200 hover:border-ivory-300 bg-ivory-50/50"
                    }`}
                  >
                    <div className="font-semibold text-sm text-forest-950 flex items-center justify-between">
                      Farmer / Seller
                      {role === "farmer" && <span className="w-2 h-2 rounded-full bg-forest-600" />}
                    </div>
                    <p className="text-xs text-forest-700/80 mt-1">
                      List harvests, manage stock, and sell directly to purchasers.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole("buyer")}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      role === "buyer"
                        ? "border-forest-700 bg-forest-50/60 ring-2 ring-forest-600/30"
                        : "border-ivory-200 hover:border-ivory-300 bg-ivory-50/50"
                    }`}
                  >
                    <div className="font-semibold text-sm text-forest-950 flex items-center justify-between">
                      Buyer
                      {role === "buyer" && <span className="w-2 h-2 rounded-full bg-forest-600" />}
                    </div>
                    <p className="text-xs text-forest-700/80 mt-1">
                      Procure fresh produce for home, restaurant, or business.
                    </p>
                  </button>
                </div>
              </div>

              {/* Buyer Type Select */}
              {role === "buyer" && (
                <div className="bg-ivory-100/60 p-4 rounded-xl border border-ivory-200">
                  <label className="block text-xs font-mono font-semibold text-forest-900 uppercase tracking-wider mb-2">
                    Buyer Category
                  </label>
                  <select
                    value={buyerType}
                    onChange={(e) => setBuyerType(e.target.value)}
                    className="w-full bg-white border border-ivory-300 rounded-lg px-3.5 py-2.5 text-sm text-forest-900 focus:outline-none focus:ring-2 focus:ring-forest-600"
                  >
                    <option value="household">Household / Individual Consumer</option>
                    <option value="restaurant">Restaurant / Hospitality & Chef</option>
                    <option value="retailer">Retailer / Organic Grocery Store</option>
                    <option value="wholesaler">Wholesaler / Grain & Spice Distributor</option>
                    <option value="company">Food Processing & Beverage Company</option>
                    <option value="institution">Institution / Canteen / University</option>
                  </select>
                </div>
              )}

              {/* Personal Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-semibold text-forest-900 uppercase tracking-wider mb-1.5">
                    Full Name *
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. Rameshwar Patil"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-forest-900 uppercase tracking-wider mb-1.5">
                    Phone Number
                  </label>
                  <Input
                    type="tel"
                    placeholder="+91-98765-43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Account Credentials */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-semibold text-forest-900 uppercase tracking-wider mb-1.5">
                    Email Address *
                  </label>
                  <Input
                    type="email"
                    placeholder="user@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-forest-900 uppercase tracking-wider mb-1.5">
                    Password (min. 8 characters) *
                  </label>
                  <Input
                    type="password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Organization and Location */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-mono font-semibold text-forest-900 uppercase tracking-wider mb-1.5">
                    {role === "farmer" ? "Farm / Estate Name" : "Business / Org Name"}
                  </label>
                  <Input
                    type="text"
                    placeholder={role === "farmer" ? "Sahyadri Orchards" : "Spice Route Cafe"}
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-xs font-mono font-semibold text-forest-900 uppercase tracking-wider mb-1.5">
                    District / City
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. Nashik"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-xs font-mono font-semibold text-forest-900 uppercase tracking-wider mb-1.5">
                    State
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. Maharashtra"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Bio / Description */}
              <div>
                <label className="block text-xs font-mono font-semibold text-forest-900 uppercase tracking-wider mb-1.5">
                  {role === "farmer" ? "Farm Bio / Crops & Practices" : "Procurement Requirements"}
                </label>
                <textarea
                  rows={3}
                  placeholder={
                    role === "farmer"
                      ? "Describe your cultivation practices, drip irrigation, organic standards, and seasonal crops..."
                      : "Describe your volume procurement interests, delivery cadence, and required produce standards..."
                  }
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full bg-white border border-ivory-300 rounded-lg px-3.5 py-2.5 text-sm text-forest-900 focus:outline-none focus:ring-2 focus:ring-forest-600 resize-none"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={isSubmitting}
                className="w-full font-sans tracking-wide mt-2"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating Account...
                  </span>
                ) : (
                  `Register as ${role === "farmer" ? "Farmer" : "Buyer"}`
                )}
              </Button>
            </form>

            {/* Footer link */}
            <div className="mt-8 pt-6 border-t border-ivory-200 text-center text-xs text-forest-700/80">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-forest-800 hover:text-forest-950 underline underline-offset-2"
              >
                Sign in here
              </Link>
            </div>
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ivory-50 flex items-center justify-center text-forest-800">Loading registration...</div>}>
      <RegisterContent />
    </Suspense>
  );
}
