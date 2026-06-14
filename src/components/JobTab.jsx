import ScoreGauge from "./ScoreGauge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function formatTime(ts) {
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function AtsDisplay({ atsResult, onRecalc, onOptimize, loading, jobDesc }) {
  if (!atsResult) return null;
  const isStale = atsResult._stale;
  return (
    <div className="rounded-xl border border-outline-variant bg-surface p-5 space-y-4">
      {isStale && (
        <Badge
          variant="outline"
          className="border-amber-500/30 text-amber-700 bg-amber-50 text-xs"
        >
          CV changed since last check
        </Badge>
      )}
      <div className="flex items-center gap-4">
        <ScoreGauge
          score={atsResult.score}
          size={140}
          label="Job Match Score"
        />
        <div className="flex gap-1.5 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onRecalc}
            disabled={loading || !jobDesc.trim()}
          >
            {loading ? "Working..." : "Recalculate"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onOptimize}
            disabled={loading || !jobDesc.trim()}
          >
            {loading ? "Working..." : "Optimize"}
          </Button>
        </div>
      </div>
      {atsResult._timestamp && (
        <p className="text-xs text-on-surface-variant">
          Last checked: {formatTime(atsResult._timestamp)}
        </p>
      )}
      <div className="space-y-3">
        <div>
          <h5 className="text-xs font-bold text-on-surface-variant mb-1.5">
            Matched Keywords
          </h5>
          <div className="flex flex-wrap gap-1">
            {atsResult.matchedKeywords?.length > 0 ? (
              atsResult.matchedKeywords.map((kw, i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="bg-emerald-100 text-emerald-800 border-emerald-200"
                >
                  {kw}
                </Badge>
              ))
            ) : (
              <span className="text-xs italic text-on-surface-variant">
                None
              </span>
            )}
          </div>
        </div>
        <div>
          <h5 className="text-xs font-bold text-on-surface-variant mb-1.5">
            Missing Keywords
          </h5>
          <div className="flex flex-wrap gap-1">
            {atsResult.missingKeywords?.length > 0 ? (
              atsResult.missingKeywords.map((kw, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="bg-error-container text-on-error-container border-error/30"
                >
                  {kw}
                </Badge>
              ))
            ) : (
              <span className="text-xs italic text-on-surface-variant">
                None
              </span>
            )}
          </div>
        </div>
        {atsResult.summary && (
          <p className="text-xs text-on-surface-variant leading-relaxed">
            {atsResult.summary}
          </p>
        )}
      </div>
    </div>
  );
}

export default function JobTab({
  jobDesc,
  handleJobDescChange,
  isProcessing,
  handleTailor,
  handleAtsScore,
  handleAtsOptimize,
  atsLoading,
  atsResult,
}) {
  return (
    <div className="ai-job space-y-4">
      <div className="rounded-xl border border-outline-variant bg-surface p-5">
        <h4 className="text-sm font-bold text-on-surface mb-1">
          Job Description
        </h4>
        <p className="text-xs text-on-surface-variant mb-3">
          Paste a job description, then tailor your CV to match.
        </p>
        <textarea
          className="flex w-full h-32 rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200 resize-y shadow-inner"
          value={jobDesc}
          onChange={(e) => handleJobDescChange(e.target.value)}
          placeholder="Paste job description here…"
          disabled={isProcessing}
        />
        <div className="mt-3">
          <Button
            variant="default"
            onClick={handleTailor}
            disabled={isProcessing}
          >
            {isProcessing ? "Working..." : "Tailor CV to Job"}
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-outline-variant bg-surface p-5">
        <h4 className="text-sm font-bold text-on-surface mb-1">
          Job Match
        </h4>
        <p className="text-xs text-on-surface-variant mb-3">
          Compare your CV against the job description above.
        </p>

        <div className="flex gap-2 mb-4">
          <Button
            variant="default"
            className="flex-1 justify-center bg-primary-gradient text-on-primary hover:opacity-90 shadow-sm"
            onClick={handleAtsScore}
            disabled={atsLoading}
          >
            {atsLoading ? "Analyzing..." : "Calculate Score"}
          </Button>
          <Button
            variant="secondary"
            className="flex-1 justify-center shadow-sm"
            onClick={handleAtsOptimize}
            disabled={isProcessing}
          >
            {isProcessing ? "Working..." : "ATS Optimize"}
          </Button>
        </div>

        <AtsDisplay
          atsResult={atsResult}
          onRecalc={handleAtsScore}
          onOptimize={handleAtsOptimize}
          loading={atsLoading}
          jobDesc={jobDesc}
        />
      </div>
    </div>
  );
}
