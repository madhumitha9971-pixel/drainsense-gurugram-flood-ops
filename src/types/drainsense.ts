export type ZoneId = 'Zone 1' | 'Zone 2' | 'Zone 3' | 'Zone 4';

export type NodeType =
  | 'Upstream Feeder'
  | 'Chokepoint Culvert'
  | 'Downstream Underpass'
  | 'Arterial Road'
  | 'Residential Sector';

export type RwaPressureLevel = 'Low' | 'Medium' | 'High';

export type ForecastHorizon = 'T-48h' | 'T-24h' | 'T-12h' | 'T-6h' | 'T-0';

export type RiskTier = 'Safe' | 'Caution' | 'Avoid';

export type ConfidenceTier = 'Low' | 'Medium' | 'High';

export type AppTab = 'twin3d' | 'operations' | 'alerts' | 'validation';

export type CameraPresetId = 'overview' | 'nh48' | 'badshahpur';

export type SopPhaseId =
  | 'All'
  | 'T-48 to T-24h'
  | 'T-24 to T-12h'
  | 'T-12 to T-6h'
  | 'T-6 to T-0h'
  | 'During Rain'
  | 'After Rain';

export type ResponsibleRole =
  | 'Executive Engineer'
  | 'Assistant Engineer'
  | 'Zone Junior Engineer'
  | 'Pump Crew'
  | 'Control Room Operator';

export type TaskStatus = 'Pending' | 'Dispatched' | 'Verified';

export interface DrainNode {
  id: string;
  name: string;
  shortLabel: string;
  zone: ZoneId;
  type: NodeType;
  lat: number;
  lng: number;
  elevationM: number; // Relative terrain elevation for 3D scene grounding
  upstreamIds: string[];
  downstreamIds: string[];
  baselineSiltPct: number;
  pumpAssigned: boolean;
  rwaPressureLevel: RwaPressureLevel;
  assignedOwner: string;
  topographicLowPenalty: number;
  hasUltrasonicSensor: boolean;
  hasEdgeCctv: boolean;
  isTop20Chokepoint?: boolean;
  representedHotspotsCount: number; // 30 active network nodes -> 159 MCG hotspots
  drainLengthKm: number; // Segment share of 607 km drainage network mandate
  alternateRoute: string;
  hindiName: string;
  corridorTag: 'NH-48' | 'Sohna Road' | 'Golf Course Road' | 'Old Gurugram' | 'Dwarka Expy';
}

export interface ComputedNodeState extends DrainNode {
  effectiveSiltPct: number;
  isCleared: boolean;
  hasActivePump: boolean;
  isFieldVerified: boolean;
  rainStressPts: number;
  localSiltStressPts: number;
  upstreamPenaltyPts: number;
  pumpMitigationPts: number;
  riskScore: number;
  riskTier: RiskTier;
  confidenceScore: number;
  confidenceTier: ConfidenceTier;
  primaryCause: string;
  topUpstreamBlockerId: string | null;
  topUpstreamBlockerName: string | null;
  recommendedAction: string;
  actionDeadline: string;
  downstreamReachCount: number;
  downstreamImprovedIfCleared: number;
  netRiskReductionIfCleared: number;
  leverageRiskDrop: number;
  estimatedWaterDepthCm: number;
  sensorDrainFillPct: number;
  alertRouting: 'Auto-Publish' | 'Field Verification First' | 'Monitor';
}

export interface SopTaskItem {
  id: string;
  nodeId: string;
  nodeName: string;
  zone: ZoneId;
  priorityRank: number;
  phase: Exclude<SopPhaseId, 'All'>;
  phaseLabel: string;
  requiredAction: string;
  responsibleRole: ResponsibleRole;
  assignedOwner: string;
  confidenceScore: number;
  confidenceTier: ConfidenceTier;
  riskScore: number;
  riskTier: RiskTier;
  actionType: 'clear' | 'pump' | 'verify' | 'audit';
}

export interface RwaEscalationScenario {
  id: string;
  title: string;
  requestingRwaName: string;
  requestingNodeId: string;
  requestingZone: ZoneId;
  requestedPumps: number;
  rwaDemandSummary: string;
  impactedNodeId: string;
  impactedZone: ZoneId;
  vulnerableNote: string;
  rwaCommuterExposure: number;
  vulnerableCommuterExposure: number;
}

export interface AuditLedgerEntry {
  id: string;
  timestamp: string;
  actor: string;
  decisionType:
    | 'Kept Hydrological Priority'
    | 'Override Logged'
    | 'Chokepoint Cleared'
    | 'Pump Deployed'
    | 'Field Alert Verified'
    | 'Post-Rain Audit Logged';
  locationSummary: string;
  scoreComparison: string;
  justification: string;
}

export interface ValidationMetric {
  id: string;
  metric: string;
  reactiveBaseline: string;
  drainSensePredictive: string;
  deltaSummary: string;
  unitNote: string;
}

export interface SensorSpecItem {
  id: string;
  component: string;
  technicalSpec: string;
  deploymentScope: string;
  unitCostInr: number;
  pilotQty: number;
  powerAndComms: string;
}

export interface RolloutPhase {
  phase: string;
  timeline: string;
  scope: string;
  deliverables: string;
  budgetEstimateInr: string;
}
