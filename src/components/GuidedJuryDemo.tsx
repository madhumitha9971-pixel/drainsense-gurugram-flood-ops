import React from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Play, X } from 'lucide-react';

interface GuidedJuryDemoProps {
  open: boolean;
  step: number;
  onClose: () => void;
  onSetStep: (step: number) => void;
  onTriggerStep1ExtremeRain: () => void;
  onTriggerStep2ClearUpstream: () => void;
  onTriggerStep3RwaGovernance: () => void;
  onTriggerStep4CitizenAlerts: () => void;
}

const DEMO_STEPS = [
  {
    title: '01. Replay Sept 1, 2025 Cloudburst (133 mm / 3–4h)',
    summary:
      'Switch to the 133 mm extreme rainfall benchmark on the 3D Cascade Twin. Watch NH-48 underpasses (Hero Honda, Rajiv Chowk) and Sohna Road chokepoints rise as crimson 3D flood pillars (Avoid ≥70).',
    actionLabel: 'Apply 133 mm Scenario & Inspect Rajiv Chowk',
  },
  {
    title: '02. 80/20 Upstream Culvert Clearing in 3D',
    summary:
      'Clear Badshahpur Main Culvert & Subhash Chowk (top upstream chokepoints) and watch downstream 3D water-volume bars shrink dynamically across the Gurugram basin.',
    actionLabel: 'Clear Top Upstream Culverts Now',
  },
  {
    title: '03. RWA Political Economy & Audit Ledger',
    summary:
      'Review an RWA pump-diversion demand (Sector 56 vs. Hero Honda Chowk). Reject it using the Objective Hydrological Score Receipt or log a justified override in the Audit Ledger.',
    actionLabel: 'Open RWA Escalation Simulator',
  },
  {
    title: '04. Citizen Alert Guardrail & Bilingual Preview',
    summary:
      'Inspect how <75% confidence alerts are held for Zone JE field verification to stop alarm fatigue, and preview live Web/WhatsApp alternate routes, EN/HI 160-char SMS, and IVR voice scripts.',
    actionLabel: 'Open Citizen Alert Previewer',
  },
];

export const GuidedJuryDemo: React.FC<GuidedJuryDemoProps> = ({
  open,
  step,
  onClose,
  onSetStep,
  onTriggerStep1ExtremeRain,
  onTriggerStep2ClearUpstream,
  onTriggerStep3RwaGovernance,
  onTriggerStep4CitizenAlerts,
}) => {
  if (!open) return null;

  const current = DEMO_STEPS[step] ?? DEMO_STEPS[0];

  const handleRunStepAction = () => {
    if (step === 0) onTriggerStep1ExtremeRain();
    else if (step === 1) onTriggerStep2ClearUpstream();
    else if (step === 2) onTriggerStep3RwaGovernance();
    else onTriggerStep4CitizenAlerts();
  };

  return (
    <aside
      aria-label="Guided Jury Demo walkthrough"
      className="fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] sm:w-[410px] bg-white border border-slate-300 rounded-xl shadow-2xl overflow-hidden"
    >
      <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Play className="w-3.5 h-3.5 text-sky-400 fill-current" aria-hidden="true" />
          <span className="font-display text-xs font-bold">
            Guided Jury Demo · Step {step + 1} of {DEMO_STEPS.length}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Guided Jury Demo"
          className="p-1 text-slate-300 hover:text-white rounded cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Step Progress Bar */}
      <div className="grid grid-cols-4 gap-1 px-4 pt-3">
        {DEMO_STEPS.map((s, idx) => (
          <button
            key={s.title}
            type="button"
            onClick={() => onSetStep(idx)}
            aria-label={`Jump to step ${idx + 1}`}
            className={`h-1.5 rounded-full transition-colors cursor-pointer ${
              idx === step
                ? 'bg-slate-900'
                : idx < step
                ? 'bg-emerald-500'
                : 'bg-slate-200'
            }`}
          />
        ))}
      </div>

      <div className="p-4 space-y-3">
        <h3 className="font-display text-sm font-bold text-slate-900">{current.title}</h3>
        <p className="text-xs text-slate-600 leading-relaxed">{current.summary}</p>

        <button
          type="button"
          onClick={handleRunStepAction}
          className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors cursor-pointer"
        >
          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{current.actionLabel}</span>
        </button>
      </div>

      <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
        <button
          type="button"
          disabled={step === 0}
          onClick={() => onSetStep(Math.max(0, step - 1))}
          className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Previous</span>
        </button>

        {step < DEMO_STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => {
              const next = step + 1;
              onSetStep(next);
              if (next === 1) onTriggerStep2ClearUpstream();
              else if (next === 2) onTriggerStep3RwaGovernance();
              else if (next === 3) onTriggerStep4CitizenAlerts();
            }}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md cursor-pointer"
          >
            <span>Next Step</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-md cursor-pointer"
          >
            <span>Finish Tour</span>
          </button>
        )}
      </div>
    </aside>
  );
};
