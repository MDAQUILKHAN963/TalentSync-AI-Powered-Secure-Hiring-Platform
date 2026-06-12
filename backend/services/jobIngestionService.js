/**
 * External Job Ingestion Service
 * Pulls real, currently-open job postings from free public job-board APIs
 * (no API keys required) and imports them as 'external' jobs:
 *
 *   - Arbeitnow  — https://www.arbeitnow.com/api/job-board-api
 *   - Remotive   — https://remotive.com/api/remote-jobs
 *
 * Each posting is cleaned (HTML stripped), skill-tagged with the platform's
 * keyword extractor, and screened by the fraud-detection rule engine before
 * being stored. External jobs link out via applyUrl instead of in-app apply.
 */

const axios = require('axios');
const Job = require('../models/Job');
const { SKILL_KEYWORDS } = require('./affindaService');
const { detectFraud } = require('./fraudDetectionService');

const MAX_PER_SOURCE = 8;
const MAX_DESC_LENGTH = 1500;

function stripHtml(html) {
  return (html || '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#?\w+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractSkills(text) {
  const lower = (text || '').toLowerCase();
  return SKILL_KEYWORDS.filter(skill => {
    // Word-boundary match so "go" doesn't hit "category" or "rust" hit "trust"
    const escaped = skill.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|[^a-z0-9+#.])${escaped}($|[^a-z0-9+#.])`).test(lower);
  });
}

function mapJobType(raw) {
  const t = (raw || '').toLowerCase();
  if (t.includes('intern')) return 'Internship';
  if (t.includes('part')) return 'Part-time';
  if (t.includes('contract') || t.includes('freelance')) return 'Contract';
  return 'Full-time';
}

async function fetchArbeitnow() {
  const res = await axios.get('https://www.arbeitnow.com/api/job-board-api', { timeout: 10000 });
  return (res.data?.data || []).map(j => ({
    title: j.title,
    description: stripHtml(j.description).slice(0, MAX_DESC_LENGTH),
    externalCompanyName: j.company_name,
    location: j.remote ? 'Remote' : (j.location || 'Not specified'),
    jobType: mapJobType((j.job_types || [])[0]),
    applyUrl: j.url,
    tags: j.tags || [],
    externalSource: 'arbeitnow'
  }));
}

async function fetchRemotive() {
  const res = await axios.get('https://remotive.com/api/remote-jobs', {
    params: { limit: 20, category: 'software-dev' },
    timeout: 10000
  });
  return (res.data?.jobs || []).map(j => ({
    title: j.title,
    description: stripHtml(j.description).slice(0, MAX_DESC_LENGTH),
    externalCompanyName: j.company_name,
    location: j.candidate_required_location ? `Remote (${j.candidate_required_location})` : 'Remote',
    jobType: mapJobType(j.job_type),
    salaryRange: j.salary || '',
    applyUrl: j.url,
    tags: j.tags || [],
    externalSource: 'remotive'
  }));
}

/**
 * Ingest external jobs. Skips if external jobs already exist (idempotent on boot).
 * Network failures are non-fatal — the platform works fine without external jobs.
 */
async function ingestExternalJobs() {
  try {
    const existing = await Job.countDocuments({ source: 'external' });
    if (existing > 0) {
      console.log(`[Ingest] ${existing} external jobs already present — skipping`);
      return;
    }

    const results = await Promise.allSettled([fetchArbeitnow(), fetchRemotive()]);
    let imported = 0;
    let screenedOut = 0;

    for (const result of results) {
      if (result.status !== 'fulfilled') {
        console.warn('[Ingest] Source failed:', result.reason?.message);
        continue;
      }

      for (const posting of result.value.slice(0, MAX_PER_SOURCE)) {
        if (!posting.title || !posting.description || !posting.applyUrl) continue;

        // Screen external postings with the same fraud rules as platform jobs
        const fraud = detectFraud(posting.description);
        if (fraud.is_fraud) {
          screenedOut++;
          continue;
        }

        // Skill-tag using description + source tags
        const skills = [...new Set([
          ...extractSkills(posting.title + ' ' + posting.description),
          ...extractSkills((posting.tags || []).join(' '))
        ])];

        try {
          await Job.create({
            source: 'external',
            title: posting.title,
            description: posting.description,
            skillsRequired: skills,
            location: posting.location,
            salaryRange: posting.salaryRange || '',
            jobType: posting.jobType,
            applyUrl: posting.applyUrl,
            externalCompanyName: posting.externalCompanyName,
            externalSource: posting.externalSource,
            fraudRisk: fraud.risk_score,
            status: 'open'
          });
          imported++;
        } catch (err) {
          if (err.code !== 11000) console.warn('[Ingest] Insert failed:', err.message); // 11000 = duplicate applyUrl
        }
      }
    }

    console.log(`[Ingest] ✓ Imported ${imported} live external jobs${screenedOut ? ` (${screenedOut} screened out by fraud rules)` : ''}`);
  } catch (err) {
    console.warn('[Ingest] External job ingestion skipped:', err.message);
  }
}

module.exports = { ingestExternalJobs };
