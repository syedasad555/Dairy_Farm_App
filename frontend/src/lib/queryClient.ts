import { QueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CACHE_KEYS } from '@/shared/constants';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 2,
      gcTime: 1000 * 60 * 30,
    },
  },
});

export async function cacheData<T>(key: string, data: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(data));
}

export async function getCachedData<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function cacheProducts<T>(data: T): Promise<void> {
  await cacheData(CACHE_KEYS.PRODUCTS, data);
}

export async function cacheOrders<T>(data: T): Promise<void> {
  await cacheData(CACHE_KEYS.ORDERS, data);
}

export async function cacheAddresses<T>(data: T): Promise<void> {
  await cacheData(CACHE_KEYS.ADDRESSES, data);
}

export async function cacheUserProfile<T>(data: T): Promise<void> {
  await cacheData(CACHE_KEYS.USER_PROFILE, data);
}
