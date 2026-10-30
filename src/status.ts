import { readdirSync } from 'node:fs';
import type { RigConfig } from './config.js';
import { readNight } from './digest/read.js';
import type { Night } from './digest/types.js';
import { lastBeat, type Beat } from './heartbeat.js';

export type Status = {
  adapter: string;
  installed: string;
  lastBeat: Beat | null;
  nights: NightSummary[];
};

export type Counts = { ok: number; retry: number; fail: number };
// counts is null when the night can't be read (views render `—`).
export type NightSummary = { night: string; counts: Counts | null };

// Counts are run lines by status: retry = sum(retries), fail = sum(fails), ok = the rest.
export function countNight(night: Night): Counts {
  const c: Counts = { ok: 0, retry: 0, fail: 0 };
  for (const r of night.rows) {
    c.retry += r.retries;
    c.fail += r.fails;
    c.ok += r.runs - r.retries - r.fails;
  }
  return c;
}

// Nights on disk = runs/<YYYY-MM-DD>.jsonl, newest first.
export function nightsOnDisk(runsDir: string): string[] {
  try {
    return readdirSync(runsDir)
      .filter((f) => /^\d{4}-\d{2}-\d{2}\.jsonl$/.test(f))
      .map((f) => f.slice(0, 10))
      .sort()
      .reverse();
  } catch {
    return [];
  }
}

export function readStatus(config: RigConfig): Status {
  return {
    adapter: config.adapter,
    installed: config.installed,
    lastBeat: lastBeat(),
    nights: nightsOnDisk(config.runsDir).map((night) => {
      const read = readNight(config.runsDir, night);
      return { night, counts: read ? countNight(read) : null };
    }),
  };
}
