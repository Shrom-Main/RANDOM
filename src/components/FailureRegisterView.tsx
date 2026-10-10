/**
 * Empirical Failure Register View (Section 49 & Section 65)
 * Classifying breakdowns across 10 failure classes:
 * Representation, Event, Rule, Ordering, Data, Provenance, Version, Propagation, Calculation, Observability
 */

import React, { useState } from 'react';
import { FAILURE_REGISTER } from '../data/failure-register';
import { AlertTriangle } from 'lucide-react';
import { MathView } from './MathView';

export const FailureRegisterView: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const categories: string[] = [
    'ALL',
    'Representation',
    'Event',
    'Rule',
    'Ordering',
    'Data',
    'Provenance',
    'Version',
    'Propagation',
    'Calculation',
    'Observability'
  ];

  const filteredFailures = selectedCategory === 'ALL'
    ? FAILURE_REGISTER
    : FAILURE_REGISTER.filter(f => f.failureType === selectedCategory);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="ios-glass-card rounded-3xl p-6 sm:p-7 mb-6 relative overflow-hidden">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white border border-white/15 mb-2.5">
          <AlertTriangle className="w-3.5 h-3.5 text-zinc-300" />
          <span>Section 49 Deliverable</span>
          <span>·</span>
          <span className="font-mono text-zinc-300">Empirical Breakdown Registry</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
          Empirical Failure Register
        </h1>
        <p className="text-xs text-zinc-400 max-w-3xl leading-relaxed">
          POC1 treats discrepancy not merely as "AI tax error", but as an investigation of computational correctness.
          Every breakdown below identifies the exact point where state sufficiency broke down, why the computational boundary 
          was crossed, and the minimal state augmentation required.
        </p>
      </div>

      {/* Category Tabs Filter */}
      <div className="ios-glass p-1.5 rounded-2xl mb-6 flex flex-wrap gap-1 text-xs">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors whitespace-nowrap cursor-pointer ${
              selectedCategory === cat
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {cat} {cat !== 'ALL' && `(${FAILURE_REGISTER.filter(f => f.failureType === cat).length})`}
          </button>
        ))}
      </div>

      {/* Failure Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredFailures.map((failure) => (
          <div 
            key={failure.failureId}
            className="ios-glass-card rounded-2xl p-5 sm:p-6 flex flex-col justify-between hover:border-white/20 transition-all shadow-xl"
          >
            <div>
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-white">{failure.failureId}</span>
                  <span className="text-zinc-500">·</span>
                  <span className="text-xs font-semibold text-zinc-300">{failure.failureType} Failure</span>
                </div>
                <span className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full border ${
                  failure.boundaryOutcome === 'Review' ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' :
                  failure.boundaryOutcome === 'Reject' ? 'bg-rose-500/10 text-rose-300 border-rose-500/30' :
                  'bg-white/10 text-white border-white/20'
                }`}>
                  {failure.boundaryOutcome}
                </span>
              </div>

              {/* Fund Case Name */}
              <h3 className="text-sm font-semibold text-white mb-2">
                {failure.caseName}
              </h3>

              {/* Missing Information & State Impact */}
              <div className="space-y-2 text-xs mb-3">
                <div>
                  <span className="text-zinc-500 font-medium">Missing Information: </span>
                  <span className="text-zinc-300">{failure.missingInformation}</span>
                </div>
                <div>
                  <span className="text-zinc-500 font-medium">State Impact: </span>
                  <span className="text-zinc-300">{failure.stateImpact}</span>
                </div>
                <div>
                  <span className="text-zinc-500 font-medium">Root Cause: </span>
                  <span className="text-zinc-400">{failure.rootCause}</span>
                </div>
              </div>

              {/* Mathematical Formulation formatted with KaTeX */}
              <div className="p-2.5 rounded-xl bg-black/80 border border-white/10 mb-3 overflow-x-auto">
                <MathView math={failure.mathematicalExpression} fontSize="sm" />
              </div>
            </div>

            {/* Proposed State Model Fix */}
            <div className="pt-3 border-t border-white/10">
              <div className="text-[11px] text-zinc-500 font-semibold mb-1">Proposed State Model Augmentation:</div>
              <div className="text-xs text-white font-medium">
                {failure.proposedStateAugmentation}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
