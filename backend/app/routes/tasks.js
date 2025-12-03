import { Router } from "express";
import { pool } from "../db/pool.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

// GET - Obtener todos los eventos por user_id
router.get("/", authenticate, async (req, res) => {
  if (!req.auth) return res.status(401).json({ error: "Auth is required" });

  try {
    const { sub } = req.auth;
    const { status } = req.query;

    let query = "SELECT * FROM task_list WHERE user_id = $1";
    const params = [sub];

    if (status) {
      query += " AND status = $2";
      params.push(status.toString());
    }

    query += " ORDER BY id DESC";

    const result = await pool.query(query, params);

    res.json({ events: result.rows, total: result.rows.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// POST - Crear nuevo evento

router.post("/", authenticate, async (req, res) => {
  if (!req.auth) {
    return res.status(401).json({ error: "Auth is required" });
  }

  try {
    const { sub } = req.auth;
    const userId = sub;
    const { id, status, text, title, colorClass, address, dueDate, startTime } = req.body;

    if (!userId || !status) {
      return res.status(400).json({
        error: !userId ? "Invalid Token" : "status is required",
      });
    }
    const userCheck = await pool.query("SELECT id FROM users WHERE id = $1", [
      userId,
    ]);
    if (userCheck.rows.length === 0) {
      return res.status(400).json({ error: "User does not exist" });
    }

    const result = await pool.query(
      "INSERT INTO task_list(id, user_id, status, text, title, color_class, address, due_date, start_time) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *",
      [id, userId, status, text || null, title || null, colorClass, address || null, dueDate || null, startTime || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// PUT - Editar evento
router.put("/:eventId", authenticate, async (req, res) => {
  if (!req.auth) {
    return res.status(401).json({ error: "Auth is required" });
  }

  try {
    const { sub } = req.auth;
    const { eventId } = req.params;
    const { status, text, title, address, dueDate, startTime, liked } = req.body;

    if (!eventId) return res.status(400).json({ error: "eventId is required" });
    if (!status) return res.status(400).json({ error: "status is required" });

    const eventList = await pool.query("SELECT * FROM task_list WHERE id = $1", [
      eventId,
    ]);

    if (eventList.rows.length === 0) {
      return res.status(404).json({ error: "Event not found" });
    }

    if (eventList.rows[0].user_id !== sub)
      return res.status(400).json({ error: "User does not own event" });

    // Handle liked: convert to boolean, default to false if not provided
    const likedValue = liked !== undefined && liked !== null 
      ? Boolean(liked) 
      : (eventList.rows[0].liked !== undefined ? eventList.rows[0].liked : false);

    // Validate and clean dueDate - only accept valid ISO date strings or null
    const validateDate = (dateValue) => {
      if (!dateValue) return null;
      try {
        const dateStr = String(dateValue).trim();
        // Check for obviously invalid dates (like the error we saw: +033223-02-22)
        if (dateStr.includes('+033223') || dateStr.match(/[+-]\d{6}/) || dateStr.length > 50) {
          return null;
        }
        const date = new Date(dateStr);
        if (!isNaN(date.getTime()) && date.getFullYear() >= 1900 && date.getFullYear() <= 2100) {
          return date.toISOString();
        }
      } catch (e) {
        // Invalid date
      }
      return null;
    };

    // Use provided dueDate if valid, otherwise try existing value, otherwise null
    let cleanedDueDate = validateDate(dueDate);
    if (!cleanedDueDate && eventList.rows[0].due_date) {
      cleanedDueDate = validateDate(eventList.rows[0].due_date);
    }

    const result = await pool.query(
      "UPDATE task_list SET status = $1, text = $2, title = $3, address = $4, due_date = $5, start_time = $6, liked = $7 WHERE id = $8 RETURNING *",
      [status, text || null, title || null, address || null, cleanedDueDate, startTime || null, likedValue, eventId]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error updating event:", err);
    console.error("Request body:", req.body);
    console.error("Event ID:", eventId);
    res.status(500).json({ 
      error: "Database error",
      message: err.message,
      code: err.code,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack })
    });
  }
});

router.delete("/:id", authenticate, async (req, res) => {
  if (!req.auth) {
    return res.status(401).json({ error: "Auth is required" });
  }

  try {
    const { sub } = req.auth;
    const { id } = req.params;

    const result = await pool.query("SELECT * FROM task_list WHERE id = $1", [
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Event not found" });
    }

    const event = result.rows[0];

    if (event.user_id !== sub)
      res.status(400).json({ error: "User does not own event" });

    await pool.query("DELETE FROM task_list WHERE id = $1", [id]);

    res.json({
      message: "Event deleted successfully",
      deletedEvent: event,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

export default router;

