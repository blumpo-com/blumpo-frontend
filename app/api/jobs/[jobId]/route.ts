import { NextResponse } from "next/server";
import { getUser } from "@/lib/db/queries";
import { getGenerationJobById } from "@/lib/db/queries/generation";
import { getAdImagesByJobId } from "@/lib/db/queries/ads";

export async function GET(
  req: Request,
  { params }: { params: { jobId: string } }
) {
  try {
    // Check if user is authenticated
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = params;

    if (!jobId) {
      return NextResponse.json({ error: "Missing job_id" }, { status: 400 });
    }

    // Get job details
    const job = await getGenerationJobById(jobId);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Verify job belongs to user
    if (job.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get ad images for this job (only non-deleted, non-error images)
    const adImages = await getAdImagesByJobId(jobId);
    
    // Filter out deleted images and error images
    const validImages = adImages.filter(
      (img) => !img.isDeleted && !img.errorFlag && img.publicUrl
    );

    return NextResponse.json({
      job: {
        id: job.id,
        status: job.status,
        errorCode: job.errorCode,
        errorMessage: job.errorMessage,
        createdAt: job.createdAt,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
      },
      images: validImages.map((img) => ({
        id: img.id,
        title: img.title,
        publicUrl: img.publicUrl,
        width: img.width,
        height: img.height,
        format: img.format,
        archetypes: img.archetypes,
        createdAt: img.createdAt,
      })),
    });
  } catch (e) {
    console.error('Error fetching job:', e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

