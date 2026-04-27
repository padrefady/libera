'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { offlineStore } from '@/lib/offline-store';
import { syncQueue } from '@/lib/sync-queue';

export function useAppData() {
  const hydrate = useAppStore((s) => s.hydrate);
  const [isLoading, setIsLoading] = useState(() => {
    // If user already onboarded (localStorage), don't show loading
    return !offlineStore.isOnboarded();
  });

  useEffect(() => {
    hydrate().finally(() => setIsLoading(false));
    const cleanupSync = syncQueue.startAutoSync();
    return () => cleanupSync();
  }, [hydrate]);

  const store = useAppStore();

  return { ...store, isLoading };
}
