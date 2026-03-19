export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  report?: string;
  market_data?: unknown;
  total_score?: number;
  steps?: string[];       // live agent step labels during streaming
  timestamp: string;
  loading?: boolean;
  error?: boolean;
}

export interface Thread {
  id: string;
  title: string;
  backendThreadId?: string;  // from backend's resolved/complete events
  createdAt: string;
  messages: Message[];
}

const STORAGE_KEY = "chat_threads";

export function loadThreads(): Thread[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function saveThreads(threads: Thread[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
  } catch {}
}

export function createThread(): Thread {
  return {
    id: crypto.randomUUID(),
    title: "New conversation",
    createdAt: new Date().toISOString(),
    messages: [],
  };
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function titleFromMessage(content: string): string {
  return content.slice(0, 60).trim() + (content.length > 60 ? "…" : "");
}

export function groupThreadsByDate(
  threads: Thread[]
): { label: string; threads: Thread[] }[] {
  const now = new Date();
  const today     = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86_400_000);
  const last7     = new Date(today.getTime() - 7  * 86_400_000);
  const last30    = new Date(today.getTime() - 30 * 86_400_000);

  const groups: Record<string, Thread[]> = {
    Today: [], Yesterday: [], "Previous 7 days": [], "Previous 30 days": [], Older: [],
  };

  for (const t of threads) {
    const d = new Date(t.createdAt);
    if      (d >= today)     groups["Today"].push(t);
    else if (d >= yesterday) groups["Yesterday"].push(t);
    else if (d >= last7)     groups["Previous 7 days"].push(t);
    else if (d >= last30)    groups["Previous 30 days"].push(t);
    else                     groups["Older"].push(t);
  }

  return Object.entries(groups)
    .filter(([, ts]) => ts.length > 0)
    .map(([label, ts]) => ({ label, threads: ts }));
}
