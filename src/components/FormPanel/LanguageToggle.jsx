import { Button } from '@/components/ui/button'

export default function LanguageToggle({ locale, onChange, locales }) {
  return (
    <div className="inline-flex gap-0 rounded-full bg-surface-container-high p-0.5">
      {locales.map((l) => (
        <Button
          key={l}
          type="button"
          variant={locale === l ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onChange(l)}
        >
          {l.toUpperCase()}
        </Button>
      ))}
    </div>
  );
}
