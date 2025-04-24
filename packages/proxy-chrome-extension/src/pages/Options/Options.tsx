import React, { useEffect, useState } from "react";
import { cn } from "../../lib/utils";
import {
  ProxyOptions,
  getProxyOptions,
  saveProxyOptions,
  getDefaultProxyOptions,
  isValidUrl,
} from "../../services/storage.service";

interface Props {
  title: string;
}

const Options: React.FC<Props> = ({ title }: Props) => {
  const [options, setOptions] = useState<ProxyOptions>(
    getDefaultProxyOptions()
  );
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "success" | "error"
  >("idle");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Load saved options on mount and set dark mode
  useEffect(() => {
    // Set dark mode on the options page root
    const optionsRoot = document.getElementById('options-root');
    if (optionsRoot) {
      optionsRoot.classList.add("dark");
    }

    const loadOptions = async () => {
      const savedOptions = await getProxyOptions();
      if (savedOptions) {
        setOptions(savedOptions);
      }
      setLoading(false);
    };
    loadOptions();

    // Clean up
    return () => {
      const optionsRoot = document.getElementById('options-root');
      if (optionsRoot) {
        optionsRoot.classList.remove("dark");
      }
    };
  }, []);

  // Handle form input changes
  const handleEndpointChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOptions({ ...options, orchestratorEndpoint: e.target.value });
  };

  const handlePreferredRegionChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    // Convert to lowercase for consistency
    setOptions({ ...options, preferredRegion: e.target.value.toLowerCase() });
  };

  const handleBypassRulesChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    // Split text by newline and filter out empty lines
    const rules = e.target.value
      .split("\n")
      .map((rule) => rule.trim())
      .filter((rule) => rule.length > 0);

    setOptions({ ...options, bypassRules: rules });
  };

  // Validate form inputs
  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!options.orchestratorEndpoint) {
      newErrors.endpoint = "Endpoint URL is required";
    } else if (!isValidUrl(options.orchestratorEndpoint)) {
      newErrors.endpoint = "Please enter a valid URL";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setSaveStatus("error");
      return;
    }

    setSaveStatus("saving");

    try {
      await saveProxyOptions(options);
      setSaveStatus("success");

      // Reset status and clear field errors after 3 seconds
      setTimeout(() => {
        setSaveStatus("idle");
        setErrors({});
      }, 3000);
    } catch (error) {
      console.error("Error saving options:", error);
      setSaveStatus("error");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900 text-white">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-10">
      <div className="max-w-lg mx-auto p-6 bg-gray-800/50 rounded-lg border border-gray-700 shadow-xl">
        <h2 className="text-xl font-semibold mb-6 text-gray-200">{title}</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Orchestrator endpoint */}
          <div className="space-y-2">
            <label
              htmlFor="endpoint"
              className="block font-medium text-gray-300"
            >
              Proxy Orchestrator Endpoint
            </label>
            <input
              type="text"
              id="endpoint"
              value={options.orchestratorEndpoint}
              onChange={handleEndpointChange}
              className={cn(
                "w-full p-3 bg-gray-700/50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white",
                errors.endpoint ? "border-red-500" : "border-gray-600"
              )}
              placeholder="http://localhost:1081"
            />
            {errors.endpoint && (
              <p className="text-red-400 text-sm">{errors.endpoint}</p>
            )}
            <p className="text-sm text-gray-400">
              The URL of your proxy orchestrator service
            </p>
          </div>

          {/* Preferred Region */}
          <div className="space-y-2">
            <label
              htmlFor="preferredRegion"
              className="block font-medium text-gray-300"
            >
              Preferred Region
            </label>
            <input
              type="text"
              id="preferredRegion"
              value={options.preferredRegion}
              onChange={handlePreferredRegionChange}
              className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              placeholder="us"
            />
            <p className="text-sm text-gray-400">
              Enter a region code (e.g., "us", "fr", "jp") to preselect when the
              extension opens. Leave blank to select manually each time.
            </p>
          </div>

          {/* Bypass rules */}
          <div className="space-y-2">
            <label
              htmlFor="bypassRules"
              className="block font-medium text-gray-300"
            >
              Bypass Rules
            </label>
            <textarea
              id="bypassRules"
              value={options.bypassRules.join("\n")}
              onChange={handleBypassRulesChange}
              className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg h-40 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white font-mono text-sm"
              placeholder="Enter domain patterns to bypass proxy (one per line)"
            />
            <p className="text-sm text-gray-400">
              Enter one domain pattern per line (e.g., "*.example.com",
              "&lt;local&gt;")
            </p>
          </div>

          {/* Save button */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-700">
            <button
              type="submit"
              disabled={saveStatus === "saving"}
              className={cn(
                "px-6 py-3 rounded-lg font-bold text-center relative overflow-hidden transition-all duration-300",
                saveStatus === "saving"
                  ? "bg-gray-600 cursor-not-allowed"
                  : "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
              )}
            >
              <div className="flex items-center justify-center">
                {saveStatus === "saving" ? "Saving..." : "Save Settings"}
              </div>
            </button>

            {/* Status messages */}
            {saveStatus === "success" && (
              <div className="flex items-center text-green-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Settings saved successfully!
              </div>
            )}
            {saveStatus === "error" && !errors.endpoint && (
              <div className="flex items-center text-red-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                Error saving settings. Please try again.
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Footer */}
      <div className="px-4 py-4 mt-8 text-xs text-center text-gray-500 border-t border-gray-800">
        Made with ❤️ for a better internet
      </div>
    </div>
  );
};

export default Options;
