"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ApiError } from "@/lib/api";
import { useAuthStore } from "@/lib/store/auth";
import { OrderStatusSelect } from "@/components/admin/OrderStatusSelect";
import { PaymentBadge } from "@/components/admin/PaymentBadge";
import { getOrder, updateOrderStatus, type AdminOrderDetail } from "@/lib/data/admin-orders";
import type { OrderStatus } from "@/lib/data/orders";
import { formatPrice } from "@/lib/utils";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.2em] text-ivory/45">{label}</p>
      <div className="mt-1.5 text-sm text-ivory/85">{children}</div>
    </div>
  );
}

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const authHeader = useAuthStore((s) => s.authHeader);
  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authHeader || !id) return;
    let active = true;
    // `loading` already starts true, so nothing is set synchronously here —
    // every state update below happens in a promise callback.
    getOrder(authHeader, id)
      .then((o) => active && setOrder(o))
      .catch((err) => active && setError(err instanceof ApiError ? err.message : "Could not load that order."))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [authHeader, id]);

  async function onStatusChange(status: OrderStatus) {
    if (!authHeader || !order || status === order.status) return;
    const previous = order.status;
    setSaving(true);
    setError(null);
    setOrder({ ...order, status });
    try {
      await updateOrderStatus(authHeader, order._id, status);
    } catch (err) {
      setOrder({ ...order, status: previous });
      setError(err instanceof ApiError ? err.message : "Could not update that order.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-ivory/50">Loading order…</p>;

  if (!order) {
    return (
      <div>
        <p className="text-sm text-danger">{error ?? "Order not found."}</p>
        <Link href="/admin/orders" className="mt-4 inline-block text-sm text-accent hover:underline">
          Back to orders
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-ivory/50 hover:text-accent"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Orders
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Order #{order._id.slice(-8)}</h1>
          <p className="mt-2 text-sm text-ivory/55">Placed {formatDateTime(order.createdAt)}</p>
        </div>
        <OrderStatusSelect value={order.status} disabled={saving} onChange={onStatusChange} />
      </div>

      {error && (
        <p className="mt-6 border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="mt-8 grid gap-4 border border-line bg-surface p-6 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Customer">
          {order.user?.name ?? "Deleted user"}
          <span className="mt-0.5 block text-xs text-ivory/45">{order.user?.email ?? "—"}</span>
        </Field>
        <Field label="Phone">{order.phone}</Field>
        <Field label="Delivery address">{order.address}</Field>
        <Field label="Payment">
          <PaymentBadge status={order.paymentStatus} />
          {order.paidAt && (
            <span className="mt-1.5 block text-xs text-ivory/45">
              Paid {formatDateTime(order.paidAt)}
            </span>
          )}
          {order.paymentReference && (
            <span className="mt-0.5 block font-mono text-[10px] text-ivory/35">
              {order.paymentReference}
            </span>
          )}
        </Field>
      </div>

      <div className="mt-6 overflow-x-auto border border-line">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-line text-xs uppercase tracking-[0.15em] text-ivory/45">
              <th className="px-5 py-3 font-medium">Product</th>
              <th className="px-5 py-3 font-medium">Unit price</th>
              <th className="px-5 py-3 font-medium">Qty</th>
              <th className="px-5 py-3 text-right font-medium">Line total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {order.products.map((line, i) => (
              <tr key={line.product?._id ?? i}>
                <td className="px-5 py-4">
                  {line.product ? (
                    <Link
                      href={`/product/${line.product.slug}`}
                      target="_blank"
                      className="text-ivory hover:text-accent"
                    >
                      {line.product.name}
                    </Link>
                  ) : (
                    <span className="text-ivory/45">Product removed from catalogue</span>
                  )}
                </td>
                <td className="px-5 py-4 text-ivory/70">{formatPrice(line.unitPrice)}</td>
                <td className="px-5 py-4 text-ivory/70">{line.quantity}</td>
                <td className="px-5 py-4 text-right text-ivory/85">
                  {formatPrice(line.unitPrice * line.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-line">
              <td colSpan={3} className="px-5 py-4 text-xs uppercase tracking-[0.2em] text-ivory/45">
                Total
              </td>
              <td className="px-5 py-4 text-right font-display text-xl">
                {formatPrice(order.totalAmount)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
