const express = require('express');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Register for event
router.post('/events/:eventId/register', auth, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { groupMembers, packageId } = req.body;

    // Get event details
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user already registered
    const existingRegistration = await Registration.findOne({
      eventId,
      leaderId: req.user._id
    });

    if (existingRegistration) {
      return res.status(400).json({ message: 'Already registered for this event' });
    }

    // Validate group size
    const totalMembers = groupMembers ? groupMembers.length + 1 : 1; // +1 for leader
    if (event.isGroup && totalMembers > event.maxGroupSize) {
      return res.status(400).json({ 
        message: `Maximum group size is ${event.maxGroupSize}` 
      });
    }

    // Validate group members exist
    if (groupMembers && groupMembers.length > 0) {
      const members = await User.find({ _id: { $in: groupMembers } });
      if (members.length !== groupMembers.length) {
        return res.status(400).json({ message: 'Some group members not found' });
      }
    }

    // Calculate total amount
    let totalAmount = event.fee;
    if (packageId && event.packages.length > 0) {
      const selectedPackage = event.packages.find(pkg => pkg._id.toString() === packageId);
      if (selectedPackage) {
        totalAmount = selectedPackage.price;
      }
    }

    // Generate unique QR code
    const qrCodeData = uuidv4();
    const qrCodeImage = await QRCode.toDataURL(qrCodeData);

    // Create registration
    const registration = new Registration({
      eventId,
      leaderId: req.user._id,
      groupMembers: groupMembers || [],
      packageId,
      qrCode: qrCodeData,
      totalAmount,
      isGroupRegistration: event.isGroup && totalMembers > 1
    });

    await registration.save();

    res.status(201).json({
      message: 'Registration successful',
      registration: {
        id: registration._id,
        qrCode: qrCodeData,
        qrCodeImage,
        totalAmount,
        paymentStatus: registration.paymentStatus
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's registrations
router.get('/users/:userId/registrations', auth, async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user can access this data
    if (req.user._id.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const registrations = await Registration.find({ leaderId: userId })
      .populate('eventId', 'title description dateTime venue')
      .populate('groupMembers', 'name email collegeId year')
      .sort({ createdAt: -1 });

    // Generate QR code images for each registration
    const registrationsWithQR = await Promise.all(
      registrations.map(async (reg) => {
        const qrCodeImage = await QRCode.toDataURL(reg.qrCode);
        return {
          ...reg.toObject(),
          qrCodeImage
        };
      })
    );

    res.json(registrationsWithQR);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all registrations for an event (Committee/Admin only)
router.get('/events/:eventId/registrations', auth, async (req, res) => {
  try {
    const { eventId } = req.params;

    // Check permissions
    if (req.user.role === 'student') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const registrations = await Registration.find({ eventId })
      .populate('leaderId', 'name email collegeId year')
      .populate('groupMembers', 'name email collegeId year')
      .sort({ createdAt: -1 });

    res.json(registrations);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

