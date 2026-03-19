"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import LoadingSpinner from "@/components/LoadingSpinner";
import ScoreBars from "@/components/ScoreBar";
import {
  listReports,
  getScores,
  getReportId,
  type Report,
  type Score,
} from "@/lib/api";

export default function HistoryPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [scores, setScores]   = useState<Record<string, Score | null>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await listReports();
        setReports(data);

        const scoreMap: Record<string, Score | null> = {};
        await Promise.all(
          data.map(async (r) => {
            const rid = getReportId(r.quarter);
            if (rid != null) {
              const s = await getScores(rid);
              scoreMap[r.quarter] = s?.[0] ?? null;
            } else {
              scoreMap[r.quarter] = null;
            }
          })
        );
        setScores(scoreMap);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const preview = (content: string) =>
    content
      .replace(/^#+\s+/gm, "")
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .slice(0, 200)
      .trim();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-12 md:py-14">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <Link href="/" className="hover:text-foreground transition-colors">Dashboard</Link>
              <span>/</span>
              <span className="text-foreground font-medium">History</span>
            </nav>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Report History
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              All finalized quarterly market reports.
            </p>
          </div>
          <Link
            href="/generate"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-90 transition-opacity shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Generate New
          </Link>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-24">
            <LoadingSpinner message="Loading reports…" />
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Empty */}
        {!loading && !error && reports.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">No reports yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Generated reports will appear here.
              </p>
            </div>
            <Link
              href="/generate"
              className="mt-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-90 transition-opacity"
            >
              Generate Report
            </Link>
          </div>
        )}

        {/* Report list */}
        {!loading && !error && reports.length > 0 && (
          <div className="space-y-3">
            {reports.map((r) => {
              const score = scores[r.quarter] ?? null;
              return (
                <div
                  key={r.quarter}
                  className="bg-card border border-border rounded-lg hover:border-foreground/20 transition-colors"
                >
                  <div className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      {/* Left: meta + preview */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">
                            {r.quarter}
                          </span>
                          {r.is_final && (
                            <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium bg-secondary text-secondary-foreground rounded border border-border">
                              Final
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            · Iteration {r.iteration}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-foreground mb-2">
                          Q{r.quarter.slice(1, 2)} {r.quarter.slice(3)} Quarterly Market Report
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {preview(r.content)}…
                        </p>
                      </div>

                      {/* Right: scores + action */}
                      <div className="flex flex-col items-start sm:items-end gap-3 sm:min-w-[200px]">
                        {score ? (
                          <div className="w-full sm:w-auto">
                            <p className="text-xs text-muted-foreground mb-2 sm:text-right">Validation</p>
                            <ScoreBars score={score} compact />
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">No score data</span>
                        )}

                        <Link
                          href={`/report/${r.quarter}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border text-xs font-medium rounded-md hover:bg-muted transition-colors"
                        >
                          View report
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
