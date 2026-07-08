const ProgressEntry = require('../models/ProgressEntry');
const User = require('../models/User');
const Trainer = require('../models/Trainer');
const Student = require('../models/Student');
const WorkoutPlan = require('../models/WorkoutPlan');
const Schedule = require('../models/Schedule');

const createMyProgress = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can add progress entries' });
    }

    const { date, weightKg, workoutMinutes, notes, exercises } = req.body;
    if (!date) return res.status(400).json({ message: 'Date is required' });

    const safeExercises = Array.isArray(exercises)
      ? exercises
          .filter((e) => e && e.name)
          .map((e) => ({
            name: String(e.name).trim(),
            sets: e.sets !== undefined ? Number(e.sets) : undefined,
            reps: e.reps !== undefined ? Number(e.reps) : undefined
          }))
      : [];

    const entry = await ProgressEntry.create({
      user: req.user._id,
      date,
      weightKg: weightKg !== undefined && weightKg !== '' ? Number(weightKg) : undefined,
      workoutMinutes: workoutMinutes !== undefined && workoutMinutes !== '' ? Number(workoutMinutes) : 0,
      notes: notes || '',
      exercises: safeExercises
    });

    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getMyProgress = async (req, res) => {
  try {
    const entries = await ProgressEntry.find({ user: req.user._id }).sort({ date: -1, createdAt: -1 }).limit(60);
    res.json(entries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const listStudentProgress = async (req, res) => {
  try {
    if (req.user.role !== 'trainer' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only trainer/admin can view student progress' });
    }

    const { username, from, to } = req.query;
    const userQuery = { role: 'student' };
    if (username) userQuery.username = username;

    const students = await User.find(userQuery).select('username role');
    const userIds = students.map((u) => u._id);

    const progressQuery = { user: { $in: userIds } };
    if (from || to) {
      progressQuery.date = {};
      if (from) progressQuery.date.$gte = String(from);
      if (to) progressQuery.date.$lte = String(to);
    }

    const entries = await ProgressEntry.find(progressQuery)
      .populate('user', 'username role')
      .sort({ date: -1, createdAt: -1 })
      .limit(200);

    res.json(entries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const adminTrainerSummary = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });

    const trainerUsers = await User.find({ role: 'trainer' }).select('username email');
    const trainers = await Trainer.find().select('email name specialization');

    const byEmail = new Map();
    trainers.forEach((t) => byEmail.set(String(t.email).toLowerCase(), t));

    const summaries = await Promise.all(
      trainerUsers.map(async (u) => {
        const trainerProfile = byEmail.get(String(u.email).toLowerCase());
        if (!trainerProfile) {
          return {
            username: u.username,
            trainerName: '(no profile linked)',
            specialization: 'N/A',
            assignedStudents: 0,
            workoutPlans: 0,
            scheduledSlots: 0
          };
        }

        const [assignedStudents, workoutPlans, scheduledSlots] = await Promise.all([
          Student.countDocuments({ trainer: trainerProfile._id }),
          WorkoutPlan.countDocuments({ trainer: trainerProfile._id }),
          Schedule.countDocuments({ trainer: trainerProfile._id })
        ]);

        return {
          username: u.username,
          trainerName: trainerProfile.name,
          specialization: trainerProfile.specialization,
          assignedStudents,
          workoutPlans,
          scheduledSlots
        };
      })
    );

    res.json(summaries.sort((a, b) => (b.assignedStudents + b.workoutPlans) - (a.assignedStudents + a.workoutPlans)));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createMyProgress, getMyProgress, listStudentProgress, adminTrainerSummary };
