import express from "express";
import cors from "cors";
import pool from "./db.js";

const app = express();
app.use(cors());
app.use(express.json());

let visits = 0;

app.get("/hello", (req, res) => {
  visits++;
  res.json({
    message: "Hello from the backend!",
    totalVisits: visits,
  });
});

// Example database endpoint - get all tables
app.get("/db-test", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM sensor_data"
    );
    res.json({
      message: "Database connected successfully!",
      tables: result.rows,
    });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Database connection failed" });
  }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
