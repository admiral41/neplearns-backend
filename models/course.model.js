const mongoose = require("mongoose");
const Schema = mongoose.Schema;
// const mongoose_fuzzy_searching = require("mongoose-fuzzy-searching");
const Lesson = require("./lessons");
const Week = require("./weeks");
const slug = require("mongoose-slug-updater");

mongoose.plugin(slug);

const courseSchema = new Schema(
  {
    courseTitle: {
      type: String,
      required: true,
    },
    courseSlug: {
      type: String,
      required: false,
      unique: true,
      slug: "courseTitle",
      index: true,
    },
    courseDesc: {
      type: String,
      required: true,
    },
    courseShortDesc: {
      type: String,
      required: false,
    },
    duration: {
      type: Number, 
      required: true,
    },
    weekly_study: {
      type: Number, 
      required: true,
    },
    learn_type: {
      type: String,
      enum: ["PAID", "FREE"],
      default: "FREE",
    },
    price: {
      type: Number,
      required: function() {
        return this.learn_type === "PAID";
      },
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    image: {
      type: String,
      required: false,
    },
    embeddedUrl: {
      type: String,
      required: false,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    tags: [{ 
      type: String, 
      required: false 
    }],
    requirements: {
      type: String
    },
    
    status: {
      type: String,
      enum: ['draft', 'pending_approval', 'approved', 'rejected', 'published', 'archived'],
      default: 'draft'
    },
    
    rejectionReason: {
      type: String,
      required: false
    },
    
    published: {
      type: Boolean,
      default: false
    },
    publishedAt: {
      type: Date,
      required: false
    },
    
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    creatorType: {
      type: String,
      enum: ['lecturer', 'admin', 'superadmin'],
      required: true
    },
    
    lecturers: [
      {
        type: Schema.Types.ObjectId,
        ref: "Lecturer",
        required: true,
      },
    ],
    
    learners: [{ 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: false 
    }],
    
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    
    // META DATA
    totalEnrollments: {
      type: Number,
      default: 0
    },
    totalLessons: {
      type: Number,
      default: 0
    },
    totalWeeks: {
      type: Number,
      default: 0
    },
    
    adminNotes: [{
      note: String,
      addedBy: {
        type: Schema.Types.ObjectId,
        ref: "User"
      },
      addedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Fuzzy searching plugin
// courseSchema.plugin(mongoose_fuzzy_searching, {
//   fields: [
//     {
//       name: "courseTitle",
//       minSize: 3,
//     },
//     {
//       name: "courseDesc",
//       minSize: 3,
//     },
//   ],
// });

// Virtual for final price after discount
courseSchema.virtual('finalPrice').get(function() {
  if (this.learn_type === "FREE") return 0;
  const discountAmount = (this.price * this.discount) / 100;
  return this.price - discountAmount;
});

// Update rating method
courseSchema.methods.updateRating = async function() {
  const weeks = await Week.distinct("_id", { course: this._id });
  const ratingResult = await Lesson.aggregate([
    {
      $match: { week: { $in: weeks } },
    },
    {
      $group: {
        _id: null,
        avgRating: {
          $avg: "$rating",
        },
        totalReviews: {
          $sum: { $cond: [{ $gt: ["$rating", 0] }, 1, 0] }
        }
      },
    },
  ]);
  
  if (ratingResult.length > 0) {
    this.rating = ratingResult[0].avgRating || 0;
    await this.save();
  }
  
  return this.rating;
};

// Update enrollment count
courseSchema.methods.updateEnrollmentCount = async function() {
  this.totalEnrollments = this.learners.length;
  await this.save();
  return this.totalEnrollments;
};

// Check if user is enrolled
courseSchema.methods.isUserEnrolled = function(userId) {
  return this.learners.some(learnerId => 
    learnerId.toString() === userId.toString()
  );
};

// Check if user is a lecturer of this course
courseSchema.methods.isUserLecturer = async function(userId) {
  const Lecturer = mongoose.model('Lecturer');
  const lecturer = await Lecturer.findOne({ user: userId, _id: { $in: this.lecturers } });
  return !!lecturer;
};

// Check if user can edit course
courseSchema.methods.canUserEdit = async function(userId, userRoles) {
  // SuperAdmin can edit anything
  if (userRoles.includes('SUPERADMIN')) return true;
  
  // Admin can edit anything
  if (userRoles.includes('ADMIN')) return true;
  
  // Lecturer can edit only if they created it or are assigned
  if (userRoles.includes('LECTURER')) {
    if (this.createdBy.toString() === userId.toString()) return true;
    
    const isAssignedLecturer = await this.isUserLecturer(userId);
    return isAssignedLecturer;
  }
  
  return false;
};

// Hide sensitive data
courseSchema.methods.toJSON = function() {
  let course = this.toObject();
  delete course.createdAt;
  delete course.updatedAt;
  delete course.__v;
  delete course.adminNotes;
  delete course.rejectionReason;
  return course;
};

// Pre-save hook to update slug
courseSchema.pre('save', function() {
  if (!this.courseSlug && this.courseTitle) {
    this.courseSlug = this.courseTitle
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
  
  // Set publishedAt when published
  if (this.isModified('published') && this.published === true && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  

});

const Course = mongoose.model("Course", courseSchema);
Course.createIndexes();

module.exports = Course;