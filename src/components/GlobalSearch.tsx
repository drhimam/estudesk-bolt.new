import { useState, useRef, useEffect } from 'react';
import { Search, X, FileText, StickyNote, Image, Layers, HelpCircle, PenLine, Presentation, Bookmark, Clock } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { setView } from '@/store/appState';
import { COLOR_HEX, COLOR_LIGHT, COLOR_TEXT } from '@/utils/colors';
import type { StudyMaterial, MaterialType, SubjectColor, Subject } from '@/types';

const TYPE_ICONS: Record<MaterialType, React.ReactNode> = {
  notes: <FileText className="w-3.5 h-3.5" />,
  cheatsheet: <StickyNote className="w-3.5 h-3.5" />,
  infographic: <Image className="w-3.5 h-3.5" />,
  flashcards: <Layers className="w-3.5 h-3.5" />,
  quiz: <HelpCircle className="w-3.5 h-3.5" />,
  assignment: <PenLine className="w-3.5 h-3.5" />,
  presentation: <Presentation className="w-3.5 h-3.5" />,
  other: <Bookmark className="w-3.5 h-3.5" />,
};

interface SearchHit {
  material: StudyMaterial;
  subject: Subject | undefined;
}

interface Props {
  onClose: () => void;
}

export function GlobalSearch({ onClose }: Props) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const allMaterials = useLiveQuery(() => db.materials.toArray(), []);
  const allSubjects = useLiveQuery(() => db.subjects.toArray(), []);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const q = query.trim().toLowerCase();
  const hits: SearchHit[] = (allMaterials ?? [])
    .filter((m) => (q ? m.title.toLowerCase().includes(q) : true))
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 30)
    .map((material) => ({
      material,
      subject: (allSubjects ?? []).find((s) => s.id === material.subjectId),
    }));

  function openHit(hit: SearchHit) {
    if (hit.subject) {
      setView({ kind: 'subject', subjectId: hit.subject.id });
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center pt-[10vh] px-4 animate-fade-in">
      <div className="absolute inset-0 bg-ink-800/30" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-lifted border border-paper-200 overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-paper-200">
          <Search className="w-4 h-4 text-ink-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search study materials..."
            className="flex-1 text-sm text-ink-700 placeholder:text-ink-300 focus:outline-none bg-transparent"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-paper-100 text-ink-400 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto scrollbar-thin">
          {hits.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-ink-400">
                {q ? `No materials found for "${query}"` : 'Start typing to search'}
              </p>
            </div>
          ) : (
            <div className="py-2">
              {hits.map((hit) => {
                const color = (hit.subject?.color || 'slate') as SubjectColor;
                const bg = COLOR_LIGHT[color];
                const text = COLOR_TEXT[color];
                const hex = COLOR_HEX[color];
                return (
                  <button
                    key={hit.material.id}
                    onClick={() => openHit(hit)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-paper-50 transition-colors text-left group"
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: bg, color: text }}
                    >
                      {TYPE_ICONS[hit.material.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-ink-700 truncate group-hover:text-ink-800">
                        {hit.material.title}
                      </h4>
                      <p className="text-xs text-ink-400 truncate">
                        {hit.subject?.name || 'Unknown subject'}
                      </p>
                    </div>
                    <div
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: hex }}
                    />
                    <div className="flex items-center gap-1 text-xs text-ink-300 shrink-0">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(hit.material.updatedAt)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - ts;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
