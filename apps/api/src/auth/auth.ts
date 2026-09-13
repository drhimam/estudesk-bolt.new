import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import * as schema from '../db/schema';
import {
  sendVerificationNotification,
  sendResetPasswordNotification,
  EmailEnvBindings,
} from '../email/notifications';

export function initBetterAuth(
  db: unknown,
  secret: string,
  baseURL?: string,
  extraOrigins: string[] = [],
  env?: EmailEnvBindings
) {
  const defaultOrigins = [
    'https://estudesk.com',
    'https://www.estudesk.com',
    'https://api.estudesk.com',
    'https://*.estudesk.com',
    'https://estudesk-bolt-new.pages.dev',
    'https://estudesk.pages.dev',
    'https://*.pages.dev',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:4173',
    'http://localhost:8787',
  ];

  const trustedOrigins = Array.from(new Set([...defaultOrigins, ...extraOrigins]));

  return betterAuth({
    database: drizzleAdapter(db as Parameters<typeof drizzleAdapter>[0], {
      provider: 'sqlite',
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
      },
    }),
    secret: secret,
    baseURL: baseURL || 'https://api.estudesk.com',
    trustedOrigins,
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      resetPasswordTokenExpiresIn: 60 * 60, // 1 hour
      sendResetPassword: async ({ user, url, token }) => {
        if (env && user && user.email) {
          await sendResetPasswordNotification(db, env, user, token, url);
        }
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: false,
      sendVerificationEmail: async ({ user, url, token }) => {
        if (env && user && user.email) {
          await sendVerificationNotification(db, env, user, token, url);
        }
      },
    },
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      },
      github: {
        clientId: process.env.GITHUB_CLIENT_ID || '',
        clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // 1 day
    },
  });
}