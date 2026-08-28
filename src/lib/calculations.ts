import { getVmsFee, getNboHours } from './lookups';

export type CalculatorInputs = {
  // Candidate Info
  candidateName: string;
  jobTitle: string;
  facilityName: string;
  state: string;
  city: string;
  client: string;
  nboFacility: string;

  // Bill Rates
  billRate: number;
  overtimeBillRatePlus: number | null;   // D12 - adds to bill rate
  overtimeBillRateTimes: number | null;  // D13 - multiplies bill rate

  // Pay
  orientationPay: number;       // D16
  dailyLodging: number;          // D18
  mealsAndIncidentals: number;   // D20
  alaskaHawaiiStipend: number | null; // D22
  stipendPerHourOverride: number | null; // D24 - override stipend/hr
  w2PerHour: number;             // D26
  overtimePayPerHour: number;    // D28
  bonusOneTime: number;          // D30
  reimbursementOneTime: number;  // D32

  // Duration
  weeks: number;                 // I14
  shiftsPerWeek: number;         // I16
  hoursPerDay: number;           // I18
  regularHoursPerWeek: number;   // I20
  overtimeHoursPerWeek: number;  // I22

  // Burdens / Overheads
  healthInsurance: number;             // R10
  complianceCost: number;              // R9 (1000)
  stateTaxRegularPercent: number;      // R20
  stateTaxOvertimePercent: number;     // R21
  stateTaxRegularOverride?: number | null;
  stateTaxOTOverride?: number | null;
  clientFeeRegularOverride?: number | null;
  clientFeeOTOverride?: number | null;
  clientFeeRegularOverrideDollar?: number | null;
  clientFeeOTOverrideDollar?: number | null;
  factoringPercent: number;            // T29
  recruiterIncentivePercent: number;   // R32
  usdInrRate: number;                  // R33
};

export type CostingRow = {
  oneTime: number;
  weekly: number;
  hourly: number;
};

export type CalculatorOutputs = {
  // Computed intermediate
  overtimeBillRate: number;

  // Duration
  months: number;
  days: number;
  totalHoursPerWeek: number;
  totalHours: number;

  // Stipend
  stipendHourly: number;

  // Pay Package Summary
  weeklyGross: number;
  blendedHourly: number;
  w2Hourly: number;
  perDiemWeekly: number;
  overtimeHourly: number;
  bonusOneTimeDisplay: number;
  nboHours: number;
  nboHoursDisplay: number;
  nonBillablePay: number;

  // Hourly Margins
  hourlyMargin: number;
  hourlyMarginPct: number;
  hourlyOTMargin: number;
  hourlyOTMarginPct: number;

  // Costing table rows
  costing: {
    stipend: CostingRow;
    w2: CostingRow;
    overtime: CostingRow;
    bonus: CostingRow;
    reimbursement: CostingRow;
    nonBillablePay: CostingRow;
    compliance: CostingRow;
    healthInsurance: CostingRow;
    clientFeeRegular: CostingRow;
    clientFeeOvertime: CostingRow;
    stateTaxRegular: CostingRow;
    stateTaxOvertime: CostingRow;
    factoring: CostingRow;
    totalRegular: CostingRow;
    totalOvertime: CostingRow;
  };

  // Burdens section
  burdens: {
    stateTaxRegularPct: number;
    stateTaxOTPct: number;
    clientFeeRegularPct: number;
    clientFeeOTPct: number;
    stateTaxRegularHourly: number;
    stateTaxOTHourly: number;
    clientFeeRegularHourly: number;
    clientFeeOTHourly: number;
    totalRegularHourly: number;
    totalOTHourly: number;
  };

  // Assignment Stats
  grossBillRegular: number;
  grossBillOT: number;
  grossCostRegular: number;
  grossCostOT: number;
  grossBill: number;
  grossCost: number;
  grossMarginRegular: number;
  grossMarginOT: number;
  grossMargin: number;
  recruiterIncentive: number;
  recruiterIncentiveInr: number;
  factoringPct: number;

  // Legacy (still needed for burdens display)
  clientFeeRegularPct: number;
  clientFeeOTPct: number;
};

export function calculate(inputs: CalculatorInputs): CalculatorOutputs {
  const billRate      = inputs.billRate || 0;
  const w2PerHour     = inputs.w2PerHour || 0;
  const otPayPerHour  = inputs.overtimePayPerHour || 0;
  const weeks         = inputs.weeks || 0;
  const shifts        = inputs.shiftsPerWeek || 0;
  const regHours      = inputs.regularHoursPerWeek || 0;
  const otHours       = inputs.overtimeHoursPerWeek || 0;

  // ── D14: Overtime Bill Rate ──────────────────────────────────────
  let overtimeBillRate = billRate;
  if (inputs.overtimeBillRatePlus !== null && inputs.overtimeBillRatePlus !== undefined && inputs.overtimeBillRatePlus !== 0) {
    if (inputs.overtimeBillRatePlus > billRate) {
      overtimeBillRate = inputs.overtimeBillRatePlus;
    } else {
      overtimeBillRate = billRate + inputs.overtimeBillRatePlus;
    }
  } else if (inputs.overtimeBillRateTimes !== null && inputs.overtimeBillRateTimes !== undefined && inputs.overtimeBillRateTimes !== 0) {
    overtimeBillRate = billRate * inputs.overtimeBillRateTimes;
  }

  // ── Duration ─────────────────────────────────────────────────────
  const months           = weeks / 4.3;           // I10
  const days             = weeks * shifts;         // I12
  const totalHoursPerWeek = regHours + otHours;   // I24
  const totalHours        = weeks * totalHoursPerWeek; // I26

  // ── T3: Stipend / Hour ───────────────────────────────────────────
  // IF(D24<>"", D24, IF(OR(D5="Alaska",D5="Hawaii"), (D22*7)/I20, ((D18+D20)*7)/I20))
  let stipendHourly = 0;
  if (inputs.stipendPerHourOverride !== null && inputs.stipendPerHourOverride !== 0) {
    stipendHourly = inputs.stipendPerHourOverride;
  } else if ((inputs.state === 'Alaska' || inputs.state === 'Hawaii') && inputs.alaskaHawaiiStipend !== null && inputs.alaskaHawaiiStipend > 0) {
    stipendHourly = regHours > 0 ? ((inputs.alaskaHawaiiStipend || 0) * 7) / regHours : 0;
  } else {
    stipendHourly = regHours > 0 ? ((inputs.dailyLodging + inputs.mealsAndIncidentals) * 7) / regHours : 0;
  }

  // ── NBO ──────────────────────────────────────────────────────────
  const nboHours    = getNboHours(inputs.nboFacility);
  const defaultVmsFee = getVmsFee(inputs.client);

  const clientFeeRegularPct = (inputs.clientFeeRegularOverride !== null && inputs.clientFeeRegularOverride !== undefined)
    ? inputs.clientFeeRegularOverride
    : defaultVmsFee;
  const clientFeeOTPct = (inputs.clientFeeOTOverride !== null && inputs.clientFeeOTOverride !== undefined)
    ? inputs.clientFeeOTOverride
    : defaultVmsFee;

  const stateTaxRegPct = (inputs.stateTaxRegularOverride !== null && inputs.stateTaxRegularOverride !== undefined)
    ? inputs.stateTaxRegularOverride
    : inputs.stateTaxRegularPercent;
  const stateTaxOTPct = (inputs.stateTaxOTOverride !== null && inputs.stateTaxOTOverride !== undefined)
    ? inputs.stateTaxOTOverride
    : inputs.stateTaxOvertimePercent;

  // ── Individual cost components (Hourly) ─────────────────────────
  const t3  = stipendHourly;                                              // Stipend/hr
  const t4  = w2PerHour;                                                  // W2/hr
  const t5  = otPayPerHour;                                               // OT pay/hr
  const t6  = totalHours > 0 ? inputs.bonusOneTime / totalHours : 0;      // Bonus/hr
  const t7  = totalHours > 0 ? inputs.reimbursementOneTime / totalHours : 0; // Reimb/hr
  const t8  = totalHours > 0 ? inputs.orientationPay / totalHours : 0;    // NBO Pay/hr
  const t9  = totalHours > 0 ? inputs.complianceCost / totalHours : 0;    // Compliance/hr
  const t10 = totalHours > 0 ? inputs.healthInsurance / totalHours : 0;   // Health Ins/hr
  const t11 = (inputs.clientFeeRegularOverrideDollar !== null && inputs.clientFeeRegularOverrideDollar !== undefined && inputs.clientFeeRegularOverrideDollar !== 0)
    ? inputs.clientFeeRegularOverrideDollar
    : clientFeeRegularPct * billRate;                                      // Client Fee Reg/hr
  const t12 = (inputs.clientFeeOTOverrideDollar !== null && inputs.clientFeeOTOverrideDollar !== undefined && inputs.clientFeeOTOverrideDollar !== 0)
    ? inputs.clientFeeOTOverrideDollar
    : clientFeeOTPct * overtimeBillRate;                                   // Client Fee OT/hr
  const t13 = stateTaxRegPct * w2PerHour;                                  // State Tax Reg/hr
  const t14 = stateTaxOTPct * otPayPerHour;                                // State Tax OT/hr

  // T15: Factoring = SUM(T3+T4+T6+T7+T8+T9+T11+T13) * factoringPct
  const t15 = (t3 + t4 + t6 + t7 + t8 + t9 + t11 + t13) * (inputs.factoringPercent || 0);

  // T16: Total Regular Cost Hourly
  const t16 = t3 + t4 + t6 + t7 + t8 + t9 + t10 + t11 + t13 + t15;

  // T17: Total OT Cost Hourly
  const t17 = t5 + t12 + t14;

  // ── Costing rows: ONE TIME / WEEKLY / HOURLY ─────────────────────
  const mk = (oneTime: number, weekly: number, hourly: number): CostingRow => ({ oneTime, weekly, hourly });

  const costing = {
    stipend:         mk(t3 * weeks * regHours,   t3 * regHours,  t3),
    w2:              mk(t4 * weeks * regHours,   t4 * regHours,  t4),
    overtime:        mk(t5 * weeks * otHours,    t5 * otHours,   t5),
    bonus:           mk(inputs.bonusOneTime,      t6 * regHours,  t6),
    reimbursement:   mk(inputs.reimbursementOneTime, t7 * regHours, t7),
    nonBillablePay:  mk(inputs.orientationPay,   t8 * regHours,  t8),
    compliance:      mk(inputs.complianceCost,   t9 * regHours,  t9),
    healthInsurance: mk(inputs.healthInsurance,  t10 * regHours, t10),
    clientFeeRegular:  mk(t11 * weeks * regHours, t11 * regHours, t11),
    clientFeeOvertime: mk(t12 * weeks * otHours,  t12 * otHours,  t12),
    stateTaxRegular:   mk(t13 * weeks * regHours, t13 * regHours, t13),
    stateTaxOvertime:  mk(t14 * weeks * otHours,  t14 * otHours,  t14),
    factoring:         mk(0,                       t15 * regHours, t15),
    totalRegular:      mk(t16 * weeks * regHours, t16 * regHours, t16),
    totalOvertime:     mk(t17 * weeks * otHours,  t17 * otHours,  t17),
  };

  // ── Burdens ──────────────────────────────────────────────────────
  const burdens = {
    stateTaxRegularPct:    stateTaxRegPct,
    stateTaxOTPct:         stateTaxOTPct,
    clientFeeRegularPct:   clientFeeRegularPct,
    clientFeeOTPct:        clientFeeOTPct,
    stateTaxRegularHourly: t13,
    stateTaxOTHourly:      t14,
    clientFeeRegularHourly: t11,
    clientFeeOTHourly:     t12,
    totalRegularHourly:    t13 + t11,
    totalOTHourly:         t14 + t12,
  };

  // ── Assignment Stats ──────────────────────────────────────────────
  const grossBillRegular = billRate * weeks * regHours;         // R29
  const grossBillOT      = overtimeBillRate * weeks * otHours;  // S29
  const grossBill        = grossBillRegular + grossBillOT;

  const grossCostRegular = t16 * weeks * regHours;   // R30
  const grossCostOT      = t17 * weeks * otHours;    // S30
  const grossCost        = grossCostRegular + grossCostOT;

  const grossMarginRegular = grossBillRegular - grossCostRegular;
  const grossMarginOT      = grossBillOT - grossCostOT;
  const grossMargin        = grossBill - grossCost;

  const recruiterIncentive = grossMargin * (inputs.recruiterIncentivePercent || 0);

  // ── Pay Package Summary ───────────────────────────────────────────
  const perDiemWeekly = t3 * regHours;                                     // N10
  const weeklyGross   = perDiemWeekly + (w2PerHour * regHours) + (otPayPerHour * otHours); // N4
  const blendedHourly = stipendHourly + w2PerHour;                         // N6

  // ── Hourly Margins ────────────────────────────────────────────────
  // N25 = D10 - T16, O25 = N25 / D10
  const hourlyMargin    = billRate - t16;
  const hourlyMarginPct = billRate > 0 ? hourlyMargin / billRate : 0;
  // N29 = D14 - T17, O29 = N29 / D14
  const hourlyOTMargin    = overtimeBillRate - t17;
  const hourlyOTMarginPct = overtimeBillRate > 0 ? hourlyOTMargin / overtimeBillRate : 0;

  return {
    overtimeBillRate,
    months,
    days,
    totalHoursPerWeek,
    totalHours,
    stipendHourly,

    weeklyGross,
    blendedHourly,
    w2Hourly: w2PerHour,
    perDiemWeekly,
    overtimeHourly: otPayPerHour,
    bonusOneTimeDisplay: inputs.bonusOneTime,
    nboHours,
    nboHoursDisplay: nboHours,
    nonBillablePay: inputs.orientationPay,

    hourlyMargin,
    hourlyMarginPct,
    hourlyOTMargin,
    hourlyOTMarginPct,

    costing,
    burdens,

    grossBillRegular,
    grossBillOT,
    grossCostRegular,
    grossCostOT,
    grossBill,
    grossCost,
    grossMarginRegular,
    grossMarginOT,
    grossMargin,
    recruiterIncentive,
    recruiterIncentiveInr: recruiterIncentive * (inputs.usdInrRate || 0),
    factoringPct: inputs.factoringPercent || 0,

    clientFeeRegularPct,
    clientFeeOTPct,
  };
}
