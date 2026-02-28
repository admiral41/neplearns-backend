const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const courseRatingSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure one rating per user per course
courseRatingSchema.index({ user: 1, course: 1 }, { unique: true });

// Index for querying course ratings
courseRatingSchema.index({ course: 1 });

// Static method to calculate average rating for a course
courseRatingSchema.statics.calculateAverageRating = async function(courseId) {
  const result = await this.aggregate([
    { $match: { course: new mongoose.Types.ObjectId(courseId) } },
    {
      $group: {
        _id: '$course',
        averageRating: { $avg: '$rating' },
        totalRatings: { $sum: 1 },
      },
    },
  ]);

  if (result.length > 0) {
    return {
      averageRating: Math.round(result[0].averageRating * 10) / 10, // Round to 1 decimal
      totalRatings: result[0].totalRatings,
    };
  }

  return { averageRating: 0, totalRatings: 0 };
};

// After saving a rating, update the course's average rating
courseRatingSchema.post('save', async function() {
  const Course = mongoose.model('Course');
  const stats = await this.constructor.calculateAverageRating(this.course);

  await Course.findByIdAndUpdate(this.course, {
    rating: stats.averageRating,
  });
});

const CourseRating = mongoose.model('CourseRating', courseRatingSchema);

module.exports = CourseRating;
