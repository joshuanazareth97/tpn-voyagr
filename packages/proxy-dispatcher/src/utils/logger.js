/**
 * Winston Logger Singleton
 * Provides standardized logging across the application
 */

import winston, { addColors } from "winston";
import "winston-daily-rotate-file";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";

const { format, transports, createLogger } = winston;

// Define log levels with custom colors
const logLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
  },
  colors: {
    error: "red",
    warn: "yellow",
    info: "green",
    http: "magenta",
    debug: "blue",
  },
};

// Apply custom colors to Winston
addColors(logLevels.colors);

// Get log level from environment variable or default to 'info'
const getLogLevel = () => {
  const level = process.env.LOG_LEVEL || "info";
  return logLevels.levels[level] !== undefined ? level : "info";
};

// Custom format for console output (colorized, with timestamp)
const consoleFormat = format.combine(
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  format.colorize({ all: true }),
  format.printf(({ timestamp, level, message, ...meta }) => {
    const metaString = Object.keys(meta).length
      ? `\n${JSON.stringify(meta, null, 2)}`
      : "";
    return `[${timestamp}] ${level}: ${message}${metaString}`;
  })
);

// JSON format for file logging
const fileFormat = format.combine(
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  format.json()
);

// Create console transport
const consoleTransport = new transports.Console({
  format: consoleFormat,
  level: getLogLevel(),
});

// Create a daily-rotate file transport
const fileTransport = new transports.DailyRotateFile({
  filename: "logs/proxy-dispatcher-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxSize: "20m",
  maxFiles: "14d",
  format: fileFormat,
  level: getLogLevel(),
});

// Handle uncaught exceptions
const exceptionHandlers = [
  new transports.File({ filename: "logs/exceptions.log" }),
  new transports.Console({
    format: format.combine(
      format.colorize(),
      format.printf(({ message }) => `EXCEPTION: ${message}`)
    ),
  }),
];

// Create and export the singleton logger instance
const logger = createLogger({
  levels: logLevels.levels,
  transports: [consoleTransport, fileTransport],
  exceptionHandlers,
  exitOnError: false,
});

// Ensure log directory exists before writing to it
const logDir = join(process.cwd(), "logs");

if (!existsSync(logDir)) {
  mkdirSync(logDir, { recursive: true });
}

// Create a simple wrapper to add contextual information to logs
const createContextLogger = (context) => {
  return {
    error: (message, meta = {}) =>
      logger.error(`[${context}] ${message}`, meta),
    warn: (message, meta = {}) => logger.warn(`[${context}] ${message}`, meta),
    info: (message, meta = {}) => logger.info(`[${context}] ${message}`, meta),
    http: (message, meta = {}) => logger.http(`[${context}] ${message}`, meta),
    debug: (message, meta = {}) =>
      logger.debug(`[${context}] ${message}`, meta),
  };
};

// Export both the raw logger and the contextual logger creator
export default {
  logger,
  createContextLogger,
};
