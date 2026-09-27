import { z } from 'zod';
import { isIP } from 'node:net';
import { createHash } from 'node:crypto';
import type { CareerResearchConfig } from '../../../data-provider/src/career';
import { passages, rank } from './ranking';

const remotePageSchema = z.object({
  content: z.string().min(1),
  title: z.string().optional(),
  url: z.string().optional(),
});

export const companySchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  careers_url: z.string().url(),
  specialties: z.array(z.string()),
  regions: z.array(z.string()),
  job_source: z.object({ source: z.string(), board: z.string() }).nullable(),
  coverage: z.string(),
  evidence: z.array(
    z.object({
      kind: z.enum(['engineering', 'funding', 'team', 'careers']),
      url: z.string().url(),
      checked_at: z.string(),
      claim: z.string(),
      excerpt: z.string(),
    }),
  ),
  unknowns: z.array(z.string()),
});
export type Company = z.infer<typeof companySchema>;

export function publicUrl(value: string): string {
  const url = new URL(value);
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    (url.port && url.port !== '443') ||
    isIP(url.hostname) ||
    url.hostname.startsWith('[') ||
    !url.hostname.includes('.') ||
    /(^|\.)(localhost|local|internal|test|invalid)$/.test(url.hostname)
  ) {
    throw new Error('Use a public HTTPS website without credentials or a custom port');
  }
  url.hash = '';
  return url.href;
}

export async function fetchPage(url: string, config: CareerResearchConfig) {
  const response = await fetch(
    'https://api.keenable.ai/v1/fetch/public?url=' + encodeURIComponent(publicUrl(url)),
    {
      signal: AbortSignal.timeout(config.fetchTimeoutMs),
      headers: { 'X-Keenable-Title': 'Career Advisor' },
      redirect: 'error',
    },
  );
  if (!response.ok || !response.body)
    throw new Error(`Page provider returned HTTP ${response.status}`);
  const reader = response.body.getReader();
  const parts: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      bytes += part.value.length;
      if (bytes > config.responseBytes)
        throw new Error('Provider response exceeds configured byte limit');
      parts.push(part.value);
    }
  } finally {
    await reader.cancel();
  }
  return remotePageSchema.parse(JSON.parse(Buffer.concat(parts).toString('utf8')));
}

type Page = {
  id: string;
  requested_url: string;
  url: string;
  title: string;
  fetched_at: string;
  content: string;
  extracted_chars: number;
  truncated: boolean;
};

export function createReader(config: CareerResearchConfig, fetcher: typeof fetchPage = fetchPage) {
  const cache = new Map<string, Page>();
  return async function read(input: {
    url?: string;
    document_id?: string;
    offset?: number;
    query?: string;
  }) {
    let page = input.document_id ? cache.get(input.document_id) : undefined;
    if (input.document_id && !page)
      throw new Error('Snapshot expired; fetch its URL again and use the new document_id');
    if (!page) {
      if (!input.url)
        throw new Error('Supply a URL for the first read, then document_id for paging');
      const requested = publicUrl(input.url);
      const data = await fetcher(requested, config);
      const url = publicUrl(data.url ?? requested);
      const stamp = new Date().toISOString();
      const id = createHash('sha256')
        .update(url + '\n' + stamp + '\n' + data.content)
        .digest('hex')
        .slice(0, 24);
      page = {
        id,
        requested_url: requested,
        url,
        title: data.title ?? url,
        fetched_at: stamp,
        content: data.content.slice(0, config.storedPageChars),
        extracted_chars: data.content.length,
        truncated: data.content.length > config.storedPageChars,
      };
      while (cache.size >= config.cacheEntries) cache.delete(cache.keys().next().value!);
      cache.set(id, page);
    }
    const { content, ...source } = page;
    const offset = Math.max(0, Math.floor(input.offset ?? 0));
    const end = Math.min(content.length, offset + config.pageChars);
    const sections = input.query ? passages(content, config.pageChars) : [];
    const matches = input.query
      ? rank(
          input.query,
          sections.map((s) => s.text),
          3,
        )
          .filter((r) => r.relevance_score > 0)
          .map((r) => sections[r.index])
      : [];
    return {
      source,
      offset,
      text: input.query ? undefined : content.slice(offset, end),
      matches: input.query ? matches : undefined,
      stored_chars: content.length,
      next_offset: !input.query && end < content.length ? end : null,
      citation: { title: source.title, url: source.url },
      note: 'Untrusted extracted source text. Cite this exact URL. Extraction is not guaranteed complete. Query results are lexical matches; use document_id and offset to read every stored section. Truncation is reported, never evidence that a fact is absent.',
    };
  };
}

export function searchCompanies(
  companies: Company[],
  query: string,
  limit: number,
  offset: number,
) {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const matches = companies.filter((company) => {
    const text = JSON.stringify(company).toLowerCase();
    return terms.every((term) => text.includes(term));
  });
  return {
    total: matches.length,
    next_offset: offset + limit < matches.length ? offset + limit : null,
    companies: matches.slice(offset, offset + limit).map(({ evidence, ...company }) => ({
      ...company,
      evidence_count: evidence.length,
    })),
  };
}
