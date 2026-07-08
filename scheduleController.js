const Schedule = require('../models/Schedule');

const getAllSchedules = async (req, res) => {
  try {
    const schedules = await Schedule.find().populate('trainer', 'name specialization').sort({ date: 1, time: 1 });
    res.json(schedules);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const createSchedule = async (req, res) => {
  try {
    const { trainer, date, time } = req.body;
    if (!trainer) return res.status(400).json({ message: 'Trainer is required' });
    if (!date) return res.status(400).json({ message: 'Date is required' });
    if (!time) return res.status(400).json({ message: 'Time is required' });
    const schedule = await Schedule.create({ trainer, date, time });
    await schedule.populate('trainer', 'name specialization');
    res.status(201).json(schedule);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'This trainer already has a slot at this date and time' });
    res.status(500).json({ message: err.message });
  }
};

const deleteSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.findByIdAndDelete(req.params.id);
    if (!schedule) return res.status(404).json({ message: 'Schedule not found' });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { getAllSchedules, createSchedule, deleteSchedule };
