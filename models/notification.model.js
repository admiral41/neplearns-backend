const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    type: {
      type: String,
      required: true,
      enum: [
        'new_learner_registration',
        'new_lecturer_application',
        'lecturer_approved',
        'lecturer_rejected',
        'new_course_published',
        'course_enrolled',
        'announcement',
        'system',
        'account_suspended',
        'account_unsuspended',
        'session_reminder_24h',
        'session_reminder_1h',
        'new_tutoring_request',
        'session_started',
        'session_ended',
        'assignment_created',
        'assignment_submitted',
        'assignment_reviewed'
      ]
    },

    title: {
      type: String,
      required: true,
      maxlength: 200
    },

    message: {
      type: String,
      required: true,
      maxlength: 1000
    },

    // Additional data for the notification (e.g., links, IDs)
    data: {
      type: Object,
      default: {}
    },

    // Whether the notification has been read
    read: {
      type: Boolean,
      default: false,
      index: true
    },

    // Optional: Link to redirect when clicked
    actionUrl: {
      type: String,
      default: null
    },

    // Optional: Icon or image for the notification
    icon: {
      type: String,
      default: null
    },

    // For role-based targeting (e.g., send to all admins)
    targetRole: {
      type: String,
      enum: ['ADMIN', 'SUPERADMIN', 'LECTURER', 'LEARNER', null],
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Index for efficient queries
NotificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ recipient: 1, createdAt: -1 });

// Static method to create notification for multiple recipients
NotificationSchema.statics.createForMultiple = async function (recipientIds, notificationData) {
  const notifications = recipientIds.map((recipientId) => ({
    ...notificationData,
    recipient: recipientId
  }));

  return this.insertMany(notifications);
};

// Static method to mark all notifications as read for a user
NotificationSchema.statics.markAllAsRead = async function (userId) {
  return this.updateMany(
    { recipient: userId, read: false },
    { $set: { read: true } }
  );
};

// Static method to get unread count for a user
NotificationSchema.statics.getUnreadCount = async function (userId) {
  return this.countDocuments({ recipient: userId, read: false });
};

module.exports = mongoose.model('Notification', NotificationSchema);
