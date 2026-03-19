"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Sidebar from "@/components/Sidebar";
import MessageBubble from "@/components/MessageBubble";
import ChatInput from "@/components/ChatInput";
import {
  loadThreads,
  saveThreads,
  createThread,
  generateId,
  titleFromMessage,
  type Thread,
  type Message,
} from "@/lib/threads";
import { streamGenerate, stepLabel } from "@/lib/api";

const SUGGESTIONS = [
  "Generate a Q4 2024 market report",
  "How did the S&P 500 perform in Q1 2025?",
  "Summarize recent Federal Reserve decisions",
  "What are the key ACWI trends this year?",
];

export default function ChatPage() {
  const [threads, setThreads]         = useState<Thread[]>([]);
  const [activeId, setActiveId]       = useState<string | null>(null);
  const [input, setInput]             = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sending, setSending]         = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setThreads(loadThreads());
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeId, threads]);

  const activeThread = threads.find((t) => t.id === activeId) ?? null;

  // ── Helpers ───────────────────────────────────────────────────────────────

  function updateThreads(updated: Thread[]) {
    setThreads(updated);
    saveThreads(updated);
  }

  function newChat() {
    setActiveId(null);
    setInput("");
    setSidebarOpen(false);
  }

  function selectThread(id: string) {
    setActiveId(id);
    setInput("");
  }

  function deleteThread(id: string) {
    updateThreads(threads.filter((t) => t.id !== id));
    if (activeId === id) setActiveId(null);
  }

  function clearAllThreads() {
    updateThreads([]);
    setActiveId(null);
  }

  // ── Send ──────────────────────────────────────────────────────────────────

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;

    setSending(true);
    setInput("");

    // Resolve or create thread
    let thread: Thread;
    let isNew = false;

    if (activeId) {
      thread = { ...threads.find((t) => t.id === activeId)! };
    } else {
      thread = createThread();
      isNew = true;
    }

    const threadId = thread.id;

    // Optimistic: user + loading placeholder
    const userMsg: Message = {
      id: generateId(), role: "user", content: text,
      timestamp: new Date().toISOString(),
    };
    const loadingId = generateId();
    const loadingMsg: Message = {
      id: loadingId, role: "assistant", content: "",
      timestamp: new Date().toISOString(), loading: true,
    };
    const withUser: Thread = {
      ...thread,
      title: thread.messages.length === 0 ? titleFromMessage(text) : thread.title,
      messages: [...thread.messages, userMsg, loadingMsg],
    };

    if (isNew) {
      setThreads((prev) => [withUser, ...prev]);
      setActiveId(threadId);
    } else {
      setThreads((prev) => prev.map((t) => t.id === threadId ? withUser : t));
    }

    // Replace loading message with final message and persist
    function finalise(final: Partial<Message>) {
      setThreads((prev) => {
        const updated = prev.map((t) =>
          t.id !== threadId ? t : {
            ...t,
            messages: t.messages.map((m) =>
              m.id === loadingId
                ? { ...m, loading: false, steps: undefined, ...final }
                : m
            ),
          }
        );
        saveThreads(updated);
        return updated;
      });
    }

    try {
      for await (const event of streamGenerate(text, thread.backendThreadId)) {
        if (event.type === "resolved" && event.thread_id) {
          setThreads((prev) => prev.map((t) =>
            t.id === threadId ? { ...t, backendThreadId: event.thread_id } : t
          ));
        } else if (event.type === "step") {
          const { node, data } = event;

          // Supervisor sent a chat reply → treat as conversational, stop pipeline UI
          if (node === "supervisor" && data.chat_reply) {
            finalise({ content: data.chat_reply as string });
            return;
          }

          // Append step label and yield to browser so React renders it
          setThreads((prev) =>
            prev.map((t) =>
              t.id !== threadId ? t : {
                ...t,
                messages: t.messages.map((m) =>
                  m.id === loadingId
                    ? { ...m, steps: [...(m.steps ?? []), stepLabel(node)] }
                    : m
                ),
              }
            )
          );
          await new Promise((r) => setTimeout(r, 0));
        } else if (event.type === "complete") {
          if (event.thread_id) {
            setThreads((prev) => prev.map((t) =>
              t.id === threadId ? { ...t, backendThreadId: event.thread_id } : t
            ));
          }
          if (event.chat_reply && !event.report) {
            finalise({ content: event.chat_reply });
          } else {
            finalise({
              content:     event.report,
              report:      event.report || undefined,
              market_data: event.market_data,
            });
          }
          break;
        } else if (event.type === "error") {
          finalise({ content: event.message, error: true });
          break;
        }
      }
    } catch (err) {
      finalise({ content: (err as Error).message, error: true });
    } finally {
      setSending(false);
    }
  }, [input, sending, activeId, threads]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar
        threads={threads}
        activeId={activeId}
        onNewChat={newChat}
        onSelect={selectThread}
        onDelete={deleteThread}
        onClearAll={clearAllThreads}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex flex-col flex-1 min-w-0 relative">
        {/* Top bar */}
        <header className="flex items-center gap-3 h-14 px-4 border-b border-border bg-card shrink-0">
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            title="Toggle sidebar"
            className="lg:hidden p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <Image
            src="/aimax_icon.jpeg"
            alt="Aimax"
            width={28}
            height={28}
            className="rounded-md shrink-0"
            style={{ width: "auto", height: "28px" }}
          />

          <div className="flex-1 min-w-0">
            {activeThread && (
              <p className="text-sm font-medium text-foreground truncate">{activeThread.title}</p>
            )}
          </div>

          <button
            onClick={newChat}
            className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New chat
          </button>
        </header>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto">
          {!activeThread ? (
            <div className="flex flex-col items-center justify-center h-full px-4 pb-8 gap-0">
              <Image
                src="/aimax_logo.png"
                alt="Aimax"
                width={400}
                height={150}
                className="rounded-2xl"
                style={{ marginBottom: "-130px" }}
                priority
              />
              <h1 className="text-xl font-semibold text-foreground" style={{ marginBottom: "2px" }}>
                How can I help you today?
              </h1>
              <p className="text-sm text-muted-foreground mb-8 text-center max-w-xs">
                Ask about market reports, generate quarterly analysis, or explore financial data.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-xl">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setInput(s)}
                    className="text-left px-4 py-3 text-sm text-muted-foreground bg-card border border-border rounded-xl hover:border-foreground/20 hover:text-foreground transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
              {activeThread.messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="shrink-0 px-4 pb-5 pt-3 bg-background">
          <ChatInput
            value={input}
            onChange={setInput}
            onSend={send}
            disabled={sending}
          />
        </div>
      </div>
    </div>
  );
}
