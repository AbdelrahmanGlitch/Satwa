import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartLine {
  productId: string;
  quantity: number;
}

interface CartState {
  lines: CartLine[];
  add: (productId: string, quantity?: number) => void;
  remove: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      add: (productId, quantity = 1) =>
        set((state) => {
          const existing = state.lines.find((l) => l.productId === productId);
          if (existing) {
            return {
              lines: state.lines.map((l) =>
                l.productId === productId
                  ? { ...l, quantity: l.quantity + quantity }
                  : l
              ),
            };
          }
          return { lines: [...state.lines, { productId, quantity }] };
        }),
      remove: (productId) =>
        set((state) => ({
          lines: state.lines.filter((l) => l.productId !== productId),
        })),
      setQuantity: (productId, quantity) =>
        set((state) => ({
          lines:
            quantity <= 0
              ? state.lines.filter((l) => l.productId !== productId)
              : state.lines.map((l) =>
                  l.productId === productId ? { ...l, quantity } : l
                ),
        })),
      clear: () => set({ lines: [] }),
    }),
    { name: "satwa-cart" }
  )
);
