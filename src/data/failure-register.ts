/**
 * Empirical Failure Register for POC1 Validation
 * Formal classification of breakdown points across 10 failure categories:
 * Representation, Event, Rule, Ordering, Data, Provenance, Version, Propagation, Calculation, Observability
 */

import { FailureClass, BoundaryStatus } from '../types/tax-state';

export interface FailureRecord {
  failureId: string;
  caseName: string;
  failureType: FailureClass;
  missingInformation: string;
  stateImpact: string;
  boundaryOutcome: BoundaryStatus;
  rootCause: string;
  consequence: string;
  proposedStateAugmentation: string;
  mathematicalExpression: string;
}

export const FAILURE_REGISTER: FailureRecord[] = [
  {
    failureId: 'FAIL-REP-01',
    caseName: 'Pershing Square L.P. (Contributed Appreciated Stock)',
    failureType: 'Representation',
    missingInformation: 'Partner-specific unamortized §704(c) built-in gain layer tracking was collapsed into aggregate net capital.',
    stateImpact: 'Upon partial sale of portfolio asset at $260M, tax gain allocation to contributing partner could not be isolated from pro-rata §704(b) book gain.',
    boundaryOutcome: 'Review',
    rootCause: 'The initial state model stored only partner total tax basis and book capital without keeping explicit per-asset §704(c) layer tuples (propertyId, contributor, origDisparity, remainingDisparity).',
    consequence: 'Later §704(c) allocations could not be reconstructed without reading the entire historical contribution event sequence, violating State Sufficiency hypothesis H1.',
    proposedStateAugmentation: 'Add Section704cLayer[] as persistent state in A_t with explicit propertyId and contributorPartnerId references.',
    mathematicalExpression: 'C_{t+1}^{704(c)} = C_t^{704(c)} + \\Delta C^{704(c)}(e_t)'
  },
  {
    failureId: 'FAIL-OBS-02',
    caseName: 'Elliott Associates, L.P. (Secondary Partnership Transfer)',
    failureType: 'Observability',
    missingInformation: 'Form ADV Part 1A and Form D/A do not disclose whether Form 1065 contained a timely Section 754 election.',
    stateImpact: 'System cannot determine whether to calculate a Section 743(b) basis step-up ($31.1M) or leave inside asset basis unchanged.',
    boundaryOutcome: 'Review',
    rootCause: 'Public SEC filings disclose organizational existence and offering volumes, but federal tax elections are filed confidentially on IRS Form 1065 Schedule B.',
    consequence: 'State evolution cannot proceed deterministically on public data alone without a human determination asserting election status.',
    proposedStateAugmentation: 'Model Section 754 election status in C_t with evidentiary status (Observed vs Inferred vs Unknown) and explicit human determination prompt.',
    mathematicalExpression: '\\neg Closed(S_t, e_t) \\implies \\Gamma(S_t, e_t) = Review'
  },
  {
    failureId: 'FAIL-PROP-03',
    caseName: 'Adams Street Global Secondary Fund (Cascading Tiered 743(b))',
    failureType: 'Propagation',
    missingInformation: 'Upper-Tier Partnership (UTP) transfer occurred, but status of Section 754 election in Lower-Tier Partnership (LTP) was unconfirmed.',
    stateImpact: 'Basis adjustment was incorrectly propagated down to LTP portfolio asset basis without verifying lower-tier election.',
    boundaryOutcome: 'Review',
    rootCause: 'Naive graph reachability assumed step-up cascades transitively: UTP -> LTP -> Asset. Under Rev. Rul. 87-115, basis adjustment only penetrates if BOTH partnerships have § 754 active.',
    consequence: 'System calculated illegal inside basis step-up on lower-tier assets, creating an invariant violation between tax basis and true tax books.',
    proposedStateAugmentation: 'Condition lower-tier propagation on dual election invariant: HasSection754(UTP) \\land HasSection754(LTP).',
    mathematicalExpression: 'Reach(x_{UTP}) \\cap LTP_{assets} = \\emptyset \\quad \\text{if} \\quad \\neg Section754(LTP)'
  },
  {
    failureId: 'FAIL-ORD-04',
    caseName: 'Blackstone Real Estate Partners (Transfer and Cash Distribution)',
    failureType: 'Ordering',
    missingInformation: 'Commutativity assumption failed when a partner interest transfer ($82.5M) and a large quarterly cash distribution ($15M) occurred in the same quarter without transaction timestamps.',
    stateImpact: 'Applying transfer before distribution yielded transferee outside basis of $82.5M and distribution gain of $0; reversing the order caused transferor basis reduction to $36.4M and distinct capital gain on sale.',
    boundaryOutcome: 'Closed',
    rootCause: 'IRC §§ 731, 741, and 743(b) do not commute. Partnership distributions reduce basis immediately before sales, altering realized gain and step-up magnitude.',
    consequence: '\\delta(\\delta(S, e_{distrib}), e_{transfer}) \\neq \\delta(\\delta(S, e_{transfer}), e_{distrib}). Timestamp resolution must enforce legal intra-day priority.',
    proposedStateAugmentation: 'Add sequence priority ordinal to TaxEvent: distributions legally precede mid-period transfers unless agreement specifies closing of the books method.',
    mathematicalExpression: 'e_a \\not\\bowtie_S e_b \\iff \\delta(\\delta(S, e_a), e_b) \\neq \\delta(\\delta(S, e_b), e_a)'
  },
  {
    failureId: 'FAIL-CALC-05',
    caseName: 'Pershing Square L.P. (Traditional Method Ceiling Rule Distortion)',
    failureType: 'Calculation',
    missingInformation: 'Ceiling Rule capped tax gain allocation to non-contributing partners below their book gain, creating phantom disparity.',
    stateImpact: 'Book gain was $10M per partner, but realized partnership tax gain was only $14M instead of $20M needed to match book. $6M tax shortfall occurred.',
    boundaryOutcome: 'Closed',
    rootCause: 'Traditional method under Treas. Reg. § 1.704-3(b)(1) forbids creating artificial tax gain. The calculation engine initially attempted to allocate pro-rata tax gain without checking partnership-level realized ceiling.',
    consequence: 'Sum of partner tax capital accounts diverged from total partnership inside tax basis, triggering invariant alert.',
    proposedStateAugmentation: 'Track CeilingRuleShortfall explicitly as a derived attribute in Section704cLayer, or transition to Remedial Allocation Method under Reg. § 1.704-3(d).',
    mathematicalExpression: '\\sum \\text{TaxGain}_{alloc} \\le \\text{RealizedTaxGain}_{partnership}'
  },
  {
    failureId: 'FAIL-RULE-06',
    caseName: 'Blackstone Real Estate Partners IX (Mortgage Debt Allocation)',
    failureType: 'Rule',
    missingInformation: 'Event involved $1.2B non-recourse mortgage debt refinancing in underlying SPV.',
    stateImpact: 'Attempted to map debt proceeds into §704(b) capital accounts, causing fatal invariant mismatch.',
    boundaryOutcome: 'Reject',
    rootCause: 'Mortgage liabilities are governed by IRC § 752 (partner share of partnership liabilities), which increases outside tax basis (§705) without altering §704(b) equity capital.',
    consequence: 'System attempted to process §752 liabilities inside POC1 domain D={§704(b), §704(c), §743(b), §754}, corrupting partner capital accounts.',
    proposedStateAugmentation: 'Explicitly classify IRC § 752 debt allocations as OUTSIDE_INITIAL_DOMAIN and halt state transition with deterministic boundary rejection.',
    mathematicalExpression: 'e_t \\notin D \\implies \\Gamma(S_t, e_t) = Reject'
  },
  {
    failureId: 'FAIL-VER-07',
    caseName: 'KKR North America Fund XI (Substantial Built-In Loss Rule Change)',
    failureType: 'Version',
    missingInformation: 'Transfer of partnership interest in 2018 with $350k built-in loss evaluated under pre-2004 AJCA / TCJA rule set.',
    stateImpact: 'System assumed no §743(b) adjustment occurred because partnership had not filed a §754 election.',
    boundaryOutcome: 'Closed',
    rootCause: 'Under TCJA 2017 amendments to IRC § 743(d), basis reduction is MANDATORY if partnership has a substantial built-in loss exceeding $250,000, regardless of §754 election.',
    consequence: 'Historical replay failed when applying 2002 rules to 2018 transactions. State transition function must be explicitly parameterized by rule version \\rho_t.',
    proposedStateAugmentation: 'Incorporate substantialBuiltInLoss743d checker into A_t conditioned on effective statutory version in V_t.',
    mathematicalExpression: 'S_{t+1} = \\delta(S_t, e_t, \\rho_t) \\quad \\text{where} \\quad \\rho_{2018} \\neq \\rho_{2002}'
  },
  {
    failureId: 'FAIL-DATA-08',
    caseName: 'Hamilton Lane Private Assets Fund (Amended Schedule K-1)',
    failureType: 'Data',
    missingInformation: 'Underlying private equity fund issued an amended Schedule K-1 with valid date t=2021-12-31 but record date t=2023-09-15.',
    stateImpact: 'Without bitemporal modeling, updating state at 2023 corrupted historical snapshots generated for 2021 and 2022 tax returns.',
    boundaryOutcome: 'Closed',
    rootCause: 'Single-timestamp databases overwrite historical records, conflating when an economic event occurred with when the information was received.',
    consequence: 'Audit trail for original tax return filing was destroyed. Inability to generate retroactive variance explanation.',
    proposedStateAugmentation: 'Full bitemporal fact tuple f = (v, t_v^{start}, t_v^{end}, t_r^{start}, t_r^{end}) allowing replay across both valid-time and record-time axes.',
    mathematicalExpression: '\\Delta S_k = S_k\' - S_k \\implies S_k\' \\xrightarrow{Replay} S_n\''
  },
  {
    failureId: 'FAIL-PROV-09',
    caseName: 'Bridgewater Pure Alpha II (Cayman Feeder Offshore Revaluation)',
    failureType: 'Provenance',
    missingInformation: 'Quarterly NAV book-up of $450M lacked source document citation linking to independent audit report.',
    stateImpact: 'Capital accounts increased without traceable evidential foundation.',
    boundaryOutcome: 'Review',
    rootCause: 'Informal management spreadsheets lacked provenance mapping \\pi: Y \\to D \\times F \\times R \\times V \\times O.',
    consequence: 'Tax authorities or auditors could not verify whether book-up met Treas. Reg. § 1.704-1(b)(2)(iv)(f) securities valuation standards.',
    proposedStateAugmentation: 'Enforce non-empty ProvenanceRecord in P_t for any state variable delta exceeding $10,000.',
    mathematicalExpression: '\\pi(Y) \\in D \\times F \\times R \\times V \\times O'
  },
  {
    failureId: 'FAIL-EVENT-10',
    caseName: 'Carlyle Global Partners (GP-Led Continuation Fund Rollover)',
    failureType: 'Event',
    missingInformation: 'Event bundled asset sale to continuation vehicle with rolling LP equity rollover into a single generic "Restructuring" label.',
    stateImpact: 'Engine could not determine whether cash distributions were taxable under §731 or non-recognition rollover units under §721.',
    boundaryOutcome: 'Review',
    rootCause: 'Event granularity was too coarse. Multi-step corporate/partnership reorganizations must be decomposed into atomic event sequences.',
    consequence: 'Ambiguity halted state transition. Required tax partner review to decompose the step-transaction into distinct contribution and distribution events.',
    proposedStateAugmentation: 'Atomic event decomposition protocol: ContinuationVehicleTransfer must break into (1) AssetRevaluation, (2) CashOutDistribution, (3) RolloverContribution.',
    mathematicalExpression: 'e_{complex} \\to (e_1, e_2, \\dots, e_m) \\quad \\text{with strict sequential order}'
  }
];
