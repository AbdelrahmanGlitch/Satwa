"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useCatalogStore, type ProductInput } from "@/lib/store/catalog";
import { COLLECTION_TYPES, COLLECTION_META } from "@/lib/data/collections";
import type { CollectionType, Gender, Product, ProductImage } from "@/lib/types";

const inputClass =
  "border border-line-strong bg-transparent px-4 py-3 text-sm text-ivory placeholder:text-ivory/35 focus:border-accent focus:outline-none";
const labelClass = "text-xs uppercase tracking-[0.18em] text-ivory/50";
const MAX_IMAGES = 6;

/** Same form for create and edit — passing `product` prefills every field and existing image, and submit calls updateProduct instead of addProduct. */
export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const addProduct = useCatalogStore((s) => s.addProduct);
  const updateProduct = useCatalogStore((s) => s.updateProduct);
  const isEdit = Boolean(product);

  const [name, setName] = useState(product?.name ?? "");
  const [tagline, setTagline] = useState(product?.tagline ?? "");
  const [gender, setGender] = useState<Gender>(product?.gender ?? "men");
  const [collections, setCollections] = useState<CollectionType[]>(
    (product?.collections.filter((c): c is CollectionType => COLLECTION_TYPES.includes(c as CollectionType))) ?? []
  );
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [compareAtPrice, setCompareAtPrice] = useState(product?.compareAtPrice ? String(product.compareAtPrice) : "");
  const [volumeMl, setVolumeMl] = useState(product ? String(product.volumeMl) : "100");
  const [description, setDescription] = useState(product?.description ?? "");
  const [topNotes, setTopNotes] = useState(product?.notes.top.join(", ") ?? "");
  const [heartNotes, setHeartNotes] = useState(product?.notes.heart.join(", ") ?? "");
  const [baseNotes, setBaseNotes] = useState(product?.notes.base.join(", ") ?? "");
  const [bestSeller, setBestSeller] = useState(product?.bestSeller ?? false);
  const [isNew, setIsNew] = useState(product?.isNew ?? true);
  const [stockQuantity, setStockQuantity] = useState(product ? String(product.stockQuantity) : "10");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Images: existing ones (edit mode) can be individually removed; newly
  // picked files get a local object-URL preview and are only actually
  // uploaded on submit.
  const [existingImages, setExistingImages] = useState<ProductImage[]>(product?.images ?? []);
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Object URLs are only valid for this tab's lifetime — release them
    // when the form unmounts or a file is dropped.
    return () => newPreviews.forEach((url) => URL.revokeObjectURL(url));
  }, [newPreviews]);

  const totalImageCount = existingImages.length + newFiles.length;

  function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    const room = MAX_IMAGES - totalImageCount;
    const accepted = picked.slice(0, Math.max(0, room));
    setNewFiles((prev) => [...prev, ...accepted]);
    setNewPreviews((prev) => [...prev, ...accepted.map((f) => URL.createObjectURL(f))]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeNewFile(index: number) {
    URL.revokeObjectURL(newPreviews[index]);
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
    setNewPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  function removeExistingImage(publicId: string) {
    setExistingImages((prev) => prev.filter((i) => i.publicId !== publicId));
    setRemovedImageIds((prev) => [...prev, publicId]);
  }

  function toggleCollection(type: CollectionType) {
    setCollections((prev) =>
      prev.includes(type) ? prev.filter((c) => c !== type) : [...prev, type]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name || !price || collections.length === 0) {
      setError("Name, price, and at least one collection are required.");
      return;
    }

    const input: ProductInput = {
      name,
      tagline,
      gender,
      collections,
      price: Number(price),
      compareAtPrice: compareAtPrice ? Number(compareAtPrice) : undefined,
      notes: {
        top: topNotes.split(",").map((n) => n.trim()).filter(Boolean),
        heart: heartNotes.split(",").map((n) => n.trim()).filter(Boolean),
        base: baseNotes.split(",").map((n) => n.trim()).filter(Boolean),
      },
      description,
      bestSeller,
      isNew,
      volumeMl: Number(volumeMl) || 100,
      stockQuantity: Number(stockQuantity) || 0,
    };

    setSubmitting(true);
    const result = isEdit && product
      ? await updateProduct(product.id, input, newFiles, removedImageIds)
      : await addProduct(input, newFiles);
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push("/admin/products");
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex max-w-2xl flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Name</label>
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Tagline</label>
          <input
            className={inputClass}
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
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
          <label className={labelClass}>Price (USD)</label>
          <input
            type="number"
            min="0"
            className={inputClass}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Compare-at price</label>
          <input
            type="number"
            min="0"
            className={inputClass}
            value={compareAtPrice}
            onChange={(e) => setCompareAtPrice(e.target.value)}
            placeholder="Optional — for Sale badge"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className={labelClass}>
          Collections — {gender === "men" ? "Men" : "Women"}
        </label>
        <div className="flex flex-wrap gap-2">
          {COLLECTION_TYPES.map((type) => (
            <button
              type="button"
              key={type}
              onClick={() => toggleCollection(type)}
              className={`border px-3 py-2 text-xs uppercase tracking-[0.12em] transition-colors ${
                collections.includes(type)
                  ? "border-accent text-accent"
                  : "border-line-strong text-ivory/60 hover:border-ivory/40"
              }`}
            >
              {COLLECTION_META[type].title}
            </button>
          ))}
        </div>
        <p className="text-xs text-ivory/35">
          Must already exist for {gender === "men" ? "Men" : "Women"} — see the Collections tab.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label className={labelClass}>Description</label>
        <textarea
          className={inputClass}
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Top notes</label>
          <input
            className={inputClass}
            placeholder="Comma separated"
            value={topNotes}
            onChange={(e) => setTopNotes(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Heart notes</label>
          <input
            className={inputClass}
            placeholder="Comma separated"
            value={heartNotes}
            onChange={(e) => setHeartNotes(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Base notes</label>
          <input
            className={inputClass}
            placeholder="Comma separated"
            value={baseNotes}
            onChange={(e) => setBaseNotes(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 sm:w-80">
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Volume (ml)</label>
          <input
            type="number"
            min="0"
            className={inputClass}
            value={volumeMl}
            onChange={(e) => setVolumeMl(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Stock quantity</label>
          <input
            type="number"
            min="0"
            className={inputClass}
            value={stockQuantity}
            onChange={(e) => setStockQuantity(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className={labelClass}>
          Images ({totalImageCount}/{MAX_IMAGES})
        </label>
        <div className="flex flex-wrap gap-3">
          {existingImages.map((img) => (
            <div key={img.publicId} className="group relative h-24 w-24 shrink-0 overflow-hidden border border-line-strong">
              {/* Cloudinary-hosted, arbitrary remote host — plain img avoids configuring next/image remote patterns for one admin screen. */}
              <img src={img.url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeExistingImage(img.publicId)}
                aria-label="Remove image"
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-ink/80 text-ivory opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {newPreviews.map((url, i) => (
            <div key={url} className="group relative h-24 w-24 shrink-0 overflow-hidden border border-accent/50">
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeNewFile(i)}
                aria-label="Remove image"
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-ink/80 text-ivory opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {totalImageCount < MAX_IMAGES && (
            <label className="flex h-24 w-24 shrink-0 cursor-pointer flex-col items-center justify-center border border-dashed border-line-strong text-center text-[11px] text-ivory/45 hover:border-accent hover:text-accent">
              + Add photo
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/jpg,image/webp"
                multiple
                onChange={handleFilesSelected}
                className="hidden"
              />
            </label>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-6 text-sm text-ivory/70">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={bestSeller}
            onChange={(e) => setBestSeller(e.target.checked)}
          />
          Best seller
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isNew}
            onChange={(e) => setIsNew(e.target.checked)}
          />
          New
        </label>
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}

      <Button type="submit" disabled={submitting} className="w-fit">
        {submitting ? "Saving…" : isEdit ? "Save changes" : "Save product"}
      </Button>
    </form>
  );
}
