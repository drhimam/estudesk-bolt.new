import React, { useState, useEffect } from 'react';
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
  LogIn,
  UserPlus,
  Coins,
  Check,
  Flame,
  Mail,
  Github,
  Play,
  Square,
  Music,
  HelpCircle,
  ChevronDown,
  BarChart3,
  Activity,
  Clock,
} from 'lucide-react';
import { openAuthModal, setView, useAppState } from '@/store/appState';
import { ambientAudio, type AmbientSoundType } from '@/utils/ambientAudio';

export function LandingPage() {
  const { currentUser } = useAppState();

  // Interactive mini-demo state on the landing page
  const [activeTab, setActiveTab] = useState<'flashcard' | 'quiz' | 'ai' | 'audio'>('flashcard');
  const [flipped, setFlipped] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Dynamic Ambient Audio Test State
  const [ambientSound, setAmbientSound] = useState<AmbientSoundType>('alpha');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Dynamic Pricing Billing Toggle
  const [pricingCycle, setPricingCycle] = useState<'monthly' | 'semester'>('semester');

  // Dynamic FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Handle live audio player preview toggle
  function handleToggleAudio(soundType: AmbientSoundType = ambientSound) {
    if (isPlayingAudio && ambientAudio.getCurrentType() === soundType) {
      ambientAudio.stop();
      setIsPlayingAudio(false);
    } else {
      ambientAudio.play(soundType, 0.4);
      setAmbientSound(soundType);
      setIsPlayingAudio(true);
    }
  }

  // Cleanup audio if component unmounts or user navigates
  useEffect(() => {
    return () => {
      ambientAudio.stop();
    };
  }, []);

  function handleProtectedAction(preferredMode: 'signin' | 'signup' = 'signin') {
    if (currentUser) {
      setView({ kind: 'home' });
    } else {
      openAuthModal(preferredMode);
    }
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
            <a href="#pricing" className="hover:text-accent-600 transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-accent-600 transition-colors">FAQ</a>
            <button
              onClick={() => setView({ kind: 'docs' })}
              className="hover:text-accent-600 transition-colors cursor-pointer font-medium"
            >
              Docs
            </button>
            <a href="#reviews" className="hover:text-accent-600 transition-colors">Students</a>
          </nav>

          <div className="flex items-center gap-3">
            {currentUser ? (
              <button
                onClick={() => setView({ kind: 'home' })}
                className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-accent-600 to-accent-700 hover:from-accent-700 hover:to-accent-800 rounded-xl shadow-soft hover:shadow-card transition-all flex items-center gap-1.5"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => openAuthModal('signin')}
                  className="px-4 py-2 text-sm font-medium text-ink-700 hover:text-accent-600 hover:bg-paper-200/60 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <LogIn className="w-4 h-4 text-accent-600" />
                  <span>Sign In</span>
                </button>
                <button
                  onClick={() => openAuthModal('signup')}
                  className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-accent-600 to-accent-700 hover:from-accent-700 hover:to-accent-800 rounded-xl shadow-soft hover:shadow-card transition-all flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Sign Up</span>
                </button>
              </>
            )}
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
              <span>Multi-Agent AI Studio &amp; Real-Time Cloud Sync Active</span>
            </div>
            
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-ink-950 leading-[1.15]">
              Master Any Subject with an <span className="text-accent-600 underline decoration-accent-300 decoration-wavy decoration-2">Intelligent</span> Academic Desk.
            </h1>
            
            <p className="mt-6 text-lg sm:text-xl text-ink-600 leading-relaxed max-w-2xl mx-auto">
              Automated 10-turn pedagogical generation, LaTeX equations, interactive 3D flashcards, step-by-step quiz mastery, 432Hz ambient soundscapes, and executive PDF exports.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              {currentUser ? (
                <button
                  onClick={() => setView({ kind: 'home' })}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-accent-600 via-accent-700 to-indigo-700 text-white font-semibold text-base shadow-card hover:shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Go to Your Dashboard</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              ) : (
                <>
                  <button
                    onClick={() => openAuthModal('signup')}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-accent-600 via-accent-700 to-indigo-700 text-white font-semibold text-base shadow-card hover:shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <UserPlus className="w-5 h-5" />
                    <span>Get Started Free (Sign Up)</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => openAuthModal('signin')}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-white border border-paper-300 hover:border-accent-300 text-ink-800 font-semibold text-base shadow-soft hover:shadow-card hover:bg-paper-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <LogIn className="w-4 h-4 text-accent-600" />
                    <span>Sign In to Account</span>
                  </button>
                </>
              )}
            </div>

            <div className="mt-8 flex items-center justify-center gap-6 text-xs text-ink-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Zero configuration needed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-accent-600" />
                <span>Offline-first local cache</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Database className="w-4 h-4 text-indigo-600" />
                <span>eStudesk Cloud Database</span>
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
                <button
                  onClick={() => setActiveTab('audio')}
                  className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                    activeTab === 'audio' ? 'bg-white text-accent-700 shadow-sm font-semibold' : 'text-ink-500 hover:text-ink-800'
                  }`}
                >
                  <Headphones className="w-3.5 h-3.5 text-accent-600" />
                  <span>432Hz Soundscape</span>
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
                        className="px-4 py-2 rounded-xl bg-accent-600 hover:bg-accent-700 text-white text-xs font-semibold shadow-sm disabled:opacity-50 transition-all cursor-pointer"
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
                        <p className="text-[11px] text-ink-400">Advanced pedagogical AI engine with LaTeX math rendering</p>
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
                        onClick={() => handleProtectedAction('signup')}
                        className="text-xs font-semibold text-accent-600 hover:text-accent-700 flex items-center gap-1 cursor-pointer"
                      >
                        <span>Open AI Generation Studio</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'audio' && (
                <div className="w-full max-w-lg">
                  <div className="bg-white rounded-2xl border border-paper-300 p-6 shadow-card space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-paper-200">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                          <Headphones className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-ink-800">Live 432Hz Ambient Synthesizer</h4>
                          <p className="text-[11px] text-ink-400">Pure Web Audio procedural alpha wave generator</p>
                        </div>
                      </div>

                      {isPlayingAudio && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-mono font-bold border border-emerald-200 animate-pulse">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          PLAYING
                        </span>
                      )}
                    </div>

                    {/* Soundscape Mode Selector */}
                    <div className="grid grid-cols-2 gap-2.5 text-xs">
                      {[
                        { id: 'alpha', label: '🧠 Alpha 432Hz Drone', sub: 'Deep focus binaural' },
                        { id: 'flute', label: '🪈 Melodious Flute', sub: 'Zen meditation notes' },
                        { id: 'birds', label: '🐦 Forest Birds', sub: 'Morning relaxation' },
                        { id: 'rain', label: '🌧️ Gentle Rain', sub: 'Calm alpha breeze' },
                      ].map((snd) => (
                        <button
                          key={snd.id}
                          onClick={() => {
                            setAmbientSound(snd.id as AmbientSoundType);
                            if (isPlayingAudio) {
                              ambientAudio.play(snd.id as AmbientSoundType, 0.4);
                            }
                          }}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            ambientSound === snd.id
                              ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 font-semibold ring-2 ring-emerald-500/20 shadow-soft'
                              : 'border-paper-300 hover:border-paper-400 bg-white text-ink-700'
                          }`}
                        >
                          <div className="text-xs font-semibold">{snd.label}</div>
                          <div className="text-[10px] text-ink-400 mt-0.5">{snd.sub}</div>
                        </button>
                      ))}
                    </div>

                    {/* Interactive Equalizer & Play Button */}
                    <div className="pt-2 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 h-6">
                        {[40, 75, 50, 90, 60, 80, 45, 95].map((h, i) => (
                          <div
                            key={i}
                            className={`w-1 rounded-full bg-emerald-500 transition-all duration-300 ${
                              isPlayingAudio ? 'animate-pulse' : 'opacity-30'
                            }`}
                            style={{
                              height: isPlayingAudio ? `${h}%` : '25%',
                              animationDelay: `${i * 120}ms`,
                            }}
                          />
                        ))}
                      </div>

                      <button
                        onClick={() => handleToggleAudio()}
                        className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-soft transition-all flex items-center gap-2 cursor-pointer ${
                          isPlayingAudio
                            ? 'bg-crimson-600 hover:bg-crimson-700 text-white shadow-lifted'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:scale-105'
                        }`}
                      >
                        {isPlayingAudio ? (
                          <>
                            <Square className="w-3.5 h-3.5 fill-white" />
                            <span>Stop Audio Demo</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-white" />
                            <span>Play Live 432Hz Sound</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Dynamic Interactive Stats Counter Strip */}
          <div className="mt-14 max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            <div className="p-5 rounded-2xl bg-white border border-paper-300 shadow-soft text-center group hover:border-accent-300 hover:shadow-card transition-all">
              <div className="text-2xl sm:text-3xl font-serif font-bold text-accent-700">500,000+</div>
              <div className="text-xs text-ink-600 font-medium mt-1 flex items-center justify-center gap-1">
                <Brain className="w-3.5 h-3.5 text-accent-600" />
                <span>AI Study Notes</span>
              </div>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-paper-300 shadow-soft text-center group hover:border-emerald-300 hover:shadow-card transition-all">
              <div className="text-2xl sm:text-3xl font-serif font-bold text-emerald-700">99.98%</div>
              <div className="text-xs text-ink-600 font-medium mt-1 flex items-center justify-center gap-1">
                <Activity className="w-3.5 h-3.5 text-emerald-600" />
                <span>Cloud Sync Uptime</span>
              </div>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-paper-300 shadow-soft text-center group hover:border-indigo-300 hover:shadow-card transition-all">
              <div className="text-2xl sm:text-3xl font-serif font-bold text-indigo-700">100%</div>
              <div className="text-xs text-ink-600 font-medium mt-1 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>Offline-First Leitner</span>
              </div>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-paper-300 shadow-soft text-center group hover:border-amber-300 hover:shadow-card transition-all">
              <div className="text-2xl sm:text-3xl font-serif font-bold text-amber-700">150+</div>
              <div className="text-xs text-ink-600 font-medium mt-1 flex items-center justify-center gap-1">
                <Globe2 className="w-3.5 h-3.5 text-amber-600" />
                <span>Global Universities</span>
              </div>
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
              <h3 className="font-serif text-xl font-bold text-ink-900 mb-2">Real-Time Edge Cloud Sync</h3>
              <p className="text-sm text-ink-600 leading-relaxed">
                Sub-10ms global real-time cloud replication and local offline cache so your study notes are accessible anywhere, anytime.
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
                  <span>eStudesk High-Availability Cloud Infrastructure</span>
                </div>
                <h2 className="font-serif text-3xl font-bold text-ink-950 mb-4">
                  Built for Speed, Privacy &amp; Infinite Scalability
                </h2>
                <p className="text-sm text-ink-600 leading-relaxed mb-6">
                  eStudesk runs on high-performance global edge nodes, connecting directly to encrypted cloud clusters with enterprise session protection.
                </p>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-sm font-semibold text-ink-800">Edge-Native Routing:</span>
                      <p className="text-xs text-ink-500">Sub-millisecond latency and instant response times across 300+ global data centers.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-sm font-semibold text-ink-800">Enterprise Security:</span>
                      <p className="text-xs text-ink-500">Encrypted token rotation and secure session isolation for ultimate study privacy.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-sm font-semibold text-ink-800">Offline-First Resiliency:</span>
                      <p className="text-xs text-ink-500">All flashcards, quizzes, notes, and timers work 100% offline via local cache.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-ink-950 text-paper-100 rounded-2xl p-6 font-mono text-xs shadow-lifted">
                <div className="flex items-center justify-between pb-3 border-b border-ink-800 text-ink-400 mb-4">
                  <span>cloud-sync-status.log</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    ONLINE
                  </span>
                </div>
                <pre className="text-paper-300 leading-relaxed overflow-x-auto">
{`[estudesk.cloud] Handshake successful (secure TLS 1.3)
[schema.sync] Relational workspace tables active
[auth.security] Session authentication active & verified
[network.edge] Region: Global Edge CDN
[cache.client] Local offline store (synchronized)
[audio.ambient] Web Audio API 432Hz synthesizer ready`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-gradient-to-b from-paper-50 via-white to-paper-50 relative">
        {/* Background ambient lighting */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-gradient-to-r from-emerald-100/40 via-accent-100/30 to-indigo-100/40 blur-3xl rounded-full pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-accent-100 text-accent-800 border border-accent-200 shadow-soft">
              Transparent Student Pricing
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-ink-950 mt-4 tracking-tight">
              Fair, Flexible Academic Plans
            </h2>
            <p className="mt-3.5 text-sm sm:text-base text-ink-600 leading-relaxed">
              Start free with starter AI credits, or unlock unlimited multi-modal generation, OCR extraction, and 24-hour deadline alerts for the full semester.
            </p>

            {/* Dynamic Billing Cycle Selector */}
            <div className="mt-8 flex items-center justify-center">
              <div className="bg-paper-200/90 p-1.5 rounded-2xl flex items-center shadow-inner-soft border border-paper-300">
                <button
                  onClick={() => setPricingCycle('monthly')}
                  className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    pricingCycle === 'monthly'
                      ? 'bg-white text-ink-900 shadow-soft'
                      : 'text-ink-600 hover:text-ink-900'
                  }`}
                >
                  Billed Monthly
                </button>
                <button
                  onClick={() => setPricingCycle('semester')}
                  className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    pricingCycle === 'semester'
                      ? 'bg-emerald-600 text-white shadow-soft'
                      : 'text-ink-600 hover:text-ink-900'
                  }`}
                >
                  <span>Semester (4 Months)</span>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    pricingCycle === 'semester' ? 'bg-amber-400 text-ink-950' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    25% OFF
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {/* PLAN 1: FREE SCHOLAR */}
            <div className="rounded-3xl p-6 sm:p-7 bg-white border border-paper-300 shadow-soft hover:shadow-card hover:border-accent-400 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-serif text-xl font-bold text-ink-900">Free Scholar</h3>
                  <span className="text-[10px] font-mono font-bold text-ink-600 bg-paper-100 px-2 py-0.5 rounded-md uppercase">
                    Starter
                  </span>
                </div>
                <p className="text-xs text-ink-500 min-h-[32px]">
                  Essential study desk with offline local sync and starter AI credits.
                </p>

                <div className="my-5">
                  <div className="flex items-baseline gap-1">
                    <span className="font-serif text-4xl font-bold text-ink-950">$0</span>
                    <span className="text-xs text-ink-500">/ forever</span>
                  </div>
                  <p className="text-[11px] text-ink-400 mt-0.5">No credit card required</p>
                </div>

                <div className="p-3 rounded-2xl bg-accent-50 border border-accent-100 mb-6 flex items-center gap-2">
                  <Coins className="w-4 h-4 text-accent-700 shrink-0" />
                  <span className="text-xs font-semibold text-accent-900">
                    100 Initial AI Credits
                  </span>
                </div>

                <ul className="space-y-3 text-xs text-ink-700 mb-8">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>100 AI generation credits for study notes & summaries</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Interactive 3D Flashcards & 1-by-1 Quiz Tester</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>432Hz ambient alpha wave binaural focus sound generator</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Encrypted offline-first local storage & cloud sync</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Semester & subject hierarchical academic organizer</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => handleProtectedAction('signup')}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold text-ink-800 bg-paper-100 hover:bg-paper-200 border border-paper-300 transition-all cursor-pointer shadow-soft hover:shadow-card text-center"
              >
                {currentUser ? 'Current Active Base' : 'Get Started Free'}
              </button>
            </div>

            {/* PLAN 2: PRO MONTHLY */}
            <div className={`rounded-3xl p-6 sm:p-7 bg-white border transition-all flex flex-col justify-between ${
              pricingCycle === 'monthly'
                ? 'border-indigo-500 ring-4 ring-indigo-500/15 shadow-card scale-[1.02]'
                : 'border-paper-300 shadow-soft hover:shadow-card hover:border-indigo-400'
            }`}>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-serif text-xl font-bold text-ink-900">Pro Monthly</h3>
                  <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md uppercase border border-indigo-200">
                    Flexible
                  </span>
                </div>
                <p className="text-xs text-ink-500 min-h-[32px]">
                  Full monthly AI academic power with priority router and deadline alerts.
                </p>

                <div className="my-5">
                  <div className="flex items-baseline gap-1">
                    <span className="font-serif text-4xl font-bold text-ink-950">$9.99</span>
                    <span className="text-xs text-ink-500">/ month</span>
                  </div>
                  <p className="text-[11px] text-ink-400 mt-0.5">Auto-renewing • Cancel anytime</p>
                </div>

                <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-100 mb-6 flex items-center gap-2">
                  <Coins className="w-4 h-4 text-indigo-700 shrink-0" />
                  <span className="text-xs font-semibold text-indigo-900">
                    1,000 Credits / month
                  </span>
                </div>

                <ul className="space-y-3 text-xs text-ink-700 mb-8">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>1,000 monthly AI credits</strong> for all study formats</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>All 7 study modes (LaTeX Slides, Infographics, Cheatsheets)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Multi-modal OCR lecture &amp; document text extraction</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>24-Hour &amp; 7-Day automated deadline email alerts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Priority AI model queue with zero throttling</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => {
                  if (currentUser) {
                    setView({ kind: 'account', tab: 'subscription' });
                  } else {
                    openAuthModal('signup');
                  }
                }}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all cursor-pointer shadow-soft hover:shadow-card text-center flex items-center justify-center gap-1.5"
              >
                <span>{currentUser ? 'Upgrade in Settings' : 'Start Pro Monthly'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* PLAN 3: PRO SEMESTER (BEST VALUE) */}
            <div className={`relative rounded-3xl p-6 sm:p-7 bg-gradient-to-b from-white to-[#f4f9f6] border-2 transition-all flex flex-col justify-between ${
              pricingCycle === 'semester'
                ? 'border-emerald-500 shadow-glow ring-4 ring-emerald-500/20 scale-[1.03]'
                : 'border-emerald-400/80 shadow-card hover:shadow-glow'
            }`}>
              {/* Top Discount Stamp */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-emerald-600 text-white text-[10px] font-bold px-3.5 py-1 rounded-full shadow-md flex items-center gap-1 uppercase tracking-wider whitespace-nowrap">
                <Flame className="w-3.5 h-3.5 fill-white" />
                <span>SEMESTER SAVER • 25% OFF</span>
              </div>

              <div>
                <div className="flex items-center justify-between mt-2 mb-2">
                  <h3 className="font-serif text-xl font-bold text-ink-900">Pro Semester</h3>
                  <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md uppercase">
                    BEST VALUE
                  </span>
                </div>
                <p className="text-xs text-ink-500 min-h-[32px]">
                  Complete 4-month semester uninterrupted suite for serious scholars.
                </p>

                <div className="my-5">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-ink-400 line-through">$39.99</span>
                    <span className="font-serif text-4xl font-bold text-ink-950">$29.99</span>
                    <span className="text-xs text-ink-500">/ 4 months</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                    Only $7.49 / month (Save $10.00 every semester)
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 mb-6 flex items-center gap-2">
                  <Coins className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span className="text-xs font-semibold text-emerald-900">
                    1,000 Credits / month (4 Months Total)
                  </span>
                </div>

                <ul className="space-y-3 text-xs text-ink-700 mb-8">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Full 4-month coverage</strong> through midterms &amp; finals</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>1,000 monthly credits renewed each billing month</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Unlimited OCR extractions &amp; high-fidelity question sets</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Automated weekly date-wise email agenda digests</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Priority 24/7 student support &amp; LaTeX rendering assistance</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => {
                  if (currentUser) {
                    setView({ kind: 'account', tab: 'subscription' });
                  } else {
                    openAuthModal('signup');
                  }
                }}
                className="w-full py-3.5 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all cursor-pointer shadow-soft hover:shadow-card text-center flex items-center justify-center gap-1.5"
              >
                <span>{currentUser ? 'Switch in Settings' : 'Claim 25% Off Semester'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* PLAN 4: PRO YEARLY (COMING SOON) */}
            <div className="relative rounded-3xl p-6 sm:p-7 bg-[#f6f8f7] border border-paper-300 opacity-85 flex flex-col justify-between">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-700 text-white text-[10px] font-bold px-3 py-0.5 rounded-full shadow-sm uppercase tracking-wider whitespace-nowrap">
                Coming Soon
              </div>

              <div>
                <div className="flex items-center justify-between mt-1 mb-2">
                  <h3 className="font-serif text-xl font-bold text-ink-900">Pro Yearly</h3>
                  <span className="text-[10px] font-mono font-bold text-ink-500 bg-paper-200 px-2 py-0.5 rounded-md uppercase">
                    12 Months
                  </span>
                </div>
                <p className="text-xs text-ink-500 min-h-[32px]">
                  Annual package for full-year thesis, pre-med, and graduate research.
                </p>

                <div className="my-5">
                  <div className="flex items-baseline gap-1">
                    <span className="font-serif text-4xl font-bold text-ink-900">$79.99</span>
                    <span className="text-xs text-ink-500">/ year</span>
                  </div>
                  <p className="text-[11px] text-ink-400 mt-0.5">Only $6.66 / month (Annual savings)</p>
                </div>

                <div className="p-3 rounded-2xl bg-paper-200/80 border border-paper-300 mb-6 flex items-center gap-2">
                  <Coins className="w-4 h-4 text-ink-600 shrink-0" />
                  <span className="text-xs font-semibold text-ink-800">
                    1,000 Credits / mo (12 Months)
                  </span>
                </div>

                <div className="p-4 my-2 rounded-2xl bg-white border border-dashed border-paper-300 text-center">
                  <p className="text-xs font-semibold text-ink-700">Annual Plan in Progress</p>
                  <p className="text-[11px] text-ink-500 mt-1">
                    Includes all 12-month features with dedicated VIP priority support and early access to new AI research models.
                  </p>
                </div>
              </div>

              <button
                disabled
                className="w-full py-3 px-4 rounded-xl text-xs font-semibold bg-paper-200 text-ink-400 cursor-not-allowed text-center"
              >
                Coming Soon
              </button>
            </div>
          </div>

          {/* Trust Guarantees */}
          <div className="mt-14 pt-8 border-t border-paper-200 flex flex-wrap items-center justify-center gap-6 sm:gap-12 text-xs text-ink-500 font-medium">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Safe 256-Bit SSL Encrypted Checkout</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-accent-600" />
              <span>Cancel Anytime in 1-Click from Settings</span>
            </div>
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-600" />
              <span>Instant AI Credit Allocation</span>
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
                &ldquo;The 10-turn AI studio creates flawless LaTeX summary sheets for Quantum Mechanics that I can immediately export to PDF. Saved me hundreds of hours.&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-accent-600 text-white flex items-center justify-center font-bold text-xs">
                  SL
                </div>
                <div>
                  <h4 className="text-xs font-bold text-ink-800">Sarah Lin</h4>
                  <p className="text-[11px] text-ink-400">Physics &amp; Math @ MIT</p>
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
                &ldquo;The 432Hz ambient alpha wave sound generator combined with full-screen focus mode got me through organic chemistry midterms without getting distracted.&rdquo;
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
                &ldquo;The 1-by-1 quiz tester and 3D flashcards made memorizing complex case law and statutes effortless. It&apos;s like having a personal tutor.&rdquo;
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

      {/* Interactive FAQ Section */}
      <section id="faq" className="py-20 bg-paper-100 border-t border-paper-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-accent-100 text-accent-800 border border-accent-200 shadow-soft">
              Got Questions?
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-ink-950 mt-4">
              Frequently Asked Questions
            </h2>
            <p className="mt-3 text-sm text-ink-600">
              Everything you need to know about eStudesk subscriptions, offline study, and AI generation credits.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'How do AI Generation Credits work?',
                a: 'Each AI generation turn (such as generating a comprehensive study summary, 10 interactive flashcards, or a full worked derivation) uses 1-2 credits. Free Scholar accounts get 100 starter credits. Pro plans get 1,000 credits renewed every single month.',
              },
              {
                q: 'Can I study and review my notes offline?',
                a: 'Yes! eStudesk is built offline-first. All your flashcards, notes, quizzes, and focus timers are cached locally in your browser so you can study on trains, flights, or in lecture halls without internet.',
              },
              {
                q: 'What is the Semester Saver plan?',
                a: 'The Pro Semester plan provides 4 full months of continuous Pro coverage through your semester midterms and finals for a one-time charge of $29.99 (25% discount, equivalent to $7.49/month).',
              },
              {
                q: 'Can I cancel or switch my plan anytime?',
                a: 'Absolutely. You can manage or cancel your subscription at any time directly with 1 click from your Account Settings. No lock-ins or cancellation fees.',
              },
              {
                q: 'How does LaTeX mathematical formula export work?',
                a: 'All math equations generated by our pedagogical studio are formatted in standard KaTeX/LaTeX syntax. You can copy the raw LaTeX code with 1-click or export complete formatted PDFs for homework and submissions.',
              },
            ].map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-paper-300 overflow-hidden shadow-soft transition-all"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-paper-50 transition-colors"
                  >
                    <span className="font-semibold text-sm text-ink-900">{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-ink-500 transition-transform duration-200 shrink-0 ${
                        isOpen ? 'rotate-180 text-accent-600' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 text-xs sm:text-sm text-ink-600 leading-relaxed border-t border-paper-100 pt-3 animate-fade-in">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="py-20 bg-gradient-to-br from-accent-700 via-accent-800 to-indigo-950 text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.1),transparent)] pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4 text-white">
            Ready to Accelerate Your Academic Journey?
          </h2>
          <p className="text-base sm:text-lg text-paper-200 max-w-xl mx-auto mb-8 leading-relaxed">
            Join thousands of scholars using eStudesk for smart notes, AI-powered generation, multi-channel deadlines, and distraction-free mastery.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {currentUser ? (
              <button
                onClick={() => setView({ kind: 'home' })}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-white text-ink-900 font-bold text-base shadow-lifted hover:bg-paper-100 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                Open Your Dashboard
              </button>
            ) : (
              <>
                <button
                  onClick={() => openAuthModal('signup')}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-white text-ink-900 font-bold text-base shadow-lifted hover:bg-paper-100 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                >
                  Create Free Account
                </button>
                <button
                  onClick={() => openAuthModal('signin')}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-base backdrop-blur-md transition-all cursor-pointer"
                >
                  Sign In to Desk
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Modern Rich Footer */}
      <footer className="bg-[#0f1713] text-slate-100 border-t border-[#1f3529] pt-16 pb-12 text-sm selection:bg-accent-600 selection:text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-[#1f3529]">
            {/* Col 1: Brand & Identity */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-accent-500 to-emerald-500 flex items-center justify-center text-white shadow-md">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <span className="font-serif text-2xl font-bold text-white tracking-tight">eStudesk</span>
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-600/60 font-semibold">
                  v2.0
                </span>
              </div>
              <p className="text-sm text-slate-300 max-w-sm leading-relaxed">
                The intelligent academic workspace for university scholars, researchers, pre-meds, and engineers. Built for deep focus and AI-assisted mastery.
              </p>
              <div className="flex items-center gap-2 pt-2">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-[#132b20] text-emerald-300 border border-emerald-600/50">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  Global Cloud Sync Active
                </span>
              </div>
            </div>

            {/* Col 2: Academic Suite */}
            <div className="space-y-3.5">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Academic Suite
              </h4>
              <ul className="space-y-2.5 text-sm text-slate-300">
                <li>
                  <button
                    onClick={() => setView({ kind: 'docs', section: 'quickstart' })}
                    className="hover:text-emerald-300 transition-colors flex items-center gap-1.5 text-left cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Documentation &amp; User Guides</span>
                    <span className="text-[9px] font-mono font-bold bg-emerald-950 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-700/60">
                      DOCS
                    </span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setView({ kind: 'docs', section: 'ai-studio' })}
                    className="hover:text-emerald-300 transition-colors text-left cursor-pointer"
                  >
                    10-Turn AI Engine Guide
                  </button>
                </li>
                <li>
                  <a href="#demo" className="hover:text-emerald-300 transition-colors">3D Interactive Flashcards</a>
                </li>
                <li>
                  <a href="#demo" className="hover:text-emerald-300 transition-colors">1-by-1 Quiz Tester</a>
                </li>
                <li>
                  <a href="#features" className="hover:text-emerald-300 transition-colors">432Hz Binaural Focus Timer</a>
                </li>
                <li>
                  <a href="#features" className="hover:text-emerald-300 transition-colors">24h Deadline Alerts</a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-emerald-300 transition-colors">Frequently Asked Questions</a>
                </li>
              </ul>
            </div>

            {/* Col 3: Plans & Pricing */}
            <div className="space-y-3.5">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Plans &amp; Billing
              </h4>
              <ul className="space-y-2.5 text-sm text-slate-300">
                <li>
                  <a href="#pricing" className="hover:text-emerald-300 transition-colors">Free Scholar ($0)</a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-emerald-300 transition-colors">Pro Monthly ($9.99/mo)</a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-emerald-300 transition-colors flex items-center gap-1.5">
                    <span>Pro Semester</span>
                    <span className="text-[10px] font-bold text-amber-300 bg-amber-950 px-1.5 py-0.5 rounded border border-amber-600/60">25% OFF</span>
                  </a>
                </li>
                <li>
                  <button
                    onClick={() => setView({ kind: 'docs', section: 'billing-credits' })}
                    className="hover:text-emerald-300 transition-colors text-left cursor-pointer"
                  >
                    Credit &amp; Invoice Guide
                  </button>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-emerald-300 transition-colors">Encrypted Secure Checkout</a>
                </li>
              </ul>
            </div>

            {/* Col 4: Privacy & Legal */}
            <div className="space-y-3.5">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Privacy &amp; Trust
              </h4>
              <ul className="space-y-2.5 text-sm text-slate-300">
                <li>
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>GDPR Data Portability</span>
                  </span>
                </li>
                <li>
                  <span className="text-slate-300">Scrypt Cryptographic Security</span>
                </li>
                <li>
                  <span className="text-slate-300">Zero Third-Party Trackers</span>
                </li>
                <li>
                  <button
                    onClick={() => setView({ kind: 'docs', section: 'keyboard-shortcuts' })}
                    className="hover:text-emerald-300 transition-colors text-left cursor-pointer flex items-center gap-1"
                  >
                    <span>Keyboard Shortcuts</span>
                  </button>
                </li>
                <li>
                  <a href="mailto:info@estudesk.com" className="hover:text-emerald-300 transition-colors">Contact Support</a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="text-slate-300 font-medium">© 2026 eStudesk Open Academic Platform.</span>
              <span className="hidden sm:inline text-slate-600">•</span>
              <span className="text-slate-400">Made for university scholars worldwide</span>
            </div>

            <div className="flex items-center gap-6 text-slate-300 font-medium">
              <button
                onClick={() => setView({ kind: 'docs' })}
                className="hover:text-emerald-300 transition-colors flex items-center gap-1 cursor-pointer font-semibold text-emerald-400"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Documentation</span>
              </button>
              <a
                href="mailto:info@estudesk.com"
                className="hover:text-emerald-300 transition-colors flex items-center gap-1.5"
              >
                <Mail className="w-4 h-4 text-emerald-400" />
                <span>info@estudesk.com</span>
              </a>
              <a
                href="https://github.com/drhimam/estudesk-bolt.new"
                target="_blank"
                rel="noreferrer"
                className="hover:text-emerald-300 transition-colors flex items-center gap-1.5"
              >
                <Github className="w-4 h-4 text-emerald-400" />
                <span>GitHub</span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
