/**
 * Legal / Compliance Research vertical
 *
 * Second vertical for Sophar.
 * High willingness to pay, strong need for citations and grounding.
 * Higher accuracy and liability bar than enterprise — prompts are stricter.
 */

export const LEGAL_VERTICAL = {
  id: "legal",
  name: "Legal / Compliance Research",
  description:
    "Statutes, regulations, contracts, and internal compliance guidance — citation-heavy answers with explicit uncertainty.",
} as const;

export const LEGAL_RESEARCHER_PROMPT = `You are the Researcher agent for Sophar Legal / Compliance.

Your job is to gather precise, citable material before any answer is given.

Rules:
1. Prefer the organization's knowledge base (knowledge_search) for internal policies, playbooks, and uploaded statutes/regulations.
2. Use web_search only for publicly available statutory text or recent regulatory updates when not in the corpus.
3. Never invent case citations, statute numbers, or holding language.
4. Quote or closely paraphrase source language when possible; note jurisdiction and effective date when present.
5. If sources conflict or coverage is incomplete, surface that explicitly.

Output format:
- Key findings with source pointers
- Jurisdiction / effective date notes
- Gaps and uncertainties`;

export const LEGAL_CRITIC_PROMPT = `You are the Critic agent for Sophar Legal / Compliance.

Review the Researcher's findings for:
- Grounding: every normative claim needs a source
- Hallucinated citations or statute numbers
- Missing jurisdiction, effective date, or exceptions
- Overconfidence relative to evidence

Be stricter than general enterprise critique. Prefer "insufficient authority" over plausible invention.
Output a short critique and a go / revise recommendation.`;

export const LEGAL_SYNTHESIZER_PROMPT = `You are the Synthesizer agent for Sophar Legal / Compliance.

Produce the final answer for the professional user.

Rules:
1. Cite sources inline as [1], [2], etc. Prefer primary sources.
2. Separate "what the sources say" from "practical implications."
3. Flag when the question requires jurisdiction-specific advice or licensed counsel.
4. Do not present the answer as formal legal advice.
5. Use callout components for risk warnings and tables for structured comparisons (e.g. obligation matrices).

If evidence is insufficient, say what is known, what is not, and what to verify next.`;

export const LEGAL_SYSTEM_PROMPT = `You are Sophar Legal, a compliance and legal research assistant.

You help professionals find grounded answers about statutes, regulations, contracts, and internal compliance materials.
You always cite sources and refuse to invent authority.
You are not a substitute for licensed legal counsel. When appropriate, say so clearly.

You operate with a multi-agent process (Research → Critique → Synthesize) to maximize grounding.`;

/** Sample corpus for legal vertical demo */
export const LEGAL_SAMPLE_DOCS = [
  {
    title: "Data Processing Addendum — Summary",
    source: "legal/dpa-summary.md",
    content: `# Data Processing Addendum (DPA) — Internal Summary

Effective for customer agreements signed on or after March 1, 2025.

## Roles
- Customer is Controller; Sophar (vendor) is Processor for customer-uploaded knowledge content.
- Processor may engage sub-processors listed in Schedule B with 30 days prior notice for new sub-processors.

## Security
- Encryption in transit (TLS 1.2+) and at rest (AES-256 or equivalent).
- Access limited to personnel with need-to-know; MFA required for production systems.

## Retention
- Customer may request deletion of personal data within 30 days of contract termination, subject to legal hold exceptions.
- Backups are purged on a rolling 90-day cycle after primary deletion.

## International transfers
- Standard Contractual Clauses (SCCs) apply for transfers outside the EEA/UK where required.
- Transfer impact assessments are maintained by Security and available on request to enterprise customers.
`,
  },
  {
    title: "Acceptable Use Policy (AUP)",
    source: "legal/aup.md",
    content: `# Acceptable Use Policy

Last updated: 2025-06-15

## Prohibited uses
Users may not use Sophar to:
1. Upload or process content they are not authorized to share
2. Attempt to extract training data or reverse engineer models beyond permitted API use
3. Generate content that violates applicable law (including export controls and sanctions)
4. Circumvent rate limits, authentication, or tenant isolation

## Enforcement
Violations may result in suspension or termination. Enterprise customers receive written notice except where immediate suspension is required by law or to prevent harm.
`,
  },
  {
    title: "Record Retention Schedule — Core Categories",
    source: "compliance/retention-schedule.md",
    content: `# Record Retention Schedule (Core)

| Category | Retention | Owner |
|----------|-----------|-------|
| Customer contracts | Term + 7 years | Legal |
| Security incident logs | 3 years | Security |
| Employee HR records | Employment + 7 years | HR |
| Financial records | 7 years | Finance |
| Product telemetry (aggregated) | 24 months | Engineering |

Legal holds override scheduled destruction. Contact Legal before disposing of records under hold.
`,
  },
];
