require("dotenv").config();

const express = require("express");
const cors = require("cors");
const authRouter = require("./routers/auth");
const apiRouter = require("./routers/api");
const authMiddleware = require("./middleware/authMiddleware");

const app = express();
const PORT = process.env.PORT;

app.use(express.json());

// configure CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS.split(",");
app.use(
  cors({
    origin: function (origin, callback) {
      if (
        !origin ||
        allowedOrigins.includes("*") ||
        allowedOrigins.includes(origin)
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  }),
);

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
