import { apiFetch, ApiError } from "@/lib/api";
import type { Gender, Product } from "@/lib/types";

interface ProductListResponse {
  products: Product[];
  pagination: { page: number; pages: number };
}

/**
 * Walks every page of a filtered product list and returns the whole
 * thing — for the helpers below, which mirror the old static-array
 * behavior (every matching product, no paging UI to drive it). The API
 * caps a single page at 100, so anything past that needs more than one
 * request regardless of catalog size; a fixed limit here previously
 * silently dropped whatever didn't fit on page 1 (bit us for real once
 * the catalog passed 100 products).
 */
async function fetchAllPages(query: string): Promise<Product[]> {
  const all: Product[] = [];
  let page = 1;
  while (true) {
    const res = await apiFetch<ProductListResponse>(`/product?${query}&limit=100&page=${page}`);
    all.push(...res.products);
    if (page >= res.pagination.pages) break;
    page++;
  }
  return all;
}

export async function getAllProducts(): Promise<Product[]> {
  return fetchAllPages("");
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  try {
    const res = await apiFetch<{ product: Product }>(`/product/${slug}`);
    return res.product;
  } catch (err) {
    // Only a genuine "no such product" 404 becomes undefined — anything
    // else (the backend being down, Next's own internal signals) must
    // keep propagating instead of quietly rendering a 404 page.
    if (err instanceof ApiError && err.status === 404) return undefined;
    throw err;
  }
}

// Admin edit screens address a product by id — same reasoning as
// getCollection needing a slug for the storefront vs. an id for editing.
export async function getProductById(id: string): Promise<Product | undefined> {
  try {
    const res = await apiFetch<{ product: Product }>(`/product/id/${id}`);
    return res.product;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return undefined;
    throw err;
  }
}

export async function getProductsByGender(gender: Gender): Promise<Product[]> {
  return fetchAllPages(`gender=${gender}`);
}

export async function getProductsByCollection(gender: Gender, collection: string): Promise<Product[]> {
  return fetchAllPages(`gender=${gender}&collection=${encodeURIComponent(collection)}`);
}

export async function getBestSellers(limit?: number): Promise<Product[]> {
  const all = await fetchAllPages("bestSeller=true");
  return typeof limit === "number" ? all.slice(0, limit) : all;
}

export async function getOnSaleProducts(): Promise<Product[]> {
  return fetchAllPages("onSale=true");
}

// Cart lines and wishlist ids are keyed by product id (not slug), so
// resolving either back to full Product objects needs a batch id lookup
// rather than N separate by-slug requests.
export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  if (ids.length === 0) return [];
  const res = await apiFetch<{ products: Product[] }>("/product/by-ids", {
    method: "POST",
    body: { ids },
  });
  return res.products;
}
