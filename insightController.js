const Trainer = require('../models/Trainer');
const Student = require('../models/Student');
const WorkoutPlan = require('../models/WorkoutPlan');
const Schedule = require('../models/Schedule');

const getOverview = async (req, res) => {
  try {
    const [trainerCount, studentCount, workoutCount, scheduleCount, trainers, schedules] = await Promise.all([
      Trainer.countDocuments(),
      Student.countDocuments(),
      WorkoutPlan.countDocuments(),
      Schedule.countDocuments(),
      Trainer.find().select('specialization'),
      Schedule.find().populate('trainer', 'name').sort({ date: 1, time: 1 }).limit(50)
    ]);

    const specializationMap = {};
    trainers.forEach((t) => {
      const key = (t.specialization || 'General').trim();
      specializationMap[key] = (specializationMap[key] || 0) + 1;
    });
    const topSpecialization = Object.keys(specializationMap).sort((a, b) => specializationMap[b] - specializationMap[a])[0] || 'N/A';

    const today = new Date().toISOString().slice(0, 10);
    const todaysSchedules = schedules.filter((s) => s.date === today).map((s) => ({
      trainerName: s.trainer ? s.trainer.name : 'Unknown',
      date: s.date,
      time: s.time
    }));

    res.json({
      totals: { trainerCount, studentCount, workoutCount, scheduleCount },
      topSpecialization,
      todaysSchedules
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getOverview };
