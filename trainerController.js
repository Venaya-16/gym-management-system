const Trainer = require('../models/Trainer');

const getAllTrainers = async (req, res) => {
  try {
    const trainers = await Trainer.find().sort({ createdAt: -1 });
    res.json(trainers);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const createTrainer = async (req, res) => {
  try {
    const { name, email, specialization, experience } = req.body;
    if (!name || name.length < 2) return res.status(400).json({ message: 'Name is required' });
    if (!email || !email.includes('@')) return res.status(400).json({ message: 'Valid email required' });
    if (!specialization) return res.status(400).json({ message: 'Specialization is required' });
    if (experience === undefined || experience < 0) return res.status(400).json({ message: 'Valid experience required' });
    const trainer = await Trainer.create({ name, email, specialization, experience });
    res.status(201).json(trainer);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Email already exists' });
    res.status(500).json({ message: err.message });
  }
};

const updateTrainer = async (req, res) => {
  try {
    const trainer = await Trainer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!trainer) return res.status(404).json({ message: 'Trainer not found' });
    res.json(trainer);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const deleteTrainer = async (req, res) => {
  try {
    const trainer = await Trainer.findByIdAndDelete(req.params.id);
    if (!trainer) return res.status(404).json({ message: 'Trainer not found' });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { getAllTrainers, createTrainer, updateTrainer, deleteTrainer };
