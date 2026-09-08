"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ApiError } from "@/lib/api";
import { useAuthStore } from "@/lib/store/auth";
import { getAllProducts } from "@/lib/data/products";
import { fetchAllOrders, buildSalesReport, joinProductSales, type ProductSalesRow } from "@/lib/data/analytics";
import { updateProductStock, StockChangedError } from "@/lib/data/stock";
import { StockCell } from "@/components/admin/StockCell";
import { formatPrice } from "@/lib/utils";

type SortKey = "name" | "sold" | "remaining";

function addedOn(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminStockPage() {
  const authHeader = useAuthStore((s) => s.authHeader);
  const [rows, setRows] = useState<ProductSalesRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("remaining");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!authHeader) return;
    let active = true;
    // `loading` already starts true, so nothing is set synchronously here.
    // Products are public; orders need the admin header. Both are needed
    // before a single row can be drawn, so they load together.
    Promise.all([getAllProducts(), fetchAllOrders(authHeader)])
      .then(([products, orders]) => {
        if (!active) return;
        setRows(joinProductSales(products, buildSalesReport(orders)));
      })
      .catch((err) => active && setError(err instanceof ApiError ? err.message : "Could not load stock."))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [authHeader]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = needle
      ? rows.filter((r) => r.product.name.toLowerCase().includes(needle))
      : rows;
    return [...filtered].sort((a, b) => {
      if (sort === "name") return a.product.name.localeCompare(b.product.name);
      if (sort === "sold") return b.unitsPaid - a.unitsPaid;
      return a.product.stockQuantity - b.product.stockQuantity;
    });
  }, [rows, sort, query]);

  const totals = useMemo(
    () => ({
      remaining: rows.reduce((sum, r) => sum + r.product.stockQuantity, 0),
      sold: rows.reduce((sum, r) => sum + r.unitsPaid, 0),
      reserved: rows.reduce((sum, r) => sum + r.unitsPending, 0),
      outOfStock: rows.filter((r) => r.product.stockQuantity === 0).length,
    }),
    [rows]
  );

  async function saveStock(row: ProductSalesRow, next: number) {
    if (!authHeader) return;
    setError(null);
    try {
      const updated = await updateProductStock(
        authHeader,
        row.product.id,
        next,
        row.product.stockQuantity
      );
      setRows((current) =>
        current.map((r) =>
          r.product.id === row.product.id
            ? { ...r, product: { ...r.product, stockQuantity: updated.stockQuantity } }
            : r
        )
      );
    } catch (err) {
      if (err instanceof StockChangedError) {
        // Someone bought one mid-edit. Show the real number rather than
        // overwriting their purchase.
        setRows((current) =>
          current.map((r) =>
            r.product.id === row.product.id
              ? { ...r, product: { ...r.product, stockQuantity: err.actual } }
              : r
          )
        );
      }
      setError(err instanceof Error ? err.message : "Could not update stock.");
      throw err;
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Stock</h1>
          <p className="mt-2 text-sm text-ivory/55">
            Units sold and remaining for every product. Sold counts paid orders only.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products"
            className="border border-line-strong bg-transparent px-4 py-2.5 text-sm text-ivory placeholder:text-ivory/35 focus:border-accent focus:outline-none"
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            aria-label="Sort stock"
            className="border border-line-strong bg-transparent px-4 py-2.5 text-sm text-ivory focus:border-accent focus:outline-none"
          >
            <option value="remaining" className="bg-surface">Lowest stock first</option>
            <option value="sold" className="bg-surface">Best selling first</option>
            <option value="name" className="bg-surface">Name (A–Z)</option>
          </select>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard label="Units remaining" value={totals.remaining} />
        <SummaryCard label="Units sold (paid)" value={totals.sold} />
        <SummaryCard label="Reserved (unpaid)" value={totals.reserved} />
        <SummaryCard label="Out of stock" value={totals.outOfStock} tone={totals.outOfStock ? "danger" : undefined} />
      </div>

      {error && (
        <p className="mt-6 border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      {loading ? (
        <p className="mt-8 text-sm text-ivory/50">Loading stock…</p>
      ) : visible.length === 0 ? (
        <p className="mt-8 text-sm text-ivory/50">
          {query ? "No products match that search." : "No products yet."}
        </p>
      ) : (
        <div className="mt-8 overflow-x-auto border border-line">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-[0.15em] text-ivory/45">
                <th className="px-5 py-3 font-medium">Product</th>
                <th className="px-5 py-3 font-medium">Added</th>
                <th className="px-5 py-3 font-medium">Sold</th>
                <th className="px-5 py-3 font-medium">Reserved</th>
                <th className="px-5 py-3 font-medium">Revenue</th>
                <th className="px-5 py-3 font-medium">Remaining</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {visible.map((row) => (
                <tr key={row.product.id}>
                  <td className="px-5 py-4">
                    <Link
                      href={`/product/${row.product.slug}`}
                      target="_blank"
                      className="font-medium text-ivory hover:text-accent"
                    >
                      {row.product.name}
                    </Link>
                    <span className="mt-0.5 block text-xs capitalize text-ivory/40">
                      {row.product.gender}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs text-ivory/55">{addedOn(row.product.createdAt)}</td>
                  <td className="px-5 py-4">
                    <span className="text-ivory/85">{row.unitsPaid}</span>
                    <span className="ml-1.5 text-xs text-ivory/35">since added</span>
                  </td>
                  <td className="px-5 py-4 text-ivory/55">{row.unitsPending || "—"}</td>
                  <td className="px-5 py-4 text-ivory/70">{formatPrice(row.revenuePaid)}</td>
                  <td className="px-5 py-4">
                    <StockCell
                      value={row.product.stockQuantity}
                      onSave={(next) => saveStock(row, next)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "danger";
}) {
  return (
    <div className="border border-line bg-surface p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-ivory/50">{label}</p>
      <p className={`mt-3 font-display text-4xl ${tone === "danger" ? "text-danger" : ""}`}>
        {value}
      </p>
    </div>
  );
}
