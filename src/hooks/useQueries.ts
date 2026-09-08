import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import type { Semester, Subject, StudyMaterial, Deadline, ChatMessage, ChatConversation } from '@/types';

export function useSemesters(): Semester[] {
  const data = useLiveQuery(() => db.semesters.toArray(), []);
  if (!data) return [];
  return [...data].sort((a, b) => {
    if (!!b.pinned !== !!a.pinned) return b.pinned ? 1 : -1;
    return a.createdAt - b.createdAt;
  });
}

export function useSubjects(semesterId?: string): Subject[] {
  const data = useLiveQuery(
    () =>
      semesterId
        ? db.subjects.where('semesterId').equals(semesterId).toArray()
        : db.subjects.toArray(),
    [semesterId],
  );
  if (!data) return [];
  return [...data].sort((a, b) => {
    if (!!b.pinned !== !!a.pinned) return b.pinned ? 1 : -1;
    return a.createdAt - b.createdAt;
  });
}

export function useAllSubjects(): Subject[] {
  const data = useLiveQuery(() => db.subjects.toArray(), []);
  if (!data) return [];
  return [...data].sort((a, b) => {
    if (!!b.pinned !== !!a.pinned) return b.pinned ? 1 : -1;
    return a.createdAt - b.createdAt;
  });
}

export function useSubject(subjectId: string | null): Subject | undefined {
  const data = useLiveQuery(
    () => (subjectId ? db.subjects.get(subjectId) : undefined),
    [subjectId],
  );
  return data;
}

export function useMaterials(subjectId: string | null): StudyMaterial[] {
  const data = useLiveQuery(
    () =>
      subjectId
        ? db.materials.where('subjectId').equals(subjectId).toArray()
        : [],
    [subjectId],
  );
  return data ?? [];
}

export function useDeadlines(folderId?: string): Deadline[] {
  const data = useLiveQuery(
    () =>
      folderId
        ? db.deadlines.where('folderId').equals(folderId).toArray()
        : db.deadlines.toArray(),
    [folderId],
  );
  return data ?? [];
}

export function useMessages(subjectId: string | null): ChatMessage[] {
  const data = useLiveQuery(
    () =>
      subjectId
        ? db.messages.where('subjectId').equals(subjectId).toArray()
        : [],
    [subjectId],
  );
  if (!data) return [];
  return [...data].sort((a, b) => a.createdAt - b.createdAt);
}

export function useGlobalMessages(): ChatMessage[] {
  const data = useLiveQuery(() => db.messages.toArray(), []);
  if (!data) return [];
  return data
    .filter((m) => m.subjectId === null)
    .sort((a, b) => a.createdAt - b.createdAt);
}

export function useConversations(): ChatConversation[] {
  const data = useLiveQuery(() => db.conversations.toArray(), []);
  if (!data) return [];
  return [...data].sort((a, b) => b.updatedAt - a.updatedAt);
}

export function useConversationMessages(conversationId: string | null): ChatMessage[] {
  const data = useLiveQuery(
    () =>
      conversationId
        ? db.messages.where('conversationId').equals(conversationId).toArray()
        : [],
    [conversationId],
  );
  if (!data) return [];
  return [...data].sort((a, b) => a.createdAt - b.createdAt);
}

