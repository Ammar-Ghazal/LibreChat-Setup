# Technical mentorship quality and implementation plan

Recorded 2026-09-26. Design and acceptance criteria, not implemented capabilities.
The user prioritizes deeply personalized technical guidance and discovery of
high-value learning environments over simply expanding the job database. Read
ADVISOR.md for the full profile handling, ambitions and operating constraints.

## Desired behavior

Give careful technical guidance grounded in the user's actual contributions,
reasoning, goals and progress. Explain trade-offs, challenge unsupported claims,
and connect development to relevant roles and learning environments. Do not
claim perfect knowledge, human engineering experience, private Silicon Valley
access, personal relationships, introductions or guaranteed career outcomes.

## Architecture decision: one advisor with two focused modes

The user asked whether two separate agents would preserve specialization, and
authorized keeping both functions together if appropriate. Start with one saved
advisor and two focused conversational modes: career guidance and technical
mentoring. Share confirmed goals/profile and compact evidence of progress, while
retrieving only the documents/tools relevant to the immediate task. Separate
conversations with the same agent can keep long code reviews and career planning
focused; cross-conversation knowledge still requires accessible saved references.

User explicitly requests automatic transitions when skill/knowledge assessment
is needed. Flow: identify a material evidence gap in a career decision, reuse
existing current evidence, run a brief targeted diagnostic if necessary, then
return to the original decision with a qualified assessment. Explain the reason
for the shift without requiring mode-selection approval. Wait for real user
answers, adapt and avoid unnecessary/repeated testing. Respect requests to skip
and offer conditional guidance. Distinguish demonstrated, assisted and reported
ability. Validate both the diagnostic and the return to the original question;
a change of focus must not leave the user's career task unfinished.

Mode instructions are not enforced context/tool isolation. Validate separately:
career advice must use actual technical evidence and ambitions; technical advice
must remain specific to the artifact without drifting into networking/job lists.
Evaluate mixed requests for accurate transfer of demonstrated skills to plans.
Do not claim this architecture has outperformed two agents before comparison.

Revisit splitting if measured failures persist despite focused context, or if
workflows need different permissions, execution environments or model settings.
A split would require shared, versioned personal context and evidence handoffs;
two agent names alone do not confer expertise or synchronize memory. Current
decision adds prompt guidance only, not routing infrastructure or subagents.

## 1. Establish a technical baseline

Review one user-selected project deeply before prescribing a broad curriculum.
Collect repository/local path, revision, README/demo, individual contributions,
team boundaries, architecture, tests, measurements and unresolved problems.
Inspect relevant code and supporting artifacts; a resume or README alone cannot
establish implementation quality. Attribute each assessment to an artifact and
revision, user explanation, observed result or explicit inference.

Use a focused discussion: walk through a real feature or failure; ask why the
design was chosen, alternatives, constraints and what breaks under changed
conditions. Ask the user to explain or modify something small where useful.
Do not equate polished AI-assisted code with independently demonstrated skill,
or treat AI assistance as evidence of inability. Record what was demonstrated.

Maintain a capability table with: area, evidence, observed strengths, uncertainty,
next diagnostic task and next development step. Distinguish evidence missing
from skill missing. No invented numerical proficiency ratings.

## 2. Maintain correct, bounded personal context

Keep separate private records for approved profile/preferences, project evidence,
current plan and progress/decisions. Resolve conflicting facts with provenance;
ask focused questions only when answers affect the decision. Each project record
should include individual ownership, code revision, assessment date and open
questions. Record achieved outcomes separately from intentions and suggestions.

Current mechanism: local Markdown and manually uploaded references. These are
snapshots, not automatic memory. A future write/read mechanism needs validation,
user-visible correction/deletion and cross-session verification. Never promise
saved knowledge from a chat response alone. Retrieve only relevant material.

## 3. Research learning opportunities as carefully as jobs

Search beyond the starter examples: technical mentorship, open-source programs,
engineering retreats/residencies, fellowships, targeted bootcamps, accelerator
talent tracks, founder accelerators when appropriate, workshops and info sessions.
Recurse and LFX are examples the user likes, not universal winners.

For each serious candidate record:

- Official URL, source passages, checked date, program/cohort and application state.
- Specific capability gap it addresses and why it matches the user's baseline.
- Actual work/output, technical depth and prerequisites; beginner material may
  be redundant, while advanced content may require preparation.
- Mentor/reviewer qualifications, access, feedback format/frequency and cohort
  collaboration. Separate advertised claims from corroborated practice.
- Eligibility, location/remote options, timezone, duration and attendance needs.
- Tuition/fees, living/travel costs, stipend and any equity/investment terms.
- Application requirements/deadline with year/timezone if stated; unknowns remain
  unknown, and availability must be checked before recommending an application.
- Value compared with other shortlisted programs, a relevant job, and a focused
  project with human review. Explain both reasons to choose it and reasons to skip.

Use evidence-supported qualitative comparisons; do not invent a universal ranking
or implied acceptance probability. Strong branding and funding alone do not prove
mentorship quality. Prefer a small justified shortlist to an exhaustive directory.
Provide a preparation step and an application/readiness decision for each finalist.

## 4. Run a development loop

Agree on one priority and a concrete deliverable. Explain a relevant concept,
review a design, let the user implement and explain decisions, then review code,
tests and behavior. Give actionable feedback tied to observed work. Reassess the
capability table and next step after the user demonstrates improvement.

Offer hints or questions before full solutions during learning sessions unless
the user requests direct implementation. Preserve appropriate difficulty and
avoid overwhelming them with unrelated projects or a generic technology list.
Include technical judgment, communication and collaboration alongside coding.
Work-based learning can satisfy this loop; outside-work hours are not assumed.

## 5. Complement the AI with real people

Keep the three profile groups: aspirational examples, reachable next-stage
examples and potential mentors. Use the AI to prepare review material, questions,
outreach drafts and interview questions about team support. Actual introductions,
program admission and mentor willingness require real evidence; sending messages
or applications requires user authorization. Human review of important technical
assessments is valuable and should inform later guidance where available.

## Delivery order

1. Synchronize reviewed instructions/reference snapshots and assess one project.
2. Configure and verify bounded web search plus reading official program pages.
   Native LibreChat webSearch supports these components; provider setup is not
   yet verified for the saved advisor. See the official configuration reference:
   https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/web_search
3. Produce the first personalized program shortlist from the assessment and
   user constraints; store dated evidence, then run a learning/review cycle.
4. Implement and verify persistent project/progress context across new chats.
5. Expand the profile collection and relevant job coverage based on actual needs.

No live provider, automatic research schedule, repository integration, or memory
write path is created by this document. Existing File Search and career_jobs are
working foundations, not proof these additional capabilities exist.

## Quality evaluation before expansion

Compare current and revised agent responses to the same questions and references.
Check factual attribution, useful technical specificity, fit with ambitions,
feasibility and willingness to state uncertainty. Do not grade eloquence as
engineering correctness. Where possible use human-reviewed examples and observed
project results, rather than the same model's self-assessment alone.

Representative cases:

- Explains a project from inspected code and separates team work from ownership.
- Questions a reported metric when evaluation conditions are missing.
- Identifies a useful next task and changes advice when new evidence arrives.
- Compares programs by actual gap, feedback and output, not fame or generic lists.
- Labels stale deadlines, missing eligibility and unavailable live tools correctly.
- Retains corrected user facts in a new conversation only after a confirmed write.
- Preserves long-term ambitions while offering realistic intermediate options.
- Distinguishes potential mentors from confirmed availability or relationships.

Record failures, costs and user feedback. No claim of perfect personalization or
measured improvement is warranted until actual evaluations support it.
