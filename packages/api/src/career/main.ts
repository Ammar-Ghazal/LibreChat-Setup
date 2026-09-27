import { z } from 'zod';
import { parse } from 'yaml';
import { readFileSync } from 'node:fs';
import { createCareerJobReader } from '../../../data-schemas/src/career/jobs';
import { careerResearchSchema } from '../../../data-provider/src/career';
import { companySchema, createReader } from './evidence';
import { createResearchApp } from './server';

const configPath = process.argv[2] ?? '/app/librechat.yaml';
const catalogPath = process.argv[3] ?? '/app/companies.json';
const jobsPath = process.argv[4] ?? '/data/jobs.sqlite3';
const document = z
  .object({ careerResearch: careerResearchSchema.default({}) })
  .parse(parse(readFileSync(configPath, 'utf8')));
const companies = z.array(companySchema).parse(JSON.parse(readFileSync(catalogPath, 'utf8')));
if (new Set(companies.map((company) => company.id)).size !== companies.length)
  throw new Error('Duplicate company IDs');
const config = document.careerResearch;
const jobs = createCareerJobReader(jobsPath);
const server = createResearchApp(config, companies, createReader(config), jobs).listen(
  config.port,
  '0.0.0.0',
  () => {
    console.log(
      `Career research listening on ${config.port}; ${companies.length} companies; local BM25 ranking`,
    );
  },
);
process.on('SIGTERM', () => {
  server.close(() => {
    jobs.close();
    process.exit(0);
  });
});
