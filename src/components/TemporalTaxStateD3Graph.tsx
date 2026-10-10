/**
 * D3-Based Interactive Visualization for Temporal Tax State-Transitions
 * S_{t+1} = delta(S_t, e_t, rho_t)
 * Supports dynamic state transitions, live parameter updates, DAG network view,
 * and partner capital trajectory curves.
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { InvestmentTaxState, TaxEvent } from '../types/tax-state';
import { 
  GitBranch, 
  TrendingUp, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Layers, 
  Info,
  Maximize2,
  Sparkles,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

interface TemporalTaxStateD3GraphProps {
  states: InvestmentTaxState[];
  events: TaxEvent[];
  activeStepIndex: number;
  onSelectStep: (stepIndex: number) => void;
  fundName: string;
  isModified?: boolean;
}

export const TemporalTaxStateD3Graph: React.FC<TemporalTaxStateD3GraphProps> = ({
  states,
  events,
  activeStepIndex,
  onSelectStep,
  fundName,
  isModified = false
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [viewMode, setViewMode] = useState<'dag' | 'trajectories'>('dag');
  const [hoveredNode, setHoveredNode] = useState<{ index: number; state: InvestmentTaxState; x: number; y: number } | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<{ fromIndex: number; event: TaxEvent; x: number; y: number } | null>(null);

  // Zoom transform state
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  // D3 Rendering effect
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 960;
    const height = 420;

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`);

    // Clear previous drawing
    svg.selectAll('*').remove();

    // Define defs for markers, gradients, and filters
    const defs = svg.append('defs');

    // Arrow markers for transitions
    defs.append('marker')
      .attr('id', 'arrow-closed')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 8)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#10b981');

    defs.append('marker')
      .attr('id', 'arrow-review')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 8)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#f59e0b');

    defs.append('marker')
      .attr('id', 'arrow-stepup')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 8)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#8b5cf6');

    // Drop shadow filter for active nodes
    const filter = defs.append('filter')
      .attr('id', 'glow')
      .attr('x', '-20%')
      .attr('y', '-20%')
      .attr('width', '140%')
      .attr('height', '140%');
    filter.append('feGaussianBlur')
      .attr('stdDeviation', '4')
      .attr('result', 'blur');
    filter.append('feComposite')
      .attr('in', 'SourceGraphic')
      .attr('in2', 'blur')
      .attr('operator', 'over');

    // Create main zoomable group
    const g = svg.append('g').attr('class', 'main-stage');

    // Configure zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 2.5])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);
    zoomBehaviorRef.current = zoom;

    if (viewMode === 'dag') {
      renderDagView(g, width, height);
    } else {
      renderTrajectoriesView(g, width, height);
    }

  }, [states, events, activeStepIndex, viewMode, isModified]);

  // Handler for DAG View
  const renderDagView = (
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    width: number,
    height: number
  ) => {
    const nodeCount = states.length;
    const nodeWidth = 150;
    const nodeHeight = 110;
    const spacingX = Math.max(220, (width - 120) / Math.max(1, nodeCount - 1));
    const startX = 70;
    const centerY = height / 2 - 20;

    // Calculate node coordinates
    const nodes = states.map((state, i) => {
      const offsetY = nodeCount > 4 ? Math.sin((i / (nodeCount - 1)) * Math.PI) * 25 : 0;
      const event = i > 0 ? events[i - 1] : null;
      return {
        index: i,
        state,
        x: startX + i * spacingX,
        y: centerY + offsetY,
        isActive: i === activeStepIndex,
        isClosed: i === 0 || (event?.boundaryStatus === 'Closed'),
        has743b: state.A.section743bAdjustments.length > 0,
        has704c: state.A.section704cLayers.length > 0
      };
    });

    // Draw Transition Edges
    for (let i = 0; i < nodes.length - 1; i++) {
      const source = nodes[i];
      const target = nodes[i + 1];
      const event = events[i];
      const boundaryStatus = event?.boundaryStatus || 'Closed';
      const domain = event?.relevantDomain || '§704(b)';

      const strokeColor = 
        boundaryStatus === 'Review' ? '#f59e0b' :
        domain === '§743(b)' ? '#8b5cf6' :
        '#10b981';

      const markerId = 
        boundaryStatus === 'Review' ? 'url(#arrow-review)' :
        domain === '§743(b)' ? 'url(#arrow-stepup)' :
        'url(#arrow-closed)';

      const midX = (source.x + target.x) / 2;
      const midY = (source.y + target.y) / 2;
      const curvature = 28;

      const pathData = `M ${source.x + nodeWidth / 2} ${source.y + nodeHeight / 2}
                        C ${source.x + nodeWidth / 2 + curvature} ${source.y + nodeHeight / 2},
                          ${target.x - nodeWidth / 2 - curvature} ${target.y + nodeHeight / 2},
                          ${target.x - nodeWidth / 2} ${target.y + nodeHeight / 2}`;

      // Transition background glow path
      g.append('path')
        .attr('d', pathData)
        .attr('fill', 'none')
        .attr('stroke', strokeColor)
        .attr('stroke-width', 4)
        .attr('stroke-opacity', 0.15);

      // Main transition path
      const edgePath = g.append('path')
        .attr('d', pathData)
        .attr('fill', 'none')
        .attr('stroke', strokeColor)
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', boundaryStatus === 'Review' ? '5,4' : 'none')
        .attr('marker-end', markerId);

      // Animated particle indicator on edge if active step
      if (i === activeStepIndex - 1) {
        const pulse = g.append('circle')
          .attr('r', 4.5)
          .attr('fill', strokeColor)
          .attr('filter', 'url(#glow)');

        const animateParticle = () => {
          const pathNode = edgePath.node();
          if (!pathNode) return;
          const totalLength = pathNode.getTotalLength();

          pulse.transition()
            .duration(1600)
            .ease(d3.easeLinear)
            .attrTween('transform', () => {
              return (t: number) => {
                const point = pathNode.getPointAtLength(t * totalLength);
                return `translate(${point.x},${point.y})`;
              };
            })
            .on('end', animateParticle);
        };
        animateParticle();
      }

      // Edge badge button (Event pill)
      const edgeGroup = g.append('g')
        .attr('transform', `translate(${midX}, ${midY})`)
        .style('cursor', 'pointer')
        .on('click', () => onSelectStep(i + 1))
        .on('mouseenter', (e) => {
          setHoveredEdge({
            fromIndex: i,
            event,
            x: e.clientX,
            y: e.clientY
          });
        })
        .on('mouseleave', () => setHoveredEdge(null));

      edgeGroup.append('rect')
        .attr('x', -55)
        .attr('y', -14)
        .attr('width', 110)
        .attr('height', 28)
        .attr('rx', 14)
        .attr('fill', '#090d16')
        .attr('stroke', strokeColor)
        .attr('stroke-width', 1.5);

      edgeGroup.append('text')
        .attr('text-anchor', 'middle')
        .attr('y', -1)
        .attr('font-size', '10px')
        .attr('font-weight', '600')
        .attr('fill', '#ffffff')
        .text(event ? (event.type.length > 14 ? event.type.substring(0, 12) + '..' : event.type) : `e_${i}`);

      edgeGroup.append('text')
        .attr('text-anchor', 'middle')
        .attr('y', 9)
        .attr('font-size', '8.5px')
        .attr('font-family', 'monospace')
        .attr('fill', strokeColor)
        .text(domain);
    }

    // Draw State Nodes
    nodes.forEach((n) => {
      const nodeG = g.append('g')
        .attr('transform', `translate(${n.x - nodeWidth / 2}, ${n.y})`)
        .style('cursor', 'pointer')
        .on('click', () => onSelectStep(n.index))
        .on('mouseenter', (e) => {
          setHoveredNode({
            index: n.index,
            state: n.state,
            x: e.clientX,
            y: e.clientY
          });
        })
        .on('mouseleave', () => setHoveredNode(null));

      const isSelected = n.isActive;
      const borderColor = isSelected 
        ? '#10b981' 
        : n.isClosed ? '#334155' : '#f59e0b';
      const bgColor = isSelected ? '#0d1d27' : '#0c1322';

      if (isSelected) {
        nodeG.append('rect')
          .attr('width', nodeWidth + 6)
          .attr('height', nodeHeight + 6)
          .attr('x', -3)
          .attr('y', -3)
          .attr('rx', 14)
          .attr('fill', 'none')
          .attr('stroke', '#10b981')
          .attr('stroke-width', 2)
          .attr('stroke-opacity', 0.6)
          .attr('filter', 'url(#glow)');
      }

      nodeG.append('rect')
        .attr('width', nodeWidth)
        .attr('height', nodeHeight)
        .attr('rx', 12)
        .attr('fill', bgColor)
        .attr('stroke', borderColor)
        .attr('stroke-width', isSelected ? 2 : 1.2);

      nodeG.append('rect')
        .attr('width', nodeWidth)
        .attr('height', 28)
        .attr('rx', 12)
        .attr('fill', isSelected ? '#064e3b' : '#141e33');

      nodeG.append('rect')
        .attr('y', 16)
        .attr('width', nodeWidth)
        .attr('height', 12)
        .attr('fill', isSelected ? '#064e3b' : '#141e33');

      nodeG.append('text')
        .attr('x', 10)
        .attr('y', 18)
        .attr('font-size', '12px')
        .attr('font-weight', '700')
        .attr('font-family', 'monospace')
        .attr('fill', isSelected ? '#34d399' : '#f8fafc')
        .text(`S_${n.index}`);

      nodeG.append('text')
        .attr('x', nodeWidth - 10)
        .attr('y', 18)
        .attr('text-anchor', 'end')
        .attr('font-size', '9.5px')
        .attr('font-family', 'monospace')
        .attr('fill', '#94a3b8')
        .text(n.state.timestamp.validDate);

      // Metric 1: Total Economic Assets
      nodeG.append('text')
        .attr('x', 10)
        .attr('y', 46)
        .attr('font-size', '9px')
        .attr('fill', '#64748b')
        .text('Capital (X_t):');

      nodeG.append('text')
        .attr('x', nodeWidth - 10)
        .attr('y', 46)
        .attr('text-anchor', 'end')
        .attr('font-size', '10.5px')
        .attr('font-weight', '600')
        .attr('font-family', 'monospace')
        .attr('fill', '#f1f5f9')
        .text(`$${(n.state.X.totalEconomicCapital / 1000000).toFixed(1)}M`);

      // Metric 2: Inside Tax Basis
      const totalInsideBasis = n.state.X.assets.reduce((sum, p) => sum + p.taxBasis, 0);
      nodeG.append('text')
        .attr('x', 10)
        .attr('y', 64)
        .attr('font-size', '9px')
        .attr('fill', '#64748b')
        .text('Tax Basis (A_t):');

      nodeG.append('text')
        .attr('x', nodeWidth - 10)
        .attr('y', 64)
        .attr('text-anchor', 'end')
        .attr('font-size', '10.5px')
        .attr('font-weight', '600')
        .attr('font-family', 'monospace')
        .attr('fill', '#38bdf8')
        .text(`$${(totalInsideBasis / 1000000).toFixed(1)}M`);

      // Metric 3: Section 743(b) Step-up or 704(c) Layer
      const stepUpSum = n.state.A.section743bAdjustments.reduce((sum, adj) => sum + adj.totalAdjustment, 0);
      const builtInGainSum = n.state.A.section704cLayers.reduce((sum, l) => sum + l.remainingBuiltInGainLoss, 0);

      nodeG.append('text')
        .attr('x', 10)
        .attr('y', 82)
        .attr('font-size', '9px')
        .attr('fill', '#64748b')
        .text(stepUpSum > 0 ? '§743(b) Step-Up:' : '§704(c) Gain:');

      nodeG.append('text')
        .attr('x', nodeWidth - 10)
        .attr('y', 82)
        .attr('text-anchor', 'end')
        .attr('font-size', '10px')
        .attr('font-family', 'monospace')
        .attr('font-weight', '600')
        .attr('fill', stepUpSum > 0 ? '#a78bfa' : builtInGainSum > 0 ? '#fbbf24' : '#64748b')
        .text(stepUpSum > 0 ? `+$${(stepUpSum / 1000000).toFixed(1)}M` : builtInGainSum > 0 ? `$${(builtInGainSum / 1000000).toFixed(1)}M` : '$0M');

      const footerBar = nodeG.append('g').attr('transform', `translate(0, ${nodeHeight - 18})`);

      footerBar.append('line')
        .attr('x1', 8)
        .attr('x2', nodeWidth - 8)
        .attr('y1', 0)
        .attr('y2', 0)
        .attr('stroke', '#1e293b');

      const allInvariantsPass = n.state.invariantBreakdown.partitionInvariant && n.state.invariantBreakdown.balanceSheetInvariant;
      footerBar.append('circle')
        .attr('cx', 16)
        .attr('cy', 9)
        .attr('r', 3.5)
        .attr('fill', allInvariantsPass ? '#10b981' : '#f43f5e');

      footerBar.append('text')
        .attr('x', 24)
        .attr('y', 12)
        .attr('font-size', '8.5px')
        .attr('fill', allInvariantsPass ? '#34d399' : '#fb7185')
        .text(allInvariantsPass ? 'Invariants ✓' : 'Disparity');

      footerBar.append('text')
        .attr('x', nodeWidth - 10)
        .attr('y', 12)
        .attr('text-anchor', 'end')
        .attr('font-size', '8.5px')
        .attr('font-weight', '600')
        .attr('fill', n.isClosed ? '#10b981' : '#fbbf24')
        .text(n.isClosed ? 'Closed' : 'Review');
    });
  };

  // Handler for Partner Trajectories Mode
  const renderTrajectoriesView = (
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    width: number,
    height: number
  ) => {
    const margin = { top: 30, right: 140, bottom: 45, left: 60 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const chartG = g.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    const allPartners = Array.from(new Set(
      states.flatMap(s => s.A.partnerAccounts.map(p => p.partnerName))
    ));

    const colorScale = d3.scaleOrdinal<string>()
      .domain(allPartners)
      .range(['#10b981', '#38bdf8', '#a855f7', '#f59e0b', '#ec4899', '#6366f1']);

    const maxVal = d3.max(
      states.flatMap(s => s.A.partnerAccounts.map(p => Math.max(p.bookCapital704b, p.outsideTaxBasis)))
    ) || 100000000;

    const xScale = d3.scaleLinear()
      .domain([0, states.length - 1])
      .range([0, chartWidth]);

    const yScale = d3.scaleLinear()
      .domain([0, maxVal * 1.1])
      .range([chartHeight, 0]);

    const yAxis = d3.axisLeft(yScale)
      .ticks(5)
      .tickFormat(d => `$${(+d / 1000000).toFixed(0)}M`);

    chartG.append('g')
      .attr('class', 'y-axis')
      .call(yAxis)
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick line')
        .attr('stroke', '#1e293b')
        .attr('x2', chartWidth))
      .call(g => g.selectAll('.tick text')
        .attr('fill', '#94a3b8')
        .attr('font-size', '10px')
        .attr('font-family', 'monospace'));

    const xAxis = d3.axisBottom(xScale)
      .ticks(states.length)
      .tickFormat(d => `S_${d}`);

    chartG.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${chartHeight})`)
      .call(xAxis)
      .call(g => g.select('.domain').attr('stroke', '#334155'))
      .call(g => g.selectAll('.tick line').attr('stroke', '#334155'))
      .call(g => g.selectAll('.tick text')
        .attr('fill', '#cbd5e1')
        .attr('font-size', '11px')
        .attr('font-weight', '600')
        .attr('font-family', 'monospace'));

    chartG.append('line')
      .attr('x1', xScale(activeStepIndex))
      .attr('x2', xScale(activeStepIndex))
      .attr('y1', 0)
      .attr('y2', chartHeight)
      .attr('stroke', '#10b981')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '4,3')
      .attr('stroke-opacity', 0.8);

    allPartners.forEach(partnerName => {
      const partnerData = states.map((s, stepIdx) => {
        const acc = s.A.partnerAccounts.find(p => p.partnerName === partnerName);
        return {
          step: stepIdx,
          book704b: acc ? acc.bookCapital704b : 0,
          outsideBasis: acc ? acc.outsideTaxBasis : 0,
          stepUp: acc?.section743bAdjustment || 0
        };
      });

      const partnerColor = colorScale(partnerName);

      const bookLine = d3.line<{ step: number; book704b: number }>()
        .x(d => xScale(d.step))
        .y(d => yScale(d.book704b))
        .curve(d3.curveMonotoneX);

      chartG.append('path')
        .datum(partnerData)
        .attr('fill', 'none')
        .attr('stroke', partnerColor)
        .attr('stroke-width', 2.5)
        .attr('d', bookLine);

      const basisLine = d3.line<{ step: number; outsideBasis: number }>()
        .x(d => xScale(d.step))
        .y(d => yScale(d.outsideBasis))
        .curve(d3.curveMonotoneX);

      chartG.append('path')
        .datum(partnerData)
        .attr('fill', 'none')
        .attr('stroke', partnerColor)
        .attr('stroke-width', 1.8)
        .attr('stroke-dasharray', '5,3')
        .attr('stroke-opacity', 0.75)
        .attr('d', basisLine);

      partnerData.forEach(d => {
        chartG.append('circle')
          .attr('cx', xScale(d.step))
          .attr('cy', yScale(d.book704b))
          .attr('r', d.step === activeStepIndex ? 5 : 3.5)
          .attr('fill', partnerColor)
          .attr('stroke', '#0b101b')
          .attr('stroke-width', 1.5)
          .style('cursor', 'pointer')
          .on('click', () => onSelectStep(d.step));
      });
    });

    const legendG = chartG.append('g')
      .attr('transform', `translate(${chartWidth + 15}, 0)`);

    legendG.append('text')
      .attr('x', 0)
      .attr('y', 5)
      .attr('font-size', '10px')
      .attr('font-weight', '700')
      .attr('fill', '#94a3b8')
      .text('Partner Trajectories:');

    allPartners.forEach((name, idx) => {
      const legItem = legendG.append('g')
        .attr('transform', `translate(0, ${22 + idx * 22})`);

      legItem.append('rect')
        .attr('width', 12)
        .attr('height', 12)
        .attr('rx', 3)
        .attr('fill', colorScale(name));

      legItem.append('text')
        .attr('x', 18)
        .attr('y', 10)
        .attr('font-size', '10px')
        .attr('font-weight', '500')
        .attr('fill', '#e2e8f0')
        .text(name.length > 15 ? name.substring(0, 14) + '..' : name);
    });

    const styleLeg = legendG.append('g')
      .attr('transform', `translate(0, ${28 + allPartners.length * 22})`);

    styleLeg.append('line')
      .attr('x1', 0).attr('x2', 14).attr('y1', 6).attr('y2', 6)
      .attr('stroke', '#94a3b8').attr('stroke-width', 2);
    styleLeg.append('text')
      .attr('x', 18).attr('y', 9)
      .attr('font-size', '9px').attr('fill', '#94a3b8')
      .text('Book §704(b) Capital');

    styleLeg.append('line')
      .attr('x1', 0).attr('x2', 14).attr('y1', 20).attr('y2', 20)
      .attr('stroke', '#94a3b8').attr('stroke-width', 1.5).attr('stroke-dasharray', '4,2');
    styleLeg.append('text')
      .attr('x', 18).attr('y', 23)
      .attr('font-size', '9px').attr('fill', '#94a3b8')
      .text('Outside Basis (Tax)');
  };

  const handleZoomIn = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current).transition().duration(250).call(zoomBehaviorRef.current.scaleBy, 1.25);
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current).transition().duration(250).call(zoomBehaviorRef.current.scaleBy, 0.8);
    }
  };

  const handleResetZoom = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current).transition().duration(300).call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-[#080d19] overflow-hidden shadow-xl space-y-0 relative">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-slate-800 bg-[#0b1222]">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <GitBranch className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white tracking-tight">
                Dynamic Temporal State-Transition System (D3 Engine)
              </span>
              {isModified && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                  Parameters Modified (Recomputed)
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              <span className="text-emerald-400 font-semibold">γ(t) = S_t</span> · {states.length} Discrete States · {events.length} State Transitions
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setViewMode('dag')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors cursor-pointer font-medium ${
                viewMode === 'dag'
                  ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>State DAG</span>
            </button>
            <button
              onClick={() => setViewMode('trajectories')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors cursor-pointer font-medium ${
                viewMode === 'trajectories'
                  ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Partner Curves</span>
            </button>
          </div>

          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs text-slate-400">
            <button
              onClick={handleZoomIn}
              className="p-1 hover:text-white hover:bg-slate-800 rounded cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1 hover:text-white hover:bg-slate-800 rounded cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1 hover:text-white hover:bg-slate-800 rounded cursor-pointer"
              title="Reset View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div ref={containerRef} className="w-full relative bg-[#070b14] overflow-hidden select-none">
        <svg 
          ref={svgRef} 
          className="w-full block" 
          style={{ minHeight: '400px' }}
        />

        <div className="absolute bottom-3 left-4 text-[10px] text-slate-500 font-mono flex items-center gap-2 pointer-events-none">
          <span>Click any state card S_t to inspect · Scroll to zoom / drag to pan</span>
          <span>·</span>
          <span className="text-emerald-500/80">Active Step: S_{activeStepIndex}</span>
        </div>
      </div>

      {hoveredNode && (
        <div 
          className="fixed z-50 p-3 bg-slate-950/95 border border-slate-700 rounded-xl shadow-2xl text-xs space-y-2 pointer-events-none max-w-sm backdrop-blur"
          style={{ 
            left: Math.min(window.innerWidth - 320, hoveredNode.x + 15), 
            top: Math.max(20, hoveredNode.y - 80) 
          }}
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="font-mono font-bold text-emerald-400">State S_{hoveredNode.index} Inspection</span>
            <span className="text-[10px] font-mono text-slate-400">Valid: {hoveredNode.state.timestamp.validDate}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div>
              <span className="text-slate-500 block text-[10px]">Economic Capital (X_t):</span>
              <span className="text-white font-semibold">${(hoveredNode.state.X.totalEconomicCapital / 1000000).toFixed(2)}M</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Cash Reserve:</span>
              <span className="text-slate-200">${(hoveredNode.state.X.cash / 1000000).toFixed(2)}M</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Active Partners:</span>
              <span className="text-cyan-400">{hoveredNode.state.A.partnerAccounts.length} LPs/GPs</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">§754 In Effect:</span>
              <span className={hoveredNode.state.C.section754ElectionActive ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                {hoveredNode.state.C.section754ElectionActive ? 'Yes (Active)' : 'No'}
              </span>
            </div>
          </div>

          <div className="pt-1 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Partition ∑ω = 1.0</span>
            <span className="text-emerald-400">Balance Sheet ✓</span>
          </div>
        </div>
      )}

      {hoveredEdge && (
        <div 
          className="fixed z-50 p-3 bg-slate-950/95 border border-slate-700 rounded-xl shadow-2xl text-xs space-y-1.5 pointer-events-none max-w-xs backdrop-blur"
          style={{ 
            left: Math.min(window.innerWidth - 300, hoveredEdge.x + 15), 
            top: Math.max(20, hoveredEdge.y - 70) 
          }}
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-1">
            <span className="font-mono font-bold text-emerald-400">{hoveredEdge.event.id}</span>
            <span className="font-mono text-[10px] text-slate-300">{hoveredEdge.event.relevantDomain}</span>
          </div>
          <div className="text-white font-medium">{hoveredEdge.event.type}</div>
          <p className="text-[11px] text-slate-300 leading-snug">{hoveredEdge.event.notes}</p>
          <div className="text-[10px] text-slate-500">
            Source: {hoveredEdge.event.evidenceSource.documentTitle}
          </div>
        </div>
      )}
    </div>
  );
};
