import Dexie, { type Table } from 'dexie';
import type {
  Semester,
  Subject,
  StudyMaterial,
  ChatMessage,
  ChatConversation,
  Deadline,
  Draft,
} from '@/types';

export class EstudeskDB extends Dexie {
  semesters!: Table<Semester, string>;
  subjects!: Table<Subject, string>;
  materials!: Table<StudyMaterial, string>;
  messages!: Table<ChatMessage, string>;
  conversations!: Table<ChatConversation, string>;
  deadlines!: Table<Deadline, string>;
  drafts!: Table<Draft, string>;

  constructor(dbName = 'estudesk_guest') {
    super(dbName);
    this.version(1).stores({
      semesters: 'id, name, createdAt, pinned',
      subjects: 'id, semesterId, name, createdAt, pinned',
      materials: 'id, subjectId, type, createdAt, updatedAt',
      messages: 'id, subjectId, createdAt',
      deadlines: 'id, folderId, subjectId, dueDate, completed',
      drafts: 'id, subjectId, type, updatedAt',
    });
    this.version(2).stores({
      conversations: 'id, updatedAt, createdAt',
      messages: 'id, subjectId, conversationId, createdAt',
    });
  }
}

export function getDatabaseName(userId?: string | null): string {
  if (!userId) {
    try {
      const saved = localStorage.getItem('estudesk_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.id) {
          const sanitized = String(parsed.id).replace(/[^a-zA-Z0-9_-]/g, '_');
          return `estudesk_${sanitized}`;
        }
      }
    } catch {}
    return 'estudesk_guest';
  }
  const sanitized = String(userId).replace(/[^a-zA-Z0-9_-]/g, '_');
  return `estudesk_${sanitized}`;
}

let currentDbInstance: EstudeskDB = new EstudeskDB(getDatabaseName());

export function switchUserDatabase(userId?: string | null): EstudeskDB {
  const targetName = getDatabaseName(userId);
  if (currentDbInstance && currentDbInstance.name === targetName) {
    return currentDbInstance;
  }
  try {
    currentDbInstance.close();
  } catch (err) {
    console.warn('Failed to close previous Dexie instance:', err);
  }
  currentDbInstance = new EstudeskDB(targetName);
  return currentDbInstance;
}

export function getCurrentDb(): EstudeskDB {
  return currentDbInstance;
}

export const db: EstudeskDB = new Proxy({} as EstudeskDB, {
  get(_target, prop) {
    const active = currentDbInstance;
    const value = Reflect.get(active, prop, active);
    if (typeof value === 'function') {
      return value.bind(active);
    }
    return value;
  },
  set(_target, prop, value) {
    return Reflect.set(currentDbInstance, prop, value, currentDbInstance);
  },
  has(_target, prop) {
    return Reflect.has(currentDbInstance, prop);
  },
});

export function uid(): string {
  return crypto.randomUUID();
}

