const express = require('express');
const Committee = require('../models/Committee');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Attendance = require('../models/Attendance');
const { auth, requireRole } = require('../middleware/auth');
const { logTransaction } = require('../utils/logger');

const router = express.Router();

// Get committee dashboard
router.get('/:id/dashboard', auth, requireRole('committee', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user is part of this committee or is admin
    if (req.user.role === 'committee') {
      const committee = await Committee.findById(id);
      if (!committee || !committee.memberIds.some(member => member.toString() === req.user._id.toString())) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    // Get committee details
    const committee = await Committee.findById(id)
      .populate('memberIds', 'name email collegeId year')
      .populate('assignedEventIds', 'title description dateTime venue isActive');

    if (!committee) {
      return res.status(404).json({ message: 'Committee not found' });
    }

    // Get active events assigned to this committee
    const activeEvents = committee.assignedEventIds.filter(event => event.isActive);

    // Get registration counts for each event
    const eventStats = await Promise.all(
      activeEvents.map(async (event) => {
        const registrationCount = await Registration.countDocuments({ eventId: event._id });
        const attendanceCount = await Attendance.countDocuments({ 
          registrationId: { $in: await Registration.find({ eventId: event._id }).distinct('_id') },
          status: 'present'
        });

        return {
          ...event.toObject(),
          registrationCount,
          attendanceCount
        };
      })
    );

    res.json({
      committee,
      events: eventStats,
      totalEvents: activeEvents.length,
      totalRegistrations: eventStats.reduce((sum, event) => sum + event.registrationCount, 0),
      totalAttendance: eventStats.reduce((sum, event) => sum + event.attendanceCount, 0)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all committees
router.get('/', auth, requireRole('admin'), async (req, res) => {
  try {
    const committees = await Committee.find({ isActive: true })
      .populate('memberIds', 'name email collegeId year')
      .populate('assignedEventIds', 'title description dateTime venue');

    res.json(committees);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get committees for current user (committee/admin)
router.get('/mine', auth, requireRole('committee', 'admin'), async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      // Admin may not belong to committees; return all for convenience
      const committees = await Committee.find({ isActive: true })
        .select('name description memberIds assignedEventIds')
        .lean();
      return res.json(committees);
    }

    const committees = await Committee.find({
      isActive: true,
      memberIds: req.user._id
    })
      .select('name description memberIds assignedEventIds')
      .lean();

    res.json(committees);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create committee
router.post('/', auth, requireRole('admin'), async (req, res) => {
  try {
    const { name, coordinatorIds, memberIds, assignedEventIds, description, isActive } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Committee name is required" });
    }

    const committee = new Committee({
      name,
      coordinatorIds: coordinatorIds || [],
      memberIds: memberIds || [],
      assignedEventIds: assignedEventIds || [],
      description: description || "",
      isActive: isActive !== undefined ? isActive : true
    });

    await committee.save();

    // Populate the created committee
    const populatedCommittee = await Committee.findById(committee._id)
      .populate('coordinatorIds', 'name email collegeId year')
      .populate('memberIds', 'name email collegeId year')
      .populate('assignedEventIds', 'title description dateTime venue');

    logTransaction('committee.create', req.user?._id, { committeeId: String(committee._id) });

    res.status(201).json(populatedCommittee);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// Update committee
router.put('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const committee = await Committee.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('memberIds', 'name email collegeId year')
     .populate('assignedEventIds', 'title description dateTime venue');

    if (!committee) {
      return res.status(404).json({ message: 'Committee not found' });
    }

    logTransaction('committee.update', req.user?._id, { committeeId: String(committee._id) });
    res.json(committee);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete committee
router.delete('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const committee = await Committee.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!committee) {
      return res.status(404).json({ message: 'Committee not found' });
    }

    logTransaction('committee.delete', req.user?._id, { committeeId: String(committee._id) });
    res.json({ message: 'Committee deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

