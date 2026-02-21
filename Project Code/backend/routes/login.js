import pool from "../db.js";
import { Router } from "express";

const router = Router();

// POST /api/login
router.post('/', async (req, res) => {
    return res.status(200);
});

export default router;