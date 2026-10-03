/**
 * Mount Dew public match.
 * Serves the site and the 100-pilot relay on one HTTPS port.
 *
 *   node host/server.mjs
 *
 * Public address: https://newsfeed.qzz.io:8888
 * Match socket:   wss://newsfeed.qzz.io:8888
 *
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

const PORT = Number(process.env.PORT || 8888);
const HOST = process.env.HOST || "0.0.0.0";
const APP_PORT = Number(process.env.APP_PORT || 8092);
const PUBLIC_SITE = "https://newsfeed.qzz.io:8888";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const certDir = join(root, "host", "certs");
const certFile = process.env.CERT_FILE || join(certDir, "cert.pem");
const keyFile = process.env.KEY_FILE || join(certDir, "key.pem");

function ensureCert() {
  if (existsSync(certFile) && existsSync(keyFile)) return;
  mkdirSync(certDir, { recursive: true });
  const made = spawnSync(
    "openssl",
    [
      "req",
      "-x509",
      "-newkey",
      "rsa:2048",
      "-keyout",
      keyFile,
      "-out",
      certFile,
      "-days",
      "825",
      "-nodes",
      "-subj",
      "/CN=newsfeed.qzz.io",
      "-addext",
      "subjectAltName=DNS:newsfeed.qzz.io,DNS:localhost,IP:127.0.0.1",
    ],
    { stdio: "inherit" },
  );
  if (made.status !== 0) {
    console.error("Could not write a certificate. Put cert.pem and key.pem in host/certs.");
    process.exit(1);
  }
  console.log("Wrote a certificate for newsfeed.qzz.io. Replace host/certs with a public certificate when you have one.");
}

function ensureBuild() {
  const built = join(root, ".vercel", "output", "nitro.json");
  const sources = ["src/routes/index.tsx", "src/styles.css", "src/game/engine.ts", "relay/server.mjs"].map((rel) => join(root, rel));
  const newest = sources.reduce((max, file) => Math.max(max, existsSync(file) ? statSync(file).mtimeMs : 0), 0);
  if (existsSync(built) && statSync(built).mtimeMs >= newest) return;
  console.log("Building the site first.");
  const result = spawnSync("npm", ["run", "build"], { cwd: root, stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status || 1);
}

function startSite() {
  const child = spawn(
    "npm",
    ["run", "preview", "--", "--host", "127.0.0.1", "--port", String(APP_PORT), "--strictPort"],
    { cwd: root, stdio: "inherit" },
  );
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
    if (code && code !== 0) {
      console.error("Site process stopped.");
      process.exit(code);
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
        if (Date.now() - started > 90000) reject(new Error("The site did not answer."));
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
    if (!res.headersSent) res.writeHead(502, { "content-type": "text/plain" });
    res.end("Mount Dew is still starting.");
  });
  req.pipe(upstream);
}

ensureCert();
ensureBuild();
startSite();
await waitForSite();

const server = https.createServer(
  { key: readFileSync(keyFile), cert: readFileSync(certFile) },
  (req, res) => {
    const path = (req.url || "/").split("?")[0];
    if (path === "/health") {
      res.writeHead(200, { "content-type": "application/json", "access-control-allow-origin": "*" });
      res.end(JSON.stringify(relayHealth()));
      return;
    }
    proxy(req, res);
  },
);
attachRelay(server);
server.listen(PORT, HOST, () => {
  console.log(`Mount Dew site  ${PUBLIC_SITE}`);
  console.log(`Listening on    ${HOST}:${PORT}  (100 pilots)`);
});
