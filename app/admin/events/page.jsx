"use client";

import { useEffect, useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminMobileNav from "@/components/admin/AdminMobileNav";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/hooks/useAuth";

export default function AdminEventsPage() {
  const { isAuthenticated, isChecking } = useAdminAuth();
  const [adminName, setAdminName] = useState("Admin");
  const router = useRouter();

  useEffect(() => {
    if (!isChecking && isAuthenticated) {
      setAdminName(localStorage.getItem("admin_name") || "Admin");
    }
  }, [isChecking, isAuthenticated]);

  // Show loading while checking authentication
  if (isChecking) {
    return (
      <div className="min-h-screen bg-soft-background dark:bg-dark-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-dark-text dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  const handleLogout = async () => {
    try {
      const { default: api } = await import("@/lib/api");
      await api.post("/admin/logout");
    } catch(e){}
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_name");
    router.replace("/");
  };

  return (
    <div className="flex min-h-screen bg-soft-background dark:bg-dark-background">
      <AdminSidebar onLogout={handleLogout} />
      <div className="flex-1 flex flex-col">
        <AdminHeader adminName={adminName} onLogout={handleLogout} />
        
        <main className="p-4 sm:p-6 md:ml-64 pt-16 sm:pt-20 pb-20 sm:pb-6">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="text-center max-w-md mx-auto">
              {/* Construction Icon */}
              <div className="mb-8 flex justify-center">
                <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-6xl text-primary">construction</span>
                </div>
              </div>

              {/* Title */}
              <h1 className="text-3xl sm:text-4xl font-bold text-dark-text mb-4">
                Events Management
              </h1>

              {/* Subtitle */}
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                This page is currently under construction
              </p>

              {/* Description */}
              <div className="bg-card-background rounded-xl border border-light-gray-border shadow-soft p-6 mb-6">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  The Events Management section will be available soon. This feature will allow you to:
                </p>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2 text-left list-disc list-inside">
                  <li>Create and manage events</li>
                  <li>Set event schedules and dates</li>
                  <li>Configure event settings</li>
                  <li>Monitor event activities</li>
                  <li>Generate event reports</li>
                </ul>
              </div>

              {/* Coming Soon Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
                <span className="material-symbols-outlined text-primary text-lg">schedule</span>
                <span className="text-sm font-medium text-primary">Coming Soon</span>
              </div>
            </div>
          </div>
        </main>
      </div>
      <AdminMobileNav />
    </div>
  );
}

