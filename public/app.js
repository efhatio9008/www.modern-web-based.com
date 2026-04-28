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

  data.forEach((p, index) => {
    table.innerHTML += `
      <tr>
       <td>${index + 1}</td>
        <td><input id="desc-${p.id}" value="${p.project_description || ""}"></td>
        <td><input id="status-${p.id}" value="${p.status || ""}"></td>
        <td><input id="tendering-${p.id}" value="${p.tendering || ""}"></td>
        <td><input id="bg-${p.id}" value="${p.bg_insurance || ""}"></td>
        <td><input id="cwr-${p.id}" value="${p.cwr_po_received || ""}"></td>
        <td><input id="workscope-${p.id}" value="${p.workscope || ""}"></td>

        <td>
          ${p.si_report ? `
            <a href="/uploads/${p.si_report}" target="_blank">📄 View</a>
            <button onclick="removeFile(${p.id})">Remove</button>
          ` : "❌"}
          <input type="file" id="file-${p.id}">
          <button onclick="uploadFile(${p.id})">Upload</button>
        </td>

        <td><input id="cost-${p.id}" value="${p.cost_proposal || ""}"></td>
        <td><input id="ccc-${p.id}" value="${p.ccc_readiness_manpower || ""}"></td>
        <td><input id="procurement-${p.id}" value="${p.procurement_material || ""}"></td>
        <td><input id="delivery-${p.id}" value="${p.delivery_material_site || ""}"></td>
        <td><input id="fcb-${p.id}" value="${p.fcb_booking || ""}"></td>
        <td><input id="mob-${p.id}" value="${p.mob_execution || ""}"></td>
        <td><input id="handover-${p.id}" value="${p.handover_site || ""}"></td>
        <td><input id="demob-${p.id}" value="${p.demob_date || ""}"></td>
        <td><input id="close-${p.id}" value="${p.close_out_report || ""}"></td>
        <td><input id="remarks-${p.id}" value="${p.remarks || ""}"></td>

        <td>
          <button onclick="saveProject(${p.id})">Save</button>
          <button onclick="deleteProject(${p.id})">Delete</button>
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

async function saveProject(id) {
  const project_description = document.getElementById(`desc-${id}`).value;
  const status = document.getElementById(`status-${id}`).value;
  const remarks = document.getElementById(`remarks-${id}`).value;

  const tendering = document.getElementById(`tendering-${id}`).value;
  const bg_insurance = document.getElementById(`bg-${id}`).value;
  const cwr_po_received = document.getElementById(`cwr-${id}`).value;
  const workscope = document.getElementById(`workscope-${id}`).value;
  const cost_proposal = document.getElementById(`cost-${id}`).value;
  const ccc_readiness_manpower = document.getElementById(`ccc-${id}`).value;
  const procurement_material = document.getElementById(`procurement-${id}`).value;
  const delivery_material_site = document.getElementById(`delivery-${id}`).value;
  const fcb_booking = document.getElementById(`fcb-${id}`).value;
  const mob_execution = document.getElementById(`mob-${id}`).value;
  const handover_site = document.getElementById(`handover-${id}`).value;
  const demob_date = document.getElementById(`demob-${id}`).value;
  const close_out_report = document.getElementById(`close-${id}`).value;

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

  document.getElementById('app').style.display = 'none';
  document.getElementById('login').style.display = 'block';
}