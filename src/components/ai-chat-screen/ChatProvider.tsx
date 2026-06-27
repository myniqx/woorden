import { createContext } from 'preact';
import { useState, useEffect, useContext, useCallback } from 'preact/hooks';
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
import { useLanguage } from '../../hooks';

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
  const [isStreaming, setIsStreaming] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<CEFRLevel>('A2');
  const [selectedProviderId, setSelectedProviderId] = useState<string>(fallbackProviderId);
  const [selectedModel, setSelectedModel] = useState<string>('');

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

  const sendMessage = useCallback(async (text: string) => {
    if (isStreaming) return;
    const provider = providerList.find(p => p.type === selectedProviderId) ?? providerList[0];
    if (!provider) return;

    const adapter = createAdapter(provider, selectedModel || undefined);
    const isLocal = getProviderMeta(provider.type).isLocal;
    let session = activeSession;

    if (!session) {
      const topic = pickRandomTopic();
      const userMsg: ChatMessage = {
        id: newMessageId(),
        role: 'user',
        content: text,
        timestamp: Date.now(),
        review: { status: 'pending', text: '' },
      };
      session = {
        id: newSessionId(),
        level: selectedLevel,
        topic,
        providerId: provider.type,
        messages: [userMsg],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      session = await updateSession(session);
    } else {
      const userMsg: ChatMessage = {
        id: newMessageId(),
        role: 'user',
        content: text,
        timestamp: Date.now(),
        review: { status: 'pending', text: '' },
      };
      session = { ...session, messages: [...session.messages, userMsg] };
      session = await updateSession(session);
    }

    setIsStreaming(true);

    const userMsgId = session.messages[session.messages.length - 1].id;
    const capturedSession = session;

    const runReview = () => streamObject<{ review: string }>(
      adapter,
      buildReviewPrompt(capturedSession.level, text, language),
      () => {},
    ).then(result => {
      setActiveSession(prev => {
        if (!prev || prev.id !== capturedSession.id) return prev;
        const messages = prev.messages.map(m =>
          m.id === userMsgId
            ? { ...m, review: { status: 'done' as const, text: result.review ?? '' } }
            : m,
        );
        const updated = { ...prev, messages, updatedAt: Date.now() };
        saveSession(updated);
        setSessions(s => {
          const idx = s.findIndex(x => x.id === updated.id);
          if (idx >= 0) { const n = [...s]; n[idx] = updated; return n; }
          return s;
        });
        return updated;
      });
    }).catch(() => {
      setActiveSession(prev => {
        if (!prev || prev.id !== capturedSession.id) return prev;
        const messages = prev.messages.map(m =>
          m.id === userMsgId
            ? { ...m, review: { status: 'error' as const, text: '' } }
            : m,
        );
        return { ...prev, messages };
      });
    });

    if (isLocal) await runReview();
    else runReview();

    const masterPrompt = buildMasterPrompt(capturedSession.level, capturedSession.topic);
    const chatHistory = capturedSession.messages.map(m => ({
      role: m.role,
      content: m.content,
    }));

    const assistantMsgId = newMessageId();
    const assistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };

    setActiveSession(prev =>
      prev ? { ...prev, messages: [...prev.messages, assistantMsg] } : prev,
    );

    let accumulated = '';
    try {
      for await (const chunk of adapter.chat(masterPrompt, chatHistory)) {
        accumulated += chunk;
        setActiveSession(prev => {
          if (!prev) return prev;
          const messages = prev.messages.map(m =>
            m.id === assistantMsgId ? { ...m, content: accumulated } : m,
          );
          return { ...prev, messages };
        });
      }

      setActiveSession(prev => {
        if (!prev) return prev;
        const messages = prev.messages.map(m =>
          m.id === assistantMsgId ? { ...m, content: accumulated } : m,
        );
        const updated = { ...prev, messages, updatedAt: Date.now() };
        saveSession(updated);
        setSessions(s => {
          const idx = s.findIndex(x => x.id === updated.id);
          if (idx >= 0) { const n = [...s]; n[idx] = updated; return n; }
          return [updated, ...s];
        });
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  }, [activeSession, selectedLevel, selectedProviderId, selectedModel, providerList, updateSession]);

  const loadSession = useCallback(async (id: string) => {
    const s = sessions.find(x => x.id === id);
    if (s) setActiveSession(s);
    setDrawerOpen(false);
  }, [sessions]);

  const newChat = useCallback(() => {
    setActiveSession(null);
    setDrawerOpen(false);
  }, []);

  const removeSession = useCallback(async (id: string) => {
    await deleteSession(id);
    setSessions(prev => prev.filter(s => s.id !== id));
    if (activeSession?.id === id) setActiveSession(null);
  }, [activeSession]);

  return (
    <ChatContext.Provider value={{
      sessions,
      activeSession,
      isStreaming,
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
