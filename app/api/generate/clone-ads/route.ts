import { NextResponse } from "next/server";
import {
  getUser,
  hasEnoughTokens,
  updateGenerationJobStatus,
  refundTokens,
  reserveTokens,
  getLedgerEntryByReference,
  getWorkflowById,
} from "@/lib/db/queries";
import { getGenerationJobById, updateGenerationJob } from "@/lib/db/queries/generation";
import { waitForCallback, waitForExistingCallback } from "@/lib/api/callback-waiter";

const MAX_WAIT_TIME = 3 * 60 * 1000; // 3 minutes
const WEBHOOK_TIMEOUT = 30000; // 30 seconds
const CLONE_AD_INITIAL_POLL_DELAY_MS = 10 * 1000; // 10 seconds

function calculateCloneAdTokenCost(formats: string[]): number {
  const hasSquare = formats.includes("1:1") || formats.includes("square");
  const hasStory = formats.includes("9:16") || formats.includes("story");
  if (hasSquare && hasStory) return 15;
  if (hasSquare || hasStory) return 10;
  return 10;
}

export const maxDuration = 420; // 7 minutes

export async function POST(req: Request) {
  const requestStartTime = Date.now();
  console.log("[GENERATE-CLONE-ADS] Request started at", new Date().toISOString());

  const webhookKey = process.env.N8N_WEBHOOK_KEY;
  const webhookUrl = process.env.N8N_WEBHOOK_URL + 'clone-ad';
  const isTestMode = process.env.NEXT_PUBLIC_IS_TEST_MODE === "true";

  try {
    const { jobId } = await req.json();
    console.log("[GENERATE-CLONE-ADS] Received jobId:", jobId);

    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized", error_code: "AUTH_REQUIRED" },
        { status: 401 }
      );
    }

    if (!jobId || typeof jobId !== "string") {
      return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
    }

    const job = await getGenerationJobById(jobId);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    if (job.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const params = (job.params || {}) as { source?: string; workflow_id?: string };
    if (params.source !== "clone_ad" || !params.workflow_id) {
      return NextResponse.json(
        { error: "Job is not a clone-ad job or missing workflow_id" },
        { status: 400 }
      );
    }

    if (job.status === "SUCCEEDED") {
      return NextResponse.json({
        job_id: jobId,
        status: "SUCCEEDED",
        message: "Job already completed",
      });
    }

    if (job.status === "FAILED" || job.status === "CANCELED") {
      return NextResponse.json(
        {
          job_id: jobId,
          status: job.status,
          images: [],
          error_message: job.errorMessage || `Generation ${job.status.toLowerCase()}`,
          error_code: job.errorCode || null,
        },
        { status: job.status === "FAILED" ? 500 : 200 }
      );
    }

    if (job.status === "RUNNING") {
      console.log("[GENERATE-CLONE-ADS] Job already RUNNING, waiting for existing callback...");
      try {
        const callbackResult = await waitForExistingCallback(jobId, MAX_WAIT_TIME);
        if (!callbackResult) {
          return NextResponse.json({
            job_id: jobId,
            status: "RUNNING",
            message: "Generation in progress - no callback available yet",
          });
        }
        if (callbackResult.status === "SUCCEEDED") {
          return NextResponse.json({
            job_id: jobId,
            status: "SUCCEEDED",
            images: callbackResult.images,
            tokens_used: job.tokensCost || 0,
          });
        }
        if (callbackResult.status === "FAILED" || callbackResult.status === "CANCELED") {
          try {
            await refundTokens(user.id, job.tokensCost || 0, jobId);
          } catch {
            // ignore
          }
          await updateGenerationJobStatus(
            jobId,
            callbackResult.status as "FAILED" | "CANCELED",
            callbackResult.error_code,
            callbackResult.error_message
          );
          return NextResponse.json({
            job_id: jobId,
            status: callbackResult.status,
            images: callbackResult.images || [],
            error_message: callbackResult.error_message,
            error_code: callbackResult.error_code,
          }, { status: callbackResult.status === "FAILED" ? 500 : 200 });
        }
      } catch (callbackError) {
        console.error("[GENERATE-CLONE-ADS] Callback wait error:", callbackError);
        const currentJob = await getGenerationJobById(jobId);
        if (currentJob?.status !== "SUCCEEDED") {
          await updateGenerationJobStatus(jobId, "FAILED", "TIMEOUT", "Generation timeout");
          try {
            await refundTokens(user.id, job.tokensCost || 0, jobId);
          } catch {
            // ignore
          }
        }
        return NextResponse.json(
          {
            error: "Generation timeout",
            job_id: jobId,
            status: currentJob?.status ?? "FAILED",
            error_code: "TIMEOUT",
          },
          { status: 504 }
        );
      }
    }

    const formats = job.formats || [];
    const tokensCost = calculateCloneAdTokenCost(formats);

    const hasTokens = await hasEnoughTokens(user.id, tokensCost);
    if (!hasTokens) {
      return NextResponse.json(
        {
          error: "Insufficient tokens",
          error_code: "INSUFFICIENT_TOKENS",
          tokens_required: tokensCost,
        },
        { status: 402 }
      );
    }

    let tokensReserved = false;
    try {
      await reserveTokens(user.id, tokensCost, jobId);
      tokensReserved = true;
      const ledgerEntry = await getLedgerEntryByReference(jobId, "JOB_RESERVE");
      await updateGenerationJob(jobId, {
        tokensCost,
        ledgerId: ledgerEntry?.id,
      });
      await updateGenerationJobStatus(jobId, "RUNNING");
    } catch (error) {
      if (error instanceof Error && error.message.includes("INSUFFICIENT")) {
        return NextResponse.json(
          { error: "Insufficient tokens", error_code: "INSUFFICIENT_TOKENS", tokens_required: tokensCost },
          { status: 402 }
        );
      }
      throw error;
    }

    const workflow = await getWorkflowById(params.workflow_id);
    if (!workflow) {
      await updateGenerationJobStatus(jobId, "FAILED", "WORKFLOW_NOT_FOUND", "Workflow not found");
      if (tokensReserved) {
        try {
          await refundTokens(user.id, tokensCost, jobId);
        } catch {
          // ignore
        }
      }
      return NextResponse.json(
        { error: "Workflow not found", error_code: "WORKFLOW_NOT_FOUND" },
        { status: 400 }
      );
    }

    if (!webhookUrl) {
      await updateGenerationJobStatus(jobId, "FAILED", "CONFIG_ERROR", "Clone-ad webhook URL not configured");
      if (tokensReserved) {
        try {
          await refundTokens(user.id, tokensCost, jobId);
        } catch {
          // ignore
        }
      }
      return NextResponse.json(
        { error: "Clone-ad webhook not configured", error_code: "CONFIG_ERROR" },
        { status: 500 }
      );
    }

    const callbackUrl = process.env.CALLBACK_URL
      ? `${process.env.CALLBACK_URL}/api/generate/callback`
      : `${process.env.BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")}/api/generate/callback`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT);

    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-agent-key": webhookKey || "",
        },
        body: JSON.stringify({
          job_id: jobId,
          callback_url: callbackUrl,
          workflow_uid: workflow.workflowUid,
          workflow_archetype_code: workflow.archetypeCode,
          formats,
          is_test_mode: isTestMode,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorText = await res.text().catch(() => "Webhook request failed");
        await updateGenerationJobStatus(jobId, "FAILED", "WEBHOOK_ERROR", errorText);
        if (tokensReserved) {
          try {
            await refundTokens(user.id, tokensCost, jobId);
          } catch {
            // ignore
          }
        }
        return NextResponse.json(
          { error: "Failed to trigger generation", job_id: jobId },
          { status: res.status }
        );
      }
    } catch (webhookFetchError) {
      clearTimeout(timeoutId);
      if (webhookFetchError instanceof Error && webhookFetchError.name === "AbortError") {
        console.warn("[GENERATE-CLONE-ADS] Webhook timeout, continuing to wait for callback");
      } else {
        console.error("[GENERATE-CLONE-ADS] Webhook error:", webhookFetchError);
        await updateGenerationJobStatus(
          jobId,
          "FAILED",
          "WEBHOOK_ERROR",
          webhookFetchError instanceof Error ? webhookFetchError.message : "Unknown webhook error"
        );
        if (tokensReserved) {
          try {
            await refundTokens(user.id, tokensCost, jobId);
          } catch {
            // ignore
          }
        }
        return NextResponse.json(
          { error: "Failed to trigger generation", job_id: jobId },
          { status: 502 }
        );
      }
    }

    console.log("[GENERATE-CLONE-ADS] Waiting for callback (initial poll delay 10s)...");
    try {
      const callbackResult = await waitForCallback(
        jobId,
        MAX_WAIT_TIME,
        CLONE_AD_INITIAL_POLL_DELAY_MS
      );

      if (callbackResult.status === "SUCCEEDED") {
        return NextResponse.json({
          job_id: jobId,
          status: "SUCCEEDED",
          images: callbackResult.images,
          tokens_used: tokensCost,
        });
      }

      if (tokensReserved) {
        try {
          await refundTokens(user.id, tokensCost, jobId);
        } catch {
          // ignore
        }
      }
      await updateGenerationJobStatus(
        jobId,
        callbackResult.status as "FAILED" | "CANCELED",
        callbackResult.error_code,
        callbackResult.error_message
      );
      return NextResponse.json(
        {
          job_id: jobId,
          status: callbackResult.status,
          images: callbackResult.images || [],
          error_message: callbackResult.error_message,
          error_code: callbackResult.error_code,
        },
        { status: callbackResult.status === "FAILED" ? 500 : 200 }
      );
    } catch (callbackError) {
      console.error("[GENERATE-CLONE-ADS] Callback timeout/error:", callbackError);
      const currentJob = await getGenerationJobById(jobId);
      if (currentJob?.status !== "SUCCEEDED") {
        await updateGenerationJobStatus(jobId, "FAILED", "TIMEOUT", "Generation exceeded maximum wait time");
        if (tokensReserved) {
          try {
            await refundTokens(user.id, tokensCost, jobId);
          } catch {
            // ignore
          }
        }
      }
      return NextResponse.json(
        {
          error: "Generation timeout",
          job_id: jobId,
          status: currentJob?.status ?? "FAILED",
          error_code: "TIMEOUT",
        },
        { status: 504 }
      );
    }
  } catch (e) {
    console.error("[GENERATE-CLONE-ADS] Error:", e);
    return NextResponse.json(
      { error: "Internal server error", message: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
