(() => {
  "use strict";

  const SF = window.SF;
  const { state, t, icon, escapeHTML } = SF;

  window.SF_PAGES.overview = { render, bind };

  function render() {
    const view = state.view;
    const main = document.querySelector("#app-main");
    if (!view || !main) return;
    SF.setDocumentTitle(t("情报总览", "Intelligence Overview"));
    main.innerHTML = `
      <section class="page-head">${pageHead(view)}</section>
      <section class="kpi-grid overview-kpis">${kpiCards(view)}</section>
      <section class="overview-workbench">
        <aside class="panel overview-filter-rail" id="overview-filter-rail">${filterRail(view)}</aside>
        <div class="overview-center">
          <section class="panel pulse-panel">${pulsePanel(view)}</section>
          <section class="panel stream-panel">${streamPanel(view)}</section>
        </div>
        <aside class="overview-intel">${intelPanels(view)}</aside>
      </section>
      <section class="overview-data-strip panel">${dataStrip(view)}</section>`;
  }

  function bind() {
    const main = document.querySelector("#app-main");
    if (!main) return;
    main.onclick = (event) => {
      if (event.target.closest("#overview-brief")) return SF.openBrief();
      if (event.target.closest("#overview-download")) return SF.downloadMarkdown();
      const filter = event.target.closest("[data-overview-filter]");
      if (filter) {
        state.overviewFilter = filter.dataset.overviewFilter;
        updateRail();
        updateStream();
        return;
      }
      const category = event.target.closest("[data-overview-category]");
      if (category) {
        state.overviewCategory = state.overviewCategory === category.dataset.overviewCategory ? "all" : category.dataset.overviewCategory;
        updateRail();
        updateStream();
        return;
      }
      const row = event.target.closest("[data-event-id]");
      if (row) location.href = `signals.html?event=${encodeURIComponent(row.dataset.eventId)}`;
    };
  }
  function pageHead(view) {
    const stats = view.stats;
    return `
      <div class="page-title-block">
        <div class="eyebrow"><span class="live-dot"></span>GLOBAL WEB3 · OBSERVED INTELLIGENCE</div>
        <h1>${t("情报总览", "Intelligence Overview")}</h1>
        <p>${t("快速掌握正在发生、正在升温，以及值得进一步研究的事件。所有指标均基于当前已接入来源。", "See what is happening, what is rising and what deserves deeper research. All metrics are scoped to connected sources.")}</p>
      </div>
      <div class="page-head-side">
        <div class="source-health-inline">
          <span class="health-dot ${stats.activeSources === stats.totalSources ? "ok" : "warn"}"></span>
          <span>${t("数据源", "Sources")} <b>${stats.activeSources}/${stats.totalSources}</b></span>
          <span class="muted">${t("最后同步", "Last sync")} ${escapeHTML(SF.formatSyncTime(view.generatedAt))}</span>
        </div>
        <div class="page-head-actions">
          <button class="button button-primary" id="overview-brief" type="button">${icon("file-search")}${t("打开情报简报", "Open intelligence brief")}</button>
          <button class="button button-ghost" id="overview-download" type="button">${icon("download")}${t("导出 Markdown", "Export Markdown")}</button>
        </div>
      </div>`;
  }

  function kpiCards(view) {
    const stats = view.stats;
    return [
      kpiCard("radar", t("活跃信号", "Active signals"), stats.active, t("当前观察期内的事件", "Events in the current observation window"), "brand", sparkline(view.trend.values, "brand")),
      kpiCard("activity", t("正在升温", "Rising now"), stats.rising, t("新近出现且热度较高的事件", "Recent events with elevated observed heat"), "amber", sparkline(view.trend.values.slice().reverse(), "amber")),
      kpiCard("bell-ring", t("风险关注", "Risk watch"), stats.risk, t("风险分达到关注阈值", "Events at or above the risk threshold"), "risk", riskBars(view.events)),
      kpiCard("file-search", t("预测研究候选", "Prediction research"), stats.research, `${stats.marketLinked} ${t("个公开市场关联", "market-linked")}`, "violet", donut(stats.marketLinked, stats.research)),
    ].join("");
  }

  function kpiCard(iconName, label, value, note, tone, visual) {
    return `
      <article class="kpi-card kpi-tone-${tone}">
        <div class="kpi-top"><span class="kpi-label">${icon(iconName, "icon kpi-icon")}${label}</span><span class="kpi-chip">${t("观察值", "OBSERVED")}</span></div>
        <strong>${SF.formatNumber(value)}</strong>
        <p>${note}</p>
        ${visual}
      </article>`;
  }

  function filterRail(view) {
    const stats = view.stats;
    return `
      <div class="rail-heading"><div><span class="section-kicker">SIGNAL FILTERS</span><h2>${t("观察视图", "Observation views")}</h2></div>${icon("filter", "icon rail-icon")}</div>
      <div class="filter-group" role="group" aria-label="${t("快速筛选", "Quick filters")}">
        ${quickButton("all", t("全部事件", "All signals"), stats.active)}
        ${quickButton("new", t("新发现", "New"), countTracking("new"))}
        ${quickButton("rising", t("正在升温", "Rising"), stats.rising)}
        ${quickButton("risk", t("风险关注", "Risk watch"), stats.risk)}
        ${quickButton("unverified", t("待核实", "Unverified"), stats.unverified)}
      </div>
      <div class="rail-divider"></div>
      <div class="filter-label">${t("风险等级", "Risk level")}</div>
      <div class="risk-distribution">
        <span class="risk-dist critical">${t("极高", "Critical")}<b>${countRisk("critical")}</b></span>
        <span class="risk-dist high">${t("高", "High")}<b>${countRisk("high")}</b></span>
        <span class="risk-dist medium">${t("中", "Medium")}<b>${countRisk("medium")}</b></span>
      </div>
      <div class="rail-divider"></div>
      <div class="filter-label">${t("事件分类", "Categories")}</div>
      <div class="category-filter-list">${view.categories.map(([category, count]) => `
        <button type="button" class="category-filter ${state.overviewCategory === category ? "active" : ""}" data-overview-category="${escapeHTML(category)}"><span>${escapeHTML(category)}</span><b>${count}</b></button>`).join("")}</div>
      <div class="rail-divider"></div>
      <div class="filter-label">${t("来源状态", "Source health")}</div>
      <div class="mini-source-list">${view.sources.slice(0, 4).map((source) => `<span><i class="${source.ok ? "ok" : "error"}"></i>${escapeHTML(source.name)}<b>${source.ok ? source.item_count : "ERR"}</b></span>`).join("")}</div>
      <div class="rail-note">${icon("activity")}<span>${t("指标只覆盖当前已接入来源，不代表全网总量。", "Metrics cover connected sources only, not the entire web.")}</span></div>`;
  }

  function quickButton(value, label, count) {
    return `<button type="button" class="quick-filter ${state.overviewFilter === value ? "active" : ""}" data-overview-filter="${value}"><span>${label}</span><b>${count}</b></button>`;
  }

  function countTracking(status) {
    return state.view.events.filter((event) => event.trackingStatus === status).length;
  }

  function countRisk(level) {
    return state.view.events.filter((event) => event.riskLevel === level).length;
  }

  function getFilteredEvents() {
    return state.view.events.filter((event) => {
      if (state.overviewCategory !== "all" && event.category !== state.overviewCategory) return false;
      if (state.overviewFilter === "risk") return event.risk >= 58;
      if (state.overviewFilter === "unverified") return ["unverified", "corroborated"].includes(event.evidenceStatus);
      if (state.overviewFilter !== "all") return event.trackingStatus === state.overviewFilter;
      return true;
    });
  }

  function updateRail() {
    const rail = document.querySelector("#overview-filter-rail");
    if (!rail) return;
    rail.innerHTML = filterRail(state.view);
  }

  function updateStream() {
    const list = document.querySelector("#overview-event-list");
    const count = document.querySelector("#overview-stream-count");
    if (!list) return;
    const events = getFilteredEvents();
    list.innerHTML = eventList(events);
    if (count) count.textContent = `${events.length} ${t("个事件", "events")}`;
  }
  function pulsePanel(view) {
    return `
      <div class="panel-heading"><div><span class="section-kicker">SIGNAL PULSE</span><h2>${t("24 小时观察到的活动", "24-hour observed activity")}</h2></div><div class="legend"><span class="legend-line"></span>${t("热度加权", "Heat weighted")}</div></div>
      <div class="pulse-chart" id="overview-trend">${trendChart(view.trend)}</div>
      <div class="pulse-footer"><span><i class="dot cyan"></i>${t("主导分类", "Top category")} <b>${escapeHTML(view.categories[0]?.[0] || "—")}</b></span><span><i class="dot amber"></i>${t("平均风险", "Average risk")} <b>${view.stats.riskIndex}</b></span></div>`;
  }

  function streamPanel(view) {
    const events = getFilteredEvents();
    return `
      <div class="panel-heading"><div><span class="section-kicker">ACTIVE SIGNAL STREAM</span><h2>${t("正在发酵的事件", "Signals in motion")}</h2></div><span class="stream-count" id="overview-stream-count">${events.length} ${t("个事件", "events")}</span></div>
      <div class="stream-meta-line"><span>${t("按热度与风险综合排序", "Ranked by observed heat and risk")}</span><a href="signals.html">${t("打开完整工作台", "Open full workbench")}${icon("arrow-right", "icon icon-sm inline-icon")}</a></div>
      <div class="event-list overview-event-list" id="overview-event-list">${eventList(events)}</div>`;
  }

  function eventList(events) {
    if (!events.length) return `<div class="empty-state">${t("当前筛选下没有事件。", "No signals match the current filters.")}</div>`;
    return events.slice(0, 10).map((event, index) => `
      <button class="event-row overview-event-row" type="button" data-event-id="${escapeHTML(event.id)}">
        <span class="event-index">${String(index + 1).padStart(2, "0")}</span>
        <span class="event-main">
          <span class="event-title">${escapeHTML(event.title)}</span>
          <span class="event-meta"><span class="category">${escapeHTML(event.category)}</span><i class="bullet"></i><span>${event.sourceCount} ${t("个来源", "sources")}</span><i class="bullet"></i><span>${escapeHTML(SF.relativeTime(event.lastUpdated))}</span><span class="event-tag-inline">${escapeHTML(SF.trackingLabel(event.trackingStatus))}</span></span>
        </span>
        <span class="event-score"><span class="heat-bar"><span style="width:${SF.clamp(event.heat, 0, 100)}%"></span></span><span class="risk-pill ${event.riskLevel}">${icon("alert-triangle", "icon icon-sm")}${escapeHTML(SF.riskLabel(event.risk))}</span></span>
      </button>`).join("");
  }

  function trendChart(trend) {
    const values = trend.values?.length ? trend.values : [24, 35, 31, 48, 44, 61];
    const labels = trend.labels?.length ? trend.labels : ["24h", "20h", "16h", "12h", "8h", "Now"];
    const width = 720;
    const height = 210;
    const pad = { left: 8, right: 10, top: 16, bottom: 28 };
    const innerW = width - pad.left - pad.right;
    const innerH = height - pad.top - pad.bottom;
    const points = values.map((value, index) => ({ x: pad.left + (index / Math.max(1, values.length - 1)) * innerW, y: pad.top + innerH - (SF.clamp(value, 0, 100) / 100) * innerH }));
    const line = smoothPath(points);
    const area = `${line} L${points.at(-1).x},${pad.top + innerH} L${points[0].x},${pad.top + innerH} Z`;
    return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${t("24小时信号活动趋势", "24-hour signal activity trend")}"><defs><linearGradient id="overview-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--brand-blue)" stop-opacity=".2"/><stop offset="1" stop-color="var(--signal-cyan)" stop-opacity="0"/></linearGradient><linearGradient id="overview-line" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="var(--brand-blue)"/><stop offset="1" stop-color="var(--signal-cyan)"/></linearGradient></defs>${[0, 1, 2, 3].map((index) => `<line x1="${pad.left}" y1="${pad.top + innerH * index / 3}" x2="${width - pad.right}" y2="${pad.top + innerH * index / 3}" stroke="var(--border)" stroke-opacity=".45" stroke-dasharray="3 7"/>`).join("")}<path d="${area}" fill="url(#overview-area)"/><path d="${line}" fill="none" stroke="url(#overview-line)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>${points.map((point, index) => `<circle cx="${point.x}" cy="${point.y}" r="${index === points.length - 1 ? 4 : 2.2}" fill="${index === points.length - 1 ? "var(--signal-cyan)" : "var(--panel-base)"}" stroke="var(--brand-blue)" stroke-width="1.4"/>`).join("")}${labels.map((label, index) => `<text x="${pad.left + (index / Math.max(1, labels.length - 1)) * innerW}" y="${height - 6}" fill="var(--text-muted)" font-size="11" text-anchor="${index === 0 ? "start" : index === labels.length - 1 ? "end" : "middle"}">${escapeHTML(label)}</text>`).join("")}</svg>`;
  }

  function smoothPath(points) {
    if (!points.length) return "";
    let path = `M${points[0].x},${points[0].y}`;
    for (let index = 0; index < points.length - 1; index += 1) {
      const current = points[index]; const next = points[index + 1]; const middle = (current.x + next.x) / 2;
      path += ` C${middle},${current.y} ${middle},${next.y} ${next.x},${next.y}`;
    }
    return path;
  }

  function sparkline(values, tone) {
    const safe = values?.length ? values : [24, 34, 28, 46, 41, 58];
    const points = safe.map((value, index) => `${(index / Math.max(1, safe.length - 1)) * 140},${36 - (SF.clamp(value, 0, 100) / 100) * 28}`).join(" ");
    return `<svg class="kpi-sparkline ${tone}" viewBox="0 0 140 40" aria-hidden="true"><polyline points="${points}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }

  function riskBars(events) {
    return `<div class="kpi-risk-bars" aria-hidden="true">${events.slice(0, 8).map((event) => `<i class="${event.riskLevel}" style="height:${6 + event.risk * .22}px"></i>`).join("")}</div>`;
  }

  function donut(value, total) {
    const ratio = total ? Math.max(0, Math.min(1, value / total)) : 0;
    return `<div class="kpi-donut" style="--ratio:${ratio * 100}%"><span>${Math.round(ratio * 100)}%</span></div>`;
  }
  function intelPanels(view) {
    return `
      <section class="panel intel-panel priority-panel">
        <div class="panel-heading compact"><div><span class="section-kicker">PRIORITY ALERTS</span><h2>${t("优先信号", "Priority signals")}</h2></div>${icon("bell-ring", "icon panel-icon risk-icon")}</div>
        <div class="priority-list">${priorityList(view.events.slice(0, 3))}</div>
        <a class="text-link" href="signals.html">${t("查看完整事件流", "View all signals")}${icon("arrow-right", "icon icon-sm inline-icon")}</a>
      </section>
      <section class="panel intel-panel narrative-panel">
        <div class="panel-heading compact"><div><span class="section-kicker">NARRATIVE HEAT</span><h2>${t("叙事热度", "Narrative heat")}</h2></div><span class="tiny-label">${t("来源占比", "Source share")}</span></div>
        <div class="narrative-bars">${narrativeBars(view.categories, view.events.length)}</div>
      </section>
      <section class="panel intel-panel prediction-panel">
        <div class="panel-heading compact"><div><span class="section-kicker">PREDICTION WATCH</span><h2>${t("预测研究候选", "Prediction watch")}</h2></div><span class="tiny-label violet-text">${view.stats.research}</span></div>
        <div class="prediction-watch-list">${predictionWatch(view.predictionCandidates.slice(0, 3))}</div>
        <a class="text-link" href="prediction.html">${t("进入研究页", "Open research")}${icon("arrow-right", "icon icon-sm inline-icon")}</a>
      </section>`;
  }

  function priorityList(events) {
    if (!events.length) return `<div class="empty-state">${t("暂无风险事件。", "No risk signals.")}</div>`;
    return events.map((event) => `
      <a class="priority-item" href="signals.html?event=${encodeURIComponent(event.id)}">
        <span class="priority-signal ${event.riskLevel}"></span>
        <span><strong>${escapeHTML(event.title)}</strong><small>${escapeHTML(event.category)} · ${event.sourceCount} ${t("来源", "sources")} · ${escapeHTML(SF.trackingLabel(event.trackingStatus))}</small></span>
        <b class="risk-pill ${event.riskLevel}">${escapeHTML(SF.riskLabel(event.risk))}</b>
      </a>`).join("");
  }

  function narrativeBars(categories, total) {
    if (!categories.length) return `<div class="empty-state">${t("暂无分类数据。", "No category data.")}</div>`;
    const tones = ["risk", "amber", "brand", "violet", "cyan"];
    return categories.slice(0, 5).map(([category, count], index) => {
      const percent = total ? Math.round((count / total) * 100) : 0;
      return `<div class="narrative-row"><div><span>${escapeHTML(category)}</span><b>${percent}%</b></div><div class="narrative-track"><span class="${tones[index % tones.length]}" style="width:${percent}%"></span></div></div>`;
    }).join("");
  }

  function predictionWatch(candidates) {
    if (!candidates.length) return `<div class="empty-state">${t("暂无预测研究候选。", "No prediction candidates.")}</div>`;
    return candidates.map((candidate) => `
      <a class="watch-item" href="prediction.html?candidate=${encodeURIComponent(candidate.id)}">
        <span class="watch-type ${candidate.status === "market_linked" ? "market" : "research"}">${candidate.status === "market_linked" ? t("市场", "MARKET") : t("研究", "RESEARCH")}</span>
        <span class="watch-question">${escapeHTML(candidate.question)}</span>
        <span class="watch-meta">${candidate.probability != null ? `${candidate.probability}% YES` : t("待定义结算条件", "Resolution criteria pending")}</span>
      </a>`).join("");
  }

  function dataStrip(view) {
    return `
      <div><span class="section-kicker">DATA PROVENANCE</span><p>${t("数据源：公开 RSS、CoinGecko、Polymarket", "Sources: public RSS, CoinGecko, Polymarket")}</p></div>
      <div class="source-chip-row">${view.sources.slice(0, 8).map((source) => `<span class="source-chip ${source.ok ? "ok" : "error"}"><i></i>${escapeHTML(source.name)}</span>`).join("")}</div>
      <a href="methodology.html">${t("查看数据与评分方法", "Review data and scoring method")}${icon("arrow-right", "icon icon-sm inline-icon")}</a>`;
  }
})();



