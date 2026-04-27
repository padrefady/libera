'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  X,
  Heart,
  Phone,
  Gamepad2,
  BookOpen,
  RefreshCw,
  Check,
  Play,
  Square,
  Trophy,
  Hash,
  Hand,
  Sparkles,
  Gamepad2 as GamepadIcon,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { ENCOURAGEMENT_MESSAGES } from '@/lib/types';

// ===== 4-7-8 Breathing Pattern =====

const BREATHE_IN = 4;
const HOLD = 7;
const BREATHE_OUT = 8;
const TOTAL_CYCLES = 3;

type BreathingPhase = 'in' | 'hold' | 'out' | 'done';

function EmergencyBreathing({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const [cycle, setCycle] = useState(1);
  const [phase, setPhase] = useState<BreathingPhase>('in');
  const [countdown, setCountdown] = useState(BREATHE_IN);
  const [isRunning, setIsRunning] = useState(true);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Move to next phase
          setPhase((p) => {
            if (p === 'in') {
              setCountdown(HOLD);
              return 'hold';
            }
            if (p === 'hold') {
              setCountdown(BREATHE_OUT);
              return 'out';
            }
            // p === 'out' — cycle complete
            setCycle((c) => {
              if (c >= TOTAL_CYCLES) {
                setIsRunning(false);
                setTimeout(onComplete, 500);
                return c;
              }
              setCountdown(BREATHE_IN);
              return c + 1;
            });
            return 'in';
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, onComplete]);

  const phaseConfig = {
    in: {
      text: 'Inspire...',
      instruction: `Respire profondément par le nez (${BREATHE_IN}s)`,
      scale: 'scale-100',
      bgColor: 'from-teal-500 to-emerald-600',
    },
    hold: {
      text: 'Retiens...',
      instruction: `Maintiens ta respiration (${HOLD}s)`,
      scale: 'scale-110',
      bgColor: 'from-emerald-500 to-green-600',
    },
    out: {
      text: 'Expire...',
      instruction: `Souffle lentement par la bouche (${BREATHE_OUT}s)`,
      scale: 'scale-75',
      bgColor: 'from-cyan-500 to-teal-600',
    },
    done: {
      text: 'Bravo !',
      instruction: 'Tu as terminé 3 cycles. Bien joué !',
      scale: 'scale-100',
      bgColor: 'from-emerald-400 to-teal-500',
    },
  };

  const config = phaseConfig[phase];

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Cycle counter */}
      <p className="text-emerald-300/80 text-sm font-medium">
        Cycle {Math.min(cycle, TOTAL_CYCLES)}/{TOTAL_CYCLES}
      </p>

      {/* Animated circle */}
      <div className="relative flex items-center justify-center w-44 h-44">
        {/* Outer glow ring */}
        <motion.div
          className={`absolute inset-0 rounded-full bg-gradient-to-br ${config.bgColor} opacity-20 blur-xl`}
          animate={{
            scale: phase === 'in' ? [1, 1.3] : phase === 'out' ? [1.3, 1] : [1.1, 1.15],
          }}
          transition={{ duration: phase === 'in' ? BREATHE_IN : phase === 'out' ? BREATHE_OUT : HOLD, ease: 'easeInOut' }}
        />

        {/* Main circle */}
        <motion.div
          className={`w-full h-full rounded-full bg-gradient-to-br ${config.bgColor} flex items-center justify-center shadow-2xl`}
          animate={{
            scale: phase === 'in' ? [0.75, 1] : phase === 'out' ? [1, 0.75] : [1, 1.08],
          }}
          transition={{ duration: phase === 'in' ? BREATHE_IN : phase === 'out' ? BREATHE_OUT : HOLD, ease: 'easeInOut' }}
        >
          <div className="text-center text-white">
            <motion.p
              key={phase}
              className="text-xl font-bold drop-shadow-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {config.text}
            </motion.p>
            <p className="text-3xl font-bold mt-1 tabular-nums">{countdown > 0 ? countdown : ''}</p>
          </div>
        </motion.div>
      </div>

      {/* Instruction */}
      <motion.p
        key={phase + '-instruction'}
        className="text-emerald-200/70 text-sm text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {config.instruction}
      </motion.p>
    </div>
  );
}

// ===== Motivational Message Card =====

function MotivationMessage() {
  const [quoteIndex, setQuoteIndex] = useState(
    Math.floor(Math.random() * ENCOURAGEMENT_MESSAGES.length)
  );

  const refresh = () => {
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * ENCOURAGEMENT_MESSAGES.length);
    } while (newIndex === quoteIndex && ENCOURAGEMENT_MESSAGES.length > 1);
    setQuoteIndex(newIndex);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-sm"
    >
      <Card className="bg-white/10 border-white/10 backdrop-blur-sm">
        <CardContent className="p-4 text-center">
          <Heart className="h-6 w-6 text-rose-400 mx-auto mb-2" />
          <p className="text-white/90 text-lg font-medium leading-relaxed">
            {ENCOURAGEMENT_MESSAGES[quoteIndex]}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={refresh}
            className="mt-3 text-emerald-300 hover:bg-white/10 hover:text-emerald-200 gap-1"
          >
            <RefreshCw className="h-3 w-3" />
            Autre message
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ===== Quick Distraction Mini Games (simplified for emergency) =====

function EmergencyDistraction({ onClose }: { onClose: () => void }) {
  const [gameType, setGameType] = useState<'menu' | 'countdown' | 'tap'>('menu');

  // Tap game state
  const [taps, setTaps] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Countdown game state
  const [targetNum, setTargetNum] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [countdownDone, setCountdownDone] = useState(false);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const startTap = () => {
    setTaps(0);
    setStartTime(Date.now());
    setElapsedTime(0);
    setGameType('tap');
    intervalRef.current = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - (startTime || Date.now())) / 1000));
    }, 100);
  };

  const handleTap = () => {
    if (taps + 1 >= 50) {
      setTaps(50);
      if (intervalRef.current) clearInterval(intervalRef.current);
      setElapsedTime(Math.floor((Date.now() - (startTime || Date.now())) / 1000));
    } else {
      setTaps((t) => t + 1);
    }
  };

  const startCountdown = () => {
    setTargetNum(Math.floor(Math.random() * 900) + 100);
    setUserInput('');
    setCountdownDone(false);
    setGameType('countdown');
  };

  const checkCountdown = () => {
    const expected = targetNum.toString().split('').reverse().join('');
    if (userInput === expected) {
      setCountdownDone(true);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-sm"
    >
      <Card className="bg-white/10 border-white/10 backdrop-blur-sm">
        <CardContent className="p-4">
          {gameType === 'menu' && (
            <div className="space-y-3 animate-fade-in">
              <p className="text-white/70 text-sm text-center mb-2">
                Choisis une distraction rapide :
              </p>
              <Button
                variant="outline"
                className="w-full border-white/20 text-white hover:bg-white/10 justify-start gap-2"
                onClick={startTap}
              >
                <Gamepad2 className="h-4 w-4 text-cyan-400" />
                Tape 50 fois vite !
              </Button>
              <Button
                variant="outline"
                className="w-full border-white/20 text-white hover:bg-white/10 justify-start gap-2"
                onClick={startCountdown}
              >
                <Hash className="h-4 w-4 text-violet-400" />
                Compter à rebours
              </Button>
              <Button
                variant="ghost"
                className="w-full text-emerald-300/60 hover:bg-white/5 hover:text-emerald-300"
                onClick={onClose}
              >
                Retour
              </Button>
            </div>
          )}

          {gameType === 'tap' && taps < 50 && (
            <div className="flex flex-col items-center gap-3 animate-fade-in">
              <p className="text-white/70 text-sm">{elapsedTime}s</p>
              <button
                onClick={handleTap}
                className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 text-white font-bold text-2xl shadow-lg shadow-cyan-500/30 active:scale-90 transition-transform"
              >
                {taps}
              </button>
              <p className="text-white/50 text-xs">{taps}/50</p>
              {taps >= 50 && (
                <div className="text-center animate-fade-in">
                  <p className="text-emerald-400 font-bold">🎉 {elapsedTime} secondes !</p>
                </div>
              )}
            </div>
          )}

          {gameType === 'tap' && taps >= 50 && (
            <div className="flex flex-col items-center gap-3 animate-fade-in">
              <Trophy className="h-10 w-10 text-yellow-400" />
              <p className="text-white font-semibold text-lg">
                {elapsedTime} secondes !
              </p>
              <p className="text-emerald-300/70 text-sm text-center">
                Tu as distrait ton cerveau. L&apos;envie va passer !
              </p>
              <Button
                variant="ghost"
                className="text-emerald-300 hover:bg-white/10"
                onClick={onClose}
              >
                Retour
              </Button>
            </div>
          )}

          {gameType === 'countdown' && !countdownDone && (
            <div className="flex flex-col items-center gap-3 animate-fade-in">
              <p className="text-3xl font-bold text-white">{targetNum}</p>
              <p className="text-white/60 text-sm">Écris-le à l&apos;envers :</p>
              <Input
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && checkCountdown()}
                placeholder="..."
                className="text-center text-lg bg-white/10 border-white/20 text-white placeholder:text-white/30 max-w-[150px]"
                autoFocus
              />
              <Button
                size="sm"
                onClick={checkCountdown}
                className="bg-violet-500 hover:bg-violet-600 text-white"
              >
                Vérifier
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-white/40 hover:text-white/70"
                onClick={onClose}
              >
                Retour
              </Button>
            </div>
          )}

          {gameType === 'countdown' && countdownDone && (
            <div className="flex flex-col items-center gap-3 animate-fade-in">
              <Check className="h-10 w-10 text-emerald-400" />
              <p className="text-emerald-400 font-bold">Bravo ! 🎉</p>
              <p className="text-white/60 text-sm text-center">
                Ton cerveau est maintenant concentré sur autre chose !
              </p>
              <Button
                variant="ghost"
                className="text-emerald-300 hover:bg-white/10"
                onClick={onClose}
              >
                Retour
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ===== Emergency Journal =====

function EmergencyJournal({ onClose }: { onClose: () => void }) {
  const [text, setText] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  const saveJournal = async () => {
    if (!text.trim()) return;
    try {
      const today = new Date().toISOString().split('T')[0];
      await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: today,
          mood: 'BAD',
          energyLevel: 2,
          stressLevel: 8,
          notes: `🆘 Urgence: ${text}`,
          cravings: 5,
        }),
      });
      setIsSaved(true);
    } catch (err) {
      console.error('Failed to save journal:', err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-sm"
    >
      <Card className="bg-white/10 border-white/10 backdrop-blur-sm">
        <CardContent className="p-4 space-y-3">
          <BookOpen className="h-6 w-6 text-amber-400" />
          <p className="text-white/80 text-sm font-medium">
            Écris ce que tu ressens en ce moment
          </p>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Je ressens..."
            className="bg-white/10 border-white/20 text-white placeholder:text-white/30 resize-none min-h-[80px]"
          />
          {isSaved ? (
            <div className="text-center animate-fade-in">
              <Check className="h-5 w-5 text-emerald-400 mx-auto mb-1" />
              <p className="text-emerald-400 text-sm">Sauvegardé !</p>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={saveJournal}
                disabled={!text.trim()}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-40"
              >
                Sauvegarder
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onClose}
                className="text-white/50 hover:text-white/80"
              >
                Fermer
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ===== Main Emergency Mode Overlay =====

export default function EmergencyMode() {
  const isEmergencyMode = useAppStore((s) => s.isEmergencyMode);
  const setEmergencyMode = useAppStore((s) => s.setEmergencyMode);

  const [prevEmergency, setPrevEmergency] = useState(isEmergencyMode);
  const [showSection, setShowSection] = useState<
    'breathing' | 'menu' | 'motivation' | 'distraction' | 'journal'
  >('breathing');

  // When emergency mode transitions from false→true, reset section to breathing
  const effectiveSection = isEmergencyMode && !prevEmergency ? 'breathing' : showSection;

  useEffect(() => {
    setPrevEmergency(isEmergencyMode);
  }, [isEmergencyMode]);

  const handleClose = () => {
    setEmergencyMode(false);
    setShowSection('breathing');
  };

  const handleBreathingComplete = useCallback(() => {
    setShowSection('menu');
  }, []);

  // Lock scroll when emergency mode is active
  useEffect(() => {
    if (isEmergencyMode) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isEmergencyMode]);

  return (
    <AnimatePresence>
      {isEmergencyMode && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md safe-bottom"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="w-full max-w-md mx-auto px-4 py-8 flex flex-col items-center gap-8 overflow-y-auto max-h-screen">
            {/* Header */}
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <p className="text-4xl mb-2">🆘</p>
              <h1 className="text-2xl font-bold text-white">
                Envie forte ?
              </h1>
              <p className="text-emerald-300/70 text-sm mt-1">
                Tu n&apos;es pas seul(e). Reste fort(e) !
              </p>
            </motion.div>

            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-white/50 hover:text-white hover:bg-white/10 z-10"
              onClick={handleClose}
            >
              <X className="h-5 w-5" />
            </Button>

            {/* Content area */}
            <div className="w-full flex-1 flex items-center justify-center">
              <AnimatePresence mode="wait">
                {effectiveSection === 'breathing' && (
                  <motion.div
                    key="breathing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-full flex justify-center"
                  >
                    <EmergencyBreathing onComplete={handleBreathingComplete} />
                  </motion.div>
                )}

                {effectiveSection === 'menu' && (
                  <motion.div
                    key="menu"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-full flex flex-col items-center gap-4"
                  >
                    {/* Completed message */}
                    <div className="text-center mb-2 animate-fade-in">
                      <p className="text-emerald-400 font-semibold text-lg">
                        Respiration terminée ! 🌬️
                      </p>
                      <p className="text-white/50 text-sm mt-1">
                        Que veux-tu faire maintenant ?
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="w-full max-w-sm space-y-3">
                      <Button
                        variant="outline"
                        className="w-full h-12 border-white/20 text-white hover:bg-white/10 justify-start gap-3 text-base"
                        onClick={() => setShowSection('motivation')}
                      >
                        <Heart className="h-5 w-5 text-rose-400" />
                        Message motivation
                      </Button>

                      <Button
                        variant="outline"
                        className="w-full h-12 border-white/20 text-white hover:bg-white/10 justify-start gap-3 text-base"
                        onClick={() =>
                          alert('Cette fonctionnalité sera bientôt disponible')
                        }
                      >
                        <Phone className="h-5 w-5 text-blue-400" />
                        Appeler un proche
                      </Button>

                      <Button
                        variant="outline"
                        className="w-full h-12 border-white/20 text-white hover:bg-white/10 justify-start gap-3 text-base"
                        onClick={() => setShowSection('distraction')}
                      >
                        <GamepadIcon className="h-5 w-5 text-cyan-400" />
                        Distraction rapide
                      </Button>

                      <Button
                        variant="outline"
                        className="w-full h-12 border-white/20 text-white hover:bg-white/10 justify-start gap-3 text-base"
                        onClick={() => setShowSection('journal')}
                      >
                        <BookOpen className="h-5 w-5 text-amber-400" />
                        Journal d&apos;urgence
                      </Button>
                    </div>
                  </motion.div>
                )}

                {effectiveSection === 'motivation' && (
                  <motion.div
                    key="motivation"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full flex justify-center"
                  >
                    <MotivationMessage />
                  </motion.div>
                )}

                {effectiveSection === 'distraction' && (
                  <motion.div
                    key="distraction"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full flex justify-center"
                  >
                    <EmergencyDistraction
                      onClose={() => setShowSection('menu')}
                    />
                  </motion.div>
                )}

                {effectiveSection === 'journal' && (
                  <motion.div
                    key="journal"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full flex justify-center"
                  >
                    <EmergencyJournal
                      onClose={() => setShowSection('menu')}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom close button */}
            {effectiveSection === 'menu' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="w-full max-w-sm"
              >
                <Button
                  variant="outline"
                  className="w-full border-white/10 text-white/50 hover:bg-white/5 hover:text-white/70"
                  onClick={handleClose}
                >
                  <X className="h-4 w-4 mr-2" />
                  Fermer
                </Button>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
