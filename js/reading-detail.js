(function(){
  "use strict";

  const root = document.getElementById("readingDetailRoot");
  const params = new URLSearchParams(window.location.search);
  const id = String(params.get("id") || "").padStart(3,"0");

  function asArray(value){
    return Array.isArray(value) ? value.filter(Boolean) : (value ? [value] : []);
  }

  function escapeHtml(value=""){
    return String(value)
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  async function loadJSON(url){
    const response = await fetch(url,{cache:"no-store"});
    if(!response.ok) throw new Error(`${url} ${response.status}`);
    return response.json();
  }

  function findWork(catalog){
    return asArray(catalog).find(item=>String(item?.id || "").padStart(3,"0") === id) || {
      id,
      title:"题名待核",
      cover:"",
      dynasty:"",
      script:"",
      creator:""
    };
  }

  function metaChips(work,data){
    return [work.dynasty,work.script,work.creator,...asArray(data?.tags)]
      .filter(Boolean)
      .map(item=>`<span>${escapeHtml(item)}</span>`)
      .join("");
  }

  function sectionHead(number,title,description){
    return `<header class="section-head">
      <span class="section-number">${number}</span>
      <div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(description)}</p></div>
    </header>`;
  }

  function translationHTML(data){
    const section = data.translation || {};
    const items = asArray(section.sections);
    return `<section class="reading-section" id="translation">
      ${sectionHead("01","AI 译读",section.description || "选取重点段落，结合原文语境进行白话译读。")}
      <div class="translation-list">
        ${items.map(item=>`<article class="translation-card">
          <div class="translation-title">${escapeHtml(item.title || "重点段落")}</div>
          <div class="translation-body">
            <div class="translation-column">
              <span class="mini-label">碑文原文</span>
              <p class="classical-text">${escapeHtml(item.original || "")}</p>
            </div>
            <div class="translation-column">
              <span class="mini-label">阅读译文</span>
              <p class="modern-text">${escapeHtml(item.translation || "")}</p>
            </div>
          </div>
          ${item.note?`<p class="translation-note"><b>译读提示：</b>${escapeHtml(item.note)}</p>`:""}
        </article>`).join("") || `<p class="modern-text">本部分内容正在补充。</p>`}
      </div>
    </section>`;
  }

  function quotesHTML(data){
    const section = data.quotes || {};
    const items = asArray(section.items);
    return `<section class="reading-section" id="quotes">
      ${sectionHead("02","佳句赏析",section.description || "从碑文中选取代表性语句，理解其文意与思想内涵。")}
      <div class="quote-grid">
        ${items.map(item=>`<article class="quote-card">
          <span class="quote-page">${escapeHtml(item.page || "页码待核")}</span>
          <p class="quote-original">${escapeHtml(item.original || "")}</p>
          <p class="quote-appreciation">${escapeHtml(item.appreciation || "")}</p>
        </article>`).join("") || `<p class="modern-text">本部分内容正在补充。</p>`}
      </div>
    </section>`;
  }

  function graphHTML(work,data){
    const section = data.knowledgeGraph || {};
    const items = asArray(section.relations);
    return `<section class="reading-section" id="knowledge">
      ${sectionHead("03","知识图谱",section.description || "围绕碑帖连接人物、地点、事件与作品关系。")}
      <div class="graph-stage">
        <div class="graph-center"><strong>${escapeHtml(work.title)}</strong><span>当前碑帖</span></div>
        <div class="graph-relations">
          ${items.map(item=>`<article class="graph-node">
            <b>${escapeHtml(item.relation || "相关")}</b>
            <strong>${escapeHtml(item.name || "")}</strong>
            <span>${escapeHtml(item.description || "")}</span>
          </article>`).join("") || `<p class="modern-text">知识关系正在整理。</p>`}
        </div>
      </div>
    </section>`;
  }

  function calligraphyHTML(data){
    const section = data.calligraphy || {};
    const features = asArray(section.features);
    const chars = asArray(section.characters);
    return `<section class="reading-section" id="calligraphy">
      ${sectionHead("04","书法赏析",section.description || "从用笔、结体、章法与代表单字观察作品书风。")}
      <p class="calligraphy-intro">${escapeHtml(section.overview || "本部分内容正在补充。")}</p>
      <div class="feature-grid">
        ${features.map(item=>`<article class="feature-card"><b>${escapeHtml(item.title || "")}</b><p>${escapeHtml(item.content || "")}</p></article>`).join("")}
      </div>
      ${chars.length?`<div class="character-row">${chars.map(item=>`<article class="character-card">
        ${item.image?`<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.label || item.char || "代表单字")}">`:`<span class="character-glyph">${escapeHtml(item.char || "字")}</span>`}
        <small>${escapeHtml(item.label || "代表单字")}</small>
      </article>`).join("")}</div>`:""}
    </section>`;
  }

  function renderUpdated(work,data){
    document.title = `${work.title} · 碑帖赏读`;
    root.innerHTML = `<div class="reading-shell">
      <section class="reading-hero">
        <div class="hero-cover">
          ${work.cover?`<img src="${escapeHtml(work.cover)}" alt="${escapeHtml(work.title)}封面">`:""}
          <span class="work-id">${escapeHtml(id)}</span>
        </div>
        <div class="hero-copy">
          <span class="update-chip">赏读内容已更新</span>
          <div class="hero-eyebrow">碑帖赏读 · 独立内容页</div>
          <h1>${escapeHtml(work.title)}</h1>
          <p class="hero-subtitle">${escapeHtml(data.subtitle || "从碑文、文化与书法三个层面重新认识这件作品。")}</p>
          <div class="hero-meta">${metaChips(work,data)}</div>
        </div>
      </section>
      <aside class="reading-toc">
        <div class="toc-work">${escapeHtml(work.title)}</div>
        <span class="toc-label">目录</span>
        <a href="#translation">一、AI 译读</a>
        <a href="#quotes">二、佳句赏析</a>
        <a href="#knowledge">三、知识图谱</a>
        <a href="#calligraphy">四、书法赏析</a>
        <div class="toc-actions">
          <a href="reading.html">返回碑帖赏读</a>
          <a href="detail.html?id=${encodeURIComponent(id)}">查看碑帖总览</a>
        </div>
      </aside>
      <div class="reading-content">
        ${translationHTML(data)}
        ${quotesHTML(data)}
        ${graphHTML(work,data)}
        ${calligraphyHTML(data)}
      </div>
    </div>`;
  }

  function renderPending(work,reason=""){
    document.title = `${work.title} · 赏读内容尚未更新`;
    root.innerHTML = `<section class="pending-hero">
      <div class="pending-cover">${work.cover?`<img src="${escapeHtml(work.cover)}" alt="${escapeHtml(work.title)}封面">`:""}</div>
      <div class="pending-info">
        <span>碑帖赏读 · ${escapeHtml(id)}</span>
        <h1>${escapeHtml(work.title)}</h1>
        <p>${escapeHtml(work.dynasty || "")}${work.script?` · ${escapeHtml(work.script)}`:""}</p>
      </div>
    </section>
    <section class="pending-card">
      <span class="pending-seal">待</span>
      <h2>赏读内容尚未更新</h2>
      <p>本碑帖的 AI 译读、佳句赏析、知识图谱与书法赏析正在整理中。</p>
      <p>更新完成后，本页会自动按照统一的四栏目格式展示该碑帖自己的内容。</p>
      <div class="pending-actions">
        <a class="action-button" href="reading.html">返回碑帖赏读</a>
        <a class="action-button ghost" href="detail.html?id=${encodeURIComponent(id)}">查看碑帖总览</a>
      </div>
      ${reason?`<div class="error-note">${escapeHtml(reason)}</div>`:""}
    </section>`;
  }

  async function init(){
    let catalog = [];
    try{
      catalog = await loadJSON("data/beitie_catalog.json");
    }catch(error){
      console.error("[reading-detail] 碑帖目录读取失败",error);
    }
    const work = findWork(catalog);

    if(!params.get("id")){
      renderPending(work,"网址中缺少碑帖编号。");
      return;
    }

    try{
      const data = await loadJSON(`data/readings/${encodeURIComponent(id)}.json`);
      if(data?.updated === true){
        renderUpdated(work,data);
      }else{
        renderPending(work);
      }
    }catch(error){
      console.info(`[reading-detail] ${id} 尚无独立赏读数据`,error);
      renderPending(work);
    }
  }

  init();
})();
