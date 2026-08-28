"use client";

import React, { useState, useEffect } from 'react';
import { calculate, CalculatorInputs, CalculatorOutputs } from '@/lib/calculations';
import { US_STATES, clientFees, nboFacilities } from '@/lib/lookups';

const DEFAULT_INPUTS: CalculatorInputs = {
  candidateName: "Sarah Jenkins",
  jobTitle: "Registered Nurse",
  facilityName: "Test Facility",
  state: "California",
  city: "Test City",
  client: "Medefis",
  nboFacility: "Paid",
  billRate: 115,
  overtimeBillRatePlus: 10,
  overtimeBillRateTimes: null,  // retained for calculation engine compatibility
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
  complianceCost: 1000,
  stateTaxRegularPercent: 0.18,
  stateTaxOvertimePercent: 0.18,
  stateTaxRegularOverride: null,
  stateTaxOTOverride: null,
  clientFeeRegularOverride: null,
  clientFeeOTOverride: null,
  clientFeeRegularOverrideDollar: null,
  clientFeeOTOverrideDollar: null,
  factoringPercent: 0,
  recruiterIncentivePercent: 0.04,
  usdInrRate: 85,
};

// ── SVG ICONS ─────────────────────────────────
const StaffingHubLogo = () => (
  <svg viewBox="0 0 200 40" width="170" height="34" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="sphereGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#82e9ff" />
        <stop offset="50%" stopColor="#2db5ff" />
        <stop offset="100%" stopColor="#0062ff" />
      </linearGradient>
    </defs>
    <circle cx="20" cy="20" r="18" fill="url(#sphereGrad)" />
    <path d="M2,20 C8,10 24,10 32,15 C26,12 12,12 4,23 Z" fill="#003580" />
    <path d="M4,26 C12,16 28,15 36,21 C30,17 14,17 6,29 Z" fill="#003580" />
    <path d="M8,32 C16,23 32,22 38,28 C32,24 18,24 10,35 Z" fill="#003580" />
    <text x="46" y="21" fontFamily="Inter, sans-serif" fontWeight="700" fontSize="16" fill="#f8fafc" letterSpacing="0.05em">STAFFINGHUB</text>
    <text x="48" y="32" fontFamily="Inter, sans-serif" fontWeight="600" fontSize="9" fill="#94a3b8" letterSpacing="0.1em">SOLUTIONS</text>
  </svg>
);

const IconUser = () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const IconMoney = () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8v8m0-8V6m0 12v2M9 21h6a2 2 0 002-2V5a2 2 0 00-2-2H9a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>;


export default function CalculatorApp() {
  const [inputs, setInputs] = useState<CalculatorInputs>(DEFAULT_INPUTS);
  const [results, setResults] = useState<CalculatorOutputs>(() => calculate(DEFAULT_INPUTS));
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggleCollapse = (key: string) => {
    setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    setResults(calculate(inputs));
  }, [inputs]);

  // Prevent mouse wheel from changing number input values
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'number') {
        (target as HTMLInputElement).blur();
      }
    };
    document.addEventListener('wheel', handleWheel, { passive: true });
    return () => document.removeEventListener('wheel', handleWheel);
  }, []);

  const handleCopyJobPost = () => {
    const shiftType = inputs.shiftsPerWeek && inputs.hoursPerDay 
      ? `${inputs.shiftsPerWeek}x${inputs.hoursPerDay}` 
      : 'Not Specified';

    const msg = 
`Title: ${inputs.jobTitle || 'Not Specified'}
Location: ${inputs.city ? inputs.city + ', ' : ''}${inputs.state || ''}

Weekly Gross: ${fc(results.weeklyGross)}/week
BREAKDOWN:
On W2 (Taxable): ${fc(results.w2Hourly)}/hour
Per-Diem (Non-Taxable): ${fc(results.perDiemWeekly)}/week
Overtime (Taxable): ${fc(results.overtimeHourly)}/hour

DETAILS:
Contract: ${inputs.weeks || 0} weeks
Shift: ${shiftType}
Hours: ${inputs.regularHoursPerWeek || 0} hours/week`;

    navigator.clipboard.writeText(msg);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setInputs(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? null : parseFloat(value)) : value,
    }));
  };

  const getPctDisplay = (val: number | null | undefined) => {
    if (val === null || val === undefined || isNaN(val)) return '';
    return Number((val * 100).toFixed(4)).toString();
  };

  const handlePctChange = (name: string, rawVal: string) => {
    setInputs(prev => ({
      ...prev,
      [name]: rawVal === '' ? null : parseFloat(rawVal) / 100,
    }));
  };

  const fc = (v?: number) => {
    if (v === undefined || v === null || isNaN(v)) return '$0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);
  };
  const fp = (v?: number, d = 1) => (v === undefined || v === null || isNaN(v)) ? '0.0%' : (v * 100).toFixed(d) + '%';

  const CostRow = ({ label, row }: { label: string; row: { oneTime: number; weekly: number; hourly: number } }) => (
    <tr>
      <td>{label}</td>
      <td>{fc(row.oneTime)}</td>
      <td>{fc(row.weekly)}</td>
      <td>{fc(row.hourly)}</td>
    </tr>
  );

  return (
    <div className="dashboard-layout">
      <main className="main-area">
        <div className="content-wrapper">
          
          {/* Header Matching image1.png with restored StaffingHub Logo */}
          <div className="page-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <StaffingHubLogo />
              <span style={{ color: 'rgba(255, 255, 255, 0.15)', fontSize: '0.85rem' }}>|</span>
              <h1 style={{ fontSize: '0.9rem', margin: 0, fontWeight: 600, color: 'var(--text-main)' }}>Healthcare Calculator</h1>
            </div>
            <button 
              onClick={handleCopyJobPost} 
              style={{
                background: copied ? '#2dd4bf' : 'rgba(255, 255, 255, 0.05)',
                color: copied ? '#000' : 'var(--text-main)',
                border: '1px solid var(--border-light)',
                borderRadius: '0.375rem',
                padding: '0.3rem 0.65rem',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                transition: 'all 0.15s ease'
              }}
            >
              {copied ? '✓ Copied!' : '📋 Copy Job Post'}
            </button>
          </div>

          <div className="dashboard-grid">
            
            {/* ════════════════ LEFT COLUMN (ALL INPUTS) ════════════════ */}
            <div className="left-column">
              
              {/* Candidate & Role Card */}
              <div className="card">
                <div className="card-header" onClick={() => toggleCollapse('candidate')} style={{ cursor: 'pointer', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <IconUser /> <h3>CANDIDATE &amp; ROLE</h3>
                  </div>
                  <span style={{ fontSize: '0.65rem', color: '#2dd4bf' }}>{collapsed['candidate'] ? '▶' : '▼'}</span>
                </div>
                {!collapsed['candidate'] && (
                  <div className="input-grid grid-4">
                    <div className="input-group">
                      <label>Candidate Name</label>
                      <input type="text" name="candidateName" value={inputs.candidateName} onChange={handleChange} className="input-field" />
                    </div>
                    <div className="input-group">
                      <label>Job Title</label>
                      <input type="text" name="jobTitle" value={inputs.jobTitle} onChange={handleChange} className="input-field" />
                    </div>
                    <div className="input-group">
                      <label>City</label>
                      <input type="text" name="city" value={inputs.city} onChange={handleChange} className="input-field" />
                    </div>
                    <div className="input-group">
                      <label>State</label>
                      <select name="state" value={inputs.state} onChange={handleChange} className="input-field">
                        {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Bill Rates Card */}
              <div className="card">
                <div className="card-header">
                  <IconMoney /> <h3>BILL RATES</h3>
                </div>
                <div className="input-grid grid-3">
                  <div className="input-group">
                    <label>Regular Bill Rate ($/hr)</label>
                    <input type="number" name="billRate" value={inputs.billRate ?? ''} onChange={handleChange} className="input-field" />
                  </div>
                  <div className="input-group">
                    <label>OT Bill Rate ($/hr)</label>
                    <input type="number" name="overtimeBillRatePlus" value={inputs.overtimeBillRatePlus ?? ''} onChange={handleChange} className="input-field" placeholder="e.g. 125" />
                  </div>
                  <div className="input-group">
                    <label>Orientation Pay (Flat)</label>
                    <input type="number" name="orientationPay" value={inputs.orientationPay ?? ''} onChange={handleChange} className="input-field" />
                  </div>
                </div>
              </div>

              {/* Pay Rates Card */}
              <div className="card">
                <div className="card-header">
                  <IconMoney /> <h3>PAY RATES &amp; STIPENDS</h3>
                </div>
                <div className="input-grid grid-3">
                  <div className="input-group">
                    <label>W2 Hourly ($/hr)</label>
                    <input type="number" name="w2PerHour" value={inputs.w2PerHour ?? ''} onChange={handleChange} className="input-field" />
                  </div>
                  <div className="input-group">
                    <label>OT Hourly ($/hr)</label>
                    <input type="number" name="overtimePayPerHour" value={inputs.overtimePayPerHour ?? ''} onChange={handleChange} className="input-field" />
                  </div>
                  <div className="input-group">
                    <label>Stipend Override</label>
                    <input type="number" name="stipendPerHourOverride" value={inputs.stipendPerHourOverride ?? ''} onChange={handleChange} className="input-field" placeholder="Optional" />
                  </div>
                  <div className="input-group">
                    <label>Daily Lodging ($)</label>
                    <input type="number" name="dailyLodging" value={inputs.dailyLodging ?? ''} onChange={handleChange} className="input-field" />
                  </div>
                  <div className="input-group">
                    <label>Meals/Incidental ($)</label>
                    <input type="number" name="mealsAndIncidentals" value={inputs.mealsAndIncidentals ?? ''} onChange={handleChange} className="input-field" />
                  </div>
                  <div className="input-group">
                    <label>Bonus / Reimbursement (One Time)</label>
                    <input type="number" name="bonusOneTime" value={inputs.bonusOneTime ?? ''} onChange={handleChange} className="input-field" placeholder="e.g. 0" />
                  </div>
                </div>
              </div>

              {/* Shift Details Card */}
              <div className="card">
                <div className="card-header">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  <h3>SHIFT DETAILS</h3>
                </div>
                <div className="input-grid grid-4">
                  <div className="input-group">
                    <label>Weeks</label>
                    <input type="number" name="weeks" value={inputs.weeks ?? ''} onChange={handleChange} className="input-field" />
                  </div>
                  <div className="input-group">
                    <label>Shifts/Week</label>
                    <input type="number" name="shiftsPerWeek" value={inputs.shiftsPerWeek ?? ''} onChange={handleChange} className="input-field" />
                  </div>
                  <div className="input-group">
                    <label>Hours/Day</label>
                    <input type="number" name="hoursPerDay" value={inputs.hoursPerDay ?? ''} onChange={handleChange} className="input-field" />
                  </div>
                  <div className="input-group">
                    <label>Total Hrs/Wk</label>
                    <input type="number" name="regularHoursPerWeek" value={inputs.regularHoursPerWeek ?? ''} onChange={handleChange} className="input-field" />
                  </div>
                </div>
              </div>

              {/* Additional Overheads Card */}
              <div className="card">
                <div className="card-header">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> <h3>ADDITIONAL OVERHEADS &amp; LOCATION</h3>
                </div>
                <div className="input-grid grid-3">
                  <div className="input-group">
                    <label>Facility</label>
                    <select name="client" value={inputs.client} onChange={handleChange} className="input-field">
                      {Object.keys(clientFees).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label>NBO Facility</label>
                    <select name="nboFacility" value={inputs.nboFacility} onChange={handleChange} className="input-field">
                      {Object.keys(nboFacilities).map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Compliance</label>
                    <input type="number" name="complianceCost" value={inputs.complianceCost ?? ''} onChange={handleChange} className="input-field" />
                  </div>
                </div>
              </div>

              {/* Burdens & Tax Settings Card */}
              <div className="card">
                <div className="card-header" onClick={() => toggleCollapse('burdens')} style={{ cursor: 'pointer', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                    <h3>BURDENS &amp; TAX SETTINGS</h3>
                  </div>
                  <span style={{ fontSize: '0.65rem', color: '#2dd4bf' }}>{collapsed['burdens'] ? '▶' : '▼'}</span>
                </div>
                {!collapsed['burdens'] && (
                  <div className="input-grid grid-4">
                    {/* Row 1 (% Rates) */}
                    <div className="input-group">
                      <label>State Tax Regular (%)</label>
                      <input
                        type="number"
                        name="stateTaxRegularPercent"
                        value={getPctDisplay(inputs.stateTaxRegularPercent)}
                        onChange={e => handlePctChange('stateTaxRegularPercent', e.target.value)}
                        className="input-field"
                        placeholder="e.g. 18"
                      />
                    </div>
                    <div className="input-group">
                      <label>State Tax OT (%)</label>
                      <input
                        type="number"
                        name="stateTaxOvertimePercent"
                        value={getPctDisplay(inputs.stateTaxOvertimePercent)}
                        onChange={e => handlePctChange('stateTaxOvertimePercent', e.target.value)}
                        className="input-field"
                        placeholder="e.g. 18"
                      />
                    </div>
                    <div className="input-group">
                      <label>Client Fee Regular (%)</label>
                      <input
                        type="number"
                        name="clientFeeRegularOverride"
                        value={getPctDisplay(inputs.clientFeeRegularOverride !== null && inputs.clientFeeRegularOverride !== undefined ? inputs.clientFeeRegularOverride : results.burdens.clientFeeRegularPct)}
                        onChange={e => handlePctChange('clientFeeRegularOverride', e.target.value)}
                        className="input-field"
                        placeholder="Optional"
                      />
                    </div>
                    <div className="input-group">
                      <label>Client Fee OT (%)</label>
                      <input
                        type="number"
                        name="clientFeeOTOverride"
                        value={getPctDisplay(inputs.clientFeeOTOverride !== null && inputs.clientFeeOTOverride !== undefined ? inputs.clientFeeOTOverride : results.burdens.clientFeeOTPct)}
                        onChange={e => handlePctChange('clientFeeOTOverride', e.target.value)}
                        className="input-field"
                        placeholder="Optional"
                      />
                    </div>

                    {/* Row 2 (Overrides) */}
                    <div className="input-group">
                      <label>State Tax Reg Override (%/hr)</label>
                      <input
                        type="number"
                        name="stateTaxRegularOverride"
                        value={getPctDisplay(inputs.stateTaxRegularOverride)}
                        onChange={e => handlePctChange('stateTaxRegularOverride', e.target.value)}
                        className="input-field"
                        placeholder="Optional"
                      />
                    </div>
                    <div className="input-group">
                      <label>State Tax OT Override (%/hr)</label>
                      <input
                        type="number"
                        name="stateTaxOTOverride"
                        value={getPctDisplay(inputs.stateTaxOTOverride)}
                        onChange={e => handlePctChange('stateTaxOTOverride', e.target.value)}
                        className="input-field"
                        placeholder="Optional"
                      />
                    </div>
                    <div className="input-group">
                      <label>Client Fee Reg Override (%/hr)</label>
                      <input type="number" name="clientFeeRegularOverrideDollar" value={inputs.clientFeeRegularOverrideDollar ?? ''} onChange={handleChange} className="input-field" placeholder="Optional" />
                    </div>
                    <div className="input-group">
                      <label>Client Fee OT Override (%/hr)</label>
                      <input type="number" name="clientFeeOTOverrideDollar" value={inputs.clientFeeOTOverrideDollar ?? ''} onChange={handleChange} className="input-field" placeholder="Optional" />
                    </div>

                    {/* Row 3 (Overheads) */}
                    <div className="input-group">
                      <label>Health Insurance ($)</label>
                      <input type="number" name="healthInsurance" value={inputs.healthInsurance ?? ''} onChange={handleChange} className="input-field" />
                    </div>
                    <div className="input-group">
                      <label>Factoring (%)</label>
                      <input
                        type="number"
                        name="factoringPercent"
                        value={getPctDisplay(inputs.factoringPercent)}
                        onChange={e => handlePctChange('factoringPercent', e.target.value)}
                        className="input-field"
                        placeholder="e.g. 0"
                      />
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* ════════════════ RIGHT COLUMN (OUTPUTS) ════════════════ */}
            <div className="right-column">
              
              {/* Hero Stat Card */}
              <div className="card">
                <div className="stat-hero">
                  <label>WEEKLY GROSS</label>
                  <div className="value">{fc(results.weeklyGross).split('.')[0]}<small>.{fc(results.weeklyGross).split('.')[1]}</small></div>
                </div>
                <div className="stat-sub-row">
                  <div className="stat-sub">
                    <label>Total Bill</label>
                    <div className="val">{fc(results.grossBillRegular + results.grossBillOT)}</div>
                  </div>
                  <div className="stat-sub" style={{ textAlign: 'right' }}>
                    <label>Est. Burden</label>
                    <div className="val" style={{ color: '#f87171' }}>{fc(results.grossCostRegular + results.grossCostOT)}</div>
                  </div>
                </div>
              </div>

              {/* Pay Package Summary Card */}
              <div className="card pay-package-card">
                <div 
                  className="excel-banner-header" 
                  onClick={() => toggleCollapse('summary')} 
                  style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.35rem 0.6rem' }}
                >
                  <span>PAY PACKAGE SUMMARY</span>
                  <span style={{ fontSize: '0.65rem' }}>{collapsed['summary'] ? '▶' : '▼'}</span>
                </div>
                {!collapsed['summary'] && (
                  <table className="excel-summary-table">
                    <tbody>
                      <tr>
                        <td className="summary-label">WEEKLY GROSS</td>
                        <td className="summary-val highlight">{fc(results.weeklyGross)}</td>
                      </tr>
                      <tr>
                        <td className="summary-label">BLENDED HOURLY</td>
                        <td className="summary-val">{fc(results.blendedHourly)}</td>
                      </tr>
                      <tr>
                        <td className="summary-label">W2 HOURLY</td>
                        <td className="summary-val">{fc(results.w2Hourly)}</td>
                      </tr>
                      <tr>
                        <td className="summary-label">PERDIEM WEEKLY / HOURLY</td>
                        <td className="summary-val">{fc(results.perDiemWeekly)}/wk ({fc(results.stipendHourly)}/hr)</td>
                      </tr>
                      <tr>
                        <td className="summary-label">OVERTIME HOURLY</td>
                        <td className="summary-val">{fc(results.overtimeHourly)}</td>
                      </tr>
                      <tr>
                        <td className="summary-label">BONUS ONE TIME</td>
                        <td className="summary-val">{fc(results.bonusOneTimeDisplay)}</td>
                      </tr>
                      <tr>
                        <td className="summary-label">NON BILLABLE HOURS</td>
                        <td className="summary-val">{results.nboHoursDisplay}</td>
                      </tr>
                      <tr>
                        <td className="summary-label">NON BILLABLE PAY</td>
                        <td className="summary-val">{fc(results.nonBillablePay)}</td>
                      </tr>
                      <tr>
                        <td className="summary-label">SHIFT</td>
                        <td className="summary-val" style={{ color: '#2dd4bf' }}>{inputs.shiftsPerWeek && inputs.hoursPerDay ? `${inputs.shiftsPerWeek}x${inputs.hoursPerDay}` : 'Varies'}</td>
                      </tr>
                      <tr>
                        <td className="summary-label">HOURS WEEKLY</td>
                        <td className="summary-val">{inputs.regularHoursPerWeek}</td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </div>
              {/* Margin & Incentive Analysis Card */}
              <div className="card">
                <div className="card-header" onClick={() => toggleCollapse('margin')} style={{ cursor: 'pointer', justifyContent: 'space-between', borderBottom: 'none', marginBottom: '0.2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <h3 style={{ color: '#2dd4bf' }}>MARGIN &amp; INCENTIVE ANALYSIS</h3>
                    <span style={{ fontSize: '0.65rem', color: '#2dd4bf' }}>{collapsed['margin'] ? '▶' : '▼'}</span>
                  </div>
                  <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#2dd4bf', background: 'rgba(45, 212, 191, 0.1)', padding: '0.15rem 0.4rem', borderRadius: '0.25rem', letterSpacing: '0.05em' }}>TARGET: 10%+</span>
                </div>
                {!collapsed['margin'] && (
                  <>
                    <div className="margin-grid">
                      <div className="margin-item">
                        <label>Margin % (Blended)</label>
                        <div className="val">{fp(results.hourlyMarginPct, 1)} <svg style={{width:'0.9rem',height:'0.9rem',display:'inline',verticalAlign:'middle'}} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg></div>
                      </div>
                      <div className="margin-item">
                        <label>Hourly Margin $</label>
                        <div className="val">{fc(results.hourlyMargin)}</div>
                      </div>
                      <div className="margin-item">
                        <label>OT Margin %</label>
                        <div className="val">{fp(results.hourlyOTMarginPct, 1)}</div>
                      </div>
                      <div className="margin-item">
                        <label>OT Margin $</label>
                        <div className="val">{fc(results.hourlyOTMargin)}</div>
                      </div>
                      <div className="margin-item">
                        <label>Gross Margin ($)</label>
                        <div className="val" style={{ color: '#34d399' }}>{fc(results.grossMargin)}</div>
                      </div>
                      <div className="margin-item">
                        <label>Recruiter Incentive (%)</label>
                        <input
                          type="number"
                          name="recruiterIncentivePercent"
                          value={getPctDisplay(inputs.recruiterIncentivePercent)}
                          onChange={e => handlePctChange('recruiterIncentivePercent', e.target.value)}
                          className="input-field"
                          style={{ marginTop: '0.2rem', width: '100%', padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}
                          placeholder="e.g. 4"
                        />
                      </div>
                      <div className="margin-item">
                        <label>USD/INR Rate</label>
                        <input
                          type="number"
                          name="usdInrRate"
                          value={inputs.usdInrRate ?? ''}
                          onChange={handleChange}
                          className="input-field"
                          style={{ marginTop: '0.2rem', width: '100%', padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}
                          placeholder="e.g. 85"
                        />
                      </div>
                      <div className="margin-item">
                        <label>Recruiter Incentive ($)</label>
                        <div className="val" style={{ color: '#34d399' }}>{fc(results.recruiterIncentive)}</div>
                      </div>
                      <div className="margin-item">
                        <label>Recruiter Incentive (INR)</label>
                        <div className="val" style={{ color: '#34d399' }}>₹{Math.round(results.recruiterIncentiveInr).toLocaleString('en-IN')}</div>
                      </div>
                    </div>
                    <div className="progress-section">
                      <div className="progress-labels">
                        <span>0%</span>
                        <span>10% Target</span>
                        <span>20%</span>
                      </div>
                      <div className="progress-bar-bg">
                        <div className="progress-bar-fill" style={{ width: `${Math.min(100, Math.max(0, results.hourlyMarginPct / 0.2 * 100))}%` }}></div>
                        <div className="progress-target-marker"></div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Cost Breakdown Matrix Card */}
              <div className="card">
                <div 
                  className="card-header" 
                  onClick={() => toggleCollapse('costing')} 
                  style={{ cursor: 'pointer', justifyContent: 'space-between' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <h3 style={{ color: '#2dd4bf' }}>COST BREAKDOWN MATRIX</h3>
                  </div>
                  <span style={{ fontSize: '0.65rem', color: '#2dd4bf' }}>{collapsed['costing'] ? '▶' : '▼'}</span>
                </div>
                {!collapsed['costing'] && (
                  <div className="table-wrap" style={{ marginTop: '0.2rem' }}>
                    <table className="cost-table">
                      <thead>
                        <tr>
                          <th>Cost Category</th>
                          <th>One Time</th>
                          <th>Weekly</th>
                          <th>Hourly</th>
                        </tr>
                      </thead>
                      <tbody>
                        <CostRow label="Stipend" row={results.costing.stipend} />
                        <CostRow label="W2 Pay" row={results.costing.w2} />
                        <CostRow label="Overtime Pay" row={results.costing.overtime} />
                        <CostRow label="Bonus" row={results.costing.bonus} />
                        <CostRow label="Reimbursement" row={results.costing.reimbursement} />
                        <CostRow label="Non-Billable Pay" row={results.costing.nonBillablePay} />
                        <CostRow label="Compliance" row={results.costing.compliance} />
                        <CostRow label="Health Insurance" row={results.costing.healthInsurance} />
                        <CostRow label="Client Fee (Regular)" row={results.costing.clientFeeRegular} />
                        <CostRow label="Client Fee (Overtime)" row={results.costing.clientFeeOvertime} />
                        <CostRow label="State Tax (Regular)" row={results.costing.stateTaxRegular} />
                        <CostRow label="State Tax (Overtime)" row={results.costing.stateTaxOvertime} />
                        <CostRow label="Factoring" row={results.costing.factoring} />
                        <tr className="total-row">
                          <td>Total (Regular)</td>
                          <td>{fc(results.costing.totalRegular.oneTime)}</td>
                          <td>{fc(results.costing.totalRegular.weekly)}</td>
                          <td>{fc(results.costing.totalRegular.hourly)}</td>
                        </tr>
                        <tr className="total-row" style={{ color: '#94a3b8' }}>
                          <td>Total (Overtime)</td>
                          <td>{fc(results.costing.totalOvertime.oneTime)}</td>
                          <td>{fc(results.costing.totalOvertime.weekly)}</td>
                          <td>{fc(results.costing.totalOvertime.hourly)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
