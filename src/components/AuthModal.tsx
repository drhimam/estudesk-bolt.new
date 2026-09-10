import React, { useState, useEffect } from 'react';
import {
  X,
  GraduationCap,
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
  ArrowLeft,
  KeyRound,
  Send,
  RefreshCw,
} from 'lucide-react';
import {
  useAppState,
  closeAuthModal,
  setCurrentUser,
  setView,
  AuthMode,
} from '@/store/appState';
import { signIn, signUp, forgetPassword, resetPassword, sendVerificationEmail } from '@/lib/authClient';

export function AuthModal() {
  const { authModalOpen, authMode, authResetToken, authInitialNotice, authInitialError } = useAppState();
  const [tab, setTab] = useState<AuthMode>(authMode || 'signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [emailSentNotice, setEmailSentNotice] = useState<string | null>(null);
  const [unverifiedEmailError, setUnverifiedEmailError] = useState(false);

  useEffect(() => {
    if (authMode) {
      setTab(authMode);
      setError(authInitialError || null);
      setSuccess(authInitialNotice || null);
      setEmailSentNotice(null);
      setUnverifiedEmailError(false);
    }
  }, [authMode, authModalOpen, authInitialNotice, authInitialError]);

  if (!authModalOpen) return null;

  async function handleResendVerification(targetEmail?: string) {
    const emailToUse = (targetEmail || email).trim();
    if (!emailToUse) {
      setError('Please enter your email address.');
      return;
    }
    setResendingVerification(true);
    setError(null);
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://estudesk.com';
      const res = await sendVerificationEmail({
        email: emailToUse,
        callbackURL: origin,
      });

      if (res.error) {
        setError(res.error.message || 'Failed to resend verification email.');
      } else {
        setEmailSentNotice(
          `A fresh verification link has been sent to ${emailToUse} via Zoho ZeptoMail Canada. Please check your inbox and spam folder.`
        );
        setUnverifiedEmailError(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Verification service error';
      setError(msg);
    } finally {
      setResendingVerification(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setEmailSentNotice(null);
    setUnverifiedEmailError(false);

    // 1. Forgot Password Request Flow
    if (tab === 'forgot_password') {
      if (!email.trim()) {
        setError('Please enter your account email address.');
        return;
      }
      setLoading(true);
      try {
        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://estudesk.com';
        const res = await forgetPassword({
          email: email.trim(),
          redirectTo: `${origin}?action=reset-password`,
        });

        if (res.error) {
          setError(res.error.message || 'Failed to send password reset email. Please try again.');
        } else {
          setEmailSentNotice(
            `Password reset instructions have been sent via Zoho ZeptoMail to ${email.trim()}. Please check your inbox and spam folder.`
          );
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Password reset service error';
        setError(msg);
      } finally {
        setLoading(false);
      }
      return;
    }

    // 2. Set New Password Flow (Reset Password)
    if (tab === 'reset_password') {
      if (!password || !confirmPassword) {
        setError('Please fill in both password fields.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters long.');
        return;
      }
      if (!authResetToken) {
        setError('Invalid or expired reset token. Please request a new password reset link.');
        return;
      }

      setLoading(true);
      try {
        const res = await resetPassword({
          newPassword: password,
          token: authResetToken,
        });

        if (res.error) {
          setError(res.error.message || 'Failed to update password. Token may have expired.');
        } else {
          setSuccess('Your password has been successfully updated! You can now sign in.');
          setTimeout(() => {
            setTab('signin');
            setPassword('');
            setConfirmPassword('');
          }, 1500);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Reset password error';
        setError(msg);
      } finally {
        setLoading(false);
      }
      return;
    }

    // 3. Email Verification Resend Flow
    if (tab === 'verify_email') {
      await handleResendVerification();
      return;
    }

    // 4. Standard Sign In / Sign Up Flow
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

        // Account created! Require email verification before logging in
        setPassword('');
        setConfirmPassword('');
        setTab('verify_email');
        setEmailSentNotice(
          `Account created successfully! We have sent a verification link to ${email.trim()} via Zoho ZeptoMail Canada. Please verify your email to activate your account before signing in.`
        );
      } else {
        const res = await signIn.email({
          email: email.trim(),
          password: password,
        });

        if (res.error) {
          const errMsg = res.error.message || 'Invalid email or password.';
          const isUnverified =
            errMsg.toLowerCase().includes('not verified') ||
            errMsg.toLowerCase().includes('email_not_verified') ||
            errMsg.toLowerCase().includes('verification') ||
            errMsg.toLowerCase().includes('verify');

          if (isUnverified) {
            setUnverifiedEmailError(true);
            setError(
              'Your email address has not been verified yet. Please check your inbox or click below to resend the verification link.'
            );
          } else {
            setError(errMsg);
          }
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
        setTimeout(() => {
          closeAuthModal();
          setView({ kind: 'home' });
        }, 700);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication service error';
      setError(msg);
    } finally {
      setLoading(false);
    }
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
              {tab === 'forgot_password' || tab === 'reset_password' ? (
                <KeyRound className="w-6 h-6 text-white" />
              ) : tab === 'verify_email' ? (
                <Mail className="w-6 h-6 text-white" />
              ) : (
                <GraduationCap className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-serif text-xl font-bold tracking-tight text-white">eStudesk</span>
                <span className="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded-full bg-white/20 text-amber-200">
                  Cloud
                </span>
              </div>
              <p className="text-xs text-paper-200">
                {tab === 'forgot_password'
                  ? 'Password Recovery via ZeptoMail'
                  : tab === 'reset_password'
                    ? 'Set New Account Password'
                    : tab === 'verify_email'
                      ? 'Email Verification Portal'
                      : 'Intelligent Academic Desk & Production AI'}
              </p>
            </div>
          </div>

          {/* Mode switcher tabs (only on signin / signup) */}
          {(tab === 'signin' || tab === 'signup') && (
            <div className="flex p-1 bg-black/20 backdrop-blur-md rounded-xl mt-4 border border-white/10">
              <button
                type="button"
                onClick={() => {
                  setTab('signin');
                  setError(null);
                  setEmailSentNotice(null);
                  setUnverifiedEmailError(false);
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
                  setEmailSentNotice(null);
                  setUnverifiedEmailError(false);
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
          )}

          {/* Subheader banner for recovery views */}
          {(tab === 'forgot_password' || tab === 'reset_password' || tab === 'verify_email') && (
            <div className="mt-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setTab('signin');
                  setError(null);
                  setEmailSentNotice(null);
                  setUnverifiedEmailError(false);
                }}
                className="text-xs text-white/80 hover:text-white flex items-center gap-1 font-medium underline-offset-2 hover:underline"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </button>
            </div>
          )}
        </div>

        {/* Body content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-crimson-50 border border-crimson-200 text-crimson-800 text-xs flex flex-col gap-2 animate-fade-in">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-crimson-600 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
              {unverifiedEmailError && email.trim() && (
                <button
                  type="button"
                  disabled={resendingVerification}
                  onClick={() => handleResendVerification(email)}
                  className="self-start text-xs font-semibold text-accent-700 hover:text-accent-800 underline flex items-center gap-1.5 mt-1 disabled:opacity-60"
                >
                  {resendingVerification ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending verification email...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Resend verification email to {email.trim()}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span>{success}</span>
            </div>
          )}

          {emailSentNotice && (
            <div className="mb-4 p-4 rounded-xl bg-accent-50 border border-accent-200 text-accent-800 text-xs leading-relaxed animate-fade-in space-y-2">
              <div className="flex items-center gap-2 font-semibold text-accent-900">
                <Send className="w-4 h-4 text-accent-600" />
                <span>Verification Email Dispatched</span>
              </div>
              <p>{emailSentNotice}</p>
            </div>
          )}

          {/* VERIFY EMAIL TAB */}
          {tab === 'verify_email' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {!emailSentNotice && (
                <p className="text-xs text-ink-600 leading-relaxed">
                  Enter your email address to receive a fresh verification link powered by Zoho ZeptoMail Canada.
                </p>
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

              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="submit"
                  disabled={resendingVerification || loading || !email.trim()}
                  className="w-full py-2.5 px-4 rounded-xl bg-accent-600 hover:bg-accent-700 text-white font-medium text-sm shadow-card hover:shadow-glow transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {resendingVerification || loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending Verification Email...</span>
                    </>
                  ) : (
                    <>
                      <span>Resend Verification Email</span>
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTab('signin');
                    setError(null);
                    setEmailSentNotice(null);
                    setUnverifiedEmailError(false);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-paper-100 hover:bg-paper-200 text-ink-700 font-medium text-sm transition-all flex items-center justify-center gap-2"
                >
                  <span>Go to Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* FORGOT PASSWORD FORM */}
          {tab === 'forgot_password' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {!emailSentNotice && (
                <p className="text-xs text-ink-600 leading-relaxed">
                  Enter your registered email address. We will send you a secure password reset link powered by Zoho ZeptoMail Canada.
                </p>
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

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-accent-600 hover:bg-accent-700 text-white font-medium text-sm shadow-card hover:shadow-glow transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending Reset Link...</span>
                  </>
                ) : (
                  <>
                    <span>Send Password Reset Link</span>
                    <Send className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* RESET PASSWORD (NEW PASSWORD) FORM */}
          {tab === 'reset_password' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-ink-600 leading-relaxed">
                Choose a new secure password for your eStudesk account.
              </p>

              <div>
                <label className="block text-xs font-medium text-ink-600 mb-1.5">New Password</label>
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

              <div>
                <label className="block text-xs font-medium text-ink-600 mb-1.5">Confirm New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-paper-300 text-sm text-ink-800 placeholder:text-ink-300 focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-100 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-accent-600 hover:bg-accent-700 text-white font-medium text-sm shadow-card hover:shadow-glow transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <span>Set New Password & Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* SIGN IN & SIGN UP FORMS */}
          {(tab === 'signin' || tab === 'signup') && (
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
                      onClick={() => {
                        setTab('forgot_password');
                        setError(null);
                        setSuccess(null);
                        setEmailSentNotice(null);
                        setUnverifiedEmailError(false);
                      }}
                      className="text-xs text-accent-600 hover:text-accent-700 hover:underline font-medium"
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
          )}

          <div className="mt-5 pt-4 border-t border-paper-200 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs text-ink-500 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Email Delivery & Security via Zoho ZeptoMail Canada</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
