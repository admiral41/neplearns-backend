const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// const mongoose_fuzzy_searching = require('mongoose-fuzzy-searching');
const slug = require('mongoose-slug-updater');

mongoose.plugin(slug);

const categorySchema = new Schema(
  {
    categoryName: {
      type: String,
      required: true,
      trim: true,
      unique: true, // Make category name unique
    },
    categorySlug: {
      type: String,
      unique: true,
      slug: "categoryName",
      index: true,
    },
    categoryShortDesc: {
      type: String,
      required: false,
      trim: true,
    },
    categoryDesc: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      required: false,
    },
    icon: {
      type: String,
      required: false,
    },
    color: {
      type: String,
      default: '#667eea',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    meta: {
      courseCount: {
        type: Number,
        default: 0,
      },
      learnerCount: {
        type: Number,
        default: 0,
      },
      lastUpdated: {
        type: Date,
        default: Date.now,
      }
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    }
  },
  {
    timestamps: true,
  }
);

// Hide sensitive data
categorySchema.methods.toJSON = function () {
  let category = this.toObject();
  delete category.__v;
  return category;
};

// Fuzzy searching plugin
// categorySchema.plugin(mongoose_fuzzy_searching, {
//   fields: [
//     {
//       name: 'categoryName',
//       minSize: 3,
//     },
//     {
//       name: 'categoryDesc',
//       minSize: 3,
//     },
//   ],
// });

// Virtual for courses
categorySchema.virtual('courses', {
  ref: 'Course',
  localField: '_id',
  foreignField: 'category',
});

// Method to update course count
categorySchema.methods.updateCourseCount = async function() {
  const Course = mongoose.model('Course');
  const courseCount = await Course.countDocuments({ 
    category: this._id,
    status: 'approved',
    published: true 
  });
  this.meta.courseCount = courseCount;
  await this.save();
  return courseCount;
};

const Category = mongoose.model('Category', categorySchema);
Category.createIndexes();

module.exports = Category;