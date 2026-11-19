# DrainSense 3D: Predictive Drainage & Cascade Flood Operations for Gurugram

> **SIMULATED SCENARIO DISCLOSURE:** All sensor telemetry, 3D water-level animations, and performance metrics in this repository are **Simulated Scenarios** built on documented operational assumptions for **SustainX 2026**[span_0](start_span)[span_0](end_span)[span_1](start_span)[span_1](end_span). Only observed public facts and explicitly documented assumptions are presented as context, and all external sources and AI tools used are cited below[span_2](start_span)[span_2](end_span)[span_3](start_span)[span_3](end_span).

---

## 1. Overview & Core Hypothesis

**DrainSense 3D** is an AI-enabled predictive flood operations system designed for the **Municipal Corporation of Gurugram (MCG)** and **GMDA** to shift urban flood management from reactive pumping to pre-emptive drainage intervention across Gurugram's **159 identified waterlogging hotspots** and **607 km** drainage network[span_4](start_span)[span_4](end_span).

* **Core Thesis:** Gurugram's recurring monsoon flooding is an operational failure rather than a budget failure[span_5](start_span)[span_5](end_span)[span_6](start_span)[span_6](end_span).
* **Zero-PhD Operability:** Built for existing MCG Junior Engineers (JEs), Assistant Engineers (AEs), Executive Engineers (EEs), Pump Crews, and Control Room Operators—requiring no dedicated data science team[span_7](start_span)[span_7](end_span)[span_8](start_span)[span_8](end_span).

---

## 2. Problem Diagnosis

* **Extreme Rainfall Shock:** On September 1, 2025, 133 mm of rain in four hours caused a 20 km traffic jam and a 51-hour power outage across Gurugram[span_9](start_span)[span_9](end_span).
* **Desilting Execution Gap:** By late June 2026, MCG had completed desilting at only 16 of 36 identified hotspots against a May 31 deadline, despite a mandate to desilt 607 km of drainage network[span_10](start_span)[span_10](end_span).
* **Three Operational Bottlenecks:**
  1. **Reactive Maintenance:** Drains and culverts are cleared after citizen complaints rather than ranked by downstream flood impact[span_11](start_span)[span_11](end_span).
  2. **Manual Status Tracking:** Hotspot readiness relies on phone calls and ad-hoc site visits with no early warning signal[span_12](start_span)[span_12](end_span).
  3. **Unranked Dispatch:** Pumps and crews are allocated without hydrological risk scoring across Gurugram's 159 hotspots[span_13](start_span)[span_13](end_span).

---

## 3. End-to-End System Flowchart

```text
[1. DATA & CONTEXT INPUTS]
  |-- IMD Rainfall Forecasts & Nowcasts
  |-- Vandal-Proof Drain Level Sensors, Rain Gauges & Underpass CCTV
  |-- Historical Flood Records + Seasonal Silt / Desilting Status (607 km / 159 hotspots)
        |
        v
[2. DRAINAGE TOPOLOGY & 80/20 CHOKEPOINT ENGINE]
  |-- Directed Upstream -> Culvert Chokepoint -> Downstream Underpass/Sector Graph
  |-- Ranks High-Leverage Nodes (~20% share driving ~80% systemic flood cascade)
        |
        v
[3. 24-48h AI RISK & CONFIDENCE MODEL]
  |-- Outputs: Risk Tier (Safe / Caution / Avoid), Confidence Score, Cause, Action, Owner, Deadline
        |
        +-------------------------------+-------------------------------+
        |                               |                               |
        v                               v                               v
[4A. MCG SOP COMMAND]          [4B. RWA OVERRIDE LEDGER]       [4C. CITIZEN ALERT GUARDRAIL]
  |-- T-48h to T-24h: EE Rank     |-- Compares Hydrological       |-- High Conf. + High Risk
  |-- T-24h to T-12h: JE/AE Clear     Score vs. RWA Request         --> Public AVOID Alert
  |-- T-12h to T-6h: Pump Prep    |-- Logs Override + Reason      |-- Low/Med Conf. + High Risk
  |-- T-6h to T-0h: Alert/Watch       for Audit Trail               --> Field Verification First
  |-- During & After Rain: Audit                                  |-- SMS + IVR + Web/Corridor

4. Key Innovations, Front-End & License Stack
​Key Innovations
​3D Drainage & Cascade Twin (80/20 Leverage): Models upstream feeders, culvert chokepoints, and downstream underpasses or sectors in 3D so operators can see how clearing an upstream chokepoint drops downstream flood risk.  
​RWA Pressure vs. Hydrological Score Audit Ledger: Compares objective hydrological urgency against RWA pump or crew requests and logs any manual override with a documented reason.  
​Confidence-Gated Citizen Alerts: Routes lower-confidence predictions to Field Verification first to prevent false-alarm fatigue, using Safe / Caution / Avoid tiers across SMS, IVR voice calls (for non-smartphone users), and corridor/web views.  
​Rugged Indian-Context Sensor Architecture: Uses vandal-resistant, outdoor weatherproof, low-maintenance drain level gauges, rain gauges, and underpass CCTV grounded in Indian municipal cost benchmarks.  
​Front-End Screens
​1. 3D Corridor & Chokepoint Twin: Interactive 3D view with horizon (T-48h to T-0h), rain/silt controls, camera presets, node inspector, and one-click chokepoint/pump actions.  
​2. MCG Operations & SOP Board: Stage-filtered SOP tasks (T-48h to After Rain) by role (EE, AE, JE, Pump Crew, Control Room) with status updates and the RWA Override Audit Log.  
​3. Citizen Alert & Verification Hub: Safe / Caution / Avoid thresholds, Field Verification Queue, and live SMS, IVR voice script & corridor previews.  
​4. Validation, Sensors & Citations: Simulated evaluation metrics, Indian-market sensor specs, and documented assumptions.  
​Front-End & License Stack
​React, TypeScript & Vite: MIT License — Fast browser-based front-end application.
​Tailwind CSS: MIT License — Clean, high-contrast civic dashboard styling.
​Three.js (three): MIT License — Interactive 3D drainage corridors, links, and water-level columns.
​Lucide Icons: ISC License — Clear SOP and status icons.
​Documentation & Slide Deck (Z10x-SustainX-R2): CC BY 4.0 — Attribution of sources, assumptions, and AI tools.  
​5. Submission Details
​Competition: SustainX 2026: The Sustainability Hackathon — Great Lakes Institute of Management (GLIM), Gurgaon (WCSB 2026).  
​Team: Z10x.  
​Live Hosted Demo URL: https://drainsense-gurugram-predictive-flood-operations.ai.studio.  
​Slide Deck (Z10x-SustainX-R2): Uploaded via Unstop Portal.  
​6. Disclosure & Citations
​Documented Assumptions: Because live MCG sensor telemetry, private internal GIS/silt databases, and real-time operational feeds are simulated in this prototype, network links, silt factors, cost figures, and scenario outputs rely on documented operational assumptions; any unreleased municipal data required in production is explicitly stated as an assumption per SustainX rules.  
​Public & Competition Context: SustainX 2026 problem brief data on MCG's 159 waterlogging hotspots, 607 km drainage desilting mandate, September 1, 2025 rainfall/traffic/power outage figures, and June 2026 desilting status.  
​AI Tools Cited: Built with assistance from AI tools (Google AI Studio / Gemini) for drafting, architecture exploration, and prototype code generation; all system logic, assumptions, and outputs were reviewed and verified by the team.  
