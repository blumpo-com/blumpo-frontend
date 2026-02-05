import { NextResponse } from "next/server";
import { getMemeWorkflowsWithPreview } from "@/lib/db/queries/ads";
import { getUser } from "@/lib/db/queries";

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const memeWorkflows = await getMemeWorkflowsWithPreview();
    return NextResponse.json({ memeWorkflows });
  } catch (err) {
    console.error("Error fetching meme workflows:", err);
    return NextResponse.json(
      { error: "Failed to fetch meme workflows" },
      { status: 500 }
    );
  }
}
