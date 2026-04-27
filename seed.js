require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('./db');

async function main() {
  const schema = fs.readFileSync(path.join(__dirname, 'db/schema.sql'), 'utf8');
  await db.query(schema);

  const users = [
    { username: process.env.USER1_NAME || 'winnie-01', password: process.env.USER1_PASSWORD || 'EFhatio9009' },
    { username: process.env.USER2_NAME || 'Halex-02', password: process.env.USER2_PASSWORD || 'EFhatio9008' },
  ];

  for (const user of users) {
    const hash = await bcrypt.hash(user.password, 12);
    await db.query(
      `INSERT INTO app_users (username, password_hash)
       VALUES ($1, $2)
       ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
      [user.username, hash]
    );
  }

  const existing = await db.query('SELECT COUNT(*)::int AS count FROM projects');
  if (existing.rows[0].count === 0) {
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'initial-data.json'), 'utf8'));
    for (const p of data) {
      await db.query(
        `INSERT INTO projects (
          project_group, section_code, section_name, item_no, project_description, status,
          tendering, bg_insurance, cwr_po_received, workscope, si_report, cost_proposal,
          readiness_manpower, procurement_material, delivery_material_to_site, fcb_booking,
          mob_execution, handover_at_site, demob_date, close_out_report, remarks
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)`,
        [
          p.project_group, p.section_code, p.section_name, p.item_no, p.project_description, p.status,
          p.tendering, p.bg_insurance, p.cwr_po_received, p.workscope, p.si_report, p.cost_proposal,
          p.readiness_manpower, p.procurement_material, p.delivery_material_to_site, p.fcb_booking,
          p.mob_execution, p.handover_at_site, p.demob_date, p.close_out_report, p.remarks
        ]
      );
    }
  }

  console.log('Database initialized. Users and A. Project seed data are ready.');
  await db.pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
