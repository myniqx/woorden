import { supabase } from './supabase';
import type { User } from './auth';
import { getExportData, mergeRemoteData, loadRemoteData, getDailyStats } from './storage';

async function compress(data: object): Promise<Uint8Array> {
  const json = JSON.stringify(data);
  const stream = new CompressionStream('gzip');
  const writer = stream.writable.getWriter();
  writer.write(new TextEncoder().encode(json));
  writer.close();
  const chunks: Uint8Array[] = [];
  const reader = stream.readable.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const total = chunks.reduce((acc, c) => acc + c.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

async function decompress(bytes: Uint8Array): Promise<object> {
  const stream = new DecompressionStream('gzip');
  const writer = stream.writable.getWriter();
  writer.write(bytes);
  writer.close();
  const chunks: Uint8Array[] = [];
  const reader = stream.readable.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const total = chunks.reduce((acc, c) => acc + c.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return JSON.parse(new TextDecoder().decode(result));
}

export class UsernameConflictError extends Error {}

export async function pushProfile(user: User, username: string, avatarIndex: number): Promise<void> {
  const { error } = await supabase.from('profiles').upsert({
    id: user.id,
    username,
    avatar_index: avatarIndex,
    updated_at: new Date().toISOString(),
  });
  if (error) {
    if (error.code === '23505') throw new UsernameConflictError();
    throw new Error(error.message);
  }
}

export async function pushProgress(user: User): Promise<void> {
  const compressed = await compress(getExportData());
  const { error } = await supabase.from('profiles').upsert({
    id: user.id,
    data: compressed,
    last_sync: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
}

export interface RemoteProfile {
  username: string;
  avatarIndex: number;
  lastSync: string | null;
}

export async function pullProfile(user: User): Promise<RemoteProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('username, avatar_index, last_sync')
    .eq('id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') throw new Error(error.message);
  if (!data) return null;
  return {
    username: data.username ?? '',
    avatarIndex: data.avatar_index ?? 0,
    lastSync: data.last_sync ?? null,
  };
}

export async function pullProgress(user: User): Promise<object | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('data')
    .eq('id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') throw new Error(error.message);
  if (!data?.data) return null;
  return decompress(new Uint8Array(data.data));
}

// Local → Remote: local'i direkt yaz (eski veriyi ez)
export async function updateMyData(user: User, mode: 'override' | 'merge'): Promise<void> {
  if (mode === 'override') {
    await pushProgress(user);
  } else {
    const remote = await pullProgress(user);
    if (remote) mergeRemoteData(remote);
    await pushProgress(user);
  }
}

const LAST_STATS_PUSH_KEY = 'woorden_last_stats_push';

export async function pushStats(user: User): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const { practiced, correct } = getDailyStats();
  if (practiced === 0) return;

  const signature = `${today}:${practiced}:${correct}`;
  if (localStorage.getItem(LAST_STATS_PUSH_KEY) === signature) return;

  const { error } = await supabase.from('stats').upsert({
    user_id: user.id,
    date: today,
    practiced,
    correct,
  });
  if (error) throw new Error(error.message);

  localStorage.setItem(LAST_STATS_PUSH_KEY, signature);
}

export interface LeaderboardEntry {
  username: string;
  avatarIndex: number;
  daily: number;
  dailyCorrect: number;
  last7: number;
  last7Correct: number;
  last30: number;
  last30Correct: number;
}

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from('cache')
    .select('value')
    .eq('key', 'leaderboard')
    .single();

  if (error) throw new Error(error.message);
  if (!data?.value) return [];

  return data.value
    .split('\n')
    .filter((line: string) => line.trim())
    .map((line: string) => {
      const [username, avatarIndex, daily, dailyCorrect, last7, last7Correct, last30, last30Correct] = line.split(',');
      return {
        username,
        avatarIndex: Number(avatarIndex),
        daily: Number(daily),
        dailyCorrect: Number(dailyCorrect),
        last7: Number(last7),
        last7Correct: Number(last7Correct),
        last30: Number(last30),
        last30Correct: Number(last30Correct),
      };
    });
}

// Remote → Local: Supabase'den çek, local'e yaz
export async function downloadData(user: User, mode: 'override' | 'merge'): Promise<void> {
  const remote = await pullProgress(user);
  if (!remote) throw new Error('No remote data found');

  if (mode === 'override') {
    loadRemoteData(remote);
  } else {
    mergeRemoteData(remote);
  }
}
