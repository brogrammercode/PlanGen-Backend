import path from "path";
import env from "../config/env.js";
import fs from "fs";
import winston from "winston";

const { NODE_ENV, LOG_FILE, LOG_LEVEL, ERROR_LOG_FILE } = env;

// to make the log files if not exists
const logDir = path.dirname(LOG_FILE);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// custom format for logs
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// console format for dev
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: "DD HH:mm:ss" }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += `${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// transports
const transports = [];
if (NODE_ENV === "dev") {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

// file logging
transports.push(
  new winston.transports.File({
    filename: ERROR_LOG_FILE,
    level: "error",
    format: logFormat,
    maxsize: 5242880,
    maxFiles: 5,
  }),
  new winston.transports.File({
    filename: LOG_FILE,
    format: logFormat,
    maxsize: 5242880,
    maxFiles: 5,
  })
);

const logger = winston.createLogger({
  level: LOG_LEVEL,
  format: logFormat,
  transports,
  exitOnError: false,
});

export const initLogger = (req, res, next) => {
  const startTD = Date.now();
  res.on("finish", () => {
    const responseTD = Date.now() - startTD;
    logger.info(`${req.method} ${req.originalUrl}`, {
      status: res.statusCode,
      responseTD: `${responseTD}ms`,
    });
  });
  next();
};

export default logger;
