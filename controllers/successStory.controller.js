const SuccessStory = require('../models/successStory.model');
const User = require('../models/user.model');
const httpStatus = require('http-status');
const { responseHandler } = require('../helpers/index');
const { sendErrorResponse, sendSuccessResponse } = responseHandler;

// ======================= PUBLIC: GET ACTIVE SUCCESS STORIES =======================
exports.getActiveSuccessStories = async (req, res) => {
  try {
    const successStories = await SuccessStory.find({ isActive: true })
      .populate('user', 'firstname lastname userImage')
      .sort({ createdAt: -1 })
      .limit(10);

    // Transform data for frontend
    const stories = successStories.map(story => ({
      _id: story._id,
      name: `${story.user.firstname} ${story.user.lastname}`,
      image: story.user.userImage || null,
      role: story.achievement,
      text: story.testimonial,
      course: story.courseName,
      rating: story.rating
    }));

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      data: stories,
      msg: 'Success stories retrieved successfully.'
    });
  } catch (err) {
    console.error('Get active success stories error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to get success stories.',
      err: err.message
    });
  }
};

// ======================= ADMIN: SEARCH USERS (LEARNER/LECTURER ONLY) =======================
exports.searchUsers = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return sendSuccessResponse({
        res,
        status: httpStatus.OK,
        data: [],
        msg: 'Enter at least 2 characters to search.'
      });
    }

    const users = await User.find({
      roles: { $nin: ['ADMIN', 'SUPERADMIN'] },
      $or: [
        { firstname: { $regex: q, $options: 'i' } },
        { lastname: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ]
    })
      .select('firstname lastname email userImage roles currentLevel stream isVerified')
      .limit(10);

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      data: users,
      msg: 'Users retrieved successfully.'
    });
  } catch (err) {
    console.error('Search users error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to search users.',
      err: err.message
    });
  }
};

// ======================= ADMIN: GET ALL SUCCESS STORIES =======================
exports.getSuccessStories = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    let query = {};
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;

    const successStories = await SuccessStory.find(query)
      .populate('user', 'firstname lastname email userImage roles')
      .populate('createdBy', 'firstname lastname')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await SuccessStory.countDocuments(query);

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      data: {
        successStories,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      },
      msg: 'Success stories retrieved successfully.'
    });
  } catch (err) {
    console.error('Get success stories error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to get success stories.',
      err: err.message
    });
  }
};

// ======================= ADMIN: GET SINGLE SUCCESS STORY =======================
exports.getSuccessStoryById = async (req, res) => {
  try {
    const successStory = await SuccessStory.findById(req.params.id)
      .populate('user', 'firstname lastname email userImage roles currentLevel stream')
      .populate('createdBy', 'firstname lastname');

    if (!successStory) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: 'Success story not found.'
      });
    }

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      data: successStory,
      msg: 'Success story retrieved successfully.'
    });
  } catch (err) {
    console.error('Get success story error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to get success story.',
      err: err.message
    });
  }
};

// ======================= ADMIN: CREATE SUCCESS STORY =======================
exports.createSuccessStory = async (req, res) => {
  try {
    const { userId, achievement, testimonial, courseName, rating } = req.body;

    if (!userId || !achievement || !testimonial || !courseName) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: 'User, achievement, testimonial, and course name are required.'
      });
    }

    // Verify user exists and is not admin
    const user = await User.findById(userId);
    if (!user) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: 'User not found.'
      });
    }

    if (user.roles.includes('ADMIN') || user.roles.includes('SUPERADMIN')) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: 'Cannot create success story for admin users.'
      });
    }

    // Check if user already has a success story
    const existingStory = await SuccessStory.findOne({ user: userId });
    if (existingStory) {
      return sendErrorResponse({
        res,
        status: httpStatus.CONFLICT,
        msg: 'A success story already exists for this user. Please edit the existing one.'
      });
    }

    const successStory = await SuccessStory.create({
      user: userId,
      achievement,
      testimonial,
      courseName,
      rating: rating || 5,
      createdBy: req.user._id
    });

    const populatedStory = await SuccessStory.findById(successStory._id)
      .populate('user', 'firstname lastname email userImage roles');

    return sendSuccessResponse({
      res,
      status: httpStatus.CREATED,
      data: populatedStory,
      msg: 'Success story created successfully.'
    });
  } catch (err) {
    console.error('Create success story error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to create success story.',
      err: err.message
    });
  }
};

// ======================= ADMIN: UPDATE SUCCESS STORY =======================
exports.updateSuccessStory = async (req, res) => {
  try {
    const { achievement, testimonial, courseName, rating, isActive } = req.body;

    const successStory = await SuccessStory.findById(req.params.id);

    if (!successStory) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: 'Success story not found.'
      });
    }

    if (achievement) successStory.achievement = achievement;
    if (testimonial) successStory.testimonial = testimonial;
    if (courseName) successStory.courseName = courseName;
    if (rating !== undefined) successStory.rating = rating;
    if (isActive !== undefined) successStory.isActive = isActive;

    await successStory.save();

    const populatedStory = await SuccessStory.findById(successStory._id)
      .populate('user', 'firstname lastname email userImage roles');

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      data: populatedStory,
      msg: 'Success story updated successfully.'
    });
  } catch (err) {
    console.error('Update success story error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to update success story.',
      err: err.message
    });
  }
};

// ======================= ADMIN: DELETE SUCCESS STORY =======================
exports.deleteSuccessStory = async (req, res) => {
  try {
    const successStory = await SuccessStory.findByIdAndDelete(req.params.id);

    if (!successStory) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: 'Success story not found.'
      });
    }

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: 'Success story deleted successfully.'
    });
  } catch (err) {
    console.error('Delete success story error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to delete success story.',
      err: err.message
    });
  }
};

// ======================= ADMIN: TOGGLE SUCCESS STORY STATUS =======================
exports.toggleStatus = async (req, res) => {
  try {
    const successStory = await SuccessStory.findById(req.params.id);

    if (!successStory) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: 'Success story not found.'
      });
    }

    successStory.isActive = !successStory.isActive;
    await successStory.save();

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      data: { isActive: successStory.isActive },
      msg: `Success story ${successStory.isActive ? 'activated' : 'deactivated'} successfully.`
    });
  } catch (err) {
    console.error('Toggle status error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to toggle success story status.',
      err: err.message
    });
  }
};
