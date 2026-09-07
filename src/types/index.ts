export type SubjectColor =
  | 'rose'
  | 'amber'
  | 'teal'
  | 'blue'
  | 'violet'
  | 'emerald'
  | 'crimson'
  | 'slate'
  | 'plum'
  | 'ochre';

export interface Semester {
  id: string;
  name: string;
  createdAt: number;
  pinned?: boolean;
}

export interface Subject {
  id: string;
  semesterId: string;
  name: string;
  color: SubjectColor;
  createdAt: number;
  pinned?: boolean;
}

export type MaterialType =
  | 'notes'
  | 'cheatsheet'
  | 'infographic'
  | 'flashcards'
  | 'quiz'
  | 'assignment'
  | 'presentation'
  | 'other';

export interface Flashcard {
  id: string;
  front: string;
  back: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'single' | 'multi' | 'short' | 'mixed';
  options: string[];
  correctAnswer: string[];
  explanation?: string;
}

export interface PresentationSlide {
  slideNumber: number;
  title: string;
  points: string[];
  notes?: string;
}

export interface StudyMaterial {
  id: string;
  subjectId: string;
  type: MaterialType;
  title: string;
  createdAt: number;
  updatedAt: number;
  // content varies by type
  contentMarkdown?: string; // notes, assignment
  contentHtml?: string; // infographic
  flashcards?: Flashcard[]; // flashcards
  quiz?: QuizQuestion[]; // quiz
  slides?: PresentationSlide[]; // presentation
  sourceSnippet?: string; // other (saved chat snippet)
}

export type AttachmentType =
  | 'pdf'
  | 'word'
  | 'excel'
  | 'ppt'
  | 'md'
  | 'audio'
  | 'video'
  | 'url'
  | 'youtube'
  | 'image'
  | 'text';

export interface Attachment {
  id: string;
  type: AttachmentType;
  name: string;
  url?: string;
  size?: number;
  dataUrl?: string;
  textContent?: string;
  addedAt: number;
}

export interface ChatConversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

export interface ChatMessage {
  id: string;
  conversationId?: string;
  subjectId: string | null; // null = global chat
  role: 'user' | 'assistant';
  content: string;
  attachments?: Attachment[];
  contextSubjectIds?: string[]; // subjects attached as context
  webSearch?: boolean;
  createdAt: number;
}

export interface Deadline {
  id: string;
  folderId: string; // semester id
  subjectId: string | null; // null = non-subject / "Other"
  title: string;
  description?: string;
  dueDate: number;
  completed: boolean;
  createdAt: number;
}

export interface Draft {
  id: string;
  subjectId: string;
  type: MaterialType;
  title: string;
  contentMarkdown?: string;
  contentHtml?: string;
  flashcards?: Flashcard[];
  quiz?: QuizQuestion[];
  slides?: PresentationSlide[];
  versions: { content: string; timestamp: number }[];
  updatedAt: number;
}
