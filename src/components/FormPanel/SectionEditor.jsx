import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import LocalizedInput from './fields/LocalizedInput';
import LocalizedTextarea from './fields/LocalizedTextarea';
import LocalizedTextareaList from './fields/LocalizedTextareaList';
import DateRangeInput from './fields/DateRangeInput';
import TagInput from './fields/TagInput';

function ItemEditor({ item, index, sectionType, locale, onChange, showAdvanced }) {
  const set = (path, value) => {
    onChange(`sections.${index}.items.${path}`, value);
  };

  const label = (text) => <Label className="text-label-md font-bold tracking-wider text-primary uppercase mb-1.5 block">{text}</Label>;

  switch (sectionType) {
    case 'text':
      return (
        <div className="space-y-3">
          <LocalizedTextarea value={item.content} locale={locale} onChange={(v) => set(`${index}.content`, v)} />
        </div>
      );
    case 'experience':
      return (
        <div className="space-y-3">
          {label('Role')}
          <LocalizedInput value={item.role} locale={locale} onChange={(v) => set(`${index}.role`, v)} />
          {label('Organization')}
          <Input type="text" value={item.organization || ''} onChange={(e) => set(`${index}.organization`, e.target.value)} />
          {label('Location')}
          <LocalizedInput value={item.location} locale={locale} onChange={(v) => set(`${index}.location`, v)} />
          {label('Date Range')}
          <DateRangeInput value={item.dateRange} onChange={(v) => set(`${index}.dateRange`, v)} />
          {label('Bullets')}
          <LocalizedTextareaList value={item.bullets} locale={locale} onChange={(v) => set(`${index}.bullets`, v)} />
          {label('Tags')}
          <TagInput value={item.tags} onChange={(v) => set(`${index}.tags`, v)} />
        </div>
      );
    case 'project':
      return (
        <div className="space-y-3">
          {label('Name')}
          <Input type="text" value={item.name || ''} onChange={(e) => set(`${index}.name`, e.target.value)} />
          {label('Bullets')}
          <LocalizedTextareaList value={item.bullets} locale={locale} onChange={(v) => set(`${index}.bullets`, v)} />
          {label('Tech Stack')}
          <TagInput value={item.techStack} onChange={(v) => set(`${index}.techStack`, v)} />
          {label('Date Range')}
          <DateRangeInput value={item.dateRange} onChange={(v) => set(`${index}.dateRange`, v)} />

          {showAdvanced && (
            <>
              {label('Name (Localized)')}
              <LocalizedInput value={item.nameLocalized} locale={locale} onChange={(v) => set(`${index}.nameLocalized`, v)} />
              {label('Subtitle')}
              <LocalizedInput value={item.subtitle} locale={locale} onChange={(v) => set(`${index}.subtitle`, v)} />
              <div className="space-y-2">
                <Label className="text-label-md font-bold tracking-wider text-primary uppercase mb-1.5 block">Links</Label>
                {(item.links || []).map((link, li) => (
                  <div key={li} className="flex flex-row items-center gap-3 w-full">
                    <Input type="text" value={link.label} onChange={(e) => {
                      const links = [...(item.links || [])];
                      links[li] = { ...links[li], label: e.target.value };
                      set(`${index}.links`, links);
                    }} placeholder="Label" className="flex-1" />
                    <Input type="text" value={link.url} onChange={(e) => {
                      const links = [...(item.links || [])];
                      links[li] = { ...links[li], url: e.target.value };
                      set(`${index}.links`, links);
                    }} placeholder="URL" className="flex-1" />
                    <Button variant="ghost" size="xs" onClick={() => set(`${index}.links`, item.links.filter((_, i2) => i2 !== li))}>×</Button>
                  </div>
                ))}
                <Button variant="outline" size="xs" onClick={() => set(`${index}.links`, [...(item.links || []), { label: '', url: '' }])}>+ Add Link</Button>
              </div>
            </>
          )}
        </div>
      );
    case 'education':
      return (
        <div className="space-y-3">
          {label('Degree')}
          <LocalizedInput value={item.degree} locale={locale} onChange={(v) => set(`${index}.degree`, v)} />
          {label('Institution')}
          <Input type="text" value={item.institution || ''} onChange={(e) => set(`${index}.institution`, e.target.value)} />
          {label('Date Range')}
          <DateRangeInput value={item.dateRange} onChange={(v) => set(`${index}.dateRange`, v)} />

          {showAdvanced && (
            <>
              {label('Location')}
              <LocalizedInput value={item.location} locale={locale} onChange={(v) => set(`${index}.location`, v)} />
              {label('Notes')}
              <LocalizedTextareaList value={item.notes} locale={locale} onChange={(v) => set(`${index}.notes`, v)} />
            </>
          )}
        </div>
      );
    case 'skills':
      return (
        <div className="space-y-3">
          {label('Category')}
          <LocalizedInput value={item.category} locale={locale} onChange={(v) => set(`${index}.category`, v)} />
          {label('Skills')}
          <TagInput value={item.skills} onChange={(v) => set(`${index}.skills`, v)} />
        </div>
      );
    case 'languages':
      return (
        <div className="space-y-3">
          {label('Language')}
          <LocalizedInput value={item.name} locale={locale} onChange={(v) => set(`${index}.name`, v)} />
          {label('Level')}
          <LocalizedInput value={item.level} locale={locale} onChange={(v) => set(`${index}.level`, v)} />
        </div>
      );
    default:
      return null;
  }
}

export default function SectionEditor({ section, sectionIndex, locale, onFieldChange, onToggle }) {
  const [advancedItems, setAdvancedItems] = useState(new Set());
  const set = (path, value) => onFieldChange(path, value);

  const toggleAdvanced = (i) => {
    setAdvancedItems((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  };

  const hasAdvanced = (type) => type === 'project' || type === 'education';

  return (
    <div className="space-y-4">
      {(section.items || []).map((item, i) => (
        <div key={i} className="bg-surface-container border border-outline-variant rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant">
            <span className="text-label-md font-bold tracking-wider text-primary uppercase">
              Item #{i + 1}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-lg px-3 text-xs font-medium"
                title="Collapse section"
                onClick={onToggle}
              >View</Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-lg px-3 text-xs font-medium text-error border-error/50 hover:bg-error-container"
                onClick={() => {
                  const items = section.items.filter((_, idx) => idx !== i);
                  set(`sections.${sectionIndex}.items`, items);
                }}
                title="Remove item"
              >Delete</Button>
            </div>
          </div>

          <div className="p-4">
            <ItemEditor
              item={item}
              index={i}
              sectionType={section.type}
              locale={locale}
              onChange={onFieldChange}
              showAdvanced={advancedItems.has(i)}
            />
          </div>

          {hasAdvanced(section.type) && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start border-t border-outline-variant rounded-none text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
              onClick={() => toggleAdvanced(i)}
            >
              <span className="text-xs">▼</span>
              <span className="ml-2 text-label-md font-medium">{advancedItems.has(i) ? 'Hide advanced options' : 'Show advanced options'}</span>
            </Button>
          )}

          <div className="px-4 pb-4">
            <Button
              variant="outline"
              className="w-full h-9 rounded-lg text-xs font-medium"
              onClick={onToggle}
            >✓ Done</Button>
          </div>
        </div>
      ))}

      <Button
        variant="outline"
        size="sm"
        className="w-full border-dashed h-10 rounded-xl text-xs font-medium"
        onClick={() => {
          const blank = blankItem(section.type);
          set(`sections.${sectionIndex}.items`, [...(section.items || []), blank]);
        }}
      >+ Add {section.type}</Button>
    </div>
  );
}

function blankItem(type) {
  const base = { type };
  switch (type) {
    case 'text': return { ...base, content: {} };
    case 'experience': return { ...base, role: {}, organization: '', location: {}, dateRange: { start: '' }, bullets: {}, tags: [] };
    case 'project': return { ...base, name: '', nameLocalized: {}, subtitle: {}, dateRange: { start: '' }, bullets: {}, techStack: [], links: [] };
    case 'education': return { ...base, degree: {}, institution: '', location: {}, dateRange: { start: '' }, notes: {} };
    case 'skills': return { ...base, category: {}, skills: [] };
    case 'languages': return { ...base, name: {}, level: {} };
    default: return base;
  }
}
