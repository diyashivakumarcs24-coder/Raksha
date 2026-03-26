"use client";
/**
 * ProtectedRoute — redirects to /auth if user is not logged in.
 * Accepts optional allowedRoles to restrict access by role.
 */
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { UserRole } from "@/lib/firestore";

interface Props {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // wait for auth to resolve
    if (!user) {
      router.replace("/auth");
      return;
    }
    if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
      // Wrong role — send back to their correct dashboard
      const roleRoutes: Record<UserRole, string> = {
        user: "/dashboard",
        guardian: "/guardian",
        police: "/police",
        admin: "/admin",
      };
      router.replace(roleRoutes[profile.role] ?? "/dashboard");
    }
  }, [loading, user, profile, allowedRoles, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <span className="text-gray-400 animate-pulse text-sm">Loading…</span>
      </div>
    );
  }

  return <>{children}</>;
}
