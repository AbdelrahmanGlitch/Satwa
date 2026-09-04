"use client";

import { useState } from "react";
import { ScentVial } from "@/components/ui/ScentVial";
import { cn } from "@/lib/utils";
import type { ProductImage } from "@/lib/types";

/** Main image + click-to-switch thumbnail row. Falls back to the decorative ScentVial graphic when the product has no photos yet. */
export function ProductGallery({
  images,
  fallbackCollection,
  productName,
}: {
  images: ProductImage[];
  fallbackCollection: string;
  productName: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = images[activeIndex];

  return (
    <div className="flex flex-col gap-3">
      <div className="aspect-[4/5] overflow-hidden border border-line">
        {active ? (
          <img src={active.url} alt={productName} className="h-full w-full object-cover" />
        ) : (
          <ScentVial collection={fallbackCollection} />
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2">
          {images.map((img, i) => (
            <button
              key={img.publicId}
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-label={`View photo ${i + 1}`}
              aria-current={i === activeIndex}
              className={cn(
                "h-16 w-16 shrink-0 overflow-hidden border",
                i === activeIndex ? "border-accent" : "border-line-strong opacity-70 hover:opacity-100"
              )}
            >
              <img src={img.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
