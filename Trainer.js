const mongoose = require('mongoose');
const trainerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Trainer name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true
  },
  specialization: {
    type: String,
    required: [true, 'Specialization is required'],
    trim: true
  },
  experience: {
    type: Number,
    required: [true, 'Experience is required'],
    min: [0, 'Experience cannot be negative']
  }
}, {
  timestamps: true
});
module.exports = mongoose.model('Trainer', trainerSchema);