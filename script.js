// ===== SpotAlert Frontend Script =====

// === Smooth Scroll for Internal Navigation ===
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    e.preventDefault();
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// === Plan Selection Logic ===
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
      alert('🚧 Coming soon!');
    }
  });
});

// === Dropdown Menu (Mobile Navigation) ===
const toggle = document.querySelector('.menu-toggle');
const dropdown = document.querySelector('.dropdown-menu');
if (toggle && dropdown) {
  toggle.addEventListener('click', () => {
    dropdown.classList.toggle('show');
  });

  document.addEventListener('click', e => {
    if (!dropdown.contains(e.target) && !toggle.contains(e.target)) {
      dropdown.classList.remove('show');
    }
  });
}

// === Frosted Header Shrink Effect ===
const header = document.querySelector('.frosted-header');
window.addEventListener('scroll', () => {
  if (!header) return;
  if (window.scrollY > 40) header.classList.add('shrink');
  else header.classList.remove('shrink');
});

// === Legacy Nav Shadow Support (Optional) ===
const legacyNav = document.querySelector('header.nav');
if (legacyNav) {
  window.addEventListener('scroll', () => {
    legacyNav.style.boxShadow = window.scrollY > 50
      ? '0 3px 8px rgba(0,0,0,0.1)'
      : 'none';
  });
}

// === Dashboard Redirection ===
const dashboardBtn = document.getElementById('dashboardBtn');
if (dashboardBtn) {
  dashboardBtn.addEventListener('click', () => {
    window.location.href = '/dashboard.html';
  });
}

// === Fake Email Alert Simulation (Frontend Demo Only) ===
function sendAlertEmail(name, cameraId) {
  console.log(`📸 Alert triggered for camera ${cameraId} by ${name}`);
  alert(`⚠️ Unknown person detected on camera ${cameraId}. Snapshot sent via email.`);
}

// === Hero Fade-In Animation ===
window.addEventListener('DOMContentLoaded', () => {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  const elements = hero.querySelectorAll('.hero-text, .hero-text h1, .hero-text p, .cta, .hero-img');
  elements.forEach((el, index) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 1s ease, transform 1s ease';
    setTimeout(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }, 300 + index * 200);
  });
});

// === Example Simulation (Optional for Demo) ===
// setTimeout(() => sendAlertEmail('Unknown', 'CAM-101'), 5000);


// =====================================================
// 🔗 Backend Connection Setup (Live API)
// =====================================================
const API_BASE_URL = 'http://100.25.104.193:3000'; // Live backend (AWS EC2)

// Example: Ping backend to verify connection is working
async function checkBackendStatus() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/status`);
    const data = await res.json();
    console.log('✅ SpotAlert backend connected:', data);
  } catch (err) {
    console.error('❌ Backend connection failed:', err);
  }
}

checkBackendStatus(); // Run on load
