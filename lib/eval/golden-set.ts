/**
 * Golden-set evaluation cases for Sophar verticals.
 * Extend with domain-specific cases as you ship new verticals.
 */

export type GoldenCase = {
  id: string;
  question: string;
  /** Must-have concepts or phrases in a faithful answer */
  mustContain?: string[];
  /** Concepts that should not appear (hallucination traps) */
  mustNotContain?: string[];
  /** Expected citation topics (substring match on title/snippet) */
  expectedCitationTopics?: string[];
  notes?: string;
};

export const ENTERPRISE_GOLDEN_SET: GoldenCase[] = [
  {
    id: "remote-eligibility",
    question: "Who is eligible for remote work and what are the core hours?",
    mustContain: ["probation", "manager", "10:00", "15:00"],
    expectedCitationTopics: ["Remote Work"],
    notes: "Should ground in Remote Work Policy",
  },
  {
    id: "expense-approval",
    question: "What is the approval chain for a $1,500 software purchase?",
    mustContain: ["manager", "finance", "IT"],
    expectedCitationTopics: ["Expense"],
  },
  {
    id: "sev1-response",
    question: "What should I do in the first 15 minutes of a SEV-1 incident?",
    mustContain: ["PagerDuty", "severity", "Incident Commander"],
    expectedCitationTopics: ["Incident"],
  },
  {
    id: "data-training",
    question: "Does Sophar train foundation models on our company documents?",
    mustContain: ["No", "retrieval"],
    mustNotContain: ["yes we train", "we use your data to train"],
    expectedCitationTopics: ["Sophar", "FAQ"],
  },
  {
    id: "unknown-policy",
    question: "What is our policy on bringing pets to the office every day?",
    mustNotContain: ["pets are allowed", "dogs welcome daily"],
    notes: "Should admit insufficient evidence rather than invent policy",
  },
  {
    id: "expense-receipt-threshold",
    question: "Do I need a receipt for a $20 taxi ride?",
    mustContain: ["25"],
    expectedCitationTopics: ["Expense"],
    notes: "Receipts required over $25",
  },
  {
    id: "remote-travel-days",
    question:
      "How many office days can fully remote employees be asked to attend per quarter?",
    mustContain: ["8"],
    expectedCitationTopics: ["Remote Work"],
  },
  {
    id: "incident-postmortem",
    question: "When is a post-incident review required?",
    mustContain: ["5 business days"],
    expectedCitationTopics: ["Incident"],
  },
];

/** Legal vertical golden cases (use with a legal-seeded org) */
export const LEGAL_GOLDEN_SET: GoldenCase[] = [
  {
    id: "dpa-roles",
    question:
      "In our DPA, who is Controller and who is Processor for customer-uploaded knowledge?",
    mustContain: ["Controller", "Processor"],
    expectedCitationTopics: ["DPA", "Data Processing"],
  },
  {
    id: "retention-contracts",
    question: "How long do we retain customer contracts?",
    mustContain: ["7 years"],
    expectedCitationTopics: ["Retention"],
  },
  {
    id: "aup-prohibited",
    question: "Can users upload content they are not authorized to share?",
    mustContain: ["may not", "not authorized"],
    expectedCitationTopics: ["Acceptable Use", "AUP"],
  },
  {
    id: "legal-hallucination-trap",
    question:
      "Cite the exact section of the GDPR that our DPA relies on for sub-processor notice.",
    mustNotContain: [
      "Article 99",
      "we rely on Article 6(1)(f) exclusively for all transfers",
    ],
    notes: "Should not invent specific article citations not in corpus",
  },
];
