import { Router } from "express";
import events from "./events.js";
import users from "./users.js";
import friends from "./friends.js";
import uploadthing from "./uploadthing.js";
import share from "./share.js";

const router = Router();

router.use("/events", events);
router.use("/users", users);
router.use("/friends", friends);
router.use("/api/uploadthing", uploadthing);
router.use("/share", share);

export default router;
