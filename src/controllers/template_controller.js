import logger from "../utils/logger.js";
import Template from "../models/template.js";
import Plan from "../models/plan.js";

export const getAllTemplates = async (req, res) => {
  try {
    const templates = await Template.find({ active: true });
    logger.info(`Extracted Active Templates: ${templates.length} found`);
    res.status(200).json({
      success: true,
      data: templates,
    });
  } catch (error) {
    logger.error("ERROR_GETTING_ALL_TEMPLATES: ", error);
    res.status(500).json({
      success: false,
      message: "ERROR_GETTING_ALL_TEMPLATES",
      error: error.message,
    });
  }
};

export const getTemplateById = async (req, res) => {
  try {
    const template = await Template.findOne({
      _id: req.params.id,
      active: true,
    });
    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found or inactive",
      });
    }
    res.status(200).json({
      success: true,
      data: template,
    });
  } catch (error) {
    logger.error("ERROR_GETTING_TEMPLATE_BY_ID", error);
    res.status(500).json({
      success: false,
      message: "ERROR_GETTING_TEMPLATE_BY_ID",
      error: error.message,
    });
  }
};

export const createTemplate = async (req, res) => {
  try {
    const template = new Template(req.body);
    const savedTemplate = await template.save();
    logger.info(`Template added: ${savedTemplate._id}`);
    res.status(201).json({
      success: true,
      data: savedTemplate,
    });
  } catch (error) {
    logger.error("ERROR_CREATING_TEMPLATE", error);
    res.status(500).json({
      success: false,
      message: "ERROR_CREATING_TEMPLATE",
      error: error.message,
    });
  }
};

export const updateTemplate = async (req, res) => {
  try {
    const updatedTemplate = await Template.findOneAndUpdate(
      { _id: req.params.id, active: true },
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );
    if (!updatedTemplate) {
      return res.status(404).json({
        success: false,
        message: "Template not found or inactive",
      });
    }
    logger.info(`Template updated: ${updatedTemplate._id}`);
    res.status(200).json({
      success: true,
      data: updatedTemplate,
    });
  } catch (error) {
    logger.error("ERROR_UPDATING_TEMPLATE", error);
    res.status(500).json({
      success: false,
      message: "ERROR_UPDATING_TEMPLATE",
      error: error.message,
    });
  }
};

export const deleteTemplate = async (req, res) => {
  try {
    const deletedTemplate = await Template.findOneAndUpdate(
      { _id: req.params.id, active: true },
      { active: false },
      { new: true }
    );
    if (!deletedTemplate) {
      return res.status(404).json({
        success: false,
        message: "Template not found or already inactive",
      });
    }
    logger.info(`Template soft deleted (active=false): ${deletedTemplate._id}`);
    res.status(200).json({
      success: true,
      message: "Template soft deleted successfully",
    });
  } catch (error) {
    logger.error("ERROR_DELETING_TEMPLATE", error);
    res.status(500).json({
      success: false,
      message: "ERROR_DELETING_TEMPLATE",
      error: error.message,
    });
  }
};

export const assignTemplateToPlan = async (req, res) => {
  try {
    const { templateID, uid, startTD } = req.body;

    const template = await Template.findOne({ _id: templateID, active: true });
    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found or inactive",
      });
    }

    const startDate = new Date(startTD);

    const totalTasks = template.tasks.length;

    const intervalPerTask = 24 * 60 * 60 * 1000;

    const endDate = new Date(
      startDate.getTime() + intervalPerTask * (totalTasks - 1)
    );

    const duration = endDate - startDate;

    const tasks = template.tasks.map((task, index) => {
      const assignedDate = new Date(
        startDate.getTime() + (duration * index) / (totalTasks - 1)
      );

      return {
        _id: task._id,
        label: task.label,
        link: task.link,
        dateAssigned: assignedDate,
        note: task.note,
        status: task.status,
        index: task.index,
        completedAt: task.completedAt,
      };
    });

    const plan = new Plan({
      uid,
      templateID,
      startTD: startDate,
      endTD: endDate,
      tasks,
      active: true,
    });

    const savedPlan = await plan.save();

    template.usedBy.push({ uid, dateTime: new Date() });
    await template.save();

    logger.info(`Template assigned to plan: PlanID ${savedPlan._id}`);

    res.status(201).json({
      success: true,
      data: savedPlan,
    });
  } catch (error) {
    logger.error("ERROR_ASSIGNING_TEMPLATE_TO_PLAN", error);
    res.status(500).json({
      success: false,
      message: "ERROR_ASSIGNING_TEMPLATE_TO_PLAN",
      error: error.message,
    });
  }
};
