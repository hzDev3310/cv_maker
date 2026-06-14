import { PieChart, Pie, Cell } from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ScoreGauge from "./ScoreGauge";

function formatTime(ts) {
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function DonutScore({ score, size = 80 }) {
  const color = score < 50 ? "#dc2626" : score < 75 ? "#ea580c" : "#16a34a";
  const data = [{ value: score }, { value: Math.max(0, 100 - score) }];
  const half = size / 2;
  const innerR = size * 0.28;
  const outerR = size * 0.42;
  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <PieChart width={size} height={size}>
        <Pie
          data={data}
          cx={half}
          cy={half}
          innerRadius={innerR}
          outerRadius={outerR}
          startAngle={90}
          endAngle={-270}
          dataKey="value"
          strokeWidth={0}
        >
          <Cell fill={color} />
          <Cell fill="#e5e1e7" />
        </Pie>
      </PieChart>
      <span
        className="absolute text-sm font-extrabold tabular-nums"
        style={{ color }}
      >
        {Math.round(score)}%
      </span>
    </div>
  );
}

function SubScoreCard({ name, score }) {
  return (
    <div className="rounded-xl border border-outline-variant bg-surface p-4 flex items-center gap-4">
      <DonutScore score={score} size={80} />
      <div className="flex flex-col min-w-0">
        <span className="text-xs font-semibold text-on-surface-variant leading-tight">
          {name}
        </span>
        <span className="text-xs text-outline mt-0.5">
          {score < 50 ? "Needs improvement" : score < 75 ? "Good" : "Excellent"}
        </span>
      </div>
    </div>
  );
}

function GeneralAtsDisplay({ result }) {
  if (!result) return null;
  const isStale = result._stale;
  const { score, categories, strengths, issues, suggestions } = result;
  return (
    <div className="space-y-5">
      {isStale && (
        <Badge
          variant="outline"
          className="border-amber-500/30 text-amber-700 bg-amber-50 text-xs"
        >
          CV changed since last check
        </Badge>
      )}

      <div className="rounded-xl border border-outline-variant bg-surface p-5">
        <div className="grid grid-cols-[auto_1fr] gap-5">
          <ScoreGauge score={score} size={140} label="Overall Score" />
          {categories?.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {categories.map((c, i) => (
                <SubScoreCard key={i} name={c.name} score={c.score} />
              ))}
            </div>
          )}
        </div>
      </div>

      {strengths?.length > 0 && (
        <div className="rounded-xl border border-outline-variant bg-surface p-5">
          <h5 className="text-sm font-bold text-on-surface-variant mb-3 flex items-center gap-1.5">
            <svg
              className="w-4 h-4 text-primary"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            Key Strengths
          </h5>
          <div className="flex flex-wrap gap-2">
            {strengths.map((s, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-container text-on-primary-container text-xs font-semibold"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {issues?.length > 0 && (
        <div className="rounded-xl border border-outline-variant bg-surface p-5">
          <h5 className="text-sm font-bold text-on-surface-variant mb-3 flex items-center gap-1.5">
            <svg
              className="w-4 h-4 text-error"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            Issues Found
          </h5>
          <div className="flex flex-wrap gap-2">
            {issues.map((issue, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-error-container text-on-error-container text-xs font-semibold"
              >
                {issue}
              </span>
            ))}
          </div>
        </div>
      )}

      {suggestions?.length > 0 && (
        <div className="rounded-xl border border-outline-variant bg-surface p-5">
          <h5 className="text-sm font-bold text-on-surface-variant mb-3 flex items-center gap-1.5">
            <svg
              className="w-4 h-4 text-secondary"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            Optimization Roadmap
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {suggestions.map((s, i) => (
              <div
                key={i}
                className="rounded-xl border border-outline-variant bg-surface p-4 flex items-start gap-3"
              >
                <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-primary-container text-on-primary-container text-sm font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <p className="text-sm text-on-surface leading-relaxed">{s}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {result._timestamp && (
        <p className="text-xs text-on-surface-variant text-center">
          Last checked: {formatTime(result._timestamp)}
        </p>
      )}
    </div>
  );
}

export default function AtsTab({
  handleGeneralAtsCheck,
  generalAtsLoading,
  generalAtsResult,
}) {
  return (
    <div className="ai-ats">
      <h4 className="text-sm font-bold text-on-surface mb-1">
        General ATS Check
      </h4>
      <p className="text-xs text-on-surface-variant mb-3">
        Assess your CV&#39;s ATS compatibility and structure — independent of
        any specific job posting.
      </p>
      <Button
        variant="default"
        className="w-full justify-center bg-primary-gradient text-on-primary hover:opacity-90 shadow-sm mb-5"
        onClick={handleGeneralAtsCheck}
        disabled={generalAtsLoading}
      >
        {generalAtsLoading ? "Checking..." : "Check ATS Compatibility"}
      </Button>
      <GeneralAtsDisplay result={generalAtsResult} />
    </div>
  );
}
