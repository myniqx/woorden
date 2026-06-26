import { createContext } from 'preact';
import { useState, useEffect, useContext, useCallback } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import type { ChatSession, ChatMessage, ChatSettings, CEFRLevel } from './types';
import {
  getSessions, saveSession, deleteSession,
  getChatSettings, saveChatSettings,
  newSessionId, newMessageId,
} from '../../services/ai/chatStorage';
import { pickRandomTopic, buildMasterPrompt, buildReviewPrompt } from '../../services/ai/chatPrompts';
import { getProviders, getActiveProviderType, GeminiAdapter, GroqAdapter, ServerAdapter, streamObject } from '../../services/ai';
import type { AIAdapter, AIProvider } from '../../services/ai';
import { useLanguage } from '../../hooks';

function createAdapter(provider: AIProvider): AIAdapter {
  switch (provider.type) {
    case 'gemini': return new GeminiAdapter(provider.apiKey);
    case 'groq':   return new GroqAdapter(provider.apiKey);
    case 'server': return new ServerAdapter(provider.apiKey);
  }
}

interface ChatContextValue {
  sessions: ChatSession[];
  activeSession: ChatSession | null;
  isStreaming: boolean;
  drawerOpen: boolean;
  selectedLevel: CEFRLevel;
  selectedProviderId: string;
  providerList: AIProvider[];
  setDrawerOpen: (open: boolean) => void;
  setSelectedLevel: (level: CEFRLevel) => void;
  setSelectedProviderId: (id: string) => void;
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
  const providerList = getProviders();
  const fallbackProviderId = getActiveProviderType() ?? providerList[0]?.type ?? '';

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<CEFRLevel>('A2');
  const [selectedProviderId, setSelectedProviderId] = useState<string>(fallbackProviderId);

  useEffect(() => {
    getSessions().then(setSessions);
    getChatSettings().then(settings => {
      if (settings) {
        setSelectedLevel(settings.lastLevel);
        setSelectedProviderId(settings.lastProviderId || fallbackProviderId);
      }
    });
  }, []);

  const persistSettings = useCallback((level: CEFRLevel, providerId: string) => {
    const s: ChatSettings = { lastLevel: level, lastProviderId: providerId };
    saveChatSettings(s);
  }, []);

  const handleSetLevel = useCallback((level: CEFRLevel) => {
    setSelectedLevel(level);
    persistSettings(level, selectedProviderId);
  }, [selectedProviderId, persistSettings]);

  const handleSetProvider = useCallback((id: string) => {
    setSelectedProviderId(id);
    persistSettings(selectedLevel, id);
  }, [selectedLevel, persistSettings]);

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
    const provider = providerList.find(p => p.type === selectedProviderId) ?? providerList[0];
    if (!provider) return;

    const adapter = createAdapter(provider);
    let session = activeSession;

    // First message — create session
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

    // Review query (fire and forget — updates message when done)
    const userMsgId = session.messages[session.messages.length - 1].id;
    const capturedSession = session;
    streamObject<{ review: string }>(
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

    // Build chat messages for AI (no review, no system in array — prepend master prompt as system)
    const masterPrompt = buildMasterPrompt(capturedSession.level, capturedSession.topic);
    const chatHistory = capturedSession.messages.map(m => ({
      role: m.role,
      content: m.content,
    }));

    // Stream assistant reply
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
  }, [activeSession, selectedLevel, selectedProviderId, providerList, updateSession]);

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
      providerList,
      setDrawerOpen,
      setSelectedLevel: handleSetLevel,
      setSelectedProviderId: handleSetProvider,
      sendMessage,
      loadSession,
      newChat,
      removeSession,
    }}>
      {children}
    </ChatContext.Provider>
  );
}
