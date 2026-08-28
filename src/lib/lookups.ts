export const clientFees: Record<string, number> = {
  "AdaptiveWFS": 0.06,
  "Adventist Health": 0.055,
  "B4Health": 0.05,
  "Cross Country": 0.0725,
  "Envision": 0.07,
  "HWL": 0.0725,
  "HWL Grady": 0.065,
  "HWL MVHS": 0.065,
  "HWL NET": 0.0,
  "HWL Northside": 0.07,
  "HWL SPH": 0.065,
  "HWL Swedish American": 0.065,
  "LotusOne Midland Memorial": 0.06,
  "LotusOne Providence Health": 0.05,
  "Medefis": 0.0625,
  "OneStaff Medical": 0.05,
  "ShiftMed": 0.06,
  "StafferLink": 0.0625,
  "StaffingEngine": 0.05,
  "Wellstar": 0.065,
  "Works Health": 0.05
};

export const nboFacilities: Record<string, number> = {
  "Paid": 0,
  "Providence Health": 40,
  "Midland Memorial Hospital": 16,
  "Northside Hospital": 16,
  "St. Peter's Health": 12,
  "Grady Memorial Hospital": 12,
  "Swedish American": 12,
  "Adventist Health": 24,
  "BILH/BIDMC": 24,
  "AdaptiveFWS": 24,
  "St. Marys Regional": 16,
  "Boone Health": 16,
  "Kona Community Hospital": 12,
  "Hilo Medical Center": 12,
  "St. Joseph Healthcare": 16
};

export function getVmsFee(client: string): number {
  return clientFees[client] ?? 0;
}

export function getNboHours(facility: string): number {
  return nboFacilities[facility] ?? 0;
}

export const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", "Georgia",
  "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts",
  "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey",
  "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island",
  "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia",
  "Wisconsin", "Wyoming"
];
