/**
 * POC 1 — Deterministic Investment Tax Calculation Engine
 *
 * Implements pure mathematical & statutory logic with zero LLM guesswork:
 * 1. § 704(c) Layer Engine with Ceiling Rule Demonstration (Traditional, Curative, Remedial)
 * 2. § 754 -> § 743(b) -> § 755 Step-Up Engine & Partner Death Scenario (IRC § 1014)
 * 3. § 734(b) Partnership-Level Distribution Adjustment Engine
 * 4. § 751 Hot Assets & Character Preservation Engine
 * 5. § 752 Partnership Liability Allocation & Deemed Distribution Engine
 * 6. § 163(j) Entity-Aware Business Interest Limitation (ATI & EBIE)
 * 7. Book-to-Tax Schedule M-1 / M-3 Bridge Engine
 */

import {
  Section704cCeilingModel,
  Section743bStepUpModel,
  Section163jModel,
  BookToTaxBridgeItem
} from '../types/tax-engine-v2';

/**
 * 1. SECTION 704(c) LAYER & CEILING RULE ENGINE
 * Demonstrates the ceiling rule problem where book depreciation > actual tax depreciation.
 */
export function computeSection704cLayer(params: {
  layerId: string;
  propertyId: string;
  contributingPartnerId: string;
  contributedDate: string;
  bookValueAtContribution: number;
  taxBasisAtContribution: number;
  allocationMethod: 'TRADITIONAL' | 'CURATIVE' | 'REMEDIAL';
  annualBookDepreciation: number;
  actualTaxDepreciationAvailable: number;
  nonContributingBookSharePct: number; // e.g., 0.50 for 50/50 partnership
}): Section704cCeilingModel {
  const {
    layerId,
    propertyId,
    contributingPartnerId,
    contributedDate,
    bookValueAtContribution,
    taxBasisAtContribution,
    allocationMethod,
    annualBookDepreciation,
    actualTaxDepreciationAvailable,
    nonContributingBookSharePct
  } = params;

  const builtInGainLoss = bookValueAtContribution - taxBasisAtContribution;
  const nonContributingBookAllocation = annualBookDepreciation * nonContributingBookSharePct;

  // Traditional Method: Ceiling rule applies if available tax depreciation < non-contributing book share
  let nonContributingTaxAllocation = 0;
  let contributingPartnerTaxAllocation = 0;
  let ceilingRuleDistortionAmount = 0;
  let curativeAllocationAmount = 0;
  let remedialNotionalGain = 0;
  let remedialNotionalDeduction = 0;

  if (actualTaxDepreciationAvailable >= nonContributingBookAllocation) {
    // No ceiling rule distortion
    nonContributingTaxAllocation = nonContributingBookAllocation;
    contributingPartnerTaxAllocation = actualTaxDepreciationAvailable - nonContributingBookAllocation;
    ceilingRuleDistortionAmount = 0;
  } else {
    // CEILING RULE BINDING: Non-contributing partner capped at total tax depreciation available
    nonContributingTaxAllocation = actualTaxDepreciationAvailable;
    contributingPartnerTaxAllocation = 0;
    ceilingRuleDistortionAmount = nonContributingBookAllocation - actualTaxDepreciationAvailable;

    if (allocationMethod === 'CURATIVE') {
      // Allocate curative ordinary gross income away from non-contributing partner to contributing partner
      curativeAllocationAmount = ceilingRuleDistortionAmount;
    } else if (allocationMethod === 'REMEDIAL') {
      // Create notional tax deduction for non-contributing partner and offsetting notional gain for contributor
      remedialNotionalDeduction = ceilingRuleDistortionAmount;
      remedialNotionalGain = ceilingRuleDistortionAmount;
    }
  }

  const remainingDisparity = Math.max(0, builtInGainLoss - (annualBookDepreciation - actualTaxDepreciationAvailable));

  return {
    layerId,
    propertyId,
    contributingPartnerId,
    contributedDate,
    bookValueAtContribution,
    taxBasisAtContribution,
    builtInGainLoss,
    allocationMethod,
    annualBookDepreciation,
    actualTaxDepreciationAvailable,
    nonContributingBookAllocation,
    nonContributingTaxAllocation,
    contributingPartnerTaxAllocation,
    ceilingRuleDistortionAmount,
    curativeAllocationAmount,
    remedialNotionalGain,
    remedialNotionalDeduction,
    remainingDisparity
  };
}

/**
 * 2. SECTION 754 -> SECTION 743(b) -> SECTION 755 STEP-UP ENGINE
 * Implements partner interest transfers including Partner Death under IRC § 1014.
 */
export function computeSection743bStepUp(params: {
  transferEventId: string;
  transfereePartnerId: string;
  transferorPartnerId: string;
  effectiveDate: string;
  transferReason: 'PURCHASE_SALE' | 'DEATH_IRC_1014' | 'GIFT';
  outsideBasisPriceOrFmv: number;
  transfereeShareOfInsideBasis: number;
  isSection754InEffect: boolean;
  capitalAssetFmvDisparityPct?: number; // e.g. 0.80 (80% to capital assets, 20% to ordinary)
  usefulLifeYears?: number;
}): Section743bStepUpModel {
  const {
    transferEventId,
    transfereePartnerId,
    transferorPartnerId,
    effectiveDate,
    transferReason,
    outsideBasisPriceOrFmv,
    transfereeShareOfInsideBasis,
    isSection754InEffect,
    capitalAssetFmvDisparityPct = 0.80,
    usefulLifeYears = 15
  } = params;

  let grossAdjustment = 0;
  let capitalPortion = 0;
  let ordinaryPortion = 0;
  let annualDepreciation = 0;
  let taxShield = 0;
  const auditChain: string[] = [];

  auditChain.push(`Event: ${transferReason === 'DEATH_IRC_1014' ? 'Partner Death (IRC § 1014 FMV Step-Up)' : 'Partnership Interest Transfer'}`);
  auditChain.push(`Transferee Outside Basis: $${outsideBasisPriceOrFmv.toLocaleString()}`);
  auditChain.push(`Transferee Proportionate Share of Inside Tax Basis: $${transfereeShareOfInsideBasis.toLocaleString()}`);

  if (isSection754InEffect) {
    grossAdjustment = outsideBasisPriceOrFmv - transfereeShareOfInsideBasis;
    auditChain.push(`§754 Active: Gross §743(b) Adjustment = $${grossAdjustment.toLocaleString()}`);

    // §755 Allocation between ordinary assets and capital assets
    capitalPortion = parseFloat((grossAdjustment * capitalAssetFmvDisparityPct).toFixed(2));
    ordinaryPortion = parseFloat((grossAdjustment * (1 - capitalAssetFmvDisparityPct)).toFixed(2));
    auditChain.push(`§755 Allocation: Capital Class = $${capitalPortion.toLocaleString()}, Ordinary Class (§751) = $${ordinaryPortion.toLocaleString()}`);

    // Annual partner-specific depreciation under Treas. Reg. § 1.743-1(j)
    annualDepreciation = parseFloat((capitalPortion / usefulLifeYears).toFixed(2));
    taxShield = parseFloat((annualDepreciation * 0.37).toFixed(2)); // at 37% top bracket
    auditChain.push(`Annual Partner-Specific §743(b) Deduction: $${annualDepreciation.toLocaleString()} (Tax Shield: $${taxShield.toLocaleString()}/yr)`);
  } else {
    grossAdjustment = 0;
    auditChain.push('§754 NOT in effect: No §743(b) inside basis adjustment recognized. Inside basis disparity persists.');
  }

  return {
    transferEventId,
    transfereePartnerId,
    transferorPartnerId,
    effectiveDate,
    transferReason,
    outsidePurchasePriceOrFmv: outsideBasisPriceOrFmv,
    transfereeShareOfInsideBasis,
    grossSection743bAdjustment: grossAdjustment,
    isSection754InEffect,
    section755Allocation: {
      capitalAssetPortion: capitalPortion,
      ordinaryAssetPortion: ordinaryPortion
    },
    annualPartnerSpecificDepreciation: annualDepreciation,
    taxShieldOnAssetSale: taxShield,
    auditChainDescription: auditChain
  };
}

/**
 * 3. SECTION 734(b) PARTNERSHIP-LEVEL DISTRIBUTION ADJUSTMENTS
 * Triggers when distributed cash exceeds outside basis, or property basis is stepped-down upon distribution.
 */
export function computeSection734bAdjustment(params: {
  distributionEventId: string;
  distributeePartnerId: string;
  cashDistributed: number;
  partnerOutsideBasisBefore: number;
  distributedPropertyInsideBasis: number;
  isSection754InEffect: boolean;
}): {
  section734bTotalAdjustment: number;
  partnerRecognizedGain: number;
  newPartnerOutsideBasis: number;
  auditExplanation: string;
} {
  const {
    cashDistributed,
    partnerOutsideBasisBefore,
    distributedPropertyInsideBasis,
    isSection754InEffect
  } = params;

  let partnerRecognizedGain = 0;
  let newOutsideBasis = 0;
  let section734bTotalAdjustment = 0;
  let auditExplanation = '';

  if (cashDistributed > partnerOutsideBasisBefore) {
    // § 731(a)(1) Gain recognition on excess cash
    partnerRecognizedGain = cashDistributed - partnerOutsideBasisBefore;
    newOutsideBasis = 0;

    if (isSection754InEffect) {
      // Partnership increases basis of retained assets under § 734(b)(1)(A) by gain recognized
      section734bTotalAdjustment = partnerRecognizedGain;
      auditExplanation = `Cash distribution of $${cashDistributed.toLocaleString()} exceeded outside basis of $${partnerOutsideBasisBefore.toLocaleString()}. Partner recognized §731 gain of $${partnerRecognizedGain.toLocaleString()}. With §754 in effect, partnership inside basis increases by $${section734bTotalAdjustment.toLocaleString()} under §734(b)(1)(A).`;
    } else {
      auditExplanation = `Cash distribution exceeded outside basis. Partner recognized $${partnerRecognizedGain.toLocaleString()} gain, but no §734(b) adjustment because §754 election is absent.`;
    }
  } else {
    newOutsideBasis = partnerOutsideBasisBefore - cashDistributed;
    auditExplanation = `Cash distribution of $${cashDistributed.toLocaleString()} fully absorbed by outside basis. Remaining outside basis: $${newOutsideBasis.toLocaleString()}. No §731 gain.`;
  }

  return {
    section734bTotalAdjustment,
    partnerRecognizedGain,
    newPartnerOutsideBasis: newOutsideBasis,
    auditExplanation
  };
}

/**
 * 4. SECTION 751 HOT ASSETS & CHARACTER PRESERVATION ENGINE
 * Separates unrealized receivables & inventory to prevent conversion of ordinary income to capital gain.
 */
export function computeSection751HotAssets(params: {
  salePriceOfPartnershipInterest: number;
  totalTransferredOutsideBasis: number;
  partnerShareOfUnrealizedReceivablesFmv: number;
  partnerShareOfUnrealizedReceivablesTaxBasis: number;
  partnerShareOfInventoryFmv: number;
  partnerShareOfInventoryTaxBasis: number;
}): {
  ordinaryIncomeSection751: number;
  capitalGainLossResidual: number;
  totalGainLoss: number;
  auditLineage: string[];
} {
  const {
    salePriceOfPartnershipInterest,
    totalTransferredOutsideBasis,
    partnerShareOfUnrealizedReceivablesFmv,
    partnerShareOfUnrealizedReceivablesTaxBasis,
    partnerShareOfInventoryFmv,
    partnerShareOfInventoryTaxBasis
  } = params;

  // Ordinary gain under § 751(a)
  const receivablesOrdinaryGain = Math.max(0, partnerShareOfUnrealizedReceivablesFmv - partnerShareOfUnrealizedReceivablesTaxBasis);
  const inventoryOrdinaryGain = Math.max(0, partnerShareOfInventoryFmv - partnerShareOfInventoryTaxBasis);
  const totalOrdinary751Gain = receivablesOrdinaryGain + inventoryOrdinaryGain;

  // Overall gain on transfer
  const totalGain = salePriceOfPartnershipInterest - totalTransferredOutsideBasis;

  // Capital gain is residual: Total Gain - Section 751 Ordinary Gain
  const capitalGainResidual = totalGain - totalOrdinary751Gain;

  return {
    ordinaryIncomeSection751: totalOrdinary751Gain,
    capitalGainLossResidual: capitalGainResidual,
    totalGainLoss: totalGain,
    auditLineage: [
      `Gross Sale Price: $${salePriceOfPartnershipInterest.toLocaleString()} vs Outside Basis: $${totalTransferredOutsideBasis.toLocaleString()}`,
      `Total Economic Gain: $${totalGain.toLocaleString()}`,
      `§751(a) Unrealized Receivables Ordinary Gain: $${receivablesOrdinaryGain.toLocaleString()}`,
      `§751(a) Inventory Ordinary Gain: $${inventoryOrdinaryGain.toLocaleString()}`,
      `Total Section 751 Ordinary Income: $${totalOrdinary751Gain.toLocaleString()}`,
      `Residual Capital Gain / (Loss): $${capitalGainResidual.toLocaleString()} (IRC § 741)`
    ]
  };
}

/**
 * 5. SECTION 752 LIABILITIES & DEEMED CASH DISTRIBUTION ENGINE
 */
export function computeSection752Liabilities(params: {
  partnerId: string;
  beginningOutsideBasis: number;
  recourseLiabilityShareChange: number; // positive = increase, negative = decrease
  nonrecourseLiabilityShareChange: number;
}): {
  deemedContribution: number;
  deemedDistribution: number;
  recognizedSection731Gain: number;
  endingOutsideBasis: number;
  narrative: string;
} {
  const {
    beginningOutsideBasis,
    recourseLiabilityShareChange,
    nonrecourseLiabilityShareChange
  } = params;

  const totalLiabilityChange = recourseLiabilityShareChange + nonrecourseLiabilityShareChange;
  let deemedContribution = 0;
  let deemedDistribution = 0;
  let recognizedSection731Gain = 0;
  let endingBasis = beginningOutsideBasis;

  if (totalLiabilityChange > 0) {
    // § 752(a) Deemed cash contribution increases outside basis
    deemedContribution = totalLiabilityChange;
    endingBasis = beginningOutsideBasis + deemedContribution;
    return {
      deemedContribution,
      deemedDistribution: 0,
      recognizedSection731Gain: 0,
      endingOutsideBasis: endingBasis,
      narrative: `Liability increase of $${totalLiabilityChange.toLocaleString()} treated as deemed cash contribution under §752(a), increasing outside basis to $${endingBasis.toLocaleString()}.`
    };
  } else if (totalLiabilityChange < 0) {
    // § 752(b) Deemed cash distribution decreases outside basis
    deemedDistribution = Math.abs(totalLiabilityChange);
    if (deemedDistribution > beginningOutsideBasis) {
      recognizedSection731Gain = deemedDistribution - beginningOutsideBasis;
      endingBasis = 0;
      return {
        deemedContribution: 0,
        deemedDistribution,
        recognizedSection731Gain,
        endingOutsideBasis: 0,
        narrative: `Deemed distribution of $${deemedDistribution.toLocaleString()} under §752(b) exceeded outside basis of $${beginningOutsideBasis.toLocaleString()}. Partner recognized §731(a)(1) taxable capital gain of $${recognizedSection731Gain.toLocaleString()}.`
      };
    } else {
      endingBasis = beginningOutsideBasis - deemedDistribution;
      return {
        deemedContribution: 0,
        deemedDistribution,
        recognizedSection731Gain: 0,
        endingOutsideBasis: endingBasis,
        narrative: `Deemed distribution of $${deemedDistribution.toLocaleString()} under §752(b) reduced outside basis to $${endingBasis.toLocaleString()}. No taxable gain.`
      };
    }
  }

  return {
    deemedContribution: 0,
    deemedDistribution: 0,
    recognizedSection731Gain: 0,
    endingOutsideBasis: beginningOutsideBasis,
    narrative: 'No change in partnership liabilities.'
  };
}

/**
 * 6. SECTION 163(j) ENTITY-AWARE BUSINESS INTEREST LIMITATION
 */
export function computeSection163jLimitation(params: {
  entityId: string;
  taxYear: number;
  businessInterestExpense: number;
  businessInterestIncome: number;
  adjustedTaxableIncomeAti: number;
  partnerAllocations: { partnerId: string; sharePct: number }[];
}): Section163jModel {
  const {
    entityId,
    taxYear,
    businessInterestExpense,
    businessInterestIncome,
    adjustedTaxableIncomeAti,
    partnerAllocations
  } = params;

  // 30% of ATI cap under TCJA 2017
  const atiLimit30Percent = Math.max(0, adjustedTaxableIncomeAti * 0.30);
  const totalAllowableCap = businessInterestIncome + atiLimit30Percent;

  let allowableInterestDeduction = 0;
  let excessBusinessInterestExpenseEbie = 0;

  if (businessInterestExpense <= totalAllowableCap) {
    allowableInterestDeduction = businessInterestExpense;
    excessBusinessInterestExpenseEbie = 0;
  } else {
    allowableInterestDeduction = totalAllowableCap;
    excessBusinessInterestExpenseEbie = businessInterestExpense - totalAllowableCap;
  }

  // Allocate EBIE to partners
  const allocatedToPartners = partnerAllocations.map(p => ({
    partnerId: p.partnerId,
    ebieShare: parseFloat((excessBusinessInterestExpenseEbie * p.sharePct).toFixed(2))
  }));

  return {
    entityId,
    taxYear,
    businessInterestExpense,
    businessInterestIncome,
    adjustedTaxableIncomeAti,
    atiLimit30Percent,
    allowableInterestDeduction,
    excessBusinessInterestExpenseEbie,
    allocatedToPartners,
    tieredPassThroughCapacity: Math.max(0, totalAllowableCap - businessInterestExpense)
  };
}

/**
 * 7. BOOK-TO-TAX SCHEDULE M-1 / M-3 BRIDGE
 */
export function computeBookToTaxBridge(params: {
  bookNetIncome: number;
  depreciationBook: number;
  depreciationTax: number;
  section704cAdjustment: number;
  section743bDepreciation: number;
  section163jDisallowedEbie: number;
  pficQefUnrealizedInclusion: number;
  municipalBondInterest: number;
}): {
  bookNetIncome: number;
  taxableIncome: number;
  bridgeItems: BookToTaxBridgeItem[];
  totalAdjustments: number;
} {
  const {
    bookNetIncome,
    depreciationBook,
    depreciationTax,
    section704cAdjustment,
    section743bDepreciation,
    section163jDisallowedEbie,
    pficQefUnrealizedInclusion,
    municipalBondInterest
  } = params;

  const bridgeItems: BookToTaxBridgeItem[] = [
    {
      id: 'BRIDGE-01',
      category: 'DEPRECIATION',
      label: 'Tax over Book Depreciation (MACRS vs GAAP)',
      bookAmount: depreciationBook,
      taxAmount: depreciationTax,
      adjustmentAmount: -(depreciationTax - depreciationBook),
      isPermanent: false,
      governingCode: 'IRC § 168',
      underlyingDocument: 'Fixed Asset Depreciation Schedule'
    },
    {
      id: 'BRIDGE-02',
      category: 'SECTION_704C',
      label: 'Section 704(c) Built-In Gain Amortization',
      bookAmount: 0,
      taxAmount: section704cAdjustment,
      adjustmentAmount: section704cAdjustment,
      isPermanent: false,
      governingCode: 'IRC § 704(c) & Treas. Reg. § 1.704-3',
      underlyingDocument: 'Partnership Agreement Exhibit B'
    },
    {
      id: 'BRIDGE-03',
      category: 'SECTION_743B',
      label: 'Section 743(b) Transferee Special Basis Depreciation',
      bookAmount: 0,
      taxAmount: section743bDepreciation,
      adjustmentAmount: -section743bDepreciation,
      isPermanent: false,
      governingCode: 'Treas. Reg. § 1.743-1(j)(4)',
      underlyingDocument: 'Form 1065 Schedule K-1 Box 20 Code V'
    },
    {
      id: 'BRIDGE-04',
      category: 'SECTION_163J',
      label: 'Disallowed Excess Business Interest Expense (EBIE)',
      bookAmount: section163jDisallowedEbie,
      taxAmount: 0,
      adjustmentAmount: section163jDisallowedEbie,
      isPermanent: false,
      governingCode: 'IRC § 163(j)(4)(B)',
      underlyingDocument: 'Form 8990 Schedule A'
    },
    {
      id: 'BRIDGE-05',
      category: 'PFIC_QEF',
      label: 'PFIC Qualified Electing Fund (QEF) Ordinary Earnings',
      bookAmount: 0,
      taxAmount: pficQefUnrealizedInclusion,
      adjustmentAmount: pficQefUnrealizedInclusion,
      isPermanent: true,
      governingCode: 'IRC § 1293(a)(1)',
      underlyingDocument: 'Form 8621 Part II Line 1a'
    },
    {
      id: 'BRIDGE-06',
      category: 'MUNI_INTEREST',
      label: 'Tax-Exempt Municipal Bond Interest Exclusion',
      bookAmount: municipalBondInterest,
      taxAmount: 0,
      adjustmentAmount: -municipalBondInterest,
      isPermanent: true,
      governingCode: 'IRC § 103(a)',
      underlyingDocument: 'Portfolio Custody Monthly Statement'
    }
  ];

  const totalAdjustments = bridgeItems.reduce((acc, item) => acc + item.adjustmentAmount, 0);
  const taxableIncome = bookNetIncome + totalAdjustments;

  return {
    bookNetIncome,
    taxableIncome,
    bridgeItems,
    totalAdjustments
  };
}
