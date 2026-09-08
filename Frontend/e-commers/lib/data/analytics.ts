import { listOrders, type AdminOrderSummary } from "@/lib/data/admin-orders";
import type { OrderStatus } from "@/lib/data/orders";
import type { Product } from "@/lib/types";

/**
 * Sales analytics are derived in the browser: the API has no aggregation
 * endpoint, so we page the order list and sum it here.
 *
 * `buildSalesReport` is deliberately pure — it takes orders and products
 * and returns numbers, touching neither `fetch` nor React. That keeps it
 * trivially testable, and if the catalogue ever outgrows "walk every
 * order" (see fetchAllOrders' note), the same arithmetic can move into a
 * Mongo `$group` behind a `/order/stats` endpoint without any of the
 * components below changing.
 */

/**
 * What counts as sold:
 *
 * - `paid`      — payment confirmed. This is real revenue.
 * - `pending`   — stock is already reserved (checkout decrements it up
 *                 front) but the money hasn't arrived. Kept separate so
 *                 revenue is never inflated by orders that may yet fail.
 * - cancelled / failed payments are excluded entirely: the backend puts
 *   their stock back (see payment.module), so counting them would
 *   double-count units that are sitting on the shelf again.
 */
export interface SalesTotals {
  orders: number;
  units: number;
  revenue: number;
}

export interface ProductSales {
  unitsPaid: number;
  unitsPending: number;
  revenuePaid: number;
}

export interface SalesReport {
  paid: SalesTotals;
  pending: SalesTotals;
  /** Orders whose stock has been returned — shown for context, never counted as sales. */
  unfulfilled: { cancelled: number; failedPayment: number };
  statusCounts: Record<OrderStatus, number>;
  /** Keyed by product id. Products that never sold are simply absent. */
  byProduct: Record<string, ProductSales>;
  totalOrders: number;
}

const emptyTotals = (): SalesTotals => ({ orders: 0, units: 0, revenue: 0 });

export function buildSalesReport(orders: AdminOrderSummary[]): SalesReport {
  const report: SalesReport = {
    paid: emptyTotals(),
    pending: emptyTotals(),
    unfulfilled: { cancelled: 0, failedPayment: 0 },
    statusCounts: { pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 },
    byProduct: {},
    totalOrders: orders.length,
  };

  for (const order of orders) {
    report.statusCounts[order.status] = (report.statusCounts[order.status] ?? 0) + 1;

    if (order.status === "cancelled") report.unfulfilled.cancelled++;
    if (order.paymentStatus === "failed") report.unfulfilled.failedPayment++;

    // A cancelled order's stock is back on the shelf regardless of what
    // its paymentStatus says, so it contributes to neither bucket.
    if (order.status === "cancelled" || order.paymentStatus === "failed") continue;

    const isPaid = order.paymentStatus === "paid";
    const bucket = isPaid ? report.paid : report.pending;
    bucket.orders++;

    for (const line of order.products) {
      const lineTotal = line.unitPrice * line.quantity;
      bucket.units += line.quantity;
      bucket.revenue += lineTotal;

      const entry = (report.byProduct[line.product] ??= {
        unitsPaid: 0,
        unitsPending: 0,
        revenuePaid: 0,
      });
      if (isPaid) {
        entry.unitsPaid += line.quantity;
        entry.revenuePaid += lineTotal;
      } else {
        entry.unitsPending += line.quantity;
      }
    }
  }

  return report;
}

export interface ProductSalesRow extends ProductSales {
  product: Product;
}

/** Joins the per-product tallies onto products, newest-selling first. Products with no sales come back with zeroes rather than being dropped. */
export function joinProductSales(products: Product[], report: SalesReport): ProductSalesRow[] {
  return products.map((product) => ({
    product,
    unitsPaid: report.byProduct[product.id]?.unitsPaid ?? 0,
    unitsPending: report.byProduct[product.id]?.unitsPending ?? 0,
    revenuePaid: report.byProduct[product.id]?.revenuePaid ?? 0,
  }));
}

/**
 * Walks every page of the admin order list.
 *
 * The API caps a page at 100, so this is N requests for N*100 orders. That
 * is fine at the current scale and is the only way to compute totals
 * without a server-side aggregate — but it is the first thing that should
 * become a `/order/stats` endpoint if the shop ever gets busy.
 */
export async function fetchAllOrders(authHeader: string): Promise<AdminOrderSummary[]> {
  const all: AdminOrderSummary[] = [];
  let page = 1;
  while (true) {
    const res = await listOrders(authHeader, { page, limit: 100 });
    all.push(...res.orders);
    if (page >= res.pagination.pages || res.orders.length === 0) break;
    page++;
  }
  return all;
}
