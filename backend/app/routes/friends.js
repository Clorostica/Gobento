import { Router } from "express";
import { pool } from "../db/pool.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

// GET - Obtener followers y following del usuario
router.get("/followers-following", authenticate, async (req, res) => {
  if (!req.auth) return res.status(401).json({ error: "Auth is required" });

  try {
    const { sub } = req.auth;

    // Get followers: users who follow the current user (where current user is user_id_2)
    const followersResult = await pool.query(
      `SELECT DISTINCT u.id, u.email, u.name, u.picture
       FROM friendships f
       JOIN users u ON u.id = f.user_id_1
       WHERE f.user_id_2 = $1 AND f.status = 'accepted'
       ORDER BY u.email`,
      [sub]
    );

    // Get following: users that the current user follows (where current user is user_id_1)
    const followingResult = await pool.query(
      `SELECT DISTINCT u.id, u.email, u.name, u.picture
       FROM friendships f
       JOIN users u ON u.id = f.user_id_2
       WHERE f.user_id_1 = $1 AND f.status = 'accepted'
       ORDER BY u.email`,
      [sub]
    );

    res.json({
      followers: followersResult.rows,
      following: followingResult.rows,
    });
  } catch (err) {
    console.error("Error loading followers/following:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// GET - Obtener lista de amigos del usuario
router.get("/", authenticate, async (req, res) => {
  if (!req.auth) return res.status(401).json({ error: "Auth is required" });

  try {
    const { sub } = req.auth;

    const result = await pool.query(
      `SELECT u.id, u.email, u.name, u.picture
       FROM friendships f
       JOIN users u ON (
         CASE 
           WHEN f.user_id_1 = $1 THEN u.id = f.user_id_2
           ELSE u.id = f.user_id_1
         END
       )
       WHERE (f.user_id_1 = $1 OR f.user_id_2 = $1) AND f.status = 'accepted'
       ORDER BY u.email`,
      [sub]
    );

    res.json({ friends: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// POST - Agregar amigo (enviar solicitud)
router.post("/", authenticate, async (req, res) => {
  if (!req.auth) return res.status(401).json({ error: "Auth is required" });

  try {
    const { sub } = req.auth;
    const { friendId } = req.body;

    if (!friendId) {
      return res.status(400).json({ error: "friendId is required" });
    }

    if (sub === friendId) {
      return res.status(400).json({ error: "Cannot add yourself as a friend" });
    }

    // Check if user exists
    const userCheck = await pool.query("SELECT id FROM users WHERE id = $1", [friendId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if friendship already exists
    const existingFriendship = await pool.query(
      `SELECT * FROM friendships 
       WHERE (user_id_1 = $1 AND user_id_2 = $2) 
          OR (user_id_1 = $2 AND user_id_2 = $1)`,
      [sub, friendId]
    );

    if (existingFriendship.rows.length > 0) {
      const friendship = existingFriendship.rows[0];
      if (friendship.status === "accepted") {
        return res.status(400).json({ error: "Already friends" });
      }
      // If pending, update to accepted (auto-accept for simplicity)
      await pool.query(
        "UPDATE friendships SET status = 'accepted' WHERE id = $1",
        [friendship.id]
      );
      return res.json({ message: "Friend request accepted" });
    }

    // Create friendship (auto-accept for simplicity)
    const result = await pool.query(
      `INSERT INTO friendships (user_id_1, user_id_2, status) 
       VALUES ($1, $2, 'accepted') 
       RETURNING *`,
      [sub, friendId]
    );

    // Get friend info
    const friendInfo = await pool.query(
      "SELECT id, email, name, picture FROM users WHERE id = $1",
      [friendId]
    );

    res.status(201).json({ friend: friendInfo.rows[0] });
  } catch (err) {
    console.error(err);
    if (err.code === "23505") {
      return res.status(400).json({ error: "Friendship already exists" });
    }
    res.status(500).json({ error: "Database error" });
  }
});

// DELETE - Eliminar amigo
router.delete("/:friendId", authenticate, async (req, res) => {
  if (!req.auth) return res.status(401).json({ error: "Auth is required" });

  try {
    const { sub } = req.auth;
    const { friendId } = req.params;

    const result = await pool.query(
      `DELETE FROM friendships 
       WHERE ((user_id_1 = $1 AND user_id_2 = $2) 
           OR (user_id_1 = $2 AND user_id_2 = $1))`,
      [sub, friendId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Friendship not found" });
    }

    res.json({ message: "Friend removed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

export default router;

