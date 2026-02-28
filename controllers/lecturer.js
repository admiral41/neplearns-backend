const httpStatus = require('http-status')
const Lecturer = require('../models/lecturer.model')
const User = require('../models/user.model')
const { responseHandler } = require('../helpers/index')
const Course = require('../models/courses')
const Week = require('../models/weeks')
const Lesson = require('../models/lessons')
const upload = require('../middlewares/multer')
const helper = require('../helpers/mailer')
const notificationService = require('../services/notificationService')
const { parseFilters, sendErrorResponse, sendQueryResponse, sendSuccessResponse } = responseHandler

const uploadFile = upload.any()

exports.getLecturerDetail = async (req, res, next) => {
  try {
    let id = req.params.id
    let user = await User.findOne({ _id: id })
    if (!user.roles.includes('LECTURER')) {
      return sendErrorResponse({ res, status: httpStatus.CONFLICT, msg: 'Unauthorized' })
    }

    let lecturer = await Lecturer.findOne({ user: id, requestStatus: { $in: ['approved', null] }, isActive: true }).populate([
      {
        path: 'user',
        select: 'firstname lastname email roles userImage gender',
      },
    ])
    
    let courses = await Course.find({ lecturers: lecturer._id })
    let summary = {
      courseCount: courses.length,
      lessonCount: 0,
      learnerCount: 0,
    }
    let weeks = []
    await Promise.all(
      courses.map(async c => {
        let result = await Week.distinct('_id', { course: c._id })
        weeks = weeks.concat(result)
        summary.learnerCount += c.learners.length
      })
    )
    summary.lessonCount = await Lesson.countDocuments({ week: { $in: weeks } })
    lecturer = lecturer.toJSON()
    lecturer['courses'] = courses
    lecturer['summary'] = summary
    return sendSuccessResponse({ res, status: httpStatus.OK, data: lecturer })
  } catch (error) {
    console.log(error)
    return sendErrorResponse({ res, status: httpStatus.INTERNAL_SERVER_ERROR, msg: 'Failed to get lecturer', err: error.message })
  }
}

exports.createLecturerAccount = async (req, res, next) => {
  try {
    if (req.user.roles.includes('LECTURER')) {
      return sendErrorResponse({ res, status: httpStatus.CONFLICT, msg: 'lecturer account already exist' })
    }
    uploadFile(req, res, async err => {
      if (err) {
        return sendErrorResponse({ res, status: httpStatus.INTERNAL_SERVER_ERROR, msg: 'Failed to upload Image.' })
      }
      req.body.user = req.user._id
      req.body.academicHistory = []

      await Promise.all(
        req.files.map((value, index) => {
          switch (value.fieldname) {
            case 'panCardImage':
              req.body.panCardImage = value.path
              break
            case 'recommendation':
              req.body.recommendation = value.path
              break
            case 'citizenshipImage':
              req.body.citizenshipImage = value.path
              break
            case 'cv':
              req.body.cv = value.path
              break
            case 'academicHistory':
              req.body.academicHistory.push(value.path)
              break
          }
        })
      )

      let lecturer = new Lecturer(req.body)
      await Lecturer.create(lecturer)
      await lecturer.populate({ path: 'user', select: 'firstname lastname email userImage' })

      return sendSuccessResponse({ res, status: httpStatus.OK, data: lecturer })
    })
  } catch (error) {
    return sendErrorResponse({ res, status: httpStatus.INTERNAL_SERVER_ERROR, msg: 'Failed to get lecturer', err: error.message })
  }
}

// In lecturer.controller.js - FIXED
exports.verification = async (req, res, next) => {
  try {
    const lecturerRequest = await Lecturer.findById(req.params.id).populate('user');
    if (lecturerRequest == null) {
      return sendErrorResponse({ res, status: httpStatus.NOT_FOUND, msg: 'Request not found!' });
    }

    const user = lecturerRequest.user;
    
    if (req.body.request == 'rejected') {
      // REJECTION
      lecturerRequest.requestStatus = 'rejected';
      lecturerRequest.isActive = false;
      await lecturerRequest.save();

      // Send rejection email
      try {
        await helper.sendLecturerRejectionMail({
          email: user.email,
          firstname: user.firstname,
          lastname: user.lastname,
          reason: req.body.reason || 'Your application did not meet our current requirements.'
        });
      } catch (emailError) {
        console.error('Failed to send rejection email:', emailError);
      }

      // Send real-time + push notification to lecturer
      try {
        await notificationService.notifyLecturerRejected(user, req.body.reason);
      } catch (notifyError) {
        console.error('Failed to send rejection notification:', notifyError);
      }

      return sendSuccessResponse({
        res,
        status: httpStatus.OK,
        msg: 'Lecturer request rejected. Notification email sent.'
      });
    }

    // APPROVAL
    if (req.body.request !== 'approved') {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.BAD_REQUEST, 
        msg: 'Invalid request type. Use "approved" or "rejected".' 
      });
    }

    // Update lecturer request
    lecturerRequest.requestStatus = 'approved';
    lecturerRequest.isActive = true;
    lecturerRequest.joinDate = Date.now();
    await lecturerRequest.save();

    // Update user roles (add LECTURER role)
    if (!user.roles.includes('LECTURER')) {
      user.roles = user.roles.concat('LECTURER');
      await user.save();
    }

    // Send approval email
    try {
      await helper.sendLecturerApprovalMail({
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        loginLink: `${process.env.FRONTEND_URI}/login`,
        dashboardLink: `${process.env.FRONTEND_URI}/instructor-dashboard`
      });
    } catch (emailError) {
      console.error('Failed to send approval email:', emailError);
    }

    // Send real-time + push notification to lecturer
    try {
      await notificationService.notifyLecturerApproved(user);
    } catch (notifyError) {
      console.error('Failed to send approval notification:', notifyError);
    }

    return sendSuccessResponse({ 
      res, 
      status: httpStatus.OK, 
      msg: 'Lecturer request approved. Notification email sent.',
      data: {
        lecturerId: lecturerRequest._id,
        user: {
          id: user._id,
          email: user.email,
          name: `${user.firstname} ${user.lastname}`,
          roles: user.roles
        }
      }
    });
  } catch (error) {
    console.error('Verification error:', error);
    return sendErrorResponse({ 
      res, 
      status: httpStatus.INTERNAL_SERVER_ERROR, 
      msg: 'Failed to process lecturer request!', 
      err: error.message 
    });
  }
};

exports.getLecturers = async (req, res, next) => {
  try {
    let { page, size, sortQuery, searchQuery, selectQuery, populate } = parseFilters(req)

    searchQuery = {
      ...searchQuery,
      requestStatus: 'approved',
      isDeleted: false,
    }

    populate = [
      {
        path: 'user',
        select: '_id firstname lastname email contact userImage',
      },
    ]
    const result = await sendQueryResponse({
      model: Lecturer,
      page,
      size,
      sortQuery,
      searchQuery,
      selectQuery,
      populate,
    })

    return sendSuccessResponse({ res, status: httpStatus.OK, data: result.data })
  } catch (error) {
    console.log(error)
    return sendErrorResponse({ res, status: httpStatus['100_MESSAGE'], msg: 'Failed to get lecturer', err: error.message })
  }
}

exports.getPendingRequest = async (req, res) => {
  try {
    let lecturer = await Lecturer.find({ requestStatus: 'pending', isDeleted: 'false' }).populate({
      path: 'user',
      select: 'firstname lastname email userImage',
    })

    return sendSuccessResponse({ res, status: httpStatus.OK, data: lecturer })
  } catch (error) {
    console.log(error)
    return sendErrorResponse({ res, status: httpStatus.INTERNAL_SERVER_ERROR, msg: error.message })
  }
}

exports.updateLecturerStatus = async (req, res, next) => {
  try {
    const lecturer = await Lecturer.findById(req.params.id).populate({ 
      path: 'user', 
      select: 'firstname lastname email userImage' 
    });
    
    lecturer.isActive = !lecturer.isActive;
    await lecturer.save();

    // Send status update email
    try {
      if (lecturer.isActive) {
        await helper.sendLecturerStatusMail({
          email: lecturer.user.email,
          firstname: lecturer.user.firstname,
          lastname: lecturer.user.lastname,
          status: 'activated',
          message: 'Your lecturer account has been activated. You can now access all lecturer features.'
        });
      } else {
        await helper.sendLecturerStatusMail({
          email: lecturer.user.email,
          firstname: lecturer.user.firstname,
          lastname: lecturer.user.lastname,
          status: 'deactivated',
          message: 'Your lecturer account has been deactivated. Please contact administrator for more information.'
        });
      }
    } catch (emailError) {
      console.error('Failed to send status email:', emailError);
    }

    return sendSuccessResponse({ 
      res, 
      status: httpStatus.OK, 
      msg: `Lecturer ${lecturer.isActive ? 'activated' : 'deactivated'} successfully.`,
      data: { lecturer } 
    });
  } catch (error) {
    console.log(error)
    return sendErrorResponse({ res, status: httpStatus.INTERNAL_SERVER_ERROR, msg: 'Failed to update lecturer!', err: error.message })
  }
}

exports.deleteLecturer = async (req, res, next) => {
  try {
    let lecturer = await Lecturer.findByIdAndUpdate(
      req.params.id, 
      { isDeleted: true, isActive: false }, 
      { new: true }
    ).populate('user');
    
    await User.findByIdAndUpdate(
      { _id: lecturer.user._id }, 
      { $pull: { roles: 'LECTURER' } }, 
      { new: true }
    );

    // Send deletion notification email
    try {
      await helper.sendLecturerDeletionMail({
        email: lecturer.user.email,
        firstname: lecturer.user.firstname,
        lastname: lecturer.user.lastname,
        message: 'Your lecturer account has been removed from the system.'
      });
    } catch (emailError) {
      console.error('Failed to send deletion email:', emailError);
    }

    return sendSuccessResponse({ 
      res, 
      status: httpStatus.OK, 
      msg: 'Lecturer Deleted. Notification email sent.' 
    });
  } catch (error) {
    return sendErrorResponse({ 
      res, 
      status: httpStatus.INTERNAL_SERVER_ERROR, 
      msg: 'Failed to delete lecturer!', 
      err: error.message 
    });
  }
}