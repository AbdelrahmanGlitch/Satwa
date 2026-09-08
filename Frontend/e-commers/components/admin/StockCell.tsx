"use client";

import { useState } from "react";
import { Check, Pencil, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Read-only until clicked, so the table stays scannable and a stray
 * keystroke can't silently rewrite a stock level. Saving is explicit
 * (tick, or Enter); Escape abandons the edit.
 */
export function StockCell({
  value,
  onSave,
}: {
  value: number;
  onSave: (next: number) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  // `draft` only exists while editing, so it's seeded when the edit opens
  // rather than kept in sync with `value` by an effect — which means a
  // concurrent purchase updating `value` can never fight the input.
  function beginEdit() {
    setDraft(String(value));
    setEditing(true);
  }

  const parsed = Number(draft);
  const valid = draft.trim() !== "" && Number.isInteger(parsed) && parsed >= 0;

  async function commit() {
    if (!valid || saving) return;
    if (parsed === value) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSave(parsed);
      setEditing(false);
    } catch {
      // The page surfaces the message; keep the row in edit mode so the
      // admin can see what happened and retry.
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    setEditing(false);
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={beginEdit}
        className="group flex items-center gap-2"
        aria-label={`Edit stock, currently ${value}`}
      >
        <span className={cn("tabular-nums", value === 0 ? "text-danger" : value <= 5 ? "text-accent" : "text-ivory/85")}>
          {value}
        </span>
        <Pencil className="h-3.5 w-3.5 text-ivory/25 group-hover:text-accent" />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="number"
        min={0}
        step={1}
        autoFocus
        value={draft}
        disabled={saving}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") cancel();
        }}
        aria-label="New stock quantity"
        aria-invalid={!valid}
        className={cn(
          "w-20 border bg-transparent px-2 py-1.5 text-sm tabular-nums text-ivory focus:outline-none",
          valid ? "border-line-strong focus:border-accent" : "border-danger"
        )}
      />
      <button
        type="button"
        onClick={commit}
        disabled={!valid || saving}
        aria-label="Save stock"
        className="p-1 text-ivory/50 hover:text-accent disabled:cursor-not-allowed disabled:opacity-30"
      >
        <Check className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={cancel}
        disabled={saving}
        aria-label="Cancel"
        className="p-1 text-ivory/40 hover:text-danger disabled:opacity-30"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
