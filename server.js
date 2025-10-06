// server.js
import express from "express";
import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pg;
const app = express();
const PORT = process.env.PORT || 10000;

// Пул до Neon (SSL увімкнено)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
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

// (опційно) список квартир — перевіримо, що БД «бачимо»
app.get("/api/apartments", async (_req, res) => {
  try {
    const sql = `
      select id, name
      from komunalka.apartments
      order by id;
    `;
    const { rows } = await pool.query(sql);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
