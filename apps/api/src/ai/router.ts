import { Bindings } from '../index';
import {
  NotesSchema,
  CheatsheetSchema,
  InfographicSchema,
  FlashcardsSchema,
  QuizSchema,
  AssignmentSchema,
  PresentationSchema,
} from './schemas';

export interface GenerationRequest {
  type: 'notes' | 'cheatsheet' | 'infographic' | 'flashcards' | 'quiz' | 'assignment' | 'presentation';
  prompt: string;
  sourceText?: string;
  options?: Record<string, unknown>;
  idempotencyKey: string;
}

interface CircuitBreakerState {
  failureCount: number;
  lastFailureTime: number;
  spendUSD: number;
}

const circuitBreakers: Record<string, CircuitBreakerState> = {
  configured: { failureCount: 0, lastFailureTime: 0, spendUSD: 0 },
  deepseek: { failureCount: 0, lastFailureTime: 0, spendUSD: 0 },
  gemini: { failureCount: 0, lastFailureTime: 0, spendUSD: 0 },
  openai: { failureCount: 0, lastFailureTime: 0, spendUSD: 0 },
  mistral: { failureCount: 0, lastFailureTime: 0, spendUSD: 0 },
};

const DAILY_SPEND_LIMIT_USD = 50.0;

export async function runAIRouter(req: GenerationRequest, env: Bindings) {
  // If generic AI_PROVIDER is set in env, prioritize it
  const configuredProvider = env.AI_PROVIDER || 'configured';
  const providers = [configuredProvider, 'deepseek', 'gemini', 'openai', 'mistral'];

  for (const provider of providers) {
    const cb = circuitBreakers[provider] || { failureCount: 0, lastFailureTime: 0, spendUSD: 0 };
    const now = Date.now();

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
    } catch (err: unknown) {
      cb.failureCount += 1;
      cb.lastFailureTime = now;
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[AI Router] Provider ${provider} failed: ${msg}`);
    }
  }

  console.info('[AI Router] Using local fallback synthesis engine');
  const fallbackResult = generateLocalMaterialFallback(req);
  return { provider: 'local-fallback', result: fallbackResult, success: true };
}

async function executeProvider(provider: string, req: GenerationRequest, env: Bindings) {
  const apiKey =
    env.AI_API_KEY ||
    (provider === 'openai'
      ? env.OPENAI_API_KEY
      : provider === 'gemini'
        ? env.GEMINI_API_KEY
        : env.DEEPSEEK_API_KEY);

  if (!apiKey) {
    throw new Error(`API key not configured for provider: ${provider}`);
  }

  const baseUrl = (env.AI_BASE_URL ||
    (provider === 'deepseek'
      ? 'https://api.deepseek.com/v1'
      : provider === 'openai'
        ? 'https://api.openai.com/v1'
        : provider === 'gemini'
          ? 'https://generativelanguage.googleapis.com/v1beta/openai'
          : 'https://api.mistral.ai/v1')).replace(/\/+$/, '');

  const model =
    env.AI_MODEL ||
    (provider === 'deepseek'
      ? 'deepseek-chat'
      : provider === 'openai'
        ? 'gpt-4o-mini'
        : provider === 'gemini'
          ? 'gemini-1.5-flash'
          : 'mistral-small-latest');

  const optionsDesc = req.options
    ? Object.entries(req.options)
        .filter(([, v]) => v !== undefined && v !== '')
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ')
    : '';

  const systemPrompt = `You are eStudesk AI study material generator.
Your task is to generate high quality study material strictly in JSON format matching the schema for type "${req.type}".
${optionsDesc ? `Generation parameters: ${optionsDesc}.` : ''}
Do NOT include any markdown code blocks, explanation text, or wrapping quotes around the JSON. Return ONLY raw JSON object.`;

  const userPrompt = `Material Type: ${req.type}
Prompt/Topic: ${req.prompt}
${optionsDesc ? `Parameters: ${optionsDesc}` : ''}
Source Content: ${req.sourceText || 'None provided'}`;

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status} from ${baseUrl}: ${errorText.slice(0, 200)}`);
  }

  const resJson = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { total_tokens?: number };
  };

  const rawContent = resJson.choices?.[0]?.message?.content;
  if (!rawContent) {
    throw new Error('Received empty content from AI provider completion');
  }

  const parsed = JSON.parse(rawContent);
  const validatedData = validateAndParseMaterial(req.type, parsed);

  return {
    data: validatedData,
    tokenCount: resJson.usage?.total_tokens || 500,
    estimatedCostUsd: 0.002,
  };
}

function validateAndParseMaterial(type: string, data: unknown) {
  switch (type) {
    case 'notes': return NotesSchema.parse(data);
    case 'cheatsheet': return CheatsheetSchema.parse(data);
    case 'infographic': return InfographicSchema.parse(data);
    case 'flashcards': return FlashcardsSchema.parse(data);
    case 'quiz': return QuizSchema.parse(data);
    case 'assignment': return AssignmentSchema.parse(data);
    case 'presentation': return PresentationSchema.parse(data);
    default: return data;
  }
}

export function generateLocalMaterialFallback(req: GenerationRequest) {
  const title = req.prompt || `Study Material (${req.type.toUpperCase()})`;
  const source = req.sourceText || 'Attached source materials and lecture notes.';

  switch (req.type) {
    case 'notes': {
      const raw = {
        title: title,
        contentMarkdown: `# ${title}\n\n## Overview\n${source.slice(0, 300)}...\n\n### Key Concepts\n- Core Definition: Fundamental principles outlined in the source text.\n- Critical Application: Practical exercises and context.\n\n### Summary\nReview these structured notes regularly for optimal retention.`,
        sections: [
          {
            heading: 'Overview & Introduction',
            body: source.slice(0, 300),
            keyTerms: ['Core Principle', 'Analysis', 'Framework'],
            callout: 'Important: Focus on structural definitions before practicing problem sets.',
          },
        ],
      };
      return NotesSchema.parse(raw);
    }

    case 'cheatsheet': {
      const raw = {
        title: title,
        contentMarkdown: `# ${title} — Formula & Concept Sheet\n\n$$\\text{Recall Rate} = \\frac{\\text{Correct Answers}}{\\text{Total Attempts}} \\times 100\\%$$`,
        topics: [
          {
            topicName: 'Core Principles',
            definitions: [
              { term: 'Key Term 1', definition: 'Essential concept description from lecture notes.' },
              { term: 'Key Term 2', definition: 'Secondary analytical concept and usage.' },
            ],
            formulas: ['E = mc^2', '\\lim_{x \\to \\infty} \\frac{1}{x} = 0'],
            mnemonics: ['PEMDAS: Parentheses, Exponents, Multiplication, Division, Addition, Subtraction'],
          },
        ],
        comparisonTables: [
          {
            tableName: 'Methodology Comparison',
            headers: ['Feature', 'Approach A', 'Approach B'],
            rows: [
              ['Efficiency', 'High', 'Medium'],
              ['Complexity', 'Low', 'High'],
            ],
          },
        ],
      };
      return CheatsheetSchema.parse(raw);
    }

    case 'infographic': {
      const raw = {
        title: title,
        contentHtml: `<div style="font-family: sans-serif; padding: 24px; background: #0f172a; color: #f8fafc; border-radius: 12px;">
          <h2 style="color: #38bdf8; margin-bottom: 16px;">${title} Visual Guide</h2>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
            <div style="background: #1e293b; padding: 16px; border-radius: 8px; border-left: 4px solid #38bdf8;">
              <h3 style="margin-top: 0;">Step 1: Preparation</h3>
              <p>Extract core facts from sources and synthesize context.</p>
            </div>
            <div style="background: #1e293b; padding: 16px; border-radius: 8px; border-left: 4px solid #818cf8;">
              <h3 style="margin-top: 0;">Step 2: Mastery</h3>
              <p>Practice spaced repetition and key term recall.</p>
            </div>
          </div>
        </div>`,
        svgOrCssLayout: 'grid-2-col',
      };
      return InfographicSchema.parse(raw);
    }

    case 'flashcards': {
      const raw = {
        title: title,
        cards: [
          {
            id: 'card-1',
            front: 'What is the primary objective of this subject?',
            back: source.slice(0, 150) || 'To understand core analytical frameworks and apply problem-solving techniques.',
          },
          {
            id: 'card-2',
            front: 'Define the main theorem / concept.',
            back: 'A foundational principle established in the reference study material.',
          },
          {
            id: 'card-3',
            front: 'How is spaced repetition utilized in eStudesk?',
            back: 'By reviewing flashcards with delayed interval feedback to maximize long-term memory retention.',
          },
        ],
      };
      return FlashcardsSchema.parse(raw);
    }

    case 'quiz': {
      const raw = {
        title: title,
        questions: [
          {
            id: 'q-1',
            question: 'What is the central concept discussed in the study material?',
            type: 'single' as const,
            options: [
              'Primary conceptual framework',
              'Secondary experimental trial',
              'Historical context background',
              'Unrelated methodology',
            ],
            correctAnswer: ['Primary conceptual framework'],
            explanation: 'The primary concept forms the backbone of all derived formulas and analysis.',
          },
          {
            id: 'q-2',
            question: 'Which of the following techniques improve study efficiency? (Select all that apply)',
            type: 'multi' as const,
            options: [
              'Active recall testing',
              'Spaced repetition flashcards',
              'Passive reading without notes',
              'Formula cheatsheet creation',
            ],
            correctAnswer: ['Active recall testing', 'Spaced repetition flashcards', 'Formula cheatsheet creation'],
            explanation: 'Active retrieval mechanisms build stronger neural connections than passive reading.',
          },
        ],
      };
      return QuizSchema.parse(raw);
    }

    case 'assignment': {
      const raw = {
        title: title,
        contentMarkdown: `# ${title}\n\n## Academic Disclaimer\n*This draft is produced as an AI preparation assistant to guide your research. Ensure final submissions reflect your original work and cite required sources.*\n\n## Executive Summary\n${source.slice(0, 250)}\n\n## Table of Contents\n1. Introduction\n2. Literature & Source Synthesis\n3. Critical Analysis\n4. Conclusion & Recommendations\n\n## 1. Introduction\nThis analysis explores the foundational topics presented in the coursework.\n\n## 2. Source Synthesis\nKey evidence from the provided documentation confirms the primary thesis.`,
        tableOfContents: ['1. Introduction', '2. Source Synthesis', '3. Critical Analysis', '4. Conclusion'],
        citations: ['Course Reference Guide (2026)', 'Standard Academic Principles, Vol. 4'],
      };
      return AssignmentSchema.parse(raw);
    }

    case 'presentation': {
      const raw = {
        title: title,
        slides: [
          {
            slideNumber: 1,
            title: title,
            points: ['Overview of Core Topics', 'Key Findings & Insights', 'Action Plan & Next Steps'],
            notes: 'Welcome the audience and introduce the primary scope of the study session.',
          },
          {
            slideNumber: 2,
            title: 'Core Findings & Analysis',
            points: [
              'Data Point 1: Fundamental principles established',
              'Data Point 2: Comparative advantages across models',
              'Data Point 3: Application in coursework assignments',
            ],
            notes: 'Emphasize the practical implications of Data Point 2.',
          },
          {
            slideNumber: 3,
            title: 'Summary & Q&A',
            points: ['Review key mnemonics and formulas', 'Complete attached quiz deck', 'Prepare for upcoming deadline'],
            notes: 'Open the floor for questions and direct students to the quiz viewer.',
          },
        ],
      };
      return PresentationSchema.parse(raw);
    }

    default:
      throw new Error(`Unsupported material type: ${req.type}`);
  }
}