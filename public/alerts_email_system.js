// ===============================================================
// SpotAlert – Email Alert System (FINAL PRODUCTION VERSION)
// Uses backend route:  POST /alert-email
// ===============================================================

// 🔗 FINAL backend API base
const API_BASE = "https://api.spotalert.live";

// ===============================================================
// 🚨 Send Alert Email to User
// ===============================================================
async function sendEmailAlert(userEmail, imageURL, cameraName) {
  try {
    console.log("📨 Sending alert email to:", userEmail);

    const response = await fetch(`${API_BASE}/alert-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: userEmail,
        subject: `SpotAlert - Unknown Person Detected (${cameraName})`,
        message: `
An unknown person was detected by your camera: ${cameraName}.

Snapshot:
${imageURL}

Log in to your SpotAlert dashboard for full tracking history.
        `,
      }),
    });

    // ----------------------
    // Handle failure
    // ----------------------
    if (!response.ok) {
      let errText = await response.text();
      console.error("❌ Email send failed:", errText);
      return false;
    }

    console.log("✅ Email sent successfully to", userEmail);
    return true;

  } catch (err) {
    console.error("❌ Critical email error:", err);
    return false;
  }
}

// ===============================================================
// (Optional) Fetch Email Logs — Only enable when backend supports it
// ===============================================================
async function fetchEmailLogs() {
  try {
    const response = await fetch(`${API_BASE}/email-logs`);
    if (!response.ok) return [];

    const logs = await response.json();
    console.table(logs);
    return logs;

  } catch (err) {
    console.error("❌ Failed to fetch email logs:", err);
    return [];
  }
}
