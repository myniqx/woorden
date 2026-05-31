import { supabase } from './supabase';
import type { User } from './auth';

export async function pushProgress(user: User, data: object): Promise<void> {
  await supabase.from('profiles').upsert({
    id: user.id,
    data,
    updated_at: new Date().toISOString(),
  });
}

export async function pullProgress(user: User): Promise<object | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('data')
    .eq('id', user.id)
    .single();

  if (error || !data) return null;
  return data.data;
}
