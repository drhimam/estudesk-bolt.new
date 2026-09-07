import { useState, useRef, useEffect } from 'react';
import { Download, FileText, FileType, ChevronDown } from 'lucide-react';
import { downloadDeadlinesAsText, downloadDeadlinesAsPDF, type ExportGrouping } from '@/utils/download';
import type { Deadline, Subject } from '@/types';

interface Props {
  studentName: string;
  semesterName: string;
  scopeLabel: string;
  deadlines: Deadline[];
  subjects: Subject[];
  grouping: ExportGrouping;
}

export function DownloadMenu({
  studentName,
  semesterName,
  scopeLabel,
  deadlines,
  subjects,
  grouping,
}: Props) {
  const [open, setOpen] = useState(false);
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

  const opts = { studentName, semesterName, scopeLabel, deadlines, subjects, grouping };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={deadlines.length === 0}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-ink-500 hover:bg-paper-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Download</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full bg-white rounded-xl border border-paper-300 shadow-lifted py-1 min-w-[170px] z-50 animate-scale-in">
          <button
            onClick={() => {
              downloadDeadlinesAsText(opts);
              setOpen(false);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-ink-600 hover:bg-paper-100 transition-colors text-left"
          >
            <FileText className="w-3.5 h-3.5 text-ink-400" />
            Plain text (.txt)
          </button>
          <button
            onClick={() => {
              downloadDeadlinesAsPDF(opts);
              setOpen(false);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-ink-600 hover:bg-paper-100 transition-colors text-left"
          >
            <FileType className="w-3.5 h-3.5 text-ink-400" />
            PDF document (.pdf)
          </button>
        </div>
      )}
    </div>
  );
}
