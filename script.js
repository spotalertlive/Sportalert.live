// ===== SpotAlert Frontend Script =====

// === Smooth Scroll for Navigation Links ===
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    document.querySelector(this.getAttribute('href')).scrollIntoView({
      behavior: 'smooth'
    });
  });
});

// === Trial and Plan Selection ===
const planButtons = document.querySelectorAll('.plan-btn');

planButtons.forEach(button => {
  button.addEventListener('click', () => {
    const plan = button.getAttribute('data-plan');
    localStorage.setItem('selectedPlan', plan);

    if (plan === 'trial') {
      alert('✅ Free Trial activated for 14 days with 200 scans & 10 known faces.');
      window.location.href = '/dashboard.html';
    } else if (plan === 'standard') {
      alert('✅ Standard Plan selected: up to 1000 scans & 10 known faces.');
      window.location.href = '/checkout.html';
    } else {
      alert('Coming soon!');
    }
  });
});

// === Dropdown Menu Toggle ===
const toggle = document.querySelector('.menu-toggle');
const dropdown = document.querySelector('.dropdown-menu');
const header = document.querySelector('.frosted-header');

if (toggle && dropdown) {
  toggle.addEventListener('click', () => {
    dropdown.classList.toggle('show');
  });
}

// === Scroll Shrink Effect for Frosted Header ===
window.addEventListener('scroll', () => {
  if (header) {
    if (window.scrollY > 40) {
      header.classList.add('shrink');
    } else {
      header.classList.remove('shrink');
    }
  }
});

// === Optional Old Nav Shadow Logic (kept compatible) ===
window.addEventListener('scroll', () => {
  const nav = document.querySelector('header.nav');
  if (nav) {
    if (window.scrollY > 50) {
      nav.style.boxShadow = '0 3px 8px rgba(0,0,0,0.1)';
    } else {
      nav.style.boxShadow = 'none';
    }
  }
});

// === Dashboard Redirection ===
const dashboardBtn = document.getElementById('dashboardBtn');
if (dashboardBtn) {
  dashboardBtn.addEventListener('click', () => {
    window.location.href = '/dashboard.html';
  });
}

// === Fake Email Alert Simulation (Front Only) ===
function sendAlertEmail(name, cameraId) {
  console.log(`📸 Alert triggered for camera ${cameraId} by ${name}`);
  alert(`⚠️ Unknown person detected on camera ${cameraId}. Snapshot sent via email.`);
}

// Example Simulation (optional demo)
// setTimeout(() => sendAlertEmail('Unknown', 'CAM-101'), 5000);
