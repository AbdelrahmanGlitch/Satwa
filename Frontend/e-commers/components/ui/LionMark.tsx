import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Satwa's winged-lion crest. Source art lives at public/brand/lion-source.png
 * (background removed via scripts/removebg.js into lion-mark.png). Callers
 * size this with height/width utility classes on `className`, same as
 * before — the wrapper is what's sized, the image just fills it.
 */
export function LionMark({ className }: { className?: string }) {
  return (
    <span className={cn("relative inline-block", className)} aria-hidden="true">
      <Image
        src="/brand/lion-mark.png"
        alt=""
        fill
        sizes="240px"
        className="object-contain"
      />
    </span>
  );
}
