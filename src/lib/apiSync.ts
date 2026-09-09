import { db } from '@/db/database';
import type { Semester, Subject, SubjectColor } from '@/types';

// Utility to synchronize client IndexedDB operations with Turso DB
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? 'https://estudesk-api.rifa-numis.workers.dev'
    : (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'));

export async function syncFromTursoToLocal() {
  try {
    const [foldersRes, subjectsRes] = await Promise.all([
      fetch(`${API_BASE_URL}/api/folders`),
      fetch(`${API_BASE_URL}/api/subjects`),
    ]);

    if (foldersRes.ok && subjectsRes.ok) {
      const foldersJson = (await foldersRes.json()) as { data: Array<{ id: string; name: string; isPinned?: boolean; createdAt?: string }> };
      const subjectsJson = (await subjectsRes.json()) as { data: Array<{ id: string; folderId: string; name: string; color?: string; isPinned?: boolean; createdAt?: string }> };

      const serverFolders = foldersJson.data || [];
      const serverSubjects = subjectsJson.data || [];

      // Reconcile Folders
      for (const f of serverFolders) {
        const existing = await db.semesters.get(f.id);
        const folderData: Semester = {
          id: f.id,
          name: f.name,
          pinned: !!f.isPinned,
          createdAt: f.createdAt ? new Date(f.createdAt).getTime() : Date.now(),
        };
        if (existing) {
          await db.semesters.update(f.id, folderData);
        } else {
          await db.semesters.put(folderData);
        }
      }

      // Reconcile Subjects
      for (const s of serverSubjects) {
        const existing = await db.subjects.get(s.id);
        const subjectData: Subject = {
          id: s.id,
          semesterId: s.folderId,
          name: s.name,
          color: (s.color as SubjectColor) || 'teal',
          pinned: !!s.isPinned,
          createdAt: s.createdAt ? new Date(s.createdAt).getTime() : Date.now(),
        };
        if (existing) {
          await db.subjects.update(s.id, subjectData);
        } else {
          await db.subjects.put(subjectData);
        }
      }
    }
  } catch (err) {
    console.warn('[Sync] Failed to sync from Turso to local:', err);
  }
}

export async function syncCreateFolder(folder: { id: string; name: string; color?: string; userId?: string }) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/folders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(folder),
    });
    if (!res.ok) {
      console.warn('[Sync] Failed to sync folder creation:', await res.text());
    }
  } catch (err) {
    console.warn('[Sync] Failed to sync folder creation to Turso:', err);
  }
}

export async function syncUpdateFolder(id: string, updates: { name?: string; color?: string; isPinned?: boolean }) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/folders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      console.warn('[Sync] Failed to sync folder update:', await res.text());
    }
  } catch (err) {
    console.warn('[Sync] Failed to sync folder update to Turso:', err);
  }
}

export async function syncDeleteFolder(id: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/folders/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      console.warn('[Sync] Failed to sync folder deletion:', await res.text());
    }
  } catch (err) {
    console.warn('[Sync] Failed to sync folder deletion to Turso:', err);
  }
}

export async function syncCreateSubject(subject: { id: string; folderId: string; name: string; color?: string; userId?: string }) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/subjects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subject),
    });
    if (!res.ok) {
      console.warn('[Sync] Failed to sync subject creation:', await res.text());
    }
  } catch (err) {
    console.warn('[Sync] Failed to sync subject creation to Turso:', err);
  }
}

export async function syncUpdateSubject(id: string, updates: { name?: string; color?: string; isPinned?: boolean }) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/subjects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      console.warn('[Sync] Failed to sync subject update:', await res.text());
    }
  } catch (err) {
    console.warn('[Sync] Failed to sync subject update to Turso:', err);
  }
}

export async function syncDeleteSubject(id: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/subjects/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      console.warn('[Sync] Failed to sync subject deletion:', await res.text());
    }
  } catch (err) {
    console.warn('[Sync] Failed to sync subject deletion to Turso:', err);
  }
}
