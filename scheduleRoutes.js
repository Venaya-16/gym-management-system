const express = require('express');
const router = express.Router();
const { protect, allowRoles } = require('../middleware/auth');
const { getAllSchedules, createSchedule, deleteSchedule } = require('../controllers/scheduleController');

router.get('/', protect, getAllSchedules);
router.post('/', protect, allowRoles('admin', 'trainer'), createSchedule);
router.delete('/:id', protect, allowRoles('admin', 'trainer'), deleteSchedule);

module.exports = router;
