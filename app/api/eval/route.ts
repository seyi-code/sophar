import { NextRequest } from "next/server";
import { runGoldenSet } from "@/lib/eval/harness";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * POST /api/eval
 * Body: { organizationId: string }
 *
 * Runs the enterprise golden-set evaluation against the given org workspace.
 * Requires the org to be seeded with sample (or real) knowledge docs.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { organizationId } = body as { organizationId?: string };

    if (!organizationId) {
      return Response.json(
        { error: "organizationId required" },
        { status: 400 }
      );
    }

    const result = await runGoldenSet(organizationId);
    return Response.json(result);
  } catch (err) {
    console.error("[eval]", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Eval failed" },
      { status: 500 }
    );
  }
}
