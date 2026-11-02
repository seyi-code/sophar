import { goldenSet, type GoldenCase } from "./golden-set";

export interface EvalScore {
  caseId: string;
  question: string;
  faithfulness: number;
  completeness: number;
  citationQuality: number;
  overall: number;
  notes: string[];
}

export interface EvalReport {
  vertical: string;
  totalCases: number;
  averageOverall: number;
  scores: EvalScore[];
  timestamp: string;
}

/**
 * Simple keyword / phrase overlap scoring for faithfulness & completeness.
 * In production this would call an LLM-as-judge; here we keep it deterministic
 * and dependency-free so the harness can run in CI without API keys.
 */
function scoreText(answer: string, expected: string[]): { faithfulness: number; completeness: number } {
  const lower = answer.toLowerCase();
  let hits = 0;
  for (const phrase of expected) {
    if (lower.includes(phrase.toLowerCase())) hits += 1;
  }
  const completeness = expected.length === 0 ? 1 : hits / expected.length;
  // Faithfulness: penalize if answer is extremely short relative to expected coverage
  const faithfulness = answer.trim().length < 40 ? Math.min(completeness, 0.4) : Math.min(1, completeness + 0.15);
  return { faithfulness: Number(faithfulness.toFixed(3)), completeness: Number(completeness.toFixed(3)) };
}

function scoreCitations(answer: string, requiredSources: string[]): number {
  if (!requiredSources.length) return 1;
  const lower = answer.toLowerCase();
  let found = 0;
  for (const src of requiredSources) {
    if (lower.includes(src.toLowerCase())) found += 1;
  }
  return Number((found / requiredSources.length).toFixed(3));
}

export async function runGoldenSet(
  vertical: "enterprise" | "legal",
  generateAnswer: (question: string, vertical: string) => Promise<string>
): Promise<EvalReport> {
  const cases: GoldenCase[] = goldenSet.filter((c) => c.vertical === vertical);
  const scores: EvalScore[] = [];

  for (const c of cases) {
    const answer = await generateAnswer(c.question, vertical);
    const { faithfulness, completeness } = scoreText(answer, c.mustContain);
    const citationQuality = scoreCitations(answer, c.mustCite ?? []);
    const overall = Number(
      (0.4 * faithfulness + 0.4 * completeness + 0.2 * citationQuality).toFixed(3)
    );
    const notes: string[] = [];
    if (faithfulness < 0.6) notes.push("Low faithfulness");
    if (completeness < 0.6) notes.push("Incomplete coverage of expected points");
    if (citationQuality < 0.5) notes.push("Missing expected citations");

    scores.push({
      caseId: c.id,
      question: c.question,
      faithfulness,
      completeness,
      citationQuality,
      overall,
      notes,
    });
  }

  const averageOverall =
    scores.length === 0
      ? 0
      : Number((scores.reduce((s, x) => s + x.overall, 0) / scores.length).toFixed(3));

  return {
    vertical,
    totalCases: scores.length,
    averageOverall,
    scores,
    timestamp: new Date().toISOString(),
  };
}

export async function runAllVerticals(
  generateAnswer: (question: string, vertical: string) => Promise<string>
): Promise<EvalReport[]> {
  return Promise.all([
    runGoldenSet("enterprise", generateAnswer),
    runGoldenSet("legal", generateAnswer),
  ]);
}
