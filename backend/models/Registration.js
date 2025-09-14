const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  leaderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  groupMembers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  packageId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid'],
    default: 'pending'
  },
  qrCode: {
    type: String,
    required: true,
    unique: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  isGroupRegistration: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient queries
registrationSchema.index({ eventId: 1, leaderId: 1 });
registrationSchema.index({ qrCode: 1 });

module.exports = mongoose.model('Registration', registrationSchema);

