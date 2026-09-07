import { Bindings } from '../index';

export interface GenerationRequest {
  type: 'notes' | 'cheatsheet' | 'infographic' | 'flashcards' | 'quiz' | 'assignment' | 'presentation';
  prompt: string;
  sourceText?: string;
  options?: Record<string, any>;
  idempotencyKey: string;
}

interface CircuitBreakerState {
  failureCount: number;
  lastFailureTime: number;
  spendUSD: number;
}

const circuitBreakers: Record<string, CircuitBreakerState> = {
  deepseek: { failureCount: 0, lastFailureTime: 0, spendUSD: 0 },
  mistral: { failureCount: 0, lastFailureTime: 0, spendUSD: 0 },
  gemini: { failureCount: 0, lastFailureTime: 0, spendUSD: 0 },
  openai: { failureCount: 0, lastFailureTime: 0, spendUSD: 0 },
};

const DAILY_SPEND_LIMIT_USD = 50.0; // Global daily ceiling

export async function runAIRouter(req: GenerationRequest, env: Bindings) {
  const providers = ['deepseek', 'mistral', 'gemini', 'openai'];

  for (const provider of providers) {
    const cb = circuitBreakers[provider];
    const now = Date.now();

    // Check circuit breaker (skip if >5 failures in last 5 min or spend exceeded)
    if (cb.failureCount > 5 && now - cb.lastFailureTime < 5 * 60 * 1000) {
      continue;
    }
    if (cb.spendUSD >= DAILY_SPEND_LIMIT_USD) {
      continue;
    }

    try {
      const result = await executeProvider(provider, req, env);
      cb.failureCount = Math.max(0, cb.failureCount - 1);
      return { provider, result, success: true };
    } catch (err: any) {
      cb.failureCount += 1;
      cb.lastFailureTime = now;
    }
  }

  throw new Error('All AI providers are currently unavailable or rate-limited. Please try again in a few minutes.');
}

async function executeProvider(provider: string, req: GenerationRequest, env: Bindings) {
  // Provider integration stub handling OpenAI-compatible chat completions
  const apiKey =
    provider === 'openai'
      ? env.OPENAI_API_KEY
      : provider === 'gemini'
        ? env.GEMINI_API_KEY
        : env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    throw new Error(`API key not configured for provider: ${provider}`);
  }

  // Execute request against provider API endpoint...
  return {
    rawResponse: `Generated ${req.type} material via ${provider}`,
    tokenCount: 450,
    estimatedCostUsd: 0.002,
  };
}
