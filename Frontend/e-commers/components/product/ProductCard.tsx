"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { ScentVial } from "@/components/ui/ScentVial";
import { Badge } from "@/components/ui/Badge";
import { useWishlistStore } from "@/lib/store/wishlist";
import { formatPrice, cn } from "@/lib/utils";
import type { Product } from "@/lib/types";

export function ProductCard({ product }: { product: Product }) {
  const inWishlist = useWishlistStore((s) => s.has(product.id));
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const onSale =
    typeof product.compareAtPrice === "number" &&
    product.compareAtPrice > product.price;

  return (
    <div className="group relative">
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden border border-line bg-ink">
          {product.images[0] ? (
            <img
              src={product.images[0].url}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
          ) : (
            <ScentVial
              collection={product.collections[0]}
              className="transition-transform duration-500 group-hover:scale-[1.04]"
            />
          )}
          <div className="absolute left-3 top-3 flex flex-col gap-1.5">
            {product.bestSeller && <Badge tone="accent">Best seller</Badge>}
            {product.isNew && <Badge tone="ivory">New</Badge>}
            {onSale && <Badge tone="danger">Sale</Badge>}
          </div>
        </div>
        <div className="mt-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-base leading-tight text-ivory">
              {product.name}
            </h3>
            <p className="mt-1 text-xs text-ivory/50">{product.tagline}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-sm text-ivory">{formatPrice(product.price)}</p>
            {onSale && (
              <p className="text-xs text-ivory/40 line-through">
                {formatPrice(product.compareAtPrice!)}
              </p>
            )}
          </div>
        </div>
      </Link>

      <button
        onClick={() => toggleWishlist(product.id)}
        aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
        aria-pressed={inWishlist}
        className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-ink/70 text-ivory backdrop-blur transition-colors hover:text-accent"
      >
        <Heart
          className={cn("h-4.5 w-4.5", inWishlist && "fill-accent text-accent")}
        />
      </button>
    </div>
  );
}
