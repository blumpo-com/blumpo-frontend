// This endpoint is used to get the images for a given job_id
import { NextResponse } from "next/server";
import { getAdImagesByJobId, getWorkflowsAndArchetypesByWorkflowIds } from "@/lib/db/queries/ads";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get('jobId');

  if (!jobId) {
    return NextResponse.json({ error: 'jobId required' }, { status: 400 });
  }

  const images = await getAdImagesByJobId(jobId);
  const validImages = images.filter(
    (img) => !img.errorFlag && img.publicUrl
  );

  // Get archetypes for each image from workflow_id
  const workflowIds = validImages
  .map((img) => img.workflowId)
  .filter((id): id is string => Boolean(id));

const workflowsWithArchetypes =
  workflowIds.length > 0
    ? await getWorkflowsAndArchetypesByWorkflowIds(workflowIds)
    : [];

const imagesWithArchetypes = validImages.map((img) => {
  const workflowMatch = img.workflowId
    ? workflowsWithArchetypes.find((w) => w.ad_workflow.id === img.workflowId)
    : null;
  const archetype = workflowMatch?.ad_archetype || null;

  return {
    id: img.id,
    title: img.title,
    publicUrl: img.publicUrl,
    width: img.width,
    height: img.height,
    format: img.format,
    workflowId: img.workflowId,
    createdAt: img.createdAt,
    archetype: archetype
      ? {
          code: archetype.code,
          displayName: archetype.displayName,
          description: archetype.description,
        }
      : null,
  };
});

  return NextResponse.json(imagesWithArchetypes);
}