const express = require('express');
const router = express.Router();
const { protect, allowRoles } = require('../middleware/auth');
const { getAllWorkouts, createWorkout, updateWorkout, deleteWorkout } = require('../controllers/workoutController');

router.get('/', protect, getAllWorkouts);
router.post('/', protect, allowRoles('admin', 'trainer'), createWorkout);
router.put('/:id', protect, allowRoles('admin', 'trainer'), updateWorkout);
router.delete('/:id', protect, allowRoles('admin', 'trainer'), deleteWorkout);

module.exports = router;
