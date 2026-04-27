# MEPSB Project Progress App

This is a starter web application converted from the uploaded Excel workbook. It starts with **A. Project** and keeps the code/database structure open for B. Pipe In Liner, Thailand, departments, or other future modules.

## What is included

- Login page with 2 initial users loaded from environment variables.
- A. Project dashboard seeded from `Master Activity Summary_MEPSB_Halex_24.04.26.xlsx`.
- Editable project fields: status, workscope, SI Report, cost proposal, procurement material, remarks, etc.
- Add new project rows.
- Upload SI Report attachments and download them later.
- PostgreSQL persistence for project data, user accounts, sessions, attachments metadata, and activity logs.
- Separate frontend/backend files.

## File structure

```text
mepsb-progress-app/
  public/
    index.html
    styles.css
    app.js
  db/
    schema.sql
    init.sql
  uploads/
    .gitkeep
  db.js
  server.js
  seed.js
  initial-data.json
  package.json
  .env.example
  .gitignore
```

## Local setup

1. Install Node.js 20+ and PostgreSQL.
2. Create a PostgreSQL database, for example `mepsb_progress`.
3. Copy `.env.example` to `.env` and edit `DATABASE_URL` if needed.
4. Install packages:

```bash
npm install
```

5. Create tables and seed login users + A. Project rows:

```bash
npm run init-db
```

6. Start the app:

```bash
npm start
```

Open `http://localhost:3000`.

## Render deployment notes

1. Push this folder to GitHub.
2. Create a PostgreSQL database on Render.
3. Create a Render Web Service from the GitHub repo.
4. Add environment variables in Render:

```text
DATABASE_URL=<your Render PostgreSQL internal/external URL>
SESSION_SECRET=<long random string>
NODE_ENV=production
UPLOAD_DIR=/var/data/uploads
USER1_NAME=winnie-01
USER1_PASSWORD=<set privately in Render>
USER2_NAME=Halex-02
USER2_PASSWORD=<set privately in Render>
```

5. Build command:

```bash
npm install && npm run init-db
```

6. Start command:

```bash
npm start
```

Important for attachments: Render web services normally have an ephemeral filesystem unless you attach a Persistent Disk. If you want uploaded files to remain after redeploys/restarts, attach a disk and set `UPLOAD_DIR` to a path inside that disk, such as `/var/data/uploads`. For larger production systems, object storage such as S3/Cloudinary is usually cleaner.

## Security notes

- Do not commit `.env` to GitHub.
- Change the initial passwords after first deployment.
- For production, add HTTPS-only cookies, stricter upload file type rules, audit permissions, and a proper admin page for user management.

## Next upgrade ideas

- Add module switcher: A. Project, B. Pipe In Liner, C. Development, Application License, Thailand.
- Add role-based access: admin/edit/view.
- Add Excel export.
- Add attachment types per field, e.g. SI Report, Cost Proposal, Close Out Report.
- Add project timeline / date filters.
