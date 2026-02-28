const httpStatus = require('http-status');
const FCM = require('../models/fcm');
const firebase = require('../configs/firebase');
const { responseHandler } = require('../helpers/index');
const { sendErrorResponse, sendSuccessResponse } = responseHandler;

/**
 * Register FCM token for push notifications
 * POST /fcm/register
 */
exports.registerToken = async (req, res) => {
  try {
    const { fcmToken, deviceInfo } = req.body;
    const userId = req.user._id;

    if (!fcmToken) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: 'FCM token is required'
      });
    }

    // Find or create FCM record for user
    let fcmRecord = await FCM.findOne({ user_id: userId });

    if (fcmRecord) {
      // Check if token already exists
      if (!fcmRecord.fcm_token.includes(fcmToken)) {
        fcmRecord.fcm_token.push(fcmToken);
        if (deviceInfo) {
          fcmRecord.deviceInfo = deviceInfo;
        }
        await fcmRecord.save();
      }
    } else {
      // Create new FCM record
      fcmRecord = await FCM.create({
        user_id: userId,
        fcm_token: [fcmToken],
        deviceInfo: deviceInfo || {}
      });
    }

    // Subscribe to role-based topics
    try {
      const topics = ['all_users'];

      if (req.user.roles.includes('ADMIN') || req.user.roles.includes('SUPERADMIN')) {
        topics.push('admins');
      }
      if (req.user.roles.includes('LECTURER')) {
        topics.push('lecturers');
      }
      if (req.user.roles.includes('LEARNER')) {
        topics.push('learners');
      }

      for (const topic of topics) {
        await firebase.subscribeToTopic([fcmToken], topic);
      }
    } catch (topicError) {
      console.error('Failed to subscribe to topics:', topicError);
      // Don't fail the request if topic subscription fails
    }

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: 'FCM token registered successfully',
      data: {
        tokenCount: fcmRecord.fcm_token.length
      }
    });
  } catch (error) {
    console.error('FCM register error:', error);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to register FCM token',
      err: error.message
    });
  }
};

/**
 * Unregister FCM token (on logout or app uninstall)
 * DELETE /fcm/unregister
 */
exports.unregisterToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    const userId = req.user._id;

    if (!fcmToken) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: 'FCM token is required'
      });
    }

    // Remove token from user's FCM record
    const result = await FCM.updateOne(
      { user_id: userId },
      { $pull: { fcm_token: fcmToken } }
    );

    // Unsubscribe from all topics
    try {
      const topics = ['all_users', 'admins', 'lecturers', 'learners'];
      for (const topic of topics) {
        await firebase.unsubscribeFromTopic([fcmToken], topic);
      }
    } catch (topicError) {
      console.error('Failed to unsubscribe from topics:', topicError);
    }

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: 'FCM token unregistered successfully'
    });
  } catch (error) {
    console.error('FCM unregister error:', error);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to unregister FCM token',
      err: error.message
    });
  }
};

/**
 * Get user's FCM tokens count
 * GET /fcm/status
 */
exports.getStatus = async (req, res) => {
  try {
    const userId = req.user._id;

    const fcmRecord = await FCM.findOne({ user_id: userId });

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      data: {
        hasTokens: fcmRecord ? fcmRecord.fcm_token.length > 0 : false,
        tokenCount: fcmRecord ? fcmRecord.fcm_token.length : 0,
        deviceInfo: fcmRecord?.deviceInfo || null
      }
    });
  } catch (error) {
    console.error('FCM status error:', error);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to get FCM status',
      err: error.message
    });
  }
};

/**
 * Clear all FCM tokens for user (useful for security)
 * DELETE /fcm/clear
 */
exports.clearAllTokens = async (req, res) => {
  try {
    const userId = req.user._id;

    const fcmRecord = await FCM.findOne({ user_id: userId });

    if (fcmRecord && fcmRecord.fcm_token.length > 0) {
      // Unsubscribe all tokens from topics
      try {
        const topics = ['all_users', 'admins', 'lecturers', 'learners'];
        for (const topic of topics) {
          await firebase.unsubscribeFromTopic(fcmRecord.fcm_token, topic);
        }
      } catch (topicError) {
        console.error('Failed to unsubscribe from topics:', topicError);
      }

      // Clear all tokens
      fcmRecord.fcm_token = [];
      await fcmRecord.save();
    }

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: 'All FCM tokens cleared successfully'
    });
  } catch (error) {
    console.error('FCM clear error:', error);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to clear FCM tokens',
      err: error.message
    });
  }
};
