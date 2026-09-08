import { createAuthClient } from 'better-auth/react';

// Initialize Better Auth Client pointing to the local proxy or production Cloudflare worker API
export const authClient = createAuthClient({
  baseURL: typeof window !== 'undefined' ? window.location.origin : '',
});

export const { signIn, signUp, signOut, useSession } = authClient;
