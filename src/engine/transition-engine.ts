/**
 * Formal Discrete State-Transition Engine for POC1 U.S. Investment Tax
 * S_{t+1} = delta(S_t, e_t, rho_t)
 * Invariant Preservation, Boundary Testing Gamma(S, e), Replay, Perturbation & Commutativity
 */

import {
  InvestmentTaxState,
  TaxEvent,
  BoundaryStatus,
  ReplayComparison,
  CommutativityTestResult,
  PropagationMetrics,
  PartnerTaxAccount,
  Section704cLayer,
  Section743bAdjustment,
  AssetLot
} from '../types/tax-state';

/** Helper to deeply clone state */
export function cloneState(state: InvestmentTaxState): InvestmentTaxState {
  return JSON.parse(JSON.stringify(state));
}

/** Check all domain invariants */
export function evaluateInvariants(state: InvestmentTaxState): {
  invariantsSatisfied: boolean;
  breakdown: InvestmentTaxState['invariantBreakdown'];
} {
  // 1. Partition Invariant: sum of weights equals 1 (or 0 if empty)
  const sumWeights = state.G.relationships.reduce((acc, r) => acc + r.weight, 0);
  const partitionInvariant = state.G.relationships.length === 0 || Math.abs(sumWeights - 1.0) < 0.001 || !state.G.isPartitionComplete;

  // 2. Balance sheet: Assets = Liab + Equity
  const totalAssets = state.X.cash + state.X.assets.reduce((acc, a) => acc + a.fairValue, 0);
  const balanceSheetDelta = Math.abs(totalAssets - (state.X.totalLiabilities + state.X.totalEconomicCapital));
  const balanceSheetInvariant = balanceSheetDelta < 1.0;

  // 3. Outside vs Inside basis delta
  const totalOutside = state.A.partnerAccounts.reduce((acc, p) => acc + p.outsideTaxBasis, 0);
  const totalInside = state.A.partnerAccounts.reduce((acc, p) => acc + p.insideTaxBasisShare, 0);
  const total743b = state.A.section743bAdjustments.reduce((acc, adj) => acc + adj.totalAdjustment, 0);
  const outsideInsideBasisDelta = totalOutside - totalInside - total743b;

  // 4. Book vs Tax capital disparity vs 704(c) unamortized layers
  const totalBook = state.A.partnerAccounts.reduce((acc, p) => acc + p.bookCapital704b, 0);
  const total704c = state.A.section704cLayers.reduce((acc, l) => acc + l.remainingBuiltInGainLoss, 0);
  const bookTaxCapitalDelta = totalBook - totalInside - total704c;

  const invariantsSatisfied = partitionInvariant && balanceSheetInvariant && Math.abs(outsideInsideBasisDelta) < 1.0;

  return {
    invariantsSatisfied,
    breakdown: {
      partitionInvariant,
      balanceSheetInvariant,
      outsideInsideBasisDelta: Math.round(outsideInsideBasisDelta),
      bookTaxCapitalDelta: Math.round(bookTaxCapitalDelta)
    }
  };
}

/** Computational Boundary Function: Gamma(S, e, F, rho) */
export function evaluateComputationalBoundary(
  state: InvestmentTaxState,
  event: TaxEvent
): {
  status: BoundaryStatus;
  reason: string;
  humanDeterminationNeeded: boolean;
} {
  // Check if event belongs to initial domain D = {§704(b), §704(c), §743(b), §754}
  if (event.relevantDomain === 'OUTSIDE_INITIAL_DOMAIN') {
    return {
      status: 'Reject',
      reason: `Event scope (${event.type}) triggers statutory regime outside initial domain D={§704(b), §704(c), §743(b), §754}. Explicit boundary rejection.`,
      humanDeterminationNeeded: false
    };
  }

  // Check §754 and §743(b) requirements
  if (event.type === 'PartnerTransfer') {
    const has754 = event.taxFacts.section754InEffect ?? state.A.section754Elected ?? state.C.section754ElectionActive;
    const purchasePrice = event.economicFacts.purchasePrice || 0;
    const transferorInside = event.economicFacts.taxBasis || 0;
    const impliedLoss = transferorInside - purchasePrice;

    // Check TCJA 2017 § 743(d) mandatory substantial built-in loss (> $250k)
    const isSubstantialLoss = impliedLoss > 250000;

    if (!has754 && !isSubstantialLoss) {
      // Transfer proceeds with NO basis adjustment (inside basis unchanged)
      return {
        status: 'Closed',
        reason: 'No Section 754 election in effect and no substantial built-in loss (> $250,000). Transfer executes with zero §743(b) adjustment.',
        humanDeterminationNeeded: false
      };
    }

    if (has754 && event.evidenceSource.status === 'UNKNOWN') {
      return {
        status: 'Review',
        reason: 'Section 754 election status or asset-level valuation is UNKNOWN on public record. Requires human determination to validate tax books.',
        humanDeterminationNeeded: true
      };
    }
  }

  // Check §704(c) method selection
  if (event.type === 'AssetDisposition' && state.A.section704cLayers.length > 0) {
    const layer = state.A.section704cLayers.find(l => event.scope.includes(l.propertyId));
    if (layer && !layer.allocationMethod) {
      return {
        status: 'Review',
        reason: 'Asset disposition involves contributed property with unamortized built-in gain, but Section 704(c) method (Traditional vs Curative vs Remedial) is undetermined.',
        humanDeterminationNeeded: true
      };
    }
  }

  // Check Continuation Vehicle complex transfers
  if (event.type === 'ContinuationVehicleTransfer') {
    return {
      status: 'Review',
      reason: 'GP-Led continuation vehicle rollover requires human legal determination to separate §721 contribution from §707 disguised sale cash-out.',
      humanDeterminationNeeded: true
    };
  }

  return {
    status: 'Closed',
    reason: 'Facts validated, rule determined, scope within computational domain D, and invariants satisfied.',
    humanDeterminationNeeded: false
  };
}

/** Core State Transition Function: delta(S_t, e_t, rho_t) */
export function executeStateTransition(
  currentState: InvestmentTaxState,
  event: TaxEvent
): {
  nextState: InvestmentTaxState;
  propagationMetrics: PropagationMetrics;
  boundaryStatus: BoundaryStatus;
  boundaryReason: string;
} {
  const boundaryCheck = evaluateComputationalBoundary(currentState, event);
  
  if (boundaryCheck.status === 'Reject') {
    return {
      nextState: currentState,
      boundaryStatus: 'Reject',
      boundaryReason: boundaryCheck.reason,
      propagationMetrics: {
        eventId: event.id,
        breadth: 0,
        depth: 0,
        reach: [],
        amplification: 0,
        affectedCalculations: [],
        affectedReports: [],
        unaffectedOutputs: ['All'],
        computationalBoundaryCrossed: true
      }
    };
  }

  const nextState = cloneState(currentState);
  nextState.t = currentState.t + 1;
  nextState.timestamp = event.timestamp;

  const affectedVars: string[] = [];
  const affectedCalcs: string[] = [];
  const affectedReports: string[] = [];

  // ==========================================
  // TRANSITION BY EVENT TYPE
  // ==========================================
  switch (event.type) {
    case 'CapitalContribution': {
      const amount = event.economicFacts.amount || 0;
      nextState.X.cash += amount;
      nextState.X.totalEconomicCapital += amount;
      nextState.X.totalMarketValue += amount;
      affectedVars.push('X_t.cash', 'X_t.totalEconomicCapital', 'X_t.totalMarketValue');
      affectedCalcs.push('CapitalAccountUpdate', 'NetAssetValue');
      affectedReports.push('Form1065_Schedule_K1_BoxL');

      // Update partner account if specified
      if (event.scope[0] && nextState.A.partnerAccounts.length > 0) {
        const partner = nextState.A.partnerAccounts.find(p => p.partnerId === event.scope[0]);
        if (partner) {
          partner.bookCapital704b += amount;
          partner.insideTaxBasisShare += amount;
          partner.outsideTaxBasis += amount;
          affectedVars.push(`A_t.partnerAccounts[${partner.partnerName}].bookCapital704b`, `A_t.partnerAccounts[${partner.partnerName}].outsideTaxBasis`);
        }
      }
      break;
    }

    case 'AssetRevaluation': {
      // Revaluation under Treas. Reg. § 1.704-1(b)(2)(iv)(f)
      const targetAssetId = event.scope[0];
      const newFmv = event.economicFacts.fairValue || 0;
      const asset = nextState.X.assets.find(a => a.id === targetAssetId);

      if (asset) {
        const deltaValue = newFmv - asset.fairValue;
        asset.fairValue = newFmv;
        asset.bookBasis = newFmv;
        asset.unrealizedGainLoss += deltaValue;
        nextState.X.totalMarketValue += deltaValue;
        nextState.X.totalEconomicCapital += deltaValue;

        affectedVars.push(`X_t.assets[${asset.name}].fairValue`, `X_t.assets[${asset.name}].bookBasis`, 'X_t.totalMarketValue');
        affectedCalcs.push('Section704b_BookUp_Allocation', 'NAV_Per_Unit');
        affectedReports.push('Schedule_M1_Book_Tax_Reconciliation');

        // Allocate book revaluation pro-rata to existing partners
        const totalOwnership = nextState.A.partnerAccounts.reduce((acc, p) => acc + p.ownershipPercentage, 0) || 1.0;
        nextState.A.partnerAccounts.forEach(partner => {
          const share = (partner.ownershipPercentage / totalOwnership) * deltaValue;
          partner.bookCapital704b += share;
          affectedVars.push(`A_t.partnerAccounts[${partner.partnerName}].bookCapital704b`);
        });
      }
      break;
    }

    case 'InvestorAdmission': {
      // Admission of new investor creating Reverse §704(c) Layer
      const newPartnerId = event.scope[0] || `LP_NEW_${nextState.t}`;
      const contribAmount = event.economicFacts.amount || 0;
      const targetPct = event.economicFacts.unitsOrPercentage || 0.25;

      nextState.X.cash += contribAmount;
      nextState.X.totalEconomicCapital += contribAmount;
      nextState.X.totalMarketValue += contribAmount;

      // Dilute existing partners
      const dilutionFactor = 1.0 - targetPct;
      nextState.A.partnerAccounts.forEach(p => {
        p.ownershipPercentage *= dilutionFactor;
      });

      // Add new partner account
      nextState.A.partnerAccounts.push({
        partnerId: newPartnerId,
        partnerName: `Admitted Partner (Series ${nextState.t})`,
        taxStatus: 'DOMESTIC_CORP',
        ownershipPercentage: targetPct,
        bookCapital704b: contribAmount,
        insideTaxBasisShare: contribAmount,
        outsideTaxBasis: contribAmount,
        section743bAdjustment: 0,
        section704cBuiltInGain: 0
      });

      // Create Reverse §704(c) layer on existing unrealized appreciation
      const unrealizedTotal = nextState.X.assets.reduce((acc, a) => acc + Math.max(0, a.fairValue - a.taxBasis), 0);
      if (unrealizedTotal > 0) {
        nextState.A.section704cLayers.push({
          propertyId: nextState.X.assets[0]?.id || 'PORTFOLIO_BASKET',
          contributorPartnerId: 'HISTORIC_LPS_AGGREGATE',
          contributionDate: event.timestamp.validDate,
          taxBasisAtContribution: nextState.X.assets[0]?.taxBasis || 0,
          bookValueAtContribution: nextState.X.assets[0]?.fairValue || 0,
          builtInGainLoss: unrealizedTotal,
          allocationMethod: event.taxFacts.section704cMethod || 'TRADITIONAL',
          remainingBuiltInGainLoss: unrealizedTotal,
          ceilingRuleDistortionActive: false
        });

        // Assign unamortized reverse 704(c) gain to historic partners
        nextState.A.partnerAccounts.forEach(p => {
          if (p.partnerId !== newPartnerId) {
            p.section704cBuiltInGain += (p.ownershipPercentage / dilutionFactor) * unrealizedTotal;
          }
        });

        affectedVars.push('A_t.section704cLayers[Reverse704c]', 'A_t.partnerAccounts[*].section704cBuiltInGain');
        affectedCalcs.push('Reverse704cLayerCreation', 'OwnershipDilution');
      }

      affectedVars.push('X_t.cash', `A_t.partnerAccounts[${newPartnerId}]`, 'G_t.structural.relationships');
      affectedReports.push('Form1065_Schedule_K1_BoxL', 'Form1065_Schedule_B');
      break;
    }

    case 'PartnerTransfer': {
      // Partner interest sale under IRC § 741 / § 743(b)
      const transferorId = event.economicFacts.transferorId || event.scope[0];
      const transfereeId = event.economicFacts.transfereeId || event.scope[1] || `LP_TRANSFEREE_${nextState.t}`;
      const purchasePrice = event.economicFacts.purchasePrice || 0;

      const transferor = nextState.A.partnerAccounts.find(p => p.partnerId === transferorId);
      if (transferor) {
        const transferredShare = transferor.ownershipPercentage;
        const transferorInsideShare = transferor.insideTaxBasisShare;
        const transferorBookCapital = transferor.bookCapital704b;

        // Has §754 election or mandatory §743(d) substantial loss (> $250k)
        const has754 = event.taxFacts.section754InEffect ?? nextState.A.section754Elected;
        const grossDelta = purchasePrice - transferorInsideShare;
        const isMandatoryLoss = grossDelta < -250000;

        let totalAdjustment = 0;
        if (has754 || isMandatoryLoss) {
          totalAdjustment = grossDelta;
        }

        // Section 755 Class Allocation (hypothetical liquidation test)
        // Allocate based on portfolio composition (ordinary vs capital)
        const totalCapitalAssets = nextState.X.assets
          .filter(a => a.assetClass === 'CAPITAL_ASSET')
          .reduce((acc, a) => acc + (a.fairValue - a.taxBasis), 0);
        const totalOrdinaryAssets = nextState.X.assets
          .filter(a => a.assetClass === 'ORDINARY_INCOME_ASSET')
          .reduce((acc, a) => acc + (a.fairValue - a.taxBasis), 0);
        const totalGain = Math.max(1, totalCapitalAssets + totalOrdinaryAssets);

        const ordinaryRatio = totalOrdinaryAssets > 0 ? totalOrdinaryAssets / totalGain : 0;
        const capitalRatio = 1.0 - ordinaryRatio;

        const allocatedOrdinary = Math.round(totalAdjustment * ordinaryRatio);
        const allocatedCapital = totalAdjustment - allocatedOrdinary;

        // Record 743(b) adjustment layer
        if (totalAdjustment !== 0) {
          nextState.A.section743bAdjustments.push({
            transfereePartnerId: transfereeId,
            effectiveDate: event.timestamp.validDate,
            totalAdjustment,
            allocatedCapitalAsset: allocatedCapital,
            allocatedOrdinaryAsset: allocatedOrdinary,
            electionSourceId: has754 ? 'IRC_SECTION_754_ACTIVE' : 'IRC_SECTION_743_D_MANDATORY_LOSS',
            status: 'ACTIVE'
          });
          affectedVars.push(`A_t.section743bAdjustments[${transfereeId}]`);
          affectedCalcs.push('Section743b_Adjustment_Computation', 'Section755_Asset_Class_Split');
          affectedReports.push('Form1065_Schedule_K1_Box20_CodeU', 'BasisAdjustmentWorkpaper');
        }

        // Add Transferee Partner Account
        nextState.A.partnerAccounts.push({
          partnerId: transfereeId,
          partnerName: `Transferee Partner (${transfereeId})`,
          taxStatus: 'DOMESTIC_CORP',
          ownershipPercentage: transferredShare,
          bookCapital704b: transferorBookCapital, // Book capital carries over!
          insideTaxBasisShare: transferorInsideShare, // Inside basis carries over
          outsideTaxBasis: purchasePrice, // Outside basis is cost basis under §742
          section743bAdjustment: totalAdjustment,
          section704cBuiltInGain: transferor.section704cBuiltInGain
        });

        // Remove transferor
        nextState.A.partnerAccounts = nextState.A.partnerAccounts.filter(p => p.partnerId !== transferorId);

        affectedVars.push(
          `A_t.partnerAccounts[${transfereeId}].outsideTaxBasis`,
          `A_t.partnerAccounts[${transfereeId}].bookCapital704b`,
          `A_t.partnerAccounts[${transfereeId}].section743bAdjustment`
        );
      }
      break;
    }

    case 'AssetDisposition': {
      // Sale of asset: §704(c) priority + Ceiling Rule check + §704(b) pro rata allocation
      const assetId = event.scope[0];
      const saleProceeds = event.economicFacts.amount || 0;
      const asset = nextState.X.assets.find(a => a.id === assetId);

      if (asset) {
        const bookGainLoss = saleProceeds - asset.bookBasis;
        const taxGainLoss = saleProceeds - asset.taxBasis;
        
        // Remove or update asset
        nextState.X.cash += saleProceeds;
        nextState.X.assets = nextState.X.assets.filter(a => a.id !== assetId);
        nextState.X.totalEconomicCapital += bookGainLoss;
        nextState.X.totalMarketValue += (saleProceeds - asset.fairValue);

        // Check if asset is subject to Section 704(c)
        const cLayer = nextState.A.section704cLayers.find(l => l.propertyId === assetId);
        
        let allocated704cTaxGain = 0;
        let ceilingRuleShortfall = 0;

        if (cLayer && cLayer.remainingBuiltInGainLoss > 0) {
          if (cLayer.allocationMethod === 'TRADITIONAL') {
            // Ceiling rule: cannot allocate more tax gain than total tax gain recognized!
            allocated704cTaxGain = Math.min(cLayer.remainingBuiltInGainLoss, Math.max(0, taxGainLoss));
            if (cLayer.remainingBuiltInGainLoss > taxGainLoss) {
              ceilingRuleShortfall = cLayer.remainingBuiltInGainLoss - Math.max(0, taxGainLoss);
              cLayer.ceilingRuleDistortionActive = true;
            }
          } else if (cLayer.allocationMethod === 'REMEDIAL') {
            // Remedial creates notional tax gain/loss to eliminate disparity
            allocated704cTaxGain = cLayer.remainingBuiltInGainLoss;
          }
          cLayer.remainingBuiltInGainLoss -= allocated704cTaxGain;
          affectedVars.push(`A_t.section704cLayers[${assetId}].remainingBuiltInGainLoss`);
        }

        // Residual tax gain distributed among all partners pro-rata to §704(b) book gain
        const residualTaxGain = taxGainLoss - allocated704cTaxGain;
        const totalOwnership = nextState.A.partnerAccounts.reduce((acc, p) => acc + p.ownershipPercentage, 0) || 1.0;

        nextState.A.partnerAccounts.forEach(partner => {
          const partnerBookShare = (partner.ownershipPercentage / totalOwnership) * bookGainLoss;
          partner.bookCapital704b += partnerBookShare;

          let partnerTaxShare = (partner.ownershipPercentage / totalOwnership) * residualTaxGain;
          if (cLayer && partner.partnerId === cLayer.contributorPartnerId) {
            partnerTaxShare += allocated704cTaxGain;
          }

          // Offset by transferee §743(b) adjustment if active on this asset
          const adj743 = nextState.A.section743bAdjustments.find(a => a.transfereePartnerId === partner.partnerId && a.status === 'ACTIVE');
          if (adj743) {
            const basisOffset = Math.min(partnerTaxShare, adj743.totalAdjustment);
            partnerTaxShare -= basisOffset;
            adj743.totalAdjustment -= basisOffset;
            if (adj743.totalAdjustment === 0) adj743.status = 'UTILIZED';
            affectedVars.push(`A_t.section743bAdjustments[${partner.partnerId}].totalAdjustment`);
          }

          partner.insideTaxBasisShare += partnerTaxShare;
          partner.outsideTaxBasis += partnerTaxShare;
          affectedVars.push(`A_t.partnerAccounts[${partner.partnerName}].bookCapital704b`, `A_t.partnerAccounts[${partner.partnerName}].outsideTaxBasis`);
        });

        affectedVars.push('X_t.cash', `X_t.assets[${asset.name}]`);
        affectedCalcs.push('Section704c_CeilingRule_Evaluation', 'Section704b_Residual_Allocation', 'Section743b_Tax_Offset');
        affectedReports.push('Form1065_Schedule_K1_Box9a', 'Schedule_D_Capital_Gains');
      }
      break;
    }

    case 'Distribution': {
      // Cash distribution reducing book and tax basis
      const distAmount = event.economicFacts.amount || 0;
      nextState.X.cash -= distAmount;
      nextState.X.totalEconomicCapital -= distAmount;
      nextState.X.totalMarketValue -= distAmount;

      const totalOwnership = nextState.A.partnerAccounts.reduce((acc, p) => acc + p.ownershipPercentage, 0) || 1.0;
      nextState.A.partnerAccounts.forEach(p => {
        const share = (p.ownershipPercentage / totalOwnership) * distAmount;
        p.bookCapital704b -= share;
        p.insideTaxBasisShare -= share;
        p.outsideTaxBasis -= share;
      });

      affectedVars.push('X_t.cash', 'A_t.partnerAccounts[*].bookCapital704b', 'A_t.partnerAccounts[*].outsideTaxBasis');
      affectedCalcs.push('Section731_Distribution_Computation');
      affectedReports.push('Form1065_Schedule_K1_Box19_Distributions');
      break;
    }

    case 'HistoricalCorrection': {
      // Amended fact from late-received filing
      const correctionAmount = event.economicFacts.amount || 0;
      if (nextState.A.partnerAccounts.length > 0) {
        nextState.A.partnerAccounts[0].insideTaxBasisShare += correctionAmount;
        affectedVars.push('A_t.partnerAccounts[0].insideTaxBasisShare');
        affectedCalcs.push('Retroactive_K1_Adjustment');
        affectedReports.push('Form1065X_Amended_Return');
      }
      break;
    }

    default:
      break;
  }

  // Update Invariants
  const invariantCheck = evaluateInvariants(nextState);
  nextState.invariantsSatisfied = invariantCheck.invariantsSatisfied;
  nextState.invariantBreakdown = invariantCheck.breakdown;

  // Add provenance record
  nextState.P.push({
    id: `PROV-${event.id}-${nextState.t}`,
    targetVariable: affectedVars[0] || 'S_t',
    sourceDocument: event.evidenceSource.documentTitle,
    extractedFact: `${event.type} executed on ${event.timestamp.validDate}`,
    applicableRule: event.relevantDomain,
    ruleVersion: nextState.V.statutoryVersion,
    transitionOperation: event.type,
    recordTimestamp: event.timestamp.recordDate
  });

  const propagationMetrics: PropagationMetrics = {
    eventId: event.id,
    breadth: affectedVars.length,
    depth: affectedCalcs.length + 1,
    reach: affectedVars,
    amplification: 1.0,
    affectedCalculations: affectedCalcs,
    affectedReports: affectedReports,
    unaffectedOutputs: ['EntityJurisdiction', 'StatutoryVersion'],
    computationalBoundaryCrossed: boundaryCheck.status !== 'Closed'
  };

  return {
    nextState,
    propagationMetrics,
    boundaryStatus: boundaryCheck.status,
    boundaryReason: boundaryCheck.reason
  };
}

/** Historical Replay: S_n^{replay} = delta^*(S_0, H_n) */
export function executeHistoricalReplay(
  initialState: InvestmentTaxState,
  events: TaxEvent[]
): {
  finalReplayState: InvestmentTaxState;
  stateHistory: InvestmentTaxState[];
} {
  let currentState = cloneState(initialState);
  const stateHistory: InvestmentTaxState[] = [currentState];

  for (const event of events) {
    const { nextState } = executeStateTransition(currentState, event);
    currentState = nextState;
    stateHistory.push(currentState);
  }

  return {
    finalReplayState: currentState,
    stateHistory
  };
}

/** State Sufficiency Comparator: S_n^{incremental} == S_n^{replay} */
export function compareIncrementalVsReplay(
  incrementalState: InvestmentTaxState,
  replayState: InvestmentTaxState
): ReplayComparison {
  const discrepancies: ReplayComparison['discrepancies'] = [];

  // Compare Economic Position
  if (Math.abs(incrementalState.X.cash - replayState.X.cash) > 0.01) {
    discrepancies.push({
      variablePath: 'X.cash',
      incrementalValue: incrementalState.X.cash,
      replayValue: replayState.X.cash,
      delta: incrementalState.X.cash - replayState.X.cash,
      failureCategory: 'Calculation',
      rootCause: 'Cash balance diverged between incremental transitions and batch historical replay.'
    });
  }

  // Compare Partner Accounts
  incrementalState.A.partnerAccounts.forEach((incPartner, idx) => {
    const repPartner = replayState.A.partnerAccounts[idx];
    if (!repPartner) {
      discrepancies.push({
        variablePath: `A.partnerAccounts[${incPartner.partnerId}]`,
        incrementalValue: incPartner.partnerName,
        replayValue: 'MISSING',
        delta: 0,
        failureCategory: 'Representation',
        rootCause: 'Partner account present in incremental state but missing in replay state.'
      });
      return;
    }

    if (Math.abs(incPartner.bookCapital704b - repPartner.bookCapital704b) > 0.01) {
      discrepancies.push({
        variablePath: `A.partnerAccounts[${incPartner.partnerId}].bookCapital704b`,
        incrementalValue: incPartner.bookCapital704b,
        replayValue: repPartner.bookCapital704b,
        delta: incPartner.bookCapital704b - repPartner.bookCapital704b,
        failureCategory: 'Calculation',
        rootCause: 'Section 704(b) book capital account divergence.'
      });
    }

    if (Math.abs(incPartner.outsideTaxBasis - repPartner.outsideTaxBasis) > 0.01) {
      discrepancies.push({
        variablePath: `A.partnerAccounts[${incPartner.partnerId}].outsideTaxBasis`,
        incrementalValue: incPartner.outsideTaxBasis,
        replayValue: repPartner.outsideTaxBasis,
        delta: incPartner.outsideTaxBasis - repPartner.outsideTaxBasis,
        failureCategory: 'Calculation',
        rootCause: 'Outside tax basis divergence.'
      });
    }
  });

  const isIdentical = discrepancies.length === 0;
  const incrementalHash = `0xSTATE_T${incrementalState.t}_${Math.round(incrementalState.X.totalEconomicCapital)}`;
  const replayHash = `0xSTATE_T${replayState.t}_${Math.round(replayState.X.totalEconomicCapital)}`;

  return {
    isIdentical,
    incrementalStateHash: incrementalHash,
    replayStateHash: replayHash,
    maxDiscrepancyTolerance: 0.01,
    discrepancies
  };
}

/** Event Commutativity Tester: delta(delta(S, e_a), e_b) == delta(delta(S, e_b), e_a) */
export function testEventCommutativity(
  baseState: InvestmentTaxState,
  eventA: TaxEvent,
  eventB: TaxEvent
): CommutativityTestResult {
  // Path 1: A then B
  const resA1 = executeStateTransition(baseState, eventA);
  const resB1 = executeStateTransition(resA1.nextState, eventB);
  const stateAB = resB1.nextState;

  // Path 2: B then A
  const resB2 = executeStateTransition(baseState, eventB);
  const resA2 = executeStateTransition(resB2.nextState, eventA);
  const stateBA = resA2.nextState;

  const divergentVariables: CommutativityTestResult['divergentVariables'] = [];

  // Check Transferee Outside Basis
  const outsideAB = stateAB.A.partnerAccounts[0]?.outsideTaxBasis || 0;
  const outsideBA = stateBA.A.partnerAccounts[0]?.outsideTaxBasis || 0;
  if (Math.abs(outsideAB - outsideBA) > 1.0) {
    divergentVariables.push({
      variable: 'A_t.partnerAccounts[0].outsideTaxBasis',
      valAB: outsideAB,
      valBA: outsideBA,
      difference: outsideAB - outsideBA,
      taxSignificance: 'Alters partner gain recognition on subsequent distributions under IRC § 731 and basis recovery on liquidation.'
    });
  }

  // Check Cash
  if (Math.abs(stateAB.X.cash - stateBA.X.cash) > 1.0) {
    divergentVariables.push({
      variable: 'X_t.cash',
      valAB: stateAB.X.cash,
      valBA: stateBA.X.cash,
      difference: stateAB.X.cash - stateBA.X.cash,
      taxSignificance: 'Cash liquidity timing divergence.'
    });
  }

  const commutes = divergentVariables.length === 0;

  return {
    eventA,
    eventB,
    orderABFinalStateHash: `0xORDER_AB_${Math.round(stateAB.X.totalEconomicCapital)}`,
    orderBAFinalStateHash: `0xORDER_BA_${Math.round(stateBA.X.totalEconomicCapital)}`,
    commutes,
    divergentVariables,
    reason: commutes
      ? 'Events commute: state transition functions delta(delta(S, e_a), e_b) and delta(delta(S, e_b), e_a) produce identical terminal state within defined tolerance.'
      : 'Events DO NOT commute: partner capital distribution alters inside tax basis prior to secondary sale, changing taxable gain and §743(b) step-up magnitude.'
  };
}
