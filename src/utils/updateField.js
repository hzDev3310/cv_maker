export default function updateField(obj, path, value) {
  const keys = path.split('.');
  const key = keys[0];
  if (keys.length === 1) {
    return { ...obj, [key]: value };
  }
  const rest = keys.slice(1).join('.');
  const current = obj[key];
  if (Array.isArray(current)) {
    const idx = parseInt(rest.split('.')[0], 10);
    const rest2 = rest.split('.').slice(1).join('.');
    const updated = [...current];
    if (rest2) {
      updated[idx] = updateField(current[idx], rest2, value);
    } else {
      updated[idx] = value;
    }
    return { ...obj, [key]: updated };
  }
  if (current && typeof current === 'object') {
    return { ...obj, [key]: updateField(current, rest, value) };
  }
  return { ...obj, [key]: value };
}
