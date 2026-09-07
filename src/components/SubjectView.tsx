import { useState } from 'react';
import { Menu, FileText, Flag } from 'lucide-react';
import { toggleSidebar, useAppState } from '@/store/appState';
import { useSubject } from '@/hooks/useQueries';
import { COLOR_HEX, COLOR_LIGHT, COLOR_TEXT } from '@/utils/colors';
import { StudyMaterialTab } from '@/components/StudyMaterialTab';
import { DeadlineTab } from '@/components/DeadlineTab';

type Tab = 'materials' | 'deadlines';

interface Props {
  subjectId: string;
}

export function SubjectView({ subjectId }: Props) {
  const subject = useSubject(subjectId);
  const [tab, setTab] = useState<Tab>('materials');
  const { sidebarOpen } = useAppState();

  if (!subject) {
    return (
      <div className="flex-1 flex items-center justify-center text-ink-400">
        Subject not found
      </div>
    );
  }

  const hex = COLOR_HEX[subject.color];
  const bg = COLOR_LIGHT[subject.color];
  const text = COLOR_TEXT[subject.color];

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'materials', label: 'Study material', icon: <FileText className="w-4 h-4" /> },
    { key: 'deadlines', label: 'Deadline', icon: <Flag className="w-4 h-4" /> },
  ];

  return (
    <div className="flex-1 min-h-0 flex flex-col min-w-0">
      {/* Header with gradient accent */}
      <header
        className="border-b border-paper-200 px-4 lg:px-6 py-4 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${bg} 0%, #ffffff 60%)` }}
      >
        <div className="flex items-center gap-3 relative z-10">
          {!sidebarOpen && (
            <button
              onClick={toggleSidebar}
              className="p-1.5 rounded-lg hover:bg-white/60 text-ink-400 transition-colors"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center font-serif font-semibold text-base shrink-0 shadow-soft"
            style={{ backgroundColor: bg, color: text, border: `1px solid ${hex}22` }}
          >
            {subject.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="font-serif text-xl lg:text-2xl font-semibold text-ink-800 truncate leading-tight">
              {subject.name}
            </h1>
            <p className="text-xs text-ink-400 mt-0.5">Study material and deadlines</p>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-paper-200 bg-white px-4 lg:px-6">
        <div className="flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-3.5 py-3 text-sm font-medium border-b-2 transition-all ${
                tab === t.key
                  ? 'border-current text-ink-700'
                  : 'border-transparent text-ink-400 hover:text-ink-600'
              }`}
              style={tab === t.key ? { color: text, borderColor: hex } : undefined}
            >
              {t.icon}
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 flex flex-col">
        {tab === 'materials' && <StudyMaterialTab subjectId={subjectId} subjectColor={subject.color} />}
        {tab === 'deadlines' && <DeadlineTab subjectId={subjectId} semesterId={subject.semesterId} />}
      </div>
    </div>
  );
}
