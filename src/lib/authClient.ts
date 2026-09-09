import { createAuthClient } from 'better-auth/react';

// Point to Cloudflare Worker API URL
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? 'https://estudesk-api.rifa-numis.workers.dev'
    : (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'));

export const authClient = createAuthClient({
  baseURL: API_BASE_URL,
});

export const { signIn, signUp, signOut, useSession } = authClient;
