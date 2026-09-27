import { DatabaseSync } from 'node:sqlite';
import type { CareerJobQuery } from '../../../data-provider/src/career';

/** Transparent title heuristic; retains all source postings for unrestricted searches. */
export function isComputingRole(title: string): boolean {
  if (/sales|recruit|account executive|field service technician/i.test(title)) return false;
  if (/member of technical staff|\bsre\b|devops/i.test(title)) return true;
  if (!/engineer|developer|scientist|researcher|architect/i.test(title)) return false;
  return /software|firmware|embedded|machine learning|\bml\b|\bai\b|artificial intelligence|data|computer vision|robotic|autonomy|autonomous|site reliability|developer|security|network|hardware|silicon|\basic\b|\bfpga\b|\bgpu\b|infrastructure|platform|research|distributed systems|back[ -]?end|front[ -]?end|full[ -]?stack|mobile|android|\bios\b|\baosp\b|application|product|test|quality|automation|build|release/i.test(
    title,
  );
}

export function createCareerJobReader(path: string) {
  const db = new DatabaseSync(path, { readOnly: true });
  db.function('computing_role', { deterministic: true }, (title) =>
    isComputingRole(String(title)) ? 1 : 0,
  );
  return {
    close: () => db.close(),
    search: (input: CareerJobQuery) => {
      const clauses = ["status='active'"];
      const args: string[] = [];
      if (input.engineering_only) clauses.push('computing_role(title)=1');
      for (const term of input.query.split(/\s+/).filter(Boolean)) {
        clauses.push('(instr(lower(title),lower(?))>0 OR instr(lower(description),lower(?))>0)');
        args.push(term, term);
      }
      for (const [key, value] of [
        ['company', input.company],
        ['location', input.location],
      ]) {
        if (!value) continue;
        clauses.push(`instr(lower(${key}),lower(?))>0`);
        args.push(value);
      }
      const where = clauses.join(' AND ');
      const total = Number(
        db.prepare(`SELECT COUNT(*) AS n FROM jobs WHERE ${where}`).get(...args)?.n ?? 0,
      );
      const jobs = db
        .prepare(
          `SELECT job_key, company, title, location, url, last_seen, status,
        substr(description,1,600) AS excerpt FROM jobs WHERE ${where}
        ORDER BY last_seen DESC, job_key LIMIT ? OFFSET ?`,
        )
        .all(...args, input.limit, input.offset)
        .map((row) => ({
          job_key: String(row.job_key),
          company: String(row.company),
          title: String(row.title),
          location: String(row.location),
          url: String(row.url),
          last_seen: String(row.last_seen),
          status: String(row.status),
          excerpt: String(row.excerpt),
        }));
      return {
        total_matches: total,
        jobs,
        next_offset: input.offset + input.limit < total ? input.offset + input.limit : null,
        note: 'Title-based computing-role filter, not a qualification or career-fit ranking. It may miss ambiguous titles; engineering_only=false searches all source roles. Active means observed at last successful sync. Use career_jobs.get_job_details for full required/preferred qualifications, compensation and eligibility.',
      };
    },
  };
}
