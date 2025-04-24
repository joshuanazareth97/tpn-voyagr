import net from "net";
import { fetchJson } from "../utils/http.js";
import Config from "../utils/config.js";

const config = Config.getInstance();

// Helper function to check if a specific port is available
function checkPortAvailable(port) {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.listen(port, "127.0.0.1", () => {
      srv.close(() => resolve(true));
    });
    srv.on("error", () => resolve(false));
  });
}

// Allocate a free local port within defined range or fallback to OS assignment
async function allocatePort() {
  const MIN_PORT = config.socks5MinPort;
  const MAX_PORT = config.socks5MaxPort;
  const attempts = config.portAllocationAttempts;
  for (let attempt = 0; attempt < attempts; attempt++) {
    const portToTry =
      Math.floor(Math.random() * (MAX_PORT - MIN_PORT + 1)) + MIN_PORT;
    if (await checkPortAvailable(portToTry)) return portToTry;
  }
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, "127.0.0.1", () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
    srv.on("error", reject);
  });
}

// Fetch list of countries from TPN API
export async function fetchCountriesConfig() {
  return fetchJson(`${config.tpnApiUrl}/api/config/countries`);
}

// Lease a new WireGuard tunnel and prepare SOCKS5 binding
export async function leaseVPNConfig(region) {
  const port = await allocatePort();
  const bindAddress = `${config.socks5BindHost}:${port}`;
  const url = `${config.tpnApiUrl}/api/config/new?format=json&geo=${region}&lease_minutes=${config.leaseMinutes}`;
  const json = await fetchJson(url);
  // remove fixed ListenPort to avoid address conflicts
  const peerConfig = json.peer_config.replace(/^\s*ListenPort\s*=.*$/gim, "");

  // including Socks5 binding
  const fullConfig = `${peerConfig}
[Socks5]
BindAddress = ${bindAddress}
`;
  return { fullConfig, port, bindAddress };
}
