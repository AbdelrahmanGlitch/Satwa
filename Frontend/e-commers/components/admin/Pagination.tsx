"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PaginationMeta } from "@/lib/store/catalog";

export function Pagination({
  pagination,
  onPageChange,
  disabled,
}: {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}) {
  if (pagination.pages <= 1) return null;

  return (
    <div className="mt-6 flex items-center justify-between text-sm text-ivory/60">
      <p>
        Page {pagination.page} of {pagination.pages} — {pagination.total} total
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(pagination.page - 1)}
          disabled={disabled || pagination.page <= 1}
          aria-label="Previous page"
          className="flex h-9 w-9 items-center justify-center border border-line-strong text-ivory/70 hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-line-strong disabled:hover:text-ivory/70"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(pagination.page + 1)}
          disabled={disabled || pagination.page >= pagination.pages}
          aria-label="Next page"
          className="flex h-9 w-9 items-center justify-center border border-line-strong text-ivory/70 hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-line-strong disabled:hover:text-ivory/70"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
