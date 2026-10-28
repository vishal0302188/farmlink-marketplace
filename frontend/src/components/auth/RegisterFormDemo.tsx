"use client";

import React, { useState } from "react";
import { UserRole, BuyerCategory } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";

interface SubmittedUser {
  fullName: string;
  email: string;
  role: UserRole;
  buyerCategory?: BuyerCategory;
  orgName?: string;
  location: string;
}

export const RegisterFormDemo: React.FC = () => {
  const [role, setRole] = useState<UserRole>("buyer");
  const [buyerCategory, setBuyerCategory] = useState<BuyerCategory>("household");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [orgName, setOrgName] = useState("");
  const [location, setLocation] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedUser, setSubmittedUser] = useState<SubmittedUser | null>(null);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = "Full name or primary contact is required.";
    if (!email.trim()) {
      errs.email = "Email address is required.";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errs.email = "Please enter a valid email address.";
    }
    if (!password) {
      errs.password = "Password is required.";
    } else if (password.length < 8) {
      errs.password = "Password must be at least 8 characters.";
    }
    if (role === "farmer" && !orgName.trim()) {
      errs.orgName = "Farm or Agricultural Estate name is required.";
    }
    if (role === "buyer" && buyerCategory !== "household" && !orgName.trim()) {
      errs.orgName = "Business, restaurant, or institution name is required.";
    }
    if (!location.trim()) {
      errs.location = "City / Regional agricultural district is required.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    // Simulate API registration call to backend
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmittedUser({
        fullName,
        email,
        role,
        buyerCategory: role === "buyer" ? buyerCategory : undefined,
        orgName: orgName || undefined,
        location,
      });
    }, 1200);
  };

  const resetForm = () => {
    setSubmittedUser(null);
    setFullName("");
    setEmail("");
    setPassword("");
    setOrgName("");
    setLocation("");
    setErrors({});
  };

  return (
    <Card className="max-w-2xl mx-auto border-ivory-300">
      <CardHeader className="bg-ivory-100/70 border-b border-ivory-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Join the FarmLink Direct Network</CardTitle>
          <span className="text-xs font-mono uppercase bg-forest-100 text-forest-800 px-2.5 py-1 rounded-full font-semibold">
            Zero Broker Markups
          </span>
        </div>
        <CardDescription>
          Direct trade accounts for regional farmers, culinary establishments, wholesale purchasers, and institutions.
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-6">
        {submittedUser ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-12 h-12 bg-forest-100 text-forest-800 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h4 className="text-lg font-semibold text-forest-950">Registration Successfully Staged</h4>
            <p className="text-sm text-forest-700 max-w-md mx-auto">
              Account created for <span className="font-semibold text-forest-900">{submittedUser.fullName}</span> as a{" "}
              <span className="font-semibold text-forest-900 capitalize">{submittedUser.role}</span>
              {submittedUser.buyerCategory && ` (${submittedUser.buyerCategory})`}.
            </p>
            <div className="bg-ivory-100 p-4 rounded-lg max-w-sm mx-auto text-left text-xs font-mono space-y-1 text-forest-800 border border-ivory-300">
              <div>Role: {submittedUser.role}</div>
              {submittedUser.buyerCategory && <div>Category: {submittedUser.buyerCategory}</div>}
              <div>Email: {submittedUser.email}</div>
              <div>Location: {submittedUser.location}</div>
            </div>
            <Button variant="secondary" onClick={resetForm} size="sm">
              Register Another Entity
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Role Selection Tabs */}
            <div>
              <label className="block text-sm font-medium text-forest-950 mb-2">
                I am registering as: <span className="text-earth-600 font-semibold">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: "buyer", title: "Commercial / Consumer Buyer", desc: "Household, kitchen, or wholesale" },
                  { id: "farmer", title: "Farmer / Producer", desc: "Direct crop & harvest sales" },
                  { id: "admin", title: "Platform Overseer", desc: "Inspection & trade audit" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setRole(item.id as UserRole);
                      setErrors({});
                    }}
                    className={`p-3 text-left rounded-lg border transition-all ${
                      role === item.id
                        ? "border-forest-800 bg-forest-50/60 ring-1 ring-forest-800 text-forest-950"
                        : "border-ivory-300 bg-white hover:border-forest-300 text-forest-800"
                    }`}
                  >
                    <div className="font-semibold text-xs capitalize">{item.title}</div>
                    <div className="text-[11px] text-forest-600/80 mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Buyer Profile Category Attribute (Only if role === buyer) */}
            {role === "buyer" && (
              <div className="bg-ivory-50 p-4 rounded-lg border border-ivory-200">
                <Select
                  label="Buyer Classification (Profile Attribute)"
                  helperText="Configures custom bulk pricing brackets, minimum orders, and billing invoices."
                  value={buyerCategory}
                  onChange={(e) => setBuyerCategory(e.target.value as BuyerCategory)}
                  options={[
                    { value: "household", label: "Household / Individual Consumer (Small batches)" },
                    { value: "restaurant", label: "Restaurant / Commercial Kitchen (Scheduled fresh supply)" },
                    { value: "retailer", label: "Specialty / Organic Grocery Retailer (Weekly inventory)" },
                    { value: "wholesaler", label: "Wholesale Produce Broker / Distributor (Pallet volume)" },
                    { value: "company", label: "Food Processing Company (Industrial multi-ton contracts)" },
                    { value: "institution", label: "Educational / Healthcare Institution (Public catering)" },
                  ]}
                />
              </div>
            )}

            {/* Conditional Business or Farm Name */}
            {(role === "farmer" || (role === "buyer" && buyerCategory !== "household")) && (
              <Input
                label={role === "farmer" ? "Farm or Estate Name" : "Company, Establishment, or Venue Name"}
                placeholder={role === "farmer" ? "e.g. Sunny Brook Organic Orchards" : "e.g. Bistro Saint Germain"}
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                error={errors.orgName}
                required
              />
            )}

            {/* Full Name & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name / Authorized Contact"
                placeholder="Eleanor Vance"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                error={errors.fullName}
                required
              />
              <Input
                type="email"
                label="Corporate or Personal Email"
                placeholder="eleanor@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
                required
              />
            </div>

            {/* Location & Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Regional Agricultural Base / City"
                placeholder="e.g. Sonoma County, CA"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                error={errors.location}
                required
              />
              <Input
                type="password"
                label="Account Security Password"
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                required
              />
            </div>

            {/* Submit CTA */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSubmitting}
                className="w-full text-base"
              >
                Create {role === "farmer" ? "Farmer Producer" : role === "buyer" ? "Direct Buyer" : "Admin"} Account
              </Button>
              <p className="text-center text-xs text-forest-600/70 mt-2">
                By registering, you agree to FarmLink Direct Trade Quality Guarantees and Cold-Chain Standards.
              </p>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
};
