// ===========================================================
// SpotAlert Dashboard – AWS Connected + Elite & Billing (FINAL)
// ===========================================================

// 🔹 API Base (use your live backend or local for testing)
const API_BASE = "https://api.spotalert.live";

// 🔹 Elements
const faceUploadForm = document.getElementById("faceUploadForm");
const faceImage = document.getElementById("faceImage");
const faceLabel = document.getElementById("faceLabel");
const faceList = document.getElementById("faceList");
const alertList = document.getElementById("alertList");
const currentPlanDisplay = document.getElementById("currentPlan");
const upgradeBtn = document.getElementById("upgradeBtn");
const logoutBtn = document.getElementById("logoutBtn");
const uploadForm = document.getElementById("uploadForm");
const cameraFile = document.getElementById("cameraFile");
const resultDiv = document.getElementById("result");

// 🔹 Containers for new modules
const usageContainer = document.createElement("div");
const replayContainer = document.createElement("div");
usageContainer.id = "usageContainer";
replayContainer.id = "replayContainer";

document.addEventListener("DOMContentLoaded", () => {
  const dash = document.querySelector(".dashboard-container");
  if (dash) dash.append(usageContainer, replayContainer);
});

// 🔹 User + Plan
let USER_EMAIL = "admin@spotalert.live";
let USER_PLAN = "Elite"; // "Free", "Standard", "Premium", "Elite"

// 🔹 Data
let knownFaces = [];
let alerts = [];
let currentPlan = "Free Trial – 2 Cameras, Email Alerts Only";
let alertIntervalMinutes = 60;
let lastUnknownAlert = {};
let autoTopUp = true;

// ===========================================================
// INIT DASHBOARD
// ===========================================================
document.addEventListener("DOMContentLoaded", () => {
  if (currentPlanDisplay) currentPlanDisplay.textContent = currentPlan;
  renderFaces();
  renderAlerts();
  checkBackend();
  refreshUsage();
  if (USER_PLAN === "Elite") loadReplay();
  console.log("✅ SpotAlert Dashboard Ready");
});

// ===========================================================
// FACE UPLOAD (Known Persons)
// ===========================================================
if (faceUploadForm) {
  faceUploadForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const label = faceLabel.value.trim();
    const file = faceImage.files[0];
    if (!file || !label) return alert("Please select an image and enter a name.");

    if (knownFaces.length >= 10 && currentPlan.includes("Free"))
      return alert("Upgrade to add more than 10 faces.");

    const reader = new FileReader();
    reader.onload = () => {
      knownFaces.push({ name: label, img: reader.result });
      renderFaces();
      faceLabel.value = "";
      faceImage.value = "";
    };
    reader.readAsDataURL(file);
  });
}

// ===========================================================
// CAMERA UPLOAD (Trigger AWS Detection)
// ===========================================================
if (uploadForm) {
  uploadForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const file = cameraFile.files[0];
    if (!file) return alert("Please select an image first.");

    resultDiv.innerHTML = "⏳ Uploading and analyzing...";
    try {
      const fd = new FormData();
      fd.append("image", file);
      fd.append("email", USER_EMAIL);
      fd.append("plan", USER_PLAN);

      const res = await fetch(`${API_BASE}/trigger-alert`, { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      const ts = new Date().toLocaleString();
      const alertMsg = data.faces?.length
        ? `✅ ${data.faces.length} known face(s) detected.`
        : "🚨 Unknown person detected (alert sent).";
      alerts.unshift({ time: ts, message: alertMsg });
      renderAlerts();
      resultDiv.innerHTML = `<b>Result:</b> ${alertMsg}`;

      // refresh usage + elite replay
      await refreshUsage();
      if (USER_PLAN === "Elite") loadReplay();
    } catch (err) {
      console.error("⚠️ Error:", err);
      resultDiv.innerHTML = "⚠️ Connection error. Try again.";
    }
  });
}

// ===========================================================
// ALERTS & FACE MANAGEMENT
// ===========================================================
function renderAlerts() {
  if (!alertList) return;
  alertList.innerHTML = "";
  alerts.slice(0, 10).forEach((a) => {
    const li = document.createElement("li");
    li.textContent = `${a.time} — ${a.message}`;
    alertList.appendChild(li);
  });
}

function renderFaces() {
  if (!faceList) return;
  faceList.innerHTML = "";
  knownFaces.forEach((f, i) => {
    const div = document.createElement("div");
    div.className = "face-item";
    div.innerHTML = `
      <img src="${f.img}" alt="${f.name}" />
      <p>${f.name}</p>
      <button onclick="deleteFace(${i})" class="btn-danger">Remove</button>
    `;
    faceList.appendChild(div);
  });
}

function deleteFace(index) {
  knownFaces.splice(index, 1);
  renderFaces();
}

// ===========================================================
// UPGRADE & LOGOUT
// ===========================================================
if (upgradeBtn) {
  upgradeBtn.addEventListener("click", () => {
    window.location.href = "https://buy.stripe.com/cNi7sLcM16aC4nk551aVa09";
  });
}
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    if (confirm("Sign out from SpotAlert?")) {
      window.location.href = "login.html";
    }
  });
}

// ===========================================================
// BACKEND HEALTH CHECK
// ===========================================================
async function checkBackend() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    console.log(res.ok ? "🌐 Backend connected ✅" : "⚠️ Backend not responding");
  } catch {
    console.error("⚠️ Could not reach backend server.");
  }
}

// ===========================================================
// USAGE SUMMARY + TOP-UP
// ===========================================================
async function refreshUsage() {
  usageContainer.innerHTML = "<h3>📊 Usage Summary</h3><p>Loading...</p>";
  try {
    const res = await fetch(`${API_BASE}/api/usage-summary?email=${USER_EMAIL}`);
    const json = await res.json();
    if (json.error) throw new Error(json.error);

    let html = `
      <h3>📊 Monthly Usage — ${json.month}</h3>
      <p><strong>Total Cost:</strong> $${json.total_cost_usd}</p>
      <table style="width:100%;border-collapse:collapse;margin-top:10px;">
        <tr style="background:#eaf3ff;"><th>Channel</th><th>Count</th><th>Cost (USD)</th></tr>
    `;

    json.details.forEach((r) => {
      html += `<tr><td>${r.channel}</td><td>${r.count}</td><td>$${r.total.toFixed(3)}</td></tr>`;
    });

    html += `</table>
      <div style="margin-top:20px;">
        <button id="manualTopUp" style="background:#007bff;color:white;padding:10px 20px;border:none;border-radius:8px;cursor:pointer;">💳 Top Up</button>
        <button id="autoTopUpToggle" style="margin-left:10px;padding:10px 20px;border:1px solid #007bff;border-radius:8px;cursor:pointer;">⚙️ Auto Top-Up: ${autoTopUp ? "ON" : "OFF"}</button>
      </div>
    `;

    usageContainer.innerHTML = html;

    document.getElementById("manualTopUp").onclick = () => {
      window.open("https://buy.stripe.com/8x2eVd27naqS6vs0OLaVa02", "_blank");
    };

    const toggleBtn = document.getElementById("autoTopUpToggle");
    toggleBtn.onclick = () => {
      autoTopUp = !autoTopUp;
      toggleBtn.textContent = `⚙️ Auto Top-Up: ${autoTopUp ? "ON" : "OFF"}`;
      toggleBtn.style.background = autoTopUp ? "#eaf3ff" : "#fff8f8";
    };
  } catch (err) {
    usageContainer.innerHTML = `<p style="color:red;">⚠️ ${err.message}</p>`;
  }
}

// ===========================================================
// ELITE REPLAY VIEWER (Last 10 Alerts + PDF Reports)
// ===========================================================
async function loadReplay() {
  replayContainer.innerHTML = "<h3>🎥 Recent Alerts (Elite)</h3><p>Loading...</p>";

  try {
    const res = await fetch(`${API_BASE}/api/elite/replay`);
    const rows = await res.json();

    if (!rows.length) {
      replayContainer.innerHTML = "<p>No recent alerts found.</p>";
      return;
    }

    let html = `<h3>🎥 Recent Alerts</h3>
      <div style="display:flex;flex-wrap:wrap;gap:15px;justify-content:center;">`;

    for (const row of rows) {
      const imgRes = await fetch(`${API_BASE}/api/elite/frame-url/${row.image}`);
      const { url } = await imgRes.json();
      html += `
        <div style="background:white;border-radius:10px;box-shadow:0 0 6px rgba(0,0,0,0.1);padding:10px;width:220px;">
          <img src="${url}" style="width:100%;border-radius:8px;margin-bottom:6px;" />
          <p style="font-size:0.9em;"><strong>${row.type}</strong><br>${new Date(row.timestamp).toLocaleString()}</p>
          <a href="${API_BASE}/api/elite/incident-pdf/${row.id}" target="_blank" style="font-size:0.8em;text-decoration:none;color:#007bff;">📄 Download Report</a>
        </div>`;
    }

    html += "</div>";
    replayContainer.innerHTML = html;
  } catch (err) {
    replayContainer.innerHTML = `<p style="color:red;">⚠️ ${err.message}</p>`;
  }
}

// ===========================================================
// END OF FILE
// ===========================================================
