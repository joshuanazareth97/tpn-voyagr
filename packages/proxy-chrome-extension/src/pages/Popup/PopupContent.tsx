import React, { useEffect, useState } from "react";
import {
  ShieldIcon,
  TimeIcon,
  LightningIcon,
  GlobeIcon,
  LocationPin,
} from "../../assets/icons";
import { StatItem } from "../../components/StatItem";
import { cn } from "../../lib/utils";
import { ServerLocation } from "../../services/proxyDispatcher.service";
import { getProxyState, getProxyOptions } from "../../services/storage.service";

enum ConnectionStatus {
  OFFLINE,
  CONNECTING,
  CONNECTED,
}

enum LocationsFetchStatus {
  IDLE,
  LOADING,
  SUCCESS,
  ERROR,
}

export default function PopupContent() {
  // replace boolean flags with enum states
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    ConnectionStatus.OFFLINE
  );
  const [locationsStatus, setLocationsStatus] = useState<LocationsFetchStatus>(
    LocationsFetchStatus.IDLE
  );
  const [error, setError] = useState<string | null>(null);
  const [ipAddress, setIpAddress] = useState<string>("");

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [countries, setCountries] = useState<ServerLocation[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<ServerLocation | null>(
    null
  );
  const [connectionTime, setConnectionTime] = useState(0);
  const [dataUsage, setDataUsage] = useState({ up: 0, down: 0 });
  const [connectionSpeed, setConnectionSpeed] = useState({ up: 0, down: 0 });

  // Load server locations and apply preferred region if set
  useEffect(() => {
    const loadLocationsAndSettings = async () => {
      try {
        // Get user preferences first
        const options = await getProxyOptions();
        const preferredRegion = options?.preferredRegion || "";

        // Then load available locations
        chrome.runtime.sendMessage({ action: "getServerLocations" }, (resp) => {
          if (resp?.locations) {
            setCountries(resp.locations);

            // If we have a preferred region and it's available, select it
            if (preferredRegion) {
              const preferredCountry = resp.locations.find(
                (country: ServerLocation) =>
                  country.id.toLowerCase() === preferredRegion.toLowerCase()
              );

              if (preferredCountry) {
                setSelectedCountry(preferredCountry);
              } else {
                // Fall back to first country if preferred not found
                setSelectedCountry(resp.locations[0] || null);
              }
            } else {
              // No preference, use first country
              setSelectedCountry(resp.locations[0] || null);
            }
          } else {
            setError("Failed to load locations");
            setLocationsStatus(LocationsFetchStatus.ERROR);
            return;
          }
          setLocationsStatus(LocationsFetchStatus.SUCCESS);
        });
      } catch (error) {
        console.error("Error loading settings:", error);
        setError("Failed to load settings");
        setLocationsStatus(LocationsFetchStatus.ERROR);
      }
    };

    loadLocationsAndSettings();
  }, []);

  // Rehydrate proxy config & metadata when popup opens
  useEffect(() => {
    // Wait until countries are loaded to match serverId
    if (locationsStatus === LocationsFetchStatus.SUCCESS) {
      getProxyState().then((state) => {
        if (!state) return;
        const { proxyMetadata } = state;
        if (proxyMetadata?.tunnel?.port) {
          setConnectionStatus(ConnectionStatus.CONNECTED);
          // set selected country based on stored metadata
          const saved = proxyMetadata.serverId;
          const match = countries.find((c) => c.id === saved);
          if (match) setSelectedCountry(match);
          // calculate elapsed connection time
          const { connection_time = 0 } = proxyMetadata;
          const secs = Math.floor((Date.now() - connection_time) / 1000);
          setConnectionTime(secs);
          // could also initialize dataUsage/connectionSpeed if persisted
          fetchIpAddress();
        }
      });
    }
  }, [locationsStatus]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (connectionStatus === ConnectionStatus.CONNECTED) {
      interval = setInterval(() => {
        setConnectionTime((prev) => prev + 1);
      }, 1000);
    } else {
      setConnectionTime(0);
      setDataUsage({ up: 0, down: 0 });
      setConnectionSpeed({ up: 0, down: 0 });
      setIpAddress("");
    }

    return () => clearInterval(interval);
  }, [connectionStatus]);

  const handleConnect = () => {
    if (connectionStatus === ConnectionStatus.OFFLINE && selectedCountry) {
      setConnectionStatus(ConnectionStatus.CONNECTING);
      setError(null);
      chrome.runtime.sendMessage(
        { action: "connectToServer", serverId: selectedCountry.id },
        (resp) => {
          if (resp.tunnel?.port) {
            setConnectionStatus(ConnectionStatus.CONNECTED);
            fetchIpAddress();
          } else {
            setConnectionStatus(ConnectionStatus.OFFLINE);
            setError(resp.error || "Connection failed");
          }
        }
      );
    } else {
      // Send disconnect request to background
      setConnectionStatus(ConnectionStatus.CONNECTING);
      chrome.runtime.sendMessage({ action: "disconnectFromServer" }, (resp) => {
        console.log("RESP", resp);
        if (resp.success) {
          setConnectionStatus(ConnectionStatus.OFFLINE);
          setConnectionTime(0);
          setDataUsage({ up: 0, down: 0 });
          setConnectionSpeed({ up: 0, down: 0 });
        } else {
          setError(resp.error || "Disconnection failed");
        }
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const fetchIpAddress = async () => {
    try {
      const response = await fetch("https://icanhazip.com");
      const text = await response.text();
      setIpAddress(text.trim());
    } catch (e) {
      console.error("Failed to fetch IP address", e);
    }
  };

  return (
    <div className="w-[360px] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-visible border border-gray-700 shadow-2xl">
      {/* Header */}
      <div className="relative h-16 px-4 flex items-center justify-between bg-gradient-to-r from-purple-900/40 to-blue-900/40 border-b border-gray-700">
        <div className="w-100 p-2 flex flex-col items-center justify-center gap-1">
          <h1 className="text-[1.5rem] font-bold text-center bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
            Voyagr VPN
          </h1>
          <div className="text-xs font-bold text-gray-400">
            Powered by Taofu
          </div>
        </div>
        <div
          className={cn(
            "w-3 h-3 rounded-full",
            connectionStatus === ConnectionStatus.CONNECTED
              ? "bg-green-400"
              : "bg-red-400"
          )}
        />
      </div>
      <div className="flex justify-center items-center pt-4">
        <ShieldIcon
          width="120"
          height="120"
          active={connectionStatus === ConnectionStatus.CONNECTED}
        />
      </div>

      <div className="p-4 space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 flex items-center gap-2">
            <GlobeIcon />
            Select Location
          </label>
          <div className="relative">
            <button
              className="w-full p-3 flex items-center justify-between bg-gray-800/50 border border-gray-700 rounded-lg hover:bg-gray-700/50 transition-colors"
              onClick={() => setIsDropdownOpen((open) => !open)}
              disabled={connectionStatus === ConnectionStatus.CONNECTED}
            >
              <div className="flex items-center gap-2">
                <span className="text-md font-bold">
                  {selectedCountry?.id?.toUpperCase()}
                </span>
                <span>{selectedCountry?.name}</span>
              </div>
            </button>
            {locationsStatus === LocationsFetchStatus.LOADING && (
              <div>Loading locations...</div>
            )}
            {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
            {locationsStatus === LocationsFetchStatus.SUCCESS &&
            isDropdownOpen ? (
              <ul className="absolute mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg max-h-60 overflow-auto z-10">
                {countries.map((country) => (
                  <li key={country.id}>
                    <button
                      className="w-full px-4 py-3 text-left flex items-center gap-2 hover:bg-gray-700 transition-colors"
                      onClick={() => {
                        setSelectedCountry(country);
                        setLocationsStatus(LocationsFetchStatus.IDLE);
                      }}
                    >
                      <span className="text-md font-bold">
                        {country.id.toUpperCase()}
                      </span>
                      <span>{country.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>

        <button
          className={cn(
            "w-full py-3 px-4 rounded-lg font-bold text-center relative overflow-hidden",
            connectionStatus === ConnectionStatus.CONNECTED
              ? "bg-gradient-to-r from-green-500 to-emerald-600"
              : "bg-gradient-to-r from-cyan-500 to-blue-600"
          )}
          onClick={handleConnect}
          disabled={
            connectionStatus === ConnectionStatus.CONNECTING ||
            locationsStatus === LocationsFetchStatus.LOADING ||
            !selectedCountry
          }
        >
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            style={{
              transform:
                connectionStatus === ConnectionStatus.CONNECTED
                  ? "translateX(100%)"
                  : "translateX(-100%)",
            }}
          />
          <div className="flex items-center justify-center gap-2">
            {connectionStatus === ConnectionStatus.OFFLINE ? (
              <LightningIcon />
            ) : null}
            {connectionStatus === ConnectionStatus.CONNECTING ? (
              <>Connecting...</>
            ) : (
              <>
                {connectionStatus === ConnectionStatus.CONNECTED
                  ? "Disconnect"
                  : "Connect"}
              </>
            )}
          </div>
        </button>

        {/* Connection stats */}
        <div
          className="space-y-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700"
          style={{
            opacity: connectionStatus === ConnectionStatus.CONNECTED ? 1 : 0.5,
          }}
        >
          <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-1">
            Connection Statistics
          </h3>

          <div className="grid grid-cols-2 gap-x-2 gap-y-4">
            <StatItem
              icon={<LocationPin className="text-blue-400" />}
              label="Location"
              value={selectedCountry?.name}
            />
            <StatItem
              icon={<TimeIcon className="text-blue-400" />}
              label="Connected Time"
              value={formatTime(connectionTime)}
            />
            <StatItem
              icon={<GlobeIcon className="text-blue-400" />}
              label="IP Address"
              value={ipAddress}
            />
          </div>

          {connectionStatus === ConnectionStatus.CONNECTING && (
            <div className="pt-2 border-t border-gray-700">
              <div className="w-full h-1 bg-gray-700 rounded-full mt-1 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 progress-bar" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 text-xs text-center text-gray-500 border-t border-gray-800">
        Made with ❤️ for a better internet
      </div>

      <style>{`
        .progress-bar {
          width: 100%;
          animation: progressAnimation 3s infinite linear;
        }

        .secure-text {
          animation: pulseOpacity 2s infinite;
        }

        .secure-dot {
          animation: pulseDot 2s infinite;
        }

        @keyframes progressAnimation {
          0% {
            width: 0%;
          }
          100% {
            width: 100%;
          }
        }

        @keyframes pulseOpacity {
          0% {
            opacity: 0.5;
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0.5;
          }
        }

        @keyframes pulseDot {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.8;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
