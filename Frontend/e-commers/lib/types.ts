export type Gender = "men" | "women";

export type CollectionType =
  | "summer"
  | "winter"
  | "autumn"
  | "spring"
  | "occasions"
  | "daily";

export interface Collection {
  // The database id — needed for admin update/delete calls. Absent on the
  // static fallback taxonomy in lib/data/collections.ts (COLLECTION_META),
  // present on everything that comes from the API.
  id?: string;
  // The 6 season/occasion/daily slugs are the fixed store taxonomy that
  // drives navigation. Admins can also create additional editorial
  // collections with a free-form slug (e.g. "ramadan-edition") — those show
  // up in the admin dashboard but aren't wired into the mega-menu yet.
  slug: CollectionType | (string & {});
  gender: Gender;
  title: string;
  tagline: string;
  description: string;
  // Undefined when none has been uploaded — components fall back to the
  // decorative ScentVial graphic in that case.
  coverImage?: string;
}

export interface ScentNotes {
  top: string[];
  heart: string[];
  base: string[];
}

export interface ProductImage {
  url: string;
  // Only meaningful to the admin edit form (identifies the Cloudinary
  // asset so a specific image can be removed) — display code only ever
  // needs `url`.
  publicId: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  gender: Gender;
  collections: (CollectionType | (string & {}))[];
  price: number;
  compareAtPrice?: number;
  images: ProductImage[];
  notes: ScentNotes;
  description: string;
  bestSeller: boolean;
  isNew: boolean;
  inStock: boolean;
  stockQuantity: number;
  volumeMl: number;
  // ISO timestamp of when the product was added — the admin stock
  // dashboard dates its lifetime-sold column from this.
  createdAt: string;
}
