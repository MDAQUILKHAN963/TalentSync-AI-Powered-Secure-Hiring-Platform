const Job = require('../models/Job');
const Company = require('../models/Company');
const Application = require('../models/Application');
const Student = require('../models/Student');
const axios = require('axios');
const { matchCandidateToJob } = require('../services/matchingService');
const { detectFraud } = require('../services/fraudDetectionService');

// @desc    Create a new job
// @route   POST /api/jobs
exports.createJob = async (req, res) => {
  try {
    const company = await Company.findOne({ user: req.user._id });
    
    if (!company || company.verifiedStatus !== 'verified') {
      return res.status(403).json({ message: 'Only verified companies can post jobs' });
    }

    // 1. Run Fraud Detection before saving (AI service first, rule-based fallback)
    let fraudRisk = 0;
    let flaggedReasons = [];

    if (req.body.description) {
      let analysis = null;

      // Try the Python ML service (Gemini-based) first
      try {
        const mlResponse = await axios.post(`${process.env.ML_SERVICE_URL}/fraud-detect`, {
          job_description: req.body.description
        }, { timeout: 5000 });

        if (mlResponse.data.success) {
          analysis = { ...mlResponse.data.analysis, source: 'gemini-ml' };
        }
      } catch (err) {
        console.warn('[FraudDetect] ML service unavailable, using rule-based detector:', err.message);
      }

      // Fallback: built-in rule-based detector (always available)
      if (!analysis) {
        analysis = detectFraud(req.body.description);
      }

      fraudRisk = analysis.risk_score || 0;
      flaggedReasons = analysis.reasons || [];
      console.log(`[FraudDetect] source=${analysis.source} risk=${fraudRisk}${flaggedReasons.length ? ' reasons=' + flaggedReasons.join('; ') : ''}`);

      // Reject immediately if highly fraudulent
      if (analysis.is_fraud || fraudRisk > 70) {
        return res.status(400).json({
          message: 'Job posting blocked due to security concerns.',
          reasons: flaggedReasons
        });
      }
    }

    // 2. Create the Job
    const job = await Job.create({
      ...req.body,
      company: company._id,
      fraudRisk: fraudRisk,
      flaggedReasons: flaggedReasons
    });

    res.status(201).json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all jobs
// @route   GET /api/jobs
exports.getJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ status: 'open' }).populate('company', 'companyName location industry verifiedStatus');
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get a single job with real applicant count (tracks views)
// @route   GET /api/jobs/:id
exports.getJobById = async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    ).populate('company', 'companyName location industry website verifiedStatus description');

    if (!job) return res.status(404).json({ message: 'Job not found' });

    const applicantCount = await Application.countDocuments({ job: job._id });

    res.json({ ...job.toObject(), applicantCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a job (owner company only) — e.g. open/close it
// @route   PUT /api/jobs/:id
exports.updateJob = async (req, res) => {
  try {
    const company = await Company.findOne({ user: req.user._id });
    const job = await Job.findById(req.params.id);

    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (!company || job.company.toString() !== company._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this job' });
    }

    const fields = ['title', 'description', 'skillsRequired', 'location', 'salaryRange', 'jobType', 'status'];
    fields.forEach(f => {
      if (req.body[f] !== undefined) job[f] = req.body[f];
    });

    await job.save();
    res.json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a job and its applications (owner company only)
// @route   DELETE /api/jobs/:id
exports.deleteJob = async (req, res) => {
  try {
    const company = await Company.findOne({ user: req.user._id });
    const job = await Job.findById(req.params.id);

    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (!company || job.company.toString() !== company._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this job' });
    }

    await Application.deleteMany({ job: job._id });
    await job.deleteOne();
    res.json({ message: 'Job and its applications deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Apply for a job
// @route   POST /api/jobs/:id/apply
exports.applyJob = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const alreadyApplied = await Application.findOne({
      student: student._id,
      job: req.params.id
    });

    if (alreadyApplied) {
      return res.status(400).json({ message: 'You have already applied for this job' });
    }

    // AI Matching Logic — use the same built-in engine as recommendations
    let matchScore = 0;
    try {
      const job = await Job.findById(req.params.id);
      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }

      const candidateData = {
        skills: student.skills || [],
        raw_text: student.parsedResumeText || (student.skills || []).join(' '),
        experience_years: student.experience_years || 0
      };

      const matchData = matchCandidateToJob(candidateData, {
        skillsRequired: job.skillsRequired || [],
        description: job.description || '',
        minExperience: job.minExperience || 0
      });

      matchScore = matchData.match_percent;
    } catch (err) {
      console.error('AI Matching Error:', err.message);
      matchScore = 0; // unscored — never fabricate a score
    }

    const application = await Application.create({
      student: student._id,
      job: req.params.id,
      matchScore: matchScore,
      coverLetter: req.body.coverLetter || '',
      phone: req.body.phone,
      linkedinUrl: req.body.linkedinUrl
    });

    res.status(201).json(application);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const googleAIService = require('../services/googleAIService');

// @desc    Get skill gap analysis for a job
// @route   GET /api/jobs/:id/gap
exports.getJobSkillGap = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id }).populate('user', 'email');
    const job = await Job.findById(req.params.id);

    if (!student || !job) {
      return res.status(404).json({ message: 'Skill analysis data missing' });
    }

    try {
      // Use Google Gemini AI for advanced analysis
      const aiAnalysis = await googleAIService.getSkillAnalysis(student, job);
      return res.json(aiAnalysis);
    } catch (aiErr) {
      console.error('[SkillGap] AI analysis failed, falling back to local logic:', aiErr.message);
      
      // Fallback if AI fails (basic string filtering)
      const missing = job.skillsRequired.filter(s => 
        !student.skills.some(ss => ss.toLowerCase() === s.toLowerCase())
      );
      
      res.json({
        missing_skills: missing,
        matching_skills: student.skills.filter(s => 
          job.skillsRequired.some(js => js.toLowerCase() === s.toLowerCase())
        ),
        optimization_tips: [
          "Ensure your resume highlights the required skills mentioned in the job description.",
          "Add quantifiable achievements for the skills you already possess."
        ],
        suitability_score: Math.min(Math.round((student.skills.filter(s =>
          job.skillsRequired.some(js => js.toLowerCase() === s.toLowerCase())
        ).length / (job.skillsRequired.length || 1)) * 100), 100),
        recommendation: "Review the job description to understand key requirements and tailor your application accordingly."
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current student's applications
// @route   GET /api/jobs/my-applications
exports.getMyApplications = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const applications = await Application.find({ student: student._id })
      .populate({
        path: 'job',
        select: 'title location salaryRange jobType',
        populate: {
          path: 'company',
          select: 'companyName industry'
        }
      })
      .sort({ appliedAt: -1 });

    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
