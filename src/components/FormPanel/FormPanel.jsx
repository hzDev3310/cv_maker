import { useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import MetaEditor from './MetaEditor';
import SectionEditor from './SectionEditor';
import LocalizedInput from './fields/LocalizedInput';

export default function FormPanel({ cvData, locale, onFieldChange, onMoveSection, onReset }) {
  const sections = cvData.sections || [];
  const [openSection, setOpenSection] = useState(null);

  const toggleSection = useCallback((idx) => {
    setOpenSection((prev) => (prev === idx ? null : idx));
  }, []);

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {/* Personal Info Card */}
      <Card className="border border-outline-variant rounded-xl">
        <CardHeader className="pb-0">
          <CardTitle className="text-label-md font-bold tracking-wider text-primary uppercase">Personal Info</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <MetaEditor meta={cvData.meta} locale={locale} onChange={onFieldChange} />
        </CardContent>
      </Card>

      {/* Sections Card */}
      <Card className="border border-outline-variant rounded-xl">
        <CardHeader className="pb-0">
          <CardTitle className="text-label-md font-bold tracking-wider text-primary uppercase">Sections</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 pb-4">
          {sections.length === 0 && (
            <p className="text-sm text-on-surface-variant text-center py-8">No sections yet</p>
          )}
          {sections.map((section, i) => {
            const isOpen = openSection === i;
            return (
              <div key={section.id || i} className="bg-surface-container-low border border-outline-variant rounded-xl mb-3 overflow-hidden">
                <div className="flex items-center gap-2 p-3 cursor-pointer select-none" onClick={() => toggleSection(i)}>
                  <div className="flex gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      type="button"
                      disabled={i === 0}
                      onClick={() => onMoveSection(i, i - 1)}
                      title="Move up"
                      className="text-on-surface-variant hover:text-on-surface"
                    >↑</Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      type="button"
                      disabled={i === sections.length - 1}
                      onClick={() => onMoveSection(i, i + 1)}
                      title="Move down"
                      className="text-on-surface-variant hover:text-on-surface"
                    >↓</Button>
                  </div>
                  <span className="text-xs text-on-surface-variant shrink-0">{isOpen ? '▼' : '▶'}</span>
                  <span className="flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                    <LocalizedInput
                      value={section.title}
                      locale={locale}
                      onChange={(v) => onFieldChange(`sections.${i}.title`, v)}
                      className="bg-transparent border-transparent h-8 px-2 shadow-none hover:bg-surface-container-high/50 focus:bg-surface-container-high text-on-surface rounded-lg"
                    />
                  </span>
                </div>
                {isOpen && (
                  <div className="border-t border-outline-variant p-4">
                    <SectionEditor section={section} sectionIndex={i} locale={locale} onFieldChange={onFieldChange} onToggle={() => toggleSection(i)} />
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
