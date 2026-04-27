'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';

export function useAppData() {
  const hydrate = useAppStore((s) => s.hydrate);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    hydrate().finally(() => {
      if (!cancelled) setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [hydrate]);

  const store = useAppStore();

  return { ...store, isLoading };
}
