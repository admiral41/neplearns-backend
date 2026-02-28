const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const slug = require('mongoose-slug-updater');

mongoose.plugin(slug);

const tutoringSubjectSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      unique: true,
      slug: "name",
      index: true,
    },
    description: {
      type: String,
      required: false,
      trim: true,
    },
    monthlyPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    platformFeePercentage: {
      type: Number,
      default: 15,
      min: 0,
      max: 100,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
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
tutoringSubjectSchema.methods.toJSON = function () {
  let subject = this.toObject();
  delete subject.__v;
  return subject;
};

const TutoringSubject = mongoose.model('TutoringSubject', tutoringSubjectSchema);
TutoringSubject.createIndexes();

module.exports = TutoringSubject;
