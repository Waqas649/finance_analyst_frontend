"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Thread } from "@/lib/threads";
import { groupThreadsByDate } from "@/lib/threads";

interface SidebarProps {
  threads: Thread[];
  activeId: string | null;
  onNewChat: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({
  threads,
  activeId,
  onNewChat,
  onSelect,
  onDelete,
  onClearAll,
  open,
  onClose,
}: SidebarProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const groups = groupThreadsByDate([...threads].reverse());

  useEffect(() => {
    const stored = localStorage.getItem("sidebar_collapsed");
    if (stored === "true") setCollapsed(true);
  }, []);

  function toggleCollapse() {
    setCollapsed((c) => {
      localStorage.setItem("sidebar_collapsed", String(!c));
      return !c;
    });
  }

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-30 flex flex-col bg-secondary border-r border-border
          transition-all duration-200 overflow-hidden
          ${open ? "translate-x-0" : "-translate-x-full"}
          lg:relative lg:translate-x-0 lg:z-auto
          ${collapsed ? "lg:w-12" : "lg:w-64"}
          w-64
        `}
      >
        {/* Header */}
        <div className="flex items-center px-2.5 pt-3 pb-2 gap-2 shrink-0">
          {/* Hamburger — collapses/expands on desktop */}
          <button
            onClick={toggleCollapse}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden lg:flex p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-border transition-colors shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Expanded: new chat button */}
          {!collapsed && (
            <button
              onClick={onNewChat}
              title="New conversation"
              className="ml-auto p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-border transition-colors shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}
        </div>

        {/* Collapsed: new chat button below hamburger */}
        {collapsed && (
          <div className="hidden lg:flex justify-center px-2 pt-0.5 pb-2">
            <button
              onClick={() => { onNewChat(); onClose(); }}
              title="New conversation"
              className="flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-border transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        )}

        {/* Thread list */}
        {!collapsed && (
          <div className="flex-1 overflow-y-auto px-2 py-1 space-y-4 min-h-0">
            {groups.length === 0 && (
              <p className="px-2 py-4 text-xs text-muted-foreground text-center">
                No conversations yet
              </p>
            )}
            {groups.map(({ label, threads: groupThreads }) => (
              <div key={label}>
                <p className="px-2 mb-1 text-xs font-medium text-muted-foreground">{label}</p>
                <ul className="space-y-0.5">
                  {groupThreads.map((t) => (
                    <li key={t.id} className="relative">
                      <button
                        onClick={() => { onSelect(t.id); onClose(); }}
                        onMouseEnter={() => setHoveredId(t.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        className={`w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors ${
                          activeId === t.id
                            ? "bg-card text-foreground font-medium"
                            : "text-muted-foreground hover:bg-border hover:text-foreground"
                        }`}
                      >
                        <span className="block truncate">{t.title}</span>
                        {t.backendThreadId && (
                          <span className="block text-[10px] font-mono text-muted-foreground/60 truncate">
                            {t.backendThreadId.slice(0, 8)}…
                          </span>
                        )}
                      </button>
                      {(hoveredId === t.id || activeId === t.id) && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onDelete(t.id); }}
                          title="Delete"
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded text-muted-foreground hover:text-destructive hover:bg-border transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {collapsed && <div className="flex-1" />}

        {/* Footer */}
        <div className="shrink-0 border-t border-border px-2 py-2 space-y-0.5">
          {!collapsed && threads.length > 0 && (
            <button
              onClick={() => { if (confirm("Clear all conversations?")) { onClearAll(); onClose(); } }}
              className="w-full flex items-center gap-2.5 px-2 py-2 rounded-md text-sm text-muted-foreground hover:bg-border hover:text-destructive transition-colors"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Clear all</span>
            </button>
          )}
          <Link
            href="/templates"
            onClick={onClose}
            title="Templates"
            className={`flex items-center gap-2.5 px-2 py-2 rounded-md text-sm transition-colors ${
              pathname === "/templates"
                ? "bg-card text-foreground font-medium"
                : "text-muted-foreground hover:bg-border hover:text-foreground"
            }`}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {!collapsed && <span>Templates</span>}
          </Link>
        </div>
      </aside>
    </>
  );
}
