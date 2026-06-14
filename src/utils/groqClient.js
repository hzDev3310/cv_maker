const GROQ_KEY = 'cv-builder-groq-key';
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';
const TIMEOUT_MS = 30000;

export function getApiKey() {
  try { return localStorage.getItem(GROQ_KEY) || ''; } catch { return ''; }
}

export function saveApiKey(key) {
  try { localStorage.setItem(GROQ_KEY, key); return true; } catch { return false; }
}

export function clearApiKey() {
  try { localStorage.removeItem(GROQ_KEY); return true; } catch { return false; }
}

export async function callGroq(systemPrompt, userPrompt, { temperature = 0.4 } = {}) {
  const key = getApiKey();
  if (!key) throw new Error('MISSING_KEY');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(GROQ_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature,
      }),
      signal: controller.signal,
    });

    if (res.status === 401) throw new Error('INVALID_KEY');
    if (res.status === 429) throw new Error('RATE_LIMITED');
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`API_ERROR: ${res.status} ${text}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('TIMEOUT');
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export function extractJson(text) {
  let cleaned = text.trim();

  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) cleaned = fenceMatch[1].trim();

  if (!cleaned.startsWith('{') && !cleaned.startsWith('[')) {
    const objMatch = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (objMatch) cleaned = objMatch[1].trim();
  }

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    throw new Error('PARSE_FAILED');
  }
}

/**
 * Validate that parsed JSON looks like a full CV (same sections, same ids/types).
 * Returns null if valid, or an error string if invalid.
 */
export function validateCvShape(original, parsed) {
  if (!parsed || typeof parsed !== 'object') return 'Response is not a valid object.';
  if (!Array.isArray(parsed.sections)) return 'Response missing sections array.';
  if (parsed.sections.length !== original.sections.length) return `Section count changed (was ${original.sections.length}, got ${parsed.sections.length}).`;

  for (let i = 0; i < original.sections.length; i++) {
    const orig = original.sections[i];
    const got = parsed.sections[i];
    if (!got) return `Section ${i} is missing.`;
    if (got.id !== orig.id) return `Section ${i} id changed from "${orig.id}" to "${got.id}".`;
    if (got.type !== orig.type) return `Section ${i} type changed from "${orig.type}" to "${got.type}".`;
  }
  return null;
}

export function validateAtsResult(parsed) {
  if (!parsed || typeof parsed !== 'object') return 'Response is not a valid object.';
  if (typeof parsed.score !== 'number' || parsed.score < 0 || parsed.score > 100) return 'Missing or invalid "score" (0-100).';
  if (!Array.isArray(parsed.matchedKeywords)) return 'Missing or invalid "matchedKeywords" array.';
  if (!Array.isArray(parsed.missingKeywords)) return 'Missing or invalid "missingKeywords" array.';
  if (typeof parsed.summary !== 'string') return 'Missing or invalid "summary" string.';
  return null; // valid
}

export function validateGeneralAtsResult(parsed) {
  if (!parsed || typeof parsed !== 'object') return 'Response is not a valid object.';
  if (typeof parsed.score !== 'number' || parsed.score < 0 || parsed.score > 100) return 'Missing or invalid "score" (0-100).';
  if (!Array.isArray(parsed.strengths) || !parsed.strengths.every(s => typeof s === 'string')) return 'Missing or invalid "strengths" array.';
  if (!Array.isArray(parsed.issues) || !parsed.issues.every(s => typeof s === 'string')) return 'Missing or invalid "issues" array.';
  if (!Array.isArray(parsed.suggestions) || !parsed.suggestions.every(s => typeof s === 'string')) return 'Missing or invalid "suggestions" array.';
  if (parsed.categories !== undefined) {
    if (!Array.isArray(parsed.categories)) return '"categories" must be an array.';
    for (const cat of parsed.categories) {
      if (!cat.name || typeof cat.name !== 'string') return 'Each category must have a "name" string.';
      if (typeof cat.score !== 'number' || cat.score < 0 || cat.score > 100) return 'Each category must have a valid "score" (0-100).';
    }
  }
  return null; // valid
}

/**
 * Centralized action runner with retry, error classification, and loading state.
 *
 * @param {object} opts
 * @param {string} opts.systemPrompt
 * @param {string} opts.userPrompt
 * @param {function} [opts.validate] - optional (parsed) => null | errorString
 * @param {number} [opts.temperature] - default 0.3
 * @param {number} [opts.retries] - default 1 (1 retry = 2 total attempts)
 * @returns {{ ok: true, data: any } | { ok: false, error: string, raw?: string }}
 */
export async function runAiAction({ systemPrompt, userPrompt, validate, temperature = 0.3, retries = 1 }) {
  const maxAttempts = 1 + retries;
  let lastError = '';
  let lastRaw = '';

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const reminder = attempt > 0
        ? '\n\nIMPORTANT REMINDER: Respond with ONLY the raw JSON object. No markdown fences, no explanation, no text before or after the JSON.'
        : '';
      const raw = await callGroq(systemPrompt + reminder, userPrompt, { temperature });
      lastRaw = raw;

      let parsed;
      try {
        parsed = extractJson(raw);
      } catch {
        if (attempt < maxAttempts - 1) {
          lastError = 'Could not parse JSON from response. Retrying…';
          continue;
        }
        return { ok: false, error: 'The AI response was not valid JSON.', raw: raw.slice(0, 2000) };
      }

      if (validate) {
        const validationError = validate(parsed);
        if (validationError) {
          if (attempt < maxAttempts - 1) {
            lastError = validationError + ' Retrying…';
            continue;
          }
          return { ok: false, error: validationError, raw: raw.slice(0, 2000) };
        }
      }

      return { ok: true, data: parsed };
    } catch (err) {
      const msg = err.message || '';
      if (['MISSING_KEY', 'INVALID_KEY', 'RATE_LIMITED', 'TIMEOUT'].includes(msg)) {
        return { ok: false, error: msg };
      }
      if (attempt < maxAttempts - 1) {
        lastError = 'API error, retrying…';
        continue;
      }
      return { ok: false, error: msg, raw: lastRaw };
    }
  }

  return { ok: false, error: lastError || 'Unknown error', raw: lastRaw };
}

export function classifyError(code) {
  switch (code) {
    case 'MISSING_KEY': return { icon: '🔑', message: 'Add your Groq API key in Settings to use this feature.', action: 'settings' };
    case 'INVALID_KEY': return { icon: '❌', message: 'Invalid API key — check Settings.', action: 'settings' };
    case 'RATE_LIMITED': return { icon: '⏳', message: 'Rate limit reached, please wait a moment and try again.' };
    case 'TIMEOUT': return { icon: '⏰', message: 'Request timed out after 30s. Try again.' };
    default: return { icon: '❌', message: code || 'An unexpected error occurred.' };
  }
}
