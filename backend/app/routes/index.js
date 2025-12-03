import { Router } from "express";
import tasks from "./tasks.js";
import users from "./users.js";
import friends from "./friends.js";

const router = Router();

router.use("/events", tasks); // Using tasks route but mapped to /events
router.use("/users", users);
router.use("/friends", friends);

export default router;

