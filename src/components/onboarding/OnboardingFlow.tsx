'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Leaf,
  User,
  Heart,
  Flag,
  Loader2,
  Lock,
  ShieldCheck,
  ShieldX,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

import {
  ADDICTION_CONFIGS,
  MOTIVATION_OPTIONS,
  type AddictionType,
  type AddictionLevel,
  type GoalType,
} from '@/lib/types';
import { useAppStore } from '@/lib/store';

// ===== Local State Types =====

interface AddictionSelection {
  type: AddictionType;
  level: AddictionLevel;
  goalType: GoalType;
  dailyQuantity: number;
  targetQuantity: number;
  costPerUnit: number;
}

// ===== Animation Variants =====

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
};

const slideTransition = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 30,
};

// ===== Level & Goal Labels =====

const LEVEL_LABELS: Record<AddictionLevel, { label: string; color: string }> = {
  LIGHT: { label: 'Léger', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  MODERATE: { label: 'Modéré', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  SEVERE: { label: 'Sévère', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
};

const GOAL_LABELS: Record<GoalType, { label: string; icon: string }> = {
  REDUCE: { label: 'Réduire', icon: '📉' },
  STOP: { label: 'Arrêter', icon: '🛑' },
};

// ===== Component =====

export default function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1 state
  const [name, setName] = useState('');
  const [selectedMotivations, setSelectedMotivations] = useState<string[]>([]);

  // Step 2 state
  const [selectedAddictions, setSelectedAddictions] = useState<AddictionSelection[]>([]);

  // Step 3 - PIN state
  const [pinEnabled, setPinEnabled] = useState(false);
  const [pinDigits, setPinDigits] = useState<string[]>(['', '', '', '']);
  const [confirmPinDigits, setConfirmPinDigits] = useState<string[]>(['', '', '', '']);
  const [pinConfirmed, setPinConfirmed] = useState(false);
  const [showConfirmStep, setShowConfirmStep] = useState(false);
  const [pinError, setPinError] = useState(false);

  const { setUser, setAddictions, addAddiction } = useAppStore();

  const totalSteps = 5;

  // PIN input refs
  const pinInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const confirmPinInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus first PIN input when step becomes visible
  useEffect(() => {
    if (currentStep === 3 && pinEnabled && !showConfirmStep && !pinConfirmed) {
      setTimeout(() => {
        pinInputRefs.current[0]?.focus();
      }, 300);
    }
  }, [currentStep, pinEnabled, showConfirmStep, pinConfirmed]);

  useEffect(() => {
    if (currentStep === 3 && pinEnabled && showConfirmStep && !pinConfirmed) {
      setTimeout(() => {
        confirmPinInputRefs.current[0]?.focus();
      }, 300);
    }
  }, [currentStep, pinEnabled, showConfirmStep, pinConfirmed]);

  // ---- Navigation ----

  const goNext = useCallback(() => {
    setDirection(1);
    setCurrentStep((s) => Math.min(s + 1, totalSteps - 1));
  }, []);

  const goPrev = useCallback(() => {
    setDirection(-1);
    setCurrentStep((s) => Math.max(s - 1, 0));
  }, []);

  // ---- Motivation toggle ----

  const toggleMotivation = useCallback((motivation: string) => {
    setSelectedMotivations((prev) =>
      prev.includes(motivation)
        ? prev.filter((m) => m !== motivation)
        : [...prev, motivation]
    );
  }, []);

  // ---- Addiction selection helpers ----

  const toggleAddictionType = useCallback((type: AddictionType) => {
    setSelectedAddictions((prev) => {
      const exists = prev.find((a) => a.type === type);
      if (exists) {
        return prev.filter((a) => a.type !== type);
      }
      const config = ADDICTION_CONFIGS[type];
      return [
        ...prev,
        {
          type,
          level: 'MODERATE' as AddictionLevel,
          goalType: 'REDUCE' as GoalType,
          dailyQuantity: 0,
          targetQuantity: 0,
          costPerUnit: config.defaultCost,
        },
      ];
    });
  }, []);

  const updateAddiction = useCallback(
    (type: AddictionType, field: keyof AddictionSelection, value: number | string) => {
      setSelectedAddictions((prev) =>
        prev.map((a) => (a.type === type ? { ...a, [field]: value } : a))
      );
    },
    []
  );

  // ---- PIN helpers ----

  const handlePinChange = useCallback(
    (index: number, value: string, isConfirm: boolean) => {
      const digit = value.replace(/\D/g, '').slice(-1);
      if (digit === '') {
        // Allow clearing
        if (isConfirm) {
          setConfirmPinDigits((prev) => {
            const next = [...prev];
            next[index] = '';
            return next;
          });
        } else {
          setPinDigits((prev) => {
            const next = [...prev];
            next[index] = '';
            return next;
          });
        }
        return;
      }

      if (isConfirm) {
        setConfirmPinDigits((prev) => {
          const next = [...prev];
          next[index] = digit;
          return next;
        });
        // Move to next input
        if (index < 3) {
          setTimeout(() => confirmPinInputRefs.current[index + 1]?.focus(), 50);
        } else {
          // All 4 digits entered - check match
          const newConfirm = [...confirmPinDigits];
          newConfirm[index] = digit;
          const confirmCode = newConfirm.join('');
          const originalCode = pinDigits.join('');
          if (confirmCode === originalCode) {
            setPinConfirmed(true);
            setPinError(false);
          } else {
            setPinError(true);
            // Reset after a delay
            setTimeout(() => {
              setConfirmPinDigits(['', '', '', '']);
              setPinDigits(['', '', '', '']);
              setShowConfirmStep(false);
              setPinError(false);
              setTimeout(() => pinInputRefs.current[0]?.focus(), 100);
            }, 1200);
          }
        }
      } else {
        setPinDigits((prev) => {
          const next = [...prev];
          next[index] = digit;
          return next;
        });
        // Move to next input
        if (index < 3) {
          setTimeout(() => pinInputRefs.current[index + 1]?.focus(), 50);
        } else {
          // All 4 digits entered - move to confirm step
          setTimeout(() => {
            setShowConfirmStep(true);
          }, 200);
        }
      }
    },
    [pinDigits, confirmPinDigits]
  );

  const handlePinKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>, isConfirm: boolean) => {
      if (e.key === 'Backspace') {
        const currentDigits = isConfirm ? confirmPinDigits : pinDigits;
        if (currentDigits[index] === '' && index > 0) {
          // Move to previous input and clear it
          if (isConfirm) {
            setConfirmPinDigits((prev) => {
              const next = [...prev];
              next[index - 1] = '';
              return next;
            });
            confirmPinInputRefs.current[index - 1]?.focus();
          } else {
            setPinDigits((prev) => {
              const next = [...prev];
              next[index - 1] = '';
              return next;
            });
            pinInputRefs.current[index - 1]?.focus();
          }
        }
      }
    },
    [pinDigits, confirmPinDigits]
  );

  const togglePinEnabled = useCallback(() => {
    if (pinEnabled) {
      // Disable PIN - reset all PIN state
      setPinEnabled(false);
      setPinDigits(['', '', '', '']);
      setConfirmPinDigits(['', '', '', '']);
      setPinConfirmed(false);
      setShowConfirmStep(false);
      setPinError(false);
    } else {
      // Enable PIN
      setPinEnabled(true);
      setPinDigits(['', '', '', '']);
      setConfirmPinDigits(['', '', '', '']);
      setPinConfirmed(false);
      setShowConfirmStep(false);
      setPinError(false);
    }
  }, [pinEnabled]);

  // ---- Submit ----

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const userId = 'user-1';
      const motivationsStr = selectedMotivations.join(',');
      const pin = pinEnabled && pinConfirmed ? pinDigits.join('') : null;

      // 1. POST /api/user
      const userRes = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: userId,
          name: name || 'Utilisateur',
          email: 'utilisateur@libera.app',
          motivations: motivationsStr,
          isOnboarded: true,
          pin,
        }),
      });
      const userData = await userRes.json();

      // 2. POST /api/addictions for each selected addiction
      const createdAddictions: Awaited<ReturnType<typeof userRes.json>>[] = [];
      for (const addiction of selectedAddictions) {
        const config = ADDICTION_CONFIGS[addiction.type];
        const res = await fetch('/api/addictions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            name: config.label,
            type: addiction.type,
            icon: config.icon,
            color: config.color,
            level: addiction.level,
            goalType: addiction.goalType,
            targetQuantity: addiction.goalType === 'STOP' ? 0 : addiction.targetQuantity,
            unit: config.unit,
            costPerUnit: addiction.costPerUnit,
            startQuantity: addiction.dailyQuantity,
          }),
        });
        const data = await res.json();
        createdAddictions.push(data);
      }

      // 3. Update store
      if (userData) {
        setUser({ ...userData, isOnboarded: true });
      }
      setAddictions(createdAddictions);

      // 4. Save onboarding completion to localStorage
      localStorage.setItem('libera_is_onboarded', 'true');

      // 5. Save PIN to localStorage if set
      if (pin) {
        localStorage.setItem('libera_user_pin', pin);
      }

      // 6. Navigate to dashboard
      window.location.href = '/';
    } catch (error) {
      console.error('[Onboarding] Submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [name, selectedMotivations, selectedAddictions, pinEnabled, pinConfirmed, pinDigits, setUser, setAddictions]);

  // ===== Progress Indicator =====

  function ProgressIndicator() {
    return (
      <div className="flex items-center justify-center gap-2 py-4">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === currentStep
                ? 'w-8 bg-emerald-500'
                : i < currentStep
                  ? 'w-4 bg-emerald-300 dark:bg-emerald-700'
                  : 'w-4 bg-muted-foreground/20'
            }`}
          />
        ))}
      </div>
    );
  }

  // ===== Step 0 - Welcome =====

  function WelcomeStep() {
    return (
      <div className="flex flex-col items-center justify-center text-center min-h-[70vh] px-4">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
          className="text-7xl mb-6"
        >
          🌱
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-4xl font-bold text-emerald-600 dark:text-emerald-400 mb-3"
        >
          Libera
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-xl font-medium text-foreground mb-6"
        >
          Reprends le contrôle de ta vie
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-3 max-w-sm mb-10"
        >
          <p className="text-muted-foreground text-sm leading-relaxed">
            Libera est ton compagnon de confiance pour surmonter tes addictions.
            Suis ta progression, défis-toi avec des challenges, et célèbre chaque
            victoire sur le chemin de la liberté.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            {['📊 Suivi quotidien', '🏆 Challenges', '📖 Journal'].map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
              >
                {item}
              </span>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Button
            onClick={goNext}
            size="lg"
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-10 h-12 text-base font-semibold shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30"
          >
            Commencer
            <ChevronRight className="ml-1 size-5" />
          </Button>
        </motion.div>
      </div>
    );
  }

  // ===== Step 1 - Profile =====

  function ProfileStep() {
    return (
      <div className="flex flex-col gap-6 px-4 py-2">
        <div className="text-center mb-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 mb-3">
            <User className="size-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Ton profil</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Dis-nous en plus sur toi pour personnaliser ton expérience
          </p>
        </div>

        <Card className="shadow-md">
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Nom <span className="text-muted-foreground font-normal">(optionnel)</span>
              </Label>
              <Input
                id="name"
                placeholder="Ton prénom..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                value="utilisateur@libera.app"
                readOnly
                className="h-11 bg-muted/50 cursor-not-allowed"
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Heart className="size-4 text-emerald-600 dark:text-emerald-400" />
            <Label className="text-sm font-medium">Tes motivations</Label>
          </div>
          <p className="text-muted-foreground text-xs">
            Choisis ce qui te pousse à changer (un ou plusieurs)
          </p>
          <div className="flex flex-wrap gap-2">
            {MOTIVATION_OPTIONS.map((motivation) => {
              const isSelected = selectedMotivations.includes(motivation);
              return (
                <button
                  key={motivation}
                  type="button"
                  onClick={() => toggleMotivation(motivation)}
                  className={`
                    inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium
                    transition-all duration-200 border-2
                    ${
                      isSelected
                        ? 'bg-emerald-100 border-emerald-500 text-emerald-700 dark:bg-emerald-900/40 dark:border-emerald-400 dark:text-emerald-300 shadow-sm'
                        : 'bg-background border-transparent text-muted-foreground hover:border-emerald-300 hover:text-emerald-600 dark:hover:border-emerald-700 dark:hover:text-emerald-400'
                    }
                  `}
                >
                  {isSelected && <Check className="size-3.5" />}
                  {motivation}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ===== Step 2 - Addictions =====

  function AddictionsStep() {
    const addictionEntries = Object.entries(ADDICTION_CONFIGS) as [AddictionType, typeof ADDICTION_CONFIGS[AddictionType]][];

    return (
      <div className="flex flex-col gap-6 px-4 py-2">
        <div className="text-center mb-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 mb-3">
            <Leaf className="size-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Tes dépendances</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Sélectionne ce que tu souhaites surmonter ou réduire
          </p>
        </div>

        {/* Addiction type grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {addictionEntries.map(([type, config]) => {
            const isSelected = selectedAddictions.some((a) => a.type === type);
            return (
              <button
                key={type}
                type="button"
                onClick={() => toggleAddictionType(type)}
                className={`
                  relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200
                  ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-md'
                      : 'border-transparent bg-card hover:border-muted-foreground/20 shadow-sm'
                  }
                `}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                    <Check className="size-3 text-white" />
                  </div>
                )}
                <span className="text-3xl">{config.icon}</span>
                <span className="text-sm font-medium text-center leading-tight">{config.label}</span>
              </button>
            );
          })}
        </div>

        {/* Configuration for selected addictions */}
        <AnimatePresence>
          {selectedAddictions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4 overflow-hidden"
            >
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="w-6 h-0.5 bg-emerald-500 rounded-full" />
                Configuration
              </h3>
              {selectedAddictions.map((addiction) => {
                const config = ADDICTION_CONFIGS[addiction.type];
                return (
                  <motion.div
                    key={addiction.type}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="overflow-hidden shadow-md">
                      <div
                        className="h-1.5"
                        style={{ backgroundColor: config.color }}
                      />
                      <CardContent className="space-y-4 pt-4">
                        {/* Header */}
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{config.icon}</span>
                          <div>
                            <p className="font-semibold text-sm">{config.label}</p>
                            <p className="text-xs text-muted-foreground">{config.unit}</p>
                          </div>
                        </div>

                        {/* Level selector */}
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-muted-foreground">
                            Niveau de dépendance
                          </Label>
                          <div className="grid grid-cols-3 gap-2">
                            {(Object.entries(LEVEL_LABELS) as [AddictionLevel, typeof LEVEL_LABELS[AddictionLevel]][]).map(
                              ([level, info]) => (
                                <button
                                  key={level}
                                  type="button"
                                  onClick={() =>
                                    updateAddiction(addiction.type, 'level', level)
                                  }
                                  className={`
                                    px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 border
                                    ${
                                      addiction.level === level
                                        ? `${info.color} border-current shadow-sm`
                                        : 'bg-background text-muted-foreground border-transparent hover:bg-muted/50'
                                    }
                                  `}
                                >
                                  {info.label}
                                </button>
                              )
                            )}
                          </div>
                        </div>

                        {/* Goal type selector */}
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-muted-foreground">
                            Objectif
                          </Label>
                          <div className="grid grid-cols-2 gap-2">
                            {(Object.entries(GOAL_LABELS) as [GoalType, typeof GOAL_LABELS[GoalType]][]).map(
                              ([goal, info]) => (
                                <button
                                  key={goal}
                                  type="button"
                                  onClick={() => {
                                    updateAddiction(addiction.type, 'goalType', goal);
                                    if (goal === 'STOP') {
                                      updateAddiction(addiction.type, 'targetQuantity', 0);
                                    }
                                  }}
                                  className={`
                                    flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 border
                                    ${
                                      addiction.goalType === goal
                                        ? 'bg-emerald-100 border-emerald-500 text-emerald-700 dark:bg-emerald-900/40 dark:border-emerald-400 dark:text-emerald-300 shadow-sm'
                                        : 'bg-background text-muted-foreground border-transparent hover:bg-muted/50'
                                    }
                                  `}
                                >
                                  <span>{info.icon}</span>
                                  {info.label}
                                </button>
                              )
                            )}
                          </div>
                        </div>

                        {/* Quantity inputs */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground">
                              Quantité quotidienne
                            </Label>
                            <Input
                              type="number"
                              min={0}
                              placeholder="Ex: 10"
                              value={addiction.dailyQuantity || ''}
                              onChange={(e) =>
                                updateAddiction(
                                  addiction.type,
                                  'dailyQuantity',
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="h-10 text-sm"
                            />
                          </div>
                          {addiction.goalType === 'REDUCE' && (
                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium text-muted-foreground">
                                Objectif (quantité)
                              </Label>
                              <Input
                                type="number"
                                min={0}
                                placeholder="Ex: 5"
                                value={addiction.targetQuantity || ''}
                                onChange={(e) =>
                                  updateAddiction(
                                    addiction.type,
                                    'targetQuantity',
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                className="h-10 text-sm"
                              />
                            </div>
                          )}
                        </div>

                        {/* Cost per unit */}
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium text-muted-foreground">
                            Coût par unité (€)
                          </Label>
                          <Input
                            type="number"
                            min={0}
                            step={0.01}
                            placeholder="0.00"
                            value={addiction.costPerUnit || ''}
                            onChange={(e) =>
                              updateAddiction(
                                addiction.type,
                                'costPerUnit',
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="h-10 text-sm"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ===== Step 3 - PIN Setup =====

  function PinSetupStep() {
    return (
      <div className="flex flex-col gap-6 px-4 py-2">
        <div className="text-center mb-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40 mb-4">
            <Lock className="size-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Sécuriser l&apos;accès</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Protège ton application avec un code PIN à 4 chiffres (optionnel)
          </p>
        </div>

        {/* PIN Toggle */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={togglePinEnabled}
            className={`
              inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold
              transition-all duration-200 border-2 shadow-sm
              ${
                pinEnabled
                  ? 'bg-emerald-100 border-emerald-500 text-emerald-700 dark:bg-emerald-900/40 dark:border-emerald-400 dark:text-emerald-300'
                  : 'bg-card border-muted text-muted-foreground hover:border-emerald-300 hover:text-emerald-600 dark:hover:border-emerald-700 dark:hover:text-emerald-400'
              }
            `}
          >
            <Lock className="size-4" />
            {pinEnabled ? 'Désactiver le code PIN' : 'Activer le code PIN'}
          </button>
        </div>

        {/* PIN Input Area */}
        <AnimatePresence mode="wait">
          {pinEnabled && !pinConfirmed && !pinError && (
            <motion.div
              key={showConfirmStep ? 'confirm' : 'choose'}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center gap-4"
            >
              <p className="text-sm font-medium text-foreground">
                {showConfirmStep ? 'Confirme ton code' : 'Choisis ton code'}
              </p>
              <div className="flex gap-3">
                {(showConfirmStep ? confirmPinDigits : pinDigits).map((digit, index) => (
                  <input
                    key={`${showConfirmStep ? 'confirm' : 'pin'}-${index}`}
                    ref={(el) => {
                      if (showConfirmStep) {
                        confirmPinInputRefs.current[index] = el;
                      } else {
                        pinInputRefs.current[index] = el;
                      }
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handlePinChange(index, e.target.value, showConfirmStep)}
                    onKeyDown={(e) => handlePinKeyDown(index, e, showConfirmStep)}
                    className={`
                      w-14 h-16 text-center text-2xl font-bold rounded-xl border-2
                      transition-all duration-200 outline-none
                      ${
                        digit
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                          : 'border-muted bg-card text-foreground focus:border-emerald-400'
                      }
                    `}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {pinError && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center gap-3"
            >
              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30">
                <ShieldX className="size-7 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                Les codes ne correspondent pas
              </p>
              <p className="text-xs text-muted-foreground">
                Réessaie en choisissant un nouveau code...
              </p>
            </motion.div>
          )}

          {pinConfirmed && (
            <motion.div
              key="confirmed"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center gap-3"
            >
              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <ShieldCheck className="size-7 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                Code défini !
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info text when PIN is disabled */}
        {!pinEnabled && (
          <div className="text-center py-6">
            <p className="text-muted-foreground text-xs leading-relaxed">
              Tu peux activer le code PIN plus tard dans les paramètres.
              <br />
              Cela empêchera les accès non autorisés à tes données.
            </p>
          </div>
        )}
      </div>
    );
  }

  // ===== Step 4 - Summary =====

  function SummaryStep() {
    const isPinSet = pinEnabled && pinConfirmed;

    return (
      <div className="flex flex-col gap-6 px-4 py-2">
        <div className="text-center mb-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 mb-3">
            <Flag className="size-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Récapitulatif</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Vérifie tes informations avant de commencer
          </p>
        </div>

        {/* Profile summary */}
        <Card className="shadow-md">
          <CardContent className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <User className="size-4 text-emerald-600 dark:text-emerald-400" />
              Profil
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nom</span>
                <span className="font-medium">{name || 'Utilisateur'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium">utilisateur@libera.app</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Sécurité</span>
                <span className={`inline-flex items-center gap-1.5 font-medium ${isPinSet ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                  {isPinSet ? (
                    <>
                      <ShieldCheck className="size-4" />
                      Code PIN activé
                    </>
                  ) : (
                    <>
                      <ShieldX className="size-4" />
                      Non sécurisé
                    </>
                  )}
                </span>
              </div>
            </div>
            {selectedMotivations.length > 0 && (
              <div className="pt-2">
                <p className="text-xs text-muted-foreground mb-2">Motivations</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedMotivations.map((m) => (
                    <Badge
                      key={m}
                      className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800"
                    >
                      {m}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Addictions summary */}
        {selectedAddictions.length > 0 && (
          <Card className="shadow-md">
            <CardContent className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Leaf className="size-4 text-emerald-600 dark:text-emerald-400" />
                Dépendances ({selectedAddictions.length})
              </h3>
              <div className="space-y-3">
                {selectedAddictions.map((addiction) => {
                  const config = ADDICTION_CONFIGS[addiction.type];
                  const levelInfo = LEVEL_LABELS[addiction.level];
                  const goalInfo = GOAL_LABELS[addiction.goalType];
                  return (
                    <div
                      key={addiction.type}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0"
                        style={{ backgroundColor: `${config.color}20` }}
                      >
                        {config.icon}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-sm font-semibold">{config.label}</p>
                        <div className="flex flex-wrap gap-1.5">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${levelInfo.color}`}
                          >
                            {levelInfo.label}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                            {goalInfo.icon} {goalInfo.label}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-0.5">
                          <p>
                            {addiction.goalType === 'STOP' ? (
                              <>Objectif : Arrêt complet</>
                            ) : (
                              <>
                                {addiction.dailyQuantity} → {addiction.targetQuantity}{' '}
                                {config.unit}/jour
                              </>
                            )}
                          </p>
                          {addiction.costPerUnit > 0 && (
                            <p>Coût : {addiction.costPerUnit.toFixed(2)} € / {config.unit.replace(/s$/, '')}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {selectedAddictions.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm">
              Tu n&apos;as sélectionné aucune dépendance.
              <br />
              Tu pourras en ajouter plus tard depuis ton tableau de bord.
            </p>
          </div>
        )}
      </div>
    );
  }

  // ===== Navigation Footer =====

  function StepFooter() {
    const isLastStep = currentStep === totalSteps - 1;
    const isFirstStep = currentStep === 0;

    if (isFirstStep) return null;

    return (
      <div className="flex items-center gap-3 px-4 pb-6 pt-4">
        <Button
          variant="outline"
          onClick={goPrev}
          disabled={isSubmitting}
          className="rounded-full h-11 px-6"
        >
          <ChevronLeft className="size-4 mr-1" />
          Précédent
        </Button>

        {isLastStep ? (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-semibold shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" />
                Chargement...
              </>
            ) : (
              <>
                Démarrer mon parcours
                <Check className="size-4 ml-1" />
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={goNext}
            className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-semibold"
          >
            Suivant
            <ChevronRight className="size-4 ml-1" />
          </Button>
        )}
      </div>
    );
  }

  // ===== Main Render =====

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-emerald-50/80 via-background to-background dark:from-emerald-950/20 dark:via-background dark:to-background">
      {/* Progress indicator */}
      {!false && <ProgressIndicator />}

      {/* Step content */}
      <div className="flex-1 overflow-y-auto relative">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={slideTransition}
            className="max-w-lg mx-auto w-full"
          >
            {currentStep === 0 && <WelcomeStep />}
            {currentStep === 1 && <ProfileStep />}
            {currentStep === 2 && <AddictionsStep />}
            {currentStep === 3 && <PinSetupStep />}
            {currentStep === 4 && <SummaryStep />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer navigation */}
      <StepFooter />
    </div>
  );
}
