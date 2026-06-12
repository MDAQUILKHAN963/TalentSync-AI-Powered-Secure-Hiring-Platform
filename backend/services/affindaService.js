/**
 * Affinda Resume Parser Service
 * Sends PDF to Affinda API v3 for structured data extraction.
 * Falls back to local pdf-parse + keyword extraction if API is unavailable.
 */

const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const pdfParse = require('pdf-parse');

const AFFINDA_API_KEY = process.env.AFFINDA_API_KEY;
const AFFINDA_API_URL = process.env.AFFINDA_API_URL || 'https://api.affinda.com/v3';

// Cached workspace/collection identifiers
let cachedWorkspace = null;
let cachedCollection = null;

// Comprehensive skill keywords for fallback extraction
const SKILL_KEYWORDS = [
  'python', 'java', 'javascript', 'typescript', 'c++', 'c#', 'go', 'rust', 'ruby', 'php', 'swift', 'kotlin',
  'react', 'angular', 'vue', 'next.js', 'node.js', 'express', 'django', 'flask', 'spring boot', 'laravel',
  'html', 'css', 'tailwind', 'bootstrap', 'sass', 'less',
  'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'firebase', 'dynamodb', 'cassandra',
  'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'jenkins', 'ci/cd',
  'git', 'github', 'gitlab', 'bitbucket',
  'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'scikit-learn', 'nlp', 'computer vision',
  'data science', 'data analysis', 'pandas', 'numpy', 'matplotlib', 'tableau', 'power bi',
  'rest api', 'graphql', 'microservices', 'websocket',
  'agile', 'scrum', 'jira', 'figma', 'photoshop',
  'linux', 'bash', 'powershell',
  'blockchain', 'solidity', 'web3',
  'react native', 'flutter', 'android', 'ios',
  'selenium', 'jest', 'mocha', 'cypress', 'pytest'
];

const EDUCATION_LEVELS = {
  'phd': 'PhD',
  'ph.d': 'PhD',
  'doctorate': 'PhD',
  'master': 'Masters',
  'm.s.': 'Masters',
  'm.tech': 'Masters',
  'mba': 'Masters',
  'bachelor': 'Bachelors',
  'b.s.': 'Bachelors',
  'b.tech': 'Bachelors',
  'b.e.': 'Bachelors',
  'bca': 'Bachelors',
  'bsc': 'Bachelors',
  'diploma': 'Diploma',
  'high school': 'High School',
  '12th': 'High School',
  '10th': 'Secondary'
};

/**
 * Initialize Affinda — discover workspace and collection IDs
 */
async function initializeAffinda() {
  if (cachedWorkspace && cachedCollection) return true;

  try {
    // Get workspaces
    const wsRes = await axios.get(`${AFFINDA_API_URL}/workspaces`, {
      headers: { 'Authorization': `Bearer ${AFFINDA_API_KEY}` }
    });

    if (wsRes.data && wsRes.data.results && wsRes.data.results.length > 0) {
      cachedWorkspace = wsRes.data.results[0].identifier;

      // Get collections in the workspace
      const colRes = await axios.get(`${AFFINDA_API_URL}/collections`, {
        headers: { 'Authorization': `Bearer ${AFFINDA_API_KEY}` },
        params: { workspace: cachedWorkspace }
      });

      if (colRes.data && colRes.data.results && colRes.data.results.length > 0) {
        cachedCollection = colRes.data.results[0].identifier;
      }

      console.log(`[Affinda] Initialized — workspace: ${cachedWorkspace}, collection: ${cachedCollection || 'auto'}`);
      return true;
    }
  } catch (err) {
    console.error('[Affinda] Init failed:', err.response?.data?.detail || err.message);
  }
  return false;
}

/**
 * Parse resume via Affinda API
 */
async function parseWithAffinda(filePath) {
  try {
    const initialized = await initializeAffinda();

    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    formData.append('wait', 'true');

    if (cachedWorkspace) {
      formData.append('workspace', cachedWorkspace);
    }
    if (cachedCollection) {
      formData.append('collection', cachedCollection);
    }

    const response = await axios.post(`${AFFINDA_API_URL}/documents`, formData, {
      headers: {
        'Authorization': `Bearer ${AFFINDA_API_KEY}`,
        ...formData.getHeaders()
      },
      timeout: 30000
    });

    const data = response.data?.data;
    if (!data) throw new Error('No data in Affinda response');

    // Extract structured fields from Affinda response
    const skills = [];
    if (data.skills) {
      data.skills.forEach(s => {
        if (s.name) skills.push(s.name);
      });
    }

    const education = [];
    if (data.education) {
      data.education.forEach(e => {
        education.push({
          institution: e.organization || '',
          degree: e.accreditation?.education || '',
          dates: e.dates?.completionDate || ''
        });
      });
    }

    const experience = [];
    let totalMonths = 0;
    if (data.workExperience) {
      data.workExperience.forEach(w => {
        experience.push({
          company: w.organization || '',
          title: w.jobTitle || '',
          description: w.jobDescription || '',
          dates: {
            start: w.dates?.startDate || '',
            end: w.dates?.endDate || ''
          }
        });
        if (w.dates?.monthsInPosition) {
          totalMonths += w.dates.monthsInPosition;
        }
      });
    }

    const certifications = [];
    if (data.certifications) {
      data.certifications.forEach(c => {
        if (c.name) certifications.push(c.name);
      });
    }

    const experienceYears = totalMonths > 0 ? Math.round(totalMonths / 12) : estimateExperience(experience);
    const educationLevel = detectEducationLevel(education.map(e => e.degree).join(' '));
    const detectedRole = data.profession || detectRole(skills, data.jobTitle);

    // Calculate resume strength
    const strength = calculateStrength(skills, education, experience, certifications);

    return {
      success: true,
      source: 'affinda',
      profile: {
        skills,
        education,
        experience,
        certifications,
        experience_years: experienceYears,
        education_level: educationLevel,
        role: detectedRole,
        resume_strength: strength,
        raw_text: data.rawText || '',
        name: data.name?.raw || '',
        email: data.emails?.[0] || '',
        phone: data.phoneNumbers?.[0] || ''
      }
    };
  } catch (err) {
    console.error('[Affinda] Parse error:', err.response?.data?.detail || err.message);
    return null;
  }
}

/**
 * Extract raw text from a PDF buffer.
 * Tries pdf-parse first (fast), then modern pdfjs-dist — pdf-parse's bundled
 * engine is from 2018 and rejects many modern PDFs with "bad XRef entry".
 */
async function extractPdfText(dataBuffer) {
  try {
    const pdfData = await pdfParse(dataBuffer);
    if (pdfData.text && pdfData.text.trim()) return pdfData.text;
  } catch (err) {
    console.warn('[PDF Extract] pdf-parse failed, trying pdfjs-dist:', err.message);
  }

  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const doc = await pdfjs.getDocument({ data: new Uint8Array(dataBuffer) }).promise;
  let text = '';
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map(item => item.str).join(' ') + '\n';
  }
  return text;
}

/**
 * Fallback: Parse resume using local PDF text extraction + keyword matching
 */
async function parseWithFallback(filePath) {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const text = await extractPdfText(dataBuffer) || '';
    const textLower = text.toLowerCase();

    // Extract skills via keyword matching (word boundaries prevent false hits
    // like "java" inside "javascript" or "go" inside "mongodb")
    const skills = SKILL_KEYWORDS.filter(skill => {
      const escaped = skill.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(`(?<!\\w)${escaped}(?!\\w)`).test(textLower);
    });

    // Detect education level
    const educationLevel = detectEducationLevel(textLower);

    // Estimate experience
    const yearMatches = text.match(/\b(20[0-2]\d|19[9]\d)\b/g) || [];
    const years = yearMatches.map(Number).sort();
    let experienceYears = 0;
    if (years.length >= 2) {
      experienceYears = years[years.length - 1] - years[0];
    }

    // Detect role from text
    const role = detectRole(skills);

    // Calculate strength
    const strength = calculateStrength(skills, [], [], []);

    // Extract certifications via keywords
    const certKeywords = ['certified', 'certification', 'aws certified', 'google certified', 'microsoft certified',
      'pmp', 'scrum master', 'cissp', 'comptia', 'oracle certified'];
    const certifications = certKeywords.filter(c => textLower.includes(c));

    return {
      success: true,
      source: 'fallback',
      profile: {
        skills: [...new Set(skills)],
        education: [],
        experience: [],
        certifications,
        experience_years: Math.min(experienceYears, 30),
        education_level: educationLevel,
        role,
        resume_strength: strength,
        raw_text: text,
        tips: generateTips(skills, educationLevel, experienceYears)
      }
    };
  } catch (err) {
    console.error('[Fallback Parser] Error:', err.message);
    return {
      success: false,
      source: 'fallback',
      error: err.message
    };
  }
}

/**
 * Main entry point — tries Affinda first, falls back to local parsing
 */
async function parseResume(filePath) {
  // Try Affinda first
  if (AFFINDA_API_KEY) {
    console.log('[ResumeParser] Attempting Affinda API...');
    const affindaResult = await parseWithAffinda(filePath);
    if (affindaResult && affindaResult.success) {
      console.log('[ResumeParser] Affinda succeeded — extracted', affindaResult.profile.skills.length, 'skills');
      // Generate tips if missing
      if (!affindaResult.profile.tips) {
        affindaResult.profile.tips = generateTips(
          affindaResult.profile.skills,
          affindaResult.profile.education_level,
          affindaResult.profile.experience_years
        );
      }
      return affindaResult;
    }
  }

  // Fallback to local parsing
  console.log('[ResumeParser] Falling back to local parser...');
  return parseWithFallback(filePath);
}

// --- Helper Functions ---

function detectEducationLevel(text) {
  const lower = (text || '').toLowerCase();
  for (const [keyword, level] of Object.entries(EDUCATION_LEVELS)) {
    if (lower.includes(keyword)) return level;
  }
  return 'Unknown';
}

function detectRole(skills, explicitRole) {
  if (explicitRole) return explicitRole;
  
  const skillSet = new Set((skills || []).map(s => s.toLowerCase()));
  
  if (skillSet.has('machine learning') || skillSet.has('tensorflow') || skillSet.has('pytorch')) return 'ML Engineer';
  if (skillSet.has('data science') || skillSet.has('pandas') || skillSet.has('data analysis')) return 'Data Scientist';
  if (skillSet.has('react') || skillSet.has('vue') || skillSet.has('angular')) return 'Frontend Developer';
  if (skillSet.has('node.js') || skillSet.has('django') || skillSet.has('spring boot')) return 'Backend Developer';
  if (skillSet.has('docker') || skillSet.has('kubernetes') || skillSet.has('terraform')) return 'DevOps Engineer';
  if (skillSet.has('flutter') || skillSet.has('react native')) return 'Mobile Developer';
  if (skillSet.has('figma') || skillSet.has('photoshop')) return 'UI/UX Designer';
  if (skillSet.has('python') || skillSet.has('java') || skillSet.has('javascript')) return 'Software Engineer';
  
  return 'Software Professional';
}

function calculateStrength(skills, education, experience, certifications) {
  let score = 30; // base
  score += Math.min((skills || []).length * 5, 35);
  score += (education || []).length > 0 ? 10 : 0;
  score += Math.min((experience || []).length * 5, 15);
  score += (certifications || []).length > 0 ? 10 : 0;
  return Math.min(score, 98);
}

function estimateExperience(experienceList) {
  if (!experienceList || experienceList.length === 0) return 0;
  return Math.min(experienceList.length * 2, 15); // rough estimate
}

function generateTips(skills, educationLevel, experienceYears) {
  const tips = [];
  
  if ((skills || []).length < 5) {
    tips.push("Add more technical skills — aim for 8-12 relevant technologies to improve match rates.");
  }
  if ((skills || []).length >= 5 && (skills || []).length < 10) {
    tips.push("Good skill coverage. Consider adding project-specific tools and frameworks.");
  }
  if (!educationLevel || educationLevel === 'Unknown') {
    tips.push("Include your education details clearly with degree name and institution.");
  }
  if (experienceYears < 1) {
    tips.push("Include internships, freelance, or open-source contributions as experience.");
  }

  tips.push("Use action verbs and quantify achievements (e.g., 'Reduced load time by 40%').");
  tips.push("Ensure consistent formatting for dates, locations, and section headers.");
  
  return tips.slice(0, 4);
}

module.exports = { parseResume, SKILL_KEYWORDS };
