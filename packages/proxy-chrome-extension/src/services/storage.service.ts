import { TunnelResponse } from "./proxyDispatcher.service";

/**
 * Types for proxy settings and metadata stored in chrome.storage
 */
export interface ProxyConfig {
  mode: string;
  rules: {
    singleProxy: {
      scheme: string;
      host: string;
      port?: number;
    };
    bypassList: string[];
  };
}

export interface ProxyMetadata {
  serverId: string;
  connection_time: number;
  tunnel: TunnelResponse;
}

export interface ProxyOptions {
  orchestratorEndpoint: string;
  preferredRegion: string;
  bypassRules: string[];
}

export interface ProxyState {
  proxyConfig: ProxyConfig;
  proxyMetadata: ProxyMetadata;
  proxyOptions?: ProxyOptions;
}

/**
 * Retrieve the full proxy state (config + metadata) from storage
 */
export const getProxyState = (): Promise<ProxyState | null> => {
  return new Promise((resolve) => {
    chrome.storage.sync.get(["proxyConfig", "proxyMetadata"], (data) => {
      if (data.proxyConfig && data.proxyMetadata) {
        resolve({
          proxyConfig: data.proxyConfig as ProxyConfig,
          proxyMetadata: data.proxyMetadata as ProxyMetadata,
        });
      } else {
        resolve(null);
      }
    });
  });
};

/**
 * Retrieve only the proxy config from storage
 */
export const getProxyConfig = (): Promise<ProxyConfig | null> => {
  return new Promise((resolve) => {
    chrome.storage.sync.get("proxyConfig", (data) => {
      resolve(data.proxyConfig ? (data.proxyConfig as ProxyConfig) : null);
    });
  });
};

/**
 * Retrieve only the proxy metadata (serverId, connection time, tunnel) from storage
 */
export const getProxyMetadata = (): Promise<ProxyMetadata | null> => {
  return new Promise((resolve) => {
    chrome.storage.sync.get("proxyMetadata", (data) => {
      resolve(
        data.proxyMetadata ? (data.proxyMetadata as ProxyMetadata) : null
      );
    });
  });
};

/**
 * Get proxy options from storage
 */
export const getProxyOptions = (): Promise<ProxyOptions | null> => {
  return new Promise((resolve) => {
    try {
      chrome.storage.sync.get("proxyOptions", (data) => {
        if (chrome.runtime.lastError) {
          console.error("Storage error:", chrome.runtime.lastError);
          resolve(getDefaultProxyOptions());
          return;
        }
        resolve(data.proxyOptions ? (data.proxyOptions as ProxyOptions) : getDefaultProxyOptions());
      });
    } catch (err) {
      console.error("Storage API error:", err);
      resolve(getDefaultProxyOptions());
    }
  });
};

/**
 * Save proxy options to storage
 */
export const saveProxyOptions = (options: ProxyOptions): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.sync.set({ proxyOptions: options }, () => {
        if (chrome.runtime.lastError) {
          console.error("Storage error:", chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
          return;
        }
        resolve();
      });
    } catch (err) {
      console.error("Storage API error:", err);
      reject(err);
    }
  });
};

/**
 * Get default proxy options
 */
export const getDefaultProxyOptions = (): ProxyOptions => {
  return {
    orchestratorEndpoint: "http://122.172.85.219:1081",
    preferredRegion: "",
    bypassRules: ["<local>"],
  };
};

/**
 * Validate a URL string
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
};
