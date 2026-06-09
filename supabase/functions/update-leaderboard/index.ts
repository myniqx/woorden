// @ts-nocheck
// Deno Edge Function — runs on Supabase, not in the local TS environment.
// "Cannot find name 'Deno'" and esm.sh import errors from the IDE are expected and harmless.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL'),
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
);

// Offset local hour from UTC. Using +2 as approximation for Amsterdam time.
const LOCAL_HOUR = new Date().getUTCHours() + 2;

const IS_MIDNIGHT_RUN = LOCAL_HOUR === 0;

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Determine bot group (A = hardworking, B = casual) from the last hex char of the UUID.
// This is deterministic — same bot always lands in the same group regardless of
// username changes or query order.
// UUID last char 0-7 → group A, 8-f → group B
function getBotGroup(uuid: string): 'A' | 'B' {
  const lastChar = uuid.replace(/-/g, '').slice(-1).toLowerCase();
  return parseInt(lastChar, 16) < 8 ? 'A' : 'B';
}

// Returns how many questions to add this tick, or null if this bot should not
// be updated at the current hour.
//
// Schedule (local time):
//   Morning block  09,10,11,12  — odd hours → group A, even hours → group B
//   Break          13–16        — no updates
//   Evening block  17,18,19,20  — odd hours → group A, even hours → group B
//
// Increments:
//   Morning A: rand(40,120)  Morning B: rand(20,80)
//   Evening A: rand(50,80)   Evening B: rand(30,70)
function getIncrement(group: 'A' | 'B', hour: number): number | null {
  const isMorning = hour >= 9 && hour <= 12;
  const isEvening = hour >= 17 && hour <= 20;

  if (!isMorning && !isEvening) return null;

  const isOdd = hour % 2 !== 0;
  const isGroupATick = isOdd;   // odd hours belong to group A

  if (group === 'A' && !isGroupATick) return null;
  if (group === 'B' && isGroupATick) return null;

  if (isMorning) return group === 'A' ? randInt(40, 120) : randInt(20, 80);
  return group === 'A' ? randInt(50, 80) : randInt(30, 70);
}

// --- Step 1: Purge stats older than 30 days ---
// Runs only on the midnight cron tick to keep the table lean.
async function purgeOldStats(): Promise<void> {
  if (!IS_MIDNIGHT_RUN) return;

  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - 30);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  await supabase
    .from('stats')
    .delete()
    .lt('date', cutoffStr);
}

// --- Step 2: Increment bot scores for this hour ---
// Each bot's group and active hours are derived from its UUID so the behaviour
// is consistent across every cron tick without storing any extra state.
// All reads and writes are batched into one query each (2 round-trips total).
async function updateBotStats(): Promise<void> {
  const today = new Date().toISOString().split('T')[0];

  // Fetch all bot profiles in one query
  const { data: bots, error: botsError } = await supabase
    .from('profiles')
    .select('id')
    .eq('sign', 1);

  if (botsError || !bots?.length) return;

  // Filter to only bots that are active this hour
  const activeBots = bots.filter((b) => getIncrement(getBotGroup(b.id), LOCAL_HOUR) !== null);
  if (!activeBots.length) return;

  const activeBotIds = activeBots.map((b) => b.id);

  // Fetch today's existing stats for all active bots in one query
  const { data: existing } = await supabase
    .from('stats')
    .select('user_id, practiced')
    .in('user_id', activeBotIds)
    .eq('date', today);

  // Build a lookup map: user_id → current practiced count
  const currentMap: Record<string, number> = {};
  for (const row of existing ?? []) {
    currentMap[row.user_id] = row.practiced;
  }

  // Calculate new values for each active bot
  const upsertRows = activeBots.map((b) => {
    const increment = getIncrement(getBotGroup(b.id), LOCAL_HOUR)!;
    const newPracticed = (currentMap[b.id] ?? 0) + increment;
    // Correct answers: 60–85 % of total, recalculated from the running total
    // so the ratio stays reasonable regardless of how many ticks have fired.
    const newCorrect = Math.floor(newPracticed * (0.60 + Math.random() * 0.25));
    return { user_id: b.id, date: today, practiced: newPracticed, correct: newCorrect };
  });

  // Write all updated rows in one upsert
  await supabase.from('stats').upsert(upsertRows);
}

// --- Step 3: Rebuild the leaderboard cache ---
// Aggregates daily / last7days / last30days practiced counts from the stats table,
// joined with profiles in a single query (stats.user_id → profiles.id FK exists).
// Format per line: username,avatarIndex,daily,last7days,last30days
async function rebuildCache(): Promise<void> {
  const today = new Date().toISOString().split('T')[0];

  const last7 = new Date();
  last7.setUTCDate(last7.getUTCDate() - 7);
  const last7Str = last7.toISOString().split('T')[0];

  const last30 = new Date();
  last30.setUTCDate(last30.getUTCDate() - 30);
  const last30Str = last30.toISOString().split('T')[0];

  // Single query: stat rows left-joined with their profile (username + avatar).
  // Users without a username get a fallback name derived from the last 6 chars of their UUID.
  const { data: rows, error } = await supabase
    .from('stats')
    .select('user_id, date, practiced, correct, profiles(username, avatar_index)')
    .gte('date', last30Str);

  if (error || !rows?.length) return;

  // Aggregate per user_id
  const totals: Record<string, {
    username: string;
    avatar: number;
    daily: number;
    dailyCorrect: number;
    last7: number;
    last7Correct: number;
    last30: number;
    last30Correct: number;
  }> = {};

  for (const row of rows) {
    const profile = row.profiles as { username: string | null; avatar_index: number } | null;

    // Fall back to "unknown_" + last 6 chars of UUID if no username set yet
    const username = profile?.username ?? `unknown_${row.user_id.replace(/-/g, '').slice(-6)}`;
    const avatar = profile?.avatar_index ?? 0;

    if (!totals[row.user_id]) {
      totals[row.user_id] = {
        username,
        avatar,
        daily: 0,
        dailyCorrect: 0,
        last7: 0,
        last7Correct: 0,
        last30: 0,
        last30Correct: 0,
      };
    }
    totals[row.user_id].last30 += row.practiced;
    totals[row.user_id].last30Correct += row.correct;
    if (row.date >= last7Str) {
      totals[row.user_id].last7 += row.practiced;
      totals[row.user_id].last7Correct += row.correct;
    }
    if (row.date === today) {
      totals[row.user_id].daily += row.practiced;
      totals[row.user_id].dailyCorrect += row.correct;
    }
  }

  const lines = Object.values(totals).map(
    (t) => `${t.username},${t.avatar},${t.daily},${t.dailyCorrect},${t.last7},${t.last7Correct},${t.last30},${t.last30Correct}`,
  );

  await supabase.from('cache').upsert({
    key: 'leaderboard',
    value: lines.join('\n'),
    updated_at: new Date().toISOString(),
  });
}

// --- Entry point ---
Deno.serve(async (req) => {
  // Simple bearer token auth — set CRON_SECRET in Edge Function env vars.
  // If the secret is not configured the endpoint is open (useful during initial testing).
  const authHeader = req.headers.get('Authorization');
  const expectedToken = Deno.env.get('CRON_SECRET');
  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    await purgeOldStats();
    await updateBotStats();
    await rebuildCache();
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
