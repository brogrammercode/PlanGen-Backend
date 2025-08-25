import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

export default {
  // SYSTEM
  NODE_ENV: process.env.NODE_ENV,
  PORT: parseInt(process.env.PORT, 10) || 3000,

  // DATABASE
  MONGO_URI: process.env.MONGO_URI,

  // LOGGER
  LOG_LEVEL: process.env.LOG_LEVEL,
  LOG_FILE: process.env.LOG_FILE,
  ERROR_LOG_FILE: process.env.ERROR_LOG_FILE,
};
