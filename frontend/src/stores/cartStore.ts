'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * A cart line. Originals are unique pieces → quantity is always 1, so the cart
 * is a set of artworks. A cart is scoped to a SINGLE artist (the backend
 * enforces this too); the cart UI blocks mixing artists at checkout.
 */
export interface CartItem {
  artworkId: string;
  title: string;
  image?: string;
  price: number;
  kind: 'original' | 'print';
  artistId: string;
  artistUsername: string;
}

interface CartState {
  items: CartItem[];
  add: (item: CartItem) => void;
  remove: (artworkId: string) => void;
  clear: () => void;
  has: (artworkId: string) => boolean;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item) =>
        set((s) =>
          s.items.some((i) => i.artworkId === item.artworkId)
            ? s
            : { items: [...s.items, item] },
        ),
      remove: (artworkId) =>
        set((s) => ({ items: s.items.filter((i) => i.artworkId !== artworkId) })),
      clear: () => set({ items: [] }),
      has: (artworkId) => get().items.some((i) => i.artworkId === artworkId),
    }),
    { name: 'kalacube-cart' },
  ),
);

/** All items belong to one artist? (empty cart counts as OK.) */
export function cartIsSingleArtist(items: CartItem[]): boolean {
  if (items.length <= 1) return true;
  const first = items[0].artistId;
  return items.every((i) => i.artistId === first);
}
