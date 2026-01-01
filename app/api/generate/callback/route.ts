import { NextResponse } from "next/server";
import { updateGenerationJobStatus } from "@/lib/db/queries/generation";
import { getAdImagesByJobId, getWorkflowsAndArchetypesByWorkflowIds } from "@/lib/db/queries/ads";
import { getGenerationJobById } from "@/lib/db/queries/generation";
import { resolveCallback } from "@/lib/api/callback-waiter";

// Callback endpoint - receives POST from n8n
export async function POST(req: Request) {
  const callbackStartTime = Date.now();
  console.log('[CALLBACK] Received callback at', new Date().toISOString());

  try {
    const body = await req.json();
    let { job_id, status, result } = body;

    console.log('[CALLBACK] Callback data:', { job_id, status, result, resultType: typeof result });

    if (!job_id) {
      console.error('[CALLBACK] Missing job_id');
      return NextResponse.json({ error: "Missing job_id" }, { status: 400 });
    }

    // Parse result if it's a JSON string
    if (typeof result === 'string') {
      try {
        // Try to parse as-is first
        result = JSON.parse(result);
        console.log('[CALLBACK] Parsed result string:', result);
      } catch (e) {
        console.warn('[CALLBACK] Failed to parse result string, attempting to fix quotes:', e);
        try {
          // Try to fix common JSON issues: replace single quotes with double quotes
          // But be careful not to replace quotes inside already-quoted strings
          // This is a simple fix for cases like: {"error_message": 'text'} -> {"error_message": "text"}
          let fixedResult = result.trim();
          
          // Replace single quotes around string values (but not around keys which should already be double-quoted)
          // Pattern: match : '...' and replace with : "..."
          fixedResult = fixedResult.replace(/:\s*'([^']*)'/g, ': "$1"');
          
          // Also handle single quotes around keys if present
          fixedResult = fixedResult.replace(/'([^']+)':/g, '"$1":');
          
          result = JSON.parse(fixedResult);
          console.log('[CALLBACK] Successfully parsed after fixing quotes:', result);
        } catch (e2) {
          console.warn('[CALLBACK] Failed to parse even after fixing quotes:', e2);
          // If parsing still fails, try to extract error message manually
          const errorMatch = result.match(/error_message['":\s]*[:=]\s*['"]([^'"]+)['"]/i);
          if (errorMatch) {
            result = { error_message: errorMatch[1] };
            console.log('[CALLBACK] Extracted error message manually:', result);
          } else {
            // Keep result as string if all parsing attempts fail
            console.warn('[CALLBACK] Keeping result as string:', result);
          }
        }
      }
    }

    // Get the job to verify it exists
    const job = await getGenerationJobById(job_id);
    if (!job) {
      console.error('[CALLBACK] Job not found:', job_id);
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Map n8n status to our job status
    // n8n sends: { status: "done" or "completed", result: { source: "n8n", ok: true } } or result as JSON string
    let jobStatus: 'SUCCEEDED' | 'FAILED' | 'CANCELED' = 'SUCCEEDED';
    
    // Check if result is an object with ok property
    const resultOk = typeof result === 'object' && result !== null ? result.ok : undefined;
    
    if ((status === 'completed' || status === 'done') && resultOk === true) {
      jobStatus = 'SUCCEEDED';
    } else if (status === 'failed' || resultOk === false) {
      jobStatus = 'FAILED';
    } else if (status === 'canceled') {
      jobStatus = 'CANCELED';
    } else if (status === 'completed' || status === 'done') {
      // If status is completed/done but no explicit ok flag, default to SUCCEEDED
      jobStatus = 'SUCCEEDED';
    } else {
      // Unknown status, default to FAILED
      jobStatus = 'FAILED';
    }
    
    console.log('[CALLBACK] Mapped status:', status, 'resultOk:', resultOk, '→ jobStatus:', jobStatus);

    // Update job status in database
    await updateGenerationJobStatus(
      job_id,
      jobStatus,
      result?.error_code || undefined,
      result?.error_message || undefined
    );

    console.log('[CALLBACK] Updated job status to:', jobStatus);

    // Get ad images for this job
    const adImages = await getAdImagesByJobId(job_id);
    const validImages = adImages.filter(
      (img) => !img.isDeleted && !img.errorFlag && img.publicUrl
    );

    console.log('[CALLBACK] Found', validImages.length, 'valid images');

    // Get archetypes for each image from workflow_id
    const workflowIds = validImages
      .map((img) => img.workflowId)
      .filter((id): id is string => Boolean(id));
    
    const workflowsWithArchetypes =
      workflowIds.length > 0
        ? await getWorkflowsAndArchetypesByWorkflowIds(workflowIds)
        : [];

    const images = validImages.map((img) => {
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

    // Resolve the pending promise (if exists)
    console.log('[CALLBACK] Resolving pending promise for job:', job_id);
    await resolveCallback(job_id, {
      status: jobStatus,
      images,
    });

    const callbackDuration = Date.now() - callbackStartTime;
    console.log('[CALLBACK] Callback processed in', callbackDuration, 'ms');

    // Return success response to n8n
    return NextResponse.json({
      success: true,
      job_id,
      status: jobStatus,
      images_count: images.length,
    });
  } catch (e) {
    const errorDuration = Date.now() - callbackStartTime;
    console.error('[CALLBACK] Error processing callback after', errorDuration, 'ms:', e);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: e instanceof Error ? e.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

