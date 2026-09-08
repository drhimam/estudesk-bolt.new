import React, { useState } from 'react';
import {
  GraduationCap,
  Sparkles,
  Brain,
  Headphones,
  FileDown,
  Layers,
  Database,
  ShieldCheck,
  Zap,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  Volume2,
  FolderTree,
  ChevronRight,
  RotateCw,
  Code2,
  Globe2,
  Star,
  Users,
  Award,
} from 'lucide-react';
import { openAuthModal, setView, setCurrentUser } from '@/store/appState';

export function LandingPage() {
  // Interactive mini-demo state on the landing page
  const [activeTab, setActiveTab] = useState<'flashcard' | 'quiz' | 'ai' | 'audio'>('flashcard');
  const [flipped, setFlipped] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  function launchAppDirectly() {
    // If not signed in, sign in with demo or go directly to app
    setView({ kind: 'home' });
  }

  function handleAuth(mode: 'signin' | 'signup') {
    openAuthModal(mode);
  }

  return (
    <div className="min-h-screen bg-paper-50 text-ink-900 flex flex-col font-sans selection:bg-accent-100 selection:text-accent-900">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-paper-50/80 border-b border-paper-200/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-accent-600 to-accent-800 flex items-center justify-center shadow-soft text-white">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-serif text-xl font-bold tracking-tight text-ink-900">eStudesk</span>
                <span className="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded-full bg-accent-100 text-accent-700 font-semibold">
                  v2.0
                </span>
              </div>
              <p className="text-[11px] text-ink-400 hidden sm:block">Intelligent Academic Desk</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-ink-600">
            <a href="#features" className="hover:text-accent-600 transition-colors">Features</a>
            <a href="#ai-studio" className="hover:text-accent-600 transition-colors">AI Studio</a>
            <a href="#demo" className="hover:text-accent-600 transition-colors">Live Preview</a>
            <a href="#architecture" className="hover:text-accent-600 transition-colors">Edge Sync</a>
            <a href="#reviews" className="hover:text-accent-600 transition-colors">Students</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleAuth('signin')}
              className="px-4 py-2 text-sm font-medium text-ink-700 hover:text-accent-600 hover:bg-paper-200/60 rounded-xl transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={launchAppDirectly}
              className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-accent-600 to-accent-700 hover:from-accent-700 hover:to-accent-800 rounded-xl shadow-soft hover:shadow-card transition-all flex items-center gap-1.5"
            >
              <span>Launch App</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-28 overflow-hidden">
        {/* Background glow accents */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-accent-300/30 to-amber-200/20 blur-3xl rounded-full pointer-events-none -z-10" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent-50 border border-accent-200/80 text-accent-800 text-xs font-semibold mb-6 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-accent-600" />
              <span>Multi-Agent AI Studio & Turso Edge Sync Active</span>
            </div>
            
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-ink-950 leading-[1.15]">
              Master Any Subject with an <span className="text-accent-600 underline decoration-accent-300 decoration-wavy decoration-2">Intelligent</span> Academic Desk.
            </h1>
            
            <p className="mt-6 text-lg sm:text-xl text-ink-600 leading-relaxed max-w-2xl mx-auto">
              Automated 10-turn pedagogical generation, LaTeX equations, interactive 3D flashcards, step-by-step quiz mastery, 432Hz ambient soundscapes, and executive PDF exports.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => handleAuth('signup')}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-accent-600 via-accent-700 to-indigo-700 text-white font-semibold text-base shadow-card hover:shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={launchAppDirectly}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-white border border-paper-300 hover:border-accent-300 text-ink-800 font-semibold text-base shadow-soft hover:shadow-card hover:bg-paper-50 transition-all flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Explore Live Workspace</span>
              </button>
            </div>

            <div className="mt-8 flex items-center justify-center gap-6 text-xs text-ink-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Zero configuration needed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-accent-600" />
                <span>Offline-first IndexedDB</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Database className="w-4 h-4 text-indigo-600" />
                <span>Turso Cloud Database</span>
              </div>
            </div>
          </div>

          {/* Interactive Hero Widget Preview */}
          <div id="demo" className="relative max-w-4xl mx-auto bg-white rounded-3xl border border-paper-300 shadow-lifted overflow-hidden">
            {/* Window title bar */}
            <div className="px-6 py-4 border-b border-paper-200 bg-paper-100/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-crimson-400/80" />
                <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
                <span className="ml-2 font-mono text-xs text-ink-400 font-medium">eStudesk Interactive Workspace Preview</span>
              </div>

              {/* Demo Tabs */}
              <div className="flex items-center gap-1 bg-paper-200/80 p-1 rounded-xl text-xs font-medium">
                <button
                  onClick={() => setActiveTab('flashcard')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    activeTab === 'flashcard' ? 'bg-white text-accent-700 shadow-sm font-semibold' : 'text-ink-500 hover:text-ink-800'
                  }`}
                >
                  Flashcards 3D
                </button>
                <button
                  onClick={() => setActiveTab('quiz')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    activeTab === 'quiz' ? 'bg-white text-accent-700 shadow-sm font-semibold' : 'text-ink-500 hover:text-ink-800'
                  }`}
                >
                  1-by-1 Quiz
                </button>
                <button
                  onClick={() => setActiveTab('ai')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    activeTab === 'ai' ? 'bg-white text-accent-700 shadow-sm font-semibold' : 'text-ink-500 hover:text-ink-800'
                  }`}
                >
                  AI Studio (10-Turn)
                </button>
              </div>
            </div>

            {/* Widget Body */}
            <div className="p-8 min-h-[380px] flex items-center justify-center bg-paper-50/50">
              {activeTab === 'flashcard' && (
                <div className="w-full max-w-lg text-center">
                  <div
                    onClick={() => setFlipped(!flipped)}
                    className="relative cursor-pointer min-h-[220px] rounded-2xl bg-white border-2 border-dashed border-accent-300 p-8 shadow-card hover:shadow-glow transition-all flex flex-col items-center justify-center group"
                  >
                    <div className="absolute top-3 right-3 flex items-center gap-1 text-[11px] font-mono text-accent-600 bg-accent-50 px-2 py-0.5 rounded-md">
                      <RotateCw className="w-3 h-3 group-hover:rotate-180 transition-transform" />
                      <span>Click to flip card</span>
                    </div>

                    {!flipped ? (
                      <div className="animate-fade-in">
                        <span className="text-xs font-mono font-semibold uppercase text-accent-600 mb-2 block">Linear Algebra • Eigenvalues</span>
                        <h3 className="font-serif text-xl font-bold text-ink-800 mb-3">
                          What is the characteristic equation used to find the eigenvalues of matrix A?
                        </h3>
                        <p className="text-xs text-ink-400">Card 3 of 12 • Mastery level: 85%</p>
                      </div>
                    ) : (
                      <div className="animate-fade-in">
                        <span className="text-xs font-mono font-semibold uppercase text-emerald-600 mb-2 block">Solution & Proof</span>
                        <div className="bg-paper-100 p-3 rounded-xl font-mono text-sm text-ink-800 mb-3">
                          det(A - λI) = 0
                        </div>
                        <p className="text-xs text-ink-600 leading-relaxed">
                          Where <code className="text-accent-600">λ</code> represents the eigenvalues and <code className="text-accent-600">I</code> is the identity matrix of the same dimension as A.
                        </p>
                      </div>
                    )}
                  </div>
                  <p className="mt-4 text-xs text-ink-400">
                    Supports Leitner 5-box spaced repetition algorithm and bidirectional flipping.
                  </p>
                </div>
              )}

              {activeTab === 'quiz' && (
                <div className="w-full max-w-lg">
                  <div className="bg-white rounded-2xl border border-paper-300 p-6 shadow-card">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-mono font-semibold text-accent-600 uppercase bg-accent-50 px-2 py-0.5 rounded">
                        Organic Chemistry • Question 1 of 5
                      </span>
                      <span className="text-xs text-ink-400">Single Choice</span>
                    </div>

                    <h3 className="text-base font-semibold text-ink-900 mb-4">
                      Which mechanism involves a carbocation intermediate and racemization of stereochemistry?
                    </h3>

                    <div className="space-y-2 mb-6">
                      {[
                        { label: 'A', text: 'SN1 (Nucleophilic Substitution Unimolecular)', correct: true },
                        { label: 'B', text: 'SN2 (Nucleophilic Substitution Bimolecular)', correct: false },
                        { label: 'C', text: 'E2 (Elimination Bimolecular)', correct: false },
                      ].map((opt, idx) => {
                        let btnStyle = 'border-paper-300 hover:border-accent-400 bg-white text-ink-700';
                        if (selectedOption === idx) {
                          btnStyle = opt.correct && quizSubmitted
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold'
                            : !opt.correct && quizSubmitted
                            ? 'border-crimson-500 bg-crimson-50 text-crimson-900 font-semibold'
                            : 'border-accent-500 bg-accent-50 text-accent-900 font-semibold';
                        }

                        return (
                          <button
                            key={idx}
                            onClick={() => {
                              setSelectedOption(idx);
                              setQuizSubmitted(false);
                            }}
                            className={`w-full text-left p-3 rounded-xl border text-sm flex items-center gap-3 transition-all ${btnStyle}`}
                          >
                            <span className="w-6 h-6 rounded-lg bg-paper-200 flex items-center justify-center font-mono text-xs font-bold text-ink-600">
                              {opt.label}
                            </span>
                            <span>{opt.text}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-paper-200">
                      <button
                        onClick={() => setQuizSubmitted(true)}
                        disabled={selectedOption === null}
                        className="px-4 py-2 rounded-xl bg-accent-600 hover:bg-accent-700 text-white text-xs font-semibold shadow-sm disabled:opacity-50 transition-all"
                      >
                        Submit Answer
                      </button>
                      {quizSubmitted && (
                        <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Correct! SN1 proceeds via planar carbocation.
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'ai' && (
                <div className="w-full max-w-xl">
                  <div className="bg-white rounded-2xl border border-paper-300 p-6 shadow-card space-y-4">
                    <div className="flex items-center gap-3 pb-3 border-b border-paper-200">
                      <div className="w-8 h-8 rounded-xl bg-accent-100 flex items-center justify-center text-accent-700">
                        <Brain className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-ink-800">10-Turn Pedagogical AI Pipeline</h4>
                        <p className="text-[11px] text-ink-400">DeepSeek / OpenAI / Gemini streaming with LaTeX engine</p>
                      </div>
                    </div>

                    <div className="space-y-3 font-mono text-xs">
                      <div className="p-3 rounded-xl bg-paper-100 text-ink-700">
                        <span className="text-accent-600 font-bold">Turn 1:</span> Mathematical definition & Core Concept
                      </div>
                      <div className="p-3 rounded-xl bg-paper-100 text-ink-700">
                        <span className="text-accent-600 font-bold">Turn 2:</span> Step-by-Step Worked Derivation with LaTeX equations
                      </div>
                      <div className="p-3 rounded-xl bg-paper-100 text-ink-700">
                        <span className="text-accent-600 font-bold">Turn 3:</span> 1-Click Interactive Quiz Deployed to Study Materials
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-end">
                      <button
                        onClick={launchAppDirectly}
                        className="text-xs font-semibold text-accent-600 hover:text-accent-700 flex items-center gap-1"
                      >
                        <span>Open AI Generation Studio</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section id="features" className="py-20 bg-white border-y border-paper-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-ink-950">
              Engineered for Serious Scholars
            </h2>
            <p className="mt-4 text-base text-ink-600">
              Every tool in eStudesk is designed to eliminate cognitive overhead and accelerate retention.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 rounded-3xl bg-paper-50 border border-paper-300 hover:border-accent-300 hover:shadow-card transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-accent-100 text-accent-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Brain className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-ink-900 mb-2">10-Turn AI Generation Studio</h3>
              <p className="text-sm text-ink-600 leading-relaxed">
                Generate high-standard pedagogical study materials, summary notes, formula sheets, interactive flashcards, and quizzes in 10 continuous turns with LaTeX math formatting.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-3xl bg-paper-50 border border-paper-300 hover:border-accent-300 hover:shadow-card transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Headphones className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-ink-900 mb-2">432Hz Ambient Soundscape</h3>
              <p className="text-sm text-ink-600 leading-relaxed">
                Integrated real-time Web Audio synthesizer with Melodious Flute, Forest Birds, 432Hz Binaural Alpha Waves, and Gentle Rain for distraction-free focus sessions.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-3xl bg-paper-50 border border-paper-300 hover:border-accent-300 hover:shadow-card transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-ink-900 mb-2">Interactive 3D Flashcards</h3>
              <p className="text-sm text-ink-600 leading-relaxed">
                Spaced repetition Leitner system with 3D card flips, confidence ratings, bidirectional question testing, and auto-generated mnemonic breakdowns.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-8 rounded-3xl bg-paper-50 border border-paper-300 hover:border-accent-300 hover:shadow-card transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FileDown className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-ink-900 mb-2">Executive PDF Exporter</h3>
              <p className="text-sm text-ink-600 leading-relaxed">
                Export beautifully typeset academic PDFs with official letterhead formatting, table of contents, and 1-click Markdown copy for all AI outputs.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-8 rounded-3xl bg-paper-50 border border-paper-300 hover:border-accent-300 hover:shadow-card transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FolderTree className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-ink-900 mb-2">Multi-Semester Organization</h3>
              <p className="text-sm text-ink-600 leading-relaxed">
                Hierarchical semesters, subjects, topics, and deadlines with custom color tags, pinned folders, and real-time completion tracking.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-8 rounded-3xl bg-paper-50 border border-paper-300 hover:border-accent-300 hover:shadow-card transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Database className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-ink-900 mb-2">Turso Edge libSQL Sync</h3>
              <p className="text-sm text-ink-600 leading-relaxed">
                Sub-10ms global edge replication with Turso database and local Dexie IndexedDB cache so your study notes are accessible anywhere, even offline.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture & Tech Specs */}
      <section id="architecture" className="py-20 bg-paper-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl border border-paper-300 p-8 sm:p-12 shadow-card">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-4">
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Production Cloudflare & Turso Infrastructure</span>
                </div>
                <h2 className="font-serif text-3xl font-bold text-ink-950 mb-4">
                  Built for Speed, Privacy & Infinite Scalability
                </h2>
                <p className="text-sm text-ink-600 leading-relaxed mb-6">
                  eStudesk runs on Cloudflare Workers edge nodes, connecting directly to Turso libSQL SQLite clusters and securing sessions with Better Auth enterprise token rotation.
                </p>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-sm font-semibold text-ink-800">Edge-Native Routing:</span>
                      <p className="text-xs text-ink-500">Hono.js worker with instant sub-millisecond cold starts across 300+ global data centers.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-sm font-semibold text-ink-800">Better Auth Integration:</span>
                      <p className="text-xs text-ink-500">Drizzle SQLite adapter with encrypted passwords and 7-day persistent session tokens.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-sm font-semibold text-ink-800">Offline-First Resiliency:</span>
                      <p className="text-xs text-ink-500">All flashcards, quizzes, notes, and timers work 100% offline via local IndexedDB.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-ink-950 text-paper-100 rounded-2xl p-6 font-mono text-xs shadow-lifted">
                <div className="flex items-center justify-between pb-3 border-b border-ink-800 text-ink-400 mb-4">
                  <span>turso-connection-status.log</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    ONLINE
                  </span>
                </div>
                <pre className="text-paper-300 leading-relaxed overflow-x-auto">
{`[turso.aws-us-east-2] Handshake successful (libsql v0.18)
[schema.sync] 18 relational tables active
[auth.better] SQLite drizzleAdapter loaded
[worker.cloudflare] Region: Global Edge
[dexie.client] IndexedDB: estudesk_v2 (synced)
[audio.ambient] Web Audio API 432Hz synthesizer ready`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof / Student Testimonials */}
      <section id="reviews" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-serif text-3xl font-bold text-ink-950">
              Trusted by Top Students Everywhere
            </h2>
            <p className="mt-3 text-sm text-ink-600">
              Here is how university scholars and researchers use eStudesk daily.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-paper-50 border border-paper-300">
              <div className="flex items-center gap-1 text-amber-500 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-sm text-ink-700 italic mb-4 leading-relaxed">
                "The 10-turn AI studio creates flawless LaTeX summary sheets for Quantum Mechanics that I can immediately export to PDF. Saved me hundreds of hours."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-accent-600 text-white flex items-center justify-center font-bold text-xs">
                  SL
                </div>
                <div>
                  <h4 className="text-xs font-bold text-ink-800">Sarah Lin</h4>
                  <p className="text-[11px] text-ink-400">Physics & Math @ MIT</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-paper-50 border border-paper-300">
              <div className="flex items-center gap-1 text-amber-500 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-sm text-ink-700 italic mb-4 leading-relaxed">
                "The 432Hz ambient alpha wave sound generator combined with full-screen focus mode got me through organic chemistry midterms without getting distracted."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                  DM
                </div>
                <div>
                  <h4 className="text-xs font-bold text-ink-800">David Miller</h4>
                  <p className="text-[11px] text-ink-400">Pre-Med @ Johns Hopkins</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-paper-50 border border-paper-300">
              <div className="flex items-center gap-1 text-amber-500 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-sm text-ink-700 italic mb-4 leading-relaxed">
                "The 1-by-1 quiz tester and 3D flashcards made memorizing complex case law and statutes effortless. It's like having a personal tutor."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                  EP
                </div>
                <div>
                  <h4 className="text-xs font-bold text-ink-800">Elena Patel</h4>
                  <p className="text-[11px] text-ink-400">Law Candidate @ Oxford</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="py-16 bg-gradient-to-br from-accent-700 via-accent-800 to-indigo-900 text-white text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Ready to Accelerate Your Academic Journey?
          </h2>
          <p className="text-base sm:text-lg text-paper-200 max-w-xl mx-auto mb-8">
            Join thousands of scholars using eStudesk for smart notes, AI-powered generation, and distraction-free mastery.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => handleAuth('signup')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-white text-accent-800 font-bold text-base shadow-lifted hover:bg-paper-100 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Create Free Account
            </button>
            <button
              onClick={launchAppDirectly}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-base backdrop-blur-md transition-all"
            >
              Launch Demo Workspace
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-paper-100 border-t border-paper-300 py-12 text-ink-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent-600 to-accent-800 flex items-center justify-center text-white">
              <GraduationCap className="w-4 h-4" />
            </div>
            <span className="font-serif text-base font-bold text-ink-800">eStudesk</span>
            <span className="text-ink-400">© 2026 eStudesk Open Academic Platform</span>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={launchAppDirectly} className="hover:text-accent-600 transition-colors">Launch Workspace</button>
            <button onClick={() => handleAuth('signin')} className="hover:text-accent-600 transition-colors">Sign In</button>
            <button onClick={() => handleAuth('signup')} className="hover:text-accent-600 transition-colors">Create Account</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
