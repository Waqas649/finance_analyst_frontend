"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Message } from "@/lib/threads";

interface MarketData {
  quarter?: string;
  year?: number;
  acwi_return?: number;
  acwi_ytd?: number;
  sp500_return?: number;
  sp500_ytd?: number;
  sp500_record_highs_ytd?: number;
  sp500_win_streak?: number;
}

function fmt(n?: number) {
  if (n == null) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

function MarketDataBar({ data }: { data: MarketData }) {
  const items = [
    { label: "ACWI",          value: fmt(data.acwi_return)  },
    { label: "ACWI YTD",      value: fmt(data.acwi_ytd)     },
    { label: "S&P 500",       value: fmt(data.sp500_return) },
    { label: "S&P 500 YTD",   value: fmt(data.sp500_ytd)    },
    { label: "Record Highs",  value: data.sp500_record_highs_ytd != null ? String(data.sp500_record_highs_ytd) : "—" },
    { label: "Win Streak",    value: data.sp500_win_streak   != null ? String(data.sp500_win_streak)            : "—" },
  ].filter((item) => item.value !== "—");

  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 py-1">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col items-center px-3 py-1.5 bg-muted border border-border rounded-lg min-w-[72px]">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{item.label}</span>
          <span className={`text-sm font-semibold tabular-nums ${
            item.value.startsWith("+") ? "text-success" :
            item.value.startsWith("-") ? "text-destructive" : "text-foreground"
          }`}>{item.value}</span>
        </div>
      ))}
    </div>
  );
}

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const [reportOpen, setReportOpen] = useState(true);
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%] px-4 py-2.5 bg-primary text-primary-foreground rounded-2xl rounded-tr-sm text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </div>
      </div>
    );
  }

  // Assistant
  return (
    <div className="flex gap-3">
      {/* Avatar */}
      <div className="shrink-0 w-7 h-7 rounded-full bg-primary flex items-center justify-center mt-0.5">
        <span className="text-primary-foreground text-xs font-bold">B</span>
      </div>

      <div className="flex-1 min-w-0 pt-0.5 space-y-3">

        {/* Loading / step progress */}
        {message.loading && (
          <div className="py-1 space-y-1.5">
            {message.steps && message.steps.length > 0 ? (
              message.steps.map((step, i) => {
                const isLast = i === message.steps!.length - 1;
                return (
                  <div key={i} className={`flex items-center gap-2 text-xs ${isLast ? "text-foreground" : "text-muted-foreground"}`}>
                    {isLast ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-foreground animate-pulse shrink-0" />
                    ) : (
                      <svg className="w-3 h-3 text-success shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                    {step}
                  </div>
                );
              })
            ) : (
              <div className="flex items-center gap-1 py-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {!message.loading && message.error && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{message.content}</span>
          </div>
        )}

        {/* Normal response */}
        {!message.loading && !message.error && (
          <>
            {/* Market data tiles */}
            {message.market_data && (
              <MarketDataBar data={message.market_data as MarketData} />
            )}

            {/* Text / conversational content */}
            {message.content && !message.report && (
              <div className="prose-report text-sm">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.content}
                </ReactMarkdown>
              </div>
            )}

            {/* Report collapsible */}
            {message.report && (
              <div className="border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => setReportOpen((o) => !o)}
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-muted hover:bg-border transition-colors text-sm font-medium text-foreground"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {(() => {
                      const md = message.market_data as MarketData | undefined;
                      return md?.quarter ? `${md.quarter} ${md.year}` : "View report";
                    })()}
                  </span>
                  <svg
                    className={`w-4 h-4 text-muted-foreground transition-transform ${reportOpen ? "rotate-180" : ""}`}
                    fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {reportOpen && (
                  <div className="px-5 py-4 bg-card">
                    <div className="prose-report text-sm">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.report}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
