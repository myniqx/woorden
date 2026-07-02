import { openDB } from 'idb';
import type { QASession, QASettings, QAPin } from '../../components/qa-session-screen/types';

const DB_NAME = 'woorden_qa';
const DB_VERSION = 1;

async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('sessions')) {
        const store = db.createObjectStore('sessions', { keyPath: 'id' });
        store.createIndex('updatedAt', 'updatedAt');
      }
      if (!db.objectStoreNames.contains('pins')) {
        const store = db.createObjectStore('pins', { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt');
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings');
      }
    },
  });
}

export async function getSessions(): Promise<QASession[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('sessions', 'updatedAt');
  return all.reverse();
}

export async function getSession(id: string): Promise<QASession | undefined> {
  const db = await getDB();
  return db.get('sessions', id);
}

export async function saveSession(session: QASession): Promise<void> {
  const db = await getDB();
  await db.put('sessions', session);
}

export async function deleteSession(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('sessions', id);
}

export async function getPins(): Promise<QAPin[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('pins', 'createdAt');
  return all.reverse();
}

export async function savePin(pin: QAPin): Promise<void> {
  const db = await getDB();
  await db.put('pins', pin);
}

export async function deletePin(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('pins', id);
}

export async function getQASettings(): Promise<QASettings | null> {
  const db = await getDB();
  return db.get('settings', 'qa') ?? null;
}

export async function saveQASettings(settings: QASettings): Promise<void> {
  const db = await getDB();
  await db.put('settings', settings, 'qa');
}

export function newSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function newMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function newPinId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
