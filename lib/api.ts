const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ─── SSE event types ──────────────────────────────────────────────────────────

export type SSEEvent =
  | { type: "resolved";  quarter: string; year: number; thread_id: string }
  | { type: "step";      node: string; data: Record<string, unknown> }
  | { type: "complete";  status: string; thread_id: string; quarter: string; year: number; report: string; market_data?: unknown; chat_reply: string }
  | { type: "error";     message: string };

const STEP_LABELS: Record<string, string> = {
  supervisor:     "Analyzing request…",
  data_collector: "Collecting market data…",
  news_researcher:"Fetching news…",
  writer:         "Writing report…",
  critiquer:      "Reviewing report…",
};

export function stepLabel(node: string): string {
  return STEP_LABELS[node] ?? node;
}

// ─── Generate (SSE stream) ────────────────────────────────────────────────────

export async function* streamGenerate(
  prompt: string,
  backendThreadId?: string
): AsyncGenerator<SSEEvent> {
  const body: Record<string, unknown> = { prompt, max_iterations: 12 };
  if (backendThreadId) body.thread_id = backendThreadId;

  const res = await fetch(`${BASE_URL}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail ?? `HTTP ${res.status}`);
  }

  const reader  = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer    = "";
  let eventType = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (line.startsWith("event:")) {
        eventType = line.slice(6).trim();
      } else if (line.startsWith("data:") && eventType) {
        try {
          const data = JSON.parse(line.slice(5).trim());
          if (eventType === "resolved") {
            yield { type: "resolved", quarter: data.quarter, year: data.year, thread_id: data.thread_id ?? "" };
          } else if (eventType === "step") {
            yield { type: "step", node: data.node, data: data.data ?? {} };
          } else if (eventType === "complete") {
            yield { type: "complete", ...data };
          } else if (eventType === "error") {
            yield { type: "error", message: data.message ?? "Unknown error" };
          }
        } catch {
          // malformed JSON — skip
        }
        eventType = "";
      }
    }
  }
}

// ─── Templates ────────────────────────────────────────────────────────────────

const API = `${BASE_URL}/api/v1`;

export interface Template {
  id: number;
  name: string;
  user_message: string;
  assistant_response: string;
  created_at?: string;
}

export interface TemplatePayload {
  name: string;
  user_message: string;
  assistant_response: string;
}

export async function listTemplates(): Promise<Template[]> {
  const res = await fetch(`${API}/templates`);
  if (!res.ok) throw new Error(`Failed to fetch templates: HTTP ${res.status}`);
  return res.json();
}

export async function createTemplate(payload: TemplatePayload): Promise<Template> {
  const res = await fetch(`${API}/templates`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export async function updateTemplate(id: number, payload: TemplatePayload): Promise<Template> {
  const res = await fetch(`${API}/templates/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export async function deleteTemplate(id: number): Promise<void> {
  const res = await fetch(`${API}/templates/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Failed to delete template: HTTP ${res.status}`);
}
