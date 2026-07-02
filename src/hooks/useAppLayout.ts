import { createContext } from 'preact';
import { useState, useContext, useEffect, useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import type { Screen } from '../types';

/** Returns true when it has handled the back action itself (caller should not navigate). */
type BackOverride = () => boolean;

interface AppLayoutContextValue {
  headerCenter: ComponentChildren;
  setHeaderCenter: (content: ComponentChildren) => void;
  clearHeaderCenter: () => void;
  backOverride: BackOverride | null;
  setBackOverride: (fn: BackOverride | null) => void;
  clearBackOverride: () => void;
  currentScreen: Screen;
  currentTab: string | null;
  navigateTo: (screen: Screen, tab?: string) => void;
}

export const AppLayoutContext = createContext<AppLayoutContextValue>({
  headerCenter: null,
  setHeaderCenter: () => {},
  clearHeaderCenter: () => {},
  backOverride: null,
  setBackOverride: () => {},
  clearBackOverride: () => {},
  currentScreen: 'menu',
  currentTab: null,
  navigateTo: () => {},
});

export function useAppLayoutState(): AppLayoutContextValue {
  const [headerCenter, setHeaderCenter] = useState<ComponentChildren>(null);
  const [backOverride, setBackOverrideState] = useState<BackOverride | null>(null);
  const [currentScreen, setCurrentScreen] = useState<Screen>('menu');
  const [currentTab, setCurrentTab] = useState<string | null>(null);

  const navigateTo = (screen: Screen, tab?: string) => {
    setCurrentScreen(screen);
    setCurrentTab(tab ?? null);
  };

  return {
    headerCenter,
    setHeaderCenter,
    clearHeaderCenter: () => setHeaderCenter(null),
    backOverride,
    setBackOverride: (fn) => setBackOverrideState(() => fn),
    clearBackOverride: () => setBackOverrideState(null),
    currentScreen,
    currentTab,
    navigateTo,
  };
}

export function useAppLayout() {
  return useContext(AppLayoutContext);
}

export function useHeaderCenter(content: ComponentChildren, deps: unknown[]) {
  const { setHeaderCenter, clearHeaderCenter } = useContext(AppLayoutContext);
  const contentRef = useRef(content);
  contentRef.current = content;

  useEffect(() => {
    setHeaderCenter(contentRef.current);
    return () => clearHeaderCenter();
  }, deps);
}

/** Lets a screen intercept the header/system back action. `fn` returning true means it handled it. */
export function useBackOverride(fn: BackOverride, deps: unknown[]) {
  const { setBackOverride, clearBackOverride } = useContext(AppLayoutContext);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    setBackOverride(() => fnRef.current());
    return () => clearBackOverride();
  }, deps);
}
