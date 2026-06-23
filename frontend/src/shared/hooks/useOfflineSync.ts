import { useEffect, useState } from 'react';
import * as Network from 'expo-network';
import { useOfflineStore } from '@/stores';

export function useOfflineSync() {
  const { isOnline, setOnline, queue, dequeue } = useOfflineStore();
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const checkNetwork = async () => {
      const state = await Network.getNetworkStateAsync();
      setOnline(state.isConnected ?? false);
    };

    checkNetwork();
    const interval = setInterval(checkNetwork, 10000);
    return () => clearInterval(interval);
  }, [setOnline]);

  useEffect(() => {
    if (!isOnline || queue.length === 0 || checking) return;

    const syncQueue = async () => {
      setChecking(true);
      for (const item of queue) {
        try {
          dequeue(item.id);
        } catch {
          break;
        }
      }
      setChecking(false);
    };

    syncQueue();
  }, [isOnline, queue, dequeue, checking]);

  return { isOnline, queueLength: queue.length };
}
