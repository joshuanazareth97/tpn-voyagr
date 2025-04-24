# TPN Proxy Dispatcher

A lightweight HTTP control API for leasing WireGuard SOCKS5 tunnels via TPN.
Powered by the Taofu Network.

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   cd packages/proxy-dispatcher
   npm install
   ```

## Configuration

Environment variables (see `.env` in project root if using `dotenv`):

### Control API Configuration
- `CONTROL_PORT` (default: `1081`)  
  Port where the HTTP control API will listen.

### Region Configuration
- `DEFAULT_REGIONS` (default: `US`)  
  Comma-separated list of supported region codes.

### TPN API Configuration
- `TPN_API_URL` (default: `http://192.150.253.122:3000`)  
  URL to the TPN API.
- `LEASE_MINUTES` (default: `30`)  
  Duration in minutes for which a tunnel is leased.

### SOCKS5 Configuration
- `SOCKS5_MIN_PORT` (default: `10000`)  
  Minimum port number for SOCKS5 proxy allocation.
- `SOCKS5_MAX_PORT` (default: `15000`)  
  Maximum port number for SOCKS5 proxy allocation.
- `SOCKS5_BIND_HOST` (default: `127.0.0.1`)  
  Host address where SOCKS5 proxies will be bound.
- `PORT_ALLOCATION_ATTEMPTS` (default: `10`)  
  Number of attempts to find an available port for SOCKS5 proxy.

### Logging Configuration
- `LOG_LEVEL` (default: `info`)  
  Logging verbosity level (e.g., debug, info, warn, error).

## Endpoints

### List available regions

**GET** `/regions`

Returns a list of all available regions.

**Example Request**
```bash
curl -X GET http://localhost:1081/regions
```

**Response**
```json
{
  "regions": ["us", "gb", ...]
}
```

---

### Lease a tunnel

**GET** `/tunnel/:region`

Creates and returns a SOCKS5 proxy tunnel for the specified region.

**Parameters**

| Name     | Type   | In   | Required | Description                            |
| -------- | ------ | ---- | -------- | -------------------------------------- |
| `region` | string | path | Yes      | Region code (from `/regions` endpoint) |

**Example Request**
```bash
curl -X GET http://localhost:1081/tunnel/us
```

**Response**
```json
{
  "region": "us",
  "port": 51324
}
```

**Notes**
- The `:region` in the URL path should be replaced with a valid region code (like "us" or "eu").
- The returned `port` is the local SOCKS5 proxy port for that region.

## Usage

### Prerequisites

1. Install [Go]( https://golang.org/dl/ ) (1.18+)

2. Install wireproxy via Go:
  ```bash
  go install github.com/pufferffish/wireproxy/cmd/wireproxy@latest
  ```
3. For other installation methods, see https://github.com/pufferffish/wireproxy

### Local Development

1. Navigate to the dispatcher directory:
   ```bash
   cd packages/proxy-dispatcher
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file (copy from `.env.example` or define):
   ```dotenv
   CONTROL_PORT=1081
   DEFAULT_REGIONS=us,gb
   TPN_API_URL=http://192.150.253.122:3000
   LEASE_MINUTES=30
   SOCKS5_MIN_PORT=10000
   SOCKS5_MAX_PORT=15000
   SOCKS5_BIND_HOST=127.0.0.1
   PORT_ALLOCATION_ATTEMPTS=10
   LOG_LEVEL=info
   ```
4. Start the service in development mode (with auto-reload):
   ```bash
   npm start
   ```

### Production Deployment

1. Navigate to the dispatcher directory and install production dependencies:
   ```bash
   cd packages/proxy-dispatcher
   npm install --omit=dev
   ```
2. Set environment variables (via `.env` or your environment):
   ```bash
   export NODE_ENV=production
   export CONTROL_PORT=1081
   # (and other variables as needed)
   ```
3. Start the service:
   - Directly:
     ```bash
     node .
     ```
   - Or with PM2 for process management:
     ```bash
     pm2 start src/index.js --name proxy-dispatcher
     ```
4. (Optional) Configure as a systemd service:
   ```ini
   [Unit]
   Description=TPN Proxy Dispatcher
   After=network.target

   [Service]
   WorkingDirectory=/path/to/tpn-proxy/packages/proxy-dispatcher
   ExecStart=/usr/bin/node src/index.js
   Restart=on-failure
   Environment=NODE_ENV=production

   [Install]
   WantedBy=multi-user.target
   ```

### Verification

- Check logs for startup messages (uses Winston; logs in `logs/` folder).
- Test the control API:
  ```bash
  curl http://localhost:1081/regions
  curl http://localhost:1081/tunnel/us
  ```

## Graceful Shutdown

Press `Ctrl+C` or send `SIGTERM` to kill all active wireproxy processes and shut down.
