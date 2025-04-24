import { spawn } from "child_process";
import readline from "readline";
import fs from "fs";
import os from "os";
import path from "path";
import http from "http";
import {
  fetchCountriesConfig,
  leaseVPNConfig,
} from "./services/tpn.service.js";
import dotenv from "dotenv";
import Config from "./utils/config.js";
import logger from "./utils/logger.js";

dotenv.config();

const config = Config.getInstance();

// ----- Configuration -----
const DEFAULT_REGIONS = config.defaultRegions;

// In-memory countries list, to be fetched on startup
let COUNTRIES = DEFAULT_REGIONS;

// Map<region, Promise<{ proc, addr, port }>>
const regionTunnels = new Map();

// ----- Lease a WireGuard tunnel via TPN -----
async function createTunnelForRegion(region) {
  const log = logger.createContextLogger(region);
  log.info(`Leasing tunnel…`);
  const { fullConfig, port, bindAddress } = await leaseVPNConfig(region);
  log.info(`WireGuard config received – starting wireproxy on ${bindAddress}`);
  return startWireproxy(fullConfig, region, port, bindAddress);
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
  const log = logger.createContextLogger(region);
  const stdoutRl = readline.createInterface({ input: proc.stdout });
  stdoutRl.on("line", (line) => log.info(line));
  const stderrRl = readline.createInterface({ input: proc.stderr });
  stderrRl.on("line", (line) => log.debug(line));

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
  // Create a reusable logger for the initialization process
  const initLog = logger.createContextLogger("Init");

  await Promise.all(
    DEFAULT_REGIONS.map((r) =>
      ensureTunnel(r).catch((err) => {
        initLog.error(`[${r}] init error:`, { error: err.message, region: r });
      })
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

  const serverLog = logger.createContextLogger("Server");

  server.listen(config.controlPort, () => {
    serverLog.info(`Control API listening on 0.0.0.0:${config.controlPort}`);
    serverLog.info(`Available regions: ${DEFAULT_REGIONS.join(", ")}`);
  });
  server.on("error", (err) =>
    serverLog.error("Control server error:", { error: err.message })
  );

  const shutdown = () => {
    serverLog.info("Shutting down – killing all wireproxy processes...");
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
  const startupLog = logger.createContextLogger("Startup");
  startupLog.info("Initializing default region tunnels…");
  // load countries config
  try {
    COUNTRIES = await fetchCountriesConfig();
    startupLog.info(`Countries config loaded: ${COUNTRIES}`);
  } catch (err) {
    startupLog.error("Failed to fetch countries config:", {
      error: err.message,
    });
  }
  await initDefaultTunnels();
  startControlServer();
})();
