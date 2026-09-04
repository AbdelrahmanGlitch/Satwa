const sharp = require("sharp");
const path = require("path");

const SRC = path.join(__dirname, "..", "public", "Gemini_Generated_Image_pmiedlpmiedlpmie.png");
const OUT = path.join(__dirname, "..", "public", "brand", "lion-mark.png");

async function run() {
  const img = sharp(SRC).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  for (let i = 0; i < width * height; i++) {
    const idx = i * channels;
    const r = data[idx],
      g = data[idx + 1],
      b = data[idx + 2];
    const warmth = r - b; // gold/bronze is warm (r>>b); dark fabric bg is near-neutral/cool
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    const score = Math.max(warmth, (lum - 60) * 0.5);
    let alpha = (score - 12) / (34 - 12); // ramp between 12..34
    alpha = Math.max(0, Math.min(1, alpha));
    data[idx + 3] = Math.round(alpha * 255);
  }

  await sharp(data, { raw: { width, height, channels } }).png().toFile(OUT);
  console.log("done ->", OUT, width, height);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
