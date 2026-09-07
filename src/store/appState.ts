import { useSyncExternalStore } from 'react';
import { db, uid } from '@/db/database';
import type { Semester, Subject, SubjectColor } from '@/types';

type View =
  | { kind: 'home' }
  | { kind: 'semester'; semesterId: string }
  | { kind: 'subject'; subjectId: string };

interface AppState {
  view: View;
  sidebarOpen: boolean;
  aiPanelOpen: boolean;
  aiPanelFullscreen: boolean;
}

let state: AppState = {
  view: { kind: 'home' },
  sidebarOpen: true,
  aiPanelOpen: false,
  aiPanelFullscreen: false,
};

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

export function useAppState() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function setView(view: View) {
  state = { ...state, view };
  emit();
}

export function toggleSidebar() {
  state = { ...state, sidebarOpen: !state.sidebarOpen };
  emit();
}

export function setSidebarOpen(open: boolean) {
  state = { ...state, sidebarOpen: open };
  emit();
}

export function toggleAIPanel() {
  state = { ...state, aiPanelOpen: !state.aiPanelOpen };
  emit();
}

export function setAIPanelOpen(open: boolean) {
  state = { ...state, aiPanelOpen: open };
  emit();
}

export function toggleAIPanelFullscreen() {
  state = { ...state, aiPanelFullscreen: !state.aiPanelFullscreen };
  emit();
}

export function setAIPanelFullscreen(open: boolean) {
  state = { ...state, aiPanelFullscreen: open };
  emit();
}

// --- Seed data ---

const SUBJECT_NAMES = [
  'Organic Chemistry',
  'Linear Algebra',
  'Modern History',
  'Cell Biology',
  'Microeconomics',
];
const COLORS: SubjectColor[] = ['teal', 'blue', 'amber', 'emerald', 'violet'];

export async function seedData() {
  const existing = await db.semesters.count();
  if (existing > 0) return;

  const now = Date.now();

  const s1: Semester = { id: uid(), name: 'Fall 2026', createdAt: now };
  const s2: Semester = { id: uid(), name: 'Spring 2026', createdAt: now + 1 };

  await db.semesters.bulkAdd([s1, s2]);

  const subjects: Subject[] = [];
  SUBJECT_NAMES.forEach((name, i) => {
    subjects.push({
      id: uid(),
      semesterId: s1.id,
      name,
      color: COLORS[i],
      createdAt: now + i,
    });
  });
  subjects.push({
    id: uid(),
    semesterId: s2.id,
    name: 'Intro to Psychology',
    color: 'rose',
    createdAt: now + 10,
  });
  subjects.push({
    id: uid(),
    semesterId: s2.id,
    name: 'Data Structures',
    color: 'crimson',
    createdAt: now + 11,
  });

  await db.subjects.bulkAdd(subjects);

  // sample deadlines
  await db.deadlines.bulkAdd([
    {
      id: uid(),
      folderId: s1.id,
      subjectId: subjects[0].id,
      title: 'Midterm Exam',
      description: 'Covers chapters 1-5',
      dueDate: now + 1000 * 60 * 60 * 24 * 7,
      completed: false,
      createdAt: now,
    },
    {
      id: uid(),
      folderId: s1.id,
      subjectId: subjects[1].id,
      title: 'Problem Set 3',
      dueDate: now + 1000 * 60 * 60 * 24 * 3,
      completed: false,
      createdAt: now,
    },
    {
      id: uid(),
      folderId: s1.id,
      subjectId: null,
      title: 'Register for spring classes',
      dueDate: now + 1000 * 60 * 60 * 24 * 14,
      completed: false,
      createdAt: now,
    },
  ]);
}
