const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const slug = require('mongoose-slug-updater');

mongoose.plugin(slug);

const lessonSchema = new Schema({
  lessonTitle: {
    type: String,
    required: true,
  },
  lessonSlug: {
    type: String,
    unique: true,
    slug: "lessonTitle",
    index: true,
  },
  lessonContent: {
    type: String,
    required: true,
  },
  shortDescription: {
    type: String,
    required: false,
  },
  week: {
    type: Schema.Types.ObjectId,
    ref: "Week",
    required: true,
  },
  order: {
    type: Number,
    required: true,
  },
  duration: {
    type: Number, 
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  videoUrl: {
    type: String,
    required: false,
  },
  attachments: [{
    name: String,
    url: String,
    type: String,
  }],
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  meta: {
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
  }
}, {
  timestamps: true,
});

// Hide sensitive data
lessonSchema.methods.toJSON = function() {
  let lesson = this.toObject();
  delete lesson.__v;
  delete lesson.updatedAt;
  return lesson;
};

// Ensure unique order per week
lessonSchema.index({ week: 1, order: 1 }, { unique: true });

// Virtual for complete lesson URL
lessonSchema.virtual('lessonUrl').get(function() {
  return `/lessons/${this.lessonSlug}`;
});

const Lesson = mongoose.model('Lesson', lessonSchema);
module.exports = Lesson;