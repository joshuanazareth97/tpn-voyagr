# Todo

- Hook up chrome proxy API - DONE
  1. Manifest changes
     - Add "proxy" and "storage" to permissions in manifest.json
     - Add host_permissions (e.g. "<all_urls>") for PAC/script 
  2. Use the port received from the `tunnel` API to set the proxy within chrome.
  3. Storage and events
     - On extension startup, read saved config from chrome.storage.sync
     - Listen to chrome.storage.onChanged to reapply settings when user updates
  4. Background service worker logic
     - Build ProxyConfig:
       ```js
       {
         mode: 'fixed_servers',
         rules: {
           singleProxy: { scheme: 'socks5', host, port },
           bypassList: [ ... ]
         }
       }
       ```
     - Call chrome.proxy.settings.set({ value: ProxyConfig, scope: 'regular' })
     - Use chrome.proxy.settings.clear() or set mode: 'system' to restore defaults
  5. Cleanup & lifecycle
     - Listen for chrome.runtime.onSuspend to clear or reset proxy to direct/system
     - Handle onInstalled/onUninstall to restore defaults or prompt user
  6. Testing & validation
     - Test using SOCKS5 running at localhost
     - Verify that traffic routes through the proxy and bypassList works
     - Test updating settings at runtime and on restart

## Data Used / Speed
1. - Create a new service file
  - Path: packages/proxy-chrome-extension/src/services/dataUsage.service.ts
  - Responsibilities:
    – Maintain counters for bytesUp and bytesDown
    – Expose functions to start, stop, reset, and retrieve usage

2. - Implement data‐accumulation in the background context
- In your background script (e.g. index.js):
  - Import and call dataUsageService.init() when a tunnel is opened
  - Hook chrome.sockets.tcp.onReceive to dataUsageService.addDown(bytes)
  - Wrap or proxy chrome.sockets.tcp.send calls to dataUsageService.addUp(bytesSent)
  - On tunnel close, call dataUsageService.stop()

3. Add a message handler for usage requests
- In background’s chrome.runtime.onMessage handler:
  - Listen for { action: "getDataUsage" }
  - Reply with { up: bytesUp, down: bytesDown } from the service

4. Wire PopupContent to the new API
- In PopupContent.tsx:
  – On connect and on an interval (e.g. every second), send { action: "getDataUsage" } to background
  - Update the dataUsage state with the reply
  – Use formatData(dataUsage.down) for display

4. Compute and expose real‐time speed
  - In dataUsage.service.ts: track last read, compute delta/time
  - Expose a getSpeed() method 


- Settings
  - Proxy Server

- Indicators for connection

- Next Steps