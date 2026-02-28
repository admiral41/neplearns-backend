const mongoose = require('mongoose');

const InstructorToolSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500
    },

    link: {
      type: String,
      trim: true
    },

    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    isDeleted: {
      type: Boolean,
      default: false
    },

    deletedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

InstructorToolSchema.index({ instructor: 1, isDeleted: 1 });

module.exports = mongoose.model('InstructorTool', InstructorToolSchema);
