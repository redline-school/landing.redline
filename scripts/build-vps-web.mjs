import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = resolve(import.meta.dirname, "..");
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const environment = {
  ...process.env,
  GITHUB_PAGES: "false",
  NEXT_PUBLIC_BASE_PATH: "",
};

const build = spawnSync(npm, ["run", "build"], {
  cwd: root,
  env: environment,
  shell: process.platform === "win32",
  stdio: "inherit",
});

if (build.error) throw build.error;
if (build.status !== 0) process.exit(build.status ?? 1);

process.env.GITHUB_PAGES = "false";
process.env.NEXT_PUBLIC_BASE_PATH = "";
const workerUrl = pathToFileURL(resolve(root, "dist/server/index.js"));
workerUrl.searchParams.set("vps", Date.now().toString());
const { default: worker } = await import(workerUrl.href);
const response = await worker.fetch(
  new Request("https://landing.redline-tutors.ru/", {
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
  throw new Error(`VPS render failed with status ${response.status}`);
}

const webDirectory = resolve(root, "dist/vps-web");
await rm(webDirectory, { recursive: true, force: true });
await mkdir(webDirectory, { recursive: true });
await cp(resolve(root, "dist/client"), webDirectory, { recursive: true });
await writeFile(resolve(webDirectory, "index.html"), await response.text(), "utf8");

for (const route of ["offer", "privacy"]) {
  const routeResponse = await worker.fetch(
    new Request(`https://landing.redline-tutors.ru/${route}`, {
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
  if (!routeResponse.ok) throw new Error(`VPS render failed for /${route}/ with status ${routeResponse.status}`);
  const routeDirectory = resolve(webDirectory, route);
  await mkdir(routeDirectory, { recursive: true });
  await writeFile(resolve(routeDirectory, "index.html"), await routeResponse.text(), "utf8");
}

console.log("VPS web bundle created in dist/vps-web");
