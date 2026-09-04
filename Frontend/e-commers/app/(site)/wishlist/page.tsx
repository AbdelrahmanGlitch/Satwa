"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { ProductGrid } from "@/components/product/ProductGrid";
import { useAuthStore } from "@/lib/store/auth";
import { useWishlistStore } from "@/lib/store/wishlist";
import { getProductsByIds } from "@/lib/data/products";
import type { Product } from "@/lib/types";

export default function WishlistPage() {
  const router = useRouter();
  const status = useAuthStore((s) => s.status);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const openAuthModal = useAuthStore((s) => s.openAuthModal);
  const ids = useWishlistStore((s) => s.ids);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (hasHydrated && status === "guest") {
      router.replace("/");
      openAuthModal("login");
    }
  }, [hasHydrated, status, router, openAuthModal]);

  useEffect(() => {
    getProductsByIds(ids).then(setProducts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join(",")]);

  if (!hasHydrated || status === "guest") return null;

  return (
    <main className="flex-1">
      <section className="border-b border-line py-16 text-center">
        <Container>
          <p className="text-xs font-medium uppercase tracking-[0.4em] text-accent">
            Saved
          </p>
          <h1 className="mt-5 font-display text-5xl">Your Wishlist</h1>
        </Container>
      </section>

      <section className="py-16">
        <Container>
          {products.length === 0 ? (
            <p className="text-center text-sm text-ivory/50">
              Nothing saved yet — tap the heart on any fragrance to add it here.
            </p>
          ) : (
            <ProductGrid products={products} />
          )}
        </Container>
      </section>
    </main>
  );
}
