import { apiFetch } from "@/lib/api";
import { getProductById } from "@/lib/data/products";
import type { Product } from "@/lib/types";

/**
 * Thrown when the stock on the server moved between the admin loading the
 * page and pressing save — see updateProductStock for why that matters.
 */
export class StockChangedError extends Error {
  actual: number;
  constructor(expected: number, actual: number) {
    super(`Stock changed to ${actual} while you were editing (you were working from ${expected}).`);
    this.name = "StockChangedError";
    this.actual = actual;
  }
}

/**
 * Sets a product's stock, sending *only* `stockQuantity`.
 *
 * `PATCH /product/:id` treats every field as optional, so this doesn't
 * have to resubmit the name, description, collections and images just to
 * change one number — which also means it can't accidentally clobber an
 * edit someone made on the full product form.
 *
 * The write is an absolute set, not an increment: if a customer checks
 * out in the seconds between the table rendering and the admin saving,
 * writing a stale number would silently undo that sale's decrement. So we
 * re-read the product first and refuse the write if it moved, letting the
 * caller show the fresh number instead of quietly losing a sale.
 */
export async function updateProductStock(
  authHeader: string,
  id: string,
  stockQuantity: number,
  expectedCurrent: number
): Promise<Product> {
  const latest = await getProductById(id);
  if (latest && latest.stockQuantity !== expectedCurrent) {
    throw new StockChangedError(expectedCurrent, latest.stockQuantity);
  }
  const res = await apiFetch<{ product: Product }>(`/product/${id}`, {
    method: "PATCH",
    authHeader,
    body: { stockQuantity },
  });
  return res.product;
}
