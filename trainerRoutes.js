const express = require('express');
const router = express.Router();
const { protect, allowRoles } = require('../middleware/auth');
const { getAllTrainers, createTrainer, updateTrainer, deleteTrainer } = require('../controllers/trainerController');

router.get('/', protect, getAllTrainers);
router.post('/', protect, allowRoles('admin'), createTrainer);
router.put('/:id', protect, allowRoles('admin'), updateTrainer);
router.delete('/:id', protect, allowRoles('admin'), deleteTrainer);

module.exports = router;
