const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  description: {
    type: String
  },
  isStudentDiscount: {
    type: Boolean,
    default: false
  },
  isBulkPackage: {
    type: Boolean,
    default: false
  }
});

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  committeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Committee',
    required: true
  },
  committeeMemberIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  dateTime: {
    type: Date,
    required: true
  },
  venue: {
    type: String,
    required: true
  },
  fee: {
    type: Number,
    required: true,
    default: 0
  },
  packages: [packageSchema],
  isGroup: {
    type: Boolean,
    default: false
  },
  maxGroupSize: {
    type: Number,
    default: 1
  },
  rules: [String],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Event', eventSchema);

