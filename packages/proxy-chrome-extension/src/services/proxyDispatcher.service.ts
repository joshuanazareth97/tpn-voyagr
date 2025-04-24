/**
 * ProxyDispatcher Service
 *
 * This service handles all API communication with the proxy dispatcher backend
 */

import { countryFlags, countryNames } from "../constants/countries";

// Types
export interface TunnelResponse {
  host: string | null;
  port?: number | null;
}

export interface CountryResponse {
  countries: string[];
}

export interface ServerLocation {
  id: string;
  name: string;
  flag: string;
}

// Default API URL for the proxy dispatcher
const DEFAULT_PROXY_DISPATCHER_URL = "http://122.172.85.219:1081";

// Function to get the proxy dispatcher URL from chrome storage
const getProxyDispatcherUrl = async (): Promise<string> => {
  return new Promise((resolve) => {
    try {
      chrome.storage.sync.get("proxyOptions", (data) => {
        // Check for chrome.runtime.lastError which indicates a storage error
        if (chrome.runtime.lastError) {
          console.error("Storage error:", chrome.runtime.lastError);
          resolve(DEFAULT_PROXY_DISPATCHER_URL);
          return;
        }
        
        if (data.proxyOptions?.orchestratorEndpoint) {
          resolve(data.proxyOptions.orchestratorEndpoint);
        } else {
          resolve(DEFAULT_PROXY_DISPATCHER_URL);
        }
      });
    } catch (err) {
      // Extra fallback in case chrome.storage isn't available or throws
      console.error("Storage API error:", err);
      resolve(DEFAULT_PROXY_DISPATCHER_URL);
    }
  });
};

/**
 * Get available server locations (countries/regions)
 */
export const getServerLocations = async (): Promise<ServerLocation[]> => {
  try {
    const baseUrl = await getProxyDispatcherUrl();
    const response = await fetch(`${baseUrl}/countries`);
    if (!response.ok) {
      throw new Error(
        `Error fetching available countries: ${response.statusText}`
      );
    }

    const data = (await response.json()) as CountryResponse;
    const countries = data.countries || [];

    // Convert the country codes to ServerLocation objects with flags and names
    return countries.map((countryCode: string) => ({
      id: countryCode.toLowerCase(),
      name: countryNames[countryCode] || countryCode,
      flag: countryFlags[countryCode] || "🏳️",
    }));
  } catch (error) {
    console.error("Failed to fetch server locations:", error);
    // Return empty array on error
    return [];
  }
};

/**
 * Connect to a proxy server in the specified region
 */
export const connectToServer = async (
  serverId: string
): Promise<TunnelResponse> => {
  try {
    // Convert serverId to uppercase as the API expects uppercase region codes
    const region = serverId.toUpperCase();

    const baseUrl = await getProxyDispatcherUrl();
    const response = await fetch(`${baseUrl}/tunnel/${region}`);

    if (!response.ok) {
      throw new Error(
        `Connection to region ${region} failed: ${response.statusText}`
      );
    }

    return (await response.json()) as TunnelResponse;
  } catch (error) {
    console.error("Failed to connect to server:", error);
    return {
      port: null,
      host: null,
    };
  }
};
