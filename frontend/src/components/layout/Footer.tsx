import React from "react";
import Link from "next/link";
import { Container } from "./Container";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-forest-950 text-ivory-100/80 border-t border-forest-900 mt-20">
      <Container size="xl" className="py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-forest-800 text-ivory-50 flex items-center justify-center">
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
              <span className="font-semibold text-xl tracking-tight text-white font-sans">
                Farm<span className="text-forest-400">Link</span>
              </span>
            </div>
            <p className="text-sm text-ivory-300/70 max-w-sm leading-relaxed">
              Premium agricultural infrastructure connecting regional farmers directly with fresh produce buyers,
              ensuring sovereign prices for growers and traceable peak freshness for buyers.
            </p>
            <div className="pt-2 text-xs text-forest-300 font-mono">
              Direct Trade Protocol &middot; Equal Opportunity for Farmers & Buyers
            </div>
          </div>

          {/* Column 2: Platform Navigation */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">
              Platform
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/#how-it-works" className="hover:text-white transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/#for-farmers" className="hover:text-white transition-colors">
                  For Farmers
                </Link>
              </li>
              <li>
                <Link href="/#for-buyers" className="hover:text-white transition-colors">
                  For Buyers
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-white transition-colors font-medium text-forest-400">
                  Get Started &rarr;
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: For Producers */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">
              For Farmers
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/register?role=farmer" className="hover:text-white transition-colors">
                  Farmer Registration
                </Link>
              </li>
              <li>
                <Link href="/#for-farmers" className="hover:text-white transition-colors">
                  Sovereign Pricing
                </Link>
              </li>
              <li>
                <Link href="/#for-farmers" className="hover:text-white transition-colors">
                  Inventory Controls
                </Link>
              </li>
              <li>
                <Link href="/#for-farmers" className="hover:text-white transition-colors">
                  Order Management
                </Link>
              </li>
              <li>
                <Link href="/farmer/dashboard" className="hover:text-white transition-colors">
                  Farmer Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: For Buyers */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">
              For Buyers
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/register?role=buyer" className="hover:text-white transition-colors">
                  Buyer Registration
                </Link>
              </li>
              <li>
                <Link href="/#for-buyers" className="hover:text-white transition-colors">
                  Harvest Discovery
                </Link>
              </li>
              <li>
                <Link href="/#for-buyers" className="hover:text-white transition-colors">
                  Farm Provenance
                </Link>
              </li>
              <li>
                <Link href="/#for-buyers" className="hover:text-white transition-colors">
                  Real-Time Tracking
                </Link>
              </li>
              <li>
                <Link href="/buyer/dashboard" className="hover:text-white transition-colors">
                  Buyer Dashboard
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-forest-900/80 flex flex-col sm:flex-row items-center justify-between text-xs text-ivory-300/50 gap-4">
          <p>&copy; {new Date().getFullYear()} FarmLink Agriculture Inc. All rights reserved.</p>
          <p className="font-mono">Direct Trade Marketplace &middot; Next.js &middot; FastAPI &middot; PostgreSQL</p>
        </div>
      </Container>
    </footer>
  );
};
