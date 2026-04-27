'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, Loader2 } from 'lucide-react';

export function OnlineSyncBanner() {
  const [showSync, setShowSync] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleOnline = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setShowSync(true);
    timerRef.current = setTimeout(() => setShowSync(false), 3000);
  }, []);

  useEffect(() => {
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('online', handleOnline);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [handleOnline]);

  return (
    <AnimatePresence>
      {showSync && (
        <motion.div
          initial={{ y: -48, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -48, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-md"
          role="status"
          aria-live="polite"
        >
          <Wifi className="h-4 w-4 shrink-0" />
          <span>Synchronisation en cours...</span>
          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
