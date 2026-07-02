import { createContext } from 'preact';
import { useState, useEffect, useContext, useCallback, useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import type { QASession, QAMessage, QAPin } from './types';
import {
  getSessions, saveSession, deleteSession,
  getQASettings, saveQASettings,
  newSessionId, newMessageId,
  getPins, savePin, deletePin, newPinId,
} from '../../services/ai/qaStorage';
import { buildQASystemPrompt } from '../../services/ai/qaPrompts';
import type { QAAnswer } from '../../services/ai/qaPrompts';
import { getProviders, getActiveProviderType, getProviderMeta } from '../../services/ai';
import type { AIAdapter, AIProvider } from '../../services/ai';
import { useLanguage, useAIChat, useAppLayout } from '../../hooks';

const HISTORY_LIMIT = 4;

function createAdapter(provider: AIProvider, model?: string): AIAdapter {
  return getProviderMeta(provider.type).createAdapter(provider.apiKey, model);
}

export type QAViewMode = 'pins' | 'chat';

interface QASessionContextValue {
  sessions: QASession[];
  activeSession: QASession | null;
  viewMode: QAViewMode;
  pins: QAPin[];
  pinsLoaded: boolean;
  isStreaming: boolean;
  drawerOpen: boolean;
  selectedProviderId: string;
  selectedModel: string;
  providerList: AIProvider[];
  setDrawerOpen: (open: boolean) => void;
  setSelectedProviderId: (id: string) => void;
  setSelectedModel: (model: string) => void;
  sendMessage: (text: string) => Promise<void>;
  loadSession: (id: string) => Promise<void>;
  newSession: () => void;
  goToPins: () => void;
  removeSession: (id: string) => Promise<void>;
  pinMessage: (messageId: string) => Promise<void>;
  removePin: (id: string) => Promise<void>;
}

const QASessionContext = createContext<QASessionContextValue>({} as QASessionContextValue);

export function useQASessionContext() {
  return useContext(QASessionContext);
}

export function QASessionProvider({ children }: { children: ComponentChildren }) {
  const { language } = useLanguage();
  const [providerList, setProviderList] = useState<AIProvider[]>(() => getProviders());
  const fallbackProviderId = getActiveProviderType() ?? providerList[0]?.type ?? '';

  useEffect(() => {
    const handleStorage = () => setProviderList(getProviders());
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const { currentTab } = useAppLayout();
  const [sessions, setSessions] = useState<QASession[]>([]);
  const [activeSession, setActiveSession] = useState<QASession | null>(null);
  const [viewMode, setViewMode] = useState<QAViewMode>('pins');
  const [pins, setPins] = useState<QAPin[]>([]);
  const [pinsLoaded, setPinsLoaded] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(currentTab === 'history');
  const [selectedProviderId, setSelectedProviderId] = useState<string>(fallbackProviderId);
  const [selectedModel, setSelectedModel] = useState<string>('');

  const chat = useAIChat({ historyLimit: HISTORY_LIMIT });
  const sendingRef = useRef(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    getSessions().then(setSessions);
    getQASettings().then(settings => {
      if (settings) {
        setSelectedProviderId(settings.lastProviderId || fallbackProviderId);
        if (settings.lastModel) setSelectedModel(settings.lastModel);
      }
    });
    getPins().then(loadedPins => {
      setPins(loadedPins);
      setPinsLoaded(true);
      if (loadedPins.length === 0 && currentTab !== 'history') setViewMode('chat');
    });
  }, []);

  useEffect(() => () => chat.abort(), []);

  const persistSettings = useCallback((providerId: string, model: string) => {
    saveQASettings({ lastProviderId: providerId, lastModel: model });
  }, []);

  const handleSetProvider = useCallback((id: string) => {
    setSelectedProviderId(id);
    setSelectedModel('');
    persistSettings(id, '');
  }, [persistSettings]);

  const handleSetModel = useCallback((model: string) => {
    setSelectedModel(model);
    persistSettings(selectedProviderId, model);
  }, [selectedProviderId, persistSettings]);

  const updateSession = useCallback(async (session: QASession) => {
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

  const patchSession = useCallback((id: string, patch: (s: QASession) => QASession) => {
    const apply = (s: QASession) => ({ ...patch(s), updatedAt: Date.now() });
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
    setViewMode('chat');
    try {
      const adapter = createAdapter(provider, selectedModel || undefined);

      const userMsg: QAMessage = {
        id: newMessageId(),
        role: 'user',
        content: text,
        timestamp: Date.now(),
      };

      const isFirstMessage = !activeSession;
      let session = activeSession
        ? { ...activeSession, messages: [...activeSession.messages, userMsg] }
        : {
            id: newSessionId(),
            providerId: provider.type,
            messages: [userMsg],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
      session = await updateSession(session);

      const sessionId = session.id;
      const systemPrompt = buildQASystemPrompt(language);
      const history = session.messages.map(m => ({ role: m.role, content: m.content }));

      const assistantMsg: QAMessage = {
        id: newMessageId(),
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      };
      patchSession(sessionId, s => ({ ...s, messages: [...s.messages, assistantMsg] }));

      let accumulatedAnswer = '';
      const result = await chat.sendObject<QAAnswer>(adapter, systemPrompt, history, partial => {
        accumulatedAnswer = partial.answer ?? '';
        setActiveSession(prev => {
          if (!prev || prev.id !== sessionId) return prev;
          const messages = prev.messages.map(m =>
            m.id === assistantMsg.id ? { ...m, content: accumulatedAnswer } : m,
          );
          return { ...prev, messages };
        });
      }, { temperature: 0.3 });
      if (!result) return;

      if (result.error?.kind === 'aborted' && !accumulatedAnswer) {
        patchSession(sessionId, s => ({
          ...s,
          messages: s.messages.filter(m => m.id !== assistantMsg.id),
        }));
        return;
      }

      const finalAnswer = result.error ? accumulatedAnswer : (result.object?.answer ?? result.text);
      const answerTitle = result.object?.title;

      patchSession(sessionId, s => ({
        ...s,
        title: isFirstMessage && answerTitle ? answerTitle : s.title,
        messages: s.messages.map(m =>
          m.id === assistantMsg.id
            ? {
                ...m,
                content: finalAnswer,
                title: answerTitle,
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
  }, [activeSession, selectedProviderId, selectedModel, providerList, language, updateSession, patchSession, chat.sendObject]);

  const loadSession = useCallback(async (id: string) => {
    chat.abort();
    const s = sessions.find(x => x.id === id);
    if (s) {
      setActiveSession(s);
      setViewMode('chat');
    }
    setDrawerOpen(false);
  }, [sessions, chat.abort]);

  const newSession = useCallback(() => {
    chat.abort();
    setActiveSession(null);
    setViewMode('chat');
    setDrawerOpen(false);
  }, [chat.abort]);

  const goToPins = useCallback(() => {
    chat.abort();
    setActiveSession(null);
    setViewMode('pins');
    setDrawerOpen(false);
  }, [chat.abort]);

  const removeSession = useCallback(async (id: string) => {
    if (activeSession?.id === id) {
      chat.abort();
      setActiveSession(null);
      setViewMode('pins');
    }
    await deleteSession(id);
    setSessions(prev => prev.filter(s => s.id !== id));
  }, [activeSession, chat.abort]);

  const pinMessage = useCallback(async (messageId: string) => {
    if (!activeSession) return;

    const messages = activeSession.messages;
    const answerMsg = messages.find(m => m.id === messageId);
    if (!answerMsg || answerMsg.role !== 'assistant' || !answerMsg.content || answerMsg.pinned) return;

    const sessionId = activeSession.id;
    const title = answerMsg.title || answerMsg.content.slice(0, 40);

    const pin: QAPin = { id: newPinId(), title, answer: answerMsg.content, createdAt: Date.now() };
    await savePin(pin);
    setPins(prev => [pin, ...prev]);

    patchSession(sessionId, s => ({
      ...s,
      messages: s.messages.map(m => (m.id === messageId ? { ...m, pinned: true } : m)),
    }));
  }, [activeSession, patchSession]);

  const removePin = useCallback(async (id: string) => {
    setPins(prev => prev.filter(p => p.id !== id));
    await deletePin(id);
  }, []);

  return (
    <QASessionContext.Provider value={{
      sessions,
      activeSession,
      viewMode,
      pins,
      pinsLoaded,
      isStreaming: isSending,
      drawerOpen,
      selectedProviderId,
      selectedModel,
      providerList,
      setDrawerOpen,
      setSelectedProviderId: handleSetProvider,
      setSelectedModel: handleSetModel,
      sendMessage,
      loadSession,
      newSession,
      goToPins,
      removeSession,
      pinMessage,
      removePin,
    }}>
      {children}
    </QASessionContext.Provider>
  );
}
