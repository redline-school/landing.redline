import { createServer } from "node:http";
import { query } from "/opt/tutor-chat-app/server/dist/db.js";
import { sendPushToAdmins } from "/opt/tutor-chat-app/server/dist/push.js";

const host = "127.0.0.1";
const port = 4100;
const allowedOrigins = new Set([
  "https://landing.redline-tutors.ru",
  "http://landing.redline-tutors.ru",
]);
const attempts = new Map();
const rateWindowMs = 10 * 60 * 1000;
const rateLimit = 5;

await query(`
  create table if not exists landing_leads (
    id uuid primary key default gen_random_uuid(),
    parent_name text not null,
    phone text not null,
    contact_method text not null default '',
    grade text not null,
    subject text not null,
    goal text not null,
    source text not null default 'redline_landing_1_9',
    page_url text not null default '',
    campaign jsonb not null default '{}'::jsonb,
    ip_address text not null default '',
    user_agent text not null default '',
    created_at timestamptz not null default now()
  )
`);
await query(`
  create index if not exists landing_leads_created_at_idx
  on landing_leads (created_at desc)
`);

function sendJson(response, status, body) {
  const payload = JSON.stringify(body);
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload),
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  response.end(payload);
}

function getClientIp(request) {
  return String(request.headers["x-real-ip"] || request.socket.remoteAddress || "").slice(0, 80);
}

function isRateLimited(ip) {
  const now = Date.now();
  const recent = (attempts.get(ip) || []).filter((timestamp) => now - timestamp < rateWindowMs);
  recent.push(now);
  attempts.set(ip, recent);
  return recent.length > rateLimit;
}

async function readJson(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 32 * 1024) throw new Error("payload_too_large");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function clean(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

const server = createServer(async (request, response) => {
  if (request.method === "GET" && request.url === "/health") {
    sendJson(response, 200, { ok: true });
    return;
  }

  if (request.method !== "POST" || request.url !== "/api/lead") {
    sendJson(response, 404, { ok: false, error: "not_found" });
    return;
  }

  const origin = clean(request.headers.origin, 200);
  if (origin && !allowedOrigins.has(origin)) {
    sendJson(response, 403, { ok: false, error: "origin_rejected" });
    return;
  }

  const ip = getClientIp(request);
  if (isRateLimited(ip)) {
    sendJson(response, 429, { ok: false, error: "rate_limited" });
    return;
  }

  try {
    const body = await readJson(request);
    const parentName = clean(body.parent_name, 100);
    const phone = clean(body.phone, 40);
    const digits = phone.replace(/\D/g, "");
    const grade = clean(body.grade, 20);
    const subject = clean(body.subject, 80);
    const goal = clean(body.goal, 500);
    const contactMethod = clean(body.contact_method, 50);
    const source = clean(body.source, 80) || "redline_landing_1_9";
    const pageUrl = clean(body.page_url, 500);

    if (
      parentName.length < 2 ||
      digits.length < 10 ||
      digits.length > 11 ||
      !grade ||
      !subject ||
      !goal ||
      body.consent !== true
    ) {
      sendJson(response, 400, { ok: false, error: "invalid_lead" });
      return;
    }

    const campaign = {};
    for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "yclid"]) {
      const value = clean(body[key], 250);
      if (value) campaign[key] = value;
    }

    const { rows } = await query(
      `insert into landing_leads (
        parent_name, phone, contact_method, grade, subject, goal,
        source, page_url, campaign, ip_address, user_agent
      ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11)
      returning id, created_at`,
      [
        parentName,
        phone,
        contactMethod,
        grade,
        subject,
        goal,
        source,
        pageUrl,
        JSON.stringify(campaign),
        ip,
        clean(request.headers["user-agent"], 500),
      ],
    );

    const lead = rows[0];
    if (source !== "deployment_test") {
      void sendPushToAdmins({
        title: "Новая заявка с лендинга",
        body: `${parentName}: ${phone}, ${subject}, ${grade} класс`,
        data: {
          type: "registration_request",
          route: "/admin-crm",
          landingLeadId: lead?.id,
        },
      }).catch((error) => console.error("[landing-api] Push failed", error));
    }

    sendJson(response, 201, { ok: true, id: lead?.id, created_at: lead?.created_at });
  } catch (error) {
    console.error("[landing-api] Request failed", error);
    sendJson(response, 500, { ok: false, error: "request_failed" });
  }
});

server.requestTimeout = 15_000;
server.headersTimeout = 16_000;
server.listen(port, host, () => {
  console.log(`[landing-api] Listening on http://${host}:${port}`);
});
