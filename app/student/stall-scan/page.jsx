"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useStudentAuth } from "@/hooks/useAuth";
import api from "@/lib/api";

import StudentSidebar from "@/components/student/StudentSidebar";
import StudentHeader from "@/components/student/StudentHeader";
import StudentMobileNav from "@/components/student/StudentMobileNav";

export default function StallScanPage() {
  const { isAuthenticated, isChecking } = useStudentAuth();
  const router = useRouter();
  const [theme, setTheme] = useState("light");
  const [error, setError] = useState("");

  // ------------------ THEME HANDLING ------------------
  useEffect(() => {
    const saved = localStorage.getItem("theme") || "light";
    setTheme(saved);
    document.documentElement.classList.toggle("dark", saved === "dark");
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  const handleLogout = async () => {
    try {
      await api.post("/student/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      window.location.href = "/";
    }
  };

  useEffect(() => {
    let scanner;
    let video;

    async function loadScanner() {
      try {
        // Load qr-scanner ONLY in client
        const QrScanner = (await import("qr-scanner")).default;

        video = document.getElementById("qr-video");

        scanner = new QrScanner(
          video,
          async (result) => {
            try {
              const stall_qr_token = result.data;

              // Call backend to scan stall
              const res = await api.post("/student/scan-stall", {
                stall_qr_token: stall_qr_token
              });

              if (res.data?.success) {
                const stallData = res.data.data;
                scanner.stop();
                
                // Navigate to feedback rate page with stall info
                router.push(`/student/feedback-rate?stallId=${stallData.stall.id}`);
              }
            } catch (err) {
              const errorMsg = err.response?.data?.message || "Invalid QR code or you must be checked in";
              setError(errorMsg);
              setTimeout(() => setError(""), 3000);
            }
          },
          { returnDetailedScanResult: true }
        );

        scanner.start();
      } catch (err) {
        console.error("Scanner error:", err);
        setError("Failed to load camera");
      }
    }

    if (isAuthenticated && !isChecking) {
      loadScanner();
    }

    return () => {
      if (scanner) scanner.stop();
    };
  }, [isAuthenticated, isChecking, router]);

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

  return (
    <div className="bg-soft-background font-sans text-dark-text antialiased min-h-screen flex">
      {/* LEFT SIDEBAR */}
      <StudentSidebar onLogout={handleLogout} />

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col">
        {/* TOP HEADER */}
        <StudentHeader theme={theme} toggleTheme={toggleTheme} title="Scan Stall QR" />

        {/* BODY CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-2xl mx-auto space-y-6">
            
            <div className="bg-card-background border border-light-gray-border rounded-2xl p-8 shadow-soft">
              <div className="flex flex-col items-center gap-6">
                <h2 className="text-2xl font-bold text-dark-text">Scan Stall QR Code</h2>
                
                <div className="w-full max-w-md bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-md border border-light-gray-border">
                  <video id="qr-video" className="w-full rounded-xl" />
                </div>

                {error && (
                  <div className="w-full max-w-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                    <p className="text-red-600 dark:text-red-400 text-center">{error}</p>
                  </div>
                )}

                <p className="text-gray-600 dark:text-gray-300 text-sm text-center">
                  Hold your camera over the stall QR code
                </p>

                <button
                  onClick={() => router.push("/student/feedback")}
                  className="px-6 py-3 bg-gray-500 text-white font-semibold rounded-xl hover:bg-gray-600 transition"
                >
                  Go to Feedback Page
                </button>
              </div>
            </div>

          </div>
        </main>
      </div>

      {/* MOBILE NAV */}
      <StudentMobileNav />
    </div>
  );
}
