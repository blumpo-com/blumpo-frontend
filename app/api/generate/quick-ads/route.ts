import { NextResponse } from "next/server";
import { getUser, updateGenerationJobStatus } from "@/lib/db/queries";
import { getGenerationJobById } from "@/lib/db/queries/generation";
import { waitForCallback } from "@/lib/api/callback-waiter";

const MAX_WAIT_TIME = 7 * 60 * 1000; // 7 minutes in milliseconds
const WEBHOOK_TIMEOUT = 30000; // 30 seconds - just to confirm webhook received the request

// Vercel Function max duration - allows full wait for n8n callback (Pro/Enterprise: up to 800s; Hobby: capped at 300s)
export const maxDuration = 420; // 7 minutes

export async function POST(req: Request) {
  const requestStartTime = Date.now();
  console.log('[GENERATE-QUICK-ADS] Request started at', new Date().toISOString());

  const isTestMode = process.env.NEXT_PUBLIC_IS_TEST_MODE === "true";
  const webhookUrl = 'https://automationforms.app.n8n.cloud/webhook/quick-ads';
  const webhookKey = process.env.N8N_WEBHOOK_KEY;

  try {
    const { jobId } = await req.json();
    console.log('[GENERATE-QUICK-ADS] Received jobId:', jobId);
    
    // Check if user is authenticated
    const user = await getUser();
    if (!user) {
      console.log('[GENERATE-QUICK-ADS] User not authenticated');
      return NextResponse.json({ 
        error: "Unauthorized", 
        error_code: "AUTH_REQUIRED"
      }, { status: 401 });
    }
    console.log('[GENERATE-QUICK-ADS] User authenticated:', user.id);

    if (!jobId || typeof jobId !== "string") {
      console.error('[GENERATE-QUICK-ADS] Missing or invalid jobId');
      return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
    }

    // Fetch the existing generation job
    const job = await getGenerationJobById(jobId);
    if (!job) {
      console.error('[GENERATE-QUICK-ADS] Job not found:', jobId);
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Verify job belongs to user
    if (job.userId !== user.id) {
      console.error('[GENERATE-QUICK-ADS] Job does not belong to user');
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // If job is already RUNNING, return success (idempotency)
    if (job.status === 'RUNNING') {
      console.log('[GENERATE-QUICK-ADS] Job is already RUNNING, returning early');
      return NextResponse.json({
        job_id: jobId,
        status: 'RUNNING',
        message: 'Generation already in progress',
      });
    }

    // If job is already completed or failed, don't proceed
    if (job.status === 'SUCCEEDED' || job.status === 'FAILED' || job.status === 'CANCELED') {
      console.log('[GENERATE-QUICK-ADS] Job is already', job.status);
      return NextResponse.json({
        job_id: jobId,
        status: job.status,
        message: `Job is already ${job.status}`,
      }, { status: 400 });
    }

    // For quick ads, tokens are NOT deducted at generation start
    // Tokens will be deducted when ads are displayed via /api/quick-ads/mark-displayed
    // Update status to RUNNING
    await updateGenerationJobStatus(jobId, 'RUNNING');
    console.log('[GENERATE-QUICK-ADS] Job status updated to RUNNING (no tokens deducted yet)');

    // Send job_id to n8n webhook
    try {
      console.log('[GENERATE-QUICK-ADS] Sending webhook request to:', webhookUrl);
      const webhookStartTime = Date.now();
      
      // Resolve callback URL (prefer CALLBACK_URL, fallback to BASE_URL or localhost)
      const callbackUrl =
        process.env.CALLBACK_URL
          ? `${process.env.CALLBACK_URL}/api/generate/callback`
          : `${process.env.BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')}/api/generate/callback`;
      console.log('[GENERATE-QUICK-ADS] Callback URL:', callbackUrl);
      
      // Set a short timeout (30 seconds) just to ensure the webhook accepts the request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.warn('[GENERATE-QUICK-ADS] Webhook request timeout after 30s - continuing to wait for callback');
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
          callback_url: callbackUrl, // Tell n8n where to send the callback
          is_test_mode: isTestMode,
        }),
        signal: controller.signal,
      });

      // Wait for webhook to accept the request (or timeout)
      try {
        const res = await webhookPromise;
        clearTimeout(timeoutId);
        const webhookDuration = Date.now() - webhookStartTime;
        console.log('[GENERATE-QUICK-ADS] Webhook responded after', webhookDuration, 'ms with status:', res.status);

        if (!res.ok) {
          // Webhook call failed - mark job as failed
          console.error('[GENERATE-QUICK-ADS] Webhook returned non-OK status:', res.status);
          const errorText = await res.text().catch(() => 'Webhook request failed');
          console.error('[GENERATE-QUICK-ADS] Webhook error text:', errorText);
          await updateGenerationJobStatus(
            jobId,
            'FAILED',
            'WEBHOOK_ERROR',
            errorText
          );
          
          return NextResponse.json({ 
            error: "Failed to trigger generation", 
            job_id: jobId
          }, { status: res.status });
        }
      } catch (webhookFetchError) {
        clearTimeout(timeoutId);
        // If it's just a timeout, continue - webhook may have received the request
        if (webhookFetchError instanceof Error && webhookFetchError.name === 'AbortError') {
          console.warn('[GENERATE-QUICK-ADS] Webhook request timed out, but continuing to wait for callback');
        } else {
          // Real error - fail the request
          console.error('[GENERATE-QUICK-ADS] Webhook request error:', webhookFetchError);
          await updateGenerationJobStatus(
            jobId,
            'FAILED',
            'WEBHOOK_ERROR',
            webhookFetchError instanceof Error ? webhookFetchError.message : 'Unknown webhook error'
          );
          
          return NextResponse.json({ 
            error: "Failed to trigger generation", 
            job_id: jobId
          }, { status: 502 });
        }
      }

      // Wait for callback from n8n (no polling - event-driven)
      console.log('[GENERATE-QUICK-ADS] Waiting for callback from n8n...');
      const callbackWaitStart = Date.now();
      
      try {
        const callbackResult = await waitForCallback(jobId, MAX_WAIT_TIME);
        const callbackWaitDuration = Date.now() - callbackWaitStart;
        console.log('[GENERATE-QUICK-ADS] Callback received after', callbackWaitDuration, 'ms');
        console.log('[GENERATE-QUICK-ADS] Callback status:', callbackResult.status, 'images:', callbackResult.images.length);

        const totalDuration = Date.now() - requestStartTime;
        console.log('[GENERATE-QUICK-ADS] Total request duration:', totalDuration, 'ms');

        if (callbackResult.status === 'SUCCEEDED') {
          console.log('[GENERATE-QUICK-ADS] Returning SUCCEEDED response');
          return NextResponse.json({
            job_id: jobId,
            status: 'SUCCEEDED',
            images: callbackResult.images
          });
        } else {
          // FAILED or CANCELED
          console.log('[GENERATE-QUICK-ADS] Returning', callbackResult.status, 'response');
          
          return NextResponse.json({
            job_id: jobId,
            status: callbackResult.status,
            images: callbackResult.images, // May be empty
            error_message: callbackResult.error_message,
            error_code: callbackResult.error_code
          }, { status: callbackResult.status === 'FAILED' ? 500 : 200 });
        }
      } catch (callbackError) {
        const callbackWaitDuration = Date.now() - callbackWaitStart;
        console.error('[GENERATE-QUICK-ADS] Callback timeout/error after', callbackWaitDuration, 'ms:', callbackError);

        const currentJob = await getGenerationJobById(jobId);
        if (currentJob?.status !== 'SUCCEEDED') {
          await updateGenerationJobStatus(
            jobId,
            'FAILED',
            'TIMEOUT',
            'Generation exceeded maximum wait time of 7 minutes'
          );
        } else {
          console.log('[GENERATE-QUICK-ADS] Job already SUCCEEDED after timeout, not updating to FAILED');
        }

        return NextResponse.json({
          error: "Generation timeout",
          job_id: jobId,
          status: currentJob?.status ?? 'FAILED',
          error_code: 'TIMEOUT',
        }, { status: 504 }); // Gateway Timeout
      }

    } catch (webhookError) {
      // Webhook call failed - mark job as failed
      const errorDuration = Date.now() - requestStartTime;
      console.error('[GENERATE-QUICK-ADS] Webhook error after', errorDuration, 'ms:', webhookError);
      
      let errorMessage = 'Unknown webhook error';
      let statusCode = 502;
      
      if (webhookError instanceof Error) {
        console.error('[GENERATE-QUICK-ADS] Error name:', webhookError.name, 'message:', webhookError.message);
        if (webhookError.name === 'AbortError') {
          errorMessage = 'Webhook request timeout (30 seconds)';
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
      
      return NextResponse.json({ 
        error: "Failed to trigger generation", 
        job_id: jobId,
        error_code: statusCode === 504 ? 'WEBHOOK_TIMEOUT' : 'WEBHOOK_ERROR'
      }, { status: statusCode });
    }
  } catch (e) {
    const errorDuration = Date.now() - requestStartTime;
    console.error('[GENERATE-QUICK-ADS] Generation error after', errorDuration, 'ms:', e);
    return NextResponse.json({ 
      error: "Internal server error",
      message: e instanceof Error ? e.message : "Unknown error"
    }, { status: 500 });
  }
}
