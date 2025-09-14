const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema({
  registrationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Registration',
    required: true
  },
  participantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  judgeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  round: {
    type: String,
    default: 'final'
  },
  comments: {
    type: String
  }
}, {
  timestamps: true
});

// Index for efficient queries
scoreSchema.index({ registrationId: 1, participantId: 1 });
scoreSchema.index({ judgeId: 1 });

module.exports = mongoose.model('Score', scoreSchema);

