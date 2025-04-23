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

export interface ProxyState {
  proxyConfig: ProxyConfig;
  proxyMetadata: ProxyMetadata;
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
