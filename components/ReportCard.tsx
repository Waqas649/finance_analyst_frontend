import Link from "next/link";
import type { Report, Score } from "@/lib/api";
import ScoreBars from "./ScoreBar";

interface ReportCardProps {
  report: Report;
  score?: Score | null;
  showPreview?: boolean;
}

export default function ReportCard({
  report,
  score,
  showPreview = false,
}: ReportCardProps) {
  const preview = report.content
    .replace(/^#+\s+/gm, "")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .slice(0, 160)
    .trim();

  return (
    <div className="group relative bg-card border border-border rounded-lg p-5 hover:border-foreground/20 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">
              {report.quarter}
            </span>
            {report.is_final && (
              <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium bg-secondary text-secondary-foreground rounded border border-border">
                Final
              </span>
            )}
          </div>
          <h3 className="text-sm font-semibold text-foreground leading-snug">
            Q{report.quarter.slice(1, 2)} {report.quarter.slice(3)} Quarterly Report
          </h3>
        </div>

        {/* Score badge (compact) */}
        {score && <ScoreBars score={score} compact />}
        {!score && (
          <span className="text-xs text-muted-foreground">No score</span>
        )}
      </div>

      {/* Preview */}
      {showPreview && (
        <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
          {preview}…
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <span className="text-xs text-muted-foreground">
          Iteration {report.iteration}
        </span>
        <Link
          href={`/report/${report.quarter}`}
          className="text-xs font-medium text-foreground hover:underline underline-offset-2"
        >
          View report →
        </Link>
      </div>
    </div>
  );
}
