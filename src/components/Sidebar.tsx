import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  User,
  LogIn,
  LogOut,
  Sparkles,
  Shield,
  FolderTree,
} from 'lucide-react';
import { db, uid } from '@/db/database';
import { useSemesters, useSubjects } from '@/hooks/useQueries';
import { setView, toggleSidebar, useAppState, openAuthModal, logoutUser } from '@/store/appState';
import { signOut } from '@/lib/authClient';
import { COLOR_HEX } from '@/utils/colors';
import {
  syncCreateFolder,
  syncUpdateFolder,
  syncDeleteFolder,
  syncCreateSubject,
  syncUpdateSubject,
  syncDeleteSubject,
} from '@/lib/apiSync';
import type { SubjectColor, Semester, Subject } from '@/types';

export function Sidebar() {
  const { sidebarOpen } = useAppState();
  const semesters = useSemesters();

  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('estudesk_sidebar_width');
      const parsed = saved ? parseInt(saved, 10) : 288;
      return isNaN(parsed) ? 288 : Math.min(Math.max(parsed, 220), 520);
    } catch {
      return 288;
    }
  });
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    if (!isResizing) return;

    function handleMouseMove(e: MouseEvent) {
      const newWidth = e.clientX;
      const maxWidth = Math.min(window.innerWidth * 0.45, 520);
      const clamped = Math.min(Math.max(newWidth, 220), maxWidth);
      setSidebarWidth(clamped);
      try {
        localStorage.setItem('estudesk_sidebar_width', clamped.toString());
      } catch {}
    }

    function handleMouseUp() {
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  if (!sidebarOpen) return null;

  return (
    <aside
      className="relative shrink-0 border-r border-[#bed6c7] bg-[#e6f0ea] flex flex-col h-full z-20 transition-all duration-75 select-none"
      style={{
        width: typeof window !== 'undefined' && window.innerWidth >= 1024 ? `${sidebarWidth}px` : undefined,
      }}
    >
      {/* Desktop resize handle on the right border */}
      <div
        onMouseDown={(e) => {
          e.preventDefault();
          setIsResizing(true);
        }}
        onDoubleClick={() => {
          setSidebarWidth(288);
          try {
            localStorage.setItem('estudesk_sidebar_width', '288');
          } catch {}
        }}
        className="hidden lg:flex absolute -right-1.5 top-0 bottom-0 w-3 cursor-col-resize items-center justify-center z-30 group hover:bg-emerald-600/20 active:bg-emerald-600/30 transition-colors select-none"
        title="Drag to resize sidebar (Double-click to reset width)"
      >
        <div className="w-1 h-10 rounded-full bg-emerald-600/40 group-hover:bg-emerald-600 group-hover:h-14 group-active:bg-emerald-700 transition-all shadow-sm" />
      </div>

      <SidebarHeader />
      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-3 select-text">
        {semesters.length === 0 && (
          <div className="p-3 mb-2 rounded-xl bg-white/70 border border-dashed border-[#b4cec0] text-center">
            <FolderTree className="w-6 h-6 text-accent-600 mx-auto mb-1.5 opacity-80" />
            <p className="text-xs font-semibold text-ink-700">No Folders Yet</p>
            <p className="text-[11px] text-ink-400 mt-0.5 leading-relaxed">
              Create your first semester or rotation below.
            </p>
          </div>
        )}
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
    <div className="flex items-center justify-between px-4 py-4 border-b border-[#bed6c7] bg-[#d6e7dc]">
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
          <p className="text-[11px] text-ink-500 mt-1">Study prep</p>
        </div>
      </button>
      <button
        onClick={toggleSidebar}
        className="p-1.5 rounded-lg hover:bg-[#c8ded0] text-ink-500 hover:text-ink-800 transition-colors"
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
              ? 'bg-white text-ink-900 shadow-soft'
              : 'text-ink-700 hover:bg-[#d6e7dc]'
          }`}
        >
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-ink-400 shrink-0" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-ink-400 shrink-0" />
          )}
          <BookOpen className="w-3.5 h-3.5 text-ink-400 shrink-0" />
          <span className="truncate text-left flex-1">{semester.name}</span>
          {semester.pinned && (
            <Pin className="w-3 h-3 text-accent-500 shrink-0 fill-accent-500" />
          )}
        </button>
        <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity z-40">
          <SemesterMenu semester={semester} />
        </div>
      </div>

      {expanded && (
        <div className="ml-3 pl-2.5 border-l border-[#b4cec0] mt-0.5 space-y-0.5">
          {subjects.map((sub) => (
            <SubjectLink key={sub.id} subject={sub} />
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [name, setName] = useState(semester.name);
  const [counts, setCounts] = useState({ materials: 0, deadlines: 0, messages: 0 });
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
    syncUpdateFolder(semester.id, { isPinned: !semester.pinned });
    setOpen(false);
  }

  async function rename() {
    if (!name.trim()) return;
    const cleanName = name.trim().toUpperCase();
    await db.semesters.update(semester.id, { name: cleanName });
    syncUpdateFolder(semester.id, { name: cleanName });
    setRenaming(false);
    setOpen(false);
  }

  async function openDeleteModal() {
    setOpen(false);
    const subjectIds = await db.subjects
      .where('semesterId')
      .equals(semester.id)
      .primaryKeys();
    const materialsCount = subjectIds.length > 0
      ? await db.materials.where('subjectId').anyOf(subjectIds).count()
      : 0;
    const messagesCount = subjectIds.length > 0
      ? await db.messages.where('subjectId').anyOf(subjectIds).count()
      : 0;
    const deadlinesCount = await db.deadlines
      .where('folderId')
      .equals(semester.id)
      .count();
    setCounts({ materials: materialsCount, deadlines: deadlinesCount, messages: messagesCount });
    setShowDeleteModal(true);
  }

  async function confirmDelete() {
    try {
      const subjectIds = await db.subjects
        .where('semesterId')
        .equals(semester.id)
        .primaryKeys();
      if (subjectIds.length > 0) {
        await db.materials.where('subjectId').anyOf(subjectIds).delete();
        await db.messages.where('subjectId').anyOf(subjectIds).delete();
        await db.subjects.bulkDelete(subjectIds);
      }
      await db.deadlines.where('folderId').equals(semester.id).delete();
      await db.semesters.delete(semester.id);
      syncDeleteFolder(semester.id);
    } catch (err) {
      console.error('Error deleting semester:', err);
    } finally {
      setShowDeleteModal(false);
      setView({ kind: 'home' });
    }
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
    <>
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
                openDeleteModal();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-crimson-500 hover:bg-red-50 transition-colors text-left"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
        )}
      </div>

      {showDeleteModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-paper-300 shadow-lifted max-w-md w-full p-6 animate-scale-in">
            <h3 className="font-serif text-lg font-bold text-ink-800 mb-2">
              Delete Semester "{semester.name}"?
            </h3>
            <p className="text-sm text-ink-500 mb-4 leading-relaxed">
              This will delete <strong className="text-ink-700">{counts.materials} study materials</strong>,{' '}
              <strong className="text-ink-700">{counts.deadlines} deadlines</strong>, and{' '}
              <strong className="text-ink-700">{counts.messages} chat messages</strong>. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-paper-200 mt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2.5 text-sm font-semibold text-ink-700 bg-paper-200 hover:bg-paper-300 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-xl shadow-card transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-white" />
                <span>Delete Semester</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
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
            ? 'bg-white text-ink-900 font-semibold shadow-soft'
            : 'text-ink-700 hover:bg-[#d6e7dc] hover:text-ink-900'
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [name, setName] = useState(subject.name);
  const [counts, setCounts] = useState({ materials: 0, deadlines: 0, messages: 0 });
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
    syncUpdateSubject(subject.id, { isPinned: !subject.pinned });
    setOpen(false);
  }

  async function rename() {
    if (!name.trim()) return;
    const cleanName = name.trim();
    await db.subjects.update(subject.id, { name: cleanName });
    syncUpdateSubject(subject.id, { name: cleanName });
    setRenaming(false);
    setOpen(false);
  }

  async function openDeleteModal() {
    setOpen(false);
    const materialsCount = await db.materials.where('subjectId').equals(subject.id).count();
    const messagesCount = await db.messages.where('subjectId').equals(subject.id).count();
    const deadlinesCount = await db.deadlines.where('subjectId').equals(subject.id).count();
    setCounts({ materials: materialsCount, deadlines: deadlinesCount, messages: messagesCount });
    setShowDeleteModal(true);
  }

  async function confirmDelete() {
    try {
      await db.materials.where('subjectId').equals(subject.id).delete();
      await db.messages.where('subjectId').equals(subject.id).delete();
      await db.deadlines.where('subjectId').equals(subject.id).delete();
      await db.subjects.delete(subject.id);
      syncDeleteSubject(subject.id);
    } catch (err) {
      console.error('Error deleting subject:', err);
    } finally {
      setShowDeleteModal(false);
      setView({ kind: 'semester', semesterId: subject.semesterId });
    }
  }

  if (renaming) {
    return (
      <div className="flex items-center gap-1 bg-white rounded-lg border border-[#bed6c7] shadow-card px-1.5 py-1 z-20">
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
          className="w-24 text-xs bg-white border border-[#bed6c7] rounded px-1.5 py-1 text-ink-700 focus:outline-none focus:border-accent-400"
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
    <>
      <div ref={ref} className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setOpen(!open);
          }}
          className="p-1 rounded-md hover:bg-[#c8ded0] text-ink-400 hover:text-ink-700 transition-colors"
        >
          <MoreVertical className="w-3.5 h-3.5" />
        </button>
        {open && (
          <div className="absolute right-0 top-full bg-white rounded-xl border border-[#bed6c7] shadow-lifted py-1 min-w-[150px] z-50 animate-scale-in">
            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePin();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-ink-600 hover:bg-[#e6f0ea] transition-colors text-left"
            >
              <Pin className="w-3.5 h-3.5" />
              {subject.pinned ? 'Unpin from top' : 'Pin to top'}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setRenaming(true);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-ink-600 hover:bg-[#e6f0ea] transition-colors text-left"
            >
              <Pencil className="w-3.5 h-3.5" />
              Rename
            </button>
            <div className="border-t border-paper-200 my-1" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                openDeleteModal();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-crimson-500 hover:bg-red-50 transition-colors text-left"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
        )}
      </div>

      {showDeleteModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-paper-300 shadow-lifted max-w-md w-full p-6 animate-scale-in">
            <h3 className="font-serif text-lg font-bold text-ink-800 mb-2">
              Delete Subject "{subject.name}"?
            </h3>
            <p className="text-sm text-ink-500 mb-4 leading-relaxed">
              This will delete <strong className="text-ink-700">{counts.materials} study materials</strong>,{' '}
              <strong className="text-ink-700">{counts.deadlines} deadlines</strong>, and{' '}
              <strong className="text-ink-700">{counts.messages} chat messages</strong>. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-paper-200 mt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2.5 text-sm font-semibold text-ink-700 bg-paper-200 hover:bg-paper-300 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-xl shadow-card transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-white" />
                <span>Delete Subject</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
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
    const cleanName = name.trim();
    const id = uid();
    await db.subjects.add({
      id,
      semesterId,
      name: cleanName,
      color: nextColor,
      createdAt: Date.now(),
    });
    syncCreateSubject({ id, folderId: semesterId, name: cleanName, color: nextColor });
    setName('');
    setAdding(false);
  }

  if (!adding) {
    return (
      <button
        onClick={() => setAdding(true)}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm text-ink-600 hover:text-ink-900 hover:bg-[#d6e7dc] transition-colors"
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
        className="w-full text-sm bg-white border border-[#b4cec0] rounded-lg px-2.5 py-1.5 text-ink-700 placeholder:text-ink-400 focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-100 transition-all"
      />
    </div>
  );
}

function AddSemesterButton() {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');

  async function save() {
    if (!name.trim()) return;
    const cleanName = name.trim().toUpperCase();
    const id = uid();
    await db.semesters.add({
      id,
      name: cleanName,
      createdAt: Date.now(),
    });
    syncCreateFolder({ id, name: cleanName });
    setName('');
    setAdding(false);
  }

  if (!adding) {
    return (
      <button
        onClick={() => setAdding(true)}
        className="w-full flex items-center gap-2 px-2.5 py-2.5 mt-2 rounded-lg text-sm text-ink-600 hover:text-ink-900 hover:bg-[#d6e7dc] transition-colors"
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
        className="w-full text-sm font-bold uppercase bg-white border border-[#b4cec0] rounded-lg px-2.5 py-1.5 text-ink-700 placeholder:text-ink-400 placeholder:font-normal focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-100 transition-all"
      />
    </div>
  );
}

function SidebarFooter() {
  const { currentUser } = useAppState();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  async function handleSignOut() {
    try {
      await signOut();
    } catch {}
    logoutUser();
    setShowMenu(false);
  }

  return (
    <div className="p-3 border-t border-[#bed6c7] bg-[#d6e7dc]">
      {/* User profile section */}
      {currentUser ? (
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-full flex items-center gap-2.5 p-2 rounded-xl bg-white border border-[#bed6c7] shadow-soft hover:shadow-card hover:border-accent-400 transition-all text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
              {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'S'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-ink-800 truncate block">
                  {currentUser.name || 'Scholar'}
                </span>
                <span className="text-[9px] uppercase font-mono px-1 py-0.2 rounded bg-accent-100 text-accent-700 font-bold">
                  {currentUser.tier || 'Scholar'}
                </span>
              </div>
              <span className="text-[10px] text-ink-400 truncate block">{currentUser.email}</span>
            </div>
          </button>

          {/* User Popover Menu */}
          {showMenu && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-2xl border border-paper-300 shadow-lifted p-2 z-50 animate-scale-in">
              <div className="px-3 py-2 border-b border-paper-200">
                <p className="text-xs font-bold text-ink-800">{currentUser.name}</p>
                <p className="text-[10px] text-ink-400 truncate">{currentUser.email}</p>
                <div className="mt-1.5 flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                  <Shield className="w-3 h-3" />
                  <span>Turso Cloud Active</span>
                </div>
              </div>

              <div className="pt-1">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-crimson-600 hover:bg-crimson-50 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-1.5">
          <button
            onClick={() => openAuthModal('signin')}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-accent-600 hover:bg-accent-700 text-white text-xs font-semibold shadow-soft hover:shadow-card transition-all"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In / Register</span>
          </button>
        </div>
      )}
    </div>
  );
}
