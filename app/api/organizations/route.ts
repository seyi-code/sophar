import { NextRequest } from "next/server";
import { auth } from "@/lib/auth/better-auth";
import { db } from "@/lib/db";
import { organizations, members, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateId } from "@/lib/utils/id";

export const runtime = "nodejs";

/**
 * POST /api/organizations
 * Create a real organization + membership for the current user.
 * Body: { name: string, vertical?: string, slug?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    let userId = session?.user?.id;

    // Demo fallback: ensure a user row exists so onboarding works without full auth yet
    if (!userId) {
      userId = "demo-user";
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      if (existing.length === 0) {
        await db.insert(users).values({
          id: userId,
          name: "Demo User",
          email: "demo@sophar.local",
          emailVerified: true,
        });
      }
    }

    const body = await req.json();
    const name = String(body.name || "").trim();
    if (!name) {
      return Response.json({ error: "name is required" }, { status: 400 });
    }

    const vertical = String(body.vertical || "enterprise");
    const baseSlug =
      String(body.slug || name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 48) || "workspace";
    const slug = `${baseSlug}-${generateId(6)}`;

    const [org] = await db
      .insert(organizations)
      .values({
        name,
        slug,
        vertical,
      })
      .returning();

    await db.insert(members).values({
      organizationId: org.id,
      userId,
      role: "owner",
    });

    return Response.json({ organization: org });
  } catch (err) {
    console.error("[organizations POST]", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to create organization" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/organizations
 * List organizations the current user belongs to.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    const userId = session?.user?.id || "demo-user";

    const rows = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
        vertical: organizations.vertical,
        role: members.role,
        createdAt: organizations.createdAt,
      })
      .from(members)
      .innerJoin(organizations, eq(members.organizationId, organizations.id))
      .where(eq(members.userId, userId));

    return Response.json({ organizations: rows });
  } catch (err) {
    console.error("[organizations GET]", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to list organizations" },
      { status: 500 }
    );
  }
}
