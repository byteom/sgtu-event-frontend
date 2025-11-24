"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import api from "@/lib/api";
import { useStudentAuth } from "@/hooks/useAuth";

import StudentSidebar from "@/components/student/StudentSidebar";
import StudentHeader from "@/components/student/StudentHeader";
import StudentMobileNav from "@/components/student/StudentMobileNav";

function FeedbackRateContent() {
  const params = useSearchParams();
  const router = useRouter();

  const stallId = params.get("stallId");

  const [theme, setTheme] = useState("light");
  const [loading, setLoading] = useState(true);
  const [stallInfo, setStallInfo] = useState(null);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [rating, setRating] = useState(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
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

  // ------------------ LOAD STALL INFO ------------------
  useEffect(() => {
    if (!stallId) {
      router.push("/student/feedback");
      return;
    }

    // If we have stallId from URL, we need to get stall info
    // The backend scan-stall endpoint should have been called already
    // For now, we'll just proceed with the stallId
    setLoading(false);
  }, [stallId, router]);

  // ------------------ SUBMIT FEEDBACK ------------------
  async function submitFeedback() {
    if (!rating) {
      setError("Please select a rating (1-5 stars)");
      setTimeout(() => setError(""), 3000);
      return;
    }

    if (!stallId) {
      setError("Stall ID is missing");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await api.post("/student/submit-feedback", {
        stall_id: stallId,
        rating: parseInt(rating),
        comment: comment || null,
      });

      if (res.data?.success) {
        router.push("/student/feedback-success");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to submit feedback";
      setError(errorMsg);
      setTimeout(() => setError(""), 5000);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-soft-background dark:bg-dark-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <p className="text-dark-text dark:text-gray-300 mt-4">Loading stall information...</p>
        </div>
      </div>
    );
  }

  const ratingOptions = [1, 2, 3, 4, 5];

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
          title="Rate This Stall"
          onLogout={handleLogout}
        />

        {/* BODY CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 pb-32 sm:p-6 lg:p-8 lg:pb-10">
          <div className="max-w-2xl mx-auto space-y-6">
            
            {/* ERROR MESSAGE */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                <p className="text-red-600 dark:text-red-400 text-center">{error}</p>
              </div>
            )}

            {/* MAIN CARD */}
            <div className="bg-card-background border border-light-gray-border rounded-2xl p-8 shadow-soft">
              <div className="flex flex-col items-center gap-6">
                
                <h1 className="text-3xl font-bold text-dark-text text-center">
                  Rate This Stall
                </h1>

                {/* STAR RATING */}
                <div className="flex gap-2">
                  {ratingOptions.map((num) => (
                    <button
                      key={num}
                      onClick={() => setRating(num)}
                      className={`w-16 h-16 rounded-xl font-bold text-2xl transition-all ${
                        rating === num
                          ? "bg-primary text-white shadow-lg scale-110"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>

                {rating && (
                  <div className="text-center">
                    <p className="text-lg font-semibold text-primary">
                      You selected {rating} {rating === 1 ? "star" : "stars"}
                    </p>
                  </div>
                )}

                {/* COMMENT BOX */}
                {rating && (
                  <div className="w-full">
                    <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                      Comment (Optional)
                    </label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Share your experience about this stall..."
                      className="w-full p-4 border border-light-gray-border rounded-xl bg-white dark:bg-gray-800 text-dark-text resize-none"
                      rows={4}
                    />
                  </div>
                )}

                {/* SUBMIT BUTTON */}
                <button
                  onClick={submitFeedback}
                  disabled={!rating || submitting}
                  className={`w-full px-8 py-4 rounded-xl font-semibold text-white transition shadow-md ${
                    rating && !submitting
                      ? "bg-primary hover:bg-primary-dark"
                      : "bg-gray-400 cursor-not-allowed"
                  }`}
                >
                  {submitting ? "Submitting..." : "Submit Feedback"}
                </button>

                {/* BACK BUTTON */}
                <button
                  onClick={() => router.push("/student/feedback")}
                  className="text-gray-600 dark:text-gray-400 hover:text-primary transition"
                >
                  ← Back to Feedback
                </button>
              </div>
            </div>

            {/* INFO CARD */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <p className="text-sm text-blue-700 dark:text-blue-400 text-center">
                💡 Rating scale: 1 (Poor) to 5 (Excellent)
              </p>
            </div>

          </div>
        </main>
      </div>

      {/* MOBILE NAV */}
      <StudentMobileNav />
    </div>
  );
}

export default function FeedbackRatePage() {
  const { isAuthenticated, isChecking } = useStudentAuth();

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
    <Suspense fallback={
      <div className="min-h-screen bg-soft-background dark:bg-dark-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <p className="text-dark-text dark:text-gray-300 mt-4">Loading...</p>
        </div>
      </div>
    }>
      <FeedbackRateContent />
    </Suspense>
  );
}
