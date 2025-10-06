import express from "express";
import pg from "pg";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();
const { Pool } = pg;

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// Neon / Render
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// --------------------- service routes ---------------------

app.get("/", (req, res) => {
  res.send("Komunalka API is running ✅");
});

app.get("/health", async (req, res) => {
  try {
    const r = await pool.query("select now()");
    res.json({ ok: true, time: r.rows[0].now });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// --------------------- domain helpers ---------------------

/**
 * Беремо тариф для кожного ресурсу з пріоритетом:
 *  1) apartment_id-специфічний, найсвіжіший valid_from <= period
 *  2) глобальний (apartment_id IS NULL), найсвіжіший valid_from <= period
 */
async function fetchTariffs(apartmentId, period, resources) {
  const sql = `
    select t.*
    from tariffs t
    where t.resource = any($3)
      and t.valid_from <= $2
      and (t.apartment_id = $1 or t.apartment_id is null)
    order by 
      (t.apartment_id is null) asc,       -- спочатку НЕ null (тобто конкретна квартира)
      t.valid_from desc
  `;
  const { rows } = await pool.query(sql, [apartmentId, period, resources]);

  // залишаємо по 1 найкращий тариф на ресурс
  const best = {};
  for (const row of rows) {
    if (!best[row.resource]) best[row.resource] = row;
  }
  return best;
}

async function fetchReadings(apartmentId, period) {
  const { rows } = await pool.query(
    `select resource, prev_value, curr_value
     from readings
     where apartment_id = $1 and period = $2`,
    [apartmentId, period]
  );
  const map = {};
  for (const r of rows) map[r.resource] = r;
  return map;
}

async function fetchFixedPayments(apartmentId, period) {
  const { rows } = await pool.query(
    `select name, amount
     from fixed_payments
     where apartment_id = $1 and period = $2`,
    [apartmentId, period]
  );
  return rows; // [{name, amount}]
}

/**
 * Розрахунок по місяцю:
 * - добуваємо показники, тарифи (ел. день/ніч, вода, газ…)
 * - рахуємо споживання та помножуємо на тарифи
 * - додаємо фіксовані на місяць: 
 *   а) із tariffs (is_fixed=true, fixed_amount)
 *   б) з fixed_payments на період
 */
async function calculateMonth(apartmentId, periodISO) {
  const period = new Date(periodISO); // очікуємо 'YYYY-MM-01'
  const RESOURCES_VAR = ["el_day", "el_night", "water", "water2", "gas"];

  const [readings, tariffsMap, fixedRows] = await Promise.all([
    fetchReadings(apartmentId, period),
    fetchTariffs(apartmentId, period, RESOURCES_VAR.concat([
      // одразу беремо й назви можливих фіксованих тарифів:
      "rent", "ap_water", "ap_gas", "hoa", "internet", "heating", "gas_transport"
    ])),
    fetchFixedPayments(apartmentId, period),
  ]);

  const detail = [];
  let total = 0;

  // Змінні (лічильні)
  for (const resName of RESOURCES_VAR) {
    const r = readings[resName];
    const t = tariffsMap[resName];
    if (!r || !t || t.is_fixed) continue;

    const consumption = Number(r.curr_value) - Number(r.prev_value);
    const price = Number(t.unit_price ?? 0);
    const cost = +(consumption * price).toFixed(2);

    detail.push({
      type: "usage",
      resource: resName,
      prev: Number(r.prev_value),
      curr: Number(r.curr_value),
      consumption,
      unit_price: price,
      cost,
    });
    total += cost;
  }

  // Фіксовані із тарифів (рекурентні)
  for (const [resName, t] of Object.entries(tariffsMap)) {
    if (t.is_fixed) {
      const amt = Number(t.fixed_amount ?? 0);
      if (amt > 0) {
        detail.push({
          type: "fixed_tariff",
          name: resName,
          amount: amt,
        });
        total += amt;
      }
    }
  }

  // Фіксовані з таблиці fixed_payments за період (разові/змінні)
  for (const row of fixedRows) {
    const amt = Number(row.amount ?? 0);
    if (amt > 0) {
      detail.push({
        type: "fixed_payment",
        name: row.name,
        amount: amt,
      });
      total += amt;
    }
  }

  return { apartmentId, period: periodISO, total: +total.toFixed(2), detail };
}

// --------------------- API routes ---------------------

// Квартири
app.get("/api/apartments", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "select id, name from apartments order by name"
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// Показники (GET)
app.get("/api/readings", async (req, res) => {
  const { apartment_id, period } = req.query;
  if (!apartment_id || !period)
    return res.status(400).json({ error: "apartment_id & period required" });

  try {
    const { rows } = await pool.query(
      `select resource, prev_value, curr_value
       from readings
       where apartment_id=$1 and period=$2
       order by resource`,
      [apartment_id, period]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// Показники (UPSERT)
app.post("/api/readings", async (req, res) => {
  const { apartment_id, period, resource, prev_value, curr_value } = req.body;
  if (!apartment_id || !period || !resource)
    return res.status(400).json({ error: "apartment_id, period, resource required" });

  try {
    await pool.query(
      `insert into readings (apartment_id, resource, period, prev_value, curr_value)
       values ($1,$2,$3,$4,$5)
       on conflict (apartment_id, resource, period)
       do update set prev_value=excluded.prev_value, curr_value=excluded.curr_value`,
      [apartment_id, resource, period, prev_value ?? 0, curr_value ?? 0]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// Фіксовані платежі (GET)
app.get("/api/fixed", async (req, res) => {
  const { apartment_id, period } = req.query;
  if (!apartment_id || !period)
    return res.status(400).json({ error: "apartment_id & period required" });

  try {
    const { rows } = await pool.query(
      `select name, amount
       from fixed_payments
       where apartment_id=$1 and period=$2
       order by name`,
      [apartment_id, period]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// Фіксовані платежі (UPSERT по name)
app.post("/api/fixed", async (req, res) => {
  const { apartment_id, period, name, amount } = req.body;
  if (!apartment_id || !period || !name)
    return res.status(400).json({ error: "apartment_id, period, name required" });

  try {
    // Для простоти: видалити + вставити (можна й on conflict, якщо зробити унікальний ключ)
    await pool.query(
      `delete from fixed_payments where apartment_id=$1 and period=$2 and name=$3`,
      [apartment_id, period, name]
    );
    await pool.query(
      `insert into fixed_payments (apartment_id, period, name, amount)
       values ($1,$2,$3,$4)`,
      [apartment_id, period, name, amount ?? 0]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// Розрахунок суми за місяць
app.get("/api/calc", async (req, res) => {
  const { apartment_id, period } = req.query;
  if (!apartment_id || !period)
    return res.status(400).json({ error: "apartment_id & period required" });

  try {
    const result = await calculateMonth(Number(apartment_id), period);
    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// --------------------- start ---------------------

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
