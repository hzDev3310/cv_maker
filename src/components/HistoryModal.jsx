import { Button } from '@/components/ui/button';

export default function HistoryModal({ history, onLoad, onDelete, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 animate-in fade-in" onClick={onClose}>
      <div className="bg-surface border border-outline-variant rounded-2xl w-[500px] max-h-[75vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center px-6 pt-5 pb-3">
          <h2 className="text-lg font-bold text-on-surface m-0">Snapshot History</h2>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>×</Button>
        </div>
        <div className="px-6 pb-5 overflow-y-auto flex-1">
          {history.length === 0 && (
            <p className="text-sm text-on-surface-variant text-center mt-6">No snapshots saved yet.</p>
          )}
          {history.length > 0 && (
            <ul className="space-y-2 list-none m-0 p-0">
              {history.map((entry) => (
                <li key={entry.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low border border-outline-variant">
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm font-semibold text-on-surface truncate">{entry.name}</span>
                    <span className="text-xs text-on-surface-variant mt-0.5">{formatDate(entry.timestamp)}</span>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0 ml-3">
                    <Button variant="default" size="sm" onClick={() => { onLoad(entry.id); onClose(); }}>Load</Button>
                    <Button variant="ghost" size="icon-sm" className="text-on-surface-variant hover:text-on-surface" onClick={() => onDelete(entry.id)}>×</Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function formatDate(ts) {
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
