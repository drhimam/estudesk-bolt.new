import { db } from '@/db/database';
import type { Semester, Subject, SubjectColor, StudyMaterial, Deadline, MaterialType } from '@/types';

// Utility to synchronize client IndexedDB operations with Turso DB
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? 'https://estudesk-api.rifa-numis.workers.dev'
    : (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'));

function getAuthenticatedUser(): { id: string; email: string } | null {
  try {
    const saved = localStorage.getItem('estudesk_user');
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    if (parsed && parsed.id) return parsed;
    return null;
  } catch {
    return null;
  }
}

export async function syncFromTursoToLocal() {
  const user = getAuthenticatedUser();
  if (!user) return;

  try {
    const [foldersRes, subjectsRes, materialsRes, deadlinesRes] = await Promise.all([
      fetch(`${API_BASE_URL}/api/folders?userId=${encodeURIComponent(user.id)}`),
      fetch(`${API_BASE_URL}/api/subjects?userId=${encodeURIComponent(user.id)}`),
      fetch(`${API_BASE_URL}/api/materials?userId=${encodeURIComponent(user.id)}`),
      fetch(`${API_BASE_URL}/api/deadlines?userId=${encodeURIComponent(user.id)}`),
    ]);

    if (foldersRes.ok) {
      const foldersJson = (await foldersRes.json()) as { data: Array<{ id: string; name: string; isPinned?: boolean; createdAt?: string }> };
      const serverFolders = foldersJson.data || [];
      for (const f of serverFolders) {
        const folderData: Semester = {
          id: f.id,
          name: f.name,
          pinned: !!f.isPinned,
          createdAt: f.createdAt ? new Date(f.createdAt).getTime() : Date.now(),
        };
        await db.semesters.put(folderData);
      }
    }

    if (subjectsRes.ok) {
      const subjectsJson = (await subjectsRes.json()) as { data: Array<{ id: string; folderId: string; name: string; color?: string; isPinned?: boolean; createdAt?: string }> };
      const serverSubjects = subjectsJson.data || [];
      for (const s of serverSubjects) {
        const subjectData: Subject = {
          id: s.id,
          semesterId: s.folderId,
          name: s.name,
          color: (s.color as SubjectColor) || 'teal',
          pinned: !!s.isPinned,
          createdAt: s.createdAt ? new Date(s.createdAt).getTime() : Date.now(),
        };
        await db.subjects.put(subjectData);
      }
    }

    if (materialsRes.ok) {
      const materialsJson = (await materialsRes.json()) as {
        data: Array<{
          id: string;
          subjectId: string;
          title: string;
          type: string;
          content: Record<string, unknown> | string;
          createdAt?: string;
          updatedAt?: string;
        }>;
      };
      const serverMaterials = materialsJson.data || [];
      for (const m of serverMaterials) {
        let contentObj: Record<string, any> = {};
        if (typeof m.content === 'string') {
          try {
            contentObj = JSON.parse(m.content);
          } catch {
            contentObj = { contentMarkdown: m.content };
          }
        } else if (typeof m.content === 'object' && m.content !== null) {
          contentObj = m.content;
        }

        const materialData: StudyMaterial = {
          id: m.id,
          subjectId: m.subjectId,
          title: m.title,
          type: (m.type as MaterialType) || 'notes',
          createdAt: m.createdAt ? new Date(m.createdAt).getTime() : Date.now(),
          updatedAt: m.updatedAt ? new Date(m.updatedAt).getTime() : Date.now(),
          contentMarkdown: contentObj.contentMarkdown,
          contentHtml: contentObj.contentHtml,
          flashcards: contentObj.flashcards,
          quiz: contentObj.quiz,
          slides: contentObj.slides,
          sourceSnippet: contentObj.sourceSnippet,
        };

        await db.materials.put(materialData);
      }
    }

    if (deadlinesRes.ok) {
      const deadlinesJson = (await deadlinesRes.json()) as {
        data: Array<{
          id: string;
          folderId: string;
          subjectId?: string | null;
          title: string;
          description?: string | null;
          dueDate: string | number;
          isCompleted?: boolean;
          createdAt?: string;
        }>;
      };
      const serverDeadlines = deadlinesJson.data || [];
      for (const d of serverDeadlines) {
        const deadlineData: Deadline = {
          id: d.id,
          folderId: d.folderId,
          subjectId: d.subjectId || null,
          title: d.title,
          description: d.description || undefined,
          dueDate: typeof d.dueDate === 'number' ? d.dueDate : new Date(d.dueDate).getTime(),
          completed: !!d.isCompleted,
          createdAt: d.createdAt ? new Date(d.createdAt).getTime() : Date.now(),
        };

        await db.deadlines.put(deadlineData);
      }
    }
  } catch (err) {
    console.warn('[Sync] Failed to sync from Turso to local:', err);
  }
}

// Folders
export async function syncCreateFolder(folder: { id: string; name: string; color?: string; userId?: string }) {
  const user = getAuthenticatedUser();
  if (!user) return;

  try {
    const res = await fetch(`${API_BASE_URL}/api/folders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...folder, userId: user.id }),
    });
    if (!res.ok) {
      console.warn('[Sync] Failed to sync folder creation:', await res.text());
    }
  } catch (err) {
    console.warn('[Sync] Failed to sync folder creation to Turso:', err);
  }
}

export async function syncUpdateFolder(id: string, updates: { name?: string; color?: string; isPinned?: boolean }) {
  const user = getAuthenticatedUser();
  if (!user) return;

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
  const user = getAuthenticatedUser();
  if (!user) return;

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

// Subjects
export async function syncCreateSubject(subject: { id: string; folderId: string; name: string; color?: string; userId?: string }) {
  const user = getAuthenticatedUser();
  if (!user) return;

  try {
    const res = await fetch(`${API_BASE_URL}/api/subjects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...subject, userId: user.id }),
    });
    if (!res.ok) {
      console.warn('[Sync] Failed to sync subject creation:', await res.text());
    }
  } catch (err) {
    console.warn('[Sync] Failed to sync subject creation to Turso:', err);
  }
}

export async function syncUpdateSubject(id: string, updates: { name?: string; color?: string; isPinned?: boolean }) {
  const user = getAuthenticatedUser();
  if (!user) return;

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
  const user = getAuthenticatedUser();
  if (!user) return;

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

// Materials
export async function syncCreateMaterial(material: StudyMaterial) {
  const user = getAuthenticatedUser();
  if (!user) return;

  try {
    const content = {
      contentMarkdown: material.contentMarkdown,
      contentHtml: material.contentHtml,
      flashcards: material.flashcards,
      quiz: material.quiz,
      slides: material.slides,
      sourceSnippet: material.sourceSnippet,
    };

    const res = await fetch(`${API_BASE_URL}/api/materials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: material.id,
        subjectId: material.subjectId,
        userId: user.id,
        title: material.title,
        type: material.type,
        content,
        version: 1,
      }),
    });
    if (!res.ok) {
      console.warn('[Sync] Failed to sync material creation:', await res.text());
    }
  } catch (err) {
    console.warn('[Sync] Failed to sync material creation to Turso:', err);
  }
}

export async function syncUpdateMaterial(id: string, updates: Partial<StudyMaterial>) {
  const user = getAuthenticatedUser();
  if (!user) return;

  try {
    const payload: Record<string, unknown> = {};
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.type !== undefined) payload.type = updates.type;
    
    if (
      updates.contentMarkdown !== undefined ||
      updates.contentHtml !== undefined ||
      updates.flashcards !== undefined ||
      updates.quiz !== undefined ||
      updates.slides !== undefined ||
      updates.sourceSnippet !== undefined
    ) {
      payload.content = {
        contentMarkdown: updates.contentMarkdown,
        contentHtml: updates.contentHtml,
        flashcards: updates.flashcards,
        quiz: updates.quiz,
        slides: updates.slides,
        sourceSnippet: updates.sourceSnippet,
      };
    }

    const res = await fetch(`${API_BASE_URL}/api/materials/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.warn('[Sync] Failed to sync material update:', await res.text());
    }
  } catch (err) {
    console.warn('[Sync] Failed to sync material update to Turso:', err);
  }
}

export async function syncDeleteMaterial(id: string) {
  const user = getAuthenticatedUser();
  if (!user) return;

  try {
    const res = await fetch(`${API_BASE_URL}/api/materials/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      console.warn('[Sync] Failed to sync material deletion:', await res.text());
    }
  } catch (err) {
    console.warn('[Sync] Failed to sync material deletion to Turso:', err);
  }
}

// Deadlines
export async function syncCreateDeadline(deadline: Deadline) {
  const user = getAuthenticatedUser();
  if (!user) return;

  try {
    const res = await fetch(`${API_BASE_URL}/api/deadlines`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: deadline.id,
        folderId: deadline.folderId,
        subjectId: deadline.subjectId || null,
        userId: user.id,
        title: deadline.title,
        description: deadline.description || null,
        dueDate: deadline.dueDate,
        isCompleted: deadline.completed,
      }),
    });
    if (!res.ok) {
      console.warn('[Sync] Failed to sync deadline creation:', await res.text());
    }
  } catch (err) {
    console.warn('[Sync] Failed to sync deadline creation to Turso:', err);
  }
}

export async function syncUpdateDeadline(id: string, updates: Partial<Deadline>) {
  const user = getAuthenticatedUser();
  if (!user) return;

  try {
    const payload: Record<string, unknown> = {};
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.dueDate !== undefined) payload.dueDate = updates.dueDate;
    if (updates.completed !== undefined) payload.isCompleted = updates.completed;

    const res = await fetch(`${API_BASE_URL}/api/deadlines/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.warn('[Sync] Failed to sync deadline update:', await res.text());
    }
  } catch (err) {
    console.warn('[Sync] Failed to sync deadline update to Turso:', err);
  }
}

export async function syncDeleteDeadline(id: string) {
  const user = getAuthenticatedUser();
  if (!user) return;

  try {
    const res = await fetch(`${API_BASE_URL}/api/deadlines/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      console.warn('[Sync] Failed to sync deadline deletion:', await res.text());
    }
  } catch (err) {
    console.warn('[Sync] Failed to sync deadline deletion to Turso:', err);
  }
}
