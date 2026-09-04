"use client";

import { useEffect, useState } from "react";

interface FramePreloaderState {
  /** Same length/order as `srcs`. Empty until every frame has loaded. */
  images: HTMLImageElement[];
  loaded: number;
  total: number;
  /** 0-100, based on images actually loaded — never a fake timer. */
  progress: number;
  isReady: boolean;
}

/**
 * Preloads (and decodes, where supported) every image in `srcs` and reports
 * real progress as they complete. Used by the Hero's cinematic frame
 * sequence so scrubbing never hits a missing/undecoded frame.
 */
export function useFramePreloader(srcs: string[]): FramePreloaderState {
  const [loaded, setLoaded] = useState(0);
  const [images, setImages] = useState<HTMLImageElement[]>([]);

  useEffect(() => {
    if (srcs.length === 0) return;

    let cancelled = false;
    let count = 0;
    const batch: HTMLImageElement[] = new Array(srcs.length);

    // Note: this effect is expected to run once — `srcs` is a stable
    // module-level constant in the Hero — so `loaded`/`images` start at
    // their correct useState defaults (0/[]) without needing a reset here.

    srcs.forEach((src, i) => {
      const img = new Image();
      batch[i] = img;

      const markDone = () => {
        if (cancelled) return;
        count += 1;
        setLoaded(count);
        if (count === srcs.length) setImages(batch);
      };

      img.src = src;

      // Prefer decode() so the first paint of each frame is instant (no
      // decode jank while scrubbing); fall back to load/error for browsers
      // without it.
      if (typeof img.decode === "function") {
        img.decode().then(markDone).catch(markDone);
      } else {
        img.onload = markDone;
        img.onerror = markDone;
      }
    });

    return () => {
      cancelled = true;
    };
  }, [srcs]);

  const total = srcs.length;
  const progress = total === 0 ? 100 : Math.round((loaded / total) * 100);
  const isReady = total === 0 || images.length === total;

  return { images, loaded, total, progress, isReady };
}
