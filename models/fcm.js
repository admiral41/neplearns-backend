const mongoose = require("mongoose");

const FCMSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // a user can have multiple FCM tokens (multiple devices)
    fcm_token: {
      type: [String],
      default: [],
    },

    deviceInfo: {
      type: Object,
      required: false, 
      // Example structure:
      // {
      //   device: "iPhone 14",
      //   os: "iOS",
      //   appVersion: "1.2.0"
      // }
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("FCM", FCMSchema);
