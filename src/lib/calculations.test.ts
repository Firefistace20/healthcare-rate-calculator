import test from 'node:test';
import assert from 'node:assert';
import { calculate, CalculatorInputs } from './calculations';

// Based on the data in the Excel screenshot and dump:
const baseInputs: CalculatorInputs = {
  candidateName: "Test",
  jobTitle: "RN",
  facilityName: "Test Facility",
  state: "Montana",
  city: "Test City",
  client: "Medefis",
  nboFacility: "Paid",
  billRate: 115,
  overtimeBillRatePlus: 10,
  overtimeBillRateTimes: null,
  orientationPay: 0,
  dailyLodging: 110,
  mealsAndIncidentals: 68,
  alaskaHawaiiStipend: null,
  stipendPerHourOverride: null,
  w2PerHour: 54,
  overtimePayPerHour: 80,
  bonusOneTime: 0,
  reimbursementOneTime: 0,
  weeks: 13,
  shiftsPerWeek: 3,
  hoursPerDay: 12,
  regularHoursPerWeek: 36,
  overtimeHoursPerWeek: 0,
  healthInsurance: 0,
  stateTaxRegularPercent: 0.18,
  stateTaxOvertimePercent: 0.18,
  recruiterIncentivePercent: 0.04,
  usdInrRate: 85,
  complianceCost: 1000
};

test('Accuracy against Excel: Main Scenario', (t) => {
  const result = calculate(baseInputs);

  // Assert expected outputs from Excel
  // Overtime Bill Rate (D14): 115 + 10 = 125
  assert.strictEqual(result.overtimeBillRate, 125);
  
  // Months (I10): 13 / 4.3 = 3.0232558139534884
  assert.ok(Math.abs(result.months - 3.02325581) < 0.001);
  
  // Days (I12): 13 * 3 = 39
  assert.strictEqual(result.days, 39);
  
  // Total Hours / Week (I24): 36
  assert.strictEqual(result.totalHoursPerWeek, 36);
  
  // Total Hours (I26): 468
  assert.strictEqual(result.totalHours, 468);
  
  // Stipend Hourly (T3): ((110+68)*7)/36 = 34.611111111111114
  assert.ok(Math.abs(result.stipendHourly - 34.61111111) < 0.001);
  
  // Per Diem Weekly (N10): Stipend * Reg Hours = 1246
  assert.strictEqual(Math.round(result.perDiemWeekly), 1246);

  // W2 Hourly (N8): 54
  assert.strictEqual(result.w2Hourly, 54);
  
  // Weekly Gross (N4): Per Diem Weekly + W2 Weekly + OT Weekly = 1246 + (54 * 36) + (0) = 3190
  assert.strictEqual(Math.round(result.weeklyGross), 3190);
  
  // Blended Hourly (N6): 34.611 + 54 = 88.611
  assert.ok(Math.abs(result.blendedHourly - 88.611) < 0.001);
  
  // Client Fee Regular (R22): VLOOKUP Medefis = 0.0625
  assert.strictEqual(result.clientFeeRegularPct, 0.0625);

  // Gross Bill (R29): 115 * 13 * 36 = 53820
  assert.strictEqual(Math.round(result.grossBill), 53820);

  // Gross Cost (R30): Total Cost = 50382.71
  assert.ok(Math.abs(result.grossCost - 50382.71) < 0.1);

  // Gross Margin / Total Contract Profit (R31): 53820 - 50382.71 = 3437.29
  assert.ok(Math.abs(result.grossMargin - 3437.29) < 0.1);

  // Recruiter Incentive USD (R32): 3437.29 * 4% = 137.49
  assert.ok(Math.abs(result.recruiterIncentive - 137.49) < 0.1);

  // Recruiter Incentive INR (S33): 137.49 * 85 = 11686.79
  assert.ok(Math.abs(result.recruiterIncentiveInr - 11686.79) < 0.5);

  // Hourly Margin (N25): 115 - 107.655 = 7.34
  assert.ok(Math.abs(result.hourlyMargin - 7.34) < 0.05);

  // Burdens Total Regular (Hourly): 16.91
  assert.ok(Math.abs(result.burdens.totalRegularHourly - 16.91) < 0.05);

  // Burdens Total Overtime (Hourly): 22.21
  assert.ok(Math.abs(result.burdens.totalOTHourly - 22.21) < 0.05);
});
