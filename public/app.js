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
let deploymentSearchMode = false;
let selectMode = {
  dashboard: false,
  pipeline: false,
  timeline: false,
  deployment: false
};

let selectedIds = {
  dashboard: new Set(),
  pipeline: new Set(),
  timeline: new Set(),
  deployment: new Set()
};

let timelineData = [];
let timelinePage = 1;
const timelineRowsPerPage = 15;

let allProjects = [];
let currentPage = 1;
const rowsPerPage = 15;
const maxPages = 10;
let searchMode = false;

let pipelineData = [];
let pipelinePage = 1;
const pipelineRowsPerPage = 20;
const pipelineMaxPages = 10;
let pipelineSearchMode = false;
let deploymentData = [];
let deploymentPage = 1;
const deploymentRowsPerPage = 20;
const deploymentMaxPages = 10;

async function loadProjects() {
  const res = await fetch("/api/projects");
  const data = await res.json();

  allProjects = data;
  renderProjects();
}

function renderProjects() {

 // 🔥 改成安全版
const col = document.querySelector(".dashboard-select-col");
if (col) {
  col.style.display = selectMode.dashboard ? "" : "none";
}

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
  ${selectMode.dashboard ? `
    <td><input type="checkbox" onchange="toggleRow(${p.id}, 'dashboard')"></td>
  ` : ""}
  <td>${p.displayId}</td>
          <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="desc" id="desc-${p.id}" onblur="autoSave(${p.id})">${p.project_description || ""}</td>

          <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="status" id="status-${p.id}" onblur="autoSave(${p.id})">${p.status || ""}</td>

          <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="tendering" id="tendering-${p.id}" onblur="autoSave(${p.id})">${p.tendering || ""}</td>

          <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="bg" id="bg-${p.id}" onblur="autoSave(${p.id})">${p.bg_insurance || ""}</td>

          <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="cwr" id="cwr-${p.id}" onblur="autoSave(${p.id})">${p.cwr_po_received || ""}</td>

         <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="workscope" id="workscope-${p.id}" onblur="autoSave(${p.id})">${p.workscope || ""}</td>


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

        <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="cost" id="cost-${p.id}" onblur="autoSave(${p.id})">${p.cost_proposal || ""}</td>

        <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="ccc" id="ccc-${p.id}" onblur="autoSave(${p.id})">${p.ccc_readiness_manpower || ""}</td>

        <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="procurement" id="procurement-${p.id}" onblur="autoSave(${p.id})">${p.procurement_material || ""}</td>

        <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="delivery" id="delivery-${p.id}" onblur="autoSave(${p.id})">${p.delivery_material_site || ""}</td>

        <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="fcb" id="fcb-${p.id}" onblur="autoSave(${p.id})">${p.fcb_booking || ""}</td>

        <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="mob" id="mob-${p.id}" onblur="autoSave(${p.id})">${p.mob_execution || ""}</td>

        <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="handover" id="handover-${p.id}" onblur="autoSave(${p.id})">${p.handover_site || ""}</td>

        <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="demob" id="demob-${p.id}" onblur="autoSave(${p.id})">${p.demob_date || ""}</td>

        <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="close" id="close-${p.id}" onblur="autoSave(${p.id})">${p.close_out_report || ""}</td>

         <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="remarks" id="remarks-${p.id}" onblur="autoSave(${p.id})">${p.remarks || ""}</td>
       
      </tr>
    `;
  });

  renderPagination();
  // 👉 加在这里
loadPageTitle("dashboard");
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

  const col = document.querySelector(".dashboard-select-col");
  if (col) {
    col.style.display = selectMode.dashboard ? "" : "none";
  }
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
  ${selectMode.dashboard ? `
    <td><input type="checkbox" onchange="toggleRow(${p.id}, 'dashboard')"></td>
  ` : ""}
  <td>${p.displayId}</td>

  <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="desc" id="desc-${p.id}" onblur="autoSave(${p.id})">${p.project_description || ""}</td>
  <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="status" id="status-${p.id}" onblur="autoSave(${p.id})">${p.status || ""}</td>
  <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="tendering" id="tendering-${p.id}" onblur="autoSave(${p.id})">${p.tendering || ""}</td>
  <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="bg" id="bg-${p.id}" onblur="autoSave(${p.id})">${p.bg_insurance || ""}</td>
  <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="cwr" id="cwr-${p.id}" onblur="autoSave(${p.id})">${p.cwr_po_received || ""}</td>
  <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="workscope" id="workscope-${p.id}" onblur="autoSave(${p.id})">${p.workscope || ""}</td>

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

  <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="cost" id="cost-${p.id}" onblur="autoSave(${p.id})">${p.cost_proposal || ""}</td>
  <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="ccc" id="ccc-${p.id}" onblur="autoSave(${p.id})">${p.ccc_readiness_manpower || ""}</td>
  <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="procurement" id="procurement-${p.id}" onblur="autoSave(${p.id})">${p.procurement_material || ""}</td>
  <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="delivery" id="delivery-${p.id}" onblur="autoSave(${p.id})">${p.delivery_material_site || ""}</td>
  <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="fcb" id="fcb-${p.id}" onblur="autoSave(${p.id})">${p.fcb_booking || ""}</td>
  <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="mob" id="mob-${p.id}" onblur="autoSave(${p.id})">${p.mob_execution || ""}</td>
  <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="handover" id="handover-${p.id}" onblur="autoSave(${p.id})">${p.handover_site || ""}</td>
  <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="demob" id="demob-${p.id}" onblur="autoSave(${p.id})">${p.demob_date || ""}</td>
  <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="close" id="close-${p.id}" onblur="autoSave(${p.id})">${p.close_out_report || ""}</td>
  <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="remarks" id="remarks-${p.id}" onblur="autoSave(${p.id})">${p.remarks || ""}</td>

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
  document.getElementById("pipelinePage").style.display = "none";
  document.getElementById("deploymentPage").style.display = "none";

  loadPageTitle("dashboard");
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
  document.getElementById("pipelinePage").style.display = "none";
  document.getElementById("deploymentPage").style.display = "none";

  loadTimeline();

  setTimeout(() => {
    loadPageTitle("timeline");
  }, 50);
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

 const col = document.querySelector(".timeline-select-col");
if (col) {
  col.style.display = selectMode.timeline ? "" : "none";
}

  const table = document.getElementById("timelineTable");
  table.innerHTML = "";

  const start = (timelinePage - 1) * timelineRowsPerPage;
  const end = start + timelineRowsPerPage;
  const pageData = timelineData.slice(start, end);

  pageData.forEach((row) => {
    table.innerHTML += `
      <tr>
  ${selectMode.timeline ? `
    <td><input type="checkbox" onchange="toggleRow(${row.id}, 'timeline')"></td>
  ` : ""}

  ${row.months.map((m, monthIndex) => `
    <td 
      contenteditable="true"
      data-fill="true"
      data-module="timeline"
      data-id="${row.id}"
      data-field="${monthIndex}"
      onblur="updateTimelineCell(${row.id}, ${monthIndex}, this.innerText)"
    >${m}</td>
  `).join("")}

  <td 
    contenteditable="true"
    data-fill="true"
    data-module="timeline"
    data-id="${row.id}"
    data-field="status"
    onblur="updateTimelineStatus(${row.id}, this.innerText)"
  >${row.status || ""}</td>


</tr>
    `;
  });

  renderTimelinePagination();
  loadPageTitle("timeline");
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

  timelinePage = 1;

  renderTimeline();
}

function exportTimelineExcel() {
  const csv = [];

  const headers = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Status"
  ];

  csv.push(headers.join(","));

  // ✅ 跟 Timeline 画面一样：新的 row 在上面
  const sortedData = [...timelineData].sort((a, b) => b.id - a.id);

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

/* =========================
   PIPE-IN LINER
========================= */

// 切换页面

function goPipeline() {
  document.getElementById("dashboardPage").style.display = "none";
  document.getElementById("timelinePage").style.display = "none";
  document.getElementById("pipelinePage").style.display = "block";
  document.getElementById("deploymentPage").style.display = "none";

  loadPipeline();

  setTimeout(() => {
    loadPageTitle("pipeline");
  }, 50);
}

// 读取数据
async function loadPipeline() {
  const res = await fetch("/api/pipeline");
  pipelineData = await res.json();

  pipelinePage = 1; // ✅ ADD THIS

  renderPipeline();
}


// 渲染表格
// 渲染表格
function renderPipeline() {

  const col = document.querySelector(".pipeline-select-col");
  if (col) {
    col.style.display = selectMode.pipeline ? "" : "none";
  }

  const table = document.getElementById("pipelineTable");
  table.innerHTML = "";

  let displayData = pipelineData.map((p, index) => ({
    ...p,
    displayId: index + 1
  }));

  // 每页最多 20 row
  if (!pipelineSearchMode) {
    const start = (pipelinePage - 1) * pipelineRowsPerPage;
    const end = start + pipelineRowsPerPage;
    displayData = displayData.slice(start, end);
  }

  displayData.forEach((row) => {
    table.innerHTML += `
      <tr>
  ${selectMode.pipeline ? `
    <td><input type="checkbox" onchange="toggleRow(${row.id}, 'pipeline')"></td>
  ` : ""}
  <td>${row.displayId}</td>

        <td contenteditable="true" data-fill="true" data-module="pipeline" data-id="${row.id}" data-field="description" onblur="updatePipeline(${row.id}, 'description', this.innerText)">${row.description || ""}</td>

        <td contenteditable="true" data-fill="true" data-module="pipeline" data-id="${row.id}" data-field="status" onblur="updatePipeline(${row.id}, 'status', this.innerText)">${row.status || ""}</td>

        <td contenteditable="true" data-fill="true" data-module="pipeline" data-id="${row.id}" data-field="presentation" onblur="updatePipeline(${row.id}, 'presentation', this.innerText)">${row.presentation || ""}</td>

      <td contenteditable="true" data-fill="true" data-module="pipeline" data-id="${row.id}" data-field="commercial" onblur="updatePipeline(${row.id}, 'commercial', this.innerText)">${row.commercial || ""}</td>

      <td contenteditable="true" data-fill="true" data-module="pipeline" data-id="${row.id}" data-field="technical" onblur="updatePipeline(${row.id}, 'technical', this.innerText)">${row.technical || ""}</td>

      <td contenteditable="true" data-fill="true" data-module="pipeline" data-id="${row.id}" data-field="site_visit" onblur="updatePipeline(${row.id}, 'site_visit', this.innerText)">${row.site_visit || ""}</td>

        <td contenteditable="true" data-fill="true" data-module="pipeline" data-id="${row.id}" data-field="received_orders" onblur="updatePipeline(${row.id}, 'received_orders', this.innerText)">${row.received_orders || ""}</td>

          <td contenteditable="true" data-fill="true" data-module="pipeline" data-id="${row.id}" data-field="issue_po" onblur="updatePipeline(${row.id}, 'issue_po', this.innerText)">${row.issue_po || ""}</td>

    <td contenteditable="true" data-fill="true" data-module="pipeline" data-id="${row.id}" data-field="transport" onblur="updatePipeline(${row.id}, 'transport', this.innerText)">${row.transport || ""}</td>

    <td contenteditable="true" data-fill="true" data-module="pipeline" data-id="${row.id}" data-field="lead_time" onblur="updatePipeline(${row.id}, 'lead_time', this.innerText)">${row.lead_time || ""}</td>

    <td contenteditable="true" data-fill="true" data-module="pipeline" data-id="${row.id}" data-field="etb" onblur="updatePipeline(${row.id}, 'etb', this.innerText)">${row.etb || ""}</td>

    <td contenteditable="true" data-fill="true" data-module="pipeline" data-id="${row.id}" data-field="eta" onblur="updatePipeline(${row.id}, 'eta', this.innerText)">${row.eta || ""}</td>

    <td contenteditable="true" data-fill="true" data-module="pipeline" data-id="${row.id}" data-field="transport_site" onblur="updatePipeline(${row.id}, 'transport_site', this.innerText)">${row.transport_site || ""}</td>

    <td contenteditable="true" data-fill="true" data-module="pipeline" data-id="${row.id}" data-field="do_acceptance" onblur="updatePipeline(${row.id}, 'do_acceptance', this.innerText)">${row.do_acceptance || ""}</td>

    <td contenteditable="true" data-fill="true" data-module="pipeline" data-id="${row.id}" data-field="install_start" onblur="updatePipeline(${row.id}, 'install_start', this.innerText)">${row.install_start || ""}</td>

    <td contenteditable="true" data-fill="true" data-module="pipeline" data-id="${row.id}" data-field="project_end" onblur="updatePipeline(${row.id}, 'project_end', this.innerText)">${row.project_end || ""}</td>

    <td contenteditable="true" data-fill="true" data-module="pipeline" data-id="${row.id}" data-field="remarks" onblur="updatePipeline(${row.id}, 'remarks', this.innerText)">${row.remarks || ""}</td>

        
      </tr>
    `;
  });

  renderPipelinePagination();
  loadPageTitle("pipeline");
}
// 更新数据（自动保存）
async function updatePipeline(id, field, value) {
  const row = pipelineData.find(r => r.id === id);
  if (!row) return;

  row[field] = value.trim();

  await fetch(`/api/pipeline/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(row)
  });
}

// 新增
async function addPipeline() {
  const description = document.getElementById("pl-desc").value;
  const status = document.getElementById("pl-status").value;
  const remarks = document.getElementById("pl-remarks").value;

  const res = await fetch("/api/pipeline", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description, status, remarks })
  });

  const newRow = await res.json();

  // ❌ 删掉这个
  // pipelineData.unshift(newRow);

  // ✅ 改成这个（加在最后）
  pipelineData.push(newRow);

  // ✅ 自动跳到最后一页（看到新数据）
  const totalPages = Math.min(
    Math.ceil(pipelineData.length / pipelineRowsPerPage),
    pipelineMaxPages
  );

  pipelinePage = totalPages;

  document.getElementById("pl-desc").value = "";
  document.getElementById("pl-status").value = "";
  document.getElementById("pl-remarks").value = "";

  renderPipeline();
}

// 删除


// Export
function exportPipeline() {
  const csv = [];

  const headers = [
  "Project Description",
  "Status Complete",
  "Presentation to Client",
  "Commercial Proposal",
  "Technical Proposal",
  "Site Visit",
  "Received Orders",
  "Issue PO",
  "Check Transport/Shipment",
  "Delivery Lead Time",
  "ETB",
  "ETA",
  "Transport to Site",
  "DO Acceptance",
  "Project Installation Start",
  "Project End",
  "Remarks"
];

  csv.push(headers.join(","));
  const sortedData = [...pipelineData];

  sortedData.forEach(row => {
    csv.push([
      row.description || "",
      row.status || "",
      row.presentation || "",
      row.commercial || "",
      row.technical || "",
      row.site_visit || "",
      row.received_orders || "",
      row.issue_po || "",
      row.transport || "",
      row.lead_time || "",
      row.etb || "",
      row.eta || "",
      row.transport_site || "",
      row.do_acceptance || "",
      row.install_start || "",
      row.project_end || "",
      row.remarks || ""
    ].map(v => `"${v}"`).join(","));
  });

  const blob = new Blob([csv.join("\n")], { type: "text/csv" });

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "pipeline.csv";
  a.click();
}

function searchPipeline() {
  const id = Number(document.getElementById("pipelineSearchId").value);

  if (!id) {
    alert("Please enter ID");
    return;
  }

  const found = pipelineData
    .map((p, index) => ({ ...p, displayId: index + 1 }))
    .filter(p => p.displayId === id);

  if (!found.length) {
    alert("ID not found");
    return;
  }

  pipelineSearchMode = true;

  const table = document.getElementById("pipelineTable");
  table.innerHTML = "";

  found.forEach((row) => {
    table.innerHTML += `
     <tr>
  ${selectMode.pipeline ? `
    <td><input type="checkbox" onchange="toggleRow(${row.id}, 'pipeline')"></td>
  ` : ""}
  <td>${row.displayId}</td>

  <td 
    contenteditable="true"
    data-fill="true"
    data-module="pipeline"
    data-id="${row.id}"
    data-field="description"
    onblur="updatePipeline(${row.id}, 'description', this.innerText)"
  >${row.description || ""}</td>

  <td 
    contenteditable="true"
    data-fill="true"
    data-module="pipeline"
    data-id="${row.id}"
    data-field="status"
    onblur="updatePipeline(${row.id}, 'status', this.innerText)"
  >${row.status || ""}</td>

  <td 
    contenteditable="true"
    data-fill="true"
    data-module="pipeline"
    data-id="${row.id}"
    data-field="presentation"
    onblur="updatePipeline(${row.id}, 'presentation', this.innerText)"
  >${row.presentation || ""}</td>

  <td 
    contenteditable="true"
    data-fill="true"
    data-module="pipeline"
    data-id="${row.id}"
    data-field="commercial"
    onblur="updatePipeline(${row.id}, 'commercial', this.innerText)"
  >${row.commercial || ""}</td>

  <td 
    contenteditable="true"
    data-fill="true"
    data-module="pipeline"
    data-id="${row.id}"
    data-field="technical"
    onblur="updatePipeline(${row.id}, 'technical', this.innerText)"
  >${row.technical || ""}</td>

  <td 
    contenteditable="true"
    data-fill="true"
    data-module="pipeline"
    data-id="${row.id}"
    data-field="site_visit"
    onblur="updatePipeline(${row.id}, 'site_visit', this.innerText)"
  >${row.site_visit || ""}</td>

  <td 
    contenteditable="true"
    data-fill="true"
    data-module="pipeline"
    data-id="${row.id}"
    data-field="received_orders"
    onblur="updatePipeline(${row.id}, 'received_orders', this.innerText)"
  >${row.received_orders || ""}</td>

  <td 
    contenteditable="true"
    data-fill="true"
    data-module="pipeline"
    data-id="${row.id}"
    data-field="issue_po"
    onblur="updatePipeline(${row.id}, 'issue_po', this.innerText)"
  >${row.issue_po || ""}</td>

  <td 
    contenteditable="true"
    data-fill="true"
    data-module="pipeline"
    data-id="${row.id}"
    data-field="transport"
    onblur="updatePipeline(${row.id}, 'transport', this.innerText)"
  >${row.transport || ""}</td>

  <td 
    contenteditable="true"
    data-fill="true"
    data-module="pipeline"
    data-id="${row.id}"
    data-field="lead_time"
    onblur="updatePipeline(${row.id}, 'lead_time', this.innerText)"
  >${row.lead_time || ""}</td>

  <td 
    contenteditable="true"
    data-fill="true"
    data-module="pipeline"
    data-id="${row.id}"
    data-field="etb"
    onblur="updatePipeline(${row.id}, 'etb', this.innerText)"
  >${row.etb || ""}</td>

  <td 
    contenteditable="true"
    data-fill="true"
    data-module="pipeline"
    data-id="${row.id}"
    data-field="eta"
    onblur="updatePipeline(${row.id}, 'eta', this.innerText)"
  >${row.eta || ""}</td>

  <td 
    contenteditable="true"
    data-fill="true"
    data-module="pipeline"
    data-id="${row.id}"
    data-field="transport_site"
    onblur="updatePipeline(${row.id}, 'transport_site', this.innerText)"
  >${row.transport_site || ""}</td>

  <td 
    contenteditable="true"
    data-fill="true"
    data-module="pipeline"
    data-id="${row.id}"
    data-field="do_acceptance"
    onblur="updatePipeline(${row.id}, 'do_acceptance', this.innerText)"
  >${row.do_acceptance || ""}</td>

  <td 
    contenteditable="true"
    data-fill="true"
    data-module="pipeline"
    data-id="${row.id}"
    data-field="install_start"
    onblur="updatePipeline(${row.id}, 'install_start', this.innerText)"
  >${row.install_start || ""}</td>

  <td 
    contenteditable="true"
    data-fill="true"
    data-module="pipeline"
    data-id="${row.id}"
    data-field="project_end"
    onblur="updatePipeline(${row.id}, 'project_end', this.innerText)"
  >${row.project_end || ""}</td>

  <td 
    contenteditable="true"
    data-fill="true"
    data-module="pipeline"
    data-id="${row.id}"
    data-field="remarks"
    onblur="updatePipeline(${row.id}, 'remarks', this.innerText)"
  >${row.remarks || ""}</td>

  
</tr>
       
    `;
  });
}

function clearPipelineSearch() {
  document.getElementById("pipelineSearchId").value = "";
  pipelineSearchMode = false;
  pipelinePage = 1;  
  renderPipeline();
}

function renderPipelinePagination() {
  let div = document.getElementById("pipelinePagination");

  if (!div) {
    div = document.createElement("div");
    div.id = "pipelinePagination";
    document.querySelector("#pipelinePage .table-wrapper").after(div);
  }

  if (pipelineSearchMode) {
    div.innerHTML = "";
    return;
  }

  const totalPages = Math.min(
    Math.ceil(pipelineData.length / pipelineRowsPerPage),
    pipelineMaxPages
  );

  let buttons = "";

  buttons += `<button onclick="changePipelinePage(${pipelinePage - 1})" ${pipelinePage === 1 ? "disabled" : ""}>‹</button>`;

  for (let i = 1; i <= totalPages; i++) {
    buttons += `<button class="${pipelinePage === i ? "active-page" : ""}" onclick="changePipelinePage(${i})">${i}</button>`;
  }

  buttons += `<button onclick="changePipelinePage(${pipelinePage + 1})" ${pipelinePage === totalPages ? "disabled" : ""}>›</button>`;

  div.innerHTML = buttons;
}

function changePipelinePage(page) {
  const totalPages = Math.min(
    Math.ceil(pipelineData.length / pipelineRowsPerPage),
    pipelineMaxPages
  );

  if (page < 1 || page > totalPages) return;

  pipelinePage = page;
  pipelineSearchMode = false;

  renderPipeline();
}

let fillStartCell = null;
let fillCells = [];

document.addEventListener("mousedown", (e) => {
  const cell = e.target.closest("td[data-fill='true']");
  if (!cell) return;

  fillStartCell = cell;
  fillCells = [cell];
  cell.classList.add("fill-selected");
});

document.addEventListener("mouseover", (e) => {
  if (!fillStartCell) return;

  const cell = e.target.closest("td[data-fill='true']");
  if (!cell) return;

  const sameModule =
    cell.dataset.module === fillStartCell.dataset.module;

  const sameColumn =
    cell.dataset.field === fillStartCell.dataset.field;

  const sameRow =
    cell.parentElement === fillStartCell.parentElement;

  // ✅ allow vertical OR horizontal
  if (sameModule && (sameColumn || sameRow)) {
    if (!fillCells.includes(cell)) {
      fillCells.push(cell);
      cell.classList.add("fill-selected");
    }
  }
});

document.addEventListener("mouseup", async () => {
  if (!fillStartCell || fillCells.length <= 1) {
    fillCells.forEach(c => c.classList.remove("fill-selected"));
    fillStartCell = null;
    fillCells = [];
    return;
  }

  const value = fillStartCell.innerText.trim();

  for (const cell of fillCells) {
    cell.innerText = value;

    const module = cell.dataset.module;
    const id = Number(cell.dataset.id);
    const field = cell.dataset.field;

    if (module === "dashboard") {
      const target = document.getElementById(`${field}-${id}`);
      if (target) target.innerText = value;
      updateLocalProject(id);
      await saveProject(id);
    }

    if (module === "pipeline") {
      await updatePipeline(id, field, value);
    }

    if (module === "deployment") {
  await updateDeployment(id, field, value);
  }
    if (module === "timeline") {
      const row = timelineData.find(r => r.id === id);
      if (!row) continue;

      if (field === "status") {
        row.status = value;
      } else {
        row.months[Number(field)] = value;
      }

      await saveTimelineRow(id);
    }
  }

  fillCells.forEach(c => c.classList.remove("fill-selected"));
  fillStartCell = null;
  fillCells = [];
});

// 🔥 Dashboard refresh
function refreshDashboard() {
  searchMode = false;
  currentPage = 1;
  loadProjects();
}

// 🔥 Timeline refresh
function refreshTimeline() {
  timelinePage = 1;
  loadTimeline();
}

// 🔥 Pipeline refresh
function refreshPipeline() {
  pipelineSearchMode = false;
  pipelinePage = 1;
  loadPipeline();
}

function toggleRow(id, module) {
  const set = selectedIds[module];

  if (set.has(id)) {
    set.delete(id);
  } else {
    set.add(id);
  }
}
function toggleSelect(module) {
  selectMode[module] = !selectMode[module];
  selectedIds[module].clear();

  if (module === "dashboard") renderProjects();
  if (module === "pipeline") renderPipeline();
  if (module === "timeline") renderTimeline();
  if (module === "deployment") renderDeployment();
}

async function bulkDelete(module) {
  if (!selectedIds[module].size) {
    alert("没有选择任何行");
    return;
  }

  if (!confirm("确定删除这些数据？")) return;

  for (const id of selectedIds[module]) {
    if (module === "dashboard") {
      await fetch(`/api/projects/${id}`, { method: "DELETE" });
    }

    if (module === "pipeline") {
      await fetch(`/api/pipeline/${id}`, { method: "DELETE" });
    }

    if (module === "timeline") {
      await fetch(`/api/timeline/${id}`, { method: "DELETE" });
    }

    if (module === "deployment") {
      await fetch(`/api/deployment/${id}`, { method: "DELETE" });
    }
  }

  selectedIds[module].clear();

  if (module === "dashboard") loadProjects();
  if (module === "pipeline") loadPipeline();
  if (module === "timeline") loadTimeline();
  if (module === "deployment") loadDeployment();
}

async function bulkAdd(module) {
  let count = Number(prompt("要新增多少行？最多20"));

  if (!count || count <= 0) return;
  if (count > 20) count = 20;

  for (let i = 0; i < count; i++) {
    if (module === "dashboard") {
      await fetch("/api/projects", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({
          project_description: "",
          status: "",
          remarks: ""
        })
      });
    }

    if (module === "pipeline") {
      await fetch("/api/pipeline", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({
          description: "",
          status: "",
          remarks: ""
        })
      });
    }

    if (module === "timeline") {
      await fetch("/api/timeline", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({
          year: document.getElementById("timelineYear").value,
          months: Array(12).fill(""),
          status: ""
        })
      });
    }

    if (module === "deployment") {
      await fetch("/api/deployment", {
        method: "POST",
        headers: {"Content-Type":"application/json"}
      });
    }
  }

  if (module === "dashboard") loadProjects();
  if (module === "pipeline") loadPipeline();
  if (module === "timeline") loadTimeline();
  if (module === "deployment") loadDeployment();
}

function getPageKey(module) {
  if (module === "deployment") return `title-deployment-page-${deploymentPage}`;
  if (module === "dashboard") return `title-dashboard-page-${currentPage}`;
  if (module === "pipeline") return `title-pipeline-page-${pipelinePage}`;
  if (module === "timeline") {
  const year = document.getElementById("timelineYear")?.value || "2026";
  return `title-timeline-${year}-page-${timelinePage}`;
}
}

function savePageTitle(module) {
  const input = document.getElementById(`${module}Title`);
  if (!input) return;

  const key = getPageKey(module);
  localStorage.setItem(key, input.value);
}

function loadPageTitle(module) {
  const input = document.getElementById(`${module}Title`);
  if (!input) return;

  const key = getPageKey(module);
  input.value = localStorage.getItem(key) || "";
}

/* =========================
   DEPLOYMENT
========================= */

function goDeployment() {
  document.getElementById("dashboardPage").style.display = "none";
  document.getElementById("timelinePage").style.display = "none";
  document.getElementById("pipelinePage").style.display = "none";
  document.getElementById("deploymentPage").style.display = "block";

  loadDeployment();

  setTimeout(() => {
    loadPageTitle("deployment");
  }, 50);
}

async function loadDeployment() {
  const res = await fetch("/api/deployment");
  deploymentData = await res.json();

  deploymentPage = 1;
  renderDeployment();
}

function renderDeployment() {
  const col = document.querySelector(".deployment-select-col");
  if (col) {
    col.style.display = selectMode.deployment ? "" : "none";
  }

  const table = document.getElementById("deploymentTable");
  table.innerHTML = "";

  let displayData = deploymentData.map((d, index) => ({
    ...d,
    displayId: index + 1
  }));

  if (!deploymentSearchMode) {
  const start = (deploymentPage - 1) * deploymentRowsPerPage;
  const end = start + deploymentRowsPerPage;
  displayData = displayData.slice(start, end);
}

  displayData.forEach((row) => {
    table.innerHTML += `
      <tr>
        ${selectMode.deployment ? `
          <td><input type="checkbox" onchange="toggleRow(${row.id}, 'deployment')"></td>
        ` : ""}

        <td>${row.displayId}</td>

        <td contenteditable="true" data-fill="true" data-module="deployment" data-id="${row.id}" data-field="deployment_type" onblur="updateDeployment(${row.id}, 'deployment_type', this.innerText)">${row.deployment_type || ""}</td>

        <td contenteditable="true" data-fill="true" data-module="deployment" data-id="${row.id}" data-field="status" onblur="updateDeployment(${row.id}, 'status', this.innerText)">${row.status || ""}</td>

        <td contenteditable="true" data-fill="true" data-module="deployment" data-id="${row.id}" data-field="date_start" onblur="updateDeployment(${row.id}, 'date_start', this.innerText)">${row.date_start || ""}</td>

        <td contenteditable="true" data-fill="true" data-module="deployment" data-id="${row.id}" data-field="date_complete" onblur="updateDeployment(${row.id}, 'date_complete', this.innerText)">${row.date_complete || ""}</td>

        <td contenteditable="true" data-fill="true" data-module="deployment" data-id="${row.id}" data-field="remarks" onblur="updateDeployment(${row.id}, 'remarks', this.innerText)">${row.remarks || ""}</td>
      </tr>
    `;
  });

  renderDeploymentPagination();
  loadPageTitle("deployment");
}

async function updateDeployment(id, field, value) {
  const row = deploymentData.find(r => r.id === id);
  if (!row) return;

  row[field] = value.trim();

  await fetch(`/api/deployment/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(row)
  });
}

async function addDeployment() {
  const res = await fetch("/api/deployment", {
    method: "POST",
    headers: { "Content-Type": "application/json" }
  });

  const newRow = await res.json();
  deploymentData.push(newRow);

  const totalPages = Math.min(
    Math.ceil(deploymentData.length / deploymentRowsPerPage),
    deploymentMaxPages
  );

  deploymentPage = totalPages;
  renderDeployment();
}

function renderDeploymentPagination() {
  let div = document.getElementById("deploymentPagination");

  if (!div) {
    div = document.createElement("div");
    div.id = "deploymentPagination";
    document.querySelector("#deploymentPage .table-wrapper").after(div);
  }

  const totalPages = Math.min(
    Math.ceil(deploymentData.length / deploymentRowsPerPage),
    deploymentMaxPages
  );

  if (totalPages <= 1) {
    div.innerHTML = "";
    return;
  }

  let buttons = "";

  buttons += `<button onclick="changeDeploymentPage(${deploymentPage - 1})" ${deploymentPage === 1 ? "disabled" : ""}>‹</button>`;

  for (let i = 1; i <= totalPages; i++) {
    buttons += `<button class="${deploymentPage === i ? "active-page" : ""}" onclick="changeDeploymentPage(${i})">${i}</button>`;
  }

  buttons += `<button onclick="changeDeploymentPage(${deploymentPage + 1})" ${deploymentPage === totalPages ? "disabled" : ""}>›</button>`;

  div.innerHTML = buttons;
}

function changeDeploymentPage(page) {
  const totalPages = Math.min(
    Math.ceil(deploymentData.length / deploymentRowsPerPage),
    deploymentMaxPages
  );

  if (page < 1 || page > totalPages) return;

  deploymentPage = page;
  renderDeployment();
}

function refreshDeployment() {
  deploymentSearchMode = false;
  deploymentPage = 1;
  loadDeployment();
}

function exportDeployment() {
  const csv = [];

  const headers = [
    "No.",
    "Deployment Type",
    "Status",
    "Date Start",
    "Date Complete",
    "Remarks"
  ];

  csv.push(headers.join(","));

  deploymentData.forEach((row, index) => {
    const rowData = [
      index + 1,
      row.deployment_type || "",
      row.status || "",
      row.date_start || "",
      row.date_complete || "",
      row.remarks || ""
    ];

    csv.push(rowData.map(value =>
      `"${String(value).replace(/"/g, '""').replace(/\n/g, " ").trim()}"`
    ).join(","));
  });

  const blob = new Blob([csv.join("\n")], { type: "text/csv" });

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "deployment.csv";
  a.click();
}

function searchDeployment() {
  const id = Number(document.getElementById("deploymentSearchId").value);

  if (!id) {
    alert("Please enter ID");
    return;
  }

  const found = deploymentData
    .map((d, index) => ({ ...d, displayId: index + 1 }))
    .filter(d => d.displayId === id);

  if (!found.length) {
    alert("ID not found");
    return;
  }

  deploymentSearchMode = true;

  const table = document.getElementById("deploymentTable");
  table.innerHTML = "";

  found.forEach((row) => {
    table.innerHTML += `
      <tr>
        ${selectMode.deployment ? `
          <td><input type="checkbox" onchange="toggleRow(${row.id}, 'deployment')"></td>
        ` : ""}

        <td>${row.displayId}</td>

        <td contenteditable="true" data-fill="true" data-module="deployment" data-id="${row.id}" data-field="deployment_type" onblur="updateDeployment(${row.id}, 'deployment_type', this.innerText)">${row.deployment_type || ""}</td>
        <td contenteditable="true" data-fill="true" data-module="deployment" data-id="${row.id}" data-field="status" onblur="updateDeployment(${row.id}, 'status', this.innerText)">${row.status || ""}</td>
        <td contenteditable="true" data-fill="true" data-module="deployment" data-id="${row.id}" data-field="date_start" onblur="updateDeployment(${row.id}, 'date_start', this.innerText)">${row.date_start || ""}</td>
        <td contenteditable="true" data-fill="true" data-module="deployment" data-id="${row.id}" data-field="date_complete" onblur="updateDeployment(${row.id}, 'date_complete', this.innerText)">${row.date_complete || ""}</td>
        <td contenteditable="true" data-fill="true" data-module="deployment" data-id="${row.id}" data-field="remarks" onblur="updateDeployment(${row.id}, 'remarks', this.innerText)">${row.remarks || ""}</td>
      </tr>
    `;
  });

  const pagination = document.getElementById("deploymentPagination");
  if (pagination) pagination.innerHTML = "";
}

function clearDeploymentSearch() {
  document.getElementById("deploymentSearchId").value = "";
  deploymentSearchMode = false;
  deploymentPage = 1;
  renderDeployment();
}