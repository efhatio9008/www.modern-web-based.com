async function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  if (res.ok) {
    document.getElementById("login").style.display = "none";
    document.getElementById("app").style.display = "block";
    loadProjects();
    loadTimeline();
  } else {
    alert("Login failed");
  }
}

let timelineData = [];
let timelinePage = 1;
const timelineRowsPerPage = 15;

let allProjects = [];
let currentPage = 1;
const rowsPerPage = 15;
const maxPages = 10;
let searchMode = false;

async function loadProjects() {
  const res = await fetch("/api/projects");
  const data = await res.json();

  allProjects = data;
  renderProjects();
}

function renderProjects() {
  const table = document.getElementById("table");
  table.innerHTML = "";

  let displayData = allProjects.map((p, index) => ({
    ...p,
    displayId: index + 1
  }));

  if (!searchMode) {
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    displayData = displayData.slice(start, end);
  }

  displayData.forEach((p) => {
    table.innerHTML += `
      <tr>
        <td>${p.displayId}</td>
        <td contenteditable="true" id="desc-${p.id}" onblur="autoSave(${p.id})">${p.project_description || ""}</td>
        <td contenteditable="true" id="status-${p.id}" onblur="autoSave(${p.id})">${p.status || ""}</td>
        <td contenteditable="true" id="tendering-${p.id}" onblur="autoSave(${p.id})">${p.tendering || ""}</td>
        <td contenteditable="true" id="bg-${p.id}" onblur="autoSave(${p.id})">${p.bg_insurance || ""}</td>
        <td contenteditable="true" id="cwr-${p.id}" onblur="autoSave(${p.id})">${p.cwr_po_received || ""}</td>
        <td contenteditable="true" id="workscope-${p.id}" onblur="autoSave(${p.id})">${p.workscope || ""}</td>

        <td>
          ${p.si_report ? `
            <div class="file-box">
              📄 <a href="/uploads/${p.si_report}" target="_blank">${p.si_report}</a>
              <button class="delete-file-btn" onclick="removeFile(${p.id})">❌</button>
            </div>
          ` : ""}

          <div class="upload-box">
            <input type="file" id="file-${p.id}">
            <button onclick="uploadFile(${p.id})">Upload</button>
          </div>
        </td>

        <td contenteditable="true" id="cost-${p.id}" onblur="autoSave(${p.id})">${p.cost_proposal || ""}</td>
        <td contenteditable="true" id="ccc-${p.id}" onblur="autoSave(${p.id})">${p.ccc_readiness_manpower || ""}</td>
        <td contenteditable="true" id="procurement-${p.id}" onblur="autoSave(${p.id})">${p.procurement_material || ""}</td>
        <td contenteditable="true" id="delivery-${p.id}" onblur="autoSave(${p.id})">${p.delivery_material_site || ""}</td>
        <td contenteditable="true" id="fcb-${p.id}" onblur="autoSave(${p.id})">${p.fcb_booking || ""}</td>
        <td contenteditable="true" id="mob-${p.id}" onblur="autoSave(${p.id})">${p.mob_execution || ""}</td>
        <td contenteditable="true" id="handover-${p.id}" onblur="autoSave(${p.id})">${p.handover_site || ""}</td>
        <td contenteditable="true" id="demob-${p.id}" onblur="autoSave(${p.id})">${p.demob_date || ""}</td>
        <td contenteditable="true" id="close-${p.id}" onblur="autoSave(${p.id})">${p.close_out_report || ""}</td>
        <td contenteditable="true" id="remarks-${p.id}" onblur="autoSave(${p.id})">${p.remarks || ""}</td>

        <td>
          <button onclick="deleteProject(${p.id})">Delete</button>
        </td>
      </tr>
    `;
  });

  renderPagination();
}

async function addProject() {
  const project_description = document.getElementById("desc").value;
  const status = document.getElementById("status").value;
  const remarks = document.getElementById("remarks").value;

  await fetch("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      project_description,
      status,
      remarks,
      tendering: "",
      bg_insurance: "",
      cwr_po_received: "",
      workscope: "",
      cost_proposal: "",
      ccc_readiness_manpower: "",
      procurement_material: "",
      delivery_material_site: "",
      fcb_booking: "",
      mob_execution: "",
      handover_site: "",
      demob_date: "",
      close_out_report: ""
    })
  });

  document.getElementById("desc").value = "";
  document.getElementById("status").value = "";
  document.getElementById("remarks").value = "";

  loadProjects();
}

function updateLocalProject(id) {
  const p = allProjects.find(item => item.id === id);
  if (!p) return;

  p.project_description = document.getElementById(`desc-${id}`)?.innerText.trim() || "";
  p.status = document.getElementById(`status-${id}`)?.innerText.trim() || "";
  p.remarks = document.getElementById(`remarks-${id}`)?.innerText.trim() || "";

  p.tendering = document.getElementById(`tendering-${id}`)?.innerText.trim() || "";
  p.bg_insurance = document.getElementById(`bg-${id}`)?.innerText.trim() || "";
  p.cwr_po_received = document.getElementById(`cwr-${id}`)?.innerText.trim() || "";
  p.workscope = document.getElementById(`workscope-${id}`)?.innerText.trim() || "";
  p.cost_proposal = document.getElementById(`cost-${id}`)?.innerText.trim() || "";
  p.ccc_readiness_manpower = document.getElementById(`ccc-${id}`)?.innerText.trim() || "";
  p.procurement_material = document.getElementById(`procurement-${id}`)?.innerText.trim() || "";
  p.delivery_material_site = document.getElementById(`delivery-${id}`)?.innerText.trim() || "";
  p.fcb_booking = document.getElementById(`fcb-${id}`)?.innerText.trim() || "";
  p.mob_execution = document.getElementById(`mob-${id}`)?.innerText.trim() || "";
  p.handover_site = document.getElementById(`handover-${id}`)?.innerText.trim() || "";
  p.demob_date = document.getElementById(`demob-${id}`)?.innerText.trim() || "";
  p.close_out_report = document.getElementById(`close-${id}`)?.innerText.trim() || "";
}

async function saveProject(id) {
  const project_description = document.getElementById(`desc-${id}`).innerText.trim();
  const status = document.getElementById(`status-${id}`).innerText.trim();
  const remarks = document.getElementById(`remarks-${id}`).innerText.trim();

  const tendering = document.getElementById(`tendering-${id}`).innerText.trim();
  const bg_insurance = document.getElementById(`bg-${id}`).innerText.trim();
  const cwr_po_received = document.getElementById(`cwr-${id}`).innerText.trim();
  const workscope = document.getElementById(`workscope-${id}`).innerText.trim();
  const cost_proposal = document.getElementById(`cost-${id}`).innerText.trim();
  const ccc_readiness_manpower = document.getElementById(`ccc-${id}`).innerText.trim();
  const procurement_material = document.getElementById(`procurement-${id}`).innerText.trim();
  const delivery_material_site = document.getElementById(`delivery-${id}`).innerText.trim();
  const fcb_booking = document.getElementById(`fcb-${id}`).innerText.trim();
  const mob_execution = document.getElementById(`mob-${id}`).innerText.trim();
  const handover_site = document.getElementById(`handover-${id}`).innerText.trim();
  const demob_date = document.getElementById(`demob-${id}`).innerText.trim();
  const close_out_report = document.getElementById(`close-${id}`).innerText.trim();

  await fetch(`/api/projects/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
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
    })
  });
}

function autoSave(id) {
  updateLocalProject(id);
  saveProject(id);
}

async function uploadFile(id) {
  const fileInput = document.getElementById(`file-${id}`);

  if (!fileInput.files.length) {
    alert("Please choose a file first");
    return;
  }

  const formData = new FormData();
  formData.append("file", fileInput.files[0]);

  await fetch(`/api/upload/${id}`, {
    method: "POST",
    body: formData
  });

  alert("SI report uploaded ✅");
  loadProjects();
}

async function removeFile(id) {
  if (!confirm("Remove this SI report?")) return;

  await fetch(`/api/upload/${id}`, {
    method: "DELETE"
  });

  loadProjects();
}

async function deleteProject(id) {
  if (!confirm("Delete this project?")) return;

  await fetch(`/api/projects/${id}`, {
    method: "DELETE"
  });

  loadProjects();
}

function logout() {
  if (!confirm("确定要退出吗？")) return;

  // 🔥 先强制保存当前页
  document.querySelectorAll("#table tr").forEach(row => {
    const descCell = row.querySelector("[id^='desc-']");
    if (!descCell) return;

    const id = Number(descCell.id.replace("desc-", ""));
    updateLocalProject(id);
    saveProject(id);
  });

  document.getElementById("app").style.display = "none";
  document.getElementById("login").style.display = "flex";
}

let zoomLevel = 1;

function zoomIn() {
  zoomLevel += 0.1;
  document.body.style.zoom = zoomLevel;
}

function zoomOut() {
  zoomLevel -= 0.1;
  document.body.style.zoom = zoomLevel;
}

function exportExcel() {
  const csv = [];

  const headers = [
    "ID", "Project", "Status", "Tendering", "BG", "CWR/PO",
    "Workscope", "SI Report", "Cost", "CCC", "Procurement",
    "Delivery", "FCB", "Mob", "Handover", "Demob", "Close Out", "Remarks"
  ];

  csv.push(headers.join(","));

  allProjects.forEach((p, index) => {
    const rowData = [
      index + 1,
      p.project_description || "",
      p.status || "",
      p.tendering || "",
      p.bg_insurance || "",
      p.cwr_po_received || "",
      p.workscope || "",
      p.si_report || "NA",
      p.cost_proposal || "",
      p.ccc_readiness_manpower || "",
      p.procurement_material || "",
      p.delivery_material_site || "",
      p.fcb_booking || "",
      p.mob_execution || "",
      p.handover_site || "",
      p.demob_date || "",
      p.close_out_report || "",
      p.remarks || ""
    ];

    csv.push(rowData.map(value =>
      `"${String(value).replace(/"/g, '""').replace(/\n/g, " ").trim()}"`
    ).join(","));
  });

  const blob = new Blob([csv.join("\n")], { type: "text/csv" });

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "project_dashboard.csv";
  a.click();
}

function renderPagination() {
  let pagination = document.getElementById("pagination");

  if (!pagination) {
    pagination = document.createElement("div");
    pagination.id = "pagination";
    document.querySelector("#dashboardPage .table-wrapper").after(pagination);
  }

  if (searchMode) {
    pagination.innerHTML = "";
    return;
  }

  const totalPages = Math.min(Math.ceil(allProjects.length / rowsPerPage), maxPages);

  let buttons = "";

  buttons += `<button onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? "disabled" : ""}>‹</button>`;

  for (let i = 1; i <= totalPages; i++) {
    buttons += `<button class="${currentPage === i ? "active-page" : ""}" onclick="changePage(${i})">${i}</button>`;
  }

  buttons += `<button onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? "disabled" : ""}>›</button>`;

  pagination.innerHTML = buttons;
}

function changePage(page) {
  const totalPages = Math.min(Math.ceil(allProjects.length / rowsPerPage), maxPages);

  if (page < 1 || page > totalPages) return;

  document.querySelectorAll("#table tr").forEach(row => {
    const descCell = row.querySelector("[id^='desc-']");
    if (!descCell) return;

    const id = Number(descCell.id.replace("desc-", ""));
    updateLocalProject(id);
    saveProject(id);
  });

  currentPage = page;
  searchMode = false;
  renderProjects();
}

function searchById() {
  const id = Number(document.getElementById("searchId").value);

  if (!id) {
    alert("Please enter an ID");
    return;
  }

  const found = allProjects
    .map((p, index) => ({ ...p, displayId: index + 1 }))
    .filter(p => p.displayId === id);

  if (!found.length) {
    alert("ID not found");
    return;
  }

  searchMode = true;
  const table = document.getElementById("table");
  table.innerHTML = "";

  found.forEach((p) => {
    table.innerHTML += `
      <tr>
        <td>${p.displayId}</td>
        <td contenteditable="true" id="desc-${p.id}" onblur="autoSave(${p.id})">${p.project_description || ""}</td>
        <td contenteditable="true" id="status-${p.id}" onblur="autoSave(${p.id})">${p.status || ""}</td>
        <td contenteditable="true" id="tendering-${p.id}" onblur="autoSave(${p.id})">${p.tendering || ""}</td>
        <td contenteditable="true" id="bg-${p.id}" onblur="autoSave(${p.id})">${p.bg_insurance || ""}</td>
        <td contenteditable="true" id="cwr-${p.id}" onblur="autoSave(${p.id})">${p.cwr_po_received || ""}</td>
        <td contenteditable="true" id="workscope-${p.id}" onblur="autoSave(${p.id})">${p.workscope || ""}</td>

        <td>
          ${p.si_report ? `
            <div class="file-box">
              📄 <a href="/uploads/${p.si_report}" target="_blank">${p.si_report}</a>
              <button class="delete-file-btn" onclick="removeFile(${p.id})">❌</button>
            </div>
          ` : ""}

          <div class="upload-box">
            <input type="file" id="file-${p.id}">
            <button onclick="uploadFile(${p.id})">Upload</button>
          </div>
        </td>

        <td contenteditable="true" id="cost-${p.id}" onblur="autoSave(${p.id})">${p.cost_proposal || ""}</td>
        <td contenteditable="true" id="ccc-${p.id}" onblur="autoSave(${p.id})">${p.ccc_readiness_manpower || ""}</td>
        <td contenteditable="true" id="procurement-${p.id}" onblur="autoSave(${p.id})">${p.procurement_material || ""}</td>
        <td contenteditable="true" id="delivery-${p.id}" onblur="autoSave(${p.id})">${p.delivery_material_site || ""}</td>
        <td contenteditable="true" id="fcb-${p.id}" onblur="autoSave(${p.id})">${p.fcb_booking || ""}</td>
        <td contenteditable="true" id="mob-${p.id}" onblur="autoSave(${p.id})">${p.mob_execution || ""}</td>
        <td contenteditable="true" id="handover-${p.id}" onblur="autoSave(${p.id})">${p.handover_site || ""}</td>
        <td contenteditable="true" id="demob-${p.id}" onblur="autoSave(${p.id})">${p.demob_date || ""}</td>
        <td contenteditable="true" id="close-${p.id}" onblur="autoSave(${p.id})">${p.close_out_report || ""}</td>
        <td contenteditable="true" id="remarks-${p.id}" onblur="autoSave(${p.id})">${p.remarks || ""}</td>

        <td>
          <button onclick="deleteProject(${p.id})">Delete</button>
        </td>
      </tr>
    `;
  });

  renderPagination();
}

function clearSearch() {
  document.getElementById("searchId").value = "";
  searchMode = false;
  renderProjects();
}

function toggleMenu() {
  const box = document.getElementById("menuBox");
  box.style.display = box.style.display === "block" ? "none" : "block";
}

function goDashboard() {
  document.getElementById("dashboardPage").style.display = "block";
  document.getElementById("timelinePage").style.display = "none";
}

function goTimeline() {
  document.querySelectorAll("#table tr").forEach(row => {
    const descCell = row.querySelector("[id^='desc-']");
    if (!descCell) return;

    const id = Number(descCell.id.replace("desc-", ""));
    updateLocalProject(id);
    saveProject(id);
  });

  document.getElementById("dashboardPage").style.display = "none";
  document.getElementById("timelinePage").style.display = "block";
 loadTimeline();
}

async function addTimelineRow() {
  const year = document.getElementById("timelineYear")?.value || 2026;

  const res = await fetch("/api/timeline", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      year,
      months: Array(12).fill(""),
      status: ""
    })
  });

  const newRow = await res.json();

  // 🔥 加在最上面
  timelineData.unshift(newRow);

  // 🔥 关键：保持在第一页
  timelinePage = 1;

  renderTimeline();
}

function renderTimeline() {
  const table = document.getElementById("timelineTable");
  table.innerHTML = "";

  const start = (timelinePage - 1) * timelineRowsPerPage;
  const end = start + timelineRowsPerPage;
  const pageData = timelineData.slice(start, end);

  pageData.forEach((row) => {
    table.innerHTML += `
      <tr>
        ${row.months.map((m, monthIndex) => `
          <td contenteditable="true" onblur="updateTimelineCell(${row.id}, ${monthIndex}, this.innerText)">${m}</td>
        `).join("")}

        <td contenteditable="true" onblur="updateTimelineStatus(${row.id}, this.innerText)">${row.status || ""}</td>

        <td>
          <button onclick="deleteTimelineRowById(${row.id})">Delete</button>
        </td>
      </tr>
    `;
  });

  renderTimelinePagination();
}

function updateTimelineCell(id, monthIndex, value) {
  const row = timelineData.find(item => item.id === id);
  if (!row) return;

  row.months[monthIndex] = value.trim();
  saveTimelineRow(id);
}

function updateTimelineStatus(id, value) {
  const row = timelineData.find(item => item.id === id);
  if (!row) return;

  row.status = value.trim();
  saveTimelineRow(id);
}

async function deleteTimelineRowById(id) {
  if (!confirm("Delete this timeline row?")) return;

  await fetch(`/api/timeline/${id}`, {
    method: "DELETE"
  });

  timelineData = timelineData.filter(item => item.id !== id);

  const totalPages = Math.max(1, Math.ceil(timelineData.length / timelineRowsPerPage));
  if (timelinePage > totalPages) timelinePage = totalPages;

  renderTimeline();
}

function renderTimelinePagination() {
  let div = document.getElementById("timelinePagination");

  if (!div) {
    div = document.createElement("div");
    div.id = "timelinePagination";
    document.querySelector("#timelinePage .table-wrapper").after(div);
  }

  const totalPages = Math.ceil(timelineData.length / timelineRowsPerPage);

  if (totalPages <= 1) {
    div.innerHTML = "";
    return;
  }

  let buttons = "";

  buttons += `<button onclick="changeTimelinePage(${timelinePage - 1})" ${timelinePage === 1 ? "disabled" : ""}>‹</button>`;

  for (let i = 1; i <= totalPages; i++) {
    buttons += `<button class="${timelinePage === i ? "active-page" : ""}" onclick="changeTimelinePage(${i})">${i}</button>`;
  }

  buttons += `<button onclick="changeTimelinePage(${timelinePage + 1})" ${timelinePage === totalPages ? "disabled" : ""}>›</button>`;

  div.innerHTML = buttons;
}

function changeTimelinePage(page) {
  const totalPages = Math.ceil(timelineData.length / timelineRowsPerPage);

  if (page < 1 || page > totalPages) return;

  timelinePage = page;
  renderTimeline();
}

async function saveTimelineRow(id) {
  const row = timelineData.find(item => item.id === id);
  if (!row) return;

  await fetch(`/api/timeline/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      months: row.months,
      status: row.status
    })
  });
}

async function loadTimeline() {
  const yearSelect = document.getElementById("timelineYear");
  const year = yearSelect ? yearSelect.value : "2026";

  const res = await fetch(`/api/timeline?year=${year}`);
  timelineData = await res.json();
  renderTimeline();
}

function exportTimelineExcel() {
  const csv = [];

  const headers = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Status"
  ];

  csv.push(headers.join(","));

  // 🔥 先按 ID 排序（重点）
  const sortedData = [...timelineData].sort((a, b) => a.id - b.id);

  sortedData.forEach(row => {
    const rowData = [
      ...(row.months || Array(12).fill("")),
      row.status || ""
    ];

    csv.push(rowData.map(value =>
      `"${String(value).replace(/"/g, '""').replace(/\n/g, " ").trim()}"`
    ).join(","));
  });

  const blob = new Blob([csv.join("\n")], { type: "text/csv" });

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "timeline.csv";
  a.click();
}