import { cn } from "@/lib/utils";
import type { CollectionType } from "@/lib/types";

const ACCENTS: Record<CollectionType, string> = {
  summer: "#d98a3d",
  winter: "#7fa0bd",
  autumn: "#a15a2a",
  spring: "#7fae7a",
  occasions: "#8a2b3a",
  daily: "#d9c9a3",
};

function isCollectionType(value: string): value is CollectionType {
  return value in ACCENTS;
}

/**
 * Art-directed placeholder for product photography. Renders a minimal
 * bottle silhouette over a gradient keyed to the product's collection, so
 * every card looks intentional rather than a broken/missing image. Swap for
 * real photography later by populating `product.images` — components that
 * render this already fall back automatically when images are empty.
 */
export function ScentVial({
  collection = "daily",
  className,
}: {
  collection?: string;
  className?: string;
}) {
  const accent = isCollectionType(collection) ? ACCENTS[collection] : ACCENTS.daily;
  const gradientId = `vial-gradient-${collection}`;
  const glowId = `vial-glow-${collection}`;

  return (
    <svg
      viewBox="0 0 400 500"
      className={cn("h-full w-full", className)}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.28" />
          <stop offset="45%" stopColor="#0b0b0c" stopOpacity="1" />
          <stop offset="100%" stopColor="#0b0b0c" stopOpacity="1" />
        </linearGradient>
        <radialGradient id={glowId} cx="50%" cy="38%" r="42%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.35" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="400" height="500" fill={`url(#${gradientId})`} />
      <ellipse cx="200" cy="190" rx="150" ry="150" fill={`url(#${glowId})`} />

      {/* bottle silhouette */}
      <g stroke="#d9c9a3" strokeWidth="1.5" fill="none" opacity="0.85">
        <rect x="163" y="120" width="74" height="34" rx="6" />
        <rect x="178" y="98" width="44" height="26" rx="4" />
        <rect x="140" y="154" width="120" height="220" rx="16" />
        <line x1="140" y1="230" x2="260" y2="230" strokeOpacity="0.4" />
        <line x1="168" y1="180" x2="168" y2="340" strokeOpacity="0.25" />
      </g>
      <circle cx="200" cy="264" r="5" fill="#d9c9a3" opacity="0.9" />
    </svg>
  );
}
