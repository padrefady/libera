'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff } from 'lucide-react';
import { useConnection } from '@/hooks/use-connection';

export function OfflineBanner() {
  const { isOffline } = useConnection();

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ y: -48, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -48, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-sm font-medium text-amber-950 shadow-md"
          role="alert"
          aria-live="assertive"
        >
          <WifiOff className="h-4 w-4 shrink-0" />
          <span>Mode hors-ligne — Vos données seront synchronisées automatiquement</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
