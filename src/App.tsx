import { useEffect, useState } from 'react';
import { Menu, GraduationCap, PanelLeftOpen, Sparkles, PanelRightClose, Search, HelpCircle } from 'lucide-react';
import { setSidebarOpen, toggleAIPanel, useAppState, openTourModal, closeTourModal, openAuthModal } from '@/store/appState';
import { useSemesters, useSubjects } from '@/hooks/useQueries';
import { Sidebar } from '@/components/Sidebar';
import { HomeView } from '@/components/HomeView';
import { SemesterDashboard } from '@/components/SemesterDashboard';
import { SubjectView } from '@/components/SubjectView';
import { AskAIPanel } from '@/components/AskAIPanel';
import { GlobalSearch } from '@/components/GlobalSearch';
import { LandingPage } from '@/components/LandingPage';
import { AuthModal } from '@/components/AuthModal';
import { NotificationSettingsModal } from '@/components/NotificationSettingsModal';
import { DashboardTourModal } from '@/components/DashboardTourModal';
import { syncFromTursoToLocal } from '@/lib/apiSync';
import { verifyEmail } from '@/lib/authClient';

function App() {
  const { view, sidebarOpen, aiPanelOpen, aiPanelFullscreen, tourModalOpen, tourInitialStep, tourInitialTab, currentUser } = useAppState();
  const [ready, setReady] = useState(false);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [aiPanelWidth, setAiPanelWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('estudesk_ai_panel_width');
      const parsed = saved ? parseInt(saved, 10) : 420;
      return isNaN(parsed) ? 420 : Math.min(Math.max(parsed, 320), 850);
    } catch {
      return 420;
    }
  });
  const [isResizing, setIsResizing] = useState(false);
  const semesters = useSemesters();
  const subjects = useSubjects();

  // Check URL parameters for password reset and email verification tokens
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    const token = urlParams.get('token');

    if (action === 'reset-password' && token) {
      openAuthModal('reset_password', token);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (action === 'verify-email' && token) {
      verifyEmail({ query: { token } })
        .then((res) => {
          if (res.error) {
            openAuthModal(
              'signin',
              null,
              null,
              res.error.message || 'Verification token is invalid or has expired. Please sign in or request a new link.'
            );
          } else {
            openAuthModal(
              'signin',
              null,
              '✓ Your email address has been successfully verified! You can now sign in.'
            );
          }
        })
        .catch((err) => {
          console.error('Email verification error:', err);
          openAuthModal(
            'signin',
            null,
            null,
            'Failed to verify email token. Please try again or request a new verification email.'
          );
        });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    setReady(true);
    if (currentUser) {
      syncFromTursoToLocal();
    }
  }, [currentUser]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    function handleMouseMove(e: MouseEvent) {
      const newWidth = window.innerWidth - e.clientX;
      const maxWidth = Math.min(window.innerWidth * 0.75, 850);
      const clamped = Math.min(Math.max(newWidth, 320), maxWidth);
      setAiPanelWidth(clamped);
      try {
        localStorage.setItem('estudesk_ai_panel_width', clamped.toString());
      } catch {}
    }

    function handleMouseUp() {
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

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

  // Strictly require authentication to enter the study desk
  if (view.kind === 'landing' || !currentUser) {
    return (
      <>
        <LandingPage />
        <AuthModal />
      </>
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
    <div className="h-screen flex bg-[#fbf5eb] overflow-hidden">
      <Sidebar />
      <AuthModal />
      <NotificationSettingsModal />
      <DashboardTourModal
        isOpen={tourModalOpen}
        onClose={closeTourModal}
        initialStepIndex={tourInitialStep}
        initialTab={tourInitialTab}
      />
      {/* Center Main Panel (Warm Academic Linen / Parchment) */}
      <div className="flex-1 min-h-0 flex flex-col min-w-0 relative bg-[#fbf5eb]">
        {/* Mobile top bar */}
        {!sidebarOpen && (
          <div className="lg:hidden flex items-center gap-2 px-4 py-3 border-b border-[#dfd2be] bg-[#f3ead8]">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-paper-200 text-ink-500 transition-colors"
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
            className="hidden lg:flex absolute top-4 left-4 z-30 p-2 rounded-lg bg-white/95 border border-[#dfd2be] shadow-soft text-ink-600 hover:text-ink-900 hover:shadow-card transition-all"
            aria-label="Expand sidebar"
            title="Expand sidebar"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        )}

        {/* Top utility buttons: Feature Guide, Search, Ask AI */}
        <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
          <button
            onClick={() => openTourModal(0, 'walkthrough')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-soft bg-accent-50 text-accent-800 border border-accent-200 hover:bg-accent-100 hover:border-accent-300 hover:shadow-card"
            title="Interactive Feature Guide & Tour"
          >
            <HelpCircle className="w-4 h-4 text-accent-600" />
            <span className="hidden sm:inline">Guide & Tour</span>
          </button>

          <button
            onClick={() => setShowGlobalSearch(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all shadow-soft bg-white/95 text-ink-600 border border-[#dfd2be] hover:border-accent-300 hover:text-accent-600 hover:shadow-card"
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">Search</span>
          </button>

          <button
            onClick={toggleAIPanel}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all shadow-soft ${
              aiPanelOpen
                ? 'bg-indigo-600 text-white shadow-glow'
                : 'bg-white/95 text-ink-600 border border-[#dfd2be] hover:border-indigo-300 hover:text-indigo-600 hover:shadow-card'
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

      {/* AI Panel - right side (Serene Soft Periwinkle-Lavender) */}
      {aiPanelOpen && !aiPanelFullscreen && (
        <>
          {/* Mobile overlay */}
          <div
            className="lg:hidden fixed inset-0 bg-ink-800/30 z-40"
            onClick={toggleAIPanel}
          />
          <div
            className="fixed lg:relative inset-y-0 right-0 z-50 lg:z-auto w-full bg-[#e8edf8] border-l border-[#c2d2ee] flex flex-col shadow-lifted lg:shadow-none animate-slide-in-right"
            style={{
              width: typeof window !== 'undefined' && window.innerWidth >= 1024 ? `${aiPanelWidth}px` : undefined,
              maxWidth: '100vw',
            }}
          >
            {/* Desktop resize handle on the left border */}
            <div
              onMouseDown={(e) => {
                e.preventDefault();
                setIsResizing(true);
              }}
              onDoubleClick={() => {
                setAiPanelWidth(420);
                try {
                  localStorage.setItem('estudesk_ai_panel_width', '420');
                } catch {}
              }}
              className="hidden lg:flex absolute -left-1.5 top-0 bottom-0 w-3 cursor-col-resize items-center justify-center z-30 group hover:bg-indigo-500/20 active:bg-indigo-500/30 transition-colors select-none"
              title="Drag to resize panel (Double-click to reset width)"
            >
              <div className="w-1 h-10 rounded-full bg-indigo-300 group-hover:bg-indigo-600 group-hover:h-14 group-active:bg-indigo-700 transition-all shadow-sm" />
            </div>

            <div className="flex items-center justify-between px-4 py-3 border-b border-[#dbe2f0] bg-[#e9eef8] lg:hidden">
              <span className="font-serif text-sm font-semibold text-ink-700">Close</span>
              <button
                onClick={toggleAIPanel}
                className="p-1.5 rounded-lg hover:bg-[#dfe6f4] text-ink-500"
              >
                <PanelRightClose className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 min-h-0 bg-[#f3f5fb]">
              <AskAIPanel />
            </div>
          </div>
        </>
      )}

      {showGlobalSearch && <GlobalSearch onClose={() => setShowGlobalSearch(false)} />}

      {/* AI Panel - fullscreen overlay */}
      {aiPanelOpen && aiPanelFullscreen && (
        <div className="fixed inset-0 z-[60] bg-[#f3f5fb] flex flex-col animate-fade-in">
          <div className="flex-1 min-h-0">
            <AskAIPanel />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;