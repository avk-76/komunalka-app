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
// ===== Helpers =====
const parsePeriod = (raw) => {
  // приймаємо 'YYYY-MM' або 'YYYY-MM-01' і приводимо до 'YYYY-MM-01'
  if (!raw) return null;
  const m = raw.trim();
  return m.length === 7 ? `${m}-01` : m;
};

// ===== Readings API =====

// GET /api/readings?apartment_id=5&period=2025-08-01
// Повертає всі рядки з period_data для квартири/періоду
app.get("/api/readings", async (req, res) => {
  try {
    const apartmentId = Number(req.query.apartment_id || req.query.apartmentId);
    const period = parsePeriod(req.query.period);

    if (!apartmentId || !period) {
      return res.status(400).json({ error: "apartment_id & period required" });
    }

    const sql = `
      select id, apartment_id, period, item, prev_value, curr_value, tariff_id, updated_at
      from komunalka.period_data
      where apartment_id = $1 and period = $2::date
      order by item;
    `;
    const { rows } = await pool.query(sql, [apartmentId, period]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/readings
// Тіло: { apartment_id, period, item, prev_value, curr_value, tariff_id }
// Апсерт за (apartment_id, period, item)
app.use(express.json()); // щоб читати JSON тіло

app.post("/api/readings", async (req, res) => {
  try {
    const {
      apartment_id,
      period,
      item,
      prev_value = null,
      curr_value = null,
      tariff_id = null,
    } = req.body || {};

    const p = parsePeriod(period);

    if (!apartment_id || !p || !item) {
      return res.status(400).json({ error: "apartment_id, period, item are required" });
    }

    const sql = `
      insert into komunalka.period_data
        (apartment_id, period, item, prev_value, curr_value, tariff_id, updated_at)
      values ($1, $2::date, $3, $4, $5, $6, now())
      on conflict (apartment_id, period, item)
      do update set
        prev_value = excluded.prev_value,
        curr_value = excluded.curr_value,
        tariff_id  = excluded.tariff_id,
        updated_at = now()
      returning *;
    `;
    const { rows } = await pool.query(sql, [
      apartment_id,
      p,
      item,
      prev_value,
      curr_value,
      tariff_id,
    ]);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
