import React, { useState } from "react";
import Link from "next/link";
import { ProduceItem, UserRole, BuyerCategory } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ImageFallback } from "@/components/ui/ImageFallback";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

interface ProduceCardProps {
  item: ProduceItem;
  userRole?: UserRole;
  buyerCategory?: BuyerCategory;
  onAddToCart?: (item: ProduceItem) => void;
}

export const ProduceCard: React.FC<ProduceCardProps> = ({
  item,
  userRole,
  buyerCategory = "household",
  onAddToCart,
}) => {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [added, setAdded] = useState(false);

  // Effective role: prop override takes precedence, fallback to authenticated user
  const effectiveRole = userRole || user?.role;
  const isOwner = user?.id && item.farmerId && Number(user.id) === Number(item.farmerId);

  // Compute contextual pricing or minimum order based on buyer category
  const isWholesale = buyerCategory === "wholesaler" || buyerCategory === "institution" || buyerCategory === "company";

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onAddToCart) {
      onAddToCart(item);
    } else {
      addToCart(item, item.minOrderQuantity || 1);
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };
  
  return (
    <div className="group bg-white rounded-xl border border-ivory-200 overflow-hidden shadow-subtle hover:shadow-card hover:border-forest-300 transition-all duration-200 flex flex-col h-full">
      {/* Produce Image with Graceful Fallback */}
      <Link href={`/marketplace/${item.id}`} className="block relative h-48 w-full bg-ivory-100 overflow-hidden">
        <ImageFallback
          src={item.imageUrl}
          alt={item.title}
          fill
          fallbackCategory={item.category}
          className="group-hover:scale-105 transition-transform duration-500"
        />

        {/* Organic & Category Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
          {item.isOrganic && (
            <Badge variant="forest" size="sm" dot>
              Certified Organic
            </Badge>
          )}
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-forest-950/75 text-ivory-50 backdrop-blur-xs capitalize">
            {item.category.replace("_", " & ")}
          </span>
        </div>

        {/* Harvest Freshness Tag */}
        <div className="absolute bottom-2 right-2 z-10">
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-ivory-50/90 text-forest-900 border border-ivory-300 backdrop-blur-xs">
            Harvested {item.harvestDate}
          </span>
        </div>
      </Link>

      {/* Produce Details */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Farm Origin */}
          <div className="flex items-center gap-1.5 text-xs text-forest-700/80 mb-1.5">
            <svg
              className="w-3.5 h-3.5 text-forest-600 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className="font-medium text-forest-900">{item.farmerName}</span>
            <span className="text-forest-400">&bull;</span>
            <span className="truncate">{item.farmLocation}</span>
          </div>

          {/* Title */}
          <Link href={`/marketplace/${item.id}`} className="block focus:outline-none focus:underline">
            <h3 className="font-semibold text-forest-950 text-base group-hover:text-forest-800 transition-colors">
              {item.title}
            </h3>
          </Link>

          <p className="text-xs text-forest-700/70 mt-1 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* Pricing and Order Actions */}
        <div className="pt-4 mt-4 border-t border-ivory-200">
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-forest-950 font-sans">
                  ₹{item.pricePerUnit.toFixed(2)}
                </span>
                <span className="text-xs text-forest-600 font-medium">/{item.unit}</span>
              </div>
              <span className="text-[11px] text-forest-500 block">
                Min. order: {item.minOrderQuantity} {item.unit}
              </span>
            </div>

            <div className="text-right">
              <span className="text-xs font-mono font-medium text-forest-800 bg-ivory-100 px-2 py-1 rounded border border-ivory-300">
                {item.availableQuantity} {item.unit} left
              </span>
            </div>
          </div>

          {effectiveRole === "farmer" ? (
            isOwner ? (
              <Link href="/farmer/dashboard" className="block w-full">
                <Button variant="secondary" size="sm" className="w-full text-xs">
                  Manage Your Listing
                </Button>
              </Link>
            ) : (
              <div className="w-full py-2 px-3 rounded-lg bg-ivory-100 border border-ivory-300 text-center text-xs font-medium text-forest-700">
                Research View &bull; ₹{item.pricePerUnit.toFixed(2)}/{item.unit}
              </div>
            )
          ) : effectiveRole === "admin" ? (
            <Link href="/admin/products" className="block w-full">
              <Button variant="outline" size="sm" className="w-full text-xs">
                Inspect in Admin Portal
              </Button>
            </Link>
          ) : effectiveRole === "buyer" ? (
            <Button
              variant={added ? "secondary" : isWholesale ? "accent" : "primary"}
              size="sm"
              className="w-full text-xs"
              onClick={handleAdd}
            >
              {added ? "✓ Added to Cart" : isWholesale ? "Add Wholesale Batch" : "Add to Cart"}
            </Button>
          ) : (
            <Link href={`/login?redirect=/marketplace/${item.id}`} className="block w-full">
              <Button variant="outline" size="sm" className="w-full text-xs">
                Sign In to Purchase
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
