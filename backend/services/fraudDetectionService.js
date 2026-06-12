/**
 * Rule-Based Fraud Detection Service
 * Scores job descriptions for scam patterns using weighted keyword heuristics.
 * Used as the primary fallback when the Python ML service (Gemini) is unavailable,
 * so fraud detection always runs on every job posting.
 */

const FRAUD_RULES = [
  // Payment demands — strongest scam signal
  { pattern: /\b(registration|training|processing|security|refundable|joining)\s*(fee|fees|deposit|charge|amount)\b/i, weight: 35, reason: 'Demands an upfront fee or deposit from applicants' },
  { pattern: /\b(pay|deposit|transfer|send)\s+(a\s+)?(small\s+)?(amount|money|fee|₹|\$|rs\.?)\b/i, weight: 35, reason: 'Asks applicants to pay or transfer money' },
  { pattern: /\bpay\s*(before|to)\s*(joining|apply|start)/i, weight: 35, reason: 'Requires payment before joining' },

  // Suspicious contact channels
  { pattern: /\b(telegram|whatsapp)\s*(only|number|dm|message)?\b/i, weight: 20, reason: 'Uses informal messaging apps (Telegram/WhatsApp) as the contact method' },
  { pattern: /\bdm\s+(us|me)\s+(on|at)\b/i, weight: 15, reason: 'Recruits via direct messages instead of official channels' },

  // Too-good-to-be-true promises
  { pattern: /\b(earn|make)\s+(up\s*to\s*)?(₹|\$|rs\.?)\s*[\d,]+\s*(per|a|\/)\s*(day|hour)\b/i, weight: 25, reason: 'Promises unrealistic daily/hourly earnings' },
  { pattern: /\b(no\s+(experience|skills?|interview)\s+(required|needed))\b/i, weight: 15, reason: 'Claims no experience or interview is required' },
  { pattern: /\b(guaranteed\s+(income|job|placement|earnings)|quick\s+money|easy\s+money)\b/i, weight: 25, reason: 'Guarantees income or promises easy money' },

  // Sensitive data harvesting
  { pattern: /\b(aadhaa?r|pan\s*card|bank\s+(details|account)|credit\s+card|debit\s+card|ssn|passport)\b/i, weight: 30, reason: 'Requests sensitive personal/financial documents upfront' },
  { pattern: /\botp\b/i, weight: 30, reason: 'Mentions OTP sharing — a common scam tactic' },

  // Pressure tactics
  { pattern: /\b(limited\s+(slots|seats|positions)|apply\s+(now|immediately|within)|urgent(ly)?\s+hiring|act\s+fast)\b/i, weight: 10, reason: 'Uses urgency/pressure tactics' },
];

/**
 * Analyze a job description for fraud signals.
 * Returns the same shape as the Python ML service: { is_fraud, risk_score, reasons }
 */
function detectFraud(jobDescription) {
  const text = (jobDescription || '').toString();

  let riskScore = 0;
  const reasons = [];

  for (const rule of FRAUD_RULES) {
    if (rule.pattern.test(text)) {
      riskScore += rule.weight;
      reasons.push(rule.reason);
    }
  }

  riskScore = Math.min(riskScore, 100);

  return {
    is_fraud: riskScore >= 70,
    risk_score: riskScore,
    reasons,
    source: 'rule-based'
  };
}

module.exports = { detectFraud };
