import { Button } from '@/components/ui/button'

export default function LocalizedTextareaList({ value, locale, onChange, placeholder }) {
  const items = value?.[locale] || [];
  const updateItem = (idx, val) => {
    const next = [...items];
    next[idx] = val;
    onChange({ ...value, [locale]: next });
  };
  const addItem = () => onChange({ ...value, [locale]: [...items, ''] });
  const removeItem = (idx) => onChange({ ...value, [locale]: items.filter((_, i) => i !== idx) });

  return (
    <div className="flex flex-col gap-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2 items-start">
          <textarea
            value={item}
            onChange={(e) => updateItem(i, e.target.value)}
            placeholder={placeholder}
            rows={2}
            className="h-auto min-h-[60px] w-full rounded-xl border border-outline-variant bg-surface-variant px-4 py-3 text-base text-on-surface placeholder:text-on-surface-variant transition-all duration-200 outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 resize-y md:text-sm shadow-inner"
          />
          <Button type="button" variant="outline" size="sm" onClick={() => removeItem(i)}>×</Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addItem}>+ Add</Button>
    </div>
  );
}
