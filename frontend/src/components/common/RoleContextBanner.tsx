import React from "react";
import { UserRole, BuyerCategory } from "@/types";
import { RoleBadge, BuyerCategoryBadge } from "@/components/ui/Badge";

interface RoleContextBannerProps {
  currentRole: UserRole;
  buyerCategory: BuyerCategory;
  onRoleChange: (role: UserRole) => void;
  onBuyerCategoryChange: (category: BuyerCategory) => void;
}

export const RoleContextBanner: React.FC<RoleContextBannerProps> = ({
  currentRole,
  buyerCategory,
  onRoleChange,
  onBuyerCategoryChange,
}) => {
  const buyerCategories: { value: BuyerCategory; label: string; desc: string }[] = [
    { value: "household", label: "Household", desc: "Small batch, weekly fresh harvest delivery" },
    { value: "restaurant", label: "Restaurant", desc: "Commercial kitchens, daily scheduled delivery" },
    { value: "retailer", label: "Retailer", desc: "Gourmet grocers, recurring boxed stock" },
    { value: "wholesaler", label: "Wholesaler", desc: "Crate & pallet pricing with freight logistics" },
    { value: "company", label: "Food Processing Company", desc: "Industrial multi-ton crop contracts" },
    { value: "institution", label: "Institution", desc: "Campuses, hospitals & public procurement" },
  ];

  return (
    <div className="bg-ivory-100 border-b border-ivory-300 py-3.5 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Current State Info */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="text-xs font-mono uppercase text-forest-700/80 font-semibold tracking-wider">
            Architecture Role Context:
          </span>
          <RoleBadge role={currentRole} />
          {currentRole === "buyer" && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-forest-500">&rarr;</span>
              <BuyerCategoryBadge category={buyerCategory} />
            </div>
          )}
        </div>

        {/* Role & Attribute Switchers */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Role selector */}
          <div className="inline-flex rounded-lg border border-ivory-300 bg-white p-0.5 shadow-xs">
            {(["buyer", "farmer", "admin"] as UserRole[]).map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => onRoleChange(role)}
                className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition-colors ${
                  currentRole === role
                    ? "bg-forest-800 text-white"
                    : "text-forest-700 hover:text-forest-950"
                }`}
              >
                {role}
              </button>
            ))}
          </div>

          {/* If buyer, show category attribute selector */}
          {currentRole === "buyer" && (
            <div className="flex items-center gap-1.5">
              <label htmlFor="buyer-cat" className="text-xs text-forest-700 font-medium whitespace-nowrap">
                Buyer Profile:
              </label>
              <select
                id="buyer-cat"
                value={buyerCategory}
                onChange={(e) => onBuyerCategoryChange(e.target.value as BuyerCategory)}
                className="text-xs bg-white border border-ivory-300 rounded-md py-1 pl-2 pr-7 text-forest-900 font-medium focus:border-forest-700 focus:ring-1 focus:ring-forest-700"
              >
                {buyerCategories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
