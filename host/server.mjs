/**
 * Mount Dew public match.
 * Serves the site and the 100-pilot relay on one HTTPS port.
 *
 *   npm install
 *   node host/server.mjs
 *
 * Public address: https://newsfeed.qzz.io:8888
 * Match socket:   wss://newsfeed.qzz.io:8888
 *
 * The port opens immediately. The website compiles after that.
 * Drop a real certificate at host/certs/cert.pem and host/certs/key.pem.
 * If those files are missing, a certificate for newsfeed.qzz.io is created.
 */
import { spawn, spawnSync } from "node:child_process";
import http from "node:http";
import https from "node:https";
import { existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { attachRelay, relayHealth } from "../relay/server.mjs";
import { mergeAppEnv, readAppEnv } from "../scripts/with-app-env.mjs";

const PORT = Number(process.env.PORT || 8888);
const HOST = process.env.HOST || "0.0.0.0";
const APP_PORT = Number(process.env.APP_PORT || 8092);
const PUBLIC_SITE = "https://newsfeed.qzz.io:8888";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const certDir = join(root, "host", "certs");
const certFile = process.env.CERT_FILE || join(certDir, "cert.pem");
const keyFile = process.env.KEY_FILE || join(certDir, "key.pem");

let siteUp = false;
let bootNote = "The website is compiling. Leave the server window open and refresh in a minute.";

function page(title, body) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
body{margin:0;min-height:100vh;display:grid;place-items:center;background:#14120c;color:#f4efe2;font:18px/1.45 Georgia,serif}
main{max-width:36rem;padding:2rem}
h1{font-weight:500;letter-spacing:.04em}
code{font-family:ui-monospace,monospace;color:#d6ff4a}
</style></head><body><main><h1>${title}</h1><p>${body}</p></main></body></html>`;
}

function ensureCert() {
  if (existsSync(certFile) && existsSync(keyFile)) return;
  mkdirSync(certDir, { recursive: true });
  const made = spawnSync(
    "openssl",
    [
      "req", "-x509", "-newkey", "rsa:2048",
      "-keyout", keyFile, "-out", certFile,
      "-days", "825", "-nodes",
      "-subj", "/CN=newsfeed.qzz.io",
      "-addext", "subjectAltName=DNS:newsfeed.qzz.io,DNS:localhost,IP:127.0.0.1",
    ],
    { stdio: "inherit" },
  );
  if (made.status !== 0) {
    console.error("Could not write a certificate. Put cert.pem and key.pem in host/certs.");
    process.exit(1);
  }
  console.log("Wrote a certificate for newsfeed.qzz.io. Replace host/certs with a public certificate when you have one.");
}

function hasDeps() {
  return existsSync(join(root, "node_modules", "vite", "package.json"));
}

function runNode(args) {
  return spawn(process.execPath, args, {
    cwd: root,
    stdio: "inherit",
    env: mergeAppEnv(readAppEnv(root), process.env),
    windowsHide: false,
  });
}

function ensureBuild() {
  const built = join(root, ".vercel", "output", "nitro.json");
  const sources = ["src/routes/index.tsx", "src/styles.css", "src/game/engine.ts", "relay/server.mjs"].map((rel) => join(root, rel));
  const newest = sources.reduce((max, file) => Math.max(max, existsSync(file) ? statSync(file).mtimeMs : 0), 0);
  if (existsSync(built) && statSync(built).mtimeMs >= newest) return Promise.resolve();
  console.log("Compiling the website. The first time often takes one to three minutes.");
  const viteBin = join(root, "node_modules", "vite", "bin", "vite.js");
  return new Promise((resolve, reject) => {
    const child = runNode([viteBin, "build"]);
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code !== 0) {
        reject(new Error("The website compile failed. Scroll up for the compiler error."));
        return;
      }
      const migrate = runNode([join(root, "scripts", "migrate.mjs")]);
      migrate.on("error", reject);
      migrate.on("exit", (mcode) => {
        if (mcode === 0) resolve();
        else reject(new Error("Database migrate failed."));
      });
    });
  });
}

function startSite() {
  const child = runNode([
    join(root, "node_modules", "vite", "bin", "vite.js"),
    "preview",
    "--host",
    "127.0.0.1",
    "--port",
    String(APP_PORT),
    "--strictPort",
  ]);
  const stop = () => {
    if (!child.killed) child.kill("SIGTERM");
  };
  process.on("SIGINT", () => {
    stop();
    process.exit(0);
  });
  process.on("SIGTERM", () => {
    stop();
    process.exit(0);
  });
  child.on("exit", (code) => {
    siteUp = false;
    if (code && code !== 0) {
      bootNote = "The website process stopped. The match relay is still up. Restart node host/server.mjs.";
      console.error("Site process stopped.");
    }
  });
  return child;
}

function waitForSite() {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const tick = () => {
      const req = http.get(`http://127.0.0.1:${APP_PORT}/`, (res) => {
        res.resume();
        resolve();
      });
      req.on("error", () => {
        if (Date.now() - started > 120000) reject(new Error("The website did not answer on port " + APP_PORT + "."));
        else setTimeout(tick, 400);
      });
    };
    tick();
  });
}

function proxy(req, res) {
  const headers = { ...req.headers, host: `127.0.0.1:${APP_PORT}` };
  delete headers.connection;
  const upstream = http.request(
    { hostname: "127.0.0.1", port: APP_PORT, path: req.url, method: req.method, headers },
    (up) => {
      res.writeHead(up.statusCode || 502, up.headers);
      up.pipe(res);
    },
  );
  upstream.on("error", () => {
    if (!res.headersSent) res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(page("Mount Dew", bootNote));
  });
  req.pipe(upstream);
}

async function bootSite() {
  try {
    if (!hasDeps()) {
      bootNote = "Dependencies are not installed. In this folder run <code>npm install</code>, then start <code>node host/server.mjs</code> again. The match port is already open.";
      console.error("Dependencies are not installed.");
      console.error("In this folder run: npm install");
      console.error("Then start again: node host/server.mjs");
      return;
    }
    await ensureBuild();
    startSite();
    await waitForSite();
    siteUp = true;
    console.log("Website is ready.");
    console.log("Open " + PUBLIC_SITE + "  (accept the certificate warning once)");
  } catch (err) {
    bootNote = err instanceof Error ? err.message : "The website did not start.";
    console.error(bootNote);
    console.error("The match relay is still listening. Fix the error above and start the server again.");
  }
}

ensureCert();

const server = https.createServer(
  { key: readFileSync(keyFile), cert: readFileSync(certFile) },
  (req, res) => {
    const path = (req.url || "/").split("?")[0];
    if (path === "/health") {
      res.writeHead(200, { "content-type": "application/json", "access-control-allow-origin": "*" });
      res.end(JSON.stringify({ ...relayHealth(), site: siteUp }));
      return;
    }
    if (!siteUp) {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(page("Mount Dew", bootNote));
      return;
    }
    proxy(req, res);
  },
);
attachRelay(server);
server.on("error", (err) => {
  if (err && err.code === "EADDRINUSE") {
    console.error("Port " + PORT + " is already in use. Close the other Mount Dew window, or run: $env:PORT=8889; node host/server.mjs");
  } else {
    console.error(err);
  }
  process.exit(1);
});
server.listen(PORT, HOST, () => {
  console.log("Mount Dew site  " + PUBLIC_SITE);
  console.log("Listening on    " + HOST + ":" + PORT + "  (100 pilots)");
  console.log("The website comes up after this line. Leave the window open.");
  void bootSite();
});
