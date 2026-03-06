import { NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import { adClone, adWorkflow } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import type { CloneAdsResponse } from "@/lib/types/clone-ads";

/**
 * GET /api/clone-ads
 * Returns all active clone ads with workflow info (for template ads to clone on dashboard).
 */
export async function GET() {
  try {
    const rows = await db
      .select({
        id: adClone.id,
        workflowId: adClone.workflowId,
        storageUrl: adClone.storageUrl,
        archetypeCode: adWorkflow.archetypeCode,
        variantKey: adWorkflow.variantKey,
        format: adWorkflow.format,
      })
      .from(adClone)
      .innerJoin(adWorkflow, eq(adClone.workflowId, adWorkflow.id))
      .where(eq(adWorkflow.isActive, true))
      .orderBy(asc(adWorkflow.archetypeCode), asc(adWorkflow.variantKey));

    const response: CloneAdsResponse = {
      clones: rows.map((r) => ({
        id: r.id,
        workflowId: r.workflowId,
        storageUrl: r.storageUrl ?? null,
        archetypeCode: r.archetypeCode,
        variantKey: r.variantKey,
        format: r.format ?? null,
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching clone ads:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
