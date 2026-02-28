const mongoose = require('mongoose');

const FeatureSchema = new mongoose.Schema(
  {
    // Icon name (maps to lucide-react icons)
    icon: {
      type: String,
      required: true,
      enum: ['GraduationCap', 'Award', 'Video', 'Users', 'BookOpen', 'TrendingUp', 'Clock', 'Shield', 'Star', 'Target', 'Zap', 'Heart', 'CheckCircle', 'MessageCircle', 'Globe', 'Laptop'],
      default: 'Star'
    },

    // Feature title
    title: {
      type: String,
      required: true,
      maxlength: 100
    },

    // Feature description
    description: {
      type: String,
      required: true,
      maxlength: 500
    },

    // Display order (lower = first)
    displayOrder: {
      type: Number,
      default: 0
    },

    // Active status
    isActive: {
      type: Boolean,
      default: true
    },

    // Admin who created/updated this
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

// Index for sorting by order and active status
FeatureSchema.index({ isActive: 1, displayOrder: 1 });

module.exports = mongoose.model('Feature', FeatureSchema);
