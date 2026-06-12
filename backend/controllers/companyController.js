const Company = require('../models/Company');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Student = require('../models/Student');
const { timeAgo } = require('../utils/timeAgo');

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

async function getCompanyForUser(userId) {
  return Company.findOne({ user: userId });
}

function initials(firstName = '', lastName = '') {
  return `${(firstName[0] || '')}${(lastName[0] || '')}`.toUpperCase() || '?';
}

// @desc    Get current company profile
// @route   GET /api/company/profile
exports.getProfile = async (req, res) => {
  try {
    const company = await Company.findOne({ user: req.user._id }).populate('user', 'firstName lastName email');
    if (!company) return res.status(404).json({ message: 'Company profile not found' });
    res.json(company);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update company profile
// @route   PUT /api/company/profile
exports.updateProfile = async (req, res) => {
  try {
    const company = await getCompanyForUser(req.user._id);
    if (!company) return res.status(404).json({ message: 'Company profile not found' });

    const fields = ['companyName', 'description', 'website', 'location', 'industry'];
    fields.forEach(f => {
      if (req.body[f] !== undefined) company[f] = req.body[f];
    });

    await company.save();
    res.json(company);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get this company's jobs with real applicant counts
// @route   GET /api/company/jobs
exports.getCompanyJobs = async (req, res) => {
  try {
    const company = await getCompanyForUser(req.user._id);
    if (!company) return res.status(404).json({ message: 'Company profile not found' });

    const jobs = await Job.find({ company: company._id }).sort({ createdAt: -1 });
    const jobIds = jobs.map(j => j._id);

    // Count applications per job in one query
    const counts = await Application.aggregate([
      { $match: { job: { $in: jobIds } } },
      { $group: { _id: '$job', count: { $sum: 1 } } }
    ]);
    const countMap = Object.fromEntries(counts.map(c => [c._id.toString(), c.count]));

    res.json(jobs.map(j => ({
      ...j.toObject(),
      applicantCount: countMap[j._id.toString()] || 0,
      posted: timeAgo(j.createdAt)
    })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all candidates who applied to this company's jobs.
//          Also records a real profile view for each student listed.
// @route   GET /api/company/candidates
exports.getCandidates = async (req, res) => {
  try {
    const company = await getCompanyForUser(req.user._id);
    if (!company) return res.status(404).json({ message: 'Company profile not found' });

    const jobs = await Job.find({ company: company._id }).select('_id title');
    const applications = await Application.find({ job: { $in: jobs.map(j => j._id) } })
      .populate({
        path: 'student',
        select: 'skills resumeUrl detectedRole user',
        populate: { path: 'user', select: 'firstName lastName email' }
      })
      .populate('job', 'title')
      .sort({ appliedAt: -1 });

    // Record a real profile view for each distinct student the company is seeing
    const studentIds = [...new Set(applications.map(a => a.student?._id?.toString()).filter(Boolean))];
    if (studentIds.length > 0) {
      await Student.updateMany(
        { _id: { $in: studentIds } },
        { $inc: { profileViews: 1 }, $push: { profileViewLog: new Date() } }
      );
    }

    res.json(applications.map(a => ({
      id: a._id,
      name: a.student?.user ? `${a.student.user.firstName} ${a.student.user.lastName}`.trim() : 'Unknown',
      email: a.student?.user?.email || '',
      avatar: initials(a.student?.user?.firstName, a.student?.user?.lastName),
      role: a.job?.title || 'Unknown Role',
      match: Math.round(a.matchScore || 0),
      status: a.status,
      applied: timeAgo(a.appliedAt),
      appliedAt: a.appliedAt,
      skills: a.student?.skills || [],
      resumeUrl: a.student?.resumeUrl || null,
      phone: a.phone || '',
      linkedinUrl: a.linkedinUrl || ''
    })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update an application's status (review pipeline)
// @route   PUT /api/company/applications/:id/status
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['pending', 'reviewed', 'shortlisted', 'rejected', 'hired'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${allowed.join(', ')}` });
    }

    const company = await getCompanyForUser(req.user._id);
    if (!company) return res.status(404).json({ message: 'Company profile not found' });

    const application = await Application.findById(req.params.id).populate('job', 'company');
    if (!application) return res.status(404).json({ message: 'Application not found' });

    // Only the company that owns the job can update its applications
    if (application.job.company.toString() !== company._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this application' });
    }

    application.status = status;
    await application.save();
    res.json({ message: 'Status updated', application });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload verification documents (resubmission path for rejected companies).
//          Stores the files and moves the company into the manual review queue.
// @route   POST /api/company/verification/documents
exports.uploadVerificationDocs = async (req, res) => {
  try {
    const company = await getCompanyForUser(req.user._id);
    if (!company) return res.status(404).json({ message: 'Company profile not found' });

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'Please upload at least one document' });
    }

    let docTypes = [];
    try {
      docTypes = JSON.parse(req.body.docTypes || '[]');
    } catch { /* fall back to generic labels */ }

    req.files.forEach((file, i) => {
      company.verificationDocs.push({
        docType: docTypes[i] || 'Supporting Document',
        fileName: file.originalname,
        fileUrl: `/uploads/${file.filename}`,
        uploadedAt: new Date()
      });
    });

    // Already-verified companies stay verified; rejected/pending go to manual review
    if (company.verifiedStatus !== 'verified') {
      company.verifiedStatus = 'pending';
      company.verificationReasons = [];
    }

    await company.save();

    res.status(201).json({
      message: 'Documents submitted for review',
      verifiedStatus: company.verifiedStatus,
      documents: company.verificationDocs
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Real dashboard KPIs and activity for the company
// @route   GET /api/company/dashboard/stats
exports.getDashboardStats = async (req, res) => {
  try {
    const company = await getCompanyForUser(req.user._id);
    if (!company) return res.status(404).json({ message: 'Company profile not found' });

    const jobs = await Job.find({ company: company._id }).sort({ createdAt: -1 });
    const jobIds = jobs.map(j => j._id);
    const activeJobs = jobs.filter(j => j.status === 'open');

    const applications = await Application.find({ job: { $in: jobIds } })
      .populate({
        path: 'student',
        select: 'user',
        populate: { path: 'user', select: 'firstName lastName' }
      })
      .populate('job', 'title')
      .sort({ appliedAt: -1 });

    const weekAgo = Date.now() - WEEK_MS;
    const newThisWeek = applications.filter(a => new Date(a.appliedAt).getTime() > weekAgo).length;
    const hiredCount = applications.filter(a => a.status === 'hired').length;
    const hireRate = applications.length > 0 ? Math.round((hiredCount / applications.length) * 100) : 0;

    // Applicant counts per job
    const countMap = {};
    applications.forEach(a => {
      const id = a.job?._id?.toString();
      if (id) countMap[id] = (countMap[id] || 0) + 1;
    });

    res.json({
      kpis: [
        { label: 'Active Jobs', value: activeJobs.length, delta: `${jobs.length - activeJobs.length} closed`, type: 'blue' },
        { label: 'Total Applicants', value: applications.length, delta: `+${newThisWeek} this week`, type: 'orange' },
        { label: 'Verification', value: company.verifiedStatus === 'verified' ? 'Verified' : company.verifiedStatus, delta: company.verifiedStatus === 'verified' ? 'Government approved' : 'Action required', type: 'green' },
        { label: 'Hire Rate', value: `${hireRate}%`, delta: `${hiredCount} hired of ${applications.length}`, type: 'purple' }
      ],
      recentApplicants: applications.slice(0, 4).map(a => ({
        name: a.student?.user ? `${a.student.user.firstName} ${a.student.user.lastName}`.trim() : 'Unknown',
        avatar: initials(a.student?.user?.firstName, a.student?.user?.lastName),
        role: a.job?.title || 'Unknown Role',
        status: a.status.charAt(0).toUpperCase() + a.status.slice(1),
        time: timeAgo(a.appliedAt)
      })),
      activeJobs: jobs.slice(0, 5).map(j => ({
        id: j._id,
        title: j.title,
        applicants: countMap[j._id.toString()] || 0,
        posted: timeAgo(j.createdAt),
        status: j.status === 'open' ? 'Active' : 'Closed'
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
