import type { Deadline } from '@/types';

export type DeadlineCategory = 'overdue' | 'today' | 'thisWeek' | 'later';

export const CATEGORY_META: Record<
  DeadlineCategory,
  {
    label: string;
    bg: string;
    rowBg: string;
    text: string;
    dot: string;
    border: string;
    badgeBg: string;
    badgeText: string;
    hex: string;
    pdfBg: [number, number, number];
    pdfText: [number, number, number];
    pdfBorder: [number, number, number];
    pdfItemBg: [number, number, number];
  }
> = {
  overdue: {
    label: 'Overdue',
    bg: 'bg-rose-100/70',
    rowBg: 'bg-[#fff1f2]',
    text: 'text-rose-800',
    dot: 'bg-rose-500',
    border: 'border-rose-200',
    badgeBg: 'bg-rose-100',
    badgeText: 'text-rose-800',
    hex: '#e11d48',
    pdfBg: [255, 241, 242],
    pdfText: [159, 18, 57],
    pdfBorder: [254, 205, 211],
    pdfItemBg: [255, 248, 248],
  },
  today: {
    label: 'Today',
    bg: 'bg-amber-100/70',
    rowBg: 'bg-[#fffbeb]',
    text: 'text-amber-800',
    dot: 'bg-amber-500',
    border: 'border-amber-200',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-900',
    hex: '#d97706',
    pdfBg: [254, 243, 199],
    pdfText: [146, 64, 14],
    pdfBorder: [253, 230, 138],
    pdfItemBg: [255, 252, 242],
  },
  thisWeek: {
    label: 'This week',
    bg: 'bg-sky-100/70',
    rowBg: 'bg-[#f0f9ff]',
    text: 'text-sky-800',
    dot: 'bg-sky-500',
    border: 'border-sky-200',
    badgeBg: 'bg-sky-100',
    badgeText: 'text-sky-800',
    hex: '#0284c7',
    pdfBg: [240, 249, 255],
    pdfText: [7, 89, 133],
    pdfBorder: [186, 230, 253],
    pdfItemBg: [246, 252, 255],
  },
  later: {
    label: 'Later',
    bg: 'bg-emerald-100/70',
    rowBg: 'bg-[#f4f8f5]',
    text: 'text-[#2e543e]',
    dot: 'bg-[#4a8a64]',
    border: 'border-[#d3e4d9]',
    badgeBg: 'bg-[#e3eee6]',
    badgeText: 'text-[#274835]',
    hex: '#4a8a64',
    pdfBg: [241, 248, 243],
    pdfText: [39, 72, 53],
    pdfBorder: [211, 228, 217],
    pdfItemBg: [250, 253, 251],
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
  badgeBg: string;
  badgeText: string;
  hex: string;
  pdfBg: [number, number, number];
  pdfText: [number, number, number];
  pdfBorder: [number, number, number];
  pdfItemBg: [number, number, number];
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
      bg: 'bg-indigo-100/70',
      rowBg: 'bg-[#eef2ff]',
      text: 'text-indigo-800',
      border: 'border-[#c7d2fe]',
      badgeBg: 'bg-indigo-100',
      badgeText: 'text-indigo-800',
      hex: '#4f46e5',
      pdfBg: [238, 242, 255],
      pdfText: [55, 48, 163],
      pdfBorder: [199, 210, 254],
      pdfItemBg: [245, 247, 255],
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
      dot: 'bg-[#4a8a64]',
      bg: 'bg-emerald-50/80',
      rowBg: 'bg-[#f4f8f5]',
      text: 'text-[#2e543e]',
      border: 'border-[#d3e4d9]',
      badgeBg: 'bg-[#e3eee6]',
      badgeText: 'text-[#274835]',
      hex: '#4a8a64',
      pdfBg: [241, 248, 243],
      pdfText: [39, 72, 53],
      pdfBorder: [211, 228, 217],
      pdfItemBg: [250, 253, 251],
      items: weekData.items,
    });
  }

  return groups;
}
