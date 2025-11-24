"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useStudentAuth } from "@/hooks/useAuth";

import StudentSidebar from "@/components/student/StudentSidebar";
import StudentHeader from "@/components/student/StudentHeader";
import StudentMobileNav from "@/components/student/StudentMobileNav";

export default function FeedbackPage() {
  const { isAuthenticated, isChecking } = useStudentAuth();
  const router = useRouter();
  const [theme, setTheme] = useState("light");
  const [scanning, setScanning] = useState(false);
  const [scannedStall, setScannedStall] = useState(null);
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

  // ------------------ QR SCANNER ------------------
  useEffect(() => {
    if (!scanning) return;

    let scanner;
    let video;

    async function loadScanner() {
      try {
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
                setScannedStall(stallData);
                setScanning(false);
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
        setScanning(false);
      }
    }

    loadScanner();

    return () => {
      if (scanner) scanner.stop();
    };
  }, [scanning, router]);

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
        <StudentHeader
          theme={theme}
          toggleTheme={toggleTheme}
          title="Stall Feedback"
          onLogout={handleLogout}
        />

        {/* BODY CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 pb-32 sm:p-6 lg:p-8 lg:pb-10">
          <div className="max-w-4xl mx-auto space-y-8">
            
            {/* HERO SECTION */}
            <section className="relative flex flex-col items-stretch justify-start rounded-3xl overflow-hidden shadow-soft text-white">
              <div className="absolute inset-0 bg-gradient-to-br from-[#2B6CB0] to-[#1E3A8A]"></div>
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at top right, rgba(255,255,255,0.2), transparent 50%), radial-gradient(circle at bottom left, rgba(236,201,75,0.15), transparent 60%)",
                }}
              />
              <div className="relative p-8 flex flex-col items-center gap-5">
                <div className="flex w-16 h-16 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20 backdrop-blur-sm">
                  <span
                    className="material-symbols-outlined text-[#ECC94B]"
                    style={{ fontSize: "48px", fontVariationSettings: "'FILL' 1, 'wght' 500" }}
                  >
                    rate_review
                  </span>
                </div>
                <h2 className="font-display text-3xl font-bold tracking-[-0.02em] text-center">
                  Scan Stall QR Code
                </h2>
                <p className="text-blue-200 opacity-90 text-center">
                  Scan a stall's QR code to provide feedback
                </p>
              </div>
            </section>

            {/* SCAN SECTION */}
            <div className="bg-card-background border border-light-gray-border rounded-2xl p-8 shadow-soft">
              {!scanning ? (
                <div className="flex flex-col items-center gap-6">
                  <div className="w-32 h-32 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-6xl">qr_code_scanner</span>
                  </div>
                  <h3 className="text-2xl font-bold">Ready to Scan</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-center">
                    Click the button below to start scanning a stall's QR code
                  </p>
                  <button
                    onClick={() => {
                      setScanning(true);
                      setError("");
                    }}
                    className="px-8 py-4 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition shadow-md"
                  >
                    Start Scanning
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-6">
                  <div className="w-full max-w-md bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-md border border-light-gray-border">
                    <video id="qr-video" className="w-full rounded-xl" />
                  </div>
                  {error && (
                    <div className="w-full max-w-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                      <p className="text-red-600 dark:text-red-400 text-center">{error}</p>
                    </div>
                  )}
                  <button
                    onClick={() => {
                      setScanning(false);
                      setError("");
                    }}
                    className="px-6 py-3 bg-gray-500 text-white font-semibold rounded-xl hover:bg-gray-600 transition"
                  >
                    Cancel Scanning
                  </button>
                  <p className="text-sm text-gray-500 text-center">
                    Point your camera at the stall's QR code
                  </p>
                </div>
              )}
            </div>

            {/* INFO SECTION */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <span className="material-symbols-outlined text-yellow-600 dark:text-yellow-400 text-3xl">info</span>
                <div>
                  <h4 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">Important Notes</h4>
                  <ul className="text-sm text-yellow-700 dark:text-yellow-400 space-y-1">
                    <li>• You must be checked in at the event to scan stalls</li>
                    <li>• Each stall can only receive one feedback from you</li>
                    <li>• Rating should be between 1 and 5 stars</li>
                    <li>• You can submit feedback for up to 200 stalls</li>
                  </ul>
                </div>
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

