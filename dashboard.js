// =============================================
// SpotAlert Dashboard (Connected to AWS Backend)
// =============================================

// 🔹 API base (use your deployed backend domain)
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

// 🔹 Data
let knownFaces = [];
let alerts = [];
let currentPlan = "Free Trial – 200 Scans, 2 Cameras, Email Alerts Only";
let alertIntervalMinutes = 60; // Default: 1 hour between same-person alerts
let lastUnknownAlert = {}; // Track last alert timestamp per face

// ===============================
// 1️⃣ INIT DASHBOARD
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  currentPlanDisplay.textContent = currentPlan;
  renderFaces();
  renderAlerts();
  console.log("✅ SpotAlert Dashboard Ready");
});

// ===============================
// 2️⃣ FACE UPLOAD (Known Faces)
// ===============================
if (faceUploadForm) {
  faceUploadForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const label = faceLabel.value.trim();
    const file = faceImage.files[0];

    if (!file || !label) {
      alert("Please choose an image and enter a label.");
      return;
    }

    if (knownFaces.length >= 10 && currentPlan.includes("Free")) {
      alert("Upgrade required to add more than 10 known faces.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      knownFaces.push({ name: label, img: reader.result });
      renderFaces();
    };
    reader.readAsDataURL(file);

    faceLabel.value = "";
    faceImage.value = "";
  });
}

// ===============================
// 3️⃣ ALERT SIMULATION (Realtime Monitor)
// ===============================
function simulateIncomingAlert() {
  const ts = new Date().toLocaleString();
  const message = "🚨 Unknown face detected near Zone A";
  alerts.unshift({ time: ts, message });
  renderAlerts();

  // Sound or visual alert
  console.log("🔔 ALERT:", message);
}

// ===============================
// 4️⃣ SEND IMAGE TO BACKEND (Trigger Detection)
// ===============================
async function sendFrameToBackend(file) {
  try {
    const formData = new FormData();
    formData.append("image", file);
    formData.append("email", "admin@spotalert.live");

    const res = await fetch(`${API_BASE}/trigger-alert`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (res.ok) {
      const ts = new Date().toLocaleString();
      const alertMsg = `📸 Detection Success: ${data.faces.length} face(s) found`;
      alerts.unshift({ time: ts, message: alertMsg });
      renderAlerts();
      console.log("✅ Detection complete:", data);
    } else {
      console.error("❌ Error:", data.error);
    }
  } catch (err) {
    console.error("⚠️ Backend connection error:", err);
  }
}

// ===============================
// 5️⃣ ALERT MANAGEMENT
// ===============================
function renderAlerts() {
  alertList.innerHTML = "";
  alerts.slice(0, 10).forEach((a) => {
    const li = document.createElement("li");
    li.textContent = `${a.time} — ${a.message}`;
    alertList.appendChild(li);
  });
}

// ===============================
// 6️⃣ FACE LIST MANAGEMENT
// ===============================
function renderFaces() {
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

// ===============================
// 7️⃣ UPGRADE PLAN
// ===============================
if (upgradeBtn) {
  upgradeBtn.addEventListener("click", () => {
    window.location.href = "https://buy.stripe.com/cNi7sLcM16aC4nk551aVa09";
  });
}

// ===============================
// 8️⃣ LOGOUT
// ===============================
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    if (confirm("Sign out from SpotAlert?")) {
      window.location.href = "login.html";
    }
  });
}

// ===============================
// 9️⃣ AUTOMATED UNKNOWN ALERTS
// (Based on interval user setting)
// ===============================
function scheduleUnknownAlert(name) {
  const now = Date.now();
  const last = lastUnknownAlert[name] || 0;
  const diffMinutes = (now - last) / 60000;

  if (diffMinutes >= alertIntervalMinutes) {
    lastUnknownAlert[name] = now;
    simulateIncomingAlert();
  } else {
    console.log(`⏳ Skipping duplicate alert (${Math.round(diffMinutes)} min since last).`);
  }
}

// ===============================
// 🔟 TEST BACKEND CONNECTION
// ===============================
async function checkBackend() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (res.ok) console.log("🌐 Backend Connected ✅");
    else console.log("❌ Backend not responding");
  } catch {
    console.error("⚠️ Could not reach backend.");
  }
}
checkBackend();
