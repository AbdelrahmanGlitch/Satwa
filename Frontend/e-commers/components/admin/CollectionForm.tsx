"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useCatalogStore } from "@/lib/store/catalog";
import type { Collection, Gender } from "@/lib/types";

const inputClass =
  "border border-line-strong bg-transparent px-4 py-3 text-sm text-ivory placeholder:text-ivory/35 focus:border-accent focus:outline-none";
const labelClass = "text-xs uppercase tracking-[0.18em] text-ivory/50";

/** Same form for create and edit — passing `collection` prefills every field and the current cover image; submit calls updateCollection instead of addCollection. */
export function CollectionForm({ collection }: { collection?: Collection }) {
  const router = useRouter();
  const addCollection = useCatalogStore((s) => s.addCollection);
  const updateCollection = useCatalogStore((s) => s.updateCollection);
  const isEdit = Boolean(collection);

  const [title, setTitle] = useState(collection?.title ?? "");
  const [gender, setGender] = useState<Gender>(collection?.gender ?? "men");
  const [tagline, setTagline] = useState(collection?.tagline ?? "");
  const [description, setDescription] = useState(collection?.description ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [existingCover, setExistingCover] = useState(collection?.coverImage);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [newPreview, setNewPreview] = useState<string | null>(null);

  useEffect(() => {
    return () => { if (newPreview) URL.revokeObjectURL(newPreview); };
  }, [newPreview]);

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (newPreview) URL.revokeObjectURL(newPreview);
    setNewFile(file);
    setNewPreview(URL.createObjectURL(file));
    setExistingCover(undefined);
  }

  function removeCover() {
    if (newPreview) URL.revokeObjectURL(newPreview);
    setNewFile(null);
    setNewPreview(null);
    setExistingCover(undefined);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title || !description) {
      setError("Give the collection a title and description.");
      return;
    }

    setSubmitting(true);
    const input = { title, gender, tagline, description };
    const result = isEdit && collection
      ? await updateCollection(collection.id!, input, newFile)
      : await addCollection(input, newFile);
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push("/admin/collections");
  }

  const previewUrl = newPreview ?? existingCover;

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex max-w-lg flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label className={labelClass}>Title</label>
        <input
          className={inputClass}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Ramadan Edition"
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className={labelClass}>Gender</label>
        <select
          className={inputClass}
          value={gender}
          onChange={(e) => setGender(e.target.value as Gender)}
        >
          <option value="men">Men</option>
          <option value="women">Women</option>
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label className={labelClass}>Tagline</label>
        <input
          className={inputClass}
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className={labelClass}>Description</label>
        <textarea
          className={inputClass}
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className={labelClass}>Cover image</label>
        <div className="flex gap-3">
          {previewUrl ? (
            <div className="group relative h-24 w-24 shrink-0 overflow-hidden border border-line-strong">
              <img src={previewUrl} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={removeCover}
                aria-label="Remove cover image"
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-ink/80 text-ivory opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <label className="flex h-24 w-24 shrink-0 cursor-pointer flex-col items-center justify-center border border-dashed border-line-strong text-center text-[11px] text-ivory/45 hover:border-accent hover:text-accent">
              + Add photo
              <input
                type="file"
                accept="image/jpeg,image/png,image/jpg,image/webp"
                onChange={handleFileSelected}
                className="hidden"
              />
            </label>
          )}
        </div>
        <p className="text-xs text-ivory/35">Optional.</p>
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}

      <Button type="submit" disabled={submitting} className="w-fit">
        {submitting ? "Saving…" : isEdit ? "Save changes" : "Save collection"}
      </Button>
    </form>
  );
}
