import type { Score } from "@/lib/api";

interface ScoreRowProps {
  label: string;
  score: number;
  weight: string;
  maxScore?: number;
}

function ScoreRow({ label, score, weight, maxScore = 100 }: ScoreRowProps) {
  const pct = Math.min(100, Math.max(0, (score / maxScore) * 100));

  const barColor =
    score >= 80
      ? "bg-foreground"
      : score >= 60
      ? "bg-warning"
      : "bg-destructive";

  const textColor =
    score >= 80
      ? "text-foreground"
      : score >= 60
      ? "text-warning"
      : "text-destructive";

  return (
    <div className="flex items-center gap-3">
      {/* Label */}
      <div className="w-36 shrink-0">
        <span className="text-sm text-foreground font-medium">{label}</span>
        <span className="ml-1.5 text-xs text-muted-foreground">({weight})</span>
      </div>

      {/* Bar */}
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Score value */}
      <div className="w-16 text-right shrink-0">
        <span className={`text-sm font-semibold tabular-nums ${textColor}`}>
          {score.toFixed(1)}
        </span>
        <span className="text-xs text-muted-foreground"> / 100</span>
      </div>
    </div>
  );
}

interface ScoreBarsProps {
  score: Score;
  compact?: boolean;
}

export default function ScoreBars({ score, compact = false }: ScoreBarsProps) {
  const totalColor =
    score.total_score >= 80
      ? "text-success"
      : score.total_score >= 60
      ? "text-warning"
      : "text-destructive";

  const passedBadge = score.passed
    ? "bg-success/10 text-success border-success/20"
    : "bg-destructive/10 text-destructive border-destructive/20";

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className={`text-sm font-semibold tabular-nums ${totalColor}`}>
          {score.total_score.toFixed(1)}
        </span>
        <span
          className={`inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded border ${passedBadge}`}
        >
          {score.passed ? "PASSED" : "FAILED"}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <ScoreRow
        label="Numbers Match"
        score={score.numbers_match_score}
        weight="40%"
      />
      <ScoreRow
        label="Tone Match"
        score={score.tone_match_score}
        weight="30%"
      />
      <ScoreRow
        label="Structure"
        score={score.structure_score}
        weight="30%"
      />

      {/* Divider */}
      <div className="border-t border-border pt-3">
        <div className="flex items-center gap-3">
          <div className="w-36 shrink-0">
            <span className="text-sm font-semibold text-foreground">Total</span>
          </div>
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                score.total_score >= 80
                  ? "bg-success"
                  : score.total_score >= 60
                  ? "bg-warning"
                  : "bg-destructive"
              }`}
              style={{ width: `${Math.min(100, score.total_score)}%` }}
            />
          </div>
          <div className="w-16 text-right shrink-0 flex items-center justify-end gap-2">
            <span
              className={`text-sm font-bold tabular-nums ${totalColor}`}
            >
              {score.total_score.toFixed(1)}
            </span>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md border ${passedBadge}`}
          >
            {score.passed ? (
              <>
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                PASSED
              </>
            ) : (
              <>
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                FAILED
              </>
            )}
          </span>

          {score.feedback && (
            <p className="text-xs text-muted-foreground max-w-xs text-right">
              {score.feedback}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
