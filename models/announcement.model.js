const mongoose = require('mongoose');

const AnnouncementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      maxlength: 200
    },

    content: {
      type: String,
      required: true,
      maxlength: 5000
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    // Target: 'all', 'students', 'instructors'
    targetAudience: {
      type: String,
      enum: ['all', 'students', 'instructors'],
      default: 'all'
    },

    // Optional: Target specific course
    targetCourse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      default: null
    },

    priority: {
      type: String,
      enum: ['normal', 'high'],
      default: 'normal'
    },

    status: {
      type: String,
      enum: ['draft', 'published', 'scheduled'],
      default: 'draft'
    },

    // For scheduled announcements
    scheduledAt: {
      type: Date,
      default: null
    },

    publishedAt: {
      type: Date,
      default: null
    },

    // Analytics
    viewCount: {
      type: Number,
      default: 0
    },

    readBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  {
    timestamps: true
  }
);

AnnouncementSchema.index({ status: 1, targetAudience: 1, createdAt: -1 });
AnnouncementSchema.index({ scheduledAt: 1, status: 1 });
AnnouncementSchema.index({ targetCourse: 1 });

module.exports = mongoose.model('Announcement', AnnouncementSchema);
