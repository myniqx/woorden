import { createContext } from 'preact';
import { useState, useEffect, useContext, useCallback, useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import type { CEFRLevel } from '../ai-chat-screen/types';
import type { WritingAssignment, WritingReview, WritingEntry, WritingPhase, WritingDraft } from './types';
import {
  getEntries, saveEntry, deleteEntry,
  getWritingSettings, saveWritingSettings,
  newEntryId,
} from '../../services/ai/writingStorage';
import { pickWritingTopic, buildAssignmentPrompt, buildWritingReviewPrompt } from '../../services/ai/writingPrompts';
import { getProviders, getActiveProviderType, getProviderMeta, streamObject, toAIError } from '../../services/ai';
import type { AIAdapter, AIProvider, AIError } from '../../services/ai';
import { useLanguage } from '../../hooks';

const DRAFT_KEY = 'woorden_writing_draft';
const DEFAULT_LEVEL: CEFRLevel = 'B2';

function createAdapter(provider: AIProvider, model?: string): AIAdapter {
  return getProviderMeta(provider.type).createAdapter(provider.apiKey, model);
}

function loadDraft(): WritingDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as WritingDraft) : null;
  } catch {
    return null;
  }
}

function saveDraft(draft: WritingDraft | null) {
  if (draft) localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  else localStorage.removeItem(DRAFT_KEY);
}

interface WritingContextValue {
  phase: WritingPhase;
  entries: WritingEntry[];
  drawerOpen: boolean;
  selectedLevel: CEFRLevel;
  selectedProviderId: string;
  selectedModel: string;
  providerList: AIProvider[];
  assignment: Partial<WritingAssignment> | null;
  assignmentError: AIError | null;
  isGeneratingAssignment: boolean;
  draftText: string;
  review: Partial<WritingReview> | null;
  reviewError: AIError | null;
  isReviewing: boolean;
  viewingEntry: WritingEntry | null;
  setDrawerOpen: (open: boolean) => void;
  setSelectedLevel: (level: CEFRLevel) => void;
  setSelectedProviderId: (id: string) => void;
  setSelectedModel: (model: string) => void;
  startAssignment: () => Promise<void>;
  setDraftText: (text: string) => void;
  submitWriting: () => Promise<void>;
  retryReview: () => Promise<void>;
  tryAgain: () => Promise<void>;
  goToSetup: () => void;
  viewEntry: (id: string) => void;
  removeEntry: (id: string) => Promise<void>;
  closeViewing: () => void;
}

const WritingContext = createContext<WritingContextValue>({} as WritingContextValue);

export function useWritingContext() {
  return useContext(WritingContext);
}

export function WritingProvider({ children }: { children: ComponentChildren }) {
  const { language } = useLanguage();
  const [providerList, setProviderList] = useState<AIProvider[]>(() => getProviders());
  const fallbackProviderId = getActiveProviderType() ?? providerList[0]?.type ?? '';

  useEffect(() => {
    const handleStorage = () => setProviderList(getProviders());
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const [phase, setPhase] = useState<WritingPhase>('setup');
  const [prePhase, setPrePhase] = useState<WritingPhase>('setup');
  const [entries, setEntries] = useState<WritingEntry[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedLevel, setSelectedLevelState] = useState<CEFRLevel>(DEFAULT_LEVEL);
  const [selectedProviderId, setSelectedProviderIdState] = useState<string>(fallbackProviderId);
  const [selectedModel, setSelectedModelState] = useState<string>('');

  const [assignment, setAssignment] = useState<Partial<WritingAssignment> | null>(null);
  const [assignmentError, setAssignmentError] = useState<AIError | null>(null);
  const [isGeneratingAssignment, setIsGeneratingAssignment] = useState(false);

  const [draftText, setDraftTextState] = useState('');
  const [review, setReview] = useState<Partial<WritingReview> | null>(null);
  const [reviewError, setReviewError] = useState<AIError | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);

  const [viewingEntry, setViewingEntry] = useState<WritingEntry | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    getEntries().then(setEntries);
    getWritingSettings().then(settings => {
      if (settings) {
        setSelectedLevelState(settings.lastLevel);
        setSelectedProviderIdState(settings.lastProviderId || fallbackProviderId);
        if (settings.lastModel) setSelectedModelState(settings.lastModel);
      }
    });

    const draft = loadDraft();
    if (draft) {
      setAssignment(draft.assignment);
      setDraftTextState(draft.text);
      setPhase('assignment');
    }
  }, []);

  useEffect(() => () => abortRef.current?.abort(), []);

  const persistSettings = useCallback((level: CEFRLevel, providerId: string, model: string) => {
    saveWritingSettings({ lastLevel: level, lastProviderId: providerId, lastModel: model });
  }, []);

  const setSelectedLevel = useCallback((level: CEFRLevel) => {
    setSelectedLevelState(level);
    persistSettings(level, selectedProviderId, selectedModel);
  }, [selectedProviderId, selectedModel, persistSettings]);

  const setSelectedProviderId = useCallback((id: string) => {
    setSelectedProviderIdState(id);
    setSelectedModelState('');
    persistSettings(selectedLevel, id, '');
  }, [selectedLevel, persistSettings]);

  const setSelectedModel = useCallback((model: string) => {
    setSelectedModelState(model);
    persistSettings(selectedLevel, selectedProviderId, model);
  }, [selectedLevel, selectedProviderId, persistSettings]);

  const setDraftText = useCallback((text: string) => {
    setDraftTextState(text);
    setAssignment(prev => {
      if (prev && prev.scenario) saveDraft({ assignment: prev as WritingAssignment, text });
      return prev;
    });
  }, []);

  const startAssignment = useCallback(async () => {
    const provider = providerList.find(p => p.type === selectedProviderId) ?? providerList[0];
    if (!provider) return;

    setPhase('assignment');
    setAssignment(null);
    setAssignmentError(null);
    setIsGeneratingAssignment(true);
    setDraftTextState('');
    setReview(null);
    setReviewError(null);

    const controller = new AbortController();
    abortRef.current = controller;
    const adapter = createAdapter(provider, selectedModel || undefined);
    const topic = pickWritingTopic();
    const prompt = buildAssignmentPrompt(selectedLevel, topic, language);

    try {
      const result = await streamObject<WritingAssignment>(
        adapter,
        prompt,
        partial => setAssignment(partial),
        { temperature: 0.9, signal: controller.signal },
      );
      setAssignment(result);
      saveDraft({ assignment: result, text: '' });
    } catch (e) {
      const err = toAIError(e, 'AI');
      if (err.kind !== 'aborted') setAssignmentError(err);
    } finally {
      setIsGeneratingAssignment(false);
    }
  }, [providerList, selectedProviderId, selectedModel, selectedLevel, language]);

  const runReview = useCallback(async (text: string) => {
    const provider = providerList.find(p => p.type === selectedProviderId) ?? providerList[0];
    if (!provider || !assignment || !assignment.scenario) return;

    setPhase('reviewing');
    setReview(null);
    setReviewError(null);
    setIsReviewing(true);

    const controller = new AbortController();
    abortRef.current = controller;
    const adapter = createAdapter(provider, selectedModel || undefined);
    const prompt = buildWritingReviewPrompt(assignment as WritingAssignment, text, selectedLevel, language);

    try {
      const result = await streamObject<WritingReview>(
        adapter,
        prompt,
        partial => setReview(partial),
        { temperature: 0.3, signal: controller.signal },
      );
      setReview(result);
      setPhase('result');
      saveDraft(null);

      const entry: WritingEntry = {
        id: newEntryId(),
        level: selectedLevel,
        assignment: assignment as WritingAssignment,
        userText: text,
        review: result,
        createdAt: Date.now(),
      };
      await saveEntry(entry);
      setEntries(prev => [entry, ...prev]);
    } catch (e) {
      const err = toAIError(e, 'AI');
      if (err.kind !== 'aborted') setReviewError(err);
      setPhase('assignment');
    } finally {
      setIsReviewing(false);
    }
  }, [providerList, selectedProviderId, selectedModel, selectedLevel, assignment, language]);

  const submitWriting = useCallback(async () => {
    await runReview(draftText);
  }, [runReview, draftText]);

  const retryReview = useCallback(async () => {
    await runReview(draftText);
  }, [runReview, draftText]);

  const tryAgain = useCallback(async () => {
    setReview(null);
    setReviewError(null);
    saveDraft(null);
    await startAssignment();
  }, [startAssignment]);

  const goToSetup = useCallback(() => {
    abortRef.current?.abort();
    setPhase('setup');
    setAssignment(null);
    setAssignmentError(null);
    setReview(null);
    setReviewError(null);
    setDraftTextState('');
    setDrawerOpen(false);
  }, []);

  const viewEntry = useCallback((id: string) => {
    const entry = entries.find(e => e.id === id);
    if (!entry) return;
    setPrePhase(phase === 'viewing' ? prePhase : phase);
    setViewingEntry(entry);
    setPhase('viewing');
    setDrawerOpen(false);
  }, [entries, phase, prePhase]);

  const closeViewing = useCallback(() => {
    setViewingEntry(null);
    setPhase(prePhase);
  }, [prePhase]);

  const removeEntry = useCallback(async (id: string) => {
    await deleteEntry(id);
    setEntries(prev => prev.filter(e => e.id !== id));
    if (viewingEntry?.id === id) closeViewing();
  }, [viewingEntry, closeViewing]);

  return (
    <WritingContext.Provider value={{
      phase,
      entries,
      drawerOpen,
      selectedLevel,
      selectedProviderId,
      selectedModel,
      providerList,
      assignment,
      assignmentError,
      isGeneratingAssignment,
      draftText,
      review,
      reviewError,
      isReviewing,
      viewingEntry,
      setDrawerOpen,
      setSelectedLevel,
      setSelectedProviderId,
      setSelectedModel,
      startAssignment,
      setDraftText,
      submitWriting,
      retryReview,
      tryAgain,
      goToSetup,
      viewEntry,
      removeEntry,
      closeViewing,
    }}>
      {children}
    </WritingContext.Provider>
  );
}
