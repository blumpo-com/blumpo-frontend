import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  const webhookKey = process.env.N8N_WEBHOOK_KEY;
  console.log({ webhookUrl, webhookKey })

  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Missing url" }, { status: 400 });
    }

    const res = await fetch(webhookUrl!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-agent-key": webhookKey || "",
      },
      body: JSON.stringify({ website: url }),
    });

    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    }

    // binary image (image/*)
    const blob = await res.arrayBuffer();
    return new NextResponse(blob, {
      status: res.status,
      headers: { "Content-Type": contentType || "image/png" },
    });
  } catch (e) {
    return NextResponse.json({ error: "Upstream error" }, { status: 502 });
  }
}
