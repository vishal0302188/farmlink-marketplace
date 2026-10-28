import React from "react";
import { UserRole, BuyerCategory } from "@/types";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "forest" | "earth" | "amber" | "neutral" | "outline";
  size?: "sm" | "md";
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "neutral",
  size = "md",
  dot = false,
  className = "",
  ...props
}) => {
  const variantStyles = {
    forest: "bg-forest-100 text-forest-800 border-forest-200",
    earth: "bg-earth-100 text-earth-800 border-earth-200",
    amber: "bg-amber-100 text-amber-900 border-amber-200",
    neutral: "bg-ivory-200 text-forest-900 border-ivory-300",
    outline: "bg-transparent text-forest-800 border-forest-300",
  }[variant];

  const dotStyles = {
    forest: "bg-forest-600",
    earth: "bg-earth-500",
    amber: "bg-amber-500",
    neutral: "bg-forest-700",
    outline: "bg-forest-800",
  }[variant];

  const sizeStyles = {
    sm: "text-[11px] px-2 py-0.5",
    md: "text-xs px-2.5 py-1",
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${variantStyles} ${sizeStyles} ${className}`}
      {...props}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotStyles}`} />}
      {children}
    </span>
  );
};

export const RoleBadge: React.FC<{ role: UserRole }> = ({ role }) => {
  const config = {
    farmer: { label: "Farmer", variant: "forest" as const },
    buyer: { label: "Buyer", variant: "amber" as const },
    admin: { label: "Admin", variant: "earth" as const },
  }[role];

  return (
    <Badge variant={config.variant} size="sm" dot>
      {config.label}
    </Badge>
  );
};

export const BuyerCategoryBadge: React.FC<{ category: BuyerCategory }> = ({ category }) => {
  const labels: Record<BuyerCategory, string> = {
    household: "Household",
    restaurant: "Restaurant & Hospitality",
    retailer: "Retailer",
    wholesaler: "Wholesaler",
    company: "Food Processor",
    institution: "Institution",
  };

  return (
    <Badge variant="neutral" size="sm">
      {labels[category] || category}
    </Badge>
  );
};
