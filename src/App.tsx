import { useMemo, useState } from 'react';
import { GURUGRAM_NODES, TOP_6_CHOKEPOINT_IDS } from './data/gurugramNodes';
import { INITIAL_AUDIT_LEDGER } from './data/staticData';
import { generateSopTasks, runHydrologyModel } from './engine/hydrology';
import {
  AppTab,
  AuditLedgerEntry,
  ForecastHorizon,
  SopTaskItem,
  TaskStatus,
} from './types/drainsense';
import { HeaderAndBanner } from './components/HeaderAndBanner';
import { Twin3DTab } from './components/Twin3DTab';
import { OperationsBoardTab } from './components/OperationsBoardTab';
import { CitizenAlertTab } from './components/CitizenAlertTab';
import { ValidationInfraTab } from './components/ValidationInfraTab';
import { AssumptionsModal } from './components/AssumptionsModal';
import { GuidedJuryDemo } from './components/GuidedJuryDemo';

function formatCurrentIst(): string {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${hh}:${mm} IST`;
}

const PRE_RAIN_PHASES = new Set([
  'T-48 to T-24h',
  'T-24 to T-12h',
  'T-12 to T-6h',
  'T-6 to T-0h',
]);

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('twin3d');

  // Scenario Control Bar live inputs
  const [horizon, setHorizon] = useState<ForecastHorizon>('T-24h');
  const [rainfallMm, setRainfallMm] = useState<number>(60);
  const [siltLoadFactor, setSiltLoadFactor] = useState<number>(58);
  const [activePreset, setActivePreset] = useState<string>('moderate');

  // Interactive operational interventions
  const [clearedNodeIds, setClearedNodeIds] = useState<Set<string>>(() => new Set());
  const [deployedPumpIds, setDeployedPumpIds] = useState<Set<string>>(() => new Set());
  const [verifiedFieldIds, setVerifiedFieldIds] = useState<Set<string>>(() => new Set());
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('badshahpur-culvert');

  // SOP task statuses & Audit ledger
  const [taskStatuses, setTaskStatuses] = useState<Record<string, TaskStatus>>({});
  const [auditLedger, setAuditLedger] = useState<AuditLedgerEntry[]>(INITIAL_AUDIT_LEDGER);
  const [rwaSimulatorOpen, setRwaSimulatorOpen] = useState<boolean>(false);

  // Modals / Walkthrough
  const [assumptionsOpen, setAssumptionsOpen] = useState<boolean>(false);
  const [demoOpen, setDemoOpen] = useState<boolean>(false);
  const [demoStep, setDemoStep] = useState<number>(0);

  const analysis = useMemo(
    () =>
      runHydrologyModel({
        nodes: GURUGRAM_NODES,
        horizon,
        rainfallMm,
        siltLoadFactor,
        clearedNodeIds,
        deployedPumpIds,
        verifiedFieldIds,
      }),
    [horizon, rainfallMm, siltLoadFactor, clearedNodeIds, deployedPumpIds, verifiedFieldIds]
  );

  const sopTasks = useMemo(
    () => generateSopTasks(analysis.nodeStates),
    [analysis.nodeStates]
  );

  const effectiveTaskStatuses = useMemo(() => {
    const merged: Record<string, TaskStatus> = { ...taskStatuses };
    for (const task of sopTasks) {
      if (merged[task.id]) continue;
      if (task.actionType === 'clear' && clearedNodeIds.has(task.nodeId)) {
        merged[task.id] = 'Verified';
      } else if (task.actionType === 'pump' && deployedPumpIds.has(task.nodeId)) {
        merged[task.id] = 'Verified';
      } else if (task.actionType === 'verify' && verifiedFieldIds.has(task.nodeId)) {
        merged[task.id] = 'Verified';
      }
    }
    return merged;
  }, [sopTasks, taskStatuses, clearedNodeIds, deployedPumpIds, verifiedFieldIds]);

  const preRainReadinessPct = useMemo(() => {
    const preTasks = sopTasks.filter((t) => PRE_RAIN_PHASES.has(t.phase));
    if (preTasks.length === 0) return 100;
    let totalScore = 0;
    for (const task of preTasks) {
      const status = effectiveTaskStatuses[task.id] ?? 'Pending';
      if (status === 'Verified') totalScore += 1;
      else if (status === 'Dispatched') totalScore += 0.45;
    }
    return Math.round((totalScore / preTasks.length) * 100);
  }, [sopTasks, effectiveTaskStatuses]);

  const handleApplyPreset = (
    preset: 'normal' | 'moderate' | 'extreme2025' | 'pareto8020'
  ) => {
    setActivePreset(preset);
    if (preset === 'normal') {
      setHorizon('T-24h');
      setRainfallMm(25);
      setSiltLoadFactor(45);
      setClearedNodeIds(new Set());
    } else if (preset === 'moderate') {
      setHorizon('T-24h');
      setRainfallMm(60);
      setSiltLoadFactor(58);
      setClearedNodeIds(new Set());
    } else if (preset === 'extreme2025') {
      setHorizon('T-12h');
      setRainfallMm(133);
      setSiltLoadFactor(74);
      setClearedNodeIds(new Set());
      setSelectedNodeId('rajiv-chowk');
    } else if (preset === 'pareto8020') {
      if (rainfallMm < 60) setRainfallMm(60);
      setClearedNodeIds(new Set(TOP_6_CHOKEPOINT_IDS));
      setSelectedNodeId('subhash-chowk');
    }
  };

  const handleResetAll = () => {
    setClearedNodeIds(new Set());
    setDeployedPumpIds(new Set());
    setVerifiedFieldIds(new Set());
    setTaskStatuses({});
    setActivePreset('moderate');
    setHorizon('T-24h');
    setRainfallMm(60);
    setSiltLoadFactor(58);
  };

  const handleToggleClearNode = (nodeId: string) => {
    const node = analysis.nodeMap.get(nodeId);
    setClearedNodeIds((prev) => {
      const next = new Set(prev);
      const willClear = !next.has(nodeId);
      if (willClear) {
        next.add(nodeId);
        if (node) {
          setAuditLedger((ledger) => [
            {
              id: `aud-${Date.now()}`,
              timestamp: formatCurrentIst(),
              actor: node.assignedOwner,
              decisionType: 'Chokepoint Cleared',
              locationSummary: node.name,
              scoreComparison: `Improves ${node.downstreamImprovedIfCleared} nodes (-${node.netRiskReductionIfCleared} pts)`,
              justification: `Pre-emptively cleared chokepoint (baseline silt ${node.baselineSiltPct}% reduced).`,
            },
            ...ledger,
          ]);
        }
      } else {
        next.delete(nodeId);
      }
      return next;
    });
  };

  const handleTogglePumpNode = (nodeId: string) => {
    const node = analysis.nodeMap.get(nodeId);
    setDeployedPumpIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
        if (node) {
          setAuditLedger((ledger) => [
            {
              id: `aud-${Date.now()}`,
              timestamp: formatCurrentIst(),
              actor: 'Control Room Operator',
              decisionType: 'Pump Deployed',
              locationSummary: node.name,
              scoreComparison: `Node Risk ${node.riskScore} (${node.riskTier})`,
              justification: `150 HP mobile dewatering pump deployed with EE approval at ${node.shortLabel}.`,
            },
            ...ledger,
          ]);
        }
      }
      return next;
    });
  };

  const handleClearTop6 = () => {
    setClearedNodeIds((prev) => {
      const next = new Set(prev);
      for (const node of analysis.topChokepoints) {
        next.add(node.id);
      }
      return next;
    });
    setActivePreset('pareto8020');
  };

  const handleCycleTaskStatus = (task: SopTaskItem) => {
    const current = effectiveTaskStatuses[task.id] ?? 'Pending';
    const nextStatus: TaskStatus =
      current === 'Pending'
        ? 'Dispatched'
        : current === 'Dispatched'
        ? 'Verified'
        : 'Pending';

    setTaskStatuses((prev) => ({ ...prev, [task.id]: nextStatus }));

    if (nextStatus === 'Verified') {
      if (task.actionType === 'clear' && !clearedNodeIds.has(task.nodeId)) {
        handleToggleClearNode(task.nodeId);
      } else if (task.actionType === 'pump' && !deployedPumpIds.has(task.nodeId)) {
        handleTogglePumpNode(task.nodeId);
      }
    }
  };

  const handleVerifyInField = (nodeId: string) => {
    const node = analysis.nodeMap.get(nodeId);
    setVerifiedFieldIds((prev) => {
      const next = new Set(prev);
      next.add(nodeId);
      return next;
    });
    if (node) {
      setAuditLedger((ledger) => [
        {
          id: `aud-${Date.now()}`,
          timestamp: formatCurrentIst(),
          actor: node.assignedOwner,
          decisionType: 'Field Alert Verified',
          locationSummary: node.name,
          scoreComparison: `Conf ${node.confidenceScore}% → 93%`,
          justification: `Zone JE field inspection verified waterlogging risk; citizen AVOID alert published.`,
        },
        ...ledger,
      ]);
    }
  };

  const handleRecordAuditDecision = (
    entry: Omit<AuditLedgerEntry, 'id' | 'timestamp'>
  ) => {
    setAuditLedger((prev) => [
      {
        ...entry,
        id: `aud-${Date.now()}`,
        timestamp: formatCurrentIst(),
      },
      ...prev,
    ]);
  };

  return (
    <div id="top" className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <HeaderAndBanner
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        horizon={horizon}
        onChangeHorizon={(h) => {
          setHorizon(h);
          setActivePreset('custom');
        }}
        rainfallMm={rainfallMm}
        onChangeRainfall={(mm) => {
          setRainfallMm(mm);
          setActivePreset('custom');
        }}
        siltLoadFactor={siltLoadFactor}
        onChangeSilt={(s) => {
          setSiltLoadFactor(s);
          setActivePreset('custom');
        }}
        activePreset={activePreset}
        onApplyPreset={handleApplyPreset}
        onResetAll={handleResetAll}
        onOpenAssumptions={() => setAssumptionsOpen(true)}
        onStartDemo={() => {
          setDemoOpen(true);
          setDemoStep(0);
          setActiveTab('twin3d');
          handleApplyPreset('extreme2025');
        }}
        clearedCount={clearedNodeIds.size + deployedPumpIds.size}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'twin3d' && (
          <Twin3DTab
            analysis={analysis}
            preRainReadinessPct={preRainReadinessPct}
            selectedNodeId={selectedNodeId}
            onSelectNode={setSelectedNodeId}
            onToggleClearNode={handleToggleClearNode}
            onTogglePumpNode={handleTogglePumpNode}
            onClearTop6={handleClearTop6}
          />
        )}

        {activeTab === 'operations' && (
          <OperationsBoardTab
            tasks={sopTasks}
            taskStatuses={effectiveTaskStatuses}
            onCycleTaskStatus={handleCycleTaskStatus}
            nodeMap={analysis.nodeMap}
            auditLedger={auditLedger}
            onRecordAuditDecision={handleRecordAuditDecision}
            rwaSimulatorOpen={rwaSimulatorOpen}
            onSetRwaSimulatorOpen={setRwaSimulatorOpen}
            preRainReadinessPct={preRainReadinessPct}
          />
        )}

        {activeTab === 'alerts' && (
          <CitizenAlertTab
            nodes={analysis.nodeStates}
            onVerifyInField={handleVerifyInField}
          />
        )}

        {activeTab === 'validation' && <ValidationInfraTab />}
      </main>

      <footer className="bg-white border-t border-slate-200 mt-10">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            DrainSense 3D: Predictive Drainage & Cascade Twin · MCG / GMDA (SustainX 2026)
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span>
              Assumptions: IMD Forecasts · 159 Hotspots · 607 km Drainage Mandate · Sept 1, 2025 (133
              mm/4h, 20 km jam, 51h outage) · Desilting Lag (16/36 vs. May 31)
            </span>
            <button
              type="button"
              onClick={() => setAssumptionsOpen(true)}
              className="font-semibold text-slate-700 hover:text-slate-900 underline underline-offset-2 cursor-pointer"
            >
              Assumptions & Citations
            </button>
          </div>
        </div>
      </footer>

      <AssumptionsModal
        open={assumptionsOpen}
        onClose={() => setAssumptionsOpen(false)}
        onGoToValidationTab={() => setActiveTab('validation')}
      />

      <GuidedJuryDemo
        open={demoOpen}
        step={demoStep}
        onClose={() => setDemoOpen(false)}
        onSetStep={setDemoStep}
        onTriggerStep1ExtremeRain={() => {
          setActiveTab('twin3d');
          handleApplyPreset('extreme2025');
        }}
        onTriggerStep2ClearUpstream={() => {
          setActiveTab('twin3d');
          setClearedNodeIds(new Set(['badshahpur-culvert', 'subhash-chowk', 'vatika-chowk']));
          setSelectedNodeId('rajiv-chowk');
        }}
        onTriggerStep3RwaGovernance={() => {
          setActiveTab('operations');
          setRwaSimulatorOpen(true);
        }}
        onTriggerStep4CitizenAlerts={() => {
          setActiveTab('alerts');
        }}
      />
    </div>
  );
}
