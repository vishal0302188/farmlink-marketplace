"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push(`/login?redirect=${encodeURIComponent(pathname || "/admin")}`);
      } else if (user.role === "farmer") {
        router.push("/farmer/dashboard");
      } else if (user.role === "buyer") {
        router.push("/buyer/dashboard");
      }
    }
  }, [user, isLoading, router, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ivory-50 flex flex-col justify-between">
        <Navbar />
        <Container size="xl" className="py-24 text-center">
          <div className="w-12 h-12 border-4 border-forest-200 border-t-forest-800 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-medium text-forest-700">Verifying administrative security credentials...</p>
        </Container>
        <Footer />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  const navItems = [
    { label: "Dashboard Overview", href: "/admin" },
    { label: "Product Moderation", href: "/admin/products" },
    { label: "User Management", href: "/admin/users" },
    { label: "Order Oversight", href: "/admin/orders" },
  ];

  return (
    <div className="min-h-screen bg-ivory-50 flex flex-col justify-between text-forest-950 font-sans">
      <div>
        <Navbar />

        {/* Admin Operational Sub-Header */}
        <section className="bg-forest-900 text-ivory-50 border-b border-forest-950">
          <Container size="xl" className="py-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-terracotta-600/30 border border-terracotta-500/40 text-terracotta-300 flex items-center justify-center">
                  <svg className="w-5 h-5 text-terracotta-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg font-bold tracking-tight text-ivory-50 font-serif">FarmLink Admin Portal</h1>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-terracotta-700/60 text-terracotta-200 border border-terracotta-500/40 font-semibold tracking-wider">
                      Internal Ops
                    </span>
                  </div>
                  <p className="text-xs text-ivory-300">
                    Logged in as <span className="font-semibold text-ivory-100">{user.fullName}</span> ({user.email})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/marketplace"
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-forest-800/80 hover:bg-forest-800 text-ivory-200 hover:text-ivory-50 border border-forest-700/60 transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Public Marketplace
                </Link>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 mt-5 -mb-5 border-t border-forest-800/80 pt-2 overflow-x-auto">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors whitespace-nowrap ${
                      isActive
                        ? "bg-ivory-50 text-forest-950 shadow-subtle"
                        : "text-ivory-300 hover:text-ivory-100 hover:bg-forest-800/50"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </Container>
        </section>

        {/* Page Content Container */}
        <main className="py-8">
          <Container size="xl">{children}</Container>
        </main>
      </div>

      <Footer />
    </div>
  );
}
