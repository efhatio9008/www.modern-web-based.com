require("dotenv").config();
const express = require("express");
const pool = require("./db");
const multer = require("multer");

const app = express();

app.use(express.json());
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

const upload = multer({ dest: "uploads/" });

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  console.log("LOGIN TRY:", username, password);

  if (
    (username === "winnie-01" && password === "EFhatio9009") ||
    (username === "Halex-02" && password === "EFhatio9008")
  ) {
    console.log("LOGIN SUCCESS");
    res.json({ success: true, username });
  } else {
    console.log("LOGIN FAILED");
    res.status(401).json({ error: "Wrong login" });
  }
});

/* GET PROJECTS */
app.get("/api/projects", async (req, res) => {
  const result = await pool.query("SELECT * FROM projects ORDER BY id");
  res.json(result.rows);
});

/* CREATE PROJECT */
app.post("/api/projects", async (req, res) => {
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
      project_description, status, remarks,
      tendering, bg_insurance, cwr_po_received, workscope,
      cost_proposal, ccc_readiness_manpower, procurement_material,
      delivery_material_site, fcb_booking, mob_execution,
      handover_site, demob_date, close_out_report
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16
    ) RETURNING *`,
    [
      project_description, status, remarks,
      tendering, bg_insurance, cwr_po_received, workscope,
      cost_proposal, ccc_readiness_manpower, procurement_material,
      delivery_material_site, fcb_booking, mob_execution,
      handover_site, demob_date, close_out_report
    ]
  );

  res.json(result.rows[0]);
});

/* UPDATE PROJECT */
app.put("/api/projects/:id", async (req, res) => {
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
      project_description, status, remarks,
      tendering, bg_insurance, cwr_po_received, workscope,
      cost_proposal, ccc_readiness_manpower, procurement_material,
      delivery_material_site, fcb_booking, mob_execution,
      handover_site, demob_date, close_out_report,
      id
    ]
  );

  res.json(result.rows[0]);
});

/* UPLOAD FILE */
app.post("/api/upload/:id", upload.single("file"), async (req, res) => {
  const { id } = req.params;

  const result = await pool.query(
    "UPDATE projects SET si_report=$1 WHERE id=$2 RETURNING *",
    [req.file.filename, id]
  );

  res.json(result.rows[0]);
});
/* DELETE PROJECT */
app.delete("/api/projects/:id", async (req, res) => {
  const { id } = req.params;

  await pool.query("DELETE FROM projects WHERE id=$1", [id]);

  res.json({ success: true });
});

/* REMOVE FILE */
app.delete("/api/upload/:id", async (req, res) => {
  const { id } = req.params;

  await pool.query(
    "UPDATE projects SET si_report=NULL WHERE id=$1",
    [id]
  );

  res.json({ success: true });
});

app.listen(process.env.PORT || 3000, () =>
  console.log("Server running on port", process.env.PORT || 3000)
);

