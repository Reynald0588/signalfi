# SignalFi Changelog

## 2026-10-27 — Automated public-data deployment

- Configured GitHub Actions to attempt a free public RSS/API refresh every six hours.
- Disabled AI calls in the scheduled workflow so the portfolio deployment has no token cost.
- Added a live-data guard that preserves the previous successful deployment when collection falls back to demo data.
- Updated the website status copy to distinguish automated snapshots from sample data.
## v2.0.1-job-demo — 2026-10-26

Visual cleanup for the portfolio demo.

- Removed the homepage "Start 2-minute demo" button so the first screen remains product-focused.
- Kept the intelligence brief as the primary homepage action.
- Updated the video plan to navigate through the main product navigation instead of a demo-only CTA.

## v2.0-job-demo — 2026-10-26

Job-search demonstration edition focused on Web3 user operations and prediction-market research roles.

- Clarified the product positioning and target use cases on the homepage.
- Added a persistent portfolio-prototype notice and public-snapshot status.
- Added a guided demo entry and operational follow-up framing.
- Renamed Signals to the Signals & Risk Workbench while retaining public-opinion capability.
- Added an explicit Project Status section covering implemented, prototype/validated and planned capabilities.
- Added a clear statement of the author's work and Codex-assisted development.
- Preserved the v1.0 baseline as Git tag v1.0 and backups/SignalFi-v1.0.zip.

## v1.0 — 2026-10-26

Baseline portfolio prototype before job-demo positioning work.

- Four-page interactive front end: Overview, Signals, Prediction Research, Product Guide.
- Dark intelligence-terminal visual system, responsive desktop/mobile layouts.
- Chinese/English interface switch with cached translated event titles, summaries and market questions.
- Event search, filters, sorting, detail view and evidence chain.
- Prediction-market research candidates with Market Linked / Research Candidate distinction.
- Markdown and PDF intelligence-brief exports.
- Public RSS / CoinGecko / Polymarket snapshot pipeline prepared locally.
- GitHub Actions workflow prepared but not activated.
- Current limitations: no scheduled production update, persistent event history, multi-platform social ingestion, database or live AI analysis.

