const express = require('express');
const Registration = require('../models/Registration');
const Attendance = require('../models/Attendance');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Verify QR code
router.post('/verify', auth, requireRole('committee', 'admin'), async (req, res) => {
  try {
    const { qrCode } = req.body;

    if (!qrCode) {
      return res.status(400).json({ message: 'QR code is required' });
    }

    // Find registration by QR code
    const registration = await Registration.findOne({ qrCode })
      .populate('eventId', 'title description dateTime venue')
      .populate('leaderId', 'name email collegeId year')
      .populate('groupMembers', 'name email collegeId year');

    if (!registration) {
      return res.status(404).json({ message: 'Invalid QR code' });
    }

    // Check if committee has access to this event
    if (req.user.role === 'committee') {
      // This would need to be implemented based on committee assignments
      // For now, we'll allow all committee members to verify any event
    }

    res.json({
      message: 'QR code verified successfully',
      registration: {
        id: registration._id,
        event: registration.eventId,
        leader: registration.leaderId,
        groupMembers: registration.groupMembers,
        paymentStatus: registration.paymentStatus,
        isGroupRegistration: registration.isGroupRegistration,
        totalAmount: registration.totalAmount
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark attendance
router.post('/attendance', auth, requireRole('committee', 'admin'), async (req, res) => {
  try {
    const { registrationId, participantId, status, notes } = req.body;

    if (!registrationId || !participantId || !status) {
      return res.status(400).json({ 
        message: 'Registration ID, participant ID, and status are required' 
      });
    }

    if (!['present', 'absent'].includes(status)) {
      return res.status(400).json({ 
        message: 'Status must be either "present" or "absent"' 
      });
    }

    // Check if attendance already exists
    const existingAttendance = await Attendance.findOne({
      registrationId,
      participantId
    });

    if (existingAttendance) {
      // Update existing attendance
      existingAttendance.status = status;
      existingAttendance.verifiedBy = req.user._id;
      existingAttendance.verifiedAt = new Date();
      existingAttendance.notes = notes;
      await existingAttendance.save();

      res.json({
        message: 'Attendance updated successfully',
        attendance: existingAttendance
      });
    } else {
      // Create new attendance record
      const attendance = new Attendance({
        registrationId,
        participantId,
        status,
        verifiedBy: req.user._id,
        notes
      });

      await attendance.save();

      res.status(201).json({
        message: 'Attendance marked successfully',
        attendance
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get attendance for a registration
router.get('/attendance/:registrationId', auth, requireRole('committee', 'admin'), async (req, res) => {
  try {
    const { registrationId } = req.params;

    const attendance = await Attendance.find({ registrationId })
      .populate('participantId', 'name email collegeId year')
      .populate('verifiedBy', 'name email')
      .sort({ verifiedAt: -1 });

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

