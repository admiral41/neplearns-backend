const httpStatus = require('http-status');
const Course = require('../models/course.model');
const User = require('../models/user.model');
const Lecturer = require('../models/lecturer.model');
const Category = require('../models/category');
const Week = require('../models/weeks');
const Lesson = require('../models/lessons');
const LessonStatus = require('../models/lessonStatus');
const Enrollment = require('../models/enrollment.model');
const CourseRating = require('../models/courseRating.model');
const { responseHandler } = require('../helpers/index');
const upload = require('../middlewares/multer');
const { parseFilters, sendErrorResponse, sendQueryResponse, sendSuccessResponse } = responseHandler;
const helper = require('../helpers/mailer');

const uploadImage = upload.single('image');

// ======================= CREATE COURSE (HYBRID APPROACH) =======================
exports.createCourse = async (req, res) => {
  try {
    uploadImage(req, res, async err => {
      if (err) {
        return sendErrorResponse({ 
          res, 
          status: httpStatus.BAD_REQUEST, 
          msg: 'Failed to upload image: ' + err.message 
        });
      }

      const { 
        courseTitle, 
        courseDesc, 
        courseShortDesc, 
        duration, 
        weekly_study, 
        learn_type, 
        category, 
        price, 
        tags, 
        discount, 
        embeddedUrl,
        requirements 
      } = req.body;

      // Check if course already exists
      const existingCourse = await Course.findOne({ 
        courseTitle, 
        category 
      });
      
      if (existingCourse) {
        return sendErrorResponse({ 
          res, 
          status: httpStatus.CONFLICT, 
          msg: 'Course with this title already exists in this category.' 
        });
      }

      // Parse tags if string
      let tagsArray = [];
      if (tags) {
        if (typeof tags === 'string') {
          tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
        } else if (Array.isArray(tags)) {
          tagsArray = tags;
        }
      }

      // Determine status based on user role
      let status = 'draft';
      let creatorType = 'lecturer';
      let lecturers = [];

      if (req.user.roles.includes('SUPERADMIN') || req.user.roles.includes('ADMIN')) {
        // Admin can create and publish directly
        status = 'approved';
        creatorType = req.user.roles.includes('SUPERADMIN') ? 'superadmin' : 'admin';
        
        // If admin specifies lecturers, use them
        if (req.body.lecturers && req.body.lecturers.length > 0) {
          // Parse lecturers if it's a string
          if (typeof req.body.lecturers === 'string') {
            try {
              lecturers = JSON.parse(req.body.lecturers);
            } catch (e) {
              lecturers = req.body.lecturers.split(',').map(id => id.trim());
            }
          } else {
            lecturers = req.body.lecturers;
          }
        } else {
          // If no lecturers specified, check if current user is a lecturer
          const userLecturer = await Lecturer.findOne({ 
            user: req.user._id,
            requestStatus: 'approved',
            isActive: true 
          });
          if (userLecturer) {
            lecturers = [userLecturer._id];
          }
        }
      } else if (req.user.roles.includes('LECTURER')) {
        // Lecturer creates course - needs approval
        status = 'pending_approval';
        creatorType = 'lecturer';
        
        // Get lecturer profile
        const lecturer = await Lecturer.findOne({ 
          user: req.user._id,
          requestStatus: 'approved',
          isActive: true 
        });
        
        if (!lecturer) {
          return sendErrorResponse({ 
            res, 
            status: httpStatus.FORBIDDEN, 
            msg: 'Your lecturer account is not approved or active.' 
          });
        }
        
        lecturers = [lecturer._id];
      } else {
        return sendErrorResponse({ 
          res, 
          status: httpStatus.FORBIDDEN, 
          msg: 'Only lecturers and admins can create courses.' 
        });
      }

      // Validate price for PAID courses
      if (learn_type === 'PAID' && (!price || parseFloat(price) <= 0)) {
        return sendErrorResponse({ 
          res, 
          status: httpStatus.BAD_REQUEST, 
          msg: 'Price is required and must be greater than 0 for PAID courses.' 
        });
      }

      // Create course
      const course = await Course.create({
        courseTitle,
        courseDesc,
        courseShortDesc: courseShortDesc || courseDesc.substring(0, 150) + '...',
        duration: parseInt(duration) || 0,
        weekly_study: parseInt(weekly_study) || 0,
        learn_type,
        category,
        price: learn_type === 'PAID' ? parseFloat(price) || 0 : 0,
        discount: parseFloat(discount) || 0,
        tags: tagsArray,
        embeddedUrl,
        requirements,
        image: req.file ? req.file.path : null,
        status,
        createdBy: req.user._id,
        creatorType,
        lecturers,
        published: status === 'approved'
      });

      // Populate response data
      await course.populate([
        {
          path: 'category',
          select: 'categoryName categorySlug'
        },
        {
          path: 'lecturers',
          select: 'user joinDate',
          populate: {
            path: 'user',
            select: 'firstname lastname email userImage'
          }
        },
        {
          path: 'createdBy',
          select: 'firstname lastname email userImage'
        }
      ]);

      // Notify admins if course is pending approval
      if (status === 'pending_approval') {
        try {
          await notifyAdminsAboutCourseRequest(course, req.user);
        } catch (notifyError) {
          console.error('Failed to notify admins:', notifyError);
        }
      }

      return sendSuccessResponse({ 
        res, 
        status: httpStatus.CREATED, 
        msg: status === 'pending_approval' 
          ? 'Course created successfully. Waiting for admin approval.' 
          : 'Course created and published successfully.',
        data: course 
      });
    });
  } catch (err) {
    console.error('Create course error:', err);
    return sendErrorResponse({ 
      res, 
      status: httpStatus.INTERNAL_SERVER_ERROR, 
      msg: 'Failed to create course.', 
      err: err.message 
    });
  }
};

// ======================= SEARCH COURSES =======================
exports.search = async (req, res) => {
  try {
    const { q: query, category, minPrice, maxPrice, learn_type, page = 1, limit = 10 } = req.query;
    
    if (!query || query.length < 2) {
      return sendSuccessResponse({
        res,
        status: httpStatus.OK,
        data: [],
        msg: 'Search query must be at least 2 characters long.'
      });
    }

    // Build search filter
    let filter = {
      status: 'approved',
      published: true
    };

    // Check if user is admin
    if (req.user && (req.user.roles.includes('ADMIN') || req.user.roles.includes('SUPERADMIN'))) {
      filter = {}; // Admin can see all courses
    }

    // Fuzzy search on courseTitle and courseDesc
    const searchResults = Course.fuzzySearch(query)
      .where(filter);

    // Apply additional filters
    if (category) {
      // With simplified categories, just filter by the specific category
      searchResults.find({ category });
    }

    if (learn_type) {
      searchResults.find({ learn_type });
    }

    if (minPrice || maxPrice) {
      const priceFilter = {};
      if (minPrice) priceFilter.$gte = parseFloat(minPrice);
      if (maxPrice) priceFilter.$lte = parseFloat(maxPrice);
      searchResults.find({ price: priceFilter });
    }

    // Pagination
    const skip = (page - 1) * limit;
    const courses = await searchResults
      .populate([
        {
          path: 'category',
          select: 'categoryName categorySlug'
        },
        {
          path: 'lecturers',
          select: 'user',
          populate: {
            path: 'user',
            select: 'firstname lastname email userImage'
          }
        },
        {
          path: 'createdBy',
          select: 'firstname lastname email userImage'
        }
      ])
      .sort({ rating: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-courseTitle_fuzzy -courseDesc_fuzzy');

    const total = await Course.fuzzySearch(query)
      .where(filter)
      .countDocuments();

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      data: courses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      },
      msg: 'Search results retrieved successfully.'
    });
  } catch (error) {
    console.error('Search courses error:', error);
    return sendErrorResponse({ 
      res, 
      status: httpStatus.INTERNAL_SERVER_ERROR, 
      msg: 'Failed to search courses.' 
    });
  }
};

// ======================= ADMIN: APPROVE/REJECT COURSE =======================
exports.processCourseRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason, publishDirectly = false } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.BAD_REQUEST, 
        msg: "Invalid action. Use 'approve' or 'reject'." 
      });
    }

    // Check admin privileges (already done in middleware, but double-check)
    if (!req.user.roles.includes('ADMIN') && !req.user.roles.includes('SUPERADMIN')) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.FORBIDDEN, 
        msg: 'Admin privileges required.' 
      });
    }

    const course = await Course.findById(id)
      .populate('createdBy', 'firstname lastname email')
      .populate({
        path: 'lecturers',
        populate: {
          path: 'user',
          select: 'firstname lastname email'
        }
      });

    if (!course) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.NOT_FOUND, 
        msg: 'Course not found.' 
      });
    }

    if (course.status !== 'pending_approval') {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.BAD_REQUEST, 
        msg: 'Course is not pending approval.' 
      });
    }

    if (action === 'approve') {
      // Update course status
      course.status = 'approved';
      course.published = publishDirectly;
      
      if (publishDirectly) {
        course.publishedAt = new Date();
      }

      // Add admin note
      course.adminNotes.push({
        note: `Course approved by ${req.user.firstname} ${req.user.lastname}. ${reason ? 'Reason: ' + reason : ''}`,
        addedBy: req.user._id
      });

      await course.save();

      // Notify course creator
      try {
        await helper.sendCourseApprovalMail({
          email: course.createdBy.email,
          firstname: course.createdBy.firstname,
          lastname: course.createdBy.lastname,
          courseTitle: course.courseTitle,
          courseLink: `${process.env.FRONTEND_URI}/courses/${course.courseSlug}`,
          publishDirectly
        });
      } catch (emailError) {
        console.error('Failed to send approval email:', emailError);
      }

      return sendSuccessResponse({
        res,
        status: httpStatus.OK,
        msg: publishDirectly 
          ? 'Course approved and published successfully.' 
          : 'Course approved successfully.',
        data: course
      });

    } else { // reject
      if (!reason || reason.trim().length < 10) {
        return sendErrorResponse({ 
          res, 
          status: httpStatus.BAD_REQUEST, 
          msg: 'Rejection reason is required (minimum 10 characters).' 
        });
      }

      // Update course status
      course.status = 'rejected';
      course.rejectionReason = reason;
      
      // Add admin note
      course.adminNotes.push({
        note: `Course rejected by ${req.user.firstname} ${req.user.lastname}. Reason: ${reason}`,
        addedBy: req.user._id
      });

      await course.save();

      // Notify course creator
      try {
        await helper.sendCourseRejectionMail({
          email: course.createdBy.email,
          firstname: course.createdBy.firstname,
          lastname: course.createdBy.lastname,
          courseTitle: course.courseTitle,
          reason: reason
        });
      } catch (emailError) {
        console.error('Failed to send rejection email:', emailError);
      }

      return sendSuccessResponse({
        res,
        status: httpStatus.OK,
        msg: 'Course rejected successfully.',
        data: course
      });
    }

  } catch (err) {
    console.error('Process course request error:', err);
    return sendErrorResponse({ 
      res, 
      status: httpStatus.INTERNAL_SERVER_ERROR, 
      msg: 'Failed to process course request.', 
      err: err.message 
    });
  }
};

// ======================= UPDATE COURSE =======================
exports.updateCourse = async (req, res) => {
  try {
    uploadImage(req, res, async err => {
      if (err) {
        return sendErrorResponse({ 
          res, 
          status: httpStatus.BAD_REQUEST, 
          msg: 'Failed to upload image.' 
        });
      }

      const { slug } = req.params;
      const { 
        courseTitle, 
        courseDesc, 
        courseShortDesc, 
        duration, 
        weekly_study, 
        learn_type, 
        category, 
        price, 
        tags, 
        discount, 
        embeddedUrl,
        requirements 
      } = req.body;

      // Find course
      const course = await Course.findOne({ courseSlug: slug });
      
      if (!course) {
        return sendErrorResponse({ 
          res, 
          status: httpStatus.NOT_FOUND, 
          msg: 'Course not found.' 
        });
      }

      // Check if user can edit this course
      const canEdit = await course.canUserEdit(req.user._id, req.user.roles);
      if (!canEdit) {
        return sendErrorResponse({ 
          res, 
          status: httpStatus.FORBIDDEN, 
          msg: 'You do not have permission to edit this course.' 
        });
      }

      // Check for duplicate title in same category
      if (courseTitle && courseTitle !== course.courseTitle) {
        const existingCourse = await Course.findOne({ 
          courseTitle, 
          category: category || course.category,
          _id: { $ne: course._id }
        });
        
        if (existingCourse) {
          return sendErrorResponse({ 
            res, 
            status: httpStatus.CONFLICT, 
            msg: 'Course with this title already exists in this category.' 
          });
        }
      }

      // Parse tags if provided
      let tagsArray = course.tags;
      if (tags) {
        if (typeof tags === 'string') {
          tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
        } else if (Array.isArray(tags)) {
          tagsArray = tags;
        }
      }

      // Prepare update data
      const updateData = {
        courseTitle: courseTitle || course.courseTitle,
        courseDesc: courseDesc || course.courseDesc,
        courseShortDesc: courseShortDesc || course.courseShortDesc,
        duration: parseInt(duration) || course.duration,
        weekly_study: parseInt(weekly_study) || course.weekly_study,
        learn_type: learn_type || course.learn_type,
        category: category || course.category,
        price: (learn_type || course.learn_type) === 'PAID' ? parseFloat(price) || course.price : 0,
        discount: parseFloat(discount) || course.discount,
        tags: tagsArray,
        embeddedUrl: embeddedUrl || course.embeddedUrl,
        requirements: requirements || course.requirements
      };

      // Add image if uploaded
      if (req.file) {
        updateData.image = req.file.path;
      }

      // If lecturer is updating an approved course, set status to pending_approval for review
      if (req.user.roles.includes('LECTURER') && !req.user.roles.includes('ADMIN') && !req.user.roles.includes('SUPERADMIN')) {
        if (course.status === 'approved' || course.status === 'published') {
          updateData.status = 'pending_approval';
          updateData.published = false;
        }
      }

      // Update course
      const updatedCourse = await Course.findByIdAndUpdate(
        course._id,
        { $set: updateData },
        { new: true, runValidators: true }
      ).populate([
        {
          path: 'category',
          select: 'categoryName categorySlug'
        },
        {
          path: 'lecturers',
          select: 'user joinDate',
          populate: {
            path: 'user',
            select: 'firstname lastname email userImage'
          }
        }
      ]);

      // Notify admins if course needs re-approval
      if (updateData.status === 'pending_approval' && course.status !== 'pending_approval') {
        try {
          await notifyAdminsAboutCourseRequest(updatedCourse, req.user);
        } catch (notifyError) {
          console.error('Failed to notify admins:', notifyError);
        }
      }

      return sendSuccessResponse({ 
        res, 
        status: httpStatus.OK, 
        msg: updatedCourse.status === 'pending_approval'
          ? 'Course updated successfully. Waiting for admin re-approval.'
          : 'Course updated successfully.',
        data: updatedCourse 
      });
    });
  } catch (err) {
    console.error('Update course error:', err);
    return sendErrorResponse({ 
      res, 
      status: httpStatus.INTERNAL_SERVER_ERROR, 
      msg: 'Failed to update course.', 
      err: err.message 
    });
  }
};

// ======================= DELETE COURSE =======================
exports.deleteCourse = async (req, res) => {
  try {
    const { slug } = req.params;

    const course = await Course.findOne({ courseSlug: slug });
    
    if (!course) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.NOT_FOUND, 
        msg: 'Course not found.' 
      });
    }

    // Check permissions
    const canEdit = await course.canUserEdit(req.user._id, req.user.roles);
    if (!canEdit) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.FORBIDDEN, 
        msg: 'You do not have permission to delete this course.' 
      });
    }

    // Check if course has enrollments
    if (course.learners.length > 0) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.BAD_REQUEST, 
        msg: 'Cannot delete course with enrolled students. Archive instead.' 
      });
    }

    // Soft delete (archive) instead of hard delete
    course.status = 'archived';
    await course.save();

    return sendSuccessResponse({ 
      res, 
      status: httpStatus.OK, 
      msg: 'Course archived successfully.' 
    });
  } catch (err) {
    console.error('Delete course error:', err);
    return sendErrorResponse({ 
      res, 
      status: httpStatus.INTERNAL_SERVER_ERROR, 
      msg: 'Failed to delete course.', 
      err: err.message 
    });
  }
};

// ======================= PUBLISH/UNPUBLISH COURSE =======================
exports.toggleCoursePublish = async (req, res) => {
  try {
    const { slug } = req.params;
    const { publish } = req.body;

    // Check admin privileges (already done in middleware, but double-check)
    if (!req.user.roles.includes('ADMIN') && !req.user.roles.includes('SUPERADMIN')) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.FORBIDDEN, 
        msg: 'Admin privileges required to publish/unpublish courses.' 
      });
    }

    const course = await Course.findOne({ courseSlug: slug });
    
    if (!course) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.NOT_FOUND, 
        msg: 'Course not found.' 
      });
    }

    // Check if course is approved
    if (course.status !== 'approved') {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.BAD_REQUEST, 
        msg: 'Only approved courses can be published.' 
      });
    }

    course.published = publish === true;
    
    if (publish === true && !course.publishedAt) {
      course.publishedAt = new Date();
    }

    await course.save();

    return sendSuccessResponse({ 
      res, 
      status: httpStatus.OK, 
      msg: publish 
        ? 'Course published successfully.' 
        : 'Course unpublished successfully.',
      data: course 
    });
  } catch (err) {
    console.error('Toggle publish error:', err);
    return sendErrorResponse({ 
      res, 
      status: httpStatus.INTERNAL_SERVER_ERROR, 
      msg: 'Failed to update course status.', 
      err: err.message 
    });
  }
};

// ======================= GET ALL COURSES WITH FILTERS =======================
exports.getAllCourses = async (req, res) => {
  try {
    let { page, size, sortQuery, searchQuery, selectQuery, populate } = parseFilters(req);
    
    // Initialize req.user.roles if not authenticated
    const userRoles = req.user ? req.user.roles : ['LEARNER'];
    
    // Add status filter for non-admins
    if (!userRoles.includes('ADMIN') && !userRoles.includes('SUPERADMIN')) {
      searchQuery = {
        ...searchQuery,
        status: 'approved',
        published: true
      };
    }

    // Filter by category if provided
    if (req.query.category) {
      // With simplified categories, just filter by the specific category ID
      searchQuery = {
        ...searchQuery,
        category: req.query.category
      };
    }

    // Filter by status if provided (only for admins)
    if (req.query.status && (userRoles.includes('ADMIN') || userRoles.includes('SUPERADMIN'))) {
      searchQuery = {
        ...searchQuery,
        status: req.query.status
      };
    }

    // Filter by creator if provided (for admins)
    if (req.query.createdBy && (userRoles.includes('ADMIN') || userRoles.includes('SUPERADMIN'))) {
      searchQuery = {
        ...searchQuery,
        createdBy: req.query.createdBy
      };
    }

    // Filter by lecturer
    if (req.query.lecturer) {
      searchQuery = {
        ...searchQuery,
        lecturers: req.query.lecturer
      };
    }

    selectQuery = '-courseTitle_fuzzy -courseDesc_fuzzy';

    // Updated populate without parentCategory
    populate = [
      {
        path: 'category',
        select: '_id categoryName categorySlug' // Removed parentCategory
      },
      {
        path: 'lecturers',
        select: 'user joinDate',
        populate: {
          path: 'user',
          select: 'firstname lastname email userImage',
        },
      },
      {
        path: 'createdBy',
        select: 'firstname lastname email'
      }
    ];

    const result = await sendQueryResponse({
      model: Course,
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
      }
    });
  } catch (error) {
    console.error('Get all courses error:', error);
    return sendErrorResponse({ 
      res, 
      status: httpStatus.INTERNAL_SERVER_ERROR, 
      msg: 'Failed to get courses.' 
    });
  }
};

// ======================= GET COURSE DETAILS =======================
exports.getCourseDetails = async (req, res) => {
  try {
    const { slug } = req.params;
    const mongoose = require('mongoose');

    // Support lookup by both courseSlug and _id
    const query = mongoose.Types.ObjectId.isValid(slug)
      ? { $or: [{ courseSlug: slug }, { _id: slug }] }
      : { courseSlug: slug };

    const course = await Course.findOne(query)
      .populate([
        {
          path: 'category',
          select: '_id categoryName categorySlug'
        },
        {
          path: 'lecturers',
          select: 'user joinDate',
          populate: {
            path: 'user',
            select: 'firstname lastname email userImage bio'
          }
        },
        {
          path: 'createdBy',
          select: 'firstname lastname email userImage'
        },
        {
          path: 'learners',
          select: 'firstname lastname email userImage',
          match: { _id: req.user?._id }
        }
      ]);

    if (!course) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.NOT_FOUND, 
        msg: 'Course not found.' 
      });
    }

    // Check if user can view this course
    if (course.status !== 'approved' && course.status !== 'published') {
      const canView = req.user ? await course.canUserEdit(req.user._id, req.user.roles || []) : false;
      if (!canView) {
        return sendErrorResponse({ 
          res, 
          status: httpStatus.FORBIDDEN, 
          msg: 'You do not have permission to view this course.' 
        });
      }
    }

    // Get weeks and lessons count
    const weeks = await Week.find({ course: course._id });
    const lessons = await Lesson.find({ week: { $in: weeks.map(w => w._id) } });
    
    course.totalWeeks = weeks.length;
    course.totalLessons = lessons.length;

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      data: course,
      msg: 'Course details retrieved successfully.'
    });
  } catch (error) {
    console.error('Get course details error:', error);
    return sendErrorResponse({ 
      res, 
      status: httpStatus.INTERNAL_SERVER_ERROR, 
      msg: 'Failed to get course details.' 
    });
  }
};

// ======================= GET PENDING COURSE REQUESTS (ADMIN) =======================
exports.getPendingCourseRequests = async (req, res) => {
  try {
    // Check admin privileges (already done in middleware, but double-check)
    if (!req.user.roles.includes('ADMIN') && !req.user.roles.includes('SUPERADMIN')) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.FORBIDDEN, 
        msg: 'Admin privileges required.' 
      });
    }

    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const pendingRequests = await Course.find({ 
      status: 'pending_approval',
      creatorType: 'lecturer'
    })
    .populate([
      {
        path: 'createdBy',
        select: 'firstname lastname email phone'
      },
      {
        path: 'category',
        select: 'categoryName'
      },
      {
        path: 'lecturers',
        select: 'user',
        populate: {
          path: 'user',
          select: 'firstname lastname email'
        }
      }
    ])
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    const total = await Course.countDocuments({ 
      status: 'pending_approval',
      creatorType: 'lecturer'
    });

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      data: pendingRequests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      },
      msg: 'Pending course requests retrieved successfully.'
    });
  } catch (err) {
    console.error('Get pending requests error:', err);
    return sendErrorResponse({ 
      res, 
      status: httpStatus.INTERNAL_SERVER_ERROR, 
      msg: 'Failed to get pending course requests.', 
      err: err.message 
    });
  }
};

// ======================= ASSIGN LECTURERS TO COURSE =======================
exports.assignLecturers = async (req, res) => {
  try {
    const { slug } = req.params;
    const { lecturers } = req.body;

    // Check admin privileges (already done in middleware, but double-check)
    if (!req.user.roles.includes('ADMIN') && !req.user.roles.includes('SUPERADMIN')) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.FORBIDDEN, 
        msg: 'Admin privileges required to assign lecturers.' 
      });
    }

    if (!lecturers || !Array.isArray(lecturers) || lecturers.length === 0) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.BAD_REQUEST, 
        msg: 'Lecturers array is required.' 
      });
    }

    const course = await Course.findOne({ courseSlug: slug });
    
    if (!course) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.NOT_FOUND, 
        msg: 'Course not found.' 
      });
    }

    // Verify all lecturers exist and are approved
    const lecturerDocs = await Lecturer.find({
      _id: { $in: lecturers },
      requestStatus: 'approved',
      isActive: true
    });

    if (lecturerDocs.length !== lecturers.length) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.BAD_REQUEST, 
        msg: 'One or more lecturers are not approved or active.' 
      });
    }

    course.lecturers = [...new Set([...course.lecturers.map(id => id.toString()), ...lecturers])]; // Merge and remove duplicates
    await course.save();

    // Populate response
    await course.populate([
      {
        path: 'lecturers',
        select: 'user joinDate',
        populate: {
          path: 'user',
          select: 'firstname lastname email userImage'
        }
      }
    ]);

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: 'Lecturers assigned successfully.',
      data: course
    });
  } catch (err) {
    console.error('Assign lecturers error:', err);
    return sendErrorResponse({ 
      res, 
      status: httpStatus.INTERNAL_SERVER_ERROR, 
      msg: 'Failed to assign lecturers.', 
      err: err.message 
    });
  }
};

// ======================= REMOVE LECTURER FROM COURSE =======================
exports.removeLecturer = async (req, res) => {
  try {
    const { slug, lecturerId } = req.params;

    // Check admin privileges
    if (!req.user.roles.includes('ADMIN') && !req.user.roles.includes('SUPERADMIN')) {
      // Lecturer can only remove themselves
      if (req.user.roles.includes('LECTURER')) {
        const lecturer = await Lecturer.findOne({ user: req.user._id });
        if (!lecturer || lecturer._id.toString() !== lecturerId) {
          return sendErrorResponse({ 
            res, 
            status: httpStatus.FORBIDDEN, 
            msg: 'You can only remove yourself from the course.' 
          });
        }
      } else {
        return sendErrorResponse({ 
          res, 
          status: httpStatus.FORBIDDEN, 
          msg: 'Permission denied.' 
        });
      }
    }

    const course = await Course.findOne({ courseSlug: slug });
    
    if (!course) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.NOT_FOUND, 
        msg: 'Course not found.' 
      });
    }

    // Check if lecturer is assigned to course
    if (!course.lecturers.some(id => id.toString() === lecturerId)) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.BAD_REQUEST, 
        msg: 'Lecturer is not assigned to this course.' 
      });
    }

    // Cannot remove the creator if they're the only lecturer
    if (course.createdBy.toString() === lecturerId && course.lecturers.length === 1) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.BAD_REQUEST, 
        msg: 'Cannot remove course creator. Assign another lecturer first.' 
      });
    }

    course.lecturers = course.lecturers.filter(id => id.toString() !== lecturerId);
    await course.save();

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: 'Lecturer removed successfully.',
      data: course
    });
  } catch (err) {
    console.error('Remove lecturer error:', err);
    return sendErrorResponse({ 
      res, 
      status: httpStatus.INTERNAL_SERVER_ERROR, 
      msg: 'Failed to remove lecturer.', 
      err: err.message 
    });
  }
};

// ======================= ENROLL IN COURSE =======================
exports.enrollInCourse = async (req, res) => {
  try {
    const { slug } = req.params;

    const course = await Course.findOne({ courseSlug: slug });
    
    if (!course) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.NOT_FOUND, 
        msg: 'Course not found.' 
      });
    }

    // Check if course is published
    if (!course.published || course.status !== 'approved') {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.BAD_REQUEST, 
        msg: 'Course is not available for enrollment.' 
      });
    }

    // Check if already enrolled
    if (course.learners.some(learnerId => learnerId.toString() === req.user._id.toString())) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.CONFLICT, 
        msg: 'You are already enrolled in this course.' 
      });
    }

    // Determine payment info
    const paymentAmount = course.learn_type === 'PAID' ? (course.finalPrice || course.price) : 0;
    const paymentMethod = course.learn_type === 'PAID' ? 'other' : 'free';

    // Enroll user
    course.learners.push(req.user._id);
    course.totalEnrollments = course.learners.length;
    await course.save();

    // Create enrollment record for tracking
    await Enrollment.findOneAndUpdate(
      { student: req.user._id, course: course._id },
      {
        student: req.user._id,
        course: course._id,
        enrolledAt: new Date(),
        paymentAmount,
        paymentMethod,
        paymentStatus: 'completed',
        status: 'active'
      },
      { upsert: true, new: true }
    );

    // Initialize lesson status for enrolled user
    const weeks = await Week.find({ course: course._id });
    const lessons = await Lesson.find({ week: { $in: weeks.map(w => w._id) } });

    // Create lesson status entries for all lessons
    for (const lesson of lessons) {
      await LessonStatus.findOneAndUpdate(
        { learner: req.user._id, lesson: lesson._id },
        {
          learner: req.user._id,
          lesson: lesson._id,
          isCompleted: false,
          startDate: new Date()
        },
        { upsert: true, new: true }
      );
    }

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: 'Successfully enrolled in the course.',
      data: {
        course: course.courseTitle,
        enrolled: true,
        totalLessons: lessons.length
      }
    });
  } catch (err) {
    console.error('Enroll in course error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to enroll in course.',
      err: err.message
    });
  }
};

// ======================= GET INSTRUCTOR RECENT ENROLLMENTS =======================
exports.getInstructorRecentEnrollments = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Check if user is admin/superadmin - they can see ALL enrollments
    const isAdmin = req.user.roles.includes('ADMIN') || req.user.roles.includes('SUPERADMIN');

    let enrollmentQuery = { status: 'active' };

    // If not admin, filter by instructor's own courses only
    if (!isAdmin) {
      const instructorCourses = await Course.find({
        createdBy: req.user._id
      }).select('_id');

      if (instructorCourses.length === 0) {
        return sendSuccessResponse({
          res,
          status: httpStatus.OK,
          msg: "No courses found",
          data: []
        });
      }

      const courseIds = instructorCourses.map(c => c._id);
      enrollmentQuery.course = { $in: courseIds };
    }

    // Get recent enrollments
    const recentEnrollments = await Enrollment.find(enrollmentQuery)
      .populate({
        path: 'student',
        select: 'firstname lastname email userImage'
      })
      .populate({
        path: 'course',
        select: 'courseTitle courseSlug price learn_type finalPrice'
      })
      .sort({ enrolledAt: -1 })
      .limit(parseInt(limit));

    // Format response
    const formattedEnrollments = recentEnrollments.map(enrollment => ({
      id: enrollment._id,
      studentName: enrollment.student
        ? `${enrollment.student.firstname || ''} ${enrollment.student.lastname || ''}`.trim()
        : 'Unknown Student',
      studentAvatar: enrollment.student?.userImage || null,
      studentEmail: enrollment.student?.email || '',
      courseName: enrollment.course?.courseTitle || 'Unknown Course',
      courseSlug: enrollment.course?.courseSlug || '',
      enrolledAt: enrollment.enrolledAt,
      amount: enrollment.paymentAmount > 0
        ? `Rs. ${enrollment.paymentAmount.toLocaleString()}`
        : 'Free',
      paymentMethod: enrollment.paymentMethod,
      paymentStatus: enrollment.paymentStatus
    }));

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: "Recent enrollments retrieved successfully",
      data: formattedEnrollments
    });
  } catch (error) {
    console.error('Get instructor recent enrollments error:', error);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to get recent enrollments"
    });
  }
};

// ======================= GET MY COURSES =======================
exports.getMyCourses = async (req, res) => {
  try {
    let { type = 'enrolled' } = req.query;

    let query = {};

    if (type === 'enrolled') {
      query.learners = req.user._id;
      query.published = true;
      query.status = 'approved';
    } else if (type === 'teaching') {
      const lecturer = await Lecturer.findOne({ user: req.user._id });
      if (lecturer) {
        query.lecturers = lecturer._id;
      } else {
        query.lecturers = [];
      }
    } else if (type === 'created') {
      query.createdBy = req.user._id;
    } else if (type === 'pending') {
      query.createdBy = req.user._id;
      query.status = 'pending_approval';
    }

    const courses = await Course.find(query)
      .populate([
        {
          path: 'category',
          select: 'categoryName categorySlug'
        },
        {
          path: 'lecturers',
          select: 'user',
          populate: {
            path: 'user',
            select: 'firstname lastname email userImage'
          }
        }
      ])
      .sort({ createdAt: -1 })
      .lean();

    // Calculate progress for enrolled courses
    if (type === 'enrolled') {
      const coursesWithProgress = await Promise.all(
        courses.map(async (course) => {
          try {
            // Get all weeks for this course
            const weeks = await Week.find({ course: course._id }).select('_id');
            const weekIds = weeks.map(w => w._id);

            // Get all lessons for these weeks
            const lessons = await Lesson.find({ week: { $in: weekIds } }).select('_id');
            const lessonIds = lessons.map(l => l._id);
            const totalLessons = lessonIds.length;

            if (totalLessons === 0) {
              return {
                ...course,
                progress: 0,
                completedLessons: 0,
                totalLessons: 0,
                totalTimeSpent: 0
              };
            }

            // Get completed lessons for this user
            const completedStatuses = await LessonStatus.find({
              learner: req.user._id,
              lesson: { $in: lessonIds },
              isCompleted: true
            }).select('timeSpent');

            const completedLessons = completedStatuses.length;
            const totalTimeSpent = completedStatuses.reduce((sum, s) => sum + (s.timeSpent || 0), 0);
            const progress = Math.round((completedLessons / totalLessons) * 100);

            return {
              ...course,
              progress,
              completedLessons,
              totalLessons,
              totalTimeSpent
            };
          } catch (error) {
            console.error(`Error calculating progress for course ${course._id}:`, error);
            return {
              ...course,
              progress: 0,
              completedLessons: 0,
              totalLessons: course.totalLessons || 0,
              totalTimeSpent: 0
            };
          }
        })
      );

      return sendSuccessResponse({
        res,
        status: httpStatus.OK,
        data: coursesWithProgress,
        msg: 'Courses retrieved successfully.'
      });
    }

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      data: courses,
      msg: 'Courses retrieved successfully.'
    });
  } catch (err) {
    console.error('Get my courses error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to get your courses.',
      err: err.message
    });
  }
};

// ======================= HELPER FUNCTIONS =======================

// ======================= GET INSTRUCTOR STUDENTS =======================
exports.getInstructorStudents = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      courseId = '',
      status = '',
      sortBy = 'enrolledAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Check if user is admin/superadmin - they can see ALL enrollments
    const isAdmin = req.user.roles.includes('ADMIN') || req.user.roles.includes('SUPERADMIN');

    // Get instructor's courses
    let courseIds = [];
    if (!isAdmin) {
      const instructorCourses = await Course.find({
        createdBy: req.user._id
      }).select('_id');

      if (instructorCourses.length === 0) {
        return sendSuccessResponse({
          res,
          status: httpStatus.OK,
          msg: "No courses found",
          data: [],
          pagination: { page: 1, limit: parseInt(limit), total: 0, totalPages: 0 },
          stats: { total: 0, active: 0, completed: 0, inactive: 0 },
          courses: []
        });
      }

      courseIds = instructorCourses.map(c => c._id);
    }

    // Build query
    let query = {};
    if (!isAdmin) {
      query.course = { $in: courseIds };
    }
    if (courseId) {
      query.course = courseId;
    }
    if (status && status !== 'all') {
      query.status = status;
    }

    // Get enrollments with populated data
    let enrollments = await Enrollment.find(query)
      .populate({
        path: 'student',
        select: 'firstname lastname email userImage phone'
      })
      .populate({
        path: 'course',
        select: 'courseTitle courseSlug price learn_type'
      })
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .lean();

    // Filter by search term (student name or email)
    if (search) {
      const searchLower = search.toLowerCase();
      enrollments = enrollments.filter(enrollment => {
        const studentName = enrollment.student
          ? `${enrollment.student.firstname || ''} ${enrollment.student.lastname || ''}`.toLowerCase()
          : '';
        const studentEmail = enrollment.student?.email?.toLowerCase() || '';
        const courseName = enrollment.course?.courseTitle?.toLowerCase() || '';
        return studentName.includes(searchLower) ||
               studentEmail.includes(searchLower) ||
               courseName.includes(searchLower);
      });
    }

    // Get total count before pagination
    const total = enrollments.length;

    // Apply pagination
    const paginatedEnrollments = enrollments.slice(skip, skip + parseInt(limit));

    // Get student progress for each enrollment
    const formattedStudents = await Promise.all(paginatedEnrollments.map(async (enrollment) => {
      // Calculate progress
      let progress = enrollment.progress || 0;
      let lastActive = enrollment.enrolledAt;

      // Try to get actual progress from lesson statuses
      if (enrollment.course) {
        const weeks = await Week.find({ course: enrollment.course._id });
        const weekIds = weeks.map(w => w._id);
        const lessons = await Lesson.find({ week: { $in: weekIds }, isActive: true });
        const lessonIds = lessons.map(l => l._id);

        if (lessonIds.length > 0) {
          const lessonStatuses = await LessonStatus.find({
            learner: enrollment.student?._id,
            lesson: { $in: lessonIds }
          });

          const completedLessons = lessonStatuses.filter(s => s.isCompleted).length;
          progress = lessons.length > 0 ? Math.round((completedLessons / lessons.length) * 100) : 0;

          // Get last activity
          if (lessonStatuses.length > 0) {
            const lastStatus = lessonStatuses.reduce((latest, current) => {
              const currentDate = current.lastAccessedAt || current.updatedAt;
              const latestDate = latest.lastAccessedAt || latest.updatedAt;
              return currentDate > latestDate ? current : latest;
            });
            lastActive = lastStatus.lastAccessedAt || lastStatus.updatedAt;
          }
        }
      }

      // Determine status based on progress and activity
      let studentStatus = enrollment.status || 'active';
      if (progress === 100) {
        studentStatus = 'completed';
      } else if (lastActive) {
        const daysSinceActive = Math.floor((Date.now() - new Date(lastActive).getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceActive > 14) {
          studentStatus = 'inactive';
        }
      }

      return {
        id: enrollment._id,
        studentId: enrollment.student?._id,
        name: enrollment.student
          ? `${enrollment.student.firstname || ''} ${enrollment.student.lastname || ''}`.trim()
          : 'Unknown Student',
        email: enrollment.student?.email || '',
        avatar: enrollment.student?.userImage || null,
        phone: enrollment.student?.phone || '',
        courseId: enrollment.course?._id,
        courseName: enrollment.course?.courseTitle || 'Unknown Course',
        courseSlug: enrollment.course?.courseSlug || '',
        progress,
        enrolledAt: enrollment.enrolledAt,
        lastActive,
        status: studentStatus,
        paymentAmount: enrollment.paymentAmount || 0,
        paymentMethod: enrollment.paymentMethod || 'free'
      };
    }));

    // Calculate stats for instructor's courses
    const allEnrollmentsQuery = isAdmin ? {} : { course: { $in: courseIds } };
    const allEnrollments = await Enrollment.find(allEnrollmentsQuery).lean();

    const stats = {
      total: allEnrollments.length,
      active: allEnrollments.filter(e => e.status === 'active').length,
      completed: allEnrollments.filter(e => e.status === 'completed').length,
      inactive: allEnrollments.filter(e => e.status !== 'active' && e.status !== 'completed').length
    };

    // Get instructor's courses for filter dropdown
    const coursesForFilter = isAdmin
      ? await Course.find({ status: 'published' }).select('_id courseTitle').lean()
      : await Course.find({ _id: { $in: courseIds } }).select('_id courseTitle').lean();

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: "Students retrieved successfully",
      data: formattedStudents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      },
      stats,
      courses: coursesForFilter.map(c => ({ id: c._id, name: c.courseTitle }))
    });

  } catch (err) {
    console.error('Get instructor students error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to get students.",
      err: err.message
    });
  }
};

// ======================= INSTRUCTOR ANALYTICS =======================
exports.getInstructorAnalytics = async (req, res) => {
  try {
    const instructorId = req.user._id;
    const now = new Date();

    // Get instructor's lecturer profile
    const lecturer = await Lecturer.findOne({ user: instructorId });

    // Get instructor's courses (either as lecturer or creator)
    let courseQuery = { createdBy: instructorId };
    if (lecturer) {
      courseQuery = {
        $or: [
          { lecturers: lecturer._id },
          { createdBy: instructorId }
        ]
      };
    }

    const courses = await Course.find(courseQuery).select('_id courseTitle price discount learn_type status').lean();

    const courseIds = courses.map(c => c._id);

    // Get all enrollments for instructor's courses
    const allEnrollments = await Enrollment.find({
      course: { $in: courseIds }
    }).populate('student', 'firstname lastname').lean();

    // Calculate course revenue
    const courseRevenue = allEnrollments.reduce((sum, e) => sum + (e.paymentAmount || 0), 0);

    // Get unique students
    const uniqueStudentIds = [...new Set(allEnrollments.map(e => e.student?._id?.toString()))];
    const totalCourseStudents = uniqueStudentIds.length;

    // Course performance data
    const coursePerformance = await Promise.all(courses.map(async (course) => {
      const courseEnrollments = allEnrollments.filter(e => e.course.toString() === course._id.toString());
      const revenue = courseEnrollments.reduce((sum, e) => sum + (e.paymentAmount || 0), 0);
      const completedCount = courseEnrollments.filter(e => e.status === 'completed').length;
      const avgProgress = courseEnrollments.length > 0
        ? Math.round(courseEnrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / courseEnrollments.length)
        : 0;

      return {
        id: course._id,
        title: course.courseTitle,
        status: course.status,
        students: courseEnrollments.length,
        revenue,
        completionRate: courseEnrollments.length > 0
          ? Math.round((completedCount / courseEnrollments.length) * 100)
          : 0,
        avgProgress
      };
    }));

    // Enrollment trends (last 7 days for chart)
    const trendDays = 7;
    const enrollmentTrends = [];
    for (let i = trendDays - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

      const count = allEnrollments.filter(e => {
        const enrolled = new Date(e.enrolledAt);
        return enrolled >= dayStart && enrolled < dayEnd;
      }).length;

      enrollmentTrends.push({
        date: dayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count
      });
    }

    // Get tutoring data
    let tutoringStats = { students: 0, sessions: 0, revenue: 0 };
    try {
      const TutoringEnrollment = require('../models/tutoringEnrollment.model');
      const TutoringSession = require('../models/tutoringSession.model');
      const TutoringPayment = require('../models/tutoringPayment.model');

      // Get all enrollments for this instructor (status is a virtual, can't query by it)
      const tutoringEnrollments = await TutoringEnrollment.find({
        instructor: instructorId,
        adminStatus: { $ne: 'cancelled' }
      });

      // Filter to active/trial enrollments using the virtual status
      const activeEnrollments = tutoringEnrollments.filter(e =>
        ['active', 'trial', 'pending', 'expired_grace'].includes(e.status)
      );

      const tutoringEnrollmentIds = tutoringEnrollments.map(e => e._id);
      const uniqueTutoringStudents = [...new Set(activeEnrollments.map(e => e.student?.toString()))];

      const sessionsCount = await TutoringSession.countDocuments({
        enrollment: { $in: tutoringEnrollmentIds },
        status: 'completed'
      });

      // Get revenue from ALL enrollments (not just active)
      const tutoringPayments = await TutoringPayment.aggregate([
        {
          $match: {
            enrollment: { $in: tutoringEnrollmentIds },
            status: 'approved'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]);

      tutoringStats = {
        students: uniqueTutoringStudents.length,
        sessions: sessionsCount,
        revenue: tutoringPayments[0]?.total || 0
      };
    } catch (err) {
      console.error('Tutoring stats error:', err);
      // Tutoring models may not exist, continue without tutoring stats
    }

    const totalStudents = totalCourseStudents + tutoringStats.students;
    const totalRevenue = courseRevenue + tutoringStats.revenue;

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      data: {
        stats: {
          totalStudents,
          courseStudents: totalCourseStudents,
          tutoringStudents: tutoringStats.students,
          courseRevenue,
          tutoringRevenue: tutoringStats.revenue,
          totalRevenue,
          totalCourses: courses.length,
          completedSessions: tutoringStats.sessions
        },
        courses: coursePerformance.sort((a, b) => b.revenue - a.revenue),
        enrollmentTrends
      },
      msg: "Analytics retrieved successfully."
    });

  } catch (err) {
    console.error('Get instructor analytics error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to get analytics.",
      err: err.message
    });
  }
};

const notifyAdminsAboutCourseRequest = async (course, creator) => {
  try {
    // Find all admin users
    const admins = await User.find({
      roles: { $in: ['ADMIN', 'SUPERADMIN'] }
    });

    // Send email notification to each admin
    for (const admin of admins) {
      try {
        await helper.sendCourseRequestNotification({
          adminEmail: admin.email,
          adminName: `${admin.firstname} ${admin.lastname}`,
          courseTitle: course.courseTitle,
          creatorName: `${creator.firstname} ${creator.lastname}`,
          creatorEmail: creator.email,
          courseId: course._id,
          dashboardLink: `${process.env.ADMIN_DASHBOARD_URI || process.env.FRONTEND_URI}/admin/courses/pending`
        });
      } catch (emailError) {
        console.error(`Failed to send notification to admin ${admin.email}:`, emailError);
      }
    }
  } catch (error) {
    console.error('Failed to notify admins:', error);
    throw error;
  }
};

// ======================= COURSE RATING =======================

/**
 * Rate a course (one-time only, no updates allowed)
 */
exports.rateCourse = async (req, res) => {
  try {
    const { slug } = req.params;
    const { rating } = req.body;
    const userId = req.user._id;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: 'Rating must be between 1 and 5',
      });
    }

    // Find course by slug
    const course = await Course.findOne({ courseSlug: slug });
    if (!course) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: 'Course not found',
      });
    }

    // Check if user is enrolled in the course
    const isEnrolled = course.learners.some(
      (learnerId) => learnerId.toString() === userId.toString()
    );

    if (!isEnrolled) {
      return sendErrorResponse({
        res,
        status: httpStatus.FORBIDDEN,
        msg: 'You must be enrolled in this course to rate it',
      });
    }

    // Check if user has already rated this course
    const existingRating = await CourseRating.findOne({
      user: userId,
      course: course._id,
    });

    if (existingRating) {
      return sendErrorResponse({
        res,
        status: httpStatus.CONFLICT,
        msg: 'You have already rated this course',
      });
    }

    // Create the rating
    const courseRating = await CourseRating.create({
      user: userId,
      course: course._id,
      rating: Math.round(rating), // Ensure integer
    });

    // Get updated stats
    const stats = await CourseRating.calculateAverageRating(course._id);

    return sendSuccessResponse({
      res,
      msg: 'Course rated successfully',
      data: {
        userRating: courseRating.rating,
        averageRating: stats.averageRating,
        totalRatings: stats.totalRatings,
      },
    });
  } catch (error) {
    console.error('Error rating course:', error);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to rate course',
    });
  }
};

/**
 * Get course rating stats and user's rating
 */
exports.getCourseRating = async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = req.user?._id;

    // Find course by slug
    const course = await Course.findOne({ courseSlug: slug });
    if (!course) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: 'Course not found',
      });
    }

    // Get rating stats
    const stats = await CourseRating.calculateAverageRating(course._id);

    // Get user's rating if logged in
    let userRating = null;
    if (userId) {
      const existingRating = await CourseRating.findOne({
        user: userId,
        course: course._id,
      });
      userRating = existingRating?.rating || null;
    }

    return sendSuccessResponse({
      res,
      data: {
        averageRating: stats.averageRating,
        totalRatings: stats.totalRatings,
        userRating,
        hasRated: userRating !== null,
      },
    });
  } catch (error) {
    console.error('Error getting course rating:', error);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to get course rating',
    });
  }
};