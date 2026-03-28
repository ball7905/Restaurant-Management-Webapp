import express from "express";
import { login, seedUser } from "../controllers/authController.js";

const router = express.Router();

router.post("/login", login);
router.post("/seed-user", seedUser);
export default router;
