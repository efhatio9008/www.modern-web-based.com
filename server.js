require("dotenv").config();
const express = require("express");
const pool = require("./db");
const multer = require("multer");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static("public"));

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
const { project_description, status, remarks } = req.body;

const result = await pool.query(
"INSERT INTO projects (project_description, status, remarks) VALUES ($1,$2,$3) RETURNING *",
[project_description, status, remarks]
);

res.json(result.rows[0]);
});

/* UPDATE PROJECT */
app.put("/api/projects/:id", async (req, res) => {
const { id } = req.params;
const { project_description, status, remarks } = req.body;

const result = await pool.query(
"UPDATE projects SET project_description=$1, status=$2, remarks=$3 WHERE id=$4 RETURNING *",
[project_description, status, remarks, id]
);

res.json(result.rows[0]);
});

/* UPLOAD FILE */
app.post("/api/upload/:id", upload.single("file"), async (req, res) => {
res.json({ file: req.file.filename });
});

app.listen(process.env.PORT, () =>
console.log("Server running on port", process.env.PORT)
);
