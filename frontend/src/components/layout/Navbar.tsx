"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Container } from "./Container";
import { UserRole } from "@/types";

import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { fetchUnreadCount } from "@/lib/api";

interface NavbarProps {
  currentRole?: UserRole;
  onRoleChange?: (role: UserRole) => void;
  className?: string;
}

export const Navbar: React.FC<NavbarProps> = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const [unreadCount, setUnreadCount] = useState(0);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    if (typeof window !== "undefined" && window.location.pathname === "/") {
      e.preventDefault();
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
        window.history.pushState(null, "", `/#${sectionId}`);
      }
    }
  };

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    let isMounted = true;
    const updateCount = async () => {
      const { unread_count } = await fetchUnreadCount();
      if (isMounted) setUnreadCount(unread_count);
    };
    updateCount();
    const intervalId = setInterval(updateCount, 45000);
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [user]);

  return (
    <header className="sticky top-0 z-50 bg-ivory-50/95 backdrop-blur-md border-b border-ivory-200">
      <Container size="xl">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-lg bg-forest-800 text-ivory-50 flex items-center justify-center shadow-subtle group-hover:bg-forest-900 transition-colors">
              <svg
                className="w-5 h-5 text-ivory-100"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2a10 10 0 0 1 10 10c0 5.523-4.477 10-10 10S2 17.523 2 12A10 10 0 0 1 12 2Z" />
                <path d="M12 22V12" />
                <path d="M12 12c2.5-3 6-3 6-3s0 3.5-3 6" />
                <path d="M12 15c-2-2-4.5-2-4.5-2s0 2.5 2 4" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-xl tracking-tight text-forest-950 font-sans">
                Farm<span className="text-forest-600">Link</span>
              </span>
              <span className="text-[10px] tracking-widest text-forest-700/70 uppercase font-mono">
                Direct Agricultural Commerce
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-forest-800">
            {/* If Buyer */}
            {user?.role === "buyer" && (
              <>
                <Link
                  href="/buyer/dashboard"
                  className="text-forest-900 font-semibold flex items-center gap-1.5 hover:text-forest-700 transition-colors py-1"
                >
                  <span className="w-2 h-2 rounded-full bg-forest-600" />
                  Buyer Dashboard
                </Link>
                <Link href="/marketplace" className="hover:text-forest-950 transition-colors py-1">
                  Marketplace
                </Link>
                <Link href="/buyer/orders" className="hover:text-forest-950 transition-colors py-1">
                  My Orders
                </Link>
                <Link href="/for-businesses" className="hover:text-forest-950 transition-colors py-1">
                  For Businesses
                </Link>
              </>
            )}

            {/* If Farmer */}
            {user?.role === "farmer" && (
              <>
                <Link
                  href="/farmer/dashboard"
                  className="text-forest-900 font-semibold flex items-center gap-1.5 hover:text-forest-700 transition-colors py-1"
                >
                  <span className="w-2 h-2 rounded-full bg-forest-600" />
                  Farmer Dashboard
                </Link>
                <Link href="/marketplace" className="hover:text-forest-950 transition-colors py-1">
                  Marketplace
                </Link>
                <Link href="/for-farmers" className="hover:text-forest-950 transition-colors py-1">
                  For Farmers
                </Link>
              </>
            )}

            {/* If Admin */}
            {user?.role === "admin" && (
              <>
                <Link
                  href="/admin"
                  className="text-terracotta-700 font-semibold flex items-center gap-1.5 hover:text-terracotta-800 transition-colors py-1"
                >
                  <span className="w-2 h-2 rounded-full bg-terracotta-600" />
                  Admin Portal
                </Link>
                <Link href="/marketplace" className="hover:text-forest-950 transition-colors py-1">
                  Marketplace
                </Link>
              </>
            )}

            {/* If Logged Out */}
            {!user && (
              <>
                <Link
                  href="/#how-it-works"
                  onClick={(e) => scrollToSection(e, "how-it-works")}
                  className="hover:text-forest-950 transition-colors py-1 cursor-pointer"
                >
                  How It Works
                </Link>
                <Link
                  href="/#for-farmers"
                  onClick={(e) => scrollToSection(e, "for-farmers")}
                  className="hover:text-forest-950 transition-colors py-1 cursor-pointer"
                >
                  For Farmers
                </Link>
                <Link
                  href="/#for-buyers"
                  onClick={(e) => scrollToSection(e, "for-buyers")}
                  className="hover:text-forest-950 transition-colors py-1 cursor-pointer"
                >
                  For Buyers
                </Link>
              </>
            )}
          </nav>

          {/* Right Section: Cart & Auth State / Profile */}
          <div className="hidden lg:flex items-center gap-3">
            {user?.role === "buyer" && (
              <Link
                href="/cart"
                className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-ivory-100 text-forest-900 border border-ivory-300 hover:bg-ivory-200 transition-colors"
                aria-label="Shopping Cart"
              >
                <svg className="w-4 h-4 text-forest-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <span>Cart</span>
                {totalItems > 0 && (
                  <span className="w-5 h-5 rounded-full bg-forest-800 text-ivory-50 text-[10px] font-bold flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Link>
            )}

            {user && (
              <Link
                href="/notifications"
                className="relative flex items-center justify-center p-2 rounded-lg text-forest-800 hover:text-forest-950 hover:bg-ivory-200 transition-colors border border-ivory-300 bg-ivory-100"
                aria-label={`Notification Centre ${unreadCount > 0 ? `(${unreadCount} unread)` : ""}`}
              >
                <svg className="w-4 h-4 text-forest-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-terracotta-600 text-ivory-50 text-[10px] font-bold flex items-center justify-center shadow-subtle font-mono">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
            )}

            {user ? (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs font-semibold text-forest-950">
                    {user.fullName}
                  </div>
                  <div className="text-[10px] font-mono uppercase text-forest-600 tracking-wider">
                    {user.role} {user.buyerType ? `(${user.buyerType})` : ""}
                  </div>
                </div>

                {user.role === "buyer" && (
                  <Link
                    href="/buyer/dashboard"
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-forest-100 text-forest-900 border border-forest-200 hover:bg-forest-200 transition-colors"
                  >
                    Dashboard
                  </Link>
                )}

                {user.role === "farmer" && (
                  <Link
                    href="/farmer/dashboard"
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-forest-100 text-forest-900 border border-forest-200 hover:bg-forest-200 transition-colors"
                  >
                    Dashboard
                  </Link>
                )}

                {user.role === "admin" && (
                  <Link
                    href="/admin"
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-terracotta-100 text-terracotta-900 border border-terracotta-200 hover:bg-terracotta-200 transition-colors"
                  >
                    Admin Portal
                  </Link>
                )}

                <button
                  type="button"
                  onClick={() => logout()}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-forest-700 hover:text-forest-950 hover:bg-ivory-200 transition-colors border border-ivory-300"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-forest-800 hover:text-forest-950 hover:bg-ivory-100 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-forest-800 text-ivory-50 hover:bg-forest-900 active:bg-forest-950 transition-all shadow-subtle hover:shadow-card"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button & quick actions */}
          <div className="flex md:hidden items-center gap-1.5">
            {user && (
              <Link
                href="/notifications"
                className="relative p-2 rounded-lg text-forest-800 hover:bg-ivory-200 transition-colors"
                aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ""}`}
              >
                <svg className="w-5 h-5 text-forest-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-[16px] px-0.5 rounded-full bg-terracotta-600 text-ivory-50 text-[9px] font-bold flex items-center justify-center font-mono">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
            )}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-forest-800 hover:bg-ivory-200 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-ivory-200 space-y-3">
            <nav className="flex flex-col space-y-2 text-sm font-medium text-forest-900">
              {/* Buyer Mobile Menu */}
              {user?.role === "buyer" && (
                <>
                  <Link
                    href="/buyer/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-2 rounded-lg hover:bg-ivory-100 font-semibold text-forest-950 flex items-center gap-2"
                  >
                    <span className="w-2 h-2 rounded-full bg-forest-600" />
                    Buyer Dashboard
                  </Link>
                  <Link
                    href="/marketplace"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-2 rounded-lg hover:bg-ivory-100"
                  >
                    Marketplace
                  </Link>
                  <Link
                    href="/buyer/orders"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-2 rounded-lg hover:bg-ivory-100"
                  >
                    My Orders
                  </Link>
                  <Link
                    href="/cart"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-2 rounded-lg hover:bg-ivory-100 flex items-center justify-between"
                  >
                    <span>Cart</span>
                    {totalItems > 0 && (
                      <span className="w-5 h-5 rounded-full bg-forest-800 text-ivory-50 text-[10px] font-bold flex items-center justify-center">
                        {totalItems}
                      </span>
                    )}
                  </Link>
                  <Link
                    href="/notifications"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-2 rounded-lg hover:bg-ivory-100 flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-forest-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                      Notifications
                    </span>
                    {unreadCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-terracotta-600 text-ivory-50 text-[10px] font-bold flex items-center justify-center font-mono">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </Link>
                  <Link
                    href="/for-businesses"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-2 rounded-lg hover:bg-ivory-100"
                  >
                    For Businesses
                  </Link>
                </>
              )}

              {/* Farmer Mobile Menu */}
              {user?.role === "farmer" && (
                <>
                  <Link
                    href="/farmer/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-2 rounded-lg hover:bg-ivory-100 font-semibold text-forest-900 flex items-center gap-2"
                  >
                    <span className="w-2 h-2 rounded-full bg-forest-600" />
                    Farmer Dashboard
                  </Link>
                  <Link
                    href="/marketplace"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-2 rounded-lg hover:bg-ivory-100"
                  >
                    Marketplace
                  </Link>
                  <Link
                    href="/notifications"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-2 rounded-lg hover:bg-ivory-100 flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-forest-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                      Notifications
                    </span>
                    {unreadCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-terracotta-600 text-ivory-50 text-[10px] font-bold flex items-center justify-center font-mono">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </Link>
                  <Link
                    href="/for-farmers"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-2 rounded-lg hover:bg-ivory-100"
                  >
                    For Farmers
                  </Link>
                </>
              )}

              {/* Admin Mobile Menu */}
              {user?.role === "admin" && (
                <>
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-2 rounded-lg hover:bg-ivory-100 font-semibold text-terracotta-800 flex items-center gap-2"
                  >
                    <span className="w-2 h-2 rounded-full bg-terracotta-600" />
                    Admin Portal
                  </Link>
                  <Link
                    href="/marketplace"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-2 rounded-lg hover:bg-ivory-100"
                  >
                    Marketplace
                  </Link>
                  <Link
                    href="/notifications"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-2 rounded-lg hover:bg-ivory-100 flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-forest-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                      Notifications
                    </span>
                    {unreadCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-terracotta-600 text-ivory-50 text-[10px] font-bold flex items-center justify-center font-mono">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </Link>
                </>
              )}

              {/* Logged Out Mobile Menu */}
              {!user && (
                <>
                  <Link
                    href="/#how-it-works"
                    onClick={(e) => {
                      scrollToSection(e, "how-it-works");
                      setMobileMenuOpen(false);
                    }}
                    className="px-3.5 py-2.5 rounded-lg hover:bg-ivory-100 font-medium text-forest-900"
                  >
                    How It Works
                  </Link>
                  <Link
                    href="/#for-farmers"
                    onClick={(e) => {
                      scrollToSection(e, "for-farmers");
                      setMobileMenuOpen(false);
                    }}
                    className="px-3.5 py-2.5 rounded-lg hover:bg-ivory-100 font-medium text-forest-900"
                  >
                    For Farmers
                  </Link>
                  <Link
                    href="/#for-buyers"
                    onClick={(e) => {
                      scrollToSection(e, "for-buyers");
                      setMobileMenuOpen(false);
                    }}
                    className="px-3.5 py-2.5 rounded-lg hover:bg-ivory-100 font-medium text-forest-900"
                  >
                    For Buyers
                  </Link>
                </>
              )}
            </nav>

            {user ? (
              <div className="pt-3 px-3 border-t border-ivory-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-forest-950">{user.fullName}</div>
                  <div className="text-[10px] font-mono text-forest-600 uppercase">{user.role}</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-xs text-red-600 font-medium"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-3 px-3 border-t border-ivory-200">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 text-center text-sm font-semibold rounded-xl border border-ivory-300 text-forest-800 hover:bg-ivory-100"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 text-center text-sm font-semibold rounded-xl bg-forest-800 text-white hover:bg-forest-900 shadow-subtle"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        )}
      </Container>
    </header>
  );
};
