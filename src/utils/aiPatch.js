function isPlainObject(value) {
  return Object.prototype.toString.call(value) === "[object Object]";
}

function cloneValue(value) {
  if (Array.isArray(value)) return value.map(cloneValue);
  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, cloneValue(entry)]),
    );
  }
  return value;
}

export function mergeAiPatch(base, patch) {
  if (patch == null) return base;
  if (Array.isArray(patch)) return cloneValue(patch);
  if (isPlainObject(base) && isPlainObject(patch)) {
    const next = { ...base };
    for (const [key, value] of Object.entries(patch)) {
      next[key] = mergeAiPatch(base[key], value);
    }
    return next;
  }
  if (isPlainObject(patch)) return cloneValue(patch);
  return patch;
}

