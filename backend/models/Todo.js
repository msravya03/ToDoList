const mongoose = require("mongoose");

const todoSchema = new mongoose.Schema({
  text: { type: String, required: true },
  priority: { type: String, default: "Low" },
  completed: { type: Boolean, default: false },
});

module.exports = mongoose.model("Todo", todoSchema);
