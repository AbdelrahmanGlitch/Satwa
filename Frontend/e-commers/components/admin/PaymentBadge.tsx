import type { PaymentStatus } from "@/lib/data/orders";
import { cn } from "@/lib/utils";

const TONE: Record<PaymentStatus, string> = {
  paid: "border-emerald-400/40 text-emerald-400",
  pending: "border-line-strong text-ivory/55",
  failed: "border-danger/40 text-danger",
};

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  return (
    <span
      className={cn(
        "inline-block border px-2.5 py-1 text-[10px] uppercase tracking-[0.15em]",
        TONE[status]
      )}
    >
      {status}
    </span>
  );
}
