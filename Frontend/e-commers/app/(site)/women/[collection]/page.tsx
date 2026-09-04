import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CollectionListing } from "@/components/catalog/CollectionListing";
import { COLLECTION_TYPES, COLLECTION_META, isCollectionType } from "@/lib/data/collections";

export function generateStaticParams() {
  return COLLECTION_TYPES.map((collection) => ({ collection }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ collection: string }>;
}): Promise<Metadata> {
  const { collection } = await params;
  if (!isCollectionType(collection)) return {};
  return { title: `Women — ${COLLECTION_META[collection].title} | Satwa` };
}

export default async function WomenCollectionPage({
  params,
}: {
  params: Promise<{ collection: string }>;
}) {
  const { collection } = await params;
  if (!isCollectionType(collection)) notFound();

  return <CollectionListing gender="women" collection={collection} />;
}
