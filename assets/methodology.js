(() => {
  "use strict";

  const SF = window.SF;
  const { state, t, icon, escapeHTML } = SF;

  window.SF_PAGES.methodology = { render, bind };

  function render() {
    const view = state.view;
    const main = document.querySelector("#app-main");
    if (!view || !main) return;
    SF.setDocumentTitle(t("产品说明书", "Product Guide"));
    main.innerHTML = `
      <section class="page-head methodology-page-head">${methodologyHead(view)}</section>
      <section class="methodology-layout">
        <aside class="panel methodology-index">${methodIndex()}</aside>
        <div class="methodology-content">
          ${projectStatusSection()}
          ${pipelineSection()}
          ${sourcesSection(view)}
          ${scoringSection()}
          ${statusSection()}
          ${predictionSection()}
          ${aiSection()}
          ${caseSection()}
          ${limitationsSection()}
        </div>
      </section>`;
    bindLocal();
  }

  function bind() { bindLocal(); }

  function bindLocal() {
    document.querySelectorAll("[data-method-link]").forEach((link) => {
      link.onclick = (event) => {
        const target = document.querySelector(link.getAttribute("href"));
        if (target) { event.preventDefault(); target.scrollIntoView({ behavior: "smooth", block: "start" }); }
      };
    });
  }

  function methodologyHead(view) {
    return `
      <div class="page-title-block"><div class="eyebrow">${icon("book-open", "icon icon-sm")}PRODUCT GUIDE · METHODOLOGY</div><h1>${t("产品说明书", "Product Guide")}</h1><p>${t("解释 SignalFi 如何选择来源、处理数据、定义热点与风险，以及如何判断一个事件是否适合进入预测市场研究。", "How SignalFi selects sources, processes data, defines heat and risk, and decides whether an event is suitable for prediction-market research.")}</p></div>
      <div class="page-head-side methodology-meta"><span>${t("版本", "Version")} <b>v2.0</b></span><span>${t("用途", "Purpose")} <b>${t("求职演示原型", "Job-search prototype")}</b></span><span>${t("数据模式", "Data mode")} <b>${view.mode === "demo" ? t("示例数据", "SAMPLE DATA") : t("公开数据快照", "PUBLIC SNAPSHOT")}</b></span><span>${t("最后同步", "Last sync")} <b>${escapeHTML(SF.formatSyncTime(view.generatedAt))}</b></span></div>`;
  }

  function methodIndex() {
    return `<span class="section-kicker">ON THIS PAGE</span><nav class="method-links">${[
      ["#project-status", t("项目状态", "Project status")], ["#method-pipeline", t("处理流程", "Pipeline")], ["#method-sources", t("数据来源", "Sources")], ["#method-scoring", t("热度与风险", "Heat & risk")], ["#method-status", t("事实与状态", "Evidence states")], ["#method-prediction", t("预测市场筛选", "Prediction screening")], ["#method-ai", t("AI 边界", "AI boundaries")], ["#method-case", t("案例模板", "Case study")], ["#method-limits", t("当前限制", "Limitations")],
    ].map(([href, label]) => `<a href="${href}" data-method-link>${label}${icon("arrow-right", "icon icon-sm")}</a>`).join("")}</nav><div class="method-note">${icon("activity")}<span>${t("方法的目标是可解释和可复核，而不是制造预测能力。", "The goal is explainability and reviewability, not pretending to predict the future.")}</span></div>`;
  }
  function projectStatusSection() {
    return `<section class="panel method-section project-status-section" id="project-status"><div class="method-section-head"><span class="section-kicker">00 · PROJECT STATUS</span><h2>${t("项目状态与我的工作", "Project status and my work")}</h2><p>${t("当前版本是面向求职展示的轻量原型，优先展示产品判断、业务规则和可交互工作流，而不是伪装成已经上线的生产系统。", "This version is a lightweight prototype for job-search presentation. It demonstrates product judgment, business rules and an interactive workflow rather than pretending to be a live production system.")}</p></div><div class="project-status-grid"><article><span class="status-chip confirmed">${t("已实现", "Implemented")}</span><ul><li>${t("四页面可交互前端原型", "Four interactive front-end pages")}</li><li>${t("热点事件筛选、搜索与详情", "Signal filtering, search and detail")}</li><li>${t("来源证据链与风险依据", "Evidence chain and risk rationale")}</li><li>${t("预测市场候选研究", "Prediction-market candidate research")}</li><li>${t("中英文切换、Markdown 与 PDF", "Bilingual UI, Markdown and PDF")}</li></ul></article><article><span class="status-chip monitoring">${t("原型 / 技术验证", "Prototype / validated")}</span><ul><li>${t("公开 RSS、CoinGecko、Polymarket 快照", "Public RSS, CoinGecko and Polymarket snapshot")}</li><li>${t("Python 采集脚本可在本地运行", "Local Python collection script")}</li><li>${t("GitHub Actions 配置已准备但未启用", "GitHub Actions prepared but not activated")}</li><li>${t("中文翻译缓存与可选 AI 接口", "Chinese translation cache and optional AI interface")}</li></ul></article><article><span class="status-chip rising">${t("规划中", "Planned")}</span><ul><li>${t("自动定时更新与正式部署", "Scheduled updates and production deployment")}</li><li>${t("多平台社交数据接入", "Multi-platform social ingestion")}</li><li>${t("事件历史与跨运行跟踪", "Persistent event history")}</li><li>${t("用户活动数据与运营复盘", "Campaign analytics and operations review")}</li><li>${t("深度 AI 分析与真实案例沉淀", "Deeper AI analysis and verified case studies")}</li></ul></article></div><div class="my-work-note"><div>${icon("file-search", "icon icon-sm")}<span class="section-kicker">${t("我的工作", "MY WORK")}</span></div><p>${t("我负责产品定位、目标用户与业务场景定义、页面信息架构、功能取舍、业务规则和验收标准，并使用 Codex 辅助完成代码实现、调试与迭代。", "I defined the product positioning, target users, information architecture, scope trade-offs, business rules and acceptance criteria, and used Codex to assist with implementation, debugging and iteration.")}</p><div class="my-work-tags"><span>${t("产品规划", "Product planning")}</span><span>${t("需求拆解", "Requirements")}</span><span>${t("业务流程", "Business logic")}</span><span>${t("测试验收", "QA")}</span><span>${t("Codex 协作开发", "Codex-assisted development")}</span></div></div></section>`;
  }
  function pipelineSection() {
    return `<section class="panel method-section" id="method-pipeline"><div class="method-section-head"><span class="section-kicker">01 · PIPELINE</span><h2>${t("从公开信息到可读情报", "From public information to readable intelligence")}</h2><p>${t("流程保持可追踪：先采集和清洗，再做规则判断，最后才用 AI 处理少量高价值文本。", "The pipeline is traceable: collect and normalize first, apply rules next, then use AI only for a small set of high-value text.")}</p></div><div class="pipeline-flow">${[
      ["database", t("公开数据", "Public data"), "RSS · APIs · markets"], ["filter", t("标准化", "Normalize"), t("清洗 · 去重 · 时间", "Clean · dedupe · time")], ["radar", t("事件聚合", "Cluster"), t("标题相似度 · 来源", "Title similarity · sources")], ["activity", t("规则评分", "Score"), t("热度 · 风险 · 情绪", "Heat · risk · sentiment")], ["file-search", t("情报输出", "Brief"), "JSON · Markdown"],
    ].map(([iconName, label, note], index) => `<div class="pipeline-step"><span class="pipeline-step-icon">${icon(iconName)}</span><strong>${label}</strong><small>${note}</small>${index < 4 ? `<b class="pipeline-arrow">→</b>` : ""}</div>`).join("")}</div><div class="method-callout">${icon("clock", "icon icon-sm")}<span>${t("当前页面读取的是一份生成后的快照；未来定时任务会更新同一结构的数据文件。", "This page reads a generated snapshot; scheduled jobs will update the same data contract in a later stage.")}</span></div></section>`;
  }

  function sourcesSection(view) {
    const ok = view.sources.filter((source) => source.ok).length;
    return `<section class="panel method-section" id="method-sources"><div class="method-section-head"><span class="section-kicker">02 · SOURCES</span><h2>${t("数据来源与健康状态", "Sources and health")}</h2><p>${t("首期只使用可公开访问、可追溯的 RSS 和 API。社交平台必须在权限和稳定性验证后再接入。", "Stage one uses publicly accessible, traceable RSS and APIs. Social platforms should be added only after permission and stability are validated.")}</p></div><div class="source-health-summary"><strong>${ok}/${view.sources.length}</strong><span>${t("连接正常", "connectors healthy")}</span></div><div class="source-table">${view.sources.map((source) => `<div class="source-table-row"><span class="source-status-dot ${source.ok ? "ok" : "error"}"></span><strong>${escapeHTML(source.name)}</strong><span>${escapeHTML(source.type || "Source")}</span><span>${source.ok ? `${source.item_count} ${t("条", "items")}` : t("失败", "Failed")}</span><time>${source.ok ? t("可用", "Available") : escapeHTML(source.error || "Error")}</time></div>`).join("")}</div><p class="method-footnote">${t("当前未接入 X / Telegram 的真实全量数据。相关连接器应在 API 权限、成本和条款验证后再进入产品。", "X and Telegram full-data connectors are not enabled. Their API permissions, costs and terms must be validated first.")}</p></section>`;
  }

  function scoringSection() {
    return `<section class="panel method-section" id="method-scoring"><div class="method-section-head"><span class="section-kicker">03 · SCORING</span><h2>${t("热度与风险是两件事", "Heat and risk are different")}</h2><p>${t("热度描述传播与新鲜度，风险描述潜在负面影响。两者不合并成一个模糊的“重要度”。", "Heat describes propagation and recency; risk describes potential downside. They are not collapsed into a vague importance score.")}</p></div><div class="formula-grid"><article><span class="formula-tag brand">HEAT</span><h3>${t("观察热度", "Observed heat")}</h3><p>${t("新鲜度、来源数量、关键词信号和采集范围共同决定。", "Recency, source count, keyword signals and collection scope all contribute.")}</p><div class="formula">recency + source_count + keyword_signals</div></article><article><span class="formula-tag risk">RISK</span><h3>${t("舆情风险", "Public-opinion risk")}</h3><p>${t("高风险词、负面情绪、来源覆盖和事件类别共同参与。", "High-risk terms, negative sentiment, source coverage and event category all contribute.")}</p><div class="formula">risk_terms + negative_sentiment + source_count</div></article><article><span class="formula-tag violet">RESEARCH</span><h3>${t("预测研究相关性", "Prediction relevance")}</h3><p>${t("先判断是否有明确结果、截止时间和可验证来源，再匹配真实市场。", "First assess outcome clarity, deadline and verifiability; only then match a live market.")}</p><div class="formula">clarity + deadline + resolution_source + market_link</div></article></div><div class="method-callout warn">${icon("alert-triangle", "icon icon-sm")}<span>${t("规则评分是透明的观察工具，不是价格预测或投资建议。", "Rule-based scores are transparent observation tools, not price forecasts or investment advice.")}</span></div></section>`;
  }
  function statusSection() {
    const rows = [
      ["unverified", t("待核实", "Unverified"), t("只有单一来源，或尚未出现官方确认。", "Single source, or no official confirmation yet.")],
      ["corroborated", t("多源观察", "Corroborated"), t("多个独立来源出现相似报道，但仍需区分转载。", "Multiple independent sources report similarly, but syndication must still be separated.")],
      ["confirmed", t("已确认", "Confirmed"), t("官方来源或可靠证据链确认事实。", "Confirmed by an official source or a reliable evidence chain.")],
      ["monitoring", t("持续观察", "Monitoring"), t("事件仍在发展，需要跟踪后续来源和官方回应。", "The event is still developing and requires follow-up.")],
      ["rising", t("正在升温", "Rising"), t("观察期内的新增信息与来源密度上升。", "Observed source density and new information are increasing.")],
    ];
    return `<section class="panel method-section" id="method-status"><div class="method-section-head"><span class="section-kicker">04 · EVIDENCE STATES</span><h2>${t("事实状态与跟踪状态分离", "Separate evidence and tracking states")}</h2><p>${t("“是否可信”和“是否仍在发展”不是同一个维度，不能混成一个状态。", "“How credible is it?” and “Is it still developing?” are different dimensions and must not be collapsed.")}</p></div><div class="status-grid">${rows.map(([status, label, description]) => `<article class="status-card"><span class="status-chip ${status}">${label}</span><p>${description}</p></article>`).join("")}</div></section>`;
  }

  function predictionSection() {
    return `<section class="panel method-section" id="method-prediction"><div class="method-section-head"><span class="section-kicker">05 · PREDICTION SCREENING</span><h2>${t("热门不等于适合预测", "Popular does not mean predictable")}</h2><p>${t("一个事件必须同时具备明确结果、时间范围和验证依据，才值得进入预测市场研究。", "An event needs a clear outcome, deadline and verification source before entering prediction-market research.")}</p></div><div class="criteria-grid">${[
      [t("明确结果", "Clear outcome"), t("可以用 YES / NO 或明确选项结算。", "Resolvable as YES / NO or a clear option.")], [t("明确期限", "Explicit deadline"), t("必须知道结果在何时之前发生。", "The time window must be unambiguous.")], [t("可验证来源", "Verifiable source"), t("官方公告、公开数据或指定结算源。", "Official notices, public data or a designated resolution source.")], [t("真实市场", "Live market"), t("只有匹配到合法公开盘口，才显示概率。", "Only show probability when a legitimate public market is matched.")], [t("事件关联", "Event linkage"), t("热点、官方信息与市场问题之间存在可解释关联。", "The signal, official information and market question must be explainable.")], [t("不确定性", "Remaining uncertainty"), t("保留待观察问题，不把研究候选包装成确定机会。", "Keep open questions visible; do not present research as a certain opportunity.")],
    ].map(([title, note]) => `<div class="criteria-item">${icon("file-search", "icon icon-sm")}<div><strong>${title}</strong><p>${note}</p></div></div>`).join("")}</div></section>`;
  }

  function aiSection() {
    return `<section class="panel method-section" id="method-ai"><div class="method-section-head"><span class="section-kicker">06 · AI BOUNDARIES</span><h2>${t("AI 负责整理，不负责事实背书", "AI organizes; it does not certify facts")}</h2><p>${t("AI 只处理经过规则筛选的少量事件，并输出固定结构。事实状态、来源链接和风险标签仍需规则或人工确认。", "AI processes only a small set of rule-filtered events and returns a fixed structure. Evidence states, source links and risk labels still require rules or human review.")}</p></div><div class="ai-rules"><div class="ai-rule allow"><span>${icon("activity", "icon icon-sm")}${t("可以", "ALLOWED")}</span><ul><li>${t("摘要多个来源的共同信息", "Summarize shared information across sources")}</li><li>${t("生成结构化日报草稿", "Draft a structured intelligence brief")}</li><li>${t("指出仍需核实的开放问题", "Identify open questions that still need verification")}</li></ul></div><div class="ai-rule deny"><span>${icon("alert-triangle", "icon icon-sm")}${t("不可以", "NOT ALLOWED")}</span><ul><li>${t("凭空生成来源或引用", "Invent sources or citations")}</li><li>${t("独立把事件标记为已确认", "Mark an event as confirmed on its own")}</li><li>${t("把研究候选包装成投资建议", "Present research candidates as investment advice")}</li></ul></div></div></section>`;
  }
  function caseSection() {
    return `<section class="panel method-section" id="method-case"><div class="method-section-head"><span class="section-kicker">07 · CASE STUDY</span><h2>${t("真实案例模板", "Real case study template")}</h2><p>${t("用于展示从原始信息到业务判断的完整链路。第一阶段保留结构，正式案例需人工核验后补充。", "Structured to show the full path from raw information to business judgment. Stage one keeps the template; a verified real case will be added after manual review.")}</p></div><div class="case-template"><div class="case-step"><span>01</span><div><strong>${t("最初发现的原始信息", "Initial source")}</strong><p>${t("记录最早来源、发布时间、原文链接和首次发现时间。", "Capture the earliest source, timestamp, original link and first-seen time.")}</p></div></div><div class="case-step"><span>02</span><div><strong>${t("系统如何聚合相关来源", "Source aggregation")}</strong><p>${t("区分重复转载、独立来源和官方信息，展示事件时间线。", "Separate syndicated copies, independent sources and official information.")}</p></div></div><div class="case-step"><span>03</span><div><strong>${t("风险与影响判断", "Risk and impact assessment")}</strong><p>${t("解释风险依据、潜在业务影响，以及哪些结论仍需验证。", "Explain the risk rationale, potential business impact and open questions.")}</p></div></div><div class="case-step"><span>04</span><div><strong>${t("预测市场相关性", "Prediction-market relevance")}</strong><p>${t("判断是否具备明确结果、截止时间和可验证结算源。", "Assess outcome clarity, deadline and a verifiable resolution source.")}</p></div></div><div class="case-placeholder">${icon("clock", "icon icon-sm")}<span>${t("待补充：经过人工检查的真实案例。", "To be added: a manually verified real case.")}</span></div></div></section>`;
  }

  function limitationsSection() {
    return `<section class="panel method-section" id="method-limits"><div class="method-section-head"><span class="section-kicker">08 · LIMITATIONS</span><h2>${t("当前系统的边界", "Current limitations")}</h2></div><div class="limitations-grid">${[
      [t("来源覆盖有限", "Limited source coverage"), t("当前未接入 X、Telegram 的全量数据。", "Full X and Telegram data is not connected.")], [t("事件历史尚未闭环", "Event history is pending"), t("跨运行的去重和热度变化仍需持久化状态。", "Cross-run deduplication and heat changes require persistent state.")], [t("情绪判断是近似值", "Sentiment is approximate"), t("词典与 AI 情绪不等于真实用户态度。", "Lexicons and AI sentiment do not equal true user attitudes.")], [t("预测候选不是建议", "Candidates are not advice"), t("研究候选不代表真实市场机会或收益预期。", "Research candidates do not imply market opportunities or expected returns.")],
    ].map(([title, note]) => `<div><span>${icon("alert-triangle", "icon icon-sm")}</span><strong>${title}</strong><p>${note}</p></div>`).join("")}</div><div class="method-footer-note">${t("Stage 1 的目标是打通产品结构、信息层级和分析工作流；真实数据接入、历史事件状态和持续部署将在后续阶段完成。", "Stage one focuses on product structure, information hierarchy and the analysis workflow. Live ingestion, persistent event history and continuous deployment follow in later stages.")}</div></section>`;
  }
})();

