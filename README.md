The closing triple backticks (```) after the Mermaid flowchart were missing or cut off when pasted into GitHub, causing GitHub to swallow the rest of the README.md inside the Mermaid diagram block and throw a Parse error on line 11.
Copy and paste the complete, fixed Markdown below directly into README.md (with the closing ``` properly included and clean Mermaid syntax):
# DrainSense 3D: Predictive Drainage & Cascade Flood Operations for Gurugram

[![License: MIT](https://img.shields.io/badge/Code_License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Docs: CC BY 4.0](https://img.shields.io/badge/Docs_License-CC_BY_4.0-blue.svg)](https://creativecommons.org/licenses/by/4.0/)
[![Competition: SustainX 2026](https://img.shields.io/badge/SustainX_2026-Round_2_Prototype-orange.svg)](#7-submission-details)
[![Status: Simulated Scenario](https://img.shields.io/badge/Data-Simulated_Scenario-red.svg)](#8-disclosure--citations)

> **SIMULATED SCENARIO DISCLOSURE:** All sensor telemetry, 3D water-level animations, and performance metrics in this repository are **Simulated Scenarios** built on documented operational assumptions for **SustainX 2026**[span_1](start_span)[span_1](end_span)[span_2](start_span)[span_2](end_span). Only observed public facts and explicitly documented assumptions are presented as context, and all external sources and AI tools used are cited below[span_3](start_span)[span_3](end_span)[span_4](start_span)[span_4](end_span).

---

## 1. Overview & Core Hypothesis

**DrainSense 3D** is an AI-enabled predictive flood operations system designed for the **Municipal Corporation of Gurugram (MCG)** and **GMDA** to shift urban flood management from reactive pumping to pre-emptive drainage intervention across Gurugram's **159 identified waterlogging hotspots** and **607 km** drainage network[span_5](start_span)[span_5](end_span).

* **Core Thesis:** Gurugram's recurring monsoon flooding is an operational failure rather than a budget failure[span_6](start_span)[span_6](end_span)[span_7](start_span)[span_7](end_span).
* **Zero-PhD Operability:** Built for existing MCG Junior Engineers (JEs), Assistant Engineers (AEs), Executive Engineers (EEs), Pump Crews, and Control Room Operators—requiring no dedicated data science team[span_8](start_span)[span_8](end_span)[span_9](start_span)[span_9](end_span).

---

## 2. Problem Diagnosis

* **Extreme Rainfall Shock:** On September 1, 2025, 133 mm of rain in four hours caused a 20 km traffic jam and a 51-hour power outage across Gurugram[span_10](start_span)[span_10](end_span).
* **Desilting Execution Gap:** By late June 2026, MCG had completed desilting at only 16 of 36 identified hotspots against a May 31 deadline, despite a mandate to desilt 607 km of drainage network[span_11](start_span)[span_11](end_span).
* **Three Operational Bottlenecks:**
  1. **Reactive Maintenance:** Drains and culverts are cleared after citizen complaints rather than ranked by downstream flood impact[span_12](start_span)[span_12](end_span).
  2. **Manual Status Tracking:** Hotspot readiness relies on phone calls and ad-hoc site visits with no early warning signal[span_13](start_span)[span_13](end_span).
  3. **Unranked Dispatch:** Pumps and crews are allocated without hydrological risk scoring across Gurugram's 159 hotspots[span_14](start_span)[span_14](end_span).

---

## 3. End-to-End System Flowchart

```mermaid
flowchart TD
    A["1. Multi-Source Data Inputs<br/>IMD Forecasts + Drain Sensors + CCTV + Silt Logs"] --> B["2. Drainage Topology & 80/20 Engine<br/>Upstream to Culvert to Downstream Graph"]
    B --> C["3. 24-48h AI Risk & Confidence Model<br/>Safe / Caution / Avoid + Action + Owner + Deadline"]
    C --> D["4A. MCG SOP Command<br/>T-48h to Post-Rain Crew & Pump Dispatch"]
    C --> E["4B. RWA Political Economy Ledger<br/>Hydrological Score vs. RWA Override Log"]
    C --> F{"4C. Citizen Alert Guardrail<br/>High Impact + High Confidence?"}
    F -- "Yes" --> G["Public AVOID / CAUTION Alert<br/>SMS, IVR Voice, WhatsApp & Corridor Map"]
    F -- "No" --> H["Field Verification Queue<br/>Zone JE Inspection Before Public Alert"]

4. Key Innovations
 * Interactive 3D Drainage & Cascade Twin (80/20 Leverage): Models upstream feeders, culvert chokepoints, and downstream underpasses or sectors in 3D so operators can simulate how clearing one upstream chokepoint drops flood levels across multiple downstream hotspots.
 * RWA Pressure vs. Hydrological Score Audit Ledger: Protects municipal engineers when influential RWAs demand immediate pump diversion by displaying objective hydrological urgency side-by-side and logging any manual override with a documented reason.
 * Confidence-Gated Citizen Alerts: Prevents alarm fatigue by routing uncertain predictions to a Field Verification Queue first, reserving public Avoid alerts for high-confidence, high-impact events across SMS, IVR voice calls, and web corridors.
 * Rugged Indian-Context Sensor Architecture: Specifies weatherproof, vandal-resistant, low-maintenance ultrasonic/radar drain gauges, automatic rain gauges, and existing underpass CCTV grounded in Indian municipal cost benchmarks.
5. Front-End Prototype Screens
| Screen / Module | Purpose | Interactive Controls & Outputs |
|---|---|---|
| 1. 3D Corridor & Chokepoint Twin | Visualize elevation, silt load, upstream-downstream links, and flood risk in 3D | Horizon selector (T-48h to T-0h), rain and silt sliders, camera presets, node inspector, and one-click Clear Chokepoint / Deploy Pump |
| 2. MCG Operations & SOP Board | Coordinate pre-event and live-rain crew and pump dispatch | SOP phase filter (T-48h to After Rain), role badges (EE, AE, JE, Pump Crew, Control Room), task status toggles, and RWA Override Audit Log |
| 3. Citizen Alert & Verification Hub | Deliver targeted commuter advisories without false-positive fatigue | Safe / Caution / Avoid thresholds, Field Verification Queue, and live SMS, IVR voice script & corridor previews |
| 4. Validation, Sensors & Citations | Display evaluation metrics, hardware specs, and assumptions | Simulated metrics (lead time, precision/recall, missed events, false-alert rate, dispatch time, completion rate, waterlogging reduction), Indian-market sensor specs, and citations |
6. Technology & License Stack
| Layer | Technology / Format | License | Role |
|---|---|---|---|
| Front-End UI | React, TypeScript, Vite | MIT License | Fast, browser-accessible control-room application |
| Styling | Tailwind CSS | MIT License | Clean, high-contrast civic dashboard styling |
| 3D Visualization | Three.js (three) | MIT License | Interactive 3D drainage corridors, links, and water-level columns |
| Icons | Lucide Icons | ISC License | Crisp operational and SOP status icons |
| Deployment | Hosted Demo Link / ZIP | Platform / MIT Code | Public shareable URL for Round 2 evaluation and live demo |
| Documentation | Markdown & Slide Deck (TeamName-SustainX-R2) | CC BY 4.0 | Clear attribution of sources, assumptions, and AI tools |
7. Submission Details
 * Competition: SustainX 2026: The Sustainability Hackathon — Great Lakes Institute of Management (GLIM), Gurgaon (WCSB 2026)
 * Team: [Z10x] 
 * Live Hosted Demo URL: (https://drainsense-gurugram-predictive-flood-operations.ai.studio)

8. Disclosure & Citations
 * Documented Assumptions: Because live MCG sensor telemetry, private internal GIS/silt databases, and real-time operational feeds are simulated in this prototype, network links, silt factors, cost figures, and scenario outputs rely on documented operational assumptions; any unreleased municipal data required in production is explicitly stated as an assumption per SustainX rules.
 * Public & Competition Context: SustainX 2026 problem brief data on MCG's 159 waterlogging hotspots, 607 km drainage desilting mandate, September 1, 2025 rainfall/traffic/power outage figures, and June 2026 desilting status.
 * AI Tools Cited: Built with assistance from AI tools (Google AI Studio / Gemini) for drafting, architecture exploration, and prototype code generation; all system logic, assumptions, and outputs were reviewed and verified by the team.
License
 * Source Code: Released under the MIT License — free to use, modify, and adapt with attribution.
 * Documentation & Operational Framework: Released under Creative Commons Attribution 4.0 International (CC BY 4.0).

