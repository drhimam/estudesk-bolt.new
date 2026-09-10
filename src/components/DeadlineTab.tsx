import { useState } from 'react';
import { Plus, Clock, CheckCircle2, Circle, Trash2, Flag, LayoutList, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Pencil } from 'lucide-react';
import { db } from '@/db/database';
import { useDeadlines, useSubject, useSubjects } from '@/hooks/useQueries';
import { AddDeadlineModal } from '@/components/AddDeadlineModal';
import { EditDeadlineModal } from '@/components/EditDeadlineModal';
import { DownloadMenu } from '@/components/DownloadMenu';
import { syncUpdateDeadline, syncDeleteDeadline } from '@/lib/apiSync';
import {
  categorizeDeadline,
  CATEGORY_META,
  relativeDeadlineLabel,
  type DeadlineCategory,
} from '@/utils/deadlines';
import type { Deadline } from '@/types';

interface Props {
  subjectId: string;
  semesterId: string;
}

export function DeadlineTab({ subjectId, semesterId }: Props) {
  const allDeadlines = useDeadlines(semesterId);
  const subjects = useSubjects(semesterId);
  const subject = useSubject(subjectId);
  const deadlines = allDeadlines.filter((d) => d.subjectId === subjectId);
  const [showAdd, setShowAdd] = useState(false);
  const [editingDeadline, setEditingDeadline] = useState<Deadline | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [currentDate, setCurrentDate] = useState(new Date());

  const sorted = [...deadlines].sort((a, b) => a.dueDate - b.dueDate);
  const active = sorted.filter((d) => !d.completed);
  const done = sorted.filter((d) => d.completed);

  const categories: DeadlineCategory[] = ['overdue', 'today', 'thisWeek', 'later'];

  // Calendar Helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const today = () => setCurrentDate(new Date());

  const monthName = currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="max-w-4xl mx-auto px-4 lg:px-6 py-6 animate-fade-in">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <h2 className="font-serif text-xl font-semibold text-ink-700">
              Deadlines
            </h2>
            <div className="flex items-center bg-paper-100 p-0.5 rounded-lg border border-paper-200">
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-ink-800 shadow-xs'
                    : 'text-ink-400 hover:text-ink-700'
                }`}
              >
                <LayoutList className="w-3.5 h-3.5" />
                List
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  viewMode === 'calendar'
                    ? 'bg-white text-ink-800 shadow-xs'
                    : 'text-ink-400 hover:text-ink-700'
                }`}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                Calendar
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DownloadMenu
              studentName=""
              semesterName=""
              scopeLabel={subject ? subject.name : 'subject'}
              deadlines={deadlines}
              subjects={subject ? [subject] : []}
              grouping="subject"
            />
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-accent-500 text-white hover:bg-accent-600 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add deadline
            </button>
          </div>
        </div>

        {viewMode === 'calendar' ? (
          <div className="bg-white rounded-xl border border-paper-200 shadow-soft p-4">
            {/* Calendar Controls */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg font-medium text-ink-800">{monthName}</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={today}
                  className="px-2.5 py-1 rounded-md border border-paper-200 text-xs font-medium text-ink-600 hover:bg-paper-50 transition-colors"
                >
                  Today
                </button>
                <div className="flex items-center gap-1">
                  <button
                    onClick={prevMonth}
                    className="p-1 rounded-md border border-paper-200 text-ink-500 hover:bg-paper-50 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={nextMonth}
                    className="p-1 rounded-md border border-paper-200 text-ink-500 hover:bg-paper-50 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} className="text-xs font-semibold text-ink-400 py-1 uppercase tracking-wider">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar Matrix */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="h-24 bg-paper-50/50 rounded-lg" />
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const cellDate = new Date(year, month, dayNum);
                const isToday =
                  cellDate.toDateString() === new Date().toDateString();

                const dayDeadlines = deadlines.filter((d) => {
                  const dDate = new Date(d.dueDate);
                  return (
                    dDate.getFullYear() === year &&
                    dDate.getMonth() === month &&
                    dDate.getDate() === dayNum
                  );
                });

                return (
                  <div
                    key={`day-${dayNum}`}
                    className={`h-24 p-1.5 rounded-lg border border-paper-200/80 flex flex-col justify-start overflow-hidden transition-all ${
                      isToday ? 'bg-accent-50/40 border-accent-300' : 'bg-white hover:bg-paper-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-xs font-semibold w-5 h-5 flex items-center justify-center rounded-full ${
                          isToday ? 'bg-accent-500 text-white' : 'text-ink-600'
                        }`}
                      >
                        {dayNum}
                      </span>
                      {dayDeadlines.length > 0 && (
                        <span className="text-[10px] font-medium text-ink-400">
                          {dayDeadlines.length}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 overflow-y-auto scrollbar-none flex-1">
                      {dayDeadlines.map((d) => {
                        const cat = categorizeDeadline(d);
                        const meta = CATEGORY_META[cat];
                        return (
                          <div
                            key={d.id}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-medium truncate ${meta.bg} ${meta.text} ${
                              d.completed ? 'line-through opacity-60' : ''
                            }`}
                            title={d.title}
                          >
                            {d.title}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* List View */
          deadlines.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-paper-100 text-ink-300">
                <Flag className="w-6 h-6" />
              </div>
              <p className="text-sm text-ink-400 mb-1">No deadlines for this subject</p>
              <p className="text-xs text-ink-300">Add one to stay on track</p>
            </div>
          ) : (
            <div className="space-y-6">
              <section>
                <h3 className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-2">
                  Active ({active.length})
                </h3>
                <div className="space-y-5">
                  {categories.map((cat) => {
                    const items = active.filter((d) => categorizeDeadline(d) === cat);
                    if (items.length === 0) return null;
                    const meta = CATEGORY_META[cat];
                    return (
                      <div key={cat}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
                          <h4 className={`text-xs font-semibold uppercase tracking-wide ${meta.text}`}>
                            {meta.label} ({items.length})
                          </h4>
                        </div>
                        <div className="space-y-2">
                          {items.map((d) => (
                            <DeadlineItem key={d.id} deadline={d} onEdit={setEditingDeadline} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
              {done.length > 0 && (
                <section>
                  <h3 className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-2">
                    Completed ({done.length})
                  </h3>
                  <div className="space-y-2">
                    {done.map((d) => (
                      <DeadlineItem key={d.id} deadline={d} onEdit={setEditingDeadline} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )
        )}
      </div>

      <AddDeadlineModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        semesterId={semesterId}
        subjects={subjects}
        defaultSubjectId={subjectId}
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

function DeadlineItem({
  deadline,
  onEdit,
}: {
  deadline: Deadline;
  onEdit?: (deadline: Deadline) => void;
}) {
  const cat = categorizeDeadline(deadline);
  const meta = CATEGORY_META[cat];

  async function toggle() {
    const newCompleted = !deadline.completed;
    await db.deadlines.update(deadline.id, {
      completed: newCompleted,
    });
    syncUpdateDeadline(deadline.id, { completed: newCompleted });
  }

  async function remove() {
    await db.deadlines.delete(deadline.id);
    syncDeleteDeadline(deadline.id);
  }

  return (
    <div
      className={`flex items-center gap-3 ${meta.rowBg} rounded-lg border border-paper-200 border-l-4 ${meta.border} px-4 py-3 group hover:shadow-soft transition-all`}
    >
      <button onClick={toggle} className="shrink-0">
        {deadline.completed ? (
          <CheckCircle2 className="w-5 h-5 text-accent-500" />
        ) : (
          <Circle className="w-5 h-5 text-ink-300 hover:text-ink-400 transition-colors" />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium ${
            deadline.completed
              ? 'text-ink-400 line-through'
              : 'text-ink-700'
          }`}
        >
          {deadline.title}
        </p>
        {deadline.description && (
          <p className="text-xs text-ink-400 mt-0.5">{deadline.description}</p>
        )}
        <p className="text-xs text-ink-400 mt-1">
          Due {new Date(deadline.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span
          className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md ${meta.bg} ${meta.text}`}
        >
          <Clock className="w-3 h-3" />
          {relativeDeadlineLabel(deadline)}
        </span>
        <button
          onClick={() => onEdit?.(deadline)}
          className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-paper-100 text-ink-300 hover:text-accent-600 transition-all"
          title="Edit deadline"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={remove}
          className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-paper-100 text-ink-300 hover:text-crimson-500 transition-all"
          title="Delete deadline"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}