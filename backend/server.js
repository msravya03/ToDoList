// Express backend for To-Do List
const express = require("express");
const path = require("path");
const connectDB = require("./config/db");
const cors = require("cors");
const bodyParser = require("body-parser");
const todoRoutes = require("./routes/todoRoutes");

const app = express();
connectDB();
app.use(cors());
app.use(bodyParser.json());

// Serve static frontend files from project root
app.use(express.static(path.join(__dirname, "../")));

app.use("/api/todos", todoRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Frontend accessible at http://localhost:${PORT}`);
});
