/**
 * Dynamic Fund Parameter Controls
 * Allows the user to modify economic, tax, and structural parameters in real-time
 * to observe how perturbations propagate through downstream state transitions.
 */

import React from 'react';
import { Sliders, RotateCcw, Sparkles } from 'lucide-react';
import { Section704cMethod } from '../types/tax-state';

export interface DynamicFundParameters {
  fmvMultiplier: number; // e.g. 1.0 = baseline, 1.25 = +25%
  section754Active: boolean;
  section704cMethod: Section704cMethod;
  transferPriceModifier: number; // e.g. 1.0 = par, 0.85 = 15% discount, 1.30 = 30% premium
  customDistributionAmount: number; // custom cash distribution injected if > 0
}

interface FundParameterControlsProps {
  parameters: DynamicFundParameters;
  onChangeParameters: (newParams: DynamicFundParameters) => void;
  onReset: () => void;
  isModified: boolean;
  activeFundName: string;
}

export const FundParameterControls: React.FC<FundParameterControlsProps> = ({
  parameters,
  onChangeParameters,
  onReset,
  isModified,
  activeFundName
}) => {
  return (
    <div className="p-5 rounded-xl bg-[#0b1222] border border-slate-800 space-y-4 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white tracking-tight">
                Dynamic Fund Parameters &amp; Perturbation Injection
              </span>
              {isModified && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Perturbed State Active
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-400">
              Perturbs initial state or transition parameters to evaluate downstream sensitivity ΔS_k → ΔS_n
            </div>
          </div>
        </div>

        {isModified && (
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors cursor-pointer font-medium"
            title="Reset parameters to SEC filing baseline"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Reset to Baseline</span>
          </button>
        )}
      </div>

      {/* Control sliders and toggles grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        
        {/* Param 1: Asset FMV Revaluation Multiplier */}
        <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800/90 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-300 font-medium">Asset FMV Revaluation:</span>
            <span className="font-mono text-emerald-400 font-bold">
              {(parameters.fmvMultiplier * 100).toFixed(0)}%
            </span>
          </div>
          <input
            type="range"
            min="0.60"
            max="1.80"
            step="0.05"
            value={parameters.fmvMultiplier}
            onChange={(e) => onChangeParameters({ ...parameters, fmvMultiplier: parseFloat(e.target.value) })}
            className="w-full accent-emerald-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>60% (Down)</span>
            <span>100% (Baseline)</span>
            <span>180% (Surge)</span>
          </div>
          <p className="text-[10px] text-slate-400">
            Perturbs asset book value and unamortized §704(c) reverse layers.
          </p>
        </div>

        {/* Param 2: §754 Election Status Toggle */}
        <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800/90 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-300 font-medium">IRC § 754 Election:</span>
            <span className={`font-mono font-bold ${parameters.section754Active ? 'text-emerald-400' : 'text-rose-400'}`}>
              {parameters.section754Active ? 'Active in State' : 'Revoked / Inactive'}
            </span>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => onChangeParameters({ ...parameters, section754Active: true })}
              className={`flex-1 py-1.5 rounded text-xs font-medium border transition-colors cursor-pointer ${
                parameters.section754Active
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              Active (§743(b) On)
            </button>
            <button
              onClick={() => onChangeParameters({ ...parameters, section754Active: false })}
              className={`flex-1 py-1.5 rounded text-xs font-medium border transition-colors cursor-pointer ${
                !parameters.section754Active
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 font-bold'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              Inactive ($0 Step-Up)
            </button>
          </div>
          <p className="text-[10px] text-slate-400">
            {parameters.section754Active
              ? 'Enables inside basis adjustments under Treas. Reg. § 1.743-1.'
              : 'Disabling §754 halts inside basis step-ups, creating Outside/Inside disparity.'}
          </p>
        </div>

        {/* Param 3: §704(c) Allocation Method */}
        <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800/90 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-300 font-medium">§ 704(c) Allocation Rule:</span>
          </div>
          <select
            value={parameters.section704cMethod}
            onChange={(e) => onChangeParameters({ ...parameters, section704cMethod: e.target.value as Section704cMethod })}
            className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer font-medium"
          >
            <option value="TRADITIONAL">Traditional (Ceiling Rule limited)</option>
            <option value="CURATIVE">Curative Allocations</option>
            <option value="REMEDIAL">Remedial Allocation Method</option>
          </select>
          <p className="text-[10px] text-slate-400">
            {parameters.section704cMethod === 'TRADITIONAL' && 'Ceiling Rule limits tax allocations to actual partnership gain/loss.'}
            {parameters.section704cMethod === 'CURATIVE' && 'Uses other partnership tax items to offset ceiling distortions.'}
            {parameters.section704cMethod === 'REMEDIAL' && 'Creates synthetic offsetting tax items under Reg. § 1.704-3(d).'}
          </p>
        </div>

        {/* Param 4: Secondary Sale Valuation Adjustment */}
        <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800/90 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-300 font-medium">Secondary Transfer Pricing:</span>
            <span className="font-mono text-cyan-400 font-bold">
              {parameters.transferPriceModifier >= 1 ? '+' : ''}{((parameters.transferPriceModifier - 1) * 100).toFixed(0)}%
            </span>
          </div>
          <input
            type="range"
            min="0.70"
            max="1.50"
            step="0.05"
            value={parameters.transferPriceModifier}
            onChange={(e) => onChangeParameters({ ...parameters, transferPriceModifier: parseFloat(e.target.value) })}
            className="w-full accent-cyan-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>-30% (Discount)</span>
            <span>Par (100%)</span>
            <span>+50% (Premium)</span>
          </div>
          <p className="text-[10px] text-slate-400">
            Perturbs transfer purchase price, directly adjusting the §743(b) step-up/down vector.
          </p>
        </div>

      </div>

      {/* Optional Injection Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-900/60 rounded-lg border border-slate-800 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Simulating live perturbation across <strong className="text-white">{activeFundName}</strong>: All changes recompute downstream state vector <code className="font-mono text-emerald-300 text-[11px]">(G_t, X_t, A_t, I_t, C_t, P_t, V_t)</code> instantaneously.
          </span>
        </div>
      </div>
    </div>
  );
};
