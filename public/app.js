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

let applicationData = [];
let applicationPage = 1;
const applicationRowsPerPage = 20;
const applicationMaxPages = 50;
let applicationSearchMode = false;

let deploymentSearchMode = false;
let selectMode = {
  dashboard: false,
  pipeline: false,
  timeline: false,
  deployment: false,
  application: false  
};

let selectedIds = {
  dashboard: new Set(),
  pipeline: new Set(),
  timeline: new Set(),
  deployment: new Set(),
  application: new Set() 
};

let timelineData = [];
let timelinePage = 1;
const timelineRowsPerPage = 15;

let allProjects = [];
let currentPage = 1;
const rowsPerPage = 15;
const maxPages = 50;
let searchMode = false;

let pipelineData = [];
let pipelinePage = 1;
const pipelineRowsPerPage = 20;
const pipelineMaxPages = 50;
let pipelineSearchMode = false;
let deploymentData = [];
let deploymentPage = 1;
const deploymentRowsPerPage = 20;
const deploymentMaxPages = 50;

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

  let displayData = assignGroupDisplayIds(allProjects, "dashboard");

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
      close_out_report: "",
      project_group: getCurrentPageTitle("dashboard")
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
  p.project_group = p.project_group || getCurrentPageTitle("dashboard");
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
  const project_group = allProjects.find(item => item.id === id)?.project_group || getCurrentPageTitle("dashboard");

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
      close_out_report,
      project_group
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

  assignGroupDisplayIds(allProjects, "dashboard").forEach((p) => {
    const rowData = [
      p.displayId,
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

  const currentTitle = getCurrentPageTitle("dashboard");
  const found = assignGroupDisplayIds(allProjects, "dashboard")
    .filter(p => p.displayId === id && (!currentTitle || p.groupTitle === currentTitle));

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
  document.getElementById("applicationPage").style.display = "none"; // ✅ 加这个
  document.getElementById("calculatePage").style.display = "none";

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
  document.getElementById("applicationPage").style.display = "none"; // ✅
  document.getElementById("calculatePage").style.display = "none";

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
  document.getElementById("applicationPage").style.display = "none"; // ✅
  document.getElementById("calculatePage").style.display = "none";

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

  let displayData = assignGroupDisplayIds(pipelineData, "pipeline");

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
    body: JSON.stringify({ description, status, remarks, project_group: getCurrentPageTitle("pipeline") })
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
  const sortedData = assignGroupDisplayIds(pipelineData, "pipeline");

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

  const currentTitle = getCurrentPageTitle("pipeline");
  const found = assignGroupDisplayIds(pipelineData, "pipeline")
    .filter(p => p.displayId === id && (!currentTitle || p.groupTitle === currentTitle));

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
  if (module === "application") {
  await updateApplication(id, field, value);
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
  if (module === "application") renderApplication();
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

    if (module === "application") {
      await fetch(`/api/application/${id}`, { method: "DELETE" });
    }
  }

  selectedIds[module].clear();

  if (module === "dashboard") loadProjects();
  if (module === "pipeline") loadPipeline();
  if (module === "timeline") loadTimeline();
  if (module === "deployment") loadDeployment();
  if (module === "application") loadApplication();
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
          remarks: "",
          project_group: getCurrentPageTitle("dashboard")
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
          remarks: "",
          project_group: getCurrentPageTitle("pipeline")
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
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ project_group: getCurrentPageTitle("deployment") })
      });
    }

    if (module === "application") {
      await fetch("/api/application", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ project_group: getCurrentPageTitle("application") })
      });
    }
  }

  if (module === "dashboard") loadProjects();
  if (module === "pipeline") loadPipeline();
  if (module === "timeline") loadTimeline();
  if (module === "deployment") loadDeployment();
  if (module === "application") loadApplication();
}


function getCurrentPageTitle(module) {
  const input = document.getElementById(`${module}Title`);
  return input ? input.value.trim() : "";
}

function getRowsPerPageByModule(module) {
  if (module === "dashboard") return rowsPerPage;
  if (module === "pipeline") return pipelineRowsPerPage;
  if (module === "deployment") return deploymentRowsPerPage;
  if (module === "application") return applicationRowsPerPage;
  return 20;
}

function getLegacyPageTitle(module, index) {
  const rpp = getRowsPerPageByModule(module);
  const page = Math.floor(index / rpp) + 1;
  return localStorage.getItem(`title-${module}-page-${page}`)?.trim() || "";
}

function getRowGroup(row, module, index) {
  return (row.project_group || "").trim() || getLegacyPageTitle(module, index) || "Untitled";
}

function assignGroupDisplayIds(data, module) {
  const counters = {};

  return data.map((row, index) => {
    const groupTitle = getRowGroup(row, module, index);
    counters[groupTitle] = (counters[groupTitle] || 0) + 1;

    return {
      ...row,
      project_group: groupTitle === "Untitled" ? (row.project_group || "") : groupTitle,
      groupTitle,
      displayId: counters[groupTitle]
    };
  });
}

function getVisibleRowsForModule(module) {
  if (module === "dashboard") {
    const start = (currentPage - 1) * rowsPerPage;
    return allProjects.slice(start, start + rowsPerPage);
  }
  if (module === "pipeline") {
    const start = (pipelinePage - 1) * pipelineRowsPerPage;
    return pipelineData.slice(start, start + pipelineRowsPerPage);
  }
  if (module === "deployment") {
    const start = (deploymentPage - 1) * deploymentRowsPerPage;
    return deploymentData.slice(start, start + deploymentRowsPerPage);
  }
  if (module === "application") {
    const start = (applicationPage - 1) * applicationRowsPerPage;
    return applicationData.slice(start, start + applicationRowsPerPage);
  }
  return [];
}

async function applyTitleToCurrentPage(module) {
  const title = getCurrentPageTitle(module);
  const rows = getVisibleRowsForModule(module);

  for (const row of rows) {
    row.project_group = title;

    if (module === "dashboard") await saveProject(row.id);
    if (module === "pipeline") await updatePipeline(row.id, "project_group", title);
    if (module === "deployment") await updateDeployment(row.id, "project_group", title);
    if (module === "application") await updateApplication(row.id, "project_group", title);
  }
}

function getPageKey(module) {
  if (module === "deployment") return `title-deployment-page-${deploymentPage}`;
  if (module === "dashboard") return `title-dashboard-page-${currentPage}`;
  if (module === "pipeline") return `title-pipeline-page-${pipelinePage}`;

  if (module === "timeline") {
    const year = document.getElementById("timelineYear")?.value || "2026";
    return `title-timeline-${year}-page-${timelinePage}`;
  }

  if (module === "application") {
    return `title-application-page-${applicationPage}`;
  }
}

const titleSaveTimers = {};

function savePageTitle(module) {
  const input = document.getElementById(`${module}Title`);
  if (!input) return;

  const key = getPageKey(module);
  localStorage.setItem(key, input.value);

  // New stable logic: the typed title becomes the group for rows on this page.
  // Debounced so typing NBA does not send 3 separate database updates.
  clearTimeout(titleSaveTimers[module]);
  titleSaveTimers[module] = setTimeout(() => {
    applyTitleToCurrentPage(module);
  }, 500);
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
  document.getElementById("applicationPage").style.display = "none"; // ✅
  document.getElementById("calculatePage").style.display = "none";

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

  let displayData = assignGroupDisplayIds(deploymentData, "deployment");

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
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project_group: getCurrentPageTitle("deployment") })
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

  assignGroupDisplayIds(deploymentData, "deployment").forEach((row) => {
    const rowData = [
      row.displayId,
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

  const currentTitle = getCurrentPageTitle("deployment");
  const found = assignGroupDisplayIds(deploymentData, "deployment")
    .filter(d => d.displayId === id && (!currentTitle || d.groupTitle === currentTitle));

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

function goApplication() {
  document.getElementById("dashboardPage").style.display = "none";
  document.getElementById("timelinePage").style.display = "none";
  document.getElementById("pipelinePage").style.display = "none";
  document.getElementById("deploymentPage").style.display = "none";
  document.getElementById("applicationPage").style.display = "block";
  document.getElementById("calculatePage").style.display = "none";

  loadApplication();

  setTimeout(() => {
    loadPageTitle("application");
  }, 50);
}

async function loadApplication() {
  const res = await fetch("/api/application");
  applicationData = await res.json();

  applicationPage = 1;
  renderApplication();
}

function renderApplication() {
  const col = document.querySelector(".application-select-col");
  if (col) {
    col.style.display = selectMode.application ? "" : "none";
  }

  const table = document.getElementById("applicationTable");
  table.innerHTML = "";

  let displayData = assignGroupDisplayIds(applicationData, "application");

  if (!applicationSearchMode) {
    const start = (applicationPage - 1) * applicationRowsPerPage;
    const end = start + applicationRowsPerPage;
    displayData = displayData.slice(start, end);
  }

  displayData.forEach((row) => {
    table.innerHTML += `
      <tr>
        ${selectMode.application ? `
          <td><input type="checkbox" onchange="toggleRow(${row.id}, 'application')"></td>
        ` : ""}

        <td>${row.displayId}</td>

        <td contenteditable="true" data-fill="true" data-module="application" data-id="${row.id}" data-field="project_description" onblur="updateApplication(${row.id}, 'project_description', this.innerText)">${row.project_description || ""}</td>

        <td contenteditable="true" data-fill="true" data-module="application" data-id="${row.id}" data-field="status" onblur="updateApplication(${row.id}, 'status', this.innerText)">${row.status || ""}</td>

        <td contenteditable="true" data-fill="true" data-module="application" data-id="${row.id}" data-field="date_start" onblur="updateApplication(${row.id}, 'date_start', this.innerText)">${row.date_start || ""}</td>

        <td contenteditable="true" data-fill="true" data-module="application" data-id="${row.id}" data-field="date_complete" onblur="updateApplication(${row.id}, 'date_complete', this.innerText)">${row.date_complete || ""}</td>

        <td contenteditable="true" data-fill="true" data-module="application" data-id="${row.id}" data-field="remarks" onblur="updateApplication(${row.id}, 'remarks', this.innerText)">${row.remarks || ""}</td>
      </tr>
    `;
  });

  renderApplicationPagination();
  loadPageTitle("application");
}

async function updateApplication(id, field, value) {
  const row = applicationData.find(r => r.id === id);
  if (!row) return;

  row[field] = value.trim();

  await fetch(`/api/application/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(row)
  });
}

async function addApplication() {
  const res = await fetch("/api/application", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project_group: getCurrentPageTitle("application") })
  });

  const newRow = await res.json();
  applicationData.push(newRow);

  const totalPages = Math.min(
    Math.ceil(applicationData.length / applicationRowsPerPage),
    applicationMaxPages
  );

  applicationPage = totalPages;
  renderApplication();
}

function renderApplicationPagination() {
  let div = document.getElementById("applicationPagination");

  if (!div) {
    div = document.createElement("div");
    div.id = "applicationPagination";
    document.querySelector("#applicationPage .table-wrapper").after(div);
  }

  if (applicationSearchMode) {
    div.innerHTML = "";
    return;
  }

  const totalPages = Math.min(
    Math.ceil(applicationData.length / applicationRowsPerPage),
    applicationMaxPages
  );

  if (totalPages <= 1) {
    div.innerHTML = "";
    return;
  }

  let buttons = "";

  buttons += `<button onclick="changeApplicationPage(${applicationPage - 1})" ${applicationPage === 1 ? "disabled" : ""}>‹</button>`;

  for (let i = 1; i <= totalPages; i++) {
    buttons += `<button class="${applicationPage === i ? "active-page" : ""}" onclick="changeApplicationPage(${i})">${i}</button>`;
  }

  buttons += `<button onclick="changeApplicationPage(${applicationPage + 1})" ${applicationPage === totalPages ? "disabled" : ""}>›</button>`;

  div.innerHTML = buttons;
}

function changeApplicationPage(page) {
  const totalPages = Math.min(
    Math.ceil(applicationData.length / applicationRowsPerPage),
    applicationMaxPages
  );

  if (page < 1 || page > totalPages) return;

  applicationPage = page;
  applicationSearchMode = false;
  renderApplication();
}

function refreshApplication() {
  applicationSearchMode = false;
  applicationPage = 1;
  loadApplication();
}

function searchApplication() {
  const id = Number(document.getElementById("applicationSearchId").value);

  if (!id) {
    alert("Please enter ID");
    return;
  }

  const currentTitle = getCurrentPageTitle("application");
  const found = assignGroupDisplayIds(applicationData, "application")
    .filter(a => a.displayId === id && (!currentTitle || a.groupTitle === currentTitle));

  if (!found.length) {
    alert("ID not found");
    return;
  }

  applicationSearchMode = true;

  const table = document.getElementById("applicationTable");
  table.innerHTML = "";

  found.forEach((row) => {
    table.innerHTML += `
      <tr>
        ${selectMode.application ? `
          <td><input type="checkbox" onchange="toggleRow(${row.id}, 'application')"></td>
        ` : ""}

        <td>${row.displayId}</td>

        <td contenteditable="true" data-fill="true" data-module="application" data-id="${row.id}" data-field="project_description" onblur="updateApplication(${row.id}, 'project_description', this.innerText)">${row.project_description || ""}</td>
        <td contenteditable="true" data-fill="true" data-module="application" data-id="${row.id}" data-field="status" onblur="updateApplication(${row.id}, 'status', this.innerText)">${row.status || ""}</td>
        <td contenteditable="true" data-fill="true" data-module="application" data-id="${row.id}" data-field="date_start" onblur="updateApplication(${row.id}, 'date_start', this.innerText)">${row.date_start || ""}</td>
        <td contenteditable="true" data-fill="true" data-module="application" data-id="${row.id}" data-field="date_complete" onblur="updateApplication(${row.id}, 'date_complete', this.innerText)">${row.date_complete || ""}</td>
        <td contenteditable="true" data-fill="true" data-module="application" data-id="${row.id}" data-field="remarks" onblur="updateApplication(${row.id}, 'remarks', this.innerText)">${row.remarks || ""}</td>
      </tr>
    `;
  });

  const pagination = document.getElementById("applicationPagination");
  if (pagination) pagination.innerHTML = "";
}

function clearApplicationSearch() {
  document.getElementById("applicationSearchId").value = "";
  applicationSearchMode = false;
  applicationPage = 1;
  renderApplication();
}

function exportApplication() {
  const csv = [];

  const headers = [
    "No.",
    "Project Description",
    "Status",
    "Date Start",
    "Date Complete",
    "Remarks"
  ];

  csv.push(headers.join(","));

  assignGroupDisplayIds(applicationData, "application").forEach((row) => {
    const rowData = [
      row.displayId,
      row.project_description || "",
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
  a.download = "application_license.csv";
  a.click();
}

async function insertPage(module) {
  if (!confirm("Insert new page here?")) return;

  alert("Inserting page...");

  let rowsPerPage = 20;
  let page = 1;
  let apiPath = "";

  if (module === "dashboard") {
    rowsPerPage = 15;
    page = currentPage;
    apiPath = "/api/projects/insert-page";
  }

  if (module === "pipeline") {
    rowsPerPage = 20;
    page = pipelinePage;
    apiPath = "/api/pipeline/insert-page";
  }

  if (module === "deployment") {
    rowsPerPage = 20;
    page = deploymentPage;
    apiPath = "/api/deployment/insert-page";
  }

  if (module === "application") {
    rowsPerPage = 20;
    page = applicationPage;
    apiPath = "/api/application/insert-page";
  }

  await fetch(apiPath, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      page,
      rowsPerPage
    })
  });

  if (module === "dashboard") loadProjects();
  if (module === "pipeline") loadPipeline();
  if (module === "deployment") loadDeployment();
  if (module === "application") loadApplication();

  alert("Page inserted successfully!");
}

function goCalculate() {
  document.getElementById("dashboardPage").style.display = "none";
  document.getElementById("timelinePage").style.display = "none";
  document.getElementById("pipelinePage").style.display = "none";
  document.getElementById("deploymentPage").style.display = "none";
  document.getElementById("applicationPage").style.display = "none";

  document.getElementById("calculatePage").style.display = "block";

  clearCalculation(); // 每次进入清空
}

function calculateModule(data, module) {
  let result = {};
  let total = 0;

  let firstRow = null;
  let lastRow = null;

  const numberedData = assignGroupDisplayIds(data, module);

  numberedData.forEach((row, index) => {
    const groupTitle = getRowGroup(row, module, index);
    if (!groupTitle || groupTitle === "Untitled") return;

    let hasValue = false;

    for (let k in row) {
      if (["id", "sort_order", "displayId", "project_group", "groupTitle"].includes(k)) continue;

      if (row[k] && String(row[k]).trim() !== "") {
        hasValue = true;
        break;
      }
    }

    if (!hasValue) return;

    if (!result[groupTitle]) {
      result[groupTitle] = {
        count: 0,
        start: null,
        end: null
      };
    }

    const rowNo = row.displayId;

    total++;

    if (firstRow === null) firstRow = rowNo;
    lastRow = rowNo;

    if (result[groupTitle].start === null) {
      result[groupTitle].start = rowNo;
    }

    result[groupTitle].end = rowNo;
    result[groupTitle].count++;
  });

  return { result, total, firstRow, lastRow };
}

async function runCalculation() {

  // 🔥 强制加载全部数据（重点！！！）
  await loadProjects();
  await loadPipeline();
  await loadDeployment();
  await loadApplication();

  let html = "";

  html += buildTable(
    "Pipeline",
    calculateModule(pipelineData, "pipeline")
  );

  html += buildTable(
    "Deployment",
    calculateModule(deploymentData, "deployment")
  );

  html += buildTable(
    "Application",
    calculateModule(applicationData, "application")
  );

  html += buildTable(
    "Dashboard",
    calculateModule(allProjects, "dashboard")
  );

  document.getElementById("calculateResult").innerHTML = html;
}

function buildTable(title, dataObj) {
  const { result, total, firstRow, lastRow } = dataObj;

  let html = `
    <h3>${title}</h3>
    <table border="1" style="margin-bottom:20px;">
      <tr>
        <th>Type</th>
        <th>Projects</th>
        <th>Range</th>
      </tr>
  `;

  for (const type in result) {
    const r = result[type];

    html += `
      <tr>
        <td>${type}</td>
        <td>${r.count}</td>
        <td>${r.start} - ${r.end}</td>
      </tr>
    `;
  }

  html += `
    <tr style="font-weight:bold; background:#f2f2f2;">
      <td>Total</td>
      <td>${total}</td>
      <td>NA</td>
    </tr>
  `;

  html += `</table>`;

  return html;
}

function clearCalculation() {
  const resultBox = document.getElementById("calculateResult");
  if (resultBox) {
    resultBox.innerHTML = "";
  }
}

/* =========================================================
   SECTION / GROUP SYSTEM OVERRIDE
   Each manually-created title box is now a real group.
   IDs restart inside every group. Delete page logic no longer used.
========================================================= */

const GROUPED_MODULES = ["dashboard", "pipeline", "deployment", "application"];

function escHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function moduleConfig(module) {
  return {
    dashboard: {
      data: () => allProjects,
      setData: v => allProjects = v,
      tableId: "table",
      selectCol: ".dashboard-select-col",
      rowsPerPage,
      load: loadProjects,
      addUrl: "/api/projects",
      deleteUrl: id => `/api/projects/${id}`,
      updateGroup: async (row, group) => {
        row.project_group = group;
        await saveProject(row.id);
      },
      blankBody: group => ({
        project_description: "", status: "", remarks: "",
        tendering: "", bg_insurance: "", cwr_po_received: "", workscope: "",
        cost_proposal: "", ccc_readiness_manpower: "", procurement_material: "",
        delivery_material_site: "", fcb_booking: "", mob_execution: "",
        handover_site: "", demob_date: "", close_out_report: "",
        project_group: group
      }),
      colspan: 30
    },
    pipeline: {
      data: () => pipelineData,
      setData: v => pipelineData = v,
      tableId: "pipelineTable",
      selectCol: ".pipeline-select-col",
      rowsPerPage: pipelineRowsPerPage,
      load: loadPipeline,
      addUrl: "/api/pipeline",
      deleteUrl: id => `/api/pipeline/${id}`,
      updateGroup: async (row, group) => {
        row.project_group = group;
        await updatePipeline(row.id, "project_group", group);
      },
      blankBody: group => ({ description: "", status: "", remarks: "", project_group: group }),
      colspan: 30
    },
    deployment: {
      data: () => deploymentData,
      setData: v => deploymentData = v,
      tableId: "deploymentTable",
      selectCol: ".deployment-select-col",
      rowsPerPage: deploymentRowsPerPage,
      load: loadDeployment,
      addUrl: "/api/deployment",
      deleteUrl: id => `/api/deployment/${id}`,
      updateGroup: async (row, group) => {
        row.project_group = group;
        await updateDeployment(row.id, "project_group", group);
      },
      blankBody: group => ({ project_group: group }),
      colspan: 10
    },
    application: {
      data: () => applicationData,
      setData: v => applicationData = v,
      tableId: "applicationTable",
      selectCol: ".application-select-col",
      rowsPerPage: applicationRowsPerPage,
      load: loadApplication,
      addUrl: "/api/application",
      deleteUrl: id => `/api/application/${id}`,
      updateGroup: async (row, group) => {
        row.project_group = group;
        await updateApplication(row.id, "project_group", group);
      },
      blankBody: group => ({ project_group: group }),
      colspan: 10
    }
  }[module];
}

function getGroupInputValue(module) {
  const input = document.getElementById(`${module}GroupName`);
  return input ? input.value.trim() : "";
}

function clearGroupInput(module) {
  const input = document.getElementById(`${module}GroupName`);
  if (input) input.value = "";
}

function normalizeGroupName(name) {
  return String(name || "").trim();
}

function groupRows(data, module) {
  const groups = [];
  const map = new Map();

  data.forEach((row, index) => {
    const legacy = typeof getLegacyPageTitle === "function" ? getLegacyPageTitle(module, index) : "";
    const group = normalizeGroupName(row.project_group) || legacy || "Untitled";

    if (!map.has(group)) {
      map.set(group, []);
      groups.push({ title: group, rows: map.get(group) });
    }

    map.get(group).push(row);
  });

  return groups;
}

async function addGroup(module) {
  const cfg = moduleConfig(module);
  if (!cfg) return;

  const group = getGroupInputValue(module);
  if (!group) {
    alert("Please type a title first");
    return;
  }

  const exists = cfg.data().some(row => normalizeGroupName(row.project_group) === group);
  if (exists && !confirm("This group already exists. Add one more row inside it?")) return;

  await fetch(cfg.addUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cfg.blankBody(group))
  });

  clearGroupInput(module);
  await cfg.load();
}

async function addRowToGroup(module, group) {
  const cfg = moduleConfig(module);
  if (!cfg) return;

  group = normalizeGroupName(group);
  if (!group || group === "Untitled") {
    alert("Please rename this group before adding rows");
    return;
  }

  await fetch(cfg.addUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cfg.blankBody(group))
  });

  await cfg.load();
}

async function deleteGroup(module, group) {
  const cfg = moduleConfig(module);
  if (!cfg) return;

  group = normalizeGroupName(group);
  const rows = cfg.data().filter(row => (normalizeGroupName(row.project_group) || "Untitled") === group);

  if (!rows.length) return;
  if (!confirm(`Delete group "${group}" and all ${rows.length} row(s)?`)) return;

  for (const row of rows) {
    await fetch(cfg.deleteUrl(row.id), { method: "DELETE" });
  }

  selectedIds[module]?.clear();
  await cfg.load();
}

async function renameGroup(module, oldGroup, newGroup) {
  const cfg = moduleConfig(module);
  if (!cfg) return;

  oldGroup = normalizeGroupName(oldGroup);
  newGroup = normalizeGroupName(newGroup);

  if (!newGroup) {
    alert("Group title cannot be empty");
    await cfg.load();
    return;
  }

  if (oldGroup === newGroup) return;

  const rows = cfg.data().filter(row => (normalizeGroupName(row.project_group) || "Untitled") === oldGroup);

  for (const row of rows) {
    await cfg.updateGroup(row, newGroup);
  }

  await cfg.load();
}

function groupHeaderHtml(module, groupTitle, rowCount) {
  const safeTitle = escHtml(groupTitle);
  const groupArg = JSON.stringify(groupTitle);

  return `
    <tr class="group-title-row">
      <td colspan="99">
        <div class="group-header-box">
          <span>Title:</span>
          <span class="group-title-edit" contenteditable="true" onblur='renameGroup(${JSON.stringify(module)}, ${groupArg}, this.innerText)'>${safeTitle}</span>
          <span class="group-empty-note">${rowCount} row(s)</span>
          <button onclick='addRowToGroup(${JSON.stringify(module)}, ${groupArg})'>+ Add Row</button>
          <button onclick='deleteGroup(${JSON.stringify(module)}, ${groupArg})'>Delete Group</button>
        </div>
      </td>
    </tr>
  `;
}

function rowNumberedGroups(data, module) {
  return groupRows(data, module).map(group => ({
    title: group.title,
    rows: group.rows.map((row, index) => ({
      ...row,
      project_group: group.title === "Untitled" ? (row.project_group || "") : group.title,
      groupTitle: group.title,
      displayId: index + 1
    }))
  }));
}

function assignGroupDisplayIds(data, module) {
  return rowNumberedGroups(data, module).flatMap(group => group.rows);
}

function renderGroupedModule(module, rowRenderer) {
  const cfg = moduleConfig(module);
  if (!cfg) return;

  const col = document.querySelector(cfg.selectCol);
  if (col) col.style.display = selectMode[module] ? "" : "none";

  const table = document.getElementById(cfg.tableId);
  table.innerHTML = "";

  const groups = rowNumberedGroups(cfg.data(), module);

  if (!groups.length) {
    table.innerHTML = `
      <tr class="group-title-row">
        <td colspan="99">No groups yet. Type a title above and click Add Group.</td>
      </tr>
    `;
    clearGroupedPagination(module);
    return;
  }

  groups.forEach(group => {
    table.innerHTML += groupHeaderHtml(module, group.title, group.rows.length);
    group.rows.forEach(row => {
      table.innerHTML += rowRenderer(row);
    });
  });

  clearGroupedPagination(module);
}

function clearGroupedPagination(module) {
  const ids = {
    dashboard: "pagination",
    pipeline: "pipelinePagination",
    deployment: "deploymentPagination",
    application: "applicationPagination"
  };
  const div = document.getElementById(ids[module]);
  if (div) div.innerHTML = "";
}

function renderDashboardRow(p) {
  return `
    <tr>
      ${selectMode.dashboard ? `<td><input type="checkbox" onchange="toggleRow(${p.id}, 'dashboard')"></td>` : ""}
      <td>${p.displayId}</td>
      <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="desc" id="desc-${p.id}" onblur="autoSave(${p.id})">${escHtml(p.project_description || "")}</td>
      <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="status" id="status-${p.id}" onblur="autoSave(${p.id})">${escHtml(p.status || "")}</td>
      <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="tendering" id="tendering-${p.id}" onblur="autoSave(${p.id})">${escHtml(p.tendering || "")}</td>
      <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="bg" id="bg-${p.id}" onblur="autoSave(${p.id})">${escHtml(p.bg_insurance || "")}</td>
      <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="cwr" id="cwr-${p.id}" onblur="autoSave(${p.id})">${escHtml(p.cwr_po_received || "")}</td>
      <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="workscope" id="workscope-${p.id}" onblur="autoSave(${p.id})">${escHtml(p.workscope || "")}</td>
      <td>
        ${p.si_report ? `<div class="file-box">📄 <a href="/uploads/${escHtml(p.si_report)}" target="_blank">${escHtml(p.si_report)}</a><button class="delete-file-btn" onclick="removeFile(${p.id})">❌</button></div>` : ""}
        <div class="upload-box"><input type="file" id="file-${p.id}"><button onclick="uploadFile(${p.id})">Upload</button></div>
      </td>
      <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="cost" id="cost-${p.id}" onblur="autoSave(${p.id})">${escHtml(p.cost_proposal || "")}</td>
      <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="ccc" id="ccc-${p.id}" onblur="autoSave(${p.id})">${escHtml(p.ccc_readiness_manpower || "")}</td>
      <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="procurement" id="procurement-${p.id}" onblur="autoSave(${p.id})">${escHtml(p.procurement_material || "")}</td>
      <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="delivery" id="delivery-${p.id}" onblur="autoSave(${p.id})">${escHtml(p.delivery_material_site || "")}</td>
      <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="fcb" id="fcb-${p.id}" onblur="autoSave(${p.id})">${escHtml(p.fcb_booking || "")}</td>
      <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="mob" id="mob-${p.id}" onblur="autoSave(${p.id})">${escHtml(p.mob_execution || "")}</td>
      <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="handover" id="handover-${p.id}" onblur="autoSave(${p.id})">${escHtml(p.handover_site || "")}</td>
      <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="demob" id="demob-${p.id}" onblur="autoSave(${p.id})">${escHtml(p.demob_date || "")}</td>
      <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="close" id="close-${p.id}" onblur="autoSave(${p.id})">${escHtml(p.close_out_report || "")}</td>
      <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="remarks" id="remarks-${p.id}" onblur="autoSave(${p.id})">${escHtml(p.remarks || "")}</td>
    </tr>`;
}

function renderPipelineRow(row) {
  const fields = [
    ["description", "description"], ["status", "status"], ["presentation", "presentation"],
    ["commercial", "commercial"], ["technical", "technical"], ["site_visit", "site_visit"],
    ["received_orders", "received_orders"], ["issue_po", "issue_po"], ["transport", "transport"],
    ["lead_time", "lead_time"], ["etb", "etb"], ["eta", "eta"],
    ["transport_site", "transport_site"], ["do_acceptance", "do_acceptance"],
    ["install_start", "install_start"], ["project_end", "project_end"], ["remarks", "remarks"]
  ];

  return `
    <tr>
      ${selectMode.pipeline ? `<td><input type="checkbox" onchange="toggleRow(${row.id}, 'pipeline')"></td>` : ""}
      <td>${row.displayId}</td>
      ${fields.map(([field]) => `<td contenteditable="true" data-fill="true" data-module="pipeline" data-id="${row.id}" data-field="${field}" onblur="updatePipeline(${row.id}, '${field}', this.innerText)">${escHtml(row[field] || "")}</td>`).join("")}
    </tr>`;
}

function renderDeploymentRow(row) {
  const fields = ["deployment_type", "status", "date_start", "date_complete", "remarks"];
  return `
    <tr>
      ${selectMode.deployment ? `<td><input type="checkbox" onchange="toggleRow(${row.id}, 'deployment')"></td>` : ""}
      <td>${row.displayId}</td>
      ${fields.map(field => `<td contenteditable="true" data-fill="true" data-module="deployment" data-id="${row.id}" data-field="${field}" onblur="updateDeployment(${row.id}, '${field}', this.innerText)">${escHtml(row[field] || "")}</td>`).join("")}
    </tr>`;
}

function renderApplicationRow(row) {
  const fields = ["project_description", "status", "date_start", "date_complete", "remarks"];
  return `
    <tr>
      ${selectMode.application ? `<td><input type="checkbox" onchange="toggleRow(${row.id}, 'application')"></td>` : ""}
      <td>${row.displayId}</td>
      ${fields.map(field => `<td contenteditable="true" data-fill="true" data-module="application" data-id="${row.id}" data-field="${field}" onblur="updateApplication(${row.id}, '${field}', this.innerText)">${escHtml(row[field] || "")}</td>`).join("")}
    </tr>`;
}

// Override renderers
renderProjects = function() { renderGroupedModule("dashboard", renderDashboardRow); };
renderPipeline = function() { renderGroupedModule("pipeline", renderPipelineRow); };
renderDeployment = function() { renderGroupedModule("deployment", renderDeploymentRow); };
renderApplication = function() { renderGroupedModule("application", renderApplicationRow); };

// Override add buttons: they now require a group title.
addProject = async function() {
  const group = getGroupInputValue("dashboard");
  if (!group) {
    alert("Please type a group title first");
    return;
  }

  await fetch("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      project_description: document.getElementById("desc").value,
      status: document.getElementById("status").value,
      remarks: document.getElementById("remarks").value,
      tendering: "", bg_insurance: "", cwr_po_received: "", workscope: "",
      cost_proposal: "", ccc_readiness_manpower: "", procurement_material: "",
      delivery_material_site: "", fcb_booking: "", mob_execution: "",
      handover_site: "", demob_date: "", close_out_report: "",
      project_group: group
    })
  });

  document.getElementById("desc").value = "";
  document.getElementById("status").value = "";
  document.getElementById("remarks").value = "";
  clearGroupInput("dashboard");
  loadProjects();
};

addPipeline = async function() {
  const group = getGroupInputValue("pipeline");
  if (!group) {
    alert("Please type a group title first");
    return;
  }

  const res = await fetch("/api/pipeline", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      description: document.getElementById("pl-desc").value,
      status: document.getElementById("pl-status").value,
      remarks: document.getElementById("pl-remarks").value,
      project_group: group
    })
  });

  pipelineData.push(await res.json());
  document.getElementById("pl-desc").value = "";
  document.getElementById("pl-status").value = "";
  document.getElementById("pl-remarks").value = "";
  clearGroupInput("pipeline");
  renderPipeline();
};

addDeployment = async function() {
  const group = getGroupInputValue("deployment");
  if (!group) {
    alert("Please type a group title first");
    return;
  }

  const res = await fetch("/api/deployment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project_group: group })
  });

  deploymentData.push(await res.json());
  clearGroupInput("deployment");
  renderDeployment();
};

addApplication = async function() {
  const group = getGroupInputValue("application");
  if (!group) {
    alert("Please type a group title first");
    return;
  }

  const res = await fetch("/api/application", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project_group: group })
  });

  applicationData.push(await res.json());
  clearGroupInput("application");
  renderApplication();
};

// Navigation override: no page title reload needed anymore.
goDashboard = function() {
  document.getElementById("dashboardPage").style.display = "block";
  document.getElementById("timelinePage").style.display = "none";
  document.getElementById("pipelinePage").style.display = "none";
  document.getElementById("deploymentPage").style.display = "none";
  document.getElementById("applicationPage").style.display = "none";
  document.getElementById("calculatePage").style.display = "none";
  loadProjects();
};

goPipeline = function() {
  document.getElementById("dashboardPage").style.display = "none";
  document.getElementById("timelinePage").style.display = "none";
  document.getElementById("pipelinePage").style.display = "block";
  document.getElementById("deploymentPage").style.display = "none";
  document.getElementById("applicationPage").style.display = "none";
  document.getElementById("calculatePage").style.display = "none";
  loadPipeline();
};

goDeployment = function() {
  document.getElementById("dashboardPage").style.display = "none";
  document.getElementById("timelinePage").style.display = "none";
  document.getElementById("pipelinePage").style.display = "none";
  document.getElementById("deploymentPage").style.display = "block";
  document.getElementById("applicationPage").style.display = "none";
  document.getElementById("calculatePage").style.display = "none";
  loadDeployment();
};

goApplication = function() {
  document.getElementById("dashboardPage").style.display = "none";
  document.getElementById("timelinePage").style.display = "none";
  document.getElementById("pipelinePage").style.display = "none";
  document.getElementById("deploymentPage").style.display = "none";
  document.getElementById("applicationPage").style.display = "block";
  document.getElementById("calculatePage").style.display = "none";
  loadApplication();
};

// Search now finds the same ID inside every group and keeps the group header visible.
function renderSearchResults(module, rows, rowRenderer) {
  const cfg = moduleConfig(module);
  const table = document.getElementById(cfg.tableId);
  table.innerHTML = "";

  const groups = groupRows(rows, module).map(group => ({
    title: group.title,
    rows: group.rows.map(row => ({ ...row }))
  }));

  groups.forEach(group => {
    table.innerHTML += groupHeaderHtml(module, group.title, group.rows.length);
    group.rows.forEach(row => table.innerHTML += rowRenderer(row));
  });

  clearGroupedPagination(module);
}

searchById = function() {
  const id = Number(document.getElementById("searchId").value);
  if (!id) return alert("Please enter ID");
  const found = assignGroupDisplayIds(allProjects, "dashboard").filter(row => row.displayId === id);
  if (!found.length) return alert("ID not found");
  searchMode = true;
  renderSearchResults("dashboard", found, renderDashboardRow);
};

searchPipeline = function() {
  const id = Number(document.getElementById("pipelineSearchId").value);
  if (!id) return alert("Please enter ID");
  const found = assignGroupDisplayIds(pipelineData, "pipeline").filter(row => row.displayId === id);
  if (!found.length) return alert("ID not found");
  pipelineSearchMode = true;
  renderSearchResults("pipeline", found, renderPipelineRow);
};

searchDeployment = function() {
  const id = Number(document.getElementById("deploymentSearchId").value);
  if (!id) return alert("Please enter ID");
  const found = assignGroupDisplayIds(deploymentData, "deployment").filter(row => row.displayId === id);
  if (!found.length) return alert("ID not found");
  deploymentSearchMode = true;
  renderSearchResults("deployment", found, renderDeploymentRow);
};

searchApplication = function() {
  const id = Number(document.getElementById("applicationSearchId").value);
  if (!id) return alert("Please enter ID");
  const found = assignGroupDisplayIds(applicationData, "application").filter(row => row.displayId === id);
  if (!found.length) return alert("ID not found");
  applicationSearchMode = true;
  renderSearchResults("application", found, renderApplicationRow);
};

// Disable old page insertion and bulk-add paths from accidental external calls.
insertPage = async function() {
  alert("Insert Page has been replaced by Add Group / + Add Row.");
};

bulkAdd = async function(module) {
  alert("Add Multiple has been replaced by + Add Row inside each group.");
};

/* =========================================================
   FINAL DELETE MODE PATCH
   - Removes need for old Select/Delete Selected buttons
   - Adds per-group Delete Row mode
   - Fixes pipeline Delete Group by using effective group names
========================================================= */

let activeGroupDeleteMode = {
  dashboard: null,
  pipeline: null,
  deployment: null,
  application: null
};

function getEffectiveGroupName(row, module, index) {
  const own = normalizeGroupName(row?.project_group);
  if (own) return own;
  const legacy = typeof getLegacyPageTitle === "function" ? getLegacyPageTitle(module, index || 0) : "";
  return normalizeGroupName(legacy) || "Untitled";
}

function isGroupDeleteActive(module, group) {
  return activeGroupDeleteMode[module] === normalizeGroupName(group);
}

function isRowSelectableForActiveGroup(module, row) {
  const activeGroup = activeGroupDeleteMode[module];
  if (!activeGroup) return false;
  return normalizeGroupName(row.groupTitle || row.project_group || "Untitled") === activeGroup;
}

function startGroupDeleteMode(module, group) {
  group = normalizeGroupName(group);
  activeGroupDeleteMode[module] = group;
  selectMode[module] = true;
  selectedIds[module].clear();

  if (module === "dashboard") renderProjects();
  if (module === "pipeline") renderPipeline();
  if (module === "deployment") renderDeployment();
  if (module === "application") renderApplication();
}

async function confirmGroupDelete(module, group) {
  group = normalizeGroupName(group);

  if (!selectedIds[module] || !selectedIds[module].size) {
    alert("Please select row(s) to delete first");
    return;
  }

  if (!confirm(`Delete selected row(s) from "${group}"?`)) return;

  await bulkDelete(module);
  activeGroupDeleteMode[module] = null;
  selectMode[module] = false;
  selectedIds[module].clear();

  if (module === "dashboard") loadProjects();
  if (module === "pipeline") loadPipeline();
  if (module === "deployment") loadDeployment();
  if (module === "application") loadApplication();
}

function cancelGroupDelete(module) {
  activeGroupDeleteMode[module] = null;
  selectMode[module] = false;
  selectedIds[module].clear();

  if (module === "dashboard") renderProjects();
  if (module === "pipeline") renderPipeline();
  if (module === "deployment") renderDeployment();
  if (module === "application") renderApplication();
}

// Kept for safety if any old button/browser cache still calls it.
function startDeleteMode(module) {
  alert("Use the Delete Row button inside the group you want to edit.");
}

// Fix Delete Group, especially for Pipeline/legacy rows.
deleteGroup = async function(module, group) {
  const cfg = moduleConfig(module);
  if (!cfg) return;

  group = normalizeGroupName(group);
  const rows = cfg.data().filter((row, index) => getEffectiveGroupName(row, module, index) === group);

  if (!rows.length) {
    alert("No rows found for this group");
    return;
  }

  if (!confirm(`Delete group "${group}" and all ${rows.length} row(s)?`)) return;

  for (const row of rows) {
    await fetch(cfg.deleteUrl(row.id), { method: "DELETE" });
  }

  activeGroupDeleteMode[module] = null;
  selectMode[module] = false;
  selectedIds[module]?.clear();
  await cfg.load();
};

// Group header now has Delete Row mode + fixed Delete Group.
groupHeaderHtml = function(module, groupTitle, rowCount) {
  const safeTitle = escHtml(groupTitle);
  const moduleArg = JSON.stringify(module);
  const groupArg = JSON.stringify(groupTitle);
  const deleting = isGroupDeleteActive(module, groupTitle);

  const deleteControls = deleting
    ? `
      <button class="confirm-delete-btn" onclick='confirmGroupDelete(${moduleArg}, ${groupArg})'>Confirm Delete</button>
      <button class="cancel-delete-btn" onclick='cancelGroupDelete(${moduleArg})'>Cancel</button>
    `
    : `<button onclick='startGroupDeleteMode(${moduleArg}, ${groupArg})'>Delete Row</button>`;

  return `
    <tr class="group-title-row ${deleting ? "delete-mode-active" : ""}">
      <td colspan="99">
        <div class="group-header-box">
          <span>Title:</span>
          <span class="group-title-edit" contenteditable="true" onblur='renameGroup(${moduleArg}, ${groupArg}, this.innerText)'>${safeTitle}</span>
          <span class="group-empty-note">${rowCount} row(s)</span>
          <button onclick='addRowToGroup(${moduleArg}, ${groupArg})'>+ Add Row</button>
          ${deleteControls}
          <button onclick='deleteGroup(${moduleArg}, ${groupArg})'>Delete Group</button>
        </div>
      </td>
    </tr>
  `;
};

renderDashboardRow = function(p) {
  const showSelect = isRowSelectableForActiveGroup("dashboard", p);
  return `
    <tr>
      ${showSelect ? `<td><input type="checkbox" onchange="toggleRow(${p.id}, 'dashboard')"></td>` : (selectMode.dashboard ? `<td></td>` : "")}
      <td>${p.displayId}</td>
      <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="desc" id="desc-${p.id}" onblur="autoSave(${p.id})">${escHtml(p.project_description || "")}</td>
      <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="status" id="status-${p.id}" onblur="autoSave(${p.id})">${escHtml(p.status || "")}</td>
      <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="tendering" id="tendering-${p.id}" onblur="autoSave(${p.id})">${escHtml(p.tendering || "")}</td>
      <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="bg" id="bg-${p.id}" onblur="autoSave(${p.id})">${escHtml(p.bg_insurance || "")}</td>
      <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="cwr" id="cwr-${p.id}" onblur="autoSave(${p.id})">${escHtml(p.cwr_po_received || "")}</td>
      <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="workscope" id="workscope-${p.id}" onblur="autoSave(${p.id})">${escHtml(p.workscope || "")}</td>
      <td>
        ${p.si_report ? `<div class="file-box">📄 <a href="/uploads/${escHtml(p.si_report)}" target="_blank">${escHtml(p.si_report)}</a><button class="delete-file-btn" onclick="removeFile(${p.id})">❌</button></div>` : ""}
        <div class="upload-box"><input type="file" id="file-${p.id}"><button onclick="uploadFile(${p.id})">Upload</button></div>
      </td>
      <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="cost" id="cost-${p.id}" onblur="autoSave(${p.id})">${escHtml(p.cost_proposal || "")}</td>
      <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="ccc" id="ccc-${p.id}" onblur="autoSave(${p.id})">${escHtml(p.ccc_readiness_manpower || "")}</td>
      <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="procurement" id="procurement-${p.id}" onblur="autoSave(${p.id})">${escHtml(p.procurement_material || "")}</td>
      <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="delivery" id="delivery-${p.id}" onblur="autoSave(${p.id})">${escHtml(p.delivery_material_site || "")}</td>
      <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="fcb" id="fcb-${p.id}" onblur="autoSave(${p.id})">${escHtml(p.fcb_booking || "")}</td>
      <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="mob" id="mob-${p.id}" onblur="autoSave(${p.id})">${escHtml(p.mob_execution || "")}</td>
      <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="handover" id="handover-${p.id}" onblur="autoSave(${p.id})">${escHtml(p.handover_site || "")}</td>
      <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="demob" id="demob-${p.id}" onblur="autoSave(${p.id})">${escHtml(p.demob_date || "")}</td>
      <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="close" id="close-${p.id}" onblur="autoSave(${p.id})">${escHtml(p.close_out_report || "")}</td>
      <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="remarks" id="remarks-${p.id}" onblur="autoSave(${p.id})">${escHtml(p.remarks || "")}</td>
    </tr>`;
};

renderPipelineRow = function(row) {
  const showSelect = isRowSelectableForActiveGroup("pipeline", row);
  const fields = ["description", "status", "presentation", "commercial", "technical", "site_visit", "received_orders", "issue_po", "transport", "lead_time", "etb", "eta", "transport_site", "do_acceptance", "install_start", "project_end", "remarks"];
  return `
    <tr>
      ${showSelect ? `<td><input type="checkbox" onchange="toggleRow(${row.id}, 'pipeline')"></td>` : (selectMode.pipeline ? `<td></td>` : "")}
      <td>${row.displayId}</td>
      ${fields.map(field => `<td contenteditable="true" data-fill="true" data-module="pipeline" data-id="${row.id}" data-field="${field}" onblur="updatePipeline(${row.id}, '${field}', this.innerText)">${escHtml(row[field] || "")}</td>`).join("")}
    </tr>`;
};

renderDeploymentRow = function(row) {
  const showSelect = isRowSelectableForActiveGroup("deployment", row);
  const fields = ["deployment_type", "status", "date_start", "date_complete", "remarks"];
  return `
    <tr>
      ${showSelect ? `<td><input type="checkbox" onchange="toggleRow(${row.id}, 'deployment')"></td>` : (selectMode.deployment ? `<td></td>` : "")}
      <td>${row.displayId}</td>
      ${fields.map(field => `<td contenteditable="true" data-fill="true" data-module="deployment" data-id="${row.id}" data-field="${field}" onblur="updateDeployment(${row.id}, '${field}', this.innerText)">${escHtml(row[field] || "")}</td>`).join("")}
    </tr>`;
};

renderApplicationRow = function(row) {
  const showSelect = isRowSelectableForActiveGroup("application", row);
  const fields = ["project_description", "status", "date_start", "date_complete", "remarks"];
  return `
    <tr>
      ${showSelect ? `<td><input type="checkbox" onchange="toggleRow(${row.id}, 'application')"></td>` : (selectMode.application ? `<td></td>` : "")}
      <td>${row.displayId}</td>
      ${fields.map(field => `<td contenteditable="true" data-fill="true" data-module="application" data-id="${row.id}" data-field="${field}" onblur="updateApplication(${row.id}, '${field}', this.innerText)">${escHtml(row[field] || "")}</td>`).join("")}
    </tr>`;
};

// Make sure final renderers use the patched row/header logic.
renderProjects = function() { renderGroupedModule("dashboard", renderDashboardRow); };
renderPipeline = function() { renderGroupedModule("pipeline", renderPipelineRow); };
renderDeployment = function() { renderGroupedModule("deployment", renderDeploymentRow); };
renderApplication = function() { renderGroupedModule("application", renderApplicationRow); };

/* Timeline delete button patch */
function startTimelineDeleteMode() {
  selectMode.timeline = true;
  selectedIds.timeline.clear();
  const confirmBtn = document.getElementById("timelineConfirmDeleteBtn");
  const cancelBtn = document.getElementById("timelineCancelDeleteBtn");
  if (confirmBtn) confirmBtn.style.display = "inline-block";
  if (cancelBtn) cancelBtn.style.display = "inline-block";
  renderTimeline();
}

async function confirmTimelineDelete() {
  if (!selectedIds.timeline.size) {
    alert("Please select row(s) to delete first");
    return;
  }
  await bulkDelete("timeline");
  cancelTimelineDelete(false);
}

function cancelTimelineDelete(shouldRender = true) {
  selectMode.timeline = false;
  selectedIds.timeline.clear();
  const confirmBtn = document.getElementById("timelineConfirmDeleteBtn");
  const cancelBtn = document.getElementById("timelineCancelDeleteBtn");
  if (confirmBtn) confirmBtn.style.display = "none";
  if (cancelBtn) cancelBtn.style.display = "none";
  if (shouldRender) renderTimeline();
}

/* =========================================================
   FINAL GROUP PAGINATION + GROUP EXPORT PATCH
   - 30 rows per title/group page
   - Export button per title/group only
   - Top export buttons are no longer needed in HTML
========================================================= */
const GROUP_ROWS_PER_PAGE = 30;
const groupPageState = {
  dashboard: {},
  pipeline: {},
  deployment: {},
  application: {}
};

function groupPageKey(groupTitle) {
  return normalizeGroupName(groupTitle) || "Untitled";
}

function getGroupPage(module, groupTitle) {
  const key = groupPageKey(groupTitle);
  return groupPageState[module]?.[key] || 1;
}

function setGroupPage(module, groupTitle, page) {
  const key = groupPageKey(groupTitle);
  if (!groupPageState[module]) groupPageState[module] = {};
  groupPageState[module][key] = Math.max(1, Number(page) || 1);
}

function changeGroupPage(module, groupTitle, page) {
  const cfg = moduleConfig(module);
  if (!cfg) return;

  const rows = cfg.data().filter((row, index) => getEffectiveGroupName(row, module, index) === groupTitle);
  const totalPages = Math.max(1, Math.ceil(rows.length / GROUP_ROWS_PER_PAGE));
  const nextPage = Math.min(Math.max(1, Number(page) || 1), totalPages);

  setGroupPage(module, groupTitle, nextPage);

  if (module === "dashboard") renderProjects();
  if (module === "pipeline") renderPipeline();
  if (module === "deployment") renderDeployment();
  if (module === "application") renderApplication();
}

function groupPaginationHtml(module, groupTitle, rowCount) {
  const totalPages = Math.max(1, Math.ceil(rowCount / GROUP_ROWS_PER_PAGE));
  const current = Math.min(getGroupPage(module, groupTitle), totalPages);
  setGroupPage(module, groupTitle, current);

  if (totalPages <= 1) {
    return `<span class="group-page-note">Page 1 / 1</span>`;
  }

  const moduleArg = JSON.stringify(module);
  const groupArg = JSON.stringify(groupTitle);

  return `
    <span class="group-pagination">
      <button onclick='changeGroupPage(${moduleArg}, ${groupArg}, ${current - 1})' ${current <= 1 ? "disabled" : ""}>‹</button>
      <span>Page ${current} / ${totalPages}</span>
      <button onclick='changeGroupPage(${moduleArg}, ${groupArg}, ${current + 1})' ${current >= totalPages ? "disabled" : ""}>›</button>
    </span>
  `;
}

function exportCsv(filename, headers, rows) {
  const csv = [];
  csv.push(headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(","));

  rows.forEach(row => {
    csv.push(row.map(value => `"${String(value ?? "").replace(/"/g, '""').replace(/\n/g, " ").trim()}"`).join(","));
  });

  const blob = new Blob([csv.join("\n")], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

function safeFilename(value) {
  return String(value || "group")
    .trim()
    .replace(/[^a-z0-9_\-]+/gi, "_")
    .replace(/^_+|_+$/g, "") || "group";
}

function exportGroup(module, groupTitle) {
  const cfg = moduleConfig(module);
  if (!cfg) return;

  const rows = assignGroupDisplayIds(cfg.data(), module)
    .filter(row => normalizeGroupName(row.groupTitle || row.project_group || "Untitled") === normalizeGroupName(groupTitle));

  if (!rows.length) {
    alert("No rows to export for this group");
    return;
  }

  const name = safeFilename(groupTitle);

  if (module === "dashboard") {
    exportCsv(`dashboard_${name}.csv`, [
      "ID", "Project", "Status", "Tendering", "BG", "CWR/PO", "Workscope", "SI Report",
      "Cost", "CCC", "Procurement", "Delivery", "FCB", "Mob", "Handover", "Demob", "Close Out", "Remarks"
    ], rows.map(p => [
      p.displayId, p.project_description, p.status, p.tendering, p.bg_insurance, p.cwr_po_received,
      p.workscope, p.si_report || "NA", p.cost_proposal, p.ccc_readiness_manpower,
      p.procurement_material, p.delivery_material_site, p.fcb_booking, p.mob_execution,
      p.handover_site, p.demob_date, p.close_out_report, p.remarks
    ]));
    return;
  }

  if (module === "pipeline") {
    exportCsv(`pipeline_${name}.csv`, [
      "No.", "Project Description", "Status Complete", "Presentation to Client", "Commercial Proposal",
      "Technical Proposal", "Site Visit", "Received Orders", "Issue PO", "Check Transport/Shipment",
      "Delivery Lead Time", "ETB", "ETA", "Transport to Site", "DO Acceptance",
      "Project Installation Start", "Project End", "Remarks"
    ], rows.map(row => [
      row.displayId, row.description, row.status, row.presentation, row.commercial, row.technical,
      row.site_visit, row.received_orders, row.issue_po, row.transport, row.lead_time,
      row.etb, row.eta, row.transport_site, row.do_acceptance, row.install_start,
      row.project_end, row.remarks
    ]));
    return;
  }

  if (module === "deployment") {
    exportCsv(`deployment_${name}.csv`, ["No.", "Deployment Type", "Status", "Date Start", "Date Complete", "Remarks"],
      rows.map(row => [row.displayId, row.deployment_type, row.status, row.date_start, row.date_complete, row.remarks]));
    return;
  }

  if (module === "application") {
    exportCsv(`application_${name}.csv`, ["No.", "Project Description", "Status", "Date Start", "Date Complete", "Remarks"],
      rows.map(row => [row.displayId, row.project_description, row.status, row.date_start, row.date_complete, row.remarks]));
  }
}

async function addRowToGroup(module, group) {
  const cfg = moduleConfig(module);
  if (!cfg) return;

  group = normalizeGroupName(group);
  if (!group || group === "Untitled") {
    alert("Please rename this group before adding rows");
    return;
  }

  await fetch(cfg.addUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cfg.blankBody(group))
  });

  const currentCount = cfg.data().filter((row, index) => getEffectiveGroupName(row, module, index) === group).length;
  const nextCount = currentCount + 1;
  setGroupPage(module, group, Math.ceil(nextCount / GROUP_ROWS_PER_PAGE));

  await cfg.load();
}

async function addGroup(module) {
  const cfg = moduleConfig(module);
  if (!cfg) return;

  const group = getGroupInputValue(module);
  if (!group) {
    alert("Please type a title first");
    return;
  }

  const exists = cfg.data().some(row => normalizeGroupName(row.project_group) === group);
  if (exists && !confirm("This group already exists. Add one more row inside it?")) return;

  await fetch(cfg.addUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cfg.blankBody(group))
  });

  setGroupPage(module, group, Math.max(1, Math.ceil((cfg.data().filter(row => normalizeGroupName(row.project_group) === group).length + 1) / GROUP_ROWS_PER_PAGE)));
  clearGroupInput(module);
  await cfg.load();
}

// Group header now includes per-group export and per-group pagination.
groupHeaderHtml = function(module, groupTitle, rowCount) {
  const safeTitle = escHtml(groupTitle);
  const moduleArg = JSON.stringify(module);
  const groupArg = JSON.stringify(groupTitle);
  const deleting = isGroupDeleteActive(module, groupTitle);

  const deleteControls = deleting
    ? `
      <button class="confirm-delete-btn" onclick='confirmGroupDelete(${moduleArg}, ${groupArg})'>Confirm Delete</button>
      <button class="cancel-delete-btn" onclick='cancelGroupDelete(${moduleArg})'>Cancel</button>
    `
    : `<button onclick='startGroupDeleteMode(${moduleArg}, ${groupArg})'>Delete Row</button>`;

  return `
    <tr class="group-title-row ${deleting ? "delete-mode-active" : ""}">
      <td colspan="99">
        <div class="group-header-box">
          <span>Title:</span>
          <span class="group-title-edit" contenteditable="true" onblur='renameGroup(${moduleArg}, ${groupArg}, this.innerText)'>${safeTitle}</span>
          <span class="group-empty-note">${rowCount} row(s)</span>
          ${groupPaginationHtml(module, groupTitle, rowCount)}
          <button onclick='addRowToGroup(${moduleArg}, ${groupArg})'>+ Add Row</button>
          ${deleteControls}
          <button onclick='deleteGroup(${moduleArg}, ${groupArg})'>Delete Group</button>
          <button class="group-export-btn" onclick='exportGroup(${moduleArg}, ${groupArg})'>Export</button>
        </div>
      </td>
    </tr>
  `;
};

function renderGroupedModule(module, rowRenderer) {
  const cfg = moduleConfig(module);
  if (!cfg) return;

  const col = document.querySelector(cfg.selectCol);
  if (col) col.style.display = selectMode[module] ? "" : "none";

  const table = document.getElementById(cfg.tableId);
  table.innerHTML = "";

  const groups = rowNumberedGroups(cfg.data(), module);

  if (!groups.length) {
    table.innerHTML = `
      <tr class="group-title-row">
        <td colspan="99">No groups yet. Type a title above and click Add Group.</td>
      </tr>
    `;
    clearGroupedPagination(module);
    return;
  }

  groups.forEach(group => {
    const totalPages = Math.max(1, Math.ceil(group.rows.length / GROUP_ROWS_PER_PAGE));
    let page = Math.min(getGroupPage(module, group.title), totalPages);
    setGroupPage(module, group.title, page);

    const start = (page - 1) * GROUP_ROWS_PER_PAGE;
    const visibleRows = group.rows.slice(start, start + GROUP_ROWS_PER_PAGE);

    table.innerHTML += groupHeaderHtml(module, group.title, group.rows.length);
    visibleRows.forEach(row => {
      table.innerHTML += rowRenderer(row);
    });
  });

  clearGroupedPagination(module);
}

// Rebind final renderers to use the paginated grouped renderer.
renderProjects = function() { renderGroupedModule("dashboard", renderDashboardRow); };
renderPipeline = function() { renderGroupedModule("pipeline", renderPipelineRow); };
renderDeployment = function() { renderGroupedModule("deployment", renderDeploymentRow); };
renderApplication = function() { renderGroupedModule("application", renderApplicationRow); };

// Top export buttons are intentionally disabled if old cached HTML still calls them.
exportExcel = function() { alert("Use the Export button inside each group title."); };
exportPipeline = function() { alert("Use the Export button inside each group title."); };
exportDeployment = function() { alert("Use the Export button inside each group title."); };
exportApplication = function() { alert("Use the Export button inside each group title."); };
exportTimelineExcel = function() { alert("Timeline export has been removed from the top toolbar."); };


/* =========================================================
   FINAL CLEAN V4 PATCH
   - Remove old top Add inputs/buttons behavior
   - Timeline uses the same title/group system
   - Group collapse/expand, copy group, group ordering, sticky title
   - Group summary shown in every title bar
========================================================= */

// Add timeline to group pagination/delete states.
if (typeof groupPageState !== "undefined") groupPageState.timeline = groupPageState.timeline || {};
if (typeof activeGroupDeleteMode !== "undefined") activeGroupDeleteMode.timeline = activeGroupDeleteMode.timeline || null;

const originalModuleConfigV4 = moduleConfig;
moduleConfig = function(module) {
  if (module === "timeline") {
    return {
      data: () => timelineData,
      setData: v => timelineData = v,
      tableId: "timelineTable",
      selectCol: ".timeline-select-col",
      rowsPerPage: GROUP_ROWS_PER_PAGE,
      load: loadTimeline,
      addUrl: "/api/timeline",
      deleteUrl: id => `/api/timeline/${id}`,
      updateGroup: async (row, group) => {
        row.project_group = group;
        await saveTimelineRow(row.id);
      },
      blankBody: group => ({
        year: document.getElementById("timelineYear")?.value || "2026",
        months: Array(12).fill(""),
        status: "",
        project_group: group
      }),
      colspan: 20
    };
  }

  return originalModuleConfigV4(module);
};

// Timeline rows now save project_group too.
saveTimelineRow = async function(id) {
  const row = timelineData.find(item => item.id === id);
  if (!row) return;

  await fetch(`/api/timeline/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      months: row.months || Array(12).fill(""),
      status: row.status || "",
      project_group: row.project_group || row.groupTitle || ""
    })
  });
};

function renderTimelineRow(row) {
  const months = Array.isArray(row.months) ? row.months : Array(12).fill("");

  return `
    <tr>
      ${selectMode.timeline && isRowSelectableForActiveGroup("timeline", row) ? `<td><input type="checkbox" onchange="toggleRow(${row.id}, 'timeline')"></td>` : ""}
      ${months.map((m, monthIndex) => `
        <td contenteditable="true" data-fill="true" data-module="timeline" data-id="${row.id}" data-field="${monthIndex}" onblur="updateTimelineCell(${row.id}, ${monthIndex}, this.innerText)">${escHtml(m || "")}</td>
      `).join("")}
      <td contenteditable="true" data-fill="true" data-module="timeline" data-id="${row.id}" data-field="status" onblur="updateTimelineStatus(${row.id}, this.innerText)">${escHtml(row.status || "")}</td>
    </tr>`;
}

function getStoredGroupOrder(module) {
  try { return JSON.parse(localStorage.getItem(`group-order-${module}`) || "[]"); }
  catch { return []; }
}

function setStoredGroupOrder(module, order) {
  localStorage.setItem(`group-order-${module}`, JSON.stringify(order));
}

const originalGroupRowsV4 = groupRows;
groupRows = function(data, module) {
  const groups = originalGroupRowsV4(data, module);
  const order = getStoredGroupOrder(module);

  groups.forEach(g => {
    if (!order.includes(g.title)) order.push(g.title);
  });

  setStoredGroupOrder(module, order.filter(title => groups.some(g => g.title === title)));

  return groups.sort((a, b) => {
    const ai = order.indexOf(a.title);
    const bi = order.indexOf(b.title);
    return (ai === -1 ? 999999 : ai) - (bi === -1 ? 999999 : bi);
  });
};

function moveGroup(module, groupTitle, direction) {
  const cfg = moduleConfig(module);
  if (!cfg) return;

  const groups = groupRows(cfg.data(), module).map(g => g.title);
  let order = getStoredGroupOrder(module).filter(title => groups.includes(title));
  groups.forEach(title => { if (!order.includes(title)) order.push(title); });

  const i = order.indexOf(groupTitle);
  const j = i + direction;
  if (i < 0 || j < 0 || j >= order.length) return;

  [order[i], order[j]] = [order[j], order[i]];
  setStoredGroupOrder(module, order);
  renderModuleByName(module);
}

function isGroupCollapsed(module, groupTitle) {
  return localStorage.getItem(`group-collapsed-${module}-${groupPageKey(groupTitle)}`) === "1";
}

function toggleGroupCollapse(module, groupTitle) {
  const key = `group-collapsed-${module}-${groupPageKey(groupTitle)}`;
  localStorage.setItem(key, localStorage.getItem(key) === "1" ? "0" : "1");
  renderModuleByName(module);
}

function renderModuleByName(module) {
  if (module === "dashboard") renderProjects();
  if (module === "pipeline") renderPipeline();
  if (module === "deployment") renderDeployment();
  if (module === "application") renderApplication();
  if (module === "timeline") renderTimeline();
}

function loadModuleByName(module) {
  if (module === "dashboard") return loadProjects();
  if (module === "pipeline") return loadPipeline();
  if (module === "deployment") return loadDeployment();
  if (module === "application") return loadApplication();
  if (module === "timeline") return loadTimeline();
}

function rowHasContent(row, module) {
  const skip = new Set(["id", "sort_order", "displayId", "project_group", "groupTitle", "year"]);
  if (module === "timeline") {
    return (row.months || []).some(v => String(v || "").trim()) || String(row.status || "").trim();
  }

  return Object.keys(row).some(k => !skip.has(k) && String(row[k] ?? "").trim() !== "");
}

function groupSummary(module, rows) {
  const filled = rows.filter(row => rowHasContent(row, module)).length;
  return `${rows.length} row(s), ${filled} filled`;
}

async function copyGroup(module, groupTitle) {
  const cfg = moduleConfig(module);
  if (!cfg) return;

  groupTitle = normalizeGroupName(groupTitle);
  const rows = cfg.data().filter((row, index) => getEffectiveGroupName(row, module, index) === groupTitle);
  if (!rows.length) return alert("No rows to copy");

  const newGroup = prompt("New copied group title:", `${groupTitle} Copy`);
  if (!normalizeGroupName(newGroup)) return;

  for (const row of rows) {
    let body = cfg.blankBody(newGroup);

    if (module === "dashboard") {
      body = {
        project_description: row.project_description || "",
        status: row.status || "",
        remarks: row.remarks || "",
        tendering: row.tendering || "",
        bg_insurance: row.bg_insurance || "",
        cwr_po_received: row.cwr_po_received || "",
        workscope: row.workscope || "",
        cost_proposal: row.cost_proposal || "",
        ccc_readiness_manpower: row.ccc_readiness_manpower || "",
        procurement_material: row.procurement_material || "",
        delivery_material_site: row.delivery_material_site || "",
        fcb_booking: row.fcb_booking || "",
        mob_execution: row.mob_execution || "",
        handover_site: row.handover_site || "",
        demob_date: row.demob_date || "",
        close_out_report: row.close_out_report || "",
        project_group: newGroup
      };
    }

    if (module === "pipeline") {
      body = {
        description: row.description || "",
        status: row.status || "",
        remarks: row.remarks || "",
        project_group: newGroup
      };
    }

    if (module === "timeline") {
      body = {
        year: document.getElementById("timelineYear")?.value || row.year || "2026",
        months: Array.isArray(row.months) ? row.months : Array(12).fill(""),
        status: row.status || "",
        project_group: newGroup
      };
    }

    await fetch(cfg.addUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
  }

  const order = getStoredGroupOrder(module);
  if (!order.includes(newGroup)) order.push(newGroup);
  setStoredGroupOrder(module, order);
  await cfg.load();
}

const originalExportGroupV4 = exportGroup;
exportGroup = function(module, groupTitle) {
  if (module !== "timeline") return originalExportGroupV4(module, groupTitle);

  const rows = assignGroupDisplayIds(timelineData, "timeline")
    .filter(row => normalizeGroupName(row.groupTitle || row.project_group || "Untitled") === normalizeGroupName(groupTitle));

  if (!rows.length) return alert("No rows to export for this group");

  exportCsv(`timeline_${safeFilename(groupTitle)}.csv`, [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Status"
  ], rows.map(row => [ ...(row.months || Array(12).fill("")), row.status || "" ]));
};

function startGroupDeleteMode(module, group) {
  group = normalizeGroupName(group);
  activeGroupDeleteMode[module] = group;
  selectMode[module] = true;
  selectedIds[module].clear();
  renderModuleByName(module);
}

async function confirmGroupDelete(module, group) {
  group = normalizeGroupName(group);

  if (!selectedIds[module] || !selectedIds[module].size) {
    alert("Please select row(s) to delete first");
    return;
  }

  if (!confirm(`Delete selected row(s) from "${group}"?`)) return;

  await bulkDelete(module);
  activeGroupDeleteMode[module] = null;
  selectMode[module] = false;
  selectedIds[module].clear();
  await loadModuleByName(module);
}

function cancelGroupDelete(module) {
  activeGroupDeleteMode[module] = null;
  selectMode[module] = false;
  selectedIds[module].clear();
  renderModuleByName(module);
}

// Keep Timeline Add Timeline/Add Multiple/old Delete disabled if browser cache calls them.
addTimelineRow = async function() { alert("Use Add Group / + Add Row inside Timeline groups."); };
startTimelineDeleteMode = function() { alert("Use Delete Row inside the Timeline group."); };
confirmTimelineDelete = function() { return confirmGroupDelete("timeline", activeGroupDeleteMode.timeline || ""); };
cancelTimelineDelete = function() { return cancelGroupDelete("timeline"); };
exportTimelineExcel = function() { alert("Use the Export button inside each Timeline group title."); };

function groupHeaderHtml(module, groupTitle, rowCount) {
  const cfg = moduleConfig(module);
  const rows = cfg ? cfg.data().filter((row, index) => getEffectiveGroupName(row, module, index) === normalizeGroupName(groupTitle)) : [];
  const safeTitle = escHtml(groupTitle);
  const moduleArg = JSON.stringify(module);
  const groupArg = JSON.stringify(groupTitle);
  const deleting = isGroupDeleteActive(module, groupTitle);
  const collapsed = isGroupCollapsed(module, groupTitle);

  const deleteControls = deleting
    ? `
      <button class="confirm-delete-btn" onclick='confirmGroupDelete(${moduleArg}, ${groupArg})'>Confirm Delete</button>
      <button class="cancel-delete-btn" onclick='cancelGroupDelete(${moduleArg})'>Cancel</button>
    `
    : `<button onclick='startGroupDeleteMode(${moduleArg}, ${groupArg})'>Delete Row</button>`;

  return `
    <tr class="group-title-row ${deleting ? "delete-mode-active" : ""}">
      <td colspan="99">
        <div class="group-header-box">
          <button class="collapse-btn" onclick='toggleGroupCollapse(${moduleArg}, ${groupArg})'>${collapsed ? "▶" : "▼"}</button>
          <span>Title:</span>
          <span class="group-title-edit" contenteditable="true" onblur='renameGroup(${moduleArg}, ${groupArg}, this.innerText)'>${safeTitle}</span>
          <span class="group-empty-note">${groupSummary(module, rows)}</span>
          ${groupPaginationHtml(module, groupTitle, rowCount)}
          <button onclick='moveGroup(${moduleArg}, ${groupArg}, -1)'>↑</button>
          <button onclick='moveGroup(${moduleArg}, ${groupArg}, 1)'>↓</button>
          <button onclick='addRowToGroup(${moduleArg}, ${groupArg})'>+ Add Row</button>
          ${deleteControls}
          <button onclick='deleteGroup(${moduleArg}, ${groupArg})'>Delete Group</button>
          <button onclick='copyGroup(${moduleArg}, ${groupArg})'>Copy Group</button>
          <button class="group-export-btn" onclick='exportGroup(${moduleArg}, ${groupArg})'>Export</button>
        </div>
      </td>
    </tr>
  `;
}

function renderGroupedModule(module, rowRenderer) {
  const cfg = moduleConfig(module);
  if (!cfg) return;

  const col = document.querySelector(cfg.selectCol);
  if (col) col.style.display = selectMode[module] ? "" : "none";

  const table = document.getElementById(cfg.tableId);
  table.innerHTML = "";

  const groups = rowNumberedGroups(cfg.data(), module);

  if (!groups.length) {
    table.innerHTML = `
      <tr class="group-title-row">
        <td colspan="99">No groups yet. Type a title above and click Add Group.</td>
      </tr>
    `;
    clearGroupedPagination(module);
    return;
  }

  groups.forEach(group => {
    const totalPages = Math.max(1, Math.ceil(group.rows.length / GROUP_ROWS_PER_PAGE));
    let page = Math.min(getGroupPage(module, group.title), totalPages);
    setGroupPage(module, group.title, page);

    const start = (page - 1) * GROUP_ROWS_PER_PAGE;
    const visibleRows = group.rows.slice(start, start + GROUP_ROWS_PER_PAGE);

    table.innerHTML += groupHeaderHtml(module, group.title, group.rows.length);
    if (!isGroupCollapsed(module, group.title)) {
      visibleRows.forEach(row => { table.innerHTML += rowRenderer(row); });
    }
  });

  clearGroupedPagination(module);
}

function clearGroupedPagination(module) {
  const ids = {
    dashboard: "pagination",
    pipeline: "pipelinePagination",
    deployment: "deploymentPagination",
    application: "applicationPagination",
    timeline: "timelinePagination"
  };
  const div = document.getElementById(ids[module]);
  if (div) div.innerHTML = "";
}

// Final renderer bindings, now including Timeline.
renderProjects = function() { renderGroupedModule("dashboard", renderDashboardRow); };
renderPipeline = function() { renderGroupedModule("pipeline", renderPipelineRow); };
renderDeployment = function() { renderGroupedModule("deployment", renderDeploymentRow); };
renderApplication = function() { renderGroupedModule("application", renderApplicationRow); };
renderTimeline = function() { renderGroupedModule("timeline", renderTimelineRow); };

goTimeline = function() {
  document.getElementById("dashboardPage").style.display = "none";
  document.getElementById("timelinePage").style.display = "block";
  document.getElementById("pipelinePage").style.display = "none";
  document.getElementById("deploymentPage").style.display = "none";
  document.getElementById("applicationPage").style.display = "none";
  document.getElementById("calculatePage").style.display = "none";
  loadTimeline();
};

// Clean old top add buttons if cached HTML still calls these.
addProject = async function() { return addGroup("dashboard"); };
addPipeline = async function() { return addGroup("pipeline"); };
addDeployment = async function() { return addGroup("deployment"); };
addApplication = async function() { return addGroup("application"); };

// Hide any old controls that may remain from cached/old HTML.
document.addEventListener("DOMContentLoaded", () => {
  ["desc", "status", "remarks", "pl-desc", "pl-status", "pl-remarks", "timelineTitle"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });
});
