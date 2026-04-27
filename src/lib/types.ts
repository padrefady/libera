// ===== Union / Literal Types =====

export type AddictionType =
  | 'TOBACCO'
  | 'ALCOHOL'
  | 'CANNABIS'
  | 'SOCIAL_MEDIA'
  | 'SUGAR'
  | 'PORNOGRAPHY'
  | 'GAMBLING'
  | 'OTHER';

export type AddictionLevel = 'LIGHT' | 'MODERATE' | 'SEVERE';

export type GoalType = 'REDUCE' | 'STOP';

export type ConsumptionContext =
  | 'STRESS'
  | 'BOREDOM'
  | 'SOCIAL'
  | 'HABIT'
  | 'CRAVING'
  | 'OTHER';

export type MoodType = 'GREAT' | 'GOOD' | 'OKAY' | 'BAD' | 'TERRIBLE';

export type ActionType =
  | 'EXERCISE'
  | 'MEDITATION'
  | 'READING'
  | 'BREATHING'
  | 'SPORT'
  | 'HYDRATION';

export type BadgeType =
  | 'ONE_DAY'
  | 'THREE_DAYS'
  | 'SEVEN_DAYS'
  | 'FOURTEEN_DAYS'
  | 'THIRTY_DAYS'
  | 'SIXTY_DAYS'
  | 'NINETY_DAYS'
  | 'HALF_REDUCTION'
  | 'MONEY_SAVED_1000'
  | 'FIRST_CHALLENGE'
  | 'JOURNAL_7_DAYS'
  | 'STREAK_7'
  | 'STREAK_30';

export type ChallengeStatus = 'ACTIVE' | 'COMPLETED' | 'FAILED';

export type ChallengeType =
  | 'REDUCE_50_PERCENT'
  | 'THREE_DAYS_CLEAN'
  | 'SEVEN_DAYS_CLEAN'
  | 'REDUCE_30_PERCENT'
  | 'NO_SPENDING'
  | 'EXERCISE_DAILY';

// ===== Interfaces =====

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  level: number;
  points: number;
  streakDays: number;
  longestStreak: number;
  isOnboarded: boolean;
  motivations: string;
  dailyReminderEnabled: boolean;
  dailyReminderTime: string;
  emergencyModeEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Addiction {
  id: string;
  userId: string;
  name: string;
  type: AddictionType;
  icon: string;
  color: string;
  level: AddictionLevel;
  goalType: GoalType;
  targetQuantity: number;
  unit: string;
  costPerUnit: number;
  startQuantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface Consumption {
  id: string;
  addictionId: string;
  date: string;
  quantity: number;
  time: string;
  context: ConsumptionContext;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Badge {
  id: string;
  userId: string;
  type: BadgeType;
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
}

export interface Challenge {
  id: string;
  userId: string;
  addictionId?: string;
  type: ChallengeType;
  title: string;
  description: string;
  targetDays: number;
  progressDays: number;
  targetReduction?: number;
  currentReduction?: number;
  status: ChallengeStatus;
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  date: string;
  mood: MoodType;
  energyLevel: number;
  stressLevel: number;
  notes?: string;
  cravings: number;
  createdAt: string;
  updatedAt: string;
}

export interface DailyAction {
  id: string;
  userId: string;
  date: string;
  actionType: ActionType;
  completed: boolean;
  duration?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Stats {
  currentStreak: number;
  longestStreak: number;
  totalDaysTracked: number;
  reductionPercentage: number;
  moneySaved: number;
  moneySpent: number;
  totalPoints: number;
  level: number;
  todayConsumption: number;
  weeklyAverage: number;
  monthlyAverage: number;
}

// ===== Constants =====

export const ADDICTION_CONFIGS: Record<
  AddictionType,
  { icon: string; color: string; label: string; unit: string; defaultCost: number }
> = {
  TOBACCO: {
    icon: '🚬',
    color: '#ef4444',
    label: 'Tabac',
    unit: 'cigarettes',
    defaultCost: 250,
  },
  ALCOHOL: {
    icon: '🍺',
    color: '#f97316',
    label: 'Alcool',
    unit: 'verres',
    defaultCost: 500,
  },
  CANNABIS: {
    icon: '🌿',
    color: '#16a34a',
    label: 'Cannabis',
    unit: 'joints',
    defaultCost: 500,
  },
  SOCIAL_MEDIA: {
    icon: '📱',
    color: '#8b5cf6',
    label: 'Réseaux sociaux',
    unit: 'heures',
    defaultCost: 0,
  },
  SUGAR: {
    icon: '🍬',
    color: '#ec4899',
    label: 'Sucre',
    unit: 'morceaux/pieces',
    defaultCost: 50,
  },
  PORNOGRAPHY: {
    icon: '🚫',
    color: '#6b7280',
    label: 'Pornographie',
    unit: 'fois',
    defaultCost: 0,
  },
  GAMBLING: {
    icon: '🎰',
    color: '#eab308',
    label: 'Jeux d\'argent',
    unit: 'sessions',
    defaultCost: 1000,
  },
  OTHER: {
    icon: '❓',
    color: '#6366f1',
    label: 'Autre',
    unit: 'fois',
    defaultCost: 0,
  },
};

export const MOOD_EMOJIS: Record<MoodType, { emoji: string; label: string; color: string }> = {
  GREAT: { emoji: '😊', label: 'Super', color: '#22c55e' },
  GOOD: { emoji: '🙂', label: 'Bien', color: '#84cc16' },
  OKAY: { emoji: '😐', label: 'Neutre', color: '#eab308' },
  BAD: { emoji: '😔', label: 'Pas bien', color: '#f97316' },
  TERRIBLE: { emoji: '😢', label: 'Mal', color: '#ef4444' },
};

export const CONTEXT_LABELS: Record<ConsumptionContext, string> = {
  STRESS: 'Stress',
  BOREDOM: 'Ennui',
  SOCIAL: 'Social',
  HABIT: 'Habitude',
  CRAVING: 'Envie',
  OTHER: 'Autre',
};

export const MOTIVATION_OPTIONS = [
  'Santé',
  'Finances',
  'Famille',
  'Performance',
  'Confiance',
  'Longévité',
  'Liberté',
  'Exemple pour mes enfants',
];

export const ACTION_CONFIGS: Record<ActionType, { icon: string; label: string; color: string }> = {
  EXERCISE: { icon: '💪', label: 'Exercice', color: '#f97316' },
  MEDITATION: { icon: '🧘', label: 'Méditation', color: '#8b5cf6' },
  READING: { icon: '📖', label: 'Lecture', color: '#06b6d4' },
  BREATHING: { icon: '🌬️', label: 'Respiration', color: '#22c55e' },
  SPORT: { icon: '⚽', label: 'Sport', color: '#eab308' },
  HYDRATION: { icon: '💧', label: 'Hydratation', color: '#3b82f6' },
};

export const ENCOURAGEMENT_MESSAGES = [
  'Chaque jour sans est une victoire ! 💪',
  'Tu es plus fort(e) que tu ne le penses !',
  'Un pas à la fois, tu y arriveras ! 🌟',
  'Ta santé te remercie ! ❤️',
  'Continue comme ça, le meilleur est à venir !',
  'Tu as déjà parcouru un long chemin, sois fier(ère) de toi ! 🏆',
  'La rechute n\'est pas un échec, c\'est un apprentissage. Relève-toi ! 🌱',
  'Tes proches sont fiers de tes efforts ! 👨‍👩‍👧‍👦',
  'Chaque minute de résistance renforce ta volonté ! 💎',
  'Aujourd\'hui est un nouveau jour, plein de possibilités ! ☀️',
  'Crois en toi, tu as le pouvoir de changer ! ✨',
  'Le progrès n\'est pas linéaire, continue d\'avancer ! 📈',
  'Tu es un exemple de courage et de détermination ! 🦸',
  'Ta liberté est ta plus grande richesse, protège-la ! 🔓',
  'Les petits pas mènent aux grands changements ! 👣',
  'Respire profondément, tu es capable de surmonter ça ! 🌊',
  'La patience et la persévérance mènent à la victoire ! 🎯',
  'Ton corps et ton esprit te remercient chaque jour ! 🙏',
  'Tu n\'es pas seul(e) dans ce combat, reste fort(e) ! 🤝',
  'Le changement commence par une décision : celle d\'essayer ! 🚀',
];

export const TIPS_BY_ADDICTION: Record<AddictionType, string[]> = {
  TOBACCO: [
    'Bois un grand verre d\'eau quand l\'envie te prend 💧',
    'Mâche un chewing-gum ou des fruits pour remplacer le geste 🍎',
    'Fais une courte marche de 5 minutes pour détourner ton attention 🚶',
    'Évite les situations qui te donnent envie de fumer 🚭',
    'Utilise l\'application de respiration pendant 2 minutes quand l\'envie survient 🌬️',
  ],
  ALCOHOL: [
    'Remplace l\'alcool par des boissons sans alcool lors des soirées 🍹',
    'Trouve des activités alternatives pour les moments de détente 🎨',
    'Parle à un proche de confiance quand tu ressens l\'envie 🗣️',
    'Tiens un journal de tes consommations pour prendre conscience 📓',
    'Fixe-toi des limites claires avant chaque événement social 📋',
  ],
  SOCIAL_MEDIA: [
    'Active le mode sombre et les limites de temps sur ton téléphone ⏱️',
    'Désactive les notifications non essentielles 🔕',
    'Remplace le scroll par 10 minutes de lecture 📖',
    'Laisse ton téléphone dans une autre pièce pendant les repas 🍽️',
    'Utilise un minuteur pour limiter ton temps d\'écran ⏰',
  ],
  SUGAR: [
    'Mange des fruits frais quand tu as envie de sucre 🍓',
    'Privilégie les snacks sains comme les noix et le yaourt 🥜',
    'Lis les étiquettes pour repérer les sucres cachés 🔍',
    'Ne fais pas tes courses quand tu as faim 🛒',
    'Planifie tes repas à l\'avance pour éviter les impulsions 📝',
  ],
  CANNABIS: [
    'L\'envie passe généralement en 15-30 minutes, accroche-toi ! ⏳',
    'Fais du sport ou une marche quand l\'envie se fait sentir 🏃',
    'Éloigne-toi des environnements et des personnes qui te tentent 🚫',
    'Tiens un journal pour identifier tes déclencheurs (stress, ennui, soirée) 📓',
    'Remplace le rituel par une tisane ou un jus de fruits naturel 🍹',
  ],
  PORNOGRAPHY: [
    'Chaque victoire te rapproche de ta liberté ! 💪',
    'Quand l\'envie survient, fais de l\'exercice immédiatement 🏋️',
    'Parle à un thérapeute ou un groupe de soutien 🤝',
    'Installe un bloqueur de contenu sur tes appareils 🛡️',
    'Concentre-toi sur tes objectifs et passions personnelles 🎯',
  ],
  GAMBLING: [
    'Fixe-toi un budget strict et ne le dépasse jamais 💰',
    'Trouve des loisirs qui procurent la même excitation naturellement 🎮',
    'Bloque les sites de jeux d\'argent sur tes appareils 🔒',
    'Parle à un conseiller financier de confiance 🏦',
    'Rappelle-toi que la maison gagne toujours à long terme 🎲',
  ],
  OTHER: [
    'Identifie les déclencheurs de ton comportement 🧠',
    'Trouve une activité de remplacement saine et agréable 🎯',
    'Parles-en à quelqu\'un en qui tu as confiance 🗣️',
    'Célèbre chaque petite victoire pour rester motivé(e) 🎉',
    'Sois patient(e) avec toi-même, le changement prend du temps ⏳',
  ],
};
