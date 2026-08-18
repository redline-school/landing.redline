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
  assert.match(html, /<title>REDLINE — репетиторы для школьников 1–9 классов<\/title>/i);
  assert.match(html, /Индивидуальные занятия с репетитором/);
  assert.match(html, /1–9 классов/);
  assert.doesNotMatch(html, /Найдём пробелы/);
  assert.match(html, /от 1 200 ₽/i);
  assert.match(html, /tutor-1-v4\.jpg/);
  assert.doesNotMatch(html, /parent-review-video\.mp4/);
  assert.doesNotMatch(html, /\/_next\/image\?url=/);
  assert.match(html, /первого измеримого результата/i);
  assert.doesNotMatch(html, /С 1 сентября|31 августа/i);
  assert.doesNotMatch(html, /Your site is taking shape|Building your site/);
  assert.doesNotMatch(html, /href="#lead-form"/);
  assert.doesNotMatch(html, /изменены для конфиденциальности|типовые отзывы|не вымышленные отзывы/i);
  assert.match(html, /redline-favicon-20260818\.ico/);
  assert.match(html, /rel="canonical" href="https:\/\/landing\.redline-tutors\.ru\/"/);
});

test("renders local offer and privacy pages", async () => {
  const worker = await loadWorker();
  const [offerResponse, privacyResponse] = await Promise.all([
    worker.fetch(new Request("http://localhost/offer", { headers: { accept: "text/html" } }), environment, executionContext),
    worker.fetch(new Request("http://localhost/privacy", { headers: { accept: "text/html" } }), environment, executionContext),
  ]);

  assert.equal(offerResponse.status, 200);
  assert.equal(privacyResponse.status, 200);
  assert.match(await offerResponse.text(), /Публичная оферта/i);
  assert.match(await privacyResponse.text(), /Политика обработки персональных данных/i);
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
  assert.match(page, /Будущий преподаватель ребёнка/i);
  assert.match(page, /Олимпиадная подготовка/i);
  assert.match(page, /Подготовка к ОГЭ/i);
  assert.match(page, /review-parents-v3\.webp/);
  assert.match(page, /app-tutor-chat\.webp/);
  assert.match(page, /progress-dashboard\.webp/);
  assert.match(page, /pagePath\("\/offer\/"\)/);
  assert.match(page, /pagePath\("\/privacy\/"\)/);
  assert.match(page, /role="dialog"/);
  assert.match(page, /parent-review-video\.mp4/);
  assert.match(route, /GOOGLE_SCRIPT_URL/);
  assert.match(route, /digits\.length < 10/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /@media \(max-width: 620px\)/);

  for (const path of [
    "../public/hero-community-v3.webp",
    "../public/product-pair-v3.webp",
    "../public/tutor-1-v4.jpg",
    "../public/tutor-2-v4.jpg",
    "../public/tutor-3-v4.jpg",
    "../public/tutor-4-v4.jpg",
    "../public/case-student-1-v4.jpg",
    "../public/case-student-2-v4.jpg",
    "../public/case-student-3-v4.jpg",
    "../public/review-parents-v3.webp",
    "../public/progress-dashboard.webp",
    "../public/app-tutor-chat.webp",
    "../public/og-v2.png",
    "../public/favicon-v2.png",
    "../public/parent-review-video.mp4",
  ]) {
    const asset = new URL(path, import.meta.url);
    await access(asset);
    assert.ok((await stat(asset)).size > 50_000, `${path} should be a real image asset`);
  }

  const favicon = new URL("../public/redline-favicon-20260818.ico", import.meta.url);
  await access(favicon);
  assert.ok((await stat(favicon)).size > 1_000, "favicon.ico should contain multiple icon sizes");
  await access(new URL("../public/robots.txt", import.meta.url));
  await access(new URL("../public/sitemap.xml", import.meta.url));

  await access(new URL("../public/redline-logo-user.png", import.meta.url));
  await access(new URL("../content/offer.txt", import.meta.url));
  await access(new URL("../content/privacy.txt", import.meta.url));
});

