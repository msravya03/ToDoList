const mongoose = require("mongoose");

const todoSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    priority: { type: String, default: "Low" },
    category: { type: String, default: "General" },
    categoryConfidence: { type: Number, default: 85 },
    dueDate: { type: String, default: null },
    completed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Todo", todoSchema);
