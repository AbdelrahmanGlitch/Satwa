"use client";

import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { HeroLoader } from "@/components/home/HeroLoader";
import { useFramePreloader } from "@/lib/hooks/useFramePreloader";

/**
 * Blocks a category page behind the same full-screen loader the homepage
 * hero uses, until every product photo on the page has actually finished
 * downloading — so the page only ever appears once, fully "ready," rather
 * than rendering with placeholders that photos then pop into. `children`
 * (the already-rendered page content) only mounts once loading is done;
 * see Hero.tsx for the identical scroll-lock + brief-hold + fade pattern.
 */
export function CategoryPhotoGate({
  imageUrls,
  children,
}: {
  imageUrls: string[];
  children: React.ReactNode;
}) {
  const { progress, isReady } = useFramePreloader(imageUrls);
  const [showLoader, setShowLoader] = useState(true);

  useEffect(() => {
    if (!showLoader) return;
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = previous;
    };
  }, [showLoader]);

  useEffect(() => {
    if (!isReady) return;
    const timer = setTimeout(() => setShowLoader(false), 400);
    return () => clearTimeout(timer);
  }, [isReady]);

  return (
    <>
      <AnimatePresence>{showLoader && <HeroLoader progress={progress} />}</AnimatePresence>
      {!showLoader && children}
    </>
  );
}
