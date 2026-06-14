import { useState, useCallback, useEffect, useRef } from 'react';
import seedData from './data/cv-data.json';
import { loadFromStorage, saveToStorage, clearStorage, getHistory, addToHistory, loadFromHistory, deleteFromHistory } from './utils/storage';
import updateField from './utils/updateField';
import FormPanel from './components/FormPanel/FormPanel';
import LanguageToggle from './components/FormPanel/LanguageToggle';
import PreviewPanel from './components/Preview/PreviewPanel';
import AIAssistantPanel from './components/AIAssistantPanel';
import SaveModal from './components/SaveModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import './App.css';

function HistoryTab({ history, onLoad, onDelete }) {
  return (
    <div className="p-6 h-full">
      <h2 className="text-lg font-bold text-on-surface mb-4">Snapshot History</h2>
      {history.length === 0 && (
        <p className="text-sm text-on-surface-variant text-center mt-6">No snapshots saved yet. Use the "Save" button in the navbar to save one.</p>
      )}
      {history.length > 0 && (
        <ul className="space-y-2">
          {history.map((entry) => (
            <li key={entry.id} className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low border border-outline-variant hover:border-primary/50 transition-colors">
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm font-semibold text-on-surface truncate">{entry.name}</span>
                <span className="text-xs text-on-surface-variant mt-0.5">{formatDate(entry.timestamp)}</span>
              </div>
              <div className="flex gap-1.5 flex-shrink-0 ml-3">
                 <Button variant="default" size="sm" onClick={() => onLoad(entry.id)}>Load</Button>
                <Button variant="ghost" size="icon-sm" className="text-on-surface-variant hover:text-on-surface" onClick={() => onDelete(entry.id)}>×</Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function formatDate(ts) {
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function App() {
  const [cvData, setCvData] = useState(() => loadFromStorage(seedData));
  const [locale, setLocale] = useState('en');
  const [lastSaved, setLastSaved] = useState(null);
  const [history, setHistory] = useState(() => getHistory());
  const [activeLeftTab, setActiveLeftTab] = useState('content');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const saveTimer = useRef(null);

  const debouncedSave = useCallback((data) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveToStorage(data);
      setLastSaved(Date.now());
    }, 400);
  }, []);

  const handleFieldChange = useCallback((path, value) => {
    setCvData((prev) => {
      if (path === '') {
        const next = value;
        debouncedSave(next);
        return next;
      }
      const next = updateField(prev, path, value);
      debouncedSave(next);
      return next;
    });
  }, [debouncedSave]);

  const handleMoveSection = useCallback((fromIndex, toIndex) => {
    setCvData((prev) => {
      const sections = [...(prev.sections || [])];
      const [moved] = sections.splice(fromIndex, 1);
      sections.splice(toIndex, 0, moved);
      const next = { ...prev, sections };
      debouncedSave(next);
      return next;
    });
  }, [debouncedSave]);

  const handleReset = useCallback(() => {
    if (window.confirm('Reset to default data? This will clear your current edits.')) {
      clearStorage();
      setCvData(seedData);
      setLastSaved(null);
    }
  }, []);

  const handleSaveSnapshot = useCallback((title) => {
    addToHistory(cvData, title);
    setHistory(getHistory());
    setShowSaveModal(false);
  }, [cvData]);

  const handleLoadSnapshot = useCallback((id) => {
    const data = loadFromHistory(id);
    if (data) {
      setCvData(data);
      saveToStorage(data);
      setLastSaved(Date.now());
    }
  }, []);

  const handleDeleteSnapshot = useCallback((id) => {
    deleteFromHistory(id);
    setHistory(getHistory());
  }, []);

  const handleExportPDF = useCallback(async () => {
    const pages = document.querySelectorAll('.cv-page');
    if (!pages.length) return;
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = 210;
    for (let i = 0; i < pages.length; i++) {
      const canvas = await html2canvas(pages[i], { scale: 2, useCORS: true, logging: false });
      const imgData = canvas.toDataURL('image/png');
      const imgHeight = (canvas.height * pageWidth) / canvas.width;
      if (i > 0) pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, imgHeight);
    }
    pdf.save('cv.pdf');
  }, []);

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  return (
    <div className="app-root">
      <nav className="flex items-center justify-between px-6 h-16 bg-surface border-b border-outline-variant flex-shrink-0 z-20">
        <div className="flex items-center gap-6">
          <div className="font-headline-lg text-headline-lg font-bold text-primary">CV Builder</div>
          <Separator orientation="vertical" className="h-6 bg-outline-variant" />
          <div className="flex items-center gap-6">
            <button className={`font-label-lg text-label-lg transition-colors duration-200 pb-1 ${activeLeftTab === 'content' ? 'text-primary font-bold border-b-2 border-primary' : 'text-on-surface-variant font-medium hover:text-primary'}`} onClick={() => setActiveLeftTab('content')}>
              Editor
            </button>
            <button className={`font-label-lg text-label-lg transition-colors duration-200 pb-1 ${activeLeftTab === 'chat' ? 'text-primary font-bold border-b-2 border-primary' : 'text-on-surface-variant font-medium hover:text-primary'}`} onClick={() => setActiveLeftTab('chat')}>
              Chat
            </button>
            <button className={`font-label-lg text-label-lg transition-colors duration-200 pb-1 ${activeLeftTab === 'job' ? 'text-primary font-bold border-b-2 border-primary' : 'text-on-surface-variant font-medium hover:text-primary'}`} onClick={() => setActiveLeftTab('job')}>
              Job
            </button>
            <button className={`font-label-lg text-label-lg transition-colors duration-200 pb-1 ${activeLeftTab === 'ats' ? 'text-primary font-bold border-b-2 border-primary' : 'text-on-surface-variant font-medium hover:text-primary'}`} onClick={() => setActiveLeftTab('ats')}>
              ATS
            </button>
            <button className={`font-label-lg text-label-lg transition-colors duration-200 pb-1 ${activeLeftTab === 'grammar' ? 'text-primary font-bold border-b-2 border-primary' : 'text-on-surface-variant font-medium hover:text-primary'}`} onClick={() => setActiveLeftTab('grammar')}>
              Grammar
            </button>
            <button className={`font-label-lg text-label-lg transition-colors duration-200 pb-1 ${activeLeftTab === 'history' ? 'text-primary font-bold border-b-2 border-primary' : 'text-on-surface-variant font-medium hover:text-primary'}`} onClick={() => setActiveLeftTab('history')}>
              History
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="default" onClick={handleExportPDF}>
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowSaveModal(true)}>
            Save
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={handleReset} title="Reset">⋮</Button>
          {lastSaved && <Badge variant="outline" className="border-outline text-on-surface-variant">✓ Saved</Badge>}
        </div>
      </nav>

      {/* 2-column layout */}
      <div className="app-layout">
        <aside className="relative h-full overflow-hidden bg-surface border-r border-outline-variant">
          {/* Content tab */}
          <div className={`left-pane ${activeLeftTab === 'content' ? 'left-pane-visible' : 'left-pane-hidden'}`}>
            <FormPanel
              cvData={cvData}
              locale={locale}
              onFieldChange={handleFieldChange}
              onMoveSection={handleMoveSection}
              onReset={handleReset}
            />
          </div>

          {/* History tab */}
          <div className={`left-pane ${activeLeftTab === 'history' ? 'left-pane-visible' : 'left-pane-hidden'}`}>
            <HistoryTab
              history={history}
              onLoad={handleLoadSnapshot}
              onDelete={handleDeleteSnapshot}
            />
          </div>

          {/* AI tabs: Chat / Job Description / ATS */}
          <div className={`left-pane ${['chat', 'job', 'ats'].includes(activeLeftTab) ? 'left-pane-visible' : 'left-pane-hidden'}`}>
            <AIAssistantPanel
              cvData={cvData}
              locale={locale}
              onFieldChange={handleFieldChange}
              activeTab={activeLeftTab}
            />
          </div>
        </aside>

        <div className="overflow-y-auto h-full flex flex-col bg-surface-dim">
          <div className="flex justify-end px-5 py-2.5 sticky top-0 z-10 bg-surface-dim">
            <LanguageToggle locales={cvData.locales || ['en', 'fr']} locale={locale} onChange={setLocale} />
          </div>
          <PreviewPanel cvData={cvData} locale={locale} />
        </div>
      </div>

      {showSaveModal && (
        <SaveModal
          onSave={handleSaveSnapshot}
          onClose={() => setShowSaveModal(false)}
        />
      )}
    </div>
  );
}
