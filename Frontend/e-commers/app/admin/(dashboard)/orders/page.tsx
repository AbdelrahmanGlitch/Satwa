"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ApiError } from "@/lib/api";
import { useAuthStore } from "@/lib/store/auth";
import { Pagination } from "@/components/admin/Pagination";
import { OrderStatusSelect } from "@/components/admin/OrderStatusSelect";
import { PaymentBadge } from "@/components/admin/PaymentBadge";
import {
  listOrders,
  updateOrderStatus,
  ORDER_STATUSES,
  type AdminOrderSummary,
  type AdminOrdersPage,
} from "@/lib/data/admin-orders";
import type { OrderStatus } from "@/lib/data/orders";
import { formatPrice } from "@/lib/utils";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function unitCount(order: AdminOrderSummary) {
  return order.products.reduce((sum, line) => sum + line.quantity, 0);
}

function isOrderStatus(value: string | null): value is OrderStatus {
  return !!value && (ORDER_STATUSES as string[]).includes(value);
}

function OrdersView() {
  const authHeader = useAuthStore((s) => s.authHeader);
  // Deep-linkable so the Overview's status tiles can land here pre-filtered.
  const statusParam = useSearchParams().get("status");
  const [data, setData] = useState<AdminOrdersPage | null>(null);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">(
    isOrderStatus(statusParam) ? statusParam : ""
  );
  const [page, setPage] = useState(1);
  // Bumped to force a refetch of the same page/filter — e.g. after a status
  // change moves a row out of the active filter.
  const [nonce, setNonce] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Ids currently mid-save, so a row's dropdown can disable itself without
  // freezing the whole table.
  const [saving, setSaving] = useState<string[]>([]);

  // Every state update here happens inside a promise callback — the effect
  // body itself sets nothing, so it can't cascade a re-render. The handlers
  // that change page/filter own turning the spinner back on.
  useEffect(() => {
    if (!authHeader) return;
    let active = true;
    listOrders(authHeader, { page, status: statusFilter })
      .then((res) => {
        if (!active) return;
        setData(res);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof ApiError ? err.message : "Could not load orders.");
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [authHeader, page, statusFilter, nonce]);

  function changeFilter(status: OrderStatus | "") {
    setLoading(true);
    setPage(1);
    setStatusFilter(status);
  }

  function changePage(next: number) {
    setLoading(true);
    setPage(next);
  }

  async function onStatusChange(order: AdminOrderSummary, status: OrderStatus) {
    if (!authHeader || status === order.status) return;
    setSaving((ids) => [...ids, order._id]);
    setError(null);
    // Optimistic: the dropdown shows the new value immediately, and rolls
    // back below if the API rejects it.
    setData((current) =>
      current
        ? {
            ...current,
            orders: current.orders.map((o) => (o._id === order._id ? { ...o, status } : o)),
          }
        : current
    );
    try {
      await updateOrderStatus(authHeader, order._id, status);
      // A row that no longer matches the active filter shouldn't linger.
      if (statusFilter && status !== statusFilter) {
        setLoading(true);
        setNonce((n) => n + 1);
      }
    } catch (err) {
      setData((current) =>
        current
          ? {
              ...current,
              orders: current.orders.map((o) =>
                o._id === order._id ? { ...o, status: order.status } : o
              ),
            }
          : current
      );
      setError(err instanceof ApiError ? err.message : "Could not update that order.");
    } finally {
      setSaving((ids) => ids.filter((id) => id !== order._id));
    }
  }

  const orders = data?.orders ?? [];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Orders</h1>
          <p className="mt-2 text-sm text-ivory/55">
            {data ? `${data.pagination.total} order${data.pagination.total === 1 ? "" : "s"}` : "Loading…"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label htmlFor="status-filter" className="text-xs uppercase tracking-[0.2em] text-ivory/45">
            Filter
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => changeFilter(e.target.value as OrderStatus | "")}
            className="border border-line-strong bg-transparent px-4 py-2.5 text-sm text-ivory focus:border-accent focus:outline-none"
          >
            <option value="">All statuses</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s} className="bg-surface capitalize">
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <p className="mt-6 border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      {loading && orders.length === 0 ? (
        <p className="mt-8 text-sm text-ivory/50">Loading orders…</p>
      ) : orders.length === 0 ? (
        <p className="mt-8 text-sm text-ivory/50">
          {statusFilter ? `No ${statusFilter} orders.` : "No orders yet."}
        </p>
      ) : (
        <div className="mt-8 overflow-x-auto border border-line">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-[0.15em] text-ivory/45">
                <th className="px-5 py-3 font-medium">Order</th>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Placed</th>
                <th className="px-5 py-3 font-medium">Items</th>
                <th className="px-5 py-3 font-medium">Total</th>
                <th className="px-5 py-3 font-medium">Payment</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {orders.map((order) => (
                <tr key={order._id}>
                  <td className="px-5 py-4">
                    <Link
                      href={`/admin/orders/${order._id}`}
                      className="font-mono text-xs text-ivory hover:text-accent"
                    >
                      #{order._id.slice(-8)}
                    </Link>
                  </td>
                  <td className="px-5 py-4">
                    <span className="block text-ivory/85">{order.user?.name ?? "Deleted user"}</span>
                    <span className="block text-xs text-ivory/45">{order.user?.email ?? "—"}</span>
                  </td>
                  <td className="px-5 py-4 text-ivory/70">{formatDate(order.createdAt)}</td>
                  <td className="px-5 py-4 text-ivory/70">{unitCount(order)}</td>
                  <td className="px-5 py-4 text-ivory/70">{formatPrice(order.totalAmount)}</td>
                  <td className="px-5 py-4">
                    <PaymentBadge status={order.paymentStatus} />
                  </td>
                  <td className="px-5 py-4">
                    <OrderStatusSelect
                      value={order.status}
                      disabled={saving.includes(order._id)}
                      onChange={(status) => onStatusChange(order, status)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && (
        <Pagination
          pagination={data.pagination}
          onPageChange={changePage}
          disabled={loading}
        />
      )}
    </div>
  );
}

export default function AdminOrdersPage() {
  // useSearchParams needs a Suspense boundary above it — same pattern as
  // the storefront's fake-checkout page.
  return (
    <Suspense fallback={<p className="text-sm text-ivory/50">Loading orders…</p>}>
      <OrdersView />
    </Suspense>
  );
}
