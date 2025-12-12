import { Router } from "express";
import { pool } from "../db/pool.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

// GET - Obtener usuario específico (usuario actual)
router.get("/", authenticate, async (req, res) => {
  if (!req.auth) return res.status(401).json({ error: "Auth is required" });

  try {
    const { sub, email } = req.auth;

    const result = await pool.query("SELECT * FROM users WHERE id = $1", [sub]);
    if (!result.rows[0])
      return res.status(400).json({ error: "No user found" });

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// POST - crear usuario
router.post("/", authenticate, async (req, res) => {
  if (!req.auth) return res.status(401).json({ error: "Auth is required" });

  try {
    const { sub, email } = req.auth;
    if (!sub || !email) return res.status(400).json({ error: "Invalid token" });

    const result = await pool.query(
      "INSERT INTO users(id, email) VALUES($1, $2) RETURNING *",
      [sub, email]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    if (err.code === "23505")
      return res.status(400).json({ error: "User already exists" });
    res.status(500).json({ error: "Database error" });
  }
});

// PUT - actualizar username del usuario actual
router.put("/", authenticate, async (req, res) => {
  if (!req.auth) return res.status(401).json({ error: "Auth is required" });

  try {
    const { sub } = req.auth;
    if (!sub) return res.status(400).json({ error: "Invalid token" });

    const { username } = req.body;

    // Validar que el username esté presente
    if (!username || typeof username !== "string") {
      return res.status(400).json({ error: "Username is required" });
    }

    const trimmedUsername = username.trim();

    // Validar longitud
    if (trimmedUsername.length < 3 || trimmedUsername.length > 20) {
      return res.status(400).json({
        error: "Username must be between 3 and 20 characters",
      });
    }

    // Validar caracteres permitidos (solo letras, números y guiones bajos)
    if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
      return res.status(400).json({
        error: "Username can only contain letters, numbers, and underscores",
      });
    }

    // Verificar que el usuario existe
    const userCheck = await pool.query("SELECT id FROM users WHERE id = $1", [
      sub,
    ]);
    if (!userCheck.rows[0]) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verificar unicidad del username (excluyendo el usuario actual)
    const uniquenessCheck = await pool.query(
      "SELECT id FROM users WHERE username = $1 AND id != $2",
      [trimmedUsername, sub]
    );
    if (uniquenessCheck.rows.length > 0) {
      return res.status(400).json({ error: "Username already taken" });
    }

    // Actualizar el username
    const result = await pool.query(
      "UPDATE users SET username = $1 WHERE id = $2 RETURNING *",
      [trimmedUsername, sub]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    // Manejar error de constraint único (por si acaso)
    if (err.code === "23505") {
      return res.status(400).json({ error: "Username already taken" });
    }
    res.status(500).json({ error: "Database error" });
  }
});

// GET - Obtener información básica de un usuario por ID
router.get("/:userId", authenticate, async (req, res) => {
  if (!req.auth) return res.status(401).json({ error: "Auth is required" });

  try {
    const { userId } = req.params;

    // Only select columns that exist in the users table
    const result = await pool.query(
      "SELECT id, email, username FROM users WHERE id = $1",
      [userId]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

export default router;
