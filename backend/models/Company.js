const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  companyName: {
    type: String,
    required: true
  },
  govRegId: {
    type: String,
    required: true,
    unique: true
  },
  gstCin: {
    type: String,
    required: true,
    unique: true
  },
  verifiedStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  verificationReasons: [{
    type: String
  }],
  verificationDocs: [{
    docType: String,
    fileName: String,
    fileUrl: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  description: String,
  website: String,
  location: String,
  industry: String
}, { timestamps: true });

module.exports = mongoose.model('Company', CompanySchema);
