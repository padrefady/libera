'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  CalendarDays,
  Flame,
  Target,
  Award,
  PiggyBank,
  BarChart3,
  PieChartIcon,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ReferenceLine,
} from 'recharts';
import { format, subDays, eachDayOfInterval, isToday, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import type { ConsumptionContext } from '@/lib/types';
import { CONTEXT_LABELS } from '@/lib/types';

// ===== Types =====
interface ConsumptionEntry {
  id: string;
  addictionId: string;
  date: string;
  quantity: number;
  time: string;
  context: string;
  notes?: string;
  addiction: {
    name: string;
    icon: string;
    color: string;
    unit: string;
    targetQuantity?: number;
    costPerUnit?: number;
  };
}

interface StatsOverview {
  totalDaysTracked: number;
  currentStreak: number;
  longestStreak: number;
  totalMoneySaved: number;
  avgReductionPercentage: number;
  addictionsCount: number;
  badgesCount: number;
  activeChallenges: number;
  completedChallenges: number;
}

type TimeFilter = '7d' | '30d' | '90d';

// ===== Context colors =====
const CONTEXT_COLORS: Record<string, string> = {
  STRESS: '#ef4444',
  BOREDOM: '#eab308',
  SOCIAL: '#3b82f6',
  HABIT: '#8b5cf6',
  CRAVING: '#f97316',
  OTHER: '#6b7280',
};

// ===== Animation =====
const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, delay: i * 0.08 },
  }),
};

// ===== Helpers =====
function getDaysBack(filter: TimeFilter): number {
  switch (filter) {
    case '7d':
      return 7;
    case '30d':
      return 30;
    case '90d':
      return 90;
  }
}

function getBarWidth(filter: TimeFilter): number {
  switch (filter) {
    case '7d':
      return 28;
    case '30d':
      return 12;
    case '90d':
      return 4;
  }
}

export default function ProgressView() {
  // ===== State =====
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('7d');
  const [consumptions, setConsumptions] = useState<ConsumptionEntry[]>([]);
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAddiction, setSelectedAddiction] = useState<string>('all');
  const [addictionOptions, setAddictionOptions] = useState<{ id: string; name: string; icon: string; color: string; targetQuantity: number; unit: string }[]>([]);

  // ===== Fetch data =====
  const fetchData = useCallback(async () => {
    try {
      const [consumptionsRes, statsRes] = await Promise.all([
        fetch('/api/consumptions?userId=user-1'),
        fetch('/api/stats?userId=user-1'),
      ]);

      const consumptionsData = await consumptionsRes.json();
      const statsData = await statsRes.json();

      const cons = Array.isArray(consumptionsData) ? consumptionsData : [];
      setConsumptions(cons);

      // Extract addiction options
      const seen = new Map<string, { id: string; name: string; icon: string; color: string; targetQuantity: number; unit: string }>();
      for (const c of cons) {
        if (!seen.has(c.addictionId)) {
          seen.set(c.addictionId, {
            id: c.addictionId,
            name: c.addiction.name,
            icon: c.addiction.icon,
            color: c.addiction.color,
            targetQuantity: 0,
            unit: c.addiction.unit,
          });
        }
      }
      setAddictionOptions(Array.from(seen.values()));

      // Also merge target data from stats
      if (statsData?.addictions) {
        const addictionsArr: any[] = Array.isArray(statsData.addictions) ? statsData.addictions : [];
        setAddictionOptions((prev) =>
          prev.map((p) => {
            const s = addictionsArr.find((a) => a.addictionId === p.id);
            return s
              ? { ...p, targetQuantity: s.targetQuantity ?? 0 }
              : p;
          }),
        );

        setStats(statsData.overview ?? null);
      }
    } catch (err) {
      console.error('Error fetching progress data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ===== Filtered consumptions =====
  const daysBack = getDaysBack(timeFilter);
  const startDate = format(subDays(new Date(), daysBack - 1), 'yyyy-MM-dd');

  const filteredConsumptions = useMemo(
    () =>
      consumptions.filter((c) => {
        const matchDate = c.date >= startDate;
        const matchAddiction = selectedAddiction === 'all' || c.addictionId === selectedAddiction;
        return matchDate && matchAddiction;
      }),
    [consumptions, startDate, selectedAddiction],
  );

  // ===== Daily totals for chart =====
  const dailyData = useMemo(() => {
    const days = eachDayOfInterval({
      start: parseISO(startDate),
      end: new Date(),
    });

    const targetQty =
      selectedAddiction === 'all'
        ? 0
        : addictionOptions.find((a) => a.id === selectedAddiction)?.targetQuantity ?? 0;

    return days.map((day) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayConsumptions = filteredConsumptions.filter((c) => c.date === dateStr);
      const total = dayConsumptions.reduce((sum, c) => sum + c.quantity, 0);
      return {
        date: dateStr,
        label:
          timeFilter === '7d'
            ? format(day, 'EEE', { locale: fr })
            : timeFilter === '30d'
              ? format(day, 'd MMM', { locale: fr })
              : format(day, 'd MMM', { locale: fr }),
        total: Math.round(total * 100) / 100,
        fill: targetQty > 0 && total > targetQty ? '#ef4444' : '#22c55e',
        target: targetQty,
      };
    });
  }, [filteredConsumptions, startDate, timeFilter, selectedAddiction, addictionOptions]);

  // ===== Moving average (7-day) for reduction chart =====
  const movingAverageData = useMemo(() => {
    if (dailyData.length < 7) {
      return dailyData.map((d) => ({ ...d, average: d.total }));
    }
    return dailyData.map((d, i) => {
      const windowStart = Math.max(0, i - 6);
      const window = dailyData.slice(windowStart, i + 1);
      const avg = window.reduce((s, w) => s + w.total, 0) / window.length;
      return { ...d, average: Math.round(avg * 100) / 100 };
    });
  }, [dailyData]);

  // ===== Streak calendar (last 30 days) =====
  const calendarData = useMemo(() => {
    const days = eachDayOfInterval({
      start: subDays(new Date(), 29),
      end: new Date(),
    });

    return days.map((day) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayTotal = consumptions
        .filter((c) => c.date === dateStr)
        .reduce((s, c) => s + c.quantity, 0);
      return {
        date: dateStr,
        day: format(day, 'd'),
        weekday: format(day, 'EEE', { locale: fr }),
        isToday: isToday(day),
        status: dayTotal === 0 ? (dateStr > format(new Date(), 'yyyy-MM-dd') ? 'future' : 'clean') : 'consumed',
        total: dayTotal,
      };
    });
  }, [consumptions]);

  // ===== Clean days count =====
  const cleanDaysCount = useMemo(
    () => calendarData.filter((d) => d.status === 'clean').length,
    [calendarData],
  );

  // ===== Context breakdown =====
  const contextBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of filteredConsumptions) {
      counts[c.context] = (counts[c.context] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([context, count]) => ({
        name: CONTEXT_LABELS[context as ConsumptionContext] || context,
        value: count,
        color: CONTEXT_COLORS[context] || '#6b7280',
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredConsumptions]);

  // ===== Computed financial =====
  const moneySaved = stats?.totalMoneySaved ?? 0;
  const totalSpent = filteredConsumptions.reduce((sum, c) => {
    const costPerUnit = (c.addiction as any).costPerUnit ?? 0;
    return sum + c.quantity * costPerUnit;
  }, 0);

  // ===== Render =====
  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="h-5 w-1/3 animate-pulse rounded bg-muted" />
                <div className="h-40 w-full animate-pulse rounded bg-muted" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ===== Time Filter Tabs ===== */}
      <motion.div initial="hidden" animate="visible" variants={cardVariants} custom={0} transition={{ duration: 0.3 }}>
        <div className="flex items-center gap-2">
          {(
            [
              { key: '7d', label: '7 jours' },
              { key: '30d', label: '30 jours' },
              { key: '90d', label: '3 mois' },
            ] as { key: TimeFilter; label: string }[]
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setTimeFilter(tab.key)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                timeFilter === tab.key
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-secondary text-secondary-foreground hover:bg-accent'
              }`}
            >
              {tab.label}
            </button>
          ))}

          {/* Addiction filter */}
          {addictionOptions.length > 1 && (
            <div className="ml-auto">
              <select
                value={selectedAddiction}
                onChange={(e) => setSelectedAddiction(e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Filtrer par addiction"
              >
                <option value="all">Toutes</option>
                {addictionOptions.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.icon} {a.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </motion.div>

      {/* ===== Financial Summary ===== */}
      <motion.div initial="hidden" animate="visible" variants={cardVariants} custom={1} transition={{ duration: 0.35 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <PiggyBank className="size-5 text-emerald-600" />
              Résumé financier
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Économisé</p>
                <p className="text-xl font-bold text-emerald-600">
                  {moneySaved.toLocaleString('fr-FR')} FCFA
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Dépensé</p>
                <p className="text-xl font-bold text-muted-foreground">
                  {Math.round(totalSpent).toLocaleString('fr-FR')} FCFA
                </p>
              </div>
            </div>
            {/* Visual bar */}
            <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                style={{
                  width: `${totalSpent + moneySaved > 0 ? (moneySaved / (totalSpent + moneySaved)) * 100 : 0}%`,
                  minWidth: moneySaved > 0 ? '8px' : '0px',
                }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Économies</span>
              <span>Dépenses</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ===== Weekly Trend Chart ===== */}
      <motion.div initial="hidden" animate="visible" variants={cardVariants} custom={2} transition={{ duration: 0.35 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="size-5 text-emerald-600" />
              Consommation quotidienne
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56 w-full sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10 }}
                    interval={timeFilter === '90d' ? 6 : timeFilter === '30d' ? 3 : 0}
                  />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      fontSize: '12px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--card)',
                    }}
                    formatter={(value: number) => [value, 'Quantité']}
                    labelFormatter={(label: string) => label}
                  />
                  {selectedAddiction !== 'all' &&
                    addictionOptions.find((a) => a.id === selectedAddiction)?.targetQuantity &&
                    addictionOptions.find((a) => a.id === selectedAddiction)!.targetQuantity > 0 && (
                      <ReferenceLine
                        y={
                          addictionOptions.find((a) => a.id === selectedAddiction)!
                            .targetQuantity
                        }
                        stroke="#f59e0b"
                        strokeDasharray="6 4"
                        strokeWidth={2}
                        label={{
                          value: 'Objectif',
                          position: 'insideTopRight',
                          fontSize: 10,
                          fill: '#f59e0b',
                        }}
                      />
                    )}
                  <Bar dataKey="total" radius={[4, 4, 0, 0]} barSize={getBarWidth(timeFilter)}>
                    {dailyData.map((entry, index) => (
                      <Cell
                        key={`bar-${index}`}
                        fill={
                          entry.target > 0
                            ? entry.total > entry.target
                              ? '#ef4444'
                              : '#22c55e'
                            : '#22c55e'
                        }
                        fillOpacity={0.8}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {selectedAddiction === 'all' && (
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Sélectionne une addiction pour voir l&apos;objectif
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ===== Reduction Trend (7-day Moving Average) ===== */}
      <motion.div initial="hidden" animate="visible" variants={cardVariants} custom={3} transition={{ duration: 0.35 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingDown className="size-5 text-emerald-600" />
              Tendance de réduction
              <Badge variant="secondary" className="ml-auto text-[10px]">
                Moyenne 7 jours
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 w-full sm:h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={movingAverageData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10 }}
                    interval={timeFilter === '90d' ? 6 : timeFilter === '30d' ? 3 : 0}
                  />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      fontSize: '12px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--card)',
                    }}
                    formatter={(value: number) => [value, 'Moyenne']}
                  />
                  <Area
                    type="monotone"
                    dataKey="average"
                    stroke="#22c55e"
                    strokeWidth={2.5}
                    fill="url(#areaGradient)"
                    dot={timeFilter === '7d' ? { r: 3, fill: '#22c55e' } : false}
                    activeDot={{ r: 5, fill: '#22c55e', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ===== Streak Calendar (30 days) ===== */}
      <motion.div initial="hidden" animate="visible" variants={cardVariants} custom={4} transition={{ duration: 0.35 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarDays className="size-5 text-emerald-600" />
              Calendrier de suivi
              <Badge variant="secondary" className="ml-auto text-[10px]">
                30 jours
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Legend */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1.5">
                <span className="block h-3 w-3 rounded-full bg-emerald-500" />
                <span className="text-[10px] text-muted-foreground">Jour propre</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="block h-3 w-3 rounded-full bg-red-400" />
                <span className="text-[10px] text-muted-foreground">Conso.</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="block h-3 w-3 rounded-full bg-gray-200 dark:bg-gray-700" />
                <span className="text-[10px] text-muted-foreground">Futur</span>
              </div>
            </div>
            {/* Grid */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {calendarData.map((d) => (
                <div
                  key={d.date}
                  className={`flex flex-col items-center gap-0.5 rounded-lg p-1.5 sm:p-2 transition-all ${
                    d.isToday
                      ? 'ring-2 ring-primary bg-primary/5 shadow-sm'
                      : 'hover:bg-accent/50'
                  }`}
                  title={`${d.date} — ${d.status === 'clean' ? 'Jour propre' : d.status === 'consumed' ? `Conso: ${d.total}` : 'Futur'}`}
                >
                  <span className="text-[9px] sm:text-[10px] text-muted-foreground font-medium leading-none">
                    {d.weekday}
                  </span>
                  <span
                    className={`block h-5 w-5 sm:h-6 sm:w-6 rounded-full transition-all ${
                      d.status === 'clean'
                        ? 'bg-emerald-500 shadow-sm shadow-emerald-500/30'
                        : d.status === 'consumed'
                          ? 'bg-red-400 shadow-sm shadow-red-400/20'
                          : 'bg-muted'
                    }`}
                  />
                  <span
                    className={`text-[9px] sm:text-[10px] leading-none ${
                      d.isToday ? 'font-bold text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    {d.day}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ===== Stats Cards ===== */}
      <motion.div initial="hidden" animate="visible" variants={cardVariants} custom={5} transition={{ duration: 0.35 }}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {/* Longest streak */}
          <Card>
            <CardContent className="p-4 flex flex-col items-center text-center gap-1">
              <Flame className="size-5 text-orange-500" />
              <span className="text-xs text-muted-foreground">Meilleure série</span>
              <span className="text-2xl font-bold">{stats?.longestStreak ?? 0}</span>
              <span className="text-[10px] text-muted-foreground">jours</span>
            </CardContent>
          </Card>

          {/* Current streak */}
          <Card>
            <CardContent className="p-4 flex flex-col items-center text-center gap-1">
              <Target className="size-5 text-emerald-600" />
              <span className="text-xs text-muted-foreground">Série actuelle</span>
              <span className="text-2xl font-bold">{stats?.currentStreak ?? 0}</span>
              <span className="text-[10px] text-muted-foreground">jours</span>
            </CardContent>
          </Card>

          {/* Avg reduction */}
          <Card>
            <CardContent className="p-4 flex flex-col items-center text-center gap-1">
              <TrendingDown className="size-5 text-emerald-600" />
              <span className="text-xs text-muted-foreground">Réduction moy.</span>
              <span className="text-2xl font-bold">{stats?.avgReductionPercentage ?? 0}%</span>
            </CardContent>
          </Card>

          {/* Clean days */}
          <Card>
            <CardContent className="p-4 flex flex-col items-center text-center gap-1">
              <Award className="size-5 text-emerald-600" />
              <span className="text-xs text-muted-foreground">Jours propres</span>
              <span className="text-2xl font-bold">{cleanDaysCount}</span>
              <span className="text-[10px] text-muted-foreground">sur 30 jours</span>
            </CardContent>
          </Card>

          {/* Days tracked */}
          <Card>
            <CardContent className="p-4 flex flex-col items-center text-center gap-1">
              <CalendarDays className="size-5 text-primary" />
              <span className="text-xs text-muted-foreground">Jours suivis</span>
              <span className="text-2xl font-bold">{stats?.totalDaysTracked ?? 0}</span>
            </CardContent>
          </Card>

          {/* Addictions count */}
          <Card>
            <CardContent className="p-4 flex flex-col items-center text-center gap-1">
              <BarChart3 className="size-5 text-primary" />
              <span className="text-xs text-muted-foreground">Addictions</span>
              <span className="text-2xl font-bold">{stats?.addictionsCount ?? 0}</span>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* ===== Context Breakdown ===== */}
      {contextBreakdown.length > 0 && (
        <motion.div initial="hidden" animate="visible" variants={cardVariants} custom={6} transition={{ duration: 0.35 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <PieChartIcon className="size-5 text-emerald-600" />
                Contextes de consommation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Pie chart */}
                <div className="h-48 w-48 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={contextBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {contextBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: '8px',
                          fontSize: '12px',
                          border: '1px solid var(--border)',
                          backgroundColor: 'var(--card)',
                        }}
                        formatter={(value: number) => [value, 'Occurrences']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Legend */}
                <div className="flex-1 space-y-2 w-full">
                  {contextBreakdown.map((item) => {
                    const total = contextBreakdown.reduce((s, c) => s + c.value, 0);
                    const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                    return (
                      <div key={item.name} className="flex items-center gap-3">
                        <span
                          className="h-3 w-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm font-medium flex-1">{item.name}</span>
                        <span className="text-sm text-muted-foreground">{item.value}</span>
                        <span className="text-xs text-muted-foreground w-10 text-right">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
