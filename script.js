/* ==========================================================
   Emrullah Yaprak — kişisel tanıtım sitesi
   Bu dosya <head> içinde yüklenir: "js" sınıfı sayfa çizilmeden
   eklenir, kalan her şey DOM hazır olunca kurulur.
   ========================================================== */

// Belirme animasyonu ve menü stilleri yalnızca JavaScript çalışıyorsa devreye girer
document.documentElement.classList.add("js");

const MOBILE_QUERY = "(max-width: 760px)";
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

document.addEventListener("DOMContentLoaded", () => {
  initMenu();
  initHeaderState();
  initActiveLink();
  initReveal();
  initFaq();
  initSpotlight();
  initImageFallbacks();
  initCopyEmail();
  initYear();
});

/* ---------- Telefonda açılır menü ---------- */

function initMenu() {
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.getElementById("ana-menu");
  if (!toggle || !nav) return;

  const label = toggle.querySelector(".visually-hidden");
  const isOpen = () => toggle.getAttribute("aria-expanded") === "true";

  function setOpen(open) {
    toggle.setAttribute("aria-expanded", String(open));
    nav.classList.toggle("is-open", open);
    label.textContent = open ? "Menüyü kapat" : "Menüyü aç";
  }

  toggle.addEventListener("click", () => setOpen(!isOpen()));

  // Bir bölüme gidilince menü kapanır; kaydırmayı CSS'teki scroll-behavior yapar
  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) setOpen(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isOpen()) {
      setOpen(false);
      toggle.focus();
    }
  });

  document.addEventListener("click", (event) => {
    if (isOpen() && !event.target.closest(".site-header")) setOpen(false);
  });

  // Ekran masaüstü genişliğine çıkarsa açık kalan menü sıfırlanır
  window.matchMedia(MOBILE_QUERY).addEventListener("change", () => setOpen(false));
}

/* ---------- Kaydırınca üst menünün alt çizgisi ve okuma çubuğu ---------- */

function initHeaderState() {
  const header = document.querySelector(".site-header");
  if (!header) return;

  const progress = header.querySelector(".scroll-progress");
  let frame = 0;

  const update = () => {
    frame = 0;
    header.classList.toggle("is-scrolled", window.scrollY > 8);
    if (progress) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
      progress.style.setProperty("--progress", ratio.toFixed(4));
    }
  };

  update();
  // Kaydırma olayı çok sık gelir; her karede en fazla bir kez güncellenir
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
}

/* ---------- Menüde bulunulan bölümü vurgulama ---------- */

function initActiveLink() {
  const links = [...document.querySelectorAll(".site-nav a[href^='#']")];
  const linkById = new Map(links.map((link) => [link.hash.slice(1), link]));
  const sections = [document.getElementById("giris"), ...[...linkById.keys()].map((id) => document.getElementById(id))]
    .filter(Boolean);

  if (!("IntersectionObserver" in window) || sections.length === 0) return;

  function setActive(id) {
    links.forEach((link) => {
      const active = link === linkById.get(id);
      link.classList.toggle("is-active", active);
      if (active) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
  }

  // Ekranın ortasındaki ince şerit hangi bölümün üstündeyse o bölüm aktif sayılır
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );

  sections.forEach((section) => observer.observe(section));
}

/* ---------- Kaydırdıkça bölümlerin belirmesi ---------- */

function initReveal() {
  const items = document.querySelectorAll(".reveal");

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    items.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  // Aynı kapsayıcıdaki öğeler sırayla, kısa aralıklarla belirir
  items.forEach((item) => {
    const siblings = [...item.parentElement.children].filter((el) => el.classList.contains("reveal"));
    const index = Math.min(siblings.indexOf(item), 5);
    const delay = item.dataset.revealDelay ?? index * 80;
    item.style.setProperty("--reveal-delay", `${delay}ms`);
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
  );

  items.forEach((item) => observer.observe(item));
}

/* ---------- Sık sorulan sorular ---------- */

function initFaq() {
  document.querySelectorAll(".faq-question").forEach((button) => {
    button.addEventListener("click", () => {
      const open = button.getAttribute("aria-expanded") !== "true";
      button.setAttribute("aria-expanded", String(open));
      button.closest(".faq-item").classList.toggle("is-open", open);
    });
  });
}

/* ---------- Kartlarda imleci izleyen parıltı ---------- */

function initSpotlight() {
  // Dokunmatik ekranlarda imleç olmadığı için kurulmaz
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  document.querySelectorAll(".spotlight").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${event.clientX - rect.left}px`);
      card.style.setProperty("--my", `${event.clientY - rect.top}px`);
    });
  });
}

/* ---------- Görseller yüklenmezse ---------- */

function initImageFallbacks() {
  // Büyük kapak yoksa YouTube 120x90'lık boş bir görsel döndürür; küçük kapağa geçilir
  document.querySelectorAll("img[data-fallback]").forEach((img) => {
    const useFallback = () => {
      if (img.src !== img.dataset.fallback) img.src = img.dataset.fallback;
    };
    img.addEventListener("error", useFallback, { once: true });
    img.addEventListener("load", () => {
      if (img.naturalWidth > 0 && img.naturalWidth <= 120) useFallback();
    });
    if (img.complete && img.naturalWidth > 0 && img.naturalWidth <= 120) useFallback();
  });

  // Profil görseli açılmazsa boş çerçeve yerine hiç gösterilmez
  const avatar = document.querySelector(".hero-visual");
  const avatarImg = avatar && avatar.querySelector("img");
  if (avatarImg) {
    const hide = () => { avatar.hidden = true; };
    avatarImg.addEventListener("error", hide, { once: true });
    if (avatarImg.complete && avatarImg.naturalWidth === 0) hide();
  }
}

/* ---------- E-posta adresini kopyalama ---------- */

function initCopyEmail() {
  const button = document.querySelector(".copy-email");
  const link = document.querySelector(".contact-email");
  const status = document.querySelector(".copy-status");
  if (!button || !link || !status || !navigator.clipboard) return;

  button.hidden = false;
  let timer;

  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(link.dataset.email);
      status.textContent = "E-posta adresi kopyalandı.";
    } catch {
      status.textContent = "Kopyalanamadı; adresi seçip kopyalayabilirsiniz.";
    }
    clearTimeout(timer);
    timer = setTimeout(() => { status.textContent = ""; }, 3000);
  });
}

/* ---------- Alt bilgideki yıl ---------- */

function initYear() {
  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });
}
