"use client";

import { use, useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { CollectionForm } from "@/components/admin/CollectionForm";
import { getCollectionById } from "@/lib/data/collections";
import type { Collection } from "@/lib/types";

export default function EditCollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  // Fetched directly by id rather than pulled from the admin list store —
  // that store only ever holds one (paginated) page at a time.
  const [collection, setCollection] = useState<Collection | undefined | null>(null);

  useEffect(() => {
    getCollectionById(id).then(setCollection);
  }, [id]);

  if (collection === null) {
    return <p className="text-sm text-ivory/50">Loading…</p>;
  }
  if (!collection) notFound();

  return (
    <div>
      <h1 className="font-display text-3xl">Edit Collection</h1>
      <CollectionForm collection={collection} />
    </div>
  );
}
