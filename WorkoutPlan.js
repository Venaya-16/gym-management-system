const mongoose = require('mongoose');
const exerciseSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  sets: { type: Number, required: true, min: 1 },
  reps: { type: Number, required: true, min: 1 }
}, { _id: false });
const workoutPlanSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Plan title is required'],
    trim: true
  },
  exercises: {
    type: [exerciseSchema],
    validate: {
      validator: (arr) => arr.length > 0,
      message: 'At least one exercise is required'
    }
  },
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    min: [1, 'Duration must be at least 1 minute']
  },
  trainer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trainer',
    required: [true, 'Trainer is required']
  }
}, {
  timestamps: true
});
module.exports = mongoose.model('WorkoutPlan', workoutPlanSchema);