const express = require('express');
const router = express.Router();
const { createJob, getJobs, getJobById, updateJob, deleteJob, applyJob, getJobSkillGap, getMyApplications } = require('../controllers/jobController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/my-applications', protect, authorize('student'), getMyApplications);

router.route('/')
  .get(getJobs)
  .post(protect, authorize('company'), createJob);

router.post('/:id/apply', protect, authorize('student'), applyJob);
router.get('/:id/gap', protect, authorize('student'), getJobSkillGap);

router.route('/:id')
  .get(getJobById)
  .put(protect, authorize('company'), updateJob)
  .delete(protect, authorize('company'), deleteJob);

module.exports = router;
