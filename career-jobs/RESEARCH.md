# Local research and employer catalog

Implemented 2026-09-27. The saved Career Advisor has the five `career_research`
tools alongside native Web Search, File Search and the four `career_jobs` tools.
Refresh LibreChat and select Career Advisor in a new conversation after changes.

## What runs locally

- A Jina-compatible HTTP endpoint ranks native search passages using lexical
  BM25. The `jina` configuration name is an interface adapter: no request goes
  to Jina, no trained neural reranker is used, and no paid reranking key is needed.
- `read_page` retrieves a public HTTPS page through the existing Keenable
  provider. It returns the actual source URL, checked time, snapshot ID, lexical
  matches and paged text. Continue with `document_id` and `offset` for deeper
  reading. Page caches are temporary; expired IDs require a new fetch.
- `search_companies`, `get_company` and `research_status` read the curated
  `companies.json` catalog. Each evidence item has a source URL and checked date.
- `search_opportunities` opens the existing jobs SQLite database read-only and
  defaults to a computing-role title heuristic. Set `engineering_only=false`
  for ambiguous titles. Full source records and qualifications remain accessible
  through `career_jobs.get_job_details`. No personalized ranking is implemented.

The service publishes no host port. Host/origin checks reject browser-origin
requests. The shared Docker volume is writable for SQLite WAL coordination, but
the database connection is read-only and no MCP write tool is exposed.

## Configuration and updates

Merge compose.snippet.yaml and librechat.snippet.yaml into existing root files;
the local installation has already been configured. Preserve other settings.
The `local-service-placeholder` value only satisfies the native Jina adapter's
nonempty-key requirement. It is not a paid provider credential or access secret.

Limits live in research.yaml, validated against the shared careerResearchSchema
also registered in configSchema. The separate file is necessary because the
currently installed prebuilt LibreChat image does not yet recognize a top-level
careerResearch field; adding it there prevents that image from starting.

```sh
docker compose build career-research
docker compose up -d --no-deps career-research
docker compose exec -T jobs python jobs.py sync
```

On a fresh installation, initialize the job database with the jobs service before
starting career-research. Recreate the API if changing its environment variables;
restart it after changing MCP registrations. Rebuild research after TS changes;
restart it after editing the company manifest or research limits. Neither company
records nor jobs refresh automatically. The import report preserves attempted
board identities, failures and corrections. Database volumes are not committed.

## Coverage and evidence boundaries

The initial expansion includes 34 company records, including all six MANGOS
targets; 28 employers have 29 nonempty imported boards (Anyscale has two).
The final deployed query on 2026-09-27 returned 8,155 active source postings,
with 2,423 matching the computing-title heuristic. Active means present at the
last successful board sync, not an independent check that applications remain open.
Google, Meta, NVIDIA, Clio, Macro and Mistral AI are research/discovery records,
not locally imported job feeds. Macro has a direct careers page; Mistral's
official linked Ashby board uses a dotted slug unsupported by the current Python
collector. Do not confuse these cases with no available jobs.

Seven company records have funding/backing evidence. Sources include employer
announcements and attributed job-posting claims. Funding date, current cash,
runway and team mentorship are different facts. The catalog covers only sampled
team descriptions and location tags, not complete organizational maps.
Runway AI and Runway (Financial Planning) are distinct company records and boards.
Counts are source postings, not globally deduplicated unique vacancies.

## Citations and verification

The saved RC/LFX answer reused earlier turnNsearchN markers after a new response
restarted search numbering at zero. Its saved latest attachment maps those
numbers to Linux Foundation pages. Earlier citations therefore rendered with
misleading labels. The advisor now uses explicit Markdown source URLs for web
claims and reads the actual page when facts matter. This is a scoped mitigation;
the general LibreChat citation renderer and old conversations were not rewritten.

The former late-page failure now passes through the installed native search
pipeline: 300 chunks, five locally ranked passages, and the final eligibility
marker retained. Live RC/LFX reads returned correct distinct titles/URLs, no
local truncation, and successful native search/rerank calls. Extraction itself
may still omit page elements; lexical matching is not semantic understanding.

Regression tests cover late evidence, complete paging, unique source identities,
truncation, cache expiry, URL rejection, and read-only job filters. Build performs
a strict focused TS check and six tests; the final rebuilt service passed all six.
Existing eight ingestion tests also pass. Final live checks confirmed all five MCP
tools, job counts, API health (200), and rejection of browser-origin requests (403).
Full workspace typechecks were attempted but the production image lacks test/dev
dependencies; Lighthouse cannot build locally because rimraf is absent. Do not
report those broad checks green. No fresh user-facing model answer has yet been
evaluated after these changes; tool/source verification is distinct from that.

Try in a new Career Advisor chat:

> Report job and company coverage. Compare Rilla, OpenAI and Cohere using sourced
> engineering and funding evidence. Find five computing roles in Toronto, New
> York or San Francisco. Read their full requirements and explain what remains
> unknown about mentorship and my readiness. Cite explicit original URLs.

> Read the official Recurse application page and LFX mentee guide using read_page.
> Report prerequisites and application process with direct source links. Continue
> reading if a needed fact is outside the first section; do not invent deadlines.
