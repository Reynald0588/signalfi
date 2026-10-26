(() => {
  "use strict";

  const SF = window.SF;
  const { state, t, icon, escapeHTML } = SF;

  window.SF_PAGES.signals = { render, bind };

  function render() {
    const view = state.view;
    const main = document.querySelector("#app-main");
    if (!view || !main) return;
    SF.setDocumentTitle(t("热点与风险工作台", "Signals & Risk Workbench"));
    const selected = getSelectedEvent();
    main.innerHTML = `
      <section class="page-head signals-page-head">${signalsHead(view)}</section>
      <section class="panel signals-toolbar">${toolbar()}</section>
      <section class="signals-layout">
        <aside class="panel signals-filter-rail" id="signals-filter-rail">${filterRail(view)}</aside>
        <section class="panel signals-list-panel">
          <div class="list-heading"><div><span class="section-kicker">SIGNAL DATABASE</span><h2>${t("事件流", "Signal stream")}</h2></div><span class="stream-count" id="signals-count">${filteredEvents().length} ${t("个事件", "events")}</span></div>
          <div class="signals-list" id="signals-list">${signalRows()}</div>
        </section>
        <aside class="panel signal-detail-panel" id="signal-detail">${detailPanel(selected)}</aside>
      </section>
      <div class="drawer-overlay" id="drawer-overlay"></div>`;
    if (selected && window.matchMedia("(max-width: 900px)").matches) openDrawer();
  }

  function bind() {
    bindLocal();
    const selected = getSelectedEvent();
    if (selected && window.matchMedia("(max-width: 900px)").matches) openDrawer();
  }

  function bindLocal() {
    const main = document.querySelector("#app-main");
    const search = document.querySelector("#signal-search");
    const sort = document.querySelector("#signal-sort");
    if (search) search.oninput = (event) => { state.signalQuery = event.target.value.trim(); updateList(); };
    if (sort) sort.onchange = (event) => { state.signalSort = event.target.value; updateList(); };
    if (!main) return;
    main.onclick = (event) => {
      if (event.target.closest("#signals-reset")) {
        state.signalFilter = "all"; state.signalCategory = "all"; state.signalRisk = "all"; state.signalQuery = "";
        const input = document.querySelector("#signal-search"); if (input) input.value = "";
        updateRail(); updateList(); return;
      }
      const filter = event.target.closest("[data-signal-filter]");
      if (filter) { state.signalFilter = filter.dataset.signalFilter; updateRail(); updateList(); return; }
      const risk = event.target.closest("[data-signal-risk]");
      if (risk) { state.signalRisk = state.signalRisk === risk.dataset.signalRisk ? "all" : risk.dataset.signalRisk; updateRail(); updateList(); return; }
      const category = event.target.closest("[data-signal-category]");
      if (category) { state.signalCategory = state.signalCategory === category.dataset.signalCategory ? "all" : category.dataset.signalCategory; updateRail(); updateList(); return; }
      if (event.target.closest("[data-close-drawer]") || event.target.closest("#drawer-overlay")) { closeDrawer(); return; }
      const related = event.target.closest("[data-related-event]");
      if (related) { state.selectedEventId = related.dataset.relatedEvent; updateDetail(); updateList(); return; }
      const row = event.target.closest("#signals-list [data-event-id]");
      if (row) {
        state.selectedEventId = row.dataset.eventId;
        updateDetail(); updateList();
        if (window.matchMedia("(max-width: 900px)").matches) openDrawer();
      }
    };
  }

  function openDrawer() { document.body.classList.add("drawer-open"); }
  function closeDrawer() { document.body.classList.remove("drawer-open"); }
  function signalsHead(view) {
    return `
      <div class="page-title-block">
        <div class="eyebrow">${icon("radar", "icon icon-sm")}PUBLIC OPINION & RISK · WORKBENCH</div>
        <h1>${t("热点与风险工作台", "Signals & Risk Workbench")}</h1>
        <p>${t("筛选、排序并调查热点事件。打开事件查看来源证据链、风险依据，以及可供运营跟进的下一步动作。", "Filter, rank and investigate signals. Open any event for its evidence chain, risk rationale and operational follow-up guidance.")}</p>
      </div>
      <div class="page-head-side compact-stat-pair">
        <span><b>${view.stats.active}</b><small>${t("活跃信号", "Active")}</small></span>
        <span><b>${view.stats.risk}</b><small>${t("风险关注", "Risk watch")}</small></span>
        <span><b>${view.stats.unverified}</b><small>${t("待核实", "Unverified")}</small></span>
      </div>`;
  }

  function toolbar() {
    return `
      <div class="signals-toolbar-main">
        <label class="search-box signal-search-box">${icon("search")}<input id="signal-search" type="search" value="${escapeHTML(state.signalQuery)}" placeholder="${t("搜索事件、实体或标签…", "Search events, entities or tags…")}" aria-label="${t("搜索事件", "Search events")}"></label>
        <div class="toolbar-filter-row">${["all", "new", "rising", "risk", "unverified"].map((value) => `<button type="button" class="chip-filter ${state.signalFilter === value ? "active" : ""}" data-signal-filter="${value}">${filterName(value)}</button>`).join("")}</div>
        <select class="select-control" id="signal-sort" aria-label="${t("排序", "Sort")}"><option value="heat" ${state.signalSort === "heat" ? "selected" : ""}>${t("按热度排序", "Sort by heat")}</option><option value="risk" ${state.signalSort === "risk" ? "selected" : ""}>${t("按风险排序", "Sort by risk")}</option><option value="recent" ${state.signalSort === "recent" ? "selected" : ""}>${t("按最近更新", "Sort by last update")}</option></select>
        <button type="button" class="button button-ghost compact-button" id="signals-reset">${icon("refresh")}${t("重置", "Reset")}</button>
      </div>`;
  }

  function filterRail(view) {
    return `
      <div class="rail-heading"><div><span class="section-kicker">FILTERS</span><h2>${t("筛选事件", "Filter signals")}</h2></div>${icon("filter", "icon rail-icon")}</div>
      <div class="filter-group">${["all", "new", "rising", "risk", "unverified"].map((value) => `<button type="button" class="quick-filter ${state.signalFilter === value ? "active" : ""}" data-signal-filter="${value}"><span>${filterName(value)}</span><b>${filterCount(value)}</b></button>`).join("")}</div>
      <div class="rail-divider"></div><div class="filter-label">${t("风险等级", "Risk level")}</div>
      <div class="risk-filter-row">${["critical", "high", "medium", "low"].map((level) => `<button type="button" class="risk-filter ${level} ${state.signalRisk === level ? "active" : ""}" data-signal-risk="${level}">${riskName(level)}<b>${countRisk(level)}</b></button>`).join("")}</div>
      <div class="rail-divider"></div><div class="filter-label">${t("事件分类", "Category")}</div>
      <div class="category-filter-list">${view.categories.map(([category, count]) => `<button type="button" class="category-filter ${state.signalCategory === category ? "active" : ""}" data-signal-category="${escapeHTML(category)}"><span>${escapeHTML(category)}</span><b>${count}</b></button>`).join("")}</div>
      <div class="rail-note">${icon("file-search")}<span>${t("文档型证据链可在右侧详情查看。", "Open the right panel for source-level evidence.")}</span></div>`;
  }

  function filterName(value) {
    return ({ all: t("全部事件", "All signals"), new: t("新发现", "New"), rising: t("正在升温", "Rising"), risk: t("风险关注", "Risk watch"), unverified: t("待核实", "Unverified") })[value] || value;
  }
  function riskName(level) { return ({ critical: t("极高", "Critical"), high: t("高", "High"), medium: t("中", "Medium"), low: t("低", "Low") })[level] || level; }
  function filterCount(value) {
    const events = state.view.events;
    if (value === "all") return events.length;
    if (value === "risk") return events.filter((event) => event.risk >= 58).length;
    if (value === "unverified") return events.filter((event) => ["unverified", "corroborated"].includes(event.evidenceStatus)).length;
    return events.filter((event) => event.trackingStatus === value).length;
  }
  function countRisk(level) { return state.view.events.filter((event) => event.riskLevel === level).length; }

  function filteredEvents() {
    const query = state.signalQuery.toLowerCase();
    let events = state.view.events.filter((event) => {
      if (state.signalCategory !== "all" && event.category !== state.signalCategory) return false;
      if (state.signalRisk !== "all" && event.riskLevel !== state.signalRisk) return false;
      if (state.signalFilter === "risk" && event.risk < 58) return false;
      if (state.signalFilter === "unverified" && !["unverified", "corroborated"].includes(event.evidenceStatus)) return false;
      if (!["all", "risk", "unverified"].includes(state.signalFilter) && event.trackingStatus !== state.signalFilter) return false;
      if (!query) return true;
      return [event.title, event.summary, event.category, ...(event.tags || []), ...(event.entities || [])].join(" ").toLowerCase().includes(query);
    });
    events = events.sort((a, b) => state.signalSort === "risk" ? b.risk - a.risk : state.signalSort === "recent" ? b.lastUpdated - a.lastUpdated : (b.heat * .65 + b.risk * .35) - (a.heat * .65 + a.risk * .35));
    return events;
  }

  function getSelectedEvent() { return state.view.events.find((event) => event.id === state.selectedEventId) || null; }
  function updateRail() { const rail = document.querySelector("#signals-filter-rail"); if (rail) { rail.innerHTML = filterRail(state.view); } }
  function updateList() { const list = document.querySelector("#signals-list"); const count = document.querySelector("#signals-count"); if (!list) return; const events = filteredEvents(); list.innerHTML = signalRows(); if (count) count.textContent = `${events.length} ${t("个事件", "events")}`; }
  function signalRows() {
    const events = filteredEvents();
    if (!events.length) return `<div class="empty-state">${t("当前筛选下没有事件。", "No signals match the current filters.")}</div>`;
    return events.map((event, index) => `
      <button type="button" class="signal-row ${state.selectedEventId === event.id ? "selected" : ""}" data-event-id="${escapeHTML(event.id)}">
        <span class="signal-row-index">${String(index + 1).padStart(2, "0")}</span>
        <span class="signal-row-main">
          <span class="signal-row-topline"><span class="category-label">${escapeHTML(event.category)}</span><span class="status-chip monitoring">${escapeHTML(SF.trackingLabel(event.trackingStatus))}</span></span>
          <strong>${escapeHTML(event.title)}</strong>
          <span class="signal-row-meta">${event.sourceCount} ${t("来源", "sources")}<i></i>${t("首次发现", "First seen")} ${escapeHTML(SF.relativeTime(event.firstSeen))}<i></i>${t("更新", "Updated")} ${escapeHTML(SF.relativeTime(event.lastUpdated))}</span>
          <span class="signal-row-tags">${(event.tags || []).slice(0, 3).map((tag) => `<span>${escapeHTML(tag)}</span>`).join("")}</span>
        </span>
        <span class="signal-row-score"><span class="heat-value">${SF.formatNumber(event.heat)}</span><span class="risk-pill ${event.riskLevel}">${icon("alert-triangle", "icon icon-sm")}${escapeHTML(SF.riskLabel(event.risk))}</span></span>
      </button>`).join("");
  }

  function detailPanel(event) {
    if (!event) {
      return `<div class="detail-empty">${icon("file-search", "icon detail-empty-icon")}<span class="section-kicker">EVENT BRIEF</span><h2>${t("选择一个事件", "Select a signal")}</h2><p>${t("从左侧事件流打开事件，查看摘要、来源、风险依据与后续监测建议。", "Choose a signal to inspect its summary, sources, risk rationale and follow-up guidance.")}</p></div>`;
    }
    const sources = event.sources || [];
    const related = state.view.events.filter((candidate) => candidate.id !== event.id && (candidate.category === event.category || (candidate.tags || []).some((tag) => (event.tags || []).includes(tag)))).slice(0, 3);
    return `
      <div class="detail-panel-head"><span class="section-kicker">EVENT BRIEF · ${escapeHTML(event.category.toUpperCase())}</span><button class="icon-button drawer-close" type="button" data-close-drawer aria-label="${t("关闭详情", "Close detail")}">${icon("x")}</button></div>
      <h2 class="detail-panel-title">${escapeHTML(event.title)}</h2>
      <div class="detail-panel-badges"><span class="risk-pill ${event.riskLevel}">${icon("alert-triangle", "icon icon-sm")}${t("风险", "Risk")} ${escapeHTML(SF.riskLabel(event.risk))}</span>${SF.statusBadge(SF.evidenceClass(event.evidenceStatus), SF.evidenceLabel(event.evidenceStatus))}${SF.statusBadge("monitoring", SF.trackingLabel(event.trackingStatus))}</div>
      <p class="detail-panel-summary">${escapeHTML(event.summary)}</p>
      <div class="signal-metric-grid"><div><span>${t("热度", "HEAT")}</span><strong>${SF.formatNumber(event.heat)}</strong><small>${t("观察热度", "Observed heat")}</small></div><div><span>${t("来源", "SOURCES")}</span><strong>${event.sourceCount}</strong><small>${t("独立来源", "Independent sources")}</small></div><div><span>${t("首次发现", "FIRST SEEN")}</span><strong>${escapeHTML(SF.relativeTime(event.firstSeen))}</strong><small>${escapeHTML(SF.formatDateTime(event.firstSeen))}</small></div></div>
      <div class="detail-insight">${icon("activity", "icon icon-sm")}<p>${escapeHTML(event.analysis || t("暂无分析。", "No analysis available."))}</p></div>
      <section class="detail-section"><div class="detail-section-heading"><h3>${t("来源证据链", "Evidence chain")}</h3><span>${sources.length}</span></div><div class="evidence-list">${sources.length ? sources.map((source, index) => `<a class="evidence-link" href="${SF.safeUrl(source.url)}" target="_blank" rel="noopener noreferrer"><span class="evidence-number">${String(index + 1).padStart(2, "0")}</span><span class="evidence-main"><b>${escapeHTML(source.name || "Source")}</b><small>${escapeHTML(source.domain || SF.relativeTime(source.published))} · ${escapeHTML(SF.formatDateTime(source.published))}</small></span>${icon("external-link", "icon icon-sm")}</a>`).join("") : `<div class="empty-state">${t("暂无来源链接。", "No source links.")}</div>`}</div></section>
      <section class="detail-section"><div class="detail-section-heading"><h3>${t("风险依据", "Risk rationale")}</h3></div><p class="detail-paragraph">${escapeHTML(event.risk_reason || t("未发现强风险信号。", "No strong risk signal detected."))}</p></section>
      <section class="detail-section"><div class="detail-section-heading"><h3>${t("运营与监测建议", "Operations & monitoring guidance")}</h3></div><ul class="guidance-list"><li>${t("继续观察是否出现官方回应或第二个独立可靠来源。", "Watch for an official response or a second independent source.")}</li><li>${t("比较下一轮来源数量与风险词变化，避免把旧消息当作新热点。", "Compare source counts and risk terms in the next cycle; avoid treating old news as new.")}</li><li>${t("如涉及明确结果与截止时间，转入 Prediction Research 评估。", "If there is a clear outcome and deadline, assess it in Prediction Research.")}</li></ul></section>
      <section class="detail-section"><div class="detail-section-heading"><h3>${t("相关事件", "Related signals")}</h3></div><div class="related-list">${related.length ? related.map((item) => `<button type="button" class="related-event" data-related-event="${escapeHTML(item.id)}"><span>${escapeHTML(item.title)}</span><b class="risk-text">${escapeHTML(SF.riskLabel(item.risk))}</b></button>`).join("") : `<span class="muted-text">${t("暂无相关事件。", "No related signals.")}</span>`}</div></section>
      <div class="detail-panel-actions"><a class="button button-ghost" href="prediction.html">${icon("chart")}${t("查找预测候选", "Find prediction candidates")}</a></div>`;
  }

  function updateDetail() {
    const panel = document.querySelector("#signal-detail");
    if (panel) panel.innerHTML = detailPanel(getSelectedEvent());
  }
})();

