import {
  getServerLocations,
  connectToServer,
} from "../../services/proxyDispatcher.service";

// Listen for messages from popup and dispatch to service worker
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "getServerLocations") {
    getServerLocations()
      .then((locations) => sendResponse({ locations }))
      .catch((err) => {
        console.error("Error in getServerLocations message handler:", err);
        sendResponse({ error: err.message });
      });
  } else if (msg.action === "connectToServer") {
    connectToServer(msg.serverId)
      .then((tunnel) => {
        // Apply Chrome proxy settings using tunnel info
        const proxyConfig = {
          mode: "fixed_servers",
          rules: {
            singleProxy: {
              scheme: "socks5",
              host: tunnel.host || "127.0.0.1",
              port: tunnel.port,
            },
            bypassList: [],
          },
        };
        // Save config and metadata to storage for persistence
        const proxyMetadata = {
          serverId: msg.serverId,
          connection_time: new Date().getTime(),
          tunnel,
        };

        chrome.storage.sync.set({ proxyConfig, proxyMetadata }, () => {
          console.log(
            "Saved proxyConfig and proxyMetadata to storage:",
            proxyConfig,
            proxyMetadata
          );
        });
        applyProxyConfig(proxyConfig);
        sendResponse(proxyMetadata);
      })
      .catch((err) => {
        console.error("Error in connectToServer message handler:", err);
        sendResponse({ error: err.message });
      });
  } else if (msg.action === "disconnectFromServer") {
    // Clear active proxy settings
    chrome.proxy.settings.clear({}, () => {
      console.log("Cleared proxy settings on disconnect");
    });
    // Remove saved proxy configuration and metadata
    chrome.storage.sync.remove(["proxyConfig", "proxyMetadata"], () => {
      console.log("Removed proxyConfig and proxyMetadata from storage");
    });
    sendResponse({ success: true });
  }
  return true; // keep channel open for async response
});

// Helper to apply proxy configuration
function applyProxyConfig(proxyConfig) {
  chrome.proxy.settings.set({ value: proxyConfig, scope: "regular" }, () => {
    console.log("Applied proxy config:", proxyConfig);
  });
}

// On extension startup, load and apply saved config
chrome.storage.sync.get("proxyConfig", (data) => {
  if (data.proxyConfig) {
    applyProxyConfig(data.proxyConfig);
  }
});

// Listen for config changes and reapply
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.proxyConfig) {
    applyProxyConfig(changes.proxyConfig.newValue);
  }
});

// Cleanup proxy settings when service worker suspends
chrome.runtime.onSuspend.addListener(() => {
  chrome.proxy.settings.get({});
  chrome.proxy.settings.clear({}, () => {
    console.log("Cleared proxy settings on suspend");
  });
});

// Clear proxy settings on extension install/update
chrome.runtime.onInstalled.addListener((details) => {
  chrome.proxy.settings.clear({}, () => {
    console.log("Cleared proxy settings on install/update");
  });
});
