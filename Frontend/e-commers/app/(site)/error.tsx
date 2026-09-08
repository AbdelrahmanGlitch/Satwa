"use client";

import { useEffect } from "react";
import { LionMark } from "@/components/ui/LionMark";
import { Button, ButtonLink } from "@/components/ui/Button";

/**
 * Storefront-wide error boundary. Nearly every page in this route group
 * fetches from the Express/MongoDB API server-side (lib/data/*) — if that
 * API is unreachable (not deployed, cold, down), this replaces Next's
 * generic "This page couldn't load" crash screen with something on-brand,
 * and a "Try again" that just re-renders the segment instead of a full
 * reload.
 */
export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[70vh] flex-1 flex-col items-center justify-center px-6 text-center">
      <LionMark className="h-12 w-12 opacity-70" />
      <p className="mt-6 text-xs font-medium uppercase tracking-[0.4em] text-accent">
        Satwa
      </p>
      <h1 className="mt-4 font-display text-3xl md:text-4xl">
        Something went wrong
      </h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-ivory/55">
        We couldn&apos;t load this page. It&apos;s likely a temporary issue
        on our end — please try again in a moment.
      </p>
      <div className="mt-8 flex flex-col gap-4 sm:flex-row">
        <Button onClick={() => reset()} size="md">
          Try again
        </Button>
        <ButtonLink href="/" variant="outline" size="md">
          Back to home
        </ButtonLink>
      </div>
    </main>
  );
}
