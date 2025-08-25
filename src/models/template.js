import mongoose from "mongoose";
import { taskSchema } from "./plan.js";

export const usedBySchema = new mongoose.Schema({
  uid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  dateTime: {
    type: Date,
  },
});

const templateSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
    },
    tasks: [taskSchema],
    days: {
      type: Number,
    },
    usedBy: [usedBySchema],
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

templateSchema.methods.getWithTasks = function () {
  return this.tasks;
};

const Template = mongoose.model("Template", templateSchema);
export default Template;
