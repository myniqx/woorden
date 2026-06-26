import { createContext } from 'preact';
import { useState, useContext } from 'preact/hooks';
import type { ComponentChildren } from 'preact';

interface AppLayoutContextValue {
  headerCenter: ComponentChildren;
  setHeaderCenter: (content: ComponentChildren) => void;
  clearHeaderCenter: () => void;
}

export const AppLayoutContext = createContext<AppLayoutContextValue>({
  headerCenter: null,
  setHeaderCenter: () => {},
  clearHeaderCenter: () => {},
});

export function useAppLayoutState(): AppLayoutContextValue {
  const [headerCenter, setHeaderCenter] = useState<ComponentChildren>(null);
  return {
    headerCenter,
    setHeaderCenter,
    clearHeaderCenter: () => setHeaderCenter(null),
  };
}

export function useAppLayout() {
  return useContext(AppLayoutContext);
}
