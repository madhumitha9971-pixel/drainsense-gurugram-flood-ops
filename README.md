# DrainSense 3D: Predictive Drainage & Cascade Flood Operations for Gurugram

[![License: MIT](https://img.shields.io/badge/Code_License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Docs: CC BY 4.0](https://img.shields.io/badge/Docs_License-CC_BY_4.0-blue.svg)](https://creativecommons.org/licenses/by/4.0/)
[![Competition: SustainX 2026](https://img.shields.io/badge/SustainX_2026-Round_2_Prototype-orange.svg)](#5-submission-details)
[![Status: Simulated Scenario](https://img.shields.io/badge/Data-Simulated_Scenario-red.svg)](#6-disclosure--citations)

> **SIMULATED SCENARIO DISCLOSURE:** All sensor telemetry, 3D water-level animations, and performance metrics in this repository are **simulated scenarios** built on documented operational assumptions for **SustainX 2026**. Only observed public facts and explicitly documented assumptions are presented as context, and all external sources and AI tools used are cited below.

---

## Table of Contents

1. [Overview & Core Hypothesis](#1-overview--core-hypothesis)
2. [Problem Diagnosis](#2-problem-diagnosis)
3. [End-to-End System Flowchart](#3-end-to-end-system-flowchart)
4. [Key Innovations, Screens & License Stack](#4-key-innovations-screens--license-stack)
5. [Submission Details](#5-submission-details)
6. [Disclosure & Citations](#6-disclosure--citations)
7. [License](#license)

---

## 1. Overview & Core Hypothesis

**DrainSense 3D** is an AI-enabled predictive flood operations system for the **Municipal Corporation of Gurugram (MCG)** and **GMDA**. It shifts urban flood management from reactive pumping to pre-emptive drainage intervention across Gurugram's **159 identified waterlogging hotspots** and **607 km** drainage network.

- **Core thesis:** Gurugram's recurring monsoon flooding is an operational failure rather than a budget failure.
- **Zero-PhD operability:** Built for existing MCG Junior Engineers (JEs), Assistant Engineers (AEs), Executive Engineers (EEs), Pump Crews, and Control Room Operators, with no dedicated data science team required.

---

## 2. Problem Diagnosis

- **Extreme rainfall shock:** On September 1, 2025, 133 mm of rain in four hours caused a 20 km traffic jam and a 51-hour power outage across Gurugram.
- **Desilting execution gap:** By late June 2026, MCG had completed desilting at only 16 of 36 identified hotspots against a May 31 deadline, despite a mandate to desilt the 607 km drainage network.

**Three operational bottlenecks**

| # | Bottleneck | What goes wrong |
|---|------------|-----------------|
| 1 | **Reactive maintenance** | Drains and culverts are cleared after citizen complaints rather than ranked by downstream flood impact. |
| 2 | **Manual status tracking** | Hotspot readiness relies on phone calls and ad-hoc site visits, with no early warning signal. |
| 3 | **Unranked dispatch** | Pumps and crews are allocated without hydrological risk scoring across the 159 hotspots. |

---

## 3. End-to-End System Flowchart

```text
[1. DATA & CONTEXT INPUTS]
  |-- IMD rainfall forecasts & nowcasts
  |-- Vandal-proof drain level sensors, rain gauges & underpass CCTV
  |-- Historical flood records + seasonal silt / desilting status (607 km / 159 hotspots)
        |
        v
[2. DRAINAGE TOPOLOGY & 80/20 CHOKEPOINT ENGINE]
  |-- Directed graph: upstream -> culvert chokepoint -> downstream underpass / sector
  |-- Ranks high-leverage nodes (~20% of nodes driving ~80% of the flood cascade)
        |
        v
[3. 24-48h AI RISK & CONFIDENCE MODEL]
  |-- Outputs: risk tier (Safe / Caution / Avoid), confidence score,
  |            cause, action, owner, deadline
        |
        +-------------------------------+-------------------------------+
        |                               |                               |
        v                               v                               v
[4A. MCG SOP COMMAND]          [4B. RWA OVERRIDE LEDGER]       [4C. CITIZEN ALERT GUARDRAIL]
  |-- T-48h to T-24h: EE ranks    |-- Compares hydrological       |-- High confidence + high risk
  |-- T-24h to T-12h: JE/AE clear |   score vs. RWA request       |     --> public AVOID alert
  |-- T-12h to T-6h:  pump prep   |-- Logs override + reason      |-- Low/medium confidence + high risk
  |-- T-6h to T-0h:   alert/watch |   for audit trail             |     --> field verification first
  |-- During & after rain: audit  |                               |-- Delivery: SMS + IVR + web/corridor
```

---

## 4. Key Innovations, Screens & License Stack

### Key Innovations

- **3D Drainage & Cascade Twin (80/20 leverage):** Models upstream feeders, culvert chokepoints, and downstream underpasses or sectors in 3D, so operators can test how clearing an upstream chokepoint reduces downstream flood levels.
- **RWA Pressure vs. Hydrological Score Audit Ledger:** Compares objective hydrological urgency against influential RWA pump or crew requests and logs any manual override with a documented reason.
- **Confidence-Gated Citizen Alerts:** Routes low- or medium-confidence predictions to field verification first to prevent alarm fatigue. Public Avoid alerts are reserved for high-confidence, high-impact cases across SMS, IVR voice calls (for non-smartphone users), and corridor/web views.
- **Rugged Indian-context sensor architecture:** Uses vandal-resistant, weatherproof, low-maintenance drain level sensors, rain gauges, and underpass CCTV, grounded in Indian municipal cost benchmarks.

### Front-End Prototype Screens

| # | Screen | Purpose |
|---|--------|---------|
| 1 | **3D Corridor & Chokepoint Twin** | Visualize elevation, silt load, upstream-downstream links, and flood risk in 3D with a horizon (T-48h to T-0h), rain/silt controls, camera presets, and one-click chokepoint/pump actions. |
| 2 | **MCG Operations & SOP Board** | Coordinate pre-event and live-rain crew and pump dispatch (T-48h to after rain) by role (EE, AE, JE, Pump Crew, Control Room), with status updates and the RWA Override Audit Log. |
| 3 | **Citizen Alert & Verification Hub** | Manage Safe / Caution / Avoid thresholds and the Field Verification Queue, with live SMS, IVR voice script, and corridor previews. |
| 4 | **Validation, Sensors & Citations** | View simulated evaluation metrics, Indian-market sensor specs, and documented assumptions. |

### Front-End & License Stack

| Technology | License | Role |
|------------|---------|------|
| React, TypeScript & Vite | MIT | Fast browser-based front-end application |
| Tailwind CSS | MIT | Clean, high-contrast civic dashboard styling |
| Three.js (`three`) | MIT | Interactive 3D drainage corridors, links, and water-level columns |
| Lucide Icons | ISC | Operational and SOP status icons |
| Documentation & slide deck (`Z10x-SustainX-R2`) | CC BY 4.0 | Attribution of sources, assumptions, and AI tools |

---

## 5. Submission Details

| Field | Details |
|-------|---------|
| **Competition** | SustainX 2026: The Sustainability Hackathon, Great Lakes Institute of Management (GLIM), Gurgaon (WCSB 2026) |
| **Team** | Z10x |
| **Live hosted demo** | https://drainsense-gurugram-predictive-flood-operations.ai.studio/ |
| **Slide deck** | `Z10x-SustainX-R2` (uploaded via the Unstop portal) |

---

## 6. Disclosure & Citations

- **Documented assumptions:** Live MCG sensor telemetry, private internal GIS/silt databases, and real-time operational feeds are simulated in this prototype. Network links, silt factors, cost figures, and scenario outputs therefore rely on documented operational assumptions. Any unreleased municipal data required in production is explicitly stated as an assumption, per SustainX rules.
- **Public & competition context:** The SustainX 2026 problem brief supplied the data on MCG's 159 waterlogging hotspots, the 607 km drainage desilting mandate, the September 1, 2025 rainfall, traffic, and power outage figures, and the June 2026 desilting status.
- **AI tools cited:** Built with assistance from AI tools (Google AI Studio / Gemini) for drafting, architecture exploration, and prototype code generation. All system logic, assumptions, and outputs were reviewed and verified by the team.

---

## License

- **Source code:** Released under the [MIT License](https://opensource.org/licenses/MIT). Free to use, modify, and adapt with attribution.
- **Documentation & operational framework:** Released under [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/).
