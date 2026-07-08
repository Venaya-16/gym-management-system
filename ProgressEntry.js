const mongoose = require('mongoose');

const progressExerciseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    sets: { type: Number, min: 1 },
    reps: { type: Number, min: 1 }
  },
  { _id: false }
);

const progressEntrySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: String, required: true }, // YYYY-MM-DD for easy UI filtering
    weightKg: { type: Number, min: 1 },
    workoutMinutes: { type: Number, min: 0, default: 0 },
    notes: { type: String, trim: true, default: '' },
    exercises: { type: [progressExerciseSchema], default: [] }
  },
  { timestamps: true }
);

progressEntrySchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('ProgressEntry', progressEntrySchema);
