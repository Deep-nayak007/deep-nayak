const root = document.documentElement;
const themeBtn = document.getElementById("themeBtn");
const menuBtn = document.getElementById("menuBtn");
const navLinks = document.getElementById("primaryNav");
const nav = document.getElementById("siteNav");
const sectionAnchors = Array.from(document.querySelectorAll("main section[id]"));
const links = Array.from(document.querySelectorAll(".nav-links a"));
const revealTargets = document.querySelectorAll(".reveal");
const tiltCards = document.querySelectorAll(".tilt-card");
const yearNode = document.getElementById("year");
const clickFxLayer = document.getElementById("clickFxLayer");
const scrollProgressBar = document.getElementById("scrollProgressBar");
const spotlightFx = document.getElementById("spotlightFx");

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isCoarsePointer = () => window.matchMedia("(pointer: coarse)").matches;

const preferredTheme = localStorage.getItem("theme");
if (preferredTheme === "light" || preferredTheme === "dark") {
  root.setAttribute("data-theme", preferredTheme);
}
setThemeLabel();

if (yearNode) {
  yearNode.textContent = String(new Date().getFullYear());
}

themeBtn?.addEventListener("click", () => {
  const current = root.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  root.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);
  setThemeLabel();
});

menuBtn?.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("open");
  menuBtn.setAttribute("aria-expanded", String(isOpen));
});

document.addEventListener("click", (event) => {
  if (!navLinks.classList.contains("open")) return;
  if (event.target.closest("#siteNav")) return;
  navLinks.classList.remove("open");
  menuBtn.setAttribute("aria-expanded", "false");
});

links.forEach((link) => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("open");
    menuBtn.setAttribute("aria-expanded", "false");
  });
});

window.addEventListener("scroll", handleScroll, { passive: true });
window.addEventListener("resize", updateScrollProgress);

if (clickFxLayer) {
  document.addEventListener("pointerdown", (event) => {
    if (prefersReducedMotion()) return;
    if (event.pointerType === "touch") return;
    if (event.button !== 0) return;

    const burst = document.createElement("span");
    burst.className = "click-burst";
    burst.style.left = `${event.clientX}px`;
    burst.style.top = `${event.clientY}px`;

    const core = document.createElement("span");
    core.className = "click-core";
    const halo = document.createElement("span");
    halo.className = "click-halo";
    const wave = document.createElement("span");
    wave.className = "click-wave";

    burst.appendChild(core);
    burst.appendChild(halo);
    burst.appendChild(wave);

    const sparkCount = 9;
    for (let i = 0; i < sparkCount; i += 1) {
      const spark = document.createElement("span");
      spark.className = "click-spark";

      const angle = (i / sparkCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.38;
      const distance = 26 + Math.random() * 30;

      spark.style.setProperty("--dx", `${(Math.cos(angle) * distance).toFixed(2)}px`);
      spark.style.setProperty("--dy", `${(Math.sin(angle) * distance).toFixed(2)}px`);
      spark.style.setProperty("--spark-rot", `${(angle * 180 / Math.PI).toFixed(2)}deg`);
      spark.style.setProperty("--spark-dur", `${(420 + Math.random() * 260).toFixed(0)}ms`);
      spark.style.setProperty("--spark-delay", `${(Math.random() * 35).toFixed(0)}ms`);

      burst.appendChild(spark);
    }

    clickFxLayer.appendChild(burst);

    window.setTimeout(() => {
      burst.remove();
    }, 920);
  });
}

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  revealTargets.forEach((item) => revealObserver.observe(item));
} else {
  revealTargets.forEach((item) => item.classList.add("visible"));
}

initAmbientSpotlight();
initMagneticTargets();

if (!isCoarsePointer()) {
  tiltCards.forEach((card) => {
    card.addEventListener("mousemove", (event) => {
      const rect = card.getBoundingClientRect();
      const relX = (event.clientX - rect.left) / rect.width - 0.5;
      const relY = (event.clientY - rect.top) / rect.height - 0.5;
      const rotateX = relY * -5;
      const rotateY = relX * 5;
      card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
    });
  });
}

handleScroll();
highlightActiveLink();
updateScrollProgress();

function handleScroll() {
  nav?.classList.toggle("scrolled", window.scrollY > 24);
  highlightActiveLink();
  updateScrollProgress();
}

function setThemeLabel() {
  const current = root.getAttribute("data-theme");
  if (themeBtn) {
    themeBtn.textContent = current === "dark" ? "Light" : "Dark";
  }
}

function initAmbientSpotlight() {
  if (!spotlightFx) return;
  if (prefersReducedMotion() || isCoarsePointer()) return;

  let targetX = window.innerWidth * 0.56;
  let targetY = window.innerHeight * 0.38;
  let currentX = targetX;
  let currentY = targetY;
  let currentX2 = window.innerWidth * 0.62;
  let currentY2 = window.innerHeight * 0.28;
  let rafId = 0;

  const setSpotVars = () => {
    currentX += (targetX - currentX) * 0.12;
    currentY += (targetY - currentY) * 0.12;

    currentX2 += (targetX + 120 - currentX2) * 0.08;
    currentY2 += (targetY - 80 - currentY2) * 0.08;

    root.style.setProperty("--spot-x", `${currentX.toFixed(1)}px`);
    root.style.setProperty("--spot-y", `${currentY.toFixed(1)}px`);
    root.style.setProperty("--spot-x-2", `${currentX2.toFixed(1)}px`);
    root.style.setProperty("--spot-y-2", `${currentY2.toFixed(1)}px`);

    rafId = window.requestAnimationFrame(setSpotVars);
  };

  const onPointerMove = (event) => {
    if (event.pointerType === "touch") return;
    targetX = event.clientX;
    targetY = event.clientY;
  };

  const resetSpotlight = () => {
    targetX = window.innerWidth * 0.56;
    targetY = window.innerHeight * 0.38;
  };

  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("pointerleave", resetSpotlight);
  window.addEventListener("mouseout", (event) => {
    if (!event.relatedTarget) resetSpotlight();
  });
  window.addEventListener("blur", resetSpotlight);
  window.addEventListener("resize", resetSpotlight);

  rafId = window.requestAnimationFrame(setSpotVars);

  window.addEventListener(
    "beforeunload",
    () => {
      window.cancelAnimationFrame(rafId);
    },
    { once: true }
  );
}

function initMagneticTargets() {
  if (prefersReducedMotion() || isCoarsePointer()) return;

  const targets = Array.from(
    document.querySelectorAll(".theme-btn, .nav-links a, .btn, .project-links a, .about-links a, .brand")
  );

  targets.forEach((target) => {
    target.classList.add("magnetic-target");

    const strength = target.classList.contains("btn") ? 8 : 6;

    const onMove = (event) => {
      const rect = target.getBoundingClientRect();
      const relX = (event.clientX - rect.left) / rect.width - 0.5;
      const relY = (event.clientY - rect.top) / rect.height - 0.5;

      target.style.setProperty("--mag-x", `${(relX * strength).toFixed(2)}px`);
      target.style.setProperty("--mag-y", `${(relY * strength).toFixed(2)}px`);
    };

    const reset = () => {
      target.style.setProperty("--mag-x", "0px");
      target.style.setProperty("--mag-y", "0px");
    };

    target.addEventListener("pointermove", onMove);
    target.addEventListener("pointerleave", reset);
    target.addEventListener("blur", reset);
  });
}

function updateScrollProgress() {
  if (!scrollProgressBar) return;

  const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0;
  const clamped = Math.max(0, Math.min(1, progress));

  scrollProgressBar.style.transform = `scaleX(${clamped.toFixed(4)})`;
}

function highlightActiveLink() {
  const marker = window.scrollY + window.innerHeight * 0.35;
  let activeId = "";

  for (const section of sectionAnchors) {
    if (marker >= section.offsetTop) {
      activeId = section.id;
    }
  }

  links.forEach((link) => {
    const isActive = link.getAttribute("href") === `#${activeId}`;
    link.classList.toggle("active", isActive);
  });
}
