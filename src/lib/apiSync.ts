// Utility to synchronize client IndexedDB operations with Turso DB
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? 'https://estudesk-api.rifa-numis.workers.dev'
    : (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'));

export async function syncCreateFolder(folder: { id: string; name: string; color?: string; userId?: string }) {
  try {
    await fetch(`${API_BASE_URL}/api/folders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(folder),
    });
  } catch (err) {
    console.warn('[Sync] Failed to sync folder creation to Turso:', err);
  }
}

export async function syncUpdateFolder(id: string, updates: { name?: string; color?: string; isPinned?: boolean }) {
  try {
    await fetch(`${API_BASE_URL}/api/folders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
  } catch (err) {
    console.warn('[Sync] Failed to sync folder update to Turso:', err);
  }
}

export async function syncDeleteFolder(id: string) {
  try {
    await fetch(`${API_BASE_URL}/api/folders/${id}`, {
      method: 'DELETE',
    });
  } catch (err) {
    console.warn('[Sync] Failed to sync folder deletion to Turso:', err);
  }
}

export async function syncCreateSubject(subject: { id: string; folderId: string; name: string; color?: string; userId?: string }) {
  try {
    await fetch(`${API_BASE_URL}/api/subjects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subject),
    });
  } catch (err) {
    console.warn('[Sync] Failed to sync subject creation to Turso:', err);
  }
}

export async function syncUpdateSubject(id: string, updates: { name?: string; color?: string; isPinned?: boolean }) {
  try {
    await fetch(`${API_BASE_URL}/api/subjects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
  } catch (err) {
    console.warn('[Sync] Failed to sync subject update to Turso:', err);
  }
}

export async function syncDeleteSubject(id: string) {
  try {
    await fetch(`${API_BASE_URL}/api/subjects/${id}`, {
      method: 'DELETE',
    });
  } catch (err) {
    console.warn('[Sync] Failed to sync subject deletion to Turso:', err);
  }
}
