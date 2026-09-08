"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, Layers, Receipt, Boxes, LogOut, ExternalLink } from "lucide-react";
import { LionMark } from "@/components/ui/LionMark";
import { useAuthStore } from "@/lib/store/auth";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: Receipt },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/stock", label: "Stock", icon: Boxes },
  { href: "/admin/collections", label: "Collections", icon: Layers },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const logout = useAuthStore((s) => s.logout);

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-line bg-surface p-6">
      <Link href="/admin" className="flex items-center gap-2.5">
        <LionMark className="h-7 w-7" />
        <span className="font-display text-sm tracking-[0.3em]">SATWA</span>
      </Link>
      <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-ivory/40">
        Admin
      </p>

      <nav className="mt-10 flex flex-col gap-1">
        {LINKS.map(({ href, label, icon: Icon }) => {
          // Sub-routes keep their section highlighted (an order's detail
          // page still means "Orders"), but "/admin" is a prefix of every
          // link so it only ever matches exactly.
          const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 text-sm transition-colors",
                active ? "bg-white/5 text-accent" : "text-ivory/70 hover:text-ivory"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-1 border-t border-line pt-4">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 text-sm text-ivory/70 hover:text-ivory"
        >
          <ExternalLink className="h-4 w-4" />
          View storefront
        </Link>
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 text-left text-sm text-ivory/70 hover:text-ivory"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </div>
    </aside>
  );
}
