import {
  AuditLedgerEntry,
  RolloutPhase,
  RwaEscalationScenario,
  SensorSpecItem,
  ValidationMetric,
} from '../types/drainsense';

export const RWA_ESCALATION_SCENARIOS: RwaEscalationScenario[] = [
  {
    id: 'rwa-sec56-vs-herohonda',
    title: 'Sector 56 RWA Pump Diversion Escalation',
    requestingRwaName: 'Sector 56 / Golf Course Belt RWA Federation',
    requestingNodeId: 'sector-56',
    requestingZone: 'Zone 3',
    requestedPumps: 2,
    rwaDemandSummary:
      'Influential RWA escalated via Councillor Office requesting immediate diversion of 2 high-capacity 150 HP mobile pumps and crew to Sector 56 internal lane.',
    impactedNodeId: 'hero-honda-chowk',
    impactedZone: 'Zone 1',
    vulnerableNote:
      'NH-48 arterial bowl serving Hero Honda Chowk & Narsinghpur industrial corridor; protects emergency ambulance access and 3 downstream sectors.',
    rwaCommuterExposure: 4200,
    vulnerableCommuterExposure: 68500,
  },
  {
    id: 'rwa-dlf1-vs-narsinghpur',
    title: 'DLF Phase-1 Priority Crew Request',
    requestingRwaName: 'DLF Phase-1 & Qutab Enclave RWA',
    requestingNodeId: 'dlf-phase1-underpass',
    requestingZone: 'Zone 3',
    requestedPumps: 1,
    rwaDemandSummary:
      'RWA demands extra standby suction tanker & mobile pump shifted from Narsinghpur service lane ahead of evening office rush.',
    impactedNodeId: 'narsinghpur',
    impactedZone: 'Zone 1',
    vulnerableNote:
      'Chronic NH-48 highway bottleneck where 86% silt buildup threatens 20 km gridlock and adjacent worker settlements.',
    rwaCommuterExposure: 14500,
    vulnerableCommuterExposure: 54000,
  },
];

export const INITIAL_AUDIT_LEDGER: AuditLedgerEntry[] = [
  {
    id: 'aud-01',
    timestamp: '09:42 IST',
    actor: 'EE Zone 1 (SOP Auto-Rank)',
    decisionType: 'Pump Deployed',
    locationSummary: 'Hero Honda Chowk & Narsinghpur (NH-48)',
    scoreComparison: 'Hydrological Impact 88 vs Threshold 70',
    justification:
      'Pre-positioned 2x 150 HP diesel suction pumps at NH-48 bowl under T-12 to T-6h SOP stage.',
  },
  {
    id: 'aud-02',
    timestamp: '10:15 IST',
    actor: 'Control Room Operator',
    decisionType: 'Kept Hydrological Priority',
    locationSummary: 'Palam Vihar Block C vs. Basai Chowk Outfall',
    scoreComparison: 'Hydrological Impact 81 vs. RWA Request 44 (+37 pts)',
    justification:
      'Kept Hydrological Priority: Basai Chowk outfall protects 3 downstream sectors along Najafgarh Drain.',
  },
];

export const VALIDATION_METRICS: ValidationMetric[] = [
  {
    id: 'lead-time',
    metric: 'Warning Lead Time',
    reactiveBaseline: '1.8 hrs',
    drainSensePredictive: '36.5 hrs',
    deltaSummary: '+34.7 hrs advance window',
    unitNote: 'IMD 48h/24h forecast + cascade graph',
  },
  {
    id: 'precision',
    metric: 'Precision',
    reactiveBaseline: '54%',
    drainSensePredictive: '84%',
    deltaSummary: '+30 pts fewer false triggers',
    unitNote: '75% confidence guardrail active',
  },
  {
    id: 'recall',
    metric: 'Recall',
    reactiveBaseline: '51%',
    drainSensePredictive: '89%',
    deltaSummary: '+38 pts hotspot capture',
    unitNote: 'Across 159 MCG hotspots',
  },
  {
    id: 'missed-events',
    metric: 'Missed High-Risk Events',
    reactiveBaseline: '14 events',
    drainSensePredictive: '2 events',
    deltaSummary: '-85.7% blind spots',
    unitNote: 'Simulated monsoon season replay',
  },
  {
    id: 'false-alert',
    metric: 'False-Alert Rate',
    reactiveBaseline: '34%',
    drainSensePredictive: '11%',
    deltaSummary: '-23 pts alarm fatigue drop',
    unitNote: 'Low-confidence held for Field Verification',
  },
  {
    id: 'dispatch-time',
    metric: 'Alert-to-Dispatch Time',
    reactiveBaseline: '115 mins',
    drainSensePredictive: '18 mins',
    deltaSummary: '6.4x faster crew mobilization',
    unitNote: 'Pre-mapped JE/AE/Pump SOP stages',
  },
  {
    id: 'maint-completion',
    metric: 'Maintenance Completion Rate',
    reactiveBaseline: '44% (16/36)',
    drainSensePredictive: '86% (31/36)',
    deltaSummary: '+42 pts 80/20 culvert clearing',
    unitNote: 'Targeted top 20% upstream chokepoints',
  },
  {
    id: 'duration-reduction',
    metric: 'Waterlogging Duration Reduction',
    reactiveBaseline: '0% (Baseline)',
    drainSensePredictive: '-48%',
    deltaSummary: '48% faster drainage clearance',
    unitNote: 'Modeled on Sept 1, 2025 (133 mm / 4h)',
  },
];

export const SENSOR_HARDWARE_SPECS: SensorSpecItem[] = [
  {
    id: 'spec-ultrasonic',
    component: 'IP68 Vandal-Resistant Radar / Ultrasonic Drain Sensor',
    technicalSpec:
      '60 GHz non-contact radar, ±2 mm accuracy, PTFE anti-fouling shroud, recessed SS316 manhole cage',
    deploymentScope: 'Top 20% High-Leverage Culverts & Outfalls (32 units)',
    unitCostInr: 28500,
    pilotQty: 32,
    powerAndComms: 'Li-SOCl2 + Solar trickle · LoRaWAN / 4G',
  },
  {
    id: 'spec-raingauge',
    component: 'Automatic Tipping-Bucket Rain Gauge (ARG)',
    technicalSpec:
      '0.2 mm resolution, dual-reed switch, bird/debris guard, 15-min IMD-aligned burst logging',
    deploymentScope: '4 Zone Hubs + 4 Badshahpur/Aravalli Catchments (8 units)',
    unitCostInr: 34000,
    pilotQty: 8,
    powerAndComms: '12W Solar + 7-day LiFePO4 · 4G LTE',
  },
  {
    id: 'spec-edge-cctv',
    component: 'Underpass Edge-AI CCTV & Retroreflective Depth Gauge',
    technicalSpec:
      '4MP Starlight IP67 camera + enamel water-depth staff + on-edge NPU flood-line classifier',
    deploymentScope: '12 Key Underpasses (Rajiv, IFFCO, Hero Honda, DLF Ph-1/5, Shankar Chowk)',
    unitCostInr: 62000,
    pilotQty: 12,
    powerAndComms: 'Grid + 7-day UPS · Fiber / Dual-SIM 4G',
  },
  {
    id: 'spec-solar-battery',
    component: 'Solar Panel + 7-Day Battery Autonomy Enclosure',
    technicalSpec:
      '20W monocrystalline panel, IP67 pole enclosure, 24Ah LiFePO4 (survives 51h+ grid blackouts)',
    deploymentScope: 'Remote culvert & catchment rain gauge nodes (40 units)',
    unitCostInr: 18500,
    pilotQty: 40,
    powerAndComms: 'MPPT controller · Tamper reed switch',
  },
  {
    id: 'spec-gateway',
    component: 'Dual-Path Cellular & LoRaWAN Telemetry Gateway',
    technicalSpec:
      'IP67 pole concentrator, dual-SIM 4G LTE failover, 30-day local SD ring buffer for storm outages',
    deploymentScope: 'Zone 1–4 MCG Ward Offices & GMDA ICCC Uplinks (8 gateways)',
    unitCostInr: 24000,
    pilotQty: 8,
    powerAndComms: 'PoE / Solar + 7-day backup · MQTT TLS',
  },
];

export const ROLLOUT_ROADMAP: RolloutPhase[] = [
  {
    phase: 'Phase 1 · Pre-Monsoon 80/20 Pilot (Months 1–3)',
    timeline: 'Days 1–90',
    scope: '32 High-Leverage Chokepoints & 12 Critical Underpasses',
    deliverables:
      'Deploy 32 radar drain sensors, 8 ARGs, 12 Edge-AI CCTV gauges, and live MCG SOP Command & RWA Audit Log.',
    budgetEstimateInr: '₹53.44 Lakhs',
  },
  {
    phase: 'Phase 2 · 159 Hotspot Network Expansion (Months 4–9)',
    timeline: 'Months 4–9',
    scope: 'All 159 MCG Waterlogging Hotspots across Zones 1–4',
    deliverables:
      'Expand sensor coverage to secondary feeders, integrate GPS telemetry from 100% contracted dewatering pumps, launch public SMS/IVR gateway.',
    budgetEstimateInr: '₹1.68 Crores',
  },
  {
    phase: 'Phase 3 · Full 607 km Drainage Mandate (Months 10–18)',
    timeline: 'Months 10–18',
    scope: 'Complete 607 km MCG + GMDA Primary/Secondary Drain Network',
    deliverables:
      'Closed-loop predictive desilting contracts tied to verified pre-monsoon sensor baselines and automated ICCC traffic rerouting.',
    budgetEstimateInr: '₹3.45 Crores',
  },
];

export const DATA_ASSUMPTIONS = {
  publicBenchmarks: [
    {
      title: 'IMD Forecasts & 3-Hour Nowcasts',
      detail:
        'Forecast horizons (T-48h to T-0) reflect India Meteorological Department district rainfall advisories and Doppler radar nowcast intervals for Gurugram.',
    },
    {
      title: 'MCG 159 Waterlogging Hotspots & 607 km Drainage Mandate',
      detail:
        'The 30 active 3D network nodes scale directly to MCG’s 159 identified waterlogging hotspots and 607 km drainage network mandate across Zones 1–4.',
    },
    {
      title: 'Sept 1, 2025 Benchmark (133 mm / 4h · 20 km Jam · 51h Power Outage)',
      detail:
        'Extreme event replay calibrates runoff intensity, underpass ponding, and 7-day solar/battery telemetry resilience against the Sept 1, 2025 disruption (133 mm rain in 4 hours, 20 km traffic jam, 51-hour power outage).',
    },
    {
      title: 'June 2026 Desilting Lag (16 of 36 Completed vs. May 31 Deadline)',
      detail:
        'Default 58% Silt / Desilting Lag reflects the documented June 2026 pre-monsoon gap where only 16 of 36 critical hotspots completed desilting by late June vs. the May 31 deadline.',
    },
  ],
  liveMcgInputsRequired: [
    {
      title: 'Live Drain & Culvert Level Telemetry',
      detail:
        '5-minute ultrasonic/radar depth readings along Badshahpur Drain, Leg-1, Leg-2, and Leg-3 outfalls.',
    },
    {
      title: 'GPS-Tracked Mobile Pump & Suction Fleet',
      detail:
        'Live dispatch status, runtime telemetry, and pump capacity (HP) from MCG/GMDA dewatering crews.',
    },
    {
      title: 'Zone JE Geotagged Clearing Verification',
      detail:
        'Before/after photo verification from Junior Engineers confirming culvert clearance to update 3D cascade risk live.',
    },
    {
      title: 'GMDA ICCC Underpass CCTV Feeds',
      detail:
        'Existing camera feeds at Rajiv Chowk, IFFCO, Hero Honda, and Golf Course Road underpasses for Edge-AI flood-line confirmation.',
    },
  ],
};
