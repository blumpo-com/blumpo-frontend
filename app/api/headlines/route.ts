import { NextResponse } from "next/server";
import { getUser } from "@/lib/db/queries";

/**
 * Maps archetype IDs to webhook endpoint names
 */
function getArchetypeWebhookEndpoint(archetypeId: string): string {
  const mapping: Record<string, string> = {
    'problem_solution': 'ps',
    'testimonial': 'tm',
    'competitor_comparison': 'cc',
    'promotion_offer': 'po',
    'value_proposition': 'vp',
    'random': 'random',
  };
  
  return mapping[archetypeId] || 'ps';
}

export async function POST(req: Request) {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  const webhookKey = process.env.N8N_WEBHOOK_KEY;
  
  try {
    // Check if user is authenticated
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { archetypeId, brandId } = await req.json();

    if (!archetypeId || typeof archetypeId !== "string") {
      return NextResponse.json({ error: "Missing archetypeId" }, { status: 400 });
    }

    if (!brandId || typeof brandId !== "string") {
      return NextResponse.json({ error: "Missing brandId" }, { status: 400 });
    }

    // Only allow testimonial archetype
    if (archetypeId !== "testimonial") {
      return NextResponse.json({ 
        error: "Headlines API only supports testimonial archetype" 
      }, { status: 400 });
    }

    if (!webhookUrl) {
      return NextResponse.json({ error: "Webhook URL not configured" }, { status: 500 });
    }

    // Get the webhook endpoint name for this archetype
    const endpointName = getArchetypeWebhookEndpoint(archetypeId);
    // N8N_WEBHOOK_URL should be the base URL (e.g., https://automationforms.app.n8n.cloud/webhook-test)
    // We append the archetype-specific endpoint (e.g., /ps-headline)
    const fullWebhookUrl = `${webhookUrl}${endpointName}-headline`;

    try {
      const res = await fetch(fullWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-agent-key": webhookKey || "",
        },
        body: JSON.stringify({
          brandId: brandId,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Webhook error:', errorText);
        return NextResponse.json({ 
          error: "Failed to fetch headlines",
          details: errorText
        }, { status: res.status });
      }

      const data = await res.json();
      
      // Extract data from the response structure
      // Response format can be:
      // 1. [{ output: { testimonial1: "...", name1: "...", cta1: "..." } }]
      // 2. { output: { testimonial1: "...", name1: "...", cta1: "..." } }
      // 3. Direct object with testimonial properties
      
      let output: Record<string, any> | null = null;
      
      if (Array.isArray(data) && data.length > 0) {
        // Handle array format: [{ output: {...} }]
        if (data[0].output) {
          output = data[0].output;
        } else if (data[0].testimonial1) {
          // Direct array with testimonial properties
          output = data[0];
        }
      } else if (data && typeof data === 'object') {
        // Handle object format
        if (data.output) {
          output = data.output;
        } else if (data.testimonial1) {
          // Direct object with testimonial properties
          output = data;
        }
      }
      
      if (output) {
        const headlines: string[] = [];
        
        // Extract testimonial1 through testimonial6
        for (let i = 1; i <= 6; i++) {
          const testimonialKey = `testimonial${i}`;
          if (output[testimonialKey] && typeof output[testimonialKey] === 'string') {
            headlines.push(output[testimonialKey]);
          }
        }
        
        // Extract name1 and cta1 for testimonial archetype
        const name1 = output.name1 && typeof output.name1 === 'string' ? output.name1 : '';
        const cta1 = output.cta1 && typeof output.cta1 === 'string' ? output.cta1 : '';
        
        if (headlines.length > 0) {
          return NextResponse.json({ 
            headlines,
            name1,
            cta1
          });
        }
      }
      
      // Log the actual response for debugging
      console.error('Unexpected response format from webhook:', JSON.stringify(data, null, 2));
      return NextResponse.json({ 
        error: "Invalid response format from webhook",
        receivedFormat: Array.isArray(data) ? 'array' : typeof data
      }, { status: 500 });
      
    } catch (fetchError) {
      console.error('Error calling webhook:', fetchError);
      return NextResponse.json({ 
        error: "Failed to connect to webhook service" 
      }, { status: 502 });
    }
  } catch (e) {
    console.error('Headlines API error:', e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
