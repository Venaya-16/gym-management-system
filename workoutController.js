const WorkoutPlan = require('../models/WorkoutPlan');

const getAllWorkouts = async (req, res) => {
  try {
    const plans = await WorkoutPlan.find().populate('trainer', 'name specialization').sort({ createdAt: -1 });
    res.json(plans);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const createWorkout = async (req, res) => {
  try {
    const { title, exercises, duration, trainer } = req.body;
    if (!title || title.length < 2) return res.status(400).json({ message: 'Title is required' });
    if (!duration || duration < 1) return res.status(400).json({ message: 'Duration is required' });
    if (!trainer) return res.status(400).json({ message: 'Trainer is required' });
    if (!exercises || exercises.length === 0) return res.status(400).json({ message: 'At least one exercise required' });
    const plan = await WorkoutPlan.create({ title, exercises, duration, trainer });
    await plan.populate('trainer', 'name specialization');
    res.status(201).json(plan);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const updateWorkout = async (req, res) => {
  try {
    const plan = await WorkoutPlan.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate('trainer', 'name specialization');
    if (!plan) return res.status(404).json({ message: 'Workout not found' });
    res.json(plan);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const deleteWorkout = async (req, res) => {
  try {
    const plan = await WorkoutPlan.findByIdAndDelete(req.params.id);
    if (!plan) return res.status(404).json({ message: 'Workout not found' });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { getAllWorkouts, createWorkout, updateWorkout, deleteWorkout };
