export interface PendingMutation {
  id: string;
  method: 'POST' | 'PUT' | 'DELETE';
  url: string;
  body: any;
  timestamp: number;
}

const QUEUE_KEY = 'libera_sync_queue';

function readQueue(): PendingMutation[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as PendingMutation[];
  } catch {
    return [];
  }
}

function writeQueue(queue: PendingMutation[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // Storage full – silently fail
  }
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function addMutation(method: PendingMutation['method'], url: string, body: any): void {
  const mutation: PendingMutation = {
    id: generateId(),
    method,
    url,
    body,
    timestamp: Date.now(),
  };
  const queue = readQueue();
  queue.push(mutation);
  writeQueue(queue);
}

function getPendingMutations(): PendingMutation[] {
  return readQueue();
}

function removeMutation(id: string): void {
  const queue = readQueue().filter((m) => m.id !== id);
  writeQueue(queue);
}

function clearMutations(): void {
  writeQueue([]);
}

async function processQueue(): Promise<void> {
  const mutations = getPendingMutations();
  if (mutations.length === 0) return;

  for (const mutation of mutations) {
    try {
      const res = await fetch(mutation.url, {
        method: mutation.method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: mutation.method !== 'DELETE' ? JSON.stringify(mutation.body) : undefined,
      });

      if (res.ok) {
        removeMutation(mutation.id);
      }
      // If not ok, keep the mutation in the queue for next retry
    } catch {
      // Network error – keep the mutation, continue with next
    }
  }
}

function startAutoSync(): () => void {
  const handler = () => {
    // Process queue when coming back online
    processQueue();
  };

  window.addEventListener('online', handler);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handler);
  };
}

// ─── Singleton export ────────────────────────────────────────────────

export const syncQueue = {
  addMutation,
  getPendingMutations,
  removeMutation,
  clearMutations,
  processQueue,
  startAutoSync,
};
