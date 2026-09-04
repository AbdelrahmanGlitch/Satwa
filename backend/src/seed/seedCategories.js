// One-time seed: creates the 12 standard collections (6 season/occasion
// slugs x 2 genders) that the storefront's mega-menu and collection pages
// link to. Product creation requires these to already exist (a product's
// `collections` are resolved by gender+slug against real Category docs),
// so this needs to run once against a fresh database before any products
// can be added. Safe to re-run — existing (gender, slug) pairs are skipped.
//
// Usage: node src/seed/seedCategories.js
import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import connectionDB from "../DB/connectionDB.js";
import categoryModel from "../DB/models/category.model.js";

const COLLECTION_META = {
  summer: {
    title: "Summer",
    tagline: "Citrus, salt air, bare skin",
    description: "Bright, radiant compositions built for heat — citrus, marine accords, and airy florals that carry without overwhelming."
  },
  winter: {
    title: "Winter",
    tagline: "Smoke, amber, low light",
    description: "Dense, resinous scents that bloom in the cold — oud, tobacco, spice, and warm amber for the shortest days of the year."
  },
  autumn: {
    title: "Autumn",
    tagline: "Leather, spice, fading gold",
    description: "Earthy, spiced compositions with weight — cardamom, leather, and dry woods that suit the turning season."
  },
  spring: {
    title: "Spring",
    tagline: "Green notes, first bloom",
    description: "Fresh florals and green accords that open slowly, built for the in-between weeks of the year."
  },
  occasions: {
    title: "Occasions",
    tagline: "For the room you want to command",
    description: "Statement compositions with maximum projection and longevity — built for evenings that matter."
  },
  daily: {
    title: "Daily Use",
    tagline: "Effortless, everywhere",
    description: "Versatile, skin-close scents designed for every day — understated enough for the office, distinct enough to remember."
  }
};

const run = async () => {
  await connectionDB();
  let created = 0, skipped = 0;
  for (const gender of ["men", "women"]) {
    for (const [slug, meta] of Object.entries(COLLECTION_META)) {
      const exists = await categoryModel.findOne({ gender, slug });
      if (exists) { skipped++; continue; }
      await categoryModel.create({ slug, gender, ...meta });
      created++;
    }
  }
  console.log(`Seed complete — created ${created}, skipped ${skipped} (already existed).`);
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => { console.error(err); process.exit(1); });
