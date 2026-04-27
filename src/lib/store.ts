import { create } from 'zustand';
import type {
  User,
  Addiction,
  Consumption,
  Badge,
  Challenge,
  JournalEntry,
  DailyAction,
  Stats,
} from './types';
import { offlineStore } from './offline-store';
import { syncQueue } from './sync-queue';

const USER_ID = 'user-1';

// ===== State Shape =====

interface AppState {
  // User
  user: User | null;
  setUser: (user: User | null) => void;

  // Onboarding
  currentOnboardingStep: number;
  setCurrentOnboardingStep: (step: number) => void;

  // Active tab
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // Addictions
  addictions: Addiction[];
  setAddictions: (addictions: Addiction[]) => void;
  addAddiction: (addiction: Addiction) => void;
  removeAddiction: (id: string) => void;
  selectedAddictionId: string | null;
  setSelectedAddictionId: (id: string | null) => void;

  // Consumptions
  consumptions: Consumption[];
  setConsumptions: (consumptions: Consumption[]) => void;
  addConsumption: (consumption: Consumption) => void;

  // Badges
  badges: Badge[];
  setBadges: (badges: Badge[]) => void;

  // Challenges
  challenges: Challenge[];
  setChallenges: (challenges: Challenge[]) => void;

  // Journal
  journalEntries: JournalEntry[];
  setJournalEntries: (entries: JournalEntry[]) => void;

  // Actions
  dailyActions: DailyAction[];
  setDailyActions: (actions: DailyAction[]) => void;

  // Stats
  stats: Stats | null;
  setStats: (stats: Stats | null) => void;

  // UI State
  isEmergencyMode: boolean;
  setEmergencyMode: (active: boolean) => void;
  showNewEntrySheet: boolean;
  setShowNewEntrySheet: (show: boolean) => void;

  // Hydration
  hydrate: () => Promise<void>;

  // Offline-aware mutation helpers
  addConsumptionOffline: (consumption: Consumption) => void;
  saveJournalOffline: (entry: JournalEntry) => void;
  toggleActionOffline: (action: DailyAction) => void;
  updateUserOffline: (user: Partial<User>) => void;
}

// ===== Store =====

export const useAppStore = create<AppState>((set) => ({
  // User
  user: null,
  setUser: (user) => set({ user }),

  // Onboarding
  currentOnboardingStep: 0,
  setCurrentOnboardingStep: (step) => set({ currentOnboardingStep: step }),

  // Active tab
  activeTab: 'dashboard',
  setActiveTab: (tab) => set({ activeTab: tab }),

  // Addictions
  addictions: [],
  setAddictions: (addictions) => set({ addictions }),
  addAddiction: (addiction) =>
    set((state) => ({ addictions: [...state.addictions, addiction] })),
  removeAddiction: (id) =>
    set((state) => ({
      addictions: state.addictions.filter((a) => a.id !== id),
    })),
  selectedAddictionId: null,
  setSelectedAddictionId: (id) => set({ selectedAddictionId: id }),

  // Consumptions
  consumptions: [],
  setConsumptions: (consumptions) => set({ consumptions }),
  addConsumption: (consumption) =>
    set((state) => ({
      consumptions: [...state.consumptions, consumption],
    })),

  // Badges
  badges: [],
  setBadges: (badges) => set({ badges }),

  // Challenges
  challenges: [],
  setChallenges: (challenges) => set({ challenges }),

  // Journal
  journalEntries: [],
  setJournalEntries: (entries) => set({ journalEntries: entries }),

  // Actions
  dailyActions: [],
  setDailyActions: (actions) => set({ dailyActions: actions }),

  // Stats
  stats: null,
  setStats: (stats) => set({ stats }),

  // UI State
  isEmergencyMode: false,
  setEmergencyMode: (active) => set({ isEmergencyMode: active }),
  showNewEntrySheet: false,
  setShowNewEntrySheet: (show) => set({ showNewEntrySheet: show }),

  // Hydration — offline-first: load from localStorage first, then sync with API
  hydrate: async () => {
    try {
      // First, try to load from localStorage for instant offline experience
      const localUser = offlineStore.getLocalUser();
      const localAddictions = offlineStore.getLocalAddictions();
      const localConsumptions = offlineStore.getLocalConsumptions();
      const localBadges = offlineStore.getLocalBadges();
      const localChallenges = offlineStore.getLocalChallenges();
      const localJournal = offlineStore.getLocalJournalEntries();
      const localActions = offlineStore.getLocalDailyActions();
      const localStats = offlineStore.getLocalStats();

      // Immediately hydrate with local data if available
      if (localUser) {
        set({
          user: localUser,
          addictions: localAddictions || [],
          consumptions: localConsumptions || [],
          badges: localBadges || [],
          challenges: localChallenges || [],
          journalEntries: localJournal || [],
          dailyActions: localActions || [],
          stats: localStats || null,
        });
      }

      // Then try to fetch from API and update both store + localStorage
      const isOnline = navigator.onLine;
      if (isOnline) {
        const [
          userRes,
          addictionsRes,
          consumptionsRes,
          badgesRes,
          challengesRes,
          journalRes,
          actionsRes,
          statsRes,
        ] = await Promise.all([
          fetch(`/api/user?id=${USER_ID}`),
          fetch(`/api/addictions?userId=${USER_ID}`),
          fetch(`/api/consumptions?userId=${USER_ID}`),
          fetch(`/api/badges?userId=${USER_ID}`),
          fetch(`/api/challenges?userId=${USER_ID}`),
          fetch(`/api/journal?userId=${USER_ID}`),
          fetch(`/api/actions?userId=${USER_ID}`),
          fetch(`/api/stats?userId=${USER_ID}`),
        ]);

        const user = await userRes.json().catch(() => null);
        const addictions = await addictionsRes.json().catch(() => []);
        const consumptions = await consumptionsRes.json().catch(() => []);
        const badges = await badgesRes.json().catch(() => []);
        const challenges = await challengesRes.json().catch(() => []);
        const journalEntries = await journalRes.json().catch(() => []);
        const dailyActions = await actionsRes.json().catch(() => []);
        const statsRaw = await statsRes.json().catch(() => null);

        // Transform stats response to match Stats interface
        const overview = statsRaw?.overview;
        const stats = overview
          ? {
              currentStreak: overview.currentStreak ?? 0,
              longestStreak: overview.longestStreak ?? 0,
              totalDaysTracked: overview.totalDaysTracked ?? 0,
              reductionPercentage: overview.avgReductionPercentage ?? 0,
              moneySaved: overview.totalMoneySaved ?? 0,
              moneySpent: overview.totalMoneySpent ?? 0,
              totalPoints: user?.points ?? 0,
              level: user?.level ?? 1,
              todayConsumption: overview.todayConsumption ?? 0,
              weeklyAverage: overview.weeklyAverage ?? 0,
              monthlyAverage: overview.monthlyAverage ?? 0,
            }
          : null;

        // Save to localStorage for offline access
        if (user) offlineStore.setLocalUser(user);
        if (Array.isArray(addictions)) offlineStore.setLocalAddictions(addictions);
        if (Array.isArray(consumptions)) offlineStore.setLocalConsumptions(consumptions);
        if (Array.isArray(badges)) offlineStore.setLocalBadges(badges);
        if (Array.isArray(challenges)) offlineStore.setLocalChallenges(challenges);
        if (Array.isArray(journalEntries)) offlineStore.setLocalJournalEntries(journalEntries);
        if (Array.isArray(dailyActions)) offlineStore.setLocalDailyActions(dailyActions);
        if (stats) offlineStore.setLocalStats(stats);

        set({
          user: user ?? null,
          addictions: Array.isArray(addictions) ? addictions : [],
          consumptions: Array.isArray(consumptions) ? consumptions : [],
          badges: Array.isArray(badges) ? badges : [],
          challenges: Array.isArray(challenges) ? challenges : [],
          journalEntries: Array.isArray(journalEntries) ? journalEntries : [],
          dailyActions: Array.isArray(dailyActions) ? dailyActions : [],
          stats,
        });
      }
    } catch (error) {
      console.error('[hydrate] Failed:', error);
    }
  },

  // Offline-aware mutation helpers
  addConsumptionOffline: (consumption: Consumption) => {
    // Add to store immediately
    set((state) => ({ consumptions: [...state.consumptions, consumption] }));
    // Save locally
    offlineStore.setLocalConsumptions([...useAppStore.getState().consumptions]);
    // Queue for sync if offline
    if (!navigator.onLine) {
      syncQueue.addMutation('POST', '/api/consumptions', consumption);
    }
  },

  saveJournalOffline: (entry: JournalEntry) => {
    // Add to store immediately
    set((state) => ({ journalEntries: [...state.journalEntries, entry] }));
    // Save locally
    offlineStore.setLocalJournalEntries([...useAppStore.getState().journalEntries]);
    // Queue for sync if offline
    if (!navigator.onLine) {
      syncQueue.addMutation('POST', '/api/journal', entry);
    }
  },

  toggleActionOffline: (action: DailyAction) => {
    // Update in store immediately
    set((state) => {
      const exists = state.dailyActions.find((a) => a.id === action.id);
      const updatedActions = exists
        ? state.dailyActions.map((a) => (a.id === action.id ? { ...a, ...action } : a))
        : [...state.dailyActions, action];
      return { dailyActions: updatedActions };
    });
    // Save locally
    offlineStore.setLocalDailyActions([...useAppStore.getState().dailyActions]);
    // Queue for sync if offline
    if (!navigator.onLine) {
      syncQueue.addMutation('PUT', '/api/actions', action);
    }
  },

  updateUserOffline: (userUpdate: Partial<User>) => {
    // Update in store immediately
    set((state) => ({
      user: state.user ? { ...state.user, ...userUpdate } : null,
    }));
    // Save locally
    const updatedUser = useAppStore.getState().user;
    if (updatedUser) offlineStore.setLocalUser(updatedUser);
    // Queue for sync if offline
    if (!navigator.onLine) {
      syncQueue.addMutation('PUT', '/api/user', userUpdate);
    }
  },
}));
