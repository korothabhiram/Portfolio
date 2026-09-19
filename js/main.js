// Theme toggle (remembered per browser)
const root = document.documentElement;
try {
  const saved = localStorage.getItem("theme");
  if (saved) root.dataset.theme = saved;
} catch (_) {}

document.getElementById("theme").addEventListener("click", () => {
  const isLight = getComputedStyle(root).colorScheme === "light";
  const next = isLight ? "dark" : "light";
  root.dataset.theme = next;
  try { localStorage.setItem("theme", next); } catch (_) {}
});

// Reveal sections on scroll
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  });
}, { threshold: 0.08 });
document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

// Highlight the nav link for the section in view
const links = [...document.querySelectorAll(".topbar nav a")];
const spy = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) {
      links.forEach((a) => a.classList.toggle("active", a.hash === "#" + e.target.id));
    }
  });
}, { rootMargin: "-40% 0px -55% 0px" });
links.forEach((a) => { const s = document.querySelector(a.hash); if (s) spy.observe(s); });
