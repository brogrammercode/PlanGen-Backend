import mongoose from "mongoose";
import env from "./env.js";
import logger from "../utils/logger.js";

const { MONGO_URI } = env;

export const connectMongo = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    logger.info("CONGO_MONGO");
  } catch (error) {
    logger.error("ERROR_CONNECTING_MONGO", error);
    process.exit(1);
  }
};
