import React from 'react';
import { HydrologyAnalysis } from '../engine/hydrology';
import { DrainSense3DScene } from './DrainSense3DScene';
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  Droplets,
  Gauge,
  ShieldAlert,
  TrendingDown,
  Wrench,
  X,
} from 'lucide-react';

interface Twin3DTabProps {
  analysis: HydrologyAnalysis;
  preRainReadinessPct: number;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  onToggleClearNode: (nodeId: string) => void;
  onTogglePumpNode: (nodeId: string) => void;
  onClearTop6: () => void;
}

export const Twin3DTab: React.FC<Twin3DTabProps> = ({
  analysis,
  preRainReadinessPct,
  selectedNodeId,
  onSelectNode,
  onToggleClearNode,
  onTogglePumpNode,
  onClearTop6,
}) => {
  const topChokepointIds = new Set(analysis.topChokepoints.map((n) => n.id));
  const allTop6Cleared =
    analysis.topChokepoints.length > 0 && analysis.topChokepoints.every((n) => n.isCleared);
  const selectedNode = selectedNodeId ? analysis.nodeMap.get(selectedNodeId) ?? null : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Panel (65% -> 8 of 12 cols): 3D Drainage & Chokepoint Twin */}
      <div className="lg:col-span-8 space-y-4">
        <DrainSense3DScene
          nodes={analysis.nodeStates}
          selectedNodeId={selectedNodeId}
          onSelectNode={onSelectNode}
          topChokepointIds={topChokepointIds}
        />

        {/* 4 Live KPIs directly below 3D viewport */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="text-xs font-medium text-slate-500">High-Risk (Avoid) Hotspots</div>
            <div
              className={`mt-1.5 font-mono text-2xl font-bold tabular-nums ${
                analysis.avoidCount > 0 ? 'text-red-600' : 'text-emerald-600'
              }`}
            >
              {analysis.avoidCount}
            </div>
            <div className="mt-1 text-xs text-slate-600 tabular-nums">
              {analysis.cautionCount} Caution · {analysis.safeCount} Safe (of 30 nodes / 159)
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="text-xs font-medium text-slate-500">Downstream Protected</div>
            <div className="mt-1.5 font-mono text-2xl font-bold text-sky-700 tabular-nums">
              {analysis.downstreamProtectedCount} nodes
            </div>
            <div className="mt-1 text-xs text-slate-600 font-mono tabular-nums">
              Net relief: -{analysis.netNetworkRiskReduction} risk pts
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="text-xs font-medium text-slate-500">Avg. Warning Lead Time</div>
            <div className="mt-1.5 font-mono text-2xl font-bold text-slate-900 tabular-nums">
              {analysis.effectiveLeadTimeHours} hrs
            </div>
            <div className="mt-1 text-xs text-slate-600">
              IMD + 607 km cascade model
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="text-xs font-medium text-slate-500">Pre-Rain Readiness</div>
            <div className="mt-1.5 font-mono text-2xl font-bold text-emerald-700 tabular-nums">
              {preRainReadinessPct}%
            </div>
            <div className="mt-1 text-xs text-slate-600">
              Live MCG SOP completion
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel (35% -> 4 of 12 cols): Side Inspector + 80/20 Leverage Ranking */}
      <div className="lg:col-span-4 space-y-5">
        {/* Side Inspector */}
        {selectedNode ? (
          <aside
            aria-label="3D node side inspector"
            className="bg-white border border-slate-200 rounded-xl overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-slate-200 flex items-start justify-between gap-2 bg-slate-50/80">
              <div className="min-w-0">
                <div className="text-xs text-slate-500 flex items-center gap-1.5 flex-wrap">
                  <span>{selectedNode.zone}</span>
                  <span aria-hidden="true">·</span>
                  <span>{selectedNode.type}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-semibold text-slate-700">{selectedNode.assignedOwner}</span>
                </div>
                <h2 className="font-display text-base font-bold text-slate-900 mt-0.5 leading-snug">
                  {selectedNode.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onSelectNode(null)}
                aria-label="Close node inspector"
                className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-200/70 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3.5 text-xs">
              {/* Risk Score & Confidence */}
              <div className="grid grid-cols-2 gap-2.5">
                <div
                  className={`p-3 rounded-lg border ${
                    selectedNode.riskTier === 'Safe'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : selectedNode.riskTier === 'Caution'
                      ? 'bg-amber-50 border-amber-200 text-amber-800'
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}
                >
                  <div className="font-medium opacity-80">Risk Score</div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="font-mono text-2xl font-bold tabular-nums">
                      {selectedNode.riskScore}
                    </span>
                    <span className="font-semibold">{selectedNode.riskTier}</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                  <div className="font-medium text-slate-600">Confidence Level</div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
                      {selectedNode.confidenceScore}%
                    </span>
                    <span className="font-semibold text-slate-700">
                      {selectedNode.confidenceTier}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cascade Impact Readout */}
              {selectedNode.downstreamIds.length > 0 && (
                <div className="p-2.5 rounded-lg border border-sky-200 bg-sky-50/70 text-sky-900 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-sky-700 shrink-0" aria-hidden="true" />
                  <span className="font-mono tabular-nums">
                    {selectedNode.isCleared ? 'Active relief:' : 'If cleared:'}{' '}
                    <strong>{selectedNode.downstreamImprovedIfCleared}</strong> downstream nodes
                    improved (<strong>-{selectedNode.netRiskReductionIfCleared} pts</strong>)
                  </span>
                </div>
              )}

              {/* Primary Cause & Assigned Owner */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div>
                  <div className="font-semibold text-slate-500">Primary Cause</div>
                  <p className="text-slate-800 mt-0.5 leading-relaxed">
                    {selectedNode.primaryCause}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-500">Assigned Owner</span>
                  <span className="font-semibold text-slate-900">{selectedNode.assignedOwner}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-500">Mandate Scope</span>
                  <span className="font-mono text-slate-700 tabular-nums">
                    {selectedNode.representedHotspotsCount} hotspots · {selectedNode.drainLengthKm} km
                  </span>
                </div>
              </div>

              {/* Upstream Links */}
              {selectedNode.upstreamIds.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <div className="font-semibold text-slate-500 mb-1.5">
                    Upstream Chokepoints ({selectedNode.upstreamIds.length})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedNode.upstreamIds.map((upId) => {
                      const up = analysis.nodeMap.get(upId);
                      if (!up) return null;
                      return (
                        <button
                          key={upId}
                          type="button"
                          onClick={() => onSelectNode(upId)}
                          className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md cursor-pointer"
                        >
                          <span>{up.shortLabel}</span>
                          <span
                            className={`font-mono font-bold ${
                              up.riskTier === 'Avoid'
                                ? 'text-red-700'
                                : up.riskTier === 'Caution'
                                ? 'text-amber-700'
                                : 'text-emerald-700'
                            }`}
                          >
                            {up.riskScore}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sensor Telemetry */}
              <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-slate-700">
                <div className="flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                  <span>
                    Drain Fill:{' '}
                    <strong className="font-mono tabular-nums">
                      {selectedNode.sensorDrainFillPct}%
                    </strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                  <span>
                    Silt:{' '}
                    <strong className="font-mono tabular-nums">
                      {selectedNode.effectiveSiltPct}%
                    </strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 col-span-2">
                  <Camera className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                  <span>
                    Underpass Depth:{' '}
                    <strong className="font-mono tabular-nums">
                      ~{selectedNode.estimatedWaterDepthCm} cm
                    </strong>{' '}
                    {selectedNode.hasEdgeCctv ? '(Edge-AI CCTV Online)' : '(Ultrasonic/JE)'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={() => onToggleClearNode(selectedNode.id)}
                  className={`w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    selectedNode.isCleared
                      ? 'bg-sky-700 text-white hover:bg-sky-800'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  {selectedNode.isCleared ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                      <span>Chokepoint Cleared (Click to Revert)</span>
                    </>
                  ) : (
                    <>
                      <Wrench className="w-4 h-4" aria-hidden="true" />
                      <span>Clear Chokepoint (Updates 3D Cascade)</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => onTogglePumpNode(selectedNode.id)}
                  className={`w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                    selectedNode.hasActivePump
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                      : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4" aria-hidden="true" />
                  <span>
                    {selectedNode.hasActivePump
                      ? '150 HP Mobile Pump Deployed (Recall)'
                      : 'Deploy 150 HP Mobile Pump'}
                  </span>
                </button>
              </div>
            </div>
          </aside>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl p-4 text-xs text-slate-600">
            Click any 3D pillar in the Gurugram Twin or select a hotspot below to open the Side
            Inspector.
          </div>
        )}

        {/* 80/20 High-Leverage Chokepoints Ranking */}
        <section
          aria-labelledby="pareto-heading"
          className="bg-white border border-slate-200 rounded-xl overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-3">
            <div>
              <h2 id="pareto-heading" className="font-display text-sm font-bold text-slate-900">
                80/20 Upstream Chokepoints
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Clear top 20% culverts to shrink downstream 3D flood levels
              </p>
            </div>
            <button
              type="button"
              onClick={onClearTop6}
              disabled={allTop6Cleared}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                allTop6Cleared
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                  : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              {allTop6Cleared ? 'Top 6 Cleared' : 'Clear Top 6'}
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {analysis.topChokepoints.map((node, index) => {
              const isSelected = selectedNodeId === node.id;
              const tierColor =
                node.riskTier === 'Avoid'
                  ? 'text-red-700'
                  : node.riskTier === 'Caution'
                  ? 'text-amber-700'
                  : 'text-emerald-700';

              return (
                <div
                  key={node.id}
                  className={`px-4 py-2.5 flex items-center justify-between gap-3 transition-colors ${
                    isSelected ? 'bg-sky-50/70' : 'hover:bg-slate-50'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelectNode(node.id)}
                    className="min-w-0 flex-1 text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-slate-400 tabular-nums">
                        0{index + 1}
                      </span>
                      <span className="text-xs font-semibold text-slate-900 truncate">
                        {node.name}
                      </span>
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                      <span>{node.zone}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        Protects {node.downstreamImprovedIfCleared} (-
                        {node.netRiskReductionIfCleared} pts)
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className={`font-mono font-semibold tabular-nums ${tierColor}`}>
                        {node.riskScore} ({node.riskTier})
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleClearNode(node.id)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      node.isCleared
                        ? 'bg-sky-50 border-sky-200 text-sky-800 hover:bg-sky-100'
                        : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    {node.isCleared ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-sky-700" aria-hidden="true" />
                        <span>Cleared</span>
                      </>
                    ) : (
                      <>
                        <span>Clear</span>
                        <ArrowRight className="w-3 h-3" aria-hidden="true" />
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};
