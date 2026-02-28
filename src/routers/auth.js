const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../../DB/connection");
const { formatResponse } = require("../utils/responseFormatter");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;

// Signup endpoint
router.post("/signup", async (req, res) => {
  try {
    const { email, name, password } = req.body;

    // Validation
    if (!email || !name || !password) {
      return res.status(400).json(
        formatResponse("Bad request", {
          error: "Please send all required fields: email, name, password",
        }),
      );
    }

    if (password.length < 6) {
      return res.status(400).json(
        formatResponse("Bad request", {
          error: "Password must be at least 6 characters",
        }),
      );
    }

    // Check if user already exists
    const checkUser = await pool.query(
      "SELECT id FROM resume.users WHERE email = $1",
      [email],
    );

    if (checkUser.rows.length > 0) {
      return res.status(400).json(
        formatResponse("Bad request", {
          error: "User already exists with this email",
        }),
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const result = await pool.query(
      "INSERT INTO resume.users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email",
      [name, email, hashedPassword],
    );

    res
      .status(201)
      .json(formatResponse("User created successfully", result.rows[0]));
  } catch (error) {
    console.error("Signup error:", error);
    res
      .status(500)
      .json(formatResponse("Error", { error: "Internal server error" }));
  }
});

// Login endpoint
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json(
        formatResponse("Bad request", {
          error: "Email and password are required",
        }),
      );
    }

    // Find user by email
    const result = await pool.query(
      "SELECT id, name, email, password FROM resume.users WHERE email = $1",
      [email],
    );

    if (result.rows.length === 0) {
      return res.status(401).json(
        formatResponse("Unauthorized", {
          error: "Invalid email or password",
        }),
      );
    }

    const user = result.rows[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json(
        formatResponse("Unauthorized", {
          error: "Invalid email or password",
        }),
      );
    }

    // Generate JWT token (expires in 1 day)
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json(
      formatResponse("Login successful", {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      }),
    );
  } catch (error) {
    console.error("Login error:", error);
    res
      .status(500)
      .json(formatResponse("Error", { error: "Internal server error" }));
  }
});

module.exports = router;
