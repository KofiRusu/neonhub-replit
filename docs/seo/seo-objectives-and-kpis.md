# NeonHub SEO Objectives & KPI Charter

## Purpose
This charter operationalises Phase A of the SEO roadmap by documenting goals, success metrics, ownership, and review cadences. It should be updated at the start of every quarter and after any major product or positioning shift.

## Business Outcomes
- **Primary Objective (Growth):** Increase organic product sign-ups by 30 % within six months of launch readiness.
- **Secondary Objectives (Engagement):**
  - Lift organic-to-lead conversion rate to ≥ 4.5 %.
  - Reduce marketing-site bounce rate below 45 %.
  - Grow qualified demo requests sourced from organic search by ≥ 20 % quarter-over-quarter.

## Key Performance Indicators
| KPI | Definition | Data Source | Baseline (fill once tools connected) | Target |
| --- | --- | --- | --- | --- |
| Organic Sessions | Users arriving via non-paid search | GA4 → Traffic acquisition | _TBD_ | +35 % vs. baseline |
| Click-through Rate (CTR) | Clicks ÷ Impressions | Search Console → Performance | _TBD_ | ≥ 4.0 % |
| Average Position | Mean SERP rank for tracked queries | Search Console | _TBD_ | ≤ 12 |
| Organic Sign-ups | New accounts attributed to organic search | CRM + GA4 (event) | _TBD_ | +30 % |
| Assisted Revenue | Closed-won revenue with organic assist | CRM attribution | _TBD_ | +25 % |
| Core Web Vitals | LCP / FID / CLS scores | PageSpeed API / CrUX | _TBD_ | Green across key pages |

> **Action:** fill the “Baseline” column immediately after Search Console and GA4 access is confirmed; store raw exports in `analytics/seo/baselines/<YYYY-MM-DD>/`.

## Ownership & RACI
| Area | Responsible | Accountable | Consulted | Informed |
| --- | --- | --- | --- | --- |
| SEO Strategy & Prioritisation | Head of Growth | VP Marketing | Product, Data | Leadership |
| Keyword Research & Intent Mapping | SEO Specialist | Head of Growth | Product Marketing | Content Squad |
| Content Creation & Optimisation | Content Lead | Head of Content | SEO Specialist, SME | Sales, CS |
| Technical SEO & Site Health | Web Engineering Lead | Director of Engineering | DevOps, SRE | SEO Specialist |
| Analytics & Reporting | Marketing Ops Analyst | Head of Growth | Data Engineering | All Stakeholders |

## Cadence & Governance
- **Weekly:** SEO stand-up (15 min) – status on actions, blockers, quick wins.
- **Monthly:** KPI review – compare against targets, adjust experiments, update leadership.
- **Quarterly:** Roadmap recalibration – refresh keyword map, reprioritise content and technical initiatives.
- **Incident Workflow:** Any critical issue (e.g., indexing failure, major traffic drop) triggers PagerDuty “SEO-Critical” escalation with Engineering + Growth on-call.

## Tooling Checklist
- [ ] GA4 property configured with clean view filters and conversion events.
- [ ] Search Console verified for canonical domain.
- [ ] CRM (HubSpot/Salesforce) capturing organic source + campaign.
- [ ] Rank tracking (Ahrefs/Semrush) projects configured for priority keywords.
- [ ] Dashboard (Looker/Data Studio) aggregating KPIs for leadership view.

## Review Log
| Date | Owner | Summary | Follow-up |
| --- | --- | --- | --- |
| _TBD_ |  |  |  |

> Keep this document under version control; link changes to sprint or OKR planning tickets to ensure traceability.
