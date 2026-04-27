'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Delete, ShieldCheck, ShieldOff, Pencil, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PinSettingsProps {
  currentPin: string | null;
  onSave: (pin: string) => void;
  onRemove: () => void;
  userName: string;
}

type PinStep = 'idle' | 'create' | 'confirm' | 'verify_current' | 'enter_new' | 'confirm_new';

export default function PinSettings({ currentPin, onSave, onRemove, userName }: PinSettingsProps) {
  const [step, setStep] = useState<PinStep>('idle');
  const [enteredPin, setEnteredPin] = useState<string[]>([]);
  const [firstPin, setFirstPin] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [showError, setShowError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const resetPinEntry = useCallback(() => {
    setEnteredPin([]);
    setShowError(false);
    setIsShaking(false);
  }, []);

  const handleDigit = useCallback((digit: string) => {
    if (enteredPin.length >= 4 || isSuccess) return;

    const newPin = [...enteredPin, digit];
    setEnteredPin(newPin);
    setShowError(false);

    if (newPin.length === 4) {
      const pinStr = newPin.join('');

      if (step === 'create') {
        // First step of creation: store and move to confirm
        setFirstPin(pinStr);
        setTimeout(() => {
          resetPinEntry();
          setStep('confirm');
        }, 400);
      } else if (step === 'confirm') {
        if (pinStr === firstPin) {
          setIsSuccess(true);
          setIsSaving(true);
          onSave(pinStr);
          setTimeout(() => {
            setIsSaving(false);
          }, 1000);
        } else {
          setIsShaking(true);
          setTimeout(() => {
            setIsShaking(false);
            setShowError(true);
            resetPinEntry();
            setStep('create');
            setFirstPin('');
          }, 600);
        }
      } else if (step === 'verify_current') {
        if (pinStr === currentPin) {
          setTimeout(() => {
            resetPinEntry();
            setStep('enter_new');
          }, 300);
        } else {
          setIsShaking(true);
          setTimeout(() => {
            setIsShaking(false);
            setShowError(true);
            resetPinEntry();
          }, 600);
        }
      } else if (step === 'enter_new') {
        setFirstPin(pinStr);
        setTimeout(() => {
          resetPinEntry();
          setStep('confirm_new');
        }, 400);
      } else if (step === 'confirm_new') {
        if (pinStr === firstPin) {
          setIsSuccess(true);
          setIsSaving(true);
          onSave(pinStr);
          setTimeout(() => {
            setIsSaving(false);
          }, 1000);
        } else {
          setIsShaking(true);
          setTimeout(() => {
            setIsShaking(false);
            setShowError(true);
            resetPinEntry();
            setStep('enter_new');
            setFirstPin('');
          }, 600);
        }
      }
    }
  }, [enteredPin, step, firstPin, currentPin, onSave, resetPinEntry, isSuccess]);

  const handleBackspace = useCallback(() => {
    if (isSuccess) return;
    if (enteredPin.length > 0) {
      setEnteredPin(prev => prev.slice(0, -1));
      setShowError(false);
    }
  }, [enteredPin, isSuccess]);

  const handleRemovePin = useCallback(() => {
    setIsSaving(true);
    onRemove();
    setTimeout(() => {
      setIsSaving(false);
      setStep('idle');
      resetPinEntry();
    }, 500);
  }, [onRemove, resetPinEntry]);

  const handleCancel = useCallback(() => {
    setStep('idle');
    resetPinEntry();
    setFirstPin('');
    setIsSuccess(false);
  }, [resetPinEntry]);

  const handleModify = useCallback(() => {
    if (currentPin) {
      setStep('verify_current');
    } else {
      setStep('create');
    }
    resetPinEntry();
    setIsSuccess(false);
  }, [currentPin, resetPinEntry]);

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'backspace'];

  const getStepTitle = () => {
    switch (step) {
      case 'create': return 'Crée ton code';
      case 'confirm': return 'Confirme ton code';
      case 'verify_current': return 'Code actuel';
      case 'enter_new': return 'Nouveau code';
      case 'confirm_new': return 'Confirme le nouveau code';
      default: return '';
    }
  };

  const getStepSubtitle = () => {
    switch (step) {
      case 'create': return 'Choisis un code à 4 chiffres';
      case 'confirm': return 'Entre à nouveau le même code';
      case 'verify_current': return 'Entre ton code actuel';
      case 'enter_new': return 'Choisis ton nouveau code';
      case 'confirm_new': return 'Confirme ton nouveau code';
      default: return '';
    }
  };

  // Idle state: show options
  if (step === 'idle') {
    return (
      <div className="flex flex-col items-center gap-6 py-4">
        {currentPin ? (
          <>
            {/* PIN is set */}
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/30">
                <ShieldCheck className="size-7 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-sm text-muted-foreground">
                Verrouillage activé pour {userName}
              </p>
            </div>

            <div className="flex w-full flex-col gap-3">
              <Button
                onClick={handleModify}
                className="w-full gap-2"
              >
                <Pencil className="size-4" />
                Modifier le code
              </Button>
              <Button
                onClick={handleRemovePin}
                variant="outline"
                className="w-full gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                disabled={isSaving}
              >
                {isSaving ? (
                  <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <ShieldOff className="size-4" />
                )}
                Désactiver le verrouillage
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* No PIN set */}
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                <ShieldOff className="size-7 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Protège ton application avec un code à 4 chiffres
              </p>
            </div>

            <Button
              onClick={handleModify}
              className="w-full gap-2"
            >
              <ShieldCheck className="size-4" />
              Activer le verrouillage
            </Button>
          </>
        )}
      </div>
    );
  }

  // PIN entry state
  return (
    <div className="flex flex-col items-center gap-5 py-2">
      {/* Back button */}
      <div className="w-full">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          className="text-muted-foreground"
          disabled={isSaving || isSuccess}
        >
          Retour
        </Button>
      </div>

      {/* Title */}
      <div className="text-center">
        <h3 className="text-lg font-semibold">{getStepTitle()}</h3>
        <p className="text-sm text-muted-foreground mt-0.5">{getStepSubtitle()}</p>
      </div>

      {/* Success state */}
      {isSuccess ? (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center gap-3 py-4"
        >
          <div className="flex size-16 items-center justify-center rounded-full bg-emerald-500 text-white">
            <Check className="size-8" />
          </div>
          <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
            Code enregistré avec succès !
          </p>
        </motion.div>
      ) : (
        <>
          {/* PIN dots */}
          <motion.div
            animate={isShaking ? { x: [-10, 10, -8, 8, -4, 4, 0] } : {}}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-4"
          >
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(
                  'flex size-12 items-center justify-center rounded-full border-2 transition-all duration-200',
                  enteredPin.length > i
                    ? 'border-primary bg-primary scale-105'
                    : 'border-muted-foreground/20 bg-transparent'
                )}
              >
                <AnimatePresence>
                  {enteredPin.length > i && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className="size-3 rounded-full bg-primary-foreground"
                    />
                  )}
                </AnimatePresence>
              </div>
            ))}
          </motion.div>

          {/* Error message */}
          <AnimatePresence>
            {showError && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-xs font-medium text-destructive"
              >
                {step === 'confirm' || step === 'confirm_new'
                  ? 'Les codes ne correspondent pas — réessaie'
                  : 'Code incorrect — réessaie'}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Number pad */}
          <div className="grid grid-cols-3 gap-2.5">
            {digits.map((digit) => {
              if (digit === '') {
                return <div key="empty" className="size-14" />;
              }

              if (digit === 'backspace') {
                return (
                  <motion.button
                    key="backspace"
                    whileTap={{ scale: 0.92 }}
                    onClick={handleBackspace}
                    className="flex size-14 items-center justify-center rounded-full transition-colors hover:bg-muted active:bg-muted/80"
                  >
                    <Delete className="size-4 text-muted-foreground" />
                  </motion.button>
                );
              }

              return (
                <motion.button
                  key={digit}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleDigit(digit)}
                  className="flex size-14 items-center justify-center rounded-full text-lg font-medium text-foreground transition-colors hover:bg-muted active:bg-muted/80"
                >
                  {digit}
                </motion.button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
