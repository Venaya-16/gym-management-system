const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createMyProgress,
  getMyProgress,
  listStudentProgress,
  adminTrainerSummary
} = require('../controllers/progressController');

router.post('/my', protect, createMyProgress);
router.get('/my', protect, getMyProgress);
router.get('/students', protect, listStudentProgress); // trainer/admin
router.get('/trainer-summary', protect, adminTrainerSummary); // admin

module.exports = router;
