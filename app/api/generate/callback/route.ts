import { NextResponse } from "next/server";
import { updateGenerationJobStatus, getGenerationJobById } from "@/lib/db/queries/generation";
import { getAdImagesByJobId, getWorkflowsAndArchetypesByWorkflowIds, markAdImagesAsDeleted } from "@/lib/db/queries/ads";
import { getUserWithTokenBalance } from "@/lib/db/queries/tokens";
import { resolveCallback } from "@/lib/api/callback-waiter";
import { findOrCreateJobForMigration, migrateFailedJobAds, cleanupFailedJob } from "@/lib/db/queries/quick-ads";

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
          // Handle cases like: {"error_message": 'No property named "data" exists!'}
          let fixedResult = result.trim();
          
          // First, handle single quotes around keys if present
          fixedResult = fixedResult.replace(/'([^']+)':/g, '"$1":');
          
          // For values with single quotes, manually parse to handle nested quotes
          // Find all : '...' patterns and replace them with : "..."
          // We need to find the closing single quote that's followed by } or ,
          const colonMatches: Array<{ index: number; valueStart: number; valueEnd: number }> = [];
          let searchIndex = 0;
          
          while (searchIndex < fixedResult.length) {
            const colonIndex = fixedResult.indexOf(':', searchIndex);
            if (colonIndex === -1) break;
            
            const afterColon = fixedResult.substring(colonIndex + 1).trim();
            if (afterColon[0] === "'") {
              const valueStart = colonIndex + 1 + afterColon.indexOf("'") + 1;
              let valueEnd = valueStart;
              let foundClosing = false;
              
              // Find the closing single quote that's followed by } or , or end of string
              for (let i = valueStart; i < fixedResult.length; i++) {
                const char = fixedResult[i];
                const nextChar = fixedResult[i + 1];
                if (char === "'" && (nextChar === '}' || nextChar === ',' || nextChar === undefined || nextChar === '\n' || nextChar === ' ')) {
                  valueEnd = i;
                  foundClosing = true;
                  break;
                }
              }
              
              if (foundClosing) {
                colonMatches.push({ index: colonIndex, valueStart, valueEnd });
                searchIndex = valueEnd + 1;
              } else {
                searchIndex = colonIndex + 1;
              }
            } else {
              searchIndex = colonIndex + 1;
            }
          }
          
          // Replace from end to start to preserve indices
          for (let i = colonMatches.length - 1; i >= 0; i--) {
            const match = colonMatches[i];
            const value = fixedResult.substring(match.valueStart, match.valueEnd);
            const escapedValue = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
            fixedResult = fixedResult.substring(0, match.valueStart - 1) + `"${escapedValue}"` + fixedResult.substring(match.valueEnd + 1);
          }
          
          result = JSON.parse(fixedResult);
          console.log('[CALLBACK] Successfully parsed after fixing quotes:', result);
        } catch (e2) {
          console.warn('[CALLBACK] Failed to parse even after fixing quotes:', e2);
          // If parsing still fails, try to extract error message manually with better regex
          // Handle both single and double quotes, and allow quotes inside the message
          let errorMessage = null;
          
          // Try to find error_message with single quotes that may contain double quotes
          // Pattern: error_message: '...' where ... can contain any characters except unescaped single quotes
          // We need to find the closing single quote that's followed by } or ,
          const singleQuotePattern = /error_message\s*[:=]\s*'([^']*(?:'[^,}]*)*)'/i;
          const singleQuoteMatch = result.match(singleQuotePattern);
          if (singleQuoteMatch && singleQuoteMatch[1]) {
            errorMessage = singleQuoteMatch[1];
          } else {
            // Try pattern with double quotes: error_message: "..."
            const doubleQuotePattern = /error_message\s*[:=]\s*"([^"]*(?:"[^,}]*)*)"/i;
            const doubleQuoteMatch = result.match(doubleQuotePattern);
            if (doubleQuoteMatch && doubleQuoteMatch[1]) {
              errorMessage = doubleQuoteMatch[1];
            } else {
              // Manual parsing: find error_message, then find the value between quotes
              const errorMsgIndex = result.toLowerCase().indexOf('error_message');
              if (errorMsgIndex !== -1) {
                // Find the colon after error_message
                const colonIndex = result.indexOf(':', errorMsgIndex);
                if (colonIndex !== -1) {
                  // Find the opening quote (single or double)
                  const afterColon = result.substring(colonIndex + 1).trim();
                  const quoteChar = afterColon[0];
                  if (quoteChar === "'" || quoteChar === '"') {
                    // Find the closing quote before the next } or ,
                    const valueStart = colonIndex + 1 + afterColon.indexOf(quoteChar) + 1;
                    let valueEnd = valueStart;
                    let foundClosingQuote = false;
                    
                    // Look for the closing quote that's followed by } or ,
                    for (let i = valueStart; i < result.length; i++) {
                      if (result[i] === quoteChar && (result[i + 1] === '}' || result[i + 1] === ',' || result[i + 1] === '\n' || result[i + 1] === undefined)) {
                        valueEnd = i;
                        foundClosingQuote = true;
                        break;
                      }
                    }
                    
                    if (foundClosingQuote) {
                      errorMessage = result.substring(valueStart, valueEnd);
                    }
                  }
                }
              }
            }
          }
          
          if (errorMessage) {
            result = { error_message: errorMessage };
            console.log('[CALLBACK] Extracted error message manually:', result);
          } else {
            // Keep result as string if all parsing attempts fail
            console.warn('[CALLBACK] Keeping result as string:', result);
            // Still try to create a result object with the raw string
            result = { error_message: result };
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
    let validImages = adImages.filter(
      (img) => !img.isDeleted && !img.errorFlag && img.publicUrl
    );

    // If 0 valid images set job status to FAILED
    if (validImages.length === 0) {
      jobStatus = 'FAILED';
      await updateGenerationJobStatus(job_id, 'FAILED', undefined, 'No valid images found');
      console.error('[CALLBACK] No valid images found for job:', job_id);
    }

    console.log('[CALLBACK] Found', validImages.length, 'valid images');

    // FREE plan: mark all newly generated images as deleted (soft delete for content library)
    const userWithTokens = await getUserWithTokenBalance(job.userId);
    const planCode = userWithTokens?.tokenAccount?.planCode ?? '';
    if (planCode === 'FREE' && validImages.length > 0) {
      await markAdImagesAsDeleted(validImages.map((img) => img.id));
      console.log('[CALLBACK] Marked', validImages.length, 'images as deleted (FREE plan)');
    }

    // If this is a failed quick ads job with some ads, migrate them
    // Only migrate from FAILED or CANCELED jobs, never from SUCCEEDED jobs
    if (
      (jobStatus === 'FAILED' || jobStatus === 'CANCELED') && 
      job.autoGenerated && 
      validImages.length > 0 &&
      job.status !== 'SUCCEEDED' // Double-check: don't migrate from SUCCEEDED jobs
    ) {
      console.log('[CALLBACK] Attempting to migrate ads from failed quick ads job:', job_id, 'status:', jobStatus);
      try {
        // Find or create a job to migrate ads to
        const targetJob = await findOrCreateJobForMigration(job.userId, job.brandId);
        console.log('[CALLBACK] Target job for migration:', targetJob.id);

        // Migrate ads (pairs only, remove orphaned)
        const migrationResult = await migrateFailedJobAds(job_id, targetJob.id);
        console.log('[CALLBACK] Migration result:', migrationResult);

        // Clean up the failed job
        await cleanupFailedJob(job_id);
        console.log('[CALLBACK] Cleaned up failed job:', job_id);

        // Update validImages to reflect migrated ads (for callback response)
        // The migrated ads are now in the target job, so we don't include them in the failed job response
        validImages = [];
      } catch (migrationError) {
        console.error('[CALLBACK] Error migrating failed job ads:', migrationError);
        // Continue with normal error handling even if migration fails
      }
    }

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
    
    // Extract error_message and error_code from result
    let errorMessage: string | undefined = undefined;
    let errorCode: string | undefined = undefined;
    
    if (typeof result === 'object' && result !== null) {
      // Ensure error_message is a string, not an object or other type
      if (typeof result.error_message === 'string') {
        errorMessage = result.error_message;
      } else if (result.error_message !== undefined && result.error_message !== null) {
        errorMessage = String(result.error_message);
      }
      errorCode = result.error_code;
    } else if (typeof result === 'string') {
      // If result is still a string, use it as error_message
      errorMessage = result;
    }
    
    console.log('[CALLBACK] Error details - message:', errorMessage, 'code:', errorCode);
    console.log('[CALLBACK] Result type:', typeof result, 'result:', result);
    
    await resolveCallback(job_id, {
      status: jobStatus,
      images,
      error_message: errorMessage,
      error_code: errorCode,
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

