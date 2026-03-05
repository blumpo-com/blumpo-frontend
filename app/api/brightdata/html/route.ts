/**
 * POST /api/brightdata/html
 *
 * Fetches fully rendered HTML for a list of URLs using Bright Data Scraping Browser (CDP).
 *
 * Example request:
 *   curl -X POST http://localhost:3000/api/brightdata/html \
 *     -H "Content-Type: application/json" \
 *     -d '{"urls":["https://example.com","https://example.com/about"]}'
 *
 * Example response:
 *   {
 *     "results": [
 *       { "url": "https://example.com", "html": "<!DOCTYPE html>..." },
 *       { "url": "https://example.com/about", "html": null, "error": "Navigation timeout" }
 *     ]
 *   }
 */

import { NextResponse } from "next/server";
import { chromium, type Browser } from "playwright";

const NAVIGATION_TIMEOUT_MS = 90_000;
const POST_NAV_WAIT_MS = 2_000;
const MAX_ATTEMPTS = 3;
const BACKOFF_MS = [1000, 3000, 8000]; // delays before attempt 2, 3, 4

export const maxDuration = 300;

type ResultItem =
  | { url: string; html: string, title: string }
  | { url: string; html: null; title: null; error: string };

function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return (
      msg.includes("timeout") ||
      msg.includes("502") ||
      msg.includes("no_peer") ||
      msg.includes("protocol") ||
      msg.includes("navigation")
    );
  }
  return true;
}

async function scrapeOne(
  browser: Browser,
  url: string
): Promise<{ html: string, title: string }> {
  const page = await browser.newPage();
  try {
    page.setDefaultNavigationTimeout(NAVIGATION_TIMEOUT_MS);
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await new Promise((r) => setTimeout(r, POST_NAV_WAIT_MS));
    const html = await page.content();
    const title = await page.title();
    return { html, title };
  } finally {
    await page.close().catch(() => {});
  }
}

async function scrapeUrl(browser: Browser, url: string): Promise<ResultItem> {
  console.log("[brightdata/html] Starting URL:", url);
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const { html, title } = await scrapeOne(browser, url);
      console.log("[brightdata/html] Success:", url);
      return { url, html, title };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < MAX_ATTEMPTS && isRetryableError(error)) {
        const delay = BACKOFF_MS[attempt - 1];
        await new Promise((r) => setTimeout(r, delay));
      } else {
        break;
      }
    }
  }
  const errorMessage = lastError?.message ?? "Unknown error";
  return { url, html: null, title: null, error: errorMessage };
}

export async function POST(req: Request) {
  const auth = process.env.BRIGHTDATA_AUTH;
  if (!auth?.trim()) {
    return NextResponse.json(
      { error: "BRIGHTDATA_AUTH is not configured" },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const urls = Array.isArray((body as { urls?: unknown }).urls)
    ? (body as { urls: unknown[] }).urls
    : null;
  if (
    !urls ||
    urls.length === 0 ||
    !urls.every((u): u is string => typeof u === "string")
  ) {
    return NextResponse.json(
      { error: "Body must contain a non-empty array of strings: urls" },
      { status: 400 }
    );
  }

  const cdpUrl = `wss://${auth}@brd.superproxy.io:9222`;
  let browser: Browser | null = null;

  try {
    browser = await chromium.connectOverCDP(cdpUrl);
    const results: ResultItem[] = [];
    for (const url of urls) {
      results.push(await scrapeUrl(browser, url));
    }
    return NextResponse.json({ results });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to connect to browser";
    return NextResponse.json(
      { error: "Browser connection failed", details: message },
      { status: 503 }
    );
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}
