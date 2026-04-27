'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, Trash2, Clock, ChevronDown, ChevronUp, StickyNote } from 'lucide-react';
import { format, subDays, isToday, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

import type { Addiction, ConsumptionContext } from '@/lib/types';
import { CONTEXT_LABELS } from '@/lib/types';

// ===== Types for API responses =====
interface ConsumptionEntry {
  id: string;
  addictionId: string;
  date: string;
  quantity: number;
  time: string;
  context: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  addiction: {
    name: string;
    icon: string;
    color: string;
    unit: string;
  };
}

interface TodayEntry {
  id: string;
  addictionId: string;
  addiction: {
    name: string;
    icon: string;
    color: string;
    unit: string;
  };
  quantity: number;
  time: string;
  context: string;
  notes?: string;
}

interface HistoryDay {
  date: string;
  label: string;
  entries: {
    addiction: { name: string; icon: string; color: string; unit: string };
    totalQuantity: number;
  }[];
}

// ===== Time options (00:00 to 23:30 in 30-min intervals) =====
const TIME_OPTIONS: string[] = [];
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 30) {
    TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }
}

// ===== Context button configs =====
const CONTEXT_KEYS: ConsumptionContext[] = ['STRESS', 'BOREDOM', 'SOCIAL', 'HABIT', 'CRAVING', 'OTHER'];
const CONTEXT_ICONS: Record<ConsumptionContext, string> = {
  STRESS: '😰',
  BOREDOM: '😴',
  SOCIAL: '👥',
  HABIT: '🔄',
  CRAVING: '🔥',
  OTHER: '❓',
};

// ===== Animation variants =====
const listVariants = {
  enter: { opacity: 0, y: -10 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, x: 30 },
};

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

export default function TrackingView() {
  // ===== State =====
  const [addictions, setAddictions] = useState<Addiction[]>([]);
  const [selectedAddictionId, setSelectedAddictionId] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [time, setTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(Math.floor(now.getMinutes() / 30) * 30).padStart(2, '0')}`;
  });
  const [context, setContext] = useState<ConsumptionContext>('OTHER');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [todayEntries, setTodayEntries] = useState<TodayEntry[]>([]);
  const [allConsumptions, setAllConsumptions] = useState<ConsumptionEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const selectedAddiction = useMemo(
    () => addictions.find((a) => a.id === selectedAddictionId),
    [addictions, selectedAddictionId],
  );

  // ===== Fetch data =====
  const fetchData = useCallback(async () => {
    try {
      const [addictionsRes, consumptionsRes] = await Promise.all([
        fetch('/api/addictions?userId=user-1'),
        fetch('/api/consumptions?userId=user-1'),
      ]);

      const addictionsData = await addictionsRes.json();
      const consumptionsData = await consumptionsRes.json();

      setAddictions(Array.isArray(addictionsData) ? addictionsData : []);
      const consumptions = Array.isArray(consumptionsData) ? consumptionsData : [];
      setAllConsumptions(consumptions);

      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const today = consumptions.filter((c: ConsumptionEntry) => c.date === todayStr);
      setTodayEntries(today);
    } catch (err) {
      console.error('Error fetching tracking data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ===== Compute recent history (last 7 days, grouped) =====
  const recentHistory = useMemo<HistoryDay[]>(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const sevenDaysAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');
    const recent = allConsumptions.filter(
      (c) => c.date < todayStr && c.date >= sevenDaysAgo,
    );

    const grouped: Record<string, HistoryDay['entries']> = {};
    for (const c of recent) {
      if (!grouped[c.date]) grouped[c.date] = [];
      const existing = grouped[c.date].find(
        (e) => e.addiction.name === c.addiction.name,
      );
      if (existing) {
        existing.totalQuantity += c.quantity;
      } else {
        grouped[c.date].push({
          addiction: c.addiction,
          totalQuantity: c.quantity,
        });
      }
    }

    return Object.entries(grouped)
      .map(([date, entries]) => ({
        date,
        label: isToday(parseISO(date))
          ? "Aujourd'hui"
          : format(parseISO(date), 'EEE d MMM', { locale: fr }),
        entries,
      }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [allConsumptions]);

  // ===== Reset form =====
  const resetForm = useCallback(() => {
    setQuantity(1);
    setTime(() => {
      const now = new Date();
      return `${String(now.getHours()).padStart(2, '0')}:${String(Math.floor(now.getMinutes() / 30) * 30).padStart(2, '0')}`;
    });
    setContext('OTHER');
    setNotes('');
  }, []);

  // ===== Submit new consumption =====
  const handleSubmit = async () => {
    if (!selectedAddictionId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const res = await fetch('/api/consumptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addictionId: selectedAddictionId,
          date: todayStr,
          quantity,
          time,
          context,
          notes: notes.trim() || undefined,
        }),
      });

      if (res.ok) {
        const newEntry: ConsumptionEntry = await res.json();
        setTodayEntries((prev) => [
          {
            id: newEntry.id,
            addictionId: newEntry.addictionId,
            addiction: newEntry.addiction,
            quantity: newEntry.quantity,
            time: newEntry.time,
            context: newEntry.context,
            notes: newEntry.notes,
          },
          ...prev,
        ]);
        setAllConsumptions((prev) => [newEntry, ...prev]);
        resetForm();
      }
    } catch (err) {
      console.error('Error submitting consumption:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ===== Delete consumption =====
  const handleDelete = async (id: string) => {
    if (deletingIds.has(id)) return;
    setDeletingIds((prev) => new Set(prev).add(id));
    try {
      const res = await fetch(`/api/consumptions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTodayEntries((prev) => prev.filter((e) => e.id !== id));
        setAllConsumptions((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (err) {
      console.error('Error deleting consumption:', err);
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  // ===== Render =====
  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="h-5 w-1/3 animate-pulse rounded bg-muted" />
                <div className="h-9 w-full animate-pulse rounded bg-muted" />
                <div className="h-9 w-full animate-pulse rounded bg-muted" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ===== Quick Add Section ===== */}
      <motion.div initial="hidden" animate="visible" variants={cardVariants} transition={{ duration: 0.3 }}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">📊 Nouvelle consommation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Addiction Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Addiction
              </label>
              <Select
                value={selectedAddictionId}
                onValueChange={setSelectedAddictionId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choisir une addiction..." />
                </SelectTrigger>
                <SelectContent>
                  {addictions.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      <span className="flex items-center gap-2">
                        <span>{a.icon}</span>
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: a.color }}
                        />
                        <span>{a.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {addictions.length === 0 && (
                <p className="text-xs text-destructive font-medium">
                  Aucune addiction configurée. Va dans ton profil pour en ajouter une.
                </p>
              )}
              {addictions.length > 0 && !selectedAddictionId && (
                <p className="text-xs text-muted-foreground animate-fade-in">
                  👆 Sélectionne une addiction ci-dessus pour enregistrer ta consommation
                </p>
              )}
            </div>

            {/* Form fields - shown when addiction selected */}
            <AnimatePresence>
              {selectedAddictionId && selectedAddiction && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-5 overflow-hidden"
                >
                  {/* Quantity Stepper */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Quantité
                    </label>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        disabled={quantity <= 1}
                        aria-label="Diminuer la quantité"
                      >
                        <Minus className="size-4" />
                      </Button>
                      <div className="flex h-11 w-20 items-center justify-center rounded-md border bg-muted/50 text-lg font-semibold">
                        {quantity}
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setQuantity((q) => q + 1)}
                        aria-label="Augmenter la quantité"
                      >
                        <Plus className="size-4" />
                      </Button>
                      <span className="text-sm text-muted-foreground ml-1">
                        {selectedAddiction.unit}
                      </span>
                    </div>
                  </div>

                  {/* Time Picker */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                      <Clock className="size-3.5" />
                      Heure
                    </label>
                    <Select value={time} onValueChange={setTime}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {TIME_OPTIONS.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Context Selector */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Contexte
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {CONTEXT_KEYS.map((ctx) => (
                        <button
                          key={ctx}
                          type="button"
                          onClick={() => setContext(ctx)}
                          className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-2.5 text-xs font-medium transition-all ${
                            context === ctx
                              ? 'border-primary bg-primary/10 text-primary shadow-sm'
                              : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                          }`}
                        >
                          <span className="text-base">{CONTEXT_ICONS[ctx]}</span>
                          <span>{CONTEXT_LABELS[ctx]}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                      <StickyNote className="size-3.5" />
                      Notes <span className="text-muted-foreground font-normal">(optionnel)</span>
                    </label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Comment te sens-tu ? Qu'est-ce qui a déclenché..."
                      rows={2}
                      className="resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full h-11 text-base font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Enregistrement...
                      </span>
                    ) : (
                      '✅ Enregistrer'
                    )}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      {/* ===== Today's Log ===== */}
      <motion.div initial="hidden" animate="visible" variants={cardVariants} transition={{ duration: 0.3, delay: 0.1 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              📝 Aujourd&apos;hui
              {todayEntries.length > 0 && (
                <Badge variant="secondary" className="ml-auto">
                  {todayEntries.length} {todayEntries.length > 1 ? 'entrées' : 'entrée'}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayEntries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center animate-fade-in">
                <span className="text-4xl mb-3">🌟</span>
                <p className="text-sm text-muted-foreground font-medium">
                  Aucune consommation enregistrée aujourd&apos;hui
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Continue comme ça, chaque jour compte ! 💪
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {todayEntries.map((entry) => (
                    <motion.div
                      key={entry.id}
                      layout
                      variants={listVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.2 }}
                      className="group flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-accent/50"
                    >
                      {/* Addiction Icon + Color dot */}
                      <div className="relative flex-shrink-0">
                        <span className="text-xl">{entry.addiction.icon}</span>
                        <span
                          className="absolute -bottom-0.5 -right-0.5 block h-2.5 w-2.5 rounded-full border-2 border-background"
                          style={{ backgroundColor: entry.addiction.color }}
                        />
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">
                            {entry.addiction.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">
                            {entry.quantity} {entry.addiction.unit}
                          </span>
                          <span className="text-muted-foreground">·</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="size-3" />
                            {entry.time}
                          </span>
                        </div>
                      </div>

                      {/* Context Badge */}
                      <Badge
                        variant="outline"
                        className="flex-shrink-0 text-[10px] px-1.5 py-0 hidden sm:flex"
                      >
                        {CONTEXT_LABELS[entry.context as ConsumptionContext] || entry.context}
                      </Badge>

                      {/* Delete Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="flex-shrink-0 size-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity sm:opacity-100"
                        onClick={() => handleDelete(entry.id)}
                        disabled={deletingIds.has(entry.id)}
                        aria-label="Supprimer cette entrée"
                      >
                        {deletingIds.has(entry.id) ? (
                          <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                          <Trash2 className="size-3.5" />
                        )}
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ===== Recent History (last 7 days) ===== */}
      <motion.div initial="hidden" animate="visible" variants={cardVariants} transition={{ duration: 0.3, delay: 0.2 }}>
        <Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer select-none hover:bg-accent/30 transition-colors rounded-t-xl">
                <CardTitle className="flex items-center justify-between text-lg">
                  <span className="flex items-center gap-2">
                    📅 Historique récent
                    {recentHistory.length > 0 && (
                      <Badge variant="secondary" className="ml-1">
                        7 jours
                      </Badge>
                    )}
                  </span>
                  {historyOpen ? (
                    <ChevronUp className="size-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="size-5 text-muted-foreground" />
                  )}
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                {recentHistory.length === 0 ? (
                  <div className="py-6 text-center">
                    <span className="text-3xl mb-2 block">📭</span>
                    <p className="text-sm text-muted-foreground">
                      Aucune donnée pour les 7 derniers jours
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentHistory.map((day) => (
                      <div
                        key={day.date}
                        className="animate-fade-in"
                      >
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                          {day.label}
                        </p>
                        <div className="space-y-1.5">
                          {day.entries.map((entry, idx) => (
                            <div
                              key={`${day.date}-${idx}`}
                              className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-base">{entry.addiction.icon}</span>
                                <span
                                  className="inline-block h-2 w-2 rounded-full"
                                  style={{ backgroundColor: entry.addiction.color }}
                                />
                                <span className="text-sm font-medium">
                                  {entry.addiction.name}
                                </span>
                              </div>
                              <span className="text-sm font-semibold">
                                {entry.totalQuantity}{' '}
                                <span className="text-xs font-normal text-muted-foreground">
                                  {entry.addiction.unit}
                                </span>
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </motion.div>
    </div>
  );
}
