import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, CartItem, Game } from './types';

interface AuthState {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      logout: () => set({ user: null }),
    }),
    { name: 'auth-storage' }
  )
);

interface CartState {
  items: CartItem[];
  addItem: (game: Game) => void;
  removeItem: (gameId: number) => void;
  clearCart: () => void;
  total: number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (game) => {
        const items = get().items;
        const existing = items.find((i) => i.id === game.id);
        if (existing) {
          set({
            items: items.map((i) =>
              i.id === game.id ? { ...i, quantity: i.quantity + 1 } : i
            ),
          });
        } else {
          set({ items: [...items, { ...game, quantity: 1 }] });
        }
      },
      removeItem: (gameId) => {
        set({ items: get().items.filter((i) => i.id !== gameId) });
      },
      clearCart: () => set({ items: [] }),
      get total() {
        return get().items.reduce((acc, item) => acc + item.price * item.quantity, 0);
      },
    }),
    { name: 'cart-storage' }
  )
);
