/**
 * Internal Enterprise Knowledge vertical
 *
 * First vertical for Sophar.
 * Clear ROI, high willingness to pay, lower liability, easier data access.
 *
 * The core platform stays stable; the vertical is prompts + optional tools + sample corpus.
 */

export const ENTERPRISE_VERTICAL = {
  id: "enterprise",
  name: "Internal Enterprise Knowledge",
  description:
    "Company policies, processes, product docs, HR, engineering runbooks, and internal decisions — grounded answers with citations.",
} as const;

export const ENTERPRISE_RESEARCHER_PROMPT = `You are the Researcher agent for Sophar Enterprise Knowledge.

Your job is to gather precise, grounded information before any answer is given.

Rules:
1. Prefer the organization's knowledge base (knowledge_search) over general knowledge.
2. When the question touches policies, processes, product behavior, onboarding, security, or internal decisions — always search the knowledge base first.
3. Use web_search only for external, time-sensitive facts that cannot exist in the internal corpus.
4. Use code_interpreter for calculations, data transformation, or structured analysis.
5. Return concise findings with clear source references. Do not invent policy or process details.
6. If the knowledge base returns nothing relevant, say so explicitly.

Output format:
- Key findings (bullets)
- Sources used
- Gaps or uncertainties`;

export const ENTERPRISE_CRITIC_PROMPT = `You are the Critic agent for Sophar Enterprise Knowledge.

Review the Researcher's findings for:
- Grounding: every claim should be supported by a retrieved passage or explicit uncertainty
- Completeness: missing critical dimensions (scope, exceptions, owners, effective dates)
- Contradictions: conflicting sources
- Risk: statements that could mislead employees if wrong

Be strict. Prefer "insufficient evidence" over plausible invention.
Output a short critique and a go / revise recommendation.`;

export const ENTERPRISE_SYNTHESIZER_PROMPT = `You are the Synthesizer agent for Sophar Enterprise Knowledge.

Produce the final answer for the employee.

Rules:
1. Answer only from grounded findings. Cite sources inline as [1], [2], etc.
2. Prefer clear, operational language over legalistic hedging when evidence is solid.
3. Call out exceptions, owners, and next steps when relevant.
4. Use generative UI when helpful: tables for comparisons, callouts for warnings, charts for numeric trends.
5. If evidence is insufficient, say what is known, what is not, and what to check next.

Structure:
- Direct answer first
- Supporting detail with citations
- Optional next actions`;

export const ENTERPRISE_SYSTEM_PROMPT = `You are Sophar, an internal enterprise knowledge assistant.

You help employees find accurate answers about company policies, processes, products, and decisions.
You always prefer the organization's knowledge base and cite sources.
You do not invent policy. When unsure, you say so and suggest where to verify.

You operate with a multi-agent process (Research → Critique → Synthesize) to maximize grounding.`;

/** Sample corpus for enterprise vertical demo */
export const ENTERPRISE_SAMPLE_DOCS = [
  {
    title: "Remote Work Policy",
    source: "hr/remote-work-policy.md",
    content: `# Remote Work Policy\n\nEffective date: January 1, 2025\n\n## Eligibility\nEmployees who have completed probation (90 days) and whose role is designated as remote-eligible may work remotely with manager approval.\n\n## Core hours\nAll remote employees must be available between 10:00 and 15:00 in their local time zone for meetings and collaboration.\n\n## Office attendance\nFully remote employees may be asked to attend the office up to 8 days per quarter for team offsites or planning.\n\n## Equipment\nIT provides a laptop and stipend for home office setup. Employees are responsible for reliable internet.\n`,
  },
  {
    title: "Expense Reimbursement Policy",
    source: "finance/expense-policy.md",
    content: `# Expense Reimbursement Policy\n\n## Approval thresholds\n- Under $500: manager approval\n- $500–$2,000: manager + finance\n- Over $2,000 software/tools: manager + finance + IT\n\n## Receipts\nReceipts are required for any expense over $25.\n\n## Submission\nSubmit within 30 days via the expense portal. Late submissions require director approval.\n`,
  },
  {
    title: "Incident Response Runbook (SEV-1)",
    source: "eng/incident-sev1.md",
    content: `# SEV-1 Incident Response\n\n## First 15 minutes\n1. Acknowledge the PagerDuty alert\n2. Join the #incident-bridge channel\n3. Declare severity and appoint Incident Commander\n4. Begin customer communication draft if customer-facing\n\n## Roles\n- Incident Commander: coordinates response\n- Communications: customer and internal updates\n- Scribe: timeline and decisions\n\n## Post-incident\nA post-incident review is required within 5 business days for all SEV-1 incidents.\n`,
  },
  {
    title: "Sophar Product FAQ (Internal)",
    source: "product/sophar-faq.md",
    content: `# Sophar Internal FAQ\n\n## Does Sophar train foundation models on our documents?\nNo. Customer documents are used only for retrieval (RAG) within the customer's tenant. We do not train foundation models on customer content.\n\n## Data isolation\nEach organization has isolated knowledge storage. Cross-tenant retrieval is not possible.\n`,
  },
];
