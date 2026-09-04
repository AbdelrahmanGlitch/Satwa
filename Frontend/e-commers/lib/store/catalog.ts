import { create } from "zustand";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuthStore } from "@/lib/store/auth";
import { toCollection, type BackendCategory } from "@/lib/data/collections";
import type { Collection, CollectionType, Gender, Product, ScentNotes } from "@/lib/types";

// Powers the /admin dashboard. Every mutator here calls the real API with
// the signed-in admin's auth header — there's no local/mock fallback left,
// so the admin dashboard and the public storefront (lib/data/products.ts,
// lib/data/collections.ts) now read from the same database.

type Result = { ok: true } | { ok: false; error: string };

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

function errorMessage(err: unknown, fallback: string) {
  return err instanceof ApiError ? err.message : fallback;
}

export interface ProductInput {
  name: string;
  tagline: string;
  gender: Gender;
  collections: (CollectionType | string)[];
  price: number;
  compareAtPrice?: number;
  volumeMl: number;
  notes: ScentNotes;
  description: string;
  bestSeller: boolean;
  isNew: boolean;
  stockQuantity: number;
}

export interface CollectionInput {
  title: string;
  gender: Gender;
  tagline: string;
  description: string;
}

/** Builds the multipart body a product create/update expects — text fields plus up to 6 new image files under "images". Arrays/objects travel as JSON strings (see backend/src/middleware/parseJsonFields.js). */
function productFormData(input: ProductInput, files: File[], removeImageIds?: string[]) {
  const fd = new FormData();
  fd.append("name", input.name);
  fd.append("tagline", input.tagline ?? "");
  fd.append("description", input.description ?? "");
  fd.append("price", String(input.price));
  if (input.compareAtPrice !== undefined) fd.append("compareAtPrice", String(input.compareAtPrice));
  fd.append("gender", input.gender);
  fd.append("collections", JSON.stringify(input.collections));
  fd.append("notes", JSON.stringify(input.notes));
  fd.append("volumeMl", String(input.volumeMl));
  fd.append("stockQuantity", String(input.stockQuantity));
  fd.append("bestSeller", String(input.bestSeller));
  fd.append("isNew", String(input.isNew));
  if (removeImageIds?.length) fd.append("removeImages", JSON.stringify(removeImageIds));
  for (const file of files) fd.append("images", file);
  return fd;
}

function collectionFormData(input: CollectionInput, file?: File | null) {
  const fd = new FormData();
  fd.append("title", input.title);
  fd.append("gender", input.gender);
  fd.append("tagline", input.tagline ?? "");
  fd.append("description", input.description);
  if (file) fd.append("coverImage", file);
  return fd;
}

const PAGE_SIZE = 25;

interface CatalogState {
  products: Product[];
  productsPagination: PaginationMeta | null;
  collections: Collection[];
  collectionsPagination: PaginationMeta | null;
  loading: boolean;
  // Both default to whatever page was last fetched (page 1 initially) —
  // mutators call these with no args after a create/update/delete so the
  // list refreshes in place instead of jumping back to page 1.
  fetchProducts: (page?: number) => Promise<void>;
  fetchCollections: (page?: number) => Promise<void>;
  addProduct: (input: ProductInput, files: File[]) => Promise<Result>;
  updateProduct: (id: string, input: ProductInput, newFiles: File[], removeImageIds: string[]) => Promise<Result>;
  deleteProduct: (id: string) => Promise<void>;
  addCollection: (input: CollectionInput, file: File | null) => Promise<Result>;
  updateCollection: (id: string, input: CollectionInput, file: File | null) => Promise<Result>;
  deleteCollection: (id: string) => Promise<void>;
}

export const useCatalogStore = create<CatalogState>()((set, get) => ({
  products: [],
  productsPagination: null,
  collections: [],
  collectionsPagination: null,
  loading: false,

  fetchProducts: async (page) => {
    const targetPage = page ?? get().productsPagination?.page ?? 1;
    set({ loading: true });
    try {
      const res = await apiFetch<{ products: Product[]; pagination: PaginationMeta }>(
        `/product?limit=${PAGE_SIZE}&page=${targetPage}`
      );
      set({ products: res.products, productsPagination: res.pagination });
    } finally {
      set({ loading: false });
    }
  },

  fetchCollections: async (page) => {
    const targetPage = page ?? get().collectionsPagination?.page ?? 1;
    set({ loading: true });
    try {
      const res = await apiFetch<{ categories: BackendCategory[]; pagination: PaginationMeta }>(
        `/category?limit=${PAGE_SIZE}&page=${targetPage}`
      );
      set({ collections: res.categories.map(toCollection), collectionsPagination: res.pagination });
    } finally {
      set({ loading: false });
    }
  },

  addProduct: async (input, files) => {
    const authHeader = useAuthStore.getState().authHeader;
    try {
      await apiFetch("/product/create", { method: "POST", authHeader: authHeader!, body: productFormData(input, files) });
      await get().fetchProducts();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: errorMessage(err, "Could not create the product.") };
    }
  },

  updateProduct: async (id, input, newFiles, removeImageIds) => {
    const authHeader = useAuthStore.getState().authHeader;
    try {
      await apiFetch(`/product/${id}`, { method: "PATCH", authHeader: authHeader!, body: productFormData(input, newFiles, removeImageIds) });
      await get().fetchProducts();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: errorMessage(err, "Could not update the product.") };
    }
  },

  deleteProduct: async (id) => {
    const authHeader = useAuthStore.getState().authHeader;
    await apiFetch(`/product/${id}`, { method: "DELETE", authHeader: authHeader! });
    // Re-fetch (rather than just filtering the id out locally) so the page
    // backfills from the next one instead of showing one fewer row than
    // the pagination footer claims.
    await get().fetchProducts();
  },

  addCollection: async (input, file) => {
    const authHeader = useAuthStore.getState().authHeader;
    try {
      await apiFetch("/category/create", { method: "POST", authHeader: authHeader!, body: collectionFormData(input, file) });
      await get().fetchCollections();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: errorMessage(err, "Could not create the collection.") };
    }
  },

  updateCollection: async (id, input, file) => {
    const authHeader = useAuthStore.getState().authHeader;
    try {
      await apiFetch(`/category/${id}`, { method: "PATCH", authHeader: authHeader!, body: collectionFormData(input, file) });
      await get().fetchCollections();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: errorMessage(err, "Could not update the collection.") };
    }
  },

  deleteCollection: async (id) => {
    const authHeader = useAuthStore.getState().authHeader;
    await apiFetch(`/category/${id}`, { method: "DELETE", authHeader: authHeader! });
    await get().fetchCollections();
  },
}));
