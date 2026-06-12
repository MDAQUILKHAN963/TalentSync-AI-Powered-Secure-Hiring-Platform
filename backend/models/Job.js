const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
  // Platform jobs reference a verified Company; external (aggregated) jobs don't
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: function () { return this.source !== 'external'; }
  },
  source: {
    type: String,
    enum: ['platform', 'external'],
    default: 'platform'
  },
  externalCompanyName: String,
  externalSource: String, // e.g. 'arbeitnow', 'remotive'
  applyUrl: {
    type: String,
    unique: true,
    sparse: true // only external jobs have one
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  skillsRequired: [{
    type: String
  }],
  location: String,
  salaryRange: String,
  jobType: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Internship', 'Contract'],
    default: 'Full-time'
  },
  fraudRisk: {
    type: Number,
    default: 0
  },
  flaggedReasons: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['open', 'closed'],
    default: 'open'
  },
  views: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('Job', JobSchema);
