export { en } from './en';
export type { Locale } from './en';
export { tr } from './tr';
export { ar } from './ar';
export { fr } from './fr';

import { en } from './en';
import { tr } from './tr';
import { ar } from './ar';
import { fr } from './fr';
import type { Language } from '../types';

export type LanguageKeys = typeof en
export const locales: Record<Language, LanguageKeys> = { en, tr, ar, fr };
