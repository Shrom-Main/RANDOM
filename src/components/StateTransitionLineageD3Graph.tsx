/**
 * Dynamic State-Transition & Interactive Tax Lineage D3 Graph
 * In accordance with POC1 Specification Sections 1, 10, 11, 12, 13, 14, 21, 22, 23
 * Dynamically maps state-transition nodes S_t, tax events e_t, statutory rule regimes rho_t,
 * and enables interactive backwards & forwards tax lineage path tracing:
 * InvestorTaxResult (Box 9a) -> Partnership Tax Allocation -> Section 704(c) Built-In Layer
 * -> Partner Tax Basis -> Section 743(b)/754 Basis Adjustment -> Acquisition Contract / EDGAR Filing.
 */

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import { 
  GitCommit, 
  Layers, 
  Calculator, 
  ArrowRight, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Database, 
  FileText,
  Sliders,
  ChevronRight,
  TrendingUp,
  Info
} from 'lucide-react';
import { MathView } from './MathView';

export type LineageNodeType = 
  | 'STATE_SNAPSHOT'     // S_0, S_1, S_2... Full State Vector
  | 'TAX_EVENT'          // e_t (Contribution, Distribution, Revaluation, Sale)
  | 'STATUTORY_RULE'     // Rule Regime ρ (IRC §704(b), §704(c), §743(b), §754)
  | 'TAX_ATTRIBUTE'      // Built-In Gain Layer, 743(b) basis step-up, inside/outside disparity
  | 'INVESTOR_OUTPUT'    // Schedule K-1 Box 9a, Form 990-T, 1065 taxable income
  | 'SOURCE_FILING';     // SEC EDGAR Accession, LPA Contract, Form 8594

export type LineageEdgeType = 
  | 'STATE_TRANSITION'   // S_t -> S_{t+1} via delta
  | 'LINEAGE_DEPENDENCY' // Y = f(X1, ..., Xn) backwards lineage
  | 'RULE_GOVERNANCE'    // Regulated by statutory authority
  | 'BASIS_ADJUSTMENT'   // §743(b) / §734(b) adjustment flow
  | 'LAYER_DISPARITY'    // §704(c) forward allocation flow
  | 'EVIDENTIARY_ANCHOR';// Anchored to SEC filing

export interface LineageGraphNode {
  id: string;
  label: string;
  shortLabel: string;
  type: LineageNodeType;
  stageIndex: number; // 0 (Source) to 5 (Final Tax Output)
  subtext: string;
  mathematicalExpression?: string;
  computedValue?: string;
  authorityCitation?: string;
  timestamp?: string;
  validDate?: string;
  recordDate?: string;
  sourceFiling?: string;
  secAccession?: string;
  sensitivityDerivative?: string;
  inputs?: { name: string; value: string; origin: string }[];
  invariantsPreserved?: string[];
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface LineageGraphEdge {
  id: string;
  source: string | LineageGraphNode;
  target: string | LineageGraphNode;
  sourceId: string;
  targetId: string;
  type: LineageEdgeType;
  label: string;
  formula?: string;
  isDerived?: boolean;
  weight?: number;
}

export interface LineageChainPreset {
  id: string;
  title: string;
  fundName: string;
  description: string;
  authorityFocus: string;
  rootOutputNodeId: string;
  genesisNodeId: string;
  nodes: LineageGraphNode[];
  edges: LineageGraphEdge[];
}

export const CANONICAL_LINEAGE_PRESETS: LineageChainPreset[] = [
  {
    id: 'preset-704c-curative',
    title: 'Schedule K-1 Tax Allocation Disparity & 704(c) Ceiling Rule Lineage',
    fundName: 'Blackstone Real Estate Partners IX (BREP IX) / CalPERS',
    description: 'Traces CalPERS Year 3 Schedule K-1 Box 9a Net Capital Gain back through curative allocations to 2018 in-kind asset acquisition.',
    authorityFocus: 'IRC § 704(c)(1)(A) · Treas. Reg. § 1.704-3(c) Curative Method',
    rootOutputNodeId: 'node-k1-output',
    genesisNodeId: 'node-sec-genesis',
    nodes: [
      {
        id: 'node-sec-genesis',
        label: 'Genesis Acquisition & Valuation Evidence',
        shortLabel: 'EDGAR Form D/A',
        type: 'SOURCE_FILING',
        stageIndex: 0,
        subtext: 'SEC Accession #0001755106-18-000042',
        sourceFiling: 'BREP IX LPA Exhibit B & Cushman Appraisal',
        secAccession: '0001755106-18-000042',
        validDate: '2018-06-15',
        recordDate: '2018-06-20',
        computedValue: '$120,000,000 FMV / $45,000,000 Basis',
        sensitivityDerivative: '∂Y/∂FMV_0 = 1.0 (Direct genesis input)'
      },
      {
        id: 'node-state-0',
        label: 'Initial State Vector S_0 (Genesis)',
        shortLabel: 'State S_0',
        type: 'STATE_SNAPSHOT',
        stageIndex: 1,
        subtext: 'Capital account parity B_0 = L_0 + C_0',
        mathematicalExpression: 'S_0 = (V_0, E_0, \\Theta_0, \\tau_0, \\omega_0)',
        computedValue: 'Total Book: $120.0M | Inside Tax: $45.0M',
        authorityCitation: 'Treas. Reg. § 1.704-1(b)(2)(iv)(b)',
        validDate: '2018-06-15',
        invariantsPreserved: ['∑ ω_j = 1.0', 'Balance Sheet Parity: A = L + E']
      },
      {
        id: 'node-event-contrib',
        label: 'In-Kind Logistics Portfolio Contribution',
        shortLabel: 'Event e_contrib',
        type: 'TAX_EVENT',
        stageIndex: 1,
        subtext: 'Tax-deferred property transfer under § 721(a)',
        mathematicalExpression: 'e_{\\text{contrib}} = (\\text{Property}, t_v=2018, FMV=120M, Basis=45M)',
        authorityCitation: 'IRC § 721(a)',
        validDate: '2018-06-15'
      },
      {
        id: 'node-rule-704c',
        label: 'Rule Regime ρ_704c (Curative Method)',
        shortLabel: 'Regime ρ_704c',
        type: 'STATUTORY_RULE',
        stageIndex: 2,
        subtext: 'Mandates curative depreciation to overcome ceiling limitation',
        mathematicalExpression: '\\Delta C_j^{\\text{curative}} = \\min(\\text{Shortfall}, \\text{Available Items})',
        authorityCitation: 'IRC § 704(c)(1)(A); Treas. Reg. § 1.704-3(c)',
        computedValue: 'Curative Offset Rate: 100% of ceiling distortion'
      },
      {
        id: 'node-704c-layer',
        label: 'Section 704(c) Built-In Gain Layer',
        shortLabel: '§704(c) Layer',
        type: 'TAX_ATTRIBUTE',
        stageIndex: 2,
        subtext: 'Built-in gain disparity FMV_0 - TaxBasis_0',
        mathematicalExpression: 'C_{t+1}^{704(c)} = C_t^{704(c)} - \\Delta C_t^{\\text{amort}}',
        computedValue: 'Initial Disparity: $75,000,000.00 USD',
        authorityCitation: 'Treas. Reg. § 1.704-3(a)(1)',
        inputs: [
          { name: 'Contributed FMV', value: '$120,000,000.00', origin: 'Genesis State S_0' },
          { name: 'Inside Tax Basis', value: '$45,000,000.00', origin: 'Form 8594 Schedule' }
        ],
        sensitivityDerivative: '∂Layer/∂Basis = -1.0; ∂Layer/∂FMV = +1.0'
      },
      {
        id: 'node-state-2',
        label: 'Intermediate State S_2 (Amortized Layers)',
        shortLabel: 'State S_2',
        type: 'STATE_SNAPSHOT',
        stageIndex: 3,
        subtext: 'Tax depreciation amortization & ceiling calculation',
        mathematicalExpression: 'S_2 = \\delta(S_1, e_{\\text{deprec}}, \\rho_{704c})',
        computedValue: 'Residual Disparity: $65,750,000.00 USD',
        validDate: '2021-12-31'
      },
      {
        id: 'node-event-sale',
        label: 'Portfolio Disposition & Realization Event',
        shortLabel: 'Event e_sale',
        type: 'TAX_EVENT',
        stageIndex: 3,
        subtext: 'Asset disposition with cash realization $182.8M',
        mathematicalExpression: 'e_{\\text{sale}} = (\\text{Logistics}, P=182.8M, t_v=2023-11-15)',
        authorityCitation: 'IRC § 1001(a)',
        validDate: '2023-11-15',
        recordDate: '2023-12-01'
      },
      {
        id: 'node-alloc-layer',
        label: 'Partnership Tax Allocation Engine',
        shortLabel: 'Allocation Matrix',
        type: 'TAX_ATTRIBUTE',
        stageIndex: 4,
        subtext: 'Blended 704(b) book share + 704(c) remedial correction',
        mathematicalExpression: 'Alloc_j = (\\omega_j \\times \\text{Gain}_{704b}) + \\text{CurativeOffset}_j',
        computedValue: '$42,850,000.00 Allocated to CalPERS',
        authorityCitation: 'IRC § 704(b); Treas. Reg. § 1.704-1(b)',
        inputs: [
          { name: 'CalPERS Ownership Weight ω_j', value: '28.500%', origin: 'Exhibit A LPA' },
          { name: 'Total 704(b) Book Gain', value: '$182,807,017.00', origin: 'S_3 State Vector' },
          { name: 'Curative Ceiling Correction', value: '-$9,250,000.00', origin: '704(c) Layer' }
        ],
        sensitivityDerivative: '∂Alloc/∂ω = $182.8M (High sensitivity)'
      },
      {
        id: 'node-k1-output',
        label: 'CalPERS Schedule K-1 Box 9a (Net Long-Term Gain)',
        shortLabel: 'Schedule K-1 Box 9a',
        type: 'INVESTOR_OUTPUT',
        stageIndex: 5,
        subtext: 'Final statutory tax reporting deliverable for tax year 2023',
        mathematicalExpression: 'Y_{K1} = \\Pi_{\\text{tax}}(S_4, \\text{CalPERS}) = \\$42,850,000.00',
        computedValue: '$42,850,000.00 USD',
        authorityCitation: 'IRC § 702(a)(2); Form 1065 Line 9a',
        sourceFiling: 'Form 1065 Return / EDGAR Accession #0001755106-24-000012',
        validDate: '2023-12-31',
        recordDate: '2024-03-15',
        invariantsPreserved: ['Investor Basis Conservation', 'No Negative Outside Basis']
      }
    ],
    edges: [
      {
        id: 'e-1',
        sourceId: 'node-sec-genesis',
        targetId: 'node-state-0',
        source: 'node-sec-genesis',
        target: 'node-state-0',
        type: 'EVIDENTIARY_ANCHOR',
        label: 'Genesis Document Grounding'
      },
      {
        id: 'e-2',
        sourceId: 'node-event-contrib',
        targetId: 'node-state-0',
        source: 'node-event-contrib',
        target: 'node-state-0',
        type: 'STATE_TRANSITION',
        label: 'Initial Contribution δ(∅, e_contrib)'
      },
      {
        id: 'e-3',
        sourceId: 'node-state-0',
        targetId: 'node-704c-layer',
        source: 'node-state-0',
        target: 'node-704c-layer',
        type: 'LAYER_DISPARITY',
        label: 'Generates Disparity FMV_0 - TaxBasis_0'
      },
      {
        id: 'e-4',
        sourceId: 'node-rule-704c',
        targetId: 'node-704c-layer',
        source: 'node-rule-704c',
        target: 'node-704c-layer',
        type: 'RULE_GOVERNANCE',
        label: 'Curative Method Selection'
      },
      {
        id: 'e-5',
        sourceId: 'node-704c-layer',
        targetId: 'node-state-2',
        source: 'node-704c-layer',
        target: 'node-state-2',
        type: 'STATE_TRANSITION',
        label: 'Amortizes Layer to State S_2'
      },
      {
        id: 'e-6',
        sourceId: 'node-event-sale',
        targetId: 'node-state-2',
        source: 'node-event-sale',
        target: 'node-state-2',
        type: 'STATE_TRANSITION',
        label: 'Triggers Gain Realization'
      },
      {
        id: 'e-7',
        sourceId: 'node-state-2',
        targetId: 'node-alloc-layer',
        source: 'node-state-2',
        target: 'node-alloc-layer',
        type: 'LINEAGE_DEPENDENCY',
        label: 'Feeds Realized Book Gain Vector'
      },
      {
        id: 'e-8',
        sourceId: 'node-704c-layer',
        targetId: 'node-alloc-layer',
        source: 'node-704c-layer',
        target: 'node-alloc-layer',
        type: 'LAYER_DISPARITY',
        label: 'Injects Curative Offset -$9.25M'
      },
      {
        id: 'e-9',
        sourceId: 'node-alloc-layer',
        targetId: 'node-k1-output',
        source: 'node-alloc-layer',
        target: 'node-k1-output',
        type: 'LINEAGE_DEPENDENCY',
        label: 'Computes Final Schedule K-1 Box 9a'
      }
    ]
  },
  {
    id: 'preset-743b-stepup',
    title: 'Section 743(b) / 754 Transferee Basis Step-Up Lineage',
    fundName: 'Bridgewater Pure Alpha II / Sovereign Wealth LP Transfer',
    description: 'Traces Section 743(b) positive basis adjustment of $18.4M from partner secondary transfer through election ρ_754 down to asset tax basis.',
    authorityFocus: 'IRC § 743(b) · IRC § 754 · Treas. Reg. § 1.743-1',
    rootOutputNodeId: 'node-inside-basis-adj',
    genesisNodeId: 'node-secondary-transfer-event',
    nodes: [
      {
        id: 'node-secondary-transfer-event',
        label: 'Secondary Limited Partner Purchase Event',
        shortLabel: 'Event e_transfer',
        type: 'TAX_EVENT',
        stageIndex: 0,
        subtext: 'Transferee buys 15% interest for $45,000,000 cash',
        mathematicalExpression: 'e_{\\text{transfer}} = (P=45M, \\omega=0.15, t_v=2021-03-31)',
        authorityCitation: 'IRC § 741',
        validDate: '2021-03-31',
        recordDate: '2021-04-10',
        computedValue: 'Purchase Price: $45.0M | Transferor Basis: $26.6M'
      },
      {
        id: 'node-state-1-transf',
        label: 'Pre-Transfer State Snapshot S_1',
        shortLabel: 'State S_1',
        type: 'STATE_SNAPSHOT',
        stageIndex: 1,
        subtext: 'Inside tax basis of fund assets: $177,333,333',
        mathematicalExpression: 'S_1 = (V_1, E_1, \\Theta_1, \\tau_1, \\omega_1)',
        computedValue: 'Transferee Share of Inside Basis: $26.6M (15%)',
        validDate: '2021-03-31'
      },
      {
        id: 'node-rule-754',
        label: 'Section 754 Election in Force (ρ_754)',
        shortLabel: 'Election ρ_754',
        type: 'STATUTORY_RULE',
        stageIndex: 2,
        subtext: 'Binding partnership election to adjust asset basis',
        mathematicalExpression: '\\text{Election}(F, \\text{Year}) = \\text{ACTIVE}',
        authorityCitation: 'IRC § 754; Treas. Reg. § 1.754-1(b)',
        computedValue: 'Status: Active (Irrevocable without IRS consent)'
      },
      {
        id: 'node-743b-calc',
        label: 'Section 743(b) Gross Adjustment Engine',
        shortLabel: '§743(b) Engine',
        type: 'TAX_ATTRIBUTE',
        stageIndex: 3,
        subtext: 'Difference between Outside Basis and Proportionate Inside Basis',
        mathematicalExpression: '\\Delta B_{743b} = \\text{OutsideBasis}_{\\text{transf}} - \\sum_k \\omega_{\\text{transf}} \\times B_{\\text{inside}, k}',
        computedValue: '$18,400,000.00 USD Step-Up',
        authorityCitation: 'IRC § 743(b)(1)',
        inputs: [
          { name: 'Transferee Outside Basis', value: '$45,000,000.00', origin: 'Purchase Agreement' },
          { name: 'Transferee Inside Basis Share', value: '$26,600,000.00', origin: 'State S_1 Vector' }
        ],
        sensitivityDerivative: '∂ΔB/∂Price = +1.0; ∂ΔB/∂InsideBasis = -0.15'
      },
      {
        id: 'node-755-alloc',
        label: 'Section 755 Two-Class Asset Allocation',
        shortLabel: '§755 Allocator',
        type: 'TAX_ATTRIBUTE',
        stageIndex: 4,
        subtext: 'Allocates step-up between Capital Gain Property vs Ordinary Income Property',
        mathematicalExpression: '\\Delta B_k = \\Delta B_{743b} \\times \\frac{\\text{Disparity}_k}{\\sum \\text{Disparity}}',
        computedValue: 'Capital: $14.72M (80%) | Ordinary: $3.68M (20%)',
        authorityCitation: 'IRC § 755; Treas. Reg. § 1.755-1',
        validDate: '2021-04-15'
      },
      {
        id: 'node-inside-basis-adj',
        label: 'Individual Transferee Inside Asset Basis Layer',
        shortLabel: 'Stepped-Up Inside Basis',
        type: 'INVESTOR_OUTPUT',
        stageIndex: 5,
        subtext: 'Solely for the benefit of transferee partner (eliminates phantom gain)',
        mathematicalExpression: 'B_{\\text{inside}, k}^{\\text{transf}} = B_{\\text{common}, k} + \\Delta B_{743b, k}',
        computedValue: 'Adjusted Transferee Basis: $45,000,000.00 USD',
        authorityCitation: 'Treas. Reg. § 1.743-1(j)',
        invariantsPreserved: ['Outside Basis Parity', 'Zero Immediate Gain on Liquidation']
      }
    ],
    edges: [
      {
        id: 'e-t1',
        sourceId: 'node-secondary-transfer-event',
        targetId: 'node-state-1-transf',
        source: 'node-secondary-transfer-event',
        target: 'node-state-1-transf',
        type: 'STATE_TRANSITION',
        label: 'Partner Admission Transition'
      },
      {
        id: 'e-t2',
        sourceId: 'node-rule-754',
        targetId: 'node-743b-calc',
        source: 'node-rule-754',
        target: 'node-743b-calc',
        type: 'RULE_GOVERNANCE',
        label: 'Triggers Mandatory Adjustment'
      },
      {
        id: 'e-t3',
        sourceId: 'node-state-1-transf',
        targetId: 'node-743b-calc',
        source: 'node-state-1-transf',
        target: 'node-743b-calc',
        type: 'LINEAGE_DEPENDENCY',
        label: 'Supplies Pro-Rata Inside Basis'
      },
      {
        id: 'e-t4',
        sourceId: 'node-secondary-transfer-event',
        targetId: 'node-743b-calc',
        source: 'node-secondary-transfer-event',
        target: 'node-743b-calc',
        type: 'LINEAGE_DEPENDENCY',
        label: 'Supplies Outside Purchase Price'
      },
      {
        id: 'e-t5',
        sourceId: 'node-743b-calc',
        targetId: 'node-755-alloc',
        source: 'node-743b-calc',
        target: 'node-755-alloc',
        type: 'BASIS_ADJUSTMENT',
        label: 'Feeds $18.4M Gross Adjustment'
      },
      {
        id: 'e-t6',
        sourceId: 'node-755-alloc',
        targetId: 'node-inside-basis-adj',
        source: 'node-755-alloc',
        target: 'node-inside-basis-adj',
        type: 'LINEAGE_DEPENDENCY',
        label: 'Attaches Special Basis to Assets'
      }
    ]
  },
  {
    id: 'preset-crossborder-treaty',
    title: 'Cross-Border Indirect Transfer & Treaty Relief Lineage',
    fundName: 'Tiger Global Private Investment Partners / Indian Equities FPI',
    description: 'Traces tax lineage from Indian NSE Equities disposal through Luxembourg RAIF & Cayman SPC up to Delaware Master Fund under Section 9(1)(i).',
    authorityFocus: 'Section 9(1)(i) Indian IT Act · US-Luxembourg Treaty · OECD GloBE Pillar 2',
    rootOutputNodeId: 'node-delaware-tax',
    genesisNodeId: 'node-nse-trade',
    nodes: [
      {
        id: 'node-nse-trade',
        label: 'NSE India Block Equity Realization',
        shortLabel: 'NSE Trade Event',
        type: 'TAX_EVENT',
        stageIndex: 0,
        subtext: 'Sale of Indian equity shares on NSE exchange',
        mathematicalExpression: 'e_{\\text{sale}} = (\\text{NSE:TCS}, P=₹3,450, t_v=2024)',
        authorityCitation: 'NSE India Trade Confirmation',
        validDate: '2024-02-14',
        computedValue: 'Realized Gain: ₹420,000,000 (~$5.1M USD)'
      },
      {
        id: 'node-sec112a',
        label: 'Indian Section 112A LTCG Statutory Engine',
        shortLabel: 'Sec 112A LTCG',
        type: 'STATUTORY_RULE',
        stageIndex: 1,
        subtext: '12.5% Long-Term Capital Gains Tax + 0.1% STT',
        mathematicalExpression: 'T_{\\text{112A}} = (P_{\\text{sale}} - P_{\\text{cost}}) \\times 12.5\\%',
        authorityCitation: 'Indian Income Tax Act § 112A',
        computedValue: 'Withheld at Source: $637,500 USD'
      },
      {
        id: 'node-lux-raif',
        label: 'Luxembourg RAIF Category 1 FPI Holding Entity',
        shortLabel: 'Luxembourg RAIF',
        type: 'TAX_ATTRIBUTE',
        stageIndex: 2,
        subtext: 'Benefits from India-Luxembourg Double Tax Avoidance Agreement',
        mathematicalExpression: '\\text{TreatyRelief}(LU, IN) = \\text{Article 13 Capital Gains}',
        authorityCitation: 'India-Luxembourg DTAA Article 13',
        computedValue: 'Exempt from Indian Indirect Transfer Sec 9(1)(i)'
      },
      {
        id: 'node-cayman-spc',
        label: 'Cayman Islands Segregated Portfolio Company (SPC)',
        shortLabel: 'Cayman SPC',
        type: 'TAX_ATTRIBUTE',
        stageIndex: 3,
        subtext: 'Zero corporate tax pass-through jurisdiction',
        mathematicalExpression: 'T_{\\text{KY}} = 0.0\\%',
        authorityCitation: 'Cayman Islands Tax Concessions Law',
        computedValue: '100% Net Proceeds Distributed to Master LP'
      },
      {
        id: 'node-delaware-tax',
        label: 'Delaware Master LP Global Tax Reconciliation',
        shortLabel: 'Master Fund K-1',
        type: 'INVESTOR_OUTPUT',
        stageIndex: 4,
        subtext: 'Foreign Tax Credit Section 901 vs Subpart F / GILTI Analysis',
        mathematicalExpression: 'Y_{\\text{US}} = \\text{PassThroughGain} - \\text{FTC}_{\\S901}',
        authorityCitation: 'IRC § 901; IRC § 951A',
        computedValue: 'Net US Taxable Gain: $4,462,500 USD',
        invariantsPreserved: ['Cross-Border Balance Sheet Equivalence']
      }
    ],
    edges: [
      {
        id: 'e-cb1',
        sourceId: 'node-nse-trade',
        targetId: 'node-sec112a',
        source: 'node-nse-trade',
        target: 'node-sec112a',
        type: 'STATE_TRANSITION',
        label: 'Applies Indian Withholding Rate'
      },
      {
        id: 'e-cb2',
        sourceId: 'node-sec112a',
        targetId: 'node-lux-raif',
        source: 'node-sec112a',
        target: 'node-lux-raif',
        type: 'RULE_GOVERNANCE',
        label: 'FPI Treaty Certificate Invoked'
      },
      {
        id: 'e-cb3',
        sourceId: 'node-lux-raif',
        targetId: 'node-cayman-spc',
        source: 'node-lux-raif',
        target: 'node-cayman-spc',
        type: 'LINEAGE_DEPENDENCY',
        label: 'Passes Net Distributable Dividend'
      },
      {
        id: 'e-cb4',
        sourceId: 'node-cayman-spc',
        targetId: 'node-delaware-tax',
        source: 'node-cayman-spc',
        target: 'node-delaware-tax',
        type: 'LINEAGE_DEPENDENCY',
        label: 'Reconciles into Schedule K-1'
      }
    ]
  }
];

interface StateTransitionLineageD3GraphProps {
  initialPresetId?: string;
  onSelectNodeDetail?: (node: LineageGraphNode | null) => void;
  className?: string;
}

export const StateTransitionLineageD3Graph: React.FC<StateTransitionLineageD3GraphProps> = ({
  initialPresetId = 'preset-704c-curative',
  onSelectNodeDetail,
  className = ''
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [activePresetId, setActivePresetId] = useState<string>(initialPresetId);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [activeTracePathIds, setActiveTracePathIds] = useState<{ nodeIds: Set<string>; edgeIds: Set<string> }>({
    nodeIds: new Set(),
    edgeIds: new Set()
  });

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackStepIndex, setPlaybackStepIndex] = useState<number>(0);
  const [traceDirection, setTraceDirection] = useState<'BACKWARDS' | 'FORWARDS'>('BACKWARDS');

  const activePreset = useMemo(() => {
    return CANONICAL_LINEAGE_PRESETS.find(p => p.id === activePresetId) || CANONICAL_LINEAGE_PRESETS[0];
  }, [activePresetId]);

  // Set default selected node when preset changes
  useEffect(() => {
    setSelectedNodeId(activePreset.rootOutputNodeId);
    setPlaybackStepIndex(activePreset.nodes.length - 1);
  }, [activePreset]);

  // Selected node object
  const selectedNode = useMemo(() => {
    return activePreset.nodes.find(n => n.id === selectedNodeId) || null;
  }, [selectedNodeId, activePreset]);

  // Notify parent of selected node
  useEffect(() => {
    if (onSelectNodeDetail) {
      onSelectNodeDetail(selectedNode);
    }
  }, [selectedNode, onSelectNodeDetail]);

  // Compute full backwards or forwards lineage path from a selected node
  const computeLineagePath = useCallback((startNodeId: string, direction: 'BACKWARDS' | 'FORWARDS' | 'BOTH' = 'BOTH') => {
    const nodeIds = new Set<string>([startNodeId]);
    const edgeIds = new Set<string>();

    const outgoingEdgesMap: Record<string, LineageGraphEdge[]> = {};
    const incomingEdgesMap: Record<string, LineageGraphEdge[]> = {};

    activePreset.edges.forEach(e => {
      const s = typeof e.source === 'string' ? e.source : (e.source as any).id || e.sourceId;
      const t = typeof e.target === 'string' ? e.target : (e.target as any).id || e.targetId;
      if (!outgoingEdgesMap[s]) outgoingEdgesMap[s] = [];
      outgoingEdgesMap[s].push(e);
      if (!incomingEdgesMap[t]) incomingEdgesMap[t] = [];
      incomingEdgesMap[t].push(e);
    });

    // Traverse backwards (ancestors / dependencies)
    if (direction === 'BACKWARDS' || direction === 'BOTH') {
      const queue = [startNodeId];
      while (queue.length > 0) {
        const curr = queue.shift()!;
        const inEdges = incomingEdgesMap[curr] || [];
        inEdges.forEach(edge => {
          edgeIds.add(edge.id);
          const parentId = typeof edge.source === 'string' ? edge.source : (edge.source as any).id || edge.sourceId;
          if (!nodeIds.has(parentId)) {
            nodeIds.add(parentId);
            queue.push(parentId);
          }
        });
      }
    }

    // Traverse forwards (descendants / outputs)
    if (direction === 'FORWARDS' || direction === 'BOTH') {
      const queue = [startNodeId];
      while (queue.length > 0) {
        const curr = queue.shift()!;
        const outEdges = outgoingEdgesMap[curr] || [];
        outEdges.forEach(edge => {
          edgeIds.add(edge.id);
          const childId = typeof edge.target === 'string' ? edge.target : (edge.target as any).id || edge.targetId;
          if (!nodeIds.has(childId)) {
            nodeIds.add(childId);
            queue.push(childId);
          }
        });
      }
    }

    return { nodeIds, edgeIds };
  }, [activePreset]);

  // Update active trace path when selectedNodeId changes
  useEffect(() => {
    if (selectedNodeId) {
      const path = computeLineagePath(selectedNodeId, 'BOTH');
      setActiveTracePathIds(path);
    } else {
      setActiveTracePathIds({ nodeIds: new Set(), edgeIds: new Set() });
    }
  }, [selectedNodeId, computeLineagePath]);

  // Playback timer for auto-step through lineage
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setPlaybackStepIndex(prev => {
        const total = activePreset.nodes.length;
        const next = traceDirection === 'FORWARDS' 
          ? (prev + 1) % total 
          : (prev - 1 + total) % total;
        
        const targetNode = activePreset.nodes[next];
        if (targetNode) {
          setSelectedNodeId(targetNode.id);
        }
        return next;
      });
    }, 2400);

    return () => clearInterval(interval);
  }, [isPlaying, activePreset, traceDirection]);

  // D3 Render & Simulation
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 880;
    const height = 480;

    const svg = d3.select(svgRef.current)
      .attr('width', '100%')
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`);

    svg.selectAll('*').remove();

    // Defs for glowing markers, gradients, and filters
    const defs = svg.append('defs');

    // Arrow markers by edge type
    const markerColors: Record<string, string> = {
      default: 'rgba(255, 255, 255, 0.3)',
      active: '#10B981',       // emerald
      transition: '#3B82F6',   // blue
      rule: '#F59E0B',         // amber
      dependency: '#EC4899',   // pink
      layer: '#06B6D4'         // cyan
    };

    Object.entries(markerColors).forEach(([key, color]) => {
      defs.append('marker')
        .attr('id', `arrow-${key}`)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 22)
        .attr('refY', 0)
        .attr('markerWidth', 7)
        .attr('markerHeight', 7)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-4.5L9,0L0,4.5')
        .attr('fill', color);
    });

    // Container for zoom/pan
    const container = svg.append('g');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3.0])
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
      });

    svg.call(zoom as any);

    // Initial center transform
    svg.call(zoom.transform as any, d3.zoomIdentity.translate(40, 20).scale(0.92));

    // Clone data for simulation
    const simNodes = activePreset.nodes.map(n => ({
      ...n,
      // Seed positions horizontally based on stageIndex
      x: 80 + n.stageIndex * ((width - 160) / 5) + (Math.random() - 0.5) * 40,
      y: (height / 2) + ((n.id.charCodeAt(n.id.length - 1) % 4) - 1.5) * 80
    }));

    const simLinks = activePreset.edges.map(e => ({
      ...e,
      source: e.sourceId,
      target: e.targetId
    }));

    // Force simulation configured for horizontal pipeline layout
    const simulation = d3.forceSimulation(simNodes as any)
      .force('link', d3.forceLink(simLinks).id((d: any) => d.id).distance(140).strength(0.8))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('x', d3.forceX((d: any) => 80 + d.stageIndex * ((width - 160) / 5)).strength(0.95))
      .force('y', d3.forceY(height / 2).strength(0.35))
      .force('collision', d3.forceCollide().radius(38));

    // Node color mapping by node type
    const nodeColorMap: Record<LineageNodeType, { stroke: string; fill: string; accent: string }> = {
      STATE_SNAPSHOT: { stroke: '#10B981', fill: 'rgba(16, 185, 129, 0.15)', accent: '#34D399' },
      TAX_EVENT: { stroke: '#3B82F6', fill: 'rgba(59, 130, 246, 0.15)', accent: '#60A5FA' },
      STATUTORY_RULE: { stroke: '#F59E0B', fill: 'rgba(245, 158, 11, 0.15)', accent: '#FBBF24' },
      TAX_ATTRIBUTE: { stroke: '#06B6D4', fill: 'rgba(6, 182, 212, 0.15)', accent: '#22D3EE' },
      INVESTOR_OUTPUT: { stroke: '#EC4899', fill: 'rgba(236, 72, 153, 0.15)', accent: '#F472B6' },
      SOURCE_FILING: { stroke: '#A855F7', fill: 'rgba(168, 85, 247, 0.15)', accent: '#C084FC' }
    };

    // Render Edges
    const linkGroup = container.append('g').attr('class', 'links');

    const link = linkGroup.selectAll('g.link')
      .data(simLinks)
      .enter()
      .append('g')
      .attr('class', 'link');

    // Glow background line for active trace paths
    const linkGlow = link.append('line')
      .attr('stroke', (d: any) => activeTracePathIds.edgeIds.has(d.id) ? '#10B981' : 'none')
      .attr('stroke-width', 6)
      .attr('stroke-opacity', 0.25)
      .attr('stroke-linecap', 'round');

    // Main line
    const linkLine = link.append('line')
      .attr('stroke', (d: any) => {
        if (activeTracePathIds.edgeIds.has(d.id)) return '#10B981';
        return 'rgba(255, 255, 255, 0.18)';
      })
      .attr('stroke-width', (d: any) => activeTracePathIds.edgeIds.has(d.id) ? 2.8 : 1.4)
      .attr('stroke-dasharray', (d: any) => activeTracePathIds.edgeIds.has(d.id) ? '6,3' : 'none')
      .attr('marker-end', (d: any) => {
        if (activeTracePathIds.edgeIds.has(d.id)) return 'url(#arrow-active)';
        return 'url(#arrow-default)';
      });

    // Edge Label
    const linkLabel = link.append('text')
      .attr('font-size', '8.5px')
      .attr('font-family', 'ui-monospace, SFMono-Regular, Menlo, monospace')
      .attr('fill', (d: any) => activeTracePathIds.edgeIds.has(d.id) ? '#34D399' : 'rgba(255, 255, 255, 0.4)')
      .attr('text-anchor', 'middle')
      .attr('dy', -5)
      .text((d: any) => d.label);

    // Render Nodes
    const nodeGroup = container.append('g').attr('class', 'nodes');

    const node = nodeGroup.selectAll('g.node')
      .data(simNodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .on('click', (_event, d: any) => {
        setSelectedNodeId(d.id);
        const idx = activePreset.nodes.findIndex(n => n.id === d.id);
        if (idx !== -1) setPlaybackStepIndex(idx);
      })
      .on('mouseenter', (_event, d: any) => {
        setHoveredNodeId(d.id);
      })
      .on('mouseleave', () => {
        setHoveredNodeId(null);
      })
      .call(d3.drag<any, any>()
        .on('start', (event, d: any) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d: any) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d: any) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
      );

    // Outer Selection Halo
    node.append('circle')
      .attr('r', (d: any) => (d.id === selectedNodeId ? 28 : (activeTracePathIds.nodeIds.has(d.id) ? 22 : 18)))
      .attr('fill', (d: any) => nodeColorMap[d.type as LineageNodeType]?.fill || 'rgba(255,255,255,0.1)')
      .attr('stroke', (d: any) => {
        if (d.id === selectedNodeId) return '#ffffff';
        if (activeTracePathIds.nodeIds.has(d.id)) return '#10B981';
        return nodeColorMap[d.type as LineageNodeType]?.stroke || '#94A3B8';
      })
      .attr('stroke-width', (d: any) => (d.id === selectedNodeId ? 3.0 : (activeTracePathIds.nodeIds.has(d.id) ? 2.0 : 1.2)))
      .attr('stroke-dasharray', (d: any) => (d.type === 'STATUTORY_RULE' ? '3,2' : 'none'));

    // Inner Core Circle
    node.append('circle')
      .attr('r', (d: any) => (d.id === selectedNodeId ? 11 : 7.5))
      .attr('fill', (d: any) => {
        if (d.id === selectedNodeId) return '#ffffff';
        if (activeTracePathIds.nodeIds.has(d.id)) return '#10B981';
        return nodeColorMap[d.type as LineageNodeType]?.stroke || '#94A3B8';
      });

    // Stage Step Badge
    node.append('rect')
      .attr('x', -14)
      .attr('y', -32)
      .attr('width', 28)
      .attr('height', 13)
      .attr('rx', 4)
      .attr('fill', 'rgba(0,0,0,0.85)')
      .attr('stroke', (d: any) => nodeColorMap[d.type as LineageNodeType]?.stroke || '#94A3B8')
      .attr('stroke-width', 0.8);

    node.append('text')
      .attr('y', -23)
      .attr('text-anchor', 'middle')
      .attr('font-size', '8px')
      .attr('font-family', 'ui-monospace, SFMono-Regular, monospace')
      .attr('font-weight', 'bold')
      .attr('fill', (d: any) => nodeColorMap[d.type as LineageNodeType]?.accent || '#ffffff')
      .text((d: any) => `L${d.stageIndex}`);

    // Main Node Text Label
    node.append('text')
      .attr('y', 33)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('font-family', '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif')
      .attr('font-weight', (d: any) => d.id === selectedNodeId ? 'bold' : '500')
      .attr('fill', (d: any) => d.id === selectedNodeId ? '#ffffff' : '#cbd5e1')
      .text((d: any) => d.shortLabel);

    // Subtext / Citation
    node.append('text')
      .attr('y', 45)
      .attr('text-anchor', 'middle')
      .attr('font-size', '8px')
      .attr('font-family', 'ui-monospace, SFMono-Regular, monospace')
      .attr('fill', 'rgba(255, 255, 255, 0.45)')
      .text((d: any) => {
        if (d.computedValue) return d.computedValue.slice(0, 16);
        return d.type;
      });

    // Simulation Tick
    simulation.on('tick', () => {
      linkLine
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      linkGlow
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      linkLabel
        .attr('x', (d: any) => (d.source.x + d.target.x) / 2)
        .attr('y', (d: any) => (d.source.y + d.target.y) / 2);

      node.attr('transform', (d: any) => `translate(${d.x}, ${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [activePreset, selectedNodeId, activeTracePathIds]);

  const handleStepForward = () => {
    setPlaybackStepIndex(prev => {
      const next = Math.min(activePreset.nodes.length - 1, prev + 1);
      const target = activePreset.nodes[next];
      if (target) setSelectedNodeId(target.id);
      return next;
    });
  };

  const handleStepBackward = () => {
    setPlaybackStepIndex(prev => {
      const next = Math.max(0, prev - 1);
      const target = activePreset.nodes[next];
      if (target) setSelectedNodeId(target.id);
      return next;
    });
  };

  const handleResetTrace = () => {
    setIsPlaying(false);
    setSelectedNodeId(activePreset.rootOutputNodeId);
    setPlaybackStepIndex(activePreset.nodes.length - 1);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      
      {/* Top Controls Bar: Presets & Trace Direction */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-4 rounded-2xl bg-black/60 border border-white/10">
        
        {/* Preset Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <GitCommit className="w-3.5 h-3.5" />
            <span>Lineage Path:</span>
          </span>
          <div className="flex flex-wrap gap-1.5">
            {CANONICAL_LINEAGE_PRESETS.map(preset => (
              <button
                key={preset.id}
                onClick={() => {
                  setActivePresetId(preset.id);
                  setIsPlaying(false);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  activePresetId === preset.id
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                {preset.title.split(' ')[0]} {preset.title.split(' ')[1]}…
              </button>
            ))}
          </div>
        </div>

        {/* Playback Controls & Tracing Direction */}
        <div className="flex items-center gap-2 self-end lg:self-center">
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
            <button
              onClick={() => setTraceDirection(traceDirection === 'BACKWARDS' ? 'FORWARDS' : 'BACKWARDS')}
              className="px-2 py-1 rounded-lg text-[10px] font-mono font-semibold text-zinc-300 hover:text-white bg-white/10 transition-colors cursor-pointer"
              title="Toggle Backwards Lineage vs Forwards State Transition"
            >
              Mode: {traceDirection}
            </button>
            <button
              onClick={handleStepBackward}
              className="p-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-white/10 cursor-pointer"
              title="Step Backward"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                isPlaying ? 'bg-emerald-500 text-black font-bold' : 'text-zinc-300 hover:text-white hover:bg-white/10'
              }`}
              title={isPlaying ? 'Pause Auto Trace' : 'Auto Play Lineage Trace'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={handleStepForward}
              className="p-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-white/10 cursor-pointer"
              title="Step Forward"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetTrace}
              className="p-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-white/10 cursor-pointer"
              title="Reset Trace to Output Root"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* Main Graph Canvas & Interactive Inspector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* D3 SVG Canvas (8 cols) */}
        <div 
          ref={containerRef}
          className="lg:col-span-8 bg-[#040814] rounded-3xl border border-white/10 p-4 relative overflow-hidden shadow-2xl flex flex-col justify-between"
        >
          {/* Top Banner on Canvas */}
          <div className="flex items-center justify-between text-xs pb-3 border-b border-white/10 z-10 relative">
            <div>
              <div className="font-bold text-white flex items-center gap-2">
                <span>{activePreset.title}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  {activePreset.nodes.length} Nodes · {activePreset.edges.length} Transitions
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">{activePreset.description}</p>
            </div>
            <div className="text-[10px] font-mono text-zinc-400 hidden sm:block">
              {activeTracePathIds.nodeIds.size} Active in Trace Path
            </div>
          </div>

          {/* SVG Graph View */}
          <div className="w-full h-[440px] my-2 relative">
            <svg ref={svgRef} className="w-full h-full block cursor-grab active:cursor-grabbing" />
          </div>

          {/* Canvas Bottom Legend */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-[10px] font-mono pt-3 border-t border-white/10 text-zinc-400 z-10 relative">
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>State S_t</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                <span>Event e_t</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span>Regime ρ</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
                <span>Tax Layer</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-pink-500"></span>
                <span>K-1 Output</span>
              </span>
            </div>
            <div>
              <span>Drag nodes to re-layout · Scroll to zoom · Click to trace lineage</span>
            </div>
          </div>

        </div>

        {/* Selected Step Lineage Inspector (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {selectedNode ? (
            <div className="bg-zinc-950/90 rounded-3xl border border-white/15 p-5 space-y-4 text-xs">
              
              {/* Header */}
              <div className="border-b border-white/10 pb-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-emerald-400">
                    Stage L{selectedNode.stageIndex} · {selectedNode.type}
                  </span>
                  {selectedNode.validDate && (
                    <span className="text-[10px] font-mono text-zinc-400">
                      t_v: {selectedNode.validDate}
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-white mt-1 leading-snug">
                  {selectedNode.label}
                </h3>
                <p className="text-[11px] text-zinc-300 mt-1">{selectedNode.subtext}</p>
              </div>

              {/* Mathematical Equation & Transition Formula */}
              {selectedNode.mathematicalExpression && (
                <div className="p-3 rounded-2xl bg-black/70 border border-white/10 space-y-1.5">
                  <span className="text-[10px] font-mono font-bold uppercase text-cyan-300 flex items-center gap-1">
                    <Calculator className="w-3 h-3" />
                    <span>State Equation / Invariant</span>
                  </span>
                  <div className="py-1 text-center overflow-x-auto custom-scrollbar">
                    <MathView math={selectedNode.mathematicalExpression} block />
                  </div>
                </div>
              )}

              {/* Evaluated Value & Citations */}
              <div className="grid grid-cols-1 gap-2">
                {selectedNode.computedValue && (
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-0.5">
                    <span className="text-[10px] font-mono uppercase text-zinc-400">Evaluated Value:</span>
                    <div className="font-mono text-sm font-bold text-emerald-300 select-all">
                      {selectedNode.computedValue}
                    </div>
                  </div>
                )}

                {selectedNode.authorityCitation && (
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-0.5">
                    <span className="text-[10px] font-mono uppercase text-amber-300">Statutory Authority:</span>
                    <div className="font-mono text-[11px] text-white">
                      {selectedNode.authorityCitation}
                    </div>
                  </div>
                )}

                {selectedNode.sourceFiling && (
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-0.5">
                    <span className="text-[10px] font-mono uppercase text-purple-300">Evidentiary Grounding:</span>
                    <div className="font-mono text-[11px] text-zinc-200">
                      {selectedNode.sourceFiling}
                    </div>
                  </div>
                )}
              </div>

              {/* Input Variables */}
              {selectedNode.inputs && selectedNode.inputs.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-zinc-400 block">
                    Ancestor Input Dependencies:
                  </span>
                  <div className="space-y-1">
                    {selectedNode.inputs.map((inp, idx) => (
                      <div key={idx} className="p-2 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-[11px]">
                        <span className="text-zinc-300 font-medium">{inp.name}:</span>
                        <div className="text-right">
                          <span className="font-mono font-bold text-white block">{inp.value}</span>
                          <span className="text-[9px] font-mono text-zinc-500">[{inp.origin}]</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sensitivity Derivative & Invariants */}
              {selectedNode.sensitivityDerivative && (
                <div className="p-2.5 rounded-xl bg-blue-950/30 border border-blue-500/20 text-[11px] space-y-1">
                  <div className="font-bold text-blue-300 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>Jacobian Sensitivity:</span>
                  </div>
                  <div className="font-mono text-zinc-200 text-[10px]">
                    {selectedNode.sensitivityDerivative}
                  </div>
                </div>
              )}

              {/* Invariants Preserved */}
              {selectedNode.invariantsPreserved && selectedNode.invariantsPreserved.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedNode.invariantsPreserved.map((inv, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      <ShieldCheck className="w-2.5 h-2.5" />
                      <span>{inv}</span>
                    </span>
                  ))}
                </div>
              )}

            </div>
          ) : (
            <div className="p-8 rounded-3xl bg-zinc-950/80 border border-white/10 text-center text-zinc-400">
              Select any node in the lineage DAG to inspect the mathematical state vector and provenance chain.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
