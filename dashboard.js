// ===== SpotAlert Dashboard Logic =====

// Simulated local store (replace later with AWS API calls)
let knownFaces = [];
let alerts = [];
let currentPlan = "Free Trial (90-minute active session)";
const maxFreeFaces = 10;
const scanLimitTrial = 200;
const scanLimitStandard = 1000;

// Display current plan
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("currentPlan").textContent = currentPlan;
  renderFaces();
  renderAlerts();
});

// Upload new known face
document.getElementById("faceUploadForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const fileInput = document.getElementById("faceImage");
  const label = document.getElementById("faceLabel").value.trim();
  if (!fileInput.files.length || !label) {
    alert("Please choose an image and enter a name.");
    return;
  }
  if (knownFaces.length >= maxFreeFaces) {
    alert("You’ve reached the 10-face limit. Upgrade your plan for more.");
    return;
  }

  const file = fileInput.files[0];
  const reader = new FileReader();
  reader.onload = function (evt) {
    knownFaces.push({ name: label, img: evt.target.result });
    renderFaces();
    fileInput.value = "";
    document.getElementById("faceLabel").value = "";
  };
  reader.readAsDataURL(file);
});

// Render known-faces list
function renderFaces() {
  const container = document.getElementById("faceList");
  container.innerHTML = "";
  knownFaces.forEach((face, i) => {
    const div = document.createElement("div");
    div.className = "face-item";
    div.innerHTML = `
      <img src="${face.img}" alt="${face.name}" />
      <p>${face.name}</p>
      <button onclick="deleteFace(${i})" class="btn-danger">Remove</button>
    `;
    container.appendChild(div);
  });
}

function deleteFace(index) {
  knownFaces.splice(index, 1);
  renderFaces();
}

// Simulate incoming alerts
function simulateAlert() {
  const camNames = ["CAM-101", "CAM-102"];
  const name = camNames[Math.floor(Math.random() * camNames.length)];
  const alertMsg = `Unknown face detected on ${name}`;
  const ts = new Date().toLocaleString();
  alerts.unshift({ message: alertMsg, time: ts });
  renderAlerts();
}

function renderAlerts() {
  const ul = document.getElementById("alertList");
  ul.innerHTML = "";
  alerts.slice(0, 10).forEach((a) => {
    const li = document.createElement("li");
    li.textContent = `${a.time} – ${a.message}`;
    ul.appendChild(li);
  });
}

// Simulate random alert every 3 minutes
setInterval(simulateAlert, 180000);

// Upgrade plan
document.getElementById("upgradeBtn").addEventListener("click", () => {
  currentPlan = "Standard – $19.99 / month (1 000 scans, unlimited faces)";
  document.getElementById("currentPlan").textContent = currentPlan;
  alert("Plan upgraded successfully!");
});

// Logout
document.getElementById("logoutBtn").addEventListener("click", () => {
  if (confirm("Sign out now?")) {
    window.location.href = "index.html";
  }
});
