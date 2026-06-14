import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

export default function DateRangeInput({ value, onChange }) {
  const v = value || { start: '' };
  const set = (key, val) => onChange({ ...v, [key]: val });
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-3">
        <div className="flex-col gap-1 flex-1">
          <Label className="text-label-md font-bold tracking-wider text-primary uppercase mb-1.5 block">Start</Label>
          <Input type="text" value={v.start || ''} onChange={(e) => set('start', e.target.value)} placeholder="2024-01" />
        </div>
        <div className="flex-col gap-1 flex-1">
          <Label className="text-label-md font-bold tracking-wider text-primary uppercase mb-1.5 block">End</Label>
          <Input type="text" value={v.end || ''} onChange={(e) => set('end', e.target.value)} placeholder="2024-01" />
        </div>
      </div>
      <Label className="flex items-center gap-2 text-label-md font-medium text-on-surface-variant cursor-pointer mt-1">
        <Switch checked={!!v.isOngoing} onCheckedChange={(val) => set('isOngoing', val)} size="sm" />
        Present
      </Label>
    </div>
  );
}
