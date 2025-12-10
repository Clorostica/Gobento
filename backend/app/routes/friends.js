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

// GET - Check if current user is following another user
router.get("/check/:userId", authenticate, async (req, res) => {
  if (!req.auth) return res.status(401).json({ error: "Auth is required" });

  try {
    const { sub } = req.auth;
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    // Check if current user follows target user (unidirectional)
    const followCheck = await pool.query(
      `SELECT COUNT(*) as count
       FROM friends
       WHERE user_id = $1 AND friend_user_id = $2`,
      [sub, userId]
    );

    const isFollowing = parseInt(followCheck.rows[0].count) > 0;

    res.json({ isFollowing });
  } catch (err) {
    console.error("Error checking follow status:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// GET - Get followers and following for current user
router.get("/followers-following", authenticate, async (req, res) => {
  if (!req.auth) return res.status(401).json({ error: "Auth is required" });

  try {
    const { sub } = req.auth;

    // Get following: users that the current user follows
    // (where user_id = sub in friends table)
    const followingResult = await pool.query(
      `SELECT u.id, u.email, u.username
       FROM friends f
       JOIN users u ON f.friend_user_id = u.id
       WHERE f.user_id = $1`,
      [sub]
    );

    // Get followers: users that follow the current user
    // (where friend_user_id = sub in friends table)
    const followersResult = await pool.query(
      `SELECT u.id, u.email, u.username
       FROM friends f
       JOIN users u ON f.user_id = u.id
       WHERE f.friend_user_id = $1`,
      [sub]
    );

    res.json({
      following: followingResult.rows,
      followers: followersResult.rows,
    });
  } catch (err) {
    console.error("Error loading followers/following:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// GET - Get followers and following for a specific user
router.get("/followers-following/:userId", authenticate, async (req, res) => {
  if (!req.auth) return res.status(401).json({ error: "Auth is required" });

  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    // Get following: users that the target user follows
    // (where user_id = userId in friends table)
    const followingResult = await pool.query(
      `SELECT u.id, u.email, u.username
       FROM friends f
       JOIN users u ON f.friend_user_id = u.id
       WHERE f.user_id = $1`,
      [userId]
    );

    // Get followers: users that follow the target user
    // (where friend_user_id = userId in friends table)
    const followersResult = await pool.query(
      `SELECT u.id, u.email, u.username
       FROM friends f
       JOIN users u ON f.user_id = u.id
       WHERE f.friend_user_id = $1`,
      [userId]
    );

    res.json({
      following: followingResult.rows,
      followers: followersResult.rows,
    });
  } catch (err) {
    console.error("Error loading followers/following:", err);
    res.status(500).json({ error: "Database error" });
  }
});

export default router;
