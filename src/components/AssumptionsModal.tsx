import React from 'react';
import { DATA_ASSUMPTIONS } from '../data/staticData';
import { X } from 'lucide-react';

interface AssumptionsModalProps {
  open: boolean;
  onClose: () => void;
  onGoToValidationTab: () => void;
}

export const AssumptionsModal: React.FC<AssumptionsModalProps> = ({
  open,
  onClose,
  onGoToValidationTab,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="assumptions-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl shadow-xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[88vh]">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono font-semibold text-amber-700">
              SIMULATED SCENARIO — DOCUMENTED OPERATIONAL ASSUMPTIONS (SUSTAINX 2026)
            </div>
            <h2
              id="assumptions-modal-title"
              className="font-display text-lg font-bold text-slate-900 mt-0.5"
            >
              Assumptions & Citations (MCG / GMDA)
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          <p className="text-slate-600 leading-relaxed">
            DrainSense 3D is built on documented operational assumptions for MCG and GMDA across
            Gurugram’s 159 waterlogging hotspots and 607 km drainage network mandate, calibrated to
            the Sept 1, 2025 disruption (133 mm rain in 4 hours, 20 km traffic jam, 51-hour power
            outage) and June 2026 desilting lag (16 of 36 hotspots completed by late June vs. May 31
            deadline).
          </p>

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900">Documented Operational Baselines</h3>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg">
              {DATA_ASSUMPTIONS.publicBenchmarks.map((item) => (
                <div key={item.title} className="p-3.5">
                  <div className="font-semibold text-slate-900">{item.title}</div>
                  <p className="text-slate-600 mt-1 leading-relaxed">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900">
              Live Field Inputs Required for Production Deployment
            </h3>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg">
              {DATA_ASSUMPTIONS.liveMcgInputsRequired.map((item) => (
                <div key={item.title} className="p-3.5">
                  <div className="font-semibold text-slate-900">{item.title}</div>
                  <p className="text-slate-600 mt-1 leading-relaxed">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              onClose();
              onGoToValidationTab();
            }}
            className="text-xs font-semibold text-sky-700 hover:text-sky-900 cursor-pointer"
          >
            Open Validation Metrics & ₹ INR Sensor Specs →
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
