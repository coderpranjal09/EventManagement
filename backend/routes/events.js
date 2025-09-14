const express = require('express');
const Event = require('../models/Event');
const Committee = require('../models/Committee');
const { auth, requireRole } = require('../middleware/auth');
const { logTransaction } = require('../utils/logger');

const router = express.Router();

// Get all events
router.get('/', async (req, res) => {
  try {
    const events = await Event.find({ isActive: true })
      .populate('committeeId', 'name')
      .populate('committeeMemberIds', 'name email')
      .sort({ dateTime: 1 });

    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single event
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('committeeId', 'name memberIds')
      .populate('committeeMemberIds', 'name email');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create event (Admin only)
router.post('/', auth, requireRole('admin'), async (req, res) => {
  try {
    const {
      title,
      description,
      committeeId,
      dateTime,
      venue,
      fee,
      packages,
      isGroup,
      maxGroupSize,
      rules
    } = req.body;

    // Verify committee exists
    const committee = await Committee.findById(committeeId);
    if (!committee) {
      return res.status(400).json({ message: 'Committee not found' });
    }

    const event = new Event({
      title,
      description,
      committeeId,
      dateTime,
      venue,
      fee,
      packages: packages || [],
      isGroup,
      maxGroupSize,
      rules: rules || []
    });

    await event.save();

    // Add event to committee's assigned events
    await Committee.findByIdAndUpdate(committeeId, {
      $addToSet: { assignedEventIds: event._id }
    });

    logTransaction('event.create', req.user?._id, { eventId: String(event._id) });
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update event (Admin only)
router.put('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    logTransaction('event.update', req.user?._id, { eventId: String(event._id) });
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete event (Admin only)
router.delete('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    logTransaction('event.delete', req.user?._id, { eventId: String(event._id) });
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Assign committee members to an event (Admin only)
router.put('/:id/assign-members', auth, requireRole('admin'), async (req, res) => {
  try {
    const { memberIds } = req.body; // array of user ObjectIds
    if (!Array.isArray(memberIds)) {
      return res.status(400).json({ message: 'memberIds must be an array' });
    }
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { committeeMemberIds: memberIds },
      { new: true }
    ).populate('committeeMemberIds', 'name email');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    logTransaction('event.assign_members', req.user?._id, { eventId: String(event._id), count: memberIds.length });
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

