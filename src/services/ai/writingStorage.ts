import { openDB } from 'idb';
import type { WritingEntry, WritingSettings } from '../../components/writing-screen/types';

const DB_NAME = 'woorden_writing';
const DB_VERSION = 1;

async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('entries')) {
        const store = db.createObjectStore('entries', { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt');
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings');
      }
    },
  });
}

export async function getEntries(): Promise<WritingEntry[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('entries', 'createdAt');
  return all.reverse();
}

export async function saveEntry(entry: WritingEntry): Promise<void> {
  const db = await getDB();
  await db.put('entries', entry);
}

export async function deleteEntry(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('entries', id);
}

export async function getWritingSettings(): Promise<WritingSettings | null> {
  const db = await getDB();
  return db.get('settings', 'writing') ?? null;
}

export async function saveWritingSettings(settings: WritingSettings): Promise<void> {
  const db = await getDB();
  await db.put('settings', settings, 'writing');
}

export function newEntryId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
