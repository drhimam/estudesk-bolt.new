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

export function startOfDay(ts: number): number {
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

export interface DateDeadlineGroup {
  id: string;
  label: string;
  sublabel?: string;
  category: DeadlineCategory;
  dot: string;
  bg: string;
  rowBg: string;
  text: string;
  border: string;
  hex: string;
  items: Deadline[];
}

export function formatWeekRange(startDate: Date, endDate: Date): string {
  const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' });
  const startDay = startDate.getDate();
  const startYear = startDate.getFullYear();

  const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' });
  const endDay = endDate.getDate();
  const endYear = endDate.getFullYear();

  if (startYear !== endYear) {
    return `${startMonth} ${startDay}, ${startYear} – ${endMonth} ${endDay}, ${endYear}`;
  }
  if (startMonth !== endMonth) {
    return `${startMonth} ${startDay} – ${endMonth} ${endDay}`;
  }
  return `${startMonth} ${startDay} – ${endDay}`;
}

export function groupDeadlinesByDate(deadlines: Deadline[]): DateDeadlineGroup[] {
  const sorted = [...deadlines].sort((a, b) => a.dueDate - b.dueDate);
  if (sorted.length === 0) return [];

  const now = startOfDay(Date.now());
  const dayOfWeek = new Date(now).getDay(); // 0 is Sunday, 1 is Monday ...
  const mondayOffset = (dayOfWeek + 6) % 7; // Monday = 0, Sunday = 6

  const currentWeekStart = now - mondayOffset * DAY_MS;
  const currentWeekEnd = currentWeekStart + 7 * DAY_MS - 1;

  const nextWeekStart = currentWeekStart + 7 * DAY_MS;
  const nextWeekEnd = nextWeekStart + 7 * DAY_MS - 1;

  const overdueItems: Deadline[] = [];
  const todayItems: Deadline[] = [];
  const thisWeekItems: Deadline[] = [];
  const nextWeekItems: Deadline[] = [];
  const futureWeeksMap = new Map<number, { start: Date; end: Date; items: Deadline[] }>();

  for (const d of sorted) {
    const due = startOfDay(d.dueDate);

    if (due < now) {
      overdueItems.push(d);
    } else if (due === now) {
      todayItems.push(d);
    } else if (due <= currentWeekEnd) {
      thisWeekItems.push(d);
    } else if (due <= nextWeekEnd) {
      nextWeekItems.push(d);
    } else {
      // Future weeks: calculate Monday start of the due date
      const dDayOfWeek = new Date(due).getDay();
      const dOffset = (dDayOfWeek + 6) % 7;
      const weekStartTs = due - dOffset * DAY_MS;
      const weekEndTs = weekStartTs + 7 * DAY_MS - 1;

      if (!futureWeeksMap.has(weekStartTs)) {
        futureWeeksMap.set(weekStartTs, {
          start: new Date(weekStartTs),
          end: new Date(weekEndTs),
          items: [],
        });
      }
      futureWeeksMap.get(weekStartTs)!.items.push(d);
    }
  }

  const groups: DateDeadlineGroup[] = [];

  if (overdueItems.length > 0) {
    groups.push({
      id: 'overdue',
      label: 'Overdue',
      category: 'overdue',
      ...CATEGORY_META.overdue,
      items: overdueItems,
    });
  }

  if (todayItems.length > 0) {
    groups.push({
      id: 'today',
      label: 'Today',
      category: 'today',
      ...CATEGORY_META.today,
      items: todayItems,
    });
  }

  if (thisWeekItems.length > 0) {
    groups.push({
      id: 'thisWeek',
      label: 'This Week',
      sublabel: formatWeekRange(new Date(now + DAY_MS), new Date(currentWeekEnd)),
      category: 'thisWeek',
      ...CATEGORY_META.thisWeek,
      items: thisWeekItems,
    });
  }

  if (nextWeekItems.length > 0) {
    groups.push({
      id: 'nextWeek',
      label: 'Next Week',
      sublabel: formatWeekRange(new Date(nextWeekStart), new Date(nextWeekEnd)),
      category: 'thisWeek',
      dot: 'bg-indigo-500',
      bg: 'bg-indigo-50',
      rowBg: 'bg-indigo-50/40',
      text: 'text-indigo-700',
      border: 'border-l-indigo-400',
      hex: '#4f46e5',
      items: nextWeekItems,
    });
  }

  // Sort future weeks chronologically
  const sortedWeekTimestamps = Array.from(futureWeeksMap.keys()).sort((a, b) => a - b);
  for (const weekTs of sortedWeekTimestamps) {
    const weekData = futureWeeksMap.get(weekTs)!;
    const rangeStr = formatWeekRange(weekData.start, weekData.end);
    groups.push({
      id: `week-${weekTs}`,
      label: `Week of ${rangeStr}`,
      category: 'later',
      dot: 'bg-ink-400',
      bg: 'bg-paper-100',
      rowBg: 'bg-paper-50',
      text: 'text-ink-600',
      border: 'border-l-paper-300',
      hex: '#64748b',
      items: weekData.items,
    });
  }

  return groups;
}
