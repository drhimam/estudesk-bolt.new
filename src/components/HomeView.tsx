import { GraduationCap, BookOpen, FileText, Sparkles, Shield, ChevronRight, Layers, HelpCircle, Presentation, PenLine, StickyNote } from 'lucide-react';
import { useSemesters, useSubjects, useMaterials } from '@/hooks/useQueries';
import { setView } from '@/store/appState';
import { COLOR_HEX, COLOR_LIGHT, COLOR_TEXT } from '@/utils/colors';

export function HomeView() {
  const semesters = useSemesters();
  const subjects = useSubjects();
  const totalMaterials = useMaterials(null).length;

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="max-w-5xl mx-auto px-6 lg:px-8 py-10 lg:py-14 animate-fade-in">
        {/* Hero */}
        <div className="relative text-center mb-14">
          <div className="absolute inset-0 -z-10 flex items-center justify-center pointer-events-none">
            <div className="w-64 h-64 rounded-full bg-accent-200/30 blur-3xl" />
          </div>
          <div className="w-18 h-18 rounded-3xl bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center mx-auto mb-5 shadow-lifted">
            <GraduationCap className="w-9 h-9 text-white" strokeWidth={2} />
          </div>
          <h1 className="font-serif text-4xl lg:text-5xl font-semibold text-ink-800 mb-3 tracking-tight">
            Your study desk
          </h1>
          <p className="text-ink-500 max-w-lg mx-auto leading-relaxed text-base">
            Attach source material to your subjects, explore it conversationally,
            then generate notes, flashcards, quizzes, and more — all in one place.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 lg:gap-4 max-w-2xl mx-auto mb-14">
          <StatCard
            icon={<BookOpen className="w-5 h-5" />}
            label="Semesters"
            value={semesters.length}
            colorClass="from-accent-50 to-accent-100"
            iconColor="text-accent-600"
          />
          <StatCard
            icon={<FileText className="w-5 h-5" />}
            label="Subjects"
            value={subjects.length}
            colorClass="from-blue-50 to-blue-100"
            iconColor="text-blue-600"
          />
          <StatCard
            icon={<Sparkles className="w-5 h-5" />}
            label="Materials"
            value={totalMaterials}
            colorClass="from-amber-50 to-amber-100"
            iconColor="text-amber-600"
          />
        </div>

        {/* Feature cards */}
        <div className="max-w-3xl mx-auto mb-14">
          <h2 className="font-serif text-lg font-semibold text-ink-700 mb-4 text-center">
            What you can create
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
            <FeatureChip icon={<FileText className="w-4 h-4" />} label="Notes" />
            <FeatureChip icon={<StickyNote className="w-4 h-4" />} label="Cheat sheets" />
            <FeatureChip icon={<Layers className="w-4 h-4" />} label="Flashcards" />
            <FeatureChip icon={<HelpCircle className="w-4 h-4" />} label="Quizzes" />
            <FeatureChip icon={<PenLine className="w-4 h-4" />} label="Assignments" />
            <FeatureChip icon={<Presentation className="w-4 h-4" />} label="Slides" />
            <FeatureChip icon={<Sparkles className="w-4 h-4" />} label="Infographics" />
          </div>
        </div>

        {/* Quick start */}
        <div className="max-w-2xl mx-auto">
          <h2 className="font-serif text-lg font-semibold text-ink-700 mb-4 text-center">
            Get started
          </h2>
          <div className="space-y-2.5">
            {semesters.map((s) => {
              const semSubjects = subjects.filter((sub) => sub.semesterId === s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => setView({ kind: 'semester', semesterId: s.id })}
                  className="w-full bg-white rounded-2xl border border-paper-200 p-4 hover:shadow-card hover:border-paper-400 card-hover text-left group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-serif text-base font-semibold text-ink-700 mb-0.5">
                        {s.name}
                      </h3>
                      <p className="text-xs text-ink-400">
                        {semSubjects.length} {semSubjects.length === 1 ? 'subject' : 'subjects'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-1.5">
                        {semSubjects.slice(0, 5).map((sub) => (
                          <div
                            key={sub.id}
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-medium border-2 border-white shadow-soft"
                            style={{
                              backgroundColor: COLOR_LIGHT[sub.color],
                              color: COLOR_TEXT[sub.color],
                            }}
                          >
                            {sub.name.charAt(0).toUpperCase()}
                          </div>
                        ))}
                      </div>
                      <ChevronRight className="w-4 h-4 text-ink-300 group-hover:text-ink-500 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Privacy note */}
        <div className="max-w-2xl mx-auto mt-10">
          <div className="flex items-center gap-3 bg-gradient-to-r from-accent-50 to-paper-100 rounded-2xl p-4 border border-accent-100">
            <div className="w-10 h-10 rounded-xl bg-accent-500 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm text-accent-700 leading-relaxed">
              Your chat conversations and attachments stay on your device. Nothing is stored on a server.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  colorClass,
  iconColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  colorClass: string;
  iconColor: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-paper-200 p-5 text-center shadow-soft card-hover">
      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${colorClass} ${iconColor} flex items-center justify-center mx-auto mb-3`}>
        {icon}
      </div>
      <p className="font-serif text-2xl font-semibold text-ink-800">{value}</p>
      <p className="text-xs text-ink-400 mt-0.5">{label}</p>
    </div>
  );
}

function FeatureChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 bg-white rounded-xl border border-paper-200 py-3 px-2 shadow-soft card-hover">
      <span className="text-ink-500">{icon}</span>
      <span className="text-xs font-medium text-ink-500">{label}</span>
    </div>
  );
}
