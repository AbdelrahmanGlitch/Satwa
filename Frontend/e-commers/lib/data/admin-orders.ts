import { apiFetch } from "@/lib/api";
import type { PaginationMeta } from "@/lib/store/catalog";
import type { OrderLineItem, OrderStatus, PaymentStatus } from "@/lib/data/orders";

export const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

/** The customer, as `GET /order/` populates them (name + email only). */
export interface OrderCustomer {
  _id: string;
  name: string;
  email: string;
}

/**
 * A line item as it comes back from the *list* endpoint. `GET /order/`
 * populates only `user` — `products.product` stays a raw ObjectId string,
 * unlike `GET /order/:id`, which populates the whole product document. The
 * two shapes are deliberately separate types so a component can't read
 * `.name` off something that's still just an id.
 */
export interface AdminOrderLine {
  product: string;
  quantity: number;
  unitPrice: number;
  _id: string;
}

interface AdminOrderBase {
  _id: string;
  totalAmount: number;
  phone: string;
  address: string;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  paymentReference?: string;
  paidAt?: string;
  createdAt: string;
}

export interface AdminOrderSummary extends AdminOrderBase {
  user: OrderCustomer | null;
  products: AdminOrderLine[];
}

export interface AdminOrderDetail extends AdminOrderBase {
  user: OrderCustomer | null;
  products: OrderLineItem[];
}

export interface AdminOrdersPage {
  orders: AdminOrderSummary[];
  pagination: PaginationMeta;
}

export async function listOrders(
  authHeader: string,
  options: { status?: OrderStatus | ""; page?: number; limit?: number } = {}
): Promise<AdminOrdersPage> {
  const params = new URLSearchParams();
  if (options.status) params.set("status", options.status);
  params.set("page", String(options.page ?? 1));
  params.set("limit", String(options.limit ?? 25));
  return apiFetch<AdminOrdersPage>(`/order?${params.toString()}`, { authHeader });
}

export async function getOrder(authHeader: string, id: string): Promise<AdminOrderDetail> {
  const res = await apiFetch<{ order: AdminOrderDetail }>(`/order/${id}`, { authHeader });
  return res.order;
}

export async function updateOrderStatus(
  authHeader: string,
  id: string,
  status: OrderStatus
): Promise<AdminOrderDetail> {
  const res = await apiFetch<{ order: AdminOrderDetail }>(`/order/${id}/status`, {
    method: "PATCH",
    authHeader,
    body: { status },
  });
  return res.order;
}
