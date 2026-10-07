const Todo = require("../models/Todo");

exports.getTodos = async (req, res) => {
  try {
    const todos = await Todo.find().sort({ createdAt: -1 });
    res.json(todos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addTodo = async (req, res) => {
  try {
    const { text, priority, category, categoryConfidence, dueDate } = req.body;
    const todo = new Todo({
      text,
      priority: priority || "Low",
      category: category || "General",
      categoryConfidence: categoryConfidence || 85,
      dueDate: dueDate || null,
      completed: false,
    });
    await todo.save();
    res.status(201).json(todo);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updateTodo = async (req, res) => {
  try {
    const { id } = req.params;
    const { text, completed, priority, category, dueDate, categoryConfidence } = req.body;

    const updateFields = {};
    if (text !== undefined) updateFields.text = text;
    if (completed !== undefined) updateFields.completed = completed;
    if (priority !== undefined) updateFields.priority = priority;
    if (category !== undefined) updateFields.category = category;
    if (dueDate !== undefined) updateFields.dueDate = dueDate;
    if (categoryConfidence !== undefined) updateFields.categoryConfidence = categoryConfidence;

    const todo = await Todo.findByIdAndUpdate(id, updateFields, { new: true });
    if (!todo) {
      return res.status(404).json({ error: "Todo not found" });
    }
    res.json(todo);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteTodo = async (req, res) => {
  try {
    const { id } = req.params;
    const todo = await Todo.findByIdAndDelete(id);
    if (!todo) {
      return res.status(404).json({ error: "Todo not found" });
    }
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
