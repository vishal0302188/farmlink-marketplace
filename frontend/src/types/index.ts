export type UserRole = "farmer" | "buyer" | "admin";

export type BuyerCategory =
  | "household"
  | "restaurant"
  | "retailer"
  | "wholesaler"
  | "company"
  | "institution";

export interface BuyerProfile {
  category: BuyerCategory;
  deliveryAddress?: string;
  taxIdOrGst?: string;
  procurementVolume?: "retail" | "wholesale" | "bulk_institutional";
}

export interface FarmerProfile {
  farmName: string;
  location: string;
  acreage?: number;
  certifications: string[];
  farmingMethods: ("organic" | "conventional" | "hydroponic" | "regenerative")[];
}

export interface User {
  id: string | number;
  email: string;
  fullName: string;
  role: UserRole;
  buyerType?: BuyerCategory;
  buyerCategory?: BuyerCategory;
  phoneNumber?: string;
  organizationName?: string;
  location?: string;
  district?: string;
  state?: string;
  pincode?: string;
  bio?: string;
  isVerified: boolean;
  isActive: boolean;
  avatarUrl?: string;
  created_at?: string;
  createdAt?: string;
}

export type ProduceCategory =
  | "vegetables"
  | "fruits"
  | "grains_pulses"
  | "dairy_eggs"
  | "herbs_spices"
  | "specialty";

export type UnitType = "kg" | "quintal" | "ton" | "crate" | "litre" | "piece";

export interface ProduceItem {
  id: string;
  farmerId: string;
  farmerName: string;
  farmLocation: string;
  farmerBio?: string;
  title: string;
  description: string;
  category: ProduceCategory;
  pricePerUnit: number;
  unit: UnitType;
  availableQuantity: number;
  minOrderQuantity: number;
  isOrganic: boolean;
  harvestDate: string;
  listingDate: string;
  imageUrl: string;
  additionalImages?: string[];
  fulfilmentMethods?: string[];
  storageAdvice?: string;
  grade?: string;
}

export interface CartItem {
  product: ProduceItem;
  quantity: number;
}

export type OrderStatusType =
  | "pending"
  | "confirmed"
  | "ready"
  | "dispatched"
  | "delivered"
  | "completed"
  | "cancelled"
  | "rejected";

export interface ApiOrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  unit_price_at_purchase: number;
  subtotal: number;
  created_at: string;
  product?: {
    id: number;
    name: string;
    category: string;
    unit: string;
    image_url?: string;
  };
}

export interface ApiOrder {
  id: number;
  buyer_id: number;
  farmer_id: number;
  status: OrderStatusType;
  total_amount: number;
  fulfillment_method: string;
  payment_method?: string;
  delivery_address?: string;
  delivery_city?: string;
  delivery_state?: string;
  delivery_pincode?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  buyer?: User;
  farmer?: User;
  items: ApiOrderItem[];
}

export interface AdminDashboardMetrics {
  total_farmers: number;
  total_buyers: number;
  active_products: number;
  pending_moderation_products: number;
  total_orders: number;
  completed_orders: number;
  recent_orders: ApiOrder[];
  recent_users: User[];
}

export interface AdminUserItem {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  buyer_type?: BuyerCategory | null;
  organization_name?: string | null;
  location?: string | null;
  district?: string | null;
  state?: string | null;
  pincode?: string | null;
  bio?: string | null;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  product_count: number;
  buyer_order_count: number;
  farmer_order_count: number;
}

export type NotificationType =
  | "order_created"
  | "order_accepted"
  | "order_rejected"
  | "order_ready"
  | "order_completed"
  | "order_cancelled"
  | "order_status_updated"
  | "product_approved"
  | "product_rejected"
  | "system_alert";

export interface NotificationItem {
  id: number;
  recipient_id: number;
  type: NotificationType | string;
  title: string;
  message: string;
  order_id?: number | null;
  is_read: boolean;
  created_at: string;
  read_at?: string | null;
}

export interface NotificationListResponse {
  items: NotificationItem[];
  total: number;
  unread_count: number;
  page: number;
  page_size: number;
  total_pages: number;
}


