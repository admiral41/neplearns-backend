const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let lecturerSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    cv: {
      type: String,
      required: false,
    },
    certificates: [{
      type: String,
    }],
    governmentIdType: {
      type: String,
      enum: ['citizenship', 'nid', 'passport', 'driving_license', null],
      required: false,
    },
    governmentId: {
      type: String,
      required: false,
    },
    requestStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

lecturerSchema.methods.toJSON = function () {
  let lecturer = this.toObject();
  delete lecturer.updatedAt;
  delete lecturer.__v;
  return lecturer;
};

const Lecturer = mongoose.model('Lecturer', lecturerSchema);
module.exports = Lecturer;