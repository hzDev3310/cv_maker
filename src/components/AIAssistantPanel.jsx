import { useState, useRef, useCallback, useEffect } from "react";
import {
  runAiAction,
  classifyError,
  validateCvShape,
  validateAtsResult,
  validateGeneralAtsResult,
  getApiKey,
} from "../utils/groqClient";
import {
  loadAtsResult,
  saveAtsResult,
  loadGeneralAtsResult,
  saveGeneralAtsResult,
} from "../utils/storage";
import SettingsModal from "./SettingsModal";
import { Button } from "@/components/ui/button";
import ChatTab from "./ChatTab";
import JobTab from "./JobTab";
import AtsTab from "./AtsTab";
import GrammarTab from "./GrammarTab";



export default function AIAssistantPanel({
  cvData,
  locale,
  onFieldChange,
  activeTab,
}) {
  const [showSettings, setShowSettings] = useState(false);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [processing, setProcessing] = useState(false);
  const [jobDesc, setJobDesc] = useState(cvData?.jobDescription || "");
  const [atsResult, setAtsResult] = useState(() => loadAtsResult());
  const [atsLoading, setAtsLoading] = useState(false);
  const [generalAtsResult, setGeneralAtsResult] = useState(() =>
    loadGeneralAtsResult(),
  );
  const [generalAtsLoading, setGeneralAtsLoading] = useState(false);
  const [selectedSection, setSelectedSection] = useState("entire");
  const [selectedItem, setSelectedItem] = useState("");
  const [undoStack, setUndoStack] = useState([]);
  const [actionError, setActionError] = useState(null);
  const messagesEndRef = useRef(null);

  const sections = cvData?.sections || [];
  const hasKey = !!getApiKey();

  const addMessage = useCallback((msg) => {
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (
        last &&
        last.text === msg.text &&
        last.type === msg.type &&
        last.role === msg.role
      )
        return prev;
      return [...prev, msg];
    });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark ATS results as stale when cvData changes
  useEffect(() => {
    if (
      atsResult &&
      atsResult._cvHash &&
      atsResult._cvHash !== simpleHash(cvData)
    ) {
      setAtsResult((prev) => (prev ? { ...prev, _stale: true } : prev));
    }
  }, [cvData, atsResult?._cvHash]);

  useEffect(() => {
    if (
      generalAtsResult &&
      generalAtsResult._cvHash &&
      generalAtsResult._cvHash !== simpleHash(cvData)
    ) {
      setGeneralAtsResult((prev) => (prev ? { ...prev, _stale: true } : prev));
    }
  }, [cvData, generalAtsResult?._cvHash]);

  const pushUndo = useCallback(() => {
    setUndoStack((prev) => {
      const next = [...prev, JSON.parse(JSON.stringify(cvData))];
      if (next.length > 5) next.shift();
      return next;
    });
  }, [cvData]);

  const handleUndo = useCallback(() => {
    setUndoStack((prev) => {
      if (prev.length === 0) return prev;
      const restored = prev[prev.length - 1];
      onFieldChange("", restored);
      return prev.slice(0, -1);
    });
  }, [onFieldChange]);

  const buildScopePrompt = useCallback(
    (scopeType, scopeIndex, itemIndex) => {
      let scopeJson, shapeHint;
      if (scopeType === "entire") {
        scopeJson = JSON.stringify(cvData, null, 2);
        shapeHint = "The full CV JSON object with meta and sections array.";
      } else if (scopeType === "section") {
        const sec = sections[scopeIndex];
        scopeJson = JSON.stringify(sec, null, 2);
        const types = {
          text: 'A text/paragraph block with "content" (localizedString).',
          experience:
            'An experience entry with "role" (localized), "organization" (string), "location" (localized), "dateRange", "bullets" (localizedStringArray), "tags" (string[]).',
          project:
            'A project entry with "name" (string), "nameLocalized" (localized), "subtitle" (localized), "dateRange", "bullets" (localizedStringArray), "techStack" (string[]), "links".',
          education:
            'An education entry with "degree" (localized), "institution" (string), "location" (localized), "dateRange", "notes" (localizedStringArray).',
          skills:
            'A skill group with "category" (localized), "skills" (string[]).',
          languages:
            'A language entry with "name" (localized), "level" (localized).',
        };
        shapeHint =
          types[sec?.type] ||
          'A section object with "title" (localized) and "items" array.';
      } else if (scopeType === "item") {
        const item = sections[scopeIndex]?.items?.[itemIndex];
        scopeJson = JSON.stringify(item, null, 2);
        shapeHint = "A single item object as part of a section.";
      }
      return `You are a CV-editing assistant. The user will ask for changes to the JSON object below. You MUST return ONLY valid JSON — no explanation, no markdown fences, no code blocks, no text before or after. If the user's request doesn't require changes, return the original JSON completely unchanged. Never return anything other than raw JSON.\n\nShape: ${shapeHint}\n\nCurrent JSON (language "${locale}"):\n${scopeJson}`;
    },
    [cvData, sections, locale],
  );

  // ---- Chat send ----
  const sendMessage = useCallback(
    async (overrideText) => {
      const text = overrideText || chatInput;
      if (!text.trim() || processing) return;

      const scopeType =
        !selectedSection || selectedSection === "entire"
          ? "entire"
          : selectedItem
            ? "item"
            : "section";
      const scopeIndex =
        !selectedSection || selectedSection === "entire"
          ? -1
          : parseInt(selectedSection, 10);
      const itemIndex = selectedItem ? parseInt(selectedItem, 10) : -1;

      const userMsg = { role: "user", text: text.trim() };
      setMessages((prev) => [...prev, userMsg]);
      setChatInput("");
      setProcessing(true);
      setActionError(null);

      const result = await runAiAction({
        systemPrompt: buildScopePrompt(scopeType, scopeIndex, itemIndex),
        userPrompt: text.trim(),
        validate:
          scopeType === "entire"
            ? (p) => validateCvShape(cvData, p)
            : undefined,
      });

      if (result.ok) {
        pushUndo();
        if (scopeType === "entire") {
          onFieldChange("", { ...cvData, ...result.data });
        } else if (scopeType === "section") {
          onFieldChange(`sections.${scopeIndex}`, result.data);
        } else if (scopeType === "item") {
          onFieldChange(
            `sections.${scopeIndex}.items.${itemIndex}`,
            result.data,
          );
        }
        addMessage({
          role: "assistant",
          text: "Updated successfully.",
          type: "success",
          undo: true,
        });
      } else {
        const classified = classifyError(result.error);
        setActionError(
          result.error === "PARSE_FAILED" || result.raw
            ? { error: result.error, raw: result.raw }
            : null,
        );
        addMessage({
          role: "assistant",
          text: classified.message,
          type: "error",
        });
      }
      setProcessing(false);
    },
    [
      chatInput,
      processing,
      selectedSection,
      selectedItem,
      buildScopePrompt,
      cvData,
      pushUndo,
      onFieldChange,
      addMessage,
    ],
  );

  // Pre-flight
  const preFlight = useCallback(
    (needsJobDesc = true) => {
      if (!hasKey) return "MISSING_KEY";
      if (needsJobDesc && !jobDesc.trim()) return "NO_JD";
      return null;
    },
    [hasKey, jobDesc],
  );

  // ---- ATS Score ----
  const handleAtsScore = useCallback(async () => {
    const pf = preFlight(true);
    if (pf) {
      setActionError(pf);
      return null;
    }
    setAtsLoading(true);
    setActionError(null);

    const systemPrompt = `You are an ATS (Applicant Tracking System) resume analyzer. Compare the CANDIDATE_CV JSON against the JOB_DESCRIPTION text. Respond with ONLY a raw JSON object, no markdown fences, no explanation, matching exactly:
{
  "score": <integer 0-100>,
  "matchedKeywords": [<strings>],
  "missingKeywords": [<strings>],
  "summary": "<2-3 sentence string>"
}`;

    const payload = buildActiveCvPayload(cvData, locale);
    const userPrompt = `CANDIDATE_CV:\n${JSON.stringify(payload, null, 2)}\n\nJOB_DESCRIPTION:\n${jobDesc}`;

    const result = await runAiAction({
      systemPrompt,
      userPrompt,
      temperature: 0.2,
      retries: 1,
      validate: (p) => validateAtsResult(p),
    });

    if (result.ok) {
      const parsed = result.data;
      const entry = {
        score: Math.min(100, Math.max(0, Math.round(parsed.score))),
        matchedKeywords: parsed.matchedKeywords,
        missingKeywords: parsed.missingKeywords,
        summary: parsed.summary,
        _timestamp: Date.now(),
        _cvHash: simpleHash(cvData),
        _stale: false,
      };
      setAtsResult(entry);
      saveAtsResult(entry);
      setAtsLoading(false);
      return entry;
    } else {
      const classified = classifyError(result.error);
      setActionError(
        result.raw ? { error: result.error, raw: result.raw } : result.error,
      );
      setAtsLoading(false);
      return null;
    }
  }, [preFlight, jobDesc, cvData, locale]);

  // ---- General ATS Check ----
  const handleGeneralAtsCheck = useCallback(async () => {
    const pf = preFlight(false);
    if (pf) {
      setActionError(pf);
      return;
    }
    setGeneralAtsLoading(true);
    setActionError(null);

    const systemPrompt = `You are an ATS (Applicant Tracking System) compatibility auditor. Analyze the CANDIDATE_CV JSON below for general ATS-friendliness — independent of any specific job posting. Evaluate:
- Structure & completeness (presence of standard sections: summary, work experience with dates, education, skills)
- Use of quantifiable achievements / action verbs in bullet points
- Keyword density and clarity of technical skills (are skills listed in a way ATS parsers can extract cleanly?)
- Length/conciseness issues (overly long bullets, missing dates, etc.)
- Any formatting patterns known to confuse ATS parsers (tables, special characters, non-standard section names) — note the CV is plain JSON, so focus on content-level issues, not visual formatting.

Respond with ONLY a raw JSON object, no markdown fences, no explanation, matching exactly:
{
  "score": <integer 0-100>,
  "categories": [
    { "name": "Structure & Completeness", "score": <0-100> },
    { "name": "Content Quality", "score": <0-100> },
    { "name": "Keyword Optimization", "score": <0-100> },
    { "name": "Formatting & Readability", "score": <0-100> }
  ],
  "strengths": [<strings, 2-5 short points>],
  "issues": [<strings, 2-5 short points describing specific problems found>],
  "suggestions": [<strings, 2-5 short, actionable improvement tips>]
}`;

    const payload = buildActiveCvPayload(cvData, locale);
    const userPrompt = `CANDIDATE_CV:\n${JSON.stringify(payload, null, 2)}`;

    const result = await runAiAction({
      systemPrompt,
      userPrompt,
      temperature: 0.2,
      retries: 1,
      validate: (p) => validateGeneralAtsResult(p),
    });

    if (result.ok) {
      const parsed = result.data;
      const categories =
        parsed.categories?.map((c) => ({
          name: c.name,
          score: Math.min(100, Math.max(0, Math.round(c.score))),
        })) || [];
      const entry = {
        score: Math.min(100, Math.max(0, Math.round(parsed.score))),
        categories,
        strengths: parsed.strengths,
        issues: parsed.issues,
        suggestions: parsed.suggestions,
        _timestamp: Date.now(),
        _cvHash: simpleHash(cvData),
        _stale: false,
      };
      setGeneralAtsResult(entry);
      saveGeneralAtsResult(entry);
      setGeneralAtsLoading(false);
    } else {
      const classified = classifyError(result.error);
      setActionError(
        result.raw ? { error: result.error, raw: result.raw } : result.error,
      );
      setGeneralAtsLoading(false);
    }
  }, [preFlight, cvData, locale]);

  // ---- Tailor CV ----
  const handleTailor = useCallback(async () => {
    const pf = preFlight(true);
    if (pf) {
      setActionError(pf);
      return;
    }
    setProcessing(true);
    setActionError(null);

    const systemPrompt = `You are a professional resume writer. Rewrite the SUMMARY text and the BULLETS arrays inside WORK_EXPERIENCE and PROJECTS sections of the CANDIDATE_CV JSON below to better align with the JOB_DESCRIPTION. Do NOT invent companies, job titles, dates, degrees, or skills/technologies not already present in the CV. Preserve all other fields exactly (ids, dates, tech stacks, organization names, etc.) unchanged. Respond with ONLY the complete updated CANDIDATE_CV JSON object, no markdown fences, no explanation.\n\nActive language: "${locale}". Focus on rewriting localized fields for this language.`;

    const userPrompt = `CANDIDATE_CV:\n${JSON.stringify(cvData, null, 2)}\n\nJOB_DESCRIPTION:\n${jobDesc}`;

    const result = await runAiAction({
      systemPrompt,
      userPrompt,
      temperature: 0.3,
      retries: 1,
      validate: (p) => validateCvShape(cvData, p),
    });

    if (result.ok) {
      pushUndo();
      onFieldChange("", { ...cvData, ...result.data });
      addMessage({
        role: "assistant",
        text: "CV tailored to job description — click Undo to revert.",
        type: "success",
        undo: true,
      });
    } else {
      const classified = classifyError(result.error);
      setActionError(
        result.raw ? { error: result.error, raw: result.raw } : result.error,
      );
      addMessage({
        role: "assistant",
        text: classified.message,
        type: "error",
      });
    }
    setProcessing(false);
  }, [preFlight, jobDesc, cvData, locale, pushUndo, onFieldChange, addMessage]);

  // ---- ATS Optimize ----
  const handleAtsOptimize = useCallback(async () => {
    const pf = preFlight(false);
    if (pf) {
      setActionError(pf);
      return;
    }

    setProcessing(true);
    setActionError(null);

    const suggestions = generalAtsResult?.issues?.join(", ") || "";
    const strengths = generalAtsResult?.strengths?.join(", ") || "";

    const systemPrompt = `You are a professional resume writer. Improve the CANDIDATE_CV JSON below for better ATS (Applicant Tracking System) compatibility. Focus on: adding relevant industry keywords, improving bullet point action verbs, and ensuring clear section structure — all while keeping factual content truthful. Active language: "${locale}". Respond with ONLY the complete updated CANDIDATE_CV JSON, no markdown fences.`;
    const userPrompt = `CANDIDATE_CV:\n${JSON.stringify(cvData, null, 2)}\n${suggestions ? `\nSUGGESTED_IMPROVEMENTS:\n${suggestions}` : ""}${strengths ? `\nCURRENT_STRENGTHS to preserve:\n${strengths}` : ""}\n\nImprove the CV for ATS-friendliness. Preserve all ids, dates, org names, and factual content.`;

    const result = await runAiAction({
      systemPrompt,
      userPrompt,
      temperature: 0.3,
      retries: 1,
      validate: (p) => validateCvShape(cvData, p),
    });

    if (result.ok) {
      pushUndo();
      onFieldChange("", { ...cvData, ...result.data });
    } else {
      const classified = classifyError(result.error);
      setActionError(
        result.raw ? { error: result.error, raw: result.raw } : result.error,
      );
    }
    setProcessing(false);
  }, [preFlight, cvData, locale, generalAtsResult, pushUndo, onFieldChange]);

  // ---- Enhance Wording ----
  const handleEnhanceWording = useCallback(async () => {
    const pf = preFlight(false);
    if (pf) {
      setActionError(pf);
      return;
    }
    setProcessing(true);
    setActionError(null);

    const scopeType =
      !selectedSection || selectedSection === "entire"
        ? "entire"
        : selectedItem
          ? "item"
          : "section";
    const scopeIndex =
      !selectedSection || selectedSection === "entire"
        ? -1
        : parseInt(selectedSection, 10);
    const itemIndex = selectedItem ? parseInt(selectedItem, 10) : -1;

    const systemPrompt = buildScopePrompt(scopeType, scopeIndex, itemIndex);
    const prompt = `Improve clarity, grammar, and professional tone of this CV JSON in language "${locale}". Preserve structure, ids, dates, and factual content exactly — only improve wording. Return ONLY raw JSON with the same structure.`;

    const result = await runAiAction({
      systemPrompt,
      userPrompt: prompt,
      temperature: 0.3,
      retries: 1,
      validate:
        scopeType === "entire" ? (p) => validateCvShape(cvData, p) : undefined,
    });

    if (result.ok) {
      pushUndo();
      if (scopeType === "entire") {
        onFieldChange("", { ...cvData, ...result.data });
      } else if (scopeType === "section") {
        onFieldChange(`sections.${scopeIndex}`, result.data);
      } else {
        onFieldChange(`sections.${scopeIndex}.items.${itemIndex}`, result.data);
      }
      addMessage({
        role: "assistant",
        text: "Wording enhanced.",
        type: "success",
        undo: true,
      });
    } else {
      const classified = classifyError(result.error);
      setActionError(
        result.raw ? { error: result.error, raw: result.raw } : result.error,
      );
      addMessage({
        role: "assistant",
        text: classified.message,
        type: "error",
      });
    }
    setProcessing(false);
  }, [
    preFlight,
    selectedSection,
    selectedItem,
    buildScopePrompt,
    locale,
    cvData,
    pushUndo,
    onFieldChange,
    addMessage,
  ]);

  // Sync jobDescription
  useEffect(() => {
    if (cvData?.jobDescription && cvData.jobDescription !== jobDesc) {
      setJobDesc(cvData.jobDescription);
    }
  }, [cvData?.jobDescription]);

  const handleJobDescChange = (val) => {
    setJobDesc(val);
    onFieldChange("jobDescription", val);
  };

  const isProcessing = processing || atsLoading || generalAtsLoading;

  // Pre-flight message
  const renderPreFlight = () => {
    if (actionError === "NO_JD") {
      return (
        <div className="px-3 py-2.5 mx-3 mt-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs flex items-center gap-1.5">
          Please paste a job description first.
        </div>
      );
    }
    if (actionError === "MISSING_KEY") {
      return (
        <div className="px-3 py-2.5 mx-3 mt-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs flex items-center gap-1.5">
          Add your Groq API key in{" "}
          <button
            type="button"
            className="bg-none border-none underline text-primary cursor-pointer text-sm font-semibold p-0 hover:text-primary/80"
            onClick={() => setShowSettings(true)}
          >
            Settings
          </button>{" "}
          to use this feature.
        </div>
      );
    }
    return null;
  };

  const isAiTab =
    activeTab === "chat" || activeTab === "job" || activeTab === "ats" || activeTab === "grammar";
  if (!isAiTab) return null;

  return (
    <div className="ai-panel bg-orange-600">
      <div className="ai-panel-inner bg-red-950">
        <div className="ai-card">
          <div className="ai-panel-header">
            <div className="text-sm font-bold text-on-surface flex items-center gap-2">
              <span>AI Assistant</span>
            </div>
            {undoStack.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleUndo}>
                ↩ Undo
              </Button>
            )}
          </div>

          <div className="ai-panel-body">
            {!hasKey && (
              <div className="ai-no-key">
                <p className="text-sm text-on-surface-variant text-center max-w-[220px] leading-relaxed">
                  Add your Groq API key in{" "}
                  <button
                    type="button"
                    className="bg-none border-none underline text-primary cursor-pointer text-sm font-semibold p-0 hover:text-primary/80"
                    onClick={() => setShowSettings(true)}
                  >
                    Settings
                  </button>{" "}
                  to enable the AI assistant.
                </p>
              </div>
            )}

            {renderPreFlight()}

            {actionError &&
              typeof actionError === "object" &&
              actionError.raw && (
                <details className="mx-3 mt-2 text-xs">
                  <summary className="cursor-pointer text-on-surface-variant font-semibold hover:text-on-surface/80">
                    Debug: Raw AI output
                  </summary>
                  <pre className="mt-1.5 p-2 bg-error-container border border-error/20 rounded-md font-mono text-xs text-on-error-container whitespace-pre-wrap max-h-50 overflow-y-auto">
                    {actionError.raw}
                  </pre>
                </details>
              )}

            {activeTab === "chat" && hasKey && (
              <ChatTab
                messages={messages}
                chatInput={chatInput}
                setChatInput={setChatInput}
                sendMessage={sendMessage}
                isProcessing={isProcessing}
                handleEnhanceWording={handleEnhanceWording}
                sections={sections}
                locale={locale}
                selectedSection={selectedSection}
                setSelectedSection={setSelectedSection}
                selectedItem={selectedItem}
                setSelectedItem={setSelectedItem}
                handleUndo={handleUndo}
                setShowSettings={setShowSettings}
                ref={messagesEndRef}
              />
            )}

            {activeTab === "job" && hasKey && (
              <JobTab
                jobDesc={jobDesc}
                handleJobDescChange={handleJobDescChange}
                isProcessing={isProcessing}
                handleTailor={handleTailor}
                handleAtsScore={handleAtsScore}
                handleAtsOptimize={handleAtsOptimize}
                atsLoading={atsLoading}
                atsResult={atsResult}
              />
            )}

            {activeTab === "ats" && hasKey && (
              <AtsTab
                handleGeneralAtsCheck={handleGeneralAtsCheck}
                generalAtsLoading={generalAtsLoading}
                generalAtsResult={generalAtsResult}
              />
            )}

            {activeTab === "grammar" && hasKey && (
              <GrammarTab
                cvData={cvData}
                onFieldChange={onFieldChange}
                locale={locale}
                pushUndo={pushUndo}
                hasKey={hasKey}
                setActionError={setActionError}
                setShowSettings={setShowSettings}
              />
            )}
          </div>
        </div>
      </div>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}

function buildActiveCvPayload(cvData, locale) {
  const pickLocale = (obj) => obj?.[locale] || obj?.en || "";
  const pickLocaleArr = (obj) => obj?.[locale] || obj?.en || [];

  const meta = cvData.meta
    ? { name: cvData.meta.name, jobTitle: pickLocale(cvData.meta.jobTitle) }
    : {};

  const sections = (cvData.sections || []).map((s) => {
    const base = { id: s.id, type: s.type, title: pickLocale(s.title) };
    if (s.type === "text") {
      return { ...base, content: pickLocale(s.items?.[0]?.content) };
    }
    if (s.type === "experience") {
      return {
        ...base,
        items: (s.items || []).map((item) => ({
          role: pickLocale(item.role),
          organization: item.organization,
          bullets: pickLocaleArr(item.bullets),
          tags: item.tags || [],
        })),
      };
    }
    if (s.type === "project") {
      return {
        ...base,
        items: (s.items || []).map((item) => ({
          name: item.name,
          bullets: pickLocaleArr(item.bullets),
          techStack: item.techStack || [],
        })),
      };
    }
    if (s.type === "education") {
      return {
        ...base,
        items: (s.items || []).map((item) => ({
          degree: pickLocale(item.degree),
          institution: item.institution,
          notes: pickLocaleArr(item.notes),
        })),
      };
    }
    if (s.type === "skills") {
      return {
        ...base,
        items: (s.items || []).map((item) => ({
          category: pickLocale(item.category),
          skills: item.skills || [],
        })),
      };
    }
    if (s.type === "languages") {
      return {
        ...base,
        items: (s.items || []).map((item) => ({
          name: pickLocale(item.name),
          level: pickLocale(item.level),
        })),
      };
    }
    return base;
  });

  return { meta, sections };
}

function simpleHash(obj) {
  const str = JSON.stringify(obj);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}
