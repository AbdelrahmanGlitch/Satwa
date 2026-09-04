"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { useCatalogStore } from "@/lib/store/catalog";
import { Pagination } from "@/components/admin/Pagination";

export default function AdminCollectionsPage() {
  const collections = useCatalogStore((s) => s.collections);
  const pagination = useCatalogStore((s) => s.collectionsPagination);
  const loading = useCatalogStore((s) => s.loading);
  const fetchCollections = useCatalogStore((s) => s.fetchCollections);
  const deleteCollection = useCatalogStore((s) => s.deleteCollection);

  useEffect(() => {
    fetchCollections(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Collections</h1>
        <Link
          href="/admin/collections/new"
          className="border border-accent/50 px-5 py-2.5 text-xs font-medium uppercase tracking-[0.2em] text-accent hover:bg-accent/10"
        >
          + Add collection
        </Link>
      </div>

      {loading && collections.length === 0 ? (
        <p className="mt-8 text-sm text-ivory/50">Loading collections…</p>
      ) : collections.length === 0 ? (
        <p className="mt-8 text-sm text-ivory/50">No collections yet.</p>
      ) : (
        <div className="mt-8 overflow-x-auto border border-line">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-[0.15em] text-ivory/45">
                <th className="px-5 py-3 font-medium">Title</th>
                <th className="px-5 py-3 font-medium">Slug</th>
                <th className="px-5 py-3 font-medium">Gender</th>
                <th className="px-5 py-3 font-medium">Tagline</th>
                <th className="px-5 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {collections.map((collection) => (
                <tr key={collection.id}>
                  <td className="px-5 py-4 font-medium text-ivory">
                    {collection.title}
                  </td>
                  <td className="px-5 py-4 text-ivory/60">{collection.slug}</td>
                  <td className="px-5 py-4 capitalize text-ivory/70">
                    {collection.gender}
                  </td>
                  <td className="px-5 py-4 text-ivory/60">{collection.tagline}</td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/admin/collections/${collection.id}/edit`}
                        aria-label={`Edit ${collection.title}`}
                        className="text-ivory/40 hover:text-accent"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => collection.id && deleteCollection(collection.id)}
                        aria-label={`Delete ${collection.title}`}
                        className="text-ivory/40 hover:text-danger"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination && (
        <Pagination pagination={pagination} onPageChange={fetchCollections} disabled={loading} />
      )}

      <p className="mt-4 text-xs text-ivory/40">
        Summer, Winter, Autumn, Spring, Occasions, and Daily Use are the core
        taxonomy behind the site&apos;s navigation for both Men and Women — they
        appear here twice (once per gender). Anything else you add shows up
        here and in product tagging, but isn&apos;t wired into the mega-menu.
      </p>
    </div>
  );
}
