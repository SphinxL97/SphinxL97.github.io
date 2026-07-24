/* 025《集王羲之书三藏圣教序》栏目二、三、四专属模块。 */
(function () {
  "use strict";

  const raw = String(new URLSearchParams(location.search).get("id") || "001");
  const workId = (raw.includes("-") ? raw.split("-")[0] : raw).padStart(3, "0");
  if (workId !== "025" || window.__WORK_025_SHENGJIAOXU__) return;

  window.__WORK_025_SHENGJIAOXU__ = true;
  window.__DAMAGE_CASE_UNBRACKETED_ADAPTER__ = true;
  window.__DAMAGE_CASE_INTEGRITY_V2__ = true;
  window.__DAMAGE_CASE_PARTIAL_STATUS__ = true;
  window.__DAMAGE_CASE_AUDIT_V2__ = true;
  window.__DAMAGE_CASE_STANDARD_PATCH_V4__ = true;

  const TITLE = "集王羲之书三藏圣教序";
  const VERSION = "20260724_shengjiaoxu_v1";
  const TEXT_URL = `data/work025_full_text.txt?v=${VERSION}`;
  const CASE_URL = `data/work025_damage_cases.json?v=${VERSION}`;
  const IMAGE_ROOT = "assets/page_images/025_集王羲之书三藏圣教序/images";
  const NOTE = "本节页面展示释文为由AI整理阅读版，段落划分和标点符号由AI辅助校对，仅供阅读参考。";
  const INTRO = "本栏目只处理用户底稿中明确标出的一个问号疑难字。候选字依据固定词语与可靠录文对校，问号之外的底稿文字保持原样；栏目三与栏目四读取同一份一例案例数据。";

  const escapeHTML = (value) => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  const clone = (value) => JSON.parse(JSON.stringify(value));

  function chineseNumber(n) {
    const digits = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
    if (n < 10) return digits[n];
    if (n === 10) return "十";
    if (n < 20) return `十${digits[n % 10]}`;
    if (n < 100) return `${digits[Math.floor(n / 10)]}十${n % 10 ? digits[n % 10] : ""}`;
    return String(n);
  }

  function directImage(page) {
    const n = Number(page || 0);
    return n ? `${IMAGE_ROOT}/${String(n).padStart(4, "0")}_${chineseNumber(n)}.jpg` : "";
  }

  async function fetchText(url) {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`${url} ${response.status}`);
    return response.text();
  }

  async function fetchJSON(url) {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`${url} ${response.status}`);
    return response.json();
  }

  function setMenuTitle(index, title) {
    const link = document.querySelector(`.side a:nth-of-type(${index})`);
    if (link) link.textContent = title;
  }

  function normalizeCase(row, index) {
    const id = String(row?.id || index + 1).padStart(2, "0");
    const category = String(row?.category || row?.n || "文献对校");
    const title = String(row?.title || row?.t || `第${id}处缺字`);
    const original = String(row?.original || row?.o || "");
    const corrected = String(row?.corrected || row?.c || original);
    const locations = Array.isArray(row?.locations) ? row.locations : [];
    return {
      ...row,
      id,
      category,
      title,
      original,
      corrected,
      n: "残损碑文恢复",
      t: title,
      o: original,
      c: corrected,
      confidence: String(row?.confidence || "高"),
      analysis: Array.isArray(row?.analysis) ? row.analysis.map(String) : [],
      locations,
      page: row?.page || locations[0]?.page || "—"
    };
  }

  function publishCases(items) {
    window.DAMAGE_AI_CASES = items.map((item) => ({
      ...clone(item),
      n: "残损碑文恢复",
      t: item.title,
      o: item.original,
      c: item.corrected,
      crowdsourceCategory: item.category
    }));
    window.dispatchEvent(new CustomEvent("work-025-cases-ready", {
      detail: { count: items.length }
    }));
  }

  function paragraphHTML(text) {
    const normalized = String(text || "")
      .replaceAll("\r\n", "\n")
      .replaceAll("\r", "\n");
    return normalized
      .split("\n\n")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => /^【[^】]+】$/.test(part)
        ? `<h4 class="work025-part-title">${escapeHTML(part)}</h4>`
        : `<p>${escapeHTML(part)}</p>`)
      .join("");
  }

  function boldProblemSentences(root, items) {
    const patterns = items
      .flatMap((item) => Array.isArray(item.highlight_patterns) && item.highlight_patterns.length
        ? item.highlight_patterns
        : [item.original])
      .filter(Boolean)
      .sort((a, b) => b.length - a.length);

    root.querySelectorAll("p").forEach((paragraph) => {
      const value = paragraph.textContent || "";
      const ranges = [];
      patterns.forEach((pattern) => {
        const at = value.indexOf(pattern);
        if (at >= 0) ranges.push({ start: at, end: at + pattern.length });
      });
      if (!ranges.length) return;
      ranges.sort((a, b) => a.start - b.start || b.end - a.end);
      const fragment = document.createDocumentFragment();
      let offset = 0;
      ranges.forEach((range) => {
        if (range.start < offset) return;
        if (range.start > offset) fragment.appendChild(document.createTextNode(value.slice(offset, range.start)));
        const strong = document.createElement("strong");
        strong.className = "transcript-problem-sentence";
        strong.textContent = value.slice(range.start, range.end);
        fragment.appendChild(strong);
        offset = range.end;
      });
      if (offset < value.length) fragment.appendChild(document.createTextNode(value.slice(offset)));
      paragraph.replaceChildren(fragment);
    });
  }

  function renderTranscript(text, items) {
    const section = document.getElementById("calligraphy");
    if (!section) return;
    setMenuTitle(2, "二、碑文释文");
    section.className = "content-card full-transcript-section";
    section.innerHTML = `
      <h2 class="section-title">二、碑文释文</h2>
      <p class="full-transcript-note">${NOTE}</p>
      <div class="full-transcript-card">
        <header class="full-transcript-header">
          <h3>${TITLE}</h3>
          <span class="full-transcript-ornament" aria-hidden="true"></span>
        </header>
        <div class="full-transcript-body">${paragraphHTML(text)}</div>
      </div>`;
    boldProblemSentences(section, items);
  }

  function makeLocation(item) {
    const source = Array.isArray(item.locations) ? item.locations[0] : null;
    const bbox = source?.bbox;
    const page = Number(source?.page || item.page || 0);
    if (!bbox || !page) return null;
    const canvas = {
      w: Number(source?.canvas?.w || source?.canvas_width || 1474),
      h: Number(source?.canvas?.h || source?.canvas_height || 2226)
    };
    const target = {
      x: Number(bbox.x ?? bbox[0] ?? 0),
      y: Number(bbox.y ?? bbox[1] ?? 0),
      w: Number(bbox.w ?? bbox[2] ?? 0),
      h: Number(bbox.h ?? bbox[3] ?? 0)
    };
    if (target.w <= 0 || target.h <= 0) return null;
    const cropW = Math.min(canvas.w, Math.max(900, target.w + 620));
    const cropH = Math.min(canvas.h, Math.max(1250, target.h + 940));
    return {
      page,
      image: String(source?.image || directImage(page)),
      canvas,
      target,
      crop: {
        x: Math.max(0, Math.min(canvas.w - cropW, target.x + target.w / 2 - cropW / 2)),
        y: Math.max(0, Math.min(canvas.h - cropH, target.y + target.h / 2 - cropH / 2)),
        w: cropW,
        h: cropH
      }
    };
  }

  function imageHTML(item) {
    const location = makeLocation(item);
    if (!location?.image) {
      return '<div class="damage-location-missing"><p>现有逐字坐标中暂未可靠定位本句第一个问题字。</p></div>';
    }
    return `
      <div class="damage-viewport" data-image="${escapeHTML(location.image)}" title="双击查看原始拓片">
        <svg class="damage-crop-svg" viewBox="${location.crop.x} ${location.crop.y} ${location.crop.w} ${location.crop.h}" preserveAspectRatio="xMidYMid meet">
          <image href="${escapeHTML(location.image)}" x="0" y="0" width="${location.canvas.w}" height="${location.canvas.h}" preserveAspectRatio="none"></image>
          <rect class="damage-box" x="${location.target.x}" y="${location.target.y}" width="${location.target.w}" height="${location.target.h}"></rect>
        </svg>
      </div>
      <p class="damage-caption">《${TITLE}》第${location.page}页，本句第一个问题字局部</p>`;
  }

  function markedHTML(value) {
    let html = "";
    let offset = 0;
    const text = String(value || "");
    const pattern = /〔([^〕]*)〕/g;
    let match;
    while ((match = pattern.exec(text))) {
      html += escapeHTML(text.slice(offset, match.index));
      html += `<span class="damage-added">〔${escapeHTML(match[1])}〕</span>`;
      offset = match.index + match[0].length;
    }
    return html + escapeHTML(text.slice(offset));
  }

  const plainRestored = (value) => String(value || "").replace(/[〔〕]/g, "");
  let cases = [];
  let current = 0;
  let expanded = false;

  function renderDamage() {
    const section = document.getElementById("people");
    if (!section || !cases.length) return;
    const item = cases[current];
    setMenuTitle(3, "三、碑文残损与AI释读");
    publishCases(cases);
    const analysis = item.analysis.map((line) => `<li>${escapeHTML(line)}</li>`).join("");
    const tabs = cases.map((entry, index) => `
      <button class="damage-tab${index === current ? " active" : ""}" data-case-index="${index}" type="button">
        <b>${escapeHTML(entry.id)}</b><span class="name">${escapeHTML(entry.category)}</span>
      </button>`).join("");

    section.className = "content-card damage-ai";
    section.dataset.work025Dedicated = "true";
    section.innerHTML = `
      <h2 class="section-title">三、碑文残损与AI释读</h2>
      <p class="damage-intro">${INTRO}</p>
      <div class="damage-shell">
        <div class="damage-toolbar">
          <span class="damage-count">案例 ${current + 1} / ${cases.length}</span>
          <div class="damage-heading">${escapeHTML(item.category)}——“${escapeHTML(item.title)}”</div>
          <div class="damage-pager">
            <button data-action="prev" type="button" ${current === 0 ? "disabled" : ""}>‹ 上一个</button>
            <span class="damage-page">${current + 1} / ${cases.length}</span>
            <button data-action="next" type="button" ${current === cases.length - 1 ? "disabled" : ""}>下一个 ›</button>
          </div>
        </div>
        <div class="damage-body">
          <nav class="damage-list">${tabs}</nav>
          <div class="damage-stage">
            <section class="damage-card damage-image-card"><h3>拓片原图（局部）</h3>${imageHTML(item)}</section>
            <section class="damage-card damage-analysis">
              <h3>AI辅助校勘</h3>
              <div class="damage-flow">
                <div class="damage-block"><span class="damage-label">原始识别（OCR结果）</span><div class="damage-text">${escapeHTML(item.original)}</div></div>
                <div class="damage-arrow">↓</div>
                <div class="damage-block"><span class="damage-label">文献对校结果</span><div class="damage-text damage-new">${markedHTML(item.corrected)}</div></div>
                <div class="damage-block"><span class="damage-label">恢复后的上下文</span><div class="damage-restored">${escapeHTML(plainRestored(item.corrected))}</div></div>
                <div class="damage-block damage-evidence-block">
                  <span class="damage-label">AI分析依据</span>
                  <div class="damage-evidence${expanded ? " open" : ""}"><ol>${analysis}</ol><p><strong>建议置信度：</strong>${escapeHTML(item.confidence)}</p></div>
                  <button class="damage-expand" data-action="expand" type="button">${expanded ? "收起内容⌃" : "展开更多⌄"}</button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>`;

    section.querySelectorAll("[data-case-index]").forEach((button) => {
      button.addEventListener("click", () => {
        current = Number(button.dataset.caseIndex) || 0;
        expanded = false;
        renderDamage();
      });
    });
    section.querySelectorAll("[data-action]").forEach((button) => {
      button.addEventListener("click", () => {
        if (button.dataset.action === "prev" && current > 0) current -= 1;
        if (button.dataset.action === "next" && current < cases.length - 1) current += 1;
        if (button.dataset.action === "expand") expanded = !expanded;
        renderDamage();
      });
    });
    section.querySelector(".damage-viewport[data-image]")?.addEventListener("dblclick", (event) => {
      if (typeof window.openZoom === "function") window.openZoom(event.currentTarget.dataset.image);
    });
  }

  function ensureStyle() {
    if (document.getElementById("work025-shengjiaoxu-style")) return;
    const style = document.createElement("style");
    style.id = "work025-shengjiaoxu-style";
    style.textContent = ".work025-part-title{margin:22px 0 10px;color:#8b2e24;font-family:'SimSun',serif;font-size:21px}.damage-added{padding:0 .12em;border-bottom:2px solid #a53529;border-radius:4px;background:#f8e1cf;color:#9f3025!important;font-weight:900}.damage-location-missing{display:flex;align-items:center;justify-content:center;min-height:210px;padding:28px;border:1px dashed #d8c69f;border-radius:14px;background:#fffaf0;color:#7b6c5a}";
    document.head.appendChild(style);
  }

  function ensureCrowdsource() {
    const stylePath = "assets/css/crowdsource-v9.css";
    if (!Array.from(document.querySelectorAll('link[rel="stylesheet"]')).some((link) => (link.getAttribute("href") || "").split("?")[0].endsWith(stylePath))) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = `${stylePath}?v=${VERSION}`;
      document.head.appendChild(link);
    }
    if (window.__CROWDSOURCE_MISSING_V10__) {
      window.__WORK_025_CROWDSOURCE_READY__ = true;
      return;
    }
    const scriptPath = "assets/js/crowdsource-v9.js";
    if (!Array.from(document.scripts).some((script) => (script.getAttribute("src") || "").split("?")[0].endsWith(scriptPath))) {
      const script = document.createElement("script");
      script.src = `${scriptPath}?v=${VERSION}`;
      script.async = false;
      script.addEventListener("load", () => {
        window.__WORK_025_CROWDSOURCE_READY__ = true;
        window.dispatchEvent(new CustomEvent("work-025-crowdsource-ready", { detail: { count: cases.length } }));
      }, { once: true });
      document.head.appendChild(script);
    }
  }

  async function init() {
    ensureStyle();
    try {
      const [text, rows] = await Promise.all([fetchText(TEXT_URL), fetchJSON(CASE_URL)]);
      cases = (Array.isArray(rows) ? rows : []).map(normalizeCase);
      if (!cases.length) throw new Error("025案例数据为空");
      publishCases(cases);
      renderTranscript(text, cases);
      renderDamage();
      ensureCrowdsource();
      window.__WORK_025_CONTENT_READY__ = true;
      window.__WORK_025_STABLE_READY__ = true;
      window.dispatchEvent(new CustomEvent("work-025-content-ready", { detail: { count: cases.length } }));
      window.dispatchEvent(new CustomEvent("work-025-stable-ready", { detail: { cases: cases.length } }));
    } catch (error) {
      console.error("[work-025]", error);
      const transcript = document.getElementById("calligraphy");
      const damage = document.getElementById("people");
      if (transcript) transcript.innerHTML = '<h2 class="section-title">二、碑文释文</h2><div class="full-transcript-error">025碑文数据读取失败，请刷新页面后重试。</div>';
      if (damage) damage.innerHTML = '<h2 class="section-title">三、碑文残损与AI释读</h2><div class="full-transcript-error">025案例数据读取失败，请刷新页面后重试。</div>';
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
