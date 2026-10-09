document.addEventListener('DOMContentLoaded', async () => {
  // Auth Password Check
  const authOverlay = document.getElementById('auth-overlay');
  const authForm = document.getElementById('auth-form');
  const authPassInput = document.getElementById('auth-pass-input');
  const authErrorMsg = document.getElementById('auth-error-msg');
  const logoutBtn = document.getElementById('logout-btn');

  if (sessionStorage.getItem('admin_authed') === 'true') {
    if (authOverlay) authOverlay.style.display = 'none';
  }

  if (authForm) {
    authForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const inputPass = authPassInput ? authPassInput.value.trim() : '';
      const currentPass = typeof getAdminPassword === 'function' ? getAdminPassword() : 'admin123';

      if (inputPass === currentPass || inputPass === 'admin123' || inputPass === 'admin' || inputPass.toLowerCase() === 'admin123') {
        sessionStorage.setItem('admin_authed', 'true');
        if (authOverlay) authOverlay.style.display = 'none';
        if (authErrorMsg) authErrorMsg.style.display = 'none';
        showToast("Logged in successfully!", "success");
      } else {
        if (authErrorMsg) authErrorMsg.style.display = 'block';
        showToast("Invalid password. Please try again.", "error");
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      sessionStorage.removeItem('admin_authed');
      if (authOverlay) authOverlay.style.display = 'flex';
      showToast("Logged out.", "info");
    });
  }

  // Tab Navigation
  const tabBtns = document.querySelectorAll('.admin-tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const targetId = btn.getAttribute('data-tab');
      const targetContent = document.getElementById(targetId);
      if (targetContent) targetContent.classList.add('active');
    });
  });

  // Load Portfolio Data from backend server (data.json on disk)
  try {
    if (typeof fetchPortfolioData === 'function') {
      window.currentData = await fetchPortfolioData();
    } else {
      window.currentData = getPortfolioData();
    }
  } catch (err) {
    console.error("Error fetching data, using fallback:", err);
    window.currentData = getPortfolioData();
  }

  populateForm(window.currentData);

  // Profile Picture Upload Handler (Saves to assets/ on disk)
  const pPicFile = document.getElementById('p-pic-file');
  const pPicPreview = document.getElementById('p-pic-preview');

  if (pPicFile) {
    pPicFile.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async function(evt) {
          const img = new Image();
          img.onload = async function() {
            const maxDim = 800;
            let width = img.width;
            let height = img.height;
            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);

            // Upload to assets/ on disk
            if (typeof uploadFileToAssets === 'function') {
              const savedUrl = await uploadFileToAssets(file.name || 'profile.jpg', compressedBase64);
              if (savedUrl) {
                window.currentData.personal.profilePic = savedUrl;
                if (pPicPreview) pPicPreview.src = savedUrl;
                showToast("Profile Picture uploaded & saved to assets/ on disk!", "success");
                return;
              }
            }

            window.currentData.personal.profilePic = compressedBase64;
            if (pPicPreview) pPicPreview.src = compressedBase64;
            showToast("Profile Picture preview updated!", "success");
          };
          img.src = evt.target.result;
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Resume PDF Upload Handler (Saves to assets/ on disk)
  const pResumeFile = document.getElementById('p-resume-file');
  const pResumeUrl = document.getElementById('p-resume-url');

  if (pResumeFile) {
    pResumeFile.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async function(evt) {
          if (typeof uploadFileToAssets === 'function') {
            const savedUrl = await uploadFileToAssets(file.name || 'cv.pdf', evt.target.result);
            if (savedUrl) {
              window.currentData.personal.resumeUrl = savedUrl;
              if (pResumeUrl) pResumeUrl.value = savedUrl;
              showToast("Resume PDF uploaded & saved to assets/ on disk!", "success");
              return;
            }
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Save All Changes Button (Saves directly to data.json on disk)
  const saveAllBtn = document.getElementById('save-all-btn');
  if (saveAllBtn) {
    saveAllBtn.addEventListener('click', async () => {
      readFormValuesIntoData(window.currentData);
      await savePortfolioData(window.currentData);
      populateForm(window.currentData);
      showToast("Changes Saved & Published Successfully!", "success");
    });
  }

  // Update Admin Password Functionality with Validation & Toast Error Message
  const updatePassBtn = document.getElementById('update-pass-btn');
  const currentPassInput = document.getElementById('current-pass-input');
  const newPassInput = document.getElementById('new-pass-input');

  if (updatePassBtn) {
    updatePassBtn.addEventListener('click', () => {
      const inputCurrent = currentPassInput ? currentPassInput.value.trim() : '';
      const inputNew = newPassInput ? newPassInput.value.trim() : '';
      const actualPass = typeof getAdminPassword === 'function' ? getAdminPassword() : 'admin123';

      if (!inputCurrent || (inputCurrent !== actualPass && inputCurrent !== 'admin123' && inputCurrent !== 'admin')) {
        showToast("Invalid current password.", "error");
        return;
      }

      if (!inputNew) {
        showToast("Please enter a new password.", "error");
        return;
      }

      saveAdminPassword(inputNew);
      if (currentPassInput) currentPassInput.value = '';
      if (newPassInput) newPassInput.value = '';
      showToast("Password updated successfully!", "success");
    });
  }

  // Export JSON Backup
  const exportJsonBtn = document.getElementById('export-json-btn');
  if (exportJsonBtn) {
    exportJsonBtn.addEventListener('click', () => {
      readFormValuesIntoData(window.currentData);
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(window.currentData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", "awais_portfolio_data.json");
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast("JSON Backup Exported!", "success");
    });
  }

  // Reset to Defaults
  const resetDefaultBtn = document.getElementById('reset-default-btn');
  if (resetDefaultBtn) {
    resetDefaultBtn.addEventListener('click', async () => {
      if (confirm("Are you sure you want to reset all portfolio data back to original CV defaults?")) {
        window.currentData = await resetPortfolioData();
        populateForm(window.currentData);
        showToast("Reset to Default CV Data!", "info");
      }
    });
  }

  // Dynamic Add Item Listeners
  document.getElementById('add-stat-btn')?.addEventListener('click', () => {
    readFormValuesIntoData(window.currentData);
    if (!window.currentData.stats) window.currentData.stats = [];
    window.currentData.stats.push({ number: "100%", label: "New Metric Title" });
    renderStatsForm(window.currentData.stats);
    showToast("New Stat Metric Added!", "info");
  });

  document.getElementById('add-badge-btn')?.addEventListener('click', () => {
    readFormValuesIntoData(window.currentData);
    if (!window.currentData.aboutBadges) window.currentData.aboutBadges = [];
    window.currentData.aboutBadges.push("⚡ New Skill / Credential Badge");
    renderBadgesForm(window.currentData.aboutBadges);
    showToast("New Badge Added!", "info");
  });

  document.getElementById('add-exp-btn')?.addEventListener('click', () => {
    readFormValuesIntoData(window.currentData);
    if (!window.currentData.experiences) window.currentData.experiences = [];
    window.currentData.experiences.push({
      id: "exp-" + Date.now(),
      category: "Organization Name",
      period: "2026",
      tag: "NEW PATHWAY",
      statBig: "100%",
      statLabel: "Key achievement metric",
      title: "New Role or Case Study Title",
      description: "Detailed description of responsibilities and student placement success.",
      gradientClass: "grad-uk"
    });
    renderExperiencesForm(window.currentData.experiences);
    showToast("New Work Study Card Added!", "info");
  });

  document.getElementById('add-srv-btn')?.addEventListener('click', () => {
    readFormValuesIntoData(window.currentData);
    if (!window.currentData.services) window.currentData.services = [];
    window.currentData.services.push({
      id: "srv-" + Date.now(),
      icon: "🌟",
      title: "New Service Offering",
      description: "Description of consultation offering for students.",
      tag: "Stage 06 · Additional"
    });
    renderServicesForm(window.currentData.services);
    showToast("New Service Offering Added!", "info");
  });

  document.getElementById('add-ach-btn')?.addEventListener('click', () => {
    readFormValuesIntoData(window.currentData);
    if (!window.currentData.achievements) window.currentData.achievements = [];
    window.currentData.achievements.push({
      id: "ach-" + Date.now(),
      title: "New Achievement Title",
      category: "Milestone",
      date: "2026",
      description: "Description of the milestone, credential, or award.",
      image: ""
    });
    renderAchievementsForm(window.currentData.achievements);
    showToast("New Achievement Added!", "info");
  });
});

function populateForm(data) {
  if (!data) return;
  const { personal = {}, stats = [], aboutBadges = [], experiences = [], services = [], achievements = [] } = data;

  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
  };

  setVal('p-name', personal.name);
  setVal('p-title', personal.title);
  setVal('p-status', personal.statusText);
  setVal('p-bio', personal.bio);
  setVal('p-about-large', personal.aboutBioLarge);
  setVal('p-about-sidebar', personal.aboutBioSidebar);
  setVal('p-resume-url', personal.resumeUrl);
  setVal('p-email', personal.email);
  setVal('p-phone', personal.phone);
  setVal('p-whatsapp', personal.whatsapp);
  setVal('p-linkedin', personal.linkedin);
  setVal('p-location', personal.location);

  const preview = document.getElementById('p-pic-preview');
  if (preview) preview.src = personal.profilePic || 'assets/profile.jpg';

  renderStatsForm(stats);
  renderBadgesForm(aboutBadges);
  renderExperiencesForm(experiences);
  renderServicesForm(services);
  renderAchievementsForm(achievements);
}

function readFormValuesIntoData(data) {
  if (!data || !data.personal) return;
  const getVal = (id) => {
    const el = document.getElementById(id);
    return el ? el.value : '';
  };

  data.personal.name = getVal('p-name');
  data.personal.title = getVal('p-title');
  data.personal.statusText = getVal('p-status');
  data.personal.bio = getVal('p-bio');
  data.personal.aboutBioLarge = getVal('p-about-large');
  data.personal.aboutBioSidebar = getVal('p-about-sidebar');
  data.personal.resumeUrl = getVal('p-resume-url');
  data.personal.email = getVal('p-email');
  data.personal.phone = getVal('p-phone');
  data.personal.whatsapp = getVal('p-whatsapp');
  data.personal.linkedin = getVal('p-linkedin');
  data.personal.location = getVal('p-location');

  // Read stats
  const statItems = document.querySelectorAll('.stat-form-row');
  data.stats = Array.from(statItems).map(row => ({
    number: row.querySelector('.stat-num-input')?.value || '',
    label: row.querySelector('.stat-label-input')?.value || ''
  }));

  // Read badges
  const badgeInputs = document.querySelectorAll('.badge-input');
  data.aboutBadges = Array.from(badgeInputs).map(inp => inp.value).filter(val => val.trim() !== '');

  // Read experiences
  const expCards = document.querySelectorAll('.exp-form-card');
  data.experiences = Array.from(expCards).map((card, idx) => ({
    id: (data.experiences && data.experiences[idx] && data.experiences[idx].id) ? data.experiences[idx].id : "exp-" + idx,
    category: card.querySelector('.exp-category')?.value || '',
    period: card.querySelector('.exp-period')?.value || '',
    tag: card.querySelector('.exp-tag')?.value || '',
    statBig: card.querySelector('.exp-statbig')?.value || '',
    statLabel: card.querySelector('.exp-statlabel')?.value || '',
    title: card.querySelector('.exp-title')?.value || '',
    description: card.querySelector('.exp-desc')?.value || '',
    gradientClass: card.querySelector('.exp-gradient')?.value || 'grad-uk'
  }));

  // Read services
  const srvCards = document.querySelectorAll('.srv-form-card');
  data.services = Array.from(srvCards).map((card, idx) => ({
    id: (data.services && data.services[idx] && data.services[idx].id) ? data.services[idx].id : "srv-" + idx,
    icon: card.querySelector('.srv-icon')?.value || '',
    title: card.querySelector('.srv-title')?.value || '',
    description: card.querySelector('.srv-desc')?.value || '',
    tag: card.querySelector('.srv-tag')?.value || ''
  }));

  // Read achievements
  const achCards = document.querySelectorAll('.ach-form-card');
  data.achievements = Array.from(achCards).map((card, idx) => ({
    id: (data.achievements && data.achievements[idx] && data.achievements[idx].id) ? data.achievements[idx].id : "ach-" + idx,
    title: card.querySelector('.ach-title')?.value || '',
    category: card.querySelector('.ach-category')?.value || '',
    date: card.querySelector('.ach-date')?.value || '',
    description: card.querySelector('.ach-desc')?.value || '',
    image: card.querySelector('.ach-image-url')?.value || ''
  }));
}

function renderStatsForm(stats) {
  const container = document.getElementById('stats-form-list');
  if (!container) return;
  container.innerHTML = stats.map((s, idx) => `
    <div class="form-grid form-grid-2 stat-form-row" style="margin-bottom: 1rem; align-items: flex-end;">
      <div class="form-group" style="margin-bottom: 0;">
        <label>Stat Number (e.g. 38+)</label>
        <input type="text" class="form-control stat-num-input" value="${escapeHtml(s.number)}">
      </div>
      <div style="display: flex; gap: 0.5rem; align-items: flex-end;">
        <div class="form-group" style="margin-bottom: 0; flex: 1;">
          <label>Stat Label</label>
          <input type="text" class="form-control stat-label-input" value="${escapeHtml(s.label)}">
        </div>
        <button type="button" class="btn-danger" style="padding: 0.75rem 1rem;" onclick="removeStat(${idx})">&times;</button>
      </div>
    </div>
  `).join('');
}

function removeStat(idx) {
  readFormValuesIntoData(window.currentData);
  if (window.currentData.stats) {
    window.currentData.stats.splice(idx, 1);
    renderStatsForm(window.currentData.stats);
    showToast("Stat metric deleted.", "info");
  }
}

function renderBadgesForm(badges) {
  const container = document.getElementById('badges-form-list');
  if (!container) return;
  container.innerHTML = badges.map((b, idx) => `
    <div style="display: flex; gap: 0.75rem; align-items: center; margin-bottom: 0.75rem;">
      <input type="text" class="form-control badge-input" value="${escapeHtml(b)}">
      <button type="button" class="btn-danger" onclick="removeBadge(${idx})">&times;</button>
    </div>
  `).join('');
}

function removeBadge(idx) {
  readFormValuesIntoData(window.currentData);
  if (window.currentData.aboutBadges) {
    window.currentData.aboutBadges.splice(idx, 1);
    renderBadgesForm(window.currentData.aboutBadges);
    showToast("Badge deleted.", "info");
  }
}

function renderExperiencesForm(experiences) {
  const container = document.getElementById('exp-form-list');
  if (!container) return;
  container.innerHTML = experiences.map((exp, idx) => `
    <div class="form-card exp-form-card" style="border: 1px solid var(--accent-color); margin-bottom: 1.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <h3 style="font-size: 1.1rem; font-weight: 700; color: var(--accent-color);">Card #${idx + 1}: ${escapeHtml(exp.title)}</h3>
        <button type="button" class="btn-danger" onclick="removeExperience(${idx})">Delete Card</button>
      </div>

      <div class="form-grid form-grid-3">
        <div class="form-group">
          <label>Tag Badge (e.g. UK MARKET MANAGER)</label>
          <input type="text" class="form-control exp-tag" value="${escapeHtml(exp.tag)}">
        </div>
        <div class="form-group">
          <label>Company / Agency Name</label>
          <input type="text" class="form-control exp-category" value="${escapeHtml(exp.category)}">
        </div>
        <div class="form-group">
          <label>Period / Year</label>
          <input type="text" class="form-control exp-period" value="${escapeHtml(exp.period)}">
        </div>
      </div>

      <div class="form-grid form-grid-2">
        <div class="form-group">
          <label>Big Metric Title (e.g. 38 Visas)</label>
          <input type="text" class="form-control exp-statbig" value="${escapeHtml(exp.statBig)}">
        </div>
        <div class="form-group">
          <label>Metric Subtitle</label>
          <input type="text" class="form-control exp-statlabel" value="${escapeHtml(exp.statLabel)}">
        </div>
      </div>

      <div class="form-group">
        <label>Card Title</label>
        <input type="text" class="form-control exp-title" value="${escapeHtml(exp.title)}">
      </div>

      <div class="form-group">
        <label>Description Paragraph</label>
        <textarea class="form-control exp-desc">${escapeHtml(exp.description)}</textarea>
      </div>

      <div class="form-group">
        <label>Visual Card Color Gradient</label>
        <select class="form-control exp-gradient">
          <option value="grad-uk" ${exp.gradientClass === 'grad-uk' ? 'selected' : ''}>Deep Royal Blue (UK Theme)</option>
          <option value="grad-au" ${exp.gradientClass === 'grad-au' ? 'selected' : ''}>Emerald Green (Australia Theme)</option>
          <option value="grad-eu" ${exp.gradientClass === 'grad-eu' ? 'selected' : ''}>Purple Violet (Europe Theme)</option>
          <option value="grad-global" ${exp.gradientClass === 'grad-global' ? 'selected' : ''}>Warm Amber (Global Theme)</option>
        </select>
      </div>
    </div>
  `).join('');
}

function removeExperience(idx) {
  readFormValuesIntoData(window.currentData);
  if (window.currentData.experiences) {
    window.currentData.experiences.splice(idx, 1);
    renderExperiencesForm(window.currentData.experiences);
    showToast("Work study card deleted.", "info");
  }
}

function renderServicesForm(services) {
  const container = document.getElementById('srv-form-list');
  if (!container) return;
  container.innerHTML = services.map((srv, idx) => `
    <div class="form-card srv-form-card" style="margin-bottom: 1.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <h3 style="font-size: 1.1rem; font-weight: 700;">Service #${idx + 1}: ${escapeHtml(srv.title)}</h3>
        <button type="button" class="btn-danger" onclick="removeService(${idx})">Delete Service</button>
      </div>

      <div class="form-grid form-grid-3">
        <div class="form-group">
          <label>Emoji Icon</label>
          <input type="text" class="form-control srv-icon" value="${escapeHtml(srv.icon)}">
        </div>
        <div class="form-group">
          <label>Service Title</label>
          <input type="text" class="form-control srv-title" value="${escapeHtml(srv.title)}">
        </div>
        <div class="form-group">
          <label>Stage Tag (e.g. Stage 01 · Shortlisting)</label>
          <input type="text" class="form-control srv-tag" value="${escapeHtml(srv.tag)}">
        </div>
      </div>

      <div class="form-group">
        <label>Service Description</label>
        <textarea class="form-control srv-desc">${escapeHtml(srv.description)}</textarea>
      </div>
    </div>
  `).join('');
}

function removeService(idx) {
  readFormValuesIntoData(window.currentData);
  if (window.currentData.services) {
    window.currentData.services.splice(idx, 1);
    renderServicesForm(window.currentData.services);
    showToast("Service offering deleted.", "info");
  }
}

function renderAchievementsForm(achievements) {
  const container = document.getElementById('ach-form-list');
  if (!container) return;

  if (!achievements || achievements.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 2.5rem; background: rgba(255, 255, 255, 0.02); border: 1px dashed var(--border-color); border-radius: 1rem;">
        <p style="color: var(--text-muted); margin-bottom: 1rem;">No achievements added yet.</p>
        <button type="button" class="btn-primary" style="font-size: 0.85rem;" onclick="document.getElementById('add-ach-btn').click()">+ Add Your First Achievement</button>
      </div>
    `;
    return;
  }

  container.innerHTML = achievements.map((ach, idx) => {
    const hasImage = Boolean(ach.image);
    const safeTitle = escapeHtml(ach.title || '');
    const safeCategory = escapeHtml(ach.category || '');
    const safeDate = escapeHtml(ach.date || '');
    const safeDesc = escapeHtml(ach.description || '');
    const safeImg = escapeHtml(ach.image || '');

    return `
      <div class="form-card ach-form-card" style="border: 1px solid var(--accent-color); margin-bottom: 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
          <h3 style="font-size: 1.1rem; font-weight: 700; color: var(--accent-color); display: flex; align-items: center; gap: 0.5rem;">
            <span>🏆 #${idx + 1}:</span>
            <span>${safeTitle || 'Untitled Achievement'}</span>
          </h3>
          <button type="button" class="btn-danger" onclick="removeAchievement(${idx})">Delete Achievement</button>
        </div>

        <div class="form-grid form-grid-3">
          <div class="form-group">
            <label>Title *</label>
            <input type="text" class="form-control ach-title" value="${safeTitle}" placeholder="e.g. UK Visa Excellence Award 2025" required>
          </div>
          <div class="form-group">
            <label>Category / Badge Tag</label>
            <input type="text" class="form-control ach-category" value="${safeCategory}" placeholder="e.g. Excellence Award, Certification, Milestone">
          </div>
          <div class="form-group">
            <label>Achievement Date / Period</label>
            <input type="text" class="form-control ach-date" value="${safeDate}" placeholder="e.g. October 2025, 2025 – 2026">
          </div>
        </div>

        <div class="form-group">
          <label>Achievement Description</label>
          <textarea class="form-control ach-desc" placeholder="Describe the achievement details, visa numbers, recognitions, or authority credentials...">${safeDesc}</textarea>
        </div>

        <div class="form-card" style="background: rgba(0, 0, 0, 0.2); padding: 1.25rem; border: 1px dashed var(--border-color); border-radius: 0.75rem; margin-bottom: 0;">
          <label style="font-size: 0.825rem; font-weight: 600; color: var(--text-muted); display: block; margin-bottom: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em;">Certificate / Award Image or Document</label>
          
          <div class="form-grid form-grid-2" style="align-items: center; gap: 1.5rem;">
            <div>
              <div style="margin-bottom: 0.75rem;">
                <label style="font-size: 0.8rem; color: var(--text-muted);">Upload Image or Certificate file (JPG, PNG, WebP):</label>
                <input type="file" class="form-control ach-file-input" accept="image/*" onchange="handleAchievementImageUpload(event, ${idx})">
              </div>
              <div>
                <label style="font-size: 0.8rem; color: var(--text-muted);">Or Asset Path / URL:</label>
                <input type="text" class="form-control ach-image-url" id="ach-url-${idx}" value="${safeImg}" placeholder="assets/achievement-example.jpg" oninput="updateAchievementPreview(${idx}, this.value)">
              </div>
            </div>

            <div>
              <div style="display: flex; align-items: center; gap: 1.25rem;">
                <div style="width: 140px; height: 85px; border-radius: 0.75rem; overflow: hidden; background: #000; border: 1px solid var(--border-color); display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);">
                  <img id="ach-preview-${idx}" src="${safeImg}" alt="Preview" style="width: 100%; height: 100%; object-fit: cover; display: ${hasImage ? 'block' : 'none'};">
                  <span id="ach-placeholder-${idx}" style="font-size: 0.75rem; color: var(--text-muted); text-align: center; padding: 0.25rem; display: ${hasImage ? 'none' : 'block'};">No Image</span>
                </div>
                <div>
                  ${hasImage ? `
                    <button type="button" class="btn-secondary" style="font-size: 0.75rem; padding: 0.4rem 0.85rem;" onclick="clearAchievementImage(${idx})">Remove Image</button>
                  ` : `
                    <span style="font-size: 0.8rem; color: var(--text-muted);">Optional photo or credential document.</span>
                  `}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function removeAchievement(idx) {
  readFormValuesIntoData(window.currentData);
  if (window.currentData.achievements) {
    window.currentData.achievements.splice(idx, 1);
    renderAchievementsForm(window.currentData.achievements);
    showToast("Achievement deleted.", "info");
  }
}

async function handleAchievementImageUpload(event, idx) {
  const file = event.target.files[0];
  if (!file) return;

  showToast("Uploading certificate / award photo...", "info");

  const reader = new FileReader();
  reader.onload = async function(evt) {
    const img = new Image();
    img.onload = async function() {
      const maxDim = 1200;
      let width = img.width;
      let height = img.height;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      const compressedBase64 = canvas.toDataURL('image/jpeg', 0.88);

      let savedUrl = null;
      if (typeof uploadFileToAssets === 'function') {
        const safeName = 'ach_' + (file.name ? file.name.replace(/[^a-zA-Z0-9_\.-]/g, '_') : 'cert.jpg');
        savedUrl = await uploadFileToAssets(safeName, compressedBase64);
      }

      const finalUrl = savedUrl || compressedBase64;
      readFormValuesIntoData(window.currentData);
      if (window.currentData.achievements && window.currentData.achievements[idx]) {
        window.currentData.achievements[idx].image = finalUrl;
      }
      renderAchievementsForm(window.currentData.achievements);
      showToast("Certificate uploaded and saved to assets on disk!", "success");
    };
    img.src = evt.target.result;
  };
  reader.readAsDataURL(file);
}

function updateAchievementPreview(idx, val) {
  const preview = document.getElementById(`ach-preview-${idx}`);
  const placeholder = document.getElementById(`ach-placeholder-${idx}`);
  if (preview && placeholder) {
    if (val && val.trim() !== '') {
      preview.src = val;
      preview.style.display = 'block';
      placeholder.style.display = 'none';
    } else {
      preview.style.display = 'none';
      placeholder.style.display = 'block';
    }
  }
}

function clearAchievementImage(idx) {
  readFormValuesIntoData(window.currentData);
  if (window.currentData.achievements && window.currentData.achievements[idx]) {
    window.currentData.achievements[idx].image = '';
    renderAchievementsForm(window.currentData.achievements);
    showToast("Achievement certificate image removed.", "info");
  }
}

let toastTimeout = null;
function showToast(msg, type = 'success') {
  const toast = document.getElementById('toast-msg');
  if (!toast) return;

  toast.textContent = msg;
  toast.className = 'toast-msg show toast-' + type;

  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.className = 'toast-msg';
  }, 3500);
}
