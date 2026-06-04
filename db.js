const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

/*
  TEMPORARY DATABASE FALLBACK MODE

  Database expired/suspended.
  Website can still open for demo.
  Data will NOT be saved while database is unavailable.
*/

const originalQuery = pool.query.bind(pool);

function fallbackResult(sql) {
  const text = String(sql || "").trim().toLowerCase();

  if (text.includes("next_order")) {
    return { rows: [{ next_order: 1 }], rowCount: 1 };
  }

  if (text.startsWith("insert") || text.startsWith("update")) {
    return {
      rows: [{
        id: Date.now(),
        sort_order: 1,
        project_group: ""
      }],
      rowCount: 1
    };
  }

  if (text.startsWith("delete")) {
    return { rows: [], rowCount: 1 };
  }

  return { rows: [], rowCount: 0 };
}

pool.query = async function (...args) {
  try {
    return await originalQuery(...args);
  } catch (err) {
    console.error("Database unavailable, using temporary fallback:", err.message);
    return fallbackResult(args[0]);
  }
};

module.exports = pool;