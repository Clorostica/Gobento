import { Router } from "express";
import { pool } from "../db/pool.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

// GET - Obtener usuario específico (usuario actual) - AUTO-CREAR si no existe
router.get("/", authenticate, async (req, res) => {
  if (!req.auth) return res.status(401).json({ error: "Auth is required" });

  try {
    const { sub, email, picture } = req.auth;

    // Intentar obtener el usuario
    let result = await pool.query("SELECT * FROM users WHERE id = $1", [sub]);

    // Si no existe, crearlo automáticamente
    if (!result.rows[0]) {
      console.log("User not found, creating automatically:", { sub, email });

      if (!email) {
        return res
          .status(400)
          .json({ error: "Email is required to create user" });
      }

      result = await pool.query(
        "INSERT INTO users(id, email, avatar_url) VALUES($1, $2, $3) RETURNING *",
        [sub, email, picture || null]
      );

      console.log("User auto-created:", result.rows[0]);
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// POST - crear usuario (mejorado con upsert)
router.post("/", authenticate, async (req, res) => {
  if (!req.auth) return res.status(401).json({ error: "Auth is required" });

  try {
    const { sub, picture } = req.auth;
    const email = req.auth.email || req.body.email;

    console.log("POST /users - Creating user:", {
      sub,
      email,
      picture,
    });

    if (!sub) {
      return res.status(400).json({ error: "Invalid token: missing user ID" });
    }

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const { avatar_url, avatarUrl } = req.body;
    const avatarUrlValue = avatar_url || avatarUrl || picture || null;

    // Usar INSERT ... ON CONFLICT (upsert) para evitar errores si el usuario ya existe
    const result = await pool.query(
      `INSERT INTO users(id, email, avatar_url) 
       VALUES($1, $2, $3) 
       ON CONFLICT (id) 
       DO UPDATE SET 
         email = EXCLUDED.email,
         avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url)
       RETURNING *`,
      [sub, email, avatarUrlValue]
    );

    console.log("POST /users - User created/updated:", result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("POST /users - Error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// PUT - actualizar username del usuario actual
router.put("/", authenticate, async (req, res) => {
  if (!req.auth) return res.status(401).json({ error: "Auth is required" });

  try {
    const { sub } = req.auth;
    if (!sub) return res.status(400).json({ error: "Invalid token" });

    const { username, avatar_url, avatarUrl } = req.body;

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

    // Handle avatar_url (support both camelCase and snake_case)
    const avatarUrlValue = avatar_url || avatarUrl || null;

    // Actualizar el username y avatar_url
    const result = await pool.query(
      "UPDATE users SET username = $1, avatar_url = $2 WHERE id = $3 RETURNING *",
      [trimmedUsername, avatarUrlValue, sub]
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

// GET - Buscar usuarios por username o email, o devolver todos si no hay término de búsqueda
router.get("/search", authenticate, async (req, res) => {
  if (!req.auth) return res.status(401).json({ error: "Auth is required" });

  try {
    const { q, email, username } = req.query;
    const { sub } = req.auth;
    const searchTerm = q || email || username;

    let result;

    if (
      !searchTerm ||
      typeof searchTerm !== "string" ||
      searchTerm.trim() === ""
    ) {
      // If no search term, return all users (excluding current user)
      result = await pool.query(
        `SELECT id, email, username, avatar_url 
         FROM users 
         WHERE id != $1
         ORDER BY username ASC NULLS LAST, email ASC
         LIMIT 100`,
        [sub]
      );
    } else {
      // Search by username or email (case-insensitive, partial match)
      result = await pool.query(
        `SELECT id, email, username, avatar_url 
         FROM users 
         WHERE (username ILIKE $1 OR email ILIKE $1) AND id != $2
         ORDER BY 
           CASE 
             WHEN username ILIKE $3 THEN 1
             WHEN username ILIKE $1 THEN 2
             WHEN email ILIKE $1 THEN 3
             ELSE 4
           END,
           username ASC NULLS LAST
         LIMIT 100`,
        [`%${searchTerm}%`, sub, `${searchTerm}%`]
      );
    }

    res.json({ users: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// DELETE - eliminar usuario actual
router.delete("/", authenticate, async (req, res) => {
  if (!req.auth) return res.status(401).json({ error: "Auth is required" });

  try {
    const { sub } = req.auth;
    if (!sub) return res.status(400).json({ error: "Invalid token" });

    // Verificar que el usuario existe
    const userCheck = await pool.query("SELECT id FROM users WHERE id = $1", [
      sub,
    ]);
    if (!userCheck.rows[0]) {
      return res.status(404).json({ error: "User not found" });
    }

    // Eliminar el usuario
    await pool.query("DELETE FROM users WHERE id = $1", [sub]);

    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// GET - Obtener información básica de un usuario por ID
router.get("/:userId", authenticate, async (req, res) => {
  if (!req.auth) return res.status(401).json({ error: "Auth is required" });

  try {
    const { userId } = req.params;

    const result = await pool.query(
      "SELECT id, email, username, avatar_url FROM users WHERE id = $1",
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
