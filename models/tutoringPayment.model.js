const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const tutoringPaymentSchema = new Schema(
  {
    // Link to enrollment
    enrollment: {
      type: Schema.Types.ObjectId,
      ref: 'TutoringEnrollment',
      required: true,
      index: true,
    },
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Payment details
    amount: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ['bank_transfer', 'esewa', 'khalti', 'other'],
      default: 'bank_transfer',
    },

    // Payment proof
    proofImage: {
      type: String,
      required: true, // Relative path to uploaded file
    },
    studentNotes: {
      type: String,
      maxlength: 500,
    },

    // Verification status
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },

    // Admin verification details
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    verifiedAt: Date,
    adminNotes: String,
    rejectionReason: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for full proof URL
tutoringPaymentSchema.virtual('proofUrl').get(function() {
  if (!this.proofImage) return null;
  const baseUrl = process.env.BACKEND_URL || 'http://localhost:8000';
  return `${baseUrl}/${this.proofImage}`;
});

// Compound index for pending payments sorted by date (admin view)
tutoringPaymentSchema.index({ status: 1, createdAt: 1 });

const TutoringPayment = mongoose.model('TutoringPayment', tutoringPaymentSchema);
TutoringPayment.createIndexes();

module.exports = TutoringPayment;
