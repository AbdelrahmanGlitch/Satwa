import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { ProductGrid } from "@/components/product/ProductGrid";
import { CategoryPhotoGate } from "@/components/catalog/CategoryPhotoGate";
import { getCollection } from "@/lib/data/collections";
import { getProductsByCollection } from "@/lib/data/products";
import type { CollectionType, Gender } from "@/lib/types";

export async function CollectionListing({
  gender,
  collection,
}: {
  gender: Gender;
  collection: CollectionType;
}) {
  const meta = await getCollection(gender, collection);
  if (!meta) notFound();

  const products = await getProductsByCollection(gender, collection);
  const genderLabel = gender === "men" ? "Men" : "Women";

  // Everything the page will show a photo for — the category's own banner
  // plus each product's primary image — preloaded before any of it is
  // allowed to render, so the page never appears mid-pop-in.
  const imageUrls = [
    meta.coverImage,
    ...products.map((p) => p.images[0]?.url),
  ].filter((url): url is string => Boolean(url));

  return (
    <CategoryPhotoGate imageUrls={imageUrls}>
      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-line py-16">
          {meta.coverImage && (
            <>
              <img
                src={meta.coverImage}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-ink/70" />
            </>
          )}
          <Container className="relative">
            <div className="flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-ivory/40">
              <Link href={`/${gender}`} className="hover:text-accent">
                {genderLabel}
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-ivory/70">{meta.title}</span>
            </div>
            <h1 className="mt-5 font-display text-4xl md:text-5xl">
              {genderLabel} — {meta.title}
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-ivory/60">
              {meta.description}
            </p>
          </Container>
        </section>

        <section className="py-16">
          <Container>
            <ProductGrid products={products} />
          </Container>
        </section>
      </main>
    </CategoryPhotoGate>
  );
}
