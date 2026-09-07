import { useState } from 'react';
import { Plus, Clock, CheckCircle2, Circle, Trash2, Flag } from 'lucide-react';
import { db } from '@/db/database';
import { useDeadlines, useSubject } from '@/hooks/useQueries';
import { AddDeadlineModal } from '@/components/AddDeadlineModal';
import { DownloadMenu } from '@/components/DownloadMenu';
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
  const subject = useSubject(subjectId);
  const deadlines = allDeadlines.filter((d) => d.subjectId === subjectId);
  const [showAdd, setShowAdd] = useState(false);

  const sorted = [...deadlines].sort((a, b) => a.dueDate - b.dueDate);
  const active = sorted.filter((d) => !d.completed);
  const done = sorted.filter((d) => d.completed);

  const categories: DeadlineCategory[] = ['overdue', 'today', 'thisWeek', 'later'];

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="max-w-3xl mx-auto px-4 lg:px-6 py-6 animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-xl font-semibold text-ink-700">
            Deadlines
          </h2>
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

        {deadlines.length === 0 ? (
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
                          <DeadlineItem key={d.id} deadline={d} />
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
                    <DeadlineItem key={d.id} deadline={d} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      <AddDeadlineModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        semesterId={semesterId}
        subjects={[]}
      />
    </div>
  );
}

function DeadlineItem({ deadline }: { deadline: Deadline }) {
  const cat = categorizeDeadline(deadline);
  const meta = CATEGORY_META[cat];

  async function toggle() {
    await db.deadlines.update(deadline.id, {
      completed: !deadline.completed,
    });
  }

  async function remove() {
    await db.deadlines.delete(deadline.id);
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
          onClick={remove}
          className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-paper-100 text-ink-300 hover:text-crimson-500 transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
