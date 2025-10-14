// =============================================
// SpotAlert Dashboard – AWS Connected (FINAL)
// =============================================

// 🔹 API Base (live backend)
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

// 🔹 Data
let knownFaces = [];
let alerts = [];
let currentPlan = "Free Trial – 2 Cameras, Email Alerts Only";
let alertIntervalMinutes = 60; // Default: 1 hour between same-person alerts
let lastUnknownAlert = {};

// =====================================
// INIT DASHBOARD
// =====================================
document.addEventListener("DOMContentLoaded", () => {
  if (currentPlanDisplay) currentPlanDisplay.textContent = currentPlan;
  renderFaces();
  renderAlerts();
  console.log("✅ SpotAlert Dashboard Ready");
  checkBackend();
});

// =====================================
// FACE UPLOAD (Known Persons)
// =====================================
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

// =====================================
// CAMERA UPLOAD (Trigger AWS Detection)
// =====================================
if (uploadForm) {
  uploadForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const file = cameraFile.files[0];
    if (!file) return alert("Please select an image first.");

    resultDiv.innerHTML = "⏳ Uploading and analyzing...";
    try {
      const fd = new FormData();
      fd.append("image", file);
      fd.append("email", "admin@spotalert.live");

      const res = await fetch(`${API_BASE}/trigger-alert`, {
        method: "POST",
        body: fd,
      });

      const data = await res.json();
      if (res.ok) {
        const ts = new Date().toLocaleString();
        const alertMsg = data.faces?.length
          ? `✅ ${data.faces.length} face(s) detected.`
          : "🚨 Unknown person detected (email sent).";
        alerts.unshift({ time: ts, message: alertMsg });
        renderAlerts();
        resultDiv.innerHTML = `<b>Result:</b> ${alertMsg}`;
      } else {
        resultDiv.innerHTML = `<b>Error:</b> ${data.error}`;
      }
    } catch (err) {
      console.error("⚠️ Error:", err);
      resultDiv.innerHTML = "⚠️ Connection error. Try again.";
    }
  });
}

// =====================================
// ALERTS & FACE MANAGEMENT
// =====================================
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

// =====================================
// UPGRADE & LOGOUT
// =====================================
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

// =====================================
// BACKEND HEALTH CHECK
// =====================================
async function checkBackend() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (res.ok) {
      console.log("🌐 Backend connected ✅");
    } else {
      console.warn("⚠️ Backend not responding");
    }
  } catch {
    console.error("⚠️ Could not reach backend server.");
  }
}
