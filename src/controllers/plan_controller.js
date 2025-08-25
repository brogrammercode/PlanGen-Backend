import logger from "../utils/logger.js";
import Plan from "../models/plan.js";

export const getAllPlans = async (req, res) => {
  try {
    const plans = await Plan.find({ active: true });
    logger.info(`Extracted Active Plans: ${plans.length} found`);
    res.status(200).json({
      success: true,
      data: plans,
    });
  } catch (error) {
    logger.error("ERROR_GETTING_ALL_PLANS: ", error);
    res.status(500).json({
      success: false,
      message: "ERROR_GETTING_ALL_PLANS",
      error: error.message,
    });
  }
};

export const getPlanById = async (req, res) => {
  try {
    const plan = await Plan.findOne({ _id: req.params.id, active: true });
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found or inactive",
      });
    }
    res.status(200).json({
      success: true,
      data: plan,
    });
  } catch (error) {
    logger.error("ERROR_GETTING_PLAN_BY_ID", error);
    res.status(500).json({
      success: false,
      message: "ERROR_GETTING_PLAN_BY_ID",
      error: error.message,
    });
  }
};

export const updatePlan = async (req, res) => {
  try {
    const updatedPlan = await Plan.findOneAndUpdate(
      { _id: req.params.id, active: true },
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );
    if (!updatedPlan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found or inactive",
      });
    }
    logger.info(`Plan updated: ${updatedPlan._id}`);
    res.status(200).json({
      success: true,
      data: updatedPlan,
    });
  } catch (error) {
    logger.error("ERROR_UPDATING_PLAN", error);
    res.status(500).json({
      success: false,
      message: "ERROR_UPDATING_PLAN",
      error: error.message,
    });
  }
};

export const deletePlan = async (req, res) => {
  try {
    const deletedPlan = await Plan.findOneAndUpdate(
      { _id: req.params.id, active: true },
      { active: false },
      { new: true }
    );
    if (!deletedPlan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found or already inactive",
      });
    }
    logger.info(`Plan soft deleted (active=false): ${deletedPlan._id}`);
    res.status(200).json({
      success: true,
      message: "Plan soft deleted successfully",
    });
  } catch (error) {
    logger.error("ERROR_DELETING_PLAN", error);
    res.status(500).json({
      success: false,
      message: "ERROR_DELETING_PLAN",
      error: error.message,
    });
  }
};
