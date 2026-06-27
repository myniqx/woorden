import type { AIProvider, ProviderType } from './types';

const STORAGE_KEY = 'woorden_ai_providers';
const ACTIVE_KEY = 'woorden_ai_active';

export function getProviders(): AIProvider[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function saveProviders(providers: AIProvider[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(providers));
}

export function addProvider(provider: AIProvider): void {
  const providers = getProviders();
  const existing = providers.findIndex(p => p.type === provider.type);
  if (existing >= 0) {
    providers[existing] = provider;
  } else {
    providers.push(provider);
  }
  saveProviders(providers);
}

export function removeProvider(type: ProviderType): void {
  saveProviders(getProviders().filter(p => p.type !== type));
}

export function getActiveProviderType(): ProviderType | null {
  return (localStorage.getItem(ACTIVE_KEY) as ProviderType) ?? null;
}

export function setActiveProviderType(type: ProviderType): void {
  localStorage.setItem(ACTIVE_KEY, type);
}
