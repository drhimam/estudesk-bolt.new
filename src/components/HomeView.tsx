import React, { useState } from 'react';
import {
  GraduationCap,
  BookOpen,
  FileText,
  Sparkles,
  Shield,
  ChevronRight,
  Layers,
  HelpCircle,
  Presentation,
  PenLine,
  StickyNote,
  Plus,
  FolderTree,
  FileUp,
  Brain,
  Headphones,
  Calendar,
  Zap,
  ArrowRight,
  Lightbulb,
  CheckCircle2,
  RotateCcw,
  Sparkle,
} from 'lucide-react';
import { useSemesters, useSubjects, useAllMaterials } from '@/hooks/useQueries';
import { setView, openTourModal, seedData, clearAllData } from '@/store/appState';
import { COLOR_LIGHT, COLOR_TEXT } from '@/utils/colors';
import { db, uid } from '@/db/database';
import { syncCreateFolder } from '@/lib/apiSync';

export function HomeView() {
  const semesters = useSemesters();
  const subjects = useSubjects();
  const totalMaterials = useAllMaterials().length;

  const [newSemesterName, setNewSemesterName] = useState('');
  const [isCreatingSemester, setIsCreatingSemester] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  async function handleCreateSemester(e: React.FormEvent) {
    e.preventDefault();
    if (!newSemesterName.trim()) return;
    const createdId = uid();
    const cleanName = newSemesterName.trim().toUpperCase();
    await db.semesters.add({
      id: createdId,
      name: cleanName,
      createdAt: Date.now(),
    });
    syncCreateFolder({ id: createdId, name: cleanName });
    setNewSemesterName('');
    setIsCreatingSemester(false);
    setView({ kind: 'semester', semesterId: createdId });
  }

  async function handleLoadSamplePack() {
    await seedData();
  }

  // If there are no semesters, render the rich empty post-sign-up dashboard
  if (semesters.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="max-w-5xl mx-auto px-6 lg:px-8 py-10 lg:py-14 animate-fade-in">
          
          {/* Welcome Hero */}
          <div className="relative text-center mb-10">
            <div className="absolute inset-0 -z-10 flex items-center justify-center pointer-events-none">
              <div className="w-72 h-72 rounded-full bg-accent-200/30 blur-3xl" />
            </div>
            
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-600 to-accent-800 flex items-center justify-center mx-auto mb-4 shadow-lifted text-white">
              <GraduationCap className="w-8 h-8" strokeWidth={2.2} />
            </div>

            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-accent-50 border border-accent-200 text-accent-800 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-accent-600" />
              <span>Clean Study Workspace Ready</span>
            </div>

            <h1 className="font-serif text-3xl lg:text-4xl font-bold text-ink-900 mb-3 tracking-tight">
              Welcome to your Study Desk
            </h1>
            <p className="text-ink-600 max-w-xl mx-auto leading-relaxed text-sm md:text-base">
              Your desk is clean and ready. Follow the quick guide below to create your first course folder, attach lecture notes, or take a quick tour of all features.
            </p>
          </div>

          {/* Top Interactive Tour Banner */}
          <div className="max-w-3xl mx-auto mb-10 bg-gradient-to-r from-accent-600 via-accent-700 to-indigo-700 rounded-3xl p-6 sm:p-7 text-white shadow-card relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold uppercase tracking-wider mb-2">
                <Sparkle className="w-3 h-3 fill-white" />
                <span>New User Interactive Tour</span>
              </div>
              <h3 className="font-serif text-xl sm:text-2xl font-bold mb-1">
                New to eStudesk? Take the 2-Minute Tour
              </h3>
              <p className="text-white/80 text-xs sm:text-sm max-w-md leading-relaxed">
                Learn how to generate AI study aids, use active recall flashcards, simulate exams, and run Pomodoro soundscapes.
              </p>
            </div>

            <div className="relative z-10 flex items-center gap-3 shrink-0">
              <button
                onClick={() => openTourModal(0, 'walkthrough')}
                className="px-5 py-3 rounded-2xl bg-white text-ink-900 hover:bg-paper-100 font-bold text-xs shadow-soft hover:shadow-card hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
              >
                <span className="text-ink-900 font-bold text-xs">Launch Tour</span>
                <ArrowRight className="w-4 h-4 text-accent-700" />
              </button>
            </div>
          </div>

          {/* Action 1: Create First Semester Form */}
          <div className="max-w-3xl mx-auto mb-12 bg-white rounded-3xl border border-paper-300 p-6 sm:p-8 shadow-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-accent-100 text-accent-700 flex items-center justify-center font-bold font-mono text-base">
                1
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-ink-900">
                  Create Your First Folder or Term
                </h3>
                <p className="text-xs text-ink-500">
                  Examples: "Fall 2026", "Spring Trimester", "Medical School Year 1", "USMLE Step 1"
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateSemester} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={newSemesterName}
                onChange={(e) => setNewSemesterName(e.target.value)}
                placeholder="ENTER SEMESTER OR STUDY BLOCK (e.g. FALL 2026)"
                className="flex-1 text-xs sm:text-sm font-semibold uppercase bg-paper-50 border border-paper-300 rounded-2xl px-4 py-3.5 text-ink-800 placeholder:text-ink-400 placeholder:font-normal focus:outline-none focus:border-accent-500 focus:bg-white focus:ring-2 focus:ring-accent-100 transition-all"
                autoFocus
              />
              <button
                type="submit"
                disabled={!newSemesterName.trim()}
                className={`px-6 py-3.5 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-soft ${
                  newSemesterName.trim()
                    ? 'bg-accent-600 hover:bg-accent-700 text-white hover:shadow-card hover:scale-[1.02] active:scale-[0.98]'
                    : 'bg-paper-200 text-ink-400 cursor-not-allowed'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>Create Folder</span>
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-paper-200/80 flex flex-wrap items-center justify-between gap-3 text-xs text-ink-500">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-ink-700">Quick suggestions:</span>
                {['Fall 2026', 'Spring 2026', 'USMLE Step 1', 'Biology 101'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setNewSemesterName(tag)}
                    className="px-2.5 py-1 rounded-lg bg-paper-100 hover:bg-paper-200 text-ink-700 font-medium transition-colors"
                  >
                    + {tag}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleLoadSamplePack}
                className="text-accent-700 hover:text-accent-900 font-semibold hover:underline flex items-center gap-1"
                title="Populate with sample medical and science course folders"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Or load sample study pack</span>
              </button>
            </div>
          </div>

          {/* 4-Step Academic Workflow Roadmap */}
          <div className="max-w-3xl mx-auto mb-12">
            <h2 className="font-serif text-lg font-bold text-ink-800 mb-4 text-center">
              How eStudesk Works in 4 Simple Steps
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <WorkflowStepCard
                step="1"
                icon={<FolderTree className="w-5 h-5 text-blue-600" />}
                title="Create Folders"
                desc="Structure by semester, term, or rotation block in the sidebar."
                onClick={() => openTourModal(1, 'walkthrough')}
              />
              <WorkflowStepCard
                step="2"
                icon={<BookOpen className="w-5 h-5 text-emerald-600" />}
                title="Add Subjects"
                desc="Create distinct color-coded course workspaces."
                onClick={() => openTourModal(2, 'walkthrough')}
              />
              <WorkflowStepCard
                step="3"
                icon={<FileUp className="w-5 h-5 text-amber-600" />}
                title="Attach Notes"
                desc="Upload lecture PDFs, slides, or scanned images with OCR."
                onClick={() => openTourModal(3, 'walkthrough')}
              />
              <WorkflowStepCard
                step="4"
                icon={<Brain className="w-5 h-5 text-purple-600" />}
                title="AI Studio"
                desc="Generate flashcards, cheat sheets, summaries & quizzes."
                onClick={() => openTourModal(4, 'walkthrough')}
              />
            </div>
          </div>

          {/* Feature Manuals & Interactive Instructions Grid */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-lg font-bold text-ink-800">
                Feature Manuals & How-To Guides
              </h2>
              <button
                onClick={() => openTourModal(0, 'all-features')}
                className="text-xs font-semibold text-accent-700 hover:text-accent-900 flex items-center gap-1"
              >
                <span>View All 9 Feature Manuals</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              <FeatureGuideCard
                icon={<Layers className="w-5 h-5 text-rose-600" />}
                bgClass="bg-rose-50 border-rose-100"
                title="Spaced Repetition Flashcards"
                tag="Memory"
                desc="Active recall 3D flip cards powered by the SuperMemo-2 (SM-2) retention engine."
                stepIndex={5}
              />
              <FeatureGuideCard
                icon={<HelpCircle className="w-5 h-5 text-indigo-600" />}
                bgClass="bg-indigo-50 border-indigo-100"
                title="Interactive Exam Quizzes"
                tag="Testing"
                desc="Multiple-choice and multi-select questions with step-by-step instant rationales."
                stepIndex={6}
              />
              <FeatureGuideCard
                icon={<Brain className="w-5 h-5 text-purple-600" />}
                bgClass="bg-purple-50 border-purple-100"
                title="10-Turn AI Generation"
                tag="AI Studio"
                desc="Pedagogical multi-agent study material generation with full LaTeX formatting."
                stepIndex={4}
              />
              <FeatureGuideCard
                icon={<Sparkles className="w-5 h-5 text-accent-600" />}
                bgClass="bg-accent-50 border-accent-100"
                title="Ask AI Study Sidekick"
                tag="Assistant"
                desc="Omnipresent context-aware chat tutor connected directly to your active notes."
                stepIndex={7}
              />
              <FeatureGuideCard
                icon={<Headphones className="w-5 h-5 text-teal-600" />}
                bgClass="bg-teal-50 border-teal-100"
                title="Focus Timer & 432Hz Audio"
                tag="Deep Work"
                desc="25/5 Pomodoro intervals paired with ambient soundscapes for flow state."
                stepIndex={8}
              />
              <FeatureGuideCard
                icon={<Calendar className="w-5 h-5 text-amber-600" />}
                bgClass="bg-amber-50 border-amber-100"
                title="Deadlines & Calendar Sync"
                tag="Planning"
                desc="Priority assignment tracking with printable schedule and CSV exports."
                stepIndex={9}
              />
            </div>
          </div>

          {/* Privacy & Security Note */}
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3 bg-white rounded-2xl p-4 border border-paper-200 shadow-soft">
              <div className="w-10 h-10 rounded-xl bg-accent-500 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <p className="text-xs text-ink-600 leading-relaxed">
                <strong className="text-ink-800">Local-First Storage:</strong> All your course folders, flashcard decks, OCR scans, and study chat history are stored privately on your device.
              </p>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // If semesters exist, show the active dashboard overview
  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="max-w-5xl mx-auto px-6 lg:px-8 py-10 lg:py-14 animate-fade-in">
        
        {/* Hero */}
        <div className="relative text-center mb-10">
          <div className="absolute inset-0 -z-10 flex items-center justify-center pointer-events-none">
            <div className="w-64 h-64 rounded-full bg-accent-200/30 blur-3xl" />
          </div>
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center mx-auto mb-4 shadow-lifted text-white">
            <GraduationCap className="w-8 h-8" strokeWidth={2} />
          </div>
          <h1 className="font-serif text-3xl lg:text-4xl font-bold text-ink-800 mb-2 tracking-tight">
            Your Study Desk
          </h1>
          <p className="text-ink-500 max-w-lg mx-auto leading-relaxed text-sm">
            Select a semester below to manage your subjects, generate study aids, or track deadlines.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 lg:gap-4 max-w-2xl mx-auto mb-10">
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

        {/* Tour & Feature Guide Banner */}
        <div className="max-w-3xl mx-auto mb-10 bg-white rounded-2xl border border-paper-300 p-4 sm:p-5 shadow-soft flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-100 text-accent-700 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-sm font-bold text-ink-900">
                Explore Feature Guides & Shortcuts
              </h3>
              <p className="text-xs text-ink-500">
                Step-by-step instructions for AI generation, flashcards, OCR, and Pomodoro soundscapes.
              </p>
            </div>
          </div>

          <button
            onClick={() => openTourModal(0, 'walkthrough')}
            className="px-4 py-2 rounded-xl bg-accent-50 hover:bg-accent-100 border border-accent-200 text-accent-800 text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
          >
            <span>Take Tour</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Quick start semester list */}
        <div className="max-w-3xl mx-auto mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg font-bold text-ink-800">
              Your Academic Folders
            </h2>
            <button
              onClick={() => setIsCreatingSemester(true)}
              className="text-xs font-semibold text-accent-700 hover:text-accent-900 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Folder</span>
            </button>
          </div>

          {isCreatingSemester && (
            <form onSubmit={handleCreateSemester} className="mb-3 bg-white rounded-2xl border border-accent-300 p-3 shadow-soft flex gap-2 animate-scale-in">
              <input
                type="text"
                value={newSemesterName}
                onChange={(e) => setNewSemesterName(e.target.value)}
                placeholder="SEMESTER NAME (e.g. FALL 2026)"
                className="flex-1 text-xs font-bold uppercase bg-paper-50 border border-paper-300 rounded-xl px-3 py-2 text-ink-800 focus:outline-none focus:border-accent-500"
                autoFocus
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-accent-600 text-white font-bold text-xs"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsCreatingSemester(false)}
                className="px-3 py-2 rounded-xl bg-paper-100 text-ink-600 font-medium text-xs hover:bg-paper-200"
              >
                Cancel
              </button>
            </form>
          )}

          <div className="space-y-2.5">
            {semesters.map((s) => {
              const semSubjects = subjects.filter((sub) => sub.semesterId === s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => setView({ kind: 'semester', semesterId: s.id })}
                  className="w-full bg-white rounded-2xl border border-paper-200 p-4 hover:shadow-card hover:border-accent-300 card-hover text-left group transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-serif text-base font-semibold text-ink-800 mb-0.5 group-hover:text-accent-700 transition-colors">
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
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold border-2 border-white shadow-soft"
                            style={{
                              backgroundColor: COLOR_LIGHT[sub.color],
                              color: COLOR_TEXT[sub.color],
                            }}
                          >
                            {sub.name.charAt(0).toUpperCase()}
                          </div>
                        ))}
                      </div>
                      <ChevronRight className="w-4 h-4 text-ink-300 group-hover:text-accent-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Feature quick links */}
        <div className="max-w-3xl mx-auto mb-10">
          <h2 className="font-serif text-base font-semibold text-ink-700 mb-3 text-center">
            Creation Tools
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
            <FeatureChip icon={<FileText className="w-4 h-4" />} label="Notes" stepIndex={4} />
            <FeatureChip icon={<StickyNote className="w-4 h-4" />} label="Cheat sheets" stepIndex={4} />
            <FeatureChip icon={<Layers className="w-4 h-4" />} label="Flashcards" stepIndex={5} />
            <FeatureChip icon={<HelpCircle className="w-4 h-4" />} label="Quizzes" stepIndex={6} />
            <FeatureChip icon={<PenLine className="w-4 h-4" />} label="Assignments" stepIndex={9} />
            <FeatureChip icon={<Presentation className="w-4 h-4" />} label="Slides" stepIndex={4} />
            <FeatureChip icon={<Sparkles className="w-4 h-4" />} label="Infographics" stepIndex={4} />
          </div>
        </div>

        {/* Workspace Management Footer */}
        <div className="max-w-2xl mx-auto mt-10 pt-6 border-t border-paper-200 flex items-center justify-between text-xs text-ink-400">
          <button
            onClick={() => openTourModal(0, 'all-features')}
            className="hover:text-ink-700 transition-colors flex items-center gap-1"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Open Feature Manuals</span>
          </button>

          <button
            onClick={() => setShowConfirmReset(true)}
            className="hover:text-crimson-600 transition-colors flex items-center gap-1"
            title="Clear all mock/local data and start with an empty dashboard"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Empty Workspace</span>
          </button>
        </div>

        {/* Reset Confirmation Modal */}
        {showConfirmReset && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl border border-paper-300 shadow-lifted max-w-md w-full p-6 animate-scale-in">
              <h3 className="font-serif text-lg font-bold text-ink-900 mb-2">
                Reset Workspace to Empty?
              </h3>
              <p className="text-xs text-ink-600 leading-relaxed mb-5">
                This will remove all local semesters, subjects, materials, and test messages so you can start with a fresh, clean dashboard.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowConfirmReset(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-ink-600 hover:bg-paper-100"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    await clearAllData();
                    setShowConfirmReset(false);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-crimson-600 hover:bg-crimson-700 text-white shadow-soft"
                >
                  Confirm & Reset
                </button>
              </div>
            </div>
          </div>
        )}

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
      <p className="font-serif text-2xl font-bold text-ink-800">{value}</p>
      <p className="text-xs text-ink-400 mt-0.5">{label}</p>
    </div>
  );
}

function WorkflowStepCard({
  step,
  icon,
  title,
  desc,
  onClick,
}: {
  step: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-2xl border border-paper-200 p-4 text-left shadow-soft hover:shadow-card hover:border-accent-300 card-hover group transition-all"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="w-8 h-8 rounded-xl bg-paper-100 flex items-center justify-center group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <span className="font-mono text-xs font-bold text-ink-400">Step {step}</span>
      </div>
      <h4 className="font-serif text-sm font-bold text-ink-800 mb-1 group-hover:text-accent-700 transition-colors">
        {title}
      </h4>
      <p className="text-xs text-ink-500 leading-relaxed">{desc}</p>
    </button>
  );
}

function FeatureGuideCard({
  icon,
  bgClass,
  title,
  tag,
  desc,
  stepIndex,
}: {
  icon: React.ReactNode;
  bgClass: string;
  title: string;
  tag: string;
  desc: string;
  stepIndex: number;
}) {
  return (
    <button
      onClick={() => openTourModal(stepIndex, 'walkthrough')}
      className={`rounded-2xl border p-4 text-left shadow-soft hover:shadow-card card-hover group transition-all ${bgClass}`}
    >
      <div className="flex items-center justify-between mb-2.5">
        <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-xs">
          {icon}
        </div>
        <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-white text-ink-700 shadow-xs">
          {tag}
        </span>
      </div>
      <h4 className="font-serif text-sm font-bold text-ink-900 mb-1">
        {title}
      </h4>
      <p className="text-xs text-ink-600 leading-relaxed line-clamp-2 mb-2">
        {desc}
      </p>
      <div className="flex items-center gap-1 text-[11px] font-bold text-accent-700 group-hover:translate-x-1 transition-transform">
        <span>Read instructions</span>
        <ChevronRight className="w-3 h-3" />
      </div>
    </button>
  );
}

function FeatureChip({
  icon,
  label,
  stepIndex,
}: {
  icon: React.ReactNode;
  label: string;
  stepIndex: number;
}) {
  return (
    <button
      onClick={() => openTourModal(stepIndex, 'walkthrough')}
      className="flex flex-col items-center gap-1.5 bg-white rounded-xl border border-paper-200 py-3 px-2 shadow-soft hover:shadow-card hover:border-accent-300 card-hover text-center transition-all"
    >
      <span className="text-ink-500">{icon}</span>
      <span className="text-xs font-medium text-ink-600">{label}</span>
    </button>
  );
}