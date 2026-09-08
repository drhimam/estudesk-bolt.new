/**
 * AI Client — Direct frontend calls to the AI provider.
 *
 * Reads VITE_AI_* env vars from import.meta.env and calls the
 * OpenAI-compatible chat completions endpoint directly.
 */

import { extractUrls, fetchUrlContent } from './webReader';

const AI_API_KEY = import.meta.env.VITE_AI_API_KEY || '';
const AI_BASE_URL = (import.meta.env.VITE_AI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '');
const AI_MODEL = import.meta.env.VITE_AI_MODEL || 'gpt-4o-mini';

export interface ChatCompletionMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string } }>;
  usage?: { total_tokens?: number };
}

/**
 * Robust JSON extractor from LLM text responses.
 * Handles markdown fences, trailing commas, or surrounding commentary.
 */
function extractJsonFromText(text: string): Record<string, unknown> {
  let cleaned = text.trim();

  // Strip markdown code fences (e.g. ```json ... ``` or ``` ... ```)
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch) {
    cleaned = codeBlockMatch[1].trim();
  }

  // If there's still text around the JSON object, extract between first { and last }
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('[aiClient] Failed to parse JSON:', cleaned, err);
    throw new Error('AI generated invalid JSON structure. Please try again.');
  }
}

/**
 * Send a chat completion request to the configured AI provider.
 */
export async function chatCompletion(
  messages: ChatCompletionMessage[],
  options?: {
    temperature?: number;
    responseFormat?: 'json' | 'text';
  },
): Promise<string> {
  if (!AI_API_KEY) {
    throw new Error('AI_API_KEY is not configured. Add VITE_AI_API_KEY to your .env file.');
  }

  const body: Record<string, unknown> = {
    model: AI_MODEL,
    messages,
    temperature: options?.temperature ?? 0.4,
  };

  if (options?.responseFormat === 'json') {
    body.response_format = { type: 'json_object' };
  }

  const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${AI_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`AI provider error (HTTP ${response.status}): ${errText.slice(0, 200)}`);
  }

  const resJson = (await response.json()) as ChatCompletionResponse;
  const content = resJson.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('AI provider returned empty content.');
  }
  return content;
}

function buildTypeDirectives(type: string, options?: Record<string, unknown>): string {
  const directives: string[] = [];

  if (type === 'infographic') {
    const itype = (options?.infographicType as string) || 'informational';
    const orientation = (options?.orientation as string) || 'portrait';
    const pageSize = (options?.pageSize as string) || 'letter';
    const colorMode = (options?.color as string) || 'color';
    const isPrint = !!options?.printFriendly;
    const addInfo = (options?.infographicInfo as string) || '';

    directives.push(`INFOGRAPHIC SPECIFICATIONS (VISUAL ASSET):
- Infographic Subtype: ${itype.toUpperCase()}
  * ${itype === 'statistical' ? 'Focus heavily on key metrics, percentages, data comparisons, big numbers, and stat boxes.' : ''}
  * ${itype === 'timeline' ? 'Structure as a chronological sequence of milestones, phases, or dates with connected arrows and badges.' : ''}
  * ${itype === 'process' ? 'Structure as a step-by-step workflow (Step 1 -> Step 2 -> Step 3) showing inputs, transformations, and outcomes.' : ''}
  * ${itype === 'comparison' ? 'Create a side-by-side comparative layout contrasting concepts with distinct comparison cards and criteria table.' : ''}
  * ${itype === 'flowchart' ? 'Structure as decision/action nodes with clear branching and arrow connectors.' : ''}
  * ${itype === 'hierarchical' ? 'Structure as tiered levels or pyramid hierarchy from foundation to peak.' : ''}
  * ${itype === 'list' ? 'Structured list of essential takeaways with icon badges, numbered pills, and key highlights.' : ''}
  * ${itype === 'anatomical' ? 'Labeled components breakdown with callout pointers and anatomical/structural descriptions.' : ''}
  * ${itype === 'informational' ? 'Comprehensive visual overview with stat cards, concept blocks, and summary takeaways.' : ''}
- Layout & Size: ${pageSize.toUpperCase()} in ${orientation.toUpperCase()} orientation.
- Color Mode: ${colorMode === 'bw' ? 'Monochrome / high-contrast grayscale (pure black, white, gray shades).' : 'Vibrant, harmonious, modern color scheme.'}
- Print Friendly: ${isPrint ? 'Yes (clean light background, high contrast, clean borders, no heavy dark blocks).' : 'Standard visual card styling with soft shadows and gradients.'}
${addInfo ? `- Additional Focus: ${addInfo}` : ''}
- Visual Design Rules: Must return clean, self-contained HTML (using responsive CSS flex/grid, card containers with rounded corners, padding, badges, stat boxes, and modern typography). Do NOT return a simple wall of text notes.`);
  }

  if (type === 'notes') {
    const detail = (options?.detail as string) || 'detailed';
    const focus = (options?.focus as string) || '';
    directives.push(`STUDY NOTES SPECIFICATIONS:
- Detail Level: ${detail.toUpperCase()}
  * ${detail === 'concise' ? 'Keep concise (~400-600 words). Use bullet points, bold key terms, and summary takeaways.' : ''}
  * ${detail === 'detailed' ? 'Balanced depth (~800-1200 words). Include concept breakdowns, real-world examples, and key definitions.' : ''}
  * ${detail === 'comprehensive' ? 'In-depth textbook level (~1500-2500 words). Full deep-dive mechanisms, formulas, extensive examples, and detailed explanations.' : ''}
${focus ? `- Target Focus Areas: ${focus}` : ''}
- Structure: Clear headings (#, ##, ###), key concept badges, callout boxes (> 💡 Tip, > ⚠️ Note), definition lists, and summary takeaways.`);
  }

  if (type === 'cheatsheet') {
    const detail = (options?.detail as string) || 'concise';
    const format = (options?.format as string) || 'structured Markdown';
    const maxLength = (options?.maxLength as string) || '1 page';
    const includeExamples = options?.includeExamples !== false;
    const focus = (options?.focus as string) || '';

    directives.push(`CHEATSHEET SPECIFICATIONS (DENSE REFERENCE DOCUMENT):
- Must be optimized for quick scan and density, NOT deep reading or explanatory prose.
- Detail Level: ${detail}
- Layout Format: ${format}
- Max Length: ${maxLength} ${maxLength === '1 page' ? '(STRICT: Max ~800 words, high density, short definitions, abbreviations)' : ''}
- Include Examples: ${includeExamples ? 'Yes (short inline snippets)' : 'No (strictly definitions, formulas, and rules)'}
${focus ? `- Focus Areas: ${focus}` : ''}
- Structure:
  1. H2 topic areas (max 4-6)
  2. Definition lists: **Term** — concise definition.
  3. Formula blocks: math / formula code blocks for equations.
  4. Comparison tables for contrasting concepts.
  5. Mnemonic callouts: blockquotes with 🧠 prefix.`);
  }

  if (type === 'flashcards') {
    const count = options?.count ? Number(options.count) : 10;
    const difficulty = (options?.difficulty as string) || 'intermediate';
    directives.push(`FLASHCARDS SPECIFICATIONS:
- Card Count: Generate EXACTLY ${count} flashcards in the "cards" array.
- Difficulty Level: ${difficulty.toUpperCase()}
- Format: "front" (crisp question or prompt) and "back" (clear, comprehensive answer/explanation).`);
  }

  if (type === 'quiz') {
    const count = options?.count ? Number(options.count) : 5;
    const qtype = (options?.qtype as string) || 'mixed';
    const difficulty = (options?.difficulty as string) || 'intermediate';
    directives.push(`QUIZ SPECIFICATIONS:
- Question Count: Generate EXACTLY ${count} questions in the "questions" array.
- Question Type: ${qtype.toUpperCase()} (${qtype === 'single' ? 'Single choice with 4 options' : qtype === 'multi' ? 'Multiple correct answers' : qtype === 'short' ? 'Open short answer' : 'Mix of single, multi, and short answer'})
- Difficulty: ${difficulty.toUpperCase()}
- Strict Rule: "correctAnswer" must ALWAYS be an array of strings (e.g. ["Option A"] or ["A", "C"]).
- Always provide a clear "explanation" for why the answer is correct.`);
  }

  if (type === 'assignment') {
    const wordCount = options?.wordCount ? Number(options.wordCount) : 1000;
    const format = (options?.format as string) || 'essay';
    const citation = (options?.citation as string) || 'none';
    directives.push(`ASSIGNMENT SPECIFICATIONS:
- Target Word Count: Approximately ${wordCount} words.
- Format: ${format.toUpperCase()} (Academic essay/report/analysis structure)
- Citation Style: ${citation.toUpperCase()} ${citation !== 'none' ? `(Include inline citations and a References/Bibliography section in ${citation} format)` : ''}
- Mandatory Document Structure:
  1. Title Page (Title, Subject, Date, Author Placeholder)
  2. Table of Contents
  3. Executive Summary / Introduction
  4. Core Body Sections with subheadings
  5. Conclusion
  6. Persistent Disclaimer Banner: "> ⚠️ **Academic Integrity Notice:** Review and edit before submitting."`);
  }

  if (type === 'presentation') {
    const count = options?.count ? Number(options.count) : 5;
    const tone = (options?.tone as string) || 'academic';
    directives.push(`PRESENTATION SPECIFICATIONS:
- Slide Count: Generate EXACTLY ${count} slides in the "slides" array.
- Tone: ${tone.toUpperCase()}
- Structure: Slide 1 is Title/Agenda, intermediate slides are Content (title + 3-5 bullet points), final slide is Summary/Conclusion.
- Include concise, professional "notes" (speaker notes) for each slide.`);
  }

  return directives.join('\n');
}

const TYPE_SCHEMA_TEMPLATES: Record<string, string> = {
  notes: `{
  "title": "Topic Title",
  "contentMarkdown": "# Topic Title\\n\\n## Overview\\nDetailed summary...\\n\\n## Core Concepts\\n### Key Concept 1\\nDetailed explanation...\\n\\n> 💡 **Key Takeaway:** ...\\n\\n## Summary & Review\\n- Point 1\\n- Point 2",
  "sections": [
    { "heading": "Overview", "body": "...", "keyTerms": ["Term 1", "Term 2"] }
  ]
}`,
  cheatsheet: `{
  "title": "Cheat Sheet: Topic",
  "contentMarkdown": "# Cheat Sheet: Topic\\n\\n## Core Definitions\\n- **Term 1** — Concise definition.\\n- **Term 2** — Concise definition.\\n\\n## Formulas & Rules\\n\`\`\`math\\nE = mc^2\\n\`\`\`\\n\\n## Comparison Table\\n| Concept A | Concept B |\\n| --- | --- |\\n| Feature 1 | Feature 2 |\\n\\n> 🧠 **Mnemonic:** ...",
  "topics": [
    {
      "topicName": "Topic Name",
      "definitions": [{ "term": "Term", "definition": "Def" }],
      "formulas": ["formula"],
      "mnemonics": ["mnemonic"]
    }
  ]
}`,
  flashcards: `{
  "title": "Flashcards: Topic",
  "cards": [
    { "id": "1", "front": "Question or Key Concept?", "back": "Detailed and concise answer/explanation." }
  ]
}`,
  quiz: `{
  "title": "Quiz: Topic",
  "questions": [
    {
      "id": "1",
      "question": "What is ...?",
      "type": "single",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": ["Option A"],
      "explanation": "Explanation of why Option A is correct."
    }
  ]
}`,
  presentation: `{
  "title": "Presentation: Topic",
  "slides": [
    {
      "slideNumber": 1,
      "title": "Slide Title",
      "points": ["Key point 1", "Key point 2", "Key point 3"],
      "notes": "Speaker notes for this slide"
    }
  ]
}`,
  infographic: `{
  "title": "Infographic: Topic",
  "contentHtml": "<!DOCTYPE html><html><head><meta charset='utf-8'><style>body{font-family:system-ui,-apple-system,sans-serif;margin:0;padding:24px;background:#f8f9fa;color:#1e293b}.hero{background:linear-gradient(135deg,#3b82f6,#1d4ed8);color:white;padding:28px;border-radius:16px;margin-bottom:24px;text-align:center}.hero h1{margin:0 0 8px 0;font-size:26px}.hero p{margin:0;opacity:0.9;font-size:14px}.stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin-bottom:24px}.stat-card{background:white;padding:18px;border-radius:12px;border:1px solid #e2e8f0;box-shadow:0 1px 3px rgba(0,0,0,0.05);text-align:center}.stat-num{font-size:24px;font-weight:bold;color:#2563eb;margin-bottom:4px}.stat-label{font-size:12px;color:#64748b;text-transform:uppercase;font-weight:600}.cards-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:18px;margin-bottom:24px}.card{background:white;padding:20px;border-radius:14px;border:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,0.05)}.card h3{margin:0 0 12px 0;font-size:16px;color:#0f172a;display:flex;align-items:center;gap:8px}.card ul{margin:0;padding-left:18px;color:#334155;font-size:13.5px;line-height:1.6}.takeaway{background:#eff6ff;border:1px solid #bfdbfe;border-radius:14px;padding:20px;color:#1e40af}.takeaway h4{margin:0 0 8px 0;font-size:15px}.takeaway p{margin:0;font-size:13px;line-height:1.5}</style></head><body><div class='hero'><h1>Topic Title</h1><p>Visual Study Overview</p></div><div class='stats-grid'><div class='stat-card'><div class='stat-num'>Metric 1</div><div class='stat-label'>Key Metric</div></div><div class='stat-card'><div class='stat-num'>Metric 2</div><div class='stat-label'>Frequency / Range</div></div></div><div class='cards-grid'><div class='card'><h3>📌 Core Principles</h3><ul><li>Key concept detail 1</li><li>Key concept detail 2</li></ul></div><div class='card'><h3>⚡ Key Mechanisms</h3><ul><li>Mechanism step 1</li><li>Mechanism step 2</li></ul></div></div><div class='takeaway'><h4>💡 Key Takeaways</h4><p>Summary of crucial conclusions and practical exam tips.</p></div></body></html>"
}`,
  assignment: `{
  "title": "Assignment Title",
  "contentMarkdown": "# Assignment Title\\n\\n**Subject:** Subject Name  \\n**Author:** Student  \\n**Date:** Today's Date  \\n\\n---\\n\\n## Table of Contents\\n- [1. Executive Summary](#1-executive-summary)\\n- [2. Background & Objectives](#2-background--objectives)\\n- [3. Analysis & Discussion](#3-analysis--discussion)\\n- [4. Conclusion](#4-conclusion)\\n\\n---\\n\\n> ⚠️ **Academic Integrity Notice:** Review and edit before submitting.\\n\\n## 1. Executive Summary\\n...\\n\\n## 2. Background & Objectives\\n...\\n\\n## 3. Analysis & Discussion\\n...\\n\\n## 4. Conclusion\\n...",
  "tableOfContents": ["1. Executive Summary", "2. Background & Objectives", "3. Analysis & Discussion", "4. Conclusion"]
}`,
};

/**
 * Generate study material via the AI provider.
 * Returns raw parsed JSON matching the schema for the given material type.
 */
export async function generateMaterial(
  type: string,
  prompt: string,
  sourceText?: string,
  options?: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const optionsDesc = options
    ? Object.entries(options)
        .filter(([, v]) => v !== undefined && v !== '')
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ')
    : '';

  const typeDirectives = buildTypeDirectives(type, options);
  const schemaTemplate = TYPE_SCHEMA_TEMPLATES[type] || TYPE_SCHEMA_TEMPLATES.notes;

  const systemPrompt = `You are eStudesk AI study material generator.
Your task is to generate high quality, rich, authoritative, and structured study material strictly in JSON format matching the schema for type "${type}".

${typeDirectives}

USER CONFIGURATION PARAMETERS (YOU MUST STRICTLY FOLLOW ALL OF THESE):
${optionsDesc ? optionsDesc : 'Default settings'}

You MUST follow this exact JSON structure template:
${schemaTemplate}

CRITICAL RULES:
1. STRICTLY ADHERE to all user configuration parameters (e.g. exact card/question/slide count, word count, detail level, infographic type, format, citation style, difficulty).
2. For "notes", "cheatsheet", "assignment": ALWAYS populate "contentMarkdown" with extensive, beautifully formatted Markdown.
3. For "infographic": ALWAYS generate rich, complete, self-contained HTML in "contentHtml" with responsive CSS, visual cards, stat boxes, badges, and layout matching the subtype (${(options?.infographicType as string) || 'informational'}).
4. For "flashcards": ALWAYS populate "cards" array with EXACTLY the requested number of cards { "id", "front", "back" }.
5. For "quiz": ALWAYS populate "questions" array with EXACTLY the requested number of questions { "id", "question", "type", "options", "correctAnswer", "explanation" }.
6. Return ONLY valid JSON. Do not wrap in explanation text.`;

  const userPrompt = `Material Type: ${type}
Prompt/Topic: ${prompt}
${optionsDesc ? `Configuration Parameters: ${optionsDesc}` : ''}
Source Content: ${sourceText || 'Generate comprehensive material on the topic specified.'}`;

  const rawContent = await chatCompletion(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    { temperature: 0.3, responseFormat: 'json' },
  );

  return extractJsonFromText(rawContent);
}

/**
 * Ask the AI study assistant a question (chat mode).
 * Automatically resolves any URLs in the message or attachments if needed.
 * Returns the assistant's markdown response.
 */
export async function askAI(
  message: string,
  options?: {
    sourceText?: string;
    contextSubjectNames?: string[];
    history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  },
): Promise<string> {
  let resolvedSource = options?.sourceText || '';

  // If no source is provided or message contains URLs, auto-extract URL content
  const detectedUrls = extractUrls(message);
  if (detectedUrls.length > 0) {
    const fetchedContents: string[] = [];
    for (const url of detectedUrls) {
      try {
        const fetched = await fetchUrlContent(url);
        fetchedContents.push(`--- Content from ${url} (${fetched.title || 'Page'}) ---\n${fetched.text}`);
      } catch (e) {
        console.warn(`[askAI] Could not fetch URL ${url}:`, e);
      }
    }
    if (fetchedContents.length > 0) {
      resolvedSource = [resolvedSource, ...fetchedContents].filter(Boolean).join('\n\n---\n\n');
    }
  }

  const subjectContext = options?.contextSubjectNames?.length
    ? `Student active subjects: ${options.contextSubjectNames.join(', ')}.`
    : '';

  const systemPrompt = `You are eStudesk AI study assistant. Help the student understand topics, answer questions, analyze source notes/web content, and suggest creating flashcards, notes, or quizzes. Keep responses clear, accurate, structured, and beautifully formatted with clean Markdown. ${subjectContext}`;

  const userContent = [
    `Question / Prompt:\n${message}`,
    resolvedSource ? `\n\n--- Source Material / Context ---\n${resolvedSource}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const messages: ChatCompletionMessage[] = [
    { role: 'system', content: systemPrompt },
    ...(options?.history?.map((m) => ({ ...m, role: m.role as 'user' | 'assistant' })) || []),
    {
      role: 'user',
      content: userContent,
    },
  ];

  return chatCompletion(messages, { temperature: 0.4 });
}

