import express from "express";
import {
  deletePlan,
  getAllPlans,
  getPlanById,
  updatePlan,
} from "../controllers/plan_controller.js";

const router = express.Router();

router.get("/", getAllPlans);
router.get("/:id", getPlanById);
router.put("/:id", updatePlan);
router.get("/:id", deletePlan);

export default router;
