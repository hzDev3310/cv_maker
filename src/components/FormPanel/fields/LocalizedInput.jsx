import { Input } from '@/components/ui/input'

export default function LocalizedInput({ value, locale, onChange, placeholder, className }) {
  return (
    <Input
      type="text"
      value={value?.[locale] || ''}
      onChange={(e) => onChange({ ...value, [locale]: e.target.value })}
      placeholder={placeholder}
      className={className}
    />
  );
}
