const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  getCompanyJobs,
  getCandidates,
  updateApplicationStatus,
  getDashboardStats,
  uploadVerificationDocs
} = require('../controllers/companyController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { docUpload } = require('../middleware/uploadMiddleware');

router.use(protect);
router.use(authorize('company'));

router.route('/profile')
  .get(getProfile)
  .put(updateProfile);

router.get('/jobs', getCompanyJobs);
router.get('/candidates', getCandidates);
router.get('/dashboard/stats', getDashboardStats);
router.put('/applications/:id/status', updateApplicationStatus);
router.post('/verification/documents', docUpload.array('documents', 5), uploadVerificationDocs);

module.exports = router;
