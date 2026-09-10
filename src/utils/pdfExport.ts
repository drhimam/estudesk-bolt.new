/**
 * eStudesk PDF & Print Export Engine
 * Generates visually appealing, high-standard, compact, and well-structured
 * study material documents with page numbers, subject theming, and callout highlighting.
 */

import type { StudyMaterial, SubjectColor } from '@/types';
import { COLOR_HEX, COLOR_LIGHT, COLOR_TEXT } from '@/utils/colors';
import { getFileTimestamp } from '@/utils/filename';

interface ExportPdfOptions {
  material: StudyMaterial;
  subjectName?: string;
  subjectColor?: SubjectColor;
}

/**
 * Basic Markdown to HTML converter for PDF printing.
 * Handles headings, bold, italic, code, blockquotes, callouts, lists, and tables.
 */
function markdownToHtml(md: string): string {
  if (!md) return '';

  let html = md
    // Escape angle brackets that aren't html tags
    .replace(/&(?!#?\w+;)/g, '&amp;')
    // KaTeX / math blocks
    .replace(/```(?:math|formula)?\s*([\s\S]*?)```/gi, (_, code) => {
      return `<div class="math-block"><pre>${code.trim()}</pre></div>`;
    })
    // Code blocks
    .replace(/```(\w*)\s*([\s\S]*?)```/g, (_, lang, code) => {
      return `<pre class="code-block"><code class="lang-${lang}">${code.trim()}</code></pre>`;
    })
    // Inline math / code
    .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
    // Headings
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Callouts / Blockquotes with emoji support
    .replace(/^>\s*💡\s*(.*?)$/gim, '<div class="callout callout-tip"><span class="callout-icon">💡</span><div>$1</div></div>')
    .replace(/^>\s*⚠️\s*(.*?)$/gim, '<div class="callout callout-warn"><span class="callout-icon">⚠️</span><div>$1</div></div>')
    .replace(/^>\s*🧠\s*(.*?)$/gim, '<div class="callout callout-mnemonic"><span class="callout-icon">🧠</span><div><strong>Mnemonic:</strong> $1</div></div>')
    .replace(/^>\s*📌\s*(.*?)$/gim, '<div class="callout callout-note"><span class="callout-icon">📌</span><div>$1</div></div>')
    .replace(/^>\s*(.*?)$/gim, '<blockquote>$1</blockquote>')
    // Bold & Italic
    .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Horizontal Rule
    .replace(/^---$/gim, '<hr class="divider"/>');

  // Tables
  html = html.replace(/((?:\|[^\n]+\|\r?\n)+)/g, (match) => {
    const lines = match.trim().split('\n').filter(Boolean);
    if (lines.length < 2) return match;
    let tableHtml = '<div class="table-container"><table>';
    lines.forEach((line, idx) => {
      if (line.includes('---')) return; // separator line
      const cells = line.split('|').slice(1, -1).map((c) => c.trim());
      const tag = idx === 0 ? 'th' : 'td';
      tableHtml += `<tr>${cells.map((c) => `<${tag}>${c}</${tag}>`).join('')}</tr>`;
    });
    tableHtml += '</table></div>';
    return tableHtml;
  });

  // Unordered lists
  html = html.replace(/((?:^[*-]\s+[^\n]+\r?\n?)+)/gm, (match) => {
    const items = match
      .trim()
      .split('\n')
      .map((item) => `<li>${item.replace(/^[*-]\s+/, '')}</li>`)
      .join('');
    return `<ul>${items}</ul>`;
  });

  // Ordered lists
  html = html.replace(/((?:^\d+\.\s+[^\n]+\r?\n?)+)/gm, (match) => {
    const items = match
      .trim()
      .split('\n')
      .map((item) => `<li>${item.replace(/^\d+\.\s+/, '')}</li>`)
      .join('');
    return `<ol>${items}</ol>`;
  });

  // Paragraphs
  html = html
    .split(/\n\s*\n/)
    .map((para) => {
      const trimmed = para.trim();
      if (!trimmed) return '';
      if (/^<(?:h[1-6]|div|blockquote|ul|ol|pre|table|hr)/.test(trimmed)) {
        return trimmed;
      }
      return `<p>${trimmed.replace(/\n/g, '<br/>')}</p>`;
    })
    .join('\n');

  return html;
}

/**
 * Generate high-standard, compact HTML structure tailored for printing / saving as PDF.
 */
function buildPrintDocumentHtml(options: ExportPdfOptions): string {
  const { material, subjectName, subjectColor = 'blue' } = options;
  const hex = (COLOR_HEX as Record<string, string>)[subjectColor] || '#4a7ab5';
  const bg = (COLOR_LIGHT as Record<string, string>)[subjectColor] || '#eaf1f8';
  const text = (COLOR_TEXT as Record<string, string>)[subjectColor] || '#315480';
  const dateStr = new Date(material.createdAt || Date.now()).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  let bodyContent = '';

  // 1. NOTES / ASSIGNMENT / OTHER
  if (material.type === 'notes' || material.type === 'assignment' || material.type === 'other') {
    const rawMd = material.contentMarkdown || material.sourceSnippet || '';
    bodyContent = `
      <div class="prose-content">
        ${markdownToHtml(rawMd)}
      </div>
    `;
  }
  // 2. CHEATSHEET
  else if (material.type === 'cheatsheet') {
    const rawMd = material.contentMarkdown || '';
    bodyContent = `
      <div class="cheatsheet-container">
        ${markdownToHtml(rawMd)}
      </div>
    `;
  }
  // 3. FLASHCARDS
  else if (material.type === 'flashcards') {
    const cards = material.flashcards || [];
    bodyContent = `
      <div class="section-intro">
        <span>Total Flashcards: <strong>${cards.length}</strong></span>
        <span>Cut or fold along dashed lines for physical study decks.</span>
      </div>
      <div class="flashcards-grid">
        ${cards
          .map(
            (c, i) => `
          <div class="flashcard-card">
            <div class="card-num-badge" style="background-color: ${bg}; color: ${text};">Card ${i + 1}</div>
            <div class="card-front">
              <div class="card-label">QUESTION / PROMPT</div>
              <div class="card-text bold">${markdownToHtml(c.front)}</div>
            </div>
            <div class="card-separator"></div>
            <div class="card-back">
              <div class="card-label">ANSWER / EXPLANATION</div>
              <div class="card-text">${markdownToHtml(c.back)}</div>
            </div>
          </div>
        `,
          )
          .join('')}
      </div>
    `;
  }
  // 4. QUIZ
  else if (material.type === 'quiz') {
    const questions = material.quiz || [];
    bodyContent = `
      <div class="quiz-questions">
        ${questions
          .map(
            (q, i) => `
          <div class="quiz-item">
            <div class="quiz-header">
              <span class="q-badge" style="background-color: ${hex}; color: #ffffff;">Question ${i + 1}</span>
              <span class="q-type">${q.type === 'multi' ? 'SELECT ALL THAT APPLY' : q.type === 'short' ? 'SHORT ANSWER' : 'MULTIPLE CHOICE'}</span>
            </div>
            <div class="q-title">${q.question}</div>
            ${
              q.type !== 'short' && q.options?.length
                ? `
              <div class="q-options">
                ${q.options
                  .map(
                    (opt, oi) => `
                  <div class="q-option">
                    <span class="opt-letter">${String.fromCharCode(65 + oi)}</span>
                    <span class="opt-text">${opt}</span>
                  </div>
                `,
                  )
                  .join('')}
              </div>
            `
                : `<div class="q-short-line"><strong>Answer:</strong> ____________________________________________________</div>`
            }
          </div>
        `,
          )
          .join('')}
      </div>

      <div class="quiz-answer-key page-break-before">
        <h2 style="border-bottom: 2.5px solid ${hex}; padding-bottom: 6px; color: #0f172a;">🔑 Answer Key & Explanations</h2>
        <div class="answer-key-list">
          ${questions
            .map(
              (q, i) => `
            <div class="answer-item">
              <div class="ans-header">
                <span class="ans-q-num">Q${i + 1}:</span>
                <span class="ans-badge">${q.correctAnswer?.join(', ') || 'Short answer'}</span>
              </div>
              ${q.explanation ? `<p class="ans-exp"><strong>Explanation:</strong> ${q.explanation}</p>` : ''}
            </div>
          `,
            )
            .join('')}
        </div>
      </div>
    `;
  }
  // 5. PRESENTATION
  else if (material.type === 'presentation') {
    const slides = material.slides || [];
    bodyContent = `
      <div class="presentation-deck">
        ${slides
          .map(
            (s, i) => `
          <div class="slide-card" style="border-top: 4px solid ${hex};">
            <div class="slide-header">
              <span class="slide-pill" style="background-color: ${bg}; color: ${text};">Slide ${s.slideNumber || i + 1} of ${slides.length}</span>
              <h2 class="slide-title">${s.title}</h2>
            </div>
            <ul class="slide-points">
              ${(s.points || []).map((p) => `<li>${p}</li>`).join('')}
            </ul>
            ${
              s.notes
                ? `
              <div class="slide-speaker-notes">
                <span class="notes-tag">SPEAKER NOTES:</span>
                <p>${s.notes}</p>
              </div>
            `
                : ''
            }
          </div>
        `,
          )
          .join('')}
      </div>
    `;
  }
  // 6. INFOGRAPHIC
  else if (material.type === 'infographic') {
    bodyContent = `
      <div class="infographic-print-wrapper">
        ${material.contentHtml || `<p>${material.contentMarkdown || ''}</p>`}
      </div>
    `;
  }

  const fileStamp = getFileTimestamp();
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${material.title} - ${subjectName || 'Study Material'}_${fileStamp} | eStudesk</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 16mm 16mm 18mm 16mm;
      @bottom-right {
        content: "Page " counter(page) " of " counter(pages);
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 8pt;
        color: #64748b;
      }
      @bottom-left {
        content: "eStudesk • " attr(data-title);
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 8pt;
        color: #94a3b8;
      }
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #1e293b;
      background: #ffffff;
      line-height: 1.55;
      font-size: 10pt;
      margin: 0;
      padding: 0;
    }

    /* Top Running Header Banner */
    .document-header {
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 12px;
      margin-bottom: 18px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .doc-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
    }

    .subject-pill {
      font-size: 8.5pt;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .type-pill {
      font-size: 8pt;
      font-weight: 600;
      padding: 2px 7px;
      border-radius: 6px;
      background: #f1f5f9;
      color: #475569;
      text-transform: capitalize;
    }

    .doc-title {
      font-family: Georgia, Cambria, "Times New Roman", Times, serif;
      font-size: 18pt;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 4px 0;
      line-height: 1.25;
    }

    .doc-date {
      font-size: 8pt;
      color: #94a3b8;
    }

    .brand-logo {
      font-family: Georgia, serif;
      font-size: 11pt;
      font-weight: 700;
      color: #0f172a;
      text-align: right;
    }

    .brand-sub {
      font-size: 7.5pt;
      color: #64748b;
      letter-spacing: 0.3px;
    }

    /* Typography & Markdown Elements */
    h1 { font-family: Georgia, serif; font-size: 15pt; color: #0f172a; margin: 16px 0 8px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
    h2 { font-family: Georgia, serif; font-size: 13pt; color: #1e293b; margin: 14px 0 6px 0; }
    h3 { font-size: 11pt; color: #334155; margin: 12px 0 4px 0; font-weight: 700; }
    p { margin: 0 0 8px 0; }
    ul, ol { margin: 0 0 10px 0; padding-left: 20px; }
    li { margin-bottom: 3px; }

    strong { color: #0f172a; }

    .inline-code {
      background: #f1f5f9;
      color: #0f172a;
      padding: 1px 4px;
      border-radius: 4px;
      font-family: "SFMono-Regular", Consolas, Menlo, monospace;
      font-size: 8.5pt;
    }

    .code-block, .math-block {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 12px;
      font-family: "SFMono-Regular", Consolas, Menlo, monospace;
      font-size: 8.5pt;
      margin: 8px 0;
      page-break-inside: avoid;
    }

    /* Callouts */
    .callout {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 10px 14px;
      border-radius: 8px;
      margin: 10px 0;
      font-size: 9.5pt;
      page-break-inside: avoid;
    }

    .callout-icon { font-size: 13pt; line-height: 1; shrink: 0; }
    .callout-tip { background: #f0fdf4; border-left: 4px solid #22c55e; color: #15803d; }
    .callout-warn { background: #fffbeb; border-left: 4px solid #f59e0b; color: #b45309; }
    .callout-mnemonic { background: #faf5ff; border-left: 4px solid #a855f7; color: #6b21a8; }
    .callout-note { background: #eff6ff; border-left: 4px solid #3b82f6; color: #1d4ed8; }

    blockquote {
      margin: 10px 0;
      padding: 6px 14px;
      background: #f8fafc;
      border-left: 3px solid #cbd5e1;
      color: #475569;
      font-style: italic;
    }

    /* Tables */
    .table-container { margin: 10px 0; page-break-inside: avoid; }
    table { width: 100%; border-collapse: collapse; font-size: 9pt; }
    th { background: #f1f5f9; text-align: left; padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: 700; }
    td { padding: 5px 10px; border: 1px solid #e2e8f0; }
    tr:nth-child(even) td { background: #f8fafc; }

    .divider { border: 0; height: 1px; background: #e2e8f0; margin: 16px 0; }

    /* Cheatsheet 2-column density */
    .cheatsheet-container {
      column-count: 2;
      column-gap: 18px;
      font-size: 9pt;
      line-height: 1.45;
    }
    .cheatsheet-container h2 { column-span: all; font-size: 12pt; border-bottom: 1.5px solid ${hex}; padding-bottom: 3px; margin-top: 8px; }
    .cheatsheet-container .callout,
    .cheatsheet-container .table-container {
      break-inside: avoid;
    }

    /* Flashcards print layout */
    .section-intro { display: flex; justify-content: space-between; font-size: 8.5pt; color: #64748b; margin-bottom: 12px; }
    .flashcards-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }
    .flashcard-card {
      border: 1.5px dashed #cbd5e1;
      border-radius: 10px;
      padding: 12px 14px;
      background: #ffffff;
      page-break-inside: avoid;
      position: relative;
    }
    .card-num-badge {
      display: inline-block;
      font-size: 7.5pt;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 4px;
      margin-bottom: 6px;
    }
    .card-label { font-size: 7.5pt; font-weight: 800; color: #334155; letter-spacing: 0.5px; margin-bottom: 3px; }
    .card-text { font-size: 10pt; color: #0f172a; line-height: 1.45; }
    .card-text.bold { font-weight: 700; color: #000000; }
    .card-separator { border-top: 1.5px dashed #cbd5e1; margin: 10px 0; }

    /* Quiz layout */
    .quiz-item {
      border: 1.5px solid #cbd5e1;
      border-radius: 10px;
      padding: 14px 16px;
      margin-bottom: 14px;
      background: #ffffff;
      page-break-inside: avoid;
    }
    .quiz-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .q-badge { font-size: 8.5pt; font-weight: 800; padding: 2.5px 8px; border-radius: 5px; letter-spacing: 0.2px; }
    .q-type { font-size: 7.5pt; font-weight: 700; color: #1e293b; background: #e2e8f0; padding: 2px 7px; border-radius: 4px; }
    .q-title { font-size: 10.5pt; font-weight: 700; color: #0f172a; margin-bottom: 10px; line-height: 1.4; }
    .q-options { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-top: 6px; }
    .q-option {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      font-size: 9.5pt;
      color: #0f172a;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 6px 10px;
      line-height: 1.35;
    }
    .opt-letter {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #0f172a;
      color: #ffffff;
      font-weight: 800;
      font-size: 8pt;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 1px;
    }
    .opt-text {
      color: #0f172a;
      font-weight: 600;
    }
    .q-short-line { font-size: 9.5pt; color: #0f172a; margin-top: 10px; }

    .quiz-answer-key { margin-top: 24px; padding-top: 14px; }
    .answer-key-list { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
    .answer-item {
      background: #f8fafc;
      border: 1.5px solid #cbd5e1;
      border-radius: 8px;
      padding: 10px 12px;
      font-size: 9pt;
      break-inside: avoid;
    }
    .ans-header { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
    .ans-q-num { font-weight: 800; font-size: 9.5pt; color: #0f172a; }
    .ans-badge {
      background: #dcfce7;
      color: #14532d;
      border: 1px solid #86efac;
      padding: 2px 8px;
      border-radius: 5px;
      font-weight: 800;
      font-size: 8.5pt;
    }
    .ans-exp { margin: 4px 0 0 0; color: #0f172a; font-size: 8.5pt; line-height: 1.4; }

    /* Presentation Slide deck */
    .presentation-deck { display: flex; flex-direction: column; gap: 14px; }
    .slide-card {
      border: 1.5px solid #cbd5e1;
      border-radius: 12px;
      padding: 16px 20px;
      background: #ffffff;
      page-break-inside: avoid;
    }
    .slide-pill { font-size: 8pt; font-weight: 800; padding: 2px 8px; border-radius: 6px; display: inline-block; margin-bottom: 8px; }
    .slide-title { font-size: 13pt; font-weight: 700; margin: 0 0 10px 0; color: #0f172a; }
    .slide-points { margin: 0; padding-left: 20px; font-size: 10pt; color: #0f172a; line-height: 1.45; }
    .slide-speaker-notes {
      margin-top: 12px;
      background: #f1f5f9;
      border-left: 3.5px solid #475569;
      padding: 8px 12px;
      border-radius: 0 6px 6px 0;
      font-size: 8.5pt;
      color: #0f172a;
    }
    .notes-tag { font-weight: 800; color: #0f172a; display: block; font-size: 7.5pt; margin-bottom: 2px; }

    /* Page break helpers */
    .page-break-before { page-break-before: always; }
    .avoid-break { page-break-inside: avoid; }

    @media screen {
      body {
        max-width: 800px;
        margin: 20px auto;
        padding: 30px;
        background: #f8fafc;
      }
      .page-container {
        background: #ffffff;
        padding: 36px;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.06);
      }
    }
  </style>
</head>
<body data-title="${material.title}">
  <div class="page-container">
    <header class="document-header">
      <div>
        <div class="doc-meta">
          <span class="subject-pill" style="background-color: ${bg}; color: ${text};">${subjectName || 'Study Material'}</span>
          <span class="type-pill">${material.type}</span>
          <span class="doc-date">${dateStr}</span>
        </div>
        <h1 class="doc-title">${material.title}</h1>
      </div>
      <div class="brand-logo">
        eStudesk
        <div class="brand-sub">STUDY ASSISTANT</div>
      </div>
    </header>

    <main>
      ${bodyContent}
    </main>
  </div>
</body>
</html>
  `;
}

/**
 * Trigger high-resolution printable PDF export.
 * Opens an isolated print preview window configured with `@page` sizing,
 * running headers, and page counters, allowing immediate Save as PDF.
 */
export function exportMaterialAsPdf(options: ExportPdfOptions): void {
  const html = buildPrintDocumentHtml(options);
  const printWindow = window.open('', '_blank');

  if (!printWindow) {
    // Fallback if popups are blocked: use iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 2000);
      }, 500);
    }
    return;
  }

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();

  // Wait for styles/images to settle, then invoke print
  printWindow.onload = () => {
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  };
}
