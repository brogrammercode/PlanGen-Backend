import express from "express";
import { initLogger } from "./utils/logger.js";
import userRoutes from "./routes/user_routes.js";
import templateRoutes from "./routes/template_routes.js";
import planRoutes from "./routes/plan_routes.js";

const app = express();
app.use(initLogger);
app.use(express.json());
app.use("/api/users", userRoutes);
app.use("/api/templates", templateRoutes);
app.use("/api/plans", planRoutes);

export default app;
