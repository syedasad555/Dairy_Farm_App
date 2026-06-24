import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CartItem, UserProfile } from '@/shared/types';
import { CACHE_KEYS } from '@/shared/constants';

// ─── Cart Store ────────────────────────────────────────────────────────────
interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  updateQuantity: (productId: string, variantName: string, quantity: number) => void;
  removeItem: (productId: string, variantName: string) => void;
  clearCart: () => void;
  totalAmount: () => number;
  totalItems: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const existing = get().items.find(
          (i) => i.productId === item.productId && i.variantName === item.variantName
        );
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.productId === item.productId && i.variantName === item.variantName
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            ),
          });
        } else {
          set({ items: [...get().items, item] });
        }
      },
      updateQuantity: (productId, variantName, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId, variantName);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.productId === productId && i.variantName === variantName ? { ...i, quantity } : i
          ),
        });
      },
      removeItem: (productId, variantName) => {
        set({
          items: get().items.filter(
            (i) => !(i.productId === productId && i.variantName === variantName)
          ),
        });
      },
      clearCart: () => set({ items: [] }),
      totalAmount: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    {
      name: CACHE_KEYS.CART,
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// ─── Auth Store ────────────────────────────────────────────────────────────
interface AuthState {
  profile: UserProfile | null;
  isLoading: boolean;
  setProfile: (profile: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  profile: null,
  isLoading: true,
  setProfile: (profile) => set({ profile }),
  setLoading: (isLoading) => set({ isLoading }),
}));

// ─── Offline Queue Store ───────────────────────────────────────────────────
interface OfflineQueueItem {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

interface OfflineState {
  queue: OfflineQueueItem[];
  isOnline: boolean;
  setOnline: (online: boolean) => void;
  enqueue: (type: string, payload: Record<string, unknown>) => void;
  dequeue: (id: string) => void;
  clearQueue: () => void;
}

export const useOfflineStore = create<OfflineState>()(
  persist(
    (set, get) => ({
      queue: [],
      isOnline: true,
      setOnline: (isOnline) => set({ isOnline }),
      enqueue: (type, payload) => {
        set({
          queue: [
            ...get().queue,
            { id: `${Date.now()}`, type, payload, createdAt: new Date().toISOString() },
          ],
        });
      },
      dequeue: (id) => set({ queue: get().queue.filter((q) => q.id !== id) }),
      clearQueue: () => set({ queue: [] }),
    }),
    {
      name: CACHE_KEYS.OFFLINE_QUEUE,
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// ─── Theme Store (Dark Mode) ───────────────────────────────────────────────
interface ThemeState {
  dark: boolean;
  toggleDark: () => void;
  setDark: (dark: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      dark: false,
      toggleDark: () => set((s) => ({ dark: !s.dark })),
      setDark: (dark) => set({ dark }),
    }),
    {
      name: '@mvr/theme',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// ─── Notification Badge Store ──────────────────────────────────────────────
interface NotificationState {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  increment: () => void;
  reset: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: count }),
  increment: () => set((s) => ({ unreadCount: s.unreadCount + 1 })),
  reset: () => set({ unreadCount: 0 }),
}));
