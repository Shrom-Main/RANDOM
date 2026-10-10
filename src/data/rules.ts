/**
 * Statutory Authorities, Treasury Regulations, and Checkpoint Interpretations
 * Domain: D = {§704(b), §704(c), §743(b), §754}
 */

export interface TaxRuleDefinition {
  codeSection: string;
  treasuryRegulation: string;
  ruleTitle: string;
  effectiveDate: string;
  isDeterministic: boolean;
  statutoryLanguageSummary: string;
  thomsonReutersCatalystContext: string;
  computationalInputs: string[];
  computationalOutputs: string[];
  boundaryFaultTriggers: string[];
}

export const TAX_RULE_LIBRARY: Record<string, TaxRuleDefinition> = {
  '§704(b)': {
    codeSection: 'IRC § 704(b)',
    treasuryRegulation: 'Treas. Reg. § 1.704-1(b)(2)(iv)',
    ruleTitle: 'Partner\'s Distributive Share & Substantial Economic Effect',
    effectiveDate: '1954-08-16 (Major revision TD 8065 Dec 1985; TD 8385 Dec 1991)',
    isDeterministic: false,
    statutoryLanguageSummary: 
      'A partner\'s distributive share of income, gain, loss, deduction, or credit shall be determined in accordance with the partner\'s interest in the partnership (determined by taking into account all facts and circumstances), if the partnership agreement does not provide as to the distributive share, or the allocation does not have substantial economic effect.',
    thomsonReutersCatalystContext:
      'Checkpoint Catalyst Topic 704 explains that capital accounts must be maintained in accordance with Treas. Reg. § 1.704-1(b)(2)(iv). On revaluation events (admission of new partner, distribution), partnership assets may be adjusted to fair market value on the books, creating reverse §704(c) allocations. If allocations fail substantial economic effect or targeted allocation waterfalls diverge from liquidation rights, human legal interpretation is required to determine whether economic effect equivalence is satisfied.',
    computationalInputs: [
      'Contributions at FMV',
      'Distributions at FMV',
      'Net book profit/loss allocated according to partnership agreement ratio',
      'Deficit Restoration Obligation (DRO) or Qualified Income Offset (QIO)'
    ],
    computationalOutputs: [
      'Partner §704(b) Book Capital Account Balance',
      'Book-Tax Capital Disparity',
      'Mandatory reallocation if deficit exceeds restoration obligation'
    ],
    boundaryFaultTriggers: [
      'Targeted allocation waterfall conflicts with capital account liquidation provisions',
      'Absence of DRO when partner capital account drops negative without QIO',
      'Unresolved characterization of preferred equity vs partnership debt'
    ]
  },

  '§704(c)': {
    codeSection: 'IRC § 704(c)(1)(A)',
    treasuryRegulation: 'Treas. Reg. § 1.704-3(a)-(d)',
    ruleTitle: 'Contributed Property and Built-In Gain or Loss',
    effectiveDate: '1984-07-18 (Regulations TD 8500 Dec 1993; TD 8585 Dec 1994)',
    isDeterministic: true, // Deterministic once the election method is determined
    statutoryLanguageSummary:
      'Income, gain, loss, and deduction with respect to property contributed to the partnership by a partner shall be shared among the partners so as to take account of the variation between the basis of the property to the partnership and its fair market value at time of contribution.',
    thomsonReutersCatalystContext:
      'Checkpoint Catalyst Topic 704(c) documents the three IRS-approved methods: Traditional Method (Reg. § 1.704-3(b)), Traditional Method with Curative Allocations (Reg. § 1.704-3(c)), and Remedial Allocation Method (Reg. § 1.704-3(d)). The Traditional Method is subject to the "Ceiling Rule" — total tax gain/loss allocated cannot exceed the tax gain/loss realized by the partnership upon disposition, creating book/tax distortion among non-contributing partners. The choice of method is a formal human determination; once chosen, computation is closed and deterministic.',
    computationalInputs: [
      'Property Fair Market Value at contribution date',
      'Tax Basis of property at contribution date',
      'Selected method (Traditional / Curative / Remedial)',
      'Realized tax gain/loss upon asset disposition',
      'Realized book gain/loss upon asset disposition'
    ],
    computationalOutputs: [
      'Allocation of tax gain to contributing partner up to remaining built-in gain',
      'Allocation of remaining tax gain to all partners pro-rata to book gain',
      'Ceiling rule distortion shortfall measurement (if Traditional method used)',
      'Curative/Remedial offsetting tax items (if chosen)'
    ],
    boundaryFaultTriggers: [
      'Partnership agreement silent on §704(c) method selection across asset classes',
      'Multiple contributing partners for commingled portfolio lots',
      'Anti-abuse rule challenge under Reg. § 1.704-3(a)(10) if substantial tax shifting occurs'
    ]
  },

  '§754': {
    codeSection: 'IRC § 754',
    treasuryRegulation: 'Treas. Reg. § 1.754-1(b)',
    ruleTitle: 'Manner of Electing Optional Basis Adjustment',
    effectiveDate: '1954-08-16 (Reg. § 1.754-1; TD 8847 Dec 1999)',
    isDeterministic: true,
    statutoryLanguageSummary:
      'If a partnership files an election in accordance with regulations, the basis of partnership property shall be adjusted, in the case of a distribution of property, in the manner provided in section 734 and, in the case of a transfer of a partnership interest, in the manner provided in section 743.',
    thomsonReutersCatalystContext:
      'Under Reg. § 1.754-1(b), the election must be filed with the timely filed partnership return (Form 1065, including extensions) for the taxable year in which the transfer occurs. Once made, the election applies to all subsequent transfers and distributions unless the district director approves revocation. Under Rev. Proc. 2022-23, certain late elections may obtain automatic 12-month relief under § 301.9100-2. Public Form ADV rarely confirms election execution, creating an empirical observability fault zone.',
    computationalInputs: [
      'Election status flag (boolean)',
      'Effective tax year of election',
      'IRS Revocation approval (if terminated)'
    ],
    computationalOutputs: [
      'Gatekeeper flag enabling §743(b) adjustments on partner transfers',
      'Gatekeeper flag enabling §734(b) adjustments on distributions'
    ],
    boundaryFaultTriggers: [
      'Secondary transfer occurred but tax return status unknown in public SEC filing',
      'Late-filing of Form 1065 creating uncertain election validity without § 9100 relief'
    ]
  },

  '§743(b)': {
    codeSection: 'IRC § 743(b)',
    treasuryRegulation: 'Treas. Reg. § 1.743-1(a)-(k); Treas. Reg. § 1.755-1',
    ruleTitle: 'Adjustment to Basis of Partnership Property for Transferee Partner',
    effectiveDate: '1954-08-16 (Substantially revised by TD 8847, Dec 15, 1999; TCJA 2017 § 13504)',
    isDeterministic: true,
    statutoryLanguageSummary:
      'In the case of a transfer of an interest in a partnership by sale or exchange, a partnership with respect to which the election provided in section 754 is in effect shall (1) increase the adjusted basis of the partnership property by the excess of the basis to the transferee partner of his interest in the partnership over his proportionate share of the adjusted basis of the partnership property, or (2) decrease the adjusted basis... Such adjustment constitutes an adjustment to the basis of partnership property with respect to the transferee partner only.',
    thomsonReutersCatalystContext:
      'Treas. Reg. § 1.743-1(d) specifies that the transferee’s share of inside basis equals the transferee’s interest in partnership previously taxed capital plus share of liabilities. Under Treas. Reg. § 1.755-1(b), the total §743(b) adjustment must be allocated between two classes: (1) Ordinary income assets, and (2) Capital gain & §1231 assets, based on hypothetical liquidation at fair market value. Crucially, post-2004 AJCA & TCJA 2017 amendments to § 743(d) make basis reductions mandatory if the partnership has a "substantial built-in loss" (> $250,000) regardless of whether a §754 election is in effect.',
    computationalInputs: [
      'Transferee purchase price (outside basis: IRC §742)',
      'Transferee share of previously taxed capital (Reg. § 1.743-1(d))',
      '§754 election active OR Substantial Built-in Loss > $250k under § 743(d)',
      'Fair market value of each partnership asset class under §755'
    ],
    computationalOutputs: [
      'Net §743(b) basis adjustment',
      'Class-level §755 basis adjustment (Ordinary vs Capital)',
      'Transferee-specific tax depreciation / disposition gain offset'
    ],
    boundaryFaultTriggers: [
      'Valuation of underlying assets in private equity portfolio is ambiguous or disputable',
      'Tiered partnership: Upper-tier transfer without lower-tier §754 election (Rev. Rul. 87-115)',
      'Transferee partner non-arm\'s length relationship triggering § 707(b) or disguised sale rules'
    ]
  },

  '§755': {
    codeSection: 'IRC § 755',
    treasuryRegulation: 'Treas. Reg. § 1.755-1(b)',
    ruleTitle: 'Rules for Allocation of Basis Adjustment',
    effectiveDate: '1954-08-16 (Overhauled by TD 8847, Dec 1999)',
    isDeterministic: true,
    statutoryLanguageSummary:
      'Any increase or decrease in the adjusted basis of partnership property under section 734(b) or section 743(b) shall be allocated in a manner which has the effect of reducing the difference between the fair market value and the adjusted basis of partnership properties.',
    thomsonReutersCatalystContext:
      'Reg. § 1.755-1(b)(2) mandates a hypothetical transaction test: partnership determines the amount of gain or loss that would be allocated to the transferee from the hypothetical sale of all assets in each class (ordinary and capital) for FMV. Step-up in one class can coexist with step-down in the other class even if net adjustment is zero. If asset valuations are not observable from public filings, deterministic allocation is impossible.',
    computationalInputs: [
      'Total §743(b) basis adjustment',
      'Hypothetical sale proceeds for ordinary income assets',
      'Hypothetical sale proceeds for capital assets'
    ],
    computationalOutputs: [
      'Ordinary income class adjustment',
      'Capital gain class adjustment'
    ],
    boundaryFaultTriggers: [
      'Unresolved allocation of enterprise value to goodwill vs tangible portfolio assets',
      'Lack of observable balance sheet FMV in SEC Form ADV / Form D'
    ]
  }
};
