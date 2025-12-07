import { Router } from "express";
import events from "./events.js";
import users from "./users.js";
import friends from "./friends.js";

const router = Router();

router.use("/events", events);
router.use("/users", users);
router.use("/friends", friends);

export default router;

