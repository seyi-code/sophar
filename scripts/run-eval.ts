/**
 * CLI entry for golden-set evaluation.
 *
 * Usage:
 *   ORGANIZATION_ID=... npx tsx scripts/run-eval.ts
 */

import { runGoldenSet } from "../lib/eval/harness";

async function main() {
  const organizationId = process.env.ORGANIZATION_ID;
  if (!organizationId) {
    console.error("Set ORGANIZATION_ID to a seeded organization UUID");
    process.exit(1);
  }

  console.log("Running golden-set evaluation…");
  const { scores, average } = await runGoldenSet(organizationId);

  for (const s of scores) {
    console.log("\n---", s.id);
    console.log("Q:", s.question);
    console.log(
      `Scores  F=${s.faithfulness.toFixed(2)}  C=${s.completeness.toFixed(2)}  Cit=${s.citationScore.toFixed(2)}  Overall=${s.overall.toFixed(2)}`
    );
    if (s.details.length) console.log("Details:", s.details.join("; "));
  }

  console.log("\n==============================");
  console.log(`Average overall score: ${average.toFixed(3)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
