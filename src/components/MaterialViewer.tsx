import { useState } from 'react';
import { ArrowLeft, Trash2, Download, RotateCw, Check, X, MoreVertical, Pencil } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { db } from '@/db/database';
import { COLOR_HEX, COLOR_LIGHT, COLOR_TEXT } from '@/utils/colors';
import type { StudyMaterial, SubjectColor, Flashcard, QuizQuestion, PresentationSlide } from '@/types';

interface Props {
  material: StudyMaterial;
  subjectColor: SubjectColor;
  onBack: () => void;
  onRenamed?: () => void;
}

export function MaterialViewer({ material, subjectColor, onBack, onRenamed }: Props) {
  const hex = COLOR_HEX[subjectColor];
  const bg = COLOR_LIGHT[subjectColor];
  const text = COLOR_TEXT[subjectColor];
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [titleInput, setTitleInput] = useState(material.title);

  async function remove() {
    await db.materials.delete(material.id);
    onBack();
  }

  async function rename() {
    const trimmed = titleInput.trim();
    if (!trimmed || trimmed === material.title) {
      setRenaming(false);
      return;
    }
    await db.materials.update(material.id, { title: trimmed, updatedAt: Date.now() });
    material.title = trimmed;
    setRenaming(false);
    onRenamed?.();
  }

  function download() {
    let content = '';
    let filename = material.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'material';

    if (material.contentMarkdown) {
      content = material.contentMarkdown;
      filename += '.md';
    } else if (material.contentHtml) {
      content = material.contentHtml;
      filename += '.html';
    } else if (material.flashcards) {
      content = material.flashcards.map(c => `Q: ${c.front}\nA: ${c.back}`).join('\n\n');
      filename += '.txt';
    } else if (material.quiz) {
      content = material.quiz.map(q => {
        const ans = q.type === 'short' ? '(short answer)' : q.correctAnswer.join(', ');
        return `Q: ${q.question}\nOptions: ${q.options.join(' | ')}\nAnswer: ${ans}${q.explanation ? `\nExplanation: ${q.explanation}` : ''}`;
      }).join('\n\n');
      filename += '.txt';
    } else if (material.slides) {
      content = material.slides.map(s =>
        `## ${s.title}\n${s.points.map(p => `- ${p}`).join('\n')}${s.notes ? `\n\nNotes: ${s.notes}` : ''}`
      ).join('\n\n---\n\n');
      filename += '.md';
    } else if (material.sourceSnippet) {
      content = material.sourceSnippet;
      filename += '.md';
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setMenuOpen(false);
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <header className="flex items-center gap-3 px-4 lg:px-6 py-3 border-b border-paper-200 bg-white shrink-0">
        <button
          onClick={onBack}
          className="p-1.5 rounded-md hover:bg-paper-100 text-ink-400 transition-colors shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-medium shrink-0"
          style={{ backgroundColor: bg, color: text }}
        >
          {material.type.charAt(0).toUpperCase()}
        </div>
        {renaming ? (
          <input
            autoFocus
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            onBlur={rename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') rename();
              if (e.key === 'Escape') { setRenaming(false); setTitleInput(material.title); }
            }}
            className="font-serif text-lg font-semibold text-ink-800 flex-1 bg-paper-50 border border-paper-300 rounded-md px-2 py-1 focus:outline-none focus:border-accent-400"
          />
        ) : (
          <h1 className="font-serif text-lg font-semibold text-ink-800 truncate flex-1">
            {material.title}
          </h1>
        )}
        <div className="relative shrink-0">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-md hover:bg-paper-100 text-ink-400 transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 z-20 w-40 bg-white rounded-xl border border-paper-200 shadow-card py-1 animate-fade-in">
                <button
                  onClick={() => { setRenaming(true); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-ink-600 hover:bg-paper-50 transition-colors text-left"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Rename
                </button>
                <button
                  onClick={download}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-ink-600 hover:bg-paper-50 transition-colors text-left"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </button>
                <button
                  onClick={() => { remove(); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-crimson-600 hover:bg-red-50 transition-colors text-left"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
        <div className="max-w-3xl mx-auto px-4 lg:px-8 py-8 animate-fade-in">
          {material.type === 'notes' && (
            <div className="prose-studesk">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {material.contentMarkdown || ''}
              </ReactMarkdown>
            </div>
          )}
          {material.type === 'cheatsheet' && (
            <div className="prose-studesk">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {material.contentMarkdown || ''}
              </ReactMarkdown>
            </div>
          )}
          {material.type === 'assignment' && (
            <div className="prose-studesk">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {material.contentMarkdown || ''}
              </ReactMarkdown>
            </div>
          )}
          {material.type === 'infographic' && (
            <InfographicViewer html={material.contentHtml || ''} />
          )}
          {material.type === 'flashcards' && (
            <FlashcardViewer cards={material.flashcards || []} hex={hex} bg={bg} text={text} />
          )}
          {material.type === 'quiz' && (
            <QuizViewer questions={material.quiz || []} hex={hex} bg={bg} text={text} />
          )}
          {material.type === 'presentation' && (
            <PresentationViewer slides={material.slides || []} hex={hex} bg={bg} text={text} />
          )}
          {material.type === 'other' && (
            <div className="prose-studesk">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {material.sourceSnippet || ''}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfographicViewer({ html }: { html: string }) {
  return (
    <div className="bg-white rounded-xl border border-paper-200 overflow-hidden shadow-card">
      <iframe
        srcDoc={html}
        title="Infographic"
        sandbox="allow-same-origin"
        className="w-full border-0"
        style={{ minHeight: '500px' }}
      />
    </div>
  );
}

function FlashcardViewer({
  cards,
  hex,
  bg,
  text,
}: {
  cards: Flashcard[];
  hex: string;
  bg: string;
  text: string;
}) {
  const [flipped, setFlipped] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setFlipped((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {cards.map((card) => {
        const isFlipped = flipped.has(card.id);
        return (
          <button
            key={card.id}
            onClick={() => toggle(card.id)}
            className="relative h-48 rounded-xl border border-paper-200 bg-white overflow-hidden hover:shadow-card transition-all text-left"
          >
            <div
              className="absolute top-0 left-0 w-1 h-full"
              style={{ backgroundColor: hex }}
            />
            <div className="absolute inset-0 p-5 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-md"
                  style={{ backgroundColor: bg, color: text }}
                >
                  {isFlipped ? 'Answer' : 'Question'}
                </span>
                <RotateCw className="w-3 h-3 text-ink-300" />
              </div>
              <div className="flex-1 flex items-center justify-center text-center">
                <p className="text-sm text-ink-700 leading-relaxed">
                  {isFlipped ? card.back : card.front}
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function QuizViewer({
  questions,
  hex,
  bg,
  text,
}: {
  questions: QuizQuestion[];
  hex: string;
  bg: string;
  text: string;
}) {
  const [answers, setAnswers] = useState<Record<string, Set<number>>>({});
  const [shortAnswers, setShortAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  function toggleOption(qid: string, idx: number, multi: boolean) {
    setAnswers((prev) => {
      const current = prev[qid] || new Set();
      const next = new Set(current);
      if (multi) {
        if (next.has(idx)) next.delete(idx);
        else next.add(idx);
      } else {
        next.clear();
        next.add(idx);
      }
      return { ...prev, [qid]: next };
    });
  }

  function isCorrect(q: QuizQuestion): boolean {
    if (q.type === 'short') return false;
    const selected = answers[q.id] || new Set();
    const correctIndices = q.correctAnswer
      .map((ans) => q.options.indexOf(ans))
      .filter((i) => i >= 0);
    if (selected.size !== correctIndices.length) return false;
    return correctIndices.every((i) => selected.has(i));
  }

  const score = questions.filter((q) => q.type !== 'short' && isCorrect(q)).length;
  const gradable = questions.filter((q) => q.type !== 'short').length;

  return (
    <div>
      {submitted && gradable > 0 && (
        <div
          className="rounded-xl p-4 mb-6 flex items-center justify-between"
          style={{ backgroundColor: bg, color: text }}
        >
          <span className="font-serif text-lg font-semibold">
            Score: {score} / {gradable}
          </span>
          <button
            onClick={() => {
              setSubmitted(false);
              setAnswers({});
              setShortAnswers({});
            }}
            className="text-xs font-medium underline underline-offset-2"
          >
            Retake
          </button>
        </div>
      )}
      <div className="space-y-6">
        {questions.map((q, qi) => {
          const selected = answers[q.id] || new Set();
          const multi = q.type === 'multi' || q.type === 'mixed';
          return (
            <div
              key={q.id}
              className="bg-white rounded-xl border border-paper-200 p-5"
            >
              <div className="flex items-start gap-3 mb-4">
                <span
                  className="font-serif text-sm font-semibold shrink-0 w-6 h-6 rounded-md flex items-center justify-center"
                  style={{ backgroundColor: bg, color: text }}
                >
                  {qi + 1}
                </span>
                <p className="text-sm font-medium text-ink-700">{q.question}</p>
              </div>
              {q.type === 'short' ? (
                <textarea
                  value={shortAnswers[q.id] || ''}
                  onChange={(e) =>
                    setShortAnswers((prev) => ({
                      ...prev,
                      [q.id]: e.target.value,
                    }))
                  }
                  placeholder="Type your answer..."
                  rows={3}
                  className="w-full bg-paper-50 border border-paper-300 rounded-lg px-3 py-2 text-sm text-ink-700 placeholder:text-ink-300 focus:outline-none focus:border-accent-400 transition-colors resize-none"
                />
              ) : (
                <div className="space-y-2 ml-9">
                  {q.options.map((opt, oi) => {
                    const isSelected = selected.has(oi);
                    const isAns = q.correctAnswer.includes(opt);
                    const showResult = submitted && isSelected;
                    const showCorrect = submitted && isAns;
                    return (
                      <button
                        key={oi}
                        onClick={() => !submitted && toggleOption(q.id, oi, multi)}
                        disabled={submitted}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border text-sm text-left transition-all ${
                          showResult && !isAns
                            ? 'border-crimson-400 bg-red-50 text-crimson-700'
                            : showCorrect
                              ? 'border-accent-400 bg-accent-50 text-accent-700'
                              : isSelected
                                ? 'border-ink-400 bg-paper-100 text-ink-700'
                                : 'border-paper-300 text-ink-600 hover:border-paper-400'
                        }`}
                      >
                        <span className="w-5 h-5 rounded-full border flex items-center justify-center shrink-0 text-xs">
                          {showCorrect ? (
                            <Check className="w-3 h-3" />
                          ) : showResult && !isAns ? (
                            <X className="w-3 h-3" />
                          ) : isSelected ? (
                            <span className="w-2 h-2 rounded-full bg-current" />
                          ) : null}
                        </span>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}
              {submitted && q.explanation && (
                <div className="mt-3 ml-9 p-3 rounded-lg bg-paper-50 border border-paper-200">
                  <p className="text-xs text-ink-500">
                    <span className="font-semibold text-ink-600">Explanation: </span>
                    {q.explanation}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {!submitted && gradable > 0 && (
        <button
          onClick={() => setSubmitted(true)}
          className="mt-6 w-full py-2.5 rounded-lg text-sm font-medium text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: hex }}
        >
          Submit answers
        </button>
      )}
    </div>
  );
}

function PresentationViewer({
  slides,
  hex,
  bg,
  text,
}: {
  slides: PresentationSlide[];
  hex: string;
  bg: string;
  text: string;
}) {
  const [current, setCurrent] = useState(0);
  const slide = slides[current];

  return (
    <div>
      <div
        className="rounded-2xl border border-paper-200 bg-white overflow-hidden shadow-card"
        style={{ borderTop: `3px solid ${hex}` }}
      >
        <div className="p-8 lg:p-12 min-h-[400px]">
          <div className="flex items-center gap-2 mb-6">
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-md"
              style={{ backgroundColor: bg, color: text }}
            >
              Slide {current + 1} of {slides.length}
            </span>
          </div>
          <h2 className="font-serif text-2xl font-semibold text-ink-800 mb-6">
            {slide.title}
          </h2>
          <ul className="space-y-3">
            {slide.points.map((p, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-ink-600">
                <span
                  className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                  style={{ backgroundColor: hex }}
                />
                {p}
              </li>
            ))}
          </ul>
          {slide.notes && (
            <div className="mt-8 p-4 rounded-lg bg-paper-50 border border-paper-200">
              <p className="text-xs text-ink-400 font-medium mb-1">Speaker notes</p>
              <p className="text-sm text-ink-500">{slide.notes}</p>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between mt-4">
        <button
          onClick={() => setCurrent(Math.max(0, current - 1))}
          disabled={current === 0}
          className="px-4 py-2 rounded-lg text-sm font-medium text-ink-600 bg-white border border-paper-300 hover:bg-paper-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>
        <div className="flex gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === current ? 'w-6' : ''
              }`}
              style={{
                backgroundColor: i === current ? hex : '#d0d0cc',
              }}
            />
          ))}
        </div>
        <button
          onClick={() => setCurrent(Math.min(slides.length - 1, current + 1))}
          disabled={current === slides.length - 1}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ backgroundColor: hex }}
        >
          Next
        </button>
      </div>
    </div>
  );
}
