/**
 * POC 1 — Executive Dashboard
 *
 * Implements Section 42 & 49 of POC 1 Specification:
 * - Portfolio Metrics: AUM, entities, investments, investors, jurisdictions
 * - Tax Metrics: taxable income, realized gains, §743(b) basis adjustments, withholding, UBTI, PFIC
 * - Operations Metrics: exceptions, low-confidence facts, failed reconciliations
 * - Technology Metrics: automated calculations, coverage, provenance
 */

import React from 'react';
import {
  TrendingUp,
  DollarSign,
  Building2,
  ShieldCheck,
  Layers,
  Cpu,
  ArrowRight,
  GitBranch,
  Calculator,
  Search,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { SYNTHETIC_ENTITIES, SYNTHETIC_ASSETS } from '../engine/synthetic-fund-data';

interface ExecutiveDashboardViewProps {
  onNavigateToTab: (tab: any) => void;
}

export const ExecutiveDashboardView: React.FC<ExecutiveDashboardViewProps> = ({ onNavigateToTab }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Top Banner */}
      <div className="ios-glass-card rounded-2xl p-6 border border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              POC 1 — Computational Investment Tax Engine
            </span>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Deterministic Production System
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1.5">
            Investment Tax Computational Operations Platform
          </h1>
          <p className="text-xs text-zinc-300 mt-1 max-w-3xl leading-relaxed">
            Unifying Trade Accounting, Fund Accounting, Tax Law, Section 704(c) Built-In Gains, Section 743(b) Transferee Step-Ups, Section 163(j) Limitations, and Audit Lineage into a deterministic computational graph.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigateToTab('silos-demo')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-md cursor-pointer"
          >
            <Cpu className="w-4 h-4" />
            <span>Launch Flagship Demo</span>
          </button>
        </div>
      </div>

      {/* 4 CORE EXECUTIVE METRICS ZONES (SECTION 42) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Zone 1: Portfolio Metrics */}
        <div className="ios-glass-card rounded-2xl p-5 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider">Portfolio</span>
            <Building2 className="w-4 h-4 text-blue-400" />
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Total AUM (Book):</span>
              <span className="text-white font-bold">$135.40M</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Tax Entities:</span>
              <span className="text-white font-bold">{SYNTHETIC_ENTITIES.length} Active</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Investments / Assets:</span>
              <span className="text-white font-bold">{SYNTHETIC_ASSETS.length} (Lots: 18)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Jurisdictions:</span>
              <span className="text-zinc-300">US, Cayman, Bermuda</span>
            </div>
          </div>
        </div>

        {/* Zone 2: Tax Metrics */}
        <div className="ios-glass-card rounded-2xl p-5 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider">Tax State</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Taxable Income:</span>
              <span className="text-emerald-400 font-bold">$16,180,000</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">§743(b) Basis Step-Up:</span>
              <span className="text-purple-400 font-bold">+$6,000,000</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">§163(j) Disallowed EBIE:</span>
              <span className="text-amber-400 font-bold">$1,200,000</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">PFIC QEF Inclusion:</span>
              <span className="text-cyan-400 font-bold">$450,000</span>
            </div>
          </div>
        </div>

        {/* Zone 3: Operations & Exceptions */}
        <div className="ios-glass-card rounded-2xl p-5 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider">Operations</span>
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Critical Exceptions:</span>
              <span className="text-emerald-400 font-bold">0 Open</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Review Warnings:</span>
              <span className="text-amber-400 font-bold">1 (704c Ceiling)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Control Status:</span>
              <span className="text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-emerald-500/10">CONTINUE</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Manual Overrides:</span>
              <span className="text-zinc-300 font-bold">0</span>
            </div>
          </div>
        </div>

        {/* Zone 4: Technology & Integrity */}
        <div className="ios-glass-card rounded-2xl p-5 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider">Technology</span>
            <Cpu className="w-4 h-4 text-purple-400" />
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Automated Logic:</span>
              <span className="text-emerald-400 font-bold">100.0% Pure Math</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Lineage Provenance:</span>
              <span className="text-purple-400 font-bold">100.0% Traced</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Regression Tests:</span>
              <span className="text-emerald-400 font-bold">12 / 12 PASS</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Replay Latency:</span>
              <span className="text-zinc-300 font-bold">42 ms</span>
            </div>
          </div>
        </div>

      </div>

      {/* QUICK ACCESS ACTION TILES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => onNavigateToTab('silos-demo')}
          className="ios-glass-card p-4 rounded-xl border border-white/10 hover:border-purple-500/50 transition-all cursor-pointer group space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white">Partner Death §1014 Step-Up</span>
            <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-purple-400 transition-colors" />
          </div>
          <p className="text-[11px] text-zinc-400">
            Simulate partner death, outside basis step-up, §754 election, and §755 ordinary/capital allocation.
          </p>
        </div>

        <div 
          onClick={() => onNavigateToTab('tax-engine')}
          className="ios-glass-card p-4 rounded-xl border border-white/10 hover:border-blue-500/50 transition-all cursor-pointer group space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white">§704(c) Ceiling Rule Test</span>
            <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-blue-400 transition-colors" />
          </div>
          <p className="text-[11px] text-zinc-400">
            Compare Traditional, Curative, and Remedial methods with interactive depreciation sliders.
          </p>
        </div>

        <div 
          onClick={() => onNavigateToTab('tax-lots')}
          className="ios-glass-card p-4 rounded-xl border border-white/10 hover:border-cyan-500/50 transition-all cursor-pointer group space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white">Schedule M-3 Book/Tax Bridge</span>
            <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-cyan-400 transition-colors" />
          </div>
          <p className="text-[11px] text-zinc-400">
            Reconcile $14.5M book income to $16.18M taxable income with clickable statutory derivations.
          </p>
        </div>

        <div 
          onClick={() => onNavigateToTab('tinyfish-research')}
          className="ios-glass-card p-4 rounded-xl border border-white/10 hover:border-emerald-500/50 transition-all cursor-pointer group space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white">TinyFish Research Diagnostics</span>
            <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-emerald-400 transition-colors" />
          </div>
          <p className="text-[11px] text-zinc-400">
            Query IRC provisions, test TinyFish browser agent connectivity, and promote candidate rules.
          </p>
        </div>
      </div>

    </div>
  );
};
