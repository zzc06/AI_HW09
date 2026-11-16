// 光之筆記：讀取 data/gallery.json，用 hash 路由渲染各種 wiki 頁面
const KIND = { photo: "照片", series: "系列", theme: "主題", place: "地點", gear: "器材" };
const app = document.getElementById("app");
let DB = null;
let filter = null; // 首頁目前選取的主題

const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const page = slug => DB.pages[slug];
const href = slug => (page(slug) ? `#/${page(slug).type}/${slug}` : "#/");
const link = slug => page(slug) ? `<a href="${href(slug)}">${esc(page(slug).title)}</a>` : esc(slug);
const list = v => (Array.isArray(v) ? v : v ? [v] : []);

// 把 [[slug]] 轉成連結，再用 marked 渲染 Markdown
function renderMd(md) {
  const withLinks = md.replace(/\[\[([a-z0-9-]+)\]\]/g, (_, s) =>
    page(s) ? `[${page(s).title}](${href(s)})` : `<span class="missing">${s}</span>`);
  return window.marked ? marked.parse(withLinks) : `<pre>${esc(withLinks)}</pre>`;
}

// 內文第一段當作卡片摘要
const summary = p => (p.body.split("\n").find(l => l.trim() && !l.startsWith("#")) || "").trim();

function card(slug) {
  const p = page(slug);
  return `<a class="card" href="${href(slug)}">
    <div class="frame"><img src="${esc(p.web || p.image)}" alt="${esc(p.title)}" loading="lazy"></div>
    <h3>${esc(p.title)}${p.featured ? '<span class="star">★</span>' : ""}</h3>
    <p>${esc(p.date)}${p.place && page(p.place) ? " · " + esc(page(p.place).title) : ""}</p>
  </a>`;
}

// 找出所有「提到」某頁的照片（frontmatter 欄位或內文連結）
function photosLinkingTo(slug) {
  return DB.photos.filter(s => {
    const p = page(s);
    return [p.place, ...list(p.series), ...list(p.themes), ...list(p.gear)].includes(slug) || p.body.includes(`[[${slug}]]`);
  });
}

function viewHome() {
  const themes = Object.values(DB.pages).filter(p => p.type === "theme");
  const shown = filter ? DB.photos.filter(s => list(page(s).themes).includes(filter)) : DB.photos;
  app.innerHTML = `
    <div class="chips">
      <button class="chip ${filter ? "" : "on"}" data-t="">全部</button>
      ${themes.map(t => `<button class="chip ${filter === t.slug ? "on" : ""}" data-t="${t.slug}">${esc(t.title)}</button>`).join("")}
    </div>
    <div class="grid">${shown.map(card).join("") || "<p>這個主題還沒有照片。</p>"}</div>`;
  app.querySelectorAll(".chip").forEach(b => (b.onclick = () => { filter = b.dataset.t || null; viewHome(); }));
}

function viewPhoto(p) {
  const ex = p.exif || {};
  const row = (label, html) => (html ? `<dt>${label}</dt><dd>${html}</dd>` : "");
  app.innerHTML = `
    <div class="photo-hero"><img src="${esc(p.web || p.image)}" alt="${esc(p.title)}"></div>
    <div class="page">
      <article>
        <div class="kind">照片</div>
        <h1>${esc(p.title)}</h1>
        <div class="body">${renderMd(p.body)}</div>
      </article>
      <dl class="side">
        ${row("日期", esc(p.date))}
        ${row("地點", p.place ? link(p.place) : "")}
        ${row("系列", list(p.series).map(link).join("、"))}
        ${row("主題", list(p.themes).map(link).join("、"))}
        ${row("器材", list(p.gear).map(link).join("、"))}
        ${row("參數", [ex.focal, ex.aperture, ex.shutter, ex.iso && "ISO " + ex.iso].filter(Boolean).map(esc).join(" · "))}
      </dl>
    </div>`;
}

function viewTopic(p) {
  const photos = photosLinkingTo(p.slug);
  const extra = { series: p.period && `期間：${esc(p.period)}`, place: p.region && `區域：${esc(p.region)}` }[p.type];
  app.innerHTML = `
    <div class="page" style="grid-template-columns:1fr">
      <article>
        <div class="kind">${KIND[p.type]}${extra ? " · " + extra : ""}</div>
        <h1>${esc(p.title)}</h1>
        <div class="body">${renderMd(p.body)}</div>
      </article>
    </div>
    <section class="related">
      <h2>相關照片（${photos.length}）</h2>
      <div class="grid">${photos.map(card).join("")}</div>
    </section>`;
}

function viewIndex() {
  const groups = Object.keys(KIND).map(type => {
    const items = Object.values(DB.pages).filter(p => p.type === type);
    return items.length ? `<h2>${KIND[type]}</h2><ul>${items.map(p => `<li>${link(p.slug)}</li>`).join("")}</ul>` : "";
  });
  app.innerHTML = `<div class="page" style="grid-template-columns:1fr"><article>
    <div class="kind">INDEX</div><h1>索引</h1><div class="body">${groups.join("")}</div></article></div>`;
}

function viewAbout() {
  app.innerHTML = `<div class="page" style="grid-template-columns:1fr"><article>
    <div class="kind">ABOUT</div><h1>關於</h1><div class="body">${renderMd(DB.about)}</div></article></div>`;
}

function route() {
  const [, type, slug] = location.hash.replace(/^#/, "").split("/");
  document.querySelectorAll("nav a").forEach(a => a.classList.toggle("on", a.getAttribute("href") === `#/${type || ""}`));
  window.scrollTo(0, 0);
  if (!type) return viewHome();
  if (type === "index") return viewIndex();
  if (type === "about") return viewAbout();
  const p = page(slug);
  if (!p) { app.innerHTML = `<p>找不到頁面：${esc(slug)}</p>`; return; }
  document.title = `${p.title}｜${DB.site.title}`;
  return p.type === "photo" ? viewPhoto(p) : viewTopic(p);
}

fetch("data/gallery.json")
  .then(r => r.json())
  .then(data => {
    DB = data;
    document.getElementById("site-title").textContent = DB.site.title;
    document.getElementById("site-sub").textContent = DB.site.subtitle;
    window.addEventListener("hashchange", route);
    route();
  })
  .catch(() => {
    app.innerHTML = `<p>無法載入 data/gallery.json。請先執行 <code>python3 tools/build.py</code>，並用本機伺服器開啟（不能直接雙擊 index.html）。</p>`;
  });
