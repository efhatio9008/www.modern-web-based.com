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
        <td contenteditable="true" id="desc-${p.id}">${p.project_description || ""}</td>
        <td contenteditable="true" id="status-${p.id}">${p.status || ""}</td>
        <td contenteditable="true" id="tendering-${p.id}">${p.tendering || ""}</td>
        <td contenteditable="true" id="bg-${p.id}">${p.bg_insurance || ""}</td>
        <td contenteditable="true" id="cwr-${p.id}">${p.cwr_po_received || ""}</td>
        <td contenteditable="true" id="workscope-${p.id}">${p.workscope || ""}</td>

        <td>
          ${p.si_report ? `
            <div class="file-box">
              📄 <a href="/uploads/${p.si_report}" download>${p.si_report}</a>
            </div>
          ` : ""}

          <div class="upload-box">
            <input type="file" id="file-${p.id}">
            <button onclick="uploadFile(${p.id})">Upload</button>
          </div>
        </td>

        <td contenteditable="true" id="cost-${p.id}">${p.cost_proposal || ""}</td>
        <td contenteditable="true" id="ccc-${p.id}">${p.ccc_readiness_manpower || ""}</td>
        <td contenteditable="true" id="procurement-${p.id}">${p.procurement_material || ""}</td>
        <td contenteditable="true" id="delivery-${p.id}">${p.delivery_material_site || ""}</td>
        <td contenteditable="true" id="fcb-${p.id}">${p.fcb_booking || ""}</td>
        <td contenteditable="true" id="mob-${p.id}">${p.mob_execution || ""}</td>
        <td contenteditable="true" id="handover-${p.id}">${p.handover_site || ""}</td>
        <td contenteditable="true" id="demob-${p.id}">${p.demob_date || ""}</td>
        <td contenteditable="true" id="close-${p.id}">${p.close_out_report || ""}</td>
        <td contenteditable="true" id="remarks-${p.id}">${p.remarks || ""}</td>

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
  let rows = document.querySelectorAll("#table tr");
  let csv = [];

  const headers = [
    "ID","Project","Status","Tendering","BG","CWR/PO",
    "Workscope","SI Report","Cost","CCC","Procurement",
    "Delivery","FCB","Mob","Handover","Demob","Close Out","Remarks"
  ];

  csv.push(headers.join(","));

  rows.forEach(row => {
    let cols = row.querySelectorAll("td");
    let rowData = [];

    cols.forEach((col, index) => {
      if (index === cols.length - 1) return;
      rowData.push(`"${col.innerText.replace(/"/g, '""').replace(/\n/g, " ").trim()}"`);
    });

    csv.push(rowData.join(","));
  });

  let blob = new Blob([csv.join("\n")], { type: "text/csv" });

  let a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "project_dashboard.csv";
  a.click();
}