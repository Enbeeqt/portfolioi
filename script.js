const DATA = {
  skills: [
    { title: "Front-end", level: 90, size: "span-2",
      items: ["HTML", "CSS", "JavaScript"] },
    { title: "Back-end", level: 70, items: ["Python", "C++", "Java", "C#"] },
    { title: "Tools", level: 80, items: ["Git", "Figma"] },
    { title: "Practices", level: 85, size: "span-2",
      items: ["Accessibility", "Responsive design", "Testing", "Performance", "Code review"] },
    { title: "Learning", level: 40, size: "span-2", items: ["WebGL", "Three.js", "Rust"] }
  ],

  projects: [
    { title: "PetiProg", size: "span-2", image: "images/project-1.svg",
      text: "An adventure educational maze game about python progamming.",
      tags: ["C#"], live: "#", code: "#" }
  ],

  certs: [
    { title: "AWS Certified Cloud Practitioner", image: "images/cert-1.svg",
      text: "Amazon Web Services · 2025", size: "span-2" },
    { title: "Meta Front-End Developer", image: "images/cert-2.svg",
      text: "Coursera · 2024" },
    { title: "1st Place, CodeJam Hackathon", image: "images/cert-3.svg",
      text: "Built an offline-first health app in 36 hours · 2025" }
  ],

  experience: [
    { role: "President - Junior Philippine Computer Society - DWCC Chapter", org: "Private College", when: "2026 – present",
      points: ["Grew membership from 30 to 101 students.", "Ran weekend webinars."] },
    { role: "Secretary - Junior Philippine Computer Society - DWCC Chapter", org: "Private College", when: "2025 – 2026",
      points: ["Processed and managed official letters for events and webinars."] }
  ]
};

/* ---------------- Rendering ---------------- */
const $ = (id) => document.getElementById(id);
const chips = (a) => a.map(t => `<span class="chip">${t}</span>`).join("");

$("skills-grid").innerHTML = DATA.skills.map(s => `
  <article class="glass tile ${s.size || ""}">
    <h3>${s.title}</h3>
    <div class="chips">${chips(s.items)}</div>
    <div class="bar" role="img" aria-label="${s.title} proficiency ${s.level}%"><i data-w="${s.level}"></i></div>
  </article>`).join("");

$("projects-grid").innerHTML = DATA.projects.map(p => `
  <article class="glass tile media ${p.size || ""}">
    <div class="img-wrap"><img src="${p.image}" alt="Screenshot of ${p.title}" loading="lazy"></div>
    <div class="body">
      <h3>${p.title}</h3><p>${p.text}</p>
      <div class="tags">${p.tags.map(t => `<span>${t}</span>`).join("")}</div>
      <div class="links"><a href="${p.live}">Live demo</a><a href="${p.code}">Source code</a></div>
    </div>
  </article>`).join("");

$("certs-grid").innerHTML = DATA.certs.map(c => `
  <article class="glass tile media ${c.size || ""}">
    <img src="${c.image}" alt="${c.title}" loading="lazy">
    <div class="body"><h3>${c.title}</h3><p>${c.text}</p></div>
  </article>`).join("");

$("exp-grid").innerHTML = DATA.experience.map(e => `
  <article class="glass tile exp ${e.size || ""}">
    <span class="when">${e.when}</span>
    <h3>${e.role}</h3><p>${e.org}</p>
    <ul>${e.points.map(p => `<li>${p}</li>`).join("")}</ul>
  </article>`).join("");

/* ---------------- Behaviour ---------------- */
$("year").textContent = new Date().getFullYear();

// Skill bars + stat counters animate once when scrolled into view
const io = new IntersectionObserver((entries) => {
  entries.forEach(({ target, isIntersecting }) => {
    if (!isIntersecting) return;
    if (target.dataset.w) target.style.width = target.dataset.w + "%";
    if (target.dataset.count) {
      const end = +target.dataset.count; let n = 0;
      const t = setInterval(() => { target.textContent = ++n; if (n >= end) clearInterval(t); }, 900 / end);
    }
    io.unobserve(target);
  });
}, { threshold: .4 });
document.querySelectorAll("[data-w],[data-count]").forEach(el => io.observe(el));

// Highlight the nav link of the section in view
const links = [...document.querySelectorAll(".nav nav a")];
const so = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) links.forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id));
  });
}, { rootMargin: "-45% 0px -50% 0px" });
document.querySelectorAll("main section").forEach(s => so.observe(s));

// Contact form (front-end validation only; connect to a service like Formspree to send)
$("contact-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const f = e.target, s = $("form-status");
  if (!f.name.value.trim() || !f.email.validity.valid || !f.message.value.trim()) {
    s.textContent = "Please fill in your name, a valid email and a message.";
    return;
  }
  s.textContent = "Thanks, " + f.name.value.trim() + ". Your message is ready to send once a form service is connected.";
  f.reset();
});
