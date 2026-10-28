"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ProduceItem, ApiOrder, NotificationItem } from "@/types";
import {
  fetchFarmerDashboard,
  fetchFarmerProducts,
  createFarmerProduct,
  updateFarmerProduct,
  updateFarmerProductStock,
  archiveFarmerProduct,
  fetchFarmerOrders,
  transitionFarmerOrder,
  updateUserProfile,
  fetchNotifications,
  markNotificationRead,
  FarmerDashboardData,
  ProductFormData,
} from "@/lib/api";

function FarmerDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const notice = searchParams.get("notice");
  const { user, isLoading: authLoading, refreshUser } = useAuth();

  const [dashboardData, setDashboardData] = useState<FarmerDashboardData | null>(null);
  const [products, setProducts] = useState<ProduceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal / Form state for creating a new product
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // New product form inputs
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("vegetables");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState("kg");
  const [availableQty, setAvailableQty] = useState("");
  const [minOrderQty, setMinOrderQty] = useState("1");
  const [growingLocation, setGrowingLocation] = useState(user?.location || "");
  const [isOrganic, setIsOrganic] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  // Quick stock edit state
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [editingStockVal, setEditingStockVal] = useState<string>("");

  // Detailed incoming orders state
  const [farmerOrders, setFarmerOrders] = useState<ApiOrder[]>([]);
  const [orderActionLoading, setOrderActionLoading] = useState<Record<number, boolean>>({});
  const [orderMessage, setOrderMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Profile Edit State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  const [farmNameEdit, setFarmNameEdit] = useState("");
  const [fullNameEdit, setFullNameEdit] = useState("");
  const [phoneEdit, setPhoneEdit] = useState("");
  const [locationEdit, setLocationEdit] = useState("");
  const [districtEdit, setDistrictEdit] = useState("");
  const [stateEdit, setStateEdit] = useState("");
  const [pincodeEdit, setPincodeEdit] = useState("");
  const [bioEdit, setBioEdit] = useState("");

  // Edit Product Modal State
  const [editingProduct, setEditingProduct] = useState<ProduceItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("vegetables");
  const [editPrice, setEditPrice] = useState("");
  const [editUnit, setEditUnit] = useState("kg");
  const [editAvailableQty, setEditAvailableQty] = useState("");
  const [editMinOrderQty, setEditMinOrderQty] = useState("1");
  const [editGrowingLocation, setEditGrowingLocation] = useState("");
  const [editIsOrganic, setEditIsOrganic] = useState(false);
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  // Notifications State
  const [farmerNotifications, setFarmerNotifications] = useState<NotificationItem[]>([]);

  const handleOpenEditProduct = (p: ProduceItem) => {
    setEditingProduct(p);
    setEditName(p.title);
    setEditDescription(p.description || "");
    setEditCategory(p.category || "vegetables");
    setEditPrice(String(p.pricePerUnit));
    setEditUnit(p.unit || "kg");
    setEditAvailableQty(String(p.availableQuantity));
    setEditMinOrderQty(String(p.minOrderQuantity || 1));
    setEditGrowingLocation(p.farmLocation || user?.location || "");
    setEditIsOrganic(Boolean(p.isOrganic));
    setEditImageUrl(p.imageUrl || "");
    setEditError(null);
    setEditSuccess(null);
  };

  const handleSaveProductEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setEditError(null);
    setEditSuccess(null);

    const priceNum = parseFloat(editPrice);
    const qtyNum = parseFloat(editAvailableQty);
    const minQtyNum = parseFloat(editMinOrderQty);

    if (isNaN(priceNum) || priceNum <= 0) {
      setEditError("Price must be a valid number greater than 0.");
      return;
    }
    if (isNaN(qtyNum) || qtyNum < 0) {
      setEditError("Available quantity cannot be negative.");
      return;
    }
    if (isNaN(minQtyNum) || minQtyNum <= 0) {
      setEditError("Minimum order quantity must be greater than 0.");
      return;
    }

    setIsEditSubmitting(true);
    const res = await updateFarmerProduct(editingProduct.id, {
      name: editName.trim(),
      description: editDescription.trim(),
      category: editCategory,
      price: priceNum,
      unit: editUnit,
      available_quantity: qtyNum,
      minimum_order_quantity: minQtyNum,
      growing_location: editGrowingLocation.trim() || user?.location || "Farm Direct",
      is_organic: editIsOrganic,
      image_url: editImageUrl.trim() || undefined,
    });
    setIsEditSubmitting(false);

    if (res.error || !res.product) {
      setEditError(res.error || "Failed to update produce listing.");
    } else {
      setEditSuccess(`Produce listing "${res.product.title}" updated successfully.`);
      loadData();
      setTimeout(() => {
        setEditingProduct(null);
        setEditSuccess(null);
      }, 1200);
    }
  };

  const handleDismissNotification = async (notifId: number) => {
    await markNotificationRead(notifId);
    setFarmerNotifications((prev) => prev.filter((n) => n.id !== notifId));
  };

  const handleOpenProfileModal = () => {
    setFarmNameEdit(user?.organizationName || "");
    setFullNameEdit(user?.fullName || "");
    setPhoneEdit(user?.phoneNumber || "");
    setLocationEdit(user?.location || "");
    setDistrictEdit(user?.district || "");
    setStateEdit(user?.state || "");
    setPincodeEdit(user?.pincode || "");
    setBioEdit(user?.bio || "");
    setProfileError(null);
    setProfileSuccess(null);
    setShowProfileModal(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);

    if (!fullNameEdit.trim()) {
      setProfileError("Grower / Contact name is required.");
      return;
    }

    setProfileSaving(true);
    const res = await updateUserProfile({
      full_name: fullNameEdit.trim(),
      organization_name: farmNameEdit.trim() || undefined,
      phone_number: phoneEdit.trim() || undefined,
      location: locationEdit.trim() || undefined,
      district: districtEdit.trim() || undefined,
      state: stateEdit.trim() || undefined,
      pincode: pincodeEdit.trim() || undefined,
      bio: bioEdit.trim() || undefined,
    });
    setProfileSaving(false);

    if (!res.user || res.error) {
      setProfileError(res.error || "Failed to update farm profile.");
      return;
    }

    await refreshUser();
    setProfileSuccess("Farm profile updated successfully.");
    setTimeout(() => {
      setShowProfileModal(false);
      setProfileSuccess(null);
    }, 1200);
  };

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    const [dashRes, prodsRes, ordersRes, notifsRes] = await Promise.all([
      fetchFarmerDashboard(),
      fetchFarmerProducts(),
      fetchFarmerOrders(),
      fetchNotifications({ unread_only: true, page_size: 5 }),
    ]);

    if (dashRes.error) {
      setError(dashRes.error);
    } else {
      setDashboardData(dashRes.data);
    }

    if (prodsRes.products) {
      setProducts(prodsRes.products);
    }

    if (ordersRes.orders) {
      setFarmerOrders(ordersRes.orders);
    }

    if (notifsRes.data?.items) {
      setFarmerNotifications(notifsRes.data.items);
    }
    setIsLoading(false);
  };

  const handleOrderAction = async (orderId: number, action: "accept" | "reject" | "ready" | "complete", reason?: string) => {
    setOrderActionLoading((prev) => ({ ...prev, [orderId]: true }));
    setOrderMessage(null);

    const res = await transitionFarmerOrder(orderId, action, reason);
    setOrderActionLoading((prev) => ({ ...prev, [orderId]: false }));

    if (res.success) {
      const actionLabels = {
        accept: "accepted",
        reject: "rejected (stock restored)",
        ready: "marked as packed & ready",
        complete: "marked as fulfilled & completed",
      };
      setOrderMessage({
        text: `Order #${orderId} successfully ${actionLabels[action]}.`,
        type: "success",
      });
      loadData();
    } else {
      setOrderMessage({
        text: res.error || `Failed to ${action} order #${orderId}.`,
        type: "error",
      });
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login?redirect=/farmer/dashboard");
      } else if (user.role === "buyer") {
        router.push("/buyer/dashboard");
      } else if (user.role === "farmer" || user.role === "admin") {
        loadData();
      }
    }
  }, [user, authLoading, router]);

  // Handle Create Product
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const priceNum = parseFloat(price);
    const qtyNum = parseFloat(availableQty);
    const minQtyNum = parseFloat(minOrderQty);

    if (isNaN(priceNum) || priceNum <= 0) {
      setFormError("Price must be a valid number greater than 0.");
      return;
    }
    if (isNaN(qtyNum) || qtyNum < 0) {
      setFormError("Available quantity cannot be negative.");
      return;
    }
    if (isNaN(minQtyNum) || minQtyNum <= 0) {
      setFormError("Minimum order quantity must be greater than 0.");
      return;
    }

    setIsSubmitting(true);
    const payload: ProductFormData = {
      name: name.trim(),
      description: description.trim(),
      category,
      price: priceNum,
      unit,
      available_quantity: qtyNum,
      minimum_order_quantity: minQtyNum,
      growing_location: growingLocation.trim() || user?.location || "Farm Direct",
      is_organic: isOrganic,
      image_url: imageUrl.trim() || undefined,
    };

    const res = await createFarmerProduct(payload);
    setIsSubmitting(false);

    if (res.error || !res.product) {
      setFormError(res.error || "Failed to publish listing");
    } else {
      setFormSuccess(`Successfully listed "${res.product.title}" in the marketplace!`);
      // Reset form
      setName("");
      setDescription("");
      setPrice("");
      setAvailableQty("");
      setMinOrderQty("1");
      setImageUrl("");
      setIsOrganic(false);
      // Reload dashboard
      loadData();
      setTimeout(() => setShowAddModal(false), 1200);
    }
  };

  // Handle Quick Stock Update
  const handleSaveStock = async (productId: string) => {
    const newQty = parseFloat(editingStockVal);
    if (isNaN(newQty) || newQty < 0) return;

    await updateFarmerProductStock(productId, newQty);
    setEditingStockId(null);
    loadData();
  };

  // Handle Archive Listing
  const handleArchive = async (productId: string) => {
    if (!confirm("Are you sure you want to archive this listing? It will no longer be visible to buyers.")) return;
    await archiveFarmerProduct(productId);
    loadData();
  };

  if (authLoading || (isLoading && !dashboardData)) {
    return (
      <div className="min-h-screen flex flex-col bg-ivory-50 text-forest-950">
        <Navbar />
        <main className="flex-1 py-16">
          <Container>
            <div className="space-y-6 animate-pulse max-w-5xl mx-auto">
              <div className="h-10 bg-ivory-200/80 rounded w-1/3" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-32 bg-ivory-200/80 rounded-xl" />
                ))}
              </div>
              <div className="h-64 bg-ivory-200/80 rounded-xl" />
            </div>
          </Container>
        </main>
        <Footer />
      </div>
    );
  }

  // Access denied for buyers
  if (user && user.role !== "farmer" && user.role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col bg-ivory-50 text-forest-950">
        <Navbar />
        <main className="flex-1 flex items-center justify-center py-20 px-4">
          <Container size="sm">
            <div className="bg-white border border-ivory-200 rounded-2xl p-10 text-center shadow-card">
              <div className="w-16 h-16 rounded-full bg-earth-50 text-earth-700 flex items-center justify-center mx-auto mb-4 border border-earth-200">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h1 className="text-2xl font-serif font-bold text-forest-950 mb-2">
                Farmer Account Required
              </h1>
              <p className="text-sm text-forest-700/80 max-w-md mx-auto mb-6 leading-relaxed">
                You are currently signed in as a <strong className="text-forest-900 capitalize">{user.role}</strong> ({user.buyerType || "Consumer"}). The producer dashboard is reserved for verified farmers and agricultural cooperatives.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link href="/marketplace">
                  <Button variant="primary">Browse Fresh Produce Marketplace</Button>
                </Link>
                <Link href="/">
                  <Button variant="secondary">Return Home</Button>
                </Link>
              </div>
            </div>
          </Container>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-ivory-50 text-forest-950">
      <Navbar />

      <main className="flex-1 py-10 px-4 sm:px-6">
        <Container>
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Notice Banner (e.g. redirected from /cart or /checkout) */}
            {notice === "purchasing_requires_buyer" && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-subtle">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center font-bold text-sm flex-shrink-0">
                    ℹ
                  </div>
                  <div>
                    <span className="font-bold text-sm block">Purchasing Requires a Buyer Account</span>
                    <span className="text-xs text-amber-900/90 leading-relaxed block">
                      You navigated to a buyer cart or checkout page. As an authenticated Farmer, you can manage your harvests, inventory, and incoming orders below. Purchasing produce requires an active Buyer account.
                    </span>
                  </div>
                </div>
                <Link href="/login" className="flex-shrink-0">
                  <Button variant="outline" size="sm" className="border-amber-400 bg-white hover:bg-amber-100 text-xs text-amber-900">
                    Switch to Buyer Account
                  </Button>
                </Link>
              </div>
            )}

            {/* Header / Farm Profile Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-ivory-200">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-forest-100 text-forest-800 text-xs font-mono font-semibold uppercase tracking-wider border border-forest-200">
                    Producer Portal
                  </span>
                  <span className="text-xs text-forest-600 font-sans">
                    {user?.district && user?.state ? `${user.district}, ${user.state}` : user?.location || "Verified Indian Producer"}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-serif font-bold text-forest-950 mt-1.5">
                  {user?.organizationName || user?.fullName}
                </h1>
                <p className="text-xs sm:text-sm text-forest-700/80 mt-0.5">
                  Manage active crop inventory, update stock volumes, and monitor incoming buyer orders.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={handleOpenProfileModal}
                  className="flex items-center gap-1.5 text-xs font-semibold"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Farm Profile
                </Button>
                <Button
                  variant="primary"
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 shadow-sm text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  List New Harvest
                </Button>
              </div>
            </div>

            {/* Dedicated Farm Profile & Operational Details Section */}
            <div className="bg-white rounded-2xl border border-ivory-200 p-6 shadow-card space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-ivory-200 gap-3">
                <div>
                  <div className="text-xs font-mono uppercase tracking-wider text-forest-600 font-semibold">
                    Saved Farm Profile & Agronomic Identity
                  </div>
                  <h2 className="text-xl font-serif font-bold text-forest-950 mt-0.5">
                    {user?.organizationName || user?.fullName || "Your Farm / Agricultural Enterprise"}
                  </h2>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-1 rounded-full bg-forest-100 text-forest-800 text-xs font-semibold border border-forest-200">
                    {user?.isVerified ? "✓ Verified Producer" : "Producer Profile Active"}
                  </span>
                  <Button variant="outline" size="sm" onClick={handleOpenProfileModal} className="text-xs font-semibold">
                    Edit Details
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                <div className="space-y-1.5 p-4 rounded-xl bg-ivory-50 border border-ivory-200">
                  <span className="text-forest-500 font-mono uppercase text-[10px] tracking-wider block">
                    Producer & Contact
                  </span>
                  <span className="font-semibold text-forest-950 text-sm block">
                    {user?.fullName}
                  </span>
                  <span className="text-forest-700 block">{user?.email}</span>
                  <span className="text-forest-600 block">
                    {user?.phoneNumber ? `Phone: ${user.phoneNumber}` : "Phone: Not provided"}
                  </span>
                </div>

                <div className="space-y-1.5 p-4 rounded-xl bg-ivory-50 border border-ivory-200">
                  <span className="text-forest-500 font-mono uppercase text-[10px] tracking-wider block">
                    Location & Geographic Origin
                  </span>
                  <span className="font-semibold text-forest-950 text-sm block">
                    {user?.location || "Address not provided"}
                  </span>
                  <span className="text-forest-700 block">
                    {user?.district && user?.state
                      ? `${user.district}, ${user.state}`
                      : user?.district || user?.state || "District / State not set"}
                  </span>
                  <span className="text-forest-600 block">
                    {user?.pincode ? `Postal Code: ${user.pincode}` : "PIN: Not set"}
                  </span>
                </div>

                <div className="space-y-1.5 p-4 rounded-xl bg-ivory-50 border border-ivory-200">
                  <span className="text-forest-500 font-mono uppercase text-[10px] tracking-wider block">
                    Agronomic Practices & Stewardship
                  </span>
                  <p className="text-forest-700 leading-relaxed italic line-clamp-3">
                    {user?.bio || "No agronomic bio recorded yet. Click 'Edit Farm Profile' to describe your soil stewardship, organic methods, or harvest practices."}
                  </p>
                </div>
              </div>
            </div>

            {/* Error Notification */}
            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Real Database Sales & Revenue Analytics KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 shadow-card">
                <div className="text-xs font-mono uppercase tracking-wider text-emerald-800 font-semibold mb-1">
                  Realized Revenue
                </div>
                <div className="text-2xl sm:text-3xl font-serif font-bold text-forest-950">
                  ₹{(dashboardData?.total_revenue ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-[11px] text-emerald-800/80 mt-1">From fulfilled & completed orders</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-blue-200/80 shadow-card">
                <div className="text-xs font-mono uppercase tracking-wider text-blue-800 font-semibold mb-1">
                  Pipeline Value
                </div>
                <div className="text-2xl sm:text-3xl font-serif font-bold text-forest-950">
                  ₹{(dashboardData?.pending_revenue ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-[11px] text-blue-800/80 mt-1">In pending & active orders</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-ivory-200 shadow-card">
                <div className="text-xs font-mono uppercase tracking-wider text-forest-600 font-semibold mb-1">
                  Orders Completed
                </div>
                <div className="text-2xl sm:text-3xl font-serif font-bold text-forest-950">
                  {dashboardData?.total_completed_orders ?? 0}
                </div>
                <p className="text-[11px] text-forest-600 mt-1">Delivered to verified buyers</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-ivory-200 shadow-card">
                <div className="text-xs font-mono uppercase tracking-wider text-forest-600 font-semibold mb-1">
                  Active Produce Lots
                </div>
                <div className="text-2xl sm:text-3xl font-serif font-bold text-forest-950">
                  {dashboardData?.total_active_listings ?? 0}
                </div>
                <p className="text-[11px] text-forest-600 mt-1">Live in marketplace search</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-ivory-200 shadow-card">
                <div className="text-xs font-mono uppercase tracking-wider text-forest-600 font-semibold mb-1">
                  Total Inventory
                </div>
                <div className="text-2xl sm:text-3xl font-serif font-bold text-forest-950">
                  {(dashboardData?.total_available_inventory ?? 0).toLocaleString("en-IN")}{" "}
                  <span className="text-xs font-sans font-normal text-forest-600">units</span>
                </div>
                <p className="text-[11px] text-forest-600 mt-1">Available for direct procurement</p>
              </div>
            </div>

            {/* In-Dashboard Unread Notifications & Order Alerts Feed */}
            {farmerNotifications.length > 0 && (
              <div className="bg-white rounded-2xl border border-amber-200 shadow-card p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-ivory-200 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                    <h2 className="text-sm font-serif font-bold text-forest-950">
                      Recent Farm Order Alerts ({farmerNotifications.length} Unread)
                    </h2>
                  </div>
                  <Link
                    href="/notifications"
                    className="text-xs text-forest-700 hover:text-forest-950 font-semibold underline"
                  >
                    View All Notifications &rarr;
                  </Link>
                </div>

                <div className="space-y-2">
                  {farmerNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-ivory-50 border border-ivory-200 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-semibold text-forest-950 flex items-center gap-2">
                          <span>{notif.title}</span>
                          <span className="text-[10px] font-mono text-forest-500">
                            {new Date(notif.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className="text-forest-700">{notif.message}</p>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {notif.order_id && (
                          <a
                            href={`#order-${notif.order_id}`}
                            className="px-2.5 py-1 rounded bg-forest-100 text-forest-900 font-semibold hover:bg-forest-200 text-[11px]"
                          >
                            Jump to Order #{notif.order_id}
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDismissNotification(notif.id)}
                          className="px-2 py-1 text-forest-500 hover:text-forest-900 text-[11px]"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Produce Listings Table */}
            <div className="bg-white rounded-2xl border border-ivory-200 shadow-card overflow-hidden">
              <div className="p-6 border-b border-ivory-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-serif font-bold text-forest-950">
                    Your Produce Lots ({products.length})
                  </h2>
                  <p className="text-xs text-forest-700/80 mt-0.5">
                    Real-time catalog synchronized directly with PostgreSQL.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={loadData} className="text-xs">
                  ↻ Refresh Inventory
                </Button>
              </div>

              {products.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-sm text-forest-700/80 mb-4">
                    You have not listed any produce lots yet.
                  </p>
                  <Button variant="primary" onClick={() => setShowAddModal(true)}>
                    Publish Your First Produce Lot
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-ivory-100/60 border-b border-ivory-200 text-xs font-mono uppercase tracking-wider text-forest-700">
                        <th className="py-3.5 px-6">Produce Lot</th>
                        <th className="py-3.5 px-4">Category</th>
                        <th className="py-3.5 px-4">Price (INR)</th>
                        <th className="py-3.5 px-4">Available Stock</th>
                        <th className="py-3.5 px-4">Min. Lot</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ivory-200">
                      {products.map((p) => (
                        <tr key={p.id} className="hover:bg-ivory-50/50 transition-colors">
                          <td className="py-4 px-6">
                            <div className="font-semibold text-forest-950">{p.title}</div>
                            <div className="text-xs text-forest-700/70">{p.farmLocation}</div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="capitalize text-xs font-medium px-2 py-0.5 bg-ivory-100 rounded text-forest-800 border border-ivory-200">
                              {p.category}
                            </span>
                          </td>
                          <td className="py-4 px-4 font-mono font-semibold text-forest-900">
                            ₹{p.pricePerUnit} / {p.unit}
                          </td>
                          <td className="py-4 px-4">
                            {editingStockId === p.id ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  className="w-24 px-2 py-1 text-xs border rounded border-forest-600 focus:outline-none"
                                  value={editingStockVal}
                                  onChange={(e) => setEditingStockVal(e.target.value)}
                                  min={0}
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveStock(p.id)}
                                  className="text-xs bg-forest-800 text-white px-2 py-1 rounded hover:bg-forest-900"
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingStockId(null)}
                                  className="text-xs text-forest-600 hover:text-forest-900"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-forest-950">
                                  {p.availableQuantity} {p.unit}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingStockId(p.id);
                                    setEditingStockVal(String(p.availableQuantity));
                                  }}
                                  className="text-xs text-earth-600 hover:text-earth-700 underline font-sans"
                                >
                                  Edit
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-4 text-forest-700 text-xs">
                            {p.minOrderQuantity} {p.unit}
                          </td>
                          <td className="py-4 px-4">
                            {p.availableQuantity > 0 ? (
                              <span className="inline-block px-2 py-0.5 rounded-full bg-forest-100 text-forest-800 text-xs font-medium">
                                Active
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-0.5 rounded-full bg-ivory-200 text-forest-600 text-xs font-medium">
                                Out of Stock
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-right space-x-2">
                            <button
                              type="button"
                              onClick={() => handleOpenEditProduct(p)}
                              className="text-xs text-forest-800 hover:text-forest-950 font-semibold underline"
                            >
                              Edit
                            </button>
                            <Link
                              href={`/marketplace/${p.id}`}
                              className="text-xs text-forest-700 hover:text-forest-950 font-medium underline"
                              target="_blank"
                            >
                              View
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleArchive(p.id)}
                              className="text-xs text-red-600 hover:text-red-800 font-medium"
                            >
                              Archive
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Incoming Orders Section */}
            <div className="bg-white rounded-2xl border border-ivory-200 shadow-card p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-ivory-200 pb-4">
                <div>
                  <h2 className="text-lg font-serif font-bold text-forest-950">
                    Incoming Orders ({farmerOrders.length})
                  </h2>
                  <p className="text-xs text-forest-700/80 mt-0.5">
                    Direct commercial purchasing orders received from verified buyers.
                  </p>
                </div>
              </div>

              {orderMessage && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center justify-between ${
                    orderMessage.type === "success"
                      ? "bg-emerald-50 border border-emerald-200 text-emerald-900"
                      : "bg-red-50 border border-red-200 text-red-900"
                  }`}
                >
                  <span>{orderMessage.text}</span>
                  <button type="button" onClick={() => setOrderMessage(null)} className="font-bold ml-2">
                    &times;
                  </button>
                </div>
              )}

              {farmerOrders.length === 0 ? (
                <div className="p-8 text-center bg-ivory-50 rounded-xl border border-ivory-200 text-xs text-forest-700/70">
                  No incoming buyer orders staged currently. As buyers place orders against your inventory, they will appear here for fulfillment.
                </div>
              ) : (
                <div className="space-y-3">
                  {farmerOrders.map((o) => {
                    const isBusy = orderActionLoading[o.id];

                    return (
                      <div
                        key={o.id}
                        id={`order-${o.id}`}
                        className="p-5 border border-ivory-200 rounded-xl bg-ivory-50/30 hover:bg-white hover:border-forest-300 transition-all space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-ivory-100 pb-2.5">
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-forest-950 text-sm">
                              Order #{o.id}
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-full uppercase font-mono text-[10px] font-bold ${
                              o.status === "pending"
                                ? "bg-amber-100 text-amber-900 border border-amber-200"
                                : o.status === "confirmed"
                                ? "bg-blue-100 text-blue-900 border border-blue-200"
                                : o.status === "ready"
                                ? "bg-purple-100 text-purple-900 border border-purple-200"
                                : o.status === "completed" || o.status === "delivered"
                                ? "bg-emerald-100 text-emerald-900 border border-emerald-200"
                                : "bg-gray-100 text-gray-800 border border-gray-200"
                            }`}>
                              {o.status}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 text-xs">
                            <span className="text-forest-600 font-mono">
                              {new Date(o.created_at).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            <span className="font-mono font-bold text-forest-950 text-base">
                              ₹{Number(o.total_amount).toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Order Items & Destination Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          <div className="space-y-1">
                            <span className="text-forest-500 font-mono text-[11px] uppercase block">Ordered Produce:</span>
                            {o.items?.map((item) => (
                              <div key={item.id} className="font-medium text-forest-900">
                                • {item.product?.name || `Product #${item.product_id}`} — {item.quantity} {item.product?.unit || "units"} @ ₹{Number(item.unit_price_at_purchase).toFixed(2)}
                              </div>
                            ))}
                          </div>

                          <div className="space-y-1 md:text-right">
                            <span className="text-forest-500 font-mono text-[11px] uppercase block">Fulfillment Details:</span>
                            <div className="text-forest-800 capitalize">
                              {o.fulfillment_method.replace(/_/g, " ")} {o.delivery_city ? `• ${o.delivery_city}` : ""}
                            </div>
                            {o.delivery_address && (
                              <div className="text-forest-600 truncate max-w-sm ml-auto">
                                {o.delivery_address}
                              </div>
                            )}
                            {o.notes && (
                              <div className="text-[11px] text-forest-500 italic">
                                Notes: {o.notes}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Order Actions - Allowed based on state */}
                        <div className="pt-2 border-t border-ivory-100 flex flex-wrap items-center justify-end gap-2">
                          {o.status === "pending" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={isBusy}
                                onClick={() => {
                                  const reason = prompt("Enter reason for rejecting this order (optional):");
                                  handleOrderAction(o.id, "reject", reason || undefined);
                                }}
                                className="text-red-700 border-red-300 hover:bg-red-50 text-xs"
                              >
                                Reject Order
                              </Button>
                              <Button
                                variant="primary"
                                size="sm"
                                disabled={isBusy}
                                onClick={() => handleOrderAction(o.id, "accept")}
                                className="text-xs"
                              >
                                Accept Order &rarr;
                              </Button>
                            </>
                          )}

                          {o.status === "confirmed" && (
                            <Button
                              variant="primary"
                              size="sm"
                              disabled={isBusy}
                              onClick={() => handleOrderAction(o.id, "ready")}
                              className="text-xs bg-purple-800 hover:bg-purple-900"
                            >
                              Mark Packed & Ready &rarr;
                            </Button>
                          )}

                          {(o.status === "ready" || o.status === "dispatched") && (
                            <Button
                              variant="primary"
                              size="sm"
                              disabled={isBusy}
                              onClick={() => handleOrderAction(o.id, "complete")}
                              className="text-xs bg-emerald-800 hover:bg-emerald-900"
                            >
                              Confirm Fulfillment & Complete &rarr;
                            </Button>
                          )}

                          {(o.status === "completed" || o.status === "delivered") && (
                            <span className="text-xs text-emerald-800 font-semibold font-mono flex items-center gap-1">
                              ✓ Order Fulfilled
                            </span>
                          )}

                          {o.status === "cancelled" && (
                            <span className="text-xs text-gray-500 font-mono">
                              Cancelled (Stock Restored)
                            </span>
                          )}

                          {o.status === "rejected" && (
                            <span className="text-xs text-red-600 font-mono">
                              Rejected (Stock Restored)
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </Container>
      </main>

      {/* Modal: Add New Harvest Listing */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-forest-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-ivory-200 shadow-xl max-w-xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-ivory-200 mb-6">
              <h2 className="text-xl font-serif font-bold text-forest-950">
                List New Harvest Lot
              </h2>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-forest-400 hover:text-forest-800 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                {formError}
              </div>
            )}
            {formSuccess && (
              <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-xs">
                {formSuccess}
              </div>
            )}

            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-semibold text-forest-900 uppercase tracking-wider mb-1">
                  Produce Name *
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Nashik Red Sweet Onions"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-semibold text-forest-900 uppercase tracking-wider mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-white border border-ivory-300 rounded-lg px-3 py-2 text-sm text-forest-900 focus:outline-none focus:ring-2 focus:ring-forest-600"
                  >
                    <option value="vegetables">Vegetables</option>
                    <option value="fruits">Fruits & Orchards</option>
                    <option value="grains">Grains</option>
                    <option value="pulses">Pulses & Legumes</option>
                    <option value="spices">Spices & Botanicals</option>
                    <option value="dairy">Dairy & Farmstead</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-forest-900 uppercase tracking-wider mb-1">
                    Measurement Unit *
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full bg-white border border-ivory-300 rounded-lg px-3 py-2 text-sm text-forest-900 focus:outline-none focus:ring-2 focus:ring-forest-600"
                  >
                    <option value="kg">Kilogram (kg)</option>
                    <option value="quintal">Quintal (100 kg)</option>
                    <option value="ton">Metric Ton</option>
                    <option value="crate">Crate</option>
                    <option value="litre">Litre</option>
                    <option value="piece">Piece</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-mono font-semibold text-forest-900 uppercase tracking-wider mb-1">
                    Price (₹) *
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="35.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-forest-900 uppercase tracking-wider mb-1">
                    Available Stock *
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="500"
                    value={availableQty}
                    onChange={(e) => setAvailableQty(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-forest-900 uppercase tracking-wider mb-1">
                    Min Order *
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="10"
                    value={minOrderQty}
                    onChange={(e) => setMinOrderQty(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-forest-900 uppercase tracking-wider mb-1">
                  Growing Location / Farm Region *
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Dindori Valley, Nashik, Maharashtra"
                  value={growingLocation}
                  onChange={(e) => setGrowingLocation(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-forest-900 uppercase tracking-wider mb-1">
                  Image URL (High-Resolution Agricultural Photography)
                </label>
                <Input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-forest-900 uppercase tracking-wider mb-1">
                  Produce Specifications & Harvest Notes *
                </label>
                <textarea
                  rows={3}
                  placeholder="Grade, moisture content, variety details, post-harvest packing standards..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  className="w-full bg-white border border-ivory-300 rounded-lg px-3 py-2 text-sm text-forest-900 focus:outline-none focus:ring-2 focus:ring-forest-600 resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="organic-check"
                  checked={isOrganic}
                  onChange={(e) => setIsOrganic(e.target.checked)}
                  className="rounded border-ivory-300 text-forest-600 focus:ring-forest-600"
                />
                <label htmlFor="organic-check" className="text-xs font-medium text-forest-900">
                  Cultivated using organic / zero-chemical practices
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-ivory-200">
                <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={isSubmitting}>
                  {isSubmitting ? "Publishing Listing..." : "Publish to Marketplace"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Farm Profile */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 bg-forest-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-ivory-200 shadow-xl max-w-xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-ivory-200 mb-6">
              <div>
                <h2 className="text-xl font-serif font-bold text-forest-950">
                  Edit Farm & Producer Profile
                </h2>
                <p className="text-xs text-forest-600 mt-1">
                  Update your farm branding, operational location, and direct buyer contact information.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="text-forest-400 hover:text-forest-800 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            {profileError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                {profileError}
              </div>
            )}
            {profileSuccess && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                {profileSuccess}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-semibold text-forest-900 uppercase tracking-wider mb-1">
                    Farm / Organization Name
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. Sahyadri Organic Orchards"
                    value={farmNameEdit}
                    onChange={(e) => setFarmNameEdit(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-forest-900 uppercase tracking-wider mb-1">
                    Grower / Contact Name *
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. Ramesh Patel"
                    value={fullNameEdit}
                    onChange={(e) => setFullNameEdit(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-semibold text-forest-900 uppercase tracking-wider mb-1">
                    Phone / WhatsApp
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. +91 98765 43210"
                    value={phoneEdit}
                    onChange={(e) => setPhoneEdit(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-forest-900 uppercase tracking-wider mb-1">
                    Postal PIN Code
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. 422003"
                    value={pincodeEdit}
                    onChange={(e) => setPincodeEdit(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-forest-900 uppercase tracking-wider mb-1">
                  Farm Location / Village
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Village Pimpalgaon, Taluka Niphad"
                  value={locationEdit}
                  onChange={(e) => setLocationEdit(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-semibold text-forest-900 uppercase tracking-wider mb-1">
                    District
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. Nashik"
                    value={districtEdit}
                    onChange={(e) => setDistrictEdit(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-forest-900 uppercase tracking-wider mb-1">
                    State
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. Maharashtra"
                    value={stateEdit}
                    onChange={(e) => setStateEdit(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-forest-900 uppercase tracking-wider mb-1">
                  Agronomic Bio & Farm Overview
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe your soil, certified farming methods, acreage, and perennial crops..."
                  value={bioEdit}
                  onChange={(e) => setBioEdit(e.target.value)}
                  className="w-full bg-white border border-ivory-300 rounded-lg px-3 py-2 text-sm text-forest-900 focus:outline-none focus:ring-2 focus:ring-forest-600 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-ivory-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowProfileModal(false)}
                  disabled={profileSaving}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={profileSaving}>
                  {profileSaving ? "Saving Changes..." : "Save Farm Profile"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Existing Produce Listing */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-forest-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-ivory-200 shadow-xl max-w-xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-ivory-200 mb-6">
              <div>
                <h2 className="text-xl font-serif font-bold text-forest-950">
                  Edit Produce Lot #{editingProduct.id}
                </h2>
                <p className="text-xs text-forest-600 mt-1">
                  Update price, stock, grade specifications, or delivery attributes.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="text-forest-400 hover:text-forest-800 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            {editError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                {editError}
              </div>
            )}
            {editSuccess && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                {editSuccess}
              </div>
            )}

            <form onSubmit={handleSaveProductEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-semibold text-forest-900 uppercase tracking-wider mb-1">
                  Produce Name *
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Nashik Red Sweet Onions"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-semibold text-forest-900 uppercase tracking-wider mb-1">
                    Category *
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full bg-white border border-ivory-300 rounded-lg px-3 py-2 text-sm text-forest-900 focus:outline-none focus:ring-2 focus:ring-forest-600"
                  >
                    <option value="vegetables">Vegetables</option>
                    <option value="fruits">Fruits & Orchards</option>
                    <option value="grains">Grains</option>
                    <option value="pulses">Pulses & Legumes</option>
                    <option value="spices">Spices & Botanicals</option>
                    <option value="dairy">Dairy & Farmstead</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-forest-900 uppercase tracking-wider mb-1">
                    Measurement Unit *
                  </label>
                  <select
                    value={editUnit}
                    onChange={(e) => setEditUnit(e.target.value)}
                    className="w-full bg-white border border-ivory-300 rounded-lg px-3 py-2 text-sm text-forest-900 focus:outline-none focus:ring-2 focus:ring-forest-600"
                  >
                    <option value="kg">Kilogram (kg)</option>
                    <option value="quintal">Quintal (100 kg)</option>
                    <option value="ton">Metric Ton</option>
                    <option value="crate">Crate</option>
                    <option value="litre">Litre</option>
                    <option value="piece">Piece</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-mono font-semibold text-forest-900 uppercase tracking-wider mb-1">
                    Price (₹) *
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="35.00"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-forest-900 uppercase tracking-wider mb-1">
                    Available Stock *
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="500"
                    value={editAvailableQty}
                    onChange={(e) => setEditAvailableQty(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-forest-900 uppercase tracking-wider mb-1">
                    Min Order *
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="10"
                    value={editMinOrderQty}
                    onChange={(e) => setEditMinOrderQty(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-forest-900 uppercase tracking-wider mb-1">
                  Growing Location / Farm Region *
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Dindori Valley, Nashik, Maharashtra"
                  value={editGrowingLocation}
                  onChange={(e) => setEditGrowingLocation(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-forest-900 uppercase tracking-wider mb-1">
                  Image URL
                </label>
                <Input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={editImageUrl}
                  onChange={(e) => setEditImageUrl(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-forest-900 uppercase tracking-wider mb-1">
                  Produce Specifications & Harvest Notes *
                </label>
                <textarea
                  rows={3}
                  placeholder="Grade, variety details, packaging..."
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  required
                  className="w-full bg-white border border-ivory-300 rounded-lg px-3 py-2 text-sm text-forest-900 focus:outline-none focus:ring-2 focus:ring-forest-600 resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="edit-organic-check"
                  checked={editIsOrganic}
                  onChange={(e) => setEditIsOrganic(e.target.checked)}
                  className="rounded border-ivory-300 text-forest-600 focus:ring-forest-600"
                />
                <label htmlFor="edit-organic-check" className="text-xs font-medium text-forest-900">
                  Cultivated using organic / zero-chemical practices
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-ivory-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingProduct(null)}
                  disabled={isEditSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={isEditSubmitting}>
                  {isEditSubmitting ? "Saving Produce Changes..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default function FarmerDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-ivory-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-forest-800" />
        </div>
      }
    >
      <FarmerDashboardContent />
    </Suspense>
  );
}
