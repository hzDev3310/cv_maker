import { useState, useCallback, useEffect, useRef } from 'react';
import seedData from './data/cv-data.json';
import {
  loadFromStorage,
  saveToStorage,
  clearStorage,
  getHistory,
  addToHistory,
  loadFromHistory,
  deleteFromHistory,
  loadAtsResult,
  loadGeneralAtsResult,
} from './utils/storage';
import { saveBackupFile, readBackupFile, applyBackupPayload } from './utils/backup';
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

function HistoryTab({ history, onLoad, onDelete, onExportBackup, onImportBackup, backupStatus }) {
  return (
    <div className="p-6 h-full">
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-on-surface">Snapshot History</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onImportBackup}>Import Backup</Button>
            <Button variant="default" size="sm" onClick={onExportBackup}>Export Backup</Button>
          </div>
        </div>
        <p className="text-xs text-on-surface-variant">
          Backup includes CV data, history, and AI settings, but excludes API keys.
        </p>
        {backupStatus && (
          <div className="text-xs rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-on-surface-variant">
            {backupStatus}
          </div>
        )}
      </div>
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
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [locale, setLocale] = useState('en');
  const [lastSaved, setLastSaved] = useState(null);
  const [history, setHistory] = useState(() => getHistory());
  const [activeLeftTab, setActiveLeftTab] = useState('content');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [backupStatus, setBackupStatus] = useState('');
  const saveTimer = useRef(null);
  const backupFileInputRef = useRef(null);

  const debouncedSave = useCallback((data) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveToStorage(data);
      setLastSaved(Date.now());
    }, 400);
  }, []);

  const handleFieldChange = useCallback((path, value) => {
    setCvData((prev) => {
      const next = path === '' ? value : updateField(prev, path, value);
      if (JSON.stringify(next) === JSON.stringify(prev)) {
        return prev;
      }
      setUndoStack((stack) => [...stack, prev].slice(-20));
      setRedoStack([]);
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
      setUndoStack((stack) => [...stack, prev].slice(-20));
      setRedoStack([]);
      debouncedSave(next);
      return next;
    });
  }, [debouncedSave]);

  const handleUndo = useCallback(() => {
    setUndoStack((stack) => {
      if (stack.length === 0) return stack;
      const restored = stack[stack.length - 1];
      setRedoStack((future) => [cvData, ...future].slice(0, 20));
      setCvData(restored);
      debouncedSave(restored);
      setLastSaved(Date.now());
      return stack.slice(0, -1);
    });
  }, [cvData, debouncedSave]);

  const handleRedo = useCallback(() => {
    setRedoStack((stack) => {
      if (stack.length === 0) return stack;
      const restored = stack[0];
      setUndoStack((past) => [...past, cvData].slice(-20));
      debouncedSave(restored);
      setLastSaved(Date.now());
      setCvData(restored);
      return stack.slice(1);
    });
  }, [cvData, debouncedSave]);

  const handleReset = useCallback(() => {
    if (window.confirm('Reset to default data? This will clear your current edits.')) {
      clearStorage();
      setCvData(seedData);
      setUndoStack([]);
      setRedoStack([]);
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
      setUndoStack([]);
      setRedoStack([]);
      saveToStorage(data);
      setLastSaved(Date.now());
    }
  }, []);

  const handleDeleteSnapshot = useCallback((id) => {
    deleteFromHistory(id);
    setHistory(getHistory());
  }, []);

  const applyImportedBackupToState = useCallback(() => {
    setCvData(loadFromStorage(seedData));
    setHistory(getHistory());
    setUndoStack([]);
    setRedoStack([]);
    setLastSaved(Date.now());
  }, []);

  const handleExportBackup = useCallback(async () => {
    try {
      const filename = await saveBackupFile();
      setBackupStatus(`Backup exported as ${filename}.`);
    } catch (error) {
      setBackupStatus(error?.name === 'AbortError' ? 'Backup export canceled.' : 'Could not export backup.');
    }
  }, []);

  const handleImportBackupFile = useCallback(async (file) => {
    if (!file) return;
    try {
      const payload = await readBackupFile(file);
      const ok = applyBackupPayload(payload);
      if (!ok) {
        setBackupStatus('The selected file is not a valid backup.');
        return;
      }
      applyImportedBackupToState();
      setBackupStatus(`Backup imported from ${file.name}.`);
    } catch (error) {
      setBackupStatus('Could not import backup.');
    }
  }, [applyImportedBackupToState]);

  const handleImportBackup = useCallback(async () => {
    if (window.showOpenFilePicker) {
      try {
        const [handle] = await window.showOpenFilePicker({
          multiple: false,
          types: [
            {
              description: 'CV Builder backup',
              accept: { 'application/json': ['.json'] },
            },
          ],
        });
        if (!handle) return;
        const file = await handle.getFile();
        await handleImportBackupFile(file);
      } catch (error) {
        if (error?.name !== 'AbortError') {
          setBackupStatus('Could not open backup file picker.');
        }
      }
      return;
    }

    backupFileInputRef.current?.click();
  }, [handleImportBackupFile]);

  const handleBackupInputChange = useCallback(async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) {
      await handleImportBackupFile(file);
    }
  }, [handleImportBackupFile]);

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

  useEffect(() => {
    const isEditableTarget = (target) => {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName?.toLowerCase();
      return (
        target.isContentEditable ||
        tag === 'input' ||
        tag === 'textarea' ||
        tag === 'select'
      );
    };

    const onKeyDown = (e) => {
      if (isEditableTarget(e.target)) return;
      const key = e.key.toLowerCase();
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      if (key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (undoStack.length > 0) handleUndo();
      }
      if (key === 'y' || (key === 'z' && e.shiftKey)) {
        e.preventDefault();
        if (redoStack.length > 0) handleRedo();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleUndo, handleRedo, undoStack.length, redoStack.length]);

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
              onExportBackup={handleExportBackup}
              onImportBackup={handleImportBackup}
              backupStatus={backupStatus}
            />
          </div>

          {/* AI tabs: Chat / Job Description / ATS */}
          <div className={`left-pane ${['chat', 'job', 'ats', 'grammar'].includes(activeLeftTab) ? 'left-pane-visible' : 'left-pane-hidden'}`}>
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
          <PreviewPanel
            cvData={cvData}
            locale={locale}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={undoStack.length > 0}
            canRedo={redoStack.length > 0}
          />
        </div>
      </div>

      {showSaveModal && (
        <SaveModal
          onSave={handleSaveSnapshot}
          onClose={() => setShowSaveModal(false)}
        />
      )}

      <input
        ref={backupFileInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={handleBackupInputChange}
      />
    </div>
  );
}
