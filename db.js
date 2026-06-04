const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

/*
  TEMPORARY DATABASE FALLBACK MODE
  Data stays only while Render instance is running.
  Restart / redeploy / sleep = data disappears.
*/

const originalQuery = pool.query.bind(pool);

const memory = {
  projects: [],
  pipe_in_liner: [],
  deployment: [],
  application: [],
  timeline_items: [],
  activity_logs: [],
  email_history: []
};

const counters = {
  projects: 1,
  pipe_in_liner: 1,
  deployment: 1,
  application: 1,
  timeline_items: 1,
  activity_logs: 1,
  email_history: 1
};

function clone(row) {
  return JSON.parse(JSON.stringify(row));
}

function nextId(table) {
  return counters[table]++;
}

function getTable(sql) {
  const text = String(sql || "").toLowerCase();

  if (text.includes("projects")) return "projects";
  if (text.includes("pipe_in_liner")) return "pipe_in_liner";
  if (text.includes("deployment")) return "deployment";
  if (text.includes("application")) return "application";
  if (text.includes("timeline_items")) return "timeline_items";
  if (text.includes("activity_logs")) return "activity_logs";
  if (text.includes("email_history")) return "email_history";

  return "";
}

function selectRows(sql, params = []) {
  const table = getTable(sql);
  if (!table) return { rows: [], rowCount: 0 };

  let rows = memory[table];

  if (table === "timeline_items" && String(sql).toLowerCase().includes("where year")) {
    rows = rows.filter(row => Number(row.year) === Number(params[0]));
  }

  if (table === "activity_logs") {
    rows = [...rows].slice(-200).reverse();
  }

  if (table === "email_history") {
    const q = String(params[0] || "").replace(/%/g, "").toLowerCase();
    rows = rows.filter(row => String(row.email || "").toLowerCase().includes(q));
  }

  return {
    rows: rows.map(clone),
    rowCount: rows.length
  };
}

function insertRow(sql, params = []) {
  const table = getTable(sql);
  if (!table) return { rows: [], rowCount: 0 };

  let row = {
    id: nextId(table),
    sort_order: memory[table].length + 1,
    project_group: ""
  };

  if (table === "projects") {
    row = {
      id: nextId(table),
      project_description: params[0] || "",
      status: params[1] || "",
      remarks: params[2] || "",
      tendering: params[3] || "",
      bg_insurance: params[4] || "",
      cwr_po_received: params[5] || "",
      workscope: params[6] || "",
      si_report: params[7] || "",
      cost_proposal: params[8] || "",
      ccc_readiness_manpower: params[9] || "",
      procurement_material: params[10] || "",
      delivery_material_site: params[11] || "",
      fcb_booking: params[12] || "",
      mob_execution: params[13] || "",
      handover_site: params[14] || "",
      demob_date: params[15] || "",
      close_out_report: params[16] || "",
      project_group: params[17] || "",
      sort_order: params[18] || memory[table].length + 1
    };
  }

  if (table === "pipe_in_liner") {
    row = {
      id: nextId(table),
      description: params[0] || "",
      status: params[1] || "",
      remarks: params[2] || "",
      project_group: params[3] || "",
      sort_order: params[4] || memory[table].length + 1
    };
  }

  if (table === "deployment") {
    row = {
      id: nextId(table),
      deployment_type: "",
      status: "",
      date_start: "",
      date_complete: "",
      remarks: "",
      project_group: params[0] || "",
      sort_order: params[1] || memory[table].length + 1
    };
  }

  if (table === "application") {
    row = {
      id: nextId(table),
      project_description: "",
      status: "",
      date_start: "",
      date_complete: "",
      remarks: "",
      project_group: params[0] || "",
      sort_order: params[1] || memory[table].length + 1
    };
  }

  if (table === "timeline_items") {
    row = {
      id: nextId(table),
      months: params[0] || JSON.stringify(Array(12).fill("")),
      status: params[1] || "",
      year: params[2] || 2026,
      project_group: params[3] || "",
      sort_order: memory[table].length + 1
    };
  }

  if (table === "activity_logs") {
    row = {
      id: nextId(table),
      username: params[0] || "Unknown",
      login_time: params[1] || new Date().toISOString(),
      logout_time: params[2] || new Date().toISOString(),
      modules: params[3] || []
    };
  }

  if (table === "email_history") {
    row = {
      id: nextId(table),
      email: params[0] || "",
      created_at: new Date().toISOString()
    };

    const existing = memory[table].find(item => item.email === row.email);
    if (existing) {
      existing.created_at = row.created_at;
      return { rows: [clone(existing)], rowCount: 1 };
    }
  }

  memory[table].push(row);

  return {
    rows: [clone(row)],
    rowCount: 1
  };
}

function updateRow(sql, params = []) {
  const table = getTable(sql);
  if (!table) return { rows: [], rowCount: 0 };

  const id = Number(params[params.length - 1]);
  const row = memory[table].find(item => Number(item.id) === id);

  if (!row) return { rows: [], rowCount: 0 };

  if (table === "projects") {
    Object.assign(row, {
      project_description: params[0] || "",
      status: params[1] || "",
      remarks: params[2] || "",
      tendering: params[3] || "",
      bg_insurance: params[4] || "",
      cwr_po_received: params[5] || "",
      workscope: params[6] || "",
      si_report: params[7] || "",
      cost_proposal: params[8] || "",
      ccc_readiness_manpower: params[9] || "",
      procurement_material: params[10] || "",
      delivery_material_site: params[11] || "",
      fcb_booking: params[12] || "",
      mob_execution: params[13] || "",
      handover_site: params[14] || "",
      demob_date: params[15] || "",
      close_out_report: params[16] || "",
      project_group: params[17] || ""
    });
  }

  if (table === "pipe_in_liner") {
    Object.assign(row, {
      description: params[0] || "",
      status: params[1] || "",
      presentation: params[2] || "",
      commercial: params[3] || "",
      technical: params[4] || "",
      site_visit: params[5] || "",
      received_orders: params[6] || "",
      issue_po: params[7] || "",
      transport: params[8] || "",
      lead_time: params[9] || "",
      etb: params[10] || "",
      eta: params[11] || "",
      transport_site: params[12] || "",
      do_acceptance: params[13] || "",
      install_start: params[14] || "",
      project_end: params[15] || "",
      remarks: params[16] || "",
      project_group: params[17] || ""
    });
  }

  if (table === "deployment") {
    Object.assign(row, {
      deployment_type: params[0] || "",
      status: params[1] || "",
      date_start: params[2] || "",
      date_complete: params[3] || "",
      remarks: params[4] || "",
      project_group: params[5] || ""
    });
  }

  if (table === "application") {
    Object.assign(row, {
      project_description: params[0] || "",
      status: params[1] || "",
      date_start: params[2] || "",
      date_complete: params[3] || "",
      remarks: params[4] || "",
      project_group: params[5] || ""
    });
  }

  if (table === "timeline_items") {
    Object.assign(row, {
      months: params[0] || JSON.stringify(Array(12).fill("")),
      status: params[1] || "",
      project_group: params[2] || ""
    });
  }

  return {
    rows: [clone(row)],
    rowCount: 1
  };
}

function deleteRow(sql, params = []) {
  const table = getTable(sql);
  if (!table) return { rows: [], rowCount: 0 };

  const id = Number(params[0]);
  memory[table] = memory[table].filter(row => Number(row.id) !== id);

  return {
    rows: [],
    rowCount: 1
  };
}

function fallbackResult(sql, params = []) {
  const text = String(sql || "").trim().toLowerCase();
  const table = getTable(sql);

  if (text.startsWith("alter table")) {
    return { rows: [], rowCount: 0 };
  }

  if (text.includes("next_order")) {
    const rows = memory[table] || [];
    const max = rows.reduce((m, row) => Math.max(m, Number(row.sort_order) || 0), 0);
    return { rows: [{ next_order: max + 1 }], rowCount: 1 };
  }

  if (text.startsWith("select")) return selectRows(sql, params);
  if (text.startsWith("insert")) return insertRow(sql, params);
  if (text.startsWith("update")) return updateRow(sql, params);
  if (text.startsWith("delete")) return deleteRow(sql, params);

  return { rows: [], rowCount: 0 };
}

pool.query = async function (...args) {
  try {
    return await originalQuery(...args);
  } catch (err) {
    console.error("Database unavailable, using temporary memory mode:", err.message);
    return fallbackResult(args[0], args[1] || []);
  }
};

module.exports = pool;