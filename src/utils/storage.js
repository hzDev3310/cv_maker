import { listProviders } from "./aiProviders";

const STORAGE_KEY = 'cv-builder-data';
const HISTORY_KEY = 'cv-builder-history';
const MAX_HISTORY = 30;
const ATS_KEY = 'cv-builder-ats-result';
const GENERAL_ATS_KEY = 'cv-builder-general-ats-result';
const ACTIVE_PROVIDER_KEY = 'cv-builder-ai-provider';
const ACTIVE_MODEL_PREFIX = 'cv-builder-ai-model-';

function readJsonValue(raw) {
  if (raw == null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function writeJsonValue(key, value) {
  localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
}

export function getBackupStorageKeys() {
  return [
    STORAGE_KEY,
    HISTORY_KEY,
    ATS_KEY,
    GENERAL_ATS_KEY,
    ACTIVE_PROVIDER_KEY,
    ...listProviders().map((provider) => `${ACTIVE_MODEL_PREFIX}${provider.id}`),
  ];
}

export function exportBackupPayload() {
  const storage = {};
  for (const key of getBackupStorageKeys()) {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) {
        storage[key] = readJsonValue(raw);
      }
    } catch {
      // Skip keys that cannot be read.
    }
  }

  return {
    app: 'cv-builder',
    version: 1,
    createdAt: Date.now(),
    storage,
  };
}

export function restoreBackupPayload(payload) {
  const storage = payload?.storage;
  if (!storage || typeof storage !== 'object') return false;

  const allowed = new Set(getBackupStorageKeys());
  for (const key of allowed) {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore removal failures.
    }
  }

  for (const [key, value] of Object.entries(storage)) {
    if (!allowed.has(key)) continue;
    try {
      writeJsonValue(key, value);
    } catch {
      // Skip values that cannot be saved.
    }
  }

  return true;
}

export function exportBackupJson() {
  return JSON.stringify(exportBackupPayload(), null, 2);
}

export function loadFromStorage(fallback) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return fallback;
}

export function saveToStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    return false;
  }
}

export function clearStorage() {
  localStorage.removeItem(STORAGE_KEY);
}

function readStore() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

function writeStore(store) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(store));
  } catch (e) {}
}

export function getHistory() {
  const store = readStore();
  if (store && Array.isArray(store._index)) return store._index;
  return [];
}

export function addToHistory(data, customName) {
  try {
    const entry = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      name: customName || data.meta?.name || 'Untitled',
    };
    const store = readStore() || { _index: [] };
    let index = store._index || [];
    index.unshift(entry);
    if (index.length > MAX_HISTORY) {
      const removed = index.splice(MAX_HISTORY);
      for (const r of removed) delete store[r.id];
    }
    store._index = index;
    store[entry.id] = data;
    writeStore(store);
    return entry.id;
  } catch (e) {
    return null;
  }
}

export function loadFromHistory(id) {
  try {
    const store = readStore();
    if (!store) return null;
    return store[id] || null;
  } catch (e) {
    return null;
  }
}

export function deleteFromHistory(id) {
  try {
    const store = readStore();
    if (!store) return;
    delete store[id];
    store._index = (store._index || []).filter(h => h.id !== id);
    writeStore(store);
  } catch (e) {}
}

export function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
}

export function loadAtsResult() {
  try {
    const raw = localStorage.getItem(ATS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

export function saveAtsResult(result) {
  try {
    localStorage.setItem(ATS_KEY, JSON.stringify(result));
    return true;
  } catch (e) { return false; }
}

export function clearAtsResult() {
  localStorage.removeItem(ATS_KEY);
}

export function loadGeneralAtsResult() {
  try {
    const raw = localStorage.getItem(GENERAL_ATS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

export function saveGeneralAtsResult(result) {
  try {
    localStorage.setItem(GENERAL_ATS_KEY, JSON.stringify(result));
    return true;
  } catch (e) { return false; }
}

export function clearGeneralAtsResult() {
  localStorage.removeItem(GENERAL_ATS_KEY);
}
