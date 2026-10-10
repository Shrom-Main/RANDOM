/**
 * Scale Stress-Testing & Failure Frontier Studio
 * In accordance with Sections 30 - 34 & 56 - 58 of POC1 Extension Specification
 * "How large and interconnected can the computational state become before the proposed
 * temporal state-transition architecture becomes insufficient, computationally impractical,
 * evidentially incomplete, or dependent on human determination? Try to break it."
 */

import React, { useState, useMemo } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Flame, 
  Play, 
  RotateCcw, 
  TrendingUp, 
  ShieldAlert, 
  Cpu, 
  HardDrive, 
  Clock, 
  Layers,
  Sparkles,
  Zap
} from 'lucide-react';
import { 
  ScaleTestLevel, 
  ScaleBenchmarkResult, 
  BENCHMARK_LEVEL_DEFINITIONS, 
  runScaleStressTest 
} from '../engine/scale-stress-engine';

export const ScaleStressTestView: React.FC = () => {
  const [selectedLevel, setSelectedLevel] = useState<ScaleTestLevel>(3);
  const [isStressTestingAll, setIsStressTestingAll] = useState<boolean>(false);
  const [benchmarks, setBenchmarks] = useState<Record<ScaleTestLevel, ScaleBenchmarkResult>>(() => {
    const initial: Partial<Record<ScaleTestLevel, ScaleBenchmarkResult>> = {};
    for (let i = 0; i <= 6; i++) {
      initial[i as ScaleTestLevel] = runScaleStressTest(i as ScaleTestLevel);
    }
    return initial as Record<ScaleTestLevel, ScaleBenchmarkResult>;
  });

  const currentResult = benchmarks[selectedLevel];

  // Run automated stress test suite across all 7 levels
  const handleRunAllLevels = () => {
    setIsStressTestingAll(true);
    let l = 0;
    const interval = setInterval(() => {
      if (l <= 6) {
        setSelectedLevel(l as ScaleTestLevel);
        const res = runScaleStressTest(l as ScaleTestLevel);
        setBenchmarks(prev => ({ ...prev, [l as ScaleTestLevel]: res }));
        l++;
      } else {
        clearInterval(interval);
        setIsStressTestingAll(false);
      }
    }, 700);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8 animate-fadeIn">
      {/* iOS Header Banner */}
      <div className="ios-glass-card rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 mb-2">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Sections 30 - 34 &amp; 56 - 58 Specification</span>
              <span>·</span>
              <span className="font-mono">Empirical Failure Frontier Mapping</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Scale Stress-Testing &amp; Computational Boundary Lab
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Progressively tests network scale from <span className="text-blue-300 font-mono">Small → Medium → Large → Global → Highly Connected → Adversarial</span> to identify the exact threshold where determinism breaks.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRunAllLevels}
              disabled={isStressTestingAll}
              className="px-5 py-2.5 rounded-2xl text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 hover:from-blue-500 hover:to-indigo-500 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isStressTestingAll ? (
                <>
                  <Activity className="w-4 h-4 animate-spin" />
                  <span>Stress Testing Levels 0–6...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span>Run Progressive Stress Benchmark</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Level Selector Segmented Control (iOS Style) */}
      <div className="ios-glass rounded-3xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <span>Select Target Scale Level (0 to 6)</span>
          </span>
          <span className="text-xs font-mono text-slate-400">
            Current: {BENCHMARK_LEVEL_DEFINITIONS[selectedLevel].name}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {([0, 1, 2, 3, 4, 5, 6] as ScaleTestLevel[]).map((lvl) => {
            const def = BENCHMARK_LEVEL_DEFINITIONS[lvl];
            const res = benchmarks[lvl];
            const isSelected = lvl === selectedLevel;
            const isFailure = res.failurePointDetected;

            return (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                className={`p-3.5 rounded-2xl text-left transition-all cursor-pointer border ${
                  isSelected
                    ? isFailure
                      ? 'bg-rose-500/20 border-rose-500/60 shadow-lg shadow-rose-500/20'
                      : 'bg-blue-600/25 border-blue-500/60 shadow-lg shadow-blue-500/20'
                    : 'ios-glass-subtle border-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs font-bold text-white">Lvl {lvl}</span>
                  {isFailure ? (
                    <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  )}
                </div>
                <div className="text-[11px] font-semibold text-slate-200 truncate">{def.category}</div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  {def.targetEntities.toLocaleString()} Entities
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Results & Failure Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Live Instrumentation Metrics (7 cols) */}
        <div className="lg:col-span-7 ios-glass-card rounded-3xl p-6 sm:p-7 space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <span className="text-xs font-mono text-blue-400 font-semibold tracking-wide">
                Section 31 &amp; 32 Instrumentation Metrics
              </span>
              <h2 className="text-xl font-bold text-white mt-0.5">
                {currentResult.name}
              </h2>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 font-mono block">Simulated Edges</span>
              <span className="text-base font-bold font-mono text-white">
                {currentResult.simulatedEdges.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Core Latencies Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="ios-glass-subtle rounded-2xl p-3.5 space-y-1">
              <span className="text-[10px] text-slate-400 font-mono uppercase">T_ingest (Data)</span>
              <div className="text-base font-bold font-mono text-white">
                {currentResult.tIngestMs < 1000 
                  ? `${currentResult.tIngestMs.toFixed(1)} ms` 
                  : `${(currentResult.tIngestMs / 1000).toFixed(1)} s`}
              </div>
            </div>

            <div className="ios-glass-subtle rounded-2xl p-3.5 space-y-1">
              <span className="text-[10px] text-slate-400 font-mono uppercase">T_graph (Build)</span>
              <div className="text-base font-bold font-mono text-white">
                {currentResult.tGraphMs < 1000 
                  ? `${currentResult.tGraphMs.toFixed(1)} ms` 
                  : `${(currentResult.tGraphMs / 1000).toFixed(1)} s`}
              </div>
            </div>

            <div className="ios-glass-subtle rounded-2xl p-3.5 space-y-1">
              <span className="text-[10px] text-slate-400 font-mono uppercase">T_replay (History)</span>
              <div className={`text-base font-bold font-mono ${currentResult.tReplayMs > 10000 ? 'text-rose-400' : 'text-blue-300'}`}>
                {currentResult.tReplayMs < 1000 
                  ? `${currentResult.tReplayMs.toFixed(1)} ms` 
                  : currentResult.tReplayMs < 60000
                  ? `${(currentResult.tReplayMs / 1000).toFixed(1)} s`
                  : `${(currentResult.tReplayMs / 60000).toFixed(1)} min`}
              </div>
            </div>

            <div className="ios-glass-subtle rounded-2xl p-3.5 space-y-1">
              <span className="text-[10px] text-slate-400 font-mono uppercase">Memory Footprint</span>
              <div className={`text-base font-bold font-mono ${currentResult.memoryMb > 4000 ? 'text-amber-300' : 'text-emerald-300'}`}>
                {currentResult.memoryMb < 1024 
                  ? `${currentResult.memoryMb} MB` 
                  : `${(currentResult.memoryMb / 1024).toFixed(1)} GB`}
              </div>
            </div>
          </div>

          {/* Graph Complexity Metrics (Section 32) */}
          <div className="ios-glass-subtle rounded-2xl p-4 space-y-3">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              <span>Section 32: Graph Topology Complexity Indices</span>
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div>
                <span className="text-slate-400 block text-[10px]">Dependency Depth (D_dep):</span>
                <span className="text-white font-bold">{currentResult.dependencyDepth} layers</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Branching Factor:</span>
                <span className="text-white font-bold">{currentResult.branchingFactor.toFixed(1)}x</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Nonlinear Spike:</span>
                <span className={currentResult.hasNonlinearExplosion ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                  {currentResult.hasNonlinearExplosion ? 'DETECTED' : 'STABLE'}
                </span>
              </div>
            </div>
          </div>

          {/* 10 Core Scaling Questions Table (Sec. 31 & 56) */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-white block">
              Section 56: Formal Computational Hypothesis Verification
            </span>
            <div className="space-y-1.5 text-xs font-mono">
              {[
                { label: 'Does state sufficiency remain valid?', valid: currentResult.isStateSufficiencyValid },
                { label: 'Does historical replay remain possible?', valid: currentResult.isReplayPossible },
                { label: 'Does dependency traversal remain tractable?', valid: currentResult.isDependencyTraversalTractable },
                { label: 'Does data provenance remain complete?', valid: currentResult.isProvenanceComplete },
                { label: 'Does formula auditing remain understandable?', valid: currentResult.isFormulaAuditingUnderstandable },
                { label: 'Does AI remain tool-grounded?', valid: currentResult.isAiGrounded },
                { label: 'Does public observability become limiting factor?', valid: !currentResult.isPublicObservabilityLimiting }
              ].map((q, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="text-slate-300">{q.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    q.valid ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'
                  }`}>
                    {q.valid ? 'YES / CONFIRMED' : 'NO / BROKEN'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Failure Frontier Mapping & Diagnosis (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Failure Frontier Diagnosis Box */}
          <div className={`ios-glass-card rounded-3xl p-6 sm:p-7 space-y-4 border ${
            currentResult.failurePointDetected ? 'border-rose-500/40' : 'border-emerald-500/30'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className={`w-4 h-4 ${currentResult.failurePointDetected ? 'text-rose-400' : 'text-emerald-400'}`} />
                <span>Section 57: Failure Frontier Analysis</span>
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                currentResult.failurePointDetected ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
              }`}>
                {currentResult.failurePointDetected ? 'FRONTIER BREACH' : 'WITHIN BOUNDS'}
              </span>
            </div>

            {currentResult.failurePointDetected ? (
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-rose-950/30 border border-rose-500/30 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-rose-400 font-bold block">
                    Failure Classification: {currentResult.failureClass}
                  </span>
                  <p className="text-xs text-rose-200 leading-relaxed">
                    {currentResult.failureRootCause}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl ios-glass-subtle space-y-1">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">
                    Computational Gate Action (Γ)
                  </span>
                  <div className="text-sm font-bold text-amber-300 font-mono">
                    {currentResult.computationalBoundaryAction === 'REJECT_HARD_HALT' 
                      ? 'REJECT (Deterministic Execution Halted)' 
                      : 'REVIEW (Mandatory Human Legal Escalation)'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 space-y-2">
                <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Architecture Operates Deterministically</span>
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  State sufficiency, full event replay, and 100% provenance verification remain computationally tractable at this scale.
                </p>
              </div>
            )}

            <div className="pt-2 border-t border-white/10 text-[11px] text-slate-400 leading-relaxed">
              <span className="font-semibold text-white">Research Principle (Sec. 99): </span>
              "Failure is a research result. The objective is not to avoid the failure frontier ℱ, but to empirically map its exact boundaries."
            </div>
          </div>

          {/* Complexity vs Runtime Progression Curve (Sec. 32) */}
          <div className="ios-glass rounded-3xl p-5 space-y-3">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
              <span>Complexity → Runtime Scaling Curve</span>
            </span>
            <div className="space-y-2">
              {([0, 1, 2, 3, 4, 5, 6] as ScaleTestLevel[]).map((lvl) => {
                const b = benchmarks[lvl];
                const widthPct = Math.min(100, Math.max(3, (Math.log10(b.tReplayMs + 1) / Math.log10(4800000)) * 100));
                const isSelected = lvl === selectedLevel;

                return (
                  <div key={lvl} className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className={isSelected ? 'text-blue-300 font-bold' : 'text-slate-400'}>
                        Lvl {lvl} ({BENCHMARK_LEVEL_DEFINITIONS[lvl].category})
                      </span>
                      <span className={b.failurePointDetected ? 'text-rose-400 font-semibold' : 'text-slate-300'}>
                        {b.tReplayMs < 1000 ? `${b.tReplayMs.toFixed(0)}ms` : `${(b.tReplayMs / 1000).toFixed(1)}s`}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          b.failurePointDetected ? 'bg-gradient-to-r from-amber-400 to-rose-500' : 'bg-gradient-to-r from-blue-400 to-indigo-500'
                        }`}
                        style={{ width: `${widthPct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
