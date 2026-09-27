import { test } from 'node:test';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { createCareerJobReader, isComputingRole } from '../../../data-schemas/src/career/jobs';
import { careerJobQuerySchema } from '../../../data-provider/src/career';
import { careerResearchSchema } from '../../../data-provider/src/career';
import { createReader, publicUrl, searchCompanies } from './evidence';
import { rank } from './ranking';

test('relevant late-page passage outranks boilerplate without changing source text', () => {
  const docs = Array.from({ length: 100 }, (_, i) =>
    i === 99
      ? 'Canadian eligibility requires an application before October 18.'
      : 'Welcome to our programming program.',
  );
  const result = rank('Canadian eligibility application deadline', docs, 5);
  assert.equal(result[0].index, 99);
  assert.equal(result[0].document.text, docs[99]);
});

test('paged source reads preserve URL and snapshot, and reach a late fact', async () => {
  const config = careerResearchSchema.parse({ pageChars: 1000 });
  const content = 'Introduction. '.repeat(3000) + 'Canadian eligibility: SENTINEL';
  const read = createReader(config, async () => ({
    content,
    title: 'Program',
    url: 'https://example.com/program',
  }));
  const first = await read({ url: 'https://example.com/program', query: 'Canadian eligibility' });
  assert.ok(first.matches?.some((match) => match.text.includes('SENTINEL')));
  assert.equal(first.citation.url, 'https://example.com/program');
  let offset = 0;
  let assembled = '';
  do {
    const page = await read({ document_id: first.source.id, offset });
    assembled += page.text;
    if (page.next_offset === null) break;
    offset = page.next_offset;
  } while (offset < content.length);
  assert.equal(assembled, content);
});

test('different sources have distinct identities; truncation and expired snapshots are explicit', async () => {
  const config = careerResearchSchema.parse({ storedPageChars: 24000, cacheEntries: 1 });
  const read = createReader(config, async (url) => ({ content: 'x'.repeat(25000), url }));
  const rc = await read({ url: 'https://recurse.com/apply' });
  const lfx = await read({ url: 'https://docs.linuxfoundation.org/lfx' });
  assert.notEqual(rc.source.id, lfx.source.id);
  assert.equal(rc.source.truncated, true);
  assert.equal(rc.source.extracted_chars, 25000);
  await assert.rejects(read({ document_id: rc.source.id }), /expired/);
});

test('reject local, credentialed and non-HTTPS page targets', () => {
  for (const url of [
    'http://example.com',
    'https://127.0.0.1',
    'https://[::1]',
    'https://service.local',
    'https://user:pass@example.com',
    'https://example.com:8000',
  ]) {
    assert.throws(() => publicUrl(url));
  }
});

test('empty catalog reports zero without invented companies', () => {
  assert.deepEqual(searchCompanies([], 'NVIDIA', 10, 0), {
    total: 0,
    next_offset: null,
    companies: [],
  });
});

test('job reader filters computing roles, preserves access to ambiguous titles, and binds query input', () => {
  assert.equal(isComputingRole('Senior Backend Engineer'), true);
  assert.equal(isComputingRole('AI Marketing Manager'), false);
  assert.equal(isComputingRole('Technical Program Manager, Custom Silicon'), false);
  const directory = mkdtempSync(join(tmpdir(), 'career-test-'));
  const path = join(directory, 'jobs.sqlite3');
  const db = new DatabaseSync(path);
  db.exec(
    'CREATE TABLE jobs (job_key TEXT, company TEXT, title TEXT, location TEXT, url TEXT, last_seen TEXT, status TEXT, description TEXT)',
  );
  const insert = db.prepare('INSERT INTO jobs VALUES (?,?,?,?,?,?,?,?)');
  insert.run(
    '1',
    'Example',
    'Software Engineer',
    'Toronto',
    'https://example.com/1',
    '2026-09-27',
    'active',
    'Python required',
  );
  insert.run(
    '2',
    'Example',
    'Civil Engineer',
    'Toronto',
    'https://example.com/2',
    '2026-09-27',
    'active',
    'Structures',
  );
  insert.run(
    '3',
    'Example',
    'Software Engineer',
    'London',
    'https://example.com/3',
    '2026-09-26',
    'not_seen',
    'Python',
  );
  db.close();
  const reader = createCareerJobReader(path);
  try {
    assert.equal(reader.search(careerJobQuerySchema.parse({})).total_matches, 1);
    assert.equal(
      reader.search(careerJobQuerySchema.parse({ engineering_only: false })).total_matches,
      2,
    );
    assert.equal(
      reader.search(careerJobQuerySchema.parse({ query: "' OR 1=1 --" })).total_matches,
      0,
    );
    assert.equal(
      reader.search(careerJobQuerySchema.parse({ location: 'London' })).total_matches,
      0,
    );
  } finally {
    reader.close();
    rmSync(directory, { recursive: true });
  }
});
