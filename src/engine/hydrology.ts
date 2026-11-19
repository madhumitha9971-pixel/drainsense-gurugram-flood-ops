import {
  ComputedNodeState,
  ConfidenceTier,
  DrainNode,
  ForecastHorizon,
  RiskTier,
  SopPhaseId,
  SopTaskItem,
} from '../types/drainsense';

const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

function getTopologicalOrder(nodes: DrainNode[]): DrainNode[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const inDegree = new Map<string, number>();
  for (const n of nodes) {
    inDegree.set(n.id, n.upstreamIds.filter((id) => byId.has(id)).length);
  }
  const queue: DrainNode[] = nodes.filter((n) => (inDegree.get(n.id) ?? 0) === 0);
  const ordered: DrainNode[] = [];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const curr = queue.shift()!;
    if (visited.has(curr.id)) continue;
    visited.add(curr.id);
    ordered.push(curr);
    for (const downId of curr.downstreamIds) {
      const next = byId.get(downId);
      if (!next) continue;
      const deg = (inDegree.get(downId) ?? 1) - 1;
      inDegree.set(downId, deg);
      if (deg <= 0) {
        queue.push(next);
      }
    }
  }

  for (const n of nodes) {
    if (!visited.has(n.id)) ordered.push(n);
  }
  return ordered;
}

function getTransitiveDownstream(startId: string, byId: Map<string, DrainNode>): Set<string> {
  const result = new Set<string>();
  const stack = [...(byId.get(startId)?.downstreamIds ?? [])];
  while (stack.length > 0) {
    const id = stack.pop()!;
    if (result.has(id)) continue;
    result.add(id);
    const node = byId.get(id);
    if (node) {
      for (const nextId of node.downstreamIds) {
        if (!result.has(nextId)) stack.push(nextId);
      }
    }
  }
  return result;
}

export interface HydrologyParams {
  nodes: DrainNode[];
  horizon: ForecastHorizon;
  rainfallMm: number;
  siltLoadFactor: number;
  clearedNodeIds: Set<string>;
  deployedPumpIds: Set<string>;
  verifiedFieldIds: Set<string>;
}

const HORIZON_BASE_CONFIDENCE: Record<ForecastHorizon, number> = {
  'T-48h': 64,
  'T-24h': 72,
  'T-12h': 80,
  'T-6h': 87,
  'T-0': 94,
};

const TYPE_VULNERABILITY_BONUS: Record<DrainNode['type'], number> = {
  'Upstream Feeder': 2,
  'Chokepoint Culvert': 7,
  'Downstream Underpass': 9,
  'Arterial Road': 5,
  'Residential Sector': 4,
};

function computePass(params: HydrologyParams): Map<string, ComputedNodeState> {
  const {
    nodes,
    horizon,
    rainfallMm,
    siltLoadFactor,
    clearedNodeIds,
    deployedPumpIds,
    verifiedFieldIds,
  } = params;

  const byId = new Map(nodes.map((n) => [n.id, n]));
  const ordered = getTopologicalOrder(nodes);
  const computedMap = new Map<string, ComputedNodeState>();

  const rainStressPts = clamp(Math.round(Math.pow(rainfallMm / 150, 0.72) * 50), 6, 52);

  for (const node of ordered) {
    const isCleared = clearedNodeIds.has(node.id);
    const hasActivePump = node.pumpAssigned || deployedPumpIds.has(node.id);
    const isFieldVerified = verifiedFieldIds.has(node.id);

    const rawEffectiveSilt = node.baselineSiltPct * (0.55 + (siltLoadFactor / 100) * 0.65);
    const effectiveSiltPct = isCleared
      ? Math.max(8, Math.round(node.baselineSiltPct * 0.14))
      : clamp(Math.round(rawEffectiveSilt), 8, 98);

    const localSiltStressPts = Math.round(
      (effectiveSiltPct / 100) * 16 +
        TYPE_VULNERABILITY_BONUS[node.type] +
        node.topographicLowPenalty * 0.55
    );

    let upstreamPenaltyRaw = 0;
    let topUpstreamBlockerId: string | null = null;
    let topUpstreamBlockerName: string | null = null;
    let maxUpstreamContribution = 0;

    for (const upId of node.upstreamIds) {
      const upState = computedMap.get(upId);
      if (!upState) continue;

      const siltBlockageMultiplier = upState.isCleared
        ? 0.24
        : 0.48 + (upState.effectiveSiltPct / 100) * 0.65;
      const pumpReliefMultiplier = upState.hasActivePump ? 0.82 : 1.0;
      const contribution =
        upState.riskScore * 0.22 * siltBlockageMultiplier * pumpReliefMultiplier;

      upstreamPenaltyRaw += contribution;
      if (contribution > maxUpstreamContribution && !upState.isCleared) {
        maxUpstreamContribution = contribution;
        topUpstreamBlockerId = upState.id;
        topUpstreamBlockerName = upState.name;
      }
    }

    const upstreamPenaltyPts = clamp(Math.round(upstreamPenaltyRaw), 0, 28);

    const pumpEfficiency = rainfallMm > 110 ? 0.75 : 1.0;
    const pumpMitigationPts = hasActivePump ? Math.round(12 * pumpEfficiency) : 0;

    const riskScore = clamp(
      Math.round(rainStressPts + localSiltStressPts + upstreamPenaltyPts - pumpMitigationPts),
      5,
      99
    );

    const riskTier: RiskTier = riskScore >= 70 ? 'Avoid' : riskScore >= 40 ? 'Caution' : 'Safe';

    let rawConfidence = HORIZON_BASE_CONFIDENCE[horizon];
    rawConfidence += node.hasUltrasonicSensor ? 6 : -11;
    rawConfidence += node.hasEdgeCctv ? 4 : -4;
    if (rainfallMm >= 95) rawConfidence += 3;
    if (isCleared) rawConfidence += 2;
    let confidenceScore = clamp(Math.round(rawConfidence), 42, 98);
    if (isFieldVerified) {
      confidenceScore = Math.max(confidenceScore, 93);
    }

    const confidenceTier: ConfidenceTier =
      confidenceScore >= 75 ? 'High' : confidenceScore >= 62 ? 'Medium' : 'Low';

    let primaryCause = '';
    if (isCleared && riskTier === 'Safe') {
      primaryCause = `Culvert cleared (${effectiveSiltPct}% residual silt) · Flow within capacity`;
    } else if (upstreamPenaltyPts >= 13 && topUpstreamBlockerName) {
      primaryCause = `Upstream Culvert Blockage at ${topUpstreamBlockerName} (+${upstreamPenaltyPts} risk pts)`;
    } else if (rainfallMm >= 100) {
      primaryCause = `High Burst Rainfall (${rainfallMm} mm) overwhelming ${node.type.toLowerCase()} capacity`;
    } else if (effectiveSiltPct >= 68) {
      primaryCause = `Desilting Lag (${effectiveSiltPct}% silt buildup) restricting storm drain outflow`;
    } else if (node.type === 'Downstream Underpass') {
      primaryCause = `Low-elevation underpass bowl + ${rainfallMm} mm rainfall burst`;
    } else {
      primaryCause = `Moderate burst runoff (${rainfallMm} mm) with ${effectiveSiltPct}% silt load`;
    }

    let recommendedAction = '';
    let actionDeadline = '';
    if (riskTier === 'Safe') {
      recommendedAction = 'Routine sensor & grate check; maintain standby readiness';
      actionDeadline = horizon === 'T-0' ? 'Live Monitoring' : 'Before T-6h';
    } else if (!isCleared && (node.type === 'Chokepoint Culvert' || node.type === 'Upstream Feeder')) {
      recommendedAction = 'Clear chokepoint with JCB + jetting suction crew';
      actionDeadline =
        horizon === 'T-48h' ? 'By T-24h' : horizon === 'T-24h' ? 'By T-12h' : 'Immediate (<2 hrs)';
    } else if (!hasActivePump && node.type === 'Downstream Underpass') {
      recommendedAction = 'Deploy 150 HP mobile pump & activate underpass watch';
      actionDeadline = horizon === 'T-0' ? 'Immediate Dispatch' : 'By T-6h';
    } else if (upstreamPenaltyPts >= 12 && topUpstreamBlockerName) {
      recommendedAction = `Clear upstream blocker (${topUpstreamBlockerName}) & keep sump pumps active`;
      actionDeadline = 'By T-12h';
    } else {
      recommendedAction = 'Assign Zone JE inspection & clear storm-water catchpit grates';
      actionDeadline = horizon === 'T-0' ? 'Active Patrol' : 'By T-6h';
    }

    const downstreamReach = getTransitiveDownstream(node.id, byId);
    const estimatedWaterDepthCm =
      riskScore < 40
        ? Math.round(riskScore * 0.25)
        : riskScore < 70
        ? Math.round(12 + (riskScore - 40) * 0.9)
        : Math.round(40 + (riskScore - 70) * 2.4);

    const sensorDrainFillPct = clamp(
      Math.round(riskScore * 0.88 + (isCleared ? -10 : 8)),
      12,
      99
    );

    const alertRouting: ComputedNodeState['alertRouting'] =
      riskTier === 'Avoid'
        ? confidenceScore >= 75
          ? 'Auto-Publish'
          : 'Field Verification First'
        : 'Monitor';

    computedMap.set(node.id, {
      ...node,
      effectiveSiltPct,
      isCleared,
      hasActivePump,
      isFieldVerified,
      rainStressPts,
      localSiltStressPts,
      upstreamPenaltyPts,
      pumpMitigationPts,
      riskScore,
      riskTier,
      confidenceScore,
      confidenceTier,
      primaryCause,
      topUpstreamBlockerId,
      topUpstreamBlockerName,
      recommendedAction,
      actionDeadline,
      downstreamReachCount: downstreamReach.size,
      downstreamImprovedIfCleared: 0,
      netRiskReductionIfCleared: 0,
      leverageRiskDrop: 0,
      estimatedWaterDepthCm,
      sensorDrainFillPct,
      alertRouting,
    });
  }

  return computedMap;
}

export interface HydrologyAnalysis {
  nodeStates: ComputedNodeState[];
  nodeMap: Map<string, ComputedNodeState>;
  avoidCount: number;
  cautionCount: number;
  safeCount: number;
  downstreamProtectedCount: number;
  netNetworkRiskReduction: number;
  topChokepoints: ComputedNodeState[];
  effectiveLeadTimeHours: number;
}

export function runHydrologyModel(params: HydrologyParams): HydrologyAnalysis {
  const currentMap = computePass(params);

  const baselineMap = computePass({
    ...params,
    clearedNodeIds: new Set<string>(),
  });

  let downstreamProtectedCount = 0;
  let netNetworkRiskReduction = 0;
  const tierRank = (t: RiskTier) => (t === 'Safe' ? 0 : t === 'Caution' ? 1 : 2);

  for (const [id, curr] of currentMap.entries()) {
    const base = baselineMap.get(id);
    if (!base) continue;
    const diff = Math.max(0, base.riskScore - curr.riskScore);
    netNetworkRiskReduction += diff;
    if (
      curr.upstreamIds.length > 0 &&
      (tierRank(curr.riskTier) < tierRank(base.riskTier) || diff >= 5)
    ) {
      downstreamProtectedCount += 1;
    }
  }

  const byId = new Map(params.nodes.map((n) => [n.id, n]));
  for (const [id, curr] of currentMap.entries()) {
    if (curr.downstreamIds.length === 0) {
      curr.leverageRiskDrop = 0;
      curr.downstreamImprovedIfCleared = 0;
      curr.netRiskReductionIfCleared = 0;
      continue;
    }
    const testCleared = new Set(params.clearedNodeIds);
    if (curr.isCleared) {
      testCleared.delete(id);
    } else {
      testCleared.add(id);
    }
    const counterMap = computePass({
      ...params,
      clearedNodeIds: testCleared,
    });

    const reach = getTransitiveDownstream(id, byId);
    let totalDownstreamDrop = 0;
    let improvedNodes = 0;

    for (const targetId of reach) {
      const currTarget = currentMap.get(targetId);
      const otherTarget = counterMap.get(targetId);
      if (currTarget && otherTarget) {
        const diff = curr.isCleared
          ? Math.max(0, otherTarget.riskScore - currTarget.riskScore)
          : Math.max(0, currTarget.riskScore - otherTarget.riskScore);
        totalDownstreamDrop += diff;
        if (diff >= 4 || tierRank(currTarget.riskTier) !== tierRank(otherTarget.riskTier)) {
          improvedNodes += 1;
        }
      }
    }

    const otherSelf = counterMap.get(id);
    const selfDiff = otherSelf
      ? curr.isCleared
        ? Math.max(0, otherSelf.riskScore - curr.riskScore)
        : Math.max(0, curr.riskScore - otherSelf.riskScore)
      : 0;

    curr.downstreamImprovedIfCleared = improvedNodes;
    curr.netRiskReductionIfCleared = Math.round(totalDownstreamDrop + selfDiff);
    curr.leverageRiskDrop = Math.round(totalDownstreamDrop + selfDiff * 0.4);
  }

  const nodeStates = params.nodes.map((n) => currentMap.get(n.id)!);

  const avoidCount = nodeStates.filter((n) => n.riskTier === 'Avoid').length;
  const cautionCount = nodeStates.filter((n) => n.riskTier === 'Caution').length;
  const safeCount = nodeStates.filter((n) => n.riskTier === 'Safe').length;

  const topChokepoints = [...nodeStates]
    .filter((n) => n.downstreamIds.length > 0)
    .sort((a, b) => {
      if (b.leverageRiskDrop !== a.leverageRiskDrop) return b.leverageRiskDrop - a.leverageRiskDrop;
      return b.riskScore - a.riskScore;
    })
    .slice(0, 6);

  const leadTimeMap: Record<ForecastHorizon, number> = {
    'T-48h': 48,
    'T-24h': 36,
    'T-12h': 18,
    'T-6h': 9,
    'T-0': 2,
  };

  return {
    nodeStates,
    nodeMap: currentMap,
    avoidCount,
    cautionCount,
    safeCount,
    downstreamProtectedCount,
    netNetworkRiskReduction: Math.round(netNetworkRiskReduction),
    topChokepoints,
    effectiveLeadTimeHours: leadTimeMap[params.horizon],
  };
}

export function generateSopTasks(nodeStates: ComputedNodeState[]): SopTaskItem[] {
  const sorted = [...nodeStates].sort((a, b) => b.riskScore - a.riskScore);
  const tasks: SopTaskItem[] = [];

  sorted.forEach((node, idx) => {
    let phase: Exclude<SopPhaseId, 'All'> = 'T-48 to T-24h';
    let phaseLabel = 'EE Priority Ranking & Inspections';
    let responsibleRole: SopTaskItem['responsibleRole'] = 'Executive Engineer';
    let requiredAction = node.recommendedAction;
    let actionType: SopTaskItem['actionType'] = 'verify';

    if (node.type === 'Chokepoint Culvert' || node.type === 'Upstream Feeder') {
      if (node.riskScore >= 60) {
        phase = 'T-24 to T-12h';
        phaseLabel = 'JE/AE Culvert Clearing';
        responsibleRole = node.assignedOwner.startsWith('AE')
          ? 'Assistant Engineer'
          : 'Zone Junior Engineer';
        requiredAction = `Clear ${node.name} (${node.effectiveSiltPct}% silt) to protect ${node.downstreamReachCount} downstream nodes`;
        actionType = 'clear';
      } else {
        phase = 'T-48 to T-24h';
        phaseLabel = 'EE Priority Ranking';
        responsibleRole = 'Executive Engineer';
        requiredAction = `Confirm pre-monsoon culvert inspection & assign JE clearance crew`;
        actionType = 'clear';
      }
    } else if (node.type === 'Downstream Underpass') {
      if (node.riskScore >= 70 && node.hasActivePump) {
        phase = 'T-6 to T-0h';
        phaseLabel = 'Alerts & Underpass Watch';
        responsibleRole = 'Control Room Operator';
        requiredAction = `Monitor ${node.shortLabel} underpass CCTV/sensors & issue corridor alerts`;
        actionType = 'verify';
      } else {
        phase = 'T-12 to T-6h';
        phaseLabel = 'Pump Pre-Positioning';
        responsibleRole = 'Pump Crew';
        requiredAction = `Pre-position 150 HP dewatering pump & crew at ${node.shortLabel} with EE sign-off`;
        actionType = 'pump';
      }
    } else if (node.riskScore >= 72) {
      phase = 'During Rain';
      phaseLabel = 'Live Re-Dispatch';
      responsibleRole = 'Pump Crew';
      requiredAction = `Track live water levels & re-dispatch mobile suction crew to ${node.name}`;
      actionType = 'pump';
    } else if (idx % 5 === 0) {
      phase = 'After Rain';
      phaseLabel = 'Post-Rain Audit & Retune';
      responsibleRole = 'Executive Engineer';
      requiredAction = `Log actual flooding vs. prediction; retune silt lag & audit dispatch`;
      actionType = 'audit';
    } else {
      phase = 'T-48 to T-24h';
      phaseLabel = 'EE Priority Ranking';
      responsibleRole = 'Zone Junior Engineer';
      requiredAction = `Inspect catchpit grates along ${node.name} (${node.zone})`;
      actionType = 'verify';
    }

    tasks.push({
      id: `sop-${node.id}`,
      nodeId: node.id,
      nodeName: node.name,
      zone: node.zone,
      priorityRank: idx + 1,
      phase,
      phaseLabel,
      requiredAction,
      responsibleRole,
      assignedOwner: node.assignedOwner,
      confidenceScore: node.confidenceScore,
      confidenceTier: node.confidenceTier,
      riskScore: node.riskScore,
      riskTier: node.riskTier,
      actionType,
    });
  });

  return tasks;
}
