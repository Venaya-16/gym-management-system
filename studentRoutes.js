const express = require('express');
const router = express.Router();
const { protect, allowRoles } = require('../middleware/auth');
const { getAllStudents, createStudent, updateStudent, deleteStudent } = require('../controllers/studentController');

router.get('/', protect, getAllStudents);
router.post('/', protect, allowRoles('admin', 'trainer'), createStudent);
router.put('/:id', protect, allowRoles('admin', 'trainer'), updateStudent);
router.delete('/:id', protect, allowRoles('admin', 'trainer'), deleteStudent);

module.exports = router;
