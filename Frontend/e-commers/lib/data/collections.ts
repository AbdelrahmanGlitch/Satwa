import { apiFetch, ApiError } from "@/lib/api";
import type { Collection, CollectionType, Gender } from "@/lib/types";

// The 6 season/occasion/daily slugs are the fixed store taxonomy that
// drives the mega-menu — this stays static (it's site structure, not
// content) even though the actual Collection records now live in the
// database. Admins can also create additional free-form collections
// (e.g. "ramadan-edition") — those exist in the API but aren't wired into
// this fixed nav.
export const COLLECTION_TYPES: CollectionType[] = [
  "summer",
  "winter",
  "autumn",
  "spring",
  "occasions",
  "daily",
];

interface CollectionMeta {
  title: string;
  tagline: string;
  description: string;
}

// Used as instant nav-label copy (Header/Footer mega-menu) without waiting
// on a fetch, and as a fallback if the matching category hasn't been
// seeded in a fresh database yet. The real source of truth for everything
// else (descriptions an admin has edited, custom collections) is the API.
export const COLLECTION_META: Record<CollectionType, CollectionMeta> = {
  summer: {
    title: "Summer",
    tagline: "Citrus, salt air, bare skin",
    description:
      "Bright, radiant compositions built for heat — citrus, marine accords, and airy florals that carry without overwhelming.",
  },
  winter: {
    title: "Winter",
    tagline: "Smoke, amber, low light",
    description:
      "Dense, resinous scents that bloom in the cold — oud, tobacco, spice, and warm amber for the shortest days of the year.",
  },
  autumn: {
    title: "Autumn",
    tagline: "Leather, spice, fading gold",
    description:
      "Earthy, spiced compositions with weight — cardamom, leather, and dry woods that suit the turning season.",
  },
  spring: {
    title: "Spring",
    tagline: "Green notes, first bloom",
    description:
      "Fresh florals and green accords that open slowly, built for the in-between weeks of the year.",
  },
  occasions: {
    title: "Occasions",
    tagline: "For the room you want to command",
    description:
      "Statement compositions with maximum projection and longevity — built for evenings that matter.",
  },
  daily: {
    title: "Daily Use",
    tagline: "Effortless, everywhere",
    description:
      "Versatile, skin-close scents designed for every day — understated enough for the office, distinct enough to remember.",
  },
};

export interface BackendCategory {
  _id: string;
  title: string;
  slug: string;
  tagline?: string;
  description: string;
  gender: Gender;
  coverImage?: { secure_url: string; public_id: string };
}

export function toCollection(c: BackendCategory): Collection {
  return {
    id: c._id,
    slug: c.slug,
    gender: c.gender,
    title: c.title,
    tagline: c.tagline ?? "",
    description: c.description,
    coverImage: c.coverImage?.secure_url,
  };
}

export async function getAllCollections(): Promise<Collection[]> {
  const res = await apiFetch<{ categories: BackendCategory[] }>("/category");
  return res.categories.map(toCollection);
}

export async function getCollectionsByGender(gender: Gender): Promise<Collection[]> {
  const res = await apiFetch<{ categories: BackendCategory[] }>(`/category?gender=${gender}`);
  return res.categories.map(toCollection);
}

export async function getCollection(gender: Gender, slug: string): Promise<Collection | undefined> {
  try {
    const res = await apiFetch<{ category: BackendCategory }>(`/category/${gender}/${slug}`);
    return toCollection(res.category);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return undefined;
    throw err;
  }
}

// Admin edit screens address a collection by id (not gender+slug, which
// the public storefront routes use).
export async function getCollectionById(id: string): Promise<Collection | undefined> {
  try {
    const res = await apiFetch<{ category: BackendCategory }>(`/category/id/${id}`);
    return toCollection(res.category);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return undefined;
    throw err;
  }
}

export function isCollectionType(value: string): value is CollectionType {
  return (COLLECTION_TYPES as string[]).includes(value);
}
