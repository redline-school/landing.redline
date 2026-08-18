import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = resolve(import.meta.dirname, "..");
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const environment = {
  ...process.env,
  GITHUB_PAGES: "true",
  NEXT_PUBLIC_BASE_PATH: "/landing.redline",
};
const build = spawnSync(npm, ["run", "build"], {
  cwd: root,
  env: environment,
  shell: process.platform === "win32",
  stdio: "inherit",
});

if (build.error) throw build.error;
if (build.status !== 0) process.exit(build.status ?? 1);

process.env.GITHUB_PAGES = "true";
process.env.NEXT_PUBLIC_BASE_PATH = "/landing.redline";
const workerUrl = pathToFileURL(resolve(root, "dist/server/index.js"));
workerUrl.searchParams.set("pages", Date.now().toString());
const { default: worker } = await import(workerUrl.href);
const response = await worker.fetch(
  new Request("https://redline-school.github.io/landing.redline/", {
    headers: { accept: "text/html" },
  }),
  {
    ASSETS: {
      fetch: async () => new Response("Not found", { status: 404 }),
    },
  },
  {
    waitUntil() {},
    passThroughOnException() {},
  },
);

if (!response.ok) {
  throw new Error(`GitHub Pages render failed with status ${response.status}`);
}

const pagesDirectory = resolve(root, "dist/pages");
await rm(pagesDirectory, { recursive: true, force: true });
await mkdir(pagesDirectory, { recursive: true });
await cp(resolve(root, "dist/client"), pagesDirectory, { recursive: true });
await cp(
  resolve(pagesDirectory, "landing.redline"),
  pagesDirectory,
  { recursive: true },
);
await rm(resolve(pagesDirectory, "landing.redline"), { recursive: true, force: true });
await writeFile(resolve(pagesDirectory, "index.html"), await response.text(), "utf8");
await writeFile(resolve(pagesDirectory, ".nojekyll"), "", "utf8");

for (const route of ["offer", "privacy"]) {
  const routeResponse = await worker.fetch(
    new Request(`https://redline-school.github.io/landing.redline/${route}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
  if (!routeResponse.ok) throw new Error(`GitHub Pages render failed for /${route}/ with status ${routeResponse.status}`);
  const routeDirectory = resolve(pagesDirectory, route);
  await mkdir(routeDirectory, { recursive: true });
  await writeFile(resolve(routeDirectory, "index.html"), await routeResponse.text(), "utf8");
}

console.log("GitHub Pages bundle created in dist/pages");

