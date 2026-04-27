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
table.innerHTML += `       <tr>         <td>${p.id}</td>         <td>${p.project_description}</td>         <td>${p.status}</td>         <td>${p.remarks}</td>       </tr>
    `;
});
}

async function addProject() {
const project_description = document.getElementById("desc").value;
const status = document.getElementById("status").value;
const remarks = document.getElementById("remarks").value;

await fetch("/api/projects", {
method: "POST",
headers: {"Content-Type":"application/json"},
body: JSON.stringify({ project_description, status, remarks })
});

loadProjects();
}
