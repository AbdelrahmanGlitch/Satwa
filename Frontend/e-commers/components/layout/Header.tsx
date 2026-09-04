"use client";

import Link from "next/link";
import { useState } from "react";
import { Heart, Menu, ShoppingBag, User, X, ChevronDown, LogOut, LayoutDashboard, UserCog, Package } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { IconButton, iconButtonClasses, IconCount } from "@/components/ui/IconButton";
import { LionMark } from "@/components/ui/LionMark";
import { COLLECTION_TYPES, COLLECTION_META } from "@/lib/data/collections";
import { useAuthStore } from "@/lib/store/auth";
import { useWishlistStore } from "@/lib/store/wishlist";
import { useCartStore } from "@/lib/store/cart";
import type { Gender } from "@/lib/types";

const GENDER_NAV: { gender: Gender; label: string }[] = [
  { gender: "men", label: "Men" },
  { gender: "women", label: "Women" },
];

function GenderMenu({ gender, label }: { gender: Gender; label: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <Link
        href={`/${gender}`}
        className="flex items-center gap-1 py-8 text-xs font-medium uppercase tracking-[0.2em] text-ivory/85 transition-colors hover:text-accent"
      >
        {label}
        <ChevronDown className="h-3 w-3" />
      </Link>

      {open && (
        <div className="absolute left-1/2 top-full w-[560px] -translate-x-1/2 border border-line bg-surface p-8 shadow-2xl">
          <div className="grid grid-cols-3 gap-x-6 gap-y-5">
            {COLLECTION_TYPES.map((slug) => (
              <Link
                key={slug}
                href={`/${gender}/${slug}`}
                className="group"
              >
                <p className="text-sm font-medium text-ivory transition-colors group-hover:text-accent">
                  {COLLECTION_META[slug].title}
                </p>
                <p className="mt-1 text-xs text-ivory/50">
                  {COLLECTION_META[slug].tagline}
                </p>
              </Link>
            ))}
          </div>
          <div className="mt-6 border-t border-line pt-5">
            <Link
              href={`/${gender}`}
              className="text-xs font-medium uppercase tracking-[0.2em] text-accent hover:text-accent-bright"
            >
              Shop all {label} →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function AccountMenu() {
  const [open, setOpen] = useState(false);
  const { status, user, openAuthModal, logout } = useAuthStore();

  if (status === "guest") {
    return (
      <IconButton aria-label="Account" onClick={() => openAuthModal("login")}>
        <User className="h-4.5 w-4.5" />
      </IconButton>
    );
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <IconButton aria-label="Account" active>
        <User className="h-4.5 w-4.5" />
      </IconButton>
      {open && (
        <div className="absolute right-0 top-full w-56 border border-line bg-surface p-2 shadow-2xl">
          <p className="truncate px-3 py-2 text-xs text-ivory/50">
            Signed in as <span className="text-ivory">{user?.name}</span>
          </p>
          {status === "admin" && (
            <Link
              href="/admin"
              className="flex items-center gap-2 px-3 py-2 text-sm text-ivory/85 hover:text-accent"
            >
              <LayoutDashboard className="h-4 w-4" /> Admin dashboard
            </Link>
          )}
          {status === "user" && (
            <>
              <Link
                href="/account"
                className="flex items-center gap-2 px-3 py-2 text-sm text-ivory/85 hover:text-accent"
              >
                <UserCog className="h-4 w-4" /> My profile
              </Link>
              <Link
                href="/orders"
                className="flex items-center gap-2 px-3 py-2 text-sm text-ivory/85 hover:text-accent"
              >
                <Package className="h-4 w-4" /> My orders
              </Link>
              <Link
                href="/wishlist"
                className="flex items-center gap-2 px-3 py-2 text-sm text-ivory/85 hover:text-accent"
              >
                <Heart className="h-4 w-4" /> Wishlist
              </Link>
            </>
          )}
          <button
            onClick={() => logout()}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ivory/85 hover:text-accent"
          >
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </div>
      )}
    </div>
  );
}

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const wishlistCount = useWishlistStore((s) => s.ids.length);
  const cartCount = useCartStore((s) => s.lines.reduce((n, l) => n + l.quantity, 0));

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-ink/95 backdrop-blur">
        <Container>
          <div className="flex h-20 items-center justify-between">
            <div className="flex items-center gap-3 lg:hidden">
              <IconButton aria-label="Menu" onClick={() => setMobileOpen(true)}>
                <Menu className="h-5 w-5" />
              </IconButton>
            </div>

            <Link href="/" className="flex items-center gap-2.5">
              <LionMark className="h-8 w-8" />
              <span className="font-display text-xl tracking-[0.3em] text-ivory">
                SATWA
              </span>
            </Link>

            <nav className="hidden items-center gap-10 lg:flex">
              {GENDER_NAV.map((g) => (
                <GenderMenu key={g.gender} gender={g.gender} label={g.label} />
              ))}
              <Link
                href="/offers"
                className="py-8 text-xs font-medium uppercase tracking-[0.2em] text-ivory/85 transition-colors hover:text-accent"
              >
                Offers
              </Link>
            </nav>

            <div className="flex items-center gap-1">
              <Link href="/wishlist" aria-label="Wishlist" className={iconButtonClasses()}>
                <Heart className="h-4.5 w-4.5" />
                <IconCount count={wishlistCount} />
              </Link>
              <Link href="/cart" aria-label="Cart" className={iconButtonClasses()}>
                <ShoppingBag className="h-4.5 w-4.5" />
                <IconCount count={cartCount} />
              </Link>
              <AccountMenu />
            </div>
          </div>
        </Container>
      </header>

      {/* Rendered as a sibling of <header>, not a descendant: the header's
          `backdrop-blur` (backdrop-filter) establishes a containing block
          for `position: fixed` descendants, which would otherwise pin this
          overlay's `inset-0` to the header's own ~80px-tall box instead of
          the viewport. */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-ink/80"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-[300px] flex-col gap-8 overflow-y-auto border-r border-line bg-surface p-6">
            <div className="flex items-center justify-between">
              <LionMark className="h-7 w-7" />
              <IconButton aria-label="Close menu" onClick={() => setMobileOpen(false)}>
                <X className="h-5 w-5" />
              </IconButton>
            </div>
            {GENDER_NAV.map((g) => (
              <div key={g.gender}>
                <Link
                  href={`/${g.gender}`}
                  onClick={() => setMobileOpen(false)}
                  className="text-sm font-medium uppercase tracking-[0.2em] text-accent"
                >
                  {g.label}
                </Link>
                <div className="mt-3 flex flex-col gap-2.5">
                  {COLLECTION_TYPES.map((slug) => (
                    <Link
                      key={slug}
                      href={`/${g.gender}/${slug}`}
                      onClick={() => setMobileOpen(false)}
                      className="text-sm text-ivory/70 hover:text-ivory"
                    >
                      {COLLECTION_META[slug].title}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
            <Link
              href="/offers"
              onClick={() => setMobileOpen(false)}
              className="text-sm font-medium uppercase tracking-[0.2em] text-accent"
            >
              Offers
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
