export default function LocalizedTextarea({ value, locale, onChange, placeholder }) {
  return (
    <textarea
      value={value?.[locale] || ''}
      onChange={(e) => onChange({ ...value, [locale]: e.target.value })}
      placeholder={placeholder}
      rows={4}
      className="h-auto min-h-[120px] w-full rounded-xl border border-outline-variant bg-surface-variant px-4 py-3 text-base text-on-surface placeholder:text-on-surface-variant transition-all duration-200 outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 resize-y md:text-sm shadow-inner"
    />
  );
}
