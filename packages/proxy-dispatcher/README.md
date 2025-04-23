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

- `DEFAULT_REGIONS` (default: `us`)  
  Comma-separated list of supported region codes.
- `CONTROL_PORT` (default: `1081`)  
  Port where the HTTP control API will listen.

## Endpoints

### List available regions

```http
GET /regions HTTP/1.1
Host: localhost:1081
```

Response:
```json
{ "regions": ["us", "eu", ...] }
```

---

### Lease a tunnel

```http
GET /tunnel/:region HTTP/1.1
Host: localhost:1081
```

- `:region` must be one of the values returned by `/regions`.

Response on success:
```json
{ "region": "us", "port": 51324 }
```

The returned `port` is the local SOCKS5 proxy port for that region.


## Usage Example

```bash
# 1. Lease a tunnel for region "us"
curl http://localhost:1081/tunnel/us
# => {"region":"us","port":51324}

# 2. Configure your SOCKS5 client to use
#    127.0.0.1:51324 for all your traffic.
```

## Startup

```bash
npm start
```

This will pre-warm all `DEFAULT_REGIONS` tunnels, then start the HTTP control API.

## Graceful Shutdown

Press `Ctrl+C` or send `SIGTERM` to kill all active wireproxy processes and shut down.
