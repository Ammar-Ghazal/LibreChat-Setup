import { z } from 'zod';

/** Limits for the optional, separately deployed local career research service. */
export const careerResearchSchema = z.object({
  port: z.number().int().min(1024).max(65535).default(8001),
  pageChars: z.number().int().min(1000).max(24000).default(8000),
  storedPageChars: z.number().int().min(24000).max(1000000).default(250000),
  fetchTimeoutMs: z.number().int().min(1000).max(120000).default(20000),
  responseBytes: z.number().int().min(100000).max(10000000).default(2000000),
  requestBytes: z.number().int().min(100000).max(10000000).default(2000000),
  cacheEntries: z.number().int().min(1).max(200).default(30),
  maxDocuments: z.number().int().min(10).max(20000).default(5000),
});

export type CareerResearchConfig = z.infer<typeof careerResearchSchema>;

export const careerJobQuerySchema = z.object({
  query: z.string().max(500).default(''),
  company: z.string().max(200).default(''),
  location: z.string().max(200).default(''),
  engineering_only: z.boolean().default(true),
  limit: z.number().int().min(1).max(25).default(10),
  offset: z.number().int().nonnegative().default(0),
});
export type CareerJobQuery = z.infer<typeof careerJobQuerySchema>;
