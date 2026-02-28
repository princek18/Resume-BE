require("dotenv").config();

const express = require("express");
const authRouter = require("./routers/auth");
const apiRouter = require("./routers/api");
const authMiddleware = require("./middleware/authMiddleware");

const app = express();
const PORT = process.env.PORT;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Welcome to the Resume Store API!");
});

//Authentication routes
app.use("/auth", authRouter);

//Protected routes
app.use("/api", authMiddleware, apiRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
