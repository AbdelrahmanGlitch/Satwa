import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductActions } from "@/components/product/ProductActions";
import { COLLECTION_META } from "@/lib/data/collections";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/lib/types";

function NotesRow({ label, notes }: { label: string; notes: string[] }) {
  return (
    <div className="flex gap-4 py-3">
      <p className="w-16 shrink-0 text-xs uppercase tracking-[0.2em] text-accent">
        {label}
      </p>
      <p className="text-sm text-ivory/70">{notes.join(", ")}</p>
    </div>
  );
}

export function ProductDetail({ product, related }: { product: Product; related: Product[] }) {
  const onSale =
    typeof product.compareAtPrice === "number" &&
    product.compareAtPrice > product.price;
  const genderLabel = product.gender === "men" ? "Men" : "Women";

  return (
    <main className="flex-1">
      <Container className="py-10">
        <div className="flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-ivory/40">
          <Link href={`/${product.gender}`} className="hover:text-accent">
            {genderLabel}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link
            href={`/${product.gender}/${product.collections[0]}`}
            className="hover:text-accent"
          >
            {COLLECTION_META[product.collections[0] as keyof typeof COLLECTION_META]?.title ??
              product.collections[0]}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-ivory/70">{product.name}</span>
        </div>

        <div className="mt-8 grid gap-12 lg:grid-cols-2">
          <ProductGallery
            images={product.images}
            fallbackCollection={product.collections[0]}
            productName={product.name}
          />

          <div className="flex flex-col">
            <div className="flex flex-wrap gap-1.5">
              {product.bestSeller && <Badge tone="accent">Best seller</Badge>}
              {product.isNew && <Badge tone="ivory">New</Badge>}
              {onSale && <Badge tone="danger">Sale</Badge>}
            </div>

            <h1 className="mt-4 font-display text-4xl">{product.name}</h1>
            <p className="mt-2 text-sm text-ivory/55">{product.tagline}</p>

            <div className="mt-6 flex items-baseline gap-3">
              <p className="text-2xl text-ivory">{formatPrice(product.price)}</p>
              {onSale && (
                <p className="text-base text-ivory/40 line-through">
                  {formatPrice(product.compareAtPrice!)}
                </p>
              )}
              <p className="text-xs uppercase tracking-[0.2em] text-ivory/40">
                {product.volumeMl}ml
              </p>
            </div>

            <p className="mt-6 max-w-md text-sm leading-relaxed text-ivory/65">
              {product.description}
            </p>

            <div className="mt-8">
              <ProductActions product={product} />
            </div>

            <div className="mt-10 border-t border-line pt-2">
              <NotesRow label="Top" notes={product.notes.top} />
              <NotesRow label="Heart" notes={product.notes.heart} />
              <NotesRow label="Base" notes={product.notes.base} />
            </div>
          </div>
        </div>
      </Container>

      {related.length > 0 && (
        <section className="border-t border-line py-20">
          <Container>
            <h2 className="font-display text-2xl">You may also like</h2>
            <div className="mt-8">
              <ProductGrid products={related} />
            </div>
          </Container>
        </section>
      )}
    </main>
  );
}
