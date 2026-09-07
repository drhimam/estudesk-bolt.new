import { useState } from 'react';
import {
  FileText,
  Image,
  Layers,
  HelpCircle,
  PenLine,
  Presentation,
  Bookmark,
  Plus,
  Trash2,
  Clock,
  ChevronRight,
  StickyNote,
  Search,
  MoreVertical,
  Pencil,
  Download,
  X,
} from 'lucide-react';
import { db } from '@/db/database';
import { useMaterials } from '@/hooks/useQueries';
import { COLOR_HEX, COLOR_LIGHT, COLOR_TEXT } from '@/utils/colors';
import { GenerationStudio } from '@/components/GenerationStudio';
import { MaterialViewer } from '@/components/MaterialViewer';
import type { MaterialType, StudyMaterial, SubjectColor } from '@/types';

type SubTab = MaterialType;

interface Props {
  subjectId: string;
  subjectColor: SubjectColor;
}

const SUB_TABS: { key: SubTab; label: string; icon: React.ReactNode }[] = [
  { key: 'notes', label: 'Study notes', icon: <FileText className="w-3.5 h-3.5" /> },
  { key: 'cheatsheet', label: 'Cheat sheets', icon: <StickyNote className="w-3.5 h-3.5" /> },
  { key: 'infographic', label: 'Infographics', icon: <Image className="w-3.5 h-3.5" /> },
  { key: 'flashcards', label: 'Flashcards', icon: <Layers className="w-3.5 h-3.5" /> },
  { key: 'quiz', label: 'Quizzes', icon: <HelpCircle className="w-3.5 h-3.5" /> },
  { key: 'assignment', label: 'Assignments', icon: <PenLine className="w-3.5 h-3.5" /> },
  { key: 'presentation', label: 'Presentations', icon: <Presentation className="w-3.5 h-3.5" /> },
  { key: 'other', label: 'Others', icon: <Bookmark className="w-3.5 h-3.5" /> },
];

export function StudyMaterialTab({ subjectId, subjectColor }: Props) {
  const [subTab, setSubTab] = useState<SubTab>('notes');
  const [showStudio, setShowStudio] = useState(false);
  const [viewing, setViewing] = useState<StudyMaterial | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const materials = useMaterials(subjectId);

  const filtered = materials
    .filter((m) => m.type === subTab)
    .filter((m) =>
      searchQuery.trim()
        ? m.title.toLowerCase().includes(searchQuery.toLowerCase())
        : true,
    )
    .sort((a, b) => b.updatedAt - a.updatedAt);

  const hex = COLOR_HEX[subjectColor];
  const bg = COLOR_LIGHT[subjectColor];
  const text = COLOR_TEXT[subjectColor];

  if (viewing) {
    return (
      <MaterialViewer
        material={viewing}
        subjectColor={subjectColor}
        onBack={() => setViewing(null)}
      />
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Sub-tabs */}
      <div className="flex items-center gap-1 px-4 lg:px-6 py-2.5 border-b border-paper-200 bg-paper-50 overflow-x-auto scrollbar-thin shrink-0">
        {SUB_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setSubTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              subTab === t.key
                ? 'text-white shadow-soft'
                : 'text-ink-500 hover:bg-paper-200'
            }`}
            style={subTab === t.key ? { backgroundColor: hex } : undefined}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
        <div className="max-w-4xl mx-auto px-4 lg:px-6 py-6">
          <div className="flex items-center justify-between mb-5 gap-3">
            <h2 className="font-serif text-lg font-semibold text-ink-700 shrink-0">
              {SUB_TABS.find((t) => t.key === subTab)?.label}
            </h2>
            <div className="flex items-center gap-2 flex-1 justify-end">
              {/* Search bar */}
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-300" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-8 pr-7 py-2 rounded-lg text-xs text-ink-700 bg-paper-50 border border-paper-300 placeholder:text-ink-300 focus:outline-none focus:border-accent-400 focus:bg-white transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-300 hover:text-ink-500"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <button
                onClick={() => setShowStudio(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium text-white transition-all hover:shadow-glow shrink-0"
                style={{ backgroundColor: hex, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
              >
                <Plus className="w-3.5 h-3.5" />
                Generate
              </button>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <div
                className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-soft"
                style={{ backgroundColor: bg, color: text }}
              >
                {SUB_TABS.find((t) => t.key === subTab)?.icon &&
                  (() => {
                    const Icon = SUB_TABS.find((t) => t.key === subTab);
                    return <span className="scale-150">{Icon?.icon}</span>;
                  })()}
              </div>
              <p className="text-sm text-ink-400 mb-1">
                {searchQuery
                  ? `No results for "${searchQuery}"`
                  : `No ${SUB_TABS.find((t) => t.key === subTab)?.label.toLowerCase()} yet`}
              </p>
              <p className="text-xs text-ink-300">
                {searchQuery ? 'Try a different search term' : 'Click Generate to create one with AI'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filtered.map((m) => (
                <MaterialCard
                  key={m.id}
                  material={m}
                  color={subjectColor}
                  onClick={() => setViewing(m)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {showStudio && (
        <GenerationStudio
          subjectId={subjectId}
          subjectColor={subjectColor}
          type={subTab}
          onClose={() => setShowStudio(false)}
        />
      )}
    </div>
  );
}

function MaterialCard({
  material,
  color,
  onClick,
}: {
  material: StudyMaterial;
  color: SubjectColor;
  onClick: () => void;
}) {
  const bg = COLOR_LIGHT[color];
  const text = COLOR_TEXT[color];
  const hex = COLOR_HEX[color];
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [titleInput, setTitleInput] = useState(material.title);

  async function remove(e: React.MouseEvent) {
    e.stopPropagation();
    await db.materials.delete(material.id);
    setMenuOpen(false);
  }

  async function doRename() {
    const trimmed = titleInput.trim();
    if (!trimmed || trimmed === material.title) {
      setRenaming(false);
      return;
    }
    await db.materials.update(material.id, { title: trimmed, updatedAt: Date.now() });
    material.title = trimmed;
    setRenaming(false);
    setMenuOpen(false);
  }

  function download(e: React.MouseEvent) {
    e.stopPropagation();
    setMenuOpen(false);

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
  }

  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-2xl border border-paper-200 p-4 card-hover hover:shadow-card hover:border-paper-400 cursor-pointer relative overflow-visible"
    >
      <div
        className="absolute top-0 left-0 w-full h-0.5"
        style={{ backgroundColor: hex, opacity: 0.6 }}
      />
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-soft"
          style={{ backgroundColor: bg, color: text }}
        >
          {SUB_TABS.find((t) => t.key === material.type)?.icon}
        </div>
        <div className="flex-1 min-w-0">
          {renaming ? (
            <input
              autoFocus
              value={titleInput}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => setTitleInput(e.target.value)}
              onBlur={doRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') doRename();
                if (e.key === 'Escape') { setRenaming(false); setTitleInput(material.title); }
              }}
              className="w-full font-medium text-sm text-ink-700 bg-paper-50 border border-paper-300 rounded-md px-2 py-1 focus:outline-none focus:border-accent-400"
            />
          ) : (
            <h3 className="font-medium text-sm text-ink-700 truncate">
              {material.title}
            </h3>
          )}
          <div className="flex items-center gap-1.5 mt-1 text-xs text-ink-400">
            <Clock className="w-3 h-3" />
            <span>{formatDate(material.updatedAt)}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <ChevronRight className="w-4 h-4 text-ink-300 group-hover:text-ink-500 group-hover:translate-x-0.5 transition-all" />
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 rounded-lg hover:bg-paper-100 text-ink-300 hover:text-ink-500 transition-all"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div
                  className="absolute right-0 z-20 w-36 bg-white rounded-xl border border-paper-200 shadow-card py-1 animate-fade-in"
                  style={{ top: 'calc(100% + 4px)', bottom: 'auto' }}
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); setRenaming(true); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-ink-600 hover:bg-paper-50 transition-colors text-left"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Rename
                  </button>
                  <button
                    onClick={download}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-ink-600 hover:bg-paper-50 transition-colors text-left"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </button>
                  <button
                    onClick={remove}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-crimson-600 hover:bg-red-50 transition-colors text-left"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
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
