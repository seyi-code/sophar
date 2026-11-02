import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { ENTERPRISE_GOLDEN_SET, type GoldenCase } from "./golden-set";
import { runOrchestrator } from "@/lib/agents/orchestrator";

export type CaseScore = {
  id: string;
  question: string;
  answer: string;
  faithfulness: number;
  completeness: number;
  citationScore: number;
  overall: number;
  details: string[];
};

function getModel() {
  if (process.env.ANTHROPIC_API_KEY) {
    return anthropic(process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514");
  }
  return openai(process.env.OPENAI_MODEL || "gpt-4o");
}

export async function evaluateCase(
  testCase: GoldenCase,
  organizationId: string,
  userId = "eval-user"
): Promise<CaseScore> {
  let answer = "";
  const citations: string[] = [];

  for await (const event of runOrchestrator({
    messages: [{ role: "user", content: testCase.question }],
    organizationId,
    userId,
    vertical: "enterprise",
  })) {
    if (event.type === "token") answer += event.text;
    if (event.type === "citations") {
      for (const c of event.citations) {
        citations.push(`${c.title} ${c.snippet}`);
      }
    }
    if (event.type === "done") answer = event.fullText;
  }

  const details: string[] = [];
  let faithfulness = 1;
  let completeness = 1;
  let citationScore = 1;

  if (testCase.mustContain?.length) {
    const missing = testCase.mustContain.filter(
      (s) => !answer.toLowerCase().includes(s.toLowerCase())
    );
    if (missing.length) {
      completeness = Math.max(0, 1 - missing.length / testCase.mustContain.length);
      details.push(`Missing expected terms: ${missing.join(", ")}`);
    }
  }

  if (testCase.mustNotContain?.length) {
    const bad = testCase.mustNotContain.filter((s) =>
      answer.toLowerCase().includes(s.toLowerCase())
    );
    if (bad.length) {
      faithfulness = Math.max(0, 1 - bad.length / testCase.mustNotContain.length);
      details.push(`Hallucination traps hit: ${bad.join(", ")}`);
    }
  }

  if (testCase.expectedCitationTopics?.length) {
    const blob = citations.join(" ").toLowerCase();
    const hit = testCase.expectedCitationTopics.filter((t) =>
      blob.includes(t.toLowerCase())
    );
    citationScore =
      testCase.expectedCitationTopics.length === 0
        ? 1
        : hit.length / testCase.expectedCitationTopics.length;
    if (citationScore < 1) {
      details.push(
        `Citation topics missing: ${testCase.expectedCitationTopics
          .filter((t) => !blob.includes(t.toLowerCase()))
          .join(", ")}`
      );
    }
  }

  if (process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY) {
    try {
      const judge = await generateText({
        model: getModel(),
        prompt: `Score faithfulness 0-1. Does the answer invent facts not supported by typical enterprise policy docs for this question?
Question: ${testCase.question}
Answer: ${answer.slice(0, 2000)}

Reply with JSON only: {"faithfulness": 0.0, "reason": "..."}`,
      });
      const match = judge.text.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]) as {
          faithfulness?: number;
          reason?: string;
        };
        if (typeof parsed.faithfulness === "number") {
          faithfulness = Math.min(faithfulness, parsed.faithfulness);
          if (parsed.reason) details.push(`Judge: ${parsed.reason}`);
        }
      }
    } catch {
      /* keep rule-based score */
    }
  }

  const overall = (faithfulness + completeness + citationScore) / 3;

  return {
    id: testCase.id,
    question: testCase.question,
    answer: answer.slice(0, 1500),
    faithfulness,
    completeness,
    citationScore,
    overall,
    details,
  };
}

export async function runGoldenSet(
  organizationId: string,
  cases = ENTERPRISE_GOLDEN_SET
): Promise<{ scores: CaseScore[]; average: number }> {
  const scores: CaseScore[] = [];
  for (const c of cases) {
    const score = await evaluateCase(c, organizationId);
    scores.push(score);
  }
  const average =
    scores.reduce((s, x) => s + x.overall, 0) / (scores.length || 1);
  return { scores, average };
}
