const mongoose = require('mongoose');
const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Student name is required'],
    trim: true
  },
  age: {
    type: Number,
    required: [true, 'Age is required'],
    min: [10, 'Age must be at least 10'],
    max: [100, 'Age must be less than 100']
  },
  fitnessGoal: {
    type: String,
    required: [true, 'Fitness goal is required'],
    trim: true
  },
trainer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trainer',
    default: null
  }
}, {
  timestamps: true
});
module.exports = mongoose.model('Student', studentSchema);