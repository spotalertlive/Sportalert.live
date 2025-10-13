/* ===== SpotAlert Dashboard (Live AWS-Connected) ===== */

// Current user plan & limits
let currentPlan = "Free Trial – 200 scans / up to 2 cameras";
let knownFaces = [];
let alerts = [];

// Elements
const planText = document.getElementById("currentPlan");
const faceForm = document.getElementById("faceUploadForm");
const faceFile = document.getElementById("faceImage");
const faceLabel = document.getElementById("faceLabel");
const faceList = document.getElementById("faceList");
const alertList = document.getElementById("alertList");
const upgradeBtn = document.getElementById("upgradeBtn");
const logoutBtn = document.getElementById("logoutBtn");

// Init
document.addEventListener("DOMContentLoaded", () => {
  planText.textContent = currentPlan;
  loadRecentAlerts();
});

/* === Upload New Known Face === */
faceForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!faceFile.files.length || !faceLabel.value.trim()) {
    alert("Please choose an image and enter a label name.");
    return;
  }

  const formData = new FormData();
  formData.append("image", faceFile.files[0]);
  formData.append("label", faceLabel.value.trim());

  try {
    const res = await fetch("/api/index", { method: "POST", body: formData });
    const data = await res.json();

    if (data.success) {
      knownFaces.push({ name: faceLabel.value.trim(), img: URL.createObjectURL(faceFile.files[0]) });
      renderFaces();
      faceFile.value = "";
      faceLabel.value = "";
      alert(`✅ ${data.message}`);
    } else {
      alert(`⚠️ ${data.message || "Upload failed"}`);
    }
  } catch (err) {
    console.error(err);
    alert("Server error. Please try again.");
  }
});

/* === Render Known Faces === */
function renderFaces() {
  faceList.innerHTML = "";
  knownFaces.forEach((f, i) => {
    const div = document.createElement("div");
    div.className = "face-item";
    div.innerHTML = `
      <img src="${f.img}" alt="${f.name}" />
      <p>${f.name}</p>
      <button class="btn-danger" onclick="removeFace(${i})">Remove</button>
    `;
    faceList.appendChild(div);
  });
}

function removeFace(i) {
  knownFaces.splice(i, 1);
  renderFaces();
}

/* === Trigger AWS Detection Manually === */
async function runDetection() {
  try {
    const res = await fetch("/api/detect", { method: "POST" });
    const data = await res.json();
    if (data.status === "unknown") {
      const ts = new Date().toLocaleString();
      alerts.unshift({ time: ts, message: "🚨 Unknown face detected — alert sent!" });
      renderAlerts();
    } else if (data.status === "known") {
      console.log("✅ Known face detected (no alert triggered).");
    }
  } catch (err) {
    console.error(err);
    alert("Detection error — check backend connection.");
  }
}

/* === Render Alerts === */
function renderAlerts() {
  alertList.innerHTML = "";
  alerts.slice(0, 10).forEach((a) => {
    const li = document.createElement("li");
    li.textContent = `${a.time} – ${a.message}`;
    alertList.appendChild(li);
  });
}

/* === Load Last Alerts on Page Load === */
async function loadRecentAlerts() {
  try {
    const res = await fetch("/api/alerts");
    const data = await res.json();
    if (data.success && data.alerts) {
      alerts = data.alerts;
      renderAlerts();
    }
  } catch {
    console.log("No previous alerts found.");
  }
}

/* === Upgrade Plan === */
upgradeBtn.addEventListener("click", () => {
  window.location.href = "plans.html";
});

/* === Logout === */
logoutBtn.addEventListener("click", () => {
  if (confirm("Sign out now?")) {
    window.location.href = "index.html";
  }
});

/* === Optional Auto Detection (every 60min) === */
setInterval(runDetection, 3600000); // 1 hour default
