import { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  Save,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Loader2,
  Check,
  Paperclip,
  Link,
  Youtube,
  FileText,
  Type,
  Globe,
  Upload,
  Trash2,
  Plus,
  BookOpen,
  Settings2,
  MessageSquare,
  FileSpreadsheet,
  Presentation,
  Image as ImageIcon,
  Clipboard,
  RotateCw,
  Layers,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { db, uid } from '@/db/database';
import { COLOR_HEX, COLOR_LIGHT, COLOR_TEXT } from '@/utils/colors';
import { useAllSubjects, useMaterials } from '@/hooks/useQueries';
import type {
  MaterialType,
  StudyMaterial,
  SubjectColor,
  Flashcard,
  QuizQuestion,
  PresentationSlide,
  Attachment,
  AttachmentType,
  StudyMaterial as SM,
} from '@/types';

interface Props {
  subjectId: string;
  subjectColor: SubjectColor;
  type: MaterialType;
  onClose: () => void;
}

const TYPE_LABELS: Record<MaterialType, string> = {
  notes: 'Study notes',
  cheatsheet: 'Cheat sheet',
  infographic: 'Infographic',
  flashcards: 'Flashcards',
  quiz: 'Quiz',
  assignment: 'Assignment',
  presentation: 'Presentation',
  other: 'Other',
};

const ALL_MATERIAL_TYPES = Object.keys(TYPE_LABELS) as MaterialType[];

const MAX_REFINEMENT_TURNS = 8;

// --- Type-specific parameter definitions ---
type ParamValue = string | number | boolean;

interface ParamDef {
  key: string;
  label: string;
  type: 'select' | 'number' | 'text' | 'toggle';
  options?: { value: string; label: string }[];
  default: ParamValue;
  min?: number;
  max?: number;
}

const PARAMS_BY_TYPE: Record<MaterialType, ParamDef[]> = {
  notes: [
    {
      key: 'detail',
      label: 'Detail level',
      type: 'select',
      default: 'detailed',
      options: [
        { value: 'concise', label: 'Concise' },
        { value: 'detailed', label: 'Detailed' },
        { value: 'comprehensive', label: 'Comprehensive' },
      ],
    },
    {
      key: 'focus',
      label: 'Focus areas (optional)',
      type: 'text',
      default: '',
    },
  ],
  cheatsheet: [
    {
      key: 'detail',
      label: 'Detail level',
      type: 'select',
      default: 'concise',
      options: [
        { value: 'concise', label: 'Concise' },
        { value: 'detailed', label: 'Detailed' },
      ],
    },
    {
      key: 'focus',
      label: 'Focus areas (optional)',
      type: 'text',
      default: '',
    },
  ],
  flashcards: [
    {
      key: 'count',
      label: 'Number of cards',
      type: 'number',
      default: 10,
      min: 3,
      max: 50,
    },
    {
      key: 'difficulty',
      label: 'Difficulty',
      type: 'select',
      default: 'intermediate',
      options: [
        { value: 'basic', label: 'Basic' },
        { value: 'intermediate', label: 'Intermediate' },
        { value: 'advanced', label: 'Advanced' },
      ],
    },
  ],
  quiz: [
    {
      key: 'count',
      label: 'Number of questions',
      type: 'number',
      default: 5,
      min: 3,
      max: 30,
    },
    {
      key: 'qtype',
      label: 'Question type',
      type: 'select',
      default: 'mixed',
      options: [
        { value: 'single', label: 'Multiple choice' },
        { value: 'multi', label: 'Select all that apply' },
        { value: 'short', label: 'Short answer' },
        { value: 'mixed', label: 'Mixed' },
      ],
    },
    {
      key: 'difficulty',
      label: 'Difficulty',
      type: 'select',
      default: 'intermediate',
      options: [
        { value: 'basic', label: 'Basic' },
        { value: 'intermediate', label: 'Intermediate' },
        { value: 'advanced', label: 'Advanced' },
      ],
    },
  ],
  assignment: [
    {
      key: 'wordCount',
      label: 'Target word count',
      type: 'number',
      default: 1000,
      min: 200,
      max: 5000,
    },
    {
      key: 'format',
      label: 'Format',
      type: 'select',
      default: 'essay',
      options: [
        { value: 'essay', label: 'Essay' },
        { value: 'report', label: 'Report' },
        { value: 'analysis', label: 'Analysis' },
      ],
    },
    {
      key: 'citation',
      label: 'Citation style',
      type: 'select',
      default: 'none',
      options: [
        { value: 'none', label: 'None' },
        { value: 'apa', label: 'APA' },
        { value: 'mla', label: 'MLA' },
        { value: 'chicago', label: 'Chicago' },
      ],
    },
  ],
  presentation: [
    {
      key: 'count',
      label: 'Number of slides',
      type: 'number',
      default: 5,
      min: 3,
      max: 20,
    },
    {
      key: 'tone',
      label: 'Tone',
      type: 'select',
      default: 'academic',
      options: [
        { value: 'academic', label: 'Academic' },
        { value: 'casual', label: 'Casual' },
        { value: 'professional', label: 'Professional' },
      ],
    },
  ],
  infographic: [
    {
      key: 'pageSize',
      label: 'Page size',
      type: 'select',
      default: 'letter',
      options: [
        { value: 'letter', label: 'Letter' },
        { value: 'legal', label: 'Legal' },
        { value: 'tabloid', label: 'Tabloid' },
      ],
    },
    {
      key: 'orientation',
      label: 'Orientation',
      type: 'select',
      default: 'portrait',
      options: [
        { value: 'portrait', label: 'Portrait' },
        { value: 'landscape', label: 'Landscape' },
      ],
    },
    {
      key: 'color',
      label: 'Color mode',
      type: 'select',
      default: 'bw',
      options: [
        { value: 'bw', label: 'B/W' },
        { value: 'color', label: 'Color' },
      ],
    },
    {
      key: 'infographicType',
      label: 'Infographic type',
      type: 'select',
      default: 'informational',
      options: [
        { value: 'statistical', label: 'Statistical' },
        { value: 'timeline', label: 'Timeline' },
        { value: 'process', label: 'Process' },
        { value: 'comparison', label: 'Comparison' },
        { value: 'list', label: 'List' },
        { value: 'geographic', label: 'Geographic' },
        { value: 'flowchart', label: 'Flowchart' },
        { value: 'hierarchical', label: 'Hierarchical' },
        { value: 'informational', label: 'Informational' },
        { value: 'anatomical', label: 'Anatomical' },
      ],
    },
    {
      key: 'printFriendly',
      label: 'Print-friendly',
      type: 'toggle',
      default: true,
    },
    {
      key: 'infographicInfo',
      label: 'Additional info',
      type: 'text',
      default: '',
    },
  ],
  other: [
    {
      key: 'focus',
      label: 'Focus areas (optional)',
      type: 'text',
      default: '',
    },
  ],
};

const ATTACHMENT_TYPES: { type: AttachmentType; label: string; icon: React.ReactNode; accept?: string }[] = [
  { type: 'pdf', label: 'PDF', icon: <FileText className="w-4 h-4" />, accept: '.pdf' },
  { type: 'word', label: 'Word', icon: <FileText className="w-4 h-4" />, accept: '.doc,.docx' },
  { type: 'excel', label: 'Excel', icon: <FileSpreadsheet className="w-4 h-4" />, accept: '.xls,.xlsx,.csv' },
  { type: 'ppt', label: 'PPT', icon: <Presentation className="w-4 h-4" />, accept: '.ppt,.pptx' },
  { type: 'md', label: 'Markdown', icon: <Type className="w-4 h-4" />, accept: '.md,.txt,.rtf' },
  { type: 'image', label: 'Image', icon: <ImageIcon className="w-4 h-4" />, accept: 'image/*' },
  { type: 'url', label: 'URL', icon: <Link className="w-4 h-4" /> },
  { type: 'youtube', label: 'YouTube', icon: <Youtube className="w-4 h-4" /> },
];

const FILE_ACCEPT_ALL =
  '.pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.md,.txt,.rtf,.png,.jpg,.jpeg,.gif,.webp,image/*';

type Phase = 'config' | 'generating' | 'refine' | 'postsave';

interface GenParams {
  title: string;
  params: Record<string, ParamValue>;
  additionalInstructions: string;
  attachments: Attachment[];
  webSearch: boolean;
}

export function GenerationStudio({ subjectId, subjectColor, type, onClose }: Props) {
  const allSubjects = useAllSubjects();
  const subjectMaterials = useMaterials(subjectId);
  const [activeType, setActiveType] = useState<MaterialType>(type);
  const [phase, setPhase] = useState<Phase>('config');
  const [refinementMessages, setRefinementMessages] = useState<
    { role: 'user' | 'assistant'; content: string }[]
  >([]);
  const [draft, setDraft] = useState<StudyMaterial | null>(null);
  const [refineInput, setRefineInput] = useState('');
  const [versions, setVersions] = useState<{ content: string; timestamp: number }[]>([]);
  const [versionIdx, setVersionIdx] = useState(0);
  const [saved, setSaved] = useState(false);
  const [genStep, setGenStep] = useState(0);
  const [savedMaterials, setSavedMaterials] = useState<{ title: string; type: MaterialType }[]>([]);
  const [genParams, setGenParams] = useState<GenParams>(() => {
    const defs = PARAMS_BY_TYPE[type] || [];
    const defaultParams: Record<string, ParamValue> = {};
    for (const d of defs) defaultParams[d.key] = d.default;
    return {
      title: '',
      params: defaultParams,
      additionalInstructions: '',
      attachments: [],
      webSearch: false,
    };
  });
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState<string | null>(null);
  const [urlValue, setUrlValue] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const [textValue, setTextValue] = useState('');
  const [textName, setTextName] = useState('');
  const [showMaterialPicker, setShowMaterialPicker] = useState(false);
  const [imagePasteOpen, setImagePasteOpen] = useState(false);
  const [pastedImage, setPastedImage] = useState<string | null>(null);
  const [pastedImageName, setPastedImageName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileInputAccept, setFileInputAccept] = useState<string>(FILE_ACCEPT_ALL);

  const hex = COLOR_HEX[subjectColor];
  const bg = COLOR_LIGHT[subjectColor];
  const text = COLOR_TEXT[subjectColor];

  const paramDefs = PARAMS_BY_TYPE[activeType] || [];

  function updateParam(key: string, value: ParamValue) {
    setGenParams((prev) => ({
      ...prev,
      params: { ...prev.params, [key]: value },
    }));
  }

  function detectFileType(file: File): AttachmentType {
    const name = file.name.toLowerCase();
    if (name.endsWith('.pdf')) return 'pdf';
    if (name.endsWith('.doc') || name.endsWith('.docx')) return 'word';
    if (name.endsWith('.xls') || name.endsWith('.xlsx') || name.endsWith('.csv')) return 'excel';
    if (name.endsWith('.ppt') || name.endsWith('.pptx')) return 'ppt';
    if (name.endsWith('.md')) return 'md';
    if (file.type.startsWith('image/')) return 'image';
    return 'text';
  }

  function handleFileSelect(files: FileList | null) {
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      const fType = detectFileType(file);
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const isImage = fType === 'image';
        const isText =
          fType === 'md' || fType === 'text' || file.type.startsWith('text/');
        const att: Attachment = {
          id: uid(),
          type: fType,
          name: file.name,
          size: file.size,
          dataUrl: isImage ? result : undefined,
          textContent: isText ? result : undefined,
          addedAt: Date.now(),
        };
        setGenParams((prev) => ({
          ...prev,
          attachments: [...prev.attachments, att],
        }));
      };
      if (fType === 'image' || file.type.startsWith('image/')) {
        reader.readAsDataURL(file);
      } else if (
        fType === 'md' ||
        fType === 'text' ||
        file.type.startsWith('text/')
      ) {
        reader.readAsText(file);
      } else {
        reader.readAsDataURL(file);
      }
    });
    setShowAttachMenu(false);
  }

  function triggerFileUpload(accept?: string) {
    setFileInputAccept(accept || FILE_ACCEPT_ALL);
    setTimeout(() => fileInputRef.current?.click(), 0);
  }

  function addAttachment(aType: AttachmentType, name: string, url?: string) {
    const att: Attachment = {
      id: uid(),
      type: aType,
      name,
      url,
      addedAt: Date.now(),
    };
    setGenParams((prev) => ({ ...prev, attachments: [...prev.attachments, att] }));
    setShowAttachMenu(false);
    setShowUrlInput(null);
    setUrlValue('');
    setShowTextInput(false);
    setTextValue('');
    setTextName('');
  }

  function addImageAttachment(dataUrl: string, name: string) {
    const att: Attachment = {
      id: uid(),
      type: 'image',
      name: name || 'Pasted image',
      dataUrl,
      addedAt: Date.now(),
    };
    setGenParams((prev) => ({ ...prev, attachments: [...prev.attachments, att] }));
    setImagePasteOpen(false);
    setPastedImage(null);
    setPastedImageName('');
  }

  function removeAttachment(id: string) {
    setGenParams((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((a) => a.id !== id),
    }));
  }

  function addMaterialAsAttachment(material: SM, subjectName: string) {
    const att: Attachment = {
      id: uid(),
      type: 'text',
      name: `${subjectName}: ${material.title}`,
      textContent: material.contentMarkdown || material.sourceSnippet || '',
      addedAt: Date.now(),
    };
    setGenParams((prev) => ({ ...prev, attachments: [...prev.attachments, att] }));
    setShowMaterialPicker(false);
  }

  const GEN_STEPS = [
    'Analyzing sources',
    'Structuring content',
    'Generating draft',
    'Finalizing',
  ];

  async function generate() {
    setPhase('generating');
    setGenStep(0);

    // staged progress
    for (let i = 0; i < GEN_STEPS.length; i++) {
      setGenStep(i);
      await new Promise((r) => setTimeout(r, 500));
    }

    const generated = generateMockContent(activeType, subjectId, genParams);
    setDraft(generated);
    setVersions([{ content: JSON.stringify(generated), timestamp: Date.now() }]);
    setVersionIdx(0);
    setRefinementMessages([
      {
        role: 'assistant',
        content: `Here's your ${TYPE_LABELS[activeType].toLowerCase()}. Take a look at the preview on the right. You can ask me to adjust, expand, or restructure any part.`,
      },
    ]);
    setPhase('refine');
  }

  async function refine() {
    if (!refineInput.trim() || !draft) return;
    if (refinementMessages.filter((m) => m.role === 'user').length >= MAX_REFINEMENT_TURNS) return;

    const userMsg = { role: 'user' as const, content: refineInput.trim() };
    setRefinementMessages((prev) => [...prev, userMsg]);
    setRefineInput('');
    setPhase('generating');
    setGenStep(0);

    for (let i = 0; i < GEN_STEPS.length; i++) {
      setGenStep(i);
      await new Promise((r) => setTimeout(r, 400));
    }

    const currentVersions = versions.length;
    const refined = generateMockContent(activeType, subjectId, genParams);
    setDraft(refined);
    setVersions((prev) => [
      ...prev,
      { content: JSON.stringify(refined), timestamp: Date.now() },
    ]);
    setVersionIdx(currentVersions);
    setRefinementMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content: `I've updated the ${TYPE_LABELS[activeType].toLowerCase()} based on your feedback. Version ${currentVersions + 1} is now in the preview.`,
      },
    ]);
    setPhase('refine');
  }

  async function save() {
    if (!draft) return;
    const material: StudyMaterial = {
      ...draft,
      id: uid(),
      title: genParams.title.trim() || draft.title,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await db.materials.add(material);
    setSavedMaterials((prev) => [
      ...prev,
      { title: material.title, type: activeType },
    ]);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setPhase('postsave');
    }, 800);
  }

  function startNewType(newType: MaterialType) {
    const defs = PARAMS_BY_TYPE[newType] || [];
    const defaultParams: Record<string, ParamValue> = {};
    for (const d of defs) defaultParams[d.key] = d.default;
    setActiveType(newType);
    setGenParams((prev) => ({
      ...prev,
      title: '',
      params: defaultParams,
      additionalInstructions: '',
      // attachments and webSearch are preserved
    }));
    setDraft(null);
    setVersions([]);
    setVersionIdx(0);
    setRefinementMessages([]);
    setRefineInput('');
    setPhase('config');
  }

  const turnsUsed = refinementMessages.filter((m) => m.role === 'user').length;
  const turnsLeft = MAX_REFINEMENT_TURNS - turnsUsed;

  return (
    <div className="fixed inset-0 z-50 bg-paper-100 flex flex-col animate-fade-in">
      {/* Header */}
      <header
        className="flex items-center gap-3 px-4 lg:px-6 py-3.5 border-b border-paper-200 bg-white shrink-0"
        style={{ background: `linear-gradient(90deg, ${bg} 0%, #ffffff 30%)` }}
      >
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-paper-100 text-ink-400 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-soft"
          style={{ backgroundColor: bg, color: text, border: `1px solid ${hex}22` }}
        >
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-serif text-lg font-semibold text-ink-800 truncate">
            Generate {TYPE_LABELS[activeType].toLowerCase()}
          </h1>
          <p className="text-xs text-ink-400">
            {phase === 'config' && 'Configure your material'}
            {phase === 'generating' && 'Generating...'}
            {phase === 'refine' && `${turnsLeft} refinement ${turnsLeft === 1 ? 'turn' : 'turns'} left`}
            {phase === 'postsave' && `${savedMaterials.length} material${savedMaterials.length === 1 ? '' : 's'} created`}
          </p>
        </div>
        {phase === 'refine' && versions.length > 1 && (
          <div className="flex items-center gap-1 mr-2">
            <button
              onClick={() => setVersionIdx(Math.max(0, versionIdx - 1))}
              disabled={versionIdx === 0}
              className="p-1.5 rounded-lg hover:bg-paper-100 text-ink-400 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-ink-500 font-medium min-w-[3rem] text-center">
              {versionIdx + 1} / {versions.length}
            </span>
            <button
              onClick={() => setVersionIdx(Math.min(versions.length - 1, versionIdx + 1))}
              disabled={versionIdx === versions.length - 1}
              className="p-1.5 rounded-lg hover:bg-paper-100 text-ink-400 disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
        <button
          onClick={save}
          disabled={!draft || saved}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-40 hover:shadow-glow"
          style={{ backgroundColor: hex }}
        >
          {saved ? (
            <>
              <Check className="w-4 h-4" />
              Saved
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save
            </>
          )}
        </button>
      </header>

      {/* Two panels */}
      <div className="flex-1 flex min-h-0">
        {/* Left panel */}
        <div className="w-80 lg:w-96 shrink-0 border-r border-paper-200 bg-white flex flex-col">
          {phase === 'config' && (
            <ConfigPanel
              type={activeType}
              onTypeChange={(t) => {
                const defs = PARAMS_BY_TYPE[t] || [];
                const defaultParams: Record<string, ParamValue> = {};
                for (const d of defs) defaultParams[d.key] = d.default;
                setActiveType(t);
                setGenParams((prev) => ({ ...prev, title: '', params: defaultParams }));
              }}
              paramDefs={paramDefs}
              genParams={genParams}
              updateParam={updateParam}
              setGenParams={setGenParams}
              hex={hex}
              showAttachMenu={showAttachMenu}
              setShowAttachMenu={setShowAttachMenu}
              showUrlInput={showUrlInput}
              setShowUrlInput={setShowUrlInput}
              urlValue={urlValue}
              setUrlValue={setUrlValue}
              addAttachment={addAttachment}
              showTextInput={showTextInput}
              setShowTextInput={setShowTextInput}
              textValue={textValue}
              setTextValue={setTextValue}
              textName={textName}
              setTextName={setTextName}
              removeAttachment={removeAttachment}
              showMaterialPicker={showMaterialPicker}
              setShowMaterialPicker={setShowMaterialPicker}
              allSubjects={allSubjects}
              subjectMaterials={subjectMaterials}
              addMaterialAsAttachment={addMaterialAsAttachment}
              onGenerate={generate}
              fileInputRef={fileInputRef}
              fileInputAccept={fileInputAccept}
              handleFileSelect={handleFileSelect}
              triggerFileUpload={triggerFileUpload}
              imagePasteOpen={imagePasteOpen}
              setImagePasteOpen={setImagePasteOpen}
              pastedImage={pastedImage}
              setPastedImage={setPastedImage}
              pastedImageName={pastedImageName}
              setPastedImageName={setPastedImageName}
              addImageAttachment={addImageAttachment}
            />
          )}

          {phase === 'refine' && (
            <>
              <div className="px-4 py-3 border-b border-paper-200 flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-ink-400" />
                <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide">
                  Refine draft
                </p>
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 space-y-3">
                {refinementMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-ink-700 text-white rounded-tr-md'
                          : 'bg-paper-100 text-ink-600 rounded-tl-md'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-paper-200 p-3">
                <div className="flex items-end gap-2">
                  <textarea
                    value={refineInput}
                    onChange={(e) => setRefineInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        refine();
                      }
                    }}
                    placeholder="Ask to adjust the draft..."
                    rows={1}
                    disabled={turnsLeft <= 0 || !draft}
                    className="flex-1 bg-paper-50 border border-paper-300 rounded-xl px-3 py-2.5 text-sm text-ink-700 placeholder:text-ink-300 focus:outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-100 transition-all resize-none max-h-24 disabled:opacity-50"
                  />
                  <button
                    onClick={refine}
                    disabled={!refineInput.trim() || turnsLeft <= 0 || !draft}
                    className="p-2.5 rounded-xl text-white transition-all disabled:opacity-40 shrink-0 hover:shadow-glow"
                    style={{ backgroundColor: hex }}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                {turnsLeft <= 0 && (
                  <p className="text-xs text-amber-600 mt-2.5">
                    Refinement limit reached. Save this version or start a new session.
                  </p>
                )}
              </div>
            </>
          )}

          {phase === 'generating' && (
            <div className="flex-1 flex items-center justify-center px-6">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" style={{ color: hex }} />
                <p className="text-sm text-ink-500 font-medium">Working on it...</p>
                <p className="text-xs text-ink-400 mt-1">This won't take long</p>
              </div>
            </div>
          )}
        </div>

        {/* Right panel: progress / preview */}
        <div className="flex-1 overflow-y-auto scrollbar-thin bg-paper-50">
          <div className="max-w-3xl mx-auto px-4 lg:px-8 py-8">
            {phase === 'config' && (
              <div className="flex flex-col items-center justify-center py-32 text-center">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-card"
                  style={{ backgroundColor: bg, color: text }}
                >
                  <Settings2 className="w-7 h-7" />
                </div>
                <p className="text-sm text-ink-500 font-medium">Ready to generate</p>
                <p className="text-xs text-ink-400 mt-1 max-w-xs">
                  Set your parameters on the left, add sources, then click Generate to see your {TYPE_LABELS[activeType].toLowerCase()} here.
                </p>
              </div>
            )}

            {phase === 'generating' && (
              <div className="flex flex-col items-center justify-center py-32">
                <div className="w-full max-w-sm space-y-3">
                  {GEN_STEPS.map((step, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-3 transition-all ${
                        i <= genStep ? 'opacity-100' : 'opacity-30'
                      }`}
                    >
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all"
                        style={
                          i < genStep
                            ? { backgroundColor: hex, color: '#fff' }
                            : i === genStep
                            ? { backgroundColor: bg, color: text, border: `2px solid ${hex}` }
                            : { backgroundColor: '#fff', color: '#bbb', border: '2px solid #e5e0d5' }
                        }
                      >
                        {i < genStep ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : i === genStep ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <span className="text-[10px] font-medium">{i + 1}</span>
                        )}
                      </div>
                      <span
                        className={`text-sm ${
                          i <= genStep ? 'text-ink-600 font-medium' : 'text-ink-300'
                        }`}
                      >
                        {step}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {phase === 'refine' && draft && (
              <DraftPreview draft={draft} hex={hex} bg={bg} text={text} />
            )}

            {phase === 'postsave' && (
              <div className="max-w-2xl mx-auto py-8">
                {/* Saved materials summary */}
                {savedMaterials.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                      <Layers className="w-4 h-4" style={{ color: hex }} />
                      <h2 className="font-serif text-lg font-semibold text-ink-800">
                        Created in this session
                      </h2>
                    </div>
                    <div className="space-y-2">
                      {savedMaterials.map((m, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 bg-white rounded-xl border border-paper-200 px-4 py-3 shadow-soft"
                          style={{ borderLeft: `3px solid ${hex}` }}
                        >
                          <Check className="w-4 h-4 shrink-0" style={{ color: hex }} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-ink-700 truncate">{m.title}</p>
                            <p className="text-xs text-ink-400">{TYPE_LABELS[m.type]}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sources retained */}
                {genParams.attachments.length > 0 && (
                  <div className="mb-8 rounded-xl border border-paper-200 bg-paper-50 px-4 py-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Paperclip className="w-3.5 h-3.5 text-ink-400" />
                      <p className="text-xs font-medium text-ink-500">
                        {genParams.attachments.length} source{genParams.attachments.length === 1 ? '' : 's'} retained for next material
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {genParams.attachments.map((a) => (
                        <span
                          key={a.id}
                          className="text-xs bg-white border border-paper-200 rounded-lg px-2 py-1 text-ink-500"
                        >
                          {a.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Generate another type */}
                <div className="text-center mb-4">
                  <p className="text-sm font-medium text-ink-600 mb-1">
                    Generate another material from the same sources?
                  </p>
                  <p className="text-xs text-ink-400">
                    Pick a type below or close to finish.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {ALL_MATERIAL_TYPES.map((mt) => (
                    <button
                      key={mt}
                      onClick={() => startNewType(mt)}
                      className="group flex flex-col items-center gap-2.5 p-4 rounded-2xl border border-paper-200 bg-white hover:border-accent-400 hover:shadow-card transition-all"
                    >
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center transition-all group-hover:scale-105"
                        style={{ backgroundColor: bg, color: text }}
                      >
                        <RotateCw className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-medium text-ink-600 group-hover:text-ink-800">
                        {TYPE_LABELS[mt]}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="flex justify-center mt-8">
                  <button
                    onClick={onClose}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-ink-600 bg-paper-100 hover:bg-paper-200 border border-paper-200 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    Done — close studio
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Config Panel ---
function ConfigPanel({
  type,
  onTypeChange,
  paramDefs,
  genParams,
  updateParam,
  setGenParams,
  hex,
  showAttachMenu,
  setShowAttachMenu,
  showUrlInput,
  setShowUrlInput,
  urlValue,
  setUrlValue,
  addAttachment,
  showTextInput,
  setShowTextInput,
  textValue,
  setTextValue,
  textName,
  setTextName,
  removeAttachment,
  showMaterialPicker,
  setShowMaterialPicker,
  allSubjects,
  subjectMaterials,
  addMaterialAsAttachment,
  onGenerate,
  fileInputRef,
  fileInputAccept,
  handleFileSelect,
  triggerFileUpload,
  imagePasteOpen,
  setImagePasteOpen,
  pastedImage,
  setPastedImage,
  pastedImageName,
  setPastedImageName,
  addImageAttachment,
}: {
  type: MaterialType;
  onTypeChange: (t: MaterialType) => void;
  paramDefs: ParamDef[];
  genParams: GenParams;
  updateParam: (key: string, value: ParamValue) => void;
  setGenParams: React.Dispatch<React.SetStateAction<GenParams>>;
  hex: string;
  showAttachMenu: boolean;
  setShowAttachMenu: (v: boolean) => void;
  showUrlInput: string | null;
  setShowUrlInput: (v: string | null) => void;
  urlValue: string;
  setUrlValue: (v: string) => void;
  addAttachment: (type: AttachmentType, name: string, url?: string) => void;
  showTextInput: boolean;
  setShowTextInput: (v: boolean) => void;
  textValue: string;
  setTextValue: (v: string) => void;
  textName: string;
  setTextName: (v: string) => void;
  removeAttachment: (id: string) => void;
  showMaterialPicker: boolean;
  setShowMaterialPicker: (v: boolean) => void;
  allSubjects: { id: string; name: string; color: string }[];
  subjectMaterials: StudyMaterial[];
  addMaterialAsAttachment: (material: SM, subjectName: string) => void;
  onGenerate: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  fileInputAccept: string;
  handleFileSelect: (files: FileList | null) => void;
  triggerFileUpload: (accept?: string) => void;
  imagePasteOpen: boolean;
  setImagePasteOpen: (v: boolean) => void;
  pastedImage: string | null;
  setPastedImage: (v: string | null) => void;
  pastedImageName: string;
  setPastedImageName: (v: string) => void;
  addImageAttachment: (dataUrl: string, name: string) => void;
}) {
  const subjectName = allSubjects.find((s) => s.id === subjectMaterials[0]?.subjectId)?.name || 'this subject';

  const ATTACHMENT_ICONS: Record<AttachmentType, React.ReactNode> = {
    pdf: <FileText className="w-3 h-3 text-red-500" />,
    word: <FileText className="w-3 h-3 text-blue-600" />,
    excel: <FileSpreadsheet className="w-3 h-3 text-green-600" />,
    ppt: <Presentation className="w-3 h-3 text-orange-500" />,
    md: <Type className="w-3 h-3 text-ink-500" />,
    text: <Type className="w-3 h-3 text-ink-500" />,
    image: <ImageIcon className="w-3 h-3 text-purple-500" />,
    url: <Link className="w-3 h-3 text-accent-500" />,
    youtube: <Youtube className="w-3 h-3 text-red-500" />,
    audio: <FileText className="w-3 h-3 text-ink-400" />,
    video: <FileText className="w-3 h-3 text-ink-400" />,
  };

  function handleImagePaste(e: React.ClipboardEvent) {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = () => {
            setPastedImage(reader.result as string);
            setImagePasteOpen(true);
          };
          reader.readAsDataURL(file);
          return;
        }
      }
    }
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={fileInputAccept}
        multiple
        className="hidden"
        onChange={(e) => {
          handleFileSelect(e.target.files);
          e.target.value = '';
        }}
      />
      <div className="px-4 py-3 border-b border-paper-200 flex items-center gap-2">
        <Settings2 className="w-3.5 h-3.5 text-ink-400" />
        <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide">
          Configuration
        </p>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 space-y-5">
        {/* Material type selector */}
        <div>
          <label className="text-xs font-medium text-ink-500 mb-1.5 block">Material type</label>
          <div className="relative">
            <select
              value={type}
              onChange={(e) => onTypeChange(e.target.value as MaterialType)}
              className="w-full appearance-none bg-paper-50 border border-paper-300 rounded-xl pl-3 pr-9 py-2.5 text-sm font-medium text-ink-700 focus:outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-100 transition-all cursor-pointer"
            >
              {ALL_MATERIAL_TYPES.map((mt) => (
                <option key={mt} value={mt}>
                  {TYPE_LABELS[mt]}
                </option>
              ))}
            </select>
            <ChevronRight className="w-4 h-4 text-ink-400 absolute right-3 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="text-xs font-medium text-ink-500 mb-1.5 block">Title</label>
          <input
            value={genParams.title}
            onChange={(e) => setGenParams((prev) => ({ ...prev, title: e.target.value }))}
            placeholder={`Untitled ${TYPE_LABELS[type].toLowerCase()}`}
            className="w-full bg-paper-50 border border-paper-300 rounded-xl px-3 py-2.5 text-sm text-ink-700 placeholder:text-ink-300 focus:outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-100 transition-all"
          />
        </div>

        {/* Type-specific params */}
        {paramDefs.map((def) => (
          <div key={def.key}>
            <label className="text-xs font-medium text-ink-500 mb-1.5 block">{def.label}</label>
            {def.type === 'select' && (
              <select
                value={genParams.params[def.key] as string}
                onChange={(e) => updateParam(def.key, e.target.value)}
                className="w-full bg-paper-50 border border-paper-300 rounded-xl px-3 py-2.5 text-sm text-ink-700 focus:outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-100 transition-all"
              >
                {def.options?.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            )}
            {def.type === 'number' && (
              <input
                type="number"
                value={genParams.params[def.key] as number}
                min={def.min}
                max={def.max}
                onChange={(e) => updateParam(def.key, parseInt(e.target.value) || def.min || 0)}
                className="w-full bg-paper-50 border border-paper-300 rounded-xl px-3 py-2.5 text-sm text-ink-700 focus:outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-100 transition-all"
              />
            )}
            {def.type === 'text' && (
              <input
                value={genParams.params[def.key] as string}
                onChange={(e) => updateParam(def.key, e.target.value)}
                placeholder={def.label}
                className="w-full bg-paper-50 border border-paper-300 rounded-xl px-3 py-2.5 text-sm text-ink-700 placeholder:text-ink-300 focus:outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-100 transition-all"
              />
            )}
            {def.type === 'toggle' && (
              <button
                onClick={() => updateParam(def.key, !genParams.params[def.key])}
                className={`relative w-12 h-6 rounded-full transition-all ${
                  genParams.params[def.key] ? 'bg-accent-500' : 'bg-paper-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-soft transition-all ${
                    genParams.params[def.key] ? 'left-6' : 'left-0.5'
                  }`}
                />
              </button>
            )}
          </div>
        ))}

        {/* Additional instructions (all types) */}
        <div>
          <label className="text-xs font-medium text-ink-500 mb-1.5 block">
            Additional instructions
          </label>
          <textarea
            value={genParams.additionalInstructions}
            onChange={(e) =>
              setGenParams((prev) => ({ ...prev, additionalInstructions: e.target.value }))
            }
            placeholder="Any specific requirements, tone, or content to include..."
            rows={3}
            className="w-full bg-paper-50 border border-paper-300 rounded-xl px-3 py-2.5 text-sm text-ink-700 placeholder:text-ink-300 focus:outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-100 transition-all resize-none"
          />
        </div>

        {/* Sources */}
        <div
          onPaste={handleImagePaste}
        >
          <label className="text-xs font-medium text-ink-500 mb-1.5 block">Sources</label>

          {/* Attachment list */}
          {genParams.attachments.length > 0 && (
            <div className="space-y-1.5 mb-2">
              {genParams.attachments.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-2 bg-paper-100 rounded-lg px-2.5 py-2 text-xs border border-paper-200"
                >
                  {a.type === 'image' && a.dataUrl ? (
                    <img
                      src={a.dataUrl}
                      alt={a.name}
                      className="w-6 h-6 rounded object-cover shrink-0"
                    />
                  ) : (
                    ATTACHMENT_ICONS[a.type] || <Paperclip className="w-3 h-3 text-ink-400 shrink-0" />
                  )}
                  <span className="text-ink-600 flex-1 truncate">{a.name}</span>
                  {a.size && (
                    <span className="text-ink-300 text-[10px] shrink-0">
                      {a.size < 1024
                        ? `${a.size}B`
                        : a.size < 1024 * 1024
                        ? `${Math.round(a.size / 1024)}KB`
                        : `${Math.round(a.size / (1024 * 1024))}MB`}
                    </span>
                  )}
                  <button
                    onClick={() => removeAttachment(a.id)}
                    className="text-ink-300 hover:text-crimson-500 shrink-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* URL input */}
          {showUrlInput && (
            <div className="flex items-center gap-2 mb-2 bg-paper-100 rounded-xl px-3 py-2.5 border border-paper-200">
              <Link className="w-3.5 h-3.5 text-ink-400" />
              <input
                autoFocus
                value={urlValue}
                onChange={(e) => setUrlValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && urlValue.trim()) {
                    addAttachment(showUrlInput as AttachmentType, urlValue.trim(), urlValue.trim());
                  }
                  if (e.key === 'Escape') {
                    setShowUrlInput(null);
                    setUrlValue('');
                  }
                }}
                placeholder={showUrlInput === 'youtube' ? 'Paste YouTube URL...' : 'Paste URL...'}
                className="flex-1 bg-transparent text-sm text-ink-700 placeholder:text-ink-300 focus:outline-none"
              />
              <button
                onClick={() => {
                  if (urlValue.trim())
                    addAttachment(showUrlInput as AttachmentType, urlValue.trim(), urlValue.trim());
                }}
                className="text-xs font-medium text-accent-500 hover:text-accent-600"
              >
                Add
              </button>
            </div>
          )}

          {/* Text paste input */}
          {showTextInput && (
            <div className="mb-2 bg-paper-100 rounded-xl p-3 border border-paper-200">
              <input
                autoFocus
                value={textName}
                onChange={(e) => setTextName(e.target.value)}
                placeholder="Title (optional)"
                className="w-full bg-transparent text-sm text-ink-700 placeholder:text-ink-300 focus:outline-none mb-2"
              />
              <textarea
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                placeholder="Paste or type your text..."
                rows={4}
                className="w-full bg-white border border-paper-300 rounded-lg px-3 py-2 text-sm text-ink-700 placeholder:text-ink-300 focus:outline-none focus:border-accent-400 resize-none"
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => {
                    setShowTextInput(false);
                    setTextValue('');
                    setTextName('');
                  }}
                  className="text-xs text-ink-400 hover:text-ink-600"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (textValue.trim())
                      addAttachment('text', textName.trim() || 'Pasted text', textValue);
                  }}
                  className="text-xs font-medium text-accent-500 hover:text-accent-600"
                >
                  Add text
                </button>
              </div>
            </div>
          )}

          {/* Image paste preview */}
          {imagePasteOpen && pastedImage && (
            <div className="mb-2 bg-paper-100 rounded-xl p-3 border border-paper-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-ink-500">Pasted image</p>
                <button
                  onClick={() => {
                    setImagePasteOpen(false);
                    setPastedImage(null);
                    setPastedImageName('');
                  }}
                  className="text-ink-300 hover:text-ink-500"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <img
                src={pastedImage}
                alt="Pasted"
                className="w-full rounded-lg mb-2 max-h-40 object-contain border border-paper-200"
              />
              <input
                value={pastedImageName}
                onChange={(e) => setPastedImageName(e.target.value)}
                placeholder="Image name (optional)"
                className="w-full bg-white border border-paper-300 rounded-lg px-3 py-2 text-sm text-ink-700 placeholder:text-ink-300 focus:outline-none focus:border-accent-400 mb-2"
              />
              <div className="flex justify-end">
                <button
                  onClick={() => addImageAttachment(pastedImage, pastedImageName.trim() || 'Pasted image')}
                  className="text-xs font-medium text-accent-500 hover:text-accent-600"
                >
                  Attach image
                </button>
              </div>
            </div>
          )}

          {/* Attachment menu */}
          {showAttachMenu && !showUrlInput && !showTextInput && !imagePasteOpen && (
            <div className="mb-2 bg-white border border-paper-200 rounded-2xl shadow-lifted p-2.5 animate-scale-in">
              {/* Upload any file */}
              <button
                onClick={() => triggerFileUpload()}
                className="w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl hover:bg-paper-100 text-xs font-medium text-ink-600 transition-colors mb-1 border-b border-paper-100"
              >
                <Upload className="w-4 h-4 text-accent-500" />
                <span>Upload file (PDF, Word, Excel, PPT, MD, text, image)</span>
              </button>

              {/* File type shortcuts */}
              <div className="grid grid-cols-4 gap-1 mb-1">
                {ATTACHMENT_TYPES.map((a) => (
                  <button
                    key={a.type}
                    onClick={() => {
                      if (a.type === 'url' || a.type === 'youtube') {
                        setShowUrlInput(a.type);
                      } else if (a.accept) {
                        triggerFileUpload(a.accept);
                      }
                    }}
                    className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl hover:bg-paper-100 transition-colors"
                  >
                    <span className="text-ink-500">{a.icon}</span>
                    <span className="text-xs text-ink-500">{a.label}</span>
                  </button>
                ))}
              </div>

              {/* Paste text */}
              <button
                onClick={() => setShowTextInput(true)}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl hover:bg-paper-100 text-xs text-ink-500 transition-colors border-t border-paper-100"
              >
                <Clipboard className="w-3.5 h-3.5" />
                <span>Paste text</span>
              </button>

              {/* Paste image (from clipboard) */}
              <button
                onClick={() => {
                  navigator.clipboard
                    .read()
                    .then((items) => {
                      for (const item of items) {
                        for (const type of item.types) {
                          if (type.startsWith('image/')) {
                            item.getType(type).then((blob) => {
                              const reader = new FileReader();
                              reader.onload = () => {
                                setPastedImage(reader.result as string);
                                setImagePasteOpen(true);
                              };
                              reader.readAsDataURL(blob);
                            });
                            return;
                          }
                        }
                      }
                      alert('No image found in clipboard. Copy an image first, then click this again.');
                    })
                    .catch(() => {
                      alert('Clipboard access denied. You can also paste an image directly into the Sources area (Ctrl+V).');
                    });
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl hover:bg-paper-100 text-xs text-ink-500 transition-colors"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Paste image from clipboard</span>
              </button>

              {/* Attach existing material */}
              <button
                onClick={() => setShowMaterialPicker(true)}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl hover:bg-paper-100 text-xs text-ink-500 transition-colors border-t border-paper-100"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Attach existing study material</span>
              </button>
            </div>
          )}

          {/* Add source button */}
          {!showAttachMenu && (
            <button
              onClick={() => setShowAttachMenu(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium bg-paper-100 hover:bg-paper-200 text-ink-600 transition-colors border border-paper-200 w-full"
            >
              <Plus className="w-3.5 h-3.5" />
              Add source
            </button>
          )}

          {/* Material picker */}
          {showMaterialPicker && (
            <div className="mb-2 bg-white border border-paper-200 rounded-2xl shadow-lifted p-3 animate-scale-in">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-ink-500">Select a study material</p>
                <button
                  onClick={() => setShowMaterialPicker(false)}
                  className="text-ink-300 hover:text-ink-500"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              {subjectMaterials.length === 0 ? (
                <p className="text-xs text-ink-400 py-2">No existing materials in this subject.</p>
              ) : (
                <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-thin">
                  {subjectMaterials.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => addMaterialAsAttachment(m, subjectName)}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-paper-100 text-xs text-ink-600 transition-colors text-left"
                    >
                      <FileText className="w-3 h-3 text-ink-400 shrink-0" />
                      <span className="truncate">{m.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Web search toggle */}
        <div className="flex items-center justify-between rounded-xl border border-paper-200 bg-paper-50 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-accent-500" />
            <div>
              <p className="text-xs font-semibold text-ink-700">Web search</p>
              <p className="text-[11px] text-ink-400">Include up-to-date web sources</p>
            </div>
          </div>
          <button
            onClick={() =>
              setGenParams((prev) => ({ ...prev, webSearch: !prev.webSearch }))
            }
            className={`relative w-11 h-6 rounded-full transition-all shrink-0 ${
              genParams.webSearch ? 'bg-accent-500' : 'bg-ink-200'
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-soft transition-all ${
                genParams.webSearch ? 'left-[22px]' : 'left-0.5'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Generate button */}
      <div className="border-t border-paper-200 p-3">
        <button
          onClick={onGenerate}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-white transition-all hover:shadow-glow"
          style={{ backgroundColor: hex }}
        >
          <Sparkles className="w-4 h-4" />
          Generate {TYPE_LABELS[type].toLowerCase()}
        </button>
      </div>
    </>
  );
}

function DraftPreview({
  draft,
  hex,
  bg,
  text,
}: {
  draft: StudyMaterial;
  hex: string;
  bg: string;
  text: string;
}) {
  if (draft.contentMarkdown) {
    return (
      <div className="prose-studesk bg-white rounded-2xl border border-paper-200 p-8 shadow-card">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {draft.contentMarkdown}
        </ReactMarkdown>
      </div>
    );
  }
  if (draft.contentHtml) {
    return (
      <div className="bg-white rounded-2xl border border-paper-200 overflow-hidden shadow-card">
        <iframe
          srcDoc={draft.contentHtml}
          title="Preview"
          sandbox="allow-same-origin"
          className="w-full border-0"
          style={{ minHeight: '500px' }}
        />
      </div>
    );
  }
  if (draft.flashcards) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {draft.flashcards.map((c) => (
          <div
            key={c.id}
            className="bg-white rounded-2xl border border-paper-200 p-5 shadow-soft card-hover"
            style={{ borderTop: `3px solid ${hex}` }}
          >
            <div
              className="text-xs font-medium px-2 py-0.5 rounded-md inline-block mb-3"
              style={{ backgroundColor: bg, color: text }}
            >
              Card
            </div>
            <p className="text-sm font-medium text-ink-700 mb-3">{c.front}</p>
            <div className="border-t border-paper-200 pt-3">
              <p className="text-sm text-ink-500 leading-relaxed">{c.back}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (draft.quiz) {
    return (
      <div className="space-y-4">
        {draft.quiz.map((q, i) => (
          <div
            key={q.id}
            className="bg-white rounded-2xl border border-paper-200 p-5 shadow-soft"
          >
            <div className="flex items-start gap-3 mb-3">
              <span
                className="font-serif text-sm font-semibold w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-soft"
                style={{ backgroundColor: bg, color: text }}
              >
                {i + 1}
              </span>
              <p className="text-sm font-medium text-ink-700 pt-0.5">{q.question}</p>
            </div>
            <div className="space-y-2 ml-10">
              {q.options.map((opt, oi) => (
                <div
                  key={oi}
                  className={`text-sm px-3.5 py-2 rounded-xl border transition-all ${
                    q.correctAnswer.includes(opt)
                      ? 'border-accent-400 bg-accent-50 text-accent-700'
                      : 'border-paper-300 text-ink-600'
                  }`}
                >
                  {opt}
                </div>
              ))}
              {q.type === 'short' && (
                <div className="text-sm text-ink-400 italic px-3.5 py-2">
                  Short answer: {q.correctAnswer[0]}
                </div>
              )}
              {q.explanation && (
                <p className="text-xs text-ink-400 mt-2.5 px-3.5">{q.explanation}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (draft.slides) {
    return (
      <div className="space-y-3">
        {draft.slides.map((s) => (
          <div
            key={s.slideNumber}
            className="bg-white rounded-2xl border border-paper-200 p-6 shadow-soft card-hover"
            style={{ borderTop: `3px solid ${hex}` }}
          >
            <div className="flex items-center gap-2 mb-4">
              <span
                className="text-xs font-medium px-2.5 py-1 rounded-md"
                style={{ backgroundColor: bg, color: text }}
              >
                Slide {s.slideNumber}
              </span>
            </div>
            <h3 className="font-serif text-lg font-semibold text-ink-800 mb-3">
              {s.title}
            </h3>
            <ul className="space-y-2.5">
              {s.points.map((p, pi) => (
                <li
                  key={pi}
                  className="flex items-start gap-2.5 text-sm text-ink-600 leading-relaxed"
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                    style={{ backgroundColor: hex }}
                  />
                  {p}
                </li>
              ))}
            </ul>
            {s.notes && (
              <div className="mt-5 p-3.5 rounded-xl bg-paper-50 border border-paper-200">
                <p className="text-xs text-ink-400 font-medium mb-1">
                  Speaker notes
                </p>
                <p className="text-sm text-ink-500 leading-relaxed">{s.notes}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="text-center py-16 text-ink-400 text-sm">
      No preview available
    </div>
  );
}

// --- Mock content generator ---
function generateMockContent(
  type: MaterialType,
  subjectId: string,
  params: GenParams,
): StudyMaterial {
  const now = Date.now();
  const base = {
    id: uid(),
    subjectId,
    createdAt: now,
    updatedAt: now,
  };
  const title = params.title.trim() || `${TYPE_LABELS[type]} — Generated`;
  const detail = params.params.detail as string | undefined;
  const difficulty = params.params.difficulty as string | undefined;
  const count = params.params.count as number | undefined;
  const focus = (params.params.focus as string | undefined) || '';
  const extra = params.additionalInstructions.trim();
  const sourceCount = params.attachments.length;
  const webNote = params.webSearch ? ' Web sources were incorporated for up-to-date information.' : '';
  const sourceNote = sourceCount > 0 ? ` Based on ${sourceCount} attached source${sourceCount > 1 ? 's' : ''}.${webNote}` : webNote;

  switch (type) {
    case 'notes':
      return {
        ...base,
        type: 'notes',
        title,
        contentMarkdown: `# ${title}

## Introduction

This study guide covers the fundamental concepts${sourceNote}. Use this as a reference for exam preparation and assignment work.

## Core Principles

### 1. Fundamental Framework

The subject rests on **three foundational principles** that interconnect throughout the material:

- **Principle of continuity** — systems maintain equilibrium through feedback loops
- **Principle of adaptation** — structures evolve in response to environmental pressures
- **Principle of interdependence** — components cannot be fully understood in isolation

${focus ? `### Focus: ${focus}\n\nThis section emphasizes ${focus} as requested.\n\n` : ''}### 2. Key Terminology

| Term | Definition | Example |
|---|---|---|
| Homeostasis | Self-regulating process maintaining internal stability | Body temperature regulation |
| Equilibrium | State of balance between opposing forces | Chemical reaction at rest |
| Adaptation | Trait modification enhancing survival | Camouflage in prey species |

### 3. Processes and Mechanisms

The primary process follows a **four-stage cycle**:

1. **Stimulus** — external or internal change detected
2. **Processing** — information evaluated against existing patterns
3. **Response** — appropriate action initiated
4. **Feedback** — outcome informs future processing

> **Mnemonic:** "Some People Remember Facts" — Stimulus, Processing, Response, Feedback

## Summary

The material emphasizes that understanding comes from seeing connections, not memorizing facts in isolation.${extra ? `\n\n**Note:** ${extra}` : ''}

---

*Review this material before your exam. Cross-reference with your lecture notes for completeness.*`,
      };

    case 'cheatsheet':
      return {
        ...base,
        type: 'cheatsheet',
        title,
        contentMarkdown: `# ${title}

## Core Principles

| Concept | Key Idea |
|---|---|
| **Continuity** | Equilibrium via feedback loops |
| **Adaptation** | Evolution under pressure |
| **Interdependence** | Parts only make sense in context |

## Four-Stage Cycle

**S**timulus → **P**rocessing → **R**esponse → **F**eedback

> Mnemonic: **S**ome **P**eople **R**emember **F**acts

${focus ? `## Focus: ${focus}\n\n${focus} — key points at a glance.\n\n` : ''}## Key Terms

- **Homeostasis** — self-regulating stability (e.g. body temp)
- **Equilibrium** — balance of opposing forces
- **Adaptation** — trait change for survival

## Common Pitfalls

1. Treating principles as independent — they interact
2. Skipping feedback stage — no learning
3. Confusing equilibrium with stasis — it's active

${extra ? `> **Additional:** ${extra}\n\n` : ''}---

*Compact reference for last-minute review.${sourceNote}*`,
      };

    case 'infographic':
      return {
        ...base,
        type: 'infographic',
        title,
        contentHtml: `<!DOCTYPE html><html><head><style>
          body { font-family: 'Inter', system-ui, sans-serif; padding: 40px; background: #faf8f4; margin: 0; }
          h1 { font-family: 'Fraunces', Georgia, serif; font-size: 28px; color: #1c1c19; text-align: center; margin-bottom: 8px; }
          .subtitle { text-align: center; font-size: 12px; color: #52524c; margin-bottom: 30px; }
          .container { max-width: 700px; margin: 0 auto; }
          .flow { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 30px; }
          .step { background: white; border: 2px solid #3a8068; border-radius: 12px; padding: 16px 12px; text-align: center; flex: 1; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
          .step h3 { font-size: 14px; color: #2c664f; margin: 0 0 4px 0; }
          .step p { font-size: 11px; color: #52524c; margin: 0; }
          .arrow { color: #3a8068; font-size: 20px; }
          .compare { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
          .col { background: white; border-radius: 12px; padding: 20px; border: 1px solid #ebe5da; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
          .col h3 { font-family: 'Fraunces', serif; font-size: 16px; color: #1c1c19; margin: 0 0 12px 0; }
          .col ul { padding-left: 16px; margin: 0; }
          .col li { font-size: 12px; color: #3a3a35; margin-bottom: 6px; }
          .stat { text-align: center; padding: 20px; background: #e8f3f0; border-radius: 12px; }
          .stat .num { font-family: 'Fraunces', serif; font-size: 36px; color: #2c664f; font-weight: 600; }
          .stat .label { font-size: 12px; color: #52524c; }
          .meta { text-align: center; font-size: 10px; color: #aaa; margin-top: 24px; }
        </style></head><body><div class="container">
          <h1>${title}</h1>
          <div class="subtitle">Type: ${params.params.infographicType} | ${params.params.pageSize} ${params.params.orientation} | ${params.params.color === 'bw' ? 'B/W' : 'Color'}${params.params.printFriendly ? ' | Print-friendly' : ''}</div>
          <div class="flow">
            <div class="step"><h3>Stimulus</h3><p>Change detected</p></div>
            <div class="arrow">&rarr;</div>
            <div class="step"><h3>Processing</h3><p>Pattern matching</p></div>
            <div class="arrow">&rarr;</div>
            <div class="step"><h3>Response</h3><p>Action taken</p></div>
            <div class="arrow">&rarr;</div>
            <div class="step"><h3>Feedback</h3><p>Loop closed</p></div>
          </div>
          <div class="compare">
            <div class="col"><h3>Approach A</h3><ul><li>Fast initial response</li><li>High energy cost</li><li>Moderate accuracy</li><li>Rigid structure</li></ul></div>
            <div class="col"><h3>Approach B</h3><ul><li>Slower, deliberate</li><li>Energy efficient</li><li>High accuracy</li><li>Flexible design</li></ul></div>
          </div>
          <div class="stat"><div class="num">4</div><div class="label">interconnected stages</div></div>
          ${params.params.infographicInfo ? `<p style="text-align:center;font-size:12px;color:#52524c;margin-top:16px;">${params.params.infographicInfo}</p>` : ''}
          ${extra ? `<p style="text-align:center;font-size:11px;color:#888;margin-top:12px;">${extra}</p>` : ''}
          <div class="meta">${sourceNote}</div>
        </div></body></html>`,
      };

    case 'flashcards': {
      const numCards = count || 10;
      const diffLabel = difficulty || 'intermediate';
      const cards: Flashcard[] = [];
      const fronts = [
        'What is homeostasis?',
        'Define equilibrium in the context of opposing forces.',
        'What are the four stages of the process cycle?',
        'What is the mnemonic for the four stages?',
        'How does Approach A differ from Approach B in speed?',
        'What is the principle of interdependence?',
        'What does the principle of continuity state?',
        'Give an example of adaptation.',
        'What happens if the feedback stage is skipped?',
        'Why is equilibrium considered active rather than static?',
      ];
      const backs = [
        'A self-regulating process by which a system maintains internal stability while adjusting to external conditions.',
        'A state of balance where competing forces are equal, resulting in no net change.',
        '1. Stimulus — 2. Processing — 3. Response — 4. Feedback',
        '"Some People Remember Facts" — Stimulus, Processing, Response, Feedback',
        'Approach A has a faster initial response, while Approach B is slower but more deliberate and accurate.',
        'Components within a system cannot be fully understood in isolation — they must be studied in relation to each other.',
        'Systems maintain equilibrium through continuous feedback loops; stability is an active, ongoing process.',
        'Camouflage in prey species is a trait modification that enhances survival.',
        'The system loses its ability to learn from experience and adapt future responses.',
        'Because the system constantly monitors deviations and initiates corrective actions — it is never truly at rest.',
      ];
      for (let i = 0; i < numCards; i++) {
        cards.push({
          id: uid(),
          front: fronts[i % fronts.length],
          back: backs[i % backs.length],
        });
      }
      return {
        ...base,
        type: 'flashcards',
        title,
        flashcards: cards,
      };
    }

    case 'quiz': {
      const numQ = count || 5;
      const qType = params.params.qType as string;
      const diff = difficulty || 'intermediate';
      const questions: QuizQuestion[] = [];
      const templates: { q: string; type: 'single' | 'multi' | 'short'; options: string[]; correct: string[]; exp: string }[] = [
        {
          q: 'Which of the following best describes homeostasis?',
          type: 'single',
          options: ['A one-time adjustment', 'A self-regulating process maintaining internal stability', 'A breakdown of regulation', 'A single stimulus response'],
          correct: ['A self-regulating process maintaining internal stability'],
          exp: 'Homeostasis is ongoing and self-regulating.',
        },
        {
          q: 'Select all stages of the process cycle:',
          type: 'multi',
          options: ['Stimulus', 'Processing', 'Synthesis', 'Response', 'Feedback'],
          correct: ['Stimulus', 'Processing', 'Response', 'Feedback'],
          exp: 'Synthesis is not part of this cycle.',
        },
        {
          q: 'Briefly explain the principle of interdependence.',
          type: 'short',
          options: [],
          correct: ['Components cannot be understood in isolation; they must be studied in relation to each other.'],
          exp: 'Interdependence means system components affect each other.',
        },
        {
          q: 'Which approach is more energy efficient?',
          type: 'single',
          options: ['Approach A', 'Approach B', 'Both are equal', 'Neither uses energy'],
          correct: ['Approach B'],
          exp: 'Approach B is energy efficient; Approach A has high consumption.',
        },
        {
          q: 'What is the mnemonic for the four stages?',
          type: 'short',
          options: [],
          correct: ['Some People Remember Facts'],
          exp: 'Stimulus, Processing, Response, Feedback.',
        },
      ];
      for (let i = 0; i < numQ; i++) {
        const t = templates[i % templates.length];
        let useType = t.type;
        if (qType === 'single') useType = 'single';
        if (qType === 'multi') useType = 'multi';
        if (qType === 'short') useType = 'short';
        questions.push({
          id: uid(),
          question: t.q,
          type: useType,
          options: useType === 'short' ? [] : t.options,
          correctAnswer: t.correct,
          explanation: t.exp,
        });
      }
      return {
        ...base,
        type: 'quiz',
        title,
        quiz: questions,
      };
    }

    case 'assignment': {
      const wc = params.params.wordCount as number;
      const fmt = params.params.format as string;
      const cite = params.params.citation as string;
      const citeNote = cite !== 'none' ? ` (Formatted in ${cite.toUpperCase()} style)` : '';
      return {
        ...base,
        type: 'assignment',
        title,
        contentMarkdown: `# ${title}

**Student Name:** ____________________  
**Course:** ____________________  
**Date:** ____________________

---

## 1. Introduction

This paper examines the fundamental principles${sourceNote}.${citeNote} The objective is to analyze how these principles interact and to evaluate the comparative strengths of different methodological approaches.

## 2. The Three Foundational Principles

### 2.1 Principle of Continuity
Systems maintain equilibrium through continuous feedback loops. Stability is not static but an **active, ongoing process**.

### 2.2 Principle of Adaptation
Structures evolve in response to environmental pressures, requiring flexibility in analysis and application.

### 2.3 Principle of Interdependence
Components within a system cannot be fully understood in isolation. Any change ripples through the entire network.

## 3. Comparative Analysis

| Criterion | Approach A | Approach B |
|---|---|---|
| Speed | Faster | Slower, deliberate |
| Energy | High | Efficient |
| Accuracy | Moderate | High |

## 4. Conclusion

The three principles form a coherent framework for understanding system behavior.${extra ? `\n\n**Note:** ${extra}` : ''}

---

> **Important:** This is a writing-assistant draft (~${wc} words, ${fmt} format). Review carefully before submitting.

## References

[${cite === 'none' ? 'Add references as needed.' : `Add ${cite.toUpperCase()}-formatted references here.`}]`,
      };
    }

    case 'presentation': {
      const numSlides = count || 5;
      const tone = params.params.tone as string;
      const slides: PresentationSlide[] = [];
      const slideTemplates = [
        { title: `${title}`, points: ['Core principles and processes', 'Comparative analysis', 'Practical applications'], notes: `Welcome the audience. Set context. Tone: ${tone}.` },
        { title: 'Three Foundational Principles', points: ['Continuity — equilibrium through feedback loops', 'Adaptation — evolution in response to pressure', 'Interdependence — components in context'], notes: 'Emphasize interconnection. Ask for examples.' },
        { title: 'The Four-Stage Process Cycle', points: ['Stimulus: change detected', 'Processing: pattern evaluation', 'Response: action initiated', 'Feedback: outcome informs future'], notes: 'Walk through each stage. Use mnemonic.' },
        { title: 'Approach A vs. Approach B', points: ['A: fast, high energy, moderate accuracy', 'B: slower, efficient, high accuracy', 'Context determines the better choice'], notes: 'Ask audience which they would choose.' },
        { title: 'Key Takeaways', points: ['Systems are dynamic', 'Principles interact', 'Process cycle enables learning', 'Choose approaches contextually'], notes: 'Close with call to action. Thank audience.' },
        { title: 'Questions & Discussion', points: ['Open floor for questions', 'Reference key concepts', 'Connect to real-world examples'], notes: 'Facilitate discussion.' },
        { title: 'Further Reading', points: ['Core textbook chapters', 'Supplementary articles', 'Online resources'], notes: 'Point to resources.' },
      ];
      for (let i = 0; i < numSlides; i++) {
        const t = slideTemplates[i % slideTemplates.length];
        slides.push({
          slideNumber: i + 1,
          title: t.title,
          points: t.points,
          notes: t.notes,
        });
      }
      return {
        ...base,
        type: 'presentation',
        title,
        slides,
      };
    }

    case 'other':
      return {
        ...base,
        type: 'other',
        title,
        sourceSnippet: `Generated snippet.${sourceNote}${extra ? ` Additional: ${extra}` : ''}`,
      };
  }
}
