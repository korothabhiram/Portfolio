// Easter egg: the blinking cursor at the end of the hero is a live prompt.
// Output is built from the page's own content, so it stays in sync with the HTML.
(() => {
  const input = document.getElementById("live-in");
  const typed = document.getElementById("typed");
  const out = document.getElementById("live-out");
  if (!input || !typed || !out) return;
  const promptLine = input.closest(".prompt-line");
  const PS1 = "abhiram@portfolio:~$";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const clean = (el) => (el ? el.textContent.replace(/\s+/g, " ").trim() : "");
  const norm = (s) => s.trim().replace(/\s+/g, " ").replace(/\/+$/, "").toLowerCase();

  // ---------- building blocks ----------
  const line = (cls, text) => {
    const d = document.createElement("div");
    d.className = "out-line" + (cls ? " " + cls : "");
    if (text != null) d.textContent = text;
    return d;
  };
  const link = (label, href, download) => {
    const a = document.createElement("a");
    a.textContent = label;
    a.href = href;
    if (download) a.setAttribute("download", download);
    else if (/^https?:/.test(href)) { a.target = "_blank"; a.rel = "noopener"; }
    return a;
  };
  const row = (...kids) => { const d = line(); kids.forEach((k) => d.append(k)); return d; };
  const wrap = (items) => {
    const d = document.createElement("div");
    d.className = "out-list";
    items.forEach((i) => d.append(i));
    return d;
  };
  const span = (cls, text) => { const s = document.createElement("span"); s.className = cls; s.textContent = text; return s; };

  // Grab the block that follows a resume heading (e.g. "Certifications")
  const resumeBlock = (title) => {
    const h = $$(".resume h4").find((h4) => clean(h4) === title);
    return h ? h.nextElementSibling : null;
  };
  const bullets = (title) => {
    const el = resumeBlock(title);
    return el ? $$("li", el).map((li) => line("", "- " + clean(li))) : [];
  };

  // ---------- commands (same ones used as prompts across the site) ----------
  const defs = [
    ["whoami", "who I am", () => [
      line("name", clean($(".hero h1"))), line("", clean($(".role"))), line("dim", clean($(".tagline"))),
    ]],
    ["cat about.txt", "a short intro", () => [line("", clean($(".lead")))]],
    ["ls links/", "where to find me", () => [wrap(
      $$(".hero .cta a").map((a) => link(clean(a), a.getAttribute("href"), a.getAttribute("download"))))]],
    ["echo $STACK", "my tech stack", () => [line("", $$(".chips li").map(clean).join(" "))]],
    ["ls ~/technologies", "tools I have repos for", () => [wrap(
      $$(".toolbox .tool").map((a) => link(clean(a).toLowerCase() + "/", a.getAttribute("href"))))]],
    ["ls ~/projects", "things I built", () => [wrap(
      $$(".proj").map((p) => link(clean($("h3", p)) + "/", $(".gh-link", p).getAttribute("href"))))]],
    ["cat ~/about/resume.md", "my resume", () => {
      const summary = resumeBlock("Professional summary");
      const jobs = $$(".gitlog li").map((li) => line("",
        `${clean($(".date", li))}  ${clean($("strong", li))} ${clean($(".at", li))} · ${clean($(".loc", li))}`));
      const pdf = $(".bio a[download]");
      return [
        line("name", clean($(".resume h3"))), line("", clean($(".resume header p"))), line("dim", clean($(".resume .contactline"))),
        line("h", "## Professional summary"), line("", clean(summary)),
        line("h", "## Experience"), ...jobs,
        line("h", "## Certifications"), ...bullets("Certifications"),
        line("h", "## Education"), ...bullets("Education"),
        line("h", "## Download"),
        row(link(clean(pdf), pdf.getAttribute("href"), pdf.getAttribute("download"))),
      ];
    }],
    ["cat ~/contact.txt", "how to reach me", () => $$(".contact a").map((a) => {
      const href = a.getAttribute("href");
      const label = href.startsWith("mailto:") ? "Email" : clean(a);
      return row(span("k", label), link(href.replace(/^mailto:|^https?:\/\//, ""), href));
    })],
    ["help", "this list", () => [
      ...defs.map(([name, desc]) => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "cmd-link"; b.textContent = name;
        b.addEventListener("click", () => { run(name); input.focus({ preventScroll: true }); });
        return row(b, span("dim", "  # " + desc));
      }),
    ]],
    ["clear", "clear the screen", null],
  ];
  const table = new Map(defs.map((d) => [norm(d[0]), d]));
  const aliases = {
    "ls technologies": "ls ~/technologies", "ls projects": "ls ~/projects",
    "cat resume.md": "cat ~/about/resume.md", "cat about/resume.md": "cat ~/about/resume.md",
    "cat contact.txt": "cat ~/contact.txt",
  };
  const names = defs.map((d) => d[0]);

  // ---------- run a command ----------
  const history = [];
  let histIdx = 0;

  const run = (raw) => {
    const key = norm(raw);
    const block = document.createElement("div");
    block.className = "out-block";
    block.append(row(span("ps1", PS1), document.createTextNode(" " + raw.trim())));
    block.firstChild.classList.add("echo");

    if (key) history.push(raw.trim());
    histIdx = history.length;

    if (key === "clear") { out.textContent = ""; return; }
    const def = table.get(aliases[key] || key);
    if (def) block.append(...def[2]());
    else if (key === "ls") block.append(line("", "about.txt  links/  ~/technologies/  ~/projects/  ~/about/resume.md  ~/contact.txt"));
    else if (/^sudo\b/.test(key)) block.append(line("dim", "abhiram is not in the sudoers file. This incident will be reported."));
    else if (key) block.append(line("err", `command not found: ${key.split(" ")[0]}. Type 'help' for the list of commands.`));
    out.append(block);
  };

  // ---------- input handling ----------
  const sync = () => {
    typed.textContent = input.value;
    const end = input.value.length;
    input.setSelectionRange(end, end); // caret always at the end, like the drawn cursor
  };
  const commonPrefix = (arr) => arr.reduce((a, b) => { let i = 0; while (i < a.length && a[i] === b[i]) i++; return a.slice(0, i); });

  input.addEventListener("input", sync);
  input.addEventListener("click", sync);
  input.addEventListener("focus", sync);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const v = input.value;
      input.value = ""; sync();
      run(v);
      promptLine.scrollIntoView({ block: "nearest" });
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      histIdx = Math.min(Math.max(histIdx + (e.key === "ArrowUp" ? -1 : 1), 0), history.length);
      input.value = history[histIdx] || ""; sync();
    } else if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
      e.preventDefault();
    } else if (e.key === "Tab" && input.value) {
      const matches = names.filter((n) => n.startsWith(input.value.toLowerCase()));
      if (matches.length) { e.preventDefault(); input.value = commonPrefix(matches); sync(); }
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault(); out.textContent = "";
    } else if (e.key === "Escape") {
      input.blur(); // lets keyboard users leave the prompt
    }
  });
})();
