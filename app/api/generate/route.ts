import { NextResponse } from "next/server";
import { getUser, hasEnoughTokens, createGenerationJob, updateGenerationJobStatus, refundTokens, getBrandsByUserId, getExistingGenerationJobByWebsiteUrl } from "@/lib/db/queries";
import { getAdImagesByJobId, getWorkflowsAndArchetypesByWorkflowIds } from "@/lib/db/queries/ads";
import { normalizeWebsiteUrl } from "@/lib/utils";
import { randomUUID } from "crypto";
import { waitForCallback, waitForExistingCallback } from "@/lib/api/callback-waiter";

const TOKENS_COST_PER_GENERATION = 50;
const MAX_WAIT_TIME = 7 * 60 * 1000; // 7 minutes in milliseconds
const WEBHOOK_TIMEOUT = 30000; // 30 seconds - just to confirm webhook received the request

export async function POST(req: Request) {
  if (process.env.NEXT_PUBLIC_IS_TEST_MODE === "true") {
    console.log("[GENERATE] Skipping generation (test mode)");
    return NextResponse.json(
      { error: "Generation disabled in test mode", error_code: "TEST_MODE" },
      { status: 503 }
    );
  }

  const requestStartTime = Date.now();
  console.log('[GENERATE] Request started at', new Date().toISOString());

  const webhookUrl = process.env.N8N_WEBHOOK_URL + 'main-free-workflow';
  const webhookKey = process.env.N8N_WEBHOOK_KEY;

  if (!webhookUrl) {
    console.error('[GENERATE] Webhook URL not configured');
    return NextResponse.json({ error: "Webhook URL not configured" }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { url } = body;
    console.log('[GENERATE] Received request:', { url });

    // Check if user is authenticated
    const user = await getUser();
    if (!user) {
      console.log('[GENERATE] User not authenticated');
      return NextResponse.json({
        error: "Unauthorized",
        error_code: "AUTH_REQUIRED",
        website_url: url // Include website URL for redirect after login
      }, { status: 401 });
    }
    console.log('[GENERATE] User authenticated:', user.id);

    // Validate input: url is required
    if (!url) {
      console.error('[GENERATE] Missing url');
      return NextResponse.json({ error: "Missing url" }, { status: 400 });
    }

    // Check if user has enough tokens before proceeding
    const hasTokens = await hasEnoughTokens(user.id, TOKENS_COST_PER_GENERATION);
    if (!hasTokens) {
      console.log('[GENERATE] Insufficient tokens for user:', user.id);
      return NextResponse.json({
        error: "Insufficient tokens",
        error_code: "INSUFFICIENT_TOKENS",
        tokens_required: TOKENS_COST_PER_GENERATION
      }, { status: 402 }); // Payment Required
    }
    console.log('[GENERATE] User has sufficient tokens');

    // Check for existing job with same website URL (any status)
    const existingJob = await getExistingGenerationJobByWebsiteUrl(
      user.id,
      url,
      normalizeWebsiteUrl
    );
    if (existingJob) {
      console.log('[GENERATE] Existing job found:', existingJob.id, 'status:', existingJob.status);

      if (existingJob.status === 'SUCCEEDED') {
        const adImages = await getAdImagesByJobId(existingJob.id);
        const validImages = adImages.filter(
          (img) => !img.isDeleted && !img.errorFlag && img.publicUrl
        );
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
              ? { code: archetype.code, displayName: archetype.displayName, description: archetype.description }
              : null,
          };
        });
        return NextResponse.json({
          job_id: existingJob.id,
          status: 'SUCCEEDED',
          images,
          tokens_used: TOKENS_COST_PER_GENERATION,
        });
      }

      if (existingJob.status === 'FAILED' || existingJob.status === 'CANCELED') {
        return NextResponse.json({
          job_id: existingJob.id,
          status: existingJob.status,
          images: [],
          error_message: existingJob.errorMessage || `Generation ${existingJob.status.toLowerCase()}`,
          error_code: existingJob.errorCode || null,
        }, { status: existingJob.status === 'FAILED' ? 500 : 200 });
      }

      // QUEUED or RUNNING - wait for existing callback (uses same Redis key as original job)
      console.log('[GENERATE] Existing job in progress, waiting for existing callback...');
      try {
        const callbackResult = await waitForExistingCallback(existingJob.id, MAX_WAIT_TIME);
        
        // If no Redis entry exists, the job might have been started but callback not set up yet
        // In this case, return early with current status
        if (!callbackResult) {
          console.log('[GENERATE] No existing Redis callback found for job:', existingJob.id);
          return NextResponse.json({
            job_id: existingJob.id,
            status: existingJob.status,
            message: 'Generation in progress - no callback available yet',
          });
        }
        
        if (callbackResult.status === 'SUCCEEDED') {
          return NextResponse.json({
            job_id: existingJob.id,
            status: 'SUCCEEDED',
            images: callbackResult.images,
            tokens_used: TOKENS_COST_PER_GENERATION,
          });
        }
        else{
           // Refund tokens for failed/canceled jobs
           try {
            await refundTokens(user.id, TOKENS_COST_PER_GENERATION, existingJob.id);
            console.log('[GENERATE] Tokens refunded for', callbackResult.status, 'job:', existingJob.id);
          } catch (refundError) {
            console.error('[GENERATE] Error refunding tokens:', refundError);
            // Continue even if refund fails - we still want to return the error to the user
          }
          return NextResponse.json({
            job_id: existingJob.id,
            status: callbackResult.status,
            images: callbackResult.images, // May be empty
            error_message: callbackResult.error_message,
            error_code: callbackResult.error_code,
            tokens_refunded: TOKENS_COST_PER_GENERATION
          }, { status: callbackResult.status === 'FAILED' ? 500 : 200 });
        }
      } catch (callbackError) {
        console.error('[GENERATE] Callback wait error for existing job:', callbackError);
        return NextResponse.json({
          error: "Generation timeout",
          job_id: existingJob.id,
          status: 'FAILED',
          error_code: 'TIMEOUT',
        }, { status: 504 });
      }
    }

    // Generate a unique job ID for this generation
    const jobId = randomUUID();
    console.log('[GENERATE] Created job ID:', jobId);

    // Try to find existing brand by website URL (optional - brandId can be null)
    const normalizedUrl = normalizeWebsiteUrl(url);
    const userBrands = await getBrandsByUserId(user.id);
    const existingBrand = userBrands.find(
      (b) => normalizeWebsiteUrl(b.websiteUrl) === normalizedUrl
    ) ?? null;
    console.log('[GENERATE] Existing brand found:', existingBrand?.id || 'none');

    let job;
    try {
      console.log('[GENERATE] Creating generation job...');
      // Create generation job (this reserves tokens atomically)
      job = await createGenerationJob(user.id, {
        id: jobId,
        prompt: undefined, // Will be generated by n8n
        params: { website_url: normalizedUrl },
        tokensCost: TOKENS_COST_PER_GENERATION,
        brandId: existingBrand?.id,
        insightSource: 'auto',
        archetypeInputs: {},
      });
      console.log('[GENERATE] Job created successfully:', job.id);
    } catch (error) {
      console.error('[GENERATE] Error creating job:', error);
      if (error instanceof Error && error.message.includes('Insufficient')) {
        return NextResponse.json({
          error: "Insufficient tokens",
          error_code: "INSUFFICIENT_TOKENS",
          tokens_required: TOKENS_COST_PER_GENERATION
        }, { status: 402 }); // Payment Required
      }
      throw error;
    }
    // Send job_id to n8n webhook (as per ad_generation_flow.md)
    try {
      console.log('[GENERATE] Sending webhook request to:', webhookUrl);
      const webhookStartTime = Date.now();

      // Resolve callback URL (prefer CALLBACK_URL, fallback to BASE_URL or localhost)
      const callbackUrl =
        process.env.CALLBACK_URL
          ? `${process.env.CALLBACK_URL}/api/generate/callback`
          : `${process.env.BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')}/api/generate/callback`;
      console.log('[GENERATE] Callback URL:', callbackUrl);

      // Set a short timeout (30 seconds) just to ensure the webhook accepts the request
      // We don't wait for workflow completion - that's handled by callback
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.warn('[GENERATE] Webhook request timeout after 30s - continuing to wait for callback');
        controller.abort();
      }, WEBHOOK_TIMEOUT);

      // Fire the webhook request (fire-and-forget after confirmation)
      const webhookPromise = fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-agent-key": webhookKey || "",
        },
        body: JSON.stringify({
          job_id: jobId,
          website_url: url, // Pass website URL
          callback_url: callbackUrl, // Tell n8n where to send the callback
        }),
        signal: controller.signal,
      });

      // Wait for webhook to accept the request (or timeout)
      try {
        const res = await webhookPromise;
        clearTimeout(timeoutId);
        const webhookDuration = Date.now() - webhookStartTime;
        console.log('[GENERATE] Webhook responded after', webhookDuration, 'ms with status:', res.status);

        if (!res.ok) {
          // Webhook call failed - mark job as failed and refund tokens
          console.error('[GENERATE] Webhook returned non-OK status:', res.status);
          const errorText = await res.text().catch(() => 'Webhook request failed');
          console.error('[GENERATE] Webhook error text:', errorText);
          await updateGenerationJobStatus(
            jobId,
            'FAILED',
            'WEBHOOK_ERROR',
            errorText
          );
          await refundTokens(user.id, TOKENS_COST_PER_GENERATION, jobId);

          return NextResponse.json({
            error: "Failed to trigger generation",
            job_id: jobId,
            tokens_refunded: TOKENS_COST_PER_GENERATION
          }, { status: res.status });
        }
      } catch (webhookFetchError) {
        clearTimeout(timeoutId);
        // If it's just a timeout, continue - webhook may have received the request
        if (webhookFetchError instanceof Error && webhookFetchError.name === 'AbortError') {
          console.warn('[GENERATE] Webhook request timed out, but continuing to wait for callback');
        } else {
          // Real error - fail the request
          console.error('[GENERATE] Webhook request error:', webhookFetchError);
          await updateGenerationJobStatus(
            jobId,
            'FAILED',
            'WEBHOOK_ERROR',
            webhookFetchError instanceof Error ? webhookFetchError.message : 'Unknown webhook error'
          );
          await refundTokens(user.id, TOKENS_COST_PER_GENERATION, jobId);

          return NextResponse.json({
            error: "Failed to trigger generation",
            job_id: jobId,
            tokens_refunded: TOKENS_COST_PER_GENERATION
          }, { status: 502 });
        }
      }

      // Wait for callback from n8n (no polling - event-driven)
      console.log('[GENERATE] Waiting for callback from n8n...');
      const callbackWaitStart = Date.now();

      try {
        const callbackResult = await waitForCallback(jobId, MAX_WAIT_TIME);
        const callbackWaitDuration = Date.now() - callbackWaitStart;
        console.log('[GENERATE] Callback received after', callbackWaitDuration, 'ms');
        console.log('[GENERATE] Callback status:', callbackResult.status, 'images:', callbackResult.images.length);

        const totalDuration = Date.now() - requestStartTime;
        console.log('[GENERATE] Total request duration:', totalDuration, 'ms');

        if (callbackResult.status === 'SUCCEEDED') {
          console.log('[GENERATE] Returning SUCCEEDED response');
          return NextResponse.json({
            job_id: jobId,
            status: 'SUCCEEDED',
            images: callbackResult.images,
            tokens_used: TOKENS_COST_PER_GENERATION
          });
        } else {
          // FAILED or CANCELED - refund tokens
          console.log('[GENERATE] Returning', callbackResult.status, 'response - refunding tokens');

          // Refund tokens for failed/canceled jobs
          try {
            await refundTokens(user.id, TOKENS_COST_PER_GENERATION, jobId);
            console.log('[GENERATE] Tokens refunded for', callbackResult.status, 'job:', jobId);
          } catch (refundError) {
            console.error('[GENERATE] Error refunding tokens:', refundError);
            // Continue even if refund fails - we still want to return the error to the user
          }

          return NextResponse.json({
            job_id: jobId,
            status: callbackResult.status,
            images: callbackResult.images, // May be empty
            error_message: callbackResult.error_message,
            error_code: callbackResult.error_code,
            tokens_refunded: TOKENS_COST_PER_GENERATION
          }, { status: callbackResult.status === 'FAILED' ? 500 : 200 });
        }
      } catch (callbackError) {
        const callbackWaitDuration = Date.now() - callbackWaitStart;
        console.error('[GENERATE] Callback timeout/error after', callbackWaitDuration, 'ms:', callbackError);

        // Timeout waiting for callback
        await updateGenerationJobStatus(
          jobId,
          'FAILED',
          'TIMEOUT',
          'Generation exceeded maximum wait time of 7 minutes'
        );
        await refundTokens(user.id, TOKENS_COST_PER_GENERATION, jobId);

        return NextResponse.json({
          error: "Generation timeout",
          job_id: jobId,
          status: 'FAILED',
          error_code: 'TIMEOUT',
          tokens_refunded: TOKENS_COST_PER_GENERATION
        }, { status: 504 }); // Gateway Timeout
      }

    } catch (webhookError) {
      // Webhook call failed - mark job as failed and refund tokens
      const errorDuration = Date.now() - requestStartTime;
      console.error('[GENERATE] Webhook error after', errorDuration, 'ms:', webhookError);

      let errorMessage = 'Unknown webhook error';
      let statusCode = 502;

      if (webhookError instanceof Error) {
        console.error('[GENERATE] Error name:', webhookError.name, 'message:', webhookError.message);
        if (webhookError.name === 'AbortError') {
          errorMessage = 'Webhook request timeout (7 minutes)';
          statusCode = 504; // Gateway Timeout
        } else {
          errorMessage = webhookError.message;
        }
      }

      await updateGenerationJobStatus(
        jobId,
        'FAILED',
        'WEBHOOK_ERROR',
        errorMessage
      );
      await refundTokens(user.id, TOKENS_COST_PER_GENERATION, jobId);

      return NextResponse.json({
        error: "Failed to trigger generation",
        job_id: jobId,
        error_code: statusCode === 504 ? 'WEBHOOK_TIMEOUT' : 'WEBHOOK_ERROR',
        tokens_refunded: TOKENS_COST_PER_GENERATION
      }, { status: statusCode });
    }
  } catch (e) {
    const errorDuration = Date.now() - requestStartTime;
    console.error('[GENERATE] Generation error after', errorDuration, 'ms:', e);
    return NextResponse.json({
      error: "Internal server error",
      message: e instanceof Error ? e.message : "Unknown error"
    }, { status: 500 });
  }
}
