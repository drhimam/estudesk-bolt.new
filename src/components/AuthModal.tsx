import React, { useState } from 'react';
import {
  X,
  GraduationCap,
  Sparkles,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Zap,
} from 'lucide-react';
import { useAppState, closeAuthModal, setCurrentUser, setView, clearAllData } from '@/store/appState';
import { signIn, signUp } from '@/lib/authClient';

export function AuthModal() {
  const { authModalOpen, authMode } = useAppState();
  const [tab, setTab] = useState<'signin' | 'signup'>(authMode || 'signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!authModalOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    if (tab === 'signup' && !name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    setLoading(true);

    try {
      if (tab === 'signup') {
        const res = await signUp.email({
          email: email.trim(),
          password: password,
          name: name.trim(),
        });

        if (res.error) {
          setError(res.error.message || 'Failed to create account. Please try again.');
          setLoading(false);
          return;
        }

        const user = res.data?.user || {
          id: 'user_' + Date.now(),
          name: name.trim(),
          email: email.trim(),
          tier: 'Scholar',
        };

        // Clear local mock/demo data so the new user gets an empty dashboard
        await clearAllData();

        setCurrentUser({
          id: user.id,
          name: user.name || name.trim(),
          email: user.email || email.trim(),
          tier: 'Scholar',
        });

        setSuccess('Account created successfully! Welcome to eStudesk.');
      } else {
        const res = await signIn.email({
          email: email.trim(),
          password: password,
        });

        if (res.error) {
          setError(res.error.message || 'Invalid email or password.');
          setLoading(false);
          return;
        }

        const user = res.data?.user || {
          id: 'user_' + Date.now(),
          name: email.split('@')[0],
          email: email.trim(),
          tier: 'Scholar',
        };

        setCurrentUser({
          id: user.id,
          name: user.name || email.split('@')[0],
          email: user.email || email.trim(),
          tier: 'Scholar',
        });

        setSuccess('Welcome back!');
      }

      setTimeout(() => {
        closeAuthModal();
        setView({ kind: 'home' });
      }, 500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication service error';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function handleDemoLogin() {
    const demoUser = {
      id: 'demo_scholar_01',
      name: 'Alex Vance',
      email: 'alex.scholar@estudesk.app',
      tier: 'Pro Scholar',
    };
    setCurrentUser(demoUser);
    closeAuthModal();
    setView({ kind: 'home' });
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink-900/60 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-md bg-white rounded-3xl border border-paper-300 shadow-lifted overflow-hidden transform animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header gradient banner */}
        <div className="bg-gradient-to-r from-accent-600 via-accent-700 to-indigo-700 px-6 pt-7 pb-6 text-white relative">
          <button
            onClick={closeAuthModal}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-serif text-xl font-bold tracking-tight text-white">eStudesk</span>
                <span className="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded-full bg-white/20 text-amber-200">
                  Cloud
                </span>
              </div>
              <p className="text-xs text-paper-200">Intelligent Academic Desk & Production AI</p>
            </div>
          </div>

          {/* Mode switcher tabs */}
          <div className="flex p-1 bg-black/20 backdrop-blur-md rounded-xl mt-4 border border-white/10">
            <button
              type="button"
              onClick={() => {
                setTab('signin');
                setError(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                tab === 'signin'
                  ? 'bg-white text-accent-700 shadow-sm'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('signup');
                setError(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                tab === 'signup'
                  ? 'bg-white text-accent-700 shadow-sm'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>
        </div>

        {/* Body content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-crimson-50 border border-crimson-200 text-crimson-700 text-xs flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-crimson-600" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-ink-600 mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Dr. Jordan Hayes"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-paper-300 text-sm text-ink-800 placeholder:text-ink-300 focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-100 transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-ink-600 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="scholar@university.edu"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-paper-300 text-sm text-ink-800 placeholder:text-ink-300 focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-100 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-ink-600">Password</label>
                {tab === 'signin' && (
                  <button
                    type="button"
                    onClick={() => alert('Password reset links are configured via production SMTP.')}
                    className="text-xs text-accent-600 hover:text-accent-700 hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-paper-300 text-sm text-ink-800 placeholder:text-ink-300 focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-100 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {tab === 'signin' && (
              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-ink-600">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-accent-600 border-paper-300 focus:ring-accent-500"
                  />
                  <span>Keep me signed in on this device</span>
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-accent-600 to-indigo-600 hover:from-accent-700 hover:to-indigo-700 text-white font-medium text-sm shadow-card hover:shadow-glow transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>{tab === 'signin' ? 'Sign In to eStudesk' : 'Create Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Bypass */}
          <div className="mt-5 pt-5 border-t border-paper-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-ink-400">Want to test without credentials?</span>
            </div>
            <button
              type="button"
              onClick={handleDemoLogin}
              className="w-full py-2 px-3 rounded-xl border border-paper-300 hover:border-amber-300 bg-amber-50/50 hover:bg-amber-50 text-amber-900 text-xs font-semibold flex items-center justify-center gap-2 transition-all group"
            >
              <Zap className="w-3.5 h-3.5 text-amber-600 group-hover:scale-110 transition-transform" />
              <span>Instant Scholar Demo Access (1-Click)</span>
            </button>
          </div>

          <div className="mt-4 text-center">
            <div className="flex items-center justify-center gap-1 text-[11px] text-ink-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Powered by Better Auth & Edge Turso Database</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
