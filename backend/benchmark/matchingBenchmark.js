/**
 * Matching Engine Benchmark
 * Measures (1) recommendation relevance — do the expected jobs land in the top 5
 * for realistic candidate personas — and (2) ranking latency.
 *
 * Run: node benchmark/matchingBenchmark.js
 */

const { rankJobs } = require('../services/matchingService');
const { COMPANIES } = require('../seed');

// Flatten seed data into the 12 job listings
const JOBS = COMPANIES.flatMap(c =>
  c.jobs.map(j => ({ ...j, companyName: c.profile.companyName }))
);

// Candidate personas with the jobs a human would consider relevant
const PERSONAS = [
  {
    name: 'Frontend Developer',
    skills: ['react', 'typescript', 'javascript', 'html', 'css', 'jest'],
    experience_years: 2,
    relevant: ['Senior Frontend Engineer', 'React Frontend Developer', 'UI Engineer – Content Platform']
  },
  {
    name: 'ML / Data Scientist',
    skills: ['python', 'tensorflow', 'pytorch', 'machine learning', 'pandas', 'scikit-learn', 'sql'],
    experience_years: 1,
    relevant: ['Machine Learning Engineer', 'Data Science Intern', 'Data Engineer – Analytics']
  },
  {
    name: 'DevOps Engineer',
    skills: ['docker', 'kubernetes', 'terraform', 'aws', 'azure', 'linux', 'bash', 'ci/cd'],
    experience_years: 3,
    relevant: ['Cloud DevOps Engineer', 'Backend Engineer – AWS']
  },
  {
    name: 'Backend Engineer',
    skills: ['java', 'go', 'microservices', 'rest api', 'sql', 'docker', 'postgresql'],
    experience_years: 2,
    relevant: ['Backend Engineer – AWS', 'Backend Engineer – Microservices', 'API Platform Engineer']
  },
  {
    name: 'Mobile Developer',
    skills: ['react native', 'javascript', 'typescript', 'android', 'ios', 'react'],
    experience_years: 1,
    relevant: ['Mobile Developer – React Native', 'React Frontend Developer']
  }
];

function buildCandidate(p) {
  return {
    skills: p.skills,
    raw_text: p.skills.join(' '),
    experience_years: p.experience_years
  };
}

console.log('='.repeat(72));
console.log('TalentSync Matching Engine Benchmark');
console.log(`Jobs in corpus: ${JOBS.length} | Personas: ${PERSONAS.length}`);
console.log('='.repeat(72));

// ---- 1. Relevance: hit-rate of expected jobs in top-5 recommendations ----
let totalExpected = 0;
let totalHits = 0;

for (const persona of PERSONAS) {
  const ranked = rankJobs(buildCandidate(persona), JOBS);
  const top5 = ranked.slice(0, 5);
  const top5Titles = top5.map(j => j.title);

  const hits = persona.relevant.filter(r => top5Titles.includes(r));
  totalExpected += persona.relevant.length;
  totalHits += hits.length;

  console.log(`\n${persona.name}  —  ${hits.length}/${persona.relevant.length} expected jobs in top 5`);
  top5.forEach((j, i) => {
    const mark = persona.relevant.includes(j.title) ? '✓' : ' ';
    console.log(`   ${i + 1}. [${mark}] ${j.title} (${j.companyName}) — ${j.match}%`);
  });
}

const hitRate = ((totalHits / totalExpected) * 100).toFixed(1);

// ---- 2. Latency: average time to rank all jobs for one candidate ----
const ITERATIONS = 100;
const candidate = buildCandidate(PERSONAS[0]);

// warm-up
for (let i = 0; i < 5; i++) rankJobs(candidate, JOBS);

const start = process.hrtime.bigint();
for (let i = 0; i < ITERATIONS; i++) {
  rankJobs(candidate, JOBS);
}
const end = process.hrtime.bigint();
const avgMs = Number(end - start) / 1e6 / ITERATIONS;

console.log('\n' + '='.repeat(72));
console.log('RESULTS');
console.log('='.repeat(72));
console.log(`Top-5 relevance hit rate : ${totalHits}/${totalExpected} expected jobs surfaced = ${hitRate}%`);
console.log(`Avg ranking latency      : ${avgMs.toFixed(2)} ms per candidate (${JOBS.length} jobs, ${ITERATIONS} runs)`);
console.log('='.repeat(72));
