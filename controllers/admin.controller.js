const User = require("../models/user.model");
const Lecturer = require("../models/lecturer.model");
const Course = require("../models/course.model");
const Enrollment = require("../models/enrollment.model");
const TutoringRequest = require("../models/tutoringRequest.model");
const TutoringEnrollment = require("../models/tutoringEnrollment.model");
const TutoringSession = require("../models/tutoringSession.model");
const TutoringPayment = require("../models/tutoringPayment.model");
const httpStatus = require("http-status");

// Default platform fee percentage (15% for Neplearns Class) - used for course payments
// Tutoring payments use per-enrollment fee stored in TutoringEnrollment
const DEFAULT_PLATFORM_FEE_PERCENTAGE = 0.15;
const bcrypt = require("bcryptjs");
const { responseHandler, generator } = require("../helpers/index");
const { sendErrorResponse, sendSuccessResponse } = responseHandler;
const { generateRandomNum } = generator;
const helper = require("../helpers/mailer");
const { forceLogoutUser } = require('../socket/socketManager');

// ======================= DASHBOARD STATS =======================
exports.getDashboardStats = async (req, res) => {
  try {
    // Get date for "this month" calculations
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // User counts
    const [
      totalUsers,
      totalStudents,
      totalInstructors,
      newUsersThisMonth,
      suspendedUsers
    ] = await Promise.all([
      User.countDocuments({ roles: { $nin: ['SUPERADMIN'] } }),
      User.countDocuments({
        roles: { $in: ['LEARNER'], $nin: ['LECTURER', 'ADMIN', 'SUPERADMIN'] }
      }),
      User.countDocuments({ roles: { $in: ['LECTURER'] } }),
      User.countDocuments({
        roles: { $nin: ['SUPERADMIN'] },
        createdAt: { $gte: startOfMonth }
      }),
      User.countDocuments({
        roles: { $nin: ['SUPERADMIN'] },
        isSuspended: true
      })
    ]);

    // Course counts
    const [
      totalCourses,
      publishedCourses,
      pendingCourses,
      draftCourses
    ] = await Promise.all([
      Course.countDocuments({}),
      Course.countDocuments({ status: 'published' }),
      Course.countDocuments({ status: 'pending_approval' }),
      Course.countDocuments({ status: 'draft' })
    ]);

    // Pending instructor applications
    const pendingApplications = await Lecturer.countDocuments({
      requestStatus: 'pending'
    });

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      data: {
        users: {
          total: totalUsers,
          students: totalStudents,
          instructors: totalInstructors,
          newThisMonth: newUsersThisMonth,
          suspended: suspendedUsers
        },
        courses: {
          total: totalCourses,
          published: publishedCourses,
          pendingApproval: pendingCourses,
          draft: draftCourses
        },
        applications: {
          pending: pendingApplications
        }
      },
      msg: "Dashboard stats retrieved successfully."
    });

  } catch (err) {
    console.error('Get dashboard stats error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to get dashboard stats.",
      err: err.message
    });
  }
};

// ======================= GET ALL USERS =======================
exports.getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      role = 'all',
      status = 'all'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build query
    let query = {};

    // Exclude superadmins from list
    query.roles = { $nin: ['SUPERADMIN'] };

    // Role filter
    if (role === 'student') {
      query.roles = { $in: ['LEARNER'], $nin: ['LECTURER', 'ADMIN', 'SUPERADMIN'] };
    } else if (role === 'instructor') {
      query.roles = { $in: ['LECTURER'] };
    } else if (role === 'admin') {
      query.roles = { $in: ['ADMIN'] };
    }

    // Status filter
    if (status === 'active') {
      query.isSuspended = false;
    } else if (status === 'suspended') {
      query.isSuspended = true;
    }

    // Search filter
    if (search) {
      query.$or = [
        { firstname: { $regex: search, $options: 'i' } },
        { lastname: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .select('-hash -salt -verificationCode')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    // Get counts for tabs
    const studentCount = await User.countDocuments({
      roles: { $in: ['LEARNER'], $nin: ['LECTURER', 'ADMIN', 'SUPERADMIN'] }
    });
    const instructorCount = await User.countDocuments({
      roles: { $in: ['LECTURER'] }
    });

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        },
        counts: {
          total: studentCount + instructorCount,
          students: studentCount,
          instructors: instructorCount
        }
      },
      msg: "Users retrieved successfully."
    });

  } catch (err) {
    console.error('Get all users error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to get users.",
      err: err.message
    });
  }
};

// ======================= GET USER BY ID =======================
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('-hash -salt -verificationCode');

    if (!user) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "User not found."
      });
    }

    // If user is a lecturer, get lecturer details
    let lecturerDetails = null;
    if (user.roles.includes('LECTURER')) {
      lecturerDetails = await Lecturer.findOne({ user: id });
    }

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      data: {
        user,
        lecturerDetails
      },
      msg: "User retrieved successfully."
    });

  } catch (err) {
    console.error('Get user by ID error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to get user.",
      err: err.message
    });
  }
};

// ======================= UPDATE USER =======================
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstname, lastname, email, phone, address } = req.body;

    const user = await User.findById(id);

    if (!user) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "User not found."
      });
    }

    // Don't allow editing admins/superadmins
    if (user.roles.includes('ADMIN') || user.roles.includes('SUPERADMIN')) {
      return sendErrorResponse({
        res,
        status: httpStatus.FORBIDDEN,
        msg: "Cannot edit admin users."
      });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email, _id: { $ne: id } });
      if (existingUser) {
        return sendErrorResponse({
          res,
          status: httpStatus.CONFLICT,
          msg: "Email is already in use by another user."
        });
      }
    }

    // Update allowed fields
    if (firstname !== undefined) user.firstname = firstname;
    if (lastname !== undefined) user.lastname = lastname;
    if (email !== undefined) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;

    await user.save();

    // Return user without sensitive fields
    const updatedUser = await User.findById(id).select('-hash -salt -verificationCode');

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      data: { user: updatedUser },
      msg: "User updated successfully."
    });

  } catch (err) {
    console.error('Update user error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to update user.",
      err: err.message
    });
  }
};

// ======================= SUSPEND USER =======================
exports.suspendUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const user = await User.findById(id);

    if (!user) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "User not found."
      });
    }

    // Don't allow suspending admins
    if (user.roles.includes('ADMIN') || user.roles.includes('SUPERADMIN')) {
      return sendErrorResponse({
        res,
        status: httpStatus.FORBIDDEN,
        msg: "Cannot suspend admin users."
      });
    }

    user.isSuspended = true;
    await user.save();

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      data: { user },
      msg: "User suspended successfully."
    });

  } catch (err) {
    console.error('Suspend user error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to suspend user.",
      err: err.message
    });
  }
};

// ======================= ACTIVATE USER =======================
exports.activateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "User not found."
      });
    }

    user.isSuspended = false;
    await user.save();

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      data: { user },
      msg: "User activated successfully."
    });

  } catch (err) {
    console.error('Activate user error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to activate user.",
      err: err.message
    });
  }
};

// ======================= DELETE USER =======================
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "User not found."
      });
    }

    // Don't allow deleting admins
    if (user.roles.includes('ADMIN') || user.roles.includes('SUPERADMIN')) {
      return sendErrorResponse({
        res,
        status: httpStatus.FORBIDDEN,
        msg: "Cannot delete admin users."
      });
    }

    // Delete associated lecturer record if exists
    if (user.roles.includes('LECTURER')) {
      await Lecturer.findOneAndDelete({ user: id });
    }

    await User.findByIdAndDelete(id);

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: "User deleted successfully."
    });

  } catch (err) {
    console.error('Delete user error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to delete user.",
      err: err.message
    });
  }
};

// ======================= RESEND VERIFICATION EMAIL =======================
exports.resendVerificationEmail = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "User not found."
      });
    }

    if (user.isVerified) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: "User email is already verified."
      });
    }

    // Generate new verification code
    const verificationCode = generateRandomNum(100000, 999999);
    user.verificationCode = verificationCode;
    await user.save();

    // Send verification email
    const verificationLink = `${process.env.FRONTEND_URI}/verify-email/${user._id}/${verificationCode}`;

    await helper.sendVerificationMail({
      email: user.email,
      firstname: user.firstname,
      lastname: user.lastname,
      link: verificationLink,
      isLecturerApplicant: user.isLecturerApplicant || user.roles.includes('LECTURER')
    });

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: `Verification email resent to ${user.email}`
    });

  } catch (err) {
    console.error('Resend verification email error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to resend verification email.",
      err: err.message
    });
  }
};

// ======================= ENROLLMENTS =======================
exports.getAllEnrollments = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      courseId = '',
      status = '',
      paymentStatus = '',
      paymentMethod = '',
      startDate = '',
      endDate = '',
      sortBy = 'enrolledAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build query
    let query = {};

    if (status) {
      query.status = status;
    }

    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }

    if (courseId) {
      query.course = courseId;
    }

    // Date range filter
    if (startDate || endDate) {
      query.enrolledAt = {};
      if (startDate) {
        query.enrolledAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.enrolledAt.$lte = end;
      }
    }

    // Get enrollments with search in populated fields
    let enrollments = await Enrollment.find(query)
      .populate({
        path: 'student',
        select: 'firstname lastname email userImage phone'
      })
      .populate({
        path: 'course',
        select: 'courseTitle courseSlug price learn_type finalPrice courseImage'
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

    // Format response
    const formattedEnrollments = paginatedEnrollments.map(enrollment => ({
      id: enrollment._id,
      studentId: enrollment.student?._id,
      studentName: enrollment.student
        ? `${enrollment.student.firstname || ''} ${enrollment.student.lastname || ''}`.trim()
        : 'Unknown Student',
      studentEmail: enrollment.student?.email || '',
      studentAvatar: enrollment.student?.userImage || null,
      studentPhone: enrollment.student?.phone || '',
      courseId: enrollment.course?._id,
      courseName: enrollment.course?.courseTitle || 'Unknown Course',
      courseSlug: enrollment.course?.courseSlug || '',
      courseImage: enrollment.course?.courseImage || null,
      courseType: enrollment.course?.learn_type || 'FREE',
      enrolledAt: enrollment.enrolledAt,
      status: enrollment.status,
      progress: enrollment.progress || 0,
      paymentAmount: enrollment.paymentAmount || 0,
      paymentMethod: enrollment.paymentMethod || 'free',
      paymentStatus: enrollment.paymentStatus || 'completed',
      transactionId: enrollment.transactionId || null,
      completedAt: enrollment.completedAt || null
    }));

    // Calculate stats
    const allEnrollments = await Enrollment.find({}).lean();
    const stats = {
      total: allEnrollments.length,
      active: allEnrollments.filter(e => e.status === 'active').length,
      completed: allEnrollments.filter(e => e.status === 'completed').length,
      dropped: allEnrollments.filter(e => e.status === 'dropped').length,
      totalRevenue: allEnrollments.reduce((sum, e) => sum + (e.paymentAmount || 0), 0),
      freeEnrollments: allEnrollments.filter(e => e.paymentMethod === 'free').length,
      paidEnrollments: allEnrollments.filter(e => e.paymentMethod !== 'free').length
    };

    return res.status(200).json({
      status: 200,
      success: true,
      msg: "Enrollments retrieved successfully",
      data: formattedEnrollments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      },
      stats
    });

  } catch (err) {
    console.error('Get all enrollments error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to get enrollments.",
      err: err.message
    });
  }
};

// Get enrollment by ID
exports.getEnrollmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const enrollment = await Enrollment.findById(id)
      .populate({
        path: 'student',
        select: 'firstname lastname email userImage phone createdAt'
      })
      .populate({
        path: 'course',
        select: 'courseTitle courseSlug price learn_type finalPrice courseImage createdBy',
        populate: {
          path: 'createdBy',
          select: 'firstname lastname email'
        }
      });

    if (!enrollment) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "Enrollment not found."
      });
    }

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: "Enrollment retrieved successfully",
      data: enrollment
    });

  } catch (err) {
    console.error('Get enrollment by ID error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to get enrollment.",
      err: err.message
    });
  }
};

// Update enrollment status
exports.updateEnrollmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, progress } = req.body;

    const enrollment = await Enrollment.findById(id);

    if (!enrollment) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "Enrollment not found."
      });
    }

    if (status) {
      enrollment.status = status;
      if (status === 'completed') {
        enrollment.completedAt = new Date();
      }
    }

    if (progress !== undefined) {
      enrollment.progress = progress;
    }

    await enrollment.save();

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: "Enrollment updated successfully",
      data: enrollment
    });

  } catch (err) {
    console.error('Update enrollment error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to update enrollment.",
      err: err.message
    });
  }
};

// Get enrollment stats
exports.getEnrollmentStats = async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get all enrollments
    const allEnrollments = await Enrollment.find({}).lean();
    const recentEnrollments = allEnrollments.filter(e => new Date(e.enrolledAt) >= startDate);

    // Daily enrollment trend
    const dailyTrend = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const count = recentEnrollments.filter(e => {
        const enrollDate = new Date(e.enrolledAt);
        return enrollDate >= date && enrollDate < nextDate;
      }).length;

      dailyTrend.push({
        date: date.toISOString().split('T')[0],
        count
      });
    }

    // Payment method breakdown
    const paymentMethodBreakdown = {
      free: allEnrollments.filter(e => e.paymentMethod === 'free').length,
      esewa: allEnrollments.filter(e => e.paymentMethod === 'esewa').length,
      khalti: allEnrollments.filter(e => e.paymentMethod === 'khalti').length,
      bank_transfer: allEnrollments.filter(e => e.paymentMethod === 'bank_transfer').length,
      cash: allEnrollments.filter(e => e.paymentMethod === 'cash').length,
      other: allEnrollments.filter(e => e.paymentMethod === 'other').length
    };

    // Status breakdown
    const statusBreakdown = {
      active: allEnrollments.filter(e => e.status === 'active').length,
      completed: allEnrollments.filter(e => e.status === 'completed').length,
      dropped: allEnrollments.filter(e => e.status === 'dropped').length,
      expired: allEnrollments.filter(e => e.status === 'expired').length
    };

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: "Enrollment stats retrieved successfully",
      data: {
        total: allEnrollments.length,
        recentCount: recentEnrollments.length,
        totalRevenue: allEnrollments.reduce((sum, e) => sum + (e.paymentAmount || 0), 0),
        recentRevenue: recentEnrollments.reduce((sum, e) => sum + (e.paymentAmount || 0), 0),
        averageProgress: allEnrollments.length > 0
          ? Math.round(allEnrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / allEnrollments.length)
          : 0,
        dailyTrend,
        paymentMethodBreakdown,
        statusBreakdown
      }
    });

  } catch (err) {
    console.error('Get enrollment stats error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to get enrollment stats.",
      err: err.message
    });
  }
};

// Get courses for filter dropdown
exports.getCoursesForFilter = async (req, res) => {
  try {
    const courses = await Course.find({ status: 'approved' })
      .select('_id courseTitle courseSlug')
      .sort({ courseTitle: 1 })
      .lean();

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: "Courses retrieved successfully",
      data: courses
    });

  } catch (err) {
    console.error('Get courses for filter error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to get courses.",
      err: err.message
    });
  }
};

// ======================= RESET USER PASSWORD =======================
/**
 * Generate a secure temporary password with at least:
 * - 1 uppercase letter
 * - 1 lowercase letter
 * - 1 number
 * - 1 special character
 * @returns {string} 12-character temporary password
 */
const generateTempPassword = () => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*';
  const all = uppercase + lowercase + numbers + special;

  // Ensure at least one of each type
  let password = '';
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Fill remaining characters
  for (let i = 4; i < 12; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }

  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

exports.resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "User not found."
      });
    }

    // Don't allow resetting password for admins/superadmins
    if (user.roles.includes('ADMIN') || user.roles.includes('SUPERADMIN')) {
      return sendErrorResponse({
        res,
        status: httpStatus.FORBIDDEN,
        msg: "Cannot reset password for admin users."
      });
    }

    // Generate temporary password
    const tempPassword = generateTempPassword();

    // Hash the temporary password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(tempPassword, salt);

    // Update user: set new password hash, increment tokenVersion (invalidates all sessions), set forcePasswordReset flag
    user.hash = hash;
    user.salt = salt;
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    user.forcePasswordReset = true;
    await user.save();

    // Force logout user from all connected sessions via Socket.IO
    const userIdStr = user._id.toString();
    forceLogoutUser(userIdStr, 'password_changed', {
      message: 'Your password has been reset by an administrator.'
    });

    // Send email with temporary password
    let emailSent = false;
    try {
      await helper.sendAdminPasswordResetMail({
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        tempPassword: tempPassword,
        loginLink: `${process.env.FRONTEND_URI}/login`
      });
      emailSent = true;
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
    }

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      data: {
        tempPassword,
        emailSent,
        user: {
          id: user._id,
          email: user.email,
          firstname: user.firstname,
          lastname: user.lastname
        }
      },
      msg: emailSent
        ? `Password reset successfully. Temporary password sent to ${user.email}.`
        : "Password reset successfully. Email delivery failed - please provide the temporary password manually."
    });

  } catch (err) {
    console.error('Reset user password error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to reset user password.",
      err: err.message
    });
  }
};

// ======================= TUTORING METRICS =======================
exports.getTutoringMetrics = async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

    // Run all count queries in parallel for efficiency
    const [
      pendingRequests,
      activeSubscriptions,
      todaySessions,
      upcomingSessions
    ] = await Promise.all([
      // Pending tutoring requests
      TutoringRequest.countDocuments({ status: 'pending' }),

      // Active subscriptions (virtual status 'trial' or 'active')
      // Since status is virtual, we need to query by underlying conditions
      TutoringEnrollment.countDocuments({
        adminStatus: 'active',
        $or: [
          // Trial period (trialEndsAt > now)
          { trialEndsAt: { $gt: now } },
          // Active subscription (currentPeriodEnd > now)
          { currentPeriodEnd: { $gt: now } }
        ]
      }),

      // Today's sessions (scheduled for today, not cancelled)
      TutoringSession.countDocuments({
        scheduledAt: { $gte: startOfToday, $lt: endOfToday },
        status: { $ne: 'cancelled' }
      }),

      // Upcoming sessions (scheduled after now, not cancelled)
      TutoringSession.countDocuments({
        scheduledAt: { $gt: now },
        status: { $ne: 'cancelled' }
      })
    ]);

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      data: {
        pendingRequests,
        activeSubscriptions,
        todaySessions,
        upcomingSessions
      },
      msg: "Tutoring metrics retrieved successfully."
    });

  } catch (err) {
    console.error('Get tutoring metrics error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to get tutoring metrics.",
      err: err.message
    });
  }
};

// ======================= GET ALL SESSIONS (ADMIN) =======================
exports.getAllSessions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      status = '',
      date = '' // 'today', 'thisWeek', or empty for all
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const now = new Date();

    // Build query
    let query = {};

    // Status filter
    if (status && status !== 'all') {
      query.status = status;
    }

    // Date filter
    if (date === 'today') {
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
      query.scheduledAt = { $gte: startOfToday, $lt: endOfToday };
    } else if (date === 'thisWeek') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);
      query.scheduledAt = { $gte: startOfWeek, $lt: endOfWeek };
    }

    // Get sessions with populated fields
    let sessions = await TutoringSession.find(query)
      .populate({
        path: 'student',
        select: 'firstname lastname email userImage'
      })
      .populate({
        path: 'instructor',
        select: 'firstname lastname email userImage'
      })
      .populate({
        path: 'subject',
        select: 'name'
      })
      .sort({ scheduledAt: -1 })
      .lean();

    // Filter by search term (student or instructor name)
    if (search) {
      const searchLower = search.toLowerCase();
      sessions = sessions.filter(session => {
        const studentName = session.student
          ? `${session.student.firstname || ''} ${session.student.lastname || ''}`.toLowerCase()
          : '';
        const instructorName = session.instructor
          ? `${session.instructor.firstname || ''} ${session.instructor.lastname || ''}`.toLowerCase()
          : '';
        return studentName.includes(searchLower) || instructorName.includes(searchLower);
      });
    }

    // Get total count before pagination
    const total = sessions.length;

    // Apply pagination
    const paginatedSessions = sessions.slice(skip, skip + parseInt(limit));

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      data: {
        sessions: paginatedSessions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      },
      msg: "Sessions retrieved successfully."
    });

  } catch (err) {
    console.error('Get all sessions error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to get sessions.",
      err: err.message
    });
  }
};

// ======================= PAYMENTS =======================

/**
 * Get all payments (combined course enrollments and tutoring payments)
 * GET /admin/payments
 */
exports.getAllPayments = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      status = 'all',
      method = 'all',
      type = 'all', // 'course', 'tutoring', or 'all'
      startDate = '',
      endDate = ''
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build date query
    let dateQuery = {};
    if (startDate || endDate) {
      dateQuery = {};
      if (startDate) {
        dateQuery.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateQuery.$lte = end;
      }
    }

    let allPayments = [];

    // Get course enrollment payments (paid courses only)
    if (type === 'all' || type === 'course') {
      let courseQuery = { paymentMethod: { $ne: 'free' }, paymentAmount: { $gt: 0 } };
      if (Object.keys(dateQuery).length > 0) {
        courseQuery.enrolledAt = dateQuery;
      }
      if (status !== 'all') {
        courseQuery.paymentStatus = status;
      }
      if (method !== 'all') {
        courseQuery.paymentMethod = method;
      }

      const coursePayments = await Enrollment.find(courseQuery)
        .populate('student', 'firstname lastname email')
        .populate('course', 'courseTitle courseSlug')
        .sort({ enrolledAt: -1 })
        .lean();

      // Transform to unified format
      const transformedCoursePayments = coursePayments.map(p => ({
        _id: p._id,
        type: 'course',
        user: {
          _id: p.student?._id,
          name: p.student ? `${p.student.firstname} ${p.student.lastname}` : 'Unknown',
          email: p.student?.email || ''
        },
        item: {
          _id: p.course?._id,
          title: p.course?.courseTitle || 'Unknown Course',
          slug: p.course?.courseSlug
        },
        amount: p.paymentAmount,
        platformFeePercentage: DEFAULT_PLATFORM_FEE_PERCENTAGE * 100,
        platformFee: Math.round(p.paymentAmount * DEFAULT_PLATFORM_FEE_PERCENTAGE),
        instructorShare: Math.round(p.paymentAmount * (1 - DEFAULT_PLATFORM_FEE_PERCENTAGE)),
        method: p.paymentMethod,
        status: p.paymentStatus,
        transactionId: p.transactionId,
        date: p.enrolledAt
      }));

      allPayments = [...allPayments, ...transformedCoursePayments];
    }

    // Get tutoring payments
    if (type === 'all' || type === 'tutoring') {
      let tutoringQuery = {};
      if (Object.keys(dateQuery).length > 0) {
        tutoringQuery.createdAt = dateQuery;
      }
      if (status !== 'all') {
        // Map status: tutoring uses 'pending', 'approved', 'rejected'
        const statusMap = { completed: 'approved', pending: 'pending', failed: 'rejected' };
        tutoringQuery.status = statusMap[status] || status;
      }
      if (method !== 'all') {
        tutoringQuery.paymentMethod = method;
      }

      const tutoringPayments = await TutoringPayment.find(tutoringQuery)
        .populate('student', 'firstname lastname email')
        .populate({
          path: 'enrollment',
          select: 'subject platformFeePercentage',
          populate: { path: 'subject', select: 'name' }
        })
        .sort({ createdAt: -1 })
        .lean();

      // Transform to unified format using per-enrollment fee
      const transformedTutoringPayments = tutoringPayments.map(p => {
        const feePercentage = (p.enrollment?.platformFeePercentage ?? 15) / 100;
        return {
          _id: p._id,
          type: 'tutoring',
          user: {
            _id: p.student?._id,
            name: p.student ? `${p.student.firstname} ${p.student.lastname}` : 'Unknown',
            email: p.student?.email || ''
          },
          item: {
            _id: p.enrollment?.subject?._id,
            title: p.enrollment?.subject?.name ? `Tutoring: ${p.enrollment.subject.name}` : 'Tutoring Session',
            slug: null
          },
          amount: p.amount,
          platformFeePercentage: feePercentage * 100,
          platformFee: Math.round(p.amount * feePercentage),
          instructorShare: Math.round(p.amount * (1 - feePercentage)),
          method: p.paymentMethod,
          status: p.status === 'approved' ? 'completed' : p.status === 'rejected' ? 'failed' : 'pending',
          transactionId: null,
          date: p.createdAt
        };
      });

      allPayments = [...allPayments, ...transformedTutoringPayments];
    }

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      allPayments = allPayments.filter(p =>
        p.user.name.toLowerCase().includes(searchLower) ||
        p.user.email.toLowerCase().includes(searchLower) ||
        p._id.toString().toLowerCase().includes(searchLower) ||
        (p.transactionId && p.transactionId.toLowerCase().includes(searchLower))
      );
    }

    // Sort by date descending
    allPayments.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Total before pagination
    const total = allPayments.length;

    // Apply pagination
    const paginatedPayments = allPayments.slice(skip, skip + parseInt(limit));

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      data: {
        payments: paginatedPayments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      },
      msg: "Payments retrieved successfully."
    });

  } catch (err) {
    console.error('Get all payments error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to get payments.",
      err: err.message
    });
  }
};

/**
 * Get payment statistics
 * GET /admin/payments/stats
 */
exports.getPaymentStats = async (req, res) => {
  try {
    const { period = '7days' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate;
    let days;

    switch (period) {
      case '30days':
        days = 30;
        break;
      case '90days':
        days = 90;
        break;
      case '7days':
      default:
        days = 7;
    }

    startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Get course enrollment payments
    const coursePayments = await Enrollment.find({
      paymentMethod: { $ne: 'free' },
      paymentAmount: { $gt: 0 }
    }).lean();

    const recentCoursePayments = coursePayments.filter(
      p => new Date(p.enrolledAt) >= startDate
    );

    // Get tutoring payments with enrollment fee
    const tutoringPayments = await TutoringPayment.find({
      status: 'approved'
    })
      .populate('enrollment', 'platformFeePercentage')
      .lean();

    const recentTutoringPayments = tutoringPayments.filter(
      p => new Date(p.createdAt) >= startDate
    );

    // Calculate totals
    const courseTotal = coursePayments
      .filter(p => p.paymentStatus === 'completed')
      .reduce((sum, p) => sum + (p.paymentAmount || 0), 0);

    const tutoringTotal = tutoringPayments
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    // Calculate platform earnings using per-enrollment fees for tutoring
    const coursePlatformEarnings = Math.round(courseTotal * DEFAULT_PLATFORM_FEE_PERCENTAGE);
    const tutoringPlatformEarnings = tutoringPayments.reduce((sum, p) => {
      const feePercentage = (p.enrollment?.platformFeePercentage ?? 15) / 100;
      return sum + Math.round((p.amount || 0) * feePercentage);
    }, 0);

    const totalRevenue = courseTotal + tutoringTotal;
    const platformEarnings = coursePlatformEarnings + tutoringPlatformEarnings;

    // Recent totals
    const recentCourseTotal = recentCoursePayments
      .filter(p => p.paymentStatus === 'completed')
      .reduce((sum, p) => sum + (p.paymentAmount || 0), 0);

    const recentTutoringTotal = recentTutoringPayments
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    // Calculate recent platform earnings using per-enrollment fees for tutoring
    const recentCoursePlatformEarnings = Math.round(recentCourseTotal * DEFAULT_PLATFORM_FEE_PERCENTAGE);
    const recentTutoringPlatformEarnings = recentTutoringPayments.reduce((sum, p) => {
      const feePercentage = (p.enrollment?.platformFeePercentage ?? 15) / 100;
      return sum + Math.round((p.amount || 0) * feePercentage);
    }, 0);

    const recentTotalRevenue = recentCourseTotal + recentTutoringTotal;
    const recentPlatformEarnings = recentCoursePlatformEarnings + recentTutoringPlatformEarnings;

    // Pending amounts
    const pendingCourse = coursePayments
      .filter(p => p.paymentStatus === 'pending')
      .reduce((sum, p) => sum + (p.paymentAmount || 0), 0);

    const pendingTutoring = await TutoringPayment.find({ status: 'pending' }).lean();
    const pendingTutoringTotal = pendingTutoring.reduce((sum, p) => sum + (p.amount || 0), 0);

    const pendingAmount = pendingCourse + pendingTutoringTotal;

    // Transaction counts
    const completedTransactions = recentCoursePayments.filter(p => p.paymentStatus === 'completed').length
      + recentTutoringPayments.length;

    // Daily chart data
    const chartData = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

      // Sum course payments for this day
      const dayCourseAmount = coursePayments
        .filter(p => {
          const pDate = new Date(p.enrolledAt);
          return pDate >= date && pDate < nextDate && p.paymentStatus === 'completed';
        })
        .reduce((sum, p) => sum + (p.paymentAmount || 0), 0);

      // Sum tutoring payments for this day
      const dayTutoringAmount = tutoringPayments
        .filter(p => {
          const pDate = new Date(p.createdAt);
          return pDate >= date && pDate < nextDate;
        })
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      chartData.push({
        day: dayName,
        date: date.toISOString().split('T')[0],
        amount: dayCourseAmount + dayTutoringAmount
      });
    }

    // Payment method breakdown
    const methodBreakdown = {};
    const methods = ['esewa', 'khalti', 'bank_transfer', 'cash', 'other'];

    for (const method of methods) {
      const courseAmount = coursePayments
        .filter(p => p.paymentMethod === method && p.paymentStatus === 'completed')
        .reduce((sum, p) => sum + (p.paymentAmount || 0), 0);

      const courseCount = coursePayments
        .filter(p => p.paymentMethod === method && p.paymentStatus === 'completed').length;

      const tutoringAmount = tutoringPayments
        .filter(p => p.paymentMethod === method)
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      const tutoringCount = tutoringPayments.filter(p => p.paymentMethod === method).length;

      methodBreakdown[method] = {
        amount: courseAmount + tutoringAmount,
        count: courseCount + tutoringCount
      };
    }

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      data: {
        summary: {
          totalRevenue,
          platformEarnings,
          pendingAmount,
          completedTransactions,
          defaultPlatformFeePercentage: DEFAULT_PLATFORM_FEE_PERCENTAGE * 100
        },
        recent: {
          revenue: recentTotalRevenue,
          platformEarnings: recentPlatformEarnings,
          transactions: completedTransactions
        },
        chartData,
        methodBreakdown,
        period
      },
      msg: "Payment stats retrieved successfully."
    });

  } catch (err) {
    console.error('Get payment stats error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to get payment stats.",
      err: err.message
    });
  }
};
