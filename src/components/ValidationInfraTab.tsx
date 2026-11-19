import React, { useState } from 'react';
import {
  DATA_ASSUMPTIONS,
  ROLLOUT_ROADMAP,
  SENSOR_HARDWARE_SPECS,
  VALIDATION_METRICS,
} from '../data/staticData';
import { CheckCircle2, Cpu, Database, FileText, Layers } from 'lucide-react';

type ViewMode = 'compare' | 'predictive' | 'reactive';

export const ValidationInfraTab: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('compare');

  const totalCapexInr = SENSOR_HARDWARE_SPECS.reduce(
    (sum, item) => sum + item.unitCostInr * item.pilotQty,
    0
  );

  return (
    <div className="space-y-8">
      {/* Evaluation Metrics Scorecard (Simulated / Modeled) */}
      <section
        aria-labelledby="validation-heading"
        className="bg-white border border-slate-200 rounded-xl overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono font-semibold text-amber-700">
              SIMULATED / MODELED EVALUATION METRICS · Sept 1, 2025 Benchmark Calibration
            </div>
            <h2 id="validation-heading" className="font-display text-lg font-bold text-slate-900 mt-0.5">
              Operational Validation Scorecard (Simulated)
            </h2>
          </div>

          <div className="inline-flex items-center p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setViewMode('compare')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                viewMode === 'compare'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Side-by-Side Comparison
            </button>
            <button
              type="button"
              onClick={() => setViewMode('reactive')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                viewMode === 'reactive'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Reactive MCG Baseline
            </button>
            <button
              type="button"
              onClick={() => setViewMode('predictive')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                viewMode === 'predictive'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              DrainSense 3D
            </button>
          </div>
        </div>

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:gap-px bg-slate-200 border-b border-slate-200">
          {VALIDATION_METRICS.map((m) => (
            <div key={m.id} className="bg-white p-5 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-600">{m.metric}</span>
                  <span className="text-[10px] font-mono text-amber-700">SIMULATED</span>
                </div>
                <div className="mt-2 flex items-baseline gap-3">
                  {viewMode === 'reactive' ? (
                    <span className="font-mono text-2xl font-bold text-red-700 tabular-nums">
                      {m.reactiveBaseline}
                    </span>
                  ) : viewMode === 'predictive' ? (
                    <span className="font-mono text-2xl font-bold text-emerald-700 tabular-nums">
                      {m.drainSensePredictive}
                    </span>
                  ) : (
                    <>
                      <span className="font-mono text-xl font-bold text-emerald-700 tabular-nums">
                        {m.drainSensePredictive}
                      </span>
                      <span className="font-mono text-xs text-slate-400 line-through tabular-nums">
                        {m.reactiveBaseline}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 space-y-0.5">
                <div className="text-xs font-semibold text-sky-800">{m.deltaSummary}</div>
                <div className="text-[11px] text-slate-500">{m.unitNote}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Full Tabular Comparison */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-semibold">
                <th className="py-2.5 px-4">Evaluation Metric (Modeled)</th>
                <th className="py-2.5 px-4 whitespace-nowrap">Reactive MCG Baseline</th>
                <th className="py-2.5 px-4 whitespace-nowrap">DrainSense 3D</th>
                <th className="py-2.5 px-4">Operational Gain</th>
                <th className="py-2.5 px-4">Basis / Assumption</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {VALIDATION_METRICS.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/70">
                  <td className="py-2.5 px-4 font-semibold text-slate-900">{m.metric}</td>
                  <td className="py-2.5 px-4 font-mono text-red-700 tabular-nums whitespace-nowrap">
                    {m.reactiveBaseline}
                  </td>
                  <td className="py-2.5 px-4 font-mono font-bold text-emerald-700 tabular-nums whitespace-nowrap">
                    {m.drainSensePredictive}
                  </td>
                  <td className="py-2.5 px-4 font-medium text-sky-800">{m.deltaSummary}</td>
                  <td className="py-2.5 px-4 text-slate-600">{m.unitNote}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Vandal-Resistant Sensor Architecture & Indian Market Cost Breakdown */}
      <section
        aria-labelledby="infra-heading"
        className="bg-white border border-slate-200 rounded-xl overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Cpu className="w-5 h-5 text-slate-700 mt-0.5 shrink-0" aria-hidden="true" />
            <div>
              <h2 id="infra-heading" className="font-display text-lg font-bold text-slate-900">
                Vandal-Resistant Sensor Architecture & Cost Breakdown (₹ INR)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Weatherproof, low-maintenance Phase-1 deployment covering Top 20% chokepoints &
                critical underpasses
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500">Phase-1 Pilot Hardware Capex</div>
            <div className="font-mono text-xl font-bold text-slate-900 tabular-nums">
              ₹{(totalCapexInr / 100000).toFixed(2)} Lakhs
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-semibold">
                <th className="py-3 px-4">Hardware / Edge Node</th>
                <th className="py-3 px-4">Vandal-Resistant & Weatherproof Spec</th>
                <th className="py-3 px-4">Deployment Scope</th>
                <th className="py-3 px-4">Solar / Battery & Telemetry</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Unit Cost (₹)</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Pilot Qty</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Line Total (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {SENSOR_HARDWARE_SPECS.map((item) => {
                const lineTotal = item.unitCostInr * item.pilotQty;
                return (
                  <tr key={item.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-semibold text-slate-900">{item.component}</td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs">{item.technicalSpec}</td>
                    <td className="py-3 px-4 text-slate-700">{item.deploymentScope}</td>
                    <td className="py-3 px-4 text-slate-600">{item.powerAndComms}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-800 tabular-nums whitespace-nowrap">
                      ₹{item.unitCostInr.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-800 tabular-nums">
                      {item.pilotQty}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                      ₹{lineTotal.toLocaleString('en-IN')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Phased Rollout Roadmap */}
      <section
        aria-labelledby="roadmap-heading"
        className="bg-white border border-slate-200 rounded-xl overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2.5">
          <Layers className="w-5 h-5 text-slate-700" aria-hidden="true" />
          <div>
            <h2 id="roadmap-heading" className="font-display text-lg font-bold text-slate-900">
              Phased Municipal Rollout Roadmap (80/20 Pilot → 607 km Mandate)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Incremental MCG / GMDA deployment aligned to pre-monsoon desilting cycles
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200">
          {ROLLOUT_ROADMAP.map((stage) => (
            <div key={stage.phase} className="p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-mono font-semibold text-sky-800">{stage.timeline}</span>
                  <span className="font-mono font-bold text-slate-900 tabular-nums">
                    {stage.budgetEstimateInr}
                  </span>
                </div>
                <h3 className="font-display text-sm font-bold text-slate-900">{stage.phase}</h3>
                <div className="text-xs font-medium text-slate-700">{stage.scope}</div>
                <p className="text-xs text-slate-600 leading-relaxed">{stage.deliverables}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Documented Data Assumptions & Citations */}
      <section
        aria-labelledby="assumptions-heading"
        className="bg-white border border-slate-200 rounded-xl overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2.5">
          <FileText className="w-5 h-5 text-slate-700" aria-hidden="true" />
          <div>
            <h2 id="assumptions-heading" className="font-display text-lg font-bold text-slate-900">
              Assumptions & Sources Section
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Clear separation between SustainX 2026 simulated benchmarks and live MCG/GMDA integration feeds
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" aria-hidden="true" />
              <span>Documented Benchmarks & Simulated Model Inputs</span>
            </div>
            <ul className="space-y-3">
              {DATA_ASSUMPTIONS.publicBenchmarks.map((item) => (
                <li
                  key={item.title}
                  className="pb-3 border-b border-slate-100 last:border-b-0 last:pb-0"
                >
                  <div className="text-xs font-semibold text-slate-900">{item.title}</div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.detail}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Database className="w-4 h-4 text-sky-700" aria-hidden="true" />
              <span>Live MCG / GMDA Inputs Required for Production Rollout</span>
            </div>
            <ul className="space-y-3">
              {DATA_ASSUMPTIONS.liveMcgInputsRequired.map((item) => (
                <li
                  key={item.title}
                  className="pb-3 border-b border-slate-100 last:border-b-0 last:pb-0"
                >
                  <div className="text-xs font-semibold text-slate-900">{item.title}</div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.detail}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};
