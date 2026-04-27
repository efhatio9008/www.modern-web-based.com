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
  } else {
    alert("Login failed");
  }
}

async function loadProjects() {
  const res = await fetch("/api/projects");
  const data = await res.json();

  const table = document.getElementById("table");
  table.innerHTML = "";

  data.forEach(p => {
    table.innerHTML += `
      <tr>
        <td>${p.id}</td>

        <td><input id="desc-${p.id}" value="${p.project_description || ""}"></td>
        <td><input id="status-${p.id}" value="${p.status || ""}"></td>
        <td><input id="remarks-${p.id}" value="${p.remarks || ""}"></td>

        <td>
          ${p.si_report ? "✅ Uploaded" : "❌"}
          <input type="file" id="file-${p.id}">
          <button onclick="uploadFile(${p.id})">Upload</button>
        </td>

        <td>
          <button onclick="saveProject(${p.id})">Save</button>
        </td>
      </tr>
    `;
  });
}

async function addProject() {
  const project_description = document.getElementById("desc").value;
  const status = document.getElementById("status").value;
  const remarks = document.getElementById("remarks").value;

  await fetch("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project_description, status, remarks })
  });

  document.getElementById("desc").value = "";
  document.getElementById("status").value = "";
  document.getElementById("remarks").value = "";

  loadProjects();
}

async function saveProject(id) {
  const project_description = document.getElementById(`desc-${id}`).value;
  const status = document.getElementById(`status-${id}`).value;
  const remarks = document.getElementById(`remarks-${id}`).value;

  await fetch(`/api/projects/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project_description, status, remarks })
  });

  alert("Project saved ✅");
  loadProjects();
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