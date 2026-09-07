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

  constructor() {
    super('estudesk');
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

export const db = new EstudeskDB();

export function uid(): string {
  return crypto.randomUUID();
  }
