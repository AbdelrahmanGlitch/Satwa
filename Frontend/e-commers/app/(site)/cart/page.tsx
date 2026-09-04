"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button, ButtonLink } from "@/components/ui/Button";
import { ScentVial } from "@/components/ui/ScentVial";
import { useCartStore } from "@/lib/store/cart";
import { useAuthStore } from "@/lib/store/auth";
import { getProductsByIds } from "@/lib/data/products";
import { checkout } from "@/lib/data/orders";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/lib/types";
import { ApiError } from "@/lib/api";

const inputClass =
  "border border-line-strong bg-transparent px-4 py-3 text-sm text-ivory placeholder:text-ivory/35 focus:border-accent focus:outline-none";

export default function CartPage() {
  const router = useRouter();
  const lines = useCartStore((s) => s.lines);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const remove = useCartStore((s) => s.remove);
  const clearCart = useCartStore((s) => s.clear);

  const status = useAuthStore((s) => s.status);
  const authHeader = useAuthStore((s) => s.authHeader);
  const openAuthModal = useAuthStore((s) => s.openAuthModal);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getProductsByIds(lines.map((l) => l.productId))
      .then((res) => { if (!cancelled) setProducts(res); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines.map((l) => l.productId).join(",")]);

  const items = lines
    .map((line) => ({ line, product: products.find((p) => p.id === line.productId) }))
    .filter((item): item is { line: typeof item.line; product: Product } => Boolean(item.product));

  const subtotal = items.reduce((sum, { line, product }) => sum + product.price * line.quantity, 0);

  async function handleCheckout() {
    setError(null);
    if (status !== "user") {
      openAuthModal("login");
      return;
    }
    if (!phone || !address) {
      setError("Add a phone number and delivery address to check out.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await checkout(authHeader!, {
        items: items.map(({ line }) => ({ productId: line.productId, quantity: line.quantity })),
        phone,
        address,
      });
      clearCart();
      router.push(`/checkout/fake?session=${result.payment.sessionToken}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Checkout failed.");
      setSubmitting(false);
    }
  }

  return (
    <main className="flex-1">
      <Container className="py-16">
        <h1 className="font-display text-4xl">Your Bag</h1>

        {!loading && items.length === 0 ? (
          <div className="mt-10 border border-dashed border-line py-24 text-center">
            <p className="text-sm text-ivory/50">Your bag is empty.</p>
            <ButtonLink href="/" variant="outline" size="sm" className="mt-6">
              Continue shopping
            </ButtonLink>
          </div>
        ) : (
          <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_360px]">
            <div className="flex flex-col divide-y divide-line">
              {items.map(({ line, product }) => (
                <div key={product.id} className="flex gap-5 py-6">
                  <Link
                    href={`/product/${product.slug}`}
                    className="h-28 w-24 shrink-0 overflow-hidden border border-line"
                  >
                    {product.images[0] ? (
                      <img
                        src={product.images[0].url}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ScentVial collection={product.collections[0]} />
                    )}
                  </Link>
                  <div className="flex flex-1 flex-col justify-between">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <Link
                          href={`/product/${product.slug}`}
                          className="font-display text-lg hover:text-accent"
                        >
                          {product.name}
                        </Link>
                        <p className="mt-1 text-xs text-ivory/50">
                          {product.volumeMl}ml
                        </p>
                      </div>
                      <p className="text-sm text-ivory">
                        {formatPrice(product.price * line.quantity)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center border border-line-strong">
                        <button
                          onClick={() => setQuantity(product.id, line.quantity - 1)}
                          aria-label="Decrease quantity"
                          className="flex h-9 w-9 items-center justify-center text-ivory/70 hover:text-accent"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="flex h-9 w-9 items-center justify-center text-sm">
                          {line.quantity}
                        </span>
                        <button
                          onClick={() => setQuantity(product.id, line.quantity + 1)}
                          aria-label="Increase quantity"
                          className="flex h-9 w-9 items-center justify-center text-ivory/70 hover:text-accent"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <button
                        onClick={() => remove(product.id)}
                        aria-label="Remove"
                        className="text-ivory/40 hover:text-danger"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="h-fit border border-line p-8">
              <h2 className="font-display text-xl">Summary</h2>
              <div className="mt-6 flex justify-between text-sm text-ivory/70">
                <span>Subtotal</span>
                <span className="text-ivory">{formatPrice(subtotal)}</span>
              </div>
              <p className="mt-2 text-xs text-ivory/40">
                Shipping and taxes calculated at checkout.
              </p>

              <div className="mt-6 flex flex-col gap-3">
                <input
                  type="tel"
                  placeholder="Phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={inputClass}
                />
                <textarea
                  placeholder="Delivery address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  className={inputClass}
                />
              </div>

              {error && <p className="mt-3 text-xs text-danger">{error}</p>}

              <Button onClick={handleCheckout} disabled={submitting || items.length === 0} className="mt-6 w-full">
                {submitting ? "Placing order…" : status === "user" ? "Checkout" : "Sign in to check out"}
              </Button>
            </div>
          </div>
        )}
      </Container>
    </main>
  );
}
