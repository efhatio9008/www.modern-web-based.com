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
   DARK MODE TOGGLE
========================= */
const DARK_MODE_STORAGE_KEY = "mepsb-dark-mode";

function setDarkMode(enabled) {
  const isDark = Boolean(enabled);
  document.body.classList.toggle("dark-mode", isDark);
  localStorage.setItem(DARK_MODE_STORAGE_KEY, isDark ? "1" : "0");

  const toggle = document.getElementById("darkModeToggle");
  if (toggle) {
    toggle.classList.toggle("dark-mode-toggle-on", isDark);
    toggle.setAttribute("aria-pressed", isDark ? "true" : "false");
    toggle.title = isDark ? "Light mode" : "Dark mode";
  }
}

function toggleDarkMode() {
  setDarkMode(!document.body.classList.contains("dark-mode"));
}

function initDarkMode() {
  setDarkMode(localStorage.getItem(DARK_MODE_STORAGE_KEY) === "1");
}

document.addEventListener("DOMContentLoaded", initDarkMode);

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
    if (el) p[dataField] = el.innerHTML.trim();
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
  let html = "";

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

      html += groupHeaderHtml("timeline", group.title, rows.length);
      if (!isGroupCollapsed("timeline", group.title)) rows.forEach(row => { html += rowRenderer(row); });
      return;
    }

    const totalGroupPages = Math.max(1, Math.ceil(group.rows.length / GROUP_ROWS_PER_PAGE));
    const groupPage = Math.min(getGroupPage(module, group.title), totalGroupPages);
    setGroupPage(module, group.title, groupPage);

    const start = (groupPage - 1) * GROUP_ROWS_PER_PAGE;
    const visibleRows = group.rows.slice(start, start + GROUP_ROWS_PER_PAGE);

    html += groupHeaderHtml(module, group.title, group.rows.length);
    if (!isGroupCollapsed(module, group.title)) visibleRows.forEach(row => { html += rowRenderer(row); });
  });

  table.innerHTML = html;
  renderModulePagination(module);
}

function renderDashboardRow(p) {
  const showSelect = isRowSelectableForActiveGroup("dashboard", p);
  return `
    <tr>
      ${showSelect ? `<td><input type="checkbox" onchange="toggleRow(${p.id}, 'dashboard')"></td>` : (selectMode.dashboard ? `<td></td>` : "")}
      <td>${p.displayId}</td>
      <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="desc" id="desc-${p.id}" onblur="autoSave(${p.id})">${(p.project_description || "")}</td>
      <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="status" id="status-${p.id}" onblur="autoSave(${p.id})">${(p.status || "")}</td>
      <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="tendering" id="tendering-${p.id}" onblur="autoSave(${p.id})">${(p.tendering || "")}</td>
      <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="bg" id="bg-${p.id}" onblur="autoSave(${p.id})">${(p.bg_insurance || "")}</td>
      <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="cwr" id="cwr-${p.id}" onblur="autoSave(${p.id})">${(p.cwr_po_received || "")}</td>
      <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="workscope" id="workscope-${p.id}" onblur="autoSave(${p.id})">${(p.workscope || "")}</td>
      <td>
        ${p.si_report ? `<div class="file-box">📄 <a href="/uploads/${escHtml(p.si_report)}" target="_blank">${escHtml(p.si_report)}</a><button class="delete-file-btn" onclick="removeFile(${p.id})">❌</button></div>` : ""}
        <div class="upload-box"><input type="file" id="file-${p.id}"><button onclick="uploadFile(${p.id})">Upload</button></div>
      </td>
      <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="cost" id="cost-${p.id}" onblur="autoSave(${p.id})">${(p.cost_proposal || "")}</td>
      <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="ccc" id="ccc-${p.id}" onblur="autoSave(${p.id})">${(p.ccc_readiness_manpower || "")}</td>
      <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="procurement" id="procurement-${p.id}" onblur="autoSave(${p.id})">${(p.procurement_material || "")}</td>
      <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="delivery" id="delivery-${p.id}" onblur="autoSave(${p.id})">${(p.delivery_material_site || "")}</td>
      <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="fcb" id="fcb-${p.id}" onblur="autoSave(${p.id})">${(p.fcb_booking || "")}</td>
      <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="mob" id="mob-${p.id}" onblur="autoSave(${p.id})">${(p.mob_execution || "")}</td>
      <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="handover" id="handover-${p.id}" onblur="autoSave(${p.id})">${(p.handover_site || "")}</td>
      <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="demob" id="demob-${p.id}" onblur="autoSave(${p.id})">${(p.demob_date || "")}</td>
      <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="close" id="close-${p.id}" onblur="autoSave(${p.id})">${(p.close_out_report || "")}</td>
      <td contenteditable="true" data-fill="true" data-module="dashboard" data-id="${p.id}" data-field="remarks" id="remarks-${p.id}" onblur="autoSave(${p.id})">${(p.remarks || "")}</td>
    </tr>`;
}

function renderPipelineRow(row) {
  const showSelect = isRowSelectableForActiveGroup("pipeline", row);
  const fields = ["description", "status", "presentation", "commercial", "technical", "site_visit", "received_orders", "issue_po", "transport", "lead_time", "etb", "eta", "transport_site", "do_acceptance", "install_start", "project_end", "remarks"];
  return `<tr>${showSelect ? `<td><input type="checkbox" onchange="toggleRow(${row.id}, 'pipeline')"></td>` : (selectMode.pipeline ? `<td></td>` : "")}<td>${row.displayId}</td>${fields.map(field => `<td contenteditable="true" data-fill="true" data-module="pipeline" data-id="${row.id}" data-field="${field}" onblur="updatePipeline(${row.id}, '${field}', this.innerHTML)">${row[field] || ""}</td>`).join("")}</tr>`;
}

function renderDeploymentRow(row) {
  const showSelect = isRowSelectableForActiveGroup("deployment", row);
  const fields = ["deployment_type", "status", "date_start", "date_complete", "remarks"];
  return `<tr>${showSelect ? `<td><input type="checkbox" onchange="toggleRow(${row.id}, 'deployment')"></td>` : (selectMode.deployment ? `<td></td>` : "")}<td>${row.displayId}</td>${fields.map(field => `<td contenteditable="true" data-fill="true" data-module="deployment" data-id="${row.id}" data-field="${field}" onblur="updateDeployment(${row.id}, '${field}', this.innerHTML)">${row[field] || ""}</td>`).join("")}</tr>`;
}

function renderApplicationRow(row) {
  const showSelect = isRowSelectableForActiveGroup("application", row);
  const fields = ["project_description", "status", "date_start", "date_complete", "remarks"];
  return `<tr>${showSelect ? `<td><input type="checkbox" onchange="toggleRow(${row.id}, 'application')"></td>` : (selectMode.application ? `<td></td>` : "")}<td>${row.displayId}</td>${fields.map(field => `<td contenteditable="true" data-fill="true" data-module="application" data-id="${row.id}" data-field="${field}" onblur="updateApplication(${row.id}, '${field}', this.innerHTML)">${row[field] || ""}</td>`).join("")}</tr>`;
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
        return `<td class="timeline-month-cell ${editable ? "" : "timeline-disabled-cell"}" ${editable ? "contenteditable=\"true\"" : "contenteditable=\"false\""} data-fill="${editable ? "true" : "false"}" data-module="timeline" data-id="${row.id}" data-field="${monthIndex}" ${disabledText} ${editable ? `onblur="updateTimelineCell(${row.id}, ${monthIndex}, this.innerHTML)"` : ""}>${editable ? (m || "") : "—"}</td>`;
      }).join("")}
      <td contenteditable="true" data-fill="true" data-module="timeline" data-id="${row.id}" data-field="status" onblur="updateTimelineStatus(${row.id}, this.innerHTML)">${row.status || ""}</td>
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
  let html = "";

  const groups = groupRows(rows, module).map(group => ({ title: group.title, rows: group.rows.map(row => ({ ...row })) }));
  groups.forEach(group => {
    html += groupHeaderHtml(module, group.title, group.rows.length);
    group.rows.forEach(row => { html += rowRenderer(row); });
  });

  table.innerHTML = html;
}

function searchById() {
  const id = Number(document.getElementById("searchId").value);
  if (!id) return alert("Please enter ID");
  const found = assignGroupDisplayIds(allProjects, "dashboard").filter(row => row.displayId === id);
  if (!found.length) return alert("ID not found");
  renderSearchResults("dashboard", found, renderDashboardRow);
}

function searchPipeline() {
  const id = Number(document.getElementById("pipelineSearchId").value);
  if (!id) return alert("Please enter ID");
  const found = assignGroupDisplayIds(pipelineData, "pipeline").filter(row => row.displayId === id);
  if (!found.length) return alert("ID not found");
  renderSearchResults("pipeline", found, renderPipelineRow);
}

function searchDeployment() {
  const id = Number(document.getElementById("deploymentSearchId").value);
  if (!id) return alert("Please enter ID");
  const found = assignGroupDisplayIds(deploymentData, "deployment").filter(row => row.displayId === id);
  if (!found.length) return alert("ID not found");
  renderSearchResults("deployment", found, renderDeploymentRow);
}

function searchApplication() {
  const id = Number(document.getElementById("applicationSearchId").value);
  if (!id) return alert("Please enter ID");
  const found = assignGroupDisplayIds(applicationData, "application").filter(row => row.displayId === id);
  if (!found.length) return alert("ID not found");
  renderSearchResults("application", found, renderApplicationRow);
}

function clearSearch() {
  document.getElementById("searchId").value = "";
  renderProjects();
}

function clearPipelineSearch() {
  document.getElementById("pipelineSearchId").value = "";
  renderPipeline();
}

function clearDeploymentSearch() {
  document.getElementById("deploymentSearchId").value = "";
  renderDeployment();
}

function clearApplicationSearch() {
  document.getElementById("applicationSearchId").value = "";
  renderApplication();
}

function refreshDashboard() { setModuleSectionPage("dashboard", 1); loadProjects(); }
function refreshPipeline() { setModuleSectionPage("pipeline", 1); loadPipeline(); }
function refreshDeployment() { setModuleSectionPage("deployment", 1); loadDeployment(); }
function refreshApplication() { setModuleSectionPage("application", 1); loadApplication(); }
function refreshTimeline() { setModuleSectionPage("timeline", 1); loadTimeline(); }

/* =========================
   EXPORTS - REAL XLSX
   Clean ExcelJS export with safe color handling.
========================= */
function rgbToArgb(r, g, b) {
  const rr = Math.max(0, Math.min(255, Number(r) || 0)).toString(16).padStart(2, "0");
  const gg = Math.max(0, Math.min(255, Number(g) || 0)).toString(16).padStart(2, "0");
  const bb = Math.max(0, Math.min(255, Number(b) || 0)).toString(16).padStart(2, "0");
  return `FF${rr}${gg}${bb}`.toUpperCase();
}

function cssColorToArgb(color, fallback = "FF000000") {
  if (!color) return fallback;

  const value = String(color).trim().toLowerCase();
  if (
    value === "transparent" ||
    value === "inherit" ||
    value === "initial" ||
    value === "currentcolor"
  ) {
    return fallback;
  }

  const temp = document.createElement("span");
  temp.style.color = value;
  temp.style.display = "none";
  document.body.appendChild(temp);

  const computed = window.getComputedStyle(temp).color;
  document.body.removeChild(temp);

  const match = computed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!match) return fallback;

  const alpha = match[4] === undefined ? 1 : Number(match[4]);
  if (alpha === 0) return fallback;

  return rgbToArgb(match[1], match[2], match[3]);
}

function cssBackgroundToArgb(domCell) {
  let current = domCell;

  while (current && current !== document.body) {
    const bg = window.getComputedStyle(current).backgroundColor;
    const match = String(bg || "").match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);

    if (match) {
      const alpha = match[4] === undefined ? 1 : Number(match[4]);
      const isWhite = Number(match[1]) === 255 && Number(match[2]) === 255 && Number(match[3]) === 255;

      if (alpha > 0 && !isWhite) {
        return rgbToArgb(match[1], match[2], match[3]);
      }
    }

    current = current.parentElement;
  }

  return null;
}

function cssFontSizeToPt(fontSize) {
  const px = parseFloat(fontSize || "14");
  if (!px) return 11;
  return Math.max(6, Math.round(px * 0.75));
}

function safeHorizontalAlign(value) {
  const align = String(value || "").toLowerCase();
  if (["left", "center", "right", "justify"].includes(align)) return align;
  if (align === "start") return "left";
  if (align === "end") return "right";
  return "center";
}

function styleForExcelCell(domCell) {
  const computed = window.getComputedStyle(domCell);
  const bgArgb = cssBackgroundToArgb(domCell);

  const style = {
    alignment: {
      horizontal: safeHorizontalAlign(computed.textAlign),
      vertical: "top",
      wrapText: true
    },
    font: {
      name: "Arial",
      size: cssFontSizeToPt(computed.fontSize),
      bold: computed.fontWeight === "bold" || Number(computed.fontWeight) >= 600,
      color: { argb: cssColorToArgb(computed.color, "FF000000") }
    },
    border: {
      top: { style: "thin", color: { argb: "FF000000" } },
      left: { style: "thin", color: { argb: "FF000000" } },
      bottom: { style: "thin", color: { argb: "FF000000" } },
      right: { style: "thin", color: { argb: "FF000000" } }
    }
  };

  if (bgArgb) {
    style.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: bgArgb }
    };
  }

  return style;
}


function isCellIconChar(char) {
  return CELL_ICON_CHOICES.includes(char);
}

function getDomCellText(domCell) {
  if (!domCell) return "";

  // innerText can return an empty string for off-screen/hidden export DOM in some browsers.
  // textContent keeps saved emoji/icons intact for the XLSX export.
  return String(domCell.innerText || domCell.textContent || "").replace(/\u00a0/g, " ");
}

function textContainsCellIcon(text) {
  const value = String(text || "");
  return CELL_ICON_CHOICES.some(icon => value.includes(icon));
}

function splitTextIntoExcelRuns(text, style) {
  const runs = [];
  let buffer = "";
  const value = String(text || "");

  function pushBuffer() {
    if (!buffer) return;
    runs.push({
      text: buffer,
      font: {
        name: "Arial",
        size: style.size || 11,
        bold: style.bold || false,
        color: { argb: style.color || "FF000000" }
      }
    });
    buffer = "";
  }

  for (let i = 0; i < value.length;) {
    const matchedIcon = CELL_ICON_CHOICES.find(icon => value.startsWith(icon, i));

    if (matchedIcon) {
      pushBuffer();
      runs.push({
        text: matchedIcon,
        font: {
          name: "Segoe UI Emoji",
          size: style.size || 11,
          bold: style.bold || false,
          color: { argb: style.color || "FF000000" }
        }
      });
      i += matchedIcon.length;
    } else {
      buffer += value[i];
      i += 1;
    }
  }

  pushBuffer();
  return runs;
}

function extractRichTextRuns(node, inheritedStyle = {}) {
  const runs = [];

  function walk(currentNode, parentStyle) {
    if (currentNode.nodeType === Node.TEXT_NODE) {
      const text = currentNode.nodeValue || "";
      if (!text) return;

      runs.push(...splitTextIntoExcelRuns(text, parentStyle));
      return;
    }

    if (currentNode.nodeType !== Node.ELEMENT_NODE) return;

    const computed = window.getComputedStyle(currentNode);
    const nextStyle = {
      size: cssFontSizeToPt(computed.fontSize) || parentStyle.size || 11,
      bold: computed.fontWeight === "bold" || Number(computed.fontWeight) >= 600 || parentStyle.bold || false,
      color: cssColorToArgb(computed.color, parentStyle.color || "FF000000")
    };

    if (currentNode.tagName === "BR") {
      runs.push({
        text: "\n",
        font: {
          name: "Arial",
          size: nextStyle.size,
          bold: nextStyle.bold,
          color: { argb: nextStyle.color }
        }
      });
      return;
    }

    currentNode.childNodes.forEach(child => walk(child, nextStyle));
  }

  walk(node, inheritedStyle);
  return runs.filter(run => run.text !== "");
}

function excelCellValueFromDom(domCell) {
  const baseStyle = styleForExcelCell(domCell);
  const richText = extractRichTextRuns(domCell, {
    size: baseStyle.font.size,
    bold: baseStyle.font.bold,
    color: baseStyle.font.color.argb
  });

  if (richText.length > 1) return { richText };

  if (richText.length === 1) {
    const only = richText[0];
    if (
      only.font.size !== baseStyle.font.size ||
      only.font.bold !== baseStyle.font.bold ||
      only.font.color.argb !== baseStyle.font.color.argb
    ) {
      return { richText };
    }
  }

  const plainText = getDomCellText(domCell);

  if (textContainsCellIcon(plainText)) {
    return {
      richText: splitTextIntoExcelRuns(plainText, {
        size: baseStyle.font.size,
        bold: baseStyle.font.bold,
        color: baseStyle.font.color.argb
      })
    };
  }

  return plainText;
}

function exportRowRendererForModule(module) {
  return {
    dashboard: renderDashboardRow,
    pipeline: renderPipelineRow,
    deployment: renderDeploymentRow,
    application: renderApplicationRow,
    timeline: renderTimelineRow
  }[module];
}

function buildFullGroupExportDom(module, groupTitle) {
  const cfg = moduleConfig(module);
  const rowRenderer = exportRowRendererForModule(module);
  if (!cfg || !rowRenderer) return null;

  const safeGroup = normalizeGroupName(groupTitle);
  const group = rowNumberedGroups(cfg.data(), module)
    .find(item => normalizeGroupName(item.title) === safeGroup);

  if (!group) return null;

  let rows = group.rows;

  if (module === "timeline") {
    rows = [...rows]
      .sort((a, b) => Number(a.id) - Number(b.id))
      .slice(0, 31)
      .map((row, index) => ({
        ...row,
        displayId: index + 1,
        groupTitle: group.title,
        project_group: row.project_group || group.title
      }));
  } else {
    rows = rows.map((row, index) => ({
      ...row,
      displayId: index + 1,
      groupTitle: group.title,
      project_group: row.project_group || group.title
    }));
  }

  const holder = document.createElement("div");
  holder.style.position = "fixed";
  holder.style.left = "-100000px";
  holder.style.top = "0";
  holder.style.opacity = "0";
  holder.style.pointerEvents = "none";

  const table = document.createElement("table");
  table.border = "1";
  table.style.borderCollapse = "collapse";
  table.style.background = "white";

  const tbody = document.createElement("tbody");

  tbody.innerHTML += `
    <tr class="group-title-row">
      <td colspan="99">
        <div class="group-header-box">
          <span>Title:</span>
          <span class="group-title-edit">${escHtml(group.title)}</span>
          <span class="group-empty-note">${groupSummary(module, rows)}</span>
        </div>
      </td>
    </tr>
  `;

  rows.forEach(row => {
    tbody.innerHTML += rowRenderer(row);
  });

  table.appendChild(tbody);
  holder.appendChild(table);
  document.body.appendChild(holder);

  return {
    rows: [...tbody.querySelectorAll("tr")],
    cleanup: () => holder.remove()
  };
}

function getHeaderRowsForExport(module) {
  const cfg = moduleConfig(module);
  const tableBody = cfg ? document.getElementById(cfg.tableId) : null;
  const table = tableBody?.closest("table");
  return table ? [...table.querySelectorAll("thead tr")] : [];
}

async function ensureExcelJsLoaded() {
  if (window.ExcelJS) return;

  await new Promise((resolve, reject) => {
    const existing = document.querySelector("script[data-exceljs-loader='true']");
    if (existing) {
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js";
    script.dataset.exceljsLoader = "true";
    script.onload = resolve;
    script.onerror = () => reject(new Error("ExcelJS failed to load"));
    document.head.appendChild(script);
  });
}

function downloadBlob(filename, blob) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();

  setTimeout(() => {
    URL.revokeObjectURL(link.href);
    document.body.removeChild(link);
  }, 0);
}

function isExportableDomCell(domCell) {
  if (!domCell) return false;
  if (domCell.querySelector("input[type='checkbox']")) return false;
  if (domCell.classList.contains("select-col")) return false;
  return true;
}

function applyDomRowToWorksheetRow(excelRow, domRow) {
  const domCells = [...domRow.children].filter(isExportableDomCell);

  domCells.forEach((domCell, index) => {
    const excelCell = excelRow.getCell(index + 1);
    const style = styleForExcelCell(domCell);

    excelCell.value = excelCellValueFromDom(domCell);
    excelCell.alignment = style.alignment;
    excelCell.font = textContainsCellIcon(getDomCellText(domCell))
      ? { ...style.font, name: "Segoe UI Emoji" }
      : style.font;
    excelCell.border = style.border;

    if (style.fill) excelCell.fill = style.fill;
  });

  excelRow.height = Math.max(20, domRow.getBoundingClientRect().height * 0.75);
}

async function exportGroup(module, groupTitle) {
  const exportDom = buildFullGroupExportDom(module, groupTitle);
  const rows = exportDom ? exportDom.rows : [];

  if (!rows.length) {
    if (exportDom) exportDom.cleanup();
    alert("No rows to export for this group");
    return;
  }

  try {
    await ensureExcelJsLoaded();

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "MEPSB Web Management System";
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet(safeFilename(groupTitle).slice(0, 31) || "Export", {
      views: [{ state: "frozen", ySplit: 1 }]
    });

    let rowIndex = 1;

    getHeaderRowsForExport(module).forEach(domHeaderRow => {
      const excelRow = worksheet.getRow(rowIndex++);
      applyDomRowToWorksheetRow(excelRow, domHeaderRow);

      excelRow.eachCell(cell => {
        cell.font = { ...(cell.font || {}), bold: true, color: { argb: "FF000000" } };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF0F0F0" }
        };
      });

      excelRow.commit();
    });

    rows.forEach(domRow => {
      const excelRow = worksheet.getRow(rowIndex++);
      applyDomRowToWorksheetRow(excelRow, domRow);
      excelRow.commit();
    });

    worksheet.columns.forEach(column => {
      let maxLength = 10;

      column.eachCell({ includeEmpty: true }, cell => {
        let value = "";

        if (typeof cell.value === "string") value = cell.value;
        else if (cell.value?.richText) value = cell.value.richText.map(part => part.text).join("");
        else if (cell.value != null) value = String(cell.value);

        maxLength = Math.max(maxLength, Math.min(value.length + 2, 45));
      });

      column.width = maxLength;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob(
      [buffer],
      { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }
    );

    downloadBlob(`${module}_${safeFilename(groupTitle)}.xlsx`, blob);
  } catch (err) {
    console.error("XLSX export failed:", err);
    alert("XLSX export failed. Please check your internet connection and try again.");
  } finally {
    if (exportDom) exportDom.cleanup();
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
  savedFormatRangeByModule = {
    dashboard: null,
    pipeline: null,
    deployment: null,
    application: null,
    timeline: null
  };
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

  const currentHtml = cell.innerHTML.trim();
  cell.innerHTML = currentHtml ? `${currentHtml} ${icon}` : icon;

  await saveFormattedCell(cell);
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
   SHARED CONTROL RENDERING
   Keeps repeated toolbar HTML out of index.html.
========================= */
const FORMAT_SIZE_OPTIONS = ["10px", "11px", "12px", "13px", "14px", "15px", "16px", "18px", "20px", "22px", "24px", "26px", "28px", "32px", "36px"];
const FORMAT_COLOR_OPTIONS = [
  ["#000000", "Black"], ["#444444", "Dark gray"], ["#777777", "Gray"],
  ["#ff0000", "Red"], ["#ff6600", "Orange"], ["#ffcc00", "Yellow"],
  ["#198754", "Green"], ["#20c997", "Teal"], ["#0dcaf0", "Cyan"],
  ["#007bff", "Blue"], ["#0000ff", "Dark blue"], ["#6610f2", "Purple"],
  ["#d63384", "Pink"], ["#8b4513", "Brown"], ["#ffffff", "White"]
];

function renderSharedControlSlots() {
  document.querySelectorAll(".table-scale-controls-slot").forEach(slot => {
    const module = slot.dataset.scaleModule;
    if (!module || slot.dataset.rendered === "1") return;

    slot.className = "table-scale-controls";
    slot.dataset.rendered = "1";
    slot.innerHTML = `
      <button class="table-scale-btn" title="Table smaller" onclick="adjustTableScale('${module}', -0.05)">−</button>
      <span class="table-scale-label" id="${module}ScaleLabel">100%</span>
      <button class="table-scale-btn" title="Table bigger" onclick="adjustTableScale('${module}', 0.05)">+</button>
      <button class="table-scale-reset" onclick="resetTableScale('${module}')">Reset Width</button>
    `;
  });

  document.querySelectorAll(".format-toolbar-slot").forEach(slot => {
    const module = slot.dataset.formatModule;
    if (!module || slot.dataset.rendered === "1") return;

    const sizeButtons = FORMAT_SIZE_OPTIONS
      .map(size => `<button onclick="applyFormatSize('${module}', '${size}')">${parseInt(size, 10)}</button>`)
      .join("");

    const colorButtons = FORMAT_COLOR_OPTIONS
      .map(([color, title]) => `<button style="background:${color}" onclick="applyFormatColor('${module}', '${color}')" title="${title}"></button>`)
      .join("");

    slot.className = "format-toolbar";
    slot.dataset.formatModule = module;
    slot.dataset.rendered = "1";
    slot.innerHTML = `
      <button type="button" class="format-btn" title="Left align" onclick="applyFormatAlign('${module}', 'left')">⬅</button>
      <button type="button" class="format-btn" title="Center align" onclick="applyFormatAlign('${module}', 'center')">⬌</button>
      <button type="button" class="format-btn" title="Right align" onclick="applyFormatAlign('${module}', 'right')">➡</button>
      <span class="format-dropdown">
        <button type="button" class="format-btn" onclick="toggleFormatDropdown(event, this)">Size ▾</button>
        <span class="format-menu size-menu">${sizeButtons}</span>
      </span>
      <span class="format-dropdown">
        <button type="button" class="format-btn" onclick="toggleFormatDropdown(event, this)">Color ▾</button>
        <span class="format-menu color-menu">${colorButtons}</span>
      </span>
    `;
  });
}

document.addEventListener("DOMContentLoaded", renderSharedControlSlots);

/* =========================
   TABLE SCALE CONTROLS - 4 MAIN MODULES ONLY
   This replaces column dragging with safe whole-table scaling.
   Timeline is intentionally excluded.
========================= */
const TABLE_SCALE_MODULES = {
  dashboard: "#dashboardPage table",
  pipeline: "#pipelinePage table",
  deployment: "#deploymentPage table",
  application: "#applicationPage table"
};

const TABLE_SCALE_MIN = 0.75;
const TABLE_SCALE_MAX = 1.35;
const TABLE_SCALE_DEFAULT = 1;

function tableScaleStorageKey(module) {
  return `table-scale-${module}`;
}

function clampTableScale(value) {
  const numeric = Number(value) || TABLE_SCALE_DEFAULT;
  return Math.min(TABLE_SCALE_MAX, Math.max(TABLE_SCALE_MIN, Number(numeric.toFixed(2))));
}

function getTableScale(module) {
  return clampTableScale(localStorage.getItem(tableScaleStorageKey(module)) || TABLE_SCALE_DEFAULT);
}

function setTableScale(module, scale) {
  if (!TABLE_SCALE_MODULES[module]) return;
  const nextScale = clampTableScale(scale);
  localStorage.setItem(tableScaleStorageKey(module), String(nextScale));
  applyTableScale(module);
}

function getTableForScale(module) {
  const selector = TABLE_SCALE_MODULES[module];
  return selector ? document.querySelector(selector) : null;
}

function updateTableScaleLabel(module, scale) {
  const label = document.getElementById(`${module}ScaleLabel`);
  if (label) label.innerText = `${Math.round(scale * 100)}%`;
}

function applyTableScale(module) {
  if (!TABLE_SCALE_MODULES[module]) return;

  const table = getTableForScale(module);
  const scale = getTableScale(module);
  updateTableScaleLabel(module, scale);

  if (!table) return;

  table.classList.add("scaled-module-table");
  table.style.zoom = scale;
}

function applyAllTableScales() {
  Object.keys(TABLE_SCALE_MODULES).forEach(applyTableScale);
}

function adjustTableScale(module, delta) {
  if (!TABLE_SCALE_MODULES[module]) return;
  setTableScale(module, getTableScale(module) + Number(delta || 0));
}

function resetTableScale(module) {
  if (!TABLE_SCALE_MODULES[module]) return;
  if (!confirm("Reset this table size back to default?")) return;

  localStorage.removeItem(tableScaleStorageKey(module));
  const table = getTableForScale(module);
  if (table) table.style.zoom = "";
  applyTableScale(module);
}

document.addEventListener("DOMContentLoaded", applyAllTableScales);

const originalRenderGroupedModuleForTableScale = renderGroupedModule;
renderGroupedModule = function(module, rowRenderer) {
  originalRenderGroupedModuleForTableScale(module, rowRenderer);
  applyTableScale(module);
};

/* =========================
   INLINE FORMAT TOOLBAR
   Uses existing cell text fields; no database schema change.
========================= */
let activeFormatCellByModule = {
  dashboard: null,
  pipeline: null,
  deployment: null,
  application: null,
  timeline: null
};

let savedFormatRangeByModule = {
  dashboard: null,
  pipeline: null,
  deployment: null,
  application: null,
  timeline: null
};

function updateSavedFormatSelection() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || !selection.toString().trim()) return;

  const range = selection.getRangeAt(0);
  const container = range.commonAncestorContainer.nodeType === 3
    ? range.commonAncestorContainer.parentElement
    : range.commonAncestorContainer;

  const cell = container?.closest?.("td[contenteditable='true'][data-fill='true']");
  if (!cell) return;

  const module = cell.dataset.module;
  if (!activeFormatCellByModule.hasOwnProperty(module)) return;

  activeFormatCellByModule[module] = cell;
  savedFormatRangeByModule[module] = range.cloneRange();

  document.querySelectorAll("td.format-active-cell").forEach(el => el.classList.remove("format-active-cell"));
  cell.classList.add("format-active-cell");
  updateFormatToolbarActive(module);
}

document.addEventListener("mouseup", updateSavedFormatSelection);
document.addEventListener("keyup", updateSavedFormatSelection);

function restoreSavedFormatSelection(module) {
  const cell = activeFormatCellByModule[module];
  const range = savedFormatRangeByModule[module];

  if (!cell || !range || !cell.contains(range.commonAncestorContainer)) return false;

  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
  return selection.toString().trim().length > 0;
}

function getOrCreateCellWrapper(cell) {
  let wrapper = cell.firstElementChild;

  if (!wrapper || wrapper.dataset.formatWrapper !== "1" || cell.childNodes.length > 1) {
    const current = cell.innerHTML.trim();
    wrapper = document.createElement("div");
    wrapper.dataset.formatWrapper = "1";
    wrapper.innerHTML = current;
    cell.innerHTML = "";
    cell.appendChild(wrapper);
  }

  return wrapper;
}

function updateFormatToolbarActive(module) {
  document.querySelectorAll(".format-toolbar").forEach(bar => {
    bar.classList.toggle("format-toolbar-active", bar.dataset.formatModule === module);
  });
}

document.addEventListener("click", event => {
  const cell = event.target.closest("td[contenteditable='true'][data-fill='true']");
  if (!cell) return;

  const module = cell.dataset.module;
  if (!activeFormatCellByModule.hasOwnProperty(module)) return;

  activeFormatCellByModule[module] = cell;
  document.querySelectorAll("td.format-active-cell").forEach(el => el.classList.remove("format-active-cell"));
  cell.classList.add("format-active-cell");
  updateFormatToolbarActive(module);
});

document.addEventListener("mousedown", event => {
  if (event.target.closest(".format-toolbar")) {
    event.preventDefault();
  }
});

function getActiveFormatCell(module) {
  const cell = activeFormatCellByModule[module];
  if (!cell) {
    alert("Please click a cell first.");
    return null;
  }
  return cell;
}

async function saveFormattedCell(cell) {
  if (!cell) return;

  const module = cell.dataset.module;
  const id = Number(cell.dataset.id);
  const field = cell.dataset.field;
  const value = cell.innerHTML.trim();

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


function closeAllFormatDropdowns(exceptMenu = null) {
  document.querySelectorAll(".format-menu.format-menu-open").forEach(menu => {
    if (menu !== exceptMenu) menu.classList.remove("format-menu-open");
  });
}

function toggleFormatDropdown(event, button) {
  event.preventDefault();
  event.stopPropagation();

  const dropdown = button.closest(".format-dropdown");
  const menu = dropdown?.querySelector(".format-menu");
  if (!menu) return;

  const willOpen = !menu.classList.contains("format-menu-open");
  closeAllFormatDropdowns(menu);

  if (willOpen) menu.classList.add("format-menu-open");
  else menu.classList.remove("format-menu-open");
}

document.addEventListener("click", event => {
  if (!event.target.closest(".format-toolbar")) {
    closeAllFormatDropdowns();
  }
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeAllFormatDropdowns();
});

async function applyFormatAlign(module, alignment) {
  const cell = getActiveFormatCell(module);
  if (!cell) return;

  const wrapper = getOrCreateCellWrapper(cell);
  wrapper.style.textAlign = alignment;
  await saveFormattedCell(cell);
}

async function applyFormatSize(module, size) {
  const cell = getActiveFormatCell(module);
  if (!cell) return;

  if (!restoreSavedFormatSelection(module)) {
    alert("Please highlight/select text first.");
    return;
  }

  document.execCommand("fontSize", false, "7");
  cell.querySelectorAll("font[size='7']").forEach(el => {
    el.removeAttribute("size");
    el.style.fontSize = size;
  });

  updateSavedFormatSelection();
  await saveFormattedCell(cell);
  closeAllFormatDropdowns();
}

async function applyFormatColor(module, color) {
  const cell = getActiveFormatCell(module);
  if (!cell) return;

  if (!restoreSavedFormatSelection(module)) {
    alert("Please highlight/select text first.");
    return;
  }

  document.execCommand("foreColor", false, color);

  updateSavedFormatSelection();
  await saveFormattedCell(cell);
  closeAllFormatDropdowns();
}

