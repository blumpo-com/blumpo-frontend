import { NextResponse } from "next/server";
import { getUser, hasEnoughTokens, updateGenerationJobStatus, refundTokens, reserveTokens, getLedgerEntryByReference } from "@/lib/db/queries";
import { getGenerationJobById } from "@/lib/db/queries/generation";
import { updateGenerationJob } from "@/lib/db/queries/generation";
import { waitForCallback } from "@/lib/api/callback-waiter";

const MAX_WAIT_TIME = 7 * 60 * 1000; // 7 minutes in milliseconds
const WEBHOOK_TIMEOUT = 30000; // 30 seconds - just to confirm webhook received the request

// Calculate token cost based on formats
function calculateTokenCost(formats: string[]): number {
  // Based on format-selection.tsx: 1:1 = 50, 9:16 = 50, 1:1 & 9:16 = 80
  const hasSquare = formats.includes('1:1') || formats.includes('square');
  const hasStory = formats.includes('9:16') || formats.includes('story');
  
  if (hasSquare && hasStory) {
    return 80;
  } else if (hasSquare || hasStory) {
    return 50;
  }
  // Default to 50 if no formats specified
  return 50;
}

export async function POST(req: Request) {
  if (process.env.NEXT_PUBLIC_IS_TEST_MODE === "true") {
    console.log("[GENERATE-CUSTOMIZED] Skipping generation (test mode)");
    return NextResponse.json(
      { error: "Generation disabled in test mode", error_code: "TEST_MODE" },
      { status: 503 }
    );
  }

  const requestStartTime = Date.now();
  console.log('[GENERATE-CUSTOMIZED] Request started at', new Date().toISOString());
  
  const webhookKey = process.env.N8N_WEBHOOK_KEY;

  try {
    const { jobId } = await req.json();
    console.log('[GENERATE-CUSTOMIZED] Received jobId:', jobId);
    
    // Check if user is authenticated
    const user = await getUser();
    if (!user) {
      console.log('[GENERATE-CUSTOMIZED] User not authenticated');
      return NextResponse.json({ 
        error: "Unauthorized", 
        error_code: "AUTH_REQUIRED"
      }, { status: 401 });
    }
    console.log('[GENERATE-CUSTOMIZED] User authenticated:', user.id);

    if (!jobId || typeof jobId !== "string") {
      console.error('[GENERATE-CUSTOMIZED] Missing or invalid jobId');
      return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
    }

    // Fetch the existing generation job
    const job = await getGenerationJobById(jobId);
    if (!job) {
      console.error('[GENERATE-CUSTOMIZED] Job not found:', jobId);
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Verify job belongs to user
    if (job.userId !== user.id) {
      console.error('[GENERATE-CUSTOMIZED] Job does not belong to user');
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // If job is already RUNNING, return success (idempotency)
    if (job.status === 'RUNNING') {
      console.log('[GENERATE-CUSTOMIZED] Job is already RUNNING, returning early');
      return NextResponse.json({
        job_id: jobId,
        status: 'RUNNING',
        message: 'Generation already in progress',
      });
    }

    // If job is already completed or failed, don't proceed
    if (job.status === 'SUCCEEDED' || job.status === 'FAILED' || job.status === 'CANCELED') {
      console.log('[GENERATE-CUSTOMIZED] Job is already', job.status);
      return NextResponse.json({
        job_id: jobId,
        status: job.status,
        message: `Job is already ${job.status}`,
      }, { status: 400 });
    }

    const archetypeCode = job.archetypeCode;
    if(!archetypeCode) {
      console.error('[GENERATE-CUSTOMIZED] Archetype code not found');
      return NextResponse.json({ error: "Archetype code not found" }, { status: 404 });
    }

    const webhookUrl = process.env.N8N_WEBHOOK_URL + archetypeCode;
    if(!webhookUrl) {
      console.error('[GENERATE-CUSTOMIZED] Webhook URL not found for archetype:', archetypeCode);
      return NextResponse.json({ error: "Webhook URL not found for archetype" }, { status: 404 });
    }

    // Calculate token cost based on formats
    const tokensCost = calculateTokenCost(job.formats || []);
    console.log('[GENERATE-CUSTOMIZED] Calculated token cost:', tokensCost, 'for formats:', job.formats);

    // Check if user has enough tokens
    const hasTokens = await hasEnoughTokens(user.id, tokensCost);
    if (!hasTokens) {
      console.log('[GENERATE-CUSTOMIZED] Insufficient tokens for user:', user.id);
      return NextResponse.json({ 
        error: "Insufficient tokens", 
        error_code: "INSUFFICIENT_TOKENS",
        tokens_required: tokensCost
      }, { status: 402 }); // Payment Required
    }
    console.log('[GENERATE-CUSTOMIZED] User has sufficient tokens');

    // Reserve tokens for this job (deducts tokens atomically)
    let tokensReserved = false;
    try {
      console.log('[GENERATE-CUSTOMIZED] Reserving tokens...');
      await reserveTokens(user.id, tokensCost, jobId);
      tokensReserved = true;
      console.log('[GENERATE-CUSTOMIZED] Tokens reserved successfully');
      
      // Get the ledger entry ID for this job
      const ledgerEntry = await getLedgerEntryByReference(jobId, 'JOB_RESERVE');
      const ledgerId = ledgerEntry?.id || null;
      
      // Update job with token cost, ledger ID, and status
      await updateGenerationJob(jobId, {
        tokensCost,
        ledgerId: ledgerId || undefined,
      });
      
      // Update status to RUNNING
      await updateGenerationJobStatus(jobId, 'RUNNING');
      
      console.log('[GENERATE-CUSTOMIZED] Job updated with token cost:', tokensCost);
    } catch (error) {
      console.error('[GENERATE-CUSTOMIZED] Error reserving tokens:', error);
      if (error instanceof Error && error.message.includes('INSUFFICIENT')) {
        return NextResponse.json({ 
          error: "Insufficient tokens", 
          error_code: "INSUFFICIENT_TOKENS",
          tokens_required: tokensCost
        }, { status: 402 });
      }
      throw error;
    }

    // Send job_id to n8n webhook
    try {
      console.log('[GENERATE-CUSTOMIZED] Sending webhook request to:', webhookUrl);
      const webhookStartTime = Date.now();
      
      // Resolve callback URL (prefer CALLBACK_URL, fallback to BASE_URL or localhost)
      const callbackUrl =
        process.env.CALLBACK_URL
          ? `${process.env.CALLBACK_URL}/api/generate/callback`
          : `${process.env.BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')}/api/generate/callback`;
      console.log('[GENERATE-CUSTOMIZED] Callback URL:', callbackUrl);
      
      // Set a short timeout (30 seconds) just to ensure the webhook accepts the request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.warn('[GENERATE-CUSTOMIZED] Webhook request timeout after 30s - continuing to wait for callback');
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
        }),
        signal: controller.signal,
      });

      // Wait for webhook to accept the request (or timeout)
      try {
        const res = await webhookPromise;
        clearTimeout(timeoutId);
        const webhookDuration = Date.now() - webhookStartTime;
        console.log('[GENERATE-CUSTOMIZED] Webhook responded after', webhookDuration, 'ms with status:', res.status);

        if (!res.ok) {
          // Webhook call failed - mark job as failed and refund tokens
          console.error('[GENERATE-CUSTOMIZED] Webhook returned non-OK status:', res.status);
          const errorText = await res.text().catch(() => 'Webhook request failed');
          console.error('[GENERATE-CUSTOMIZED] Webhook error text:', errorText);
          await updateGenerationJobStatus(
            jobId,
            'FAILED',
            'WEBHOOK_ERROR',
            errorText
          );
          // Refund tokens if they were reserved
          if (tokensReserved) {
            try {
              await refundTokens(user.id, tokensCost, jobId);
              console.log('[GENERATE-CUSTOMIZED] Tokens refunded for failed webhook');
            } catch (refundError) {
              console.error('[GENERATE-CUSTOMIZED] Error refunding tokens:', refundError);
            }
          }
          
          return NextResponse.json({ 
            error: "Failed to trigger generation", 
            job_id: jobId,
            tokens_refunded: tokensReserved ? tokensCost : 0
          }, { status: res.status });
        }
      } catch (webhookFetchError) {
        clearTimeout(timeoutId);
        // If it's just a timeout, continue - webhook may have received the request
        if (webhookFetchError instanceof Error && webhookFetchError.name === 'AbortError') {
          console.warn('[GENERATE-CUSTOMIZED] Webhook request timed out, but continuing to wait for callback');
        } else {
          // Real error - fail the request
          console.error('[GENERATE-CUSTOMIZED] Webhook request error:', webhookFetchError);
          await updateGenerationJobStatus(
            jobId,
            'FAILED',
            'WEBHOOK_ERROR',
            webhookFetchError instanceof Error ? webhookFetchError.message : 'Unknown webhook error'
          );
          // Refund tokens if they were reserved
          if (tokensReserved) {
            try {
              await refundTokens(user.id, tokensCost, jobId);
              console.log('[GENERATE-CUSTOMIZED] Tokens refunded for webhook error');
            } catch (refundError) {
              console.error('[GENERATE-CUSTOMIZED] Error refunding tokens:', refundError);
            }
          }
          
          return NextResponse.json({ 
            error: "Failed to trigger generation", 
            job_id: jobId,
            tokens_refunded: tokensReserved ? tokensCost : 0
          }, { status: 502 });
        }
      }

      // Wait for callback from n8n (no polling - event-driven)
      console.log('[GENERATE-CUSTOMIZED] Waiting for callback from n8n...');
      const callbackWaitStart = Date.now();
      
      try {
        const callbackResult = await waitForCallback(jobId, MAX_WAIT_TIME);
        const callbackWaitDuration = Date.now() - callbackWaitStart;
        console.log('[GENERATE-CUSTOMIZED] Callback received after', callbackWaitDuration, 'ms');
        console.log('[GENERATE-CUSTOMIZED] Callback status:', callbackResult.status, 'images:', callbackResult.images.length);

        const totalDuration = Date.now() - requestStartTime;
        console.log('[GENERATE-CUSTOMIZED] Total request duration:', totalDuration, 'ms');

        if (callbackResult.status === 'SUCCEEDED') {
          console.log('[GENERATE-CUSTOMIZED] Returning SUCCEEDED response');
          return NextResponse.json({
            job_id: jobId,
            status: 'SUCCEEDED',
            images: callbackResult.images,
            tokens_used: tokensCost
          });
        } else {
          // FAILED or CANCELED - refund tokens
          console.log('[GENERATE-CUSTOMIZED] Returning', callbackResult.status, 'response - refunding tokens');
          
          // Refund tokens for failed/canceled jobs
          if (tokensReserved) {
            try {
              await refundTokens(user.id, tokensCost, jobId);
              console.log('[GENERATE-CUSTOMIZED] Tokens refunded for', callbackResult.status, 'job:', jobId);
            } catch (refundError) {
              console.error('[GENERATE-CUSTOMIZED] Error refunding tokens:', refundError);
              // Continue even if refund fails - we still want to return the error to the user
            }
          }
          
          return NextResponse.json({
            job_id: jobId,
            status: callbackResult.status,
            images: callbackResult.images, // May be empty
            error_message: callbackResult.error_message,
            error_code: callbackResult.error_code,
            tokens_refunded: tokensReserved ? tokensCost : 0
          }, { status: callbackResult.status === 'FAILED' ? 500 : 200 });
        }
      } catch (callbackError) {
        const callbackWaitDuration = Date.now() - callbackWaitStart;
        console.error('[GENERATE-CUSTOMIZED] Callback timeout/error after', callbackWaitDuration, 'ms:', callbackError);
        
        // Timeout waiting for callback
        await updateGenerationJobStatus(
          jobId,
          'FAILED',
          'TIMEOUT',
          'Generation exceeded maximum wait time of 7 minutes'
        );
        
        // Refund tokens if they were reserved
        if (tokensReserved) {
          try {
            await refundTokens(user.id, tokensCost, jobId);
            console.log('[GENERATE-CUSTOMIZED] Tokens refunded for timeout');
          } catch (refundError) {
            console.error('[GENERATE-CUSTOMIZED] Error refunding tokens:', refundError);
          }
        }
        
        return NextResponse.json({
          error: "Generation timeout",
          job_id: jobId,
          status: 'FAILED',
          error_code: 'TIMEOUT',
          tokens_refunded: tokensReserved ? tokensCost : 0
        }, { status: 504 }); // Gateway Timeout
      }

    } catch (webhookError) {
      // Webhook call failed - mark job as failed
      const errorDuration = Date.now() - requestStartTime;
      console.error('[GENERATE-CUSTOMIZED] Webhook error after', errorDuration, 'ms:', webhookError);
      
      let errorMessage = 'Unknown webhook error';
      let statusCode = 502;
      
      if (webhookError instanceof Error) {
        console.error('[GENERATE-CUSTOMIZED] Error name:', webhookError.name, 'message:', webhookError.message);
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
      
      // Refund tokens if they were reserved
      if (tokensReserved) {
        try {
          await refundTokens(user.id, tokensCost, jobId);
          console.log('[GENERATE-CUSTOMIZED] Tokens refunded for webhook error');
        } catch (refundError) {
          console.error('[GENERATE-CUSTOMIZED] Error refunding tokens:', refundError);
        }
      }
      
      return NextResponse.json({ 
        error: "Failed to trigger generation", 
        job_id: jobId,
        error_code: statusCode === 504 ? 'WEBHOOK_TIMEOUT' : 'WEBHOOK_ERROR',
        tokens_refunded: tokensReserved ? tokensCost : 0
      }, { status: statusCode });
    }
  } catch (e) {
    const errorDuration = Date.now() - requestStartTime;
    console.error('[GENERATE-CUSTOMIZED] Generation error after', errorDuration, 'ms:', e);
    return NextResponse.json({ 
      error: "Internal server error",
      message: e instanceof Error ? e.message : "Unknown error"
    }, { status: 500 });
  }
}

