"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Navbar from "@/components/Navbar";
import LoadingSpinner from "@/components/LoadingSpinner";
import ScoreBars from "@/components/ScoreBar";
import { getReport, getScores, getReportId, type Report, type Score } from "@/lib/api";

export default function ReportPage() {
  const { quarter } = useParams<{ quarter: string }>();
  const [report, setReport]   = useState<Report | null>(null);
  const [scores, setScores]   = useState<Score | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!quarter) return;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const data = await getReport(quarter);
        if (!data) {
          setError("No report found for this quarter.");
          return;
        }
        setReport(data);

        // Try to fetch scores if we have a stored report_id
        const rid = getReportId(quarter);
        if (rid != null) {
          const scoreData = await getScores(rid);
          setScores(scoreData?.[0] ?? null);
        }
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [quarter]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-12 py-12 md:py-14">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-8">
          <Link href="/" className="hover:text-foreground transition-colors">Dashboard</Link>
          <span>/</span>
          <Link href="/history" className="hover:text-foreground transition-colors">History</Link>
          <span>/</span>
          <span className="text-foreground font-medium font-mono">{quarter}</span>
        </nav>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-24">
            <LoadingSpinner message="Loading report…" />
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="space-y-4">
            <div className="p-5 bg-destructive/5 border border-destructive/20 rounded-lg">
              <p className="text-sm font-semibold text-destructive mb-1">Report not found</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
            <Link
              href="/history"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back to history
            </Link>
          </div>
        )}

        {/* Report */}
        {!loading && !error && report && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                    {report.quarter}
                  </span>
                  {report.is_final && (
                    <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium bg-secondary text-secondary-foreground rounded border border-border">
                      Final
                    </span>
                  )}
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Q{report.quarter.slice(1, 2)} {report.quarter.slice(3)} Market Report
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Iteration {report.iteration} · AI-generated quarterly analysis
                </p>
              </div>
              <Link
                href="/generate"
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 border border-border text-sm font-medium rounded-md hover:bg-muted transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                New Report
              </Link>
            </div>

            {/* Scores */}
            {scores && (
              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-sm font-semibold text-foreground mb-4">
                  Validation Scores
                </h2>
                <ScoreBars score={scores} />
              </div>
            )}

            {/* Report content */}
            <div className="bg-card border border-border rounded-lg p-6 sm:p-8">
              <div className="prose-report">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {report.content}
                </ReactMarkdown>
              </div>
            </div>

            {/* Back link */}
            <Link
              href="/history"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back to history
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
