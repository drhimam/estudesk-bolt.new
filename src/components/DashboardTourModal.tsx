import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  BookOpen,
  FolderTree,
  FileText,
  Layers,
  HelpCircle,
  Headphones,
  Clock,
  Calendar,
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  ArrowRight,
  Zap,
  Shield,
  Lightbulb,
  FileUp,
  Brain,
  MessageSquare,
  Flame,
  Search,
  Plus,
  Play,
  Share2,
} from 'lucide-react';
import { setView, toggleAIPanel } from '@/store/appState';

export interface TourStep {
  id: string;
  category: 'Organization' | 'AI & Creation' | 'Study & Practice' | 'Productivity';
  title: string;
  subtitle: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  bgGradient: string;
  description: string;
  howToUse: string[];
  proTips: string[];
  actionLabel?: string;
  action?: () => void;
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    category: 'Organization',
    title: 'Welcome to eStudesk',
    subtitle: 'Your all-in-one AI academic workspace',
    badge: 'Overview',
    icon: Sparkles,
    accentColor: 'from-accent-600 to-indigo-600',
    bgGradient: 'from-accent-50/70 via-indigo-50/40 to-paper-50',
    description:
      'eStudesk is built for high-performance students, researchers, and self-learners. It combines structured academic organization, local-first privacy, 10-turn multi-agent AI generation, interactive spaced repetition flashcards, quizzes, and focus soundscapes.',
    howToUse: [
      '1. Organize by Semesters, Terms, or Clinical Blocks in the left sidebar.',
      '2. Create color-coded Subjects within each folder.',
      '3. Attach lecture slides, textbooks, or scanned notes with automatic OCR.',
      '4. Generate AI summaries, flashcards, cheat sheets, and quizzes with 1 click.',
    ],
    proTips: [
      'Your files and conversations stay stored locally on your device in encrypted browser storage.',
      'You can launch the omnipresent Ask AI panel from any page using the top right button.',
    ],
    actionLabel: 'Explore Folder Structure',
  },
  {
    id: 'folders',
    category: 'Organization',
    title: 'Folders & Semesters',
    subtitle: 'High-level academic hierarchy',
    badge: 'Step 1: Hierarchy',
    icon: FolderTree,
    accentColor: 'from-blue-600 to-cyan-600',
    bgGradient: 'from-blue-50/70 via-cyan-50/40 to-paper-50',
    description:
      'Group your academic life by semester, quarter, year, or rotation. Each folder keeps its own deadlines, course subjects, and global study materials organized.',
    howToUse: [
      'Click the "+ New semester" button at the bottom of the sidebar.',
      'Type your folder name (e.g. "FALL 2026", "PRE-MED YEAR 2", "USMLE STEP 1").',
      'Pin key folders to the top of your sidebar for quick access.',
      'Click on any folder header to view its dedicated Semester Dashboard and deadlines overview.',
    ],
    proTips: [
      'Double-click or use the menu dots (⋮) on any semester in the sidebar to rename or pin it.',
      'You can export your semester schedule and deadlines to PDF or CSV at any time.',
    ],
    actionLabel: 'Next: Subjects & Courses',
  },
  {
    id: 'subjects',
    category: 'Organization',
    title: 'Subjects & Course Hubs',
    subtitle: 'Color-coded study spaces',
    badge: 'Step 2: Courses',
    icon: BookOpen,
    accentColor: 'from-emerald-600 to-teal-600',
    bgGradient: 'from-emerald-50/70 via-teal-50/40 to-paper-50',
    description:
      'Every subject has its own dedicated workspace. Manage lecture materials, flashcard decks, interactive quizzes, past test papers, and context-specific AI chat history.',
    howToUse: [
      'Inside any semester in the sidebar, click "+ Add subject".',
      'Name your subject (e.g. "Organic Chemistry", "Neuroanatomy", "Microeconomics").',
      'Subjects are automatically assigned distinct vibrant color tags for clear identification.',
      'Click a subject to enter its workspace containing Study Materials, Deadlines, and AI Tools.',
    ],
    proTips: [
      'Color tags help distinguish subjects in deadline calendars and global search.',
      'You can pin high-priority subjects to the top of their folder for fast navigation.',
    ],
    actionLabel: 'Next: Source Attachments',
  },
  {
    id: 'sources',
    category: 'AI & Creation',
    title: 'Source Material & OCR Scanner',
    subtitle: 'Attach PDFs, notes, slides, & images',
    badge: 'Step 3: Ingestion',
    icon: FileUp,
    accentColor: 'from-amber-600 to-orange-600',
    bgGradient: 'from-amber-50/70 via-orange-50/40 to-paper-50',
    description:
      'Feed your course materials directly into eStudesk. Our built-in OCR and parser extracts text from lecture slides, handwriting photos, PDF textbooks, and syllabus files.',
    howToUse: [
      'In any subject workspace, click "+ Attach Material" or "Upload Source".',
      'Upload a PDF document, image (PNG/JPG), or paste raw text/lecture notes.',
      'The client-side OCR engine will extract clean markdown with full text indexing.',
      'Attached sources immediately become available as context for the AI Generation Studio and Ask AI chat.',
    ],
    proTips: [
      'Use the camera on your phone/tablet to photograph textbook diagrams or whiteboard notes.',
      'Source text is referenced with citations when the AI generates flashcards and answers.',
    ],
    actionLabel: 'Next: AI Studio',
  },
  {
    id: 'ai-studio',
    category: 'AI & Creation',
    title: 'AI Generation Studio',
    subtitle: 'Multi-agent pedagogical content creation',
    badge: 'Step 4: Generation',
    icon: Brain,
    accentColor: 'from-purple-600 to-pink-600',
    bgGradient: 'from-purple-50/70 via-pink-50/40 to-paper-50',
    description:
      'Transform complex source material into tailored pedagogical study aids using our 10-turn multi-agent generation pipeline with LaTeX equations and markdown formatting.',
    howToUse: [
      'Click the "+ Generate" button in any Subject workspace.',
      'Choose your creation format: Summary Notes, Cheat Sheet, Flashcards, Quiz, Problem Set, Slides, or Infographics.',
      'Select which attached sources to base the generation upon, or enter a custom prompt.',
      'Set target depth (Introductory, Undergraduate, Advanced Graduate) and difficulty.',
      'Watch the live step-by-step drafting and pedagogical verification in real time.',
    ],
    proTips: [
      'Generations automatically support LaTeX equations like $\\int e^x dx$ and chemical formulas.',
      'You can export any generated note as an Executive PDF or Markdown file.',
    ],
    actionLabel: 'Next: Spaced Repetition',
  },
  {
    id: 'flashcards',
    category: 'Study & Practice',
    title: 'Spaced Repetition & Flashcards',
    subtitle: 'Active recall with SM-2 memory algorithm',
    badge: 'Step 5: Memory',
    icon: Layers,
    accentColor: 'from-rose-600 to-red-600',
    bgGradient: 'from-rose-50/70 via-red-50/40 to-paper-50',
    description:
      'Retain 10x more information using active recall and the SuperMemo-2 (SM-2) spaced repetition algorithm. Cards are scheduled dynamically based on your recall accuracy.',
    howToUse: [
      'Open any generated or custom Flashcard set in your subject materials.',
      'Click "Start Study Session" to launch full-screen 3D interactive flip mode.',
      'Read the question, test your recall, then click "Flip Card" or press the Spacebar.',
      'Rate your recall difficulty: Again (<1 min), Hard (12h), Good (1d), or Easy (4d).',
      'eStudesk calculates your optimal review schedule automatically.',
    ],
    proTips: [
      'Keyboard shortcuts: Spacebar to flip, keys 1 / 2 / 3 / 4 to rate difficulty.',
      'Enable "Shuffle Deck" or "Reverse Q/A" to challenge your memory from both angles.',
    ],
    actionLabel: 'Next: Interactive Quizzes',
  },
  {
    id: 'quizzes',
    category: 'Study & Practice',
    title: 'Interactive Mastery Quizzes',
    subtitle: 'Exam simulation & instant explanations',
    badge: 'Step 6: Testing',
    icon: HelpCircle,
    accentColor: 'from-indigo-600 to-blue-600',
    bgGradient: 'from-indigo-50/70 via-blue-50/40 to-paper-50',
    description:
      'Simulate real exams with Multiple Choice, Multi-select, True/False, and Short Answer questions with step-by-step solution walkthroughs.',
    howToUse: [
      'Open a Quiz in your study materials.',
      'Select answers and click "Submit Answer" for instant rationale and concept breakdown.',
      'Track your real-time score bar and question timer.',
      'Review your comprehensive performance summary and retry missed questions at the end.',
    ],
    proTips: [
      'Use the "Quiz Me" feature inside Ask AI to generate quick pop quizzes on any specific paragraph or formula.',
    ],
    actionLabel: 'Next: Ask AI Sidekick',
  },
  {
    id: 'ask-ai',
    category: 'Study & Practice',
    title: 'Ask AI Study Sidekick',
    subtitle: 'Context-aware 24/7 academic tutor',
    badge: 'Step 7: AI Assistant',
    icon: MessageSquare,
    accentColor: 'from-accent-600 to-teal-600',
    bgGradient: 'from-accent-50/70 via-teal-50/40 to-paper-50',
    description:
      'An omnipresent study companion. Ask for simplified explanations, step-by-step math derivations, mnemonics, or Socratic probing based on your active course files.',
    howToUse: [
      'Click the "Ask AI" button in the top right corner of any screen (or press Ctrl/Cmd + K).',
      'The panel slides in seamlessly without interrupting your reading.',
      'Type any question, paste an excerpt, or select quick prompts like "Explain like I\'m 5", "Create Mnemonics", or "Summarize Key Takeaways".',
      'Drag the panel border to resize or toggle fullscreen mode.',
    ],
    proTips: [
      'Attach specific subject notes to the chat so the AI grounds its answers strictly in your professor\'s lecture.',
    ],
    actionLabel: 'Next: Focus Timer & Audio',
    action: () => toggleAIPanel(),
  },
  {
    id: 'focus-timer',
    category: 'Productivity',
    title: 'Focus Timer & 432Hz Soundscapes',
    subtitle: 'Deep work Pomodoro with ambient audio',
    badge: 'Step 8: Deep Work',
    icon: Headphones,
    accentColor: 'from-teal-600 to-emerald-600',
    bgGradient: 'from-teal-50/70 via-emerald-50/40 to-paper-50',
    description:
      'Enter a state of deep flow with built-in 25/5 Pomodoro intervals and synthesized ambient soundscapes designed for cognitive focus.',
    howToUse: [
      'Click the Focus Timer icon in the top utility bar or sidebar.',
      'Choose your interval (25m Focus, 50m Deep Study, 5m Short Break, 15m Long Break).',
      'Select ambient audio: Coffee Shop, Rainstorm, Gentle Forest, White Noise, or 432Hz Alpha Waves.',
      'Adjust audio volume independently from your system sound.',
    ],
    proTips: [
      'Pair 432Hz Alpha Waves with flashcard review to boost long-term memory encoding.',
      'The timer keeps running in the background while you study across different subjects.',
    ],
    actionLabel: 'Next: Deadlines & Tasks',
  },
  {
    id: 'deadlines',
    category: 'Productivity',
    title: 'Deadlines & Course Planning',
    subtitle: 'Never miss an exam or assignment',
    badge: 'Step 9: Tasks',
    icon: Calendar,
    accentColor: 'from-amber-600 to-rose-600',
    bgGradient: 'from-amber-50/70 via-rose-50/40 to-paper-50',
    description:
      'Track assignment due dates, quiz dates, and midterm milestones across all your courses in a unified priority timeline.',
    howToUse: [
      'Click "+ Add Deadline" from your Semester Dashboard or Subject tab.',
      'Set title, due date, course tag, priority, and optional reminder notes.',
      'View upcoming tasks sorted by urgency: Overdue, Today, This Week, and Upcoming.',
      'Check off items as completed to keep your streak alive.',
    ],
    proTips: [
      'Export deadlines directly to your personal calendar or download a structured printable PDF schedule.',
    ],
    actionLabel: 'Finish Tour & Get Started',
  },
];

interface TourModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStepIndex?: number;
  initialTab?: 'walkthrough' | 'all-features';
  onCreateFolder?: () => void;
}

export function DashboardTourModal({
  isOpen,
  onClose,
  initialStepIndex = 0,
  initialTab = 'walkthrough',
  onCreateFolder,
}: TourModalProps) {
  const [activeTab, setActiveTab] = useState<'walkthrough' | 'all-features'>(initialTab);
  const [currentStepIndex, setCurrentStepIndex] = useState(initialStepIndex);
  const [selectedFeatureId, setSelectedFeatureId] = useState<string>(TOUR_STEPS[0].id);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(initialStepIndex);
      setActiveTab(initialTab);
    }
  }, [isOpen, initialStepIndex, initialTab]);

  if (!isOpen) return null;

  const currentStep = TOUR_STEPS[currentStepIndex];
  const IconComponent = currentStep.icon;

  function handleCompleteTour() {
    try {
      localStorage.setItem('estudesk_tour_completed', 'true');
    } catch {}
    onClose();
  }

  function handleNext() {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      handleCompleteTour();
    }
  }

  function handlePrev() {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  }

  const categories = ['All', 'Organization', 'AI & Creation', 'Study & Practice', 'Productivity'];

  const filteredFeatures = TOUR_STEPS.filter((step) => {
    const matchesCategory = selectedCategory === 'All' || step.category === selectedCategory;
    const matchesSearch =
      step.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      step.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      step.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const activeFeatureDetail = TOUR_STEPS.find((s) => s.id === selectedFeatureId) || TOUR_STEPS[0];
  const FeatureDetailIcon = activeFeatureDetail.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-ink-950/60 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl border border-paper-300 shadow-lifted max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-scale-in my-auto">
        
        {/* Top Modal Header */}
        <div className="px-6 py-4 border-b border-paper-200 bg-paper-50/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-accent-600 to-accent-800 flex items-center justify-center shadow-soft text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-lg font-bold text-ink-900">
                  eStudesk Feature Guide & Tour
                </h2>
                <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full bg-accent-100 text-accent-700 font-bold">
                  Interactive Guide
                </span>
              </div>
              <p className="text-xs text-ink-500">
                Learn how to master every tool and build your academic workflow
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab switch */}
            <div className="flex bg-paper-200/70 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setActiveTab('walkthrough')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'walkthrough'
                    ? 'bg-white text-ink-900 shadow-soft'
                    : 'text-ink-600 hover:text-ink-900'
                }`}
              >
                Step-by-Step Tour
              </button>
              <button
                onClick={() => setActiveTab('all-features')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'all-features'
                    ? 'bg-white text-ink-900 shadow-soft'
                    : 'text-ink-600 hover:text-ink-900'
                }`}
              >
                All Feature Manuals
              </button>
            </div>

            <button
              onClick={handleCompleteTour}
              className="p-2 rounded-xl text-ink-400 hover:text-ink-700 hover:bg-paper-200/80 transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab 1: Step-by-Step Tour Walkthrough */}
        {activeTab === 'walkthrough' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-y-auto scrollbar-thin">
            
            {/* Step Progress Bar */}
            <div className="px-6 pt-4 pb-2 bg-paper-50/40 border-b border-paper-100">
              <div className="flex items-center justify-between text-xs text-ink-500 font-medium mb-2">
                <span>
                  Step {currentStepIndex + 1} of {TOUR_STEPS.length}:{' '}
                  <strong className="text-ink-800">{currentStep.title}</strong>
                </span>
                <span className="font-mono text-accent-700 font-bold">
                  {Math.round(((currentStepIndex + 1) / TOUR_STEPS.length) * 100)}% Complete
                </span>
              </div>

              <div className="w-full h-2 bg-paper-200 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-gradient-to-r from-accent-500 via-accent-600 to-indigo-600 transition-all duration-300 rounded-full"
                  style={{ width: `${((currentStepIndex + 1) / TOUR_STEPS.length) * 100}%` }}
                />
              </div>

              {/* Step dots */}
              <div className="flex items-center justify-between gap-1 mt-2.5 overflow-x-auto pb-1">
                {TOUR_STEPS.map((step, idx) => (
                  <button
                    key={step.id}
                    onClick={() => setCurrentStepIndex(idx)}
                    className={`h-1.5 flex-1 min-w-[18px] rounded-full transition-all ${
                      idx === currentStepIndex
                        ? 'bg-accent-600 h-2'
                        : idx < currentStepIndex
                          ? 'bg-accent-300 hover:bg-accent-400'
                          : 'bg-paper-200 hover:bg-paper-300'
                    }`}
                    title={step.title}
                  />
                ))}
              </div>
            </div>

            {/* Main Step Content Area */}
            <div className="p-6 md:p-8 flex-1">
              <div className={`rounded-3xl p-6 bg-gradient-to-br ${currentStep.bgGradient} border border-paper-200 shadow-soft mb-6`}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3.5">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${currentStep.accentColor} text-white flex items-center justify-center shadow-card shrink-0`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-accent-700 font-mono">
                          {currentStep.badge}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/80 text-ink-600 border border-paper-200 font-medium">
                          {currentStep.category}
                        </span>
                      </div>
                      <h3 className="font-serif text-2xl font-bold text-ink-900 mt-0.5">
                        {currentStep.title}
                      </h3>
                    </div>
                  </div>

                  {currentStep.action && (
                    <button
                      onClick={() => {
                        currentStep.action?.();
                        onClose();
                      }}
                      className="px-4 py-2 rounded-xl bg-white border border-paper-300 hover:border-accent-400 text-ink-800 text-xs font-semibold shadow-soft hover:shadow-card transition-all flex items-center gap-1.5 shrink-0"
                    >
                      <Play className="w-3.5 h-3.5 text-accent-600 fill-accent-600" />
                      <span>Try Action Live</span>
                    </button>
                  )}
                </div>

                <p className="text-sm md:text-base text-ink-700 leading-relaxed font-normal">
                  {currentStep.description}
                </p>
              </div>

              {/* Two Column Guide Grid: How to Use & Pro Tips */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
                {/* How to Use Box */}
                <div className="bg-white rounded-2xl border border-paper-200 p-5 shadow-soft">
                  <div className="flex items-center gap-2 text-ink-800 font-serif font-bold text-sm mb-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>How to use this feature:</span>
                  </div>
                  <ul className="space-y-2.5">
                    {currentStep.howToUse.map((instruction, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-ink-600 leading-relaxed">
                        <span className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-700 font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span>{instruction}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Pro Tips Box */}
                <div className="bg-gradient-to-br from-amber-50/50 via-white to-amber-50/20 rounded-2xl border border-amber-200/80 p-5 shadow-soft">
                  <div className="flex items-center gap-2 text-amber-900 font-serif font-bold text-sm mb-3">
                    <Lightbulb className="w-4 h-4 text-amber-600" />
                    <span>Pro-Tips & Best Practices:</span>
                  </div>
                  <ul className="space-y-2.5">
                    {currentStep.proTips.map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-amber-950/80 leading-relaxed">
                        <Zap className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Modal Bottom Footer Navigation */}
            <div className="px-6 py-4 border-t border-paper-200 bg-paper-50/90 flex items-center justify-between mt-auto">
              <button
                onClick={handlePrev}
                disabled={currentStepIndex === 0}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  currentStepIndex === 0
                    ? 'opacity-40 cursor-not-allowed text-ink-400'
                    : 'bg-white border border-paper-300 text-ink-700 hover:bg-paper-100 shadow-soft'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleCompleteTour}
                  className="px-4 py-2.5 text-xs font-medium text-ink-500 hover:text-ink-800 transition-colors"
                >
                  Skip Tour
                </button>

                {currentStep.id === 'welcome' && onCreateFolder && (
                  <button
                    onClick={() => {
                      onClose();
                      onCreateFolder();
                    }}
                    className="px-4 py-2.5 rounded-xl bg-accent-100 hover:bg-accent-200 text-accent-800 text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4 text-accent-700" />
                    <span>Create First Folder</span>
                  </button>
                )}

                <button
                  onClick={handleNext}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent-600 to-accent-700 hover:from-accent-700 hover:to-accent-800 text-white text-xs font-bold shadow-soft hover:shadow-card transition-all flex items-center gap-2"
                >
                  <span>
                    {currentStepIndex === TOUR_STEPS.length - 1 ? 'Finish Tour' : 'Next Step'}
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: All Feature Manuals & Interactive Index */}
        {activeTab === 'all-features' && (
          <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
            {/* Left Sidebar Feature List */}
            <div className="w-full md:w-80 border-r border-paper-200 bg-paper-50/50 flex flex-col p-4 overflow-y-auto scrollbar-thin shrink-0">
              {/* Search Bar */}
              <div className="relative mb-3">
                <Search className="w-4 h-4 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search features..."
                  className="w-full text-xs bg-white border border-paper-300 rounded-xl pl-9 pr-3 py-2 text-ink-800 placeholder:text-ink-400 focus:outline-none focus:border-accent-500 transition-all shadow-sm"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-2 mb-3 scrollbar-none">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
                      selectedCategory === cat
                        ? 'bg-accent-600 text-white shadow-xs'
                        : 'bg-white text-ink-600 border border-paper-200 hover:border-paper-300'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Feature Cards List */}
              <div className="space-y-1.5 flex-1">
                {filteredFeatures.map((step) => {
                  const Icon = step.icon;
                  const isSelected = selectedFeatureId === step.id;
                  return (
                    <button
                      key={step.id}
                      onClick={() => setSelectedFeatureId(step.id)}
                      className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center gap-3 ${
                        isSelected
                          ? 'bg-white border-accent-300 shadow-soft'
                          : 'bg-white/60 border-paper-200 hover:bg-white hover:border-paper-300'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${step.accentColor} text-white flex items-center justify-center shrink-0 shadow-xs`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className={`text-xs font-bold truncate ${isSelected ? 'text-accent-900' : 'text-ink-800'}`}>
                            {step.title}
                          </p>
                          <span className="text-[10px] font-mono text-ink-400 shrink-0">
                            {step.badge.split(':')[0]}
                          </span>
                        </div>
                        <p className="text-[11px] text-ink-500 truncate">{step.subtitle}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Side Detail Pane */}
            <div className="flex-1 p-6 md:p-8 overflow-y-auto scrollbar-thin bg-white flex flex-col">
              <div className={`rounded-3xl p-6 bg-gradient-to-br ${activeFeatureDetail.bgGradient} border border-paper-200 shadow-soft mb-6`}>
                <div className="flex items-center gap-4 mb-3">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${activeFeatureDetail.accentColor} text-white flex items-center justify-center shadow-card shrink-0`}>
                    <FeatureDetailIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-accent-700 font-mono">
                      {activeFeatureDetail.badge} • {activeFeatureDetail.category}
                    </span>
                    <h3 className="font-serif text-2xl font-bold text-ink-900">
                      {activeFeatureDetail.title}
                    </h3>
                  </div>
                </div>
                <p className="text-sm text-ink-700 leading-relaxed font-normal">
                  {activeFeatureDetail.description}
                </p>
              </div>

              {/* Instructions */}
              <div className="space-y-6 flex-1">
                <div>
                  <h4 className="font-serif text-base font-bold text-ink-900 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Step-by-Step Instructions</span>
                  </h4>
                  <div className="space-y-2">
                    {activeFeatureDetail.howToUse.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-paper-50 rounded-xl border border-paper-200/80">
                        <span className="w-5 h-5 rounded-full bg-white text-emerald-700 font-mono text-xs font-bold flex items-center justify-center shadow-xs shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <p className="text-xs text-ink-700 leading-relaxed">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-serif text-base font-bold text-ink-900 mb-3 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-600" />
                    <span>Key Pro-Tips</span>
                  </h4>
                  <div className="space-y-2">
                    {activeFeatureDetail.proTips.map((tip, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-amber-50/50 rounded-xl border border-amber-200/60">
                        <Zap className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-950/80 leading-relaxed">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-6 mt-6 border-t border-paper-200 flex items-center justify-between">
                <button
                  onClick={() => {
                    const stepIdx = TOUR_STEPS.findIndex((s) => s.id === activeFeatureDetail.id);
                    setCurrentStepIndex(stepIdx >= 0 ? stepIdx : 0);
                    setActiveTab('walkthrough');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-accent-700 bg-accent-50 hover:bg-accent-100 transition-colors flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Start Step-by-Step Walkthrough from here</span>
                </button>

                <button
                  onClick={handleCompleteTour}
                  className="px-5 py-2 rounded-xl bg-ink-900 hover:bg-ink-800 text-white text-xs font-semibold transition-all"
                >
                  Got it, close guide
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
