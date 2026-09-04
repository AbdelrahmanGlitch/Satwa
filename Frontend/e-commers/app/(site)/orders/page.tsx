"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAuthStore } from "@/lib/store/auth";
import { getMyOrders, type Order, type OrderStatus, type PaymentStatus } from "@/lib/data/orders";
import { formatPrice } from "@/lib/utils";

const STATUS_TONE: Record<OrderStatus, "accent" | "ivory" | "danger"> = {
  pending: "ivory",
  processing: "ivory",
  shipped: "accent",
  delivered: "accent",
  cancelled: "danger",
};

const PAYMENT_TONE: Record<PaymentStatus, "accent" | "ivory" | "danger"> = {
  paid: "accent",
  pending: "ivory",
  failed: "danger",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function OrdersPage() {
  const router = useRouter();
  const status = useAuthStore((s) => s.status);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const authHeader = useAuthStore((s) => s.authHeader);
  const openAuthModal = useAuthStore((s) => s.openAuthModal);

  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    if (hasHydrated && status === "guest") {
      router.replace("/");
      openAuthModal("login");
    }
  }, [hasHydrated, status, router, openAuthModal]);

  useEffect(() => {
    if (status === "user" && authHeader) {
      getMyOrders(authHeader).then(setOrders);
    }
  }, [status, authHeader]);

  if (!hasHydrated || status === "guest") return null;

  return (
    <main className="flex-1">
      <section className="border-b border-line py-16 text-center">
        <Container>
          <p className="text-xs font-medium uppercase tracking-[0.4em] text-accent">Your account</p>
          <h1 className="mt-5 font-display text-5xl">Your Orders</h1>
        </Container>
      </section>

      <section className="py-16">
        <Container className="max-w-3xl">
          {orders === null ? (
            <p className="text-center text-sm text-ivory/50">Loading…</p>
          ) : orders.length === 0 ? (
            <div className="border border-dashed border-line py-24 text-center">
              <p className="text-sm text-ivory/50">You haven&apos;t placed an order yet.</p>
              <ButtonLink href="/" variant="outline" size="sm" className="mt-6">
                Continue shopping
              </ButtonLink>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {orders.map((order) => (
                <div key={order._id} className="border border-line p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.15em] text-ivory/40">
                        Order #{order._id.slice(-8)}
                      </p>
                      <p className="mt-1 text-sm text-ivory/60">{formatDate(order.createdAt)}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={STATUS_TONE[order.status]}>{order.status}</Badge>
                      <Badge tone={PAYMENT_TONE[order.paymentStatus]}>
                        payment {order.paymentStatus}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col divide-y divide-line">
                    {order.products.map((line, i) => (
                      <div key={i} className="flex items-center gap-4 py-3">
                        <div className="h-14 w-12 shrink-0 overflow-hidden border border-line bg-ink">
                          {line.product?.images[0] && (
                            <img
                              src={line.product.images[0].secure_url}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                        <div className="flex flex-1 items-center justify-between gap-3">
                          {line.product ? (
                            <Link
                              href={`/product/${line.product.slug}`}
                              className="text-sm text-ivory hover:text-accent"
                            >
                              {line.product.name}
                            </Link>
                          ) : (
                            <span className="text-sm text-ivory/40">Product no longer available</span>
                          )}
                          <span className="shrink-0 text-xs text-ivory/50">
                            {line.quantity} × {formatPrice(line.unitPrice)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex flex-wrap items-end justify-between gap-4 border-t border-line pt-4">
                    <div className="text-xs text-ivory/45">
                      <p>Delivered to: {order.address}</p>
                      <p className="mt-1">Phone: {order.phone}</p>
                      <p className="mt-1 capitalize">
                        Payment method: {order.paymentMethod.replace("_", " ")}
                        {order.paymentReference && ` — ${order.paymentReference}`}
                      </p>
                    </div>
                    <p className="text-lg text-ivory">{formatPrice(order.totalAmount)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Container>
      </section>
    </main>
  );
}
