/**
 * Seed an organization with Legal vertical sample documents.
 *
 * Usage:
 *   DATABASE_URL=... npx tsx scripts/seed-legal.ts
 */

import { db } from "../lib/db";
import { organizations, users, members } from "../lib/db/schema";
import { eq } from "drizzle-orm";
import { ingestDocument } from "../lib/knowledge/store";
import { LEGAL_SAMPLE_DOCS } from "../lib/verticals/legal";

async function main() {
  const slug = "demo-legal";

  let [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, slug))
    .limit(1);

  if (!org) {
    [org] = await db
      .insert(organizations)
      .values({
        name: "Demo Legal",
        slug,
        vertical: "legal",
      })
      .returning();
    console.log("Created organization:", org.id, org.slug);
  } else {
    console.log("Using existing organization:", org.id, org.slug);
  }

  const demoUserId = "demo-user";
  const existingUsers = await db
    .select()
    .from(users)
    .where(eq(users.id, demoUserId))
    .limit(1);

  if (existingUsers.length === 0) {
    await db.insert(users).values({
      id: demoUserId,
      name: "Demo User",
      email: "demo@sophar.local",
      emailVerified: true,
    });
  }

  const existingMembers = await db
    .select()
    .from(members)
    .where(eq(members.organizationId, org.id))
    .limit(1);

  if (existingMembers.length === 0) {
    await db.insert(members).values({
      organizationId: org.id,
      userId: demoUserId,
      role: "owner",
    });
  }

  for (const doc of LEGAL_SAMPLE_DOCS) {
    console.log(`Ingesting: ${doc.title}`);
    await ingestDocument({
      organizationId: org.id,
      title: doc.title,
      content: doc.content,
      source: doc.source,
      mimeType: "text/markdown",
    });
  }

  console.log("\nDone. Legal organization ID:", org.id);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
