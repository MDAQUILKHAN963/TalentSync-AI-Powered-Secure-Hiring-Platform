/**
 * Normalize a job object for API responses.
 * External (aggregated) jobs have no Company reference — synthesize a
 * company-shaped object from the external metadata so every frontend
 * component renders both kinds of job identically.
 */
function normalizeJob(jobObj) {
  const o = jobObj.toObject ? jobObj.toObject() : { ...jobObj };

  if (o.source === 'external' && !o.company) {
    o.company = {
      companyName: o.externalCompanyName || 'External Company',
      location: o.location,
      industry: o.externalSource === 'remotive' ? 'Remote Jobs' : 'Job Board',
      verifiedStatus: null // external listings are not gov-verified
    };
  }

  return o;
}

module.exports = { normalizeJob };
