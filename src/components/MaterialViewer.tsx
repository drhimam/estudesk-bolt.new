import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft,
  Trash2,
  Download,
  RotateCw,
  Check,
  X,
  MoreVertical,
  Pencil,
  FileDown,
  FileText,
  ChevronLeft,
  ChevronRight,
  Layers,
  Grid,
  Shuffle,
  Trophy,
  Lightbulb,
  Bookmark,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  ListTree,
  Volume2,
  VolumeX,
  Sparkles,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { db } from '@/db/database';
import { useSubject } from '@/hooks/useQueries';
import { COLOR_HEX, COLOR_LIGHT, COLOR_TEXT } from '@/utils/colors';
import { exportMaterialAsPdf } from '@/utils/pdfExport';
import { FocusTimer } from '@/components/FocusTimer';
import { ambientAudio, type AmbientSoundType } from '@/utils/ambientAudio';
import type { StudyMaterial, SubjectColor, Flashcard, QuizQuestion, PresentationSlide } from '@/types';

export function MathFormula({ formula, display = true }: { formula: string; display?: boolean }) {
  try {
    const html = katex.renderToString(formula, { displayMode: display, throwOnError: false });
    return <div className="my-2 overflow-x-auto text-center" dangerouslySetInnerHTML={{ __html: html }} />;
  } catch {
    return <code className="block bg-paper-100 p-2 rounded text-xs font-mono">{formula}</code>;
  }
}

interface Props {
  material: StudyMaterial;
  subjectColor: SubjectColor;
  onBack: () => void;
  onRenamed?: () => void;
}

export function MaterialViewer({ material, subjectColor, onBack, onRenamed }: Props) {
  const hex = COLOR_HEX[subjectColor];
  const bg = COLOR_LIGHT[subjectColor];
  const text = COLOR_TEXT[subjectColor];
  const subject = useSubject(material.subjectId);
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [titleInput, setTitleInput] = useState(material.title);

  // --- Focus Mode State ---
  const [focusMode, setFocusMode] = useState(false);
  const [focusTheme, setFocusTheme] = useState<'paper' | 'clean' | 'dark' | 'sage'>('paper');
  const [fontSize, setFontSize] = useState<number>(16);
  const [tocOpen, setTocOpen] = useState(false);
  const [ambientMenuOpen, setAmbientMenuOpen] = useState(false);
  const [activeAmbient, setActiveAmbient] = useState<AmbientSoundType>('off');

  // Lock body scroll when Focus Mode is active
  useEffect(() => {
    if (focusMode) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [focusMode]);

  // Extract Table of Contents from markdown headings
  const tableOfContents = useMemo(() => {
    const raw = material.contentMarkdown || material.sourceSnippet || '';
    if (!raw) return [];
    const lines = raw.split('\n');
    const items: { level: number; text: string; id: string }[] = [];

    lines.forEach((line) => {
      const match = line.match(/^(#{1,3})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const headingText = match[2].trim().replace(/[*_`]/g, '');
        const id = headingText.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        items.push({ level, text: headingText, id });
      }
    });

    return items;
  }, [material.contentMarkdown, material.sourceSnippet]);

  // Handle ambient sound toggle
  function handleAmbientChange(type: AmbientSoundType) {
    setActiveAmbient(type);
    setAmbientMenuOpen(false);
    if (type === 'off') {
      ambientAudio.stop();
    } else {
      ambientAudio.play(type, 0.35);
    }
  }

  // Keyboard shortcut for Focus Mode (F to toggle, Esc to exit)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'f' || e.key === 'F') {
        if (!e.metaKey && !e.ctrlKey && !e.altKey) {
          e.preventDefault();
          setFocusMode((prev) => !prev);
        }
      } else if (e.key === 'Escape') {
        if (tocOpen) {
          setTocOpen(false);
        } else if (focusMode) {
          setFocusMode(false);
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusMode, tocOpen]);

  // Cleanup ambient sound on unmount
  useEffect(() => {
    return () => {
      ambientAudio.stop();
    };
  }, []);

  async function remove() {
    await db.materials.delete(material.id);
    onBack();
  }

  async function rename() {
    const trimmed = titleInput.trim();
    if (!trimmed || trimmed === material.title) {
      setRenaming(false);
      return;
    }
    await db.materials.update(material.id, { title: trimmed, updatedAt: Date.now() });
    material.title = trimmed;
    setRenaming(false);
    onRenamed?.();
  }

  function handleDownloadPdf() {
    exportMaterialAsPdf({
      material,
      subjectName: subject?.name,
      subjectColor,
    });
    setMenuOpen(false);
  }

  function downloadRaw() {
    let content = '';
    let filename = material.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'material';

    if (material.contentMarkdown) {
      content = material.contentMarkdown;
      filename += '.md';
    } else if (material.contentHtml) {
      content = material.contentHtml;
      filename += '.html';
    } else if (material.flashcards) {
      content = material.flashcards.map(c => `Q: ${c.front}\nA: ${c.back}`).join('\n\n');
      filename += '.txt';
    } else if (material.quiz) {
      content = material.quiz.map(q => {
        const ans = q.type === 'short' ? '(short answer)' : q.correctAnswer.join(', ');
        return `Q: ${q.question}\nOptions: ${q.options.join(' | ')}\nAnswer: ${ans}${q.explanation ? `\nExplanation: ${q.explanation}` : ''}`;
      }).join('\n\n');
      filename += '.txt';
    } else if (material.slides) {
      content = material.slides.map(s =>
        `## ${s.title}\n${s.points.map(p => `- ${p}`).join('\n')}${s.notes ? `\n\nNotes: ${s.notes}` : ''}`
      ).join('\n\n---\n\n');
      filename += '.md';
    } else if (material.sourceSnippet) {
      content = material.sourceSnippet;
      filename += '.md';
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setMenuOpen(false);
  }

  // --- FOCUS MODE VIEWPORT OVERLAY (MOUNTED TO ROOT PORTAL) ---
  if (focusMode) {
    const containerThemeClasses = {
      paper: 'bg-[#fcf9f2] text-[#1c1917]',
      clean: 'bg-white text-[#0f172a]',
      dark: 'bg-[#090d16] text-[#e2e8f0]',
      sage: 'bg-[#f1f6f3] text-[#143628]',
    }[focusTheme];

    const headerThemeClasses = {
      paper: 'bg-[#fcf9f2] border-paper-300',
      clean: 'bg-white border-slate-200',
      dark: 'bg-[#090d16] border-slate-800',
      sage: 'bg-[#f1f6f3] border-emerald-200',
    }[focusTheme];

    return createPortal(
      <div className={`fixed inset-0 z-[99999] w-screen h-screen flex flex-col focus-theme-${focusTheme} ${containerThemeClasses} overflow-hidden animate-fade-in`}>
        {/* Floating Focus Toolbar */}
        <header className={`flex items-center justify-between gap-3 px-4 lg:px-8 py-3 border-b ${headerThemeClasses} shrink-0 z-20 shadow-sm`}>
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setFocusMode(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-all text-ink-800 dark:text-white shrink-0"
              title="Exit Focus Mode (Esc)"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exit Focus</span>
              <kbd className="text-[10px] opacity-60 bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded ml-0.5">Esc</kbd>
            </button>

            <div
              className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0"
              style={{ backgroundColor: bg, color: text }}
            >
              {material.type.charAt(0).toUpperCase()}
            </div>
            <h1 className="font-serif text-base font-bold text-ink-900 dark:text-white truncate max-w-xs sm:max-w-md">
              {material.title}
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Focus Timer Widget */}
            <div className="hidden md:flex">
              <FocusTimer hex={hex} />
            </div>

            {/* Ambient Audio Selector */}
            <div className="relative">
              <button
                onClick={() => setAmbientMenuOpen(!ambientMenuOpen)}
                className={`p-2 rounded-xl border text-xs font-medium transition-all ${
                  activeAmbient !== 'off'
                    ? 'border-accent-400 bg-accent-50 text-accent-700'
                    : 'border-black/10 dark:border-white/10 bg-white/50 dark:bg-white/5 text-ink-600 dark:text-white/80'
                }`}
                title={
                  activeAmbient === 'flute'
                    ? 'Atmosphere: Melodious Flute'
                    : activeAmbient === 'birds'
                    ? 'Atmosphere: Morning Birds'
                    : activeAmbient === 'alpha'
                    ? 'Atmosphere: Alpha Waves (432Hz)'
                    : activeAmbient === 'rain'
                    ? 'Atmosphere: Gentle Rain'
                    : 'Ambient Atmosphere'
                }
              >
                {activeAmbient !== 'off' ? <Volume2 className="w-3.5 h-3.5 animate-pulse text-accent-600" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>

              {ambientMenuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setAmbientMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 z-40 w-56 bg-white dark:bg-ink-900 rounded-2xl border border-paper-200 dark:border-ink-700 shadow-lifted p-1.5 space-y-1 text-xs">
                    <p className="text-[10px] font-bold text-ink-400 dark:text-ink-300 px-2 py-1 uppercase tracking-wider">
                      Study Atmosphere
                    </p>
                    <button
                      onClick={() => handleAmbientChange('flute')}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors flex items-center justify-between ${
                        activeAmbient === 'flute' ? 'bg-accent-50 text-accent-700 dark:bg-ink-800 dark:text-accent-300 font-bold' : 'hover:bg-paper-50 dark:hover:bg-ink-800/50'
                      }`}
                    >
                      <span>🪈 Melodious Flute & Zen</span>
                      {activeAmbient === 'flute' && <span className="w-1.5 h-1.5 rounded-full bg-accent-500" />}
                    </button>
                    <button
                      onClick={() => handleAmbientChange('birds')}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors flex items-center justify-between ${
                        activeAmbient === 'birds' ? 'bg-accent-50 text-accent-700 dark:bg-ink-800 dark:text-accent-300 font-bold' : 'hover:bg-paper-50 dark:hover:bg-ink-800/50'
                      }`}
                    >
                      <span>🐦 Morning Birds & Forest</span>
                      {activeAmbient === 'birds' && <span className="w-1.5 h-1.5 rounded-full bg-accent-500" />}
                    </button>
                    <button
                      onClick={() => handleAmbientChange('alpha')}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors flex items-center justify-between ${
                        activeAmbient === 'alpha' ? 'bg-accent-50 text-accent-700 dark:bg-ink-800 dark:text-accent-300 font-bold' : 'hover:bg-paper-50 dark:hover:bg-ink-800/50'
                      }`}
                    >
                      <span>🧠 Alpha Waves (432Hz)</span>
                      {activeAmbient === 'alpha' && <span className="w-1.5 h-1.5 rounded-full bg-accent-500" />}
                    </button>
                    <button
                      onClick={() => handleAmbientChange('rain')}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors flex items-center justify-between ${
                        activeAmbient === 'rain' ? 'bg-accent-50 text-accent-700 dark:bg-ink-800 dark:text-accent-300 font-bold' : 'hover:bg-paper-50 dark:hover:bg-ink-800/50'
                      }`}
                    >
                      <span>🌧️ Gentle Rain</span>
                      {activeAmbient === 'rain' && <span className="w-1.5 h-1.5 rounded-full bg-accent-500" />}
                    </button>
                    <div className="border-t border-paper-200 dark:border-ink-800 my-1" />
                    <button
                      onClick={() => handleAmbientChange('off')}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors ${
                        activeAmbient === 'off' ? 'bg-paper-200 dark:bg-ink-800 font-bold text-ink-600 dark:text-ink-300' : 'hover:bg-paper-50 dark:hover:bg-ink-800/50 text-ink-500'
                      }`}
                    >
                      🔇 Off (Silent)
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Font Size Scaling */}
            <div className="flex items-center bg-white/50 dark:bg-white/5 rounded-xl border border-black/10 dark:border-white/10 p-0.5">
              <button
                onClick={() => setFontSize((s) => Math.max(13, s - 1))}
                className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-ink-600 dark:text-white/80"
                title="Decrease font size"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono px-1.5 font-semibold text-ink-600 dark:text-white/80">
                {fontSize}px
              </span>
              <button
                onClick={() => setFontSize((s) => Math.min(24, s + 1))}
                className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-ink-600 dark:text-white/80"
                title="Increase font size"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Theme Selector */}
            <div className="flex items-center gap-1 bg-white/50 dark:bg-white/5 rounded-xl border border-black/10 dark:border-white/10 p-1">
              <button
                onClick={() => setFocusTheme('paper')}
                className={`w-5 h-5 rounded-full border border-amber-300 transition-all ${
                  focusTheme === 'paper' ? 'ring-2 ring-offset-1 ring-amber-600 scale-110' : 'opacity-70'
                }`}
                style={{ backgroundColor: '#fcf9f2' }}
                title="Warm Paper Theme"
              />
              <button
                onClick={() => setFocusTheme('clean')}
                className={`w-5 h-5 rounded-full border border-slate-300 transition-all ${
                  focusTheme === 'clean' ? 'ring-2 ring-offset-1 ring-slate-800 scale-110' : 'opacity-70'
                }`}
                style={{ backgroundColor: '#ffffff' }}
                title="Clean Light Theme"
              />
              <button
                onClick={() => setFocusTheme('sage')}
                className={`w-5 h-5 rounded-full border border-emerald-300 transition-all ${
                  focusTheme === 'sage' ? 'ring-2 ring-offset-1 ring-emerald-700 scale-110' : 'opacity-70'
                }`}
                style={{ backgroundColor: '#f1f6f3' }}
                title="Sage Eye-Care Theme"
              />
              <button
                onClick={() => setFocusTheme('dark')}
                className={`w-5 h-5 rounded-full border border-slate-700 transition-all ${
                  focusTheme === 'dark' ? 'ring-2 ring-offset-1 ring-sky-400 scale-110' : 'opacity-70'
                }`}
                style={{ backgroundColor: '#090d16' }}
                title="OLED Dark Theme"
              />
            </div>

            {/* Table of Contents Button (if headings exist) */}
            {tableOfContents.length > 0 && (
              <button
                onClick={() => setTocOpen(!tocOpen)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                  tocOpen
                    ? 'border-accent-400 bg-accent-50 text-accent-700'
                    : 'border-black/10 dark:border-white/10 bg-white/50 dark:bg-white/5 text-ink-600 dark:text-white/80'
                }`}
                title="Table of Contents"
              >
                <ListTree className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">TOC</span>
              </button>
            )}

            {/* PDF Exporter */}
            <button
              onClick={handleDownloadPdf}
              className="p-1.5 rounded-xl text-white shadow-soft transition-all hover:opacity-95"
              style={{ backgroundColor: hex }}
              title="Download PDF"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* Focus Mode Body with TOC Drawer */}
        <div className="flex-1 min-h-0 flex relative overflow-hidden">
          {/* Main Content Area */}
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
            <div
              className="max-w-4xl mx-auto px-6 lg:px-12 py-10 animate-fade-in"
              style={{ fontSize: `${fontSize}px` }}
            >
              {material.type === 'notes' && (
                <div className="prose-studesk max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {material.contentMarkdown || ''}
                  </ReactMarkdown>
                </div>
              )}
              {material.type === 'cheatsheet' && (
                <div className="prose-studesk max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {material.contentMarkdown || ''}
                  </ReactMarkdown>
                </div>
              )}
              {material.type === 'assignment' && (
                <div className="prose-studesk max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {material.contentMarkdown || ''}
                  </ReactMarkdown>
                </div>
              )}
              {material.type === 'infographic' && (
                <InfographicViewer html={material.contentHtml || ''} />
              )}
              {material.type === 'flashcards' && (
                <FlashcardViewer cards={material.flashcards || []} hex={hex} bg={bg} text={text} />
              )}
              {material.type === 'quiz' && (
                <QuizViewer questions={material.quiz || []} hex={hex} bg={bg} text={text} />
              )}
              {material.type === 'presentation' && (
                <PresentationViewer slides={material.slides || []} hex={hex} bg={bg} text={text} />
              )}
              {material.type === 'other' && (
                <div className="prose-studesk max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {material.sourceSnippet || ''}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>

          {/* Table of Contents Drawer */}
          {tocOpen && tableOfContents.length > 0 && (
            <div className="w-72 bg-white/90 dark:bg-ink-950/90 backdrop-blur-xl border-l border-black/10 dark:border-white/10 p-5 overflow-y-auto scrollbar-thin shadow-lifted animate-slide-in-right z-30">
              <div className="flex items-center justify-between mb-4">
                <span className="font-serif text-sm font-bold text-ink-900 dark:text-white">
                  Table of Contents
                </span>
                <button
                  onClick={() => setTocOpen(false)}
                  className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-ink-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1.5 text-xs">
                {tableOfContents.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      const el = document.getElementById(item.id);
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`w-full text-left py-1.5 px-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-ink-700 dark:text-ink-300 font-medium truncate ${
                      item.level === 1 ? 'font-bold text-ink-900 dark:text-white' : item.level === 2 ? 'pl-4' : 'pl-7 text-ink-500'
                    }`}
                  >
                    {item.text}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>,
      document.body
    );
  }

  // --- STANDARD MATERIAL VIEWER ---
  return (
    <div className="flex flex-col flex-1 min-h-0">
      <header className="flex items-center gap-3 px-4 lg:px-6 py-3 border-b border-paper-200 bg-white shrink-0">
        <button
          onClick={onBack}
          className="p-1.5 rounded-md hover:bg-paper-100 text-ink-400 transition-colors shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-medium shrink-0"
          style={{ backgroundColor: bg, color: text }}
        >
          {material.type.charAt(0).toUpperCase()}
        </div>
        {renaming ? (
          <input
            autoFocus
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            onBlur={rename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') rename();
              if (e.key === 'Escape') { setRenaming(false); setTitleInput(material.title); }
            }}
            className="font-serif text-lg font-semibold text-ink-800 flex-1 bg-paper-50 border border-paper-300 rounded-md px-2 py-1 focus:outline-none focus:border-accent-400"
          />
        ) : (
          <h1 className="font-serif text-lg font-semibold text-ink-800 truncate flex-1">
            {material.title}
          </h1>
        )}

        <div className="flex items-center gap-2 shrink-0">
          {/* Focus Mode Button */}
          <button
            onClick={() => setFocusMode(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-ink-700 bg-paper-100 hover:bg-paper-200 border border-paper-200 shadow-soft transition-all hover:scale-[1.02] active:scale-95 shrink-0"
            title="Enter Distraction-Free Focus Mode (F)"
          >
            <Maximize2 className="w-3.5 h-3.5 text-accent-600" />
            <span className="hidden sm:inline">Focus Mode</span>
            <kbd className="hidden md:inline text-[10px] text-ink-400 bg-paper-200 px-1 py-0.5 rounded">F</kbd>
          </button>

          {/* Download PDF Button */}
          <button
            onClick={handleDownloadPdf}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white shadow-soft transition-all hover:opacity-95 active:scale-95 shrink-0"
            style={{ backgroundColor: hex }}
            title="Download high-standard structured PDF"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>

          <div className="relative shrink-0">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 rounded-md hover:bg-paper-100 text-ink-400 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 w-48 bg-white rounded-xl border border-paper-200 shadow-lifted py-1 animate-scale-in">
                  <button
                    onClick={() => { setFocusMode(true); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-ink-700 hover:bg-paper-50 transition-colors text-left"
                  >
                    <Maximize2 className="w-4 h-4 text-accent-600" />
                    Enter Focus Mode
                  </button>
                  <button
                    onClick={handleDownloadPdf}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-ink-700 hover:bg-paper-50 transition-colors text-left"
                  >
                    <FileDown className="w-4 h-4 text-accent-600" />
                    Download PDF
                  </button>
                  <button
                    onClick={downloadRaw}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-ink-600 hover:bg-paper-50 transition-colors text-left"
                  >
                    <FileText className="w-4 h-4 text-ink-400" />
                    Download Markdown / Text
                  </button>
                  <div className="border-t border-paper-100 my-1" />
                  <button
                    onClick={() => { setRenaming(true); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-ink-600 hover:bg-paper-50 transition-colors text-left"
                  >
                    <Pencil className="w-4 h-4 text-ink-400" />
                    Rename
                  </button>
                  <button
                    onClick={() => { remove(); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-crimson-600 hover:bg-red-50 transition-colors text-left"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
        <div className="max-w-3xl mx-auto px-4 lg:px-8 py-8 animate-fade-in">
          {material.type === 'notes' && (
            <div className="prose-studesk">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {material.contentMarkdown || ''}
              </ReactMarkdown>
            </div>
          )}
          {material.type === 'cheatsheet' && (
            <div className="prose-studesk">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {material.contentMarkdown || ''}
              </ReactMarkdown>
            </div>
          )}
          {material.type === 'assignment' && (
            <div className="prose-studesk">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {material.contentMarkdown || ''}
              </ReactMarkdown>
            </div>
          )}
          {material.type === 'infographic' && (
            <InfographicViewer html={material.contentHtml || ''} />
          )}
          {material.type === 'flashcards' && (
            <FlashcardViewer cards={material.flashcards || []} hex={hex} bg={bg} text={text} />
          )}
          {material.type === 'quiz' && (
            <QuizViewer questions={material.quiz || []} hex={hex} bg={bg} text={text} />
          )}
          {material.type === 'presentation' && (
            <PresentationViewer slides={material.slides || []} hex={hex} bg={bg} text={text} />
          )}
          {material.type === 'other' && (
            <div className="prose-studesk">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {material.sourceSnippet || ''}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfographicViewer({ html }: { html: string }) {
  return (
    <div className="bg-white rounded-xl border border-paper-200 overflow-hidden shadow-card">
      <iframe
        srcDoc={html}
        title="Infographic"
        sandbox="allow-same-origin"
        className="w-full border-0"
        style={{ minHeight: '500px' }}
      />
    </div>
  );
}

function FlashcardViewer({
  cards,
  hex,
  bg,
  text,
}: {
  cards: Flashcard[];
  hex: string;
  bg: string;
  text: string;
}) {
  const [mode, setMode] = useState<'study' | 'grid'>('study');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardOrder, setCardOrder] = useState<number[]>(() => cards.map((_, i) => i));
  const [isShuffled, setIsShuffled] = useState(false);
  const [confidence, setConfidence] = useState<Record<string, 'hard' | 'medium' | 'easy'>>({});
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [gridFlipped, setGridFlipped] = useState<Set<string>>(new Set());

  const totalCards = cards.length;
  const currentCardIndex = cardOrder[currentIndex] ?? 0;
  const currentCard = cards[currentCardIndex];

  // Stats
  const hardCount = Object.values(confidence).filter((c) => c === 'hard').length;
  const mediumCount = Object.values(confidence).filter((c) => c === 'medium').length;
  const easyCount = Object.values(confidence).filter((c) => c === 'easy').length;
  const reviewedCount = Object.keys(confidence).length;

  // Toggle shuffle
  function toggleShuffle() {
    if (isShuffled) {
      setCardOrder(cards.map((_, i) => i));
      setIsShuffled(false);
    } else {
      const shuffled = [...Array(cards.length).keys()].sort(() => Math.random() - 0.5);
      setCardOrder(shuffled);
      setIsShuffled(true);
    }
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionCompleted(false);
  }

  // Rate card & auto-advance
  function handleRate(level: 'hard' | 'medium' | 'easy') {
    if (!currentCard) return;
    setConfidence((prev) => ({ ...prev, [currentCard.id]: level }));

    if (currentIndex < totalCards - 1) {
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
      }, 150);
    } else {
      setSessionCompleted(true);
    }
  }

  function handleNext() {
    if (currentIndex < totalCards - 1) {
      setIsFlipped(false);
      setCurrentIndex((prev) => prev + 1);
    } else {
      setSessionCompleted(true);
    }
  }

  function handlePrev() {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setCurrentIndex((prev) => prev - 1);
      setSessionCompleted(false);
    }
  }

  function resetSession(onlyMissed = false) {
    if (onlyMissed) {
      const missedIndices = cards
        .map((c, i) => ({ c, i }))
        .filter(({ c }) => confidence[c.id] === 'hard' || confidence[c.id] === 'medium')
        .map(({ i }) => i);
      if (missedIndices.length > 0) {
        setCardOrder(missedIndices);
      }
    } else {
      setCardOrder(cards.map((_, i) => i));
      setConfidence({});
      setIsShuffled(false);
    }
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionCompleted(false);
  }

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (mode !== 'study' || sessionCompleted) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault();
        setIsFlipped((f) => !f);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (isFlipped) {
        if (e.key === '1') handleRate('hard');
        if (e.key === '2') handleRate('medium');
        if (e.key === '3') handleRate('easy');
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, sessionCompleted, isFlipped, currentIndex, totalCards, currentCard]);

  if (!cards || cards.length === 0) {
    return (
      <div className="text-center py-16 text-ink-400 bg-white rounded-2xl border border-paper-200">
        No flashcards available in this deck.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-paper-200 shadow-soft">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setMode('study')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              mode === 'study'
                ? 'text-white shadow-soft'
                : 'text-ink-600 hover:bg-paper-100'
            }`}
            style={mode === 'study' ? { backgroundColor: hex } : undefined}
          >
            <Layers className="w-3.5 h-3.5" />
            Study Mode
          </button>
          <button
            onClick={() => setMode('grid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              mode === 'grid'
                ? 'text-white shadow-soft'
                : 'text-ink-600 hover:bg-paper-100'
            }`}
            style={mode === 'grid' ? { backgroundColor: hex } : undefined}
          >
            <Grid className="w-3.5 h-3.5" />
            Grid View ({totalCards})
          </button>
        </div>

        {mode === 'study' && !sessionCompleted && (
          <div className="flex items-center gap-2">
            <button
              onClick={toggleShuffle}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                isShuffled
                  ? 'border-accent-400 bg-accent-50 text-accent-700'
                  : 'border-paper-200 text-ink-600 hover:bg-paper-50'
              }`}
              title="Shuffle cards"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>{isShuffled ? 'Shuffled' : 'Shuffle'}</span>
            </button>
            <button
              onClick={() => resetSession(false)}
              className="p-1.5 rounded-lg border border-paper-200 text-ink-400 hover:text-ink-700 hover:bg-paper-50 transition-colors"
              title="Restart session"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* GRID VIEW */}
      {mode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
          {cards.map((card, i) => {
            const flipped = gridFlipped.has(card.id);
            const userRating = confidence[card.id];
            return (
              <div
                key={card.id}
                onClick={() => {
                  setGridFlipped((prev) => {
                    const next = new Set(prev);
                    if (next.has(card.id)) next.delete(card.id);
                    else next.add(card.id);
                    return next;
                  });
                }}
                className="group relative h-56 rounded-2xl border border-paper-200 bg-white p-5 flex flex-col justify-between cursor-pointer hover:shadow-lifted hover:border-paper-300 transition-all text-left"
                style={{ borderLeft: `4px solid ${hex}` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="text-[11px] font-semibold px-2 py-0.5 rounded-md"
                      style={{ backgroundColor: bg, color: text }}
                    >
                      #{i + 1}
                    </span>
                    <span className="text-[11px] font-medium text-ink-400 uppercase tracking-wider">
                      {flipped ? 'Answer' : 'Question'}
                    </span>
                  </div>
                  {userRating && (
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        userRating === 'easy'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : userRating === 'medium'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {userRating === 'easy' ? 'Mastered' : userRating === 'medium' ? 'Review Soon' : 'Needs Practice'}
                    </span>
                  )}
                </div>

                <div className="flex-1 flex items-center justify-center text-center overflow-y-auto py-2">
                  <p className="text-sm font-medium text-ink-800 leading-relaxed">
                    {flipped ? card.back : card.front}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-ink-400 pt-2 border-t border-paper-100">
                  <span className="group-hover:text-ink-600 transition-colors">Click to flip</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentIndex(i);
                      setMode('study');
                      setIsFlipped(false);
                      setSessionCompleted(false);
                    }}
                    className="hover:underline font-medium"
                    style={{ color: hex }}
                  >
                    Study card →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* STUDY MODE: 1 CARD AT A TIME */}
      {mode === 'study' && !sessionCompleted && currentCard && (
        <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
          {/* Progress Bar & Counter */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-ink-500 font-medium">
              <span>
                Card {currentIndex + 1} of {totalCards}
              </span>
              <div className="flex items-center gap-3">
                {reviewedCount > 0 && (
                  <span className="text-[11px] text-ink-400">
                    {easyCount} Mastered • {mediumCount + hardCount} To Review
                  </span>
                )}
                <span>{Math.round(((currentIndex + 1) / totalCards) * 100)}%</span>
              </div>
            </div>
            <div className="w-full h-2 bg-paper-200 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-300 rounded-full"
                style={{
                  width: `${((currentIndex + 1) / totalCards) * 100}%`,
                  backgroundColor: hex,
                }}
              />
            </div>
          </div>

          {/* 3D Flashcard Container */}
          <div
            className="perspective-1000 w-full min-h-[360px] sm:min-h-[380px] cursor-pointer"
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <div
              className={`relative w-full h-full min-h-[360px] sm:min-h-[380px] transition-transform duration-500 transform-style-3d ${
                isFlipped ? 'rotate-y-180' : ''
              }`}
            >
              {/* FRONT FACE */}
              <div className="absolute inset-0 w-full h-full backface-hidden bg-white rounded-3xl border border-paper-200 shadow-lifted p-7 sm:p-9 flex flex-col justify-between select-none">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-lg"
                      style={{ backgroundColor: bg, color: text }}
                    >
                      Question #{currentCardIndex + 1}
                    </span>
                    {confidence[currentCard.id] && (
                      <span className="text-[11px] font-medium text-ink-400">
                        (Reviewed: {confidence[currentCard.id]})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-ink-400">
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Click to reveal</span>
                  </div>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
                  <h3 className="font-serif text-xl sm:text-2xl font-semibold text-ink-900 leading-relaxed max-w-lg">
                    {currentCard.front}
                  </h3>
                </div>

                <div className="flex items-center justify-between text-xs text-ink-400 border-t border-paper-100 pt-3">
                  <span className="text-[11px]">Space to flip • ← / → to navigate</span>
                  <span className="font-medium" style={{ color: hex }}>
                    Tap card to see answer ↵
                  </span>
                </div>
              </div>

              {/* BACK FACE */}
              <div
                className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-paper-50 rounded-3xl border-2 shadow-lifted p-7 sm:p-9 flex flex-col justify-between select-none"
                style={{ borderColor: hex }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-lg text-white"
                    style={{ backgroundColor: hex }}
                  >
                    Answer
                  </span>
                  <span className="text-xs text-ink-400 font-medium">
                    Rate confidence below
                  </span>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center text-center py-6 overflow-y-auto">
                  <p className="text-base sm:text-lg font-medium text-ink-800 leading-relaxed max-w-lg">
                    {currentCard.back}
                  </p>
                </div>

                {/* Rating Bar */}
                <div
                  className="space-y-2 pt-3 border-t border-paper-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="text-[11px] font-semibold text-ink-400 text-center uppercase tracking-wider">
                    How well did you know this?
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleRate('hard')}
                      className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-all active:scale-95"
                    >
                      <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                      <span>Hard (1)</span>
                    </button>
                    <button
                      onClick={() => handleRate('medium')}
                      className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 transition-all active:scale-95"
                    >
                      <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                      <span>Good (2)</span>
                    </button>
                    <button
                      onClick={() => handleRate('easy')}
                      className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition-all active:scale-95"
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <span>Easy (3)</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Nav Controls */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium text-ink-600 bg-white border border-paper-300 hover:bg-paper-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <button
              onClick={() => setIsFlipped(!isFlipped)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-ink-600 bg-white border border-paper-200 hover:bg-paper-50 transition-colors"
            >
              {isFlipped ? 'Show Question' : 'Show Answer'}
            </button>

            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-95 shadow-soft"
              style={{ backgroundColor: hex }}
            >
              <span>{currentIndex === totalCards - 1 ? 'Finish' : 'Next'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* SESSION SUMMARY CARD */}
      {mode === 'study' && sessionCompleted && (
        <div className="max-w-md mx-auto bg-white rounded-3xl border border-paper-200 shadow-lifted p-8 text-center space-y-6 animate-scale-in">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-card"
            style={{ backgroundColor: bg, color: text }}
          >
            <Trophy className="w-8 h-8" />
          </div>

          <div>
            <h3 className="font-serif text-2xl font-bold text-ink-900">
              Deck Completed! 🎉
            </h3>
            <p className="text-xs text-ink-500 mt-1">
              You reviewed {totalCards} flashcards in this study session.
            </p>
          </div>

          {/* Breakdown Stats */}
          <div className="grid grid-cols-3 gap-2 bg-paper-50 p-4 rounded-2xl border border-paper-200">
            <div className="text-center">
              <p className="text-xl font-bold text-emerald-600">{easyCount}</p>
              <p className="text-[11px] text-ink-400 font-medium">Mastered</p>
            </div>
            <div className="text-center border-x border-paper-200">
              <p className="text-xl font-bold text-amber-600">{mediumCount}</p>
              <p className="text-[11px] text-ink-400 font-medium">Review Soon</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-rose-600">{hardCount}</p>
              <p className="text-[11px] text-ink-400 font-medium">Needs Work</p>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2.5">
            {hardCount + mediumCount > 0 && (
              <button
                onClick={() => resetSession(true)}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white shadow-soft transition-all hover:opacity-95"
                style={{ backgroundColor: hex }}
              >
                <RotateCw className="w-4 h-4" />
                Review {hardCount + mediumCount} Missed Cards
              </button>
            )}
            <button
              onClick={() => resetSession(false)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium text-ink-700 bg-paper-100 hover:bg-paper-200 border border-paper-200 transition-colors"
            >
              Restart Full Deck
            </button>
            <button
              onClick={() => setMode('grid')}
              className="text-xs text-ink-500 hover:underline pt-1"
            >
              Switch to Grid View
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function QuizViewer({
  questions,
  hex,
  bg,
  text,
}: {
  questions: QuizQuestion[];
  hex: string;
  bg: string;
  text: string;
}) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Set<number>>>({});
  const [shortAnswers, setShortAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [instantFeedback, setInstantFeedback] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [revealedExplanations, setRevealedExplanations] = useState<Set<string>>(new Set());
  const [filterView, setFilterView] = useState<'all' | 'incorrect' | 'correct'>('all');

  const totalQuestions = questions.length;
  const currentQ = questions[currentIdx];

  function toggleOption(qid: string, idx: number, multi: boolean) {
    if (submitted) return;
    setAnswers((prev) => {
      const current = prev[qid] || new Set();
      const next = new Set(current);
      if (multi) {
        if (next.has(idx)) next.delete(idx);
        else next.add(idx);
      } else {
        next.clear();
        next.add(idx);
      }
      return { ...prev, [qid]: next };
    });

    if (instantFeedback) {
      setRevealedExplanations((prev) => new Set(prev).add(qid));
    }
  }

  function toggleFlag(qid: string) {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(qid)) next.delete(qid);
      else next.add(qid);
      return next;
    });
  }

  function isQuestionCorrect(q: QuizQuestion): boolean {
    if (q.type === 'short') {
      const ans = (shortAnswers[q.id] || '').trim().toLowerCase();
      return q.correctAnswer.some((c) => c.toLowerCase().trim() === ans);
    }
    const selected = answers[q.id] || new Set();
    const correctIndices = q.correctAnswer
      .map((ans) => q.options.indexOf(ans))
      .filter((i) => i >= 0);
    if (selected.size !== correctIndices.length) return false;
    return correctIndices.every((i) => selected.has(i));
  }

  const answeredCount = Object.keys(answers).length + Object.keys(shortAnswers).filter((k) => shortAnswers[k]?.trim()).length;
  const correctCount = questions.filter((q) => isQuestionCorrect(q)).length;
  const scorePercent = Math.round((correctCount / totalQuestions) * 100) || 0;

  function handleRetake(incorrectOnly = false) {
    if (incorrectOnly) {
      const firstIncorrect = questions.findIndex((q) => !isQuestionCorrect(q));
      if (firstIncorrect >= 0) setCurrentIdx(firstIncorrect);
    } else {
      setAnswers({});
      setShortAnswers({});
      setFlagged(new Set());
      setRevealedExplanations(new Set());
      setCurrentIdx(0);
    }
    setSubmitted(false);
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="text-center py-16 text-ink-400 bg-white rounded-2xl border border-paper-200">
        No quiz questions found.
      </div>
    );
  }

  // --- SUBMITTED / RESULTS DASHBOARD VIEW ---
  if (submitted) {
    const filteredQuestions = questions.filter((q) => {
      if (filterView === 'correct') return isQuestionCorrect(q);
      if (filterView === 'incorrect') return !isQuestionCorrect(q);
      return true;
    });

    return (
      <div className="space-y-6 animate-fade-in">
        {/* Results Header Card */}
        <div className="bg-white rounded-3xl border border-paper-200 shadow-lifted p-6 sm:p-8 text-center space-y-5">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-card"
            style={{ backgroundColor: bg, color: text }}
          >
            <Trophy className="w-8 h-8" />
          </div>

          <div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900">
              Quiz Completed!
            </h2>
            <p className="text-sm text-ink-500 mt-1">
              {scorePercent >= 80
                ? 'Outstanding performance! You mastered this topic.'
                : scorePercent >= 60
                ? 'Solid effort! Review the tricky questions below to lock it in.'
                : 'Good practice run. Go through the explanations and give it another try!'}
            </p>
          </div>

          {/* Score Badge */}
          <div className="flex justify-center items-center gap-4 py-2">
            <div className="flex items-baseline gap-1">
              <span className="font-serif text-5xl font-extrabold" style={{ color: hex }}>
                {correctCount}
              </span>
              <span className="text-xl font-medium text-ink-400">/{totalQuestions}</span>
            </div>
            <div
              className="px-3.5 py-1.5 rounded-xl text-sm font-bold"
              style={{ backgroundColor: bg, color: text }}
            >
              {scorePercent}%
            </div>
          </div>

          {/* Breakdown Pills */}
          <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto bg-paper-50 p-3.5 rounded-2xl border border-paper-200 text-xs">
            <div>
              <p className="font-bold text-emerald-600 text-base">{correctCount}</p>
              <p className="text-ink-400">Correct</p>
            </div>
            <div className="border-x border-paper-200">
              <p className="font-bold text-rose-600 text-base">
                {totalQuestions - correctCount}
              </p>
              <p className="text-ink-400">Incorrect</p>
            </div>
            <div>
              <p className="font-bold text-amber-600 text-base">{flagged.size}</p>
              <p className="text-ink-400">Flagged</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              onClick={() => handleRetake(false)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-soft transition-all hover:opacity-95"
              style={{ backgroundColor: hex }}
            >
              <RotateCw className="w-4 h-4" />
              Retake Quiz
            </button>
            {correctCount < totalQuestions && (
              <button
                onClick={() => handleRetake(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-ink-700 bg-paper-100 hover:bg-paper-200 border border-paper-200 transition-colors"
              >
                Review Tricky Questions
              </button>
            )}
          </div>
        </div>

        {/* Detailed Review Filter & List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-bold text-ink-800">
              Detailed Question Review
            </h3>
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-paper-200 text-xs font-medium">
              <button
                onClick={() => setFilterView('all')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  filterView === 'all' ? 'bg-paper-200 text-ink-800 font-semibold' : 'text-ink-500'
                }`}
              >
                All ({totalQuestions})
              </button>
              <button
                onClick={() => setFilterView('incorrect')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  filterView === 'incorrect' ? 'bg-rose-100 text-rose-800 font-semibold' : 'text-ink-500'
                }`}
              >
                Incorrect ({totalQuestions - correctCount})
              </button>
              <button
                onClick={() => setFilterView('correct')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  filterView === 'correct' ? 'bg-emerald-100 text-emerald-800 font-semibold' : 'text-ink-500'
                }`}
              >
                Correct ({correctCount})
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {filteredQuestions.map((q) => {
              const qIndex = questions.findIndex((item) => item.id === q.id);
              const isCorrect = isQuestionCorrect(q);
              const selected = answers[q.id] || new Set();

              return (
                <div
                  key={q.id}
                  className="bg-white rounded-2xl border border-paper-200 p-5 sm:p-6 shadow-soft space-y-4"
                  style={{ borderLeft: `4px solid ${isCorrect ? '#10b981' : '#f43f5e'}` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span
                        className={`text-xs font-bold w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                          isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {qIndex + 1}
                      </span>
                      <p className="text-sm font-semibold text-ink-800 leading-snug">
                        {q.question}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full shrink-0 ${
                        isCorrect ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {isCorrect ? 'Correct ✓' : 'Incorrect ✗'}
                    </span>
                  </div>

                  {q.type === 'short' ? (
                    <div className="text-xs space-y-1.5 ml-9 p-3 bg-paper-50 rounded-xl border border-paper-200">
                      <p className="text-ink-600">
                        <span className="font-semibold text-ink-800">Your Answer:</span>{' '}
                        {shortAnswers[q.id] || '(No answer provided)'}
                      </p>
                      <p className="text-emerald-700">
                        <span className="font-semibold">Correct Answer:</span>{' '}
                        {q.correctAnswer.join(' / ')}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 ml-9">
                      {q.options.map((opt, oi) => {
                        const isChosen = selected.has(oi);
                        const isAns = q.correctAnswer.includes(opt);
                        return (
                          <div
                            key={oi}
                            className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-medium transition-all ${
                              isAns
                                ? 'border-emerald-400 bg-emerald-50/80 text-emerald-900'
                                : isChosen
                                ? 'border-rose-300 bg-rose-50 text-rose-800'
                                : 'border-paper-200 text-ink-600 bg-paper-50/50'
                            }`}
                          >
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                                isAns
                                  ? 'bg-emerald-600 text-white'
                                  : isChosen
                                  ? 'bg-rose-500 text-white'
                                  : 'bg-paper-200 text-ink-500'
                              }`}
                            >
                              {String.fromCharCode(65 + oi)}
                            </span>
                            <span className="flex-1">{opt}</span>
                            {isAns && (
                              <span className="text-[10px] font-bold text-emerald-700 uppercase">
                                Correct Answer
                              </span>
                            )}
                            {isChosen && !isAns && (
                              <span className="text-[10px] font-bold text-rose-600 uppercase">
                                Your Choice
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {q.explanation && (
                    <div className="ml-9 p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80">
                      <p className="text-xs text-amber-900 leading-relaxed">
                        <span className="font-bold text-amber-950">💡 Explanation: </span>
                        {q.explanation}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // --- 1 QUESTION AT A TIME (ACTIVE QUIZ TAKING) ---
  const selectedOptions = answers[currentQ.id] || new Set();
  const isMulti = currentQ.type === 'multi' || currentQ.type === 'mixed';
  const isAnswered = currentQ.type === 'short' ? !!shortAnswers[currentQ.id]?.trim() : selectedOptions.size > 0;
  const showFeedback = instantFeedback && revealedExplanations.has(currentQ.id);

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Top Header & Progress */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-lg"
              style={{ backgroundColor: bg, color: text }}
            >
              Question {currentIdx + 1} of {totalQuestions}
            </span>
            <span className="text-xs text-ink-400 font-medium">
              {currentQ.type === 'multi'
                ? 'Select all that apply'
                : currentQ.type === 'short'
                ? 'Short Answer'
                : 'Multiple Choice'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setInstantFeedback(!instantFeedback)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                instantFeedback
                  ? 'border-accent-300 bg-accent-50 text-accent-700'
                  : 'border-paper-200 text-ink-500 hover:bg-paper-50'
              }`}
              title="Toggle practice feedback"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>{instantFeedback ? 'Practice: On' : 'Exam Mode'}</span>
            </button>
            <button
              onClick={() => toggleFlag(currentQ.id)}
              className={`p-1.5 rounded-lg border transition-colors ${
                flagged.has(currentQ.id)
                  ? 'border-amber-400 bg-amber-50 text-amber-700'
                  : 'border-paper-200 text-ink-400 hover:bg-paper-50'
              }`}
              title="Flag question for review"
            >
              <Bookmark className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Animated Progress Bar */}
        <div className="w-full h-2 bg-paper-200 rounded-full overflow-hidden">
          <div
            className="h-full transition-all duration-300 rounded-full"
            style={{
              width: `${((currentIdx + 1) / totalQuestions) * 100}%`,
              backgroundColor: hex,
            }}
          />
        </div>
      </div>

      {/* Main Question Card */}
      <div className="bg-white rounded-3xl border border-paper-200 shadow-lifted p-6 sm:p-8 space-y-6">
        <h3 className="font-serif text-lg sm:text-xl font-bold text-ink-900 leading-snug">
          {currentQ.question}
        </h3>

        {/* Options / Short Answer */}
        {currentQ.type === 'short' ? (
          <div className="space-y-3">
            <textarea
              value={shortAnswers[currentQ.id] || ''}
              onChange={(e) =>
                setShortAnswers((prev) => ({
                  ...prev,
                  [currentQ.id]: e.target.value,
                }))
              }
              placeholder="Type your response here..."
              rows={4}
              className="w-full bg-paper-50 border border-paper-300 rounded-2xl p-4 text-sm text-ink-800 placeholder:text-ink-400 focus:outline-none focus:border-accent-400 focus:bg-white transition-all resize-none shadow-inner"
            />
            {instantFeedback && (
              <button
                onClick={() =>
                  setRevealedExplanations((prev) => new Set(prev).add(currentQ.id))
                }
                className="text-xs font-semibold text-accent-700 hover:underline"
              >
                Check Answer / Reveal Explanation →
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {currentQ.options.map((opt, oi) => {
              const isSelected = selectedOptions.has(oi);
              const isAns = currentQ.correctAnswer.includes(opt);
              const isWrong = showFeedback && isSelected && !isAns;
              const isRight = showFeedback && isAns;

              return (
                <button
                  key={oi}
                  onClick={() => toggleOption(currentQ.id, oi, isMulti)}
                  className={`w-full flex items-center gap-3.5 p-4 rounded-2xl border text-sm text-left transition-all group ${
                    isRight
                      ? 'border-emerald-400 bg-emerald-50 text-emerald-950 font-semibold shadow-soft'
                      : isWrong
                      ? 'border-rose-400 bg-rose-50 text-rose-950 font-medium'
                      : isSelected
                      ? 'border-ink-800 bg-paper-100 text-ink-900 font-medium shadow-soft'
                      : 'border-paper-200 bg-white text-ink-700 hover:border-paper-300 hover:bg-paper-50'
                  }`}
                >
                  <span
                    className={`w-7 h-7 rounded-xl border flex items-center justify-center shrink-0 text-xs font-bold transition-colors ${
                      isRight
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : isWrong
                        ? 'bg-rose-500 text-white border-rose-500'
                        : isSelected
                        ? 'bg-ink-800 text-white border-ink-800'
                        : 'bg-paper-100 border-paper-300 text-ink-500 group-hover:bg-white'
                    }`}
                  >
                    {isRight ? (
                      <Check className="w-4 h-4" />
                    ) : isWrong ? (
                      <X className="w-4 h-4" />
                    ) : (
                      String.fromCharCode(65 + oi)
                    )}
                  </span>
                  <span className="flex-1 leading-relaxed">{opt}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Practice Mode Explanation Box */}
        {showFeedback && currentQ.explanation && (
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 animate-scale-in">
            <p className="text-xs text-amber-950 leading-relaxed">
              <span className="font-bold">💡 Key Takeaway: </span>
              {currentQ.explanation}
            </p>
          </div>
        )}
      </div>

      {/* Navigation & Question Map Dots */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
            disabled={currentIdx === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-medium text-ink-600 bg-white border border-paper-300 hover:bg-paper-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          {currentIdx === totalQuestions - 1 ? (
            <button
              onClick={() => setSubmitted(true)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-soft transition-all hover:opacity-95"
              style={{ backgroundColor: hex }}
            >
              <Check className="w-4 h-4" />
              <span>Submit & View Score ({answeredCount}/{totalQuestions})</span>
            </button>
          ) : (
            <button
              onClick={() => setCurrentIdx((i) => Math.min(totalQuestions - 1, i + 1))}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold text-white shadow-soft transition-all hover:opacity-95"
              style={{ backgroundColor: hex }}
            >
              <span>Next Question</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Question Map Pills */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
          {questions.map((q, i) => {
            const hasAnswer = q.type === 'short' ? !!shortAnswers[q.id]?.trim() : (answers[q.id]?.size || 0) > 0;
            const isCurrent = i === currentIdx;
            const isFlag = flagged.has(q.id);

            return (
              <button
                key={q.id}
                onClick={() => setCurrentIdx(i)}
                className={`relative w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                  isCurrent
                    ? 'ring-2 ring-offset-2 ring-ink-800 text-white'
                    : hasAnswer
                    ? 'bg-paper-200 text-ink-800 hover:bg-paper-300'
                    : 'bg-white border border-paper-200 text-ink-400 hover:border-paper-300'
                }`}
                style={isCurrent ? { backgroundColor: hex } : undefined}
                title={`Question ${i + 1}${isFlag ? ' (Flagged)' : ''}`}
              >
                {i + 1}
                {isFlag && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-white" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PresentationViewer({
  slides,
  hex,
  bg,
  text,
}: {
  slides: PresentationSlide[];
  hex: string;
  bg: string;
  text: string;
}) {
  const [current, setCurrent] = useState(0);
  const slide = slides[current];

  return (
    <div>
      <div
        className="rounded-2xl border border-paper-200 bg-white overflow-hidden shadow-card"
        style={{ borderTop: `3px solid ${hex}` }}
      >
        <div className="p-8 lg:p-12 min-h-[400px]">
          <div className="flex items-center gap-2 mb-6">
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-md"
              style={{ backgroundColor: bg, color: text }}
            >
              Slide {current + 1} of {slides.length}
            </span>
          </div>
          <h2 className="font-serif text-2xl font-semibold text-ink-800 mb-6">
            {slide.title}
          </h2>
          <ul className="space-y-3">
            {slide.points.map((p, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-ink-600">
                <span
                  className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                  style={{ backgroundColor: hex }}
                />
                {p}
              </li>
            ))}
          </ul>
          {slide.notes && (
            <div className="mt-8 p-4 rounded-lg bg-paper-50 border border-paper-200">
              <p className="text-xs text-ink-400 font-medium mb-1">Speaker notes</p>
              <p className="text-sm text-ink-500">{slide.notes}</p>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between mt-4">
        <button
          onClick={() => setCurrent(Math.max(0, current - 1))}
          disabled={current === 0}
          className="px-4 py-2 rounded-lg text-sm font-medium text-ink-600 bg-white border border-paper-300 hover:bg-paper-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>
        <div className="flex gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === current ? 'w-6' : ''
              }`}
              style={{
                backgroundColor: i === current ? hex : '#d0d0cc',
              }}
            />
          ))}
        </div>
        <button
          onClick={() => setCurrent(Math.min(slides.length - 1, current + 1))}
          disabled={current === slides.length - 1}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ backgroundColor: hex }}
        >
          Next
        </button>
      </div>
    </div>
  );
}
