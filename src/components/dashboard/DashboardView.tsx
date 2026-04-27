'use client';

import { useMemo, useState, useCallback } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Flame,
  TrendingDown,
  PiggyBank,
  Star,
  Calendar,
  Zap,
  Heart,
  Target,
  Lightbulb,
  Trophy,
  Clock,
  CheckCircle2,
  Circle,
  Loader2,
  Plus,
} from 'lucide-react';

import { useAppStore } from '@/lib/store';
import type { ActionType, AddictionType } from '@/lib/types';
import {
  ENCOURAGEMENT_MESSAGES,
  ACTION_CONFIGS,
  TIPS_BY_ADDICTION,
} from '@/lib/types';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

// ===== Helpers =====

function getTodayString(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

function getDayIndex(): number {
  return new Date().getDay();
}

function getRandomEncouragement(): string {
  const idx = getDayIndex() % ENCOURAGEMENT_MESSAGES.length;
  return ENCOURAGEMENT_MESSAGES[idx];
}

function getLevelProgress(level: number): number {
  // Each level requires progressively more points; show progress 0-100 within current level
  return ((level % 5) / 5) * 100;
}

// ===== Sub-components =====

function StreakBadge({ streak }: { streak: number }) {
  return (
    <div className="animate-fade-in inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-400 to-red-500 px-4 py-2 text-sm font-semibold text-white shadow-md">
      <Flame className="size-5" />
      <span>
        🔥 {streak} jour{streak > 1 ? 's' : ''} d&apos;affilée
      </span>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  colorClass,
  delay,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  subtext?: string;
  colorClass: string;
  delay: number;
}) {
  return (
    <Card
      className="animate-fade-in shadow-sm transition-shadow hover:shadow-md"
      style={{ animationDelay: `${delay}ms` }}
    >
      <CardContent className="flex flex-col items-start gap-2 p-4">
        <div
          className={`flex size-10 items-center justify-center rounded-xl ${colorClass}`}
        >
          <Icon className="size-5 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">{label}</span>
          <span className="text-xl font-bold tracking-tight">{value}</span>
          {subtext && (
            <span className="text-xs text-muted-foreground">{subtext}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-primary/10">
          <Heart className="size-10 text-primary" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Bienvenue ! 🎉</h3>
          <p className="max-w-xs text-sm text-muted-foreground">
            Commencez votre parcours vers une vie plus saine. Ajoutez vos
            dépendances et fixez-vous des objectifs pour commencer à suivre
            vos progrès.
          </p>
        </div>
        <Button className="mt-2 rounded-full px-6">
          <Zap className="size-4" />
          Commencer
        </Button>
      </CardContent>
    </Card>
  );
}

function AddictionProgressItem({
  name,
  icon,
  color,
  goalType,
  consumed,
  target,
  unit,
}: {
  name: string;
  icon: string;
  color: string;
  goalType: 'REDUCE' | 'STOP';
  consumed: number;
  target: number;
  unit: string;
}) {
  const isGoalMet = goalType === 'STOP' ? consumed === 0 : consumed <= target;
  const progressValue =
    goalType === 'STOP'
      ? consumed === 0
        ? 100
        : Math.max(0, 100 - (consumed / Math.max(1, target)) * 100)
      : Math.min(100, (consumed / Math.max(1, target)) * 100);

  return (
    <div className="flex flex-col gap-2 rounded-xl border bg-card p-3 transition-shadow hover:shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className="text-sm font-medium">{name}</span>
        </div>
        <Badge
          variant={isGoalMet ? 'default' : 'destructive'}
          className="text-xs"
        >
          {isGoalMet ? '✓ OK' : 'En cours'}
        </Badge>
      </div>

      <Progress
        value={progressValue}
        className={`h-2 [&>[data-slot=progress-indicator]]:${isGoalMet ? 'bg-emerald-500' : 'bg-orange-500'}`}
      />

      <div className="text-xs text-muted-foreground">
        {goalType === 'STOP' ? (
          consumed === 0 ? (
            <span className="font-medium text-emerald-600">
              0/{target} — Objectif atteint ! 🎉
            </span>
          ) : (
            <span className="font-medium text-red-500">
              {consumed} consommé{consumed > 1 ? 's' : ''}
            </span>
          )
        ) : (
          <span
            className={
              consumed <= target ? 'text-emerald-600' : 'text-red-500'
            }
          >
            {consumed}/{target} {unit}
          </span>
        )}
      </div>
    </div>
  );
}

function ChallengeCard({
  title,
  description,
  progressDays,
  targetDays,
  delay,
}: {
  title: string;
  description: string;
  progressDays: number;
  targetDays: number;
  delay: number;
}) {
  const remaining = targetDays - progressDays;
  const pct = Math.min(100, (progressDays / targetDays) * 100);

  return (
    <Card
      className="animate-fade-in min-w-[260px] flex-shrink-0 shadow-sm"
      style={{ animationDelay: `${delay}ms` }}
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Trophy className="size-4 text-amber-500" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">{description}</p>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium">
              {progressDays}/{targetDays} jours
            </span>
            <span className="text-muted-foreground">
              {remaining > 0 ? `${remaining} restant${remaining > 1 ? 's' : ''}` : 'Terminé ! 🎉'}
            </span>
          </div>
          <Progress value={pct} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
}

function ActionItem({
  id,
  actionType,
  completed,
  onToggle,
}: {
  id: string;
  actionType: ActionType;
  completed: boolean;
  onToggle: (id: string) => void;
}) {
  const config = ACTION_CONFIGS[actionType];
  const [loading, setLoading] = useState(false);

  const handleToggle = useCallback(async () => {
    setLoading(true);
    try {
      await onToggle(id);
    } finally {
      setLoading(false);
    }
  }, [id, onToggle]);

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all ${
        completed
          ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/30'
          : 'border-transparent bg-card hover:bg-accent/50'
      }`}
    >
      {loading ? (
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      ) : completed ? (
        <CheckCircle2 className="size-5 text-emerald-500" />
      ) : (
        <Circle className="size-5 text-muted-foreground/40" />
      )}
      <span className="text-base" role="img" aria-hidden>
        {config?.icon}
      </span>
      <span
        className={`flex-1 text-sm font-medium ${
          completed ? 'text-emerald-700 line-through dark:text-emerald-400' : ''
        }`}
      >
        {config?.label}
      </span>
      {completed && (
        <Badge variant="secondary" className="text-[10px]">
          Fait
        </Badge>
      )}
    </button>
  );
}

function DailyTipCard({ tip }: { tip: string }) {
  return (
    <Card className="animate-fade-in border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 dark:border-amber-800 dark:from-amber-950/30 dark:to-yellow-950/20">
      <CardContent className="flex gap-3 p-4">
        <div className="flex size-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50">
          <Lightbulb className="size-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
            💡 Conseil du jour
          </span>
          <p className="text-sm leading-relaxed text-amber-900 dark:text-amber-200">
            {tip}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ===== Main Component =====

export default function DashboardView() {
  const user = useAppStore((s) => s.user);
  const addictions = useAppStore((s) => s.addictions);
  const stats = useAppStore((s) => s.stats);
  const challenges = useAppStore((s) => s.challenges);
  const dailyActions = useAppStore((s) => s.dailyActions);
  const consumptions = useAppStore((s) => s.consumptions);
  const setEmergencyMode = useAppStore((s) => s.setEmergencyMode);
  const setActiveTab = useAppStore((s) => s.setActiveTab);

  const todayString = getTodayString();

  // Today's consumptions grouped by addiction
  const todayConsumptions = useMemo(() => {
    const today = consumptions.filter((c) => c.date === todayString);
    const grouped: Record<string, number> = {};
    today.forEach((c) => {
      grouped[c.addictionId] = (grouped[c.addictionId] || 0) + c.quantity;
    });
    return grouped;
  }, [consumptions, todayString]);

  // Today's daily actions
  const todayActions = useMemo(() => {
    return dailyActions.filter((a) => a.date === todayString);
  }, [dailyActions, todayString]);

  // Active challenges
  const activeChallenges = useMemo(() => {
    return challenges.filter((c) => c.status === 'ACTIVE');
  }, [challenges]);

  // Daily tip based on addictions
  const dailyTip = useMemo(() => {
    if (addictions.length === 0) {
      return 'Ajoutez vos dépendances pour recevoir des conseils personnalisés chaque jour !';
    }
    const types = addictions.map((a) => a.type);
    const dayTipIndex = getDayIndex() % types.length;
    const addictionType = types[dayTipIndex] || 'OTHER';
    const tips = TIPS_BY_ADDICTION[addictionType as AddictionType] || TIPS_BY_ADDICTION.OTHER;
    const tipIdx = Math.floor(new Date().getDate() / 5) % tips.length;
    return tips[tipIdx] || tips[0];
  }, [addictions]);

  // Toggle action handler
  const handleToggleAction = useCallback(
    async (actionId: string) => {
      try {
        const res = await fetch(`/api/actions/${actionId}`, { method: 'PUT' });
        if (res.ok) {
          const updated = await res.json();
          // Optimistically update the store
          const { setDailyActions } = useAppStore.getState();
          setDailyActions(
            useAppStore.getState().dailyActions.map((a) =>
              a.id === actionId ? { ...a, completed: updated.completed } : a
            )
          );
        }
      } catch (err) {
        console.error('Failed to toggle action:', err);
      }
    },
    []
  );

  // ===== Render =====

  // Empty state when no user
  if (!user) {
    return (
      <div className="space-y-6 p-4">
        <EmptyState />
      </div>
    );
  }

  const hasData = addictions.length > 0 || stats;

  return (
    <div className="relative space-y-6 pb-8">
      {/* ===== 1. Header Section ===== */}
      <section className="animate-fade-in space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">
              Bonjour, {user.name || 'Champion'} 👋
            </h1>
            <p className="text-sm text-muted-foreground">
              {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
            </p>
          </div>
        </div>

        {/* Encouragement message */}
        <p className="rounded-xl bg-primary/5 px-4 py-2 text-sm font-medium text-primary">
          {getRandomEncouragement()}
        </p>

        {/* Streak badge */}
        {stats && stats.currentStreak > 0 && (
          <StreakBadge streak={stats.currentStreak} />
        )}
      </section>

      {/* ===== 4. Emergency SOS Button (floating) ===== */}
      {user.emergencyModeEnabled && (
        <div className="animate-fade-in fixed bottom-24 right-4 z-50">
          <button
            type="button"
            onClick={() => setEmergencyMode(true)}
            className="animate-pulse-glow flex size-16 flex-col items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-700 text-white shadow-2xl transition-transform active:scale-95 sm:size-20"
            aria-label="Activer le mode urgence"
          >
            <span className="text-2xl">🆘</span>
            <span className="mt-0.5 text-[9px] font-bold leading-none sm:text-[10px]">
              Mode urgence
            </span>
          </button>
        </div>
      )}

      {!hasData ? (
        <EmptyState />
      ) : (
        <>
          {/* ===== Floating Action Button — Quick Add Consumption ===== */}
          {addictions.length > 0 && (
            <div className="animate-fade-in fixed bottom-24 left-4 z-50">
              <button
                type="button"
                onClick={() => setActiveTab('tracking')}
                className="flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-2xl transition-all active:scale-95 hover:shadow-emerald-300/40 sm:size-16"
                aria-label="Enregistrer une consommation"
              >
                <Plus className="size-6" />
              </button>
            </div>
          )}

          {/* ===== 2. Quick Stats Grid (2x2) ===== */}
          <section className="grid grid-cols-2 gap-3">
            <StatCard
              icon={Calendar}
              label="Jours suivis"
              value={stats?.totalDaysTracked ?? 0}
              colorClass="bg-emerald-500"
              delay={100}
            />
            <StatCard
              icon={TrendingDown}
              label="Réduction"
              value={`${stats?.reductionPercentage ?? 0}%`}
              subtext={
                (stats?.reductionPercentage ?? 0) > 0
                  ? 'En progrès !'
                  : undefined
              }
              colorClass="bg-teal-500"
              delay={150}
            />
            <StatCard
              icon={PiggyBank}
              label="Économisé"
              value={`${(stats?.moneySaved ?? 0).toLocaleString('fr-FR')} FCFA`}
              colorClass="bg-amber-500"
              delay={200}
            />
            <StatCard
              icon={Star}
              label="Niveau"
              value={stats?.level ?? user.level ?? 1}
              subtext="Prochain niveau"
              colorClass="bg-violet-500"
              delay={250}
            />
          </section>

          {/* Level progress */}
          {(stats || user) && (
            <Card
              className="animate-fade-in shadow-sm"
              style={{ animationDelay: '280ms' }}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    Niveau {stats?.level ?? user.level ?? 1}
                  </span>
                  <span>
                    Niveau {(stats?.level ?? user.level ?? 1) + 1}
                  </span>
                </div>
                <Progress
                  value={getLevelProgress(stats?.level ?? user.level ?? 1)}
                  className="mt-2 h-2"
                />
              </CardContent>
            </Card>
          )}

          {/* ===== 5. Today's Progress ===== */}
          {addictions.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Target className="size-5 text-primary" />
                <h2 className="text-base font-semibold">
                  Progression du jour
                </h2>
              </div>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {addictions.map((addiction) => (
                  <AddictionProgressItem
                    key={addiction.id}
                    name={addiction.name}
                    icon={addiction.icon}
                    color={addiction.color}
                    goalType={addiction.goalType}
                    consumed={todayConsumptions[addiction.id] ?? 0}
                    target={addiction.targetQuantity}
                    unit={addiction.unit}
                  />
                ))}
              </div>
            </section>
          )}

          {/* ===== 6. Active Challenges ===== */}
          {activeChallenges.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Trophy className="size-5 text-amber-500" />
                <h2 className="text-base font-semibold">
                  Défis en cours
                </h2>
                <Badge variant="secondary" className="ml-auto text-xs">
                  {activeChallenges.length}
                </Badge>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                {activeChallenges.map((challenge, idx) => (
                  <ChallengeCard
                    key={challenge.id}
                    title={challenge.title}
                    description={challenge.description}
                    progressDays={challenge.progressDays}
                    targetDays={challenge.targetDays}
                    delay={300 + idx * 50}
                  />
                ))}
              </div>
            </section>
          )}

          {/* ===== 7. Today's Actions ===== */}
          {todayActions.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="size-5 text-primary" />
                <h2 className="text-base font-semibold">
                  Actions du jour
                </h2>
                <span className="ml-auto text-xs text-muted-foreground">
                  {todayActions.filter((a) => a.completed).length}/{todayActions.length}{' '}
                  complétées
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {todayActions.map((action) => (
                  <ActionItem
                    key={action.id}
                    id={action.id}
                    actionType={action.actionType}
                    completed={action.completed}
                    onToggle={handleToggleAction}
                  />
                ))}
              </div>
            </section>
          )}

          {/* ===== 8. Daily Tip Card ===== */}
          <DailyTipCard tip={dailyTip} />
        </>
      )}
    </div>
  );
}
