import { apiFetch } from "@/lib/api";

export interface OrderLine {
  productId: string;
  quantity: number;
}

export interface CheckoutResult {
  order: { _id: string; totalAmount: number };
  payment: { sessionToken: string; checkoutUrl: string };
}

/** Creates an order from the given cart lines and opens a fake payment session for it. Requires the caller's own `authHeader` (user-scoped). */
export async function checkout(
  authHeader: string,
  input: { items: OrderLine[]; phone: string; address: string }
): Promise<CheckoutResult> {
  return apiFetch<CheckoutResult>("/order/checkout", {
    method: "POST",
    authHeader,
    body: input,
  });
}

export interface FakePaymentResult {
  order: { _id: string; paymentStatus: "pending" | "paid" | "failed"; status: string };
}

/** Stands in for a real gateway's redirect-back — see backend/src/modules/payment.module. */
export async function confirmFakePayment(sessionToken: string, outcome: "success" | "fail"): Promise<FakePaymentResult> {
  return apiFetch<FakePaymentResult>("/payment/fake/confirm", {
    method: "POST",
    body: { sessionToken, outcome },
  });
}

export type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";
export type PaymentStatus = "pending" | "paid" | "failed";

export interface OrderLineItem {
  // Populated straight from the raw Product document (not the
  // frontend-shaped API response other product endpoints return), so
  // images keep their raw Cloudinary field names here.
  product: { _id: string; name: string; slug: string; images: { secure_url: string; public_id: string }[] } | null;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  _id: string;
  products: OrderLineItem[];
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

export async function getMyOrders(authHeader: string): Promise<Order[]> {
  const res = await apiFetch<{ orders: Order[] }>("/order/mine", { authHeader });
  return res.orders;
}
