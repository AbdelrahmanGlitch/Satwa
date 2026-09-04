import { ProductCard } from "@/components/product/ProductCard";
import type { Product } from "@/lib/types";

export function ProductGrid({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <div className="border border-dashed border-line py-24 text-center text-sm text-ivory/50">
        No fragrances here yet — check back soon.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
