"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuthStore } from "@/lib/store/auth";
import { getAllProducts } from "@/lib/data/products";
import {
  fetchAllOrders,
  buildSalesReport,
  joinProductSales,
  type SalesReport,
  type ProductSalesRow,
} from "@/lib/data/analytics";
import { ORDER_STATUSES } from "@/lib/data/admin-orders";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

function StatCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: number | string;
  hint?: string;
  tone?: "accent" | "danger";
}) {
  return (
    <div className="border border-line bg-surface p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-ivory/50">{label}</p>
      <p
        className={cn(
          "mt-3 font-display text-4xl",
          tone === "accent" && "text-accent",
          tone === "danger" && "text-danger"
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1.5 text-xs text-ivory/40">{hint}</p>}
    </div>
  );
}

interface CatalogCounts {
  products: number;
  collections: number;
  bestSellers: number;
  onSale: number;
}

// `limit=1` on each filtered query — cheap way to read the API's own
// `pagination.total` (already a `countDocuments` server-side) without
// pulling every matching row down just to measure `.length`.
async function fetchCounts(): Promise<CatalogCounts> {
  const [products, collections, bestSellers, onSale] = await Promise.all([
    apiFetch<{ pagination: { total: number } }>("/product?limit=1"),
    apiFetch<{ pagination: { total: number } }>("/category?limit=1"),
    apiFetch<{ pagination: { total: number } }>("/product?limit=1&bestSeller=true"),
    apiFetch<{ pagination: { total: number } }>("/product?limit=1&onSale=true"),
  ]);
  return {
    products: products.pagination.total,
    collections: collections.pagination.total,
    bestSellers: bestSellers.pagination.total,
    onSale: onSale.pagination.total,
  };
}

const LOW_STOCK_THRESHOLD = 5;

export default function AdminOverviewPage() {
  const authHeader = useAuthStore((s) => s.authHeader);
  const [counts, setCounts] = useState<CatalogCounts | null>(null);
  const [report, setReport] = useState<SalesReport | null>(null);
  const [rows, setRows] = useState<ProductSalesRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCounts().then(setCounts).catch(() => {});
  }, []);

  useEffect(() => {
    if (!authHeader) return;
    let active = true;
    Promise.all([getAllProducts(), fetchAllOrders(authHeader)])
      .then(([products, orders]) => {
        if (!active) return;
        const built = buildSalesReport(orders);
        setReport(built);
        setRows(joinProductSales(products, built));
      })
      .catch((err) => active && setError(err instanceof ApiError ? err.message : "Could not load sales data."));
    return () => {
      active = false;
    };
  }, [authHeader]);

  const topSellers = useMemo(
    () => [...rows].filter((r) => r.unitsPaid > 0).sort((a, b) => b.unitsPaid - a.unitsPaid).slice(0, 5),
    [rows]
  );
  const neverSold = useMemo(() => rows.filter((r) => r.unitsPaid === 0), [rows]);
  const lowStock = useMemo(
    () =>
      [...rows]
        .filter((r) => r.product.stockQuantity <= LOW_STOCK_THRESHOLD)
        .sort((a, b) => a.product.stockQuantity - b.product.stockQuantity)
        .slice(0, 5),
    [rows]
  );

  const avgOrder = report && report.paid.orders > 0 ? report.paid.revenue / report.paid.orders : 0;

  return (
    <div>
      <h1 className="font-display text-3xl">Overview</h1>
      <p className="mt-2 text-sm text-ivory/55">
        Live catalogue and sales data from the API. Revenue counts paid orders only.
      </p>

      {error && (
        <p className="mt-6 border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      <h2 className="mt-10 text-xs uppercase tracking-[0.2em] text-ivory/45">Sales</h2>
      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Revenue"
          value={report ? formatPrice(report.paid.revenue) : "…"}
          hint={report ? `${report.paid.orders} paid order${report.paid.orders === 1 ? "" : "s"}` : undefined}
          tone="accent"
        />
        <StatCard
          label="Units sold"
          value={report?.paid.units ?? "…"}
          hint="Paid orders only"
        />
        <StatCard
          label="Awaiting payment"
          value={report ? formatPrice(report.pending.revenue) : "…"}
          hint={report ? `${report.pending.units} unit${report.pending.units === 1 ? "" : "s"} reserved` : undefined}
        />
        <StatCard
          label="Average order"
          value={report ? formatPrice(Math.round(avgOrder)) : "…"}
        />
      </div>

      <h2 className="mt-10 text-xs uppercase tracking-[0.2em] text-ivory/45">Orders by status</h2>
      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-5">
        {ORDER_STATUSES.map((status) => (
          <Link key={status} href={`/admin/orders?status=${status}`} className="block">
            <div className="border border-line bg-surface p-5 transition-colors hover:border-accent/50">
              <p className="text-xs capitalize tracking-[0.1em] text-ivory/50">{status}</p>
              <p className="mt-2 font-display text-3xl">{report?.statusCounts[status] ?? "…"}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="text-xs uppercase tracking-[0.2em] text-ivory/45">Best selling</h2>
          <div className="mt-4 border border-line">
            {topSellers.length === 0 ? (
              <p className="px-5 py-6 text-sm text-ivory/45">
                {report ? "Nothing has sold yet." : "Loading…"}
              </p>
            ) : (
              <table className="w-full text-left text-sm">
                <tbody className="divide-y divide-line">
                  {topSellers.map((row) => (
                    <tr key={row.product.id}>
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/product/${row.product.slug}`}
                          target="_blank"
                          className="text-ivory hover:text-accent"
                        >
                          {row.product.name}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5 text-right text-ivory/70">
                        {row.unitsPaid} sold
                      </td>
                      <td className="px-5 py-3.5 text-right text-accent">
                        {formatPrice(row.revenuePaid)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <section>
          <h2 className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-ivory/45">
            Low stock
            {lowStock.length > 0 && <AlertTriangle className="h-3.5 w-3.5 text-accent" />}
          </h2>
          <div className="mt-4 border border-line">
            {lowStock.length === 0 ? (
              <p className="px-5 py-6 text-sm text-ivory/45">
                {rows.length ? `Nothing at or below ${LOW_STOCK_THRESHOLD} units.` : "Loading…"}
              </p>
            ) : (
              <table className="w-full text-left text-sm">
                <tbody className="divide-y divide-line">
                  {lowStock.map((row) => (
                    <tr key={row.product.id}>
                      <td className="px-5 py-3.5 text-ivory/85">{row.product.name}</td>
                      <td className="px-5 py-3.5 text-right">
                        <span className={row.product.stockQuantity === 0 ? "text-danger" : "text-accent"}>
                          {row.product.stockQuantity} left
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {lowStock.length > 0 && (
            <Link href="/admin/stock" className="mt-3 inline-block text-xs text-accent hover:underline">
              Manage stock →
            </Link>
          )}
        </section>
      </div>

      <h2 className="mt-10 text-xs uppercase tracking-[0.2em] text-ivory/45">Catalogue</h2>
      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Products" value={counts?.products ?? "…"} />
        <StatCard label="Collections" value={counts?.collections ?? "…"} />
        <StatCard label="Best sellers" value={counts?.bestSellers ?? "…"} />
        <StatCard
          label="Never sold"
          value={report ? neverSold.length : "…"}
          hint={report ? `of ${rows.length} products` : undefined}
        />
      </div>

      <div className="mt-10 flex flex-wrap gap-4">
        <Link
          href="/admin/products/new"
          className="border border-accent/50 px-6 py-3 text-xs font-medium uppercase tracking-[0.2em] text-accent hover:bg-accent/10"
        >
          + Add product
        </Link>
        <Link
          href="/admin/collections/new"
          className="border border-line-strong px-6 py-3 text-xs font-medium uppercase tracking-[0.2em] text-ivory/80 hover:border-accent hover:text-accent"
        >
          + Add collection
        </Link>
      </div>
    </div>
  );
}
