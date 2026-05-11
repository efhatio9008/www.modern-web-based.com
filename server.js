require("dotenv").config();

const express = require("express");
const pool = require("./db");
const multer = require("multer");
const path = require("path");
const nodemailer = require("nodemailer");

const app = express();

/* =========================
   MIDDLEWARE
========================= */
app.use(express.json());
app.use(express.static("public"));

app.use("/uploads", express.static("uploads", {
  setHeaders: (res) => {
    res.setHeader("Content-Disposition", "inline");
  }
}));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* =========================
   FILE UPLOAD SETUP
========================= */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage });


/* =========================
   AUTO MIGRATION: ROW GROUP / TITLE
   This keeps each row tied to the title typed by the user.
========================= */
async function ensureProjectGroupColumns() {
  const tables = ["projects", "pipe_in_liner", "deployment", "application", "timeline_items"];

  for (const table of tables) {
    await pool.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS project_group TEXT DEFAULT ''`);
  }
}

/* =========================
   LOGIN API
========================= */
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  if (
    (username === "winnie-01" && password === "EFhatio9009") ||
    (username === "Halex-02" && password === "EFhatio9008")
  ) {
    res.json({ success: true, username });
  } else {
    res.status(401).json({ error: "Wrong login" });
  }
});

/* =========================
   PROJECT API
========================= */

// GET PROJECTS
app.get("/api/projects", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM projects ORDER BY sort_order ASC, id ASC"
    );

    res.json(result.rows);
  } catch (err) {
    console.error("GET projects error:", err);
    res.status(500).json({ error: "Failed to load projects" });
  }
});

// CREATE PROJECT
app.post("/api/projects", async (req, res) => {
  try {
    const {
      project_description,
      status,
      remarks,
      tendering,
      bg_insurance,
      cwr_po_received,
      workscope,
      si_report,
      cost_proposal,
      ccc_readiness_manpower,
      procurement_material,
      delivery_material_site,
      fcb_booking,
      mob_execution,
      handover_site,
      demob_date,
      close_out_report,
      project_group
    } = req.body;

    // ⭐ 获取下一个排序
    const orderResult = await pool.query(
      "SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_order FROM projects"
    );

    const nextOrder = orderResult.rows[0].next_order;

    const result = await pool.query(
      `INSERT INTO projects (
        project_description,
        status,
        remarks,
        tendering,
        bg_insurance,
        cwr_po_received,
        workscope,
        si_report,
        cost_proposal,
        ccc_readiness_manpower,
        procurement_material,
        delivery_material_site,
        fcb_booking,
        mob_execution,
        handover_site,
        demob_date,
        close_out_report,
        project_group,
        sort_order
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,
        $9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19
      )
      RETURNING *`,
      [
        project_description,
        status,
        remarks,
        tendering,
        bg_insurance,
        cwr_po_received,
        workscope,
        si_report || "",
        cost_proposal,
        ccc_readiness_manpower,
        procurement_material,
        delivery_material_site,
        fcb_booking,
        mob_execution,
        handover_site,
        demob_date,
        close_out_report,
        project_group || "",
        nextOrder
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("CREATE project error:", err);
    res.status(500).json({ error: "Failed to create project" });
  }
});

// UPDATE PROJECT
app.put("/api/projects/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const {
      project_description,
      status,
      remarks,
      tendering,
      bg_insurance,
      cwr_po_received,
      workscope,
      si_report,
      cost_proposal,
      ccc_readiness_manpower,
      procurement_material,
      delivery_material_site,
      fcb_booking,
      mob_execution,
      handover_site,
      demob_date,
      close_out_report,
      project_group
    } = req.body;

    const result = await pool.query(
      `UPDATE projects SET
        project_description=$1,
        status=$2,
        remarks=$3,
        tendering=$4,
        bg_insurance=$5,
        cwr_po_received=$6,
        workscope=$7,
        si_report=$8,
        cost_proposal=$9,
        ccc_readiness_manpower=$10,
        procurement_material=$11,
        delivery_material_site=$12,
        fcb_booking=$13,
        mob_execution=$14,
        handover_site=$15,
        demob_date=$16,
        close_out_report=$17,
        project_group=$18
      WHERE id=$19
      RETURNING *`,
      [
        project_description,
        status,
        remarks,
        tendering,
        bg_insurance,
        cwr_po_received,
        workscope,
        si_report || "",
        cost_proposal,
        ccc_readiness_manpower,
        procurement_material,
        delivery_material_site,
        fcb_booking,
        mob_execution,
        handover_site,
        demob_date,
        close_out_report,
        project_group || "",
        id
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("UPDATE project error:", err);
    res.status(500).json({ error: "Failed to update project" });
  }
});

// DELETE PROJECT
app.delete("/api/projects/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query("DELETE FROM projects WHERE id=$1", [id]);

    res.json({ success: true });
  } catch (err) {
    console.error("DELETE project error:", err);
    res.status(500).json({ error: "Failed to delete project" });
  }
});


/* =========================
   UPLOAD API
========================= */

// UPLOAD FILE
app.post("/api/upload/:id", upload.single("file"), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "UPDATE projects SET si_report=$1 WHERE id=$2 RETURNING *",
      [req.file.filename, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("UPLOAD file error:", err);
    res.status(500).json({ error: "Failed to upload file" });
  }
});


// GENERIC CELL ATTACHMENT UPLOAD
app.post("/api/cell-attachment-upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    res.json({
      success: true,
      filename: req.file.filename,
      url: `/uploads/${req.file.filename}`
    });
  } catch (err) {
    console.error("CELL ATTACHMENT upload error:", err);
    res.status(500).json({ error: "Failed to upload attachment" });
  }
});

// REMOVE FILE
app.delete("/api/upload/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      "UPDATE projects SET si_report=NULL WHERE id=$1",
      [id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("REMOVE file error:", err);
    res.status(500).json({ error: "Failed to remove file" });
  }
});


/* =========================
   PIPE-IN LINER API
========================= */

// GET
app.get("/api/pipeline", async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM pipe_in_liner ORDER BY sort_order ASC, id ASC"
  );
  res.json(result.rows);
});

// CREATE
app.post("/api/pipeline", async (req, res) => {
  const { description, status, remarks, project_group } = req.body;

  const orderResult = await pool.query(
    "SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_order FROM pipe_in_liner"
  );

  const nextOrder = orderResult.rows[0].next_order;

  const result = await pool.query(
    `INSERT INTO pipe_in_liner (description, status, remarks, project_group, sort_order)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [description, status, remarks, project_group || "", nextOrder]
  );

  res.json(result.rows[0]);
});

// UPDATE
app.put("/api/pipeline/:id", async (req, res) => {
  const { id } = req.params;

  const {
    description,
    status,
    presentation,
    commercial,
    technical,
    site_visit,
    received_orders,
    issue_po,
    transport,
    lead_time,
    etb,
    eta,
    transport_site,
    do_acceptance,
    install_start,
    project_end,
    remarks,
    project_group
  } = req.body;

  const result = await pool.query(
    `UPDATE pipe_in_liner SET
      description=$1,
      status=$2,
      presentation=$3,
      commercial=$4,
      technical=$5,
      site_visit=$6,
      received_orders=$7,
      issue_po=$8,
      transport=$9,
      lead_time=$10,
      etb=$11,
      eta=$12,
      transport_site=$13,
      do_acceptance=$14,
      install_start=$15,
      project_end=$16,
      remarks=$17,
      project_group=$18
    WHERE id=$19
    RETURNING *`,
    [
      description,
      status,
      presentation,
      commercial,
      technical,
      site_visit,
      received_orders,
      issue_po,
      transport,
      lead_time,
      etb,
      eta,
      transport_site,
      do_acceptance,
      install_start,
      project_end,
      remarks,
      project_group || "",
      id
    ]
  );

  res.json(result.rows[0]);
});

// DELETE
app.delete("/api/pipeline/:id", async (req, res) => {
  const { id } = req.params;

  await pool.query("DELETE FROM pipe_in_liner WHERE id=$1", [id]);

  res.json({ success: true });
});


/* =========================
   TIMELINE API
========================= */

// GET TIMELINE BY YEAR
app.get("/api/timeline", async (req, res) => {
  try {
    const year = Number(req.query.year) || 2026;

    const result = await pool.query(
      "SELECT * FROM timeline_items WHERE year=$1 ORDER BY id DESC",
      [year]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("GET timeline error:", err);
    res.status(500).json({ error: "Failed to load timeline" });
  }
});

// CREATE TIMELINE ROW
app.post("/api/timeline", async (req, res) => {
  try {
    const { months, status, year, project_group } = req.body;
    const selectedYear = Number(year) || 2026;

    const result = await pool.query(
      `INSERT INTO timeline_items (months, status, year, project_group)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [JSON.stringify(months), status || "", selectedYear, project_group || ""]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("CREATE timeline error:", err);
    res.status(500).json({ error: "Failed to create timeline row" });
  }
});

// UPDATE TIMELINE ROW
app.put("/api/timeline/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { months, status, project_group } = req.body;

    const result = await pool.query(
      `UPDATE timeline_items
       SET months=$1, status=$2, project_group=$3
       WHERE id=$4
       RETURNING *`,
      [JSON.stringify(months), status || "", project_group || "", id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("UPDATE timeline error:", err);
    res.status(500).json({ error: "Failed to update timeline row" });
  }
});

// DELETE TIMELINE ROW
app.delete("/api/timeline/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query("DELETE FROM timeline_items WHERE id=$1", [id]);

    res.json({ success: true });
  } catch (err) {
    console.error("DELETE timeline error:", err);
    res.status(500).json({ error: "Failed to delete timeline row" });
  }
});

/* =========================
   DEPLOYMENT API
========================= */

// GET
app.get("/api/deployment", async (req, res) => {
  const result = await pool.query(
   "SELECT * FROM deployment ORDER BY sort_order ASC, id ASC"
  );
  res.json(result.rows);
});

// CREATE
app.post("/api/deployment", async (req, res) => {
  const { project_group } = req.body;
  const orderResult = await pool.query(
    "SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_order FROM deployment"
  );

  const nextOrder = orderResult.rows[0].next_order;

  const result = await pool.query(
    `INSERT INTO deployment (
      deployment_type, status, date_start, date_complete, remarks, project_group, sort_order
    )
     VALUES ('','','','','',$1,$2) RETURNING *`,
    [project_group || "", nextOrder]
  );

  res.json(result.rows[0]);
});

// UPDATE
app.put("/api/deployment/:id", async (req, res) => {
  const { id } = req.params;
  const { deployment_type, status, date_start, date_complete, remarks, project_group } = req.body;

  const result = await pool.query(
    `UPDATE deployment SET
      deployment_type=$1,
      status=$2,
      date_start=$3,
      date_complete=$4,
      remarks=$5,
      project_group=$6
    WHERE id=$7
    RETURNING *`,
    [deployment_type, status, date_start, date_complete, remarks, project_group || "", id]
  );

  res.json(result.rows[0]);
});

// DELETE
app.delete("/api/deployment/:id", async (req, res) => {
  await pool.query("DELETE FROM deployment WHERE id=$1", [req.params.id]);
  res.json({ success: true });
});


/* =========================
   APPLICATION LICENSE API
========================= */
// GET
app.get("/api/application", async (req, res) => {
  const result = await pool.query(
   "SELECT * FROM application ORDER BY sort_order ASC, id ASC"
  );
  res.json(result.rows);
});

// CREATE
app.post("/api/application", async (req, res) => {
  const { project_group } = req.body;
  const orderResult = await pool.query(
    "SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_order FROM application"
  );

  const nextOrder = orderResult.rows[0].next_order;

  const result = await pool.query(
    `INSERT INTO application (
      project_description, status, date_start, date_complete, remarks, project_group, sort_order
    )
     VALUES ('','','','','',$1,$2) RETURNING *`,
    [project_group || "", nextOrder]
  );

  res.json(result.rows[0]);
});

// UPDATE
app.put("/api/application/:id", async (req, res) => {
  const { id } = req.params;
  const { project_description, status, date_start, date_complete, remarks, project_group } = req.body;

  const result = await pool.query(
    `UPDATE application SET
      project_description=$1,
      status=$2,
      date_start=$3,
      date_complete=$4,
      remarks=$5,
      project_group=$6
    WHERE id=$7
    RETURNING *`,
    [project_description, status, date_start, date_complete, remarks, project_group || "", id]
  );

  res.json(result.rows[0]);
});

// DELETE
app.delete("/api/application/:id", async (req, res) => {
  await pool.query("DELETE FROM application WHERE id=$1", [req.params.id]);
  res.json({ success: true });
});

/* =========================
   EMAIL HISTORY + SEND EMAIL API
========================= */

// 1. Save Email History
app.post("/api/email-history", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !String(email).includes("@")) {
      return res.status(400).json({ error: "Invalid email" });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    const result = await pool.query(
      `INSERT INTO email_history (email)
       VALUES ($1)
       ON CONFLICT (email) DO UPDATE SET created_at = NOW()
       RETURNING *`,
      [cleanEmail]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("SAVE email history error:", err);
    res.status(500).json({ error: "Failed to save email history" });
  }
});

// 2. Get Email Suggestions
app.get("/api/email-history", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim().toLowerCase();

    const result = await pool.query(
      `SELECT email
       FROM email_history
       WHERE email ILIKE $1
       ORDER BY created_at DESC
       LIMIT 8`,
      [`${q}%`]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("GET email history error:", err);
    res.status(500).json({ error: "Failed to load email history" });
  }
});

// 3. Send Email API
app.post("/api/send-group-email", async (req, res) => {
  try {
    const { to, subject, message, filename, fileBase64 } = req.body;

    if (!to || !String(to).includes("@")) {
      return res.status(400).json({ error: "Invalid recipient email" });
    }

    if (!fileBase64) {
      return res.status(400).json({ error: "Missing Excel file" });
    }

    const cleanEmail = String(to).trim().toLowerCase();
    const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,

    auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
    },

   tls: {
    family: 4
     }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: cleanEmail,
      subject: subject || "Web Management System Export",
      text: message || "Please find the attached Excel export.",
      attachments: [
        {
          filename: filename || "export.xlsx",
          content: Buffer.from(fileBase64, "base64"),
          contentType:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        }
      ]
    });

    await pool.query(
      `INSERT INTO email_history (email)
       VALUES ($1)
       ON CONFLICT (email) DO UPDATE SET created_at = NOW()`,
      [cleanEmail]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("SEND group email error:", err);
    res.status(500).json({ error: "Failed to send email" });
  }
});


/* =========================
   USER ACTIVITY API
========================= */

// GET activity logs - last 72 hours
app.get("/api/activity-logs", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM activity_logs
      WHERE login_time >= NOW() - INTERVAL '72 hours'
      ORDER BY login_time DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("GET activity logs error:", err);
    res.status(500).json({ error: "Failed to load activity logs" });
  }
});

// CREATE activity log
app.post("/api/activity-logs", async (req, res) => {
  try {
    const { username, login_time, logout_time, modules } = req.body;

    const result = await pool.query(
      `INSERT INTO activity_logs (username, login_time, logout_time, modules)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [username || "Unknown", login_time, logout_time, modules || []]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("CREATE activity log error:", err);
    res.status(500).json({ error: "Failed to save activity log" });
  }
});

/* =========================
   START SERVER
========================= */
ensureProjectGroupColumns()
  .then(() => {
    app.listen(process.env.PORT || 3000, () => {
      console.log("Server running on port", process.env.PORT || 3000);
    });
  })
  .catch((err) => {
    console.error("Database migration failed:", err);
    process.exit(1);
  });
