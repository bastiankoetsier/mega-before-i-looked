import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import type { DigestRow } from '../src/digest/types.js';

let dir: string;
let app: ReturnType<typeof createApp>;

const line = (at: string, job: string, status: string, owner: string | null, error?: string) =>
  JSON.stringify({ at, job, status, owner, ...(error ? { error } : {}) });

const GOOD = [
  line('2026-10-28T02:00:00+01:00', 'zeta-sync', 'ok', 'ana'),
  line('2026-10-28T02:05:00+01:00', 'alpha-backup', 'retry', 'bo'),
  line('2026-10-28T02:10:00+01:00', 'alpha-backup', 'fail', 'bo', 'disk full'),
  line('2026-10-28T02:15:00+01:00', 'mid-report', 'ok', null),
];

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), 'digest-routes-'));
  writeFileSync(join(dir, '2026-10-01.jsonl'), GOOD.join('\n') + '\n');
  writeFileSync(join(dir, '2026-10-02.jsonl'), '');
  writeFileSync(join(dir, '2026-10-03.jsonl'), [GOOD[0], 'not json {', GOOD[1]].join('\n') + '\n');
  app = createApp({ adapter: 'shim', installed: '2026-10-29T14:06:00+01:00', beatEverySeconds: 60, runsDir: dir });
});

afterAll(() => rmSync(dir, { recursive: true, force: true }));

const jobsInPage = (html: string) => [...html.matchAll(/(alpha-backup|mid-report|zeta-sync)/g)].map((m) => m[1]);

describe('GET /digest/:night', () => {
  it('renders the night as a table with its jobs', async () => {
    const res = await app.request('/digest/2026-10-01');
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html).toContain('<table');
    for (const job of ['alpha-backup', 'mid-report', 'zeta-sync']) expect(html).toContain(job);
  });

  it('404s when the night has no file', async () => {
    expect((await app.request('/digest/2026-09-09')).status).toBe(404);
  });

  it('says "nothing ran" for an empty file', async () => {
    const res = await app.request('/digest/2026-10-02');
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('nothing ran');
  });

  it('still renders the good jobs when a line is bad', async () => {
    const res = await app.request('/digest/2026-10-03');
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html).toContain('zeta-sync');
    expect(html).toContain('alpha-backup');
  });
});

describe('GET /api/digest/:night', () => {
  it('returns night, rows sorted by job and no bad lines', async () => {
    const res = await app.request('/api/digest/2026-10-01');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { night: string; rows: DigestRow[]; badLines: number };
    expect(body.night).toBe('2026-10-01');
    expect(body.badLines).toBe(0);
    expect(body.rows.map((r) => r.job)).toEqual(['alpha-backup', 'mid-report', 'zeta-sync']);
    expect(body.rows[0]).toMatchObject({ runs: 2, retries: 1, fails: 1, lastStatus: 'fail', lastError: 'disk full' });
    expect(body.rows[1]?.owner).toBeNull();
  });

  it('404s when the night has no file', async () => {
    expect((await app.request('/api/digest/2026-09-09')).status).toBe(404);
  });

  it('returns no rows and no bad lines for an empty file', async () => {
    const res = await app.request('/api/digest/2026-10-02');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ night: '2026-10-02', rows: [], badLines: 0 });
  });

  it('counts a bad line and keeps the good rows', async () => {
    const res = await app.request('/api/digest/2026-10-03');
    const body = (await res.json()) as { rows: DigestRow[]; badLines: number };
    expect(res.status).toBe(200);
    expect(body.badLines).toBe(1);
    expect(body.rows.map((r) => r.job)).toEqual(['alpha-backup', 'zeta-sync']);
  });
});

describe('page and JSON agree', () => {
  it.each(['2026-10-01', '2026-10-03'])('lists the same jobs in the same order for %s', async (night) => {
    const html = await (await app.request(`/digest/${night}`)).text();
    const body = (await (await app.request(`/api/digest/${night}`)).json()) as { rows: DigestRow[] };
    const jobs = body.rows.map((r) => r.job);
    expect(jobs.length).toBeGreaterThan(0);
    expect([...new Set(jobsInPage(html))]).toEqual(jobs);
  });
});
