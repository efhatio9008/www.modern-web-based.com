/* =========================================================
   Web Management System - Refactored Frontend
   Keeps current behavior, removes patch-on-patch overrides.
========================================================= */

/* =========================
   STATE
========================= */
let allProjects = [];
let pipelineData = [];
let deploymentData = [];
let applicationData = [];
let timelineData = [];

let searchMode = false;
let pipelineSearchMode = false;
let deploymentSearchMode = false;
let applicationSearchMode = false;

let zoomLevel = 1;

const GROUP_ROWS_PER_PAGE = 30;
const MODULE_PAGE_LIMITS = {
  dashboard: 90,
  pipeline: 90,
  deployment: 90,
  application: 90,
  timeline: 93
};

const groupPageState = {
  dashboard: {},
  pipeline: {},
  deployment: {},
  application: {},
  timeline: {}
};

const moduleSectionPageState = {
  dashboard: 1,
  pipeline: 1,
  deployment: 1,
  application: 1,
  timeline: 1
};

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

let activeGroupDeleteMode = {
  dashboard: null,
  pipeline: null,
  deployment: null,
  application: null,
  timeline: null
};

const CALC_ROWS_PER_PAGE = 10;
const calculationPageState = {
  Pipeline: 1,
  Deployment: 1,
  Application: 1,
  Dashboard: 1
};

/* =========================
   BASIC HELPERS
========================= */
function escHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizeGroupName(name) {
  return String(name || "").trim();
}

function safeFilename(value) {
  return String(value || "group")
    .trim()
    .replace(/[^a-z0-9_\-]+/gi, "_")
    .replace(/^_+|_+$/g, "") || "group";
}

async function apiJson(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`${options.method || "GET"} ${url} failed`);
  return res.json();
}

function postJson(url, body) {
  return apiJson(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

function putJson(url, body) {
  return apiJson(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

function deleteRequest(url) {
  return apiJson(url, { method: "DELETE" });
}

function showOnlyPage(pageId) {
  ["dashboardPage", "timelinePage", "pipelinePage", "deploymentPage", "applicationPage", "calculatePage"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = id === pageId ? "block" : "none";
  });
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

function getGroupInputValue(module) {
  const input = document.getElementById(`${module}GroupName`);
  return input ? input.value.trim() : "";
}

function clearGroupInput(module) {
  const input = document.getElementById(`${module}GroupName`);
  if (input) input.value = "";
}

function groupPageKey(groupTitle) {
  return normalizeGroupName(groupTitle) || "Untitled";
}

function getGroupPage(module, groupTitle) {
  return groupPageState[module]?.[groupPageKey(groupTitle)] || 1;
}

function setGroupPage(module, groupTitle, page) {
  if (!groupPageState[module]) groupPageState[module] = {};
  groupPageState[module][groupPageKey(groupTitle)] = Math.max(1, Number(page) || 1);
}

function getModuleSectionPage(module) {
  return moduleSectionPageState[module] || 1;
}

function setModuleSectionPage(module, page) {
  moduleSectionPageState[module] = Math.max(1, Number(page) || 1);
}

/* =========================
   AUTH / NAVIGATION
========================= */
async function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  if (!res.ok) {
    alert("Login failed");
    return;
  }

  document.getElementById("login").style.display = "none";
  document.getElementById("app").style.display = "block";
  await loadProjects();
  await loadTimeline();
}

function logout() {
  if (!confirm("确定要退出吗？")) return;
  saveVisibleDashboardRows();
  document.getElementById("app").style.display = "none";
  document.getElementById("login").style.display = "flex";
}

function toggleMenu() {
  const box = document.getElementById("menuBox");
  box.style.display = box.style.display === "block" ? "none" : "block";
}

function goDashboard() {
  showOnlyPage("dashboardPage");
  loadProjects();
}

function goTimeline() {
  saveVisibleDashboardRows();
  showOnlyPage("timelinePage");
  loadTimeline();
}

function goPipeline() {
  showOnlyPage("pipelinePage");
  loadPipeline();
}

function goDeployment() {
  showOnlyPage("deploymentPage");
  loadDeployment();
}

function goApplication() {
  showOnlyPage("applicationPage");
  loadApplication();
}

function goCalculate() {
  showOnlyPage("calculatePage");
  clearCalculation();
}

function zoomIn() {
  zoomLevel += 0.1;
  document.body.style.zoom = zoomLevel;
}

function zoomOut() {
  zoomLevel -= 0.1;
  document.body.style.zoom = zoomLevel;
}

/* =========================
   MODULE CONFIG
========================= */
function moduleConfig(module) {
  return {
    dashboard: {
      data: () => allProjects,
      setData: value => { allProjects = value; },
      tableId: "table",
      selectCol: ".dashboard-select-col",
      addUrl: "/api/projects",
      deleteUrl: id => `/api/projects/${id}`,
      load: loadProjects,
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
      })
    },
    pipeline: {
      data: () => pipelineData,
      setData: value => { pipelineData = value; },
      tableId: "pipelineTable",
      selectCol: ".pipeline-select-col",
      addUrl: "/api/pipeline",
      deleteUrl: id => `/api/pipeline/${id}`,
      load: loadPipeline,
      updateGroup: async (row, group) => {
        row.project_group = group;
        await updatePipeline(row.id, "project_group", group);
      },
      blankBody: group => ({ description: "", status: "", remarks: "", project_group: group })
    },
    deployment: {
      data: () => deploymentData,
      setData: value => { deploymentData = value; },
      tableId: "deploymentTable",
      selectCol: ".deployment-select-col",
      addUrl: "/api/deployment",
      deleteUrl: id => `/api/deployment/${id}`,
      load: loadDeployment,
      updateGroup: async (row, group) => {
        row.project_group = group;
        await updateDeployment(row.id, "project_group", group);
      },
      blankBody: group => ({ project_group: group })
    },
    application: {
      data: () => applicationData,
      setData: value => { applicationData = value; },
      tableId: "applicationTable",
      selectCol: ".application-select-col",
      addUrl: "/api/application",
      deleteUrl: id => `/api/application/${id}`,
      load: loadApplication,
      updateGroup: async (row, group) => {
        row.project_group = group;
        await updateApplication(row.id, "project_group", group);
      },
      blankBody: group => ({ project_group: group })
    },
    timeline: {
      data: () => timelineData,
      setData: value => { timelineData = value; },
      tableId: "timelineTable",
      selectCol: ".timeline-select-col",
      addUrl: "/api/timeline",
      deleteUrl: id => `/api/timeline/${id}`,
      load: loadTimeline,
      updateGroup: async (row, group) => {
        row.project_group = group;
        await saveTimelineRow(row.id);
      },
      blankBody: group => ({
        year: timelineYearValue(),
        months: Array(12).fill(""),
        status: "",
        project_group: group
      })
    }
  }[module];
}

/* =========================
   LOAD / UPDATE DATA
========================= */
async function loadProjects() {
  allProjects = await apiJson("/api/projects");
  renderProjects();
}

async function loadPipeline() {
  pipelineData = await apiJson("/api/pipeline");
  renderPipeline();
}

async function loadDeployment() {
  deploymentData = await apiJson("/api/deployment");
  renderDeployment();
}

async function loadApplication() {
  applicationData = await apiJson("/api/application");
  renderApplication();
}

async function loadTimeline() {
  const year = timelineYearValue();
  timelineData = await apiJson(`/api/timeline?year=${year}`);
  timelineData.forEach(row => normalizeTimelineMonths(row));
  renderTimeline();
}

function updateLocalProject(id) {
  const p = allProjects.find(item => Number(item.id) === Number(id));
  if (!p) return;

  const fieldMap = {
    desc: "project_description",
    status: "status",
    remarks: "remarks",
    tendering: "tendering",
    bg: "bg_insurance",
    cwr: "cwr_po_received",
    workscope: "workscope",
    cost: "cost_proposal",
    ccc: "ccc_readiness_manpower",
    procurement: "procurement_material",
    delivery: "delivery_material_site",
    fcb: "fcb_booking",
    mob: "mob_execution",
    handover: "handover_site",
    demob: "demob_date",
    close: "close_out_report"
  };

  Object.entries(fieldMap).forEach(([domField, dataField]) => {
    const el = document.getElementById(`${domField}-${id}`);
    if (el) p[dataField] = el.innerText.trim();
  });
}

async function saveProject(id) {
  const p = allProjects.find(item => Number(item.id) === Number(id));
  if (!p) return;

  await putJson(`/api/projects/${id}`, {
    project_description: p.project_description || "",
    status: p.status || "",
    remarks: p.remarks || "",
    tendering: p.tendering || "",
    bg_insurance: p.bg_insurance || "",
    cwr_po_received: p.cwr_po_received || "",
    workscope: p.workscope || "",
    cost_proposal: p.cost_proposal || "",
    ccc_readiness_manpower: p.ccc_readiness_manpower || "",
    procurement_material: p.procurement_material || "",
    delivery_material_site: p.delivery_material_site || "",
    fcb_booking: p.fcb_booking || "",
    mob_execution: p.mob_execution || "",
    handover_site: p.handover_site || "",
    demob_date: p.demob_date || "",
    close_out_report: p.close_out_report || "",
    project_group: p.project_group || p.groupTitle || ""
  });
}

function autoSave(id) {
  updateLocalProject(id);
  saveProject(id);
}

async function updatePipeline(id, field, value) {
  const row = pipelineData.find(r => Number(r.id) === Number(id));
  if (!row) return;
  row[field] = String(value || "").trim();
  await putJson(`/api/pipeline/${id}`, row);
}

async function updateDeployment(id, field, value) {
  const row = deploymentData.find(r => Number(r.id) === Number(id));
  if (!row) return;
  row[field] = String(value || "").trim();
  await putJson(`/api/deployment/${id}`, row);
}

async function updateApplication(id, field, value) {
  const row = applicationData.find(r => Number(r.id) === Number(id));
  if (!row) return;
  row[field] = String(value || "").trim();
  await putJson(`/api/application/${id}`, row);
}

async function saveTimelineRow(id) {
  const row = timelineData.find(item => Number(item.id) === Number(id));
  if (!row) return;
  normalizeTimelineMonths(row);
  await putJson(`/api/timeline/${id}`, {
    months: row.months,
    status: row.status || "",
    project_group: row.project_group || row.groupTitle || ""
  });
}

function saveVisibleDashboardRows() {
  document.querySelectorAll("#table tr").forEach(row => {
    const descCell = row.querySelector("[id^='desc-']");
    if (!descCell) return;
    const id = Number(descCell.id.replace("desc-", ""));
    updateLocalProject(id);
    saveProject(id);
  });
}

/* =========================
   FILE UPLOAD
========================= */
async function uploadFile(id) {
  const fileInput = document.getElementById(`file-${id}`);
  if (!fileInput.files.length) {
    alert("Please choose a file first");
    return;
  }

  const formData = new FormData();
  formData.append("file", fileInput.files[0]);

  await fetch(`/api/upload/${id}`, { method: "POST", body: formData });
  alert("SI report uploaded ✅");
  loadProjects();
}

async function removeFile(id) {
  if (!confirm("Remove this SI report?")) return;
  await deleteRequest(`/api/upload/${id}`);
  loadProjects();
}

/* =========================
   GROUPING / ORDERING
========================= */
function getRowsPerPageByModule(module) {
  if (module === "timeline") return 31;
  return GROUP_ROWS_PER_PAGE;
}

function getLegacyPageTitle(module, index) {
  const page = Math.floor(index / getRowsPerPageByModule(module)) + 1;
  return localStorage.getItem(`title-${module}-page-${page}`)?.trim() || "";
}

function getEffectiveGroupName(row, module, index = 0) {
  return normalizeGroupName(row?.project_group) || getLegacyPageTitle(module, index) || "Untitled";
}

function getRowGroup(row, module, index = 0) {
  return getEffectiveGroupName(row, module, index);
}

function getStoredGroupOrder(module) {
  try { return JSON.parse(localStorage.getItem(`group-order-${module}`) || "[]"); }
  catch { return []; }
}

function setStoredGroupOrder(module, order) {
  localStorage.setItem(`group-order-${module}`, JSON.stringify(order));
}

function groupRows(data, module) {
  const groups = [];
  const map = new Map();

  data.forEach((row, index) => {
    const group = getEffectiveGroupName(row, module, index);
    if (!map.has(group)) {
      map.set(group, []);
      groups.push({ title: group, rows: map.get(group) });
    }
    map.get(group).push(row);
  });

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
}

function rowNumberedGroups(data, module) {
  return groupRows(data, module).map(group => {
    const rows = module === "timeline" ? [...group.rows].sort((a, b) => Number(a.id) - Number(b.id)) : group.rows;
    return {
      title: group.title,
      rows: rows.map((row, index) => ({
        ...row,
        project_group: group.title === "Untitled" ? (row.project_group || "") : group.title,
        groupTitle: group.title,
        displayId: index + 1
      }))
    };
  });
}

function assignGroupDisplayIds(data, module) {
  return rowNumberedGroups(data, module).flatMap(group => group.rows);
}

async function addGroup(module) {
  const cfg = moduleConfig(module);
  if (!cfg) return;

  const group = normalizeGroupName(getGroupInputValue(module));
  if (!group) {
    alert("Please type a title first");
    return;
  }

  const exists = cfg.data().some(row => normalizeGroupName(row.project_group) === group);
  if (exists) {
    if (!confirm("This group already exists. Add one more row inside it?")) return;
    return addRowToGroup(module, group);
  }

  if (module === "timeline" && getTimelineGroupRows(group).length >= 31) {
    alert("Timeline groups are limited to 31 day rows.");
    return;
  }

  const targetPage = nextModulePageForNewGroup(module);
  placeNewGroupInModuleOrder(module, group, targetPage);
  setModuleSectionPage(module, targetPage);

  await postJson(cfg.addUrl, cfg.blankBody(group));
  clearGroupInput(module);
  await cfg.load();
  setModuleSectionPage(module, targetPage);
  renderModuleByName(module);
}

async function addRowToGroup(module, group) {
  const cfg = moduleConfig(module);
  if (!cfg) return;

  group = normalizeGroupName(group);
  if (!group || group === "Untitled") {
    alert(module === "timeline" ? "Please rename this Timeline group before adding rows" : "Please rename this group before adding rows");
    return;
  }

  if (module === "timeline" && getTimelineGroupRows(group).length >= 31) {
    alert("Timeline groups are limited to 31 day rows.");
    return;
  }

  await postJson(cfg.addUrl, cfg.blankBody(group));

  if (module !== "timeline") {
    const currentCount = cfg.data().filter((row, index) => getEffectiveGroupName(row, module, index) === group).length;
    setGroupPage(module, group, Math.ceil((currentCount + 1) / GROUP_ROWS_PER_PAGE));
  }

  await cfg.load();
}

async function deleteGroup(module, group) {
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
    await deleteRequest(cfg.deleteUrl(row.id));
  }

  activeGroupDeleteMode[module] = null;
  selectMode[module] = false;
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

  const rows = cfg.data().filter((row, index) => getEffectiveGroupName(row, module, index) === oldGroup);
  for (const row of rows) await cfg.updateGroup(row, newGroup);

  const order = getStoredGroupOrder(module).map(title => title === oldGroup ? newGroup : title);
  setStoredGroupOrder(module, [...new Set(order)]);
  await cfg.load();
}

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

async function copyGroup(module, groupTitle) {
  const cfg = moduleConfig(module);
  if (!cfg) return;

  groupTitle = normalizeGroupName(groupTitle);
  const rows = cfg.data().filter((row, index) => getEffectiveGroupName(row, module, index) === groupTitle);
  if (!rows.length) return alert("No rows to copy");

  const newGroup = normalizeGroupName(prompt("New copied group title:", `${groupTitle} Copy`));
  if (!newGroup) return;

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

    if (module === "deployment" || module === "application") {
      body.project_group = newGroup;
    }

    if (module === "timeline") {
      body = {
        year: timelineYearValue(),
        months: Array.isArray(row.months) ? [...row.months] : Array(12).fill(""),
        status: row.status || "",
        project_group: newGroup
      };
    }

    await postJson(cfg.addUrl, body);
  }

  const order = getStoredGroupOrder(module);
  if (!order.includes(newGroup)) order.push(newGroup);
  setStoredGroupOrder(module, order);
  await cfg.load();
}

/* =========================
   DELETE MODE
========================= */
function isGroupDeleteActive(module, group) {
  return activeGroupDeleteMode[module] === normalizeGroupName(group);
}

function isRowSelectableForActiveGroup(module, row) {
  const activeGroup = activeGroupDeleteMode[module];
  if (!activeGroup) return false;
  return normalizeGroupName(row.groupTitle || row.project_group || "Untitled") === activeGroup;
}

function startGroupDeleteMode(module, group) {
  activeGroupDeleteMode[module] = normalizeGroupName(group);
  selectMode[module] = true;
  selectedIds[module].clear();
  renderModuleByName(module);
}

async function confirmGroupDelete(module, group) {
  if (!selectedIds[module] || !selectedIds[module].size) {
    alert("Please select row(s) to delete first");
    return;
  }

  if (!confirm(`Delete selected row(s) from "${normalizeGroupName(group)}"?`)) return;
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

function toggleRow(id, module) {
  const set = selectedIds[module];
  if (set.has(id)) set.delete(id);
  else set.add(id);
}

async function bulkDelete(module) {
  if (!selectedIds[module].size) {
    alert("没有选择任何行");
    return;
  }

  if (!confirm("确定删除这些数据？")) return;

  const cfg = moduleConfig(module);
  for (const id of selectedIds[module]) {
    await deleteRequest(cfg.deleteUrl(id));
  }

  selectedIds[module].clear();
  await cfg.load();
}

function toggleSelect(module) {
  selectMode[module] = !selectMode[module];
  selectedIds[module].clear();
  renderModuleByName(module);
}

function startDeleteMode() {
  alert("Use the Delete Row button inside the group you want to edit.");
}

/* =========================
   TIMELINE 31-DAY LOGIC
========================= */
function timelineYearValue() {
  return Number(document.getElementById("timelineYear")?.value || 2026);
}

function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function daysInMonth(year, monthIndex) {
  return [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][monthIndex] || 31;
}

function normalizeTimelineMonths(row) {
  if (typeof row.months === "string") {
    try { row.months = JSON.parse(row.months); }
    catch { row.months = Array(12).fill(""); }
  }
  if (!Array.isArray(row.months)) row.months = Array(12).fill("");
  while (row.months.length < 12) row.months.push("");
  if (row.months.length > 12) row.months = row.months.slice(0, 12);
  return row.months;
}

function getTimelineGroupRows(groupTitle) {
  const target = normalizeGroupName(groupTitle);
  return timelineData.filter((row, index) => getEffectiveGroupName(row, "timeline", index) === target);
}

function timelineDayForRow(row, groupRowsList) {
  const sorted = [...groupRowsList].sort((a, b) => Number(a.id) - Number(b.id));
  const index = sorted.findIndex(r => Number(r.id) === Number(row.id));
  return index >= 0 ? index + 1 : 1;
}

function timelineCanEditDate(day, monthIndex) {
  return day <= daysInMonth(timelineYearValue(), monthIndex);
}

function timelineDisabledReason(day, monthIndex) {
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${monthNames[monthIndex]} ${timelineYearValue()} has only ${daysInMonth(timelineYearValue(), monthIndex)} days`;
}

function updateTimelineCell(id, monthIndex, value) {
  const row = timelineData.find(item => Number(item.id) === Number(id));
  if (!row) return;

  const groupRowsList = getTimelineGroupRows(row.project_group || row.groupTitle || "Untitled");
  const day = timelineDayForRow(row, groupRowsList);

  if (!timelineCanEditDate(day, monthIndex)) {
    alert(timelineDisabledReason(day, monthIndex));
    renderTimeline();
    return;
  }

  normalizeTimelineMonths(row);
  row.months[monthIndex] = String(value || "").trim();
  saveTimelineRow(id);
}

function updateTimelineStatus(id, value) {
  const row = timelineData.find(item => Number(item.id) === Number(id));
  if (!row) return;
  row.status = String(value || "").trim();
  saveTimelineRow(id);
}

/* =========================
   MODULE PAGINATION
========================= */
function moduleVisibleRowLimit(module) {
  return MODULE_PAGE_LIMITS[module] || 90;
}

function groupVisibleContribution(module, group) {
  if (module === "timeline") return Math.min(group.rows.length || 1, 31);
  return Math.min(group.rows.length || 1, GROUP_ROWS_PER_PAGE);
}

function getModulePagedGroups(module) {
  const cfg = moduleConfig(module);
  if (!cfg) return [];

  const limit = moduleVisibleRowLimit(module);
  let page = 1;
  let used = 0;

  return rowNumberedGroups(cfg.data(), module).map(group => {
    const contribution = Math.max(1, groupVisibleContribution(module, group));

    if (used > 0 && used + contribution > limit) {
      page += 1;
      used = 0;
    }

    const assignedPage = page;
    used += contribution;

    return { ...group, modulePage: assignedPage, visibleContribution: contribution };
  });
}

function getModuleTotalPages(module) {
  const groups = getModulePagedGroups(module);
  if (!groups.length) return 1;
  return Math.max(...groups.map(group => group.modulePage), 1);
}

function getCurrentModulePageUsedRows(module) {
  const page = getModuleSectionPage(module);
  return getModulePagedGroups(module)
    .filter(group => group.modulePage === page)
    .reduce((sum, group) => sum + group.visibleContribution, 0);
}

function nextModulePageForNewGroup(module) {
  const contribution = module === "timeline" ? 31 : GROUP_ROWS_PER_PAGE;
  const usedRows = getCurrentModulePageUsedRows(module);
  let targetPage = getModuleSectionPage(module);
  if (usedRows > 0 && usedRows + contribution > moduleVisibleRowLimit(module)) targetPage += 1;
  return targetPage;
}

function placeNewGroupInModuleOrder(module, groupTitle, targetPage) {
  const cfg = moduleConfig(module);
  if (!cfg) return;

  const group = normalizeGroupName(groupTitle);
  const existingTitles = groupRows(cfg.data(), module).map(g => g.title);
  let order = getStoredGroupOrder(module).filter(title => existingTitles.includes(title) && title !== group);
  existingTitles.forEach(title => {
    if (title !== group && !order.includes(title)) order.push(title);
  });

  const pagedGroups = getModulePagedGroups(module).filter(g => g.title !== group);
  let insertAfter = -1;

  pagedGroups.forEach(g => {
    if (g.modulePage <= targetPage) {
      const index = order.indexOf(g.title);
      if (index > insertAfter) insertAfter = index;
    }
  });

  order.splice(insertAfter + 1, 0, group);
  setStoredGroupOrder(module, order);
}

function ensureModulePaginationElement(module) {
  const id = `${module}ModulePagination`;
  let div = document.getElementById(id);
  if (div) return div;

  const pageId = module === "dashboard" ? "dashboardPage" : `${module}Page`;
  const wrapper = document.querySelector(`#${pageId} .table-wrapper`);
  if (!wrapper) return null;

  div = document.createElement("div");
  div.id = id;
  div.className = "module-pagination";
  wrapper.after(div);
  return div;
}

function renderModulePagination(module) {
  const div = ensureModulePaginationElement(module);
  if (!div) return;

  const totalPages = getModuleTotalPages(module);
  const current = Math.min(getModuleSectionPage(module), totalPages);
  setModuleSectionPage(module, current);

  const usedRows = getCurrentModulePageUsedRows(module);
  const limit = moduleVisibleRowLimit(module);
  const moduleArg = JSON.stringify(module);

  let html = `
    <span class="module-page-info">Module Page ${current} / ${totalPages} · ${usedRows}/${limit} rows</span>
    <button onclick='changeModulePage(${moduleArg}, ${current - 1})' ${current <= 1 ? "disabled" : ""}>‹</button>
  `;

  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="${current === i ? "active-page" : ""}" onclick='changeModulePage(${moduleArg}, ${i})'>${i}</button>`;
  }

  html += `<button onclick='changeModulePage(${moduleArg}, ${current + 1})' ${current >= totalPages ? "disabled" : ""}>›</button>`;
  div.innerHTML = html;
}

function changeModulePage(module, page) {
  const totalPages = getModuleTotalPages(module);
  const nextPage = Math.min(Math.max(1, Number(page) || 1), totalPages);
  setModuleSectionPage(module, nextPage);
  renderModuleByName(module);
}

/* =========================
   COLLAPSE / SUMMARY
========================= */
function isGroupCollapsed(module, groupTitle) {
  return localStorage.getItem(`group-collapsed-${module}-${groupPageKey(groupTitle)}`) === "1";
}

function toggleGroupCollapse(module, groupTitle) {
  const key = `group-collapsed-${module}-${groupPageKey(groupTitle)}`;
  localStorage.setItem(key, localStorage.getItem(key) === "1" ? "0" : "1");
  renderModuleByName(module);
}

function rowHasContent(row, module) {
  if (module === "timeline") {
    return (row.months || []).some(v => String(v || "").trim()) || String(row.status || "").trim();
  }

  const skip = new Set(["id", "sort_order", "displayId", "project_group", "groupTitle", "year"]);
  return Object.keys(row).some(key => !skip.has(key) && String(row[key] ?? "").trim() !== "");
}

function groupSummary(module, rows) {
  const filled = rows.filter(row => rowHasContent(row, module)).length;
  return `${rows.length} row(s), ${filled} filled`;
}

/* =========================
   RENDERERS
========================= */
function groupPaginationHtml(module, groupTitle, rowCount) {
  if (module === "timeline") {
    return `<span class="group-page-note timeline-day-limit-note">${rowCount}/31 day rows</span>`;
  }

  const totalPages = Math.max(1, Math.ceil(rowCount / GROUP_ROWS_PER_PAGE));
  const current = Math.min(getGroupPage(module, groupTitle), totalPages);
  setGroupPage(module, groupTitle, current);

  if (totalPages <= 1) return `<span class="group-page-note">Page 1 / 1</span>`;

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

function groupHeaderHtml(module, groupTitle, rowCount) {
  const cfg = moduleConfig(module);
  const rows = cfg ? cfg.data().filter((row, index) => getEffectiveGroupName(row, module, index) === normalizeGroupName(groupTitle)) : [];
  const safeTitle = escHtml(groupTitle);
  const moduleArg = JSON.stringify(module);
  const groupArg = JSON.stringify(groupTitle);
  const deleting = isGroupDeleteActive(module, groupTitle);
  const collapsed = isGroupCollapsed(module, groupTitle);

  const deleteControls = deleting
    ? `<button class="confirm-delete-btn" onclick='confirmGroupDelete(${moduleArg}, ${groupArg})'>Confirm Delete</button>
       <button class="cancel-delete-btn" onclick='cancelGroupDelete(${moduleArg})'>Cancel</button>`
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

  const totalPages = getModuleTotalPages(module);
  const currentModulePage = Math.min(getModuleSectionPage(module), totalPages);
  setModuleSectionPage(module, currentModulePage);

  const groups = getModulePagedGroups(module).filter(group => group.modulePage === currentModulePage);

  if (!groups.length) {
    table.innerHTML = `<tr class="group-title-row"><td colspan="99">No groups on this page yet. Type a title above and click Add Group.</td></tr>`;
    renderModulePagination(module);
    return;
  }

  groups.forEach(group => {
    if (module === "timeline") {
      const rows = [...group.rows]
        .sort((a, b) => Number(a.id) - Number(b.id))
        .slice(0, 31)
        .map((row, index) => ({ ...row, displayId: index + 1, groupTitle: group.title, project_group: row.project_group || group.title }));

      table.innerHTML += groupHeaderHtml("timeline", group.title, rows.length);
      if (!isGroupCollapsed("timeline", group.title)) rows.forEach(row => { table.innerHTML += rowRenderer(row); });
      return;
    }

    const totalGroupPages = Math.max(1, Math.ceil(group.rows.length / GROUP_ROWS_PER_PAGE));
    const groupPage = Math.min(getGroupPage(module, group.title), totalGroupPages);
    setGroupPage(module, group.title, groupPage);

    const start = (groupPage - 1) * GROUP_ROWS_PER_PAGE;
    const visibleRows = group.rows.slice(start, start + GROUP_ROWS_PER_PAGE);

    table.innerHTML += groupHeaderHtml(module, group.title, group.rows.length);
    if (!isGroupCollapsed(module, group.title)) visibleRows.forEach(row => { table.innerHTML += rowRenderer(row); });
  });

  renderModulePagination(module);
}

function renderDashboardRow(p) {
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
}

function renderPipelineRow(row) {
  const showSelect = isRowSelectableForActiveGroup("pipeline", row);
  const fields = ["description", "status", "presentation", "commercial", "technical", "site_visit", "received_orders", "issue_po", "transport", "lead_time", "etb", "eta", "transport_site", "do_acceptance", "install_start", "project_end", "remarks"];
  return `<tr>${showSelect ? `<td><input type="checkbox" onchange="toggleRow(${row.id}, 'pipeline')"></td>` : (selectMode.pipeline ? `<td></td>` : "")}<td>${row.displayId}</td>${fields.map(field => `<td contenteditable="true" data-fill="true" data-module="pipeline" data-id="${row.id}" data-field="${field}" onblur="updatePipeline(${row.id}, '${field}', this.innerText)">${escHtml(row[field] || "")}</td>`).join("")}</tr>`;
}

function renderDeploymentRow(row) {
  const showSelect = isRowSelectableForActiveGroup("deployment", row);
  const fields = ["deployment_type", "status", "date_start", "date_complete", "remarks"];
  return `<tr>${showSelect ? `<td><input type="checkbox" onchange="toggleRow(${row.id}, 'deployment')"></td>` : (selectMode.deployment ? `<td></td>` : "")}<td>${row.displayId}</td>${fields.map(field => `<td contenteditable="true" data-fill="true" data-module="deployment" data-id="${row.id}" data-field="${field}" onblur="updateDeployment(${row.id}, '${field}', this.innerText)">${escHtml(row[field] || "")}</td>`).join("")}</tr>`;
}

function renderApplicationRow(row) {
  const showSelect = isRowSelectableForActiveGroup("application", row);
  const fields = ["project_description", "status", "date_start", "date_complete", "remarks"];
  return `<tr>${showSelect ? `<td><input type="checkbox" onchange="toggleRow(${row.id}, 'application')"></td>` : (selectMode.application ? `<td></td>` : "")}<td>${row.displayId}</td>${fields.map(field => `<td contenteditable="true" data-fill="true" data-module="application" data-id="${row.id}" data-field="${field}" onblur="updateApplication(${row.id}, '${field}', this.innerText)">${escHtml(row[field] || "")}</td>`).join("")}</tr>`;
}

function renderTimelineRow(row) {
  const groupRowsList = getTimelineGroupRows(row.groupTitle || row.project_group || "Untitled");
  const day = timelineDayForRow(row, groupRowsList);
  const months = normalizeTimelineMonths(row);
  const showSelect = selectMode.timeline && isRowSelectableForActiveGroup("timeline", row);

  return `
    <tr class="timeline-day-row">
      ${showSelect ? `<td><input type="checkbox" onchange="toggleRow(${row.id}, 'timeline')"></td>` : (selectMode.timeline ? `<td></td>` : "")}
      <td class="timeline-day-number">${day}</td>
      ${months.map((m, monthIndex) => {
        const editable = timelineCanEditDate(day, monthIndex);
        const disabledText = editable ? "" : `title="${escHtml(timelineDisabledReason(day, monthIndex))}"`;
        return `<td class="timeline-month-cell ${editable ? "" : "timeline-disabled-cell"}" ${editable ? "contenteditable=\"true\"" : "contenteditable=\"false\""} data-fill="${editable ? "true" : "false"}" data-module="timeline" data-id="${row.id}" data-field="${monthIndex}" ${disabledText} ${editable ? `onblur="updateTimelineCell(${row.id}, ${monthIndex}, this.innerText)"` : ""}>${editable ? escHtml(m || "") : "—"}</td>`;
      }).join("")}
      <td contenteditable="true" data-fill="true" data-module="timeline" data-id="${row.id}" data-field="status" onblur="updateTimelineStatus(${row.id}, this.innerText)">${escHtml(row.status || "")}</td>
    </tr>`;
}

function renderProjects() { renderGroupedModule("dashboard", renderDashboardRow); }
function renderPipeline() { renderGroupedModule("pipeline", renderPipelineRow); }
function renderDeployment() { renderGroupedModule("deployment", renderDeploymentRow); }
function renderApplication() { renderGroupedModule("application", renderApplicationRow); }
function renderTimeline() { renderGroupedModule("timeline", renderTimelineRow); }

function changeGroupPage(module, groupTitle, page) {
  const cfg = moduleConfig(module);
  if (!cfg) return;

  const rows = cfg.data().filter((row, index) => getEffectiveGroupName(row, module, index) === groupTitle);
  const totalPages = Math.max(1, Math.ceil(rows.length / GROUP_ROWS_PER_PAGE));
  const nextPage = Math.min(Math.max(1, Number(page) || 1), totalPages);
  setGroupPage(module, groupTitle, nextPage);
  renderModuleByName(module);
}

/* =========================
   SEARCH / REFRESH
========================= */
function renderSearchResults(module, rows, rowRenderer) {
  const cfg = moduleConfig(module);
  const table = document.getElementById(cfg.tableId);
  table.innerHTML = "";

  const groups = groupRows(rows, module).map(group => ({ title: group.title, rows: group.rows.map(row => ({ ...row })) }));
  groups.forEach(group => {
    table.innerHTML += groupHeaderHtml(module, group.title, group.rows.length);
    group.rows.forEach(row => { table.innerHTML += rowRenderer(row); });
  });
}

function searchById() {
  const id = Number(document.getElementById("searchId").value);
  if (!id) return alert("Please enter ID");
  const found = assignGroupDisplayIds(allProjects, "dashboard").filter(row => row.displayId === id);
  if (!found.length) return alert("ID not found");
  searchMode = true;
  renderSearchResults("dashboard", found, renderDashboardRow);
}

function searchPipeline() {
  const id = Number(document.getElementById("pipelineSearchId").value);
  if (!id) return alert("Please enter ID");
  const found = assignGroupDisplayIds(pipelineData, "pipeline").filter(row => row.displayId === id);
  if (!found.length) return alert("ID not found");
  pipelineSearchMode = true;
  renderSearchResults("pipeline", found, renderPipelineRow);
}

function searchDeployment() {
  const id = Number(document.getElementById("deploymentSearchId").value);
  if (!id) return alert("Please enter ID");
  const found = assignGroupDisplayIds(deploymentData, "deployment").filter(row => row.displayId === id);
  if (!found.length) return alert("ID not found");
  deploymentSearchMode = true;
  renderSearchResults("deployment", found, renderDeploymentRow);
}

function searchApplication() {
  const id = Number(document.getElementById("applicationSearchId").value);
  if (!id) return alert("Please enter ID");
  const found = assignGroupDisplayIds(applicationData, "application").filter(row => row.displayId === id);
  if (!found.length) return alert("ID not found");
  applicationSearchMode = true;
  renderSearchResults("application", found, renderApplicationRow);
}

function clearSearch() {
  document.getElementById("searchId").value = "";
  searchMode = false;
  renderProjects();
}

function clearPipelineSearch() {
  document.getElementById("pipelineSearchId").value = "";
  pipelineSearchMode = false;
  renderPipeline();
}

function clearDeploymentSearch() {
  document.getElementById("deploymentSearchId").value = "";
  deploymentSearchMode = false;
  renderDeployment();
}

function clearApplicationSearch() {
  document.getElementById("applicationSearchId").value = "";
  applicationSearchMode = false;
  renderApplication();
}

function refreshDashboard() { setModuleSectionPage("dashboard", 1); searchMode = false; loadProjects(); }
function refreshPipeline() { setModuleSectionPage("pipeline", 1); pipelineSearchMode = false; loadPipeline(); }
function refreshDeployment() { setModuleSectionPage("deployment", 1); deploymentSearchMode = false; loadDeployment(); }
function refreshApplication() { setModuleSectionPage("application", 1); applicationSearchMode = false; loadApplication(); }
function refreshTimeline() { setModuleSectionPage("timeline", 1); loadTimeline(); }

/* =========================
   EXPORTS
========================= */
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

function exportGroup(module, groupTitle) {
  const cfg = moduleConfig(module);
  if (!cfg) return;

  const rows = assignGroupDisplayIds(cfg.data(), module)
    .filter(row => normalizeGroupName(row.groupTitle || row.project_group || "Untitled") === normalizeGroupName(groupTitle));

  if (!rows.length) return alert("No rows to export for this group");
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
    return;
  }

  if (module === "timeline") {
    const orderedRows = rowNumberedGroups(timelineData, "timeline")
      .find(group => normalizeGroupName(group.title) === normalizeGroupName(groupTitle))?.rows || [];
    const csvRows = orderedRows.sort((a, b) => Number(a.id) - Number(b.id)).slice(0, 31).map((row, index) => {
      const day = index + 1;
      const months = normalizeTimelineMonths(row).map((value, monthIndex) => timelineCanEditDate(day, monthIndex) ? value : "NA");
      return [day, ...months, row.status || ""];
    });
    exportCsv(`timeline_${safeFilename(groupTitle)}_${timelineYearValue()}.csv`, ["Day", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Status"], csvRows);
  }
}

function exportExcel() { alert("Use the Export button inside each group title."); }
function exportPipeline() { alert("Use the Export button inside each group title."); }
function exportDeployment() { alert("Use the Export button inside each group title."); }
function exportApplication() { alert("Use the Export button inside each group title."); }
function exportTimelineExcel() { alert("Use the Export button inside each Timeline group title."); }

/* =========================
   CALCULATION
========================= */
function calculateModule(data, module) {
  const result = {};
  let total = 0;
  let firstRow = null;
  let lastRow = null;

  assignGroupDisplayIds(data, module).forEach((row, index) => {
    const groupTitle = getRowGroup(row, module, index);
    if (!groupTitle || groupTitle === "Untitled") return;

    if (!rowHasContent(row, module)) return;

    if (!result[groupTitle]) result[groupTitle] = { count: 0, start: null, end: null };

    const rowNo = row.displayId;
    total++;
    if (firstRow === null) firstRow = rowNo;
    lastRow = rowNo;
    if (result[groupTitle].start === null) result[groupTitle].start = rowNo;
    result[groupTitle].end = rowNo;
    result[groupTitle].count++;
  });

  return { result, total, firstRow, lastRow };
}

async function runCalculation() {
  await loadProjects();
  await loadPipeline();
  await loadDeployment();
  await loadApplication();

  let html = "";
  html += buildTable("Pipeline", calculateModule(pipelineData, "pipeline"));
  html += buildTable("Deployment", calculateModule(deploymentData, "deployment"));
  html += buildTable("Application", calculateModule(applicationData, "application"));
  html += buildTable("Dashboard", calculateModule(allProjects, "dashboard"));

  document.getElementById("calculateResult").innerHTML = html;
}

function buildTable(title, dataObj) {
  const { result, total } = dataObj;
  const rows = Object.entries(result);
  const totalPages = Math.max(1, Math.ceil(rows.length / CALC_ROWS_PER_PAGE));
  const currentPage = Math.min(Math.max(1, calculationPageState[title] || 1), totalPages);
  calculationPageState[title] = currentPage;

  const start = (currentPage - 1) * CALC_ROWS_PER_PAGE;
  const visibleRows = rows.slice(start, start + CALC_ROWS_PER_PAGE);
  const titleArg = JSON.stringify(title);

  let html = `
    <div class="calc-module-card">
      <div class="calc-module-header">
        <h3>${escHtml(title)}</h3>
        <div class="calc-pagination">
          <span>Page ${currentPage} / ${totalPages}</span>
          <button onclick='changeCalculationPage(${titleArg}, ${currentPage - 1})' ${currentPage <= 1 ? "disabled" : ""}>‹</button>
          <button onclick='changeCalculationPage(${titleArg}, ${currentPage + 1})' ${currentPage >= totalPages ? "disabled" : ""}>›</button>
        </div>
      </div>
      <table class="calc-table" border="1">
        <colgroup>
          <col class="calc-type-col">
          <col class="calc-project-col">
          <col class="calc-range-col">
        </colgroup>
        <tr><th>Type</th><th>Projects</th><th>Range</th></tr>
  `;

  visibleRows.forEach(([type, r]) => {
    html += `<tr><td class="calc-type-cell">${escHtml(type)}</td><td>${r.count}</td><td>${r.start} - ${r.end}</td></tr>`;
  });

  html += `<tr class="calc-total-row"><td>Total</td><td>${total}</td><td>NA</td></tr></table></div>`;
  return html;
}

function changeCalculationPage(title, page) {
  const nextPage = Math.max(1, Number(page) || 1);
  calculationPageState[title] = nextPage;
  runCalculation();
}

function clearCalculation() {
  const resultBox = document.getElementById("calculateResult");
  if (resultBox) resultBox.innerHTML = "";
}

/* =========================
   FILL DRAG COPY
========================= */
let fillStartCell = null;
let fillCells = [];

document.addEventListener("mousedown", e => {
  const cell = e.target.closest("td[data-fill='true']");
  if (!cell) return;
  fillStartCell = cell;
  fillCells = [cell];
  cell.classList.add("fill-selected");
});

document.addEventListener("mouseover", e => {
  if (!fillStartCell) return;
  const cell = e.target.closest("td[data-fill='true']");
  if (!cell) return;

  const sameModule = cell.dataset.module === fillStartCell.dataset.module;
  const sameColumn = cell.dataset.field === fillStartCell.dataset.field;
  const sameRow = cell.parentElement === fillStartCell.parentElement;

  if (sameModule && (sameColumn || sameRow) && !fillCells.includes(cell)) {
    fillCells.push(cell);
    cell.classList.add("fill-selected");
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

    if (module === "pipeline") await updatePipeline(id, field, value);
    if (module === "deployment") await updateDeployment(id, field, value);
    if (module === "application") await updateApplication(id, field, value);

    if (module === "timeline") {
      const row = timelineData.find(r => Number(r.id) === Number(id));
      if (!row) continue;
      if (field === "status") row.status = value;
      else row.months[Number(field)] = value;
      await saveTimelineRow(id);
    }
  }

  fillCells.forEach(c => c.classList.remove("fill-selected"));
  fillStartCell = null;
  fillCells = [];
});



/* =========================
   RIGHT CLICK ICON PICKER
   Icons are saved as normal text inside the existing editable cell.
========================= */
const CELL_ICON_CHOICES = [
  "✅", "⚠️", "📅", "🛠️", "🚚",
  "📄", "📌", "⏳", "⭐", "🔥",
  "📍", "👍", "😊", "😐", "❌"
];

let iconPickerCell = null;
let iconPickerMenu = null;

function ensureIconPickerMenu() {
  if (iconPickerMenu) return iconPickerMenu;

  iconPickerMenu = document.createElement("div");
  iconPickerMenu.id = "cellIconPicker";
  iconPickerMenu.className = "cell-icon-picker";
  iconPickerMenu.innerHTML = CELL_ICON_CHOICES.map(icon =>
    `<button type="button" class="cell-icon-option" data-icon="${icon}">${icon}</button>`
  ).join("");

  document.body.appendChild(iconPickerMenu);

  iconPickerMenu.addEventListener("mousedown", event => {
    event.preventDefault();
  });

  iconPickerMenu.addEventListener("click", async event => {
    const button = event.target.closest(".cell-icon-option");
    if (!button || !iconPickerCell) return;

    await insertIconIntoCell(iconPickerCell, button.dataset.icon);
    hideIconPicker();
  });

  return iconPickerMenu;
}

function showIconPicker(cell, x, y) {
  iconPickerCell = cell;
  const menu = ensureIconPickerMenu();

  menu.style.display = "grid";
  menu.style.left = `${x}px`;
  menu.style.top = `${y}px`;

  const rect = menu.getBoundingClientRect();
  const padding = 8;

  if (rect.right > window.innerWidth - padding) {
    menu.style.left = `${Math.max(padding, window.innerWidth - rect.width - padding)}px`;
  }

  if (rect.bottom > window.innerHeight - padding) {
    menu.style.top = `${Math.max(padding, window.innerHeight - rect.height - padding)}px`;
  }
}

function hideIconPicker() {
  if (iconPickerMenu) iconPickerMenu.style.display = "none";
  iconPickerCell = null;
}

async function insertIconIntoCell(cell, icon) {
  if (!cell || !icon) return;

  const current = cell.innerText.trim();
  cell.innerText = current ? `${current} ${icon}` : icon;

  const module = cell.dataset.module;
  const id = Number(cell.dataset.id);
  const field = cell.dataset.field;
  const value = cell.innerText.trim();

  if (module === "dashboard") {
    updateLocalProject(id);
    await saveProject(id);
  }

  if (module === "pipeline") await updatePipeline(id, field, value);
  if (module === "deployment") await updateDeployment(id, field, value);
  if (module === "application") await updateApplication(id, field, value);

  if (module === "timeline") {
    if (field === "status") updateTimelineStatus(id, value);
    else updateTimelineCell(id, Number(field), value);
  }
}

document.addEventListener("contextmenu", event => {
  const cell = event.target.closest("td[contenteditable='true'][data-fill='true']");
  if (!cell) {
    hideIconPicker();
    return;
  }

  event.preventDefault();
  showIconPicker(cell, event.clientX, event.clientY);
});

document.addEventListener("click", event => {
  if (iconPickerMenu && !event.target.closest("#cellIconPicker")) hideIconPicker();
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") hideIconPicker();
});


/* =========================
   OLD/CACHED BUTTON SAFETY
========================= */
function addProject() { return addGroup("dashboard"); }
function addPipeline() { return addGroup("pipeline"); }
function addDeployment() { return addGroup("deployment"); }
function addApplication() { return addGroup("application"); }
function addTimelineRow() { alert("Use Add Group / + Add Row inside Timeline groups."); }
function startTimelineDeleteMode() { alert("Use Delete Row inside the Timeline group."); }
function confirmTimelineDelete() { return confirmGroupDelete("timeline", activeGroupDeleteMode.timeline || ""); }
function cancelTimelineDelete() { return cancelGroupDelete("timeline"); }


/* =========================
   RESIZABLE COLUMNS - 4 MAIN MODULES ONLY
   Timeline is intentionally excluded.
   Uses <colgroup> so only the dragged column changes width.
   Other columns keep their own width and just move left/right.
========================= */
const RESIZABLE_COLUMN_MODULES = {
  dashboard: "#dashboardPage table",
  pipeline: "#pipelinePage table",
  deployment: "#deploymentPage table",
  application: "#applicationPage table"
};

const COLUMN_MIN_WIDTH = 40;
let activeColumnResize = null;

function columnWidthStorageKey(module) {
  return `column-widths-${module}`;
}

function loadColumnWidths(module) {
  try {
    return JSON.parse(localStorage.getItem(columnWidthStorageKey(module)) || "{}");
  } catch {
    return {};
  }
}

function saveColumnWidth(module, columnIndex, width) {
  const widths = loadColumnWidths(module);
  widths[columnIndex] = Math.max(COLUMN_MIN_WIDTH, Math.round(width));
  localStorage.setItem(columnWidthStorageKey(module), JSON.stringify(widths));
}

function getResizableTable(module) {
  const selector = RESIZABLE_COLUMN_MODULES[module];
  return selector ? document.querySelector(selector) : null;
}

function getHeaderCells(table) {
  return Array.from(table.querySelectorAll("thead th"));
}

function getColumnCount(table) {
  const headerCount = getHeaderCells(table).length;
  const rowCount = Math.max(...Array.from(table.rows).map(row => row.children.length), 0);
  return Math.max(headerCount, rowCount);
}

function defaultColumnWidth(th, index) {
  if (!th || th.classList.contains("select-col")) return COLUMN_MIN_WIDTH;

  const textLength = String(th.innerText || "").trim().length;
  const base = Math.ceil(textLength * 8.5) + 34;

  if (index <= 1) return Math.max(50, base);
  return Math.max(90, Math.min(base, 190));
}

function ensureColumnGroup(table, module) {
  let colgroup = table.querySelector("colgroup.column-width-colgroup");
  const columnCount = getColumnCount(table);
  const savedWidths = loadColumnWidths(module);
  const headers = getHeaderCells(table);

  if (!colgroup) {
    colgroup = document.createElement("colgroup");
    colgroup.className = "column-width-colgroup";
    table.insertBefore(colgroup, table.firstChild);
  }

  while (colgroup.children.length < columnCount) {
    colgroup.appendChild(document.createElement("col"));
  }

  while (colgroup.children.length > columnCount) {
    colgroup.removeChild(colgroup.lastElementChild);
  }

  Array.from(colgroup.children).forEach((col, index) => {
    const width = Number(savedWidths[index]) || defaultColumnWidth(headers[index], index);
    col.style.width = `${Math.max(COLUMN_MIN_WIDTH, Math.round(width))}px`;
  });

  updateResizableTableWidth(table);
  clearCellWidthLocks(table);
  return colgroup;
}

function clearCellWidthLocks(table) {
  table.querySelectorAll("th, td").forEach(cell => {
    cell.style.width = "";
    cell.style.minWidth = "";
    cell.style.maxWidth = "";
  });
}

function getColumnWidth(table, columnIndex) {
  const col = table.querySelector(`colgroup.column-width-colgroup col:nth-child(${columnIndex + 1})`);
  if (col) return parseFloat(col.style.width) || COLUMN_MIN_WIDTH;

  const header = getHeaderCells(table)[columnIndex];
  return header ? header.getBoundingClientRect().width : COLUMN_MIN_WIDTH;
}

function setColumnWidth(table, columnIndex, width) {
  if (!table || columnIndex < 0) return;

  const colgroup = table.querySelector("colgroup.column-width-colgroup");
  if (!colgroup) return;

  const col = colgroup.children[columnIndex];
  if (!col) return;

  col.style.width = `${Math.max(COLUMN_MIN_WIDTH, Math.round(width))}px`;
  updateResizableTableWidth(table);
}

function updateResizableTableWidth(table) {
  const colgroup = table.querySelector("colgroup.column-width-colgroup");
  if (!colgroup) return;

  const totalWidth = Array.from(colgroup.children).reduce((sum, col) => {
    return sum + (parseFloat(col.style.width) || COLUMN_MIN_WIDTH);
  }, 0);

  table.style.width = `${Math.max(totalWidth, table.parentElement?.clientWidth || 0)}px`;
  table.style.minWidth = "100%";
}

function ensureColumnResizeForModule(module) {
  const table = getResizableTable(module);
  if (!table) return;

  table.classList.add("resizable-table");
  table.dataset.resizeModule = module;

  ensureColumnGroup(table, module);

  getHeaderCells(table).forEach(th => {
    if (th.classList.contains("select-col")) return;
    if (th.querySelector(".column-resize-handle")) return;

    th.classList.add("column-resizable-header");

    const handle = document.createElement("span");
    handle.className = "column-resize-handle";
    handle.title = "Drag to resize column";

    handle.addEventListener("mousedown", event => {
      event.preventDefault();
      event.stopPropagation();

      activeColumnResize = {
        module,
        table,
        columnIndex: th.cellIndex,
        startX: event.clientX,
        startWidth: getColumnWidth(table, th.cellIndex)
      };

      document.body.classList.add("column-resizing");
    });

    th.appendChild(handle);
  });
}

function initResizableColumns() {
  Object.keys(RESIZABLE_COLUMN_MODULES).forEach(ensureColumnResizeForModule);
}

function resetColumnWidths(module) {
  if (!RESIZABLE_COLUMN_MODULES[module]) return;
  if (!confirm("Reset this module column widths back to default?")) return;

  localStorage.removeItem(columnWidthStorageKey(module));

  const table = getResizableTable(module);
  if (table) {
    table.querySelector("colgroup.column-width-colgroup")?.remove();
    table.style.width = "";
    table.style.minWidth = "";
    clearCellWidthLocks(table);
  }

  renderModuleByName(module);
}

document.addEventListener("mousemove", event => {
  if (!activeColumnResize) return;

  const nextWidth = activeColumnResize.startWidth + (event.clientX - activeColumnResize.startX);
  setColumnWidth(activeColumnResize.table, activeColumnResize.columnIndex, nextWidth);
  saveColumnWidth(activeColumnResize.module, activeColumnResize.columnIndex, nextWidth);
});

document.addEventListener("mouseup", () => {
  if (!activeColumnResize) return;
  activeColumnResize = null;
  document.body.classList.remove("column-resizing");
});

document.addEventListener("DOMContentLoaded", initResizableColumns);

const originalRenderGroupedModuleForResize = renderGroupedModule;
renderGroupedModule = function(module, rowRenderer) {
  originalRenderGroupedModuleForResize(module, rowRenderer);
  if (RESIZABLE_COLUMN_MODULES[module]) ensureColumnResizeForModule(module);
};
