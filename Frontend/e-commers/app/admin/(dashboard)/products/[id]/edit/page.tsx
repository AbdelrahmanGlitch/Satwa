"use client";

import { use, useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";
import { getProductById } from "@/lib/data/products";
import type { Product } from "@/lib/types";

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  // Fetched directly by id rather than pulled from the admin list store —
  // that store only ever holds one (paginated) page at a time, so a
  // product sitting on a different page wouldn't be found there.
  const [product, setProduct] = useState<Product | undefined | null>(null);

  useEffect(() => {
    getProductById(id).then(setProduct);
  }, [id]);

  if (product === null) {
    return <p className="text-sm text-ivory/50">Loading…</p>;
  }
  if (!product) notFound();

  return (
    <div>
      <h1 className="font-display text-3xl">Edit Product</h1>
      <ProductForm product={product} />
    </div>
  );
}
