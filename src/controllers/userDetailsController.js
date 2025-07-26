const UserDetails = require('../models/UserDetails');
const User = require('../models/User');

/**
 * Get user details
 */
exports.getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user has access to this profile
    if (req.user.role !== 'super_admin' && req.user.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this profile'
      });
    }

    const userDetails = await UserDetails.findByUserId(userId);
    if (!userDetails) {
      return res.status(404).json({
        success: false,
        message: 'User details not found'
      });
    }

    res.json({
      success: true,
      data: userDetails
    });

  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user details',
      error: error.message
    });
  }
};

/**
 * Update user details
 */
exports.updateUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;

    // Check if user has access to this profile
    if (req.user.role !== 'super_admin' && req.user.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this profile'
      });
    }

    let userDetails = await UserDetails.findByUserId(userId);
    
    if (!userDetails) {
      // Create new user details if they don't exist
      userDetails = new UserDetails({
        userId,
        ...updateData
      });
    } else {
      // Update existing user details
      Object.assign(userDetails, updateData);
    }

    await userDetails.save();

    res.json({
      success: true,
      message: 'User details updated successfully',
      data: userDetails
    });

  } catch (error) {
    console.error('Update user details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user details',
      error: error.message
    });
  }
};

/**
 * Add skill to user profile
 */
exports.addSkill = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, level, yearsOfExperience } = req.body;

    // Check if user has access to this profile
    if (req.user.role !== 'super_admin' && req.user.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this profile'
      });
    }

    let userDetails = await UserDetails.findByUserId(userId);
    
    if (!userDetails) {
      userDetails = new UserDetails({ userId });
    }

    await userDetails.addSkill({ name, level, yearsOfExperience });

    res.json({
      success: true,
      message: 'Skill added successfully',
      data: userDetails.skills
    });

  } catch (error) {
    console.error('Add skill error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add skill',
      error: error.message
    });
  }
};

/**
 * Add certification to user profile
 */
exports.addCertification = async (req, res) => {
  try {
    const { userId } = req.params;
    const certificationData = req.body;

    // Check if user has access to this profile
    if (req.user.role !== 'super_admin' && req.user.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this profile'
      });
    }

    let userDetails = await UserDetails.findByUserId(userId);
    
    if (!userDetails) {
      userDetails = new UserDetails({ userId });
    }

    await userDetails.addCertification(certificationData);

    res.json({
      success: true,
      message: 'Certification added successfully',
      data: userDetails.certifications
    });

  } catch (error) {
    console.error('Add certification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add certification',
      error: error.message
    });
  }
};

/**
 * Add work experience to user profile
 */
exports.addWorkExperience = async (req, res) => {
  try {
    const { userId } = req.params;
    const experienceData = req.body;

    // Check if user has access to this profile
    if (req.user.role !== 'super_admin' && req.user.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this profile'
      });
    }

    let userDetails = await UserDetails.findByUserId(userId);
    
    if (!userDetails) {
      userDetails = new UserDetails({ userId });
    }

    await userDetails.addWorkExperience(experienceData);

    res.json({
      success: true,
      message: 'Work experience added successfully',
      data: userDetails.workExperience
    });

  } catch (error) {
    console.error('Add work experience error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add work experience',
      error: error.message
    });
  }
};

/**
 * Add education to user profile
 */
exports.addEducation = async (req, res) => {
  try {
    const { userId } = req.params;
    const educationData = req.body;

    // Check if user has access to this profile
    if (req.user.role !== 'super_admin' && req.user.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this profile'
      });
    }

    let userDetails = await UserDetails.findByUserId(userId);
    
    if (!userDetails) {
      userDetails = new UserDetails({ userId });
    }

    await userDetails.addEducation(educationData);

    res.json({
      success: true,
      message: 'Education added successfully',
      data: userDetails.education
    });

  } catch (error) {
    console.error('Add education error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add education',
      error: error.message
    });
  }
};

/**
 * Update user preferences
 */
exports.updatePreferences = async (req, res) => {
  try {
    const { userId } = req.params;
    const { preferences } = req.body;

    // Check if user has access to this profile
    if (req.user.role !== 'super_admin' && req.user.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this profile'
      });
    }

    let userDetails = await UserDetails.findByUserId(userId);
    
    if (!userDetails) {
      userDetails = new UserDetails({ userId });
    }

    userDetails.preferences = { ...userDetails.preferences, ...preferences };
    await userDetails.save();

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: userDetails.preferences
    });

  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update preferences',
      error: error.message
    });
  }
};

/**
 * Get public profile
 */
exports.getPublicProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const userDetails = await UserDetails.findByUserId(userId);
    if (!userDetails) {
      return res.status(404).json({
        success: false,
        message: 'User details not found'
      });
    }

    const publicProfile = userDetails.getPublicProfile();

    res.json({
      success: true,
      data: publicProfile
    });

  } catch (error) {
    console.error('Get public profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get public profile',
      error: error.message
    });
  }
};

/**
 * Search users by skills
 */
exports.searchBySkills = async (req, res) => {
  try {
    const { skills } = req.query;
    const { page = 1, limit = 10 } = req.query;

    if (!skills || !Array.isArray(skills)) {
      return res.status(400).json({
        success: false,
        message: 'Skills array is required'
      });
    }

    const userDetails = await UserDetails.findBySkills(skills)
      .populate('userId', 'firstName lastName email role')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await UserDetails.countDocuments({
      'skills.name': { $in: skills }
    });

    res.json({
      success: true,
      data: {
        users: userDetails,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      }
    });

  } catch (error) {
    console.error('Search by skills error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search by skills',
      error: error.message
    });
  }
};

/**
 * Get complete profiles
 */
exports.getCompleteProfiles = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const userDetails = await UserDetails.findCompleteProfiles()
      .populate('userId', 'firstName lastName email role')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await UserDetails.countDocuments({ isProfileComplete: true });

    res.json({
      success: true,
      data: {
        users: userDetails,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      }
    });

  } catch (error) {
    console.error('Get complete profiles error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get complete profiles',
      error: error.message
    });
  }
};

/**
 * Update last activity
 */
exports.updateLastActivity = async (req, res) => {
  try {
    const { userId } = req.params;

    let userDetails = await UserDetails.findByUserId(userId);
    
    if (!userDetails) {
      userDetails = new UserDetails({ userId });
    }

    await userDetails.updateLastActivity();

    res.json({
      success: true,
      message: 'Activity updated successfully'
    });

  } catch (error) {
    console.error('Update activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update activity',
      error: error.message
    });
  }
};

module.exports = exports; 