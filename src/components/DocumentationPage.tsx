import React, { useState, useMemo } from 'react';
import {
  GraduationCap,
  BookOpen,
  Brain,
  Sparkles,
  Headphones,
  Layers,
  Database,
  ShieldCheck,
  Zap,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Search,
  Copy,
  Check,
  FileDown,
  FolderTree,
  Calendar,
  Clock,
  HelpCircle,
  Code2,
  Coins,
  Keyboard,
  ExternalLink,
  ArrowLeft,
  Flame,
  Volume2,
  Lock,
  Download,
  Terminal,
} from 'lucide-react';
import { setView, openAuthModal, useAppState } from '@/store/appState';

interface DocSection {
  id: string;
  category: string;
  title: string;
  badge?: string;
  content: React.ReactNode;
}

export function DocumentationPage() {
  const { currentUser, view } = useAppState();
  const initialSection = view.kind === 'docs' && view.section ? view.section : 'quickstart';

  const [activeSectionId, setActiveSectionId] = useState<string>(initialSection);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  function copySnippet(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  // All comprehensive documentation sections
  const docSections: DocSection[] = useMemo(
    () => [
      {
        id: 'quickstart',
        category: 'Getting Started',
        title: 'Quickstart & Workspace Overview',
        badge: 'Core Guide',
        content: (
          <div className="space-y-6 text-ink-800 leading-relaxed">
            <div>
              <h3 className="font-serif text-2xl font-bold text-ink-950 mb-3">
                Welcome to eStudesk
              </h3>
              <p className="text-sm text-ink-600">
                eStudesk is an intelligent academic workspace engineered for university scholars, pre-meds, engineers, and researchers. It unites 10-turn pedagogical AI generation, full LaTeX mathematical typesetting, 3D Leitner flashcards, active-recall quiz testing, and 432Hz ambient focus audio into an offline-first desk.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-paper-100 border border-paper-300">
              <h4 className="font-bold text-sm text-ink-900 mb-2 flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-accent-600" />
                <span>The 4-Tier Academic Hierarchy</span>
              </h4>
              <p className="text-xs text-ink-600 mb-3">
                All study content in eStudesk is organized in an intuitive hierarchical structure:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-white rounded-xl border border-paper-200">
                  <div className="font-bold text-accent-700 font-mono">1. Semesters</div>
                  <p className="text-[11px] text-ink-500 mt-1">e.g. Fall 2026, Spring 2027</p>
                </div>
                <div className="p-3 bg-white rounded-xl border border-paper-200">
                  <div className="font-bold text-accent-700 font-mono">2. Subjects</div>
                  <p className="text-[11px] text-ink-500 mt-1">e.g. Quantum Physics, Organic Chem</p>
                </div>
                <div className="p-3 bg-white rounded-xl border border-paper-200">
                  <div className="font-bold text-accent-700 font-mono">3. Topics / Units</div>
                  <p className="text-[11px] text-ink-500 mt-1">e.g. Wave Mechanics, SN1 Reactions</p>
                </div>
                <div className="p-3 bg-white rounded-xl border border-paper-200">
                  <div className="font-bold text-accent-700 font-mono">4. Materials</div>
                  <p className="text-[11px] text-ink-500 mt-1">Notes, Flashcards, Quizzes, Slides</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-base text-ink-900">3-Step Getting Started Workflow</h4>
              <ol className="space-y-3 text-xs sm:text-sm list-decimal list-inside text-ink-700">
                <li className="p-3 bg-white rounded-xl border border-paper-200">
                  <strong>Create a Semester &amp; Add Your Courses:</strong> Click <em>&ldquo;New Semester&rdquo;</em> in the sidebar. Assign vibrant color codes to each subject (e.g. Emerald for Biology, Amber for History, Rose for Chemistry).
                </li>
                <li className="p-3 bg-white rounded-xl border border-paper-200">
                  <strong>Launch the AI Generation Studio:</strong> Open any topic and click <em>&ldquo;AI Study Studio&rdquo;</em>. Paste your syllabus prompt, upload textbook PDFs, or capture lecture slides using OCR.
                </li>
                <li className="p-3 bg-white rounded-xl border border-paper-200">
                  <strong>Engage Active Recall &amp; 432Hz Soundscape:</strong> Study generated 3D flashcards with Leitner spaced repetition, take 1-by-1 quizzes, and enable ambient alpha wave audio for deep focus.
                </li>
              </ol>
            </div>
          </div>
        ),
      },
      {
        id: 'ai-studio',
        category: 'AI Study Generation',
        title: '10-Turn Pedagogical AI Pipeline & LaTeX',
        badge: 'Pedagogy',
        content: (
          <div className="space-y-6 text-ink-800 leading-relaxed">
            <div>
              <h3 className="font-serif text-2xl font-bold text-ink-950 mb-3">
                10-Turn Pedagogical AI Studio
              </h3>
              <p className="text-sm text-ink-600">
                Unlike generic chatbots that produce disjointed summaries, eStudesk uses a multi-turn pedagogical architecture that constructs rigorous university-level curriculum materials sequentially.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-950 space-y-2">
              <div className="font-bold text-sm flex items-center gap-2">
                <Brain className="w-4 h-4 text-indigo-600" />
                <span>How the 10-Turn Pipeline Works</span>
              </div>
              <ul className="space-y-1.5 list-disc list-inside text-indigo-900">
                <li><strong>Turn 1 - 2:</strong> Core Axioms, Theoretical Definitions &amp; Foundational Concepts</li>
                <li><strong>Turn 3 - 4:</strong> Step-by-Step Worked Mathematical Derivations with KaTeX formatting</li>
                <li><strong>Turn 5 - 6:</strong> Common Misconceptions, Edge Cases, and Comparative Analysis</li>
                <li><strong>Turn 7 - 8:</strong> 10 Spaced Repetition 3D Flashcards with Leitner metadata</li>
                <li><strong>Turn 9 - 10:</strong> Interactive Active-Recall Quiz with detailed pedagogical explanations</li>
              </ul>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-ink-900 flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-accent-600" />
                  <span>Sample LaTeX Equation Formatting</span>
                </h4>
                <button
                  onClick={() =>
                    copySnippet(
                      '\\hat{H}\\psi = E\\psi \\quad \\implies \\quad \\left( -\\frac{\\hbar^2}{2m} \\nabla^2 + V(\\mathbf{r}) \\right) \\psi(\\mathbf{r}) = E\\psi(\\mathbf{r})',
                      'latex-sample'
                    )
                  }
                  className="text-xs text-accent-700 hover:text-accent-800 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  {copiedCode === 'latex-sample' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode === 'latex-sample' ? 'Copied' : 'Copy LaTeX'}</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-ink-950 text-paper-200 font-mono text-xs overflow-x-auto">
                <code>{`\\hat{H}\\psi = E\\psi \\quad \\implies \\quad \\left( -\\frac{\\hbar^2}{2m} \\nabla^2 + V(\\mathbf{r}) \\right) \\psi(\\mathbf{r}) = E\\psi(\\mathbf{r})`}</code>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-white border border-paper-300">
                <div className="font-bold text-ink-900 mb-1">Inline Math Support</div>
                <p className="text-ink-500">
                  Wrap math in single dollar signs: <code>{'$E = mc^2$'}</code> or <code>{'$\\lambda = \\frac{h}{p}$'}</code>.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-white border border-paper-300">
                <div className="font-bold text-ink-900 mb-1">Display Equation Blocks</div>
                <p className="text-ink-500">
                  Wrap in double dollar signs <code>{'$$ \\int_a^b f(x) dx $$'}</code> for centered derivation steps.
                </p>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: 'study-suite',
        category: 'Interactive Study Suite',
        title: '3D Flashcards, Leitner & Quiz Mastery',
        badge: 'Mastery',
        content: (
          <div className="space-y-6 text-ink-800 leading-relaxed">
            <div>
              <h3 className="font-serif text-2xl font-bold text-ink-950 mb-3">
                Active Recall &amp; Leitner Spaced Repetition
              </h3>
              <p className="text-sm text-ink-600">
                eStudesk incorporates the scientifically validated Leitner 5-box spaced repetition system to optimize memory consolidation and eliminate cramming.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-paper-300 shadow-soft">
                <div className="w-10 h-10 rounded-xl bg-accent-100 text-accent-700 flex items-center justify-center mb-3">
                  <Layers className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-base text-ink-900 mb-1">Interactive 3D Flashcards</h4>
                <p className="text-xs text-ink-600 leading-relaxed mb-3">
                  Features realistic 3D flipping, bidirectional question testing (Question &rarr; Answer or Answer &rarr; Question), mastery badges, and Leitner box promotion.
                </p>
                <div className="text-[11px] font-mono text-accent-700 bg-accent-50 p-2 rounded-lg">
                  Box 1 (Daily) &rarr; Box 3 (Every 3 Days) &rarr; Box 5 (Mastered)
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-paper-300 shadow-soft">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-base text-ink-900 mb-1">1-by-1 Interactive Quiz Tester</h4>
                <p className="text-xs text-ink-600 leading-relaxed mb-3">
                  Step-by-step multiple choice, true/false, and conceptual questions with instant rationale, formula breakdowns, and score reporting.
                </p>
                <div className="text-[11px] font-mono text-emerald-700 bg-emerald-50 p-2 rounded-lg">
                  Instant Feedback • Rationale Breakdown • Retake Missed
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-paper-100 border border-paper-300">
              <h4 className="font-bold text-sm text-ink-900 mb-2 flex items-center gap-2">
                <FileDown className="w-4 h-4 text-accent-600" />
                <span>Executive PDF Typesetting &amp; Export</span>
              </h4>
              <p className="text-xs text-ink-600 leading-relaxed">
                Every study note, formula cheatsheet, flashcard deck, and quiz can be exported into an official, beautifully typeset academic PDF with table of contents, LaTeX equations, and custom header metadata.
              </p>
            </div>
          </div>
        ),
      },
      {
        id: 'ambient-audio',
        category: 'Focus & Soundscapes',
        title: '432Hz Ambient Synthesizer & Focus Timer',
        badge: 'Audio Engine',
        content: (
          <div className="space-y-6 text-ink-800 leading-relaxed">
            <div>
              <h3 className="font-serif text-2xl font-bold text-ink-950 mb-3">
                432Hz Binaural Focus &amp; Web Audio Engine
              </h3>
              <p className="text-sm text-ink-600">
                Built-in real-time Web Audio API procedural sound synthesizer for zero-distraction focus sessions, eliminating the need for third-party music apps.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-white border border-paper-300">
                <div className="font-bold text-ink-900 flex items-center gap-2 mb-1">
                  <span>🧠 Alpha Waves 432Hz Drone</span>
                </div>
                <p className="text-ink-500">
                  Generates 432Hz carrier tone with 10Hz binaural beats to stimulate alpha brainwave states associated with relaxed, alert concentration.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-paper-300">
                <div className="font-bold text-ink-900 flex items-center gap-2 mb-1">
                  <span>🪈 Melodious Flute Meditation</span>
                </div>
                <p className="text-ink-500">
                  Procedural pentatonic Japanese Shakuhachi / Bansuri woodwind harmonics synthesized through dynamic FM-modulated filters.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-paper-300">
                <div className="font-bold text-ink-900 flex items-center gap-2 mb-1">
                  <span>🐦 Forest Morning Birds</span>
                </div>
                <p className="text-ink-500">
                  Randomized organic frequency sweeps simulating realistic chirps and gentle woodland breezes.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-paper-300">
                <div className="font-bold text-ink-900 flex items-center gap-2 mb-1">
                  <span>🌧️ Gentle Rain &amp; Breeze</span>
                </div>
                <p className="text-ink-500">
                  Pink noise buffer with dual-pole resonant low-pass filter for steady, soothing acoustic isolation.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-3">
              <Clock className="w-5 h-5 text-emerald-700 shrink-0" />
              <div>
                <strong>Integrated Focus Timer:</strong> Combine 25-minute Pomodoro or 50-minute Deep Work blocks with ambient soundscapes and auto-pause alerts.
              </div>
            </div>
          </div>
        ),
      },
      {
        id: 'billing-credits',
        category: 'Billing & AI Credits',
        title: 'Credit Allocation, Plans & Invoices',
        badge: 'Account',
        content: (
          <div className="space-y-6 text-ink-800 leading-relaxed">
            <div>
              <h3 className="font-serif text-2xl font-bold text-ink-950 mb-3">
                AI Generation Credits &amp; Student Subscriptions
              </h3>
              <p className="text-sm text-ink-600">
                Transparent credit usage and affordable semester billing designed specifically for students and academic budgets.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-5 rounded-2xl bg-white border border-paper-300 flex flex-col justify-between">
                <div>
                  <div className="font-serif text-lg font-bold text-ink-900">Free Scholar</div>
                  <div className="font-serif text-2xl font-bold text-ink-950 my-2">$0</div>
                  <p className="text-ink-500 mb-3">Starter desk with offline local sync.</p>
                  <div className="font-semibold text-accent-700 mb-2">100 Initial Credits</div>
                  <ul className="space-y-1.5 text-ink-600">
                    <li>• Basic Study Notes</li>
                    <li>• 3D Flashcards</li>
                    <li>• 432Hz Soundscapes</li>
                    <li>• Offline Local Storage</li>
                  </ul>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-indigo-300 flex flex-col justify-between shadow-soft">
                <div>
                  <div className="font-serif text-lg font-bold text-ink-900">Pro Monthly</div>
                  <div className="font-serif text-2xl font-bold text-indigo-700 my-2">$9.99<span className="text-xs text-ink-500">/mo</span></div>
                  <p className="text-ink-500 mb-3">Full monthly power, cancel anytime.</p>
                  <div className="font-semibold text-indigo-700 mb-2">1,000 Credits / month</div>
                  <ul className="space-y-1.5 text-ink-600">
                    <li>• All 7 Study Formats</li>
                    <li>• Multi-Modal OCR Capture</li>
                    <li>• 24h Deadline Alerts</li>
                    <li>• Priority Model Router</li>
                  </ul>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-gradient-to-b from-white to-emerald-50/50 border-2 border-emerald-500 flex flex-col justify-between shadow-card">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="font-serif text-lg font-bold text-ink-900">Pro Semester</div>
                    <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">25% OFF</span>
                  </div>
                  <div className="font-serif text-2xl font-bold text-emerald-800 my-2">$29.99<span className="text-xs text-ink-500">/4 mo</span></div>
                  <p className="text-ink-500 mb-3">Only $7.49/mo for full 4 months.</p>
                  <div className="font-semibold text-emerald-800 mb-2">1,000 Credits renewed monthly</div>
                  <ul className="space-y-1.5 text-ink-600">
                    <li>• Full Midterm &amp; Final Coverage</li>
                    <li>• Unlimited OCR Extractions</li>
                    <li>• Priority 24/7 Support</li>
                    <li>• Official Expense Invoices</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-paper-100 border border-paper-300">
              <h4 className="font-bold text-sm text-ink-900 mb-2 flex items-center gap-2">
                <FileDown className="w-4 h-4 text-emerald-600" />
                <span>Official PDF Expense Invoices &amp; University Reimbursements</span>
              </h4>
              <p className="text-xs text-ink-600 leading-relaxed">
                All subscriptions automatically generate verifiable, print-ready PDF tax invoices with line-item breakdowns, transaction identifiers, and academic receipt numbers for university department reimbursements.
              </p>
            </div>
          </div>
        ),
      },
      {
        id: 'privacy-security',
        category: 'Data & Security',
        title: 'Offline-First Storage & Cryptography',
        badge: 'Security',
        content: (
          <div className="space-y-6 text-ink-800 leading-relaxed">
            <div>
              <h3 className="font-serif text-2xl font-bold text-ink-950 mb-3">
                Offline-First Data Storage &amp; Cryptographic Security
              </h3>
              <p className="text-sm text-ink-600">
                eStudesk is engineered with an offline-first foundation. Your research, notes, and progress are stored locally on your device and asynchronously synchronized with encrypted cloud clusters.
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-white border border-paper-300 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <strong className="text-ink-900 text-sm block mb-0.5">Scrypt Cryptographic Password Hashing</strong>
                  <p className="text-ink-600">
                    User credentials use memory-hard Scrypt password key derivation functions to prevent brute-force attacks and credential exposure.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white border border-paper-300 flex items-start gap-3">
                <Database className="w-5 h-5 text-accent-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <strong className="text-ink-900 text-sm block mb-0.5">Zero Third-Party Ad Trackers</strong>
                  <p className="text-ink-600">
                    eStudesk operates with zero behavioral advertising trackers or invasive telemetry scripts. Your study materials remain private to you.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white border border-paper-300 flex items-start gap-3">
                <Download className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <strong className="text-ink-900 text-sm block mb-0.5">GDPR Compliant 1-Click JSON Data Export</strong>
                  <p className="text-ink-600">
                    Export your complete academic portfolio (all semesters, subjects, study notes, flashcards, and quizzes) into an interoperable JSON bundle anytime from Account Settings.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: 'keyboard-shortcuts',
        category: 'Productivity',
        title: 'Keyboard Shortcuts Reference',
        badge: 'Shortcuts',
        content: (
          <div className="space-y-6 text-ink-800 leading-relaxed">
            <div>
              <h3 className="font-serif text-2xl font-bold text-ink-950 mb-3">
                Keyboard Shortcuts &amp; Power Navigation
              </h3>
              <p className="text-sm text-ink-600">
                Speed through flashcards, quiz tests, and workspace navigation without taking your hands off the keyboard.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse bg-white rounded-2xl border border-paper-300 overflow-hidden shadow-soft">
                <thead>
                  <tr className="bg-paper-100 border-b border-paper-300 text-ink-900 font-mono">
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Keybinding</th>
                    <th className="py-3 px-4">Context</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-paper-200 text-ink-700 font-sans">
                  <tr>
                    <td className="py-3 px-4 font-semibold">Global Search</td>
                    <td className="py-3 px-4 font-mono"><kbd className="bg-paper-200 px-2 py-0.5 rounded border border-paper-300">Ctrl + K</kbd> or <kbd className="bg-paper-200 px-2 py-0.5 rounded border border-paper-300">⌘ + K</kbd></td>
                    <td className="py-3 px-4 text-ink-500">Everywhere</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold">Flip 3D Flashcard</td>
                    <td className="py-3 px-4 font-mono"><kbd className="bg-paper-200 px-2 py-0.5 rounded border border-paper-300">Space</kbd></td>
                    <td className="py-3 px-4 text-ink-500">Flashcard Review</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold">Next Flashcard / Question</td>
                    <td className="py-3 px-4 font-mono"><kbd className="bg-paper-200 px-2 py-0.5 rounded border border-paper-300">&rarr; Right Arrow</kbd></td>
                    <td className="py-3 px-4 text-ink-500">Flashcard / Quiz</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold">Previous Flashcard</td>
                    <td className="py-3 px-4 font-mono"><kbd className="bg-paper-200 px-2 py-0.5 rounded border border-paper-300">&larr; Left Arrow</kbd></td>
                    <td className="py-3 px-4 text-ink-500">Flashcard Review</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold">Select Quiz Option A, B, C, D</td>
                    <td className="py-3 px-4 font-mono"><kbd className="bg-paper-200 px-2 py-0.5 rounded border border-paper-300">1</kbd>, <kbd className="bg-paper-200 px-2 py-0.5 rounded border border-paper-300">2</kbd>, <kbd className="bg-paper-200 px-2 py-0.5 rounded border border-paper-300">3</kbd>, <kbd className="bg-paper-200 px-2 py-0.5 rounded border border-paper-300">4</kbd></td>
                    <td className="py-3 px-4 text-ink-500">Quiz Tester</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold">Toggle AI Studio Panel</td>
                    <td className="py-3 px-4 font-mono"><kbd className="bg-paper-200 px-2 py-0.5 rounded border border-paper-300">Ctrl + Shift + A</kbd></td>
                    <td className="py-3 px-4 text-ink-500">Topic Workspace</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold">Export Material to PDF</td>
                    <td className="py-3 px-4 font-mono"><kbd className="bg-paper-200 px-2 py-0.5 rounded border border-paper-300">Ctrl + P</kbd></td>
                    <td className="py-3 px-4 text-ink-500">Material Viewer</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ),
      },
    ],
    [copiedCode]
  );

  // Filter sections by search query
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return docSections;
    const q = searchQuery.toLowerCase();
    return docSections.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q)
    );
  }, [docSections, searchQuery]);

  const activeDoc = useMemo(() => {
    return docSections.find((s) => s.id === activeSectionId) || docSections[0];
  }, [docSections, activeSectionId]);

  return (
    <div className="min-h-screen bg-paper-50 text-ink-900 flex flex-col font-sans selection:bg-accent-100 selection:text-accent-900">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-paper-50/90 border-b border-paper-200 shadow-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => (currentUser ? setView({ kind: 'home' }) : setView({ kind: 'landing' }))}
              className="p-2 rounded-xl hover:bg-paper-200/80 text-ink-700 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4 text-accent-600" />
              <span>{currentUser ? 'Dashboard' : 'Landing Page'}</span>
            </button>
            <div className="h-4 w-px bg-paper-300 hidden sm:block" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent-600 to-accent-800 flex items-center justify-center text-white shadow-soft">
                <GraduationCap className="w-4 h-4" />
              </div>
              <span className="font-serif font-bold text-ink-950 text-base">eStudesk Docs</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent-100 text-accent-800 font-semibold">
                v2.0
              </span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md hidden sm:block relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              placeholder="Search documentation & guides..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 rounded-xl border border-paper-300 bg-white text-xs text-ink-900 focus:outline-none focus:border-accent-500 shadow-inner-soft"
            />
          </div>

          <div className="flex items-center gap-2">
            {currentUser ? (
              <button
                onClick={() => setView({ kind: 'home' })}
                className="px-4 py-2 text-xs font-bold text-white bg-accent-600 hover:bg-accent-700 rounded-xl shadow-soft transition-all flex items-center gap-1"
              >
                <span>Go to Desk</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => openAuthModal('signup')}
                className="px-4 py-2 text-xs font-bold text-white bg-accent-600 hover:bg-accent-700 rounded-xl shadow-soft transition-all flex items-center gap-1"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Documentation Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col lg:flex-row gap-8">
        {/* Sidebar Table of Contents */}
        <aside className="w-full lg:w-72 shrink-0 space-y-6">
          <div className="bg-white rounded-2xl border border-paper-300 p-4 shadow-soft">
            <div className="text-xs font-bold font-mono text-ink-400 uppercase tracking-wider mb-3 px-2">
              Documentation Chapters
            </div>
            <nav className="space-y-1">
              {filteredSections.map((sec) => {
                const isActive = sec.id === activeDoc.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => {
                      setActiveSectionId(sec.id);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs flex items-center justify-between transition-all cursor-pointer ${
                      isActive
                        ? 'bg-accent-50 text-accent-900 font-bold border border-accent-200 shadow-soft'
                        : 'text-ink-700 hover:bg-paper-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <BookOpen className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-accent-600' : 'text-ink-400'}`} />
                      <span className="truncate">{sec.title}</span>
                    </div>
                    {sec.badge && (
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-semibold shrink-0 ${
                        isActive ? 'bg-accent-200/80 text-accent-900' : 'bg-paper-200 text-ink-500'
                      }`}>
                        {sec.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-4 rounded-2xl bg-[#0f1713] text-slate-100 border border-[#1f3529] text-xs space-y-3 shadow-card">
            <div className="flex items-center gap-2 text-emerald-400 font-bold font-mono">
              <Headphones className="w-4 h-4" />
              <span>Need Scholar Support?</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Have questions or request new academic features? Our student team is ready to help.
            </p>
            <a
              href="mailto:info@estudesk.com"
              className="inline-block px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold transition-colors shadow-soft"
            >
              info@estudesk.com
            </a>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 min-w-0 bg-white rounded-3xl border border-paper-300 p-6 sm:p-10 shadow-card">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-ink-400 font-mono mb-4 pb-4 border-b border-paper-200">
            <span>Docs</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-accent-700 font-semibold">{activeDoc.category}</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-ink-700 font-semibold truncate">{activeDoc.title}</span>
          </div>

          {/* Section Content */}
          <article className="animate-fade-in">
            {activeDoc.content}
          </article>

          {/* Bottom Navigation Pagination */}
          <div className="mt-12 pt-6 border-t border-paper-200 flex items-center justify-between gap-4">
            {(() => {
              const currentIndex = docSections.findIndex((s) => s.id === activeDoc.id);
              const prev = docSections[currentIndex - 1];
              const next = docSections[currentIndex + 1];

              return (
                <>
                  {prev ? (
                    <button
                      onClick={() => {
                        setActiveSectionId(prev.id);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="px-4 py-2 rounded-xl border border-paper-300 text-xs font-semibold text-ink-700 hover:bg-paper-50 transition-all flex items-center gap-1.5"
                    >
                      <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                      <span>{prev.title}</span>
                    </button>
                  ) : <div />}

                  {next ? (
                    <button
                      onClick={() => {
                        setActiveSectionId(next.id);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="px-4 py-2 rounded-xl bg-accent-50 border border-accent-200 text-xs font-bold text-accent-900 hover:bg-accent-100 transition-all flex items-center gap-1.5"
                    >
                      <span>{next.title}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  ) : <div />}
                </>
              );
            })()}
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-[#0f1713] text-slate-100 border-t border-[#1f3529] py-8 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400">
          <div className="flex items-center gap-2 text-slate-300">
            <GraduationCap className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-white">eStudesk Documentation Center</span>
            <span>•</span>
            <span>© 2026 eStudesk Platform</span>
          </div>

          <div className="flex items-center gap-6 text-slate-300">
            <button
              onClick={() => setView({ kind: 'landing' })}
              className="hover:text-emerald-300 transition-colors"
            >
              Landing Page
            </button>
            <a href="mailto:info@estudesk.com" className="hover:text-emerald-300 transition-colors">
              info@estudesk.com
            </a>
            <a
              href="https://github.com/drhimam/estudesk-bolt.new"
              target="_blank"
              rel="noreferrer"
              className="hover:text-emerald-300 transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
