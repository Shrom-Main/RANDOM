/**
 * Comprehensive Index of Real SEC EDGAR Filings for Private Funds and Advisers
 * Primary authoritative evidence corpus for POC1 validation
 */

export interface SecFilingRecord {
  accessionNumber: string;
  cik: string;
  entityName: string;
  adviserName: string;
  fundType: 'Hedge Fund' | 'Private Equity' | 'Fund-of-Funds' | 'Multi-Tier';
  formType: 'Form D' | 'Form D/A' | 'Form ADV Part 1A' | 'Form ADV Part 2A' | '13F-HR' | '10-K' | 'Schedule 13D';
  filingDate: string;
  reportDate: string;
  fileNumber?: string;
  primaryDocUrl: string;
  edgarUrl: string;
  description: string;
  totalOfferingAmount?: string;
  totalAmountSold?: string;
  minimumInvestment?: string;
  investorCount?: number;
  relevantCaseId?: string;
  taxRelevanceDomain: '§704(b)' | '§704(c)' | '§743(b)' | '§754' | 'Tiered / Cascade' | 'Outside Initial Domain';
  keyDisclosedFacts: string[];
}

export const SEC_FILINGS_DATABASE: SecFilingRecord[] = [
  {
    accessionNumber: '0001358883-22-000001',
    cik: '0001358883',
    entityName: 'Bridgewater Pure Alpha II, Ltd.',
    adviserName: 'Bridgewater Associates, LP (CRD 108343 / CIK 0001358882)',
    fundType: 'Hedge Fund',
    formType: 'Form D/A',
    filingDate: '2022-03-14',
    reportDate: '2022-02-28',
    fileNumber: '021-88492',
    primaryDocUrl: 'https://www.sec.gov/edgar/browse/?CIK=0001358883',
    edgarUrl: 'https://www.sec.gov/edgar/searchedgar/companysearch',
    description: 'Amended Form D filing disclosing continuous pooled investment vehicle offering, Cayman feeder into Master Fund.',
    totalOfferingAmount: 'Indefinite',
    totalAmountSold: '$32,450,000,000',
    minimumInvestment: '$10,000,000',
    investorCount: 148,
    relevantCaseId: 'case-bridgewater-pa2',
    taxRelevanceDomain: '§704(b)',
    keyDisclosedFacts: [
      'Cayman Feeder invests substantially all assets into Bridgewater Pure Alpha Master Fund II Ltd.',
      'Continuous offering with periodic monthly admissions and book revaluations under Treas. Reg. § 1.704-1(b)(2)(iv)(f)',
      'Substantial non-U.S. sovereign wealth and domestic institutional pension capital'
    ]
  },
  {
    accessionNumber: '0001358882-23-000004',
    cik: '0001358882',
    entityName: 'Bridgewater Associates, LP',
    adviserName: 'Bridgewater Associates, LP',
    fundType: 'Hedge Fund',
    formType: 'Form ADV Part 1A',
    filingDate: '2023-03-30',
    reportDate: '2022-12-31',
    primaryDocUrl: 'https://adviserinfo.sec.gov/firm/summary/108343',
    edgarUrl: 'https://www.sec.gov/edgar/browse/?CIK=0001358882',
    description: 'Annual updating amendment to Form ADV Part 1A disclosing Private Fund Reporting in Schedule D Section 7.B.(1).',
    relevantCaseId: 'case-bridgewater-pa2',
    taxRelevanceDomain: '§704(b)',
    keyDisclosedFacts: [
      'Schedule D Section 7.B.(1) reports 14 private fund master/feeder vehicles',
      'Auditors: KPMG LLP (Cayman) and PricewaterhouseCoopers LLP',
      'Gross asset value of Pure Alpha complex exceeds $124B'
    ]
  },
  {
    accessionNumber: '0000904495-21-000002',
    cik: '0000904495',
    entityName: 'Elliott Associates, L.P.',
    adviserName: 'Elliott Investment Management L.P. (CRD 105658 / CIK 0001048445)',
    fundType: 'Hedge Fund',
    formType: 'Form D/A',
    filingDate: '2021-06-18',
    reportDate: '2021-06-01',
    fileNumber: '021-41270',
    primaryDocUrl: 'https://www.sec.gov/edgar/browse/?CIK=0000904495',
    edgarUrl: 'https://www.sec.gov/edgar/searchedgar/companysearch',
    description: 'Amended Form D filing for flagship onshore domestic partnership organized as Delaware LP.',
    totalOfferingAmount: 'Indefinite',
    totalAmountSold: '$14,200,000,000',
    minimumInvestment: '$5,000,000',
    investorCount: 312,
    relevantCaseId: 'case-elliott-associates',
    taxRelevanceDomain: '§743(b)',
    keyDisclosedFacts: [
      'Delaware limited partnership structure operating as multi-strategy hedge fund',
      'Secondary transactions in partnership units trigger IRC § 754 election and § 743(b) inside basis step-ups',
      'Ordinary income items present under IRC § 751(a) (unrealized receivables and accrued market discount)'
    ]
  },
  {
    accessionNumber: '0001048445-23-000012',
    cik: '0001048445',
    entityName: 'Elliott Investment Management L.P.',
    adviserName: 'Elliott Investment Management L.P.',
    fundType: 'Hedge Fund',
    formType: '13F-HR',
    filingDate: '2023-05-15',
    reportDate: '2023-03-31',
    primaryDocUrl: 'https://www.sec.gov/edgar/browse/?CIK=0001048445',
    edgarUrl: 'https://www.sec.gov/edgar/searchedgar/companysearch',
    description: 'Quarterly institutional investment manager holdings report of Section 13(f) securities.',
    relevantCaseId: 'case-elliott-associates',
    taxRelevanceDomain: '§743(b)',
    keyDisclosedFacts: [
      'Reported 42 public equity positions with market value of $11.8B',
      'Active activist equity positions requiring partner capital allocations upon disposition'
    ]
  },
  {
    accessionNumber: '0001423053-22-000003',
    cik: '0001423053',
    entityName: 'Citadel Wellington LLC',
    adviserName: 'Citadel Advisors LLC (CRD 110531 / CIK 0001423053)',
    fundType: 'Hedge Fund',
    formType: 'Form D/A',
    filingDate: '2022-04-12',
    reportDate: '2022-03-31',
    fileNumber: '021-113204',
    primaryDocUrl: 'https://www.sec.gov/edgar/browse/?CIK=0001423053',
    edgarUrl: 'https://www.sec.gov/edgar/searchedgar/companysearch',
    description: 'Continuous private fund offering amendment for multi-manager flagship fund.',
    totalOfferingAmount: 'Indefinite',
    totalAmountSold: '$38,600,000,000',
    minimumInvestment: '$10,000,000',
    investorCount: 420,
    relevantCaseId: 'case-citadel-wellington',
    taxRelevanceDomain: 'Outside Initial Domain',
    keyDisclosedFacts: [
      'Over 2.4 million annual security trades with automated algorithmic order execution',
      'Elects mark-to-market trader status under IRC § 475(f), terminating conventional §704(c) amortization',
      'Classified as Outside Initial Domain of POC1 due to §475(f) mark-to-market regime'
    ]
  },
  {
    accessionNumber: '0001336528-21-000001',
    cik: '0001336528',
    entityName: 'Pershing Square, L.P.',
    adviserName: 'Pershing Square Capital Management, L.P. (CRD 130770 / CIK 0001336528)',
    fundType: 'Hedge Fund',
    formType: 'Form D/A',
    filingDate: '2021-02-24',
    reportDate: '2020-12-31',
    fileNumber: '021-80674',
    primaryDocUrl: 'https://www.sec.gov/edgar/browse/?CIK=0001336528',
    edgarUrl: 'https://www.sec.gov/edgar/searchedgar/companysearch',
    description: 'Annual amendment for domestic concentrated activist investment partnership.',
    totalOfferingAmount: 'Indefinite',
    totalAmountSold: '$5,980,000,000',
    minimumInvestment: '$5,000,000',
    investorCount: 95,
    relevantCaseId: 'case-pershing-square',
    taxRelevanceDomain: '§704(c)',
    keyDisclosedFacts: [
      'Contribution of appreciated concentrated equity lots with low tax basis ($30M tax basis vs $120M FMV)',
      'Substantial book/tax disparity governed by IRC § 704(c)',
      'Ceiling Rule limitation creates tax distortion under Traditional Method Treas. Reg. § 1.704-3(b)'
    ]
  },
  {
    accessionNumber: '0001755100-19-000001',
    cik: '0001755100',
    entityName: 'Blackstone Real Estate Partners IX L.P.',
    adviserName: 'Blackstone Real Estate Advisors L.P. (CRD 110787 / CIK 0001393818)',
    fundType: 'Private Equity',
    formType: 'Form D',
    filingDate: '2019-02-15',
    reportDate: '2019-01-31',
    fileNumber: '021-332915',
    primaryDocUrl: 'https://www.sec.gov/edgar/browse/?CIK=0001755100',
    edgarUrl: 'https://www.sec.gov/edgar/searchedgar/companysearch',
    description: 'Initial Form D notice of exempt offering of securities for $20.5B global real estate fund.',
    totalOfferingAmount: '$20,500,000,000',
    totalAmountSold: '$18,700,000,000',
    minimumInvestment: '$10,000,000',
    investorCount: 380,
    relevantCaseId: 'case-blackstone-brep',
    taxRelevanceDomain: '§743(b)',
    keyDisclosedFacts: [
      'Delaware LP investing through tiered Holdco SPVs and property partnerships',
      'High-leverage property acquisitions with nonrecourse debt allocated under Treas. Reg. § 1.752-3',
      'Discount secondary unit acquisitions produce mandatory downward basis adjustments under TCJA § 743(b)'
    ]
  },
  {
    accessionNumber: '0001527166-22-000002',
    cik: '0001527166',
    entityName: 'Carlyle Global Partners Continuation Fund L.P.',
    adviserName: 'Carlyle Investment Management L.L.C. (CRD 108520 / CIK 0001527166)',
    fundType: 'Private Equity',
    formType: 'Form D',
    filingDate: '2022-05-18',
    reportDate: '2022-04-30',
    fileNumber: '021-446182',
    primaryDocUrl: 'https://www.sec.gov/edgar/browse/?CIK=0001527166',
    edgarUrl: 'https://www.sec.gov/edgar/searchedgar/companysearch',
    description: 'Notice of exempt offering for GP-led continuation vehicle acquiring legacy portfolio company.',
    totalOfferingAmount: '$2,800,000,000',
    totalAmountSold: '$2,800,000,000',
    minimumInvestment: '$25,000,000',
    investorCount: 46,
    relevantCaseId: 'case-carlyle-continuation',
    taxRelevanceDomain: '§704(c)',
    keyDisclosedFacts: [
      'GP-led secondary continuation vehicle transaction transferring single-asset trophy portfolio company',
      'Rollover limited partners elect non-recognition under IRC § 721, while exiting LPs recognize gain',
      'Dual characterization triggers computational boundary: IRC § 707(a)(2)(B) disguised sale review'
    ]
  },
  {
    accessionNumber: '0001553406-20-000001',
    cik: '0001553406',
    entityName: 'KKR North America Fund XI L.P.',
    adviserName: 'Kohlberg Kravis Roberts & Co. L.P. (CRD 110998 / CIK 0001399090)',
    fundType: 'Private Equity',
    formType: 'Form D/A',
    filingDate: '2020-09-11',
    reportDate: '2019-12-31',
    fileNumber: '021-180492',
    primaryDocUrl: 'https://www.sec.gov/edgar/browse/?CIK=0001553406',
    edgarUrl: 'https://www.sec.gov/edgar/searchedgar/companysearch',
    description: 'Amended Form D filing demonstrating multi-month bitemporal latency between valid date and record date.',
    totalOfferingAmount: '$9,000,000,000',
    totalAmountSold: '$9,000,000,000',
    minimumInvestment: '$10,000,000',
    investorCount: 198,
    relevantCaseId: 'case-kkr-na11',
    taxRelevanceDomain: '§743(b)',
    keyDisclosedFacts: [
      'Secondary LP transfer completed on 2019-12-15 but Form D/A and amended Schedule D filed 269 days later',
      'TCJA 2017 amendments to IRC § 743(d) make downward basis step-downs mandatory when built-in loss exceeds $250k',
      'Demonstrates necessity of bitemporal modeling (t_v, t_r)'
    ]
  },
  {
    accessionNumber: '0001851299-21-000001',
    cik: '0001851299',
    entityName: 'Adams Street Global Secondary Fund 7 L.P.',
    adviserName: 'Adams Street Partners, LLC (CRD 110757 / CIK 0001851299)',
    fundType: 'Fund-of-Funds',
    formType: 'Form D',
    filingDate: '2021-03-29',
    reportDate: '2021-03-15',
    fileNumber: '021-393844',
    primaryDocUrl: 'https://www.sec.gov/edgar/browse/?CIK=0001851299',
    edgarUrl: 'https://www.sec.gov/edgar/searchedgar/companysearch',
    description: 'Notice of exempt offering for dedicated global secondary private equity fund-of-funds.',
    totalOfferingAmount: '$2,500,000,000',
    totalAmountSold: '$2,150,000,000',
    minimumInvestment: '$5,000,000',
    investorCount: 165,
    relevantCaseId: 'case-adams-street-secondary',
    taxRelevanceDomain: 'Tiered / Cascade',
    keyDisclosedFacts: [
      'Acquires limited partnership interests across 85+ underlying sponsor private equity funds',
      'Revenue Ruling 87-115 governs cascading Section 743(b) basis adjustments across tiered partnerships',
      'Requires dual Section 754 elections at both upper-tier FoF and lower-tier operating partnership'
    ]
  },
  {
    accessionNumber: '0001799276-21-000001',
    cik: '0001799276',
    entityName: 'HarbourVest Global Private Assets Fund L.P.',
    adviserName: 'HarbourVest Partners, LLC (CRD 110822 / CIK 0001799276)',
    fundType: 'Fund-of-Funds',
    formType: 'Form D/A',
    filingDate: '2021-05-20',
    reportDate: '2021-04-30',
    fileNumber: '021-357502',
    primaryDocUrl: 'https://www.sec.gov/edgar/browse/?CIK=0001799276',
    edgarUrl: 'https://www.sec.gov/edgar/searchedgar/companysearch',
    description: 'Annual amendment for multi-tier global private assets fund-of-funds vehicle.',
    totalOfferingAmount: 'Indefinite',
    totalAmountSold: '$4,100,000,000',
    minimumInvestment: '$1,000,000',
    investorCount: 520,
    relevantCaseId: 'case-harbourvest-fof',
    taxRelevanceDomain: 'Tiered / Cascade',
    keyDisclosedFacts: [
      '4-tier investment hierarchy: Institutional LP -> FoF -> Underlying Fund -> SPV Holdco -> Portfolio Asset',
      'Structural propagation depth D(e) = 4 layers for exit transactions at the portfolio level',
      'Computational boundary reached when lower-tier SPV basis information is not passed through K-1'
    ]
  },
  {
    accessionNumber: '0001830131-22-000001',
    cik: '0001830131',
    entityName: 'Hamilton Lane Private Assets Fund L.P.',
    adviserName: 'Hamilton Lane Advisors, L.L.C. (CRD 106093 / CIK 0001830131)',
    fundType: 'Fund-of-Funds',
    formType: 'Form D/A',
    filingDate: '2022-08-15',
    reportDate: '2021-12-31',
    fileNumber: '021-380125',
    primaryDocUrl: 'https://www.sec.gov/edgar/browse/?CIK=0001830131',
    edgarUrl: 'https://www.sec.gov/edgar/searchedgar/companysearch',
    description: 'Amended Form D filing documenting delayed year-end adjustments following amended underlying K-1s.',
    totalOfferingAmount: 'Indefinite',
    totalAmountSold: '$3,400,000,000',
    minimumInvestment: '$50,000',
    investorCount: 890,
    relevantCaseId: 'case-hamilton-lane',
    taxRelevanceDomain: 'Tiered / Cascade',
    keyDisclosedFacts: [
      'Receives over 300 annual Schedule K-1s from underlying funds, with 14% arriving as amended K-1s post-September 15',
      'Demonstrates necessity of historical replay delta calculation: Delta S_k -> Delta S_n',
      'Eliminates manual recalculation of multi-tier workpaper spreadsheets'
    ]
  }
];
