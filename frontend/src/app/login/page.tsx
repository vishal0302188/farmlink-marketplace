"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type LoginRole = "buyer" | "farmer" | "admin";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "";
  const initialRoleParam = searchParams.get("role") as LoginRole | null;

  const { user, login, logout } = useAuth();
  const [selectedRole, setSelectedRole] = useState<LoginRole | null>(
    initialRoleParam === "farmer" || initialRoleParam === "admin" || initialRoleParam === "buyer"
      ? initialRoleParam
      : null
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already authenticated with a valid session, redirect to role dashboard
  useEffect(() => {
    if (user) {
      if (redirectPath) {
        router.push(redirectPath);
      } else if (user.role === "admin") {
        router.push("/admin");
      } else if (user.role === "farmer") {
        router.push("/farmer/dashboard");
      } else {
        router.push("/buyer/dashboard");
      }
    }
  }, [user, redirectPath, router]);

  const roleMeta: Record<LoginRole, { title: string; subtitle: string; icon: React.ReactNode; color: string }> = {
    buyer: {
      title: "Buyer / Procurement",
      subtitle: "Procure produce for home, restaurant, retail, or wholesale",
      color: "border-forest-600 bg-forest-50/50",
      icon: (
        <svg className="w-6 h-6 text-forest-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
    },
    farmer: {
      title: "Farmer / Producer",
      subtitle: "Manage harvest listings, stock volumes, and orders",
      color: "border-earth-600 bg-earth-50/50",
      icon: (
        <svg className="w-6 h-6 text-earth-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
        </svg>
      ),
    },
    admin: {
      title: "Admin",
      subtitle: "Platform moderation, user controls, and order oversight",
      color: "border-terracotta-600 bg-terracotta-50/50",
      icon: (
        <svg className="w-6 h-6 text-terracotta-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedRole) {
      setErrorMessage("Please select your role before signing in.");
      return;
    }

    if (!email.trim() || !password) {
      setErrorMessage("Please enter both your email address and password.");
      return;
    }

    setIsSubmitting(true);
    const result = await login(email.trim(), password);
    setIsSubmitting(false);

    if (!result.success || !result.user) {
      setErrorMessage(result.error || "Invalid email or password. Please try again.");
      return;
    }

    // Role Verification: Authenticate against backend and verify actual returned role
    if (result.user.role !== selectedRole) {
      // Discard unauthorized session immediately
      await logout();
      const roleDisplayNames: Record<string, string> = {
        buyer: "Buyer",
        farmer: "Farmer / Producer",
        admin: "Admin",
      };
      const actualDisplayName = roleDisplayNames[result.user.role] || result.user.role;
      const selectedDisplayName = roleDisplayNames[selectedRole] || selectedRole;

      setErrorMessage(
        `Role Mismatch: This account is registered as a ${actualDisplayName}, not ${selectedDisplayName}. Please select "${actualDisplayName}" to sign in.`
      );
      return;
    }

    // Post-login redirect based on verified backend role
    if (redirectPath) {
      router.push(redirectPath);
    } else if (result.user.role === "admin") {
      router.push("/admin");
    } else if (result.user.role === "farmer") {
      router.push("/farmer/dashboard");
    } else {
      router.push("/buyer/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-ivory-50 text-forest-950">
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-16 px-4">
        <Container size="sm">
          <div className="bg-white border border-ivory-200 rounded-2xl shadow-card p-8 sm:p-10">
            {/* Header */}
            <div className="text-center mb-8">
              <span className="inline-block px-3 py-1 rounded-full bg-forest-50 text-forest-800 text-xs font-mono font-medium tracking-wide uppercase mb-3 border border-forest-200/60">
                Secure Portal
              </span>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-forest-950">
                Sign in to FarmLink
              </h1>
              <p className="mt-2 text-sm text-forest-700/80">
                Direct agricultural marketplace for buyers, producers, and administrators.
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

            {/* Step 1: Role Selection */}
            {!selectedRole ? (
              <div className="space-y-4">
                <label className="block text-xs font-mono font-semibold text-forest-900 uppercase tracking-wider mb-2">
                  Select your role to continue:
                </label>
                <div className="space-y-3">
                  {(["buyer", "farmer", "admin"] as LoginRole[]).map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => {
                        setSelectedRole(role);
                        setErrorMessage(null);
                      }}
                      className="w-full text-left p-4 rounded-xl border border-ivory-200 hover:border-forest-600 hover:bg-forest-50/40 transition-all flex items-center gap-4 group"
                    >
                      <div className="w-11 h-11 rounded-lg bg-ivory-100 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                        {roleMeta[role].icon}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-forest-950 flex items-center justify-between">
                          <span>{roleMeta[role].title}</span>
                          <span className="text-forest-600 font-semibold text-xs group-hover:translate-x-1 transition-transform">
                            Continue &rarr;
                          </span>
                        </div>
                        <p className="text-xs text-forest-700/80 mt-0.5">
                          {roleMeta[role].subtitle}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-ivory-200 text-center">
                  <p className="text-xs text-forest-700/80">
                    Don&apos;t have an account yet?{" "}
                    <Link href="/register" className="font-semibold text-forest-900 hover:text-forest-700 underline underline-offset-2">
                      Get Started
                    </Link>
                  </p>
                </div>
              </div>
            ) : (
              /* Step 2: Role-Tailored Email/Password Login Form */
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Active Role Indicator with Change Button */}
                <div className="p-3.5 rounded-xl border border-forest-200 bg-forest-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-subtle">
                      {roleMeta[selectedRole].icon}
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-forest-600 block">
                        Signing in as
                      </span>
                      <span className="text-sm font-bold text-forest-950">
                        {roleMeta[selectedRole].title}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRole(null);
                      setErrorMessage(null);
                    }}
                    className="text-xs text-forest-700 hover:text-forest-950 font-medium underline underline-offset-2 px-2 py-1"
                  >
                    Change Role
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-forest-900 uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    placeholder="name@organization.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isSubmitting}
                    className="w-full"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-mono font-semibold text-forest-900 uppercase tracking-wider">
                      Password
                    </label>
                  </div>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isSubmitting}
                    className="w-full"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-full text-sm font-semibold tracking-wide"
                >
                  {isSubmitting ? "Authenticating..." : `Sign in as ${roleMeta[selectedRole].title.split(" / ")[0]}`}
                </Button>

                {/* Footer Switcher */}
                <div className="mt-8 pt-6 border-t border-ivory-200 text-center space-y-2">
                  <p className="text-xs text-forest-700/80">
                    Don&apos;t have an account yet?{" "}
                    <Link
                      href={selectedRole === "farmer" ? "/register?role=farmer" : "/register"}
                      className="font-semibold text-forest-900 hover:text-forest-700 underline underline-offset-2"
                    >
                      Get Started
                    </Link>
                  </p>
                </div>
              </form>
            )}
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-ivory-50">
          <div className="w-8 h-8 border-2 border-forest-800 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
