'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Wind,
  Hash,
  Hand,
  Sparkles,
  Gamepad2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Play,
  Square,
  Check,
  Clock,
  Trophy,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import {
  ACTION_CONFIGS,
  ENCOURAGEMENT_MESSAGES,
  TIPS_BY_ADDICTION,
  type ActionType,
  type AddictionType,
} from '@/lib/types';

// ===== Breathing Exercise =====

const BREATHING_TOTAL_SECONDS = 180; // 3 minutes
const BREATHE_IN_SECONDS = 4;
const BREATHE_OUT_SECONDS = 4;

type BreathingPhase = 'in' | 'hold' | 'out';

function BreathingExercise() {
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(BREATHING_TOTAL_SECONDS);
  const [phase, setPhase] = useState<BreathingPhase>('in');
  const [phaseTime, setPhaseTime] = useState(BREATHE_IN_SECONDS);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = ((BREATHING_TOTAL_SECONDS - timeLeft) / BREATHING_TOTAL_SECONDS) * 100;

  useEffect(() => {
    if (!isActive) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsActive(false);
          return 0;
        }
        return prev - 1;
      });

      setPhaseTime((prev) => {
        if (prev <= 1) {
          setPhase((p) => {
            if (p === 'in') return 'out';
            if (p === 'out') return 'in';
            return 'in';
          });
          return phase === 'in' ? BREATHE_OUT_SECONDS : BREATHE_IN_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, phase]);

  const handleStart = () => {
    setIsActive(true);
    setTimeLeft(BREATHING_TOTAL_SECONDS);
    setPhase('in');
    setPhaseTime(BREATHE_IN_SECONDS);
  };

  const handleStop = () => {
    setIsActive(false);
  };

  const phaseText = phase === 'in' ? 'Inspire...' : 'Expire...';
  const phaseAnimation = phase === 'in' ? 'animate-breathe-in' : 'animate-breathe-out';

  return (
    <Card className="border-emerald-200/50 bg-gradient-to-br from-emerald-50/80 to-teal-50/60 dark:from-emerald-950/40 dark:to-teal-950/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Wind className="h-5 w-5 text-emerald-500" />
          Exercice de Respiration 🌬️
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!isActive && timeLeft === BREATHING_TOTAL_SECONDS && (
          <div className="flex flex-col items-center gap-4 py-6">
            <p className="text-sm text-muted-foreground text-center">
              Prends 3 minutes pour te recentrer. La respiration aide à calmer les envies.
            </p>
            <Button
              onClick={handleStart}
              className="bg-emerald-500 hover:bg-emerald-600 text-white gap-2 px-6"
            >
              <Play className="h-4 w-4" />
              Commencer (3 min)
            </Button>
          </div>
        )}

        {isActive && (
          <div className="flex flex-col items-center gap-6 py-4">
            {/* Animated circle */}
            <div className="relative flex items-center justify-center w-40 h-40">
              <div
                className={`w-full h-full rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-200/50 dark:shadow-emerald-900/30 ${phaseAnimation}`}
                key={phase + '-' + phaseTime}
              />
              <span className="absolute text-white font-semibold text-lg drop-shadow-md">
                {phaseText}
              </span>
            </div>

            {/* Timer */}
            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {formatTime(timeLeft)}
            </div>

            {/* Progress */}
            <div className="w-full max-w-xs">
              <Progress value={progressPercent} className="h-2" />
              <p className="text-xs text-muted-foreground text-center mt-1">
                {Math.round(progressPercent)}% terminé
              </p>
            </div>

            {/* Stop button */}
            <Button
              variant="outline"
              onClick={handleStop}
              className="gap-2 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
            >
              <Square className="h-4 w-4" />
              Arrêter
            </Button>
          </div>
        )}

        {!isActive && timeLeft < BREATHING_TOTAL_SECONDS && (
          <div className="flex flex-col items-center gap-4 py-6 animate-fade-in">
            <div className="text-4xl">🎉</div>
            <p className="text-lg font-medium text-emerald-600 dark:text-emerald-400">
              Exercice terminé !
            </p>
            <p className="text-sm text-muted-foreground text-center">
              Bien joué ! Tu as pris 3 minutes pour toi. Continue comme ça !
            </p>
            <Button
              onClick={handleStart}
              className="bg-emerald-500 hover:bg-emerald-600 text-white gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Recommencer
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ===== Mini Game: Countdown =====

function CountdownGame() {
  const [isActive, setIsActive] = useState(false);
  const [targetNumber, setTargetNumber] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  const startGame = () => {
    const num = Math.floor(Math.random() * 900) + 100;
    setTargetNumber(num);
    setUserInput('');
    setIsComplete(false);
    setIsActive(true);
  };

  const expectedReverse = targetNumber.toString().split('').reverse().join('');

  const checkAnswer = () => {
    if (userInput === expectedReverse) {
      setIsComplete(true);
      setIsActive(false);
    }
  };

  if (!isActive && !isComplete) {
    return (
      <div className="flex flex-col items-center gap-3 p-2">
        <Hash className="h-8 w-8 text-violet-500" />
        <p className="font-semibold text-sm text-center">Compter à rebours</p>
        <p className="text-xs text-muted-foreground text-center">
          Écris un nombre à l&apos;envers
        </p>
        <Button size="sm" onClick={startGame} className="gap-1 text-xs bg-violet-500 hover:bg-violet-600 text-white">
          <Play className="h-3 w-3" />
          Démarrer
        </Button>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="flex flex-col items-center gap-2 p-2 animate-fade-in">
        <Check className="h-8 w-8 text-emerald-500" />
        <p className="font-semibold text-sm text-emerald-600 dark:text-emerald-400">Bravo ! 🎉</p>
        <Button size="sm" onClick={startGame} variant="outline" className="text-xs">
          Rejouer
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 p-2 animate-fade-in">
      <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">{targetNumber}</p>
      <p className="text-xs text-muted-foreground">Écris-le à l&apos;envers :</p>
      <Input
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && checkAnswer()}
        placeholder="..."
        className="text-center text-lg max-w-[120px] h-8"
        autoFocus
      />
      <Button size="sm" onClick={checkAnswer} className="text-xs gap-1 bg-violet-500 hover:bg-violet-600 text-white">
        Vérifier
      </Button>
    </div>
  );
}

// ===== Mini Game: 5-4-3-2-1 Technique =====

const GROUNDING_STEPS = [
  { count: 5, sense: 'choses que tu VOIS 👀', icon: '👁️' },
  { count: 4, sense: 'choses que tu TOUCHES ✋', icon: '🤚' },
  { count: 3, sense: 'sons que tu ENTENDS 👂', icon: '🎵' },
  { count: 2, sense: 'choses que tu SENS (odeur) 👃', icon: '🌸' },
  { count: 1, sense: 'chose que tu GOÛTES 👅', icon: '😋' },
];

function GroundingGame() {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [inputItems, setInputItems] = useState<string[]>([]);
  const [currentItem, setCurrentItem] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  const step = GROUNDING_STEPS[currentStep];

  const startGame = () => {
    setCurrentStep(0);
    setInputItems([]);
    setCurrentItem('');
    setIsComplete(false);
    setIsActive(true);
  };

  const addItem = () => {
    if (currentItem.trim()) {
      const newItems = [...inputItems, currentItem.trim()];
      setInputItems(newItems);
      setCurrentItem('');

      if (newItems.length >= step.count) {
        if (currentStep < GROUNDING_STEPS.length - 1) {
          setTimeout(() => {
            setCurrentStep((s) => s + 1);
            setInputItems([]);
          }, 500);
        } else {
          setIsComplete(true);
          setIsActive(false);
        }
      }
    }
  };

  if (!isActive && !isComplete) {
    return (
      <div className="flex flex-col items-center gap-3 p-2">
        <Hand className="h-8 w-8 text-amber-500" />
        <p className="font-semibold text-sm text-center">5-4-3-2-1 Technique</p>
        <p className="text-xs text-muted-foreground text-center">
          Ancrage sensoriel pour calmer l&apos;esprit
        </p>
        <Button size="sm" onClick={startGame} className="gap-1 text-xs bg-amber-500 hover:bg-amber-600 text-white">
          <Play className="h-3 w-3" />
          Démarrer
        </Button>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="flex flex-col items-center gap-2 p-2 animate-fade-in">
        <Check className="h-8 w-8 text-emerald-500" />
        <p className="font-semibold text-sm text-emerald-600 dark:text-emerald-400">Bien joué ! 🌟</p>
        <p className="text-xs text-muted-foreground text-center">Tu es reconnecté(e) au moment présent.</p>
        <Button size="sm" onClick={startGame} variant="outline" className="text-xs">
          Rejouer
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 p-2 animate-fade-in" key={currentStep}>
      <p className="text-lg">{step.icon}</p>
      <p className="font-semibold text-sm text-amber-600 dark:text-amber-400">
        Nomme {step.count} {step.sense}
      </p>
      <p className="text-xs text-muted-foreground">
        ({inputItems.length}/{step.count})
      </p>
      <Input
        value={currentItem}
        onChange={(e) => setCurrentItem(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && addItem()}
        placeholder={`Élément ${inputItems.length + 1}...`}
        className="text-center text-sm max-w-[160px] h-8"
        autoFocus
      />
      <Button size="sm" onClick={addItem} className="text-xs gap-1 bg-amber-500 hover:bg-amber-600 text-white">
        Ajouter
      </Button>
      {inputItems.length > 0 && (
        <div className="flex flex-wrap gap-1 justify-center">
          {inputItems.map((item, i) => (
            <span key={i} className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">
              {item}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ===== Mini Game: Positive Words =====

const POSITIVE_WORDS = [
  'Courage ✨', 'Force 💪', 'Paix 🕊️', 'Amour ❤️', 'Joie 😊',
  'Sérénité 🌿', 'Confiance ⭐', 'Espoir 🌈', 'Gratitude 🙏',
  'Résilience 🌳', 'Calme 🌊', 'Bonheur ☀️', 'Liberté 🦋',
  'Détermination 🔥', 'Sagesse 🦉', 'Persévérance 🏔️',
  'Compassion 🤗', 'Créativité 🎨', 'Harmonie 🎵', 'Puissance ⚡',
];

function PositiveWordsGame() {
  const [isActive, setIsActive] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const startGame = () => {
    const shuffled = [...POSITIVE_WORDS].sort(() => Math.random() - 0.5);
    setCurrentIndex(0);
    setIsComplete(false);
    setIsActive(true);
    // Reveal words one by one
    for (let i = 0; i < Math.min(5, shuffled.length); i++) {
      setTimeout(() => {
        setCurrentIndex(i);
      }, i * 2000);
    }
    setTimeout(() => {
      setIsComplete(true);
      setIsActive(false);
    }, Math.min(5, shuffled.length) * 2000);
  };

  if (!isActive && !isComplete) {
    return (
      <div className="flex flex-col items-center gap-3 p-2">
        <Sparkles className="h-8 w-8 text-pink-500" />
        <p className="font-semibold text-sm text-center">Mots positifs</p>
        <p className="text-xs text-muted-foreground text-center">
          Laisse des mots motivants t&apos;inspirer
        </p>
        <Button size="sm" onClick={startGame} className="gap-1 text-xs bg-pink-500 hover:bg-pink-600 text-white">
          <Play className="h-3 w-3" />
          Démarrer
        </Button>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="flex flex-col items-center gap-2 p-2 animate-fade-in">
        <Sparkles className="h-8 w-8 text-pink-500" />
        <p className="font-semibold text-sm text-pink-600 dark:text-pink-400">Inspire-toi ! 💕</p>
        <Button size="sm" onClick={startGame} variant="outline" className="text-xs">
          Nouveaux mots
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 p-4 min-h-[100px] animate-fade-in" key={currentIndex}>
      <motion.p
        className="text-xl font-bold text-pink-600 dark:text-pink-400 text-center"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {POSITIVE_WORDS[currentIndex % POSITIVE_WORDS.length]}
      </motion.p>
    </div>
  );
}

// ===== Mini Game: Tap Counter =====

function TapGame() {
  const [isActive, setIsActive] = useState(false);
  const [taps, setTaps] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isActive && startTime && !isComplete) {
      intervalRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 100);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, startTime, isComplete]);

  const startGame = () => {
    setTaps(0);
    setStartTime(Date.now());
    setElapsedTime(0);
    setIsComplete(false);
    setIsActive(true);
  };

  const handleTap = () => {
    if (taps + 1 >= 50) {
      setTaps(50);
      setIsComplete(true);
      setIsActive(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
    } else {
      setTaps((t) => t + 1);
    }
  };

  if (!isActive && !isComplete) {
    return (
      <div className="flex flex-col items-center gap-3 p-2">
        <Gamepad2 className="h-8 w-8 text-cyan-500" />
        <p className="font-semibold text-sm text-center">Mini-jeu</p>
        <p className="text-xs text-muted-foreground text-center">
          Tape 50 fois le plus vite possible !
        </p>
        <Button size="sm" onClick={startGame} className="gap-1 text-xs bg-cyan-500 hover:bg-cyan-600 text-white">
          <Play className="h-3 w-3" />
          Démarrer
        </Button>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="flex flex-col items-center gap-2 p-2 animate-fade-in">
        <Trophy className="h-8 w-8 text-yellow-500" />
        <p className="font-semibold text-sm text-yellow-600 dark:text-yellow-400">
          {elapsedTime} secondes ! ⚡
        </p>
        <p className="text-xs text-muted-foreground text-center">
          Tu as distrait ton cerveau pendant {elapsedTime}s !
        </p>
        <Button size="sm" onClick={startGame} variant="outline" className="text-xs">
          Rejouer
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 p-2 animate-fade-in">
      <p className="text-xs text-muted-foreground">{elapsedTime}s</p>
      <button
        onClick={handleTap}
        className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 text-white font-bold text-xl shadow-lg shadow-cyan-200/50 dark:shadow-cyan-900/30 active:scale-95 transition-transform"
      >
        {taps}
      </button>
      <p className="text-xs text-muted-foreground">{taps}/50</p>
    </div>
  );
}

// ===== Quick Distractions Section =====

function QuickDistractions() {
  const distractions = [
    {
      key: 'countdown',
      bg: 'from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/20',
      border: 'border-violet-200/50',
      component: CountdownGame,
    },
    {
      key: 'grounding',
      bg: 'from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20',
      border: 'border-amber-200/50',
      component: GroundingGame,
    },
    {
      key: 'positive',
      bg: 'from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/20',
      border: 'border-pink-200/50',
      component: PositiveWordsGame,
    },
    {
      key: 'tap',
      bg: 'from-cyan-50 to-sky-50 dark:from-cyan-950/30 dark:to-sky-950/20',
      border: 'border-cyan-200/50',
      component: TapGame,
    },
  ];

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <Gamepad2 className="h-5 w-5 text-primary" />
        Distractions rapides
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {distractions.map((d) => {
          const Component = d.component;
          return (
            <Card key={d.key} className={`${d.border} bg-gradient-to-br ${d.bg}`}>
              <CardContent className="p-3 flex items-center justify-center min-h-[160px]">
                <Component />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

// ===== Daily Actions Section =====

function DailyActions() {
  const { addictions, dailyActions } = useAppStore();
  const [activeTimer, setActiveTimer] = useState<string | null>(null);
  const [timers, setTimers] = useState<Record<string, number>>({});
  const timerRef = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  const actionTypes = Object.keys(ACTION_CONFIGS) as ActionType[];

  const toggleAction = async (actionType: ActionType) => {
    const today = new Date().toISOString().split('T')[0];
    const existing = dailyActions.find(
      (a) => a.actionType === actionType && a.date === today
    );

    try {
      if (existing) {
        // Toggle completion
        await fetch(`/api/actions/${existing.id}`, { method: 'PUT' });
      } else {
        // Create new action
        await fetch('/api/actions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: today,
            actionType,
            completed: true,
            duration: timers[actionType] || 0,
          }),
        });
      }
      // Re-fetch actions
      const res = await fetch('/api/actions');
      const updated = await res.json();
      const { setDailyActions } = useAppStore.getState();
      setDailyActions(Array.isArray(updated) ? updated : []);
    } catch (err) {
      console.error('Failed to toggle action:', err);
    }
  };

  const startTimer = (actionType: string) => {
    if (activeTimer === actionType) {
      // Stop timer
      if (timerRef.current[actionType]) {
        clearInterval(timerRef.current[actionType]);
      }
      setActiveTimer(null);
      return;
    }

    // Stop any existing timer
    if (activeTimer && timerRef.current[activeTimer]) {
      clearInterval(timerRef.current[activeTimer]);
    }

    setActiveTimer(actionType);
    setTimers((prev) => ({ ...prev, [actionType]: prev[actionType] || 0 }));

    timerRef.current[actionType] = setInterval(() => {
      setTimers((prev) => ({
        ...prev,
        [actionType]: (prev[actionType] || 0) + 1,
      }));
    }, 1000);
  };

  const formatSeconds = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <Clock className="h-5 w-5 text-primary" />
        Actions du jour
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {actionTypes.map((type) => {
          const config = ACTION_CONFIGS[type];
          const isCompleted = dailyActions.some(
            (a) => a.actionType === type && a.date === today && a.completed
          );
          const isTimerActive = activeTimer === type;

          return (
            <Card key={type} className="relative overflow-hidden">
              <CardContent className="p-4">
                <div className="text-2xl mb-2">{config.icon}</div>
                <p className="font-medium text-sm mb-2">{config.label}</p>

                {isTimerActive && (
                  <p className="text-xs font-mono text-emerald-600 dark:text-emerald-400 mb-2">
                    {formatSeconds(timers[type] || 0)}
                  </p>
                )}

                {isCompleted ? (
                  <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <Check className="h-4 w-4" />
                    <span className="text-xs font-medium">Fait !</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7"
                      onClick={() => startTimer(type)}
                    >
                      {isTimerActive ? (
                        <>
                          <Square className="h-3 w-3 mr-1" />
                          Arrêter
                        </>
                      ) : (
                        <>
                          <Play className="h-3 w-3 mr-1" />
                          Démarrer
                        </>
                      )}
                    </Button>
                    {activeTimer === type && (timers[type] || 0) > 0 && (
                      <Button
                        size="sm"
                        className="text-xs h-7 bg-emerald-500 hover:bg-emerald-600 text-white"
                        onClick={() => {
                          if (timerRef.current[type]) clearInterval(timerRef.current[type]);
                          setActiveTimer(null);
                          toggleAction(type);
                        }}
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Valider
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

// ===== Personalized Tips Section =====

function PersonalizedTips() {
  const { addictions } = useAppStore();
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Gather tips from all user addictions
  const userTips = addictions.flatMap((a) =>
    (TIPS_BY_ADDICTION[a.type as AddictionType] || []).map((tip) => ({
      tip,
      addictionName: a.name,
      addictionIcon: a.icon,
      color: a.color,
    }))
  );

  // If no addictions, show general tips
  const allTips =
    userTips.length > 0
      ? userTips
      : TIPS_BY_ADDICTION.OTHER.map((tip) => ({
          tip,
          addictionName: 'Général',
          addictionIcon: '💡',
          color: '#22c55e',
        }));

  const scroll = (direction: 'left' | 'right') => {
    const newIndex =
      direction === 'left'
        ? Math.max(0, currentTipIndex - 1)
        : Math.min(allTips.length - 1, currentTipIndex + 1);
    setCurrentTipIndex(newIndex);

    const container = scrollRef.current;
    if (container) {
      const cardWidth = 300;
      container.scrollTo({ left: newIndex * cardWidth, behavior: 'smooth' });
    }
  };

  if (allTips.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500" />
          Conseils personnalisés
        </h2>
        <div className="flex gap-1">
          <Button
            size="icon"
            variant="outline"
            className="h-7 w-7"
            onClick={() => scroll('left')}
            disabled={currentTipIndex === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="h-7 w-7"
            onClick={() => scroll('right')}
            disabled={currentTipIndex >= allTips.length - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 scrollbar-none"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {allTips.map((item, i) => (
          <Card
            key={i}
            className="min-w-[280px] max-w-[300px] shrink-0 snap-start border-emerald-200/30"
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{item.addictionIcon}</span>
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    {item.addictionName}
                  </p>
                  <p className="text-sm leading-relaxed">{item.tip}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

// ===== Motivational Quotes Section =====

function MotivationalQuotes() {
  const [quoteIndex, setQuoteIndex] = useState(0);

  const refreshQuote = () => {
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * ENCOURAGEMENT_MESSAGES.length);
    } while (newIndex === quoteIndex && ENCOURAGEMENT_MESSAGES.length > 1);
    setQuoteIndex(newIndex);
  };

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-yellow-500" />
        Citation motivante
      </h2>
      <Card className="relative overflow-hidden border-emerald-200/30 bg-gradient-to-br from-emerald-50/60 via-teal-50/40 to-cyan-50/30 dark:from-emerald-950/20 dark:via-teal-950/15 dark:to-cyan-950/10">
        <CardContent className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={quoteIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              <p className="text-xl sm:text-2xl font-semibold text-emerald-700 dark:text-emerald-300 leading-relaxed">
                &ldquo;{ENCOURAGEMENT_MESSAGES[quoteIndex]}&rdquo;
              </p>
            </motion.div>
          </AnimatePresence>
          <div className="flex justify-center mt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshQuote}
              className="gap-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
            >
              <RefreshCw className="h-4 w-4" />
              Nouvelle citation
            </Button>
          </div>
        </CardContent>
        {/* Decorative background elements */}
        <div className="absolute top-2 right-2 text-6xl opacity-5 pointer-events-none">✨</div>
        <div className="absolute bottom-2 left-2 text-4xl opacity-5 pointer-events-none">🌟</div>
      </Card>
    </section>
  );
}

// ===== Main Coaching View =====

export default function CoachingView() {
  return (
    <div className="space-y-6 pb-8">
      {/* Section 1 - Breathing Exercise */}
      <BreathingExercise />

      {/* Section 2 - Quick Distractions */}
      <QuickDistractions />

      {/* Section 3 - Daily Actions */}
      <DailyActions />

      {/* Section 4 - Personalized Tips */}
      <PersonalizedTips />

      {/* Section 5 - Motivational Quotes */}
      <MotivationalQuotes />
    </div>
  );
}
