const express = require("express");
const pool = require("../../DB/connection");
const { formatResponse } = require("../utils/responseFormatter");
const router = express.Router();

/**
 * @route POST /api/uploadResumeDetails
 * @desc Upload resume details for the authenticated user
 * @access Private
 */
router.post("/uploadResumeDetails", async (req, res) => {
  try {
    const {
      name,
      current_job_title,
      current_job_description,
      current_job_company,
    } = req.body;

    if (
      !name ||
      !current_job_title ||
      !current_job_description ||
      !current_job_company
    ) {
      return res
        .status(400)
        .json(
          formatResponse("Bad request", { error: "All fields are required" }),
        );
    }

    const nameParts = name.trim().split(/\s+/);
    if (nameParts.length < 2) {
      return res.status(400).json(
        formatResponse("Bad request", {
          error: "Name should contain both first name and last name",
        }),
      );
    }

    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ");

    const result = await pool.query(
      `INSERT INTO resume.resumes (user_id, first_name, last_name, current_job_title, current_job_description, current_job_company)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        req.userId,
        firstName,
        lastName,
        current_job_title,
        current_job_description,
        current_job_company,
      ],
    );

    const resumeId = result.rows[0].id;

    res
      .status(200)
      .json(formatResponse("Resume uploaded successfully", { resumeId }));
  } catch (error) {
    console.error("Upload error:", error);
    res
      .status(500)
      .json(formatResponse("Error", { error: "Internal server error" }));
  }
});

/**
 * @route GET /api/getResumeById/:id
 * @desc Get resume details by resume ID for the authenticated user
 * @access Private
 */
router.get("/getResumeById/:id", async (req, res) => {
  try {
    const resumeId = req.params.id;

    if (!resumeId || isNaN(resumeId)) {
      return res
        .status(400)
        .json(formatResponse("Bad request", { error: "Invalid resume ID" }));
    }

    const result = await pool.query(
      `SELECT id, first_name, last_name, current_job_title, current_job_description, current_job_company, created_at
       FROM resume.resumes
       WHERE id = $1 AND user_id = $2`,
      [resumeId, req.userId],
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json(formatResponse("Not found", { error: "Resume not found" }));
    }

    const resume = result.rows[0];

    res.status(200).json(
      formatResponse("Resume fetched successfully", {
        id: resume.id,
        name: `${resume.first_name} ${resume.last_name}`,
        current_job_title: resume.current_job_title,
        current_job_description: resume.current_job_description,
        current_job_company: resume.current_job_company,
        created_at: resume.created_at,
      }),
    );
  } catch (error) {
    console.error("Fetch error:", error);
    res
      .status(500)
      .json(formatResponse("Error", { error: "Internal server error" }));
  }
});

/**
 * @route GET /api/getResumeByName/:name
 * @desc Get resume details by name for the authenticated user
 * @access Private
 */
router.get("/getResumeByName/:name", async (req, res) => {
  try {
    const encodedName = req.params.name;

    const decodedName = decodeURIComponent(encodedName).replace(/\+/g, " ");

    const nameParts = decodedName.trim().split(/\s+/);
    if (nameParts.length < 2) {
      return res.status(400).json(
        formatResponse("Bad request", {
          error: "Name must contain both first name and last name",
        }),
      );
    }

    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ");

    const exactMatchResult = await pool.query(
      `SELECT id, first_name, last_name, current_job_title, current_job_description, current_job_company, created_at
       FROM resume.resumes
       WHERE user_id = $1 
         AND LOWER(first_name) = LOWER($2)
         AND LOWER(last_name) = LOWER($3)
       ORDER BY created_at DESC`,
      [req.userId, firstName, lastName],
    );

    if (exactMatchResult.rows.length > 0) {
      const resumes = exactMatchResult.rows.map((resume) => ({
        id: resume.id,
        name: `${resume.first_name} ${resume.last_name}`,
        current_job_title: resume.current_job_title,
        current_job_description: resume.current_job_description,
        current_job_company: resume.current_job_company,
        created_at: resume.created_at,
      }));

      return res
        .status(200)
        .json(formatResponse("Exact matches found", { resumes }));
    }

    const partialMatchResult = await pool.query(
      `SELECT id, first_name, last_name, current_job_title, current_job_description, current_job_company, created_at
       FROM resume.resumes
       WHERE user_id = $1
         AND (LOWER(first_name) = LOWER($2) OR LOWER(first_name) = LOWER($3) OR LOWER(last_name) = LOWER($3) OR LOWER(last_name) = LOWER($2))
       ORDER BY created_at DESC`,
      [req.userId, firstName, lastName],
    );

    const resumes = partialMatchResult.rows.map((resume) => ({
      id: resume.id,
      name: `${resume.first_name} ${resume.last_name}`,
      current_job_title: resume.current_job_title,
      current_job_description: resume.current_job_description,
      current_job_company: resume.current_job_company,
      created_at: resume.created_at,
    }));

    if (resumes.length === 0) {
      return res.status(404).json(
        formatResponse("Not found", {
          error: "No resumes found matching the name",
        }),
      );
    }

    res.status(200).json(formatResponse("Partial matches found", { resumes }));
  } catch (error) {
    console.error("Search error:", error);
    res
      .status(500)
      .json(formatResponse("Error", { error: "Internal server error" }));
  }
});

module.exports = router;
