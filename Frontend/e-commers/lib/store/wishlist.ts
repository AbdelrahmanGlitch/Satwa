import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAuthStore } from "@/lib/store/auth";
import { apiFetch } from "@/lib/api";

interface WishlistState {
  ids: string[];
  // The product a guest was trying to save when the login modal interrupted
  // them, so it can be saved automatically once they sign in.
  pendingId: string | null;
  has: (productId: string) => boolean;
  toggle: (productId: string) => void;
  resolvePending: () => void;
  // Replaces local ids with whatever the server has for the signed-in
  // user — called right after login so a returning user's wishlist (saved
  // from another device/session) actually shows up.
  hydrateFromServer: () => Promise<void>;
}

interface BackendWishlistProduct { _id: string }

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      ids: [],
      pendingId: null,
      has: (productId) => get().ids.includes(productId),

      toggle: (productId) => {
        const { status, openAuthModal, authHeader } = useAuthStore.getState();
        if (status === "guest") {
          set({ pendingId: productId });
          openAuthModal("login");
          return;
        }
        const wasSaved = get().ids.includes(productId);
        // Optimistic — flip locally first, then reconcile with the server;
        // roll back if the request fails so the UI never lies about state.
        set((state) => ({
          ids: wasSaved ? state.ids.filter((id) => id !== productId) : [...state.ids, productId],
        }));
        const request = wasSaved
          ? apiFetch(`/users/wishlist/${productId}`, { method: "DELETE", authHeader: authHeader! })
          : apiFetch("/users/wishlist", { method: "POST", authHeader: authHeader!, body: { productId } });
        request.catch(() => {
          set((state) => ({
            ids: wasSaved ? [...state.ids, productId] : state.ids.filter((id) => id !== productId),
          }));
        });
      },

      resolvePending: () => {
        const { pendingId, ids } = get();
        if (!pendingId) return;
        set({ pendingId: null, ids: ids.includes(pendingId) ? ids : [...ids, pendingId] });
        const { authHeader } = useAuthStore.getState();
        if (authHeader) {
          apiFetch("/users/wishlist", { method: "POST", authHeader, body: { productId: pendingId } }).catch(() => {});
        }
      },

      hydrateFromServer: async () => {
        const { authHeader } = useAuthStore.getState();
        if (!authHeader) return;
        try {
          const res = await apiFetch<{ wishlist: BackendWishlistProduct[] }>("/users/wishlist", { authHeader });
          set({ ids: res.wishlist.map((p) => p._id) });
        } catch {
          // Keep whatever was persisted locally rather than wiping it on a
          // transient network error.
        }
      },
    }),
    { name: "satwa-wishlist", partialize: (state) => ({ ids: state.ids }) }
  )
);
