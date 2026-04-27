'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { format, parseISO, subDays, isToday, isEqual } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Pencil,
  Check,
  X,
  Lock,
  Plus,
  Trophy,
  Flame,
  Moon,
  Sun,
  Bell,
  AlertTriangle,
  Trash2,
  ChevronRight,
  Save,
  Heart,
  Zap,
  Brain,
  UtensilsCrossed,
  Shirt,
  Smartphone,
  Target,
  CalendarDays,
  TrendingUp,
  Wallet,
} from 'lucide-react';

import PinSettings from '@/components/shared/PinSettings';

import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import type {
  BadgeType,
  ChallengeType,
  MoodType,
  Badge,
  Challenge,
  JournalEntry,
} from '@/lib/types';
import { MOOD_EMOJIS } from '@/lib/types';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Badge as BadgeUI } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

// ─── Badge Definitions ────────────────────────────────────────────

const ALL_BADGES: Record<
  BadgeType,
  { icon: string; name: string; description: string }
> = {
  ONE_DAY: { icon: '🌅', name: 'Premier jour', description: 'Un jour sans' },
  THREE_DAYS: { icon: '⭐', name: '3 jours', description: 'Trois jours d\'affilée' },
  SEVEN_DAYS: { icon: '🏅', name: '1 semaine', description: 'Une semaine complète' },
  FOURTEEN_DAYS: { icon: '🎖️', name: '2 semaines', description: 'Deux semaines sans' },
  THIRTY_DAYS: { icon: '👑', name: '1 mois', description: 'Un mois de liberté' },
  SIXTY_DAYS: { icon: '💎', name: '2 mois', description: 'Deux mois incroyables' },
  NINETY_DAYS: { icon: '🏆', name: '3 mois', description: 'Champion ! 90 jours' },
  HALF_REDUCTION: { icon: '📉', name: 'Moitié', description: 'Réduction de 50%' },
  MONEY_SAVED_1000: { icon: '💰', name: 'Économie', description: '1000 FCFA économisés' },
  FIRST_CHALLENGE: { icon: '🎯', name: 'Défieur', description: 'Premier défi relevé' },
  JOURNAL_7_DAYS: { icon: '📓', name: 'Auteur', description: '7 jours de journal' },
  STREAK_7: { icon: '🔥', name: 'En feu', description: 'Série de 7 jours' },
  STREAK_30: { icon: '🌋', name: 'Volcan', description: 'Série de 30 jours' },
};

const BADGE_ORDER: BadgeType[] = [
  'ONE_DAY',
  'THREE_DAYS',
  'SEVEN_DAYS',
  'FOURTEEN_DAYS',
  'THIRTY_DAYS',
  'SIXTY_DAYS',
  'NINETY_DAYS',
  'HALF_REDUCTION',
  'MONEY_SAVED_1000',
  'FIRST_CHALLENGE',
  'JOURNAL_7_DAYS',
  'STREAK_7',
  'STREAK_30',
];

// ─── Challenge Definitions ────────────────────────────────────────

interface ChallengeOption {
  type: ChallengeType;
  title: string;
  description: string;
  icon: string;
  targetDays: number;
  targetReduction?: number;
}

const CHALLENGE_OPTIONS: ChallengeOption[] = [
  {
    type: 'THREE_DAYS_CLEAN',
    title: '3 jours sans',
    description: 'Reste 3 jours complet(e) sans consommation',
    icon: '🚭',
    targetDays: 3,
  },
  {
    type: 'SEVEN_DAYS_CLEAN',
    title: '7 jours sans',
    description: 'Un défi d\'une semaine entière',
    icon: '🌟',
    targetDays: 7,
  },
  {
    type: 'REDUCE_50_PERCENT',
    title: 'Réduire de 50%',
    description: 'Diminue ta consommation de moitié',
    icon: '📉',
    targetDays: 14,
    targetReduction: 50,
  },
  {
    type: 'REDUCE_30_PERCENT',
    title: 'Réduire de 30%',
    description: 'Baisse ta consommation de 30%',
    icon: '📊',
    targetDays: 10,
    targetReduction: 30,
  },
  {
    type: 'EXERCISE_DAILY',
    title: 'Exercice quotidien',
    description: 'Fais de l\'exercice chaque jour pendant 7 jours',
    icon: '💪',
    targetDays: 7,
  },
  {
    type: 'NO_SPENDING',
    title: 'Zéro dépense',
    description: 'Ne dépense rien pour ton addiction pendant 5 jours',
    icon: '💰',
    targetDays: 5,
  },
];

// ─── Mood helpers ─────────────────────────────────────────────────

const MOOD_OPTIONS: MoodType[] = ['GREAT', 'GOOD', 'OKAY', 'BAD', 'TERRIBLE'];

const MOOD_NUMERIC: Record<MoodType, number> = {
  GREAT: 5,
  GOOD: 4,
  OKAY: 3,
  BAD: 2,
  TERRIBLE: 1,
};

// ─── Animation ────────────────────────────────────────────────────

const sectionVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.35, ease: 'easeOut' as const },
  }),
};

// ─── Component ────────────────────────────────────────────────────

export default function ProfileView() {
  const {
    user,
    setUser,
    badges,
    challenges,
    journalEntries,
    stats,
    isEmergencyMode,
    setEmergencyMode,
    setBadges,
    setChallenges,
    setJournalEntries,
  } = useAppStore();

  const { theme, setTheme } = useTheme();

  // ── Local state ──
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);

  // Journal state
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [journalMood, setJournalMood] = useState<MoodType>('OKAY');
  const [journalEnergy, setJournalEnergy] = useState(3);
  const [journalStress, setJournalStress] = useState(3);
  const [journalCravings, setJournalCravings] = useState(0);
  const [journalNotes, setJournalNotes] = useState('');
  const [isSavingJournal, setIsSavingJournal] = useState(false);

  // Challenge dialog
  const [challengeSheetOpen, setChallengeSheetOpen] = useState(false);
  const [isCreatingChallenge, setIsCreatingChallenge] = useState(false);

  // Savings goal
  const [savingsGoal, setSavingsGoal] = useState(5000);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState('5000');

  // Notification toggle
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // PIN sheet
  const [pinSheetOpen, setPinSheetOpen] = useState(false);

  // ── Derived data ──

  // Last 7 days
  const last7Days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = subDays(new Date(), 6 - i);
        return format(d, 'yyyy-MM-dd');
      }),
    []
  );

  const dayLabels = useMemo(
    () =>
      last7Days.map((d) => {
        const date = parseISO(d);
        return isToday(date) ? "Auj." : format(date, 'EEE', { locale: fr });
      }),
    [last7Days]
  );

  // Journal entries indexed by date
  const journalByDate = useMemo(() => {
    const map: Record<string, JournalEntry> = {};
    journalEntries.forEach((e) => {
      map[e.date] = e;
    });
    return map;
  }, [journalEntries]);

  // Mood data for chart (numeric values for recharts)
  const moodChartData = useMemo(
    () =>
      last7Days.map((d, i) => ({
        day: dayLabels[i],
        mood: journalByDate[d] ? MOOD_NUMERIC[journalByDate[d].mood] : null,
      })),
    [last7Days, dayLabels, journalByDate]
  );

  // Earned badge types set
  const earnedBadgeTypes = useMemo(() => {
    const set = new Set<BadgeType>();
    badges.forEach((b) => set.add(b.type));
    return set;
  }, [badges]);

  // Active and completed challenges
  const activeChallenges = useMemo(
    () => challenges.filter((c) => c.status === 'ACTIVE'),
    [challenges]
  );
  const completedChallenges = useMemo(
    () => challenges.filter((c) => c.status === 'COMPLETED'),
    [challenges]
  );

  // ── Effects ──

  // Load selected day's journal data
  useEffect(() => {
    const entry = journalByDate[selectedDate];
    if (entry) {
      setJournalMood(entry.mood);
      setJournalEnergy(entry.energyLevel);
      setJournalStress(entry.stressLevel);
      setJournalCravings(entry.cravings);
      setJournalNotes(entry.notes || '');
    } else {
      setJournalMood('OKAY');
      setJournalEnergy(3);
      setJournalStress(3);
      setJournalCravings(0);
      setJournalNotes('');
    }
  }, [selectedDate, journalByDate]);

  // ── Handlers ──

  const handleStartEditName = useCallback(() => {
    if (user) {
      setEditName(user.name);
      setIsEditingName(true);
    }
  }, [user]);

  const handleSaveName = useCallback(async () => {
    if (!editName.trim() || !user) return;
    setIsSavingName(true);
    try {
      const res = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim() }),
      });
      if (res.ok) {
        const updated = await res.json();
        setUser(updated);
      }
    } catch (err) {
      console.error('Failed to update name:', err);
    } finally {
      setIsSavingName(false);
      setIsEditingName(false);
    }
  }, [editName, user, setUser]);

  const handleSaveJournal = useCallback(async () => {
    setIsSavingJournal(true);
    try {
      const res = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          mood: journalMood,
          energyLevel: journalEnergy,
          stressLevel: journalStress,
          cravings: journalCravings,
          notes: journalNotes,
        }),
      });
      if (res.ok) {
        const entry = await res.json();
        // Update local state
        setJournalEntries([
          ...journalEntries.filter((e) => e.date !== selectedDate),
          entry,
        ]);
      }
    } catch (err) {
      console.error('Failed to save journal:', err);
    } finally {
      setIsSavingJournal(false);
    }
  }, [
    selectedDate,
    journalMood,
    journalEnergy,
    journalStress,
    journalCravings,
    journalNotes,
    journalEntries,
    setJournalEntries,
  ]);

  const handleCreateChallenge = useCallback(
    async (option: ChallengeOption) => {
      setIsCreatingChallenge(true);
      try {
        const res = await fetch('/api/challenges', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: option.type,
            title: option.title,
            description: option.description,
            targetDays: option.targetDays,
            targetReduction: option.targetReduction,
          }),
        });
        if (res.ok) {
          const challenge = await res.json();
          setChallenges([challenge, ...challenges]);
          setChallengeSheetOpen(false);
        }
      } catch (err) {
        console.error('Failed to create challenge:', err);
      } finally {
        setIsCreatingChallenge(false);
      }
    },
    [challenges, setChallenges]
  );

  const handleToggleEmergency = useCallback(async () => {
    const newValue = !isEmergencyMode;
    setEmergencyMode(newValue);
    try {
      await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emergencyModeEnabled: newValue }),
      });
    } catch (err) {
      console.error('Failed to toggle emergency mode:', err);
      setEmergencyMode(!newValue);
    }
  }, [isEmergencyMode, setEmergencyMode]);

  const handleToggleNotifications = useCallback(async () => {
    const newValue = !notificationsEnabled;
    setNotificationsEnabled(newValue);
    try {
      await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dailyReminderEnabled: newValue }),
      });
    } catch (err) {
      console.error('Failed to toggle notifications:', err);
      setNotificationsEnabled(!newValue);
    }
  }, [notificationsEnabled]);

  const handleReminderTimeChange = useCallback(
    async (time: string) => {
      try {
        await fetch('/api/user', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dailyReminderTime: time }),
        });
        if (user) {
          setUser({ ...user, dailyReminderTime: time });
        }
      } catch (err) {
        console.error('Failed to update reminder time:', err);
      }
    },
    [user, setUser]
  );

  const handleDeleteAccount = useCallback(() => {
    // Placeholder — in production this would call an API
    alert('Fonctionnalité non encore implémentée en production.');
  }, []);

  const handleSaveGoal = useCallback(() => {
    const val = parseInt(goalInput);
    if (!isNaN(val) && val > 0) {
      setSavingsGoal(val);
      setIsEditingGoal(false);
    }
  }, [goalInput]);

  const handleSavePin = useCallback(async (pin: string) => {
    try {
      const res = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      if (res.ok) {
        const updated = await res.json();
        setUser(updated);
        setTimeout(() => setPinSheetOpen(false), 1000);
      }
    } catch (err) {
      console.error('Failed to save PIN:', err);
    }
  }, [setUser]);

  const handleRemovePin = useCallback(async () => {
    try {
      const res = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: null }),
      });
      if (res.ok) {
        const updated = await res.json();
        setUser(updated);
        setTimeout(() => setPinSheetOpen(false), 500);
      }
    } catch (err) {
      console.error('Failed to remove PIN:', err);
    }
  }, [setUser]);

  // ── Computed financial data ──
  const moneySaved = stats?.moneySaved ?? 0;
  const moneySpent = stats?.moneySpent ?? 0;
  const mealsCount = Math.floor(moneySaved / 2500);
  const clothesCount = Math.floor(moneySaved / 5000);
  const phonePercent = Math.min(100, Math.round((moneySaved / 150000) * 100));
  const goalProgress = savingsGoal > 0 ? Math.min(100, (moneySaved / savingsGoal) * 100) : 0;

  // Level progress
  const levelPointsForNext = user ? (user.level + 1) * 100 : 100;
  const levelProgress = user ? (user.points % levelPointsForNext) : 0;

  // ── Render ──

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="animate-pulse text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  const selectedEntry = journalByDate[selectedDate];
  const initials = user.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 pb-24 pt-4">
      {/* ═══ Section 1: Profile Header ═══ */}
      <motion.section
        custom={0}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
      >
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent px-6 pt-8 pb-6">
            <div className="flex flex-col items-center gap-4 text-center">
              {/* Avatar */}
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground shadow-lg">
                {user.avatar || initials}
              </div>

              {/* Name */}
              <div className="flex items-center gap-2">
                {isEditingName ? (
                  <div className="flex items-center gap-1.5">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-8 w-40 text-center text-lg font-semibold"
                      maxLength={30}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveName();
                        if (e.key === 'Escape') setIsEditingName(false);
                      }}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={handleSaveName}
                      disabled={isSavingName}
                    >
                      {isSavingName ? (
                        <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      ) : (
                        <Check className="size-4" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => setIsEditingName(false)}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={handleStartEditName}
                    className="group flex items-center gap-1.5"
                  >
                    <h1 className="text-xl font-bold">{user.name}</h1>
                    <Pencil className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </button>
                )}
              </div>

              {/* Level badge */}
              <BadgeUI className="bg-primary/15 text-primary border-primary/20 text-sm px-3 py-0.5">
                Niveau {user.level}
              </BadgeUI>

              {/* Level progress */}
              <div className="w-full max-w-[200px] space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{user.points} points</span>
                  <span>{levelPointsForNext} pts</span>
                </div>
                <Progress
                  value={levelProgress}
                  className="h-2"
                />
              </div>

              {/* Member since */}
              <p className="text-xs text-muted-foreground">
                Membre depuis{' '}
                {format(parseISO(user.createdAt), 'd MMMM yyyy', { locale: fr })}
              </p>
            </div>
          </div>
        </Card>
      </motion.section>

      {/* ═══ Section 2: Badges & Achievements ═══ */}
      <motion.section
        custom={1}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="size-5 text-yellow-500" />
              Badges & Succès
            </CardTitle>
            <CardDescription>
              {badges.length} / {BADGE_ORDER.length} badges obtenus
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {BADGE_ORDER.map((badgeType) => {
                const badgeDef = ALL_BADGES[badgeType];
                const earned = earnedBadgeTypes.has(badgeType);
                const earnedBadge = badges.find((b) => b.type === badgeType);

                return (
                  <div
                    key={badgeType}
                    className={cn(
                      'relative flex flex-col items-center gap-1 rounded-xl border p-3 text-center transition-all',
                      earned
                        ? 'border-primary/20 bg-primary/5'
                        : 'border-border/50 bg-muted/30 opacity-60'
                    )}
                  >
                    <span className={cn('text-2xl', !earned && 'grayscale')}>
                      {badgeDef.icon}
                    </span>
                    {!earned && (
                      <Lock className="absolute top-1.5 right-1.5 size-3 text-muted-foreground" />
                    )}
                    <span className="text-[11px] font-medium leading-tight">
                      {badgeDef.name}
                    </span>
                    <span className="text-[9px] text-muted-foreground leading-tight">
                      {badgeDef.description}
                    </span>
                    {earned && earnedBadge ? (
                      <span className="mt-0.5 text-[8px] text-primary">
                        {format(parseISO(earnedBadge.earnedAt), 'd MMM', { locale: fr })}
                      </span>
                    ) : (
                      <span className="mt-0.5 text-[8px] text-muted-foreground/60">
                        Non débloqué
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* ═══ Section 3: Challenges ═══ */}
      <motion.section
        custom={2}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="size-5 text-orange-500" />
                Défis
              </CardTitle>
              <Sheet open={challengeSheetOpen} onOpenChange={setChallengeSheetOpen}>
                <SheetTrigger asChild>
                  <Button size="sm" className="gap-1.5">
                    <Plus className="size-3.5" />
                    Nouveau défi
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="max-h-[80vh] rounded-t-2xl">
                  <SheetHeader>
                    <SheetTitle>Choisir un défi</SheetTitle>
                    <SheetDescription>
                      Sélectionne un défi pour te motiver dans ton parcours
                    </SheetDescription>
                  </SheetHeader>
                  <div className="flex flex-col gap-3 px-4 pb-8">
                    {CHALLENGE_OPTIONS.map((option) => (
                      <button
                        key={option.type}
                        onClick={() => handleCreateChallenge(option)}
                        disabled={isCreatingChallenge}
                        className="flex items-center gap-4 rounded-xl border p-4 text-left transition-colors hover:bg-accent disabled:opacity-50"
                      >
                        <span className="text-3xl">{option.icon}</span>
                        <div className="flex-1">
                          <p className="font-semibold">{option.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {option.description}
                          </p>
                        </div>
                        <ChevronRight className="size-4 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeChallenges.length === 0 && completedChallenges.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Aucun défi en cours. Commence par en choisir un !
              </p>
            )}

            {/* Active challenges */}
            {activeChallenges.map((challenge) => {
              const progress =
                challenge.targetDays > 0
                  ? Math.min(100, (challenge.progressDays / challenge.targetDays) * 100)
                  : challenge.targetReduction && challenge.targetReduction > 0
                    ? Math.min(
                        100,
                        ((challenge.currentReduction ?? 0) / challenge.targetReduction) * 100
                      )
                    : 0;

              return (
                <div
                  key={challenge.id}
                  className="rounded-xl border p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Flame className="size-4 text-orange-500" />
                      <span className="font-medium text-sm">{challenge.title}</span>
                    </div>
                    <BadgeUI variant="secondary" className="text-xs">
                      En cours
                    </BadgeUI>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {challenge.progressDays} / {challenge.targetDays} jours
                      </span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                </div>
              );
            })}

            {/* Completed challenges */}
            {completedChallenges.length > 0 && (
              <div className="space-y-2 pt-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Terminés
                </p>
                {completedChallenges.map((challenge) => (
                  <div
                    key={challenge.id}
                    className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-950/20"
                  >
                    <div className="flex size-8 items-center justify-center rounded-full bg-green-500 text-white">
                      <Check className="size-4" />
                    </div>
                    <div className="flex-1">
                      <span className="text-sm font-medium">{challenge.title}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {challenge.endDate
                        ? format(parseISO(challenge.endDate), 'd MMM', { locale: fr })
                        : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.section>

      {/* ═══ Section 4: Emotional Journal ═══ */}
      <motion.section
        custom={3}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarDays className="size-5 text-purple-500" />
              Journal Émotionnel
            </CardTitle>
            <CardDescription>
              Suis ton humeur et tes émotions quotidiennement
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* 7-day mood strip */}
            <div className="flex items-center justify-between gap-1">
              {last7Days.map((d, i) => {
                const entry = journalByDate[d];
                const isCurrentDay = d === selectedDate;
                const isTodayDate = isToday(parseISO(d));

                return (
                  <button
                    key={d}
                    onClick={() => setSelectedDate(d)}
                    className={cn(
                      'flex flex-1 flex-col items-center gap-1 rounded-xl py-2 transition-all',
                      isCurrentDay
                        ? 'bg-primary/10 ring-1 ring-primary/30'
                        : 'hover:bg-muted'
                    )}
                  >
                    <span className="text-[10px] font-medium text-muted-foreground">
                      {dayLabels[i]}
                    </span>
                    <span className="text-xl">
                      {entry ? MOOD_EMOJIS[entry.mood].emoji : '—'}
                    </span>
                    {isTodayDate && (
                      <div className="h-1 w-1 rounded-full bg-primary" />
                    )}
                  </button>
                );
              })}
            </div>

            <Separator />

            {/* Selected day editor */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">
                {isToday(parseISO(selectedDate))
                  ? "Aujourd'hui"
                  : format(parseISO(selectedDate), 'EEEE d MMMM', { locale: fr })}
              </h3>

              {/* Mood selector */}
              <div className="space-y-1.5">
                <Label className="text-xs">Comment tu te sens ?</Label>
                <div className="flex items-center justify-between">
                  {MOOD_OPTIONS.map((mood) => (
                    <button
                      key={mood}
                      onClick={() => setJournalMood(mood)}
                      className={cn(
                        'flex size-11 items-center justify-center rounded-full text-xl transition-all',
                        journalMood === mood
                          ? 'scale-125 ring-2 ring-primary ring-offset-2'
                          : 'opacity-60 hover:opacity-100 hover:scale-110'
                      )}
                    >
                      {MOOD_EMOJIS[mood].emoji}
                    </button>
                  ))}
                </div>
                <p className="text-center text-xs text-muted-foreground">
                  {MOOD_EMOJIS[journalMood].label}
                </p>
              </div>

              {/* Energy slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-1.5 text-xs">
                    <Zap className="size-3.5 text-yellow-500" />
                    Énergie
                  </Label>
                  <span className="text-xs font-medium text-muted-foreground">
                    {journalEnergy} / 5
                  </span>
                </div>
                <Slider
                  value={[journalEnergy]}
                  onValueChange={([v]) => setJournalEnergy(v)}
                  min={1}
                  max={5}
                  step={1}
                />
              </div>

              {/* Stress slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-1.5 text-xs">
                    <Brain className="size-3.5 text-red-500" />
                    Stress
                  </Label>
                  <span className="text-xs font-medium text-muted-foreground">
                    {journalStress} / 5
                  </span>
                </div>
                <Slider
                  value={[journalStress]}
                  onValueChange={([v]) => setJournalStress(v)}
                  min={1}
                  max={5}
                  step={1}
                />
              </div>

              {/* Cravings */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-1.5 text-xs">
                    <Heart className="size-3.5 text-pink-500" />
                    Envies (cravings)
                  </Label>
                  <span className="text-xs font-medium text-muted-foreground">
                    {journalCravings}
                  </span>
                </div>
                <Slider
                  value={[journalCravings]}
                  onValueChange={([v]) => setJournalCravings(v)}
                  min={0}
                  max={10}
                  step={1}
                />
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <Label className="text-xs">Notes</Label>
                <Textarea
                  value={journalNotes}
                  onChange={(e) => setJournalNotes(e.target.value)}
                  placeholder="Comment s'est passée ta journée ?"
                  rows={3}
                  className="resize-none text-sm"
                />
              </div>

              {/* Save button */}
              <Button
                onClick={handleSaveJournal}
                disabled={isSavingJournal}
                className="w-full gap-2"
              >
                {isSavingJournal ? (
                  <div className="size-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                ) : (
                  <Save className="size-4" />
                )}
                Sauvegarder
              </Button>
            </div>

            <Separator />

            {/* Weekly mood trend mini chart */}
            <div className="space-y-2">
              <h4 className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <TrendingUp className="size-3.5" />
                Tendance de la semaine
              </h4>
              <div className="flex items-end justify-between gap-2 h-20 px-1">
                {moodChartData.map((d, i) => (
                  <div
                    key={i}
                    className="flex flex-1 flex-col items-center gap-1"
                  >
                    <div className="w-full flex items-end justify-center" style={{ height: '60px' }}>
                      <motion.div
                        className={cn(
                          'w-full max-w-[24px] rounded-t-md',
                          d.mood !== null
                            ? d.mood >= 4
                              ? 'bg-green-400'
                              : d.mood >= 3
                                ? 'bg-yellow-400'
                                : 'bg-red-400'
                            : 'bg-muted'
                        )}
                        initial={{ height: 0 }}
                        animate={{
                          height: d.mood !== null
                            ? `${(d.mood / 5) * 100}%`
                            : '4px',
                        }}
                        transition={{ delay: i * 0.05, duration: 0.4 }}
                        style={{ minHeight: '4px' }}
                      />
                    </div>
                    <span className="text-[9px] text-muted-foreground">{d.day}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* ═══ Section 5: Financial Calculator ═══ */}
      <motion.section
        custom={4}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Wallet className="size-5 text-green-500" />
              Calculateur Financier
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Spent / Saved */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-destructive/5 border border-destructive/10 p-4 text-center">
                <p className="text-xs text-muted-foreground">Dépensé ce mois</p>
                <p className="text-xl font-bold text-destructive">
                  {moneySpent.toLocaleString('fr-FR')} <span className="text-sm font-normal">FCFA</span>
                </p>
              </div>
              <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-center dark:bg-green-950/20 dark:border-green-900">
                <p className="text-xs text-muted-foreground">Économisé</p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">
                  {moneySaved.toLocaleString('fr-FR')} <span className="text-sm font-normal">FCFA</span>
                </p>
              </div>
            </div>

            <Separator />

            {/* What you could buy */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">
                Ce que tu pourrais acheter avec tes économies :
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                  <span className="text-xl">🍽️</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {mealsCount} repas au restaurant
                    </p>
                    <p className="text-xs text-muted-foreground">~2 500 FCFA / repas</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                  <span className="text-xl">👕</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {clothesCount} vêtements
                    </p>
                    <p className="text-xs text-muted-foreground">~5 000 FCFA / vêtement</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                  <span className="text-xl">📱</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {phonePercent}% d&apos;un téléphone
                    </p>
                    <p className="text-xs text-muted-foreground">~150 000 FCFA</p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Savings goal */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Objectif d&apos;épargne</h4>
                {isEditingGoal ? (
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      value={goalInput}
                      onChange={(e) => setGoalInput(e.target.value)}
                      className="h-7 w-28 text-xs"
                      min={100}
                      step={500}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveGoal();
                        if (e.key === 'Escape') setIsEditingGoal(false);
                      }}
                    />
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSaveGoal}>
                      <Check className="size-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setIsEditingGoal(false)}>
                      <X className="size-3.5" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => {
                      setGoalInput(String(savingsGoal));
                      setIsEditingGoal(true);
                    }}
                  >
                    {savingsGoal.toLocaleString('fr-FR')} FCFA
                    <Pencil className="size-3" />
                  </Button>
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{moneySaved.toLocaleString('fr-FR')} FCFA économisés</span>
                  <span>{Math.round(goalProgress)}%</span>
                </div>
                <Progress value={goalProgress} className="h-2.5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* ═══ Section 6: Settings ═══ */}
      <motion.section
        custom={5}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Paramètres</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Dark mode */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                  {theme === 'dark' ? (
                    <Moon className="size-4" />
                  ) : (
                    <Sun className="size-4" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">Mode sombre</p>
                  <p className="text-xs text-muted-foreground">
                    {theme === 'dark' ? 'Activé' : 'Désactivé'}
                  </p>
                </div>
              </div>
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
              />
            </div>

            <Separator />

            {/* Notifications */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                  <Bell className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Notifications</p>
                  <p className="text-xs text-muted-foreground">
                    Rappels quotidiens
                  </p>
                </div>
              </div>
              <Switch
                checked={notificationsEnabled}
                onCheckedChange={handleToggleNotifications}
              />
            </div>

            {/* Reminder time */}
            <AnimatePresence>
              {notificationsEnabled && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center justify-between pl-12">
                    <Label className="text-sm text-muted-foreground">Heure du rappel</Label>
                    <Input
                      type="time"
                      value={user.dailyReminderTime || '09:00'}
                      onChange={(e) => handleReminderTimeChange(e.target.value)}
                      className="h-8 w-28 text-sm"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <Separator />

            {/* Emergency mode */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'flex size-9 items-center justify-center rounded-lg',
                  isEmergencyMode ? 'bg-destructive/10' : 'bg-muted'
                )}>
                  <AlertTriangle className={cn(
                    'size-4',
                    isEmergencyMode ? 'text-destructive' : ''
                  )} />
                </div>
                <div>
                  <p className="text-sm font-medium">Mode urgence</p>
                  <p className="text-xs text-muted-foreground">
                    Accès rapide à l&apos;aide
                  </p>
                </div>
              </div>
              <Switch
                checked={isEmergencyMode}
                onCheckedChange={handleToggleEmergency}
              />
            </div>

            <Separator />

            {/* PIN Lock */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'flex size-9 items-center justify-center rounded-lg',
                  user.pin ? 'bg-emerald-100 dark:bg-emerald-950/30' : 'bg-muted'
                )}>
                  <Lock className={cn(
                    'size-4',
                    user.pin ? 'text-emerald-600 dark:text-emerald-400' : ''
                  )} />
                </div>
                <div>
                  <p className="text-sm font-medium">Verrouillage par code</p>
                  <p className="text-xs text-muted-foreground">
                    {user.pin ? 'Code activé' : 'Non configuré'}
                  </p>
                </div>
              </div>
              <Sheet open={pinSheetOpen} onOpenChange={setPinSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">
                    {user.pin ? 'Modifier' : 'Configurer'}
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="max-h-[85vh] rounded-t-2xl">
                  <SheetHeader>
                    <SheetTitle>Verrouillage par code</SheetTitle>
                    <SheetDescription>
                      Protège ton application avec un code à 4 chiffres (facultatif)
                    </SheetDescription>
                  </SheetHeader>
                  <div className="px-4 pb-8">
                    <PinSettings
                      currentPin={user.pin}
                      onSave={handleSavePin}
                      onRemove={handleRemovePin}
                      userName={user.name}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            <Separator />

            {/* Danger zone */}
            <div className="pt-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <div className="flex size-9 items-center justify-center rounded-lg bg-destructive/10">
                      <Trash2 className="size-4 text-destructive" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium">Supprimer mon compte</p>
                      <p className="text-xs text-muted-foreground">
                        Cette action est irréversible
                      </p>
                    </div>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Es-tu sûr(e) ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action est irréversible. Toutes tes données, badges, défis et journal seront définitivement supprimés.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-destructive text-white hover:bg-destructive/90"
                    >
                      Supprimer définitivement
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </motion.section>
    </div>
  );
}
