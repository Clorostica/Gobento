import { Router } from "express";
import { pool } from "../db/pool.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

// POST - Agregar amigo
router.post("/:friendId", authenticate, async (req, res) => {
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
    const userCheck = await pool.query("SELECT id FROM users WHERE id = $1", [
      friendId,
    ]);
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
