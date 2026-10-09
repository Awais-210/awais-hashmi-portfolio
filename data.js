// Data Storage Module for Portfolio & Admin Panel
let cachedPortfolioData = null;

const STORAGE_KEY = "awais_portfolio_data";
const PASS_KEY = "awais_admin_pass";

// Async loader fetching real data.json from backend server or static Vercel host
async function fetchPortfolioData() {
  // Try /api/data (local Node server) first to get latest disk data
  try {
    const response = await fetch('/api/data');
    if (response.ok) {
      const data = await response.json();
      if (!data.achievements) {
        data.achievements = DEFAULT_PORTFOLIO_DATA.achievements || [];
      }
      cachedPortfolioData = data;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return data;
    }
  } catch (err) {}

  // Fallback to localStorage if user edited data offline
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (!parsed.achievements) {
        parsed.achievements = DEFAULT_PORTFOLIO_DATA.achievements || [];
      }
      cachedPortfolioData = parsed;
      return cachedPortfolioData;
    } catch (e) {}
  }

  // Fallback to /data.json (Vercel static deployment)
  try {
    const response = await fetch('/data.json');
    if (response.ok) {
      const data = await response.json();
      if (!data.achievements) {
        data.achievements = DEFAULT_PORTFOLIO_DATA.achievements || [];
      }
      cachedPortfolioData = data;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return data;
    }
  } catch (err) {}

  cachedPortfolioData = DEFAULT_PORTFOLIO_DATA;
  return DEFAULT_PORTFOLIO_DATA;
}

// Synchronous getter for quick rendering
function getPortfolioData() {
  let data = cachedPortfolioData;
  if (!data) {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        data = JSON.parse(saved);
      } catch (e) {}
    }
  }
  if (!data) {
    data = DEFAULT_PORTFOLIO_DATA;
  }
  if (!data.achievements) {
    data.achievements = (DEFAULT_PORTFOLIO_DATA && DEFAULT_PORTFOLIO_DATA.achievements) || [];
  }
  return data;
}

// Save updated portfolio data to localStorage and API if available
async function savePortfolioData(data) {
  cachedPortfolioData = data;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

  try {
    await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  } catch (err) {}

  window.dispatchEvent(new CustomEvent('portfolioDataUpdated'));
  return { success: true };
}

// Upload image or PDF file to assets/ directory on disk
async function uploadFileToAssets(fileName, fileBase64Data) {
  try {
    const response = await fetch('/api/upload-file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName, fileData: fileBase64Data })
    });
    if (response.ok) {
      const result = await response.json();
      return result.url;
    }
  } catch (err) {}
  return null;
}

async function resetPortfolioData() {
  localStorage.removeItem(STORAGE_KEY);
  cachedPortfolioData = DEFAULT_PORTFOLIO_DATA;
  await savePortfolioData(DEFAULT_PORTFOLIO_DATA);
  return DEFAULT_PORTFOLIO_DATA;
}

function getAdminPassword() {
  return localStorage.getItem(PASS_KEY) || "admin123";
}

function saveAdminPassword(newPass) {
  localStorage.setItem(PASS_KEY, newPass);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Default fallback data definition
const DEFAULT_PORTFOLIO_DATA = {
  personal: {
    name: "Awais Farooq",
    title: "Study Abroad Consultant & Sales Specialist.",
    statusText: "Available for Education Counselling & Advisory · Lahore, PK",
    bio: "Guiding Pakistani students to premier global destinations across the UK, Australia, Europe, New Zealand, Malaysia, and UAE. Delivering high-conversion admissions, CAS documentation, and 50+ visa approvals.",
    aboutBioLarge: "I'm Awais Farooq, a Study Abroad Consultant and Sales Specialist based in Lahore, Pakistan. Over the past 4+ years, I've guided prospective students to secure admissions and visas across the UK, Australia, Europe, New Zealand, Malaysia, and UAE.",
    aboutBioSidebar: "Skilled at identifying client needs, coordinating complex documentation, and matching prospective applicants with leading global universities. Combining consultative sales expertise with genuine care for student outcomes.",
    location: "Lahore, 54000, Pakistan",
    email: "awaix407@gmail.com",
    phone: "+92 321 5801268",
    whatsapp: "https://wa.me/923215801268",
    linkedin: "https://linkedin.com/in/awais-hashmi-aa2b48247",
    linkedinHandle: "awais-hashmi-aa2b48247",
    profilePic: "assets/profile.jpg",
    resumeUrl: "assets/Awais_Farooq_CV.pdf"
  },
  stats: [
    { number: "38+", label: "UK Visas (2025)" },
    { number: "19+", label: "Global Visas (2026 YTD)" },
    { number: "6", label: "Destinations" },
    { number: "100%", label: "CAS Guidance" }
  ],
  aboutBadges: [
    "📍 Lahore, Pakistan",
    "🎓 BBA (Hons) — University of Education",
    "🗣️ English (C2 Reading / C1 Spoken)",
    "⚡ 38 UK Visas Secured in 2025"
  ],
  experiences: [
    {
      id: "exp-1",
      category: "ABN Overseas Education",
      period: "2023 – Present",
      tag: "UK MARKET MANAGER",
      statBig: "38 Visas",
      statLabel: "Secured in 2025 (Avg 3 approved visas/mo) + 16 approvals in 2026",
      title: "UK Admissions & CAS Documentation Support",
      description: "End-to-end management of UK university applications, SOP preparation guidance, and CAS visa documentation for Pakistani students.",
      gradientClass: "grad-uk"
    },
    {
      id: "exp-2",
      category: "Higher Education",
      period: "Subclass 500",
      tag: "AUSTRALIA PATHWAYS",
      statBig: "Subclass 500",
      statLabel: "Genuine Temporary Entrant (GTE) & post-study work rights expertise",
      title: "Australian University & College Admissions",
      description: "Guiding students through GTE compliance, university shortlisting, financial documentation, and visa subclass 500 applications.",
      gradientClass: "grad-au"
    },
    {
      id: "exp-3",
      category: "KHM Consultancy",
      period: "2022 – 2023",
      tag: "EUROPE & SCHENGEN",
      statBig: "EU Admissions",
      statLabel: "Popular European destinations, scholarships & visa support",
      title: "Schengen & European Higher Education",
      description: "Advising prospective candidates on European university admissions, scholarship applications, and Schengen visa documentation.",
      gradientClass: "grad-eu"
    },
    {
      id: "exp-4",
      category: "Global Mobility",
      period: "Multi-Region",
      tag: "GLOBAL REGIONAL HUBS",
      statBig: "NZ · MY · UAE",
      statLabel: "Affordable study pathways, branch campuses & relocation guidance",
      title: "Malaysia, New Zealand & Dubai Pathways",
      description: "Facilitating admissions for UAE-based branch universities, affordable Malaysian institutions, and New Zealand UG/PG programs.",
      gradientClass: "grad-global"
    }
  ],
  services: [
    {
      id: "srv-1",
      icon: "🎓",
      title: "University & Course Selection",
      description: "Matching student profiles with accredited global universities based on budget, career goals, and post-study opportunities.",
      tag: "Stage 01 · Shortlisting"
    },
    {
      id: "srv-2",
      icon: "✍️",
      title: "SOP & Statement Mentorship",
      description: "Guiding students to draft compelling Statements of Purpose (SOPs) that stand out to university admissions committees.",
      tag: "Stage 02 · Applications"
    },
    {
      id: "srv-3",
      icon: "📋",
      title: "CAS & Visa Document Audit",
      description: "Thorough auditing of bank statements, sponsorship letters, CAS requirements, and visa compliance files.",
      tag: "Stage 03 · Verification"
    },
    {
      id: "srv-4",
      icon: "🗣️",
      title: "GTE & Visa Interview Prep",
      description: "Conducting simulated mock visa interviews and GTE assessment preparation for high-approval success rates.",
      tag: "Stage 04 · Interview Prep"
    },
    {
      id: "srv-5",
      icon: "✈️",
      title: "Pre-Departure Orientation",
      description: "Briefing families and students on airport formalities, accommodation, currency exchange, and post-arrival settlement.",
      tag: "Stage 05 · Departure"
    }
  ],
  achievements: [
    {
      id: "ach-1",
      title: "Top Study Abroad Consultant & UK Visa Excellence Award",
      category: "Excellence Award",
      date: "October 2025",
      description: "Recognized for outstanding achievement and exemplary 98% first-time visa approval rate across UK Tier 4 / Student Route applications.",
      image: "assets/achievement-uk-award.jpg"
    },
    {
      id: "ach-2",
      title: "Certified International Education Counselor & UK Agent Training",
      category: "Professional Certification",
      date: "October 2024",
      description: "Global Education Council accredited certification in UK higher education regulations, admissions compliance, and student advisory excellence.",
      image: "assets/achievement-bc-cert.jpg"
    },
    {
      id: "ach-3",
      title: "50+ Global Student Visas Milestone",
      category: "Career Milestone",
      date: "January 2026",
      description: "Milestone achievement celebrating over 50 successful student visa grants across UK, Australia Subclass 500, Europe, and regional hubs.",
      image: "assets/achievement-milestone.jpg"
    }
  ]
};
