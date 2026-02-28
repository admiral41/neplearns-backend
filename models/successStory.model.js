const mongoose = require('mongoose');

const SuccessStorySchema = new mongoose.Schema(
  {
    // Reference to the user who gave the testimonial
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    // Custom role/achievement text (e.g., "SEE Graduate - GPA 3.95")
    achievement: {
      type: String,
      required: true,
      maxlength: 150
    },

    // The testimonial/feedback text
    testimonial: {
      type: String,
      required: true,
      maxlength: 1000
    },

    // Course name they're talking about
    courseName: {
      type: String,
      required: true,
      maxlength: 200
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      default: 5
    },

    isActive: {
      type: Boolean,
      default: true
    },

    // Admin who added this success story
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

SuccessStorySchema.index({ isActive: 1, createdAt: -1 });
SuccessStorySchema.index({ user: 1 });

module.exports = mongoose.model('SuccessStory', SuccessStorySchema);
