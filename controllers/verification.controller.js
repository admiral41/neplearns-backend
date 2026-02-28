const User = require("../models/user.model");
const Lecturer = require("../models/lecturer.model");
const httpStatus = require("http-status");
const helper = require("../helpers/mailer");
const { responseHandler } = require("../helpers/index");
const { sendErrorResponse, sendSuccessResponse } = responseHandler;

// ======================= GET PENDING LECTURER REQUESTS =======================
exports.getPendingLecturerRequests = async (req, res) => {
  try {
    const pendingRequests = await Lecturer.find({ 
      requestStatus: 'pending',
      isDeleted: false 
    })
    .populate({
      path: 'user',
      select: 'firstname lastname email phone dob gender address city province highestEducation universityCollege majorSpecialization teachingExperience employmentStatus preferredLevel subjects availability teachingMotivation'
    })
    .sort({ createdAt: -1 });

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      data: pendingRequests,
      msg: "Pending lecturer requests retrieved successfully."
    });

  } catch (err) {
    console.error('Get pending requests error:', err);
    return sendErrorResponse({ 
      res, 
      status: httpStatus.INTERNAL_SERVER_ERROR, 
      msg: "Failed to get pending requests.", 
      err: err.message 
    });
  }
};

// ======================= APPROVE/REJECT LECTURER REQUEST =======================
exports.processLecturerRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, rejectionReason } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.BAD_REQUEST, 
        msg: "Invalid action. Use 'approve' or 'reject'." 
      });
    }

    const lecturerRequest = await Lecturer.findById(id).populate('user');
    if (!lecturerRequest) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.NOT_FOUND, 
        msg: "Lecturer request not found." 
      });
    }

    const user = lecturerRequest.user;

    if (action === 'approve') {
      // Update user roles
      if (!user.roles.includes('LECTURER')) {
        user.roles.push('LECTURER');
      }
      
      // Update lecturer request
      lecturerRequest.requestStatus = 'approved';
      lecturerRequest.isActive = true;
      lecturerRequest.joinDate = Date.now();
      
      await user.save();
      await lecturerRequest.save();

      // Send approval email - FIXED FUNCTION NAME
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

      return sendSuccessResponse({
        res,
        status: httpStatus.OK,
        msg: "Lecturer request approved successfully.",
        data: {
          user: {
            id: user._id,
            name: `${user.firstname} ${user.lastname}`,
            email: user.email,
            roles: user.roles
          },
          lecturerRequest
        }
      });

    } else { // reject
      lecturerRequest.requestStatus = 'rejected';
      lecturerRequest.isActive = false;
      await lecturerRequest.save();

      // Send rejection email - FIXED FUNCTION NAME
      try {
        await helper.sendLecturerRejectionMail({  
          email: user.email,
          firstname: user.firstname, 
          lastname: user.lastname,   
          reason: rejectionReason || "Your application did not meet our current requirements."
        });
      } catch (emailError) {
        console.error('Failed to send rejection email:', emailError);
      }

      return sendSuccessResponse({
        res,
        status: httpStatus.OK,
        msg: "Lecturer request rejected.",
        data: {
          user: {
            id: user._id,
            name: `${user.firstname} ${user.lastname}`,
            email: user.email
          }
        }
      });
    }

  } catch (err) {
    console.error('Process lecturer request error:', err);
    return sendErrorResponse({ 
      res, 
      status: httpStatus.INTERNAL_SERVER_ERROR, 
      msg: "Failed to process lecturer request.", 
      err: err.message 
    });
  }
};

// ======================= GET ALL LECTURERS (APPROVED) =======================
exports.getAllLecturers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    
    const skip = (page - 1) * limit;
    
    let searchQuery = {
      requestStatus: 'approved',
      isActive: true,
      isDeleted: false
    };

    // Base query
    let query = Lecturer.find(searchQuery)
      .populate({
        path: 'user',
        select: 'firstname lastname email phone gender userImage highestEducation universityCollege majorSpecialization teachingExperience subjects'
      });

    // Apply search filter if provided
    if (search) {
      query = query.populate({
        path: 'user',
        match: {
          $or: [
            { firstname: { $regex: search, $options: 'i' } },
            { lastname: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { subjects: { $regex: search, $options: 'i' } }
          ]
        }
      });
    }

    const lecturers = await query
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    // Filter out null users after population
    const filteredLecturers = lecturers.filter(lecturer => lecturer.user !== null);

    const total = await Lecturer.countDocuments(searchQuery);

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      data: {
        lecturers: filteredLecturers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: filteredLecturers.length,
          totalPages: Math.ceil(total / limit)
        }
      },
      msg: "Lecturers retrieved successfully."
    });

  } catch (err) {
    console.error('Get all lecturers error:', err);
    return sendErrorResponse({ 
      res, 
      status: httpStatus.INTERNAL_SERVER_ERROR, 
      msg: "Failed to get lecturers.", 
      err: err.message 
    });
  }
};

// ======================= GET LECTURER BY ID =======================
exports.getLecturerById = async (req, res) => {
  try {
    const { id } = req.params;

    const lecturer = await Lecturer.findOne({
      _id: id,
      requestStatus: 'approved',
      isActive: true,
      isDeleted: false
    }).populate({
      path: 'user',
      select: 'firstname lastname email phone gender userImage highestEducation universityCollege majorSpecialization teachingExperience subjects availability teachingMotivation'
    });

    if (!lecturer) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "Lecturer not found."
      });
    }

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      data: lecturer,
      msg: "Lecturer retrieved successfully."
    });

  } catch (err) {
    console.error('Get lecturer by ID error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to get lecturer.",
      err: err.message
    });
  }
};