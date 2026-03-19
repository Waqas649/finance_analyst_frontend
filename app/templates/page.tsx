"use client";

import { useState, useEffect } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
import Sidebar from "@/components/Sidebar";
import {
  listTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  type Template,
  type TemplatePayload,
} from "@/lib/api";
import { loadThreads, type Thread } from "@/lib/threads";

const EMPTY_FORM: TemplatePayload = {
  name: "",
  user_message: "",
  assistant_response: "",
};

export default function TemplatesPage() {
  const [threads, setThreads]         = useState<Thread[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [templates, setTemplates]     = useState<Template[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm]       = useState(false);
  const [editingId, setEditingId]     = useState<number | null>(null);
  const [form, setForm]               = useState<TemplatePayload>(EMPTY_FORM);
  const [saving, setSaving]           = useState(false);
  const [formError, setFormError]     = useState<string | null>(null);

  // Deleting
  const [deletingId, setDeletingId]   = useState<number | null>(null);

  useEffect(() => {
    setThreads(loadThreads());
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setTemplates(await listTemplates());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function openNew() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setShowForm(true);
  }

  function openEdit(t: Template) {
    setEditingId(t.id);
    setForm({ name: t.name, user_message: t.user_message, assistant_response: t.assistant_response });
    setFormError(null);
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.user_message.trim() || !form.assistant_response.trim()) {
      setFormError("All fields are required.");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      if (editingId != null) {
        const updated = await updateTemplate(editingId, form);
        setTemplates((prev) => prev.map((t) => (t.id === editingId ? updated : t)));
      } else {
        const created = await createTemplate(form);
        setTemplates((prev) => [created, ...prev]);
      }
      cancelForm();
    } catch (e) {
      setFormError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    setDeletingId(id);
    try {
      await deleteTemplate(id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar
        threads={threads}
        activeId={null}
        onNewChat={() => { window.location.href = "/"; }}
        onSelect={(id) => { window.location.href = `/?thread=${id}`; }}
        onDelete={() => {}}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
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
          <p className="text-sm font-medium text-foreground">Templates</p>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
            {/* Page header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-lg font-semibold text-foreground">Few-shot Templates</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Example input/output pairs stored in the database and used to guide the AI's responses.
                </p>
              </div>
              {!showForm && (
                <button
                  onClick={openNew}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-90 transition-opacity shrink-0"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Add Template
                </button>
              )}
            </div>

            {/* Add / Edit form */}
            {showForm && (
              <div className="bg-card border border-border rounded-lg p-5 space-y-4">
                <h2 className="text-sm font-semibold text-foreground">
                  {editingId != null ? "Edit template" : "New template"}
                </h2>

                {/* Name */}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Name
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Market Overview Style"
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>

                {/* User message */}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    User message <span className="text-muted-foreground">(example input)</span>
                  </label>
                  <textarea
                    value={form.user_message}
                    onChange={(e) => setForm((f) => ({ ...f, user_message: e.target.value }))}
                    placeholder="e.g. Generate a brief market overview for Q3 2024"
                    rows={3}
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-y"
                  />
                </div>

                {/* Assistant response */}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Assistant response <span className="text-muted-foreground">(expected output)</span>
                  </label>
                  <textarea
                    value={form.assistant_response}
                    onChange={(e) => setForm((f) => ({ ...f, assistant_response: e.target.value }))}
                    placeholder="e.g. ## Overview&#10;&#10;The third quarter of 2024 saw..."
                    rows={6}
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-y font-mono"
                  />
                </div>

                {/* Form error */}
                {formError && (
                  <p className="text-xs text-destructive">{formError}</p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {saving && (
                      <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    )}
                    {editingId != null ? "Save changes" : "Create template"}
                  </button>
                  <button
                    onClick={cancelForm}
                    disabled={saving}
                    className="px-4 py-2 border border-border text-sm font-medium rounded-md hover:bg-muted transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="flex justify-center py-16">
                <LoadingSpinner message="Loading templates…" />
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Empty */}
            {!loading && !error && templates.length === 0 && !showForm && (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">No templates yet</p>
                  <p className="text-sm text-muted-foreground mt-0.5">Add your first few-shot example to guide the AI.</p>
                </div>
                <button
                  onClick={openNew}
                  className="mt-1 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-90 transition-opacity"
                >
                  Add Template
                </button>
              </div>
            )}

            {/* Template list */}
            {!loading && !error && templates.length > 0 && (
              <div className="space-y-3">
                {templates.map((t) => (
                  <div key={t.id} className="bg-card border border-border rounded-lg overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-foreground shrink-0" />
                        <span className="text-sm font-medium text-foreground truncate">{t.name}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => openEdit(t)}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          title="Edit"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(t.id)}
                          disabled={deletingId === t.id}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-muted transition-colors disabled:opacity-40"
                          title="Delete"
                        >
                          {deletingId === t.id ? (
                            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                          ) : (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Body — two-column preview */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
                      <div className="px-5 py-4">
                        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                          User message
                        </p>
                        <p className="text-sm text-foreground whitespace-pre-wrap line-clamp-4">
                          {t.user_message}
                        </p>
                      </div>
                      <div className="px-5 py-4">
                        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                          Assistant response
                        </p>
                        <p className="text-sm text-foreground font-mono whitespace-pre-wrap line-clamp-4">
                          {t.assistant_response}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
