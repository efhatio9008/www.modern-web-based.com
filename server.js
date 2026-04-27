require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const multer = require('multer');
const bcrypt = require('bcryptjs');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const uploadDir = path.resolve(process.env.UPLOAD_DIR || path.join(__dirname, 'uploads'));
fs.mkdirSync(uploadDir, { recursive: true });

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(session({
  store: new PgSession({ pool: db.pool, createTableIfMissing: true }),
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 8,
  },
}));
app.use(express.static(path.join(__dirname, 'public')));

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safe}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

function requireAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  next();
}

async function logActivity(req, action, projectId, details = {}) {
  if (!req.session.user) return;
  await db.query(
    'INSERT INTO activity_logs (user_id, action, project_id, details) VALUES ($1,$2,$3,$4)',
    [req.session.user.id, action, projectId || null, details]
  );
}

app.get('/api/me', (req, res) => res.json({ user: req.session.user || null }));

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const result = await db.query('SELECT * FROM app_users WHERE username = $1', [username]);
  const user = result.rows[0];
  if (!user || !(await bcrypt.compare(password || '', user.password_hash))) {
    return res.status(401).json({ error: 'Wrong username or password' });
  }
  req.session.user = { id: user.id, username: user.username };
  res.json({ user: req.session.user });
});

app.post('/api/logout', (req, res) => req.session.destroy(() => res.json({ ok: true })));

app.get('/api/projects', requireAuth, async (req, res) => {
  const { group = 'A. Project', q = '' } = req.query;
  const result = await db.query(
    `SELECT p.*, COALESCE(json_agg(a.*) FILTER (WHERE a.id IS NOT NULL), '[]') AS attachments
     FROM projects p
     LEFT JOIN attachments a ON a.project_id = p.id
     WHERE p.project_group = $1 AND ($2 = '' OR p.project_description ILIKE '%' || $2 || '%' OR p.remarks ILIKE '%' || $2 || '%')
     GROUP BY p.id
     ORDER BY p.section_code NULLS LAST, p.id`,
    [group, q]
  );
  res.json(result.rows);
});

app.post('/api/projects', requireAuth, async (req, res) => {
  const p = req.body;
  const result = await db.query(
    `INSERT INTO projects (project_group, section_code, section_name, item_no, project_description, status, remarks)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [p.project_group || 'A. Project', p.section_code || 'A', p.section_name || 'PETRONAS CONTRACT', p.item_no || null, p.project_description, p.status || 'Ongoing', p.remarks || null]
  );
  await logActivity(req, 'create_project', result.rows[0].id, { project_description: p.project_description });
  res.json(result.rows[0]);
});

app.put('/api/projects/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const allowed = [
    'project_description','status','tendering','bg_insurance','cwr_po_received','workscope','si_report','cost_proposal',
    'readiness_manpower','procurement_material','delivery_material_to_site','fcb_booking','mob_execution','handover_at_site',
    'demob_date','close_out_report','remarks','section_code','section_name','item_no'
  ];
  const fields = [];
  const values = [];
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(req.body, key)) {
      values.push(req.body[key] === '' ? null : req.body[key]);
      fields.push(`${key} = $${values.length}`);
    }
  }
  if (fields.length === 0) return res.status(400).json({ error: 'No valid fields' });
  values.push(id);
  const result = await db.query(`UPDATE projects SET ${fields.join(', ')} WHERE id = $${values.length} RETURNING *`, values);
  await logActivity(req, 'update_project', id, req.body);
  res.json(result.rows[0]);
});

app.delete('/api/projects/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  await db.query('DELETE FROM projects WHERE id = $1', [id]);
  await logActivity(req, 'delete_project', id);
  res.json({ ok: true });
});

app.post('/api/projects/:id/attachments', requireAuth, upload.single('file'), async (req, res) => {
  const projectId = Number(req.params.id);
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const fieldName = req.body.field_name || 'si_report';
  const result = await db.query(
    `INSERT INTO attachments (project_id, field_name, original_name, stored_name, mime_type, size_bytes, uploaded_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [projectId, fieldName, req.file.originalname, req.file.filename, req.file.mimetype, req.file.size, req.session.user.id]
  );
  await logActivity(req, 'upload_attachment', projectId, { file: req.file.originalname, field_name: fieldName });
  res.json(result.rows[0]);
});

app.get('/api/attachments/:id/download', requireAuth, async (req, res) => {
  const result = await db.query('SELECT * FROM attachments WHERE id = $1', [Number(req.params.id)]);
  const file = result.rows[0];
  if (!file) return res.status(404).send('File not found');
  res.download(path.join(uploadDir, file.stored_name), file.original_name);
});

app.get('*', (_, res) => res.sendFile(path.join(__dirname, 'public/index.html')));

app.listen(PORT, () => console.log(`MEPSB progress app running on port ${PORT}`));
