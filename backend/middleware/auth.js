const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-passwordHash');
    
    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: 'User is blocked' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};

// Check if user is coordinator of a specific committee
const requireCoordinatorOfCommittee = async (req, res, next) => {
  try {
    if (req.user.role !== 'coordinator') {
      return res.status(403).json({ message: 'Coordinator access required' });
    }

    const committeeId = req.params.committeeId || req.body.committeeId;
    if (!committeeId) {
      return res.status(400).json({ message: 'Committee ID required' });
    }

    const Committee = require('../models/Committee');
    const committee = await Committee.findById(committeeId);
    
    if (!committee) {
      return res.status(404).json({ message: 'Committee not found' });
    }

    if (committee.coordinatorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized for this committee' });
    }

    req.committee = committee;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Check if user is member of a specific committee
const requireMemberOfCommittee = async (req, res, next) => {
  try {
    if (!['member', 'coordinator'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Committee member access required' });
    }

    const committeeId = req.params.committeeId || req.body.committeeId;
    if (!committeeId) {
      return res.status(400).json({ message: 'Committee ID required' });
    }

    const Committee = require('../models/Committee');
    const committee = await Committee.findById(committeeId);
    
    if (!committee) {
      return res.status(404).json({ message: 'Committee not found' });
    }

    const isCoordinator = committee.coordinatorId.toString() === req.user._id.toString();
    const isMember = committee.memberIds.some(id => id.toString() === req.user._id.toString());

    if (!isCoordinator && !isMember) {
      return res.status(403).json({ message: 'Not authorized for this committee' });
    }

    req.committee = committee;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { auth, requireRole, requireCoordinatorOfCommittee, requireMemberOfCommittee };

