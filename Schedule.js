const mongoose = require('mongoose');
const scheduleSchema = new mongoose.Schema({
  trainer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trainer',
    required: [true, 'Trainer is required']
  },
  date: {
    type: String,
    required: [true, 'Date is required']
  },
  time: {
    type: String,
    required: [true, 'Time is required'],
    trim: true
  }
}, {
  timestamps: true
});
scheduleSchema.index({ trainer: 1, date: 1, time: 1 }, { unique: true });
module.exports = mongoose.model('Schedule', scheduleSchema);