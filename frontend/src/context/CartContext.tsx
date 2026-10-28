"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { ProduceItem, CartItem } from "@/types";

interface CartContextType {
  items: CartItem[];
  addToCart: (product: ProduceItem, quantity?: number) => { success: boolean; message?: string };
  updateQuantity: (productId: string, quantity: number) => { success: boolean; message?: string };
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalAmount: number;
}

const CartContext = createContext<CartContextType>({
  items: [],
  addToCart: () => ({ success: false }),
  updateQuantity: () => ({ success: false }),
  removeFromCart: () => {},
  clearCart: () => {},
  totalItems: 0,
  totalAmount: 0,
});

const CART_STORAGE_KEY = "farmlink_cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch {
      // Ignore storage read error
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Sync cart to localStorage whenever items change
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore storage write error
    }
  }, [items, isHydrated]);

  const addToCart = (product: ProduceItem, quantity?: number): { success: boolean; message?: string } => {
    const moq = product.minOrderQuantity || 1;
    const qtyToAdd = quantity !== undefined ? quantity : moq;

    if (qtyToAdd < moq) {
      return {
        success: false,
        message: `Minimum order quantity for ${product.title} is ${moq} ${product.unit}.`,
      };
    }

    if (product.availableQuantity < qtyToAdd) {
      return {
        success: false,
        message: `Only ${product.availableQuantity} ${product.unit} available in stock.`,
      };
    }

    let result = { success: true, message: `Added ${qtyToAdd} ${product.unit} to cart.` };

    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => String(i.product.id) === String(product.id));
      if (existingIndex > -1) {
        const existing = prev[existingIndex];
        const newTotalQty = existing.quantity + qtyToAdd;

        if (newTotalQty > product.availableQuantity) {
          result = {
            success: false,
            message: `Cannot add more. Total in cart would exceed available stock (${product.availableQuantity} ${product.unit}).`,
          };
          return prev;
        }

        const updated = [...prev];
        updated[existingIndex] = { ...existing, quantity: newTotalQty };
        return updated;
      } else {
        return [...prev, { product, quantity: qtyToAdd }];
      }
    });

    return result;
  };

  const updateQuantity = (productId: string, quantity: number): { success: boolean; message?: string } => {
    const existing = items.find((i) => String(i.product.id) === String(productId));
    if (!existing) {
      return { success: false, message: "Item not in cart." };
    }

    const moq = existing.product.minOrderQuantity || 1;
    if (quantity < moq) {
      return {
        success: false,
        message: `Quantity cannot be less than minimum order quantity of ${moq} ${existing.product.unit}.`,
      };
    }

    if (quantity > existing.product.availableQuantity) {
      return {
        success: false,
        message: `Only ${existing.product.availableQuantity} ${existing.product.unit} available in stock.`,
      };
    }

    setItems((prev) =>
      prev.map((i) => (String(i.product.id) === String(productId) ? { ...i, quantity } : i))
    );

    return { success: true };
  };

  const removeFromCart = (productId: string) => {
    setItems((prev) => prev.filter((i) => String(i.product.id) !== String(productId)));
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.length;
  const totalAmount = items.reduce(
    (sum, item) => sum + item.quantity * item.product.pricePerUnit,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalItems,
        totalAmount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
