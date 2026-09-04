import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProductGrid } from "@/components/product/ProductGrid";
import { getOnSaleProducts } from "@/lib/data/products";

export async function OffersSection() {
  const products = await getOnSaleProducts();
  if (products.length === 0) return null;

  return (
    <section className="border-b border-line bg-surface py-24">
      <Container>
        <div className="mb-12 border border-accent/30 bg-ink px-8 py-6 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-accent">
            Limited time
          </p>
          <p className="mt-2 font-display text-2xl">
            Up to 20% off select compositions
          </p>
        </div>
        <SectionHeading
          eyebrow="Current offers"
          title="On Sale Now"
          href="/offers"
          hrefLabel="View all offers"
        />
        <div className="mt-12">
          <ProductGrid products={products} />
        </div>
      </Container>
    </section>
  );
}
