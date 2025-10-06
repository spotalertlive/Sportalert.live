// admin_dashboard.js
document.addEventListener("DOMContentLoaded", () => {
  const usersTable = document.querySelector("#usersTable tbody");
  const alertsTable = document.querySelector("#alertsTable tbody");
  const refreshUsersBtn = document.getElementById("refreshUsers");
  const refreshAlertsBtn = document.getElementById("refreshAlertsAdmin");
  const logoutBtn = document.getElementById("logoutAdmin");
  const sendNoticeBtn = document.getElementById("sendNotice");
  const viewLogsBtn = document.getElementById("viewLogs");
  const editPlansBtn = document.getElementById("editPlans");

  const API_BASE = "https://api.spotalert.live"; // ← replace with your deployed backend endpoint

  // --- USERS ---
  async function loadUsers() {
    usersTable.innerHTML = "<tr><td colspan='7'>Loading users...</td></tr>";
    try {
      const res = await fetch(`${API_BASE}/admin/users`);
      const users = await res.json();
      usersTable.innerHTML = "";

      users.forEach(u => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${u.id}</td>
          <td>${u.email}</td>
          <td>${u.plan}</td>
          <td>${u.known_faces}</td>
          <td>${u.scans_used}/${u.scan_limit}</td>
          <td>${u.active ? "Active" : "Disabled"}</td>
          <td>
            <button onclick="toggleUser('${u.id}')">${u.active ? "Disable" : "Enable"}</button>
            <button onclick="resetScans('${u.id}')">Reset Scans</button>
          </td>`;
        usersTable.appendChild(tr);
      });
    } catch (err) {
      usersTable.innerHTML = `<tr><td colspan='7'>Error loading users: ${err.message}</td></tr>`;
    }
  }

  // --- ALERTS ---
  async function loadAlerts() {
    alertsTable.innerHTML = "<tr><td colspan='6'>Loading alerts...</td></tr>";
    try {
      const res = await fetch(`${API_BASE}/admin/alerts`);
      const alerts = await res.json();
      alertsTable.innerHTML = "";

      alerts.forEach(a => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${a.id}</td>
          <td>${a.user}</td>
          <td>${a.camera_name}</td>
          <td>${new Date(a.timestamp).toLocaleString()}</td>
          <td><img src="${a.snapshot_url}" width="70" /></td>
          <td>${a.type}</td>`;
        alertsTable.appendChild(tr);
      });
    } catch (err) {
      alertsTable.innerHTML = `<tr><td colspan='6'>Error loading alerts: ${err.message}</td></tr>`;
    }
  }

  // --- ADMIN ACTIONS ---
  window.toggleUser = async (id) => {
    await fetch(`${API_BASE}/admin/users/${id}/toggle`, { method: "POST" });
    loadUsers();
  };

  window.resetScans = async (id) => {
    await fetch(`${API_BASE}/admin/users/${id}/reset_scans`, { method: "POST" });
    loadUsers();
  };

  sendNoticeBtn.addEventListener("click", async () => {
    const msg = prompt("Enter a message to send to all users:");
    if (!msg) return;
    await fetch(`${API_BASE}/admin/notify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msg })
    });
    alert("Notice sent.");
  });

  viewLogsBtn.addEventListener("click", () => {
    window.open(`${API_BASE}/admin/logs`, "_blank");
  });

  editPlansBtn.addEventListener("click", () => {
    alert("Plan editing will be added in next admin update.");
  });

  logoutBtn.addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "admin_login.html";
  });

  refreshUsersBtn.addEventListener("click", loadUsers);
  refreshAlertsBtn.addEventListener("click", loadAlerts);

  // Initial load
  loadUsers();
  loadAlerts();
});
