import express from "express";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const app = express();

// Render підставляє PORT; локально можна 10000
const PORT = process.env.PORT || 10000;

// DB pool (Neon)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // для керованих хостингів типу Neon
});

// корінь — проста перевірка живості сервера
app.get("/", (req, res) => {
  res.send("Komunalka API is running ✅");
});

// health — тест з’єднання з БД
app.get("/health", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ status: "ok", time: result.rows[0].now });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
