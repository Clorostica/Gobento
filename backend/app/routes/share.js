import { Router } from "express";
import { pool } from "../db/pool.js";

const router = Router();

// GET /:token — public: get shared task + current vote counts
router.get("/:token", async (req, res) => {
  try {
    const { token } = req.params;

    const result = await pool.query(
      `SELECT id, title, text, status, date_option_1, date_option_2, due_date, address, image_url
       FROM task_list WHERE share_token = $1`,
      [token]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: "Link not found" });
    }

    const task = result.rows[0];

    const votes = await pool.query(
      "SELECT selected_option, COUNT(*) as count FROM task_votes WHERE task_id = $1 GROUP BY selected_option",
      [task.id]
    );

    const voteCounts = { 1: 0, 2: 0, total: 0 };
    votes.rows.forEach((v) => {
      voteCounts[v.selected_option] = parseInt(v.count);
      voteCounts.total += parseInt(v.count);
    });

    res.json({ task, votes: voteCounts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// POST /:token/vote — public: submit or change vote
router.post("/:token/vote", async (req, res) => {
  try {
    const { token } = req.params;
    const { selectedOption, voterSession } = req.body;

    if (![1, 2].includes(selectedOption)) {
      return res.status(400).json({ error: "selectedOption must be 1 or 2" });
    }
    if (!voterSession) {
      return res.status(400).json({ error: "voterSession is required" });
    }

    const result = await pool.query(
      "SELECT id FROM task_list WHERE share_token = $1",
      [token]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: "Link not found" });
    }

    const taskId = result.rows[0].id;

    try {
      await pool.query(
        "INSERT INTO task_votes (task_id, selected_option, voter_session) VALUES ($1, $2, $3)",
        [taskId, selectedOption, voterSession]
      );
    } catch (err) {
      if (err.code === "23505") {
        // Already voted — update their choice
        await pool.query(
          "UPDATE task_votes SET selected_option = $1 WHERE task_id = $2 AND voter_session = $3",
          [selectedOption, taskId, voterSession]
        );
      } else {
        throw err;
      }
    }

    const votes = await pool.query(
      "SELECT selected_option, COUNT(*) as count FROM task_votes WHERE task_id = $1 GROUP BY selected_option",
      [taskId]
    );

    const voteCounts = { 1: 0, 2: 0, total: 0 };
    votes.rows.forEach((v) => {
      voteCounts[v.selected_option] = parseInt(v.count);
      voteCounts.total += parseInt(v.count);
    });

    res.json({ success: true, votes: voteCounts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// GET /:token/comments — public: get all comments for the task
router.get("/:token/comments", async (req, res) => {
  try {
    const { token } = req.params;

    const result = await pool.query(
      "SELECT id FROM task_list WHERE share_token = $1",
      [token]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ error: "Link not found" });
    }

    const comments = await pool.query(
      `SELECT id, name, comment, created_at
       FROM task_comments WHERE task_id = $1
       ORDER BY created_at ASC`,
      [result.rows[0].id]
    );

    res.json({ comments: comments.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// POST /:token/comments — public: post a comment
router.post("/:token/comments", async (req, res) => {
  try {
    const { token } = req.params;
    const { voterSession, name, comment } = req.body;

    if (!voterSession) {
      return res.status(400).json({ error: "voterSession is required" });
    }
    if (!comment || !comment.trim()) {
      return res.status(400).json({ error: "comment is required" });
    }
    if (comment.trim().length > 500) {
      return res.status(400).json({ error: "comment too long (max 500 chars)" });
    }

    const result = await pool.query(
      "SELECT id FROM task_list WHERE share_token = $1",
      [token]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ error: "Link not found" });
    }

    const taskId = result.rows[0].id;
    const displayName = (name || "").trim() || "Anonymous";

    await pool.query(
      `INSERT INTO task_comments (task_id, voter_session, name, comment)
       VALUES ($1, $2, $3, $4)`,
      [taskId, voterSession, displayName, comment.trim()]
    );

    const comments = await pool.query(
      `SELECT id, name, comment, created_at
       FROM task_comments WHERE task_id = $1
       ORDER BY created_at ASC`,
      [taskId]
    );

    res.json({ comments: comments.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

export default router;
