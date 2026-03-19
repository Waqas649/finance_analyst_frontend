"use client";

import { useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Navbar from "@/components/Navbar";
import LoadingSpinner from "@/components/LoadingSpinner";
import ScoreBars from "@/components/ScoreBar";
import {
  generateReport,
  getScores,
  saveReportId,
  isValidQuarter,
  type GenerateResponse,
  type Score,
  type LLMProvider,
} from "@/lib/api";

const QUARTERS = ["Q1", "Q2", "Q3", "Q4"];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - 2 + i);

const LLM_OPTIONS: { value: LLMProvider; label: string; note: string }[] = [
  { value: "groq",   label: "Groq",   note: "Default · Fast · Cloud"  },
  { value: "gemini", label: "Gemini", note: "Cloud · Needs API key"   },
  { value: "ollama", label: "Ollama", note: "Local · No key · Slower" },
];

type Step = "form" | "loading" | "result" | "error";

export default function GeneratePage() {
  const [quarter, setQuarter] = useState("Q4");
  const [year, setYear]       = useState(String(CURRENT_YEAR - 1));
  const [llm, setLlm]         = useState<LLMProvider>("groq");
  const [step, setStep]       = useState<Step>("form");
  const [result, setResult]   = useState<GenerateResponse | null>(null);
  const [scores, setScores]   = useState<Score | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const quarterValue = `${quarter}_${year}`;
  const isValid = isValidQuarter(quarterValue);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;

    setStep("loading");
    setResult(null);
    setScores(null);
    setErrorMsg(null);

    try {
      const data = await generateReport(quarterValue, llm);
      setResult(data);

      // Fetch scores if we got a report_id
      if (data.report_id != null) {
        saveReportId(quarterValue, data.report_id);
        const scoreData = await getScores(data.report_id);
        setScores(scoreData?.[0] ?? null);
      }

      setStep("result");
    } catch (err) {
      setErrorMsg((err as Error).message);
      setStep("error");
    }
  }

  function reset() {
    setStep("form");
    setResult(null);
    setScores(null);
    setErrorMsg(null);
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-12 py-12 md:py-14">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-8">
          <Link href="/" className="hover:text-foreground transition-colors">Dashboard</Link>
          <span>/</span>
          <span className="text-foreground font-medium">Generate</span>
        </nav>

        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Generate Report
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Select a quarter and run the AI pipeline to produce a new market report.
          </p>
        </div>

        {/* ── FORM ── */}
        {(step === "form" || step === "error") && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6 space-y-6">
              {/* Quarter selector */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Quarter
                </label>
                <div className="flex gap-2">
                  <div className="relative">
                    <select
                      value={quarter}
                      onChange={(e) => setQuarter(e.target.value)}
                      className="appearance-none bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground pr-8 focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      {QUARTERS.map((q) => (
                        <option key={q} value={q}>{q}</option>
                      ))}
                    </select>
                    <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>

                  <div className="relative">
                    <select
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className="appearance-none bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground pr-8 focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      {YEARS.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                    <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>

                  <div className="flex items-center px-3 py-2 bg-muted rounded-md border border-border">
                    <span className="text-sm font-mono text-foreground">{quarterValue}</span>
                    {isValid
                      ? <svg className="ml-2 w-3.5 h-3.5 text-success" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      : <svg className="ml-2 w-3.5 h-3.5 text-destructive" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    }
                  </div>
                </div>
              </div>

              {/* LLM selector */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  LLM Provider
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {LLM_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setLlm(opt.value)}
                      className={`flex flex-col items-start px-3 py-2.5 rounded-md border text-left transition-colors ${
                        llm === opt.value
                          ? "border-foreground bg-secondary"
                          : "border-border hover:border-foreground/30"
                      }`}
                    >
                      <span className="text-sm font-medium text-foreground">{opt.label}</span>
                      <span className="text-xs text-muted-foreground mt-0.5">{opt.note}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Error from previous attempt */}
            {step === "error" && errorMsg && (
              <div className="flex items-start gap-2 p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
                <svg className="w-4 h-4 text-destructive mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-destructive">Generation failed</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{errorMsg}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={!isValid}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                </svg>
                Run Pipeline
              </button>
              <p className="text-xs text-muted-foreground">
                ~10–30 seconds · live data
              </p>
            </div>
          </form>
        )}

        {/* ── LOADING ── */}
        {step === "loading" && (
          <div className="bg-card border border-border rounded-lg">
            <div className="flex flex-col items-center justify-center py-24 gap-6">
              <LoadingSpinner size="lg" />
              <div className="text-center space-y-1.5">
                <p className="text-sm font-semibold text-foreground">
                  AI agents are working…
                </p>
                <p className="text-sm text-muted-foreground">
                  Fetching live market data, running analysis, validating output.
                </p>
                <p className="text-xs text-muted-foreground">
                  Estimated time: 10–30 seconds
                </p>
              </div>
              <div className="flex flex-col items-center gap-1.5 mt-2">
                {[
                  "Fetching yfinance / FRED data",
                  "Running LangGraph pipeline",
                  "Validating report quality",
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse" style={{ animationDelay: `${i * 0.3}s` }} />
                    <span className="text-xs text-muted-foreground">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── RESULT ── */}
        {step === "result" && result && (
          <div className="space-y-6">
            {/* Status banner */}
            {result.status === "done" ? (
              <div className="flex items-center gap-3 p-4 bg-success/5 border border-success/20 rounded-lg">
                <svg className="w-5 h-5 text-success shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-success">Report generated successfully</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{result.message}</p>
                </div>
                <Link
                  href={`/report/${result.quarter}`}
                  className="shrink-0 text-xs font-medium text-foreground border border-border rounded-md px-3 py-1.5 hover:bg-muted transition-colors"
                >
                  Full page →
                </Link>
              </div>
            ) : (
              <div className="flex items-start gap-3 p-4 bg-warning/5 border border-warning/20 rounded-lg">
                <svg className="w-5 h-5 text-warning shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-warning">Flagged for human review</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{result.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    The draft report is shown below. Please review before using.
                  </p>
                </div>
              </div>
            )}

            {/* Score breakdown */}
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
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
                <div>
                  <h2 className="text-base font-semibold text-foreground">
                    {result.quarter.replace("_", " ")} Market Report
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Generated just now
                  </p>
                </div>
                <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-md border ${
                  result.status === "done"
                    ? "bg-success/10 text-success border-success/20"
                    : "bg-warning/10 text-warning border-warning/20"
                }`}>
                  {result.status === "done" ? "Final" : "Draft"}
                </span>
              </div>

              <div className="prose-report">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {result.report}
                </ReactMarkdown>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={reset}
                className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-90 transition-opacity"
              >
                Generate Another
              </button>
              <Link
                href="/"
                className="px-4 py-2 border border-border text-sm font-medium rounded-md hover:bg-muted transition-colors"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
