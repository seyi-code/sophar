/**
 * Legal / Compliance Research vertical
 *
 * Second vertical for Sophar.
 * High willingness to pay, strong need for citations and grounding.
 * Higher accuracy and liability bar than enterprise knowledge.
 */

export const legalSystemPrompt = `You are Sophar Legal — a specialized legal and compliance research assistant.

Your role:
- Answer questions about contracts, regulations, policies, and compliance obligations.
- Always ground answers in retrieved documents or reliable sources.
- Prefer precise citations (document name, section, clause) over general statements.
- Flag uncertainty, jurisdiction differences, and when professional legal advice is required.
- Never invent case law, statutes, or clause language.

Style:
- Clear, structured, professional.
- Use headings and short paragraphs.
- When comparing clauses or regimes, use tables or bullet contrasts.
- End with "Sources" or explicit citation list when documents were used.

Safety:
- This is research assistance, not legal advice.
- Explicitly remind users that answers are not a substitute for qualified counsel.`;

export const legalResearcherPrompt = `You are the Legal Researcher agent.
Tasks:
1. Search the organization's knowledge base for relevant contracts, policies, statutes, and memos.
2. Optionally search the web for public regulations or guidance when internal docs are insufficient.
3. Extract exact clauses, section numbers, and definitions.
4. Note jurisdiction and effective dates when present.
Return structured findings with source references.`;

export const legalCriticPrompt = `You are the Legal Critic agent.
Review the Researcher's findings for:
- Missing jurisdiction or governing-law context
- Over-generalization of clauses
- Hallucinated section numbers or case names
- Gaps between the question and the cited material
Request additional searches or flag low-confidence claims.`;

export const legalSynthesizerPrompt = `You are the Legal Synthesizer agent.
Produce the final answer for the user:
- Lead with a direct answer or finding.
- Support every material claim with a citation.
- Structure long answers with clear headings.
- Include a short "Limitations / Caveats" section when appropriate.
- Render tables or callouts when comparing obligations or risk levels.
- Always remind: "This is not legal advice. Consult qualified counsel for decisions."`;

export const legalSampleDocuments = [
  {
    title: "Master Services Agreement — Acme Corp",
    content: `MASTER SERVICES AGREEMENT\n\nThis Master Services Agreement (\"Agreement\") is entered into as of January 15, 2025 (\"Effective Date\") by and between Acme Corporation (\"Customer\") and Sophar Labs, Inc. (\"Provider\").\n\n1. DEFINITIONS\n1.1 \"Confidential Information\" means all non-public information disclosed by one party to the other...\n1.2 \"Deliverables\" means the work product specified in each Statement of Work.\n\n2. SERVICES\nProvider shall perform the services described in each SOW in a professional and workmanlike manner.\n\n3. FEES AND PAYMENT\nCustomer shall pay fees as set forth in each SOW within thirty (30) days of invoice.\nLate payments accrue interest at 1.5% per month.\n\n4. CONFIDENTIALITY\nEach party agrees to protect the other's Confidential Information with reasonable care and not to disclose it to third parties without consent, except as required by law.\n\n5. DATA PROTECTION\nProvider shall process personal data only in accordance with applicable data protection laws and the Data Processing Addendum attached as Exhibit B.\n\n6. LIMITATION OF LIABILITY\nEXCEPT FOR BREACHES OF CONFIDENTIALITY OR DATA PROTECTION OBLIGATIONS, NEITHER PARTY'S AGGREGATE LIABILITY SHALL EXCEED THE FEES PAID IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.\nIN NO EVENT SHALL EITHER PARTY BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES.\n\n7. TERM AND TERMINATION\nThis Agreement continues until terminated. Either party may terminate for convenience on sixty (60) days' written notice, or for cause on thirty (30) days' notice if the breach remains uncured.\n\n8. GOVERNING LAW\nThis Agreement is governed by the laws of the State of Delaware, without regard to conflict of laws principles.\n\n9. DISPUTE RESOLUTION\nDisputes shall first be submitted to good-faith negotiation. If unresolved within thirty (30) days, either party may pursue binding arbitration in Wilmington, Delaware under AAA rules.\n`,
  },
  {
    title: "Data Processing Addendum — GDPR/CCPA",
    content: `DATA PROCESSING ADDENDUM\n\n1. Roles. Customer is the Controller (or Business under CCPA). Provider is the Processor (or Service Provider).\n\n2. Processing. Provider shall process Personal Data only on documented instructions from Customer and only for the purposes of providing the Services.\n\n3. Security. Provider implements appropriate technical and organizational measures including encryption in transit and at rest, access controls, and regular security assessments.\n\n4. Subprocessors. Provider may engage subprocessors listed in Exhibit C. Customer will be notified of changes and may object on reasonable grounds.\n\n5. Data Subject Rights. Provider shall assist Customer in responding to data subject requests within the timeframes required by applicable law.\n\n6. Breach Notification. Provider shall notify Customer without undue delay and in any event within 48 hours of becoming aware of a Personal Data Breach.\n\n7. International Transfers. Transfers outside the EEA/UK shall rely on Standard Contractual Clauses or other approved mechanisms.\n\n8. Return or Deletion. Upon termination, Provider shall delete or return Personal Data at Customer's election, unless retention is required by law.\n`,
  },
  {
    title: "Internal Compliance Policy — Information Security",
    content: `INFORMATION SECURITY POLICY\nVersion 3.2 — Effective March 1, 2025\n\n1. Purpose. This policy establishes requirements for protecting company and customer information assets.\n\n2. Scope. Applies to all employees, contractors, and systems.\n\n3. Access Control. Access is granted on least-privilege and need-to-know basis. Multi-factor authentication is required for all remote and privileged access.\n\n4. Data Classification. Data is classified as Public, Internal, Confidential, or Restricted. Handling requirements escalate with classification.\n\n5. Incident Response. Suspected security incidents must be reported to security@company.com within 1 hour. The incident response team will investigate and contain.\n\n6. Acceptable Use. Company systems may not be used for illegal activity, unauthorized cryptocurrency mining, or storage of personal non-work data beyond incidental use.\n\n7. Vendor Management. Third parties with access to Confidential or Restricted data must execute appropriate agreements and undergo security review.\n\n8. Training. All personnel complete security awareness training annually and upon hire.\n`,
  },
];

export const legalTools = ["knowledge_search", "web_search"] as const;

export const legalConfig = {
  id: "legal",
  name: "Legal & Compliance",
  systemPrompt: legalSystemPrompt,
  researcherPrompt: legalResearcherPrompt,
  criticPrompt: legalCriticPrompt,
  synthesizerPrompt: legalSynthesizerPrompt,
  sampleDocuments: legalSampleDocuments,
  defaultTools: legalTools,
};
