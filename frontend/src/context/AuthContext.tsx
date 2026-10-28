"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "@/types";
import { getCurrentUser, loginUser, logoutUser, registerUser, RegisterPayload } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  register: (payload: RegisterPayload) => Promise<{ success: boolean; user?: User; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => ({ success: false }),
  register: async () => ({ success: false }),
  logout: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const current = await getCurrentUser();
      setUser(current);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    const res = await loginUser(email, password);
    setIsLoading(false);
    if (res.user && !res.error) {
      setUser(res.user);
      return { success: true, user: res.user };
    }
    return { success: false, error: res.error || "Login failed" };
  };

  const register = async (payload: RegisterPayload) => {
    setIsLoading(true);
    const res = await registerUser(payload);
    setIsLoading(false);
    if (res.user && !res.error) {
      setUser(res.user);
      return { success: true, user: res.user };
    }
    return { success: false, error: res.error || "Registration failed" };
  };

  const logout = async () => {
    await logoutUser();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
