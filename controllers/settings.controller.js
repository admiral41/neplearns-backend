const Settings = require("../models/settings.model");
const httpStatus = require("http-status");
const { responseHandler } = require("../helpers/index");
const { sendErrorResponse, sendSuccessResponse } = responseHandler;
const fs = require('fs');
const path = require('path');

// ======================= GET SETTINGS =======================
exports.getSettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings();

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      data: settings,
      msg: "Settings retrieved successfully."
    });
  } catch (err) {
    console.error('Get settings error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to get settings.",
      err: err.message
    });
  }
};

// ======================= UPDATE GENERAL SETTINGS =======================
exports.updateGeneralSettings = async (req, res) => {
  try {
    const { platformName, tagline, description, logo } = req.body;

    const settings = await Settings.getSettings();

    if (platformName !== undefined) settings.platformName = platformName;
    if (tagline !== undefined) settings.tagline = tagline;
    if (description !== undefined) settings.description = description;
    if (logo !== undefined) settings.logo = logo;

    await settings.save();

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      data: settings,
      msg: "General settings updated successfully."
    });
  } catch (err) {
    console.error('Update general settings error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to update general settings.",
      err: err.message
    });
  }
};

// ======================= UPDATE CONTACT SETTINGS =======================
exports.updateContactSettings = async (req, res) => {
  try {
    const { contactEmail, supportEmail, phones, address, operatingHours, whatsapp, whatsappMessage } = req.body;

    const settings = await Settings.getSettings();

    if (contactEmail !== undefined) settings.contactEmail = contactEmail;
    if (supportEmail !== undefined) settings.supportEmail = supportEmail;
    if (phones !== undefined) settings.phones = phones;
    if (address !== undefined) settings.address = address;
    if (operatingHours !== undefined) settings.operatingHours = operatingHours;
    if (whatsapp !== undefined) settings.whatsapp = whatsapp;
    if (whatsappMessage !== undefined) settings.whatsappMessage = whatsappMessage;

    await settings.save();

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      data: settings,
      msg: "Contact settings updated successfully."
    });
  } catch (err) {
    console.error('Update contact settings error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to update contact settings.",
      err: err.message
    });
  }
};

// ======================= UPDATE SOCIAL LINKS =======================
exports.updateSocialLinks = async (req, res) => {
  try {
    const { facebook, instagram, twitter, linkedin, youtube } = req.body;

    const settings = await Settings.getSettings();

    if (facebook !== undefined) settings.socialLinks.facebook = facebook;
    if (instagram !== undefined) settings.socialLinks.instagram = instagram;
    if (twitter !== undefined) settings.socialLinks.twitter = twitter;
    if (linkedin !== undefined) settings.socialLinks.linkedin = linkedin;
    if (youtube !== undefined) settings.socialLinks.youtube = youtube;

    await settings.save();

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      data: settings,
      msg: "Social links updated successfully."
    });
  } catch (err) {
    console.error('Update social links error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to update social links.",
      err: err.message
    });
  }
};

// ======================= UPDATE FEATURE TOGGLES =======================
exports.updateFeatures = async (req, res) => {
  try {
    const { maintenanceMode, newRegistrations, instructorApplications, courseReviews, refundRequests } = req.body;

    const settings = await Settings.getSettings();

    if (maintenanceMode !== undefined) settings.features.maintenanceMode = maintenanceMode;
    if (newRegistrations !== undefined) settings.features.newRegistrations = newRegistrations;
    if (instructorApplications !== undefined) settings.features.instructorApplications = instructorApplications;
    if (courseReviews !== undefined) settings.features.courseReviews = courseReviews;
    if (refundRequests !== undefined) settings.features.refundRequests = refundRequests;

    await settings.save();

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      data: settings,
      msg: "Feature settings updated successfully."
    });
  } catch (err) {
    console.error('Update features error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to update feature settings.",
      err: err.message
    });
  }
};

// ======================= TOGGLE SINGLE FEATURE =======================
exports.toggleFeature = async (req, res) => {
  try {
    const { feature } = req.params;
    const validFeatures = ['maintenanceMode', 'newRegistrations', 'instructorApplications', 'courseReviews', 'refundRequests'];

    if (!validFeatures.includes(feature)) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: `Invalid feature. Must be one of: ${validFeatures.join(', ')}`
      });
    }

    const settings = await Settings.getSettings();
    settings.features[feature] = !settings.features[feature];
    await settings.save();

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      data: {
        feature,
        enabled: settings.features[feature]
      },
      msg: `${feature} ${settings.features[feature] ? 'enabled' : 'disabled'} successfully.`
    });
  } catch (err) {
    console.error('Toggle feature error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to toggle feature.",
      err: err.message
    });
  }
};

// ======================= UPDATE ALL SETTINGS =======================
exports.updateAllSettings = async (req, res) => {
  try {
    const {
      platformName,
      tagline,
      description,
      logo,
      contactEmail,
      supportEmail,
      phones,
      address,
      operatingHours,
      whatsapp,
      whatsappMessage,
      socialLinks,
      features
    } = req.body;

    const settings = await Settings.getSettings();

    // General settings
    if (platformName !== undefined) settings.platformName = platformName;
    if (tagline !== undefined) settings.tagline = tagline;
    if (description !== undefined) settings.description = description;
    if (logo !== undefined) settings.logo = logo;

    // Contact settings
    if (contactEmail !== undefined) settings.contactEmail = contactEmail;
    if (supportEmail !== undefined) settings.supportEmail = supportEmail;
    if (phones !== undefined) settings.phones = phones;
    if (address !== undefined) settings.address = address;
    if (operatingHours !== undefined) settings.operatingHours = operatingHours;
    if (whatsapp !== undefined) settings.whatsapp = whatsapp;
    if (whatsappMessage !== undefined) settings.whatsappMessage = whatsappMessage;

    // Social links
    if (socialLinks) {
      if (socialLinks.facebook !== undefined) settings.socialLinks.facebook = socialLinks.facebook;
      if (socialLinks.instagram !== undefined) settings.socialLinks.instagram = socialLinks.instagram;
      if (socialLinks.twitter !== undefined) settings.socialLinks.twitter = socialLinks.twitter;
      if (socialLinks.linkedin !== undefined) settings.socialLinks.linkedin = socialLinks.linkedin;
      if (socialLinks.youtube !== undefined) settings.socialLinks.youtube = socialLinks.youtube;
    }

    // Features
    if (features) {
      if (features.maintenanceMode !== undefined) settings.features.maintenanceMode = features.maintenanceMode;
      if (features.newRegistrations !== undefined) settings.features.newRegistrations = features.newRegistrations;
      if (features.instructorApplications !== undefined) settings.features.instructorApplications = features.instructorApplications;
      if (features.courseReviews !== undefined) settings.features.courseReviews = features.courseReviews;
      if (features.refundRequests !== undefined) settings.features.refundRequests = features.refundRequests;
    }

    await settings.save();

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      data: settings,
      msg: "All settings updated successfully."
    });
  } catch (err) {
    console.error('Update all settings error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to update settings.",
      err: err.message
    });
  }
};

// ======================= UPLOAD LOGO =======================
exports.uploadLogo = async (req, res) => {
  try {
    if (!req.file) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: "No logo file provided."
      });
    }

    const settings = await Settings.getSettings();

    // Delete old logo file if it exists
    if (settings.logo) {
      const oldLogoPath = path.join(__dirname, '..', settings.logo);
      if (fs.existsSync(oldLogoPath)) {
        fs.unlinkSync(oldLogoPath);
      }
    }

    // Save new logo path
    const logoPath = `/uploads/${req.file.filename}`;
    settings.logo = logoPath;
    await settings.save();

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      data: {
        logo: logoPath,
        settings: settings
      },
      msg: "Logo uploaded successfully."
    });
  } catch (err) {
    console.error('Upload logo error:', err);
    // Clean up uploaded file on error
    if (req.file) {
      const filePath = path.join(__dirname, '..', 'uploads', req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to upload logo.",
      err: err.message
    });
  }
};
