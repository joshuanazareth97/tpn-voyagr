// filepath: /home/joshua/development/endgame_hackathon/tpn-proxy/packages/proxy-chrome-extension/src/pages/Popup/content.tsx
import React, { useState, useEffect } from "react";
import {
  Shield,
  Globe,
  Wifi,
  Database,
  ChevronDown,
  Clock,
  BarChart3,
  Zap,
} from "lucide-react";
import { LocationIcon } from "../../assets/icons";
import { cn } from "../../lib/utils";

const countries = [
  { id: "us", name: "United States", flag: "🇺🇸", latency: "45ms" },
  { id: "jp", name: "Japan", flag: "🇯🇵", latency: "120ms" },
  { id: "uk", name: "United Kingdom", flag: "🇬🇧", latency: "85ms" },
  { id: "de", name: "Germany", flag: "🇩🇪", latency: "90ms" },
  { id: "sg", name: "Singapore", flag: "🇸🇬", latency: "150ms" },
  { id: "ca", name: "Canada", flag: "🇨🇦", latency: "60ms" },
  { id: "au", name: "Australia", flag: "🇦🇺", latency: "180ms" },
];

export default function PopupContent() {
  const [isConnected, setIsConnected] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [connectionTime, setConnectionTime] = useState(0);
  const [dataUsage, setDataUsage] = useState({ up: 0, down: 0 });
  const [connectionSpeed, setConnectionSpeed] = useState({ up: 0, down: 0 });

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isConnected) {
      interval = setInterval(() => {
        setConnectionTime((prev) => prev + 1);
        setDataUsage((prev) => ({
          up: prev.up + Math.random() * 0.05,
          down: prev.down + Math.random() * 0.1,
        }));
        setConnectionSpeed({
          up: 0.5 + Math.random() * 1.5,
          down: 1.5 + Math.random() * 3,
        });
      }, 1000);
    } else {
      setConnectionTime(0);
      setDataUsage({ up: 0, down: 0 });
      setConnectionSpeed({ up: 0, down: 0 });
    }

    return () => clearInterval(interval);
  }, [isConnected]);

  const handleConnect = () => {
    if (!isConnected) {
      // Simulate connection delay
      setTimeout(() => {
        setIsConnected(true);
      }, 1500);
    } else {
      setIsConnected(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const formatData = (data: number) => {
    return data < 1
      ? `${(data * 1000).toFixed(0)} KB`
      : `${data.toFixed(2)} MB`;
  };

  return (
    <div className="w-[360px] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden border border-gray-700 shadow-2xl">
      {/* Header */}
      <div className="relative h-16 px-4 flex items-center justify-between bg-gradient-to-r from-purple-900/40 to-blue-900/40 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <div className="relative">
            {/* <Shield className="w-8 h-8 text-cyan-400" /> */}
            <div className="absolute inset-0 rounded-full" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              Switchback Proxy
            </h1>
            <div className="text-xs text-gray-400">Blockchain-secured VPN</div>
          </div>
        </div>
        <div
          className={cn(
            "w-3 h-3 rounded-full",
            isConnected ? "bg-green-400" : "bg-red-400"
          )}
        />
      </div>

      <div className="p-4 space-y-4">
        <div className="space-y-2">
          <label className="text-xs text-gray-400 flex items-center gap-1">
            {/* <Globe className="w-3 h-3" />  */}
            <LocationIcon />
            SELECT LOCATION
          </label>
          <div className="relative">
            <button
              className="w-full p-3 flex items-center justify-between bg-gray-800/50 border border-gray-700 rounded-lg hover:bg-gray-700/50 transition-colors"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              disabled={isConnected}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{selectedCountry.flag}</span>
                <span>{selectedCountry.name}</span>
              </div>
              {/* <ChevronDown
                className={cn(
                  "w-5 h-5 text-gray-400 transition-transform",
                  isDropdownOpen ? "transform rotate-180" : ""
                )}
              /> */}
            </button>

            {isDropdownOpen && (
              <div className="absolute z-10 mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg overflow-hidden shadow-xl">
                <div className="max-h-60 overflow-y-auto py-1">
                  {countries.map((country) => (
                    <button
                      key={country.id}
                      className="w-full p-2 flex items-center justify-between hover:bg-gray-700/50 transition-colors"
                      onClick={() => {
                        setSelectedCountry(country);
                        setIsDropdownOpen(false);
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{country.flag}</span>
                        <span>{country.name}</span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {country.latency}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Connect button */}
        <button
          className={cn(
            "w-full py-3 px-4 rounded-lg font-bold text-center relative overflow-hidden",
            isConnected
              ? "bg-gradient-to-r from-green-500 to-emerald-600"
              : "bg-gradient-to-r from-cyan-500 to-blue-600"
          )}
          onClick={handleConnect}
          disabled={isConnected === null}
        >
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            style={{
              transform: isConnected ? "translateX(100%)" : "translateX(-100%)",
            }}
          />
          <div className="flex items-center justify-center gap-2">
            {isConnected === null ? (
              <>Connecting...</>
            ) : (
              <>
                {isConnected ? "Disconnect" : "Connect"}
                {/* <Zap
                  className={cn("w-5 h-5", isConnected ? "animate-pulse" : "")}
                /> */}
              </>
            )}
          </div>
        </button>

        {/* Connection stats */}
        <div
          className="space-y-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700"
          style={{ opacity: isConnected ? 1 : 0.5 }}
        >
          <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-1">
            {/* <BarChart3 className="w-4 h-4 text-cyan-400" /> */}
            Connection Statistics
          </h3>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-8 h-8 rounded-full bg-gray-700/50 flex items-center justify-center">
                {/* <Globe className="w-4 h-4 text-cyan-400" /> */}
              </div>
              <div>
                <div className="text-xs text-gray-400">Location</div>
                <div className="font-medium">
                  {selectedCountry.flag} {selectedCountry.name}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <div className="w-8 h-8 rounded-full bg-gray-700/50 flex items-center justify-center">
                {/* <Clock className="w-4 h-4 text-cyan-400" /> */}
              </div>
              <div>
                <div className="text-xs text-gray-400">Connected Time</div>
                <div className="font-medium">{formatTime(connectionTime)}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <div className="w-8 h-8 rounded-full bg-gray-700/50 flex items-center justify-center">
                {/* <Wifi className="w-4 h-4 text-cyan-400" /> */}
              </div>
              <div>
                <div className="text-xs text-gray-400">Speed</div>
                <div className="font-medium">
                  {isConnected ? (
                    <span key={`speed-${Math.random()}`}>
                      {connectionSpeed.down.toFixed(1)} Mbps
                    </span>
                  ) : (
                    "—"
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <div className="w-8 h-8 rounded-full bg-gray-700/50 flex items-center justify-center">
                {/* <Database className="w-4 h-4 text-cyan-400" /> */}
              </div>
              <div>
                <div className="text-xs text-gray-400">Data Usage</div>
                <div className="font-medium">
                  {isConnected ? (
                    <span key={`data-${Math.random()}`}>
                      {formatData(dataUsage.down)}
                    </span>
                  ) : (
                    "—"
                  )}
                </div>
              </div>
            </div>
          </div>

          {isConnected && (
            <div className="pt-2 border-t border-gray-700">
              <div className="flex justify-between items-center text-xs text-gray-400">
                <span>Blockchain Verification</span>
                <span className="flex items-center gap-1">
                  <span className="secure-text">Secure</span>
                  <div className="w-2 h-2 rounded-full bg-green-400 secure-dot" />
                </span>
              </div>
              <div className="w-full h-1 bg-gray-700 rounded-full mt-1 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 progress-bar" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 text-xs text-center text-gray-500 border-t border-gray-800">
        Secured with blockchain technology • v1.0.4
      </div>

      {/* Add CSS for simple animations that were previously handled by Framer Motion */}
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
