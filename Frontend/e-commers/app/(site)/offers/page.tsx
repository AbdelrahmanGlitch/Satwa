import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { ProductGrid } from "@/components/product/ProductGrid";
import { getOnSaleProducts } from "@/lib/data/products";

export const metadata: Metadata = { title: "Offers | Satwa" };

export default async function OffersPage() {
  const products = await getOnSaleProducts();

  return (
    <main className="flex-1">
      <section className="border-b border-line py-16 text-center">
        <Container>
          <p className="text-xs font-medium uppercase tracking-[0.4em] text-accent">
            Limited time
          </p>
          <h1 className="mt-5 font-display text-5xl">Current Offers</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-ivory/60">
            A short list, on purpose — every Satwa offer is on a composition
            we believe in, not overstock.
          </p>
        </Container>
      </section>

      <section className="py-16">
        <Container>
          <ProductGrid products={products} />
        </Container>
      </section>
    </main>
  );
}
