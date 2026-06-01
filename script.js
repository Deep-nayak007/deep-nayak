const root = document.documentElement;

const raceOverlay = document.getElementById("raceOverlay");
const raceLights = Array.from(document.querySelectorAll(".race-light"));
const nav = document.getElementById("mainNav");
const menuBtn = document.getElementById("menuBtn");
const navLinks = document.getElementById("navLinks");
const navAnchors = Array.from(document.querySelectorAll("#navLinks a"));
const sections = Array.from(document.querySelectorAll("main section[id]"));
const revealTargets = Array.from(document.querySelectorAll(".anim-fade"));
const statValues = Array.from(document.querySelectorAll(".stat-value"));
const typedText = document.getElementById("typedText");
const yearNode = document.getElementById("year");
const scrollProgressBar = document.getElementById("scrollProgressBar");
const commandPalette = document.getElementById("commandPalette");
const commandTrigger = document.getElementById("commandTrigger");
const commandInput = document.getElementById("commandInput");
const commandList = document.getElementById("commandList");
const actionToast = document.getElementById("actionToast");

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const hasFinePointer = window.matchMedia("(pointer: fine)").matches;

if (yearNode) {
  yearNode.textContent = String(new Date().getFullYear());
}

setupNav();
setupCommandPalette();
setupRevealAnimations();
setupCounters();
setupTypingEffect();
setupPointerEffects();
startRaceSequence();
handleScroll();

window.addEventListener("scroll", handleScroll, { passive: true });
window.addEventListener("resize", () => {
  updateScrollProgress();
  highlightActiveLink();

  if (window.innerWidth > 860) {
    navLinks?.classList.remove("open");
    menuBtn?.setAttribute("aria-expanded", "false");
  }
});

function setupNav() {
  menuBtn?.addEventListener("click", () => {
    const isOpen = navLinks?.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", String(Boolean(isOpen)));
  });

  navAnchors.forEach((anchor) => {
    anchor.addEventListener("click", () => {
      navLinks?.classList.remove("open");
      menuBtn?.setAttribute("aria-expanded", "false");
    });
  });

  document.addEventListener("click", (event) => {
    if (!navLinks?.classList.contains("open")) return;
    if (event.target.closest("#mainNav")) return;

    navLinks.classList.remove("open");
    menuBtn?.setAttribute("aria-expanded", "false");
  });
}

function setupCommandPalette() {
  if (!commandPalette || !commandInput || !commandList) return;

  const commands = [
    {
      title: "Jump to About",
      desc: "Open driver profile section",
      key: "NAV",
      terms: "about profile sector 1 intro",
      action: () => scrollToSection("about")
    },
    {
      title: "Jump to Experience",
      desc: "View lap times and impact",
      key: "NAV",
      terms: "experience lap times work jobs",
      action: () => scrollToSection("experience")
    },
    {
      title: "Jump to Projects",
      desc: "Open constructor cards",
      key: "NAV",
      terms: "projects github portfolio work",
      action: () => scrollToSection("projects")
    },
    {
      title: "Jump to Skills",
      desc: "Open telemetry and frameworks",
      key: "NAV",
      terms: "skills telemetry framework languages",
      action: () => scrollToSection("skills")
    },
    {
      title: "Jump to Contact",
      desc: "Reach out for internship or co-op",
      key: "NAV",
      terms: "contact hire internship coop co-op",
      action: () => scrollToSection("contact")
    },
    {
      title: "Open Resume",
      desc: "Open resume PDF in a new tab",
      key: "FILE",
      terms: "resume cv download pdf",
      action: () => window.open("assets/Deep_Nayak_USA_Resume.pdf", "_blank", "noopener")
    },
    {
      title: "Copy Email",
      desc: "Copy deepnayakusa@gmail.com",
      key: "COPY",
      terms: "email mail copy deepnayakusa",
      action: () => copyText("deepnayakusa@gmail.com", "Email copied.")
    },
    {
      title: "Copy Phone",
      desc: "Copy +1 602-737-8629",
      key: "COPY",
      terms: "phone mobile call copy number",
      action: () => copyText("+16027378629", "Phone number copied.")
    },
    {
      title: "Open LinkedIn",
      desc: "Go to Deep's LinkedIn profile",
      key: "LINK",
      terms: "linkedin social profile",
      action: () => window.open("https://www.linkedin.com/in/deep-nayak", "_blank", "noopener")
    },
    {
      title: "Open GitHub",
      desc: "Go to Deep's GitHub profile",
      key: "LINK",
      terms: "github repositories profile code",
      action: () => window.open("https://github.com/Deep-nayak007", "_blank", "noopener")
    }
  ];

  let filtered = commands.slice();
  let activeIndex = 0;
  let isOpen = false;

  const render = () => {
    const query = commandInput.value.trim().toLowerCase();
    filtered = commands.filter((command) => {
      const haystack = `${command.title} ${command.desc} ${command.terms}`.toLowerCase();
      return haystack.includes(query);
    });

    activeIndex = Math.min(activeIndex, Math.max(filtered.length - 1, 0));

    commandList.innerHTML = "";

    if (!filtered.length) {
      const emptyNode = document.createElement("li");
      emptyNode.className = "command-empty";
      emptyNode.textContent = "No matching commands. Try contact, resume, projects, or email.";
      commandList.appendChild(emptyNode);
      return;
    }

    filtered.forEach((command, index) => {
      const item = document.createElement("li");
      item.className = "command-item";

      const button = document.createElement("button");
      button.type = "button";
      button.className = "command-item-btn";
      button.setAttribute("role", "option");
      button.setAttribute("aria-selected", String(index === activeIndex));

      if (index === activeIndex) {
        button.classList.add("active");
      }

      const main = document.createElement("span");
      main.className = "command-item-main";

      const title = document.createElement("span");
      title.className = "command-item-title";
      title.textContent = command.title;

      const desc = document.createElement("span");
      desc.className = "command-item-desc";
      desc.textContent = command.desc;

      const key = document.createElement("span");
      key.className = "command-item-key";
      key.textContent = command.key;

      main.append(title, desc);
      button.append(main, key);

      button.addEventListener("mouseenter", () => {
        activeIndex = index;
        syncActive();
      });

      button.addEventListener("click", () => {
        runCommand(command);
      });

      item.appendChild(button);
      commandList.appendChild(item);
    });
  };

  const syncActive = () => {
    const buttons = Array.from(commandList.querySelectorAll(".command-item-btn"));
    buttons.forEach((button, index) => {
      const selected = index === activeIndex;
      button.classList.toggle("active", selected);
      button.setAttribute("aria-selected", String(selected));
    });

    const activeButton = buttons[activeIndex];
    activeButton?.scrollIntoView({ block: "nearest" });
  };

  const open = () => {
    isOpen = true;
    commandPalette.classList.add("open");
    commandPalette.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    commandInput.value = "";
    activeIndex = 0;
    render();
    window.setTimeout(() => commandInput.focus(), 0);
  };

  const close = () => {
    isOpen = false;
    commandPalette.classList.remove("open");
    commandPalette.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  const toggle = () => {
    if (isOpen) {
      close();
      return;
    }
    open();
  };

  const runCommand = (command) => {
    close();
    command.action();
  };

  commandTrigger?.addEventListener("click", open);

  commandPalette.addEventListener("click", (event) => {
    if (event.target.matches("[data-close-palette]")) {
      close();
    }
  });

  commandInput.addEventListener("input", () => {
    activeIndex = 0;
    render();
  });

  commandInput.addEventListener("keydown", (event) => {
    if (!filtered.length) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      activeIndex = Math.min(activeIndex + 1, filtered.length - 1);
      syncActive();
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      activeIndex = Math.max(activeIndex - 1, 0);
      syncActive();
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      runCommand(filtered[activeIndex]);
    }
  });

  document.addEventListener("keydown", (event) => {
    const isCommandShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k";

    if (isCommandShortcut) {
      event.preventDefault();
      toggle();
      return;
    }

    if (!isOpen) return;

    if (event.key === "Escape") {
      event.preventDefault();
      close();
    }
  });

  function scrollToSection(id) {
    const node = document.getElementById(id);
    if (!node) return;

    node.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start"
    });
  }

  async function copyText(text, successMessage) {
    let copied = false;

    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        copied = true;
      } catch (error) {
        copied = false;
      }
    }

    if (!copied) {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "readonly");
      area.style.position = "fixed";
      area.style.left = "-9999px";
      document.body.appendChild(area);
      area.select();
      copied = document.execCommand("copy");
      area.remove();
    }

    showToast(copied ? successMessage : "Copy action not supported in this browser.");
  }

  let toastTimer = null;
  function showToast(message) {
    if (!actionToast) return;

    actionToast.textContent = message;
    actionToast.classList.add("show");

    if (toastTimer) {
      window.clearTimeout(toastTimer);
    }

    toastTimer = window.setTimeout(() => {
      actionToast.classList.remove("show");
    }, 2100);
  }
}

function setupRevealAnimations() {
  if (!revealTargets.length) return;

  if (!("IntersectionObserver" in window) || prefersReducedMotion) {
    revealTargets.forEach((node) => node.classList.add("visible"));
    return;
  }

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.16 }
  );

  revealTargets.forEach((node) => revealObserver.observe(node));
}

function setupCounters() {
  if (!statValues.length) return;

  if (!("IntersectionObserver" in window) || prefersReducedMotion) {
    statValues.forEach((node) => setCounterFinalValue(node));
    return;
  }

  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.45 }
  );

  statValues.forEach((node) => counterObserver.observe(node));
}

function animateCounter(node) {
  const target = Number.parseFloat(node.dataset.target || "0");
  const decimals = Number.parseInt(node.dataset.decimals || "0", 10);
  const suffix = node.dataset.suffix || "";

  if (!Number.isFinite(target)) {
    node.textContent = `0${suffix}`;
    return;
  }

  const durationMs = 1450;
  const start = performance.now();

  const tick = (now) => {
    const progress = Math.min(1, (now - start) / durationMs);
    const eased = 1 - Math.pow(1 - progress, 3);
    const currentValue = target * eased;

    node.textContent = `${formatValue(currentValue, decimals)}${suffix}`;

    if (progress < 1) {
      window.requestAnimationFrame(tick);
      return;
    }

    setCounterFinalValue(node);
  };

  window.requestAnimationFrame(tick);
}

function setCounterFinalValue(node) {
  const target = Number.parseFloat(node.dataset.target || "0");
  const decimals = Number.parseInt(node.dataset.decimals || "0", 10);
  const suffix = node.dataset.suffix || "";

  if (!Number.isFinite(target)) {
    node.textContent = `0${suffix}`;
    return;
  }

  node.textContent = `${formatValue(target, decimals)}${suffix}`;
}

function formatValue(value, decimals) {
  if (decimals > 0) {
    return value.toFixed(decimals);
  }

  return Math.round(value).toLocaleString("en-US");
}

function setupTypingEffect() {
  if (!typedText) return;

  const lines = [
    "M.S. Computer Science @ Arizona State University (4.0 GPA)",
    "Software Engineer focused on backend, cloud, and full-stack systems",
    "Open to Internship and Co-op opportunities | Immediate Joiner"
  ];

  if (prefersReducedMotion) {
    typedText.textContent = lines[0];
    return;
  }

  let lineIndex = 0;
  let charIndex = 0;
  let isDeleting = false;

  const step = () => {
    const activeLine = lines[lineIndex];

    if (!isDeleting) {
      charIndex += 1;
      typedText.textContent = activeLine.slice(0, charIndex);

      if (charIndex >= activeLine.length) {
        isDeleting = true;
        window.setTimeout(step, 1550);
        return;
      }

      window.setTimeout(step, 34 + Math.random() * 32);
      return;
    }

    charIndex -= 1;
    typedText.textContent = activeLine.slice(0, Math.max(charIndex, 0));

    if (charIndex <= 0) {
      isDeleting = false;
      lineIndex = (lineIndex + 1) % lines.length;
      window.setTimeout(step, 280);
      return;
    }

    window.setTimeout(step, 18 + Math.random() * 20);
  };

  window.setTimeout(step, 500);
}

function setupPointerEffects() {
  if (prefersReducedMotion || !hasFinePointer) return;

  document.body.classList.add("custom-cursor");

  const layer = document.createElement("div");
  layer.className = "pointer-fx-layer";

  const plus = document.createElement("span");
  plus.className = "pointer-plus";

  const dot = document.createElement("span");
  dot.className = "pointer-dot";

  layer.append(plus, dot);
  document.body.append(layer);

  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight / 2;
  let currentX = targetX;
  let currentY = targetY;

  const animatePointer = () => {
    currentX += (targetX - currentX) * 0.19;
    currentY += (targetY - currentY) * 0.19;

    const x = currentX.toFixed(2);
    const y = currentY.toFixed(2);

    plus.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
    dot.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;

    window.requestAnimationFrame(animatePointer);
  };

  animatePointer();

  window.addEventListener(
    "pointermove",
    (event) => {
      if (event.pointerType && event.pointerType !== "mouse") return;

      targetX = event.clientX;
      targetY = event.clientY;
      layer.classList.add("active");

      root.style.setProperty("--mouse-x", `${event.clientX}px`);
      root.style.setProperty("--mouse-y", `${event.clientY}px`);
    },
    { passive: true }
  );

  document.addEventListener("pointerdown", (event) => {
    if (event.pointerType && event.pointerType !== "mouse") return;
    if (event.button !== 0) return;

    createClickBurst(layer, event.clientX, event.clientY);
  });

  window.addEventListener("mouseout", (event) => {
    if (event.relatedTarget) return;
    layer.classList.remove("active");
  });

  window.addEventListener("blur", () => {
    layer.classList.remove("active");
  });
}

function createClickBurst(layer, x, y) {
  const burst = document.createElement("span");
  burst.className = "click-burst";
  burst.style.left = `${x}px`;
  burst.style.top = `${y}px`;

  const ring = document.createElement("span");
  ring.className = "click-ring";

  const flash = document.createElement("span");
  flash.className = "click-flash";

  burst.append(ring, flash);

  const shardCount = 9;
  for (let i = 0; i < shardCount; i += 1) {
    const shard = document.createElement("span");
    shard.className = "click-shard";

    const angle = (360 / shardCount) * i + (Math.random() * 16 - 8);
    const distance = 16 + Math.random() * 24;

    shard.style.setProperty("--angle", `${angle}deg`);
    shard.style.setProperty("--distance", `-${distance.toFixed(2)}px`);

    burst.appendChild(shard);
  }

  layer.appendChild(burst);
  window.setTimeout(() => burst.remove(), 760);
}

async function startRaceSequence() {
  if (!raceOverlay) return;

  if (prefersReducedMotion) {
    raceOverlay.remove();
    return;
  }

  await wait(400);

  for (const light of raceLights) {
    light.classList.add("on");
    await wait(210);
  }

  await wait(460);

  raceOverlay.classList.add("hidden");

  window.setTimeout(() => {
    raceOverlay.remove();
  }, 900);
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function handleScroll() {
  nav?.classList.toggle("scrolled", window.scrollY > 18);
  highlightActiveLink();
  updateScrollProgress();
}

function highlightActiveLink() {
  if (!sections.length || !navAnchors.length) return;

  const marker = window.scrollY + window.innerHeight * 0.35;
  let currentId = sections[0].id;

  sections.forEach((section) => {
    if (section.offsetTop <= marker) {
      currentId = section.id;
    }
  });

  if (currentId === "hero") {
    currentId = "about";
  }

  navAnchors.forEach((anchor) => {
    const hash = anchor.getAttribute("href");
    anchor.classList.toggle("active", hash === `#${currentId}`);
  });
}

function updateScrollProgress() {
  if (!scrollProgressBar) return;

  const doc = document.documentElement;
  const maxScrollable = doc.scrollHeight - window.innerHeight;
  const progress = maxScrollable > 0 ? window.scrollY / maxScrollable : 0;
  const clamped = Math.max(0, Math.min(progress, 1));

  scrollProgressBar.style.transform = `scaleX(${clamped.toFixed(4)})`;
}
