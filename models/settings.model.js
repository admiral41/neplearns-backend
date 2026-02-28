const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SettingsSchema = new Schema(
  {
    // General Settings
    platformName: {
      type: String,
      default: 'Neplearn',
    },
    tagline: {
      type: String,
      default: 'Learn. Grow. Succeed.',
    },
    description: {
      type: String,
      default: '',
    },
    logo: {
      type: String,
      default: '',
    },

    // Contact Information
    contactEmail: {
      type: String,
      default: '',
    },
    supportEmail: {
      type: String,
      default: '',
    },
    phones: {
      type: [String],
      default: [],
    },
    address: {
      type: String,
      default: '',
    },
    operatingHours: {
      type: String,
      default: '',
    },
    whatsapp: {
      type: String,
      default: '',
    },
    whatsappMessage: {
      type: String,
      default: '',
    },

    // Social Media Links
    socialLinks: {
      facebook: { type: String, default: '' },
      instagram: { type: String, default: '' },
      twitter: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      youtube: { type: String, default: '' },
    },

    // Feature Toggles
    features: {
      maintenanceMode: { type: Boolean, default: false },
      newRegistrations: { type: Boolean, default: true },
      instructorApplications: { type: Boolean, default: true },
      courseReviews: { type: Boolean, default: true },
      refundRequests: { type: Boolean, default: true },
    },

    // Landing Page Section Content
    sections: {
      whyChooseUs: {
        title: { type: String, default: 'Why Choose {platformName}?' },
        subtitle: { type: String, default: 'We provide the best learning experience for SEE and +2 students across Nepal' },
      },
      // Add more sections as needed (hero, testimonials, etc.)
    },

    // This ensures only one settings document exists
    isActive: {
      type: Boolean,
      default: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

// Static method to get settings (creates default if none exists)
SettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne({ isActive: true });
  if (!settings) {
    settings = await this.create({ isActive: true });
  }
  return settings;
};

module.exports = mongoose.model('Settings', SettingsSchema);
