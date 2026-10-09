document.addEventListener('DOMContentLoaded', async () => {
  // Fetch real portfolio data.json from backend server on disk
  if (typeof fetchPortfolioData === 'function') {
    await fetchPortfolioData();
  }
  renderPortfolioFromData();

  // Listen for storage changes from Admin Panel
  window.addEventListener('storage', (e) => {
    if (!e.key || e.key === 'awais_portfolio_data') {
      renderPortfolioFromData();
    }
  });
  window.addEventListener('portfolioDataUpdated', renderPortfolioFromData);

  // Theme Toggle Functionality
  const themeToggleBtn = document.getElementById('theme-toggle');
  const htmlElement = document.documentElement;

  // Check saved theme or default to dark
  const savedTheme = localStorage.getItem('theme') || 'dark';
  htmlElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  themeToggleBtn.addEventListener('click', () => {
    const currentTheme = htmlElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    htmlElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
  });

  function updateThemeIcon(theme) {
    if (theme === 'dark') {
      themeToggleBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="4"></circle>
          <path d="M12 2v2"></path><path d="M12 20v2"></path>
          <path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path>
          <path d="M2 12h2"></path><path d="M20 12h2"></path>
          <path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path>
        </svg>`;
      themeToggleBtn.setAttribute('aria-label', 'Switch to light mode');
    } else {
      themeToggleBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
        </svg>`;
      themeToggleBtn.setAttribute('aria-label', 'Switch to dark mode');
    }
  }

  // Mobile Navigation Drawer Toggle
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileDrawer = document.getElementById('mobile-drawer');
  const drawerLinks = mobileDrawer.querySelectorAll('a');

  mobileMenuBtn.addEventListener('click', () => {
    mobileDrawer.classList.toggle('open');
  });

  drawerLinks.forEach(link => {
    link.addEventListener('click', () => {
      mobileDrawer.classList.remove('open');
    });
  });

  // Scroll Reveal Animations
  const reveals = document.querySelectorAll('.reveal');
  const observerOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  };

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  reveals.forEach(el => revealObserver.observe(el));

  // Horizontal Scroll Dragging for Carousel
  const carousel = document.querySelector('.carousel-container');
  if (carousel) {
    let isDown = false;
    let startX;
    let scrollLeft;

    carousel.addEventListener('mousedown', (e) => {
      isDown = true;
      startX = e.pageX - carousel.offsetLeft;
      scrollLeft = carousel.scrollLeft;
    });

    carousel.addEventListener('mouseleave', () => {
      isDown = false;
    });

    carousel.addEventListener('mouseup', () => {
      isDown = false;
    });

    carousel.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - carousel.offsetLeft;
      const walk = (x - startX) * 2;
      carousel.scrollLeft = scrollLeft - walk;
    });
  }

  // Image Lightbox Modal Event Listeners
  const imageModal = document.getElementById('image-modal');
  const modalBackdrop = document.getElementById('modal-backdrop');
  const modalClose = document.getElementById('modal-close');
  const portraitImgs = document.querySelectorAll('.portrait-img, .about-avatar-img');

  window.openLightboxModal = function(src, caption) {
    const modalImgElem = document.getElementById('modal-img-elem');
    const modalCaptionText = document.getElementById('modal-caption-text');
    if (imageModal && modalImgElem) {
      modalImgElem.src = src;
      if (modalCaptionText) modalCaptionText.textContent = caption || '';
      imageModal.classList.add('open');
      imageModal.setAttribute('aria-hidden', 'false');
    }
  };

  portraitImgs.forEach(img => {
    img.addEventListener('click', () => {
      window.openLightboxModal(img.src, img.alt || 'Awais Farooq — Study Abroad Consultant');
    });
  });

  const closeModal = () => {
    if (imageModal) {
      imageModal.classList.remove('open');
      imageModal.setAttribute('aria-hidden', 'true');
    }
  };

  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (modalBackdrop) modalBackdrop.addEventListener('click', closeModal);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && imageModal && imageModal.classList.contains('open')) {
      closeModal();
    }
  });
});

function renderPortfolioFromData() {
  if (typeof getPortfolioData !== 'function') return;
  const data = getPortfolioData();
  const { personal, stats, aboutBadges, experiences, services, achievements } = data;

  // Personal Info
  const heroNameMain = document.getElementById('hero-name-main');
  if (heroNameMain) heroNameMain.textContent = personal.name + '.';
  const footerName = document.getElementById('footer-name');
  if (footerName) footerName.textContent = personal.name;
  const aboutName = document.getElementById('about-name');
  if (aboutName) aboutName.textContent = personal.name;

  const heroTitleSub = document.getElementById('hero-title-sub');
  if (heroTitleSub) heroTitleSub.textContent = personal.title;
  const heroDesc = document.getElementById('hero-desc');
  if (heroDesc) heroDesc.textContent = personal.bio;
  const heroStatusSpan = document.getElementById('hero-status-span');
  if (heroStatusSpan && personal.statusText) heroStatusSpan.textContent = personal.statusText;

  const heroProfileImg = document.getElementById('hero-profile-img');
  if (heroProfileImg) heroProfileImg.src = personal.profilePic;
  const aboutAvatarImg = document.getElementById('about-avatar-img');
  if (aboutAvatarImg) aboutAvatarImg.src = personal.profilePic;
  const modalImgElem = document.getElementById('modal-img-elem');
  if (modalImgElem) modalImgElem.src = personal.profilePic;

  const resumeBtnHero = document.getElementById('resume-btn-hero');
  if (resumeBtnHero) resumeBtnHero.href = personal.resumeUrl;
  const resumeBtnAbout = document.getElementById('resume-btn-about');
  if (resumeBtnAbout) resumeBtnAbout.href = personal.resumeUrl;

  // Hero Stats Strip
  const statsContainer = document.getElementById('stats-strip-container');
  if (statsContainer && stats) {
    statsContainer.innerHTML = stats.map(s => `
      <div class="stat-item">
        <span class="stat-number font-display">${escapeHtml(s.number)}</span>
        <span class="stat-label">${escapeHtml(s.label)}</span>
      </div>
    `).join('');
  }

  // Work Experiences Grid
  const workGrid = document.getElementById('work-grid-container');
  if (workGrid && experiences) {
    workGrid.innerHTML = experiences.map(exp => `
      <div class="work-card reveal active">
        <div class="work-card-media ${escapeHtml(exp.gradientClass || 'grad-uk')}">
          <div class="card-frame">
            <div class="frame-header">
              <div class="frame-dots">
                <div class="frame-dot"></div>
                <div class="frame-dot"></div>
                <div class="frame-dot"></div>
              </div>
              <span class="frame-tag">${escapeHtml(exp.tag)}</span>
            </div>
            <div class="frame-body">
              <div class="frame-stat-big">${escapeHtml(exp.statBig)}</div>
              <div class="frame-stat-label">${escapeHtml(exp.statLabel)}</div>
            </div>
          </div>
        </div>
        <div class="work-meta">
          <div class="work-category">
            <span>${escapeHtml(exp.category)}</span>
            <span>${escapeHtml(exp.period)}</span>
          </div>
          <h3 class="work-title font-display">
            <span>${escapeHtml(exp.title)}</span>
            <svg class="work-title-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17L17 7M7 7h10v10"/></svg>
          </h3>
          <p class="work-desc">${escapeHtml(exp.description)}</p>
        </div>
      </div>
    `).join('');
  }

  // Services Carousel
  const servicesContainer = document.getElementById('services-carousel-container');
  if (servicesContainer && services) {
    servicesContainer.innerHTML = services.map(srv => `
      <div class="service-card">
        <div>
          <div class="service-icon-box">${escapeHtml(srv.icon)}</div>
          <h3 class="service-title font-display">${escapeHtml(srv.title)}</h3>
          <p class="service-desc">${escapeHtml(srv.description)}</p>
        </div>
        <span class="service-tag">${escapeHtml(srv.tag)}</span>
      </div>
    `).join('');
  }

  // Achievements Grid
  const achievementsGrid = document.getElementById('achievements-grid-container');
  if (achievementsGrid && achievements) {
    achievementsGrid.innerHTML = achievements.map(ach => {
      const hasImage = Boolean(ach.image);
      const safeImg = escapeHtml(ach.image || '');
      const safeTitle = escapeHtml(ach.title || '');
      const safeCat = escapeHtml(ach.category || 'Achievement');
      const safeDate = escapeHtml(ach.date || '');
      const safeDesc = escapeHtml(ach.description || '');
      const modalCaption = escapeHtml(`${ach.title || ''}${ach.date ? ' · ' + ach.date : ''}`);

      const mediaHtml = hasImage ? `
        <div class="achievement-media" onclick="openLightboxModal('${safeImg}', '${modalCaption}')">
          <img src="${safeImg}" alt="${safeTitle}" class="achievement-img" loading="lazy">
          <div class="achievement-zoom-overlay">
            <span class="achievement-zoom-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path><path d="M11 8v6M8 11h6"></path></svg>
              <span>View Credential</span>
            </span>
          </div>
        </div>
      ` : `
        <div class="achievement-placeholder-media">
          <span class="achievement-placeholder-icon">🏆</span>
          <span class="achievement-tag" style="font-size: 0.7rem;">${safeCat}</span>
        </div>
      `;

      return `
        <div class="achievement-card reveal active">
          ${mediaHtml}
          <div class="achievement-body">
            <div>
              <div class="achievement-header">
                <span class="achievement-tag">${safeCat}</span>
                ${safeDate ? `<span class="achievement-date"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>${safeDate}</span>` : ''}
              </div>
              <h3 class="achievement-title font-display">${safeTitle}</h3>
              <p class="achievement-desc">${safeDesc}</p>
            </div>
            ${hasImage ? `
              <div class="achievement-action-row">
                <button type="button" class="btn-achievement-view" onclick="openLightboxModal('${safeImg}', '${modalCaption}')">
                  <span>Enlarge Credential</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                </button>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  // About Section
  const aboutTextLarge = document.getElementById('about-text-large');
  if (aboutTextLarge && personal.aboutBioLarge) {
    aboutTextLarge.textContent = personal.aboutBioLarge;
  }
  const aboutSidebarText = document.getElementById('about-sidebar-text');
  if (aboutSidebarText && personal.aboutBioSidebar) {
    aboutSidebarText.textContent = personal.aboutBioSidebar;
  }

  const aboutBadgesContainer = document.getElementById('about-badges-container');
  if (aboutBadgesContainer && aboutBadges) {
    aboutBadgesContainer.innerHTML = aboutBadges.map(b => `
      <div class="badge-item">${escapeHtml(b)}</div>
    `).join('');
  }

  // Contact Footer
  const contactEmailLink = document.getElementById('contact-email-link');
  if (contactEmailLink) contactEmailLink.href = `mailto:${personal.email}`;
  const footerEmailVal = document.getElementById('footer-email-val');
  if (footerEmailVal) footerEmailVal.innerHTML = `<a href="mailto:${escapeHtml(personal.email)}">${escapeHtml(personal.email)}</a>`;

  const footerPhoneVal = document.getElementById('footer-phone-val');
  if (footerPhoneVal) footerPhoneVal.innerHTML = `<a href="${escapeHtml(personal.whatsapp)}" target="_blank" rel="noopener">${escapeHtml(personal.phone)}</a>`;

  const footerLinkedinVal = document.getElementById('footer-linkedin-val');
  if (footerLinkedinVal) footerLinkedinVal.innerHTML = `<a href="${escapeHtml(personal.linkedin)}" target="_blank" rel="noopener">${escapeHtml(personal.linkedinHandle || personal.linkedin)}</a>`;

  const footerLocationVal = document.getElementById('footer-location-val');
  if (footerLocationVal) footerLocationVal.textContent = personal.location;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
