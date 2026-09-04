"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { useCatalogStore } from "@/lib/store/catalog";
import { Pagination } from "@/components/admin/Pagination";
import { formatPrice } from "@/lib/utils";

export default function AdminProductsPage() {
  const products = useCatalogStore((s) => s.products);
  const pagination = useCatalogStore((s) => s.productsPagination);
  const loading = useCatalogStore((s) => s.loading);
  const fetchProducts = useCatalogStore((s) => s.fetchProducts);
  const deleteProduct = useCatalogStore((s) => s.deleteProduct);

  useEffect(() => {
    fetchProducts(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Products</h1>
        <Link
          href="/admin/products/new"
          className="border border-accent/50 px-5 py-2.5 text-xs font-medium uppercase tracking-[0.2em] text-accent hover:bg-accent/10"
        >
          + Add product
        </Link>
      </div>

      {loading && products.length === 0 ? (
        <p className="mt-8 text-sm text-ivory/50">Loading products…</p>
      ) : products.length === 0 ? (
        <p className="mt-8 text-sm text-ivory/50">No products yet.</p>
      ) : (
      <div className="mt-8 overflow-x-auto border border-line">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-line text-xs uppercase tracking-[0.15em] text-ivory/45">
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Gender</th>
              <th className="px-5 py-3 font-medium">Collections</th>
              <th className="px-5 py-3 font-medium">Price</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {products.map((product) => (
              <tr key={product.id}>
                <td className="px-5 py-4">
                  <Link
                    href={`/product/${product.slug}`}
                    target="_blank"
                    className="font-medium text-ivory hover:text-accent"
                  >
                    {product.name}
                  </Link>
                </td>
                <td className="px-5 py-4 capitalize text-ivory/70">{product.gender}</td>
                <td className="px-5 py-4 text-ivory/70">
                  {product.collections.join(", ")}
                </td>
                <td className="px-5 py-4 text-ivory/70">{formatPrice(product.price)}</td>
                <td className="px-5 py-4">
                  {product.bestSeller && (
                    <span className="mr-2 text-xs text-accent">Best seller</span>
                  )}
                  {!product.inStock && (
                    <span className="text-xs text-danger">Out of stock</span>
                  )}
                </td>
                <td className="px-5 py-4 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      aria-label={`Edit ${product.name}`}
                      className="text-ivory/40 hover:text-accent"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => deleteProduct(product.id)}
                      aria-label={`Delete ${product.name}`}
                      className="text-ivory/40 hover:text-danger"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      {pagination && (
        <Pagination pagination={pagination} onPageChange={fetchProducts} disabled={loading} />
      )}
    </div>
  );
}
