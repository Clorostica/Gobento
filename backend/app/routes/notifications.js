import { Router } from "express";
import { pool } from "../db/pool.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

// GET / — fetch notifications for current user (most recent 50)
router.get("/", authenticate, async (req, res) => {
  if (!req.auth) return res.status(401).json({ error: "Auth is required" });

  try {
    const { sub } = req.auth;

    const result = await pool.query(
      `SELECT id, actor_id, actor_name, type, event_id, event_title, read, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [sub]
    );

    const unreadCount = result.rows.filter((n) => !n.read).length;

    res.json({ notifications: result.rows, unreadCount });
  } catch (err) {
    console.error("GET /notifications error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// PUT /read-all — mark all as read
router.put("/read-all", authenticate, async (req, res) => {
  if (!req.auth) return res.status(401).json({ error: "Auth is required" });

  try {
    const { sub } = req.auth;
    await pool.query(
      "UPDATE notifications SET read = 1 WHERE user_id = $1 AND read = 0",
      [sub]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("PUT /notifications/read-all error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// PUT /:id/read — mark one as read
router.put("/:id/read", authenticate, async (req, res) => {
  if (!req.auth) return res.status(401).json({ error: "Auth is required" });

  try {
    const { sub } = req.auth;
    const { id } = req.params;
    await pool.query(
      "UPDATE notifications SET read = 1 WHERE id = $1 AND user_id = $2",
      [id, sub]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("PUT /notifications/:id/read error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

export default router;
