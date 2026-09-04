import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProductCard } from "@/components/product/ProductCard";
import { getBestSellers } from "@/lib/data/products";

export async function BestSellersRail() {
  const products = await getBestSellers(8);

  return (
    <section className="border-b border-line py-24">
      <Container>
        <SectionHeading
          eyebrow="Most wanted"
          title="Best Sellers"
          description="The compositions our regulars reorder — across every collection, both genders."
        />
        <div className="mt-12 flex snap-x gap-6 overflow-x-auto pb-4">
          {products.map((product) => (
            <div key={product.id} className="w-[260px] shrink-0 snap-start md:w-[280px]">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
