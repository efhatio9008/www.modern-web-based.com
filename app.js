const loginView = document.querySelector('#loginView');
const appView = document.querySelector('#appView');
const loginForm = document.querySelector('#loginForm');
const loginError = document.querySelector('#loginError');
const currentUser = document.querySelector('#currentUser');
const rowsEl = document.querySelector('#projectRows');
const searchInput = document.querySelector('#searchInput');
const projectDialog = document.querySelector('#projectDialog');
const newProjectForm = document.querySelector('#newProjectForm');

const statusOptions = ['Ongoing','Completed','In progress','Pending Work Scope','Pending Workscope','Pending Review SI','Pending SI Issuance','Pending PO','Pending PO by Client','Submitted','Re-submitted','Approved','Ready','No Workscope','No More Scope','NA'];
const costOptions = ['','Submitted','Re-submitted','Approved','Pending PO','Pending Confirmation PO Value','Winnie info','NA'];
const siOptions = ['','In progress','Submitted','Submitted and signed','Pending Review SI','Pending SI Issuance','No Workscope','NA'];

function optionList(options, value) {
  const set = [...new Set([value, ...options].filter(v => v !== null && v !== undefined))];
  return set.map(v => `<option value="${escapeHtml(v)}" ${v === value ? 'selected' : ''}>${escapeHtml(v || '-')}</option>`).join('');
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[c]));
}

async function api(url, options = {}) {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }, ...options });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Request failed');
  return res.json();
}

async function checkSession() {
  const data = await api('/api/me');
  if (data.user) showApp(data.user); else showLogin();
}

function showLogin() { loginView.classList.remove('hidden'); appView.classList.add('hidden'); }
function showApp(user) { loginView.classList.add('hidden'); appView.classList.remove('hidden'); currentUser.textContent = `Logged in: ${user.username}`; loadProjects(); }

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.textContent = '';
  try {
    const body = Object.fromEntries(new FormData(loginForm));
    const data = await api('/api/login', { method: 'POST', body: JSON.stringify(body) });
    showApp(data.user);
  } catch (err) { loginError.textContent = err.message; }
});

document.querySelector('#logoutBtn').addEventListener('click', async () => { await api('/api/logout', { method: 'POST' }); showLogin(); });
searchInput.addEventListener('input', () => loadProjects(searchInput.value));
document.querySelector('#addProjectBtn').addEventListener('click', () => projectDialog.showModal());

function sectionName(code) {
  return code === 'B' ? 'PETRA / ENEOS PROJECTS' : code === 'C' ? 'SHELL / DESB PROJECTS' : 'PETRONAS CONTRACT';
}

newProjectForm.querySelector('[data-status]').innerHTML = optionList(statusOptions, 'Ongoing');
newProjectForm.addEventListener('submit', async (e) => {
  if (e.submitter?.value === 'cancel') return;
  e.preventDefault();
  const body = Object.fromEntries(new FormData(newProjectForm));
  body.section_name = sectionName(body.section_code);
  await api('/api/projects', { method: 'POST', body: JSON.stringify(body) });
  projectDialog.close();
  newProjectForm.reset();
  await loadProjects();
});

async function loadProjects(q = '') {
  const projects = await api(`/api/projects?q=${encodeURIComponent(q)}`);
  renderStats(projects);
  rowsEl.innerHTML = projects.map(rowTemplate).join('');
  rowsEl.querySelectorAll('[data-save]').forEach(btn => btn.addEventListener('click', saveRow));
  rowsEl.querySelectorAll('[data-upload]').forEach(btn => btn.addEventListener('click', uploadFile));
}

function renderStats(projects) {
  const completed = projects.filter(p => String(p.status || '').toLowerCase().includes('completed')).length;
  const attachments = projects.reduce((n, p) => n + (p.attachments?.length || 0), 0);
  document.querySelector('#totalCount').textContent = projects.length;
  document.querySelector('#completedCount').textContent = completed;
  document.querySelector('#ongoingCount').textContent = projects.length - completed;
  document.querySelector('#attachmentCount').textContent = attachments;
}

function rowTemplate(p) {
  const attachments = (p.attachments || []).map(a => `<a href="/api/attachments/${a.id}/download">${escapeHtml(a.original_name)} <span class="muted">(${escapeHtml(a.field_name)})</span></a>`).join('');
  return `<tr data-id="${p.id}">
    <td><span class="badge">${escapeHtml(p.section_code || '')}</span><br>${escapeHtml(p.section_name || '')}</td>
    <td><input data-field="item_no" value="${escapeHtml(p.item_no || '')}" /></td>
    <td><textarea data-field="project_description">${escapeHtml(p.project_description || '')}</textarea></td>
    <td><select data-field="status">${optionList(statusOptions, p.status || '')}</select></td>
    <td><textarea data-field="workscope">${escapeHtml(p.workscope || '')}</textarea></td>
    <td><select data-field="si_report">${optionList(siOptions, p.si_report || '')}</select><textarea data-field="si_report" placeholder="Extra SI notes">${escapeHtml(p.si_report || '')}</textarea></td>
    <td><select data-field="cost_proposal">${optionList(costOptions, p.cost_proposal || '')}</select><textarea data-field="cost_proposal" placeholder="Extra cost proposal notes">${escapeHtml(p.cost_proposal || '')}</textarea></td>
    <td><textarea data-field="procurement_material">${escapeHtml(p.procurement_material || '')}</textarea></td>
    <td><textarea data-field="remarks">${escapeHtml(p.remarks || '')}</textarea></td>
    <td><div class="attachments">${attachments || '<span class="muted">No file</span>'}<div class="file-row"><input type="file" data-file /><button data-upload>Upload SI</button></div></div></td>
    <td><button data-save>Save</button></td>
  </tr>`;
}

async function saveRow(e) {
  const tr = e.target.closest('tr');
  const id = tr.dataset.id;
  const body = {};
  tr.querySelectorAll('[data-field]').forEach(el => { body[el.dataset.field] = el.value; });
  e.target.disabled = true;
  e.target.textContent = 'Saved';
  try { await api(`/api/projects/${id}`, { method: 'PUT', body: JSON.stringify(body) }); }
  finally { setTimeout(() => { e.target.disabled = false; e.target.textContent = 'Save'; }, 900); }
}

async function uploadFile(e) {
  const tr = e.target.closest('tr');
  const fileInput = tr.querySelector('[data-file]');
  if (!fileInput.files[0]) return alert('Choose a file first.');
  const form = new FormData();
  form.append('file', fileInput.files[0]);
  form.append('field_name', 'si_report');
  e.target.disabled = true;
  const res = await fetch(`/api/projects/${tr.dataset.id}/attachments`, { method: 'POST', body: form });
  e.target.disabled = false;
  if (!res.ok) return alert('Upload failed');
  await loadProjects(searchInput.value);
}

checkSession();
