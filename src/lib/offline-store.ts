const PREFIX = 'libera_';

function getKey(key: string): string {
  return `${PREFIX}${key}`;
}

function getItem<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(getKey(key));
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function setItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(getKey(key), JSON.stringify(value));
  } catch {
    // Storage full or other error – silently fail
  }
}

function removeItem(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(getKey(key));
  } catch {
    // silently fail
  }
}

function hasItem(key: string): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(getKey(key)) !== null;
}

// ─── Specific helpers ────────────────────────────────────────────────

function isOnboarded(): boolean {
  return getItem<boolean>('onboarded') === true;
}

function setOnboarded(v: boolean): void {
  setItem('onboarded', v);
}

function getUserPin(): string | null {
  return getItem<string>('user_pin');
}

function setUserPin(pin: string | null): void {
  if (pin === null) {
    removeItem('user_pin');
  } else {
    setItem('user_pin', pin);
  }
}

function getLocalUser(): any {
  return getItem<any>('user');
}

function setLocalUser(user: any): void {
  setItem('user', user);
}

function getLocalAddictions(): any[] {
  return getItem<any[]>('addictions') ?? [];
}

function setLocalAddictions(addictions: any[]): void {
  setItem('addictions', addictions);
}

function getLocalConsumptions(): any[] {
  return getItem<any[]>('consumptions') ?? [];
}

function setLocalConsumptions(consumptions: any[]): void {
  setItem('consumptions', consumptions);
}

function getLocalBadges(): any[] {
  return getItem<any[]>('badges') ?? [];
}

function setLocalBadges(badges: any[]): void {
  setItem('badges', badges);
}

function getLocalChallenges(): any[] {
  return getItem<any[]>('challenges') ?? [];
}

function setLocalChallenges(challenges: any[]): void {
  setItem('challenges', challenges);
}

function getLocalJournalEntries(): any[] {
  return getItem<any[]>('journal_entries') ?? [];
}

function setLocalJournalEntries(entries: any[]): void {
  setItem('journal_entries', entries);
}

function getLocalDailyActions(): any[] {
  return getItem<any[]>('daily_actions') ?? [];
}

function setLocalDailyActions(actions: any[]): void {
  setItem('daily_actions', actions);
}

function getLocalStats(): any {
  return getItem<any>('stats');
}

function setLocalStats(stats: any): void {
  setItem('stats', stats);
}

// ─── Singleton export ────────────────────────────────────────────────

export const offlineStore = {
  getItem,
  setItem,
  removeItem,
  hasItem,
  isOnboarded,
  setOnboarded,
  getUserPin,
  setUserPin,
  getLocalUser,
  setLocalUser,
  getLocalAddictions,
  setLocalAddictions,
  getLocalConsumptions,
  setLocalConsumptions,
  getLocalBadges,
  setLocalBadges,
  getLocalChallenges,
  setLocalChallenges,
  getLocalJournalEntries,
  setLocalJournalEntries,
  getLocalDailyActions,
  setLocalDailyActions,
  getLocalStats,
  setLocalStats,
};
