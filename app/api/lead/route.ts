import { NextRequest, NextResponse } from "next/server";

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
      return NextResponse.json({ ok: false, error: "invalid_contact" }, { status: 400 });
    }

    if (!body.grade || !body.subject || !body.goal || body.consent !== true) {
      return NextResponse.json({ ok: false, error: "missing_fields" }, { status: 400 });
    }

    const googleScriptUrl = getGoogleScriptUrl();
    if (!googleScriptUrl) {
      return NextResponse.json({ ok: false, error: "service_unavailable" }, { status: 503 });
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
        return NextResponse.json({ ok: false, error: "upstream_rejected" }, { status: 502 });
      }

      return NextResponse.json({ ok: true });
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    return NextResponse.json({ ok: false, error: "request_failed" }, { status: 500 });
  }
}
