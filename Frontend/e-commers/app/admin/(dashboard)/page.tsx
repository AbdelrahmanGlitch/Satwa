"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="border border-line bg-surface p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-ivory/50">{label}</p>
      <p className="mt-3 font-display text-4xl">{value}</p>
    </div>
  );
}

interface Counts {
  products: number;
  collections: number;
  bestSellers: number;
  onSale: number;
}

// `limit=1` on each filtered query — cheap way to read the API's own
// `pagination.total` (already a `countDocuments` server-side) without
// pulling every matching row down just to measure `.length`. Deliberately
// not sourced from the catalog store's `products`/`collections` state,
// which only ever holds one paginated page — counting that would just
// report the current page size, not the true total.
async function fetchCounts(): Promise<Counts> {
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

export default function AdminOverviewPage() {
  const [counts, setCounts] = useState<Counts | null>(null);

  useEffect(() => {
    fetchCounts().then(setCounts);
  }, []);

  return (
    <div>
      <h1 className="font-display text-3xl">Overview</h1>
      <p className="mt-2 text-sm text-ivory/55">
        Live catalog data from the API.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Products" value={counts?.products ?? "…"} />
        <StatCard label="Collections" value={counts?.collections ?? "…"} />
        <StatCard label="Best sellers" value={counts?.bestSellers ?? "…"} />
        <StatCard label="On sale" value={counts?.onSale ?? "…"} />
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
