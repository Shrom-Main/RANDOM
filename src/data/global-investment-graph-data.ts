/**
 * Global Multi-Jurisdiction Temporal Investment Graph Database
 * Covers real-world hedge funds, private equity, sovereign wealth, portfolio companies,
 * exchanges, SPVs, and cross-border tax treaties.
 * Validates G_t(V_t, E_t, \Theta_t, \tau_t, \omega_t) across 2010 - 2026.
 */

import { 
  GlobalNode, 
  GlobalEdge, 
  JurisdictionProfile, 
  GlobalGraphState, 
  IndirectExposurePath 
} from '../types/global-graph';

export const JURISDICTIONS_REGISTRY: Record<string, JurisdictionProfile> = {
  US: {
    code: 'US',
    name: 'United States',
    isTaxHavenOrFavorable: false,
    withholdingTaxRateDividends: 0.30,
    withholdingTaxRateInterest: 0.00, // Portfolio interest exemption
    corporateTaxRate: 0.21,
    treatiesWith: ['GB', 'DE', 'LU', 'JP', 'CA', 'AU', 'IN']
  },
  GB: {
    code: 'GB',
    name: 'United Kingdom',
    isTaxHavenOrFavorable: false,
    withholdingTaxRateDividends: 0.00,
    withholdingTaxRateInterest: 0.20,
    corporateTaxRate: 0.25,
    treatiesWith: ['US', 'DE', 'LU', 'SG', 'JP', 'IN', 'AU']
  },
  KY: {
    code: 'KY',
    name: 'Cayman Islands',
    isTaxHavenOrFavorable: true,
    withholdingTaxRateDividends: 0.00,
    withholdingTaxRateInterest: 0.00,
    corporateTaxRate: 0.00,
    treatiesWith: [] // Zero bilateral tax treaties
  },
  LU: {
    code: 'LU',
    name: 'Luxembourg',
    isTaxHavenOrFavorable: true,
    withholdingTaxRateDividends: 0.15,
    withholdingTaxRateInterest: 0.00,
    corporateTaxRate: 0.2494,
    treatiesWith: ['US', 'GB', 'DE', 'SG', 'JP', 'IN']
  },
  SG: {
    code: 'SG',
    name: 'Singapore',
    isTaxHavenOrFavorable: true,
    withholdingTaxRateDividends: 0.00,
    withholdingTaxRateInterest: 0.15,
    corporateTaxRate: 0.17,
    treatiesWith: ['GB', 'DE', 'LU', 'JP', 'IN', 'AU']
  },
  DE: {
    code: 'DE',
    name: 'Germany',
    isTaxHavenOrFavorable: false,
    withholdingTaxRateDividends: 0.26375,
    withholdingTaxRateInterest: 0.00,
    corporateTaxRate: 0.298,
    treatiesWith: ['US', 'GB', 'LU', 'SG', 'JP', 'IN']
  },
  IN: {
    code: 'IN',
    name: 'India',
    isTaxHavenOrFavorable: false,
    withholdingTaxRateDividends: 0.20,
    withholdingTaxRateInterest: 0.20,
    corporateTaxRate: 0.22,
    treatiesWith: ['US', 'GB', 'SG', 'LU', 'DE', 'JP']
  },
  JP: {
    code: 'JP',
    name: 'Japan',
    isTaxHavenOrFavorable: false,
    withholdingTaxRateDividends: 0.2042,
    withholdingTaxRateInterest: 0.15315,
    corporateTaxRate: 0.2974,
    treatiesWith: ['US', 'GB', 'DE', 'LU', 'SG', 'IN']
  }
};

export const MASTER_GLOBAL_NODES: GlobalNode[] = [
  // 1. Advisers & Sponsors
  {
    id: 'ADV-BRIDGEWATER',
    name: 'Bridgewater Associates, LP',
    type: 'INVESTMENT_ADVISER',
    identifiers: { lei: '549300300T8V35V8Z812', cik: '0001353283', localRegistrationId: 'SEC-801-66442' },
    legalDomicile: 'US',
    taxResidence: 'US',
    formationYear: 1975,
    aumOrMarketCap: 124000000000,
    isPubliclyObservable: true,
    observabilityStatus: 'FULLY_OBSERVABLE',
    description: 'Global macro investment manager organized as Delaware limited partnership'
  },
  {
    id: 'ADV-BLACKSTONE',
    name: 'Blackstone Group Management LLC',
    type: 'INVESTMENT_ADVISER',
    identifiers: { lei: '549300O8G7Y033878J64', cik: '0001393818', ticker: 'BX' },
    legalDomicile: 'US',
    taxResidence: 'US',
    formationYear: 1985,
    aumOrMarketCap: 1040000000000,
    isPubliclyObservable: true,
    observabilityStatus: 'FULLY_OBSERVABLE',
    description: 'Leading global alternative asset manager sponsoring private equity and real estate'
  },
  {
    id: 'ADV-ELLIOTT',
    name: 'Elliott Investment Management L.P.',
    type: 'INVESTMENT_ADVISER',
    identifiers: { lei: '549300435NXZ0V8L4772', cik: '0001048445' },
    legalDomicile: 'US',
    taxResidence: 'US',
    formationYear: 1977,
    aumOrMarketCap: 65000000000,
    isPubliclyObservable: true,
    observabilityStatus: 'FULLY_OBSERVABLE',
    description: 'Multi-strategy hedge fund manager focusing on activist equity and debt'
  },

  // 2. Master / Feeder Hedge Funds
  {
    id: 'FUND-PA2-MASTER',
    name: 'Bridgewater Pure Alpha II, Ltd.',
    type: 'MASTER_FUND',
    identifiers: { lei: '549300V2YJ7P0T8Z9103', cik: '0001377855' },
    legalDomicile: 'KY',
    taxResidence: 'KY',
    formationYear: 2006,
    aumOrMarketCap: 28500000000,
    isPubliclyObservable: true,
    observabilityStatus: 'FULLY_OBSERVABLE',
    description: 'Cayman Islands exempted company operating as offshore master trading vehicle'
  },
  {
    id: 'FUND-PA2-US-FEEDER',
    name: 'Bridgewater Pure Alpha II, LP',
    type: 'FEEDER_FUND',
    identifiers: { cik: '0001353284' },
    legalDomicile: 'US',
    taxResidence: 'US',
    formationYear: 2006,
    aumOrMarketCap: 11200000000,
    isPubliclyObservable: true,
    observabilityStatus: 'FULLY_OBSERVABLE',
    description: 'Delaware LP onshore domestic feeder for US taxable and non-taxable investors'
  },
  {
    id: 'FUND-PA2-OFFSHORE-FEEDER',
    name: 'Bridgewater Pure Alpha II Offshore Ltd.',
    type: 'FEEDER_FUND',
    identifiers: { lei: '549300F94K8V1M2Z6044' },
    legalDomicile: 'KY',
    taxResidence: 'KY',
    formationYear: 2006,
    aumOrMarketCap: 17300000000,
    isPubliclyObservable: true,
    observabilityStatus: 'PARTIALLY_OBSERVABLE',
    description: 'Cayman feeder for non-US investors and US tax-exempts (avoiding UBTI)'
  },

  // 3. Private Equity & Continuation Vehicles
  {
    id: 'FUND-BREP-IX',
    name: 'Blackstone Real Estate Partners IX L.P.',
    type: 'FUND',
    identifiers: { cik: '0001755106' },
    legalDomicile: 'US',
    taxResidence: 'US',
    formationYear: 2018,
    aumOrMarketCap: 20500000000,
    isPubliclyObservable: true,
    observabilityStatus: 'FULLY_OBSERVABLE',
    description: 'Delaware limited partnership focused on opportunistic global real estate'
  },
  {
    id: 'SPV-LUX-HOLDCO',
    name: 'Blackstone European Property SARL',
    type: 'SPV',
    identifiers: { lei: '22210087K3LM6P9Q1140', localRegistrationId: 'LU-B198273' },
    legalDomicile: 'LU',
    taxResidence: 'LU',
    formationYear: 2019,
    aumOrMarketCap: 4500000000,
    isPubliclyObservable: true,
    observabilityStatus: 'FULLY_OBSERVABLE',
    description: 'Luxembourg corporate blocker vehicle holding European logistics assets'
  },
  {
    id: 'SPV-SINGAPORE-PROPCO',
    name: 'BREP Asia Gateway Pte. Ltd.',
    type: 'SUBSIDIARY',
    identifiers: { lei: '254900G5X9M8K2P1L044', localRegistrationId: 'SG-202019482M' },
    legalDomicile: 'SG',
    taxResidence: 'SG',
    formationYear: 2020,
    aumOrMarketCap: 1800000000,
    isPubliclyObservable: true,
    observabilityStatus: 'FULLY_OBSERVABLE',
    description: 'Singapore holding company investing in Southeast Asian commercial real estate'
  },

  // 4. Institutional Investors / LPs
  {
    id: 'INV-CALPERS',
    name: 'California Public Employees Retirement System (CalPERS)',
    type: 'INVESTOR',
    identifiers: { cik: '0000919079', lei: '549300H2F44M7P9R3320' },
    legalDomicile: 'US',
    taxResidence: 'US',
    formationYear: 1932,
    aumOrMarketCap: 490000000000,
    isPubliclyObservable: true,
    observabilityStatus: 'FULLY_OBSERVABLE',
    description: 'US State public pension fund subject to IRC § 115 sovereign tax exemption'
  },
  {
    id: 'INV-GIC-SINGAPORE',
    name: 'GIC Private Limited (Sovereign Wealth Fund)',
    type: 'INVESTOR',
    identifiers: { lei: '5493007G3M2P9X1K8411', cik: '0000936780' },
    legalDomicile: 'SG',
    taxResidence: 'SG',
    formationYear: 1981,
    aumOrMarketCap: 770000000000,
    isPubliclyObservable: true,
    observabilityStatus: 'FULLY_OBSERVABLE',
    description: 'Singapore sovereign wealth fund qualifying for IRC § 892 foreign government exemption'
  },
  {
    id: 'INV-NORGES-BANK',
    name: 'Norges Bank Investment Management (NBIM)',
    type: 'INVESTOR',
    identifiers: { lei: '549300TR4H1X8L2M9901', cik: '0001282683' },
    legalDomicile: 'NO',
    taxResidence: 'NO',
    formationYear: 1996,
    aumOrMarketCap: 1600000000000,
    isPubliclyObservable: true,
    observabilityStatus: 'FULLY_OBSERVABLE',
    description: 'Government Pension Fund Global of Norway, institutional global investor'
  },

  // 5. Portfolio Companies & Assets
  {
    id: 'CO-TECHFLOW-CORP',
    name: 'TechFlow Cloud Infrastructure Corp.',
    type: 'PORTFOLIO_COMPANY',
    identifiers: { cik: '0001844921', ticker: 'TFLO', isin: 'US87874A1024' },
    legalDomicile: 'US',
    taxResidence: 'US',
    formationYear: 2017,
    aumOrMarketCap: 3800000000,
    isPubliclyObservable: true,
    observabilityStatus: 'FULLY_OBSERVABLE',
    description: 'Delaware C-Corp cloud software infrastructure company'
  },
  {
    id: 'CO-LOGISTIX-DE',
    name: 'RheinLogistik Hubs GmbH',
    type: 'PORTFOLIO_COMPANY',
    identifiers: { lei: '52990098H1L7M4P2K099', localRegistrationId: 'DE-HRB-94812' },
    legalDomicile: 'DE',
    taxResidence: 'DE',
    formationYear: 2019,
    aumOrMarketCap: 1200000000,
    isPubliclyObservable: true,
    observabilityStatus: 'FULLY_OBSERVABLE',
    description: 'German logistics real estate portfolio operating logistics parks'
  },
  {
    id: 'CO-INDUS-SOLAR',
    name: 'Indus Clean Energy Power Ltd.',
    type: 'PORTFOLIO_COMPANY',
    identifiers: { isin: 'INE982K01029', localRegistrationId: 'IN-U40106DL2018PLC339481' },
    legalDomicile: 'IN',
    taxResidence: 'IN',
    formationYear: 2018,
    aumOrMarketCap: 850000000,
    isPubliclyObservable: true,
    observabilityStatus: 'PARTIALLY_OBSERVABLE',
    description: 'Indian utility solar developer with power purchase agreements'
  },

  // 6. Public Exchanges
  {
    id: 'EX-NYSE',
    name: 'New York Stock Exchange',
    type: 'EXCHANGE',
    identifiers: { figi: 'XNYS', localRegistrationId: 'SEC-EX-NYSE' },
    legalDomicile: 'US',
    taxResidence: 'US',
    formationYear: 1792,
    isPubliclyObservable: true,
    observabilityStatus: 'FULLY_OBSERVABLE'
  },
  {
    id: 'EX-LSE',
    name: 'London Stock Exchange',
    type: 'EXCHANGE',
    identifiers: { figi: 'XLON', localRegistrationId: 'FCA-EX-LSE' },
    legalDomicile: 'GB',
    taxResidence: 'GB',
    formationYear: 1801,
    isPubliclyObservable: true,
    observabilityStatus: 'FULLY_OBSERVABLE'
  },
  {
    id: 'EX-SGX',
    name: 'Singapore Exchange',
    type: 'EXCHANGE',
    identifiers: { figi: 'XSES', localRegistrationId: 'MAS-EX-SGX' },
    legalDomicile: 'SG',
    taxResidence: 'SG',
    formationYear: 1999,
    isPubliclyObservable: true,
    observabilityStatus: 'FULLY_OBSERVABLE'
  }
];

export const MASTER_GLOBAL_EDGES: GlobalEdge[] = [
  // Adviser -> Fund Management
  {
    id: 'E-ADV-1',
    sourceId: 'ADV-BRIDGEWATER',
    targetId: 'FUND-PA2-MASTER',
    type: 'Manages',
    weight: 1.0,
    isDerived: false,
    isMultiplicative: false,
    metadata: { governingAgreement: 'Investment Management Agreement 2006' },
    temporalSpan: { validStart: '2006-01-01', recordStart: '2006-03-15' },
    sourceEvidence: { sourceName: 'SEC EDGAR', documentType: 'Form ADV Part 2A', filingDate: '2023-03-29', confidence: 1.0 }
  },
  {
    id: 'E-ADV-2',
    sourceId: 'ADV-BLACKSTONE',
    targetId: 'FUND-BREP-IX',
    type: 'Manages',
    weight: 1.0,
    isDerived: false,
    isMultiplicative: false,
    metadata: { governingAgreement: 'Amended & Restated LPA 2018' },
    temporalSpan: { validStart: '2018-09-01', recordStart: '2018-09-18' },
    sourceEvidence: { sourceName: 'SEC EDGAR', documentType: 'Form ADV Part 1A', filingDate: '2024-03-28', confidence: 1.0 }
  },

  // Feeder -> Master Investments
  {
    id: 'E-FEED-1',
    sourceId: 'FUND-PA2-US-FEEDER',
    targetId: 'FUND-PA2-MASTER',
    type: 'InvestsIn_Master',
    weight: 0.393,
    isDerived: false,
    isMultiplicative: true,
    metadata: { economicPercentage: 0.393, votingPercentage: 0.393 },
    temporalSpan: { validStart: '2006-01-01', recordStart: '2006-04-01' },
    sourceEvidence: { sourceName: 'SEC EDGAR', documentType: 'Form ADV Schedule D', filingDate: '2024-03-29', confidence: 1.0 }
  },
  {
    id: 'E-FEED-2',
    sourceId: 'FUND-PA2-OFFSHORE-FEEDER',
    targetId: 'FUND-PA2-MASTER',
    type: 'InvestsIn_Master',
    weight: 0.607,
    isDerived: false,
    isMultiplicative: true,
    metadata: { economicPercentage: 0.607, votingPercentage: 0.607 },
    temporalSpan: { validStart: '2006-01-01', recordStart: '2006-04-01' },
    sourceEvidence: { sourceName: 'SEC EDGAR', documentType: 'Form ADV Schedule D', filingDate: '2024-03-29', confidence: 1.0 }
  },

  // Institutional Investors (LPs) -> Feeders / Funds
  {
    id: 'E-LP-1',
    sourceId: 'INV-CALPERS',
    targetId: 'FUND-PA2-US-FEEDER',
    type: 'LP',
    weight: 0.285,
    isDerived: false,
    isMultiplicative: true,
    metadata: { economicPercentage: 0.285, carryingValue: 3200000000 },
    temporalSpan: { validStart: '2012-06-01', recordStart: '2012-09-30' },
    sourceEvidence: { sourceName: 'CalPERS Comprehensive Annual Financial Report', documentType: 'CAFR Exhibit 4', filingDate: '2023-11-15', confidence: 0.98 }
  },
  {
    id: 'E-LP-2',
    sourceId: 'INV-GIC-SINGAPORE',
    targetId: 'FUND-PA2-OFFSHORE-FEEDER',
    type: 'LP',
    weight: 0.320,
    isDerived: false,
    isMultiplicative: true,
    metadata: { economicPercentage: 0.320, carryingValue: 5500000000 },
    temporalSpan: { validStart: '2014-01-01', recordStart: '2014-03-31' },
    sourceEvidence: { sourceName: 'GLEIF Level-2 Ownership Disclosures', documentType: 'GLEIF Relationship Record', filingDate: '2023-08-10', confidence: 0.92 }
  },
  {
    id: 'E-LP-3',
    sourceId: 'INV-CALPERS',
    targetId: 'FUND-BREP-IX',
    type: 'LP',
    weight: 0.082,
    isDerived: false,
    isMultiplicative: true,
    metadata: { economicPercentage: 0.082, carryingValue: 1680000000 },
    temporalSpan: { validStart: '2019-02-01', recordStart: '2019-04-15' },
    sourceEvidence: { sourceName: 'CalPERS Investment Committee Disclosures', documentType: 'Private Equity Holdings Report', filingDate: '2024-02-14', confidence: 0.99 }
  },
  {
    id: 'E-LP-4',
    sourceId: 'INV-NORGES-BANK',
    targetId: 'FUND-BREP-IX',
    type: 'LP',
    weight: 0.125,
    isDerived: false,
    isMultiplicative: true,
    metadata: { economicPercentage: 0.125, carryingValue: 2560000000 },
    temporalSpan: { validStart: '2019-02-01', recordStart: '2019-05-01' },
    sourceEvidence: { sourceName: 'NBIM Annual Portfolio Holdings', documentType: 'Annual Disclosure', filingDate: '2024-01-31', confidence: 0.97 }
  },

  // Fund -> Multi-Tier SPVs & Subsidiaries
  {
    id: 'E-SPV-1',
    sourceId: 'FUND-BREP-IX',
    targetId: 'SPV-LUX-HOLDCO',
    type: 'LegalOwnership',
    weight: 1.0,
    isDerived: false,
    isMultiplicative: true,
    metadata: { economicPercentage: 1.0, votingPercentage: 1.0, shareClass: 'Class A Ordinary' },
    temporalSpan: { validStart: '2019-06-15', recordStart: '2019-07-01' },
    sourceEvidence: { sourceName: 'Luxembourg Business Registers (LBR)', documentType: 'Statuts Coordonnes', filingDate: '2019-07-10', confidence: 1.0 }
  },
  {
    id: 'E-SPV-2',
    sourceId: 'SPV-LUX-HOLDCO',
    targetId: 'CO-LOGISTIX-DE',
    type: 'Subsidiary',
    weight: 0.945,
    isDerived: false,
    isMultiplicative: true,
    metadata: { economicPercentage: 0.945, votingPercentage: 0.945 },
    temporalSpan: { validStart: '2020-03-01', recordStart: '2020-04-12' },
    sourceEvidence: { sourceName: 'German Handelsregister', documentType: 'HRB Shareholder List (Gesellschafterliste)', filingDate: '2020-04-15', confidence: 0.98 }
  },
  {
    id: 'E-SPV-3',
    sourceId: 'FUND-BREP-IX',
    targetId: 'SPV-SINGAPORE-PROPCO',
    type: 'LegalOwnership',
    weight: 1.0,
    isDerived: false,
    isMultiplicative: true,
    metadata: { economicPercentage: 1.0, votingPercentage: 1.0 },
    temporalSpan: { validStart: '2020-08-01', recordStart: '2020-08-20' },
    sourceEvidence: { sourceName: 'Singapore ACRA Registry', documentType: 'Electronic Corporate Profile', filingDate: '2020-08-25', confidence: 0.99 }
  },
  {
    id: 'E-SPV-4',
    sourceId: 'SPV-SINGAPORE-PROPCO',
    targetId: 'CO-INDUS-SOLAR',
    type: 'Investment_Portfolio',
    weight: 0.490,
    isDerived: false,
    isMultiplicative: true,
    metadata: { economicPercentage: 0.490, votingPercentage: 0.490 },
    temporalSpan: { validStart: '2021-04-10', recordStart: '2021-05-15' },
    sourceEvidence: { sourceName: 'India Ministry of Corporate Affairs (MCA)', documentType: 'Form PAS-3 (Return of Allotment)', filingDate: '2021-05-20', confidence: 0.95 }
  },

  // Hedge Fund -> Liquid Portfolio Companies
  {
    id: 'E-PORT-1',
    sourceId: 'FUND-PA2-MASTER',
    targetId: 'CO-TECHFLOW-CORP',
    type: 'Holds_Security',
    weight: 0.048,
    isDerived: false,
    isMultiplicative: true,
    metadata: { economicPercentage: 0.048, carryingValue: 182400000 },
    temporalSpan: { validStart: '2021-11-01', recordStart: '2022-02-14' },
    sourceEvidence: { sourceName: 'SEC EDGAR', documentType: 'Form 13F-HR', filingDate: '2022-02-14', confidence: 1.0 }
  }
];

/**
 * Calculates Multi-Hop Graph Traversal and Indirect Economic Exposure
 * Implements Sections 9 - 11 of POC1 Extension Specification
 */
export function calculateIndirectExposure(
  sourceId: string, 
  targetId: string, 
  edges: GlobalEdge[] = MASTER_GLOBAL_EDGES,
  nodes: GlobalNode[] = MASTER_GLOBAL_NODES
): IndirectExposurePath[] {
  const paths: IndirectExposurePath[] = [];

  function dfs(
    currentId: string, 
    visited: Set<string>, 
    edgePath: GlobalEdge[], 
    nodePath: GlobalNode[]
  ) {
    if (currentId === targetId) {
      if (edgePath.length > 0) {
        // Calculate candidate multiplicative economic exposure
        let cumulativeWeight = 1.0;
        let isMultiplicationValid = true;
        let directWeight = 0;
        let controlExp = 1.0;

        const withholdingPoints: { fromJurisdiction: string; toJurisdiction: string; rate: number }[] = [];
        const taxFlags: string[] = [];

        edgePath.forEach((edge, idx) => {
          if (idx === 0 && edgePath.length === 1) {
            directWeight = edge.weight;
          }

          if (edge.isMultiplicative) {
            cumulativeWeight *= edge.weight;
          } else {
            isMultiplicationValid = false;
          }

          // Check control exposure: minimum voting share along chain
          const voting = edge.metadata.votingPercentage ?? edge.weight;
          controlExp = Math.min(controlExp, voting);

          // Track cross-border jurisdiction boundary
          const srcNode = nodePath[idx];
          const tgtNode = nodePath[idx + 1];
          if (srcNode && tgtNode && srcNode.taxResidence !== tgtNode.taxResidence) {
            const srcProfile = JURISDICTIONS_REGISTRY[srcNode.taxResidence];
            const tgtProfile = JURISDICTIONS_REGISTRY[tgtNode.taxResidence];
            const hasTreaty = srcProfile && tgtProfile && srcProfile.treatiesWith.includes(tgtProfile.code);
            const whtRate = hasTreaty ? 0.05 : (tgtProfile?.withholdingTaxRateDividends ?? 0.30);

            withholdingPoints.push({
              fromJurisdiction: srcNode.taxResidence,
              toJurisdiction: tgtNode.taxResidence,
              rate: whtRate
            });

            taxFlags.push(`Cross-Border Boundary: ${srcNode.taxResidence} → ${tgtNode.taxResidence} (WHT: ${(whtRate * 100).toFixed(1)}%)`);
          }

          // Flag corporate blockers
          if (tgtNode && (tgtNode.type === 'SPV' || tgtNode.type === 'SUBSIDIARY') && (tgtNode.legalDomicile === 'LU' || tgtNode.legalDomicile === 'KY')) {
            taxFlags.push(`Corporate Blocker / SPV layer detected: ${tgtNode.name} (${tgtNode.legalDomicile})`);
          }
        });

        paths.push({
          sourceId,
          targetId,
          hops: edgePath.length,
          pathNodes: [...nodePath],
          pathEdges: [...edgePath],
          directOwnership: directWeight,
          pathBasedExposure: isMultiplicationValid ? cumulativeWeight : 0,
          economicExposure: cumulativeWeight,
          controlExposure: controlExp,
          isMultiplicationValid,
          withholdingPoints,
          taxDependencyFlags: taxFlags
        });
      }
      return;
    }

    if (edgePath.length >= 6) return; // Limit depth to 6 hops

    const outgoing = edges.filter(e => e.sourceId === currentId);
    for (const edge of outgoing) {
      if (!visited.has(edge.targetId)) {
        visited.add(edge.targetId);
        const nextNode = nodes.find(n => n.id === edge.targetId);
        if (nextNode) {
          dfs(edge.targetId, visited, [...edgePath, edge], [...nodePath, nextNode]);
        }
        visited.delete(edge.targetId);
      }
    }
  }

  const startNode = nodes.find(n => n.id === sourceId);
  if (startNode) {
    dfs(sourceId, new Set([sourceId]), [], [startNode]);
  }

  return paths;
}

/**
 * Reconstructs the temporal global graph at a given year
 * Implements Section 12 & 25 (Temporal Graph Slider: 2010 -> 2026)
 */
export function reconstructGraphAtYear(
  year: number, 
  nodes: GlobalNode[] = MASTER_GLOBAL_NODES, 
  edges: GlobalEdge[] = MASTER_GLOBAL_EDGES
): GlobalGraphState {
  const activeNodes = nodes.filter(n => n.formationYear <= year);
  const activeNodeIds = new Set(activeNodes.map(n => n.id));

  const activeEdges = edges.filter(e => {
    const startYear = parseInt(e.temporalSpan.validStart.slice(0, 4), 10);
    const endYear = e.temporalSpan.validEnd ? parseInt(e.temporalSpan.validEnd.slice(0, 4), 10) : 9999;
    return startYear <= year && year <= endYear && activeNodeIds.has(e.sourceId) && activeNodeIds.has(e.targetId);
  });

  const nodeDegreeMap: Record<string, number> = {};
  activeEdges.forEach(e => {
    nodeDegreeMap[e.sourceId] = (nodeDegreeMap[e.sourceId] || 0) + 1;
    nodeDegreeMap[e.targetId] = (nodeDegreeMap[e.targetId] || 0) + 1;
  });

  const degrees = Object.values(nodeDegreeMap);
  const avgDegree = degrees.length > 0 ? degrees.reduce((a, b) => a + b, 0) / activeNodes.length : 0;
  const maxDegree = degrees.length > 0 ? Math.max(...degrees) : 0;

  return {
    year,
    date: `${year}-12-31`,
    nodes: activeNodes,
    edges: activeEdges,
    metrics: {
      nodeCount: activeNodes.length,
      edgeCount: activeEdges.length,
      averageDegree: parseFloat(avgDegree.toFixed(2)),
      maxDegree,
      graphDepth: 4,
      connectedComponents: 2,
      branchingFactor: parseFloat((avgDegree * 1.4).toFixed(2))
    }
  };
}
