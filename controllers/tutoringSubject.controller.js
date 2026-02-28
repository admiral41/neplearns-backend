const httpStatus = require('http-status');
const TutoringSubject = require('../models/tutoringSubject.model');
const { responseHandler } = require('../helpers/index');
const { parseFilters, sendErrorResponse, sendQueryResponse, sendSuccessResponse } = responseHandler;

// ======================= CREATE SUBJECT =======================
exports.createSubject = async (req, res) => {
  try {
    const { name, description, monthlyPrice, platformFeePercentage } = req.body;

    // Check admin privileges for subject creation
    if (!req.user.roles.includes('ADMIN') && !req.user.roles.includes('SUPERADMIN')) {
      return sendErrorResponse({
        res,
        status: httpStatus.FORBIDDEN,
        msg: 'Admin privileges required to create tutoring subjects.'
      });
    }

    // Check if subject already exists (name is unique)
    const existingSubject = await TutoringSubject.findOne({ name });

    if (existingSubject) {
      return sendErrorResponse({
        res,
        status: httpStatus.CONFLICT,
        msg: 'Tutoring subject name already exists.'
      });
    }

    // Get order number (last order + 1)
    const lastSubject = await TutoringSubject.findOne()
      .sort({ order: -1 })
      .select('order');

    const order = lastSubject ? lastSubject.order + 1 : 0;

    // Create subject
    const subject = await TutoringSubject.create({
      name,
      description,
      monthlyPrice,
      platformFeePercentage: platformFeePercentage !== undefined ? platformFeePercentage : 15,
      order,
      createdBy: req.user._id
    });

    return sendSuccessResponse({
      res,
      status: httpStatus.CREATED,
      msg: 'Tutoring subject created successfully.',
      data: subject
    });
  } catch (err) {
    console.error('Create tutoring subject error:', err);

    if (err.code === 11000) {
      return sendErrorResponse({
        res,
        status: httpStatus.CONFLICT,
        msg: 'Tutoring subject slug already exists.'
      });
    }

    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to create tutoring subject.',
      err: err.message
    });
  }
};

// ======================= UPDATE SUBJECT =======================
exports.updateSubject = async (req, res) => {
  try {
    const { slug } = req.params;
    const { name, description, monthlyPrice, platformFeePercentage, isActive } = req.body;

    // Check admin privileges for subject update
    if (!req.user.roles.includes('ADMIN') && !req.user.roles.includes('SUPERADMIN')) {
      return sendErrorResponse({
        res,
        status: httpStatus.FORBIDDEN,
        msg: 'Admin privileges required to update tutoring subjects.'
      });
    }

    // Find subject
    const subject = await TutoringSubject.findOne({ slug });
    if (!subject) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: 'Tutoring subject not found.'
      });
    }

    // Check if new name conflicts with existing subject
    if (name && name !== subject.name) {
      const existingSubject = await TutoringSubject.findOne({
        name,
        _id: { $ne: subject._id }
      });

      if (existingSubject) {
        return sendErrorResponse({
          res,
          status: httpStatus.CONFLICT,
          msg: 'Tutoring subject name already exists.'
        });
      }
    }

    // Update subject
    const updatedSubject = await TutoringSubject.findOneAndUpdate(
      { slug },
      {
        $set: {
          name: name || subject.name,
          description: description !== undefined ? description : subject.description,
          monthlyPrice: monthlyPrice !== undefined ? monthlyPrice : subject.monthlyPrice,
          platformFeePercentage: platformFeePercentage !== undefined ? platformFeePercentage : subject.platformFeePercentage,
          isActive: isActive !== undefined ? isActive : subject.isActive
        }
      },
      { new: true, runValidators: true }
    );

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: 'Tutoring subject updated successfully.',
      data: updatedSubject
    });
  } catch (err) {
    console.error('Update tutoring subject error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to update tutoring subject.',
      err: err.message
    });
  }
};

// ======================= DELETE SUBJECT =======================
exports.deleteSubject = async (req, res) => {
  try {
    const { slug } = req.params;

    // Check admin privileges
    if (!req.user.roles.includes('ADMIN') && !req.user.roles.includes('SUPERADMIN')) {
      return sendErrorResponse({
        res,
        status: httpStatus.FORBIDDEN,
        msg: 'Admin privileges required to delete tutoring subjects.'
      });
    }

    const subject = await TutoringSubject.findOne({ slug });
    if (!subject) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: 'Tutoring subject not found.'
      });
    }

    // TODO: Check for TutoringRequests before delete in Phase 2

    await TutoringSubject.findByIdAndDelete(subject._id);

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: 'Tutoring subject deleted successfully.'
    });
  } catch (err) {
    console.error('Delete tutoring subject error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to delete tutoring subject.',
      err: err.message
    });
  }
};

// ======================= GET ALL SUBJECTS =======================
exports.getAllSubjects = async (req, res) => {
  try {
    let { page, size, sortQuery, searchQuery, selectQuery, populate } = parseFilters(req);

    // Default sort by order if no sort provided
    if (!sortQuery || Object.keys(sortQuery).length === 0 || (sortQuery._id && Object.keys(sortQuery).length === 1)) {
      sortQuery = { order: 1, createdAt: -1 };
    }

    // Only show active subjects for non-admins
    if (!req.user || (!req.user.roles.includes('ADMIN') && !req.user.roles.includes('SUPERADMIN'))) {
      searchQuery = {
        ...searchQuery,
        isActive: true
      };
    }

    const result = await sendQueryResponse({
      model: TutoringSubject,
      page,
      size,
      sortQuery,
      searchQuery,
      selectQuery,
      populate,
    });

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      data: result.data,
      pagination: {
        page: parseInt(page) || 1,
        limit: parseInt(size) || 10,
        total: result.totalData,
        totalPages: result.totalPage
      },
      msg: 'Tutoring subjects retrieved successfully.'
    });
  } catch (error) {
    console.error('Get all tutoring subjects error:', error);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to get tutoring subjects.'
    });
  }
};

// ======================= GET ACTIVE SUBJECTS =======================
exports.getActiveSubjects = async (req, res) => {
  try {
    const subjects = await TutoringSubject.find({
      isActive: true
    })
    .sort({ order: 1 })
    .select('_id name slug description monthlyPrice')
    .lean();

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      data: subjects,
      msg: 'Active tutoring subjects retrieved successfully.'
    });
  } catch (err) {
    console.error('Get active tutoring subjects error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to get active tutoring subjects.',
      err: err.message
    });
  }
};

// ======================= GET SUBJECT BY SLUG =======================
exports.getSubjectBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const subject = await TutoringSubject.findOne({ slug })
      .populate('createdBy', 'firstname lastname email');

    if (!subject) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: 'Tutoring subject not found.'
      });
    }

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: 'Tutoring subject retrieved successfully.',
      data: subject
    });
  } catch (err) {
    console.error('Get tutoring subject error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to get tutoring subject.',
      err: err.message
    });
  }
};
