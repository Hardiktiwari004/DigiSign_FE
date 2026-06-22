"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { api, getAccessToken, clearTokens } from "@/lib/client";
import { ApiSuccess, User } from "@/types/api";

const PUBLIC_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify",
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading, setUser, setIsLoading, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      const token = getAccessToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.get<ApiSuccess<User>>("/api/auth/me");
        if (response.data?.success && response.data?.data) {
          setUser(response.data.data);
        } else {
          clearTokens();
          setUser(null);
        }
      } catch (err) {
        console.error("Auth initialization failed:", err);
        clearTokens();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Listen for custom logout event from interceptor
    const handleAuthLogout = () => {
      logout();
      router.push("/login");
    };

    window.addEventListener("auth-logout", handleAuthLogout);
    return () => {
      window.removeEventListener("auth-logout", handleAuthLogout);
    };
  }, [setUser, setIsLoading, logout, router]);

  useEffect(() => {
    if (isLoading) return;

    const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
    const isAdminRoute = pathname.startsWith("/admin");

    if (isAuthenticated) {
      if (isPublicRoute && !pathname.startsWith("/verify")) {
        // Logged in users should not visit login/register/forgot-password etc.
        if (user?.role === "ADMIN") {
          router.replace("/admin/audit-logs");
        } else {
          router.replace("/documents");
        }
      } else if (isAdminRoute && user?.role !== "ADMIN") {
        // Non-admin trying to access admin dashboard
        router.replace("/dashboard");
      }
    } else {
      if (!isPublicRoute) {
        // Guest trying to access protected page
        router.replace("/login");
      }
    }
  }, [isLoading, isAuthenticated, user, pathname, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-blue-600/30"></div>
          <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
        </div>
        <p className="text-slate-400 font-sans tracking-wide text-sm animate-pulse">
          Initializing secure environment...
        </p>
      </div>
    );
  }

  // Double check client route protection to prevent flicker before redirect
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
  const isAdminRoute = pathname.startsWith("/admin");

  if (!isAuthenticated && !isPublicRoute) {
    return null;
  }

  if (isAuthenticated && isAdminRoute && user?.role !== "ADMIN") {
    return null;
  }

  if (isAuthenticated && isPublicRoute && !pathname.startsWith("/verify")) {
    return null;
  }

  return <>{children}</>;
}
export default AuthProvider;
