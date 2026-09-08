"use client";

import { ORDER_STATUSES } from "@/lib/data/admin-orders";
import type { OrderStatus } from "@/lib/data/orders";
import { cn } from "@/lib/utils";

// Colour carries the same meaning everywhere the status appears: green
// once it's in the customer's hands, accent while it's moving, muted
// before anyone has touched it, danger when it's off the table.
const STATUS_TONE: Record<OrderStatus, string> = {
  pending: "text-ivory/60",
  processing: "text-accent",
  shipped: "text-accent-bright",
  delivered: "text-emerald-400",
  cancelled: "text-danger",
};

export function OrderStatusSelect({
  value,
  onChange,
  disabled,
}: {
  value: OrderStatus;
  onChange: (status: OrderStatus) => void;
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      aria-label="Order status"
      onChange={(e) => onChange(e.target.value as OrderStatus)}
      className={cn(
        "border border-line-strong bg-transparent px-3 py-2 text-xs capitalize focus:border-accent focus:outline-none disabled:cursor-not-allowed disabled:opacity-40",
        STATUS_TONE[value]
      )}
    >
      {ORDER_STATUSES.map((status) => (
        <option key={status} value={status} className="bg-surface capitalize text-ivory">
          {status}
        </option>
      ))}
    </select>
  );
}
