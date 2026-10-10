/**
 * POC 1 — Dedicated Audit & Calculation Lineage Explorer
 *
 * Implements Section 26, 27, 28 of POC 1 Specification:
 * - Click any final tax number (e.g. Taxable Income $16,180,000) to inspect its full lineage DAG:
 *   Output -> Adjustments (§704(c), §743(b), §163(j)) -> Events -> Source Documents -> Rules
 */

import React, { useState } from 'react';
import {
  GitBranch,
  ArrowRight,
  ArrowDown,
  CheckCircle2,
  FileText,
  Calculator,
  ShieldCheck,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { MathView } from './MathView';

interface LineageNode {
  id: string;
  label: string;
  value: string;
  category: 'OUTPUT' | 'ADJUSTMENT' | 'EVENT' | 'RULE' | 'DOCUMENT';
  details: string;
  sourceDoc?: string;
  ruleCode?: string;
  children?: LineageNode[];
}

const LINEAGE_TREES: Record<string, LineageNode> = {
  'TAXABLE_INCOME': {
    id: 'NODE-TAXABLE-INCOME',
    label: 'Master Fund Taxable Income',
    value: '$16,180,000',
    category: 'OUTPUT',
    details: 'Form 1065 Line 22 / Schedule K Line 1 Total Ordinary Business Income',
    ruleCode: 'IRC § 702 & § 703',
    children: [
      {
        id: 'NODE-BOOK-INCOME',
        label: 'GAAP Financial Net Income',
        value: '$14,500,000',
        category: 'OUTPUT',
        details: 'Financial audit statement before Federal tax modifications',
        sourceDoc: 'PwC Audited Financial Statements FY2023',
        children: []
      },
      {
        id: 'NODE-704C-ADJ',
        label: 'Section 704(c) Built-In Gain Amortization',
        value: '+$1,800,000',
        category: 'ADJUSTMENT',
        details: 'Reverse built-in gain amortization on contributed warehouse',
        ruleCode: 'IRC § 704(c) & Treas. Reg. § 1.704-3',
        sourceDoc: 'Contribution Agreement Exhibit B',
        children: [
          {
            id: 'NODE-EVENT-704C',
            label: 'Event #7: Property Contribution',
            value: '$30.0M Book vs $12.0M Tax',
            category: 'EVENT',
            details: 'Dallas fulfillment hub contributed by Partner A with $18M disparity',
            sourceDoc: 'Warranty Deed & Form 1065 Schedule M-3',
            children: []
          }
        ]
      },
      {
        id: 'NODE-743B-ADJ',
        label: 'Section 743(b) Partner Special Basis Depreciation',
        value: '-$320,000',
        category: 'ADJUSTMENT',
        details: '15-year straight line amortization of partner death step-up',
        ruleCode: 'Treas. Reg. § 1.743-1(j)(4)',
        sourceDoc: 'Form 1065 Schedule K-1 Box 20 Code V',
        children: [
          {
            id: 'NODE-EVENT-DEATH',
            label: 'Event #8: Partner Death (§1014 Step-Up)',
            value: '$10.0M Outside Basis',
            category: 'EVENT',
            details: 'Outside basis stepped up to FMV; §754 election activates $6.0M inside basis adjustment',
            sourceDoc: 'Death Certificate & Form 8971 Estate Return',
            children: []
          }
        ]
      },
      {
        id: 'NODE-163J-ADJ',
        label: 'Section 163(j) Disallowed EBIE Interest',
        value: '+$1,200,000',
        category: 'ADJUSTMENT',
        details: 'Disallowed interest exceeding 30% ATI threshold allocated to partners',
        ruleCode: 'IRC § 163(j)(4)(B)',
        sourceDoc: 'Form 8990 Schedule A',
        children: [
          {
            id: 'NODE-EVENT-DEBT',
            label: 'Event #14: $40M Senior Term Debt',
            value: '$40.0M Debt Incurred',
            category: 'EVENT',
            details: 'Senior loan incurs $4.5M annual interest expense exceeding 30% ATI limit',
            sourceDoc: 'JPMorgan Credit Facility Note',
            children: []
          }
        ]
      }
    ]
  },
  'STEPUP_743B': {
    id: 'NODE-743B-MASTER',
    label: 'Gross Section 743(b) Basis Adjustment',
    value: '$6,000,000',
    category: 'OUTPUT',
    details: 'Transferee-specific step-up following partner death transfer under IRC § 1014',
    ruleCode: 'IRC § 743(b)(1) & Treas. Reg. § 1.743-1(b)',
    children: [
      {
        id: 'NODE-755-CAPITAL',
        label: 'Section 755 Capital Asset Class Portion',
        value: '$4,800,000 (80%)',
        category: 'ADJUSTMENT',
        details: 'Allocated to Dallas logistics hub and warehouse infrastructure',
        ruleCode: 'IRC § 755(a)(1)',
        sourceDoc: 'Independent Valuation Appraisal Report',
        children: []
      },
      {
        id: 'NODE-755-ORDINARY',
        label: 'Section 755 Ordinary Income Class (§751)',
        value: '$1,200,000 (20%)',
        category: 'ADJUSTMENT',
        details: 'Allocated to unrealized logistics receivables & finished inventory',
        ruleCode: 'IRC § 755(a)(2) & IRC § 751',
        sourceDoc: 'Operating Partnership Accounts Receivable Ledger',
        children: []
      }
    ]
  }
};

export const AuditLineageView: React.FC = () => {
  const [selectedTreeKey, setSelectedTreeKey] = useState<string>('TAXABLE_INCOME');
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    'NODE-TAXABLE-INCOME': true,
    'NODE-704C-ADJ': true,
    'NODE-743B-ADJ': true,
    'NODE-163J-ADJ': true,
    'NODE-743B-MASTER': true
  });
  const [selectedNodeDetails, setSelectedNodeDetails] = useState<LineageNode | null>(LINEAGE_TREES['TAXABLE_INCOME']);

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const currentTree = LINEAGE_TREES[selectedTreeKey];

  const renderTreeNode = (node: LineageNode, depth = 0) => {
    const isExpanded = expandedNodes[node.id];
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedNodeDetails?.id === node.id;

    return (
      <div key={node.id} className="space-y-1" style={{ marginLeft: `${depth * 20}px` }}>
        <div
          onClick={() => {
            setSelectedNodeDetails(node);
            if (hasChildren) toggleNode(node.id);
          }}
          className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all cursor-pointer ${
            isSelected
              ? 'bg-purple-950/40 border-purple-500/60 shadow-lg ring-1 ring-purple-500/40'
              : 'bg-black/50 border-white/5 hover:bg-white/5'
          }`}
        >
          <div className="flex items-center gap-2">
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNode(node.id);
                }}
                className="text-zinc-400 hover:text-white"
              >
                {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            ) : (
              <div className="w-3.5 h-3.5 flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
              </div>
            )}

            <div>
              <span className="font-bold text-white block">{node.label}</span>
              <span className="text-[10px] text-zinc-400 font-mono">{node.category}</span>
            </div>
          </div>

          <div className="text-right font-mono">
            <span className="text-xs font-bold text-purple-300">{node.value}</span>
            {node.ruleCode && (
              <span className="text-[10px] text-zinc-500 block">{node.ruleCode}</span>
            )}
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="space-y-1.5 pt-1 border-l border-white/10 pl-2">
            {node.children!.map(child => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Top Banner */}
      <div className="ios-glass-card rounded-2xl p-5 border border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shadow-sm">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white">
                  Audit Lineage &amp; Calculation Provenance DAG
                </h1>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
                  Section 26 &amp; 28 Spec
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Click any final output number to navigate backwards through its entire computational lineage: Output &rarr; Adjustments &rarr; Events &rarr; Rules &rarr; Documents.
              </p>
            </div>
          </div>
        </div>

        {/* Target Tree Picker */}
        <div className="flex items-center ios-segmented-control text-xs p-1">
          <button
            onClick={() => {
              setSelectedTreeKey('TAXABLE_INCOME');
              setSelectedNodeDetails(LINEAGE_TREES['TAXABLE_INCOME']);
            }}
            className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
              selectedTreeKey === 'TAXABLE_INCOME' ? 'bg-purple-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Taxable Income ($16.18M)
          </button>
          <button
            onClick={() => {
              setSelectedTreeKey('STEPUP_743B');
              setSelectedNodeDetails(LINEAGE_TREES['STEPUP_743B']);
            }}
            className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
              selectedTreeKey === 'STEPUP_743B' ? 'bg-purple-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            §743(b) Step-Up ($6.0M)
          </button>
        </div>
      </div>

      {/* Main DAG Tree & Node Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Interactive Tree */}
        <div className="lg:col-span-2 ios-glass-card rounded-2xl p-6 border border-white/10 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              Lineage DAG: {currentTree.label} ({currentTree.value})
            </h2>
            <span className="text-[11px] font-mono text-zinc-400">
              Click node to inspect metadata
            </span>
          </div>

          <div className="space-y-2">
            {renderTreeNode(currentTree)}
          </div>
        </div>

        {/* Right 1 Col: Selected Node Inspector */}
        <div className="ios-glass-card rounded-2xl p-6 border border-white/10 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Node Provenance Inspector
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-zinc-300">
              {selectedNodeDetails?.category}
            </span>
          </div>

          {selectedNodeDetails ? (
            <div className="space-y-4 text-xs">
              <div>
                <span className="text-zinc-500 font-mono text-[10px] block">Node Label</span>
                <span className="text-sm font-bold text-white">{selectedNodeDetails.label}</span>
              </div>

              <div>
                <span className="text-zinc-500 font-mono text-[10px] block">Calculated Value</span>
                <span className="text-base font-bold font-mono text-purple-400">{selectedNodeDetails.value}</span>
              </div>

              <div>
                <span className="text-zinc-500 font-mono text-[10px] block">Statutory / Computational Description</span>
                <p className="text-zinc-300 leading-relaxed mt-0.5">{selectedNodeDetails.details}</p>
              </div>

              {selectedNodeDetails.ruleCode && (
                <div className="p-3 bg-purple-950/20 rounded-xl border border-purple-500/20 space-y-1">
                  <span className="text-[10px] font-mono text-purple-300 uppercase font-bold block">
                    Governing Law Citation
                  </span>
                  <span className="text-white font-mono">{selectedNodeDetails.ruleCode}</span>
                </div>
              )}

              {selectedNodeDetails.sourceDoc && (
                <div className="p-3 bg-black/50 rounded-xl border border-white/10 space-y-1">
                  <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] font-mono uppercase">
                    <FileText className="w-3 h-3 text-blue-400" />
                    <span>Underlying Source Document</span>
                  </div>
                  <span className="text-zinc-200">{selectedNodeDetails.sourceDoc}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-zinc-500 text-center py-10">
              Select any node in the lineage tree to view its provenance.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
