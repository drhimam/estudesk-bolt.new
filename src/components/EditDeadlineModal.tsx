import { useState, useEffect } from 'react';
import { X, Calendar, Flag, Check } from 'lucide-react';
import { db } from '@/db/database';
import { syncUpdateDeadline } from '@/lib/apiSync';
import type { Subject, Deadline } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  deadline: Deadline | null;
  subjects: Subject[];
}

function formatDateForInput(timestamp: number): string {
  const d = new Date(timestamp);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function EditDeadlineModal({ open, onClose, deadline, subjects }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState<string>('');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    if (open && deadline) {
      setTitle(deadline.title || '');
      setDescription(deadline.description || '');
      setSubjectId(deadline.subjectId || 'other');
      setDueDate(formatDateForInput(deadline.dueDate));
    }
  }, [open, deadline]);

  if (!open || !deadline) return null;

  const isOther = subjectId === 'other' || !subjectId;

  async function save() {
    if (!deadline || !title.trim() || !dueDate) return;

    const [year, month, day] = dueDate.split('-').map(Number);
    const dueTimestamp = new Date(year, month - 1, day, 12, 0, 0).getTime();
    const targetSubjectId = isOther ? null : subjectId;

    const updates = {
      title: title.trim(),
      description: description.trim() || undefined,
      subjectId: targetSubjectId,
      dueDate: dueTimestamp,
    };

    await db.deadlines.update(deadline.id, updates);
    syncUpdateDeadline(deadline.id, {
      title: updates.title,
      description: updates.description,
      subjectId: targetSubjectId ?? undefined,
      dueDate: dueTimestamp,
    });

    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 backdrop-blur-sm animate-fade-in p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-lifted border border-paper-200 animate-scale-in overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-paper-200 bg-paper-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent-100 text-accent-700 flex items-center justify-center">
              <Flag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif text-base font-semibold text-ink-800">
                Edit Deadline
              </h2>
              <p className="text-[11px] text-ink-400">Update assignment details and schedule</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-paper-200 text-ink-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink-700 mb-1.5">
              Title
            </label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full bg-paper-50 border border-paper-300 rounded-xl px-3.5 py-2.5 text-sm text-ink-800 placeholder:text-ink-400 focus:outline-none focus:border-accent-500 focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-700 mb-1.5">
              Subject
            </label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full bg-paper-50 border border-paper-300 rounded-xl px-3.5 py-2.5 text-sm text-ink-800 focus:outline-none focus:border-accent-500 focus:bg-white transition-colors"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
              <option value="other">Other (General / Non-subject)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-700 mb-1.5">
              Due Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none" />
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-paper-50 border border-paper-300 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-ink-800 focus:outline-none focus:border-accent-500 focus:bg-white transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-700 mb-1.5">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional details, notes, or grading breakdown"
              rows={2}
              className="w-full bg-paper-50 border border-paper-300 rounded-xl px-3.5 py-2 text-sm text-ink-800 placeholder:text-ink-400 focus:outline-none focus:border-accent-500 focus:bg-white transition-colors resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 px-5 py-4 border-t border-paper-200 bg-paper-50/40">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-ink-600 hover:bg-paper-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!title.trim() || !dueDate}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-accent-600 text-white hover:bg-accent-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-card hover:shadow-glow transition-all flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
