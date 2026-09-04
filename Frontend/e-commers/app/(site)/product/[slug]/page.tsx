import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ProductDetail } from "@/components/product/ProductDetail";
import { getAllProducts, getProductBySlug } from "@/lib/data/products";

// Deliberately no generateStaticParams here: the catalog is admin-editable
// (products can be added at any time, not just at build time), so this
// route stays fully dynamic — same as the collection pages. Pairing
// generateStaticParams with the no-store fetches getProductBySlug uses is
// its own bug: any slug that didn't exist at build time 500s in
// production (a static route can't gracefully fall back to a dynamic,
// no-store render the way a route with no static params at all can).

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  return {
    title: `${product.name} | Satwa`,
    description: product.tagline,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  // Same gender, sharing at least one collection, not itself.
  const candidates = await getAllProducts();
  const related = candidates
    .filter(
      (p) =>
        p.id !== product.id &&
        p.gender === product.gender &&
        p.collections.some((c) => product.collections.includes(c))
    )
    .slice(0, 4);

  return <ProductDetail product={product} related={related} />;
}
