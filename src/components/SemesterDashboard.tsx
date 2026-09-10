import { useState } from 'react';
import {
  BookOpen,
  FileText,
  Flag,
  Plus,
  Clock,
  CheckCircle2,
  Circle,
  Trash2,
  ChevronRight,
  Calendar,
  List,
  FolderTree,
  Pencil,
} from 'lucide-react';
import { db } from '@/db/database';
import { useSubjects, useSemesterMaterials, useDeadlines, useSemester } from '@/hooks/useQueries';
import { setView } from '@/store/appState';
import { COLOR_HEX, COLOR_LIGHT, COLOR_TEXT } from '@/utils/colors';
import { AddDeadlineModal } from '@/components/AddDeadlineModal';
import { EditDeadlineModal } from '@/components/EditDeadlineModal';
import { syncUpdateDeadline, syncDeleteDeadline } from '@/lib/apiSync';
import {
  categorizeDeadline,
  CATEGORY_META,
  relativeDeadlineLabel,
  type DeadlineCategory,
} from '@/utils/deadlines';
import { DownloadMenu } from '@/components/DownloadMenu';
import type { Subject, Deadline } from '@/types';

interface Props {
  semesterId: string;
  semesterName?: string;
}

type DeadlineView = 'date' | 'subject' | 'calendar';

export function SemesterDashboard({ semesterId, semesterName }: Props) {
  const semester = useSemester(semesterId);
  const subjects = useSubjects(semesterId);
  const materials = useSemesterMaterials(semesterId);
  const deadlines = useDeadlines(semesterId);
  const [showAddDeadline, setShowAddDeadline] = useState(false);
  const [editingDeadline, setEditingDeadline] = useState<Deadline | null>(null);
  const [deadlineView, setDeadlineView] = useState<DeadlineView>('date');

  const displayName = semester?.name || semesterName || 'Semester';

  const upcomingDeadlines = deadlines
    .filter((d) => !d.completed)
    .sort((a, b) => a.dueDate - b.dueDate);

  const completedCount = deadlines.filter((d) => d.completed).length;

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="max-w-5xl mx-auto px-6 lg:px-8 py-8 lg:py-10 animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-sm text-ink-400 mb-2">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Semester</span>
            </div>
            <h1 className="font-serif text-3xl lg:text-4xl font-semibold text-ink-800 tracking-tight">
              {displayName}
            </h1>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard
            icon={<BookOpen className="w-5 h-5" />}
            label="Subjects"
            value={subjects.length}
            colorClass="from-accent-50 to-accent-100"
            iconColor="text-accent-600"
          />
          <StatCard
            icon={<FileText className="w-5 h-5" />}
            label="Study materials"
            value={materials.length}
            colorClass="from-blue-50 to-blue-100"
            iconColor="text-blue-600"
          />
          <StatCard
            icon={<Flag className="w-5 h-5" />}
            label="Deadlines"
            value={upcomingDeadlines.length}
            subValue={`${completedCount} completed`}
            colorClass="from-amber-50 to-amber-100"
            iconColor="text-amber-600"
          />
        </div>

        {/* Deadlines section — right after stats */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl font-semibold text-ink-700">
              Deadlines
            </h2>
            <div className="flex items-center gap-2">
              <DownloadMenu
                studentName=""
                semesterName={semesterName}
                scopeLabel="all-subjects"
                deadlines={deadlines}
                subjects={subjects}
                grouping={deadlineView === 'subject' ? 'subject' : 'category'}
              />
              <button
                onClick={() => setShowAddDeadline(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-accent-500 text-white hover:bg-accent-600 transition-all shadow-card hover:shadow-glow"
              >
                <Plus className="w-4 h-4" />
                Add deadline
              </button>
            </div>
          </div>

          {/* Deadline view tabs */}
          <div className="flex gap-1 mb-4 border-b border-paper-200">
            {([
              { key: 'date' as const, label: 'Date-wise', icon: <List className="w-3.5 h-3.5" /> },
              { key: 'subject' as const, label: 'Subject-wise', icon: <FolderTree className="w-3.5 h-3.5" /> },
              { key: 'calendar' as const, label: 'Calendar', icon: <Calendar className="w-3.5 h-3.5" /> },
            ]).map((t) => (
              <button
                key={t.key}
                onClick={() => setDeadlineView(t.key)}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium border-b-2 transition-all ${
                  deadlineView === t.key
                    ? 'border-accent-500 text-ink-700'
                    : 'border-transparent text-ink-400 hover:text-ink-600'
                }`}
              >
                {t.icon}
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </div>

          {deadlines.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-paper-100 text-ink-300">
                <Flag className="w-6 h-6" />
              </div>
              <p className="text-sm text-ink-400 mb-1">No deadlines yet</p>
              <p className="text-xs text-ink-300">Add one to stay on track</p>
            </div>
          ) : deadlineView === 'date' ? (
            <DateWiseDeadlines deadlines={deadlines} subjects={subjects} onEdit={setEditingDeadline} />
          ) : deadlineView === 'subject' ? (
            <SubjectWiseDeadlines deadlines={deadlines} subjects={subjects} onEdit={setEditingDeadline} />
          ) : (
            <CalendarDeadlines deadlines={deadlines} subjects={subjects} />
          )}
        </section>

        {/* Subjects grid */}
        <section>
          <h2 className="font-serif text-xl font-semibold text-ink-700 mb-4">
            Subjects
          </h2>
          {subjects.length === 0 ? (
            <div className="text-center py-16 text-ink-400 text-sm">
              No subjects yet. Add one from the sidebar.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {subjects.map((subject) => (
                <SubjectCard key={subject.id} subject={subject} />
              ))}
            </div>
          )}
        </section>
      </div>

      <AddDeadlineModal
        open={showAddDeadline}
        onClose={() => setShowAddDeadline(false)}
        semesterId={semesterId}
        subjects={subjects}
      />

      <EditDeadlineModal
        open={!!editingDeadline}
        onClose={() => setEditingDeadline(null)}
        deadline={editingDeadline}
        subjects={subjects}
      />
    </div>
  );
}

// --- Date-wise view ---

function DateWiseDeadlines({
  deadlines,
  subjects,
  onEdit,
}: {
  deadlines: Deadline[];
  subjects: Subject[];
  onEdit?: (deadline: Deadline) => void;
}) {
  const categories: DeadlineCategory[] = ['overdue', 'today', 'thisWeek', 'later'];
  const sorted = [...deadlines].sort((a, b) => a.dueDate - b.dueDate);

  return (
    <div className="space-y-5">
      {categories.map((cat) => {
        const items = sorted.filter((d) => categorizeDeadline(d) === cat);
        if (items.length === 0) return null;
        const meta = CATEGORY_META[cat];
        return (
          <div key={cat}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
              <h3 className={`text-xs font-semibold uppercase tracking-wide ${meta.text}`}>
                {meta.label} ({items.length})
              </h3>
            </div>
            <div className="space-y-2">
              {items.map((d) => (
                <DeadlineRow key={d.id} deadline={d} subjects={subjects} onEdit={onEdit} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// --- Subject-wise view ---

function SubjectWiseDeadlines({
  deadlines,
  subjects,
  onEdit,
}: {
  deadlines: Deadline[];
  subjects: Subject[];
  onEdit?: (deadline: Deadline) => void;
}) {
  const sorted = [...deadlines].sort((a, b) => a.dueDate - b.dueDate);
  const withSubject = subjects.filter((s) =>
    sorted.some((d) => d.subjectId === s.id),
  );
  const noSubject = sorted.filter((d) => !d.subjectId);

  return (
    <div className="space-y-5">
      {withSubject.map((subject) => {
        const items = sorted.filter((d) => d.subjectId === subject.id);
        const hex = COLOR_HEX[subject.color];
        
        return (
          <div key={subject.id}>
            <div className="flex items-center gap-2 mb-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: hex }}
              />
              <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-600">
                {subject.name} ({items.length})
              </h3>
            </div>
            <div className="space-y-2 ml-4 pl-3 border-l-2" style={{ borderColor: `${hex}40` }}>
              {items.map((d) => (
                <DeadlineRow key={d.id} deadline={d} subjects={subjects} onEdit={onEdit} />
              ))}
            </div>
          </div>
        );
      })}
      {noSubject.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-ink-300" />
            <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-500">
              Other ({noSubject.length})
            </h3>
          </div>
          <div className="space-y-2 ml-4 pl-3 border-l-2 border-paper-300">
            {noSubject.map((d) => (
              <DeadlineRow key={d.id} deadline={d} subjects={subjects} onEdit={onEdit} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Calendar view ---

function CalendarDeadlines({
  deadlines,
  subjects,
}: {
  deadlines: Deadline[];
  subjects: Subject[];
}) {
  const [monthOffset, setMonthOffset] = useState(0);

  const baseDate = new Date();
  baseDate.setDate(1);
  baseDate.setMonth(baseDate.getMonth() + monthOffset);

  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const monthName = baseDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function deadlinesForDay(day: number | null): Deadline[] {
    if (day === null) return [];
    const dayStart = new Date(year, month, day, 0, 0, 0, 0).getTime();
    const dayEnd = new Date(year, month, day, 23, 59, 59, 999).getTime();
    return deadlines.filter((d) => d.dueDate >= dayStart && d.dueDate <= dayEnd);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setMonthOffset(monthOffset - 1)}
          className="p-1.5 rounded-lg hover:bg-paper-200 text-ink-400 transition-colors"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
        </button>
        <h3 className="font-serif text-base font-semibold text-ink-700">{monthName}</h3>
        <button
          onClick={() => setMonthOffset(monthOffset + 1)}
          className="p-1.5 rounded-lg hover:bg-paper-200 text-ink-400 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold text-ink-300 uppercase py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          const dayDeadlines = deadlinesForDay(day);
          const isToday =
            day !== null &&
            new Date().toDateString() === new Date(year, month, day).toDateString();
          return (
            <div
              key={i}
              className={`min-h-[64px] rounded-lg border p-1 ${
                day === null
                  ? 'border-transparent bg-transparent'
                  : isToday
                    ? 'border-accent-300 bg-accent-50/40'
                    : 'border-paper-200 bg-white/50'
              }`}
            >
              {day !== null && (
                <>
                  <span className={`text-[11px] font-medium ${isToday ? 'text-accent-600' : 'text-ink-400'}`}>
                    {day}
                  </span>
                  <div className="space-y-0.5 mt-0.5">
                    {dayDeadlines.slice(0, 3).map((d) => {
                      const cat = categorizeDeadline(d);
                      const meta = CATEGORY_META[cat];
                      const subject = subjects.find((s) => s.id === d.subjectId);
                      return (
                        <div
                          key={d.id}
                          className={`flex items-center gap-1 rounded px-1 py-0.5 text-[10px] font-medium ${meta.bg} ${meta.text} truncate`}
                          title={d.title}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${meta.dot}`}
                            style={subject ? { backgroundColor: COLOR_HEX[subject.color] } : undefined}
                          />
                          <span className="truncate">{d.title}</span>
                        </div>
                      );
                    })}
                    {dayDeadlines.length > 3 && (
                      <p className="text-[10px] text-ink-300 px-1">
                        +{dayDeadlines.length - 3} more
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Shared components ---

function StatCard({
  icon,
  label,
  value,
  subValue,
  colorClass,
  iconColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  colorClass: string;
  iconColor: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-paper-200 p-5 shadow-soft card-hover">
      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${colorClass} ${iconColor} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-2xl font-serif font-semibold text-ink-800">{value}</p>
      <p className="text-sm text-ink-400">{label}</p>
      {subValue && <p className="text-xs text-ink-300 mt-1">{subValue}</p>}
    </div>
  );
}

function SubjectCard({ subject }: { subject: Subject }) {
  const hex = COLOR_HEX[subject.color];
  const bg = COLOR_LIGHT[subject.color];
  const text = COLOR_TEXT[subject.color];

  return (
    <button
      onClick={() => setView({ kind: 'subject', subjectId: subject.id })}
      className="group bg-white rounded-2xl border border-paper-200 p-4 text-left card-hover hover:shadow-card hover:border-paper-400 relative overflow-hidden"
    >
      <div
        className="absolute top-0 left-0 w-full h-1"
        style={{ backgroundColor: hex, opacity: 0.7 }}
      />
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center font-serif font-semibold text-base shadow-soft"
          style={{ backgroundColor: bg, color: text }}
        >
          {subject.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm text-ink-700 truncate">
            {subject.name}
          </h3>
          <p className="text-xs text-ink-400">View materials</p>
        </div>
        <ChevronRight className="w-4 h-4 text-ink-300 group-hover:text-ink-500 group-hover:translate-x-0.5 transition-all shrink-0" />
      </div>
    </button>
  );
}

function DeadlineRow({
  deadline,
  subjects,
  onEdit,
}: {
  deadline: Deadline;
  subjects: Subject[];
  onEdit?: (deadline: Deadline) => void;
}) {
  const subject = subjects.find((s) => s.id === deadline.subjectId);
  const cat = categorizeDeadline(deadline);
  const meta = CATEGORY_META[cat];

  async function toggle() {
    const newCompleted = !deadline.completed;
    await db.deadlines.update(deadline.id, { completed: newCompleted });
    syncUpdateDeadline(deadline.id, { completed: newCompleted });
  }

  async function remove() {
    await db.deadlines.delete(deadline.id);
    syncDeleteDeadline(deadline.id);
  }

  return (
    <div
      className={`flex items-center gap-3 ${meta.rowBg} rounded-xl border border-paper-200 border-l-4 ${meta.border} px-4 py-3 group hover:shadow-soft card-hover`}
    >
      <button onClick={toggle} className="shrink-0">
        {deadline.completed ? (
          <CheckCircle2 className="w-5 h-5 text-accent-500" />
        ) : (
          <Circle className="w-5 h-5 text-ink-300 hover:text-ink-400 transition-colors" />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p
            className={`text-sm font-medium truncate ${
              deadline.completed
                ? 'text-ink-400 line-through'
                : 'text-ink-700'
            }`}
          >
            {deadline.title}
          </p>
          {subject && (
            <span
              className="text-xs px-2 py-0.5 rounded-md font-medium shrink-0"
              style={{
                backgroundColor: COLOR_LIGHT[subject.color],
                color: COLOR_TEXT[subject.color],
              }}
            >
              {subject.name}
            </span>
          )}
          {!subject && (
            <span className="text-xs px-2 py-0.5 rounded-md font-medium bg-paper-200 text-ink-400 shrink-0">
              Other
            </span>
          )}
        </div>
        {deadline.description && (
          <p className="text-xs text-ink-400 mt-0.5 truncate">
            {deadline.description}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <div
          className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg ${meta.bg} ${meta.text}`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>{relativeDeadlineLabel(deadline)}</span>
        </div>
        <button
          onClick={() => onEdit?.(deadline)}
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-paper-100 text-ink-300 hover:text-accent-600 transition-all"
          title="Edit deadline"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={remove}
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-paper-100 text-ink-300 hover:text-crimson-500 transition-all"
          title="Delete deadline"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
