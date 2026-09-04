import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CollectionGrid } from "@/components/home/CollectionGrid";
import { ProductGrid } from "@/components/product/ProductGrid";
import { LionMark } from "@/components/ui/LionMark";
import { getProductsByGender } from "@/lib/data/products";
import type { Gender } from "@/lib/types";
import { cn } from "@/lib/utils";

const COPY: Record<Gender, { title: string; description: string }> = {
  men: {
    title: "For Men",
    description:
      "Oud, leather, and warm amber for the room you intend to command — organized by season, occasion, and daily wear.",
  },
  women: {
    title: "For Women",
    description:
      "Florals with weight, amber that lingers — organized by season, occasion, and daily wear.",
  },
};

export async function GenderLanding({ gender }: { gender: Gender }) {
  const products = await getProductsByGender(gender);
  const bestSellers = products.filter((p) => p.bestSeller);
  const copy = COPY[gender];

  return (
    <main className="flex-1">
      <section className="relative flex min-h-[50vh] items-center justify-center overflow-hidden border-b border-line text-center">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.05]">
          <LionMark className={cn("h-[60vh] w-[60vh] min-w-[420px]")} />
        </div>
        <Container className="relative py-20">
          <p className="text-xs font-medium uppercase tracking-[0.4em] text-accent">
            Satwa
          </p>
          <h1 className="mt-5 font-display text-5xl md:text-6xl">{copy.title}</h1>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-ivory/60">
            {copy.description}
          </p>
        </Container>
      </section>

      <CollectionGrid gender={gender} />

      <section className="border-b border-line py-24">
        <Container>
          <SectionHeading eyebrow="Most wanted" title={`${copy.title.replace("For ", "")}'s Best Sellers`} />
          <div className="mt-12">
            <ProductGrid products={bestSellers} />
          </div>
        </Container>
      </section>
    </main>
  );
}
