import { useState, useRef, useEffect } from 'react';
import { Share2, Copy, FileCode, Mail, Check, ChevronDown, Smartphone } from 'lucide-react';
import {
  generateDeadlinesText,
  generateDeadlinesMarkdown,
  type ExportGrouping,
  type ExportOptions,
} from '@/utils/download';
import type { Deadline, Subject } from '@/types';

interface Props {
  studentName?: string;
  semesterName: string;
  scopeLabel: string;
  deadlines: Deadline[];
  subjects: Subject[];
  grouping: ExportGrouping;
}

export function ShareMenu({
  studentName = '',
  semesterName,
  scopeLabel,
  deadlines,
  subjects,
  grouping,
}: Props) {
  const [open, setOpen] = useState(false);
  const [copiedState, setCopiedState] = useState<'text' | 'markdown' | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  useEffect(() => {
    if (!copiedState) return;
    const timer = setTimeout(() => {
      setCopiedState(null);
    }, 2500);
    return () => clearTimeout(timer);
  }, [copiedState]);

  const opts: ExportOptions = {
    studentName,
    semesterName,
    scopeLabel,
    deadlines,
    subjects,
    grouping,
  };

  const hasNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  async function handleNativeShare() {
    try {
      const summaryText = generateDeadlinesText(opts);
      const title = `Academic Deadlines - ${semesterName || scopeLabel}`;
      if (navigator.share) {
        await navigator.share({
          title,
          text: summaryText,
        });
      }
      setOpen(false);
    } catch (err: unknown) {
      // User cancelled or share failed, fallback to copy
      if (err instanceof Error && err.name !== 'AbortError') {
        handleCopyText();
      }
    }
  }

  async function handleCopyText() {
    try {
      const text = generateDeadlinesText(opts);
      await navigator.clipboard.writeText(text);
      setCopiedState('text');
      setOpen(false);
    } catch {
      // Fallback
    }
  }

  async function handleCopyMarkdown() {
    try {
      const md = generateDeadlinesMarkdown(opts);
      await navigator.clipboard.writeText(md);
      setCopiedState('markdown');
      setOpen(false);
    } catch {
      // Fallback
    }
  }

  function handleEmailShare() {
    const subject = encodeURIComponent(`📅 Academic Deadlines — ${semesterName || scopeLabel}`);
    const text = generateDeadlinesText(opts);
    const body = encodeURIComponent(text);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={deadlines.length === 0}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-ink-500 hover:bg-paper-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors relative"
        title="Share deadline agenda"
      >
        {copiedState ? (
          <Check className="w-3.5 h-3.5 text-accent-600 animate-scale-in" />
        ) : (
          <Share2 className="w-3.5 h-3.5" />
        )}
        <span className="hidden sm:inline">{copiedState ? 'Copied!' : 'Share'}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Floating feedback tooltip when copied */}
      {copiedState && (
        <div className="absolute right-0 bottom-full mb-1.5 z-50 bg-ink-900 text-white text-[11px] font-medium px-2.5 py-1 rounded-lg shadow-lifted whitespace-nowrap animate-fade-in flex items-center gap-1.5">
          <Check className="w-3 h-3 text-accent-400" />
          <span>
            {copiedState === 'markdown'
              ? 'Copied Markdown schedule!'
              : 'Copied deadline summary!'}
          </span>
        </div>
      )}

      {open && (
        <div className="absolute right-0 top-full bg-white rounded-xl border border-paper-300 shadow-lifted py-1.5 min-w-[210px] z-50 animate-scale-in">
          <div className="px-3 py-1 mb-1 border-b border-paper-200">
            <span className="text-[10px] font-bold text-ink-400 uppercase tracking-wider">
              Share {grouping === 'subject' ? 'Subject-wise' : 'Date-wise'}
            </span>
          </div>

          {hasNativeShare && (
            <button
              onClick={handleNativeShare}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-ink-700 hover:bg-paper-100 transition-colors text-left font-medium"
            >
              <Smartphone className="w-3.5 h-3.5 text-accent-600" />
              Share via device sheet...
            </button>
          )}

          <button
            onClick={handleCopyText}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-ink-600 hover:bg-paper-100 transition-colors text-left"
          >
            <Copy className="w-3.5 h-3.5 text-ink-400" />
            Copy summary text
          </button>

          <button
            onClick={handleCopyMarkdown}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-ink-600 hover:bg-paper-100 transition-colors text-left"
          >
            <FileCode className="w-3.5 h-3.5 text-ink-400" />
            Copy as Markdown (Notion/Slack)
          </button>

          <button
            onClick={handleEmailShare}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-ink-600 hover:bg-paper-100 transition-colors text-left"
          >
            <Mail className="w-3.5 h-3.5 text-ink-400" />
            Email deadline agenda
          </button>
        </div>
      )}
    </div>
  );
}
