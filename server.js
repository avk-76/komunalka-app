import express from "express";

const app = express();
import pg from "pg";
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.get("/health", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ status: "ok", time: result.rows[0].now });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", message: err.message });
  }
});
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Komunalka API is running ✅");
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Komunalka API connected successfully!" });
});
