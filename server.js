import { connectMongo } from "./src/config/mongo.js";
import env from "./src/config/env.js";
import app from "./src/app.js";
import logger from "./src/utils/logger.js";

const { PORT } = env;

connectMongo().then(() => {
  app.listen(PORT, () => {
    logger.info(`App running on port ${PORT}`);
  });
});
