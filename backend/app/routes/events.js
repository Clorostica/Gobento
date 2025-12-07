import { Router } from "express";
import { pool } from "../db/pool.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

const validateDate = (dateValue) => {
  if (!dateValue) return null;
  try {
    const dateStr = String(dateValue).trim();
    if (dateStr.length > 30 || dateStr.includes("+033223")) {
      return null;
    }
    const date = new Date(dateStr);
    const year = date.getFullYear();
    if (!isNaN(date.getTime()) && year >= 1900 && year <= 2100) {
      return date.toISOString();
    }
  } catch (e) {
    console.error("Date validation error:", e);
  }
  return null;
};

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

// GET - Obtener eventos de otro usuario (si el usuario actual lo sigue)
router.get("/user/:userId", authenticate, async (req, res) => {
  if (!req.auth) return res.status(401).json({ error: "Auth is required" });

  try {
    const { sub } = req.auth;
    const { userId } = req.params;
    const { status } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    if (sub === userId) {
      return res
        .status(400)
        .json({ error: "Use /events endpoint to get your own events" });
    }

    // Check if user exists
    const userCheck = await pool.query(
      "SELECT id, email FROM users WHERE id = $1",
      [userId]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const targetUser = userCheck.rows[0];

    // Check if user is friend
    const friendCheck = await pool.query(
      `SELECT COUNT(*) as count
       FROM friends
       WHERE user_id = $1 AND friend_user_id = $2`,
      [userId, sub]
    );

    const isFriend = parseInt(friendCheck.rows[0].count) > 0;

    if (!isFriend) {
      return res.status(404).json({ error: "User not friend" });
    }

    // Get user's events
    const result = await pool.query(
      "SELECT * FROM task_list WHERE user_id = $1 ORDER BY id DESC",
      [userId]
    );

    res.json({
      events: result.rows,
      total: result.rows.length,
      user: {
        id: targetUser.id,
        email: targetUser.email,
      },
    });
  } catch (err) {
    console.error("Error loading user's events:", err);
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
    const { id, status, text, title, colorClass, address, dueDate, startTime } =
      req.body;

    console.log("📝 Creating event:", {
      id,
      status,
      title,
      address,
      dueDate,
      startTime,
    });

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

    // Validate date before saving
    const cleanedDueDate = validateDate(dueDate);

    const result = await pool.query(
      "INSERT INTO task_list(id, user_id, status, text, title, color_class, address, due_date, start_time) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *",
      [
        id,
        userId,
        status,
        text || null,
        title || null,
        colorClass,
        address || null,
        cleanedDueDate,
        startTime || null,
      ]
    );

    console.log("✅ Event created:", result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error creating event:", err);
    res.status(500).json({ error: "Database error", message: err.message });
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
    const { status, text, title, address, dueDate, startTime, liked } =
      req.body;

    console.log("📝 Updating event:", {
      eventId,
      status,
      title,
      address,
      dueDate,
      startTime,
    });

    if (!eventId) return res.status(400).json({ error: "eventId is required" });
    if (!status) return res.status(400).json({ error: "status is required" });

    // Get existing event
    const eventList = await pool.query(
      "SELECT * FROM task_list WHERE id = $1",
      [eventId]
    );

    if (eventList.rows.length === 0) {
      return res.status(404).json({ error: "Event not found" });
    }

    if (eventList.rows[0].user_id !== sub) {
      return res.status(403).json({ error: "User does not own event" });
    }

    const existingEvent = eventList.rows[0];

    // Handle liked field
    const likedValue =
      liked !== undefined && liked !== null
        ? Boolean(liked)
        : Boolean(existingEvent.liked);

    // Handle dueDate: use provided value, fallback to existing, or null
    let cleanedDueDate = null;
    if (dueDate !== undefined) {
      cleanedDueDate = validateDate(dueDate);
    } else if (existingEvent.due_date) {
      cleanedDueDate = validateDate(existingEvent.due_date);
    }

    // Handle address: use provided value or fallback to existing
    const finalAddress =
      address !== undefined ? address || null : existingEvent.address;

    // Handle startTime: use provided value or fallback to existing
    const finalStartTime =
      startTime !== undefined ? startTime || null : existingEvent.start_time;

    // Handle text and title
    const finalText = text !== undefined ? text || null : existingEvent.text;
    const finalTitle =
      title !== undefined ? title || null : existingEvent.title;

    console.log("💾 Saving values:", {
      address: finalAddress,
      dueDate: cleanedDueDate,
      startTime: finalStartTime,
    });

    const result = await pool.query(
      "UPDATE task_list SET status = $1, text = $2, title = $3, address = $4, due_date = $5, start_time = $6, liked = $7 WHERE id = $8 RETURNING *",
      [
        status,
        finalText,
        finalTitle,
        finalAddress,
        cleanedDueDate,
        finalStartTime,
        likedValue,
        eventId,
      ]
    );

    console.log("✅ Event updated:", result.rows[0]);
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error updating event:", err);
    console.error("Request body:", req.body);
    res.status(500).json({
      error: "Database error",
      message: err.message,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  }
});

// DELETE - Eliminar evento
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

    if (event.user_id !== sub) {
      return res.status(403).json({ error: "User does not own event" });
    }

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
