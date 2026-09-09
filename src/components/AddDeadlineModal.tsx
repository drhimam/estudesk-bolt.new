import { useState } from 'react';
import { X, Calendar, Flag } from 'lucide-react';
import { db, uid } from '@/db/database';
import { syncCreateDeadline } from '@/lib/apiSync';
import type { Subject, Deadline } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  semesterId: string;
  subjects: Subject[];
}

export function AddDeadlineModal({ open, onClose, semesterId, subjects }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState<string>('');
  const [dueDate, setDueDate] = useState('');

  if (!open) return null;

  const isOther = subjectId === 'other';

  async function save() {
    if (!title.trim() || !dueDate) return;
    const newDeadline: Deadline = {
      id: uid(),
      folderId: semesterId,
      subjectId: isOther ? null : subjectId || null,
      title: title.trim(),
      description: description.trim() || undefined,
      dueDate: new Date(dueDate).getTime(),
      completed: false,
      createdAt: Date.now(),
    };
    await db.deadlines.add(newDeadline);
    syncCreateDeadline(newDeadline);
    setTitle('');
    setDescription('');
    setSubjectId('');
    setDueDate('');
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/30 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-lifted animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-paper-200">
          <div className="flex items-center gap-2">
            <Flag className="w-4 h-4 text-accent-500" />
            <h2 className="font-serif text-lg font-semibold text-ink-800">
              Add deadline
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-paper-100 text-ink-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-600 mb-1.5">
              Title
            </label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full bg-paper-50 border border-paper-300 rounded-lg px-3 py-2 text-sm text-ink-700 placeholder:text-ink-300 focus:outline-none focus:border-accent-400 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-600 mb-1.5">
              Subject
            </label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full bg-paper-50 border border-paper-300 rounded-lg px-3 py-2 text-sm text-ink-700 focus:outline-none focus:border-accent-400 transition-colors"
            >
              <option value="">Select a subject (optional)</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
              <option value="other">Other (non-subject)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-600 mb-1.5">
              Due date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-300 pointer-events-none" />
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-paper-50 border border-paper-300 rounded-lg pl-9 pr-3 py-2 text-sm text-ink-700 focus:outline-none focus:border-accent-400 transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-600 mb-1.5">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional details"
              rows={2}
              className="w-full bg-paper-50 border border-paper-300 rounded-lg px-3 py-2 text-sm text-ink-700 placeholder:text-ink-300 focus:outline-none focus:border-accent-400 transition-colors resize-none"
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-paper-200">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-ink-500 hover:bg-paper-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={!title.trim() || !dueDate}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-accent-500 text-white hover:bg-accent-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Add deadline
          </button>
        </div>
      </div>
    </div>
  );
}
