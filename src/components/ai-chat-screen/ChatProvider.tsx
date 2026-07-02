import { createContext } from 'preact';
import { useState, useEffect, useContext, useCallback, useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import type { ChatSession, ChatMessage, CEFRLevel } from './types';
import {
  getSessions, saveSession, deleteSession,
  getChatSettings, saveChatSettings,
  newSessionId, newMessageId,
} from '../../services/ai/chatStorage';
import { pickRandomTopic, buildMasterPrompt, buildReviewPrompt } from '../../services/ai/chatPrompts';
import { getProviders, getActiveProviderType, getProviderMeta, streamObject } from '../../services/ai';
import type { AIAdapter, AIProvider } from '../../services/ai';
import { useLanguage, useAIChat } from '../../hooks';

const HISTORY_LIMIT = 12;

function createAdapter(provider: AIProvider, model?: string): AIAdapter {
  return getProviderMeta(provider.type).createAdapter(provider.apiKey, model);
}

interface ChatContextValue {
  sessions: ChatSession[];
  activeSession: ChatSession | null;
  isStreaming: boolean;
  drawerOpen: boolean;
  selectedLevel: CEFRLevel;
  selectedProviderId: string;
  selectedModel: string;
  providerList: AIProvider[];
  setDrawerOpen: (open: boolean) => void;
  setSelectedLevel: (level: CEFRLevel) => void;
  setSelectedProviderId: (id: string) => void;
  setSelectedModel: (model: string) => void;
  sendMessage: (text: string) => Promise<void>;
  loadSession: (id: string) => Promise<void>;
  newChat: () => void;
  removeSession: (id: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextValue>({} as ChatContextValue);

export function useChatContext() {
  return useContext(ChatContext);
}

export function ChatProvider({ children }: { children: ComponentChildren }) {
  const { language } = useLanguage();
  const [providerList, setProviderList] = useState<AIProvider[]>(() => getProviders());
  const fallbackProviderId = getActiveProviderType() ?? providerList[0]?.type ?? '';

  useEffect(() => {
    const handleStorage = () => setProviderList(getProviders());
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<CEFRLevel>('A2');
  const [selectedProviderId, setSelectedProviderId] = useState<string>(fallbackProviderId);
  const [selectedModel, setSelectedModel] = useState<string>('');

  const chat = useAIChat({ historyLimit: HISTORY_LIMIT });
  // covers the whole send flow (review + chat stream), not just the chat stream
  const sendingRef = useRef(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    getSessions().then(setSessions);
    getChatSettings().then(settings => {
      if (settings) {
        setSelectedLevel(settings.lastLevel);
        setSelectedProviderId(settings.lastProviderId || fallbackProviderId);
        if (settings.lastModel) setSelectedModel(settings.lastModel);
      }
    });
  }, []);

  useEffect(() => () => chat.abort(), []);

  const persistSettings = useCallback((level: CEFRLevel, providerId: string, model: string) => {
    saveChatSettings({ lastLevel: level, lastProviderId: providerId, lastModel: model });
  }, []);

  const handleSetLevel = useCallback((level: CEFRLevel) => {
    setSelectedLevel(level);
    persistSettings(level, selectedProviderId, selectedModel);
  }, [selectedProviderId, selectedModel, persistSettings]);

  const handleSetProvider = useCallback((id: string) => {
    setSelectedProviderId(id);
    setSelectedModel('');
    persistSettings(selectedLevel, id, '');
  }, [selectedLevel, persistSettings]);

  const handleSetModel = useCallback((model: string) => {
    setSelectedModel(model);
    persistSettings(selectedLevel, selectedProviderId, model);
  }, [selectedLevel, selectedProviderId, persistSettings]);

  const updateSession = useCallback(async (session: ChatSession) => {
    const updated = { ...session, updatedAt: Date.now() };
    await saveSession(updated);
    setActiveSession(updated);
    setSessions(prev => {
      const idx = prev.findIndex(s => s.id === updated.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updated;
        return next;
      }
      return [updated, ...prev];
    });
    return updated;
  }, []);

  // Patches + persists a session by id, whether or not it is still active.
  // Streaming chunks only touch activeSession; this is for durable updates.
  const patchSession = useCallback((id: string, patch: (s: ChatSession) => ChatSession) => {
    const apply = (s: ChatSession) => ({ ...patch(s), updatedAt: Date.now() });
    setSessions(prev => {
      const idx = prev.findIndex(s => s.id === id);
      if (idx < 0) return prev;
      const updated = apply(prev[idx]);
      saveSession(updated);
      const next = [...prev];
      next[idx] = updated;
      return next;
    });
    setActiveSession(prev => (prev && prev.id === id ? apply(prev) : prev));
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (sendingRef.current) return;
    const provider = providerList.find(p => p.type === selectedProviderId) ?? providerList[0];
    if (!provider) return;

    sendingRef.current = true;
    setIsSending(true);
    try {
      const adapter = createAdapter(provider, selectedModel || undefined);
      const isLocal = getProviderMeta(provider.type).isLocal;

      const userMsg: ChatMessage = {
        id: newMessageId(),
        role: 'user',
        content: text,
        timestamp: Date.now(),
        review: { status: 'pending', text: '' },
      };

      let session = activeSession
        ? { ...activeSession, messages: [...activeSession.messages, userMsg] }
        : {
            id: newSessionId(),
            level: selectedLevel,
            topic: pickRandomTopic(),
            providerId: provider.type,
            messages: [userMsg],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
      session = await updateSession(session);

      const sessionId = session.id;
      const userMsgId = userMsg.id;

      const setReview = (review: ChatMessage['review']) => {
        patchSession(sessionId, s => ({
          ...s,
          messages: s.messages.map(m => (m.id === userMsgId ? { ...m, review } : m)),
        }));
      };

      const runReview = () => streamObject<{ review: string }>(
        adapter,
        buildReviewPrompt(session.level, text, language),
        () => {},
        { temperature: 0.3 },
      )
        .then(result => setReview({ status: 'done', text: result.review ?? '' }))
        .catch(() => setReview({ status: 'error', text: '' }));

      if (isLocal) await runReview();
      else void runReview();

      const masterPrompt = buildMasterPrompt(session.level, session.topic);
      const history = session.messages.map(m => ({ role: m.role, content: m.content }));

      const assistantMsg: ChatMessage = {
        id: newMessageId(),
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      };
      patchSession(sessionId, s => ({ ...s, messages: [...s.messages, assistantMsg] }));

      let accumulated = '';
      const result = await chat.send(adapter, masterPrompt, history, acc => {
        accumulated = acc;
        setActiveSession(prev => {
          if (!prev || prev.id !== sessionId) return prev;
          const messages = prev.messages.map(m =>
            m.id === assistantMsg.id ? { ...m, content: acc } : m,
          );
          return { ...prev, messages };
        });
      });
      if (!result) return;

      if (result.error?.kind === 'aborted' && !accumulated) {
        patchSession(sessionId, s => ({
          ...s,
          messages: s.messages.filter(m => m.id !== assistantMsg.id),
        }));
        return;
      }

      patchSession(sessionId, s => ({
        ...s,
        messages: s.messages.map(m =>
          m.id === assistantMsg.id
            ? {
                ...m,
                content: result.error ? accumulated : result.text,
                truncated: result.truncated || undefined,
                errorKind: result.error && result.error.kind !== 'aborted' ? result.error.kind : undefined,
              }
            : m,
        ),
      }));
    } finally {
      sendingRef.current = false;
      setIsSending(false);
    }
  }, [activeSession, selectedLevel, selectedProviderId, selectedModel, providerList, language, updateSession, patchSession, chat.send]);

  const loadSession = useCallback(async (id: string) => {
    chat.abort();
    const s = sessions.find(x => x.id === id);
    if (s) setActiveSession(s);
    setDrawerOpen(false);
  }, [sessions, chat.abort]);

  const newChat = useCallback(() => {
    chat.abort();
    setActiveSession(null);
    setDrawerOpen(false);
  }, [chat.abort]);

  const removeSession = useCallback(async (id: string) => {
    if (activeSession?.id === id) chat.abort();
    await deleteSession(id);
    setSessions(prev => prev.filter(s => s.id !== id));
    if (activeSession?.id === id) setActiveSession(null);
  }, [activeSession, chat.abort]);

  return (
    <ChatContext.Provider value={{
      sessions,
      activeSession,
      isStreaming: isSending,
      drawerOpen,
      selectedLevel,
      selectedProviderId,
      selectedModel,
      providerList,
      setDrawerOpen,
      setSelectedLevel: handleSetLevel,
      setSelectedProviderId: handleSetProvider,
      setSelectedModel: handleSetModel,
      sendMessage,
      loadSession,
      newChat,
      removeSession,
    }}>
      {children}
    </ChatContext.Provider>
  );
}
