import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Paperclip,
  Send,
  FileText,
  Link,
  Youtube,
  ImageIcon,
  Music,
  Video,
  Type,
  X,
  Sparkles,
  Bookmark,
  Globe,
  BookOpen,
  Check,
  ChevronDown,
  FileQuestion,
  Trash2,
  Plus,
  MessageSquare,
  Pencil,
  PanelLeftOpen,
  PanelLeftClose,
  Download,
  Upload,
  FileJson,
  FileDown,
  Maximize2,
  Minimize2,
  Camera,
  Loader2,
  Copy,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { db, uid } from '@/db/database';
import { useConversations, useConversationMessages, useAllSubjects, useMaterials } from '@/hooks/useQueries';
import { useAppState, toggleAIPanelFullscreen, setAIPanelOpen } from '@/store/appState';
import { COLOR_HEX, COLOR_LIGHT, COLOR_TEXT } from '@/utils/colors';
import { askAI } from '@/utils/aiClient';
import { fetchUrlContent, extractUrls } from '@/utils/webReader';
import type { ChatMessage, ChatConversation, Attachment, AttachmentType, StudyMaterial } from '@/types';

const ATTACHMENT_TYPES: { type: AttachmentType; label: string; icon: React.ReactNode }[] = [
  { type: 'pdf', label: 'PDF', icon: <FileText className="w-4 h-4" /> },
  { type: 'text', label: 'Text', icon: <Type className="w-4 h-4" /> },
  { type: 'url', label: 'URL', icon: <Link className="w-4 h-4" /> },
  { type: 'youtube', label: 'YouTube', icon: <Youtube className="w-4 h-4" /> },
  { type: 'image', label: 'Image', icon: <ImageIcon className="w-4 h-4" /> },
  { type: 'audio', label: 'Audio', icon: <Music className="w-4 h-4" /> },
  { type: 'video', label: 'Video', icon: <Video className="w-4 h-4" /> },
];

async function extractTextFromImage(dataUrl: string, onProgress?: (p: number) => void): Promise<string> {
  const Tesseract = await import('tesseract.js');
  const worker = await Tesseract.createWorker('eng', 1, {
    logger: (m: { status: string; progress: number }) => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(Math.round(m.progress * 100));
      }
    },
  });
  const result = await worker.recognize(dataUrl);
  await worker.terminate();
  return result.data.text.trim();
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function readFileAsText(file: File): Promise<string> {
  return await file.text();
}

export function AskAIPanel() {
  const { aiPanelFullscreen } = useAppState();
  const conversations = useConversations();
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const messages = useConversationMessages(activeConversationId);
  const allSubjects = useAllSubjects();
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState<string | null>(null);
  const [urlValue, setUrlValue] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const [textValue, setTextValue] = useState('');
  const [textName, setTextName] = useState('');
  const [webSearch, setWebSearch] = useState(false);
  const [chatWithPage, setChatWithPage] = useState(false);
  const [contextSubjectIds, setContextSubjectIds] = useState<string[]>([]);
  const [showContextPicker, setShowContextPicker] = useState(false);
  const [showMaterialPicker, setShowMaterialPicker] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [isThinking, setIsThinking] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileAccept, setFileAccept] = useState('image/*,text/*,.pdf');
  const scrollRef = useRef<HTMLDivElement>(null);

  const contextSubjects = allSubjects.filter((s) => contextSubjectIds.includes(s.id));

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  function toggleContext(subjectId: string) {
    setContextSubjectIds((prev) =>
      prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId],
    );
  }

  async function createNewConversation(): Promise<string> {
    const now = Date.now();
    const conv: ChatConversation = {
      id: uid(),
      title: 'New chat',
      createdAt: now,
      updatedAt: now,
    };
    await db.conversations.add(conv);
    setActiveConversationId(conv.id);
    return conv.id;
  }

  async function send() {
    if (!input.trim() && attachments.length === 0) return;

    let convId = activeConversationId;
    if (!convId) {
      convId = await createNewConversation();
    }

    const userMsg: ChatMessage = {
      id: uid(),
      conversationId: convId,
      subjectId: null,
      role: 'user',
      content: input.trim(),
      attachments: attachments.length > 0 ? attachments : undefined,
      contextSubjectIds: contextSubjectIds.length > 0 ? contextSubjectIds : undefined,
      webSearch,
      createdAt: Date.now(),
    };
    await db.messages.add(userMsg);

    // Update conversation title from first message
    const conv = await db.conversations.get(convId);
    if (conv && conv.title === 'New chat') {
      await db.conversations.update(convId, {
        title: input.trim().slice(0, 40) + (input.trim().length > 40 ? '...' : ''),
        updatedAt: Date.now(),
      });
    } else if (conv) {
      await db.conversations.update(convId, { updatedAt: Date.now() });
    }

    setInput('');
    setAttachments([]);

    setIsThinking(true);
    const promptText = input.trim();

    try {
      // Resolve any pending attachment texts
      const resolvedAttachmentTexts: string[] = [];
      for (const a of attachments) {
        if (a.textContent) {
          resolvedAttachmentTexts.push(a.textContent);
        } else if (a.url) {
          try {
            const fetched = await fetchUrlContent(a.url);
            resolvedAttachmentTexts.push(`--- Source: ${a.url} (${fetched.title || 'Page'}) ---\n${fetched.text}`);
          } catch (e) {
            console.warn('[AskAIPanel] Could not fetch attached URL content:', a.url, e);
          }
        }
      }

      // Check if user typed URLs directly in the prompt text
      const detectedUrls = extractUrls(promptText);
      for (const u of detectedUrls) {
        if (!attachments.some((a) => a.url === u)) {
          try {
            const fetched = await fetchUrlContent(u);
            resolvedAttachmentTexts.push(`--- Source URL: ${u} (${fetched.title || 'Page'}) ---\n${fetched.text}`);
          } catch (e) {
            console.warn('[AskAIPanel] Could not fetch prompt URL:', u, e);
          }
        }
      }

      const combinedSource = resolvedAttachmentTexts.join('\n\n---\n\n');

      // Build conversation history from existing messages for context
      const history = messages
        .slice(-20) // Last 20 messages for context window
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

      const aiText = await askAI(promptText, {
        sourceText: combinedSource || undefined,
        contextSubjectNames: contextSubjects.map((s) => s.name),
        history,
      });

      const assistantMsg: ChatMessage = {
        id: uid(),
        conversationId: convId,
        subjectId: null,
        role: "assistant",
        content: aiText,
        createdAt: Date.now(),
      };
      await db.messages.add(assistantMsg);
      await db.conversations.update(convId, { updatedAt: Date.now() });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const assistantMsg: ChatMessage = {
        id: uid(),
        conversationId: convId,
        subjectId: null,
        role: "assistant",
        content: `⚠️ AI error: ${msg}`,
        createdAt: Date.now(),
      };
      await db.messages.add(assistantMsg);
    } finally {
      setIsThinking(false);
    }
  }

  async function handleFileUpload(file: File) {
    const attType: AttachmentType = file.type.startsWith('image/')
      ? 'image'
      : file.type.startsWith('audio/')
      ? 'audio'
      : file.type.startsWith('video/')
      ? 'video'
      : file.type === 'application/pdf'
      ? 'pdf'
      : 'text';

    if (attType === 'image') {
      setOcrLoading(true);
      setOcrProgress(0);
      try {
        const dataUrl = await readFileAsDataUrl(file);
        const extractedText = await extractTextFromImage(dataUrl, setOcrProgress);
        addAttachment('image', file.name, undefined, { dataUrl, textContent: extractedText });
      } catch (e) {
        console.error('OCR failed:', e);
        addAttachment('image', file.name, undefined, { dataUrl: undefined });
      } finally {
        setOcrLoading(false);
        setOcrProgress(0);
      }
    } else if (attType === 'text' || attType === 'pdf') {
      try {
        const text = await readFileAsText(file);
        addAttachment(attType, file.name, undefined, { textContent: text.slice(0, 5000) });
      } catch {
        addAttachment(attType, file.name);
      }
    } else {
      addAttachment(attType, file.name);
    }
  }

  function addAttachment(type: AttachmentType, name: string, url?: string, extra?: { dataUrl?: string; textContent?: string }) {
    const tempId = uid();
    const att: Attachment = {
      id: tempId,
      type,
      name,
      url,
      dataUrl: extra?.dataUrl,
      textContent: extra?.textContent,
      addedAt: Date.now(),
    };
    setAttachments((prev) => [...prev, att]);
    setShowAttachMenu(false);
    setShowUrlInput(null);
    setUrlValue('');
    setShowTextInput(false);
    setTextValue('');
    setTextName('');

    if ((type === 'url' || type === 'youtube') && url && !extra?.textContent) {
      fetchUrlContent(url)
        .then((fetched) => {
          setAttachments((prev) =>
            prev.map((a) =>
              a.id === tempId
                ? { ...a, name: fetched.title || url, textContent: fetched.text }
                : a,
            ),
          );
        })
        .catch((e) => console.warn('[AskAIPanel] URL fetch failed:', e));
    }
  }

  function removeAttachment(id: string) {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }

  async function addMaterialAsAttachment(material: StudyMaterial, subjectName: string) {
    const att: Attachment = {
      id: uid(),
      type: 'text',
      name: `${subjectName}: ${material.title}`,
      url: undefined,
      textContent: material.contentMarkdown || material.sourceSnippet || '',
      addedAt: Date.now(),
    };
    setAttachments((prev) => [...prev, att]);
    setShowMaterialPicker(false);
  }

  async function deleteConversation(id: string) {
    const msgs = await db.messages.where('conversationId').equals(id).toArray();
    await db.messages.bulkDelete(msgs.map((m) => m.id));
    await db.conversations.delete(id);
    if (activeConversationId === id) {
      setActiveConversationId(null);
    }
  }

  async function renameConversation(id: string, newTitle: string) {
    await db.conversations.update(id, { title: newTitle.trim() || 'Untitled chat' });
  }

  async function exportConversation(conv: ChatConversation, format: 'text' | 'json') {
    const msgs = await db.messages.where('conversationId').equals(conv.id).toArray();
    msgs.sort((a, b) => a.createdAt - b.createdAt);
    let content: string;
    let filename: string;
    if (format === 'json') {
      content = JSON.stringify({ conversation: conv, messages: msgs }, null, 2);
      filename = `${sanitizeFilename(conv.title)}.json`;
    } else {
      const lines: string[] = [`# ${conv.title}`, `Date: ${new Date(conv.createdAt).toLocaleString()}`, ''];
      for (const m of msgs) {
        const role = m.role === 'user' ? 'You' : 'AI';
        const time = new Date(m.createdAt).toLocaleTimeString();
        lines.push(`[${time}] ${role}:`);
        lines.push(m.content);
        if (m.attachments?.length) {
          lines.push(`  Attachments: ${m.attachments.map((a) => a.name).join(', ')}`);
        }
        lines.push('');
      }
      content = lines.join('\n');
      filename = `${sanitizeFilename(conv.title)}.txt`;
    }
    downloadFile(filename, content);
  }

  async function exportAllConversations() {
    const allConvs = await db.conversations.toArray();
    const exportData: { conversation: ChatConversation; messages: ChatMessage[] }[] = [];
    for (const conv of allConvs) {
      const msgs = await db.messages.where('conversationId').equals(conv.id).toArray();
      msgs.sort((a, b) => a.createdAt - b.createdAt);
      exportData.push({ conversation: conv, messages: msgs });
    }
    const content = JSON.stringify({ exportedAt: new Date().toISOString(), conversations: exportData }, null, 2);
    downloadFile(`estudesk-chat-history-${Date.now()}.json`, content);
  }

  async function importConversations(file: File) {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data.conversations || !Array.isArray(data.conversations)) {
        throw new Error('Invalid format');
      }
      const newConvs: ChatConversation[] = [];
      const newMsgs: ChatMessage[] = [];
      for (const item of data.conversations) {
        const conv = item.conversation;
        const convId = uid();
        newConvs.push({
          id: convId,
          title: conv.title || 'Imported chat',
          createdAt: conv.createdAt || Date.now(),
          updatedAt: conv.updatedAt || Date.now(),
        });
        for (const msg of item.messages || []) {
          newMsgs.push({
            ...msg,
            id: uid(),
            conversationId: convId,
            subjectId: null,
          });
        }
      }
      await db.conversations.bulkAdd(newConvs);
      await db.messages.bulkAdd(newMsgs);
    } catch (e) {
      console.error('Import failed:', e);
    }
  }

  return (
    <div className="relative flex h-full bg-paper-50">
      {/* Conversation history sidebar — overlays the panel instead of pushing it */}
      {showHistory && (
        <>
          <div
            className="absolute inset-0 z-30"
            onClick={() => setShowHistory(false)}
          />
          <ConversationHistory
            conversations={conversations}
            activeId={activeConversationId}
            onSelect={(id) => {
              setActiveConversationId(id);
              setShowHistory(false);
            }}
            onNew={() => {
              createNewConversation();
              setShowHistory(false);
            }}
            onDelete={deleteConversation}
            onRename={renameConversation}
            onExport={exportConversation}
            onExportAll={exportAllConversations}
            onImport={importConversations}
            onClose={() => setShowHistory(false)}
          />
        </>
      )}

      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-paper-200 bg-white">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="p-1.5 rounded-lg hover:bg-paper-100 text-ink-400 hover:text-ink-600 transition-colors"
              title="Chat history"
            >
              {showHistory ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            </button>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center shadow-soft">
              <Sparkles className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h2 className="font-serif text-base font-semibold text-ink-800 leading-none">
                Ask AI
              </h2>
              <p className="text-[11px] text-ink-400 mt-1">
                {activeConversationId
                  ? conversations.find((c) => c.id === activeConversationId)?.title ?? 'Chat'
                  : 'New conversation'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleAIPanelFullscreen}
              className="p-1.5 rounded-lg hover:bg-paper-100 text-ink-400 hover:text-ink-600 transition-colors"
              title={aiPanelFullscreen ? 'Exit full page view' : 'Full page view'}
            >
              {aiPanelFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={() => {
                setActiveConversationId(null);
                setInput('');
                setAttachments([]);
                setContextSubjectIds([]);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-paper-100 hover:bg-paper-200 text-ink-600 transition-colors border border-paper-200"
              title="New chat"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New</span>
            </button>
            <button
              onClick={() => setAIPanelOpen(false)}
              className="p-1.5 rounded-lg hover:bg-crimson-50 text-ink-400 hover:text-crimson-500 transition-colors"
              title="Close panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Context bar */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-paper-200 bg-white/60 flex-wrap">
          <div className="relative">
            <button
              onClick={() => setShowContextPicker(!showContextPicker)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-paper-100 hover:bg-paper-200 text-ink-600 transition-colors border border-paper-200"
            >
              <BookOpen className="w-3.5 h-3.5 text-ink-400" />
              <span>
                {contextSubjectIds.length === 0
                  ? 'Add subject context'
                  : `${contextSubjectIds.length} subject${contextSubjectIds.length > 1 ? 's' : ''}`}
              </span>
              <ChevronDown className="w-3 h-3 text-ink-400" />
            </button>
            {showContextPicker && (
              <ContextPicker
                subjects={allSubjects}
                selectedIds={contextSubjectIds}
                onToggle={toggleContext}
                onClear={() => setContextSubjectIds([])}
                onClose={() => setShowContextPicker(false)}
              />
            )}
          </div>

          <button
            onClick={() => setWebSearch(!webSearch)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              webSearch
                ? 'bg-accent-50 text-accent-700 border-accent-200'
                : 'bg-paper-100 text-ink-500 border-paper-200 hover:bg-paper-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Web search</span>
            {webSearch && <Check className="w-3 h-3" />}
          </button>

          <button
            onClick={() => setChatWithPage(!chatWithPage)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              chatWithPage
                ? 'bg-accent-50 text-accent-700 border-accent-200'
                : 'bg-paper-100 text-ink-500 border-paper-200 hover:bg-paper-200'
            }`}
          >
            <FileQuestion className="w-3.5 h-3.5" />
            <span>Chat with page</span>
            {chatWithPage && <Check className="w-3 h-3" />}
          </button>
        </div>

        {/* Active context chips */}
        {contextSubjects.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-4 py-2 bg-paper-50 border-b border-paper-100">
            {contextSubjects.map((s) => (
              <span
                key={s.id}
                className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md font-medium"
                style={{ backgroundColor: COLOR_LIGHT[s.color], color: COLOR_TEXT[s.color] }}
              >
                {s.name}
                <button onClick={() => toggleContext(s.id)} className="hover:opacity-70">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="px-4 py-4">
            {messages.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-gradient-to-br from-accent-100 to-accent-200 text-accent-600 shadow-soft">
                  <Sparkles className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-ink-600 mb-1">Ask me anything</p>
                <p className="text-xs text-ink-400 max-w-xs mx-auto leading-relaxed">
                  Attach a subject for context, toggle web search, or paste material.
                  I can help you study, summarize, and generate materials.
                </p>
                <div className="mt-5 space-y-2 max-w-xs mx-auto">
                  {[
                    'Summarize my latest study materials',
                    'Create flashcards from my notes',
                    "Explain a concept I'm stuck on",
                  ].map((s) => (
                    <button
                      key={s}
                      onClick={() => setInput(s)}
                      className="w-full text-left text-xs text-ink-500 bg-white border border-paper-200 rounded-xl px-3 py-2.5 hover:border-accent-300 hover:text-accent-600 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} msg={msg} />
                ))}
                {isThinking && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-accent-50/50 border border-accent-200 text-xs text-accent-700 font-medium animate-pulse">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-accent-600" />
                    <span>Thinking and analyzing context...</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Input area */}
        <div className="border-t border-paper-200 bg-white px-4 py-3">
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2.5">
              {attachments.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-1.5 bg-paper-100 rounded-lg px-2.5 py-1.5 text-xs border border-paper-200"
                >
                  <AttachmentIcon type={a.type} />
                  <span className="text-ink-600 max-w-32 truncate">{a.name}</span>
                  <button
                    onClick={() => removeAttachment(a.id)}
                    className="text-ink-300 hover:text-ink-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {showUrlInput && (
            <div className="flex items-center gap-2 mb-2.5 bg-paper-100 rounded-xl px-3 py-2.5 border border-paper-200">
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
                placeholder="Paste URL..."
                className="flex-1 bg-transparent text-sm text-ink-700 placeholder:text-ink-300 focus:outline-none"
              />
              <button
                onClick={() => {
                  if (urlValue.trim()) addAttachment(showUrlInput as AttachmentType, urlValue.trim(), urlValue.trim());
                }}
                className="text-xs font-medium text-accent-500 hover:text-accent-600"
              >
                Add
              </button>
            </div>
          )}

          {showTextInput && (
            <div className="mb-2.5 bg-paper-100 rounded-xl p-3 border border-paper-200">
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
                    if (textValue.trim()) addAttachment('text', textName.trim() || 'Pasted text', textValue);
                  }}
                  className="text-xs font-medium text-accent-500 hover:text-accent-600"
                >
                  Add text
                </button>
              </div>
            </div>
          )}

          {showAttachMenu && !showUrlInput && !showTextInput && (
            <div className="mb-2.5 bg-white border border-paper-200 rounded-2xl shadow-lifted p-2.5 animate-scale-in">
              <div className="grid grid-cols-4 gap-1 mb-1">
                {ATTACHMENT_TYPES.map((a) => (
                  <button
                    key={a.type}
                    onClick={() => {
                      if (a.type === 'url' || a.type === 'youtube') {
                        setShowUrlInput(a.type);
                      } else if (a.type === 'text') {
                        setShowTextInput(true);
                      } else if (a.type === 'image' || a.type === 'pdf' || a.type === 'audio' || a.type === 'video') {
                        const acceptMap: Record<string, string> = {
                          image: 'image/*',
                          pdf: 'application/pdf,.pdf',
                          audio: 'audio/*',
                          video: 'video/*',
                        };
                        setFileAccept(acceptMap[a.type] || '*/*');
                        setShowAttachMenu(false);
                        setTimeout(() => fileInputRef.current?.click(), 0);
                      } else {
                        addAttachment(a.type, `New ${a.label}`);
                      }
                    }}
                    className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl hover:bg-paper-100 transition-colors"
                  >
                    <span className="text-ink-500">{a.icon}</span>
                    <span className="text-xs text-ink-500">{a.label}</span>
                  </button>
                ))}
              </div>
              <div className="border-t border-paper-200 pt-2 mt-1 space-y-0.5">
                <button
                  onClick={() => {
                    setShowAttachMenu(false);
                    setShowCamera(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs text-ink-600 hover:bg-paper-100 rounded-lg transition-colors"
                >
                  <Camera className="w-3.5 h-3.5 text-ink-400" />
                  Take photo (extract text with OCR)
                </button>
                <button
                  onClick={() => setShowMaterialPicker(!showMaterialPicker)}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs text-ink-600 hover:bg-paper-100 rounded-lg transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-ink-400" />
                  Attach from study materials
                </button>
              </div>
            </div>
          )}

          {showMaterialPicker && (
            <MaterialPicker
              subjects={allSubjects}
              onPick={addMaterialAsAttachment}
              onClose={() => setShowMaterialPicker(false)}
            />
          )}

          <div className="flex items-end gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept={fileAccept}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
                e.target.value = '';
              }}
            />
            <button
              onClick={() => {
                setShowAttachMenu(!showAttachMenu);
                setShowUrlInput(null);
                setShowTextInput(false);
                setShowMaterialPicker(false);
              }}
              className="p-2.5 rounded-xl hover:bg-paper-100 text-ink-400 transition-colors shrink-0"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Ask anything about your studies..."
              rows={1}
              className="flex-1 bg-paper-50 border border-paper-300 rounded-2xl px-4 py-2.5 text-sm text-ink-700 placeholder:text-ink-300 focus:outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-100 transition-all resize-none max-h-32"
            />
            <button
              onClick={send}
              disabled={!input.trim() && attachments.length === 0}
              className="p-2.5 rounded-xl text-white transition-all shrink-0 disabled:opacity-40 disabled:cursor-not-allowed bg-accent-500 hover:bg-accent-600 hover:shadow-glow"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {ocrLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-lifted px-6 py-5 flex flex-col items-center gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-accent-500" />
            <p className="text-sm font-medium text-ink-600">Extracting text from image...</p>
            {ocrProgress > 0 && (
              <div className="w-48 h-1.5 bg-paper-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent-500 rounded-full transition-all"
                  style={{ width: `${ocrProgress}%` }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {showCamera && (
        <CameraModal
          onClose={() => setShowCamera(false)}
          onCapture={async (dataUrl) => {
            setShowCamera(false);
            setOcrLoading(true);
            setOcrProgress(0);
            try {
              const extractedText = await extractTextFromImage(dataUrl, setOcrProgress);
              addAttachment('image', `Photo ${Date.now()}`, undefined, { dataUrl, textContent: extractedText });
            } catch (e) {
              console.error('OCR failed:', e);
              addAttachment('image', `Photo ${Date.now()}`, undefined, { dataUrl });
            } finally {
              setOcrLoading(false);
              setOcrProgress(0);
            }
          }}
        />
      )}
    </div>
  );
}

function CameraModal({
  onClose,
  onCapture,
}: {
  onClose: () => void;
  onCapture: (dataUrl: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
  }, [stream]);

  useEffect(() => {
    let active = true;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then((s) => {
        if (!active) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      })
      .catch(() => setError('Unable to access camera. Please check permissions.'));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    return () => stopStream();
  }, [stopStream]);

  function capture() {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/png');
    stopStream();
    onCapture(dataUrl);
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-lifted p-4 max-w-lg w-full mx-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-serif text-base font-semibold text-ink-700">Take Photo</h3>
          <button
            onClick={() => {
              stopStream();
              onClose();
            }}
            className="p-1.5 rounded-lg hover:bg-paper-100 text-ink-400 hover:text-ink-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {error ? (
          <div className="text-center py-8">
            <Camera className="w-8 h-8 text-ink-300 mx-auto mb-3" />
            <p className="text-sm text-ink-500">{error}</p>
          </div>
        ) : (
          <>
            <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>
            <div className="flex justify-center mt-3">
              <button
                onClick={capture}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-accent-500 hover:bg-accent-600 transition-colors shadow-soft"
              >
                <Camera className="w-4 h-4" />
                Capture & Extract Text
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ConversationHistory({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onRename,
  onExport,
  onExportAll,
  onImport,
  onClose,
}: {
  conversations: ChatConversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onExport: (conv: ChatConversation, format: 'text' | 'json') => void;
  onExportAll: () => void;
  onImport: (file: File) => void;
  onClose: () => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [exportMenuId, setExportMenuId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  function startEdit(conv: ChatConversation) {
    setEditingId(conv.id);
    setEditValue(conv.title);
  }

  function commitEdit() {
    if (editingId) {
      onRename(editingId, editValue);
    }
    setEditingId(null);
    setEditValue('');
  }

  return (
    <div className="absolute top-0 left-0 bottom-0 w-56 z-40 border-r border-paper-200 bg-white flex flex-col shadow-lifted animate-slide-in-left">
      <div className="flex items-center justify-between px-3 py-3 border-b border-paper-200">
        <span className="text-xs font-semibold text-ink-500 uppercase tracking-wide">Chats</span>
        <div className="flex items-center gap-0.5">
          <button
            onClick={onExportAll}
            className="p-1.5 rounded-lg hover:bg-paper-100 text-ink-400 hover:text-ink-600 transition-colors"
            title="Export all chats"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleImportClick}
            className="p-1.5 rounded-lg hover:bg-paper-100 text-ink-400 hover:text-ink-600 transition-colors"
            title="Import chats"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onNew}
            className="p-1.5 rounded-lg hover:bg-paper-100 text-ink-400 hover:text-accent-500 transition-colors"
            title="New chat"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onImport(file);
            e.target.value = '';
          }}
        />
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin py-1">
        {conversations.length === 0 ? (
          <div className="px-3 py-4 text-center">
            <MessageSquare className="w-6 h-6 text-ink-200 mx-auto mb-2" />
            <p className="text-xs text-ink-400">No conversations yet</p>
          </div>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.id}
              className={`group mx-1.5 mb-0.5 rounded-lg transition-colors ${
                activeId === conv.id ? 'bg-accent-50 border border-accent-100' : 'hover:bg-paper-100'
              }`}
            >
              {editingId === conv.id ? (
                <div className="px-2 py-1.5">
                  <input
                    autoFocus
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitEdit();
                      if (e.key === 'Escape') {
                        setEditingId(null);
                        setEditValue('');
                      }
                    }}
                    onBlur={commitEdit}
                    className="w-full bg-white border border-accent-300 rounded-md px-2 py-1 text-xs text-ink-700 focus:outline-none focus:border-accent-400"
                  />
                </div>
              ) : confirmDeleteId === conv.id ? (
                <div className="px-2 py-2">
                  <p className="text-xs text-ink-500 mb-2">Delete this chat?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        onDelete(conv.id);
                        setConfirmDeleteId(null);
                      }}
                      className="text-xs font-medium text-crimson-500 hover:text-crimson-600 px-2 py-1 rounded-md hover:bg-crimson-50"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="text-xs text-ink-400 hover:text-ink-600 px-2 py-1 rounded-md hover:bg-paper-100"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => onSelect(conv.id)}
                  className="flex items-center gap-2 px-2.5 py-2 cursor-pointer"
                >
                  <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${activeId === conv.id ? 'text-accent-500' : 'text-ink-300'}`} />
                  <span className={`flex-1 text-xs truncate ${activeId === conv.id ? 'text-accent-700 font-medium' : 'text-ink-600'}`}>
                    {conv.title}
                  </span>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExportMenuId(exportMenuId === conv.id ? null : conv.id);
                        }}
                        className="p-1 rounded hover:bg-paper-200 text-ink-300 hover:text-ink-500"
                        title="Export"
                      >
                        <Download className="w-3 h-3" />
                      </button>
                      {exportMenuId === conv.id && (
                        <div className="absolute right-0 top-full mt-1 z-50 bg-white rounded-lg border border-paper-300 shadow-lifted py-1 min-w-[120px] animate-scale-in">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onExport(conv, 'text');
                              setExportMenuId(null);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-ink-600 hover:bg-paper-100 transition-colors text-left"
                          >
                            <FileDown className="w-3.5 h-3.5 text-ink-400" />
                            Plain text
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onExport(conv, 'json');
                              setExportMenuId(null);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-ink-600 hover:bg-paper-100 transition-colors text-left"
                          >
                            <FileJson className="w-3.5 h-3.5 text-ink-400" />
                            JSON
                          </button>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEdit(conv);
                      }}
                      className="p-1 rounded hover:bg-paper-200 text-ink-300 hover:text-ink-500"
                      title="Rename"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDeleteId(conv.id);
                      }}
                      className="p-1 rounded hover:bg-crimson-50 text-ink-300 hover:text-crimson-500"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ContextPicker({
  subjects,
  selectedIds,
  onToggle,
  onClear,
  onClose,
}: {
  subjects: { id: string; name: string; color: import('@/types').SubjectColor }[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute top-full left-0 mt-1 bg-white rounded-xl border border-paper-300 shadow-lifted py-1.5 min-w-[220px] z-50 animate-scale-in max-h-64 overflow-y-auto scrollbar-thin"
    >
      <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-ink-300">
        Select subjects as context
      </div>
      {subjects.length === 0 ? (
        <div className="px-3 py-2 text-xs text-ink-400">No subjects yet</div>
      ) : (
        subjects.map((s) => {
          const selected = selectedIds.includes(s.id);
          return (
            <button
              key={s.id}
              onClick={() => onToggle(s.id)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-paper-100 transition-colors text-left"
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: COLOR_HEX[s.color] }}
              />
              <span className="flex-1 text-ink-600 truncate">{s.name}</span>
              {selected && <Check className="w-3.5 h-3.5 text-accent-500" />}
            </button>
          );
        })
      )}
      {selectedIds.length > 0 && (
        <>
          <div className="border-t border-paper-200 my-1" />
          <button
            onClick={onClear}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-ink-400 hover:bg-paper-100 transition-colors text-left"
          >
            <X className="w-3.5 h-3.5" />
            Clear all
          </button>
        </>
      )}
    </div>
  );
}

function MaterialPicker({
  subjects,
  onPick,
  onClose,
}: {
  subjects: import('@/types').Subject[];
  onPick: (material: StudyMaterial, subjectName: string) => void;
  onClose: () => void;
}) {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(
    subjects.length > 0 ? subjects[0].id : null,
  );
  const materials = useMaterials(selectedSubjectId);
  const subject = subjects.find((s) => s.id === selectedSubjectId);

  return (
    <div className="mb-2.5 bg-white border border-paper-200 rounded-2xl shadow-lifted p-3 animate-scale-in">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-ink-600">Attach study material</span>
        <button onClick={onClose} className="text-ink-300 hover:text-ink-500">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      {subjects.length === 0 ? (
        <p className="text-xs text-ink-400 py-2">No subjects available</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-1 mb-2.5">
            {subjects.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedSubjectId(s.id)}
                className={`text-xs px-2 py-1 rounded-md font-medium transition-colors ${
                  selectedSubjectId === s.id
                    ? 'bg-accent-100 text-accent-700'
                    : 'bg-paper-100 text-ink-400 hover:bg-paper-200'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
          {materials.length === 0 ? (
            <p className="text-xs text-ink-400 py-2">No materials in {subject?.name}</p>
          ) : (
            <div className="space-y-1 max-h-40 overflow-y-auto scrollbar-thin">
              {materials.map((m) => (
                <button
                  key={m.id}
                  onClick={() => onPick(m, subject?.name ?? 'Unknown')}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-xs text-ink-600 hover:bg-paper-100 rounded-lg transition-colors text-left"
                >
                  <FileText className="w-3.5 h-3.5 text-ink-400 shrink-0" />
                  <span className="truncate">{m.title}</span>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user';
  const [showSave, setShowSave] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(msg.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = msg.content;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function saveAsOther() {
    const material: StudyMaterial = {
      id: uid(),
      subjectId: msg.contextSubjectIds?.[0] ?? '',
      type: 'other',
      title: msg.content.slice(0, 50) + (msg.content.length > 50 ? '...' : ''),
      sourceSnippet: msg.content,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await db.materials.add(material);
  }

  return (
    <div
      className={`group flex gap-2.5 ${isUser ? 'flex-row-reverse' : ''} animate-slide-up`}
      onMouseEnter={() => setShowSave(true)}
      onMouseLeave={() => setShowSave(false)}
    >
      <div
        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-medium shadow-soft ${
          isUser
            ? 'bg-ink-700 text-white'
            : 'bg-gradient-to-br from-accent-400 to-accent-600 text-white'
        }`}
      >
        {isUser ? 'You' : <Sparkles className="w-4 h-4" />}
      </div>
      <div className={`max-w-[85%] ${isUser ? 'text-right' : ''}`}>
        {msg.contextSubjectIds && msg.contextSubjectIds.length > 0 && (
          <div className={`flex flex-wrap gap-1 mb-1 ${isUser ? 'justify-end' : ''}`}>
            {msg.contextSubjectIds.map((id) => (
              <ContextChip key={id} subjectId={id} />
            ))}
          </div>
        )}
        {msg.webSearch && (
          <div className={`flex items-center gap-1 mb-1 text-[10px] text-accent-500 ${isUser ? 'justify-end' : ''}`}>
            <Globe className="w-3 h-3" />
            Web search
          </div>
        )}
        <div
          className={`inline-block rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed text-left ${
            isUser
              ? 'bg-ink-700 text-white rounded-tr-md'
              : 'bg-white border border-paper-200 text-ink-700 rounded-tl-md shadow-soft'
          }`}
        >
          {msg.attachments && msg.attachments.length > 0 && (
            <div className={`flex flex-wrap gap-1.5 mb-2 pb-2 border-b ${isUser ? 'border-white/10' : 'border-paper-100'}`}>
              {msg.attachments.map((a) => (
                <span
                  key={a.id}
                  className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md ${isUser ? 'bg-white/10' : 'bg-paper-100 text-ink-600'}`}
                >
                  <AttachmentIcon type={a.type} />
                  {a.name}
                </span>
              ))}
            </div>
          )}
          {isUser ? (
            <p className="whitespace-pre-wrap">{msg.content}</p>
          ) : (
            <div className="prose prose-sm max-w-none text-ink-700 leading-relaxed break-words">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {msg.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Action bar (Copy + Save to materials) */}
        <div className={`flex items-center gap-2 mt-1.5 ${isUser ? 'justify-end' : 'ml-1'}`}>
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1 text-xs transition-colors px-1.5 py-0.5 rounded-md ${
              copied
                ? 'text-emerald-600 bg-emerald-50 font-medium'
                : 'text-ink-400 hover:text-ink-600 hover:bg-paper-100'
            }`}
            title="Copy content"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-500" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>

          {!isUser && showSave && (
            <button
              onClick={saveAsOther}
              className="flex items-center gap-1 text-xs text-ink-400 hover:text-ink-600 hover:bg-paper-100 px-1.5 py-0.5 rounded-md transition-colors"
              title="Save as study material"
            >
              <Bookmark className="w-3 h-3" />
              <span>Save</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ContextChip({ subjectId }: { subjectId: string }) {
  const subjects = useAllSubjects();
  const subject = subjects.find((s) => s.id === subjectId);
  if (!subject) return null;
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md font-medium"
      style={{ backgroundColor: COLOR_LIGHT[subject.color], color: COLOR_TEXT[subject.color] }}
    >
      <BookOpen className="w-2.5 h-2.5" />
      {subject.name}
    </span>
  );
}

function AttachmentIcon({ type }: { type: AttachmentType }) {
  switch (type) {
    case 'pdf': return <FileText className="w-3.5 h-3.5" />;
    case 'url': return <Link className="w-3.5 h-3.5" />;
    case 'youtube': return <Youtube className="w-3.5 h-3.5" />;
    case 'image': return <ImageIcon className="w-3.5 h-3.5" />;
    case 'audio': return <Music className="w-3.5 h-3.5" />;
    case 'video': return <Video className="w-3.5 h-3.5" />;
    case 'text': return <Type className="w-3.5 h-3.5" />;
  }
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9-_ ]/gi, '').trim().replace(/\s+/g, '_') || 'chat';
}

function downloadFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
