import React from 'react';
import { AppTab, ForecastHorizon } from '../types/drainsense';
import { BookOpen, Play, RotateCcw } from 'lucide-react';

interface HeaderAndBannerProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  horizon: ForecastHorizon;
  onChangeHorizon: (h: ForecastHorizon) => void;
  rainfallMm: number;
  onChangeRainfall: (mm: number) => void;
  siltLoadFactor: number;
  onChangeSilt: (silt: number) => void;
  activePreset: string;
  onApplyPreset: (preset: 'normal' | 'moderate' | 'extreme2025' | 'pareto8020') => void;
  onResetAll: () => void;
  onOpenAssumptions: () => void;
  onStartDemo: () => void;
  clearedCount: number;
}

const HORIZONS: ForecastHorizon[] = ['T-48h', 'T-24h', 'T-12h', 'T-6h', 'T-0'];

const TABS: { id: AppTab; label: string }[] = [
  { id: 'twin3d', label: '3D Cascade Twin' },
  { id: 'operations', label: 'MCG SOP & Ledger' },
  { id: 'alerts', label: 'Citizen Alert Center' },
  { id: 'validation', label: 'Validation & Sensors' },
];

export const HeaderAndBanner: React.FC<HeaderAndBannerProps> = ({
  activeTab,
  onSelectTab,
  horizon,
  onChangeHorizon,
  rainfallMm,
  onChangeRainfall,
  siltLoadFactor,
  onChangeSilt,
  activePreset,
  onApplyPreset,
  onResetAll,
  onOpenAssumptions,
  onStartDemo,
  clearedCount,
}) => {
  return (
    <div className="sticky top-0 z-40 bg-white border-b border-slate-200">
      {/* Persistent Transparency & Compliance Strip */}
      <div className="bg-slate-900 text-slate-100 px-4 sm:px-6 py-1.5 text-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono font-semibold text-amber-300 shrink-0">
            SIMULATED SCENARIO — Documented Operational Assumptions (SustainX 2026)
          </span>
          <span className="text-slate-400 hidden sm:inline" aria-hidden="true">
            ·
          </span>
          <span className="text-slate-200 truncate">
            MCG & GMDA Predictive Drainage Twin · 159 Hotspots · 607 km Network Mandate
          </span>
        </div>
        <button
          type="button"
          onClick={onOpenAssumptions}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-300 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 rounded px-1.5 py-0.5"
        >
          <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Assumptions & Citations</span>
        </button>
      </div>

      {/* 3-Zone Top Navigation Header */}
      <header className="max-w-[1440px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-8 border-b border-slate-200/80">
        {/* Zone 1: Single-line Brand Wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            onSelectTab('twin3d');
          }}
          className="inline-flex items-center gap-2.5 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 rounded"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            className="shrink-0"
            aria-hidden="true"
          >
            <rect width="24" height="24" rx="6" fill="#0F172A" />
            <path
              d="M6 8H18M8 12H16M10 16H14"
              stroke="#38BDF8"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="17" cy="16" r="2" fill="#10B981" />
          </svg>
          <span className="font-display text-lg font-bold tracking-tight text-slate-900">
            DrainSense 3D
          </span>
        </a>

        {/* Zone 2: 4 Clean Text Nav Tabs */}
        <nav aria-label="Primary sections" className="hidden lg:flex items-center gap-7 h-full">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                className={`relative h-full inline-flex items-center text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 ${
                  isActive ? 'text-slate-900 font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
                {isActive && <span className="absolute bottom-0 inset-x-0 h-0.5 bg-slate-900" />}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onStartDemo}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-900"
          >
            <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
            <span>Guided Jury Demo (2-Min Tour)</span>
          </button>
        </div>
      </header>

      {/* Mobile/Tablet Tab Switcher */}
      <div className="lg:hidden border-b border-slate-200 px-4 py-2 flex items-center gap-2 overflow-x-auto bg-slate-50">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Live 24–48h Scenario & 80/20 Leverage Control Bar */}
      <div className="bg-slate-50/95 border-b border-slate-200/80">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-2.5 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5">
            {/* Forecast Horizon */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-600 whitespace-nowrap">
                Forecast Horizon
              </span>
              <div className="inline-flex items-center p-0.5 bg-slate-200/75 rounded-lg">
                {HORIZONS.map((h) => {
                  const active = horizon === h;
                  return (
                    <button
                      key={h}
                      type="button"
                      onClick={() => onChangeHorizon(h)}
                      className={`px-2 py-1 text-xs font-mono font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        active
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {h === 'T-0' ? 'Live Rain (T-0)' : h}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3-Hour Rainfall Burst */}
            <div className="flex items-center gap-2">
              <label
                htmlFor="rainfall-slider"
                className="text-xs font-medium text-slate-600 whitespace-nowrap"
              >
                3-Hour Rainfall Burst
              </label>
              <input
                id="rainfall-slider"
                type="range"
                min={10}
                max={150}
                step={1}
                value={rainfallMm}
                onChange={(e) => onChangeRainfall(Number(e.target.value))}
                className="w-24 sm:w-28 accent-slate-900 cursor-pointer"
              />
              <span className="font-mono text-xs font-semibold text-slate-900 w-14 text-right tabular-nums">
                {rainfallMm} mm
              </span>
            </div>

            {/* Silt / Desilting Lag */}
            <div className="flex items-center gap-2">
              <label
                htmlFor="silt-slider"
                className="text-xs font-medium text-slate-600 whitespace-nowrap"
              >
                Silt / Desilting Lag
              </label>
              <input
                id="silt-slider"
                type="range"
                min={10}
                max={90}
                step={1}
                value={siltLoadFactor}
                onChange={(e) => onChangeSilt(Number(e.target.value))}
                className="w-20 sm:w-24 accent-slate-900 cursor-pointer"
              />
              <span className="font-mono text-xs font-semibold text-slate-900 w-9 text-right tabular-nums">
                {siltLoadFactor}%
              </span>
            </div>
          </div>

          {/* Quick Scenario Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => onApplyPreset('normal')}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activePreset === 'normal'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Normal Rain (25 mm)
            </button>
            <button
              type="button"
              onClick={() => onApplyPreset('moderate')}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activePreset === 'moderate'
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Cloudburst Alert (60 mm)
            </button>
            <button
              type="button"
              onClick={() => onApplyPreset('extreme2025')}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activePreset === 'extreme2025'
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Sept 1, 2025 Extreme (133 mm)
            </button>
            <button
              type="button"
              onClick={() => onApplyPreset('pareto8020')}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activePreset === 'pareto8020'
                  ? 'bg-sky-700 text-white border-sky-700'
                  : 'bg-white text-sky-800 border-sky-200 hover:bg-sky-50'
              }`}
            >
              80/20 Upstream Clearing Simulation
            </button>
            {clearedCount > 0 && (
              <button
                type="button"
                onClick={onResetAll}
                title="Reset cleared chokepoints and pump deployments"
                className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-md hover:bg-slate-200/60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
