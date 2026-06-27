import { openDB } from 'idb';
import type { ChatSession, ChatSettings, CEFRLevel } from '../../components/ai-chat-screen/types';

const DB_NAME = 'woorden_chat';
const DB_VERSION = 1;

async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('sessions')) {
        const store = db.createObjectStore('sessions', { keyPath: 'id' });
        store.createIndex('updatedAt', 'updatedAt');
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings');
      }
    },
  });
}

export async function getSessions(): Promise<ChatSession[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('sessions', 'updatedAt');
  return all.reverse();
}

export async function getSession(id: string): Promise<ChatSession | undefined> {
  const db = await getDB();
  return db.get('sessions', id);
}

export async function saveSession(session: ChatSession): Promise<void> {
  const db = await getDB();
  await db.put('sessions', session);
}

export async function deleteSession(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('sessions', id);
}

export async function getChatSettings(): Promise<ChatSettings | null> {
  const db = await getDB();
  return db.get('settings', 'chat') ?? null;
}

export async function saveChatSettings(settings: ChatSettings): Promise<void> {
  const db = await getDB();
  await db.put('settings', settings, 'chat');
}

export function newSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function newMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const DEFAULT_LEVEL: CEFRLevel = 'A2';
