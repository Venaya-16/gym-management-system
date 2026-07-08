const Student = require('../models/Student');

const getAllStudents = async (req, res) => {
  try {
    const students = await Student.find().populate('trainer', 'name email specialization').sort({ createdAt: -1 });
    res.json(students);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const createStudent = async (req, res) => {
  try {
    const { name, age, fitnessGoal, trainer } = req.body;
    if (!name || name.length < 2) return res.status(400).json({ message: 'Name is required' });
    if (!age || age < 10 || age > 100) return res.status(400).json({ message: 'Age must be between 10 and 100' });
    if (!fitnessGoal) return res.status(400).json({ message: 'Fitness goal is required' });
    const student = await Student.create({ name, age, fitnessGoal, trainer: trainer || null });
    await student.populate('trainer', 'name email specialization');
    res.status(201).json(student);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const updateStudent = async (req, res) => {
  try {
    if (req.body.trainer === '') req.body.trainer = null;
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate('trainer', 'name email specialization');
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { getAllStudents, createStudent, updateStudent, deleteStudent };
