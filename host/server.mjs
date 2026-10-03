/**
 * Mount Dew public match.
 * One process, one game room, on every address below.
 *
 *   npm install
 *   node host/server.mjs
 *
 *   http://mountdew.oops.wtf
 *   https://mountdew.oops.wtf
 *   http://mountdew.oops.wtf:8888
 *   https://mountdew.oops.wtf:8888
 *
 * Ports 80 and 443 are the plain names. Port 8888 is the same room.
 * Each port accepts HTTP and HTTPS. If 80 or 443 is blocked, a warning
 * is printed and 8888 still starts.
 * Drop a real certificate at host/certs/cert.pem and host/certs/key.pem.
 */
import { spawn, spawnSync } from "node:child_process";
import http from "node:http";
import https from "node:https";
import net from "node:net";
import { existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { attachRelay, relayHealth } from "../relay/server.mjs";
import { mergeAppEnv, readAppEnv } from "../scripts/with-app-env.mjs";

const DOMAIN = "mountdew.oops.wtf";
const PORTS = [80, 443, 8888];
const HOST = process.env.HOST || "0.0.0.0";
const APP_PORT = Number(process.env.APP_PORT || 8092);
const PUBLIC_SITE = `https://${DOMAIN}`;
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
    console.log("Same room: " + PUBLIC_SITE + "  https://" + DOMAIN + "  and both on port 8888");
  } catch (err) {
    bootNote = err instanceof Error ? err.message : "The website did not start.";
    console.error(bootNote);
    console.error("The match relay is still listening. Fix the error above and start the server again.");
  }
}

function onRequest(req, res) {
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
}

function ensureCert() {
  if (existsSync(certFile) && existsSync(keyFile)) return true;
  mkdirSync(certDir, { recursive: true });
  const made = spawnSync(
    "openssl",
    [
      "req", "-x509", "-newkey", "rsa:2048",
      "-keyout", keyFile, "-out", certFile,
      "-days", "825", "-nodes",
      "-subj", "/CN=" + DOMAIN,
      "-addext", "subjectAltName=DNS:" + DOMAIN + ",DNS:localhost,IP:127.0.0.1",
    ],
    { stdio: "inherit" },
  );
  if (made.status !== 0) {
    console.warn("Warning: no certificate, so HTTPS is off. HTTP still starts. Put cert.pem and key.pem in host/certs.");
    return false;
  }
  console.log("Wrote a certificate for " + DOMAIN + ". Replace host/certs when you have a public one.");
  return true;
}

function reason(err) {
  if (err && err.code === "EADDRINUSE") return "already in use";
  if (err && (err.code === "EACCES" || err.code === "EPERM")) return "blocked";
  return err && err.message ? err.message : "unavailable";
}

function openPort(port, secure) {
  const httpServer = http.createServer(onRequest);
  attachRelay(httpServer);
  httpServer.on("error", () => {});
  httpServer.on("clientError", (_err, socket) => socket.destroy());
  let httpsServer = null;
  if (secure) {
    httpsServer = https.createServer({ key: readFileSync(keyFile), cert: readFileSync(certFile) }, onRequest);
    attachRelay(httpsServer);
    httpsServer.on("error", () => {});
    httpsServer.on("clientError", (_err, socket) => socket.destroy());
  }
  const tcp = net.createServer((socket) => {
    socket.on("error", () => {});
    socket.once("data", (chunk) => {
      socket.pause();
      socket.unshift(chunk);
      const tlsHello = chunk.length > 0 && chunk[0] === 22;
      if (tlsHello && httpsServer) httpsServer.emit("connection", socket);
      else httpServer.emit("connection", socket);
      process.nextTick(() => socket.resume());
    });
  });
  tcp.on("error", (err) => {
    console.warn("Warning: port " + port + " is " + reason(err) + ". Skipping it. The match stays on any port that did open.");
    tcp.__failed = true;
  });
  tcp.listen(port, HOST, () => {
    tcp.__open = true;
    const mode = httpsServer ? "HTTP and HTTPS" : "HTTP only";
    console.log("Listening on    " + HOST + ":" + port + "  (" + mode + ", one match)");
  });
  return tcp;
}

const secure = ensureCert();
const listeners = PORTS.map((port) => openPort(port, secure));
setTimeout(() => {
  const opened = listeners.filter((tcp) => tcp.__open).map((tcp) => tcp.address().port);
  if (!opened.includes(8888)) {
    console.warn("Warning: port 8888 did not open.");
  }
  if (opened.length === 0) {
    console.error("No match port opened. Free port 8888 and start again.");
    process.exit(1);
  }
  console.log("Same room on   " + opened.map((port) => "http(s)://" + DOMAIN + (port === 80 ? "" : ":" + port)).join("  "));
  console.log("The website comes up after this line. Leave the window open.");
  void bootSite();
}, 400);
