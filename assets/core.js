(() => {
  "use strict";

  const APP_PAGE = document.body.dataset.page || "overview";
  const DATA_FALLBACK = window.LATEST_DATA || null;
  const STORAGE_LANG = "signalfi-language";
  const state = {
    data: null,
    view: null,
    lang: localStorage.getItem(STORAGE_LANG) === "en" ? "en" : "zh",
    loading: false,
    overviewFilter: "all",
    overviewCategory: "all",
    signalFilter: "all",
    signalCategory: "all",
    signalRisk: "all",
    signalQuery: "",
    signalSort: "heat",
    selectedEventId: new URLSearchParams(location.search).get("event"),
    predictionTab: "all",
    selectedCandidateId: new URLSearchParams(location.search).get("candidate"),
    predictionQuery: "",
  };

  const ICON_SPRITE = `
  <svg class="icon-sprite" aria-hidden="true" focusable="false">
    <symbol id="icon-signalfi-mark" viewBox="0 0 64 64">
      <g fill="none" stroke-linecap="round">
        <circle cx="32" cy="32" r="11" pathLength="100" stroke="var(--brand-blue)" stroke-width="3" stroke-dasharray="72 28" transform="rotate(-105 32 32)"/>
        <circle cx="32" cy="32" r="20" pathLength="100" stroke="var(--brand-blue)" stroke-width="2.6" stroke-dasharray="72 28" stroke-opacity=".72" transform="rotate(-105 32 32)"/>
        <circle cx="32" cy="32" r="28" pathLength="100" stroke="var(--brand-blue-bright)" stroke-width="2.2" stroke-dasharray="72 28" stroke-opacity=".45" transform="rotate(-105 32 32)"/>
      </g>
      <circle cx="32" cy="32" r="4.2" fill="var(--signal-cyan)"/>
      <circle cx="48.5" cy="18.5" r="3.6" fill="var(--signal-cyan)"/>
    </symbol>
    <symbol id="icon-layout-dashboard" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></symbol>
    <symbol id="icon-radar" viewBox="0 0 24 24"><path d="M19.07 4.93A10 10 0 0 0 6.99 3.34"/><path d="M4 6h.01"/><path d="M2.29 9.62A10 10 0 1 0 21.31 8.35"/><path d="M16.24 7.76A6 6 0 1 0 8.23 16.67"/><path d="M12 18h.01"/><path d="M17.99 11.66A6 6 0 0 1 15.77 16.67"/><circle cx="12" cy="12" r="2"/><path d="m13.41 10.59 5.66-5.66"/></symbol>
    <symbol id="icon-chart" viewBox="0 0 24 24"><path d="M12 16v6"/><path d="M16 20v2"/><path d="M20 18v4"/><path d="M4 20v2"/><path d="M8 16v6"/><path d="m2 10 6.4-5.3a2 2 0 0 1 2.5 0L14 7l6-5"/></symbol>
    <symbol id="icon-book-open" viewBox="0 0 24 24"><path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/></symbol>
    <symbol id="icon-refresh" viewBox="0 0 24 24"><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></symbol>
    <symbol id="icon-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></symbol>
    <symbol id="icon-x" viewBox="0 0 24 24"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></symbol>
    <symbol id="icon-arrow-right" viewBox="0 0 24 24"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></symbol>
    <symbol id="icon-arrow-up-right" viewBox="0 0 24 24"><path d="M7 17 17 7"/><path d="M7 7h10v10"/></symbol>
    <symbol id="icon-bell-ring" viewBox="0 0 24 24"><path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M22 8c0-2.3-.8-4.3-2-6"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/><path d="M4 2C2.8 3.7 2 5.7 2 8"/></symbol>
    <symbol id="icon-database" viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/></symbol>
    <symbol id="icon-activity" viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></symbol>
    <symbol id="icon-external-link" viewBox="0 0 24 24"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></symbol>
    <symbol id="icon-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></symbol>
    <symbol id="icon-alert-triangle" viewBox="0 0 24 24"><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></symbol>
    <symbol id="icon-calendar" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></symbol>
    <symbol id="icon-file-search" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><circle cx="11" cy="14" r="2"/><path d="m13 16 2 2"/></symbol>
    <symbol id="icon-tags" viewBox="0 0 24 24"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/></symbol>
    <symbol id="icon-settings" viewBox="0 0 24 24"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></symbol>
    <symbol id="icon-menu" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></symbol>
    <symbol id="icon-download" viewBox="0 0 24 24"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></symbol>
    <symbol id="icon-filter" viewBox="0 0 24 24"><path d="M3 6h18M7 12h10M10 18h4"/></symbol>
    <symbol id="icon-chevron-down" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></symbol>
  </svg>`;

  const CATEGORY_EN = { "监管": "Regulation", "安全": "Security", "预测市场": "Prediction Markets", "社区": "Community", "市场": "Markets", "技术": "Technology", "交易所": "Exchanges", "行业": "Industry" };

  const NAV_ITEMS = [
    { page: "overview", href: "index.html", labelZh: "总览", labelEn: "Overview", icon: "layout-dashboard" },
    { page: "signals", href: "signals.html", labelZh: "热点风险", labelEn: "Signals", icon: "radar" },
    { page: "prediction", href: "prediction.html", labelZh: "预测市场", labelEn: "Prediction Research", icon: "chart" },
    { page: "methodology", href: "methodology.html", labelZh: "产品说明", labelEn: "Product Guide", icon: "book-open" },
  ];

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    document.body.insertAdjacentHTML("afterbegin", ICON_SPRITE);
    renderHeader();
    renderFooter();
    bindGlobalEvents();
    renderLoading();
    await loadData({ initial: true });
    window.setInterval(() => {
      if (document.visibilityState === "visible") loadData({ silent: true });
    }, 300_000);
  }

  function t(zh, en) {
    return state.lang === "en" ? en : zh;
  }

  function icon(name, className = "icon") {
    return `<svg class="${className}" aria-hidden="true"><use href="#icon-${name}"></use></svg>`;
  }
  function renderHeader() {
    const header = $("#site-header");
    if (!header) return;
    const nav = NAV_ITEMS.map((item) => `
      <a class="nav-link ${APP_PAGE === item.page ? "active" : ""}" href="${item.href}" ${APP_PAGE === item.page ? 'aria-current="page"' : ""}>
        ${icon(item.icon, "icon nav-icon")}<span>${t(item.labelZh, item.labelEn)}</span>
      </a>
    `).join("");
    const mobileNav = NAV_ITEMS.map((item) => `
      <a class="mobile-nav-link ${APP_PAGE === item.page ? "active" : ""}" href="${item.href}">
        ${icon(item.icon, "icon nav-icon")}<span>${t(item.labelZh, item.labelEn)}</span>
      </a>
    `).join("");
    header.innerHTML = `
      <header class="site-header">
        <div class="header-inner">
          <a class="brand" href="index.html" aria-label="SignalFi home">
            <svg class="brand-logo" viewBox="0 0 64 64" aria-hidden="true"><use href="#icon-signalfi-mark"></use></svg>
            <span class="brand-copy">
              <strong class="brand-wordmark">Signal<span>Fi</span></strong>
              <small>WEB3 INTELLIGENCE TERMINAL</small>
            </span>
          </a>
          <nav class="header-nav" aria-label="Primary navigation">${nav}</nav>
          <div class="header-actions">
            <span class="mode-pill" id="mode-pill"><span class="status-dot"></span><span id="mode-label">${t("连接中", "CONNECTING")}</span></span>
            <span class="header-sync" id="header-sync">${t("最后同步", "LAST SYNC")} —</span>
            <button class="lang-toggle" id="lang-toggle" type="button" aria-label="${t("切换为英文", "Switch to Chinese")}" title="${t("切换为英文", "Switch to Chinese")}">
              <span class="${state.lang === "zh" ? "active" : ""}">中</span><i>/</i><span class="${state.lang === "en" ? "active" : ""}">EN</span>
            </button>
            <button class="icon-button" id="refresh-button" type="button" aria-label="${t("刷新数据", "Refresh data")}" title="${t("刷新数据", "Refresh data")}">${icon("refresh")}</button>
            <button class="icon-button mobile-menu-button" id="mobile-menu-button" type="button" aria-label="${t("打开导航", "Open navigation")}" aria-expanded="false">${icon("menu")}</button>
          </div>
        </div>
        <div class="prototype-strip"><span class="prototype-badge">PORTFOLIO PROTOTYPE · v2.0.1</span><span>${t("面向 Web3 运营与预测市场研究 · 公开 RSS/API 自动快照 · 每 6 小时尝试更新 · 非实时生产系统", "Web3 operations & prediction research · automated public RSS/API snapshot · refresh attempt every 6 hours · not a real-time production system")}</span></div>
        <nav class="mobile-nav" id="mobile-nav" aria-label="Mobile navigation">${mobileNav}</nav>
      </header>
    `;
  }

  function renderFooter() {
    const footer = $("#site-footer");
    if (!footer) return;
    footer.innerHTML = `
      <footer class="site-footer footer-shell">
        <div class="footer-brand">
          <div class="footer-wordmark">Signal<span>Fi</span></div>
          <p>${t("Web3 热点、舆情与预测市场研究终端", "Web3 signals, public opinion and prediction-market research")}</p>
        </div>
        <div class="footer-links">
          <a href="index.html">${t("总览", "Overview")}</a>
          <a href="signals.html">${t("舆情监测", "Signals")}</a>
          <a href="prediction.html">${t("预测市场", "Prediction Research")}</a>
          <a href="methodology.html">${t("产品说明", "Product Guide")}</a>
        </div>
        <div class="footer-meta">
          <span>${t("公开数据观察 · 非投资建议", "Observed public data · Not financial advice")}</span>
          <span>SignalFi · Portfolio Prototype v2.0</span>
        </div>
      </footer>
    `;
  }

  function bindGlobalEvents() {
    $("#refresh-button")?.addEventListener("click", () => loadData({ manual: true }));
    $("#lang-toggle")?.addEventListener("click", toggleLanguage);
    $("#mobile-menu-button")?.addEventListener("click", toggleMobileNav);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        document.body.classList.remove("nav-open", "drawer-open");
        $("#mobile-menu-button")?.setAttribute("aria-expanded", "false");
      }
      if (event.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) {
        const search = $("#signal-search") || $("#prediction-search");
        if (search) {
          event.preventDefault();
          search.focus();
        }
      }
    });
  }

  function toggleLanguage() {
    state.lang = state.lang === "zh" ? "en" : "zh";
    localStorage.setItem(STORAGE_LANG, state.lang);
    document.documentElement.lang = state.lang === "en" ? "en" : "zh-CN";
    renderHeader();
    renderFooter();
    bindGlobalEvents();
    if (state.data) { state.view = buildViewModel(state.data); renderPage(); }
    updateHeaderData();
  }

  function toggleMobileNav() {
    const open = document.body.classList.toggle("nav-open");
    $("#mobile-menu-button")?.setAttribute("aria-expanded", String(open));
  }

  async function loadData({ initial = false, silent = false, manual = false } = {}) {
    if (state.loading) return;
    state.loading = true;
    $("#refresh-button")?.classList.add("loading");
    try {
      const response = await fetch(`data/latest.json?t=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      state.data = await response.json();
      if (manual) toast(t("数据已刷新", "Data refreshed"));
    } catch (error) {
      if (!state.data) state.data = DATA_FALLBACK;
      if (manual) toast(t("无法读取最新文件，显示内置快照", "Latest file unavailable; showing the embedded snapshot"));
    } finally {
      state.loading = false;
      $("#refresh-button")?.classList.remove("loading");
      if (state.data) {
        state.view = buildViewModel(state.data);
        renderPage();
        updateHeaderData();
      } else {
        renderError();
      }
    }
  }

  function updateHeaderData() {
    if (!state.data || !state.view) return;
    const live = state.data.mode !== "demo";
    const pill = $("#mode-pill");
    pill?.classList.toggle("demo", !live);
    if ($("#mode-label")) $("#mode-label").textContent = live ? t("自动快照", "AUTO SNAPSHOT") : t("示例数据", "SAMPLE DATA");
    if ($("#header-sync")) $("#header-sync").textContent = `${t("最后同步", "LAST SYNC")} ${formatSyncTime(state.view.generatedAt)}`;
  }

  function renderPage() {
    if (!state.data || !state.view) return;
    const renderer = window.SF_PAGES?.[APP_PAGE];
    if (renderer) {
      renderer.render(state, window.SF);
      renderer.bind?.(state, window.SF);
    } else {
      renderError();
    }
  }

  function renderLoading() {
    const main = $("#app-main");
    if (!main) return;
    main.innerHTML = `
      <div class="page-loading">
        <span class="loading-orbit">${icon("radar")}</span>
        <strong>${t("正在连接 SignalFi 数据层", "Connecting to the SignalFi data layer")}</strong>
        <p>${t("读取公开事件、市场信号与来源状态…", "Loading observed events, market signals and source health…")}</p>
      </div>`;
  }

  function renderError() {
    const main = $("#app-main");
    if (!main) return;
    main.innerHTML = `
      <div class="page-error panel">
        <span class="section-kicker">DATA LAYER</span>
        <h1>${t("暂时无法载入数据", "Data is temporarily unavailable")}</h1>
        <p>${t("请运行 python scripts/collect.py 生成 data/latest.json，然后刷新页面。", "Run python scripts/collect.py to generate data/latest.json, then refresh.")}</p>
        <button class="button button-primary" id="retry-data" type="button">${t("重新连接", "Retry")}</button>
      </div>`;
    $("#retry-data")?.addEventListener("click", () => loadData({ manual: true }));
  }
  function buildViewModel(data) {
    const generatedAt = data.generated_at || new Date().toISOString();
    const events = (data.events || [])
      .map((event) => normalizeEvent(event, generatedAt))
      .sort((a, b) => (b.heat * 0.58 + b.risk * 0.42) - (a.heat * 0.58 + a.risk * 0.42));
    const sources = (data.sources || []).map((source) => ({ ...source, ok: source.status === "ok" }));
    const categories = Object.entries(events.reduce((acc, event) => {
      acc[event.category] = (acc[event.category] || 0) + 1;
      return acc;
    }, {})).sort((a, b) => b[1] - a[1]);
    const predictionCandidates = buildPredictionCandidates(data, events);
    const rising = events.filter((event) => event.trackingStatus === "rising");
    const highRisk = events.filter((event) => event.risk >= 58);
    const unverified = events.filter((event) => ["unverified", "corroborated"].includes(event.evidenceStatus));
    const activeSources = sources.filter((source) => source.ok).length;
    const stats = {
      active: events.length,
      rising: rising.length,
      risk: highRisk.length,
      research: predictionCandidates.length,
      marketLinked: predictionCandidates.filter((candidate) => candidate.status === "market_linked").length,
      scanned: Number(data.stats?.scanned_items) || events.reduce((total, event) => total + event.sourceCount, 0),
      sentiment: Number(data.stats?.sentiment_index) || 50,
      riskIndex: Number(data.stats?.risk_index) || 0,
      activeSources,
      totalSources: sources.length,
      unverified: unverified.length,
    };
    return {
      generatedAt,
      mode: data.mode === "demo" ? "demo" : "live",
      notice: data.notice || "",
      events,
      sources,
      sourceNames: sources.map((source) => source.name),
      categories,
      predictionCandidates,
      stats,
      trend: data.trend || { values: [20, 30, 25, 42, 36, 54], labels: ["24h", "20h", "16h", "12h", "8h", "Now"] },
      market: data.market || {},
      report: data.report || {},
      methodology: data.methodology || {},
    };
  }

  function normalizeEvent(event, generatedAt) {
    const publishedAt = validDate(event.published_at) || validDate(generatedAt) || new Date();
    const sourceDates = (event.sources || []).map((source) => validDate(source.published_at)).filter(Boolean).sort((a, b) => a - b);
    const firstSeen = validDate(event.first_seen) || sourceDates[0] || publishedAt;
    const lastUpdated = validDate(event.last_updated) || sourceDates.at(-1) || publishedAt;
    const ageHours = Math.max(0, (Date.now() - lastUpdated.getTime()) / 3_600_000);
    const heat = clamp(Number(event.heat) || 0, 0, 100);
    const risk = clamp(Number(event.risk) || 0, 0, 100);
    const sourceCount = Number(event.source_count) || (event.sources || []).length;
    const trackingStatus = event.tracking_status || (ageHours <= 6 ? "new" : heat >= 55 && ageHours <= 24 ? "rising" : "monitoring");
    const evidenceStatus = event.evidence_status || (sourceCount >= 3 ? "multi_source" : sourceCount >= 2 ? "corroborated" : "unverified");
    const originalTitle = event.title || "";
    const originalSummary = event.summary || "";
    const originalCategory = event.category || "行业";
    return {
      ...event,
      title: state.lang === "zh" ? (event.title_zh || originalTitle) : originalTitle,
      summary: state.lang === "zh" ? (event.summary_zh || originalSummary) : originalSummary,
      category: state.lang === "en" ? (CATEGORY_EN[originalCategory] || originalCategory) : originalCategory,
      title_original: originalTitle,
      summary_original: originalSummary,
      category_original: originalCategory,
      risk,
      heat,
      sourceCount,
      riskLevel: event.risk_level || riskLevelFromScore(risk),
      sentiment: clamp(Number(event.sentiment) || 50, 0, 100),
      firstSeen,
      lastUpdated,
      publishedAt,
      trackingStatus,
      evidenceStatus,
      ageHours,
      sources: (event.sources || []).map((source) => ({
        ...source,
        published: validDate(source.published_at) || publishedAt,
        domain: sourceDomain(source.url),
      })).sort((a, b) => b.published - a.published),
    };
  }

  function buildPredictionCandidates(data, events) {
    const markets = (data.prediction_markets || []).map((market, index) => {
      const relatedEvent = findRelatedEvent(market.question || "", events);
      const highRelevance = Boolean(relatedEvent && (relatedEvent.risk >= 58 || relatedEvent.heat >= 62));
      return {
        id: `market-${index}`,
        status: "market_linked",
        question: state.lang === "zh" && market.question_zh ? market.question_zh : (market.question || "Untitled market"),
        resolutionCriteria: market.resolution_criteria || t("以公开预测市场的官方结算规则和结果来源为准。", "Use the public market's official resolution rules and designated source."),
        deadline: validDate(market.end_date)?.toISOString() || null,
        marketUrl: market.url || "",
        probability: numberOrNull(market.probability),
        volume: numberOrNull(market.volume),
        relatedEvent,
        relevance: highRelevance ? "high" : "normal",
        isDemo: Boolean(market.is_demo),
        notes: t("系统已找到公开市场；仍需人工确认问题定义、截止时间和结算条件。", "A public market was found; verify the question, deadline and resolution rules manually."),
      };
    });
    const linkedIds = new Set(markets.map((market) => market.relatedEvent?.id).filter(Boolean));
    const researchEvents = events.filter((event) => !linkedIds.has(event.id)).slice(0, 3).map((event) => ({
      id: `research-${event.id}`,
      status: "research_candidate",
      question: t(
        `围绕「${shortText(event.title, 56)}」，未来 30 天内是否会出现可核实的关键进展？`,
        `Could "${shortText(event.title, 72)}" produce a verifiable follow-up within 30 days?`
      ),
      resolutionCriteria: t("待定义：需要明确的结果、截止时间和独立可验证来源。", "To define: a concrete outcome, deadline and independent verifiable source."),
      deadline: null,
      marketUrl: "",
      probability: null,
      volume: null,
      relatedEvent: event,
      relevance: event.risk >= 58 || event.heat >= 65 ? "high" : "normal",
      isDemo: event.is_demo,
      notes: t("当前为研究候选，不代表已有真实盘口。", "This is a research candidate, not a live market."),
    }));
    return [...markets, ...researchEvents];
  }

  function findRelatedEvent(question, events) {
    const terms = tokenize(question).filter((term) => term.length >= 4);
    if (!terms.length) return null;
    let best = null;
    let bestScore = 0;
    for (const event of events) {
      const haystack = `${event.title} ${event.summary} ${event.title_original || ""} ${event.summary_original || ""} ${(event.tags || []).join(" ")}`.toLowerCase();
      const score = terms.reduce((total, term) => total + (haystack.includes(term) ? 1 : 0), 0);
      if (score > bestScore) { best = event; bestScore = score; }
    }
    return bestScore >= 2 ? best : null;
  }

  function tokenize(value) {
    return (value || "").toLowerCase().match(/[a-z0-9]{3,}|[\u4e00-\u9fff]{2,}/g) || [];
  }
  function riskLevelFromScore(value) {
    const score = Number(value) || 0;
    if (score >= 75) return "critical";
    if (score >= 58) return "high";
    if (score >= 40) return "medium";
    return "low";
  }

  function riskLabel(value) {
    const score = Number(value) || 0;
    if (score >= 75) return t("极高", "Critical");
    if (score >= 58) return t("高", "High");
    if (score >= 40) return t("中", "Medium");
    return t("低", "Low");
  }

  function trackingLabel(status) {
    return ({ new: t("新发现", "New"), rising: t("正在升温", "Rising"), monitoring: t("持续观察", "Monitoring"), stable: t("稳定", "Stable"), cooling: t("降温", "Cooling"), resolved: t("已闭环", "Resolved") })[status] || status;
  }

  function evidenceLabel(status) {
    return ({ confirmed: t("已确认", "Confirmed"), corroborated: t("多源观察", "Corroborated"), multi_source: t("多源观察", "Multi-source"), unverified: t("待核实", "Unverified"), disputed: t("存在争议", "Disputed") })[status] || status;
  }

  function evidenceClass(status) {
    if (status === "confirmed") return "confirmed";
    if (status === "unverified" || status === "disputed") return "unverified";
    return "monitoring";
  }

  function statusBadge(status, label, prefix = "") {
    const badgeIcon = status === "risk" ? "alert-triangle" : status === "research" ? "file-search" : "radar";
    return `<span class="status-chip ${escapeHTML(status)}">${prefix}${icon(badgeIcon, "icon icon-sm")}${escapeHTML(label)}</span>`;
  }

  function formatNumber(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return "—";
    return new Intl.NumberFormat(state.lang === "en" ? "en-US" : "zh-CN").format(number);
  }

  function formatPrice(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return "—";
    const digits = number >= 1000 ? 0 : number >= 10 ? 2 : 4;
    return `$${new Intl.NumberFormat("en-US", { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(number)}`;
  }

  function formatVolume(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return "—";
    if (number >= 1e9) return `$${(number / 1e9).toFixed(1)}B`;
    if (number >= 1e6) return `$${(number / 1e6).toFixed(1)}M`;
    if (number >= 1e3) return `$${(number / 1e3).toFixed(1)}K`;
    return `$${number.toFixed(0)}`;
  }

  function formatDateTime(value) {
    const date = value instanceof Date ? value : validDate(value);
    if (!date) return "—";
    return new Intl.DateTimeFormat(state.lang === "en" ? "en-GB" : "zh-CN", { timeZone: "Asia/Shanghai", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
  }

  function formatDate(value) {
    const date = value instanceof Date ? value : validDate(value);
    if (!date) return "—";
    return new Intl.DateTimeFormat(state.lang === "en" ? "en-GB" : "zh-CN", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
  }

  function formatSyncTime(value) {
    const date = validDate(value);
    if (!date) return "—";
    return new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Shanghai", hour: "2-digit", minute: "2-digit", hour12: false }).format(date) + " CST";
  }

  function relativeTime(value) {
    const date = validDate(value);
    if (!date) return t("未知时间", "Unknown time");
    const minutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60_000));
    if (minutes < 1) return t("刚刚", "Just now");
    if (minutes < 60) return state.lang === "en" ? `${minutes}m ago` : `${minutes} 分钟前`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return state.lang === "en" ? `${hours}h ago` : `${hours} 小时前`;
    const days = Math.round(hours / 24);
    return state.lang === "en" ? `${days}d ago` : `${days} 天前`;
  }

  function validDate(value) {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function numberOrNull(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, Number(value) || 0));
  }

  function shortText(value, length) {
    const text = String(value || "").trim();
    return text.length > length ? `${text.slice(0, length - 1).trim()}…` : text;
  }

  function sourceDomain(value) {
    try { return new URL(value).hostname.replace(/^www\./, ""); } catch { return ""; }
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[character]));
  }

  function safeUrl(value) {
    try {
      const url = new URL(value, location.href);
      return ["http:", "https:"].includes(url.protocol) ? url.href : "#";
    } catch { return "#"; }
  }

  function setDocumentTitle(title) {
    document.title = `${title} · SignalFi`;
  }

  let toastTimer = null;
  function toast(message) {
    let element = $("#signal-toast");
    if (!element) {
      document.body.insertAdjacentHTML("beforeend", `<div class="toast" id="signal-toast" role="status" aria-live="polite"></div>`);
      element = $("#signal-toast");
    }
    element.textContent = message;
    element.classList.add("show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => element.classList.remove("show"), 3000);
  }
  function ensureBriefDialog() {
    if ($("#brief-dialog")) return;
    document.body.insertAdjacentHTML("beforeend", `
      <dialog class="dialog brief-dialog" id="brief-dialog" aria-labelledby="brief-dialog-title">
        <div class="dialog-shell">
          <button class="dialog-close" type="button" data-close-dialog aria-label="${t("关闭", "Close")}">${icon("x")}</button>
          <div id="brief-dialog-content"></div>
        </div>
      </dialog>`);
    $("#brief-dialog [data-close-dialog]")?.addEventListener("click", () => $("#brief-dialog")?.close());
    $("#brief-dialog")?.addEventListener("click", (event) => {
      if (event.target.id === "brief-dialog") $("#brief-dialog").close();
    });
  }

  function openBrief() {
    ensureBriefDialog();
    const dialog = $("#brief-dialog");
    const content = $("#brief-dialog-content");
    if (!dialog || !content || !state.view) return;
    const report = state.view.report;
    const top = [...state.view.events].sort((a, b) => (b.risk * 0.6 + b.heat * 0.4) - (a.risk * 0.6 + a.heat * 0.4)).slice(0, 5);
    content.innerHTML = `
      <div class="detail-kicker">AUTO-GENERATED INTELLIGENCE · ${escapeHTML(state.view.mode.toUpperCase())}</div>
      <h2 class="detail-title" id="brief-dialog-title">${escapeHTML(report.headline || t("今日 Web3 舆情简报", "Today's Web3 Intelligence Brief"))}</h2>
      <div class="detail-meta"><span>${escapeHTML(report.generated_by || "Rule engine")}</span><span>${escapeHTML(formatDateTime(report.generated_at || state.view.generatedAt))}</span><span>${report.ai_used ? "AI assisted" : "Rule based"}</span></div>
      <div class="report-actions">
        <button class="button button-primary" id="download-markdown" type="button">${icon("download")}${t("导出 Markdown", "Export Markdown")}</button>
        <button class="button button-ghost" id="download-pdf" type="button">${icon("download")}${t("下载 PDF", "Download PDF")}</button>
      </div>
      <div class="report-section"><h3>${t("总体判断", "EXECUTIVE SUMMARY")}</h3><p>${escapeHTML(report.summary || t("暂无总结。", "No summary available."))}</p></div>
      <div class="report-section"><h3>${t("风险展望", "RISK OUTLOOK")}</h3><p>${escapeHTML(report.risk_outlook || t("暂无风险展望。", "No risk outlook available."))}</p></div>
      <div class="report-section"><h3>${t("建议动作", "NEXT ACTIONS")}</h3><ul class="report-action-list">${(report.actions || []).map((action) => `<li>${escapeHTML(action)}</li>`).join("") || `<li>${t("等待下一轮数据更新。", "Wait for the next data refresh.")}</li>`}</ul></div>
      <div class="report-section"><h3>${t("优先信号", "TOP SIGNALS")}</h3><div class="report-event-list">${top.map((event) => `<div class="report-event"><span>${escapeHTML(event.title)}</span><b>${t("风险", "Risk")} ${formatNumber(event.risk)} · ${t("热度", "Heat")} ${formatNumber(event.heat)}</b></div>`).join("")}</div></div>
      <div class="report-section"><h3>${t("数据说明", "DATA NOTE")}</h3><p>${escapeHTML(state.view.notice || t("数据来自公开 RSS、市场 API 和预测市场 API。", "Data comes from public RSS, market APIs and prediction-market APIs."))}</p></div>`;
    $("#download-markdown")?.addEventListener("click", downloadMarkdown);
    $("#download-pdf")?.addEventListener("click", downloadPdf);
    dialog.showModal();
  }
  async function downloadPdf() {
    const JsPDF = window.jspdf?.jsPDF;
    if (!JsPDF) {
      toast(t("PDF 组件未加载，请刷新页面后重试", "PDF library is not loaded; refresh and try again"));
      return;
    }
    $("#brief-dialog")?.close();
    await new Promise((resolve) => setTimeout(resolve, 120));
    const canvases = renderPdfCanvases();
    const pdf = new JsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
    canvases.forEach((canvas, index) => {
      if (index > 0) pdf.addPage();
      pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, 210, 297);
    });
    pdf.save(`signalfi-intelligence-brief-${new Date().toISOString().slice(0, 10)}.pdf`);
    toast(t("PDF 简报已下载", "PDF brief downloaded"));
  }

  function renderPdfCanvases() {
    const view = state.view;
    const report = view.report;
    const pages = [];
    const width = 1240;
    const height = 1754;
    const margin = 92;
    const contentWidth = width - margin * 2;
    let canvas;
    let ctx;
    let y = margin;

    const fontFamily = '"Noto Sans SC", "Microsoft YaHei", "PingFang SC", "Segoe UI", sans-serif';
    const colors = { ink: "#172033", body: "#4A5568", muted: "#718096", blue: "#5B8CFF", risk: "#D95869", violet: "#8B74D7", line: "#E2E8F0" };

    function newPage() {
      canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      ctx = canvas.getContext("2d");
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, width, height);
      ctx.textBaseline = "top";
      pages.push(canvas);
      y = margin;
    }

    function ensureSpace(amount) {
      if (y + amount > height - 86) newPage();
    }

    function setFont(size, weight = "400", color = colors.body) {
      ctx.font = `${weight} ${size}px ${fontFamily}`;
      ctx.fillStyle = color;
    }

    function wrapText(text, maxWidth) {
      const value = String(text || "").trim();
      if (!value) return [];
      const lines = [];
      for (const paragraph of value.split(/\n+/)) {
        let line = "";
        let segments;
        try {
          segments = [...new Intl.Segmenter("zh", { granularity: "word" }).segment(paragraph)].map((item) => item.segment);
        } catch {
          segments = Array.from(paragraph);
        }
        for (const segment of segments) {
          const candidate = line + segment;
          if (line && ctx.measureText(candidate).width > maxWidth) {
            lines.push(line.trimEnd());
            line = segment.trimStart();
          } else {
            line = candidate;
          }
        }
        if (line.trim()) lines.push(line.trim());
      }
      return lines;
    }

    function paragraph(text, { size = 21, weight = "400", color = colors.body, lineHeight = 33, gap = 14, maxWidth = contentWidth } = {}) {
      setFont(size, weight, color);
      const lines = wrapText(text, maxWidth);
      for (const line of lines) {
        ensureSpace(lineHeight);
        ctx.fillText(line, margin, y);
        y += lineHeight;
      }
      y += gap;
    }

    function heading(text) {
      ensureSpace(70);
      y += 10;
      setFont(26, "600", colors.ink);
      ctx.fillText(text, margin, y);
      y += 44;
    }

    function rule() {
      ensureSpace(18);
      y += 7;
      ctx.strokeStyle = colors.line;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(margin, y);
      ctx.lineTo(width - margin, y);
      ctx.stroke();
      y += 18;
    }

    function label(text) {
      setFont(14, "600", colors.blue);
      ensureSpace(24);
      ctx.fillText(text.toUpperCase(), margin, y);
      y += 25;
    }

    newPage();
    ctx.strokeStyle = colors.blue;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(margin, y + 41);
    ctx.lineTo(width - margin, y + 41);
    ctx.stroke();
    setFont(30, "700", colors.ink);
    ctx.fillText("SignalFi", margin, y);
    setFont(13, "500", colors.muted);
    ctx.fillText("WEB3 INTELLIGENCE TERMINAL", width - margin - 250, y + 5);
    y += 66;
    label("INTELLIGENCE BRIEF · " + view.mode.toUpperCase());
    paragraph(report.headline || t("今日 Web3 情报简报", "Today's Web3 Intelligence Brief"), { size: 38, weight: "600", color: colors.ink, lineHeight: 50, gap: 8 });
    paragraph(`${formatDateTime(report.generated_at || view.generatedAt)} · ${report.generated_by || "Rule engine"} · ${view.stats.activeSources}/${view.stats.totalSources} ${t("数据源在线", "sources online")}`, { size: 16, color: colors.muted, lineHeight: 24, gap: 18 });
    heading(t("总体判断", "Executive Summary"));
    paragraph(report.summary || "", { size: 21, lineHeight: 34 });
    heading(t("风险展望", "Risk Outlook"));
    paragraph(report.risk_outlook || "", { size: 21, lineHeight: 34 });
    heading(t("优先信号", "Priority Signals"));
    [...view.events].sort((a, b) => (b.risk * 0.6 + b.heat * 0.4) - (a.risk * 0.6 + a.heat * 0.4)).slice(0, 6).forEach((event) => {
      ensureSpace(140);
      setFont(21, "600", colors.ink);
      const titleLines = wrapText(event.title, contentWidth - 20);
      for (const line of titleLines) {
        ensureSpace(31);
        ctx.fillText(line, margin, y);
        y += 31;
      }
      setFont(15, "400", colors.muted);
      ensureSpace(25);
      ctx.fillText(`${event.category} · ${event.sourceCount} ${t("来源", "sources")} · ${t("首次发现", "first seen")} ${formatDate(event.firstSeen)}`, margin, y);
      y += 26;
      setFont(15, "600", event.risk >= 58 ? colors.risk : colors.violet);
      ctx.fillText(`${t("风险", "Risk")} ${event.risk} / ${t("热度", "Heat")} ${event.heat}`, margin, y);
      y += 23;
      rule();
    });
    heading(t("预测市场研究候选", "Prediction Research Candidates"));
    view.predictionCandidates.slice(0, 5).forEach((candidate) => {
      ensureSpace(150);
      setFont(13, "600", candidate.status === "market_linked" ? colors.violet : colors.risk);
      ctx.fillText(candidate.status === "market_linked" ? "MARKET LINKED" : "RESEARCH CANDIDATE", margin, y);
      y += 23;
      setFont(20, "600", colors.ink);
      for (const line of wrapText(candidate.question, contentWidth - 20)) {
        ensureSpace(29);
        ctx.fillText(line, margin, y);
        y += 29;
      }
      paragraph(candidate.resolutionCriteria, { size: 16, color: colors.muted, lineHeight: 25, gap: 10 });
      rule();
    });
    heading(t("建议动作", "Suggested Actions"));
    (report.actions || []).forEach((action) => {
      paragraph(`• ${action}`, { size: 18, lineHeight: 27, gap: 5 });
    });
    ensureSpace(90);
    rule();
    paragraph(view.notice || t("数据来自公开 RSS、市场 API 和预测市场 API。", "Data comes from public RSS, market APIs and prediction-market APIs."), { size: 14, color: colors.muted, lineHeight: 22, gap: 4 });
    paragraph("SignalFi · " + t("研究辅助工具，不构成投资建议", "Research support only; not investment advice"), { size: 14, color: colors.muted, lineHeight: 22, gap: 0 });
    pages.forEach((pageCanvas, index) => {
      const pageCtx = pageCanvas.getContext("2d");
      pageCtx.font = `400 13px ${fontFamily}`;
      pageCtx.fillStyle = colors.muted;
      pageCtx.fillText(`SignalFi · ${t("第", "Page")} ${index + 1} / ${pages.length} ${t("页", "")}`.trim(), margin, height - 48);
    });
    return pages;
  }
  function buildMarkdown() {
    const view = state.view;
    const report = view.report;
    const lines = [
      "# SignalFi Intelligence Brief", "",
      `- Generated: ${view.generatedAt}`,
      `- Data mode: ${view.mode}`,
      `- Sources: ${view.stats.activeSources}/${view.stats.totalSources}`,
      `- Active signals: ${view.stats.active}`,
      `- Risk watch: ${view.stats.risk}`,
      `- Prediction research candidates: ${view.stats.research}`, "",
      "## Executive Summary", "", report.summary || "No summary available.", "",
      "## Risk Outlook", "", report.risk_outlook || "No risk outlook available.", "",
      "## Priority Signals", "",
    ];
    [...view.events].sort((a, b) => (b.risk * 0.6 + b.heat * 0.4) - (a.risk * 0.6 + a.heat * 0.4)).slice(0, 8).forEach((event, index) => {
      lines.push(`${index + 1}. **${event.title}**`);
      lines.push(`   - Category: ${event.category}`);
      lines.push(`   - Risk: ${event.risk} (${riskLabel(event.risk)}) · Heat: ${event.heat} · Sources: ${event.sourceCount}`);
      lines.push(`   - Summary: ${event.summary}`);
      if (event.sources?.[0]?.url) lines.push(`   - Source: ${event.sources[0].url}`);
      lines.push("");
    });
    lines.push("## Prediction Research", "");
    view.predictionCandidates.slice(0, 6).forEach((candidate, index) => {
      lines.push(`${index + 1}. **${candidate.question}**`);
      lines.push(`   - Status: ${candidate.status === "market_linked" ? "Market linked" : "Research candidate"}`);
      lines.push(`   - Resolution: ${candidate.resolutionCriteria}`);
      if (candidate.probability != null) lines.push(`   - Probability: ${candidate.probability}%`);
      if (candidate.marketUrl) lines.push(`   - Market: ${candidate.marketUrl}`);
      lines.push("");
    });
    lines.push("## Suggested Actions", "");
    (report.actions || []).forEach((action) => lines.push(`- ${action}`));
    lines.push("", "## Data Note", "", view.notice || "Observed public data. Not financial advice.", "");
    return lines.join("\n");
  }

  function downloadMarkdown() {
    const markdown = buildMarkdown();
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `signalfi-brief-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast(t("Markdown 简报已导出", "Markdown brief exported"));
  }

  window.SF_PAGES = window.SF_PAGES || {};
  window.SF = {
    state, t, icon, escapeHTML, safeUrl, formatNumber, formatPrice, formatVolume,
    formatDateTime, formatDate, formatSyncTime, relativeTime, riskLevelFromScore, riskLabel,
    trackingLabel, evidenceLabel, evidenceClass, statusBadge, shortText,
    sourceDomain, openBrief, downloadMarkdown, downloadPdf, toast, setDocumentTitle, clamp,
    numberOrNull, validDate,
  };
})();

