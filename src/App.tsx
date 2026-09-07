import { useEffect, useState } from 'react';
import { Menu, GraduationCap, PanelLeftOpen, Sparkles, PanelRightClose, Maximize2, Minimize2, X, Search } from 'lucide-react';
import { db } from '@/db/database';
import { seedData, setView, setSidebarOpen, toggleAIPanel, setAIPanelOpen, toggleAIPanelFullscreen, setAIPanelFullscreen, useAppState } from '@/store/appState';
import { useSemesters, useSubjects } from '@/hooks/useQueries';
import { Sidebar } from '@/components/Sidebar';
import { HomeView } from '@/components/HomeView';
import { SemesterDashboard } from '@/components/SemesterDashboard';
import { SubjectView } from '@/components/SubjectView';
import { AskAIPanel } from '@/components/AskAIPanel';
import { GlobalSearch } from '@/components/GlobalSearch';

function App() {
  const { view, sidebarOpen, aiPanelOpen, aiPanelFullscreen } = useAppState();
  const [ready, setReady] = useState(false);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const semesters = useSemesters();
  const subjects = useSubjects();

  useEffect(() => {
    seedData().then(() => setReady(true));
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!ready) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-paper-100">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center shadow-lifted mb-4">
          <GraduationCap className="w-8 h-8 text-white animate-pulse" strokeWidth={2} />
        </div>
        <span className="font-serif text-lg text-ink-500">Loading eStudesk...</span>
      </div>
    );
  }

  const currentSemester =
    view.kind === 'semester'
      ? semesters.find((s) => s.id === view.semesterId)
      : view.kind === 'subject'
        ? semesters.find((s) =>
            subjects.some((sub) => sub.id === view.subjectId && sub.semesterId === s.id),
          )
        : null;

  return (
    <div className="h-screen flex bg-paper-100 overflow-hidden">
      <Sidebar />
      <div className="flex-1 min-h-0 flex flex-col min-w-0 relative">
        {/* Mobile top bar */}
        {!sidebarOpen && (
          <div className="lg:hidden flex items-center gap-2 px-4 py-3 border-b border-paper-200 bg-white">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-paper-100 text-ink-400 transition-colors"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center shadow-soft">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <span className="font-serif text-base font-semibold text-ink-800">eStudesk</span>
            </div>
          </div>
        )}

        {/* Desktop expand button when sidebar is collapsed */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="hidden lg:flex absolute top-4 left-4 z-30 p-2 rounded-lg bg-white border border-paper-300 shadow-soft text-ink-400 hover:text-ink-600 hover:shadow-card transition-all"
            aria-label="Expand sidebar"
            title="Expand sidebar"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        )}

        {/* Global search + Ask AI buttons — top right corner */}
        <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
          <button
            onClick={() => setShowGlobalSearch(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all shadow-soft bg-white text-ink-600 border border-paper-300 hover:border-accent-300 hover:text-accent-600 hover:shadow-card"
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">Search</span>
          </button>
          <button
            onClick={toggleAIPanel}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all shadow-soft ${
              aiPanelOpen
                ? 'bg-accent-600 text-white shadow-glow'
                : 'bg-white text-ink-600 border border-paper-300 hover:border-accent-300 hover:text-accent-600 hover:shadow-card'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">Ask AI</span>
          </button>
        </div>

        {view.kind === 'home' && <HomeView />}
        {view.kind === 'semester' && currentSemester && (
          <SemesterDashboard
            semesterId={currentSemester.id}
            semesterName={currentSemester.name}
          />
        )}
        {view.kind === 'subject' && <SubjectView subjectId={view.subjectId} />}
      </div>

      {/* AI Panel — right side */}
      {aiPanelOpen && !aiPanelFullscreen && (
        <>
          {/* Mobile overlay */}
          <div
            className="lg:hidden fixed inset-0 bg-ink-800/30 z-40"
            onClick={toggleAIPanel}
          />
          <div className="fixed lg:relative inset-y-0 right-0 z-50 lg:z-auto w-full sm:w-96 lg:w-96 xl:w-[420px] bg-white border-l border-paper-300 flex flex-col shadow-lifted lg:shadow-none animate-slide-in-right">
            <div className="flex items-center justify-between px-4 py-3 border-b border-paper-200 bg-white lg:hidden">
              <span className="font-serif text-sm font-semibold text-ink-700">Close</span>
              <button
                onClick={toggleAIPanel}
                className="p-1.5 rounded-lg hover:bg-paper-100 text-ink-400"
              >
                <PanelRightClose className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 min-h-0">
              <AskAIPanel />
            </div>
          </div>
        </>
      )}

      {showGlobalSearch && <GlobalSearch onClose={() => setShowGlobalSearch(false)} />}

      {/* AI Panel — fullscreen overlay */}
      {aiPanelOpen && aiPanelFullscreen && (
        <div className="fixed inset-0 z-[60] bg-paper-50 flex flex-col animate-fade-in">
          <div className="flex-1 min-h-0">
            <AskAIPanel />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
