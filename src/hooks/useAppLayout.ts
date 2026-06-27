import { createContext } from 'preact';
import { useState, useContext, useEffect, useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import type { Screen } from '../types';

interface AppLayoutContextValue {
  headerCenter: ComponentChildren;
  setHeaderCenter: (content: ComponentChildren) => void;
  clearHeaderCenter: () => void;
  currentScreen: Screen;
  currentTab: string | null;
  navigateTo: (screen: Screen, tab?: string) => void;
}

export const AppLayoutContext = createContext<AppLayoutContextValue>({
  headerCenter: null,
  setHeaderCenter: () => {},
  clearHeaderCenter: () => {},
  currentScreen: 'menu',
  currentTab: null,
  navigateTo: () => {},
});

export function useAppLayoutState(): AppLayoutContextValue {
  const [headerCenter, setHeaderCenter] = useState<ComponentChildren>(null);
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
