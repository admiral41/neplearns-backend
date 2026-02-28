const httpStatus = require("http-status");
const Enquiry = require("../models/enquiry.model");
const { sendErrorResponse, sendSuccessResponse } = require("../helpers/responseHandler");
const { sendEnquiryMail } = require("../helpers/mailer");
const { validationResult } = require("express-validator");

// ======================= CREATE ENQUIRY (PUBLIC) =======================
exports.createEnquiry = async (req, res) => {
  try {
    const { name, email, phone, level, message } = req.body;

    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: "Validation failed",
        err: errors.array()
      });
    }

    // Create enquiry
    const enquiry = await Enquiry.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      level,
      message: message?.trim() || "",
      status: "pending"
    });

    // Send emails (to admin and user)
    try {
      await sendEnquiryMail({
        name: enquiry.name,
        email: enquiry.email,
        phone: enquiry.phone,
        level: enquiry.level,
        message: enquiry.message,
        submittedAt: enquiry.createdAt
      });
    } catch (emailError) {
      console.error("Failed to send enquiry emails:", emailError);
      // Don't fail the request if email fails, but log it
    }

    return sendSuccessResponse({
      res,
      status: httpStatus.CREATED,
      msg: "Enquiry submitted successfully! We'll get back to you shortly.",
      data: enquiry
    });
  } catch (err) {
    console.error("Create enquiry error:", err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to submit enquiry.",
      err: err.message
    });
  }
};

// ======================= GET ALL ENQUIRIES (ADMIN ONLY) =======================
exports.getAllEnquiries = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      level,
      search,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    // Build query
    const query = {};

    if (status) query.status = status;
    if (level) query.level = level;
    if (search) {
      // Escape special regex characters to prevent ReDoS attacks
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { name: { $regex: escapedSearch, $options: 'i' } },
        { email: { $regex: escapedSearch, $options: 'i' } },
        { phone: { $regex: escapedSearch, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = order === 'asc' ? 1 : -1;

    // Fetch enquiries with pagination
    const enquiries = await Enquiry.find(query)
      .populate('assignedTo', 'firstname lastname email')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Enquiry.countDocuments(query);

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: "Enquiries fetched successfully",
      data: {
        enquiries,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (err) {
    console.error("Get enquiries error:", err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to fetch enquiries.",
      err: err.message
    });
  }
};

// ======================= GET ENQUIRY BY ID (ADMIN ONLY) =======================
exports.getEnquiryById = async (req, res) => {
  try {
    const { id } = req.params;

    const enquiry = await Enquiry.findById(id)
      .populate('assignedTo', 'firstname lastname email');

    if (!enquiry) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "Enquiry not found."
      });
    }

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: "Enquiry fetched successfully",
      data: enquiry
    });
  } catch (err) {
    console.error("Get enquiry by ID error:", err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to fetch enquiry.",
      err: err.message
    });
  }
};

// ======================= UPDATE ENQUIRY STATUS (ADMIN ONLY) =======================
exports.updateEnquiryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, assignedTo } = req.body;

    const updateData = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (assignedTo) updateData.assignedTo = assignedTo;

    const enquiry = await Enquiry.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('assignedTo', 'firstname lastname email');

    if (!enquiry) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "Enquiry not found."
      });
    }

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: "Enquiry updated successfully",
      data: enquiry
    });
  } catch (err) {
    console.error("Update enquiry error:", err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to update enquiry.",
      err: err.message
    });
  }
};

// ======================= DELETE ENQUIRY (ADMIN ONLY) =======================
exports.deleteEnquiry = async (req, res) => {
  try {
    const { id } = req.params;

    const enquiry = await Enquiry.findByIdAndDelete(id);

    if (!enquiry) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "Enquiry not found."
      });
    }

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: "Enquiry deleted successfully"
    });
  } catch (err) {
    console.error("Delete enquiry error:", err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to delete enquiry.",
      err: err.message
    });
  }
};

// ======================= GET ENQUIRY STATISTICS (ADMIN ONLY) =======================
exports.getEnquiryStats = async (req, res) => {
  try {
    const total = await Enquiry.countDocuments();
    const pending = await Enquiry.countDocuments({ status: 'pending' });
    const contacted = await Enquiry.countDocuments({ status: 'contacted' });
    const resolved = await Enquiry.countDocuments({ status: 'resolved' });
    const rejected = await Enquiry.countDocuments({ status: 'rejected' });

    // Get enquiries by level
    const byLevel = await Enquiry.aggregate([
      {
        $group: {
          _id: '$level',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get recent enquiries (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentCount = await Enquiry.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: "Statistics fetched successfully",
      data: {
        total,
        byStatus: {
          pending,
          contacted,
          resolved,
          rejected
        },
        byLevel: byLevel.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        recentCount
      }
    });
  } catch (err) {
    console.error("Get enquiry stats error:", err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to fetch statistics.",
      err: err.message
    });
  }
};
