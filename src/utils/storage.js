const STORAGE_KEY = 'cv-builder-data';
const HISTORY_KEY = 'cv-builder-history';
const MAX_HISTORY = 30;

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

const ATS_KEY = 'cv-builder-ats-result';

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

const GENERAL_ATS_KEY = 'cv-builder-general-ats-result';

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
