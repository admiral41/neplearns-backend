const User = require("../models/user.model");
const Course = require("../models/course.model");
const httpStatus = require("http-status");
const { responseHandler } = require("../helpers/index");
const { sendErrorResponse, sendSuccessResponse } = responseHandler;

// ======================= GET STUDENT PROFILE =======================
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-hash -salt -verificationCode -resetPasswordToken -resetPasswordExpires -__v')
      .lean();

    if (!user) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "User not found."
      });
    }

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      data: user,
      msg: "Profile retrieved successfully."
    });
  } catch (err) {
    console.error('Get student profile error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to get profile.",
      err: err.message
    });
  }
};

// ======================= UPDATE STUDENT PROFILE =======================
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      firstname,
      lastname,
      phone,
      dob,
      gender,
      address,
      city,
      province,
      currentLevel,
      stream,
      schoolCollege,
      // Parent/guardian info
      fatherName,
      fatherPhone,
      motherName,
      motherPhone,
      guardianName,
      guardianPhone,
      guardianRelation
    } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "User not found."
      });
    }

    // Update fields if provided
    if (firstname) user.firstname = firstname;
    if (lastname) user.lastname = lastname;
    if (phone) user.phone = phone;
    if (dob) user.dob = new Date(dob);
    if (gender) user.gender = gender;
    if (address) user.address = address;
    if (city) user.city = city;
    if (province) user.province = province;
    if (currentLevel) user.currentLevel = currentLevel;
    if (stream !== undefined) user.stream = stream;
    if (schoolCollege) user.schoolCollege = schoolCollege;

    // Update parent/guardian info (store in user model)
    if (fatherName !== undefined) user.fatherName = fatherName;
    if (fatherPhone !== undefined) user.fatherPhone = fatherPhone;
    if (motherName !== undefined) user.motherName = motherName;
    if (motherPhone !== undefined) user.motherPhone = motherPhone;
    if (guardianName !== undefined) user.guardianName = guardianName;
    if (guardianPhone !== undefined) user.guardianPhone = guardianPhone;
    if (guardianRelation !== undefined) user.guardianRelation = guardianRelation;

    await user.save();

    const { hash, salt, verificationCode, ...responseData } = user.toJSON();

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      data: responseData,
      msg: "Profile updated successfully."
    });
  } catch (err) {
    console.error('Update student profile error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to update profile.",
      err: err.message
    });
  }
};

// ======================= GET PAYMENT HISTORY =======================
exports.getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;

    // Find all courses where the user is enrolled
    const enrolledCourses = await Course.find({
      'enrolledStudents.student': userId
    })
      .select('title category price thumbnail enrolledStudents')
      .populate('category', 'name')
      .lean();

    // Extract payment info from enrolled courses
    const payments = enrolledCourses.map(course => {
      const enrollment = course.enrolledStudents.find(
        e => e.student.toString() === userId.toString()
      );

      return {
        courseId: course._id,
        courseTitle: course.title,
        category: course.category?.name || 'Unknown',
        thumbnail: course.thumbnail,
        amount: enrollment?.paymentAmount || course.price || 0,
        paymentDate: enrollment?.enrolledAt || null,
        paymentMethod: enrollment?.paymentMethod || 'Unknown',
        status: enrollment?.paymentStatus || 'pending',
        receipt: enrollment?.paymentReceipt || null,
        transactionId: enrollment?.transactionId || null
      };
    });

    // Calculate total spent
    const totalSpent = payments.reduce((sum, p) => {
      if (p.status === 'verified' || p.status === 'approved') {
        return sum + p.amount;
      }
      return sum;
    }, 0);

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      data: {
        payments,
        total: payments.length,
        totalSpent
      },
      msg: "Payment history retrieved successfully."
    });
  } catch (err) {
    console.error('Get payment history error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to get payment history.",
      err: err.message
    });
  }
};

// ======================= GET STUDENT STATS =======================
exports.getStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Count enrolled courses
    const enrolledCourses = await Course.countDocuments({
      'enrolledStudents.student': userId
    });

    // For now, return basic stats
    // In future, this can include completed lessons, study hours, etc.
    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      data: {
        enrolledCourses,
        completedCourses: 0, // TODO: Track course completion
        lessonsCompleted: 0, // TODO: Track lesson completion
        totalStudyHours: 0   // TODO: Track study hours
      },
      msg: "Stats retrieved successfully."
    });
  } catch (err) {
    console.error('Get student stats error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to get stats.",
      err: err.message
    });
  }
};
