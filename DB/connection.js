const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 60000,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
});

// Test the connection
pool.query("SELECT NOW()", (err) => {
  if (err) {
    console.error("Database connection error:", err.message);
  } else {
    console.log("✓ Database connected successfully");
  }
});

module.exports = pool;
