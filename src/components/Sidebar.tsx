import { useState, useRef, useEffect } from 'react';
import {
  GraduationCap,
  ChevronRight,
  ChevronDown,
  Plus,
  BookOpen,
  PanelLeftClose,
  MoreVertical,
  Pin,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';
import { db, uid } from '@/db/database';
import { useSemesters, useSubjects } from '@/hooks/useQueries';
import { setView, toggleSidebar, useAppState } from '@/store/appState';
import { COLOR_HEX } from '@/utils/colors';
import type { SubjectColor, Semester, Subject } from '@/types';

export function Sidebar() {
  const { sidebarOpen } = useAppState();
  const semesters = useSemesters();

  if (!sidebarOpen) return null;

  return (
    <aside className="w-72 shrink-0 border-r border-paper-300 bg-paper-100 flex flex-col h-full animate-slide-in-left">
      <SidebarHeader />
      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-3">
        {semesters.map((s) => (
          <SemesterFolder key={s.id} semester={s} />
        ))}
        <AddSemesterButton />
      </nav>
      <SidebarFooter />
    </aside>
  );
}

function SidebarHeader() {
  return (
    <div className="flex items-center justify-between px-4 py-4 border-b border-paper-300">
      <button
        onClick={() => setView({ kind: 'home' })}
        className="flex items-center gap-2.5 group"
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center shadow-card group-hover:shadow-glow transition-shadow">
          <GraduationCap className="w-5 h-5 text-white" strokeWidth={2.2} />
        </div>
        <div className="text-left">
          <h1 className="font-serif text-lg font-semibold text-ink-800 leading-none">
            eStudesk
          </h1>
          <p className="text-[11px] text-ink-400 mt-1">Study prep</p>
        </div>
      </button>
      <button
        onClick={toggleSidebar}
        className="p-1.5 rounded-lg hover:bg-paper-200 text-ink-400 transition-colors"
        aria-label="Collapse sidebar"
        title="Collapse sidebar"
      >
        <PanelLeftClose className="w-4 h-4" />
      </button>
    </div>
  );
}

function SemesterFolder({ semester }: { semester: Semester }) {
  const [expanded, setExpanded] = useState(true);
  const subjects = useSubjects(semester.id);
  const { view } = useAppState();

  const isActive =
    (view.kind === 'semester' && view.semesterId === semester.id) ||
    (view.kind === 'subject' && subjects.some((s) => s.id === view.subjectId));

  return (
    <div className="mb-1.5">
      <div className="relative group">
        <button
          onClick={() => {
            setExpanded(!expanded);
            setView({ kind: 'semester', semesterId: semester.id });
          }}
          className={`w-full flex items-center gap-1.5 px-2.5 py-2 pr-8 rounded-lg text-sm font-bold uppercase tracking-wide transition-all ${
            isActive && view.kind === 'semester'
              ? 'bg-white text-ink-800 shadow-soft'
              : 'text-ink-700 hover:bg-paper-200/70'
          }`}
        >
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-ink-400 shrink-0 transition-transform" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-ink-400 shrink-0 transition-transform" />
          )}
          <span className="truncate flex-1 text-left">{semester.name}</span>
          {semester.pinned && (
            <Pin className="w-3 h-3 text-accent-500 shrink-0 fill-accent-500" />
          )}
          {subjects.length > 0 && (
            <span className="text-[10px] font-semibold text-ink-300 bg-paper-200 px-1.5 py-0.5 rounded-md shrink-0">
              {subjects.length}
            </span>
          )}
        </button>
        <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity z-40">
          <SemesterMenu semester={semester} />
        </div>
      </div>
      {expanded && (
        <div className="ml-3 pl-3 border-l border-paper-300 mt-1 space-y-0.5">
          {subjects.map((subject) => (
            <SubjectLink key={subject.id} subject={subject} />
          ))}
          <AddSubjectButton semesterId={semester.id} />
        </div>
      )}
    </div>
  );
}

function SemesterMenu({ semester }: { semester: Semester }) {
  const [open, setOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(semester.name);
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

  async function togglePin() {
    await db.semesters.update(semester.id, { pinned: !semester.pinned });
    setOpen(false);
  }

  async function rename() {
    if (!name.trim()) return;
    await db.semesters.update(semester.id, { name: name.trim().toUpperCase() });
    setRenaming(false);
    setOpen(false);
  }

  async function del() {
    const subjectIds = await db.subjects
      .where('semesterId')
      .equals(semester.id)
      .primaryKeys();
    await db.materials
      .where('subjectId')
      .anyOf(subjectIds)
      .delete();
    await db.messages
      .where('subjectId')
      .anyOf(subjectIds)
      .delete();
    await db.subjects.bulkDelete(subjectIds);
    await db.deadlines
      .where('folderId')
      .equals(semester.id)
      .delete();
    await db.semesters.delete(semester.id);
    setView({ kind: 'home' });
    setOpen(false);
  }

  if (renaming) {
    return (
      <div className="flex items-center gap-1 bg-white rounded-lg border border-paper-400 shadow-card px-1.5 py-1 z-20">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === 'Enter') rename();
            if (e.key === 'Escape') {
              setRenaming(false);
              setName(semester.name);
            }
          }}
          className="w-24 text-xs font-bold uppercase bg-paper-50 border border-paper-300 rounded px-1.5 py-1 text-ink-700 focus:outline-none focus:border-accent-400"
        />
        <button onClick={rename} className="text-accent-500 hover:text-accent-600 p-0.5">
          <Pencil className="w-3 h-3" />
        </button>
        <button
          onClick={() => {
            setRenaming(false);
            setName(semester.name);
          }}
          className="text-ink-400 hover:text-ink-600 p-0.5"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className="p-1 rounded-md hover:bg-paper-200 text-ink-400 hover:text-ink-600 transition-colors"
      >
        <MoreVertical className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div className="absolute right-0 top-full bg-white rounded-xl border border-paper-300 shadow-lifted py-1 min-w-[150px] z-50 animate-scale-in">
          <button
            onClick={(e) => {
              e.stopPropagation();
              togglePin();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-ink-600 hover:bg-paper-100 transition-colors text-left"
          >
            <Pin className="w-3.5 h-3.5" />
            {semester.pinned ? 'Unpin from top' : 'Pin to top'}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setRenaming(true);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-ink-600 hover:bg-paper-100 transition-colors text-left"
          >
            <Pencil className="w-3.5 h-3.5" />
            Rename
          </button>
          <div className="border-t border-paper-200 my-1" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              del();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-crimson-500 hover:bg-red-50 transition-colors text-left"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

function SubjectLink({ subject }: { subject: Subject }) {
  const { view } = useAppState();
  const isActive = view.kind === 'subject' && view.subjectId === subject.id;
  const hex = COLOR_HEX[subject.color];

  return (
    <div className="relative group">
      <button
        onClick={() => setView({ kind: 'subject', subjectId: subject.id })}
        className={`w-full flex items-center gap-2.5 px-2.5 py-2 pr-7 rounded-lg text-sm transition-all ${
          isActive
            ? 'bg-white text-ink-800 font-medium shadow-soft'
            : 'text-ink-500 hover:bg-paper-200/50 hover:text-ink-700'
        }`}
      >
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0 transition-transform group-hover:scale-110"
          style={{ backgroundColor: hex, boxShadow: isActive ? `0 0 0 3px ${hex}22` : undefined }}
        />
        <span className="truncate flex-1 text-left">{subject.name}</span>
        {subject.pinned && (
          <Pin className="w-3 h-3 text-accent-500 shrink-0 fill-accent-500" />
        )}
      </button>
      <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity z-40">
        <SubjectMenu subject={subject} />
      </div>
    </div>
  );
}

function SubjectMenu({ subject }: { subject: Subject }) {
  const [open, setOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(subject.name);
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

  async function togglePin() {
    await db.subjects.update(subject.id, { pinned: !subject.pinned });
    setOpen(false);
  }

  async function rename() {
    if (!name.trim()) return;
    await db.subjects.update(subject.id, { name: name.trim() });
    setRenaming(false);
    setOpen(false);
  }

  async function del() {
    await db.materials.where('subjectId').equals(subject.id).delete();
    await db.messages.where('subjectId').equals(subject.id).delete();
    await db.deadlines.where('subjectId').equals(subject.id).delete();
    await db.subjects.delete(subject.id);
    setView({ kind: 'semester', semesterId: subject.semesterId });
    setOpen(false);
  }

  if (renaming) {
    return (
      <div className="flex items-center gap-1 bg-white rounded-lg border border-paper-400 shadow-card px-1.5 py-1 z-20">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') rename();
            if (e.key === 'Escape') {
              setRenaming(false);
              setName(subject.name);
            }
          }}
          className="w-24 text-xs bg-paper-50 border border-paper-300 rounded px-1.5 py-1 text-ink-700 focus:outline-none focus:border-accent-400"
        />
        <button onClick={rename} className="text-accent-500 hover:text-accent-600 p-0.5">
          <Pencil className="w-3 h-3" />
        </button>
        <button
          onClick={() => {
            setRenaming(false);
            setName(subject.name);
          }}
          className="text-ink-400 hover:text-ink-600 p-0.5"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className="p-1 rounded-md hover:bg-paper-200 text-ink-400 hover:text-ink-600 transition-colors"
      >
        <MoreVertical className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div className="absolute right-0 top-full bg-white rounded-xl border border-paper-300 shadow-lifted py-1 min-w-[150px] z-50 animate-scale-in">
          <button
            onClick={(e) => {
              e.stopPropagation();
              togglePin();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-ink-600 hover:bg-paper-100 transition-colors text-left"
          >
            <Pin className="w-3.5 h-3.5" />
            {subject.pinned ? 'Unpin from top' : 'Pin to top'}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setRenaming(true);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-ink-600 hover:bg-paper-100 transition-colors text-left"
          >
            <Pencil className="w-3.5 h-3.5" />
            Rename
          </button>
          <div className="border-t border-paper-200 my-1" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              del();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-crimson-500 hover:bg-red-50 transition-colors text-left"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

function AddSubjectButton({ semesterId }: { semesterId: string }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const subjects = useSubjects(semesterId);
  const usedColors = new Set(subjects.map((s) => s.color));
  const nextColor = (['teal', 'blue', 'amber', 'emerald', 'violet', 'rose', 'crimson', 'slate', 'plum', 'ochre'] as SubjectColor[]).find(
    (c) => !usedColors.has(c),
  ) ?? 'teal';

  async function save() {
    if (!name.trim()) return;
    await db.subjects.add({
      id: uid(),
      semesterId,
      name: name.trim(),
      color: nextColor,
      createdAt: Date.now(),
    });
    setName('');
    setAdding(false);
  }

  if (!adding) {
    return (
      <button
        onClick={() => setAdding(true)}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm text-ink-400 hover:text-ink-600 hover:bg-paper-200/50 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Add subject</span>
      </button>
    );
  }

  return (
    <div className="px-2 py-1.5">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') save();
          if (e.key === 'Escape') setAdding(false);
        }}
        onBlur={() => (name.trim() ? save() : setAdding(false))}
        placeholder="Subject name"
        className="w-full text-sm bg-white border border-paper-400 rounded-lg px-2.5 py-1.5 text-ink-700 placeholder:text-ink-300 focus:outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-100 transition-all"
      />
    </div>
  );
}

function AddSemesterButton() {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');

  async function save() {
    if (!name.trim()) return;
    await db.semesters.add({
      id: uid(),
      name: name.trim().toUpperCase(),
      createdAt: Date.now(),
    });
    setName('');
    setAdding(false);
  }

  if (!adding) {
    return (
      <button
        onClick={() => setAdding(true)}
        className="w-full flex items-center gap-2 px-2.5 py-2.5 mt-2 rounded-lg text-sm text-ink-400 hover:text-ink-600 hover:bg-paper-200/60 transition-colors"
      >
        <Plus className="w-4 h-4" />
        <span>New semester</span>
      </button>
    );
  }

  return (
    <div className="px-2 py-1.5 mt-2">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value.toUpperCase())}
        onKeyDown={(e) => {
          if (e.key === 'Enter') save();
          if (e.key === 'Escape') setAdding(false);
        }}
        onBlur={() => (name.trim() ? save() : setAdding(false))}
        placeholder="SEMESTER NAME"
        className="w-full text-sm font-bold uppercase bg-white border border-paper-400 rounded-lg px-2.5 py-1.5 text-ink-700 placeholder:text-ink-300 placeholder:font-normal focus:outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-100 transition-all"
      />
    </div>
  );
}

function SidebarFooter() {
  return (
    <div className="px-4 py-3 border-t border-paper-300 flex items-center gap-2 text-xs text-ink-400">
      <BookOpen className="w-3.5 h-3.5" />
      <span>Chat stored locally on your device</span>
    </div>
  );
}
