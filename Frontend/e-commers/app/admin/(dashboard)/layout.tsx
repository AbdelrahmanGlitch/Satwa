"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useAuthStore } from "@/lib/store/auth";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const status = useAuthStore((s) => s.status);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  useEffect(() => {
    if (hasHydrated && status !== "admin") router.replace("/admin/login");
  }, [hasHydrated, status, router]);

  if (!hasHydrated || status !== "admin") return null;

  return (
    <div className="flex min-h-screen bg-ink">
      <AdminSidebar />
      <div className="flex-1 overflow-x-hidden p-10">{children}</div>
    </div>
  );
}
