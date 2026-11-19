import React, { useMemo, useState } from 'react';
import {
  AuditLedgerEntry,
  ComputedNodeState,
  ResponsibleRole,
  RwaEscalationScenario,
  SopPhaseId,
  SopTaskItem,
  TaskStatus,
} from '../types/drainsense';
import { RWA_ESCALATION_SCENARIOS } from '../data/staticData';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  Gavel,
  Search,
  ShieldCheck,
} from 'lucide-react';

interface OperationsBoardTabProps {
  tasks: SopTaskItem[];
  taskStatuses: Record<string, TaskStatus>;
  onCycleTaskStatus: (task: SopTaskItem) => void;
  nodeMap: Map<string, ComputedNodeState>;
  auditLedger: AuditLedgerEntry[];
  onRecordAuditDecision: (entry: Omit<AuditLedgerEntry, 'id' | 'timestamp'>) => void;
  rwaSimulatorOpen: boolean;
  onSetRwaSimulatorOpen: (open: boolean) => void;
  preRainReadinessPct: number;
}

const SOP_PHASES: { id: SopPhaseId; label: string; guide: string }[] = [
  { id: 'All', label: 'All Stages', guide: 'Full T-48h to After Rain MCG SOP pipeline' },
  {
    id: 'T-48 to T-24h',
    label: 'T-48 to T-24h',
    guide: 'EE priority ranking & JE inspection assignments',
  },
  {
    id: 'T-24 to T-12h',
    label: 'T-24 to T-12h',
    guide: 'JE/AE inspect & clear priority culverts; verify pumps',
  },
  {
    id: 'T-12 to T-6h',
    label: 'T-12 to T-6h',
    guide: 'Pre-position pumps & crews at top-risk nodes with EE sign-off',
  },
  {
    id: 'T-6 to T-0h',
    label: 'T-6 to T-0h',
    guide: 'Issue citizen alerts; monitor underpasses & sensors',
  },
  {
    id: 'During Rain',
    label: 'During Rain',
    guide: 'Track live water levels, complaints & pump re-dispatch',
  },
  {
    id: 'After Rain',
    label: 'After Rain',
    guide: 'Log actual flooding vs. prediction; retune & audit',
  },
];

const ROLES: (ResponsibleRole | 'All')[] = [
  'All',
  'Executive Engineer',
  'Assistant Engineer',
  'Zone Junior Engineer',
  'Pump Crew',
  'Control Room Operator',
];

function computeHydrologicalImpactScore(
  node: ComputedNodeState | undefined,
  commuterExposure: number
): number {
  if (!node) return 50;
  const reachFactor = Math.min(20, node.downstreamReachCount * 4);
  const exposureFactor = Math.min(25, Math.round(commuterExposure / 3000));
  return Math.min(99, Math.round(node.riskScore * 0.65 + reachFactor + exposureFactor));
}

export const OperationsBoardTab: React.FC<OperationsBoardTabProps> = ({
  tasks,
  taskStatuses,
  onCycleTaskStatus,
  nodeMap,
  auditLedger,
  onRecordAuditDecision,
  rwaSimulatorOpen,
  onSetRwaSimulatorOpen,
  preRainReadinessPct,
}) => {
  const [phaseFilter, setPhaseFilter] = useState<SopPhaseId>('All');
  const [roleFilter, setRoleFilter] = useState<ResponsibleRole | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(
    RWA_ESCALATION_SCENARIOS[0].id
  );
  const [overrideNote, setOverrideNote] = useState('');
  const [showOverrideInput, setShowOverrideInput] = useState(false);
  const [lastReceiptMsg, setLastReceiptMsg] = useState<string | null>(null);

  const [postRainNodeId, setPostRainNodeId] = useState<string>('hero-honda-chowk');
  const [actualObservedDepthCm, setActualObservedDepthCm] = useState<number>(42);

  const filteredTasks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return tasks.filter((t) => {
      if (phaseFilter !== 'All' && t.phase !== phaseFilter) return false;
      if (roleFilter !== 'All' && t.responsibleRole !== roleFilter) return false;
      if (
        q &&
        !t.nodeName.toLowerCase().includes(q) &&
        !t.requiredAction.toLowerCase().includes(q) &&
        !t.assignedOwner.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [tasks, phaseFilter, roleFilter, searchQuery]);

  const activeScenario: RwaEscalationScenario =
    RWA_ESCALATION_SCENARIOS.find((s) => s.id === selectedScenarioId) ??
    RWA_ESCALATION_SCENARIOS[0];

  const reqNode = nodeMap.get(activeScenario.requestingNodeId);
  const vulnNode = nodeMap.get(activeScenario.impactedNodeId);

  const reqImpactScore = computeHydrologicalImpactScore(
    reqNode,
    activeScenario.rwaCommuterExposure
  );
  const vulnImpactScore = computeHydrologicalImpactScore(
    vulnNode,
    activeScenario.vulnerableCommuterExposure
  );

  const handleKeepHydrologicalPriority = () => {
    const scoreComparison = `Hydrological Impact ${vulnImpactScore} (${vulnNode?.shortLabel}) vs. Diversion ${reqImpactScore} (${reqNode?.shortLabel})`;
    onRecordAuditDecision({
      actor: 'Executive Engineer / Control Room',
      decisionType: 'Kept Hydrological Priority',
      locationSummary: `${activeScenario.requestingRwaName} vs. ${
        vulnNode?.name ?? activeScenario.impactedNodeId
      }`,
      scoreComparison,
      justification: `Kept Hydrological Priority: Retaining ${activeScenario.requestedPumps} mobile pumps at ${vulnNode?.shortLabel} protects ${activeScenario.vulnerableCommuterExposure.toLocaleString()} daily commuters and prevents NH-48 arterial lockup.`,
    });
    setShowOverrideInput(false);
    setOverrideNote('');
    setLastReceiptMsg(
      `Kept Hydrological Priority: ${vulnNode?.shortLabel} (${vulnImpactScore}) outranks ${reqNode?.shortLabel} (${reqImpactScore}). Logged in Transparent Dispatch Audit Log.`
    );
  };

  const handleConfirmOverride = () => {
    if (overrideNote.trim().length < 12) return;
    const scoreComparison = `Hydrological Impact ${vulnImpactScore} vs. Override ${reqImpactScore}`;
    onRecordAuditDecision({
      actor: 'EE Override Sign-Off',
      decisionType: 'Override Logged',
      locationSummary: `Diverted to ${activeScenario.requestingRwaName} from ${
        vulnNode?.name ?? activeScenario.impactedNodeId
      }`,
      scoreComparison,
      justification: overrideNote.trim(),
    });
    setShowOverrideInput(false);
    setOverrideNote('');
    setLastReceiptMsg(
      `Override recorded in Transparent Dispatch Audit Log with mandatory written note.`
    );
  };

  const handleLogPostRain = () => {
    const node = nodeMap.get(postRainNodeId);
    if (!node) return;
    onRecordAuditDecision({
      actor: 'EE Post-Rain Audit',
      decisionType: 'Post-Rain Audit Logged',
      locationSummary: node.name,
      scoreComparison: `Predicted ~${node.estimatedWaterDepthCm} cm vs. Actual ${actualObservedDepthCm} cm`,
      justification: `Post-rain flooding observation logged for ${node.shortLabel}; baseline silt model retuned.`,
    });
  };

  const activePhaseMeta = SOP_PHASES.find((p) => p.id === phaseFilter) ?? SOP_PHASES[0];

  return (
    <div className="space-y-8">
      {/* RWA Political Economy Ledger */}
      <section
        aria-labelledby="governance-heading"
        className="bg-white border border-slate-200 rounded-xl overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs font-medium text-slate-500">
              RWA Political Economy Safeguard · Hydrological Impact vs. Diversion Pressure
            </div>
            <h2 id="governance-heading" className="font-display text-lg font-bold text-slate-900 mt-0.5">
              Transparent Dispatch Audit Log & RWA Escalation
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              onSetRwaSimulatorOpen(!rwaSimulatorOpen);
              setLastReceiptMsg(null);
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              rwaSimulatorOpen
                ? 'bg-slate-200 text-slate-900 hover:bg-slate-300'
                : 'bg-amber-600 text-white hover:bg-amber-700'
            }`}
          >
            <Gavel className="w-4 h-4" aria-hidden="true" />
            <span>
              {rwaSimulatorOpen ? 'Hide RWA Escalation Panel' : 'Simulate RWA Escalation'}
            </span>
          </button>
        </div>

        {rwaSimulatorOpen && (
          <div className="p-5 border-b border-slate-200 bg-slate-50/70 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">Escalation Case:</span>
                {RWA_ESCALATION_SCENARIOS.map((sc) => (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => {
                      setSelectedScenarioId(sc.id);
                      setLastReceiptMsg(null);
                    }}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                      selectedScenarioId === sc.id
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {sc.title}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-sm text-slate-700 bg-white border border-slate-200 rounded-lg px-4 py-3">
              <strong className="text-slate-900">{activeScenario.requestingRwaName}:</strong>{' '}
              {activeScenario.rwaDemandSummary}
            </p>

            {/* Side-by-Side Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-red-200 rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs font-semibold text-red-700">
                      Current Hydrological Priority · {activeScenario.impactedZone}
                    </div>
                    <h3 className="font-display text-base font-bold text-slate-900 mt-0.5">
                      {vulnNode?.name}
                    </h3>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500">Hydrological Impact Score</div>
                    <div className="font-mono text-2xl font-bold text-red-700 tabular-nums">
                      {vulnImpactScore}
                      <span className="text-xs font-normal text-slate-500">/100</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-600">{activeScenario.vulnerableNote}</p>
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-xs">
                  <div>
                    <div className="text-slate-500">Node Risk</div>
                    <div className="font-mono font-semibold text-red-700 tabular-nums mt-0.5">
                      {vulnNode?.riskScore ?? 82} ({vulnNode?.riskTier})
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500">Downstream Reach</div>
                    <div className="font-mono font-semibold text-slate-900 tabular-nums mt-0.5">
                      {vulnNode?.downstreamReachCount ?? 4} nodes
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500">Daily Commuters</div>
                    <div className="font-mono font-semibold text-slate-900 tabular-nums mt-0.5">
                      {activeScenario.vulnerableCommuterExposure.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs font-semibold text-amber-700">
                      Requested Diversion · {activeScenario.requestingZone}
                    </div>
                    <h3 className="font-display text-base font-bold text-slate-900 mt-0.5">
                      {reqNode?.name}
                    </h3>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500">Diversion Impact Score</div>
                    <div className="font-mono text-2xl font-bold text-amber-700 tabular-nums">
                      {reqImpactScore}
                      <span className="text-xs font-normal text-slate-500">/100</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-600">
                  RWA Pressure Level: <strong>{reqNode?.rwaPressureLevel}</strong> · Requesting{' '}
                  <strong>{activeScenario.requestedPumps} mobile pumps</strong>.
                </p>
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-xs">
                  <div>
                    <div className="text-slate-500">Node Risk</div>
                    <div className="font-mono font-semibold text-slate-900 tabular-nums mt-0.5">
                      {reqNode?.riskScore ?? 45} ({reqNode?.riskTier})
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500">Downstream Reach</div>
                    <div className="font-mono font-semibold text-slate-900 tabular-nums mt-0.5">
                      {reqNode?.downstreamReachCount ?? 1} nodes
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500">Daily Commuters</div>
                    <div className="font-mono font-semibold text-slate-900 tabular-nums mt-0.5">
                      {activeScenario.rwaCommuterExposure.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleKeepHydrologicalPriority}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                <span>Keep Hydrological Priority</span>
              </button>

              <button
                type="button"
                onClick={() => setShowOverrideInput((v) => !v)}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <AlertTriangle className="w-4 h-4 text-amber-600" aria-hidden="true" />
                <span>Log Override with Mandatory Note</span>
              </button>
            </div>

            {showOverrideInput && (
              <div className="bg-white border border-amber-300 rounded-xl p-4 space-y-3">
                <label
                  htmlFor="override-justification"
                  className="block text-xs font-semibold text-slate-800"
                >
                  Mandatory Override Note (min. 12 characters — recorded in Transparent Dispatch
                  Audit Log)
                </label>
                <textarea
                  id="override-justification"
                  rows={2}
                  value={overrideNote}
                  onChange={(e) => setOverrideNote(e.target.value)}
                  placeholder="Enter official justification for overriding hydrological priority..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowOverrideInput(false);
                      setOverrideNote('');
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={overrideNote.trim().length < 12}
                    onClick={handleConfirmOverride}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer"
                  >
                    Commit Override to Audit Log
                  </button>
                </div>
              </div>
            )}

            {lastReceiptMsg && (
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3.5 py-2.5">
                <FileCheck2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{lastReceiptMsg}</span>
              </div>
            )}
          </div>
        )}

        {/* Transparent Dispatch Audit Log */}
        <div className="px-5 py-3 bg-white border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-600">
            Transparent Dispatch Audit Log ({auditLedger.length} entries)
          </h3>
          <span className="text-xs text-slate-500">Every dispatch & override recorded</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-semibold">
                <th className="py-2.5 px-4 whitespace-nowrap">Time</th>
                <th className="py-2.5 px-4 whitespace-nowrap">Action</th>
                <th className="py-2.5 px-4">Location / Parties</th>
                <th className="py-2.5 px-4 whitespace-nowrap">Score Comparison</th>
                <th className="py-2.5 px-4">Logged Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLedger.map((entry) => {
                const isOverride = entry.decisionType === 'Override Logged';
                const isHold = entry.decisionType === 'Kept Hydrological Priority';
                return (
                  <tr key={entry.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-4 font-mono text-slate-600 whitespace-nowrap tabular-nums">
                      {entry.timestamp}
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <span
                        className={`font-semibold ${
                          isOverride
                            ? 'text-red-700'
                            : isHold
                            ? 'text-emerald-700'
                            : 'text-sky-700'
                        }`}
                      >
                        {entry.decisionType}
                      </span>
                      <div className="text-[11px] text-slate-500 mt-0.5">{entry.actor}</div>
                    </td>
                    <td className="py-2.5 px-4 font-medium text-slate-900">
                      {entry.locationSummary}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-700 whitespace-nowrap tabular-nums">
                      {entry.scoreComparison}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 max-w-md">{entry.justification}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* MCG Operations SOP Board */}
      <section
        aria-labelledby="sop-board-heading"
        className="bg-white border border-slate-200 rounded-xl overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 id="sop-board-heading" className="font-display text-lg font-bold text-slate-900">
              MCG Operations SOP Board
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Click status buttons to toggle <strong className="text-slate-700">Pending → Dispatched → Verified</strong>
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2">
            <div>
              <div className="text-[11px] font-medium text-slate-500">Pre-Rain Readiness</div>
              <div className="font-mono text-lg font-bold text-slate-900 tabular-nums">
                {preRainReadinessPct}%
              </div>
            </div>
            <div className="w-28 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 transition-all duration-200"
                style={{ width: `${preRainReadinessPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Phase Filter & Role Search */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 space-y-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {SOP_PHASES.map((phase) => {
              const active = phaseFilter === phase.id;
              return (
                <button
                  key={phase.id}
                  type="button"
                  onClick={() => setPhaseFilter(phase.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {phase.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-600">
              <strong className="text-slate-900">{activePhaseMeta.label}:</strong>{' '}
              {activePhaseMeta.guide}
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search
                  className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search hotspot or owner..."
                  aria-label="Search SOP tasks"
                  className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 w-48"
                />
              </div>

              <select
                aria-label="Filter by responsible role"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as ResponsibleRole | 'All')}
                className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg text-slate-700 cursor-pointer"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r === 'All' ? 'All MCG Roles' : r}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Post-Rain Audit Tool */}
        {phaseFilter === 'After Rain' && (
          <div className="px-5 py-3.5 bg-sky-50/70 border-b border-sky-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="font-semibold text-sky-900">
              After Rain Audit: Log actual observed flooding vs. prediction
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                aria-label="Select hotspot for post-rain log"
                value={postRainNodeId}
                onChange={(e) => setPostRainNodeId(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-slate-800"
              >
                {Array.from(nodeMap.values()).map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.shortLabel} (Pred ~{n.estimatedWaterDepthCm} cm)
                  </option>
                ))}
              </select>
              <label className="inline-flex items-center gap-1.5 text-slate-700">
                <span>Observed (cm):</span>
                <input
                  type="number"
                  min={0}
                  max={200}
                  value={actualObservedDepthCm}
                  onChange={(e) => setActualObservedDepthCm(Number(e.target.value))}
                  className="w-16 px-2 py-1 bg-white border border-slate-300 rounded-md font-mono tabular-nums"
                />
              </label>
              <button
                type="button"
                onClick={handleLogPostRain}
                className="px-3 py-1.5 font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md cursor-pointer"
              >
                Log Post-Rain Audit
              </button>
            </div>
          </div>
        )}

        {/* Task Table */}
        {filteredTasks.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <p className="text-sm font-medium text-slate-700">
              No SOP tasks match the selected stage, role, or search filter.
            </p>
            <button
              type="button"
              onClick={() => {
                setPhaseFilter('All');
                setRoleFilter('All');
                setSearchQuery('');
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              Reset Task Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/60 text-slate-500 font-semibold">
                  <th className="py-3 px-4 whitespace-nowrap">Rank</th>
                  <th className="py-3 px-4">Hotspot & Zone</th>
                  <th className="py-3 px-4 whitespace-nowrap">SOP Stage</th>
                  <th className="py-3 px-4">Required Action</th>
                  <th className="py-3 px-4 whitespace-nowrap">MCG Role</th>
                  <th className="py-3 px-4 whitespace-nowrap text-right">Confidence</th>
                  <th className="py-3 px-4 whitespace-nowrap text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTasks.map((task) => {
                  const status = taskStatuses[task.id] ?? 'Pending';
                  const riskColor =
                    task.riskTier === 'Avoid'
                      ? 'text-red-700'
                      : task.riskTier === 'Caution'
                      ? 'text-amber-700'
                      : 'text-emerald-700';

                  return (
                    <tr key={task.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 tabular-nums whitespace-nowrap">
                        #{String(task.priorityRank).padStart(2, '0')}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{task.nodeName}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                          <span>{task.zone}</span>
                          <span aria-hidden="true">·</span>
                          <span className={`font-mono font-semibold tabular-nums ${riskColor}`}>
                            Risk {task.riskScore} ({task.riskTier})
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-mono font-semibold text-slate-800">{task.phase}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{task.phaseLabel}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 max-w-xs">{task.requiredAction}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-900">{task.responsibleRole}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{task.assignedOwner}</div>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span className="font-mono font-semibold text-slate-800 tabular-nums">
                          {task.confidenceScore}%
                        </span>
                        <div className="text-[11px] text-slate-500">{task.confidenceTier}</div>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onCycleTaskStatus(task)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors cursor-pointer ${
                            status === 'Verified'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                              : status === 'Dispatched'
                              ? 'bg-sky-50 border-sky-200 text-sky-800 hover:bg-sky-100'
                              : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {status === 'Verified' ? (
                            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                          ) : (
                            <ClipboardCheck className="w-3.5 h-3.5" aria-hidden="true" />
                          )}
                          <span>{status}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
