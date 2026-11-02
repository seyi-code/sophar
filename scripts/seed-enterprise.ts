/**
 * Seed the first organization with Enterprise vertical sample documents.
 *
 * Usage:
 *   DATABASE_URL=... npx tsx scripts/seed-enterprise.ts
 *
 * Creates org "demo-enterprise" if needed and ingests ENTERPRISE_SAMPLE_DOCS.
 */

import { db } from "../lib/db";
import { organizations, users, members } from "../lib/db/schema";
import { eq } from "drizzle-orm";
import { ingestDocument } from "../lib/knowledge/store";
import { ENTERPRISE_SAMPLE_DOCS } from "../lib/verticals/enterprise";
import { generateId } from "../lib/utils/id";

async function main() {
  const slug = "demo-enterprise";

  let [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, slug))
    .limit(1);

  if (!org) {
    [org] = await db
      .insert(organizations)
      .values({
        name: "Demo Enterprise",
        slug,
        vertical: "enterprise",
      })
      .returning();
    console.log("Created organization:", org.id, org.slug);
  } else {
    console.log("Using existing organization:", org.id, org.slug);
  }

  // Ensure a demo user exists and is a member
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
    console.log("Created demo user");
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
    console.log("Added demo user as owner");
  }

  for (const doc of ENTERPRISE_SAMPLE_DOCS) {
    console.log(`Ingesting: ${doc.title}`);
    await ingestDocument({
      organizationId: org.id,
      title: doc.title,
      content: doc.content,
      source: doc.source,
      mimeType: "text/markdown",
    });
  }

  console.log("\nDone. Organization ID:", org.id);
  console.log("Use this organizationId in the UI / API for enterprise demo.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
