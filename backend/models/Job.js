const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
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
