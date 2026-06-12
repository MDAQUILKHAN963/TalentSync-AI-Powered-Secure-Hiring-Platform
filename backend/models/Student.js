const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  university: {
    type: String,
    required: false
  },
  degree: {
    type: String,
    required: false
  },
  year: {
    type: String,
    required: false
  },
  skills: [{
    type: String
  }],
  resumeUrl: {
    type: String,
    required: false
  },
  bio: {
    type: String,
    required: false
  },
  github: String,
  linkedin: String,
  profileViews: {
    type: Number,
    default: 0
  },
  // Timestamps of when companies viewed this profile (for real "+N today" stats)
  profileViewLog: [{
    type: Date
  }],
  savedJobs: [{
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job'
    },
    savedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // AI-parsed resume fields
  experience_years: {
    type: Number,
    default: 0
  },
  education_level: String,
  certifications: [String],
  parsedResumeText: String,
  detectedRole: String,
  resumeStrength: {
    type: Number,
    default: 0
  },
  parsedEducation: [{
    institution: String,
    degree: String,
    dates: String
  }],
  parsedExperience: [{
    company: String,
    title: String,
    description: String
  }]
}, { timestamps: true });

module.exports = mongoose.model('Student', StudentSchema);
