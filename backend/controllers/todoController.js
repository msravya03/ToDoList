const Todo = require("../models/Todo");

exports.getTodos = async (req, res) => {
  const todos = await Todo.find();
  res.json(todos);
};

exports.addTodo = async (req, res) => {
  const { text, priority } = req.body;
  const todo = new Todo({ text, priority, completed: false });
  await todo.save();
  res.status(201).json(todo);
};

exports.updateTodo = async (req, res) => {
  const { id } = req.params;
  const { completed, priority } = req.body;
  const todo = await Todo.findByIdAndUpdate(
    id,
    { completed, priority },
    { new: true }
  );
  res.json(todo);
};

exports.deleteTodo = async (req, res) => {
  const { id } = req.params;
  await Todo.findByIdAndDelete(id);
  res.status(204).end();
};
