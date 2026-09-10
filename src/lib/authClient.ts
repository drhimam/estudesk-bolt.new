import { createAuthClient } from 'better-auth/react';

// Point to Cloudflare Worker API URL
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? 'https://estudesk-api.rifa-numis.workers.dev'
    : (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'));

export const authClient = createAuthClient({
  baseURL: API_BASE_URL,
});

export const { signIn, signUp, signOut, useSession } = authClient;

export interface AuthResponse<T = unknown> {
  data?: T;
  error?: { message?: string; status?: number };
}

/**
 * Request password reset link via eStudesk Cloud Mail
 */
export async function forgetPassword(options: { email: string; redirectTo?: string }): Promise<AuthResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/request-password-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { error: { message: (json as { message?: string }).message || 'Failed to request password reset' } };
    }
    return { data: json };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Network error';
    return { error: { message: msg } };
  }
}

/**
 * Reset password with verification token
 */
export async function resetPassword(options: { newPassword: string; token: string }): Promise<AuthResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { error: { message: (json as { message?: string }).message || 'Failed to reset password' } };
    }
    return { data: json };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Network error';
    return { error: { message: msg } };
  }
}

/**
 * Send email verification link via eStudesk Cloud Mail
 */
export async function sendVerificationEmail(options: { email: string; callbackURL?: string }): Promise<AuthResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/send-verification-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { error: { message: (json as { message?: string }).message || 'Failed to send verification email' } };
    }
    return { data: json };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Network error';
    return { error: { message: msg } };
  }
}

/**
 * Verify email token callback
 */
export async function verifyEmail(options: { query: { token: string } }): Promise<AuthResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/verify-email?token=${encodeURIComponent(options.query.token)}`, {
      method: 'GET',
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { error: { message: (json as { message?: string }).message || 'Failed to verify email token' } };
    }
    return { data: json };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Network error';
    return { error: { message: msg } };
  }
}
