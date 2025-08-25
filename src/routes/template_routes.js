import express from "express";
import {
  assignTemplateToPlan,
  createTemplate,
  deleteTemplate,
  getAllTemplates,
  getTemplateById,
  updateTemplate,
} from "../controllers/template_controller.js";

const router = express.Router();

router.get("/", getAllTemplates);
router.get("/:id", getTemplateById);
router.post("/", createTemplate);
router.put("/:id", updateTemplate);
router.delete("/:id", deleteTemplate);
router.post("/:id", assignTemplateToPlan);

export default router;
