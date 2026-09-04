"use client";

import { useEffect, useRef } from "react";
import { useMotionValueEvent, type MotionValue } from "framer-motion";

// Frames are landscape (1440x1080). On a normal/wide box this is never hit
// (see effectiveRatio below), so desktop keeps today's exact full-bleed
// cover. On a narrow phone box, cropping strictly to the box's own ratio
// would zoom in on just the centered subject and cut off the rest of the
// scene — so the crop math is never allowed to go tighter than this ratio.
const MOBILE_MIN_RATIO = 0.7;

// Side length (px) of the offscreen render used to derive the blurred
// backdrop that fills the letterbox gaps on narrow screens. Deliberately
// tiny — the "blur" comes from the browser upscaling this small image back
// up to full box size, which is essentially free, instead of an actual
// per-pixel blur filter (slow on big canvases, especially on mobile).
const BACKDROP_SIZE = 48;

/** Crops `img` to `ratio` (CSS `background-size: cover` math) and draws the crop into the given destination rect. */
function drawCroppedInto(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  ratio: number,
  dx: number,
  dy: number,
  dw: number,
  dh: number
) {
  const imgRatio = img.width / img.height;

  let sx = 0;
  let sy = 0;
  let sw = img.width;
  let sh = img.height;

  if (imgRatio > ratio) {
    sw = img.height * ratio;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / ratio;
    sy = (img.height - sh) / 2;
  }

  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

/**
 * Draws `img` into the canvas box, cropped no tighter than
 * `MOBILE_MIN_RATIO`. On a wide/normal box that's a no-op (full-bleed
 * cover, identical to before). On a narrow box, the frame is cropped less
 * (showing more of the scene), fit to the full width and centered
 * vertically — leaving gaps top/bottom, filled with a soft blurred copy of
 * the same frame so it reads as a deliberate cinematic letterbox.
 */
function drawFrame(
  ctx: CanvasRenderingContext2D,
  offscreen: HTMLCanvasElement,
  img: HTMLImageElement,
  boxW: number,
  boxH: number
) {
  const boxRatio = boxW / boxH;

  ctx.clearRect(0, 0, boxW, boxH);

  if (boxRatio < MOBILE_MIN_RATIO) {
    const bw = BACKDROP_SIZE;
    const bh = Math.round(BACKDROP_SIZE / boxRatio);
    if (offscreen.width !== bw || offscreen.height !== bh) {
      offscreen.width = bw;
      offscreen.height = bh;
    }
    const octx = offscreen.getContext("2d");
    if (octx) {
      drawCroppedInto(octx, img, boxRatio, 0, 0, bw, bh);
      ctx.drawImage(offscreen, 0, 0, bw, bh, 0, 0, boxW, boxH);
      // Dim the blurred backdrop so the sharp foreground stays the focal point.
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillRect(0, 0, boxW, boxH);
    }
  }

  const effectiveRatio = Math.max(boxRatio, MOBILE_MIN_RATIO);
  const destW = Math.min(boxW, boxH * effectiveRatio);
  const destH = destW / effectiveRatio;
  const dx = (boxW - destW) / 2;
  const dy = (boxH - destH) / 2;
  drawCroppedInto(ctx, img, effectiveRatio, dx, dy, destW, destH);
}

/**
 * Renders the preloaded frame sequence to a single <canvas>, painting only
 * the frame the current scroll progress maps to. Frame selection happens in
 * a motion-value subscriber (not React state), so scrubbing never triggers
 * a React re-render — only an imperative canvas draw.
 *
 * Once `frozen` is true (the sequence has been scrolled through to the end
 * one time), further `progress` changes are ignored and the last painted
 * frame stays on screen no matter how the user scrolls afterwards.
 */
export function HeroCanvas({
  images,
  progress,
  frozen = false,
}: {
  images: HTMLImageElement[];
  progress: MotionValue<number>;
  frozen?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  const frameIndexRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const boxRef = useRef({ w: 0, h: 0, dpr: 1 });

  const draw = () => {
    const canvas = canvasRef.current;
    const img = images[frameIndexRef.current];
    if (!canvas || !img || !img.complete || img.naturalWidth === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { w, h, dpr } = boxRef.current;
    if (w === 0 || h === 0) return;
    if (!offscreenRef.current) offscreenRef.current = document.createElement("canvas");
    drawFrame(ctx, offscreenRef.current, img, w * dpr, h * dpr);
  };

  // Size the canvas to its container (device-pixel-ratio aware) and redraw
  // the current frame whenever that size changes.
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      boxRef.current = { w: rect.width, h: rect.height, dpr };
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      draw();
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images]);

  // Paint frame 0 as soon as it's available (images are only handed to this
  // component once fully preloaded, so this fires once on mount).
  useEffect(() => {
    frameIndexRef.current = 0;
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images]);

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  useMotionValueEvent(progress, "change", (v) => {
    if (frozen) return;
    const total = images.length;
    if (total === 0) return;
    const idx = Math.min(total - 1, Math.max(0, Math.floor(v * total)));
    if (idx === frameIndexRef.current) return;
    frameIndexRef.current = idx;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(draw);
  });

  return (
    <div ref={containerRef} className="absolute inset-0">
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}
