"use client";

import { motion } from "framer-motion";
import { LionMark } from "@/components/ui/LionMark";

/**
 * Full-screen cinematic loader shown while the Hero's frame sequence
 * preloads. Blocks interaction (Hero.tsx locks page scroll while this is
 * mounted) and reports real asset-loading progress — never a fake timer.
 */
export function HeroLoader({ progress }: { progress: number }) {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, filter: "blur(8px)" }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-ink"
    >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="flex flex-col items-center"
      >
        <LionMark className="h-14 w-14" />
        <p className="mt-5 text-xs font-medium tracking-[0.45em] text-ivory/70">
          SATWA
        </p>

        <p className="mt-12 font-display text-3xl tabular-nums text-accent">
          {Math.round(progress)}%
        </p>

        <div className="mt-6 h-px w-56 overflow-hidden bg-line">
          <div
            className="h-full bg-accent transition-[width] duration-200 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
