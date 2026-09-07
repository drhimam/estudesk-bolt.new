import { z } from 'zod';

export const NotesSchema = z.object({
  title: z.string(),
  contentMarkdown: z.string(),
  sections: z.array(
    z.object({
      heading: z.string(),
      body: z.string(),
      keyTerms: z.array(z.string()).optional(),
      callout: z.string().optional(),
    })
  ),
});

export const CheatsheetSchema = z.object({
  title: z.string(),
  contentMarkdown: z.string(),
  topics: z.array(
    z.object({
      topicName: z.string(),
      definitions: z.array(
        z.object({
          term: z.string(),
          definition: z.string(),
        })
      ),
      formulas: z.array(z.string()).optional(),
      mnemonics: z.array(z.string()).optional(),
    })
  ),
  comparisonTables: z
    .array(
      z.object({
        tableName: z.string(),
        headers: z.array(z.string()),
        rows: z.array(z.array(z.string())),
      })
    )
    .optional(),
});

export const InfographicSchema = z.object({
  title: z.string(),
  contentHtml: z.string(), // DOMPurify sanitized HTML string
  svgOrCssLayout: z.string().optional(),
});

export const FlashcardsSchema = z.object({
  title: z.string(),
  cards: z.array(
    z.object({
      id: z.string(),
      front: z.string(),
      back: z.string(),
    })
  ),
});

export const QuizSchema = z.object({
  title: z.string(),
  questions: z.array(
    z.object({
      id: z.string(),
      question: z.string(),
      type: z.enum(['single', 'multi', 'short', 'mixed']),
      options: z.array(z.string()),
      correctAnswer: z.array(z.string()),
      explanation: z.string().optional(),
    })
  ),
});

export const AssignmentSchema = z.object({
  title: z.string(),
  contentMarkdown: z.string(), // Title page + TOC + content + submission disclaimer
  tableOfContents: z.array(z.string()),
  citations: z.array(z.string()).optional(),
});

export const PresentationSchema = z.object({
  title: z.string(),
  slides: z.array(
    z.object({
      slideNumber: z.number(),
      title: z.string(),
      points: z.array(z.string()),
      notes: z.string().optional(),
    })
  ),
});
