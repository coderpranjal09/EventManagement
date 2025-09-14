const express = require('express');
const Score = require('../models/Score');
const Registration = require('../models/Registration');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Submit score
router.post('/', auth, requireRole('committee', 'admin'), async (req, res) => {
  try {
    const { registrationId, participantId, score, round, comments } = req.body;

    if (!registrationId || !participantId || score === undefined) {
      return res.status(400).json({ 
        message: 'Registration ID, participant ID, and score are required' 
      });
    }

    if (score < 0 || score > 100) {
      return res.status(400).json({ 
        message: 'Score must be between 0 and 100' 
      });
    }

    // Check if registration exists
    const registration = await Registration.findById(registrationId);
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    // Check if participant is part of this registration
    const isParticipant = registration.leaderId.toString() === participantId ||
      registration.groupMembers.some(member => member.toString() === participantId);

    if (!isParticipant) {
      return res.status(400).json({ 
        message: 'Participant is not part of this registration' 
      });
    }

    // Check if score already exists for this participant in this round
    const existingScore = await Score.findOne({
      registrationId,
      participantId,
      round: round || 'final'
    });

    if (existingScore) {
      // Update existing score
      existingScore.score = score;
      existingScore.judgeId = req.user._id;
      existingScore.comments = comments;
      await existingScore.save();

      res.json({
        message: 'Score updated successfully',
        score: existingScore
      });
    } else {
      // Create new score
      const newScore = new Score({
        registrationId,
        participantId,
        score,
        judgeId: req.user._id,
        round: round || 'final',
        comments
      });

      await newScore.save();

      res.status(201).json({
        message: 'Score submitted successfully',
        score: newScore
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get scores for an event
router.get('/event/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;

    // Get all registrations for this event
    const registrations = await Registration.find({ eventId });
    const registrationIds = registrations.map(reg => reg._id);

    // Get all scores for these registrations
    const scores = await Score.find({ registrationId: { $in: registrationIds } })
      .populate('participantId', 'name email collegeId year')
      .populate('judgeId', 'name email')
      .populate('registrationId', 'eventId leaderId groupMembers');

    // Group scores by participant and calculate averages
    const scoreMap = new Map();
    
    scores.forEach(score => {
      const participantId = score.participantId._id.toString();
      if (!scoreMap.has(participantId)) {
        scoreMap.set(participantId, {
          participant: score.participantId,
          scores: [],
          averageScore: 0
        });
      }
      scoreMap.get(participantId).scores.push(score);
    });

    // Calculate average scores
    const scoreboard = Array.from(scoreMap.values()).map(participantData => {
      const totalScore = participantData.scores.reduce((sum, score) => sum + score.score, 0);
      participantData.averageScore = totalScore / participantData.scores.length;
      return participantData;
    });

    // Sort by average score (descending)
    scoreboard.sort((a, b) => b.averageScore - a.averageScore);

    res.json(scoreboard);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get scores for a specific registration
router.get('/registration/:registrationId', auth, async (req, res) => {
  try {
    const { registrationId } = req.params;

    const scores = await Score.find({ registrationId })
      .populate('participantId', 'name email collegeId year')
      .populate('judgeId', 'name email')
      .sort({ createdAt: -1 });

    res.json(scores);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

