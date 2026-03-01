const { Client } = require("pg");

async function createTables() {
  const client = new Client({
    user: "",
    host: "",
    database: "",
    password: "",
    port: 5432, // default PostgreSQL port
  });

  try {
    await client.connect();

    const createSchema = `
      CREATE SCHEMA IF NOT EXISTS resume;
    `;

    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS resume.users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createResumesTable = `
      CREATE TABLE IF NOT EXISTS resume.resumes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES resume.users(id) ON DELETE CASCADE,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        current_job_title VARCHAR(255) NOT NULL,
        current_job_description TEXT NOT NULL,
        current_job_company VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // execute queries
    await client.query(createSchema);
    console.log("Schema created successfully");

    await client.query(createUsersTable);
    console.log("Table resume.users created successfully");

    await client.query(createResumesTable);
    console.log("Table resume.resumes created successfully");
  } catch (err) {
    console.error("Error creating tables:", err);
  } finally {
    await client.end();
  }
}

createTables();
