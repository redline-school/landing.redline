import { NextRequest, NextResponse } from "next/server";

const GITHUB_PAGES_ORIGIN = "https://redline-school.github.io";

function corsHeaders(request: NextRequest) {
  if (request.headers.get("origin") !== GITHUB_PAGES_ORIGIN) return {};

  return {
    "Access-Control-Allow-Origin": GITHUB_PAGES_ORIGIN,
    Vary: "Origin",
  };
}

function json(request: NextRequest, body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: corsHeaders(request) });
}

function getGoogleScriptUrl() {
  const value = process.env.GOOGLE_SCRIPT_URL;
  if (!value) return null;

  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.hostname !== "script.google.com") return null;
    return url.toString();
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const digits = String(body.phone || "").replace(/\D/g, "");

    if (!body.parent_name || digits.length < 10 || digits.length > 11) {
      return json(request, { ok: false, error: "invalid_contact" }, 400);
    }

    if (!body.grade || !body.subject || !body.goal || body.consent !== true) {
      return json(request, { ok: false, error: "missing_fields" }, 400);
    }

    const googleScriptUrl = getGoogleScriptUrl();
    if (!googleScriptUrl) {
      return json(request, { ok: false, error: "service_unavailable" }, 503);
    }

    const payload = new URLSearchParams();
    Object.entries(body).forEach(([key, value]) => {
      if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        payload.set(key, String(value));
      }
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(googleScriptUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
        body: payload.toString(),
        signal: controller.signal,
        redirect: "follow",
      });

      if (!response.ok) {
        return json(request, { ok: false, error: "upstream_rejected" }, 502);
      }

      return json(request, { ok: true });
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    return json(request, { ok: false, error: "request_failed" }, 500);
  }
}

export function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 204,
    headers: {
      ...corsHeaders(request),
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Max-Age": "86400",
    },
  });
}

