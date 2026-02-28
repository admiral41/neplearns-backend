const httpStatus = require('http-status');
const mongoose = require('mongoose');
const Notification = require('../models/notification.model');
const notificationService = require('../services/notificationService');
const { responseHandler } = require('../helpers/index');
const { sendErrorResponse, sendSuccessResponse, parseFilters } = responseHandler;

/**
 * Get user's notifications with pagination
 * GET /notifications
 */
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    const query = { recipient: userId };
    if (unreadOnly === 'true') {
      query.read = false;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Notification.countDocuments(query),
      Notification.countDocuments({ recipient: userId, read: false })
    ]);

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      data: {
        notifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        },
        unreadCount
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to get notifications',
      err: error.message
    });
  }
};

/**
 * Get unread notification count
 * GET /notifications/unread-count
 */
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;
    const count = await Notification.getUnreadCount(userId);

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      data: { unreadCount: count }
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to get unread count',
      err: error.message
    });
  }
};

/**
 * Mark a notification as read
 * PATCH /notifications/:id/read
 */
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: 'Invalid notification ID'
      });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: userId },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: 'Notification not found'
      });
    }

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to mark notification as read',
      err: error.message
    });
  }
};

/**
 * Mark all notifications as read
 * PATCH /notifications/read-all
 */
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await Notification.markAllAsRead(userId);

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: 'All notifications marked as read',
      data: { modifiedCount: result.modifiedCount }
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to mark all notifications as read',
      err: error.message
    });
  }
};

/**
 * Delete a notification
 * DELETE /notifications/:id
 */
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: 'Invalid notification ID'
      });
    }

    const notification = await Notification.findOneAndDelete({
      _id: id,
      recipient: userId
    });

    if (!notification) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: 'Notification not found'
      });
    }

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to delete notification',
      err: error.message
    });
  }
};

/**
 * Delete all notifications for user
 * DELETE /notifications/all
 */
exports.deleteAllNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await Notification.deleteMany({ recipient: userId });

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: 'All notifications deleted',
      data: { deletedCount: result.deletedCount }
    });
  } catch (error) {
    console.error('Delete all notifications error:', error);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to delete all notifications',
      err: error.message
    });
  }
};

// ======================= ADMIN ENDPOINTS =======================

/**
 * Send announcement (Admin only)
 * POST /notifications/announcement
 */
exports.sendAnnouncement = async (req, res) => {
  try {
    const { title, message, targetRole, actionUrl } = req.body;

    if (!title || !message) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: 'Title and message are required'
      });
    }

    const validRoles = ['ADMIN', 'LECTURER', 'LEARNER', null];
    if (targetRole && !validRoles.includes(targetRole)) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: 'Invalid target role'
      });
    }

    const result = await notificationService.sendAnnouncement(
      { title, message, actionUrl, data: { announcementBy: req.user._id } },
      targetRole
    );

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: 'Announcement sent successfully',
      data: result
    });
  } catch (error) {
    console.error('Send announcement error:', error);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to send announcement',
      err: error.message
    });
  }
};

/**
 * Send notification to specific user (Admin only)
 * POST /notifications/send
 */
exports.sendToUser = async (req, res) => {
  try {
    const { userId, title, message, type = 'system', actionUrl } = req.body;

    if (!userId || !title || !message) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: 'userId, title and message are required'
      });
    }

    const notification = await notificationService.sendToUser(userId, {
      type,
      title,
      message,
      actionUrl,
      data: { sentBy: req.user._id }
    });

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: 'Notification sent successfully',
      data: notification
    });
  } catch (error) {
    console.error('Send to user error:', error);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to send notification',
      err: error.message
    });
  }
};
