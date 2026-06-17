const express = require("express");
const cors = require("cors");

const userRoutes = require("./routes/user.routes");
const assessmentRoutes = require("./routes/assessment.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/assessments", assessmentRoutes);

module.exports = app;