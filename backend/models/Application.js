const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'shortlisted', 'rejected', 'hired'],
    default: 'pending'
  },
  stage: {
    type: String,
    enum: ['applied', 'screening', 'interview', 'technical', 'offer', 'hired'],
    default: 'applied'
  },
  matchScore: {
    type: Number,
    default: 0
  },
  coverLetter: {
    type: String,
    default: ''
  },
  phone: String,
  linkedinUrl: String,
  appliedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Prevent duplicate applications
ApplicationSchema.index({ student: 1, job: 1 }, { unique: true });

module.exports = mongoose.model('Application', ApplicationSchema);
