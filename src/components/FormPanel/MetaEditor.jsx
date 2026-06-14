import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import LocalizedInput from './fields/LocalizedInput';
import LocalizedTextarea from './fields/LocalizedTextarea';

export default function MetaEditor({ meta, locale, onChange }) {
  const update = (path, value) => onChange(`meta.${path}`, value);

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-label-md font-bold tracking-wider text-primary uppercase mb-1.5 block">Name</Label>
        <Input type="text" value={meta.name || ''} onChange={(e) => update('name', e.target.value)} placeholder="Your name" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-label-md font-bold tracking-wider text-primary uppercase mb-1.5 block">Job Title</Label>
        <LocalizedInput value={meta.jobTitle} locale={locale} onChange={(v) => update('jobTitle', v)} />
      </div>
      <div className="space-y-1.5">
        <Label className="text-label-md font-bold tracking-wider text-primary uppercase mb-1.5 block">Email</Label>
        <Input type="email" value={meta.contact?.email || ''} onChange={(e) => update('contact.email', e.target.value)} placeholder="email@example.com" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-label-md font-bold tracking-wider text-primary uppercase mb-1.5 block">Phone</Label>
        <Input type="text" value={meta.contact?.phone || ''} onChange={(e) => update('contact.phone', e.target.value)} placeholder="+1 555-0000" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-label-md font-bold tracking-wider text-primary uppercase mb-1.5 block">Location</Label>
        <LocalizedInput value={meta.contact?.location} locale={locale} onChange={(v) => update('contact.location', v)} />
      </div>

      <div className="space-y-3 pt-2">
        <h4 className="text-label-md font-bold tracking-wider text-primary uppercase">Links</h4>
        {(meta.contact?.links || []).map((link, i) => (
          <div key={i} className="flex flex-row items-center gap-3 w-full">
            <Input
              type="text"
              value={link.label || ''}
              onChange={(e) => {
                const links = [...(meta.contact?.links || [])];
                links[i] = { ...links[i], label: e.target.value };
                update('contact.links', links);
              }}
              placeholder="Label"
              className="flex-1"
            />
            <Input
              type="text"
              value={link.url || ''}
              onChange={(e) => {
                const links = [...(meta.contact?.links || [])];
                links[i] = { ...links[i], url: e.target.value };
                update('contact.links', links);
              }}
              placeholder="URL"
              className="flex-1"
            />
            <Button variant="outline" size="sm" type="button" onClick={() => {
              const links = (meta.contact?.links || []).filter((_, idx) => idx !== i);
              update('contact.links', links);
            }} className="shrink-0">×</Button>
          </div>
        ))}
        <Button variant="outline" size="sm" type="button" onClick={() => {
          const links = [...(meta.contact?.links || []), { label: '', url: '' }];
          update('contact.links', links);
        }}>+ Add Link</Button>
      </div>
    </div>
  );
}
