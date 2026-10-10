/**
 * Global Temporal Investment Graph Visualizer & Temporal Delta Studio
 * In accordance with Sections 1, 2, 6, 8, 12, 13, 24, 25, 26, 60, 61 of POC1 Extension Specification
 * Renders G_t(V_t, E_t, \Theta_t, \tau_t, \omega_t), handles 14 distinct edge types,
 * provides temporal time slider 2010 - 2026, and Delta View (\Delta G_t, \Delta S_t).
 * 
 * Integrated with StateTransitionLineageD3Graph:
 * Dynamically maps state-transition nodes S_t and edges \delta(S_t, e_t, \rho_t),
 * allowing users to interactively trace tax lineage paths (Investor Tax Output -> Allocations -> 704(c) / 743(b) -> Source Documents).
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { 
  Globe, 
  Calendar, 
  Layers, 
  Filter, 
  Search, 
  Maximize2, 
  Info, 
  ArrowRight, 
  ShieldCheck, 
  Database,
  Sliders,
  CheckCircle2,
  RefreshCw,
  GitCommit,
  MapPin,
  GitBranch,
  Workflow,
  Sparkles,
  Calculator,
  SplitSquareVertical,
  Activity,
  ChevronRight
} from 'lucide-react';
import { 
  MASTER_GLOBAL_NODES, 
  MASTER_GLOBAL_EDGES, 
  reconstructGraphAtYear 
} from '../data/global-investment-graph-data';
import { GlobalNode, GlobalEdge, GlobalNodeType, GlobalEdgeType } from '../types/global-graph';
import { StateTransitionLineageD3Graph } from './StateTransitionLineageD3Graph';

export type SubgraphMode = 'ALL' | 'FUND' | 'TAX' | 'OWNERSHIP' | 'GEOGRAPHY' | 'SECURITY';
export type GlobalGraphPrimaryView = 'ENTITY_GRAPH' | 'STATE_TRANSITION_LINEAGE' | 'DUAL_VIEW';

interface GlobalGraphViewProps {
  onNavigateToMap?: () => void;
}

export const GlobalGraphView: React.FC<GlobalGraphViewProps> = ({ onNavigateToMap }) => {
  const [primaryView, setPrimaryView] = useState<GlobalGraphPrimaryView>('ENTITY_GRAPH');
  const [activeLineagePreset, setActiveLineagePreset] = useState<string>('preset-704c-curative');
  const [selectedYear, setSelectedYear] = useState<number>(2024);
  const [subgraphMode, setSubgraphMode] = useState<SubgraphMode>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('FUND-BREP-IX');
  const [showDeltaView, setShowDeltaView] = useState<boolean>(false);

  // SVG ref for D3 rendering of entity graph
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Reconstruct graph at selected year
  const graphState = useMemo(() => {
    return reconstructGraphAtYear(selectedYear);
  }, [selectedYear]);

  // Reconstruct previous year graph for Delta computation (\Delta G_t)
  const prevGraphState = useMemo(() => {
    return reconstructGraphAtYear(Math.max(2010, selectedYear - 1));
  }, [selectedYear]);

  // Compute Delta \Delta G_t
  const deltaMetrics = useMemo(() => {
    const currentIds = new Set(graphState.nodes.map(n => n.id));
    const prevIds = new Set(prevGraphState.nodes.map(n => n.id));

    const addedNodes = graphState.nodes.filter(n => !prevIds.has(n.id));
    const removedNodes = prevGraphState.nodes.filter(n => !currentIds.has(n.id));

    const currentEdgeIds = new Set(graphState.edges.map(e => e.id));
    const prevEdgeIds = new Set(prevGraphState.edges.map(e => e.id));

    const addedEdges = graphState.edges.filter(e => !prevEdgeIds.has(e.id));
    const removedEdges = prevGraphState.edges.filter(e => !currentEdgeIds.has(e.id));

    return {
      addedNodes,
      removedNodes,
      addedEdges,
      removedEdges
    };
  }, [graphState, prevGraphState]);

  // Filtered nodes and edges based on subgraph mode & search query
  const filteredData = useMemo(() => {
    let nodes = [...graphState.nodes];
    let edges = [...graphState.edges];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      nodes = nodes.filter(n => 
        n.name.toLowerCase().includes(q) || 
        n.legalDomicile.toLowerCase().includes(q) ||
        n.identifiers.lei?.toLowerCase().includes(q) ||
        n.identifiers.cik?.toLowerCase().includes(q)
      );
      const matchedNodeIds = new Set(nodes.map(n => n.id));
      edges = edges.filter(e => matchedNodeIds.has(e.sourceId) || matchedNodeIds.has(e.targetId));
    }

    if (subgraphMode === 'FUND') {
      nodes = nodes.filter(n => ['FUND', 'MASTER_FUND', 'FEEDER_FUND', 'INVESTOR', 'PORTFOLIO_COMPANY'].includes(n.type));
    } else if (subgraphMode === 'TAX') {
      edges = edges.filter(e => ['LP', 'GP', 'InvestsIn_Master', 'LegalOwnership'].includes(e.type));
    } else if (subgraphMode === 'OWNERSHIP') {
      edges = edges.filter(e => ['LegalOwnership', 'EconomicInterest', 'Subsidiary', 'Consolidates'].includes(e.type));
    } else if (subgraphMode === 'SECURITY') {
      nodes = nodes.filter(n => ['SECURITY', 'EXCHANGE', 'PORTFOLIO_COMPANY', 'FUND'].includes(n.type));
    }

    const validNodeIds = new Set(nodes.map(n => n.id));
    edges = edges.filter(e => validNodeIds.has(e.sourceId) && validNodeIds.has(e.targetId));

    return { nodes, edges };
  }, [graphState, subgraphMode, searchQuery]);

  // Selected node details
  const selectedNode = useMemo(() => {
    return graphState.nodes.find(n => n.id === selectedNodeId) || graphState.nodes[0];
  }, [selectedNodeId, graphState]);

  // Connected edges for selected node
  const connectedEdges = useMemo(() => {
    if (!selectedNode) return [];
    return graphState.edges.filter(e => e.sourceId === selectedNode.id || e.targetId === selectedNode.id);
  }, [selectedNode, graphState]);

  // D3 Graph Simulation & Force Layout
  useEffect(() => {
    if (!svgRef.current || primaryView === 'STATE_TRANSITION_LINEAGE') return;

    const width = 760;
    const height = 480;

    const svg = d3.select(svgRef.current)
      .attr('width', '100%')
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`);

    svg.selectAll('*').remove();

    // Container for zoom/pan
    const container = svg.append('g');

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.4, 3.0])
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
      });

    svg.call(zoom as any);

    // Node colors by type (iOS inspired palette)
    const colorMap: Record<GlobalNodeType, string> = {
      FUND: '#0A84FF',             // iOS Blue
      MASTER_FUND: '#5E5CE6',      // iOS Indigo
      FEEDER_FUND: '#BF5AF2',      // iOS Purple
      INVESTOR: '#30D158',         // iOS Green
      INVESTMENT_ADVISER: '#64D2FF',// iOS Cyan
      GENERAL_PARTNER: '#FF9F0A',  // iOS Orange
      PORTFOLIO_COMPANY: '#FF375F',// iOS Pink
      SECURITY: '#FFD60A',         // iOS Yellow
      ASSET: '#FF453A',            // iOS Red
      SUBSIDIARY: '#AC8E68',       // iOS Brown
      SPV: '#E5E5EA',              // iOS Light Gray
      FUND_OF_FUNDS: '#5E5CE6',
      EXCHANGE: '#63E6E2',
      JURISDICTION: '#7D7AFF',
      ADMINISTRATOR: '#98989D'
    };

    // Prepare links and nodes data clones for D3 simulation
    const simNodes = filteredData.nodes.map(n => ({ ...n }));
    const simLinks = filteredData.edges.map(e => ({
      ...e,
      source: e.sourceId,
      target: e.targetId
    }));

    const simulation = d3.forceSimulation(simNodes as any)
      .force('link', d3.forceLink(simLinks).id((d: any) => d.id).distance(90))
      .force('charge', d3.forceManyBody().strength(-280))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(28));

    // Render Edges
    const link = container.append('g')
      .selectAll('line')
      .data(simLinks)
      .enter()
      .append('line')
      .attr('stroke', (d: any) => (d.sourceId === selectedNodeId || d.targetId === selectedNodeId ? '#0A84FF' : 'rgba(255, 255, 255, 0.15)'))
      .attr('stroke-width', (d: any) => (d.sourceId === selectedNodeId || d.targetId === selectedNodeId ? 2.5 : 1.2))
      .attr('stroke-dasharray', (d: any) => (d.isDerived ? '4,4' : 'none'));

    // Render Nodes
    const node = container.append('g')
      .selectAll('g')
      .data(simNodes)
      .enter()
      .append('g')
      .style('cursor', 'pointer')
      .on('click', (_event, d: any) => {
        setSelectedNodeId(d.id);
      });

    // Outer glow for selected node
    node.append('circle')
      .attr('r', (d: any) => (d.id === selectedNodeId ? 22 : 16))
      .attr('fill', (d: any) => colorMap[d.type as GlobalNodeType] || '#0A84FF')
      .attr('fill-opacity', 0.25)
      .attr('stroke', (d: any) => (d.id === selectedNodeId ? '#ffffff' : colorMap[d.type as GlobalNodeType] || '#0A84FF'))
      .attr('stroke-width', (d: any) => (d.id === selectedNodeId ? 2.5 : 1.5));

    // Inner Core
    node.append('circle')
      .attr('r', (d: any) => (d.id === selectedNodeId ? 10 : 7))
      .attr('fill', (d: any) => colorMap[d.type as GlobalNodeType] || '#0A84FF');

    // Label Text
    node.append('text')
      .attr('y', 25)
      .attr('text-anchor', 'middle')
      .attr('font-size', '9.5px')
      .attr('font-family', '-apple-system, BlinkMacSystemFont, "SF Pro Text"')
      .attr('font-weight', (d: any) => (d.id === selectedNodeId ? '700' : '500'))
      .attr('fill', (d: any) => (d.id === selectedNodeId ? '#ffffff' : '#cbd5e1'))
      .text((d: any) => d.name.length > 16 ? d.name.slice(0, 14) + '…' : d.name);

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x}, ${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [filteredData, selectedNodeId, primaryView]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8 animate-fadeIn">
      {/* iOS Header Banner */}
      <div className="ios-glass-card rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30 mb-2">
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              <span>POC1 Global Extension Specification</span>
              <span>·</span>
              <span className="font-mono">G_t(V, E, Θ, τ, ω) &amp; S_(t+1) = δ(S_t, e_t, ρ_t)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Global Temporal Investment Graph Studio
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Maps multi-jurisdiction ownership, master-feeder structures, and integrates dynamic D3 state-transition lineage tracing to recursively connect investor tax outputs back to source filings.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onNavigateToMap && (
              <button
                onClick={onNavigateToMap}
                className="px-4 py-2 rounded-2xl text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition-all flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span>Switch to Real-World Map</span>
              </button>
            )}
            <button
              onClick={() => setShowDeltaView(!showDeltaView)}
              className={`px-4 py-2 rounded-2xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                showDeltaView
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'ios-glass text-slate-300 hover:text-white'
              }`}
            >
              <GitCommit className="w-4 h-4" />
              <span>{showDeltaView ? 'Hide Delta View' : 'Show Delta (ΔG_t)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary View Mode Switcher: Entity Network vs State-Transition Lineage vs Dual View */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-2 rounded-2xl bg-white/5 border border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider pl-2 flex items-center gap-1.5">
            <Workflow className="w-4 h-4 text-emerald-400" />
            <span>Graph View Mode:</span>
          </span>
          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setPrimaryView('ENTITY_GRAPH')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                primaryView === 'ENTITY_GRAPH'
                  ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Global Entity Network (G_t)</span>
            </button>

            <button
              onClick={() => setPrimaryView('STATE_TRANSITION_LINEAGE')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                primaryView === 'STATE_TRANSITION_LINEAGE'
                  ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-500/20'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>State-Transition &amp; Tax Lineage Tracer</span>
              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-black/30 text-emerald-200">D3</span>
            </button>

            <button
              onClick={() => setPrimaryView('DUAL_VIEW')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                primaryView === 'DUAL_VIEW'
                  ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-500/20'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <SplitSquareVertical className="w-3.5 h-3.5" />
              <span>Dual Split View</span>
            </button>
          </div>
        </div>

        {/* Quick Helper Badge */}
        <div className="text-[11px] font-mono text-zinc-400 pr-2 hidden md:block">
          {primaryView === 'ENTITY_GRAPH' && 'Viewing multi-jurisdiction entity structure & ownership relations'}
          {primaryView === 'STATE_TRANSITION_LINEAGE' && 'Interactive D3 tax lineage: trace K-1 outputs backwards to Genesis S_0'}
          {primaryView === 'DUAL_VIEW' && 'Dual View: Macro Entity Topology ↔ Microscopic State-Transition Lineage'}
        </div>
      </div>

      {/* VIEW MODE 1: STATE-TRANSITION LINEAGE ONLY */}
      {primaryView === 'STATE_TRANSITION_LINEAGE' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                <GitBranch className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Dynamic State-Transition Lineage Graph</h2>
                <p className="text-xs text-zinc-300">
                  Interactive mathematical graph mapping discrete state transitions <span className="font-mono text-emerald-300">S_(t+1) = δ(S_t, e_t, ρ_t)</span>, 
                  recursively traversing ancestor inputs and statutory authorities.
                </p>
              </div>
            </div>
            <button
              onClick={() => setPrimaryView('ENTITY_GRAPH')}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition-all cursor-pointer"
            >
              Back to Entity Graph
            </button>
          </div>

          <StateTransitionLineageD3Graph initialPresetId={activeLineagePreset} />
        </div>
      )}

      {/* VIEW MODE 2: DUAL VIEW (SPLIT: STATE-TRANSITION LINEAGE & ENTITY GRAPH) */}
      {primaryView === 'DUAL_VIEW' && (
        <div className="space-y-8">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  State-Transition &amp; Tax Lineage Tracer (Microscopic Path)
                </h3>
              </div>
              <span className="text-xs font-mono text-emerald-400">
                Step-by-Step Mathematical Provenance
              </span>
            </div>
            <StateTransitionLineageD3Graph initialPresetId={activeLineagePreset} />
          </div>

          <div className="space-y-3 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Global Multi-Entity Network G_t (Macroscopic Topology)
                </h3>
              </div>
              <span className="text-xs font-mono text-blue-400">
                Year: {selectedYear} · {graphState.nodes.length} Entities
              </span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 3 (OR LOWER SECTION OF DUAL VIEW): GLOBAL ENTITY GRAPH CANVAS */}
      {(primaryView === 'ENTITY_GRAPH' || primaryView === 'DUAL_VIEW') && (
        <>
          {/* Temporal Slider Bar (2010 to 2026) - Section 25 */}
          <div className="ios-glass rounded-3xl p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Section 25: Temporal Time Slider
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 font-mono">State Timestamp:</span>
                <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Year {selectedYear}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-400 font-mono">2010</span>
              <input
                type="range"
                min="2010"
                max="2026"
                step="1"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="flex-1 accent-blue-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />
              <span className="text-xs text-slate-400 font-mono">2026</span>
            </div>
          </div>

          {/* Temporal Delta View (\Delta G_t, \Delta S_t) - Section 25 */}
          {showDeltaView && (
            <div className="ios-glass-card rounded-3xl p-6 space-y-4 animate-fadeIn border border-blue-500/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GitCommit className="w-4 h-4 text-blue-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Temporal Delta Studio: Year {selectedYear - 1} → {selectedYear}
                  </h3>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40">
                    ΔG_t = (ΔV, ΔE)
                  </span>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  Changes Observed Year-over-Year
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="ios-glass-subtle rounded-2xl p-3.5 space-y-1">
                  <span className="text-slate-400 text-[10px] font-mono uppercase">Added Entities (+ΔV)</span>
                  <div className="text-lg font-bold font-mono text-emerald-400">
                    +{deltaMetrics.addedNodes.length}
                  </div>
                  <div className="text-[11px] text-slate-300 truncate">
                    {deltaMetrics.addedNodes.map(n => n.name).join(', ') || 'No new entities'}
                  </div>
                </div>

                <div className="ios-glass-subtle rounded-2xl p-3.5 space-y-1">
                  <span className="text-slate-400 text-[10px] font-mono uppercase">New Relationships (+ΔE)</span>
                  <div className="text-lg font-bold font-mono text-blue-400">
                    +{deltaMetrics.addedEdges.length}
                  </div>
                  <div className="text-[11px] text-slate-300 truncate">
                    {deltaMetrics.addedEdges.map(e => e.type).join(', ') || 'No relationship changes'}
                  </div>
                </div>

                <div className="ios-glass-subtle rounded-2xl p-3.5 space-y-1">
                  <span className="text-slate-400 text-[10px] font-mono uppercase">Net Node Population</span>
                  <div className="text-lg font-bold font-mono text-white">
                    {graphState.nodes.length} Active Nodes
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Active in {selectedYear}
                  </div>
                </div>

                <div className="ios-glass-subtle rounded-2xl p-3.5 space-y-1">
                  <span className="text-slate-400 text-[10px] font-mono uppercase">Average Degree (d̄)</span>
                  <div className="text-lg font-bold font-mono text-purple-300">
                    {graphState.metrics.averageDegree}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Branching Factor: {graphState.metrics.branchingFactor}x
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Subgraph Controls & Search Filters (Section 24) */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* iOS Segmented Control Tabs */}
            <div className="ios-segmented-control flex items-center overflow-x-auto text-xs">
              {[
                { id: 'ALL', label: 'All Subgraphs' },
                { id: 'FUND', label: 'Fund Network' },
                { id: 'TAX', label: 'Tax Attribute Subgraph' },
                { id: 'OWNERSHIP', label: 'Legal Ownership' },
                { id: 'SECURITY', label: 'Exchanges & Holdings' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSubgraphMode(tab.id as SubgraphMode)}
                  className={`px-3.5 py-1.5 rounded-full font-medium whitespace-nowrap transition-all cursor-pointer ${
                    subgraphMode === tab.id ? 'ios-segmented-button-active' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative min-w-[260px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search entity, LEI, CIK, jurisdiction..."
                className="w-full ios-glass-subtle text-xs text-white pl-9 pr-4 py-2 rounded-2xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          </div>

          {/* Main Graph Canvas & Inspector Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Graph Canvas (8 cols) */}
            <div className="lg:col-span-8 ios-glass-card rounded-3xl p-5 space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Interactive Force-Directed Layout
                  </span>
                </div>
                <div className="text-xs font-mono text-slate-400">
                  {filteredData.nodes.length} Nodes · {filteredData.edges.length} Edges
                </div>
              </div>

              <div className="bg-[#050814]/80 rounded-2xl border border-white/5 flex items-center justify-center overflow-hidden">
                <svg ref={svgRef} className="w-full block" />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>Click any node to inspect entity metadata and connected multi-hop relations.</span>
                <span>Zoom &amp; Pan enabled</span>
              </div>
            </div>

            {/* Node Inspector Sidecar (4 cols) */}
            <div className="lg:col-span-4 space-y-5">
              {selectedNode ? (
                <div className="ios-glass-card rounded-3xl p-6 space-y-5">
                  <div className="border-b border-white/10 pb-3">
                    <span className="text-[10px] font-mono uppercase text-blue-400 font-bold block">
                      {selectedNode.type}
                    </span>
                    <h3 className="text-base font-bold text-white mt-0.5">
                      {selectedNode.name}
                    </h3>
                    <div className="text-xs text-slate-300 font-mono mt-1">
                      Jurisdiction: <span className="text-blue-300 font-bold">{selectedNode.legalDomicile}</span> (Tax Residence: {selectedNode.taxResidence})
                    </div>
                  </div>

                  {/* Interactive Tax Lineage Path Launcher for this Entity */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-blue-500/15 border border-emerald-500/30 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <GitBranch className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Interactive Tax Lineage</span>
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                        D3 TRACER
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-300 leading-snug">
                      Trace state-transition steps <span className="font-mono text-emerald-300">S_(t+1) = δ(S_t, e_t, ρ_t)</span>, §704(c) layers, and Schedule K-1 lineage for this entity.
                    </p>
                    <button
                      onClick={() => {
                        if (selectedNode.id.includes('BREP') || selectedNode.id.includes('CALPERS') || selectedNode.id.includes('BLACKSTONE')) {
                          setActiveLineagePreset('preset-704c-curative');
                        } else if (selectedNode.id.includes('BRIDGEWATER') || selectedNode.id.includes('GIC') || selectedNode.id.includes('ADIA')) {
                          setActiveLineagePreset('preset-743b-stepup');
                        } else {
                          setActiveLineagePreset('preset-crossborder-treaty');
                        }
                        setPrimaryView('STATE_TRANSITION_LINEAGE');
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/20"
                    >
                      <Workflow className="w-3.5 h-3.5" />
                      <span>Trace Tax Lineage Path</span>
                    </button>
                  </div>

                  {/* Standardized Identifiers (Section 3) */}
                  <div className="space-y-2 text-xs font-mono">
                    <span className="text-[10px] uppercase text-slate-400 block font-semibold">
                      Section 3: Standardized Identifiers
                    </span>
                    <div className="p-3 rounded-2xl ios-glass-subtle space-y-1.5">
                      {selectedNode.identifiers.lei && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">LEI (GLEIF):</span>
                          <span className="text-white select-all">{selectedNode.identifiers.lei}</span>
                        </div>
                      )}
                      {selectedNode.identifiers.cik && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">SEC CIK:</span>
                          <span className="text-blue-300 select-all">{selectedNode.identifiers.cik}</span>
                        </div>
                      )}
                      {selectedNode.identifiers.ticker && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Exchange Ticker:</span>
                          <span className="text-emerald-400 font-bold">{selectedNode.identifiers.ticker}</span>
                        </div>
                      )}
                      {selectedNode.identifiers.isin && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">ISIN:</span>
                          <span className="text-slate-200">{selectedNode.identifiers.isin}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Connected Relationships */}
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase text-slate-400 block font-semibold">
                      Connected Relationships ({connectedEdges.length})
                    </span>
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 text-xs">
                      {connectedEdges.map(edge => {
                        const isOutgoing = edge.sourceId === selectedNode.id;
                        const otherNode = graphState.nodes.find(n => n.id === (isOutgoing ? edge.targetId : edge.sourceId));

                        return (
                          <div key={edge.id} className="p-2.5 rounded-xl ios-glass-subtle border border-white/5 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-blue-300 font-bold text-[11px]">
                                {edge.type}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400">
                                {edge.weight ? `${(edge.weight * 100).toFixed(1)}%` : 'Active'}
                              </span>
                            </div>
                            <div className="text-slate-200 font-medium truncate">
                              {isOutgoing ? `→ ${otherNode?.name}` : `← ${otherNode?.name}`}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Evidence: {edge.sourceEvidence.sourceName} ({edge.sourceEvidence.documentType})
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              ) : (
                <div className="ios-glass-card rounded-3xl p-8 text-center text-slate-400">
                  Select a node in the graph to view properties.
                </div>
              )}
            </div>

          </div>
        </>
      )}
    </div>
  );
};
