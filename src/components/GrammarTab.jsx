import { useState } from "react";
import { runAiAction, classifyError, validateCvShape, getActiveProvider } from "../utils/groqClient";
import { Button } from "@/components/ui/button";
import { mergeAiPatch } from "../utils/aiPatch";
import { getProvider } from "../utils/aiProviders";
import { Skeleton } from "@/components/ui/skeleton";

export default function GrammarTab({
  cvData,
  onFieldChange,
  locale,
  pushUndo,
  hasKey,
  setActionError,
  setShowSettings,
  responses = [],
  pushSectionResponse,
}) {
  const sections = cvData?.sections || [];
  const provider = getProvider(getActiveProvider());
  const [selectedSection, setSelectedSection] = useState("entire");
  const [selectedItem, setSelectedItem] = useState("");
  const [loading, setLoading] = useState(false);
  const [issues, setIssues] = useState(null);
  const [fixed, setFixed] = useState(false);
  const responseItems = responses;

  const buildScopeJson = () => {
    if (!selectedSection || selectedSection === "entire") {
      return { json: JSON.stringify(cvData, null, 2), type: "entire", index: -1, itemIdx: -1 };
    }
    const secIdx = parseInt(selectedSection, 10);
    if (!selectedItem) {
      return { json: JSON.stringify(sections[secIdx], null, 2), type: "section", index: secIdx, itemIdx: -1 };
    }
    const itemIdx = parseInt(selectedItem, 10);
    return { json: JSON.stringify(sections[secIdx]?.items?.[itemIdx], null, 2), type: "item", index: secIdx, itemIdx };
  };

  const handleCheckGrammar = async () => {
    if (!hasKey) {
      setActionError("MISSING_KEY");
      pushSectionResponse?.("grammar", "Add your AI key in Settings to use this feature.", "error");
      return;
    }
    setLoading(true);
    setIssues(null);
    setFixed(false);

    const scope = buildScopeJson();
    const systemPrompt = `You are a grammar and spelling expert for CVs. Analyze the JSON below for grammar, spelling, punctuation, and professional tone issues in language "${locale}". Return ONLY a raw JSON object with no markdown fences:

{
  "issues": [
    { "text": "Brief description of the issue", "severity": "minor" | "major" }
  ],
  "hasIssues": true | false
}

If no issues found, set hasIssues to false and issues to an empty array.`;

    const result = await runAiAction({
      systemPrompt,
      userPrompt: scope.json,
      temperature: 0.1,
    });

    if (result.ok) {
      setIssues(result.data.issues || []);
      const message = result.data.issues?.length
        ? `Grammar check found ${result.data.issues.length} issue(s).`
        : "No grammar issues found in the selected scope.";
      pushSectionResponse?.("grammar", message, "success");
    } else {
      const classified = classifyError(result.error, provider.label);
      setActionError(classified.message);
      pushSectionResponse?.("grammar", classified.message, "error");
    }
    setLoading(false);
  };

  const handleFixGrammar = async () => {
    if (!hasKey) {
      setActionError("MISSING_KEY");
      pushSectionResponse?.("grammar", "Add your AI key in Settings to use this feature.", "error");
      return;
    }
    setLoading(true);

    const scope = buildScopeJson();
    const systemPrompt = `You are a grammar and spelling expert for CVs. Fix all grammar, spelling, punctuation, and tone issues in the JSON below for language "${locale}". Return ONLY a minimal JSON patch containing the changed fields and items needed to apply the corrections. Do not repeat unchanged parts. Preserve all ids, dates, org names, and factual content exactly. No markdown fences, no explanation.`;

    const result = await runAiAction({
      systemPrompt,
      userPrompt: scope.json,
      temperature: 0,
      retries: 0,
    });

    if (result.ok) {
      pushUndo();
      if (scope.type === "entire") {
        onFieldChange("", mergeAiPatch(cvData, result.data));
      } else if (scope.type === "section") {
        onFieldChange(
          `sections.${scope.index}`,
          mergeAiPatch(sections[scope.index] || {}, result.data),
        );
      } else {
        onFieldChange(
          `sections.${scope.index}.items.${scope.itemIdx}`,
          mergeAiPatch(sections[scope.index]?.items?.[scope.itemIdx] || {}, result.data),
        );
      }
      setFixed(true);
      setIssues(null);
      pushSectionResponse?.("grammar", "Grammar fixes applied successfully.", "success");
    } else {
      const classified = classifyError(result.error, provider.label);
      setActionError(classified.message);
      pushSectionResponse?.("grammar", classified.message, "error");
    }
    setLoading(false);
  };

  return (
    <div className="ai-ats space-y-4">
      <h4 className="text-sm font-bold text-on-surface mb-1">
        Grammar Checker
      </h4>
      <p className="text-xs text-on-surface-variant mb-3">
        Check and fix grammar, spelling, and tone across your CV.
      </p>

      <div className="rounded-xl border border-outline-variant bg-surface p-5 space-y-3">
        <div className="flex flex-col gap-1.5">
          <select
            className="w-full h-11 rounded-xl border border-outline-variant bg-surface-container-low text-sm text-on-surface px-4 shadow-inner"
            value={selectedSection}
            onChange={(e) => {
              setSelectedSection(e.target.value);
              setSelectedItem("");
              setIssues(null);
              setFixed(false);
            }}
          >
            <option value="entire">Entire CV</option>
            {sections.map((s, i) => (
              <option key={s.id || i} value={i}>
                {s.title?.[locale] || s.title?.en || `Section ${i + 1}`}
              </option>
            ))}
          </select>
          {selectedSection && selectedSection !== "entire" && (
            <select
              className="w-full h-11 rounded-xl border border-outline-variant bg-surface-container-low text-sm text-on-surface px-4 shadow-inner"
              value={selectedItem}
              onChange={(e) => {
                setSelectedItem(e.target.value);
                setIssues(null);
                setFixed(false);
              }}
            >
              <option value="">All items in this section</option>
              {sections[parseInt(selectedSection, 10)]?.items?.map((item, i) => (
                <option key={i} value={i}>
                  Item #{i + 1}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="default"
            className="flex-1 justify-center bg-primary-gradient text-on-primary hover:opacity-90 shadow-sm"
            onClick={handleCheckGrammar}
            disabled={loading}
          >
            {loading ? "Checking..." : "Check Grammar"}
          </Button>
          <Button
            variant="secondary"
            className="flex-1 justify-center shadow-sm"
            onClick={handleFixGrammar}
            disabled={loading || (!issues && !fixed)}
          >
            {loading ? "Working..." : "Fix Grammar"}
          </Button>
        </div>

        {loading && (
          <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4 space-y-3">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-5/6" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-8 w-24 rounded-xl" />
              <Skeleton className="h-8 w-24 rounded-xl" />
            </div>
          </div>
        )}
      </div>

      {!issues && !fixed && !loading && (
        <div className="flex items-center justify-center py-12 text-on-surface-variant">
          <div className="text-center max-w-[260px]">
            <svg className="w-8 h-8 mx-auto mb-3 text-outline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            <p className="text-sm leading-relaxed">
              Select a scope above and click <strong>Check Grammar</strong> to analyze your CV for grammar and spelling issues.
            </p>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-on-surface-variant">
            <svg className="w-5 h-5 animate-spin text-primary" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25"/><path d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75"/></svg>
            <span className="text-sm">Checking grammar...</span>
          </div>
        </div>
      )}

      {issues && issues.length > 0 && (
        <div className="rounded-xl border border-outline-variant bg-surface p-5">
          <h5 className="text-sm font-bold text-on-surface-variant mb-3 flex items-center gap-1.5">
            <svg className="w-4 h-4 text-error" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            Grammar Issues ({issues.length})
          </h5>
          <ul className="space-y-2">
            {issues.map((issue, i) => (
              <li
                key={i}
                className="flex items-start gap-2.5 text-sm text-on-surface"
              >
                <span
                  className={`flex-shrink-0 w-1.5 h-1.5 rounded-full mt-1.5 ${
                    issue.severity === "major" ? "bg-error" : "bg-outline"
                  }`}
                />
                <span className="text-xs leading-relaxed">{issue.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {issues && issues.length === 0 && !fixed && (
        <div className="rounded-xl border border-outline-variant bg-surface p-5">
          <p className="text-sm text-on-surface flex items-center gap-2">
            <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            No grammar issues found in the selected scope.
          </p>
        </div>
      )}

      {fixed && (
        <div className="rounded-xl border border-outline-variant bg-surface p-5">
          <p className="text-sm text-on-surface flex items-center gap-2">
            <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            Grammar fixes applied successfully.
          </p>
        </div>
      )}

      {responseItems.length > 0 && (
        <div className="rounded-xl border border-outline-variant bg-surface p-5 space-y-3">
          <h5 className="text-sm font-bold text-on-surface-variant">
            Grammar Responses
          </h5>
          <div className="space-y-2">
            {responseItems.map((item, i) => (
              <div
                key={i}
                className={`rounded-xl border px-4 py-3 text-sm leading-relaxed ${
                  item.type === "error"
                    ? "border-error/20 bg-error-container text-on-error-container"
                    : "border-outline-variant bg-surface-container-low text-on-surface"
                }`}
              >
                {item.text}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
