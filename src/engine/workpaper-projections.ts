/**
 * Workpaper Projection Functions: WP_t = Pi_{WP}(S_t)
 * Demonstrating that workpapers, returns, and reports are versioned projections
 * of the underlying computational state rather than the state itself.
 */

import { InvestmentTaxState, WorkpaperProjections } from '../types/tax-state';

export function projectWorkpapers(state: InvestmentTaxState): WorkpaperProjections {
  // 1. Schedule K-1 (Form 1065) Projection
  const scheduleK1: WorkpaperProjections['scheduleK1'] = state.A.partnerAccounts.map(partner => {
    const adj743 = state.A.section743bAdjustments.find(a => a.transfereePartnerId === partner.partnerId);
    const box20U = adj743 ? adj743.totalAdjustment : 0;
    
    // Disparity between 704(b) book and tax basis
    const disparity = partner.bookCapital704b - partner.insideTaxBasisShare;

    return {
      partnerId: partner.partnerId,
      partnerName: partner.partnerName,
      ownershipPct: partner.ownershipPercentage * 100,
      ordinaryBusinessIncome: 0,
      netLongTermCapitalGain: 0,
      section743bAdjustmentBox20U: box20U,
      endingCapitalAccount704b: Math.round(partner.bookCapital704b),
      endingTaxBasisCapital: Math.round(partner.insideTaxBasisShare),
      netDisparity: Math.round(disparity)
    };
  });

  // 2. Section 704(c) Gain Tracking Matrix Projection
  const section704cSchedule: WorkpaperProjections['section704cSchedule'] = state.A.section704cLayers.map(layer => {
    const origDisparity = layer.bookValueAtContribution - layer.taxBasisAtContribution;
    const priorAmort = origDisparity - layer.remainingBuiltInGainLoss;
    const shortfall = layer.ceilingRuleDistortionActive ? Math.round(origDisparity * 0.25) : 0;

    return {
      propertyId: layer.propertyId,
      contributor: layer.contributorPartnerId,
      originalDisparity: Math.round(origDisparity),
      priorAmortization: Math.round(priorAmort),
      currentPeriodAllocation: 0,
      remainingBuiltInGain: Math.round(layer.remainingBuiltInGainLoss),
      ceilingRuleShortfall: shortfall
    };
  });

  // 3. Section 743(b) Basis Adjustment Schedule Projection
  const section743bSchedule: WorkpaperProjections['section743bSchedule'] = state.A.section743bAdjustments.map(adj => {
    return {
      transferee: adj.transfereePartnerId,
      totalStepUp: Math.round(adj.totalAdjustment),
      ordinaryIncomeStepUp: Math.round(adj.allocatedOrdinaryAsset),
      capitalGainStepUp: Math.round(adj.allocatedCapitalAsset),
      currentYearOffset: 0,
      remainingAdjustment: Math.round(adj.totalAdjustment)
    };
  });

  return {
    scheduleK1,
    section704cSchedule,
    section743bSchedule
  };
}
