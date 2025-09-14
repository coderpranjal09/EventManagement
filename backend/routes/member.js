const express = require('express');
const User = require('../models/User');
const Committee = require('../models/Committee');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Attendance = require('../models/Attendance');
const { auth, requireRole, requireMemberOfCommittee } = require('../middleware/auth');

const router = express.Router();

// Get member's committee info
router.get('/committee', auth, requireRole('member'), async (req, res) => {
  try {
    const committee = await Committee.findOne({ memberIds: req.user._id })
      .populate('coordinatorId', 'name email')
      .populate('memberIds', 'name email collegeId year')
      .populate('assignedEventIds', 'title dateTime venue');

    if (!committee) {
      return res.status(404).json({ message: 'Committee not found' });
    }

    res.json(committee);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get member dashboard data
router.get('/dashboard', auth, requireRole('member'), async (req, res) => {
  try {
    const committee = await Committee.findOne({ memberIds: req.user._id });
    if (!committee) {
      return res.status(404).json({ message: 'Committee not found' });
    }

    // Get assigned events
    const events = await Event.find({ 
      _id: { $in: committee.assignedEventIds },
      isActive: true 
    })
      .populate('committeeMemberIds', 'name email')
      .sort({ dateTime: 1 });

    // Get registration counts for each event
    const eventStats = await Promise.all(events.map(async (event) => {
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
    }));

    // Get recent registrations for assigned events
    const recentRegistrations = await Registration.find({
      eventId: { $in: committee.assignedEventIds }
    })
      .populate('eventId', 'title dateTime')
      .populate('leaderId', 'name email collegeId')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      committee: {
        _id: committee._id,
        name: committee.name,
        description: committee.description
      },
      events: eventStats,
      recentRegistrations
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get member reports (limited view)
router.get('/reports', auth, requireRole('member'), async (req, res) => {
  try {
    const committee = await Committee.findOne({ memberIds: req.user._id });
    if (!committee) {
      return res.status(404).json({ message: 'Committee not found' });
    }

    // Get assigned events with basic stats
    const events = await Event.find({ 
      _id: { $in: committee.assignedEventIds },
      isActive: true 
    })
      .populate('committeeMemberIds', 'name email')
      .sort({ dateTime: 1 });

    const eventReports = await Promise.all(events.map(async (event) => {
      const registrations = await Registration.find({ eventId: event._id });
      const attendance = await Attendance.find({
        registrationId: { $in: registrations.map(r => r._id) }
      });

      const totalParticipants = registrations.reduce((sum, reg) => sum + 1 + reg.groupMembers.length, 0);
      const presentCount = attendance.filter(att => att.status === 'present').length;
      const absentCount = attendance.filter(att => att.status === 'absent').length;

      return {
        event: {
          _id: event._id,
          title: event.title,
          dateTime: event.dateTime,
          venue: event.venue,
          fee: event.fee
        },
        registrations: registrations.length,
        totalParticipants,
        attendance: {
          present: presentCount,
          absent: absentCount,
          notMarked: totalParticipants - presentCount - absentCount
        }
      };
    }));

    // Calculate overall stats
    const totalEvents = events.length;
    const totalRegistrations = eventReports.reduce((sum, report) => sum + report.registrations, 0);
    const totalParticipants = eventReports.reduce((sum, report) => sum + report.totalParticipants, 0);
    const totalPresent = eventReports.reduce((sum, report) => sum + report.attendance.present, 0);
    const totalAbsent = eventReports.reduce((sum, report) => sum + report.attendance.absent, 0);

    res.json({
      summary: {
        totalEvents,
        totalRegistrations,
        totalParticipants,
        totalPresent,
        totalAbsent,
        attendanceRate: totalParticipants > 0 ? ((totalPresent / totalParticipants) * 100).toFixed(2) : 0
      },
      eventReports
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// List/search registrations for member's committee (view-only)
router.get('/registrations', auth, requireRole('member'), async (req, res) => {
  try {
    const committee = await Committee.findOne({ memberIds: req.user._id });
    if (!committee) {
      return res.status(404).json({ message: 'Committee not found' });
    }

    const { q, eventId, paymentStatus } = req.query;
    const match = { eventId: { $in: committee.assignedEventIds } };
    if (eventId) match.eventId = eventId;
    if (paymentStatus) match.paymentStatus = paymentStatus;

    const pipeline = [
      { $match: match },
      { $lookup: { from: 'users', localField: 'leaderId', foreignField: '_id', as: 'leader' } },
      { $lookup: { from: 'events', localField: 'eventId', foreignField: '_id', as: 'event' } },
      { $unwind: '$leader' },
      { $unwind: '$event' }
    ];
    if (q) {
      pipeline.push({ $match: { $or: [
        { 'leader.name': { $regex: q, $options: 'i' } },
        { 'leader.email': { $regex: q, $options: 'i' } },
        { 'event.title': { $regex: q, $options: 'i' } }
      ] } });
    }
    pipeline.push({ $sort: { createdAt: -1 } });

    const results = await Registration.aggregate(pipeline);
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
