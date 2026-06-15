function isIndex(segment) {
  return String(Number(segment)) === segment;
}

function cloneContainer(container, nextKey) {
  if (Array.isArray(container)) return [...container];
  if (container && typeof container === 'object') return { ...container };
  return isIndex(nextKey) ? [] : {};
}

function setDeep(container, keys, value) {
  const [key, ...rest] = keys;
  if (keys.length === 1) {
    if (Array.isArray(container)) {
      const next = [...container];
      next[Number(key)] = value;
      return next;
    }
    return { ...(container || {}), [key]: value };
  }

  const nextContainer = cloneContainer(
    Array.isArray(container) ? container[Number(key)] : container?.[key],
    rest[0],
  );
  const updated = setDeep(nextContainer, rest, value);

  if (Array.isArray(container)) {
    const next = [...container];
    next[Number(key)] = updated;
    return next;
  }

  return { ...(container || {}), [key]: updated };
}

export default function updateField(obj, path, value) {
  if (!path) return value;
  const keys = path.split('.').filter(Boolean);
  if (keys.length === 0) return value;
  return setDeep(obj, keys, value);
}
