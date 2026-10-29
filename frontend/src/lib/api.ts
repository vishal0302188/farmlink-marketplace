import {
  ProduceItem,
  ProduceCategory,
  UnitType,
  User,
  UserRole,
  BuyerCategory,
  AdminDashboardMetrics,
  AdminUserItem,
  ApiOrder,
  NotificationItem,
  NotificationListResponse,
} from "@/types";
import { SAMPLE_PRODUCE } from "@/lib/constants";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export interface BackendFarmer {
  id: number;
  full_name: string;
  organization_name?: string | null;
  location?: string | null;
  district?: string | null;
  state?: string | null;
  bio?: string | null;
  is_verified?: boolean;
}

export interface BackendProduct {
  id: number;
  name: string;
  description: string;
  category: string;
  price: number;
  unit: string;
  available_quantity: number;
  minimum_order_quantity: number;
  growing_location: string;
  harvest_date: string | null;
  is_organic: boolean;
  image_url: string | null;
  listing_status: string;
  moderation_reason?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  farmer?: BackendFarmer | null;
}

export function mapBackendProductToProduceItem(item: BackendProduct): ProduceItem {
  const farmerName =
    item.farmer?.organization_name ||
    item.farmer?.full_name ||
    "Verified Local Producer";
  const location =
    item.growing_location ||
    (item.farmer?.district && item.farmer?.state
      ? `${item.farmer.district}, ${item.farmer.state}`
      : "Direct from Farm");

  let harvestDateFormatted = "Recent Harvest";
  if (item.harvest_date) {
    try {
      const d = new Date(item.harvest_date);
      harvestDateFormatted = d.toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      harvestDateFormatted = item.harvest_date;
    }
  }

  return {
    id: String(item.id),
    farmerId: String(item.farmer?.id || "farmer-" + item.id),
    farmerName,
    farmLocation: location,
    farmerBio: item.farmer?.bio || undefined,
    title: item.name,
    description: item.description,
    category: (item.category as ProduceCategory) || "vegetables",
    pricePerUnit: Number(item.price),
    unit: (item.unit as UnitType) || "kg",
    availableQuantity: Number(item.available_quantity),
    minOrderQuantity: Number(item.minimum_order_quantity) || 1,
    isOrganic: Boolean(item.is_organic),
    harvestDate: harvestDateFormatted,
    listingDate: item.created_at
      ? item.created_at.split("T")[0]
      : new Date().toISOString().split("T")[0],
    imageUrl:
      item.image_url ||
      "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80",
    fulfilmentMethods: [
      "Temperature-Controlled Freight",
      "Farm Gate Direct Pickup",
      "Regional Delivery Hub",
    ],
    storageAdvice: "Store in a cool, ventilated produce facility or ambient shaded shelter.",
    grade: item.is_organic ? "Natural / Zero-Chemical Lot" : "Commercial Grade A",
  };
}

export interface ProductQueryFilters {
  search?: string;
  category?: string;
  min_price?: number;
  max_price?: number;
  location?: string;
  is_organic?: boolean;
  skip?: number;
  limit?: number;
}

export async function fetchProductsFromBackend(
  filters?: ProductQueryFilters
): Promise<{ items: ProduceItem[]; source: "api" | "fallback"; error?: string }> {
  try {
    const params = new URLSearchParams();
    if (filters?.search) params.append("search", filters.search);
    if (filters?.category && filters.category !== "all") {
      params.append("category", filters.category);
    }
    if (filters?.min_price !== undefined && filters.min_price >= 0) {
      params.append("min_price", String(filters.min_price));
    }
    if (filters?.max_price !== undefined && filters.max_price >= 0) {
      params.append("max_price", String(filters.max_price));
    }
    if (filters?.is_organic) {
      params.append("is_organic", "true");
    }
    if (filters?.location && filters.location !== "all") {
      params.append("location", filters.location);
    }
    if (filters?.skip !== undefined) params.append("skip", String(filters.skip));
    if (filters?.limit !== undefined) params.append("limit", String(filters.limit));

    const url = `${API_BASE_URL}/products/?${params.toString()}`;
    const res = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`API returned HTTP ${res.status}`);
    }

    const backendProducts: BackendProduct[] = await res.json();
    const mappedItems = backendProducts.map(mapBackendProductToProduceItem);

    return {
      items: mappedItems,
      source: "api",
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn("Backend API unavailable or unreachable, using local sample dataset fallback:", message);
    return {
      items: SAMPLE_PRODUCE,
      source: "fallback",
      error: message,
    };
  }
}

export async function fetchProductByIdFromBackend(
  id: string
): Promise<{ item: ProduceItem | null; source: "api" | "fallback" }> {
  // If id is numeric, attempt backend fetch
  if (/^\d+$/.test(id)) {
    try {
      const res = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (res.ok) {
        const data: BackendProduct = await res.json();
        return { item: mapBackendProductToProduceItem(data), source: "api" };
      }
    } catch {
      // Fall through to sample lookup
    }
  }

  // Fallback to sample data
  const sample = SAMPLE_PRODUCE.find((p) => p.id === id) || null;
  return { item: sample, source: "fallback" };
}

// ---------------------------------------------------------------------------
// AUTHENTICATION & USER SESSION API CLIENT
// ---------------------------------------------------------------------------

export interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
  role: "farmer" | "buyer";
  buyer_type?: string;
  phone_number?: string;
  organization_name?: string;
  location?: string;
  district?: string;
  state?: string;
  pincode?: string;
  bio?: string;
}

export interface BackendUserResponse {
  id: number | string;
  email: string;
  full_name: string;
  role: UserRole;
  buyer_type?: BuyerCategory | null;
  phone_number?: string | null;
  organization_name?: string | null;
  location?: string | null;
  district?: string | null;
  state?: string | null;
  pincode?: string | null;
  bio?: string | null;
  is_verified?: boolean;
  is_active?: boolean;
}

export function mapBackendUserToUser(bUser: BackendUserResponse): User {
  return {
    id: bUser.id,
    email: bUser.email,
    fullName: bUser.full_name,
    role: bUser.role,
    buyerType: bUser.buyer_type ?? undefined,
    buyerCategory: bUser.buyer_type ?? undefined,
    phoneNumber: bUser.phone_number ?? undefined,
    organizationName: bUser.organization_name ?? undefined,
    location: bUser.location ?? undefined,
    district: bUser.district ?? undefined,
    state: bUser.state ?? undefined,
    pincode: bUser.pincode ?? undefined,
    bio: bUser.bio ?? undefined,
    isVerified: Boolean(bUser.is_verified),
    isActive: Boolean(bUser.is_active),
  };
}

export const TOKEN_STORAGE_KEY = "farmlink_token";
export const USER_STORAGE_KEY = "farmlink_user";

export function getStoredToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  }
  return null;
}

export function setStoredToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  }
}

export function clearStoredAuth(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  }
}

export function getAuthHeaders(): Record<string, string> {
  const token = getStoredToken();
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

export interface UpdateProfilePayload {
  full_name?: string;
  phone_number?: string;
  organization_name?: string;
  location?: string;
  district?: string;
  state?: string;
  pincode?: string;
  bio?: string;
}

export async function updateUserProfile(payload: UpdateProfilePayload): Promise<{ user: User | null; error?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/users/me`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...getAuthHeaders(),
      },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || "Failed to update profile");
    }

    const updatedUser = mapBackendUserToUser(data);
    if (typeof window !== "undefined") {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
    }
    return { user: updatedUser };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { user: null, error: msg };
  }
}

export async function registerUser(payload: RegisterPayload): Promise<{ user: User | null; error?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || "Registration failed");
    }

    if (typeof window !== "undefined") {
      if (data.access_token) {
        setStoredToken(data.access_token);
      }
      if (data.user) {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(mapBackendUserToUser(data.user)));
      }
    }

    return { user: mapBackendUserToUser(data.user) };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { user: null, error: msg };
  }
}

export async function loginUser(email: string, password: string): Promise<{ user: User | null; error?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || "Invalid email or password");
    }

    if (typeof window !== "undefined") {
      if (data.access_token) {
        setStoredToken(data.access_token);
      }
      if (data.user) {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(mapBackendUserToUser(data.user)));
      }
    }

    return { user: mapBackendUserToUser(data.user) };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { user: null, error: msg };
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        ...getAuthHeaders(),
      },
      credentials: "include",
    });
  } catch {
    // Ignore network error on logout
  } finally {
    clearStoredAuth();
  }
}

export async function getCurrentUser(): Promise<import("@/types").User | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...getAuthHeaders(),
      },
      credentials: "include",
      cache: "no-store",
    });

    if (!res.ok) {
      clearStoredAuth();
      return null;
    }

    const data = await res.json();
    const user = mapBackendUserToUser(data);
    if (typeof window !== "undefined") {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    }
    return user;
  } catch {
    // Fall back to cached user in local storage if offline
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem(USER_STORAGE_KEY);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {
          return null;
        }
      }
    }
    return null;
  }
}

// ---------------------------------------------------------------------------
// FARMER DASHBOARD & PRODUCE MANAGEMENT API CLIENT
// ---------------------------------------------------------------------------

export interface FarmerDashboardData {
  total_active_listings: number;
  total_available_inventory: number;
  incoming_orders_count: number;
  total_completed_orders: number;
  total_revenue: number;
  pending_revenue: number;
  recent_products: ProduceItem[];
  incoming_orders: Array<{
    id: number;
    buyer_id: number;
    farmer_id: number;
    status: string;
    total_amount: number;
    fulfillment_method: string;
    delivery_city?: string;
    delivery_state?: string;
    created_at: string;
  }>;
}

export async function fetchFarmerDashboard(): Promise<{ data: FarmerDashboardData | null; error?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/farmer/dashboard`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...getAuthHeaders(),
      },
      credentials: "include",
      cache: "no-store",
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Server returned HTTP ${res.status}`);
    }

    const raw = await res.json();
    return {
      data: {
        total_active_listings: raw.total_active_listings ?? 0,
        total_available_inventory: raw.total_available_inventory ?? 0,
        incoming_orders_count: raw.incoming_orders_count ?? 0,
        total_completed_orders: raw.total_completed_orders ?? 0,
        total_revenue: raw.total_revenue ?? 0,
        pending_revenue: raw.pending_revenue ?? 0,
        recent_products: (raw.recent_products || []).map(mapBackendProductToProduceItem),
        incoming_orders: raw.incoming_orders || [],
      },
    };
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function fetchFarmerProducts(): Promise<{ products: ProduceItem[]; error?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/farmer/products`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...getAuthHeaders(),
      },
      credentials: "include",
      cache: "no-store",
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Server returned HTTP ${res.status}`);
    }

    const raw: BackendProduct[] = await res.json();
    return { products: raw.map(mapBackendProductToProduceItem) };
  } catch (err: unknown) {
    return { products: [], error: err instanceof Error ? err.message : String(err) };
  }
}

export interface ProductFormData {
  name: string;
  description: string;
  category: string;
  price: number;
  unit: string;
  available_quantity: number;
  minimum_order_quantity: number;
  growing_location: string;
  is_organic?: boolean;
  image_url?: string;
}

export async function createFarmerProduct(payload: ProductFormData): Promise<{ product: ProduceItem | null; error?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/farmer/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...getAuthHeaders(),
      },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to create produce listing");
    }

    const raw: BackendProduct = await res.json();
    return { product: mapBackendProductToProduceItem(raw) };
  } catch (err: unknown) {
    return { product: null, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function updateFarmerProduct(id: number | string, payload: Partial<ProductFormData>): Promise<{ product: ProduceItem | null; error?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/farmer/products/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...getAuthHeaders(),
      },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to update produce listing");
    }

    const raw: BackendProduct = await res.json();
    return { product: mapBackendProductToProduceItem(raw) };
  } catch (err: unknown) {
    return { product: null, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function updateFarmerProductStock(id: number | string, availableQuantity: number): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/farmer/products/${id}/stock`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...getAuthHeaders(),
      },
      credentials: "include",
      body: JSON.stringify({ available_quantity: availableQuantity }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to update stock");
    }

    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function archiveFarmerProduct(id: number | string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/farmer/products/${id}`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        ...getAuthHeaders(),
      },
      credentials: "include",
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to archive product");
    }

    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// ---------------------------------------------------------------------------
// BUYER & FARMER ORDERS API CLIENT
// ---------------------------------------------------------------------------

export interface CheckoutPayload {
  items: Array<{ product_id: number; quantity: number }>;
  fulfillment_method?: string;
  payment_method?: string;
  delivery_address?: string;
  delivery_city?: string;
  delivery_state?: string;
  delivery_pincode?: string;
  notes?: string;
}

export async function submitCartCheckout(payload: CheckoutPayload): Promise<{ data: import("@/types").ApiOrder[] | null; totalOrders?: number; grandTotal?: number; error?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/orders/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...getAuthHeaders(),
      },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || "Checkout failed");
    }

    return {
      data: data.orders,
      totalOrders: data.total_orders_placed,
      grandTotal: data.grand_total,
    };
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function fetchBuyerOrders(status?: string): Promise<{ orders: import("@/types").ApiOrder[]; error?: string }> {
  try {
    const url = status ? `${API_BASE_URL}/orders/?status=${status}` : `${API_BASE_URL}/orders/`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...getAuthHeaders(),
      },
      credentials: "include",
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to load orders");
    }

    const data = await res.json();
    return { orders: data };
  } catch (err: unknown) {
    return { orders: [], error: err instanceof Error ? err.message : String(err) };
  }
}

export async function fetchBuyerOrderDetail(orderId: number | string): Promise<{ order: import("@/types").ApiOrder | null; error?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...getAuthHeaders(),
      },
      credentials: "include",
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Order not found or unauthorized");
    }

    const data = await res.json();
    return { order: data };
  } catch (err: unknown) {
    return { order: null, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function cancelBuyerOrder(orderId: number | string, notes?: string): Promise<{ success: boolean; order?: import("@/types").ApiOrder; error?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/orders/${orderId}/cancel`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...getAuthHeaders(),
      },
      credentials: "include",
      body: JSON.stringify({ notes }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to cancel order");
    }

    const data = await res.json();
    return { success: true, order: data };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function fetchFarmerOrders(status?: string): Promise<{ orders: import("@/types").ApiOrder[]; error?: string }> {
  try {
    const url = status ? `${API_BASE_URL}/farmer/orders?status=${status}` : `${API_BASE_URL}/farmer/orders`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...getAuthHeaders(),
      },
      credentials: "include",
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to load farmer orders");
    }

    const data = await res.json();
    return { orders: data };
  } catch (err: unknown) {
    return { orders: [], error: err instanceof Error ? err.message : String(err) };
  }
}

export async function transitionFarmerOrder(orderId: number | string, action: "accept" | "reject" | "ready" | "complete", reason?: string): Promise<{ success: boolean; order?: import("@/types").ApiOrder; error?: string }> {
  try {
    let url = `${API_BASE_URL}/farmer/orders/${orderId}/${action}`;
    if (action === "reject" && reason) {
      url += `?reason=${encodeURIComponent(reason)}`;
    }

    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        ...getAuthHeaders(),
      },
      credentials: "include",
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Failed to ${action} order`);
    }

    const data = await res.json();
    return { success: true, order: data };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// ---------------------------------------------------------------------------
// ADMINISTRATIVE PORTAL API CLIENT
// ---------------------------------------------------------------------------

export async function fetchAdminOverview(): Promise<{
  metrics: AdminDashboardMetrics | null;
  error?: string;
}> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/overview`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...getAuthHeaders(),
      },
      credentials: "include",
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to load admin overview");
    }

    const data: AdminDashboardMetrics = await res.json();
    return { metrics: data };
  } catch (err: unknown) {
    return {
      metrics: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function fetchAdminProducts(params?: {
  status?: string;
  category?: string;
  search?: string;
  farmer_id?: number;
  is_active?: boolean;
  skip?: number;
  limit?: number;
}): Promise<{ products: BackendProduct[]; error?: string }> {
  try {
    const query = new URLSearchParams();
    if (params?.status) query.append("status", params.status);
    if (params?.category) query.append("category", params.category);
    if (params?.search) query.append("search", params.search);
    if (params?.farmer_id !== undefined) query.append("farmer_id", String(params.farmer_id));
    if (params?.is_active !== undefined) query.append("is_active", String(params.is_active));
    if (params?.skip !== undefined) query.append("skip", String(params.skip));
    if (params?.limit !== undefined) query.append("limit", String(params.limit));

    const qs = query.toString() ? `?${query.toString()}` : "";
    const res = await fetch(`${API_BASE_URL}/admin/products${qs}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...getAuthHeaders(),
      },
      credentials: "include",
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to load products for moderation");
    }

    const data: BackendProduct[] = await res.json();
    return { products: data };
  } catch (err: unknown) {
    return { products: [], error: err instanceof Error ? err.message : String(err) };
  }
}

export async function moderateAdminProduct(
  productId: number,
  payload: {
    listing_status: string;
    moderation_reason?: string;
    is_active?: boolean;
  }
): Promise<{ success: boolean; product?: BackendProduct; error?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/products/${productId}/moderate`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...getAuthHeaders(),
      },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to moderate product");
    }

    const data: BackendProduct = await res.json();
    return { success: true, product: data };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function fetchAdminUsers(params?: {
  role?: string;
  search?: string;
  is_active?: boolean;
  skip?: number;
  limit?: number;
}): Promise<{ users: AdminUserItem[]; error?: string }> {
  try {
    const query = new URLSearchParams();
    if (params?.role) query.append("role", params.role);
    if (params?.search) query.append("search", params.search);
    if (params?.is_active !== undefined) query.append("is_active", String(params.is_active));
    if (params?.skip !== undefined) query.append("skip", String(params.skip));
    if (params?.limit !== undefined) query.append("limit", String(params.limit));

    const qs = query.toString() ? `?${query.toString()}` : "";
    const res = await fetch(`${API_BASE_URL}/admin/users${qs}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...getAuthHeaders(),
      },
      credentials: "include",
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to load users");
    }

    const data: AdminUserItem[] = await res.json();
    return { users: data };
  } catch (err: unknown) {
    return { users: [], error: err instanceof Error ? err.message : String(err) };
  }
}

export async function updateAdminUserStatus(
  userId: number,
  payload: { is_active: boolean; notes?: string }
): Promise<{ success: boolean; user?: AdminUserItem; error?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/users/${userId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...getAuthHeaders(),
      },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to update user status");
    }

    const data: AdminUserItem = await res.json();
    return { success: true, user: data };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function fetchAdminOrders(params?: {
  status?: string;
  search?: string;
  buyer_id?: number;
  farmer_id?: number;
  skip?: number;
  limit?: number;
}): Promise<{ orders: ApiOrder[]; error?: string }> {
  try {
    const query = new URLSearchParams();
    if (params?.status) query.append("status", params.status);
    if (params?.search) query.append("search", params.search);
    if (params?.buyer_id !== undefined) query.append("buyer_id", String(params.buyer_id));
    if (params?.farmer_id !== undefined) query.append("farmer_id", String(params.farmer_id));
    if (params?.skip !== undefined) query.append("skip", String(params.skip));
    if (params?.limit !== undefined) query.append("limit", String(params.limit));

    const qs = query.toString() ? `?${query.toString()}` : "";
    const res = await fetch(`${API_BASE_URL}/admin/orders${qs}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...getAuthHeaders(),
      },
      credentials: "include",
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to load admin orders");
    }

    const data: ApiOrder[] = await res.json();
    return { orders: data };
  } catch (err: unknown) {
    return { orders: [], error: err instanceof Error ? err.message : String(err) };
  }
}

export async function updateAdminOrderStatus(
  orderId: number,
  payload: { status: string; notes?: string }
): Promise<{ success: boolean; order?: ApiOrder; error?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/orders/${orderId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...getAuthHeaders(),
      },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to update order status");
    }

    const data: ApiOrder = await res.json();
    return { success: true, order: data };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ---------------------------------------------------------------------------
// NOTIFICATIONS API CLIENT
// ---------------------------------------------------------------------------

export async function fetchNotifications(params?: {
  unread_only?: boolean;
  page?: number;
  page_size?: number;
}): Promise<{ data: NotificationListResponse | null; error?: string }> {
  try {
    const query = new URLSearchParams();
    if (params?.unread_only !== undefined) {
      query.append("unread_only", String(params.unread_only));
    }
    if (params?.page) query.append("page", String(params.page));
    if (params?.page_size) query.append("page_size", String(params.page_size));

    const qs = query.toString() ? `?${query.toString()}` : "";
    const res = await fetch(`${API_BASE_URL}/notifications${qs}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...getAuthHeaders(),
      },
      credentials: "include",
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to load notifications");
    }

    const data: NotificationListResponse = await res.json();
    return { data };
  } catch (err: unknown) {
    return {
      data: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function fetchUnreadCount(): Promise<{
  unread_count: number;
  error?: string;
}> {
  try {
    const res = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...getAuthHeaders(),
      },
      credentials: "include",
    });

    if (!res.ok) {
      return { unread_count: 0 };
    }

    const data = await res.json();
    return { unread_count: data.unread_count || 0 };
  } catch {
    return { unread_count: 0 };
  }
}

export async function markNotificationRead(
  notificationId: number
): Promise<{ success: boolean; notification?: NotificationItem; error?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        ...getAuthHeaders(),
      },
      credentials: "include",
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to mark notification as read");
    }

    const data: NotificationItem = await res.json();
    return { success: true, notification: data };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function markAllNotificationsRead(): Promise<{
  success: boolean;
  marked_count: number;
  error?: string;
}> {
  try {
    const res = await fetch(`${API_BASE_URL}/notifications/read-all`, {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        ...getAuthHeaders(),
      },
      credentials: "include",
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to mark all notifications as read");
    }

    const data = await res.json();
    return { success: true, marked_count: data.marked_count || 0 };
  } catch (err: unknown) {
    return {
      success: false,
      marked_count: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function deleteNotification(
  notificationId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        ...getAuthHeaders(),
      },
      credentials: "include",
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to delete notification");
    }

    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}



