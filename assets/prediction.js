(() => {
  "use strict";

  const SF = window.SF;
  const { state, t, icon, escapeHTML } = SF;

  window.SF_PAGES.prediction = { render, bind };

  function render() {
    const view = state.view;
    const main = document.querySelector("#app-main");
    if (!view || !main) return;
    SF.setDocumentTitle(t("预测市场工作台", "Prediction Market Workbench"));
    const candidates = filteredCandidates();
    let selected = getSelectedCandidate();
    if (!selected && candidates.length) { selected = candidates[0]; state.selectedCandidateId = selected.id; }
    main.innerHTML = `
      <section class="page-head prediction-page-head">${predictionHead(view)}</section>
      <section class="panel prediction-tabs-panel">${tabs()}</section>
      <section class="prediction-layout">
        <section class="panel prediction-list-panel">
          <div class="prediction-list-heading"><div><span class="section-kicker">RESEARCH FUNNEL</span><h2>${t("候选事件", "Candidates")}</h2></div><span class="stream-count" id="prediction-count">${candidates.length} ${t("个候选", "candidates")}</span></div>
          <label class="search-box prediction-search-box">${icon("search")}<input id="prediction-search" type="search" value="${escapeHTML(state.predictionQuery)}" placeholder="${t("搜索市场问题或事件…", "Search market questions or events…")}" aria-label="${t("搜索预测候选", "Search prediction candidates")}"></label>
          <div class="prediction-candidate-list" id="prediction-list">${candidateRows(candidates)}</div>
        </section>
        <aside class="panel prediction-detail-panel" id="prediction-detail">${candidateDetail(selected)}</aside>
      </section>
      <div class="drawer-overlay" id="prediction-overlay"></div>`;
    bindLocal();
  }

  function bind() { bindLocal(); }

  function bindLocal() {
    const main = document.querySelector("#app-main");
    const search = document.querySelector("#prediction-search");
    if (search) search.oninput = (event) => { state.predictionQuery = event.target.value.trim(); updateList(); };
    if (!main) return;
    main.onclick = (event) => {
      const tab = event.target.closest("[data-prediction-tab]");
      if (tab) { state.predictionTab = tab.dataset.predictionTab; render(); return; }
      if (event.target.closest("[data-close-prediction]") || event.target.closest("#prediction-overlay")) { document.body.classList.remove("drawer-open"); return; }
      const row = event.target.closest("#prediction-list [data-candidate-id]");
      if (row) {
        state.selectedCandidateId = row.dataset.candidateId;
        updateList(); updateDetail();
        if (window.matchMedia("(max-width: 900px)").matches) document.body.classList.add("drawer-open");
      }
    };
  }

  function predictionHead(view) {
    return `
      <div class="page-title-block"><div class="eyebrow">${icon("chart", "icon icon-sm")}PREDICTION MARKETS · WORKBENCH</div><h1>${t("预测市场工作台", "Prediction Market Workbench")}</h1><p>${t("从热点中发现可验证的问题，再判断它是否具备明确结果、时间范围和真实市场关联。", "Turn signals into verifiable questions, then assess resolution clarity, deadlines and real market linkage.")}</p></div>
      <div class="page-head-side prediction-head-side"><div class="research-disclaimer">${icon("alert-triangle", "icon icon-sm")}${t("研究候选，不构成投资建议", "Research candidates, not investment advice")}</div><div class="compact-stat-pair"><span><b>${view.stats.marketLinked}</b><small>${t("市场关联", "Market linked")}</small></span><span><b>${view.stats.research - view.stats.marketLinked}</b><small>${t("研究候选", "Research only")}</small></span></div></div>`;
  }

  function tabs() {
    const all = state.view.predictionCandidates;
    const counts = { all: all.length, high: all.filter((candidate) => candidate.relevance === "high").length, upcoming: all.filter(isUpcoming).length, market: all.filter((candidate) => candidate.status === "market_linked").length };
    const labels = { all: t("全部候选", "All candidates"), high: t("高相关", "High relevance"), upcoming: t("即将到期", "Upcoming"), market: t("市场关联", "Market linked") };
    return `<div class="tabs" role="tablist">${Object.keys(labels).map((key) => `<button type="button" class="tab ${state.predictionTab === key ? "active" : ""}" data-prediction-tab="${key}" role="tab" aria-selected="${state.predictionTab === key}">${labels[key]}<b>${counts[key]}</b></button>`).join("")}</div>`;
  }

  function filteredCandidates() {
    const query = state.predictionQuery.toLowerCase();
    return state.view.predictionCandidates.filter((candidate) => {
      if (state.predictionTab === "high" && candidate.relevance !== "high") return false;
      if (state.predictionTab === "upcoming" && !isUpcoming(candidate)) return false;
      if (state.predictionTab === "market" && candidate.status !== "market_linked") return false;
      if (!query) return true;
      return [candidate.question, candidate.resolutionCriteria, candidate.relatedEvent?.title].join(" ").toLowerCase().includes(query);
    });
  }

  function isUpcoming(candidate) {
    if (!candidate.deadline) return false;
    const deadline = SF.validDate(candidate.deadline);
    return deadline && deadline > new Date() && deadline.getTime() - Date.now() <= 120 * 24 * 3600 * 1000;
  }

  function getSelectedCandidate() { return state.view.predictionCandidates.find((candidate) => candidate.id === state.selectedCandidateId) || null; }
  function candidateRows(candidates) {
    if (!candidates.length) return `<div class="empty-state">${t("当前筛选下没有候选。", "No candidates under the current filters.")}</div>`;
    return candidates.map((candidate) => `
      <button type="button" class="candidate-row ${state.selectedCandidateId === candidate.id ? "selected" : ""}" data-candidate-id="${escapeHTML(candidate.id)}">
        <span class="candidate-type ${candidate.status === "market_linked" ? "market" : "research"}">${candidate.status === "market_linked" ? t("市场关联", "MARKET LINKED") : t("研究候选", "RESEARCH CANDIDATE")}</span>
        <strong>${escapeHTML(candidate.question)}</strong>
        <span class="candidate-meta">${candidate.deadline ? `${t("截止", "Deadline")} ${escapeHTML(SF.formatDate(candidate.deadline))}` : t("截止时间待定义", "Deadline to be defined")}<i></i>${candidate.relatedEvent ? escapeHTML(candidate.relatedEvent.category) : t("暂无关联事件", "No linked event")}</span>
        <span class="candidate-footer"><span>${candidate.probability != null ? `<b>${candidate.probability}%</b> YES` : t("待建立可验证条件", "Resolution criteria pending")}</span><span>${candidate.volume != null ? SF.formatVolume(candidate.volume) : t("研究候选", "Research only")}</span></span>
      </button>`).join("");
  }

  function candidateDetail(candidate) {
    if (!candidate) {
      return `<div class="detail-empty">${icon("file-search", "icon detail-empty-icon")}<span class="section-kicker">RESEARCH BRIEF</span><h2>${t("选择研究候选", "Select a research candidate")}</h2><p>${t("从左侧列表选择一个候选，查看结算条件、市场关联和事件背景。", "Choose a candidate to review resolution criteria, market linkage and the related event.")}</p></div>`;
    }
    const related = candidate.relatedEvent;
    return `
      <div class="detail-panel-head"><span class="section-kicker">RESEARCH BRIEF · ${candidate.status === "market_linked" ? "MARKET" : "CANDIDATE"}</span><button class="icon-button drawer-close" type="button" data-close-prediction aria-label="${t("关闭详情", "Close detail")}">${icon("x")}</button></div>
      <div class="candidate-detail-type ${candidate.status === "market_linked" ? "market" : "research"}">${candidate.status === "market_linked" ? t("公开市场关联", "Market linked") : t("研究候选", "Research candidate")}</div>
      <h2 class="detail-panel-title">${escapeHTML(candidate.question)}</h2>
      <div class="metric-grid prediction-metrics"><div class="metric-box"><span>${t("概率", "PROBABILITY")}</span><strong>${candidate.probability != null ? `${candidate.probability}%` : "—"}</strong><small>${candidate.status === "market_linked" ? "YES" : t("尚不适用", "Not applicable")}</small></div><div class="metric-box"><span>${t("成交量", "VOLUME")}</span><strong>${candidate.volume != null ? SF.formatVolume(candidate.volume) : "—"}</strong><small>${t("24h 成交", "24h volume")}</small></div><div class="metric-box"><span>${t("截止时间", "DEADLINE")}</span><strong>${candidate.deadline ? escapeHTML(SF.formatDate(candidate.deadline)) : "—"}</strong><small>${candidate.deadline ? t("市场截止日期", "Market deadline") : t("待定义", "To define")}</small></div></div>
      <section class="detail-section"><div class="detail-section-heading"><h3>${t("候选问题", "Proposed question")}</h3></div><p class="detail-paragraph">${escapeHTML(candidate.question)}</p></section>
      <section class="detail-section"><div class="detail-section-heading"><h3>${t("结算 / 验证条件", "Resolution criteria")}</h3></div><p class="detail-paragraph">${escapeHTML(candidate.resolutionCriteria)}</p></section>
      <section class="detail-section"><div class="detail-section-heading"><h3>${t("事件与市场关联", "Event-market linkage")}</h3></div>${related ? `<a class="linked-event-card" href="signals.html?event=${encodeURIComponent(related.id)}"><span class="category-label">${escapeHTML(related.category)}</span><strong>${escapeHTML(related.title)}</strong><small>${related.sourceCount} ${t("来源", "sources")} · ${t("风险", "Risk")} ${related.risk} · ${t("热度", "Heat")} ${related.heat}</small>${icon("arrow-up-right", "icon icon-sm")}</a>` : `<p class="detail-paragraph muted-text">${t("当前还没有与候选问题关联的事件。", "No event is currently linked to this question.")}</p>`}</section>
      <section class="detail-section"><div class="detail-section-heading"><h3>${t("研究备注", "Research note")}</h3></div><p class="detail-paragraph">${escapeHTML(candidate.notes)}</p></section>
      <div class="detail-panel-actions">${candidate.marketUrl ? `<a class="button button-primary" href="${SF.safeUrl(candidate.marketUrl)}" target="_blank" rel="noopener noreferrer">${icon("external-link")}${t("打开公开市场", "Open public market")}</a>` : `<span class="research-status-note">${icon("file-search", "icon icon-sm")}${t("尚未匹配真实市场，保留为研究候选。", "No live market matched; retained as a research candidate.")}</span>`}</div>`;
  }

  function updateList() {
    const list = document.querySelector("#prediction-list");
    const count = document.querySelector("#prediction-count");
    if (!list) return;
    const candidates = filteredCandidates();
    list.innerHTML = candidateRows(candidates);
    if (count) count.textContent = `${candidates.length} ${t("个候选", "candidates")}`;
    if (!getSelectedCandidate() && candidates.length) {
      state.selectedCandidateId = candidates[0].id;
      updateDetail();
    }
  }

  function updateDetail() {
    const panel = document.querySelector("#prediction-detail");
    if (panel) panel.innerHTML = candidateDetail(getSelectedCandidate());
  }
})();



