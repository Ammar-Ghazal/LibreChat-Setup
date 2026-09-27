# Web research setup

Checked 2026-09-27. The implementation described in [RESEARCH.md](RESEARCH.md)
is now deployed: Keenable discovery/extraction, local BM25 passage ranking, and
paged `read_page` with explicit source URLs. The saved advisor has the tools and
updated instructions. The sections below preserve the earlier diagnostics and
setup alternatives; descriptions of disabled reranking or proposed repairs are
historical. No paid reranker key is required for the current local configuration.

The saved RC/LFX response was inspected: reused search markers could point at a
newer search's attachment instead of the intended older source. Explicit source
links are the scoped mitigation; the general citation renderer is unchanged.
Tool-level tests pass, including the formerly omitted late-page marker. A new
user-facing answer still needs its claims and links checked.

Using the local browser is possible with a separate browser-control connector;
LibreChat's model does not automatically inherit control of desktop tabs.
Incognito changes local browsing persistence, not search-provider throttling,
CAPTCHAs or the amount of page text supplied to the model. No browser connector
has been installed. The current provider plus local reading/ranking tools remain
the implemented research path.

## Verified installation and empty-search diagnosis

The user subsequently configured Keenable search/scraping with reranking disabled
and attached web_search to the saved Career Advisor. Its first failed tool call
combined Recurse and LFX, two site: restrictions and many terms into one query.
Replaying that exact query through createSearchTool returned zero results and an
empty formatted tool response. This was not a missing API key or failed scraper.

Separate official-site queries ("site:recurse.com application retreat" and
"site:lfx.linuxfoundation.org mentorship guide") each returned three results,
three successful extractions and nonempty formatted content. These checks used
the full installed tool with LibreChat's normal SSRF-safe network agents.
Broad single-subject queries also worked. No private profile was sent and no
paid model call was made by these diagnostics.

Verification: git diff --check passed. The repository Lighthouse check could not
start its build because local rimraf/dependencies are absent; this does not affect
the running Docker tool checks. No application source code was changed.

Appended concise-query and bounded-empty-result-retry guidance to the actual
saved Career Advisor via LibreChat's versioned updateAgent method (version
count 6 -> 7), preserving prior instructions, tools and attached files. The local
INSTRUCTIONS.md includes the same guidance. Refresh/select the agent and retry
the original comparison; corrected model query behavior remains to be confirmed
in a new user-facing conversation. No Docker restart or new provider key needed.

Search discovers URLs; a scraper/page reader retrieves their contents. Neither
automatically adds postings to career_jobs, which has its own collectors and DB.

## Research quality audit and proposed next work

On 2026-09-27 the user supplied a completed RC/LFX comparison after raising
provider limits. This confirms a completed answer as reported by the user, not
independent verification of its claims or effective API limits. It explicitly
leaves live LFX listings, mentor quality and project fit unassessed. Copied
citations repeatedly display "Linux Foundation Documentation", including beside
RC claims; original citation destinations need inspection before diagnosing
misattribution versus a display/copy issue.

Read-only inspection of the installed @librechat/agents code established:

- Local YAML requests five Keenable results per query, with 15-second search
  and scrape timeouts and rerankerType none. Five is per query, not per task.
- Runtime defaults retain up to 50,000 cleaned characters per page and budget
  50,000 highlight characters per search output (metadata is additional).
  SEARCH_MAX_CONTENT_LENGTH and SEARCH_MAX_LLM_OUTPUT_CHARS are unset in the
  running API; these are character limits, not model token limits.
- With no reranker, passage selection takes the first five chunks, then expands
  around them. It is not query-relevance selection. Chunk defaults are 150
  characters with 50 overlap; long unbroken sections can exceed chunk size.
- An offline synthetic test through createSourceProcessor and expandHighlights
  used a 28,319-character page with an eligibility marker at its end. Five
  highlights were returned, and the marker did not reach the formatted source
  data. This demonstrates an omission risk below the page cap, not proof that
  any particular fact in the user's RC/LFX research was omitted.

Proposed direction, not implemented or approved as a new build: retain live
search, improve passage retrieval/direct page reading, and curate a local
evidence library. Evaluate a supported reranker against known-answer pages,
including facts near the end, with a deeper-reading fallback when passages
cannot establish a required fact. Expose truncation and retrieval failures.
Do not assume a paid provider or reranker improves quality without testing.

Build a small local pilot around user project assessments, the existing three
profile categories, programs/communities, and companies/teams linked to jobs.
Keep original source URLs, retrieved text, checked dates, evidence versus
inference, and refresh status. Retrieve relevant passages with surrounding
context instead of loading the entire corpus into every prompt; verify volatile
deadlines, jobs and availability live before recommending action. No new
collection, background refresh, external provider or custom scraper was enabled.

Prioritize citation verification, passage recall and completing a concrete
opportunity shortlist over bulk scraping. A future custom reader should address
measured extraction gaps and reuse maintained extraction/rendering components;
it does not replace a search index or remove model context/rate limits.

## Subsequent OpenAI token-rate error

Update, 2026-09-27: the user reports raising the following limits:

| Model | TPM | RPM |
| --- | ---: | ---: |
| gpt-6-astra | 500,000 | 500 |
| gpt-6-sol | 500,000 | 500 |
| gpt-6-luna | 200,000 | 500 |
| text-embedding-3-large | 1,000,000 | 3,000 |
| Default | 250,000 | 3,000 |

These settings have not been independently verified against the project used
by LibreChat. The next step is to retry the Recurse/LFX comparison and confirm
a complete answer with retrieved official sources. No Docker restart is needed
for provider-side rate-limit changes. The earlier error and diagnosis below
remain historical evidence; do not present the 50,000 TPM cap as the confirmed
current setting. The user subsequently supplied a completed comparison; see the
quality audit above. Effective account limits have not been independently read.

The next user-facing run followed separate queries and an empty-result retry.
Mongo message metadata confirms four web searches (20,510, 0, 21,430 and 21,312
output characters) and one file search (12,058 characters). Total retrieved
content: 75,310 characters, not tokens. No final comparison completed because
the provider returned a token-per-minute error. Tool output/history can be sent
again on later model calls, so a multi-step turn consumes more than one request.

Error figures: effective gpt-6-sol limit 50,000 TPM; 36,255 already used; 25,121
requested, yielding 61,376 against that window. Retry hint approximately 13.7s.
The user's organization page lists 500,000 TPM. Official OpenAI docs confirm
organization and project limits both apply. The exact project's configuration
has not been read; do not claim a project override is conclusively established.

First inspect the project named in the error and its Sol rate limit. If it is
50,000 while the organization permits 500,000, the owner can raise the project's
throughput limit without changing the separate spend limit. Do not purchase more
credits solely to solve an unverified project override. Respect server retry
delays; immediate repeated retries can add pressure. If the exact project already
shows 500,000, check account/key/project selection and capture provider request ID
and rate-limit headers before escalating a persistent mismatch.

No model or retrieval-quality reduction applied. Potential subsequent work:
measure and bound redundant context, avoid unnecessary repeated file retrieval,
and inspect installed retry behavior. The current webSearch config schema exposes
Keenable maxResults but not the underlying tool's maxOutputChars; do not add an
unsupported YAML field and claim it limits output. Any new context limit requires
proper schema/runtime integration, evidence-preserving behavior and tests.

Sources: https://developers.openai.com/api/docs/guides/rate-limits and
https://developers.openai.com/api/docs/guides/spend-limits (checked 2026-09-27).

## Keyless starter configuration

The running API container exposes Keenable search and scraper adapters. One
public search for Recurse Center returned results, and extracting
https://www.recurse.com/apply returned a titled, nonempty document (4,941 chars).
These were direct adapter checks, not a saved-agent end-to-end test or broad
quality evaluation. Search results included legacy domains and a stale deadline
snippet. Check original current pages; search snippets do not verify deadlines.

Merge the following top-level block into root librechat.yaml, preserving existing
configuration and avoiding duplicate webSearch keys:

```yaml
webSearch:
  searchProvider: keenable
  scraperProvider: keenable
  rerankerType: none
  keenableSearchOptions:
    maxResults: 5
    timeout: 15000
  keenableScraperOptions:
    timeout: 15000
```

No search, scraper or reranker API key is required for this public configuration.
The hosted endpoints are rate-limited; no unlimited service or guaranteed quality
is implied. Search queries and requested URLs are sent to the provider. Model
inference costs remain separate.

After editing the mounted YAML, restart only the API:

```sh
docker compose restart api
```

In Agent Builder, select Career Advisor, add the native Web Search tool, save,
and use Select to start a new agent chat. Verify actual search/page-reading tool
results and citations using a prompt such as:

> Find the official Recurse Center application page and an official LFX
> mentorship page. Read them and report program format, application information,
> requirements and unknowns, with URLs and checked dates. Do not infer current
> deadlines from snippets or old cohorts. Explain any failed page retrieval.

Only record this as implemented after configuration, tool attachment and actual
agent behavior have been verified. Do not disable existing security checks to
fetch inaccessible profiles. LinkedIn access is not guaranteed by any scraper.

## One-key fallback: Tavily

Tavily supports both search and extraction. Its pricing page currently lists
1,000 free credits/month with no card required; operations consume different
credit amounts, so this is not necessarily 1,000 complete research tasks.

Create an account yourself and enter the key locally, never in chat or Git.
Set TAVILY_API_KEY in the ignored .env, then use this alternative YAML block:

```yaml
webSearch:
  searchProvider: tavily
  scraperProvider: tavily
  rerankerType: none
  tavilyApiKey: '${TAVILY_API_KEY}'
```

Recreate the API when changing container environment:

```sh
docker compose up -d --no-deps --force-recreate api
```

Tavily was not tested because no key was supplied for this task. Do not describe
it as empirically better than Keenable without a representative comparison.

## Alternatives and collection strategy

Firecrawl is another supported page reader; its pricing page currently lists
1,000 free credits/month. In this LibreChat version it is a scraper option, not
a native search-provider enum, even though Firecrawl itself offers search.
Self-hosted SearXNG can provide search, but still needs a page-reading component
and maintenance; upstream engines may throttle or block queries.

Prefer existing integrations before developing a general scraper. A reliable
custom reader needs clean text extraction, optional browser rendering, bounded
fetches, redirect/address validation, retries, caching and rate limits. It does
not by itself supply an internet search index. For growing the jobs dataset,
expand verified employer boards through the existing Greenhouse/Lever/Ashby
collectors, then add missing source types as needed. Research tools help discover
sources and investigate employers/programs; they do not replace persistent sync.

Sources checked:

- https://www.librechat.ai/docs/features/web_search
- https://www.tavily.com/pricing
- https://www.firecrawl.dev/pricing
- https://docs.searxng.org/
