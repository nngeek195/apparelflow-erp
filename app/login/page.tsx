"use client";

import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

export default function AdminLogin() {
  const handleGoogleAdminLogin = async () => {
    try {
      // 1. Open Google Sign-In Popup
      const result = await signInWithPopup(auth, googleProvider);
      
      // 2. Retrieve Firebase ID Token
      const idToken = await result.user.getIdToken();

      // 3. Register/Sync Admin user with PostgreSQL backend
      const res = await fetch("/api/auth/register-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (res.ok) {
        window.location.href = "/dashboard";
      } else {
        alert("Failed to synchronize user in database");
      }
    } catch (error) {
      console.error("Google Auth Error:", error);
    }
  };

  return (
    <button
      onClick={handleGoogleAdminLogin}
      className="py-3 px-6 bg-slate-800 text-white font-semibold rounded-lg hover:bg-slate-700 transition"
    >
      Sign in with Google (Admin/Supervisor)
    </button>
  );
}