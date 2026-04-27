'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Delete } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PinLockScreenProps {
  userPin: string;
  userName: string;
  onSuccess: () => void;
}

export default function PinLockScreen({ userPin, userName, onSuccess }: PinLockScreenProps) {
  const [enteredPin, setEnteredPin] = useState<string[]>([]);
  const [isShaking, setIsShaking] = useState(false);
  const [showError, setShowError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);

  // Handle digit press
  const handleDigit = useCallback((digit: string) => {
    if (enteredPin.length >= 4) return;
    if (isSuccess) return;

    const newPin = [...enteredPin, digit];
    setEnteredPin(newPin);
    setShowError(false);

    // Auto-check when 4 digits entered
    if (newPin.length === 4) {
      const pinStr = newPin.join('');
      if (pinStr === userPin) {
        setIsSuccess(true);
        setTimeout(() => {
          onSuccess();
        }, 1200);
      } else {
        const newFailed = failedAttempts + 1;
        setFailedAttempts(newFailed);
        setIsShaking(true);
        setTimeout(() => {
          setIsShaking(false);
          setEnteredPin([]);
          if (newFailed >= 3) {
            setShowError(true);
          }
        }, 600);
      }
    }
  }, [enteredPin, isSuccess, userPin, onSuccess, failedAttempts]);

  // Handle backspace
  const handleBackspace = useCallback(() => {
    if (isSuccess) return;
    if (enteredPin.length > 0) {
      setEnteredPin(prev => prev.slice(0, -1));
      setShowError(false);
    }
  }, [enteredPin, isSuccess]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDigit, handleBackspace]);

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'backspace'];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-emerald-50/50 dark:to-emerald-950/20 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex w-full max-w-sm flex-col items-center gap-8"
      >
        {/* Lock icon */}
        <motion.div
          animate={isSuccess ? { scale: [1, 1.2, 1] } : isShaking ? { x: [-10, 10, -8, 8, -4, 4, 0] } : {}}
          transition={{ duration: isShaking ? 0.5 : 0.3 }}
        >
          <div className={cn(
            'flex size-20 items-center justify-center rounded-full shadow-lg transition-colors duration-500',
            isSuccess
              ? 'bg-emerald-500 text-white'
              : 'bg-primary/10 text-primary'
          )}>
            {isSuccess ? (
              <motion.svg
                xmlns="http://www.w3.org/2000/svg"
                className="size-10"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.4 }}
              >
                <motion.path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                />
              </motion.svg>
            ) : (
              <Lock className="size-10" />
            )}
          </div>
        </motion.div>

        {/* Title & subtitle */}
        <div className="text-center">
          <h1 className="text-2xl font-bold">
            {isSuccess ? 'Code correct' : 'Entrez votre code'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isSuccess
              ? 'Bienvenue !'
              : userName
                ? `Bonjour, ${userName}`
                : 'Vérification de sécurité'}
          </p>
        </div>

        {/* PIN dots */}
        <div className="flex items-center gap-5">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              animate={isShaking ? { x: [-4, 4, -2, 2, 0] } : {}}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className={cn(
                'flex size-14 items-center justify-center rounded-full border-2 transition-all duration-200',
                enteredPin.length > i
                  ? isSuccess
                    ? 'border-emerald-500 bg-emerald-500'
                    : 'border-primary bg-primary scale-110'
                  : 'border-muted-foreground/20 bg-transparent'
              )}
            >
              <AnimatePresence>
                {enteredPin.length > i && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className={cn(
                      'size-3.5 rounded-full',
                      enteredPin.length > i && isSuccess
                        ? 'bg-white'
                        : 'bg-primary-foreground'
                    )}
                  />
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Error message */}
        <AnimatePresence>
          {showError && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="text-sm font-medium text-destructive"
            >
              Code incorrect — réessayez
            </motion.p>
          )}
        </AnimatePresence>

        {/* Number pad */}
        <div className="grid grid-cols-3 gap-3">
          {digits.map((digit, idx) => {
            if (digit === '') {
              return <div key="empty" className="size-16" />;
            }

            if (digit === 'backspace') {
              return (
                <motion.button
                  key="backspace"
                  whileTap={{ scale: 0.92 }}
                  onClick={handleBackspace}
                  className="flex size-16 items-center justify-center rounded-full transition-colors hover:bg-muted active:bg-muted/80"
                >
                  <Delete className="size-5 text-muted-foreground" />
                </motion.button>
              );
            }

            return (
              <motion.button
                key={digit}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleDigit(digit)}
                disabled={isSuccess}
                className={cn(
                  'flex size-16 items-center justify-center rounded-full text-xl font-medium transition-all',
                  isSuccess
                    ? 'text-emerald-500'
                    : 'text-foreground hover:bg-muted active:bg-muted/80'
                )}
              >
                {digit}
              </motion.button>
            );
          })}
        </div>

        {/* Cancel hint */}
        {!isSuccess && (
          <p className="text-xs text-muted-foreground/60 mt-4">
            Appuie sur les chiffres pour entrer ton code
          </p>
        )}
      </motion.div>
    </div>
  );
}
