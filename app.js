document.getElementById("loginForm").addEventListener("submit", async (e) => {
e.preventDefault();

const username = document.getElementById("username").value;
const password = document.getElementById("password").value;

const res = await fetch("/login", {
method: "POST",
headers: {
"Content-Type": "application/json",
},
body: JSON.stringify({ username, password }),
});

const data = await res.json();

if (data.success) {
document.getElementById("loginView").classList.add("hidden");
document.getElementById("appView").classList.remove("hidden");
loadProjects();
document.getElementById("currentUser").innerText = username;
} else {
document.getElementById("errorMsg").innerText = "Wrong username or password";
}
});

async function loadProjects() {
  const res = await fetch("/api/projects");

  if (!res.ok) {
    console.error("Not logged in or error");
    return;
  }

  const projects = await res.json();

  const tbody = document.getElementById("projectRows");
  tbody.innerHTML = "";

  projects.forEach((p, index) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${p.project_description || ""}</td>
      <td>${p.status || ""}</td>
      <td>${p.remarks || ""}</td>
      <td><button onclick="saveProject(${p.id})">Save</button></td>
    `;

    tbody.appendChild(row);
  });
}

function saveProject(id) {
  alert("Save coming soon: " + id);
}
