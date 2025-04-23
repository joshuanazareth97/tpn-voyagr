import { spawn } from "child_process";
import net from "net";
import readline from "readline";
import fs from "fs";
import os from "os";
import path from "path";
import http from "http";
import dotenv from "dotenv";
dotenv.config();

const CONTROL_PORT = parseInt(process.env.CONTROL_PORT ?? "1081", 10);

// TPN API Configuration
const TPN_API_URL = process.env.TPN_API_URL ?? "http://192.150.253.122:3000";
const LEASE_MINUTES = parseInt(process.env.LEASE_MINUTES ?? "30", 10);

// ----- Configuration -----
const DEFAULT_REGIONS = (process.env.DEFAULT_REGIONS ?? "US").split(",");

// In-memory countries list, to be fetched on startup
let COUNTRIES = DEFAULT_REGIONS;

// Fetch countries config from remote API
async function fetchCountriesConfig() {
  return new Promise((resolve, reject) => {
    http
      .get(`${TPN_API_URL}/api/config/countries`, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed);
          } catch (e) {
            reject(e);
          }
        });
      })
      .on("error", reject);
  });
}

// ----- Fetch and build dynamic WireGuard config with Socks5 -----
async function leaseVPNConfig(region) {
  // allocate a free port for SOCKS5
  const port = await allocatePort();
  const bindAddress = `${process.env.SOCKS5_BIND_HOST ?? "127.0.0.1"}:${port}`;
  const url = `${TPN_API_URL}/api/config/new?format=json&geo=${region}&lease_minutes=${LEASE_MINUTES}`;
  return new Promise((resolve, reject) => {
    http
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            // remove fixed ListenPort to avoid address conflicts
            const peerConfig = json.peer_config.replace(
              /^\s*ListenPort\s*=.*$/gim,
              ""
            );
            // build full config including Socks5 binding
            const fullConfig =
              peerConfig +
              `
[Socks5]
BindAddress = ${bindAddress}
`;
            resolve({ fullConfig, port, bindAddress });
          } catch (err) {
            reject(err);
          }
        });
      })
      .on("error", reject);
  });
}

// Map<region, Promise<{ proc, addr, port }>>
const regionTunnels = new Map();

// ----- Lease a WireGuard tunnel via TPN -----
async function createTunnelForRegion(region) {
  console.log(`[${region}] Leasing tunnel…`);
  const { fullConfig, port, bindAddress } = await leaseVPNConfig(region);
  console.log(
    `[${region}] WireGuard config received – starting wireproxy on ${bindAddress}`
  );
  return startWireproxy(fullConfig, region, port, bindAddress);
}

// ----- allocate a free local port -----
async function allocatePort() {
  // Define the port range that matches the firewall settings in deploy.sh
  const MIN_PORT = parseInt(process.env.SOCKS5_MIN_PORT ?? "10000", 10);
  const MAX_PORT = parseInt(process.env.SOCKS5_MAX_PORT ?? "15000", 10);

  // Try to find an available port in our defined range first
  for (
    let attempt = 0;
    attempt < parseInt(process.env.PORT_ALLOCATION_ATTEMPTS ?? "10", 10);
    attempt++
  ) {
    const portToTry =
      Math.floor(Math.random() * (MAX_PORT - MIN_PORT + 1)) + MIN_PORT;
    try {
      const available = await checkPortAvailable(portToTry);
      if (available) return portToTry;
    } catch (err) {
      // Port is not available, continue to next attempt
      continue;
    }
  }

  // Fall back to OS assignment if we couldn't find a port in our range
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, "127.0.0.1", () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
    srv.on("error", reject);
  });
}

// Helper function to check if a specific port is available
function checkPortAvailable(port) {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(port, "127.0.0.1", () => {
      srv.close(() => resolve(true));
    });
    srv.on("error", () => resolve(false));
  });
}

// ----- Spawn wireproxy & parse its chosen port (with timeout) -----
async function startWireproxy(fullConfig, region, port, bindAddress) {
  // write config to temp file
  const tmpDir = os.tmpdir();
  const configFile = path.join(
    tmpDir,
    `wg-config-${region}-${Date.now()}.conf`
  );
  fs.writeFileSync(configFile, fullConfig);
  // spawn wireproxy reading config from temp file
  const proc = spawn("wireproxy", ["--config", configFile], {
    stdio: ["ignore", "pipe", "pipe"],
  });
  proc.on("exit", () => fs.unlink(configFile, () => {}));

  // Log wireproxy output with region prefix
  const stdoutRl = readline.createInterface({ input: proc.stdout });
  stdoutRl.on("line", (line) => console.log(`[${region}] ${line}`));
  const stderrRl = readline.createInterface({ input: proc.stderr });
  stderrRl.on("line", (line) => console.error(`[${region}] ${line}`));

  return { proc, addr: bindAddress, port };
}

// ----- Ensure a single in‑flight tunnel per region -----
async function ensureTunnel(region) {
  let promise = regionTunnels.get(region);
  if (!promise) {
    promise = createTunnelForRegion(region);
    regionTunnels.set(region, promise);
  }
  return promise;
}

// ----- Pre‑initialize default region tunnels -----
async function initDefaultTunnels() {
  await Promise.all(
    DEFAULT_REGIONS.map((r) =>
      ensureTunnel(r).catch((err) => console.error(`[${r}] init error:`, err))
    )
  );
}

// ===== Extracted request handlers =====
async function handleTunnelRequest(req, res, url) {
  const region = url.pathname.split("/")[2];
  if (!COUNTRIES.includes(region)) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Invalid region" }));
    return;
  }
  try {
    const { port } = await ensureTunnel(region);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ region, port }));
  } catch (err) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: err.message }));
  }
}

function handleRegionsRequest(res) {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ regions: COUNTRIES }));
}

function handleCountriesRequest(res) {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ countries: COUNTRIES }));
}

function handleNotFound(res) {
  res.writeHead(404);
  res.end();
}

function startControlServer() {
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (req.method === "GET" && url.pathname.startsWith("/tunnel/")) {
      await handleTunnelRequest(req, res, url);
    } else if (req.method === "GET" && url.pathname === "/regions") {
      handleRegionsRequest(res);
    } else if (req.method === "GET" && url.pathname === "/countries") {
      handleCountriesRequest(res);
    } else {
      handleNotFound(res);
    }
  });

  server.listen(CONTROL_PORT, () => {
    console.log(`Control API listening on 0.0.0.0:${CONTROL_PORT}`);
    console.log(`Available regions: ${DEFAULT_REGIONS.join(", ")}`);
  });
  server.on("error", (err) => console.error("Control server error:", err));

  const shutdown = () => {
    console.log("Shutting down – killing all wireproxy processes...");
    for (const p of regionTunnels.values()) {
      p.then(({ proc }) => proc.kill()).catch(() => {});
    }
    server.close(() => process.exit(0));
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

// ----- Main -----
(async () => {
  console.log("Initializing default region tunnels…");
  // load countries config
  try {
    COUNTRIES = await fetchCountriesConfig();
    console.log(`Countries config loaded: ${COUNTRIES}`);
  } catch (err) {
    console.error("[startup] Failed to fetch countries config:", err);
  }
  await initDefaultTunnels();
  startControlServer();
})();
