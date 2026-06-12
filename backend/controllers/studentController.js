const Student = require('../models/Student');
const Job = require('../models/Job');
const Application = require('../models/Application');
const { rankJobs, matchCandidateToJob } = require('../services/matchingService');
const { timeAgo } = require('../utils/timeAgo');

// @desc    Get current student profile
// @route   GET /api/student/profile
exports.getProfile = async (req, res) => {
  try {
    let student = await Student.findOne({ user: req.user._id }).populate('user', 'firstName lastName email');
    
    if (!student) {
      student = await Student.create({ user: req.user._id });
    }
    
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update student profile
// @route   PUT /api/student/profile
exports.updateProfile = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) return res.status(404).json({ message: 'Student profile not found' });

    const fieldsToUpdate = [
      'university', 'degree', 'year', 'skills', 
      'bio', 'github', 'linkedin'
    ];

    fieldsToUpdate.forEach(field => {
      if (req.body[field] !== undefined) {
        student[field] = req.body[field];
      }
    });

    await student.save();
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Save a job to bookmarks
// @route   POST /api/student/jobs/:jobId/save
exports.saveJob = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    const jobId = req.params.jobId;

    if (student.savedJobs.some(s => s.job.toString() === jobId)) {
      return res.status(400).json({ message: 'Job already saved' });
    }

    student.savedJobs.push({ job: jobId, savedAt: new Date() });
    await student.save();
    res.json({ message: 'Job saved successfully', savedJobs: student.savedJobs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Unsave a job from bookmarks
// @route   DELETE /api/student/jobs/:jobId/unsave
exports.unsaveJob = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    const jobId = req.params.jobId;

    student.savedJobs = student.savedJobs.filter(s => s.job.toString() !== jobId);
    await student.save();
    res.json({ message: 'Job removed successfully', savedJobs: student.savedJobs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all saved jobs
// @route   GET /api/student/jobs/saved
exports.getSavedJobs = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id }).populate({
      path: 'savedJobs.job',
      populate: { path: 'company', select: 'companyName location' }
    });

    if (!student) return res.json([]);
    // Return the job documents (same shape the frontend already expects)
    res.json((student.savedJobs || []).map(s => s.job).filter(Boolean));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get AI-powered job recommendations (uses built-in matching engine)
// @route   GET /api/student/recommendations
exports.getRecommendations = async (req, res) => {
  try {
    const startTime = Date.now();
    const student = await Student.findOne({ user: req.user._id });
    if (!student) return res.status(404).json({ message: 'Student profile not found' });

    const jobs = await Job.find({ status: 'open' }).populate('company', 'companyName location industry verifiedStatus');
    
    if (!student.skills || student.skills.length === 0) {
      return res.json(jobs.map(j => ({ ...j.toObject(), match: 0, matchData: null })));
    }

    // Use built-in matching engine (no Python dependency)
    const candidateData = {
      skills: student.skills,
      raw_text: student.parsedResumeText || student.skills.join(' '),
      experience_years: student.experience_years || 0
    };

    const rankedJobs = rankJobs(candidateData, jobs);

    const elapsedMs = Date.now() - startTime;
    res.set('X-Response-Time', `${elapsedMs}ms`);
    console.log(`[Recommendations] Ranked ${rankedJobs.length} jobs for student ${student._id} in ${elapsedMs}ms`);
    res.json(rankedJobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get dashboard metrics and activity
// @route   GET /api/student/dashboard/stats
exports.getDashboardStats = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) return res.status(404).json({ message: 'Student profile not found' });

    const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
    const DAY_START = new Date().setHours(0, 0, 0, 0);

    // 1. Matched Jobs & Top Match Score (using built-in engine)
    const jobs = await Job.find({ status: 'open' });
    let matchedJobsCount = 0;
    let matchedThisWeek = 0;
    let topMatchScore = 0;

    if (student.skills && student.skills.length > 0) {
      const candidateData = {
        skills: student.skills,
        raw_text: student.parsedResumeText || student.skills.join(' '),
        experience_years: student.experience_years || 0
      };

      const ranked = rankJobs(candidateData, jobs);
      const matched = ranked.filter(j => j.match >= 50);
      matchedJobsCount = matched.length;
      // Real delta: matched jobs that were posted within the last 7 days
      matchedThisWeek = matched.filter(j => new Date(j.createdAt).getTime() > Date.now() - WEEK_MS).length;
      topMatchScore = ranked.length > 0 ? Math.round(ranked[0].match) : 0;
    }

    // 2. Applications Sent
    const applications = await Application.find({ student: student._id })
      .populate({ path: 'job', populate: { path: 'company', select: 'companyName' } })
      .sort({ appliedAt: -1 });

    const pendingReviewCount = applications.filter(a => a.status === 'pending').length;

    // 3. Profile Views — real counts from the view log (companies viewing candidates)
    const viewsToday = (student.profileViewLog || []).filter(d => new Date(d).getTime() >= DAY_START).length;

    // 4. Recent Activity — real timestamps
    const populatedStudent = await Student.findById(student._id).populate({
      path: 'savedJobs.job',
      populate: { path: 'company', select: 'companyName' }
    });

    const recentSaved = (populatedStudent.savedJobs || [])
      .filter(s => s.job)
      .slice(-5)
      .map(s => ({
        company: s.job.company?.companyName || 'Unknown',
        role: s.job.title || 'Unknown Role',
        status: 'Saved',
        time: timeAgo(s.savedAt),
        color: '#635BFF',
        date: s.savedAt
      }));

    const recentApps = applications.slice(0, 3).map(a => ({
      company: a.job?.company?.companyName || 'Unknown',
      role: a.job?.title || 'Unknown Role',
      status: a.status.charAt(0).toUpperCase() + a.status.slice(1),
      time: timeAgo(a.appliedAt),
      color: a.status === 'rejected' ? '#ef4444' : (a.status === 'pending' ? '#f59e0b' : '#10b981'),
      date: a.appliedAt
    }));

    const recentActivity = [...recentApps, ...recentSaved]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 4);

    // 5. Profile Strength
    let strength = 20;
    if (student.bio) strength += 15;
    if (student.resumeUrl) strength += 25;
    if (student.skills && student.skills.length >= 3) strength += 20;
    if (student.university && student.degree) strength += 20;

    const strengthTips = [
       { done: true, label: 'Account created' },
       { done: !!student.bio, label: 'Add a professional bio' },
       { done: !!student.resumeUrl, label: 'Upload your resume' },
       { done: (student.skills?.length >= 3), label: 'Add 3+ skills' },
       { done: (!!student.university && !!student.degree), label: 'Complete education history' },
    ];

    const scoreLabel = topMatchScore >= 80 ? 'Excellent fit available'
      : topMatchScore >= 50 ? 'Good matches found'
      : student.skills?.length ? 'Add more skills to improve'
      : 'Upload your resume';

    res.json({
      kpis: [
        { label: 'Matched Jobs', value: matchedJobsCount, delta: `+${matchedThisWeek} this week`, color: '#6366f1' },
        { label: 'Applications Sent', value: applications.length, delta: `${pendingReviewCount} pending review`, color: '#f59e0b' },
        { label: 'Profile Views', value: student.profileViews || 0, delta: `+${viewsToday} today`, color: '#10b981' },
        { label: 'Match Score', value: `${topMatchScore}%`, delta: scoreLabel, color: '#ff6b00' },
      ],
      recentActivity,
      profileStrength: {
         score: Math.min(strength, 100),
         tips: strengthTips
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
