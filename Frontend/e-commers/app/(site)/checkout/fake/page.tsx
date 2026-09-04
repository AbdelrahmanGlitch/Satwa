"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, CreditCard } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button, ButtonLink } from "@/components/ui/Button";
import { LionMark } from "@/components/ui/LionMark";
import { confirmFakePayment } from "@/lib/data/orders";
import { ApiError } from "@/lib/api";

/**
 * Stands in for a real payment gateway's hosted checkout page. Nothing
 * here is real — no card processor is ever contacted — it exists purely
 * to demo the order lifecycle end to end. Borrows the well-known
 * "test card number" convention real payment sandboxes (Stripe, etc.) use,
 * so trying it feels like a real gateway's test mode rather than a couple
 * of dev-only buttons. See backend/src/modules/payment.module.
 */
const TEST_CARDS: Record<string, "success" | "fail"> = {
  "4242424242424242": "success",
  "4000000000000002": "fail",
};

const inputClass =
  "border border-line-strong bg-transparent px-4 py-3 text-sm text-ivory placeholder:text-ivory/35 focus:border-accent focus:outline-none";

function formatCardNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

function DemoNotice() {
  return (
    <div className="mb-8 flex items-start gap-3 border border-accent/40 bg-accent/5 p-4 text-left">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
      <div className="text-xs leading-relaxed text-ivory/70">
        <p className="font-medium text-accent">Demo project — not a real store</p>
        <p className="mt-1">
          This is a portfolio demo. Nothing here is a real product and no real payment is ever
          processed — please don&apos;t enter real card details. Use one of these test cards instead:
        </p>
        <ul className="mt-2 space-y-0.5 font-mono text-[11px] text-ivory/60">
          <li>4242 4242 4242 4242 — approved</li>
          <li>4000 0000 0000 0002 — declined</li>
        </ul>
      </div>
    </div>
  );
}

function FakeCheckout() {
  const sessionToken = useSearchParams().get("session");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<"paid" | "failed" | null>(null);

  const formFilled =
    cardNumber.replace(/\s/g, "").length === 16 &&
    /^\d{2}\/\d{2}$/.test(expiry) &&
    cvv.length >= 3 &&
    name.trim().length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!sessionToken) return;

    const outcome = TEST_CARDS[cardNumber.replace(/\s/g, "")];
    if (!outcome) {
      setError("That's not one of the demo test cards above — try 4242 4242 4242 4242 or 4000 0000 0000 0002.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await confirmFakePayment(sessionToken, outcome);
      setResult(res.order.paymentStatus === "paid" ? "paid" : "failed");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!sessionToken) {
    return <p className="text-center text-sm text-ivory/50">Missing payment session.</p>;
  }

  if (result === "paid") {
    return (
      <div className="text-center">
        <h1 className="font-display text-3xl text-accent">Payment confirmed</h1>
        <p className="mt-3 text-sm text-ivory/60">
          Your order is on its way to processing. This was a demo test-card payment — no card was charged.
        </p>
        <ButtonLink href="/" className="mt-8">Continue shopping</ButtonLink>
      </div>
    );
  }

  if (result === "failed") {
    return (
      <div className="text-center">
        <h1 className="font-display text-3xl text-danger">Payment declined</h1>
        <p className="mt-3 text-sm text-ivory/60">
          The order was cancelled and any reserved stock was released.
        </p>
        <ButtonLink href="/cart" className="mt-8">Back to bag</ButtonLink>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <DemoNotice />

      <div className="text-center">
        <LionMark className="mx-auto h-9 w-9" />
        <h1 className="mt-3 font-display text-2xl">Secure Checkout</h1>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-xs uppercase tracking-[0.18em] text-ivory/50">Card number</label>
          <div className="relative">
            <CreditCard className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ivory/35" />
            <input
              inputMode="numeric"
              autoComplete="cc-number"
              placeholder="4242 4242 4242 4242"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              className={`${inputClass} pl-11`}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-[0.18em] text-ivory/50">Expiry</label>
            <input
              inputMode="numeric"
              autoComplete="cc-exp"
              placeholder="MM/YY"
              value={expiry}
              onChange={(e) => setExpiry(formatExpiry(e.target.value))}
              className={inputClass}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-[0.18em] text-ivory/50">CVV</label>
            <input
              inputMode="numeric"
              autoComplete="cc-csc"
              placeholder="123"
              value={cvv}
              onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
              className={inputClass}
              required
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs uppercase tracking-[0.18em] text-ivory/50">Name on card</label>
          <input
            autoComplete="cc-name"
            placeholder="Jane Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            required
          />
        </div>

        {error && <p className="text-xs text-danger">{error}</p>}

        <Button type="submit" disabled={!formFilled || submitting} className="mt-2 w-full">
          {submitting ? "Processing…" : "Pay now"}
        </Button>
      </form>
    </div>
  );
}

export default function FakeCheckoutPage() {
  return (
    <main className="flex-1">
      <Container className="flex min-h-[70vh] items-center justify-center py-16">
        <Suspense fallback={null}>
          <FakeCheckout />
        </Suspense>
      </Container>
    </main>
  );
}
