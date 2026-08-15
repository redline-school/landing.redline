import assert from "node:assert/strict";
import { access, readFile, stat } from "node:fs/promises";
import test from "node:test";

async function loadWorker() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${Math.random()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker;
}

const executionContext = {
  waitUntil() {},
  passThroughOnException() {},
};

const environment = {
  ASSETS: {
    fetch: async () => new Response("Not found", { status: 404 }),
  },
};

test("server-renders the REDLINE landing page with the core offer", async () => {
  const worker = await loadWorker();
  const response = await worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    environment,
    executionContext,
  );

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>REDLINE — репетиторы для 4–8 классов<\/title>/i);
  assert.match(html, /Индивидуальные занятия с репетитором/);
  assert.match(html, /Найдём пробелы/);
  assert.match(html, /от 900 ₽/i);
  assert.match(html, /young-tutors-v2\.webp/);
  assert.match(html, /первого измеримого результата/i);
  assert.doesNotMatch(html, /С 1 сентября|31 августа/i);
  assert.match(html, /камера не нужна/i);
  assert.doesNotMatch(html, /Your site is taking shape|Building your site/);
});

test("lead endpoint rejects incomplete requests before contacting the CRM", async () => {
  const worker = await loadWorker();
  const response = await worker.fetch(
    new Request("http://localhost/api/lead", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ parent_name: "", phone: "123" }),
    }),
    environment,
    executionContext,
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { ok: false, error: "invalid_contact" });
});

test("lead endpoint allows the GitHub Pages form origin", async () => {
  const worker = await loadWorker();
  const response = await worker.fetch(
    new Request("http://localhost/api/lead", {
      method: "OPTIONS",
      headers: { origin: "https://redline-school.github.io" },
    }),
    environment,
    executionContext,
  );

  assert.equal(response.status, 204);
  assert.equal(
    response.headers.get("access-control-allow-origin"),
    "https://redline-school.github.io",
  );
});

test("keeps the generated campaign assets and production form wiring", async () => {
  const [page, route, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/lead/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(page, /fetch\(leadEndpoint/);
  assert.match(page, /redline-4-8\.pahanchic52\.chatgpt\.site\/api\/lead/);
  assert.match(page, /type="checkbox" name="consent" required/);
  assert.match(page, /можно отказаться/i);
  assert.match(page, /молодые студенты/i);
  assert.match(page, /Олимпиадная подготовка/i);
  assert.match(page, /app-tutor-chat\.png/);
  assert.match(page, /progress-dashboard\.png/);
  assert.match(route, /GOOGLE_SCRIPT_URL/);
  assert.match(route, /digits\.length < 10/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /@media \(max-width: 620px\)/);

  for (const path of [
    "../public/hero-lesson-v2.webp",
    "../public/hero-tutors-cutout.png",
    "../public/hero-children.webp",
    "../public/product-tutor-student.webp",
    "../public/tutor-avatar-1.webp",
    "../public/tutor-avatar-2.webp",
    "../public/tutor-avatar-3.webp",
    "../public/tutor-avatar-4.webp",
    "../public/case-students-v2.webp",
    "../public/young-tutors-v2.webp",
    "../public/progress-dashboard.png",
    "../public/app-tutor-chat.png",
    "../public/og.png",
  ]) {
    const asset = new URL(path, import.meta.url);
    await access(asset);
    assert.ok((await stat(asset)).size > 50_000, `${path} should be a real image asset`);
  }
});

