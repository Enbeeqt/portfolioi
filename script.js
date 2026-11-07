// ---------- Phone menu ----------
const menuToggle = document.querySelector('.menu-toggle');
const mainNav = document.querySelector('.main-nav');

function setMenu(open) {
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
}

if (menuToggle && mainNav) {
  menuToggle.addEventListener('click', function () {
    setMenu(menuToggle.getAttribute('aria-expanded') !== 'true');
  });
  mainNav.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () { setMenu(false); });
  });
  // Keep this number one higher than the 960px breakpoint in style.css
  window.matchMedia('(min-width: 961px)').addEventListener('change', function (e) {
    if (e.matches) { setMenu(false); }
  });
}

// ---------- Footer year ----------
const yearEl = document.getElementById('year');
if (yearEl) { yearEl.textContent = new Date().getFullYear(); }

// ---------- Highlight the nav link for the section in view ----------
const navLinks = Array.from(document.querySelectorAll('.nav-list a'));
const sections = navLinks
  .map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); })
  .filter(Boolean);

let navLock = null;      // set while a clicked link is still scrolling to its section

function setActive(id) {
  if (navLock && id !== navLock) { return; }      // ignore sections passed on the way
  navLinks.forEach(function (a) {
    if (a.getAttribute('href') === '#' + id) { a.setAttribute('aria-current', 'true'); }
    else { a.removeAttribute('aria-current'); }
  });
}

if ('IntersectionObserver' in window && sections.length) {
  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) { setActive(entry.target.id); }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  sections.forEach(function (s) { observer.observe(s); });

  // At the very bottom, short sections may never reach the line
  window.addEventListener('scroll', function () {
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
      setActive(sections[sections.length - 1].id);
    }
  }, { passive: true });
}

// ---------- Background: plexus that crawls upward and fades out ----------
const plexBg = document.querySelector('.virus-bg');

if (plexBg) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  plexBg.appendChild(canvas);

  const ORANGE = '255, 106, 19';          // same orange as --orange in style.css
  const LINK = 150;                       // two dots closer than this get a line
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let w = 0, h = 0, dots = [];

  function rand(min, max) { return Math.random() * (max - min) + min; }

  // Each dot crawls a random distance, then fades out and is reborn near the bottom
  function respawn(d, anywhere) {
    d.travel = rand(200, 700);                         // its random length
    d.moved = anywhere ? rand(0, d.travel) : 0;
    d.x = rand(0, w);
    d.y = anywhere ? rand(0, h) : rand(h, h + 60);
    d.vx = rand(-0.12, 0.12);
    d.vy = -rand(0.15, 0.4);                           // slow crawl upward
  }

  function build() {
    const count = Math.max(18, Math.min(70, Math.round(w * h / 22000)));   // never crowded
    dots = [];
    for (let i = 0; i < count; i++) {
      const d = {};
      respawn(d, true);
      dots.push(d);
    }
  }

  function setSize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function step() {
    dots.forEach(function (d) {
      d.x += d.vx;
      d.y += d.vy;
      d.moved += Math.abs(d.vy);
      if (d.moved >= d.travel || d.y < -40) { respawn(d, false); }
    });
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);

    // Fade in over the first 60px of travel, fade out over the last 140px
    const alpha = dots.map(function (d) {
      return Math.max(0, Math.min(1, d.moved / 60, (d.travel - d.moved) / 140));
    });

    ctx.lineWidth = 1;
    for (let i = 0; i < dots.length; i++) {
      for (let j = i + 1; j < dots.length; j++) {
        const dx = dots[i].x - dots[j].x, dy = dots[i].y - dots[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < LINK) {
          const a = (1 - dist / LINK) * Math.min(alpha[i], alpha[j]) * 0.6;
          if (a > 0.01) {
            ctx.strokeStyle = 'rgba(' + ORANGE + ',' + a + ')';
            ctx.beginPath();
            ctx.moveTo(dots[i].x, dots[i].y);
            ctx.lineTo(dots[j].x, dots[j].y);
            ctx.stroke();
          }
        }
      }
    }

    dots.forEach(function (d, i) {
      ctx.fillStyle = 'rgba(' + ORANGE + ',' + (alpha[i] * 0.9) + ')';
      ctx.beginPath();
      ctx.arc(d.x, d.y, 2.4, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function frame() {
    step();
    draw();
    requestAnimationFrame(frame);
  }

  setSize();
  build();

  if (still) { draw(); } else { requestAnimationFrame(frame); }

  // Rebuild only when the width changes (phone address bars change the height)
  let lastWidth = window.innerWidth, timer;
  window.addEventListener('resize', function () {
    clearTimeout(timer);
    timer = setTimeout(function () {
      setSize();
      if (window.innerWidth !== lastWidth) {
        lastWidth = window.innerWidth;
        build();
        if (still) { draw(); }
      }
    }, 250);
  });
}

// ---------- Hero: plexus behind the photo, fading in at the corners ----------
const heroPhoto = document.querySelector('.hero-photo');

if (heroPhoto) {
  const PAD = 90;                            // how far the plexus reaches past the photo
  const ORANGE = '255, 106, 19';
  const WHITE = '255, 255, 255';
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function makeLayer(className) {
    const cv = document.createElement('canvas');
    cv.className = 'hero-canvas ' + className;
    cv.setAttribute('aria-hidden', 'true');
    heroPhoto.appendChild(cv);
    return { cv: cv, ctx: cv.getContext('2d') };
  }

  const back = makeLayer('hero-canvas-back');
  const front = makeLayer('hero-canvas-front');

  let size = 0, photo = 0, nodes = [], phase = 0, last = 0, running = false, cornerMask = null;

  function rand(min, max) { return Math.random() * (max - min) + min; }

  function build() {
    const rMin = photo * 0.3;
    const rMax = Math.min(photo * 0.5 + 90, size / 2 - 6);
    nodes = [];
    for (let i = 0; i < 28; i++) {
      nodes.push({
        r: rand(rMin, rMax),
        a: rand(0, Math.PI * 2),
        w: (Math.random() < 0.5 ? -1 : 1) * rand(0.15, 0.45),
        wob: rand(0, Math.PI * 2),
        white: i % 4 === 0
      });
    }
  }

  // Draws the network on one layer. The front layer is faded out except near the photo corners.
  function paint(layer, pts, onlyCorners) {
    const c = layer.ctx;
    const link = photo * 0.45;
    c.save();
    c.clearRect(0, 0, size, size);

    c.lineWidth = 1;
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < link) {
          c.strokeStyle = 'rgba(' + ORANGE + ',' + ((1 - d / link) * 0.75) + ')';
          c.beginPath();
          c.moveTo(pts[i].x, pts[i].y);
          c.lineTo(pts[j].x, pts[j].y);
          c.stroke();
        }
      }
    }
    pts.forEach(function (p) {
      c.fillStyle = 'rgba(' + (p.white ? WHITE : ORANGE) + ',0.95)';
      c.beginPath();
      c.arc(p.x, p.y, p.white ? 2.6 : 2.2, 0, Math.PI * 2);
      c.fill();
    });

    if (onlyCorners && cornerMask) {
      c.globalCompositeOperation = 'destination-in';
      c.drawImage(cornerMask, 0, 0, size, size);
    }
    c.restore();
  }

  function draw() {
    const half = size / 2;
    const pts = nodes.map(function (n) {
      const r = n.r + Math.sin(phase * 0.6 + n.wob) * 8;
      return { x: half + Math.cos(n.a) * r, y: half + Math.sin(n.a) * r, white: n.white };
    });
    paint(back, pts, false);
    paint(front, pts, true);
  }

  function frame(now) {
    if (!running) { return; }
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    phase += dt;
    nodes.forEach(function (n) { n.a += n.w * dt; });
    draw();
    requestAnimationFrame(frame);
  }

  function start() {
    if (running || still) { return; }
    running = true;
    last = performance.now();
    requestAnimationFrame(frame);
  }

  // The drawing size always matches the screen size, so it stays sharp
  function setSize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    photo = heroPhoto.clientWidth;
    size = photo + PAD * 2;
    [back, front].forEach(function (layer) {
      layer.cv.style.width = size + 'px';
      layer.cv.style.height = size + 'px';
      layer.cv.width = Math.round(size * dpr);
      layer.cv.height = Math.round(size * dpr);
      layer.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    });

    // Soft round fades centered on each photo corner
    cornerMask = document.createElement('canvas');
    cornerMask.width = cornerMask.height = Math.round(size);
    const m = cornerMask.getContext('2d');
    const R = photo * 0.17;                  // how far the front plexus reaches from a corner
    [[PAD, PAD], [PAD + photo, PAD], [PAD, PAD + photo], [PAD + photo, PAD + photo]].forEach(function (p) {
      const g = m.createRadialGradient(p[0], p[1], 0, p[0], p[1], R);
      g.addColorStop(0, 'rgba(0,0,0,1)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      m.fillStyle = g;
      m.fillRect(0, 0, size, size);
    });

    build();
    draw();
  }

  setSize();

  // Redraw whenever the photo changes size, for example after your pictures load
  if ('ResizeObserver' in window) {
    let lastWidth = 0;
    new ResizeObserver(function () {
      if (heroPhoto.clientWidth !== lastWidth) { lastWidth = heroPhoto.clientWidth; setSize(); }
    }).observe(heroPhoto);
  } else {
    window.addEventListener('resize', setSize);
  }

  // Only animate while the hero is on screen
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { start(); } else { running = false; }
    }).observe(heroPhoto);
  } else {
    start();
  }
}

// ---------- Show more / show fewer for long lists ----------
// Shows the first few cards, hides the rest behind a button that reveals them with a short animation
function collapseList(listSelector, visible, noun) {
  const list = document.querySelector(listSelector);
  if (!list) { return; }

  const items = Array.from(list.children);
  if (items.length <= visible) { return; }               // short lists need no button

  items.forEach(function (item, i) {
    if (i >= visible) {
      item.classList.add('is-extra');
      item.style.setProperty('--i', Math.min(i - visible, 8));   // staggered entrance
    }
  });

  list.id = list.id || noun + '-list';
  list.classList.add('is-collapsed');

  const wrap = document.createElement('div');
  const btn = document.createElement('button');
  wrap.className = 'show-more';
  btn.type = 'button';
  btn.className = 'show-more-btn';
  btn.setAttribute('aria-controls', list.id);

  function setOpen(open) {
    btn.setAttribute('aria-expanded', String(open));
    btn.textContent = open ? 'Show fewer ' + noun : 'Show all ' + items.length + ' ' + noun;
    list.classList.toggle('is-collapsed', !open);
  }

  btn.addEventListener('click', function () {
    const open = btn.getAttribute('aria-expanded') !== 'true';
    setOpen(open);
    if (!open) {                                          // glide back to the section's top
      list.closest('section').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  setOpen(false);
  wrap.appendChild(btn);
  list.after(wrap);
}

collapseList('.cert-grid', 4, 'certificates');
collapseList('.project-grid', 3, 'projects');

// ---------- Certificates: click to view, with previous / next ----------
const certList = Array.from(document.querySelectorAll('.cert-grid .cert-card'));

if (certList.length && typeof HTMLDialogElement === 'function') {

  function cardText(card, selector) {
    const el = card.querySelector(selector);
    return el ? el.textContent.trim() : '';
  }

  // Build the viewer once and keep it hidden until a card is clicked
  const viewer = document.createElement('dialog');
  viewer.className = 'cert-viewer';
  viewer.setAttribute('aria-label', 'Certificate viewer');
  viewer.innerHTML =
    '<div class="viewer-panel">' +
      '<button class="viewer-close" type="button" aria-label="Close viewer">&times;</button>' +
      '<div class="viewer-stage">' +
        '<img class="viewer-img" src="" alt="">' +
        '<p class="viewer-count" aria-live="polite"></p>' +
        '<button class="viewer-nav viewer-prev" type="button" aria-label="Previous certificate">&lsaquo;</button>' +
        '<button class="viewer-nav viewer-next" type="button" aria-label="Next certificate">&rsaquo;</button>' +
      '</div>' +
      '<div class="viewer-info">' +
        '<h3 class="viewer-title"></h3>' +
        '<p class="viewer-issuer"></p>' +
        '<p class="viewer-date"></p>' +
      '</div>' +
    '</div>';
  document.body.appendChild(viewer);

  const viewStage = viewer.querySelector('.viewer-stage');
  const viewImg = viewer.querySelector('.viewer-img');
  const viewCount = viewer.querySelector('.viewer-count');
  const prevBtn = viewer.querySelector('.viewer-prev');
  const nextBtn = viewer.querySelector('.viewer-next');
  let current = 0;

  // A bigger file if the card has data-full="...", otherwise the card's own image
  function fullSrc(card) {
    const img = card.querySelector('img');
    return card.dataset.full || img.currentSrc || img.src;
  }

  function showCert(index) {
    current = (index + certList.length) % certList.length;     // wraps around at both ends
    const card = certList[current];

    viewImg.src = fullSrc(card);
    viewImg.alt = card.querySelector('img').alt;
    viewer.querySelector('.viewer-title').textContent = cardText(card, '.cert-info h3');
    viewer.querySelector('.viewer-issuer').textContent = cardText(card, '.cert-issuer');
    viewer.querySelector('.viewer-date').textContent = cardText(card, '.cert-date');
    viewCount.textContent = (current + 1) + ' / ' + certList.length;

    // Load the neighbors now so the next click feels instant
    [current - 1, current + 1].forEach(function (i) {
      new Image().src = fullSrc(certList[(i + certList.length) % certList.length]);
    });
  }

  function step(direction) { showCert(current + direction); }

  if (certList.length < 2) {
    prevBtn.hidden = true;
    nextBtn.hidden = true;
    viewCount.hidden = true;
  }

  prevBtn.addEventListener('click', function () { step(-1); });
  nextBtn.addEventListener('click', function () { step(1); });

  // Left and right arrow keys while the viewer is open
  viewer.addEventListener('keydown', function (event) {
    if (certList.length < 2) { return; }
    if (event.key === 'ArrowLeft')  { event.preventDefault(); step(-1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); step(1); }
  });

  // Swipe left or right on a phone
  let touchStartX = null;
  viewStage.addEventListener('touchstart', function (event) {
    touchStartX = event.changedTouches[0].clientX;
  }, { passive: true });
  viewStage.addEventListener('touchend', function (event) {
    if (touchStartX === null || certList.length < 2) { return; }
    const distance = event.changedTouches[0].clientX - touchStartX;
    touchStartX = null;
    if (Math.abs(distance) > 50) { step(distance < 0 ? 1 : -1); }
  }, { passive: true });

  // Make every card reachable with the keyboard and open on click or Enter
  certList.forEach(function (card) {
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', 'View ' + cardText(card, '.cert-info h3'));
    card.addEventListener('click', function () {
      showCert(certList.indexOf(card));
      viewer.showModal();
    });
    card.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        card.click();
      }
    });
  });

  // Close with the X button or by clicking the dark area outside the panel
  viewer.querySelector('.viewer-close').addEventListener('click', function () { viewer.close(); });
  viewer.addEventListener('click', function (event) {
    if (event.target === viewer) { viewer.close(); }
  });
}

// ---------- Cursor light: orange glow in the background and on the glass ----------
(function () {
  const bg = document.querySelector('.virus-bg');
  const panels = Array.from(document.querySelectorAll(
    '.hero-inner, .about-inner, .skill-group, .skill-card, .project-card, .cert-card, .timeline-item, .contact-card'
  ));

  // Touch screens have no pointer to follow
  if (!bg || !window.matchMedia('(hover: hover)').matches) { return; }

  const REACH = 220;                    // panels farther than this from the pointer are skipped
  let x = -9999, y = -9999, queued = false;

  function paint() {
    queued = false;
    bg.style.setProperty('--mx', x + 'px');
    bg.style.setProperty('--my', y + 'px');

    panels.forEach(function (p) {
      const r = p.getBoundingClientRect();
      const near = r.bottom > y - REACH && r.top < y + REACH && r.right > x - REACH && r.left < x + REACH;
      p.style.setProperty('--px', near ? (x - r.left) + 'px' : '-999px');
      p.style.setProperty('--py', near ? (y - r.top) + 'px' : '-999px');
    });
  }

  function queue() {
    if (!queued) { queued = true; requestAnimationFrame(paint); }
  }

  document.addEventListener('pointermove', function (event) {
    if (event.pointerType === 'touch') { return; }
    x = event.clientX;
    y = event.clientY;
    queue();
  }, { passive: true });

  // Scrolling moves panels under a still pointer, so update then too
  window.addEventListener('scroll', queue, { passive: true });

  // Switch the light off when the pointer leaves the window
  document.documentElement.addEventListener('pointerleave', function () {
    x = y = -9999;
    queue();
  });
})();

// ---------- Navigation: sliding block ----------
(function () {
  const nav = document.querySelector('.main-nav');
  const list = document.querySelector('.nav-list');
  if (!nav || !list) { return; }

  const links = Array.from(list.querySelectorAll('a'));
  const pill = document.createElement('span');
  let hovered = null;                        // the link under the pointer or keyboard focus

  pill.className = 'nav-pill';
  pill.setAttribute('aria-hidden', 'true');
  nav.prepend(pill);
  list.classList.add('has-pill');

  function currentLink() {
    return links.find(function (a) { return a.getAttribute('aria-current') === 'true'; }) || null;
  }

  // Slide the block over one link (or hide it when there is nothing to show)
  function place(target) {
    links.forEach(function (a) { a.classList.toggle('is-lit', a === target); });

    if (!target || !target.offsetWidth) { pill.style.opacity = '0'; return; }

    const n = nav.getBoundingClientRect();
    const r = target.getBoundingClientRect();
    // When the box appears again, it jumps to the link instead of sliding in from its old spot
    const wasHidden = pill.style.opacity !== '1';
    if (wasHidden) { pill.classList.remove('is-ready'); }

    pill.style.width = r.width + 'px';
    pill.style.height = r.height + 'px';
    pill.style.transform = 'translate(' + (r.left - n.left + nav.scrollLeft) + 'px,' +
                                          (r.top - n.top + nav.scrollTop) + 'px)';
    pill.style.opacity = '1';

    if (wasHidden) {
      void pill.offsetWidth;                 // apply the jump before turning the glide back on
      requestAnimationFrame(function () { pill.classList.add('is-ready'); });
    }
  }

  function rest() { place(hovered); }          // no hover: the box hides, the underline shows the section

  let clicked = null;                        // after a click, only the underline shows until the pointer moves away

  links.forEach(function (a) {
    a.addEventListener('mouseenter', function () {
      if (a === clicked) { return; }
      hovered = a; place(a);
    });
    a.addEventListener('mouseleave', function () { if (clicked === a) { clicked = null; } });
    a.addEventListener('focus', function () {
      if (a === clicked) { return; }
      hovered = a; place(a);
    });
    a.addEventListener('blur', function () { hovered = null; rest(); });
    a.addEventListener('click', function () { clicked = a; hovered = null; rest(); });
  });
  nav.addEventListener('mouseleave', function () { hovered = null; clicked = null; rest(); });

  // Settle on the new section whenever the scroll highlight changes
  new MutationObserver(rest).observe(list, { attributes: true, attributeFilter: ['aria-current'], subtree: true });

  // Re-measure when the nav changes size (window resize, phone menu opening, fonts loading)
  if ('ResizeObserver' in window) { new ResizeObserver(rest).observe(nav); }
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(rest); }
  rest();
})();

// ---------- Header: scroll progress line ----------
(function () {
  const header = document.querySelector('.site-header');
  if (!header) { return; }

  const bar = document.createElement('div');
  let queued = false;
  bar.className = 'scroll-progress';
  bar.setAttribute('aria-hidden', 'true');
  header.appendChild(bar);

  function update() {
    queued = false;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
    bar.style.transform = 'scaleX(' + p + ')';
  }

  function queue() {
    if (!queued) { queued = true; requestAnimationFrame(update); }
  }

  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue);
  update();
})();

// ---------- Navigation: go straight to the clicked link ----------
// While the page glides to a section, the block ignores the sections it passes on the way
(function () {
  let unlockTimer;

  function scheduleUnlock() {
    clearTimeout(unlockTimer);
    unlockTimer = setTimeout(function () { navLock = null; }, 200);   // 200ms after scrolling stops
  }

  document.querySelectorAll('.nav-list a').forEach(function (a) {
    a.addEventListener('click', function () {
      navLock = a.getAttribute('href').slice(1);
      setActive(navLock);
      scheduleUnlock();
    });
  });

  window.addEventListener('scroll', function () {
    if (navLock) { scheduleUnlock(); }
  }, { passive: true });
})();

// ---------- Discourage casual inspecting ----------
// Keep this false while you're still building, or you'll lock yourself out.
// Change it to true right before you publish.
const PROTECT_SITE = false;

if (PROTECT_SITE) {
  // Block the right-click menu
  document.addEventListener('contextmenu', function (event) {
    event.preventDefault();
  });

  // Block the common developer-tool shortcuts
  document.addEventListener('keydown', function (event) {
    const key = event.key.toLowerCase();
    const ctrlOrCmd = event.ctrlKey || event.metaKey;

    const isDevToolsKey =
      event.key === 'F12' ||                                              // F12
      (ctrlOrCmd && event.shiftKey && ['i', 'j', 'c'].includes(key)) ||   // Ctrl+Shift+I / J / C
      (event.metaKey && event.altKey && ['i', 'j', 'c'].includes(key)) || // Mac: Cmd+Option+I / J / C
      (ctrlOrCmd && key === 'u');                                         // Ctrl+U (view source)

    if (isDevToolsKey) {
      event.preventDefault();
    }
  });
}
