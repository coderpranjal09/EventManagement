const express = require('express');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const path = require('path');
const fs = require('fs');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Committee = require('../models/Committee');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// List all users (admin)
router.get('/users', auth, requireRole('admin'), async (req, res) => {
  try {
    const [users, committees] = await Promise.all([
      User.find().populate('committeeId', 'name').select('name email role collegeId year committeeId isBlocked').lean(),
      Committee.find({ isActive: true }).select('name coordinatorId memberIds').lean()
    ]);

    const coordinatorMap = new Map(); // userId -> [committee]
    const memberMap = new Map(); // userId -> [committee]

    for (const c of committees) {
      if (c.coordinatorId) {
        const key = String(c.coordinatorId);
        if (!coordinatorMap.has(key)) coordinatorMap.set(key, []);
        coordinatorMap.get(key).push({ _id: c._id, name: c.name });
      }
      for (const mId of c.memberIds || []) {
        const key = String(mId);
        if (!memberMap.has(key)) memberMap.set(key, []);
        memberMap.get(key).push({ _id: c._id, name: c.name });
      }
    }

    const enriched = users.map(u => ({
      ...u,
      coordinatorOf: coordinatorMap.get(String(u._id)) || [],
      memberOf: memberMap.get(String(u._id)) || []
    }));

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user role (admin)
router.put('/users/:id/role', auth, requireRole('admin'), async (req, res) => {
  try {
    const { role, committeeId } = req.body;
    if (!['student', 'member', 'coordinator', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // If assigning member role, committeeId is required
    if (role === 'member' && !committeeId) {
      return res.status(400).json({ message: 'Committee ID required for member role' });
    }

    const updateData = { role };
    if (committeeId && role === 'member') {
      updateData.committeeId = committeeId;
    } else if (role === 'student' || role === 'admin') {
      updateData.committeeId = null;
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('committeeId', 'name')
     .populate('coordinatedCommitteeIds', 'name')
     .select('name email role collegeId year committeeId coordinatedCommitteeIds');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add coordinator to committee (admin)
router.post('/committees/:committeeId/coordinators', auth, requireRole('admin'), async (req, res) => {
  try {
    const { userId } = req.body;
    const { committeeId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: 'User ID required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const committee = await Committee.findById(committeeId);
    if (!committee) {
      return res.status(404).json({ message: 'Committee not found' });
    }

    // Check if user is already a coordinator of this committee
    if (committee.coordinatorIds.includes(userId)) {
      return res.status(400).json({ message: 'User is already a coordinator of this committee' });
    }

    // Add user to committee coordinators
    committee.coordinatorIds.push(userId);
    await committee.save();

    // Update user's role and coordinated committees
    if (user.role !== 'coordinator') {
      user.role = 'coordinator';
    }
    
    if (!user.coordinatedCommitteeIds) {
      user.coordinatedCommitteeIds = [];
    }
    
    if (!user.coordinatedCommitteeIds.includes(committeeId)) {
      user.coordinatedCommitteeIds.push(committeeId);
    }
    
    await user.save();

    res.json({
      committee: await Committee.findById(committeeId).populate('coordinatorIds', 'name email'),
      user: await User.findById(userId).populate('coordinatedCommitteeIds', 'name')
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove coordinator from committee (admin)
router.delete('/committees/:committeeId/coordinators/:userId', auth, requireRole('admin'), async (req, res) => {
  try {
    const { committeeId, userId } = req.params;

    const committee = await Committee.findById(committeeId);
    if (!committee) {
      return res.status(404).json({ message: 'Committee not found' });
    }

    // Check if user is a coordinator
    if (!committee.coordinatorIds.some(id => id.toString() === userId)) {
      return res.status(400).json({ message: 'User is not a coordinator of this committee' });
    }

    // Remove user from committee coordinators
    committee.coordinatorIds = committee.coordinatorIds.filter(id => id.toString() !== userId);
    await committee.save();

    // Update user's coordinated committees
    const user = await User.findById(userId);
    if (user) {
      user.coordinatedCommitteeIds = user.coordinatedCommitteeIds.filter(id => id.toString() !== committeeId);
      
      // If user is no longer a coordinator of any committee, change role to student
      if (user.coordinatedCommitteeIds.length === 0 && user.role === 'coordinator') {
        user.role = 'student';
      }
      
      await user.save();
    }

    res.json({
      committee: await Committee.findById(committeeId).populate('coordinatorIds', 'name email'),
      user: user ? await User.findById(userId).populate('coordinatedCommitteeIds', 'name') : null
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user profile fields (admin)
router.put('/users/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const allowed = ['name', 'email', 'collegeId', 'year'];
    const update = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    ).populate('committeeId', 'name').select('name email role collegeId year committeeId isBlocked');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// List/search registrations (admin)
router.get('/registrations', auth, requireRole('admin'), async (req, res) => {
  try {
    const { q, eventId, paymentStatus } = req.query;
    const match = {};
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

// Block or unblock user (admin)
router.put('/users/:id/block', auth, requireRole('admin'), async (req, res) => {
  try {
    const { isBlocked } = req.body;
    if (typeof isBlocked !== 'boolean') {
      return res.status(400).json({ message: 'isBlocked must be boolean' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBlocked },
      { new: true }
    ).populate('committeeId', 'name').select('name email role collegeId year committeeId isBlocked');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete user (admin)
router.delete('/users/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If user is assigned to a committee, clean up membership
    if (user.committeeId) {
      await Committee.findByIdAndUpdate(user.committeeId, {
        $pull: { memberIds: user._id },
        $unset: { coordinatorId: user.role === 'coordinator' ? '' : undefined }
      });
    }

    await User.deleteOne({ _id: user._id });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Assign user to committee (admin)
router.put('/users/:id/committee', auth, requireRole('admin'), async (req, res) => {
  try {
    const { committeeId } = req.body;
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!['member', 'coordinator'].includes(user.role)) {
      return res.status(400).json({ message: 'User must be member or coordinator to be assigned to committee' });
    }

    const committee = await Committee.findById(committeeId);
    if (!committee) {
      return res.status(404).json({ message: 'Committee not found' });
    }

    // Update user's committee
    user.committeeId = committeeId;
    await user.save();

    // Add user to committee members if not already there
    if (!committee.memberIds.includes(userId)) {
      committee.memberIds.push(userId);
      await committee.save();
    }

    // If user is coordinator, update committee coordinator
    if (user.role === 'coordinator') {
      committee.coordinatorId = userId;
      await committee.save();
    }

    const updatedUser = await User.findById(userId)
      .populate('committeeId', 'name')
      .select('name email role collegeId year committeeId');

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove user from committee (admin)
router.delete('/users/:id/committee', auth, requireRole('admin'), async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.committeeId) {
      return res.status(400).json({ message: 'User is not assigned to any committee' });
    }

    const committee = await Committee.findById(user.committeeId);
    if (committee) {
      // Remove from committee members
      committee.memberIds = committee.memberIds.filter(id => id.toString() !== userId);
      
      // If user was coordinator, remove coordinator
      if (committee.coordinatorId && committee.coordinatorId.toString() === userId) {
        committee.coordinatorId = null;
      }
      
      await committee.save();
    }

    // Update user
    user.committeeId = null;
    await user.save();

    const updatedUser = await User.findById(userId)
      .select('name email role collegeId year committeeId');

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get admin dashboard stats
router.get('/stats', auth, requireRole('admin'), async (req, res) => {
  try {
    // Get basic counts
    const totalUsers = await User.countDocuments();
    const totalEvents = await Event.countDocuments({ isActive: true });
    const totalRegistrations = await Registration.countDocuments();
    const totalCommittees = await Committee.countDocuments({ isActive: true });

    // Get user counts by role
    const userStats = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    // Get registration counts by event
    const eventStats = await Event.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'registrations',
          localField: '_id',
          foreignField: 'eventId',
          as: 'registrations'
        }
      },
      {
        $project: {
          title: 1,
          dateTime: 1,
          registrationCount: { $size: '$registrations' }
        }
      },
      { $sort: { registrationCount: -1 } }
    ]);

    // Get recent registrations
    const recentRegistrations = await Registration.find()
      .populate('eventId', 'title dateTime')
      .populate('leaderId', 'name email collegeId')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get attendance stats
    const attendanceStats = await Attendance.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      overview: {
        totalUsers,
        totalEvents,
        totalRegistrations,
        totalCommittees
      },
      userStats,
      eventStats,
      recentRegistrations,
      attendanceStats
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Export participants CSV
router.get('/export/participants', auth, requireRole('admin'), async (req, res) => {
  try {
    const { eventId } = req.query;

    let query = {};
    if (eventId) {
      query.eventId = eventId;
    }

    const registrations = await Registration.find(query)
      .populate('eventId', 'title dateTime venue')
      .populate('leaderId', 'name email collegeId year')
      .populate('groupMembers', 'name email collegeId year');

    const csvData = registrations.map(reg => ({
      'Event Title': reg.eventId.title,
      'Event Date': reg.eventId.dateTime.toISOString().split('T')[0],
      'Event Venue': reg.eventId.venue,
      'Leader Name': reg.leaderId.name,
      'Leader Email': reg.leaderId.email,
      'Leader College ID': reg.leaderId.collegeId,
      'Leader Year': reg.leaderId.year,
      'Group Members': reg.groupMembers.map(member => member.name).join(', '),
      'Group Emails': reg.groupMembers.map(member => member.email).join(', '),
      'Payment Status': reg.paymentStatus,
      'Total Amount': reg.totalAmount,
      'Registration Date': reg.createdAt.toISOString().split('T')[0],
      'QR Code': reg.qrCode
    }));

    const csvWriter = createCsvWriter({
      path: 'participants_export.csv',
      header: [
        { id: 'Event Title', title: 'Event Title' },
        { id: 'Event Date', title: 'Event Date' },
        { id: 'Event Venue', title: 'Event Venue' },
        { id: 'Leader Name', title: 'Leader Name' },
        { id: 'Leader Email', title: 'Leader Email' },
        { id: 'Leader College ID', title: 'Leader College ID' },
        { id: 'Leader Year', title: 'Leader Year' },
        { id: 'Group Members', title: 'Group Members' },
        { id: 'Group Emails', title: 'Group Emails' },
        { id: 'Payment Status', title: 'Payment Status' },
        { id: 'Total Amount', title: 'Total Amount' },
        { id: 'Registration Date', title: 'Registration Date' },
        { id: 'QR Code', title: 'QR Code' }
      ]
    });

    await csvWriter.writeRecords(csvData);

    res.download('participants_export.csv', 'participants_export.csv', (err) => {
      if (err) {
        console.error('Error downloading file:', err);
        res.status(500).json({ message: 'Error downloading file' });
      } else {
        // Clean up the file after download
        fs.unlink('participants_export.csv', (unlinkErr) => {
          if (unlinkErr) console.error('Error deleting file:', unlinkErr);
        });
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Export attendance CSV
router.get('/export/attendance', auth, requireRole('admin'), async (req, res) => {
  try {
    const { eventId } = req.query;

    let attendanceQuery = {};
    if (eventId) {
      const registrations = await Registration.find({ eventId }).distinct('_id');
      attendanceQuery.registrationId = { $in: registrations };
    }

    const attendance = await Attendance.find(attendanceQuery)
      .populate('registrationId', 'eventId')
      .populate('participantId', 'name email collegeId year')
      .populate('verifiedBy', 'name email')
      .populate({
        path: 'registrationId',
        populate: {
          path: 'eventId',
          model: 'Event',
          select: 'title dateTime venue'
        }
      });

    const csvData = attendance.map(att => ({
      'Event Title': att.registrationId.eventId.title,
      'Event Date': att.registrationId.eventId.dateTime.toISOString().split('T')[0],
      'Event Venue': att.registrationId.eventId.venue,
      'Participant Name': att.participantId.name,
      'Participant Email': att.participantId.email,
      'Participant College ID': att.participantId.collegeId,
      'Participant Year': att.participantId.year,
      'Status': att.status,
      'Verified By': att.verifiedBy.name,
      'Verified At': att.verifiedAt.toISOString(),
      'Notes': att.notes || ''
    }));

    const csvWriter = createCsvWriter({
      path: 'attendance_export.csv',
      header: [
        { id: 'Event Title', title: 'Event Title' },
        { id: 'Event Date', title: 'Event Date' },
        { id: 'Event Venue', title: 'Event Venue' },
        { id: 'Participant Name', title: 'Participant Name' },
        { id: 'Participant Email', title: 'Participant Email' },
        { id: 'Participant College ID', title: 'Participant College ID' },
        { id: 'Participant Year', title: 'Participant Year' },
        { id: 'Status', title: 'Status' },
        { id: 'Verified By', title: 'Verified By' },
        { id: 'Verified At', title: 'Verified At' },
        { id: 'Notes', title: 'Notes' }
      ]
    });

    await csvWriter.writeRecords(csvData);

    res.download('attendance_export.csv', 'attendance_export.csv', (err) => {
      if (err) {
        console.error('Error downloading file:', err);
        res.status(500).json({ message: 'Error downloading file' });
      } else {
        // Clean up the file after download
        fs.unlink('attendance_export.csv', (unlinkErr) => {
          if (unlinkErr) console.error('Error deleting file:', unlinkErr);
        });
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

