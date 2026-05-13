/* =========================
   ONLINE USERS PRESENCE
========================= */

let currentSessionId = "";

let browserSessionId = "";

function getBrowserSessionId() {
  if (!browserSessionId) {
    browserSessionId =
      (crypto.randomUUID && crypto.randomUUID()) ||
      `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  return browserSessionId;
}

let currentOnlineUsername = "";
let onlineHeartbeatTimer = null;
let onlineRefreshTimer = null;

let currentActivityUser = "";
let currentActivityLoginTime = null;
let currentActivityModules = new Set();


function getOnlineAvatar(username) {

  const value = String(username || "").toLowerCase();

  if (value.includes("winnie")) {
    return "👩";
  }

  return "👨";
}

async function sendOnlineHeartbeat() {

  if (!currentOnlineUsername) return;

  try {

    await fetch("/api/online-users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
      username: currentOnlineUsername,
      sessionId: currentSessionId
    })
    });

  } catch (err) {
    console.error("Heartbeat failed:", err);
  }
}

async function renderOnlineUsers() {

  const bar = document.getElementById("onlineUsersBar");

  if (!bar) return;

  if (!currentOnlineUsername) {
    bar.innerHTML = "";
    return;
  }

  try {

    const res = await fetch("/api/online-users");

    if (!res.ok) return;

    const data = await res.json();

    const users = (data.users || [])
      .filter(user => user !== currentOnlineUsername);

    if (!users.length) {
      bar.innerHTML = "";
      return;
    }

    bar.innerHTML = users.map(user => `
      <div class="online-user-chip">

        <span class="online-user-avatar">
          ${getOnlineAvatar(user)}
        </span>

        <span class="online-user-name">
          ${user}
        </span>

        <span class="online-user-dot"></span>

      </div>
    `).join("");

  } catch (err) {
    console.error("Load online users failed:", err);
  }
}

function startOnlinePresence(username) {

  currentOnlineUsername = username;

  currentSessionId =
    getBrowserSessionId();

  sendOnlineHeartbeat();
  renderOnlineUsers();

  clearInterval(onlineHeartbeatTimer);
  clearInterval(onlineRefreshTimer);

  onlineHeartbeatTimer = setInterval(
    sendOnlineHeartbeat,
    10000
  );

  onlineRefreshTimer = setInterval(
    renderOnlineUsers,
    5000
  );
}

function stopOnlinePresence() {

  if (currentOnlineUsername && currentSessionId) {
    fetch("/api/logout-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username: currentOnlineUsername,
        sessionId: currentSessionId
      })
    });
  }

  clearInterval(onlineHeartbeatTimer);
  clearInterval(onlineRefreshTimer);

  onlineHeartbeatTimer = null;
  onlineRefreshTimer = null;

  currentOnlineUsername = "";
  currentSessionId = "";

  const bar = document.getElementById("onlineUsersBar");

  if (bar) {
    bar.innerHTML = "";
  }
}

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
      startOnlinePresence(username);
    }
  };

 window.logout = async function () {

  if (!confirm("确定要退出吗？")) return;

  await endActivitySession();
  stopOnlinePresence();

  saveVisibleDashboardRows();

  document.getElementById("app").style.display = "none";
  document.getElementById("login").style.display = "flex";
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

/* =========================
   SEND EMAIL MODAL
========================= */
let emailTargetModule = "";
let emailTargetGroup = "";

function ensureEmailModal() {
  let modal = document.getElementById("groupEmailModal");
  if (modal) return modal;

  modal = document.createElement("div");
  modal.id = "groupEmailModal";
  modal.className = "group-email-modal";
  modal.innerHTML = `
    <div class="group-email-box">
      <h3>Send Export to Email</h3>

      <div class="group-email-info">
        <strong>Group:</strong>
        <span id="emailModalGroupName"></span>
      </div>

      <input
        id="groupEmailInput"
        class="group-email-input"
        type="email"
        placeholder="Enter recipient email"
        autocomplete="off"
        oninput="loadEmailSuggestions(this.value)"
      />

      <div id="emailSuggestionBox" class="email-suggestion-box"></div>

      <textarea
        id="groupEmailMessage"
        class="group-email-message"
        placeholder="Optional message"
      ></textarea>

      <div class="group-email-actions">
        <button type="button" onclick="sendCurrentGroupEmail()">Send</button>
        <button type="button" onclick="closeEmailModal()">Cancel</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  return modal;
}

function openEmailModal(module, groupTitle) {
  emailTargetModule = module;
  emailTargetGroup = groupTitle;

  const modal = ensureEmailModal();
  const groupName = document.getElementById("emailModalGroupName");
  const input = document.getElementById("groupEmailInput");
  const message = document.getElementById("groupEmailMessage");
  const suggestions = document.getElementById("emailSuggestionBox");

  if (groupName) groupName.innerText = `${module} / ${groupTitle}`;
  if (input) input.value = "";
  if (message) message.value = "";
  if (suggestions) suggestions.innerHTML = "";

  modal.style.display = "flex";

  setTimeout(() => {
    if (input) input.focus();
  }, 50);
}

function closeEmailModal() {
  const modal = document.getElementById("groupEmailModal");
  if (modal) modal.style.display = "none";
}

async function loadEmailSuggestions(value) {
  const box = document.getElementById("emailSuggestionBox");
  if (!box) return;

  const q = String(value || "").trim();

  if (!q) {
    box.innerHTML = "";
    return;
  }

  try {
    const res = await fetch(`/api/email-history?q=${encodeURIComponent(q)}`);
    if (!res.ok) return;

    const rows = await res.json();

    box.innerHTML = rows.map(row => `
      <div class="email-suggestion-item" onclick="selectEmailSuggestion('${escHtml(row.email)}')">
        ${escHtml(row.email)}
      </div>
    `).join("");
  } catch (err) {
    console.error("Email suggestions failed:", err);
  }
}

function selectEmailSuggestion(email) {
  const input = document.getElementById("groupEmailInput");
  const box = document.getElementById("emailSuggestionBox");

  if (input) input.value = email;
  if (box) box.innerHTML = "";
}

function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);

  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary);
}

async function generateGroupExcelBufferForEmail(module, groupTitle) {
  const exportDom = buildFullGroupExportDom(module, groupTitle);
  const rows = exportDom ? exportDom.rows : [];

  if (!rows.length) {
    if (exportDom) exportDom.cleanup();
    throw new Error("No rows to send for this group");
  }

  try {
    await ensureExcelJsLoaded();

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "MEPSB Web Management System";
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet(
      safeFilename(groupTitle).slice(0, 31) || "Export",
      {
        views: [{ state: "frozen", ySplit: 1 }]
      }
    );

    let rowIndex = 1;

    getHeaderRowsForExport(module).forEach(domHeaderRow => {
      const excelRow = worksheet.getRow(rowIndex++);
      applyDomRowToWorksheetRow(excelRow, domHeaderRow);

      excelRow.eachCell(cell => {
        cell.font = {
          ...(cell.font || {}),
          bold: true,
          color: { argb: "FF000000" }
        };

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
        else if (cell.value?.richText) {
          value = cell.value.richText.map(part => part.text).join("");
        } else if (cell.value != null) {
          value = String(cell.value);
        }

        maxLength = Math.max(maxLength, Math.min(value.length + 2, 45));
      });

      column.width = maxLength;
    });

    return await workbook.xlsx.writeBuffer();
  } finally {
    if (exportDom) exportDom.cleanup();
  }
}

async function sendCurrentGroupEmail() {
  const input = document.getElementById("groupEmailInput");
  const messageBox = document.getElementById("groupEmailMessage");

  const to = input ? input.value.trim() : "";
  const message = messageBox ? messageBox.value.trim() : "";

  if (!to || !to.includes("@")) {
    alert("Please enter a valid email address");
    return;
  }

  try {
    const buffer = await generateGroupExcelBufferForEmail(
      emailTargetModule,
      emailTargetGroup
    );

    const fileBase64 = arrayBufferToBase64(buffer);
    const filename = `${emailTargetModule}_${safeFilename(emailTargetGroup)}.xlsx`;

    const res = await fetch("/api/send-group-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        to,
        subject: `${emailTargetModule} Export - ${emailTargetGroup}`,
        message: message || "Please find the attached Excel export.",
        filename,
        fileBase64
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Send email failed");
    }

    alert("Email sent successfully ✅");
    closeEmailModal();
  } catch (err) {
    console.error("Send email failed:", err);
    alert("Send email failed. Please check Render environment/email settings.");
  }
}