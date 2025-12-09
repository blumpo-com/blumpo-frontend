import { NextResponse } from "next/server";
import { getUser, reserveTokens, refundTokens, hasEnoughTokens } from "@/lib/db/queries";
import { randomUUID } from "crypto";

const TOKENS_COST_PER_GENERATION = 50;

export async function POST(req: Request) {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  const webhookKey = process.env.N8N_WEBHOOK_KEY;
  
  try {
    // Check if user is authenticated
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Missing url" }, { status: 400 });
    }

    // Check if user has enough tokens before proceeding
    const hasTokens = await hasEnoughTokens(user.id, TOKENS_COST_PER_GENERATION);
    if (!hasTokens) {
      return NextResponse.json({ 
        error: "Insufficient tokens", 
        error_code: "INSUFFICIENT_TOKENS",
        tokens_required: TOKENS_COST_PER_GENERATION
      }, { status: 402 }); // Payment Required
    }

    // Generate a unique job ID for this generation
    const jobId = randomUUID();

    try {
      // Reserve tokens before processing
      await reserveTokens(user.id, TOKENS_COST_PER_GENERATION, jobId);
    } catch (error) {
      if (error instanceof Error && error.message === 'INSUFFICIENT_TOKENS') {
        return NextResponse.json({ 
          error: "Insufficient tokens", 
          error_code: "INSUFFICIENT_TOKENS",
          tokens_required: TOKENS_COST_PER_GENERATION
        }, { status: 402 }); // Payment Required
      }
      throw error;
    }

    let generationSuccessful = false;

    try {
      const res = await fetch(webhookUrl!, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-agent-key": webhookKey || "",
          "x-job-id": jobId, // Pass job ID to the webhook
        },
        body: JSON.stringify({ website: url }),
      });

      const contentType = res.headers.get("content-type") || "";
      
      if (res.ok) {
        generationSuccessful = true;
        
        if (contentType.includes("application/json")) {
          const data = await res.json();
          return NextResponse.json({
            ...data,
            job_id: jobId,
            tokens_used: TOKENS_COST_PER_GENERATION
          }, { status: res.status });
        }

        // binary image (image/*)
        const blob = await res.arrayBuffer();
        return new NextResponse(blob, {
          status: res.status,
          headers: { 
            "Content-Type": contentType || "image/png",
            "x-job-id": jobId,
            "x-tokens-used": TOKENS_COST_PER_GENERATION.toString()
          },
        });
      } else {
        // Generation failed, refund tokens
        await refundTokens(user.id, TOKENS_COST_PER_GENERATION, jobId);
        
        if (contentType.includes("application/json")) {
          const errorData = await res.json();
          return NextResponse.json({
            ...errorData,
            job_id: jobId,
            tokens_refunded: TOKENS_COST_PER_GENERATION
          }, { status: res.status });
        }
        
        return NextResponse.json({ 
          error: "Generation failed", 
          job_id: jobId,
          tokens_refunded: TOKENS_COST_PER_GENERATION
        }, { status: res.status });
      }
    } catch (processingError) {
      // If we haven't marked generation as successful, refund tokens
      if (!generationSuccessful) {
        try {
          await refundTokens(user.id, TOKENS_COST_PER_GENERATION, jobId);
        } catch (refundError) {
          console.error('Failed to refund tokens:', refundError);
        }
      }
      throw processingError;
    }
  } catch (e) {
    console.error('Generation error:', e);
    return NextResponse.json({ error: "Upstream error" }, { status: 502 });
  }
}
