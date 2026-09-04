"use client";

import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from "framer-motion";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { HeroLoader } from "@/components/home/HeroLoader";
import { HeroCanvas } from "@/components/home/HeroCanvas";
import { useFramePreloader } from "@/lib/hooks/useFramePreloader";

// Sequential frames extracted from the brand film, frame_0001.jpg..frame_0246.jpg.
const FRAME_COUNT = 246;
const FRAME_SRCS = Array.from(
  { length: FRAME_COUNT },
  (_, i) => `/hero/frames/frame_${String(i + 1).padStart(4, "0")}.jpg`
);

// How much scroll distance drives the full frame sequence. Taller = more
// scroll-resolution per frame (slower, more "cinematic"); shorter = quicker.
const SCRUB_HEIGHT = "350vh";

export function Hero() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { images, progress: loadProgress, isReady } = useFramePreloader(FRAME_SRCS);
  const [showLoader, setShowLoader] = useState(true);

  // Block page scroll/interaction until the cinematic sequence is ready.
  useEffect(() => {
    if (!showLoader) return;
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = previous;
    };
  }, [showLoader]);

  // Brief cinematic hold at 100% before the loader reveals the Hero.
  useEffect(() => {
    if (!isReady) return;
    const timer = setTimeout(() => setShowLoader(false), 500);
    return () => clearTimeout(timer);
  }, [isReady]);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // Latches true the first time the frame sequence is scrolled through to
  // its end. Once true, the canvas freezes on the last frame and the text
  // is pinned to its fully-visible resting state (see below) no matter how
  // the user scrolls afterwards — the fade/scrub only ever plays once per
  // page load.
  const [hasCompleted, setHasCompleted] = useState(false);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (!hasCompleted && v >= 0.995) setHasCompleted(true);
  });

  // Once the sequence has completed AND the section has fully scrolled out
  // of view (so nothing on screen depends on its size), collapse it from
  // its tall SCRUB_HEIGHT scroll track down to a single screen. That
  // removes the now-pointless leftover scroll distance — otherwise,
  // scrolling back up from lower sections would have to crawl through a
  // long stretch of frozen, unchanging section before reaching the real
  // top of the page. Collapsing only while off-screen (rather than the
  // instant `hasCompleted` flips) avoids yanking the scroll position out
  // from under whoever is still actively scrolling through it.
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    if (!hasCompleted || collapsed) return;
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) setCollapsed(true);
      },
      { threshold: 0 }
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, [hasCompleted, collapsed]);

  // Text is fully in place the moment the loader reveals the Hero (frame 0
  // already has its resting text, matching the "already prepared behind
  // the loader" requirement) and only fades near the very end, as the
  // animation hands off to the rest of the page — restrained, not
  // competing with the frame sequence. Once `hasCompleted` latches, this
  // hand-off fade is bypassed and the text stays fully visible.
  const textOpacity = useTransform(scrollYProgress, [0, 0.85, 1], [1, 1, 0]);
  const textY = useTransform(scrollYProgress, [0, 0.85, 1], [0, 0, -24]);
  const textBlurPx = useTransform(scrollYProgress, [0.85, 1], [0, 6]);
  const textFilter = useTransform(textBlurPx, (v) => `blur(${v}px)`);

  return (
    <>
      <AnimatePresence>
        {showLoader && <HeroLoader progress={loadProgress} />}
      </AnimatePresence>

      <section
        ref={sectionRef}
        className="relative"
        style={{ height: collapsed ? "100vh" : SCRUB_HEIGHT }}
      >
        <div className="sticky top-0 h-screen w-full overflow-hidden border-b border-line bg-ink">
          {isReady && (
            <HeroCanvas
              images={images}
              progress={scrollYProgress}
              frozen={hasCompleted}
            />
          )}

          {/* Scrim so the lower text block stays legible over any frame. */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink from-0% via-ink/35 via-45% to-transparent to-85%" />

          <Container className="relative z-10 flex h-full flex-col items-center justify-end pb-16 text-center md:pb-24">
            <motion.div
              style={
                hasCompleted
                  ? { opacity: 1, y: 0, filter: "blur(0px)" }
                  : { opacity: textOpacity, y: textY, filter: textFilter }
              }
              className="flex flex-col items-center"
            >
              <p className="text-xs font-medium uppercase tracking-[0.4em] text-accent">
                Premium Fragrance House
              </p>

              <h1 className="mt-6 max-w-3xl font-display text-4xl leading-[1.08] md:text-6xl">
                Fragrance for the Room{" "}
                <span className="text-gradient-accent">You Walk Into</span>
              </h1>

              <p className="mt-5 max-w-xl text-balance text-sm leading-relaxed text-ivory/60 md:text-base">
                Satwa — سطوة, meaning dominance — composes perfumes for men and
                women in small batches, organized by season and occasion
                instead of aisles.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <ButtonLink href="/men" variant="primary" size="lg">
                  Shop Men
                </ButtonLink>
                <ButtonLink href="/women" variant="outline" size="lg">
                  Shop Women
                </ButtonLink>
              </div>
            </motion.div>
          </Container>
        </div>
      </section>
    </>
  );
}
