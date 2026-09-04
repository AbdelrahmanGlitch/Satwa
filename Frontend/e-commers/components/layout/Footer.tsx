import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { LionMark } from "@/components/ui/LionMark";
import { COLLECTION_TYPES, COLLECTION_META } from "@/lib/data/collections";

export function Footer() {
  return (
    <footer className="border-t border-line bg-surface">
      <Container className="grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Link href="/" className="flex items-center gap-2.5">
            <LionMark className="h-9 w-9" />
            <span className="font-display text-xl tracking-[0.3em] text-ivory">
              SATWA
            </span>
          </Link>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-ivory/55">
            Fragrance for the room you walk into. Satwa composes perfumes in
            small batches, organized by season and occasion — not aisles.
          </p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
            Men
          </p>
          <ul className="mt-4 flex flex-col gap-2.5">
            {COLLECTION_TYPES.map((slug) => (
              <li key={slug}>
                <Link
                  href={`/men/${slug}`}
                  className="text-sm text-ivory/60 hover:text-ivory"
                >
                  {COLLECTION_META[slug].title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
            Women
          </p>
          <ul className="mt-4 flex flex-col gap-2.5">
            {COLLECTION_TYPES.map((slug) => (
              <li key={slug}>
                <Link
                  href={`/women/${slug}`}
                  className="text-sm text-ivory/60 hover:text-ivory"
                >
                  {COLLECTION_META[slug].title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
            Satwa
          </p>
          <ul className="mt-4 flex flex-col gap-2.5">
            <li>
              <Link href="/offers" className="text-sm text-ivory/60 hover:text-ivory">
                Offers
              </Link>
            </li>
            <li>
              <Link href="/wishlist" className="text-sm text-ivory/60 hover:text-ivory">
                Wishlist
              </Link>
            </li>
            <li>
              <Link href="/admin/login" className="text-sm text-ivory/60 hover:text-ivory">
                Admin
              </Link>
            </li>
          </ul>
        </div>
      </Container>

      <div className="border-t border-line py-6">
        <Container className="flex flex-col items-center justify-between gap-3 text-xs text-ivory/40 md:flex-row">
          <p>&copy; {new Date().getFullYear()} Satwa. All rights reserved.</p>
          <p>Designed to be worn, not displayed.</p>
        </Container>
      </div>
    </footer>
  );
}
