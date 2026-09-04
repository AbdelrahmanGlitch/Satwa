import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ScentVial } from "@/components/ui/ScentVial";
import { COLLECTION_TYPES, COLLECTION_META, getCollectionsByGender } from "@/lib/data/collections";
import type { CollectionType, Gender } from "@/lib/types";

function CollectionTile({
  gender,
  slug,
  coverImage,
}: {
  gender: Gender;
  slug: CollectionType;
  coverImage?: string;
}) {
  const meta = COLLECTION_META[slug];
  return (
    <Link href={`/${gender}/${slug}`} className="group block">
      <div className="relative aspect-[5/4] overflow-hidden border border-line">
        {coverImage ? (
          <img
            src={coverImage}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <ScentVial collection={slug} className="absolute inset-0" />
        )}
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-ink via-ink/10 to-transparent p-6">
          <h3 className="font-display text-2xl">{meta.title}</h3>
          <p className="mt-1 text-xs text-ivory/55">{meta.tagline}</p>
        </div>
      </div>
    </Link>
  );
}

function CollectionTileGrid({ gender, coverImageBySlug }: { gender: Gender; coverImageBySlug: Map<string, string | undefined> }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {COLLECTION_TYPES.map((slug) => (
        <CollectionTile key={slug} gender={gender} slug={slug} coverImage={coverImageBySlug.get(slug)} />
      ))}
    </div>
  );
}

/**
 * When `gender` is provided (gender landing pages), a single 6-tile grid
 * links straight into that gender's collections, each with its real cover
 * image if one's been uploaded.
 *
 * Left unset (homepage use), there's no single gender to link a tile to —
 * Men's and Women's "Summer" are two different Category records that can
 * have two different photos, so one tile can't honestly show "the"
 * Summer photo. Rather than fall back to a decorative graphic for every
 * tile, this renders two full 6-tile grids side by side (For Men / For
 * Women), each tile single-linked with its own real photo.
 */
export async function CollectionGrid({ gender }: { gender?: Gender }) {
  if (gender) {
    const collections = await getCollectionsByGender(gender);
    const coverImageBySlug = new Map(collections.map((c) => [c.slug, c.coverImage]));
    return (
      <section className="border-b border-line py-24">
        <Container>
          <SectionHeading eyebrow="Shop by mood" title="Collections" />
          <div className="mt-12">
            <CollectionTileGrid gender={gender} coverImageBySlug={coverImageBySlug} />
          </div>
        </Container>
      </section>
    );
  }

  const [men, women] = await Promise.all([getCollectionsByGender("men"), getCollectionsByGender("women")]);
  const menCovers = new Map(men.map((c) => [c.slug, c.coverImage]));
  const womenCovers = new Map(women.map((c) => [c.slug, c.coverImage]));

  return (
    <section className="border-b border-line py-24">
      <Container>
        <SectionHeading eyebrow="Shop by mood" title="Collections" />
        <div className="mt-12 flex flex-col gap-16">
          <div>
            <h3 className="text-xs font-medium uppercase tracking-[0.3em] text-ivory/50">For Men</h3>
            <div className="mt-5">
              <CollectionTileGrid gender="men" coverImageBySlug={menCovers} />
            </div>
          </div>
          <div>
            <h3 className="text-xs font-medium uppercase tracking-[0.3em] text-ivory/50">For Women</h3>
            <div className="mt-5">
              <CollectionTileGrid gender="women" coverImageBySlug={womenCovers} />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
