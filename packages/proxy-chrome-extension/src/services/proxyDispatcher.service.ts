/**
 * ProxyDispatcher Service
 *
 * This service handles all API communication with the proxy dispatcher backend
 */

import { countryFlags, countryNames } from "../constants/countries";

// Types
export interface TunnelResponse {
  region: string | null;
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

// Base API URL for the proxy dispatcher
const PROXY_DISPATCHER_URL = "http://localhost:1081"; // Default port for the proxy dispatcher

/**
 * Get available server locations (countries/regions)
 */
export const getServerLocations = async (): Promise<ServerLocation[]> => {
  try {
    const response = await fetch(`${PROXY_DISPATCHER_URL}/countries`);
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

    const response = await fetch(`${PROXY_DISPATCHER_URL}/tunnel/${region}`);

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
      region: null,
    };
  }
};
