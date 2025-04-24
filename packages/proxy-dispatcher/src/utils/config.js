// filepath: /home/joshua/development/endgame_hackathon/tpn-proxy/packages/proxy-dispatcher/src/utils/config.js
import { z } from "zod";

import logger from "./logger.js";

/**
 * Config singleton class for managing and validating environment variables
 */
class Config {
  static #instance = null;

  /**
   * Get the singleton instance of Config
   * @returns {Config} The Config instance
   */
  static getInstance() {
    if (!Config.#instance) {
      Config.#instance = new Config();
    }
    return Config.#instance;
  }

  #tpnApiUrl;
  #leaseMinutes;
  #socks5MinPort;
  #socks5MaxPort;
  #portAllocationAttempts;
  #socks5BindHost;
  #controlPort;
  #defaultRegions;
  #logLevel;

  /**
   * Private constructor - use Config.getInstance() instead
   */
  constructor() {
    const schema = z
      .object({
        TPN_API_URL: z.string().url().default("http://192.150.253.122:3000"),
        LEASE_MINUTES: z.coerce.number().int().positive().default(30),
        SOCKS5_MIN_PORT: z.coerce
          .number()
          .int()
          .min(1024)
          .max(65535)
          .default(10000),
        SOCKS5_MAX_PORT: z.coerce
          .number()
          .int()
          .min(1024)
          .max(65535)
          .default(15000),
        PORT_ALLOCATION_ATTEMPTS: z.coerce
          .number()
          .int()
          .positive()
          .default(10),
        SOCKS5_BIND_HOST: z.string().ip().default("127.0.0.1"),
        CONTROL_PORT: z.coerce
          .number()
          .int()
          .min(1024)
          .max(65535)
          .default(1081),
        DEFAULT_REGIONS: z
          .string()
          .default("US")
          .transform((val) => val.split(",").map((r) => r.trim())),
        LOG_LEVEL: z.string().default("info"),
      })
      .refine((data) => data.SOCKS5_MIN_PORT < data.SOCKS5_MAX_PORT, {
        message: "SOCKS5_MIN_PORT must be less than SOCKS5_MAX_PORT",
        path: ["SOCKS5_MIN_PORT"],
      });

    try {
      const result = schema.parse(process.env);

      this.#tpnApiUrl = result.TPN_API_URL;
      this.#leaseMinutes = result.LEASE_MINUTES;
      this.#socks5MinPort = result.SOCKS5_MIN_PORT;
      this.#socks5MaxPort = result.SOCKS5_MAX_PORT;
      this.#portAllocationAttempts = result.PORT_ALLOCATION_ATTEMPTS;
      this.#socks5BindHost = result.SOCKS5_BIND_HOST;
      this.#controlPort = result.CONTROL_PORT;
      this.#defaultRegions = result.DEFAULT_REGIONS;
      this.#logLevel = result.LOG_LEVEL;

      logger
        .createContextLogger("Config")
        .info("Configuration validated successfully");
    } catch (error) {
      logger
        .createContextLogger("Config")
        .error("Invalid configuration:", { error: error.format() });
      throw new Error("Configuration validation failed");
    }
  }

  get tpnApiUrl() {
    return this.#tpnApiUrl;
  }

  get leaseMinutes() {
    return this.#leaseMinutes;
  }

  get socks5MinPort() {
    return this.#socks5MinPort;
  }

  get socks5MaxPort() {
    return this.#socks5MaxPort;
  }

  get portAllocationAttempts() {
    return this.#portAllocationAttempts;
  }

  get socks5BindHost() {
    return this.#socks5BindHost;
  }

  get controlPort() {
    return this.#controlPort;
  }

  get defaultRegions() {
    return this.#defaultRegions;
  }

  get logLevel() {
    return this.#logLevel;
  }
}

export default Config;
