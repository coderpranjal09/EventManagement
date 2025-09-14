const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const Committee = require('../models/Committee');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Attendance = require('../models/Attendance');
const { auth, requireRole } = require('../middleware/auth');
const { logTransaction } = require('../utils/logger');

const router = express.Router();

/**
 * Middleware to ensure user is a coordinator of at least one active committee
 */
const requireCoordinatorAccess = async (req, res, next) => {
  try {
    const committees = await Committee.find({
      coordinatorIds: req.user._id,
      isActive: true
    });

    if (!committees.length) {
      return res.status(403).json({
        success: false,
        message: 'Coordinator access required',
        details: 'You are not assigned as coordinator of any active committee'
      });
    }

    req.coordinatorCommittees = committees;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Helper to validate Mongo ObjectId
 */
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * ==============================
 * ROUTES
 * ==============================
 */

// ✅ Get available members (students not in any committee)
router.get('/members/available', auth, requireRole('coordinator'), requireCoordinatorAccess, async (req, res, next) => {
  try {
    const availableMembers = await User.find({
      role: 'student',
      committeeId: null
    }).select('name email collegeId year');

    res.json({ success: true, members: availableMembers });
  } catch (err) {
    next(err);
  }
});

// ✅ Get coordinator's committees
router.get('/committees', auth, requireRole('coordinator'), requireCoordinatorAccess, async (req, res, next) => {
  try {
    const committees = await Committee.find({
      coordinatorIds: req.user._id,
      isActive: true
    })
      .populate('memberIds', 'name email collegeId year')
      .populate('assignedEventIds', 'title dateTime venue')
      .populate('coordinatorIds', 'name email');

    res.json({ success: true, committees });
  } catch (err) {
    next(err);
  }
});

// ✅ Get coordinator dashboard data (all committees)
router.get('/dashboard', auth, requireRole('coordinator'), requireCoordinatorAccess, async (req, res, next) => {
  try {
    const assignedEventIds = req.coordinatorCommittees.flatMap(c => c.assignedEventIds);

    const activeEvents = await Event.find({
      _id: { $in: assignedEventIds },
      isActive: true
    })
      .populate('committeeMemberIds', 'name email')
      .sort({ dateTime: 1 });

    // Build stats
    const eventStats = await Promise.all(activeEvents.map(async (event) => {
      const registrations = await Registration.find({ eventId: event._id });
      const registrationCount = registrations.length;
      const attendanceCount = await Attendance.countDocuments({
        registrationId: { $in: registrations.map(r => r._id) },
        status: 'present'
      });

      return {
        ...event.toObject(),
        registrationCount,
        attendanceCount
      };
    }));

    const recentRegistrations = await Registration.find({
      eventId: { $in: assignedEventIds }
    })
      .populate('eventId', 'title dateTime')
      .populate('leaderId', 'name email collegeId')
      .sort({ createdAt: -1 })
      .limit(10);

    const totalMemberCount = req.coordinatorCommittees.reduce((sum, c) => sum + c.memberIds.length, 0);

    res.json({
      success: true,
      committees: req.coordinatorCommittees.map(c => ({
        _id: c._id,
        name: c.name,
        description: c.description,
        memberCount: c.memberIds.length
      })),
      events: eventStats,
      recentRegistrations,
      totalMemberCount,
      totalEvents: activeEvents.length,
      totalRegistrations: eventStats.reduce((sum, e) => sum + e.registrationCount, 0),
      totalAttendance: eventStats.reduce((sum, e) => sum + e.attendanceCount, 0)
    });
  } catch (err) {
    next(err);
  }
});

// ✅ Get dashboard for specific committee
router.get('/:committeeId/dashboard', auth, requireRole('coordinator'), async (req, res, next) => {
  try {
    const { committeeId } = req.params;
    if (!isValidObjectId(committeeId)) {
      return res.status(400).json({ success: false, message: 'Invalid committee ID' });
    }

    const committee = await Committee.findOne({
      _id: committeeId,
      coordinatorIds: req.user._id,
      isActive: true
    });

    if (!committee) {
      return res.status(403).json({ success: false, message: 'Not authorized for this committee' });
    }

    const activeEvents = await Event.find({
      _id: { $in: committee.assignedEventIds },
      isActive: true
    })
      .populate('committeeMemberIds', 'name email')
      .sort({ dateTime: 1 });

    const eventStats = await Promise.all(activeEvents.map(async (event) => {
      const registrations = await Registration.find({ eventId: event._id });
      const registrationCount = registrations.length;
      const attendanceCount = await Attendance.countDocuments({
        registrationId: { $in: registrations.map(r => r._id) },
        status: 'present'
      });

      return {
        ...event.toObject(),
        registrationCount,
        attendanceCount
      };
    }));

    const recentRegistrations = await Registration.find({
      eventId: { $in: committee.assignedEventIds }
    })
      .populate('eventId', 'title dateTime')
      .populate('leaderId', 'name email collegeId')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      committee: {
        _id: committee._id,
        name: committee.name,
        description: committee.description,
        memberCount: committee.memberIds.length,
        coordinatorIds: committee.coordinatorIds
      },
      events: eventStats,
      recentRegistrations,
      totalEvents: activeEvents.length,
      totalRegistrations: eventStats.reduce((sum, e) => sum + e.registrationCount, 0),
      totalAttendance: eventStats.reduce((sum, e) => sum + e.attendanceCount, 0)
    });
  } catch (err) {
    next(err);
  }
});

// ✅ Add member to committee
router.post('/:committeeId/members', auth, requireRole('coordinator'), async (req, res, next) => {
  try {
    const { committeeId } = req.params;
    const { userId } = req.body;

    if (!isValidObjectId(committeeId) || !isValidObjectId(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid ID(s)' });
    }

    const committee = await Committee.findOne({
      _id: committeeId,
      coordinatorIds: req.user._id,
      isActive: true
    });

    if (!committee) {
      return res.status(403).json({ success: false, message: 'Not authorized for this committee' });
    }

    const user = await User.findById(userId);
    if (!user || user.role !== 'student') {
      return res.status(400).json({ success: false, message: 'User must exist and have student role' });
    }

    if (committee.memberIds.some(id => id.toString() === userId)) {
      return res.status(400).json({ success: false, message: 'User already a member' });
    }

    committee.memberIds.push(userId);
    await committee.save();

    user.committeeId = committee._id;
    user.role = 'member';
    await user.save();

    logTransaction('coordinator.add_member', req.user._id, { committeeId, memberId: userId });

    const updatedCommittee = await Committee.findById(committee._id)
      .populate('memberIds', 'name email collegeId year')
      .populate('coordinatorIds', 'name email');

    res.json({ success: true, committee: updatedCommittee });
  } catch (err) {
    next(err);
  }
});

// ✅ Remove member from committee
router.delete('/:committeeId/members/:memberId', auth, requireRole('coordinator'), async (req, res, next) => {
  try {
    const { committeeId, memberId } = req.params;
    if (!isValidObjectId(committeeId) || !isValidObjectId(memberId)) {
      return res.status(400).json({ success: false, message: 'Invalid ID(s)' });
    }

    const committee = await Committee.findOne({
      _id: committeeId,
      coordinatorIds: req.user._id,
      isActive: true
    });

    if (!committee) {
      return res.status(403).json({ success: false, message: 'Not authorized for this committee' });
    }

    if (!committee.memberIds.some(id => id.toString() === memberId)) {
      return res.status(400).json({ success: false, message: 'User is not a member of this committee' });
    }

    committee.memberIds = committee.memberIds.filter(id => id.toString() !== memberId);
    await committee.save();

    await User.findByIdAndUpdate(memberId, { committeeId: null, role: 'student' });

    logTransaction('coordinator.remove_member', req.user._id, { committeeId, memberId });

    const updatedCommittee = await Committee.findById(committee._id)
      .populate('memberIds', 'name email collegeId year')
      .populate('coordinatorIds', 'name email');

    res.json({ success: true, committee: updatedCommittee });
  } catch (err) {
    next(err);
  }
});

// ✅ Get available members for specific committee
router.get('/:committeeId/members/available', auth, requireRole('coordinator'), async (req, res, next) => {
  try {
    const { committeeId } = req.params;
    if (!isValidObjectId(committeeId)) {
      return res.status(400).json({ success: false, message: 'Invalid committee ID' });
    }

    const committee = await Committee.findOne({
      _id: committeeId,
      coordinatorIds: req.user._id,
      isActive: true
    });

    if (!committee) {
      return res.status(403).json({ success: false, message: 'Not authorized for this committee' });
    }

    const availableMembers = await User.find({
      role: 'student',
      committeeId: null
    }).select('name email collegeId year');

    res.json({ success: true, members: availableMembers });
  } catch (err) {
    next(err);
  }
});

// ✅ Get registrations for coordinator's committees
router.get('/registrations', auth, requireRole('coordinator'), requireCoordinatorAccess, async (req, res, next) => {
  try {
    const assignedEventIds = req.coordinatorCommittees.flatMap(c => c.assignedEventIds);
    const { q, eventId, paymentStatus } = req.query;

    const match = { eventId: { $in: assignedEventIds } };
    if (eventId && isValidObjectId(eventId)) match.eventId = new mongoose.Types.ObjectId(eventId);
    if (paymentStatus) match.paymentStatus = paymentStatus;

    const pipeline = [
      { $match: match },
      { $lookup: { from: 'users', localField: 'leaderId', foreignField: '_id', as: 'leader' } },
      { $lookup: { from: 'events', localField: 'eventId', foreignField: '_id', as: 'event' } },
      { $unwind: '$leader' },
      { $unwind: '$event' }
    ];

    if (q) {
      pipeline.push({
        $match: {
          $or: [
            { 'leader.name': { $regex: q, $options: 'i' } },
            { 'leader.email': { $regex: q, $options: 'i' } },
            { 'event.title': { $regex: q, $options: 'i' } }
          ]
        }
      });
    }

    pipeline.push({ $sort: { createdAt: -1 } });

    const results = await Registration.aggregate(pipeline);
    res.json({ success: true, registrations: results });
  } catch (err) {
    next(err);
  }
});

// ✅ Committee reports for all coordinator's committees (NEW)
router.get('/reports', auth, requireRole('coordinator'), requireCoordinatorAccess, async (req, res, next) => {
  try {
    const committeeIds = req.coordinatorCommittees.map(c => c._id);
    
    // Get all assigned events from all committees
    const assignedEventIds = req.coordinatorCommittees.flatMap(c => c.assignedEventIds);

    const events = await Event.find({
      _id: { $in: assignedEventIds },
      isActive: true
    })
      .populate('committeeMemberIds', 'name email')
      .sort({ dateTime: 1 });

    const eventReports = await Promise.all(events.map(async (event) => {
      const registrations = await Registration.find({ eventId: event._id })
        .populate('leaderId', 'name email collegeId year')
        .populate('groupMembers', 'name email collegeId year');

      const attendance = await Attendance.find({
        registrationId: { $in: registrations.map(r => r._id) }
      })
        .populate('participantId', 'name email')
        .populate('verifiedBy', 'name email');

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
        },
        assignedMembers: event.committeeMemberIds || []
      };
    }));

    const summary = {
      totalEvents: events.length,
      totalRegistrations: eventReports.reduce((sum, r) => sum + r.registrations, 0),
      totalParticipants: eventReports.reduce((sum, r) => sum + r.totalParticipants, 0),
      totalPresent: eventReports.reduce((sum, r) => sum + r.attendance.present, 0),
      totalAbsent: eventReports.reduce((sum, r) => sum + r.attendance.absent, 0)
    };

    summary.attendanceRate = summary.totalParticipants > 0
      ? ((summary.totalPresent / summary.totalParticipants) * 100).toFixed(2)
      : 0;

    res.json({ 
      success: true, 
      summary, 
      eventReports,
      totalCommittees: committeeIds.length
    });
  } catch (err) {
    next(err);
  }
});

// ✅ Committee reports for specific committee
router.get('/:committeeId/reports', auth, requireRole('coordinator'), async (req, res, next) => {
  try {
    const { committeeId } = req.params;
    if (!isValidObjectId(committeeId)) {
      return res.status(400).json({ success: false, message: 'Invalid committee ID' });
    }

    const committee = await Committee.findOne({
      _id: committeeId,
      coordinatorIds: req.user._id,
      isActive: true
    });

    if (!committee) {
      return res.status(403).json({ success: false, message: 'Not authorized for this committee' });
    }

    const events = await Event.find({
      _id: { $in: committee.assignedEventIds },
      isActive: true
    })
      .populate('committeeMemberIds', 'name email')
      .sort({ dateTime: 1 });

    const eventReports = await Promise.all(events.map(async (event) => {
      const registrations = await Registration.find({ eventId: event._id })
        .populate('leaderId', 'name email collegeId year')
        .populate('groupMembers', 'name email collegeId year');

      const attendance = await Attendance.find({
        registrationId: { $in: registrations.map(r => r._id) }
      })
        .populate('participantId', 'name email')
        .populate('verifiedBy', 'name email');

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
        },
        assignedMembers: event.committeeMemberIds || []
      };
    }));

    const summary = {
      totalEvents: events.length,
      totalRegistrations: eventReports.reduce((sum, r) => sum + r.registrations, 0),
      totalParticipants: eventReports.reduce((sum, r) => sum + r.totalParticipants, 0),
      totalPresent: eventReports.reduce((sum, r) => sum + r.attendance.present, 0),
      totalAbsent: eventReports.reduce((sum, r) => sum + r.attendance.absent, 0)
    };

    summary.attendanceRate = summary.totalParticipants > 0
      ? ((summary.totalPresent / summary.totalParticipants) * 100).toFixed(2)
      : 0;

    res.json({ success: true, summary, eventReports });
  } catch (err) {
    next(err);
  }
});

module.exports = router;