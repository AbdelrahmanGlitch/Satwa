"use client";

import { useState } from "react";
import { Heart, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useCartStore } from "@/lib/store/cart";
import { useWishlistStore } from "@/lib/store/wishlist";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/types";

export function ProductActions({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const add = useCartStore((s) => s.add);
  const inWishlist = useWishlistStore((s) => s.has(product.id));
  const toggleWishlist = useWishlistStore((s) => s.toggle);

  function handleAdd() {
    add(product.id, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center self-start border border-line-strong">
        <button
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          aria-label="Decrease quantity"
          className="flex h-12 w-12 items-center justify-center text-ivory/70 hover:text-accent"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="flex h-12 w-12 items-center justify-center text-sm">
          {quantity}
        </span>
        <button
          onClick={() => setQuantity((q) => q + 1)}
          aria-label="Increase quantity"
          className="flex h-12 w-12 items-center justify-center text-ivory/70 hover:text-accent"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="flex gap-3">
        <Button onClick={handleAdd} disabled={!product.inStock} className="flex-1">
          {!product.inStock ? "Out of stock" : added ? "Added to bag" : "Add to bag"}
        </Button>
        <button
          onClick={() => toggleWishlist(product.id)}
          aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={inWishlist}
          className="flex h-[50px] w-[50px] shrink-0 items-center justify-center border border-line-strong text-ivory/70 transition-colors hover:border-accent hover:text-accent"
        >
          <Heart className={cn("h-4.5 w-4.5", inWishlist && "fill-accent text-accent")} />
        </button>
      </div>
    </div>
  );
}
