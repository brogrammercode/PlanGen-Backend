import mongoose from "mongoose";

export const taskSchema = mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId(),
    },
    label: String,
    link: String,
    dateAssigned: Date,
    note: String,
    status: {
      type: String,
      enum: [
        "not started yet",
        "pending",
        "in-progress",
        "completed",
        "cancelled",
      ],
      default: "not started yet",
    },
    index: Number,
    completedAt: Date,
  },
  {
    timestamps: true,
  }
);

const planSchema = mongoose.Schema(
  {
    uid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    templateID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Template",
      required: true,
    },
    startTD: {
      type: Date,
      required: true,
    },
    endTD: {
      type: Date,
      required: true,
    },
    tasks: [taskSchema],
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

planSchema.pre("save", function (next) {
  if (this.endTD <= this.startTD) {
    next(new Error("End date must be after start date"));
  } else {
    next();
  }
});

planSchema.index({
  uid: 1,
  startTD: 1,
});

planSchema.index({
  uid: 1,
  "tasks.status": 1,
});

planSchema.methods.getActiveTasks = function () {
  return this.tasks.filter(
    (task) => task.status !== "completed" && task.status !== "cancelled"
  );
};

planSchema.methods.getCompletionPercentage = function () {
  if (this.tasks.length === 0) return 0;
  const completedTasks = this.tasks.filter(
    (t) => t.status === "completed"
  ).length;
  return Math.round((completedTasks / this.tasks.length) * 100);
};

const Plan = mongoose.model("Plan", planSchema);
export default Plan;
