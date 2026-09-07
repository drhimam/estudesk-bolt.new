import type { Deadline } from '@/types';

export type DeadlineCategory = 'overdue' | 'today' | 'thisWeek' | 'later';

export const CATEGORY_META: Record<
  DeadlineCategory,
  { label: string; bg: string; rowBg: string; text: string; dot: string; border: string; hex: string }
> = {
  overdue: {
    label: 'Overdue',
    bg: 'bg-red-50',
    rowBg: 'bg-red-50/60',
    text: 'text-crimson-600',
    dot: 'bg-crimson-500',
    border: 'border-l-crimson-400',
    hex: '#b04545',
  },
  today: {
    label: 'Today',
    bg: 'bg-orange-50',
    rowBg: 'bg-orange-50/60',
    text: 'text-orange-600',
    dot: 'bg-orange-500',
    border: 'border-l-orange-400',
    hex: '#e07a3c',
  },
  thisWeek: {
    label: 'This week',
    bg: 'bg-amber-50',
    rowBg: 'bg-amber-50/50',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
    border: 'border-l-amber-400',
    hex: '#c08a3e',
  },
  later: {
    label: 'Later',
    bg: 'bg-paper-100',
    rowBg: 'bg-paper-50',
    text: 'text-ink-400',
    dot: 'bg-ink-300',
    border: 'border-l-paper-300',
    hex: '#8a8a82',
  },
};

const DAY_MS = 1000 * 60 * 60 * 24;

function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function categorizeDeadline(deadline: Deadline): DeadlineCategory {
  if (deadline.completed) return 'later';
  const now = startOfDay(Date.now());
  const due = startOfDay(deadline.dueDate);
  const diffDays = Math.round((due - now) / DAY_MS);

  if (diffDays < 0) return 'overdue';
  if (diffDays === 0) return 'today';
  if (diffDays <= 7) return 'thisWeek';
  return 'later';
}

export function daysUntil(dueDate: number): number {
  const now = startOfDay(Date.now());
  const due = startOfDay(dueDate);
  return Math.round((due - now) / DAY_MS);
}

export function relativeDeadlineLabel(deadline: Deadline): string {
  const days = daysUntil(deadline.dueDate);
  if (deadline.completed) return 'Completed';
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `${days}d left`;
}
