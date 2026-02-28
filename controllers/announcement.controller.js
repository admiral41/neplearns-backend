const Announcement = require('../models/announcement.model');
const httpStatus = require('http-status');
const { responseHandler } = require('../helpers/index');
const { sendErrorResponse, sendSuccessResponse } = responseHandler;
const notificationService = require('../services/notificationService');

// ======================= ADMIN: GET ALL ANNOUNCEMENTS =======================
exports.getAnnouncements = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, targetAudience, search } = req.query;

    let query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (targetAudience && targetAudience !== 'all') {
      query.targetAudience = targetAudience;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    const announcements = await Announcement.find(query)
      .populate('createdBy', 'firstname lastname')
      .populate('targetCourse', 'title')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Add readCount to each announcement
    const announcementsWithStats = announcements.map(a => ({
      ...a.toObject(),
      readCount: a.readBy?.length || 0
    }));

    const total = await Announcement.countDocuments(query);

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      data: {
        announcements: announcementsWithStats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      },
      msg: 'Announcements retrieved successfully.'
    });
  } catch (err) {
    console.error('Get announcements error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to get announcements.',
      err: err.message
    });
  }
};

// ======================= ADMIN: GET SINGLE ANNOUNCEMENT =======================
exports.getAnnouncementById = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id)
      .populate('createdBy', 'firstname lastname')
      .populate('targetCourse', 'title')
      .populate('readBy', 'firstname lastname email');

    if (!announcement) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: 'Announcement not found.'
      });
    }

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      data: {
        ...announcement.toObject(),
        readCount: announcement.readBy?.length || 0
      },
      msg: 'Announcement retrieved successfully.'
    });
  } catch (err) {
    console.error('Get announcement error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to get announcement.',
      err: err.message
    });
  }
};

// ======================= ADMIN: CREATE ANNOUNCEMENT =======================
exports.createAnnouncement = async (req, res) => {
  try {
    const { title, content, targetAudience, targetCourse, priority, status, scheduledAt } = req.body;

    if (!title || !content) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: 'Title and content are required.'
      });
    }

    // Determine final status
    let finalStatus = status || 'draft';
    let publishedAt = null;

    if (scheduledAt) {
      const scheduleDate = new Date(scheduledAt);
      if (scheduleDate > new Date()) {
        finalStatus = 'scheduled';
      } else {
        finalStatus = 'published';
        publishedAt = new Date();
      }
    } else if (status === 'published') {
      publishedAt = new Date();
    }

    const announcement = await Announcement.create({
      title,
      content,
      targetAudience: targetAudience || 'all',
      targetCourse: targetCourse || null,
      priority: priority || 'normal',
      status: finalStatus,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      publishedAt,
      createdBy: req.user._id
    });

    // If published immediately, send notifications
    if (finalStatus === 'published') {
      await sendAnnouncementNotification(announcement);
    }

    return sendSuccessResponse({
      res,
      status: httpStatus.CREATED,
      data: announcement,
      msg: finalStatus === 'scheduled'
        ? `Announcement scheduled for ${new Date(scheduledAt).toLocaleString()}`
        : 'Announcement created successfully.'
    });
  } catch (err) {
    console.error('Create announcement error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to create announcement.',
      err: err.message
    });
  }
};

// ======================= ADMIN: UPDATE ANNOUNCEMENT =======================
exports.updateAnnouncement = async (req, res) => {
  try {
    const { title, content, targetAudience, targetCourse, priority, status, scheduledAt } = req.body;

    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: 'Announcement not found.'
      });
    }

    const wasPublished = announcement.status === 'published';

    if (title) announcement.title = title;
    if (content) announcement.content = content;
    if (targetAudience) announcement.targetAudience = targetAudience;
    if (targetCourse !== undefined) announcement.targetCourse = targetCourse || null;
    if (priority) announcement.priority = priority;

    // Handle scheduling
    if (scheduledAt) {
      const scheduleDate = new Date(scheduledAt);
      if (scheduleDate > new Date()) {
        announcement.status = 'scheduled';
        announcement.scheduledAt = scheduleDate;
      } else {
        announcement.status = 'published';
        announcement.publishedAt = announcement.publishedAt || new Date();
      }
    } else if (status) {
      announcement.status = status;
      if (status === 'published' && !announcement.publishedAt) {
        announcement.publishedAt = new Date();
      }
      if (status !== 'scheduled') {
        announcement.scheduledAt = null;
      }
    }

    await announcement.save();

    // If just published, send notifications
    if (!wasPublished && announcement.status === 'published') {
      await sendAnnouncementNotification(announcement);
    }

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      data: announcement,
      msg: 'Announcement updated successfully.'
    });
  } catch (err) {
    console.error('Update announcement error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to update announcement.',
      err: err.message
    });
  }
};

// ======================= ADMIN: DELETE ANNOUNCEMENT =======================
exports.deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);

    if (!announcement) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: 'Announcement not found.'
      });
    }

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: 'Announcement deleted successfully.'
    });
  } catch (err) {
    console.error('Delete announcement error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to delete announcement.',
      err: err.message
    });
  }
};

// ======================= USER: GET ANNOUNCEMENTS FOR USER =======================
exports.getUserAnnouncements = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const user = req.user;

    // Determine target audiences based on user role
    const audiences = ['all'];
    if (user.roles.includes('LEARNER')) audiences.push('students');
    if (user.roles.includes('LECTURER')) audiences.push('instructors');

    const query = {
      status: 'published',
      targetAudience: { $in: audiences },
      $or: [
        { targetCourse: null },
        { targetCourse: { $in: user.enrolledCourses || [] } }
      ]
    };

    const announcements = await Announcement.find(query)
      .populate('createdBy', 'firstname lastname')
      .populate('targetCourse', 'title')
      .sort({ priority: -1, publishedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Add isRead flag
    const announcementsWithReadStatus = announcements.map(a => ({
      ...a.toObject(),
      isRead: a.readBy?.some(id => id.toString() === user._id.toString()) || false
    }));

    const total = await Announcement.countDocuments(query);
    const unreadCount = await Announcement.countDocuments({
      ...query,
      readBy: { $ne: user._id }
    });

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      data: {
        announcements: announcementsWithReadStatus,
        unreadCount,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      },
      msg: 'Announcements retrieved successfully.'
    });
  } catch (err) {
    console.error('Get user announcements error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to get announcements.',
      err: err.message
    });
  }
};

// ======================= USER: MARK ANNOUNCEMENT AS READ =======================
exports.markAsRead = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: 'Announcement not found.'
      });
    }

    // Add user to readBy if not already there
    if (!announcement.readBy.includes(req.user._id)) {
      announcement.readBy.push(req.user._id);
      announcement.viewCount += 1;
      await announcement.save();
    }

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: 'Announcement marked as read.'
    });
  } catch (err) {
    console.error('Mark as read error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to mark announcement as read.',
      err: err.message
    });
  }
};

// ======================= CRON: PUBLISH SCHEDULED ANNOUNCEMENTS =======================
exports.publishScheduledAnnouncements = async () => {
  try {
    const now = new Date();
    const scheduledAnnouncements = await Announcement.find({
      status: 'scheduled',
      scheduledAt: { $lte: now }
    });

    for (const announcement of scheduledAnnouncements) {
      announcement.status = 'published';
      announcement.publishedAt = now;
      await announcement.save();

      // Send notifications
      await sendAnnouncementNotification(announcement);
    }

    if (scheduledAnnouncements.length > 0) {
      console.log(`Published ${scheduledAnnouncements.length} scheduled announcements`);
    }

    return scheduledAnnouncements.length;
  } catch (err) {
    console.error('Publish scheduled announcements error:', err);
    return 0;
  }
};

// ======================= HELPER: SEND ANNOUNCEMENT NOTIFICATION =======================
async function sendAnnouncementNotification(announcement) {
  try {
    await notificationService.sendAnnouncement(
      {
        title: announcement.title,
        message: announcement.content.substring(0, 200) + (announcement.content.length > 200 ? '...' : ''),
        actionUrl: '/announcements'
      },
      announcement.targetAudience === 'students' ? 'LEARNER' :
      announcement.targetAudience === 'instructors' ? 'LECTURER' : null
    );
  } catch (err) {
    console.error('Failed to send announcement notification:', err);
  }
}
