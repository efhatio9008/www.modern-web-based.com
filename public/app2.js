/* =========================================================
   Login Activity Tracking - Extension File
   New features live here so the original app.js remains stable.
========================================================= */

const ACTIVITY_MODULES = {
  dashboard: "Dashboard",
  timeline: "Timeline",
  pipeline: "PIPE-IN LINER",
  deployment: "Deployment",
  application: "Application License"
};

let currentActivitySessionId = null;
let currentActivityUsername = "";
const visitedActivityModules = new Set();

function activityPad(value) {
  return String(value).padStart(2, "0");
}

function activityFormatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${activityPad(date.getMonth() + 1)}/${activityPad(date.getDate())}/${date.getFullYear()}`;
}

function activityFormatTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  let hours = date.getHours();
  const minutes = activityPad(date.getMinutes());
  const seconds = activityPad(date.getSeconds());
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  if (hours === 0) hours = 12;
  return `${activityPad(hours)}:${minutes}:${seconds} ${ampm}`;
}

async function activityApiJson(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`${options.method || "GET"} ${url} failed`);
  return res.json();
}

async function startActivitySession(username) {
  try {
    const data = await activityApiJson("/api/activity/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username })
    });

    currentActivitySessionId = data.id;
    currentActivityUsername = username;
    visitedActivityModules.clear();
    sessionStorage.setItem("activity-session-id", String(data.id || ""));
    sessionStorage.setItem("activity-username", username || "");
  } catch (err) {
    console.error("Activity login tracking failed:", err);
  }
}

async function finishActivitySession() {
  const sessionId = currentActivitySessionId || sessionStorage.getItem("activity-session-id");
  if (!sessionId) return;

  try {
    await activityApiJson(`/api/activity/logout/${sessionId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modules: [...visitedActivityModules] })
    });
  } catch (err) {
    console.error("Activity logout tracking failed:", err);
  } finally {
    currentActivitySessionId = null;
    currentActivityUsername = "";
    visitedActivityModules.clear();
    sessionStorage.removeItem("activity-session-id");
    sessionStorage.removeItem("activity-username");
  }
}

async function recordActivityModule(moduleName) {
  const label = ACTIVITY_MODULES[moduleName];
  if (!label) return;

  const sessionId = currentActivitySessionId || sessionStorage.getItem("activity-session-id");
  if (!sessionId) return;

  visitedActivityModules.add(label);

  try {
    await activityApiJson(`/api/activity/modules/${sessionId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modules: [...visitedActivityModules] })
    });
  } catch (err) {
    console.error("Activity module tracking failed:", err);
  }
}

function showOnlyActivityPage() {
  [
    "dashboardPage",
    "timelinePage",
    "pipelinePage",
    "deploymentPage",
    "applicationPage",
    "calculatePage",
    "activityPage"
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = id === "activityPage" ? "block" : "none";
  });
}

function goActivityLog() {
  showOnlyActivityPage();
  loadActivityLogs();
}

async function loadActivityLogs() {
  const tbody = document.getElementById("activityLogTable");
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="7">Loading...</td></tr>`;

  try {
    const logs = await activityApiJson("/api/activity/logs");

    if (!logs.length) {
      tbody.innerHTML = `<tr><td colspan="7">No login activity in the latest 72 hours.</td></tr>`;
      return;
    }

    tbody.innerHTML = logs.map((log, index) => {
      const modules = Array.isArray(log.modules)
        ? log.modules.join(", ")
        : String(log.modules || "");

      return `
        <tr>
          <td>${index + 1}</td>
          <td>${escHtml(log.username || "")}</td>
          <td>${activityFormatDate(log.login_time)}</td>
          <td>${activityFormatTime(log.login_time)}</td>
          <td>${activityFormatDate(log.logout_time)}</td>
          <td>${activityFormatTime(log.logout_time)}</td>
          <td class="activity-modules-cell">${escHtml(modules || "-")}</td>
        </tr>
      `;
    }).join("");
  } catch (err) {
    console.error("Load activity logs failed:", err);
    tbody.innerHTML = `<tr><td colspan="7">Failed to load activity logs.</td></tr>`;
  }
}

async function exportActivityLogs() {
  try {
    const logs = await activityApiJson("/api/activity/logs");
    if (!logs.length) {
      alert("No activity logs to export");
      return;
    }

    await ensureExcelJsLoaded();

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "MEPSB Web Management System";
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet("Login Activity", {
      views: [{ state: "frozen", ySplit: 1 }]
    });

    const headers = ["No.", "User", "Login Date", "Login Time", "Logout Date", "Logout Time", "Visited Modules"];
    worksheet.addRow(headers);

    logs.forEach((log, index) => {
      worksheet.addRow([
        index + 1,
        log.username || "",
        activityFormatDate(log.login_time),
        activityFormatTime(log.login_time),
        activityFormatDate(log.logout_time),
        activityFormatTime(log.logout_time),
        Array.isArray(log.modules) ? log.modules.join(", ") : String(log.modules || "")
      ]);
    });

    worksheet.eachRow((row, rowNumber) => {
      row.eachCell(cell => {
        cell.alignment = { vertical: "top", horizontal: "center", wrapText: true };
        cell.border = {
          top: { style: "thin", color: { argb: "FF000000" } },
          left: { style: "thin", color: { argb: "FF000000" } },
          bottom: { style: "thin", color: { argb: "FF000000" } },
          right: { style: "thin", color: { argb: "FF000000" } }
        };
        cell.font = { name: "Arial", size: 11, bold: rowNumber === 1 };

        if (rowNumber === 1) {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F0F0" } };
        }
      });
    });

    worksheet.columns = [
      { width: 8 },
      { width: 18 },
      { width: 16 },
      { width: 16 },
      { width: 16 },
      { width: 16 },
      { width: 42 }
    ];

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });

    downloadBlob(`login_activity_${activityFormatDate(new Date()).replace(/\//g, "-")}.xlsx`, blob);
  } catch (err) {
    console.error("Activity export failed:", err);
    alert("Activity export failed. Please try again.");
  }
}

function restoreActivitySessionFromStorage() {
  const sessionId = sessionStorage.getItem("activity-session-id");
  if (sessionId) currentActivitySessionId = sessionId;
  currentActivityUsername = sessionStorage.getItem("activity-username") || "";
}

function installActivityTrackingWrappers() {
  window.showOnlyPage = function activityAwareShowOnlyPage(pageId) {
    [
      "dashboardPage",
      "timelinePage",
      "pipelinePage",
      "deploymentPage",
      "applicationPage",
      "calculatePage",
      "activityPage"
    ].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = id === pageId ? "block" : "none";
    });
  };

  const originalLogin = window.login;
  if (typeof originalLogin === "function") {
    window.login = async function activityLoginWrapper() {
      const usernameInput = document.getElementById("username");
      const username = usernameInput ? usernameInput.value.trim() : "";
      await originalLogin.apply(this, arguments);

      const app = document.getElementById("app");
      if (app && app.style.display !== "none") {
        await startActivitySession(username);
        recordActivityModule("dashboard");
      }
    };
  }

  window.logout = async function activityLogoutWrapper() {
    if (!confirm("确定要退出吗？")) return;
    await finishActivitySession();
    if (typeof saveVisibleDashboardRows === "function") saveVisibleDashboardRows();

    const app = document.getElementById("app");
    const loginBox = document.getElementById("login");
    if (app) app.style.display = "none";
    if (loginBox) loginBox.style.display = "flex";
  };

  ["Dashboard", "Timeline", "Pipeline", "Deployment", "Application"].forEach(name => {
    const fnName = `go${name}`;
    const original = window[fnName];
    if (typeof original !== "function") return;

    const moduleName = name.toLowerCase();
    window[fnName] = function activityModuleWrapper() {
      const result = original.apply(this, arguments);
      recordActivityModule(moduleName);
      return result;
    };
  });

  const originalGoCalculate = window.goCalculate;
  if (typeof originalGoCalculate === "function") {
    window.goCalculate = function activityCalculateWrapper() {
      return originalGoCalculate.apply(this, arguments);
    };
  }
}

window.addEventListener("beforeunload", () => {
  const sessionId = currentActivitySessionId || sessionStorage.getItem("activity-session-id");
  if (!sessionId) return;

  const payload = JSON.stringify({ modules: [...visitedActivityModules] });
  navigator.sendBeacon(`/api/activity/logout/${sessionId}`, new Blob([payload], { type: "application/json" }));
});

document.addEventListener("DOMContentLoaded", () => {
  restoreActivitySessionFromStorage();
  installActivityTrackingWrappers();
});
