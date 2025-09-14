const mongoose = require('mongoose');

const committeeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  coordinatorIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  memberIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  assignedEventIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  }],
  description: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Committee', committeeSchema);

