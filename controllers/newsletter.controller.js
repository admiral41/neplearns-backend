const httpStatus = require("http-status");
const Newsletter = require("../models/newsletter.model");
const { sendErrorResponse, sendSuccessResponse } = require("../helpers/responseHandler");
const { sendNewsletterWelcomeMail } = require("../helpers/mailer");
const { validationResult } = require("express-validator");

// ======================= SUBSCRIBE TO NEWSLETTER (PUBLIC) =======================
exports.subscribeNewsletter = async (req, res) => {
  try {
    const { email, name } = req.body;

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

    // Check if email already exists
    const existingSubscription = await Newsletter.findOne({
      email: email.trim().toLowerCase()
    });

    if (existingSubscription) {
      // If already subscribed and active
      if (existingSubscription.status === 'active') {
        return sendErrorResponse({
          res,
          status: httpStatus.CONFLICT,
          msg: "This email is already subscribed to our newsletter."
        });
      }

      // If previously unsubscribed, reactivate
      if (existingSubscription.status === 'unsubscribed') {
        existingSubscription.status = 'active';
        existingSubscription.unsubscribedAt = null;
        await existingSubscription.save();

        return sendSuccessResponse({
          res,
          status: httpStatus.OK,
          msg: "Welcome back! Your subscription has been reactivated.",
          data: existingSubscription
        });
      }
    }

    // Create new subscription
    const subscription = await Newsletter.create({
      email: email.trim().toLowerCase(),
      name: name?.trim() || "",
      status: "active",
      subscriptionSource: "website"
    });

    // Send welcome email
    try {
      await sendNewsletterWelcomeMail({
        email: subscription.email,
        name: subscription.name || "Subscriber"
      });
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
      // Don't fail the request if email fails, but log it
    }

    return sendSuccessResponse({
      res,
      status: httpStatus.CREATED,
      msg: "Thank you for subscribing! Check your email for confirmation.",
      data: subscription
    });
  } catch (err) {
    console.error("Subscribe newsletter error:", err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to process subscription.",
      err: err.message
    });
  }
};

// ======================= UNSUBSCRIBE FROM NEWSLETTER (PUBLIC) =======================
exports.unsubscribeNewsletter = async (req, res) => {
  try {
    const { email } = req.body;

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

    const subscription = await Newsletter.findOne({
      email: email.trim().toLowerCase()
    });

    if (!subscription) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "Email not found in our newsletter list."
      });
    }

    if (subscription.status === 'unsubscribed') {
      return sendSuccessResponse({
        res,
        status: httpStatus.OK,
        msg: "This email is already unsubscribed."
      });
    }

    subscription.status = 'unsubscribed';
    subscription.unsubscribedAt = new Date();
    await subscription.save();

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: "You have been successfully unsubscribed from our newsletter."
    });
  } catch (err) {
    console.error("Unsubscribe newsletter error:", err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to unsubscribe.",
      err: err.message
    });
  }
};

// ======================= GET ALL SUBSCRIBERS (ADMIN ONLY) =======================
exports.getAllSubscribers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    // Build query
    const query = {};

    if (status) query.status = status;
    if (search) {
      // Escape special regex characters to prevent ReDoS attacks
      const escapedSearch = search.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');
      query.$or = [
        { email: { $regex: escapedSearch, $options: 'i' } },
        { name: { $regex: escapedSearch, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = order === 'asc' ? 1 : -1;

    // Fetch subscribers with pagination
    const subscribers = await Newsletter.find(query)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Newsletter.countDocuments(query);

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: "Subscribers fetched successfully",
      data: {
        subscribers,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (err) {
    console.error("Get subscribers error:", err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to fetch subscribers.",
      err: err.message
    });
  }
};

// ======================= GET SUBSCRIBER BY ID (ADMIN ONLY) =======================
exports.getSubscriberById = async (req, res) => {
  try {
    const { id } = req.params;

    const subscriber = await Newsletter.findById(id);

    if (!subscriber) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "Subscriber not found."
      });
    }

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: "Subscriber fetched successfully",
      data: subscriber
    });
  } catch (err) {
    console.error("Get subscriber by ID error:", err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to fetch subscriber.",
      err: err.message
    });
  }
};

// ======================= DELETE SUBSCRIBER (ADMIN ONLY) =======================
exports.deleteSubscriber = async (req, res) => {
  try {
    const { id } = req.params;

    const subscriber = await Newsletter.findByIdAndDelete(id);

    if (!subscriber) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "Subscriber not found."
      });
    }

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: "Subscriber deleted successfully"
    });
  } catch (err) {
    console.error("Delete subscriber error:", err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to delete subscriber.",
      err: err.message
    });
  }
};

// ======================= GET NEWSLETTER STATISTICS (ADMIN ONLY) =======================
exports.getNewsletterStats = async (req, res) => {
  try {
    const total = await Newsletter.countDocuments();
    const active = await Newsletter.countDocuments({ status: 'active' });
    const unsubscribed = await Newsletter.countDocuments({ status: 'unsubscribed' });

    // Get subscribers by source
    const bySource = await Newsletter.aggregate([
      {
        $group: {
          _id: '$subscriptionSource',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get recent subscribers (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentCount = await Newsletter.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
      status: 'active'
    });

    // Get recent unsubscribes (last 7 days)
    const recentUnsubscribes = await Newsletter.countDocuments({
      unsubscribedAt: { $gte: sevenDaysAgo }
    });

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: "Statistics fetched successfully",
      data: {
        total,
        active,
        unsubscribed,
        bySource: bySource.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        recentSubscribers: recentCount,
        recentUnsubscribes
      }
    });
  } catch (err) {
    console.error("Get newsletter stats error:", err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to fetch statistics.",
      err: err.message
    });
  }
};

// ======================= BULK EXPORT ACTIVE SUBSCRIBERS (ADMIN ONLY) =======================
exports.exportActiveSubscribers = async (req, res) => {
  try {
    const subscribers = await Newsletter.find({ status: 'active' })
      .select('email name createdAt')
      .sort({ createdAt: -1 });

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: "Active subscribers exported successfully",
      data: subscribers
    });
  } catch (err) {
    console.error("Export subscribers error:", err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to export subscribers.",
      err: err.message
    });
  }
};
