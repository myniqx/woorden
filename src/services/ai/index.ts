export type { AIProvider, AIAdapter, AIChatMessage, ProviderType, AIStreamOptions, AIFinishReason } from './types';
export { streamObject, streamChat } from './manager';
export type { ChatStreamResult } from './manager';
export { AIError, toAIError, httpToAIError } from './errors';
export type { AIErrorKind } from './errors';
export {
  getProviders,
  addProvider,
  removeProvider,
  getActiveProviderType,
  setActiveProviderType,
} from './providerStorage';
export { GeminiAdapter } from './adapters/gemini';
export { GroqAdapter } from './adapters/groq';
export { ServerAdapter } from './adapters/server';
export { OllamaAdapter, LMStudioAdapter, OLLAMA_DEFAULT_URL, LMSTUDIO_DEFAULT_URL } from './adapters/local';
export { PROVIDER_REGISTRY, getProviderMeta } from './registry';
export type { ProviderMeta } from './registry';
