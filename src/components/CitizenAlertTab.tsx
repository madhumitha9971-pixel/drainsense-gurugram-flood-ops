import React, { useMemo, useState } from 'react';
import { ComputedNodeState } from '../types/drainsense';
import {
  CheckCircle2,
  MessageSquare,
  Navigation,
  PhoneCall,
  Radio,
  ShieldAlert,
  ShieldCheck,
  Volume2,
} from 'lucide-react';

interface CitizenAlertTabProps {
  nodes: ComputedNodeState[];
  onVerifyInField: (nodeId: string) => void;
}

const CORRIDOR_PRESETS = [
  {
    id: 'corridor-nh48',
    label: 'NH-48: Rajiv Chowk – Hero Honda Corridor',
    nodeId: 'hero-honda-chowk',
  },
  {
    id: 'corridor-sohna',
    label: 'Sohna Road: Badshahpur – Subhash Chowk',
    nodeId: 'subhash-chowk',
  },
  {
    id: 'corridor-golf',
    label: 'Golf Course Rd: DLF Ph-1 – Ph-5 Underpasses',
    nodeId: 'dlf-phase1-underpass',
  },
  {
    id: 'corridor-old',
    label: 'Old Gurugram: Sheetla Mata – Basai Chowk',
    nodeId: 'basai-chowk',
  },
];

export const CitizenAlertTab: React.FC<CitizenAlertTabProps> = ({
  nodes,
  onVerifyInField,
}) => {
  const autoPublishAlerts = useMemo(
    () =>
      nodes
        .filter((n) => n.riskTier === 'Avoid' && n.confidenceScore >= 75)
        .sort((a, b) => b.riskScore - a.riskScore),
    [nodes]
  );

  const heldForVerification = useMemo(
    () =>
      nodes
        .filter((n) => n.riskTier === 'Avoid' && n.confidenceScore < 75)
        .sort((a, b) => b.riskScore - a.riskScore),
    [nodes]
  );

  const cautionWatchNodes = useMemo(
    () =>
      nodes
        .filter((n) => n.riskTier === 'Caution')
        .sort((a, b) => b.riskScore - a.riskScore),
    [nodes]
  );

  const safeNodesCount = useMemo(
    () => nodes.filter((n) => n.riskTier === 'Safe').length,
    [nodes]
  );

  const [selectedNodeId, setSelectedNodeId] = useState<string>('hero-honda-chowk');
  const [smsLang, setSmsLang] = useState<'en' | 'hi'>('en');
  const [ivrPlaying, setIvrPlaying] = useState(false);

  const previewNode =
    nodes.find((n) => n.id === selectedNodeId) ?? autoPublishAlerts[0] ?? nodes[0];

  const statusVerbEn =
    previewNode.riskTier === 'Avoid'
      ? 'AVOID'
      : previewNode.riskTier === 'Caution'
      ? 'CAUTION'
      : 'SAFE';
  const statusVerbHi =
    previewNode.riskTier === 'Avoid'
      ? 'बचें (AVOID)'
      : previewNode.riskTier === 'Caution'
      ? 'सावधानी (CAUTION)'
      : 'सामान्य (SAFE)';

  const smsEnglish = `MCG DrainSense ${statusVerbEn}: ${previewNode.shortLabel} (${previewNode.zone}) flood risk ${previewNode.riskScore}/100 (~${previewNode.estimatedWaterDepthCm}cm). Use ${previewNode.alternateRoute}.`.slice(
    0,
    160
  );

  const smsHindi = `MCG अलर्ट ${statusVerbHi}: ${previewNode.hindiName} पर जलभराव जोखिम (${previewNode.riskScore}/100). वैकल्पिक मार्ग: ${previewNode.alternateRoute}.`;

  const ivrScriptEn = `Namaskar. This is an automated Municipal Corporation of Gurugram flood advisory. Waterlogging is predicted at ${previewNode.name} with an estimated depth of ${previewNode.estimatedWaterDepthCm} centimeters. Commuters are advised to avoid this stretch and take ${previewNode.alternateRoute}. Press 1 to repeat in Hindi.`;

  const ivrScriptHi = `नमस्कार। यह नगर निगम गुरुग्राम की स्वचालित जलभराव चेतावनी है। ${previewNode.hindiName} पर भारी बारिश और जलभराव की संभावना है। कृपया इस मार्ग से बचें और ${previewNode.alternateRoute} का उपयोग करें।`;

  const handlePlayIvr = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      if (ivrPlaying) {
        setIvrPlaying(false);
        return;
      }
      const utterance = new SpeechSynthesisUtterance(
        smsLang === 'en' ? ivrScriptEn : ivrScriptHi
      );
      utterance.lang = smsLang === 'en' ? 'en-IN' : 'hi-IN';
      utterance.rate = 0.96;
      utterance.onend = () => setIvrPlaying(false);
      utterance.onerror = () => setIvrPlaying(false);
      setIvrPlaying(true);
      window.speechSynthesis.speak(utterance);
    } else {
      setIvrPlaying((prev) => !prev);
    }
  };

  return (
    <div className="space-y-6">
      {/* Explicit Safe / Caution / Avoid Thresholds & False-Positive Guardrail */}
      <section
        aria-labelledby="guardrail-heading"
        className="bg-white border border-slate-200 rounded-xl overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs font-medium text-slate-500">
              Citizen Alert & False-Positive Guardrail Studio · Zero Alarm Fatigue
            </div>
            <h2 id="guardrail-heading" className="font-display text-lg font-bold text-slate-900 mt-0.5">
              Safe / Caution / Avoid Thresholds & Field Verification Gate
            </h2>
          </div>

          <div className="text-xs text-slate-600 font-mono tabular-nums">
            Confidence Gate: ≥75% Auto-Publish · &lt;75% Held for JE Check
          </div>
        </div>

        {/* 3 Clear Threshold Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200 border-b border-slate-200 bg-slate-50/50">
          <div className="p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700">SAFE · Risk Score &lt; 40</span>
              <span className="font-mono text-xs font-bold text-slate-900 tabular-nums">
                {safeNodesCount} nodes
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Drainage within capacity; normal traffic advisory. No public SMS/IVR alert triggered.
            </p>
          </div>
          <div className="p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-700">
                CAUTION · Risk Score 40–69
              </span>
              <span className="font-mono text-xs font-bold text-slate-900 tabular-nums">
                {cautionWatchNodes.length} nodes
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Routed to internal JE & Pump Crew watch + optional Corridor Advisory card; no panic
              broadcast.
            </p>
          </div>
          <div className="p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-red-700">AVOID · Risk Score ≥ 70</span>
              <span className="font-mono text-xs font-bold text-slate-900 tabular-nums">
                {autoPublishAlerts.length + heldForVerification.length} nodes
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Auto-publishes SMS/IVR/Corridor bypass only if Confidence ≥75%; otherwise held for
              Zone JE field check.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          {/* Auto-Publish Queue */}
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-red-600" aria-hidden="true" />
                <h3 className="text-sm font-bold text-slate-900">
                  Auto-Published AVOID Alerts ({autoPublishAlerts.length})
                </h3>
              </div>
              <span className="text-xs font-mono text-emerald-700 font-semibold">
                Confidence ≥ 75%
              </span>
            </div>

            {autoPublishAlerts.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
                No hotspots currently meet Risk ≥70 + Confidence ≥75% for public AVOID broadcast.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                {autoPublishAlerts.slice(0, 6).map((node) => (
                  <div
                    key={node.id}
                    className={`px-3.5 py-2.5 flex items-center justify-between gap-3 ${
                      previewNode.id === node.id ? 'bg-sky-50/70' : 'bg-white'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-900 truncate">
                        {node.name}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span>{node.zone}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono text-red-700 font-semibold tabular-nums">
                          Risk {node.riskScore}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono text-emerald-700 font-semibold tabular-nums">
                          Conf {node.confidenceScore}%
                        </span>
                        {node.isFieldVerified && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-sky-700 font-semibold">JE Verified</span>
                          </>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedNodeId(node.id)}
                      className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Preview Alert
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Field Verification Hold Queue */}
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600" aria-hidden="true" />
                <h3 className="text-sm font-bold text-slate-900">
                  Field Verification First ({heldForVerification.length})
                </h3>
              </div>
              <span className="text-xs font-mono text-amber-700 font-semibold">
                Confidence &lt; 75% (Test at T-48h / T-24h)
              </span>
            </div>

            {heldForVerification.length === 0 ? (
              <div className="p-6 text-center bg-emerald-50/60 border border-emerald-200 rounded-lg space-y-1">
                <p className="text-xs font-semibold text-emerald-800">
                  All high-risk alerts currently exceed 75% confidence or are JE-verified.
                </p>
                <p className="text-xs text-emerald-700">
                  Switch Forecast Window to <strong>T-48h</strong> or <strong>T-24h</strong> with
                  higher rainfall to see uncertain alerts held here for Zone JE verification first.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-amber-200 rounded-lg overflow-hidden">
                {heldForVerification.map((node) => (
                  <div
                    key={node.id}
                    className="px-3.5 py-2.5 bg-amber-50/40 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-900 truncate">
                        {node.name}
                      </div>
                      <div className="text-[11px] text-slate-600 flex items-center gap-1.5 mt-0.5">
                        <span>{node.assignedOwner}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono text-red-700 font-semibold tabular-nums">
                          Risk {node.riskScore}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono text-amber-700 font-semibold tabular-nums">
                          Conf {node.confidenceScore}% ({node.confidenceTier})
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onVerifyInField(node.id);
                        setSelectedNodeId(node.id);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Verify in Field</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Live Multi-Channel Commuter Previewer */}
      <section
        aria-labelledby="previewer-heading"
        className="bg-white border border-slate-200 rounded-xl overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 id="previewer-heading" className="font-display text-lg font-bold text-slate-900">
              Live Multi-Channel Preview: SMS, IVR & Corridor Advisory
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select any hotspot or commute corridor to inspect auto-generated advisories
            </p>
          </div>

          <select
            aria-label="Select hotspot or corridor for alert preview"
            value={previewNode.id}
            onChange={(e) => setSelectedNodeId(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-300 rounded-lg text-slate-800 cursor-pointer"
          >
            {nodes.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name} ({n.zone} · Risk {n.riskScore})
              </option>
            ))}
          </select>
        </div>

        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-medium text-slate-500 whitespace-nowrap">Corridors:</span>
          {CORRIDOR_PRESETS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedNodeId(c.nodeId)}
              className={`px-3 py-1 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                previewNode.id === c.nodeId
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Channel 1: Corridor Advisory Card */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800">
                  <Navigation className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                  Corridor Advisory Card
                </span>
                <span className="font-mono">{previewNode.corridorTag}</span>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold ${
                      previewNode.riskTier === 'Avoid'
                        ? 'text-red-700'
                        : previewNode.riskTier === 'Caution'
                        ? 'text-amber-700'
                        : 'text-emerald-700'
                    }`}
                  >
                    {previewNode.riskTier.toUpperCase()} CORRIDOR ADVISORY
                  </span>
                  <span className="font-mono text-xs text-slate-500 tabular-nums">
                    Conf {previewNode.confidenceScore}%
                  </span>
                </div>
                <div className="text-sm font-bold text-slate-900">{previewNode.name}</div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Predicted water depth:{' '}
                  <strong className="font-mono text-slate-900 tabular-nums">
                    ~{previewNode.estimatedWaterDepthCm} cm
                  </strong>
                  . {previewNode.primaryCause}.
                </p>
                <div className="pt-2 border-t border-slate-100 text-xs">
                  <span className="font-semibold text-emerald-800">Bypass / Alternate Route:</span>
                  <div className="text-slate-800 mt-0.5 font-medium">
                    {previewNode.alternateRoute}
                  </div>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
              <span>
                Guardrail status:{' '}
                <strong className="text-slate-700">{previewNode.alertRouting}</strong>
              </span>
            </div>
          </div>

          {/* Channel 2: 160-Char Bilingual SMS */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800">
                  <MessageSquare className="w-3.5 h-3.5 text-sky-700" aria-hidden="true" />
                  160-Char SMS Broadcast
                </span>
                <div className="inline-flex items-center p-0.5 bg-slate-200 rounded-md">
                  <button
                    type="button"
                    onClick={() => setSmsLang('en')}
                    className={`px-2 py-0.5 text-[11px] font-medium rounded cursor-pointer ${
                      smsLang === 'en' ? 'bg-white text-slate-900' : 'text-slate-600'
                    }`}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => setSmsLang('hi')}
                    className={`px-2 py-0.5 text-[11px] font-medium rounded cursor-pointer ${
                      smsLang === 'hi' ? 'bg-white text-slate-900' : 'text-slate-600'
                    }`}
                  >
                    हिन्दी
                  </button>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-3.5 space-y-2">
                <div className="text-[11px] font-mono text-slate-500">
                  SENDER: MCG-GURUGRAM · DLT TEMPLATE #1104
                </div>
                <p className="text-xs text-slate-900 font-mono leading-relaxed break-words">
                  {smsLang === 'en' ? smsEnglish : smsHindi}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono tabular-nums">
              <span>
                Length: {(smsLang === 'en' ? smsEnglish : smsHindi).length} / 160 chars
              </span>
              <span>Feature-phone compatible</span>
            </div>
          </div>

          {/* Channel 3: IVR Automated Voice Script */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800">
                  <PhoneCall className="w-3.5 h-3.5 text-slate-700" aria-hidden="true" />
                  IVR Voice Script
                </span>
                <span className="font-mono text-slate-500">Toll-Free 1800-180-1817</span>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-3.5 space-y-2">
                <div className="text-[11px] font-semibold text-slate-500">
                  {smsLang === 'en' ? 'English Voice Prompt' : 'हिन्दी वॉइस अलर्ट स्क्रिप्ट'}
                </div>
                <p className="text-xs text-slate-800 leading-relaxed">
                  “{smsLang === 'en' ? ivrScriptEn : ivrScriptHi}”
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handlePlayIvr}
              className={`w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                ivrPlaying
                  ? 'bg-sky-700 text-white hover:bg-sky-800'
                  : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              <Volume2 className="w-4 h-4" aria-hidden="true" />
              <span>
                {ivrPlaying ? 'Playing Voice Advisory (Click to Stop)' : 'Play IVR Voice Simulation'}
              </span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
