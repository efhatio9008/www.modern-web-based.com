require("dotenv").config();

const express = require("express");
const pool = require("./db");
const multer = require("multer");
const path = require("path");

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
      "SELECT * FROM projects ORDER BY id ASC"
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
      cost_proposal,
      ccc_readiness_manpower,
      procurement_material,
      delivery_material_site,
      fcb_booking,
      mob_execution,
      handover_site,
      demob_date,
      close_out_report
    } = req.body;

    const result = await pool.query(
      `INSERT INTO projects (
        project_description,
        status,
        remarks,
        tendering,
        bg_insurance,
        cwr_po_received,
        workscope,
        cost_proposal,
        ccc_readiness_manpower,
        procurement_material,
        delivery_material_site,
        fcb_booking,
        mob_execution,
        handover_site,
        demob_date,
        close_out_report
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,
        $9,$10,$11,$12,$13,$14,$15,$16
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
        cost_proposal,
        ccc_readiness_manpower,
        procurement_material,
        delivery_material_site,
        fcb_booking,
        mob_execution,
        handover_site,
        demob_date,
        close_out_report
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
      cost_proposal,
      ccc_readiness_manpower,
      procurement_material,
      delivery_material_site,
      fcb_booking,
      mob_execution,
      handover_site,
      demob_date,
      close_out_report
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
        cost_proposal=$8,
        ccc_readiness_manpower=$9,
        procurement_material=$10,
        delivery_material_site=$11,
        fcb_booking=$12,
        mob_execution=$13,
        handover_site=$14,
        demob_date=$15,
        close_out_report=$16
      WHERE id=$17
      RETURNING *`,
      [
        project_description,
        status,
        remarks,
        tendering,
        bg_insurance,
        cwr_po_received,
        workscope,
        cost_proposal,
        ccc_readiness_manpower,
        procurement_material,
        delivery_material_site,
        fcb_booking,
        mob_execution,
        handover_site,
        demob_date,
        close_out_report,
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
    "SELECT * FROM pipe_in_liner ORDER BY id ASC"
  );
  res.json(result.rows);
});

// CREATE
app.post("/api/pipeline", async (req, res) => {
  const { description, status, remarks } = req.body;

  const result = await pool.query(
    `INSERT INTO pipe_in_liner (description, status, remarks)
     VALUES ($1,$2,$3) RETURNING *`,
    [description, status, remarks]
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
    remarks
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
      remarks=$17
    WHERE id=$18
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
    const { months, status, year } = req.body;
    const selectedYear = Number(year) || 2026;

    const result = await pool.query(
      `INSERT INTO timeline_items (months, status, year)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [JSON.stringify(months), status || "", selectedYear]
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
    const { months, status } = req.body;

    const result = await pool.query(
      `UPDATE timeline_items
       SET months=$1, status=$2
       WHERE id=$3
       RETURNING *`,
      [JSON.stringify(months), status || "", id]
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
    "SELECT * FROM deployment ORDER BY id ASC"
  );
  res.json(result.rows);
});

// CREATE
app.post("/api/deployment", async (req, res) => {
  const result = await pool.query(
    `INSERT INTO deployment (deployment_type, status, date_start, date_complete, remarks)
     VALUES ('','','','','') RETURNING *`
  );
  res.json(result.rows[0]);
});

// UPDATE
app.put("/api/deployment/:id", async (req, res) => {
  const { id } = req.params;
  const { deployment_type, status, date_start, date_complete, remarks } = req.body;

  const result = await pool.query(
    `UPDATE deployment SET
      deployment_type=$1,
      status=$2,
      date_start=$3,
      date_complete=$4,
      remarks=$5
    WHERE id=$6
    RETURNING *`,
    [deployment_type, status, date_start, date_complete, remarks, id]
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
    "SELECT * FROM application ORDER BY id ASC"
  );
  res.json(result.rows);
});

// CREATE
app.post("/api/application", async (req, res) => {
  const result = await pool.query(
    `INSERT INTO application (project_description, status, date_start, date_complete, remarks)
     VALUES ('','','','','') RETURNING *`
  );
  res.json(result.rows[0]);
});

// UPDATE
app.put("/api/application/:id", async (req, res) => {
  const { id } = req.params;
  const { project_description, status, date_start, date_complete, remarks } = req.body;

  const result = await pool.query(
    `UPDATE application SET
      project_description=$1,
      status=$2,
      date_start=$3,
      date_complete=$4,
      remarks=$5
    WHERE id=$6
    RETURNING *`,
    [project_description, status, date_start, date_complete, remarks, id]
  );

  res.json(result.rows[0]);
});

// DELETE
app.delete("/api/application/:id", async (req, res) => {
  await pool.query("DELETE FROM application WHERE id=$1", [req.params.id]);
  res.json({ success: true });
});

/* =========================
   START SERVER
========================= */
app.listen(process.env.PORT || 3000, () => {
  console.log("Server running on port", process.env.PORT || 3000);
});
