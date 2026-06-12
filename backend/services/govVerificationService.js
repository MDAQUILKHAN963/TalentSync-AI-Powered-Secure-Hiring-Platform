/**
 * Government Registration Verification Service
 *
 * Validates Indian company identifiers using the official, publicly specified
 * algorithms — this is real validation, not a mock:
 *
 *  1. GSTIN  — 15-char format + the official GSTN check-digit algorithm
 *              (Luhn mod-36 variant over the first 14 characters).
 *  2. CIN    — 21-char MCA structure: listing status, NIC industry code,
 *              state code, incorporation year, ownership type, registration no.
 *
 * If a GST verification API provider is configured (GST_VERIFY_URL/KEY),
 * it is called for live registry lookup; otherwise validation is offline.
 * (GSTN's official API is only available through paid GSP providers —
 * there is no free public endpoint.)
 */

const axios = require('axios');

const CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// Official GST state codes
const GST_STATE_CODES = {
  '01': 'Jammu & Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab', '04': 'Chandigarh',
  '05': 'Uttarakhand', '06': 'Haryana', '07': 'Delhi', '08': 'Rajasthan',
  '09': 'Uttar Pradesh', '10': 'Bihar', '11': 'Sikkim', '12': 'Arunachal Pradesh',
  '13': 'Nagaland', '14': 'Manipur', '15': 'Mizoram', '16': 'Tripura',
  '17': 'Meghalaya', '18': 'Assam', '19': 'West Bengal', '20': 'Jharkhand',
  '21': 'Odisha', '22': 'Chhattisgarh', '23': 'Madhya Pradesh', '24': 'Gujarat',
  '26': 'Dadra & Nagar Haveli and Daman & Diu', '27': 'Maharashtra',
  '29': 'Karnataka', '30': 'Goa', '31': 'Lakshadweep', '32': 'Kerala',
  '33': 'Tamil Nadu', '34': 'Puducherry', '35': 'Andaman & Nicobar', '36': 'Telangana',
  '37': 'Andhra Pradesh', '38': 'Ladakh'
};

// MCA CIN state abbreviations
const CIN_STATES = [
  'AN','AP','AR','AS','BR','CH','CT','DL','DN','GA','GJ','HP','HR','JH','JK',
  'KA','KL','LD','MH','ML','MN','MP','MZ','NL','OR','PB','PY','RJ','SK','TG','TN','TR','UP','UR','UT','WB'
];

// MCA ownership type codes
const CIN_OWNERSHIP = ['FLC','FTC','GAP','GAT','GOI','NPL','OPC','PLC','PTC','SGC','ULL','ULT'];

/**
 * Official GSTN check-digit algorithm (Luhn mod-36 variant).
 * Computes the 15th character from the first 14.
 */
function gstinCheckDigit(gstin14) {
  let total = 0;
  for (let i = 0; i < gstin14.length; i++) {
    let v = CHARS.indexOf(gstin14[i]);
    if (v < 0) return null;
    v = v * (i % 2 !== 0 ? 2 : 1);
    total += Math.floor(v / 36) + (v % 36);
  }
  return CHARS[(36 - (total % 36)) % 36];
}

/**
 * Validate a GSTIN: structure + state code + embedded PAN format + check digit.
 * Returns { valid, reasons[], details{} }
 */
function validateGSTIN(gstinRaw) {
  const reasons = [];
  const gstin = (gstinRaw || '').toUpperCase().trim();

  if (gstin.length !== 15) {
    return { valid: false, reasons: ['GSTIN must be exactly 15 characters'], details: {} };
  }

  // Structure: 2-digit state | 10-char PAN | entity code | 'Z' | check digit
  if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gstin)) {
    reasons.push('GSTIN structure invalid (expected: 2-digit state + PAN + entity code + Z + check digit)');
  }

  const stateCode = gstin.slice(0, 2);
  const state = GST_STATE_CODES[stateCode];
  if (!state) {
    reasons.push(`Unknown GST state code "${stateCode}"`);
  }

  // Official check-digit verification
  const expected = gstinCheckDigit(gstin.slice(0, 14));
  if (expected !== gstin[14]) {
    reasons.push('GSTIN check digit failed government checksum verification');
  }

  return {
    valid: reasons.length === 0,
    reasons,
    details: reasons.length === 0 ? {
      state,
      pan: gstin.slice(2, 12),
      entityCode: gstin[12]
    } : {}
  };
}

/**
 * Validate a CIN against the MCA 21-character structure:
 * [L/U] + 5-digit NIC code + 2-letter state + 4-digit year + 3-letter ownership + 6-digit reg no.
 * e.g. U72200KA2015PTC081234
 */
function validateCIN(cinRaw) {
  const reasons = [];
  const cin = (cinRaw || '').toUpperCase().trim();

  if (cin.length !== 21) {
    return { valid: false, reasons: ['CIN must be exactly 21 characters'], details: {} };
  }

  const m = cin.match(/^([LU])(\d{5})([A-Z]{2})(\d{4})([A-Z]{3})(\d{6})$/);
  if (!m) {
    return { valid: false, reasons: ['CIN structure invalid (expected: L/U + NIC code + state + year + ownership + reg no.)'], details: {} };
  }

  const [, listing, nic, state, year, ownership] = m;

  if (!CIN_STATES.includes(state)) {
    reasons.push(`Unknown state code "${state}" in CIN`);
  }
  const yearNum = parseInt(year, 10);
  const currentYear = new Date().getFullYear();
  if (yearNum < 1850 || yearNum > currentYear) {
    reasons.push(`Implausible incorporation year "${year}" in CIN`);
  }
  if (!CIN_OWNERSHIP.includes(ownership)) {
    reasons.push(`Unknown ownership type "${ownership}" in CIN`);
  }

  return {
    valid: reasons.length === 0,
    reasons,
    details: reasons.length === 0 ? {
      listed: listing === 'L',
      nicCode: nic,
      state,
      incorporationYear: yearNum,
      ownershipType: ownership
    } : {}
  };
}

/**
 * Optional live registry lookup via a configured GST verification provider.
 * Returns null when no provider is configured or the call fails —
 * callers then rely on offline checksum validation.
 */
async function lookupGSTRegistry(gstin) {
  const url = process.env.GST_VERIFY_URL;
  const key = process.env.GST_VERIFY_KEY;
  if (!url || !key) return null;

  try {
    const res = await axios.get(`${url}${encodeURIComponent(gstin)}`, {
      headers: { Authorization: `Bearer ${key}` },
      timeout: 8000
    });
    return res.data || null;
  } catch (err) {
    console.warn('[GovVerify] Live GST registry lookup failed, using offline validation:', err.message);
    return null;
  }
}

/**
 * Full company verification: CIN + GSTIN.
 * Returns { status: 'verified'|'rejected', reasons[], details{} }
 */
async function verifyCompanyRegistration(cin, gstin) {
  const cinResult = validateCIN(cin);
  const gstResult = validateGSTIN(gstin);

  const reasons = [...cinResult.reasons, ...gstResult.reasons];

  // Optional live registry confirmation when a provider is configured
  let registry = null;
  if (gstResult.valid) {
    registry = await lookupGSTRegistry((gstin || '').toUpperCase().trim());
    if (registry && registry.active === false) {
      reasons.push('GSTIN is not active in the GST registry');
    }
  }

  return {
    status: reasons.length === 0 ? 'verified' : 'rejected',
    reasons,
    details: {
      cin: cinResult.details,
      gstin: gstResult.details,
      registrySource: registry ? 'live-api' : 'offline-checksum'
    }
  };
}

module.exports = { verifyCompanyRegistration, validateGSTIN, validateCIN, gstinCheckDigit };
