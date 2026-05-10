let currentActivityUser = "";
let currentActivityLoginTime = null;
let currentActivityModules = new Set();

function activityNow() {
  return new Date().toISOString();
}

function formatActivityTime(value) {
  if (!value) return "";

  return new Date(value).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
}

/* =========================
   POSTGRES ACTIVITY API
========================= */

async function getActivityLogs() {
  try {
    const res = await fetch("/api/activity-logs");

    if (!res.ok) return [];

    const rows = await res.json();

    return rows.map(row => ({
      user: row.username,
      loginTime: row.login_time,
      logoutTime: row.logout_time,
      modules: row.modules || []
    }));
  } catch (err) {
    console.error("GET activity logs failed:", err);
    return [];
  }
}

async function saveActivityLog(log) {
  try {
    await fetch("/api/activity-logs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username: log.user,
        login_time: log.loginTime,
        logout_time: log.logoutTime,
        modules: log.modules || []
      })
    });
  } catch (err) {
    console.error("SAVE activity log failed:", err);
  }
}

function startActivitySession(username) {
  currentActivityUser = username || "Unknown";
  currentActivityLoginTime = activityNow();
  currentActivityModules = new Set();
}

function trackActivityModule(moduleName) {
  if (!currentActivityUser) return;

  if (moduleName === "Calculate") return;

  currentActivityModules.add(moduleName);
}

async function endActivitySession() {
  if (!currentActivityUser || !currentActivityLoginTime) return;

  await saveActivityLog({
    user: currentActivityUser,
    loginTime: currentActivityLoginTime,
    logoutTime: activityNow(),
    modules: Array.from(currentActivityModules)
  });

  currentActivityUser = "";
  currentActivityLoginTime = null;
  currentActivityModules = new Set();
}

function goActivityLogs() {
  showOnlyPage("activityPage");
  renderActivityLogs();
}

async function renderActivityLogs() {
  const tbody = document.getElementById("activityLogTable");

  if (!tbody) return;

  const logs = await getActivityLogs();

  if (!logs.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5">No activity logs in last 72 hours.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = logs.map((log, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${log.user}</td>
      <td>${formatActivityTime(log.loginTime)}</td>
      <td>${formatActivityTime(log.logoutTime)}</td>
      <td>${(log.modules || []).join(", ") || "No module visited"}</td>
    </tr>
  `).join("");
}

async function exportActivityLogs() {
  const logs = await getActivityLogs();

  if (!logs.length) {
    alert("No activity logs to export");
    return;
  }

  await ensureExcelJsLoaded();

  const workbook = new ExcelJS.Workbook();

  workbook.creator = "MEPSB Web Management System";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("User Activity", {
    views: [{ state: "frozen", ySplit: 1 }]
  });

  worksheet.addRow([
    "No.",
    "User",
    "Login Time",
    "Logout Time",
    "Visited Modules"
  ]);

  logs.forEach((log, index) => {
    worksheet.addRow([
      index + 1,
      log.user,
      formatActivityTime(log.loginTime),
      formatActivityTime(log.logoutTime),
      (log.modules || []).join(", ") || "No module visited"
    ]);
  });

  worksheet.columns.forEach(column => {
    column.width = 24;
  });

  worksheet.getRow(1).eachCell(cell => {
    cell.font = { bold: true };
    cell.alignment = {
      horizontal: "center",
      vertical: "middle"
    };
  });

  const buffer = await workbook.xlsx.writeBuffer();

  const blob = new Blob(
    [buffer],
    {
      type:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    }
  );

  downloadBlob("user_activity_logs_72_hours.xlsx", blob);
}

document.addEventListener("DOMContentLoaded", () => {

  const originalLogin = window.login;
  const originalLogout = window.logout;

  window.login = async function () {

    const username =
      document.getElementById("username").value;

    await originalLogin();

    if (
      document.getElementById("app").style.display === "block"
    ) {
      startActivitySession(username);
    }
  };

  window.logout = async function () {

    await endActivitySession();

    originalLogout();
  };

  const originalGoDashboard = window.goDashboard;

  window.goDashboard = function () {
    trackActivityModule("Dashboard");
    originalGoDashboard();
  };

  const originalGoTimeline = window.goTimeline;

  window.goTimeline = function () {
    trackActivityModule("Timeline");
    originalGoTimeline();
  };

  const originalGoPipeline = window.goPipeline;

  window.goPipeline = function () {
    trackActivityModule("Pipeline");
    originalGoPipeline();
  };

  const originalGoDeployment = window.goDeployment;

  window.goDeployment = function () {
    trackActivityModule("Deployment");
    originalGoDeployment();
  };

  const originalGoApplication = window.goApplication;

  window.goApplication = function () {
    trackActivityModule("Application License");
    originalGoApplication();
  };

});